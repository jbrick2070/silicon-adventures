"""Gets normals and depth for a painted room from MoGe in ComfyUI, then previews moving light."""
import json, sys, time, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from flux_room import HOST, R, OUT, upload
room = sys.argv[1]
p = OUT / f"lit_{room}.png"; Image.open(R / f"art/castle-3d/4x/B-PSCR-{room}.png").convert("RGB").resize((1536, 1026), Image.LANCZOS).save(p); upload(p)
g = {"1": {"class_type": "LoadMoGeModel", "inputs": {"model_name": "moge_2_vitl_normal_fp16.safetensors"}},
     "2": {"class_type": "LoadImage", "inputs": {"image": p.name}},
     "3": {"class_type": "MoGeInference", "inputs": {"moge_model": ["1", 0], "image": ["2", 0], "resolution_level": 9}},
     "4": {"class_type": "MoGeRender", "inputs": {"moge_geometry": ["3", 0], "output": "normal_opengl"}},
     "5": {"class_type": "MoGeRender", "inputs": {"moge_geometry": ["3", 0], "output": "depth"}},
     "6": {"class_type": "SaveImage", "inputs": {"images": ["4", 0], "filename_prefix": f"lit/normal_{room}"}},
     "7": {"class_type": "SaveImage", "inputs": {"images": ["5", 0], "filename_prefix": f"lit/depth_{room}"}}}
info = json.load(urllib.request.urlopen(f"{HOST}/object_info/MoGeInference", timeout=20))["MoGeInference"]["input"]
for k, v in {**info.get("required", {}), **info.get("optional", {})}.items():
    if k not in g["3"]["inputs"] and len(v) > 1 and "default" in v[1]: g["3"]["inputs"][k] = v[1]["default"]
pid = json.load(urllib.request.urlopen(urllib.request.Request(HOST + "/prompt", json.dumps({"prompt": g}).encode(), {"Content-Type": "application/json"}), timeout=60))["prompt_id"]
while True:
    h = json.load(urllib.request.urlopen(f"{HOST}/history/{pid}", timeout=30))
    if pid in h: break
    time.sleep(2)
if h[pid]["status"].get("status_str") == "error": print(json.dumps(h[pid]["status"])[:800]); sys.exit(1)
def fetch(n, name):
    f = h[pid]["outputs"][n]["images"][0]; q = OUT / name
    q.write_bytes(urllib.request.urlopen(f"{HOST}/view?filename={f['filename']}&subfolder={f['subfolder']}&type=output", timeout=60).read()); return q
nf = fetch("6", f"normal_{room}.png"); df = fetch("7", f"depth_{room}.png")
base = np.array(Image.open(p).convert("RGB")).astype(float) / 255
N = np.array(Image.open(nf).convert("RGB").resize((base.shape[1], base.shape[0]), Image.LANCZOS)).astype(float) / 127.5 - 1
N /= np.maximum(np.linalg.norm(N, axis=2, keepdims=True), 1e-5)
def lit(lx, ly):
    h_, w_ = base.shape[:2]; yy, xx = np.mgrid[0:h_, 0:w_]
    L = np.dstack([(lx - xx) / w_ * 3, (yy - ly) / w_ * 3, np.full(xx.shape, .35)]); dist = np.linalg.norm(L, axis=2, keepdims=True); L /= dist
    diff = np.clip((N * L).sum(2, keepdims=True), 0, 1); fall = 1 / (1 + (dist * 1.6) ** 2)
    out = base * (.52 + 2.1 * diff * fall * np.array([1.0, .78, .5])[None, None]); return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
a, b = lit(380, 880), lit(1130, 520)
o = Image.new("RGB", (1546 * 1, 1036 // 2 * 2), (255, 0, 0))
sheet = Image.new("RGB", (768 * 2 + 10, 513 * 2 + 10), (255, 0, 0))
sheet.paste(Image.open(p).convert("RGB").resize((768, 513)), (0, 0)); sheet.paste(Image.open(nf).convert("RGB").resize((768, 513)), (778, 0))
sheet.paste(a.resize((768, 513)), (0, 523)); sheet.paste(b.resize((768, 513)), (778, 523)); sheet.save(OUT / f"lit_sheet_{room}.png"); print("ok")
