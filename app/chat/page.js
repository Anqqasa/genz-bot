'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Menu, Cloud, Smile, Meh, Flame } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import ChatSidebar from '../../components/ChatSidebar';
import ChatBubble from '../../components/ChatBubble';
import ChatInput from '../../components/ChatInput';
import Mascot from '../../components/Mascot';
import './page.css';

export default function Home() {
  const { 
    activeSessionId, 
    sessions, setSessions, 
    isSidebarOpen, setIsSidebarOpen,
    toxicity, setToxicity,
    chatMode,
    userMemory, setUserMemory,
    authUser, isAuthChecking,
    hasSelectedMood, setHasSelectedMood,
    isInitialized,
    updateSessionMessages,
    updateSessionTitle,
    broadcastMessage
  } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  
  const [playingIndex, setPlayingIndex] = useState(null);

  const messagesAreaRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);
  const shouldSpeakRef = useRef(false);
  const messageSessionIdRef = useRef(activeSessionId);

  // Sinkronisasi messages jika session berubah
  useEffect(() => {
    if (activeSessionId) {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      if (activeSession) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages(activeSession.messages);
      }
    }
  }, [activeSessionId, sessions.length]);

  // Efek Timer Cooldown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const scrollToBottom = () => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTo({ top: messagesAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
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
    if (!cleanText) { setPlayingIndex(null); return; }

    const words = cleanText.split(' ');
    const chunks = [];
    let currentChunk = '';
    for (let i = 0; i < words.length; i++) {
      if ((currentChunk + ' ' + words[i]).length > 180) {
        chunks.push(currentChunk.trim());
        currentChunk = words[i];
      } else {
        currentChunk += (currentChunk ? ' ' : '') + words[i];
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
      audio.onended = () => { currentChunkIndex++; playNext(); };
      audio.onerror = () => { currentChunkIndex++; playNext(); };
      audio.play().catch(e => console.error(e));
    };

    playNext();
  };

  const captureScreenshot = async (e, msgIndex) => {
    e.target.innerText = '📸 Loading...';
    const chatElement = document.getElementById(`msg-wrap-${msgIndex}`);
    if (chatElement) {
      try {
        const canvas = await html2canvas(chatElement, { backgroundColor: '#030305', scale: 2 });
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

  const startListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser lu ga support fitur mic dek.");
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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const syncSession = (msgs) => {
    if (activeSessionId) {
      updateSessionMessages(activeSessionId, msgs);
    }
  };

  const sendMessage = async (customText = null, customImage = null, overrideMessages = null) => {
    const textToSend = customText !== null ? customText : input;
    const imageToSend = customImage !== null ? customImage : selectedImage;
    
    if (!textToSend.trim() && !imageToSend) return;

    const currentMessages = overrideMessages !== null ? overrideMessages : messages;
    const newUserMessage = { role: 'user', content: textToSend, image: imageToSend };
    
    const messagesWithUser = [...currentMessages, newUserMessage];
    setMessages(messagesWithUser);
    syncSession(messagesWithUser);
    setTimeout(scrollToBottom, 100);
    
    if (customText === null) {
      setInput('');
      setSelectedImage(null);
    }
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'model', content: '' }]);
    setTimeout(scrollToBottom, 100);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message: textToSend, history: currentMessages, image: imageToSend, toxicity, userMemory, chatMode }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: errorText };
          syncSession(updated);
          return updated;
        });
        setIsLoading(false);
        if (errorText.includes('MENIT') || errorText.includes('kecepetan')) setCooldown(35);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        botResponse += decoder.decode(value, { stream: true });
        setStreamingContent(botResponse);
        scrollToBottom();
      }
      setStreamingContent('');
      
      // Extract Long-Term Memory Facts after streaming completes
      const factRegex = /\[FACT:\s*([^\]]+?)\]/gi;
      let match;
      let newFacts = [];
      while ((match = factRegex.exec(botResponse)) !== null) {
        newFacts.push(match[1].trim());
      }
      
      let finalBotResponse = botResponse;
      if (newFacts.length > 0) {
        setUserMemory(prev => {
          const updated = [...prev];
          newFacts.forEach(f => { if (!updated.includes(f)) updated.push(f); });
          return updated;
        });
        // Remove the tags from the final message visually
        finalBotResponse = botResponse.replace(factRegex, '').trim();
      }

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = finalBotResponse;
        return newMsgs;
      });
      
      // Simpan final state ke session global!
      const finalAllMessages = [...messagesWithUser, { role: 'model', content: finalBotResponse }];
      syncSession(finalAllMessages);
      
      // Jika ini adalah balasan pertama bot (total 3 pesan: greeting, pesan user, balasan bot)
      // Minta AI membuat judul singkat dari percakapan ini secara background
      if (finalAllMessages.length === 3) {
        fetch('/api/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: finalAllMessages })
        })
        .then(r => r.text())
        .then(newTitle => {
           if (newTitle && newTitle !== "Chat Baru") {
              updateSessionTitle(activeSessionId, newTitle);
           }
        }).catch(e => console.error("Gagal generate judul", e));
      }
      
      if (shouldSpeakRef.current) speakText(finalBotResponse);
    } catch (error) {
      setMessages(prev => {
        const newArray = [...prev];
        newArray[newArray.length - 1].content += ' (Error API, coba lagi ngab)';
        syncSession(newArray);
        return newArray;
      });
    } finally {
      setIsLoading(false);
      shouldSpeakRef.current = false;
    }
  };

  const handleEditSubmit = (index, newText, oldImage) => {
    const historyBeforeEdit = messages.slice(0, index);
    sendMessage(newText, oldImage, historyBeforeEdit);
  };

  const regenerateLastMessage = () => {
    if (messages.length < 2) return;
    let lastUserIndex = messages.length - 1;
    while (lastUserIndex >= 0 && messages[lastUserIndex].role !== 'user') lastUserIndex--;
    if (lastUserIndex === -1) return;
    
    const lastUserMsg = messages[lastUserIndex];
    const historyBeforeLastUser = messages.slice(0, lastUserIndex);
    sendMessage(lastUserMsg.content, lastUserMsg.image, historyBeforeLastUser);
  };

  if (isAuthChecking || !isInitialized) {
    return (
      <div style={{height: '100dvh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#030305', color: 'var(--neon-cyan)', fontFamily: 'var(--font-main)'}}>
        <div className="loading-indicator"><span>.</span><span>.</span><span>.</span></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {!hasSelectedMood && (
        <div className="mood-modal-overlay">
          <div className="mood-modal-content">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Mascot toxicity={toxicity} size={80} />
            </div>
            <h2 style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>Pilih Vibe Bot Hari Ini</h2>
            <p>Seberapa pedas kata-katanya yang lu siap terima?</p>
            <div className="mood-options">
              <button onClick={() => {setToxicity(1); setHasSelectedMood(true); localStorage.setItem('genz_has_selected_mood', 'true');}} className="mood-btn chill" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'}}><Smile size={18} /> Chill (Sopan)</button>
              <button onClick={() => {setToxicity(2); setHasSelectedMood(true); localStorage.setItem('genz_has_selected_mood', 'true');}} className="mood-btn sarkas" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'}}><Meh size={18} /> Sarkas (Ngeselin)</button>
              <button onClick={() => {setToxicity(3); setHasSelectedMood(true); localStorage.setItem('genz_has_selected_mood', 'true');}} className="mood-btn savage" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'}}><Flame size={18} /> Savage (Mental Aman?)</button>
            </div>
          </div>
        </div>
      )}

      <ChatSidebar />

      <main className="chat-container">
        <header className="chat-header">
          <button onClick={() => setIsSidebarOpen(true)} className="menu-btn"><Menu size={24} /></button>
          <div className="header-info">
            <div className="avatar" style={{ background: 'transparent', padding: 0 }}>
              <Mascot toxicity={toxicity} size={48} />
            </div>
            <div>
              <h1 className="bot-name">SiPaling.AI</h1>
              <span className="status"><span className="status-dot"></span> Online and Ready to Roast</span>
            </div>
          </div>
          
          <div className="toxicity-control">
            <label style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <span>⚙️ Level Toxic:</span>
              <strong style={{color: toxicity === 1 ? '#4ade80' : toxicity === 2 ? '#facc15' : 'var(--neon-pink)'}}>
                {toxicity === 1 ? 'Chill' : toxicity === 2 ? 'Sarkas' : 'Savage'}
              </strong>
            </label>
            <input 
              type="range" min="1" max="3" 
              value={toxicity} 
              onChange={(e) => setToxicity(parseInt(e.target.value))}
              className="toxicity-slider"
              title="Geser untuk mengubah level toxic"
            />
          </div>
          {authUser && (
            <div className="auth-badge" style={{display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--neon-purple)', background: 'rgba(139,92,246,0.1)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(139,92,246,0.3)', marginLeft: '1rem'}} title="Cloud Sync Aktif">
              <Cloud size={16} /> <b>{authUser.email}</b>
            </div>
          )}
        </header>

        <div className="messages-area" ref={messagesAreaRef}>
          {messages.map((msg, index) => (
            <ChatBubble 
              key={index} 
              msg={isLoading && index === messages.length - 1 && msg.role === 'model' ? { ...msg, content: streamingContent || '' } : msg} 
              index={index} 
              isLast={index === messages.length - 1}
              playingIndex={playingIndex}
              onSpeak={speakText}
              onCapture={captureScreenshot}
              onRegenerate={regenerateLastMessage}
              onEditSubmit={handleEditSubmit}
              toxicity={toxicity}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <div className="message-wrapper model">
              <div className="msg-avatar" style={{ background: 'transparent', padding: 0 }}>
                <Mascot toxicity={toxicity} size={36} />
              </div>
              <div className="message model loading-indicator">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
        </div>

        <ChatInput 
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          isListening={isListening}
          cooldown={cooldown}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          onSendMessage={() => sendMessage()}
          onStartListening={startListening}
        />
      </main>
    </div>
  );
}
