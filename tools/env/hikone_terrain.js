/* 彦根城さんぽ index.html から取り出した地形と堀（node 用・自動で作った写し） */
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
/* 内堀・中堀・外堀 */
const INR={x0:-120,x1:124,z0:-236,z1:184};    // 内堀の内側（彦根山と表御殿）
const IOUT={x0:-142,x1:146,z0:-258,z1:206};   // 内堀の外周
const NIN={x0:-250,x1:330,z0:-372,z1:330};    // 中堀の内側（二の丸）
const NOUT={x0:-274,x1:354,z0:-396,z1:354};   // 中堀の外周
const LAKE_X=-300;                            // これより西は琵琶湖
const NAIKO_Z=-440;                           // 江戸時代: これより北は松原内湖
const SOTO={S:{x0:LAKE_X,x1:622,z0:640,z1:662},E:{x0:600,x1:622,z0:354,z1:662}}; // 江戸時代の外堀
const TOWN={x0:-274,x1:600,z0:354,z1:640};   // 第三郭（城下町）
/* 曲輪（平らな段）。wall: 石垣の高さ（下の斜面との差）。0 は石垣なしで斜面へつながる */
const PLAT=[
  {id:'honmaru',x0:-36,x1:36,z0:-56,z1:10,H:36,wall:9,name:'本丸'},
  {id:'taiko',x0:-24,x1:22,z0:10,z1:58,H:33,wall:9,name:'太鼓丸'},
  {id:'kane',x0:-32,x1:26,z0:80,z1:130,H:33,wall:9,name:'鐘の丸'},
  {id:'nishi',x0:-40,x1:30,z0:-140,z1:-56,H:34,wall:9,name:'西の丸'},
  {id:'dekuruwa',x0:-92,x1:-70,z0:-150,z1:-112,H:28,wall:9,name:'出曲輪'},
  {id:'yamazaki',x0:-84,x1:-48,z0:-214,z1:-160,H:8,wall:4,name:'山崎曲輪'},
  {id:'horikiri',x0:-64,x1:64,z0:58,z1:80,H:21,wall:0,name:'大堀切'},
  {id:'horikiri2',x0:-70,x1:-40,z0:-150,z1:-112,H:24,wall:0,name:'西の丸の大堀切'},
  {id:'land1',x0:-30,x1:10,z0:-170,z1:-162,H:21,wall:0,name:'山崎曲輪への道'},
  {id:'land2',x0:58,x1:66,z0:-110,z1:-94,H:18,wall:0,name:'黒門への道'}];
/* 曲輪の外の小山（玄宮園の築山・鳳翔台） */
const MOUNDS=[{x:308,z:-296,R:20,H:3.2,name:'鳳翔台'},{x:196,z:-236,R:14,H:2.2},{x:288,z:-232,R:12,H:1.8}];
function moundH(x,z){ let h=0; for(const q of MOUNDS){ const d=Math.hypot(x-q.x,z-q.z); if(d<q.R){ const t=1-d/q.R; h=Math.max(h,q.H*Math.min(1,sstep(t*1.6))); } } return h; }
const PL={}; PLAT.forEach(p=>PL[p.id]=p);
/* 石段（坂）。a: 'x' か 'z' の向き、f→t でその座標、h0→h1 で高さ */
const RAMPS=[
  {id:'omote',x0:64,x1:100,z0:66,z1:74,a:'x',f:100,t:64,h0:0,h1:21,name:'表門山道'},
  {id:'ote',x0:-64,x1:-56,z0:80,z1:116,a:'z',f:116,t:80,h0:0,h1:21,name:'大手山道'},
  {id:'kaneup',x0:26,x1:46,z0:80,z1:86,a:'x',f:46,t:26,h0:21,h1:33,name:'鐘の丸への石段'},
  {id:'taikomon',x0:-4,x1:4,z0:4,z1:16,a:'z',f:16,t:4,h0:33,h1:36,name:'太鼓門櫓'},
  {id:'nishiramp',x0:-12,x1:-4,z0:-66,z1:-50,a:'z',f:-50,t:-66,h0:36,h1:34,name:'西の丸への坂'},
  {id:'yama1',x0:2,x1:10,z0:-162,z1:-140,a:'z',f:-140,t:-162,h0:34,h1:21,name:'山崎曲輪への石段'},
  {id:'yama2',x0:-48,x1:-30,z0:-170,z1:-162,a:'x',f:-30,t:-48,h0:21,h1:8,name:'山崎曲輪への石段'},
  {id:'kuro1',x0:30,x1:58,z0:-110,z1:-102,a:'x',f:30,t:58,h0:34,h1:18,name:'黒門への石段'},
  {id:'kuro2',x0:58,x1:66,z0:-94,z1:-66,a:'z',f:-94,t:-66,h0:18,h1:0,name:'黒門への石段'},
  {id:'yamagate',x0:-70,x1:-62,z0:-230,z1:-214,a:'z',f:-214,t:-230,h0:8,h1:0,name:'山崎門の坂'},
  /* 山崎曲輪から出曲輪へ上る石段と、出曲輪から大堀切の底へ下りる石段（出曲輪と大堀切へ歩いて行けるように） */
  {id:'dek1',x0:-86,x1:-80,z0:-168,z1:-146,a:'z',f:-168,t:-146,h0:8,h1:28,name:'出曲輪への石段'},
  {id:'dek2',x0:-78,x1:-64,z0:-120,z1:-114,a:'x',f:-64,t:-78,h0:24,h1:28,name:'大堀切への石段'}];
function rampH(r,x,z){ const c=r.a==='x'?x:z,u=Math.max(0,Math.min(1,(c-r.f)/(r.t-r.f))); return r.h0+(r.h1-r.h0)*u; }
/* 彦根山の自然の斜面（林）: 曲輪から下へ、およそ32°で下る */
function hillRaw(x,z){ let h=0; for(const p of PLAT){ const top=p.H-p.wall-.62*rDist(p,x,z); if(top>h) h=top; } return h; }
function hillH(x,z){ if(!inR(INR,x,z,0)) return 0; let h=hillRaw(x,z); if(h<=0) return 0; const e=Math.min(x-INR.x0,INR.x1-x,z-INR.z0,INR.z1-z); h*=sstep(e/14); if(h>.4) h+=(fbm(x*.05,z*.05,3)-.5)*Math.min(2.4,h*.4); return Math.max(0,h); }
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
/* 橋（廊下橋は堀切の上をまたぐので、下を通ることもできる） */
const BRIDGES=[
  {id:'roka',x0:-3.5,x1:3.5,z0:57,z1:81,h:()=>33,mode:'both',name:'廊下橋'},
  {id:'omotebashi',x0:123,x1:147,z0:66,z1:74,h:()=>.35,mode:'both',name:'表門橋'},
  {id:'otebashi',x0:-64,x1:-56,z0:183,z1:207,h:()=>.35,mode:'both',name:'大手門橋'},
  {id:'kurobashi',x0:123,x1:147,z0:-64,z1:-56,h:()=>.35,mode:'both',name:'黒門橋'},
  {id:'yamabashi',x0:-70,x1:-62,z0:-259,z1:-235,h:()=>.35,mode:'edo',name:'山崎口の橋'},
  {id:'kyobashi',x0:-17,x1:-7,z0:329,z1:355,h:(x,z)=>.35+.9*Math.sin(Math.PI*Math.min(1,Math.max(0,(z-330)/24))),mode:'both',name:'京橋'},
  {id:'sawa',x0:329,x1:355,z0:124,z1:136,h:()=>0,mode:'both',name:'佐和口の土橋',dobashi:true},
  {id:'nagahashi',x0:40,x1:52,z0:-397,z1:-371,h:()=>.35,mode:'both',name:'長橋口'},
  {id:'funamachi',x0:-275,x1:-249,z0:60,z1:70,h:()=>.35,mode:'both',name:'船町口'},
  {id:'sotobashi',x0:-17,x1:-7,z0:637,z1:665,h:(x,z)=>.35+.8*Math.sin(Math.PI*Math.min(1,Math.max(0,(z-638)/26))),mode:'edo',name:'外堀の橋'},
  {id:'gen1',x0:226,x1:230,z0:-300,z1:-270,h:(x,z)=>.3+.9*Math.sin(Math.PI*Math.min(1,Math.max(0,(z+300)/30))),mode:'both',name:'玄宮園の橋'},
  {id:'gen2',x0:248,x1:278,z0:-282,z1:-278,h:(x)=>.3+.6*Math.sin(Math.PI*Math.min(1,Math.max(0,(x-248)/30))),mode:'both',name:'玄宮園の橋'}];
const SAWA={x:1250,z:-60,R:330,H:120}; /* 佐和山 */
let BOUNDS={x0:-296,x1:640,z0:-430,z1:700}; let SCEN=null; const FILL={};
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||b.mode===MODE);
/* 玄宮園の池（中島つき） */
const POND={x0:180,x1:296,z0:-344,z1:-250}, ISLES=[{x0:206,x1:250,z0:-300,z1:-282},{x0:262,x1:282,z0:-326,z1:-308}];
function pondAt(x,z,m){ if(!inR(POND,x,z,m)) return false; for(const q of ISLES) if(inR(q,x,z,-m)) return false; /* 角を丸く */ const cx=(POND.x0+POND.x1)/2,cz=(POND.z0+POND.z1)/2,ex=(x-cx)/((POND.x1-POND.x0)/2),ez=(z-cz)/((POND.z1-POND.z0)/2); return ex*ex+ez*ez<1.05+.12*Math.sin(Math.atan2(ez,ex)*5); }
function waterAt(x,z,m){ m=m||0;
  if(x<LAKE_X+m) return true;
  if(MODE==='edo'&&z<NAIKO_Z+m) return true;
  if(MODE==='edo'&&(inR(SOTO.S,x,z,m)||inR(SOTO.E,x,z,m))) return true;
  if(inR(IOUT,x,z,m)&&!inR(INR,x,z,-m)) return true;
  if(inR(NOUT,x,z,m)&&!inR(NIN,x,z,-m)) return true;
  if(pondAt(x,z,m)) return true;
  return false; }
/* 道（木を植えない場所） */
module.exports={baseH,waterAt,actB,inR,PLAT,RAMPS,BRIDGES};
