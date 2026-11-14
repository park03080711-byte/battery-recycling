"""렌더한 프레임(투명 PNG)을 첫 화면용 파일로 묶는다.
python pack_video.py <프레임 폴더> <포스터 PNG> ../../public/hero

- life.mp4: 위쪽 절반 = 색(투명도를 미리 곱한 값), 아래쪽 절반 = 투명도. 브라우저에서 WebGL로 합쳐 그린다
  (투명 영상을 모든 브라우저가 같은 형식으로 지원하지 않아서 이렇게 한다 — components/home/HeroLife.tsx).
- life-480 · 960.{avif,webp}: 정지 그림(첫 장면). 영상이 뜨기 전, 움직임 줄이기 · 데이터 절약 설정에서 보인다.
- 가장자리를 부드럽게 지워, 화면 밖으로 나가는 물체가 보이지 않는 틀에 잘려 보이지 않게 한다.
"""
import sys, glob, os, subprocess
import numpy as np
from PIL import Image

FR, POSTER, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
FPS = 24
CRF = os.environ.get("CRF", "25")


def edge(n, k=0.07):
    x = np.linspace(0, 1, n)
    d = np.minimum(x, 1 - x) / k
    d = np.clip(d, 0, 1)
    return d * d * (3 - 2 * d)


def load(path, size=None):
    im = Image.open(path).convert("RGBA")
    if size and im.width != size:
        im = im.resize((size, size), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    m = np.outer(edge(a.shape[0]), edge(a.shape[1]))
    a[..., 3] *= m
    return a


files = sorted(glob.glob(os.path.join(FR, "f[0-9]*.png")))
n = Image.open(files[0]).width
cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{n}x{2 * n}", "-r", str(FPS), "-i", "-",
       "-vf", "scale=out_color_matrix=bt709:out_range=tv", "-c:v", "libx264", "-preset", "veryslow", "-crf", CRF, "-g", "48",
       "-pix_fmt", "yuv420p", "-profile:v", "high", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
       "-movflags", "+faststart", "-an", os.path.join(OUT, "life.mp4")]
ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
for f in files:
    a = load(f)
    rgb = a[..., :3] * a[..., 3:4]
    al = np.repeat(a[..., 3:4], 3, axis=2)
    ff.stdin.write((np.concatenate([rgb, al], axis=0) * 255 + 0.5).astype(np.uint8).tobytes())
ff.stdin.close()
ff.wait()
print("life.mp4", len(files), "frames", round(os.path.getsize(os.path.join(OUT, "life.mp4")) / 1e6, 2), "MB")

for w in (480, 960):
    a = load(POSTER, w)
    im = Image.fromarray((a * 255 + 0.5).astype(np.uint8), "RGBA")
    im.save(os.path.join(OUT, f"life-{w}.webp"), quality=82, method=6)
    im.save(os.path.join(OUT, f"life-{w}.avif"), quality=62, speed=2)
    print(w, os.path.getsize(os.path.join(OUT, f"life-{w}.webp")) // 1024, os.path.getsize(os.path.join(OUT, f"life-{w}.avif")) // 1024, "KB")
