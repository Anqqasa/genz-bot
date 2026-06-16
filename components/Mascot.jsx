import React from 'react';

export default function Mascot({ toxicity = 3, size = 160 }) {
  // Tentukan palet warna berdasarkan tingkat toxicity
  // 1: Chill, 2: Sarkas, 3: Savage
  const palettes = {
    1: { c: '#00E5FF', c2: '#CC44FF' },
    2: { c: '#CC44FF', c2: '#8822FF' },
    3: { c: '#FF2060', c2: '#FF8800' }
  };

  const m = palettes[toxicity] || palettes[3];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 160" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Background sengaja transparan agar menyatu, hapus <rect fill="#0A0A1C"/> */}
      
      {/* Sedotan */}
      <rect x="96" y="4" width="8" height="58" rx="4" fill="#4422AA"/>
      <circle cx="100" cy="4" r="6" fill={m.c} />
      <circle cx="100" cy="4" r="2.5" fill="white"/>
      <polygon points="100,19 102,25 108,25 103,29 105,35 100,31 95,35 97,29 92,25 98,25" fill={m.c} opacity="0.85"/>
      
      {/* Body Gelas */}
      <path d="M68 60 L56 148 L144 148 L132 60 Z" fill="#1A0E2A" opacity="0.6"/>
      
      {/* Tutup Gelas */}
      <ellipse cx="100" cy="60" rx="36" ry="10" fill="#221138"/>
      <ellipse cx="100" cy="56" rx="30" ry="7" fill="#2A1545"/>
      
      {/* Bucket Hat */}
      <rect x="76" y="28" width="48" height="24" rx="5" fill={m.c2} />
      <ellipse cx="100" cy="51" rx="33" ry="7" fill={m.c2} />
      <ellipse cx="100" cy="51" rx="33" ry="7" fill="none" stroke="#9922CC" strokeWidth="1.5"/>
      <line x1="100" y1="29" x2="100" y2="50" stroke="#9922CC" strokeWidth="1" opacity="0.4"/>
      
      {/* Mata Kiri (Kiri layarnya) */}
      <circle cx="85" cy="97" r="12" fill="#0A0A1C"/>
      <circle cx="85" cy="97" r="8" fill={m.c} />
      <circle cx="88" cy="94" r="3.5" fill="white"/>
      <circle cx="89" cy="94.5" r="1.5" fill="#0A0A1C"/>
      
      {/* Mata Kanan (Kanan layarnya - Bintang) */}
      <circle cx="115" cy="97" r="12" fill="#0A0A1C"/>
      <polygon points="115,88 117.5,94 124,94 119,98 121,104 115,100 109,104 111,98 106,94 112.5,94" fill={m.c2} />
      
      {/* Blush (Pipi) */}
      <ellipse cx="74" cy="107" rx="8" ry="4" fill={m.c} opacity="0.5"/>
      <ellipse cx="126" cy="107" rx="8" ry="4" fill={m.c} opacity="0.5"/>
      
      {/* Mulut */}
      <path d="M91 113 Q100 121 109 113" fill="none" stroke="#8844CC" strokeWidth="2.5" strokeLinecap="round"/>
      
      {/* Pearl / Boba di bawah */}
      <circle cx="78" cy="136" r="9" fill="#2A1040"/>
      <circle cx="95" cy="139" r="10" fill="#22103A"/>
      <circle cx="113" cy="137" r="9" fill="#2A1040"/>
      <circle cx="129" cy="133" r="8" fill="#22103A"/>
      <circle cx="75" cy="133" r="2" fill="white" opacity="0.2"/>
      <circle cx="92" cy="136" r="2.5" fill="white" opacity="0.2"/>
      
      {/* Lengan Sedotan Kiri */}
      <path d="M66 93 Q44 87 36 103 Q30 117 42 121" fill="none" stroke="#4422AA" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="41" cy="121" r="9" fill="#3311AA"/>
      
      {/* Lengan Sedotan Kanan */}
      <path d="M134 93 Q156 87 164 103 Q170 117 158 121" fill="none" stroke="#4422AA" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="159" cy="121" r="9" fill="#3311AA"/>
      
      {/* Kalung Bling */}
      <path d="M74 72 Q100 82 126 72" fill="none" stroke="#BBAA00" strokeWidth="2" strokeDasharray="4,2"/>
    </svg>
  );
}
