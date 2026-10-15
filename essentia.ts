import { NOTES, confidence, foldBpm, minorRoot, normKey } from "./analysisMath";
export interface Analysis { bpm: number; key: string; scale: string; formKey: string; confidence: number; danceability?: number; failed?: boolean; }
export const FALLBACK: Analysis = { bpm: 122, key: "C", scale: "minor", formKey: "C", confidence: 0, failed: true };

let worker: Worker | null = null;
const drop = () => { worker?.terminate(); worker = null; };

// Mono, 44.1 kHz: what Essentia's extractors expect.
async function toMono44k(b: AudioBuffer): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, Math.ceil((b.length * 44100) / b.sampleRate), 44100);
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start();
  return (await ctx.startRendering()).getChannelData(0);
}

function run(samples: Float32Array, onStage: (s: string) => void): Promise<any> {
  return new Promise((res, rej) => {
    const w = (worker ||= new Worker(new URL("./essentia.worker.ts", import.meta.url)));
    const t = setTimeout(() => rej(new Error("Essentia timed out")), 45000);
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === "stage") return onStage(m.stage);
      clearTimeout(t); m.type === "error" ? rej(new Error(m.msg)) : res(m);
    };
    w.onerror = (e) => { clearTimeout(t); rej(new Error(e.message || "Essentia worker failed")); };
    w.postMessage({ samples }, [samples.buffer]);
  });
}

// Never rejects: any failure returns 122 BPM, C minor.
export async function analyze(buf: AudioBuffer, onStage: (s: string) => void = () => {}): Promise<Analysis> {
  try {
    const m = await run(await toMono44k(buf), onStage);
    const key = normKey(m.key);
    if (!NOTES.includes(key) || !(m.bpm > 0)) throw new Error("Unusable result");
    return {
      bpm: foldBpm(m.bpm), key, scale: m.scale, formKey: minorRoot(key, m.scale),
      confidence: confidence(m.bpmConf, m.strength), danceability: m.danceability,
    };
  } catch (e) {
    console.warn("Essentia failed, using fallback:", e); drop(); return FALLBACK;
  }
}
