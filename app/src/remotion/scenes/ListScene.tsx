import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { SlideHeader } from '../components/SlideHeader';
import { BulletCard } from '../components/BulletCard';
import type { ListSlide } from '../../lib/types';
import { COLORS } from '../../lib/constants';
import { DynamicIcon } from '../../lib/icons';

interface Props {
  slide: ListSlide;
  username: string;
  accentColor: string;
  slideStartFrame: number;
}

export const ListScene: React.FC<Props> = ({ slide, username, accentColor, slideStartFrame }) => {
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

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24, marginTop: 20 }}>
          {slide.bullets.map((bullet, i) => {
            const myDelay = bullet.delay ?? (20 + i * 18);
            const nextBullet = slide.bullets[i + 1];
            const nextDelay = nextBullet?.delay ?? (i + 1 < slide.bullets.length ? 20 + (i + 1) * 18 : slide.durationInFrames);
            return (
              <BulletCard key={i} icon={bullet.icon} text={bullet.text}
                boldText={bullet.boldText} delay={myDelay} nextDelay={nextDelay} accentColor={accentColor}
                startTime={(bullet as any).startTime} endTime={(bullet as any).endTime}
                nextStartTime={(nextBullet as any)?.startTime}
                slideStartFrame={slideStartFrame} />
            );
          })}
        </div>
      </div>
    </div>
  );
};
