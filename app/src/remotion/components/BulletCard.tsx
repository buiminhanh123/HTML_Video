import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../../lib/constants';
import { DynamicIcon } from '../../lib/icons';

interface Props {
  icon: string;
  text: string;
  boldText: string;
  delay: number;       // frame when this bullet becomes ACTIVE (local to slide)
  nextDelay: number;   // frame when next bullet becomes active
  accentColor?: string;
  startTime?: number;      // absolute seconds from SRT (overrides delay)
  endTime?: number;        // absolute end seconds from SRT
  nextStartTime?: number;  // next bullet's absolute start seconds
  slideStartFrame?: number; // this slide's start frame in the video
}

/**
 * BulletCard with 3 states:
 * - UPCOMING (frame < delay): dim, waiting
 * - ACTIVE (delay <= frame < nextDelay): bright, glow, accent bar
 * - DONE (frame >= nextDelay): medium brightness, no glow
 */
export const BulletCard: React.FC<Props> = ({
  icon, text, boldText, delay, nextDelay, accentColor = COLORS.accent,
  startTime, endTime, nextStartTime, slideStartFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // If startTime is provided, use absolute timing; otherwise fall back to delay
  const effectiveDelay = startTime != null
    ? Math.round(startTime * fps) - slideStartFrame
    : delay;
  // For "done" state: use endTime if available, then nextStartTime, then nextDelay
  const effectiveNextDelay = endTime != null
    ? Math.round(endTime * fps) - slideStartFrame
    : nextStartTime != null
      ? Math.round(nextStartTime * fps) - slideStartFrame
      : nextDelay;

  // State determination
  const isUpcoming = frame < effectiveDelay;
  const isActive = frame >= effectiveDelay && frame < effectiveNextDelay;
  const isDone = frame >= effectiveNextDelay;

  // Smooth transitions using spring
  const activeSpring = spring({
    frame: Math.max(0, frame - effectiveDelay),
    fps,
    config: { damping: 20, mass: 0.6 },
  });

  const doneSpring = spring({
    frame: Math.max(0, frame - effectiveNextDelay),
    fps,
    config: { damping: 20, mass: 0.6 },
  });

  // Opacity: 0.3 → 1.0 → 0.6
  let opacity = 0.3;
  if (isActive || isDone) {
    opacity = interpolate(activeSpring, [0, 1], [0.3, 1]);
  }
  if (isDone) {
    opacity = interpolate(doneSpring, [0, 1], [1, 0.6]);
  }

  // Scale: 1.0 → 1.03 → 1.0
  let scale = 1;
  if (isActive) {
    scale = interpolate(activeSpring, [0, 1], [1, 1.03]);
  }
  if (isDone) {
    scale = interpolate(doneSpring, [0, 1], [1.03, 1]);
  }

  // Accent bar width (left indicator)
  const barWidth = isActive ? interpolate(activeSpring, [0, 1], [0, 5]) : 0;

  // Glow intensity
  const glowIntensity = isActive
    ? interpolate(activeSpring, [0, 1], [0, 0.4])
    : 0;

  // Initial entrance (all cards fade in together at frame 8)
  const entranceProgress = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const entranceOpacity = interpolate(entranceProgress, [0, 1], [0, 1]);
  const entranceY = interpolate(entranceProgress, [0, 1], [20, 0]);

  return (
    <div style={{
      opacity: entranceOpacity * opacity,
      transform: `translateY(${entranceY}px) scale(${scale})`,
      background: COLORS.card,
      border: `1.5px solid ${isActive ? `${accentColor}88` : COLORS.cardBorder}`,
      borderRadius: 16, padding: '32px 36px',
      display: 'flex', alignItems: 'center', gap: 28,
      backdropFilter: 'blur(20px)',
      width: '100%', boxSizing: 'border-box',
      boxShadow: glowIntensity > 0
        ? `0 0 ${20 + glowIntensity * 30}px ${accentColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}`
        : 'none',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Active accent bar (left edge) */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: barWidth, background: accentColor,
        borderRadius: '16px 0 0 16px',
      }} />

      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: isActive ? `${accentColor}22` : COLORS.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.3s',
      }}>
        <DynamicIcon name={icon} size={32} color={isActive ? accentColor : COLORS.textMuted} />
      </div>

      <span style={{
        color: isActive ? COLORS.text : COLORS.textMuted,
        fontSize: 34, lineHeight: 1.4,
        fontFamily: "'Roboto', sans-serif", fontWeight: 400,
        transition: 'color 0.3s',
      }}>
        {text}<strong style={{
          color: isActive ? accentColor : COLORS.text,
          fontWeight: 700,
          transition: 'color 0.3s',
        }}>{boldText}</strong>
      </span>
    </div>
  );
};
