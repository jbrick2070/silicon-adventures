/* Physical room edges for the first-person view.
   The disk rooms are boxes around one drawing, and an open-air box can run
   far past anything drawn. This module gives every outdoor or undersea room a
   walkable limit and a visible edge: rock, reeds, hedge, wall, dune, bank or
   reef, chosen from the disk's own words for that side. Real exits stay open
   between two marker posts. All of this is an edition addition, drawn only in
   the refreshed layers. Original mode keeps the same limit and the same
   blocked text, so the three picture modes play alike.

   The text a player reads at an edge is never rewritten: it is the room's own
   blocked message, or the engine's own "You can't go north." */
(() => {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const SIDE_LIMIT = 6.4, BACK_LIMIT = 11, BACKDROP_MARGIN = 2.6, BACK_MINIMUM = 3.2;
  const GAP_NORTH = 2.1, GAP_SIDE = 2.6, SIDE_GAP_Z = 1.15, TRAIL_HALF = .62;
  const STAND_OFF = .85; // Saber stops a stride short of an edge, close enough to read it whole.
  // Material ids match the pigments in game/colour.js.
  const STONE = 5, FOLIAGE = 3, EARTH = 4, WATER = 2;
  // Every edge stands above eye height (1.8 m) so Saber cannot see past it at
  // arm's length. A bank is the exception: open water runs out to the horizon.
  const STYLES = {
    rock: {height: 2.75, material: STONE},
    cliff: {height: 3.9, material: STONE},
    thicket: {height: 2.9, material: FOLIAGE},
    reeds: {height: 2.55, material: FOLIAGE},
    wall: {height: 2.7, material: STONE},
    dune: {height: 2.4, material: EARTH},
    bank: {height: 1.74, material: WATER},
    reef: {height: 3, material: STONE}
  };
  // The marsh cluster reads alike, so its edges are reeds on every blocked side.
  const MARSH_ROOMS = new Set([24338, 25936, 2577, 25694, 4315, 4957]);
  const WORDS = [
    [/\b(water|lake|river|sea|ocean|pond|bank is|current|tide|shore)\b/, 'bank'],
    [/\b(mud|marsh|swamp|bog|reeds?|slough)\b/, 'reeds'],
    [/\b(jungle|thorns?|brambles?|brush|vines?|trees?|woods?|forest|ferns?|vegetation)\b/, 'thicket'],
    [/\b(cliffs?|canyon|ravine|mountains?|peaks?|crags?)\b/, 'cliff'],
    [/\b(walls?|rampart|fortress|castle|gate|courtyard|bars?|fence|pikes?)\b/, 'wall'],
    [/\b(sand|dunes?|desert|sandstone)\b/, 'dune'],
    [/\b(rocks?|rocky|boulders?|rugged|terrain|stones?)\b/, 'rock']
  ];
  function wordStyle(text) {
    for (const [pattern, style] of WORDS) if (pattern.test(text)) return style;
    return '';
  }
  function styleFor(meta, direction, env) {
    if (env === 'submerged') return 'reef';
    if (MARSH_ROOMS.has(meta.id)) return 'reeds';
    return wordStyle(String(meta.messages?.[direction] || '').toLowerCase()) ||
      wordStyle((String(meta.text || '') + ' ' + meta.name).toLowerCase()) || 'rock';
  }
  // Two rooms sharing a side should not share a skyline.
  function seedFor(meta, direction) {
    return (meta.id * 7 + direction.charCodeAt(0) * 13) % 97 / 9.7;
  }
  function limits(rig, env) {
    const rear = rig.rear ?? -1.75;
    if (env !== 'open' && env !== 'submerged') return {left: rig.left, right: rig.right, back: rig.back, rear};
    return {
      left: Math.max(rig.left, -SIDE_LIMIT), right: Math.min(rig.right, SIDE_LIMIT),
      // Stop short of the backdrop: at arm's length a drawing is only a blur of tile.
      back: Math.max(Math.min(rig.back, BACK_MINIMUM), Math.min(rig.back - BACKDROP_MARGIN, BACK_LIMIT)), rear
    };
  }
  function edge(meta, direction, env, open, rig, bounds) {
    const style = styleFor(meta, direction, env), axisNorth = direction === 'north' || direction === 'south';
    const low = axisNorth ? bounds.left : bounds.rear, high = axisNorth ? bounds.right : bounds.back;
    const center = axisNorth ? 0 : Math.min(high, Math.max(low, SIDE_GAP_Z));
    const half = axisNorth ? GAP_NORTH : GAP_SIDE;
    return {
      direction, style, open: !!open, material: STYLES[style].material, height: STYLES[style].height,
      seed: seedFor(meta, direction), center, half,
      // Where the disk's drawing is in view the edge rises only as Saber nears it.
      overPlate: direction !== 'south'
    };
  }
  function standOff(outer) {
    return {
      left: Math.min(-.3, outer.left + STAND_OFF), right: Math.max(.3, outer.right - STAND_OFF),
      back: Math.max(1.2, outer.back - STAND_OFF), rear: Math.min(-.2, outer.rear + STAND_OFF)
    };
  }
  function profile(meta, exits, env, rig) {
    const outer = limits(rig, env);
    if (env !== 'open' && env !== 'submerged') return {bounds: outer, fence: null};
    const edges = {};
    for (const direction of ['north', 'east', 'south', 'west'])
      edges[direction] = edge(meta, direction, env, exits?.[direction], rig, outer);
    return {bounds: standOff(outer), fence: {...outer, edges}};
  }
  // Keep every drawn thing reachable: the limit opens to take in what stands beyond it.
  function widen(profiled, rig, sprites) {
    const {bounds, fence} = profiled;
    if (!fence) return false;
    let changed = false;
    for (const s of sprites) {
      if (s.decorative || s.refreshedOnly) continue;
      const left = Math.max(rig.left + .14, Math.min(bounds.left, s.x - 1)),
        right = Math.min(rig.right - .14, Math.max(bounds.right, s.x + 1)),
        back = Math.min(rig.back - .14, Math.max(bounds.back, s.z + 1));
      if (left !== bounds.left || right !== bounds.right || back !== bounds.back) changed = true;
      Object.assign(bounds, {left, right, back});
    }
    if (changed) Object.assign(fence, {
      left: Math.max(rig.left, Math.min(fence.left, bounds.left - STAND_OFF)),
      right: Math.min(rig.right, Math.max(fence.right, bounds.right + STAND_OFF)),
      back: Math.min(rig.back, Math.max(fence.back, bounds.back + STAND_OFF))
    });
    return changed;
  }
  function inGap(e, along) {
    return !!e?.open && Math.abs(along - e.center) <= e.half;
  }
  // Skyline of a side at one position along it, in metres above the ground.
  function crest(e, along) {
    if (!e) return 0;
    if (e.open) {
      const d = Math.abs(along - e.center);
      if (d <= e.half - .22) return 0;
      if (d <= e.half) return 3.15; // Marker posts either side of the way through
    }
    const s = e.seed, h = e.height;
    switch (e.style) {
      case 'cliff':
        return h + .62 * Math.sin(along * .9 + s) + .34 * Math.sin(along * 2.3 + s * 2) + .14 * Math.sin(along * 7.1 + s);
      case 'thicket':
        return h + .3 * Math.abs(Math.sin(along * 2.7 + s)) + .2 * Math.abs(Math.sin(along * 6.1 + s * 3)) + .08 * Math.abs(Math.sin(along * 15 + s));
      case 'reeds': {
        const stem = along * 5.3 + s;
        return h + .42 * Math.abs(Math.sin(stem)) * Math.abs(Math.sin(stem * .37 + 1)) + .16 * Math.sin(along * .8 + s);
      }
      case 'wall':
        return h + (((along + s) % 1.1 + 1.1) % 1.1 < .55 ? .3 : 0);
      case 'dune':
        return h + .28 * Math.sin(along * .7 + s) + .12 * Math.sin(along * 1.9 + s * 2);
      case 'bank':
        return h + .05 * Math.sin(along * 3.1 + s);
      case 'reef':
        return h + .46 * Math.abs(Math.sin(along * 1.7 + s)) + .24 * Math.sin(along * 4.3 + s) + .1 * Math.sin(along * 11 + s);
      default:
        return h + .34 * Math.sin(along * 1.3 + s) + .2 * Math.sin(along * 3.7 + s * 2) + .09 * Math.sin(along * 9.1 + s);
    }
  }
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  // Rises into view as Saber walks from the doorway toward an edge, so the
  // disk's drawing stays exact at the illustrator's viewpoint and never pops.
  function plateRise(distance, fromDoorway) {
    return smooth((6 - distance) / 3.6) * smooth(fromDoorway / 2.2);
  }
  // Worn ground from the doorway to each real exit, so the ways out read on the floor.
  function onTrail(fence, x, z) {
    const north = fence.edges.north, south = fence.edges.south, east = fence.edges.east, west = fence.edges.west;
    const hubZ = Math.max(fence.rear, Math.min(fence.back, SIDE_GAP_Z)), meander = .32 * Math.sin(z * .9) + .1 * Math.sin(x * 1.3);
    const lane = (along, half) => Math.abs(along) < half;
    if (north.open && z >= hubZ && lane(x - north.center - meander, TRAIL_HALF)) return true;
    if (south.open && z <= hubZ && lane(x - south.center - meander, TRAIL_HALF)) return true;
    if (east.open && x >= 0 && lane(z - east.center - .3 * Math.sin(x * .9), TRAIL_HALF)) return true;
    if (west.open && x <= 0 && lane(z - west.center - .3 * Math.sin(x * .9), TRAIL_HALF)) return true;
    return false;
  }
  const ROTATION = {north: 0, east: 1, south: 2, west: 3};
  const RELATIVE = [['ahead', '▲'], ['right', '▶'], ['behind', '▼'], ['left', '◀']];
  // The bearings a room offers, ordered and worded from where Saber now faces.
  function ways(exits, yaw) {
    const facing = ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4;
    return ['north', 'east', 'south', 'west'].filter(d => exits?.[d]).map(direction => {
      const turn = (ROTATION[direction] - facing + 4) % 4;
      return {direction, turn, relative: RELATIVE[turn][0], mark: RELATIVE[turn][1]};
    }).sort((a, b) => a.turn - b.turn);
  }
  // Text at an edge. `blocked` lines are the disk's or the engine's own words.
  function note(meta, direction) {
    return String(meta.messages?.[direction] || '').trim() || "You can't go " + direction + '.';
  }
  root.ScepterBoundary = {STYLES, limits, profile, widen, inGap, crest, plateRise, onTrail, ways, note, styleFor};
})();
