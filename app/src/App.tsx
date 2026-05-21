import React, { useState } from 'react';
import { SlidePanelV2 } from './components/SlidePanelV2';
import { PreviewPanel } from './components/PreviewPanel';
import { Timeline } from './components/Timeline';
import { SettingsModal } from './components/SettingsModal';
import { TranscribeModal } from './components/TranscribeModal';
import { useEditorStore } from './lib/store';
import { ACCENT_PRESETS } from './lib/constants';
import './styles/index.css';

/* ── Paste JSON Modal ── */
const PasteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');

  const handleApply = () => {
    try {
      setError('');
      const parsed = JSON.parse(jsonText);

      // Support both full project format and slides-only format
      if (parsed.slides && Array.isArray(parsed.slides)) {
        const store = useEditorStore.getState();
        if (parsed.branding || parsed.fps) {
          // Full project format
          store.setProject(parsed);
        } else {
          // Slides-only format: merge into current project
          store.setProject({
            ...store.project,
            slides: parsed.slides,
          });
        }
        onClose();
      } else if (Array.isArray(parsed)) {
        // Direct array of slides
        const store = useEditorStore.getState();
        store.setProject({ ...store.project, slides: parsed });
        onClose();
      } else {
        setError('JSON phải chứa "slides" array hoặc là array of slides');
      }
    } catch (e: any) {
      setError('JSON không hợp lệ: ' + e.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Paste JSON Slides</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <p className="modal-desc">
          Paste JSON slides từ Antigravity vào đây. Hỗ trợ cả format đầy đủ project
          hoặc chỉ <code>{"{ \"slides\": [...] }"}</code>
        </p>
        <textarea
          className="json-textarea"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='Paste JSON ở đây...&#10;&#10;Ví dụ:&#10;{&#10;  "slides": [&#10;    {"type": "title", "icon": "💻", "title": "Hello", "titleAccent": "World", ...}&#10;  ]&#10;}'
          rows={16}
          autoFocus
        />
        {error && <p className="modal-error">❌ {error}</p>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={!jsonText.trim()}>
            ✅ Áp dụng Slides
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Config Modal ── */
const ConfigModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { project, updateBranding } = useEditorStore();
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2>🎨 Video Configuration</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <p className="modal-desc">Cấu hình username và màu sắc này sẽ được áp dụng cho toàn bộ các slide.</p>
        
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="field-group">
            <label className="field-label" style={{ marginBottom: 8, display: 'block' }}>Username hiển thị</label>
            <input 
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 16 }}
              value={project.branding.username}
              onChange={(e) => updateBranding({ username: e.target.value })} 
            />
          </div>
          
          <div className="field-group">
            <label className="field-label" style={{ marginBottom: 12, display: 'block' }}>Giao diện (Theme)</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                style={{ 
                  flex: 1, padding: '10px', borderRadius: 6, cursor: 'pointer',
                  background: project.branding.theme === 'light' ? '#fff' : 'rgba(0,0,0,0.2)',
                  color: project.branding.theme === 'light' ? '#000' : '#fff',
                  border: project.branding.theme === 'light' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => updateBranding({ theme: 'light' })}
              >
                Sáng (Light)
              </button>
              <button 
                style={{ 
                  flex: 1, padding: '10px', borderRadius: 6, cursor: 'pointer',
                  background: project.branding.theme !== 'light' ? '#222' : 'rgba(0,0,0,0.2)',
                  color: project.branding.theme !== 'light' ? '#fff' : '#ccc',
                  border: project.branding.theme !== 'light' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => updateBranding({ theme: 'dark' })}
              >
                Tối (Dark)
              </button>
            </div>
          </div>
          
          <div className="field-group">
            <label className="field-label" style={{ marginBottom: 12, display: 'block' }}>Màu chủ đạo (Accent Color)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ACCENT_PRESETS.map((p) => (
                <button key={p.color}
                  style={{ 
                    background: p.color, width: 36, height: 36, borderRadius: '50%', 
                    border: project.branding.accentColor === p.color ? '3px solid white' : '3px solid transparent', 
                    cursor: 'pointer', padding: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    transition: 'border 0.2s'
                  }}
                  onClick={() => updateBranding({ accentColor: p.color })} title={p.name} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-actions" style={{ marginTop: 30 }}>
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
            ✅ Đã Xong
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main App ── */
const App: React.FC = () => {
  const { project, isRendering, renderProgress, audioBlobUrl, setAudio } = useEditorStore();
  const totalDuration = project.slides.reduce((s, sl) => s + sl.durationInFrames, 0) / 30;
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTranscribeModal, setShowTranscribeModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  const handleImportAudio = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp4,.wav,.mp3,.m4a,.ogg,.webm';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // WAV files have seeking issues in browsers — normalize them
      if (file.name.toLowerCase().endsWith('.wav')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const audioCtx = new AudioContext();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          audioCtx.close();

          // Re-encode as clean 16-bit PCM WAV with standard headers
          const numCh = audioBuffer.numberOfChannels;
          const sampleRate = audioBuffer.sampleRate;
          const bitsPerSample = 16;
          const bytesPerSample = bitsPerSample / 8;
          const blockAlign = numCh * bytesPerSample;
          const dataSize = audioBuffer.length * blockAlign;
          const buffer = new ArrayBuffer(44 + dataSize);
          const view = new DataView(buffer);

          const writeStr = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
          };

          writeStr(0, 'RIFF');
          view.setUint32(4, 36 + dataSize, true);
          writeStr(8, 'WAVE');
          writeStr(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true); // PCM
          view.setUint16(22, numCh, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * blockAlign, true);
          view.setUint16(32, blockAlign, true);
          view.setUint16(34, bitsPerSample, true);
          writeStr(36, 'data');
          view.setUint32(40, dataSize, true);

          let offset = 44;
          for (let i = 0; i < audioBuffer.length; i++) {
            for (let ch = 0; ch < numCh; ch++) {
              const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
              view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
              offset += 2;
            }
          }

          const blob = new Blob([buffer], { type: 'audio/wav' });
          const blobUrl = URL.createObjectURL(blob);
          setAudio(blobUrl, 1);
          setAudioFileName(file.name);
        } catch (err) {
          console.error('WAV normalize failed, using original:', err);
          const blobUrl = URL.createObjectURL(file);
          setAudio(blobUrl, 1);
          setAudioFileName(file.name);
        }
      } else {
        const blobUrl = URL.createObjectURL(file);
        setAudio(blobUrl, 1);
        setAudioFileName(file.name);
      }
    };
    input.click();
  };

  const handleExport = async () => {
    const store = useEditorStore.getState();
    store.setRendering(true);
    store.setRenderProgress(0);

    let pollInterval: any;

    try {
      // Build render payload — convert blob audio to base64 for server
      const projectData = JSON.parse(JSON.stringify(store.project));

      if (store.audioBlobUrl && projectData.audio?.src?.startsWith('blob:')) {
        try {
          const audioRes = await fetch(store.audioBlobUrl);
          const audioBlob = await audioRes.blob();
          const reader = new FileReader();
          const audioBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });
          projectData.audio.src = audioBase64; // data:audio/wav;base64,...
        } catch (e) {
          console.warn('Could not encode audio for render:', e);
        }
      }

      // Start polling for progress
      pollInterval = setInterval(async () => {
        try {
          const progRes = await fetch('http://localhost:3001/api/progress');
          if (progRes.ok) {
            const data = await progRes.json();
            useEditorStore.getState().setRenderProgress(data.progress);
          }
        } catch (e) {
          // Ignore network errors during polling
        }
      }, 500);

      const res = await fetch('http://localhost:3001/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${store.project.name}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Render failed: ' + (await res.text()));
      }
    } catch (err) {
      alert('Cannot connect to render server. Make sure to run: node server/render.mjs');
    } finally {
      if (pollInterval) clearInterval(pollInterval);
      store.setRendering(false);
      store.setRenderProgress(0);
    }
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(useEditorStore.getState().project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const proj = JSON.parse(text);
        useEditorStore.getState().setProject(proj);
      } catch {
        alert('Invalid JSON file');
      }
    };
    input.click();
  };

  return (
    <div className="app">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-logo">
            <span className="logo-icon">▶</span> HTML Video
          </h1>
          <span className="project-name">{project.name}</span>
          <span className="project-duration">{totalDuration.toFixed(1)}s • {project.slides.length} slides</span>
          {audioFileName && (
            <span className="audio-badge" title={audioFileName}>
              🔊 {audioFileName.length > 20 ? audioFileName.slice(0, 17) + '...' : audioFileName}
              <button className="audio-badge-remove" onClick={() => { setAudio(null); setAudioFileName(null); }}>✕</button>
            </span>
          )}
        </div>
        <div className="top-bar-right">
          <button className="btn btn-accent" onClick={() => setShowTranscribeModal(true)}>🎙 Auto</button>
          <span className="top-bar-divider" />
          <button className="btn btn-ghost" onClick={handleImportAudio}>🔊 Audio</button>
          <button className="btn btn-ghost" onClick={handleImportFile}>📄 JSON</button>
          <button className="btn btn-ghost" onClick={() => setShowPasteModal(true)}>📋 Paste</button>
          <button className="btn btn-ghost" onClick={handleExportJSON}>💾 Save</button>
          <button className="btn btn-ghost" onClick={() => setShowConfigModal(true)}>🎨 Config</button>
          <button className="btn btn-ghost" onClick={() => setShowSettingsModal(true)}>⚙️</button>
          <button className="btn btn-primary" onClick={handleExport} disabled={isRendering}>
            {isRendering ? `Rendering... ${Math.round(renderProgress * 100)}%` : '🎬 Export MP4'}
          </button>
        </div>
      </header>

      {/* Editor: 2-column layout */}
      <main className="editor-layout-v3">
        {/* Left column: slides (60%) + timeline (40%) */}
        <div className="editor-left-v3">
          <div className="editor-slides-area">
            <SlidePanelV2 />
          </div>
          <div className="editor-timeline-area">
            <Timeline />
          </div>
        </div>
        {/* Right column: preview full height */}
        <div className="editor-right-v3">
          <PreviewPanel />
        </div>
      </main>

      {/* Modals */}
      {showPasteModal && <PasteModal onClose={() => setShowPasteModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
      {showTranscribeModal && <TranscribeModal onClose={() => setShowTranscribeModal(false)} />}
      {showConfigModal && <ConfigModal onClose={() => setShowConfigModal(false)} />}

    </div>
  );
};

export default App;
