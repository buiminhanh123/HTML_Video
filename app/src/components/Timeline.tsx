import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../lib/store';
import { DynamicIcon } from '../lib/icons';

const FPS = 30;

/* ── Waveform helpers ── */
function drawWaveform(
  canvas: HTMLCanvasElement,
  waveformData: number[],
  totalFrames: number,
  audioDurationSec: number,
  zoom: number,
  scrollLeft: number,
  accentColor: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  if (!waveformData.length || !audioDurationSec) return;

  // Total timeline width in pixels (for all frames)
  const totalTimelinePx = width * zoom;
  // Audio occupies only a portion of the timeline
  const audioFrames = audioDurationSec * FPS;
  const audioPx = (audioFrames / totalFrames) * totalTimelinePx;
  // Map waveform samples to audio pixel width (not total timeline)
  const samplesPerPx = waveformData.length / audioPx;

  const startPx = Math.floor(scrollLeft);
  const endPx = Math.min(startPx + width, Math.ceil(audioPx));

  ctx.fillStyle = `${accentColor}33`;
  ctx.strokeStyle = `${accentColor}88`;
  ctx.lineWidth = 1;

  const mid = height / 2;
  ctx.beginPath();
  for (let px = startPx; px < endPx; px++) {
    const sampleIdx = Math.floor(px * samplesPerPx);
    if (sampleIdx >= waveformData.length) break;
    const val = waveformData[sampleIdx] || 0;
    const barH = val * mid * 0.9;
    const x = px - scrollLeft;
    ctx.moveTo(x, mid - barH);
    ctx.lineTo(x, mid + barH);
  }
  ctx.stroke();
}

/* ── Timeline Component ── */
export const Timeline: React.FC = () => {
  const {
    project, selectedSlideId, selectSlide, updateSlide, audioBlobUrl, currentFrame,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragState, setDragState] = useState<{
    type: 'element' | 'slideEndEdge' | 'slideStartEdge' | 'playhead';
    slideId: string;
    slideIndex?: number;
    elementIndex?: number;
    startX: number;
    startValue: number;
    prevDuration?: number;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const bodyRef = useRef<HTMLDivElement>(null);
  const LABEL_W = 32; // width of row labels

  const totalFrames = project.slides.reduce((s, sl) => s + sl.durationInFrames, 0);
  const totalSeconds = totalFrames / FPS;
  const trackWidth = Math.max(1, containerWidth - LABEL_W);
  const pxPerFrame = (trackWidth * zoom) / totalFrames;

  // Seek helper: pause → seek → resume to force audio re-sync
  const seekPlayer = useCallback((frame: number) => {
    const player = useEditorStore.getState()._playerRef;
    if (!player) return;
    const isPlaying = player.isPlaying();
    if (isPlaying) player.pause();
    player.seekTo(frame);
    useEditorStore.getState().setCurrentFrame(frame);
    if (isPlaying) {
      // Small delay to let audio element re-sync before resuming
      setTimeout(() => player.play(), 50);
    }
  }, []);

  // Decode audio to waveform
  useEffect(() => {
    if (!audioBlobUrl) { setWaveformData([]); setAudioDuration(0); return; }
    (async () => {
      try {
        const response = await fetch(audioBlobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new AudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const rawData = audioBuffer.getChannelData(0);
        const samples = 2000;
        const blockSize = Math.floor(rawData.length / samples);
        const data: number[] = [];
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          data.push(sum / blockSize);
        }
        // Normalize
        const max = Math.max(...data, 0.01);
        setWaveformData(data.map(v => v / max));
        setAudioDuration(audioBuffer.duration);
        audioCtx.close();
      } catch (e) {
        console.warn('Waveform decode error:', e);
      }
    })();
  }, [audioBlobUrl]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = trackWidth;
    canvas.height = 50;
    const accent = project.branding?.accentColor || '#10B981';
    drawWaveform(canvas, waveformData, totalFrames, audioDuration, zoom, scrollLeft, accent);
  }, [waveformData, trackWidth, zoom, scrollLeft, totalFrames, audioDuration, project.branding?.accentColor]);

  // Convert pixel X (relative to body left) to frame number
  const pxToFrame = useCallback((clientX: number) => {
    const bodyEl = bodyRef.current;
    if (!bodyEl) return 0;
    const rect = bodyEl.getBoundingClientRect();
    const x = clientX - rect.left + bodyEl.scrollLeft - LABEL_W;
    return Math.round(Math.max(0, Math.min(totalFrames - 1, x / pxPerFrame)));
  }, [pxPerFrame, totalFrames]);

  // Mouse drag handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const frameDelta = Math.round(dx / pxPerFrame);

    if (dragState.type === 'element') {
      const newDelay = Math.max(0, dragState.startValue + frameDelta);
      const slide = project.slides.find(s => s.id === dragState.slideId);
      if (!slide) return;
      const idx = dragState.elementIndex!;

      // Calculate absolute startTime from the new delay
      let slideStartFrame = 0;
      for (const s of project.slides) {
        if (s.id === slide.id) break;
        slideStartFrame += s.durationInFrames;
      }
      const newStartTime = (slideStartFrame + newDelay) / FPS;

      if (slide.type === 'title' || slide.type === 'list') {
        const bullets = [...(slide as any).bullets];
        bullets[idx] = { ...bullets[idx], delay: newDelay, startTime: newStartTime };
        updateSlide(slide.id, { bullets } as any);
      } else if (slide.type === 'grid') {
        const items = [...(slide as any).items];
        items[idx] = { ...items[idx], delay: newDelay, startTime: newStartTime };
        updateSlide(slide.id, { items } as any);
      } else if (slide.type === 'tag') {
        const tags = [...(slide as any).tags];
        tags[idx] = { ...tags[idx], delay: newDelay, startTime: newStartTime };
        updateSlide(slide.id, { tags } as any);
      }
    } else if (dragState.type === 'slideEndEdge') {
      const newDuration = Math.max(30, dragState.startValue + frameDelta);
      updateSlide(dragState.slideId, { durationInFrames: newDuration });
    } else if (dragState.type === 'slideStartEdge') {
      // Drag start edge: shrink/grow this slide AND adjust previous slide's duration
      const idx = dragState.slideIndex!;
      if (idx > 0) {
        const prevSlide = project.slides[idx - 1];
        const newPrevDuration = Math.max(30, (dragState.prevDuration ?? prevSlide.durationInFrames) + frameDelta);
        const newThisDuration = Math.max(30, dragState.startValue - frameDelta);
        updateSlide(prevSlide.id, { durationInFrames: newPrevDuration });
        updateSlide(dragState.slideId, { durationInFrames: newThisDuration });
      }
    } else if (dragState.type === 'playhead') {
      // Scrub: seek player to mouse position
      const bodyEl = bodyRef.current;
      if (bodyEl) {
        const frame = pxToFrame(e.clientX);
        const player = useEditorStore.getState()._playerRef;
        if (player) {
          player.pause();
          player.seekTo(frame);
        }
        useEditorStore.getState().setCurrentFrame(frame);
      }
    }
  }, [dragState, pxPerFrame, pxToFrame, project.slides, updateSlide, totalFrames]);

  const handleMouseUp = useCallback(() => { setDragState(null); }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Scroll handler for zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(10, Math.max(1, z + (e.deltaY > 0 ? -0.2 : 0.2))));
    } else {
      setScrollLeft(s => Math.max(0, Math.min(containerWidth * (zoom - 1), s + e.deltaY)));
    }
  };


  // Click on timeline body to seek + start scrub drag
  const handleBodyClick = (e: React.MouseEvent) => {
    const bodyEl = bodyRef.current;
    if (!bodyEl) return;
    if ((e.target as HTMLElement).closest('.tl-slide-block, .tl-element-marker')) return;

    const frame = pxToFrame(e.clientX);
    seekPlayer(frame);

    setDragState({
      type: 'playhead',
      slideId: '',
      startX: e.clientX,
      startValue: frame,
    });
  };

  // Get elements for a slide — supports both startTime (absolute sec) and delay (local frames)
  const getElements = (slide: any, slideStartFrame: number) => {
    const toLocalDelay = (el: any, fallback: number) => {
      if (el.startTime != null) {
        return Math.round(el.startTime * FPS) - slideStartFrame;
      }
      return el.delay ?? fallback;
    };
    const toLocalEnd = (el: any, fallbackDelay: number) => {
      if (el.endTime != null) {
        return Math.round(el.endTime * FPS) - slideStartFrame;
      }
      return fallbackDelay + 30; // default: 1 second after start
    };

    if (slide.type === 'title' || slide.type === 'list') {
      return (slide.bullets || []).map((b: any, i: number) => {
        const d = toLocalDelay(b, 20 + i * 18);
        return {
          label: b.boldText || b.text.slice(0, 15),
          delay: d,
          endDelay: toLocalEnd(b, d),
          startTime: b.startTime,
          endTime: b.endTime,
          index: i,
          color: '#3B82F6',
        };
      });
    }
    if (slide.type === 'grid') {
      return (slide.items || []).map((item: any, i: number) => {
        const d = toLocalDelay(item, 18 + i * 8);
        return {
          label: item.text.slice(0, 15),
          delay: d,
          endDelay: toLocalEnd(item, d),
          startTime: item.startTime,
          endTime: item.endTime,
          index: i,
          color: '#8B5CF6',
        };
      });
    }
    if (slide.type === 'tag') {
      return (slide.tags || []).map((t: any, i: number) => {
        const d = toLocalDelay(t, 28 + i * 10);
        return {
          label: t.text,
          delay: d,
          endDelay: toLocalEnd(t, d),
          startTime: t.startTime,
          endTime: t.endTime,
          index: i,
          color: t.color || '#F59E0B',
        };
      });
    }
    return [];
  };

  // Time ruler
  const renderRuler = () => {
    const marks = [];
    const interval = zoom > 3 ? 1 : zoom > 1.5 ? 2 : 5;
    for (let sec = 0; sec <= totalSeconds; sec += interval) {
      const x = LABEL_W + (sec * FPS * pxPerFrame) - scrollLeft;
      if (x < -20 || x > containerWidth + 20) continue;
      marks.push(
        <div key={sec} className="tl-ruler-mark" style={{ left: x }}>
          <span>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</span>
        </div>
      );
    }
    return marks;
  };

  // Slide colors
  const slideColors: Record<string, string> = {
    title: '#EF4444', list: '#3B82F6', grid: '#8B5CF6', tag: '#F59E0B', outro: '#6B7280',
  };

  let offsetFrame = 0;

  return (
    <div className="timeline-panel" ref={containerRef} onWheel={handleWheel}>
      {/* Header */}
      <div className="tl-header">
        <span className="tl-title">⏱ Timeline</span>
        <div className="tl-controls">
          <span className="tl-zoom-label">Zoom</span>
          <input type="range" min={1} max={8} step={0.1} value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))} className="tl-zoom-slider" />
          <span className="tl-zoom-value">{zoom.toFixed(1)}x</span>
        </div>
      </div>

      {/* Timeline body */}
      <div className="tl-body" ref={bodyRef} onMouseDown={handleBodyClick}>
        {/* Ruler */}
        <div className="tl-ruler">{renderRuler()}</div>

        {/* Playhead */}
        <div
          className="tl-playhead"
          style={{ left: LABEL_W + currentFrame * pxPerFrame - scrollLeft }}
        >
          <div className="tl-playhead-head" />
          <div className="tl-playhead-line" />
        </div>

        {/* Waveform */}
        <div className="tl-waveform-row">
          <div className="tl-row-label">🔊</div>
          <div className="tl-track">
            <canvas ref={canvasRef} className="tl-waveform-canvas" />
          </div>
        </div>

        {/* Slide tracks */}
        {project.slides.map((slide, slideIndex) => {
          const slideStart = offsetFrame;
          const slideWidth = slide.durationInFrames * pxPerFrame;
          const slideLeft = slideStart * pxPerFrame - scrollLeft;
          offsetFrame += slide.durationInFrames;

          const elements = getElements(slide, slideStart);
          const isSelected = slide.id === selectedSlideId;
          const color = slideColors[slide.type] || '#6B7280';

          return (
            <div key={slide.id} className={`tl-slide-row ${isSelected ? 'selected' : ''}`}>
              <div className="tl-row-label" onClick={() => selectSlide(slide.id)}>
                {slide.type === 'outro'
                  ? <DynamicIcon name="Clapperboard" size={16} color="#9CA3AF" />
                  : <DynamicIcon name={(slide as any).icon || 'FileText'} size={16} color="#9CA3AF" />
                }
              </div>
              <div className="tl-track">
                {/* Slide block */}
                <div
                  className="tl-slide-block"
                  style={{
                    left: slideLeft, width: slideWidth,
                    background: `${color}33`, borderColor: `${color}88`,
                  }}
                  onClick={() => selectSlide(slide.id)}
                >
                  <span className="tl-slide-label">{slide.type}</span>

                  {/* Element markers (bars showing start→end) */}
                  {elements.map((el: any) => {
                    const markerLeft = el.delay * pxPerFrame;
                    const markerWidth = Math.max(4, (el.endDelay - el.delay) * pxPerFrame);
                    const timeLabel = el.startTime != null
                      ? `${el.startTime.toFixed(2)}s → ${el.endTime?.toFixed(2) ?? '?'}s`
                      : `delay: ${el.delay}f / ${(el.delay / FPS).toFixed(1)}s`;
                    return (
                      <div
                        key={el.index}
                        className="tl-element-bar"
                        style={{
                          left: markerLeft,
                          width: markerWidth,
                          background: `${el.color}66`,
                          borderLeft: `2px solid ${el.color}`,
                        }}
                        title={`${el.label} (${timeLabel})`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragState({
                            type: 'element',
                            slideId: slide.id,
                            elementIndex: el.index,
                            startX: e.clientX,
                            startValue: el.delay,
                          });
                        }}
                      >
                        <span className="tl-marker-label">{el.label}</span>
                      </div>
                    );
                  })}

                  {/* Left resize handle (start time) */}
                  {slideIndex > 0 && (
                    <div
                      className="tl-resize-handle tl-resize-left"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const prevSlide = project.slides[slideIndex - 1];
                        setDragState({
                          type: 'slideStartEdge',
                          slideId: slide.id,
                          slideIndex,
                          startX: e.clientX,
                          startValue: slide.durationInFrames,
                          prevDuration: prevSlide.durationInFrames,
                        });
                      }}
                    />
                  )}

                  {/* Right resize handle (end time) */}
                  <div
                    className="tl-resize-handle tl-resize-right"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragState({
                        type: 'slideEndEdge',
                        slideId: slide.id,
                        startX: e.clientX,
                        startValue: slide.durationInFrames,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dragState && <div className="tl-drag-overlay" />}

      {/* Current time display */}
      <div className="tl-time-display">
        {Math.floor(currentFrame / FPS / 60)}:{String(Math.floor((currentFrame / FPS) % 60)).padStart(2, '0')}.{String(Math.round(((currentFrame / FPS) % 1) * 10)).padStart(1, '0')}
        <span className="tl-frame-num"> f{currentFrame}</span>
      </div>
    </div>
  );
};
