/* 合戦のバランス確認（node tools/balance.js [-v] [idle,auto,play]）
   idle=何もしない / auto=全部隊「任せる」 / play=簡単な人間らしい操作。地形は index.html から取り出す */
const S=require('../battle/sim.js');
const MAP=require('../battle/maps/'+(process.env.MAP||'inuyama')+'.js');
const T=require('./terrain.js');
function run(mode,seed){ let s=seed||1; Math.random=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
  const b=new S.Battle(MAP,{army:MAP.army,h:T.groundH0}); const log=[];
  if(mode==='auto') for(const u of b.live('ally')) b.order(u.id,{kind:'auto'});
  let lastT=0;
  while(b.state==='run'&&b.time<600){ b.step(0.1);
    if(mode==='play'&&b.time-lastT>3){ lastT=b.time; const A=b.live('ally'),E=b.live('enemy').filter(e=>e.state!=='rout'); const by=t=>A.find(u=>u.type===t&&u.state!=='rout');
      const deep=t=>E.filter(e=>e.base===t).sort((x,y)=>(y.s/y.route.len)-(x.s/x.route.len))[0]; const slot=id=>b.slots.find(s=>s.id===id);
      const hold=(u,id)=>{ if(u&&!(u.order.kind==='hold'&&u.order.slot&&u.order.slot.id===id)) b.order(u.id,{kind:'hold',slot:slot(id)}); };
      const icp=(u,t)=>{ if(u&&t&&!(u.order.kind==='intercept'&&u.order.target===t)) b.order(u.id,{kind:'intercept',target:t.id}); };
      const y=by('yari'),k=by('kiba'),w=by('yumi');
      const ek=deep('kiba'); if(ek&&ek.s>30) icp(y,ek); else hold(y,'matsumon');
      const ew=deep('yumi'); if(ew&&ew.s>60) icp(k,ew); else { const ey=E.filter(e=>e.base==='yari'&&e.route.id==='karamete'&&e.s>150)[0]; if(ey&&!y) icp(k,ey); else hold(k,'kuromon'); }
      if(w){ const dE=E.filter(e=>e.route).sort((x,y)=>(y.s/y.route.len)-(x.s/x.route.len))[0]; let best='matsu_s';
        if(dE){ let bd=1e9; for(const sl of b.slots){ if(sl.kind==='gate') continue; const d=Math.hypot(sl.pos[0]-dE.x,sl.pos[1]-dE.z); const ahead=b.lineS[dE.route.id][sl.line-1]; if(ahead!==null&&ahead<dE.s-5) continue; if(d<bd){ bd=d; best=sl.id; } } }
        hold(w,best); } }
    for(const e of b.events.splice(0)) if(['wave','rout','dead','line','end','bossdown','gone'].includes(e.k)) log.push(b.time.toFixed(0)+'s '+e.k+' '+(e.u?(e.u.side+':'+e.u.name+'('+e.u.men+')'):(e.name||e.label||e.why||'')));
  }
  const r=b.result(); return {mode,state:r.state,why:r.why,t:r.time.toFixed(0),loss:(r.allyLost/r.allyMen0*100).toFixed(0)+'%',army:r.army.map(a=>a.name+':'+a.men+'/'+a.men0).join(' '),enemyLost:r.enemyLost+'/'+r.enemyMen,breached:r.breached,log};
}
const v=process.argv[2]==='-v';
for(const m of (process.argv[3]||'idle,auto,play').split(',')) for(const sd of [1]){ const r=run(m,sd); const {log,...o}=r; console.log(JSON.stringify(o)); if(v&&sd===1) console.log(log.join('\n')); }
