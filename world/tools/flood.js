(()=>{ const F=window.__FLOOD; try{ if(F.era) setEra(F.era); }catch(e){}
 const S=F.S||2, x0=F.x0,x1=F.x1,z0=F.z0,z1=F.z1, nx=Math.round((x1-x0)/S)+1, nz=Math.round((z1-z0)/S)+1;
 const Y=new Float32Array(nx*nz).fill(-1e9), seen=new Uint8Array(nx*nz);
 const GF=window.__sekai?__sekai.groundY:((x,z)=>0);
 const stepOK=(x,z,y,dx,dz)=>{ let yy=y; const ns=Math.ceil(S/.4); for(let s=1;s<=ns;s++){ const ax=x+dx*s/ns, az=z+dz*s/ns; if(blocked(ax,az,yy)) return null; const sf=surfaceAt(ax,az,yy); if(sf<-1e8||sf<yy-1.2) return null; yy=sf; } return yy; };
 const ci=Math.round((F.cx-x0)/S), cj=Math.round((F.cz-z0)/S); const c0=cj*nx+ci;
 let cy=F.cy!=null?F.cy:__sekai.hy(F.cx,F.cz); Y[c0]=cy; seen[c0]=1; const q=[c0]; let h=0;
 while(h<q.length){ const n=q[h++]; const i=n%nx,j=(n-i)/nx,x=x0+i*S,z=z0+j*S,y=Y[n];
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const a=i+di,b=j+dj; if(a<0||b<0||a>=nx||b>=nz) continue; const m=b*nx+a; if(seen[m]) continue; const yy=stepOK(x,z,y,di*S,dj*S); if(yy==null) continue; seen[m]=1; Y[m]=yy; q.push(m); } }
 let s=''; for(let k=0;k<seen.length;k++) s+=seen[k]?'1':'0';
 return {nx,nz,S,x0,z0,n:q.length,cy,bits:s}; })()
