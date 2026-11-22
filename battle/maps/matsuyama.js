/* 戦国・城ディフェンス（仮） マップ設定データ: 松山城（伊予・第4ステージ）
   座標は松山城さんぽの3Dマップ（江戸時代）と同じ。北が -z。
   勝山の山頂に本丸と本壇（天守）。西のふもとに二之丸、その先に堀でかこんだ三之丸（堀之内）。
   大手は 黒門 → 大手門 → 揚木戸門 → 戸無門 → 筒井門・隠門 → 太鼓門 と、門が折れ曲がって続く。北は古町口から乾門、東は東雲口と搦手（艮門）。
   点と点のあいだの道は、エンジンが建物・石垣・崖をよけて自動でつなぐ（堀は渡れるが遅い）。 */
(function(root){
/* 揚木戸門の上（太鼓櫓の下）→ 戸無門 → 筒井門 → 太鼓門 → 本丸広場 */
const TAIL=[[-36,8],[-35,2],[-35,-16],[-36,-30],[-38,-52],[-38,-60],[-38,-66],[-30,-72],[-22,-72],[-14,-72],[-6,-74],[0,-84]];
/* 乾門の内 → 本壇の西の下を通って → 本丸広場 */
const NORTH=[[-46,-236],[-45,-220],[-45,-160],[-30,-146],[-6,-142],[0,-130]];
/* 三之丸から二之丸の坂、黒門、大手門、揚木戸門 */
const OTE=[[-222,-56],[-190,-56],[-128,-60],[-124,-40],[-122,-36],[-116,-36],[-70,-36],[-63,-32],[-63,-20],[-63,10],[-63,17],[-56,17],[-46,17]].concat(TAIL);
const MAP={
  id:'matsuyama', stage:4, castle:'松山城', title:'勝山の戦い',
  era:'慶長五年（1600）関ヶ原の年、加藤嘉明の留守をねらって毛利勢が伊予に攻め寄せた。もし勝山の城に攻めかかっていたら…という戦国風の仮想合戦',
  goal:'日が暮れて夜襲をかけるまで守り抜け', winText:'日が暮れた。城から打って出た夜襲に、毛利勢は三津浜へ総崩れとなった',
  duration:540,
  sunset:{at:.7},

  /* 入口: 三之丸の堀の2つの橋と、勝山へ登る3つの口。部隊の数＝5＋3 */
  gates:[
    {id:'ote',name:'南堀の土橋（大手）',pos:[-329,167]},
    {id:'nishi',name:'西堀の土橋',pos:[-465,-16]},
    {id:'furumachi',name:'古町口（北）',pos:[-122,-200]},
    {id:'shinonome',name:'東雲口（東）',pos:[138,24]},
    {id:'karamete',name:'搦手（艮門）',pos:[107,-258]}
  ],

  hint:'隠門（伏兵）で戦う部隊は攻撃1.3倍。山の北の乾門・艮門は本丸に近いので、手薄にしないこと。',
  general:{name:'加藤嘉明',title:'賤ヶ岳の七本槍',skill:{kind:'yari7',v:.25,name:'七本槍の武勇',text:'足軽隊の攻撃1.25倍'}},

  /* 前の城の軍勢がないとき（直接遊んだとき）の兵数。彦根城を守り抜いたときのおよその兵数 */
  army:[
    {id:'a1',gen:'加藤嘉明',name:'嘉明本隊',type:'yari',men:600,slot:'tonamon'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:460,slot:'taikoshita'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:380,slot:'choja'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:360,slot:'inui'}
  ],

  /* 兵の総数は上の合計。「門の数＋3」部隊に自動で分けて、兵種ごとにこの順で配置する */
  deploy:{yari:['tonamon','inui','inui_naka'],yumi:['taikoshita','hondan_w','tatsumi'],kiba:['kakure','choja']},

  routes:[
    {id:'ote',gate:'ote',name:'大手',pts:[[-329,228],[-329,200],[-329,180],[-329,167],[-329,150],[-329,140],[-260,-56]].concat(OTE)},
    {id:'nishi',gate:'nishi',name:'西堀',pts:[[-570,-16],[-520,-16],[-490,-16],[-465,-16],[-440,-16],[-260,-56]].concat(OTE)},
    /* 堀を渡る兵: 北堀を渡って三之丸へ */
    {id:'hori',gate:'nishi',name:'北堀',pts:[[-389,-330],[-389,-290],[-389,-260],[-389,-229],[-389,-200],[-389,-40],[-260,-45]].concat(OTE)},
    {id:'furumachi',gate:'furumachi',name:'古町口',pts:[[-210,-345],[-195,-318],[-170,-280],[-140,-200],[-122,-190],[-122,-226],[-115,-236],[-110,-236],[-58,-236],[-52,-236]].concat(NORTH)},
    {id:'shinonome',gate:'shinonome',name:'東雲口',pts:[[250,24],[222,24],[190,24],[160,24],[138,24],[90,24],[70,12],[50,12],[-22,12],[-30,10]].concat(TAIL)},
    {id:'karamete',gate:'karamete',name:'搦手',pts:[[190,-345],[175,-322],[160,-300],[130,-275],[107,-258],[86,-240],[78,-236],[38,-236],[32,-236],[20,-244],[-20,-244]].concat(NORTH)}
  ],
  links:[],

  lines:[
    {name:'三之丸の堀・山の口',short:'山の口',pts:[[-329,160],[-450,-16],[-389,-215],[-128,-195],[138,24],[107,-258]]},
    {name:'二之丸・長者ヶ平・北の郭',short:'二之丸',pts:[[-190,-56],[70,12],[-118,-232],[66,-236]]},
    {name:'大手門・乾門・艮門',short:'大手門',pts:[[-66,-36],[-30,11],[-56,-236],[36,-236]]},
    {name:'戸無門・筒井門・本丸の北',short:'筒井門',pts:[[-36,-30],[-45,-190]]}
  ],
  /* 本丸広場と本壇（天守のある段） */
  honmaru:[{x0:-18,x1:26,z0:-140,z1:-24},{x0:-38,x1:34,z0:-216,z1:-162},{x0:14,x1:34,z0:-162,z1:-150}],

  slots:[
    {id:'minamibashi',name:'南堀の土橋',pos:[-329,146],line:1,kind:'gate'},
    {id:'nishibashi',name:'西堀の土橋',pos:[-440,-16],line:1,kind:'gate'},
    {id:'furumachi_g',name:'古町口の坂',pos:[-122,-175],line:1,kind:'gate'},
    {id:'shinonome_g',name:'東雲口の坂',pos:[118,24],line:1,kind:'gate'},
    {id:'karamete_g',name:'搦手の口',pos:[100,-252],line:1,kind:'gate'},
    {id:'ninosaka',name:'二之丸の坂の上',pos:[-186,-56],line:2,kind:'gate'},
    {id:'ninomaru_w',name:'二之丸の石垣',pos:[-180,-72],line:2,kind:'ishigaki'},
    {id:'choja',name:'長者ヶ平',pos:[66,14],line:2,kind:'gate'},
    {id:'kita',name:'北の郭',pos:[-120,-236],line:2,kind:'gate'},
    {id:'ushisaka',name:'艮門の坂',pos:[66,-236],line:2,kind:'gate'},
    {id:'otemon',name:'大手門',pos:[-64,-34],line:3,kind:'gate'},
    {id:'agekido',name:'揚木戸門',pos:[-62,16],line:3,kind:'gate'},
    {id:'taikoshita',name:'太鼓櫓の下の石垣',pos:[-32,16],line:3,kind:'ishigaki'},
    {id:'inui',name:'乾門',pos:[-46,-236],line:3,kind:'gate'},
    {id:'ushitora',name:'艮門',pos:[26,-236],line:3,kind:'gate'},
    {id:'tonamon',name:'戸無門',pos:[-35,-24],line:4,kind:'gate'},
    {id:'tsutsui',name:'筒井門',pos:[-38,-68],line:4,kind:'gate'},
    /* 隠門: 筒井門を破った敵の横から不意を突く門。ここで戦うと攻撃1.3倍 */
    {id:'kakure',name:'隠門（伏兵）',pos:[-25,-66],line:4,kind:'gate',ambush:1.3},
    {id:'taikomon',name:'太鼓門',pos:[-8,-72],line:4,kind:'gate'},
    {id:'tatsumi',name:'巽櫓',pos:[20,-34],line:4,kind:'yagura'},
    {id:'inui_naka',name:'本丸の北',pos:[-45,-196],line:4,kind:'gate'},
    {id:'hondan_w',name:'本壇の石垣（天守）',pos:[-32,-196],line:4,kind:'ishigaki'}
  ],
  narrow:[{name:'黒門',pos:[-120,-36],r:6},{name:'大手門',pos:[-70,-36],r:5},{name:'揚木戸門',pos:[-63,10],r:5},{name:'戸無門',pos:[-35,-15.6],r:5},
    {name:'筒井門',pos:[-38,-60],r:5},{name:'太鼓門',pos:[-18,-72],r:5},{name:'乾門',pos:[-52,-236],r:5},{name:'艮門',pos:[32,-236],r:5}],
  /* 門の通り道と石段・坂道（石垣の裾にかかって「通れない」にならないよう、道の真ん中をあけておく） */
  gatePass:[[[-329,186],[-329,138]],[[-492,-16],[-436,-16]],[[-224,-56],[-186,-56]],[[-124,-36],[-64,-36]],[[-63,-40],[-63,20]],[[-64,17],[-40,17]],
    [[-35,8],[-35,-24]],[[-38,-50],[-38,-70]],[[-25,-52],[-25,-68]],[[-38,-72],[-8,-72]],[[-122,-84],[-122,-226]],[[-122,-236],[-44,-236]],
    [[138,24],[86,24]],[[88,16],[-30,12]],[[86,-236],[24,-236]],[[0,-157],[18,-157]]],

  enemy:{
    side:'毛利勢', scale:.9,
    trend:'6方向から攻める。南と西の橋、北堀を渡る兵は三之丸から二之丸、黒門・大手門・揚木戸門と門をひとつずつ破って筒井門へ。東雲口の兵は長者ヶ平から戸無門へ。古町口と搦手の兵は山の北の乾門・艮門から本丸をねらう。最後の本隊は村上水軍の村上元吉',
    boss:{name:'村上元吉',skill:{kind:'suigun',name:'村上水軍',text:'敵は堀を渡っても遅くならず、弱くならない'}},
    waves:[
      {t:12, label:'先手', text:'毛利勢の先手が南の橋と東雲口に現れた',units:[
        {route:'ote',type:'yari',men:300},{route:'shinonome',type:'yari',men:280},{route:'furumachi',type:'kiba',men:200,delay:10}]},
      {t:130,label:'二の手', text:'二の手が西の橋と東雲口へ。山の北、搦手にも兵が回った',units:[
        {route:'nishi',type:'yumi',men:220},{route:'ote',type:'kiba',men:260},{route:'karamete',type:'yari',men:280},{route:'shinonome',type:'yumi',men:200}]},
      {t:250,label:'三の手', text:'三の手！古町口からも登ってくる',units:[
        {route:'furumachi',type:'yari',men:300},{route:'ote',type:'yari',men:300},{route:'karamete',type:'yumi',men:200},{route:'shinonome',type:'kiba',men:240,delay:8}]},
      {t:370,label:'本隊', text:'村上元吉の本隊！水軍の兵が北堀を泳ぎ渡ってくる',units:[
        {route:'ote',type:'kiba',men:420,boss:true,name:'村上元吉 本隊',gen:'村上元吉'},{route:'hori',type:'yari',men:280},
        {route:'furumachi',type:'yari',men:260},{route:'shinonome',type:'yari',men:280,delay:8}]}
    ]
  },
  keep:{x0:-580,x1:262,z0:-356,z1:240},
  camera:{x:-110,z:-60,yaw:-.35,dist:380,pitch:.9},
  next:{id:'bitchu',castle:'備中松山城',note:'準備中'}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
