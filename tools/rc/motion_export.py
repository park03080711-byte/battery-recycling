"""공정 재생 자료 → 사이트용 (공통). tools/rc/motion_kit.py 결과를 받는다.

python motion_export.py <anim_dir> <원본 장면 2800 WebP> <출력 접두어 예: ../../public/rs/yard> <motion.json> [tw=1750]
- 클린 배경: plate_*.png를 원본에 부드럽게 덧붙여 {접두어}-2800/1600.webp
- 마스크: mask_{grp}.png → {폴더}/mask_{grp}.png (1400폭 LA)
- 클립: 프레임을 스프라이트로 → {접두어}-clip-{key}.webp (+ 제자리 모습 {접두어}-rest-{key}.webp)
- 가림 마스크: occ.png → {접두어}-flowmask.png
- motion.json: routes · clips(위치 % · 프레임 · 속한 단계) · flowmask
"""
import sys, os, json
from PIL import Image, ImageChops, ImageFilter

src, orig, prefix, js = sys.argv[1:5]
kw = dict(a.split("=") for a in sys.argv[5:] if "=" in a)
TW = int(kw.get("tw", 1750))
meta = json.load(open(f"{src}/motion_meta.json"))
W, H = meta["w"], meta["h"]
dst = os.path.dirname(prefix)
S = TW / W


def best_offset(base, patch, x, y, mask=None):
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


base0 = Image.open(orig).convert("RGBA")
assert base0.size == (W, H), (base0.size, W, H)

# ── 클린 배경 ──
plates = {k: v for k, v in meta.get("plates", {}).items() if os.path.exists(f"{src}/plate_{k}.png")}
if plates:
    base = base0.copy()
    for k, v in plates.items():
        plate = Image.open(f"{src}/plate_{k}.png").convert("RGBA")
        bx, by = v["box"][:2]
        x, y = round(bx / 100 * W), round(by / 100 * H)
        dx, dy = best_offset(base0, plate, x, y)
        x, y = x + dx, y + dy
        f = 32
        m = Image.new("L", plate.size, 0)
        m.paste(255, (f, f, plate.width - f, plate.height - f))
        m = m.filter(ImageFilter.GaussianBlur(f / 2.5))
        region = base.crop((x, y, x + plate.width, y + plate.height))
        base.paste(Image.composite(plate, region, m), (x, y))
        print("plate", k, "at", x, y, "offset", dx, dy)
    for w in (2800, 1600):
        r = base.resize((w, round(w * H / W)), Image.LANCZOS) if w != W else base
        r.save(f"{prefix}-{w}.webp", "WEBP", quality=86, method=6)
    for k in plates:
        if os.path.exists(f"{src}/mask_{k}.png"):
            a = Image.open(f"{src}/mask_{k}.png").split()[3]
            a = a.resize((1400, round(1400 * a.height / a.width)), Image.LANCZOS)
            out = Image.new("LA", a.size, 255)
            out.putalpha(a)
            out.save(f"{dst}/mask_{k}.png", optimize=True)

# ── 가림 마스크 ──
if os.path.exists(f"{src}/occ.png"):
    a = Image.open(f"{src}/occ.png").split()[3].point(lambda v: 255 - v).filter(ImageFilter.GaussianBlur(0.6))
    out = Image.new("LA", a.size, 255)
    out.putalpha(a)
    out.save(f"{prefix}-flowmask.png", optimize=True)

# ── 클립 ──
ODX = ODY = 0
for k, c in meta.get("clips", {}).items():
    if c.get("rest") and os.path.exists(f"{src}/{k}/000.png"):
        f0 = Image.open(f"{src}/{k}/000.png").convert("RGBA")
        bx, by = c["box"][:2]
        ODX, ODY = best_offset(base0, f0, round(bx / 100 * W), round(by / 100 * H), mask=f0.split()[3].point(lambda v: 255 if v > 200 else 0))
        print("clip offset", ODX, ODY, "(from", k, ")")
        break

clips = {}
for k, c in meta.get("clips", {}).items():
    frames = [Image.open(f"{src}/{k}/{i:03d}.png").convert("RGBA") for i in range(c["frames"])]
    fw, fh = frames[0].size
    union = Image.new("L", (fw, fh), 0)
    for fr in frames:
        union = ImageChops.lighter(union, fr.split()[3])
    bb = union.point(lambda v: 255 if v > 2 else 0).getbbox()
    pad = 3
    bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(fw, bb[2] + pad), min(fh, bb[3] + pad))
    cw, ch = bb[2] - bb[0], bb[3] - bb[1]
    tw, th = max(1, round(cw * S)), max(1, round(ch * S))
    frames = [fr.crop(bb).resize((tw, th), Image.LANCZOS) for fr in frames]
    cols = min(len(frames), max(1, 4096 // tw))
    rows = -(-len(frames) // cols)
    sheet = Image.new("RGBA", (cols * tw, rows * th), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, ((i % cols) * tw, (i // cols) * th))
    sheet.save(f"{prefix}-clip-{k}.webp", "WEBP", quality=82, method=6)
    bx, by = c["box"][:2]
    px = round(bx / 100 * W) + ODX + bb[0]
    py = round(by / 100 * H) + ODY + bb[1]
    clips[k] = {"box": [round(px / W * 100, 4), round(py / H * 100, 4), round(cw / W * 100, 4), round(ch / H * 100, 4)],
                "fw": tw, "fh": th, "cols": cols, "frames": len(frames), "fps": 20}
    if c.get("step", k) != k:
        clips[k]["step"] = c["step"]
    if c.get("rest"):
        frames[0].save(f"{prefix}-rest-{k}.webp", "WEBP", quality=86, method=6)
        clips[k]["rest"] = True
    print(k, "frame", tw, th, "sheet", sheet.size, os.path.getsize(f"{prefix}-clip-{k}.webp") // 1024, "KB")

out = {"routes": meta["routes"], "clips": clips, "flowmask": os.path.exists(f"{prefix}-flowmask.png")}
json.dump(out, open(js, "w"), indent=1)
print("wrote", js)
