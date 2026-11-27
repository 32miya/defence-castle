/* 32miya-32miya-azuchi-castle index.html から取り出した地形と堀（node 用・自動で作った写し） */
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
/* 安土山の範囲（この内側だけに山の斜面がある） */
const INR={x0:-178,x1:150,z0:-278,z1:52};
/* 大手口の前の堀（両方の時代）。信長の時代は西・北・東が内湖（西の湖・常楽寺湖・伊庭内湖） */
const MOAT={x0:-170,x1:120,z0:56,z1:66};
const LAKE_W=-216, LAKE_N=-292, LAKE_E=172;   // 信長の時代の湖岸
const TOWN={x0:-210,x1:200,z0:70,z1:340};    // 信長の時代の城下町
/* 曲輪（平らな段）。wall: 石垣の高さ（下の斜面との差） */
const PLAT=[
  {id:'ote',x0:-62,x1:62,z0:40,z1:52,H:0,wall:0,name:'大手口'},
  {id:'hideL',x0:-46,x1:-8,z0:2,z1:30,H:5,wall:3,name:'伝羽柴秀吉邸（下段）'},
  {id:'hideU',x0:-46,x1:-8,z0:-30,z1:-2,H:11,wall:3,name:'伝羽柴秀吉邸（上段）'},
  {id:'toshiie',x0:8,x1:44,z0:-12,z1:26,H:7,wall:3,name:'伝前田利家邸'},
  {id:'sekian',x0:-46,x1:-10,z0:-56,z1:-36,H:17,wall:3,name:'伝武井夕庵邸'},
  {id:'ieyasu',x0:8,x1:46,z0:-66,z1:-36,H:19,wall:3,name:'伝徳川家康邸'},
  {id:'bend',x0:-10,x1:10,z0:-72,z1:-58,H:22,wall:4,name:'大手道の曲がり角'},
  {id:'mid1',x0:-48,x1:-30,z0:-68,z1:-58,H:28,wall:3,name:'大手道（つづら折り）'},
  {id:'nobutada',x0:-64,x1:-30,z0:-104,z1:-82,H:36,wall:4,name:'伝織田信忠邸'},
  {id:'kurogane',x0:-66,x1:-40,z0:-150,z1:-114,H:42,wall:5,name:'黒金門の前'},
  {id:'tamari',x0:-40,x1:-24,z0:-150,z1:-128,H:46,wall:4,name:'黒金門の内'},
  {id:'honmaru',x0:-24,x1:44,z0:-164,z1:-128,H:48,wall:5,name:'本丸'},
  {id:'tenshuB',x0:-22,x1:22,z0:-208,z1:-164,H:50,wall:7,name:'天主台の下'},
  {id:'sannomaru',x0:-68,x1:-22,z0:-200,z1:-160,H:52,wall:7,name:'三の丸'},
  {id:'ninomaru',x0:22,x1:64,z0:-200,z1:-164,H:52,wall:7,name:'二の丸'},
  {id:'soken',x0:-126,x1:-80,z0:-96,z1:-46,H:30,wall:4,name:'摠見寺'}];
const MOUNDS=[];
function moundH(x,z){ return 0; }
const PL={}; PLAT.forEach(p=>PL[p.id]=p);
/* 石段（坂）。a: 'x' か 'z' の向き、f→t でその座標、h0→h1 で高さ */
const RAMPS=[
  {id:'otemichi',x0:-4.2,x1:4.2,z0:-60,z1:40,a:'z',f:40,t:-60,h0:0,h1:22,name:'大手道'},
  {id:'hide',x0:-30,x1:-24,z0:-6,z1:6,a:'z',f:6,t:-6,h0:5,h1:11,name:'伝羽柴秀吉邸の石段'},
  {id:'tsuzura1',x0:-30,x1:-10,z0:-66,z1:-60,a:'x',f:-10,t:-30,h0:22,h1:28,name:'大手道（つづら折り）'},
  {id:'tsuzura2',x0:-44,x1:-38,z0:-82,z1:-68,a:'z',f:-68,t:-82,h0:28,h1:36,name:'大手道（つづら折り）'},
  {id:'nobu',x0:-58,x1:-52,z0:-114,z1:-104,a:'z',f:-104,t:-114,h0:36,h1:42,name:'黒金門への石段'},
  {id:'kuromon',x0:-44,x1:-36,z0:-142,z1:-136,a:'x',f:-44,t:-36,h0:42,h1:46,name:'黒金門'},
  {id:'hon1',x0:-28,x1:-20,z0:-140,z1:-134,a:'x',f:-28,t:-20,h0:46,h1:48,name:'本丸への石段'},
  {id:'tenB',x0:-3,x1:3,z0:-170,z1:-162,a:'z',f:-162,t:-170,h0:48,h1:50,name:'天主台への石段'},
  {id:'san',x0:-28,x1:-18,z0:-190,z1:-184,a:'x',f:-18,t:-28,h0:50,h1:52,name:'三の丸への石段'},
  {id:'nino',x0:18,x1:28,z0:-190,z1:-184,a:'x',f:18,t:28,h0:50,h1:52,name:'二の丸への石段'},
  {id:'soken',x0:-80,x1:-48,z0:-66,z1:-60,a:'x',f:-48,t:-80,h0:28,h1:30,name:'摠見寺への道'},
  {id:'momo',x0:-110,x1:-104,z0:-46,z1:52,a:'z',f:52,t:-46,h0:0,h1:30,name:'百々橋口道'}];
/* 高さを1.3倍に（安土山の高さ約110mを見た目に近づける） */
const HS=1.3; PLAT.forEach(p=>{ p.H*=HS; p.wall*=HS; }); RAMPS.forEach(r=>{ r.h0*=HS; r.h1*=HS; });
/* 大手道から両側の屋敷へ入る石段（大手道の路面の高さ → 屋敷の曲輪の高さ）。門の前で石塁と土塀を切る */
const ENTR=[['hideL',-1,18],['hideU',-1,-14],['toshiie',1,8],['ieyasu',1,-46],['sekian',-1,-41]];
for(const [id,sd,z] of ENTR){ const P=PL[id],road=RAMPS[0],hr=road.h0+(road.h1-road.h0)*Math.max(0,Math.min(1,(z-road.f)/(road.t-road.f))),edge=sd<0?P.x1:P.x0;
  RAMPS.push({id:'ent_'+id,x0:sd<0?edge-.6:4.2,x1:sd<0?-4.2:edge+.6,z0:z-1.7,z1:z+1.7,a:'x',f:sd*4.2,t:edge,h0:hr,h1:P.H,name:P.name.replace(/（.*?）/,'')+'の門前'}); }
function rampH(r,x,z){ const c=r.a==='x'?x:z,u=Math.max(0,Math.min(1,(c-r.f)/(r.t-r.f))); return r.h0+(r.h1-r.h0)*u; }
/* 安土山の自然の斜面（林）: 曲輪から下へ、およそ32°で下る。北と東西は内湖へ急に落ちる */
function hillRaw(x,z){ let h=0; for(const p of PLAT){ if(p.id==='ote') continue; const top=p.H-p.wall-.7*rDist(p,x,z); if(top>h) h=top; }
  /* 山の背骨（八角平・薬師平へのびる尾根） */ const rid=44-.5*segD(x,z,[-30,-200],[110,-150]); if(rid>h) h=rid; const rid2=39-.55*segD(x,z,[-140,-130],[-60,-210]); if(rid2>h) h=rid2; return h; }
function hillH(x,z){ if(!inR(INR,x,z,0)) return 0; let h=hillRaw(x,z); if(h<=0) return 0; const e=Math.min(x-INR.x0,INR.x1-x,z-INR.z0,INR.z1-z); h*=sstep(e/22); if(h>.4) h+=(fbm(x*.05,z*.05,3)-.5)*Math.min(2.4,h*.4); return Math.max(0,h); }
function platAt(x,z){ for(const p of PLAT) if(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1) return p; return null; }
function platAtMesh(x,z){ for(const p of PLAT){ if(!(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1)) continue; const W=p.walls; if(W){ const e=.01; if((W[0]&&z<p.z0+e)||(W[1]&&x>p.x1-e)||(W[2]&&z>p.z1-e)||(W[3]&&x<p.x0+e)) continue; } return p; } return null; }
function rampAt(x,z){ for(const r of RAMPS) if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1) return r; return null; }
function baseH(x,z){ if(!inR(INR,x,z,0)) return 0; const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAt(x,z); if(p) return p.H; return hillH(x,z); }
function meshH(x,z){ if(!inR(INR,x,z,0)) return 0; const r=rampAt(x,z); if(r) return rampH(r,x,z); const p=platAtMesh(x,z); if(p) return p.H; const q=platAt(x,z); if(q){ let lo=1e9; for(const [dx,dz] of [[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]]){ const x2=x+dx,z2=z+dz; if(platAt(x2,z2)===q) continue; lo=Math.min(lo,baseH(x2,z2)); } return lo<1e8?lo:q.H; } return hillH(x,z); }
for(const p of PLAT){ if(!p.wall) continue; const E=[[p.x0,p.z0,p.x1,p.z0,0,-1],[p.x1,p.z0,p.x1,p.z1,1,0],[p.x0,p.z1,p.x1,p.z1,0,1],[p.x0,p.z0,p.x0,p.z1,-1,0]];
  p.walls=E.map(([ax,az,bx,bz,nx,nz])=>{ const L=Math.hypot(bx-ax,bz-az),n=Math.max(3,Math.ceil(L/2.5)); let lo=1e9; for(let i=0;i<=n;i++){ const t=i/n; lo=Math.min(lo,baseH(ax+(bx-ax)*t+nx*1.8,az+(bz-az)*t+nz*1.8)); } return lo<p.H-.6; }); }
/* 橋 */
const BRIDGES=[
  {id:'otebashi',x0:-4,x1:4,z0:54.5,z1:67.5,h:()=>.35,mode:'both',name:'大手の橋'},
  {id:'momobashi',x0:-110,x1:-104,z0:54.5,z1:67.5,h:(x,z)=>.35+.7*Math.sin(Math.PI*Math.min(1,Math.max(0,(z-54.5)/13))),mode:'both',name:'百々橋'},
  {id:'higashi',x0:70,x1:76,z0:54.5,z1:67.5,h:()=>.35,mode:'edo',name:'東の橋'}];
let BOUNDS={x0:-256,x1:250,z0:-300,z1:360}; let SCEN=null; const FILL={};
const actB=()=>BRIDGES.filter(b=>b.mode==='both'||b.mode===MODE);
/* 天主台（不等辺八角形の石垣）。中心と大きさ */
const TZ={cx:0,cz:-186,g0:50*HS,bw:31,bd:28,bh:9,bat:1.6,ch:5};
function waterAt(x,z,m){ m=m||0;
  if(inR(MOAT,x,z,m)) return true;
  if(MODE==='edo'){ if(x<LAKE_W+m) return true; if(z<LAKE_N+m) return true; if(x>LAKE_E-m&&z<40+m) return true; }
  else { if(x<-372+m&&z<-120+m) return true; }
  return false; }
module.exports={baseH:typeof baseH!=='undefined'?baseH:null,waterAt,actB,inR,BRIDGES,groundH:typeof groundH!=='undefined'?groundH:null};
