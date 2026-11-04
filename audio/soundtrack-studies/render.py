"""Rebuild the soundtrack references with Python, NumPy, SciPy and FFmpeg/libmp3lame.

Run from any directory. Outputs go beside this script or to the supplied directory.
The compositions use recorded cue excerpts and harmonics measured from those cues.
"""

import argparse
import base64
import json
import math
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile
from synth_kit import make_kit

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SR = 44100
CUES = {
    "flute": 23166,
    "horn": 20958,
    "drum": 13416,
    "bubbles": 26264,
    "drip": 17249,
    "splash": 15841,
    "ping": 9009,
    "clank": 31726,
    "chain": 32414,
}


def load_samples():
    samples = {}
    for name, ident in CUES.items():
        with wave.open(str(ROOT / f"archive/es/sounds/ASND-{ident}.wav"), "rb") as f:
            assert f.getnchannels() == f.getsampwidth() == 1
            samples[name] = (
                np.frombuffer(f.readframes(f.getnframes()), np.uint8),
                f.getframerate(),
            )
    bank = (ROOT / "audio/dark-castle-bank.js").read_text(encoding="utf8")
    knock = re.search(r'"69"\s*:\s*"([^"]+)"', bank)
    samples["knock"] = (np.frombuffer(base64.b64decode(knock[1]), np.uint8), 11025)
    for name, (raw, rate) in samples.items():
        pcm = (raw.astype(float) - 128) / 128
        common = math.gcd(SR, rate)
        samples[name] = signal.resample_poly(pcm, SR // common, rate // common)
    return samples


def filt(audio, hz, kind="lowpass"):
    return signal.sosfilt(signal.butter(3, hz, btype=kind, fs=SR, output="sos"), audio, axis=0)


def soften(a, attack=0.012, release=0.07):
    a = a.copy()
    for duration, side in [(attack, a), (release, a[::-1])]:
        n = min(len(a), max(1, round(duration * SR)))
        fade = np.sin(np.linspace(0, np.pi / 2, n)) ** 2
        side[:n] *= fade[:, None] if a.ndim == 2 else fade
    return a


def rms(a):
    return np.sqrt(np.mean(a * a))


def cue(samples, name, speed=1.0, cutoff=4400):
    raw = samples[name]
    pitched = np.interp(np.arange(0, len(raw) - 1, speed), np.arange(len(raw)), raw)
    shaped = soften(filt(filt(pitched, 40, "highpass"), cutoff))
    return shaped / max(0.01, rms(shaped))


def add(mix, start, sound, volume, pan=0):
    i = round(start * SR)
    n = min(len(mix) - i, len(sound))
    if n > 0:
        angle = (pan + 1) * np.pi / 4
        mix[i : i + n] += sound[:n, None] * (volume * np.array([np.cos(angle), np.sin(angle)]))


def spectrum(sample, fundamental, start, duration, count):
    """Capture the relative partials of a voiced moment for the long notes."""
    section = sample[round(start * SR) : round((start + duration) * SR)]
    bins = np.abs(np.fft.rfft(section * np.hanning(len(section)), 32768))
    hz = np.fft.rfftfreq(32768, 1 / SR)
    weights = []
    for k in range(1, count + 1):
        window = np.abs(hz - k * fundamental) < max(13, 0.025 * k * fundamental)
        weights.append(bins[window].max())
    return np.array(weights) / max(weights)


def note(midi, seconds, partials, seed, attack=0.45, release=0.70):
    rng = np.random.default_rng(seed)
    t = np.arange(round(seconds * SR)) / SR
    f = 440 * 2 ** ((midi - 69) / 12)
    phase = 2 * np.pi * f * t + 0.026 * np.sin(2 * np.pi * 0.78 * t + rng.uniform(0, 2 * np.pi))
    out = np.zeros(len(t))
    for k, amplitude in enumerate(partials, 1):
        out += amplitude * np.sin(k * phase + rng.uniform(0, 2 * np.pi))
    out *= 0.91 + 0.09 * np.sin(2 * np.pi * 0.23 * t + rng.uniform(0, 2 * np.pi))
    return soften(out / max(0.01, rms(out)), attack, release)


def space(mix, seed, decay, amount):
    """Short reflections plus a reproducible diffuse tail. Retain the dry attacks."""
    rng = np.random.default_rng(seed)
    t = np.arange(round(decay * SR)) / SR
    result = mix.copy()
    mono = mix.mean(axis=1)
    for ch in range(2):
        tail = filt(rng.normal(size=len(t)), 2600 - ch * 180)
        tail *= np.exp(-6 * t / decay) * np.minimum(1, t / 0.04)
        tail[: round(SR * 0.025)] = 0
        tail /= np.sqrt(np.dot(tail, tail))
        for ms, gain in [(61, 0.35), (107, 0.20), (197, 0.13)]:
            tail[round(SR * (ms + ch * 12) / 1000)] += gain
        result[:, ch] += amount * signal.fftconvolve(mono, tail)[: len(mix)]
    return result


def violet_stone(samples):
    """Twelve bars, four-four at 60 BPM. Pitched flute plays a written answering phrase."""
    mix = np.zeros((52 * SR, 2))
    horn = spectrum(samples["horn"], 329.6, 0.065, 0.10, 9)
    flute = spectrum(samples["flute"], 990.0, 0.065, 0.10, 7)
    # Bass, open fifth, then the upper voice of each four-bar section.
    harmony = [(40, 47, 54), (40, 47, 55), (38, 45, 54), (36, 43, 52), (43, 50, 54), (40, 47, 52)]
    for j, chord in enumerate(harmony):
        start = 0.35 + 8 * j
        for v, (pitch, level, pan) in enumerate(
            zip(chord, [0.050, 0.029, 0.021], [-0.04, 0.28, -0.32])
        ):
            pad = note(pitch, 8.5, horn if v < 2 else flute, 17 * j + v, 1.10, 1.65)
            add(mix, start + 0.16 * v, pad, level, pan)
    # The sampler follows the written line but keeps the instrument's inflection.
    line = [
        (2, 71),
        (4, 67),
        (6.5, 64),
        (10, 66),
        (13, 69),
        (14.5, 67),
        (18, 69),
        (20.5, 66),
        (23, 62),
        (27, 67),
        (29, 64),
        (34, 71),
        (36, 74),
        (38, 71),
        (42, 67),
        (44, 66),
        (46, 64),
    ]
    for j, (beat, pitch) in enumerate(line):
        speed = (440 * 2 ** ((pitch - 69) / 12)) / 990.0
        a = cue(samples, "flute", speed, 2750)
        add(mix, 0.35 + beat, a, 0.063 if j % 3 == 0 else 0.047, [-0.16, 0.10, 0.24][j % 3])
    for j, beat in enumerate([0.5, 8.5, 16.5, 22.5, 24.5, 32.5, 40.5]):
        add(mix, beat, cue(samples, "drum", 0.77, 950), 0.059 if j in (0, 2, 5) else 0.038, -0.12)
    for beat, pan in [(7.55, 0.34), (15.6, -0.30), (31.55, 0.26), (39.6, -0.24)]:
        add(mix, beat, cue(samples, "knock", 0.93, 1750), 0.039, pan)
    for start, speed in [(1.05, 0.5), (25.05, 0.5), (41.05, 0.75)]:
        add(mix, start, cue(samples, "horn", speed, 1800), 0.046, 0.10)
    return soften(space(mix, 25, 2.75, 0.33), 0.14, 2.9)


def soundings(samples):
    """Four sections in compound metre around D, with a slower acoustic pulse."""
    mix = np.zeros((54 * SR, 2))
    beat = 60 / 56
    drop = spectrum(samples["drip"], 332.0, 0.02, 0.07, 7)
    ping = spectrum(samples["ping"], 996.0, 0.04, 0.11, 7)
    for j, (low, high) in enumerate([(38, 45), (34, 41), (36, 43), (38, 45)]):
        start = 0.35 + j * 12 * beat
        add(mix, start, note(low, 12 * beat + 0.5, drop, 61 + j, 1.6, 2.4), 0.052, -0.08)
        add(mix, start + 1.3, note(high, 9.8 * beat, ping, 53 + j, 2.6, 2.3), 0.022, 0.23)
    for j, pitch in enumerate([62, 57, 60, 58, 53, 57, 60, 55, 62, 65, 60, 57]):
        # Ring the clank an octave or more below its original metallic partial.
        start = 0.5 + (4 * j + 0.66) * beat
        metallic = cue(samples, "clank", 440 * 2 ** ((pitch - 69) / 12) / 1843, 1350)
        add(mix, start, metallic, 0.043, [0.30, -0.27, -0.10][j % 3])
        add(
            mix,
            start + beat * 1.67,
            cue(samples, "drip", 0.76 + 0.08 * (j % 3), 2200),
            0.044,
            -0.30,
        )
    for j, bn in enumerate([1, 5.33, 7.66, 12.67, 16, 19.33, 25.66, 28, 32.33, 37.67, 41, 45.33]):
        add(
            mix,
            0.5 + bn * beat,
            cue(samples, "bubbles", [0.66, 1.0, 0.79][j % 3], 1850),
            0.045,
            [0.28, -0.21, 0.06][j % 3],
        )
    for j, bn in enumerate([0, 12, 24, 36]):
        add(mix, 0.5 + bn * beat, cue(samples, "splash", 0.42, 1250), 0.041, [-0.32, 0.27][j % 2])
        add(mix, 0.65 + (bn + 5.67) * beat, cue(samples, "chain", 0.61, 1450), 0.032, -0.18)
    for bn in [10.33, 29.33, 43.67]:
        add(mix, 0.5 + bn * beat, cue(samples, "ping", 0.43, 1450), 0.041, 0.27)
    return soften(space(mix, 71, 3.0, 0.38), 0.24, 2.9)


def sampler(samples):
    # At natural playback pitch, in the order listed in README.md.
    mix = np.zeros((17 * SR, 2))
    for j, key in enumerate(
        ["horn", "flute", "drum", "knock", "splash", "bubbles", "drip", "ping", "chain", "clank"]
    ):
        a = soften(samples[key].copy(), 0.004, 0.015)
        add(mix, 0.25 + j * 1.7, a, 0.14 / max(0.04, rms(a)))
    return mix


def encode(directory, basename, title, pcm):
    """Use constant gain for the whole performance. Keep headroom for MP3 peaks."""
    with tempfile.TemporaryDirectory() as temp:
        src = Path(temp) / "mix.wav"
        wavfile.write(src, SR, pcm.astype(np.float32))
        analyze = subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-hide_banner",
                "-i",
                str(src),
                "-af",
                "loudnorm=print_format=json",
                "-f",
                "null",
                "-",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        stats, _ = json.JSONDecoder().raw_decode(analyze.stderr[analyze.stderr.rindex("{") :])
        gain = min(-18.5 - float(stats["input_i"]), -2.0 - float(stats["input_tp"]))
        target = directory / (basename + ".mp3")
        subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(src),
                "-af",
                f"volume={gain:.3f}dB",
                "-c:a",
                "libmp3lame",
                "-b:a",
                "192k",
                "-id3v2_version",
                "3",
                "-metadata",
                "album=Silicon Adventures - Soundtrack Studies",
                "-metadata",
                f"title={title}",
                str(target),
            ],
            check=True,
        )
        print(target.name, round(len(pcm) / SR, 2), "seconds", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("out", nargs="?", type=Path, default=HERE)
    parser.add_argument(
        "--synth-only",
        action="store_true",
        help="Render Suno seeds without opening any disk recording",
    )
    args = parser.parse_args()
    out = args.out
    out.mkdir(exist_ok=True, parents=True)
    score = [
        ("01-violet-stone", "Violet Stone", violet_stone),
        ("02-soundings", "Soundings", soundings),
    ]
    if not args.synth_only:
        sounds = load_samples()
        for name, title, arrangement in score:
            encode(out, name, title, arrangement(sounds))
        encode(out, "03-disk-sampler", "Disk Sampler", sampler(sounds))
    seeds = out / "suno"
    seeds.mkdir(exist_ok=True)
    instruments = make_kit(SR)
    for name, title, arrangement in score:
        encode(seeds, name, title + " (synth seed)", arrangement(instruments))
