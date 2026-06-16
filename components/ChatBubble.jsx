'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Volume2, Square, Share2, RefreshCw, Pencil } from 'lucide-react';
import AutoMeme from './AutoMeme';
import Mascot from './Mascot';

export default function ChatBubble({ 
  msg, 
  index, 
  isLast,
  playingIndex,
  onSpeak,
  onCapture,
  onRegenerate,
  onEditSubmit,
  toxicity = 3
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);

  const handleEditSubmit = () => {
    if (!editText.trim()) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    onEditSubmit(index, editText, msg.image);
  };

  // Parsing Meme Tag
  let displayContent = msg.content || '';
  let memeData = null;
  const memeRegex = /\[MEME:\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^\]]+?)\s*\]/i;
  const match = displayContent.match(memeRegex);
  
  if (match) {
    memeData = {
      id: match[1].trim().toLowerCase(),
      top: match[2].trim(),
      bottom: match[3].trim()
    };
    displayContent = displayContent.replace(memeRegex, '').trim();
  }

  // Parse Group Chat Tags
  const subMessages = [];
  const groupRegex = /\[(MOCI|GLITCH|KRAK)\]/gi;
  if (msg.role === 'model' && groupRegex.test(displayContent)) {
    let parts = displayContent.split(groupRegex);
    let currentContent = parts[0].trim();
    if (currentContent) {
      subMessages.push({ name: 'moci', content: currentContent });
    }
    for (let i = 1; i < parts.length; i += 2) {
      const name = parts[i].toLowerCase();
      const content = (parts[i+1] || '').trim();
      if (content) {
         subMessages.push({ name, content });
      }
    }
  } else {
    subMessages.push({ name: 'moci', content: displayContent });
  }

  if (msg.role === 'model') {
    return (
      <div id={`msg-wrap-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: subMessages.length > 1 ? '0.5rem' : '0', width: '100%' }}>
        {subMessages.map((sub, idx) => {
          const isSubLast = idx === subMessages.length - 1;
          const isGroup = subMessages.length > 1;
          return (
            <div key={idx} className="message-wrapper model" style={{ marginBottom: isSubLast ? '0' : '0' }}>
              <div className="msg-avatar" style={{ background: 'transparent', padding: 0, marginTop: isGroup ? '0.5rem' : '0' }}>
                <Mascot toxicity={toxicity} size={isGroup ? 28 : 36} character={sub.name} />
              </div>
              <div className={`message model`} style={{ padding: isGroup ? '0.75rem 1rem' : '' }}>
                {isGroup && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {sub.name}
                  </div>
                )}
                
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{sub.content || '...'}</ReactMarkdown>
                </div>
                
                {isSubLast && memeData && (
                  <AutoMeme memeId={memeData.id} topText={memeData.top} bottomText={memeData.bottom} />
                )}
                
                {isSubLast && (
                  <div className="msg-actions">
                    <button onClick={() => onSpeak(displayContent, index)} className="play-audio-btn" style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                      {playingIndex === index ? <><Square size={14} fill="currentColor" /> Stop</> : <><Volume2 size={14} /> Dengarkan</>}
                    </button>
                    <button onClick={(e) => onCapture(e, index)} className="play-audio-btn" style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                      <Share2 size={14} /> Share
                    </button>
                    {isLast && (
                      <button onClick={onRegenerate} className="play-audio-btn" style={{borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                        <RefreshCw size={14} /> Regenerate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // USER MESSAGE
  return (
    <div id={`msg-wrap-${index}`} className="message-wrapper user">
      <div className="message user">
        {msg.image && <img src={msg.image} alt="User Upload" className="uploaded-image" />}
        
        {isEditing ? (
          <div className="edit-message-area" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <textarea 
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--neon-cyan)', width: '100%', minHeight: '60px', fontFamily: 'inherit'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
              <button onClick={() => setIsEditing(false)} style={{background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem'}}>Batal</button>
              <button onClick={handleEditSubmit} style={{background: 'var(--neon-cyan)', color: 'black', border: 'none', cursor: 'pointer', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 'bold'}}>Kirim Ulang</button>
            </div>
          </div>
        ) : (
          <>
            <p>{msg.content}</p>
            <div className="msg-actions" style={{justifyContent: 'flex-end', marginTop: '0.5rem'}}>
              <button onClick={() => setIsEditing(true)} className="play-audio-btn" style={{borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                <Pencil size={14} /> Edit
              </button>
            </div>
          </>
        )}
      </div>
      <div className="msg-avatar"><User size={24} /></div>
    </div>
  );
}
