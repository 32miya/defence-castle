"""Headless check: serves files from disk via request interception (no server)."""
import sys, asyncio, json, os, mimetypes
from playwright.async_api import async_playwright
THREE = '/home/claude/vendor/node_modules/three/build/three.min.js'
import glob
ROOT = {os.path.basename(d): d for d in glob.glob('/home/claude/*') if os.path.isfile(d+'/index.html') or d.endswith('defence-castle')}
ROOT['VERSAILLES']='/home/claude/versailles'

def local(path):
    path = path.split('?')[0].split('#')[0].lstrip('/')
    top, _, rest = path.partition('/')
    base = ROOT.get(top)
    if not base: return None
    f = os.path.join(base, rest or 'index.html')
    if os.path.isdir(f): f = os.path.join(f, 'index.html')
    return f if os.path.isfile(f) else None

async def main(url, out, js=None, wait=8000, w=390, h=844):
    mobile = w < 700
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader'])
        ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
        pg = await ctx.new_page()
        logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text))
        pg.on('pageerror', lambda e: logs.append('PAGEERROR: ' + str(e)))
        async def handler(route):
            u = route.request.url
            if u.endswith('three.min.js'):
                return await route.fulfill(path=THREE, content_type='application/javascript')
            if u.startswith('http://game.test/'):
                f = local(u[len('http://game.test'):])
                if f:
                    ct = mimetypes.guess_type(f)[0] or 'application/octet-stream'
                    if f.endswith('.js'): ct = 'application/javascript'
                    return await route.fulfill(path=f, content_type=ct)
                return await route.fulfill(status=404, body='nf')
            return await route.abort()
        await pg.route('**/*', handler)
        await pg.goto(url)
        await pg.wait_for_timeout(wait)
        for step in js or []:
            if isinstance(step, int): await pg.wait_for_timeout(step)
            elif step.startswith('SHOT:'): await pg.screenshot(path=step[5:])
            elif step.startswith('TAP:'):
                x, y = map(float, step[4:].split(',')); await pg.mouse.click(x, y)
            else:
                v = await pg.evaluate(step)
                if v is not None: print('EVAL', json.dumps(v, ensure_ascii=False)[:int(os.environ.get("EVLIM","6000"))])
        await pg.screenshot(path=out)
        for l in logs[-40:]: print(l[:600])
        await b.close()

if __name__ == '__main__':
    url, out = sys.argv[1], sys.argv[2]
    js = json.loads(sys.argv[3]) if len(sys.argv) > 3 else None
    wait = int(sys.argv[4]) if len(sys.argv) > 4 else 8000
    w = int(sys.argv[5]) if len(sys.argv) > 5 else 390
    h = int(sys.argv[6]) if len(sys.argv) > 6 else 844
    asyncio.run(main(url, out, js, wait, w, h))
