/* 彦根城（江戸時代）を node で使うための地面・堀（建物は入れていない） */
const T=require('./hikone_terrain.js');
function h(x,z){ let best=T.baseH(x,z); for(const b of T.actB()) if(T.inR(b,x,z,.4)){ const v=b.h(x,z); if(v>best) best=v; } return best; }
function water(x,z){ return T.waterAt(x,z,0)&&!T.actB().some(b=>b.h(x,z)<5&&T.inR(b,x,z,0)); }
module.exports={h,water,block:()=>0,floor:T.baseH};
