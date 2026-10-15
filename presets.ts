import * as Tone from "tone";
export const GENRES = ["Afro Deep", "Qhomu", "Rap", "Gospel", "Jazz"] as const;
export type Genre = (typeof GENRES)[number];
export const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const DEFAULT_BPM: Record<Genre, number> = { "Afro Deep": 122, Qhomu: 112, Rap: 140, Gospel: 90, Jazz: 100 };
export interface Params { genre: Genre; bpm: number; key: string; duration: number; }

const note = (root: string, oct: number, semi = 0) => Tone.Frequency(root + oct).transpose(semi).toNote();
const seq = (pat: (number | null)[], fn: (t: number, s: number) => void, sub = "16n") =>
  new Tone.Sequence((t, s) => { if (s !== null) fn(t, s as number); }, pat, sub).start(0);
const hits = (on: number[], len = 16) => Array.from({ length: len }, (_, i) => (on.includes(i) ? i : null));
const noise = (vol: number, decay: number, f = 7000) => {
  const n = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay, sustain: 0 }, volume: vol });
  n.connect(new Tone.Filter(f, "highpass").toDestination()); return n;
};
const kick = (vol = -4) => new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0 }, volume: vol }).toDestination();
const pad = (vol: number, attack = 0.8) => {
  const p = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack, decay: 0.2, sustain: 0.7, release: 1.5 }, volume: vol });
  p.connect(new Tone.Filter(1400, "lowpass").toDestination()); return p;
};
const chord = (root: string, oct: number, deg: number, minor = true) =>
  (minor ? [0, 3, 7, 10] : [0, 4, 7, 11]).map((s) => note(root, oct, deg + s));
const prog = (p: Tone.PolySynth, chords: string[][], len = "1m") =>
  new Tone.Sequence((t, c) => p.triggerAttackRelease(c as string[], len, t), chords as any, "1m").start(0);

export const PRESETS: Record<Genre, (key: string) => void> = {
  // Qhomu: deep sine log drum with pitch glide, syncopated, shaker on offbeats
  Qhomu: (k) => {
    const log = new Tone.MembraneSynth({ pitchDecay: 0.12, octaves: 2.5, envelope: { attack: 0.002, decay: 0.55, sustain: 0 }, volume: -2 }).toDestination();
    const sh = noise(-22, 0.05);
    seq(hits([0, 3, 6, 8, 11, 14]), (t, s) => log.triggerAttackRelease(note(k, s % 8 === 6 ? 2 : 1, s === 14 ? 7 : 0), "8n", t));
    seq(hits([2, 6, 10, 14]), (t) => sh.triggerAttackRelease("32n", t));
    prog(pad(-22, 1.2), [chord(k, 3, 0), chord(k, 3, 8, false)]);
  },
  // Afro Deep (Afro House): four-on-floor, 3-step offbeat bass, hats
  "Afro Deep": (k) => {
    const kk = kick(), hat = noise(-20, 0.08, 8000);
    const bass = new Tone.MonoSynth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.1 }, volume: -10 }).toDestination();
    seq(hits([0, 4, 8, 12]), (t) => kk.triggerAttackRelease("C1", "8n", t));
    seq(hits([2, 6, 10, 14]), (t) => hat.triggerAttackRelease("16n", t));
    seq(hits([1, 4, 10]), (t, s) => bass.triggerAttackRelease(note(k, 1, s === 10 ? 3 : 0), "8n", t));
    prog(pad(-24), [chord(k, 3, 0), chord(k, 3, 5)]);
  },
  // Gospel: slow choir-style pad chords + soft kick/clap
  Gospel: (k) => {
    const p = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 2 }, volume: -16 });
    p.connect(new Tone.Reverb(3).toDestination());
    prog(p, [chord(k, 3, 0, false), chord(k, 3, 5, false), chord(k, 3, 7, false), chord(k, 3, 0, false)]);
    const kk = kick(-10), clap = noise(-18, 0.12, 1500);
    seq(hits([0, 8]), (t) => kk.triggerAttackRelease("C1", "8n", t));
    seq(hits([4, 12]), (t) => clap.triggerAttackRelease("16n", t));
  },
  // Jazz: swung brushed drums + walking bass + 7th chords
  Jazz: (k) => {
    const tr = Tone.getTransport(); tr.swing = 0.5; tr.swingSubdivision = "8n";
    const brush = noise(-18, 0.25, 3000);
    const bass = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.2 }, volume: -8 }).toDestination();
    const walk = [0, 3, 5, 7, 10, 7, 5, 3], eighths = [0, 2, 4, 6, 8, 10, 12, 14];
    seq(hits(eighths), (t, s) => brush.triggerAttackRelease(s % 4 === 0 ? "8n" : "16n", t));
    seq(hits(eighths), (t, s) => bass.triggerAttackRelease(note(k, 2, walk[s / 2]), "8n", t));
    prog(pad(-22, 0.1), [chord(k, 3, 0), chord(k, 3, 5, false)], "2n");
  },
  // Rap: 808 trap, hat rolls
  Rap: (k) => {
    const s808 = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 3, envelope: { attack: 0.001, decay: 0.9, sustain: 0.1, release: 0.5 }, volume: -3 }).toDestination();
    const hat = noise(-20, 0.04, 9000), snare = noise(-12, 0.15, 1800);
    seq(hits([0, 3, 7, 10, 14]), (t, s) => s808.triggerAttackRelease(note(k, 1, s === 10 ? 3 : s === 14 ? 7 : 0), s === 0 ? "4n" : "8n", t));
    seq(hits(Array.from({ length: 16 }, (_, i) => i)), (t, s) => hat.triggerAttackRelease("32n", t, s % 2 ? 0.4 : 0.9));
    seq(hits([8]), (t) => snare.triggerAttackRelease("16n", t));
  },
};
