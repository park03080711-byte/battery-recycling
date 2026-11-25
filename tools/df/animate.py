"""분해를 고려한 설계 '두 팩 나란히 뜯기' — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 뜯기 어려운 팩 ① 뚜껑 볼트가 하나씩(수십 개) → ② 모듈 나사 마흔여덟 · 배선 → ③ 접착제 · 용접 점 → 파쇄기로 조각이 떨어짐,
      그다음 뜯기 쉬운 팩 ④ 클립 여섯 → ⑤ 띠 걸쇠 · 버스바 묶음 → ⑥ 큰 셀이 하나씩 표시되며 앞 선반에 그대로 놓임(식별 무늬 읽기).
단계마다 그 팩의 '걸린 시간' 막대에 한 칸씩 쌓인다(클립 c_*, 끝난 칸은 남음; 높이는 개념, 어려운 팩 합이 쉬운 팩의 약 4배).
모든 동작이 덧그림이라 클린 배경은 필요 없다.
python animate.py out=anim [only=dry,coords,occ,clips] [clip=h1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
for d in ("rc", "rm", "tr", "ce", "lc"):
    sys.path.insert(0, os.path.join(HERE, "..", d))
import bpy
from mathutils import Vector
import packs as DF
import plant as PL
import scene as S
from plant import box, cyl, L
from motion_kit import Kit, seg, new_objs

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0, LB, LF = DF.Z0, DF.LANE_B, DF.LANE_F
HU, HV = DF.PACK["h"]
EU, EV = DF.PACK["e"]

K = Kit(DF.build)
sc = K.sc

# ── 흐름선: 어려운 팩 한 바퀴 → 쉬운 팩 한 바퀴 ──
K.routes([
    [("in", 0.8, LB), ("h1", HU, LB), (None, DF.SIDE["h"], LB), (None, DF.SIDE["h"], LF), ("h2", HU + 1.6, LF), ("h3", DF.SHRED[0], LF), (None, DF.SHRED[0], DF.SHRED[1] - 0.75)],
    [("ee", 11.4, LB), ("e1", EU, LB), (None, DF.SIDE["e"], LB), (None, DF.SIDE["e"], LF), ("e2", EU + 2.2, LF), ("e3", DF.RACK[0], LF), (None, DF.RACK[0], DF.RACK[1] - 0.8)],
], Z0)

# ── 재질 ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "bolt": E("a_bolt", "#FFC24D", 2.4),
    "red": E("a_red", "#FF6B4D", 1.6),
    "spark": E("a_spark", "#FFE9A8", 3.0),
    "harn": E("a_harness", "#FFB37A", 1.4),
    "teal": E("a_teal", "#7FF0E2", 1.6),
    "cell": E("a_cell", "#BFD0FF", 0.9),
    "scan": E("a_scan", "#8EA6FF", 2.0),
    "chunk": P("a_chunk", PL.hexlin("#AEB8C9"), rough=0.5),
    "cellb": P("a_cellb", PL.hexlin("#C9D2E3"), rough=0.35, coat=0.25),
    "gh": P("a_gauge_h", PL.hexlin("#F3B64A"), rough=0.4, emit=(PL.hexlin("#F3B64A"), 0.5)),
    "ge": P("a_gauge_e", PL.hexlin("#39C6B6"), rough=0.4, emit=(PL.hexlin("#39C6B6"), 0.5)),
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


def flash(lst, f, a, step, hold=3):
    """lst[k]를 a + k*step 프레임부터 hold 프레임 동안 켬"""
    vis = []
    for k, objs in enumerate(lst):
        t0 = a + k * step
        show(objs, t0 <= f < t0 + hold)
        vis += objs
    return vis


VF = DF.COVER_V + 0.105
ZI = DF.inner_z()

# ① 어려운 팩 뚜껑 — 볼트가 하나씩 풀림(빛남), 끝에 실링 띠를 자름
h1_b = [add(lambda bu=bu, bz=bz: cyl(0.075, 0.02, bu, VF, bz, MA["bolt"], "a", axis="v", seg=16)) for (bu, bz) in DF.HB]


def pose_h1(f):
    return flash(h1_b, f, 2, 1, hold=3)


# ② 모듈 나사 마흔여덟이 둘씩 풀리고, 끝에 배선이 빛남(뽑아냄)
h2_s = [add(lambda su=su, sv=sv: cyl(0.065, 0.02, su, sv, ZI + 0.4, MA["bolt"], "a", seg=12)) for (su, sv) in DF.HSCREWS]
h2_s2 = [h2_s[i] + (h2_s[i + 1] if i + 1 < len(h2_s) else []) for i in range(0, len(h2_s), 2)]
h2_h = [add(lambda pts=pts: PL.poly_pipe([(p[0], p[1], p[2] + 0.005) for p in pts], 0.05, MA["harn"], "a")) for pts in DF.HARNESS]


def pose_h2(f):
    vis = flash(h2_s2, f, 2, 1, hold=3)
    for objs in h2_h:
        show(objs, 28 <= f <= 38)
        vis += objs
    return vis


# ③ 접착제가 붉게(떼어지지 않음), 용접 점에 불꽃, 조각이 파쇄기로 떨어짐
h3_g = [add(lambda g=g: box(g[2], g[3], 0.012, g[0], g[1], ZI + (0.3 if g[2] < 1 else 0.24), MA["red"], "a", bevel=0, seg=1)) for g in DF.HGLUE]
h3_w = [add(lambda w=w: cyl(0.06, 0.012, w[0], w[1], ZI + 0.39, MA["spark"], "a", seg=12)) for w in DF.HWELDS]
SU, SV = DF.SHRED
h3_c = [add(lambda: box(0.3, 0.22, 0.12, 0, 0, 0, MA["chunk"], "a", bevel=0.03)) for _ in range(6)]


def pose_h3(f):
    vis = []
    for objs in h3_g:
        show(objs, 2 <= f <= 22 and (f < 16 or f % 2 == 0))
        vis += objs
    vis += flash(h3_w[::3], f, 4, 1, hold=2)
    for k, objs in enumerate(h3_c):
        t = (f - 14 - k * 3) / 6
        show(objs, 0 <= t <= 1)
        objs[0].location = L(SU - 0.25 + 0.1 * k, SV - 0.1, Z0 + 2.4 - 1.2 * t * t)
        objs[0].rotation_euler[2] = 0.6 * k + 2 * t
        vis += objs
    return vis


# ④ 쉬운 팩 뚜껑 — 클립 여섯이 빠르게
e1_c = [add(lambda cu=cu, cz=cz: box(0.38, 0.02, 0.22, cu, VF + 0.03, cz - 0.11, MA["teal"], "a", bevel=0, seg=1)) for (cu, cz) in DF.EC]


def pose_e1(f):
    return flash(e1_c, f, 2, 2, hold=4)


# ⑤ 띠 걸쇠 넷 · 버스바 묶음(한쪽 끝) 빛남
e2_k = []
for sv in DF.STRAPS:
    for du in (-3.55 + 0.45, 2.65):
        e2_k.append(add(lambda du=du, sv=sv: box(0.14, 0.28, 0.012, EU + du, sv, ZI + 0.61, MA["teal"], "a", bevel=0, seg=1)))
BU_, BV_ = DF.BUSBAR
e2_b = add(lambda: box(0.46, DF.PD - 0.6, 0.012, BU_, BV_, ZI + 0.615, MA["teal"], "a", bevel=0, seg=1))


def pose_e2(f):
    vis = flash(e2_k, f, 2, 2, hold=4)
    show(e2_b, 10 <= f <= 20)
    return vis + e2_b


# ⑥ 큰 셀이 하나씩 표시되고(식별 무늬 읽힘) 앞 선반에 그대로 놓임
e3_hl = [add(lambda cu=cu, cv=cv: box(0.56, DF.PD - 0.44, 0.012, cu, cv, ZI + 0.556, MA["cell"], "a", bevel=0, seg=1)) for (cu, cv) in DF.ECELLS]
QU, QV = DF.QR_E
e3_scan = add(lambda: box(0.42, 0.015, 0.42, QU, QV + 0.03, DF.tray_z() - 0.02, MA["scan"], "a", bevel=0, seg=1))
RU, RV = DF.RACK
# 선반 셋에 셋 · 셋 · 둘 (셀을 옆으로 눕혀 폭 0.42)
SLOTS = [(RU, RV - 0.46 + j * 0.46, Z0 + 0.31 + k * 0.62) for k in range(3) for j in range(3)][:8]
e3_r = [add(lambda: box(3.4, 0.42, 0.5, 0, 0, 0, MA["cellb"], "a", bevel=0.04)) for _ in SLOTS]


def pose_e3(f):
    show(e3_scan, 1 <= f <= 6 and f % 2 == 1)
    vis = list(e3_scan)
    vis += flash(e3_hl, f, 4, 3, hold=3)
    for k, objs in enumerate(e3_r):
        t = f - (6 + k * 3)
        show(objs, t >= 0)
        u, v, z = SLOTS[k]
        objs[0].location = L(u, v, z + 0.25 + 0.3 * max(0.0, 1 - t / 2))
        vis += objs
    return vis


# ── 걸린 시간 막대 (개념 높이, 홈 높이 기준 비율) ──
GH = DF.GAUGE_H - 0.3
SEGS = {"h1": ("h", 0.0, 0.2), "h2": ("h", 0.2, 0.42), "h3": ("h", 0.62, 0.34),
        "e1": ("e", 0.0, 0.05), "e2": ("e", 0.05, 0.07), "e3": ("e", 0.12, 0.12)}
GS = {}
for key, (pk, z0, h) in SEGS.items():
    gu, gv = DF.GAUGE[pk]
    GS[key] = add(lambda gu=gu, gv=gv, pk=pk: box(0.2, 0.012, 1.0, gu, gv + 0.268, 0, MA["g" + pk], "a", bevel=0, seg=1))


def col_pose(key, f, a, b):
    """단계 길이에 맞춰 a~b 프레임 동안 칸이 아래에서 위로 참 (끝난 뒤엔 그대로 남음)"""
    pk, z0, h = SEGS[key]
    gu, gv = DF.GAUGE[pk]
    x = seg(f, a, b)
    o = GS[key][0]
    show(GS[key], f >= a and x > 0.01)
    o.scale = (1, 1, max(0.002, GH * h * x))
    o.location = L(gu, gv + 0.268, Z0 + 0.25 + GH * (z0 + h * x / 2))
    return GS[key]


def coler(key, a, b):
    return lambda f: col_pose(key, f, a, b)


GB = {pk: (gu - 0.4, gu + 0.4, gv - 0.4, gv + 0.4, Z0 + 0.2, Z0 + DF.GAUGE_H + 0.2) for pk, (gu, gv) in DF.GAUGE.items()}
BB = {
    "h1": (HU - 3.4, HU + 3.4, DF.COVER_V, DF.COVER_V + 0.2, Z0 + 0.2, Z0 + DF.COVER_H + 0.2),
    "h2": (HU - 3.2, HU + 3.2, HV - 1.9, HV + 1.9, ZI + 0.3, ZI + 0.6),
    "h3": (HU - 3.3, HU + 3.3, HV - 1.9, DF.SHRED[1] + 0.2, Z0 + 0.8, Z0 + 2.6),
    "e1": (EU - 3.3, EU + 3.3, DF.COVER_V, DF.COVER_V + 0.2, Z0 + 0.2, Z0 + DF.COVER_H + 0.1),
    "e2": (EU - 3.3, EU + 3.3, EV - 1.8, EV + 1.8, ZI + 0.55, ZI + 0.66),
    "e3": (EU - 3.3, EU + 3.3, EV - 1.8, DF.RACK[1] + 0.8, Z0 + 0.25, Z0 + 3.1),
}
DEFS = {
    "h1": dict(n=42, pose=pose_h1, bb=BB["h1"]),
    "h2": dict(n=40, pose=pose_h2, bb=BB["h2"]),
    "h3": dict(n=36, pose=pose_h3, bb=BB["h3"]),
    "e1": dict(n=18, pose=pose_e1, bb=BB["e1"]),
    "e2": dict(n=22, pose=pose_e2, bb=BB["e2"]),
    "e3": dict(n=32, pose=pose_e3, bb=BB["e3"]),
}
for key in DEFS.copy():
    n = DEFS[key]["n"]
    DEFS[f"c_{key}"] = dict(n=n, pose=coler(key, 3, n - 4), bb=GB[SEGS[key][0]], step=key)


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
