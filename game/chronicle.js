/* The Chronicle: every line on the disks, the side quests and the oddities.
   Text lives in archive/es/chronicle.js and is never altered: disk spellings and
   dialogue stand exactly as written. This module only records what a player has
   met, using the engine's own output, so it can never spend a game turn.

   Deeds and oddities are defined by the disk lines that prove them. A test checks
   that every proof is a real line. Titles and clues here are new to this edition. */
(() => {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const data = root.ES_CHRONICLE || {lines: [], verbs: {}};
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const lines = data.lines, keys = lines.map(l => norm(l.t));
  const byText = new Map(keys.map((k, i) => [k, i]));

  // Scene ids where a line alone cannot tell which deed was done: on the disk the
  // catapult's grenade branch prints the ram's line.
  const CATAPULT = 23064, RAM = 23935, PRISON = 9232;
  const DEEDS = [
    {id: 'catapult', group: 'The war', title: 'Destroy the catapult', scene: CATAPULT, clue: 'Something that explodes on impact would stop it firing on the castle.',
      proof: ['The catapult is blown to pieces!', 'The ram is blown to pieces!']},
    {id: 'ram', group: 'The war', title: 'Destroy the battering ram', scene: RAM, clue: 'The Hurks mean to roll it to the castle gates.',
      proof: ['The ram is blown to pieces!']},
    {id: 'cannon', group: 'The war', title: 'Send the Hurk cannon into the ravine', clue: 'A heavy gun beside a drop only needs a shove.',
      proof: ['The cannon tumbles into the ravine!']},
    {id: 'lastwords', group: 'The war', title: 'Hear the last words of the king’s guard', clue: 'Search among the fallen.',
      proof: ['Saber, you must disable that catapult or there is no hope...']},
    {id: 'plans', group: 'The war', title: 'Find the Hurks’ secret plans', clue: 'Generals leave paper behind.',
      proof: ['You find some secret plans which say: Tomorrow we will roll the battering ram to the castle gates!']},
    {id: 'prisoner', group: 'The war', title: 'Answer the prisoner’s plea', scene: PRISON, clue: 'Someone in the cells begs to be set free. A key ring opens the bars.',
      proof: ["Captain: Aha! I've got you now!"]},
    {id: 'mirror', group: 'Trials', title: 'Break the mirror', clue: 'The knight in the glass and the glass are one.',
      proof: ['The Black Knight shatters into a thousand pieces!']},
    {id: 'arena', group: 'Trials', title: 'Survive the arena', clue: 'Something horrible stalks in. Win, and the watchers lose their nerve.',
      proof: ['The cavemen scatter in fear!']},
    {id: 'pot', group: 'Trials', title: 'Escape the cooking pot', clue: 'The natives fear real power, and a lucky run sometimes works.',
      proof: ['The natives are stunned! They fall back into the woods!', 'You manage to escape!']},
    {id: 'bribe', group: 'Trials', title: 'End a fight with an offer', clue: 'Some enemies can be bought. OFFER them something valuable.',
      proof: ['Alchemist: Hmmm. Not bad.', 'Black Knight: Now begone from here.', 'The Troll looks satisfied with the deal.',
        'The skeleton shambles into darkness.', 'The cave man looks greedy.', 'The priest is weary of battle.', 'The doctor pauses to consider.']},
    {id: 'orb', group: 'Riddles', title: 'Catch the orb before it falls', clue: 'The orb shatters if nothing soft lies beneath it.',
      proof: ['The orb says: The answer to the riddle is above a pot of gold.']},
    {id: 'whisper', group: 'Riddles', title: 'Sit on Neptune’s throne', clue: 'A throne is for sitting.',
      proof: ['The ocean seems to whisper: The dreamer dies between three prongs.']},
    {id: 'cabin', group: 'Riddles', title: 'Read the carving in the wreck', clue: 'Search the galleon’s cabin.',
      proof: ['Someone has carved "every oyster loves a pearl" on the cabin wall.']},
    {id: 'atlantis', group: 'Riddles', title: 'Hear the bartender’s old story', clue: 'Ask about what you seek.',
      proof: ["Now I remember! Grandpa used ta tell stories about water people...the Atlanteans."]},
    {id: 'history', group: 'Riddles', title: 'Read the history of the Elven caves', clue: 'Inscriptions cover the gate.',
      proof: ['Long ago the Elves built a great palace here.']},
    {id: 'strongbox', group: 'Hidden gifts', title: 'Open the strongbox', clue: 'Look behind the art. A picked lock needs the right tool.',
      proof: ['You pick the lock, the box opens!']},
    {id: 'lockpick', group: 'Hidden gifts', title: 'Find the lock pick', clue: 'Look under a bed.',
      proof: ['You find a lock pick under the bed.']},
    {id: 'osiris', group: 'Hidden gifts', title: 'Return the eye of Osiris', clue: 'The statue has lost a diamond. Taking one is unwise. Giving one back is not.',
      proof: ['Osiris: This ancient scroll contains a powerful spell to aid your quest!']},
    {id: 'curse', group: 'Hidden gifts', title: 'Earn the curse of ancient kings', clue: 'Grave robbers are remembered.',
      proof: ['Osiris:  The curse of ancient kings falls heavy on thy head, grave robber.']},
    {id: 'powder', group: 'Hidden gifts', title: 'Eat the white powder', clue: 'A basin holds what the fingers cannot.',
      proof: ['You feel different...']},
    {id: 'berries', group: 'Hidden gifts', title: 'Try the urns in the magic hut', clue: 'Red berries and green powder.',
      proof: ['Your feet feel light... like you could run faster!', 'Your strength feels... different.']},
    {id: 'helmet', group: 'Hidden gifts', title: 'Find the armory’s spare helmet', clue: 'Search where weapons are kept.',
      proof: ['You find a helmet.']},
    {id: 'crossbow', group: 'Hidden gifts', title: 'Find the crossbow', clue: 'Search off the beaten path.',
      proof: ['You find a crossbow.']},
    {id: 'speargun', group: 'Hidden gifts', title: 'Find the old spear gun', clue: 'Search among the seaweed.',
      proof: ['You find an old spear gun.']},
    {id: 'blowgun', group: 'Hidden gifts', title: 'Find the blowgun', clue: 'Search near a jungle hut.',
      proof: ['You find a blowgun.']}
  ];
  // Jokes, references and odd corners of the disk. `where` is the only clue given.
  const ODDITIES = [
    {where: 'the meager room', line: "Aren't you glad your name isn't Indiana Cousteau?"},
    {where: 'the meager room', line: "You don't find any software."},
    {where: 'the mud', line: "Skull: Leave me alone I'm trying to get a suntan."},
    {where: 'the Wizard’s Sanctum', line: "Skull: You already have a skull, although it's a little small..."},
    {where: 'the Wizard’s Sanctum', line: 'Skull: Read the book dummy!'},
    {where: 'the Wizard’s Sanctum', line: 'Skull: Look, pinhead, swing the sword to make Elron appear.'},
    {where: 'the Wizard’s Sanctum', line: "Skull: You don't want to make Elron mad do you?"},
    {where: 'the bar', line: 'This adventure is rated PG.'},
    {where: 'the bar', line: 'Bartender: Welp, time for muh nap. Make yourself at home.'},
    {where: 'the vines', line: 'Tarzan would be proud.'},
    {where: 'the castle doors', line: "A mouse can't open these doors!"},
    {where: 'a battle with the Black Knight', line: 'Black Knight: Only a flesh wound!'},
    {where: 'the computer', line: 'The chip has the number 68000 on it.'},
    {where: 'the control room', line: 'A small plaque reads: L&K International, Submarine Division'},
    {where: 'the grave', line: 'The tombstone says: Here rests a lonely ork.'},
    {where: 'the grave', line: "You've got more important things to do."},
    {where: 'the gambling hall', line: 'The casino is closed.'},
    {where: 'the pool table', line: 'No one wants to play.'},
    {where: 'the altar', line: 'Your knees are dirty.'},
    {where: 'the forest clearing', line: 'You scare some squirrels.'},
    {where: 'the mountain spring', line: 'You scare a songbird.'},
    {where: 'the mountain spring', line: 'A little birdy says: Religious places are for saying your prayers.'},
    {where: 'a Hurk gun', line: 'Not at your own castle!'},
    {where: 'the Elven throne', line: 'The throne spins around!'},
    {where: 'the troll’s lair', line: "The bone is covered with rotting slime. You don't want it."},
    {where: 'the map room', line: 'The map is painted on the wall!'},
    {where: 'the store room', line: 'It will not fit.'},
    {where: 'the pot', line: 'A few natives are cleaning knives and forks in the river.'},
    {where: 'a certain sad corner of the sea', line: "A loudspeaker says: Let's face it. Your diving suit is gone. You can't fix the sub. You will be here forever."},
    {where: 'the very end', line: 'Try your luck with the next World Builder adventure, coming soon from Silicon Beach Software!'}
  ];
  // Findings from reading the Dark Castle disk itself. These are facts, not progress.
  const CASTLE_NOTES = [
    'The shipped high scores are the makers\u2019 own: Eric 26,135, Eric 8,900, Eric 8,710, Eric 8,620, Jon 6,930 and Jon 60. They open the Scores of Merit in The Enchanted Castle.',
    'Graffiti on the wall of the wizard\u2019s room reads ALARIC WAS HERE, HUNS RULE and VANDALS SUCK. It is in the drawing, room 2030.',
    'On December 25 the Great Hall swaps a suit of armor for a decorated tree. The Enchanted Castle honours the date too.',
    'Data A carries a version note: Show Demo Version 3x3, 10/24/86.',
    'The default keys are W S A D, Space, Q and E, recorded in the KDEF resource of Castle Preferences. Dark Castle shipped with WASD in 1986.',
    'Castle Preferences holds a recorded demo named Default, DEMO resource 8127.',
    'Sorry, Dark Castle cannot run because a Macintosh XL does not have the necessary hardware.',
    'The code compares the 16 bytes DEADFACEBEEFCAFE with memory at address $F80030, then acts on the result. Why it looks there is not proven.',
    'The code builds file paths on a disk called Dark Castle 2. That looks like the name of a second floppy, not a hint of a sequel, though this is not proven.'
  ];
  const KIND_NAMES = {room: 'Rooms', edge: 'Edges of the world', speech: 'Spoken', event: 'Events', voice: 'Voices in battle',
    thing: 'Things', shell: 'The application', castle: 'Dark Castle application'};

  let seen = new Uint8Array(lines.length), deeds = new Uint8Array(DEEDS.length);
  const STORE = 'scepters-chronicle';
  const pack = () => {
    const bits = new Uint8Array(Math.ceil(seen.length / 8) + Math.ceil(deeds.length / 8));
    const offset = Math.ceil(seen.length / 8);
    seen.forEach((v, i) => { if (v) bits[i >> 3] |= 1 << (i & 7); });
    deeds.forEach((v, i) => { if (v) bits[offset + (i >> 3)] |= 1 << (i & 7); });
    return btoa(String.fromCharCode(...bits));
  };
  function merge(text) {
    if (typeof text !== 'string' || !text) return;
    try {
      const raw = atob(text), offset = Math.ceil(seen.length / 8);
      if (raw.length !== offset + Math.ceil(deeds.length / 8)) return; // An older or damaged note.
      for (let i = 0; i < seen.length && (i >> 3) < raw.length; i++) if (raw.charCodeAt(i >> 3) & (1 << (i & 7))) seen[i] = 1;
      for (let i = 0; i < deeds.length && offset + (i >> 3) < raw.length; i++) if (raw.charCodeAt(offset + (i >> 3)) & (1 << (i & 7))) deeds[i] = 1;
    } catch { /* A damaged note must never stop a game loading. */ }
  }
  function store() { try { localStorage.setItem(STORE, pack()); } catch { /* Storage may be blocked. */ } }
  function load() { try { merge(localStorage.getItem(STORE)); } catch { /* Storage may be blocked. */ } }
  function reset() { seen = new Uint8Array(lines.length); deeds = new Uint8Array(DEEDS.length); }

  // Records the lines in one turn's text. Returns what is newly complete, for the journal.
  function note(output, sceneId, roomText) {
    const text = norm(output) + ' ' + norm(roomText || ''), fresh = {deeds: [], oddities: []};
    if (text.length < 2) return fresh;
    let changed = false;
    for (let i = 0; i < keys.length; i++) {
      if (!seen[i] && keys[i] && text.includes(keys[i])) {
        seen[i] = 1; changed = true;
        const odd = ODDITIES.find(o => norm(o.line) === keys[i]);
        if (odd) fresh.oddities.push(odd);
      }
    }
    DEEDS.forEach((deed, i) => {
      if (deeds[i] || (deed.scene && deed.scene !== sceneId)) return;
      if (deed.proof.some(p => text.includes(norm(p)))) { deeds[i] = 1; changed = true; fresh.deeds.push(deed); }
    });
    if (changed) store();
    return fresh;
  }
  const lineSeen = text => { const i = byText.get(norm(text)); return i !== undefined && !!seen[i]; };
  const deedDone = deed => !!deeds[DEEDS.indexOf(deed)];
  const counts = () => {
    const out = {all: lines.length, read: 0, kinds: {}};
    lines.forEach((l, i) => {
      const k = out.kinds[l.k] ||= {all: 0, read: 0};
      k.all++;
      if (seen[i]) { k.read++; out.read++; }
    });
    out.deeds = deeds.reduce((a, b) => a + b, 0);
    out.oddities = ODDITIES.filter(o => lineSeen(o.line)).length;
    return out;
  };
  // Words a room's script listens for that its buttons do not offer. One at a time, on
  // request. A riddle's answer and the castle password stay the player's to find.
  const WITHHELD = new Set(['RAINBOW', 'SABER']);
  const verbsFor = sceneId => (data.verbs[sceneId] || []).filter(v => !WITHHELD.has(v));
  const defeatOf = id => (data.defeats || {})[id] || null;

  /* Archive folio panels */
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function chroniclePanel(stage) {
    const c = counts(), head = el('p', 'folio-caption', c.read + ' of ' + c.all + ' lines from the disks met so far.');
    const bar = el('div', 'folio-controls');
    const kind = el('select');
    kind.setAttribute('aria-label', 'Kind of text');
    kind.add(new Option('Everything', ''));
    for (const [k, name] of Object.entries(KIND_NAMES)) {
      const n = c.kinds[k] || {all: 0, read: 0};
      kind.add(new Option(name + ' · ' + n.read + ' / ' + n.all, k));
    }
    const find = el('input');
    find.type = 'search'; find.placeholder = 'Find a word'; find.setAttribute('aria-label', 'Find a word');
    const showAll = el('input'); showAll.type = 'checkbox'; showAll.id = 'chronicleAll';
    const allLabel = el('label', 'chronicle-all', ' Show every line, spoilers included');
    allLabel.prepend(showAll);
    bar.append(kind, find, allLabel);
    const list = el('ol', 'chronicle-list');
    const more = el('button', 'mini', 'Show more'); more.type = 'button';
    let limit = 120;
    function paint() {
      const word = norm(find.value).toLowerCase();
      const rows = [];
      lines.forEach((l, i) => {
        if (kind.value && l.k !== kind.value) return;
        const open = seen[i] || showAll.checked;
        if (word && !(open && (l.t.toLowerCase().includes(word) || l.o.join(' ').toLowerCase().includes(word)))) return;
        rows.push([l, open, i]);
      });
      list.replaceChildren(...rows.slice(0, limit).map(([l, open]) => {
        const row = el('li', open ? '' : 'chronicle-hidden');
        row.append(el('span', 'chronicle-owner', l.o.slice(0, 2).join(', ') || KIND_NAMES[l.k]),
          el('span', 'chronicle-text', open ? l.t : '· · ·'));
        if (open && l.n) row.append(el('span', 'chronicle-note', l.n));
        return row;
      }));
      more.hidden = rows.length <= limit;
    }
    more.addEventListener('click', () => { limit += 160; paint(); });
    for (const control of [kind, find, showAll]) control.addEventListener('input', () => { limit = 120; paint(); });
    paint();
    stage.replaceChildren(head, bar, list, more);
  }
  function deedsPanel(stage) {
    const c = counts(), frag = [el('p', 'folio-caption', c.deeds + ' of ' + DEEDS.length + ' side quests done. Clues are this edition’s. The lines beneath them are the disk’s.')];
    for (const group of [...new Set(DEEDS.map(d => d.group))]) {
      frag.push(el('h3', 'chronicle-group', group));
      const list = el('ul', 'deed-list');
      for (const deed of DEEDS.filter(d => d.group === group)) {
        const done = deedDone(deed), row = el('li', done ? 'deed-done' : '');
        row.append(el('span', 'deed-mark', done ? '◆' : '◇'), el('span', 'deed-title', deed.title));
        row.append(el('span', 'deed-note', done ? (deed.proof.find(lineSeen) || deed.proof[0]) : deed.clue));
        list.append(row);
      }
      frag.push(list);
    }
    stage.replaceChildren(...frag);
  }
  function odditiesPanel(stage) {
    const c = counts(), list = el('ul', 'deed-list');
    for (const odd of ODDITIES) {
      const done = lineSeen(odd.line), row = el('li', done ? 'deed-done' : '');
      row.append(el('span', 'deed-mark', done ? '◆' : '◇'),
        el('span', 'deed-note', done ? odd.line : 'Something odd waits at ' + odd.where + '.'));
      list.append(row);
    }
    const notes = el('ul', 'deed-list');
    for (const note of CASTLE_NOTES) {
      const row = el('li'), mark = el('span', 'deed-mark', '\u2726');
      if (note.includes('Macintosh XL')) {
        const icon = new Image(); icon.src = 'archive/dc/paper/Data-A-ICON-2010.png'; icon.alt = ''; icon.className = 'deed-icon';
        mark.replaceChildren(icon);
      }
      row.append(mark, el('span', 'deed-note', note));
      notes.append(row);
    }
    stage.replaceChildren(el('p', 'folio-caption', c.oddities + ' of ' + ODDITIES.length + ' jokes and odd corners found.'), list,
      el('h3', 'chronicle-group', 'From the Dark Castle disk'), notes);
  }
  function castPanel(stage) {
    const designs = (root.ES_DESIGNS || []).filter(d => d.type === 'ACHR').sort((a, b) => a.name.localeCompare(b.name));
    const grid = el('div', 'cast-grid'), detail = el('div', 'cast-detail');
    const buttons = designs.map(d => {
      const b = el('button', 'cast-card'); b.type = 'button';
      const known = lines.some((l, i) => seen[i] && l.k === 'voice' && l.o.includes(d.name));
      const img = new Image(); img.src = d.path; img.alt = '';
      b.append(img, el('span', '', known || d.name === 'Saber' ? d.name : 'Not yet met'));
      b.addEventListener('click', () => {
        for (const other of buttons) other.setAttribute('aria-pressed', String(other === b));
        const rows = lines.map((l, i) => [l, i]).filter(([l]) => l.k === 'voice' && l.o.includes(d.name));
        detail.replaceChildren(el('strong', '', known || d.name === 'Saber' ? d.name : 'Not yet met'),
          ...rows.map(([l, i]) => el('p', 'cast-line', seen[i] ? l.t : '· · ·')));
        if (!rows.length) detail.append(el('p', 'cast-line', 'This one has no lines of its own on the disk.'));
      });
      return b;
    });
    grid.append(...buttons);
    stage.replaceChildren(el('p', 'folio-caption', 'Every inhabitant of the Enchanted Scepters disk, ' + designs.length + ' in all. The Dark Castle cast is under Bestiary.'), detail, grid);
    buttons[0]?.click();
  }
  root.SiliconChronicle = {DEEDS, ODDITIES, CASTLE_NOTES, lines, note, pack, merge, load, reset, lineSeen, deedDone, counts, verbsFor, defeatOf,
    panels: {chronicle: chroniclePanel, deeds: deedsPanel, oddities: odditiesPanel, cast: castPanel}};
})();
