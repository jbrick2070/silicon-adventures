# Enchanted Scepters remaster: the signal lantern station

You are repainting the foreground of a bonus scene in a 1986 Macintosh adventure, in a rich, truly lit 3D look. It sits on top of `art/es-3d/aircraft/tower.png`, which you painted. Match that picture's light: muted dark yellow key light, cool shadows, no orange glow.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`.
- Create files only in `art/es-3d/aircraft/`. Do not touch anything else. Do not commit, push, or switch branches. Play no audio. Leave ComfyUI and its GPU alone.
- Deliver 8 PNG files, each exactly 338 x 314, named the same as the 8 guides in `art/es-3d/aircraft/guides/`, for example `art/es-3d/aircraft/lamp-north.png`.
- Each file holds only the near stone ledge, brass table, lantern on its tripod, compass and signal card. Everything above and behind them must be fully transparent, so the view shows through.
- Each file must show the same station, painted the same way. Only the lantern's turn, the compass needle and the shutter change between files, as they do in the guides.
- The `-flash` files show the shutter open and bright. Add no glow outside the lantern.
- Keep the lantern, compass and card within 1 pixel of the guides, because players click them.
- The signal card's marks must stay legible and unchanged: they are the puzzle's clue. Add no text.
- Never fill a gap with one flat colour.

## Before you finish

Lay each file over `tower.png` and look at it at native size beside its guide.

## Report

Write `art/es-3d/WAVE_BEACON_LAMP_REPORT.md`: one row per file with dimensions, largest shift and pass or fail, then anything left out, then the time taken.
