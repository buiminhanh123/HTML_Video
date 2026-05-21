import React, { useState } from 'react';
import { useEditorStore } from '../lib/store';
import { ICON_LIST, ACCENT_PRESETS, COLORS } from '../lib/constants';
import type { Slide, BulletItem, GridItem, TagItem, TitleSlide, ListSlide, GridSlide, TagSlide, OutroSlide } from '../lib/types';

/* ── Icon Picker ── */
const IconPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="icon-picker">
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

/* ── Bullet Editor ── */
const BulletEditor: React.FC<{
  bullets: BulletItem[];
  onChange: (bullets: BulletItem[]) => void;
}> = ({ bullets, onChange }) => {
  const update = (i: number, field: keyof BulletItem, val: string) => {
    const next = bullets.map((b, j) => j === i ? { ...b, [field]: val } : b);
    onChange(next);
  };
  const add = () => onChange([...bullets, { icon: '💡', text: '', boldText: '' }]);
  const remove = (i: number) => onChange(bullets.filter((_, j) => j !== i));

  return (
    <div className="bullet-editor">
      <label className="field-label">Bullet Points</label>
      {bullets.map((b, i) => (
        <div key={i} className="bullet-row">
          <IconPicker value={b.icon} onChange={(v) => update(i, 'icon', v)} />
          <div className="bullet-fields">
            <input placeholder="Text..." value={b.text} onChange={(e) => update(i, 'text', e.target.value)} />
            <input placeholder="Bold text..." value={b.boldText} onChange={(e) => update(i, 'boldText', e.target.value)} />
          </div>
          <button className="btn-icon btn-danger" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="btn-add-item" onClick={add}>+ Add bullet</button>
    </div>
  );
};

/* ── Grid Items Editor ── */
const GridEditor: React.FC<{
  items: GridItem[];
  onChange: (items: GridItem[]) => void;
}> = ({ items, onChange }) => {
  const update = (i: number, field: keyof GridItem, val: string) => {
    const next = items.map((item, j) => j === i ? { ...item, [field]: val } : item);
    onChange(next);
  };
  const add = () => onChange([...items, { icon: '💡', text: '' }]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="bullet-editor">
      <label className="field-label">Grid Items</label>
      {items.map((item, i) => (
        <div key={i} className="bullet-row">
          <IconPicker value={item.icon} onChange={(v) => update(i, 'icon', v)} />
          <input className="flex-input" placeholder="Text..." value={item.text} onChange={(e) => update(i, 'text', e.target.value)} />
          <button className="btn-icon btn-danger" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="btn-add-item" onClick={add}>+ Add item</button>
    </div>
  );
};

/* ── Tag Items Editor ── */
const TagEditor: React.FC<{
  tags: TagItem[];
  onChange: (tags: TagItem[]) => void;
}> = ({ tags, onChange }) => {
  const update = (i: number, field: keyof TagItem, val: string) => {
    const next = tags.map((t, j) => j === i ? { ...t, [field]: val } : t);
    onChange(next);
  };
  const add = () => onChange([...tags, { text: '#NewTag', color: COLORS.accent }]);
  const remove = (i: number) => onChange(tags.filter((_, j) => j !== i));

  return (
    <div className="bullet-editor">
      <label className="field-label">Tags</label>
      {tags.map((t, i) => (
        <div key={i} className="bullet-row">
          <input type="color" value={t.color} onChange={(e) => update(i, 'color', e.target.value)} className="color-input-small" />
          <input className="flex-input" value={t.text} onChange={(e) => update(i, 'text', e.target.value)} />
          <button className="btn-icon btn-danger" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="btn-add-item" onClick={add}>+ Add tag</button>
    </div>
  );
};

/* ── Main Property Panel ── */
export const PropertyPanel: React.FC = () => {
  const { project, selectedSlideId, updateSlide, updateBranding } = useEditorStore();
  const slide = project.slides.find((s) => s.id === selectedSlideId);

  if (!slide) {
    return (
      <div className="property-panel">
        <div className="panel-header"><h3>Properties</h3></div>
        <p className="empty-state">Select a slide to edit</p>
      </div>
    );
  }

  const update = (updates: Partial<Slide>) => updateSlide(slide.id, updates);

  return (
    <div className="property-panel">
      <div className="panel-header"><h3>Properties</h3></div>
      <div className="property-scroll">
        {/* Duration */}
        <div className="field-group">
          <label className="field-label">Duration (seconds)</label>
          <input type="number" min={1} max={30} step={0.5}
            value={slide.durationInFrames / 30}
            onChange={(e) => update({ durationInFrames: Math.round(parseFloat(e.target.value) * 30) })} />
        </div>

        {/* Common fields for title/list/grid/tag */}
        {slide.type !== 'outro' && (
          <>
            <div className="field-group">
              <label className="field-label">Icon</label>
              <IconPicker value={(slide as any).icon} onChange={(v) => update({ icon: v } as any)} />
            </div>
            <div className="field-group">
              <label className="field-label">Title</label>
              <input value={(slide as any).title} onChange={(e) => update({ title: e.target.value } as any)} />
            </div>
            <div className="field-group">
              <label className="field-label">Title Accent (colored)</label>
              <input value={(slide as any).titleAccent} onChange={(e) => update({ titleAccent: e.target.value } as any)} />
            </div>
          </>
        )}

        {/* Type-specific editors */}
        {(slide.type === 'title' || slide.type === 'list') && (
          <BulletEditor
            bullets={(slide as TitleSlide | ListSlide).bullets}
            onChange={(bullets) => update({ bullets } as any)}
          />
        )}

        {slide.type === 'grid' && (
          <GridEditor
            items={(slide as GridSlide).items}
            onChange={(items) => update({ items } as any)}
          />
        )}

        {slide.type === 'tag' && (
          <>
            <div className="field-group">
              <label className="field-label">Subtitle</label>
              <textarea value={(slide as TagSlide).subtitle}
                onChange={(e) => update({ subtitle: e.target.value } as any)} rows={2} />
            </div>
            <TagEditor
              tags={(slide as TagSlide).tags}
              onChange={(tags) => update({ tags } as any)}
            />
          </>
        )}

        {slide.type === 'outro' && (
          <>
            <div className="field-group">
              <label className="field-label">Platform</label>
              <select value={(slide as OutroSlide).platform}
                onChange={(e) => update({ platform: e.target.value } as any)}>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Username</label>
              <input value={(slide as OutroSlide).username}
                onChange={(e) => update({ username: e.target.value } as any)} />
            </div>
          </>
        )}

        {/* Branding section */}
        <div className="section-divider" />
        <h4 className="section-title">🎨 Branding</h4>
        <div className="field-group">
          <label className="field-label">Username</label>
          <input value={project.branding.username}
            onChange={(e) => updateBranding({ username: e.target.value })} />
        </div>
        <div className="field-group">
          <label className="field-label">Accent Color</label>
          <div className="color-presets">
            {ACCENT_PRESETS.map((p) => (
              <button key={p.color} className={`color-swatch ${project.branding.accentColor === p.color ? 'active' : ''}`}
                style={{ background: p.color }} onClick={() => updateBranding({ accentColor: p.color })}
                title={p.name} />
            ))}
          </div>
        </div>

        {/* Audio section */}
        {project.audio && (
          <>
            <div className="section-divider" />
            <h4 className="section-title">🔊 Audio</h4>
            <div className="field-group">
              <label className="field-label">Volume ({Math.round((project.audio.volume ?? 1) * 100)}%)</label>
              <input type="range" min={0} max={1} step={0.05}
                value={project.audio.volume ?? 1}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  const store = useEditorStore.getState();
                  store.setAudio(store.audioBlobUrl!, vol);
                }}
                className="volume-slider" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
