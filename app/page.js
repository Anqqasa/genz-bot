'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Volume2, Square, Share2, RefreshCw, Pencil, Trash2, Cloud, Paperclip, Mic, Menu, X, PlusCircle, Send, LogOut } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
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
  const [toxicity, setToxicity] = useState(2); // Default Sarkas
  const [selectedImage, setSelectedImage] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  
  // Auth & Cloud State
  const [authUser, setAuthUser] = useState(null);
  const [hasSelectedMood, setHasSelectedMood] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const messagesAreaRef = useRef(null);
  const shouldSpeakRef = useRef(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Cek Auth Supabase
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize Data (Cloud atau Local)
  useEffect(() => {
    const loadData = async () => {
      let loadedSessions = [];
      
      if (authUser) {
        try {
          const { data, error } = await supabase.from('cloud_saves').select('sessions_data').eq('user_id', authUser.id).single();
          if (data && data.sessions_data) {
            loadedSessions = data.sessions_data;
          } else {
            // Migrasi dari local ke cloud jika belum ada
            const localSaved = localStorage.getItem('genz-bot-sessions');
            if (localSaved) {
              loadedSessions = JSON.parse(localSaved);
              await supabase.from('cloud_saves').upsert({ user_id: authUser.id, sessions_data: loadedSessions });
            }
          }
        } catch (e) { console.error('Gagal memuat data cloud', e); }
      } else {
        const saved = localStorage.getItem('genz-bot-sessions');
        if (saved) loadedSessions = JSON.parse(saved);
      }
      
      if (loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setActiveSessionId(loadedSessions[0].id);
        setMessages(loadedSessions[0].messages);
      } else {
        createNewSession();
      }
      
      setIsInitialized(true);
      setIsInitialLoad(false);
    };
    
    if (isInitialized) {
      loadData();
    } else {
      loadData();
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      }
    }
  }, [authUser]);

  // Sinkronisasi messages ke active session
  useEffect(() => {
    if (!isInitialized || !activeSessionId || isInitialLoad) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
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

  // Simpan sessions ke Cloud atau LocalStorage setiap ada perubahan
  useEffect(() => {
    if (!isInitialized || isInitialLoad) return;
    
    if (authUser) {
      supabase.from('cloud_saves').upsert({ user_id: authUser.id, sessions_data: sessions })
        .then(({error}) => { if(error) console.error("Gagal sync ke cloud", error); });
    } else {
      localStorage.setItem('genz-bot-sessions', JSON.stringify(sessions));
    }
  }, [sessions, isInitialLoad, authUser, isInitialized]);

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
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Kompresi Gambar dengan Canvas (Otomatis perkecil ukuran)
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Konversi ke JPEG dengan kualitas 70%
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setSelectedImage(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (e, customText = null, customImage = null, overrideMessages = null) => {
    if (e) e.preventDefault();
    const textToSend = customText !== null ? customText : input;
    const imageToSend = customImage !== null ? customImage : selectedImage;
    
    if (!textToSend.trim() && !imageToSend) return;

    // Jika dipanggil oleh fitur Regenerate, gunakan overrideMessages, jika tidak gunakan state saat ini
    const currentMessages = overrideMessages !== null ? overrideMessages : messages;

    const newUserMessage = { role: 'user', content: textToSend, image: imageToSend };
    setMessages([...currentMessages, newUserMessage]);
    
    // Hanya clear state input jika ini pesan baru (bukan regenerate)
    if (customText === null) {
      setInput('');
      setSelectedImage(null);
    }
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'model', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend, 
          history: currentMessages, 
          image: imageToSend, 
          toxicity 
        }),
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
          setCooldown(35);
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
      setMessages(prev => {
        const newArray = [...prev];
        newArray[newArray.length - 1].content += ' (Error API, coba lagi ngab)';
        return newArray;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateLastMessage = () => {
    if (messages.length < 2) return;
    
    // Cari pesan user terakhir
    let lastUserIndex = messages.length - 1;
    while (lastUserIndex >= 0 && messages[lastUserIndex].role !== 'user') {
      lastUserIndex--;
    }
    
    if (lastUserIndex === -1) return;
    
    const lastUserMsg = messages[lastUserIndex];
    // Ambil histori chat sebelum pesan user terakhir
    const historyBeforeLastUser = messages.slice(0, lastUserIndex);
    
    // Panggil sendMessage dengan meng-override input dan histori
    sendMessage(null, lastUserMsg.content, lastUserMsg.image, historyBeforeLastUser);
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
    if (playingIndex === msgIndex && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setPlayingIndex(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setPlayingIndex(msgIndex);

    const cleanText = text.replace(/[*#_`~]/g, '').trim();
    if (!cleanText) {
      setPlayingIndex(null);
      return;
    }

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
      if (playingIndex !== null && playingIndex !== msgIndex) return;

      if (currentChunkIndex >= chunks.length) {
        currentAudioRef.current = null;
        setPlayingIndex(null);
        return;
      }
      
      const chunk = chunks[currentChunkIndex];
      const url = `/api/tts?text=${encodeURIComponent(chunk)}`;
      
      const audio = new Audio(url);
      audio.playbackRate = 1.3;
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        currentChunkIndex++;
        playNext();
      };
      
      audio.onerror = () => {
        currentChunkIndex++;
        playNext();
      };

      audio.play().catch(e => console.error(e));
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

  const handleEditMessage = (index, content) => {
    setEditingIndex(index);
    setEditText(content);
  };

  const submitEdit = (index, oldImage) => {
    if (!editText.trim()) {
      setEditingIndex(null);
      return;
    }
    
    // Potong riwayat chat sampai sebelum pesan yang diedit
    const historyBeforeEdit = messages.slice(0, index);
    
    // Reset state editing
    setEditingIndex(null);
    setEditText('');
    
    // Kirim ulang sebagai pesan baru di posisi tersebut
    sendMessage(null, editText, oldImage, historyBeforeEdit);
  };

  const handleLoginClick = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert("Gagal login: " + error.message);
  };

  const handleLogoutClick = async () => {
    await supabase.auth.signOut();
  };

  if (!isInitialized) return null;

  return (
    <div className="app-layout">
      {/* Mood Selection Modal */}
      {!hasSelectedMood && (
        <div className="mood-modal-overlay">
          <div className="mood-modal-content">
            <h2>Pilih Vibe Bot Hari Ini 🎭</h2>
            <p>Seberapa pedas kata-katanya yang lu siap terima?</p>
            <div className="mood-options">
              <button onClick={() => {setToxicity(1); setHasSelectedMood(true)}} className="mood-btn chill">
                🟢 Chill (Sopan)
              </button>
              <button onClick={() => {setToxicity(2); setHasSelectedMood(true)}} className="mood-btn sarkas">
                🟡 Sarkas (Ngeselin)
              </button>
              <button onClick={() => {setToxicity(3); setHasSelectedMood(true)}} className="mood-btn savage">
                🔴 Savage (Mental Aman?)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay untuk Mobile */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Riwayat Chat</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar"><X size={20} /></button>
        </div>
        <button onClick={createNewSession} className="new-chat-btn" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><PlusCircle size={18} /> Chat Baru</button>
        <div className="session-list">
          {sessions.map(s => (
            <div 
              key={s.id} 
              className={`session-item ${s.id === activeSessionId ? 'active' : ''}`}
              onClick={() => loadSession(s.id)}
            >
              <span>{s.title}</span>
              <button onClick={(e) => deleteSession(s.id, e)} className="delete-session" title="Hapus"><Trash2 size={16} /></button>
            </div>
          ))}
          {/* Auth Section */}
          {authUser ? (
            <div style={{marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--glass-border)'}}>
              <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                👤 {authUser.email}
              </div>
              <button onClick={handleLogoutClick} className="new-chat-btn" style={{background: 'rgba(254, 9, 121, 0.2)', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={handleLoginClick} className="new-chat-btn" style={{marginTop: 'auto', background: 'rgba(139, 92, 246, 0.2)', borderColor: 'var(--neon-purple)', color: 'var(--neon-purple)', textShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
              <Cloud size={18} /> Login (Cloud Sync)
            </button>
          )}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="chat-container">
        <header className="chat-header">
          <button onClick={() => setIsSidebarOpen(true)} className="menu-btn"><Menu size={24} /></button>
          <div className="header-info">
            <div className="avatar"><Bot size={32} /></div>
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
              {msg.role === 'model' && <div className="msg-avatar"><Bot size={24} /></div>}
              <div className={`message ${msg.role}`}>
                {msg.image && <img src={msg.image} alt="User Upload" className="uploaded-image" />}
                {msg.role === 'model' ? (
                  <>
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || '...'}</ReactMarkdown>
                    </div>
                    <div className="msg-actions">
                      <button onClick={() => speakText(msg.content, index)} className="play-audio-btn" style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                        {playingIndex === index ? <><Square size={14} fill="currentColor" /> Stop</> : <><Volume2 size={14} /> Dengarkan</>}
                      </button>
                      <button onClick={(e) => captureScreenshot(e, index)} className="play-audio-btn" style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}><Share2 size={14} /> Share</button>
                      
                      {/* Tampilkan tombol Regenerate hanya pada pesan bot terakhir */}
                      {index === messages.length - 1 && (
                        <button onClick={regenerateLastMessage} className="play-audio-btn" style={{borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                          <RefreshCw size={14} /> Regenerate
                        </button>
                      )}
                    </div>
                  </>
                ) : editingIndex === index ? (
                  <div className="edit-message-area" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    <textarea 
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={{background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--neon-cyan)', width: '100%', minHeight: '60px', fontFamily: 'inherit'}}
                    />
                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                      <button onClick={() => setEditingIndex(null)} style={{background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem'}}>Batal</button>
                      <button onClick={() => submitEdit(index, msg.image)} style={{background: 'var(--neon-cyan)', color: 'black', border: 'none', cursor: 'pointer', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 'bold'}}>Kirim Ulang</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>{msg.content}</p>
                    <div className="msg-actions" style={{justifyContent: 'flex-end', marginTop: '0.5rem'}}>
                      <button onClick={() => handleEditMessage(index, msg.content)} className="play-audio-btn" style={{borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
              {msg.role === 'user' && <div className="msg-avatar"><User size={24} /></div>}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <div className="message-wrapper model">
              <div className="msg-avatar"><Bot size={24} /></div>
              <div className="message model loading-indicator">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="image-preview">
            <img src={selectedImage} alt="Preview" />
            <button onClick={() => setSelectedImage(null)} className="clear-img-btn"><X size={16} /></button>
          </div>
        )}

        <form className="input-area" onSubmit={(e) => sendMessage(e)}>
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
            onClick={startListening}
            className={`mic-btn ${isListening ? 'recording' : ''}`}
            title="Bicara pake Mic"
            disabled={isLoading || cooldown > 0}
            style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          >
            {isListening ? <Mic size={20} color="white" /> : <Mic size={20} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); shouldSpeakRef.current = false; }}
            placeholder={cooldown > 0 ? `Sabar dek, tunggu ${cooldown} detik...` : "Ketik pesen lu di sini dek..."}
            className="chat-input"
            disabled={isLoading || cooldown > 0}
          />
          <button type="submit" className="send-btn" disabled={(!input.trim() && !selectedImage) || isLoading || cooldown > 0} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Send size={20} />
          </button>
        </form>
      </main>
    </div>
  );
}
