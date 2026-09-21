"""PCB 배선 · 경고 라벨 텍스처를 직접 그린다 (외부 이미지 없음)."""
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

random.seed(7)
OUT = "tex"
import os

os.makedirs(OUT, exist_ok=True)
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def pcb(name, w, h, label, seed):
    random.seed(seed)
    base = (18, 74, 38)
    im = Image.new("RGB", (w, h), base)
    d = ImageDraw.Draw(im)
    trace = (30, 104, 54)
    # 배선: 직교 + 45도 꺾임
    for _ in range(int(w * h / 2600)):
        x, y = random.randrange(0, w, 8), random.randrange(0, h, 8)
        wd = random.choice([2, 2, 3, 4, 6])
        for _ in range(random.randint(2, 5)):
            dirn = random.choice([(1, 0), (0, 1), (1, 1), (1, -1), (-1, 0), (0, -1)])
            ln = random.randint(20, 140)
            nx, ny = x + dirn[0] * ln, y + dirn[1] * ln
            d.line([(x, y), (nx, ny)], fill=trace, width=wd)
            x, y = nx, ny
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(196, 160, 82))
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(20, 30, 20))
    # 넓은 동박 면(그라운드)
    for _ in range(4):
        x, y = random.randrange(0, w), random.randrange(0, h)
        d.rectangle([x, y, x + random.randint(60, 200), y + random.randint(30, 90)], fill=(26, 92, 48))
    # 패드 줄
    for _ in range(18):
        x, y = random.randrange(40, w - 120), random.randrange(40, h - 40)
        for i in range(random.randint(4, 12)):
            d.rectangle([x + i * 12, y, x + i * 12 + 7, y + 14], fill=(206, 170, 90))
    # 실크 인쇄
    f = ImageFont.truetype(MONO, max(14, w // 40))
    d.text((w * 0.05, h * 0.9), label, fill=(232, 236, 230), font=f)
    for i in range(10):
        x, y = random.randrange(20, w - 80), random.randrange(20, h - 30)
        d.text((x, y), random.choice(["C", "R", "U", "J", "D", "Q"]) + str(random.randint(1, 64)), fill=(220, 226, 218), font=ImageFont.truetype(MONO, max(10, w // 70)))
    # 모서리 고정 구멍
    for cx, cy in [(24, 24), (w - 24, 24), (24, h - 24), (w - 24, h - 24)]:
        d.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=(200, 164, 84))
        d.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(10, 10, 10))
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im.save(f"{OUT}/{name}.png")


def hv_label():
    w, h = 1200, 520
    im = Image.new("RGB", (w, h), (246, 196, 18))
    d = ImageDraw.Draw(im)
    d.rectangle([10, 10, w - 10, h - 10], outline=(20, 20, 20), width=10)
    # 경고 삼각형 + 번개
    tri = [(70, 420), (250, 100), (430, 420)]
    d.polygon(tri, fill=(20, 20, 20))
    inner = [(120, 390), (250, 160), (380, 390)]
    d.polygon(inner, fill=(246, 196, 18))
    bolt = [(262, 190), (205, 300), (248, 300), (224, 378), (300, 272), (258, 272), (286, 190)]
    d.polygon(bolt, fill=(20, 20, 20))
    fb = ImageFont.truetype(SANS_B, 88)
    fs = ImageFont.truetype(SANS_B, 40)
    d.text((480, 110), "DANGER", fill=(20, 20, 20), font=fb)
    d.text((480, 220), "HIGH VOLTAGE", fill=(20, 20, 20), font=fs)
    d.text((480, 280), "400 V DC  ·  Li-ion", fill=(20, 20, 20), font=fs)
    d.text((480, 360), "Qualified personnel only", fill=(40, 40, 40), font=ImageFont.truetype(MONO, 30))
    im.save(f"{OUT}/hv_label.png")


def id_plate():
    w, h = 900, 520
    im = Image.new("RGB", (w, h), (214, 216, 218))
    d = ImageDraw.Draw(im)
    fb = ImageFont.truetype(SANS_B, 54)
    fm = ImageFont.truetype(MONO, 30)
    d.text((40, 36), "RE:CELL  PACK-96S", fill=(24, 26, 30), font=fb)
    lines = ["Type      Li-ion NCM / pouch", "Config    96S2P  (8 modules)", "Nominal   355 V  ·  63 Ah", "Energy    22.4 kWh", "Mass      164 kg"]
    for i, s in enumerate(lines):
        d.text((40, 130 + i * 50), s, fill=(40, 42, 46), font=fm)
    # 데이터 매트릭스 느낌의 격자 (배터리 여권 QR 자리)
    random.seed(3)
    ox, oy, c = 690, 150, 11
    for i in range(16):
        for j in range(16):
            if i in (0, 15) or j in (0,) or random.random() < 0.45:
                d.rectangle([ox + i * c, oy + j * c, ox + i * c + c - 1, oy + j * c + c - 1], fill=(20, 20, 20))
    d.rectangle([4, 4, w - 5, h - 5], outline=(120, 124, 130), width=4)
    im.save(f"{OUT}/id_plate.png")


pcb("pcb_bms", 1536, 1024, "BMS-MASTER  REV 2.1", 11)
pcb("pcb_cmu", 768, 480, "CMU-12  REV 1.4", 23)
hv_label()
id_plate()
print("ok")
