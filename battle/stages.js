/* 戦国・城ディフェンス（仮） ステージ一覧（小さい城から順に。最後は大坂の陣）
   url があるステージだけ出陣できる。url は各城の「お城さんぽ」のページに ?battle を付けたもの。
   その城のページに合戦モードの入口（index.html の数行）と、battle/maps/<id>.js の設定データがあれば遊べる。 */
(function(root){
const STAGES=[
  {id:'inuyama',  name:'犬山城',    pref:'尾張',feat:'木曽川を背にした後堅固の城',url:'/32miya-inuyama-castle/?battle'},
  {id:'matsumoto',name:'松本城',    pref:'信濃',feat:'堀に囲まれた平城・武田の騎馬',url:'/matsumoto-castle/?battle'},
  {id:'hikone',   name:'彦根城',    pref:'近江',feat:'大堀切と天秤櫓・内堀と中堀',url:'/32miya-32miya-hikone-castle/?battle'},
  {id:'matsuyama',name:'松山城',    pref:'伊予',feat:'門が折れ曲がって続く山城・隠門',url:'/32miya-matsuyama-castle/?battle'},
  {id:'bitchu',   name:'備中松山城',pref:'備中',feat:'雲海に浮かぶ山城・一本道の登城道',url:'/32miya-32miya-bitchu-matsuyama-castle-/?battle'},
  {id:'aizu',     name:'会津若松城',pref:'陸奥',feat:'鶴ヶ城・広い外郭',url:'/32miya-aizu-castle/?battle'},
  {id:'himeji',   name:'姫路城',    pref:'播磨',feat:'迷路のような門の連なり',url:'/32miya-himeji-castle/?battle'},
  {id:'kumamoto', name:'熊本城',    pref:'肥後',feat:'武者返しの石垣',url:'/32miya-kumamoto-castle/?battle'},
  {id:'azuchi',   name:'安土城',    pref:'近江',feat:'織田信長・鉄砲隊',url:'/32miya-32miya-azuchi-castle/?battle'},
  {id:'osaka',    name:'大坂城',    pref:'摂津',feat:'最終決戦・大坂の陣・真田幸村',url:'/32miya-osaka-castle/?battle'}
];
const HIDDEN={id:'edo',name:'江戸城',pref:'武蔵',feat:'全城攻略で現れる隠しの城',url:'/32miya-32miya-edo-castle-/?battle'};
const API={STAGES,HIDDEN,SAVE:'oshiroBattle.v1'};
if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.OshiroBattleStages=API;
})(typeof window!=='undefined'?window:globalThis);
