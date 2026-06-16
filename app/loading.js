export default function Loading() {
  return (
    <div style={{
      height: '100dvh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      background: '#030305', 
      color: 'var(--neon-cyan)', 
      fontFamily: 'var(--font-main)'
    }}>
      <div className="loading-indicator" style={{fontSize: '3rem'}}>
        <span>.</span><span>.</span><span>.</span>
      </div>
      <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>Sabar ngab, lagi loading system...</p>
    </div>
  );
}
