"""소개 페이지 '14개 지도 몽타주' 영상 만들기 — capture.mjs가 찍은 지도 화면을 이어 붙여 MP4 · 포스터 · 장면표(JSON)를 만든다.

주제마다: 재생 전 화면을 잠깐 보여 주고(HOLD0) → 공정 재생 프레임(5배속으로 찍은 것)을 그대로 → 끝 화면을 잠깐(HOLD1) → 다음 주제로 겹쳐 넘김(FADE).
마지막 주제는 첫 주제로 겹쳐 넘겨 반복 재생이 자연스럽게 이어진다.
python reel.py <찍은 폴더> <public/about> <components/about/reel.json>
"""
import sys, os, json, shutil, subprocess, tempfile
from PIL import Image

SLUGS = ["remanufacturing", "reuse", "recycling", "upcycling", "soh-diagnosis", "safety", "automated-disassembly",
         "byproduct-recovery", "traceability", "certification", "lca", "techno-economic", "supply-chain", "design-for-disassembly"]
W, H, FPS = 1280, 790, 24
HOLD0, HOLD1, FADE = 8, 4, 6
BG = (243, 246, 253)  # 지도 무대 바탕색

src, dst, js = sys.argv[1], sys.argv[2], sys.argv[3]


def fit(path):
    """지도 화면을 W×H 안에 비율 그대로 맞추고 남는 곳은 바탕색으로 채움"""
    im = Image.open(path).convert("RGB")
    k = min(W / im.width, H / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = Image.new("RGB", (W, H), BG)
    out.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
    return out


tmp = tempfile.mkdtemp()
n = 0


def put(im):
    global n
    im.save(f"{tmp}/{n:05d}.png")
    n += 1


chapters = []
firsts = {s: fit(f"{src}/{s}/000.png") for s in SLUGS}
for i, s in enumerate(SLUGS):
    files = sorted(f for f in os.listdir(f"{src}/{s}") if f.endswith(".png"))
    chapters.append({"slug": s, "s": round(n / FPS, 2)})
    first = firsts[s]
    for _ in range(HOLD0):
        put(first)
    last = first
    for f in files[1:]:
        last = fit(f"{src}/{s}/{f}")
        put(last)
    for _ in range(HOLD1):
        put(last)
    nxt = firsts[SLUGS[(i + 1) % len(SLUGS)]]
    for k in range(1, FADE + 1):
        put(Image.blend(last, nxt, k / (FADE + 1)))

os.makedirs(dst, exist_ok=True)
mp4 = f"{dst}/reel.mp4"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{tmp}/%05d.png",
                "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-profile:v", "high",
                "-movflags", "+faststart", "-an", mp4], check=True)
firsts[SLUGS[0]].save(f"{dst}/reel-poster.webp", "WEBP", quality=82, method=6)
json.dump({"w": W, "h": H, "dur": round(n / FPS, 2), "chapters": chapters}, open(js, "w"), indent=1, ensure_ascii=False)
shutil.rmtree(tmp)
print("frames", n, "dur", round(n / FPS, 2), "s")
for f in ("reel.mp4", "reel-poster.webp"):
    print(f, os.path.getsize(f"{dst}/{f}") // 1024, "KB")
