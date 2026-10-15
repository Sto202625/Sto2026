"use client";
import { GENRES, Genre } from "@/lib/presets";
export default function GenreChips({ value, onChange }: { value: Genre; onChange: (g: Genre) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Genre">
      {GENRES.map((g) => (
        <button key={g} role="radio" aria-checked={value === g} onClick={() => onChange(g)}
          className={`rounded-full border px-4 py-1.5 text-sm ${value === g ? "border-accent bg-accent text-black font-semibold" : "border-line bg-rack text-zinc-300 hover:border-zinc-500"}`}>{g}</button>
      ))}
    </div>
  );
}
