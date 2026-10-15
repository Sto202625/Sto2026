// Pure helpers (no browser deps) so they can be unit-tested in plain Node.
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };
export const normKey = (k: string) => FLAT[k] || k;
// Fold octave errors (61 vs 122) into a musical range. 78 BPM stays 78.
export function foldBpm(b: number) {
  if (!(b > 0)) return 122;
  while (b > 160) b /= 2;
  while (b < 60) b *= 2;
  return Math.round(b);
}
// Presets are minor-key based: a major key maps to its relative minor (A major -> F# minor).
export const minorRoot = (root: string, scale: string) => (scale === "major" ? NOTES[(NOTES.indexOf(root) + 9) % 12] : root);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// RhythmExtractor2013 confidence is ~0-5 (above 3.5 is strong); key strength is 0-1.
export const confidence = (bpmConf: number, keyStrength: number) => Math.round(100 * (clamp01(bpmConf / 3.5) + clamp01(keyStrength)) / 2);
