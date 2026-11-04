(() => {
  'use strict';

  // Verbatim 1986 Macintosh WAGE item clickMessages from archive/es/Scepters.rsrc (AOBJ resources).
  const ITEM_NOTES = {
    1143: 'This bomb will explode on impact.',
    1420: 'The sword sparkles in the dim light.',
    1548: 'This is basically a big piece of wood.',
    1855: 'This spell heals damage.',
    3818: 'This helmet is a little too big.',
    5907: 'A nice jeweled handle.',
    6436: 'The machine gun has a full clip.',
    8826: 'This spell freezes your enemy.',
    9925: 'The jewels glisten and sparkle!',
    10521: 'This sword is rather heavy.',
    11133: 'The diamond sparkles!',
    11828: 'The power meter is high.',
    12669: 'The spear gun has a few spears left.',
    12897: 'The helmet is light but sturdy.',
    12960: 'The scyth is razor sharp.',
    13010: 'The chip has the number 68000 on it.',
    13029: 'The orb is rather heavy.',
    13044: 'This spell produces a bolt of fire.',
    13057: 'The crossbow has a full quiver.',
    14499: 'This grenade will explode on impact.',
    15391: 'The shield looks a little worn.',
    16582: 'The egg has a leathery shell.',
    17298: 'Shadows dance about the room.',
    18172: 'The lion is very heavy.',
    18456: 'This spell casts a magical fireball.',
    19486: 'This amulet protects you from magic.',
    19491: 'The pearl glows in the soft light.',
    21386: 'This spell heals damage.',
    21538: 'This axe has seen some use.',
    23374: 'There is some oil in the can.',
    23530: 'The pistol has a full clip.',
    23636: 'This spell causes spiritual damage.',
    24181: 'This vest is somewhat bullet-proof.',
    24183: 'Looks like about 20 feet of rope.',
    24885: 'The blade is covered with blood.',
    25069: 'The gun has a few darts.',
    25961: 'The trident seems to be very ancient.',
    28118: 'The vest is somewhat rusted.',
    30636: 'The spell can be used forty times.'
  };

  const SCEPTER_IDS = new Set([608, 23213, 19566, 4500]);

  const ICONS = {
    manualSave: 'archive/dc/paper/Data-A-ICON-2000.png',
    checkpointSave: 'archive/dc/paper/Dark-Castle-ICNN-129.png',
    sadCastle: 'archive/dc/paper/Data-A-ICON-2020.png',
    keycaps: [
      { path: 'archive/dc/paper/Data-A-ICON-700.png', label: 'Left keycap (ICON 700)' },
      { path: 'archive/dc/paper/Data-A-ICON-701.png', label: 'Right keycap (ICON 701)' },
      { path: 'archive/dc/paper/Data-A-ICON-702.png', label: 'Up / jump keycap (ICON 702)' },
      { path: 'archive/dc/paper/Data-A-ICON-703.png', label: 'Down / crouch keycap (ICON 703)' },
      { path: 'archive/dc/paper/Data-A-ICON-704.png', label: 'Action keycap (ICON 704)' },
      { path: 'archive/dc/paper/Data-A-ICON-705.png', label: 'Arm angle keycap (ICON 705)' },
      { path: 'archive/dc/paper/Data-A-ICON-706.png', label: 'Throw keycap (ICON 706)' }
    ]
  };

  const MANUAL_PAGES = [
    { id: 20000, title: 'Credits', path: 'archive/dc/paper/Data-A-PICT-20000.png', note: 'Data A · PICT 20000 — Original Silicon Beach Software credits card.' },
    { id: 20001, title: 'About Dark Castle I', path: 'archive/dc/paper/Data-A-PICT-20001.png', note: 'Data A · PICT 20001 — Story & object of Dark Castle.' },
    { id: 20002, title: 'About Dark Castle II', path: 'archive/dc/paper/Data-A-PICT-20002.png', note: 'Data A · PICT 20002 — Hall of doors, shield, and trouble stages.' },
    { id: 20003, title: 'Playing Dark Castle I', path: 'archive/dc/paper/Data-A-PICT-20003.png', note: 'Data A · PICT 20003 — Movement, stairs, ropes, and pitfalls.' },
    { id: 20004, title: 'Playing Dark Castle II', path: 'archive/dc/paper/Data-A-PICT-20004.png', note: 'Data A · PICT 20004 — Aiming, throwing rocks, and elixirs.' }
  ];

  const BESTIARY = [
    { name: 'Bat', points: '30 pts', ppct: 300, activeFrames: 6, fps: 8, cue: 'dc:70', silent: 'High leathery wing-chirp (SOUN 70).' },
    { name: 'Vulture', points: '30 pts', ppct: 701, activeFrames: 20, fps: 7, cue: 'dc:32', silent: 'Harsh circling screech (SOUN 32).' },
    { name: 'Rat', points: '20 pts', ppct: 310, activeFrames: 4, fps: 8, cue: 'dc:66', silent: 'Sharp stone-floor squeak (SOUN 66).' },
    { name: 'Mutant', points: '30 pts', ppct: 434, activeFrames: 5, fps: 5, cue: 'dc:5', silent: 'Low dungeon grunt (SOUN 5).' },
    { name: 'Burning Eye', points: '30 pts', ppct: 425, activeFrames: 13, fps: 7, cue: 'dc:64', silent: 'Crackling arcane hover (SOUN 64).' },
    { name: 'Magic Broom', points: '30 pts', ppct: 422, activeFrames: 7, fps: 7, cue: 'dc:60', silent: 'Brisk sweeping whisk (SOUN 60).' },
    { name: 'Guard', points: '50 pts', ppct: 350, activeFrames: 2, fps: 4, cue: 'dc:88', silent: 'Measured patrol call (SOUN 88).' },
    { name: 'Rock Henchman', points: '100 pts', ppct: 703, activeFrames: 4, fps: 4, cue: 'dc:91', silent: 'Heavy boulder heave (SOUN 91).' },
    { name: 'Whip Henchman', points: '150 pts', ppct: 405, activeFrames: 5, fps: 6, cue: 'dc:73', silent: 'Sharp leather whip crack (SOUN 73).' },
    { name: 'Dragon', points: '150 pts', ppct: 710, activeFrames: 3, fps: 5, cue: 'dc:95', silent: 'Cavernous flame roar (SOUN 95).' },
    { name: 'Gargoyle', points: '100 pts', ppct: 906, activeFrames: 3, fps: 5, cue: 'dc:46', silent: 'Stone wing swoop (SOUN 46).' },
    { name: 'Black Knight', points: '5000 pts', ppct: 913, activeFrames: 4, fps: 4, cue: 'dc:0', silent: 'Iron gauntlet challenge (SOUN 0).' }
  ];

  const VERS_CREDITS = [
    'Enchanted Scepters™',
    'programmed by William C. Appleton',
    'RealSound™ programmed by Eric Zocher',
    'Artwork by William C. Appleton and Martin E. Funderlic',
    'Game design by William C. Appleton, Martin E. Funderlic, Charlie Jackson'
  ];

  const imageCache = new Map();
  function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load ' + src));
      img.src = src;
    });
    imageCache.set(src, p);
    return p;
  }

  function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  function itemNote(item) {
    if (!item) return { text: '', fromDisk: false };
    if (ITEM_NOTES[item.id]) return { text: ITEM_NOTES[item.id], fromDisk: true };
    if (SCEPTER_IDS.has(item.id)) return { text: 'One of the four Enchanted Scepters of Callion. Return all four to Elron.', fromDisk: false };
    return { text: 'Carried in Saber’s pack. The 1986 disk records no separate click note for this item.', fromDisk: false };
  }

  function contextAction(item, sceneId) {
    if (!item) return null;
    if (item.verb) {
      const cmd = item.verb + ' ' + item.name;
      return [cap(cmd), cmd];
    }
    if (item.id === 6496) return ['Play flute', 'play flute'];
    if (item.id === 17963) return ['Wave wand', 'wave wand'];
    if (item.id === 13010 && sceneId === 9709) return ['Insert chip', 'insert chip'];
    if (item.id === 23374 && sceneId === 9514) return ['Oil airlock', 'oil airlock'];
    if (item.id === 19491 && sceneId === 29361) return ['Give pearl', 'give pearl'];
    if (item.id === 24183 && sceneId === 3099) return ['Tie rope', 'tie rope'];
    if (item.id === 19657 || item.id === 4091 || /lock\s*pick/i.test(item.name || '')) return ['Open', 'open'];
    return null;
  }

  function el(tag, cls = '', text = '') {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function btn(label, onClick, cls = 'mini') {
    const b = el('button', cls, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function keycapStrip() {
    const wrap = el('div', 'keycap-strip');
    wrap.setAttribute('aria-label', 'Original 1986 Dark Castle Macintosh keycap icons');
    const tag = el('span', 'keycap-tag', '1986 Data A · ICON 700–706');
    const row = el('div', 'keycap-row');
    for (const k of ICONS.keycaps) {
      const img = new Image();
      img.src = k.path;
      img.width = 24;
      img.height = 24;
      img.alt = k.label;
      img.title = k.label;
      row.append(img);
    }
    wrap.append(tag, row);
    return wrap;
  }

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  let stopActiveLoop = null;
  function clearLoop() {
    if (stopActiveLoop) {
      stopActiveLoop();
      stopActiveLoop = null;
    }
  }

  function open({ openDialog, onCue, onStopCue, dialogEl, initialTab = 'manual' }) {
    clearLoop();
    const root = el('div', 'folio');
    const nav = el('div', 'folio-tabs');
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', '1986 Macintosh disk archive');
    const stage = el('div', 'folio-panel');
    let paintGeneration = 0;
    const canPaint = generation => generation === paintGeneration && root.isConnected && (!dialogEl || dialogEl.open);
    const invalidate = () => { paintGeneration++; clearLoop(); };

    const tabs = [
      ['manual', 'Manual cards'],
      ['bestiary', 'Bestiary'],
      ['hall', 'Great Hall'],
      ['notes', 'Scepters notes']
    ];
    const tabButtons = new Map();

    function renderManual() {
      let page = 0;
      const bar = el('div', 'folio-controls');
      const prev = btn('← Previous', () => { page = (page - 1 + MANUAL_PAGES.length) % MANUAL_PAGES.length; sync(); });
      const indicator = el('span', 'folio-meta');
      const next = btn('Next →', () => { page = (page + 1) % MANUAL_PAGES.length; sync(); });
      bar.append(prev, indicator, next);

      const frame = el('div', 'folio-sheet');
      const img = new Image();
      img.className = 'folio-pict';
      frame.append(img);
      const caption = el('p', 'folio-caption');

      function sync() {
        const entry = MANUAL_PAGES[page];
        indicator.textContent = (page + 1) + ' / ' + MANUAL_PAGES.length + ' · ' + entry.title;
        img.src = entry.path;
        img.alt = entry.title + ' — ' + entry.note;
        caption.textContent = entry.note;
      }
      sync();
      stage.replaceChildren(bar, frame, caption);
    }

    function renderBestiary() {
      let selected = BESTIARY[0];
      const grid = el('div', 'bestiary-grid');
      const specBox = el('div', 'bestiary-specimen');
      const canvas = el('canvas', 'specimen-canvas');
      canvas.width = 160;
      canvas.height = 132;
      canvas.setAttribute('role', 'img');
      const info = el('div', 'specimen-info');
      const titleEl = el('strong', 'specimen-title');
      const metaEl = el('span', 'folio-meta');
      const soundEl = el('p', 'specimen-sound');
      soundEl.setAttribute('role', 'status');
      const replayBtn = btn('Hear call again', () => triggerSpecimen(selected, true));
      info.append(titleEl, metaEl, soundEl, replayBtn);
      specBox.append(canvas, info);

      const sheetWrap = el('details', 'bestiary-card-sheet');
      const sum = el('summary', '', 'Original score sheet · Data A · PICT 20005');
      const sheetImg = new Image();
      sheetImg.className = 'folio-pict';
      sheetImg.src = 'archive/dc/paper/Data-A-PICT-20005.png';
      sheetImg.alt = 'Original Dark Castle Points / Cast of Characters card (Data A PICT 20005)';
      sheetWrap.append(sum, sheetImg);

      const buttons = new Map();
      function triggerSpecimen(entry, playAudio) {
        clearLoop();
        selected = entry;
        for (const [e, b] of buttons) b.setAttribute('aria-pressed', String(e === entry));
        const reel = (window.CastleGraphics || []).find(a => a.type === 'PPCT' && a.fork === 'Data B' && a.id === entry.ppct);
        titleEl.textContent = entry.name + ' · ' + entry.points;
        metaEl.textContent = 'Data B · PPCT ' + entry.ppct + (reel ? ' (' + reel.width + '×' + reel.height + ', ' + reel.frames + 'f)' : '');
        soundEl.textContent = entry.silent;
        canvas.setAttribute('aria-label', entry.name + ' sprite from Dark Castle Data B PPCT ' + entry.ppct);
        if (playAudio && onCue) onCue(entry.cue);

        if (!reel) return;
        let cancelled = false;
        let rafId = 0;
        stopActiveLoop = () => {
          cancelled = true;
          if (rafId) cancelAnimationFrame(rafId);
        };
        loadImage(reel.path).then(sprite => {
          if (cancelled) return;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          const scale = reel.width > 64 ? 2 : 2;
          canvas.width = Math.max(128, reel.width * scale + 16);
          canvas.height = Math.max(96, reel.height * scale + 16);
          ctx.imageSmoothingEnabled = false;
          const totalFrames = Math.max(1, Math.min(entry.activeFrames || reel.frames, reel.frames));
          const drawFrame = f => {
            ctx.fillStyle = '#f4f2e9';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const dx = Math.floor((canvas.width - reel.width * scale) / 2);
            const dy = Math.floor((canvas.height - reel.height * scale) / 2);
            const sx = sprite.naturalWidth > reel.width ? f * reel.width : 0;
            const sy = sprite.naturalWidth > reel.width ? 0 : f * reel.height;
            ctx.drawImage(sprite, sx, sy, reel.width, reel.height, dx, dy, reel.width * scale, reel.height * scale);
          };
          drawFrame(0);
          if (reducedMotion() || totalFrames <= 1) return;
          const start = performance.now();
          const tick = now => {
            if (cancelled || (dialogEl && !dialogEl.open)) return;
            const f = Math.floor(((now - start) / 1000) * entry.fps) % totalFrames;
            drawFrame(f);
            rafId = requestAnimationFrame(tick);
          };
          rafId = requestAnimationFrame(tick);
        }).catch(() => {});
      }

      for (const entry of BESTIARY) {
        const b = btn(entry.name + ' · ' + entry.points, () => triggerSpecimen(entry, true));
        b.setAttribute('aria-pressed', 'false');
        buttons.set(entry, b);
        grid.append(b);
      }

      stage.replaceChildren(specBox, grid, sheetWrap);
      triggerSpecimen(BESTIARY[0], false);
    }

    function renderGreatHall() {
      const now = new Date();
      let holiday = now.getMonth() === 11 && now.getDate() === 25;
      const bar = el('div', 'folio-controls');
      const toggleBtn = btn('', () => { holiday = !holiday; paint(); });
      toggleBtn.setAttribute('aria-pressed', String(holiday));
      const organBtn = btn('Sound the pipe organ (SOUN 94)', () => {
        if (onCue) onCue('dc:94');
        status.textContent = 'Pipe organ fanfare · Dark Castle SOUN 94.';
      });
      bar.append(toggleBtn, organBtn);

      const frame = el('div', 'folio-sheet');
      const canvas = el('canvas', 'folio-canvas');
      canvas.width = 512;
      canvas.height = 342;
      canvas.setAttribute('role', 'img');
      frame.append(canvas);

      const status = el('p', 'folio-caption');
      status.setAttribute('role', 'status');

      const numerals = el('div', 'gothic-numerals');
      numerals.append(el('span', 'folio-meta', 'Difficulty numerals (PICT 16100–16103):'));
      for (const id of [16100, 16101, 16102, 16103]) {
        const n = new Image();
        n.src = 'archive/dc/paper/Data-A-PICT-' + id + '.png';
        n.alt = 'Gothic numeral ' + (id - 16099);
        numerals.append(n);
      }

      function paint() {
        const generation = ++paintGeneration;
        toggleBtn.textContent = holiday ? 'Restore Great Hall armor' : 'December 25, 1986 · Holiday tree';
        toggleBtn.setAttribute('aria-pressed', String(holiday));
        canvas.setAttribute('aria-label', holiday
          ? 'Dark Castle Great Hall (PICT 10000) with Christmas tree overlay (PICT 10004) on the right pedestal'
          : 'Dark Castle Great Hall (PICT 10000) with the suit of armor on the right pedestal');
        status.textContent = holiday
          ? 'Data A · PICT 10000 + PICT 10004 at (347, 82) — On December 25, Dark Castle replaced the right-hand suit of armor with a decorated tree.'
          : 'Data A · PICT 10000 — The Great Hall of Doors before choosing a trouble stage.';
        Promise.all([
          loadImage('archive/dc/paper/Data-A-PICT-10000.png'),
          holiday ? loadImage('archive/dc/paper/Data-A-PICT-10004.png') : Promise.resolve(null)
        ]).then(([hall, tree]) => {
          if (!canPaint(generation)) return;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, 512, 342);
          ctx.drawImage(hall, 0, 0);
          if (tree) ctx.drawImage(tree, 347, 82);
        }).catch(() => {});
      }

      paint();
      stage.replaceChildren(bar, frame, status, numerals);
    }

    function renderNotes() {
      let showCutSky = false;
      const creditsBox = el('div', 'vers-credits');
      creditsBox.append(el('p', 'eyebrow', 'SCEPTERS.RSRC · VERS 0 (VERBATIM)'));
      for (const lineText of VERS_CREDITS) {
        creditsBox.append(el('p', 'vers-line', lineText));
      }

      const bar = el('div', 'folio-controls');
      const skyBtn = btn('', () => { showCutSky = !showCutSky; paintNest(); });
      bar.append(skyBtn);

      const frame = el('div', 'folio-sheet');
      const canvas = el('canvas', 'folio-canvas folio-canvas-es');
      canvas.width = 338;
      canvas.height = 314;
      canvas.setAttribute('role', 'img');
      frame.append(canvas);

      const note = el('p', 'folio-caption');
      function paintNest() {
        const generation = ++paintGeneration;
        skyBtn.textContent = showCutSky ? 'Show shipped nest plate (ASCN 24035)' : 'Overlay stored night sky (AOBJ 29156 · nest.dk)';
        skyBtn.setAttribute('aria-pressed', String(showCutSky));
        canvas.setAttribute('aria-label', showCutSky
          ? 'Roc nest (ASCN 24035) overlaid with stored night sky prop nest.dk (AOBJ 29156)'
          : 'Shipped Roc nest plate (ASCN 24035)');
        note.textContent = showCutSky
          ? 'ASCN 24035 + AOBJ 29156 (nest.dk at x = −3, y = −7) — Night-sky drawing preserved in STORAGE@, shown here at its recorded offset as an optional comparison.'
          : 'ASCN 24035 (nest) — Shipped daytime plate. Toggle nest.dk above to inspect the night-sky drawing preserved in STORAGE@.';
        Promise.all([
          loadImage('archive/es/plates/ASCN-24035.png'),
          showCutSky ? loadImage('archive/es/plates/AOBJ-29156.png') : Promise.resolve(null)
        ]).then(([nest, sky]) => {
          if (!canPaint(generation)) return;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 338, 314);
          ctx.drawImage(nest, 0, 0);
          if (sky) ctx.drawImage(sky, -3, -7);
        }).catch(() => {});
      }

      paintNest();
      stage.replaceChildren(creditsBox, bar, frame, note);
    }

    function selectTab(id, focus = false) {
      invalidate();
      if(onStopCue)onStopCue();
      for (const [k, b] of tabButtons) {
        const on = k === id;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus({ preventScroll: true });
      }
      if (id === 'manual') renderManual();
      else if (id === 'bestiary') renderBestiary();
      else if (id === 'hall') renderGreatHall();
      else renderNotes();
    }

    for (const [id, label] of tabs) {
      const b = btn(label, () => selectTab(id), 'folio-tab');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      tabButtons.set(id, b);
      nav.append(b);
    }

    nav.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      const order = tabs.map(t => t[0]);
      const cur = order.findIndex(k => tabButtons.get(k).getAttribute('aria-selected') === 'true');
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? order.length - 1 : (cur + (e.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length;
      selectTab(order[next], true);
    });

    root.append(nav, stage);
    if (dialogEl) {
      dialogEl.addEventListener('close', invalidate, { once: true });
    }
    selectTab(initialTab);
    openDialog('Archive folio · 1986 disks', root);
  }

  window.SiliconFolio = {
    ITEM_NOTES,
    ICONS,
    itemNote,
    contextAction,
    keycapStrip,
    open,
    clearLoop
  };
})();
