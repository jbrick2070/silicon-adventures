// Replays the exact-input tier of each hint milestone through the real engine (private JVM home, test port).
// Usage: node archive/es/replay_hints.js [firstMilestone] [lastMilestone]
// Combat is random: a lethal fight stops the run; rerun from a later start is not possible without a save, so retry.
const { spawn } = require('node:child_process'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm'), net = require('node:net');
const ROOT = path.resolve(__dirname, '..', '..');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'game/hints.js'), 'utf8'), ctx);
const { milestones, current } = ctx.window.ScepterHints;
const [from, to] = [Number(process.argv[2] || 0), Number(process.argv[3] || milestones.length - 1)];
const free = () => new Promise(r => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
(async () => {
  const port = await free(), home = fs.mkdtempSync(path.join(os.tmpdir(), 'hintreplay-'));
  const jv = spawn(path.join(ROOT, 'engine/runtime/bin/java.exe'), [`-Duser.home=${home}`, '-jar', 'engine/adventure.jar', '--test', String(port)], { cwd: ROOT, windowsHide: true, stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}/api/`;
  const api = async (a, arg = '') => (await fetch(base + a, { method: 'POST', headers: { 'X-Scepters': '1' }, body: arg })).json();
  for (let i = 0; i < 100; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await new Promise(r => setTimeout(r, 200)); } }
  const visited = new Set();
  let code = 0;
  try {
    let st = await api('start', 'new'); visited.add(st.scene);
    const sceneId = s => s.scene;
    for (const t of ['south', 'south']) { await api('turn', t); } // the quarters lead to the Throne Room; tier 3 starts there
    const snap = async () => { const s = await api('state'); visited.add(sceneId(s)); return s; };
    for (let m = 0; m <= to; m++) {
      const inputs = milestones[m].tiers[2];
      if (!Array.isArray(inputs)) { console.log(m, 'no exact inputs'); continue; }
      if (m < from) { console.log(m, 'skip'); }
      const log = [];
      for (const t of inputs) { const r = await api('turn', t); if (r.ended || r.scene === 0) { console.log(`DIED at milestone ${m} on '${t}' (random combat) - rerun`); code = 2; throw new Error('died'); }
        if (process.env.PROBE) console.log(t, JSON.stringify({c: r.characters, m: r.menu && r.menu.slice(0, 60), w: r.weapons, k: Object.keys(r).join()}));
        log.push(`${t} -> ${r.name}: ${String(r.output || '').trim().split(/\r?\n/).pop().slice(0, 90)}`); await snap(); }
      if (process.env.VERBOSE) console.log(log.join('\n'));
      const s = await snap(), h = current(s, id => visited.has(id));
      const ok = h.index > m;
      console.log(String(m).padStart(2), milestones[m].title.padEnd(28), ok ? 'OK ' : 'FAIL', '-> now:', milestones[h.index]?.title, '| scene', sceneId(s), '| key', h.key);
      if (!ok) { code = 1; console.log(log.join('\n')); console.log('  inventory:', (s.inventory || []).map(o => o.name).join(', ')); break; }
    }
  } catch (e) { if (code !== 2) throw e; } finally { jv.kill(); }
  setTimeout(() => process.exit(code), 300);
})();
