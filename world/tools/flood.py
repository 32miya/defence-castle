import sys,json,math,subprocess
from PIL import Image,ImageDraw
repo,era,cx,cz,R,H,vx,vz,S=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5]),float(sys.argv[6]),float(sys.argv[7]),float(sys.argv[8]),float(sys.argv[9])
out=sys.argv[10]
F={'era':era,'cx':cx,'cz':cz,'x0':vx-R,'x1':vx+R,'z0':vz-R,'z1':vz+R,'S':S}
js=["window.__FLOOD=%s; null"%json.dumps(F),open('flood.js').read(),
 "(()=>{ START=true; const r0=renderer.render.bind(renderer); camera.fov=70; camera.aspect=1; camera.updateProjectionMatrix(); renderer.render=(s,c)=>{ c.position.set(%f,%f,%f); c.up.set(0,1,0); c.lookAt(%f,0,%f); if(typeof sky!=='undefined') sky.position.copy(c.position); r0(s,c); }; document.querySelectorAll('body>*').forEach(e=>{ if(!e.contains(renderer.domElement)&&e.tagName!=='SCRIPT') e.style.display='none'; }); return null; })()"%(vx,H,vz+0.01,vx,vz),2500]
import os
r=subprocess.run(['python3','shot.py',f'http://game.test/{repo}/?td','/tmp/fl_raw.png',json.dumps(js),'12000','1000','1000'],capture_output=True,text=True,env=dict(os.environ,EVLIM='9000000'))
m=[l for l in r.stdout.splitlines() if l.startswith('EVAL {"nx"')]
if not m: print(r.stdout[-1500:]); sys.exit(1)
d=json.loads(m[0][5:])
k=500/(H*math.tan(math.radians(35))); P=lambda x,z:(500+(x-vx)*k,500+(z-vz)*k)
im=Image.open('/tmp/fl_raw.png').convert('RGBA'); ov=Image.new('RGBA',im.size,(0,0,0,0)); dr=ImageDraw.Draw(ov)
nx,nz,S2=d['nx'],d['nz'],d['S']; b=d['bits']
for j in range(nz):
  for i in range(nx):
    if b[j*nx+i]=='1':
      x,z=d['x0']+i*S2,d['z0']+j*S2; a=P(x-S2/2,z-S2/2); c=P(x+S2/2,z+S2/2); dr.rectangle([a,c],fill=(0,255,120,90))
im=Image.alpha_composite(im,ov).convert('RGB'); dr=ImageDraw.Draw(im)
x,y=P(cx,cz); dr.ellipse([x-8,y-8,x+8,y+8],fill=(0,200,255))
step=50
for gx in range(int((vx-500/k)//step*step),int(vx+500/k)+step,step):
  for gz in range(int((vz-500/k)//step*step),int(vz+500/k)+step,step):
    px,py=P(gx,gz); dr.text((px,py),f'{gx},{gz}',fill=(255,255,255))
im.save(out); print('reach cells',d['n'],'coreY',d['cy'])
