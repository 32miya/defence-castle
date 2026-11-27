/* 戦国・城ディフェンス（仮） マップ設定データ: 姫路城（播磨・第7ステージ）
   座標は姫路城さんぽの3Dマップ（江戸時代）と同じ。北が -z。
   内堀・中堀・外堀の三重の堀。姫山の上に大天守（天守曲輪 高さ43m）。
   大手は桜門から三の丸、菱の門 → いの門 → ろの門 → はの門 → にの門 → ほの門 → 水の門と、迷路のような登城道。
   東は帯郭から りの門・ぬの門・備前門、西は西の丸から北の坂を下りて ろの門 へ合流。北は内堀を泳ぎ渡る搦手。 */
(function(root){
/* はの門 → にの門 → ほの門 → 水の門 → 天守曲輪 */
const TAIL=[[-72,-117],[-56,-126],[-52,-134],[-52,-162],[-51,-196],[-47,-216],[-38,-222],[-38,-212],[-38,-190],[-38,-168],[-38,-157],[-30,-156],[-14,-178]];
const MAP={
  id:'himeji', stage:7, castle:'姫路城', title:'白鷺城の戦い',
  era:'慶長年間、池田輝政が築いた白鷺の城。もし西国の大名が大軍で押し寄せていたら…という戦国風の仮想合戦',
  goal:'日が暮れるまで大天守を守り抜け', winText:'日が暮れた。迷路の登城道を抜けられず、敵は兵を引いた',
  duration:540,
  sunset:{at:.7},

  /* 入口: 中堀の南（大手）・東・西の橋と、北の搦手。部隊の数＝4＋3 */
  gates:[
    {id:'ote',name:'大手（中堀の南の橋）',pos:[10,346]},
    {id:'higashi',name:'中堀の東の橋',pos:[333,6]},
    {id:'nishi',name:'中堀の西の橋',pos:[-372,6]},
    {id:'kita',name:'搦手（北）',pos:[-4,-372]}
  ],

  hint:'大天守へ登る道は迷路。菱の門からの大手道と、西の丸から下る道は ろの門 で合わさり、はの門・にの門・ほの門と続く。東の敵は帯郭から りの門・ぬの門をねらう。せまい門は「門を閉ざす」と落石が効く。',
  general:{name:'池田輝政',title:'西国将軍',skill:{kind:'typeAtk',type:'teppo',v:.25,name:'西国将軍の鉄砲',text:'鉄砲隊の攻撃1.25倍'}},

  army:[
    {id:'a1',gen:'池田輝政',name:'輝政本隊',type:'yari',men:680,slot:'hanomon'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:540,slot:'bizen_y'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:440,slot:'nino'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:460,slot:'nunomon'}
  ],
  deploy:{yari:['hanomon','honomon'],yumi:['bizen_y','kita_y'],kiba:['nino','obi'],teppo:['nunomon']},

  routes:[
    {id:'ote',gate:'ote',name:'大手',pts:[[10,525],[10,480],[10,420],[10,380],[10,346],[10,300],[10,240],[10,196],[10,170],[10,134],[-20,60],[-70,6],[-80,-10],[-80,-26],[-80,-41],[-90,-62],[-92,-80],[-92,-93],[-88,-106]].concat(TAIL)},
    {id:'higashi',gate:'higashi',name:'東',pts:[[492,6],[450,6],[400,6],[345,6],[320,6],[270,40],[240,103],[226,103],[205,103],[170,90],[100,30],[60,-28],[55,-40],[48,-54],[44,-66],[38,-84],[28,-92],[18,-92],[8,-92],[-14,-96],[-14,-98],[-14,-112],[-14,-117],[-22,-125],[-26,-127],[-26,-150],[-26,-155],[-18,-172]]},
    {id:'nishi',gate:'nishi',name:'西',pts:[[-495,6],[-450,6],[-400,6],[-372,6],[-350,6],[-300,60],[-266,103],[-242,103],[-200,60],[-112,-48],[-120,-48],[-138,-50],[-148,-50],[-175,-80],[-150,-96],[-128,-97],[-104,-101],[-89,-103],[-88,-106]].concat(TAIL)},
    {id:'kita',gate:'kita',name:'搦手',pts:[[-4,-495],[-4,-450],[-4,-400],[-4,-372],[-4,-350],[-4,-310],[-4,-282],[-4,-258],[-56,-176],[-52,-180],[-40,-222],[-38,-212],[-38,-190],[-38,-168],[-38,-157],[-30,-156],[-14,-178]]}
  ],
  links:[],

  lines:[
    {name:'中堀の橋',short:'中堀',pts:[[10,346],[333,6],[-361,6],[-4,-361]]},
    {name:'桜門・内堀の橋',short:'内堀',pts:[[10,188],[215,103],[-254,103],[-4,-270]]},
    {name:'菱の門・帯郭・西の丸',short:'菱の門',pts:[[-80,-30],[50,-48],[-148,-50],[-20,-236]]},
    {name:'いの門・りの門・西の丸北の坂',short:'いの門',pts:[[-92,-93],[18,-92],[-128,-97]]},
    {name:'はの門・にの門・ぬの門',short:'にの門',pts:[[-56,-126],[-52,-158],[-14,-112]]},
    {name:'ほの門・水の門・備前門',short:'水の門',pts:[[-47,-216],[-38,-190],[-26,-150]]}
  ],
  /* 天守曲輪（大天守と小天守の台） */
  honmaru:{x0:-32,x1:28,z0:-212,z1:-153},

  slots:[
    {id:'nakaS',name:'中堀の南の橋',pos:[10,330],line:1,kind:'gate'},
    {id:'nakaE',name:'中堀の東の橋',pos:[315,6],line:1,kind:'gate'},
    {id:'nakaW',name:'中堀の西の橋',pos:[-345,6],line:1,kind:'gate'},
    {id:'sakura',name:'桜門（桐二の門）',pos:[10,140],line:2,kind:'gate'},
    {id:'uchiE',name:'内堀の東の橋の内',pos:[195,100],line:2,kind:'gate'},
    {id:'uchiW',name:'内堀の西の橋の内',pos:[-232,100],line:2,kind:'gate'},
    {id:'hishi',name:'菱の門',pos:[-80,-44],line:3,kind:'gate'},
    {id:'nino',name:'二の丸（三国堀のあたり）',pos:[-100,-70],line:3,kind:'gate'},
    {id:'obi',name:'帯郭',pos:[40,-84],line:3,kind:'gate'},
    {id:'nishi_y',name:'西の丸の櫓（百間廊下）',pos:[-150,-70],line:3,kind:'yagura'},
    {id:'inomon',name:'いの門・ろの門',pos:[-90,-100],line:4,kind:'gate'},
    {id:'rinomon',name:'りの門の上（上山里）',pos:[0,-92],line:4,kind:'gate'},
    {id:'kami_y',name:'上山里の石垣',pos:[-30,-90],line:4,kind:'ishigaki'},
    {id:'hanomon',name:'はの門・にの門',pos:[-52,-146],line:5,kind:'gate'},
    {id:'nunomon',name:'ぬの門の上（備前丸）',pos:[-14,-122],line:5,kind:'gate'},
    {id:'bizen_y',name:'備前丸の石垣',pos:[10,-130],line:5,kind:'ishigaki'},
    {id:'honomon',name:'ほの門・水の門',pos:[-40,-205],line:6,kind:'gate'},
    {id:'kita_y',name:'北腰曲輪の櫓',pos:[-20,-226],line:6,kind:'yagura'},
    {id:'bizenmon',name:'備前門',pos:[-26,-145],line:6,kind:'gate'}
  ],
  narrow:[{name:'中堀南の門',pos:[10,338],r:6},{name:'桜門',pos:[10,180],r:6},{name:'菱の門',pos:[-80,-38],r:6},{name:'いの門',pos:[-92,-91],r:4},
    {name:'ろの門',pos:[-87,-107],r:4},{name:'はの門',pos:[-57,-125],r:4},{name:'にの門',pos:[-52,-158],r:4},{name:'ほの門',pos:[-48,-209],r:3},
    {name:'りの門',pos:[18,-92],r:4},{name:'ぬの門',pos:[-14,-113],r:4},{name:'備前門',pos:[-26,-152],r:4}],
  gatePass:[[[10,200],[10,128]],[[-80,-4],[-80,-46]],[[-92,-78],[-88,-108]],[[-88,-106],[-56,-126]],[[-56,-126],[-52,-164]],[[-52,-164],[-47,-218]],
    [[-38,-224],[-38,-156]],[[-38,-156],[-26,-156]],[[-14,-94],[-14,-120]],[[-26,-125],[-26,-156]],[[30,-92],[6,-92]],[[60,-26],[44,-68]],
    [[-110,-48],[-150,-50]],[[-146,-96],[-88,-104]]],

  enemy:{
    side:'西国勢', scale:.8,
    trend:'4方向から攻める。大手の兵は桜門から菱の門へ、西の兵は西の丸を越えて北の坂から ろの門 へ、東の兵は帯郭から りの門・ぬの門へ、北の兵は内堀を泳ぎ渡って水の門をねらう。最後の本隊は毛利輝元',
    boss:{name:'毛利輝元',skill:{kind:'daiichi',name:'中国の大大名',text:'敵の士気が下がりにくい（0.85倍）'}},
    waves:[
      {t:12, label:'先手', text:'西国勢の先手が大手と西の橋に現れた',units:[
        {route:'ote',type:'yari',men:320},{route:'nishi',type:'yumi',men:240},{route:'ote',type:'kiba',men:220,delay:10}]},
      {t:130,label:'二の手', text:'二の手が東の橋へ。北の内堀にも兵が回った',units:[
        {route:'higashi',type:'yari',men:300},{route:'kita',type:'yari',men:240},{route:'ote',type:'yumi',men:260},{route:'higashi',type:'kiba',men:240,delay:8}]},
      {t:250,label:'三の手', text:'三の手！四方の橋に兵があふれる',units:[
        {route:'nishi',type:'yari',men:320},{route:'ote',type:'yari',men:320},{route:'higashi',type:'yumi',men:240},{route:'kita',type:'yumi',men:200,delay:8}]},
      {t:370,label:'本隊', text:'毛利輝元の本隊！一文字に三つ星の旗が迫る',units:[
        {route:'ote',type:'kiba',men:440,boss:true,name:'毛利輝元 本隊',gen:'毛利輝元'},{route:'higashi',type:'yari',men:320},
        {route:'nishi',type:'yari',men:300},{route:'kita',type:'yari',men:260,delay:8}]}
    ]
  },
  keep:{x0:-500,x1:500,z0:-500,z1:530},
  camera:{x:-20,z:-60,yaw:-.3,dist:330,pitch:.9},
  next:{id:'kumamoto',castle:'熊本城',url:'/32miya-kumamoto-castle/?battle',units:7}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
