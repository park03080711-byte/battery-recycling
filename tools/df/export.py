"""분해를 고려한 설계 '두 팩 나란히 뜯기' 장면 렌더 결과를 사이트용으로 내보내기: 장면 WebP 2종, 단계 마스크 PNG, 좌표 JSON, 소개 페이지 썸네일."""
import sys, os, json
from PIL import Image, ImageChops, ImageFilter
src, dst, js = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dst, exist_ok=True)
im = Image.open(f"{src}/df.png").convert("RGBA")
for w in (2800, 1600):
    r = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS) if w != im.width else im
    r.save(f"{dst}/map-{w}.webp", "WEBP", quality=86, method=6)
for g in ["h1", "h2", "h3", "e1", "e2", "e3"]:
    a = Image.open(f"{src}/mask_{g}.png").split()[3]
    # 반투명 재질이 holdout을 일부 통과해 흐리게 남는 것을 지움: 진한 부분 둘레만 남김 (11과 같은 처리)
    keep = a.point(lambda v: 255 if v > 200 else 0).filter(ImageFilter.MaxFilter(31))
    a = ImageChops.multiply(a, keep)
    a = a.resize((1400, round(1400 * a.height / a.width)), Image.LANCZOS)
    out = Image.new("LA", a.size, 255)
    out.putalpha(a)
    out.save(f"{dst}/mask_{g}.png", optimize=True)
c = json.load(open(f"{src}/coords.json"))
json.dump(c, open(js, "w"), indent=1)
# 소개 페이지 개편 현황 썸네일 (560폭)
thumb = os.path.join(os.path.dirname(dst), "about", "df.webp")
im.resize((560, round(560 * im.height / im.width)), Image.LANCZOS).save(thumb, "WEBP", quality=84, method=6)
for f in sorted(os.listdir(dst)):
    print(f, os.path.getsize(f"{dst}/{f}") // 1024, "KB")
print("thumb", os.path.getsize(thumb) // 1024, "KB")
