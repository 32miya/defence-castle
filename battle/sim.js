/* 戦国・城ディフェンス（仮） 合戦の計算
   three.js を使わない純粋な計算部分。兵は1人ずつではなく「部隊」単位で計算する。
   ブラウザでは window.OshiroBattleSim、node では require() で使える（バランス調整のシミュレーション用）。

   マップ設定データ（battle/maps/*.js）の書式は README の「マップ設定データ」を参照。 */
(function(root){
'use strict';

/* ---------- 兵種と三すくみ ---------- */
const TYPES={
  yari: {name:'足軽',  short:'槍', speed:3.2, range:7.5, atk:1.00, def:1.00, melee:true },
  yumi: {name:'弓隊',  short:'弓', speed:3.0, range:30,  atk:0.80, def:0.85, melee:false},
  kiba: {name:'騎馬隊',short:'騎', speed:5.6, range:7.5, atk:1.15, def:1.00, melee:true },
  /* 鉄砲隊＝弓の上位（安土の織田信長など、特技で弓隊が置き換わる） */
  teppo:{name:'鉄砲隊',short:'鉄', speed:2.8, range:36,  atk:1.05, def:0.85, melee:false, base:'yumi'}
};
const BEATS={yari:'kiba',kiba:'yumi',yumi:'yari'};
/* 部隊ごとの特技（使うと一定時間強くなる。使ったあとは待ち時間） */
const SKILLS={
  yari: {name:'槍衾',    cd:40,dur:12,text:'その場で槍をそろえる。12秒、受ける損害0.6倍・攻撃1.3倍（動けない）'},
  yumi: {name:'一斉射撃',cd:35,dur:8, text:'8秒、矢の威力1.8倍'},
  kiba: {name:'突撃',    cd:40,dur:8, text:'8秒、攻撃1.5倍・足1.4倍。ぶつかった敵の士気を大きく下げる'},
  teppo:{name:'三段撃ち',cd:35,dur:8, text:'8秒、鉄砲の威力1.8倍'}
};
/* 策（采配を使う。采配は時間とともにたまる） */
const SAKU={
  kobu:    {name:'鼓舞',      cost:1,text:'味方1部隊の士気を40回復し、15秒攻撃1.2倍。敗走中ならすぐ立ち直る'},
  rakuseki:{name:'落石',      cost:2,text:'選んだ場所に石を落とす。半径11mの敵に損害・士気低下・8秒足止め'},
  gate:    {name:'門を閉ざす',cost:2,text:'門を25秒閉じる。敵は門を破るまで先へ進めない'}
};   /* 足軽→騎馬、騎馬→弓、弓→足軽 に強い */
const baseOf=t=>(TYPES[t]&&TYPES[t].base)||t;

const DEF={
  adv:1.5, dis:0.6,          /* ダメージ倍率（有利・不利） */
  K:0.013,                   /* 1人が1秒に倒す人数の基準 */
  contact:7,                 /* 白兵戦の間合い（部隊の中心どうし, m） */
  tick:0.1,                  /* 計算の刻み（秒） */
  menScale:5,                /* 兵数の倍率: 設定データの人数をこの倍にして戦う（1部隊を数百〜千人規模に） */
  menPerFigure:100,          /* 表示: 兵100人につき兵士1体（1部隊は最大60体） */
  routTime:12,               /* 敗走している時間 */
  rallyMorale:35,            /* 敗走から立ち直ったときの士気 */
  enemySpeed:.8,             /* 攻め手は用心して進む（味方より遅い） */
  saihaiStart:2, saihaiMax:5, saihaiRate:1/9, /* 采配: 最初2、9秒で1たまる、最大5 */
  gateTime:25, gateHP:100,
  /* 城方の補正（城攻めには3倍の兵が要ると言われる）: 守り手は受ける損害0.6倍・攻撃1.15倍 */
  defTake:.6, defAtk:1.15,
  /* 堀は渡れるが速さ半分。堀の中の兵は攻撃0.6倍・受ける損害1.3倍。塀をよじ登る兵は速さ0.3倍・攻撃0.5倍・受ける損害1.5倍 */
  waterSpeed:.5, wallSpeed:.3,
  /* ステージが進むほど敵が増える（1ステージごとに+20%） */
  stageGrow:.2
};

function dist(ax,az,bx,bz){ return Math.hypot(bx-ax,bz-az); }
function clamp(v,a,b){ return v<a?a:v>b?b:v; }

/* ---------- 移動の網（味方の部隊が坂道を通って動くための道の網） ----------
   進軍ルートの点をつなぎ、配置場所を近くの点につなぐ。links で追加の道も書ける。 */
function buildNav(map){
  const N=[],E=[];
  const node=(x,z)=>{ for(let i=0;i<N.length;i++) if(dist(N[i][0],N[i][1],x,z)<3) return i; N.push([x,z]); E.push([]); return N.length-1; };
  const link=(a,b)=>{ if(a===b) return; const d=dist(N[a][0],N[a][1],N[b][0],N[b][1]); if(!E[a].some(e=>e[0]===b)){ E[a].push([b,d]); E[b].push([a,d]); } };
  for(const r of map.routes){ let p=-1; for(const q of r.pts){ const i=node(q[0],q[1]); if(p>=0) link(p,i); p=i; } }
  for(const l of map.links||[]){ let p=-1; for(const q of l){ const i=node(q[0],q[1]); if(p>=0) link(p,i); p=i; } }
  const routeNodes=N.length;
  for(const s of map.slots){ const i=node(s.pos[0],s.pos[1]); const near=[]; for(let j=0;j<routeNodes;j++) if(j!==i) near.push([j,dist(N[j][0],N[j][1],s.pos[0],s.pos[1])]); near.sort((a,b)=>a[1]-b[1]); for(const [j] of near.slice(0,2)) link(i,j); }
  return {N,E};
}
function navPath(nav,ax,az,bx,bz,h){
  /* 近くて高さの差が小さければまっすぐ */
  if(dist(ax,az,bx,bz)<22&&Math.abs(h(ax,az)-h(bx,bz))<4) return [[bx,bz]];
  const near=(x,z)=>{ let b=0,bd=1e9; for(let i=0;i<nav.N.length;i++){ const d=dist(nav.N[i][0],nav.N[i][1],x,z)+Math.abs(h(nav.N[i][0],nav.N[i][1])-h(x,z))*2; if(d<bd){ bd=d; b=i; } } return b; };
  const s=near(ax,az),t=near(bx,bz); if(s===t) return [nav.N[s],[bx,bz]];
  const D=new Array(nav.N.length).fill(1e9),P=new Array(nav.N.length).fill(-1),done=new Array(nav.N.length).fill(false); D[s]=0;
  for(;;){ let u=-1,ud=1e9; for(let i=0;i<D.length;i++) if(!done[i]&&D[i]<ud){ ud=D[i]; u=i; } if(u<0||u===t) break; done[u]=true; for(const [v,w] of nav.E[u]){ if(D[u]+w<D[v]){ D[v]=D[u]+w; P[v]=u; } } }
  const out=[]; for(let v=t;v>=0;v=P[v]) out.unshift(nav.N[v]); if(!out.length||out[0]!==nav.N[s]) return [[bx,bz]];
  /* 最初の点が後ろ向きなら飛ばす */
  if(out.length>1&&dist(ax,az,out[1][0],out[1][1])<dist(out[0][0],out[0][1],out[1][0],out[1][1])) out.shift();
  out.push([bx,bz]); return out;
}

/* ---------- 味方の最短経路（城内の地形をマス目にして探す） ----------
   2mのマス目。となりのマスとの高さの差が急すぎる所（石垣・崖）は通れない。坂道は通れる。
   道の網（buildNav）だと遠回りになるため、味方の移動はこちらを使う。 */
class Grid{
  constructor(b,h,cell,block,water,floor){ this.c=cell||2; this.x0=b.x0; this.z0=b.z0; this.W=Math.ceil((b.x1-b.x0)/this.c)+1; this.H=Math.ceil((b.z1-b.z0)/this.c)+1;
    const n=this.W*this.H; this.h=new Float32Array(n); for(let j=0;j<this.H;j++) for(let i=0;i<this.W;i++) this.h[j*this.W+i]=h(this.x0+i*this.c,this.z0+j*this.c);
    /* blk: 0=通れる 1=建物（だれも通れない） 2=塀（攻め手だけよじ登れる）  wat: 1=堀・川（遅くなる） */
    /* h2: 橋の下の地面（橋の上と下の両方を歩けるように）。橋のない所は NaN */
    this.h2=new Float32Array(n).fill(NaN); if(floor) for(let k=0;k<n;k++){ const x=this.x0+(k%this.W)*this.c,z=this.z0+Math.floor(k/this.W)*this.c,f=floor(x,z); if(this.h[k]-f>1.5) this.h2[k]=f; }
    this.blk=new Uint8Array(n); this.wat=new Uint8Array(n);
    for(let j=0;j<this.H;j++) for(let i=0;i<this.W;i++){ const x=this.x0+i*this.c,z=this.z0+j*this.c,k=j*this.W+i; if(block){ const v=block(x,z); this.blk[k]=v===true?1:(v|0); } if(water&&water(x,z)) this.wat[k]=1; }
    this.maxSlope=.8; this.g=new Float32Array(n); this.f=new Float32Array(n); this.par=new Int32Array(n); this.stamp=new Uint32Array(n); this.closed=new Uint32Array(n); this.run=0; }
  idx(x,z){ const i=Math.round((x-this.x0)/this.c),j=Math.round((z-this.z0)/this.c); if(i<0||j<0||i>=this.W||j>=this.H) return -1; return j*this.W+i; }
  pos(k){ return [this.x0+(k%this.W)*this.c,this.z0+Math.floor(k/this.W)*this.c]; }
  ok(a,b,d,side){ const t=this.blk[b]; if(t===1||(t===2&&side!=='enemy')) return false; if(this.wat[b]||this.wat[a]) return true; const m=this.maxSlope*d;
    if(Math.abs(this.h[a]-this.h[b])<=m) return true; const a2=this.h2[a],b2=this.h2[b];
    return (a2===a2&&Math.abs(a2-this.h[b])<=m)||(b2===b2&&Math.abs(this.h[a]-b2)<=m)||(a2===a2&&b2===b2&&Math.abs(a2-b2)<=m); }
  cost(k){ return (this.wat[k]?2:1)*(this.blk[k]===2?4:1); }
  blockedAt(x,z,side){ const k=this.idx(x,z); if(k<0) return false; const t=this.blk[k]; return t===1||(t===2&&side!=='enemy'); }
  waterAt(x,z){ const k=this.idx(x,z); return k>=0&&this.wat[k]===1; }
  wallAt(x,z){ const k=this.idx(x,z); return k>=0&&this.blk[k]===2; }
  /* マス目の上をまっすぐ行けるか（経路をなめらかにするため） */
  line(ax,az,bx,bz,side){ const L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/(this.c*.5)); let pk=this.idx(ax,az),ph=null; for(let i=1;i<=n;i++){ const x=ax+(bx-ax)*i/n,z=az+(bz-az)*i/n,k=this.idx(x,z); if(k<0) return false; if(k!==pk){ const d=Math.hypot(...this.pos(k).map((v,q)=>v-this.pos(pk)[q]))||this.c; if(this.h2[k]===this.h2[k]||!this.ok(pk,k,d,side)||this.cost(k)!==this.cost(pk)) return false; pk=k; } } return true; }
  /* 2段の地面（橋の上=0／橋の下=1）を区別して探す。ノード番号＝マス＋段×マスの数 */
  hl(k,L){ return L?this.h2[k]:this.h[k]; }
  okL(k,L,nk,NL,d,side){ const t=this.blk[nk]; if(t===1||(t===2&&side!=='enemy')) return false; if(NL&&!(this.h2[nk]===this.h2[nk])) return false;
    if(this.wat[nk]||this.wat[k]) return true; return Math.abs(this.hl(k,L)-this.hl(nk,NL))<=this.maxSlope*d; }
  find(ax,az,bx,bz,side){
    const s=this.idx(ax,az),t=this.idx(bx,bz); if(s<0||t<0) return null; if(s===t) return [[bx,bz]];
    const n=this.W*this.H; if(!this.g2||this.g2.length!==2*n){ this.g2=new Float32Array(2*n); this.f2=new Float32Array(2*n); this.par2=new Int32Array(2*n); this.st2=new Uint32Array(2*n); this.cl2=new Uint32Array(2*n); }
    const G2=this.g2,F2=this.f2,PA=this.par2,ST=this.st2,CL=this.cl2;
    const run=++this.run,W=this.W,c=this.c,D2=c*Math.SQRT2; const heap=[];
    const push=k=>{ heap.push(k); let i=heap.length-1; while(i>0){ const p=(i-1)>>1; if(F2[heap[p]]<=F2[k]) break; heap[i]=heap[p]; i=p; } heap[i]=k; };
    const pop=()=>{ const top=heap[0],last=heap.pop(); if(heap.length){ let i=0; const m=heap.length; for(;;){ let l=2*i+1,r=l+1,mm=i; const fv=q=>F2[q===i?last:heap[q]]; if(l<m&&F2[heap[l]]<fv(mm)) mm=l; if(r<m&&F2[heap[r]]<fv(mm)) mm=r; if(mm===i) break; heap[i]=heap[mm]; i=mm; } heap[i]=last; } return top; };
    const [tx,tz]=this.pos(t),hh=k=>{ const [x,z]=this.pos(k%n),dx=Math.abs(x-tx),dz=Math.abs(z-tz); return Math.max(dx,dz)+(Math.SQRT2-1)*Math.min(dx,dz); };
    const starts=[s]; if(this.h2[s]===this.h2[s]) starts.push(s+n);
    for(const s0 of starts){ ST[s0]=run; G2[s0]=0; F2[s0]=hh(s0); PA[s0]=-1; push(s0); }
    let best=s,bh=F2[s],it=0;
    const NB=[[1,0,c],[-1,0,c],[0,1,c],[0,-1,c],[1,1,D2],[1,-1,D2],[-1,1,D2],[-1,-1,D2]];
    while(heap.length&&it++<400000){ const id=pop(); if(CL[id]===run) continue; CL[id]=run; const k=id%n,L=id>=n?1:0; if(k===t){ best=id; break; }
      const hk=F2[id]-G2[id]; if(hk<bh){ bh=hk; best=id; }
      const i=k%W,j=(k-i)/W;
      for(const [di,dj,d] of NB){ const ni=i+di,nj=j+dj; if(ni<0||nj<0||ni>=W||nj>=this.H) continue; const nk=nj*W+ni;
        for(let NL=0;NL<2;NL++){ const nid=nk+NL*n; if(CL[nid]===run||!this.okL(k,L,nk,NL,d,side)) continue;
          if(di&&dj&&(!this.okL(k,L,j*W+ni,NL&&this.h2[j*W+ni]===this.h2[j*W+ni]?1:0,c,side)||!this.okL(k,L,nj*W+i,NL&&this.h2[nj*W+i]===this.h2[nj*W+i]?1:0,c,side))) continue;
          const ng=G2[id]+d*this.cost(nk)+Math.abs(this.hl(nk,NL)-this.hl(k,L))*.6; if(ST[nid]!==run||ng<G2[nid]){ ST[nid]=run; G2[nid]=ng; F2[nid]=ng+hh(nid); PA[nid]=id; push(nid); } } } }
    const rawI=[]; for(let id=best;id>=0;id=PA[id]) rawI.unshift(id);
    const raw=rawI.map(id=>this.pos(id%n)); if(best%n===t) raw.push([bx,bz]); raw[0]=[ax,az];
    /* なめらかに（見通せる点は飛ばす）。橋のマスをまたぐ所は飛ばさない */
    const hasB=(a2,b2)=>{ for(let q=a2;q<=b2&&q<rawI.length;q++) if(this.h2[rawI[q]%n]===this.h2[rawI[q]%n]) return true; return false; };
    const out=[]; let a=0; while(a<raw.length-1){ let b=raw.length-1; while(b>a+1&&(hasB(a,b)||!this.line(raw[a][0],raw[a][1],raw[b][0],raw[b][1],side))) b--; out.push(raw[b]); a=b; }
    return out.length?out:[[bx,bz]]; }
}

/* ---------- 進軍ルート ---------- */
function prepRoute(r){ const cum=[0]; for(let i=1;i<r.pts.length;i++) cum.push(cum[i-1]+dist(r.pts[i-1][0],r.pts[i-1][1],r.pts[i][0],r.pts[i][1])); r.cum=cum; r.len=cum[cum.length-1]; return r; }
function projRoute(r,x,z){ let best=1e9,bs=0,bi=1; for(let i=1;i<r.pts.length;i++){ const [ax,az]=r.pts[i-1],[bx,bz]=r.pts[i],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=l2?clamp(((x-ax)*dx+(z-az)*dz)/l2,0,1):0,d=dist(x,z,ax+dx*t,az+dz*t); if(d<best){ best=d; bs=r.cum[i-1]+Math.sqrt(l2)*t; bi=i; } } return {s:bs,i:bi,d:best}; }

/* ---------- 合戦 ---------- */
class Battle{
  constructor(map,opt){
    opt=opt||{};
    this.map=map; this.C=Object.assign({},DEF,map.rules||{},opt.rules||{});
    this.h=opt.h||(()=>0);
    this.time=0; this.acc=0; this.state='run'; this.events=[]; this.units=[]; this.nextId=1;
    this.duration=opt.duration||map.duration||480;
    this.enemyScale=(opt.enemyScale||(map.enemy&&map.enemy.scale)||1)*(1+(this.C.stageGrow||0)*((map.stage||1)-1));
    this.routes={}; for(const r of map.routes) this.routes[r.id]=prepRoute(Object.assign({},r));
    this.slots=map.slots.map(s=>Object.assign({},s));
    this.nav=buildNav(map);
    this.grid=null; if(opt.grid!==false&&map.keep) this.grid=new Grid(map.keep,this.h,opt.block?1.5:2,opt.block,opt.water,opt.floor);
    /* 敵の進軍ルート: 設定データの点のあいだを、建物や崖をよけて通れる道でつなぐ */
    if(this.grid) for(const id in this.routes){ const r=this.routes[id],P=[r.pts[0]]; for(let i=1;i<r.pts.length;i++){ const a=P[P.length-1],b=r.pts[i]; const seg=this.grid.find(a[0],a[1],b[0],b[1],'enemy'); if(seg&&seg.length){ for(const q of seg) if(dist(q[0],q[1],P[P.length-1][0],P[P.length-1][1])>.5) P.push(q); } else P.push(b); } r.key=r.pts; r.pts=P; prepRoute(r); this.timeRoute(r); } /* 城内のマス目（合戦の始めに一度だけ作る） */
    this.lines=map.lines; this.breached=0;
    /* 防衛線がルートのどこにあたるか */
    this.lineS={}; for(const id in this.routes){ const r=this.routes[id]; this.lineS[id]=this.lines.map(L=>{ let s=null; for(const p of L.pts){ const q=projRoute(r,p[0],p[1]); if(q.d<15) s=s===null?q.s:Math.min(s,q.s); } return s; }); }
    this.waves=(opt.waves||map.enemy.waves).map((w,i)=>Object.assign({i,spawned:false},w));
    this.waveNow=-1; this.spawnQ=[];
    this.skill=(map.general&&map.general.skill)||null;
    this.bossSkill=(map.enemy.boss&&map.enemy.boss.skill)||null;
    this.stats={allyMen0:0,allyLost:0,enemyMen:0,enemyLost:0,enemyRouted:0};
    /* 采配（策に使う） */
    this.saihai=this.C.saihaiStart; this.rocks=[];
    this.gates=(map.narrow||[]).map((g,i)=>({i,name:g.name||'門',pos:g.pos,r:g.r||7,until:0,hp:0}));
    for(const a of (opt.army||[])) this.addAlly(a);
  }
  /* 味方の部隊を置く */
  addAlly(a){
    const slot=this.slots.find(s=>s.id===a.slot)||this.slots[0];
    let type=a.type; if(this.skill&&this.skill.kind==='teppo'&&type==='yumi') type='teppo';
    const u=this.mkUnit('ally',type,a.men,slot.pos[0]+(a.dx||0),slot.pos[1]+(a.dz||0),a.name||TYPES[type].name);
    u.gen=a.gen||''; u.armyId=a.id; u.home=slot; u.slot=slot; u.order={kind:'hold',x:u.x,z:u.z,slot};
    this.stats.allyMen0+=u.men; return u;
  }
  mkUnit(side,type,men,x,z,name){ const u={id:this.nextId++,side,type,base:baseOf(type),name,men,men0:men,morale:100,x,z,px:x,pz:z,y:this.h(x,z),heading:side==='enemy'?0:Math.PI,charged:new Set(),kobuUntil:0,slowUntil:0,skillReady:0,
      state:'idle',path:null,order:null,target:null,engaged:false,hitBy:[],kills:0,fightT:0,routT:0,cool:Math.random(),moving:false,slot:null,s:0,ri:1};
    this.units.push(u); return u; }
  spawnEnemy(e,wave){
    const r=this.routes[e.route],p0=r.pts[0],p1=r.pts[1],ang=Math.atan2(p1[0]-p0[0],p1[1]-p0[1]);
    const u=this.mkUnit('enemy',e.type,Math.round(e.men*this.enemyScale*this.C.menScale/10)*10,p0[0],p0[1],e.name||TYPES[e.type].name);
    u.route=r; u.ri=1; u.s=0; u.heading=ang; u.boss=!!e.boss; u.wave=wave; u.gen=e.gen||'';
    if(u.boss&&this.bossSkill&&this.bossSkill.kind==='kishu'){ u.speedMul=1.15; }
    if(e.morale) u.morale=e.morale;
    this.stats.enemyMen+=u.men; this.events.push({k:'spawn',u});
    if(u.boss) this.events.push({k:'boss',u});
    return u;
  }
  live(side){ return this.units.filter(u=>u.side===side&&u.state!=='dead'&&u.state!=='gone'); }
  unit(id){ return this.units.find(u=>u.id===id); }

  /* ---------- プレイヤーの指示 ----------
     hold:{x,z,slot}  守備 / reinforce:{target} 援軍 / intercept:{target} 迎撃 / auto 任せる / retreat 退却 */
  order(id,o){
    const u=this.unit(id); if(!u||u.side!=='ally'||u.state==='dead') return false;
    if(u.state==='rout') return false;
    if(o.kind==='hold'){ const sl=o.slot||this.slotNear(o.x,o.z,9); const x=sl?sl.pos[0]:o.x,z=sl?sl.pos[1]:o.z; u.order={kind:'hold',x,z,slot:sl||null}; this.goTo(u,x,z); }
    else if(o.kind==='reinforce'){ const t=this.unit(o.target); if(!t||t===u) return false; u.order={kind:'reinforce',target:t}; this.goTo(u,t.x,t.z); }
    else if(o.kind==='intercept'){ const t=this.unit(o.target); if(!t||t.side!=='enemy') return false; u.order={kind:'intercept',target:t}; u.target=t; this.goTo(u,t.x,t.z); }
    else if(o.kind==='auto'){ u.order={kind:'auto'}; u.aiT=0; }
    else if(o.kind==='retreat'){ const sl=this.retreatSlot(u); u.order={kind:'hold',x:sl.pos[0],z:sl.pos[1],slot:sl,retreat:true}; this.goTo(u,sl.pos[0],sl.pos[1]); }
    u.target=o.kind==='intercept'?u.order.target:null; u.slot=null;
    return true;
  }
  slotNear(x,z,r){ let b=null,bd=r; for(const s of this.slots){ const d=dist(s.pos[0],s.pos[1],x,z); if(d<bd){ bd=d; b=s; } } return b; }
  lineOf(u){ /* 今いる場所の防衛線（いちばん近い配置場所の線） */ let b=null,bd=1e9; for(const s of this.slots){ const d=dist(s.pos[0],s.pos[1],u.x,u.z); if(d<bd){ bd=d; b=s; } } return b?b.line:1; }
  retreatSlot(u){ const L=this.lineOf(u),maxL=Math.max(...this.slots.map(s=>s.line)); const want=Math.min(maxL,L+1);
    let b=null,bd=1e9; for(const s of this.slots) if(s.line===want){ const d=dist(s.pos[0],s.pos[1],u.x,u.z)+(s.kind==='gate'&&TYPES[u.type].melee?-10:0); if(d<bd){ bd=d; b=s; } } return b||this.slots[this.slots.length-1]; }
  goTo(u,x,z){ u.path=this.pathFor(u.x,u.z,x,z,u.side); u.goal=[x,z]; u.repath=this.time+.8; }
  /* ルートの点ごとに「本丸までにかかる手間」（堀は2倍、塀は3倍以上）を積む */
  timeRoute(r){ const g=this.grid,T=[0]; for(let i=1;i<r.pts.length;i++){ const [ax,az]=r.pts[i-1],[bx,bz]=r.pts[i],L=dist(ax,az,bx,bz),n=Math.max(1,Math.ceil(L/2)); let t=0; for(let k=0;k<n;k++){ const x=ax+(bx-ax)*(k+.5)/n,z=az+(bz-az)*(k+.5)/n; t+=L/n*(g.waterAt(x,z)?1/this.C.waterSpeed:1)*(g.wallAt(x,z)?1/this.C.wallSpeed:1); } T.push(T[i-1]+t); } r.cumT=T; r.lenT=T[T.length-1]; }
  /* 敵が本丸に着くまでの残りの手間 */
  remain(e){ const r=e.route; if(!r.cumT) return r.len-e.s; let i=1; while(i<r.cum.length-1&&r.cum[i]<e.s) i++; const f=(e.s-r.cum[i-1])/Math.max(1e-6,r.cum[i]-r.cum[i-1]); return r.lenT-(r.cumT[i-1]+(r.cumT[i]-r.cumT[i-1])*Math.max(0,Math.min(1,f))); }
  /* 味方の経路: 城内のマス目で最短。マス目の外は道の網 */
  pathFor(ax,az,bx,bz,side){ if(this.grid===null) this.grid=this.map.keep?new Grid(this.map.keep,this.h,2):false;
    if(this.grid){ const p=this.grid.find(ax,az,bx,bz,side||'ally'); if(p&&p.length) return p; } return navPath(this.nav,ax,az,bx,bz,this.h); }
  stale(u,x,z,r){ return !u.path||!u.goal||(dist(u.goal[0],u.goal[1],x,z)>r&&this.time>=(u.repath||0)); }

  /* ---------- 進める ---------- */
  step(dt){ if(this.state!=='run') return; this.acc+=dt; const T=this.C.tick; let n=0; while(this.acc>=T&&n<20){ this.acc-=T; this.tick(T); n++; } if(n>=20) this.acc=0; }
  tick(dt){
    for(const u of this.units){ u.px=u.x; u.pz=u.z; }
    this.time+=dt;
    this.spawnWaves(dt);
    this.saihai=Math.min(this.C.saihaiMax,this.saihai+dt*this.C.saihaiRate);
    this.updRocks(); this.updGates(dt);
    const A=this.live('ally'),E=this.live('enemy');
    for(const u of A) this.thinkAlly(u,E,A,dt);
    for(const u of E) this.thinkEnemy(u,A,dt);
    this.combat(A.concat(E),dt);
    this.moveAll(A.concat(E),dt);
    this.separate(A); this.separate(E);
    this.checkEnd();
  }
  spawnWaves(dt){
    for(const w of this.waves){ if(!w.spawned&&this.time>=w.t){ w.spawned=true; this.waveNow=w.i; this.events.push({k:'wave',i:w.i,label:w.label,text:w.text});
      const per={}; for(const e of w.units){ const k=e.route; per[k]=(per[k]||0); this.spawnQ.push({t:this.time+per[k]+(e.delay||0),e,wave:w.i}); per[k]+=7; } } }
    for(let i=this.spawnQ.length-1;i>=0;i--){ const q=this.spawnQ[i]; if(this.time>=q.t){ this.spawnQ.splice(i,1); this.spawnEnemy(q.e,q.wave); } }
  }
  /* 地形補正: 立っている配置場所 */
  slotAt(u){ for(const s of this.slots) if(dist(s.pos[0],s.pos[1],u.x,u.z)<8) return s; return null; }
  rangeOf(u){ const T=TYPES[u.type]; let r=T.range; if(!T.melee){ const s=this.slotAt(u); if(s&&s.kind==='yagura') r*=1.35; else if(s&&s.kind==='ishigaki') r*=1.25; } return r; }
  inNarrow(u){ for(const g of this.map.narrow||[]) if(dist(g.pos[0],g.pos[1],u.x,u.z)<(g.r||7)) return true; return false; }

  thinkAlly(u,E,A,dt){
    if(u.state==='rout'){ u.routT-=dt; if(u.routT<=0){ u.state='idle'; u.morale=this.C.rallyMorale; u.order={kind:'hold',x:u.x,z:u.z,slot:this.slotAt(u)}; u.path=null; this.events.push({k:'rally',u}); } return; }
    const T=TYPES[u.type],o=u.order||{kind:'hold',x:u.x,z:u.z};
    const range=this.rangeOf(u);
    const nearestE=(x,z,r,pref)=>{ let b=null,bd=r; for(const e of E){ if(e.state==='rout'&&T.melee&&dist(e.x,e.z,x,z)>12) continue; let d=dist(e.x,e.z,u.x,u.z); if(dist(e.x,e.z,x,z)>r) continue; if(pref&&BEATS[u.base]===e.base) d-=12; if(pref&&BEATS[e.base]===u.base) d+=12; if(d<bd){ bd=d; b=e; } } return b; };
    let anchor=null; /* 守る場所 */
    if(o.kind==='hold') anchor=[o.x,o.z];
    else if(o.kind==='reinforce'){ const t=o.target; if(!t||t.state==='dead'||t.state==='gone'){ u.order={kind:'hold',x:u.x,z:u.z}; return; } anchor=[t.x+Math.sin(t.heading+Math.PI/2)*6,t.z+Math.cos(t.heading+Math.PI/2)*6]; }
    else if(o.kind==='intercept'){ const t=o.target; if(!t||t.state==='dead'||t.state==='gone'){ u.order={kind:'hold',x:u.x,z:u.z,slot:this.slotAt(u)}; u.target=null; return; }
      u.target=t; const d=dist(u.x,u.z,t.x,t.z); if(d>(T.melee?this.C.contact:range*.9)){ if(this.stale(u,t.x,t.z,6)) this.goTo(u,t.x,t.z); } else u.path=null; return; }
    else if(o.kind==='auto'){ u.aiT=(u.aiT||0)-dt; if(u.aiT<=0){ u.aiT=2; this.autoPick(u,E); } anchor=u.autoAnchor||[u.home.pos[0],u.home.pos[1]]; }
    /* 守備・援軍・任せる: 近くの敵と戦う */
    const leash=T.melee?(u.type==='kiba'?22:14):range;
    let t=(o.kind==='auto'&&u.autoTarget&&u.autoTarget.state!=='dead'&&u.autoTarget.state!=='gone'&&dist(u.autoTarget.x,u.autoTarget.z,anchor[0],anchor[1])<55)?u.autoTarget:nearestE(anchor[0],anchor[1],T.melee?leash:range,true);
    if(!T.melee){ /* 弓: 動かずに射る（射程の外の敵は、任せるときだけ寄る） */
      const inR=nearestE(u.x,u.z,range,true); u.target=inR;
      const ad=dist(u.x,u.z,anchor[0],anchor[1]);
      u.moveFire=false;
      if(!inR&&o.kind==='auto'&&t){ if(this.stale(u,t.x,t.z,10)) this.goTo(u,t.x,t.z); }
      else if(inR&&(o.kind==='auto'||ad<=6)){ u.path=null; }
      else if(ad>2.5){ u.moveFire=!!inR; /* 命じられた場所へ向かう途中も、射程内の敵に矢を射かけながら進む */ if(!u.path||!u.goal||dist(u.goal[0],u.goal[1],anchor[0],anchor[1])>2) this.goTo(u,anchor[0],anchor[1]); }
      return; }
    if(t){ u.target=t; const d=dist(u.x,u.z,t.x,t.z); if(d>this.C.contact*.9){ if(this.stale(u,t.x,t.z,5)) this.goTo(u,t.x,t.z); } else u.path=null; }
    else { u.target=null; const ad=dist(u.x,u.z,anchor[0],anchor[1]); if(ad>2.5){ if(!u.path||!u.goal||dist(u.goal[0],u.goal[1],anchor[0],anchor[1])>2) this.goTo(u,anchor[0],anchor[1]); } else u.path=null; }
  }
  /* 任せる: いちばん深く来ている敵の「一つ先の線」で待ち受け、有利な相手を選んで戦う */
  autoPick(u,E){
    const T=TYPES[u.type],sp=T.speed,es=this.C.enemySpeed,self=this;
    const slack=e=>this.remain(e)/(TYPES[e.type].speed*es)-dist(u.x,u.z,e.x,e.z)*1.25/sp;
    /* 守る相手（攻め口）: 余裕がいちばん少ない敵。ほかの「任せる」部隊が向かっている攻め口は後回し。
       いったん決めたら、ずっと急ぐ敵が出るまで変えない（行ったり来たりしない） */
    let deep=null,dr=-1e9;
    for(const e of E) if(e.route&&e.state!=='rout'){ let crowd=0; for(const a of this.units) if(a!==u&&a.side==='ally'&&a.state!=='dead'&&a.state!=='rout'&&a.autoFor&&a.autoFor.route===e.route) crowd++;
      const r=-(slack(e)+crowd*35); if(r>dr){ dr=r; deep=e; } }
    const old=u.autoFor; if(old&&old.state!=='dead'&&old.state!=='gone'&&old.state!=='rout'&&deep&&deep!==old&&-dr>slack(old)-20) deep=old;
    if(deep&&deep.route!==(old&&old.route)){ /* 同じ攻め口の、いちばん先の敵 */ }
    u.autoFor=deep;
    if(!deep){ u.autoAnchor=null; u.autoTarget=null; return; }
    /* 待ち受ける場所: 内側の2本の線の配置場所のうち、その攻め口の道の上にあって、敵より先に着ける、いちばん外側の場所 */
    const r=deep.route,LS=this.lineS[r.id],nL=this.lines.length,innerFrom=Math.max(1,nL-1);
    const cand=[];
    for(const sl of this.slots){ if(sl.line<innerFrom) continue; const q=projRoute(r,sl.pos[0],sl.pos[1]); if(q.d>28) continue; if(q.s<deep.s-3) continue;
      let pref=0; if(T.melee&&sl.kind!=='gate') pref+=25; if(!T.melee&&sl.kind==='gate') pref+=20;
      const tU=dist(u.x,u.z,sl.pos[0],sl.pos[1])*1.3/sp,tE=(q.s-deep.s)/(TYPES[deep.type].speed*es);
      cand.push({sl,q,pref,ok:tU<tE+8}); }
    cand.sort((a,b)=>(b.ok-a.ok)||(a.q.s+a.pref*3)-(b.q.s+b.pref*3));
    let pick=cand.find(c=>c.ok)||cand.sort((a,b)=>b.q.s-a.q.s)[0];
    if(!pick){ /* 道の上に内側の配置場所がない: 本丸にいちばん近い配置場所 */ let bd=1e9; for(const sl of this.slots){ const q=projRoute(r,sl.pos[0],sl.pos[1]); const d=q.d+(r.len-q.s)*.5; if(d<bd){ bd=d; pick={sl}; } } }
    if(!u.autoSlot||u.autoSlot!==pick.sl){ if(!u.autoSlot||!u.autoKeep||this.time>u.autoKeep) { u.autoSlot=pick.sl; u.autoKeep=this.time+6; } }
    u.autoAnchor=[u.autoSlot.pos[0],u.autoSlot.pos[1]];
    /* 戦う相手: 待ち受ける場所の近くの、有利な敵 */
    let best=null,bs=-1e9;
    for(const e of E){ if(e.state==='rout') continue; const d=dist(u.autoAnchor[0],u.autoAnchor[1],e.x,e.z); if(d>(u.type==='kiba'?40:24)) continue;
      let s2=-d; if(BEATS[u.base]===e.base) s2+=30; if(BEATS[e.base]===u.base) s2-=40; if(s2>bs){ bs=s2; best=e; } }
    u.autoTarget=bs>-35?best:null;
  }
  thinkEnemy(u,A,dt){
    const T=TYPES[u.type];
    if(u.state==='rout'){ u.routT-=dt; const r=u.route; if(!u.path||!u.path.length) this.retreat(u); if(dist(u.x,u.z,r.pts[0][0],r.pts[0][1])<6||u.routT<-14){ u.state='gone'; this.stats.enemyRouted++; this.events.push({k:'gone',u}); } return; }
    const range=this.rangeOf(u);
    let near=null,nd=1e9; for(const a of A){ if(a.state==='rout') continue; const d=dist(u.x,u.z,a.x,a.z); if(d<nd){ nd=d; near=a; } }
    u.target=null;
    if(T.melee){
      if(near&&nd<=this.C.contact){ u.target=near; u.path=null; return; }
      /* 騎馬は近くの弓を狙って突撃、足軽は近くの部隊に向かう */
      let chase=null,cd=u.type==='kiba'?26:14; for(const a of A){ if(a.state==='rout') continue; const d=dist(u.x,u.z,a.x,a.z); const want=u.type==='kiba'?(a.base==='yumi'?d:d+12):d; if(want<cd){ cd=want; chase=a; } }
      if(chase){ u.target=chase; if(u.mode!=='chase'||this.stale(u,chase.x,chase.z,4)) this.goTo(u,chase.x,chase.z); u.mode='chase'; return; }
    } else {
      /* 弓: 射程に入ったら止まって射る。足軽を優先 */
      let tg=null,td=range; for(const a of A){ if(a.state==='rout') continue; let d=dist(u.x,u.z,a.x,a.z); if(d>range) continue; if(BEATS[u.base]===a.base) d-=10; if(d<td){ td=d; tg=a; } }
      if(tg){ u.target=tg; u.path=null; return; }
    }
    /* ルートを進む（道から外れていたら近い先の点へ戻る） */
    const r=u.route; const q=projRoute(r,u.x,u.z); if(q.d>6){ u.ri=Math.max(u.ri,q.i); const p=r.pts[Math.min(u.ri,r.pts.length-1)]; if(u.mode!=='return'||this.stale(u,p[0],p[1],3)) this.goTo(u,p[0],p[1]); u.mode='return'; }
    else { u.mode='route'; u.s=Math.max(u.s,q.s); while(u.ri<r.pts.length-1&&r.cum[u.ri]<=u.s+.5) u.ri++; u.path=[r.pts[u.ri]]; }
  }
  combat(all,dt){
    const C=this.C;
    for(const u of all){ u.hitBy.length=0; u.m0=u.morale; }
    for(const u of all){ u.engaged=false; }
    for(const u of all){
      if(u.state==='rout'||!u.target) continue; const t=u.target; if(t.state==='dead'||t.state==='gone'){ u.target=null; continue; }
      const T=TYPES[u.type],d=dist(u.x,u.z,t.x,t.z);
      let reach=T.melee?C.contact+.5:this.rangeOf(u); if(d>reach) continue;
      u.engaged=true; if(d<=C.contact+.5) t.engaged=true;
      let m=1; if(BEATS[u.base]===t.base) m=C.adv; else if(BEATS[t.base]===u.base) m=C.dis;
      let f=T.atk*m*(0.55+0.45*u.morale/100);
      if(u.side==='ally') f*=C.defAtk;
      const sui=this.bossSkill&&this.bossSkill.kind==='suigun';
      if(this.grid){ if(this.grid.waterAt(u.x,u.z)&&!(sui&&u.side==='enemy')) f*=.6; if(this.grid.wallAt(u.x,u.z)) f*=.5; }
      if(u.side==='ally'&&this.skill&&this.skill.kind==='akazonae'&&u.base==='kiba') f*=1+(this.skill.v||.2);
      if(u.side==='ally'&&this.skill&&this.skill.kind==='kyuba'&&(u.base==='yumi'||u.base==='kiba')) f*=1+(this.skill.v||.15);
      if(u.side==='enemy'&&this.bossSkill&&this.bossSkill.kind==='yumi3'&&u.base==='yumi') f*=1+(this.bossSkill.v||.25);
      if(u.side==='ally'&&this.skill&&this.skill.kind==='yari7'&&u.base==='yari') f*=1+(this.skill.v||.2);
      if(u.side==='ally'){ const sl=this.slotAt(u); if(sl&&sl.ambush) f*=sl.ambush; }   /* 伏兵の場所（松山城の隠門など） */
      if(this.buff(u,'yari')) f*=1.3; if(this.buff(u,'yumi')||this.buff(u,'teppo')) f*=1.8; if(this.buff(u,'kiba')) f*=1.5; if(u.kobuUntil>this.time) f*=1.2;
      if(this.buff(u,'kiba')&&d<=C.contact+.5&&!u.charged.has(t.id)){ u.charged.add(t.id); t.morale-=18; this.events.push({k:'chargeHit',u,t}); }
      if(!T.melee&&d<C.contact) f*=.5;                                         /* 弓が斬り合いに巻き込まれた */
      if(!T.melee){ const dh=u.y-t.y; if(dh>3) f*=1.2; }                       /* 高い所から射る */
      if(u.type==='kiba'&&this.inNarrow(u)) f*=.65;                            /* 狭い門では騎馬が弱い */
      if(t.state==='rout') f*=1.6;                                              /* 敗走中を追い討ち */
      if(u.side==='ally'&&this.skill&&this.skill.kind==='charge'&&u.base==='kiba'&&u.fightT<6) f*=1.35;
      u.fightT+=dt;
      let dmg=u.men*C.K*f*dt/TYPES[t.type].def;
      if(t.side==='ally'&&this.skill&&this.skill.kind==='kengo'&&this.slotAt(t)) dmg*=1-(this.skill.v||.2);
      if(this.buff(t,'yari')) dmg*=.6;
      if(t.side==='ally') dmg*=C.defTake;
      if(this.grid){ if(this.grid.waterAt(t.x,t.z)&&!(sui&&t.side==='enemy')) dmg*=1.3; if(this.grid.wallAt(t.x,t.z)) dmg*=1.5; }
      t.dmg=(t.dmg||0)+dmg; t.hitBy.push(u);
      if(!T.melee){ u.cool-=dt; if(u.cool<=0){ u.cool=1.1+Math.random()*.4; this.events.push({k:'volley',a:u,b:t}); } }
    }
    for(const u of all){ if(!u.engaged) u.fightT=0; }
    /* 損害と士気 */
    for(const u of all){
      if(u.state==='dead'||u.state==='gone') continue;
      const yama=u.boss&&this.bossSkill&&this.bossSkill.kind==='yama';
      const lost=Math.min(u.men,u.dmg||0); u.dmg=0;
      if(lost>0){ u.menF=(u.menF===undefined?u.men:u.menF)-lost; const nm=Math.max(0,Math.ceil(u.menF-1e-6)); const k=u.men-nm; u.men=nm;
        if(u.side==='ally') this.stats.allyLost+=k; else this.stats.enemyLost+=k;
        u.morale-=lost/Math.max(30*C.menScale,u.men0)*100*0.9; }
      if(u.state!=='rout'){
        if(u.hitBy.length){
          if(u.hitBy.some(a=>BEATS[a.base]===u.base)) u.morale-=1.6*dt;              /* 不利な相性 */
          if(this.flanked(u)) { u.morale-=3.2*dt; u.flank=true; } else u.flank=false;  /* 挟み撃ち */
        } else if(!u.engaged){ u.morale=Math.min(100,u.morale+2*dt); u.flank=false; }
      }
      if(u.men<=0){ u.state='dead'; u.men=0; this.events.push({k:'dead',u}); if(u.boss) this.bossDown(u); continue; }
      if(yama&&u.morale<u.m0) u.morale=u.m0-(u.m0-u.morale)*.5;
      /* 士気が下がりにくい特技（味方: 井伊の赤備え／敵: 大一大万大吉） */
      if(u.morale<u.m0&&((u.side==='ally'&&this.skill&&this.skill.kind==='akazonae')||(u.side==='enemy'&&this.bossSkill&&this.bossSkill.kind==='daiichi'))) u.morale=u.m0-(u.m0-u.morale)*.85;
      if(u.morale<=0&&u.state!=='rout'){ u.morale=0; u.state='rout'; u.routT=C.routTime; u.target=null; this.events.push({k:'rout',u});
        if(u.side==='ally'){ const sl=this.retreatSlot(u); this.goTo(u,sl.pos[0],sl.pos[1]); u.order={kind:'hold',x:sl.pos[0],z:sl.pos[1],slot:sl}; }
        else { this.retreat(u); if(u.boss) this.bossDown(u); } }
    }
  }
  flanked(u){ if(u.hitBy.length<2) return false; for(let i=0;i<u.hitBy.length;i++) for(let j=i+1;j<u.hitBy.length;j++){ const a=u.hitBy[i],b=u.hitBy[j]; const a1=Math.atan2(a.x-u.x,a.z-u.z),a2=Math.atan2(b.x-u.x,b.z-u.z); let d=Math.abs(a1-a2); if(d>Math.PI) d=2*Math.PI-d; if(d>Math.PI*.55) return true; } return false; }
  bossDown(u){ if(this.bossFell) return; this.bossFell=true; this.events.push({k:'bossdown',u}); for(const e of this.live('enemy')) if(e!==u) e.morale-=30; }
  moveAll(all,dt){
    for(const u of all){
      u.moving=false; if(u.state==='dead'||u.state==='gone') continue;
      if(u.side==='enemy') u.atGate=null;
      if(this.buff(u,'yari')){ if(u.target) this.face(u,u.target); continue; }
      if(u.engaged&&!u.moveFire&&u.state!=='rout'&&!(u.target&&dist(u.x,u.z,u.target.x,u.target.z)>this.C.contact+.5)) { this.face(u,u.target); continue; }
      if(!u.path||!u.path.length){ if(u.target) this.face(u,u.target); continue; }
      const T=TYPES[u.type]; let sp=T.speed*(u.speedMul||1)*(u.state==='rout'?1.25:1)*(u.side==='enemy'?this.C.enemySpeed:1);
      if(u.type==='kiba'&&this.inNarrow(u)) sp*=.6;
      if(this.buff(u,'kiba')) sp*=1.4; if(u.slowUntil>this.time) sp*=.45;
      if(this.grid){ const w=this.grid.waterAt(u.x,u.z),c=this.grid.wallAt(u.x,u.z); if(w&&!(u.side==='enemy'&&this.bossSkill&&this.bossSkill.kind==='suigun')) sp*=this.C.waterSpeed; if(c) sp*=this.C.wallSpeed;
        if(u.side==='enemy'&&w&&!u.wet){ u.wet=true; this.events.push({k:'moat',u}); } if(u.side==='enemy'&&c&&!u.climb){ u.climb=true; this.events.push({k:'climb',u}); } }
      let left=sp*dt;
      while(left>0&&u.path.length){ const [tx,tz]=u.path[0],d=dist(u.x,u.z,tx,tz); if(d<.3){ u.path.shift(); continue; }
        const st=Math.min(left,d,1.2),nx=u.x+(tx-u.x)/d*st,nz=u.z+(tz-u.z)/d*st,nh=this.h(nx,nz);
        /* 急な斜面では遅くなる */
        const slope=Math.abs(nh-u.y)/st; const f=clamp(1-Math.max(0,slope-.35)*1.4,.3,1);
        const adv=st*f; const ax=u.x+(tx-u.x)/d*adv,az=u.z+(tz-u.z)/d*adv;
        if(this.grid&&this.grid.blockedAt(ax,az,u.side)&&!this.grid.blockedAt(u.x,u.z,u.side)) break;
        if(u.side==='enemy'&&u.state!=='rout'){ const g=this.gateBlock(u,ax,az); if(g){ u.atGate=g; this.face(u,{x:g.pos[0],z:g.pos[1]}); break; } }
        u.heading=Math.atan2(tx-u.x,tz-u.z); u.x=ax; u.z=az; u.y=this.h(ax,az); left-=st; u.moving=true; }
    }
  }
  /* ---------- 特技と策 ---------- */
  buff(u,k){ return u.buff&&u.buff.kind===k&&this.time<u.buff.until; }
  skillOf(u){ return SKILLS[u.type]||SKILLS[u.base]; }
  skillWait(u){ return Math.max(0,(u.skillReady||0)-this.time); }
  useSkill(id){ const u=this.unit(id); if(!u||u.side!=='ally'||u.state==='dead'||u.state==='rout'||this.skillWait(u)>0) return false;
    const S=this.skillOf(u); u.buff={kind:u.type,until:this.time+S.dur}; u.skillReady=this.time+S.cd;
    if(u.base==='yari'){ u.path=null; u.order={kind:'hold',x:u.x,z:u.z,slot:this.slotAt(u)}; }
    if(u.type==='kiba') u.charged=new Set();
    this.events.push({k:'skill',u,name:S.name}); return true; }
  canSaku(k){ return this.saihai>=SAKU[k].cost; }
  useSaku(k,a){ const S=SAKU[k]; if(!S||this.saihai<S.cost) return false;
    if(k==='kobu'){ const t=this.unit(a.target); if(!t||t.side!=='ally'||t.state==='dead') return false;
      if(t.state==='rout'){ t.state='idle'; t.morale=55; t.path=null; t.order={kind:'hold',x:t.x,z:t.z,slot:this.slotAt(t)}; this.events.push({k:'rally',u:t}); } else t.morale=Math.min(100,t.morale+40);
      t.kobuUntil=this.time+15; }
    else if(k==='rakuseki'){ this.rocks.push({x:a.x,z:a.z,t:this.time+.9,r:11}); }
    else if(k==='gate'){ const g=this.gates[a.gate]; if(!g||(g.until>this.time&&g.hp>0)) return false; g.until=this.time+this.C.gateTime; g.hp=this.C.gateHP; }
    else return false;
    this.saihai-=S.cost; this.events.push({k:'saku',kind:k,a}); return true; }
  updRocks(){ for(let i=this.rocks.length-1;i>=0;i--){ const R=this.rocks[i]; if(this.time<R.t) continue; this.rocks.splice(i,1); let hits=0;
    for(const e of this.live('enemy')){ const d=dist(e.x,e.z,R.x,R.z); if(d>R.r) continue; hits++; const k=1-d/R.r*.5; e.dmg=(e.dmg||0)+(e.men*.13+18*this.C.menScale)*k; e.morale-=25*k; e.slowUntil=this.time+8; }
    this.events.push({k:'rock',x:R.x,z:R.z,r:R.r,hits}); } }
  updGates(dt){ for(const g of this.gates){ if(!(g.until>0)) continue;
    if(g.hp<=0){ g.until=0; this.events.push({k:'gateBroken',g}); continue; }
    if(this.time>=g.until){ g.until=0; g.hp=0; this.events.push({k:'gateOpen',g}); continue; }
    for(const e of this.live('enemy')) if(e.atGate===g&&!e.engaged) g.hp-=e.men/this.C.menScale*TYPES[e.type].atk*(TYPES[e.type].melee?.016:.006)*dt; } }
  gateOpenAt(g){ return !(g.until>this.time&&g.hp>0); }
  gateBlock(u,nx,nz){ for(const g of this.gates){ if(this.gateOpenAt(g)) continue; const d0=dist(u.x,u.z,g.pos[0],g.pos[1]),d1=dist(nx,nz,g.pos[0],g.pos[1]); if(d1<g.r+3&&d1<d0) return g; } return null; }
  face(u,t){ if(t) u.heading=Math.atan2(t.x-u.x,t.z-u.z); }
  separate(L){ for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const a=L[i],b=L[j]; const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=4.5; if(d<m&&d>1e-4){ const p=(m-d)/2*.5,ux=dx/d,uz=dz/d; this.nudge(a,-ux*p,-uz*p); this.nudge(b,ux*p,uz*p); } else if(d<=1e-4){ b.x+=.5; } } }
  /* 敗走した敵は城の中を抜けず、来た道（進軍ルート）をさかのぼって引き返す */
  retreat(u){ const r=u.route,q=projRoute(r,u.x,u.z),P=[];
    if(q.d>4){ const p=r.pts[Math.max(0,q.i-1)]; const g=this.pathFor(u.x,u.z,p[0],p[1],'enemy'); for(const v of g) P.push(v); }
    for(let i=q.i-1;i>=0;i--) P.push(r.pts[i]); u.path=P; u.goal=r.pts[0]; }
  nudge(u,dx,dz){ const x=u.x+dx,z=u.z+dz; if(this.grid&&this.grid.blockedAt(x,z,u.side)&&!this.grid.blockedAt(u.x,u.z,u.side)) return; u.x=x; u.z=z; }
  checkEnd(){
    /* どこまで押されたか */
    let br=0; for(const e of this.live('enemy')){ if(!e.route) continue; const L=this.lineS[e.route.id]; for(let i=0;i<L.length;i++) if(L[i]!==null&&e.s>L[i]+3) br=Math.max(br,i+1); }
    if(br>this.breached){ this.breached=br; this.events.push({k:'line',i:br,name:this.lines[br-1].name}); }
    const HS=[].concat(this.map.honmaru);   /* 本丸は1つの四角か、四角の並び */
    for(const e of this.live('enemy')) if(e.state!=='rout'&&HS.some(H=>e.x>H.x0&&e.x<H.x1&&e.z>H.z0&&e.z<H.z1)){ this.end('lose','本丸に敵が入った'); return; }
    if(this.time>=this.duration){ this.end('win',this.map.winText||'守り抜いた'); return; }
    const allSpawned=this.waves.every(w=>w.spawned)&&!this.spawnQ.length;
    if(allSpawned&&!this.live('enemy').length){ this.end('win','敵は兵を引いた'); return; }
    if(!this.live('ally').some(u=>u.men>0)){ this.end('lose','味方の部隊がすべて崩れた'); }
  }
  end(r,why){ this.state=r; this.why=why; this.events.push({k:'end',r,why}); }
  /* 結果（成長の計算に使う） */
  result(){ const A=this.units.filter(u=>u.side==='ally'); return {state:this.state,why:this.why,time:this.time,army:A.map(u=>({id:u.armyId,gen:u.gen,name:u.name,type:u.base==='yumi'&&u.type==='teppo'?'yumi':u.type,men0:u.men0,men:u.men})),
    allyMen0:this.stats.allyMen0,allyLost:this.stats.allyLost,enemyMen:this.stats.enemyMen,enemyLost:this.stats.enemyLost,breached:this.breached}; }
}

/* ---------- 部隊数と自動編成 ----------
   部隊の数 ＝ 城の門（入口）の数 ＋ 3（最低の部隊数）。兵は総数を兵種の割合で自動で分ける（足軽4割・弓3割強・騎馬2割半） */
const MIN_UNITS=3, MIX={yari:.42,yumi:.33,kiba:.25};
function capOf(map){ return (map.gates?map.gates.length:1)+(map.minUnits||MIN_UNITS); }
function formArmy(map,total,opt){
  opt=opt||{}; const N=capOf(map),rd=v=>Math.max(50*DEF.menScale,Math.round(v/10)*10);
  let kiba=Math.max(1,Math.round(N*.25)),yari=Math.max(1,Math.round(N*.4)); let yumi=Math.max(1,N-kiba-yari); while(yari+yumi+kiba>N){ if(yari>=yumi&&yari>1) yari--; else if(yumi>1) yumi--; else kiba--; }
  const cnt={yari,yumi,kiba},gen=(map.general&&map.general.name)||'',army=[],used={};
  const NM={yari:['足軽二番組','足軽三番組','足軽四番組','足軽五番組'],yumi:['弓組','弓二番組','弓三番組','弓四番組'],kiba:['騎馬組','騎馬二番組','騎馬三番組']};
  for(const t of ['yari','yumi','kiba']) for(let i=0;i<cnt[t];i++){ const first=t==='yari'&&i===0;
    army.push({id:t+(i+1),type:t,men:rd(total*MIX[t]/cnt[t]),gen:first?gen:'',name:first?(gen?gen.replace(/^.*?(..)$/,'$1')+'本隊':'本隊'):NM[t][first?0:(t==='yari'?i-1:i)]}); }
  /* 配置: 設定データの deploy（兵種ごとの場所の順）→ 空いている配置場所（足軽・騎馬は門、弓は櫓・石垣。内側の線から） */
  const D=map.deploy||{},taken={},cnt2={};
  for(const a of army){ const L=D[a.type]||[]; const k=cnt2[a.type]=(cnt2[a.type]||0); let sl=L[k];
    if(!sl||taken[sl]){ const want=a.type==='yumi'?['yagura','ishigaki']:['gate']; const c=map.slots.filter(s=>!taken[s.id]).sort((p,q)=>(want.includes(q.kind)-want.includes(p.kind))||(q.line-p.line)); sl=(c[0]||map.slots[0]).id; }
    a.dx=(taken[sl]||0)*5; taken[sl]=(taken[sl]||0)+1; a.slot=sl; cnt2[a.type]++; }
  return army;
}

/* ---------- 成長（レベルアップなし。率いる兵数が増える） ----------
   ・減った兵は次の合戦に持ち越す
   ・次の合戦の前に、後詰め（援軍）として「合戦前の総兵数の reinf 割」が加わる
   ・損害が bonusLoss 以下なら、ほうびの後詰め（総兵数の bonus 割）がさらに加わる
   ・次の城では、総兵数を「門の数＋3」部隊に自動で分け直す */
const GROW={reinf:.3,bonusLoss:.2,bonus:.15,round:10};
function nextArmy(res,nextMap,opt){
  opt=Object.assign({},GROW,opt||{});
  const rd=v=>Math.round(v/opt.round)*opt.round, lossRate=res.allyMen0?res.allyLost/res.allyMen0:1;
  const left=res.army.reduce((s,a)=>s+a.men,0), reinf=rd(res.allyMen0*opt.reinf);
  const bonus=res.state==='win'&&lossRate<=opt.bonusLoss?rd(res.allyMen0*opt.bonus):0;
  const total=left+reinf+bonus, notes=[];
  if(bonus) notes.push('損害が'+Math.round(opt.bonusLoss*100)+'%以下だったので、ほうびの後詰め '+bonus+'人が加わる');
  const N=nextMap?capOf(nextMap):null;
  return {lossRate,left,reinf,bonus,total,N,notes,army:res.army};
}

/* 設定データの army（直接遊んだときの軍勢）の総兵数。兵数の倍率をかける */
const baseArmy=map=>map.army.reduce((t,a)=>t+a.men,0)*DEF.menScale;
const API={TYPES,BEATS,SKILLS,SAKU,DEF,Battle,Grid,buildNav,navPath,projRoute,nextArmy,capOf,formArmy,GROW,MIN_UNITS,baseOf,baseArmy};
if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.OshiroBattleSim=API;
})(typeof window!=='undefined'?window:globalThis);
