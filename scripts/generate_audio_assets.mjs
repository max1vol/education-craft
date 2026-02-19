import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_RATE = 44_100;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clamp(value) {
  return Math.max(-1, Math.min(1, value));
}

function writeMonoWav(filePath, samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i += 1) {
    const sample = Math.round(clamp(samples[i]) * 32767);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function generateBgm(durationSec, baseFreq, seedOffset = 0) {
  const total = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(total);
  const scale = [1, 6 / 5, 4 / 3, 3 / 2, 9 / 5];
  const tempo = 56 + seedOffset * 3;
  const rand = seededRandom(12_345 + seedOffset * 991);

  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const beat = Math.floor((t * tempo) / 60);
    const step = beat % scale.length;
    const nextStep = (step + 1) % scale.length;
    const beatProgress = ((t * tempo) / 60) % 1;
    const noteMix = beatProgress * beatProgress * (3 - 2 * beatProgress);
    const noteFreq = baseFreq * (scale[step] * (1 - noteMix) + scale[nextStep] * noteMix);

    const drone = Math.sin(2 * Math.PI * baseFreq * 0.5 * t) * 0.2;
    const pulse = Math.sin(2 * Math.PI * noteFreq * t + Math.sin(t * 0.3) * 0.8) * 0.3;
    const overtone = Math.sin(2 * Math.PI * noteFreq * 2.01 * t) * 0.13;

    const percussiveWindow = Math.exp(-((beatProgress * 9) ** 2)) * 0.09;
    const dust = (rand() - 0.5) * percussiveWindow;

    const slowLfo = 0.7 + Math.sin(t * 0.21 + seedOffset) * 0.2;
    out[i] = clamp((drone + pulse + overtone + dust) * slowLfo);
  }

  const fadeLen = Math.floor(SAMPLE_RATE * 0.6);
  for (let i = 0; i < fadeLen; i += 1) {
    const k = i / fadeLen;
    out[i] *= k;
    out[out.length - 1 - i] *= k;
  }

  return out;
}

function generateBreakSfx(seedOffset = 0) {
  const durationSec = 0.38 + seedOffset * 0.03;
  const total = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(total);
  const rand = seededRandom(77_777 + seedOffset * 93);

  let lowpass = 0;
  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const decay = Math.exp(-t * (11 + seedOffset * 1.4));
    const noise = rand() * 2 - 1;
    lowpass += (noise - lowpass) * (0.06 + seedOffset * 0.005);
    const grit = lowpass * decay * 0.8;
    const thud = Math.sin(2 * Math.PI * (110 + seedOffset * 14) * t) * Math.exp(-t * 15) * 0.25;
    out[i] = clamp(grit + thud);
  }

  return out;
}

function generatePlaceSfx(seedOffset = 0) {
  const durationSec = 0.28 + seedOffset * 0.02;
  const total = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(total);
  const freq = 420 + seedOffset * 75;

  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * (12 + seedOffset * 0.5));
    const click = Math.sin(2 * Math.PI * (freq * 1.9) * t) * env * 0.32;
    const chime = Math.sin(2 * Math.PI * freq * t + Math.sin(t * 22) * 0.18) * env * 0.46;
    out[i] = clamp(click + chime);
  }

  return out;
}

function main() {
  const repoRoot = process.cwd();
  const bgmDir = path.join(repoRoot, 'static/assets/audio/bgm');
  const sfxDir = path.join(repoRoot, 'static/assets/audio/sfx');

  ensureDir(bgmDir);
  ensureDir(sfxDir);

  const bgmTracks = [
    { file: 'neolithic-drones.wav', baseFreq: 78, seed: 0 },
    { file: 'old-kingdom-procession.wav', baseFreq: 92, seed: 1 },
    { file: 'hellenic-cold-chant.wav', baseFreq: 104, seed: 2 },
    { file: 'mesopotamian-ritual.wav', baseFreq: 86, seed: 3 }
  ];

  for (const track of bgmTracks) {
    const samples = generateBgm(14, track.baseFreq, track.seed);
    writeMonoWav(path.join(bgmDir, track.file), samples);
  }

  for (let i = 0; i < 4; i += 1) {
    const samples = generateBreakSfx(i);
    writeMonoWav(path.join(sfxDir, `break-0${i + 1}.wav`), samples);
  }

  for (let i = 0; i < 3; i += 1) {
    const samples = generatePlaceSfx(i);
    writeMonoWav(path.join(sfxDir, `place-0${i + 1}.wav`), samples);
  }

  console.log('Generated audio assets in static/assets/audio/');
}

main();
