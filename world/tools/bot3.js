(()=>{ const D=SekaiTD.debug,G=SekaiTD.G; if(window.__DIFF) D.setDiff(window.__DIFF); D.start(); const S=D.SLOTS,R=D.ROUTES;
 const samp=[]; for(const k in R){ const r=R[k]; for(let s=0;s<r.len;s+=3){ const e={k:0,off:0}; /* 位置 */ const P=r.pts,L=r.L; let i=0; while(i<L.length-2&&L[i+1]<s) i++; const t=(s-L[i])/((L[i+1]-L[i])||1); samp.push({x:P[i][0]+(P[i+1][0]-P[i][0])*t,z:P[i][1]+(P[i+1][1]-P[i][1])*t,air:!!r.air,f:s/r.len,w:1}); } }
 const score=(s,range,air)=>{ let v=0; for(const p of samp){ if(p.air&&!air) continue; const d=Math.hypot(p.x-s.x,p.z-s.z); if(d<range) v+=p.w*(.4+p.f)*(p.air?1.3:1); } return v; };
 const cyc=['archer','catapult','archer','mage']; let n=0;
 function nextBuild(){ const type=cyc[n%4]; const T={archer:[25,1],catapult:[34,0],mage:[22,1]}[type]; let best=null,bv=0; for(const s of S){ if(s.wall||s.tower) continue; const v=score(s,T[0],T[1]); if(v>bv){ bv=v; best=s; } } return best&&[best,type,T]; }
 const ws=S.filter(s=>s.wall); let wi=0; const log=[]; D.wave();
 for(let sec=0;sec<1700&&!G.over;sec++){
   for(let guard=0;guard<4;guard++){
     if(n===3&&wi<1&&ws[wi]){ if(G.gold>=60){ D.build(ws[wi].i,'wall'); wi++; } else break; continue; }
     const ups=D.towers.filter(t=>t.type!=='wall'&&t.lv<2);
     const wantUp=n>=8&&ups.length&&(n%2===0||!nextBuild());
     if(wantUp){ const t=ups.sort((a,b)=>a.lv-b.lv)[0]; const lv=t.lv; D.upgrade(t.slot.i,t.lv===1?{archer:'a',catapult:'a',mage:'b',banner:'a',mine:'a'}[t.type]:undefined); if(t.lv>lv){ n++; continue; } else break; }
     const nb=nextBuild(); if(!nb){ if(wi<ws.length&&G.gold>=60){ D.build(ws[wi].i,'wall'); wi++; continue; } break; }
     const g=G.gold; D.build(nb[0].i,nb[1]); if(G.gold<g){ n++; for(const p of samp) if(Math.hypot(p.x-nb[0].x,p.z-nb[0].z)<nb[2][0]) p.w*=.6; } else break; }
   for(const t of D.towers) if(t.type==='wall'&&t.hp<=0&&G.gold>150){ t.hp=t.max; G.gold-=Math.round(t.spent*.35); }
   /* 技を使う（ふつうの遊び手のつもり） */
   if(G.started&&!G.cd.met){ let best=null,bn=5; for(const e of D.enemies){ if(e.r.air) continue; let n=0; for(const o of D.enemies) if(!o.r.air&&Math.hypot(o.x-e.x,o.z-e.z)<9) n++; if(n>bn){ bn=n; best=e; } } if(best) D.meteor({x:best.x,y:best.y,z:best.z}); }
   const near=D.enemies.filter(e=>e.s/e.r.len>.75).length;
   if(G.started&&!G.cd.ice&&near>=8) D.ice();
   if(G.started&&!G.cd.kn&&near>=4){ const e=D.enemies.filter(e=>!e.r.air).sort((a,b)=>b.s/b.r.len-a.s/a.r.len)[0]; if(e){ const p={k:0,off:0}; D.knights({x:e.x,y:e.y,z:e.z}); } }
   const r=D.run(1); if(sec%40===0||G.over) log.push([sec,r.wave,r.lives,Math.round(r.gold),r.enemies]); }
 return {end:{wave:G.wave,lives:G.lives,kills:G.kills,over:G.over,score:Math.round(G.score),par:D.PAR,mc:G.maxCombo},leak:G.leakBy}; })()
