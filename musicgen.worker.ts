// Runs MusicGen small off the main thread so the UI and loading bar stay responsive.
import { env, AutoTokenizer, MusicgenForConditionalGeneration } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = false;
env.useCustomCache = true;

// IndexedDB cache: model files download once, then load from disk.
const ST = "files";
const db = () => new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open("sto2026-models", 1);
  r.onupgradeneeded = () => r.result.createObjectStore(ST);
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => { const r = fn(d.transaction(ST, mode).objectStore(ST)); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
env.customCache = {
  async match(key: string) {
    const v: any = await tx("readonly", (s) => s.get(key));
    return v ? new Response(v.blob, { headers: v.headers }) : undefined;
  },
  async put(key: string, res: Response) {
    const blob = await res.clone().blob();
    await tx("readwrite", (s) => s.put({ blob, headers: Object.fromEntries(res.headers) }, key));
  },
} as any;

const ID = "Xenova/musicgen-small";
let tok: any, model: any;

self.onmessage = async (e: MessageEvent<{ prompt: string; seconds: number }>) => {
  try {
    if (!model) {
      const files: Record<string, { l: number; t: number }> = {};
      const cb = (p: any) => {
        if (p.status !== "progress" || !p.total) return;
        files[p.file] = { l: p.loaded, t: p.total };
        const f = Object.values(files);
        self.postMessage({ type: "progress", stage: "Loading model (first run only)", pct: (f.reduce((a, x) => a + x.l, 0) / f.reduce((a, x) => a + x.t, 0)) * 100 });
      };
      tok = await AutoTokenizer.from_pretrained(ID, { progress_callback: cb });
      model = await MusicgenForConditionalGeneration.from_pretrained(ID, {
        progress_callback: cb, dtype: { text_encoder: "q8", decoder_model_merged: "q8", encodec_decode: "fp32" },
      } as any);
    }
    self.postMessage({ type: "progress", stage: "Composing with MusicGen", pct: null });
    const out = await (model as any).generate({ ...tok(e.data.prompt), max_new_tokens: Math.round(e.data.seconds * 50), do_sample: true, guidance_scale: 3 });
    const data = new Float32Array(out.data);
    self.postMessage({ type: "done", data, sr: (model as any).config.audio_encoder.sampling_rate }, [data.buffer]);
  } catch (err: any) {
    self.postMessage({ type: "error", msg: String(err?.message || err) });
  }
};
