"""네 층위 패널 그림 합성 — render.py가 만든 투명 물체를 층위색 그러데이션 위에 얹어 데스크톱 · 폰용 그림을 만든다.

데스크톱 (1400×1800, 패널 비율 0.4~0.8에 맞춰 가운데를 기준으로 잘려 보임):
  물체는 가운데 폭 36% · 높이 13~58% 안에 — 위쪽은 메뉴 바, 아래 40%는 제목 · 설명 · 주제 버튼 자리.
  마지막(설계) 칸은 오른쪽 위치 표시 점을 피하려고 물체를 조금 왼쪽으로.
폰 (780×440, 투명 배경): 패널 맨 위 띠 그림. 물체를 가운데에 높이 84% 안으로.
python compose.py <렌더 폴더> <public/home>
"""
import sys, os
from PIL import Image, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
GRAD = {  # components/Art.tsx layerGrad와 같은 값 (위 = 밝은 색, 아래 = 어두운 색)
    "paths": ("#1a8a70", "#0b4f40"),
    "support": ("#2a63c4", "#0a2d6b"),
    "evaluation": ("#c24a72", "#6e1b38"),
    "design": ("#a88445", "#4f3c17"),
}
SHIFT = {"design": -0.05}


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, top, bot):
    """SVG의 x1=0 y1=0 x2=0.4 y2=1 비스듬한 선형 그러데이션과 같은 방향"""
    a, b = rgb(top), rgb(bot)
    g = Image.new("RGB", (w, h))
    px = g.load()
    dx, dy = 0.4 * w, 1.0 * h
    n = dx * dx + dy * dy
    for y in range(h):
        for x in range(w):
            t = max(0.0, min(1.0, (x * dx + y * dy) / n))
            px[x, y] = tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
    return g


def glow(img, cx, cy, rx, ry, alpha):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=alpha)
    m = m.filter(ImageFilter.GaussianBlur(max(rx, ry) * 0.45))
    white = Image.new("RGB", img.size, (255, 255, 255))
    return Image.composite(white, img, m)


def place(canvas, obj, box):
    """obj(RGBA)를 box(x0, y0, x1, y1) 안에 비율대로 최대한 크게, 가운데에"""
    x0, y0, x1, y1 = box
    k = min((x1 - x0) / obj.width, (y1 - y0) / obj.height)
    o = obj.resize((round(obj.width * k), round(obj.height * k)), Image.LANCZOS)
    x = round((x0 + x1) / 2 - o.width / 2)
    y = round((y0 + y1) / 2 - o.height / 2)
    canvas.paste(o, (x, y), o)
    return (x, y, x + o.width, y + o.height)


for name, (top, bot) in GRAD.items():
    obj = Image.open(f"{src}/{name}.png").convert("RGBA")
    # 그림자 받이가 만든 그림자가 렌더 테두리에서 끊기지 않게 가장자리 알파를 부드럽게 줄임
    fw, fh = round(obj.width * 0.1), round(obj.height * 0.1)
    fade = Image.new("L", obj.size, 0)
    ImageDraw.Draw(fade).rectangle((fw, fh, obj.width - fw, obj.height - fh), fill=255)
    fade = fade.filter(ImageFilter.GaussianBlur(min(fw, fh) * 0.6))
    obj.putalpha(Image.composite(obj.getchannel("A"), Image.new("L", obj.size, 0), fade))
    obj = obj.crop(obj.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    # 데스크톱
    W, H = 1400, 1800
    sx = SHIFT.get(name, 0) * W
    c = gradient(W // 4, H // 4, top, bot).resize((W, H), Image.BICUBIC)
    c = glow(c, W / 2 + sx, H * 0.36, W * 0.26, H * 0.2, 46)
    c = c.convert("RGBA")
    bx = place(c, obj, (W * 0.32 + sx, H * 0.13, W * 0.68 + sx, H * 0.58))
    c = c.convert("RGB")
    c.save(f"{dst}/layer-{name}.webp", "WEBP", quality=84, method=6)
    c.resize((W // 2, H // 2), Image.LANCZOS).save(f"{dst}/layer-{name}-700.webp", "WEBP", quality=84, method=6)
    # 폰 띠 — 배경은 투명(패널의 CSS 그러데이션이 비쳐 이음매가 없음), 뒤의 옅은 빛만 넣음
    w, h = 780, 440
    gm = Image.new("L", (w, h), 0)
    ImageDraw.Draw(gm).ellipse((w / 2 - w * 0.32, h * 0.52 - h * 0.36, w / 2 + w * 0.32, h * 0.52 + h * 0.36), fill=40)
    gm = gm.filter(ImageFilter.GaussianBlur(w * 0.32 * 0.45))
    m = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    m.putalpha(gm)
    place(m, obj, (w * 0.18, h * 0.08, w * 0.82, h * 0.92))
    m.save(f"{dst}/layer-{name}-m.webp", "WEBP", quality=86, method=6)
    print(name, "obj", obj.size, "desk box", [round(v) for v in bx],
          *[f"{f} {os.path.getsize(f'{dst}/{f}') // 1024}KB" for f in (f"layer-{name}.webp", f"layer-{name}-700.webp", f"layer-{name}-m.webp")])
