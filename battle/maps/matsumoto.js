/* 戦国・城ディフェンス（仮） マップ設定データ: 松本城（第2ステージ）
   座標は松本城さんぽの3Dマップ（江戸時代）と同じ。北が -z。平城なので高低差はなく、堀（水）が通れない所になる。
   点と点のあいだの道は、エンジンが建物・塀・堀をよけて自動でつなぐ。 */
(function(root){
const MAP={
  id:'matsumoto', stage:2, castle:'松本城', title:'深志城の戦い',
  era:'天文十九年（1550）武田晴信（信玄）が小笠原長時の深志城を攻めた戦いにちなむ、戦国風の仮想合戦',
  goal:'援軍の到着まで守り抜け', winText:'小笠原の援軍が駆けつけ、武田勢は兵を引いた',
  duration:480,

  /* 入口: 南の大手門と、東から太鼓門へ向かう道。部隊の上限＝入口2＋2 */
  gates:[
    {id:'ote',name:'大手門（南）',pos:[-26.5,177]},
    {id:'higashi',name:'北東の口（外堀ぞいの道）',pos:[196,-190]},
    {id:'nishi',name:'西の堀（堀を渡って塀を越える）',pos:[-200,0]}
  ],
  capBonus:1,

  general:{name:'小笠原長時',title:'信濃守護',skill:{kind:'kyuba',v:.15,name:'小笠原流弓馬術',text:'弓隊と騎馬隊の攻撃が1.15倍'}},

  /* 前の城の軍勢がないとき（直接遊んだとき）の部隊。犬山城を守り抜いたときのおよその兵数 */
  army:[
    {id:'a1',gen:'小笠原長時',name:'長時本隊',type:'yari',men:520,slot:'taikomon'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:390,slot:'taiko_s'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:320,slot:'kuromon'}
  ],
  /* 前の城から持ち越した軍勢を置く場所（兵種ごとに順に使う） */
  deploy:{yari:['taikomon','hon_w','otemon'],yumi:['taiko_s','hon_w','hon_e'],kiba:['kuromae','taikomon','otemon']},

  routes:[
    {id:'ote',gate:'ote',name:'大手',pts:[[-20,246],[-20,232],[-20,207],[-26.5,200],[-26.5,170],[-17,166],[-17,150],[196,146],[196,44],[190,40],[150,40],[112,17],[58,17],[40,17]]},
    /* 西: 外堀を渡り、二の丸の塀をよじ登り、内堀を渡って本丸の塀へ（堀は速さ半分、塀はさらに遅い） */
    {id:'nishi',gate:'nishi',name:'西の堀',pts:[[-235,0],[-185,0],[-100,4],[-60,4]]},
    {id:'higashi',gate:'higashi',name:'北東',pts:[[196,-198],[196,-150],[196,44],[190,40],[150,40],[112,17],[58,17],[40,17]]}
  ],
  links:[],

  lines:[
    {name:'大手門',short:'大手門',pts:[[-17,160]]},
    {name:'二の丸（太鼓門・西の外堀）',short:'二の丸',pts:[[160,40],[-150,2]]},
    {name:'本丸（黒門・西の内堀）',short:'本丸',pts:[[69,17],[-80,4]]}
  ],
  /* 本丸（黒門の内側）に入られたら負け */
  honmaru:{x0:-64,x1:64,z0:-60,z1:65},

  slots:[
    {id:'otemon',name:'大手門（枡形の内）',pos:[-17,151],line:1,kind:'gate'},
    {id:'taikomon',name:'太鼓門',pos:[151,40],line:2,kind:'gate'},
    {id:'taiko_s',name:'太鼓門 南の石垣',pos:[150,26],line:2,kind:'ishigaki'},
    {id:'ninomaru',name:'二の丸 御殿前',pos:[128,6],line:2,kind:'ishigaki'},
    {id:'kuromae',name:'黒門前の土橋',pos:[110,17],line:3,kind:'gate'},
    {id:'kuromon',name:'黒門',pos:[60,17],line:3,kind:'gate'},
    {id:'hon_e',name:'本丸 東の土塁',pos:[60,34],line:3,kind:'ishigaki'},
    {id:'ni_w',name:'二の丸 西の塀',pos:[-140,4],line:2,kind:'ishigaki'},
    {id:'hon_w',name:'本丸 西の塀',pos:[-58,4],line:3,kind:'ishigaki'}
  ],
  narrow:[{name:'大手門',pos:[-17,160],r:6},{name:'太鼓門',pos:[160,40],r:6},{name:'黒門',pos:[69,17],r:6}],
  gatePass:[[[-26.5,201],[-26.5,170]],[[-17,167],[-17,150]],[[196,40],[150,40]],[[114,17],[56,17]]],

  enemy:{
    side:'武田勢', scale:.85,
    trend:'騎馬が多い。大手門（南）と北東の外堀ぞいから太鼓門へ。二の手からは西の堀を渡り塀をよじ登る兵も来る。本隊は武田晴信（信玄）の騎馬',
    boss:{name:'武田晴信（信玄）',skill:{kind:'yama',name:'動かざること山の如し',text:'大将の部隊は士気が下がりにくい'}},
    waves:[
      {t:12, label:'先手', text:'武田の先手が大手と北東の外堀ぞいに現れた',units:[
        {route:'ote',type:'yari',men:320},{route:'ote',type:'kiba',men:260},{route:'higashi',type:'yari',men:300}]},
      {t:140,label:'二の手', text:'武田の騎馬が北東から押し寄せる。西の堀にも兵が回り込んだ',units:[
        {route:'higashi',type:'kiba',men:300},{route:'higashi',type:'yumi',men:220},{route:'ote',type:'yari',men:320},{route:'nishi',type:'yari',men:260,delay:30}]},
      {t:285,label:'本隊', text:'武田晴信の本隊、風林火山の旗が迫る！',units:[
        {route:'ote',type:'kiba',men:440,boss:true,name:'武田晴信 本隊',gen:'武田晴信'},{route:'ote',type:'kiba',men:300},
        {route:'higashi',type:'yari',men:340},{route:'higashi',type:'kiba',men:300},{route:'nishi',type:'yari',men:280,delay:20},{route:'nishi',type:'yumi',men:200,delay:26}]}
    ]
  },
  keep:{x0:-200,x1:305,z0:-200,z1:252},
  camera:{x:90,z:60,yaw:-.35,dist:260,pitch:.9},
  next:{id:'hikone',castle:'彦根城',url:'/32miya-32miya-hikone-castle/?battle',cap:5}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
