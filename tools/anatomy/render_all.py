"""최종 렌더: 전체(닫힘/열림), 부위 마스크, 상세 4장, 좌표 JSON."""
import sys, time, json, os
sys.path.insert(0, ".")
import bpy
import scene as S

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
W, H = int(args.get("w", 1920)), int(args.get("h", 1080))
SMP = int(args.get("s", 64))
only = set(args.get("only", "closed,open,masks,module,bms,cool,cell").split(","))
OUT = args.get("out", "final")
os.makedirs(OUT, exist_ok=True)
coords_path = f"{OUT}/coords.json"
coords = json.load(open(coords_path)) if os.path.exists(coords_path) else {}


def log(*a):
    print("[R]", *a, flush=True)


def shot(name):
    bpy.context.scene.render.filepath = f"{OUT}/{name}.png"
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    log(name, round(time.time() - t0, 1), "s")


# ── 팩 장면 ──
S.reset()
S.build_pack()
S.studio()
bpy.data.objects["aim"].location = (0, 0, 0.05)
sc = bpy.context.scene
cam_o = S.camera("cam_over", (2.15, -2.4, 2.05), (0.07, 0.02, 0.0), 52)
cam_m = S.camera("cam_module", (0.06, -1.22, 0.36), (-0.30, -0.40, 0.06), 45)
cam_b = S.camera("cam_bms", (0.92, -0.88, 0.56), (0.62, -0.12, 0.04), 42)
cam_c = S.camera("cam_cool", (0.36, -0.96, 0.56), (0.02, -0.25, 0.01), 42)
S.render_setup(W, H, SMP)

Zt = S.Z_MOD + S.MOD_H
xc_bay = (S.BAY_X0 + 0.01 + S.BAY_X1 - 0.01) / 2
sc.camera = cam_o
coords["overview"] = S.project(cam_o, {
    "cell": (S.MOD_X[1], 0.27, Zt - 0.004),
    "module": (S.MOD_X[0] + 0.02, -0.27 - 0.228, S.Z_MOD + 0.07),
    "bms": (xc_bay, 0.14, S.FLOOR + 0.052),
    "case": (0.02, -0.27, 0.03),
})
coords["module"] = S.project(cam_m, {
    "busbar": (-0.295 - 0.03, -0.27 - 0.2295, S.Z_MOD + 0.062),
    "endplate": (-0.295 + 0.1425, -0.27 + 0.05, S.Z_MOD + 0.085),
    "cmu": (-0.295 - 0.02, -0.27 + 0.21, Zt + 0.008),
})
coords["bms"] = S.project(cam_b, {
    "board": (xc_bay, 0.14, S.FLOOR + 0.053),
    "contactor": (xc_bay - 0.03, -0.40, S.FLOOR + 0.07),
    "connector": (S.L / 2 + 0.03, -0.30, 0.09),
})
coords["cool"] = S.project(cam_c, {
    "channel": (0.02 - 0.06, -0.30, S.FLOOR + 0.016),
    "pad": (0.02 + 0.09, -0.24, S.FLOOR + 0.02),
    "tray": (0.1775, -0.14, 0.078),
})
json.dump(coords, open(coords_path, "w"), indent=1)
log("coords", coords)

if "closed" in only:
    S.set_visible(lambda g: True)
    shot("pack_closed")
if "open" in only:
    S.set_visible(lambda g: g != "lid")
    shot("pack_open")
if "masks" in only:
    # 부위 외 모든 것은 holdout — 가려짐은 유지, 알파 = 해당 부위만
    S.set_visible(lambda g: g != "lid")
    sc.cycles.samples = 6
    sc.cycles.use_denoising = False
    sc.cycles.use_adaptive_sampling = False
    bpy.data.objects["floor"].hide_render = True
    for grp in ("cell", "module", "bms", "case"):
        for o in sc.objects:
            if o.get("grp") is not None:
                o.is_holdout = o["grp"] != grp
        shot(f"mask_{grp}")
    for o in sc.objects:
        o.is_holdout = False
    bpy.data.objects["floor"].hide_render = False
    sc.cycles.samples = SMP
    sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True
S.set_visible(lambda g: g != "lid")
for key, cam in (("module", cam_m), ("bms", cam_b), ("cool", cam_c)):
    if key in only:
        S.HIDE_FRONT = key in ("module", "bms")
        S.set_visible(lambda g: g != "lid")
        sc.camera = cam
        shot(f"detail_{key}")
S.HIDE_FRONT = False

# ── 셀 분해도 ──
if "cell" in only:
    S.reset()
    an = S.build_cell_exploded()
    S.studio()
    bpy.data.objects["aim"].location = (0, 0, 0.1)
    cam = S.camera("cam", (0.42, -0.72, 0.52), (0.0, 0.0, 0.095), 50)
    bpy.context.scene.camera = cam
    S.render_setup(W, H, SMP)
    coords["cell"] = S.project(cam, an)
    json.dump(coords, open(coords_path, "w"), indent=1)
    shot("detail_cell")
log("done")
