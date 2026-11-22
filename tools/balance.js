/* 合戦のバランス確認（node tools/balance.js [-v] [idle,auto,play]）
   idle=何もしない / auto=全部隊「任せる」 / play=簡単な人間らしい操作。地形は index.html から取り出す */
const S=require('../battle/sim.js');
const MAP=require('../battle/maps/'+(process.env.MAP||'inuyama')+'.js');
const MAPID=process.env.MAP||'inuyama'; const ENV=MAPID==='inuyama'?null:require('./env/'+MAPID+'.js'); const T=ENV?{groundH0:ENV.h}:require('./terrain.js');
function run(mode,seed){ let s=seed||1; Math.random=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
  const b=new S.Battle(MAP,{army:MAP.army,h:T.groundH0,block:ENV&&ENV.block}); const log=[];
  if(mode==='auto') for(const u of b.live('ally')) b.order(u.id,{kind:'auto'});
  let lastT=0;
  while(b.state==='run'&&b.time<600){ b.step(0.1);
    if((mode==='play'||mode==='play2')&&b.time-lastT>3){ lastT=b.time; /* どの城でも使える簡単な操作: いちばん深い敵の「次の線」で待ち受ける */
      const A=b.live('ally').filter(u=>u.state!=='rout'),E=b.live('enemy').filter(e=>e.state!=='rout');
      const D=E.slice().sort((x,y)=>(y.s/y.route.len)-(x.s/x.route.len))[0];
      let line=1; if(D){ const L=b.lineS[D.route.id]; line=L.length; for(let i=0;i<L.length;i++) if(L[i]!==null&&L[i]>D.s-2){ line=i+1; break; } }
      const slotOf=(kinds)=>{ const c=b.slots.filter(s=>s.line===line&&kinds.includes(s.kind)); return c[0]||b.slots.filter(s=>s.line===line)[0]; };
      const hold=(u,sl)=>{ if(sl&&!(u.order.kind==='hold'&&u.order.slot===sl)) b.order(u.id,{kind:'hold',slot:sl}); };
      const icp=(u,t)=>{ if(!(u.order.kind==='intercept'&&u.order.target===t)) b.order(u.id,{kind:'intercept',target:t.id}); };
      const near=(u,base,r)=>E.filter(e=>e.base===base&&Math.hypot(e.x-u.x,e.z-u.z)<r).sort((x,y)=>Math.hypot(x.x-u.x,x.z-u.z)-Math.hypot(y.x-u.x,y.z-u.z))[0];
      for(const u of A){ if(u.base==='yari'){ const k=near(u,'kiba',45); if(k) icp(u,k); else hold(u,slotOf(['gate'])); }
        else if(u.base==='kiba'){ const w=near(u,'yumi',70); if(w) icp(u,w); else hold(u,slotOf(['gate'])); }
        else hold(u,slotOf(['yagura','ishigaki'])); } }
    if(mode==='play2'&&Math.round(b.time*10)%10===0){ /* 特技と策も使う */
      for(const u of b.live('ally')){ if(u.engaged&&b.skillWait(u)<=0) b.useSkill(u.id); if(u.morale<35&&b.saihai>=1) b.useSaku('kobu',{target:u.id}); }
      const E=b.live('enemy').filter(e=>e.state!=='rout').sort((x,y)=>(y.s/y.route.len)-(x.s/x.route.len)); if(E[0]&&b.saihai>=4) b.useSaku('rakuseki',{x:E[0].x,z:E[0].z}); }
    for(const e of b.events.splice(0)) if(['wave','rout','dead','line','end','bossdown','gone'].includes(e.k)) log.push(b.time.toFixed(0)+'s '+e.k+' '+(e.u?(e.u.side+':'+e.u.name+'('+e.u.men+')'):(e.name||e.label||e.why||'')));
  }
  const r=b.result(); return {mode,state:r.state,why:r.why,t:r.time.toFixed(0),loss:(r.allyLost/r.allyMen0*100).toFixed(0)+'%',army:r.army.map(a=>a.name+':'+a.men+'/'+a.men0).join(' '),enemyLost:r.enemyLost+'/'+r.enemyMen,breached:r.breached,log};
}
const v=process.argv[2]==='-v';
for(const m of (process.argv[3]||'idle,auto,play').split(',')) for(const sd of [1]){ const r=run(m,sd); const {log,...o}=r; console.log(JSON.stringify(o)); if(v&&sd===1) console.log(log.join('\n')); }
