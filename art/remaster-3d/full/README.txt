THE ENCHANTED CASTLE FULL RELIEF REMASTER

native/ contains one PNG for each of the 192 entries in the castle art index.
4x/ contains the corresponding masters at four times the width and height.
The pack includes 172 sprite sheets with 684 frames, 17 visible screens, and
three foreground masks. The filenames match the original disk exports.

The room renderer assigns material and depth from the source masonry, openings,
ledges, ladders and ropes. The sprite renderer builds rounded height fields per
frame and uses the game's reel families to keep related materials consistent.
The three previously refined samples provide the throne room, Duncan's right
walk and the gargoyle. This is a batch 2.5D relief render from the original art.

The polish pass separates rails, rungs and playable ledge caps from the
surrounding masonry. It reduces raised stipple and improves warm and cool
lighting. Duncan's sleeve and hand colors follow his aiming poses. The dragon
keeps its green head during its breath animation, and the swing-rope sheets use
a wall-colored backing to soften the edge of their original opaque tiles.

Each native export is a box average of its master. The original alpha and
binary line classes can be recovered exactly at both sizes. The three native
foreground masks are byte-identical copies of the originals. The 4x masks use
nearest-neighbor expansion. See validation.json for every file and frame.

The preview directory contains a screen contact sheet, paginated sheets of
all sprite frames, and four scenes captured with the game renderer. A temporary
browser test loaded all 172 reels and 17 visible screens, composed all three
foreground layers, and rendered the entry state of all 14 playable rooms at
both scales. The hero position, collision box and selected reels matched.

The game's existing Remastered option loads the separate trial set. This full
pack uses the original asset names and frame layout for integration. A renderer
must multiply source crop coordinates by four when using the 4x master sheets.

Renderer handoff

tools/playtest-full.py exercises the current game renderer with a temporary
full-pack loader. tools/integration-smoke.py is the acceptance test for the
future in-game toggle. Its full-mode assertions expect the loader and swing-rope
compositing to be wired first. It expects debug.remaster() to report kind "full",
17 screens, 172 reels and three foreground layers.

Use the castle index to load each reel by its own filename. In particular,
A111 differs from a mirror of A112. Select HD title and score backgrounds at
the original logical screen size. The pack covers PPCT and PSCR entries, so
paper and hall PICT overlays still come from the original assets. Include the
full 4x directory in web staging when wiring the toggle.

For B510, B511 and A5000, flood from each native cell border through source
white using four-neighbor adjacency. Remove those pixels from the temporary
4x drawing canvas and retain enclosed highlights. This addresses the opaque
tiles in the game without changing the atlas PNGs or their verified alpha.

From the repository root, rebuild with:

  node art/remaster-3d/tools/build-full.mjs
  node art/remaster-3d/tools/verify-full.mjs
  node art/remaster-3d/tools/preview-full.mjs

Pass one or more manifest PNG filenames to build-full.mjs to rebuild a subset.
The scripts use the source PNGs in art/castle and Sharp in the tools directory.
The ZIP is a local distribution of these files and can be regenerated from
native/, 4x/, preview/, README.txt and validation.json.
