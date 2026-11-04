# The Silicon Adventures soundtrack

Begin an adventure to hear the score. Music and sound are enabled on your first visit. The **Music** slider sets the score level, and the **Effects** slider sets the level of voices, footsteps and other game sounds. Each region has two tracks, played in the order below. The current title appears beneath the picture. Open **Field guide → Soundtrack credits** to see the track list while playing.

| Region | Track | Credit | In-game recording |
| --- | --- | --- | --- |
| Castle and temple | Hero's Quest | jeffreyabrick | [WAV · 3:08](../music/heros-quest.wav) |
| Castle and temple | Violet Stone | Silicon Adventures arrangement using Enchanted Scepters and Dark Castle sounds | [WAV · 0:48](../music/violet-stone.wav) |
| Sea floor and wreck | Submerged Bell | jeffreyabrick | [WAV · 2:55](../music/submerged-bell.wav) |
| Sea floor and wreck | Soundings | Silicon Adventures arrangement using Enchanted Scepters sounds | [WAV · 0:51](../music/soundings.wav) |

The castle score follows Saber from the quarters through the marble and banquet halls, throne room and courtyard. It also plays in the Wizard’s Sanctum, map room, bridge room and temple stairs. At the High Altar the music drops in level so the wizard can be heard. The underwater score plays in the 28 rooms whose disk ambience is bubbles, including the wreck interiors. The submarine helm, controls, armory and Finale keep their own game cues.

Moving to a neighbouring room within the same region keeps the track playing. Leaving a region fades out its music. On returning during the same journey, you pick up where you left off. Opening a dialog or hiding the tab pauses playback. **Sound off** mutes the full mix, and **Music off** switches off only the score. The game remembers both switches and volume levels for the browser’s launch address.

## Sketches and Suno prompts

Violet Stone and Soundings began as instrumental studies for this edition. The **synth seeds** use a newly synthesized instrument kit and the same written scores as the disk mixes. The disk mixes let you hear the arrangements with the original Macintosh recordings.

| Cue | Suno seed | Mix using disk recordings | Placement |
| --- | --- | --- | --- |
| Violet Stone · 52 s | [Download MP3](suno/01-violet-stone.mp3) | [Download disk mix](01-violet-stone.mp3) | Marble hall, throne room, Wizard’s Sanctum |
| Soundings · 54 s | [Download MP3](suno/02-soundings.mp3) | [Download disk mix](02-soundings.mp3) | South Sea, approach to the wreck, exposed decks |

The seeds fit within Suno’s documented 60-second Basic upload limit. The disk mixes and the sampler contain archived game recordings. Suno asks uploaders to confirm rights to uploaded material. The synth seeds can be rebuilt without loading any disk asset. [Audio upload guide](https://help.suno.com/en/articles/6141569) · [Upload confirmation](https://help.suno.com/en/articles/2477633)

## Violet Stone

A flute calls across a stone hall. A low horn holds the room together. The flute opens with B, G and E, climbs higher in the middle, then settles over E again. A drum on the longer beats and a knock from the side give the space its scale.

**Suno prompt**

> Instrumental underscore for exploring an old Macintosh fantasy adventure. A small breathy flute answers a low, soft horn in a vaulted stone hall. Keep the descending B–G–E flute call and leave a beat for its reply. Open fifths, one distant frame drum, a wooden knock and a short stone echo. 60 BPM, patient four-beat phrases. Build gently in the middle and return to a sparse opening texture that can repeat. Keep the upper register clear for footsteps and a speaking wizard. No vocals.

## Soundings

A slower six-beat sway for the sea floor. A metal strike sounds much lower than its source, answered by a water drop. Bubbles move across a narrow stereo field while a low D returns after the current shifts.

**Suno prompt**

> Instrumental exploration music for a sunken wooden ship. A low bowed D under a gentle 6/8 sway, about 56 dotted-quarter beats per minute. Let a damped metal note and a single water drop answer each other. Carry the seed’s metallic tune through a darker middle phrase, then ease back into open water. Make the beat felt through water and wood. Leave long gaps for separate game signals. Quiet ending that can lead back into the opening. No vocals.

## Original sounds

[Dry disk sampler · 17 seconds](03-disk-sampler.mp3). Cues play at natural pitch with short gaps and matched levels. This file is a local timbre reference.

| Time | Recording | Source |
| ---: | --- | --- |
| 0.25 s | Horn | Enchanted Scepters ASND 20958 |
| 1.95 s | Flute | ASND 23166 |
| 3.65 s | Drum | ASND 13416 |
| 5.35 s | Knock | Dark Castle Data B SOUN 69, used as a knock in this edition |
| 7.05 s | Splash | Enchanted Scepters ASND 15841 |
| 8.75 s | Bubbles | ASND 26264 |
| 10.45 s | Drip | ASND 17249 |
| 12.15 s | Ping | ASND 9009 |
| 13.85 s | Chain | ASND 32414 |
| 15.55 s | Clank | ASND 31726 |

The arranged disk mixes repitch and filter these cues. Sustained notes use partials measured from the flute, horn, drip and ping. The synth seeds use their own generated tones, noise and resonators. The MP3 studies, seeds and sampler are stereo at 44.1 kHz and 192 kb/s. [Disk provenance](../../sources/README.md) · [Dark Castle sound assignments](../../archive/dc/README.md)

## Game audio files

Hero's Quest and Submerged Bell use the full recordings supplied for this edition. Both source MP3s credit jeffreyabrick. Their game copies are 32,000 Hz, 16-bit stereo WAVs. The game versions of Violet Stone and Soundings use disk samples at 22,050 Hz, 16-bit stereo. Each closes on a 48-beat boundary with its tail folded into the opening. Regenerate these two WAVs with `python audio/soundtrack-studies/render.py --game-loops`. The downloadable MP3 studies keep their original endings.

Rebuild with `python audio/soundtrack-studies/render.py` from the repository root with NumPy, SciPy, and FFmpeg with libmp3lame on PATH. Supply an output directory to keep a separate render, or add `--synth-only` for just the two seeds.
