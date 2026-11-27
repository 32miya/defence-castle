/* 世界さんぽディフェンス ステージ一覧（小さい城から順に。最後はアトランティス）
   url があるステージだけ出陣できる。url は各名所の「世界さんぽ」のページに ?td を付けたもの。
   そのページに防衛モードの入口（index.html の数行）と、world/maps/<id>.js の設定データがあれば遊べる。 */
(function(root){
const STAGES=[
  {id:'heidelberg', name:'ハイデルベルク城',   land:'ドイツ',    feat:'坂道と庭園から迫る魔物・堀にかかる一本橋',url:'/heidelberg-castle-sanpo/?td'},
  {id:'windsor',    name:'ウィンザー城',       land:'イギリス',  feat:'丘の上の円塔と長い城壁',url:'/windsor-castle-sanpo/?td'},
  {id:'alcazar',    name:'アルカサル',         land:'スペイン',  feat:'岩山の先に立つ白い城',url:'/alcazar-sanpo/?td'},
  {id:'neuschwanstein',name:'ノイシュヴァンシュタイン城',land:'ドイツ',feat:'崖の上の白亜の城・空から竜',url:'/neuschwanstein-sanpo/?td'},
  {id:'prague',     name:'プラハ城',           land:'チェコ',    feat:'大聖堂と黄金の小路・広い城域',url:'/prague-castle/?td'},
  {id:'alhambra',   name:'アルハンブラ宮殿',   land:'スペイン',  feat:'赤い要塞と水の庭',url:'/alhambra-sanpo/?td'},
  {id:'versailles', name:'ヴェルサイユ宮殿',   land:'フランス',  feat:'城壁のない宮殿・三方から押し寄せる',url:'/VERSAILLES/?td'},
  {id:'sagrada',    name:'サグラダ・ファミリア',land:'スペイン', feat:'塔の林を空から襲う群れ',url:'/32miya-sagrada-familia-sanpo/?td'},
  {id:'wax',        name:'霧ノ森 蝋人形館',    land:'？？？',    feat:'霧の森の屋敷・夜の魔物',url:'/wax-museum-sanpo/?td'},
  {id:'montsaintmichel',name:'モン・サン・ミシェル',land:'フランス',feat:'潮の引いた干潟を渡る魔物・細い大通り',url:'/mont-saint-michel-sanpo/?td'},
  {id:'atlantis',   name:'アトランティス',     land:'伝説の大陸',feat:'最終決戦・海の底から来る黒竜',url:'/atlantis-sanpo/?td'}
];
const API={STAGES,SAVE:'sekaiDefense.v1',HOME:'/defence-castle/world/'};
if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.SekaiTDStages=API;
})(typeof window!=='undefined'?window:globalThis);
