import sys,json,math
meta=json.load(open(sys.argv[1])); res=json.load(open(sys.argv[2])); out=sys.argv[3]
R=res['routes']; ground=[k for k,v in R.items() if not v.get('air')]
def alongF(P,f):
  L=[0]
  for i in range(1,len(P)): L.append(L[-1]+math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]))
  t=L[-1]*f
  for i in range(1,len(P)):
    if L[i]>=t:
      k=(t-L[i-1])/((L[i]-L[i-1]) or 1); return [P[i-1][j]+(P[i][j]-P[i-1][j])*k for j in range(3)]
  return P[-1]
if 'air' in R and ground:
  a0=R['air']['pts'][0]; alt=a0[2]-res['coreY']
  # 空の敵は、空の入口にいちばん近い地上の道の後半の上を飛ぶ（塔の上を通るように）
  best=min(ground,key=lambda k:math.hypot(alongF(R[k]['pts'],.3)[0]-a0[0],alongF(R[k]['pts'],.3)[1]-a0[1]))
  P=R[best]['pts']; pts=[a0]
  for f,h in ((.3,.8),(.45,.7),(.6,.6),(.75,.5),(.9,.4)):
    q=alongF(P,f); pts.append([round(q[0],1),round(q[1],1),round(q[2]+max(8,alt*h),1)])
  c=P[-1]; pts.append([c[0],c[1],round(c[2]+9,1)])
  R['air']['pts']=pts
pts=[p for k in ground for p in R[k]['pts']]+[[s[0],s[1]] for s in res['slots']]
x0=min(p[0] for p in pts); x1=max(p[0] for p in pts); z0=min(p[1] for p in pts); z1=max(p[1] for p in pts)
core=[round(meta['core'][0],1),round(meta['core'][1],1)]; sl=res['slots']
cx=sum(s[0] for s in sl)/len(sl)*.5+core[0]*.5; cz=sum(s[1] for s in sl)/len(sl)*.5+core[1]*.5
cam=meta.get('cam',{})
camd={'x':round(cam.get('x',cx)),'z':round(cam.get('z',cz)),'w':cam.get('w',110),'h':cam.get('h',100),'yaw':cam.get('yaw',0),'pitch':cam.get('pitch',.98),
 'bounds':{'x0':round(x0-10),'x1':round(x1+10),'z0':round(z0-10),'z1':round(z1+10)}}
field={'x0':round(x0-160),'x1':round(x1+160),'z0':round(z0-160),'z1':round(z1+160)}
M={'id':meta['id'],'name':meta['name'],'land':meta['land'],'era':meta.get('era'),'intro':meta['intro'],'field':field,'cam':camd,
   'core':{'x':core[0],'z':core[1],'y':round(res['coreY'],1),'name':meta.get('coreName','聖なる泉')},'routes':R,'ground':ground,'slots':sl,'walls':res['walls']}
for k in ('airMul','boss','gold','lives','fog','bright','ambient','ambientColor','hideIn'):
  if k in meta: M[k]=meta[k]
js=f"""/* 世界さんぽディフェンス 設定データ：{meta['name']}（{meta['repo']} の座標。北が -z、東が +x）
   道はさんぽの道探しで求めて間引いたもの、塔の場所は道から6〜15mの平らな所から選んだもの（tools の自動下書き＋手直し）。
   書式は heidelberg.js と同じ */
(function(root){{
const M={json.dumps(M,ensure_ascii=False,separators=(',',':'))};
(root.SekaiTDMaps=root.SekaiTDMaps||{{}})[M.id]=M;
if(typeof module!=='undefined'&&module.exports) module.exports=M;
}})(typeof window!=='undefined'?window:globalThis);
"""
open(out,'w').write(js); print('wrote',out,camd)
