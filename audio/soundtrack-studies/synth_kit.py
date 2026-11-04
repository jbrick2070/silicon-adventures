"""Original mono instruments for the soundtrack studies, synthesized without samples."""

import numpy as np
from scipy import signal


def make_kit(sr):
    """Return ten dry one-shots at the requested sample rate."""
    rng = np.random.default_rng(39471)

    def clock(seconds):
        return np.arange(round(seconds * sr)) / sr

    def harmonics(phase, frequency, weights):
        out = np.zeros_like(phase)
        for order, weight in enumerate(weights, 1):
            if order * frequency < 0.46 * sr:
                out += weight * np.sin(order * phase)
        return out

    def envelope(t, attack, release):
        head = np.sin(np.minimum(1, t / attack) * np.pi / 2) ** 2
        tail = np.sin(np.minimum(1, (t[-1] - t) / release) * np.pi / 2) ** 2
        return head * tail

    def air(t, low, high):
        upper = min(high, 0.46 * sr)
        lower = min(low, upper / 2)
        sos = signal.butter(2, [lower, upper], fs=sr, btype="bandpass", output="sos")
        return signal.sosfilt(sos, rng.standard_normal(len(t)))

    def ringing(t, modes):
        out = np.zeros_like(t)
        for frequency, weight, decay in modes:
            if frequency < 0.46 * sr:
                out += weight * np.sin(2 * np.pi * frequency * t) * np.exp(-t / decay)
        return out

    kit = {}
    t = clock(0.61)
    # Air enters before a clear straight note. The mild vibrato arrives after the attack.
    vibrato = 0.10 * np.sin(2 * np.pi * 4.2 * t) * np.minimum(1, t / 0.24) ** 2
    phase = 2 * np.pi * 990 * t + vibrato
    tone = harmonics(phase, 990, [1, 0.11, 0.17, 0.033, 0.045, 0.018, 0.009])
    breath = air(t, 1250, 4900) * (0.022 + 0.08 * np.exp(-t / 0.048))
    kit["flute"] = (tone + breath) * envelope(t, 0.055, 0.16)

    t = clock(0.92)
    phase = 2 * np.pi * 329.6 * t
    warm = harmonics(phase, 329.6, [1, 0.59, 0.31, 0.21, 0.12, 0.073, 0.055, 0.034, 0.016])
    bloom = (1 - np.exp(-t / 0.085)) * np.exp(-t / 0.44)
    kit["horn"] = warm * (0.72 + 0.28 * bloom) * envelope(t, 0.072, 0.25)

    t = clock(0.49)
    phase = 2 * np.pi * (80 * t + 3.85 * (1 - np.exp(-t / 0.032)))
    skin = np.sin(phase) * np.exp(-t / 0.115) + 0.23 * np.sin(1.52 * phase) * np.exp(-t / 0.065)
    kit["drum"] = (skin + 0.13 * air(t, 240, 1700) * np.exp(-t / 0.016)) * envelope(t, 0.004, 0.05)

    t = clock(0.25)
    wood = ringing(t, [(352, 1, 0.028), (617, 0.42, 0.019), (1207, 0.20, 0.014)])
    kit["knock"] = (wood + 0.2 * air(t, 700, 2800) * np.exp(-t / 0.009)) * envelope(t, 0.002, 0.035)

    t = clock(0.34)
    water_phase = 2 * np.pi * (332 * t - 0.33 * (1 - np.exp(-t / 0.006)))
    drop = harmonics(water_phase, 332, [1, 0.21, 0.13, 0.085, 0.052, 0.043, 0.025])
    kit["drip"] = drop * np.exp(-t / 0.065) * envelope(t, 0.004, 0.045)

    t = clock(0.76)
    ceramic = ringing(
        t,
        [
            (996, 1, 0.18),
            (1992, 0.20, 0.11),
            (2988, 0.11, 0.08),
            (3984, 0.05, 0.062),
            (4980, 0.034, 0.047),
            (5976, 0.018, 0.039),
        ],
    )
    kit["ping"] = ceramic * envelope(t, 0.005, 0.09)

    t = clock(0.40)
    metal = ringing(
        t,
        [
            (1843, 1, 0.085),
            (2703, 0.54, 0.039),
            (3561, 0.26, 0.025),
            (4979, 0.16, 0.017),
            (756, 0.22, 0.045),
        ],
    )
    kit["clank"] = (metal + 0.19 * air(t, 1000, 5300) * np.exp(-t / 0.010)) * envelope(
        t, 0.002, 0.040
    )

    t = clock(0.48)
    links = np.zeros_like(t)
    for onset, weight, pitch in [
        (0, 0.8, 1270),
        (0.031, 1, 1590),
        (0.093, 0.7, 1093),
        (0.17, 0.32, 1684),
    ]:
        start = round(onset * sr)
        ring = ringing(t, [(pitch, 1, 0.029), (pitch * 1.57, 0.46, 0.014)])
        links[start:] += weight * ring[: len(t) - start]
    kit["chain"] = links * envelope(t, 0.002, 0.045)

    t = clock(0.72)
    wash = air(t, 260, 2900) * np.exp(-t / 0.19)
    spray = 0.4 * air(t, 1400, 5600) * np.exp(-(((t - 0.10) / 0.077) ** 2))
    kit["splash"] = (wash + spray) * envelope(t, 0.019, 0.12)

    t = clock(0.86)
    bubbles = np.zeros_like(t)
    for onset, pitch, weight in [
        (0, 350, 0.75),
        (0.14, 520, 0.45),
        (0.22, 245, 1),
        (0.49, 410, 0.64),
    ]:
        start = round(onset * sr)
        pulse_time = t[: len(t) - start]
        phase = 2 * np.pi * (pitch * pulse_time + 640 * pulse_time**2)
        pulse = (np.sin(phase) + 0.17 * np.sin(2 * phase)) * np.exp(-pulse_time / 0.043)
        bubbles[start:] += weight * pulse * envelope(pulse_time, 0.009, 0.045)
    kit["bubbles"] = bubbles

    return {name: sound * (0.82 / np.max(np.abs(sound))) for name, sound in kit.items()}
