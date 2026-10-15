import assert from "node:assert/strict";
import { toInt16, fileBase, stamp } from "../lib/exportUtils.ts";
assert.deepEqual([...toInt16(new Float32Array([1, -1, 0, 2, -2, 0.5]))], [32767, -32768, 0, 32767, -32768, 16383]);
assert.equal(stamp(new Date(2026, 9, 15)), "20261015");
assert.equal(fileBase("Qhomu", 122, new Date(2026, 9, 15)), "sto2026-qhomu-122bpm-20261015");
assert.equal(fileBase("Afro Deep", 121.6, new Date(2026, 0, 5)), "sto2026-afro-deep-122bpm-20260105");
console.log("export helpers: all tests passed");
