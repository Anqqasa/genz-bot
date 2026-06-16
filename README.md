# SiPaling.AI (GenZ Bot)

Aplikasi Chatbot AI bergaya bahasa anak Gen-Z (Savage & Chill). Dibangun dengan arsitektur **Next.js App Router** modern yang sudah direfactor menjadi komponen-komponen terstruktur.

## ✨ Fitur Utama
- **3 Level Toxicity:** Pilihan vibe AI dari yang sopan (Chill) sampai yang kejam (Savage).
- **Meme Generator (Client-Side):** Buat meme langsung dari template gratis tanpa memakan limit API AI Anda.
- **Text-to-Speech & Speech-to-Text:** Ngobrol langsung lewat suara.
- **Cloud Sync (Supabase):** Simpan riwayat chat ke database awan agar bisa diakses kapan saja.

## 🚀 Cara Menjalankan (Local Setup)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment Variables:**
   - Salin file `.env.example` menjadi `.env.local`
   - Isi dengan API Key Groq dan kredensial Supabase Anda.
   ```bash
   cp .env.example .env.local
   ```

3. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```

4. **Buka di Browser:**
   Buka [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Folder
- `app/`: Routing utama aplikasi (termasuk Next.js `loading.js` dan `error.js`).
- `components/`: Kumpulan komponen UI yang *reusable* (ChatBubble, MemeGenerator, dll).
- `context/`: `AppContext.jsx` untuk *state management* global (Data User, Sesi Chat).
- `lib/`: Konfigurasi layanan eksternal (Supabase).
- `api/`: Endpoint backend Next.js untuk Chat & TTS.
