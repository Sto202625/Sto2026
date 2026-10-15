"use client";
import { useState } from "react";
import { download } from "@/lib/audioEngine";
import { wavToMp3 } from "@/lib/export";
import { fileBase, saveBlob } from "@/lib/exportUtils";

export default function ExportButtons({ getBuffer, genre, bpm }: { getBuffer: () => AudioBuffer | null; genre: string; bpm: number }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const wav = () => { const b = getBuffer(); if (b) download(b, fileBase(genre, bpm)); };
  async function mp3() {
    const b = getBuffer(); if (!b) return;
    setBusy(true); setErr("");
    try { saveBlob(await wavToMp3(b, 128), fileBase(genre, bpm) + ".mp3"); }
    catch (e) { console.warn(e); setErr("MP3 encoding failed. Download the WAV instead."); }
    setBusy(false);
  }
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <button onClick={wav} className="w-full rounded-md bg-line px-4 py-2">Download WAV</button>
        <p className="mt-1 text-xs text-zinc-500">Full quality</p>
      </div>
      <div>
        <button onClick={mp3} disabled={busy} className="w-full rounded-md bg-accent px-4 py-2 font-semibold text-black disabled:opacity-70">
          {busy
            ? <span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent motion-reduce:animate-none" />Encoding...</span>
            : "Download MP3 - for WhatsApp"}
        </button>
        <p className="mt-1 text-xs text-zinc-500">MP3 is smaller, best for WhatsApp Status & TikTok</p>
      </div>
      {err && <p className="col-span-2 text-xs text-red-400" role="alert">{err}</p>}
    </div>
  );
}
