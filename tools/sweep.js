/* 6つの陣立てをまとめて試す: MAPS=城のid,... SCALE=敵の兵数の倍率（上書き、省略可）  勝ち数と平均損害を出す */
const S=require('../battle/sim.js');
for(const id of (process.env.MAPS||'inuyama').split(',')){
  const MAP=require('../battle/maps/'+id+'.js'); if(process.env.SCALE) MAP.enemy.scale=+process.env.SCALE;
  const ENV=id==='inuyama'?{h:require('./terrain.js').groundH0}:require('./env/'+id+'.js');
  let w=0,L=[],o=[];
  for(let pat=0;pat<6;pat++){
    const b=new S.Battle(MAP,{army:S.formArmy(MAP,S.baseArmy(MAP)),h:ENV.h,block:ENV.block,water:ENV.water,floor:ENV.floor,pattern:pat});
    while(b.state==='run'){ b.step(.5); const A=b.live('ally');
      for(const u of A){ if(u.engaged&&b.skillWait(u)<=0) b.useSkill(u.id); if(u.morale<35&&b.saihai>=1) b.useSaku('kobu',{target:u.id}); }
      const Ew=b.live('enemy').filter(e=>e.state!=='rout').sort((x,y)=>b.remain(x)-b.remain(y));
      if(Ew[0]&&b.saihai>=4) b.useSaku(b.rockGate(Ew[0].x,Ew[0].z)?'rakuseki':'hiya',{x:Ew[0].x,z:Ew[0].z});
      for(const k of A.filter(u=>u.type==='kiba'&&u.state!=='rout')){ const t=b.live('enemy').filter(e=>e.base==='yumi'&&e.state!=='rout'&&Math.hypot(e.x-k.x,e.z-k.z)<60)[0]; if(t&&k.order.kind!=='intercept') b.order(k.id,{kind:'intercept',target:t.id}); else if(!t&&k.order.kind!=='hold') b.order(k.id,{kind:'hold',slot:k.home}); } }
    const r=b.result(),l=Math.round(r.allyLost/r.allyMen0*100); if(r.state==='win') w++; L.push(l); o.push((r.state==='win'?'W':'L')+l);
  }
  console.log(id.padEnd(10),'scale',MAP.enemy.scale,'wins',w+'/6','avgLoss',Math.round(L.reduce((a,b)=>a+b)/6)+'%',o.join(' '));
}
