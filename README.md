# sto2026
Free Afro music generator. No auth, no paywall, no API keys.

    npm install && npm run dev      # http://localhost:3000
    npx vercel --prod               # deploy (free Hobby tier), or import the repo at vercel.com/new

Status: Text to Track + Upload Remix. Prompts containing "qhomu" or "Afro Deep" use MusicGen small (browser, cached in IndexedDB); everything else uses Tone.js presets. Stems are still a mock.
Next: real Demucs (lib/stemSplitter.ts), MP3 via lamejs. Essentia.js BPM/key runs in a worker (files copied to public/essentia on npm install).

## Packages
- `next`, `react`, `tailwindcss`: app + UI.
- `tone`: preset playback and offline rendering.
- `@huggingface/transformers`: MusicGen small in the browser (model cached in IndexedDB).
- `essentia.js`: BPM/key detection (WASM, loaded by a worker from `public/essentia`).
- `lamejs`: MP3 encoding (loaded by a worker from `public/lame`). `@types/lamejs` is not needed because it is loaded as a plain script, not imported.
`npm install` runs `scripts/copy-essentia.js` (postinstall), which copies the Essentia and lamejs browser builds into `public/`. Vercel runs it automatically.
Exports: WAV (full quality) and MP3 128 kbps (mono stays mono). Filenames: `sto2026-{genre}-{bpm}bpm-{YYYYMMDD}`.
