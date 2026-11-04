/* Physics reachability for The Enchanted Castle. For each room it starts from an
   entry a player can really arrive by and tries every move they have, with the real
   game rules and the creatures removed: walks, three kinds of jump, stairs,
   ladders, ropes, swinging ropes and moving platforms. It reports which exits and
   which scepter it reached.

     node game/tests/castle_reach.js [room ...] [--modern]

   Classic controls by default, so a pass proves the rooms on the disk's physics alone.
*/
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..');
function boot() {
  const context = {};
  context.window = context;
  vm.createContext(context);
  for (const file of ['archive/dc/castle-data.js', 'game/castle-plan.js', 'game/castle-core.js'])
    vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context);
  return context;
}

let built = null;
const MODERN = process.argv.includes('--modern');
const WAITS = [0, 25, 50, 75, 100, 125, 150, 175];
function explore(context, id, variant) {
  const make = ticks => {
    const core = new context.CastleCore({data: context.CASTLE_DATA, plan: context.CastlePlan, ward: true, rooms: built, modern: MODERN});
    built = core.rooms;
    core.say = () => {}; core.tell = () => {}; core.enter(id, variant);
    core.entities = core.entities.filter(e => e.type === 'swingRope' || e.type === 'platform');
    for (let t = 0; t < 200 && core.hero.ladder?.auto; t++) core.tick({}); // A joining ladder carries Duncan in.
    for (let t = 0; t < (ticks || 0); t++) for (const e of core.entities) if (e.type === 'platform') core.run_platform(e);
    return core;
  };
  const movers = make().room.movers.length > 0;
  const key = hero => hero.floor ? 'f' + hero.floor.y + ':' + (hero.floor.moving ? 'm' + hero.floor.spans[0].x0 : hero.floor.x0) : hero.rope ? 'r' + hero.rope.x0 + ':' + Math.round(hero.y / 24) : hero.swing ? 's' + hero.swing.x : '';
  const seen = new Map(), reached = new Map(), queue = [], spots = [];
  const place = state => {
    const core = make(state.time), hero = core.hero;
    Object.assign(hero, {x: state.x, y: state.y, vx: 0, vy: 0, state: 'stand', floor: null, rope: null, swing: null, ladder: null, stairs: null, safe: 0, face: state.face || 1});
    if (state.rope) { hero.state = 'rope'; hero.rope = core.room.ropes[state.rope - 1]; }
    else if (state.swing !== undefined) {
      const e = core.entities[state.swing]; e.phase = state.phase; hero.state = 'swing'; hero.swing = e;
    } else {
      hero.floor = state.mover !== undefined ? core.room.movers[state.mover].seg : core.floorAt(state.x, state.y) || core.floorAt(state.x, state.y, true);
      if (state.mover !== undefined) hero.x = hero.floor.x0 + 8;
    }
    return core;
  };
  const push = (core, how, time) => {
    const hero = core.hero, k = key(hero);
    if (!k || seen.has(k)) return;
    seen.set(k, how);
    spots.push({x: hero.x, y: hero.y, seg: hero.floor && {x0: hero.floor.x0, x1: hero.floor.x1, y: hero.floor.y}});
    if (hero.floor?.moving) queue.push({x: hero.x, y: hero.y, mover: core.room.movers.findIndex(m => m.seg === hero.floor), time});
    else if (hero.floor) queue.push({x: hero.x, y: hero.y, time});
    else if (hero.rope) queue.push({x: hero.x, y: hero.y, rope: core.room.ropes.indexOf(hero.rope) + 1, time});
    else if (hero.swing) queue.push({x: hero.x, y: hero.y, swing: core.entities.indexOf(hero.swing), phase: hero.swing.phase, time});
  };
  push(make(), 'start', 0);
  const run = (state, script, how) => {
    const core = place(state), start = key(core.hero);
    for (let t = 0; t < 320; t++) {
      core.tick(script(t, core));
      if (core.mode !== 'room' || core.room.id !== id) {
        if (core.mode === 'hall') reached.set('hall', how);
        else if (core.mode === 'room') reached.set(core.room.id, how);
        return;
      }
      const hero = core.hero;
      if (t > 1 && ['stand', 'walk', 'rope', 'swing'].includes(hero.state) && key(hero) !== start) {
        push(core, how, (state.time || 0) + t);
        if (hero.state !== 'walk') return;
      }
    }
  };
  while (queue.length) {
    const state = queue.shift();
    const core = place(state), hero = core.hero, seg = hero.floor, label = key(hero);
    if (seg) {
      const xs = new Set();
      if (seg.moving) xs.add(hero.x);
      else {
        xs.add(seg.x0); xs.add(seg.x1);
        // A jump is a fixed path, so where it starts matters. The disk walks in 8 pixel steps.
        for (let x = seg.x0; x <= seg.x1; x += 8) xs.add(x);
        for (const span of seg.spans) xs.add((span.x0 + span.x1) / 2);
      }
      for (const wait of movers ? WAITS : [0]) {
        for (const x of xs) {
          const here = {...state, x, time: (state.time || 0) + wait};
          for (const side of [-1, 1]) {
            const walk = {left: side < 0, right: side > 0};
            run(here, () => walk, label + ' walk');
            for (const delay of [0, 2, 5]) run(here, t => ({...walk, jump: t === delay}), label + ' run-jump');
          }
          for (const face of [-1, 1]) {
            const facing = {...here, face};
            run(facing, t => ({jump: t === 1}), label + ' standing-jump');
            run(facing, t => ({down: t === 1, jump: t === 1}), label + ' downward-jump');
          }
          run(here, () => ({up: true}), label + ' up');
          run(here, () => ({down: true}), label + ' down');
        }
      }
    } else if (state.rope) {
      const rope = core.room.ropes[state.rope - 1];
      for (let y = rope.top; y <= rope.bottom; y += 12) {
        const here = {...state, y};
        push(place(here), label + ' climb', state.time);
        for (const wait of movers ? WAITS : [0]) for (const side of [-1, 0, 1]) {
          const walk = {left: side < 0, right: side > 0};
          run({...here, time: (state.time || 0) + wait}, t => ({...walk, jump: t === 1}), label + ' rope-jump');
        }
      }
    } else if (state.swing !== undefined) {
      for (let phase = 0; phase < 6.3; phase += .4) for (const side of [-1, 0, 1]) {
        const walk = {left: side < 0, right: side > 0};
        run({...state, phase}, t => ({...walk, jump: t === 1}), label + ' swing-jump');
      }
    }
  }
  return {nodes: seen.size, reached, spots};
}

function make0(context, id) {
  const core = new context.CastleCore({data: context.CASTLE_DATA, plan: context.CastlePlan, rooms: built});
  core.say = () => {}; core.enter(id, 0);
  return core;
}

function arrivals(context) {
  const {rooms, order} = context.CASTLE_DATA, used = new Set(), plan = context.CastlePlan;
  for (const wing of Object.values(plan.WINGS)) used.add(wing.first + ':0');
  for (const id of order) for (const floor of rooms[id].floors) for (const span of floor.spans)
    if (span[3] === 5 && span[4] >= 0) used.add(order[span[4]] + ':' + span[5]);
  return used;
}

function main() {
  const context = boot(), ids = process.argv.slice(2).filter(arg => arg !== '--modern').map(Number), plan = context.CastlePlan;
  const list = ids.length ? ids : context.CASTLE_DATA.order, used = arrivals(context);
  const scepters = Object.fromEntries(Object.values(plan.WINGS).map(w => [w.scepter.room, w.scepter]));
  let missing = 0;
  for (const id of list) {
    for (const variant of [0, 1]) {
      if (!used.has(id + ':' + variant)) continue;
      const {nodes, reached, spots} = explore(context, id, variant);
      let note = '';
      const prize = scepters[id];
      if (prize) {
        const got = spots.some(s => s.seg && prize.x + 30 > s.seg.x0 + 8 && prize.x - 6 < s.seg.x1 + 24 && Math.abs(s.seg.y + 20 - (prize.y + 15)) < 42);
        note = got ? ' scepter ok' : ' SCEPTER UNREACHED';
        if (!got) missing++;
      }
      const pulls = make0(context, id).room.pulls.filter(span => !spots.some(s => s.seg && s.seg.y === span.y && span.x1 >= s.seg.x0 && span.x0 <= s.seg.x1));
      if (pulls.length) { missing++; note += ' CHAINS UNREACHED ' + pulls.map(p => p.x0 + ',' + p.y).join(' '); }
      console.log(id, 'entry', variant, 'nodes', nodes, 'reached', [...reached.keys()].join(','), note);
    }
  }
  process.exitCode = missing ? 1 : 0;
}
if (require.main === module) main();
module.exports = {boot, explore, arrivals};
