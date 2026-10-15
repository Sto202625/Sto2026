import { Params, parsePrompt, renderTrack } from "./audioEngine";
import { Load, musicgen, shouldUseMusicGen } from "./musicgen";

const AI_SECONDS = 10; // browser CPU is slow; generate a 10s phrase and loop it to the requested length
const STYLE: Record<string, string> = {
  Qhomu: "South African qhomu amapiano, deep log drum bass, shakers, soft pads",
  "Afro Deep": "afro deep house, 3-step bassline, warm pads, percussion",
};

function tile(b: AudioBuffer, secs: number) {
  const len = Math.round(secs * b.sampleRate); if (b.length >= len) return b;
  const o = new AudioBuffer({ length: len, numberOfChannels: b.numberOfChannels, sampleRate: b.sampleRate });
  for (let c = 0; c < b.numberOfChannels; c++) { const s = b.getChannelData(c), d = o.getChannelData(c); for (let i = 0; i < len; i++) d[i] = s[i % s.length]; }
  return o;
}

// "qhomu" or "Afro Deep" in the prompt, or either genre chip selected -> MusicGen. Otherwise (or on any MusicGen failure) -> Tone.js preset.
export async function makeTrack(prompt: string, base: Params, onLoad: (l: Load | null) => void) {
  const params = parsePrompt(prompt, base);
  if (shouldUseMusicGen(prompt) || ["Qhomu", "Afro Deep"].includes(params.genre)) {
    try {
      const text = [prompt, STYLE[params.genre] || params.genre, `${params.bpm} BPM`, "instrumental"].filter(Boolean).join(", ");
      const raw = await musicgen(text, Math.min(params.duration, AI_SECONDS), onLoad);
      return { params, buffer: tile(raw, params.duration), engine: "MusicGen (AI)" };
    } catch (e: any) {
      console.warn("MusicGen failed, using preset:", e);
      onLoad({ stage: "MusicGen unavailable, using preset", pct: null });
    }
  }
  return { params, buffer: await renderTrack(params), engine: "Tone.js preset" };
}
