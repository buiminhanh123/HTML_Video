/**
 * Transcribe Audio → SRT using Gemini API (word-level timestamps)
 * 
 * Usage: node scripts/transcribe-gemini.mjs <audio.wav> [model] [api-key]
 * 
 * Models:
 *   2.5-flash       → gemini-2.5-flash-preview-04-17  (default, balanced)
 *   2.5-flash-lite  → gemini-2.5-flash-lite-preview-06-17
 *   3-flash         → gemini-3.0-flash-preview
 *   3.1-flash-lite  → gemini-3.1-flash-lite-preview
 * 
 * Examples:
 *   node scripts/transcribe-gemini.mjs audio.wav
 *   node scripts/transcribe-gemini.mjs audio.wav 2.5-flash-lite
 *   node scripts/transcribe-gemini.mjs audio.wav 3-flash YOUR_API_KEY
 * 
 * Environment: Set GEMINI_API_KEY or pass as 3rd argument
 * Output: <audio>.srt + <audio>.gemini.json (raw response)
 */

import fs from 'fs';
import path from 'path';

// ── Parse arguments ──
const inputFile = process.argv[2];
const modelArg = process.argv[3] || '2.5-flash';
const apiKeyArg = process.argv[4] || process.env.GEMINI_API_KEY;

const MODEL_MAP = {
  '2.5-flash':      'gemini-2.5-flash-preview-04-17',
  '2.5-flash-lite': 'gemini-2.5-flash-lite-preview-06-17',
  '3-flash':        'gemini-3.0-flash-preview',
  '3.1-flash-lite': 'gemini-3.1-flash-lite-preview',
};

if (!inputFile) {
  console.error('❌ Usage: node scripts/transcribe-gemini.mjs <audio> [model] [api-key]');
  console.error('   Models: 2.5-flash (default), 2.5-flash-lite, 3-flash, 3.1-flash-lite');
  process.exit(1);
}

const modelId = MODEL_MAP[modelArg] || modelArg;
const API_KEY = apiKeyArg;

if (!API_KEY) {
  console.error('❌ Missing API key. Set GEMINI_API_KEY env var or pass as 3rd argument.');
  console.error('   Example: node scripts/transcribe-gemini.mjs audio.wav 2.5-flash YOUR_KEY');
  process.exit(1);
}

const absInput = path.resolve(inputFile);
if (!fs.existsSync(absInput)) {
  console.error(`❌ File not found: ${absInput}`);
  process.exit(1);
}

// ── Step 1: Read and encode audio file ──
console.log(`🎵 Step 1: Reading audio file...`);
const audioData = fs.readFileSync(absInput);
const base64Audio = audioData.toString('base64');

const ext = path.extname(absInput).toLowerCase();
const mimeMap = {
  '.wav': 'audio/wav', '.mp3': 'audio/mp3', '.m4a': 'audio/m4a',
  '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.mp4': 'video/mp4',
  '.flac': 'audio/flac',
};
const mimeType = mimeMap[ext] || 'audio/wav';
const fileSizeMB = (audioData.length / 1024 / 1024).toFixed(1);
console.log(`   File: ${path.basename(absInput)} (${fileSizeMB} MB, ${mimeType})`);

// ── Step 2: Call Gemini API ──
console.log(`🤖 Step 2: Transcribing with ${modelId}...`);

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;

const prompt = `Transcribe this audio file into Vietnamese. 
Return the result as a JSON array of segments, where each segment represents a short phrase (3-8 words).

For each segment, provide:
- "start": start time in seconds (decimal, e.g. 0.48)
- "end": end time in seconds (decimal, e.g. 2.32)  
- "text": the transcribed text

Be extremely precise with timestamps - accuracy to within 50 milliseconds is important.
Group words into natural phrases, splitting at punctuation and natural pauses.

Example output format:
[
  {"start": 0.48, "end": 2.32, "text": "Sếp cầm báo cáo cuối ngày"},
  {"start": 2.32, "end": 3.30, "text": "thấy mọi thứ vẫn sáng"},
  ...
]

Return ONLY the JSON array, no markdown code blocks, no explanation.`;

const requestBody = {
  contents: [{
    parts: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        }
      },
      { text: prompt }
    ]
  }],
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 8192,
  }
};

try {
  const startTime = Date.now();
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Gemini API error (${response.status}):`);
    console.error(errorText);
    process.exit(1);
  }

  const result = await response.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Transcription completed in ${elapsed}s`);

  // Save raw response for debugging
  const rawOutputPath = absInput.replace(/\.[^.]+$/, '.gemini.json');
  fs.writeFileSync(rawOutputPath, JSON.stringify(result, null, 2), 'utf-8');

  // ── Step 3: Extract text and parse JSON ──
  console.log('📄 Step 3: Parsing response...');

  const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Clean up: remove markdown code blocks if present
  let jsonStr = textContent.trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  
  let segments;
  try {
    segments = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error('❌ Failed to parse Gemini response as JSON:');
    console.error(textContent.slice(0, 500));
    process.exit(1);
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    console.error('❌ No segments found in response');
    process.exit(1);
  }

  // ── Step 4: Convert to SRT ──
  console.log('📄 Step 4: Generating SRT...');

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  let srtContent = '';
  segments.forEach((seg, i) => {
    const start = formatTime(seg.start);
    const end = formatTime(seg.end);
    srtContent += `${i + 1}\n${start} --> ${end}\n${seg.text}\n\n`;
  });

  // ── Step 5: Save SRT ──
  const outputSrt = absInput.replace(/\.[^.]+$/, '.srt');
  fs.writeFileSync(outputSrt, srtContent, 'utf-8');

  console.log(`\n✅ Done!`);
  console.log(`   Model: ${modelId}`);
  console.log(`   Segments: ${segments.length}`);
  console.log(`   SRT saved: ${outputSrt}`);
  console.log(`   Raw JSON: ${rawOutputPath}`);
  console.log(`\n════════════════ SRT Content ════════════════\n`);
  console.log(srtContent);
  console.log('═════════════════════════════════════════════');

} catch (err) {
  console.error('❌ Request failed:', err.message);
  process.exit(1);
}
