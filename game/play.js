(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const view=new PlateView($('world')), sound=new SceneSound();
  const designs=new Map(ES_DESIGNS.map(d=>[d.type+'/'+d.id,d]));
  const keys=new Set(), keyFor=(o,kind)=>kind+'/'+o.id;
  const starts=['art','computer','dogleg','Finale','lava tunnel','main road','mirror room','office',"Queen's Chamber"];
  let state,scene,playing=false,busy=false,muted=false,captions=true,drag=null;
  let shortcut=false,wizardRead=false,prayed=false,npc=null,combatant=null,knightReel=908;
  let elapsed=0,oldTime=0,stepDistance=0,dirty=true,lastPaint=-1,captionUntil=0,viewScale=1;
  const actorPlace={x:-.94,z:5.14};
  function syncLayerUi(){
    const on=view.refreshed;
    if($('layerBtn')){$('layerBtn').textContent=on?'Refreshed':'Original';$('layerBtn').setAttribute('aria-pressed',String(on));}
    if($('plateMode'))$('plateMode').textContent=(on?'REFRESHED LAYER':'ORIGINAL PLATE')+(viewScale>=1?' · '+viewScale+'×':' · 1-BIT');
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
    view.setRefreshed(typeof force==='boolean'?force:!view.refreshed);
    syncLayerUi();dirty=true;
    if(playing){message(view.refreshed?'Refreshed layers':'Original plate');$('world').focus({preventScroll:true});}
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
  function line(s,cls=''){
    if(!s)return;
    const log=$('log');log.append(para(s.trim(),cls));while(log.children.length>50)log.firstChild.remove();log.scrollTop=log.scrollHeight;
  }
  function message(s){ $('cue').textContent=s;captionUntil=elapsed+3.3; }
  function openDialog(name,...content){
    keys.clear();sound.pause(true);$('dialogName').textContent=name;
    $('dialogBody').replaceChildren(...content);if(!$('dialog').open)$('dialog').showModal();
  }
  $('closeDialog').onclick=()=>$('dialog').close();
  $('dialog').addEventListener('close',()=>{sound.pause(!playing);if(playing)$('world').focus({preventScroll:true});});
  $('dialog').addEventListener('click',e=>{if(e.target===$('dialog'))$('dialog').close();});
  async function api(action,arg=''){
    const r=await fetch('/api/'+action,{method:'POST',headers:{'X-Scepters':'1'},body:arg});
    if(!r.ok)throw new Error(await r.text()||'The adventure could not process that action.');
    return r.json();
  }
  function sourceEvents(next,point){if(playing && next.sounds?.length)sound.events(next.sounds,point||{x:.35,z:Math.max(1.7,view.rig.back-.8)});}
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
  }
  for(const name of ['journal','pack','route'])$(name+'Tab').onclick=()=>tabs(name);
  function controls(){
    $('roomTitle').textContent=state.ended?'Journey’s end':scene.name;
    $('chapterTag').textContent=state.ended?'END OF ADVENTURE':shortcut?'HIGH ALTAR EXCURSION':'SABER’S JOURNAL';
    $('windowName').textContent=title(scene.name);$('plateCode').textContent='ASCN · '+scene.id;
    $('health').textContent='HP '+state.hp;$('itemCount').textContent=state.inventory.length;
    $('save').disabled=state.ended;$('load').disabled=!state.saved;
    $('pack').replaceChildren();
    for(const it of state.inventory) {
      const m=designs.get(keyFor(it,'AOBJ'));
      const b=button(it.name,()=>{tabs('journal');$('cmd').value=(it.verb?it.verb+' ':'drop ')+it.name;$('cmd').focus();},'');
      if(m){const img=new Image();img.src=m.path;img.alt='';b.prepend(img);}$('pack').append(b);
    }
    if(!state.inventory.length)$('pack').append(para('Your pack is empty.','subtext'));
    $('arms').replaceChildren(...state.weapons.map(s=>button(s,()=>command(s))));
    if(state.characters.length)for(const [i,part] of ['head','chest','side'].entries()){
      $('arms').append(button('Aim '+part,async()=>{if(busy)return;busy=true;try{await api('aim',String(i+1));message('Aiming at '+part);}finally{busy=false;}}));
    }
    $('actions').replaceChildren();
    if(state.ended){$('actions').append(button('Open adventures',adventures));return;}
    let verbs=['Look','Search'];
    $('listening').hidden=true;
    if(scene.id===7990){
      if(wizardRead)verbs.push('Pray');
      if(state.objects.some(o=>o.id===23213))verbs.push('Get Air Scepter');
      if(state.inventory.some(o=>o.id===23213)&&state.objects.some(o=>o.id===14168))verbs.push('Move altar');
      if(!state.objects.some(o=>o.id===14168))verbs.push('Down');
    }
    if(scene.id===29408)verbs.push('Read book','Swing sword');
    if(scene.name==='bridge room')verbs.push('Turn crank');
    // A scene may replace the Macintosh Commands menu during a turn.
    const special=state.menu.split(';').filter(a=>a&&!a.startsWith('(')).map(a=>a.split('/')[0].split('<')[0]);
    const common=['north','south','east','west','up','down','look','rest','status','inventory','search','open','close'];
    verbs.push(...special.filter(a=>!common.includes(a.toLowerCase())));
    $('actions').append(...[...new Set(verbs)].map(v=>button(v,()=>command(v))));
    $('travel').replaceChildren(...['west','north','east','up','south','down'].map(d=>button(d,()=>command(d),'travel-key')));
    const free=Object.keys(scene.blocked||{}).filter(d=>!scene.blocked[d]);
    $('routeNote').textContent=free.length?'Map openings · '+free.join(' / '):'Listen for clues in the room description.';
  }
  async function apply(next,opts={}) {
    const changed=next.scene!==state?.scene||opts.fresh;
    const priorKnight=state?.characters.find(c=>c.name==='Black Knight');
    const followingKnight=next.characters.find(c=>c.name==='Black Knight');
    knightReel=!changed&&followingKnight&&priorKnight?(followingKnight.hp<priorKnight.hp?912:next.hp<state.hp?915:908):908;
    state=next;
    if(state.ended){
      if(!scene)scene=designs.get('ASCN/7990');
      sourceEvents(next,opts.point);line(next.output);line('This adventure has ended. Restore a save or choose a new entry.','aside');controls();return;
    }
    if(changed){
      scene=designs.get('ASCN/'+next.scene);
      if(!scene)throw new Error('Missing room plate '+next.scene);
      await view.load(scene);sound.scene(scene);
      if(opts.fresh) {$('log').replaceChildren();wizardRead=false;prayed=false;}
      if(!opts.fresh && playing)line('— '+title(scene.name)+' —','entry');
      if(scene.id!==7990)shortcut=false;
      keys.clear();stepDistance=0;tabs('journal');
    }
    if(opts.echo)line('› '+opts.echo,'entry');
    line(next.output || (changed?scene.text:''));
    if(scene.id===7990) {
      if(/murals show/i.test(next.output))wizardRead=true;
      if(/materializes/i.test(next.output)||state.inventory.some(a=>a.id===23213))prayed=true;
    }
    if(scene.name.toLowerCase()==='finale' && /saved Callion/i.test(next.output)) {
      line('All four scepters have come home.','aside');
    }
    await populate();controls();sourceEvents(next,opts.point);
    $('resume').hidden=!state.saved;
  }
  async function command(text,action='turn',point=null) {
    if(!playing||busy||state.ended)return;
    busy=true;keys.clear();tabs('journal');
    try {
      const next=await api(action,text);
      await apply(next,{echo:action==='turn'?text:'Examine '+(designs.get(text)?.name||'object'),point});
    } catch(e){line(e.message,'aside');}
    finally {busy=false;dirty=true;}
  }
  async function begin(entry){
    if(busy)return;busy=true;
    if($('dialog').open)$('dialog').close();
    try {
      if(location.protocol==='file:')throw new Error('Double-click Play Enchanted Scepters.exe in the game folder. It starts the local adventure engine and opens your browser.');
      await sound.start();sound.mute(muted);sound.pause(false);
      const next=await api('start',entry);
      playing=true;shortcut=entry==='altar';$('cover').hidden=true;$('playing').hidden=false;$('compass').hidden=false;fitViewport();
      await apply(next,{fresh:true});sessionStorage.setItem('scepters-session',state.session);
      if(entry==='altar')line('A voice carries from the far side of the stone.','aside');
      if(entry==='restore'&&state.viewData){
        try{const v=JSON.parse(state.viewData);
          if(v.scene===scene.id && [v.x,v.z,v.yaw,v.pitch].every(Number.isFinite)) {
            Object.assign(view.pose,{x:v.x,z:v.z,yaw:v.yaw,pitch:v.pitch});
            wizardRead=!!v.read;shortcut=!!v.shortcut;controls();
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
      const result=await api('save',JSON.stringify({...view.pose,scene:scene.id,read:wizardRead,shortcut}));
      state.saved=result.saved;controls();line('Adventure saved.','aside');
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
  function fieldGuide(){
    const h=document.createElement('h2');h.textContent='Field guide';
    openDialog('Field guide',h,
      para('Walk with W A S D or the up and down arrows. Turn with left and right. Drag the drawing to look up, down, and around.'),
      para('Click a drawn object or approach it and press E. Press / to type. Original commands include LOOK, READ, SEARCH, REST, and the six directions. Use the Pack tab for weapons and items.'),
      para('The ⌖ button returns you to the illustrator’s viewpoint. Press L or click Refreshed in the window bar to compare the separate refresh layers against the untouched disk plates. Save keeps your place between launches.'),
      para('The full journey begins in Saber’s quarters. All 200 Macintosh scene scripts run locally. The High Altar excursion starts you inside a later puzzle. The Dark Castle visitors and their placement are new to this edition.'),
      button(view.refreshed?'Show original plates':'Show refreshed layers',()=>{toggleLayers();fieldGuide();}),
      button(captions?'Hide sound captions':'Show sound captions',()=>{captions=!captions;localStorage.setItem('scepters-captions',captions?'on':'off');fieldGuide();}),
      button('Disk bookmarks',adventures));
  }
  $('guideBtn').onclick=fieldGuide;
  if($('layerBtn'))$('layerBtn').onclick=()=>toggleLayers();
  $('soundBtn').onclick=async()=>{
    muted=!muted;sound.mute(muted);$('soundLabel').textContent=muted?'off':'on';$('soundBtn').setAttribute('aria-pressed',String(!muted));
    if(playing&&!muted)await sound.start();
  };
  $('homeView').onclick=()=>{view.reset();dirty=true;if(playing){message('Doorway viewpoint');$('world').focus({preventScroll:true});}else if(view.source)view.render(elapsed);};
  $('commandForm').onsubmit=e=>{e.preventDefault();const t=$('cmd').value.trim();if(!t)return;$('cmd').value='';$('cmd').blur();$('world').focus();command(t);};
  function use(key){
    if(!playing||busy||state.ended)return;
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
    command(key,'click',view.sprites.find(s=>s.key===key));
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
    const near=view.targets.map(t=>({t,d:Math.hypot(t.s.x-p.x,t.s.z-p.z)})).filter(q=>q.d<2.05 && q.t.left+q.t.sw>35 && q.t.left<303)
      .sort((a,b)=>a.d-b.d)[0];
    if(near) {
      const k=near.t.key;
      if(k==='wizard')return [k,prayed&&!state.objects.some(o=>o.id===14168)?'Listen to the stone':'Speak to the wizard'];
      if(k==='knight')return [k,'Listen to the knight'];
      if(k==='bat')return [k,'Listen'];
      if(k==='AOBJ/14168')return [k,wizardRead?(prayed?'Move the altar':'Kneel at the altar'):'Examine the altar'];
      return [k,'Examine '+(designs.get(k)?.name||'object')];
    }
    if(scene.id===7990&&Math.hypot(p.x-.3,p.z-4.42)<1.2) {
      if(!state.objects.some(o=>o.id===14168))return ['altar-down','Descend the passage'];
      if(wizardRead && !prayed)return ['altar-pray','Kneel at the altar'];
    }
    const r=view.rig,bearings=[['north',r.back-p.z,0],['east',r.right-p.x,Math.PI/2],['south',p.z-view.rear,Math.PI],['west',p.x-r.left,-Math.PI/2]];
    for(const [name,d,a]of bearings)if(d<.65&&Math.cos(p.yaw-a)>.35)return ['go/'+name,'Go '+name];
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
  $('world').onpointermove=e=>{
    if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    drag.total+=Math.abs(dx)+Math.abs(dy);
    if(drag.total>3){view.pose.yaw+=dx*.007;view.pose.pitch=Math.max(-135,Math.min(135,view.pose.pitch-dy*.5));dirty=true;}
    drag.x=e.clientX;drag.y=e.clientY;
  };
  $('world').onpointerup=e=>{
    if(!drag)return;
    if(drag.total<=4){const t=view.hit(...canvasPoint(e));if(t)use(t.key);}
    drag=null;
  };
  $('world').onpointercancel=()=>drag=null;
  document.addEventListener('keydown',e=>{
    if($('dialog').open||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.target.tagName==='INPUT'){if(e.key==='Escape')$('world').focus();return;}
    const k=e.key.toLowerCase();
    if(k==='l'){e.preventDefault();if(!e.repeat)toggleLayers();return;}
    if(!playing)return;
    if(['w','s','a','d','arrowup','arrowdown','arrowleft','arrowright','e','/','i','m','?'].includes(k)){
      e.preventDefault();if(e.repeat)return;
      if(k==='e'){const a=actionNear();if(a)use(a[0]);else message('Face an object, a visitor, or a room edge');}
      else if(k==='/')$('cmd').focus();else if(k==='i')tabs('pack');else if(k==='m')tabs('route');else if(k==='?')fieldGuide();else keys.add(k);
    }
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
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
    if(!captions||!playing||['step','keeperStep','dc:84'].includes(name))return;
    const alias={keeper:'A voice',bird:'Two short notes', 'dc:1':'A voice','dc:70':'Two short notes',bell:'A bell'};
    message((alias[name]||name)+direction(p));
  };
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
        }else{npc.frame=Math.floor(elapsed*5)%npc.cols;actors.keeper=npc;}
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
    try{captions=localStorage.getItem('scepters-captions')!=='off';}catch{}
    fitViewport();
    scene=designs.get('ASCN/7990');
    if(location.protocol==='file:'){
      const img=new Image();img.onload=()=>view.ctx.drawImage(img,0,0);img.src=scene.path;
      $('enter').textContent='Launch instructions →';return;
    }
    // A quiet, open game (including time spent reading the journal) is still active.
    setInterval(()=>api('state').catch(()=>{}),45000);
    try{
      const snapshot=await api('state');
      const resumable=sessionStorage.getItem('scepters-session')===snapshot.session;
      if(resumable){
        playing=true;$('cover').hidden=true;$('playing').hidden=false;$('compass').hidden=false;
        await apply(snapshot,{fresh:true});
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
