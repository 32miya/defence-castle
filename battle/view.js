/* 戦国・城ディフェンス（仮） 表示と操作
   お城さんぽの3Dマップ（index.html）の上で動く。index.html は ?battle のときだけこのファイルを読み、
   毎フレーム OshiroBattle.frame(dt) を呼ぶ（カメラはここで動かす）。描画・影・空はさんぽ側のまま。
   ・軽量版マップ: 城から離れた三角形・木を捨て、現代の建物を消し、水面の映り込みと仕上げのぼかしを切る。影は一度だけ描く
   ・兵士: 低ポリゴンの兵士をインスタンシングでまとめて描く（兵種ごとに2回の描画で全員）。兵100人につき1体
   ・負荷テスト: ?battle&bench または出陣前の画面から */
(function(){
'use strict';
const IY=window.__iy, THREE=window.THREE, SIM=window.OshiroBattleSim;
const MAP=(window.OshiroBattleMaps||{})[window.OB_MAP||(new URLSearchParams(location.search).get('map'))||'inuyama']||Object.values(window.OshiroBattleMaps||{})[0];
if(!IY||!THREE||!SIM||!MAP){ console.warn('battle: not ready'); return; }
const QS=new URLSearchParams(location.search);
const T=SIM.TYPES;
const isTouch=matchMedia('(pointer:coarse)').matches;
const $=id=>document.getElementById(id);
const el=(tag,cls,html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; };
const fmt=s=>{ s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const H=(x,z)=>IY.groundH0(x,z);

const OB=window.OshiroBattle={ready:false,shadowCenter:[(MAP.keep.x0+MAP.keep.x1)/2,(MAP.keep.z0+MAP.keep.z1)/2],shadowDirty:4,frame,after,map:MAP};

/* ================= 軽量版マップ ================= */
function lighten(){
  const t0=performance.now();
  IY.setQuality('low');
  /* 現代の建物は使わないので捨てる */
  disposeTree(IY.GM); if(IY.GM.parent) IY.GM.parent.remove(IY.GM);
  if(IY.GNPC) IY.GNPC.visible=false;
  const K=MAP.keep; let tri0=0,tri1=0;
  const inK=(x,z)=>x>K.x0&&x<K.x1&&z>K.z0&&z<K.z1;
  const kill=[];
  IY.scene.updateMatrixWorld(true);
  IY.scene.traverse(o=>{
    if(o.isSprite){ o.visible=false; return; }          /* 入口の札など */
    if(!o.isMesh||!o.geometry||o===IY.scene) return;
    if(o.material===IY.M.terrain) return;                 /* 地面は遠くまで残す */
    if(o.geometry.type==='PlaneGeometry'&&o.material===IY.waterMat) return;
    const g=o.geometry; if(!g.attributes||!g.attributes.position) return;
    if(o.isInstancedMesh){ compactInstances(o,inK); return; }
    if(!g.boundingBox) g.computeBoundingBox(); const bb=g.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if(bb.max.x<K.x0||bb.min.x>K.x1||bb.max.z<K.z0||bb.min.z>K.z1){ if(bb.max.x-bb.min.x<3000) kill.push(o); return; }
    if(bb.min.x>=K.x0&&bb.max.x<=K.x1&&bb.min.z>=K.z0&&bb.max.z<=K.z1) return;
    const r=filterTris(o,inK); tri0+=r[0]; tri1+=r[1];
  });
  for(const o of kill){ if(o.parent) o.parent.remove(o); if(o.geometry) o.geometry.dispose(); }
  /* 影: 城の範囲全体を一度だけ描く */
  const sun=IY.sun,ext=Math.max(K.x1-K.x0,K.z1-K.z0)*.58,sz=isTouch?1024:2048;
  sun.shadow.mapSize.set(sz,sz); const c=sun.shadow.camera; c.left=-ext; c.right=ext; c.top=ext; c.bottom=-ext; c.near=1; c.far=900; c.updateProjectionMatrix();
  if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
  OB.shadowDirty=4;
  OB.lightInfo={ms:Math.round(performance.now()-t0),removedMeshes:kill.length,trisCut:tri0-tri1};
}
function disposeTree(g){ g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
function compactInstances(o,inK){ const m=new THREE.Matrix4(),p=new THREE.Vector3(),c=new THREE.Color(); let j=0; const n=o.count;
  for(let i=0;i<n;i++){ o.getMatrixAt(i,m); p.setFromMatrixPosition(m).applyMatrix4(o.matrixWorld); if(inK(p.x,p.z)){ if(i!==j){ o.setMatrixAt(j,m); if(o.instanceColor){ o.getColorAt(i,c); o.setColorAt(j,c); } } j++; } }
  o.count=j; o.instanceMatrix.needsUpdate=true; if(o.instanceColor) o.instanceColor.needsUpdate=true; }
function filterTris(o,inK){
  const g=o.geometry,P=g.attributes.position,W=o.matrixWorld,v=new THREE.Vector3(),id=W.equals(new THREE.Matrix4());
  const cx=(a,b,c)=>{ let x=0,z=0; for(const k of [a,b,c]){ v.fromBufferAttribute(P,k); if(!id) v.applyMatrix4(W); x+=v.x; z+=v.z; } return [x/3,z/3]; };
  if(g.index){ const I=g.index.array,keep=[]; for(let t=0;t<I.length;t+=3){ const [x,z]=cx(I[t],I[t+1],I[t+2]); if(inK(x,z)) keep.push(I[t],I[t+1],I[t+2]); } const n0=I.length/3; g.setIndex(keep); return [n0,keep.length/3]; }
  const n=P.count,keepT=[]; for(let t=0;t<n;t+=3){ const [x,z]=cx(t,t+1,t+2); if(inK(x,z)) keepT.push(t); }
  if(keepT.length===n/3) return [n/3,n/3];
  for(const name in g.attributes){ const A=g.attributes[name],s=A.itemSize,src=A.array,dst=new src.constructor(keepT.length*3*s); let k=0; for(const t of keepT){ for(let q=0;q<3*s;q++) dst[k++]=src[t*s+q]; } g.setAttribute(name,new THREE.BufferAttribute(dst,s,A.normalized)); }
  g.computeBoundingSphere(); g.computeBoundingBox(); return [n/3,keepT.length];
}

/* ================= 兵士（低ポリゴン・インスタンシング） ================= */
const FIG_S=1.9;      /* 見やすいように実物より大きく */
function partsGeo(parts){ /* parts: [w,h,d,x,y,z,color,(rx)] → 1つのジオメトリ（頂点色つき） */
  const pos=[],nor=[],col=[],c=new THREE.Color(),m=new THREE.Matrix4();
  for(const p of parts){ const g=(p[8]==='cone'?new THREE.ConeGeometry(p[0],p[1],6):new THREE.BoxGeometry(p[0],p[1],p[2])).toNonIndexed();
    m.makeRotationX(p[7]||0); m.setPosition(p[3],p[4],p[5]); g.applyMatrix4(m); c.set(p[6]).convertSRGBToLinear();
    const P=g.attributes.position,N=g.attributes.normal; for(let i=0;i<P.count;i++){ pos.push(P.getX(i)*FIG_S,P.getY(i)*FIG_S,P.getZ(i)*FIG_S); nor.push(N.getX(i),N.getY(i),N.getZ(i)); col.push(c.r,c.g,c.b); } g.dispose(); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); return g; }
const W='#ffffff',SKIN='#d9b38c',DARK='#2a241f',WOOD='#6b4a2b',STEEL='#b9bcc0',HORSE='#5a3b26',HAKAMA='#3d3a35';
const FIGS={
  yari:{team:[[.52,.62,.32,0,1.05,0,W],[.03,.55,.36,0,1.72,-.2,W],[.18,.12,.3,-.3,1.05,0,W],[.18,.12,.3,.3,1.05,0,W]],
        neu:[[.42,.74,.26,0,.38,0,HAKAMA],[.25,.25,.25,0,1.52,0,SKIN],[.36,.16,0,0,1.72,0,DARK,0,'cone'],[.05,3.1,.05,.32,1.5,.1,WOOD],[.08,.3,.08,.32,3.1,.1,STEEL]]},
  yumi:{team:[[.5,.6,.32,0,1.05,0,W],[.03,.5,.34,0,1.7,-.2,W]],
        neu:[[.42,.74,.26,0,.38,0,HAKAMA],[.25,.25,.25,0,1.52,0,SKIN],[.36,.16,0,0,1.72,0,DARK,0,'cone'],[.05,1.6,.08,.34,1.2,.12,WOOD],[.14,.5,.14,-.18,1.2,-.22,DARK]]},
  kiba:{team:[[.5,.58,.34,0,2.05,0,W],[.03,.55,.36,0,2.7,-.2,W]],
        neu:[[.5,.66,1.5,0,1.3,0,HORSE],[.3,.62,.34,0,1.78,.7,HORSE,-.5],[.26,.3,.52,0,2.05,1.02,HORSE],[.13,.95,.13,-.16,.48,.55,DARK],[.13,.95,.13,.16,.48,.55,DARK],[.13,.95,.13,-.16,.48,-.55,DARK],[.13,.95,.13,.16,.48,-.55,DARK],
             [.25,.25,.25,0,2.5,0,SKIN],[.36,.16,0,0,2.7,0,DARK,0,'cone'],[.05,3,.05,.34,2.4,.3,WOOD,-.35],[.4,.3,.62,0,1.72,0,DARK]]}
};
const CAP=QS.has('cap')?+QS.get('cap'):2400;
const SOL={}; const COL={ally:new THREE.Color('#3a5fae'),enemy:new THREE.Color('#c0392b'),boss:new THREE.Color('#d6a933'),rout:new THREE.Color('#8a8580')};
for(const c in COL) COL[c].convertSRGBToLinear();
function makeSoldiers(){
  /* 色を変える部分（服・旗）と変えない部分で材質を分ける（instanceColor の有無でシェーダーが違うため） */
  const matT=new THREE.MeshLambertMaterial({vertexColors:true}),matN=new THREE.MeshLambertMaterial({vertexColors:true});
  for(const k in FIGS){ const tm=new THREE.InstancedMesh(partsGeo(FIGS[k].team),matT,CAP),nm=new THREE.InstancedMesh(partsGeo(FIGS[k].neu),matN,CAP);
    for(let i=0;i<CAP;i++) tm.setColorAt(i,COL.ally); tm.instanceColor.setUsage(THREE.DynamicDrawUsage); tm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); nm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for(const m of [tm,nm]){ m.count=0; m.frustumCulled=false; m.castShadow=false; m.receiveShadow=false; IY.scene.add(m); }
    SOL[k]={tm,nm,n:0}; }
  /* 部隊の足もとの輪（遠くからでも敵味方がわかるように） */
  const rg=new THREE.RingGeometry(5.2,6.4,28); rg.rotateX(-Math.PI/2);
  OB.rings=new THREE.InstancedMesh(rg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false,fog:false}),400);
  for(let i=0;i<400;i++) OB.rings.setColorAt(i,COL.ally); OB.rings.count=0; OB.rings.frustumCulled=false; OB.rings.renderOrder=2; IY.scene.add(OB.rings);
  /* 矢 */
  OB.rockMesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.2,0),new THREE.MeshLambertMaterial({color:0x8a8378}),80); OB.rockMesh.count=0; OB.rockMesh.frustumCulled=false; IY.scene.add(OB.rockMesh);
  const ag=new THREE.BoxGeometry(.07,.07,1.5); OB.arrowMesh=new THREE.InstancedMesh(ag,new THREE.MeshBasicMaterial({color:0x2a2018}),500); OB.arrowMesh.count=0; OB.arrowMesh.frustumCulled=false; IY.scene.add(OB.arrowMesh);
}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1),_z=new THREE.Vector3(0,0,1);
function setFig(mesh,i,x,y,z,h,sc){ const e=mesh.instanceMatrix.array,o=i*16,c=Math.cos(h)*sc,s=Math.sin(h)*sc; e[o]=c; e[o+1]=0; e[o+2]=-s; e[o+3]=0; e[o+4]=0; e[o+5]=sc; e[o+6]=0; e[o+7]=0; e[o+8]=s; e[o+9]=0; e[o+10]=c; e[o+11]=0; e[o+12]=x; e[o+13]=y; e[o+14]=z; e[o+15]=1; }
let figTotal=0,showFigs=true;
function drawSoldiers(battle,alpha,t){
  for(const k in SOL) SOL[k].n=0; figTotal=0; let rn=0;
  const per=battle.C.menPerFigure;
  for(const u of battle.units){
    if(u.state==='dead'||u.state==='gone') continue;
    const x=u.px+(u.x-u.px)*alpha,z=u.pz+(u.z-u.pz)*alpha; u.vx=x; u.vz=z;
    if(rn<400){ _m.makeTranslation(x,H(x,z)+.35,z); OB.rings.setMatrixAt(rn,_m); OB.rings.setColorAt(rn,u.state==='rout'?COL.rout:u.boss?COL.boss:COL[u.side]); rn++; }
    if(!showFigs) continue;
    const S=SOL[u.base]||SOL.yari; const n=Math.min(24,Math.ceil(u.men/per)); if(!n) continue;
    const rout=u.state==='rout',cols=u.base==='kiba'?3:4,sp=u.base==='kiba'?3.4:2.5,hd=rout?u.heading:u.heading;
    const ch=Math.cos(hd),sh=Math.sin(hd),col=rout?COL.rout:u.boss?COL.boss:COL[u.side];
    const rows=Math.ceil(n/cols);
    for(let i=0;i<n;i++){ if(S.n>=CAP) break;
      const r=Math.floor(i/cols),cN=Math.min(cols,n-r*cols),cI=i-r*cols;
      let lat=(cI-(cN-1)/2)*sp,fb=((rows-1)/2-r)*sp*.9; const j=(u.id*7.3+i*3.1);
      lat+=Math.sin(j)*.45; fb+=Math.cos(j*1.7)*.45; if(rout){ lat*=1.7; fb*=1.7; }
      if(u.engaged&&!rout) fb+=Math.max(0,Math.sin(t*5+j))*.9;
      const fx=x+ch*lat+sh*fb,fz=z-sh*lat+ch*fb;
      let y=H(fx,fz); if(u.moving||rout) y+=Math.abs(Math.sin(t*(u.base==='kiba'?9:7)+j))*.28;
      const fh=hd+(rout?Math.sin(j)*.6:0)+(u.engaged?Math.sin(t*3+j)*.15:0);
      setFig(S.tm,S.n,fx,y,fz,fh,1); setFig(S.nm,S.n,fx,y,fz,fh,1); S.tm.setColorAt(S.n,col); S.n++; figTotal++; }
  }
  for(const k in SOL){ const S=SOL[k]; S.tm.count=S.nm.count=S.n; if(S.n){ S.tm.instanceMatrix.needsUpdate=true; S.nm.instanceMatrix.needsUpdate=true; S.tm.instanceColor.needsUpdate=true; } }
  OB.rings.count=rn; if(rn){ OB.rings.instanceMatrix.needsUpdate=true; OB.rings.instanceColor.needsUpdate=true; }
}
/* 矢の一斉射ち */
const arrows=[];
function volley(a,b){ if(!showFigs) return; const n=Math.min(7,1+Math.ceil(a.men/90)); for(let i=0;i<n&&arrows.length<480;i++){ const ox=(Math.random()-.5)*8,oz=(Math.random()-.5)*8;
  const sx=a.x+ox*.5,sz=a.z+oz*.5,ex=b.x+ox,ez=b.z+oz; const d=Math.hypot(ex-sx,ez-sz); arrows.push({sx,sy:H(sx,sz)+3,sz,ex,ey:H(ex,ez)+.5,ez,t:-Math.random()*.25,T:.55+d/45,arc:d*.22}); } }
function drawArrows(dt){ let n=0; for(let i=arrows.length-1;i>=0;i--){ const A=arrows[i]; A.t+=dt; if(A.t>A.T){ arrows.splice(i,1); continue; } if(A.t<0) continue;
  const k=A.t/A.T,x=A.sx+(A.ex-A.sx)*k,z=A.sz+(A.ez-A.sz)*k,y=A.sy+(A.ey-A.sy)*k+A.arc*4*k*(1-k);
  const k2=Math.min(1,k+.02),x2=A.sx+(A.ex-A.sx)*k2,z2=A.sz+(A.ez-A.sz)*k2,y2=A.sy+(A.ey-A.sy)*k2+A.arc*4*k2*(1-k2);
  _v.set(x2-x,y2-y,z2-z).normalize(); _q.setFromUnitVectors(_z,_v); _m.compose(_v2.set(x,y,z),_q,_s); OB.arrowMesh.setMatrixAt(n++,_m); }
  OB.arrowMesh.count=n; if(n) OB.arrowMesh.instanceMatrix.needsUpdate=true; }

/* 落石の岩と土けむり */
const rockFx=[],dusts=[];
function dropRocks(x,z){ for(let i=0;i<14;i++){ const a=Math.random()*Math.PI*2,r=Math.random()*9; rockFx.push({x:x+Math.cos(a)*r,z:z+Math.sin(a)*r,t:-Math.random()*.25,T:.9,life:4,s:.7+Math.random()*.9,rx:Math.random()*6,ry:Math.random()*6}); } }
function dust(x,z,r){ const m=new THREE.Mesh(new THREE.RingGeometry(.5,3,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xa08a68,transparent:true,opacity:.7,depthWrite:false,fog:false})); m.position.set(x,H(x,z)+.6,z); m.renderOrder=3; IY.scene.add(m); dusts.push({m,t:0,r}); }
function drawRocks(dt){ if(!OB.rockMesh) return; let n=0; for(let i=rockFx.length-1;i>=0;i--){ const R=rockFx[i]; R.t+=dt; if(R.t>R.T+R.life){ rockFx.splice(i,1); continue; } if(R.t<0) continue;
    const k=Math.min(1,R.t/R.T),g=H(R.x,R.z),y=g+R.s*.6+(1-k*k)*28; _q.setFromEuler(new THREE.Euler(R.rx+R.t*(k<1?6:0),R.ry,0)); const sc=R.t>R.T+R.life-.6?Math.max(.01,(R.T+R.life-R.t)/.6)*R.s:R.s; _m.compose(_v2.set(R.x,y,R.z),_q,_s.set(sc,sc,sc)); OB.rockMesh.setMatrixAt(n++,_m); }
  _s.set(1,1,1); OB.rockMesh.count=n; if(n) OB.rockMesh.instanceMatrix.needsUpdate=true;
  for(let i=dusts.length-1;i>=0;i--){ const D=dusts[i]; D.t+=dt; const k=D.t/1.2; if(k>=1){ IY.scene.remove(D.m); D.m.geometry.dispose(); D.m.material.dispose(); dusts.splice(i,1); continue; } const sc=1+k*D.r/2.2; D.m.scale.set(sc,1,sc); D.m.material.opacity=.7*(1-k); } }

/* 進軍ルートを地面に薄く描く */
function drawRoutes(){ OB.routeLines=[]; for(const r of MAP.routes){ const pts=[]; for(let i=1;i<r.pts.length;i++){ const [ax,az]=r.pts[i-1],[bx,bz]=r.pts[i],L=Math.hypot(bx-ax,bz-az); for(let t=0;t<L;t+=2){ const x=ax+(bx-ax)*t/L,z=az+(bz-az)*t/L; pts.push(new THREE.Vector3(x,H(x,z)+.6,z)); } }
  const g=new THREE.BufferGeometry().setFromPoints(pts); const ln=new THREE.Line(g,new THREE.LineDashedMaterial({color:0xd0402c,dashSize:3,gapSize:2.2,transparent:true,opacity:.75,fog:false})); ln.computeLineDistances(); IY.scene.add(ln); OB.routeLines.push(ln); } }

/* ================= カメラ ================= */
const CAM=Object.assign({x:0,z:-40,yaw:-.55,dist:170,pitch:.9},MAP.camera||{}); let camY=null;
function placeCamera(dt){
  const K=MAP.keep; CAM.x=Math.max(K.x0,Math.min(K.x1,CAM.x)); CAM.z=Math.max(K.z0,Math.min(K.z1,CAM.z)); CAM.dist=Math.max(45,Math.min(330,CAM.dist));
  const p=.62+(CAM.dist-45)/285*.48, gy=H(CAM.x,CAM.z); camY=camY===null?gy:camY+(gy-camY)*Math.min(1,dt*4);
  const cam=IY.camera,cp=Math.cos(p),d=CAM.dist;
  cam.position.set(CAM.x+Math.sin(CAM.yaw)*cp*d,camY+Math.sin(p)*d,CAM.z+Math.cos(CAM.yaw)*cp*d);
  cam.lookAt(CAM.x,camY,CAM.z); if(cam.fov!==55){ cam.fov=55; cam.updateProjectionMatrix(); } }
function groundAt(sx,sy){ const cam=IY.camera; _v.set(sx/innerWidth*2-1,-(sy/innerHeight)*2+1,.5).unproject(cam).sub(cam.position).normalize(); const o=cam.position;
  let tp=0; for(let t=2;t<1400;t+=2){ const x=o.x+_v.x*t,y=o.y+_v.y*t,z=o.z+_v.z*t; if(y<=H(x,z)){ let a=tp,b=t; for(let i=0;i<12;i++){ const m=(a+b)/2,xm=o.x+_v.x*m,zm=o.z+_v.z*m; if(o.y+_v.y*m<=H(xm,zm)) b=m; else a=m; } return [o.x+_v.x*b,o.z+_v.z*b]; } tp=t; } return null; }
function project(x,y,z){ _v.set(x,y,z).project(IY.camera); if(_v.z>1) return null; return [(_v.x*.5+.5)*innerWidth,(-_v.y*.5+.5)*innerHeight]; }

/* ================= 画面 ================= */
const root=el('div'); root.id='obRoot'; document.body.appendChild(root);
root.innerHTML=`
<div id="obView"></div>
<div id="obMarks"></div>
<div id="obIcons"></div>
<header id="obTop">
  <div class="obBox obTitle"><b>${MAP.title}</b><span id="obGoal">${MAP.goal} <em id="obTime">--:--</em></span></div>
  <div id="obWave" class="obBox">出陣前</div>
  <div class="obBtns"><button id="obSnd" class="obBtn" aria-label="効果音">🔊</button><button id="obSpd" class="obBtn" aria-label="速さ">×1</button><button id="obPause" class="obBtn" aria-label="一時停止">❚❚</button></div>
</header>
<div id="obLines"></div>
<div id="obToast"></div>
<div id="obPaused" hidden><b>一時停止中</b><span>部隊のアイコンや下の札をタップして指示</span><button class="obBtn obGo" id="obResume">▶ 再開</button></div>
<div id="obPrompt" hidden><span id="obPromptT"></span><em id="obPromptI"></em><button class="obBtn obGo" id="obOK" disabled>決定</button><button class="obBtn" id="obHere" hidden>その場で守る</button><button class="obBtn" id="obCancel">やめる</button></div>
<section id="obOrder" hidden>
  <div class="obOH"><span id="obOName"></span><button class="obX" id="obOClose" aria-label="閉じる">✕</button></div>
  <div class="obOS" id="obOStat"></div>
  <div class="obOGrid">
    <button data-o="hold"><b>守備</b><small>その場や門を守る</small></button>
    <button data-o="reinforce"><b>援軍</b><small>味方のもとへ</small></button>
    <button data-o="intercept"><b>迎撃</b><small>敵の部隊を狙う</small></button>
    <button data-o="auto"><b>任せる</b><small>自分で判断</small></button>
    <button data-o="retreat"><b>退却</b><small>次の曲輪へ</small></button>
    <button data-o="skill" id="obSkillB" class="obSkill"><b>特技</b><small></small></button>
  </div>
</section>
<div id="obSaku"><div class="sg"><b>采配</b><span id="obSG"></span></div>
  <button data-s="kobu"><b>鼓舞</b><small>采配1</small></button><button data-s="rakuseki"><b>落石</b><small>采配2</small></button><button data-s="gate"><b>門を閉ざす</b><small>采配2</small></button></div>
<div id="obGates"></div>
<footer id="obCards"></footer>
<div id="obHud" hidden></div>
<section id="obModal" class="obModal" hidden></section>`;
const UI={sel:null,mode:null,pend:null,pauseManual:false,pauseOrder:false,speed:1,icons:new Map(),cards:new Map(),toastQ:[]};

/* 防衛線の表示 */
function buildLines(){ const L=$('obLines'); L.innerHTML=MAP.lines.map((l,i)=>`<span data-i="${i}">${l.short}</span>`).join('<i>›</i>')+'<i>›</i><span class="hon">本丸</span>'; }
function setLines(br){ $('obLines').querySelectorAll('span[data-i]').forEach(s=>{ const i=+s.dataset.i; s.classList.toggle('broken',i<br); s.classList.toggle('front',i===br); }); }

/* 部隊のアイコン */
const ORD={hold:'守',reinforce:'援',intercept:'迎',auto:'任',retreat:'退'};
function iconFor(u){ let ic=UI.icons.get(u.id); if(ic) return ic;
  ic=el('div','obU '+u.side+' t-'+u.base+(u.boss?' boss':''),`<span class="k">${T[u.type].short}</span><span class="n"></span><span class="m"><i></i></span>${u.side==='ally'?'<span class="o"></span>':''}${u.boss?'<span class="bs">大将</span>':''}`);
  ic.addEventListener('pointerdown',e=>{ e.stopPropagation(); ic._d=[e.clientX,e.clientY]; });
  ic.addEventListener('pointerup',e=>{ e.stopPropagation(); const d=ic._d; if(!d||Math.hypot(e.clientX-d[0],e.clientY-d[1])>14) return; tapUnit(u); });
  $('obIcons').appendChild(ic); UI.icons.set(u.id,ic); return ic; }
function updIcons(battle){
  for(const u of battle.units){ const ic=UI.icons.get(u.id); if(u.state==='dead'||u.state==='gone'){ if(ic){ ic.remove(); UI.icons.delete(u.id); } continue; }
    const x=u.vx!==undefined?u.vx:u.x,z=u.vz!==undefined?u.vz:u.z,p=project(x,H(x,z)+9,z),I=iconFor(u);
    if(!p||p[0]<-40||p[0]>innerWidth+40||p[1]<-40||p[1]>innerHeight+40){ if(I._v!==0){ I.style.display='none'; I._v=0; } continue; }
    if(I._v!==1){ I.style.display=''; I._v=1; }
    I.style.transform=`translate3d(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px,0)`;
    const men=u.men; if(I._men!==men){ I._men=men; I.children[1].textContent=men; }
    const mo=Math.round(u.morale/5)*5; if(I._mo!==mo){ I._mo=mo; I.children[2].firstChild.style.width=mo+'%'; I.classList.toggle('low',mo<35); }
    const bf=B&&((u.buff&&B.time<u.buff.until)||u.kobuUntil>B.time);
    const st=(bf?'b':'')+(u.state==='rout'?'r':'')+(u.flank?'f':'')+(u===UI.sel?'s':'')+(UI.mode==='intercept'&&u.side==='enemy'?'t':'')+(UI.mode==='reinforce'&&u.side==='ally'&&u!==UI.sel?'t':'');
    if(I._st!==st){ I._st=st; I.classList.toggle('rout',u.state==='rout'); I.classList.toggle('flank',!!u.flank); I.classList.toggle('sel',u===UI.sel); I.classList.toggle('target',st.includes('t')); I.classList.toggle('buff',st.includes('b')); }
    if(u.side==='ally'){ const o=u.state==='rout'?'走':ORD[u.order&&(u.order.retreat?'retreat':u.order.kind)]||''; if(I._o!==o){ I._o=o; I.querySelector('.o').textContent=o; } }
  } }
/* 下の札（味方の部隊） */
function buildCards(battle){ const C=$('obCards'); C.innerHTML=''; UI.cards.clear();
  for(const u of battle.units.filter(u=>u.side==='ally')){ const c=el('button','obCard t-'+u.base,`<span class="k">${T[u.type].short}</span><span class="nm">${u.name}</span><span class="n"></span><span class="m"><i></i></span><span class="od"></span>`);
    c.onclick=()=>tapUnit(u); C.appendChild(c); UI.cards.set(u.id,c); } }
function updCards(battle){ for(const u of battle.units){ const c=UI.cards.get(u.id); if(!c) continue;
  c.querySelector('.n').textContent=u.men+'人'; c.querySelector('.m i').style.width=Math.round(u.morale)+'%';
  c.classList.toggle('dead',u.state==='dead'); c.classList.toggle('rout',u.state==='rout'); c.classList.toggle('sel',u===UI.sel);
  c.querySelector('.od').textContent=u.state==='dead'?'壊滅':u.state==='rout'?'敗走中':orderText(u); } }
function orderText(u){ const o=u.order||{}; if(o.retreat) return '退却 → '+(o.slot?o.slot.name:''); if(o.kind==='hold') return '守備'+(o.slot?'：'+o.slot.name:''); if(o.kind==='reinforce') return '援軍 → '+(o.target?o.target.name:''); if(o.kind==='intercept') return '迎撃 → '+(o.target?T[o.target.type].name:''); if(o.kind==='auto') return '任せる'; return ''; }

/* 配置場所の札（守備の指示のときに出す） */
function buildMarks(){ const M=$('obMarks'); M.innerHTML=''; OB.marks=[];
  for(const s of MAP.slots){ const k=s.kind==='gate'?'門':s.kind==='yagura'?'櫓 弓の射程↑':'石垣 弓の射程↑'; const m=el('button','obMark k-'+s.kind,`◆ ${s.name}<small>${k}</small>`); m.onclick=e=>{ e.stopPropagation(); if(UI.mode==='hold'){ const sl=B.slots.find(q=>q.id===s.id); setPend({x:sl.pos[0],z:sl.pos[1],slot:sl}); } }; M.appendChild(m); OB.marks.push([s,m]); } }
function updMarks(){ const on=UI.mode==='hold'; $('obMarks').hidden=!on; if(!on) return; for(const [s,m] of OB.marks){ const p=project(s.pos[0],H(s.pos[0],s.pos[1])+2,s.pos[1]); if(!p){ m.style.display='none'; continue; } m.style.display=''; m.style.transform=`translate3d(${p[0]|0}px,${p[1]|0}px,0)`; } }

/* ================= 指示（時間を止める）・特技・策 =================
   行き先や相手をタップすると、まず移動ルートを地面に描いて見せ、「決定」で指示を出す */
const SKL=SIM.SKILLS,SAKU=SIM.SAKU;
function paused(){ return UI.pauseManual||UI.pauseOrder||!$('obModal').hidden||!B||B.state!=='run'; }
function tapUnit(u){
  if(!B||B.state!=='run') return;
  if(UI.mode==='reinforce'){ if(u.side==='ally'&&u!==UI.sel&&u.state!=='dead') setPend({target:u}); return; }
  if(UI.mode==='intercept'){ if(u.side==='enemy') setPend({target:u}); return; }
  if(UI.mode==='kobu'){ if(u.side==='ally'&&u.state!=='dead') setPend({target:u}); return; }
  if(UI.mode) return;
  if(u.side==='enemy'){ toast(`敵 ${u.name}（${T[u.type].name}）${u.men}人・士気${Math.round(u.morale)}${u.boss?'・大将':''}`,'info'); return; }
  if(u.state==='dead') return;
  if(u.state==='rout'){ toast(u.name+'は敗走中。立ち直るまで指示できない（策「鼓舞」で立ち直る）','info'); return; }
  sfx('click'); UI.sel=u; if(!UI.pauseManual) UI.pauseOrder=true; showOrder(); }
function showOrder(){ const u=UI.sel; $('obPrompt').hidden=true; $('obOrder').hidden=false;
  $('obOName').innerHTML=`<span class="k t-${u.base}">${T[u.type].short}</span>${u.name}${u.gen?'<small>（'+u.gen+'）</small>':''}`;
  const beat=T[SIM.BEATS[u.base]].name, lose=T[Object.keys(SIM.BEATS).find(k=>SIM.BEATS[k]===u.base)].name;
  $('obOStat').innerHTML=`${T[u.type].name} ${u.men}人 ・ 士気 ${Math.round(u.morale)} ・ ${orderText(u)}<br><small>${beat}に強い／${lose}に弱い</small>`;
  const S=B.skillOf(u),w=B.skillWait(u),act=B.buff(u,u.type),bt=$('obSkillB');
  bt.querySelector('b').textContent=S.name; bt.querySelector('small').textContent=act?'発動中':w>0?'あと'+Math.ceil(w)+'秒':'特技・使える'; bt.disabled=w>0; bt.title=S.text; }
const MODE_T={hold:'守る場所をタップ（◆の配置場所は地形の効果あり）',reinforce:'援軍に行く味方の部隊をタップ',intercept:'狙う敵の部隊をタップ',
  kobu:'鼓舞する味方の部隊をタップ',rakuseki:'石を落とす場所をタップ（赤い円の中の敵に効く）',gate:'閉じる門をタップ'};
function startMode(m){ UI.mode=m; UI.pend=null; clearPrev(); $('obOrder').hidden=true; $('obPrompt').hidden=false; $('obHere').hidden=m!=='hold';
  $('obPromptT').textContent=MODE_T[m]; $('obPromptI').textContent=''; $('obOK').disabled=true; sfx('click'); }
/* 選んだ行き先・相手を仮決めして、ルートを描く */
function setPend(p){ UI.pend=p; $('obOK').disabled=false; sfx('click'); drawPreview(); }
function confirmPend(){ const m=UI.mode,p=UI.pend; if(!m||!p) return; let ok=false;
  if(m==='hold') ok=B.order(UI.sel.id,{kind:'hold',x:p.x,z:p.z,slot:p.slot});
  else if(m==='reinforce') ok=B.order(UI.sel.id,{kind:'reinforce',target:p.target.id});
  else if(m==='intercept') ok=B.order(UI.sel.id,{kind:'intercept',target:p.target.id});
  else if(m==='kobu') ok=B.useSaku('kobu',{target:p.target.id});
  else if(m==='rakuseki') ok=B.useSaku('rakuseki',{x:p.x,z:p.z});
  else if(m==='gate') ok=B.useSaku('gate',{gate:p.gate});
  if(!ok) toast('その指示は出せない','info'); else if(UI.sel) sayOrder(m); finish(); }
function issue(o){ if(!UI.sel) return finish(); const ok=B.order(UI.sel.id,o); if(!ok) toast('その指示は出せない','info'); else sayOrder(o.kind); finish(); }
function finish(){ UI.mode=null; UI.pend=null; UI.sel=null; UI.pauseOrder=false; $('obOrder').hidden=true; $('obPrompt').hidden=true; clearPrev(); }
function sayOrder(k){ const u=UI.sel; if(!u) return; const t={hold:'守備につけ',reinforce:'援軍に向かえ',intercept:'迎え撃て',auto:'任せたぞ',retreat:'退け'}[k]; if(t) toast(u.name+'「'+t+'」','order'); sfx('hyoshigi'); }
function useSkill(){ const u=UI.sel; if(!u) return; if(B.useSkill(u.id)){ toast(`${u.name}「${B.skillOf(u).name}！」`,'order'); } finish(); }
function tapSaku(k){ if(!B||B.state!=='run'||bench) return; if(B.saihai<SAKU[k].cost){ toast(`采配が足りない（${SAKU[k].name}は${SAKU[k].cost}）。采配は時間とともにたまる`,'info'); return; }
  if(k==='gate'&&!B.gates.some(g=>B.gateOpenAt(g))){ toast('閉じられる門がない','info'); return; }
  finish(); UI.sel=null; if(!UI.pauseManual) UI.pauseOrder=true; startMode(k); $('obPromptT').textContent=SAKU[k].name+'：'+MODE_T[k]; }
$('obOrder').querySelectorAll('button[data-o]').forEach(b=>b.onclick=()=>{ const o=b.dataset.o; if(o==='skill') useSkill(); else if(o==='auto'||o==='retreat') issue({kind:o}); else startMode(o); });
$('obSaku').querySelectorAll('button[data-s]').forEach(b=>b.onclick=()=>tapSaku(b.dataset.s));
$('obOClose').onclick=finish; $('obCancel').onclick=finish; $('obOK').onclick=confirmPend;
$('obHere').onclick=()=>{ const u=UI.sel; if(u) issue({kind:'hold',x:u.x,z:u.z}); };
$('obPause').onclick=()=>{ if(!B||B.state!=='run') return; sfx('click'); UI.pauseManual=!UI.pauseManual; if(!UI.pauseManual) finish(); };
$('obResume').onclick=()=>{ UI.pauseManual=false; finish(); };
$('obSpd').onclick=()=>{ UI.speed=UI.speed===1?2:UI.speed===2?4:1; $('obSpd').textContent='×'+UI.speed; };
$('obSnd').onclick=()=>{ const on=SND.toggle(); $('obSnd').textContent=on?'🔊':'🔇'; if(on) sfx('click'); };
function tapGround(x,z){
  if(UI.mode==='hold'){ const sl=B.slotNear(x,z,9); setPend(sl?{x:sl.pos[0],z:sl.pos[1],slot:sl}:{x,z}); return; }
  if(UI.mode==='rakuseki'){ setPend({x,z}); return; }
  if(UI.mode==='gate'){ let b=-1,bd=18; B.gates.forEach((g,i)=>{ const d=Math.hypot(g.pos[0]-x,g.pos[1]-z); if(d<bd&&B.gateOpenAt(g)){ bd=d; b=i; } }); if(b>=0) setPend({gate:b}); return; }
  if(UI.sel&&!UI.mode) finish(); }

/* ---------- ルートの下見（地面に描く帯） ---------- */
const PREV=new THREE.Group(); PREV.renderOrder=20; IY.scene.add(PREV);
function clearPrev(){ for(const o of [...PREV.children]){ PREV.remove(o); o.geometry.dispose(); o.material.dispose(); } }
function ribbon(pts,w,color,op,arrow){ /* pts: [[x,z],...] を1.5m刻みにして地面の上に帯を作る */
  const P=[]; for(let i=1;i<pts.length;i++){ const [ax,az]=pts[i-1],[bx,bz]=pts[i],L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/1.5)); for(let k=(i===1?0:1);k<=n;k++) P.push([ax+(bx-ax)*k/n,az+(bz-az)*k/n]); }
  if(P.length<2) return; const pos=[],idx=[];
  for(let i=0;i<P.length;i++){ const a=P[Math.max(0,i-1)],c=P[Math.min(P.length-1,i+1)]; let dx=c[0]-a[0],dz=c[1]-a[1]; const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; const y=H(P[i][0],P[i][1])+.8;
    pos.push(P[i][0]-dz*w,y,P[i][1]+dx*w, P[i][0]+dz*w,y,P[i][1]-dx*w); if(i) idx.push(2*i-2,2*i-1,2*i, 2*i-1,2*i+1,2*i); }
  if(arrow){ const n=P.length-1,a=P[Math.max(0,n-2)],e=P[n]; let dx=e[0]-a[0],dz=e[1]-a[1]; const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; const y=H(e[0],e[1])+.9,b=pos.length/3;
    pos.push(e[0]-dz*w*2.6,y,e[1]+dx*w*2.6, e[0]+dz*w*2.6,y,e[1]-dx*w*2.6, e[0]+dx*w*3.4,y,e[1]+dz*w*3.4); idx.push(b,b+1,b+2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:op||.9,depthTest:false,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false})); m.renderOrder=20; m.frustumCulled=false; PREV.add(m); return P; }
function circle(x,z,r,color,w){ const pts=[]; for(let i=0;i<=40;i++){ const a=i/40*Math.PI*2; pts.push([x+Math.cos(a)*r,z+Math.sin(a)*r]); } ribbon(pts,w||.5,color,.85); }
function plen(P){ let L=0; for(let i=1;i<P.length;i++) L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]); return L; }
function drawPreview(){ clearPrev(); const m=UI.mode,p=UI.pend,u=UI.sel; if(!p) return; let info='';
  const gold=0xffcf5a,red=0xff5a40,blue=0x8fb7ff;
  if(u&&(m==='hold'||m==='reinforce'||m==='intercept')){
    const tx=p.target?p.target.x:p.x,tz=p.target?p.target.z:p.z;
    const path=[[u.x,u.z]].concat(SIM.navPath(B.nav,u.x,u.z,tx,tz,H)); ribbon(path,1.1,gold,.92,true);
    const sec=Math.round(plen(path)/T[u.type].speed*1.15);
    if(m==='intercept'){ const e=p.target; circle(e.x,e.z,7,red);
      /* 敵がこれから進む道（赤） */
      if(e.route){ const r=e.route,ahead=[[e.x,e.z]]; let L=0; for(let i=e.ri;i<r.pts.length&&L<70;i++){ const q=r.pts[i],pr=ahead[ahead.length-1]; L+=Math.hypot(q[0]-pr[0],q[1]-pr[1]); ahead.push(q); } if(ahead.length>1) ribbon(ahead,.7,red,.75,true); }
      const adv=SIM.BEATS[u.base]===e.base?'<b class="good">有利</b>':SIM.BEATS[e.base]===u.base?'<b class="bad">不利</b>':'互角';
      info=`${T[e.type].name} ${e.men}人（${adv}）・ぶつかるまで 約${sec}秒（敵も動きます）`; }
    else if(m==='reinforce'){ circle(tx,tz,7,blue); info=`${p.target.name}のもとへ・到着まで 約${sec}秒`; }
    else { circle(tx,tz,6,gold); info=(p.slot?`◆${p.slot.name}（${p.slot.kind==='gate'?'門':p.slot.kind==='yagura'?'櫓：弓の射程1.35倍':'石垣：弓の射程1.25倍'}）・`:'')+`到着まで 約${sec}秒`; } }
  else if(m==='rakuseki'){ circle(p.x,p.z,11,red,.7); const n=B.live('enemy').filter(e=>Math.hypot(e.x-p.x,e.z-p.z)<11).length; info=n?`いま円の中に敵 ${n}部隊`:'円の中に敵はいない（通り道に置くのも手）'; }
  else if(m==='gate'){ const g=B.gates[p.gate]; circle(g.pos[0],g.pos[1],g.r+3,red); info=`${g.name}を${B.C.gateTime}秒閉じる`; }
  else if(m==='kobu'){ const t=p.target; circle(t.x,t.z,7,blue); info=`${t.name}（士気${Math.round(t.morale)}${t.state==='rout'?'・敗走中':''}）`; }
  $('obPromptI').innerHTML=info; }

/* 門の札（閉じた門の耐久・門を選ぶとき） */
const GMK=[]; MAP.narrow&&MAP.narrow.forEach((g,i)=>{ const m=el('button','obGate',`<b>${g.name||'門'}</b><i><s></s></i>`); m.onclick=e=>{ e.stopPropagation(); if(UI.mode==='gate'&&B&&B.gateOpenAt(B.gates[i])) setPend({gate:i}); }; m.style.display='none'; $('obGates').appendChild(m); GMK.push(m); });
function updGates(){ if(!B||bench){ for(const m of GMK) m.style.display='none'; return; }
  B.gates.forEach((g,i)=>{ const m=GMK[i],closed=!B.gateOpenAt(g),show=closed||UI.mode==='gate'; if(!show){ m.style.display='none'; return; }
    const p=project(g.pos[0],H(g.pos[0],g.pos[1])+5,g.pos[1]); if(!p){ m.style.display='none'; return; } m.style.display=''; m.style.transform=`translate3d(${p[0]|0}px,${p[1]|0}px,0)`;
    m.classList.toggle('closed',closed); m.classList.toggle('pick',UI.mode==='gate'&&!closed); m.querySelector('s').style.width=closed?Math.max(0,g.hp)/B.C.gateHP*100+'%':'0';
    m.querySelector('b').textContent=(closed?'閉 ':'')+g.name+(closed?' '+Math.ceil(g.until-B.time)+'秒':''); }); }
function updSaku(){ if(!B||bench) return; const v=B.saihai,mx=B.C.saihaiMax; let h=''; for(let i=0;i<mx;i++){ const f=Math.max(0,Math.min(1,v-i)); h+=`<i style="--f:${f}"></i>`; } const G=$('obSG'); if(G._v!==h){ G._v=h; G.innerHTML=h; }
  $('obSaku').querySelectorAll('button[data-s]').forEach(b=>b.classList.toggle('off',v<SAKU[b.dataset.s].cost)); }

/* ================= 効果音（音のファイルを使わず、その場で合成する） ================= */
const SND=(()=>{ let ctx=null,master=null,noise=null,on=true; try{ on=localStorage.getItem('oshiroBattle.snd')!=='off'; }catch(e){}
  const last={};
  function init(){ try{ if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; } const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC();
    master=ctx.createGain(); master.gain.value=on?.75:0; const comp=ctx.createDynamicsCompressor(); master.connect(comp).connect(ctx.destination);
    const len=ctx.sampleRate*2; noise=ctx.createBuffer(1,len,ctx.sampleRate); const d=noise.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    const b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource(); s.buffer=b; s.connect(ctx.destination); s.start(0); }catch(e){} }
  /* iPhoneは画面に触れたときにしか音を出せないので、最初のタッチで準備する */
  for(const ev of ['pointerdown','touchend','keydown']) addEventListener(ev,init,{capture:true,passive:true});
  const E=(g,t,a,pk,dec)=>{ g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(.0002,pk),t+a); g.gain.exponentialRampToValueAtTime(.0001,t+a+dec); };
  function osc(type,f,t,dur,pk,f2,a){ a=a||.004; const o=ctx.createOscillator(),g=ctx.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+a+dur); E(g,t,a,pk,dur); o.connect(g).connect(master); o.start(t); o.stop(t+a+dur+.05); }
  function nz(t,dur,pk,type,f,q,f2,a){ a=a||.003; const s=ctx.createBufferSource(); s.buffer=noise; const fl=ctx.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t+a+dur); fl.Q.value=q||1; const g=ctx.createGain(); E(g,t,a,pk,dur); s.connect(fl).connect(g).connect(master); s.start(t,Math.random()*1.4); s.stop(t+a+dur+.05); }
  const S={
    taiko(d,v){ const t=ctx.currentTime+(d||0); v=v||1; osc('sine',105,t,.6,.95*v,44); osc('sine',180,t,.12,.25*v,90); nz(t,.1,.35*v,'lowpass',500,1); },
    horagai(dur,v){ const t=ctx.currentTime; dur=dur||1.7; v=v||1; const fl=ctx.createBiquadFilter(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain(); fl.type='lowpass'; fl.frequency.value=900; fl.Q.value=3;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.32*v,t+.3); g.gain.setValueAtTime(.32*v,t+dur*.75); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      l.frequency.value=5.5; lg.gain.value=3; l.connect(lg); for(const [m,k] of [[1,1],[2.005,.35]]){ const o=ctx.createOscillator(),og=ctx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(185*m,t); o.frequency.linearRampToValueAtTime(220*m,t+.35); o.frequency.setValueAtTime(220*m,t+dur*.7); o.frequency.linearRampToValueAtTime(196*m,t+dur); lg.connect(o.frequency); og.gain.value=k; o.connect(og).connect(fl); o.start(t); o.stop(t+dur+.05); }
      fl.connect(g).connect(master); l.start(t); l.stop(t+dur+.05); },
    bell(d,f,v){ const t=ctx.currentTime+(d||0); f=f||560; v=v||1; osc('sine',f,t,2.2,.32*v); osc('sine',f*2.76,t,1.2,.12*v); osc('sine',f*5.4,t,.6,.06*v); nz(t,.03,.15*v,'highpass',3000,1); },
    hyoshigi(){ const t=ctx.currentTime; for(const d of [0,.14]){ osc('triangle',2100,t+d,.07,.45,1500); nz(t+d,.05,.3,'bandpass',2600,6); } },
    click(){ const t=ctx.currentTime; osc('sine',1100,t,.04,.12,700); },
    arrow(v){ const t=ctx.currentTime; v=v||1; nz(t,.34,.22*v,'bandpass',3600,2.5,900,.02); nz(t+.3,.05,.12*v,'lowpass',900,1); },
    clash(v){ const t=ctx.currentTime; v=v||1; const f=900+Math.random()*500; for(const [m,k] of [[1,.22],[2.71,.12],[4.1,.07]]) osc('sine',f*m,t,.16,k*v); nz(t,.05,.25*v,'highpass',2500,1); nz(t,.18,.12*v,'lowpass',700,1); },
    rumble(){ const t=ctx.currentTime; nz(t,1.4,.7,'lowpass',260,1,120,.08); for(const d of [.05,.25,.5,.8]) S.taiko(d,.55); },
    gate(){ const t=ctx.currentTime; osc('sine',72,t,.5,.9,38); nz(t,.25,.5,'lowpass',700,1); osc('triangle',900,t+.02,.05,.2,500); },
    gateBreak(){ const t=ctx.currentTime; nz(t,.9,.8,'lowpass',1200,1,200,.01); osc('sine',60,t,.7,.9,30); },
    rout(){ const t=ctx.currentTime; osc('sine',150,t,.7,.5,60); },
    charge(){ S.taiko(0,.9); S.taiko(.12,.9); const t=ctx.currentTime; nz(t,.6,.25,'bandpass',500,1,2200,.05); },
    win(){ for(const d of [0,.35,.7,.85,1.0,1.4]) S.taiko(d,1); setTimeout(()=>S.horagai(2.2,1),1700); },
    lose(){ for(const d of [0,1.3,2.6]) S.bell(d,330,1.1); }
  };
  return { play(k,a,b,c){ if(!ctx||!on||!S[k]) return; try{ S[k](a,b,c); }catch(e){} },
    ok(k,gap){ if(!ctx||!on) return false; const t=ctx.currentTime; if(last[k]!==undefined&&t-last[k]<gap) return false; last[k]=t; return true; },
    toggle(){ on=!on; try{ localStorage.setItem('oshiroBattle.snd',on?'on':'off'); }catch(e){} init(); if(master) master.gain.value=on?.75:0; return on; }, get on(){ return on; } };
})();
function sfx(k,gap,a,b){ if(SND.ok(k,gap||0)) SND.play(k,a,b); }
const vol=()=>Math.max(.25,Math.min(1,140/CAM.dist));

/* ================= 画面の操作（ドラッグで移動・2本指で拡大と回転） ================= */
{ const V=$('obView'),pts=new Map(); let tap=null,last=null;
  V.addEventListener('pointerdown',e=>{ try{ V.setPointerCapture(e.pointerId); }catch(_){} pts.set(e.pointerId,{x:e.clientX,y:e.clientY,b:e.button,sh:e.shiftKey}); if(pts.size===1) tap={x:e.clientX,y:e.clientY,t:performance.now()}; else tap=null; last=null; });
  V.addEventListener('pointermove',e=>{ const p=pts.get(e.pointerId); if(!p) return; const k=CAM.dist*1.1/innerHeight;
    if(pts.size===1){ const dx=e.clientX-p.x,dy=e.clientY-p.y; if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>9) tap=null;
      if(p.b===2||p.sh){ CAM.yaw-=dx*.006; }
      else { const c=Math.cos(CAM.yaw),s=Math.sin(CAM.yaw); CAM.x-=(c*dx+s*dy*1.3)*k; CAM.z-=(-s*dx+c*dy*1.3)*k; } }
    p.x=e.clientX; p.y=e.clientY;
    if(pts.size===2){ const [a,b]=[...pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y),ang=Math.atan2(b.y-a.y,b.x-a.x),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      if(last){ CAM.dist*=last.d/d; let da=ang-last.a; if(da>Math.PI) da-=2*Math.PI; if(da<-Math.PI) da+=2*Math.PI; CAM.yaw-=da; const dx=mx-last.mx,dy=my-last.my,c=Math.cos(CAM.yaw),s=Math.sin(CAM.yaw); CAM.x-=(c*dx+s*dy*1.3)*k; CAM.z-=(-s*dx+c*dy*1.3)*k; }
      last={d,a:ang,mx,my}; } });
  const up=e=>{ const had=pts.has(e.pointerId); pts.delete(e.pointerId); last=null; if(!had) return;
    if(tap&&pts.size===0&&performance.now()-tap.t<450){ const g=groundAt(e.clientX,e.clientY); if(g) tapGround(g[0],g[1]); } tap=null; };
  V.addEventListener('pointerup',up); V.addEventListener('pointercancel',up);
  V.addEventListener('wheel',e=>{ e.preventDefault(); CAM.dist*=Math.exp(e.deltaY*.0012); },{passive:false});
  V.addEventListener('contextmenu',e=>e.preventDefault());
  addEventListener('keydown',e=>{ if(e.code==='Space'){ $('obPause').click(); e.preventDefault(); } if(e.key==='q') CAM.yaw+=.1; if(e.key==='e') CAM.yaw-=.1; });
}
/* ================= お知らせ ================= */
function toast(msg,kind){ const t=$('obToast'),d=el('div','obT '+(kind||''),msg); t.appendChild(d); while(t.children.length>4) t.firstChild.remove(); setTimeout(()=>d.classList.add('out'),kind==='big'?3800:2600); setTimeout(()=>d.remove(),kind==='big'?4600:3300); }
function onEvents(b){
  for(const e of b.events.splice(0)){
    if(e.k==='volley'){ volley(e.a,e.b); if(!bench) sfx('arrow',.22,vol()*(e.a.side==='ally'?1:.75)); }
    else if(e.k==='skill'){ sfx(e.u.base==='kiba'?'charge':'taiko'); }
    else if(e.k==='chargeHit'){ sfx('clash',.1,1); sfx('taiko',.2,0,.7); }
    else if(e.k==='saku'){ if(e.kind==='kobu'){ sfx('taiko'); sfx('horagai',0,.8,.6); toast('鼓舞！士気が上がった','good'); } else if(e.kind==='rakuseki'){ dropRocks(e.a.x,e.a.z); sfx('taiko'); } else if(e.kind==='gate'){ sfx('gate'); toast(`${B.gates[e.a.gate].name}を閉ざした`,'good'); } }
    else if(e.k==='rock'){ dust(e.x,e.z,e.r); sfx('rumble'); if(e.hits) toast(`落石！敵${e.hits}部隊に当たった`,'good'); }
    else if(e.k==='gateBroken'&&!bench){ sfx('gateBreak'); toast(`${e.g.name}が破られた！`,'warn'); }
    else if(e.k==='gateOpen'&&!bench){ sfx('gate'); toast(`${e.g.name}が開いた`,'info'); }
    else if(e.k==='wave'){ sfx('horagai'); sfx('taiko',0,1.6); toast(`<b>第${'一二三四五'[e.i]}波　${e.label}</b>${e.text||''}`,'big'); }
    else if(e.k==='boss'&&!bench){ sfx('horagai',3,2.4,1); toast(`敵の大将 <b>${e.u.gen||e.u.name}</b> 出陣${MAP.enemy.boss&&MAP.enemy.boss.skill?'（特技：'+MAP.enemy.boss.skill.name+'）':''}`,'warn'); }
    else if(e.k==='line'&&!bench){ for(const d of [0,.35,.7]) SND.play('bell',d,700,.9); toast(`防衛線「${e.name}」を破られた！`,'warn'); setLines(e.i); }
    else if(e.k==='rout'&&!bench){ sfx(e.u.side==='ally'?'rout':'taiko',.3); toast(e.u.side==='ally'?`${e.u.name}が敗走！`:`敵の${T[e.u.type].name}が敗走`,e.u.side==='ally'?'warn':'good'); }
    else if(e.k==='rally'&&!bench){ toast(`${e.u.name}が立ち直った`,'info'); }
    else if(e.k==='dead'&&!bench){ if(e.u.side==='ally') toast(`${e.u.name}が壊滅…`,'warn'); }
    else if(e.k==='bossdown'&&!bench){ sfx('taiko'); sfx('taiko',0,.25); sfx('horagai',0,2); toast(`<b>${e.u.gen||e.u.name}の本隊が崩れた！</b>敵の士気が下がる`,'big good'); }
    else if(e.k==='end'&&!bench){ SND.play(e.r==='win'?'win':'lose'); setTimeout(()=>showResult(),1400); }
  } }

/* ================= 合戦の流れ ================= */
let B=null,bench=null,sunsetDone=false,simMs=0;
const STORE='oshiroBattle.v1';
function loadSave(){ try{ return JSON.parse(localStorage.getItem(STORE)||'{}'); }catch(e){ return {}; } }
function saveSave(s){ try{ localStorage.setItem(STORE,JSON.stringify(s)); }catch(e){} }
function clearUnits(){ for(const ic of UI.icons.values()) ic.remove(); UI.icons.clear(); arrows.length=0; }
function startBattle(){
  Object.assign(CAM,MAP.camera||{});
  clearUnits(); bench=null; sunsetDone=false; IY.applyTime(1); OB.shadowDirty=3;
  B=new SIM.Battle(MAP,{army:MAP.army,h:H});
  buildCards(B); buildLines(); setLines(0); $('obModal').hidden=true; $('obCards').hidden=false; $('obLines').hidden=false; $('obHud').hidden=!QS.has('hud');
  UI.pauseManual=false; finish(); toast(`<b>${MAP.title}</b>${MAP.goal}！`,'big'); $('obSnd').textContent=SND.on?'🔊':'🔇'; sfx('horagai'); sfx('taiko',0,1.5);
}
function showBrief(){
  Object.assign(CAM,{x:-4,z:-95,dist:215});
  const cap=SIM.capOf(MAP),E=MAP.enemy,cnt={};
  for(const w of E.waves) for(const u of w.units) cnt[u.type]=(cnt[u.type]||0)+u.men;
  const tot=Object.values(cnt).reduce((a,b)=>a+b,0);
  const mix=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).map(k=>`<span class="k t-${k}">${T[k].short}</span>${T[k].name} ${Math.round(cnt[k]/tot*100)}%`).join('　');
  const role=t=>({yari:'騎馬に強い・弓に弱い。門で敵を食い止める',yumi:'足軽に強い・騎馬に弱い。櫓や石垣の上で射程がのびる',kiba:'弓に強い・足軽に弱い。足が速い。狭い門では弱い'})[t];
  const M=$('obModal'); M.hidden=false; M.innerHTML=`<div class="obSheet">
  <p class="obEra">第${MAP.stage}の城　${MAP.castle}</p><h1>${MAP.title}</h1><p class="obSub">${MAP.era}</p>
  <div class="obCond"><div><small>勝利</small><b>${MAP.goal}</b>（${Math.round(MAP.duration/60)}分）</div><div><small>敗北</small><b>本丸に敵が入る</b></div></div>
  <h2>我が軍　<small>${MAP.army.length}部隊／上限${cap}（入口${MAP.gates.length}＋${MAP.capBonus}）</small></h2>
  <ul class="obArmy">${MAP.army.map(a=>`<li><span class="k t-${a.type}">${T[a.type].short}</span><b>${a.name}</b>${T[a.type].name} ${a.men}人<small>${role(a.type)}</small></li>`).join('')}</ul>
  <p class="obGen">担当武将 <b>${MAP.general.name}</b>（${MAP.general.title}）特技「${MAP.general.skill.name}」${MAP.general.skill.text}</p>
  <h2>敵の傾向　<small>${E.side}・${E.waves.length}波</small></h2>
  <p class="obMix">${mix}</p><p>${E.trend}。大将 <b>${E.boss.name}</b>（特技「${E.boss.skill.name}」${E.boss.skill.text}）</p>
  <div class="obRps"><span class="k t-yari">槍</span>→<span class="k t-kiba">騎</span>→<span class="k t-yumi">弓</span>→<span class="k t-yari">槍</span><small>矢印の先に強い（有利1.5倍・不利0.6倍）。不利な相手や挟み撃ちで士気が下がり、0になると敗走</small></div>
  <p class="obHow">部隊のアイコン（下の札）をタップすると<b>時間が止まり</b>、指示を出せます。行き先や相手をタップすると再開。まとめて指示するときは右上の ❚❚。赤い点線が敵の進軍ルートです。<br>部隊ごとの<b>特技</b>と、采配を使う<b>策</b>（鼓舞・落石・門を閉ざす）も使いこなそう。右上の🔊で効果音のオン・オフ。</p>
  <div class="obAct"><button class="obBtn obGo" id="obStart">出陣</button><button class="obBtn" id="obBackSt">城選びへ戻る</button><button class="obBtn" id="obBenchBtn">負荷テスト</button></div></div>`;
  $('obStart').onclick=startBattle; $('obBackSt').onclick=goStages; $('obBenchBtn').onclick=showBenchSetup;
}
function showResult(){
  const r=B.result(),cap=SIM.capOf(MAP),nx=SIM.nextArmy(r,cap),win=r.state==='win',lossP=Math.round(nx.lossRate*100);
  const sv=loadSave(); sv[MAP.id]=Object.assign(sv[MAP.id]||{},{played:(sv[MAP.id]&&sv[MAP.id].played||0)+1}); if(win){ sv[MAP.id].cleared=true; sv[MAP.id].bestLoss=Math.min(sv[MAP.id].bestLoss===undefined?100:sv[MAP.id].bestLoss,lossP); sv.army=nx.army.map(a=>({id:a.id,gen:a.gen,name:a.name,type:a.type,men:a.menNext})); sv.next=MAP.next&&MAP.next.castle; } saveSave(sv);
  if(win) IY.applyTime(MAP.goal.includes('日没')?3:2); OB.shadowDirty=3;
  const M=$('obModal'); M.hidden=false; $('obOrder').hidden=true; $('obPrompt').hidden=true;
  M.innerHTML=`<div class="obSheet ${win?'win':'lose'}"><p class="obEra">${MAP.castle}</p><h1>${win?'勝利':'落城'}</h1><p class="obSub">${r.why}（${fmt(r.time)}）</p>
  <div class="obCond"><div><small>味方の損害</small><b>${lossP}%</b>（${r.allyLost}／${r.allyMen0}人）</div><div><small>敵の損害</small><b>${r.enemyLost}人</b>／${r.enemyMen}人</div><div><small>押された所</small><b>${r.breached?MAP.lines[r.breached-1].short+'まで':'防衛線は無事'}</b></div></div>
  ${win?`<h2>次の合戦（${MAP.next?MAP.next.castle:''}）への持ち越し</h2>
  <table class="obTab"><tr><th>部隊</th><th>合戦前</th><th>残り</th><th>合流</th><th>後詰め</th><th>次</th></tr>${nx.army.map(a=>{ const o=r.army.find(q=>q.id===a.id); return `<tr><td><span class="k t-${a.type}">${T[a.type].short}</span>${a.name}${a.isNew?' <em>新</em>':''}</td><td>${o?o.men0:'-'}</td><td>${a.isNew?'-':a.left}</td><td>${a.join?'+'+a.join:'-'}</td><td>+${a.reinf||0}</td><td><b>${a.menNext}</b></td></tr>`; }).join('')}</table>
  <p class="obNote">${nx.notes.join('<br>')||'損害が2割以下なら、次の城で部隊が1つ増えます'}<br>次の城の部隊の上限は「入口の数＋補正」で決まります。敵の兵数も城ごとに増えます。</p>`:
  `<p class="obNote">本丸までの道は大手と搦手の2つ。三すくみを見て、門で足止めしながら弓で削るのがコツです。</p>`}
  <div class="obAct"><button class="obBtn obGo" id="obAgain">もう一度</button><button class="obBtn" id="obToBrief">出陣前の画面へ</button><button class="obBtn" id="obToSt">城選びへ</button></div></div>`;
  $('obAgain').onclick=startBattle; $('obToBrief').onclick=()=>{ leaveBattle(); showBrief(); }; $('obToSt').onclick=goStages;
}

/* ================= タイトル・城選び・遊び方（お城さんぽとは別のゲームとしての入口） ================= */
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ゲームの入口（タイトル・城選び）は defence-castle リポジトリの index.html */
const GAME=window.OB_GAME_URL||'/defence-castle/';
function leaveBattle(){ B=null; bench=null; clearUnits(); IY.applyTime(1); OB.shadowDirty=3; }
function goStages(){ location.href=GAME+'#stages'; }
function goTitle(){ location.href=GAME; }

/* ================= 負荷テスト（iPhoneで何部隊まで快適に動くか） ================= */
const BEN={ally:6,enemy:20,men:400,auto:false,step:0,log:[],res:null};
function showBenchSetup(){
  const M=$('obModal'); M.hidden=false; M.innerHTML=`<div class="obSheet"><p class="obEra">確認用</p><h1>負荷テスト</h1>
  <p class="obSub">味方・敵の部隊を増やして、この端末で何部隊まで快適に動くかを測ります。兵100人＝兵士1体（1部隊の表示は最大24体）。</p>
  <label class="obRange">味方の部隊 <b id="bvA">${BEN.ally}</b><input id="biA" type="range" min="1" max="40" value="${BEN.ally}"></label>
  <label class="obRange">敵の部隊 <b id="bvE">${BEN.enemy}</b><input id="biE" type="range" min="1" max="120" value="${BEN.enemy}"></label>
  <label class="obRange">1部隊の兵数 <b id="bvM">${BEN.men}</b><input id="biM" type="range" min="100" max="2400" step="100" value="${BEN.men}"></label>
  <p class="obNote">「自動で測る」は、毎秒の描画回数（fps）が下がるまで部隊を少しずつ増やし、快適（45fps以上）と、遊べる（30fps以上）の上限を出します。低電力モードがオンだと30fpsまでしか出ません。</p>
  <div class="obAct"><button class="obBtn obGo" id="bGo">この数で動かす</button><button class="obBtn obGo" id="bAuto">自動で測る</button><button class="obBtn" id="bBack">戻る</button></div></div>`;
  for(const [i,v,k] of [['biA','bvA','ally'],['biE','bvE','enemy'],['biM','bvM','men']]) $(i).oninput=e=>{ BEN[k]=+e.target.value; $(v).textContent=BEN[k]; };
  $('bGo').onclick=()=>startBench(false); $('bAuto').onclick=()=>startBench(true); $('bBack').onclick=showBrief;
}
function startBench(auto){
  clearUnits(); IY.applyTime(1); OB.shadowDirty=3;
  B=new SIM.Battle(MAP,{army:[],h:H,waves:[],duration:1e9}); B.checkEnd=function(){}; bench={t:0,auto,phase:0,last:0,res:null};
  BEN.auto=auto; if(auto){ BEN.ally=4; BEN.enemy=8; BEN.log=[]; }
  $('obModal').hidden=true; $('obCards').hidden=true; $('obLines').hidden=true; $('obHud').hidden=false; $('obWave').textContent='負荷テスト';
  const H2=$('obHud'); H2.innerHTML='<pre id="obHudT"></pre><div class="obAct"><button class="obBtn" id="bFig">兵士の表示 ON</button><button class="obBtn" id="bEnd">終わる</button></div>';
  $('bFig').onclick=()=>{ showFigs=!showFigs; $('bFig').textContent='兵士の表示 '+(showFigs?'ON':'OFF'); };
  $('bEnd').onclick=()=>{ bench=null; leaveBattle(); showFigs=true; $('obHud').hidden=true; showBenchSetup(); };
}
function benchKeep(dt){
  const A=B.live('ally'),E=B.live('enemy'),types=['yari','yumi','kiba'];
  for(const e of E) if(e.route&&e.s>=e.route.len-4) e.state='gone';
  for(const u of B.units) if(u.side==='ally'&&u.state==='rout') u.morale=100;
  for(let i=A.length;i<BEN.ally;i++){ const s=MAP.slots[A.length%MAP.slots.length],k=Math.floor(A.length/MAP.slots.length); const u=B.addAlly({id:'b'+B.nextId,name:'味方'+(A.length+1),type:types[A.length%3],men:BEN.men,slot:s.id,dx:(k%3-1)*9,dz:Math.floor(k/3)*9}); B.order(u.id,{kind:'auto'}); A.push(u); }
  if(A.length>BEN.ally){ A[A.length-1].state='gone'; }
  const n=E.length; if(n<BEN.enemy&&(bench.spawnT=(bench.spawnT||0)-dt)<=0){ const r=MAP.routes[n%MAP.routes.length]; B.spawnEnemy({route:r.id,type:types[(n*7)%3],men:BEN.men},0); bench.spawnT=.12; }
  else if(n>BEN.enemy){ E[E.length-1].state='gone'; }
  B.units=B.units.filter(u=>u.state!=='gone'&&u.state!=='dead'||UI.icons.has(u.id));
}
/* fps の計測 */
const FT=[]; let lastNow=0;
function fpsOf(sec){ const now=performance.now(); let n=0,sum=0; for(let i=FT.length-1;i>=0;i--){ if(now-FT[i][0]>sec*1000) break; sum+=FT[i][1]; n++; } return n?1000/(sum/n):0; }
function benchAuto(dt){ const b=bench; b.t+=dt; if(b.res) return;
  if(b.t-b.last>6){ b.last=b.t; const f=fpsOf(4),A=B.live('ally').length,E=B.live('enemy').length; BEN.log.push({A,E,fig:figTotal,fps:Math.round(f)});
    if(f>=45) b.ok45={A,E,fig:figTotal,fps:Math.round(f)}; if(f>=30) b.ok30={A,E,fig:figTotal,fps:Math.round(f)};
    if(f<30||BEN.enemy>=120){ b.res=true; const r45=b.ok45,r30=b.ok30;
      toast(`<b>測定おわり</b>快適（45fps以上）: ${r45?`味方${r45.A}・敵${r45.E}部隊（兵士${r45.fig}体）`:'—'}<br>遊べる（30fps以上）: ${r30?`味方${r30.A}・敵${r30.E}部隊（兵士${r30.fig}体）`:'—'}`,'big');
      b.summary={r45,r30,log:BEN.log}; return; }
    BEN.enemy=Math.min(120,BEN.enemy+(f>55?10:5)); BEN.ally=Math.min(40,BEN.ally+(f>55?3:1)); } }
function hudText(){ const r=IY.renderer.info.render,P=window.OshiroPerf;
  const A=B?B.live('ally').length:0,E=B?B.live('enemy').length:0;
  let s=`fps ${fpsOf(1).toFixed(0)}（4秒平均 ${fpsOf(4).toFixed(0)}）\n部隊 味方${A}・敵${E}　兵士 ${figTotal}体\n描画 ${r.calls}回・${(r.triangles/1000).toFixed(0)}k三角形\n計算 ${simMs.toFixed(2)}ms/フレーム　画素 ${IY.renderer.getPixelRatio().toFixed(2)}倍${P?'　軽量化Lv'+P.level:''}`;
  if(bench&&bench.auto) s+=`\n自動測定中… 6秒ごとに増やします`;
  if(bench&&bench.summary){ const {r45,r30}=bench.summary; s+=`\n―― 結果 ――\n快適45fps: ${r45?`味方${r45.A}・敵${r45.E}（${r45.fig}体）`:'—'}\n遊べる30fps: ${r30?`味方${r30.A}・敵${r30.E}（${r30.fig}体）`:'—'}`; }
  if(OB.lightInfo) s+=`\n軽量化 ${OB.lightInfo.trisCut} 三角形を削減`;
  return s; }

/* ================= 毎フレーム ================= */
let clock=0,pingT=0,hudT=0,clashT=0;
function frame(dt,now){
  if(lastNow){ FT.push([now,now-lastNow]); if(FT.length>600) FT.splice(0,FT.length-600); } lastNow=now;
  clock+=dt;
  const t0=performance.now();
  if(B&&!paused()){ const sdt=dt*UI.speed; if(bench){ benchKeep(dt); if(bench.auto) benchAuto(dt); } B.step(sdt); onEvents(B);
    if(!bench&&!sunsetDone&&MAP.sunset&&B.time>=B.duration*MAP.sunset.at){ sunsetDone=true; IY.applyTime(2); OB.shadowDirty=3; toast('日が傾いてきた。あと少し持ちこたえろ','info'); } }
  if(B&&B.state!=='run'&&B.events.length) onEvents(B);
  simMs=simMs*.9+(performance.now()-t0)*.1;
  /* 動いている間は perf.js の「止まっている」判定（毎秒20回に落とす）を起こさない */
  if(B&&!paused()&&!bench&&(clashT-=dt)<=0){ clashT=.3+Math.random()*.35; let n=0; for(const u of B.units) if(u.engaged&&T[u.type].melee&&u.state!=='dead'&&u.state!=='gone') n++; if(n) sfx('clash',0,vol()*Math.min(1,.45+n*.12)); }
  drawRocks(paused()?0:dt*UI.speed);
  if(B&&!paused()&&(pingT-=dt)<=0){ pingT=.4; try{ dispatchEvent(new Event('wheel')); }catch(e){} }
  if(!B&&!reduceMotion){ CAM.yaw+=dt*.045; }
  root.classList.toggle('inMenu',!B);
  placeCamera(dt);
  const alpha=B?Math.min(1,B.acc/B.C.tick):1;
  if(B){ drawSoldiers(B,paused()?1:alpha,clock); drawArrows(paused()?0:dt*UI.speed); }
  else { for(const k in SOL) SOL[k].tm.count=SOL[k].nm.count=0; OB.rings.count=0; OB.arrowMesh.count=0; }
  /* 画面 */
  root.classList.toggle('isPaused',!!B&&paused()&&$('obModal').hidden);
  $('obPaused').hidden=!(UI.pauseManual&&B&&B.state==='run'&&!UI.sel&&!UI.mode);
}
let hudT2=0;
function after(dt){
  if(B){ updIcons(B); if(!bench) updCards(B); }
  updMarks(); updGates(); updSaku();
  if(B&&UI.sel&&!$('obOrder').hidden&&((hudT2-=dt)<=0)){ hudT2=.5; showOrder(); }
  $('obSaku').hidden=!B||!!bench;
  if(B&&!bench){ const left=B.duration-B.time; $('obTime').textContent=fmt(left); const w=B.waveNow; const nx=B.waves.find(q=>!q.spawned);
    $('obWave').innerHTML=w<0?`敵の接近まで ${fmt(nx.t-B.time)}`:`第${'一二三四五'[w]}波 ${B.waves[w].label}${nx?`<small>次の波 ${fmt(nx.t-B.time)}</small>`:'<small>最後の波</small>'}`; }
  if(!$('obHud').hidden&&(hudT-=dt)<=0){ hudT=.5; const t=$('obHudT')||(()=>{ const p=el('pre'); p.id='obHudT'; $('obHud').prepend(p); return p; })(); t.textContent=hudText(); }
}

/* ================= はじめる ================= */
lighten(); makeSoldiers(); drawRoutes(); buildMarks(); buildLines();
document.documentElement.classList.add('obready');
OB.ready=true;
document.title='戦国・城ディフェンス（仮）';
if(QS.has('bench')) showBenchSetup(); else showBrief();
OB.debug={get B(){ return B; },UI,CAM,tapGround,confirmPend,tapSaku,tapUnit,SND,startBattle,startBench,BEN,get bench(){ return bench; },fpsOf,get figTotal(){ return figTotal; }};
})();
