import sys,json,math,subprocess
from PIL import Image,ImageDraw
repo=sys.argv[1]; params=json.load(open(sys.argv[2])); out=sys.argv[3]
cx,cz,H=params['view']
era=params.get('era','')
js=[ "window.__PLAN=%s; null"%json.dumps(params),
 "(()=>{ "+open("navlib.js").read()+"; window.tdNav=tdNav; return null; })()",
 open('plan.js').read(),
 "(()=>{ START=true; const r0=renderer.render.bind(renderer); camera.fov=70; camera.aspect=1; camera.updateProjectionMatrix(); renderer.render=(s,c)=>{ c.position.set(%f,%f,%f); c.up.set(0,1,0); c.lookAt(%f,0,%f); if(typeof sky!=='undefined') sky.position.copy(c.position); r0(s,c); }; document.querySelectorAll('body>*').forEach(e=>{ if(!e.contains(renderer.domElement)&&e.tagName!=='SCRIPT') e.style.display='none'; }); return null; })()"%(cx,H,cz+0.01,cx,cz),2500]
r=subprocess.run(['python3','shot.py',f'http://game.test/{repo}/?td','/tmp/plan_raw.png',json.dumps(js),'12000','1000','1000'],capture_output=True,text=True)
res=None
for l in r.stdout.splitlines():
  if l.startswith('EVAL {"routes"'): res=json.loads(l[5:])
  elif 'PAGEERROR' in l: print(l[:300])
if not res: print(r.stdout[-2000:],r.stderr[-2000:]); sys.exit(1)
json.dump(res,open(out+'.json','w'))
k=500/(H*math.tan(math.radians(35))); P=lambda x,z:(500+(x-cx)*k,500+(z-cz)*k)
im=Image.open('/tmp/plan_raw.png').convert('RGB'); dr=ImageDraw.Draw(im)
cols=[(255,40,40),(40,90,255),(255,160,0),(0,200,200)]
for i,(key,rt) in enumerate(res['routes'].items()):
  c=(200,80,255) if rt.get('air') else cols[i%4]
  dr.line([P(p[0],p[1]) for p in rt['pts']],fill=c,width=4 if not rt.get('air') else 2)
  dr.text(P(*rt['pts'][0][:2]),key,fill=c)
for i,s in enumerate(res['slots']):
  x,y=P(*s); dr.ellipse([x-6,y-6,x+6,y+6],outline=(255,230,0),width=3); dr.text((x+7,y-6),str(i),fill=(255,255,0))
for w in res['walls']:
  x,y=P(*w); dr.rectangle([x-7,y-4,x+7,y+4],fill=(255,120,0))
x,y=P(*res.get('core',params['core'])); dr.ellipse([x-9,y-9,x+9,y+9],fill=(0,220,255))
step=50 if H<300 else 100
for gx in range(int((cx-500/k)//step*step),int(cx+500/k)+step,step):
  for gz in range(int((cz-500/k)//step*step),int(cz+500/k)+step,step):
    px,py=P(gx,gz); dr.text((px,py),f'{gx},{gz}',fill=(255,255,255))
im.save(out+'.png')
print('moved',res.get('moved'),'fail',res['fail'],'slots',len(res['slots']),'cand',res['cand'],'walls',res['walls'],'coreY',res['coreY'])
for kk,rt in res['routes'].items(): print(kk,len(rt['pts']),round(sum(math.hypot(rt['pts'][i+1][0]-rt['pts'][i][0],rt['pts'][i+1][1]-rt['pts'][i][1]) for i in range(len(rt['pts'])-1))))
