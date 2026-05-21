import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings, getModels } from '../lib/gemini';
import type { GeminiSettings } from '../lib/gemini';

interface Props { onClose: () => void; }

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const [settings, setSettings] = useState<GeminiSettings>({ apiKey: '', preferredModel: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSettings(loadSettings()); }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const models = getModels();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <div className="settings-group">
            <label className="settings-label">Gemini API Key</label>
            <input
              type="password"
              className="settings-input"
              placeholder="AIza..."
              value={settings.apiKey}
              onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
            />
            <span className="settings-hint">
              Lấy miễn phí tại{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">
                aistudio.google.com
              </a>
            </span>
          </div>

          <div className="settings-group">
            <label className="settings-label">Preferred Model</label>
            <select
              className="settings-select"
              value={settings.preferredModel}
              onChange={e => setSettings({ ...settings, preferredModel: e.target.value })}
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <span className="settings-hint">
              Nếu model này lỗi, tự động chuyển sang model khác
            </span>
          </div>

          <div className="settings-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? '✅ Đã lưu!' : '💾 Lưu Settings'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
};
