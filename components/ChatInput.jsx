'use client';

import { useRef, useEffect } from 'react';
import { Paperclip, Mic, Send, Image as ImageIcon, X } from 'lucide-react';

export default function ChatInput({ 
  input, setInput, 
  isLoading, 
  isListening, 
  cooldown, 
  selectedImage, setSelectedImage, 
  onSendMessage, 
  onStartListening,
  onOpenMemeGenerator
}) {
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (!isLoading && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isLoading]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          setSelectedImage(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <>
      {selectedImage && (
        <div className="image-preview">
          <img src={selectedImage} alt="Preview" />
          <button onClick={() => setSelectedImage(null)} className="clear-img-btn"><X size={16} /></button>
        </div>
      )}

      <form className="input-area" onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          style={{display: 'none'}} 
          disabled={cooldown > 0}
        />
        
        <button type="button" onClick={() => fileInputRef.current.click()} className="mic-btn attach-btn" title="Kirim Foto" disabled={isLoading || cooldown > 0} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Paperclip size={20} />
        </button>

        <button
          type="button"
          onClick={onStartListening}
          className={`mic-btn ${isListening ? 'recording' : ''}`}
          title="Bicara pake Mic"
          disabled={isLoading || cooldown > 0}
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
        >
          {isListening ? <Mic size={20} color="white" /> : <Mic size={20} />}
        </button>
        
        <input
          type="text"
          ref={chatInputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={cooldown > 0 ? `Sabar dek, tunggu ${cooldown} detik...` : "Ketik pesen lu di sini dek..."}
          className="chat-input"
          disabled={isLoading || cooldown > 0}
        />
        
        <button type="submit" className="send-btn" disabled={(!input.trim() && !selectedImage) || isLoading || cooldown > 0} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Send size={20} />
        </button>
      </form>
    </>
  );
}
