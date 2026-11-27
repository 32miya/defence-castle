/* 戦国・城ディフェンス（仮） マップ設定データ: 安土城（近江・第9ステージ）
   座標は安土城さんぽの3Dマップ（信長の時代）と同じ。北が -z。まわりは琵琶湖の内湖。
   山の上に天主（天主台の下 高さ65m）。南の大手道はまっすぐの石段から、つづら折り → 黒金門 → 本丸 → 天主台。
   西は百々橋口から摠見寺を通って大手道に合わさる。東は七曲口、北は湖から上がる搦手。 */
(function(root){
/* つづら折り → 信忠邸 → 黒金門 → 本丸 → 天主台 */
const TAIL=[[-30,-63],[-41,-68],[-41,-82],[-48,-94],[-55,-98],[-55,-104],[-55,-114],[-52,-128],[-44,-139],[-36,-139],[-28,-137],[-20,-137],[0,-146],[0,-162],[0,-172]];
const MAP={
  id:'azuchi', stage:9, castle:'安土城', title:'安土の戦い',
  era:'天正十年（1582）、本能寺の変の直後。もし明智光秀の軍勢が、信長の待つ安土城に攻め寄せていたら…という戦国風の仮想合戦',
  goal:'日が暮れるまで天主を守り抜け', winText:'日が暮れた。天主は落ちず、明智勢は湖の向こうへ兵を引いた',
  duration:540,
  sunset:{at:.7},

  gates:[
    {id:'ote',name:'大手口（南）',pos:[0,60]},
    {id:'momo',name:'百々橋口（西）',pos:[-107,60]},
    {id:'nana',name:'七曲口（東）',pos:[91,60]},
    {id:'kita',name:'搦手（湖の北）',pos:[-111,-263]}
  ],

  hint:'大手道は広くまっすぐだが、つづら折りから黒金門は狭い。百々橋口の敵は摠見寺から大手道へ合わさる。信長の鉄砲で、石段を登る敵を上から撃ち下ろそう。天主台を取られたら負け。',
  general:{name:'織田信長',title:'天下布武',skill:{kind:'teppo',name:'鉄砲三段撃ち',text:'弓隊がすべて鉄砲隊になる'}},

  army:[
    {id:'a1',gen:'織田信長',name:'信長本隊',type:'yari',men:760,slot:'kuroganemon'},
    {id:'a2',gen:'',name:'弓組',type:'yumi',men:580,slot:'nobutada'},
    {id:'a3',gen:'',name:'騎馬組',type:'kiba',men:480,slot:'honmaru'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:500,slot:'tsuzura'}
  ],
  deploy:{yari:['kuroganemon','tsuzura'],yumi:['nobutada','san_y'],kiba:['honmaru'],teppo:['ieyasu_y'],taiho:['nino_y']},

  routes:[
    {id:'ote',gate:'ote',name:'大手道',pts:[[0,252],[0,200],[0,150],[0,100],[0,66],[0,46],[0,40],[0,0],[0,-40],[0,-60],[0,-65],[-10,-63]].concat(TAIL)},
    {id:'momo',gate:'momo',name:'百々橋口',pts:[[-107,252],[-107,200],[-107,150],[-107,100],[-107,66],[-107,52],[-107,0],[-107,-46],[-103,-62],[-80,-63],[-48,-63]].concat(TAIL)},
    {id:'nana',gate:'nana',name:'七曲口',pts:[[91,252],[91,200],[91,150],[91,100],[91,66],[60,50],[20,46],[0,42],[0,0],[0,-40],[0,-60],[0,-65],[-10,-63]].concat(TAIL)},
    {id:'kita',gate:'kita',name:'搦手',pts:[[-30,-288],[-80,-280],[-111,-263],[-90,-220],[-60,-200],[-40,-187],[-23,-187],[-10,-180]]}
  ],
  links:[],

  lines:[
    {name:'山のふもと（大手口・百々橋口・七曲口・湖岸）',short:'ふもと',pts:[[0,52],[-107,46],[91,66],[-111,-263]]},
    {name:'大手道・摠見寺・七曲・三の丸の下',short:'大手道',pts:[[0,-20],[-103,-62],[60,50],[-80,-210]]},
    {name:'つづら折り・信忠邸',short:'つづら折り',pts:[[-41,-75],[-60,-200]]},
    {name:'黒金門・本丸',short:'黒金門',pts:[[-44,-139],[-30,-187]]}
  ],
  /* 天主台の下（天主） */
  honmaru:{x0:-22,x1:22,z0:-208,z1:-164},

  slots:[
    {id:'otemon',name:'大手口',pos:[0,30],line:1,kind:'gate'},
    {id:'momo_g',name:'百々橋口の坂',pos:[-107,20],line:1,kind:'gate'},
    {id:'nana_g',name:'七曲口の坂',pos:[100,30],line:1,kind:'gate'},
    {id:'kita_g',name:'湖岸の搦手口',pos:[-100,-240],line:1,kind:'gate'},
    {id:'hide',name:'伝羽柴秀吉邸',pos:[-27,-14],line:2,kind:'ishigaki'},
    {id:'toshiie',name:'伝前田利家邸',pos:[26,8],line:2,kind:'ishigaki'},
    {id:'soken',name:'摠見寺',pos:[-100,-70],line:2,kind:'yagura'},
    {id:'ieyasu_y',name:'伝徳川家康邸',pos:[27,-50],line:2,kind:'ishigaki'},
    {id:'tsuzura',name:'つづら折り',pos:[-40,-75],line:3,kind:'gate'},
    {id:'nobutada',name:'伝織田信忠邸',pos:[-47,-92],line:3,kind:'ishigaki'},
    {id:'kuroganemon',name:'黒金門',pos:[-50,-132],line:4,kind:'gate'},
    {id:'honmaru',name:'本丸',pos:[10,-146],line:4,kind:'gate'},
    {id:'san_y',name:'三の丸の石垣',pos:[-45,-180],line:4,kind:'ishigaki'},
    {id:'nino_y',name:'二の丸の石垣',pos:[43,-182],line:4,kind:'ishigaki'}
  ],
  narrow:[{name:'大手門',pos:[0,46],r:6},{name:'百々橋口の門',pos:[-107,46],r:5},{name:'つづら折りの門',pos:[-41,-80],r:4},{name:'黒金門',pos:[-40,-139],r:4},
    {name:'本丸の門',pos:[-24,-137],r:4},{name:'天主台の石段',pos:[0,-166],r:3},{name:'三の丸の門',pos:[-23,-187],r:4}],
  gatePass:[[[0,70],[0,-62]],[[-8,-63],[-32,-63]],[[-41,-66],[-41,-84]],[[-50,-92],[-55,-98]],[[-55,-98],[-55,-118]],[[-46,-139],[-18,-137]],[[0,-160],[0,-172]],
    [[-107,70],[-107,-48]],[[-82,-63],[-46,-63]],[[-30,-187],[-16,-187]],[[16,-187],[30,-187]]],

  enemy:{
    side:'明智勢', scale:1.3,
    trend:'4方向から攻める。大手道・百々橋口・七曲口の兵は、つづら折りから黒金門へ（七曲口の兵は大手口で大手道に合わさる）。湖岸の兵は三の丸の下から天主台をねらう。鉄砲と大砲が多い。最後の本隊は明智光秀',
    boss:{name:'明智光秀',skill:{kind:'typeAtk',type:'teppo',v:.25,name:'明智の鉄砲',text:'敵の鉄砲隊の攻撃1.25倍'}},
    waves:[
      {t:12, label:'先手', text:'明智勢の先手が大手口と百々橋口に現れた',units:[
        {route:'ote',type:'yari',men:320},{route:'momo',type:'yumi',men:240},{route:'ote',type:'kiba',men:220,delay:10}]},
      {t:130,label:'二の手', text:'二の手が七曲口へ。湖からも舟で兵が上がった',units:[
        {route:'nana',type:'yari',men:300},{route:'kita',type:'yari',men:240},{route:'ote',type:'yumi',men:260},{route:'momo',type:'kiba',men:240,delay:8}]},
      {t:250,label:'三の手', text:'三の手！石段に敵があふれる',units:[
        {route:'ote',type:'yari',men:320},{route:'momo',type:'yari',men:300},{route:'nana',type:'yumi',men:240},{route:'kita',type:'yumi',men:200,delay:8}]},
      {t:370,label:'本隊', text:'明智光秀の本隊！水色桔梗の旗が迫る',units:[
        {route:'ote',type:'kiba',men:440,boss:true,name:'明智光秀 本隊',gen:'明智光秀'},{route:'nana',type:'yari',men:320},
        {route:'momo',type:'yari',men:300},{route:'kita',type:'yari',men:260,delay:8}]}
    ]
  },
  keep:{x0:-215,x1:170,z0:-290,z1:255},
  camera:{x:-10,z:-80,yaw:-.3,dist:330,pitch:.9},
  next:{id:'osaka',castle:'大坂城',url:'/32miya-osaka-castle/?battle',units:8}
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
