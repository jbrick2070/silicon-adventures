/* Where next? An InvisiClues-style ladder for the four-scepter campaign.
   Each milestone mirrors a row of archive/es/PLAYTEST.md. `done` reads the
   engine's state snapshot (inventory ids), the rooms charted so far, and the
   current scene, so the current goal is the first milestone not yet met and
   stays right after bookmarks, revisits and wandering. The three tiers go
   from a nudge in the game's own voice to the exact inputs of the winning run
   in archive/es/campaign-trace.tsv (checked by archive/es/check_hints.py).
   Hints are an addition of this edition, like the Dark Castle visitors. */
window.ScepterHints = (() => {
  const SWORD = 1420, LANTERN = 17298, KEYRING = 19657, FLUTE = 6496, WAND = 17963, EARTH = 608,
    AIR = 23213, SUIT = 14702, OIL = 23374, CHIP = 13010, PEARL = 19491, TRIDENT = 25961,
    IRONKEY = 4091, WATER = 19566, ROPE = 24183, FIRE = 4500;
  const HIGH_ALTAR = 7990, FINALE = 18366, SUB_DECK = 28593, OFFICE = 1092;
  const milestones = [
    { title: 'Permission to leave',
      done: (has) => has(SWORD),
      tiers: ['The King has summoned you. Go to the Throne Room, and answer whoever asks.',
        'Throne room, south of the marble hall: answer the Guard and the King with YES, then take what the King offers.',
        ['yes', 'yes', 'get sword']] },
    { title: 'Elron’s charge',
      done: (has, _seen, _scene, named) => named('freeze spell'),
      tiers: ['Your master’s sanctum holds a book worth reading.',
        'Wizard’s Sanctum, north of the banquet hall: read the book, then do what it says with the sword, and take the spell.',
        ['read book', 'swing sword', 'get freeze spell']] },
    { title: 'Into the dungeon',
      done: (has) => has(LANTERN) || has(KEYRING),
      tiers: ['The armory keeps a shield. The dungeon beyond it keeps a key, and a way down.',
        'Armory, south of the banquet hall: get shield. Dungeon to the east: the cell holds a key ring; back in the dungeon, OPEN, go south, and take the lantern.',
        ['get shield', 'east', 'get key ring', 'west', 'open', 'south', 'get lantern']] },
    { title: 'The boiling pool',
      done: (has) => has(FLUTE),
      tiers: ['A boiling pool bars the way below. Cold would help, and the lab beyond has music in it.',
        'Well tunnel east, cavern pool south, landing west to the boiling pool: cast freeze. Pedestal south, lab east, music room north: SEARCH, then take the flute.',
        ['cast freeze', 'south', 'east', 'north', 'search', 'get flute']] },
    { title: 'The snake and the wand',
      done: (has) => has(WAND),
      tiers: ['Music soothes what guards the cavern, and an altar answers prayer.',
        'Cavern, south of the great hall: play flute. Altar to the west: pray, then take the wand.',
        ['play flute', 'west', 'pray', 'get wand']] },
    { title: 'The Earth Scepter',
      done: (has) => has(EARTH),
      tiers: ['The chasm wants a bridge, and the demon beyond it wants a word for what the sky shows after rain.',
        'Chasm, east of the cavern: wave wand, go east, answer RAINBOW, go east to the Elven Throne.',
        ['wave wand', 'east', 'rainbow', 'east', 'get earth scepter']] },
    { title: 'The temple',
      done: (has, seen) => has(AIR) || seen(HIGH_ALTAR),
      tiers: ['Rest where the corner invites it. The temple to the south hides the Air Scepter, and its halls are traps.',
        'Corner: SIT. Tree path, temple vista, temple stairs, up to the priest’s room: open, east, open, east. Sand room: push, four times. Dogleg: open, east. Slide floor south. Spikes: click the floor. Web: cut, west. Squasher: click the door.',
        ['sit', 'south', 'up', 'open', 'east', 'open', 'east', 'push', 'push', 'push', 'push', 'north', 'open', 'east', 'south', 'west', 'cut', 'west']] },
    { title: 'The Air Scepter',
      done: (has) => has(AIR),
      tiers: ['At the High Altar, read before you kneel.',
        'High altar: read the murals, pray, get the Air Scepter, then move the altar and go down.',
        ['read', 'pray', 'get air scepter', 'move altar', 'down']] },
    { title: 'Diving gear',
      done: (has) => has(SUIT),
      tiers: ['The sea road needs a suit. A tavern on the dunes keeps one in a closet.',
        'Marsh: get sword. Slough south, ledge west, lava path south, dunes west, salty bar: OPEN. Drinks west, gambling south: OPEN. Closet west: get diving suit, diving helmet, air tank.',
        ['get sword', 'south', 'west', 'south', 'west', 'open', 'west', 'south', 'open', 'west', 'get diving suit', 'get diving helmet', 'get air tank']] },
    { title: 'Oil and a chip',
      done: (has) => has(CHIP) || has(PEARL) || has(TRIDENT) || has(WATER),
      tiers: ['The dock keeps oil. The beach keeps a small thing worth searching for, and keep it safe: a thief would end the sea voyage.',
        'Salty bar south to the dock: get oil can. Seaside east, silicon beach: SEARCH, get chip.',
        ['south', 'get oil can', 'east', 'search', 'get chip']] },
    { title: 'The wreck’s pearl',
      done: (has) => has(PEARL) || has(TRIDENT) || has(WATER),
      tiers: ['A wreck lies in the shallows. Its store room chest is locked, and frost cracks locks.',
        'Clear water south, south sea west, deck north: down to the hold, south to the cannon, store room: open. If the chest resists, cast freeze spell, open again, and get the pearl.',
        ['south', 'west', 'north', 'down', 'south', 'open', 'get pearl', 'cast freeze spell', 'open', 'get pearl']] },
    { title: 'The oyster and the trident',
      done: (has) => has(TRIDENT) || has(IRONKEY) || has(WATER),
      tiers: ['An oyster blocks the channel and would trade for a pearl. Neptune’s throne hides a weapon.',
        'Up to the deck, wheel south, galleon east, on to the shell: give pearl. Murals north, Neptune’s Throne east: search, get trident.',
        ['up', 'south', 'east', 'give pearl', 'north', 'east', 'search', 'get trident']] },
    { title: 'The hatch and the Queen',
      done: (has) => has(IRONKEY) || has(WATER),
      tiers: ['A hatch in the sea floor leads to an airlock that needs oil, and to a Queen who asks for what you carry.',
        'Hatch, south of Neptune’s Throne: open, down. Airlock: close hatch, turn, oil airlock, open airlock. Greeting east: wait, drop. Court north, then east: wait, say SCEPTER, and take the iron key.',
        ['open', 'down', 'close hatch', 'turn', 'oil airlock', 'open airlock', 'east', 'wait', 'drop', 'north', 'east', 'wait', 'scepter', 'get iron key']] },
    { title: 'The Water Scepter',
      done: (has) => has(WATER),
      tiers: ['A grate past the bend hides a lair; a thrown trident settles it. Then the Queen’s own chamber.',
        'Back out through the airlock in diving gear. Murals, bend east, hook south, grate west: open with the iron key; crawl tunnel west; lair: throw trident. Return through the airlock to the court and the queen, then south: get water scepter.',
        ['open', 'west', 'throw trident', 'wait', 'south', 'get water scepter']] },
    { title: 'The submarine',
      done: (has, seen) => has(ROPE) || has(FIRE) || seen(OFFICE) || seen(SUB_DECK),
      tiers: ['The computer south of the Queen’s chamber is missing a part, and the submarine beyond needs a pilot.',
        'Meager room south, computer west: insert chip. Submarine west, sub deck: open, down. Helm room: close. Control: click the panel switches until the boat moves. Then east, open, up, and north to the beach.',
        ['south', 'west', 'insert chip', 'west', 'open', 'down', 'close', 'west', 'east', 'open', 'up', 'north']] },
    { title: 'The Hurk office',
      done: (has) => has(ROPE) || has(FIRE),
      tiers: ['The Hurk command post keeps rope you will need at the volcano.',
        'Silicon beach to the mesa, ram north, bunker west, lobby north: open. Office: cast freeze spell on the Captain, then get rope.',
        ['open', 'north', 'cast freeze spell', 'get rope']] },
    { title: 'The Fire Scepter',
      done: (has) => has(FIRE),
      tiers: ['A sphinx hides a stair. Below it, the phoenix, a sealed sepulchre and a shrine guard the volcano path.',
        'Sphinx, south of the cactus: search, down. Passage south, basin east, phoenix north: EYE. Ante chamber east, sepulchre north: BREAK, open. Shrine north: open, UNWRAP. Cliff path north to the volcano top: tie rope, down. Fire Demon: cast freeze spell, swing sword, get fire scepter.',
        ['search', 'down', 'south', 'east', 'north', 'eye', 'east', 'north', 'break', 'open', 'north', 'open', 'unwrap', 'north', 'tie rope', 'down', 'cast freeze spell', 'swing sword', 'get fire scepter']] },
    { title: 'The return',
      done: (_has, _seen, scene) => scene === FINALE,
      tiers: ['Carry all four scepters home. The gates ask who you are; tell them.',
        'Volcano top: up. Butte, mesa west, ram north. Main road: answer SABER. Rampart north, east. South road north. Crossroads: SABER. Bridge room west, courtyard north.',
        ['up', 'west', 'north', 'saber', 'north', 'east', 'north', 'saber', 'west', 'north']] },
    { title: 'The Finale',
      done: () => false,
      tiers: ['Wait, and listen.', 'Wait.', ['wait']] }
  ];
  // The first milestone not yet met, where anything met later counts as met earlier (dropped items stay met).
  function current(state, visited) {
    const has = id => state.inventory.some(o => o.id === id);
    const named = name => state.inventory.some(o => o.name.toLowerCase() === name);
    const seen = id => !!visited(id);
    const met = milestones.map(m => m.done(has, seen, state.scene, named));
    for (let i = met.length - 1; i >= 0; i--) if (met[i]) for (let k = 0; k < i; k++) met[k] = true;
    const index = met.findIndex(v => !v);
    return { index, milestone: milestones[index], count: milestones.length };
  }
  return { milestones, current };
})();
