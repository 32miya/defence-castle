/* 江戸城さんぽ index.html から取り出した地形と堀（node 用・自動で作った写し） */
let MODE='edo';
function hash(x,y){ const h=Math.sin(x*127.1+y*311.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,y){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbm(x,y,o){ let s=0,a=.5,f=1; for(let i=0;i<(o||5);i++){ s+=a*vnoise(x*f,y*f); f*=2.03; a*=.5; } return s; }
let LATE=false; const TK=()=>MODE==='edo'&&LATE?'modern':MODE; const subOK=s=>!s||(s==='early'?!LATE:s==='late'?LATE:true); const modeOK=m=>!m||m===MODE||(m==='ml'&&(MODE==='modern'||(MODE==='edo'&&LATE)))||(MODE==='edo'&&(m==='early'?!LATE:m==='late'?LATE:false));
const WATER_Y=-1.8, DRY_Y=-1, MOAT_BOT=-3.2;
const inR=(r,x,z,m)=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;
const sstep=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
function segD(px,pz,a,b){ const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz))); return Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t); }
const rDist=(r,x,z)=>Math.hypot(Math.max(r.x0-x,0,x-r.x1),Math.max(r.z0-z,0,z-r.z1));
/* 城域（このアプリでは地形の段差はすべて石垣。自然の斜面は使わない） */
const INR={x0:-336,x1:336,z0:-330,z1:170};
/* 内堀 */
const WATERS=[
  {id:'inui',x0:-124,x1:-80,z0:-240,z1:168,name:'乾濠・蓮池濠'},
  {id:'hira',x0:-124,x1:332,z0:-240,z1:-212,name:'平川濠'},
  {id:'hasu',x0:-124,x1:60,z0:110,z1:168,name:'蓮池濠'},
  {id:'kikyo',x0:60,x1:332,z0:150,z1:168,name:'桔梗濠'},
  {id:'ote',x0:305,x1:332,z0:-240,z1:168,name:'大手濠'},
  {id:'hakucho',x0:60,x1:68,z0:-56,z1:40,name:'白鳥濠'},
  {id:'niju',x0:-336,x1:-124,z0:168,z1:196,name:'二重橋濠'},
  {id:'nihonbashi',x0:332,x1:641,z0:-150,z1:-136,name:'日本橋川'},
  /* 隅田川と神田川（江戸後期の浅草・両国へ） */ {id:'sumida',x0:640,x1:704,z0:-900,z1:260,name:'隅田川'},{id:'kanda',x0:470,x1:641,z0:-302,z1:-292,name:'神田川'}];
const MOAT=WATERS[2], RIV_E=WATERS[4], BIZEN=WATERS[5];
const TOWN={x0:336,x1:560,z0:-326,z1:326};
/* 曲輪（平らな段）。wall: 石垣の高さ。mode を付けた段はその時代だけ */
const PLAT=[
  {id:'tenshudai',mode:'ml',x0:-62,x1:-38,z0:-198,z1:-171,H:26,wall:0,name:'天守台の上'},
  {id:'chujaku',x0:60,x1:72,z0:40,z1:64,H:16,wall:16,name:'中雀門'},
  {id:'honmaru',x0:-80,x1:60,z0:-212,z1:110,H:16,wall:16,name:'本丸'},
  {id:'nino',x0:60,x1:200,z0:-212,z1:-56,H:6,wall:6,name:'二の丸'},
  {id:'nino2',x0:68,x1:200,z0:-56,z1:70,H:6,wall:6,name:'二の丸'},
  {id:'shimo',x0:60,x1:200,z0:70,z1:150,H:4,wall:4,name:'中之門・百人番所'},
  {id:'sanno',x0:200,x1:305,z0:-212,z1:150,H:1.5,wall:1.5,name:'三の丸'},
  {id:'nishi',x0:-336,x1:-124,z0:-40,z1:168,H:10,wall:10,name:'西の丸'},
  {id:'fukiage',x0:-336,x1:-124,z0:-330,z1:-40,H:10,wall:10,name:'吹上'},
  {id:'kita',x0:-124,x1:150,z0:-330,z1:-240,H:14,wall:14,name:'北の丸'}];
const MOUNDS=[];
function moundH(x,z){ return 0; }
const PL={}; PLAT.forEach(p=>PL[p.id]=p);
const actP=p=>modeOK(p.mode);
/* 石段・坂。a: 'x' か 'z' の向き、f→t でその座標、h0→h1 で高さ */
const RAMPS=[
  {id:'tenshuR',mode:'ml',x0:-55,x1:-45,z0:-171,z1:-146,a:'z',f:-146,t:-171,h0:16,h1:26,name:'天守台への坂'},
  {id:'shiomi',x0:60,x1:84,z0:-102,z1:-92,a:'x',f:84,t:60,h0:6,h1:16,name:'汐見坂'},
  {id:'bairin',x0:60,x1:86,z0:-190,z1:-180,a:'x',f:86,t:60,h0:6,h1:16,name:'梅林坂'},
  {id:'chujakuR',x0:60,x1:72,z0:64,z1:96,a:'z',f:96,t:64,h0:4,h1:16,name:'中雀門への坂'},
  {id:'sannomon',x0:200,x1:216,z0:94,z1:106,a:'x',f:216,t:200,h0:1.5,h1:4,name:'大手三之門'},
  {id:'ninoShimo',x0:150,x1:158,z0:70,z1:80,a:'z',f:80,t:70,h0:4,h1:6,name:'二の丸への石段'},
  {id:'sanNino',x0:200,x1:222,z0:-62,z1:-52,a:'x',f:222,t:200,h0:1.5,h1:6,name:'二の丸への坂（三の丸から）'},
  {id:'kitaR',x0:150,x1:182,z0:-302,z1:-292,a:'x',f:182,t:150,h0:0,h1:14,name:'北の丸への坂'}];
const HS=1;
const ENTR=[];
function rampH(r,x,z){ const c=r.a==='x'?x:z,u=Math.max(0,Math.min(1,(c-r.f)/(r.t-r.f))); return r.h0+(r.h1-r.h0)*u; }
function hillRaw(x,z){ return 0; }
function hillH(x,z){ return 0; }
function platAt(x,z){ for(const p of PLAT){ if(!modeOK(p.mode)) continue; if(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1) return p; } return null; }
function platAtMesh(x,z){ return platAt(x,z); }
function rampAt(x,z){ for(const r of RAMPS){ if(!modeOK(r.mode)) continue; if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1) return r; } return null; }
function waterAt(x,z,m){ m=m||0; for(const w of WATERS) if(inR(w,x,z,m)) return true; return false; }
function waterName(x,z,m){ for(const w of WATERS) if(inR(w,x,z,m)) return w.id==='inui'?(z<-40?'乾濠':'蓮池濠'):w.name; return null; }
function baseH(x,z){ if(waterAt(x,z,0)) return MOAT_BOT; const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAt(x,z); if(p) return p.H; return 0; }
function meshH(x,z){ return baseH(x,z); }
/* 石垣のある辺（となりが低い所だけ） */
function calcWalls(){ for(const p of PLAT){ if(!p.wall) continue; const E=[[p.x0,p.z0,p.x1,p.z0,0,-1],[p.x1,p.z0,p.x1,p.z1,1,0],[p.x0,p.z1,p.x1,p.z1,0,1],[p.x0,p.z0,p.x0,p.z1,-1,0]];
  const om=MODE; MODE=p.mode==='ml'?'modern':(p.mode==='early'||p.mode==='late')?'edo':(p.mode||'edo'); p.walls=E.map(([ax,az,bx,bz,nx,nz])=>{ const L=Math.hypot(bx-ax,bz-az),n=Math.max(3,Math.ceil(L/2.5)); let lo=1e9; for(let i=0;i<=n;i++){ const t=i/n; lo=Math.min(lo,baseH(ax+(bx-ax)*t+nx*1.8,az+(bz-az)*t+nz*1.8)); } return lo<p.H-.6; }); MODE=om; } }
/* 橋 */
const lin=(a,b,c0,c1,c)=>a+(b-a)*Math.max(0,Math.min(1,(c-c0)/(c1-c0)));
const WALK_A={x0:0,x1:0,z0:0,z1:0};
const BRIDGES=[
  {id:'kitahane',x0:-11,x1:-1,z0:-240.6,z1:-211.4,h:(x,z)=>lin(16,14,-212,-240,z),mode:'both',name:'北桔橋門の橋'},
  {id:'hirakawa',x0:234,x1:246,z0:-240.6,z1:-211.4,h:(x,z)=>lin(1.5,.3,-212,-240,z),mode:'both',name:'平川橋'},
  {id:'otebashi',x0:304.4,x1:332.6,z0:94,z1:106,h:(x,z)=>lin(1.5,.3,305,332,x),mode:'both',name:'大手橋'},
  {id:'kikyobashi',x0:148,x1:160,z0:149.4,z1:168.6,h:(x,z)=>lin(4,.3,150,168,z),mode:'both',name:'桔梗門の橋'},
  {id:'nijubashi',x0:-232,x1:-222,z0:167.4,z1:196.6,h:(x,z)=>lin(10,.3,168,196,z),mode:'edo',name:'西の丸大手橋'},
  {id:'nihonbashi',x0:474,x1:486,z0:-150.6,z1:-135.4,h:(x,z)=>.4+1.2*Math.sin(Math.PI*Math.min(1,Math.max(0,(z+150.6)/15.2))),mode:'both',name:'日本橋'},
  {id:'ryogokubashi',x0:639.4,x1:704.6,z0:-262,z1:-254,h:(x,z)=>.6+2.6*Math.sin(Math.PI*Math.min(1,Math.max(0,(x-639.4)/65.2))),mode:'late',name:'両国橋'},
  {id:'asakusabashi',x0:596,x1:606,z0:-302.6,z1:-291.4,h:(x,z)=>.4+.9*Math.sin(Math.PI*Math.min(1,Math.max(0,(z+302.6)/11.2))),mode:'both',name:'浅草橋'},
  {id:'yanagibashi',x0:627,x1:633,z0:-302.6,z1:-291.4,h:(x,z)=>.4+.9*Math.sin(Math.PI*Math.min(1,Math.max(0,(z+302.6)/11.2))),mode:'late',name:'柳橋'}];
let BOUNDS={x0:-334,x1:716,z0:-846,z1:326}; let SCEN=null; const FILL={};
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||modeOK(b.mode));
module.exports={baseH,waterAt,actB,inR,BRIDGES};
