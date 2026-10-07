import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, Fonts} from './brand';

// Top-left brand badge (transparent background): a 3D coin with the K+M logo that flips around Y once per
// loop (with thickness/edge), orange neon rim, + "@kabli_ms" pill that slides in. Loops seamlessly every 120 frames.
const D = 120;   // coin diameter
export const BrandBadge: React.FC<{handle: string; tag: string}> = ({handle, tag}) => {
  const f = useCurrentFrame(); const {fps, durationInFrames} = useVideoConfig();
  const lf = f % 120;
  const turn = interpolate(lf, [0, 40], [0, 360], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  // seamless loop: no entrance animation inside the clip (the editor fades the badge in once); only the coin spins
  const intro = 1;
  const pill = 1;
  const glow = 0.6 + 0.4 * Math.sin((f / durationInFrames) * Math.PI * 2 * 2);
  const layers = Array.from({length: 10});
  return (
    <AbsoluteFill style={{background: 'transparent'}}>
      <Fonts />
      <div style={{position: 'absolute', left: 20, top: 20, display: 'flex', alignItems: 'center', gap: 0}}>
        <div style={{width: D, height: D, perspective: 600, transform: `scale(${intro})`, zIndex: 2}}>
          <div style={{width: D, height: D, position: 'relative', transformStyle: 'preserve-3d', transform: `rotateY(${turn}deg) rotateX(8deg)`}}>
            {layers.map((_, i) => (   // coin edge thickness
              <div key={i} style={{position: 'absolute', inset: 0, borderRadius: '50%', background: i === 0 || i === 9 ? 'transparent' : '#B4380E',
                transform: `translateZ(${-6 + i * 1.3}px)`}} />
            ))}
            {[0, 180].map((ry) => (
              <div key={ry} style={{position: 'absolute', inset: 0, borderRadius: '50%', backfaceVisibility: 'hidden',
                transform: `rotateY(${ry}deg) translateZ(6px)`,
                background: `radial-gradient(circle at 35% 30%, ${C.slate} 0%, ${C.navy} 70%)`,
                border: `5px solid ${C.orange}`, boxSizing: 'border-box',
                boxShadow: `0 0 ${18 * glow}px ${C.orange}, inset 0 0 18px ${C.orange}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                <Img src={staticFile('logo_white.png')} style={{width: D * 0.8, height: D * 0.8}} />
                <div style={{position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffffff40 0%, #ffffff00 45%)'}} />
              </div>
            ))}
          </div>
        </div>
        <div style={{marginLeft: -26, paddingLeft: 40, paddingRight: 22, height: 74, borderRadius: 37,
          background: `linear-gradient(90deg, ${C.navy}ee, ${C.slate}ee)`, border: `2px solid ${C.orange}`,
          boxShadow: `0 6px 18px #0008, 0 0 ${10 * glow}px ${C.orange}88`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          transform: `translateX(${(1 - pill) * -60}px) scaleX(${pill})`, transformOrigin: 'left', opacity: pill}}>
          <div style={{fontFamily: 'Mont', fontSize: 30, color: C.white, lineHeight: 1}}>{handle}</div>
          <div style={{fontFamily: 'Mont', fontSize: 14, color: C.amber, letterSpacing: 2, marginTop: 4}}>{tag}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
