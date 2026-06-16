import Groq from 'groq-sdk';

const rawGroqKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
const groqKeys = rawGroqKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
const groqInstances = groqKeys.map(key => new Groq({ apiKey: key }));
let activeGroqIndex = 0;

export async function POST(req) {
  try {
    const { history } = await req.json();
    if (!history || history.length < 2) return new Response("Chat Baru", { status: 200 });

    // Ambil 4 pesan terakhir untuk konteks judul
    const recentHistory = history.slice(0, 4).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
    
    const prompt = `Buatkan 1 judul super singkat (maksimal 4 kata) yang merangkum inti dari percakapan berikut. HANYA BERIKAN JUDULNYA SAJA TANPA KATA PENGANTAR ATAU TANDA KUTIP. Judul harus gaul/lucu menyesuaikan gaya bahasa percakapan.\n\nPercakapan:\n${recentHistory}`;
    
    if (groqInstances.length === 0) {
      return new Response("Chat Baru", { status: 200 });
    }

    let title = "Chat Baru";
    let attempts = 0;
    while (attempts < groqInstances.length) {
      try {
        const groq = groqInstances[activeGroqIndex];
        const res = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
        });
        title = res.choices[0]?.message?.content || "Chat Baru";
        break;
      } catch (e) {
        activeGroqIndex = (activeGroqIndex + 1) % groqInstances.length;
        attempts++;
      }
    }
    
    // Bersihkan judul dari tanda kutip
    title = title.replace(/['"]/g, '').trim();
    if (title.length > 30) title = title.substring(0, 30) + '...';

    return new Response(title, { status: 200 });
  } catch (error) {
    return new Response("Chat Baru", { status: 200 });
  }
}
