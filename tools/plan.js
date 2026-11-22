/* 出陣前の説明を読んだ人の作戦: 弓は最初から本丸の西、足軽は太鼓門、騎馬は黒門。特技と策も使う */
const S=require('../battle/sim.js'),MAP=require('../battle/maps/matsumoto.js'),E=require('./env/matsumoto.js');
const army=process.env.CARRY?[{id:'a1',name:'信康本隊',type:'yari',men:520,slot:'taikomon'},{id:'a2',name:'弓組',type:'yumi',men:390,slot:'hon_w'},{id:'a3',name:'騎馬組',type:'kiba',men:300,slot:'kuromon'}]:MAP.army.map(a=>Object.assign({},a,{slot:a.type==='yumi'?'hon_w':a.type==='kiba'?'kuromon':'taikomon'}));
const b=new S.Battle(MAP,{army,h:E.h,block:E.block,water:E.water});
const sk=process.argv[2]!=='noskill';
while(b.state==='run'){ b.step(.5);
  const A=b.live('ally');
  if(sk) for(const u of A){ if(u.engaged&&b.skillWait(u)<=0) b.useSkill(u.id); if(u.morale<35&&b.saihai>=1) b.useSaku('kobu',{target:u.id}); }
  const Ew=b.live('enemy').filter(e=>e.state!=='rout').sort((x,y)=>b.remain(x)-b.remain(y));
  if(sk&&Ew[0]&&b.saihai>=4) b.useSaku('rakuseki',{x:Ew[0].x,z:Ew[0].z});
  const k=A.find(u=>u.type==='kiba'),y=A.find(u=>u.type==='yari');
  if(k&&k.state!=='rout'){ const t=b.live('enemy').filter(e=>e.base==='yumi'&&e.state!=='rout'&&Math.hypot(e.x-k.x,e.z-k.z)<60)[0]; if(t&&k.order.kind!=='intercept') b.order(k.id,{kind:'intercept',target:t.id}); else if(!t&&k.order.kind!=='hold') b.order(k.id,{kind:'hold',slot:b.slots.find(s=>s.id==='kuromon')}); }
}
const r=b.result(); console.log(JSON.stringify({skills:sk,carry:!!process.env.CARRY,state:r.state,why:r.why,t:r.time|0,loss:Math.round(r.allyLost/r.allyMen0*100)+'%',enemy:r.enemyLost+'/'+r.enemyMen,army:r.army.map(a=>a.name+':'+a.men+'/'+a.men0).join(' ')}));
