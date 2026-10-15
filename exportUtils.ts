// Small helpers for exporting audio. Everything except saveBlob is pure and unit-tested in Node.
export function toInt16(f: Float32Array): Int16Array {
  const o = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) { const s = Math.max(-1, Math.min(1, f[i])); o[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
  return o;
}
export function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
// sto2026-qhomu-122bpm-20261015
export const fileBase = (genre: string, bpm: number, d = new Date()) =>
  `sto2026-${genre.toLowerCase().replace(/\s+/g, "-")}-${Math.round(bpm)}bpm-${stamp(d)}`;
export function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
