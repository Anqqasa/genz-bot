'use client';

import { useState } from 'react';
import { Cloud, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setLoginError('Email tidak boleh kosong!'); return; }
    if (!password || password.length < 6) { setLoginError('Password minimal 6 karakter bos!'); return; }

    setIsLoginLoading(true);
    setLoginError('');

    // Try Sign Up first or Sign In
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error && error.message.includes("already registered")) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setLoginError("Gagal Login: " + signInError.message);
      } else {
        onClose();
      }
    } else if (error) {
      setLoginError(error.message);
    } else {
      onClose();
    }
    setIsLoginLoading(false);
  };

  return (
    <div className="mood-modal-overlay">
      <div className="mood-modal-content">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2 style={{margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Cloud size={24} /> Login Cloud
          </h2>
          <button onClick={onClose} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem'}}>
            <X size={24} />
          </button>
        </div>
        <p style={{marginBottom: '0'}}>Login pakai email buat nyimpen riwayat chat lu biar aman.</p>
        
        <form className="login-form" onSubmit={handleLoginSubmit}>
          <label>
            Email
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="login-input" 
              placeholder="Contoh: lu@genz.bot" 
            />
          </label>
          <label>
            Password
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="login-input" 
              placeholder="Minimal 6 karakter" 
            />
          </label>
          
          {loginError && <div className="error-text" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AlertCircle size={16} /> {loginError}</div>}
          
          {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <div style={{color: '#facc15', fontSize: '0.75rem', marginTop: '0.5rem', background: 'rgba(250, 204, 21, 0.1)', padding: '0.5rem', borderRadius: '4px'}}>
              ⚠️ <b>INFO:</b> Kunci NEXT_PUBLIC_SUPABASE_URL saat ini KOSONG / tidak terbaca oleh sistem.
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={isLoginLoading}>
            {isLoginLoading ? 'Memproses...' : 'Masuk / Daftar'}
          </button>
        </form>
      </div>
    </div>
  );
}
