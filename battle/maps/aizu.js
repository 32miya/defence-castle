/* 戦国・城ディフェンス（仮） マップ設定データ: 会津若松城（鶴ヶ城・陸奥・第6ステージ）
   座標は鶴ヶ城さんぽの3Dマップ（江戸時代）と同じ。北が -z。
   まん中の本丸（高さ8m）のまわりに帯郭と水堀。北に北出丸（追手門）、西に西出丸、東は廊下橋で二の丸、南に南口。
   点と点のあいだの道は、エンジンが建物・石垣をよけて自動でつなぐ（堀は渡れるが遅い）。 */
(function(root){
const MAP={
  id:'aizu', stage:6, castle:'会津若松城', title:'会津の陣',
  era:'慶長五年（1600）、上杉景勝の会津を攻めようと諸大名が動いた年。もし伊達政宗の大軍が鶴ヶ城に攻め寄せていたら…という戦国風の仮想合戦。この城から鉄砲隊が加わる',
  goal:'日が暮れるまで天守を守り抜け', winText:'日が暮れた。鶴ヶ城は落ちず、伊達勢は兵を引いた',
  duration:540,
  sunset:{at:.7},

  /* 入口: 北の追手門・西出丸口・南口・三の丸口。部隊の数＝4＋3 */
  gates:[
    {id:'kita',name:'追手門（北）',pos:[-11,-162]},
    {id:'nishi',name:'西出丸口（西）',pos:[-209,1]},
    {id:'minami',name:'南口（南）',pos:[45,120]},
    {id:'higashi',name:'三の丸口（東）',pos:[239,5]}
  ],

  hint:'天守を取られたら負け。本丸へ入る道は4つ。北出丸・西出丸は本丸を守る出丸で、ここで食い止めれば本丸は安全。東の敵は二の丸から廊下橋をわたってくる。鉄砲隊は櫓の上から騎馬を狙おう。',
  general:{name:'上杉景勝',title:'越後の龍の跡継ぎ',skill:{kind:'charge',name:'上杉の精鋭',text:'騎馬隊がぶつかった最初の6秒、攻撃1.35倍'}},

  /* 前の城の軍勢がないとき（直接遊んだとき）の兵数 */
  army:[
    {id:'a1',gen:'上杉景勝',name:'景勝本隊',type:'yari',men:640,slot:'kurogane'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:520,slot:'tenshu'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:420,slot:'obiE_s'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:440,slot:'tsubakiT'}
  ],
  deploy:{yari:['kurogane','tenshu'],yumi:['hoshii','minami_y'],kiba:['nishiD_s','higashiT'],teppo:['tsubakiT']},

  routes:[
    {id:'kita',gate:'kita',name:'北出丸',pts:[[-11,-268],[-11,-240],[-11,-210],[-11,-190],[-11,-176],[-11,-150],[-11,-130],[10,-110],[21,-98],[21,-72],[21,-60],[0,-48],[-40,-50]]},
    {id:'nishi',gate:'nishi',name:'西出丸',pts:[[-438,0],[-400,0],[-330,0],[-260,0],[-222,1],[-196,1],[-160,1],[-120,1],[-98,1],[-90,-8],[-90,-20],[-86,-20],[-68,-20],[-55,-20],[-46,-36],[-46,-48]]},
    {id:'minami',gate:'minami',name:'南口',pts:[[45,338],[45,300],[45,250],[45,180],[45,142],[45,98],[30,85],[-2,84],[-2,80],[-2,62],[-2,50],[-10,0],[-40,-36],[-46,-48]]},
    {id:'higashi',gate:'higashi',name:'三の丸口',pts:[[308,5],[290,5],[270,5],[252,5],[226,5],[190,0],[160,-20],[130,-38],[125,-38],[97,-38],[90,-38],[84,-38],[66,-38],[55,-38],[10,-40],[-38,-50]]}
  ],
  links:[],

  lines:[
    {name:'外の土橋',short:'外の口',pts:[[-11,-165],[-210,1],[45,125],[240,5]]},
    {name:'北出丸・西出丸・二の丸',short:'出丸',pts:[[-11,-130],[-160,1],[45,105],[175,0]]},
    {name:'帯郭・廊下橋',short:'帯郭',pts:[[21,-90],[-104,1],[25,85],[110,-38]]},
    {name:'鉄門・本丸の口',short:'鉄門',pts:[[-76,-20],[21,-78],[-2,70],[75,-38]]},
    {name:'本丸（天守の前）',short:'本丸',pts:[[-48,-34],[-20,-46],[-25,-20],[-5,-44]]}
  ],
  honmaru:{x0:-62,x1:-30,z0:-72,z1:-44},   /* 天守（天守台）。本丸の中まで入られても、天守を取られなければ負けない */

  slots:[
    {id:'kitaG',name:'北出丸（追手門の内）',pos:[-11,-138],line:1,kind:'gate'},
    {id:'nishiG',name:'西出丸（入口の内）',pos:[-186,1],line:1,kind:'gate'},
    {id:'minamiG',name:'南口',pos:[45,106],line:1,kind:'gate'},
    {id:'higashiG',name:'二の丸（三の丸口の内）',pos:[214,5],line:1,kind:'gate'},
    {id:'kitaide_y',name:'北出丸の櫓',pos:[-48,-110],line:2,kind:'yagura'},
    {id:'nishide_y',name:'西出丸の櫓',pos:[-130,-52],line:2,kind:'yagura'},
    {id:'nino_y',name:'二の丸の櫓',pos:[136,-84],line:2,kind:'yagura'},
    {id:'nino_s',name:'二の丸の石垣',pos:[136,40],line:2,kind:'ishigaki'},
    {id:'tsubaki_s',name:'椿坂の下',pos:[21,-104],line:3,kind:'gate'},
    {id:'nishiD_s',name:'西中門の内（帯郭）',pos:[-88,8],line:3,kind:'gate'},
    {id:'obiS_s',name:'帯郭（南）',pos:[20,88],line:3,kind:'gate'},
    {id:'obiE_s',name:'帯郭（東・廊下橋の内）',pos:[88,-30],line:3,kind:'gate'},
    {id:'kurogane',name:'鉄門',pos:[-58,-20],line:4,kind:'gate'},
    {id:'tsubakiT',name:'椿坂の上',pos:[21,-62],line:4,kind:'gate'},
    {id:'minamiT',name:'本丸南の坂の上',pos:[-2,54],line:4,kind:'gate'},
    {id:'higashiT',name:'本丸東の坂の上',pos:[56,-38],line:4,kind:'gate'},
    {id:'tenshu',name:'天守の前',pos:[-46,-34],line:4,kind:'yagura'},
    {id:'hoshii',name:'干飯櫓',pos:[55,-58],line:4,kind:'yagura'},
    {id:'minami_y',name:'本丸南の石垣',pos:[40,58],line:4,kind:'ishigaki'}
  ],
  narrow:[{name:'追手門',pos:[-11,-152],r:6},{name:'西出丸口',pos:[-198,1],r:6},{name:'西中門',pos:[-100,1],r:6},{name:'鉄門',pos:[-70,-20],r:5},
    {name:'椿坂の門',pos:[21,-74],r:5},{name:'南口の門',pos:[45,100],r:6},{name:'本丸南門',pos:[-2,64],r:5},{name:'廊下橋の門',pos:[98,-38],r:5},
    {name:'本丸東門',pos:[68,-38],r:5},{name:'三の丸口',pos:[228,5],r:6}],
  gatePass:[[[-11,-182],[-11,-142]],[[21,-104],[21,-64]],[[-226,1],[-186,1]],[[-124,1],[-90,1]],[[-90,-20],[-62,-20]],[[-2,86],[-2,56]],[[45,146],[45,92]],
    [[128,-38],[90,-38]],[[88,-38],[58,-38]],[[256,5],[220,5]]],

  enemy:{
    side:'伊達勢', scale:.76,
    trend:'4方向から攻める。北の追手門と西出丸口の兵は出丸を抜けて本丸へ。南口の兵は帯郭から本丸南の坂へ。東の兵は二の丸から廊下橋をわたる。鉄砲隊が多く、最後の本隊は伊達政宗',
    boss:{name:'伊達政宗',skill:{kind:'typeAtk',type:'teppo',v:.3,name:'伊達の鉄砲隊',text:'敵の鉄砲隊の攻撃1.3倍'}},
    waves:[
      {t:12, label:'先手', text:'伊達勢の先手が北の追手門と西出丸口に現れた',units:[
        {route:'kita',type:'yari',men:320},{route:'nishi',type:'yumi',men:240},{route:'kita',type:'kiba',men:220,delay:10}]},
      {t:130,label:'二の手', text:'二の手が南口と三の丸口へ回った',units:[
        {route:'minami',type:'yari',men:300},{route:'higashi',type:'kiba',men:260},{route:'nishi',type:'yari',men:280},{route:'higashi',type:'yumi',men:220,delay:8}]},
      {t:250,label:'三の手', text:'三の手！鉄砲の音が四方から響く',units:[
        {route:'kita',type:'yumi',men:260},{route:'higashi',type:'yari',men:320},{route:'minami',type:'yumi',men:240},{route:'nishi',type:'kiba',men:260,delay:8}]},
      {t:370,label:'本隊', text:'伊達政宗の本隊！三日月の前立てが迫る',units:[
        {route:'kita',type:'kiba',men:440,boss:true,name:'伊達政宗 本隊',gen:'伊達政宗'},{route:'higashi',type:'yumi',men:300},
        {route:'nishi',type:'yari',men:300},{route:'minami',type:'yari',men:300,delay:8}]}
    ]
  },
  keep:{x0:-440,x1:310,z0:-270,z1:340},
  camera:{x:-10,z:-20,yaw:-.3,dist:330,pitch:.9},
  next:{id:'himeji',castle:'姫路城',url:'/32miya-himeji-castle/?battle',units:7}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
