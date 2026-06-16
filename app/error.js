'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Bisa log error ke service monitoring
    console.error("App Error:", error);
  }, [error]);

  return (
    <div style={{
      height: '100dvh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      background: '#030305', 
      color: 'var(--text-primary)', 
      fontFamily: 'var(--font-main)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <AlertTriangle size={64} color="var(--neon-pink)" style={{marginBottom: '1rem'}} />
      <h2 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>Waduh, Sistemnya Ngambek!</h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Ada yang salah di dalem bro. Coba refresh aja.</p>
      
      <button 
        onClick={() => reset()}
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'var(--neon-cyan)',
          color: 'black',
          border: 'none',
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        <RefreshCw size={20} /> Coba Lagi
      </button>
    </div>
  );
}
