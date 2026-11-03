/* Furniture and architecture measured on the native 338 × 314 drawings.
   Each textured component comes from a group of ASCN vector commands.
   Camera, occluded depths, underside patterns and footprints are interpreted. */
(() => {
  function room(name, eye, cy, left, right, back, ceiling) {
    return {eye, cy, cx:169, focal:215, left, right, back, ceiling,
      clean:"art/"+name+"-clean.png", solids:[]};
  }
  function ground(r, px, py, y) {
    const z = r.focal * (r.eye-y)/(py-r.cy);
    return [(px-r.cx)*z/r.focal, z];
  }
  function solid(r, id, texture, y0, y1, footprint, extra={}) {
    r.solids.push({id,kind:id,texture:"art/"+texture+".png",y0,y1,footprint,...extra});
  }
  function panel(r,id,texture,y0,y1,points) {
    solid(r,id,texture,y0,y1,points.map(([x,y])=>ground(r,x,y,y1)));
  }
  function post(r,id,texture,x,z,rx,rz,y0,y1,extra) {
    solid(r,id,texture,y0,y1,[[x-rx,z-rz],[x+rx,z-rz],[x+rx,z+rz],[x-rx,z+rz]],extra);
  }
  function oval(r,id,texture,x,z,rx,rz,y0,y1,extra) {
    const points = [];
    for(let i=0;i<32;i++){
      const a=i*Math.PI/16;
      points.push([x+rx*Math.cos(a),z+rz*Math.sin(a)]);
    }
    solid(r,id,texture,y0,y1,points,extra);
  }

  // ASCN 21149 / ATXT 21149 explicitly calls this the simple wooden bed.
  // The original artist drew three feet along the near rail and hid the fourth.
  const quarters=room("quarters",1.8,38,-4.3,4.2,5.45,3.6);
  panel(quarters,"bed rail","quarters-bed",.54,.68,[[110,120],[177,94],[353,145],[284,184]]);
  for(const [i,x,y] of [[0,122,123],[1,199,151],[2,278,178],[3,180,99]]){
    const [px,pz]=ground(quarters,x,y,.68);
    post(quarters,"bed leg "+(i+1),"quarters-bed",px,pz,.077,.11,0,.60);
  }

  const sanctum=room("sanctum",1.72,61,-3.9,4.1,6.1,3.82);
  panel(sanctum,"worktable","sanctum-table",.73,.89,[[204,203],[289,156],[436,177],[414,247]]);
  for(const [i,x,y] of [[0,263,214],[1,312,181],[2,397,232],[3,395,177]]){
    const [px,pz]=ground(sanctum,x,y,.89);
    post(sanctum,"worktable leg "+(i+1),"sanctum-table",px,pz,.09,.10,0,.78);
  }
  const [bx,bz]=ground(sanctum,193,181,0);
  oval(sanctum,"lectern foot","sanctum-book",bx,bz,.23,.17,0,.09);
  post(sanctum,"lectern stem","sanctum-book",bx,bz,.05,.05,.06,1.16);
  post(sanctum,"open spellbook","sanctum-book",bx,bz,.39,.23,.71,1.31,{silhouette:true});
  // The open archivolt is projected onto a thin, two-sided lintel. Two
  // individual supports allow the player to pass naturally beneath it.
  const [lx,lz]=ground(sanctum,43,182,0), [rx,rz]=ground(sanctum,151,150,0);
  const ax=rx-lx,az=rz-lz;
  const a=[lx-ax*.46,lz-az*.46], b=[rx+ax*.11,rz+az*.11];
  solid(sanctum,"arch","sanctum-arch",.01,3.6,[a,b,[b[0],b[1]+.11],[a[0],a[1]+.11]],
    {silhouette:true,twoSided:true,noCollision:true});
  for(const [x,z] of [[lx,lz],[rx,rz]]){
    post(sanctum,"arch upright","sanctum-arch",x,z,.095,.09,0,2.5,{collisionOnly:true});
  }
  const court=room("court",1.8,99,-5.2,5.2,9.65,5.7);
  court.environment="open";
  // The fountain's lip and bowl are a single native shape group. Calculate
  // the near/far ends from the top ellipse at its measured height.
  const far=ground(court,166,159,.24)[1], near=ground(court,166,207,.24)[1];
  oval(court,"fountain basin","court-basin",-.055,(far+near)/2,1.75,(far-near)/2,0,.24);
  window.RoomLayouts={21149:quarters,29408:sanctum,10021:court};

  // The native ASCN command alpha bounds give the silhouette and its floor
  // contact. Project those endpoints back to a front plane at the inferred
  // ground depth, then extrude a shallow, tapered volume. Trunks and rocks
  // get narrower, independent collision bodies so branch gaps stay passable.
  for(const [id,key,label,form,depth,anchor,x0,y0,x1,y1] of window.ForegroundForms||[]){
    let rig=window.RoomLayouts[id];
    if(!rig){
      rig=room("foreground/"+id,1.8,105,-5.0,5.0,9.2,6.2);
      rig.environment=[2352,31555,26847,15776,8642,7820].includes(id)?"submerged":
        [12321,2818,30379].includes(id)?"chamber":"open";
      window.RoomLayouts[id]=rig;
    }
    const z=Math.min(rig.back-1,rig.focal*rig.eye/(y1-rig.cy));
    const left=(x0-rig.cx)*z/rig.focal, right=(x1-rig.cx)*z/rig.focal;
    const top=rig.eye-(y0-rig.cy)*z/rig.focal;
    const texture="foreground/"+id+"-"+key;
    const width=right-left, center=left+anchor*width, bevel=.10*width;
    const heel=z+depth;
    const scale=heel/z;
    solid(rig,label,texture,0,top+.03,[
      [left-.012,z],[right+.012,z],[right*scale-bevel,heel],[left*scale+bevel,heel]
    ],{silhouette:true,twoSided:true,reversePattern:form==="trunk"?7:form==="frond"?6:5,noCollision:true});
    if(form==="trunk"||form==="rock"){
      const radius=form==="trunk"?Math.min(.18,width*.10):Math.min(.68,width*.32);
      const front=z+.02, back=heel-.02;
      post(rig,label+" contact",texture,center,(front+back)/2,radius,(back-front)/2,0,Math.max(.66,top),{collisionOnly:true});
    }
  }
})();
