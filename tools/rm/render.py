"""렌더: 전체 장면, 단계별 마스크, 핫스팟 좌표 JSON.
python render.py w=1920 s=48 out=out [only=full,masks]
"""
import sys, os, json, time, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "rc"))
import bpy
from mathutils import Vector
import workshop as WS
import plant as PL
import scene as S

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
W = int(args.get("w", 1920))
SMP = int(args.get("s", 48))
OUT = args.get("out", "out")
only = set(args.get("only", "full,masks").split(","))
MARGIN = float(args.get("margin", 0.035))
os.makedirs(OUT, exist_ok=True)

S.reset()
anchors = WS.build()
PL.lights()

# 화면 좌표계: 오른쪽 r, 위 t (등각 정투영)
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
bpy.context.view_layer.update()
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
wx, wy = x1 - x0, y1 - y0
wx *= 1 + 2 * MARGIN
wy = wy + wx * MARGIN * 2
H = int(round(W * wy / wx / 2) * 2)
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
center = r * cx + t * cy
cam = PL.iso_camera(center, wx)
S.render_setup(W, H, SMP, transparent=True)
sc = bpy.context.scene
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
sc.view_settings.exposure = float(args.get("exp", 0.0))
sc.cycles.max_bounces = 6
print("[R] size", W, H, flush=True)

coords = S.project(cam, {k: PL.L(*v) for k, v in anchors.items()})
json.dump({"w": W, "h": H, "pts": coords}, open(f"{OUT}/coords.json", "w"), indent=1)
print("[R] coords", coords, flush=True)


def shot(name):
    sc.render.filepath = f"{OUT}/{name}.png"
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print("[R]", name, round(time.time() - t0, 1), "s", flush=True)


if "full" in only:
    shot("shop")
if "masks" in only:
    sc.cycles.samples = 4
    sc.cycles.use_denoising = False
    sc.cycles.use_adaptive_sampling = False
    bpy.data.objects["floor"].hide_render = True
    for grp in ("cin", "r1", "r2", "r3", "r4", "cout"):
        for o in sc.objects:
            if o.get("grp") is not None:
                o.is_holdout = o["grp"] != grp
        shot(f"mask_{grp}")
print("[R] done", flush=True)
