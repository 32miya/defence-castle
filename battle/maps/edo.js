/* 戦国・城ディフェンス（仮） マップ設定データ: 江戸城（武蔵・隠しステージ）
   座標は江戸城さんぽの3Dマップ（江戸時代・寛永の天守）と同じ。北が -z。
   本丸（高さ16m）に寛永の天守。東に二の丸・三の丸、南東に中之門・百人番所の段、北に北の丸、西に西の丸と吹上。
   大手門・平川門・桔梗門・北桔橋門・西の丸大手から攻め寄せる。 */
(function(root){
/* 本丸の中 → 天守 */
const HON=[[52,30],[52,14],[52,-20],[52,-60],[52,-97],[40,-100],[-20,-130],[-50,-150]];   /* 本丸御殿の間（中庭の廊下）をぬけて天守台へ */
const MAP={
  id:'edo', stage:11, castle:'江戸城', title:'江戸城の戦い',
  era:'もしも天下の城・江戸城に、天下を狙う諸大名の大軍が攻め寄せていたら…という戦国風の仮想合戦（隠しステージ）',
  goal:'日が暮れるまで天守を守り抜け', winText:'日が暮れた。天下の城は落ちず、諸大名の連合軍は兵を引いた',
  duration:600,
  sunset:{at:.72},

  gates:[
    {id:'ote',name:'大手門（東）',pos:[318,100]},
    {id:'hirakawa',name:'平川門（北東）',pos:[240,-226]},
    {id:'kikyo',name:'桔梗門（南東）',pos:[154,158]},
    {id:'kita',name:'北桔橋門（北）',pos:[-6,-226]},
    {id:'nishi',name:'西の丸大手（西）',pos:[-227,182]}
  ],

  hint:'天守を取られたら負け。本丸へ上る道は、中雀門・汐見坂・梅林坂・北桔橋門の4つと、西の濠を泳いで石垣をよじ登る道。大手門と桔梗門の敵は中之門・中雀門で合わさる。',
  general:{name:'徳川家康',title:'天下人',skill:{kind:'kengo',v:.25,name:'天下の堅城',text:'持ち場で守る部隊の受ける損害が2割5分へる'}},

  army:[
    {id:'a1',gen:'徳川家康',name:'家康本隊',type:'yari',men:880,slot:'chujaku'},
    {id:'a2',gen:'',name:'足軽二番組',type:'yari',men:640,slot:'shiomi'},
    {id:'a3',gen:'',name:'弓組',type:'yumi',men:640,slot:'fujimi'},
    {id:'a4',gen:'',name:'騎馬組',type:'kiba',men:560,slot:'nino_c'}
  ],
  deploy:{yari:['kitahane','chujaku'],yumi:['fujimi','tenshu_y'],kiba:['shiomi'],teppo:['hon_w','bairin_y'],taiho:['tenshu_y']},

  routes:[
    {id:'ote',gate:'ote',name:'大手門',pts:[[552,100],[500,100],[420,100],[345,100],[332,100],[305,100],[260,100],[216,100],[200,100],[150,100],[100,100],[86,100],[66,96],[66,64],[66,50],[58,46],[50,40]].concat(HON)},
    {id:'kikyo',gate:'kikyo',name:'桔梗門',pts:[[154,326],[154,280],[154,220],[154,180],[154,168],[154,149],[154,120],[110,100],[86,100],[66,96],[66,64],[66,50],[58,46],[50,40]].concat(HON)},
    {id:'hirakawa',gate:'hirakawa',name:'平川門',pts:[[420,-322],[380,-300],[320,-260],[260,-246],[240,-240],[240,-212],[240,-150],[230,-80],[222,-57],[200,-57],[150,-80],[100,-97],[84,-97],[60,-97],[40,-100],[-20,-130],[-50,-150]]},
    {id:'kita',gate:'kita',name:'北桔橋門',pts:[[360,-322],[300,-310],[220,-297],[182,-297],[150,-297],[100,-285],[40,-260],[-6,-250],[-6,-240],[-6,-212],[-20,-190],[-40,-165]]},
    {id:'nishi',gate:'nishi',name:'西の丸',pts:[[-227,326],[-227,280],[-227,230],[-227,196],[-227,168],[-227,120],[-200,40],[-160,-20],[-124,-40],[-100,-45],[-80,-50],[-60,-70],[-50,-150]]}
  ],
  links:[],

  lines:[
    {name:'外の橋（大手橋・桔梗門・平川橋・北桔橋・西の丸大手橋）',short:'外の橋',pts:[[318,100],[154,158],[240,-226],[166,-297],[-227,182]]},
    {name:'三の丸・北の丸・西の丸',short:'三の丸',pts:[[208,100],[154,120],[240,-150],[60,-270],[-227,100]]},
    {name:'中之門・二の丸・北桔橋・乾濠',short:'中之門',pts:[[86,100],[211,-57],[-6,-226],[-110,-42]]},
    {name:'中雀門・汐見坂・本丸の北・西の石垣',short:'中雀門',pts:[[66,70],[72,-97],[-6,-205],[-75,-52]]}
  ],
  /* 天守（天守台とその前） */
  honmaru:{x0:-62,x1:-38,z0:-198,z1:-160},

  slots:[
    {id:'otemon',name:'大手門',pos:[296,100],line:1,kind:'gate'},
    {id:'kikyomon',name:'桔梗門',pos:[154,140],line:1,kind:'gate'},
    {id:'hirakawamon',name:'平川門',pos:[240,-200],line:1,kind:'gate'},
    {id:'kitanomaru',name:'北の丸',pos:[60,-275],line:1,kind:'gate'},
    {id:'nishimaru',name:'西の丸',pos:[-227,150],line:1,kind:'gate'},
    {id:'sannomon',name:'大手三之門（百人番所）',pos:[190,100],line:2,kind:'gate'},
    {id:'sanno',name:'三の丸',pos:[240,-120],line:2,kind:'gate'},
    {id:'nishi_y',name:'西の丸の櫓',pos:[-150,0],line:2,kind:'yagura'},
    {id:'nakanomon',name:'中之門',pos:[96,100],line:3,kind:'gate'},
    {id:'nino_c',name:'二の丸',pos:[150,-70],line:3,kind:'gate'},
    {id:'kitahane',name:'北桔橋門の内',pos:[-6,-200],line:3,kind:'gate'},
    {id:'hon_w',name:'本丸の西の石垣',pos:[-70,-60],line:3,kind:'ishigaki'},
    {id:'chujaku',name:'中雀門',pos:[56,50],line:4,kind:'gate'},
    {id:'shiomi',name:'汐見坂の上',pos:[52,-97],line:4,kind:'gate'},
    {id:'bairin_y',name:'梅林坂の上の櫓',pos:[50,-185],line:4,kind:'yagura'},
    {id:'fujimi',name:'富士見櫓',pos:[30,80],line:4,kind:'yagura'},
    {id:'tenshu_y',name:'天守の前',pos:[-40,-130],line:4,kind:'yagura'}
  ],
  narrow:[{name:'大手門',pos:[305,100],r:6},{name:'大手三之門',pos:[208,100],r:5},{name:'中之門',pos:[86,100],r:5},{name:'中雀門',pos:[66,66],r:5},
    {name:'桔梗門',pos:[154,149],r:5},{name:'平川門',pos:[240,-212],r:5},{name:'汐見坂の門',pos:[64,-97],r:5},{name:'北桔橋門',pos:[-6,-212],r:5}],
  gatePass:[[[52,32],[52,12]],[[52,-52],[52,-66]],[[340,100],[196,100]],[[100,100],[66,100]],[[66,100],[66,50]],[[154,172],[154,116]],[[240,-244],[240,-206]],[[224,-57],[196,-57]],[[86,-97],[56,-97]],
    [[88,-185],[56,-185]],[[-6,-246],[-6,-206]],[[-227,200],[-227,164]],[[184,-297],[146,-297]]],

  enemy:{
    side:'諸大名の連合軍', scale:.7,
    trend:'5方向から攻める。大手門と桔梗門の兵は中之門から中雀門へ、平川門の兵は三の丸・二の丸から汐見坂へ、北の兵は北の丸から北桔橋門へ、西の兵は西の丸から乾濠を泳いで本丸の石垣をよじ登る。最後の本隊は真田昌幸',
    boss:{name:'真田昌幸',skill:{kind:'kishu',name:'表裏比興の者',text:'大将の部隊の足が1.15倍'}},
    waves:[
      {t:12, label:'先手', text:'連合軍の先手が大手門と西の丸に現れた',units:[
        {route:'ote',type:'yari',men:320},{route:'nishi',type:'yumi',men:240},{route:'ote',type:'kiba',men:240,delay:10}]},
      {t:130,label:'二の手', text:'二の手が平川門と桔梗門へ。北の丸にも兵が回った',units:[
        {route:'hirakawa',type:'yari',men:300},{route:'kikyo',type:'yari',men:300},{route:'kita',type:'yumi',men:240},{route:'nishi',type:'kiba',men:240,delay:8}]},
      {t:250,label:'三の手', text:'三の手！江戸の町に鬨の声があがる',units:[
        {route:'ote',type:'yari',men:320},{route:'kita',type:'yari',men:300},{route:'hirakawa',type:'yumi',men:240},{route:'kikyo',type:'kiba',men:260,delay:8}]},
      {t:390,label:'本隊', text:'真田昌幸の本隊！六文銭の旗が迫る',units:[
        {route:'ote',type:'kiba',men:460,boss:true,name:'真田昌幸 本隊',gen:'真田昌幸'},{route:'hirakawa',type:'yari',men:320},
        {route:'nishi',type:'yari',men:320},{route:'kita',type:'yari',men:280,delay:8},{route:'kikyo',type:'yumi',men:260,delay:6}]}
    ]
  },
  keep:{x0:-340,x1:560,z0:-330,z1:330},
  camera:{x:40,z:-40,yaw:-.3,dist:330,pitch:.9},
  next:null
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
