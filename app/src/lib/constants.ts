import type { BrandingConfig } from './types';

// Video dimensions (9:16 vertical)
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

// Default durations (in frames at 30fps)
export const DEFAULT_SLIDE_DURATION = 300; // 10 seconds
export const TITLE_SLIDE_DURATION = 270;   // 9 seconds
export const OUTRO_SLIDE_DURATION = 150;   // 5 seconds

// Animation timing (in frames)
export const ANIM = {
  FADE_IN: 15,
  SLIDE_UP: 20,
  STAGGER: 18,
  HOLD_DELAY: 10,
  HIGHLIGHT: 20,
  FADE_OUT: 15,
};

// Colors - matching escbase style using CSS variables for theme support
export const COLORS = {
  bg: 'var(--color-bg, #0a0e1a)',
  bgGradient: 'var(--color-bg-gradient, #0d1f2d)',
  card: 'var(--color-card, rgba(20, 30, 45, 0.7))',
  cardBorder: 'var(--color-card-border, rgba(255, 255, 255, 0.08))',
  cardHighlight: 'rgba(16, 185, 129, 0.5)',
  accent: '#10B981',
  accentPurple: '#8B5CF6',
  accentOrange: '#F59E0B',
  accentRed: '#EF4444',
  accentBlue: '#3B82F6',
  text: 'var(--color-text, #FFFFFF)',
  textMuted: 'var(--color-text-muted, rgba(255, 255, 255, 0.65))',
  iconBg: 'var(--color-icon-bg, rgba(30, 40, 55, 0.9))',
};

// Default branding
export const DEFAULT_BRANDING: BrandingConfig = {
  username: 'escbasexyz',
  accentColor: '#f26522',
  theme: 'dark',
};

// Available icons for picker
export const ICON_LIST = [
  '💻', '🖥️', '📱', '⌨️', '🔧', '⚡', '🚀', '🔥',
  '💡', '🎯', '📊', '📈', '🔍', '🔐', '🌐', '☁️',
  '🤖', '🧠', '💎', '🎨', '🎵', '📸', '🎬', '🕹️',
  '🔔', '💬', '📝', '📋', '✅', '❌', '⚠️', '💰',
  '🏆', '⭐', '🎉', '👨‍💻', '👩‍💻', '🛡️', '🔗', '📡',
];

// Accent color presets
export const ACCENT_PRESETS = [
  { name: 'Orange', color: '#f26522' },
  { name: 'Emerald', color: '#10B981' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Cyan', color: '#06B6D4' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Lime', color: '#84CC16' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Rose', color: '#F43F5E' },
  { name: 'Amber', color: '#F59E0B' },
  { name: 'Violet', color: '#7C3AED' },
  { name: 'Fuchsia', color: '#D946EF' },
  { name: 'Sky', color: '#0EA5E9' },
];
