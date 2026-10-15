"use client";
import { useEffect, useRef } from "react";
export default function Waveform({ buffer, progress = 0, height = 80, color = "#FF6B2B" }:
  { buffer: AudioBuffer | null; progress?: number; height?: number; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const w = (c.width = c.clientWidth * 2), h = (c.height = height * 2);
    const g = c.getContext("2d")!; g.clearRect(0, 0, w, h);
    if (!buffer) return;
    const d = buffer.getChannelData(0), step = Math.max(1, Math.floor(d.length / w));
    for (let x = 0; x < w; x++) {
      let max = 0; for (let i = 0; i < step; i++) max = Math.max(max, Math.abs(d[x * step + i] || 0));
      g.fillStyle = x / w < progress ? color : "#4a4a52";
      const bh = Math.max(2, max * h * 0.95); g.fillRect(x, (h - bh) / 2, 1, bh);
    }
  }, [buffer, progress, height, color]);
  return <canvas ref={ref} style={{ width: "100%", height }} className="rounded bg-ink" />;
}
