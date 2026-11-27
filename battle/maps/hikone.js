/* 戦国・城ディフェンス（仮） マップ設定データ: 彦根城（第3ステージ）
   座標は彦根城さんぽの3Dマップ（江戸時代）と同じ。北が -z。距離は実際のおよそ0.6倍。
   彦根山の尾根: 南から 鐘の丸 → 大堀切 → 天秤櫓・太鼓丸 → 本丸（天守）→ 西の丸 → 山崎曲輪。まわりに内堀・中堀、西は琵琶湖。
   点と点のあいだの道は、エンジンが建物・石垣・崖をよけて自動でつなぐ（堀は渡れるが遅い）。 */
(function(root){
const TAIL=[[46,83],[26,83],[10,92],[0,81],[0,57],[0,48],[0,16],[0,4],[0,-14]];        /* 大堀切 → 鐘の丸 → 廊下橋 → 天秤櫓 → 太鼓門 → 本丸 */
const NISHI=[[0,-100],[-8,-68],[-8,-50],[-4,-28]];                                     /* 西の丸 → 本丸 */
const MAP={
  id:'hikone', stage:3, castle:'彦根城', title:'彦根山の戦い',
  era:'慶長五年（1600）関ヶ原ののち、佐和山の石田勢が彦根山に攻め寄せたら…という戦国風の仮想合戦',
  goal:'敵の兵糧が尽きるまで守り抜け', winText:'石田勢は兵糧が尽き、佐和山へ退いた',
  duration:540,
  sunset:{at:.7},

  /* 入口: 内堀に開く4つの門。部隊の数＝4＋3 */
  gates:[
    {id:'ote',name:'大手門（南）',pos:[-60,176]},
    {id:'omote',name:'表門（東）',pos:[117,70]},
    {id:'kuro',name:'黒門（北東）',pos:[104,-60]},
    {id:'yamazaki',name:'山崎門（北西）',pos:[-66,-210]}
  ],

  general:{name:'井伊直政',title:'井伊の赤鬼',skill:{kind:'akazonae',v:.2,name:'井伊の赤備え',text:'騎馬隊の攻撃1.2倍。味方の士気が下がりにくい'}},

  /* 前の城の軍勢がないとき（直接遊んだとき）の部隊。松本城を守り抜いたときのおよその兵数 */
  army:[
    {id:'a1',gen:'井伊直政',name:'直政本隊',type:'yari',men:560,slot:'tenbin'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:420,slot:'kane_e'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:340,slot:'horikiri'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:300,slot:'nishi_saka'}
  ],

  /* 兵の総数はこの部隊の合計。「門の数＋3」部隊に自動で分けて、兵種ごとにこの順で配置する */
  deploy:{yari:['tenbin','nishi_saka','horikiri'],yumi:['kane_e','nishi_e'],kiba:['horikiri','tenbin']},

  routes:[
    {id:'ote',gate:'ote',name:'大手',pts:[[-12,380],[-12,357],[-12,330],[-12,300],[-60,212],[-60,183],[-60,168],[-60,116],[-60,80],[30,74]].concat(TAIL)},
    {id:'omote',gate:'omote',name:'表門',pts:[[372,130],[355,130],[329,130],[300,130],[152,70],[123,70],[108,70],[100,70],[64,70],[40,74]].concat(TAIL)},
    {id:'kuro',gate:'kuro',name:'黒門',pts:[[46,-410],[46,-397],[46,-371],[46,-355],[150,-60],[123,-60],[96,-60],[62,-64],[62,-94],[58,-106],[30,-106]].concat(NISHI)},
    {id:'yamazaki',gate:'yamazaki',name:'山崎',pts:[[-300,65],[-275,65],[-249,65],[-230,60],[-66,-264],[-66,-235],[-66,-228],[-66,-214],[-62,-190],[-48,-166],[-30,-166],[6,-166],[6,-140]].concat(NISHI)},
    /* 堀を渡る兵: 中堀・内堀を渡って彦根山の東の斜面を登り、大堀切へ */
    {id:'hori',gate:'omote',name:'東の堀',pts:[[220,382],[200,300],[118,112],[60,92],[50,77]].concat(TAIL)}
  ],
  links:[],

  lines:[
    {name:'中堀の口',short:'中堀',pts:[[-12,330],[318,130],[46,-371],[-262,65],[200,342]]},
    {name:'内堀の門',short:'内堀',pts:[[-60,183],[123,70],[104,-60],[-66,-235],[130,110]]},
    {name:'大堀切・鐘の丸・西の丸',short:'鐘の丸',pts:[[26,83],[30,-106],[6,-140]]},
    {name:'天秤櫓・西の丸の坂',short:'天秤櫓',pts:[[0,55],[-8,-62]]}
  ],
  honmaru:{x0:-34,x1:34,z0:-54,z1:4},

  slots:[
    {id:'kyobashi',name:'京橋口',pos:[-12,310],line:1,kind:'gate'},
    {id:'sawaguchi',name:'佐和口',pos:[300,130],line:1,kind:'gate'},
    {id:'otemon',name:'大手門',pos:[-60,166],line:2,kind:'gate'},
    {id:'omotemon',name:'表門',pos:[106,70],line:2,kind:'gate'},
    {id:'kuromon',name:'黒門',pos:[94,-60],line:2,kind:'gate'},
    {id:'yamazakimon',name:'山崎門',pos:[-64,-200],line:2,kind:'gate'},
    {id:'horikiri',name:'大堀切の底',pos:[30,70],line:3,kind:'gate'},
    {id:'kane_e',name:'鐘の丸 東の石垣',pos:[20,96],line:3,kind:'ishigaki'},
    {id:'kane_w',name:'鐘の丸 西の櫓',pos:[-22,118],line:3,kind:'yagura'},
    {id:'nishi_e',name:'西の丸 東の石垣',pos:[24,-112],line:3,kind:'ishigaki'},
    {id:'sanju',name:'西の丸三重櫓',pos:[-24,-128],line:3,kind:'yagura'},
    {id:'tenbin',name:'天秤櫓',pos:[0,46],line:4,kind:'gate'},
    {id:'tenbin_y',name:'天秤櫓 西の二重櫓',pos:[-14,44],line:4,kind:'yagura'},
    {id:'nishi_saka',name:'西の丸から本丸への坂',pos:[-8,-74],line:4,kind:'gate'},
    {id:'tsukimi',name:'着見櫓（本丸）',pos:[26,-2],line:4,kind:'yagura'}
  ],
  narrow:[{name:'大手門',pos:[-60,176],r:6},{name:'表門',pos:[117,70],r:6},{name:'黒門',pos:[104,-60],r:6},{name:'山崎門',pos:[-66,-210],r:6},
    {name:'天秤櫓',pos:[0,55],r:5},{name:'太鼓門',pos:[0,9.5],r:5},{name:'京橋口',pos:[-12,318],r:6},{name:'佐和口',pos:[318,130],r:6}],
  /* 門の通り道と石段（石垣の裾にかかって「通れない」にならないよう、道の真ん中をあけておく） */
  gatePass:[[[48,83],[22,83]],[[-60,120],[-60,76]],[[104,70],[60,70]],[[62,-62],[62,-98]],[[62,-106],[26,-106]],[[-8,-46],[-8,-70]],[[-66,-234],[-66,-210]],[[-52,-166],[-26,-166]],[[6,-168],[6,-136]],[[30,74],[46,80]],
    [[-12,358],[-12,298]],[[356,130],[294,130]],[[46,-398],[46,-354]],[[-280,65],[-236,65]],[[-60,212],[-60,160]],[[152,70],[94,70]],[[152,-60],[88,-60]],[[-66,-264],[-66,-200]],[[0,84],[0,44]],[[0,22],[0,-2]]],

  enemy:{
    side:'石田勢', scale:.64,
    trend:'5方向から攻める。大手・表門の兵は大堀切から鐘の丸、廊下橋、天秤櫓へ。黒門・山崎の兵は西の丸から本丸へ。三の手からは東の堀を渡って斜面を登る兵も来る。最後の本隊は石田三成',
    boss:{name:'石田三成',skill:{kind:'daiichi',name:'大一大万大吉',text:'敵全軍の士気が下がりにくい'}},
    waves:[
      {t:12, label:'先手', text:'石田勢の先手が大手と表門に現れた',units:[
        {route:'ote',type:'yari',men:300},{route:'omote',type:'yari',men:300},{route:'kuro',type:'kiba',men:220,delay:10}]},
      {t:130,label:'二の手', text:'二の手が表門と大手へ。北西の山崎口にも兵が回った',units:[
        {route:'omote',type:'yumi',men:220},{route:'omote',type:'kiba',men:260},{route:'ote',type:'yari',men:300},{route:'yamazaki',type:'yari',men:260}]},
      {t:255,label:'三の手', text:'三の手！東の堀を渡って斜面を登る兵がいる',units:[
        {route:'hori',type:'yari',men:280},{route:'kuro',type:'yari',men:300},{route:'ote',type:'yumi',men:200},{route:'yamazaki',type:'yumi',men:200,delay:10}]},
      {t:370,label:'本隊', text:'石田三成の本隊、大一大万大吉の旗が迫る！',units:[
        {route:'ote',type:'kiba',men:400,boss:true,name:'石田三成 本隊',gen:'石田三成'},{route:'omote',type:'yari',men:320},
        {route:'kuro',type:'kiba',men:260},{route:'hori',type:'yari',men:260,delay:8}]}
    ]
  },
  keep:{x0:-305,x1:378,z0:-414,z1:386},
  camera:{x:30,z:20,yaw:-.45,dist:300,pitch:.9},
  next:{id:'matsuyama',castle:'松山城',url:'/32miya-matsuyama-castle/?battle',units:8,men:9000}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
