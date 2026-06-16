'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cloud, UserPlus, User, ArrowLeft, Flame, AlertCircle } from 'lucide-react';
import Mascot from '../../components/Mascot';
import { supabase } from '../../lib/supabase';
import './page.css';
import { useAppContext } from '../../context/AppContext';

export default function LoginPage() {
  const [mode, setMode] = useState('select'); // 'select', 'login', 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const { authUser, isAuthChecking } = useAppContext();

  useEffect(() => {
    if (!isAuthChecking && authUser) {
      router.push('/chat');
    }
  }, [authUser, isAuthChecking, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) return setErrorMsg('Email dan Password wajib diisi bos!');
    
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      setErrorMsg("Gagal Login: " + error.message);
    } else {
      router.push('/chat');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) return setErrorMsg('Email dan Password wajib diisi bos!');
    if (password.length < 6) return setErrorMsg('Password minimal 6 karakter!');

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);

    if (error) {
      setErrorMsg("Gagal Daftar: " + error.message);
    } else {
      if (data?.session === null || data?.user?.identities?.length === 0) {
        setSuccessMsg('Akun berhasil dibuat! Cek INBOX/SPAM email lu sekarang buat klik link verifikasi.');
      } else {
        router.push('/chat');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-grid-bg"></div>
      
      <div className="login-box glass">
        {mode === 'select' && (
          <div className="select-mode">
            <div className="login-header">
              <Mascot size={60} toxicity={3} character="moci" />
              <h1>Pilih Jalur Masuk</h1>
              <p>Lu mau pake akun awan (cloud) atau jadi tamu doang?</p>
            </div>
            
            <div className="auth-options">
              <button onClick={() => setMode('login')} className="auth-btn login-btn">
                <Cloud size={20} /> Login Akun
              </button>
              <button onClick={() => setMode('register')} className="auth-btn register-btn">
                <UserPlus size={20} /> Daftar Baru
              </button>
              <div className="divider"><span>ATAU</span></div>
              <button onClick={() => router.push('/chat')} className="auth-btn guest-btn">
                <User size={20} /> Masuk Sebagai Tamu
              </button>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div className="form-mode">
            <button onClick={() => {setMode('select'); setErrorMsg(''); setSuccessMsg('');}} className="back-btn">
              <ArrowLeft size={16} /> Kembali
            </button>
            <div className="login-header small">
              <Cloud size={40} className="icon-cloud" />
              <h2>Login Akun</h2>
              <p>Masuk buat nyimpen progress bacotan lu.</p>
            </div>
            
            <form onSubmit={handleLogin} className="auth-form">
              <input 
                type="email" 
                placeholder="Email lu" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="auth-input"
              />
              {errorMsg && <div className="error-msg"><AlertCircle size={16}/> {errorMsg}</div>}
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'Login Sekarang'}
              </button>
            </form>
          </div>
        )}

        {mode === 'register' && (
          <div className="form-mode">
            <button onClick={() => {setMode('select'); setErrorMsg(''); setSuccessMsg('');}} className="back-btn">
              <ArrowLeft size={16} /> Kembali
            </button>
            <div className="login-header small">
              <UserPlus size={40} className="icon-cloud" />
              <h2>Daftar Baru</h2>
              <p>Bikin akun biar data lu nggak ilang pas ganti HP.</p>
            </div>
            
            <form onSubmit={handleRegister} className="auth-form">
              <input 
                type="email" 
                placeholder="Email aktif lu" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
              />
              <input 
                type="password" 
                placeholder="Password (min 6 karakter)" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="auth-input"
              />
              {errorMsg && <div className="error-msg"><AlertCircle size={16}/> {errorMsg}</div>}
              {successMsg && <div className="success-msg" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontSize: '0.85rem', background: 'rgba(74, 222, 128, 0.1)', padding: '0.8rem', borderRadius: '8px', textAlign: 'left'}}>
                ✅ {successMsg}
              </div>}
              <button type="submit" className="submit-btn register" disabled={isLoading}>
                {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
