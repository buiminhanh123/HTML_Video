import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { SlideHeader } from '../components/SlideHeader';
import type { TagSlide } from '../../lib/types';
import { COLORS } from '../../lib/constants';
import { DynamicIcon } from '../../lib/icons';

interface Props {
  slide: TagSlide;
  username: string;
  accentColor: string;
  slideStartFrame: number;
}

export const TagScene: React.FC<Props> = ({ slide, username, accentColor, slideStartFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconProgress = spring({ frame, fps, config: { damping: 15 } });
  const titleProgress = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const subtitleProgress = spring({ frame: frame - 16, fps, config: { damping: 18 } });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Background accentColor={accentColor} />
      <SlideHeader username={username} accentColor={accentColor} />

      <div style={{
        position: 'absolute', top: 220, left: 60, right: 60,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
      }}>
        {/* Icon */}
        <div style={{
          width: 120, height: 120, borderRadius: 32,
          background: COLORS.iconBg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          opacity: interpolate(iconProgress, [0, 1], [0, 1]),
          transform: `scale(${interpolate(iconProgress, [0, 1], [0.3, 1])})`,
        }}>
          <DynamicIcon name={slide.icon} size={64} color={accentColor} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 68, fontWeight: 800, textAlign: 'center',
          fontFamily: "'Roboto', sans-serif", margin: 0,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [25, 0])}px)`,
        }}>
          <span style={{ color: COLORS.text }}>{slide.title} </span>
          <span style={{ color: accentColor }}>{slide.titleAccent}</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 38, color: COLORS.textMuted, textAlign: 'center',
          fontFamily: "'Roboto', sans-serif", margin: 0, lineHeight: 1.4,
          opacity: interpolate(subtitleProgress, [0, 1], [0, 1]),
        }}>{slide.subtitle}</p>

        {/* Tags */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16,
        }}>
          {slide.tags.map((tag, i) => {
            const myDelay = tag.delay ?? (28 + i * 10);
            const nextTag = slide.tags[i + 1];
            const nextDelay = nextTag?.delay ?? (i + 1 < slide.tags.length ? 28 + (i + 1) * 10 : slide.durationInFrames);

            // Use absolute startTime/endTime if available
            const effectiveDelay = (tag as any).startTime != null
              ? Math.round((tag as any).startTime * fps) - slideStartFrame : myDelay;
            const effectiveNextDelay = (tag as any).endTime != null
              ? Math.round((tag as any).endTime * fps) - slideStartFrame
              : (nextTag as any)?.startTime != null
                ? Math.round((nextTag as any).startTime * fps) - slideStartFrame : nextDelay;

            const isActive = frame >= effectiveDelay && frame < effectiveNextDelay;
            const isDone = frame >= effectiveNextDelay;

            const activeSpring = spring({ frame: Math.max(0, frame - effectiveDelay), fps, config: { damping: 15 } });
            const doneSpring = spring({ frame: Math.max(0, frame - effectiveNextDelay), fps, config: { damping: 15 } });

            // Entrance (all tags appear together)
            const entranceProgress = spring({ frame: frame - 15 - i * 3, fps, config: { damping: 15 } });
            const entranceOpacity = interpolate(entranceProgress, [0, 1], [0, 1]);
            const entranceScale = interpolate(entranceProgress, [0, 1], [0.7, 1]);

            // State opacity: 0.3 → 1.0 → 0.6
            let stateOpacity = 0.3;
            if (isActive || isDone) stateOpacity = interpolate(activeSpring, [0, 1], [0.3, 1]);
            if (isDone) stateOpacity = interpolate(doneSpring, [0, 1], [1, 0.6]);

            // Scale
            let stateScale = 1;
            if (isActive) stateScale = interpolate(activeSpring, [0, 1], [1, 1.1]);
            if (isDone) stateScale = interpolate(doneSpring, [0, 1], [1.1, 1]);

            const glowIntensity = isActive ? interpolate(activeSpring, [0, 1], [0, 0.6]) : 0;

            return (
              <div key={i} style={{
                background: isActive ? `${tag.color}44` : `${tag.color}22`,
                border: `1.5px solid ${isActive ? tag.color : `${tag.color}66`}`,
                borderRadius: 30, padding: '16px 28px',
                opacity: entranceOpacity * stateOpacity,
                transform: `scale(${entranceScale * stateScale})`,
                boxShadow: glowIntensity > 0 ? `0 0 ${20 + glowIntensity * 20}px ${tag.color}44` : 'none',
              }}>
                <span style={{
                  color: tag.color, fontSize: 32,
                  fontWeight: isActive ? 700 : 600,
                  fontFamily: "'Roboto', sans-serif",
                }}>{tag.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
