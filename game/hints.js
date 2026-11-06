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
    SHELL = 29361, MURALS = 22001, NEPTUNE = 14057, QUEENS_CHAMBER = 18458,
    VOLCANO_TOP = 3099, DEVILS_SANCTUM = 14750, MIRROR_ROOM = 20791,
    COURTYARD = 10021, WIZARDS_SANCTUM = 29408,
    INSTALLED_CHIP = 2718, LEFT_CONTROL = 4876, CENTRE_CONTROL = 13165, RIGHT_CONTROL = 20759,
    VIEW_1 = 16192, VIEW_2 = 11543, VIEW_3 = 3992, VIEW_4 = 4051,
    MIRROR = 23941, OYSTER = 32057, TIED_ROPE = 30444;
  // Every wreck, sea-floor, Atlantis, and submarine scene occupies worldY >= 17.
  const SEA_AND_SUB = new Set([
    290, 640, 1776, 2352, 6048, 6364, 7083, 7747, 7820, 8642, 9514, 9709, 9841, 10472,
    12464, 14057, 15266, 15776, 15901, 17595, 17872, 18458, 18468, 20431, 22001, 23229,
    23272, 23449, 23679, 24601, 25538, 26474, 26847, 27201, 28593, 29361, 30379, 31514,
    31555, 32256
  ]);
  // The marsh rooms read alike and the bog is on a clock. Bearings below are the disk's map.
  const MARSH_ROOMS = {
    24338: ['Marsh · hidden valley', [
      'Gather anything scattered here first. Canyon walls close this valley on two sides, and worn ground leads to each way out.',
      'South leads into the slough. East leads to the port.',
      'Go south to the slough, where the ground rises to the south and leads out of the marsh.'
    ]],
    25936: ['Slough · the marsh', [
      'The ground is higher to the south, as the room says. East is the bog.',
      'Do not linger in the bog to the east: it swallows anyone who stays.',
      'South leaves the marsh for the cliff road. North returns to the hidden valley. East is the bog, and it is only worth crossing quickly.'
    ]],
    2577: ['Bog · sinking', [
      'The mud is taking you. Every turn here counts.',
      'The bog kills on its sixth turn. Walking around costs nothing, but any command spends a turn.',
      'Leave now. North is the port, south the alcove, east the swamp and west the slough. Do not rest here.'
    ]],
    25694: ['Swamp · the marsh', [
      'The ground gets wetter to the north. Rocks lie east and vegetation south, as the room says.',
      'A great hunter wanders this ground, so keep your wits about you and your strength up.',
      'West returns to the bog. South leads to the ferns and east to the gulley.'
    ]],
    4315: ['Stagnant pool · the marsh', [
      'The only way out on foot is east. The west is shallow water and mud.',
      'Tall cliffs close the north.',
      'Go east to the mellow pond.'
    ]]
  };
  const TEMPLE_TRAPS = {
    32726: ['Sand room · sealed temple hall', [
      'The door behind you has locked; the only way out of the temple is forward to the High Altar.',
      'The glowing button controls the sand trap: keep pressing it until the sand stops.',
      'PUSH until the disk says the sand stops and a passage opens north (four pushes in all from entry), then go north to the dogleg. Stop pressing once the passage is open.'
    ]],
    3122: ['Dogleg · temple gauntlet', [
      'The entrance behind the sand room is sealed; continue forward through the temple traps toward the High Altar.',
      'Open the dogleg door and be ready to move quickly in the next hall.',
      'If the eastern door is still shut, OPEN it (or click it). Go east to the slide floor, then immediately go east again.'
    ]],
    21162: ['Slide floor · temple gauntlet', [
      'The floor is parting over spikes; do not linger here.',
      'Step straight through before the floor gives way.',
      'Go east immediately to reach the jumping doors.'
    ]],
    9691: ['Jumping doors · temple gauntlet', [
      'The doors reverse themselves when tried. A slammed door calls for persistence.',
      'Try south. If the south door slams shut, try south again instead of changing bearing.',
      'Go south; repeat south only if the door slams and you remain here. Once in the boulder hall, go south immediately to the spikes.'
    ]],
    25655: ['Rolling ball · temple gauntlet', [
      'A stone ball is bearing down the hall; leave before it blocks the southern exit.',
      'The spikes room lies south. There are no eastern or western exits to dodge into.',
      'Go south immediately to the spikes. Do not spend another turn inspecting the ball.'
    ]],
    7039: ['Spikes · temple gauntlet', [
      'Walking straight west springs the wall spikes on you.',
      'A floor stone triggers the trap safely from here and leaves a crawlspace underneath.',
      'Click the floor stone first, then go west to crawl under the spikes into the web room.'
    ]],
    22733: ['Web · temple gauntlet', [
      'Walking into the web tangles you; clear the strands first.',
      'A blade or fire clears the web. Deal with a spider if it appears, then check that the web is gone before moving.',
      'Type CUT (or BURN). If an encounter interrupts the action and the web remains, deal with the spider and clear the web before going west into the squasher.'
    ]],
    20189: ['Squasher · temple gauntlet', [
      'The walls close in with every turn, and OPEN alone will not unlock the western door.',
      'Look for the secret button drawn on the door itself.',
      'Click the narrow door high up on the far wall, not the large door below it, to hit the secret button. Then go west into the High Altar.'
    ]]
  };
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
        'Well tunnel east, cavern pool south, landing west to the boiling pool: cast freeze. Pedestal south, lab east, art east, great hall east, fountain east, music room north: SEARCH, then take the flute.',
        ['cast freeze', 'south', 'east', 'east', 'east', 'east', 'north', 'search', 'get flute']] },
    { title: 'The snake and the wand',
      done: (has) => has(WAND),
      tiers: ['Music soothes what guards the cavern, and an altar answers prayer.',
        'Cavern, south of the lab: play flute. Altar to the west: pray, then take the wand.',
        ['play flute', 'west', 'pray', 'get wand']] },
    { title: 'The Earth Scepter',
      done: (has) => has(EARTH),
      tiers: ['The chasm wants a bridge, and the demon beyond it wants a word for what the sky shows after rain.',
        'Chasm, east of the cavern: wave wand, go east, answer RAINBOW, go east to the Elven Throne.',
        ['wave wand', 'east', 'rainbow', 'east', 'get earth scepter']] },
    { title: 'The temple',
      done: (has, seen) => has(AIR) || seen(HIGH_ALTAR),
      tiers: ['Rest where the corner invites it. The temple to the south hides the Air Scepter, and its halls are traps.',
        'Corner: SIT. Tree path, temple vista, temple stairs, up to the priest’s room: open, east, open, east. Sand room: push until the sand stops (four pushes in all), then north. Dogleg: open, east. Slide floor: east immediately. Jumping door: south, and repeat south if it slams shut. Ball: south immediately. Spikes: click the floor, then west. Web: cut, west. Squasher: click the door, then west.',
        ['sit', 'south', 'up', 'open', 'east', 'open', 'east', 'push', 'push', 'push', 'push', 'north', 'open', 'east', 'east', 'south', 'south', 'south', 'west', 'cut', 'west']] },
    { title: 'The Air Scepter',
      done: (has) => has(AIR),
      tiers: ['At the High Altar, read before you kneel.',
        'High altar: read the murals, pray, get the Air Scepter, then move the altar and go down.',
        ['read', 'pray', 'get air scepter', 'move altar', 'down']] },
    { title: 'Diving gear',
      done: (has) => has(SUIT),
      tiers: ['The sea road needs a suit. A tavern on the dunes keeps one in a closet.',
        'Marsh: get sword. Slough south, cliff road south, ledge west, lava path south, lava tunnel south, sea cliff west to the dunes, salty bar west: OPEN. Drinks west, gambling south: OPEN. Closet west: get diving suit, diving helmet, air tank.',
        ['get sword', 'south', 'south', 'west', 'south', 'south', 'south', 'west', 'west', 'open', 'west', 'south', 'open', 'west', 'get diving suit', 'get diving helmet', 'get air tank']] },
    { title: 'Oil and a chip',
      done: (has) => has(CHIP) || has(PEARL) || has(TRIDENT) || has(WATER),
      tiers: ['The dock keeps oil. The beach keeps a small thing worth searching for, and keep it safe: a thief would end the sea voyage.',
        'Salty bar south to the dock: get oil can. Seaside east, silicon beach: SEARCH, get chip.',
        ['south', 'get oil can', 'east', 'east', 'search', 'get chip']] },
    { title: 'The wreck’s pearl',
      done: (has, seen, scene, _named, objects) =>
        has(PEARL) || has(TRIDENT) || has(IRONKEY) || has(WATER) ||
        seen(MURALS) || seen(NEPTUNE) || (scene === SHELL && !objects.has(OYSTER)),
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
        'Hatch, south of Neptune’s Throne: open, down. Airlock: close hatch, turn, oil airlock, open airlock. Greeting east: wait, drop. Court north, then east twice to the Queen: wait, say SCEPTER, and take the iron key.',
        ['open', 'down', 'close hatch', 'turn', 'oil airlock', 'open airlock', 'east', 'wait', 'drop', 'north', 'east', 'east', 'wait', 'scepter', 'get iron key']] },
    { title: 'The Water Scepter',
      done: (has) => has(WATER),
      tiers: ['A grate past the bend hides a lair; a thrown trident settles it. Then the Queen’s own chamber.',
        'Back out through the airlock in diving gear. Murals, bend east, hook south, grate west: open with the iron key; crawl tunnel west; lair: throw trident. Return through the airlock to the court and the queen, then south: get water scepter.',
        ['open', 'west', 'throw trident', 'wait', 'south', 'get water scepter']] },
    { title: 'The submarine',
      // Boarding the sub deck is only the beginning of the voyage.  Once Saber
      // stands on mainland ground carrying the Water Scepter, the crossing is done.
      done: (has, seen, scene) =>
        has(ROPE) || has(FIRE) || seen(OFFICE) || seen(VOLCANO_TOP) ||
        (Boolean(scene) && has(WATER) && !SEA_AND_SUB.has(scene)),
      tiers: ['The computer south of the Queen’s chamber is missing a part, and the submarine beyond needs a pilot.',
        'Meager room south, computer west: insert chip. Submarine west, sub deck: open, down. Helm room: close. Control: click the panel switches until the boat moves. Then east, open, up, and north to the beach.',
        ['south', 'west', 'insert chip', 'west', 'open', 'down', 'close', 'west', 'east', 'open', 'up', 'north']] },
    { title: 'The Hurk office',
      done: (has, seen, scene, _named, objects) =>
        has(ROPE) || has(FIRE) || seen(VOLCANO_TOP) || scene === DEVILS_SANCTUM || objects.has(TIED_ROPE),
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
  function templeHint(scene, objects) {
    let [title, tiers] = TEMPLE_TRAPS[scene];
    let phase = '';
    // These props are the script's observable state, unlike a visit alone.
    // In particular, one wasted turn changes which ball/floor escape is safe.
    if (scene === 32726 && !objects.has(23017)) { // JD.2 removed by fourth PUSH
      phase = '/open';
      tiers = ['The sand has stopped and the northern passage is open.',
        'There is no need to press the button again.',
        'Go north now to the dogleg.'];
    } else if (scene === 3122 && !objects.has(25171)) { // DOGLEG DOOR
      phase = '/open';
      tiers = ['The eastern door is already open.',
        'The next floor slides apart; pass through without spending a turn on it.',
        'Go east to the slide floor, then immediately go east again to the jumping doors.'];
    } else if (scene === 21162 && objects.has(1148)) { // FLOOR.2, LOOP#=1
      phase = '/retreat';
      tiers = ['The floor has already opened far enough that another forward step is fatal.',
        'The dogleg door behind you can still be reached before the floor gives way.',
        'Go west immediately to the dogleg. Then go east into this room and east again without pausing.'];
    } else if (scene === 25655 && objects.has(30073)) { // BALL.2, LOOP#=2
      phase = '/blocked';
      tiers = ['The ball has already blocked the southern exit.',
        'The next adventure command will crush Saber; reading this hint does not spend a turn.',
        'Restore a save from before the ball blocked the exit. On a fresh entry, go south immediately.'];
    } else if (scene === 25655 && objects.has(18900)) { // BALL.1, LOOP#=1
      phase = '/retreat';
      tiers = ['The ball has gained momentum; the southern exit will close before you can use it.',
        'Retreat north to the jumping doors immediately.',
        'Go north now. Return through the jumping doors, then go south immediately on re-entering the ball room.'];
    } else if (scene === 7039 && objects.has(13727)) { // SPIKES.3 deployed
      phase = '/triggered';
      tiers = ['The spikes are already extended, with a crawlspace underneath.',
        'The floor switch has done its work.',
        'Go west to crawl under the spikes into the web room.'];
    } else if (scene === 22733 && !objects.has(5800)) { // WEB.1 removed by CUT/BURN
      phase = '/clear';
      tiers = ['The web has already been cleared from the hall.',
        'Continue toward the door on the west wall.',
        'Go west to the squasher. If the spider has stopped your last action, read the disk response before trying again.'];
    } else if (scene === 20189 && !objects.has(24917)) { // SQUASH DOOR
      phase = '/open';
      tiers = ['The secret button has already opened the western door.',
        'Leave before the moving walls close in.',
        'Go west immediately to the High Altar.'];
    }
    return local('local/temple/' + scene + phase, title, tiers);
  }
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
  function localHint(state, has, seen, objects, index) {
    if (!(has(ROPE) || has(FIRE) || seen(OFFICE) || seen(VOLCANO_TOP))) {
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
    }
    if (state.scene === QUEENS_CHAMBER && !has(WATER) && objects.has(WATER)) {
      return local('local/18458/scepter', 'Queen’s Chamber · Water Scepter', [
        'The Water Scepter rests right here in the Queen’s Chamber.',
        'Take the Water Scepter before leaving the palace.',
        'Get the Water Scepter, then go south toward the computer room and submarine.'
      ]);
    }
    if (state.scene === MIRROR_ROOM && !has(FLUTE)) {
      if (objects.has(MIRROR)) return local('local/20791/mirror', 'Mirror room · glass knight', [
        'A shadowy room lies beyond the mirror, but the glass resists force on its own.',
        'Wait or search until a glass-armored Black Knight steps out of the mirror, then break the mirror.',
        'Type BREAK while the Black Knight stands here, then go east to the music room, SEARCH, and get the flute.'
      ]);
      return local('local/20791/open', 'Mirror room · shattered glass', [
        'The mirror lies in shards, leaving the eastern doorway open.',
        'The music room is directly east of here, and an instrument is hidden inside.',
        'Go east to the music room, SEARCH, and get the flute.'
      ]);
    }
    if (!has(AIR) && TEMPLE_TRAPS[state.scene]) {
      return templeHint(state.scene, objects);
    }
    if (MARSH_ROOMS[state.scene]) {
      const [title, tiers] = MARSH_ROOMS[state.scene];
      return local('local/marsh/' + state.scene, title, tiers);
    }
    if (index === 17) {
      const missing = [
        [EARTH, 'Earth Scepter'], [AIR, 'Air Scepter'], [WATER, 'Water Scepter'], [FIRE, 'Fire Scepter']
      ].filter(([id]) => !has(id)).map(([, name]) => name);
      if (missing.length && (!seen(WIZARDS_SANCTUM) || state.scene === COURTYARD)) {
        const list = missing.join(', ');
        return local('local/return/missing', 'The four scepters · check your pack', [
          'Not all four scepters are in your pack (' + list + ').',
          'Going north from the courtyard opens the Finale only when every scepter is carried or already left in the Wizard’s Sanctum.',
          'Recover ' + list + ' (unless you placed it in the Wizard’s Sanctum), then cross the courtyard north.'
        ]);
      }
    }
    return null;
  }
  // The first milestone not yet met, where anything met later counts as met earlier (dropped items stay met).
  function current(state, visited) {
    const inventory = state.inventory || [];
    const objects = new Set((state.objects || []).map(o => o.id));
    const has = id => inventory.some(o => o.id === id);
    const named = name => inventory.some(o => o.name.toLowerCase() === name);
    const seen = id => !!visited(id);
    const met = milestones.map(m => m.done(has, seen, state.scene, named, objects));
    for (let i = met.length - 1; i >= 0; i--) if (met[i]) for (let k = 0; k < i; k++) met[k] = true;
    const index = met.findIndex(v => !v);
    const nearby = localHint(state, has, seen, objects, index);
    if (nearby) return { index, milestone: nearby.milestone, count: milestones.length, key: nearby.key };
    return { index, milestone: milestones[index], count: milestones.length, key: 'chapter/'+index };
  }
  return { milestones, current };
})();
