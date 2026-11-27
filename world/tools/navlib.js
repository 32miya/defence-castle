function tdNav(sx,sz,sy,tx,tz,tr,ty){
  let x0=Math.min(sx,tx),x1=Math.max(sx,tx),z0=Math.min(sz,tz),z1=Math.max(sz,tz);
  const span=Math.max(x1-x0,z1-z0), S=window.__navS||(span>300?1.5:span>140?1:.5), pad=span>60?Math.max(40,span*.25):26;
  x0=Math.floor(x0-pad); x1=Math.ceil(x1+pad); z0=Math.floor(z0-pad); z1=Math.ceil(z1+pad);
  const nx=Math.round((x1-x0)/S)+1, nz=Math.round((z1-z0)/S)+1, N=nx*nz; if(N>6e6) return null;
  const G=new Float32Array(N).fill(1e9), PR=new Int32Array(N).fill(-1), Y=new Float32Array(N), CL=new Uint8Array(N);
  const cx=i=>x0+i*S, cz=j=>z0+j*S;
  const si=Math.round((sx-x0)/S), sj=Math.round((sz-z0)/S); const s0=sj*nx+si;
  const H=[], HF=[]; const push=(n,f)=>{ H.push(n); HF.push(f); let i=H.length-1; while(i>0){ const p=(i-1)>>1; if(HF[p]<=HF[i]) break; [H[p],H[i]]=[H[i],H[p]]; [HF[p],HF[i]]=[HF[i],HF[p]]; i=p; } };
  const pop=()=>{ const n=H[0], ln=H.pop(), lf=HF.pop(); if(H.length){ H[0]=ln; HF[0]=lf; let i=0; for(;;){ const l=2*i+1,r=l+1; let m=i; if(l<H.length&&HF[l]<HF[m]) m=l; if(r<H.length&&HF[r]<HF[m]) m=r; if(m===i) break; [H[m],H[i]]=[H[i],H[m]]; [HF[m],HF[i]]=[HF[i],HF[m]]; i=m; } } return n; };
  G[s0]=0; Y[s0]=sy; push(s0,Math.hypot(sx-tx,sz-tz));
  const DIRS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  const stepOK=(x,z,y,dx,dz)=>{ let yy=y; const ns=S>.6?Math.ceil(S/.4):2; for(let s=1;s<=ns;s++){ const ax=x+dx*s/ns, az=z+dz*s/ns; if(blocked(ax,az,yy)) return null; const sf=surfaceAt(ax,az,yy); if(sf<-1e8||sf<yy-1.2) return null; yy=sf; } return yy; };
  let goal=-1, it=0;
  while(H.length&&it++<5000000){ const n=pop(); if(CL[n]) continue; CL[n]=1; const i=n%nx, j=(n-i)/nx, x=cx(i), z=cz(j), y=Y[n];
    if(Math.hypot(x-tx,z-tz)<=tr&&(ty==null||Math.abs(y-ty)<2.4)){ goal=n; break; }
    for(const [di,dj,w] of DIRS){ const a=i+di,b=j+dj; if(a<0||b<0||a>=nx||b>=nz) continue;
      if(di&&dj){ if(stepOK(x,z,y,di*S,0)==null||stepOK(x,z,y,0,dj*S)==null) continue; }
      const yy=stepOK(x,z,y,di*S,dj*S); if(yy==null) continue; const ax=cx(a),az=cz(b); const n2=b*nx+a; if(CL[n2]) continue;
      const climb=Math.abs(yy-y)/(w*S); const g=G[n]+w*S*(1+climb*2.2); if(g<G[n2]){ G[n2]=g; PR[n2]=n; Y[n2]=yy; push(n2,g+Math.hypot(ax-tx,az-tz)+(ty==null?0:Math.abs(yy-ty)*1.5)); } } }
  if(goal<0) return null;
  const pts=[]; for(let n=goal;n>=0;n=PR[n]){ const i=n%nx, j=(n-i)/nx; pts.push([cx(i),cz(j),Y[n],0]); } pts.reverse();
  const out=[pts[0]]; let acc=0; for(let k=1;k<pts.length;k++){ const p=pts[k],q=pts[k-1]; acc+=Math.hypot(p[0]-q[0],p[1]-q[1]); const nx2=pts[k+1]; const turn=nx2&&(Math.sign(nx2[0]-p[0])!==Math.sign(p[0]-q[0])||Math.sign(nx2[1]-p[1])!==Math.sign(p[1]-q[1]));
    if(acc>=2.5||(turn&&acc>=.9)||k===pts.length-1){ out.push(p); acc=0; } }
  return out; }
