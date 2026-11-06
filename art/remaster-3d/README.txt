CASTLE REMASTER SAMPLE — 4 NOVEMBER 2026

FINISHED FILES

native/B-PSCR-4020.png   512 x 342, opaque room
native/A-PPCT-101.png    192 x 40, six horizontal 32 x 40 RGBA frames
native/B-PPCT-906.png    144 x 32, three horizontal 48 x 32 RGBA frames

4x/B-PSCR-4020.png      2048 x 1368
4x/A-PPCT-101.png       768 x 160, six 128 x 160 cells
4x/B-PPCT-906.png       576 x 128, three 192 x 128 cells

The native versions are the replacement-size assets. The 4x files contain
additional lighting detail inside each source pixel, with exact 4x-expanded
alpha. No trimming, atlas repacking, frame reordering or origin changes.
Original files in art/castle were left unchanged.

APPROACH

This is a source-constrained 2.5D relief treatment: cool stone, pale warm trim,
brass fittings, a terracotta/burgundy hero and a green-grey stone gargoyle.
Height fields derived from the original masks produce bevels, rounded lighting,
and shallow recesses. Every original opaque pixel keeps its original light/dark
classification at code-value luminance threshold 128. This deliberately limits
the tonal range so that thresholding the finals recovers the original drawing.

The refinement pass projects contact shadows from raised surfaces onto lower
stone and recesses, and gives the two upper side ledges matching trim. It uses
the source jacket panels to keep the hero's cloth color consistent across poses.
Both sprites carry more directional shading in their dark pixels, and shaded
highlights retain more of their original material hue.

Built-in image_gen produced three material studies. Its unconstrained renders
changed contours and proportions, so they are NOT replacement assets. The room
study contributes only a heavily blurred broad illumination guide; generated
edges are not used. The sprite studies informed the palette and material choice.
The final JavaScript compositor shades the source geometry directly.
prompts.json records the exact image_gen prompts. The studies remain separately
in the workspace's studies/ folder and are excluded from the deliverables ZIP.

VALIDATION

validation.json records independent checks by tools/verify.mjs:
- All six PNGs have the expected exact dimensions and cell layout.
- Alpha matches the source at every pixel, or every expanded 4x subpixel.
- Original light/dark classification matches at every opaque output pixel.
- Every 4x block's average retains that classification too.
- All nine sprite frames were checked at both sizes: zero mismatches.
- SHA-256 hashes confirm the three original PNGs were not changed.

The threshold uses 0.2126 R + 0.7152 G + 0.0722 B on sRGB code values.
It is a reversible contour check, not a claim about physical luminance or
anatomical realism. Visual review also compared all frames and the room.

preview.png shows the finished set. preview/*.gif shows each sprite loop over
light and dark backgrounds at an illustrative 140 ms/frame. Those timings
are preview choices, not recovered engine timings. All frames are included.

WHOLE-GAME PRODUCTION

1. Inventory the manifest and freeze source hashes, dimensions, alpha, frame
   order, anchors and timings. This repository confirms 172 PPCT reels, 684
   frames and 20 PSCR screens. Some reels are static or UI elements; three
   screens are data-like foreground masks, which should remain exact binary.
2. Establish one material/lighting library for stone, metal, cloth, skin and
   creatures. Use image generation for a small set of material studies per
   family, then approve those choices at actual play size.
3. Tag the existing source regions by material and depth. Reuse tags across
   related poses and reels. Per-frame annotations are still required where
   connected regions merge or split. This sample's room coordinates and hero
   material rules are tailored to these three assets; they are not an automatic
   solution for every asset in the game.
4. Batch the deterministic mask-constrained shading. Keep light direction,
   material colors and height parameters consistent throughout an animation.
   Do not independently regenerate every frame: that risks identity flicker,
   moving limbs and drifting cell origins.
5. Run the geometry checks for every frame and screen, then review contact
   sheets and real-timing loops on light, dark and actual room backgrounds.
   Check feet, hands, crossings, thin limbs, shadows, seams and repeated tiles.
   Repair material labels wherever lighting appears to jump between frames.
6. Export native files for the present loader and 4x masters for an optional
   high-resolution renderer. Keep the three foreground masks as binary data.
   Playtest ladders, ledges, doors, occlusion and collision-sensitive contacts.

LIMITATIONS / DEPARTURES

- No original source boundary or sprite alpha pixel moved in the tested set.
- Color, materials, apparent relief depth and illumination are new artistic
  interpretations. This is colored, beveled pixel relief, not fully modeled
  smooth 3D characters or a reconstructed 3D room.
- Source stair-stepping is intentional. Some original stipple remains visible
  as small pits or textured fragments; preserving all ink limits smoothing.
- The sprites gain modest rounded depth; the larger architectural surfaces
  show a stronger relief effect. No new views or in-between poses were made.
- The other 675 frames and 19 screens were not remastered in this sample.
- No engine code or gameplay was changed or playtested for this delivery.

INTEGRATION IN THIS REPOSITORY

game/enchanted-castle.js crops sprites and draws rooms using native coordinates.
Use native/ for replacement-size files. A 4x atlas requires scaled source
rectangles and an appropriate rendering buffer; simply swapping it in will crop
incorrectly. The current color display applies a multiply/lighten tint to the
completed screen, which would retint these colors. Bypass that tint when using
the remastered palette. Existing collision logic should retain its original
coordinates and masks; these art checks do not replace in-engine playtesting.

REPRODUCING IN THIS WORKSPACE

From D:/silicon-adventures, with a current Node.js installed:
  npm ci --prefix art/remaster-3d/tools --no-audit --no-fund
  node art/remaster-3d/tools/inspect.mjs
  node art/remaster-3d/tools/render.mjs
  node art/remaster-3d/tools/verify.mjs
  node art/remaster-3d/tools/package-preview.mjs

The renderer expects the original PNGs at art/castle and the room study at
art/remaster-3d/studies/room-material-study.png. Inspection regenerates the
working region maps. The scripts and study files remain in the workspace;
the ZIP contains the finished art, previews, prompts and validation report.
