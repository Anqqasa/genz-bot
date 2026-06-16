'use client';

import { useEffect, useRef, useState } from 'react';

const MEME_MAP = {
  'spongebob': '102156234', // Mocking Spongebob
  'mikir': '89370399',      // Roll Safe / Think About It
  'clown': '195515965',     // Putting on Clown Makeup
  'dilema': '87743020',     // Two Buttons
  'pablo': '101910402',     // Sad Pablo Escobar
  'drake': '181913649',     // Drake Hotline Bling
  'distracted': '112126428' // Distracted Boyfriend
};

export default function AutoMeme({ memeId, topText, bottomText }) {
  const canvasRef = useRef(null);
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    const realId = MEME_MAP[memeId] || MEME_MAP['spongebob']; // Fallback
    const url = `https://i.imgflip.com/${realId}.jpg`;
    
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      
      img.onload = () => {
        const MAX_WIDTH = 400;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        ctx.font = `bold ${width / 10}px Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = width / 150;

        // Teks Atas
        if (topText && topText.trim() !== '') {
          ctx.textBaseline = 'top';
          ctx.strokeText(topText.toUpperCase(), width / 2, 10);
          ctx.fillText(topText.toUpperCase(), width / 2, 10);
        }

        // Teks Bawah
        if (bottomText && bottomText.trim() !== '') {
          ctx.textBaseline = 'bottom';
          ctx.strokeText(bottomText.toUpperCase(), width / 2, height - 10);
          ctx.fillText(bottomText.toUpperCase(), width / 2, height - 10);
        }

        setImgUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
    }
  }, [memeId, topText, bottomText]);

  if (!imgUrl) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', margin: '1rem 0'}}>
        {/* Hidden canvas untuk proses render */}
        <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
        <div style={{padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-secondary)'}}>
          Memproses Meme...
        </div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', margin: '1rem 0'}}>
      <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
      <img src={imgUrl} alt="AI Generated Meme" style={{maxWidth: '100%', borderRadius: '8px', border: '2px solid var(--neon-cyan)'}} />
    </div>
  );
}
