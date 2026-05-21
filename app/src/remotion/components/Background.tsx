import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../../lib/constants';

export const Background: React.FC<{ accentColor?: string }> = ({ accentColor = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 120, [0, 60, 120], [0.15, 0.25, 0.15]);

  return (
    <div style={{
      position: 'absolute', inset: 0, backgroundColor: COLORS.bg, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '30%', left: '50%', width: '120%', height: '80%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse at center, ${accentColor}${Math.round(pulse * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        filter: 'blur(80px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
        background: `linear-gradient(to top, ${COLORS.bg}, transparent)`,
      }} />
    </div>
  );
};
