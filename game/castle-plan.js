/* The Enchanted Castle: what stands where, and what every disk asset is for.

   Room floors, stairs, ladders, ropes, exits, entry points and per-room sound
   tables are decoded from Dark Castle's CODE 5 into archive/dc/castle-data.js.
   The placements below are read from the same room routines (the numbers are the
   routine's own arguments), with `min` the lowest difficulty that spawns them.
   How each creature behaves is rebuilt for this edition from the disk's manual
   cards, because the 1986 game logic is not reused. */
(() => {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const WINGS = {
    trouble: {title: 16201, first: 1000, name: 'Trouble', scepter: {id: 'earth', name: 'Earth Scepter', plate: 'archive/es/plates/AOBJ-608.png', room: 1020, x: 452, y: 259}},
    fireball: {title: 16202, first: 2000, name: 'Fireball', scepter: {id: 'fire', name: 'Fire Scepter', plate: 'archive/es/plates/AOBJ-4500.png', room: 2030, x: 342, y: 66}},
    shield: {title: 16204, first: 3000, name: 'Shield', scepter: {id: 'air', name: 'Air Scepter', plate: 'archive/es/plates/AOBJ-23213.png', room: 3010, x: 448, y: 74}},
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

  const g = (x, y, left, right, speed, hits = 1, min = 0) => ({type: 'doorGuard', x, y, left, right, speed, hits, min});
  const bat = (x, y, floor, min = 0) => ({type: 'bat', x, y, floor, min});
  const rat = (x, y, left, right, min = 0) => ({type: 'rat', x, y, left, right, min});
  const climber = (x, top, bottom, min = 0) => ({type: 'ropeRat', x, top, bottom, min});
  const mutant = (x, y, left, right, speed, min = 0) => ({type: 'mutant', x, y, left, right, speed, min});
  const ROOMS = {
    1000: [g(0, 262, 6, 200, 2, 2), g(0, 182, 6, 280, 2, 1, 1), g(0, 112, 6, 240, 2, 1, 1),
      bat(475, 82, 298, 1), bat(330, 4, 298, 2), bat(27, 4, 298, 2), bat(247, 4, 298, 2), bat(112, 4, 298, 2),
      rat(0, 212, 0, 310, 2), rat(100, 142, 100, 260, 2)],
    1010: [g(486, 165, 273, 474, -2, 1), g(486, 242, 160, 474, -2, 2, 1), g(486, 88, 408, 474, -2, 1, 1),
      rat(484, 272, 170, 480), rat(484, 195, 255, 480, 1), bat(90, 4, 298, 1), bat(250, 4, 298, 1), bat(414, 139, 298), bat(442, 4, 298, 1),
      {type: 'swingRope', x: 158, y: -16, reel: 'left'}, {type: 'swingRope', x: 366, y: -16, reel: 'right'}],
    1020: [{type: 'item', x: 179, y: 249, item: 'bag'}, {type: 'item', x: 484, y: 259, item: 'elixir'},
      g(0, 41, 6, 166, 1, 1), g(483, 101, 132, 475, -1, 1, 1), g(483, 163, 300, 475, -1, 1, 1),
      bat(40, 4, 298, 1), bat(320, 4, 298, 1), bat(271, 152, 298, 1), bat(122, 122, 298), bat(306, 219, 298, 1),
      rat(135, 193, 135, 200, 1), rat(484, 131, 130, 480), {type: 'guard', x: 305, y: 248, left: 200, right: 440, whip: true, min: 1},
      {type: 'faces', x: 356, y: 250}, {type: 'faces', x: 390, y: 250}, {type: 'faces', x: 424, y: 250}],
    2000: [{type: 'guard', x: 300, y: 258, left: 210, right: 450, whip: true, min: 1}, g(0, 241, 6, 180, 2, 1),
      mutant(490, 269, 216, 480, -3), {type: 'vulture', x: 170, y: 60}, {type: 'vulture', x: 300, y: 92, min: 1}],
    2010: [bat(6, 121, 275), bat(250, 4, 275), bat(420, 4, 275), bat(32, 94, 275, 1),
      {type: 'platforms'}, {type: 'drip', x: 100, y: 0, floor: 275}, {type: 'drip', x: 200, y: 0, floor: 275, min: 1},
      {type: 'drip', x: 275, y: 0, floor: 275}, {type: 'drip', x: 350, y: 0, floor: 275, min: 1}, {type: 'drip', x: 400, y: 0, floor: 275}],
    2020: [{type: 'bridge', x: 112, y: 150}, {type: 'boulder', x: 498, y: 3, speed: -2.4, min: 1}, {type: 'boulder', x: 1, y: 160, speed: 2.4, min: 1},
      bat(65, 28, 110, 1), bat(81, 171, 298), bat(232, 28, 110, 1), bat(282, 173, 298, 1), mutant(505, 252, 412, 482, -3)],
    2030: [{type: 'gates'}, {type: 'wizard', x: 430, y: 36}, mutant(122, 5, 5, 60, -3), {type: 'eye', x: 250, y: 100}, {type: 'eye', x: 350, y: 250, min: 1},
      {type: 'fountain', x: 300, y: 215}, {type: 'broom', x: 380, y: 247, left: 200, right: 430}, {type: 'torch', x: 28, y: 214}, {type: 'torch', x: 278, y: 214}],
    3000: [{type: 'henchman', x: 330, y: 5}, {type: 'weight', x: 240, min: 1}, mutant(159, 87, 5, 410, 3, 1), mutant(490, 99, 80, 480, -3, 1), mutant(490, 46, 408, 480, -3, 2)],
    3010: [{type: 'dragon', x: 408, y: 144}, {type: 'hatch', x: 440, y: 72}, mutant(490, 240, 340, 480, -3, 2), {type: 'storm', every: 150}, {type: 'clouds', x: 30, y: 8}, {type: 'clouds', x: 210, y: 18}],
    3020: [climber(39, 40, 247), climber(68, 40, 132), climber(97, 40, 247), climber(155, 40, 247), climber(213, 40, 247), climber(271, 40, 247), climber(300, 40, 247),
      climber(335, 40, 131), climber(422, 40, 181), bat(44, 15, 275), bat(376, 151, 275), bat(240, 15, 275), bat(470, 83, 275), bat(463, 237, 275, 1)],
    3030: [{type: 'item', x: 394, y: 48, item: 'bag'}, {type: 'storm', every: 100}, {type: 'storm', every: 170, min: 1}, {type: 'clouds', x: 60, y: 4}, {type: 'clouds', x: 300, y: 12},
      bat(158, 97, 275, 1), bat(340, 97, 275, 1), bat(119, 193, 275), bat(299, 193, 275), bat(86, 193, 275, 1), bat(271, 97, 275, 1)],
    4000: [{type: 'gargoyle', x: 120, y: 60, right: 335}, {type: 'gargoyle', x: 330, y: 150, right: 335, min: 2},
      climber(142, 40, 281, 1), climber(229, 40, 223, 1), climber(258, 40, 281, 1), climber(287, 40, 281, 1), climber(316, 40, 281, 1), climber(368, 40, 281, 1), climber(432, 40, 134, 1),
      g(486, 222, 425, 478, -2, 1, 1), g(486, 163, 425, 478, -2, 1, 1)],
    4010: [{type: 'gargoyle', x: 30, y: 60, right: 265}, {type: 'platforms'}, {type: 'henchman', x: 18, y: 39}, {type: 'weight', x: 240, min: 1},
      rat(399, 40, 274, 473, 1), rat(494, 80, 399, 494, 1)],
    4020: [{type: 'gargoyle', x: 105, y: 60, right: 395, min: 1}, {type: 'knight', x: 232, y: 90}, {type: 'lever', x: 46, y: 8, chain: 0}, {type: 'lever', x: 453, y: 8, chain: 1},
      rat(192, 245, 95, 195, 1), rat(303, 245, 298, 401, 1), climber(97, 40, 161, 1), climber(397, 40, 161, 1)]
  };

  // Points from the disk's scoring card, Data A PICT 20005, and its rules.
  const POINTS = {bat: 30, vulture: 30, rat: 20, ropeRat: 20, mutant: 30, eye: 30, broom: 30, guard: 50, henchman: 100, whip: 150, dragon: 150, gargoyle: 100};
  const RULES = {startRocks: 60, rockCap: 80, bagRocks: 20, lives: 3, power: 1000, throne: 5000,
    bonus: [2000, 3000, 4000], extraMan: [5000, 7500, 10000], shieldTicks: 110};

  // Every reel on the disk and the moment it appears in play. A test requires all 172.
  const REELS = {
    hero: ['A100', 'A101', 'A102', 'A103', 'A104', 'A105', 'A106', 'A107', 'A108', 'A109', 'A110', 'A114', 'A115', 'A116', 'A117', 'A118', 'A119', 'A120', 'A123', 'A125', 'A126', 'A128', 'A129', 'A149', 'B121', 'B122', 'B132', 'B133', 'B134', 'B147', 'B150', 'B151', 'B154', 'B156', 'B157', 'B142'],
    arm: ['A111', 'A112', 'A113', 'A127', 'A138', 'A520'],
    harm: ['A124', 'A130', 'A131', 'A135', 'A136', 'A137', 'B139', 'B140', 'B141', 'B143', 'B146', 'B148', 'B152', 'B153', 'B155', 'B158'],
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
  const SOUNDS = {
    step: [84, 88], jump: [14], land: [11], ladder: [79], climb: [99], rope: [83], fall: [6], duck: [78],
    throwRock: [3], rockHit: [4], fireball: [42], pickup: [5], elixir: [13], plague: [12], heroHit: [50], heroDie: [7], splat: [11], extraMan: [10],
    bat: [69, 85], rat: [70, 87], door: [60], guard: [47, 56, 57, 58, 65], guardDie: [66, 82], mutant: [67, 68], whip: [73],
    henchman: [32, 48], boulder: [35, 86], dragon: [30, 31], drip: [33], eye: [45, 46], fountain: [61, 62, 63, 64],
    gargoyle: [37, 51], knight: [36, 53, 54], throne: [39, 55], mug: [36], lever: [29], storm: [34], wizard: [9, 43, 49, 52],
    gate: [40, 41], broom: [60], vulture: [32], hatch: [41], weight: [8], swing: [2], hallRun: [84], title: [90, 91, 95], hall: [92, 93, 94],
    ending: [0, 89], ambience: [1]
  };
  root.CastlePlan = {WINGS, WING_OF, DOORS, ROOMS, POINTS, RULES, REELS, SCREENS, SOUNDS};
})();
