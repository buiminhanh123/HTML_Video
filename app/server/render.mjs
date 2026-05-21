/**
 * Render Server for HTML Video Generator
 * 
 * Usage: node server/render.mjs
 * 
 * This starts an Express server that accepts POST /api/render
 * with a VideoProject JSON body and returns a rendered MP4 file.
 */

import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/output', express.static(path.resolve(__dirname, '../output')));

let currentProgress = 0;

app.get('/api/progress', (req, res) => {
  res.json({ progress: currentProgress });
});

// Cache the bundle location
let bundleLocation = null;

async function getBundleLocation() {
  if (bundleLocation) return bundleLocation;
  
  console.log('📦 Bundling Remotion compositions...');
  bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, '../src/remotion/index.ts'),
    webpackOverride: (config) => config,
  });
  console.log('✅ Bundle ready at:', bundleLocation);
  return bundleLocation;
}

app.post('/api/render', async (req, res) => {
  const project = req.body;
  
  if (!project || !project.slides || project.slides.length === 0) {
    return res.status(400).send('Invalid project data');
  }

  currentProgress = 0; // Reset progress at the start of a render

  // Decode base64 audio to temp file if present
  let tempAudioPath = null;
  if (project.audio?.src?.startsWith('data:')) {
    try {
      const matches = project.audio.src.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].includes('wav') ? '.wav' : '.mp3';
        const fileName = `_temp_audio_${Date.now()}${ext}`;
        tempAudioPath = path.resolve(__dirname, `../output/${fileName}`);
        fs.mkdirSync(path.dirname(tempAudioPath), { recursive: true });
        fs.writeFileSync(tempAudioPath, Buffer.from(matches[2], 'base64'));
        // Replace blob URL with local HTTP URL for Remotion
        project.audio.src = `http://localhost:${PORT}/output/${fileName}`;
        console.log('🔊 Audio decoded to:', tempAudioPath);
      }
    } catch (e) {
      console.error('Failed to decode audio:', e);
    }
  }

  const totalFrames = project.slides.reduce((sum, s) => sum + s.durationInFrames, 0);
  const outputPath = path.resolve(__dirname, `../output/${project.name || 'video'}_${Date.now()}.mp4`);
  
  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  try {
    console.log(`\n🎬 Starting render: ${project.slides.length} slides, ${totalFrames} frames`);
    
    const serveUrl = await getBundleLocation();
    
    const composition = await selectComposition({
      serveUrl,
      id: 'HTMLVideo',
      inputProps: {
        slides: project.slides,
        branding: project.branding,
        audio: project.audio,
      },
    });

    // Override the composition with actual values
    composition.durationInFrames = totalFrames;
    composition.fps = project.fps || 30;
    composition.width = project.width || 1080;
    composition.height = project.height || 1920;

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        slides: project.slides,
        branding: project.branding,
        audio: project.audio,
      },
      onProgress: ({ progress }) => {
        currentProgress = progress;
        process.stdout.write(`\r  Rendering: ${Math.round(progress * 100)}%`);
      },
    });

    console.log(`\n✅ Render complete: ${outputPath}`);
    
    // Clean up temp audio
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }

    // Send the file as response
    res.download(outputPath, `${project.name || 'video'}.mp4`, (err) => {
      if (err) console.error('Download error:', err);
    });
    
  } catch (error) {
    // Clean up temp audio on error
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try { fs.unlinkSync(tempAudioPath); } catch (_) {}
    }
    console.error('❌ Render error:', error);
    res.status(500).send(error.message || 'Render failed');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ready: !!bundleLocation });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Render server running at http://localhost:${PORT}`);
  console.log(`   POST /api/render - Render video from project JSON`);
  console.log(`   GET  /api/health - Health check\n`);
  
  // Pre-bundle on startup
  getBundleLocation().catch(console.error);
});
