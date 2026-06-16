'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, Radio, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Mascot from '../../components/Mascot';
import './page.css';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);
  const [userList, setUserList] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [sqlError, setSqlError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      // API akan mengecek ADMIN_EMAIL di backend, tapi kita cek dulu sekilas di frontend
      setSessionToken(session.access_token);
      setIsAdmin(true);
      setLoading(false);
      fetchStats(session.access_token);
    };
    checkAdmin();
  }, [router]);

  const fetchStats = async (token) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'get_stats' })
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setUserList(data.users);
      } else {
        if (data.error?.includes('bos')) {
          router.push('/');
        }
        setStatusMsg(data.error || "Gagal fetch stats");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBanUser = async (userId, email) => {
    if (!confirm(`Yakin mau ban/hapus user ${email}? Data cloud_saves dia juga bakal nyangkut.`)) return;
    
    setStatusMsg(`Menghapus ${email}...`);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action: 'delete_user', payload: { userId } })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`User ${email} berhasil dihapus.`);
        fetchStats(sessionToken); // refresh
      } else {
        setStatusMsg("Gagal: " + data.error);
      }
    } catch (e) {
      setStatusMsg("Error jaringan saat hapus user");
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg) return setStatusMsg('Isi pesannya dulu bos!');
    setStatusMsg('Mengirim pengumuman...');
    setSqlError(false);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ action: 'broadcast', payload: { message: broadcastMsg } })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg('Pengumuman berhasil di-broadcast!');
        setBroadcastMsg('');
      } else {
        if (data.error === 'TABEL_BELUM_ADA') {
          setSqlError(true);
          setStatusMsg("Gagal Broadcast! Tabel belum ada.");
        } else {
          setStatusMsg("Gagal: " + data.error);
        }
      }
    } catch (e) {
      setStatusMsg("Error jaringan saat broadcast");
    }
  };

  if (loading) {
    return (
      <div className="admin-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <h1>MEMVERIFIKASI DNA BOS...</h1>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-container">
      <div className="admin-grid-bg"></div>
      
      <div className="admin-content">
        <header className="admin-header">
          <ShieldAlert size={40} color="#ef4444" />
          <div>
            <h1>Control Panel Super Secret</h1>
            <p style={{color: '#9ca3af', fontFamily: 'sans-serif'}}>Welcome Boss. Dengan kekuatan besar datang tanggung jawab yang... ya terserah lah.</p>
          </div>
        </header>

        {statusMsg && (
          <div style={{background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', color: '#fca5a5', border: '1px solid #ef4444'}}>
            {statusMsg}
          </div>
        )}

        {sqlError && (
          <div className="admin-card" style={{borderColor: '#fbbf24'}}>
            <h2 style={{color: '#fbbf24'}}>⚠️ Tindakan Diperlukan: Buat Tabel Broadcast</h2>
            <p>Sistem mendeteksi bahwa tabel <code>app_settings</code> belum ada di database Supabase Anda. Untuk mengaktifkan fitur Broadcast, copy kode SQL di bawah ini, lalu jalankan di menu <strong>SQL Editor</strong> di Dashboard Supabase Anda:</p>
            <div className="sql-box">
{`CREATE TABLE app_settings (
  id text primary key,
  value text
);
INSERT INTO app_settings (id, value) VALUES ('broadcast', '');
`}
            </div>
            <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#9ca3af'}}>Setelah tabel berhasil dibuat, coba kirim pengumuman lagi.</p>
          </div>
        )}

        <div className="admin-card">
          <h2><Users size={20}/> Statistik Pengguna</h2>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="number">{userList.length}</div>
              <div className="label">Total User Terdaftar</div>
            </div>
          </div>
          
          <h3 style={{marginTop: '2rem', marginBottom: '1rem', color: '#9ca3af'}}>Daftar Penduduk SiPaling.AI <button onClick={() => fetchStats(sessionToken)} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer'}}><RefreshCw size={14}/></button></h3>
          <div style={{overflowX: 'auto'}}>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tanggal Daftar</th>
                  <th>Terakhir Login</th>
                  <th>Aksi (Bahaya)</th>
                </tr>
              </thead>
              <tbody>
                {userList.map(u => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>{new Date(u.last_sign_in_at || u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleBanUser(u.id, u.email)} className="btn-danger" title="Hapus User ke Neraka">
                        <Trash2 size={16} /> Ban / Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {userList.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Belum ada data user ngab.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <h2><Radio size={20}/> Broadcast Pengumuman (Megaphone)</h2>
          <p style={{marginBottom: '1rem', color: '#9ca3af'}}>Tulis pengumuman di sini. Semua orang yang membuka web akan melihat pesan ini di atas layar mereka. Kosongkan untuk menghapus pengumuman aktif.</p>
          
          <textarea 
            className="admin-input" 
            placeholder="Ketik pengumuman penting di sini bos..."
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
          ></textarea>
          
          <div style={{display: 'flex', gap: '1rem'}}>
            <button onClick={handleBroadcast} className="btn-action" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <ShieldCheck size={18}/> Siarkan Ke Semua
            </button>
            <button onClick={() => { setBroadcastMsg(''); setStatusMsg(''); fetch('/api/admin', { method: 'POST', headers: {'Authorization': `Bearer ${sessionToken}`, 'Content-Type': 'application/json'}, body: JSON.stringify({action: 'broadcast', payload: {message: ''}}) }).then(()=>setStatusMsg('Pengumuman dihapus!')) }} className="btn-action" style={{background: 'transparent', border: '1px solid #ef4444', color: '#ef4444'}}>
              Hapus Siaran Aktif
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
