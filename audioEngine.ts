import * as Tone from "tone";
import { PRESETS, GENRES, KEYS, Params, Genre } from "./presets";
export * from "./presets";

export async function renderTrack(p: Params): Promise<AudioBuffer> {
  await Tone.start();
  const buf = await Tone.Offline(({ transport }) => {
    transport.bpm.value = p.bpm;
    PRESETS[p.genre](p.key);
    transport.start(0);
  }, p.duration);
  return buf.get() as AudioBuffer;
}

// Decode at Tone's sample rate so uploads and generated layers mix without pitch drift.
export async function decodeFile(file: File): Promise<AudioBuffer> {
  return (Tone.getContext().rawContext as AudioContext).decodeAudioData(await file.arrayBuffer());
}

let player: Tone.Player | null = null, t0 = 0, dur = 1;
export async function play(buf: AudioBuffer, onEnd?: () => void) {
  await Tone.start(); stop();
  const p = (player = new Tone.Player(buf).toDestination());
  p.onstop = () => onEnd?.(); p.start(); t0 = Tone.now(); dur = buf.duration;
}
export function stop() {
  if (!player) return; const p = player; player = null; p.onstop = () => {}; p.stop(); p.dispose();
}
export const progress = () => (player ? Math.min(1, (Tone.now() - t0) / dur) : 0);

export function mix(stems: AudioBuffer[]): AudioBuffer {
  const sr = stems[0].sampleRate, len = Math.max(...stems.map((s) => s.length));
  const out = new AudioBuffer({ length: len, numberOfChannels: 2, sampleRate: sr });
  for (let c = 0; c < 2; c++) {
    const o = out.getChannelData(c);
    for (const s of stems) { const d = s.getChannelData(Math.min(c, s.numberOfChannels - 1)); for (let i = 0; i < d.length; i++) o[i] += d[i] * 0.8; }
  }
  return out;
}

export function toWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels, n = buf.length, ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => buf.getChannelData(c)); let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, s * 0x7fff, true); o += 2; }
  return new Blob([ab], { type: "audio/wav" });
}
export function download(buf: AudioBuffer, name: string) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(toWav(buf)); a.download = name + ".wav"; a.click();
}

// "make this qhomu log drum, 120 BPM, in F# minor" -> params
export function parsePrompt(text: string, base: Params): Params {
  const t = text.toLowerCase(), p = { ...base };
  const g = GENRES.find((x) => t.includes(x.toLowerCase())) ||
    (/afro|amapiano/.test(t) ? "Afro Deep" : /trap|808/.test(t) ? "Rap" : /choir/.test(t) ? "Gospel" : undefined);
  if (g) p.genre = g as Genre;
  const b = t.match(/(\d{2,3})\s*bpm/); if (b) p.bpm = Math.min(160, Math.max(60, +b[1]));
  const k = text.match(/\b([A-G]#?)\s*(?:minor|major|min|maj)\b/i); if (k && KEYS.includes(k[1].toUpperCase())) p.key = k[1].toUpperCase();
  return p;
}
