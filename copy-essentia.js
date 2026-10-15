// Copies browser builds of Essentia.js and lamejs into /public so Web Workers can load them (same-origin, cached by the browser).
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
function copy(pkgDir, match, dstName) {
  const src = path.join(root, "node_modules", ...pkgDir), dst = path.join(root, "public", dstName);
  if (!fs.existsSync(src)) { console.warn(pkgDir.join("/"), "not installed, skipping"); return; }
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) if (match(f)) fs.copyFileSync(path.join(src, f), path.join(dst, f));
  console.log(dstName + ":", fs.readdirSync(dst).join(", "));
}
copy(["essentia.js", "dist"], (f) => /^essentia-wasm\.web\./.test(f) || f === "essentia.js-core.js", "essentia");
// lamejs ships lame.min.js (fallback: lame.all.js, renamed below)
const lameDir = path.join(root, "node_modules", "lamejs");
if (fs.existsSync(lameDir)) {
  const pick = ["lame.min.js", "lame.all.js"].find((f) => fs.existsSync(path.join(lameDir, f)));
  if (pick) { fs.mkdirSync(path.join(root, "public", "lame"), { recursive: true }); fs.copyFileSync(path.join(lameDir, pick), path.join(root, "public", "lame", "lame.min.js")); console.log("lame: copied", pick); }
  else console.warn("lamejs: no browser build found");
} else console.warn("lamejs not installed, skipping");
