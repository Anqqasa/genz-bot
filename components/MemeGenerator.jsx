'use client';

import { useState, useEffect, useRef } from 'react';
import { X, RefreshCcw, Download, Send } from 'lucide-react';

export default function MemeGenerator({ onClose, onSendMeme }) {
  const [memes, setMemes] = useState([]);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [topText, setTopText] = useState('TOP TEXT');
  const [bottomText, setBottomText] = useState('BOTTOM TEXT');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef(null);

  // Fetch templates dari Imgflip
  useEffect(() => {
    fetch('https://api.imgflip.com/get_memes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMemes(data.data.memes);
          setSelectedMeme(data.data.memes[Math.floor(Math.random() * 10)]); // Pilih random top 10
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal load meme", err);
        setIsLoading(false);
      });
  }, []);

  // Gambar ulang canvas tiap ada perubahan
  useEffect(() => {
    if (selectedMeme && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous"; // Biar ga kena CORS saat toDataURL
      img.src = selectedMeme.url;
      
      img.onload = () => {
        // Skala canvas max width 500 biar ga kegedean
        const MAX_WIDTH = 500;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;

        // Gambar background
        ctx.drawImage(img, 0, 0, width, height);

        // Styling Teks Meme Standar (Impact Font, Putih, Outline Hitam)
        ctx.font = `bold ${width / 10}px Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = width / 150; // Ketebalan outline

        // Tulis Top Text
        ctx.textBaseline = 'top';
        ctx.strokeText(topText.toUpperCase(), width / 2, 10);
        ctx.fillText(topText.toUpperCase(), width / 2, 10);

        // Tulis Bottom Text
        ctx.textBaseline = 'bottom';
        ctx.strokeText(bottomText.toUpperCase(), width / 2, height - 10);
        ctx.fillText(bottomText.toUpperCase(), width / 2, height - 10);
      };
    }
  }, [selectedMeme, topText, bottomText]);

  const handleRandomMeme = () => {
    if (memes.length > 0) {
      setSelectedMeme(memes[Math.floor(Math.random() * memes.length)]);
    }
  };

  const generateAndSend = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      onSendMeme(dataUrl); // Kirim ke chat input
      onClose();
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `meme-${Date.now()}.jpg`;
      link.href = canvasRef.current.toDataURL('image/jpeg', 0.8);
      link.click();
    }
  };

  return (
    <div className="mood-modal-overlay" style={{zIndex: 1000}}>
      <div className="mood-modal-content" style={{maxWidth: '600px', width: '90%'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2 style={{margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            😂 Meme Generator
          </h2>
          <button onClick={onClose} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem'}}>
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div style={{textAlign: 'center', padding: '2rem'}}>Loading Template...</div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'center', background: '#000', borderRadius: '8px', padding: '1rem', overflow: 'hidden'}}>
              <canvas ref={canvasRef} style={{maxWidth: '100%', height: 'auto', borderRadius: '4px'}}></canvas>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <input 
                type="text" 
                value={topText} 
                onChange={(e) => setTopText(e.target.value)} 
                className="chat-input" 
                placeholder="Teks Atas"
                style={{width: '100%'}}
              />
              <input 
                type="text" 
                value={bottomText} 
                onChange={(e) => setBottomText(e.target.value)} 
                className="chat-input" 
                placeholder="Teks Bawah"
                style={{width: '100%'}}
              />
            </div>

            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem'}}>
              <button onClick={handleRandomMeme} className="play-audio-btn" style={{flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)'}}>
                <RefreshCcw size={16} /> Ganti Template
              </button>
              <button onClick={handleDownload} className="play-audio-btn" style={{flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)'}}>
                <Download size={16} /> Save
              </button>
              <button onClick={generateAndSend} className="play-audio-btn" style={{flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'var(--neon-cyan)', color: 'black', fontWeight: 'bold'}}>
                <Send size={16} /> Kirim ke Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
