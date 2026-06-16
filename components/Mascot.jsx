import React from 'react';

export default function Mascot({ toxicity = 3, size = 160, character = 'moci' }) {
  const palettes = {
    1: { c: '#00E5FF', c2: '#CC44FF' },
    2: { c: '#CC44FF', c2: '#8822FF' },
    3: { c: '#FF2060', c2: '#FF8800' }
  };
  const m = palettes[toxicity] || palettes[3];

  const charStr = character.toLowerCase();

  if (charStr === 'glitch') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        {/* Cat Ears */}
        <polygon points="50,110 30,30 90,60" fill="#0A0A1C" stroke="#00FF00" strokeWidth="3"/>
        <polygon points="150,110 170,30 110,60" fill="#0A0A1C" stroke="#00FF00" strokeWidth="3"/>
        {/* Head */}
        <ellipse cx="100" cy="110" rx="60" ry="45" fill="#12121A" stroke="#00FF00" strokeWidth="2"/>
        {/* Cyberpunk Visor */}
        <rect x="50" y="85" width="100" height="25" rx="5" fill="#00FF00" opacity="0.8"/>
        <rect x="60" y="90" width="20" height="5" fill="#FFFFFF"/>
        <rect x="90" y="90" width="40" height="5" fill="#FFFFFF"/>
        {/* Smirk */}
        <path d="M 85 130 Q 100 145 125 125" fill="none" stroke="#00FF00" strokeWidth="3" strokeLinecap="round"/>
        {/* Scars/Wires */}
        <path d="M 40 120 L 20 140 M 160 120 L 180 140" fill="none" stroke="#00FF00" strokeWidth="2"/>
      </svg>
    );
  }

  if (charStr === 'krak') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        {/* Abstract Triangle Head */}
        <polygon points="100,20 40,140 160,140" fill="#2A0000" stroke="#FF2060" strokeWidth="4"/>
        {/* Giant Floating Eye */}
        <ellipse cx="100" cy="90" rx="30" ry="15" fill="#FF8800"/>
        <circle cx="100" cy="90" r="8" fill="#000000"/>
        <circle cx="103" cy="88" r="3" fill="#FFFFFF"/>
        {/* Halo / Rings */}
        <ellipse cx="100" cy="40" rx="40" ry="10" fill="none" stroke="#FF8800" strokeWidth="2" transform="rotate(-10 100 40)"/>
        {/* Minimalist Smug Mouth */}
        <path d="M 85 120 L 115 120 L 110 125" fill="none" stroke="#FF2060" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  // Default: MOCI
  return (
    <svg width={size} height={size} viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
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
      {/* Mata Kiri */}
      <circle cx="85" cy="97" r="12" fill="#0A0A1C"/>
      <circle cx="85" cy="97" r="8" fill={m.c} />
      <circle cx="88" cy="94" r="3.5" fill="white"/>
      {/* Mata Kanan */}
      <circle cx="115" cy="97" r="12" fill="#0A0A1C"/>
      <polygon points="115,88 117.5,94 124,94 119,98 121,104 115,100 109,104 111,98 106,94 112.5,94" fill={m.c2} />
      {/* Blush */}
      <ellipse cx="74" cy="107" rx="8" ry="4" fill={m.c} opacity="0.5"/>
      <ellipse cx="126" cy="107" rx="8" ry="4" fill={m.c} opacity="0.5"/>
      {/* Mulut */}
      <path d="M91 113 Q100 121 109 113" fill="none" stroke="#8844CC" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Boba */}
      <circle cx="78" cy="136" r="9" fill="#2A1040"/>
      <circle cx="95" cy="139" r="10" fill="#22103A"/>
      <circle cx="113" cy="137" r="9" fill="#2A1040"/>
      <circle cx="129" cy="133" r="8" fill="#22103A"/>
      {/* Lengan */}
      <path d="M66 93 Q44 87 36 103 Q30 117 42 121" fill="none" stroke="#4422AA" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="41" cy="121" r="9" fill="#3311AA"/>
      <path d="M134 93 Q156 87 164 103 Q170 117 158 121" fill="none" stroke="#4422AA" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="159" cy="121" r="9" fill="#3311AA"/>
    </svg>
  );
}
