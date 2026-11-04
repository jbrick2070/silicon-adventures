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
  const HIGH_ALTAR = 7990, FINALE = 18366, OFFICE = 1092,
    COMPUTER = 9709, CONTROL_ROOM = 23272,
    INSTALLED_CHIP = 2718, LEFT_CONTROL = 4876, CENTRE_CONTROL = 13165, RIGHT_CONTROL = 20759,
    VIEW_1 = 16192, VIEW_2 = 11543, VIEW_3 = 3992, VIEW_4 = 4051;
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
      // Boarding the sub deck is only the beginning of the voyage.  The old
      // seen(SUB_DECK) shortcut skipped the controls puzzle and pointed Saber
      // at the Hurk office before the boat had even left its bay.
      done: (has, seen) => has(ROPE) || has(FIRE) || seen(OFFICE),
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
  const local = (key, title, tiers) => ({ key, milestone: { title, tiers } });
  const computerHint = objects => {
    if (objects.has(INSTALLED_CHIP)) return local('local/9709/installed', 'Computer room · machine running', [
      'The computer is already running. The submarine waits to the west.',
      'Leave the installed silicon chip where it is; the machine has done its part.',
      'Go west to the submarine. Its hatch and helm are the next things to inspect.'
    ]);
    if (objects.has(CHIP)) return local('local/9709/floor-chip', 'Computer room · loose chip', [
      'A loose silicon chip lies in the computer room.',
      'Take it first. It is the part the computer is waiting for.',
      'Carry the chip to the computer, install it, then go west to the submarine.'
    ]);
    return null;
  };
  const controlHint = objects => {
    const views = new Set([...objects].filter(id => [VIEW_1, VIEW_2, VIEW_3, VIEW_4].includes(id)));
    const exact = (...ids) => views.size === ids.length && ids.every(id => views.has(id));
    const unclear = () => local('local/23272/unclear', 'Control room · viewplate', [
      'The viewplate shows an unfamiliar state. Read it and the last disk response before steering.',
      'The controls are deliberate turns: do not guess at a switch when the view is unclear.',
      'Inspect the viewplate and the three labelled controls; only the changing picture tells you which bearing is safe.'
    ]);
    if (!views.size) return local('local/23272/blank', 'Control room · viewplate', [
      'The viewplate is blank. The computer and the closed hatch are departure prerequisites.',
      'Check the computer room and the hatch at the helm before trying to sail. Do not open the hatch while you are underway.',
      'When the viewplate changes, read it before touching another control.'
    ]);
    if (exact(VIEW_1)) return objects.has(CENTRE_CONTROL) ? local('local/23272/centre', 'Control room · first bearing', [
      'One viewplate picture is showing. The boat can advance once from here.',
      'The centre control advances the boat. Read the new view before choosing again.',
      'Press the centre control once, then stop and study the next picture.'
    ]) : unclear();
    if (exact(VIEW_1, VIEW_2)) return objects.has(LEFT_CONTROL) ? local('local/23272/cliff', 'Control room · cliff ahead', [
      'A cliff fills the right side of the viewplate.',
      'Steer toward the open water with the left control.',
      'Press the left control once, then read the next view before making another choice.'
    ]) : unclear();
    if (exact(VIEW_1, VIEW_2, VIEW_3)) return objects.has(RIGHT_CONTROL) ? local('local/23272/reef', 'Control room · reef ahead', [
      'A reef fills the left side of the viewplate.',
      'Steer toward the open water with the right control.',
      'Press the right control once, then read the next view before making another choice.'
    ]) : unclear();
    if (exact(VIEW_1, VIEW_4)) return local('local/23272/grounded', 'Control room · grounded', [
      'The viewplate shows the submarine grounded.',
      'There is no more steering to do. Return east to the helm, open the hatch, and climb up.',
      'From the hatch, go up and then north onto the beach.'
    ]);
    return unclear();
  };
  function localHint(state, has, seen) {
    // Reaching the office, taking its rope, or carrying Fire proves a later
    // campaign state.  A revisit to either room should then keep the player on
    // the ordinary chapter ladder instead of pulling them back into the voyage.
    if (has(ROPE) || has(FIRE) || seen(OFFICE)) return null;
    const objects = new Set((state.objects || []).map(o => o.id));
    if (state.scene === COMPUTER) {
      const fromRoom = computerHint(objects);
      if (fromRoom) return fromRoom;
      if (has(CHIP)) return local('local/9709/pack-chip', 'Computer room · chip in pack', [
        'The computer is missing its silicon chip, and you are carrying one.',
        'The chip belongs in the computer. Fit it before going west to the submarine.',
        'Use the loose chip with the computer; once it runs, go west to the submarine.'
      ]);
      return local('local/9709/missing-chip', 'Computer room · missing chip', [
        'The computer needs its small silicon chip.',
        'Search the machine, check your pack, and consult earlier field notes. The silicon beach was its original discovery site.',
        'Recover the chip before relying on the submarine; this room cannot confirm where an absent chip went.'
      ]);
    }
    if (state.scene === CONTROL_ROOM) return controlHint(objects);
    return null;
  }
  // The first milestone not yet met, where anything met later counts as met earlier (dropped items stay met).
  function current(state, visited) {
    const inventory = state.inventory || [];
    const has = id => inventory.some(o => o.id === id);
    const named = name => inventory.some(o => o.name.toLowerCase() === name);
    const seen = id => !!visited(id);
    const met = milestones.map(m => m.done(has, seen, state.scene, named));
    for (let i = met.length - 1; i >= 0; i--) if (met[i]) for (let k = 0; k < i; k++) met[k] = true;
    const index = met.findIndex(v => !v);
    const nearby = localHint(state, has, seen);
    if (nearby) return { index, milestone: nearby.milestone, count: milestones.length, key: nearby.key };
    return { index, milestone: milestones[index], count: milestones.length, key: 'chapter/'+index };
  }
  return { milestones, current };
})();
