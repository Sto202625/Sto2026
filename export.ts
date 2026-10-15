import { toInt16 } from "./exportUtils";

let worker: Worker | null = null;

async function resample(b: AudioBuffer, rate: number): Promise<AudioBuffer> {
  const ch = Math.min(2, b.numberOfChannels), ctx = new OfflineAudioContext(ch, Math.ceil((b.length * rate) / b.sampleRate), rate);
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start();
  return ctx.startRendering();
}

// Async (runs in a Web Worker). Mono stays mono, anything else becomes stereo. Output is MPEG audio (audio/mpeg).
export async function wavToMp3(buf: AudioBuffer, bitrate = 128): Promise<Blob> {
  const src = [32000, 44100, 48000].includes(buf.sampleRate) ? buf : await resample(buf, 44100);
  const ch = src.numberOfChannels > 1 ? 2 : 1;
  const pcm = Array.from({ length: ch }, (_, c) => toInt16(src.getChannelData(c)));
  return new Promise((res, rej) => {
    const w = (worker ||= new Worker(new URL("./mp3.worker.ts", import.meta.url)));
    w.onmessage = (e) => (e.data.type === "error" ? rej(new Error(e.data.msg)) : res(new Blob(e.data.chunks, { type: "audio/mpeg" })));
    w.onerror = (e) => { worker = null; rej(new Error(e.message || "MP3 worker failed")); };
    w.postMessage({ pcm, sampleRate: src.sampleRate, bitrate }, pcm.map((p) => p.buffer));
  });
}
