import React from 'react';
import { useEditorStore } from '../lib/store';
import type { Slide } from '../lib/types';

const SLIDE_LABELS: Record<string, string> = {
  title: '📌 Title', list: '📋 List', grid: '🔲 Grid', tag: '🏷️ Tag', outro: '🎬 Outro',
};

const SlideThumb: React.FC<{ slide: Slide; index: number; isSelected: boolean }> = ({ slide, index, isSelected }) => {
  const { selectSlide, removeSlide, duplicateSlide } = useEditorStore();
  const label = SLIDE_LABELS[slide.type] || slide.type;
  const title = slide.type === 'outro'
    ? `Outro - ${slide.platform}`
    : 'title' in slide ? `${(slide as any).title} ${(slide as any).titleAccent || ''}` : '';

  return (
    <div className={`slide-thumb ${isSelected ? 'selected' : ''}`} onClick={() => selectSlide(slide.id)}>
      <div className="slide-thumb-header">
        <span className="slide-thumb-index">{index + 1}</span>
        <span className="slide-thumb-type">{label}</span>
      </div>
      <div className="slide-thumb-title">{title}</div>
      <div className="slide-thumb-duration">{(slide.durationInFrames / 30).toFixed(1)}s</div>
      <div className="slide-thumb-actions">
        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }} title="Duplicate">📋</button>
        <button className="btn-icon btn-danger" onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }} title="Remove">🗑️</button>
      </div>
    </div>
  );
};

export const SlidePanel: React.FC = () => {
  const { project, selectedSlideId, addSlide, moveSlide } = useEditorStore();

  return (
    <div className="slide-panel">
      <div className="panel-header">
        <h3>Slides</h3>
        <span className="slide-count">{project.slides.length}</span>
      </div>

      <div className="slide-list">
        {project.slides.map((slide, i) => (
          <div key={slide.id} className="slide-item-wrapper">
            {i > 0 && (
              <button className="btn-move-up" onClick={() => moveSlide(i, i - 1)} title="Move up">▲</button>
            )}
            <SlideThumb slide={slide} index={i} isSelected={slide.id === selectedSlideId} />
            {i < project.slides.length - 1 && (
              <button className="btn-move-down" onClick={() => moveSlide(i, i + 1)} title="Move down">▼</button>
            )}
          </div>
        ))}
      </div>

      <div className="add-slide-menu">
        <p className="add-slide-label">+ Add Slide</p>
        <div className="add-slide-buttons">
          {(['title', 'list', 'grid', 'tag', 'outro'] as const).map((type) => (
            <button key={type} className="btn-add-slide" onClick={() => addSlide(type)}>
              {SLIDE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
