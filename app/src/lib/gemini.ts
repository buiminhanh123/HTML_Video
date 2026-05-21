/**
 * Gemini API client for audio transcription
 * - Supports multiple models with auto-fallback
 * - Stores API key + preferred model in localStorage
 */

const MODEL_LIST = [
  { id: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite' },
];

const STORAGE_KEY = 'gemini_settings';

export interface GeminiSettings {
  apiKey: string;
  preferredModel: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export function getModels() {
  return MODEL_LIST;
}

export function loadSettings(): GeminiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return { apiKey: '', preferredModel: MODEL_LIST[0].id };
}

export function saveSettings(settings: GeminiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Transcribe audio using Gemini API with auto-fallback
 */
export async function transcribeAudio(
  audioFile: File,
  onProgress?: (msg: string) => void,
): Promise<{ segments: TranscriptSegment[]; srt: string; model: string }> {
  const settings = loadSettings();
  if (!settings.apiKey) throw new Error('API key chưa được cài đặt. Vào Settings để nhập.');

  const log = (msg: string) => { console.log(msg); onProgress?.(msg); };

  // Read file as base64
  log('📂 Đang đọc file audio...');
  const arrayBuffer = await audioFile.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const ext = audioFile.name.split('.').pop()?.toLowerCase() || 'wav';
  const mimeMap: Record<string, string> = {
    wav: 'audio/wav', mp3: 'audio/mp3', m4a: 'audio/m4a',
    ogg: 'audio/ogg', webm: 'audio/webm', mp4: 'video/mp4', flac: 'audio/flac',
  };
  const mimeType = mimeMap[ext] || 'audio/wav';
  log(`   ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(1)} MB)`);

  const prompt = `Transcribe this audio file into Vietnamese.
Return the result as a JSON array of segments, where each segment represents a short phrase (3-8 words).

For each segment, provide:
- "start": start time in seconds (decimal, e.g. 0.48)
- "end": end time in seconds (decimal, e.g. 2.32)
- "text": the transcribed text

Be extremely precise with timestamps - accuracy to within 50 milliseconds is important.
Group words into natural phrases, splitting at punctuation and natural pauses.

Example format:
[
  {"start": 0.48, "end": 2.32, "text": "Sếp cầm báo cáo cuối ngày"},
  {"start": 2.32, "end": 3.30, "text": "thấy mọi thứ vẫn sáng"}
]

Return ONLY the JSON array. No markdown, no explanation.`;

  const requestBody = {
    contents: [{
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: prompt },
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  // Build model order: preferred first, then the rest
  const modelOrder = [
    settings.preferredModel,
    ...MODEL_LIST.map(m => m.id).filter(id => id !== settings.preferredModel),
  ];

  let lastError = '';

  for (const modelId of modelOrder) {
    const label = MODEL_LIST.find(m => m.id === modelId)?.label || modelId;
    log(`🤖 Đang transcribe với ${label}...`);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${settings.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `${label}: HTTP ${response.status}`;
        log(`⚠️ ${label} lỗi (${response.status}), thử model tiếp theo...`);
        continue;
      }

      const result = await response.json();
      const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON from response
      let jsonStr = textContent.trim();
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      const segments: TranscriptSegment[] = JSON.parse(jsonStr);
      if (!Array.isArray(segments) || segments.length === 0) {
        lastError = `${label}: Response rỗng`;
        log(`⚠️ ${label} trả về rỗng, thử model tiếp...`);
        continue;
      }

      // Build SRT
      const srt = segments.map((seg, i) => {
        const fmt = (s: number) => {
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          const sec = Math.floor(s % 60);
          const ms = Math.round((s % 1) * 1000);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
        };
        return `${i + 1}\n${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text}`;
      }).join('\n\n');

      log(`✅ Hoàn thành! ${segments.length} đoạn (${label})`);
      return { segments, srt, model: label };

    } catch (err: any) {
      lastError = `${label}: ${err.message}`;
      log(`⚠️ ${label} thất bại: ${err.message}`);
      continue;
    }
  }

  throw new Error(`Tất cả models đều lỗi. Lỗi cuối: ${lastError}`);
}
