'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import './page.css';

const DEFAULT_MESSAGE = { 
  role: 'model', 
  content: 'Sup? Gua AI lu yang paling skibidi. Ada yang mau ditanya atau mau adu mekanik aja?' 
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  // Fitur Baru State
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toxicity, setToxicity] = useState(3);
  const [selectedImage, setSelectedImage] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  
  const messagesAreaRef = useRef(null);
  const shouldSpeakRef = useRef(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Initialize Data
  useEffect(() => {
    const saved = localStorage.getItem('genz-bot-sessions');
    const oldSaved = localStorage.getItem('genz-bot-chat');
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setSessions(parsed);
        setActiveSessionId(parsed[0].id);
        setMessages(parsed[0].messages);
      } else {
        createNewSession();
      }
    } else if (oldSaved) {
      // Migrasi data lama
      const parsedOld = JSON.parse(oldSaved);
      const newSession = { id: Date.now().toString(), title: 'Chat Lama', messages: parsedOld };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      setMessages(parsedOld);
      localStorage.removeItem('genz-bot-chat');
    } else {
      createNewSession();
    }
    
    setIsInitialized(true);
    
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // Sinkronisasi messages ke active session
  useEffect(() => {
    if (!isInitialized || !activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        // Ganti judul otomatis berdasarkan pesan pertama user
        let newTitle = s.title;
        if (s.title.startsWith('Chat ')) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            const text = firstUserMsg.content || 'Gambar';
            newTitle = text.substring(0, 22) + (text.length > 22 ? '...' : '');
          }
        }
        return { ...s, messages, title: newTitle };
      }
      return s;
    }));
    scrollToBottom();
  }, [messages, activeSessionId, isInitialized]);

  // Simpan sessions ke LocalStorage setiap ada perubahan
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('genz-bot-sessions', JSON.stringify(sessions));
  }, [sessions, isInitialized]);

  // Efek Timer Cooldown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession = { id: newId, title: `Chat ${new Date().toLocaleTimeString()}`, messages: [DEFAULT_MESSAGE] };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([DEFAULT_MESSAGE]);
    setIsSidebarOpen(false);
  };

  const loadSession = (id) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert("Gabisa hapus chat terakhir ngab!");
      return;
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[0].id);
      setMessages(newSessions[0].messages);
    }
  };

  const scrollToBottom = () => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTo({ top: messagesAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Kompresi gambar dengan Canvas agar ukurannya tidak terlalu besar
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Ubah ke JPEG kualitas 70% agar base64 string-nya kecil
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setSelectedImage(compressedBase64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const captureScreenshot = async (e, msgIndex) => {
    e.target.innerText = '📸 Loading...';
    const chatElement = document.getElementById(`msg-wrap-${msgIndex}`);
    if (chatElement) {
      try {
        const canvas = await html2canvas(chatElement, {
          backgroundColor: '#030305',
          scale: 2
        });
        const link = document.createElement('a');
        link.download = `genz-roast-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        alert("Gagal ngambil screenshot ngab.");
      }
    }
    e.target.innerText = '📸 Share';
  };

  const speakText = (text, msgIndex) => {
    // Jika tombol yang sama ditekan lagi saat sedang bicara -> STOP!
    if (playingIndex === msgIndex && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setPlayingIndex(null);
      return;
    }

    // Hentikan audio yang sedang berjalan jika tombol pesan lain ditekan
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setPlayingIndex(msgIndex);

    // Bersihkan teks dari Markdown
    const cleanText = text.replace(/[*#_`~]/g, '').trim();
    if (!cleanText) {
      setPlayingIndex(null);
      return;
    }

    // Pemecah Teks (Chunking) maks 180 karakter per potong
    const words = cleanText.split(' ');
    const chunks = [];
    let currentChunk = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if ((currentChunk + ' ' + word).length > 180) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    let currentChunkIndex = 0;

    const playNext = () => {
      // Cek apakah index masih sama (artinya belum di-stop user)
      if (playingIndex !== null && playingIndex !== msgIndex) return;

      if (currentChunkIndex >= chunks.length) {
        currentAudioRef.current = null;
        setPlayingIndex(null);
        return; // Selesai
      }
      
      const chunk = chunks[currentChunkIndex];
      // URL Proxy Lokal (Backend kita yang akan mengambilkan MP3 dari Google)
      const url = `/api/tts?text=${encodeURIComponent(chunk)}`;
      
      const audio = new Audio(url);
      audio.playbackRate = 1.3; // Mempercepat tempo suara
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        currentChunkIndex++;
        playNext();
      };
      
      audio.onerror = () => {
        currentChunkIndex++;
        playNext();
      };

      audio.play().catch(e => {
        console.error("Browser memblokir autoplay audio:", e);
      });
    };

    playNext();
  };

  const startListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser lu ga support fitur mic dek. Pake Chrome atau Edge aja.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      shouldSpeakRef.current = true;
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') alert("Akses mic ditolak!");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg = input.trim();
    const imageData = selectedImage;
    setInput('');
    setSelectedImage(null);
    
    const newUserMessage = { role: 'user', content: userMsg, image: imageData };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'model', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages, image: imageData, toxicity }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: errorText };
          return updated;
        });
        setIsLoading(false);
        if (errorText.includes('MENIT') || errorText.includes('kecepetan')) {
          setCooldown(35); // Set 35 detik sesuai permintaan API Google
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        botResponse += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = botResponse;
          return newMsgs;
        });
      }
      
      if (shouldSpeakRef.current) speakText(botResponse);
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'model', content: 'Yah, koneksi lu bapuk nih kayaknya.' };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) return null;

  return (
    <div className="app-layout">
      {/* Sidebar Overlay untuk Mobile */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Riwayat Chat</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar">✖</button>
        </div>
        <button onClick={createNewSession} className="new-chat-btn">➕ Chat Baru</button>
        <div className="session-list">
          {sessions.map(s => (
            <div 
              key={s.id} 
              className={`session-item ${s.id === activeSessionId ? 'active' : ''}`}
              onClick={() => loadSession(s.id)}
            >
              <span>{s.title}</span>
              <button onClick={(e) => deleteSession(s.id, e)} className="delete-session" title="Hapus">🗑️</button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="chat-container">
        <header className="chat-header">
          <button onClick={() => setIsSidebarOpen(true)} className="menu-btn">☰</button>
          <div className="header-info">
            <div className="avatar">🤖</div>
            <div>
              <h1 className="bot-name">Si Paling Bot</h1>
              <span className="status"><span className="status-dot"></span> Online and Ready to Roast</span>
            </div>
          </div>
          
          <div className="toxicity-control">
            <label>Mood: {toxicity === 1 ? '🟢 Chill' : toxicity === 2 ? '🟡 Sarkas' : '🔴 Savage'}</label>
            <input 
              type="range" min="1" max="3" 
              value={toxicity} 
              onChange={(e) => setToxicity(parseInt(e.target.value))}
              className="toxicity-slider"
            />
          </div>
        </header>

        <div className="messages-area" ref={messagesAreaRef}>
          {messages.map((msg, index) => (
            <div key={index} id={`msg-wrap-${index}`} className={`message-wrapper ${msg.role}`}>
              {msg.role === 'model' && <div className="msg-avatar">🤖</div>}
              <div className={`message ${msg.role}`}>
                {msg.image && <img src={msg.image} alt="User Upload" className="uploaded-image" />}
                {msg.role === 'model' ? (
                  <>
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || '...'}</ReactMarkdown>
                    </div>
                    <div className="msg-actions">
                      <button onClick={() => speakText(msg.content, index)} className="play-audio-btn">
                        {playingIndex === index ? '⏹️ Stop' : '🔊 Dengarkan'}
                      </button>
                      <button onClick={(e) => captureScreenshot(e, index)} className="play-audio-btn">📸 Share</button>
                    </div>
                  </>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && <div className="msg-avatar">👤</div>}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <div className="message-wrapper model">
              <div className="msg-avatar">🤖</div>
              <div className="message model loading-indicator">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="image-preview">
            <img src={selectedImage} alt="Preview" />
            <button onClick={() => setSelectedImage(null)} className="clear-img-btn">✖</button>
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
          <button type="button" onClick={() => fileInputRef.current.click()} className="mic-btn attach-btn" title="Kirim Foto" disabled={isLoading || cooldown > 0}>📎</button>
          <button
            type="button"
            onClick={startListening}
            className={`mic-btn ${isListening ? 'recording' : ''}`}
            title="Bicara pake Mic"
            disabled={isLoading || cooldown > 0}
          >
            {isListening ? '🔴' : '🎤'}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); shouldSpeakRef.current = false; }}
            placeholder={cooldown > 0 ? `Sabar dek, tunggu ${cooldown} detik...` : "Ketik pesen lu di sini dek..."}
            className="chat-input"
            disabled={isLoading || cooldown > 0}
          />
          <button type="submit" className="send-btn" disabled={(!input.trim() && !selectedImage) || isLoading || cooldown > 0}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}
