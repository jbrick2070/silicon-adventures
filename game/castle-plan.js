/* The Enchanted Castle: what stands where, and what every disk asset is for.

   Room floors, stairs, ladders, ropes, exits, entry points and per-room sound
   tables are decoded from Dark Castle's CODE 5 into archive/dc/castle-data.js.
   The placements below are read from the same room routines (the numbers are the
   routine's own arguments), with `min` the lowest difficulty that spawns them. Door
   guards, bats and rats are not listed here: the build writes them to CASTLE_DATA.spawns.
   Duncan's jumps, his walk, ladder and fall rates, and most of his reels are the
   hero code's own, traced in archive/dc/rooms/assets/hero-reels.json.
   Rules, rates, scores and sound meanings come from the hero and creature code,
   traced in archive/dc/rooms/trace/ and checked against the disassembly. Creature
   paths that are not listed there are rebuilt for this edition. */
(() => {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const WINGS = {
    trouble: {title: 16201, first: 1000, name: 'Trouble', scepter: {id: 'earth', name: 'Earth Scepter', plate: 'archive/es/plates/AOBJ-608.png', room: 1020, x: 452, y: 259}},
    fireball: {title: 16202, first: 2000, name: 'Fireball', scepter: {id: 'fire', name: 'Fire Scepter', plate: 'archive/es/plates/AOBJ-4500.png', room: 2030, x: 334, y: 72}},
    shield: {title: 16204, first: 3000, name: 'Shield', scepter: {id: 'air', name: 'Air Scepter', plate: 'archive/es/plates/AOBJ-23213.png', room: 3030, x: 366, y: 56}},
    knight: {title: 16203, first: 4000, name: 'Black Knight', scepter: {id: 'water', name: 'Water Scepter', plate: 'archive/es/plates/AOBJ-19566.png', room: 4020, x: 246, y: 240}}
  };
  const WING_OF = id => id < 2000 ? 'trouble' : id < 3000 ? 'fireball' : id < 4000 ? 'shield' : 'knight';
  // Great Hall doors, each with its GPTH run. Selected with left and right.
  const DOORS = [
    {path: 10010, wing: 'trouble', x: 40, label: 'Trouble'},
    {path: 10020, wing: 'fireball', x: 130, label: 'Fireball'},
    {path: 10040, wing: 'knight', x: 260, label: 'Black Knight'},
    {path: 10030, wing: 'shield', x: 480, label: 'Shield'}
  ];

  const climber = (x, top, bottom, min = 0) => ({type: 'ropeRat', x, top, bottom, min});
  const mutant = (x, y, left, right, speed, min = 0) => ({type: 'mutant', x, y, left, right, speed, min});
  const ROOMS = {
    1000: [
      
      ],
    1010: [
      
      {type: 'swingRope', x: 158, y: -16, reel: 'left'}, {type: 'swingRope', x: 366, y: -16, reel: 'right'}],
    1020: [{type: 'item', x: 179, y: 249, item: 'bag'}, {type: 'item', x: 484, y: 259, item: 'elixir'},
      {type: 'guard', x: 305, y: 248, left: 200, right: 440, whip: true},
      {type: 'faces', x: 356, y: 250}, {type: 'faces', x: 390, y: 250}, {type: 'faces', x: 424, y: 250}],
    2000: [{type: 'guard', x: 300, y: 258, left: 210, right: 450, min: 2},
      mutant(490, 269, 216, 480, -3), {type: 'vulture', x: 170, y: 60}],
    2010: [
      {type: 'platforms'}, {type: 'drip', x: 100, y: 0, floor: 275}, {type: 'drip', x: 200, y: 0, floor: 275},
      {type: 'drip', x: 275, y: 0, floor: 275}, {type: 'drip', x: 350, y: 0, floor: 275}, {type: 'drip', x: 400, y: 0, floor: 275}],
    2020: [{type: 'logs'}, {type: 'boulder', x: 498, y: 3, speed: -2.4}, {type: 'boulder', x: 1, y: 160, speed: 2.4},
      mutant(505, 252, 412, 482, -3)],
    2030: [{type: 'gates'}, {type: 'wizard', x: 430, y: 36}, mutant(122, 5, 5, 60, -3), {type: 'eye', x: 250, y: 100}, {type: 'eye', x: 350, y: 250, min: 2},
      {type: 'fountain', x: 300, y: 215}, {type: 'broom', x: 300, y: 268, left: 120, right: 442}, {type: 'torch', x: 28, y: 214}, {type: 'torch', x: 278, y: 214}],
    3000: [{type: 'henchman', x: 330, y: 5}, mutant(159, 87, 5, 410, 3), mutant(490, 99, 80, 480, -3, 1), mutant(490, 46, 408, 480, -3, 2)],
    3010: [{type: 'dragon', x: 408, y: 144}, {type: 'hatch', x: 440, y: 72}, {type: 'weight', x: 420}, {type: 'vulture', x: 250, y: 60}, mutant(490, 240, 340, 480, -3, 1), {type: 'clouds', x: 30, y: 8}, {type: 'clouds', x: 210, y: 18}],
    3020: [climber(39, 40, 247), climber(68, 40, 132), climber(97, 40, 247), climber(155, 40, 247), climber(213, 40, 247), climber(271, 40, 247), climber(300, 40, 247),
      climber(335, 40, 131), climber(422, 40, 181), ],
    3030: [{type: 'item', x: 394, y: 48, item: 'bag'}, {type: 'storm', every: 100}, {type: 'storm', every: 170}, {type: 'clouds', x: 60, y: 4}, {type: 'clouds', x: 300, y: 12},
      ],
    4000: [{type: 'gargoyle', x: 120, y: 60, right: 335},
      climber(142, 40, 281), climber(229, 40, 223), climber(258, 40, 281), climber(287, 40, 281), climber(316, 40, 281), climber(368, 40, 281), climber(432, 40, 134),
      ],
    4010: [{type: 'gargoyle', x: 30, y: 60, right: 265}, {type: 'platforms'}, {type: 'henchman', x: 18, y: 39},
      ],
    4020: [{type: 'gargoyle', x: 105, y: 60, right: 395}, {type: 'knight', x: 232, y: 90}, {type: 'lever', x: 0, y: 256, chain: 0}, {type: 'lever', x: 480, y: 256, chain: 1},
      climber(97, 40, 161), climber(397, 40, 161)]
  };

  // Points from the disk's scoring card, Data A PICT 20005, and its rules.
  // The Stbl score tables, one entry for each kind of foe.
  const POINTS = {bat: 30, vulture: 30, rat: 20, ropeRat: 20, mutant: 30, eye: 25, broom: 25, guard: 50, henchman: 100, whip: 150, dragon: 150, gargoyle: 100};
  // Start values are CODE 1 $23a8-$23f0. A death tops rocks up to ten (CODE 2 $430). A bag holds ten
  // and is refused at 80 (CODE 2 $26de-$2706). The Shield lasts 30 updates (CODE 2 $259e), and an
  // Elixir covers 20 updates of plague (CODE 2 $558). The fourth Stbl table is the Black Knight level.
  const RULES = {startRocks: 60, respawnRocks: 10, rockCap: 80, bagRocks: 10, lives: 5, startElixir: 0, power: 1000, throne: 5000, flail: 50,
    bonus: [2000, 3000, 4000, 5000], extraMan: [5000, 7500, 10000, 15000], shieldUpdates: 30, plagueUpdates: 20};

  // Every reel on the disk and the moment it appears in play. A test requires all 172.
  const REELS = {
    hero: ['A100', 'A101', 'A102', 'A103', 'A104', 'A105', 'A106', 'A107', 'A108', 'A109', 'A110', 'A114', 'A115', 'A116', 'A117', 'A118', 'A119', 'A120', 'A123', 'A125', 'A126', 'A128', 'A129', 'A130', 'A131', 'A149', 'B121', 'B122', 'B132', 'B133', 'B134'],
    pull: ['B146', 'B147', 'B155'],
    power: ['B142', 'B143', 'B150', 'B151', 'B154', 'B157', 'B158'],
    arm: ['A111', 'A112', 'A113', 'A127', 'A138', 'A520'],
    harm: ['A124', 'A135', 'A136', 'A137', 'B139', 'B140', 'B141', 'B148', 'B152', 'B153', 'B156'],
    shield: ['A144', 'A145', 'B709'],
    hallRun: ['A10008', 'A10010', 'A10011', 'A10012', 'A10013', 'A10020', 'A10021', 'A10022', 'A10023', 'A10024', 'A10030', 'A10031', 'A10032', 'A10033', 'A10034', 'A10040', 'A10041', 'A10042', 'A10043'],
    hallDoor: ['A10050', 'A10051', 'A10052'],
    icons: ['A5000', 'A5010'],
    bat: ['B300'], rat: ['B310', 'B311'], guard: ['B350', 'B351', 'B352', 'B353', 'B354', 'B355', 'B356', 'B357'],
    gate: ['B200', 'B400', 'B401', 'B438'],
    whip: ['B405', 'B406', 'B407', 'B408'],
    ledges: ['B410', 'B411', 'B412', 'B413', 'B700', 'B900', 'B901', 'B903'],
    drip: ['B414', 'B415', 'B416', 'B417', 'B418'],
    fountain: ['B420'], broom: ['B421', 'B422', 'B423'],
    wizard: ['B424', 'B430', 'B431', 'B432', 'B433', 'B437'],
    eye: ['B425', 'B426'], boulder: ['B428', 'B429'], mutant: ['B434', 'B435', 'B436'],
    rope: ['B510', 'B511'], weight: ['B521'], prisoners: ['B522'],
    vulture: ['B701', 'B702'], henchman: ['B703', 'B704'], storm: ['B705', 'B706', 'B707', 'B708'],
    dragon: ['B710', 'B711', 'B714'], lever: ['B712', 'B918', 'B919'], hatch: ['B715', 'B716', 'B717'],
    knight: ['B902', 'B904', 'B905', 'B908', 'B910', 'B911', 'B912', 'B913', 'B914', 'B915', 'B916', 'B917', 'B920', 'B921'],
    gargoyle: ['B906', 'B907', 'B922']
  };
  const SCREENS = {title: 'A12000', flash: 'A12010', scores: 'A15000', masks: {2020: 'B2022', 3010: 'B3012', 3030: 'B3032'}};
  // Every recording's role. Numbers follow the sound calls in each 1986 routine, or the
  // room's SFTR table where the routine alone does not settle it.
  // What each sound means on the disk, from every call site (archive/dc/rooms/trace/sounds.json).
  // SOUN 1 is never called there, so it is this edition's ambience.
  const SOUNDS = {
    step: [0], jump: [4], land: [4], ladder: [14], climb: [14], rope: [4], slip: [5], fall: [83], bump: [78], chute: [79],
    throwRock: [7], ricochet: [56], fireball: [9], pickup: [11], full: [13], elixir: [12], heroHit: [10], heroDie: [10], splat: [6], dizzy: [2, 3],
    extraMan: [8], gainShield: [50], gainFire: [3], shield: [99], flail: [84], chain: [73], handLever: [42], lever: [29],
    bat: [69], batDie: [85], rat: [70], ratDie: [87], door: [60], guard: [66], guardThrow: [58], guardDie: [82],
    whip: [47, 65], whipFall: [57], mutant: [68], mutantDie: [67], thud: [61], vulture: [63, 64], vultureDie: [62],
    henchman: [48], boulder: [35], splash: [86], dragon: [30], dragonDie: [31], weight: [32], drip: [33], eye: [43], broom: [46], broomStun: [45],
    gargoyle: [51], knight: [53], knightFall: [54], mug: [55, 36], mugBounce: [37], throne: [39], storm: [34], wizard: [49, 52],
    gate: [41], gateWrong: [40], hatch: [73], swing: [4], river: [95], hallRun: [0], hall: [88, 89], title: [92, 93, 94], scores: [90, 91],
    ending: [50], ambience: [1]
  };
  // The rock henchman's throw is 19 updates long. The boulder leaves on the 15th (CODE 4 $176a-$17bc).
  const HENCHMAN = {steps: 19, release: 14};
  root.CastlePlan = {WINGS, WING_OF, DOORS, ROOMS, POINTS, RULES, REELS, SCREENS, SOUNDS, HENCHMAN};
})();
