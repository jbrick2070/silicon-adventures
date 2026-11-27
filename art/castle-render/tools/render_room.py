"""Compile, paint, path-trace and finish the room. Usage: render_room.py <workdir> <samples> [scale]

The finished PNGs land in <workdir>/<scale>x and <workdir>/native (see finish_room.py).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
from PIL import Image
import render_core as rc
from scene_kit import S
import paint, room_4020 as room
from finish_room import finish

out, spp = sys.argv[1], int(sys.argv[2]); os.makedirs(out, exist_ok=True)
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 4
ink = np.array(Image.open(room.SRC).convert('L')) < 128
sc_, tone, density = room.build(ink)
print('balls', getattr(sc_, 'balls', 0))
dens4 = cv2.resize(density, (sc_.W4, sc_.H4), interpolation=cv2.INTER_LINEAR)
alb, rough, metal, micro = paint.paint_room(sc_.Z, sc_.Mat, sc_.Grime, tone, dens4, sc_.ink_soft)
Z = sc_.Z + micro
sc = rc.reset()
ob = rc.heightfield('room', Z, 1 / S)
rc.material(ob, alb, rough, metal)
rc.camera(512, 342, 512 * scale, 342 * scale)
# Key from high left, low enough to rake every ledge; the disk's bright centre gets its own pool.
rc.sun((-.52, .64, .56), 3.1, (1, .90, .76), 5)
rc.area((256, -118, 300), 260, 620000, (1, .86, .66), (256, -150, 0))
rc.area((640, -140, 240), 420, 330000, (.55, .68, 1), (300, -170, 0))
rc.world((.50, .60, .80), .16)
a = rc.render(os.path.abspath(f'{out}/room.exr'), spp)
np.save(f'{out}/room_hdr.npy', a)
finish(out)
