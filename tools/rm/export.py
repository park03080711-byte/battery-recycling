"""재제조 작업장 렌더 결과를 사이트용으로 내보내기: 장면 WebP 2종, 단계 마스크 PNG, 좌표 JSON."""
import sys, os, json
from PIL import Image
src, dst, js = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dst, exist_ok=True)
im = Image.open(f"{src}/shop.png").convert("RGBA")
for w in (2800, 1600):
    r = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS) if w != im.width else im
    r.save(f"{dst}/shop-{w}.webp", "WEBP", quality=86, method=6)
for g in ["r1", "r2", "r3", "r4"]:
    a = Image.open(f"{src}/mask_{g}.png").split()[3]
    a = a.resize((1400, round(1400 * a.height / a.width)), Image.LANCZOS)
    out = Image.new("LA", a.size, 255)
    out.putalpha(a)
    out.save(f"{dst}/mask_{g}.png", optimize=True)
c = json.load(open(f"{src}/coords.json"))
json.dump(c, open(js, "w"), indent=1)
for f in sorted(os.listdir(dst)):
    print(f, os.path.getsize(f"{dst}/{f}") // 1024, "KB")
