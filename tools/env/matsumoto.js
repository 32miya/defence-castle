/* 松本城（江戸時代）の地面と堀を node で使うための写し（松本城さんぽ index.html の waterAt と BRIDGES） */
const inR=(r,x,z,m)=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;
const MOAT={x0:-105,x1:105,z0:-100,z1:100},ISLAND={x0:-70,x1:70,z0:-65,z1:70},RIVER={x0:-1150,x1:1150,z0:212,z1:228};
const SOTO_O={x0:-175,x1:190,z0:-175,z1:140},SOTO_I={x0:-150,x1:165,z0:-150,z1:117},SOBO={x0:-1150,x1:1150,z0:178,z1:196};
const BR=[{x0:68,x1:107,z0:10.6,z1:23.4},{x0:-30.6,x1:-22.4,z0:176.5,z1:197.5},{x0:122.6,x1:153.4,z0:-64.4,z1:-47.6},{x0:163,x1:192,z0:36,z1:44},{x0:-26.2,x1:-13.8,z0:208.5,z1:231.5},{x0:130,x1:138,z0:208.5,z1:231.5}];
function water(x,z){ let w=(inR(MOAT,x,z,0)&&!inR(ISLAND,x,z,0))||inR(RIVER,x,z,0)||(inR(SOTO_O,x,z,0)&&!inR(SOTO_I,x,z,0))||inR(SOBO,x,z,0); return w&&!BR.some(b=>inR(b,x,z,0)); }
module.exports={h:()=>0,block:water};
