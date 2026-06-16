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

  return (
    <div id={`msg-wrap-${index}`} className={`message-wrapper ${msg.role}`}>
      {msg.role === 'model' && (
        <div className="msg-avatar" style={{ background: 'transparent', padding: 0 }}>
          <Mascot toxicity={toxicity} size={36} />
        </div>
      )}
      
      <div className={`message ${msg.role}`}>
        {msg.image && <img src={msg.image} alt="User Upload" className="uploaded-image" />}
        
        {msg.role === 'model' ? (
          <>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent || '...'}</ReactMarkdown>
            </div>
            
            {memeData && (
              <AutoMeme memeId={memeData.id} topText={memeData.top} bottomText={memeData.bottom} />
            )}
            
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
          </>
        ) : isEditing ? (
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
      
      {msg.role === 'user' && <div className="msg-avatar"><User size={24} /></div>}
    </div>
  );
}
