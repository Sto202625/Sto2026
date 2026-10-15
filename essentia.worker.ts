// Essentia.js WASM runs here so analysis never freezes the UI. Files are served from /public/essentia (copied on npm install).
declare function importScripts(...urls: string[]): void;
declare const EssentiaWASM: any, Essentia: any;
let ess: any;

async function init() {
  if (ess) return ess;
  importScripts("/essentia/essentia-wasm.web.js", "/essentia/essentia.js-core.js");
  const wasm = await EssentiaWASM({ locateFile: (f: string) => "/essentia/" + f });
  return (ess = new Essentia(wasm));
}

self.onmessage = async (e: MessageEvent<{ samples: Float32Array }>) => {
  try {
    self.postMessage({ type: "stage", stage: "Analyzing rhythm..." });
    const es = await init(), vec = es.arrayToVector(e.data.samples);
    const r = es.RhythmExtractor2013(vec, 208, "multifeature", 40);
    self.postMessage({ type: "stage", stage: "Detecting key..." });
    const k = es.KeyExtractor(vec);
    let danceability: number | undefined;
    try { danceability = es.Danceability(vec).danceability; } catch {}
    vec.delete?.();
    self.postMessage({ type: "done", bpm: r.bpm, bpmConf: r.confidence, key: k.key, scale: k.scale, strength: k.strength, danceability });
  } catch (err: any) {
    self.postMessage({ type: "error", msg: String(err?.message || err) });
  }
};
export {};
