import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';

export const C = {navy: '#0F172A', slate: '#1B2A4A', orange: '#FF6B2C', amber: '#FFB84D', cream: '#F5EEE1', white: '#FFFFFF'};

export const Fonts: React.FC = () => (
  <style>{`
    @font-face{font-family:Tajawal;src:url(${staticFile('Tajawal-ExtraBold.ttf')});font-weight:800}
    @font-face{font-family:Mont;src:url(${staticFile('Montserrat-Bold.ttf')})}
    @font-face{font-family:Ruqaa;src:url(${staticFile('ArefRuqaa-Bold.ttf')})}
  `}</style>
);

// Navy background with a slowly breathing orange glow + perspective floor grid.
export const NavyBg: React.FC = () => {
  const f = useCurrentFrame();
  const r = 300 + 20 * Math.sin(f / 9);
  return (
    <AbsoluteFill style={{background: C.navy, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 270 - r, top: 230 - r, width: r * 2, height: r * 2, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.orange}55 0%, ${C.orange}00 70%)`}} />
      <div style={{position: 'absolute', left: -300, right: -300, top: 520, height: 900,
        transform: 'perspective(500px) rotateX(62deg)', transformOrigin: 'top',
        backgroundImage: `linear-gradient(${C.slate} 2px, transparent 2px), linear-gradient(90deg, ${C.slate} 2px, transparent 2px)`,
        backgroundSize: '60px 60px', backgroundPosition: `0 ${f * 2}px`, opacity: 0.7}} />
    </AbsoluteFill>
  );
};

export const neon = (col: string) => `0 0 8px ${col}, 0 0 22px ${col}, 0 0 44px ${col}aa`;
