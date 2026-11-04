# Remaining room rig review

The survey covers the 149 rooms that used the refreshed environment box at commit `2d4f6ba`. The decision table lists the 82 campaign rooms first, sorted by the number of trace rows ending in each room. Ties follow first appearance. The other 67 follow alphabetically. Each row gives the source ASCN ID and the reason for accepting a fit or keeping the class box. [All 149 decisions](../room-review.tsv)

| Environment | Measured | Hand-authored | Left generic |
| --- | ---: | ---: | ---: |
| Chamber | 0 | 23 | 15 |
| Cave | 1 | 13 | 8 |
| Open | 0 | 29 | 48 |
| Submerged | 0 | 5 | 7 |
| **Total** | **1** | **70** | **78** |

Treasury’s floor polygon has two converging sides and a visible far edge. The automatic fit gives an eye line of 80.6 px and a wall 4.14 m away. Of the hand-authored entries, drinks (13371), magic hut (20168) and pool table (21831) retain chamber dimensions and change the unseen surfaces. In walk comparisons, shifting their floor junctions bent the furniture. [Treasury](poses/29622.png) · [Drinks](poses/13371.png) · [Magic hut](poses/20168.png) · [Pool table](poses/21831.png)

Of the 82 rooms on the campaign trace, 45 received hand-authored changes and 37 kept their class box. The off-route rooms account for the Treasury measurement, 25 hand-authored changes and 41 generic decisions.

## Reading the measurements

Coordinates are pixels from the upper left of the native drawing. A floor contact at row J and eye line cy give a depth of 387 / (J − cy) metres. Where two edges converge off-centre, cx follows them. For broad frontal or curved surfaces, the table identifies the seam and the dimension held at its class value. A level sea horizon establishes eye height but supplies no absolute distance. Several open rigs use an interpreted 24 m backdrop to keep that horizon distant during a 2.5 m walk.

Queen’s Chamber calibrates at cy 92.1 and 4.78 m after checking the exposed wall feet on both sides of its occluded runner. This brings the existing calibration to eight of twelve within 12 px of eye height and 10% of depth. It changes no landmark rig. Dogleg, mirror room, cavern and lava tunnel still require their existing hand fits. Rerunning `python art/measure_rigs.py --write` filters against the review before it writes the measured table. [Measured rigs](../rigs.js) · [Hand-authored rigs](../hand-rigs.js)

## Checking a room

Each PNG contains eight panels. Read across each row at 100% zoom. Every panel preserves one output pixel per source pixel, with game ink and paper mapped directly to black and white for storage.

| Left panel | Right panel |
| --- | --- |
| Original doorway | Refreshed doorway |
| Refreshed after walking 2.5 m | Refreshed at doorway, yaw −1.4 rad |
| Refreshed at doorway, yaw +1.4 rad | At the refreshed back wall, facing the entrance |
| L at the back wall, Original | L again, Refreshed |

The browser walked each changed room to its collision limit and exercised the game's L handler in both directions. While viewing a smaller box, the camera stops inside its boundary. Switching back restores the previous position until the player walks. Both refreshed wall frames in each sheet agree pixel for pixel. The check also compares Original with the disk plate at the doorway, counts ink and paper, checks for positive ray depths, and reprojects native sprite sizes and anchors in both modes. It uses the room’s initial objects and inhabitants when available and a disk pickup otherwise. [Per-room results](poses/verification.tsv)

Across the 71 changed rooms, 70 doorway images matched Original exactly. Treasury differed on 48 of 106,132 pixels (0.0452%). The largest difference was below the 1.5% threshold. The browser reported zero console or page errors. A separate four-pose comparison against `main` matched all 200 Original rigs and all 129 unaffected refreshed rigs pixel for pixel. The layer verifier reported 22 source-identical composites. The hint verifier matched all 153 exact inputs across 19 milestones.

To reproduce, start the bundled Java server with `-Duser.home=<throwaway-directory> -jar engine/adventure.jar --test <port>` and confirm a test save in that directory. Run `python art/review_rigs.py http://127.0.0.1:<port>/ <output-directory>` with Pillow, Playwright and Chrome. The runner mutes the cover and uses its idle PlateView so it can test the real L handler without starting a journey. Pass ASCN IDs after the output directory to render a subset.

## Limits and unverified items

- The archive supplies a single projected drawing. Absolute depths chosen for distant scenery, hidden wall shapes and exit heights cannot be checked against a second original viewpoint.
- The castle road sign (327), dock pilings (15787), weapons rack post (4940) and computer cabinet foot (9709) can bend where their painted pixels cross a projection seam. The closet (22673) shows a short strip of the source margin when looking back. The sloping canyon switchbacks approximate raised terrain with a single ground plane.
- The 78 generic decisions were reviewed against the drawings. The contact sheets and per-room walking tests cover the 71 accepted changes. The verification run used the cover renderer. It did not replay the full campaign or every live actor animation.

## Contact sheets

**Chamber**

[office (1092)](poses/1092.png) · [closet (22673)](poses/22673.png) · [airlock (9514)](poses/9514.png) · [lobby (29467)](poses/29467.png) · [queen (31514)](poses/31514.png) · [sand room (32726)](poses/32726.png) · [helm room (10472)](poses/10472.png) · [gambling (10573)](poses/10573.png) · [shrine (5101)](poses/5101.png) · [jumping door (9691)](poses/9691.png) · [spikes (7039)](poses/7039.png) · [squasher (20189)](poses/20189.png) · [drinks (13371)](poses/13371.png) · [computer (9709)](poses/9709.png) · [temple stairs (18278)](poses/18278.png) · [ball (25655)](poses/25655.png) · [meager room (1776)](poses/1776.png) · [annex (12320)](poses/12320.png) · [barracks (15246)](poses/15246.png) · [magic hut (20168)](poses/20168.png) · [osiris (31593)](poses/31593.png) · [pool table (21831)](poses/21831.png) · [sandstone (25730)](poses/25730.png)

**Cave**

[devil's sanctum (14750)](poses/14750.png) · [web (22733)](poses/22733.png) · [altar (17639)](poses/17639.png) · [shell (29361)](poses/29361.png) · [grate (7747)](poses/7747.png) · [murals (22001)](poses/22001.png) · [well tunnel (12795)](poses/12795.png) · [crawl tunnel (6048)](poses/6048.png) · [landing (4874)](poses/4874.png) · [alcove (964)](poses/964.png) · [dead end (17730)](poses/17730.png) · [fire room (12242)](poses/12242.png) · [keeper (26180)](poses/26180.png) · [Treasury (29622)](poses/29622.png)

**Open**

[court (17872)](poses/17872.png) · [salty bar (14688)](poses/14688.png) · [desert (4223)](poses/4223.png) · [ram (23935)](poses/23935.png) · [ledge (5049)](poses/5049.png) · [dock (15787)](poses/15787.png) · [bunker (23160)](poses/23160.png) · [sphinx (28820)](poses/28820.png) · [main road (27492)](poses/27492.png) · [cliff road (3521)](poses/3521.png) · [dunes (13946)](poses/13946.png) · [trail (27689)](poses/27689.png) · [ravine (6591)](poses/6591.png) · [camp (26748)](poses/26748.png) · [south road (29926)](poses/29926.png) · [castle road (327)](poses/327.png) · [catapult (23064)](poses/23064.png) · [cliff side (9497)](poses/9497.png) · [desert vista (27740)](poses/27740.png) · [drift (20641)](poses/20641.png) · [fast water (30680)](poses/30680.png) · [flats (999)](poses/999.png) · [grave (14435)](poses/14435.png) · [jungle clearing (9387)](poses/9387.png) · [mellow pond (5878)](poses/5878.png) · [peak (4787)](poses/4787.png) · [pen (6029)](poses/6029.png) · [rapids (5112)](poses/5112.png) · [weapons storage (4940)](poses/4940.png)

**Submerged**

[Neptune's Throne (14057)](poses/14057.png) · [south sea (23679)](poses/23679.png) · [deck (20431)](poses/20431.png) · [bow (12464)](poses/12464.png) · [coral reef (24601)](poses/24601.png)
