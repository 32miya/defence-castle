/* 設定データの自動下書き: PARAMS={core:[x,z], routes:[{key,name,pts:[[x,z],...]}], air:{name,from:[x,z,alt]}, era, S, slotN} */
(()=>{ const PR=window.__PLAN; if(PR.era){ try{ setEra(PR.era); }catch(e){} }
 window.__navS=PR.S||null;
 const GF=window.__sekai?__sekai.groundY:((x,z)=>0);
 const hy=(x,z,y)=>{ const g=GF(x,z); const s=surfaceAt(x,z,y==null?g+12:y); return s>-1e8?Math.max(g,s):g; };
 const R2=v=>Math.round(v*10)/10;
 function rdp(P,eps){ if(P.length<3) return P; const a=P[0],b=P[P.length-1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1e-9; let best=0,bi=0;
   for(let i=1;i<P.length-1;i++){ const p=P[i]; let t=((p[0]-a[0])*dx+(p[1]-a[1])*dz)/L/L; t=Math.max(0,Math.min(1,t)); const e=Math.max(Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t),Math.abs(p[2]-(a[2]+(b[2]-a[2])*t))*1.5); if(e>best){ best=e; bi=i; } }
   if(best<eps) return [a,b]; return rdp(P.slice(0,bi+1),eps).slice(0,-1).concat(rdp(P.slice(bi),eps)); }
 const out={routes:{},fail:[],moved:[]};
 const okAt=(x,z)=>{ const y=hy(x,z); return !blocked(x,z,y)&&surfaceAt(x,z,y+.3)>-1e8; };
 const fix=(p)=>{ if(okAt(p[0],p[1])) return p; for(let r=2;r<40;r+=2) for(let k=0;k<16;k++){ const x=p[0]+Math.cos(k/16*6.283)*r,z=p[1]+Math.sin(k/16*6.283)*r; if(okAt(x,z)){ out.moved.push([p,[x,z]]); return [x,z]; } } return p; };
 PR.core=fix(PR.core); for(const r of PR.routes) r.pts=r.pts.map(fix);
 for(const r of PR.routes){ const W=r.pts.concat([PR.core]); let pts=[];
   for(let i=0;i<W.length-1;i++){ const a=W[i],b=W[i+1]; const ya=i?pts[pts.length-1][2]:hy(a[0],a[1]); const p=tdNav(a[0],a[1],ya,b[0],b[1],i===W.length-2?2.5:3,null); if(!p){ out.fail.push([r.key,i,a,b]); pts=null; break; } pts=pts.concat(i?p.slice(1):p); }
   if(!pts) continue; out.routes[r.key]={name:r.name,pts:rdp(pts.map(q=>[q[0],q[1],q[2]]),.8).map(q=>[R2(q[0]),R2(q[1]),R2(q[2])])}; }
 const G=Object.values(out.routes);
 /* 道の点（2mごと） */
 const samp=[]; for(const r of G){ const P=r.pts; let L=0; for(let i=0;i<P.length-1;i++){ const a=P[i],b=P[i+1],d=Math.hypot(b[0]-a[0],b[1]-a[1]); for(let t=0;t<d;t+=2){ const k=t/d; samp.push({x:a[0]+(b[0]-a[0])*k,z:a[1]+(b[1]-a[1])*k,y:a[2]+(b[2]-a[2])*k,w:1,s:L+t,len:0,r}); } L+=d; } }
 for(const p of samp){ p.f=p.s/((()=>{ let L=0; const P=p.r.pts; for(let i=0;i<P.length-1;i++) L+=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]); return L; })()); }
 const dRoute=(x,z)=>{ let b=1e9,y=0; for(const p of samp){ const d=Math.hypot(p.x-x,p.z-z); if(d<b){ b=d; y=p.y; } } return [b,y]; };
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const p of samp){ x0=Math.min(x0,p.x); x1=Math.max(x1,p.x); z0=Math.min(z0,p.z); z1=Math.max(z1,p.z); }
 const cand=[]; const ST=PR.grid||3;
 for(let x=Math.floor(x0-18);x<=x1+18;x+=ST) for(let z=Math.floor(z0-18);z<=z1+18;z+=ST){ const [d,ry]=dRoute(x,z); if(d<(PR.dmin||6)||d>(PR.dmax||15)) continue;
   const y=hy(x,z,ry+3); if(Math.abs(y-ry)>(PR.dy||4)) continue; let ok=true;
   for(let a=0;a<8&&ok;a++){ const px=x+Math.cos(a*.785)*2.7,pz=z+Math.sin(a*.785)*2.7; if(blocked(px,pz,y)) ok=false; else { const h=hy(px,pz,y+1.5); if(Math.abs(h-y)>.9) ok=false; } }
   if(ok&&blocked(x,z,y)) ok=false; if(ok) cand.push({x,z,y}); }
 const slots=[]; const N=PR.slotN||24;
 for(let n=0;n<N&&cand.length;n++){ let best=null,bs=-1;
   for(const c of cand){ if(slots.some(s=>Math.hypot(s.x-c.x,s.z-c.z)<(PR.gap||10))) continue; let sc=0; for(const p of samp){ if(Math.abs(p.x-c.x)>24||Math.abs(p.z-c.z)>24) continue; if(Math.hypot(p.x-c.x,p.z-c.z)<24) sc+=p.w*(.5+p.f); } if(sc>bs){ bs=sc; best=c; } }
   if(!best) break; slots.push(best); for(const p of samp) if(Math.hypot(p.x-best.x,p.z-best.z)<24) p.w*=.55; }
 out.slots=slots.map(s=>[Math.round(s.x),Math.round(s.z)]); out.cand=cand.length;
 /* 城壁: 各ルートの 45% と、いちばん長いルートの 80% */
 const walls=[]; const atF=(r,f)=>{ const P=r.pts; let T=0; for(let i=0;i<P.length-1;i++) T+=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]); let s=T*f,L=0; for(let i=0;i<P.length-1;i++){ const d=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]); if(L+d>=s){ const k=(s-L)/d; return [R2(P[i][0]+(P[i+1][0]-P[i][0])*k),R2(P[i][1]+(P[i+1][1]-P[i][1])*k)]; } L+=d; } return P[P.length-1].slice(0,2); };
 for(const f of (PR.wallF||[.45])) for(const r of G) walls.push(atF(r,f));
 if(G.length){ const lg=G.slice().sort((a,b)=>b.pts.length-a.pts.length)[0]; walls.push(atF(lg,PR.wallEnd||.82)); }
 out.walls=walls.filter((w,i)=>walls.findIndex(v=>Math.hypot(v[0]-w[0],v[1]-w[1])<8)===i);
 if(PR.air){ const a=PR.air.from,c=PR.core,cy=hy(c[0],c[1]); out.routes.air={name:PR.air.name,air:true,pts:[[a[0],a[1],R2(cy+a[2])],[R2((a[0]+c[0])/2),R2((a[1]+c[1])/2),R2(cy+a[2]*.6)],[c[0],c[1],R2(cy+9)]]}; }
 out.core=PR.core; out.coreY=hy(PR.core[0],PR.core[1]);
 return out; })()
