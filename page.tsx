"use client";
import { useState } from "react";
import TextToTrack from "@/components/TextToTrack";
import UploadRemix from "@/components/UploadRemix";

export default function Home() {
  const [mode, setMode] = useState<"text" | "remix">("text");
  const [handoff, setHandoff] = useState<{ bpm: number; key: string } | null>(null);
  const tab = (m: typeof mode, label: string) => (
    <button onClick={() => setMode(m)} aria-pressed={mode === m}
      className={`px-5 py-2 rounded-md text-sm font-semibold ${mode === m ? "bg-accent text-black" : "bg-rack text-zinc-300 hover:bg-line"}`}>{label}</button>
  );
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-5xl font-black tracking-tight">sto<span className="text-accent">2026</span></h1>
        <p className="mt-2 text-zinc-400">Afro Deep • Qhomu • Rap • Gospel • Jazz</p>
        <p className="mt-1 text-xs text-zinc-500">Free trial. No sign-up. Your tracks stay in this browser.</p>
      </header>
      <div className="mb-6 flex gap-2">{tab("text", "Text to track")}{tab("remix", "Upload remix")}</div>
      {mode === "text" ? <TextToTrack handoff={handoff} /> : <UploadRemix onUseDetected={(bpm, key) => { setHandoff({ bpm, key }); setMode("text"); }} />}
    </main>
  );
}
