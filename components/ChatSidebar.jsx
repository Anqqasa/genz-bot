'use client';

import { X, PlusCircle, Trash2, User, LogOut, Cloud } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function ChatSidebar({ setShowLoginModal }) {
  const { 
    sessions, setSessions, 
    activeSessionId, setActiveSessionId, 
    isSidebarOpen, setIsSidebarOpen,
    authUser, createNewSession 
  } = useAppContext();

  const loadSession = (id) => {
    setActiveSessionId(id);
    setIsSidebarOpen(false);
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
    }
  };

  const handleLogoutClick = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Riwayat Chat</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar"><X size={20} /></button>
        </div>
        
        <button onClick={createNewSession} className="new-chat-btn" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
          <PlusCircle size={18} /> Chat Baru
        </button>
        
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
              <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                <User size={14} /> {authUser.email}
              </div>
              <button onClick={handleLogoutClick} className="new-chat-btn" style={{background: 'rgba(254, 9, 121, 0.2)', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="new-chat-btn" style={{marginTop: 'auto', background: 'rgba(139, 92, 246, 0.2)', borderColor: 'var(--neon-purple)', color: 'var(--neon-purple)', textShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
              <Cloud size={18} /> Login (Cloud Sync)
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
