"""Contact sheet: original vs relief, plus the sprites placed in the room."""
import os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')).replace('\\', '/')
SRC = f'{ROOT}/art/castle'
OUT = f'{ROOT}/art/castle-relief'


def rgba(p):
    return Image.open(p).convert('RGBA')


room_o = rgba(f'{SRC}/B-PSCR-4020.png')
room_n = rgba(f'{OUT}/native/B-PSCR-4020.png')
hero_o, hero_n = rgba(f'{SRC}/A-PPCT-101.png'), rgba(f'{OUT}/native/A-PPCT-101.png')
garg_o, garg_n = rgba(f'{SRC}/B-PPCT-906.png'), rgba(f'{OUT}/native/B-PPCT-906.png')

# in-game composite: hero on the left platform, gargoyle on the centre ledge
scene = room_n.copy()
scene.alpha_composite(hero_n.crop((0, 0, 32, 40)), (120, 216))
scene.alpha_composite(hero_n.crop((96, 0, 128, 40)), (330, 216))
scene.alpha_composite(garg_n.crop((0, 0, 48, 32)), (232, 138))
scene.alpha_composite(garg_n.crop((96, 0, 144, 32)), (380, 70))
scene_o = room_o.copy()
scene_o.alpha_composite(hero_o.crop((0, 0, 32, 40)), (120, 216))
scene_o.alpha_composite(hero_o.crop((96, 0, 128, 40)), (330, 216))
scene_o.alpha_composite(garg_o.crop((0, 0, 48, 32)), (232, 138))
scene_o.alpha_composite(garg_o.crop((96, 0, 144, 32)), (380, 70))

Z = 2
W = 512 * Z * 2 + 60
sheet = Image.new('RGB', (W, 342 * Z + 40 * 8 + 32 * 8 + 140), (28, 30, 36))
d = ImageDraw.Draw(sheet)
y = 20
d.text((20, y - 14), 'B-PSCR-4020  original (1986)', fill=(220, 220, 220))
d.text((40 + 512 * Z, y - 14), 'B-PSCR-4020  relief remaster, native 512x342, sprites placed', fill=(220, 220, 220))
sheet.paste(scene_o.resize((512 * Z, 342 * Z), Image.NEAREST), (20, y))
sheet.paste(scene.resize((512 * Z, 342 * Z), Image.NEAREST), (40 + 512 * Z, y))
y += 342 * Z + 30
for label, o, nn, h in (('A-PPCT-101  hero x4', hero_o, hero_n, 40), ('B-PPCT-906  gargoyle x4', garg_o, garg_n, 32)):
    d.text((20, y - 14), label, fill=(220, 220, 220))
    bg = Image.new('RGBA', o.size, (84, 92, 112, 255))
    bo = bg.copy(); bo.alpha_composite(o)
    bn = bg.copy(); bn.alpha_composite(nn)
    sheet.paste(bo.resize((o.width * 4, h * 4), Image.NEAREST), (20, y))
    sheet.paste(bn.resize((o.width * 4, h * 4), Image.NEAREST), (40 + o.width * 4, y))
    y += h * 4 + 30
sheet.save(f'{OUT}/preview.png')
scene.save(f'{OUT}/preview-scene.png')
print('preview written')
