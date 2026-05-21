import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { ANIM, COLORS } from '../../lib/constants';

interface Props {
  username: string;
  accentColor?: string;
}

export const SlideHeader: React.FC<Props> = ({ username, accentColor = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, ANIM.FADE_IN], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      position: 'absolute', top: 60, left: 0, right: 0,
      justifyContent: 'center', opacity,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: '#fff', fontWeight: 700,
      }}>✓</div>
      <span style={{
        color: COLORS.textMuted, fontSize: 32, fontWeight: 500,
        fontFamily: "'Roboto', sans-serif",
      }}>@{username}</span>
    </div>
  );
};
