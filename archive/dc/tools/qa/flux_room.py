"""Paints a room with local FLUX and ControlNet over ComfyUI's HTTP API. No credits, no pop-up windows."""
import io, json, sys, time, urllib.request, uuid
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps
HOST = "http://127.0.0.1:8000"; R = Path(r"D:\silicon-adventures")
import tempfile
OUT = Path(tempfile.gettempdir()) / "castle-flux"; OUT.mkdir(exist_ok=True)
W, H = 1536, 1024
STYLE = ("cinematic 3D rendered side-on view of a medieval dark fantasy castle interior wall, flat straight-on camera, "
         "weathered grey limestone blocks with deep dark mortar, thick stone ledges and walkways casting real shadows, wooden ladders, hemp ropes, "
         "warm torchlight from the upper left, cool slate shadows on the right, ambient occlusion, physically based materials, highly detailed game background, no people, no text")
def upload(path):
    b = uuid.uuid4().hex; data = path.read_bytes()
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{path.name}"\r\nContent-Type: image/png\r\n\r\n').encode() + data + (f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n').encode()
    urllib.request.urlopen(urllib.request.Request(HOST + "/upload/image", body, {"Content-Type": f"multipart/form-data; boundary={b}"}), timeout=60).read()
def edges(room):
    im = Image.open(R / f"art/castle/B-PSCR-{room}.png").convert("L")
    soft = im.resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3.2))
    e = soft.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 7 else 0)
    return e.convert("RGB")
def run(room, tag, strength, end, denoise, extra=""):
    ctrl = OUT / f"ctrl_{room}.png"; edges(room).save(ctrl); upload(ctrl)
    init = OUT / f"init_{room}.png"
    Image.open(R / f"art/remaster-3d/full/4x/B-PSCR-{room}.png").convert("RGB").resize((W, H), Image.LANCZOS).save(init); upload(init)
    g = {
     "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}},
     "2": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": STYLE + extra}},
     "3": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["2", 0], "guidance": 3.5}},
     "4": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["2", 0]}},
     "5": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "FLUX.1-dev-ControlNet-Union-Pro-2.0\\diffusion_pytorch_model.safetensors"}},
     "6": {"class_type": "LoadImage", "inputs": {"image": ctrl.name}},
     "7": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["3", 0], "negative": ["4", 0], "control_net": ["5", 0], "image": ["6", 0], "strength": strength, "start_percent": 0, "end_percent": end, "vae": ["1", 2]}},
     "8": {"class_type": "LoadImage", "inputs": {"image": init.name}},
     "9": {"class_type": "VAEEncode", "inputs": {"pixels": ["8", 0], "vae": ["1", 2]}},
     "10": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "seed": 1986, "steps": 28, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "positive": ["7", 0], "negative": ["7", 1], "latent_image": ["9", 0], "denoise": denoise}},
     "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["1", 2]}},
     "12": {"class_type": "SaveImage", "inputs": {"images": ["11", 0], "filename_prefix": f"flux/{room}_{tag}"}},
    }
    pid = json.load(urllib.request.urlopen(urllib.request.Request(HOST + "/prompt", json.dumps({"prompt": g}).encode(), {"Content-Type": "application/json"}), timeout=60))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.load(urllib.request.urlopen(f"{HOST}/history/{pid}", timeout=30))
        if pid in h:
            st = h[pid]["status"]
            if st.get("status_str") == "error": print("ERROR", json.dumps(st)[:900]); return None
            f = h[pid]["outputs"]["12"]["images"][0]
            data = urllib.request.urlopen(f"{HOST}/view?filename={f['filename']}&subfolder={f['subfolder']}&type=output", timeout=60).read()
            p = OUT / f"{room}_{tag}.png"; p.write_bytes(data); print(room, tag, round(time.time() - t0), "s"); return p
        time.sleep(3)
if __name__ == "__main__":
    room = sys.argv[1]
    run(room, "pure", .8, .8, 1.0)
    run(room, "over", .7, .8, .78)
