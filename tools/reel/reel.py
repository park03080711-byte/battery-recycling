"""소개 페이지 영상 1 — capture.mjs가 찍은 지도 화면으로 주제별 MP4 · 포스터 · 목록(JSON)을 만든다.

주제마다 한 편: 재생 전 화면(포스터) → 공정 재생 프레임(capture.mjs의 STEP대로, 기본 1.5배속) → 끝 화면을 0.5초 붙잡음.
사용자가 번호를 고르고 '공정 재생'을 눌렀을 때만 그 주제 한 편을 받아 한 번 재생한다(반복 · 자동 재생 없음).
python reel.py <찍은 폴더> <public/about/reel> <components/about/reel.json>
"""
import sys, os, json, shutil, subprocess, tempfile
from PIL import Image

SLUGS = ["remanufacturing", "reuse", "recycling", "upcycling", "soh-diagnosis", "safety", "automated-disassembly",
         "byproduct-recovery", "traceability", "certification", "lca", "techno-economic", "supply-chain", "design-for-disassembly"]
W, H, FPS = 1280, 790, 24
HOLD0, HOLD1 = 3, 12
SPEED = 1.5  # capture.mjs STEP 62.5 ms × 24fps

src, dst, js = sys.argv[1], sys.argv[2], sys.argv[3]


def fit(path):
    """지도 화면을 W×H 안에 비율 그대로 맞추고, 남는 곳은 가장자리 한 줄을 늘여 채움(바탕 그러데이션이 끊기지 않게)"""
    im = Image.open(path).convert("RGB")
    im = im.crop((2, 2, im.width - 2, im.height - 2))  # 지도 무대의 1px 테두리 선을 뺌
    k = min(W / im.width, H / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = Image.new("RGB", (W, H))
    x0, y0 = (W - im.width) // 2, (H - im.height) // 2
    if y0 > 0:
        out.paste(im.crop((0, 0, im.width, 1)).resize((im.width, y0)), (x0, 0))
        out.paste(im.crop((0, im.height - 1, im.width, im.height)).resize((im.width, H - y0 - im.height)), (x0, y0 + im.height))
    out.paste(im, (x0, y0))
    if x0 > 0:
        out.paste(out.crop((x0, 0, x0 + 1, H)).resize((x0, H)), (0, 0))
        out.paste(out.crop((x0 + im.width - 1, 0, x0 + im.width, H)).resize((W - x0 - im.width, H)), (x0 + im.width, 0))
    return out


os.makedirs(dst, exist_ok=True)
clips = []
for s in SLUGS:
    files = sorted(f for f in os.listdir(f"{src}/{s}") if f.endswith(".png"))
    tmp = tempfile.mkdtemp()
    n = 0

    def put(im):
        global n
        im.save(f"{tmp}/{n:05d}.png")
        n += 1

    first = fit(f"{src}/{s}/{files[0]}")
    first.save(f"{dst}/{s}.webp", "WEBP", quality=82, method=6)
    for _ in range(HOLD0):
        put(first)
    last = first
    for f in files[1:]:
        last = fit(f"{src}/{s}/{f}")
        put(last)
    for _ in range(HOLD1):
        put(last)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{tmp}/%05d.png",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-profile:v", "high",
                    "-movflags", "+faststart", "-an", f"{dst}/{s}.mp4"], check=True)
    shutil.rmtree(tmp)
    clips.append({"slug": s, "dur": round(n / FPS, 2)})
    print(s, n, "frames", round(n / FPS, 1), "s", os.path.getsize(f"{dst}/{s}.mp4") // 1024, "KB", os.path.getsize(f"{dst}/{s}.webp") // 1024, "KB")
json.dump({"w": W, "h": H, "speed": SPEED, "clips": clips}, open(js, "w"), indent=1, ensure_ascii=False)
