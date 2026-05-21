import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import type { OutroSlide } from '../../lib/types';
import { COLORS } from '../../lib/constants';

interface Props {
  slide: OutroSlide;
  accentColor: string;
}

const platformLogos: Record<string, { name: string; colors: string[] }> = {
  tiktok: { name: 'TikTok', colors: ['#25F4EE', '#FE2C55'] },
  youtube: { name: 'YouTube', colors: ['#FF0000', '#FF4444'] },
  instagram: { name: 'Instagram', colors: ['#F58529', '#DD2A7B', '#8134AF'] },
};

export const OutroScene: React.FC<Props> = ({ slide, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({ frame, fps, config: { damping: 12 } });
  const barProgress = spring({ frame: frame - 15, fps, config: { damping: 15 } });

  const platform = platformLogos[slide.platform] || platformLogos.tiktok;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Background accentColor={accentColor} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 30,
      }}>
        {/* Platform icon */}
        <div style={{
          opacity: interpolate(logoProgress, [0, 1], [0, 1]),
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.5, 1])})`,
        }}>
          {slide.platform === 'tiktok' && (
            <svg width="100" height="112" viewBox="0 0 100 112" fill="none">
              <path d="M72.5 2C72.5 2 72.5 37.5 72.5 42.5C77.5 45 85 47.5 95 47.5V62.5C85 62.5 77.5 59 72.5 55V82.5C72.5 97.5 60 110 45 110C30 110 17.5 97.5 17.5 82.5C17.5 67.5 30 55 45 55V70C37.5 70 32.5 75 32.5 82.5C32.5 90 37.5 95 45 95C52.5 95 57.5 90 57.5 82.5V2H72.5Z" fill="white"/>
              <path d="M75 2C75 2 75 37.5 75 42.5C80 45 87.5 47.5 97.5 47.5V62.5C87.5 62.5 80 59 75 55V82.5C75 97.5 62.5 110 47.5 110C32.5 110 20 97.5 20 82.5C20 67.5 32.5 55 47.5 55V70C40 70 35 75 35 82.5C35 90 40 95 47.5 95C55 95 60 90 60 82.5V2H75Z" fill="#25F4EE" opacity="0.7" transform="translate(-3, -1)"/>
              <path d="M75 2C75 2 75 37.5 75 42.5C80 45 87.5 47.5 97.5 47.5V62.5C87.5 62.5 80 59 75 55V82.5C75 97.5 62.5 110 47.5 110C32.5 110 20 97.5 20 82.5C20 67.5 32.5 55 47.5 55V70C40 70 35 75 35 82.5C35 90 40 95 47.5 95C55 95 60 90 60 82.5V2H75Z" fill="#FE2C55" opacity="0.7" transform="translate(3, 1)"/>
            </svg>
          )}
          {slide.platform === 'youtube' && (
            <svg width="120" height="85" viewBox="0 0 120 85" fill="none">
              <rect width="120" height="85" rx="20" fill="#FF0000"/>
              <polygon points="48,20 48,65 88,42.5" fill="white"/>
            </svg>
          )}
          {slide.platform === 'instagram' && (
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="ig" x1="0" y1="100" x2="100" y2="0">
                  <stop offset="0%" stopColor="#F58529"/>
                  <stop offset="50%" stopColor="#DD2A7B"/>
                  <stop offset="100%" stopColor="#8134AF"/>
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="25" fill="url(#ig)"/>
              <circle cx="50" cy="50" r="22" stroke="white" strokeWidth="6" fill="none"/>
              <circle cx="74" cy="26" r="6" fill="white"/>
            </svg>
          )}
        </div>

        {/* Platform name */}
        <h1 style={{
          fontSize: 72, fontWeight: 800, color: COLORS.text,
          fontFamily: "'Roboto', sans-serif", margin: 0,
          opacity: interpolate(logoProgress, [0, 1], [0, 1]),
        }}>{platform.name}</h1>

        {/* Search bar with username */}
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: 40,
          padding: '24px 36px', display: 'flex', alignItems: 'center', gap: 20,
          opacity: interpolate(barProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(barProgress, [0, 1], [20, 0])}px)`,
          border: `2px solid ${platform.colors[0]}44`,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <span style={{
            fontSize: 36, color: '#333', fontWeight: 600,
            fontFamily: "'Roboto', sans-serif",
          }}>@ {slide.username}</span>
          <div style={{
            width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {slide.platform === 'tiktok' && (
              <svg width="32" height="38" viewBox="0 0 100 112">
                <path d="M72.5 2C72.5 2 72.5 37.5 72.5 42.5C77.5 45 85 47.5 95 47.5V62.5C85 62.5 77.5 59 72.5 55V82.5C72.5 97.5 60 110 45 110C30 110 17.5 97.5 17.5 82.5C17.5 67.5 30 55 45 55V70C37.5 70 32.5 75 32.5 82.5C32.5 90 37.5 95 45 95C52.5 95 57.5 90 57.5 82.5V2H72.5Z" fill="#FE2C55"/>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
