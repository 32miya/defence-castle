/* 出陣前の説明を読んだ人の作戦（どの城でも）: 最初の配置（PLAN で上書き）を守り、騎馬は近くの弓を迎撃して戻る。特技と策も使う
   node plan.js [noskill]   環境変数 MAP=城のid  CARRY=1 で持ち越しの兵数 */
const S=require('../battle/sim.js'),MAPID=process.env.MAP||'matsumoto',MAP=require('../battle/maps/'+MAPID+'.js');
const ENV=MAPID==='inuyama'?{h:require('./terrain.js').groundH0}:require('./env/'+MAPID+'.js');
const army=S.formArmy(MAP,Math.round(MAP.army.reduce((t,a)=>t+a.men,0)*(process.env.CARRY?1.1:1)));
const b=new S.Battle(MAP,{army,h:ENV.h,block:ENV.block,water:ENV.water,floor:ENV.floor});
const sk=process.argv[2]!=='noskill';
while(b.state==='run'){ b.step(.5);
  const A=b.live('ally');
  if(sk) for(const u of A){ if(u.engaged&&b.skillWait(u)<=0) b.useSkill(u.id); if(u.morale<35&&b.saihai>=1) b.useSaku('kobu',{target:u.id}); }
  const Ew=b.live('enemy').filter(e=>e.state!=='rout').sort((x,y)=>b.remain(x)-b.remain(y));
  if(sk&&Ew[0]&&b.saihai>=4) b.useSaku('rakuseki',{x:Ew[0].x,z:Ew[0].z});
  for(const k of A.filter(u=>u.type==='kiba'&&u.state!=='rout')){ const t=b.live('enemy').filter(e=>e.base==='yumi'&&e.state!=='rout'&&Math.hypot(e.x-k.x,e.z-k.z)<60)[0]; if(t&&k.order.kind!=='intercept') b.order(k.id,{kind:'intercept',target:t.id}); else if(!t&&k.order.kind!=='hold') b.order(k.id,{kind:'hold',slot:k.home}); }
}
const r=b.result(); console.log(JSON.stringify({map:MAPID,skills:sk,carry:!!process.env.CARRY,state:r.state,why:r.why,t:r.time|0,loss:Math.round(r.allyLost/r.allyMen0*100)+'%',enemy:r.enemyLost+'/'+r.enemyMen,army:r.army.map(a=>a.name+':'+a.men+'/'+a.men0).join(' ')}));
if(process.env.DBG){ for(const e of b.live('enemy')) if([].concat(MAP.honmaru).some(H=>e.x>H.x0&&e.x<H.x1&&e.z>H.z0&&e.z<H.z1)) console.log('IN',e.route.id,e.type,e.men,e.x|0,e.z|0); for(const u of b.units.filter(u=>u.side==='ally')) console.log('A',u.name,u.men,u.slot&&u.slot.id,u.order.kind,u.order.slot&&u.order.slot.id,u.x|0,u.z|0,u.state); }
