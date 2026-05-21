import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { SlideHeader } from '../components/SlideHeader';
import { GridCard } from '../components/GridCard';
import type { GridSlide } from '../../lib/types';
import { COLORS } from '../../lib/constants';
import { DynamicIcon } from '../../lib/icons';

interface Props {
  slide: GridSlide;
  username: string;
  accentColor: string;
  slideStartFrame: number;
}

export const GridScene: React.FC<Props> = ({ slide, username, accentColor, slideStartFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconProgress = spring({ frame, fps, config: { damping: 15 } });
  const iconScale = interpolate(iconProgress, [0, 1], [0.3, 1]);
  const iconOpacity = interpolate(iconProgress, [0, 1], [0, 1]);

  const titleProgress = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const titleY = interpolate(titleProgress, [0, 1], [25, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Background accentColor={accentColor} />
      <SlideHeader username={username} accentColor={accentColor} />

      <div style={{
        position: 'absolute', top: 220, left: 60, right: 60,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: 32,
          background: COLORS.iconBg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 48, opacity: iconOpacity, transform: `scale(${iconScale})`,
        }}>
          <DynamicIcon name={slide.icon} size={64} color={accentColor} />
        </div>

        <h1 style={{
          fontSize: 68, fontWeight: 800, textAlign: 'center',
          fontFamily: "'Roboto', sans-serif", margin: 0,
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
        }}>
          <span style={{ color: COLORS.text }}>{slide.title} </span>
          <span style={{ color: accentColor }}>{slide.titleAccent}</span>
        </h1>

        {/* 2x2 Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 24, width: '100%', marginTop: 20,
        }}>
          {slide.items.map((item, i) => {
            const myDelay = item.delay ?? (18 + i * 8);
            const nextItem = slide.items[i + 1];
            const nextDelay = nextItem?.delay ?? (i + 1 < slide.items.length ? 18 + (i + 1) * 8 : slide.durationInFrames);
            return (
              <GridCard key={i} icon={item.icon} text={item.text} index={i}
                delay={myDelay} nextDelay={nextDelay} accentColor={accentColor}
                startTime={(item as any).startTime} endTime={(item as any).endTime}
                nextStartTime={(nextItem as any)?.startTime}
                slideStartFrame={slideStartFrame} />
            );
          })}
        </div>
      </div>
    </div>
  );
};
