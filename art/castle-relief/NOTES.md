# Castle relief remaster, sample of three files

Date: 4 November 2026. Originals in `art/castle` were not modified.

## Finished files

| File | Native (drop-in) | 4x master |
| --- | --- | --- |
| B-PSCR-4020.png | `native/` 512 x 342 | `4x/` 2048 x 1368 |
| A-PPCT-101.png | `native/` 192 x 40, six 32 x 40 frames | `4x/` 768 x 160 |
| B-PPCT-906.png | `native/` 144 x 32, three 48 x 32 frames | `4x/` 576 x 128 |

The native files are the box average of the 4x masters, so the two sets
always agree. Alpha in both is the original mask, bit for bit. The HUD band
below y = 310 on the screen is left pure white.

`preview.png` is a before/after sheet. `preview-scene.png` is the native room
with hero and gargoyle frames composited at play size. `validation.json` is
the output of `tools/verify.py`.

## Approach

The 1986 ink is treated as the plan of a carved stone relief and is never
redrawn. Everything is rendered from a height field built out of the
original pixels, at four times the size, then lit.

1. Tag materials. A short list of rectangles in native coordinates says what
   each area is: brick wall, tower face, pale slab, pillar, ladder, brass,
   wood door, iron band, carved statue, deep opening. The rectangles only
   pick colour and base height; the ink inside them is untouched. The open
   interior is found automatically: white with almost no stipple inside the
   big interior regions becomes a dark far wall. Large smooth white shapes
   inside brick areas become slabs automatically, which is how the ramps,
   rungs and window frames were found. The room needed 33 rectangles and two
   quadrilaterals, half of them mirrored from the left side.
2. Build height. Each material has a base height. Every white brick cell is
   a gently domed block and every mortar line is a groove. Slabs get a
   chamfered edge, ladders, brass and statues get rounded profiles, pillars
   get a cylindrical profile, door planks are rounded boards, windows and
   niches drop below the wall. Stipple dots become small pits on walls and
   tiny pebbles on the far wall.
3. Light. Normals come from the height field. One warm key light from the
   upper left casts ray-marched soft shadows down and to the right, so ledges
   shade the wall under them and ladders shade the stone behind. A cool fill
   light, multi-scale ambient occlusion in grooves and corners, Blinn-Phong
   specular (high on brass and iron, low on stone), stone grain, per-brick
   colour variation, wood grain on the door and ladders, and a warm glow
   around each lamp finish the surface. Ink lines keep the colour of the
   material they sit on, darkened, so the drawing stays readable.
4. Sprites. The halo and black outline of each frame become the rounded
   edge of the body. One soft dome over the whole silhouette gives volume,
   each interior region is rounded on its own so limbs read as cylinders,
   and interior ink becomes creases. Materials are assigned by the frame's
   own proportions (hair, skin, shirt, belt, trousers, boots) so all six
   frames follow one rule. Small white islands in the shirt band are hands.
   The gargoyle is weathered stone with a faint moss tint and a rim light.
5. Downsample 4x to native with a box filter and verify.

## Verification (`tools/verify.py`)

- Dimensions and frame layout exact at native and 4x.
- Alpha identical to the original at native, and identical to the 4x
  nearest-neighbour expansion at 4x. Alpha stays binary.
- Native equals the box mean of the 4x master to within rounding.
- Ink edge check: for every original ink pixel next to an original white
  pixel, the ink pixel is still the darker of the two in the native result.
  Room 99.78 %, hero 99.84 %, gargoyle 100 %. The remaining room pairs sit
  on the boundary between stone and the dark far wall, where the far wall
  is deliberately darker than the ink.
- Originals match the committed copies in git.

## Applying it to the whole game (172 reels, 684 frames, 20 screens)

The renderer is deterministic, so the cost is in tagging, not drawing.

1. Inventory. Freeze hashes, sizes, frame counts, anchors and timings for
   every reel and screen from the disk extraction. Mark the screens that are
   data masks rather than pictures; those stay binary.
2. Material library. Keep one shared palette and height table for stone,
   trim, wood, brass, iron, cloth, skin and creatures, in one file. Changing
   a colour there retints every asset consistently.
3. Screens. Each screen gets a rectangle list like the one in
   `tools/render_room.py`, about 20 to 40 entries. With the automatic rules
   for open space, brick and slabs doing most of the work, this is roughly an
   hour per screen; symmetric rooms take half. 20 screens is a few days.
4. Sprites. Reels are grouped by subject. Each group gets one classifier
   like `classify_hero`: a handful of proportional bands plus two or three
   exceptions. 152 of the 172 reels have several frames (2 to 20). The other
   20 are single-frame items and UI pieces that need only a material tag.
   Reel sizes range from 16 x 6 to 144 x 20 and up to 80 x 169, so the hero's
   32 x 40 is not a typical size. Characters with several reels share one
   classifier so colours never jump between reels. Budget one or two days to
   write classifiers and a day to review contact sheets.
5. Batch render all 684 frames and 20 screens with fixed light direction and
   material values, then run `verify.py` over everything. Frames are never
   generated independently, so there is no flicker between frames.
6. Review at play size: contact sheets per reel, animation loops at the
   engine's timings, sprites over the actual room they appear in. Fix
   classifier exceptions where a limb or object is coloured wrong.
7. Integration. The native files are drop-in. The 4x masters need the loader
   to scale source rectangles by four and draw into a larger buffer. The
   game's current screen tint should be bypassed for the remastered palette.

## What I could not do, and where the result moves away from the original

- Colour, materials, depth and light are my interpretation; the original has
  none. The white open areas are now a dark far wall, so their polarity is
  reversed. Every edge is still in the same place.
- This is a lit relief carved from the drawing, not a modelled 3D scene. The
  camera, perspective and silhouettes cannot change under the rule, so
  surfaces do not turn away from the viewer; depth comes from bevels,
  shadows and occlusion.
- The sprites' white halos are now a lighter rim of body colour rather than
  pure white. Against very dark areas they are slightly less separated than
  the 1986 halo. A one pixel brighter rim could be restored in the engine.
- Stipple is kept as pits and pebbles, so some wall areas look speckled
  rather than smooth. Smoothing them would mean deleting ink.
- The gargoyle ornaments in the room and the gargoyle sprite are ink-dense,
  so they read as dark carved stone rather than a clearly modelled creature.
- Material tags are hand-placed for this room and this hero; other screens
  and reels need their own lists, as described above.
- Light/dark check, added on review: thresholding this set at luminance 128
  agrees with the original on 58.8 % of opaque room pixels, 61.8 % of hero
  pixels and 75.6 % of gargoyle pixels, because the open areas were reversed.
  `art/remaster-3d` agrees on 100 % of them. The 3D view in `game/view.js`
  reads red values below 128 as ink, and reel 908 reaches it through
  `game/play.js`. Neither set keeps that rule: remaster-3d agrees on 82 to 89 %
  and this set on 65 to 75 %. Keep the original reel for that path, or add the
  rule to the verifier, before swapping it.
- No engine code was changed and nothing was playtested in the game.

## Reproducing

From `art/castle-relief/tools`, with Python 3, numpy, scipy and Pillow:

```
PYTHONPATH=. python render_room.py
PYTHONPATH=. python render_sprites.py
PYTHONPATH=. python verify.py
python preview.py
```

Rendering all three files takes about fifteen seconds.
