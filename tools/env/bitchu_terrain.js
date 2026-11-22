/* 備中松山城さんぽ index.html から取り出した地形と川（node 用・自動で作った写し） */
let MODE='sengoku';
function hash(x,y){ const h=Math.sin(x*127.1+y*311.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,y){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbm(x,y,o){ let s=0,a=.5,f=1; for(let i=0;i<(o||5);i++){ s+=a*vnoise(x*f,y*f); f*=2.03; a*=.5; } return s; }
const WATER_Y=-1.8, DRY_Y=-1;
const inR=(r,x,z,m)=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;
const sstep=t=>{ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
function segD(px,pz,a,b){ const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz))); return Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t); }
const rDist=(r,x,z)=>Math.hypot(Math.max(r.x0-x,0,x-r.x1),Math.max(r.z0-z,0,z-r.z1));
/* 臥牛山（高さのある地形メッシュの範囲）・高梁川・紺屋川・城下町 */
const INR={x0:-210,x1:230,z0:-480,z1:236};
const RIVER_X=-300, RIVER_W=74;                  /* 高梁川: x が RIVER_X-RIVER_W 〜 RIVER_X */
const KONYA={x0:RIVER_X,x1:200,z0:334,z1:340};  /* 紺屋川（城下を東西に流れる小川） */
const TOWN={x0:RIVER_X,x1:320,z0:236,z1:540};
/* 曲輪（平らな段）。wall: 石垣の高さ（下の斜面との差）。0 は石垣なしで斜面へつながる */
const PLAT=[
  {id:'honmaru',x0:-20,x1:20,z0:-100,z1:-62,H:70,wall:7,name:'本丸'},
  {id:'ushiro',x0:-18,x1:12,z0:-124,z1:-100,H:71.2,wall:5,name:'後曲輪'},
  {id:'ninomaru',x0:-24,x1:22,z0:-54,z1:-24,H:64,wall:6,name:'二の丸'},
  {id:'umaya',x0:-18,x1:18,z0:-16,z1:6,H:60,wall:5,name:'厩曲輪'},
  {id:'sannomaru',x0:-22,x1:24,z0:14,z1:40,H:56,wall:6,name:'三の丸'},
  {id:'ote',x0:-18,x1:14,z0:48,z1:66,H:53,wall:6,name:'大手門の内'},
  {id:'nakataiko',x0:-14,x1:16,z0:96,z1:116,H:40,wall:4,name:'中太鼓の丸'},
  {id:'fuigo',x0:44,x1:84,z0:96,z1:134,H:33,wall:0,name:'ふいご峠'},
  {id:'dojo2',x0:-2,x1:12,z0:140,z1:156,H:25,wall:0,name:'下太鼓の丸'},
  {id:'dojo1',x0:-46,x1:-30,z0:146,z1:156,H:14,wall:0,name:'登城道'},
  {id:'onegoya',x0:-64,x1:4,z0:182,z1:226,H:3,wall:3,name:'御根小屋'},
  /* 北の尾根の中世の城（石垣のない土の曲輪） */
  {id:'dobashi',x0:-6,x1:0,z0:-162,z1:-150,H:66,wall:0,name:'土橋',north:true},
  {id:'aihata',x0:-20,x1:10,z0:-214,z1:-180,H:73,wall:0,name:'相畑の曲輪',north:true},
  {id:'tenjin',x0:-16,x1:12,z0:-262,z1:-232,H:80,wall:0,name:'天神の丸',north:true},
  {id:'horikiri',x0:-4,x1:2,z0:-276,z1:-270,H:73.5,wall:0,name:'堀切',north:true},
  {id:'ooike',x0:-24,x1:14,z0:-330,z1:-290,H:74,wall:0,name:'大池',north:true},
  {id:'omatsu',x0:-18,x1:14,z0:-384,z1:-350,H:78,wall:0,name:'大松山城 本丸',north:true},
  {id:'omatsu2',x0:-60,x1:-26,z0:-376,z1:-356,H:75,wall:0,name:'大松山城 二の丸',north:true},
  {id:'omatsu3',x0:-104,x1:-74,z0:-378,z1:-358,H:72,wall:0,name:'大松山城 三の丸',north:true},
  {id:'bansho',x0:0,x1:22,z0:-436,z1:-416,H:70,wall:0,name:'切通及び番所跡',north:true}];
/* 曲輪の外の山の高まり（天神の丸・大松山）: 歩けない林の尾根 */
const MASS=[{x:-4,z:-250,H:72,k:.42},{x:-8,z:-360,H:70,k:.42},{x:-84,z:-368,H:62,k:.45},{x:-4,z:-196,H:64,k:.45},{x:60,z:-150,H:58,k:.55},{x:-80,z:-120,H:52,k:.6},{x:60,z:-330,H:56,k:.5},
  /* 切通: 尾根を切り通した道の両側の崖 */ {x:1.5,z:-400,H:84,k:.9},{x:16.5,z:-400,H:84,k:.9}];
const MOUNDS=[];
function moundH(x,z){ return 0; }
const PL={}; PLAT.forEach(p=>PL[p.id]=p);
/* 大池: 大松山と天神の丸の間の貯水池（石で囲む） */
const POND={x0:-16,x1:6,z0:-322,z1:-300,H:74};
/* 石段・坂道。a: 'x' か 'z' の向き、f→t でその座標、h0→h1 で高さ */
const RAMPS=[
  {id:'honmon',x0:-4,x1:4,z0:-62,z1:-54,a:'z',f:-54,t:-62,h0:64,h1:70,name:'本丸南御門の石段'},
  {id:'ninoramp',x0:-14,x1:-7,z0:-24,z1:-16,a:'z',f:-16,t:-24,h0:60,h1:64,name:'二の丸への石段'},
  {id:'sanramp',x0:8,x1:15,z0:6,z1:14,a:'z',f:14,t:6,h0:56,h1:60,name:'厩曲輪への石段'},
  {id:'kuromon',x0:-14,x1:-7,z0:40,z1:48,a:'z',f:48,t:40,h0:53,h1:56,name:'黒門の石段'},
  {id:'otezaka',x0:-4,x1:4,z0:70,z1:96,a:'z',f:96,t:70,h0:40,h1:49,name:'大手門への石段'},
  {id:'otekado',x0:-2.5,x1:2.5,z0:62,z1:70,a:'z',f:70,t:62,h0:49,h1:53,name:'大手門跡の石段'},
  {id:'fuigoramp',x0:16,x1:44,z0:102,z1:110,a:'x',f:16,t:44,h0:40,h1:33,name:'ふいご峠からの登城道',road:true},
  {id:'kuruma',x0:72,x1:80,z0:134,z1:236,a:'z',f:134,t:236,h0:33,h1:0,name:'ふいご峠への道',road:true},
  {id:'tojo3',x0:2,x1:8,z0:116,z1:140,a:'z',f:140,t:116,h0:25,h1:40,name:'中太鼓の丸への石段'},
  {id:'tojo2',x0:-30,x1:-2,z0:148,z1:154,a:'x',f:-30,t:-2,h0:14,h1:25,name:'登城道'},
  {id:'tojo1',x0:-40,x1:-34,z0:156,z1:182,a:'z',f:182,t:156,h0:3,h1:14,name:'登城道'},
  {id:'onemon',x0:-34,x1:-26,z0:226,z1:234,a:'z',f:226,t:234,h0:3,h1:0,name:'御根小屋の石段'},
  {id:'ushiroramp',x0:-18,x1:-12,z0:-104,z1:-98,a:'z',f:-98,t:-104,h0:70,h1:71.5,name:'後曲輪への段'},
  {id:'mizunote',x0:-6,x1:0,z0:-150,z1:-124,a:'z',f:-124,t:-150,h0:71.5,h1:66,name:'水の手門跡からの坂',road:true},
  {id:'aihata1',x0:-6,x1:0,z0:-180,z1:-162,a:'z',f:-162,t:-180,h0:66,h1:73,name:'相畑城戸跡への坂',road:true},
  {id:'tenjin1',x0:-4,x1:2,z0:-232,z1:-214,a:'z',f:-214,t:-232,h0:73,h1:80,name:'天神の丸への坂',road:true},
  {id:'tenjin2',x0:-4,x1:2,z0:-270,z1:-262,a:'z',f:-262,t:-270,h0:80,h1:73.5,name:'堀切へ下る坂',road:true},
  {id:'ooike1',x0:-4,x1:2,z0:-290,z1:-276,a:'z',f:-276,t:-290,h0:73.5,h1:74,name:'大池への道',road:true},
  {id:'omatsu1',x0:-4,x1:2,z0:-350,z1:-330,a:'z',f:-330,t:-350,h0:74,h1:78,name:'大松山城への坂',road:true},
  {id:'omatsu2r',x0:-26,x1:-18,z0:-369,z1:-363,a:'x',f:-18,t:-26,h0:78,h1:75,name:'二の丸への坂',road:true},
  {id:'omatsu3r',x0:-74,x1:-60,z0:-370,z1:-364,a:'x',f:-60,t:-74,h0:75,h1:72,name:'堀切を越える道',road:true},
  {id:'kiridoshi',x0:6,x1:12,z0:-416,z1:-384,a:'z',f:-384,t:-416,h0:78,h1:70,name:'切通',road:true}];
function rampH(r,x,z){ const c=r.a==='x'?x:z,u=Math.max(0,Math.min(1,(c-r.f)/(r.t-r.f))); return r.h0+(r.h1-r.h0)*u; }
/* 臥牛山の自然の斜面（林）: 曲輪から下へ、およそ32°で下る */
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
function meshH(x,z){ if(!inR(INR,x,z,0)) return moundH(x,z); if(inR(POND,x,z,0)) return POND.H-1.8; const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAtMesh(x,z); if(p) return p.H; const q=platAt(x,z); if(q){ let lo=1e9; for(const [dx,dz] of [[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]]){ const x2=x+dx,z2=z+dz; if(platAt(x2,z2)===q) continue; lo=Math.min(lo,baseH(x2,z2)); } return lo<1e8?lo:q.H; } return hillH(x,z); }
/* 曲輪の4辺（北・東・南・西）のどこに石垣があるか: 外側が低い辺 */
for(const p of PLAT){ if(!p.wall) continue; const E=[[p.x0,p.z0,p.x1,p.z0,0,-1],[p.x1,p.z0,p.x1,p.z1,1,0],[p.x0,p.z1,p.x1,p.z1,0,1],[p.x0,p.z0,p.x0,p.z1,-1,0]];
  p.walls=E.map(([ax,az,bx,bz,nx,nz])=>{ const L=Math.hypot(bx-ax,bz-az),n=Math.max(3,Math.ceil(L/2.5)); let lo=1e9; for(let i=0;i<=n;i++){ const t=i/n; lo=Math.min(lo,baseH(ax+(bx-ax)*t+nx*1.8,az+(bz-az)*t+nz*1.8)); } return lo<p.H-.6; }); }
/* 橋（紺屋川に架かる石橋・木橋） */
const archH=(z0,z1,k)=>(x,z)=>.35+(k||.5)*Math.sin(Math.PI*Math.min(1,Math.max(0,(z-z0)/(z1-z0))));
const BRIDGES=[
  {id:'b_ishibiya',x0:-12,x1:-4,z0:330,z1:344,h:archH(330,344),mode:'both',name:'紺屋川の橋'},
  {id:'b_honmachi',x0:-146,x1:-134,z0:330,z1:344,h:archH(330,344),mode:'both',name:'紺屋川の橋（本町）'},
  {id:'b_kyokai',x0:36,x1:42,z0:330,z1:344,h:archH(330,344,.7),mode:'both',name:'紺屋川の小橋'},
  {id:'b_east',x0:150,x1:158,z0:330,z1:344,h:archH(330,344),mode:'both',name:'紺屋川の橋'},
  {id:'b_west',x0:-226,x1:-218,z0:330,z1:344,h:archH(330,344),mode:'both',name:'紺屋川の橋'}];
let BOUNDS={x0:RIVER_X+1,x1:320,z0:-470,z1:540}; let SCEN=null; const FILL={};
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||b.mode===MODE);
function waterAt(x,z,m){ m=m||0;
  if(x>RIVER_X-RIVER_W-m&&x<RIVER_X+m) return true;
  if(inR(KONYA,x,z,m)) return true;
  if(inR(POND,x,z,m)) return true;
  return false; }
module.exports={baseH,waterAt,actB,inR,BRIDGES,PLAT,RAMPS};
