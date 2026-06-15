import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

// Sistem Kunci Otomatis Gemini (Round-Robin)
let activeKeyIndex = 0;
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

// Inisialisasi Kunci Groq (Round-Robin)
let activeGroqIndex = 0;
const rawGroqKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
const groqKeys = rawGroqKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
const groqInstances = groqKeys.map(key => new Groq({ apiKey: key }));

export async function POST(req) {
  try {
    const { message, history, image, toxicity = 3 } = await req.json();

    if (!message && !image) {
      return new Response("Kosong gitu ngab, mau pamer kekuatan batin lu?", { status: 400 });
    }

    let persona = "";
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
    `;

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
