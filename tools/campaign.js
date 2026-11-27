/* 通しプレイの試し打ち: 犬山から大坂（＋江戸）まで、前の城の残り兵＋後詰めを持ち越して続けて戦う
   node tools/campaign.js   環境変数 PAT=陣立て（数字。'r' なら城ごとに変える） FROM=始める城のid TOTAL=その城の兵数 */
const S=require('../battle/sim.js');
const ORDER=['inuyama','matsumoto','hikone','matsuyama','bitchu','aizu','himeji','kumamoto','azuchi','osaka','edo'];
function play(MAPID,total,pat){
  const MAP=require('../battle/maps/'+MAPID+'.js');
  const ENV=MAPID==='inuyama'?{h:require('./terrain.js').groundH0}:require('./env/'+MAPID+'.js');
  const army=S.formArmy(MAP,total);
  const b=new S.Battle(MAP,{army,h:ENV.h,block:ENV.block,water:ENV.water,floor:ENV.floor,pattern:pat});
  while(b.state==='run'){ b.step(.5);
    const A=b.live('ally');
    for(const u of A){ if(u.engaged&&b.skillWait(u)<=0) b.useSkill(u.id); if(u.morale<35&&b.saihai>=1) b.useSaku('kobu',{target:u.id}); }
    const Ew=b.live('enemy').filter(e=>e.state!=='rout').sort((x,y)=>b.remain(x)-b.remain(y));
    if(Ew[0]&&b.saihai>=4) b.useSaku(b.rockGate(Ew[0].x,Ew[0].z)?'rakuseki':'hiya',{x:Ew[0].x,z:Ew[0].z});
    for(const k of A.filter(u=>u.type==='kiba'&&u.state!=='rout')){ const t=b.live('enemy').filter(e=>e.base==='yumi'&&e.state!=='rout'&&Math.hypot(e.x-k.x,e.z-k.z)<60)[0]; if(t&&k.order.kind!=='intercept') b.order(k.id,{kind:'intercept',target:t.id}); else if(!t&&k.order.kind!=='hold') b.order(k.id,{kind:'hold',slot:k.home}); }
  }
  return {MAP,r:b.result()};
}
let i=Math.max(0,ORDER.indexOf(process.env.FROM||'inuyama')),total=+process.env.TOTAL||0;
for(;i<ORDER.length;i++){
  const id=ORDER[i],MAP=require('../battle/maps/'+id+'.js'),base=S.baseArmy(MAP); if(!total) total=base;
  const pat=process.env.PAT==='r'?(i*7+3)%6:+process.env.PAT||0;
  const t0=Date.now(),{r}=play(id,total,pat),nx=S.nextArmy(r,MAP.next);
  console.log(JSON.stringify({id,pat,army:total,base,ratio:+(total/base).toFixed(2),state:r.state,t:r.time|0,loss:Math.round(nx.lossRate*100)+'%',enemy:r.enemyLost+'/'+r.enemyMen,next:nx.total,sec:((Date.now()-t0)/1000)|0}));
  if(r.state!=='win') break;
  total=MAP.next?nx.total:0;   /* 隠しの城は持ち越さず、ふつうの兵数で */
}
