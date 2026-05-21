import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './Video';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from '../lib/constants';

// This Root is used by Remotion CLI for rendering
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HTMLVideo"
      component={VideoComposition}
      durationInFrames={900}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={{
        slides: [],
        branding: { username: 'escbase', accentColor: '#10B981' },
      }}
    />
  );
};
