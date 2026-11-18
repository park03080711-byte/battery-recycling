"""이력관리 '기록이 모이는 길' — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입구 → ① 제조 → ② 차량 등록 → ③ 운행 · 검사 → ④ 탈거 · 평가 → 갈림점 → ⑤ 재사용 / ⑥ 재활용 → (분홍) 재생원료가 ① 입구로.
단계마다: 그 장소에서 기록이 만들어지고(레이저 각인 · 화면 · 표시등), 기록 기둥을 타고 빛이 올라간 뒤,
가운데 서버 위 여권 받침에 그 단계 색의 '여권 한 장'이 내려앉아 쌓인다(클립 p_*: 단계마다 한 장, 끝난 장은 남음).
모든 동작이 덧그림이라 클린 배경은 필요 없다. 움직임은 설명용이며 실제 시스템과 다르다.
python animate.py out=anim [only=dry,coords,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import bpy, bmesh
from mathutils import Vector
import passport as TR
import plant as PL
import scene as S
from plant import box, cyl, ring, L
from motion_kit import Kit, lerp, seg, new_objs, along

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0, LV, LOOP = TR.Z0, TR.LV, TR.LOOP
FORK = ("fork", TR.FORK[0], LV)

K = Kit(TR.build)
sc = K.sc
_M = TR.mats_tr()  # 추가 물체용 재질 (장면 재질과 같은 값)

# ── 흐름선: 입구 → ①②③④ → 갈림점, 재사용, 재활용 → 재생원료가 입구로 ──
K.routes([
    [("cin", 0.8, LV), ("s1", 3.6, LV), ("s2", 9.4, LV), ("s3", 15.4, LV), ("s4", 20.6, LV), FORK],
    [FORK, (None, TR.FORK[0], 2.2), ("d1", 24.2, 2.2)],
    [FORK, (None, TR.FORK[0], 8.4), ("d2", 24.3, 8.4), (None, 24.3, LOOP), (None, 0.8, LOOP), (None, 0.8, LV + 0.3)],
], Z0)

# ── 재질 ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "data": E("a_data", "#6F8CFF", 2.2),
    "beam": E("a_beam", "#8EA6FF", 3.0),
    "warn": E("a_warn", "#FF9F1C", 1.4),
    "scr": E("a_scr", "#C9D6FF", 1.6),
    "white": E("a_white", "#FFFFFF", 0.9),
    "ni": E("a_ni", "#2BB594", 1.2),
    "co": E("a_co", "#C23D69", 1.1),
    "li": E("a_li", "#FFFFFF", 0.8),
}
extra = []


def add(fn):
    objs = new_objs(fn)
    for o in objs:
        o.hide_render = True
        o.visible_shadow = False
    extra.extend(objs)
    return objs


def show(objs, on):
    for o in objs:
        o.hide_render = not on


def sphere(r, m):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    me = bpy.data.meshes.new("sph")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return S.obj_from(me, L(0, 0, 0), m, "sph", (0, 0, 0), "a")


def put(o, u, v, z, s=1.0):
    o.location = L(u, v, z)
    o.scale = (s, s, s)


def run_pulses(objs, path, f, f0, f1, gap=0.3):
    vis = []
    for j, o in enumerate(objs):
        x = (f - f0) / max(1, f1 - f0) * (1 + gap * (len(objs) - 1)) - j * gap
        show(o, f0 <= f <= f1 and 0 <= x <= 1)
        o[0].location = L(*along(path, min(max(x, 0), 1)))
        vis += o
    return vis


# ── 기록 기둥: 빛 고리가 기둥을 타고 올라가고, 꼭대기 등이 켜진다 (모든 장소 공통) ──
UP = {}
for key, (pu, pv) in TR.POSTS.items():
    rg = add(lambda pu=pu, pv=pv: ring(0.15, 0.05, pu, pv, 0, MA["data"], "a", t=0.04, seg=32))
    top = add(lambda pu=pu, pv=pv: cyl(0.125, 0.085, pu, pv, Z0 + 1.555, MA["data"], "a", seg=24))
    scr = add(lambda pu=pu, pv=pv: box(0.34, 0.02, 0.22, pu, pv + 0.155, Z0 + 1.09, MA["scr"], "a", bevel=0.01))
    UP[key] = (pu, pv, rg, top, scr)


def upload(key, f, a):
    """프레임 a부터: 화면 켜짐(a-4) → 빛 고리가 기둥을 두 번 타고 오름 → 꼭대기 등 깜빡임"""
    pu, pv, rg, top, scr = UP[key]
    show(scr, f >= a - 4)
    xs = [(f - a - k * 4) / 7 for k in range(2)]
    xs = [x for x in xs if 0 <= x <= 1]
    show(rg, bool(xs))
    put(rg[0], pu, pv, Z0 + 0.15 + 1.35 * (xs[0] if xs else 0))
    show(top, f >= a + 8 and (f < a + 14 or f % 4 < 3))
    return list(scr) + list(rg) + list(top)


# ── 여권 한 장: 서버 위에서 내려앉는다 (단계 k번째 높이) ──
HU, HV = TR.HUB
PAGES = {}
for k, key in enumerate(("s1", "s2", "s3", "s4", "d1", "d2")):
    objs = add(lambda key=key, k=k: TR.page(_M, key, k, "a"))
    PAGES[key] = (k, objs)


def page_pose(key, f, a):
    k, objs = PAGES[key]
    x = seg(f, a, a + 8)
    show(objs, f >= a)
    for o in objs:
        if "base" not in o:
            o["base"] = tuple(o.location)
        b = o["base"]
        o.location = (b[0], b[1], b[2] + 0.9 * (1 - x))
    return objs


# ① 제조 — 레이저 각인 빛이 팩 덮개를 훑고 식별 무늬가 빛난 뒤 기록이 올라감
U1, V1 = 3.4, LV
s1_beam = add(lambda: cyl(0.03, 0.72, U1 + 1.0, V1 + 0.25, Z0 + 0.98, MA["beam"], "a", seg=12))
s1_spot = add(lambda: cyl(0.12, 0.012, U1 + 1.0, V1 + 0.25, Z0 + 0.985, MA["beam"], "a", seg=24))
s1_qr = add(lambda: box(0.56, 0.56, 0.008, U1 + 1.0, V1 + 0.25, Z0 + 0.975, MA["white"], "a", bevel=0.004, seg=1))


def pose_s1(f):
    vis = []
    on = 2 <= f <= 14
    x = ((f - 2) % 6) / 6
    du, dv = -0.18 + 0.36 * x, -0.18 + 0.36 * (((f - 2) // 6) % 2)
    for objs in (s1_beam, s1_spot):
        show(objs, on)
    s1_beam[0].location = L(U1 + 1.0 + du, V1 + 0.25 + dv, Z0 + 0.98 + 0.36)
    put(s1_spot[0], U1 + 1.0 + du, V1 + 0.25 + dv, Z0 + 0.986)
    show(s1_qr, 12 <= f <= 20 and f % 3 != 0)
    vis += s1_beam + s1_spot + s1_qr
    vis += upload("s1", f, 14)
    return vis


# ② 차량 등록 — 창구 화면이 켜지고 등록 서류에 식별 무늬가 찍히며, 차 옆면 무늬가 빛남
U2, V2 = 9.4, LV
CU2, CV2 = U2 + 2.6, V2 - 1.1
s2_scr = add(lambda: box(0.74, 0.02, 0.4, CU2, CV2 + 0.175, Z0 + 1.13, MA["scr"], "a", bevel=0.01))
s2_doc = add(lambda: TR.qr_top(_M, CU2 + 0.12, CV2 + 0.15, Z0 + 1.03, 0.2, "a", seed=12, n=7))
s2_car = add(lambda: box(0.32, 0.01, 0.32, U2 + 0.6, V2 + 0.925, Z0 + 0.35, MA["white"], "a", bevel=0.004, seg=1))


def pose_s2(f):
    show(s2_scr, 2 <= f)
    show(s2_car, 4 <= f <= 12 and f % 3 != 0)
    show(s2_doc, f >= 9)
    return s2_scr + s2_car + s2_doc + upload("s2", f, 13)


# ③ 운행 · 검사 — 진단기 화면에 SOH 막대가 차례로 서고, 케이블을 따라 빛이 진단기로
U3, V3 = 15.4, LV
CU3, CV3 = U3 + 2.3, V3 + 1.2
P3 = [(U3 + 1.0, V3 + 0.1, Z0 + 0.85), (U3 + 1.2, V3 + 0.2, Z0 + 0.3), (CU3 - 0.8, CV3 - 0.3, Z0 + 0.3), (CU3 - 0.35, CV3 - 0.1, Z0 + 0.7)]
s3_dot = [add(lambda: sphere(0.06, MA["data"])) for _ in range(3)]
s3_scr = add(lambda: box(0.62, 0.02, 0.36, CU3, CV3 - 0.065, Z0 + 1.35, MA["scr"], "a", bevel=0.01))
s3_bar = [add(lambda k=k: box(0.1, 0.02, 0.26 - k * 0.05, CU3 - 0.18 + k * 0.18, CV3 - 0.05, Z0 + 1.4, MA["ok"] if k < 2 else MA["warn"], "a", bevel=0.005)) for k in range(3)]


def pose_s3(f):
    vis = run_pulses(s3_dot, P3, f, 1, 10)
    show(s3_scr, f >= 6)
    vis += s3_scr
    for k, objs in enumerate(s3_bar):
        show(objs, f >= 8 + k * 2)
        vis += objs
    return vis + upload("s3", f, 14)


# ④ 탈거 · 평가 — 시험기 등 세 개가 차례로 켜지고 화면에 결과, 덮개 무늬가 빛남
U4, V4 = 20.6, LV
TU4, TV4 = U4 + 0.2, V4 - 1.75
s4_lamp = [add(lambda k=k: cyl(0.065, 0.03, TU4 - 0.35 + k * 0.35, TV4 + 0.445, Z0 + 0.6, MA["ok"], "a", axis="v", seg=20)) for k in range(3)]
s4_scr = add(lambda: box(1.2, 0.02, 0.5, TU4, TV4 + 0.425, Z0 + 1.0, MA["scr"], "a", bevel=0.01))
s4_qr = add(lambda: box(0.56, 0.56, 0.008, U4 + 0.8, V4 + 0.25, Z0 + 1.055, MA["white"], "a", bevel=0.004, seg=1))


def pose_s4(f):
    vis = []
    for k, objs in enumerate(s4_lamp):
        show(objs, f >= 2 + k * 3)
        vis += objs
    show(s4_scr, f >= 9)
    show(s4_qr, 3 <= f <= 11 and f % 3 != 0)
    return vis + s4_scr + s4_qr + upload("s4", f, 13)


# ⑤ 재사용 — 충전 표시가 차고, 새 여권 무늬가 빛남 (원래 여권과 이어짐)
U5, V5 = 25.9, 2.2
d1_bars = [add(lambda k=k: box(0.34, 0.012, 0.1, U5 - 0.9 + k * 0.45, V5 + 0.725, Z0 + 1.45, MA["ok"], "a", bevel=0.005)) for k in range(5)]
d1_qr = add(lambda: box(0.36, 0.01, 0.36, U5 - 1.0, V5 + 0.725, Z0 + 0.61, MA["white"], "a", bevel=0.004, seg=1))


def pose_d1(f):
    vis = []
    for k, objs in enumerate(d1_bars):
        show(objs, f >= 2 + k * 2)
        vis += objs
    show(d1_qr, 8 <= f <= 16 and f % 3 != 0)
    return vis + d1_qr + upload("d1", f, 14)


# ⑥ 재활용 — 회수 소재 자루의 기록표가 차례로 빛남 (재생원료 기록)
U6, V6 = 25.6, 8.4
d2_tags = [add(lambda k=k, m=m: box(0.52, 0.52, 0.02, U6 + 1.75, V6 - 0.85 + k * 0.85, Z0 + 0.8, MA[m], "a", bevel=0.05)) for k, m in enumerate(("ni", "co", "li"))]


def pose_d2(f):
    vis = []
    for k, objs in enumerate(d2_tags):
        show(objs, 2 + k * 3 <= f <= 12 + k * 3 or f >= 22)
        vis += objs
    return vis + upload("d2", f, 12)


def pager(key, a):
    return lambda f: page_pose(key, f, a)


BB = {
    "s1": (4.0, 6.1, 4.9, 7.7, Z0, Z0 + 1.8),
    "s2": (9.9, 12.6, 4.6, 8.0, Z0, Z0 + 1.8),
    "s3": (16.2, 18.3, 4.7, 8.2, Z0, Z0 + 1.8),
    "s4": (20.0, 22.8, 4.7, 7.6, Z0, Z0 + 1.8),
    "d1": (24.6, 27.7, 2.8, 3.6, Z0, Z0 + 1.8),
    "d2": (27.0, 28.2, 6.1, 9.6, Z0, Z0 + 1.8),
    "page": (HU - 0.9, HU + 0.9, HV - 0.7, HV + 0.7, Z0 + 2.05, Z0 + 3.95),
}
DEFS = {
    "s1": dict(n=32, pose=pose_s1, bb=BB["s1"]),
    "s2": dict(n=30, pose=pose_s2, bb=BB["s2"]),
    "s3": dict(n=30, pose=pose_s3, bb=BB["s3"]),
    "s4": dict(n=30, pose=pose_s4, bb=BB["s4"]),
    "d1": dict(n=30, pose=pose_d1, bb=BB["d1"]),
    "d2": dict(n=30, pose=pose_d2, bb=BB["d2"]),
}
# 여권 장: 기둥 꼭대기 등이 켜질 즈음 내려앉음
for key, a in (("s1", 22), ("s2", 21), ("s3", 22), ("s4", 21), ("d1", 22), ("d2", 20)):
    DEFS[f"p_{key}"] = dict(n=DEFS[key]["n"], pose=pager(key, a), bb=BB["page"], step=key)

if "dry" in only:
    for k, d in DEFS.items():
        lo, hi = [1e9] * 3, [-1e9] * 3
        for f in range(d["n"]):
            for o in extra:
                o.hide_render = True
            vis = d["pose"](f)
            bpy.context.view_layer.update()
            for o in vis:
                if o.hide_render:
                    continue
                for c in o.bound_box:
                    p = o.matrix_world @ Vector(c)
                    uvz = (p.y, p.x, p.z)
                    lo = [min(a, b) for a, b in zip(lo, uvz)]
                    hi = [max(a, b) for a, b in zip(hi, uvz)]
        print("[K] dry", k, d["n"], "u", round(lo[0], 2), round(hi[0], 2), "v", round(lo[1], 2), round(hi[1], 2),
              "z-Z0", round(lo[2] - Z0, 2), round(hi[2] - Z0, 2), "bb", [round(x, 2) for x in d["bb"]], flush=True)
    print("[K] dry ok", flush=True)
if "coords" in only:
    K.save(OUT)
if "occ" in only:
    K.occ(OUT)
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
