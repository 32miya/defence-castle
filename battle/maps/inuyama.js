/* 戦国・城ディフェンス（仮） マップ設定データ: 犬山城（第1ステージ）
   座標は犬山城さんぽの3Dマップと同じ（メートル相当。北が -z、木曽川は北側）。[x, z] の組で書く。
   他の城もこの書式で書けば、同じエンジンで遊べる。 */
(function(root){
const MAP={
  id:'inuyama', stage:1, castle:'犬山城', title:'犬山城の戦い',
  era:'天正十二年（1584）小牧・長久手の戦いにちなむ、戦国風の仮想合戦',
  goal:'日没まで持ちこたえろ', winText:'日が暮れ、敵は兵を引いた',
  duration:480,                      /* 守り抜く時間（秒）。指示中の停止時間は数えない */
  sunset:{at:.62},                   /* 時間の62%で夕方の空にする */

  /* 入口（門）。部隊の上限＝入口の数＋capBonus */
  gates:[
    {id:'ote',name:'大手（大手道）',pos:[0,94]},
    {id:'karamete',name:'搦手（西の急坂）',pos:[-62,-20]}
  ],
  capBonus:1,

  /* 味方の担当武将と特技 */
  general:{name:'織田信康',title:'犬山城主',skill:{kind:'kengo',v:.2,name:'後堅固の守り',text:'門・石垣・櫓の配置場所で守る部隊の損害を2割へらす'}},

  /* 最初の部隊（自動編成）。slot は最初に置く場所 */
  army:[
    {id:'a1',gen:'織田信康',name:'信康本隊',type:'yari',men:400,slot:'matsumon'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:300,slot:'matsu_s'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:250,slot:'kuromon'}
  ],

  /* 敵の進軍ルート（入口から本丸まで）。順にたどる */
  routes:[
    {id:'ote',gate:'ote',name:'大手',pts:[[0,138],[0,104],[0,88],[0,62],[0,48],[0,26],[0,6],[0,-12],[0,-30],[0,-43],[0,-55],[0,-67],[0,-74],[8,-77],[15,-80],[15,-92],[15,-105],[12,-112],[5,-124]]},
    {id:'karamete',gate:'karamete',name:'搦手',pts:[[-170,30],[-130,12],[-96,-4],[-72,-15],[-58,-22],[-44,-28],[-30,-32],[-37,-41],[-44,-49],[-46,-60],[-40,-74],[-31,-80],[-22,-84],[-8,-84],[6,-80],[15,-80],[15,-92],[15,-105],[12,-112],[5,-124]]}
  ],
  /* ルート以外に味方が通れる道（曲輪の中のつながり） */
  links:[[[0,-12],[14,-2]],[[0,-12],[-20,-26],[-44,-28]],[[0,-74],[-18,-74],[-22,-84]],[[15,-92],[0,-86],[-8,-84]],[[15,-110],[28,-110]]],

  /* 防衛線（外から順に）。pts はそれぞれのルートがその線を通る場所 */
  lines:[
    {name:'松の丸',short:'松の丸',pts:[[0,6],[-58,-22]]},
    {name:'黒門・樅の丸門',short:'黒門',pts:[[0,-43],[-44,-49]]},
    {name:'杉の丸（中門）',short:'杉の丸',pts:[[0,-67],[-22,-84]]},
    {name:'本丸門',short:'本丸門',pts:[[15,-105]]}
  ],
  /* ここに敵が入ったら負け */
  honmaru:{x0:-34,x1:34,z0:-162,z1:-109},

  /* 部隊を置ける場所。kind: gate（門・狭い）/ ishigaki（石垣の上：弓の射程1.25倍）/ yagura（櫓：弓の射程1.35倍） */
  slots:[
    {id:'matsumon',name:'松の丸門',pos:[0,-1],line:1,kind:'gate'},
    {id:'matsu_s',name:'松の丸 南の石垣',pos:[16,0],line:1,kind:'ishigaki'},
    {id:'matsu_w',name:'松の丸 西の石垣',pos:[-46,-27],line:1,kind:'ishigaki'},
    {id:'kuromon',name:'黒門',pos:[0,-38],line:2,kind:'gate'},
    {id:'momimon',name:'樅の丸門',pos:[-44,-55],line:2,kind:'gate'},
    {id:'nakamon',name:'中門',pos:[0,-72],line:3,kind:'gate'},
    {id:'sugi_yagura',name:'杉の丸 櫓',pos:[-18,-74],line:3,kind:'yagura'},
    {id:'honmon',name:'本丸門',pos:[15,-110],line:4,kind:'gate'},
    {id:'hon_yagura',name:'本丸 南東の櫓',pos:[28,-110],line:4,kind:'yagura'}
  ],
  /* 狭い門（騎馬が弱くなる・遅くなる） */
  narrow:[{pos:[0,94],r:9},{pos:[0,5],r:7},{pos:[0,-42],r:7},{pos:[0,-67],r:7},{pos:[-44,-50],r:7},{pos:[15,-106],r:7}],

  /* 敵: 3〜4波。最後の波に大将 */
  enemy:{
    side:'池田勢', trend:'足軽が多め。二の手から搦手（西の急坂）にも回り込み、最後の本隊は騎馬の大将が率いる',
    boss:{name:'池田恒興',skill:{kind:'kishu',name:'奇襲',text:'大将の部隊の足が速い'}},
    waves:[
      {t:12, label:'先手', text:'池田勢の先手が大手道に現れた',units:[
        {route:'ote',type:'yari',men:300},{route:'ote',type:'yari',men:250}]},
      {t:150,label:'二の手', text:'二の手が来る。搦手からも騎馬が回り込んだ',units:[
        {route:'ote',type:'yumi',men:200},{route:'ote',type:'yari',men:260},{route:'karamete',type:'kiba',men:200,delay:6}]},
      {t:290,label:'本隊', text:'池田恒興の本隊が攻め寄せる！',units:[
        {route:'ote',type:'kiba',men:380,boss:true,name:'池田恒興 本隊',gen:'池田恒興'},{route:'ote',type:'yari',men:260},
        {route:'karamete',type:'yari',men:240,delay:4},{route:'karamete',type:'yumi',men:160}]}
    ]
  },
  /* 合戦モードで残す範囲（これより外の建物・木は軽量化のために捨てる） */
  keep:{x0:-190,x1:150,z0:-215,z1:150},
  /* 最初のカメラ */
  camera:{x:-6,z:-40,yaw:-.55,dist:175,pitch:.9},
  next:{castle:'松本城',note:'準備中'}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
