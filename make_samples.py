# Generates 4 original qhomu-style log drum loops (WAV) into public/samples. Run: python3 make_samples.py
import wave, struct, math, random
SR = 44100
def loop(name, bpm, pat, f0):
    step = 60 / bpm / 4; n = int(SR * step * 16); out = [0.0] * n
    for i, hit in enumerate(pat):
        if not hit: continue
        f = f0 * (1.5 if hit == 2 else 1); s0 = int(i * step * SR); ph = 0
        for j in range(int(SR * 0.5)):
            if s0 + j >= n: break
            t = j / SR; fr = f * (1 + 1.4 * math.exp(-t * 28)); ph += 2 * math.pi * fr / SR
            out[s0 + j] += 0.8 * math.sin(ph) * math.exp(-t * 7)
    for i in range(2, 16, 4):
        s0 = int(i * step * SR)
        for j in range(int(SR * 0.04)):
            if s0 + j < n: out[s0 + j] += random.uniform(-1, 1) * 0.12 * (1 - j / (SR * 0.04))
    m = max(abs(x) for x in out) or 1
    with wave.open(f"public/samples/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(x / m * 30000)) for x in out))
loop("qhomu-loop-1", 112, [1,0,0,1,0,0,2,0,1,0,0,1,0,0,2,0], 55)
loop("qhomu-loop-2", 115, [1,0,0,1,0,2,0,0,1,0,0,1,0,0,1,0], 49)
loop("qhomu-loop-3", 118, [1,0,1,0,0,0,2,0,1,0,0,1,0,2,0,0], 58)
loop("qhomu-loop-4", 108, [1,0,0,0,1,0,0,2,0,0,1,0,0,1,0,2], 52)
