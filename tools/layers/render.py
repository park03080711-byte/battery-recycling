"""네 층위 패널 3D 물체 렌더 — 투명 배경 + 그림자 받이, 물체 크기에 꼭 맞춘 등각 정투영.
python render.py which=paths,support,evaluation,design w=1000 s=64 out=out
"""
import sys, os, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy
from mathutils import Vector
import panels as PN
import plant as PL
import scene as S

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
W = int(args.get("w", 1000))
SMP = int(args.get("s", 64))
OUT = args.get("out", "out")
WHICH = args.get("which", "paths,support,evaluation,design").split(",")
MARGIN = float(args.get("margin", 0.22))
os.makedirs(OUT, exist_ok=True)

for name in WHICH:
    PN.build(name)
    r = Vector((-1, 1, 0)).normalized()
    t = Vector((-1, -1, 2)).normalized()
    bpy.context.view_layer.update()
    xs, ys = [], []
    for o in bpy.context.scene.objects:
        if o.type in ("MESH", "CURVE") and o.name != "floor":
            for c in o.bound_box:
                p = o.matrix_world @ Vector(c)
                xs.append(p.dot(r))
                ys.append(p.dot(t))
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    wx = (x1 - x0) * (1 + 2 * MARGIN)
    wy = (y1 - y0) * (1 + 2 * MARGIN)
    H = int(round(W * wy / wx / 2) * 2)
    cam = PL.iso_camera(r * (x0 + x1) / 2 + t * (y0 + y1) / 2, wx)
    cam.data.sensor_fit = "HORIZONTAL"  # 세로로 긴 그림에서도 ortho_scale이 가로 폭을 뜻하도록
    S.render_setup(W, H, SMP, transparent=True)
    sc = bpy.context.scene
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = float(args.get("exp", -0.1))
    sc.cycles.max_bounces = 6
    sc.render.filepath = f"{OUT}/{name}.png"
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print("[R]", name, W, H, round(time.time() - t0, 1), "s", flush=True)
print("[R] done", flush=True)
