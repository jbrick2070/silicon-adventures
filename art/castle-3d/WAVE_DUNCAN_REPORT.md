# Wave Duncan Report

Delivered **53 / 55** sprite reels (**205 / 217** frames) in `art/castle-3d/` and `art/castle-3d/4x/`. Every delivered native sprite is the exact 4x4 box average of its `4x` master (`max channel diff = 0`), has `0` spill pixels outside the original 1986 sprite mask at both `1x` and `4x`, preserves a soft warm-light interior rim for dark-brick legibility, and was visually inspected frame-by-frame at native size on dark castle brick and solid dark backgrounds.

## Per-File Results

| File | Dimensions | Spill pixels | Largest shift | Pass / Fail |
| --- | --- | ---: | ---: | --- |
| `A-PPCT-102.png` | 64 x 48 (2f 32x48) | 0 | 1.41 px | PASS |
| `A-PPCT-103.png` | 160 x 48 (5f 32x48) | 0 | 1.00 px | PASS |
| `A-PPCT-104.png` | 192 x 45 (6f 32x45) | 0 | 4.24 px | PASS |
| `A-PPCT-107.png` | 192 x 48 (6f 32x48) | 0 | 2.24 px | PASS |
| `A-PPCT-108.png` | 192 x 48 (6f 32x48) | 0 | 1.00 px | PASS |
| `A-PPCT-109.png` | 192 x 48 (6f 32x48) | 0 | 2.00 px | PASS |
| `A-PPCT-110.png` | 192 x 48 (6f 32x48) | 0 | 1.00 px | PASS |
| `A-PPCT-114.png` | 96 x 48 (3f 32x48) | 0 | 2.00 px | PASS |
| `A-PPCT-115.png` | 96 x 48 (3f 32x48) | 0 | 2.00 px | PASS |
| `A-PPCT-116.png` | 64 x 56 (2f 32x56) | 0 | 1.00 px | PASS |
| `A-PPCT-117.png` | 224 x 50 (7f 32x50) | 0 | 1.00 px | PASS |
| `A-PPCT-118.png` | 224 x 50 (7f 32x50) | 0 | 1.00 px | PASS |
| `A-PPCT-119.png` | 64 x 32 (2f 32x32) | 0 | 1.00 px | PASS |
| `A-PPCT-120.png` | 64 x 32 (2f 32x32) | 0 | 1.00 px | PASS |
| `A-PPCT-123.png` | 64 x 48 (2f 32x48) | 0 | 1.00 px | PASS |
| `A-PPCT-125.png` | 128 x 40 (4f 32x40) | 0 | 1.00 px | PASS |
| `A-PPCT-126.png` | 96 x 40 (3f 32x40) | 0 | 1.00 px | PASS |
| `A-PPCT-128.png` | 192 x 40 (6f 32x40) | 0 | 4.24 px | PASS |
| `A-PPCT-129.png` | 192 x 40 (6f 32x40) | 0 | 2.24 px | PASS |
| `A-PPCT-130.png` | 336 x 42 (7f 48x42) | 0 | 1.00 px | PASS |
| `A-PPCT-131.png` | 336 x 42 (7f 48x42) | 0 | 1.00 px | PASS |
| `A-PPCT-149.png` | 64 x 26 (2f 32x26) | 0 | 1.00 px | PASS |
| `B-PPCT-121.png` | 288 x 56 (6f 48x56) | — | — | LEFT OUT |
| `B-PPCT-122.png` | 288 x 56 (6f 48x56) | — | — | LEFT OUT |
| `B-PPCT-132.png` | 32 x 51 (1f 32x51) | 0 | 2.83 px | PASS |
| `B-PPCT-133.png` | 192 x 42 (4f 48x42) | 0 | 6.00 px | PASS |
| `B-PPCT-134.png` | 144 x 58 (3f 48x58) | 0 | 2.24 px | PASS |
| `B-PPCT-146.png` | 240 x 47 (5f 48x47) | 0 | 1.00 px | PASS |
| `B-PPCT-147.png` | 64 x 40 (2f 32x40) | 0 | 1.00 px | PASS |
| `B-PPCT-155.png` | 240 x 47 (5f 48x47) | 0 | 1.00 px | PASS |
| `B-PPCT-142.png` | 96 x 42 (3f 32x42) | 0 | 6.08 px | PASS |
| `B-PPCT-143.png` | 96 x 59 (2f 48x59) | 0 | 2.24 px | PASS |
| `B-PPCT-150.png` | 64 x 49 (2f 32x49) | 0 | 1.41 px | PASS |
| `B-PPCT-151.png` | 96 x 44 (2f 48x44) | 0 | 1.00 px | PASS |
| `B-PPCT-154.png` | 16 x 60 (1f 16x60) | 0 | 1.00 px | PASS |
| `B-PPCT-157.png` | 64 x 47 (2f 32x47) | 0 | 1.41 px | PASS |
| `B-PPCT-158.png` | 256 x 41 (8f 32x41) | 0 | 4.00 px | PASS |
| `A-PPCT-124.png` | 128 x 25 (4f 32x25) | 0 | 5.39 px | PASS |
| `A-PPCT-135.png` | 256 x 26 (8f 32x26) | 0 | 5.66 px | PASS |
| `A-PPCT-136.png` | 384 x 34 (8f 48x34) | 0 | 1.00 px | PASS |
| `A-PPCT-137.png` | 128 x 9 (2f 64x9) | 0 | 1.00 px | PASS |
| `B-PPCT-139.png` | 320 x 41 (5f 64x41) | 0 | 1.41 px | PASS |
| `B-PPCT-140.png` | 192 x 46 (4f 48x46) | 0 | 2.24 px | PASS |
| `B-PPCT-141.png` | 144 x 30 (3f 48x30) | 0 | 2.83 px | PASS |
| `B-PPCT-148.png` | 48 x 45 (1f 48x45) | 0 | 1.00 px | PASS |
| `B-PPCT-152.png` | 240 x 44 (5f 48x44) | 0 | 1.00 px | PASS |
| `B-PPCT-153.png` | 240 x 44 (5f 48x44) | 0 | 1.00 px | PASS |
| `B-PPCT-156.png` | 64 x 51 (2f 32x51) | 0 | 1.00 px | PASS |
| `A-PPCT-144.png` | 96 x 43 (2f 48x43) | 0 | 2.00 px | PASS |
| `A-PPCT-145.png` | 96 x 43 (2f 48x43) | 0 | 2.00 px | PASS |
| `B-PPCT-709.png` | 16 x 27 (1f 16x27) | 0 | 1.41 px | PASS |
| `A-PPCT-113.png` | 64 x 8 (4f 16x8) | 0 | 1.00 px | PASS |
| `A-PPCT-127.png` | 192 x 9 (6f 32x9) | 0 | 1.00 px | PASS |
| `A-PPCT-138.png` | 32 x 9 (2f 16x9) | 0 | 1.00 px | PASS |
| `A-PPCT-520.png` | 32 x 17 (1f 32x17) | 0 | 1.00 px | PASS |

## Left Out

- `B-PPCT-121.png` (6 frames, 48 x 56): Left out per quality rule ('Files you cannot make good are better left out than delivered bad'). The image-generator quota on gemini-3.1-flash-image exhausted (HTTP 429) before the clothed 6-frame rope-swing render completed, and rotating other jump poses into the swing angles rotated the upper-left key light and failed visual QA on dark brick.
- `B-PPCT-122.png` (6 frames, 48 x 56): Left out per quality rule for the same reason as its mirror reel B-PPCT-121.png (unrendered 6-frame rope-swing sheet after gemini-3.1-flash-image HTTP 429 quota exhaustion; rotated pose fallback failed upper-left lighting consistency and silhouette QA).

## Time Taken

- **56m 45s** (started `2026-11-05T07:31:57-08:00`, finished `2026-11-05T08:28:42-08:00`).
