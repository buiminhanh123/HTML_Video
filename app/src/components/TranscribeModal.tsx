import React, { useState, useRef } from 'react';
import { transcribeAudio, loadSettings } from '../lib/gemini';
import type { TranscriptSegment } from '../lib/gemini';
import { useEditorStore } from '../lib/store';
import { VIDEO_FPS } from '../lib/constants';
import { pickIconForText, pickSlideIcon } from '../lib/icons';

interface Props { onClose: () => void; }

/**
 * Convert transcription segments into video slides automatically
 */
function generateSlides(segments: TranscriptSegment[], totalDuration: number) {
  // ── Step 1: Group segments into slide groups ──
  const TARGET_SLIDE_DURATION = 14; // seconds
  const groups: { segments: TranscriptSegment[]; start: number; end: number }[] = [];
  let currentSlide: TranscriptSegment[] = [];
  let slideStart = 0;

  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    currentSlide.push(seg);
    const elapsed = seg.end - slideStart;
    const nextSeg = segments[si + 1];
    const gap = nextSeg ? nextSeg.start - seg.end : 999;

    if (elapsed >= TARGET_SLIDE_DURATION || gap > 1.5 || !nextSeg) {
      groups.push({ segments: currentSlide, start: slideStart, end: seg.end });
      slideStart = nextSeg?.start ?? seg.end;
      currentSlide = [];
    }
  }

  // ── Step 2: Calculate slide boundaries with gap splitting ──
  // For each pair of adjacent slides, split the gap 50/50
  const boundaries: { start: number; end: number }[] = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    let slideEndTime = group.end;
    let slideStartTime = group.start;

    // Split gap with previous slide
    if (i > 0) {
      const prevGroup = groups[i - 1];
      const gapBetween = group.start - prevGroup.end;
      if (gapBetween > 0) {
        slideStartTime = prevGroup.end + gapBetween / 2;
      }
    } else {
      slideStartTime = 0; // First slide starts at 0
    }

    // Split gap with next slide
    if (i < groups.length - 1) {
      const nextGroup = groups[i + 1];
      const gapBetween = nextGroup.start - group.end;
      if (gapBetween > 0) {
        slideEndTime = group.end + gapBetween / 2;
      }
    } else {
      // Last slide: add a small buffer after last segment
      slideEndTime = Math.max(group.end + 1.0, totalDuration);
    }

    boundaries.push({ start: slideStartTime, end: slideEndTime });
  }

  // ── Step 3: Convert to project slides with startTime + endTime ──
  const types = ['title', 'list', 'list', 'grid', 'list', 'tag'];

  return groups.map((group, i) => {
    const segs = group.segments as TranscriptSegment[];
    const bound = boundaries[i];
    const durationSec = bound.end - bound.start;
    const durationFrames = Math.round(durationSec * VIDEO_FPS);
    const type = i === 0 ? 'title' : types[i % types.length];

    const titleText = segs[0]?.text || `Slide ${i + 1}`;
    const slideIcon = pickSlideIcon(type, titleText);

    const words = titleText.split(' ');
    // Use full sentence: first half normal, second half accent
    const titleMain = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const titleAccent = words.slice(Math.ceil(words.length / 2)).join(' ');

    // Remaining segments become bullets (skip segs[0] which is the title)
    const contentSegs = segs.length > 1 ? segs.slice(1) : segs;

    // Track used icons to avoid duplicates within a slide
    const usedIcons = new Set<string>();

    if (type === 'title' || type === 'list') {
      const bullets = contentSegs.map((seg, j) => {
        const bWords = seg.text.split(' ');
        const mid = Math.ceil(bWords.length * 0.6);
        return {
          icon: pickIconForText(seg.text, usedIcons),
          text: bWords.slice(0, mid).join(' ') + ' ',
          boldText: bWords.slice(mid).join(' '),
          startTime: seg.start,
          endTime: seg.end,
        };
      });

      return {
        id: `auto_${i}`,
        type: i === 0 ? 'title' : 'list',
        durationInFrames: durationFrames,
        icon: slideIcon,
        title: titleMain,
        titleAccent: titleAccent || titleMain,
        bullets: bullets.slice(0, 5),
      };
    } else if (type === 'grid') {
      return {
        id: `auto_${i}`,
        type: 'grid',
        durationInFrames: durationFrames,
        icon: slideIcon,
        title: titleMain,
        titleAccent: titleAccent || titleMain,
        items: contentSegs.slice(0, 4).map((seg, j) => ({
          icon: pickIconForText(seg.text, usedIcons),
          text: seg.text,
          startTime: seg.start,
          endTime: seg.end,
        })),
      };
    } else {
      const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
      return {
        id: `auto_${i}`,
        type: 'tag',
        durationInFrames: durationFrames,
        icon: slideIcon,
        title: titleMain,
        titleAccent: titleAccent || titleMain,
        subtitle: segs[0]?.text || '',
        tags: contentSegs.slice(0, 5).map((seg, j) => ({
          text: seg.text.length > 25 ? seg.text.slice(0, 22) + '...' : seg.text,
          color: colors[j % colors.length],
          startTime: seg.start,
          endTime: seg.end,
        })),
      };
    }
  });
}

export const TranscribeModal: React.FC<Props> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [srtResult, setSrtResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setAudio } = useEditorStore();

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleTranscribe = async () => {
    if (!file) return;
    const settings = loadSettings();
    if (!settings.apiKey) {
      addLog('❌ Chưa có API key! Vào Settings để nhập.');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setSrtResult('');

    try {
      const result = await transcribeAudio(file, addLog);
      setSrtResult(result.srt);
      addLog(`\n📊 Model: ${result.model}`);
      addLog(`📝 ${result.segments.length} đoạn transcript`);

      // Auto-generate slides
      addLog('🎬 Đang tạo slides...');
      const totalDuration = Math.max(...result.segments.map(s => s.end));
      const slides = generateSlides(result.segments, totalDuration);

      // Add outro
      slides.push({
        id: 'auto_outro',
        type: 'outro',
        durationInFrames: 150,
        platform: 'tiktok',
        username: 'escbasexyz',
      } as any);

      // Load project
      const project = {
        id: 'auto_' + Date.now(),
        name: file.name.replace(/\.[^.]+$/, ''),
        slides,
        branding: { username: 'escbasexyz', accentColor: '#10B981' },
        fps: VIDEO_FPS,
        width: 1080,
        height: 1920,
      };

      useEditorStore.getState().setProject(project as any);

      // Also set audio
      // Normalize WAV if needed
      if (file.name.toLowerCase().endsWith('.wav')) {
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new AudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioCtx.close();

        const numCh = audioBuffer.numberOfChannels;
        const sr = audioBuffer.sampleRate;
        const blockAlign = numCh * 2;
        const dataSize = audioBuffer.length * blockAlign;
        const buf = new ArrayBuffer(44 + dataSize);
        const dv = new DataView(buf);
        const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
        ws(0, 'RIFF'); dv.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
        ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
        dv.setUint16(22, numCh, true); dv.setUint32(24, sr, true);
        dv.setUint32(28, sr * blockAlign, true); dv.setUint16(32, blockAlign, true);
        dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, dataSize, true);
        let off = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
          for (let ch = 0; ch < numCh; ch++) {
            const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
            dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2;
          }
        }
        const blob = new Blob([buf], { type: 'audio/wav' });
        setAudio(URL.createObjectURL(blob), 1);
      } else {
        setAudio(URL.createObjectURL(file), 1);
      }

      addLog('✅ Hoàn thành! Slides đã được tạo tự động.');
      addLog('   → Chỉnh sửa text/timing trong editor');
      addLog('   → Kéo markers trên Timeline để sync chính xác');

    } catch (err: any) {
      addLog(`❌ Lỗi: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content transcribe-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎙 Auto Transcribe & Generate</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="transcribe-body">
          {/* File picker */}
          <div className="transcribe-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.m4a,.ogg,.webm,.mp4,.flac"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-ghost transcribe-pick-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning}
            >
              📂 {file ? file.name : 'Chọn file audio...'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleTranscribe}
              disabled={!file || isRunning}
            >
              {isRunning ? '⏳ Đang xử lý...' : '🚀 Transcribe & Generate'}
            </button>
          </div>

          {/* Log output */}
          {logs.length > 0 && (
            <div className="transcribe-logs">
              {logs.map((log, i) => (
                <div key={i} className="transcribe-log-line">{log}</div>
              ))}
            </div>
          )}

          {/* SRT preview */}
          {srtResult && (
            <details className="transcribe-srt-preview">
              <summary>📄 SRT Result ({srtResult.split('\n\n').filter(s => s.trim()).length} segments)</summary>
              <pre>{srtResult}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};
