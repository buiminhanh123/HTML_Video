/**
 * Transcribe MP4 → SRT using Whisper (Hugging Face Transformers.js)
 * 
 * Usage: node scripts/transcribe.mjs <video.mp4> [model] [language]
 * 
 * Examples:
 *   node scripts/transcribe.mjs video.mp4
 *   node scripts/transcribe.mjs video.mp4 small vi
 *   node scripts/transcribe.mjs video.mp4 base en
 * 
 * Models: tiny (~40MB), base (~75MB), small (~250MB)
 * Output: <video>.srt file + prints SRT to console
 */

import { pipeline, read_audio } from '@huggingface/transformers';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import pkg from 'wavefile';
const { WaveFile } = pkg;

// ── Parse arguments ──
const inputFile = process.argv[2];
const modelSize = process.argv[3] || 'base';
const language = process.argv[4] || 'vietnamese';

if (!inputFile) {
  console.error('❌ Usage: node scripts/transcribe.mjs <video.mp4> [model] [language]');
  console.error('   Models: tiny, base, small');
  console.error('   Example: node scripts/transcribe.mjs video.mp4 base vietnamese');
  process.exit(1);
}

const absInput = path.resolve(inputFile);
if (!fs.existsSync(absInput)) {
  console.error(`❌ File not found: ${absInput}`);
  process.exit(1);
}

// ── Step 1: Extract audio using FFmpeg ──
console.log('🎵 Step 1: Extracting audio from video...');

const ffmpegPath = (await import('ffmpeg-static')).default;
const tempWav = path.join(os.tmpdir(), `whisper_${Date.now()}.wav`);

try {
  execSync(
    `"${ffmpegPath}" -i "${absInput}" -ar 16000 -ac 1 -c:a pcm_s16le -y "${tempWav}"`,
    { stdio: 'pipe' }
  );
  console.log('✅ Audio extracted successfully');
} catch (err) {
  console.error('❌ FFmpeg error:', err.stderr?.toString() || err.message);
  process.exit(1);
}

// ── Step 2: Load audio data from WAV file ──
console.log('🔊 Step 2: Loading audio data...');

const wavBuffer = fs.readFileSync(tempWav);
const wav = new WaveFile(wavBuffer);
wav.toBitDepth('32f'); // Convert to 32-bit float
wav.toSampleRate(16000); // Ensure 16kHz

let audioData = wav.getSamples();
if (Array.isArray(audioData)) {
  // If stereo, take first channel
  audioData = audioData[0];
}

// Convert to Float32Array if needed
if (!(audioData instanceof Float32Array)) {
  audioData = new Float32Array(audioData);
}

console.log(`   Audio length: ${(audioData.length / 16000).toFixed(1)} seconds`);

// ── Step 3: Transcribe with Whisper ──
const modelName = `Xenova/whisper-${modelSize}`;
console.log(`🤖 Step 3: Loading Whisper model (${modelName})...`);
console.log('   (First run will download the model, this may take a few minutes)');

const transcriber = await pipeline('automatic-speech-recognition', modelName, {
  dtype: 'q8',
});

console.log('📝 Transcribing audio...');

const result = await transcriber(audioData, {
  language: language,
  task: 'transcribe',
  return_timestamps: 'word',
  chunk_length_s: 30,
  stride_length_s: 0,
});

// ── Step 4: Deduplicate words + Group into phrases → SRT ──
console.log('📄 Step 4: Generating SRT (word-level grouping)...');

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Deduplicate words that have overlapping timestamps
const rawChunks = result.chunks || [];
const chunks = [];
for (const word of rawChunks) {
  const wordStart = word.timestamp[0] ?? 0;
  const wordText = word.text.trim();
  if (!wordText) continue;

  // Skip if this word is a duplicate of the previous (same text, timestamp within 0.3s)
  if (chunks.length > 0) {
    const prev = chunks[chunks.length - 1];
    const prevStart = prev.timestamp[0] ?? 0;
    if (prev.text.trim() === wordText && Math.abs(wordStart - prevStart) < 0.3) {
      continue; // duplicate, skip
    }
  }
  chunks.push(word);
}

let srtContent = '';

if (chunks.length > 0) {
  // Group words into short phrases based on:
  // 1. Punctuation (.,!?;:)
  // 2. Pause gap > 0.5s between words
  // 3. Max ~8 words per group
  const MAX_WORDS = 8;
  const PAUSE_THRESHOLD = 0.5; // seconds

  const groups = [];
  let currentGroup = { words: [], start: null, end: null };

  for (let i = 0; i < chunks.length; i++) {
    const word = chunks[i];
    const wordStart = word.timestamp[0] ?? 0;
    const wordEnd = word.timestamp[1] ?? wordStart + 0.3;
    const wordText = word.text.trim();

    if (!wordText) continue;

    // Check if we should start a new group
    const prevEnd = currentGroup.end ?? wordStart;
    const pauseGap = wordStart - prevEnd;
    const endsWithPunct = currentGroup.words.length > 0 &&
      /[.!?,;:。？！，]$/.test(currentGroup.words[currentGroup.words.length - 1]);

    if (currentGroup.words.length > 0 && (
      endsWithPunct ||
      pauseGap > PAUSE_THRESHOLD ||
      currentGroup.words.length >= MAX_WORDS
    )) {
      groups.push({ ...currentGroup });
      currentGroup = { words: [], start: null, end: null };
    }

    if (currentGroup.start === null) currentGroup.start = wordStart;
    currentGroup.end = wordEnd;
    currentGroup.words.push(wordText);
  }

  // Push last group
  if (currentGroup.words.length > 0) {
    groups.push(currentGroup);
  }

  // Build SRT from groups
  groups.forEach((group, i) => {
    const start = formatTime(group.start);
    const end = formatTime(group.end);
    const text = group.words.join(' ');
    srtContent += `${i + 1}\n${start} --> ${end}\n${text}\n\n`;
  });

  console.log(`   Words detected: ${rawChunks.length} → after dedup: ${chunks.length}`);
  console.log(`   Grouped into: ${groups.length} phrases`);
} else if (result.text) {
  // Fallback: single block, split by sentences
  const sentences = result.text.split(/[.!?。]\s*/).filter(s => s.trim());
  const duration = audioData.length / 16000;
  const avgDuration = duration / Math.max(sentences.length, 1);
  sentences.forEach((sentence, i) => {
    const start = formatTime(i * avgDuration);
    const end = formatTime(Math.min((i + 1) * avgDuration, duration));
    srtContent += `${i + 1}\n${start} --> ${end}\n${sentence.trim()}\n\n`;
  });
} else {
  console.error('❌ No transcription result');
  process.exit(1);
}

// ── Step 5: Save SRT file ──
const outputSrt = absInput.replace(/\.[^.]+$/, '.srt');
fs.writeFileSync(outputSrt, srtContent, 'utf-8');

// Clean up temp file
try { fs.unlinkSync(tempWav); } catch {}

console.log(`\n✅ Done! SRT saved to: ${outputSrt}`);
console.log(`📊 Total segments: ${srtContent.split('\n\n').filter(s => s.trim()).length}`);
console.log('\n════════════════ SRT Content ════════════════\n');
console.log(srtContent);
console.log('═════════════════════════════════════════════');

