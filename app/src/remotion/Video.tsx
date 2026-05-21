import React from 'react';
import { Sequence, useVideoConfig, Audio, staticFile } from 'remotion';
import type { Slide, VideoProject } from '../lib/types';
import { TitleScene } from './scenes/TitleScene';
import { ListScene } from './scenes/ListScene';
import { GridScene } from './scenes/GridScene';
import { TagScene } from './scenes/TagScene';
import { OutroScene } from './scenes/OutroScene';

interface Props {
  slides: Slide[];
  branding: VideoProject['branding'];
  audio?: VideoProject['audio'];
}

const renderSlide = (slide: Slide, username: string, accentColor: string, slideStartFrame: number) => {
  switch (slide.type) {
    case 'title':
      return <TitleScene slide={slide} username={username} accentColor={accentColor} slideStartFrame={slideStartFrame} />;
    case 'list':
      return <ListScene slide={slide} username={username} accentColor={accentColor} slideStartFrame={slideStartFrame} />;
    case 'grid':
      return <GridScene slide={slide} username={username} accentColor={accentColor} slideStartFrame={slideStartFrame} />;
    case 'tag':
      return <TagScene slide={slide} username={username} accentColor={accentColor} slideStartFrame={slideStartFrame} />;
    case 'outro':
      return <OutroScene slide={slide} accentColor={accentColor} />;
    default:
      return null;
  }
};

export const VideoComposition: React.FC<Props> = ({ slides, branding, audio }) => {
  const theme = branding.theme || 'dark';
  let currentFrame = 0;

  const getThemeVariables = () => {
    return theme === 'light' ? {
      '--color-bg': '#f5f7fa',
      '--color-bg-gradient': '#e4e8f0',
      '--color-card': 'rgba(255, 255, 255, 0.9)',
      '--color-card-border': 'rgba(0, 0, 0, 0.08)',
      '--color-text': '#333333',
      '--color-text-muted': '#666666',
      '--color-icon-bg': 'rgba(0, 0, 0, 0.05)',
    } : {
      '--color-bg': '#0a0e1a',
      '--color-bg-gradient': '#0d1f2d',
      '--color-card': 'rgba(20, 30, 45, 0.7)',
      '--color-card-border': 'rgba(255, 255, 255, 0.08)',
      '--color-text': '#FFFFFF',
      '--color-text-muted': 'rgba(255, 255, 255, 0.65)',
      '--color-icon-bg': 'rgba(30, 40, 55, 0.9)',
    };
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      fontFamily: "'Roboto', 'Segoe UI', sans-serif",
      ...(getThemeVariables() as React.CSSProperties)
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;800;900&display=swap');
        `}
      </style>
      {slides.map((slide) => {
        const from = currentFrame;
        currentFrame += slide.durationInFrames;
        return (
          <Sequence key={slide.id} from={from} durationInFrames={slide.durationInFrames}
            name={`${slide.type}-${slide.id.slice(0, 6)}`}>
            {renderSlide(slide, branding.username, branding.accentColor, from)}
          </Sequence>
        );
      })}
      {audio?.src && (
        <Audio src={audio.src} volume={audio.volume ?? 0.5} />
      )}
    </div>
  );
};
