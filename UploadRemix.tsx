"use client";
import { useEffect, useState } from "react";
import Waveform from "./Waveform";
import { Stem, splitStems } from "@/lib/stemSplitter";
import { KEYS, decodeFile, mix, play, progress, stop } from "@/lib/audioEngine";
import { Analysis, analyze } from "@/lib/essentia";
import { makeTrack } from "@/lib/generate";
import ExportButtons from "./ExportButtons";

export default function UploadRemix({ onUseDetected }: { onUseDetected: (bpm: number, key: string) => void }) {
  const [an, setAn] = useState<Analysis | null>(null), [stage, setStage] = useState(""), [bpm, setBpm] = useState(122), [rkey, setRkey] = useState("C");
  const [src, setSrc] = useState<AudioBuffer | null>(null), [stems, setStems] = useState<Stem[]>([]);
  const [muted, setMuted] = useState<string[]>([]), [solo, setSolo] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false), [prog, setProg] = useState(0);
  useEffect(() => () => stop(), []);

  const active = () => stems.filter((s) => (solo ? s.name === solo : !muted.includes(s.name)));
  const current = () => (stems.length ? (active().length ? mix(active().map((s) => s.buffer)) : null) : src);
  const start = (b: AudioBuffer | null) => { if (!b) { stop(); setPlaying(false); return; } setPlaying(true); play(b, () => { setPlaying(false); setProg(0); }); };
  useEffect(() => { if (playing) start(current()); }, [muted, solo, stems]); // eslint-disable-line
  useEffect(() => {
    if (!playing) return; let id = 0; const tick = () => { setProg(progress()); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id);
  }, [playing]);

  async function onFile(f?: File) {
    if (!f) return; stop(); setPlaying(false); setStems([]); setMsg("");
    try { const b = await decodeFile(f);
      if (b.duration > 30) { setSrc(null); setMsg("That clip is over 30 seconds. Trim it and upload again."); return; }
      setSrc(b); setAn(null); setStage("Analyzing rhythm...");
      analyze(b, setStage).then((a) => { setAn(a); setBpm(a.bpm); setRkey(a.formKey); setStage(""); });
    } catch { setMsg("Couldn't read that file. Use an MP3 or WAV."); }
  }
  async function split() { if (!src) return; setBusy(true); setMsg("Splitting (trial mode: filter-based stems)…"); setStems(await splitStems(src)); setMuted([]); setSolo(null); setBusy(false); setMsg(""); }
  async function remix() {
    if (!src) return; setBusy(true);
    const r = await makeTrack(prompt, { genre: "Qhomu", bpm, key: rkey, duration: Math.ceil(src.duration) },
      (l) => l && setMsg(l.stage + (l.pct != null ? ` ${Math.round(l.pct)}%` : "…")));
    const q = r.params, layer = r.buffer;
    setStems((s) => [...s.filter((x) => x.name !== "AI layer"), { name: "AI layer", buffer: layer }]); setBusy(false);
    setMsg(`Added ${q.genre} layer at ${q.bpm} BPM. Mute stems to hear it on its own.`);
  }
  const btn = "rounded px-3 py-1 text-xs";

  return (
    <section className="space-y-6 rounded-xl border border-line bg-rack p-5">
      <div>
        <label htmlFor="file" className="mb-2 block text-sm text-zinc-400">Upload MP3 or WAV (30 seconds max)</label>
        <input id="file" type="file" accept="audio/mpeg,audio/wav,.mp3,.wav" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" />
      </div>
      {msg && <p className="text-sm text-accent" role="status">{msg}</p>}
      {src && <>
        {(stage || an) && (
          <div className="space-y-2 rounded-md border border-line bg-ink p-3 text-sm" role="status" aria-live="polite">
            {stage ? <p className="text-zinc-400">{stage}</p> : an?.failed ? <p>Analysis unavailable. Using 122 BPM, C minor.</p> : an && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span>Detected: <b>{an.bpm} BPM</b>, Key: <b>{an.key} {an.scale}</b>, Confidence: <b>{an.confidence}%</b></span>
                <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-black">AI Detected</span>
                {an.danceability != null && <span className="text-xs text-zinc-500">Danceability {an.danceability.toFixed(1)}</span>}
                <button onClick={() => onUseDetected(an.bpm, an.formKey)} className="rounded bg-line px-3 py-1 text-xs">Use Detected</button>
              </div>)}
          </div>)}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="rbpm" className="mb-1 block text-sm text-zinc-400">Remix BPM: <b className="text-accent">{bpm}</b>
            {an && !an.failed && bpm === an.bpm && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-black">AI Detected</span>}</label>
            <input id="rbpm" type="range" min={60} max={160} value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-full" /></div>
          <div><label htmlFor="rkey" className="mb-1 block text-sm text-zinc-400">Remix key (minor)</label>
            <select id="rkey" value={rkey} onChange={(e) => setRkey(e.target.value)} className="w-full rounded-md border border-line bg-ink p-2 text-sm">
              {KEYS.map((k) => <option key={k}>{k}</option>)}</select></div>
        </div>
        <Waveform buffer={src} progress={prog} height={96} />
        <div className="flex gap-2 text-sm">
          <button onClick={() => (playing ? (stop(), setPlaying(false)) : start(current()))} className="rounded-md bg-line px-4 py-2">{playing ? "Stop" : "Play"}</button>
          {!stems.length && <button onClick={split} disabled={busy} className="rounded-md bg-accent px-4 py-2 font-semibold text-black disabled:opacity-50">Split into stems</button>}
        </div></>}
      {stems.length > 0 && <>
        <ul className="space-y-2">{stems.map((s) => (
          <li key={s.name} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3">
            <span className="text-sm">{s.name}</span>
            <Waveform buffer={s.buffer} height={36} color={s.name === "AI layer" ? "#FF6B2B" : "#9a9aa5"} />
            <span className="flex gap-1">
              <button aria-pressed={muted.includes(s.name)} onClick={() => setMuted((m) => (m.includes(s.name) ? m.filter((x) => x !== s.name) : [...m, s.name]))}
                className={`${btn} ${muted.includes(s.name) ? "bg-accent text-black" : "bg-line"}`}>Mute</button>
              <button aria-pressed={solo === s.name} onClick={() => setSolo(solo === s.name ? null : s.name)}
                className={`${btn} ${solo === s.name ? "bg-accent text-black" : "bg-line"}`}>Solo</button></span>
          </li>))}</ul>
        <ExportButtons getBuffer={current} genre="remix" bpm={bpm} />
        <div>
          <label htmlFor="rp" className="mb-2 block text-sm text-zinc-400">Remix with prompt</label>
          <div className="flex gap-2">
            <input id="rp" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="make this qhomu log drum, 120 BPM, Durban style"
              className="flex-1 rounded-md border border-line bg-ink p-3 text-sm" />
            <button onClick={remix} disabled={busy} className="rounded-md bg-accent px-4 font-semibold text-black disabled:opacity-50">Remix</button>
          </div></div></>}
    </section>
  );
}
