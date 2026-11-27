/* himeji（合戦の時代）を node で使うための地面・堀（建物は入れていない） */
const T=require('./himeji_terrain.js');
const base=T.baseH||((x,z)=>0);
function h(x,z){ let best=base(x,z); for(const b of T.actB()) if(T.inR(b,x,z,.4)){ const v=b.h(x,z); if(v>best) best=v; } return best; }
function water(x,z){ return T.waterAt(x,z,0)&&!T.actB().some(b=>T.inR(b,x,z,0)); }
module.exports={h,water,block:()=>0,floor:base};
