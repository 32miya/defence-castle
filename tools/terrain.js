/* お城さんぽの index.html（CASTLE_HTML、既定は隣に置いた犬山城さんぽ）から地形の関数（terrH）だけを取り出して node で使う */
// index.html から地形の関数だけを取り出して node で使う（バランス調整用）
const fs=require('fs');
const src=fs.readFileSync(process.env.CASTLE_HTML||__dirname+'/../../32miya-inuyama-castle/index.html','utf8').split('\n');
const pick=re=>{ const i=src.findIndex(l=>re.test(l)); if(i<0) throw new Error('nf '+re); return src[i]; };
const lines=[];
for(const re of [/^function hash\(/,/^function vnoise\(/,/^function fbm\(/,/^function segDist\(/]) { const i=src.findIndex(l=>re.test(l)); lines.push(src[i]); if(!/\}\s*$/.test(src[i])) lines.push(src[i+1]); }
const a=src.findIndex(l=>/^const WATER_Y=/.test(l)), b=src.findIndex(l=>/^const HC=new Map/.test(l));
const helpers=src.filter(l=>/^const (clamp|sstep|inR|lerp)\b|^function (clamp|sstep|inR)\(/.test(l));
const code=helpers.join('\n')+'\n'+lines.join('\n')+'\n'+src.slice(a,b+1).join('\n')+'\nmodule.exports={terrH,groundH0,TER,RAMPS};';
module.exports=(()=>{ const m={}; new Function("module",code)(m); return m.exports; })();
