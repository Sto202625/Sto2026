import * as Tone from "tone";
export interface Load { stage: string; pct: number | null; }
export const shouldUseMusicGen = (prompt: string) => /qhomu|afro deep/i.test(prompt);

let worker: Worker | null = null;
export function musicgen(prompt: string, seconds: number, onProgress: (l: Load) => void): Promise<AudioBuffer> {
  return new Promise((res, rej) => {
    const w = (worker ||= new Worker(new URL("./musicgen.worker.ts", import.meta.url), { type: "module" }));
    w.onmessage = async (e) => {
      const m = e.data;
      if (m.type === "progress") onProgress({ stage: m.stage, pct: m.pct });
      else if (m.type === "error") rej(new Error(m.msg));
      else res(await toBuffer(m.data, m.sr));
    };
    w.onerror = (e) => rej(new Error(e.message || "MusicGen worker failed"));
    w.postMessage({ prompt, seconds });
  });
}

// Resample to Tone's rate (so it mixes with other stems) and normalize level.
async function toBuffer(data: Float32Array, sr: number): Promise<AudioBuffer> {
  const peak = data.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1;
  for (let i = 0; i < data.length; i++) data[i] = (data[i] / peak) * 0.9;
  const src = new AudioBuffer({ length: data.length, numberOfChannels: 1, sampleRate: sr });
  src.copyToChannel(data, 0);
  const rate = Tone.getContext().sampleRate, ctx = new OfflineAudioContext(1, Math.ceil((data.length * rate) / sr), rate);
  const s = ctx.createBufferSource(); s.buffer = src; s.connect(ctx.destination); s.start();
  return ctx.startRendering();
}
