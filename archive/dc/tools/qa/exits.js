const { readFileSync } = require('node:fs'); const path = require('node:path'); const vm = require('node:vm');
const root = 'D:/silicon-adventures', c = {}; c.window = c; vm.createContext(c);
for (const f of ['archive/dc/castle-data.js', 'game/castle-plan.js', 'game/castle-core.js']) vm.runInContext(readFileSync(path.join(root, f), 'utf8'), c);
const core = new c.CastleCore({data: c.CASTLE_DATA, plan: c.CastlePlan, ward: true});
const order = c.CASTLE_DATA.order; console.log('order', JSON.stringify(order));
for (const id of order) {
  core.powers = new Set(); core.enter(id, 0); const r = core.room, out = new Map();
  const kinds = new Map();
  for (const f of r.floors) for (const s of f.segments) for (const p of s.spans) {
    if (p.a !== undefined && p.a !== 0 || p.b) kinds.set(p.kind, (kinds.get(p.kind) || 0) + 1);
    if (p.a === -1 || (p.a >= 0 && p.a < order.length && p.kind !== undefined && String(p.kind) === String(core.constructor.EXIT))) out.set(p.a, p.b);
  }
  console.log(id, 'keys', Object.keys(r).filter(k => !['floors'].includes(k)).join(','), 'kinds', JSON.stringify([...kinds]));
  const all = [];
  for (const f of r.floors) for (const s of f.segments) for (const p of s.spans) if (p.a === -1 || p.a > 0 && p.a < 14) all.push(`k${p.kind}:${p.a === -1 ? 'HALL' : order[p.a]}/${p.b}`);
  console.log('   ', [...new Set(all)].join(' '));
}
