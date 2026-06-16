'use client';

import { X, PlusCircle, Trash2, User, LogOut, Cloud, Download, Palette, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function ChatSidebar() {
  const { 
    sessions, setSessions, 
    activeSessionId, setActiveSessionId, 
    isSidebarOpen, setIsSidebarOpen,
    authUser, createNewSession, clearAllSessions,
    theme, setTheme,
    chatMode, setChatMode
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

  const handleClearAll = () => {
    if (confirm("Yakin mau hapus SEMUA riwayat chat lu? Gak bisa balik lagi loh!")) {
      clearAllSessions();
    }
  };

  const handleExport = () => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (!activeSession) return;
    
    let text = `=== EXPORT CHAT SIPALING.AI ===\nJudul: ${activeSession.title}\nTanggal: ${new Date().toLocaleString()}\n\n`;
    activeSession.messages.forEach(m => {
      text += `[${m.role === 'user' ? 'Gua' : 'SiPaling.AI'}]:\n${m.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SipalingAI-${activeSessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
          <h2>Menu</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar"><X size={20} /></button>
        </div>
        
        <button onClick={createNewSession} className="new-chat-btn" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
          <PlusCircle size={18} /> Chat Baru
        </button>

        <div style={{padding: '0 1rem', marginBottom: '1rem'}}>
          <label style={{fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'}}><Palette size={14}/> Tema Web</label>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button onClick={() => setTheme('cyberpunk')} style={{flex: 1, padding: '0.3rem', borderRadius: '4px', background: theme === 'cyberpunk' ? 'var(--neon-cyan)' : 'transparent', color: theme === 'cyberpunk' ? '#000' : 'var(--text-primary)', border: '1px solid var(--neon-cyan)', fontSize: '0.75rem', cursor: 'pointer'}}>Neon</button>
            <button onClick={() => setTheme('y2k')} style={{flex: 1, padding: '0.3rem', borderRadius: '4px', background: theme === 'y2k' ? 'var(--neon-pink)' : 'transparent', color: theme === 'y2k' ? '#000' : 'var(--text-primary)', border: '1px solid var(--neon-pink)', fontSize: '0.75rem', cursor: 'pointer'}}>Y2K</button>
            <button onClick={() => setTheme('soft')} style={{flex: 1, padding: '0.3rem', borderRadius: '4px', background: theme === 'soft' ? 'var(--neon-purple)' : 'transparent', color: theme === 'soft' ? '#000' : 'var(--text-primary)', border: '1px solid var(--neon-purple)', fontSize: '0.75rem', cursor: 'pointer'}}>Soft</button>
          </div>
        </div>

        <div style={{padding: '0 1rem', marginBottom: '1rem'}}>
          <label style={{fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'}}>💬 Mode Chat</label>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button onClick={() => setChatMode('solo')} style={{flex: 1, padding: '0.3rem', borderRadius: '4px', background: chatMode === 'solo' ? 'var(--neon-cyan)' : 'transparent', color: chatMode === 'solo' ? '#000' : 'var(--text-primary)', border: `1px solid var(--neon-cyan)`, fontSize: '0.75rem', cursor: 'pointer'}}>1 vs 1</button>
            <button onClick={() => setChatMode('group')} style={{flex: 1, padding: '0.3rem', borderRadius: '4px', background: chatMode === 'group' ? 'var(--neon-pink)' : 'transparent', color: chatMode === 'group' ? '#000' : 'var(--text-primary)', border: `1px solid var(--neon-pink)`, fontSize: '0.75rem', cursor: 'pointer'}}>Tongkrongan</button>
          </div>
        </div>
        
        <div className="session-list">
          <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>Riwayat Chat</div>
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

          {/* Action Buttons */}
          <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)'}}>
            <button onClick={handleExport} className="new-chat-btn" style={{flex: 1, background: 'rgba(0, 242, 254, 0.1)', borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem'}}>
              <Download size={14} /> Export
            </button>
            <button onClick={handleClearAll} className="new-chat-btn" style={{flex: 1, background: 'rgba(254, 9, 121, 0.1)', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem'}}>
              <AlertTriangle size={14} /> Clear All
            </button>
          </div>

          {/* Auth Section */}
          {authUser ? (
            <div style={{marginTop: 'auto', paddingTop: '1rem'}}>
              <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                <User size={14} /> {authUser.email}
              </div>
              <button onClick={handleLogoutClick} className="new-chat-btn" style={{background: 'rgba(254, 9, 121, 0.2)', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={() => window.location.href = '/login'} className="new-chat-btn" style={{marginTop: 'auto', background: 'rgba(139, 92, 246, 0.2)', borderColor: 'var(--neon-purple)', color: 'var(--neon-purple)', textShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
              <Cloud size={18} /> Login (Cloud Sync)
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
