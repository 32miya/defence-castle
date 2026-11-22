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
const BEATS={yari:'kiba',kiba:'yumi',yumi:'yari'};   /* 足軽→騎馬、騎馬→弓、弓→足軽 に強い */
const baseOf=t=>(TYPES[t]&&TYPES[t].base)||t;

const DEF={
  adv:1.5, dis:0.6,          /* ダメージ倍率（有利・不利） */
  K:0.013,                   /* 1人が1秒に倒す人数の基準 */
  contact:7,                 /* 白兵戦の間合い（部隊の中心どうし, m） */
  tick:0.1,                  /* 計算の刻み（秒） */
  menPerFigure:100,          /* 表示: 兵100人につき兵士1体 */
  routTime:12,               /* 敗走している時間 */
  rallyMorale:35,            /* 敗走から立ち直ったときの士気 */
  enemySpeed:.8              /* 攻め手は用心して進む（味方より遅い） */
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
    this.enemyScale=opt.enemyScale||1;
    this.routes={}; for(const r of map.routes) this.routes[r.id]=prepRoute(Object.assign({},r));
    this.slots=map.slots.map(s=>Object.assign({},s));
    this.nav=buildNav(map);
    this.lines=map.lines; this.breached=0;
    /* 防衛線がルートのどこにあたるか */
    this.lineS={}; for(const id in this.routes){ const r=this.routes[id]; this.lineS[id]=this.lines.map(L=>{ let s=null; for(const p of L.pts){ const q=projRoute(r,p[0],p[1]); if(q.d<15) s=s===null?q.s:Math.min(s,q.s); } return s; }); }
    this.waves=(opt.waves||map.enemy.waves).map((w,i)=>Object.assign({i,spawned:false},w));
    this.waveNow=-1; this.spawnQ=[];
    this.skill=(map.general&&map.general.skill)||null;
    this.bossSkill=(map.enemy.boss&&map.enemy.boss.skill)||null;
    this.stats={allyMen0:0,allyLost:0,enemyMen:0,enemyLost:0,enemyRouted:0};
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
  mkUnit(side,type,men,x,z,name){ const u={id:this.nextId++,side,type,base:baseOf(type),name,men,men0:men,morale:100,x,z,px:x,pz:z,y:this.h(x,z),heading:side==='enemy'?0:Math.PI,
      state:'idle',path:null,order:null,target:null,engaged:false,hitBy:[],kills:0,fightT:0,routT:0,cool:Math.random(),moving:false,slot:null,s:0,ri:1};
    this.units.push(u); return u; }
  spawnEnemy(e,wave){
    const r=this.routes[e.route],p0=r.pts[0],p1=r.pts[1],ang=Math.atan2(p1[0]-p0[0],p1[1]-p0[1]);
    const u=this.mkUnit('enemy',e.type,Math.round(e.men*this.enemyScale),p0[0],p0[1],e.name||TYPES[e.type].name);
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
  goTo(u,x,z){ u.path=navPath(this.nav,u.x,u.z,x,z,this.h); u.goal=[x,z]; }

  /* ---------- 進める ---------- */
  step(dt){ if(this.state!=='run') return; this.acc+=dt; const T=this.C.tick; let n=0; while(this.acc>=T&&n<20){ this.acc-=T; this.tick(T); n++; } if(n>=20) this.acc=0; }
  tick(dt){
    for(const u of this.units){ u.px=u.x; u.pz=u.z; }
    this.time+=dt;
    this.spawnWaves(dt);
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
      u.target=t; const d=dist(u.x,u.z,t.x,t.z); if(d>(T.melee?this.C.contact:range*.9)){ if(!u.path||!u.goal||dist(u.goal[0],u.goal[1],t.x,t.z)>6) this.goTo(u,t.x,t.z); } else u.path=null; return; }
    else if(o.kind==='auto'){ u.aiT=(u.aiT||0)-dt; if(u.aiT<=0){ u.aiT=1.5; this.autoPick(u,E); } anchor=u.autoAnchor||[u.home.pos[0],u.home.pos[1]]; }
    /* 守備・援軍・任せる: 近くの敵と戦う */
    const leash=T.melee?(u.type==='kiba'?22:14):range;
    let t=(o.kind==='auto'&&u.autoTarget&&u.autoTarget.state!=='dead'&&u.autoTarget.state!=='gone'&&dist(u.autoTarget.x,u.autoTarget.z,anchor[0],anchor[1])<55)?u.autoTarget:nearestE(anchor[0],anchor[1],T.melee?leash:range,true);
    if(!T.melee){ /* 弓: 動かずに射る（射程の外の敵は、任せるときだけ寄る） */
      const inR=nearestE(u.x,u.z,range,true); u.target=inR;
      const ad=dist(u.x,u.z,anchor[0],anchor[1]);
      if(!inR&&o.kind==='auto'&&t){ if(!u.path||!u.goal||dist(u.goal[0],u.goal[1],t.x,t.z)>10) this.goTo(u,t.x,t.z); }
      else if(inR){ u.path=null; }
      else if(ad>2.5){ if(!u.path||!u.goal||dist(u.goal[0],u.goal[1],anchor[0],anchor[1])>2) this.goTo(u,anchor[0],anchor[1]); }
      return; }
    if(t){ u.target=t; const d=dist(u.x,u.z,t.x,t.z); if(d>this.C.contact*.9){ if(!u.path||!u.goal||dist(u.goal[0],u.goal[1],t.x,t.z)>5) this.goTo(u,t.x,t.z); } else u.path=null; }
    else { u.target=null; const ad=dist(u.x,u.z,anchor[0],anchor[1]); if(ad>2.5){ if(!u.path||!u.goal||dist(u.goal[0],u.goal[1],anchor[0],anchor[1])>2) this.goTo(u,anchor[0],anchor[1]); } else u.path=null; }
  }
  /* 任せる: いちばん深く来ている敵の「一つ先の線」で待ち受け、有利な相手を選んで戦う */
  autoPick(u,E){
    const T=TYPES[u.type];
    let deep=null,dr=-1; for(const e of E) if(e.route&&e.state!=='rout'){ const r=e.s/e.route.len; if(r>dr){ dr=r; deep=e; } }
    if(!deep){ u.autoAnchor=null; u.autoTarget=null; return; }
    const LS=this.lineS[deep.route.id]; let li=LS.length-1; for(let i=0;i<LS.length;i++) if(LS[i]!==null&&LS[i]>deep.s-2){ li=i; break; }
    const want=li+1; let b=null,bd=1e9;
    for(const s of this.slots){ if(s.line!==want&&s.line!==want+1) continue; const lp=this.lines[s.line-1].pts; let d=Math.min(...lp.map(p=>dist(p[0],p[1],s.pos[0],s.pos[1])));
      if(s.line!==want) d+=25; if(T.melee&&s.kind!=='gate') d+=20; if(!T.melee&&s.kind==='gate') d+=18; const q=projRoute(deep.route,s.pos[0],s.pos[1]); d+=q.d*.6; if(d<bd){ bd=d; b=s; } }
    u.autoAnchor=b?[b.pos[0],b.pos[1]]:null;
    let best=null,bs=-1e9;
    for(const e of E){ if(e.state==='rout') continue; const ax=u.autoAnchor?u.autoAnchor[0]:u.x,az=u.autoAnchor?u.autoAnchor[1]:u.z,d=dist(ax,az,e.x,e.z); if(d>(u.type==='kiba'?45:28)) continue;
      let s=-d; if(BEATS[u.base]===e.base) s+=30; if(BEATS[e.base]===u.base) s-=40; if(s>bs){ bs=s; best=e; } }
    u.autoTarget=bs>-35?best:null;
  }
  thinkEnemy(u,A,dt){
    const T=TYPES[u.type];
    if(u.state==='rout'){ u.routT-=dt; const r=u.route; if(!u.path||!u.path.length) u.path=[r.pts[0]]; if(dist(u.x,u.z,r.pts[0][0],r.pts[0][1])<6||u.routT<-14){ u.state='gone'; this.stats.enemyRouted++; this.events.push({k:'gone',u}); } return; }
    const range=this.rangeOf(u);
    let near=null,nd=1e9; for(const a of A){ if(a.state==='rout') continue; const d=dist(u.x,u.z,a.x,a.z); if(d<nd){ nd=d; near=a; } }
    u.target=null; u.path=null;
    if(T.melee){
      if(near&&nd<=this.C.contact){ u.target=near; return; }
      /* 騎馬は近くの弓を狙って突撃、足軽は近くの部隊に向かう */
      let chase=null,cd=u.type==='kiba'?26:14; for(const a of A){ if(a.state==='rout') continue; const d=dist(u.x,u.z,a.x,a.z); const want=u.type==='kiba'?(a.base==='yumi'?d:d+12):d; if(want<cd){ cd=want; chase=a; } }
      if(chase){ u.target=chase; u.path=[[chase.x,chase.z]]; return; }
    } else {
      /* 弓: 射程に入ったら止まって射る。足軽を優先 */
      let tg=null,td=range; for(const a of A){ if(a.state==='rout') continue; let d=dist(u.x,u.z,a.x,a.z); if(d>range) continue; if(BEATS[u.base]===a.base) d-=10; if(d<td){ td=d; tg=a; } }
      if(tg){ u.target=tg; return; }
    }
    /* ルートを進む（道から外れていたら近い先の点へ戻る） */
    const r=u.route; const q=projRoute(r,u.x,u.z); if(q.d>6){ u.ri=Math.max(u.ri,q.i); u.path=[r.pts[Math.min(u.ri,r.pts.length-1)]]; }
    else { u.s=Math.max(u.s,q.s); while(u.ri<r.pts.length-1&&r.cum[u.ri]<=u.s+.5) u.ri++; u.path=[r.pts[u.ri]]; }
  }
  combat(all,dt){
    const C=this.C;
    for(const u of all) u.hitBy.length=0;
    for(const u of all){ u.engaged=false; }
    for(const u of all){
      if(u.state==='rout'||!u.target) continue; const t=u.target; if(t.state==='dead'||t.state==='gone'){ u.target=null; continue; }
      const T=TYPES[u.type],d=dist(u.x,u.z,t.x,t.z);
      let reach=T.melee?C.contact+.5:this.rangeOf(u); if(d>reach) continue;
      u.engaged=true; if(d<=C.contact+.5) t.engaged=true;
      let m=1; if(BEATS[u.base]===t.base) m=C.adv; else if(BEATS[t.base]===u.base) m=C.dis;
      let f=T.atk*m*(0.55+0.45*u.morale/100);
      if(!T.melee&&d<C.contact) f*=.5;                                         /* 弓が斬り合いに巻き込まれた */
      if(!T.melee){ const dh=u.y-t.y; if(dh>3) f*=1.2; }                       /* 高い所から射る */
      if(u.type==='kiba'&&this.inNarrow(u)) f*=.65;                            /* 狭い門では騎馬が弱い */
      if(t.state==='rout') f*=1.6;                                              /* 敗走中を追い討ち */
      if(u.side==='ally'&&this.skill&&this.skill.kind==='charge'&&u.base==='kiba'&&u.fightT<6) f*=1.35;
      u.fightT+=dt;
      let dmg=u.men*C.K*f*dt/TYPES[t.type].def;
      if(t.side==='ally'&&this.skill&&this.skill.kind==='kengo'&&this.slotAt(t)) dmg*=1-(this.skill.v||.2);
      t.dmg=(t.dmg||0)+dmg; t.hitBy.push(u);
      if(!T.melee){ u.cool-=dt; if(u.cool<=0){ u.cool=1.1+Math.random()*.4; this.events.push({k:'volley',a:u,b:t}); } }
    }
    for(const u of all){ if(!u.engaged) u.fightT=0; }
    /* 損害と士気 */
    for(const u of all){
      if(u.state==='dead'||u.state==='gone') continue;
      const lost=Math.min(u.men,u.dmg||0); u.dmg=0;
      if(lost>0){ u.menF=(u.menF===undefined?u.men:u.menF)-lost; const nm=Math.max(0,Math.ceil(u.menF-1e-6)); const k=u.men-nm; u.men=nm;
        if(u.side==='ally') this.stats.allyLost+=k; else this.stats.enemyLost+=k;
        u.morale-=lost/Math.max(30,u.men0)*100*0.9; }
      if(u.state!=='rout'){
        if(u.hitBy.length){
          if(u.hitBy.some(a=>BEATS[a.base]===u.base)) u.morale-=1.6*dt;              /* 不利な相性 */
          if(this.flanked(u)) { u.morale-=3.2*dt; u.flank=true; } else u.flank=false;  /* 挟み撃ち */
        } else if(!u.engaged){ u.morale=Math.min(100,u.morale+2*dt); u.flank=false; }
      }
      if(u.men<=0){ u.state='dead'; u.men=0; this.events.push({k:'dead',u}); if(u.boss) this.bossDown(u); continue; }
      if(u.morale<=0&&u.state!=='rout'){ u.morale=0; u.state='rout'; u.routT=C.routTime; u.target=null; this.events.push({k:'rout',u});
        if(u.side==='ally'){ const sl=this.retreatSlot(u); this.goTo(u,sl.pos[0],sl.pos[1]); u.order={kind:'hold',x:sl.pos[0],z:sl.pos[1],slot:sl}; }
        else { u.path=[u.route.pts[0]]; if(u.boss) this.bossDown(u); } }
    }
  }
  flanked(u){ if(u.hitBy.length<2) return false; for(let i=0;i<u.hitBy.length;i++) for(let j=i+1;j<u.hitBy.length;j++){ const a=u.hitBy[i],b=u.hitBy[j]; const a1=Math.atan2(a.x-u.x,a.z-u.z),a2=Math.atan2(b.x-u.x,b.z-u.z); let d=Math.abs(a1-a2); if(d>Math.PI) d=2*Math.PI-d; if(d>Math.PI*.55) return true; } return false; }
  bossDown(u){ if(this.bossFell) return; this.bossFell=true; this.events.push({k:'bossdown',u}); for(const e of this.live('enemy')) if(e!==u) e.morale-=30; }
  moveAll(all,dt){
    for(const u of all){
      u.moving=false; if(u.state==='dead'||u.state==='gone') continue;
      if(u.engaged&&u.state!=='rout'&&!(u.target&&dist(u.x,u.z,u.target.x,u.target.z)>this.C.contact+.5)) { this.face(u,u.target); continue; }
      if(!u.path||!u.path.length){ if(u.target) this.face(u,u.target); continue; }
      const T=TYPES[u.type]; let sp=T.speed*(u.speedMul||1)*(u.state==='rout'?1.25:1)*(u.side==='enemy'?this.C.enemySpeed:1);
      if(u.type==='kiba'&&this.inNarrow(u)) sp*=.6;
      let left=sp*dt;
      while(left>0&&u.path.length){ const [tx,tz]=u.path[0],d=dist(u.x,u.z,tx,tz); if(d<.3){ u.path.shift(); continue; }
        const st=Math.min(left,d,1.2),nx=u.x+(tx-u.x)/d*st,nz=u.z+(tz-u.z)/d*st,nh=this.h(nx,nz);
        /* 急な斜面では遅くなる */
        const slope=Math.abs(nh-u.y)/st; const f=clamp(1-Math.max(0,slope-.35)*1.4,.3,1);
        const adv=st*f; const ax=u.x+(tx-u.x)/d*adv,az=u.z+(tz-u.z)/d*adv;
        u.heading=Math.atan2(tx-u.x,tz-u.z); u.x=ax; u.z=az; u.y=this.h(ax,az); left-=st; u.moving=true; }
    }
  }
  face(u,t){ if(t) u.heading=Math.atan2(t.x-u.x,t.z-u.z); }
  separate(L){ for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const a=L[i],b=L[j]; const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=4.5; if(d<m&&d>1e-4){ const p=(m-d)/2*.5,ux=dx/d,uz=dz/d; a.x-=ux*p; a.z-=uz*p; b.x+=ux*p; b.z+=uz*p; } else if(d<=1e-4){ b.x+=.5; } } }
  checkEnd(){
    /* どこまで押されたか */
    let br=0; for(const e of this.live('enemy')){ if(!e.route) continue; const L=this.lineS[e.route.id]; for(let i=0;i<L.length;i++) if(L[i]!==null&&e.s>L[i]+3) br=Math.max(br,i+1); }
    if(br>this.breached){ this.breached=br; this.events.push({k:'line',i:br,name:this.lines[br-1].name}); }
    const H=this.map.honmaru;
    for(const e of this.live('enemy')) if(e.state!=='rout'&&e.x>H.x0&&e.x<H.x1&&e.z>H.z0&&e.z<H.z1){ this.end('lose','本丸に敵が入った'); return; }
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

/* ---------- 成長（レベルアップなし。率いる兵数が増える） ----------
   ・減った兵は次の合戦に持ち越す
   ・次の合戦の開始時、後詰め（援軍）として各部隊に「合戦前の兵数の reinf 割」を補充
   ・損害が bonusLoss 以下ならボーナスで部隊が1つ増える（兵種は少ないものから自動）
   ・部隊数が次の城の上限を超える分は、既存の部隊の兵数に足す */
const GROW={reinf:.3,bonusLoss:.2,round:10};
function capOf(map){ return (map.gates?map.gates.length:1)+(map.capBonus||0); }
function nextArmy(res,cap,opt){
  opt=Object.assign({},GROW,opt||{});
  const lossRate=res.allyMen0?res.allyLost/res.allyMen0:1;
  const rd=v=>Math.round(v/opt.round)*opt.round;
  let army=res.army.map(a=>({id:a.id,gen:a.gen,name:a.name,type:a.type,men:a.men,left:a.men,join:0,reinf:a.men>0?rd(a.men0*opt.reinf):0})).filter(a=>a.men>0);
  const notes=[];
  let bonus=null;
  if(res.state==='win'&&lossRate<=opt.bonusLoss&&army.length){
    const cnt={yari:0,yumi:0,kiba:0}; for(const a of army) cnt[a.type]=(cnt[a.type]||0)+1;
    const type=Object.keys(cnt).sort((a,b)=>cnt[a]-cnt[b])[0];
    const men=rd(res.allyMen0/res.army.length*.6);
    bonus={id:'b'+Date.now().toString(36),gen:'',name:'新手の'+TYPES[type].name,type,men,reinf:0,isNew:true};
    army.push(bonus); notes.push('損害が'+Math.round(opt.bonusLoss*100)+'%以下だったので、新しい部隊（'+TYPES[type].name+'）が加わる');
  }
  while(army.length>cap){ const ex=army.pop(); const per=Math.floor(ex.men/army.length/opt.round)*opt.round; let rest=ex.men; for(const a of army){ a.men+=per; a.join+=per; rest-=per; } army[0].men+=rest; army[0].join+=rest; notes.push('部隊の上限（'+cap+'）を超えた分の兵は、他の部隊に加わる'); }
  for(const a of army){ a.menNext=a.men+a.reinf; }
  return {lossRate,army,notes,bonus};
}
const API={TYPES,BEATS,DEF,Battle,buildNav,navPath,projRoute,nextArmy,capOf,GROW,baseOf};
if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.OshiroBattleSim=API;
})(typeof window!=='undefined'?window:globalThis);
