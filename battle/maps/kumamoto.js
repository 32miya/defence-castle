/* 戦国・城ディフェンス（仮） マップ設定データ: 熊本城（肥後・第8ステージ）
   座標は熊本城さんぽの3Dマップ（江戸時代）と同じ。北が -z。
   茶臼山の台地に本丸（高さ30m・天守）。西に平左衛門丸・数寄屋丸・西出丸・二の丸、南に飯田丸・竹の丸、東に東竹之丸、北に加藤神社のあたり。
   石垣は「武者返し」。南の行幸坂、西の二の丸、北の坂、東の須戸口から攻め上がる。この城から大砲隊が加わる */
(function(root){
/* 西出丸 → 西櫓御門 → 数寄屋丸 → 平左衛門丸 → 本丸 */
const WEST=[[-124,40],[-110,30],[-92,28],[-80,28],[-70,20],[-62,2],[-62,-16],[-56,-24],[-30,-24],[0,-20]];
const MAP={
  id:'kumamoto', stage:8, castle:'熊本城', title:'銀杏城の戦い',
  era:'慶長年間、加藤清正が築いた難攻不落の城。もし島津の大軍が北上して攻め寄せていたら…という戦国風の仮想合戦。この城から大砲隊が加わる',
  goal:'日が暮れるまで本丸を守り抜け', winText:'日が暮れた。武者返しの石垣に阻まれ、島津勢は兵を引いた',
  duration:540,
  sunset:{at:.7},

  /* 入口: 南の行幸橋・西の二の丸・北の坂・東の須戸口。部隊の数＝4＋3 */
  gates:[
    {id:'minami',name:'行幸橋（南）',pos:[-124,121]},
    {id:'nishi',name:'二の丸（西）',pos:[-258,100]},
    {id:'kita',name:'加藤神社への坂（北）',pos:[-22,-152]},
    {id:'higashi',name:'須戸口（東）',pos:[44,116]}
  ],

  hint:'本丸へは、西の数寄屋丸から平左衛門丸へ・南の飯田丸から闇り通路・東竹之丸から頬当御門・北の石段の4つ。武者返しの石垣は登るのに時間がかかる。大砲は本丸の奥から、坂を登ってくる敵をまとめて崩そう。',
  general:{name:'加藤清正',title:'築城の名人',skill:{kind:'typeAtk',type:'yari',v:.25,name:'片鎌槍',text:'足軽隊の攻撃1.25倍'}},

  army:[
    {id:'a1',gen:'加藤清正',name:'清正本隊',type:'yari',men:720,slot:'heiza'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:560,slot:'uto'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:460,slot:'nishide'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:480,slot:'kurai_g'}
  ],
  deploy:{yari:['hoate_g','kitaHon_g'],yumi:['uto','kita_y'],kiba:['heiza'],teppo:['iida_g'],taiho:['tenshu']},

  routes:[
    {id:'minami',gate:'minami',name:'行幸坂',pts:[[-124,338],[-124,300],[-124,240],[-124,180],[-124,128],[-124,113],[-124,80],[-124,48]].concat(WEST)},
    {id:'nishi',gate:'nishi',name:'二の丸',pts:[[-438,90],[-400,100],[-340,110],[-290,118],[-258,112],[-258,90],[-258,72],[-230,30],[-190,-10],[-172,-10],[-150,-10],[-130,10]].concat(WEST)},
    {id:'kita',gate:'kita',name:'北の坂',pts:[[-268,-266],[-230,-250],[-180,-230],[-120,-205],[-70,-180],[-40,-165],[-22,-158],[-22,-150],[-22,-120],[-22,-96],[0,-80],[22,-66],[22,-60],[22,-46],[10,-30]]},
    {id:'higashi',gate:'higashi',name:'須戸口・東竹之丸',pts:[[44,338],[44,300],[44,240],[44,180],[44,128],[44,114],[44,96],[60,80],[76,80],[76,58],[76,40],[72,0],[68,-8],[50,-8],[30,-10]]},
    {id:'iida',gate:'higashi',name:'須戸口・飯田丸',pts:[[30,338],[30,300],[38,240],[44,180],[44,128],[44,114],[44,96],[20,86],[-10,84],[-10,58],[-4,40],[9,40],[9,20],[9,2],[5,-10]]}
  ],
  links:[],

  lines:[
    {name:'行幸橋・二の丸の坂・北の坂・須戸口',short:'外の口',pts:[[-124,118],[-258,96],[-22,-140],[44,108]]},
    {name:'西出丸・二の丸・竹の丸',short:'西出丸',pts:[[-124,56],[-161,-10],[-22,-100],[44,90]]},
    {name:'西櫓御門・北の郭・東竹之丸・飯田丸',short:'飯田丸',pts:[[-86,28],[0,-80],[76,52],[-10,56]]},
    {name:'数寄屋丸・頬当御門・闇り通路・北の石段',short:'本丸の門',pts:[[-62,-6],[60,-8],[9,24],[22,-56]]}
  ],
  /* 本丸（天守のある曲輪） */
  honmaru:{x0:-40,x1:50,z0:-50,z1:18},

  slots:[
    {id:'miyuki_g',name:'行幸坂の下',pos:[-124,100],line:1,kind:'gate'},
    {id:'ninoS_g',name:'二の丸の坂',pos:[-258,80],line:1,kind:'gate'},
    {id:'kitazaka_g',name:'加藤神社への坂',pos:[-22,-118],line:1,kind:'gate'},
    {id:'sudo_g',name:'須戸口門',pos:[44,100],line:1,kind:'gate'},
    {id:'nishide',name:'西出丸',pos:[-124,32],line:2,kind:'gate'},
    {id:'nishide_y',name:'西出丸の櫓',pos:[-140,-60],line:2,kind:'yagura'},
    {id:'dobashi_g',name:'西大手門',pos:[-146,-10],line:2,kind:'gate'},
    {id:'take_g',name:'竹の丸',pos:[44,78],line:2,kind:'gate'},
    {id:'kita_g',name:'北の郭（加藤神社）',pos:[-10,-86],line:3,kind:'gate'},
    {id:'kita_y',name:'北の郭の櫓',pos:[-60,-84],line:3,kind:'yagura'},
    {id:'nishiyagura',name:'西櫓御門',pos:[-72,28],line:3,kind:'gate'},
    {id:'higashi_g',name:'東竹之丸',pos:[76,46],line:3,kind:'gate'},
    {id:'iida_g',name:'飯田丸',pos:[-8,46],line:3,kind:'gate'},
    {id:'heiza',name:'平左衛門丸',pos:[-60,-24],line:4,kind:'gate'},
    {id:'uto',name:'宇土櫓',pos:[-72,-44],line:4,kind:'yagura'},
    {id:'hoate_g',name:'頬当御門',pos:[74,-8],line:4,kind:'gate'},
    {id:'kurai_g',name:'闇り通路の口',pos:[9,34],line:4,kind:'gate'},
    {id:'kitaHon_g',name:'北の石段の下',pos:[22,-68],line:4,kind:'gate'},
    {id:'tenshu',name:'天守',pos:[0,-24],line:4,kind:'yagura'}
  ],
  narrow:[{name:'行幸坂の門',pos:[-124,108],r:5},{name:'西大手門',pos:[-160,-10],r:5},{name:'西櫓御門',pos:[-86,28],r:5},{name:'数寄屋丸の門',pos:[-62,-4],r:5},
    {name:'加藤神社の門',pos:[-22,-100],r:5},{name:'北の石段の門',pos:[22,-52],r:4},{name:'須戸口門',pos:[44,106],r:5},{name:'東竹之丸の門',pos:[76,62],r:5},
    {name:'飯田丸の門',pos:[-10,62],r:5},{name:'頬当御門',pos:[60,-8],r:4},{name:'闇り通路',pos:[9,26],r:4}],
  gatePass:[[[-124,130],[-124,40]],[[-94,28],[-72,28]],[[-62,4],[-62,-20]],[[-258,114],[-258,66]],[[-176,-10],[-146,-10]],[[-22,-152],[-22,-90]],[[22,-64],[22,-40]],
    [[44,118],[44,90]],[[76,84],[76,52]],[[70,-8],[46,-8]],[[-10,88],[-10,52]],[[9,44],[9,-4]]],

  enemy:{
    side:'島津勢', scale:1.05,
    trend:'4方向から攻める。南の行幸坂と西の二の丸の兵は西出丸から数寄屋丸へ、北の兵は加藤神社の坂を、東の兵は須戸口から東竹之丸と飯田丸に分かれて本丸をねらう。大砲も引いてくる。最後の本隊は島津義弘',
    boss:{name:'島津義弘',skill:{kind:'yama',name:'鬼島津',text:'大将の部隊の士気が下がりにくい（0.5倍）'}},
    waves:[
      {t:12, label:'先手', text:'島津勢の先手が行幸橋と二の丸に現れた',units:[
        {route:'minami',type:'yari',men:320},{route:'nishi',type:'yumi',men:240},{route:'minami',type:'kiba',men:220,delay:10}]},
      {t:130,label:'二の手', text:'二の手が須戸口へ。北の坂にも兵が回った',units:[
        {route:'higashi',type:'yari',men:300},{route:'kita',type:'yari',men:260},{route:'iida',type:'yumi',men:240},{route:'nishi',type:'kiba',men:240,delay:8}]},
      {t:250,label:'三の手', text:'三の手！武者返しの石垣に取りつく',units:[
        {route:'minami',type:'yari',men:320},{route:'iida',type:'yari',men:300},{route:'kita',type:'yumi',men:220},{route:'higashi',type:'kiba',men:240,delay:8}]},
      {t:370,label:'本隊', text:'島津義弘の本隊！丸に十字の旗が迫る',units:[
        {route:'minami',type:'kiba',men:440,boss:true,name:'島津義弘 本隊',gen:'島津義弘'},{route:'higashi',type:'yari',men:320},
        {route:'nishi',type:'yari',men:300},{route:'kita',type:'yumi',men:260,delay:8}]}
    ]
  },
  keep:{x0:-440,x1:150,z0:-270,z1:340},
  camera:{x:-40,z:0,yaw:-.3,dist:330,pitch:.9},
  next:{id:'azuchi',castle:'安土城',url:'/32miya-32miya-azuchi-castle/?battle',units:7}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
