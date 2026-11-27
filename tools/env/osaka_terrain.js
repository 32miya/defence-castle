/* 大阪城さんぽ index.html から取り出した地形と堀（node 用・自動で作った写し） */
let MODE='toyo';
function hash(x,y){ const h=Math.sin(x*127.1+y*311.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,y){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbm(x,y,o){ let s=0,a=.5,f=1; for(let i=0;i<(o||5);i++){ s+=a*vnoise(x*f,y*f); f*=2.03; a*=.5; } return s; }
const WATER_Y=-14, DRY_Y=-9;
const MOAT={x0:-105,x1:105,z0:-130,z1:115};      // 内堀（外周）
const ISLAND={x0:-75,x1:75,z0:-100,z1:85};       // 本丸
const DRY={x0:-105,x1:105,z0:85,z1:115};         // 南の空堀
const SOTO_O={x0:-265,x1:235,z0:-255,z1:245};    // 外堀（外周）
const SOTO_I={x0:-232,x1:202,z0:-222,z1:212};    // 二の丸
const RIVER={x0:-1300,x1:1300,z0:-345,z1:-315};  // 大川
const TSUME={x0:-45,x1:62,z0:-72,z1:-14}, RAMP={x0:-4,x1:6,z0:-14.6,z1:5}, TS_H=9, MIDB={x0:-54,x1:70,z0:-81,z1:-14}, MID_H=4.5, MSTW={x0:-52,x1:-47,z0:-14,z1:-4}, MSTE={x0:64,x1:69,z0:-14,z1:-4}; // 豊臣期の詰ノ丸（一段高い）
const BRIDGES=[
  {id:'sakura',x0:-7,x1:7,z0:84,z1:116,h:()=>0,mode:'both'},
  {id:'gokuraku',x0:-28,x1:-20,z0:-131,z1:-99,h:(x,z)=>MODE==='modern'?.3+1.1*Math.sin(Math.PI*Math.min(1,Math.max(0,(z+130)/30))):.45,mode:'both'},
  {id:'ote',x0:-266,x1:-231,z0:102,z1:112,h:()=>0,mode:'both'},
  {id:'aoya',x0:-60,x1:-50,z0:-256,z1:-221,h:()=>.35,mode:'both'},
  {id:'kyobashi',x0:-206,x1:-196,z0:-256,z1:-221,h:()=>0,mode:'both'},
  {id:'tama',x0:150,x1:160,z0:211,z1:246,h:()=>0,mode:'both'},
  {id:'sogamae',x0:-63,x1:-57,z0:844,z1:876,h:()=>.35,mode:'toyo'},
  {id:'koraibashi',x0:-622,x1:-594,z0:466.5,z1:473.5,h:(x)=>.35+1.1*Math.sin(Math.PI*Math.min(1,Math.max(0,(x+622)/28))),mode:'toyo'},
  {id:'nekoma',x0:554,x1:578,z0:506.5,z1:513.5,h:()=>.35,mode:'toyo'},{id:'nekoma2',x0:554,x1:578,z0:2,z1:8,h:()=>.35,mode:'toyo'},{id:'yokobori2',x0:-622,x1:-594,z0:0,z1:7,h:()=>.35,mode:'toyo'},
  {id:'m3a',x0:-63,x1:-57,z0:428,z1:460,h:()=>.35,mode:'toyo'},{id:'m3b',x0:297,x1:303,z0:428,z1:460,h:()=>.35,mode:'toyo'},{id:'m3c',x0:-363,x1:-357,z0:428,z1:460,h:()=>.35,mode:'toyo'}];
let BOUNDS={x0:-616,x1:572,z0:-312,z1:900}; let SCEN=null,FILLED=false; const FILL={soto:false,m3:false,sg:false};
/* ---------- 城の外の地形（太閤の時代）: 上町台地・東西の低地・旧大和川・茶臼山・岡山・四天王寺 ----------
   城と城下は上町台地の北の端にのる。西は船場の低地、東は猫間川・平野川・旧大和川の低地。台地は南へ細くなり、
   南端近くに四天王寺と茶臼山がある。距離は東西を約0.37倍・南北を約0.45倍に縮めている（城下の中はさらに縮めている） */
const HILLS=[{x:-400,z:1760,R:60,r0:16,H:16,name:'茶臼山'},{x:420,z:1380,R:40,r0:10,H:8,name:'岡山'}];
const CORE={x0:-620,x1:580,z1:1220},TLOW=-9,TSLOPE=50;
const YAMATO=[[1150,2150],[980,1300],[880,600],[820,100],[740,-170],[640,-345]],YAMATO_W=46;
const TENNOJI={x:-300,z:1620};
function plateauE(z){ return z<1220?580:z<1450?580-(z-1220)/230*320:Math.max(140,260-(z-1450)/650*120); }
function plateauW(z){ return z<1220?-620:-620+Math.min(1,(z-1220)/800)*70; }
function segD(px,pz,a,b){ const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz))); return Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t); }
function yamatoD(x,z){ if(x<560) return 1e9; let d=1e9; for(let i=0;i<YAMATO.length-1;i++) d=Math.min(d,segD(x,z,YAMATO[i],YAMATO[i+1])); return d; }
const sstep=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
/* 台地からの高さ（城下の内側は0） */
function terrBase(x,z){ const o=Math.max(plateauW(z)-x,x-plateauE(z)); let h=o<=0?0:TLOW*sstep(o/TSLOPE);
  if(z<-250) h*=sstep((z+340)/90);   /* 大川の岸では台地と同じ高さに寄せる */
  for(const q of HILLS){ const r=Math.hypot(x-q.x,z-q.z); if(r<q.R){ const t=Math.min(1,(q.R-r)/(q.R-q.r0)); h+=q.H*t*t*(3-2*t); } }
  const d=yamatoD(x,z),hw=YAMATO_W/2; if(d<hw+14) h=Math.min(h,d<hw?WATER_Y-2:WATER_Y-2+(TLOW-(WATER_Y-2))*sstep((d-hw)/14));
  return h; }
function terrH(x,z){ if(MODE!=='toyo') return 0; if(x>CORE.x0&&x<CORE.x1&&z<CORE.z1) return 0; return terrBase(x,z); }
/* 真田丸（冬の陣）: 惣構の南、谷をへだてた高台の出丸。ほぼ四角い本郭（土塁・二段の塀と武者走り・櫓7・東西の門・三重の柵・空堀と外土手）、
   北の小曲輪、東の副郭（逆三角形）。実際は本郭が約280m四方・空堀幅約43m・深さ約8mとされるが、このアプリでは縮めている */
const SANADA={x:330,z:947,main:{x0:290,x1:370,z0:912,z1:982},moat:14,kogu:{x0:314,x1:346,z0:876,z1:897},fuku:[[392,905],[474,905],[434,978]],gateZ:947,
  prof:[[0,0],[3,6],[5,6],[5.1,4.5],[7.2,4.5],[9,3]],kprof:[[0,0],[2,3.5],[3.5,3.5],[5,1.5]],cprof:[[0,0],[3,3],[6,0]]};
function profH(P,d){ if(d<=P[0][0]) return P[0][1]; for(let i=1;i<P.length;i++) if(d<=P[i][0]){ const a=P[i-1],b=P[i],t=(d-a[0])/Math.max(1e-6,b[0]-a[0]); return a[1]+(b[1]-a[1])*t; } return P[P.length-1][1]; }
const SEIRO=[[316,967],[306,930]];
function sanadaH(x,z){ const S=SANADA,R=S.main; if(Math.abs(x-S.x)>160||Math.abs(z-S.z)>110) return 0;
  for(const [sx,sz] of SEIRO) if(Math.abs(x-sx)<1.6&&Math.abs(z-sz)<1.6) return 7.5;
  if(x>R.x0&&x<R.x1&&z>R.z0&&z<R.z1){ const d=Math.min(x-R.x0,R.x1-x,z-R.z0,R.z1-z); if(Math.abs(z-S.gateZ)<3&&(x-R.x0<9||R.x1-x<9)) return 3*Math.min(1,d/9); return profH(S.prof,d); }
  const K=S.kogu; if(x>K.x0&&x<K.x1&&z>K.z0&&z<K.z1){ const d=Math.min(x-K.x0,K.x1-x,z-K.z0,K.z1-z); if(Math.abs(x-(K.x0+K.x1)/2)<2.5&&z-K.z0<5) return 1.5*Math.min(1,d/5); return profH(S.kprof,d); }
  const dO=Math.max(R.x0-x,x-R.x1,R.z0-z,z-R.z1)-S.moat; if(dO>0&&dO<6&&!(Math.abs(z-S.gateZ)<3)&&!(z<R.z0&&Math.abs(x-330)<20)) return profH(S.cprof,dO);
  return 0; }
function hillH(x,z){ return SCEN==='fuyu'?sanadaH(x,z):0; }
/* 太閤の時代の惣構: 西の東横堀川・東の猫間川・南の空堀と土塁 */
/* 西=東横堀川、東=猫間川、南=空堀と土塁。城と城下の間に三の丸と三の丸の堀 */
const SG={W:{x0:-620,x1:-596,z0:-320,z1:874},E:{x0:556,x1:576,z0:-320,z1:874},S:{x0:-620,x1:576,z0:846,z1:874},DOTE:{x0:-596,x1:556,z0:830,z1:846},GATE:{x0:-64,x1:-56},M3:{x0:-596,x1:556,z0:430,z1:458}};
const TOWN={x0:-596,x1:556,z0:458,z1:830},EW=[470,510,550,590,630,670,710,750,790],NS=[-360,-160,-60,140,300,460];
const inR=(r,x,z,m)=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||b.mode===MODE);
function waterAt(x,z,m){ if(MODE==='toyo'&&yamatoD(x,z)<YAMATO_W/2+(m||0)) return true; if(MODE==='toyo'&&(inR(SG.W,x,z,m)||inR(SG.E,x,z,m))) return true; if(MODE==='toyo'&&((!FILL.sg&&inR(SG.S,x,z,m))||(!FILL.m3&&inR(SG.M3,x,z,m)))) return true; if(inR(MOAT,x,z,m)&&!inR(ISLAND,x,z,-m)) return true; if(!(MODE==='toyo'&&FILL.soto)&&inR(SOTO_O,x,z,m)&&!inR(SOTO_I,x,z,-m)) return true; if(inR(RIVER,x,z,m)) return true; return false; }
const MSTAIR={x0:11,x1:15.6,z0:-48,z1:-25},MLAND={x0:8.6,x1:15.6,z0:-52,z1:-48},MACHI=[];
function liftH(x,z){ if(MODE==='modern'){ if(inR(MLAND,x,z,0)) return 10; if(inR(MSTAIR,x,z,0)) return 10*Math.max(0,Math.min(1,(MSTAIR.z1-z)/(MSTAIR.z1-MSTAIR.z0))); return null; } if(MODE!=='toyo') return null; { const hh=hillH(x,z); if(hh>0) return hh; } if(inR(TSUME,x,z,0)) return TS_H; if(inR(MIDB,x,z,0)) return MID_H; if(inR(RAMP,x,z,0)) return TS_H*Math.max(0,Math.min(1,(RAMP.z1-z)/(RAMP.z1-RAMP.z0))); for(const R of [MSTW,MSTE]) if(inR(R,x,z,0)) return MID_H*Math.max(0,Math.min(1,(R.z1-z)/(R.z1-R.z0))); { const th=terrH(x,z); if(th!==0) return th; } return null; }
module.exports={baseH:(x,z)=>{ const v=liftH(x,z); return v===null?0:v; },waterAt,actB,inR,BRIDGES};
