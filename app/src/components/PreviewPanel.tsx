import React, { useRef, useEffect, useMemo } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { VideoComposition } from '../remotion/Video';
import { useEditorStore } from '../lib/store';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from '../lib/constants';

export const PreviewPanel: React.FC = () => {
  // Use selectors to prevent re-renders when currentFrame changes
  const project = useEditorStore((s) => s.project);
  const ref = useRef<PlayerRef>(null);

  // Store the ref globally so Timeline can access it
  useEffect(() => {
    useEditorStore.getState()._playerRef = ref.current;
    return () => { useEditorStore.getState()._playerRef = null; };
  });

  // Poll current frame from player — use getState() to avoid triggering re-render
  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        const frame = ref.current.getCurrentFrame();
        // Only update if frame actually changed (avoids unnecessary store writes)
        const prev = useEditorStore.getState().currentFrame;
        if (frame !== prev) {
          useEditorStore.getState().setCurrentFrame(frame);
        }
      }
    }, 1000 / 15);
    return () => clearInterval(interval);
  }, []);

  const totalFrames = project.slides.reduce((s, sl) => s + sl.durationInFrames, 0) || 1;

  // Memoize inputProps to prevent Remotion Player from re-mounting Audio on every render
  const inputProps = useMemo(() => ({
    slides: project.slides,
    branding: project.branding,
    audio: project.audio,
  }), [project.slides, project.branding, project.audio]);

  return (
    <div className="preview-panel">
      <div className="preview-container">
        <Player
          ref={ref}
          component={VideoComposition as any}
          inputProps={inputProps}
          durationInFrames={totalFrames}
          fps={VIDEO_FPS}
          compositionWidth={VIDEO_WIDTH}
          compositionHeight={VIDEO_HEIGHT}
          style={{ width: '100%', height: '100%' }}
          controls
          autoPlay={false}
          loop
        />
      </div>
    </div>
  );
};
