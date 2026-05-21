import React, { useState } from 'react';
import { useEditorStore } from '../lib/store';
import { ICON_LIST, ACCENT_PRESETS, COLORS } from '../lib/constants';
import type { Slide, BulletItem, GridItem, TagItem, TitleSlide, ListSlide, GridSlide, TagSlide, OutroSlide } from '../lib/types';

/* ── Icon Picker (compact) ── */
const IconPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="icon-picker" style={{ display: 'inline-block' }}>
      <button className="icon-picker-trigger" onClick={() => setOpen(!open)}>{value}</button>
      {open && (
        <div className="icon-picker-dropdown">
          {ICON_LIST.map((ic) => (
            <button key={ic} className={`icon-option ${ic === value ? 'active' : ''}`}
              onClick={() => { onChange(ic); setOpen(false); }}>{ic}</button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Inline editors ── */
const BulletEditor: React.FC<{ bullets: BulletItem[]; onChange: (b: BulletItem[]) => void }> = ({ bullets, onChange }) => {
  const update = (i: number, f: keyof BulletItem, v: string) => onChange(bullets.map((b, j) => j === i ? { ...b, [f]: v } : b));
  return (
    <div className="acc-editor">
      <label className="field-label">Bullets</label>
      {bullets.map((b, i) => (
        <div key={i} className="bullet-row">
          <IconPicker value={b.icon} onChange={(v) => update(i, 'icon', v)} />
          <div className="bullet-fields">
            <input placeholder="Text..." value={b.text} onChange={(e) => update(i, 'text', e.target.value)} />
            <input placeholder="Bold..." value={b.boldText} onChange={(e) => update(i, 'boldText', e.target.value)} />
          </div>
          <button className="btn-icon btn-danger" onClick={() => onChange(bullets.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="btn-add-item" onClick={() => onChange([...bullets, { icon: '💡', text: '', boldText: '' }])}>+ Bullet</button>
    </div>
  );
};

const GridEditor: React.FC<{ items: GridItem[]; onChange: (i: GridItem[]) => void }> = ({ items, onChange }) => {
  const update = (i: number, f: keyof GridItem, v: string) => onChange(items.map((item, j) => j === i ? { ...item, [f]: v } : item));
  return (
    <div className="acc-editor">
      <label className="field-label">Grid Items</label>
      {items.map((item, i) => (
        <div key={i} className="bullet-row">
          <IconPicker value={item.icon} onChange={(v) => update(i, 'icon', v)} />
          <input className="flex-input" placeholder="Text..." value={item.text} onChange={(e) => update(i, 'text', e.target.value)} />
          <button className="btn-icon btn-danger" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="btn-add-item" onClick={() => onChange([...items, { icon: '💡', text: '' }])}>+ Item</button>
    </div>
  );
};

const TagEditor: React.FC<{ tags: TagItem[]; onChange: (t: TagItem[]) => void }> = ({ tags, onChange }) => {
  const update = (i: number, f: keyof TagItem, v: string) => onChange(tags.map((t, j) => j === i ? { ...t, [f]: v } : t));
  return (
    <div className="acc-editor">
      <label className="field-label">Tags</label>
      {tags.map((t, i) => (
        <div key={i} className="bullet-row">
          <input type="color" value={t.color} onChange={(e) => update(i, 'color', e.target.value)} className="color-input-small" />
          <input className="flex-input" value={t.text} onChange={(e) => update(i, 'text', e.target.value)} />
          <button className="btn-icon btn-danger" onClick={() => onChange(tags.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="btn-add-item" onClick={() => onChange([...tags, { text: '#NewTag', color: COLORS.accent }])}>+ Tag</button>
    </div>
  );
};

/* ── Accordion Slide Properties ── */
const SlideProperties: React.FC<{ slide: Slide }> = ({ slide }) => {
  const { updateSlide, updateBranding, project } = useEditorStore();
  const update = (u: Partial<Slide>) => updateSlide(slide.id, u);

  return (
    <div className="acc-props">
      <div className="acc-props-row">
        <div className="field-group" style={{ flex: 1 }}>
          <label className="field-label">Duration (s)</label>
          <input type="number" min={1} max={60} step={0.5}
            value={slide.durationInFrames / 30}
            onChange={(e) => update({ durationInFrames: Math.round(parseFloat(e.target.value) * 30) })} />
        </div>
        {slide.type !== 'outro' && (
          <div className="field-group" style={{ flex: 0 }}>
            <label className="field-label">Icon</label>
            <IconPicker value={(slide as any).icon} onChange={(v) => update({ icon: v } as any)} />
          </div>
        )}
      </div>

      {slide.type !== 'outro' && (
        <div className="acc-props-row">
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Title</label>
            <input value={(slide as any).title} onChange={(e) => update({ title: e.target.value } as any)} />
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Accent</label>
            <input value={(slide as any).titleAccent} onChange={(e) => update({ titleAccent: e.target.value } as any)} />
          </div>
        </div>
      )}

      {(slide.type === 'title' || slide.type === 'list') && (
        <BulletEditor bullets={(slide as TitleSlide | ListSlide).bullets}
          onChange={(bullets) => update({ bullets } as any)} />
      )}
      {slide.type === 'grid' && (
        <GridEditor items={(slide as GridSlide).items}
          onChange={(items) => update({ items } as any)} />
      )}
      {slide.type === 'tag' && (
        <>
          <div className="field-group">
            <label className="field-label">Subtitle</label>
            <input value={(slide as TagSlide).subtitle}
              onChange={(e) => update({ subtitle: e.target.value } as any)} />
          </div>
          <TagEditor tags={(slide as TagSlide).tags}
            onChange={(tags) => update({ tags } as any)} />
        </>
      )}
      {slide.type === 'outro' && (
        <div className="acc-props-row">
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Platform</label>
            <select value={(slide as OutroSlide).platform}
              onChange={(e) => update({ platform: e.target.value } as any)}>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Username</label>
            <input value={(slide as OutroSlide).username}
              onChange={(e) => update({ username: e.target.value } as any)} />
          </div>
        </div>
      )}


    </div>
  );
};

/* ── Main SlidePanel V2 (Accordion) ── */
export const SlidePanelV2: React.FC = () => {
  const { project, selectedSlideId, selectSlide, addSlide, removeSlide, duplicateSlide, moveSlide, updateBranding } = useEditorStore();

  const typeIcons: Record<string, string> = {
    title: '🌟', list: '📋', grid: '🔲', tag: '🏷️', outro: '🎬',
  };

  return (
    <div className="slide-panel-v2">
      <div className="panel-header">
        <h3>Slides</h3>
        <span className="slide-count">{project.slides.length}</span>
      </div>

      <div className="acc-slide-list">
        {project.slides.map((slide, i) => {
          const isSelected = slide.id === selectedSlideId;
          const label = slide.type === 'outro'
            ? `Outro - ${(slide as OutroSlide).platform}`
            : `${(slide as any).title || ''} ${(slide as any).titleAccent || ''}`.trim();

          return (
            <div key={slide.id} className={`acc-slide ${isSelected ? 'open' : ''}`}>
              {/* Slide header */}
              <div className="acc-slide-header" onClick={() => selectSlide(isSelected ? null as any : slide.id)}>
                <div className="acc-slide-left">
                  <span className="acc-slide-num">{i + 1}</span>
                  <span className="acc-slide-icon">{typeIcons[slide.type]}</span>
                  <span className="acc-slide-type">{slide.type}</span>
                  <span className="acc-slide-label">{label}</span>
                </div>
                <div className="acc-slide-right">
                  <span className="acc-slide-dur">{(slide.durationInFrames / 30).toFixed(1)}s</span>
                  <div className="acc-slide-actions">
                    {i > 0 && <button className="btn-icon" onClick={(e) => { e.stopPropagation(); moveSlide(i, i - 1); }}>▲</button>}
                    {i < project.slides.length - 1 && <button className="btn-icon" onClick={(e) => { e.stopPropagation(); moveSlide(i, i + 1); }}>▼</button>}
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }}>📋</button>
                    <button className="btn-icon btn-danger" onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }}>🗑️</button>
                  </div>
                  <span className="acc-chevron">{isSelected ? '▾' : '▸'}</span>
                </div>
              </div>

              {/* Expanded properties */}
              {isSelected && <SlideProperties slide={slide} />}
            </div>
          );
        })}
      </div>

      {/* Add slide */}
      <div className="add-slide-menu">
        <div className="add-slide-buttons">
          {(['title', 'list', 'grid', 'tag', 'outro'] as const).map(t => (
            <button key={t} className="btn-add-slide" onClick={() => addSlide(t)}>
              {typeIcons[t]} {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
