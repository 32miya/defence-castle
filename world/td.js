/* 世界さんぽディフェンス（タワー配置型） 本体
   世界さんぽの3Dマップ（各名所の index.html）の上で動く。そのページは ?td のときだけ
   window.__sekai（three.js の場面・カメラ・地面の高さなど）を用意してこのファイルを読み、毎フレーム SekaiTD.frame(dt) を呼ぶ。
   ・軽量版マップ: 戦う範囲から外れた三角形・木を捨て、人を消す。影は一度だけ描く
   ・敵: 低ポリゴンのモデルをインスタンシングでまとめて描く（種類ごとに1〜3回の描画で全員）
   ・操作: 1本指でカメラを動かす、2本指で拡大・回転、タップで塔を建てる・強化する
   ・負荷テスト: ?td&bench */
(function(){
'use strict';
const HOST=window.__sekai, THREE=window.THREE, ST=window.SekaiTDStages;
const QS=new URLSearchParams(location.search);
const MAP=(window.SekaiTDMaps||{})[window.TD_MAP||QS.get('map')];
if(!HOST||!THREE||!MAP||!ST){ console.warn('td: not ready'); return; }
const SRC=(document.currentScript&&document.currentScript.src)||'';
const BASE=SRC?SRC.replace(/[^/]*$/,''):'/defence-castle/world/';
const HOME=window.TD_GAME_URL||ST.HOME;
const STAGE_I=Math.max(0,ST.STAGES.findIndex(s=>s.id===MAP.id));
const BENCH=QS.has('bench');
const isTouch=matchMedia('(pointer:coarse)').matches;
const {scene,camera,renderer}=HOST;
const $=id=>document.getElementById(id);
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+(b-a)*Math.random();
let SV={}; try{ SV=JSON.parse(localStorage.getItem(ST.SAVE)||'{}'); }catch(e){}
function save(){ try{ localStorage.setItem(ST.SAVE,JSON.stringify(SV)); }catch(e){} }
const OPT=Object.assign({sound:true,light:false},SV.opt||{});

/* ================= 決まり（調整しやすい数字） ================= */
const TW={
  archer:{name:'弓の塔',desc:'速く射る。空の敵も撃てる',air:true,proj:'arrow',
    lv:[{cost:70,dmg:14,rate:.7,range:25},{cost:65,dmg:24,rate:.62,range:27},{cost:100,dmg:38,rate:.52,range:30}]},
  catapult:{name:'投石機',desc:'群れをまとめて砕く。空は撃てない',air:false,proj:'stone',
    lv:[{cost:110,dmg:42,rate:3,range:34,min:8,splash:5.5},{cost:100,dmg:68,rate:2.8,range:37,min:8,splash:6.5},{cost:150,dmg:108,rate:2.6,range:40,min:8,splash:7.5}]},
  mage:{name:'魔法の塔',desc:'鎧を通す。当たると遅くなる',air:true,magic:true,proj:'bolt',
    lv:[{cost:120,dmg:18,rate:1.1,range:22,slow:.4,slowT:1.6},{cost:110,dmg:30,rate:1,range:24,slow:.45,slowT:1.8},{cost:160,dmg:46,rate:.9,range:26,slow:.5,slowT:2,chain:2}]},
  wall:{name:'城壁',desc:'道をふさぐ。壊すまで敵は進めない（空の敵は越える）',wall:true,
    lv:[{cost:60,hp:320},{cost:60,hp:700},{cost:100,hp:1300}]}
};
const TW_ORDER=['archer','catapult','mage'];
const GS=2.2;   /* 見やすいように敵は実物より大きく */
const EN={
  goblin:  {name:'ゴブリン',   hp:38,  spd:6,   armor:0,gold:8,  core:1, atk:8,  size:1},
  wolf:    {name:'魔狼',       hp:58,  spd:9.5, armor:0,gold:10,  core:1, atk:10, size:1.05},
  orc:     {name:'オーク',     hp:135, spd:4.4, armor:3,gold:15, core:2, atk:16, size:1.25},
  skeleton:{name:'骸骨兵',     hp:95,  spd:5,   armor:1,gold:12,  core:1, atk:12, size:1.05,arrowRes:.5},
  troll:   {name:'トロル',     hp:500, spd:3,   armor:6,gold:45, core:3, atk:45, size:1.9},
  ogre:    {name:'オーガの王', hp:2800,spd:2.4, armor:8,gold:250,core:10,atk:130,size:2.8,boss:true},
  bat:     {name:'大コウモリ', hp:34,  spd:7.5, armor:0,gold:9,  core:1, size:1.1,air:true,alt:-4},
  wyvern:  {name:'ワイバーン', hp:300, spd:5,   armor:2,gold:36, core:3, size:2,  air:true,alt:2},
  dragon:  {name:'黒竜',       hp:6000,spd:3,   armor:6,gold:250,core:12,size:4.2,air:true,alt:8,boss:true}
};
/* 波: [敵, 数, ルート(g0,g1=地上の1・2本目, air=空), 間隔(秒), 開始の遅れ(秒)] */
const WAVES=MAP.waves||[
  [['goblin',10,'g0',1.1]],
  [['goblin',8,'g1',1],['goblin',6,'g0',1.2,4]],
  [['wolf',8,'g1',.9],['goblin',10,'g0',1,3]],
  [['orc',6,'g0',1.8],['bat',6,'air',1.2,5]],
  [['skeleton',10,'g1',1.1],['orc',5,'g0',1.6,3]],
  [['troll',2,'g0',5],['goblin',14,'g1',.7],['bat',8,'air',1,6]],
  [['wolf',12,'g0',.7],['orc',8,'g1',1.4,2]],
  [['wyvern',3,'air',4],['skeleton',12,'g0',1],['troll',2,'g1',5,6]],
  [['orc',10,'g0',1.1],['orc',10,'g1',1.1,2],['bat',12,'air',.8,4],['troll',3,'g0',4,12]],
  [['ogre',1,'g0',1,0],['goblin',16,'g0',.6,2],['orc',8,'g1',1.2],['wyvern',2,'air',5,10],['wolf',10,'g1',.7,14]]
];
const HP_MUL=1+.22*STAGE_I, CNT_MUL=1+.1*STAGE_I;
const NEXT_WAIT=35, METEOR={cd:40,r:9,dmg:200*HP_MUL};

/* ================= 道 ================= */
const ROUTES={};
for(const k in MAP.routes){ const r=Object.assign({key:k},MAP.routes[k]); const P=r.pts,L=[0];
  for(let i=1;i<P.length;i++) L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  r.L=L; r.len=L[L.length-1];
  /* 高さの表（1mごと）。地上の道は橋や段の上も拾う */
  const n=Math.ceil(r.len)+1; r.H=new Float32Array(n);
  for(let i=0;i<n;i++){ const p=rawAt(r,i); r.H[i]=r.air?p[2]:Math.max(p[2],HOST.hy(p[0],p[1],p[2]+1.6)); }
  ROUTES[k]=r; }
const GROUND=(MAP.ground||Object.keys(ROUTES).filter(k=>!ROUTES[k].air)).map(k=>ROUTES[k]);
const AIR=Object.values(ROUTES).find(r=>r.air);
function rawAt(r,s){ const P=r.pts,L=r.L; s=clamp(s,0,r.len); let k=0; while(k<L.length-2&&L[k+1]<s) k++; const t=(s-L[k])/((L[k+1]-L[k])||1),a=P[k],b=P[k+1]; return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,k]; }
/* 敵の位置（k は前回の区間。前へ進むだけなので先頭から探さない） */
function routePos(r,s,e){ const P=r.pts,L=r.L; let k=e.k||0; while(k<L.length-2&&L[k+1]<s) k++; e.k=k; const a=P[k],b=P[k+1],d=(L[k+1]-L[k])||1,t=clamp((s-L[k])/d,0,1);
  const dx=(b[0]-a[0])/d,dz=(b[1]-a[1])/d; e.hd=Math.atan2(dx,dz);
  const i=clamp(s,0,r.len),i0=Math.floor(i),f=i-i0,H=r.H;
  e.x=a[0]+(b[0]-a[0])*t+dz*e.off; e.z=a[1]+(b[1]-a[1])*t-dx*e.off; e.y=H[Math.min(H.length-1,i0)]*(1-f)+H[Math.min(H.length-1,i0+1)]*f; }
function nearestS(r,x,z){ let best=1e9,bs=0; for(let s=0;s<=r.len;s+=.5){ const p=rawAt(r,s),d=Math.hypot(p[0]-x,p[1]-z); if(d<best){ best=d; bs=s; } } return [bs,best]; }

/* ================= 状態 ================= */
const G={gold:MAP.gold||250,lives:MAP.lives||20,maxLives:MAP.lives||20,wave:-1,queue:[],t:0,speed:1,paused:false,started:false,over:false,
  nextT:-1,spawnDone:true,met:0,metArm:false,kills:0,leaked:0,spent:0};
const enemies=[], towers=[], shots=[], fx=[];
const SLOTS=MAP.slots.map(([x,z],i)=>({i,x,z,y:HOST.hy(x,z),wall:false,tower:null}));
for(const [x,z] of MAP.walls||[]){ const on=[]; let y=0;
  for(const r of GROUND){ const [s,d]=nearestS(r,x,z); if(d<3.5){ on.push({r:r.key,s}); const e={k:0,off:0}; routePos(r,s,e); y=e.y; } }
  if(on.length) SLOTS.push({i:SLOTS.length,x,z,y,wall:true,on,tower:null}); }

/* ================= 軽量版マップ ================= */
function lighten(){
  const t0=performance.now(),F=MAP.field,inF=(x,z)=>x>F.x0&&x<F.x1&&z>F.z0&&z<F.z1;
  const keep=new Set(HOST.keep||[]); let tri0=0,tri1=0,hid=0;
  for(const o of HOST.hide||[]) o.visible=false;
  scene.updateMatrixWorld(true);
  const uses=new Map(); scene.traverse(o=>{ if(o.geometry) uses.set(o.geometry,(uses.get(o.geometry)||0)+1); });
  const todo=[]; scene.traverse(o=>{ if(o.userData.td||keep.has(o)||!o.geometry||!o.visible) return; if(o.isMesh||o.isInstancedMesh||o.isPoints) todo.push(o); });
  for(const o of todo){
    const g=o.geometry; if(!g.attributes||!g.attributes.position) continue;
    if(o.isInstancedMesh){ compactInstances(o,inF); continue; }
    if(!g.boundingBox) g.computeBoundingBox(); const bb=g.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if(bb.max.x<F.x0||bb.min.x>F.x1||bb.max.z<F.z0||bb.min.z>F.z1){ if(bb.max.x-bb.min.x<4000&&bb.max.z-bb.min.z<4000){ o.visible=false; hid++; } continue; }
    if(bb.min.x>=F.x0&&bb.max.x<=F.x1&&bb.min.z>=F.z0&&bb.max.z<=F.z1) continue;
    if(uses.get(g)>1||o.isPoints) continue;
    const r=filterTris(o,inF); tri0+=r[0]; tri1+=r[1];
  }
  const B=MAP.cam.bounds,sun=HOST.sun,cx=(B.x0+B.x1)/2,cz=(B.z0+B.z1)/2,ext=Math.max(B.x1-B.x0,B.z1-B.z0)*.62,sz=isTouch?1536:2048;
  const d=window.SUND||{x:.4,y:.8,z:.3}; sun.position.set(cx+d.x*500,d.y*500,cz+d.z*500); sun.target.position.set(cx,0,cz); sun.target.updateMatrixWorld();
  sun.shadow.mapSize.set(sz,sz); const c=sun.shadow.camera; c.left=-ext; c.right=ext; c.top=ext; c.bottom=-ext; c.near=1; c.far=1400; c.updateProjectionMatrix();
  if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
  shadowDirty=3;
  return {ms:Math.round(performance.now()-t0),hidden:hid,trisCut:tri0-tri1};
}
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
let shadowDirty=0;

/* ================= 低ポリゴンのモデル（頂点色つき。このゲームのために組んだもの） ================= */
const _c=new THREE.Color();
const LINEAR=renderer.outputEncoding===THREE.sRGBEncoding;   /* 頂点色は sRGB で書いているので、出力が sRGB なら直線の色に直す */
const GEO={box:()=>new THREE.BoxGeometry(1,1,1),cyl:s=>new THREE.CylinderGeometry(1,1,1,s||8),cone:s=>new THREE.ConeGeometry(1,1,s||8),sph:s=>new THREE.SphereGeometry(1,s||8,Math.max(4,(s||8)*.6|0)),ico:()=>new THREE.IcosahedronGeometry(1,0),oct:()=>new THREE.OctahedronGeometry(1,0),tor:()=>new THREE.TorusGeometry(1,.12,6,18)};
/* p: [形, 色, x,y,z, sx,sy,sz, rx,ry,rz] */
function build(parts){ const gs=[]; let n=0;
  for(const p of parts){ const [k,col,x,y,z,sx,sy,sz,rx,ry,rz]=p; const f=k.split(':'); let g=GEO[f[0]](f[1]?+f[1]:undefined); g=g.index?g.toNonIndexed():g;
    g.applyMatrix4(new THREE.Matrix4().compose(V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'YXZ')),V3(sx,sy==null?sx:sy,sz==null?sx:sz)));
    const m=g.attributes.position.count,C=new Float32Array(m*3); _c.set(col); if(LINEAR) _c.convertSRGBToLinear(); for(let i=0;i<m;i++){ C[i*3]=_c.r; C[i*3+1]=_c.g; C[i*3+2]=_c.b; }
    g.setAttribute('color',new THREE.BufferAttribute(C,3)); gs.push(g); n+=m; }
  const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3); let o=0;
  for(const g of gs){ g.computeVertexNormals(); P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); C.set(g.attributes.color.array,o*3); o+=g.attributes.position.count; g.dispose(); }
  const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(P,3)); out.setAttribute('normal',new THREE.BufferAttribute(N,3)); out.setAttribute('color',new THREE.BufferAttribute(C,3)); out.computeBoundingSphere(); return out; }
const MAT=new THREE.MeshLambertMaterial({vertexColors:true});
const MATE=new THREE.MeshLambertMaterial({vertexColors:true,emissive:'#ffffff',emissiveIntensity:.0});
/* 人型の土台 */
function humanoid(skin,cloth,leg,h,extra){ const s=h/1.3; return [
  ['box',leg, -.13*s,.24*s,0, .17*s,.48*s,.18*s],['box',leg,.13*s,.24*s,0,.17*s,.48*s,.18*s],
  ['box',cloth,0,.72*s,0,.52*s,.52*s,.32*s],['box',skin,-.36*s,.74*s,.04*s,.14*s,.46*s,.14*s,.25],['box',skin,.36*s,.74*s,.04*s,.14*s,.46*s,.14*s,.25],
  ['sph:7',skin,0,1.12*s,0,.25*s,.24*s,.24*s]].concat(extra||[]); }
const MODELS={
  goblin:()=>build(humanoid('#7fa53e','#6b4a2a','#4a3826',1.15,[
    ['cone:4','#7fa53e',-.3,1.18,0,.07,.32,.07,0,0,1.25],['cone:4','#7fa53e',.3,1.18,0,.07,.32,.07,0,0,-1.25],
    ['box','#ffe04a',-.09,1.17,.19,.07,.05,.04],['box','#ffe04a',.09,1.17,.19,.07,.05,.04],['cone:4','#6a8e30',0,1.08,.25,.05,.16,.05,1.5],
    ['cyl:5','#5a3d22',.42,.62,.3,.07,.7,.07,.9],['sph:5','#5a3d22',.42,.42,.6,.13]])),
  orc:()=>build(humanoid('#5f7d4c','#5b4632','#3a3026',1.4,[
    ['box','#7a7a80',0,.88,.02,.62,.28,.4],['cyl:6','#6d6d74',0,1.32,0,.27,.12,.27],['cone:6','#6d6d74',0,1.45,0,.24,.16,.24],
    ['box','#e8e0c0',-.08,1.12,.22,.04,.1,.04],['box','#e8e0c0',.08,1.12,.22,.04,.1,.04],['box','#ff5a3a',-.09,1.22,.21,.06,.04,.03],['box','#ff5a3a',.09,1.22,.21,.06,.04,.03],
    ['cyl:5','#4a3420',.5,.75,.3,.06,1.1,.06,.7],['box','#b8bcc4',.5,1.1,.62,.08,.42,.32,.7]])),
  skeleton:()=>build(humanoid('#e6dfc8','#c9c0a6','#d8d0b8',1.25,[
    ['box','#3a3226',0,.75,.17,.36,.06,.02],['box','#3a3226',0,.66,.17,.36,.06,.02],['box','#1a1612',-.09,1.15,.21,.08,.08,.04],['box','#1a1612',.09,1.15,.21,.08,.08,.04],
    ['cyl:10','#6a4626',-.42,.75,.22,.32,.05,.32,1.57],['tor','#a08040',-.42,.75,.25,.32,.32,.4],['box','#c8ccd6',.42,.95,.38,.05,.75,.05,.9]])),
  troll:()=>build([
    ['box','#55666c',-.3,.4,0,.32,.8,.34],['box','#55666c',.3,.4,0,.32,.8,.34],['sph:8','#6c7f86',0,1.25,0,.72,.78,.6],['sph:8','#8a9aa0',0,1.1,.22,.5,.5,.42],
    ['box','#6c7f86',-.82,1.05,.1,.22,1.1,.24,.15],['box','#6c7f86',.82,1.05,.1,.22,1.1,.24,.15],['sph:6','#6c7f86',0,2.02,.18,.3,.28,.3],
    ['box','#ffcc55',-.1,2.06,.45,.07,.05,.04],['box','#ffcc55',.1,2.06,.45,.07,.05,.04],['box','#4a3a2a',0,.78,0,.8,.3,.62],
    ['cyl:6','#6a4a2a',.95,.95,.45,.1,1.3,.1,1.1],['sph:6','#6a4a2a',.95,.75,.98,.24]]),
  ogre:()=>build([
    ['box','#8a4a36',-.32,.42,0,.34,.84,.36],['box','#8a4a36',.32,.42,0,.34,.84,.36],['sph:9','#b06a4c',0,1.35,0,.78,.82,.62],['box','#3a2a20',0,.9,0,.9,.35,.7],['box','#d0a040',0,.9,.36,.22,.2,.04],
    ['box','#b06a4c',-.9,1.15,.1,.24,1.15,.26,.15],['box','#b06a4c',.9,1.15,.1,.24,1.15,.26,.15],['sph:7','#b06a4c',0,2.15,.12,.34,.32,.32],
    ['cyl:8','#e8c040',0,2.46,.1,.3,.16,.3],['cone:4','#e8c040',-.18,2.6,.1,.06,.16,.06],['cone:4','#e8c040',.18,2.6,.1,.06,.16,.06],['cone:4','#e8c040',0,2.62,.28,.06,.18,.06],
    ['box','#ff3a2a',-.11,2.2,.42,.08,.05,.03],['box','#ff3a2a',.11,2.2,.42,.08,.05,.03],['cone:4','#f0e8d0',-.12,2.02,.4,.04,.12,.04,3.14],['cone:4','#f0e8d0',.12,2.02,.4,.04,.12,.04,3.14],
    ['cyl:6','#5a3a22',1.05,1.05,.5,.12,1.6,.12,1.1],['sph:6','#5a3a22',1.05,.8,1.15,.3],['cone:4','#c8c8d0',1.05,.95,1.4,.06,.2,.06,1.6]]),
  wolf:()=>build([
    ['box','#3e3b48',0,.78,0,.48,.5,1.15],['box','#4a4656',0,.86,.32,.56,.6,.5],['box','#3e3b48',0,1.02,.78,.36,.36,.42],['box','#2e2c36',0,.94,1.04,.2,.18,.3],
    ['cone:4','#3e3b48',-.12,1.28,.7,.07,.2,.07],['cone:4','#3e3b48',.12,1.28,.7,.07,.2,.07],['box','#ff3a3a',-.11,1.08,.98,.06,.05,.03],['box','#ff3a3a',.11,1.08,.98,.06,.05,.03],
    ['cyl:4','#2e2c36',-.16,.3,.38,.07,.6,.07],['cyl:4','#2e2c36',.16,.3,.38,.07,.6,.07],['cyl:4','#2e2c36',-.16,.3,-.38,.07,.6,.07],['cyl:4','#2e2c36',.16,.3,-.38,.07,.6,.07],
    ['cone:5','#3e3b48',0,.85,-.78,.12,.6,.12,-1.9]]),
  bat:()=>build([['sph:7','#3b2c48',0,0,0,.28,.3,.36],['sph:6','#3b2c48',0,.12,.3,.18],['cone:4','#3b2c48',-.09,.3,.28,.05,.16,.05],['cone:4','#3b2c48',.09,.3,.28,.05,.16,.05],['box','#ff4a6a',-.06,.15,.45,.05,.04,.03],['box','#ff4a6a',.06,.15,.45,.05,.04,.03]]),
  wyvern:()=>build([['sph:8','#3f5a3a',0,0,0,.42,.42,.8],['cyl:6','#3f5a3a',0,.3,.8,.14,.7,.14,-.9],['box','#4c6a44',0,.55,1.18,.24,.22,.44],['cone:4','#e8e0c0',-.1,.72,1.08,.04,.2,.04,-.5],['cone:4','#e8e0c0',.1,.72,1.08,.04,.2,.04,-.5],['box','#ffcc33',-.08,.62,1.36,.05,.04,.03],['box','#ffcc33',.08,.62,1.36,.05,.04,.03],
    ['cone:5','#3f5a3a',0,-.05,-1.05,.16,1.2,.16,-1.57],['cone:4','#a84a2a',0,.08,-1.7,.14,.3,.04,-1.57],['box','#2f442c',-.14,-.36,.1,.08,.34,.08],['box','#2f442c',.14,-.36,.1,.08,.34,.08]]),
  dragon:()=>build([['sph:9','#2a2430',0,0,0,.5,.48,.95],['cyl:6','#2a2430',0,.4,.95,.17,.8,.17,-.9],['box','#352d3e',0,.72,1.4,.3,.26,.55],['cone:4','#c8b890',-.13,.92,1.28,.05,.3,.05,-.6],['cone:4','#c8b890',.13,.92,1.28,.05,.3,.05,-.6],['box','#ff4020',-.1,.8,1.62,.06,.05,.03],['box','#ff4020',.1,.8,1.62,.06,.05,.03],
    ['cone:5','#2a2430',0,-.05,-1.3,.2,1.5,.2,-1.57],['cone:5','#8a2a20',0,.42,0,.08,.3,.4],['box','#8a2a20',0,-.2,.2,.42,.3,.7]])
};
/* 翼（左右べつのインスタンスで羽ばたく）。根元が原点 */
function wingGeo(col,len,w){ return build([['box',col,len/2,0,0,len,.04,w],['box',col,len*.85,0,-w*.35,len*.5,.04,w*.5],['cyl:4','#1a1420',len/2,.03,w*.45,.04,len,.04,0,0,1.57]]); }
const WINGS={bat:wingGeo('#4a3560',.75,.42),wyvern:wingGeo('#5a6a40',1.5,.8),dragon:wingGeo('#3a2030',2.2,1.1)};

/* 敵の描画（種類ごとにインスタンス） */
const CAP=BENCH?260:150;
const IM={};
for(const k in EN){ const m=new THREE.InstancedMesh(MODELS[k](),MAT,EN[k].boss?4:CAP); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count=0; m.frustumCulled=false; m.userData.td=1;
  white(m); scene.add(m); IM[k]={body:m};
  if(WINGS[k]) for(const sd of ['L','R']){ const w=white(new THREE.InstancedMesh(WINGS[k],MAT,EN[k].boss?4:CAP)); w.count=0; w.frustumCulled=false; w.userData.td=1; w.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(w); IM[k][sd]=w; } }

/* ================= 塔のモデル ================= */
const STONE='#a8988a',STONE2='#8c7e72',WOOD='#7a5532',WOOD2='#5a3d22',ROOF=['#a03a2a','#2e4f96','#c89a2a'];
function towerGeo(type,lv){
  const P=[]; const add=(...a)=>P.push(a);
  if(type==='archer'){ const h=6.5+lv*1.6;
    add('cyl:10',STONE2,0,.5,0,2.5,1,2.5); add('cyl:10',STONE,0,1+h/2,0,1.9,h,1.9);
    add('cyl:10',STONE2,0,1+h,0,2.3,.5,2.3); for(let i=0;i<10;i++){ const a=i/10*6.283; add('box',STONE,Math.sin(a)*2.1,1.6+h,Math.cos(a)*2.1,.55,.8,.4,0,a); }
    add('box','#3a2e28',0,1+h*.55,1.88,.35,.9,.1); add('box','#3a2e28',1.88,1+h*.7,0,.1,.9,.35);
    add('cone:10',ROOF[lv],0,3.4+h,0,2.6,3,2.6); add('cyl:4',WOOD2,0,5.2+h,0,.06,1.6,.06); add('box',ROOF[lv],.45,5.6+h,0,.8,.45,.04);
    if(lv>=1) add('cyl:10',ROOF[lv],0,1+h*.42,0,1.95,.35,1.95);
    if(lv>=2){ add('cyl:10','#e8c860',0,2+h,0,2.62,.18,2.62); add('sph:6','#e8c860',0,4.95+h,0,.2); }
    return {g:build(P),top:2+h,r:2.5}; }
  if(type==='mage'){ const h=7+lv*1.6;
    add('cyl:8','#6a5c80',0,.5,0,2.3,1,2.3); add('cyl:8','#8a7aa8',0,1+h/2,0,1.45,h,1.7); add('cyl:8','#6a5c80',0,1+h,0,2,.5,2);
    add('cone:8','#3a2a72',0,3.6+h,0,2.1,4.6,2.1); add('box','#b9a0ff',0,1+h*.6,1.62,.4,1.1,.1); add('box','#b9a0ff',0,1+h*.35,-1.62,.4,1.1,.1);
    if(lv>=1) for(let i=0;i<4;i++){ const a=i/4*6.283+.78; add('cone:4','#3a2a72',Math.sin(a)*1.9,2+h,Math.cos(a)*1.9,.3,1.2,.3); }
    if(lv>=2){ add('tor','#e8c860',0,1.3+h,0,2.1,2.1,2.4,1.57); add('cyl:8','#e8c860',0,1+h*.45,0,1.6,.25,1.8); }
    return {g:build(P),top:6.4+h,r:2.3,crystal:7.6+h}; }
  if(type==='catapult'){ const k=1+lv*.12;
    add('box',STONE2,0,.35,0,5.2*k,.7,5.6*k);
    for(const s of [-1,1]){ add('box',WOOD,s*1.1*k,1.2,0,.28,.35,4.2*k); add('cyl:8',WOOD2,s*1.35*k,1.25,1.5*k,.6,.22,.6,0,0,1.57); add('cyl:8',WOOD2,s*1.35*k,1.25,-1.5*k,.6,.22,.6,0,0,1.57);
      add('box',WOOD,s*1.1*k,2.3,-.2,.26,2.4,.26,.35); add('box',WOOD,s*1.1*k,2.3,-.2,.26,2.4,.26,-.35); }
    add('box',WOOD,0,3.15,-.2,2.6*k,.26,.26); add('box',WOOD2,0,1.45,-1.6*k,2.4*k,.6,.8);
    if(lv>=1) for(const s of [-1,1]) add('box','#55565c',s*1.1*k,1.2,0,.32,.4,.4);
    if(lv>=2){ add('box','#55565c',0,1.85,-1.6*k,2.5*k,.18,.9); add('cyl:4',WOOD2,-2.4*k,2.4,1.8*k,.06,3,.06); add('box','#c8a030',-2,3.4,1.8*k,.7,.5,.04); }
    return {g:build(P),top:4,r:3}; }
  if(type==='wall'){ const w=9.5;
    if(lv===0){ for(let i=0;i<12;i++){ const x=-w/2+.4+i*(w-.8)/11; add('cyl:5',WOOD,x,1.5,0,.32,3+((i*37)%5)*.12,.32); add('cone:5',WOOD2,x,3.25,0,.32,.6,.32); } add('box',WOOD2,0,1.2,.35,w,.3,.15); add('box',WOOD2,0,2.3,.35,w,.3,.15); }
    else { const hh=lv===1?3.6:4.6; add('box',STONE,0,hh/2,0,w,hh,2); for(let i=0;i<7;i++) add('box',STONE,-w/2+.5+i*(w-1)/6,hh+.4,.6,.8,.8,.5); add('box',STONE2,0,.3,0,w+.4,.6,2.3);
      if(lv===2){ for(const s of [-1,1]){ add('cyl:8',STONE,s*(w/2+.4),2.9,0,1.3,5.8,1.3); add('cone:8',ROOF[0],s*(w/2+.4),7.1,0,1.6,2.4,1.6); } } }
    return {g:build(P),top:lv?4:3,r:1}; }
}
const ARM=build([['box',WOOD,0,2.1,0,.32,4.2,.32],['box',WOOD2,0,4.1,.25,.9,.25,.9],['sph:6','#777068',0,4.4,.25,.38]]);
const CRYSTAL=new THREE.Mesh(new THREE.OctahedronGeometry(.9,0),new THREE.MeshBasicMaterial({color:'#9fe8ff'}));
const TG={}; function towerModel(type,lv){ const k=type+lv; return TG[k]||(TG[k]=towerGeo(type,lv)); }

/* ================= 弾・光・印 ================= */
/* 色つきインスタンス（同じ材質を使う全インスタンスに色を持たせる。r128 で色の有無が混ざると落ちるため） */
function white(m){ m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(m.instanceMatrix.count*3).fill(1),3); return m; }
function pool(geo,mat,cap){ const m=white(new THREE.InstancedMesh(geo,mat,cap)); m.count=0; m.frustumCulled=false; m.userData.td=1; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; }
const ADD=o=>new THREE.MeshBasicMaterial(Object.assign({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false},o));
const PM={
  arrow:pool(build([['box','#6a4a2a',0,0,0,.09,.09,1.6],['cone:4','#c8ccd6',0,0,.9,.1,.3,.1,1.57],['box','#e8e8e8',0,0,-.75,.25,.02,.3]]),MAT,240),
  stone:pool(build([['ico','#8a8278',0,0,0,.75]]),MAT,60),
  bolt:pool(new THREE.SphereGeometry(.55,8,6),ADD({color:'#c9a8ff'}),120)
};
const ringGeo=new THREE.RingGeometry(.78,1,32); ringGeo.rotateX(-Math.PI/2);
const FXM=pool(ringGeo,ADD({vertexColors:false,side:THREE.DoubleSide}),60); 
const PUFF=pool(new THREE.SphereGeometry(1,8,6),ADD({opacity:.9}),60); 
/* 体力の帯（カメラに向ける） */
const barGeo=new THREE.PlaneGeometry(1,1); barGeo.translate(.5,0,0);
const BAR=pool(barGeo,new THREE.MeshBasicMaterial({depthTest:false,transparent:true,fog:false}),CAP*2+60); BAR.renderOrder=20; 
/* 置き場所の印 */
const slotGeo=(()=>{ /* 暗いふち・金の輪・うすい中・＋印 */
  const parts=[[new THREE.RingGeometry(2.5,2.85,32),.18],[new THREE.RingGeometry(1.95,2.5,32),1.15],[new THREE.CircleGeometry(1.95,32),.55],[new THREE.PlaneGeometry(1.7,.38),1.35],[new THREE.PlaneGeometry(.38,1.7),1.35]];
  const P=[],C=[]; parts.forEach(([g,k],n)=>{ g=g.toNonIndexed(); g.rotateX(-Math.PI/2); g.translate(0,n*.012,0); const a=g.attributes.position.array; for(let i=0;i<a.length;i++) P.push(a[i]); for(let i=0;i<a.length/3;i++) C.push(k,k,k); });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); return g; })();
const SLOTM=pool(slotGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthWrite:false,fog:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-6}),SLOTS.length); 
const rangeRing=new THREE.Mesh(new THREE.RingGeometry(.96,1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffe08a',transparent:true,opacity:.85,depthWrite:false,fog:false}));
const rangeFill=new THREE.Mesh(new THREE.CircleGeometry(1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffe08a',transparent:true,opacity:.12,depthWrite:false,fog:false}));
const rangeG=new THREE.Group(); rangeG.add(rangeRing,rangeFill); rangeG.visible=false; rangeG.userData.td=1; scene.add(rangeG);
const metAim=new THREE.Mesh(new THREE.RingGeometry(.9,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ff8a3a',transparent:true,opacity:.9,depthWrite:false,fog:false})); metAim.visible=false; metAim.userData.td=1; scene.add(metAim);
const metBall=new THREE.Mesh(new THREE.SphereGeometry(2.2,12,8),ADD({color:'#ffb050'})); metBall.visible=false; metBall.userData.td=1; scene.add(metBall);

/* 道（流れる矢印） */
const chev=(()=>{ const c=document.createElement('canvas'); c.width=64; c.height=64; const g=c.getContext('2d'); g.fillStyle='#fff'; g.beginPath(); g.moveTo(14,6); g.lineTo(40,32); g.lineTo(14,58); g.lineTo(26,58); g.lineTo(52,32); g.lineTo(26,6); g.closePath(); g.fill(); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; })();
const routeMeshes=[];
for(const r of Object.values(ROUTES)){ const pos=[],uv=[],idx=[],W=r.air?1.3:2.1; let n=0;
  for(let s=0;s<=r.len;s+=1.5){ const p=rawAt(r,s),q=rawAt(r,Math.min(r.len,s+1)),dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz)||1,nx=dz/L,nz=-dx/L,y=r.H[Math.min(r.H.length-1,Math.round(s))]+(r.air?0:.3);
    pos.push(p[0]+nx*W,y,p[1]+nz*W,p[0]-nx*W,y,p[1]-nz*W); uv.push(s/3.2,0,s/3.2,1); if(n) idx.push((n-1)*2,(n-1)*2+1,n*2,(n-1)*2+1,n*2+1,n*2); n++; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:chev,color:r.air?'#b48aff':'#ff5a4a',transparent:true,opacity:r.air?.45:.55,depthWrite:false,fog:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4}));
  m.userData.td=1; m.renderOrder=2; scene.add(m); routeMeshes.push(m); }
/* 闇の門（敵の出てくる所） */
const portals=[];
for(const r of Object.values(ROUTES)){ const p=rawAt(r,0),q=rawAt(r,4),g=new THREE.Group(); g.userData.td=1;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(4.2,.45,8,28),new THREE.MeshLambertMaterial({color:'#2a1a40',emissive:'#5a2aa0',emissiveIntensity:.6}));
  const disk=new THREE.Mesh(new THREE.CircleGeometry(4,28),ADD({color:'#7a3ad8',opacity:.75,side:THREE.DoubleSide}));
  g.add(ring,disk); g.position.set(p[0],r.H[0]+(r.air?0:4.6),p[1]); g.rotation.y=Math.atan2(q[0]-p[0],q[1]-p[1]); scene.add(g); portals.push(g); }
/* 守るもの（聖なる泉の結晶） */
const core=new THREE.Group(); core.userData.td=1;
const coreGem=new THREE.Mesh(new THREE.OctahedronGeometry(1.6,0),new THREE.MeshLambertMaterial({color:'#9fe8ff',emissive:'#3ab0ff',emissiveIntensity:.8}));
const coreRing=new THREE.Mesh(new THREE.RingGeometry(3.4,4.2,40).rotateX(-Math.PI/2),ADD({color:'#6ad0ff',opacity:.8,side:THREE.DoubleSide}));
const coreBase=new THREE.Mesh(build([['cyl:10','#cfc6b8',0,.4,0,2.6,.8,2.6],['cyl:10','#7ab8d8',0,.82,0,2.2,.06,2.2],['cyl:8','#cfc6b8',0,1.6,0,.5,1.6,.5]]),MAT);
coreGem.position.y=4.4; coreRing.position.y=.12; core.add(coreBase,coreGem,coreRing); core.position.set(MAP.core.x,MAP.core.y,MAP.core.z); scene.add(core);

/* ================= 音（短い合成音） ================= */
let AC=null; function snd(kind){ if(!OPT.sound||!AC) return; try{ const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(); o.connect(g); g.connect(AC.destination);
  const S={shoot:['triangle',880,520,.05,.04],boom:['sawtooth',120,40,.25,.12],zap:['square',660,990,.08,.03],coin:['sine',1240,1660,.09,.05],build:['triangle',330,660,.18,.08],hurt:['sawtooth',220,90,.3,.12],wave:['triangle',440,660,.4,.08],win:['triangle',523,1046,.7,.1],lose:['sawtooth',300,80,.9,.12]}[kind]; if(!S) return;
  o.type=S[0]; o.frequency.setValueAtTime(S[1],t); o.frequency.exponentialRampToValueAtTime(S[2],t+S[3]); g.gain.setValueAtTime(S[4],t); g.gain.exponentialRampToValueAtTime(.0001,t+S[3]+.05); o.start(t); o.stop(t+S[3]+.06); }catch(e){} }
let sndT={}; const sndLim=(k,gap)=>{ const n=performance.now(); if((sndT[k]||0)>n) return; sndT[k]=n+gap; snd(k); };

/* ================= 敵 ================= */
function spawn(type,routeKey){ const d=EN[type],r=routeKey==='air'?AIR:routeKey==='g1'?(GROUND[1]||GROUND[0]):routeKey==='g0'?GROUND[0]:ROUTES[routeKey]; if(!r) return;
  const hp=Math.round(d.hp*HP_MUL*(1+.06*Math.max(0,G.wave)));
  const e={t:type,d,r,s:0,k:0,off:r.air?rand(-3,3):rand(-1.3,1.3)*(d.boss?0:1),hp,max:hp,slow:0,slowT:0,hit:0,ph:Math.random()*9,q:rand(0,2.5),x:0,y:0,z:0,hd:0,dead:false,atkT:0};
  routePos(r,0,e); enemies.push(e); return e; }
function hurt(e,dmg,kind){ if(e.dead) return; const d=e.d; let v=dmg;
  if(kind!=='magic'&&kind!=='meteor') v=Math.max(dmg*.25,dmg-d.armor);
  if(kind==='arrow'&&d.arrowRes) v*=d.arrowRes;
  e.hp-=v; e.hit=.12; if(e.hp<=0){ e.dead=true; G.gold+=d.gold; G.kills++; popGold(e,d.gold); addFx(e.x,e.y+.5,e.z,'#ffe08a',.35,1,d.boss?9:3); sndLim('coin',60); if(d.boss) banner(d.name+'を倒した！'); } }
function addFx(x,y,z,col,dur,r0,r1,puff){ if(fx.length>58) fx.shift(); fx.push({x,y,z,col:new THREE.Color(col),t:0,dur,r0,r1,puff:!!puff}); }

/* ================= 1歩すすめる ================= */
function step(dt){
  G.t+=dt;
  /* 出てくる */
  if(G.queue.length){ for(let i=G.queue.length-1;i>=0;i--){ const q=G.queue[i]; if(q.at<=G.t){ spawn(q.type,q.route); G.queue.splice(i,1); } } if(!G.queue.length){ G.spawnDone=true; if(G.wave<WAVES.length-1) G.nextT=NEXT_WAIT; } }
  else if(G.nextT>0&&G.started&&!G.over){ G.nextT-=dt; if(G.nextT<=0) callWave(false); }
  if(G.met>0) G.met=Math.max(0,G.met-dt);
  /* 壁の当たり */
  const walls=towers.filter(t=>t.type==='wall'&&t.hp>0);
  /* 敵が進む */
  for(const e of enemies){ if(e.dead) continue; const d=e.d;
    if(e.slowT>0){ e.slowT-=dt; if(e.slowT<=0) e.slow=0; } if(e.hit>0) e.hit-=dt;
    let v=d.spd*(1-e.slow), stop=false;
    if(!e.r.air){ for(const w of walls){ for(const o of w.slot.on){ if(o.r!==e.r.key) continue; const gap=o.s-e.s; if(gap>-.5&&gap<1.6+d.size*1.1+e.q){ stop=true; e.atkT-=dt; if(e.atkT<=0){ e.atkT=1; w.hp-=d.atk*(1+.06*Math.max(0,G.wave))*HP_MUL; w.hit=.15; if(w.hp<=0) wallDown(w); } } } } }
    if(!stop) e.s+=v*dt;
    routePos(e.r,e.s,e);
    if(e.s>=e.r.len-.3){ e.dead=true; G.lives-=d.core; G.leaked++; coreHit(d.core); }
  }
  for(let i=enemies.length-1;i>=0;i--) if(enemies[i].dead) enemies.splice(i,1);
  /* 塔が撃つ */
  for(const t of towers){ if(t.type==='wall') continue; t.cd-=dt; if(t.anim>0) t.anim-=dt; if(t.cd>0) continue;
    const L=TW[t.type].lv[t.lv],air=TW[t.type].air; let best=null,bp=-1;
    for(const e of enemies){ if(e.dead||(e.r.air&&!air)) continue; const dx=e.x-t.x,dz=e.z-t.z,dd=dx*dx+dz*dz; if(dd>L.range*L.range||(L.min&&dd<L.min*L.min)) continue; const p=e.s/e.r.len+(e.d.boss?.02:0); if(p>bp){ bp=p; best=e; } }
    if(!best) continue; t.cd=L.rate; t.anim=.5; fire(t,best,L); }
  /* 弾 */
  for(let i=shots.length-1;i>=0;i--){ const s=shots[i]; s.t+=dt;
    if(s.kind==='stone'){ const k=Math.min(1,s.t/s.T); s.x=s.x0+(s.x1-s.x0)*k; s.z=s.z0+(s.z1-s.z0)*k; s.y=s.y0+(s.y1-s.y0)*k+Math.sin(k*Math.PI)*s.arc;
      if(k>=1){ for(const e of enemies){ if(e.dead||e.r.air) continue; const dd=Math.hypot(e.x-s.x,e.z-s.z); if(dd<s.L.splash) hurt(e,s.L.dmg*(dd<s.L.splash*.4?1:.6),'stone'); } addFx(s.x,s.y+.3,s.z,'#d8b890',.5,1,s.L.splash,1); sndLim('boom',90); shots.splice(i,1); } continue; }
    const e=s.tg; if(!e||e.dead){ if(s.t>2||!e){ shots.splice(i,1); continue; } }
    const tx=e.x,ty=e.y+(e.r.air?0:e.d.size*GS*.45),tz=e.z,dx=tx-s.x,dy=ty-s.y,dz=tz-s.z,dist=Math.hypot(dx,dy,dz),mv=s.spd*dt;
    if(dist<=mv+.3){ if(!e.dead){ hurt(e,s.L.dmg*(s.mul||1),s.kind==='bolt'?'magic':'arrow'); if(s.kind==='bolt'){ e.slow=Math.max(e.slow,s.L.slow); e.slowT=Math.max(e.slowT,s.L.slowT); addFx(tx,ty,tz,'#b48aff',.3,.5,2.2,1); } } shots.splice(i,1); continue; }
    s.x+=dx/dist*mv; s.y+=dy/dist*mv; s.z+=dz/dist*mv; s.dx=dx/dist; s.dy=dy/dist; s.dz=dz/dist; }
  /* 光 */
  for(let i=fx.length-1;i>=0;i--){ fx[i].t+=dt; if(fx[i].t>=fx[i].dur) fx.splice(i,1); }
  /* 流星 */
  if(MET.on){ MET.t+=dt; if(MET.t>=.9){ MET.on=false; for(const e of enemies){ if(e.dead||e.r.air) continue; const dd=Math.hypot(e.x-MET.x,e.z-MET.z); if(dd<METEOR.r) hurt(e,METEOR.dmg*(dd<METEOR.r*.5?1:.6),'meteor'); }
    for(const e of enemies) if(!e.dead&&!e.r.air&&Math.hypot(e.x-MET.x,e.z-MET.z)<METEOR.r*1.4){ e.slow=.7; e.slowT=2.5; }
    addFx(MET.x,MET.y+.4,MET.z,'#ff9a40',.8,1,METEOR.r*1.3,1); addFx(MET.x,MET.y+.2,MET.z,'#ffd070',1.1,2,METEOR.r*1.8); shake=.5; snd('boom'); } }
  /* 勝ち負け */
  if(!G.over){ if(G.lives<=0) finish(false); else if(G.wave>=WAVES.length-1&&G.spawnDone&&!G.queue.length&&!enemies.length) finish(true); }
}
const MET={on:false,t:0,x:0,y:0,z:0};
function fire(t,e,L){ const T=TW[t.type];
  if(T.proj==='stone'){ const fl=Math.hypot(e.x-t.x,e.z-t.z)/26+.55; const ahead=e.d.spd*(1-e.slow)*fl*.85; const p={k:e.k,off:e.off}; routePos(e.r,Math.min(e.r.len,e.s+ahead),p);
    shots.push({kind:'stone',L,x:t.x,y:t.top,z:t.z,x0:t.x,y0:t.top,z0:t.z,x1:p.x,y1:p.y,z1:p.z,T:fl,t:0,arc:6+fl*6}); sndLim('shoot',120); return; }
  const sp=T.proj==='arrow'?62:34;
  shots.push({kind:T.proj,L,tg:e,x:t.x,y:t.top,z:t.z,spd:sp,t:0,dx:0,dy:0,dz:1}); sndLim(T.proj==='arrow'?'shoot':'zap',70);
  if(L.chain){ let n=0; for(const o of enemies){ if(o===e||o.dead) continue; if(Math.hypot(o.x-e.x,o.z-e.z)<9){ shots.push({kind:T.proj,L,mul:.6,tg:o,x:t.x,y:t.top,z:t.z,spd:sp,t:0,dx:0,dy:0,dz:1}); if(++n>=L.chain) break; } } } }
function wallDown(w){ w.hp=0; w.mesh.visible=false; addFx(w.x,w.y+1,w.z,'#c8b8a0',.7,1,7,1); snd('boom'); toast('城壁が壊された。タップして建て直せます'); }
function coreHit(n){ snd('hurt'); coreFlash=.6; const el=$('tdLife'); if(el){ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); } if(n>=3) shake=.35; }
let coreFlash=0, shake=0;

/* ================= 波 ================= */
function callWave(early){ if(G.over||G.wave>=WAVES.length-1) return; if(early&&G.nextT>0&&G.wave>=0){ const b=Math.round(G.nextT*1.6); if(b>0){ G.gold+=b; toast(`早めに呼んだ：+${b} ゴールド`); } }
  if(G.wave>=0&&G.spawnDone){ const bonus=25+G.wave*6; G.gold+=bonus; }
  G.wave++; G.nextT=-1; G.spawnDone=false; G.started=true;
  for(const [type,n,route,gap,delay] of WAVES[G.wave]){ const cnt=EN[type].boss?n:Math.round(n*CNT_MUL); for(let i=0;i<cnt;i++) G.queue.push({type,route,at:G.t+(delay||0)+i*gap}); }
  if(!G.queue.length) G.spawnDone=true;
  const w=WAVES[G.wave],boss=w.find(q=>EN[q[0]].boss);
  banner(`第${G.wave+1}波`,boss?EN[boss[0]].name+'が来る！':waveText(G.wave)); snd('wave'); updUI(true); }
function routeName(k){ const r=k==='air'?AIR:k==='g1'?(GROUND[1]||GROUND[0]):k==='g0'?GROUND[0]:ROUTES[k]; return r?r.name:''; }
function waveText(i){ const w=WAVES[i]; if(!w) return ''; return w.map(([t,n,r])=>`${EN[t].name}×${EN[t].boss?n:Math.round(n*CNT_MUL)}（${routeName(r)}）`).join('・'); }

/* ================= 塔を建てる ================= */
function buildTower(slot,type){ const T=TW[type],c=T.lv[0].cost; if(G.gold<c||slot.tower) return false; G.gold-=c; G.spent+=c;
  const t={type,lv:0,slot,x:slot.x,y:slot.y,z:slot.z,cd:.3,anim:0,top:0,spent:c,hp:0,max:0,hit:0}; slot.tower=t; towers.push(t); setTowerMesh(t);
  if(type==='wall'){ t.max=t.hp=T.lv[0].hp; }
  addFx(t.x,t.y+.2,t.z,'#ffe08a',.5,2,5); snd('build'); shadowDirty=2; updUI(true); return true; }
function setTowerMesh(t){ if(t.mesh){ scene.remove(t.mesh); } const M=towerModel(t.type,t.lv); const g=new THREE.Group(); g.userData.td=1; const m=new THREE.Mesh(M.g,MAT); m.castShadow=true; m.receiveShadow=true; g.add(m);
  if(t.type==='catapult'){ t.arm=new THREE.Mesh(ARM,MAT); t.arm.position.set(0,1.45,-.2); t.arm.castShadow=true; g.add(t.arm); }
  if(t.type==='mage'){ t.cr=CRYSTAL.clone(); t.cr.position.y=M.crystal; g.add(t.cr); }
  g.position.set(t.x,t.y,t.z);
  if(t.type==='wall'){ const o=t.slot.on[0],r=ROUTES[o.r],e={k:0,off:0}; routePos(r,o.s,e); g.rotation.y=e.hd; } else g.rotation.y=Math.atan2(MAP.core.x-t.x,MAP.core.z-t.z);
  if(t.type!=='wall') g.scale.setScalar(TSC); scene.add(g); t.mesh=g; t.top=t.y+M.top*(t.type==='wall'?1:TSC); }
const TSC=1.3;   /* 塔も見やすいように少し大きく */
function upgrade(t){ const T=TW[t.type]; if(t.lv>=T.lv.length-1) return; const c=T.lv[t.lv+1].cost; if(G.gold<c) return; G.gold-=c; G.spent+=c; t.spent+=c; t.lv++;
  if(t.type==='wall'){ const add=T.lv[t.lv].hp-T.lv[t.lv-1].hp; t.max=T.lv[t.lv].hp; t.hp=t.hp>0?Math.min(t.max,t.hp+add):t.max; }
  setTowerMesh(t); if(t.type==='wall'&&t.hp>0) t.mesh.visible=true; addFx(t.x,t.y+.2,t.z,'#ffe08a',.6,2,6); snd('build'); shadowDirty=2; select(t.slot); updUI(true); }
function sell(t){ const back=Math.round(t.spent*(t.type==='wall'&&t.hp<=0?.3:.7)); G.gold+=back; scene.remove(t.mesh); towers.splice(towers.indexOf(t),1); t.slot.tower=null; popText(t.x,t.top,t.z,'+'+back); snd('coin'); shadowDirty=2; select(null); updUI(true); }
function repair(t){ const c=Math.round(t.spent*.35); if(G.gold<c) return; G.gold-=c; t.hp=t.max; t.mesh.visible=true; snd('build'); shadowDirty=2; select(t.slot); updUI(true); }

/* ================= 描画 ================= */
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_p=new THREE.Vector3(),_s=new THREE.Vector3(),_e=new THREE.Euler(),_up=V3(0,1,0),_z=V3(0,0,1);
function draw(dt,now){
  const cnt={},wc={};
  for(const k in IM){ cnt[k]=0; }
  for(const e of enemies){ const k=e.t,im=IM[k],d=e.d,sz=d.size*GS; if(cnt[k]>=im.body.instanceMatrix.count) continue; const i=cnt[k]++;
    e.ph+=dt*(d.air?9:(d.spd*(1-e.slow))*1.6);
    const bob=d.air?Math.sin(e.ph*.5)*.6:Math.abs(Math.sin(e.ph))*.12*sz, y=e.y+(d.air?(d.alt||0):0)+bob;
    _q.setFromAxisAngle(_up,e.hd); if(!d.air){ _q2.setFromAxisAngle(_z,Math.sin(e.ph)*.06); _q.multiply(_q2); }
    _p.set(e.x,y,e.z); _s.set(sz,sz,sz); _m.compose(_p,_q,_s); im.body.setMatrixAt(i,_m);
    _c.setRGB(1,1,1); if(e.hit>0) _c.setRGB(1.8,.7,.6); else if(e.slowT>0) _c.setRGB(.8,.85,1.3); im.body.setColorAt(i,_c);
    if(im.L){ const f=Math.sin(e.ph)*.8; for(const sd of ['L','R']){ const s=sd==='L'?-1:1; _q2.setFromEuler(_e.set(0,sd==='L'?Math.PI:0,f*-1)); const q=_q.clone().multiply(_q2); _p.set(e.x,y+.05*sz,e.z); _m.compose(_p,q,_s); im[sd].setMatrixAt(i,_m); } } }
  for(const k in IM){ const im=IM[k]; im.body.count=cnt[k]; im.body.instanceMatrix.needsUpdate=true; if(im.body.instanceColor) im.body.instanceColor.needsUpdate=true; if(im.L){ im.L.count=im.R.count=cnt[k]; im.L.instanceMatrix.needsUpdate=im.R.instanceMatrix.needsUpdate=true; } }
  /* 体力の帯 */
  let b=0; const cq=camera.quaternion,right=V3(1,0,0).applyQuaternion(cq);
  const bar=(x,y,z,f,w,col)=>{ if(b>=BAR.instanceMatrix.count-1) return; const h=w*.13;
    _p.set(x-right.x*w/2,y,z-right.z*w/2); _s.set(w,h,1); _m.compose(_p,cq,_s); BAR.setMatrixAt(b,_m); BAR.setColorAt(b++,_c.set('#1a1020'));
    _p.set(x-right.x*w/2,y,z-right.z*w/2); _s.set(Math.max(.01,w*f),h*.7,1); _m.compose(_p,cq,_s); BAR.setMatrixAt(b,_m); BAR.setColorAt(b++,_c.set(col)); };
  for(const e of enemies){ if(e.hp>=e.max&&!e.d.boss) continue; const sz=e.d.size*GS; bar(e.x,e.y+(e.d.air?(e.d.alt||0)+sz*.6:sz*1.25)+.6,e.z,e.hp/e.max,e.d.boss?7:2.6,e.d.boss?'#ff5a5a':e.hp/e.max>.5?'#7ee26a':'#ffb84a'); }
  for(const t of towers) if(t.type==='wall'&&t.hp>0&&t.hp<t.max) bar(t.x,t.y+5.6,t.z,t.hp/t.max,6,'#8fd0ff');
  BAR.count=b; BAR.instanceMatrix.needsUpdate=true; if(BAR.instanceColor) BAR.instanceColor.needsUpdate=true;
  /* 弾 */
  const pc={arrow:0,stone:0,bolt:0};
  for(const s of shots){ const m=PM[s.kind]; if(pc[s.kind]>=m.instanceMatrix.count) continue; _p.set(s.x,s.y,s.z);
    if(s.kind==='arrow'){ _q.setFromUnitVectors(_z,_s.set(s.dx,s.dy,s.dz).normalize()); _s.set(1.4,1.4,1.4); }
    else if(s.kind==='stone'){ _q.setFromEuler(_e.set(s.t*5,s.t*3,0)); _s.set(1,1,1); } else { _q.identity(); const k=1+.25*Math.sin(now*.03+s.t*20); _s.set(k,k,k); }
    _m.compose(_p,_q,_s); m.setMatrixAt(pc[s.kind]++,_m); }
  for(const k in PM){ PM[k].count=pc[k]; PM[k].instanceMatrix.needsUpdate=true; }
  /* 光の輪 */
  let fr=0,fp=0;
  for(const f of fx){ const k=f.t/f.dur,r=f.r0+(f.r1-f.r0)*(1-Math.pow(1-k,2)),fade=1-k;
    if(f.puff){ _p.set(f.x,f.y+r*.25,f.z); _s.set(r*.55,r*.4,r*.55); _m.compose(_p,_q.identity(),_s); PUFF.setMatrixAt(fp,_m); _c.copy(f.col).multiplyScalar(fade*.6); PUFF.setColorAt(fp++,_c); }
    _p.set(f.x,f.y,f.z); _s.set(r,1,r); _m.compose(_p,_q.identity(),_s); FXM.setMatrixAt(fr,_m); _c.copy(f.col).multiplyScalar(fade); FXM.setColorAt(fr++,_c); }
  FXM.count=fr; FXM.instanceMatrix.needsUpdate=true; if(FXM.instanceColor) FXM.instanceColor.needsUpdate=true;
  PUFF.count=fp; PUFF.instanceMatrix.needsUpdate=true; if(PUFF.instanceColor) PUFF.instanceColor.needsUpdate=true;
  /* 置き場所 */
  let si=0; const pulse=.85+.15*Math.sin(now*.004);
  for(const s of SLOTS){ const show=!s.tower||(s.wall&&s.tower.hp<=0); const sel=SEL===s;
    _p.set(s.x,s.y+.12,s.z); const k=(show||sel?(sel?1.15:pulse):0)*Math.max(1,cam.d/150); _s.set(s.wall?k*1.5:k,1,s.wall?k*.75:k);
    _q.setFromAxisAngle(_up,s.wall&&s.on?wallYaw(s):0); _m.compose(_p,_q,_s); SLOTM.setMatrixAt(si,_m); SLOTM.setColorAt(si++,_c.set(sel?'#ffffff':s.wall?'#ff8a3a':'#ffc534')); }
  SLOTM.count=si; SLOTM.instanceMatrix.needsUpdate=true; if(SLOTM.instanceColor) SLOTM.instanceColor.needsUpdate=true;
  /* 塔の動き */
  for(const t of towers){ if(t.arm){ const a=t.anim>0?(t.anim>.35?-1.6*(.5-t.anim)/.15:-1.6*t.anim/.35):0; t.arm.rotation.x=a+.35; }
    if(t.cr){ t.cr.position.y=towerModel('mage',t.lv).crystal+Math.sin(now*.003+t.x)*.35; t.cr.rotation.y=now*.0015; t.cr.material=t.anim>.3?CRY_HOT:CRY_MAT; }
    if(t.type==='wall'&&t.mesh) t.mesh.visible=t.hp>0; }
  /* 門・泉 */
  for(const g of portals){ g.children[0].rotation.z+=dt*.8; g.children[1].material.opacity=.55+.2*Math.sin(now*.004); }
  coreGem.rotation.y+=dt*.9; coreGem.position.y=4.4+Math.sin(now*.002)*.3; coreFlash=Math.max(0,coreFlash-dt);
  coreGem.material.emissive.set(coreFlash>0?'#ff3a3a':'#3ab0ff'); coreRing.material.color.set(coreFlash>0?'#ff5a5a':'#6ad0ff'); const cs=1+Math.sin(now*.003)*.06; coreRing.scale.set(cs,1,cs);
  chev.offset.x-=dt*.55;
  /* 流星 */
  if(MET.on){ const k=MET.t/.9; metBall.visible=true; metBall.position.set(MET.x-30*(1-k),MET.y+70*(1-k),MET.z-20*(1-k)); } else metBall.visible=false;
  metAim.visible=G.metArm&&!!metHover; if(metAim.visible){ metAim.position.set(metHover.x,metHover.y+.2,metHover.z); metAim.scale.set(METEOR.r,1,METEOR.r); }
}
const CRY_MAT=CRYSTAL.material, CRY_HOT=new THREE.MeshBasicMaterial({color:'#ffffff'});
function wallYaw(s){ const o=s.on[0],r=ROUTES[o.r],e={k:0,off:0}; routePos(r,o.s,e); return e.hd; }

/* ================= カメラ ================= */
const C0=MAP.cam,DMIN=35,DMAX=380;
/* はじめの距離: 横 w m・縦 h m がおさまるように（縦長のスマホでは遠め） */
function fitD(){ const vf=48*Math.PI/360,hf=Math.atan(Math.tan(vf)*innerWidth/innerHeight); return clamp(Math.max((C0.w||140)/2/Math.tan(hf),(C0.h||100)/2/Math.tan(vf)*.8),DMIN,DMAX); }
const cam={x:C0.x,z:C0.z,d:C0.d||fitD(),yaw:C0.yaw||0,p:C0.pitch||.98,ty:HOST.hy(C0.x,C0.z)}, camT=Object.assign({},cam);
function camApply(dt){ const k=Math.min(1,dt*10); for(const q of ['x','z','d','yaw']) cam[q]+=(camT[q]-cam[q])*k;
  const gy=HOST.hy(cam.x,cam.z); cam.ty+=(gy-cam.ty)*Math.min(1,dt*3);
  const cp=Math.cos(cam.p),sp=Math.sin(cam.p); let sx=0,sz=0; if(shake>0){ shake-=dt; sx=(Math.random()-.5)*shake*3; sz=(Math.random()-.5)*shake*3; }
  camera.position.set(cam.x+Math.sin(cam.yaw)*cp*cam.d+sx,cam.ty+sp*cam.d,cam.z+Math.cos(cam.yaw)*cp*cam.d+sz); camera.lookAt(cam.x+sx,cam.ty,cam.z+sz); }
function camClamp(){ const B=C0.bounds; camT.x=clamp(camT.x,B.x0,B.x1); camT.z=clamp(camT.z,B.z0,B.z1); camT.d=clamp(camT.d,DMIN,DMAX); }
function pan(dx,dy){ const k=2*cam.d*Math.tan(camera.fov*Math.PI/360)/innerHeight, c=Math.cos(cam.yaw),s=Math.sin(cam.yaw);
  camT.x-=(dx*c+dy*s/Math.sin(cam.p))*k; camT.z-=(-dx*s+dy*c/Math.sin(cam.p))*k; camClamp(); }
function toScreen(x,y,z){ _p.set(x,y,z).project(camera); return [(_p.x+1)/2*innerWidth,(1-_p.y)/2*innerHeight,_p.z]; }
function toGround(px,py){ const nd=V3(px/innerWidth*2-1,-(py/innerHeight)*2+1,.5).unproject(camera).sub(camera.position).normalize(); let h=cam.ty,x=0,z=0;
  for(let i=0;i<4;i++){ if(Math.abs(nd.y)<1e-4) return null; const t=(h-camera.position.y)/nd.y; if(t<0) return null; x=camera.position.x+nd.x*t; z=camera.position.z+nd.z*t; h=HOST.hy(x,z); } return {x,y:h,z}; }

/* ================= 操作 ================= */
const ptrs=new Map(); let gesture=null, metHover=null;
function onDown(ev){ unlockAudio(); ev.preventDefault(); ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY,x0:ev.clientX,y0:ev.clientY,t0:performance.now()});
  if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; gesture={d:Math.hypot(a.x-b.x,a.y-b.y),ang:Math.atan2(b.y-a.y,b.x-a.x),cd:camT.d,cy:camT.yaw,moved:true}; }
  else if(ptrs.size===1) gesture={moved:false}; }
function onMove(ev){ const p=ptrs.get(ev.pointerId); if(!p){ if(G.metArm&&!isTouch) metHover=toGround(ev.clientX,ev.clientY); return; }
  const dx=ev.clientX-p.x,dy=ev.clientY-p.y; p.x=ev.clientX; p.y=ev.clientY;
  if(ptrs.size>=2&&gesture&&gesture.cd){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y),ang=Math.atan2(b.y-a.y,b.x-a.x); camT.d=gesture.cd*gesture.d/Math.max(20,d); camT.yaw=gesture.cy+(ang-gesture.ang); camClamp(); return; }
  if(G.metArm){ metHover=toGround(ev.clientX,ev.clientY); if(Math.hypot(ev.clientX-p.x0,ev.clientY-p.y0)>10) gesture.moved=true; return; }
  if(gesture&&!gesture.moved&&Math.hypot(ev.clientX-p.x0,ev.clientY-p.y0)>9) gesture.moved=true;
  if(gesture&&gesture.moved) pan(dx,dy); }
function onUp(ev){ const p=ptrs.get(ev.pointerId); ptrs.delete(ev.pointerId); if(!p) return;
  if(ptrs.size===0&&gesture&&!gesture.moved&&!gesture.cd) tap(p.x0,p.y0);
  if(ptrs.size===0) gesture=null; else if(ptrs.size===1) gesture={moved:true}; }
function tap(px,py){
  if(G.metArm){ const g=toGround(px,py); if(g){ castMeteor(g); } return; }
  let best=null,bd=40*40;
  for(const s of SLOTS){ const [x,y,z]=toScreen(s.x,s.y+(s.tower?Math.min(4,s.tower.top-s.y):.5),s.z); if(z>1) continue; const d=(x-px)**2+(y-py)**2; if(d<bd){ bd=d; best=s; } }
  if(!best) for(const s of SLOTS){ if(!s.tower) continue; const [x,y,z]=toScreen(s.x,s.tower.top-1,s.z); if(z>1) continue; const d=(x-px)**2+(y-py)**2; if(d<44*44&&d<bd){ bd=d; best=s; } }
  select(best===SEL?null:best); }
function castMeteor(g){ if(G.met>0) return; MET.on=true; MET.t=0; MET.x=g.x; MET.y=g.y; MET.z=g.z; G.met=METEOR.cd; G.metArm=false; metHover=null; updUI(true); }
function unlockAudio(){ try{ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); }catch(e){} }

/* ================= 画面（HTML） ================= */
const ICON={
  archer:'<svg viewBox="0 0 32 32" fill="currentColor"><path d="M9 29h14l-2-17H11z"/><path d="M8 12h16v-3h-2v1.5h-2V9h-2v1.5h-4V9h-2v1.5h-2V9H8z"/><path d="M9 9 16 2l7 7z" opacity=".75"/><path d="M15 17h2v4h-2z" fill="#140f26"/></svg>',
  catapult:'<svg viewBox="0 0 32 32" fill="currentColor"><circle cx="9" cy="25" r="3.2"/><circle cx="23" cy="25" r="3.2"/><path d="M5 20h22v3H5z"/><path d="m12 21 12-15 2 1.6L14.6 22z"/><circle cx="25.5" cy="5.5" r="3"/><path d="M10 21l4-8h2l-2.4 8z"/></svg>',
  mage:'<svg viewBox="0 0 32 32" fill="currentColor"><path d="M11 30h10l-1.5-14h-7z"/><path d="M9.5 16h13L16 5z" opacity=".8"/><path d="m16 0 3 3.5-3 3.5-3-3.5z" fill="#9fe8ff"/></svg>',
  wall:'<svg viewBox="0 0 32 32" fill="currentColor"><path d="M2 12h4V9h3v3h4V9h6v3h4V9h3v3h4v16H2z"/><path d="M2 17h28M2 22h28M9 12v5M23 12v5M16 17v5M6 22v6M26 22v6" stroke="#140f26" stroke-width="1.2"/></svg>'
};
const SVG_COIN='<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#f0c040" stroke="#a87a10"/><path d="M8 4v8M5.8 6.2h4.4" stroke="#a87a10" stroke-width="1.4"/></svg>';
const SVG_GEM='<svg viewBox="0 0 16 16"><path d="M8 1 14 7 8 15 2 7z" fill="#8fe3ff" stroke="#2a8ac0"/></svg>';
const SVG_MET='<svg viewBox="0 0 24 24" fill="none" stroke="#ffd09a" stroke-width="2"><circle cx="15" cy="15" r="5" fill="#ff9a40" stroke="none"/><path d="M11 11 3 3M14 9 8 2M9 14 2 8"/></svg>';
const root=document.createElement('div'); root.id='td';
root.innerHTML=`
<div id="tdTop"><div id="tdStat"><span class="nm mc">${MAP.name}　防衛戦</span><div class="row"><span class="tdChip gold">${SVG_COIN}<span id="tdGold">0</span></span><span class="tdChip life" id="tdLife">${SVG_GEM}<span id="tdLives">0</span></span><span class="tdChip wave" id="tdWv">第0波</span></div></div>
  <span class="sp"></span><div class="btns"><button class="tdRnd pe" id="tdSpd" aria-label="速さ">×1</button><button class="tdRnd pe" id="tdPause" aria-label="一時停止">❚❚</button></div></div>
<div id="tdBot"><div id="tdNext"></div><div id="tdBar"><button class="pe" id="tdMet" aria-label="流星">${SVG_MET}流星<i></i></button><button class="pe" id="tdWave">防衛開始</button>
  <button class="tdRnd pe" id="tdRot" aria-label="回す">⟳</button></div></div>
<div id="tdSheet" class="pe" hidden></div>
<div id="tdToast"></div><div id="tdBanner"></div><div id="tdPops"></div>
<div class="tdOv mc" id="tdIntro"><div class="tdBox"><p class="k">世界さんぽディフェンス・第${STAGE_I+1}ステージ</p><h2>${MAP.name}</h2>
  <p style="font-family:inherit">${MAP.intro||''}</p>
  <ul><li>・<b>金色の輪</b>をタップして塔を建てる。建てた塔をタップすると強化・売却</li><li>・<b>橙の輪</b>は道の上。城壁で道をふさげる</li><li>・赤い矢印は地上の敵、紫は空の敵の通り道</li><li>・1本指で見回し、2本指で拡大・回転</li><li>・泉に敵がたどり着くと結界（${G.maxLives}）が削れる。全${WAVES.length}波を守り抜けば勝ち</li></ul>
  <div class="acts"><button class="go" id="tdGo">配置をはじめる</button><a href="${HOME}">タイトルへ</a></div></div></div>
<div class="tdOv" id="tdMenu" hidden><div class="tdBox mc"><p class="k">一時停止</p><h2>作戦会議</h2>
  <div class="tdTog"><button id="tdSnd">音</button><button id="tdLt">軽い画質</button></div>
  <div class="acts"><button class="go" id="tdRes">再開</button><button id="tdRetry">はじめからやり直す</button><a href="${HOME}#stages">ステージ選び</a><a id="tdWalk" href="${location.pathname}">この名所をさんぽする</a></div></div></div>
<div class="tdOv" id="tdEnd" hidden><div class="tdBox mc" id="tdEndBox"></div></div>
${BENCH?'<div id="tdFps"></div>':''}`;
document.body.appendChild(root);
const touch=document.createElement('div'); touch.id='tdTouch'; document.body.appendChild(touch);
root.addEventListener('pointerdown',unlockAudio);
{ const l=document.createElement('link'); l.rel='stylesheet'; l.href=BASE+'td.css'; document.head.appendChild(l); }
/* さんぽの画面（地図・ボタン・案内）は隠す */
for(const el of [...document.body.children]){ if(el===root||el===touch||el.contains(renderer.domElement)||el.tagName==='SCRIPT'||el.tagName==='STYLE'||el.tagName==='LINK') continue; el.style.display='none'; }
touch.addEventListener('pointerdown',onDown); addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); addEventListener('pointercancel',onUp);
touch.addEventListener('wheel',ev=>{ ev.preventDefault(); camT.d*=Math.exp(ev.deltaY*.0012); camClamp(); },{passive:false});
touch.addEventListener('contextmenu',ev=>ev.preventDefault());
addEventListener('keydown',ev=>{ if(ev.key===' '){ ev.preventDefault(); togglePause(); } if(ev.key==='q') camT.yaw-=Math.PI/4; if(ev.key==='e') camT.yaw+=Math.PI/4; });

let SEL=null;
function select(s){ SEL=s; const sh=$('tdSheet'); if(s){ const t=s.tower; refreshSheet.k=[s.i,t?t.type+t.lv:'',!!(t&&t.type==='wall'&&t.hp<=0),t&&t.type==='wall'&&t.hp<t.max].join(','); }
  if(!s){ sh.hidden=true; $('tdBot').hidden=false; rangeG.visible=false; return; }
  $('tdBot').hidden=true; sh.hidden=false; const t=s.tower;
  if(!t){ const types=s.wall?['wall']:TW_ORDER;
    sh.innerHTML=`<h3 class="mc">${s.wall?'道をふさぐ':'塔を建てる'}<button class="x" data-x>✕</button></h3><div class="tdCards${s.wall?' one':''}">`+types.map(k=>{ const T=TW[k],L=T.lv[0];
      return `<button class="tdCard" data-b="${k}" data-cost="${L.cost}" ${G.gold<L.cost?'disabled':''}>${ICON[k]}<b class="mc">${T.name}</b><small>${T.desc}</small><span class="c">${SVG_COIN.replace('<svg','<svg style="width:12px;height:12px;vertical-align:-1px"')} ${L.cost}</span></button>`; }).join('')+'</div>';
    showRange(s,s.wall?0:TW.archer.lv[0].range,true); }
  else { const T=TW[t.type],L=T.lv[t.lv],N=T.lv[t.lv+1],dead=t.type==='wall'&&t.hp<=0;
    const stat=t.type==='wall'?`<span>耐久 <b id="tdWhp">${Math.max(0,Math.round(t.hp))}/${t.max}</b></span>`:`<span>威力 <b>${L.dmg}</b></span><span>射程 <b>${L.range}m</b></span><span>間隔 <b>${L.rate}秒</b></span>${L.splash?`<span>範囲 <b>${L.splash}m</b></span>`:''}${L.slow?`<span>足止め <b>${Math.round(L.slow*100)}%</b></span>`:''}${L.chain?`<span>連鎖 <b>${L.chain}</b></span>`:''}`;
    const nx=N?(t.type==='wall'?`耐久→${N.hp}`:`威力→${N.dmg}`+(N.chain&&!L.chain?'・連鎖':'')):'';
    sh.innerHTML=`<h3 class="mc">${T.name}　Lv${t.lv+1}${dead?'（壊れている）':''}<button class="x" data-x>✕</button></h3><div class="tdInfo">${ICON[t.type]}<div class="st">${stat}</div></div>
      <div class="tdAct">${dead?`<button class="up" data-rep data-cost="${Math.round(t.spent*.35)}" ${G.gold<Math.round(t.spent*.35)?'disabled':''}>建て直す<small>${Math.round(t.spent*.35)}</small></button>`:N?`<button class="up" data-up data-cost="${N.cost}" ${G.gold<N.cost?'disabled':''}>強化<small>${N.cost}　${nx}</small></button>`:'<button disabled>最大まで強化</button>'}
      ${t.type==='wall'&&!dead&&t.hp<t.max?`<button data-rep data-cost="${Math.round(t.spent*.35)}" ${G.gold<Math.round(t.spent*.35)?'disabled':''}>修理<small>${Math.round(t.spent*.35)}</small></button>`:''}
      <button class="sell" data-sell>売る<small>+${Math.round(t.spent*(dead?.3:.7))}</small></button></div>`;
    showRange(s,t.type==='wall'?0:L.range); }
  sh.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{ if(buildTower(s,b.dataset.b)) select(s); });
  sh.querySelectorAll('[data-b]').forEach(b=>{ b.onpointerenter=()=>{ const T=TW[b.dataset.b]; if(!T.wall) showRange(s,T.lv[0].range,true); }; });
  const q=(a,f)=>{ const b=sh.querySelector(a); if(b) b.onclick=f; };
  q('[data-x]',()=>select(null)); q('[data-up]',()=>upgrade(t)); q('[data-sell]',()=>sell(t)); q('[data-rep]',()=>repair(t));
}
function showRange(s,r,preview){ if(!r){ rangeG.visible=false; return; } rangeG.visible=true; rangeG.position.set(s.x,s.y+.3,s.z); rangeG.scale.set(r,1,r); rangeRing.material.color.set(preview?'#a8e0ff':'#ffe08a'); rangeFill.material.color.copy(rangeRing.material.color); }
let toastT=0; function toast(t){ const el=$('tdToast'); el.textContent=t; el.style.opacity=1; clearTimeout(toastT); toastT=setTimeout(()=>el.style.opacity=0,2600); }
let banT=0; function banner(a,b){ const el=$('tdBanner'); el.innerHTML=`<span class="mc">${a}</span>${b?`<small>${b}</small>`:''}`; el.style.opacity=1; clearTimeout(banT); banT=setTimeout(()=>el.style.opacity=0,2400); }
/* 浮き文字（金貨） */
const pops=[]; function popText(x,y,z,txt){ if(pops.length>14){ const o=pops.shift(); o.el.remove(); } const el=document.createElement('div'); el.className='tdPop'; el.textContent=txt; $('tdPops').appendChild(el); pops.push({el,x,y,z,t:0}); }
function popGold(e,g){ popText(e.x,e.y+e.d.size*GS*1.3,e.z,'+'+g); }
function drawPops(dt){ for(let i=pops.length-1;i>=0;i--){ const p=pops[i]; p.t+=dt; if(p.t>1){ p.el.remove(); pops.splice(i,1); continue; } const [x,y,z]=toScreen(p.x,p.y+p.t*3,p.z); p.el.style.transform=`translate(${x-10}px,${y}px)`; p.el.style.opacity=z>1?0:1-p.t*p.t; } }

let uiT=0, last={};
function updUI(force){ const set=(id,v)=>{ if(last[id]!==v){ last[id]=v; $(id).innerHTML=v; } };
  set('tdGold',String(Math.floor(G.gold))); set('tdLives',String(Math.max(0,G.lives))); set('tdWv',`第${Math.max(0,G.wave+1)}/${WAVES.length}波`);
  const wb=$('tdWave');
  if(!G.started){ wb.disabled=false; set('tdWave','防衛開始<small>第1波を呼ぶ</small>'); set('tdNext',`第1波：<b>${waveText(0)}</b>`); }
  else if(G.wave>=WAVES.length-1){ wb.disabled=true; set('tdWave',G.spawnDone?'最後の波<small>残りを倒せ</small>':'最後の波<small>敵が出てくる</small>'); set('tdNext',`残る敵 <b>${enemies.length+G.queue.length}</b>`); }
  else if(G.nextT>0){ wb.disabled=false; set('tdWave',`次の波を呼ぶ<small>あと${Math.ceil(G.nextT)}秒・早いほど金貨</small>`); set('tdNext',`第${G.wave+2}波：<b>${waveText(G.wave+1)}</b>`); }
  else { wb.disabled=true; set('tdWave',`第${G.wave+1}波<small>敵が出てくる</small>`); set('tdNext',`次 第${G.wave+2}波：<b>${waveText(G.wave+1)}</b>`); }
  const mb=$('tdMet'); mb.disabled=G.met>0||!G.started; mb.classList.toggle('arm',G.metArm); mb.querySelector('i').style.top=(G.met>0?(1-G.met/METEOR.cd)*100:100)+'%';
  if(SEL&&!$('tdSheet').hidden) refreshSheet();
}
/* シートは作り直さず、押せる・押せないと耐久だけ書きかえる（押している最中に消えないように） */
function refreshSheet(){ const t=SEL.tower,dead=!!(t&&t.type==='wall'&&t.hp<=0),k=[SEL.i,t?t.type+t.lv:'',dead,t&&t.type==='wall'&&t.hp<t.max].join(',');
  if(k!==refreshSheet.k){ refreshSheet.k=k; select(SEL); return; }
  $('tdSheet').querySelectorAll('[data-cost]').forEach(b=>b.disabled=G.gold<+b.dataset.cost);
  const w=$('tdWhp'); if(w&&t) w.textContent=Math.max(0,Math.round(t.hp))+'/'+t.max; }
$('tdWave').onclick=()=>{ if(!G.started) callWave(false); else if(G.nextT>0) callWave(true); };
$('tdMet').onclick=()=>{ if(G.met>0||!G.started) return; G.metArm=!G.metArm; if(G.metArm){ select(null); toast('流星を落とす場所をタップ'); } metHover=null; updUI(true); };
$('tdRot').onclick=()=>{ camT.yaw+=Math.PI/4; };
$('tdSpd').onclick=()=>{ G.speed=G.speed===1?2:G.speed===2?3:1; $('tdSpd').textContent='×'+G.speed; $('tdSpd').classList.toggle('on',G.speed>1); };
function togglePause(f){ G.paused=f===undefined?!G.paused:f; $('tdMenu').hidden=!G.paused; renderTogs(); }
$('tdPause').onclick=()=>togglePause(true); $('tdRes').onclick=()=>togglePause(false);
$('tdRetry').onclick=()=>location.reload();
function renderTogs(){ $('tdSnd').textContent='音：'+(OPT.sound?'あり':'なし'); $('tdSnd').classList.toggle('on',OPT.sound); $('tdLt').textContent='軽い画質：'+(OPT.light?'オン':'オフ'); $('tdLt').classList.toggle('on',OPT.light); }
$('tdSnd').onclick=()=>{ OPT.sound=!OPT.sound; SV.opt=OPT; save(); renderTogs(); };
$('tdLt').onclick=()=>{ OPT.light=!OPT.light; SV.opt=OPT; save(); applyQual(); renderTogs(); };
$('tdGo').onclick=()=>{ $('tdIntro').hidden=true; unlockAudio(); snd('build'); toast('金色の輪をタップして塔を建てよう'); };
function applyQual(){ if(HOST.setQual) HOST.setQual(OPT.light?'low':'high'); const pr=Math.min(window.devicePixelRatio||1,OPT.light?1:(isTouch?1.5:1.75)); renderer.setPixelRatio(pr); renderer.setSize(innerWidth,innerHeight); shadowDirty=2; }

/* ================= 結果 ================= */
function finish(win){ G.over=true; G.paused=false; select(null); G.metArm=false;
  const stars=win?(G.lives>=G.maxLives*.9?3:G.lives>=G.maxLives*.5?2:1):0, next=ST.STAGES[STAGE_I+1];
  if(win&&!BENCH){ const r=(SV.stages=SV.stages||{})[MAP.id]||{}; r.cleared=true; r.stars=Math.max(r.stars||0,stars); r.bestLives=Math.max(r.bestLives||0,G.lives); SV.stages[MAP.id]=r; save(); }
  const st='★'.repeat(stars)+'<s>'+'★'.repeat(3-stars)+'</s>';
  $('tdEndBox').className='tdBox mc'+(win?'':' lose');
  $('tdEndBox').innerHTML=win?`<p class="k">${MAP.name}</p><h2>守り抜いた！</h2><div class="tdStars">${st}</div>
    <ul><li>結界の残り <b>${G.lives}／${G.maxLives}</b></li><li>倒した魔物 <b>${G.kills}</b>　・　使った金貨 <b>${G.spent}</b></li>${next&&!next.url?`<li>次の第${STAGE_I+2}ステージ「${next.name}」は準備中です</li>`:''}</ul>
    <div class="acts">${next&&next.url?`<a class="go" href="${next.url}">次へ：${next.name}</a>`:''}<a ${next&&next.url?'':'class="go"'} href="${HOME}#stages">ステージ選び</a><button id="tdAgain">もう一度</button></div>`
   :`<p class="k">${MAP.name}</p><h2>結界が破られた…</h2><ul><li>第<b>${G.wave+1}</b>波まで守った　・　倒した魔物 <b>${G.kills}</b></li><li>道が合わさる所に塔を集め、城壁で足止めしたところを投石機で砕こう。空の敵には弓と魔法。</li></ul>
    <div class="acts"><button class="go" id="tdAgain">もう一度</button><a href="${HOME}#stages">ステージ選び</a></div>`;
  $('tdEnd').hidden=false; $('tdAgain').onclick=()=>location.reload(); snd(win?'win':'lose'); }

/* ================= 毎フレーム ================= */
let fpsN=0,fpsT=0,fpsV=0;
function frame(dt){ const now=performance.now();
  if(G.started&&!G.paused&&!G.over){ let s=dt*G.speed; while(s>1e-4){ const h=Math.min(s,1/30); step(h); s-=h; } }
  camApply(dt); draw(G.paused?0:dt*(G.started?G.speed:1),now); drawPops(dt);
  if(shadowDirty>0){ renderer.shadowMap.needsUpdate=true; shadowDirty--; }
  uiT-=dt; if(uiT<=0){ uiT=.2; updUI(true); }
  if(BENCH){ fpsN++; fpsT+=dt; if(fpsT>=1){ fpsV=fpsN/fpsT; fpsN=0; fpsT=0; const i=renderer.info.render; $('tdFps').textContent=`${fpsV.toFixed(0)} fps\n敵 ${enemies.length}\n三角形 ${(i.triangles/1000).toFixed(0)}k\n描画 ${i.calls}`; }
    if(G.started&&enemies.length<200&&Math.random()<.5){ const ks=['goblin','orc','wolf','skeleton','bat','troll']; const k=ks[Math.floor(Math.random()*ks.length)]; spawn(k,EN[k].air?'air':Math.random()<.5?'g0':'g1'); } }
}

/* ================= はじめ ================= */
if(HOST.setEra&&MAP.era) HOST.setEra(MAP.era);
camera.fov=48; camera.near=.5; camera.updateProjectionMatrix();
const LI=QS.has('nolight')?{}:lighten();
applyQual();
camApply(1);
updUI(true); renderTogs();
if(BENCH){ $('tdIntro').hidden=true; G.started=true; G.wave=0; G.spawnDone=true; G.gold=99999; for(const s of SLOTS) if(!s.wall) buildTower(s,TW_ORDER[s.i%3]); }
window.SekaiTD={ready:true,frame,map:MAP,G,lightInfo:LI,
  /* 調べもの用 */
  debug:{enemies,towers,SLOTS,ROUTES,spawn,build:(i,k)=>buildTower(SLOTS[i],k),upgrade:i=>upgrade(SLOTS[i].tower),wave:()=>callWave(false),
    run:(sec,h)=>{ h=h||1/30; for(let t=0;t<sec&&!G.over;t+=h) step(h); return {wave:G.wave,lives:G.lives,gold:G.gold,enemies:enemies.length,over:G.over,kills:G.kills}; },cam:camT,start:()=>{ $('tdIntro').hidden=true; }}};
})();
