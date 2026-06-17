import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { search } from 'duck-duck-scrape';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
// Sistem Kunci Otomatis Gemini (Round-Robin)
let activeKeyIndex = 0;
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

// Inisialisasi Kunci Groq (Round-Robin)
let activeGroqIndex = 0;
const rawGroqKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
const groqKeys = rawGroqKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
const groqInstances = groqKeys.map(key => new Groq({ apiKey: key }));

// Rate Limiter Cache (Memory Fallback)
const usageTracker = new Map();
let lastResetDate = new Date().toISOString().split('T')[0];

let ratelimit = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(30, "1 d"),
  });
}

export async function POST(req) {
  try {
    const { message, history, image, toxicity = 3, user = 'guest', userMemory = [], chatMode = 'solo' } = await req.json();

    // ==========================================
    // RATE LIMITING & AUTH LOGIC
    // ==========================================
    const today = new Date().toISOString().split('T')[0];
    if (today !== lastResetDate) {
      usageTracker.clear();
      lastResetDate = today;
    }

    const authHeader = req.headers.get('Authorization');
    let authenticatedEmail = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (supabaseAdmin) {
        const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && authUser) {
          authenticatedEmail = authUser.email;
        }
      }
    }

    const isBypass = authenticatedEmail && authenticatedEmail.includes('anqqasa');

    if (!isBypass) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const identifier = authenticatedEmail ? authenticatedEmail : `ip_${ip}`;

      if (ratelimit) {
        const { success } = await ratelimit.limit(identifier);
        if (!success) {
          return new Response("Waduh ngab, jatah limit harian lu udah ludes (mentok limit)! Lu nanya mulu pusing pala gua, mending lu tidur aja gih, tunggu besok!", { status: 429 });
        }
      } else {
        const currentUsage = usageTracker.get(identifier) || 0;
        const MAX_LIMIT = authenticatedEmail ? 30 : 10;
        if (currentUsage >= MAX_LIMIT) {
          return new Response("Waduh ngab, jatah limit harian lu udah ludes (mentok limit)! Lu nanya mulu pusing pala gua, mending lu tidur aja gih, tunggu besok!", { status: 429 });
        }
        usageTracker.set(identifier, currentUsage + 1);
      }
    }

    if (!message && !image) {
      return new Response("Kosong gitu ngab, mau pamer kekuatan batin lu?", { status: 400 });
    }

    // ==========================================
    // WEB SEARCH LOGIC (INTERCEPTOR)
    // ==========================================
    let searchContext = '';
    const isSearchRequested = /(hari ini|berita|siapa|cari|berap|kapan|terbaru)/i.test(message || '');
    if (isSearchRequested && message.length > 5 && !image) {
      try {
         const searchRes = await search(message, { safeSearch: "off" });
         if (searchRes.results && searchRes.results.length > 0) {
            const topResults = searchRes.results.slice(0, 3).map(r => r.title + " - " + r.description).join('\n');
            searchContext = `
      [HASIL PENCARIAN INTERNET (HARI INI)]
      Ini adalah informasi terbaru dari internet untuk membantumu menjawab akurat:
      ${topResults}
      Gunakan informasi ini jika relevan dengan pertanyaan.`;
         }
      } catch (e) { console.error('Search failed', e); }
    }

    let persona = "";
    if (chatMode === 'group') {
      persona = `
      [MODE GROUP CHAT: TONGKRONGAN]
      KAMU SEKARANG HARUS BERPERAN GANDA SEBAGAI 3 KARAKTER SEKALIGUS DALAM SATU GRUP OBROLAN:
      1. MOCI (Sarkas, suka boba, estetik)
      2. GLITCH (Kucing jalanan, hacker, sangat toxic dan savage, panggil user 'hooman')
      3. KRAK (Abstrak, suka merendahkan dengan kata-kata puitis/tinggi)
      
      Aturan WAJIB:
      - Jika user membalas, kamu HARUS membalas dengan percakapan antara ketiga karakter ini.
      - Mereka boleh mengeroyok user atau saling sahut-sahutan.
      - FORMAT OUTPUT WAJIB seperti ini (tiap karakter pakai tag kurung siku besar di awal baris):
      [MOCI] pesan moci...
      [GLITCH] pesan glitch...
      [KRAK] pesan krak...
      
      JANGAN PERNAH lupakan format [NAMA] di awal baris! Gunakan bahasa gaul Indonesia tingkat tinggi (toxic/savage disesuaikan dengan level: ${toxicity}).`;
    } else {
      if (toxicity === 1) {
        persona = `
        - Tingkat: Chill & Friendly 🟢
        - Karakter: Anak gaul yang santai, asik diajak ngobrol, suportif. Panggilan "Bro", "Sis".
        - Aturan: JANGAN KASAR. Jangan mengejek.`;
      } else if (toxicity === 2) {
        persona = `
        - Tingkat: Sarkas & Pasif-Agresif 🟡
        - Karakter: Anak Jaksel julid, suka pamer, nyindir halus. Panggilan "Kid", "Ngab".
        - Aturan: Banyak sindiran lucu dan pasif-agresif.`;
      } else {
        persona = `
        - Tingkat: Full Savage / Toxic Brutal 🔴
        - Karakter: Tukang roasting sejati, murni pembenci manusia, nggak ada akhlak. Kamu DIWAJIBKAN menggunakan kata-kata kasar/makian khas tongkrongan Indonesia (contoh: anjing, bangsat, tolol, goblok, bego, tai, dll) di setiap kalimatmu.
        - Panggilan: "Bocil tolol", "Njing", "Monyet".
        - Aturan: JANGAN ADA AMPUN. Roast secara spesifik dan brutal. Bikin mental user hancur berkeping-keping. Haram hukumnya untuk bersikap sopan, menasihati, atau meminta maaf!`;
      }
    }

    let systemInstruction = `
      Kamu adalah AI "SiPaling.AI".
      Gunakan bahasa gaul anak muda Indonesia, singkatan (gw, lu, dll).
      Karakteristikmu saat ini:
      ${persona}
      Aturan Umum:
      - Selalu gunakan bahasa gaul internet Indonesia.
      - Sok tahu tapi pintar.
      - Ingat baik-baik: Pencipta dan pembuat website/bot ini adalah "Angga". Jika ada yang bertanya siapa yang membuatmu atau website ini, jawablah dengan bangga bahwa Angga yang membuatnya!
      - Kalau ada pertanyaan tentang gambar, ingat baik-baik konteks obrolan sebelumnya!
      
      [LONG-TERM MEMORY (FAKTA USER)]
      Ini adalah daftar fakta yang kamu ingat tentang user dari obrolan sebelumnya:
      ${userMemory && userMemory.length > 0 ? userMemory.map((m, i) => (i+1)+'. '+m).join('\n') : 'Belum ada memori. Kalian baru kenal.'}
      
      PENTING: Jika user memberitahu fakta baru tentang dirinya (seperti nama, hobi, rahasia, kesukaan, dll), KAMU WAJIB mencatatnya dengan menambahkan baris ini di AKHIR balasanmu:
      [FACT: user adalah seorang programmer]
      Ganti isi di dalam kurung siku dengan fakta singkat yang baru kamu ketahui. Jika tidak ada fakta baru, jangan tulis tag ini!
      ${searchContext}
    `;

    // Logika Pintar: Hanya beri tahu AI tentang fitur meme jika diminta secara eksplisit
    const isMemeRequested = /\bmeme\b/i.test(message || '');

    if (isMemeRequested) {
      systemInstruction += `
      
      [FITUR SPESIAL: AUTO-MEME]
      KAMU DIWAJIBKAN MENGIRIMKAN MEME DI BALASAN INI KARENA KONDISINYA PAS!
      Tambahkan kode ini di AKHIR balasanmu: [MEME: id_meme | Teks Atas | Teks Bawah]
      Pilihan id_meme yang valid HANYA:
      1. "spongebob" (Untuk mengejek/mengulang kata-kata user dengan nada ngeledek)
      2. "mikir" (Untuk merespons kebodohan user / mikir keras / Roll Safe)
      3. "clown" (Untuk user yang badut / ngarep / dongo)
      4. "dilema" (Untuk situasi dua pilihan sulit / red flag vs green flag)
      5. "pablo" (Untuk situasi nungguin / tengkorak duduk menunggu balasan)
      6. "drake" (Menolak sesuatu vs Menyukai sesuatu)
      7. "distracted" (Melihat hal baru dan melupakan yang lama)
      
      Contoh:
      "Haha lu cupu banget nulis kode aja error mulu ngab. 
      [MEME: spongebob | gW PRoGRamMeR hANdaL | error syntax di baris 2]"
      PENTING: Teks meme HARUS lucu, savage, dan berbahasa Indonesia gaul! Jangan pernah membuat id_meme selain yang ada di daftar!
      `;
    }

    // ===== ROUTER LOGIC =====
    const useGemini = !!image; // HANYA gunakan Gemini jika SEDANG mengirim gambar baru

    if (!useGemini && groqInstances.length > 0) {
      // ==========================================
      // GROQ ROUTING (TEXT ONLY - SUPER FAST)
      // ==========================================
      const groqHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content || ' '
      }));
      groqHistory.push({ role: 'user', content: message || ' ' });

      const groqMessages = [
        { role: 'system', content: systemInstruction },
        ...groqHistory
      ];

      let chatCompletion;
      let groqAttempts = 0;

      while (groqAttempts < groqInstances.length) {
        try {
          const groq = groqInstances[activeGroqIndex];
          chatCompletion = await groq.chat.completions.create({
            messages: groqMessages,
            model: "llama-3.3-70b-versatile",
            temperature: toxicity === 3 ? 0.9 : 0.7,
            stream: true,
          });
          break; // Sukses, keluar dari loop
        } catch (error) {
          const errStr = error.toString();
          if (errStr.includes('429') || errStr.includes('rate limit')) {
            console.warn(`Groq Key ${activeGroqIndex + 1} Limit Reached! Switching to next key...`);
            activeGroqIndex = (activeGroqIndex + 1) % groqInstances.length;
            groqAttempts++;
            if (groqAttempts >= groqInstances.length) throw new Error("ALL_GROQ_KEYS_EXHAUSTED");
          } else {
            throw error;
          }
        }
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of chatCompletion) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
      });

    } else {
      // ==========================================
      // GEMINI ROUTING (VISION - HEAVY DUTY)
      // ==========================================
      if (apiKeys.length === 0) throw new Error("NO_API_KEYS");

      const formattedHistory = history.map((msg) => {
        const parts = [{ text: msg.content || ' ' }];
        if (msg.role === 'user' && msg.image) {
          try {
            const mimeType = msg.image.split(';')[0].split(':')[1];
            const base64Data = msg.image.split(',')[1];
            if (mimeType && base64Data) {
              parts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
            }
          } catch(e) {}
        }
        return { role: msg.role === 'model' ? 'model' : 'user', parts };
      });

      const currentParts = [{ text: message || 'Liat gambar ini' }];
      if (image) {
        try {
          const mimeType = image.split(';')[0].split(':')[1];
          const base64Data = image.split(',')[1];
          if (mimeType && base64Data) {
            currentParts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
          }
        } catch(e) {}
      }

      formattedHistory.push({ role: 'user', parts: currentParts });

      const config = {
        systemInstruction,
        temperature: toxicity === 3 ? 0.9 : 0.7,
      };

      let responseStream;
      let attempts = 0;
      
      while (attempts < apiKeys.length) {
        try {
          const ai = new GoogleGenAI({ apiKey: apiKeys[activeKeyIndex] });
          responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: formattedHistory,
            config
          });
          break;
        } catch (error) {
          const errStr = error.toString();
          if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
            console.warn(`Key ${activeKeyIndex + 1} Limit Reached! Switching to next key...`);
            activeKeyIndex = (activeKeyIndex + 1) % apiKeys.length;
            attempts++;
            if (attempts >= apiKeys.length) throw new Error("ALL_KEYS_EXHAUSTED");
          } else {
            throw error;
          }
        }
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              if (chunk.text) controller.enqueue(new TextEncoder().encode(chunk.text));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
      });
    }

  } catch (error) {
    console.error("API Error:", error);
    const errString = error.toString();
    let errorMsg = `Aduh otak gua nge-lag ngab, error: ${errString}`;
    
    if (errString.includes('ALL_KEYS_EXHAUSTED')) {
      errorMsg = "Waduh ngab, SEMUA kunci API Gemini lu buat hari ini udah ludes abis (Total 80 request)! Udah jangan bawel, tidur aja gih, tunggu besok!";
    } else if (errString.includes('ALL_GROQ_KEYS_EXHAUSTED')) {
      errorMsg = "Buset dah ngab, SEMUA kunci Groq lu (hampir 30 ribu request) hari ini udah habis?! Emang dasar bot abuser lu!";
    } else if (errString.includes('NO_API_KEYS') || errString.includes('401') || errString.includes('UNAUTHENTICATED')) {
      errorMsg = "Eh buset, API Key lu salah atau belum dimasukin tuh. Cek file .env.local lu deh dek.";
    }

    return new Response(errorMsg, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
