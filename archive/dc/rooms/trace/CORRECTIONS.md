# Corrections to this trace

Each claim below was checked against `archive/dc/rooms/work/seg*.asm` and the decoded room data before anything was built from this folder. The JSON files are the better source, because `README.md` and the delivery report disagree with them in several places. Where they differ, trust the code offsets listed here.

## `README.md` is wrong on these points

| Topic | `README.md` says | The code and the JSON show |
| --- | --- | --- |
| Hero states 25 to 28 | Entered from kind 20, reels are Data A PPCT 132 and 133 | Kind 17 in room 1020 (CODE 2 `$7ba`). Reels are Data B 132, 133 and 134. |
| `-$274(a5)` | Set to `$ffff` | Set to 1 (CODE 2 `$20cc`). |
| Click in those states | State 26 at `$20dc` | State 25 at `$20de`. `$20dc` is an `rts`. |
| Kind 21 | Throne topple trigger in room 4020 | Wall switch at (73..83, 253) in room 3030. It lights the real ledges. |
| Kind 37 | Post-victory exit | Half-bridge trap in room 4020 (table at CODE 2 `$2a6e`). |
| Kind 546 | Trick rope in room 3030 | Greased rope in room 4000. |
| Levers in room 4020 | Do not matter to toppling the Knight | Both are needed. Only the solid bridge carries the third pillar's chain. |

## The JSON files are wrong on these points

| File | Claim | The code shows |
| --- | --- | --- |
| `rules.json` | Start with 10 rocks | 60 rocks: `move.w #$6000, -$2c2(a5)` at CODE 1 `$23a8`. `$10` is the minimum after a death (CODE 2 `$430`). |
| `rules.json` | A life is taken at CODE 4 `$5acc` | CODE 2 `$41c`. |
| `ropes.json` | Jump leaps off a rope at `$1806` | States 9 and 47 never test the Jump bit. A direction key does it (CODE 2 `$1790-$1852`, `$1cd8-$1d48`). |
| `ropes.json` | Kind 520 needs Down, and snaps Duncan to Y + 30 | State 11 has no key test (CODE 2 `$1930-$1966`). It is a catch zone that puts Duncan on the rope in field `a`. |
| `creatures.json` | The Wizard's gate is opened by three rock hits | The three kind-35 chains are pulled by hand. The order is one of six, picked at setup (CODE 4 `$39f0`, `$3a3e`, `$3a84`). |
| `kinds.json` | The half bridge is PPCT 715, and the levers are 712 and 717 | The loader puts PPCT 919 in that slot (CODE 6 `$ef4`). The lever sprites remain unconfirmed. |
| `kinds.json` | The floor levers are on floor 255 | Floor 263 in the decoded room data. |

## Facts this trace missed

- Hidden ledges: room 3030 picks one of eight patterns for each difficulty (CODE 5 `$15f4`, `$1d68`, tables at `$4fd2`, `$4ff4`, `$5016`). Each real ledge is 36 pixels wide.
- River logs ride in rows y=86 and y=240, which hold no fixed spans. A log leaving the upper river returns at the left of the lower one, with its rider (CODE 4 `$38b8-$3918`). That is the route through room 2020.
- Kind 22 drowns (CODE 2 `$7e2`, `$874`).
- A bag holds 10 rocks and is refused at 80 (CODE 2 `$26de-$2706`).
