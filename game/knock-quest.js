/* An optional illustrated passage off the armory. The host owns the campaign save. */
(() => {
  'use strict';
  const shields=[
    {name:'Wing',beats:[0,680,900],marks:'One dent by the rim. Two lie close together below the wing.'},
    {name:'Crescent',beats:[0,220,900],marks:'Two dents touch beneath the crescent. A third sits apart.'},
    {name:'Key',beats:[0,450,900],marks:'Three dents beneath the key, equally spaced.'}
  ];
  const answer=1;
  const words={
    door:['The armory door','The Black Knight rests his shield against the empty rack. From the other side of the oak comes an answer. The iron ring lifts with every knock.'],
    guardroom:['The shield gallery','Three shields hang under a shutter. Each has three dents. Try a shield to feel its rhythm, then strike the one that answers the door.'],
    tower:['The watchtower','Beyond the parapet, a silver speck banks over the river. Its wings catch the sun. A lamp flashes in the cockpit. Beside you, a brass signal lantern waits on a swivel.'],
    beacon:['The eastern beacon','The courier circles above the valley, searching for a safe approach. Aim the lantern and send a three-flash reply. The compass and the old signal card are still legible.'],
    approach:['The courier’s reply','The aircraft banks close over the parapet. A message tube trails beneath a small pennant, then lands on the stone beside your lantern. The pilot lifts a wing in thanks.']
  };
  function open({progress,colour,muted,mixer,onProgress,onCue,onSave,onExit,onToggleSound}){
    let stage=progress?.stage||'door', solved=!!progress?.solved,selected=-1;
    let bearing=progress?.bearing||'north',signal=progress?.signal||'',signalSolved=!!progress?.signalSolved;
    let messageRead=!!progress?.messageRead,transmitting=false;
    let pulse=-1,flash=false,timers=[],frame=0,lastTick=-1,started=performance.now(),saving=false;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const dialog=document.createElement('dialog');
    dialog.id='knockQuest';dialog.setAttribute('aria-labelledby','knockTitle');
    dialog.innerHTML=`
      <div class="bar"><span>DARK CASTLE · ARMORY EXCURSION</span><span class="barlines"></span><button type="button" data-action="exit" aria-label="Close excursion">×</button></div>
      <div class="knock-body">
        <canvas id="knockCanvas" width="338" height="314" role="img"></canvas>
        <section><p class="eyebrow">THE ANSWERING KNOCK</p><h2 id="knockTitle" tabindex="-1"></h2>
        <p class="knock-story"></p><p class="knock-feedback" role="status"></p>
        <p class="knock-signal" hidden></p>
        <div class="knock-choices" role="group" aria-label="Inspect a shield"></div>
        <div class="knock-actions"></div></section>
      </div>
      <div class="knock-tools"><button type="button" data-action="colour"></button><button type="button" data-action="mute"></button>
      <button type="button" data-action="save">Save here</button><button type="button" data-action="exit">Return to the armory</button></div>`;
    const find=q=>dialog.querySelector(q),canvas=find('canvas'),title=find('h2'),feedback=find('.knock-feedback');
    // Keep the live sliders and their handlers while the masthead is inert.
    const mixerHome=document.createComment('volume controls');
    mixer.replaceWith(mixerHome);
    find('.knock-tools').before(mixer);
    function action(parent,label,fn){
      const b=document.createElement('button');b.type='button';b.textContent=label;
      b.addEventListener('click',fn);parent.append(b);return b;
    }
    function draw(){
      feedback.classList.toggle('knock-pulse',flash);
      KnockArt.draw(canvas,{stage,colour,elapsed:reduced.matches?0:(performance.now()-started)/1000,
        active:pulse,flash,open:solved,bearing,success:signalSolved});
    }
    const flying=()=>['tower','beacon','approach'].includes(stage);
    function fly(now){
      if(!dialog.open||document.hidden||!flying()||reduced.matches)return;
      if(now-lastTick>=90){draw();lastTick=now;}
      frame=requestAnimationFrame(fly);
    }
    function stopBeats(){
      timers.forEach(clearTimeout);timers=[];flash=false;pulse=-1;transmitting=false;
    }
    function persist(){
      onProgress({stage,solved,bearing,signal,signalSolved,messageRead});
    }
    function beats(pattern,id,target){
      stopBeats();draw();
      const hit=()=>{
        if(!dialog.open||document.hidden)return;
        pulse=target;flash=true;draw();onCue(id);
        timers.push(setTimeout(()=>{flash=false;draw();},140));
      };
      hit();
      for(const delay of pattern.slice(1))timers.push(setTimeout(hit,delay));
    }
    function clue(){
      beats(shields[answer].beats,'dc:69',-1);
      feedback.textContent='From the oak: tap-tap … tap. Two close together, then one after a pause.';
    }
    function change(next){
      stopBeats();stage=next;selected=-1;started=performance.now();
      persist();render();title.focus({preventScroll:true});
    }
    function choose(i){
      selected=i;const item=shields[i];
      for(const [n,b] of [...find('.knock-choices').children].entries())b.setAttribute('aria-pressed',String(n===i));
      find('[data-strike]').disabled=false;
      feedback.textContent=item.name+' shield. '+item.marks;
      beats(item.beats,'dc:0',i);
    }
    function strike(){
      if(selected<0)return;
      beats(shields[selected].beats,'dc:0',selected);
      if(selected!==answer){
        feedback.textContent='The '+shields[selected].name.toLowerCase()+' shield rings out. The shutter stays fast. Compare the spacing with the knock at the door.';
        return;
      }
      solved=true;persist();render();
      feedback.textContent='The two close blows and the lone reply lift the latch. Daylight cuts a stripe across the floor.';
      find('[data-climb]').focus({preventScroll:true});
    }
    function syncTools(){
      const pic=find('[data-action="colour"]');pic.textContent=colour?'Classic B/W':'Lit colour';
      const mute=find('[data-action="mute"]');mute.textContent=muted?'Sound off':'Sound on';
      mute.setAttribute('aria-pressed',String(!muted));
    }
    function showSignal(){
      const readout=find('.knock-signal');
      readout.textContent='Facing '+bearing+' · '+(signal?[...signal].map(c=>c==='.'?'short':'long').join(' · '):'No flashes entered');
      for(const button of find('.knock-choices').children)button.setAttribute('aria-pressed',String(button.dataset.bearing===bearing));
      for(const b of dialog.querySelectorAll('[data-compose]'))b.disabled=transmitting||(b.dataset.compose==='add'&&signal.length===3);
      const send=find('[data-send]');
      if(send)send.disabled=transmitting||signal.length!==3;
    }
    function aim(next){
      stopBeats();bearing=next;persist();showSignal();draw();
      feedback.textContent='The lantern is aimed '+bearing+'.';
    }
    function compose(flash){
      if(transmitting||signal.length===3)return;
      signal+=flash;persist();showSignal();
    }
    function clearSignal(){
      stopBeats();signal='';persist();showSignal();draw();
      feedback.textContent='The shutter is ready for a new signal.';
    }
    function incoming(){
      flashCode('.-.',()=>{});
      feedback.textContent='From the aircraft: one short flash, one long flash, one short flash. The pilot waits above the river.';
    }
    function signalCard(){
      feedback.textContent='The brass card reads “RIVER APPROACH · SHORT, LONG, SHORT.” A scratched compass note points east to the dawn coast, where the river runs out to sea.';
    }
    function flashCode(code,finished){
      stopBeats();transmitting=true;showSignal();
      let when=0;
      for(const mark of code){
        const duration=mark==='.'?180:650;
        timers.push(setTimeout(()=>{
          if(!dialog.open||document.hidden)return;
          flash=true;draw();onCue('dc:69');
        },when));
        timers.push(setTimeout(()=>{flash=false;draw();},when+duration));
        when+=duration+350;
      }
      timers.push(setTimeout(()=>{
        transmitting=false;showSignal();finished();
      },when));
    }
    function sendSignal(){
      if(transmitting||signal.length!==3)return;
      feedback.textContent='Sending '+[...signal].map(c=>c==='.'?'short':'long').join(', ')+' toward the '+bearing+'.';
      flashCode(signal,()=>{
        if(bearing!=='east'){
          feedback.textContent='The pilot circles away from the beam. The courier is above the river corridor. Check the compass note on the signal card.';
        }else if(signal!=='.-.'){
          feedback.textContent='The cockpit flashes “repeat.” The bearing is right. Check the lengths on the signal card and try again.';
        }else{
          signalSolved=true;change('approach');
        }
      });
    }
    function readMessage(){
      messageRead=true;persist();
      feedback.textContent='Inside the tube: “Eastern field is clear. Your beacon brought me through the cloud. If you see three aircraft together, cover the lamp.” Beneath the note is a small brass wing. You record the eastern field in your journal.';
    }
    function render(){
      cancelAnimationFrame(frame);lastTick=-1;
      title.textContent=words[stage][0];
      find('.knock-story').textContent=words[stage][1];
      feedback.textContent=stage==='guardroom'&&solved?'The shutter is open. A stair leads up.':'';
      find('.eyebrow').textContent=['beacon','approach'].includes(stage)?'AIRBORNE · THE EASTERN BEACON':'THE ANSWERING KNOCK';
      canvas.setAttribute('aria-label',words[stage][0]+'. '+words[stage][1]);
      const choices=find('.knock-choices'),buttons=find('.knock-actions');
      choices.replaceChildren();buttons.replaceChildren();
      choices.hidden=stage!=='beacon'&&(stage!=='guardroom'||solved);
      choices.setAttribute('aria-label',stage==='beacon'?'Aim the signal lamp':'Inspect a shield');
      find('.knock-signal').hidden=stage!=='beacon';
      if(stage==='door'){
        action(buttons,'Hear the knock',clue);
        action(buttons,'Knock back',()=>{change('guardroom');clue();});
      }else if(stage==='guardroom'){
        if(solved){
          action(buttons,'Climb to the watchtower',()=>change('tower')).dataset.climb='';
        }else{
          shields.forEach((s,i)=>action(choices,s.name,()=>choose(i)).setAttribute('aria-pressed',String(selected===i)));
          action(buttons,'Hear the knock again',clue);
          const strikeButton=action(buttons,'Strike the selected shield',strike);
          strikeButton.dataset.strike='';strikeButton.disabled=selected<0;
        }
      }else if(stage==='tower'){
        action(buttons,'Use the signal lamp',()=>change('beacon'));
        if(signalSolved)action(buttons,'Read the courier’s message',()=>{change('approach');readMessage();});
        action(buttons,'Descend to the gallery',()=>change('guardroom'));
      }else if(stage==='beacon'){
        for(const point of ['north','east','west']){
          const button=action(choices,'Face '+point,()=>aim(point));
          button.dataset.bearing=point;button.dataset.compose='aim';
        }
        action(buttons,'Watch the aircraft',incoming).dataset.compose='clue';
        action(buttons,'Read the signal card',signalCard);
        action(buttons,'Short flash',()=>compose('.')).dataset.compose='add';
        action(buttons,'Long flash',()=>compose('-')).dataset.compose='add';
        action(buttons,'Clear signal',clearSignal).dataset.compose='clear';
        action(buttons,'Send signal',sendSignal).dataset.send='';
        action(buttons,'Return to the watchtower',()=>change('tower'));
        showSignal();
      }else{
        action(buttons,'Open the message tube',readMessage);
        action(buttons,'Return to the watchtower',()=>change('tower'));
        if(messageRead)readMessage();
      }
      syncTools();draw();
      if(flying()&&!reduced.matches&&!document.hidden)frame=requestAnimationFrame(fly);
    }
    canvas.onclick=e=>{
      if(stage==='door'){clue();return;}
      if(stage!=='guardroom'||solved)return;
      const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*338/rect.width,y=(e.clientY-rect.top)*314/rect.height;
      const i=KnockArt.shields.findIndex(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);
      if(i>=0)choose(i);
    };
    function picture(){colour=!colour;syncTools();draw();}
    find('[data-action="colour"]').onclick=picture;
    find('[data-action="mute"]').onclick=()=>{muted=onToggleSound();syncTools();};
    find('[data-action="save"]').onclick=async e=>{
      if(saving)return;
      saving=true;const b=e.currentTarget,savedStage=stage;b.disabled=true;
      try{await onSave();feedback.textContent='Saved here. Restore will bring you back to '+words[savedStage][0].toLowerCase()+'.';}
      catch(error){feedback.textContent='Could not save here. '+error.message;}
      finally{saving=false;b.disabled=false;}
    };
    dialog.querySelectorAll('[data-action="exit"]').forEach(b=>b.onclick=()=>dialog.close());
    dialog.addEventListener('keydown',e=>{
      if(e.key.toLowerCase()==='l'&&!e.metaKey&&!e.altKey&&!e.ctrlKey){
        e.preventDefault();if(!e.repeat)picture();
      }
      e.stopPropagation();
    });
    function visibility(){
      stopBeats();cancelAnimationFrame(frame);
      if(stage==='beacon')showSignal();
      if(!document.hidden){draw();if(flying()&&!reduced.matches)frame=requestAnimationFrame(fly);}
    }
    document.addEventListener('visibilitychange',visibility);
    reduced.addEventListener('change',visibility);
    dialog.addEventListener('close',()=>{
      stopBeats();cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange',visibility);
      reduced.removeEventListener('change',visibility);
      mixerHome.replaceWith(mixer);dialog.remove();onExit();
    },{once:true});
    document.body.append(dialog);dialog.showModal();render();title.focus({preventScroll:true});
    if(stage==='door'&&!document.hidden){
      onCue('dc:0');
      timers.push(setTimeout(clue,520));
    }
  }
  window.KnockQuest={open};
})();
