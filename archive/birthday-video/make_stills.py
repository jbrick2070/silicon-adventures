"""Makes the video's opening stills with local FLUX in ComfyUI. No credits. Needs ComfyUI on port 8000."""
import json, tempfile, time, urllib.request
from pathlib import Path
HOST = "http://127.0.0.1:8000"; OUT = Path(__file__).parent / "stills"; OUT.mkdir(exist_ok=True)
STYLE = "cinematic 3D animated film still, rich solid materials, muted dark yellow key light, cool slate fill, soft detail, sharp focus. "
DUNCAN = "a nervous young man with chestnut shoulder-length hair, a cream linen tunic, a brown leather belt, navy breeches and brown boots"
ELRON = "an aged wizard with a long white beard and plain grey-blue robes"
MACHINE = "a beige 1986 all-in-one desktop computer bolted onto a cart with four iron wheels, trailing cables, with a big brass lever"
SHOTS = {
    1: f"Night in a medieval stone workshop full of cables and candles. {ELRON} stands proudly beside {MACHINE}. Wide shot.",
    2: f"In a candlelit stone workshop, {DUNCAN} climbs onto {MACHINE}, holding a small bag of rocks and looking worried.",
    3: "Close-up of a small beige 1986 computer screen glowing with green numbers, an old wrinkled hand turning a brass dial beside it, candlelit stone behind.",
    4: "Close-up of a small beige 1986 computer screen showing a plain sad face and a small round bomb icon, bright sparks flying from the case, dark stone workshop behind.",
    5: "An empty medieval stone workshop floor at night, two long parallel burning wheel tracks of flame on the flagstones, smoke drifting, candles.",
    6: f"{DUNCAN} and {ELRON} stand beside {MACHINE} on a wet neon city street at night where the buildings look slightly pixelated, both staring upward in amazement.",
    7: f"{DUNCAN} and {ELRON} stand on a street while the city around them breaks apart into black and white dots, half the frame turning to dither.",
    8: f"{DUNCAN} and {ELRON} fall through the air into a grand sunlit medieval stone hall with arched oak doors, seen from below.",
}
def graph(n, text):
    return {"1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}},
            "2": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": STYLE + text}},
            "3": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["2", 0], "guidance": 3.5}},
            "4": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["2", 0]}},
            "8": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1280, "height": 720, "batch_size": 1}},
            "10": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "seed": 1986 + n, "steps": 26, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "positive": ["3", 0], "negative": ["4", 0], "latent_image": ["8", 0], "denoise": 1}},
            "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["1", 2]}},
            "12": {"class_type": "SaveImage", "inputs": {"images": ["11", 0], "filename_prefix": f"birthday/shot_{n}"}}}
for n, text in SHOTS.items():
    body = json.dumps({"prompt": graph(n, text)}).encode()
    pid = json.load(urllib.request.urlopen(urllib.request.Request(HOST + "/prompt", body, {"Content-Type": "application/json"}), timeout=60))["prompt_id"]
    while True:
        h = json.load(urllib.request.urlopen(f"{HOST}/history/{pid}", timeout=30))
        if pid in h: break
        time.sleep(3)
    if h[pid]["status"].get("status_str") == "error":
        print(n, "error", json.dumps(h[pid]["status"])[:400]); continue
    f = h[pid]["outputs"]["12"]["images"][0]
    (OUT / f"shot-{n}.png").write_bytes(urllib.request.urlopen(f"{HOST}/view?filename={f['filename']}&subfolder={f['subfolder']}&type=output", timeout=60).read())
    print(n, "done", flush=True)
