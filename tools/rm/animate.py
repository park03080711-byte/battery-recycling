"""재제조 작업장 — 공정 재생용 자료 렌더.

1) 흐름선 좌표: 바닥 청록 점선(workshop.lane)을 같은 카메라로 화면 좌표(%)로 투영 → LED 흐름 경로
2) 클린 배경: ② 호이스트의 움직이는 부품(모듈 · 도르래 · 줄)을 뺀 부분만 다시 렌더 → 기존 장면에 덧붙임
3) 설비 동작 클립: 설비마다 움직이는 것만 보이고 나머지는 holdout(가림만 담당)으로 두고 프레임을 렌더

카메라는 render.py와 똑같이 원래 장면의 경계로 잡는다(추가 물체가 화면 틀을 바꾸지 않게).
python animate.py out=anim [only=coords,plate,clips] [cs=24] [clip=r1,r2,r3,r4]
"""
import sys, os, json, time, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "anatomy"))
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
import workshop as WS
import plant as PL
import scene as S
from plant import box, cyl, pipe, L

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
W = 2800
CW = int(args.get("cw", 1750))  # 클립 해상도(가로). 2800:1728 = 1750:1080 로 비율이 정확히 맞는 값
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,plate,clips").split(","))
CS = int(args.get("cs", 24))
CLIPS = args.get("clip", "r1,r2,r3,r4").split(",")
os.makedirs(OUT, exist_ok=True)
Z0 = WS.Z0

S.reset()
anchors = WS.build()
PL.lights()

# ── 카메라: render.py와 같은 계산 ──
MARGIN = 0.035
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
wx, wy = x1 - x0, y1 - y0
wx *= 1 + 2 * MARGIN
wy = wy + wx * MARGIN * 2
H = int(round(W * wy / wx / 2) * 2)
center = r * ((x0 + x1) / 2) + t * ((y0 + y1) / 2)
cam = PL.iso_camera(center, wx)
bpy.context.view_layer.update()
S.render_setup(W, H, 48, transparent=True)
sc = bpy.context.scene
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
sc.view_settings.exposure = 0.0
sc.cycles.max_bounces = 6
print("[A] size", W, H, flush=True)
assert H * CW % W == 0, "클립 해상도 비율이 맞지 않음"
CH = H * CW // W


def cam_xy(p):
    c = world_to_camera_view(sc, cam, Vector(p))
    return c.x, c.y


def pct(p):
    x, y = cam_xy(p)
    return [round(x * 100, 3), round((1 - y) * 100, 3)]


def border_of(bb, pad=0.006):
    u0, u1, v0, v1, z0, z1 = bb
    pts = [cam_xy(L(u, v, z)) for u in (u0, u1) for v in (v0, v1) for z in (z0, z1)]
    bx0 = max(0.0, min(p[0] for p in pts) - pad)
    bx1 = min(1.0, max(p[0] for p in pts) + pad)
    by0 = max(0.0, min(p[1] for p in pts) - pad)
    by1 = min(1.0, max(p[1] for p in pts) + pad)
    return bx0, bx1, by0, by1


def set_border(b, w):
    bx0, bx1, by0, by1 = b
    sc.render.resolution_x = w
    sc.render.resolution_y = H * w // W
    sc.render.use_border = True
    sc.render.use_crop_to_border = True
    sc.render.border_min_x, sc.render.border_max_x = bx0, bx1
    sc.render.border_min_y, sc.render.border_max_y = by0, by1


def box_pct(b):
    bx0, bx1, by0, by1 = b
    return [round(bx0 * 100, 3), round((1 - by1) * 100, 3), round((bx1 - bx0) * 100, 3), round((by1 - by0) * 100, 3)]


def shot(path):
    sc.render.filepath = path
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print("[A]", os.path.basename(path), round(time.time() - t0, 1), "s", flush=True)


meta = {"w": W, "h": H, "cw": CW, "ch": CH}

# ── 1) 흐름선 좌표 ──
LANE = [("cin", 3.2, 5.0), ("r1", 7.0, 5.0), (None, 7.0, 3.6), ("r2", 11.0, 3.6), (None, 11.0, 2.4), (None, 13.8, 2.4), (None, 13.8, 6.6),
        ("r3", 16.2, 6.6), (None, 17.9, 6.6), (None, 17.9, 3.6), ("r4", 20.0, 3.6), (None, 22.6, 3.6), ("cout", 22.6, 4.6)]
meta["path"] = [pct(L(u, v, Z0)) for _, u, v in LANE]
meta["stops"] = {k: i for i, (k, _, _) in enumerate(LANE) if k}

# ── 움직이는 부품 · 추가 물체 ──
anim_r2 = [o for o in sc.objects if o.get("anim") == "r2"]
P = S.P
MA = {
    "scan": P("a_scan", PL.hexlin("#5B7CFA"), rough=0.3, emit=(PL.hexlin("#6F8CFF"), 2.2)),
    "warn": P("a_warn", PL.hexlin("#F39C2A"), rough=0.4, emit=(PL.hexlin("#FF9F1C"), 1.3)),
    "ok": P("a_ok", PL.hexlin("#39C6B6"), rough=0.3, emit=(PL.hexlin("#39C6B6"), 1.8)),
    "pulse": P("a_pulse", PL.hexlin("#39C6B6"), rough=0.3, emit=(PL.hexlin("#39C6B6"), 2.0)),
    "lamp": P("a_lamp", PL.hexlin("#39C6B6"), rough=0.3, emit=(PL.hexlin("#39C6B6"), 2.4)),
}
MSTEEL = bpy.data.materials.get("steel")
MNEW = bpy.data.materials.get("module_new")
assert MSTEEL and MNEW, "재질 이름 확인"


def ease(x):
    x = min(1.0, max(0.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def lerp(a, b, x):
    return a + (b - a) * x


def seg(f, a, b):
    return ease((f - a) / (b - a))


def new_objs(fn):
    before = set(sc.objects)
    fn()
    return [o for o in sc.objects if o not in before]


# ① 개봉 · 진단: 모듈 위를 훑는 스캔 막대 + 지친 모듈 표시 (호박색)
U1, V1 = 7.4, 6.4
TOP1 = Z0 + 0.55 + 0.34 + 0.3
r1_scan = new_objs(lambda: box(0.07, 1.95, 0.03, U1, V1, TOP1 + 0.05, MA["scan"], "a1", bevel=0.01))
r1_warn = new_objs(lambda: box(0.64, 0.78, 0.02, U1 - 1.05 + 1.4, V1 - 0.42, TOP1 - 0.005, MA["warn"], "a1", bevel=0.01))

# ③ 셀밸런싱: 케이블을 타고 가는 빛 + 호박색 상태등이 청록으로
U3, V3 = 16.2, 3.9
CAB = [[(U3 - 0.8 + k * 0.8, V3 - 0.3, Z0 + 0.9), (U3 - 0.7 + k * 0.8, V3 + 0.2, Z0 + 1.3), (U3 - 0.7 + k * 0.8, V3 + 0.9, Z0 + 1.0)] for k in range(3)]
r3_pulse = []
for c in range(3):
    for j in range(2):
        r3_pulse += new_objs(lambda: box(0.15, 0.15, 0.15, 0, 0, 0, MA["pulse"], "a3", bevel=0.07))
LIGHTS = [(i, k) for k in range(3) for i in range(3) if (i + k) % 3 == 0]
r3_ok = []
for (i, k) in LIGHTS:
    r3_ok.append(new_objs(lambda: box(0.11, 0.04, 0.11, U3 - 0.8 + i * 0.8 + 0.3, V3 - 0.265, Z0 + 0.575 + k * 0.7, MA["ok"], "a3", bevel=0.01))[0])

# ④ 재조립 · 검사: 팩 뚜껑 위 스캔 막대 + 검사기 탑 초록 불
U4, V4 = 20.0, 2.0
r4_scan = new_objs(lambda: box(0.07, 2.0, 0.03, U4, V4 - 0.1, Z0 + 0.12 + 0.42 + 0.04, MA["scan"], "a4", bevel=0.01))
r4_lamp = new_objs(lambda: cyl(0.112, 0.13, U4 + 2.4, V4 - 0.6, Z0 + 1.975, MA["lamp"], "a4", seg=24))

# ② 선별 교체: 새 모듈 (선반 빈 칸에서 가져옴)
U2, V2 = 11.4, 5.4
MU, MV = U2 - 1.05 + 1.4, V2 - 0.42
# module_은 재질 사전을 받으므로 여기서 직접 만든다 (같은 치수)
r2_new = new_objs(lambda: (box(0.62, 0.76, 0.3, MU, MV, Z0 + 1.5, MNEW, "a2", bevel=0.04), box(0.5, 0.08, 0.03, MU, MV - 0.2, Z0 + 1.8, MSTEEL, "a2", bevel=0.01)))
trolley = [o for o in anim_r2 if o.type == "MESH" and abs(o.location.z - (Z0 + 2.44 + 0.08)) < 0.02]
old_mod = [o for o in anim_r2 if o.type == "MESH" and o not in trolley]
cable_old = [o for o in anim_r2 if o.type == "CURVE"]
assert len(trolley) == 1 and len(old_mod) == 2 and len(cable_old) == 1, (len(trolley), len(old_mod), len(cable_old))
base_loc = {o.name: o.location.copy() for o in trolley + old_mod + r2_new}

ADD = r1_scan + r1_warn + r3_pulse + r3_ok + r4_scan + r4_lamp + r2_new
for o in ADD:
    o.hide_render = True
    o.visible_shadow = False

REST_MOD = (MU, MV, Z0 + 1.5)  # 매달린 지친 모듈의 바닥 중심
SHELF = (11.5, 2.8, Z0 + 0.41 + 2 * 0.55)
SEAT = (MU, MV, Z0 + 0.89)
BIN = (U2 + 2.3, V2 + 0.9, Z0 + 0.62)  # 재활용 상자 뚜껑 위
HI = Z0 + 1.95


def r2_state(f):
    """(지친 모듈 위치 또는 None, 새 모듈 위치 또는 None, 도르래 u)"""
    if f <= 6:
        return (MU, MV, lerp(REST_MOD[2], HI, seg(f, 0, 6))), None, MU
    if f <= 18:
        x = seg(f, 6, 18)
        return (lerp(MU, BIN[0], x), lerp(MV, BIN[1], x), HI), None, lerp(MU, 13.1, x)
    if f < 24:
        return (BIN[0], BIN[1], lerp(HI, BIN[2], seg(f, 18, 24))), None, 13.1
    if f <= 30:
        x = seg(f, 24, 30)
        return None, (SHELF[0], SHELF[1], lerp(SHELF[2], HI, x)), lerp(13.1, SHELF[0], x)
    if f <= 40:
        x = seg(f, 30, 40)
        return None, (lerp(SHELF[0], MU, x), lerp(SHELF[1], MV, x), HI), lerp(SHELF[0], MU, x)
    return None, (MU, MV, lerp(HI, SEAT[2], seg(f, 40, 48))), MU


cable_cur = [cable_old[0]]


def place(objs, rest, pos):
    du, dv, dz = pos[0] - rest[0], pos[1] - rest[1], pos[2] - rest[2]
    for o in objs:
        b = base_loc[o.name]
        o.location = (b.x + dv, b.y + du, b.z + dz)


def pose_r2(f):
    old, new, tu = r2_state(f)
    for o in old_mod:
        o.hide_render = old is None
    for o in r2_new:
        o.hide_render = new is None
    if old:
        place(old_mod, REST_MOD, old)
    if new:
        place(r2_new, REST_MOD, new)
    tb = base_loc[trolley[0].name]
    trolley[0].location = (tb.x, tb.y + (tu - MU), tb.z)
    m = old or new
    for c in cable_cur:
        bpy.data.objects.remove(c, do_unlink=True)
    cable_cur.clear()
    c = pipe([(tu, V2 - 1.3, Z0 + 2.44), (m[0], m[1] - 0.2, m[2] + 0.45)], 0.012, MSTEEL, "r2")
    c["anim"] = "r2"
    cable_cur.append(c)
    return [trolley[0]] + old_mod + r2_new + cable_cur


def pose_r1(f):
    s = r1_scan[0]
    s.hide_render = not (2 <= f <= 22)
    s.location.y = lerp(U1 - 1.45, U1 + 1.45, seg(f, 2, 22))
    r1_warn[0].hide_render = not ((12 <= f <= 15) or f >= 19)
    return r1_scan + r1_warn


def along(path, x):
    d = [math.dist(a, b) for a, b in zip(path, path[1:])]
    tot = sum(d)
    s = x * tot
    for (a, b), l in zip(zip(path, path[1:]), d):
        if s <= l:
            k = s / l
            return tuple(a[i] + (b[i] - a[i]) * k for i in range(3))
        s -= l
    return path[-1]


def pose_r3(f):
    for c in range(3):
        for j in range(2):
            o = r3_pulse[c * 2 + j]
            x = f / 22 - j * 0.45 - c * 0.12
            o.hide_render = not (0 <= x <= 1)
            p = along(CAB[c], min(max(x, 0), 1))
            o.location = L(p[0], p[1], p[2])
    for n, o in enumerate(r3_ok):
        o.hide_render = f < 14 + n * 5
    return r3_pulse + r3_ok


def pose_r4(f):
    s = r4_scan[0]
    s.hide_render = not (2 <= f <= 20)
    s.location.y = lerp(U4 - 1.4, U4 + 1.4, seg(f, 2, 20))
    r4_lamp[0].hide_render = f < 23
    return r4_scan + r4_lamp


CLIPDEF = {
    "r1": dict(n=32, pose=pose_r1, bb=(5.6, 9.2, 5.2, 7.6, Z0 + 1.0, Z0 + 1.4)),
    "r2": dict(n=48, pose=pose_r2, bb=(10.9, 14.2, 2.3, 6.8, Z0 + 0.4, Z0 + 2.75)),
    "r3": dict(n=32, pose=pose_r3, bb=(14.9, 17.4, 3.45, 5.4, Z0 + 0.5, Z0 + 2.15)),
    "r4": dict(n=32, pose=pose_r4, bb=(18.3, 22.6, 0.8, 3.0, Z0 + 0.1, Z0 + 2.2)),
}

# 초기 상태: 추가 물체는 숨김, ② 부품은 제자리
pose_r2(0)
for o in r2_new:
    o.hide_render = True

if "coords" in only:
    json.dump(meta, open(f"{OUT}/motion_meta.json", "w"), indent=1)
    print("[A] path", meta["path"][:3], "...", flush=True)

floor = bpy.data.objects["floor"]

# ── 2) 클린 배경: ② 움직이는 부품을 뺀 영역 + ② 마스크 ──
if "plate" in only:
    for o in trolley + old_mod + cable_cur:
        o.hide_render = True
    b = border_of(CLIPDEF["r2"]["bb"], pad=0.02)
    set_border(b, W)
    sc.cycles.samples = 48
    shot(f"{OUT}/plate_r2.png")
    meta["plate"] = {"box": box_pct(b)}
    # 마스크 다시 (움직이는 부품 제외)
    sc.render.use_border = False
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.cycles.samples = 4
    sc.cycles.use_denoising = False
    sc.cycles.use_adaptive_sampling = False
    floor.hide_render = True
    for o in sc.objects:
        if o.get("grp") is not None:
            o.is_holdout = o["grp"] != "r2"
    shot(f"{OUT}/mask_r2.png")
    for o in sc.objects:
        o.is_holdout = False
    floor.hide_render = False
    sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True
    json.dump(meta, open(f"{OUT}/motion_meta.json", "w"), indent=1)

# ── 가림 마스크: 바닥 흐름선이 설비 뒤로 지나갈 때 가려지도록 (바닥 · 판 · 흐름선 제외한 물체의 알파) ──
if "occ" in only:
    sc.render.use_border = False
    sc.render.resolution_x, sc.render.resolution_y = CW, CH
    sc.cycles.samples = 4
    sc.cycles.use_denoising = False
    sc.cycles.use_adaptive_sampling = False
    floor.hide_render = True
    hid = [o for o in sc.objects if o.get("grp") in ("plat", "lane")]
    for o in hid:
        o.hide_render = True
    shot(f"{OUT}/occ.png")
    for o in hid:
        o.hide_render = False
    floor.hide_render = False
    sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True

# ── 3) 설비 동작 클립 ──
if "clips" in only:
    floor.hide_render = True
    sc.cycles.samples = CS
    meta["clips"] = {}
    for cid in CLIPS:
        d = CLIPDEF[cid]
        b = border_of(d["bb"])
        set_border(b, CW)
        os.makedirs(f"{OUT}/{cid}", exist_ok=True)
        for f in range(d["n"]):
            # 모든 물체를 가림 전용으로 두고, 이 설비의 움직이는 것만 보이게
            for o in ADD:
                o.hide_render = True
            if cid != "r2":
                pose_r2(0)
                for o in r2_new:
                    o.hide_render = True
            vis = set(d["pose"](f))
            for o in sc.objects:
                if o.type in ("MESH", "CURVE") and o is not floor:
                    o.is_holdout = o not in vis
            shot(f"{OUT}/{cid}/{f:03d}.png")
        meta["clips"][cid] = {"box": box_pct(b), "frames": d["n"]}
        json.dump(meta, open(f"{OUT}/motion_meta.json", "w"), indent=1)
    for o in sc.objects:
        o.is_holdout = False
print("[A] done", flush=True)
