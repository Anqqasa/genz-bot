'use client';
import Link from 'next/link';
import Mascot from '../components/Mascot';
import './landing.css';
import { Sparkles, MessageSquare, Flame, Cpu } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <div className="landing-grid-bg"></div>
      
      <nav className="landing-nav">
        <div className="logo-area">
          <Mascot size={40} toxicity={3} character="moci" />
          <span className="logo-text">SiPaling.AI</span>
        </div>
      </nav>

      <main className="landing-main">
        <div className="hero-section">
          <div className="badge">✨ Bukan AI Biasa</div>
          <h1 className="hero-title">
            Siap-Siap Kena Mental <br/> <span className="gradient-text">Breakdance</span>
          </h1>
          <p className="hero-subtitle">
            Chatbot dengan bahasa gaul Indonesia yang nggak ada filter. Fitur roasting brutal, mode tongkrongan 3 AI, dan generator meme otomatis!
          </p>
          <div className="cta-area">
            <Link href="/chat" className="cta-button primary">
              <Flame size={20}/> Mulai Uji Nyali
            </Link>
            <a href="#features" className="cta-button secondary">
              Lihat Fitur
            </a>
          </div>
        </div>

        <div className="mascot-showcase">
          <div className="mascot-float moci-float"><Mascot size={180} toxicity={3} character="moci" /></div>
          <div className="mascot-float glitch-float"><Mascot size={140} toxicity={3} character="glitch" /></div>
          <div className="mascot-float krak-float"><Mascot size={120} toxicity={3} character="krak" /></div>
        </div>
      </main>

      <section id="features" className="features-section">
        <h2 className="section-title">Fitur Andalan</h2>
        <div className="features-grid">
          <div className="feature-card glass">
            <div className="feature-icon"><MessageSquare size={32}/></div>
            <h3>Mode Tongkrongan</h3>
            <p>Dikeroyok 3 AI (Moci, Glitch, Krak) sekaligus dalam satu grup. Siap-siap disahutin pakai bacotan beruntun!</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon"><Sparkles size={32}/></div>
            <h3>Auto-Meme Generator</h3>
            <p>AI ini ngerti konteks dan bisa balas chat lu pake meme visual secara otomatis. Nggak cuma teks doang!</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon"><Cpu size={32}/></div>
            <h3>Long-term Memory</h3>
            <p>Dia inget aib lu. Fakta-fakta tentang lu bakal disimpan dan dipakai buat nge-roast lu di chat berikutnya.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} SiPaling.AI - Dibuat untuk Gen-Z yang mentalnya aman.</p>
      </footer>
    </div>
  );
}
