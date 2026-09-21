import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for n in ["pack_closed","pack_open","detail_cell","detail_module","detail_bms","detail_cool"]:
    im = Image.open(f"{src}/{n}.png").convert("RGBA")
    for w in (1920, 1200):
        r = im.resize((w, round(w*im.height/im.width)), Image.LANCZOS)
        r.save(f"{dst}/{n}-{w}.webp", "WEBP", quality=84, method=6)
for g in ["cell","module","bms","case"]:
    a = Image.open(f"{src}/mask_{g}.png").split()[3]
    a = a.resize((960, 540), Image.LANCZOS)
    out = Image.new("LA", a.size, 255); out.putalpha(a)
    out.save(f"{dst}/mask_{g}.png", optimize=True)
for f in sorted(os.listdir(dst)): print(f, os.path.getsize(f"{dst}/{f}")//1024, "KB")
