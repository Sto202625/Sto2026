import assert from "node:assert/strict";
import { foldBpm, normKey, minorRoot, confidence } from "../lib/analysisMath.ts";
assert.equal(foldBpm(78), 78); assert.equal(foldBpm(122.4), 122); assert.equal(foldBpm(244), 122);
assert.equal(foldBpm(30), 60); assert.equal(foldBpm(0), 122); assert.equal(foldBpm(NaN), 122);
assert.equal(normKey("Bb"), "A#"); assert.equal(normKey("F#"), "F#");
assert.equal(minorRoot("A", "major"), "F#"); assert.equal(minorRoot("C", "major"), "A"); assert.equal(minorRoot("F#", "minor"), "F#");
assert.equal(confidence(5, 1), 100); assert.equal(confidence(0, 0), 0); assert.equal(confidence(1.75, 0.5), 50);
console.log("analysis math: all tests passed");
