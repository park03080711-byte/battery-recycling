"""공정 재생 자료를 사이트용으로 내보내기.

- 클린 배경: plate_r2.png를 기존 장면(shop-2800.webp 원본)에 가장자리를 부드럽게 섞어 덧붙인다 → shop-{2800,1600}.webp
- ② 마스크: mask_r2.png → 1400폭 LA PNG
- 설비 클립: 프레임을 한 장의 스프라이트(WebP, 투명)로 묶는다 → shop-clip-{id}.webp
- ② 정지 모습: 클립 첫 프레임을 따로 → shop-rest-r2.webp (스프라이트가 오기 전에 보이도록)
- 좌표: motion.json (흐름선 · 멈춤점 · 클립 위치/크기/프레임)

python motion_export.py <anim_dir> <orig_dir(원본 shop-2800.webp)> <public/rm> <components/rm/motion.json>
"""
import sys, os, json
from PIL import Image, ImageChops, ImageFilter

src, orig, dst, js = sys.argv[1:5]
meta = json.load(open(f"{src}/motion_meta.json"))
W, H, CW, CH = meta["w"], meta["h"], meta["cw"], meta["ch"]


def best_offset(base, patch, x, y, mask=None):
    """렌더 경계의 반올림 차이(±1px)를 원본과 비교해 맞춘다"""
    best = None
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            ref = base.crop((x + dx, y + dy, x + dx + patch.width, y + dy + patch.height))
            d = ImageChops.difference(ref.convert("RGB"), patch.convert("RGB")).convert("L")
            if mask is not None:
                d = ImageChops.multiply(d, mask)
            s = sum(i * n for i, n in enumerate(d.histogram()))
            if best is None or s < best[0]:
                best = (s, dx, dy)
    return best[1], best[2]


# ── 클린 배경 ──
if os.path.exists(f"{src}/plate_r2.png"):
    base = Image.open(f"{orig}/shop-2800.webp").convert("RGBA")
    plate = Image.open(f"{src}/plate_r2.png").convert("RGBA")
    bx, by, bw, bh = meta["plate"]["box"]
    x, y = round(bx / 100 * W), round(by / 100 * H)
    dx, dy = best_offset(base, plate, x, y)
    x, y = x + dx, y + dy
    # 가장자리 32px에서 부드럽게 섞기
    f = 32
    m = Image.new("L", plate.size, 0)
    m.paste(255, (f, f, plate.width - f, plate.height - f))
    m = m.filter(ImageFilter.GaussianBlur(f / 2.5))
    region = base.crop((x, y, x + plate.width, y + plate.height))
    base.paste(Image.composite(plate, region, m), (x, y))
    for w in (2800, 1600):
        r = base.resize((w, round(w * H / W)), Image.LANCZOS) if w != W else base
        r.save(f"{dst}/shop-{w}.webp", "WEBP", quality=86, method=6)
    print("plate at", x, y, "offset", dx, dy)

if os.path.exists(f"{src}/mask_r2.png"):
    a = Image.open(f"{src}/mask_r2.png").split()[3]
    a = a.resize((1400, round(1400 * a.height / a.width)), Image.LANCZOS)
    out = Image.new("LA", a.size, 255)
    out.putalpha(a)
    out.save(f"{dst}/mask_r2.png", optimize=True)

# ── 흐름선 가림 마스크: 물체가 없는 곳만 보이게 (알파 반전) ──
if os.path.exists(f"{src}/occ.png"):
    a = Image.open(f"{src}/occ.png").split()[3]
    a = a.point(lambda v: 255 - v).filter(ImageFilter.GaussianBlur(0.6))
    out = Image.new("LA", a.size, 255)
    out.putalpha(a)
    out.save(f"{dst}/shop-flowmask.png", optimize=True)
    print("flowmask", os.path.getsize(f"{dst}/shop-flowmask.png") // 1024, "KB")

# ── 설비 클립 → 스프라이트 ──
SCALE = 1.0  # 1750폭 기준 그대로 (확대 1.75배에서도 흐리지 않게)
clips = {}
# 렌더 경계의 반올림 차이: ② 첫 프레임(매달린 모듈)을 원본 장면과 맞춰 본다 → 모든 클립에 같은 보정
ODX = ODY = 0
if "r2" in meta.get("clips", {}):
    ref = Image.open(f"{orig}/shop-2800.webp").convert("RGBA").resize((CW, CH), Image.LANCZOS)
    f0 = Image.open(f"{src}/r2/000.png").convert("RGBA")
    bx, by = meta["clips"]["r2"]["box"][:2]
    ODX, ODY = best_offset(ref, f0, round(bx / 100 * CW), round(by / 100 * CH), mask=f0.split()[3].point(lambda v: 255 if v > 200 else 0))
    print("clip offset", ODX, ODY)
for cid, c in meta.get("clips", {}).items():
    frames = [Image.open(f"{src}/{cid}/{i:03d}.png").convert("RGBA") for i in range(c["frames"])]
    fw, fh = frames[0].size
    if SCALE != 1.0:
        fw, fh = round(fw * SCALE), round(fh * SCALE)
        frames = [fr.resize((fw, fh), Image.LANCZOS) for fr in frames]
    # 빈 가장자리 잘라내기: 모든 프레임의 알파 합집합 경계
    union = Image.new("L", (fw, fh), 0)
    for fr in frames:
        union = ImageChops.lighter(union, fr.split()[3])
    bb = union.point(lambda v: 255 if v > 2 else 0).getbbox()
    pad = 2
    bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(fw, bb[2] + pad), min(fh, bb[3] + pad))
    frames = [fr.crop(bb) for fr in frames]
    tw, th = frames[0].size
    cols = min(len(frames), max(1, 4096 // tw))
    rows = -(-len(frames) // cols)
    sheet = Image.new("RGBA", (cols * tw, rows * th), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, ((i % cols) * tw, (i // cols) * th))
    sheet.save(f"{dst}/shop-clip-{cid}.webp", "WEBP", quality=82, method=6)
    # 화면 위치(%): 렌더 경계(1750폭 기준 픽셀) + 잘라낸 만큼
    bx, by, bw, bh = c["box"]
    x0 = round(bx / 100 * CW) + ODX
    y0 = round(by / 100 * CH) + ODY
    px, py = x0 + bb[0], y0 + bb[1]
    clips[cid] = {
        "box": [round(px / CW * 100, 4), round(py / CH * 100, 4), round(tw / CW * 100, 4), round(th / CH * 100, 4)],
        "fw": tw, "fh": th, "cols": cols, "frames": len(frames), "fps": 20,
    }
    if cid == "r2":
        frames[0].save(f"{dst}/shop-rest-r2.webp", "WEBP", quality=86, method=6)
        clips[cid]["rest"] = True
    print(cid, "frame", tw, th, "sheet", sheet.size, os.path.getsize(f"{dst}/shop-clip-{cid}.webp") // 1024, "KB")

out = {"path": meta["path"], "stops": meta["stops"], "clips": clips, "flowmask": os.path.exists(f"{dst}/shop-flowmask.png")}
if os.path.exists(js):
    old = json.load(open(js))
    if not clips and "clips" in old:
        out["clips"] = old["clips"]
json.dump(out, open(js, "w"), indent=1)
print("wrote", js)
