/* Local resource reader. Each shelf uses original IDs from the disk indices. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const ES = 'Enchanted Scepters', DC = 'Dark Castle';
  const sections = {
    places: 'Scepters plates', characters: 'Castle reels', screens: 'Castle screens',
    paper: 'Castle papers', sounds: 'Sound shelf', resources: 'Disk ledger'
  };
  const labels = {ASCN: 'Room', AOBJ: 'Object', ACHR: 'Character', PPCT: 'Animation', PSCR: 'Screen', ASND: 'Sound', SOUN: 'Sound', PICT:'Picture', ICON:'Icon', 'ICN#':'Masked icon', FONT:'Bitmap font'};
  const dcat = window.DC_CATALOG, scat = window.ES_CATALOG;
  const shelves = Object.fromEntries(Object.keys(sections).map(key => [key, []]));
  const mediaByKey = new Map();
  const resourceByKey = new Map();
  const keyOf = r => [r.disk, r.file, r.type, r.id].join('|');
  const mark = r => r.type + (r.id === undefined ? '' : ' ' + r.id);
  const callback = (node, action) => node.addEventListener('click', action);
  const path = value => '../' + value.split('/').map(encodeURIComponent).join('/');
  let view, selected, result = [], pageNo = 0, animation = null, audioUrl = null, activeAudio = null;
  const perPage = 40;

  for (const [disk, catalog] of [[ES, scat], [DC, dcat]]) {
    for (const raw of catalog.resources) {
      const r = {...raw, disk, shelf: 'resources', filter: disk, category: 'Resource'};
      r.title = r.name || mark(r);
      resourceByKey.set(keyOf(r), r);
      shelves.resources.push(r);
    }
    for (const raw of catalog.files) {
      const file = raw.path || raw.name;
      shelves.resources.push({...raw, disk, file, title: file.split(':').pop(),
        category: 'Disk file', filter: 'Disk files', shelf: 'resources', wholeFile: true});
    }
  }

  const esFile = scat.resources.find(r => r.type === 'ASCN').file;
  function addMedia(shelf, record) {
    record.shelf = shelf;
    record.category = labels[record.type];
    record.title = record.name || mark(record);
    shelves[shelf].push(record);
    mediaByKey.set(keyOf(record), record);
  }
  for (const plate of window.ES_DESIGNS) {
    addMedia('places', {...plate, disk: ES, file: esFile, filter: labels[plate.type]});
  }
  for (const reel of window.CastleGraphics) {
    let name = null;
    if (reel.type === 'PPCT') {
      if ([430, 431, 432].includes(reel.id)) name = 'Wizard · ' + reel.id;
      if (reel.id === 300 && reel.fork === 'Data B') name = 'Cave bat · 300';
      if ([908, 910, 911, 915].includes(reel.id)) name = 'Black Knight · ' + reel.id;
      if (reel.fork === 'Data A' && reel.id >= 100 && reel.id <= 110) name = 'Duncan · ' + reel.id;
    }
    addMedia(reel.type === 'PPCT' ? 'characters' : 'screens',
      {...reel, disk: DC, file: reel.fork, name, filter: reel.fork});
  }
  for (const page of window.CastlePaper) {
    const names = {10000:'Castle entrance', 16000:'Status strip', 16200:'Great Hall',
      16201:'Trouble',16202:'Fireball',16203:'Black Knight',16204:'Shield',
      20000:'Credits',20001:'About Dark Castle · I',20002:'About Dark Castle · II',
      20003:'Playing Dark Castle · I',20004:'Playing Dark Castle · II',20005:'Controls and objects'};
    const fontNames = {12:'Chicago 12',393:'Geneva 9',396:'Geneva 12',25737:'Score Font',29452:'DC Dialog Font'};
    const name = page.type === 'PICT' ? names[page.id] : page.type === 'FONT' ? fontNames[page.id] : null;
    addMedia('paper', {...page, disk:DC,file:page.fork,filter:labels[page.type],name});
  }
  for (const record of window.ES_SOUNDS) {
    addMedia('sounds', {...record, disk: ES, file: esFile, type: 'ASND', filter: ES});
  }
  for (const raw of dcat.resources) {
    if (raw.type === 'SOUN' && raw.samples > 0) {
      addMedia('sounds', {...raw, disk: DC, frames: raw.samples, rate: 11025, filter: DC});
    }
  }
  const compareTitle = (a,b) => a.title.localeCompare(b.title, 'en', {numeric:true});
  shelves.places.sort((a,b) => {
    const order = ['ASCN','AOBJ','ACHR'];
    return order.indexOf(a.type) - order.indexOf(b.type) || compareTitle(a,b);
  });
  shelves.sounds.sort((a,b) => a.disk.localeCompare(b.disk) || compareTitle(a,b));

  function useFor(r) {
    if (r.disk === ES && r.id === 7990 && r.type === 'ASCN') return 'Original High Altar room plate and doorway composition in the first-person game.';
    if (r.disk === ES && r.id === 21149 && r.type === 'ASCN') return 'Opening quarters in the original adventure.';
    if (r.disk === DC && r.type === 'PPCT' && [430,431,432].includes(r.id)) return 'Animation source for the wizard encounter at the High Altar.';
    if (r.disk === DC && r.type === 'PPCT' && r.id === 300) return 'Flying bat in the large cave, cavern and cave entrance.';
    if (r.disk === DC && r.type === 'PPCT' && r.id === 908) return 'The armory visitor and the original Enchanted Scepters Black Knight use this tankard animation.';
    if (r.disk === DC && r.type === 'PPCT' && [912,915].includes(r.id)) return 'The Enchanted Scepters Black Knight uses this reel for a combat reaction. The gesture is cast for this edition.';
    if (r.disk === DC && r.type === 'PICT' && r.id === 20002) return 'Original instruction card connecting the wizard to fireballs and a reported elixir.';
    if (r.disk === DC && r.type === 'SOUN') {
      if (!r.samples) return 'Empty SOUN header retained in the disk image.';
      const uses = {0: 'Inhabitant footfall and Black Knight’s shield strike', 1: 'Positional voice at the High Altar',
        69: 'Answering knock at the armory doorway', 70: 'Hidden positional cue at the High Altar and the cave bat’s call',
        84: 'Player footfall'};
      return uses[r.id] ? uses[r.id] + '. Also playable at the listening stone.' : 'Playable at the High Altar listening stone and in the sound shelf.';
    }
    if (r.disk === ES && r.type === 'ASCN') return 'Walkable first-person scene. Its matching ATXT and ACOD resources supply description and behavior.';
    if (r.disk === ES && r.type === 'ACHR') return 'Original character and script target. World state controls the encounter and inventory.';
    if (r.disk === ES && r.type === 'AOBJ') return 'Original game object. Its owner and scene are updated by the game engine.';
    if (r.disk === ES && r.type === 'ASND') return 'Room ambience or a scripted sound event where named by the original disk. Also playable at the listening stone.';
    if (r.disk === ES && r.shelf !== 'resources') return 'Indexed by the original world resource ID and available here.';
    if (r.shelf !== 'resources') return 'Preserved in this collection for inspection.';
    return r.destination || r.disposition || 'Retained in the source image.';
  }

  function term(label, value, code = false) {
    if (value === undefined || value === null || value === '') return;
    const detail = el('dd', undefined, code ? 'code' : '');
    if (value instanceof Node) detail.append(value);
    else detail.textContent = value;
    get('info').append(el('dt', label), detail);
  }

  function drawWave(peaks) {
    const c = el('canvas'); c.width = 480; c.height = 108;
    c.setAttribute('aria-label', 'Amplitude envelope of this recording');
    const g = c.getContext('2d');
    g.fillStyle = '#eeeade'; g.fillRect(0,0,c.width,c.height);
    g.fillStyle = '#cbc7b8'; g.fillRect(0,53,c.width,1);
    g.fillStyle = '#282821';
    peaks.forEach((v,i) => { const h = Math.max(1, Math.round(v / 128 * 48)); g.fillRect(i*3,54-h,2,2*h); });
    return c;
  }

  function audioRecord(r) {
    let peaks;
    const audio = el('audio');
    audio.controls = true; audio.preload = 'metadata'; audio.volume = 0.72;
    audio.setAttribute('aria-label', 'Play ' + r.title);
    if (r.disk === DC) {
      const pcm = Uint8Array.from(atob(window.DarkCastlePCM[r.id]), c => c.charCodeAt(0));
      const header = new ArrayBuffer(44), dv = new DataView(header);
      const tag = (offset, value) => [...value].forEach((c,i) => dv.setUint8(offset+i,c.charCodeAt(0)));
      tag(0,'RIFF'); dv.setUint32(4,36+pcm.length,true); tag(8,'WAVE');
      tag(12,'fmt '); dv.setUint32(16,16,true); dv.setUint16(20,1,true);
      dv.setUint16(22,1,true); dv.setUint32(24,r.rate,true); dv.setUint32(28,r.rate,true);
      dv.setUint16(32,1,true); dv.setUint16(34,8,true); tag(36,'data');
      dv.setUint32(40,pcm.length,true);
      audioUrl = URL.createObjectURL(new Blob([header,pcm], {type:'audio/wav'}));
      audio.src = audioUrl;
      peaks = Array.from({length:160}, (_,i) => {
        let peak = 0;
        for (let j = Math.floor(pcm.length*i/160); j < Math.floor(pcm.length*(i+1)/160); j++) peak = Math.max(peak,Math.abs(pcm[j]-128));
        return peak;
      });
    } else {
      audio.src = path(r.path);
      peaks = window.ESCabinetPeaks[r.id];
    }
    get('stage').append(drawWave(peaks));
    get('transport').append(audio);
    activeAudio = audio;
  }

  function graphicRecord(r) {
    const img = new Image();
    img.alt = r.title + ', ' + r.category.toLowerCase() + ' from ' + r.disk;
    if ((r.frames || 1) === 1) {
      img.src = path(r.path);
      if (r.disk === DC && r.width < 150) img.style.width = r.width * 3 + 'px';
      get('stage').append(img);
      return;
    }
    const c = el('canvas'); c.width = r.width; c.height = r.height;
    c.setAttribute('aria-label', img.alt);
    c.style.width = Math.max(r.width,Math.min(r.width*4,370)) + 'px';
    const g = c.getContext('2d');
    const control = el('div',undefined,'transport'), toggle = el('button'), step = el('button','Next frame'), counter = el('span');
    let frame = 0, running = false;
    const paint = () => {
      g.clearRect(0,0,c.width,c.height);
      g.drawImage(img,frame*r.width,0,r.width,r.height,0,0,r.width,r.height);
      counter.textContent = 'Frame ' + (frame+1) + ' / ' + r.frames;
    };
    const advance = () => { frame = (frame+1)%r.frames; paint(); };
    const play = yes => {
      clearInterval(animation); running = yes; toggle.textContent = yes ? 'Pause reel' : 'Play reel';
      if (yes) animation = setInterval(advance,180);
    };
    callback(toggle, () => play(!running));
    callback(step, () => { play(false); advance(); });
    toggle.disabled = step.disabled = true;
    img.onload = () => {
      if (selected !== r || !c.isConnected) return;
      paint(); toggle.disabled = step.disabled = false;
      play(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    };
    img.src = path(r.path);
    control.append(toggle,step,counter); get('stage').append(c); get('transport').append(control);
  }

  function show(r) {
    selected = r;
    clearInterval(animation);
    if (activeAudio) { activeAudio.pause(); activeAudio = null; }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    for (const id of ['stage','transport','info']) get(id).replaceChildren();
    for (const option of get('records').children) {
      if (r && option.dataset.key === keyOf(r)) option.setAttribute('aria-current','true');
      else option.removeAttribute('aria-current');
    }
    get('eyebrow').textContent = r ? r.disk + '  /  ' + r.category : '';
    get('title').textContent = r ? r.title : 'No matching record';
    if (!r) return;
    const raw = resourceByKey.get(keyOf(r)) || r;
    const media = mediaByKey.get(keyOf(r));
    if (media) {
      if (media.shelf === 'sounds') audioRecord(media);
      else if (r === media) graphicRecord(media);
      else {
        const link = el('a','Inspect this ' + media.category.toLowerCase() + ' →');
        link.href = '#' + media.shelf + '/' + media.type + '/' + media.id;
        get('stage').append(link);
      }
    } else {
      get('stage').append(el('span',r.wholeFile ? 'FILE' : r.type,'recordMark'));
    }
    term('Source file',r.file);
    term('Record',r.wholeFile ? r.type + ' / ' + r.creator : mark(r),true);
    term('Placement',useFor(media || r));
    if (r.shelf === 'places') {
      term('Room text',r.text);
      term('Coordinates',r.worldX === undefined ? '' : r.worldX + ', ' + r.worldY);
      term('Initial location',r.initialLocation);
      term('Room sound',r.sound);
    }
    if (r.path) term('Local copy',r.path,true);
    if (r.width) term('Frame size',r.width + ' × ' + r.height + ' pixels');
    if (media && media.shelf === 'sounds') term('Recording',media.rate.toLocaleString('en') + ' Hz · mono · ' + (media.frames / media.rate).toFixed(2) + ' s');
    if (r.wholeFile) term('Forks',(r.dataBytes ?? r.data_bytes) + ' data bytes · ' + (r.resourceBytes ?? r.rsrc_bytes) + ' resource bytes');
    if (!r.wholeFile) term('Source size',raw.bytes === undefined ? '' : raw.bytes.toLocaleString('en') + ' bytes');
    term(r.wholeFile ? 'Resource fork SHA-256' : 'Source SHA-256',raw.sha256 || r.rsrc_sha256 || r.resourceSHA256,true);
  }

  function displayList(preferred) {
    const list = get('records');
    list.replaceChildren();
    const rows = result.slice(pageNo*perPage,(pageNo+1)*perPage);
    for (const row of rows) {
      const button = el('button',undefined,'record');
      button.dataset.key = keyOf(row);
      button.append(el('strong',row.title),el('small',row.file.split(':').pop() + '  /  ' + mark(row)));
      callback(button,() => show(row));
      list.append(button);
    }
    if (!rows.length) list.append(el('p','Try a shorter name or clear the filter.','no-results'));
    const pages = Math.ceil(result.length/perPage);
    get('count').textContent = result.length.toLocaleString('en') + ' records';
    get('page').textContent = pages ? 'Page ' + (pageNo+1) + ' of ' + pages : '—';
    get('prev').disabled = !pageNo; get('next').disabled = pageNo+1 >= pages;
    list.scrollTop = 0;
    show(rows.includes(preferred) ? preferred : rows[0]);
    if (preferred) list.querySelector('[aria-current]')?.scrollIntoView({block:'nearest'});
  }

  function refilter(preferred) {
    const words = get('search').value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const filter = get('filter').value;
    result = shelves[view].filter(r => {
      if (filter && r.filter !== filter) return false;
      const match = [r.title,r.disk,r.file,r.type,r.id,r.category].join(' ').toLowerCase();
      return words.every(word => match.includes(word));
    });
    pageNo = preferred && result.includes(preferred) ? Math.floor(result.indexOf(preferred)/perPage) : 0;
    displayList(preferred);
  }

  function openShelf() {
    const [shelf,type,id] = location.hash.slice(1).split('/');
    view = Object.hasOwn(sections,shelf) ? shelf : 'places';
    for (const a of get('shelves').children) {
      if (a.hash === '#' + view) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    }
    get('indexTitle').textContent = sections[view]; get('search').value = '';
    const filter = get('filter'); filter.replaceChildren(new Option('All records',''));
    for (const option of [...new Set(shelves[view].map(r => r.filter))].sort()) filter.add(new Option(option,option));
    let preferred = type ? shelves[view].find(r => r.type === type && r.id === Number(id)) : null;
    if (!preferred && view === 'places') preferred = shelves.places.find(r => r.type === 'ASCN' && r.id === 7990);
    if (!preferred && view === 'characters') preferred = shelves.characters.find(r => r.id === 430);
    if (!preferred && view === 'paper') preferred = shelves.paper.find(r => r.type === 'PICT' && r.id === 20002);
    refilter(preferred);
  }
  for (const [id,title] of Object.entries(sections)) {
    const a = el('a',title); a.href = '#' + id;
    get('shelves').append(a);
  }
  get('search').addEventListener('input', () => refilter());
  get('filter').addEventListener('change', () => refilter());
  callback(get('prev'), () => { pageNo--; displayList(); });
  callback(get('next'), () => { pageNo++; displayList(); });
  window.addEventListener('hashchange',openShelf);
  if (window.parent !== window) callback(get('back'), e => {
    e.preventDefault(); window.parent.postMessage({type:'close-catalog'}, location.origin === 'null' ? '*' : location.origin);
  });
  else if (window.opener) callback(get('back'), e => {
    e.preventDefault();
    window.opener.focus();
    window.close();
  });
  openShelf();
})();
