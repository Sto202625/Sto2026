// TRIAL MODE: fake split using filter bands so mute/solo works end to end.
// To go real: load a Demucs ONNX model here (onnxruntime-web) and return its 4 outputs in the same shape.
export interface Stem { name: string; buffer: AudioBuffer; }
const BANDS: { name: string; type: BiquadFilterType; f: number; q: number }[] = [
  { name: "Vocals", type: "bandpass", f: 1500, q: 0.5 },
  { name: "Drums", type: "highpass", f: 4000, q: 0.7 },
  { name: "Bass", type: "lowpass", f: 200, q: 0.7 },
  { name: "Other", type: "bandpass", f: 600, q: 0.3 },
];
export async function splitStems(src: AudioBuffer): Promise<Stem[]> {
  return Promise.all(BANDS.map(async (b) => {
    const ctx = new OfflineAudioContext(src.numberOfChannels, src.length, src.sampleRate);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter();
    s.buffer = src; f.type = b.type; f.frequency.value = b.f; f.Q.value = b.q;
    s.connect(f); f.connect(ctx.destination); s.start();
    return { name: b.name, buffer: await ctx.startRendering() };
  }));
}
