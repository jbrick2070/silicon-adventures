(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const view=new PlateView($('world')), sound=new SceneSound();
  const designs=new Map(ES_DESIGNS.map(d=>[d.type+'/'+d.id,d]));
  const keys=new Set(), keyFor=(o,kind)=>kind+'/'+o.id;
  const starts=['art','computer','dogleg','Finale','lava tunnel','main road','mirror room','office',"Queen's Chamber"];
  let state,scene,playing=false,busy=false,muted=false,captions=true,drag=null;
  let shortcut=false,wizardRead=false,prayed=false,npc=null,combatant=null,knightReel=908;
  // A scripted question waiting for its answer, slot ownership for doorway checkpoints, and combat recall.
  let callionSaved=false;
  let pending=null,owner=false,checkpoint=null,checkpointsOn=true,checkpointNoted=false,lastCommand='',lastAttack='',parserHelp=0;
  const history=[];let histAt=0;
  // Click targets: the disk's names are terse (dung.1, stor.2); only stems the room text itself names get a word.
  const STEMS={high:'altar',stor:'chest',can:'cannon',sub:'control',dung:'door',squash:'door',jd:'door',lobb:'door',clos:'closet',airl:'airlock',comp:'computer',hatch:'hatch',shrine:'shrine',spikes:'spikes',web:'web',grate:'grate',floor:'floor',river:'river',nest:'nest',ram:'ram',bar:'bars',sand:'sand',slip:'slip',ball:'ball',queen:'queen',cat:'catapult',view:'view',sep:'sepulchre',osir:'osiris',phoenix:'phoenix',sphinx:'sphinx',top:'top',drink:'drink',lair:'lair',pot:'pot',rob:'robot'};
  function labelFor(key){
    const m=designs.get(key);if(!m)return 'the drawing here';
    if(!/\.[a-z0-9]+$/i.test(m.name))return m.name;
    return STEMS[m.name.replace(/\.[a-z0-9]+$/i,'').toLowerCase()]||'the drawing here';
  }
  // A click is a whole turn on the disk: it takes anything movable, so say so.
  function verbFor(key){
    if(key.startsWith('ACHR/'))return 'Face the '+labelFor(key);
    const o=state.objects.find(x=>x.id===+key.slice(5)),name=labelFor(key);
    return o&&o.type!==9?'Take the '+name:'Click '+name;
  }
  const enemyBase=new Map();
  // Saber's chart: which of the 200 rooms this run has seen, in design order.
  const roomList=ES_DESIGNS.filter(d=>d.type==='ASCN');
  const roomIndex=new Map(roomList.map((d,i)=>[d.id,i]));
  const worldMap=new WorldMap($('map'),roomList);
  let visited=new Uint8Array(roomList.length);
  function packSeen(){let s='';for(let i=0;i<visited.length;i+=8){let b=0;for(let k=0;k<8;k++)if(visited[i+k])b|=1<<k;s+=String.fromCharCode(b);}return btoa(s);}
  function unpackSeen(text){const v=new Uint8Array(roomList.length);try{const s=atob(text);for(let i=0;i<s.length;i++){const b=s.charCodeAt(i);for(let k=0;k<8&&i*8+k<v.length;k++)if(b&(1<<k))v[i*8+k]=1;}}catch{}return v;}
  function drawChart(){
    if(!scene||$('routePanel').hidden)return;
    worldMap.draw(visited,scene.id,view.refreshed&&view.colour);
    const k=Math.max(1,Math.min(2,Math.floor(($('routePanel').clientWidth||400)/worldMap.w)));
    $('map').style.width=(worldMap.w*k)+'px';$('map').style.height=(worldMap.h*k)+'px';
    const n=visited.reduce((a,b)=>a+b,0);$('mapNote').textContent=n+(n===1?' room charted':' rooms charted')+' · ink edges are walls on the map, gaps are openings';
  }
  $('map').onpointermove=e=>{const r=$('map').getBoundingClientRect();const room=worldMap.roomAt((e.clientX-r.left)*worldMap.w/r.width,(e.clientY-r.top)*worldMap.h/r.height);$('map').title=room&&visited[roomIndex.get(room.id)]?title(room.name):'';};
  // Where next? One more tier of the current milestone per press; the tier resets when the goal changes.
  let hintGoal=-1,hintTier=0,hintsUsed=0;
  function whereNext(){
    if(!playing||!state||state.ended||!window.ScepterHints)return;
    const {index,milestone,count}=ScepterHints.current(state,id=>visited[roomIndex.get(id)]);
    if(index<0||!milestone)return;
    if(index!==hintGoal){hintGoal=index;hintTier=0;}
    if(hintTier>=3){line('No more clues for this step: '+milestone.tiers[2].join(' · ')+'.','aside hint');tabs('journal');return;}
    const tier=milestone.tiers[hintTier];hintsUsed++;
    const text=Array.isArray(tier)?'Exactly: '+tier.join(' · ')+'.':tier;
    tabs('journal');line('Step '+(index+1)+' of '+count+' · '+milestone.title+(hintTier?' · clue '+(hintTier+1):'')+'. '+text,'aside hint');
    hintTier++;controls();
  }
  $('hint').onclick=whereNext;
  function rememberSeen(){try{sessionStorage.setItem('scepters-seen',JSON.stringify({session:state?.session,seen:packSeen()}));}catch{}}
  const condition=p=>p<.40?'very bad':p<.55?'bad':p<.70?'average':p<.85?'good':'very good';
  const whom=s=>s==='them'?'them':/^the\b/i.test(s)?s:'the '+s;
  // The last line of a turn that ends in a question mark is a scripted question (the King's
  // "Will you go?", the Guard, the sentry on the main road). Everything but the answer counts as a refusal.
  function detectPending(output){
    if(!output)return null;
    const lines=output.split('\n').map(s=>s.trim()).filter(Boolean),last=lines[lines.length-1]||'';
    if(!last.endsWith('?')||/^(huh|what)\?$/i.test(last))return null;
    const prefixes=[...output.matchAll(/(?:^|\n)([A-Z][A-Za-z' ]{0,24}):\s/g)];
    const who=prefixes.length?prefixes[prefixes.length-1][1]:'';
    const speaker=!who?'them':/calls out/i.test(who)?'the voice':who;
    const body=last.replace(/^[^:?]*:\s*/,'');
    const kind=/\bor\b/i.test(body)?'choice':(/^(do|did|will|would|are|is|can|could|were|have|has|should)\b/i.test(body)||/do you\?$/i.test(body))?'yesno':'free';
    return {speaker,kind};
  }
  let elapsed=0,oldTime=0,stepDistance=0,dirty=true,lastPaint=-1,captionUntil=0,viewScale=1;
  const actorPlace={x:-.94,z:5.14};
  const enhancedName=()=>view.colour?'Lit colour':'Refreshed 1-bit';
  function syncLayerUi(){
    $('pictureMode').value=view.refreshed?(view.colour?'colour':'ink'):'original';
    $('layerBtn').textContent=view.refreshed?'Classic B/W':view.colour?'Back to colour':'Back to 1-bit';
    $('layerBtn').title=(view.refreshed?'Show the original black-and-white disk drawing':'Return to '+enhancedName())+' (L)';
    $('plateMode').textContent=(view.refreshed?enhancedName().toUpperCase():'ORIGINAL · 1-BIT')+
      (viewScale>=1?' · '+viewScale+'×':'');
  }
  function fitViewport(){
    const scr=$('screen'),world=$('world');if(!scr||!world)return;
    const dpr=window.devicePixelRatio||1,availW=scr.clientWidth;
    const availH=window.innerWidth<=610?Math.floor(window.innerHeight*.52):Math.max(314,window.innerHeight-160);
    const k=Math.min(Math.floor(availW*dpr/view.w),Math.floor(availH*dpr/view.h));
    viewScale=k;
    if(k>=1){
      world.style.width=(view.w*k/dpr)+'px';world.style.height=(view.h*k/dpr)+'px';
      world.style.maxHeight='none';world.style.transform='';
      const rect=world.getBoundingClientRect();
      const ox=(Math.round(rect.left*dpr)-rect.left*dpr)/dpr,oy=(Math.round(rect.top*dpr)-rect.top*dpr)/dpr;
      if(Math.abs(ox)>.01||Math.abs(oy)>.01)world.style.transform=`translate(${ox}px,${oy}px)`;
    }else{
      world.style.width='100%';world.style.height='auto';world.style.maxHeight='';world.style.transform='';
    }
    syncLayerUi();
  }
  function toggleLayers(force){
    if($('layerBtn').disabled)return;
    const on=typeof force==='boolean'?force:!view.refreshed;
    if(on!==view.refreshed)view.setRefreshed(on);
    const style=view.colour?'colour':'ink';
    try{localStorage.setItem('scepters-picture-mode',(on?'':'original-')+style);}catch{}
    syncLayerUi();drawChart();dirty=true;
    if(playing&&state&&scene)controls();
    if(playing){message(on?enhancedName():'Original plate');$('world').focus({preventScroll:true});}
    else if(view.source)view.render(elapsed);
  }
  window.addEventListener('resize',fitViewport);
  window.visualViewport?.addEventListener('resize',fitViewport);
  const castleReel=id=>CastleGraphics.find(a=>a.type==='PPCT'&&a.fork==='Data B'&&a.id===id);
  const title=s=>s.replace(/(^|\s)\p{L}/gu,c=>c.toUpperCase());
  function button(label,fn,cls='mini') {
    const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',fn);return b;
  }
  function para(s,cls='') {const p=document.createElement('p');p.textContent=s;p.className=cls;return p;}
  // The journal keeps the whole session like the Macintosh console did (600 paragraphs), and
  // survives a reload within a launch; Save copies it so Restore brings the story back too.
  const journal=[];
  function rememberJournal(){try{sessionStorage.setItem('scepters-journal',JSON.stringify({session:state?.session,journal}));}catch{}}
  function line(s,cls='',remember=true){
    if(!s)return;
    const log=$('log');log.append(para(s.trim(),cls));
    if(remember){journal.push({text:s.trim(),cls});while(journal.length>600)journal.shift();rememberJournal();}
    while(log.children.length>600)log.firstChild.remove();log.scrollTop=log.scrollHeight;
  }
  function replayJournal(entries){
    const log=$('log');log.setAttribute('aria-live','off');log.replaceChildren();journal.length=0;
    for(const e of entries)line(e.text,e.cls,false);
    journal.push(...entries.slice(-600));log.setAttribute('aria-live','polite');rememberJournal();
  }
  function message(s){ $('cue').textContent=s;captionUntil=elapsed+3.3; }
  function openDialog(name,...content){
    keys.clear();sound.pause(true);$('dialogName').textContent=name;
    $('dialogBody').replaceChildren(...content);if(!$('dialog').open)$('dialog').showModal();
  }
  $('closeDialog').onclick=()=>$('dialog').close();
  $('dialog').addEventListener('close',()=>{sound.pause(!playing||document.hidden||$('dialog').open);if(playing)$('world').focus({preventScroll:true});});
  $('dialog').addEventListener('click',e=>{if(e.target===$('dialog'))$('dialog').close();});
  async function api(action,arg=''){
    const r=await fetch('/api/'+action,{method:'POST',headers:{'X-Scepters':'1'},body:arg});
    if(!r.ok)throw new Error(await r.text()||'The adventure could not process that action.');
    return r.json();
  }
  function sourceEvents(next,point,dry=false){
    if(!playing||!next.sounds?.length)return;
    const fallback=point||{x:.35,z:Math.max(1.7,(view.rig?.back??5)-.8)};
    if(scene?.id!==18366){sound.events(next.sounds,fallback,{dry});return;}
    // The Finale names its bearings: earthquakes north, tornadoes east, volcanoes west, the tidal wave
    // south, and Elron's horn from where he stands. Each run of cues plays from that side, in order.
    const p=view.pose,elron=view.sprites.find(s=>s.key==='AOBJ/23092');
    const bearing={boom:{x:p.x,z:p.z+4},fireball:{x:p.x+4,z:p.z},roar:{x:p.x-4,z:p.z},splash:{x:p.x,z:p.z-4},horn:elron?{x:elron.x,z:elron.z}:fallback};
    let run=[];
    const flush=()=>{if(run.length){const k=run[0].toLowerCase();sound.events(run,bearing[k]||fallback);run=[];}};
    for(const name of next.sounds){if(run.length&&run[0].toLowerCase()!==name.toLowerCase())flush();run.push(name);}
    flush();
  }
  async function crossover(){
    npc=null;
    if(scene.id===7990){
      npc=await view.add({path:'art/castle-wizard.png',x:0,y:0,width:48,height:46},'wizard',{
        ...actorPlace,y:1.36,w:.83,h:.80,cols:8,fw:48,fh:46});
    } else if(['large cave','cavern','cave entrance'].includes(scene.name)){
      const bat=CastleGraphics.find(a=>a.type==='PPCT' && a.id===300 && a.fork==='Data B');
      if(bat)npc=await view.add({path:bat.path,x:0,y:0,width:bat.width,height:bat.height},'bat',
        {x:-1.1,z:3.4,y:2,w:.54,h:.45,fw:bat.width,fh:bat.height,cols:bat.frames});
    } else if(scene.name==='armory'&&!combatant){
      const knight=CastleGraphics.find(a=>a.type==='PPCT'&&a.id===908&&a.fork==='Data B');
      if(knight)npc=await view.add({path:knight.path,x:0,y:0,width:knight.width,height:knight.height},'knight',
        {x:.7,z:3,y:0,w:1.22,h:1.65,fw:knight.width,fh:knight.height,cols:knight.frames});
    }
  }
  async function populate(){
    view.sprites=[];combatant=null;
    for(const [group,kind] of [[state.objects,'AOBJ'],[state.characters,'ACHR']]) {
      for(const item of group) {
        const meta=designs.get(keyFor(item,kind));if(!meta||meta.width<2)continue;
        if(kind==='ACHR' && item.name.toLowerCase()==='black knight'){
          const reel=castleReel(knightReel);
          const loc=view.pointFromPlate(meta);
          combatant=await view.add({...meta,path:reel.path},keyFor(item,kind),
            {...loc,w:loc.h*reel.width/reel.height,fw:reel.width,fh:reel.height,cols:reel.frames});
          combatant.until=elapsed+1.5;
          continue;
        }
        const options={};
        if(scene.id===7990&&item.id===14168)Object.assign(options,{x:(meta.x+meta.width/2-169)*4.18/215,z:4.18,y:1.8-(meta.y+meta.height-123)*4.18/215,w:meta.width*4.18/215,h:meta.height*4.18/215});
        await view.add(meta,keyFor(item,kind),options);
      }
    }
    await crossover();dirty=true;
  }
  function tabs(which){
    for(const id of ['journal','pack','route']){
      $(id+'Panel').hidden=id!==which;$(id+'Tab').setAttribute('aria-pressed',String(id===which));
    }
    if(which==='route')drawChart();
  }
  for(const name of ['journal','pack','route'])$(name+'Tab').onclick=()=>tabs(name);
  function controls(){
    $('roomTitle').textContent=state.ended?'Journey’s end':scene.name;
    const held=[608,23213,19566,4500].map(id=>state.inventory.some(o=>o.id===id)?'●':'○').join('');
    $('chapterTag').textContent=state.ended?(callionSaved?'CALLION SAVED':'END OF ADVENTURE'):shortcut?'HIGH ALTAR EXCURSION':'SABER’S JOURNAL · SCEPTERS '+held+(held==='●●●●'?' · TO ELRON':'');
    $('windowName').textContent=title(scene.name);$('plateCode').textContent='ASCN · '+scene.id;
    const share=state.maxHp?state.hp/state.maxHp:1;
    $('health').textContent=state.ended?'':'HP '+state.hp+(state.maxHp?' / '+state.maxHp+' · '+condition(share):'');
    $('health').classList.toggle('danger',!state.ended&&share<.40);
    $('itemCount').textContent=state.inventory.length;
    $('save').disabled=state.ended;$('load').disabled=!state.saved;
    $('hint').disabled=state.ended;$('hint').textContent=hintsUsed?'Where next? · '+hintsUsed:'Where next?';
    // Who stands against Saber, in the engine's own condition words, from each inhabitant's first-seen HP.
    let foe=$('foe');
    if(!foe){foe=para('','subtext');foe.id='foe';$('roomTitle').after(foe);}
    const foes=state.ended?[]:state.characters.map(c=>{
      const k=scene.id+'/'+c.id;if(!enemyBase.has(k))enemyBase.set(k,Math.max(1,c.hp));
      return c.name+' · condition '+condition(c.hp/enemyBase.get(k));
    });
    foe.textContent=foes.join(' · ');foe.hidden=!foes.length;
    $('cmd').placeholder=pending&&!state.ended?'Answer '+whom(pending.speaker)+'…':'Enter a command…';
    $('pack').replaceChildren();
    for(const it of state.inventory) {
      const m=designs.get(keyFor(it,'AOBJ'));
      const b=button(it.name,()=>{tabs('journal');$('cmd').value=(it.verb?it.verb+' ':'drop ')+it.name;$('cmd').focus();},'');
      if(m){
        const img=new Image();
        img.alt='';
        if(view.refreshed&&view.colour){
          img.src=m.path;img.className='colour-icon';
          view.colourIcon(m).then(url=>{if(img.isConnected)img.src=url;}).catch(()=>{});
        }else img.src=(view.refreshed&&window.RefreshBananas?.[m.path])||m.path;
        b.prepend(img);
      }
      $('pack').append(b);
    }
    if(!state.inventory.length)$('pack').append(para('Your pack is empty.','subtext'));
    $('arms').replaceChildren(...state.weapons.map(s=>button(s,()=>command(s))));
    if(state.characters.length&&!state.ended)for(const [i,part] of ['head','chest','side'].entries()){
      $('arms').append(button('Aim '+part,async()=>{if(busy)return;busy=true;try{await api('aim',String(i+1));message('Aiming at '+part);}finally{busy=false;}}));
    }
    $('actions').replaceChildren();
    if(state.ended){
      sound.music.setRoom(null);
      if(state.saved)$('actions').append(button(checkpoint?'Return to '+checkpoint.room+' · HP '+checkpoint.hp:'Return to your last save',()=>begin('restore'),'mini primary-mini'));
      $('actions').append(button('Begin again',()=>begin('new')),button('Adventures…',adventures));
      return;
    }
    $('listening').hidden=true;
    if(pending?.kind==='yesno'){
      // Look, Search, a click or a step all read as refusals here; only the answer is safe.
      $('actions').append(button('Yes',()=>command('yes')),button('No',()=>command('no')));
      $('travel').replaceChildren(...['west','north','east','up','south','down'].map(d=>button(d,()=>command(d),'travel-key')));
      return;
    }
    // The disk's own Commands menu (MENU 2004), in its original order, minus the six directions.
    const menu=state.menu.split(';').filter(a=>a&&!a.startsWith('(')).map(a=>a.split('/')[0].split('<')[0]);
    const directions=['north','south','east','west','up','down'];
    const fighting=state.characters.length>0;
    let verbs=menu.filter(a=>!directions.includes(a.toLowerCase())&&!(fighting&&a.toLowerCase()==='rest'));
    if(!fighting&&state.maxHp&&state.maxHp-state.hp>=8)verbs.splice(verbs.findIndex(v=>v.toLowerCase()==='rest')+1,0,'Rest until healed');
    if(fighting)verbs.push(...state.weapons);
    if(scene.id===7990){
      if(wizardRead)verbs.push('Pray');
      if(state.objects.some(o=>o.id===23213))verbs.push('Get Air Scepter');
      if(state.inventory.some(o=>o.id===23213)&&state.objects.some(o=>o.id===14168))verbs.push('Move altar');
      if(!state.objects.some(o=>o.id===14168))verbs.push('Down');
    }
    if(scene.id===29408)verbs.push('Read book','Swing sword');
    if(scene.name==='bridge room')verbs.push('Turn crank');
    $('actions').append(...[...new Set(verbs)].map(v=>button(v,()=>v==='Rest until healed'?restUntilHealed():command(v))));
    $('travel').replaceChildren(...['west','north','east','up','south','down'].map(d=>{const b=button(d,()=>command(d),'travel-key');b.title=scene.messages?.[d]||'';return b;}));
    // Doorways the renderer draws: the map's open bearings or an exit the room text names.
    const open=['north','east','south','west'].filter(d=>view.exits?.[d]);
    $('routeNote').textContent=open.length?'Doorways · '+open.join(' / '):'Listen for clues in the room description.';
  }
  async function apply(next,opts={}) {
    const changed=next.scene!==state?.scene||opts.fresh;
    const priorKnight=state?.characters.find(c=>c.name==='Black Knight');
    const followingKnight=next.characters.find(c=>c.name==='Black Knight');
    knightReel=!changed&&followingKnight&&priorKnight?(followingKnight.hp<priorKnight.hp?912:next.hp<state.hp?915:908):908;
    const diedIn=scene?.name,priorShare=state?.maxHp?state.hp/state.maxHp:1;
    // Blows land where they land: an inhabitant whose HP fell is struck, Saber's own loss is felt here.
    const struck=new Set((state?.characters||[]).filter(c=>{const n=next.characters.find(x=>x.id===c.id);return n&&n.hp<c.hp;}).map(c=>c.id));
    const selfHurt=!!state&&next.hp<state.hp;
    state=next;
    pending=state.ended?null:detectPending(next.output);
    if(state.ended){
      if(!scene)scene=designs.get('ASCN/7990');
      sourceEvents(next,opts.point);line(next.output);
      if(/saved Callion/i.test(next.output))callionSaved=true;
      else if(diedIn)line('Saber fell in '+diedIn+'.','aside');
      line(state.saved?'Restore returns to '+(checkpoint?checkpoint.room+' with HP '+checkpoint.hp:'your last save')+'.':'This adventure has ended. Begin again or choose a new entry.','aside');
      controls();return;
    }
    if(changed){
      scene=designs.get('ASCN/'+next.scene);
      if(!scene)throw new Error('Missing room plate '+next.scene);
      sound.scene(scene);await view.load(scene);
      if(opts.fresh) {if(!opts.keepJournal){$('log').replaceChildren();journal.length=0;rememberJournal();}wizardRead=false;prayed=false;callionSaved=false;enemyBase.clear();checkpointNoted=false;hintGoal=-1;hintTier=0;hintsUsed=0;if(!opts.keepSeen)visited=new Uint8Array(roomList.length);}
      if(roomIndex.has(scene.id)){visited[roomIndex.get(scene.id)]=1;rememberSeen();drawChart();}
      if(!opts.fresh && playing)line('— '+title(scene.name)+' —','entry');
      if(scene.id!==7990&&shortcut){shortcut=false;line('The High Altar excursion ends here, in the hidden valley. The full adventure continues from this point.','aside');}
      keys.clear();stepDistance=0;tabs('journal');
    }
    if(opts.echo)line('› '+opts.echo,'entry');
    line(next.output || (changed?scene.text:''));
    if(/^(what|huh)\?\s*$/i.test(next.output||'')&&parserHelp<3){
      parserHelp++;
      line('The disk understands its Commands menu (Look, Rest, Status, Inventory, Search, Open, Close), the six directions, GET and DROP, READ, UNLOCK, PUSH, CLIMB, THROW, DRINK, OFFER, WEAR, and a weapon’s own verb. Press ? for the field guide.','aside');
    }
    if(scene.id===7990) {
      if(/murals show/i.test(next.output))wizardRead=true;
      if(/materializes/i.test(next.output)||state.inventory.some(a=>a.id===23213))prayed=true;
    }
    if(scene.name.toLowerCase()==='finale' && /saved Callion/i.test(next.output)) {
      callionSaved=true;
      line('All four scepters have come home.','aside');
    }
    const share=state.maxHp?state.hp/state.maxHp:1;
    if(share<.40&&priorShare>=.40){message('Your physical condition is very bad.');line('Rest where no one is near, or retreat the way you came.','aside');}
    await populate();controls();
    const foe=view.sprites.find(s=>s.key.startsWith('ACHR/')&&struck.has(+s.key.slice(5)))||(struck.size?combatant:null);
    for(const s of view.sprites)if(s.key.startsWith('ACHR/')&&struck.has(+s.key.slice(5)))s.flinchUntil=elapsed+.45;
    if(combatant&&struck.size)combatant.flinchUntil=elapsed+.45;
    sourceEvents(next,opts.point||(foe?{x:foe.x,z:foe.z}:null),selfHurt&&!struck.size);
    $('resume').hidden=!state.saved;
    // Doorway checkpoint: only a run that owns the save slot, only on a real turn, never mid-fight or at the altar.
    if(owner&&checkpointsOn&&opts.echo&&changed&&scene.id!==7990&&!state.characters.length){
      try{
        const result=await api('save',JSON.stringify({...view.pose,scene:scene.id,read:wizardRead,shortcut,auto:true,hp:state.hp,seen:packSeen()}));
        state.saved=result.saved;checkpoint={room:scene.name,hp:state.hp};
        if(!checkpointNoted){checkpointNoted=true;line('Checkpoint at the doorway. Restore returns here; turn this off in the field guide to keep a hand-placed save.','aside');}
        controls();
      }catch{}
    }
  }
  async function command(text,action='turn',point=null,echo=null) {
    if(!playing||busy||state.ended)return;
    let sent=text;
    if(action==='turn'){
      const t=text.trim();
      if(/^(help|hint|\?|commands)$/i.test(t)){fieldGuide();return;}
      if(/^(examine|x|inspect|check)\b/i.test(t))sent='look';
      const useOf=t.match(/^use\s+(.+)$/i);
      if(useOf){const item=state.inventory.find(o=>o.name.toLowerCase()===useOf[1].toLowerCase());if(item?.verb)sent=item.verb+' '+item.name;}
      lastCommand=t;if(history[history.length-1]!==t)history.push(t);if(history.length>50)history.shift();histAt=history.length;
      if(state.weapons.some(w=>w.toLowerCase()===t.toLowerCase()))lastAttack=t;
    }
    busy=true;keys.clear();tabs('journal');
    try {
      const next=await api(action,sent);
      await apply(next,{echo:echo||(action==='turn'?text:verbFor(text)),point});
    } catch(e){line(e.message,'aside');}
    finally {busy=false;dirty=true;}
  }
  // Rest turn after turn while no one is near, until the engine's regen stalls (it floors to 0 within 8 HP of max).
  async function restUntilHealed(){
    if(!playing||busy||state.ended||state.characters.length)return;
    busy=true;keys.clear();tabs('journal');
    const startHp=state.hp;let turns=0,stalled=0,last=null,stop=false;
    const halt=()=>{stop=true;};
    document.addEventListener('keydown',halt);document.addEventListener('pointerdown',halt);
    try{
      while(!stop&&turns<25){
        const next=await api('turn','rest');turns++;
        const gain=next.hp-(last?last.hp:state.hp);last=next;
        $('health').textContent='HP '+next.hp+' / '+next.maxHp+' · '+condition(next.hp/next.maxHp);
        if(next.ended||next.scene!==state.scene||next.characters.length||/no time to rest/i.test(next.output))break;
        stalled=gain<=0?stalled+1:0;
        if(stalled>=2)break;
        await new Promise(r=>setTimeout(r,250));
      }
      if(last){await apply(last,{echo:'rest'});if(!last.ended&&!last.characters.length&&last.hp>=startHp)line('Rested '+turns+(turns===1?' turn':' turns')+' · HP '+startHp+' → '+last.hp,'aside');}
    }catch(e){line(e.message,'aside');}
    finally{document.removeEventListener('keydown',halt);document.removeEventListener('pointerdown',halt);busy=false;dirty=true;}
  }
  async function begin(entry){
    if(busy)return;busy=true;
    if($('dialog').open)$('dialog').close();
    try {
      if(location.protocol==='file:')throw new Error('Double-click Play Enchanted Scepters.exe in the game folder. It starts the local adventure engine and opens your browser.');
      sound.music.setRoom(null);
      await sound.start();sound.mute(muted);
      const next=await api('start',entry);
      playing=true;shortcut=entry==='altar';owner=entry==='new'||entry==='restore';checkpoint=null;lastCommand=lastAttack='';
      sound.pause(document.hidden||$('dialog').open);
      $('cover').hidden=true;$('playing').hidden=false;$('compass').hidden=false;fitViewport();
      let kept=null;
      if(entry==='restore'){try{kept=JSON.parse(localStorage.getItem('scepters-saved-journal')||'null');}catch{}}
      if(Array.isArray(kept)&&kept.length){replayJournal(kept);line('— Restored —','entry');}
      await apply(next,{fresh:true,keepJournal:Array.isArray(kept)&&kept.length>0});sessionStorage.setItem('scepters-session',state.session);
      if(entry==='altar')line('A voice carries from the far side of the stone.','aside');
      if(entry==='restore'&&state.viewData){
        try{const v=JSON.parse(state.viewData);
          if(typeof v.seen==='string'){visited=unpackSeen(v.seen);if(roomIndex.has(scene.id))visited[roomIndex.get(scene.id)]=1;rememberSeen();drawChart();}
          if(v.scene===scene.id && [v.x,v.z,v.yaw,v.pitch].every(Number.isFinite)) {
            Object.assign(view.pose,{x:v.x,z:v.z,yaw:v.yaw,pitch:v.pitch});
            view.syncMode();
            wizardRead=!!v.read;shortcut=!!v.shortcut;
            if(v.auto)checkpoint={room:scene.name,hp:state.hp};
            controls();
          }
        }catch{}
      }
      $('world').focus({preventScroll:true});
    } catch(e){openDialog('Launch the adventure',para(e.message));}
    finally{busy=false;dirty=true;}
  }
  $('enter').onclick=()=>begin('altar');$('journey').onclick=()=>begin('new');$('resume').onclick=()=>begin('restore');
  $('save').onclick=async()=>{
    if(busy||!playing)return;busy=true;
    try{
      const result=await api('save',JSON.stringify({...view.pose,scene:scene.id,read:wizardRead,shortcut,hp:state.hp,seen:packSeen()}));
      state.saved=result.saved;owner=true;checkpoint={room:scene.name,hp:state.hp};controls();line('Adventure saved.','aside');
      try{localStorage.setItem('scepters-saved-journal',JSON.stringify(journal));}catch{}
    }catch(e){line(e.message,'aside');}finally{busy=false;}
  };
  $('load').onclick=()=>openDialog('Restore adventure',para('Resume your last manual save?'),button('Restore saved adventure',()=>begin('restore')),button('Keep playing',()=>$('dialog').close()));
  function adventures(){
    const text=para('Begin in Saber’s quarters, visit the High Altar, or open one of the nine saved adventures found on the disk. Save your current progress first if you want to return.');
    const buttons=[button('Saber’s quarters',()=>begin('new')),button('High Altar excursion',()=>begin('altar'))];
    if(state?.saved)buttons.push(button('Your saved adventure',()=>begin('restore')));
    openDialog('Adventures',text,...buttons,para('Original disk bookmarks','eyebrow'),...starts.map(n=>button(title(n),()=>begin('bookmark/'+n))));
  }
  $('bookmarks').onclick=adventures;
  function soundtrackCredits(){
    const credits=document.createElement('details'),summary=document.createElement('summary');
    credits.className='soundtrack-credits';
    summary.textContent='Soundtrack credits';
    credits.append(summary);
    function region(name,tracks,note){
      const list=document.createElement('ol');
      for(const track of tracks){
        const item=document.createElement('li');
        item.textContent=track.title+' · '+track.credit;
        list.append(item);
      }
      credits.append(para(name,'eyebrow'),list,para(note));
    }
    region('Castle and temple',RegionMusic.stone,'Violet Stone pairs the flute, horn and drum from Enchanted Scepters with a wooden knock from Dark Castle.');
    region('Sea floor and wreck',RegionMusic.water,'Soundings sets metal strikes, drips and bubbles from the Enchanted Scepters disk to a slow six-beat sway.');
    return credits;
  }
  function fieldGuide(){
    const h=document.createElement('h2');h.textContent='Field guide';
    openDialog('Field guide',h,
      para('Turn Music on to hear two tracks alternate in the castle halls and temple, and another pair in the underwater rooms with bubbles. The title appears below the picture. Sound off mutes music and effects.'),
      soundtrackCredits(),
      para('Walk with W A S D or the up and down arrows. Turn with left and right. Drag the drawing to look up, down, and around. On a phone or tablet, hold the Walk, Back and turn buttons under the picture.'),
      para('Click a drawn object or approach it and press E. A click is a turn in the original game: it may take, answer a question or spring a trap, so E offers the edition’s honest prompt (Take, Click, Face, Go). Press / to type. People ask questions; answer YES or NO, or type the word they ask for. Anything else counts as a refusal.'),
      para('The disk’s vocabulary: the Commands menu (Look, Rest, Status, Inventory, Search, Open, Close), the six directions, GET and DROP, READ, UNLOCK, PUSH, CLIMB, THROW, DRINK, OFFER, ACCEPT, WEAR, and each weapon’s own verb. There is no EXAMINE, USE or TALK; this edition sends EXAMINE as Look and USE as the item’s verb. Status and Rest are turns of their own, so use them away from a fight.'),
      para('Lit colour uses the disk’s weapon shapes. Refreshed 1-bit draws the weapons as bananas. Their attacks work the same in every picture mode. Blows are heard where they land, and a struck inhabitant flinches. When someone stands against you, your weapons join the action row. Press R to repeat the last attack and the up arrow in the command line to recall the last command.'),
      para('Choose Lit colour, Refreshed 1-bit or Original in the picture bar. Press L or click Classic B/W to see the disk plate. Press L again or use the same button to return to your chosen style. The ⌖ button returns you to the illustrator’s viewpoint.'),
      para('Save keeps your place between launches. Doorway checkpoints use the same slot as a manual save. Turn them off to keep a hand-placed save.'),
      button(checkpointsOn?'Turn doorway checkpoints off':'Turn doorway checkpoints on',()=>{checkpointsOn=!checkpointsOn;try{localStorage.setItem('scepters-checkpoints',checkpointsOn?'on':'off');}catch{}fieldGuide();}),
      para('The full journey begins in Saber’s quarters. All 200 Macintosh scene scripts run locally. The High Altar excursion starts you inside a later puzzle. The Dark Castle visitors, their placement, and the Where next? clues are new to this edition: each press gives one more clue toward the next scepter, from a nudge to the exact words of a winning run.'),
      button(view.refreshed?'Show Original':'Return to '+enhancedName(),()=>{toggleLayers();fieldGuide();}),
      button(captions?'Hide sound captions':'Show sound captions',()=>{captions=!captions;localStorage.setItem('scepters-captions',captions?'on':'off');fieldGuide();}),
      button('Disk bookmarks',adventures));
  }
  $('guideBtn').onclick=fieldGuide;
  $('layerBtn').onclick=()=>toggleLayers();
  $('pictureMode').onchange=e=>{
    const mode=e.target.value;
    if(mode!=='original')view.setColour(mode==='colour');
    toggleLayers(mode!=='original');
  };
  $('soundBtn').onclick=async()=>{
    muted=!muted;sound.mute(muted);$('soundLabel').textContent=muted?'off':'on';$('soundBtn').setAttribute('aria-pressed',String(!muted));
    if(playing&&!muted)await sound.start();
  };
  function syncMusicButton(){
    const on=sound.music.enabled,track=sound.music.nowPlaying;
    $('musicLabel').textContent=on?'on':'off';
    $('musicBtn').setAttribute('aria-pressed',String(on));
    const label=track?'Now playing · '+track.title:'';
    if($('nowPlaying').textContent!==label)$('nowPlaying').textContent=label;
  }
  sound.music.onChange=syncMusicButton;
  $('musicBtn').onclick=async()=>{
    sound.music.setEnabled(!sound.music.enabled);
    try{localStorage.setItem('scepters-music',sound.music.enabled?'on':'off');}catch{}
    if(playing&&!state?.ended&&!muted&&sound.music.enabled&&!sound.started)await sound.start();
  };
  $('homeView').onclick=()=>{view.reset();dirty=true;if(playing){message('Doorway viewpoint');$('world').focus({preventScroll:true});}else if(view.source)view.render(elapsed);};
  $('commandForm').onsubmit=e=>{e.preventDefault();const t=$('cmd').value.trim();if(!t)return;$('cmd').value='';$('cmd').blur();$('world').focus();command(t);};
  function use(key,fromPointer=false){
    if(!playing||busy||state.ended)return;
    if(key==='answer'){tabs('journal');$('cmd').focus();return;}
    if(key.startsWith('ACHR/')&&!fromPointer){tabs('journal');message('Choose a weapon from the journal');return;}
    if(key==='AOBJ/14168'&&!wizardRead&&!fromPointer){command('read');return;}
    if(pending?.kind==='yesno'&&(key.startsWith('go/')||key.startsWith('AOBJ/')||key.startsWith('ACHR/'))){
      message(whom(pending.speaker).replace(/^the /,'The ')+' is waiting for an answer');tabs('journal');return;
    }
    const p=npc?{x:npc.x,z:npc.z}:{x:0,z:3};
    if(key==='wizard'){
      if(Math.hypot(view.pose.x-p.x,view.pose.z-p.z)>2.15){message('Come closer to the wizard');return;}
      if(prayed && !state.objects.some(o=>o.id===14168)) {
        tabs('journal');$('listening').hidden=false;
        line('The wizard touches the stone. A hundred borrowed voices sleep inside it. Choose one, then turn away and listen.','aside');
        return;
      }
      sound.effect('dc:1',p);line(prayed?'The wizard points down, toward the altar stone.':'The wizard lowers his head and points to the mural.','aside');
      command(prayed?'move altar':'read','turn',p);return;
    }
    if(key==='bat'){sound.effect('dc:70',p);message('The bat wheels away');return;}
    if(key==='knight'){sound.effect('dc:0',p);line('The Black Knight strikes his shield. A second blow answers from the doorway.','aside');sound.effect('dc:69',{x:view.rig.right,z:1});return;}
    if(key==='altar-pray'){command('pray','turn',{x:.2,z:4.42});return;}
    if(key==='altar-down'){command('down');return;}
    if(key.startsWith('go/')){command(key.slice(3));return;}
    if(key==='AOBJ/14168'&&wizardRead){command(prayed?'move altar':'pray','turn',{x:.29,z:4.4});return;}
    const echo=key.startsWith('ACHR/')?'Provoke the '+labelFor(key)+' (the '+labelFor(key)+' acts)':verbFor(key);
    command(key,'click',view.sprites.find(s=>s.key===key),echo);
  }
  for(const record of ES_SOUNDS)$('voice').add(new Option('Scepters · '+record.name,'es/'+record.name));
  for(const id of VaultAudio.archiveIds)$('voice').add(new Option('Dark Castle · SOUN '+id,'dc:'+id));
  $('listen').onclick=()=>{
    const id=$('voice').value,point={x:actorPlace.x,z:actorPlace.z};
    if(id.startsWith('es/'))sound.events([id.slice(3)],point);
    else sound.effect(id,point);
  };
  function actionNear(){
    const p=view.pose;
    if(!view.targets||!view.rig||!state||state.ended)return null;
    if(pending?.kind==='yesno')return ['answer','Answer '+whom(pending.speaker)];
    const near=view.targets.map(t=>({t,d:Math.hypot(t.s.x-p.x,t.s.z-p.z)})).filter(q=>q.d<2.05 && q.t.left+q.t.sw>35 && q.t.left<303)
      .sort((a,b)=>a.d-b.d)[0];
    if(near) {
      const k=near.t.key;
      if(k==='wizard')return [k,prayed&&!state.objects.some(o=>o.id===14168)?'Listen to the stone':'Speak to the wizard'];
      if(k==='knight')return [k,'Listen to the knight'];
      if(k==='bat')return [k,'Listen'];
      if(k==='AOBJ/14168')return [k,wizardRead?(prayed?'Move the altar':'Kneel at the altar'):'Read the murals'];
      return [k,verbFor(k)];
    }
    if(scene.id===7990&&Math.hypot(p.x-.3,p.z-4.42)<1.2) {
      if(!state.objects.some(o=>o.id===14168))return ['altar-down','Descend the passage'];
      if(wizardRead && !prayed)return ['altar-pray','Kneel at the altar'];
    }
    const r=view.rig,bearings=[['north',r.back-p.z,0],['east',r.right-p.x,Math.PI/2],['south',p.z-view.rear,Math.PI],['west',p.x-r.left,-Math.PI/2]];
    for(const [name,d,a]of bearings)if(d<.65&&Math.cos(p.yaw-a)>.35&&view.exits?.[name])return ['go/'+name,'Go '+name];
    return null;
  }
  $('interact').onclick=()=>{const a=actionNear();if(a)use(a[0]);};
  function canvasPoint(e){
    const rect=$('world').getBoundingClientRect(),scale=Math.min(rect.width/view.w,rect.height/view.h);
    return [(e.clientX-rect.left-(rect.width-view.w*scale)/2)/scale,(e.clientY-rect.top-(rect.height-view.h*scale)/2)/scale];
  }
  $('world').onpointerdown=e=>{
    if(!playing){begin('altar');return;}
    drag={x:e.clientX,y:e.clientY,total:0};$('world').setPointerCapture(e.pointerId);
  };
  // Clickable Macintosh objects announce themselves: pointer over a drawn sprite, grab elsewhere.
  function hoverCursor(e){
    const world=$('world');
    if(!playing){world.style.cursor='';return;}
    if(drag){world.style.cursor=drag.total>3?'grabbing':'pointer';return;}
    world.style.cursor=view.hit(...canvasPoint(e))?'pointer':'grab';
  }
  $('world').onpointermove=e=>{
    if(!drag){hoverCursor(e);return;}
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    drag.total+=Math.abs(dx)+Math.abs(dy);
    if(drag.total>3){view.pose.yaw+=dx*.007;view.pose.pitch=Math.max(-135,Math.min(135,view.pose.pitch-dy*.5));dirty=true;}
    drag.x=e.clientX;drag.y=e.clientY;
    hoverCursor(e);
  };
  $('world').onpointerup=e=>{
    if(!drag)return;
    if(drag.total<=4){const t=view.hit(...canvasPoint(e));if(t)use(t.key,true);}
    drag=null;hoverCursor(e);
  };
  $('world').onpointercancel=()=>{drag=null;$('world').style.cursor=playing?'grab':'';};
  $('world').onpointerleave=()=>{if(!drag)$('world').style.cursor='';};
  document.addEventListener('keydown',e=>{
    if($('dialog').open||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.target.tagName==='SELECT')return;
    if(e.target.tagName==='INPUT'){
      if(e.key==='Escape')$('world').focus();
      else if((e.key==='ArrowUp'||e.key==='ArrowDown')&&e.target.id==='cmd'&&history.length){
        e.preventDefault();histAt=Math.max(0,Math.min(history.length,histAt+(e.key==='ArrowUp'?-1:1)));
        e.target.value=history[histAt]||'';
      }
      return;
    }
    const k=e.key.toLowerCase();
    if(k==='l'){e.preventDefault();if(!e.repeat)toggleLayers();return;}
    if(!playing)return;
    if(['w','s','a','d','arrowup','arrowdown','arrowleft','arrowright','e','r','/','i','m','?'].includes(k)){
      e.preventDefault();if(e.repeat)return;
      if(k==='r'){if(lastAttack&&state.characters.length)command(lastAttack);else message(state.characters.length?'Choose a weapon first':'No one stands against you');}
      else if(k==='e'){const a=actionNear();if(a)use(a[0]);else message('Face an object, a visitor, or a room edge');}
      else if(k==='/')$('cmd').focus();else if(k==='i')tabs('pack');else if(k==='m')tabs('route');else if(k==='?')fieldGuide();else keys.add(k);
    }
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  // Hold-to-walk buttons feed the same key set as the keyboard, so walking and step sounds need no change.
  for(const b of document.querySelectorAll('.touch-walk button')){
    const k=b.dataset.key,release=()=>{keys.delete(k);b.classList.remove('held');};
    b.addEventListener('pointerdown',e=>{if(!playing)return;e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch{}keys.add(k);b.classList.add('held');});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,release);
    b.addEventListener('contextmenu',e=>e.preventDefault());
  }
  window.addEventListener('blur',()=>{keys.clear();drag=null;});
  for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{
    if(playing&&!sound.started&&!muted)sound.start().catch(()=>{});
  },true);
  document.addEventListener('visibilitychange',()=>{keys.clear();sound.pause(document.hidden||!playing||$('dialog').open);});
  function direction(point) {
    if(!point)return '';
    const dx=point.x-view.pose.x,dz=point.z-view.pose.z;if(Math.hypot(dx,dz)<.2)return '';
    const a=Math.atan2(dx,dz)-view.pose.yaw;
    return ' · '+['ahead','right','behind','left'][(Math.round(a/(Math.PI/2))%4+4)%4];
  }
  sound.onCaption=(name,p)=>{
    if(!captions||!playing)return;
    const text=SceneSound.caption(name);
    if(text)message(text+direction(p));
  };
  sound.geometry=()=>({rig:view.rig,exits:view.exits,sideDoorZ:view.sideDoorZ,rear:view.rear});
  function animate(ms){
    const dt=Math.min(.05,Math.max(0,(ms-oldTime)/1000));oldTime=ms;elapsed+=dt;
    if(playing && !busy && !$('dialog').open && !state?.ended) {
      let forward=+(keys.has('w')||keys.has('arrowup'))-+(keys.has('s')||keys.has('arrowdown'));
      let side=+keys.has('d')-+keys.has('a');
      const turn=+keys.has('arrowright')-+keys.has('arrowleft'),p=view.pose;
      if(turn){p.yaw+=turn*dt*1.7;dirty=true;}
      if(forward||side){
        const norm=Math.hypot(side,forward),x=p.x,z=p.z;view.move(side/norm*dt*1.85,forward/norm*dt*1.85);
        stepDistance+=Math.hypot(x-p.x,z-p.z);if(stepDistance>.69){sound.effect('step',p);stepDistance=0;}
        dirty=true;
      }
      const actors={};
      if(npc) {
        const before=npc.frame;
        if(npc.key==='wizard'){
          const phase=prayed?2:wizardRead?1:0; npc.row=phase;npc.frame=Math.floor(elapsed*4)%[8,7,6][phase];
          npc.x=actorPlace.x+.075*Math.sin(elapsed*.68);actors.keeper=npc;
          if(!wizardRead)actors.bird={x:-1.29,z:4.98};
        }else if(npc.key==='bat'){
          npc.frame=Math.floor(elapsed*8)%npc.cols;npc.x=1.35*Math.sin(elapsed*.85);npc.z=3.1+Math.cos(elapsed*.85);actors.bird=npc;
        }else{npc.frame=Math.floor(elapsed*5)%npc.cols;actors[npc.key==='knight'?'knight':'keeper']=npc;}
        if(npc.frame!==before)dirty=true;
      }
      if(combatant){
        const frame=Math.floor(elapsed*5)%combatant.cols;
        if(combatant.frame!==frame){combatant.frame=frame;dirty=true;}
        if(knightReel!==908 && elapsed>combatant.until){
          knightReel=908;
          const current=combatant,reel=castleReel(908);
          view.texture(reel.path).then(texture=>{
            if(combatant!==current)return;
            Object.assign(current,{texture,cols:reel.frames,fw:reel.width,fh:reel.height,frame:0,w:current.h*reel.width/reel.height});dirty=true;
          });
        }
      }
      if(view.sprites.some(s=>s.flinchUntil>elapsed))dirty=true;
      sound.frame(p,actors);
      if($('cue').textContent && elapsed>captionUntil)$('cue').textContent='';
    }
    if(dirty && view.source && ms-lastPaint>=30) {
      view.render(elapsed);lastPaint=ms;dirty=false;
      if(playing){
        const a=actionNear();$('interact').hidden=!a;if(a)$('interact').textContent='E · '+a[1];
        $('compass').textContent=['N','NE','E','SE','S','SW','W','NW'][(Math.round(view.pose.yaw/(Math.PI/4))%8+8)%8];
      }
    }
    requestAnimationFrame(animate);
  }
  async function init(){
    try{sound.music.setEnabled(localStorage.getItem('scepters-music')==='on');}catch{}
    syncMusicButton();
    let pictureMode='colour';
    try{pictureMode=localStorage.getItem('scepters-picture-mode')||pictureMode;}catch{}
    view.setColour(pictureMode!=='ink'&&pictureMode!=='original-ink');
    view.setRefreshed(pictureMode!=='original-ink'&&pictureMode!=='original-colour');
    try{captions=localStorage.getItem('scepters-captions')!=='off';checkpointsOn=localStorage.getItem('scepters-checkpoints')!=='off';}catch{}
    fitViewport();
    scene=designs.get('ASCN/7990');
    if(location.protocol==='file:'){
      view.setRefreshed(false);syncLayerUi();
      $('pictureMode').disabled=true;$('layerBtn').disabled=true;
      const img=new Image();img.onload=()=>view.ctx.drawImage(img,0,0);img.src=scene.path;
      $('enter').textContent='Launch instructions →';return;
    }
    // A quiet, open game (including time spent reading the journal) is still active.
    setInterval(()=>api('state').catch(()=>{}),45000);
    try{
      const snapshot=await api('state');
      const resumable=sessionStorage.getItem('scepters-session')===snapshot.session;
      if(resumable){
        playing=true;sound.pause(document.hidden||$('dialog').open);$('cover').hidden=true;$('playing').hidden=false;$('compass').hidden=false;
        try{const kept=JSON.parse(sessionStorage.getItem('scepters-seen')||'null');if(kept&&kept.session===snapshot.session)visited=unpackSeen(kept.seen);}catch{}
        let keptJournal=false;
        try{const j=JSON.parse(sessionStorage.getItem('scepters-journal')||'null');if(j&&j.session===snapshot.session&&Array.isArray(j.journal)&&j.journal.length){replayJournal(j.journal);keptJournal=true;}}catch{}
        await apply(snapshot,{fresh:true,keepSeen:true,keepJournal:keptJournal});
      }else{
        await view.load(scene);state=snapshot;$('resume').hidden=!snapshot.saved;
        const lid=designs.get('AOBJ/14168');
        await view.add(lid,'AOBJ/14168',{x:(lid.x+lid.width/2-169)*4.18/215,z:4.18,y:1.8-(lid.y+lid.height-123)*4.18/215,w:lid.width*4.18/215,h:lid.height*4.18/215});
      }
    }catch(e){openDialog('Local engine',para(e.message));}
    fitViewport();
    requestAnimationFrame(animate);
  }
  init();
})();
