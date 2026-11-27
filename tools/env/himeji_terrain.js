/* 姫路城さんぽ index.html から取り出した地形と堀（node 用・自動で作った写し） */
let MODE='edo';
function hash(x,y){ const h=Math.sin(x*127.1+y*311.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,y){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbm(x,y,o){ let s=0,a=.5,f=1; for(let i=0;i<(o||5);i++){ s+=a*vnoise(x*f,y*f); f*=2.03; a*=.5; } return s; }
const sstep=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
const inR=(r,x,z,m)=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;
const WATER_Y=-3.2, MOAT_D=WATER_Y-2.8;
const RINGS={ uchi:{o:{x0:-266,x1:226,z0:-282,z1:196},w:24,name:'内堀'}, naka:{o:{x0:-372,x1:332,z0:-372,z1:346},w:20,name:'中堀'}, soto:{o:{x0:-470,x1:432,z0:-472,z1:722},w:24,name:'外堀'} };
for(const k in RINGS){ const R=RINGS[k],o=R.o,w=R.w; R.i={x0:o.x0+w,x1:o.x1-w,z0:o.z0+w,z1:o.z1-w}; }
const SENBA={x0:-540,x1:-516,z0:-700,z1:1000};   /* 船場川（城の西を流れる川） */
const ERA_RINGS={modern:['uchi','naka'],edo:['uchi','naka','soto']};
/* 現代は中堀の南側（大手前通りのあたり）が埋め立てられている */
const FILLED={modern:{naka:['s']},edo:{}};
function ringSegs(k){ const R=RINGS[k],o=R.o,i=R.i; return {n:{x0:o.x0,x1:o.x1,z0:o.z0,z1:i.z0},s:{x0:o.x0,x1:o.x1,z0:i.z1,z1:o.z1},w:{x0:o.x0,x1:i.x0,z0:i.z0,z1:i.z1},e:{x0:i.x1,x1:o.x1,z0:i.z0,z1:i.z1}}; }
/* 橋（mode: both / modern / edo） */
const BRIDGES=[
  {id:'sakuramon',x0:3,x1:17,z0:RINGS.uchi.i.z1-.5,z1:RINGS.uchi.o.z1+.5,mode:'both',arch:.9,axis:'z'},
  {id:'uchiW',x0:RINGS.uchi.o.x0-.5,x1:RINGS.uchi.i.x0+.5,z0:98,z1:108,mode:'both',arch:.5,axis:'x'},
  {id:'uchiE',x0:RINGS.uchi.i.x1-.5,x1:RINGS.uchi.o.x1+.5,z0:98,z1:108,mode:'both',arch:.5,axis:'x'},
  {id:'nakaS',x0:3,x1:17,z0:RINGS.naka.i.z1-.5,z1:RINGS.naka.o.z1+.5,mode:'edo',arch:.7,axis:'z'},
  {id:'nakaW',x0:RINGS.naka.o.x0-.5,x1:RINGS.naka.i.x0+.5,z0:0,z1:12,mode:'both',arch:.4,axis:'x'},
  {id:'nakaE',x0:RINGS.naka.i.x1-.5,x1:RINGS.naka.o.x1+.5,z0:0,z1:12,mode:'both',arch:.4,axis:'x'},
  {id:'nakaN',x0:-10,x1:2,z0:RINGS.naka.o.z0-.5,z1:RINGS.naka.i.z0+.5,mode:'both',arch:.4,axis:'z'},
  {id:'sotoS',x0:3,x1:17,z0:RINGS.soto.i.z1-.5,z1:RINGS.soto.o.z1+.5,mode:'edo',arch:.7,axis:'z'},
  {id:'sotoW',x0:RINGS.soto.o.x0-.5,x1:RINGS.soto.i.x0+.5,z0:380,z1:392,mode:'edo',arch:.5,axis:'x'},
  {id:'senba',x0:SENBA.x0-.5,x1:SENBA.x1+.5,z0:380,z1:392,mode:'both',arch:1.2,axis:'x'},
  {id:'senba2',x0:SENBA.x0-.5,x1:SENBA.x1+.5,z0:0,z1:12,mode:'both',arch:1.2,axis:'x'}];
for(const b of BRIDGES){ const L=b.axis==='z'?b.z1-b.z0:b.x1-b.x0; b.h=(x,z)=>.3+b.arch*Math.sin(Math.PI*Math.min(1,Math.max(0,((b.axis==='z'?z-b.z0:x-b.x0))/L))); }
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||b.mode===MODE);
function isFilled(k,side,m){ const f=FILLED[m||MODE][k]; return !!(f&&f.includes(side)); }
function waterAt(x,z,m){ m=m||0; if(inR(SENBA,x,z,m)) return true;
  for(const k of ERA_RINGS[MODE]){ const R=RINGS[k]; if(!inR(R.o,x,z,m)||inR(R.i,x,z,-m)) continue; const S=ringSegs(k); for(const sd in S) if(inR(S[sd],x,z,m)&&!isFilled(k,sd)) return true; }
  if(inR(SANGOKU.water,x,z,m)) return true; return false; }

/* ---------- 姫山（天守の丘）と鷺山（西の丸の丘）の自然の地形 ---------- */
function hnat(x,z){ const d1=Math.hypot((x-4)/142,(z+146)/124); let h=34*(1-sstep((d1-.27)/.73));
  const d2=Math.hypot((x+178)/80,(z+140)/150); h=Math.max(h,22*(1-sstep((d2-.42)/.58)));
  if(h>.3) h+=(fbm(x*.035+3,z*.035,3)-.5)*3.2*Math.min(1,h/6); return Math.max(0,h); }

/* ---------- 曲輪（平らに造成した段）: h=高さ。周りは石垣、上は土塀 ---------- */
const PLATS=[
  {id:'tenA',name:'天守曲輪',x0:-32,x1:-2,z0:-212,z1:-153,h:43,stone:'stoneK'},
  {id:'tenB',name:'天守曲輪',x0:-2,x1:28,z0:-212,z1:-158,h:43,stone:'stoneK'},
  {id:'bizen',name:'備前丸',x0:-40,x1:40,z0:-152,z1:-113,h:33,stone:'stoneK'},
  {id:'kita',name:'北腰曲輪',x0:-54,x1:30,z0:-238,z1:-213,h:31},
  {id:'kami',name:'上山里',x0:-45,x1:12,z0:-108,z1:-74,h:25},
  {id:'obi',name:'帯郭',x0:18,x1:62,z0:-108,z1:-64,h:15},
  {id:'nishi',name:'西の丸',x0:-215,x1:-142,z0:-238,z1:-46,h:21},
  {id:'nino',name:'二の丸（三国堀のあたり）',x0:-118,x1:-28,z0:-92,z1:-38,h:3}];
const PLAT=Object.fromEntries(PLATS.map(p=>[p.id,p]));
const SANGOKU={water:{x0:-70,x1:-38,z0:-84,z1:-60},y:1.1};  /* 三国堀（二の丸のため池） */

/* ---------- 登城道（坂と石段）: [x,z,高さ]の折れ線と幅 ---------- */
const PATHS=[
  {id:'hishi',w:8,pts:[[-80,-10,0],[-80,-26,1.4],[-80,-41,3]],name:'菱の門'},
  {id:'iro',w:5,pts:[[-92,-80,3],[-92,-93,4.6],[-88,-106,8.5],[-72,-117,12.6],[-56,-126,17]],name:'いの門〜はの門'},
  {id:'hani',w:4.6,pts:[[-56,-126,17],[-52,-134,19],[-52,-162,25.5],[-51,-196,30],[-47,-216,31]],name:'はの門〜ほの門'},
  {id:'mizu',w:3.8,pts:[[-38,-222,31],[-38,-212,32],[-38,-190,36.2],[-38,-168,41],[-38,-157,43],[-30,-156,43]],name:'水の門の道'},
  {id:'bizenmon',w:4,pts:[[-26,-155,43],[-26,-150,42.4],[-26,-127,33]],name:'備前門の石段',raised:true},
  {id:'nunomon',w:4,pts:[[-14,-117,33],[-14,-112,32.4],[-14,-98,25]],name:'ぬの門の石段',raised:true},
  {id:'kamiW',w:4,pts:[[-43,-90,25],[-54,-104,20.6],[-62,-121,15.2]],name:'上山里への坂'},
  {id:'rinomon',w:4,pts:[[8,-92,25],[18,-92,21.5],[28,-92,15]],name:'りの門の石段'},
  {id:'obiS',w:5,pts:[[44,-66,15],[48,-54,9.6],[55,-40,3.6],[60,-28,0]],name:'帯郭からの坂'},
  {id:'nishiS',w:5,pts:[[-112,-48,3],[-120,-48,3.6],[-138,-50,16.4],[-148,-50,21]],name:'西の丸への石段'},
  {id:'nishiN',w:3.6,pts:[[-89,-102.75,7.5],[-104,-101,11],[-128,-97,17.8],[-146,-96,21]],name:'西の丸北の坂'}];
for(const P of PATHS){ P.seg=[]; for(let i=0;i<P.pts.length-1;i++){ const a=P.pts[i],b=P.pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz); P.seg.push({a,b,dx,dz,L});
    const m=P.w/2+.6; P.bb=P.bb||{x0:1e9,x1:-1e9,z0:1e9,z1:-1e9}; for(const p of [a,b]){ P.bb.x0=Math.min(P.bb.x0,p[0]-m); P.bb.x1=Math.max(P.bb.x1,p[0]+m); P.bb.z0=Math.min(P.bb.z0,p[1]-m); P.bb.z1=Math.max(P.bb.z1,p[1]+m); } } }
/* 折れ線までの距離と、その位置の高さ */
function pathQ(P,x,z){ let best=null; for(const s of P.seg){ const t=Math.max(0,Math.min(1,((x-s.a[0])*s.dx+(z-s.a[1])*s.dz)/(s.L*s.L))),px=s.a[0]+s.dx*t,pz=s.a[1]+s.dz*t,d=Math.hypot(x-px,z-pz);
    if(!best||d<best.d) best={d,y:s.a[2]+(s.b[2]-s.a[2])*t,t,s}; } return best; }
function pathAt(x,z,m){ m=m||0; let best=null; for(const P of PATHS){ if(!inR(P.bb,x,z,m)) continue; const q=pathQ(P,x,z); if(q.d<=P.w/2+m&&(!best||q.d<best.d)){ best=q; best.P=P; } } return best; }
function platAt(x,z,m){ let best=null; for(const p of PLATS) if(inR(p,x,z,m||0)&&(!best||p.h>best.h)) best=p; return best; }
/* 歩ける高さ: 橋 → 登城道 → 曲輪 → 平地（丘の斜面は歩けない） */
function groundH(x,z){ for(const b of actB()) if(inR(b,x,z,.4)) return b.h(x,z);
  const q=pathAt(x,z); if(q) return q.y; const p=platAt(x,z); if(p) return p.h; const l=liftH(x,z); if(l!==null) return l;
  return Math.max(0,hnat(x,z)); }
let liftH=()=>null;
module.exports={baseH:(x,z)=>{ const q=pathAt(x,z); if(q) return q.y; const p=platAt(x,z); if(p) return p.h; const l=liftH(x,z); if(l!==null) return l; return Math.max(0,hnat(x,z)); },waterAt,actB,inR,BRIDGES,groundH};
