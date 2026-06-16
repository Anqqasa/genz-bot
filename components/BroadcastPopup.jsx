'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Megaphone } from 'lucide-react';

export default function BroadcastPopup() {
  const { broadcastMessage } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (broadcastMessage) {
      try {
        const lastSeen = localStorage.getItem('last_seen_broadcast');
        if (lastSeen !== broadcastMessage) {
          setIsOpen(true);
        }
      } catch (e) {
        setIsOpen(true); // If localStorage fails, just show it anyway
      }
    }
  }, [broadcastMessage]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem('last_seen_broadcast', broadcastMessage);
    } catch (e) {
      // Ignore
    }
  };

  if (!isOpen || !broadcastMessage) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100dvh',
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1f1f2e, #11111a)',
        border: '1px solid #ef4444',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
        position: 'relative',
        textAlign: 'center',
        animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
      }}>
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        <Megaphone size={48} color="#ef4444" style={{ margin: '0 auto 1rem', filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' }} />
        
        <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.5rem' }}>Pengumuman Penting!</h2>
        <p style={{ color: '#d1d5db', fontSize: '1.1rem', lineHeight: '1.5', marginBottom: '2rem' }}>
          {broadcastMessage}
        </p>
        
        <button 
          onClick={handleClose}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
          }}
        >
          Siap Bos!
        </button>
      </div>
      <style jsx>{`
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
