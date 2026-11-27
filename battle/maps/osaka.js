/* 戦国・城ディフェンス（仮） マップ設定データ: 大坂城（摂津・第10ステージ＝最終）
   座標は大阪城さんぽの3Dマップ（太閤の時代）と同じ。北が -z。
   本丸のまん中に一段高い詰ノ丸（天守）。内堀・外堀（二の丸のまわり）・三の丸の堀、いちばん外は惣構（西の東横堀川・東の猫間川・南の空堀と土塁）。
   北は大川。徳川の大軍が四方から押し寄せる、最後の合戦 */
(function(root){
/* 玉造口 → 二の丸 → 桜門 → 本丸 → 詰ノ丸 */
const SOUTH=[[200,300],[155,246],[155,211],[150,180],[80,140],[0,125],[0,116],[0,84],[0,40],[1,5],[1,-14],[8,-36]];
const MAP={
  id:'osaka', stage:10, castle:'大坂城', title:'大坂の陣',
  era:'慶長十九年（1614）冬、天下の徳川家康が二十万の大軍で豊臣の大坂城を囲んだ。最後の合戦',
  goal:'日が暮れるまで詰ノ丸（天守）を守り抜け', winText:'日が暮れた。惣構は破れず、徳川勢は兵を引いた。大坂城は落ちなかった',
  duration:600,
  sunset:{at:.72},

  /* 入口: 惣構の南（二か所）・西の東横堀川・北の大川・東の猫間川。部隊の数＝5＋3 */
  gates:[
    {id:'minami',name:'惣構の南（大手）',pos:[-60,860]},
    {id:'minamiE',name:'惣構の南東（空堀）',pos:[300,860]},
    {id:'nishi',name:'東横堀川（西）',pos:[-608,4]},
    {id:'kita',name:'京橋口（北）',pos:[-201,-250]},
    {id:'higashi',name:'猫間川（東）',pos:[566,5]}
  ],

  hint:'詰ノ丸（天守のある一段高い曲輪）を取られたら負け。南の敵は三の丸から玉造口、西の敵は大手口、北の敵は京橋口・青屋口から極楽橋、東の敵は堀を渡って本丸へ。徳川の大砲は門を壊すので、門を閉ざすより落石と火矢で。',
  general:{name:'真田信繁',title:'日本一の兵',skill:{kind:'akazonae',v:.2,name:'真田の赤備え',text:'騎馬隊の攻撃1.2倍、士気が下がりにくい'}},

  army:[
    {id:'a1',gen:'真田信繁',name:'信繁本隊',type:'kiba',men:820,slot:'tama'},
    {id:'a2',gen:'',name:'足軽組',type:'yari',men:800,slot:'sakura'},
    {id:'a3',gen:'',name:'弓組',type:'yumi',men:600,slot:'tsume_s'},
    {id:'a4',gen:'',name:'足軽二番組',type:'yari',men:540,slot:'gokuraku'}
  ],
  deploy:{yari:['sakura','gokuraku','tama'],yumi:['tsume_s','tsume_n'],kiba:['nino_s','nino_n'],teppo:['ote_g','higashi_y'],taiho:['tsume_c']},

  routes:[
    {id:'minami',gate:'minami',name:'惣構の南',pts:[[-60,895],[-60,876],[-60,846],[-60,800],[-60,700],[-60,600],[-60,500],[-60,460],[-60,428],[-60,380],[60,330]].concat(SOUTH)},
    {id:'minamiE',gate:'minamiE',name:'惣構の南東',pts:[[300,895],[300,876],[300,846],[300,800],[300,700],[300,600],[300,500],[300,460],[300,428],[260,360]].concat(SOUTH)},
    {id:'nishi',gate:'nishi',name:'大手口',pts:[[-636,4],[-622,4],[-594,4],[-500,4],[-400,50],[-300,107],[-266,107],[-231,107],[-180,120],[-100,135],[-40,128],[0,125],[0,116],[0,84],[0,40],[1,5],[1,-14],[8,-36]]},
    {id:'kita',gate:'kita',name:'京橋口',pts:[[-201,-322],[-201,-300],[-201,-270],[-201,-256],[-201,-221],[-180,-190],[-100,-160],[-24,-140],[-24,-131],[-24,-99],[-30,-90],[-55,-86],[-57,-6],[-52,-2],[-49,-4],[-49,-16],[-44,-20]]},
    {id:'aoya',gate:'kita',name:'青屋口',pts:[[-55,-322],[-55,-300],[-55,-270],[-55,-256],[-55,-221],[-45,-180],[-24,-140],[-24,-131],[-24,-99],[-30,-90],[-55,-86],[-57,-6],[-52,-2],[-49,-4],[-49,-16],[-44,-20]]},
    {id:'higashi',gate:'higashi',name:'猫間川',pts:[[598,5],[578,5],[554,5],[480,5],[400,5],[300,5],[240,5],[218,5],[202,5],[150,5],[105,5],[90,5],[75,5],[66,0],[66,-9],[66,-14],[50,-30]]}
  ],
  links:[],

  lines:[
    {name:'惣構',short:'惣構',pts:[[-60,860],[300,860],[-608,4],[-201,-290],[-55,-290],[566,5]]},
    {name:'三の丸の堀・外堀',short:'外堀',pts:[[-60,444],[300,444],[-248,107],[-201,-238],[-55,-238],[218,5]]},
    {name:'二の丸（玉造口・大手口・京橋口）',short:'二の丸',pts:[[155,228],[-180,120],[-180,-190],[-45,-180],[150,5]]},
    {name:'内堀（桜門・極楽橋）',short:'内堀',pts:[[0,100],[-24,-115],[90,5]]},
    {name:'詰ノ丸の口',short:'詰ノ丸',pts:[[1,-2],[-50,-10],[66,-6]]}
  ],
  /* 詰ノ丸（天守のある一段高い曲輪） */
  honmaru:{x0:-45,x1:62,z0:-72,z1:-14},

  slots:[
    {id:'sogamae',name:'惣構の南の門',pos:[-60,826],line:1,kind:'gate'},
    {id:'sogamaeE',name:'惣構の南東の土塁',pos:[300,826],line:1,kind:'ishigaki'},
    {id:'nishi_g',name:'東横堀川の橋',pos:[-580,4],line:1,kind:'gate'},
    {id:'kyo_g',name:'京橋の前',pos:[-201,-275],line:1,kind:'gate'},
    {id:'higashi_g',name:'猫間川の橋',pos:[540,5],line:1,kind:'gate'},
    {id:'m3a',name:'三の丸の堀（大手筋）',pos:[-60,415],line:2,kind:'gate'},
    {id:'m3b',name:'三の丸の堀（東）',pos:[300,415],line:2,kind:'gate'},
    {id:'ote_g',name:'大手口の内',pos:[-215,110],line:2,kind:'gate'},
    {id:'kyo_in',name:'京橋口の内',pos:[-201,-205],line:2,kind:'gate'},
    {id:'aoya_in',name:'青屋口の内',pos:[-55,-205],line:2,kind:'gate'},
    {id:'higashi_y',name:'二の丸の東の櫓',pos:[190,-40],line:2,kind:'yagura'},
    {id:'tama',name:'玉造口',pos:[155,200],line:3,kind:'gate'},
    {id:'nino_s',name:'二の丸（南）',pos:[60,150],line:3,kind:'gate'},
    {id:'nino_n',name:'二の丸（北）',pos:[-100,-160],line:3,kind:'gate'},
    {id:'nino_w',name:'二の丸（西）',pos:[-150,60],line:3,kind:'ishigaki'},
    {id:'sakura',name:'桜門',pos:[0,74],line:4,kind:'gate'},
    {id:'gokuraku',name:'極楽橋の内',pos:[-24,-92],line:4,kind:'gate'},
    {id:'hon_e',name:'本丸の東',pos:[70,30],line:4,kind:'ishigaki'},
    {id:'tsume_s',name:'詰ノ丸の南',pos:[20,-20],line:5,kind:'yagura'},
    {id:'tsume_n',name:'詰ノ丸の北',pos:[-30,-66],line:5,kind:'yagura'},
    {id:'tsume_c',name:'天守',pos:[10,-45],line:5,kind:'yagura'}
  ],
  narrow:[{name:'惣構の門',pos:[-60,846],r:6},{name:'三の丸の門',pos:[-60,432],r:6},{name:'大手口',pos:[-231,107],r:6},{name:'京橋口',pos:[-201,-221],r:6},
    {name:'青屋口',pos:[-55,-221],r:6},{name:'玉造口',pos:[155,211],r:6},{name:'桜門',pos:[0,84],r:6},{name:'極楽橋の門',pos:[-24,-99],r:5},
    {name:'詰ノ丸の坂',pos:[1,2],r:4}],
  gatePass:[[[-60,880],[-60,820]],[[-60,464],[-60,424]],[[-270,107],[-226,107]],[[-201,-260],[-201,-215]],[[-55,-260],[-55,-215]],[[155,250],[155,205]],
    [[0,120],[0,78]],[[-24,-135],[-24,-94]],[[0,44],[1,-18]],[[300,880],[300,790]],[[-620,4],[-495,4]],[[566,5],[395,5]],[[-49,-2],[-49,-16]],[[66,-2],[66,-16]]],

  enemy:{
    side:'徳川勢', scale:1.1,
    trend:'5方向から攻める。南の惣構の兵は三の丸から玉造口へ、西の兵は大手口へ、北の兵は京橋口・青屋口から極楽橋へ、東の兵は猫間川と堀を渡って本丸へ。大砲で門を壊してくる。最後の本隊は徳川家康',
    boss:{name:'徳川家康',skill:{kind:'typeAtk',type:'taiho',v:.4,name:'徳川の大筒',text:'敵の大砲の攻撃1.4倍'}},
    waves:[
      {t:12, label:'先手', text:'徳川勢の先手が惣構の南と東横堀川に現れた',units:[
        {route:'minami',type:'yari',men:320},{route:'nishi',type:'yumi',men:240},{route:'minamiE',type:'kiba',men:240,delay:10}]},
      {t:130,label:'二の手', text:'二の手が京橋口と猫間川へ。大川からも兵が上がった',units:[
        {route:'kita',type:'yari',men:300},{route:'higashi',type:'yari',men:300},{route:'minami',type:'yumi',men:260},{route:'aoya',type:'kiba',men:240,delay:8}]},
      {t:250,label:'三の手', text:'三の手！大筒の音が城を揺らす',units:[
        {route:'minamiE',type:'yari',men:320},{route:'nishi',type:'yari',men:320},{route:'kita',type:'yumi',men:240},{route:'higashi',type:'kiba',men:260,delay:8}]},
      {t:390,label:'本隊', text:'徳川家康の本隊！三つ葉葵の旗が惣構に迫る',units:[
        {route:'minami',type:'kiba',men:460,boss:true,name:'徳川家康 本隊',gen:'徳川家康'},{route:'minamiE',type:'yari',men:320},
        {route:'nishi',type:'yari',men:320},{route:'aoya',type:'yari',men:280,delay:8},{route:'higashi',type:'yumi',men:260,delay:6}]}
    ]
  },
  keep:{x0:-640,x1:600,z0:-330,z1:900},
  camera:{x:0,z:60,yaw:-.3,dist:330,pitch:.9},
  next:null
};
if(typeof module!=='undefined'&&module.exports) module.exports=MAP; else (root.OshiroBattleMaps=root.OshiroBattleMaps||{})[MAP.id]=MAP;
})(typeof window!=='undefined'?window:globalThis);
