// MP3 encoding off the main thread. lamejs is loaded as a plain script (its npm entry breaks under bundlers).
declare function importScripts(...urls: string[]): void;
declare const lamejs: any;

self.onmessage = (e: MessageEvent<{ pcm: Int16Array[]; sampleRate: number; bitrate: number }>) => {
  try {
    if (typeof lamejs === "undefined") importScripts("/lame/lame.min.js");
    const { pcm, sampleRate, bitrate } = e.data;
    const enc = new lamejs.Mp3Encoder(pcm.length, sampleRate, bitrate), B = 1152, chunks: Uint8Array[] = [];
    for (let i = 0; i < pcm[0].length; i += B) {
      const l = pcm[0].subarray(i, i + B), r = pcm[1]?.subarray(i, i + B);
      const out = r ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l);
      if (out.length) chunks.push(new Uint8Array(out));
    }
    const end = enc.flush(); if (end.length) chunks.push(new Uint8Array(end));
    self.postMessage({ type: "done", chunks });
  } catch (err: any) {
    self.postMessage({ type: "error", msg: String(err?.message || err) });
  }
};
export {};
