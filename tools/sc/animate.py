"""공급망 · 자원안보 '섬을 도는 원료' — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: ① 광산 섬 → (바지선) → ② 정제 섬 → ③ 화물선이 바다를 건넘 → ④ 한국 섬 배터리 공장,
      그다음 도시광산 고리: ④ → ⑤ 수거 → ⑥ 재활용 → 다시 ④.
단계마다: 굴착기 등 · 염수 증발지 반짝임 · 바지선 물살 / 정제 공장 굴뚝 연기(섬의 넷 → 다른 나라 작은 섬 하나)
/ 화물선 물살 · 연기 · 경고 부표 깜빡임 / 공장 창 · 소성로 빛 / 수거 상자 · 트럭 짐칸 등 / 컨베이어 알갱이 · 전처리 용량 통 눈금이 11%까지 참.
모든 동작이 덧그림이라 클린 배경은 필요 없다.
python animate.py out=anim [only=dry,coords,occ,clips] [clip=m1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
for d in ("rc", "rm", "tr", "ce", "lc"):
    sys.path.insert(0, os.path.join(HERE, "..", d))
import bpy, bmesh
from mathutils import Vector
import islands as SC
import plant as PL
import scene as S
from plant import box, cyl, L
from motion_kit import Kit, seg, new_objs

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0, VB, KB, KF = SC.Z0, SC.VB, SC.KB, SC.KF
SU, SV = SC.SHIP
PU, PV = SC.PLANT

K = Kit(SC.build)
sc = K.sc

# ── 흐름선: 광산 → 정제 → 바다 → 한국 공장, 그다음 도시광산 고리 ──
K.routes([
    [("in", 1.0, VB), ("m1", SC.MINE[0] + 1.6, VB), ("m2", 14.5, VB), (None, SU, VB), ("m3", SU, SV), (None, SU, KB), ("k1", PU - 2.2, KB)],
    [("kk", PU - 2.2, KF), ("k2", SC.COLLECT[0], KF), (None, 6.9, KF), (None, 6.9, KB), ("k3", SC.RECYC[0] + 0.9, KB), (None, PU - 2.2, KB)],
], Z0)

# ── 재질 ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "lamp": E("a_lamp", "#FFC24D", 2.4),
    "smoke": P("a_smoke", PL.hexlin("#8D95A6"), rough=0.9, alpha=0.85),
    "wake": E("a_wake", "#FFFFFF", 0.6),
    "brine": E("a_brine", "#9FEBDF", 0.45),
    "win": E("a_win", "#FFE3A3", 1.6),
    "kiln": E("a_kiln", "#FF9A4D", 2.0),
    "liq": E("a_liq", "#7FDCD1", 1.6),
    "fill": P("a_fill", PL.hexlin("#39C6B6"), rough=0.35, emit=(PL.hexlin("#39C6B6"), 0.8)),
    "grain": P("a_grain", PL.hexlin("#30343D"), rough=0.85),
    "ore": P("a_ore", PL.hexlin("#8A7A66"), rough=0.9),
    "red": E("a_red", "#FF5A4D", 2.4),
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


def puffs(objs, u, v, z, f, f0, f1, dz=0.9, gap=4):
    vis = []
    for j, o in enumerate(objs):
        x = (f - f0 - j * gap) / 10
        on = f0 <= f <= f1 and 0 <= x <= 1
        show(o, on)
        o[0].location = L(u + 0.1 * x, v - 0.05 * x, z + dz * x)
        s = 0.7 + 0.8 * x
        o[0].scale = (s, s, s)
        vis += o
    return vis


# ① 광산 — 굴착기 등 · 바가지 광석, 염수 증발지가 차례로 반짝, 바지선 뒤 물살
MU, MV = SC.MINE
ZT = Z0 + 0.35 + 0.3 + 0.3 + 0.28
m1_lamp = add(lambda: cyl(0.06, 0.06, MU - 0.5, MV - 0.3, ZT + 0.54, MA["lamp"], "a", seg=16))
m1_ore = add(lambda: box(0.2, 0.24, 0.1, MU + 0.6, MV - 0.3, ZT + 0.45, MA["ore"], "a", bevel=0.03))
m1_pond = [add(lambda pu=pu, pv=pv: box(1.0, 0.9, 0.006, pu, pv, Z0 + 0.092, MA["brine"], "a", bevel=0, seg=1)) for pu, pv in SC.PONDS]
BU, BV = SC.BARGE
m1_wake = [add(lambda k=k: box(0.4 - k * 0.07, 0.05, 0.012, 0, 0, 0, MA["wake"], "a", bevel=0, seg=1)) for k in range(3)]


def pose_m1(f):
    show(m1_lamp, 1 <= f <= 22 and f % 4 < 2)
    show(m1_ore, 3 <= f <= 12)
    vis = m1_lamp + m1_ore
    for k, objs in enumerate(m1_pond):
        show(objs, 4 + k * 3 <= f < 4 + k * 3 + 6)
        vis += objs
    for k, objs in enumerate(m1_wake):
        x = ((f + k * 3) % 10) / 10
        show(objs, 10 <= f <= 26)
        objs[0].location = L(BU - 1.15 - 0.7 * x, BV + (0.3 if k % 2 else -0.3) * (1 + x), Z0 + 0.02)
        vis += objs
    return vis


# ② 정제 — 몰린 섬의 굴뚝 여덟에서 연기, 늦게 다른 나라 작은 섬 굴뚝 둘
CH = SC.chimneys()
m2_sm = [[add(lambda: sphere(0.14, MA["smoke"])) for _ in range(3)] for _ in CH]


def pose_m2(f, big=True):
    vis = []
    for i, (u, v, z) in enumerate(CH):
        if (i < 8) != big:
            continue
        f0 = 1 + (i // 2) * 2 if big else 16 + (i - 8) * 2
        vis += puffs(m2_sm[i], u, v, z, f, f0, 28, dz=0.8 if big else 0.6)
    return vis


# ③ 배 운송 — 배 뒤(−v) 물살, 굴뚝 연기, 경고 부표 깜빡임
m3_wake = [add(lambda k=k: box(0.05, 0.45 - k * 0.07, 0.012, 0, 0, 0, MA["wake"], "a", bevel=0, seg=1)) for k in range(4)]
m3_sm = [add(lambda: sphere(0.11, MA["smoke"])) for _ in range(3)]
BYU, BYV = SU - 1.6, SV + 0.6
m3_buoy = add(lambda: cyl(0.1, 0.12, BYU, BYV, Z0 + 0.6, MA["red"], "a", seg=16))


def pose_m3(f):
    vis = []
    for k, objs in enumerate(m3_wake):
        x = ((f + k * 3) % 12) / 12
        show(objs, 1 <= f <= 26)
        objs[0].location = L(SU + (0.32 if k % 2 else -0.32) * (1 + x), SV - 1.95 - 0.8 * x, Z0 + 0.02)
        vis += objs
    vis += puffs(m3_sm, SU, SV - 1.55, Z0 + 1.8, f, 1, 26, dz=0.6)
    show(m3_buoy, f % 6 < 3)
    return vis + m3_buoy


# ④ 배터리 공장 — 창이 차례로 켜지고 소성로가 달아오름
m4_win = [add(lambda k=k: box(0.5, 0.012, 0.45, PU - 1.2 + k * 0.8, PV + 1.235, Z0 + 0.575, MA["win"], "a", bevel=0, seg=1)) for k in range(4)]
m4_kiln = add(lambda: cyl(0.335, 1.2, PU, PV - 1.55, Z0 + 0.55, MA["kiln"], "a", axis="u", seg=40))


def pose_k1(f):
    vis = []
    for k, objs in enumerate(m4_win):
        show(objs, f >= 2 + k * 3)
        vis += objs
    show(m4_kiln, 8 <= f <= 24 and (f < 20 or f % 2 == 0))
    return vis + m4_kiln


# ⑤ 수거 — 트럭 짐칸 팩 단자 등, 수거 상자 경고 띠 깜빡임
CU, CV = SC.COLLECT
TU = CU + 0.3
m5_lamps = [add(lambda du=du: box(0.16, 0.22, 0.04, TU + du + 0.22, 9.85, Z0 + 0.8, MA["lamp"], "a", bevel=0.02)) for du in (-0.85, -0.15)]
m5_haz = add(lambda: box(1.24, 0.015, 0.11, CU + 2.55, CV + 0.83, Z0 + 0.345, MA["lamp"], "a", bevel=0, seg=1))


def pose_k2(f):
    vis = []
    for k, objs in enumerate(m5_lamps):
        show(objs, f >= 3 + k * 4)
        vis += objs
    show(m5_haz, 10 <= f and f % 4 < 2)
    return vis + m5_haz


# ⑥ 재활용 — 컨베이어 알갱이, 전처리 용량 통 눈금이 0 → 11%
RU, RV = SC.RECYC
m6_gr = [add(lambda: PL.S.obj_from(PL.S.cyl_mesh(0.075, 0.075, 10, r2=0.0), L(0, 0, 0), MA["grain"], "grain", (0, 0, 0), "a")) for _ in range(6)]
SLU, SLV = SC.SILO
GZ0 = Z0 + 0.22
GH = SC.SILO_H - 0.2
m6_fill = add(lambda: box(0.12, 0.012, 1.0, SLU, SLV + SC.SILO_R + 0.016, 0, MA["fill"], "a", bevel=0, seg=1))


def pose_k3(f):
    vis = []
    for k, objs in enumerate(m6_gr):
        x = ((f * 0.07 + k / 6) % 1.0)
        show(objs, 1 <= f <= 26)
        objs[0].location = L(RU + 0.8 + 1.25 * x, RV + ((k * 37) % 5 - 2) * 0.09, Z0 + 0.69)
        vis += objs
    h = SC.GAUGE * seg(f, 6, 20)
    o = m6_fill[0]
    show(m6_fill, h > 0.003)
    o.scale = (1, 1, max(0.001, GH * h))
    o.location = L(SLU, SLV + SC.SILO_R + 0.016, GZ0 + GH * h / 2)
    return vis + m6_fill


BB = {
    "m1": (0.5, 10.7, 0.5, 4.6, Z0, Z0 + 1.9),
    "m2": (11.6, 18.0, 0.8, 4.7, Z0 + 2.0, Z0 + 4.0),
    "m2o": (1.8, 3.4, 9.8, 10.4, Z0 + 1.6, Z0 + 3.2),
    "m3": (17.6, 21.0, 2.8, 7.8, Z0, Z0 + 2.7),
    "k1": (17.2, 20.8, 8.95, 12.3, Z0 + 0.2, Z0 + 1.1),
    "k2": (7.8, 12.0, 9.6, 12.8, Z0 + 0.3, Z0 + 0.9),
    "k3": (13.2, 15.3, 9.9, 12.85, Z0 + 0.2, Z0 + 2.0),
}
DEFS = {
    "m1": dict(n=28, pose=pose_m1, bb=BB["m1"]),
    "m2": dict(n=30, pose=lambda f: pose_m2(f, big=True), bb=BB["m2"]),
    "m2o": dict(n=30, pose=lambda f: pose_m2(f, big=False), bb=BB["m2o"], step="m2"),   # 다른 나라 작은 섬 (같은 단계)
    "m3": dict(n=28, pose=pose_m3, bb=BB["m3"]),
    "k1": dict(n=26, pose=pose_k1, bb=BB["k1"]),
    "k2": dict(n=24, pose=pose_k2, bb=BB["k2"]),
    "k3": dict(n=28, pose=pose_k3, bb=BB["k3"]),
}

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
    K.occ(OUT, skip=("plat", "lane", "sea", "isl"))
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
