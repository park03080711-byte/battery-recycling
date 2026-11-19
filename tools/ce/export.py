"""재생원료 인증 '인증서가 나오는 공장' 장면 렌더 결과를 사이트용으로 내보내기: 장면 WebP 2종, 단계 마스크 PNG, 좌표 JSON, 소개 페이지 썸네일."""
import sys, os, json
from PIL import Image
src, dst, js = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dst, exist_ok=True)
im = Image.open(f"{src}/cert.png").convert("RGBA")
for w in (2800, 1600):
    r = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS) if w != im.width else im
    r.save(f"{dst}/map-{w}.webp", "WEBP", quality=86, method=6)
for g in ["s1", "s2", "s3", "s4", "d1", "d2"]:
    a = Image.open(f"{src}/mask_{g}.png").split()[3]
    a = a.resize((1400, round(1400 * a.height / a.width)), Image.LANCZOS)
    out = Image.new("LA", a.size, 255)
    out.putalpha(a)
    out.save(f"{dst}/mask_{g}.png", optimize=True)
c = json.load(open(f"{src}/coords.json"))
json.dump(c, open(js, "w"), indent=1)
# 소개 페이지 개편 현황 썸네일 (560폭)
thumb = os.path.join(os.path.dirname(dst), "about", "ce.webp")
im.resize((560, round(560 * im.height / im.width)), Image.LANCZOS).save(thumb, "WEBP", quality=84, method=6)
for f in sorted(os.listdir(dst)):
    print(f, os.path.getsize(f"{dst}/{f}") // 1024, "KB")
print("thumb", os.path.getsize(thumb) // 1024, "KB")
