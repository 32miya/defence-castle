/* 松山城さんぽ index.html から取り出した地形と堀（node 用・自動で作った写し） */
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
/* 勝山（高さのある地形メッシュの範囲） */
const INR={x0:-220,x1:140,z0:-300,z1:60};
/* 三之丸（堀之内）をかこむ堀: 北堀・西堀・南堀（東は二之丸と勝山） */
const MOATS=[{id:'nishibori',x0:-480,x1:-450,z0:-244,z1:182,name:'西堀'},{id:'kitabori',x0:-450,x1:-214,z0:-244,z1:-214,name:'北堀'},{id:'minamibori',x0:-450,x1:-214,z0:152,z1:182,name:'南堀'}];
const SAN={x0:-450,x1:-214,z0:-214,z1:152};   /* 三之丸（堀之内）の平地 */
const TOWN={x0:-700,x1:520,z0:60,z1:420};
/* 曲輪（平らな段）。wall: 石垣の高さの目安（斜面の始まり）。同じ場所に重なるときは先に書いた方が優先 */
const PLAT=[
  {id:'hondan',x0:-38,x1:14,z0:-216,z1:-162,H:58,wall:4,name:'本壇'},
  {id:'hiroba',x0:14,x1:34,z0:-216,z1:-162,H:58,wall:4,name:'本壇の広場'},
  {id:'masu1',x0:14,x1:34,z0:-162,z1:-150,H:58,wall:4,name:'一ノ門の枡形'},
  {id:'honN',x0:-52,x1:32,z0:-252,z1:-140,H:54,wall:8,name:'本丸（北）'},
  {id:'honS',x0:-18,x1:26,z0:-140,z1:-24,H:54,wall:8,name:'本丸広場'},
  {id:'masu',x0:-46,x1:-18,z0:-84,z1:-60,H:52,wall:6,name:'太鼓門の前'},
  {id:'koshi',x0:-46,x1:-18,z0:-60,z1:-16,H:50,wall:6,name:'筒井門の前'},
  {id:'taikoshita',x0:-46,x1:-22,z0:2,z1:22,H:40,wall:5,name:'太鼓櫓の下'},
  {id:'agekido',x0:-70,x1:-56,z0:10,z1:24,H:34,wall:5,name:'揚木戸門'},
  {id:'ote',x0:-70,x1:-58,z0:-48,z1:-24,H:24,wall:5,name:'大手門'},
  {id:'kita',x0:-130,x1:-110,z0:-244,z1:-226,H:30,wall:4,name:'北の郭'},
  {id:'ninomaru',x0:-190,x1:-120,z0:-80,z1:20,H:10,wall:6,name:'二之丸'},
  {id:'choja',x0:50,x1:90,z0:-10,z1:30,H:30,wall:0,name:'長者ヶ平'}];
/* 曲輪の外の山の高まり: 歩けない林 */
const MASS=[{x:-10,z:-140,H:46,k:.42},{x:40,z:-120,H:40,k:.5},{x:-60,z:-150,H:40,k:.5},{x:0,z:-280,H:34,k:.5}];
const MOUNDS=[];
function moundH(x,z){ return 0; }
const PL={}; PLAT.forEach(p=>PL[p.id]=p);
/* 石段・坂道。a: 'x' か 'z' の向き、f→t でその座標、h0→h1 で高さ。road: 石段ではなく坂道 */
const RAMPS=[
  {id:'kuromon',x0:-120,x1:-70,z0:-40,z1:-32,a:'x',f:-120,t:-70,h0:10,h1:24,name:'黒門口登城道',road:true},
  {id:'otezaka',x0:-66,x1:-60,z0:-24,z1:10,a:'z',f:-24,t:10,h0:24,h1:34,name:'大手の登城道',road:true},
  {id:'agesaka',x0:-56,x1:-46,z0:14,z1:20,a:'x',f:-56,t:-46,h0:34,h1:40,name:'揚木戸門からの石段'},
  {id:'tonasaka',x0:-40,x1:-30,z0:-16,z1:2,a:'z',f:2,t:-16,h0:40,h1:50,name:'戸無門への石段'},
  {id:'tsutsuiramp',x0:-41,x1:-35,z0:-64,z1:-57,a:'z',f:-57,t:-64,h0:50,h1:52,name:'筒井門'},
  {id:'kakureramp',x0:-27.5,x1:-23.5,z0:-64,z1:-57,a:'z',f:-57,t:-64,h0:50,h1:52,name:'隠門'},
  {id:'taikoramp',x0:-22,x1:-14,z0:-75,z1:-69,a:'x',f:-22,t:-14,h0:52,h1:54,name:'太鼓門'},
  {id:'ichiramp',x0:2,x1:14,z0:-160,z1:-153,a:'x',f:2,t:14,h0:54,h1:58,name:'一ノ門への石段'},
  {id:'chojazaka',x0:-22,x1:50,z0:8,z1:16,a:'x',f:50,t:-22,h0:30,h1:40,name:'長者ヶ平からの登城道',road:true},
  {id:'inuisaka',x0:-110,x1:-52,z0:-240,z1:-232,a:'x',f:-52,t:-110,h0:54,h1:30,name:'乾門からの坂',road:true},
  {id:'furumachi',x0:-126,x1:-118,z0:-226,z1:-80,a:'z',f:-226,t:-80,h0:30,h1:10,name:'古町口登城道',road:true},
  {id:'ushisaka',x0:32,x1:80,z0:-240,z1:-232,a:'x',f:32,t:80,h0:54,h1:36,name:'艮門からの坂',road:true},
  {id:'ushi2',x0:80,x1:88,z0:-240,z1:-10,a:'z',f:-240,t:-10,h0:36,h1:30,name:'艮門からの坂',road:true},
  {id:'ninosaka',x0:-218,x1:-190,z0:-60,z1:-52,a:'x',f:-190,t:-218,h0:10,h1:.25,name:'二之丸の坂',road:true},
  {id:'shinonome',x0:90,x1:138,z0:20,z1:27,a:'x',f:90,t:138,h0:30,h1:1,name:'東雲口登城道',road:true}];
function rampH(r,x,z){ const c=r.a==='x'?x:z,u=Math.max(0,Math.min(1,(c-r.f)/(r.t-r.f))); return r.h0+(r.h1-r.h0)*u; }
/* 勝山の自然の斜面（林）: 曲輪から下へ、およそ32°で下る */
function hillRaw(x,z){ let h=0; for(const p of PLAT){ const top=p.H-p.wall-.62*rDist(p,x,z); if(top>h) h=top; }
  for(const q of MASS){ const top=q.H-q.k*Math.hypot(x-q.x,(z-q.z)*.8); if(top>h) h=top; }
  for(const r of RAMPS){ if(!r.road) continue; const d=rDist(r,x,z); if(d>70) continue; const top=rampH(r,x,z)-.4-.55*d; if(top>h) h=top; } return h; }
function hillH(x,z){ if(!inR(INR,x,z,0)) return 0; let h=hillRaw(x,z); if(h<=0) return 0; const e=Math.min(x-INR.x0,INR.x1-x,z-INR.z0,INR.z1-z); h*=sstep(e/40); if(h>.4) h+=(fbm(x*.05,z*.05,3)-.5)*Math.min(3.2,h*.4); return Math.max(0,h); }
function platAt(x,z){ for(const p of PLAT) if(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1) return p; return null; }
/* 地形メッシュ用: 石垣のある辺の上の点は外側として扱う（石垣の面が地面の斜面に埋もれないように） */
function platAtMesh(x,z){ for(const p of PLAT){ if(!(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1)) continue; const W=p.walls; if(W){ const e=.01; if((W[0]&&z<p.z0+e)||(W[1]&&x>p.x1-e)||(W[2]&&z>p.z1-e)||(W[3]&&x<p.x0+e)) continue; } return p; } return null; }
function rampAt(x,z){ for(const r of RAMPS) if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1) return r; return null; }
/* 足もとの地面（橋を除く） */
function baseH(x,z){ if(!inR(INR,x,z,0)) return moundH(x,z); const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAt(x,z); if(p) return p.H; return hillH(x,z); }
function meshH(x,z){ if(!inR(INR,x,z,0)) return moundH(x,z); const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAtMesh(x,z); if(p) return p.H; const q=platAt(x,z); if(q){ let lo=1e9; for(const [dx,dz] of [[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]]){ const x2=x+dx,z2=z+dz; if(platAt(x2,z2)===q) continue; lo=Math.min(lo,baseH(x2,z2)); } return lo<1e8?lo:q.H; } return hillH(x,z); }
/* 曲輪の4辺（北・東・南・西）のどこに石垣があるか: 外側が低い辺 */
for(const p of PLAT){ if(!p.wall) continue; const E=[[p.x0,p.z0,p.x1,p.z0,0,-1],[p.x1,p.z0,p.x1,p.z1,1,0],[p.x0,p.z1,p.x1,p.z1,0,1],[p.x0,p.z0,p.x0,p.z1,-1,0]];
  p.walls=E.map(([ax,az,bx,bz,nx,nz])=>{ const L=Math.hypot(bx-ax,bz-az),n=Math.max(3,Math.ceil(L/2.5)); let lo=1e9; for(let i=0;i<=n;i++){ const t=i/n; lo=Math.min(lo,baseH(ax+(bx-ax)*t+nx*1.8,az+(bz-az)*t+nz*1.8)); } return lo<p.H-.6; }); }
/* 橋（三之丸の堀に架かる土橋・木橋） */
const archH=(z0,z1,k)=>(x,z)=>.35+(k||.5)*Math.sin(Math.PI*Math.min(1,Math.max(0,(z-z0)/(z1-z0))));
const flatH=v=>()=>v;
const BRIDGES=[
  {id:'b_minami',x0:-336,x1:-322,z0:151,z1:183,h:flatH(.3),mode:'both',name:'南堀の土橋',dobashi:true},
  {id:'b_kita',x0:-334,x1:-324,z0:-245,z1:-213,h:archH(-245,-213,.6),mode:'both',name:'北堀の橋'},
  {id:'b_nishi',x0:-481,x1:-449,z0:-20,z1:-12,h:flatH(.3),mode:'both',name:'西堀の土橋',dobashi:true}];
let BOUNDS={x0:-640,x1:520,z0:-420,z1:420}; let SCEN=null; const FILL={};
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||b.mode===MODE);
function waterAt(x,z,m){ m=m||0; for(const w of MOATS) if(inR(w,x,z,m)) return true; return false; }
module.exports={baseH,waterAt,actB,inR,BRIDGES,PLAT,RAMPS};
