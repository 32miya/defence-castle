/* 合戦のバランス確認（node tools/balance.js [-v] [idle,auto,play]）
   idle=何もしない / auto=全部隊「任せる」 / play=簡単な人間らしい操作。地形は index.html から取り出す */
const S=require('../battle/sim.js');
const MAP=require('../battle/maps/'+(process.env.MAP||'inuyama')+'.js');
const MAPID=process.env.MAP||'inuyama'; const ENV=MAPID==='inuyama'?null:require('./env/'+MAPID+'.js'); const T=ENV?{groundH0:ENV.h}:require('./terrain.js');
function run(mode,seed){ let s=seed||1; Math.random=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
  const b=new S.Battle(MAP,{army:S.formArmy(MAP,MAP.army.reduce((t,a)=>t+a.men,0)),h:T.groundH0,block:ENV&&ENV.block,water:ENV&&ENV.water,floor:ENV&&ENV.floor}); const log=[];
  if(mode==='auto') for(const u of b.live('ally')) b.order(u.id,{kind:'auto'});
  let lastT=0;
  while(b.state==='run'&&b.time<600){ b.step(0.1);
    if((mode==='play'||mode==='play2')&&b.time-lastT>3){ lastT=b.time; /* どの城でも使える操作: 攻め口（ルート）ごとに、いちばん先の敵の「次の線」へ、相性のよい部隊を割り当てる */
      const A=b.live('ally').filter(u=>u.state!=='rout'),E=b.live('enemy').filter(e=>e.state!=='rout');
      const fronts={}; for(const e of E){ const f=fronts[e.route.id]; if(!f||b.remain(e)<b.remain(f)) fronts[e.route.id]=e; }
      const F=Object.values(fronts).sort((x,y)=>b.remain(x)-b.remain(y));
      const slotFor=(e,kinds,last)=>{ const L=b.lineS[e.route.id]; let li=L.length; if(!last) for(let i=0;i<L.length;i++) if(L[i]!==null&&L[i]>e.s-2){ li=i+1; break; } const pt=b.lines[li-1].pts.slice().sort((p,q)=>Math.hypot(p[0]-e.x,p[1]-e.z)-Math.hypot(q[0]-e.x,q[1]-e.z))[0];
        const c=b.slots.filter(s=>s.line===li).sort((p,q)=>(kinds.includes(p.kind)?0:30)+Math.hypot(p.pos[0]-pt[0],p.pos[1]-pt[1])-(kinds.includes(q.kind)?0:30)-Math.hypot(q.pos[0]-pt[0],q.pos[1]-pt[1])); return c[0]; };
      const hold=(u,sl)=>{ if(sl&&!(u.order.kind==='hold'&&u.order.slot===sl)) b.order(u.id,{kind:'hold',slot:sl}); };
      const icp=(u,t)=>{ if(!(u.order.kind==='intercept'&&u.order.target===t)) b.order(u.id,{kind:'intercept',target:t.id}); };
      const free=A.slice(),beats={yari:'kiba',kiba:'yumi',yumi:'yari'};
      /* 一度ほかの攻め口へ回した部隊は、その攻め口の敵がいる間はそのまま */
      for(const u of A.slice()){ if(u._front&&fronts[u._front]&&u._front!==(F[0]&&F[0].route.id)){ free.splice(free.indexOf(u),1); const e=fronts[u._front]; const near=E.filter(x=>x.route===e.route&&Math.hypot(x.x-u.x,x.z-u.z)<45&&beats[u.base]===x.base)[0]; if(near&&u.base!=='yumi') icp(u,near); else hold(u,slotFor(e,u.base==='yumi'?['yagura','ishigaki']:['gate'],true)); } else u._front=null; }
      const Fx=F.filter(e=>!A.some(u=>u._front===e.route.id));
      /* 本丸まで遠い攻め口には、相性のよい1部隊だけ回す。いちばん近い攻め口には残りすべて */
      Fx.forEach((e,fi)=>{ if(!free.length) return; let pick;
        if(fi===0&&Fx.length===1){ pick=free.splice(0); }
        else { let i=free.findIndex(u=>beats[u.base]===e.base); if(i<0) i=free.findIndex(u=>beats[e.base]!==u.base); if(i<0) i=0; pick=free.splice(i,1); if(fi===0&&Fx.length>1){ /* いちばん危ない所にはもう1部隊 */ const j=free.findIndex(u=>beats[e.base]!==u.base); if(j>=0&&free.length>Fx.length-1) pick=pick.concat(free.splice(j,1)); } else for(const u of pick) u._front=e.route.id; }
        for(const u of pick){ const near=E.filter(x=>x.route===e.route&&Math.hypot(x.x-u.x,x.z-u.z)<45&&beats[u.base]===x.base)[0];
          if(near&&u.base!=='yumi') icp(u,near); else hold(u,slotFor(e,u.base==='yumi'?['yagura','ishigaki']:['gate'],fi>0)); } });
      for(const u of free){ if(F[0]) hold(u,slotFor(F[0],u.base==='yumi'?['yagura','ishigaki']:['gate'])); }
      if(process.env.DBG2) console.log((b.time|0)+' F:'+F.map(e=>e.route.id+':'+(b.remain(e)|0)).join(',')+' A:'+A.map(u=>u.base+'>'+(u.order.slot?u.order.slot.id:u.order.kind)+'@'+(u.x|0)+','+(u.z|0)).join(' ')); }
    if(mode==='play2'&&Math.round(b.time*10)%10===0){ /* 特技と策も使う */
      for(const u of b.live('ally')){ if(u.engaged&&b.skillWait(u)<=0) b.useSkill(u.id); if(u.morale<35&&b.saihai>=1) b.useSaku('kobu',{target:u.id}); }
      const E=b.live('enemy').filter(e=>e.state!=='rout').sort((x,y)=>(y.s/y.route.len)-(x.s/x.route.len)); if(E[0]&&b.saihai>=4) b.useSaku('rakuseki',{x:E[0].x,z:E[0].z}); }
    for(const e of b.events.splice(0)) if(['wave','rout','dead','line','end','bossdown','gone'].includes(e.k)) log.push(b.time.toFixed(0)+'s '+e.k+' '+(e.u?(e.u.side+':'+e.u.name+'('+e.u.men+')'):(e.name||e.label||e.why||'')));
  }
  if(process.env.DBG){ for(const e of b.live('enemy')) if([].concat(MAP.honmaru).some(H=>e.x>H.x0&&e.x<H.x1&&e.z>H.z0&&e.z<H.z1)) console.log('IN',e.route.id,e.type,e.men,e.x|0,e.z|0); for(const u of b.live('ally')) console.log('A',u.type,u.men,u.x|0,u.z|0,u.order.kind,u.order.slot&&u.order.slot.id, u.state); }
  const r=b.result(); return {mode,state:r.state,why:r.why,t:r.time.toFixed(0),loss:(r.allyLost/r.allyMen0*100).toFixed(0)+'%',army:r.army.map(a=>a.name+':'+a.men+'/'+a.men0).join(' '),enemyLost:r.enemyLost+'/'+r.enemyMen,breached:r.breached,log};
}
const v=process.argv[2]==='-v';
for(const m of (process.argv[3]||'idle,auto,play').split(',')) for(const sd of [1]){ const r=run(m,sd); const {log,...o}=r; console.log(JSON.stringify(o)); if(v&&sd===1) console.log(log.join('\n')); }
