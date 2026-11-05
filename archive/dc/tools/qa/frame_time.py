"""Measures real frame pacing in every room, muted, with a throwaway profile. Reports the renderer in use."""
import json, os, socket, subprocess, sys, tempfile, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(r"D:\silicon-adventures"); CORE = "EnchantedCastle.session.core()"
ROOMS = [1000, 1010, 1020, 2000, 2010, 2020, 2030, 3000, 3010, 3020, 3030, 4000, 4010, 4020]
import urllib.request
t = tempfile.mkdtemp(prefix="scepters-frames-")
s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
base = f"http://127.0.0.1:{port}/"
pr = subprocess.Popen([str(ROOT / "engine/runtime/bin/java.exe"), f"-Duser.home={t}", "-jar", "engine/adventure.jar", "--test", str(port)], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
for _ in range(100):
    try:
        with urllib.request.urlopen(base, timeout=1): break
    except OSError: time.sleep(.1)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="chrome", headless=True, args=["--mute-audio", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=d3d11"])
        ctx = b.new_context(viewport={"width": 1280, "height": 1000})
        page = ctx.new_page(); errors = []
        page.on("pageerror", lambda e: errors.append(str(e)[:200]))
        page.goto(base); page.wait_for_function("window.EnchantedCastle")
        page.evaluate("EnchantedCastle.open({colour: () => true})")
        page.wait_for_function("EnchantedCastle.debug.view()==='title'", timeout=60000)
        print(page.evaluate("(()=>{const g=document.createElement('canvas').getContext('webgl');const d=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(d.UNMASKED_RENDERER_WEBGL)})()"))
        page.get_by_role("button", name="Options").click()
        page.get_by_role("button", name="See the remastered throne room").click()
        page.wait_for_function(f"{CORE}?.room?.id===4020", timeout=120000)
        js = """async () => { const t=[]; let last=performance.now(); await new Promise(done=>{ const step=n=>{ t.push(n-last); last=n; t.length<90?requestAnimationFrame(step):done(); }; requestAnimationFrame(step); }); t.shift(); t.sort((a,b)=>a-b); return [t[t.length>>1], t[Math.floor(t.length*.95)], t[t.length-1]].map(v=>Math.round(v*10)/10); }"""
        for r in ROOMS:
            page.evaluate(f"(()=>{{const c={CORE};c.lives=9;c.enter({r},0);c.hero.safe=9999;}})()"); time.sleep(.4)
            print(r, "median/p95/max ms", page.evaluate(js))
        print("errors", errors[:5]); b.close()
finally:
    pr.terminate(); pr.communicate(timeout=15)
