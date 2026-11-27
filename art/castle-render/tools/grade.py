"""Filmic grade shared by room and sprites. Input linear RGB, output sRGB 0..1."""
import numpy as np, cv2


def aces(x):
    a, b, c, d, e = 2.51, .03, 2.43, .59, .14
    return np.clip(x * (a * x + b) / (x * (c * x + d) + e), 0, 1)


def to_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= .0031308, 12.92 * x, 1.055 * x ** (1 / 2.4) - .055)


def to_linear(x):
    return np.where(x <= .04045, x / 12.92, ((x + .055) / 1.055) ** 2.4)


def grade(hdr, exposure=1.0, bloom=.05, sat=1.06):
    x = hdr[..., :3] * exposure
    if bloom:
        hi = np.maximum(x - .9, 0)
        s = max(hdr.shape[1] / 256, 2)
        x = x + bloom * (cv2.GaussianBlur(hi, (0, 0), s) + cv2.GaussianBlur(hi, (0, 0), s * 4))
    y = aces(x)
    l = y.mean(2, keepdims=True)
    y = np.clip(l + (y - l) * sat, 0, 1)
    return to_srgb(y)
