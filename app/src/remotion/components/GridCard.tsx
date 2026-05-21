import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS } from '../../lib/constants';
import { DynamicIcon } from '../../lib/icons';

interface Props {
  icon: string;
  text: string;
  index: number;
  delay: number;
  nextDelay: number;
  accentColor?: string;
  startTime?: number;
  endTime?: number;
  nextStartTime?: number;
  slideStartFrame?: number;
}

export const GridCard: React.FC<Props> = ({
  icon, text, index, delay, nextDelay, accentColor = COLORS.accent,
  startTime, endTime, nextStartTime, slideStartFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const effectiveDelay = startTime != null
    ? Math.round(startTime * fps) - slideStartFrame : delay;
  const effectiveNextDelay = endTime != null
    ? Math.round(endTime * fps) - slideStartFrame
    : nextStartTime != null
      ? Math.round(nextStartTime * fps) - slideStartFrame : nextDelay;

  const isActive = frame >= effectiveDelay && frame < effectiveNextDelay;
  const isDone = frame >= effectiveNextDelay;

  const activeSpring = spring({
    frame: Math.max(0, frame - effectiveDelay), fps,
    config: { damping: 20, mass: 0.6 },
  });

  const doneSpring = spring({
    frame: Math.max(0, frame - effectiveNextDelay), fps,
    config: { damping: 20, mass: 0.6 },
  });

  // Opacity: 0.3 → 1.0 → 0.6
  let opacity = 0.3;
  if (isActive || isDone) opacity = interpolate(activeSpring, [0, 1], [0.3, 1]);
  if (isDone) opacity = interpolate(doneSpring, [0, 1], [1, 0.6]);

  // Scale
  let scale = 1;
  if (isActive) scale = interpolate(activeSpring, [0, 1], [1, 1.04]);
  if (isDone) scale = interpolate(doneSpring, [0, 1], [1.04, 1]);

  // Glow
  const glowIntensity = isActive ? interpolate(activeSpring, [0, 1], [0, 0.5]) : 0;

  // Initial entrance (all cards appear together)
  const entranceProgress = spring({ frame: frame - 8 - index * 3, fps, config: { damping: 18 } });
  const entranceOpacity = interpolate(entranceProgress, [0, 1], [0, 1]);
  const entranceScale = interpolate(entranceProgress, [0, 1], [0.85, 1]);

  const borderColor = isActive ? `${accentColor}88` : COLORS.cardBorder;

  return (
    <div style={{
      opacity: entranceOpacity * opacity,
      transform: `scale(${entranceScale * scale})`,
      background: isActive ? `${COLORS.card}` : COLORS.card,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 18, padding: '36px 24px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      backdropFilter: 'blur(20px)',
      boxShadow: glowIntensity > 0
        ? `0 0 ${25 + glowIntensity * 30}px ${accentColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}, inset 0 0 20px ${accentColor}11`
        : 'none',
    }}>
      <div style={{
        transform: isActive ? `scale(${interpolate(activeSpring, [0, 1], [1, 1.15])})` : 'scale(1)',
      }}>
        <DynamicIcon name={icon} size={48} color={isActive ? accentColor : COLORS.textMuted} />
      </div>
      <span style={{
        color: isActive ? accentColor : (isDone ? COLORS.text : COLORS.textMuted),
        fontSize: 32, lineHeight: 1.35,
        fontFamily: "'Roboto', sans-serif",
        fontWeight: isActive ? 600 : 500,
        textAlign: 'center',
        transition: 'color 0.2s',
      }}>{text}</span>
    </div>
  );
};
