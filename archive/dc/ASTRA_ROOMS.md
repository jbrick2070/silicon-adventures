# Enchanted Scepters: rooms for Astra

Paint the rooms below, from the top of the list down. Agy is working from the other end, so stop when you meet a room that already exists in `art/es-3d/` or `art/es-3d/incoming/`.

## Rules

- Work in `D:\silicon-adventures`, on the branch `feature/asset-parity`. Create files only in `art/es-3d/incoming/`. Do not commit, push, or change anything else. Play no audio. Leave ComfyUI alone.
- For each room, use `art/es-3d/guides/<file>` as the image input, and save the result as `art/es-3d/incoming/<file>`, keeping the number.
- Overlay each result on its guide. If walls, doorways or objects land more than about 2 native pixels off, try again, or leave the room out. A missing room is better than a shifted one.
- Keep every object in the drawing recognisable. Add nothing.

## Prompt

Use this prompt for each room, then add its place and disk text from the table:

```text
Repaint this exact scene as a rich, truly lit 3D render. Trace every line of the input image exactly, like an inked drawing being coloured in: the output must overlay the input with no shift. Keep the camera, horizon and perspective, and keep every wall edge, doorway and landmark exactly where it is. Do not add, remove or move anything. No text, people, frames or borders. No dither patterns or dots. Solid realistic materials, muted dark yellow key light from the upper left, cool slate fill, no orange glow.
```

## Rooms

| File | Place | Disk text |
| --- | --- | --- |
| `ASCN-5112.png` | rapids, jungle | White water churns to either side, the stream roars southward. |
| `ASCN-5878.png` | mellow pond, jungle | Tall cliffs rise to the north, there is a rocky wall south. |
| `ASCN-9387.png` | jungle clearing, jungle | The jungle surrounds a small clearing. |
| `ASCN-9603.png` | port, jungle | Redwoods thrust to the sky. |
| `ASCN-10456.png` | quiet water, jungle | The stream continues north-south. |
| `ASCN-12217.png` | riverside, jungle | A peaceful stream runs by to the east. |
| `ASCN-12955.png` | whirlpool, jungle | The water slows considerably. |
| `ASCN-14279.png` | beaten path, jungle | You are on a well worn path that runs from east to west. |
| `ASCN-14979.png` | shallows, jungle | The water runs from north to south between narrow river banks. |
| `ASCN-17473.png` | pot, jungle | There is a large pot and some wood here. |
| `ASCN-20168.png` | magic hut, jungle | You are inside a grass hut. |
| `ASCN-20177.png` | vines, jungle | Larger trees fill the center of the jungle. |
| `ASCN-20359.png` | forest clearing, jungle | You arrive at a peaceful forest clearing. |
| `ASCN-14895.png` | outcrop, desert | A stone outcrop stands in the fearsome heat. |
| `ASCN-12086.png` | ante chamber, ruins | There is a large entrance west and smaller tunnels running north and south. |
| `ASCN-12320.png` | annex, ruins | Scattered debris fills the empty annex. |
| `ASCN-26748.png` | camp, ruins | The ramparts are to the west and a path climbs east. |
| `ASCN-23449.png` | seaweed, sea | Large underwater plants wave in the gentle ocean current. |
| `ASCN-31555.png` | clear water, sea | Green light plays on the sea floor. |
| `ASCN-2818.png` | basin, temple | A small basin punctuates the end of the hallway. |
| `ASCN-16874.png` | temple vista, temple | To the south lies a huge Mayan Temple. |
| `ASCN-18278.png` | temple stairs, temple | Stairs climb to a small room at the summit. |
| `ASCN-21162.png` | slide floor, temple | There is a door to the east. |
| `ASCN-25655.png` | ball, temple | There are entrances to the north and south. |
| `ASCN-27504.png` | passage, temple | Stairs lead up to the north. |
| `ASCN-63.png` | volcano vista, volcanic | A volcano smolders in the south. |
| `ASCN-19939.png` | cliff path, volcanic | To the north is an upward winding path. |
| `ASCN-29926.png` | south road, volcanic | The gravel road winds down to the south, the castle is northward. |
| `ASCN-2464.png` | spiral stairs, castle | Steps lead up to the top of the battlements. |
| `ASCN-17568.png` | map room, castle | An ornate map is painted on the west wall of this small room. |
| `ASCN-24275.png` | arena, castle | There is no exit except a door on the west wall. |
| `ASCN-15776.png` | tidewater, coast | The ocean floor slants down to the south. |
| `ASCN-1725.png` | back room, crypt | This room contains a rough straw bed. |
| `ASCN-10525.png` | cave painting, crypt | Charcoal paintings line the north wall of the cave. |
| `ASCN-16121.png` | lonely hall, crypt | The hallway runs east-west. |
| `ASCN-17730.png` | dead end, crypt | This alcove looks like the lair of a large insect. |
| `ASCN-20431.png` | deck, wreck | The ship extends to the north and south. |
| `ASCN-30379.png` | cannon, wreck | A rusty cannon encrusted with coral points to the west. |
| `ASCN-7395.png` | bridge room, castle | There is a courtyard to the west and a moat to the east. |
| `ASCN-6785.png` | seaside, coast | You are walking along an east-west beach. |
| `ASCN-13946.png` | dunes, coast | A shack is visible to the west, a salty breeze blows from the quiet sea to the south. |
| `ASCN-18468.png` | submarine, coast | An old submarine covered with barnacles and moss floats to the west. |
| `ASCN-1186.png` | cavern pool, crypt | A shaft of light from above breaks the darkness. |
| `ASCN-4874.png` | landing, crypt | Dark stone steps lead up to the north. |
| `ASCN-12321.png` | pedestal, crypt | There is a boiling pool north and a door east. |
| `ASCN-27318.png` | stair entrance, crypt | Dark stairs descend into blackness. |
| `ASCN-6591.png` | ravine, desert | An empty ravine provides no respite from the boiling sun. |
| `ASCN-12523.png` | mud, desert | The ground is laced with cracks from long dried mud. |
| `ASCN-26550.png` | cactus, desert | A lone cactus stands watch. |
| `ASCN-27689.png` | trail, desert | A lonely trail runs north-south. |
| `ASCN-29592.png` | sphinx vista, desert | A huge and ancient sphinx appears to be cut from the side of the cliff. |
| `ASCN-3521.png` | cliff road, highland | The trail climbs to the south and falls to the north and east. |
| `ASCN-9440.png` | narrow pass, highland | A narrow pass runs north-south. |
| `ASCN-23813.png` | chasm view, highland | The path continues east to a deep canyon. |
| `ASCN-19497.png` | tree path, jungle | You are walking along a north-south path. |
| `ASCN-27293.png` | corner, jungle | You are surrounded by a misty jungle. |
| `ASCN-1776.png` | meager room, machinery | The Queen's Chamber is north, there is a room west. |
| `ASCN-10919.png` | post, ruins | The camp lies west and a road climbs north. |
| `ASCN-290.png` | sea room, sea | The tunnel continues east and west. |
| `ASCN-6048.png` | crawl tunnel, sea | A low tunnel runs east-west. |
| `ASCN-3122.png` | dogleg, temple | There is a door to the east. |
| `ASCN-4684.png` | boiling pool, volcanic | You stand on the north side of a boiling pool. |

## Report

Write `art/es-3d/WAVE_ASTRA_ROOMS_REPORT.md`: one row per room with pass or fail, then anything left out.
