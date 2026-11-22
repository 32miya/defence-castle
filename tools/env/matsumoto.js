/* 松本城（江戸時代）の地面・堀・塀を node で使うための写し（松本城さんぽ index.html の waterAt・BRIDGES・dobei より） */
const inR=(r,x,z,m)=>x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;
const MOAT={x0:-105,x1:105,z0:-100,z1:100},ISLAND={x0:-70,x1:70,z0:-65,z1:70},RIVER={x0:-1150,x1:1150,z0:212,z1:228};
const SOTO_O={x0:-175,x1:190,z0:-175,z1:140},SOTO_I={x0:-150,x1:165,z0:-150,z1:117},SOBO={x0:-1150,x1:1150,z0:178,z1:196};
const BR=[{x0:68,x1:107,z0:10.6,z1:23.4},{x0:-30.6,x1:-22.4,z0:176.5,z1:197.5},{x0:122.6,x1:153.4,z0:-64.4,z1:-47.6},{x0:163,x1:192,z0:36,z1:44},{x0:-26.2,x1:-13.8,z0:208.5,z1:231.5},{x0:130,x1:138,z0:208.5,z1:231.5}];
function water(x,z){ let w=(inR(MOAT,x,z,0)&&!inR(ISLAND,x,z,0))||inR(RIVER,x,z,0)||(inR(SOTO_O,x,z,0)&&!inR(SOTO_I,x,z,0))||inR(SOBO,x,z,0); return w&&!BR.some(b=>inR(b,x,z,0)); }
const WALLS=[[-69,-64.3,69,-64.3],[-69.3,-64,-69.3,25],[-18.5,69.3,68.5,69.3],[-149,-149,164,-149],[-149,116,164,116],[-149,-149,-149,116],[164,-149,164,24],[164,56,164,116],[69.2,-64,69.2,5.5],[69.2,28.5,69.2,69]];
const SOLID=[{x0:-70,x1:-44,z0:25,z1:69},{x0:65.5,x1:72.5,z0:5.5,z1:13.4},{x0:65.5,x1:72.5,z0:20.6,z1:28.5},{x0:154.6,x1:165.4,z0:24,z1:35.5},{x0:154.6,x1:165.4,z0:44.5,z1:56}];
function segD(x,z,a){ const [x0,z0,x1,z1]=a,dx=x1-x0,dz=z1-z0,l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-x0)*dx+(z-z0)*dz)/l)); return Math.hypot(x-x0-dx*t,z-z0-dz*t); }
function block(x,z){ if(SOLID.some(r=>inR(r,x,z,0))) return 1; if(WALLS.some(w=>segD(x,z,w)<1)) return 2; return 0; }
module.exports={h:()=>0,block,water};
