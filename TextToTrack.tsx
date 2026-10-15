"use client";
import { useEffect, useState } from "react";
import GenreChips from "./GenreChips";
import Waveform from "./Waveform";
import { DEFAULT_BPM, KEYS, Params, play, progress, stop } from "@/lib/audioEngine";
import { makeTrack } from "@/lib/generate";
import ExportButtons from "./ExportButtons";
import type { Load } from "@/lib/musicgen";

type Saved = Params & { id: number; prompt: string };
const LS = "sto2026.tracks";

export default function TextToTrack({ handoff }: { handoff?: { bpm: number; key: string } | null }) {
  const [p, setP] = useState<Params>({ genre: "Qhomu", bpm: 112, key: "F", duration: 15 });
  const [prompt, setPrompt] = useState("");
  const [buf, setBuf] = useState<AudioBuffer | null>(null);
  const [busy, setBusy] = useState(false), [playing, setPlaying] = useState(false), [copied, setCopied] = useState(false);
  const [prog, setProg] = useState(0), [saved, setSaved] = useState<Saved[]>([]);
  const [load, setLoad] = useState<Load | null>(null), [engine, setEngine] = useState(""), [made, setMade] = useState<Params | null>(null);

  useEffect(() => { if (handoff) setP((x) => ({ ...x, bpm: handoff.bpm, key: handoff.key })); }, [handoff]);
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(LS) || "[]")); } catch {}
    const m = location.hash.match(/^#t=(.+)$/);
    if (m) try { const s = JSON.parse(atob(m[1])); setP(s); setPrompt(s.prompt || ""); generate(s, s.prompt || ""); } catch {}
    return () => stop();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!playing) return; let id = 0;
    const tick = () => { setProg(progress()); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id);
  }, [playing]);

  async function generate(base: Params = p, pr: string = prompt) {
    stop(); setPlaying(false); setBusy(true);
    const r = await makeTrack(pr, base, setLoad); const q = r.params, b = r.buffer;
    setP(q); setMade(q); setEngine(r.engine); setBuf(b); setBusy(false); setLoad(null);
    const next = [{ ...q, id: Date.now(), prompt: pr }, ...saved].slice(0, 10);
    setSaved(next); localStorage.setItem(LS, JSON.stringify(next));
    setPlaying(true); play(b, () => { setPlaying(false); setProg(0); });
  }
  const toggle = () => { if (!buf) return; if (playing) { stop(); setPlaying(false); } else { setPlaying(true); play(buf, () => { setPlaying(false); setProg(0); }); } };
  const share = async () => { await navigator.clipboard.writeText(`${location.origin}/#t=${btoa(JSON.stringify({ ...p, prompt }))}`); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const label = "mb-2 block text-sm text-zinc-400";

  return (
    <section className="space-y-6 rounded-xl border border-line bg-rack p-5">
      <div>
        <label className={label} htmlFor="prompt">Describe the track (optional)</label>
        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
          placeholder="Durban qhomu log drum, 118 BPM, in F# minor" className="w-full rounded-md border border-line bg-ink p-3 text-sm" />
      </div>
      <GenreChips value={p.genre} onChange={(g) => setP({ ...p, genre: g, bpm: DEFAULT_BPM[g] })} />
      <div className="grid gap-5 sm:grid-cols-3">
        <div><label className={label} htmlFor="bpm">BPM: <b className="text-accent">{p.bpm}</b></label>
          <input id="bpm" type="range" min={60} max={160} value={p.bpm} onChange={(e) => setP({ ...p, bpm: +e.target.value })} className="w-full" /></div>
        <div><label className={label} htmlFor="key">Key (minor)</label>
          <select id="key" value={p.key} onChange={(e) => setP({ ...p, key: e.target.value })} className="w-full rounded-md border border-line bg-ink p-2 text-sm">
            {KEYS.map((k) => <option key={k}>{k}</option>)}</select></div>
        <div><span className={label}>Length</span>
          <div className="flex gap-2">{[15, 30, 60].map((d) => (
            <button key={d} onClick={() => setP({ ...p, duration: d })} aria-pressed={p.duration === d}
              className={`flex-1 rounded-md border py-2 text-sm ${p.duration === d ? "border-accent text-accent" : "border-line text-zinc-300"}`}>{d}s</button>))}</div></div>
      </div>
      <button onClick={() => generate()} disabled={busy} className="w-full rounded-md bg-accent py-3 font-bold text-black disabled:opacity-50">
        {busy ? "Generating…" : "Generate track"}</button>
      {load && (
        <div role="status" aria-live="polite">
          <p className="mb-1 text-xs text-zinc-400">{load.stage}{load.pct != null && ` ${Math.round(load.pct)}%`}</p>
          <div className="h-2 overflow-hidden rounded bg-ink">
            <div className={`h-full bg-accent ${load.pct == null ? "w-full animate-pulse" : "transition-all"}`} style={load.pct != null ? { width: `${load.pct}%` } : undefined} />
          </div>
        </div>)}
      <Waveform buffer={buf} progress={prog} height={96} />
      {engine && !busy && <p className="text-xs text-zinc-500">Made with {engine}</p>}
      {buf && (
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={toggle} className="rounded-md bg-line px-4 py-2">{playing ? "Stop" : "Play"}</button>
          <button onClick={share} className="rounded-md bg-line px-4 py-2">{copied ? "Link copied" : "Copy share link"}</button>
        </div>)}
      {buf && <ExportButtons getBuffer={() => buf} genre={(made ?? p).genre} bpm={(made ?? p).bpm} />}
      {saved.length > 0 && (
        <div><h3 className="mb-2 text-sm text-zinc-400">Recent tracks (this browser)</h3>
          <ul className="space-y-1">{saved.map((s) => (
            <li key={s.id}><button onClick={() => { setP(s); setPrompt(s.prompt); generate(s, s.prompt); }} className="w-full rounded px-3 py-2 text-left text-sm hover:bg-line">
              {s.genre} · {s.bpm} BPM · {s.key} · {s.duration}s</button></li>))}</ul></div>)}
    </section>
  );
}
