/* 32miya-aizu-castle index.html から取り出した地形と堀（node 用・自動で作った写し） */
let MODE='edo';
function hash(x,y){ const h=Math.sin(x*127.1+y*311.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,y){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbm(x,y,o){ let s=0,a=.5,f=1; for(let i=0;i<(o||5);i++){ s+=a*vnoise(x*f,y*f); f*=2.03; a*=.5; } return s; }
const WATER_Y=-1.8, DRY_Y=-1;
const inR=(r,x,z,m)=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;
const sstep=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
function segD(px,pz,a,b){ const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz))); return Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t); }
const rDist=(r,x,z)=>Math.hypot(Math.max(r.x0-x,0,x-r.x1),Math.max(r.z0-z,0,z-r.z1));
/* 城域（堀を含む） */
const INR={x0:-222,x1:252,z0:-176,z1:142};
/* 堀（水堀）: 内堀（本丸・帯郭のまわり）と、北出丸・西出丸・二の丸の外の堀 */
const MOATS=[
  {id:'mN',x0:-120,x1:124,z0:-96,z1:-72},{id:'mW',x0:-120,x1:-98,z0:-96,z1:120},{id:'mS',x0:-120,x1:124,z0:98,z1:120},{id:'mE',x0:98,x1:124,z0:-96,z1:120},
  {id:'kN',x0:-84,x1:64,z0:-174,z1:-150},{id:'kW',x0:-84,x1:-60,z0:-150,z1:-96},{id:'kE',x0:40,x1:64,z0:-150,z1:-96},
  {id:'nW',x0:-220,x1:-196,z0:-88,z1:88},{id:'nN',x0:-196,x1:-120,z0:-88,z1:-64},{id:'nS',x0:-196,x1:-120,z0:64,z1:88},
  {id:'eN',x0:124,x1:250,z0:-120,z1:-96},{id:'eE',x0:226,x1:250,z0:-96,z1:140},{id:'eS',x0:124,x1:226,z0:120,z1:140}];
function inMoat(x,z,m){ m=m||0; for(const r of MOATS) if(inR(r,x,z,m)) return true; return false; }
/* 湯川（城下の西）。涙橋（柳橋）がかかる */
const RIV={x0:-490,x1:-476,z0:-1400,z1:1400};
/* 山: 飯盛山（白虎隊）・小田山（新政府軍の砲台）・母成峠（縮めて表示） */
const HILLS=[{id:'iimori',x:440,z:-290,R:95,H:38},{id:'oda',x:400,z:360,R:140,H:54},{id:'bonari',x:540,z:-540,R:85,H:30}];
const HILLR=HILLS.map(s=>({x0:s.x-s.R-2,x1:s.x+s.R+2,z0:s.z-s.R-2,z1:s.z+s.R+2}));
function natH(x,z){ let h=0; for(const s of HILLS){ const d=Math.hypot(x-s.x,z-s.z)/s.R; if(d<1){ const v=s.H*Math.pow((1+Math.cos(Math.PI*d))/2,1.1)*(.88+.24*fbm(x*.03+s.x*.01,z*.03,3)); if(v>h) h=v; } } return h; }
const TOWN={x0:-470,x1:300,z0:-560,z1:-190};
/* 曲輪（平らな段）。wall: 石垣の高さの目安 */
const PLAT=[
  {id:'honmaru',x0:-70,x1:70,z0:-72,z1:70,H:8,wall:10,name:'本丸'},
  {id:'obiW',x0:-98,x1:-70,z0:-72,z1:98,H:5,wall:7,name:'帯郭（西）'},
  {id:'obiS',x0:-70,x1:98,z0:70,z1:98,H:5,wall:7,name:'帯郭（南）'},
  {id:'obiE',x0:70,x1:98,z0:-72,z1:70,H:5,wall:7,name:'帯郭（東）'},
  {id:'kitaide',x0:-60,x1:40,z0:-150,z1:-96,H:3,wall:5,name:'北出丸'},
  {id:'nishide',x0:-196,x1:-120,z0:-64,z1:64,H:3,wall:5,name:'西出丸'},
  {id:'nino',x0:124,x1:226,z0:-96,z1:120,H:3,wall:5,name:'二の丸'}];
const MOUNDS=[];
function moundH(x,z){ return 0; }
const PL={}; PLAT.forEach(p=>PL[p.id]=p);
/* 坂・土橋。a: 'x' か 'z' の向き、f→t でその座標、h0→h1 で高さ */
const RAMPS=[
  {id:'tsubaki',x0:16,x1:26,z0:-96,z1:-72,a:'z',f:-96,t:-72,h0:3,h1:8,name:'椿坂（北出丸から本丸へ）'},
  {id:'otemon',x0:-16,x1:-6,z0:-176,z1:-150,a:'z',f:-176,t:-150,h0:0,h1:3,name:'北出丸 追手門の土橋'},
  {id:'nishiD',x0:-120,x1:-98,z0:-4,z1:6,a:'x',f:-120,t:-98,h0:3,h1:5,name:'西中門の土橋'},
  {id:'nishiOut',x0:-222,x1:-196,z0:-4,z1:6,a:'x',f:-222,t:-196,h0:0,h1:3,name:'西出丸口の土橋'},
  {id:'kurogane',x0:-86,x1:-68,z0:-24,z1:-16,a:'x',f:-86,t:-68,h0:5,h1:8,name:'鉄門への坂'},
  {id:'higashi',x0:66,x1:84,z0:-42,z1:-34,a:'x',f:84,t:66,h0:5,h1:8,name:'本丸東の坂'},
  {id:'minami',x0:-6,x1:2,z0:62,z1:80,a:'z',f:80,t:62,h0:5,h1:8,name:'本丸南の坂'},
  {id:'minamiOut',x0:40,x1:50,z0:98,z1:142,a:'z',f:142,t:98,h0:0,h1:5,name:'南口の土橋'},
  {id:'sannomaru',x0:226,x1:252,z0:0,z1:10,a:'x',f:252,t:226,h0:0,h1:3,name:'三の丸口の土橋'}];
const HS=1;
const ENTR=[];
function rampH(r,x,z){ const c=r.a==='x'?x:z,u=Math.max(0,Math.min(1,(c-r.f)/(r.t-r.f))); return r.h0+(r.h1-r.h0)*u; }
function hillRaw(x,z){ return 0; }
function hillH(x,z){ return 0; }
function platAt(x,z){ for(const p of PLAT) if(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1) return p; return null; }
function platAtMesh(x,z){ for(const p of PLAT){ if(!(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1)) continue; const W=p.walls; if(W){ const e=.01; if((W[0]&&z<p.z0+e)||(W[1]&&x>p.x1-e)||(W[2]&&z>p.z1-e)||(W[3]&&x<p.x0+e)) continue; } return p; } return null; }
function rampAt(x,z){ for(const r of RAMPS) if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1) return r; return null; }
function baseH(x,z){ if(!inR(INR,x,z,0)) return natH(x,z); const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAt(x,z); if(p) return p.H; if(inMoat(x,z,0)) return -2.6; return 0; }
function meshH(x,z){ if(!inR(INR,x,z,0)) return natH(x,z); const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAtMesh(x,z); if(p) return p.H; const q=platAt(x,z); if(q){ let lo=1e9; for(const [dx,dz] of [[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]]){ const x2=x+dx,z2=z+dz; if(platAt(x2,z2)===q) continue; lo=Math.min(lo,baseH(x2,z2)); } return lo<1e8?lo:q.H; } if(inMoat(x,z,0)) return -2.6; return 0; }
for(const p of PLAT){ if(!p.wall) continue; const E=[[p.x0,p.z0,p.x1,p.z0,0,-1],[p.x1,p.z0,p.x1,p.z1,1,0],[p.x0,p.z1,p.x1,p.z1,0,1],[p.x0,p.z0,p.x0,p.z1,-1,0]];
  p.walls=E.map(([ax,az,bx,bz,nx,nz])=>{ const L=Math.hypot(bx-ax,bz-az),n=Math.max(3,Math.ceil(L/2.5)); let lo=1e9; for(let i=0;i<=n;i++){ const t=i/n; lo=Math.min(lo,baseH(ax+(bx-ax)*t+nx*1.8,az+(bz-az)*t+nz*1.8)); } return lo<p.H-.6; }); }
/* 橋: 廊下橋（本丸と二の丸をつなぐ）・涙橋（柳橋、湯川）ほか */
const BRIDGES=[
  {id:'roka',x0:97,x1:125,z0:-42,z1:-34,h:(x,z)=>5+(3-5)*Math.max(0,Math.min(1,(x-97)/28)),mode:'both',name:'廊下橋'},
  {id:'namida',x0:-492,x1:-474,z0:-124,z1:-116,h:()=>.5,mode:'both',name:'涙橋（柳橋）'},
  {id:'yugawaS',x0:-492,x1:-474,z0:196,z1:206,h:()=>.5,mode:'both',name:'湯川の橋'},
  {id:'yugawaN',x0:-492,x1:-474,z0:-430,z1:-420,h:()=>.5,mode:'both',name:'湯川の橋（北）'}];
let BOUNDS={x0:-540,x1:560,z0:-560,z1:540}; let SCEN=null; const FILL={};
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||b.mode===MODE);
/* 天守台（野面積みの石垣）: 本丸の北西。中心と大きさ */
const TZ={cx:-46,cz:-58.5,g0:8,bw:30,bd:27,bh:7,bat:2.2,ch:.4};
function waterAt(x,z,m){ m=m||0; if(inR(RIV,x,z,m)) return true; if(!inR(INR,x,z,m)) return false; if(rampAt(x,z)) return false; if(platAt(x,z)) return false; return inMoat(x,z,m); }
module.exports={baseH:typeof baseH!=='undefined'?baseH:null,waterAt,actB,inR,BRIDGES,groundH:typeof groundH!=='undefined'?groundH:null};
