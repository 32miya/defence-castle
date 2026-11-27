/* 戦国・城ディフェンス（仮） マップ設定データ: 備中松山城（備中・第5ステージ）
   座標は備中松山城さんぽの3Dマップ（戦国時代・1570年ごろ）と同じ。北が -z。
   臥牛山の尾根に、南から 御根小屋のふもと → 下太鼓の丸 → 中太鼓の丸 → 大手門 → 三の丸 → 厩曲輪 → 二の丸 → 本丸（小松山）。
   北の尾根には 天神の丸・大松山城。東はふいご峠から中太鼓の丸へ登る道。
   点と点のあいだの道は、エンジンが崖・柵・建物をよけて自動でつなぐ。 */
(function(root){
/* 中太鼓の丸 → 大手門 → 三の丸 → 厩曲輪 → 二の丸 → 本丸 */
const TAIL=[[2,106],[0,96],[0,80],[0,70],[0,62],[-4,56],[-10,49],[-10,40],[0,30],[11,18],[11,14],[11,6],[2,-4],[-10,-14],[-10,-24],[0,-40],[0,-54],[0,-64],[0,-74]];
const MAP={
  id:'bitchu', stage:5, castle:'備中松山城', title:'備中兵乱',
  era:'天正三年（1575）、毛利・宇喜多の大軍が三村元親の臥牛山の城に攻め寄せた「備中兵乱」をもとにした戦国風の合戦（本当の戦いでは城は落ちた）',
  goal:'日が暮れるまで山城を守り抜け', winText:'山の城は落ちなかった。毛利勢は囲みを解いて引きあげた',
  duration:540,
  sunset:{at:.7},

  /* 入口: 南のふもと（御根小屋）、東のふいご峠への道、北の大松山の尾根。部隊の数＝3＋3 */
  gates:[
    {id:'ote',name:'御根小屋口（南）',pos:[-30,226]},
    {id:'fuigo',name:'ふいご峠口（東）',pos:[76,236]},
    {id:'kita',name:'大松山の尾根（北）',pos:[9,-426]}
  ],

  hint:'登城道は一本道。崖と柵に守られた曲輪の入口で、相性のよい部隊を待ち構えさせよう。北の大松山の尾根から来る兵は、後曲輪から本丸をねらう。',
  general:{name:'三村元親',title:'備中の国人',skill:{kind:'kengo',v:.25,name:'臥牛山の天嶮',text:'持ち場で守る部隊の受ける損害が2割5分へる'}},

  /* 前の城の軍勢がないとき（直接遊んだとき）の兵数。松山城を守り抜いたときのおよその兵数 */
  army:[
    {id:'a1',gen:'三村元親',name:'元親本隊',type:'yari',men:620,slot:'otemon'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:500,slot:'nakataiko'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:400,slot:'fuigo'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:420,slot:'mizunote'}
  ],

  /* 兵の総数は上の合計。「門の数＋3」部隊に自動で分けて、兵種ごとにこの順で配置する */
  deploy:{yari:['otemon','mizunote'],yumi:['nakataiko','aihata'],kiba:['fuigo','sannomaru']},

  routes:[
    {id:'ote',gate:'ote',name:'大手',pts:[[-8,420],[-8,392],[-8,366],[-8,337],[-8,300],[-20,250],[-30,236],[-30,226],[-30,200],[-37,182],[-37,156],[-30,151],[-2,151],[5,146],[5,140],[5,116]].concat(TAIL)},
    {id:'fuigo',gate:'fuigo',name:'ふいご峠',pts:[[154,420],[154,392],[154,366],[154,337],[154,300],[100,246],[76,236],[76,180],[76,134],[64,115],[44,106],[16,106]].concat(TAIL)},
    {id:'kita',gate:'kita',name:'大松山',pts:[[9,-436],[9,-430],[9,-426],[9,-416],[9,-384],[-2,-366],[-1,-350],[-1,-330],[10,-310],[-1,-290],[-1,-276],[-1,-262],[-1,-247],[-1,-232],[-1,-214],[-3,-197],[-3,-180],[-3,-162],[-3,-150],[-3,-124],[-6,-110],[-4,-98],[0,-90]]}
  ],
  links:[],

  lines:[
    {name:'山のふもと・大松山',short:'ふもと',pts:[[-30,226],[76,236],[-2,-366]]},
    {name:'下太鼓の丸・ふいご峠・天神の丸',short:'下太鼓',pts:[[5,148],[64,115],[-1,-247]]},
    {name:'中太鼓の丸・相畑の曲輪',short:'中太鼓',pts:[[2,106],[-3,-197]]},
    {name:'大手門・水の手',short:'大手門',pts:[[0,62],[-3,-140]]}
  ],
  /* 小松山の本丸と後曲輪 */
  honmaru:{x0:-20,x1:20,z0:-124,z1:-62},

  slots:[
    {id:'onegoya',name:'御根小屋',pos:[-30,200],line:1,kind:'gate'},
    {id:'kuruma',name:'ふいご峠への道',pos:[76,190],line:1,kind:'gate'},
    {id:'omatsu',name:'大松山城',pos:[-2,-362],line:1,kind:'gate'},
    {id:'omatsu2',name:'大松山城 二の丸',pos:[-40,-366],line:1,kind:'ishigaki'},
    {id:'shimotaiko',name:'下太鼓の丸',pos:[5,150],line:2,kind:'gate'},
    {id:'fuigo',name:'ふいご峠',pos:[62,116],line:2,kind:'gate'},
    {id:'tenjin',name:'天神の丸',pos:[-1,-245],line:2,kind:'gate'},
    {id:'nakataiko',name:'中太鼓の丸',pos:[6,108],line:3,kind:'ishigaki'},
    {id:'nakataiko_g',name:'中太鼓の丸の入口',pos:[0,112],line:3,kind:'gate'},
    {id:'aihata',name:'相畑の曲輪',pos:[-5,-195],line:3,kind:'ishigaki'},
    {id:'otemon',name:'大手門',pos:[0,60],line:4,kind:'gate'},
    {id:'ote_y',name:'大手門の上の曲輪',pos:[-12,58],line:4,kind:'ishigaki'},
    {id:'sannomaru',name:'三の丸',pos:[0,28],line:4,kind:'gate'},
    {id:'ninomaru',name:'二の丸',pos:[0,-38],line:4,kind:'yagura'},
    {id:'mizunote',name:'水の手門',pos:[-3,-132],line:4,kind:'gate'},
    {id:'dobashi',name:'土橋',pos:[-3,-156],line:4,kind:'gate'}
  ],
  narrow:[{name:'御根小屋の門',pos:[-30,230],r:6},{name:'中太鼓の丸の木戸',pos:[5,118],r:5},{name:'大手門',pos:[0,66],r:5},{name:'黒門',pos:[-10,44],r:5},
    {name:'二の丸の門',pos:[-10,-20],r:5},{name:'本丸の木戸',pos:[0,-58],r:5},{name:'相畑城戸',pos:[-3,-172],r:5},{name:'水の手門',pos:[-3,-128],r:5}],
  /* 曲輪の入口・石段・坂道（崖や柵の裾にかかって「通れない」にならないよう、道の真ん中をあけておく） */
  gatePass:[[[-30,240],[-30,196]],[[-37,186],[-37,152]],[[-32,151],[0,151]],[[5,150],[5,112]],[[0,100],[0,58]],[[-10,52],[-10,36]],[[11,20],[11,2]],[[-10,-12],[-10,-28]],[[0,-50],[0,-66]],
    [[78,240],[78,130]],[[46,106],[12,106]],[[9,-440],[9,-380]],[[-1,-354],[-1,-326]],[[-1,-292],[-1,-210]],[[-3,-184],[-3,-120]],[[-15,-106],[-15,-96]]],

  enemy:{
    side:'毛利勢', scale:.74,
    trend:'3方向から攻める。南のふもとの兵は一本道の登城道を、東の兵はふいご峠から中太鼓の丸へ。北の大松山の尾根から来る兵は、天神の丸・相畑を抜けて後曲輪から本丸へ。最後の本隊は小早川隆景',
    boss:{name:'小早川隆景',skill:{kind:'yumi3',v:.25,name:'三本の矢',text:'敵の弓隊の攻撃1.25倍'}},
    waves:[
      {t:12, label:'先手', text:'毛利勢の先手が南のふもとに現れた',units:[
        {route:'ote',type:'yari',men:320},{route:'ote',type:'yumi',men:200,delay:12},{route:'fuigo',type:'kiba',men:240,delay:8}]},
      {t:130,label:'二の手', text:'二の手がふいご峠へ。北の大松山の尾根にも兵が回った',units:[
        {route:'fuigo',type:'yari',men:300},{route:'ote',type:'kiba',men:280},{route:'kita',type:'yari',men:280},{route:'fuigo',type:'yumi',men:200,delay:10}]},
      {t:250,label:'三の手', text:'三の手！宇喜多勢が大松山から攻め下ってくる',units:[
        {route:'kita',type:'kiba',men:260},{route:'ote',type:'yari',men:320},{route:'kita',type:'yumi',men:220,delay:8},{route:'fuigo',type:'yari',men:280}]},
      {t:370,label:'本隊', text:'小早川隆景の本隊、三本の矢の旗が迫る！',units:[
        {route:'ote',type:'yumi',men:420,boss:true,name:'小早川隆景 本隊',gen:'小早川隆景'},{route:'ote',type:'yari',men:300,delay:6},
        {route:'fuigo',type:'kiba',men:280},{route:'kita',type:'yari',men:300,delay:8}]}
    ]
  },
  keep:{x0:-140,x1:200,z0:-480,z1:430},
  camera:{x:10,z:20,yaw:-.3,dist:330,pitch:.9},
  next:{id:'aizu',castle:'会津若松城',url:'/32miya-aizu-castle/?battle',units:7,men:10100}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
