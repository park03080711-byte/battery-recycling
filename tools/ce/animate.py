"""재생원료 인증 '인증서가 나오는 공장' — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입구 → ① 입고 · 계량 → ② 파쇄 · 선별 → ③ 정제 → ④ 인증 심사 → 갈림점 → ⑤ 소재 · 셀 공장 / ⑥ 수출,
그 뒤 분홍 길(사후관리)이 ④에서 공장 입구로 돌아간다.
단계마다: 저울 테두리가 깜빡이며 무게를 재고(①~③) · 서류와 심사원이 차례로 켜지고 인증서 도장이 빛나며(④) ·
함유율 막대가 차고(⑤) · 식별 무늬가 빛난 뒤(⑥), 기록 기둥을 타고 빛이 올라가
가운데 뒤 기록판의 그 단계 줄에 막대가 그려진다(클립 r_*: 끝난 줄은 남음).
막대 길이는 개념이며 실제 수치가 아니다. 모든 동작이 덧그림이라 클린 배경은 필요 없다.
python animate.py out=anim [only=dry,coords,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
sys.path.insert(0, os.path.join(HERE, "..", "tr"))
import bpy, bmesh
from mathutils import Vector
import certify as CE
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
Z0, LV, LOOP = CE.Z0, CE.LV, CE.LOOP
FORK = ("fork", CE.FORK[0], LV)

K = Kit(CE.build)
sc = K.sc
_M = CE.mats_ce()

# ── 흐름선: 입구 → ①②③④ → 갈림점 → ⑤ / ⑥, 마지막으로 ④에서 사후관리 길이 입구로 ──
K.routes([
    [("cin", 0.8, LV), ("s1", 3.0, LV), ("s2", 9.2, LV), ("s3", 15.6, LV), ("s4", 20.7, LV), FORK],
    [FORK, (None, CE.FORK[0], 2.2), ("d1", 24.2, 2.2)],
    [FORK, (None, CE.FORK[0], 8.45), ("d2", 24.0, 8.45)],
    [("s4b", 20.7, LV), (None, 20.7, LOOP), (None, 0.8, LOOP), (None, 0.8, LV + 0.3)],
], Z0)

# ── 재질 ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "data": E("a_data", "#6F8CFF", 2.2),
    "scr": E("a_scr", "#C9D6FF", 1.6),
    "white": E("a_white", "#FFFFFF", 0.9),
    "seal": E("a_seal", "#FFC24D", 2.4),
    "warn": E("a_warn", "#FF9F1C", 1.4),
    "ghost": P("a_ghost", PL.hexlin("#4A5675"), rough=0.4),
    "li": E("a_li", "#FFFFFF", 0.9),
    "ni": E("a_ni", "#2BB594", 1.3),
    "co": E("a_co", "#C23D69", 1.2),
    "mn": E("a_mn", "#F2BFCB", 1.0),
    "bm": E("a_bm", "#8A93A6", 0.9),
    "mhp": E("a_mhp", "#8FB5AA", 1.0),
    "cam": E("a_cam", "#8EA6FF", 1.2),
}
for k, c in CE.ROW_COL.items():
    MA["row_" + k] = E("a_row_" + k, c, 1.3)
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


def put(o, u, v, z, s=1.0):
    o.location = L(u, v, z)
    o.scale = (s, s, s)


def frame(u, v, du, dv, z, m, w=0.05):
    """저울 테두리 빛 (네 변)"""
    return [lambda: box(du + 0.1, w, 0.02, u, v - dv / 2 - 0.05, z, m, "a", bevel=0),
            lambda: box(du + 0.1, w, 0.02, u, v + dv / 2 + 0.05, z, m, "a", bevel=0),
            lambda: box(w, dv + 0.1, 0.02, u - du / 2 - 0.05, v, z, m, "a", bevel=0),
            lambda: box(w, dv + 0.1, 0.02, u + du / 2 + 0.05, v, z, m, "a", bevel=0)]


def scale_glow(u, v, du, dv, disp):
    fr = []
    for fn in frame(u, v, du, dv, Z0 + 0.12, MA["data"]):
        fr += add(fn)
    su, sv = disp
    scr = add(lambda: box(0.44, 0.02, 0.18, su, sv + 0.115, Z0 + 0.78, MA["scr"], "a", bevel=0.01))
    return fr, scr


def weigh(objs, f, a):
    """프레임 a부터 저울 테두리가 세 번 깜빡이고 표시기가 켜진 채 남음"""
    fr, scr = objs
    show(fr, a <= f <= a + 9 and (f - a) % 3 != 2)
    show(scr, f >= a + 1)
    return fr + scr


# ── 기록 기둥 (09와 같은 동작) ──
UP = {}
for key, (pu, pv) in CE.POSTS.items():
    rg = add(lambda pu=pu, pv=pv: ring(0.15, 0.05, pu, pv, 0, MA["data"], "a", t=0.04, seg=32))
    top = add(lambda pu=pu, pv=pv: cyl(0.125, 0.085, pu, pv, Z0 + 1.555, MA["data"], "a", seg=24))
    scr = add(lambda pu=pu, pv=pv: box(0.34, 0.02, 0.22, pu, pv + 0.155, Z0 + 1.09, MA["scr"], "a", bevel=0.01))
    UP[key] = (pu, pv, rg, top, scr)


def upload(key, f, a):
    pu, pv, rg, top, scr = UP[key]
    show(scr, f >= a - 4)
    xs = [(f - a - k * 4) / 7 for k in range(2)]
    xs = [x for x in xs if 0 <= x <= 1]
    show(rg, bool(xs))
    put(rg[0], pu, pv, Z0 + 0.15 + 1.35 * (xs[0] if xs else 0))
    show(top, f >= a + 8 and (f < a + 14 or f % 4 < 3))
    return list(scr) + list(rg) + list(top)


# ── 기록판의 줄: 막대가 왼쪽에서 자란다 (길이는 개념) ──
HU, HV = CE.HUB
BU0 = HU - 1.42          # 막대 시작 (색 표시 오른쪽)
FV = HV + 0.43           # 판 앞면
BAR_H = 0.13


def bar_obj(m, du):
    o = add(lambda: box(du, 0.02, BAR_H, BU0 + du / 2, FV, 0, m, "a", bevel=0.005, seg=1))
    return o


# 줄마다: [(재질, 시작, 길이), ...] — ①~③ 남은 양(색) + 줄어든 양(주황), ④ 도장 + 짧은 막대, ⑤⑥ 전체(회색) 가운데 재생원료 몫
ROWS = {
    "s1": [("row_s1", 0.0, 2.9)],
    "s2": [("row_s2", 0.0, 2.65), ("warn", 2.65, 0.25)],
    "s3": [("row_s3", 0.0, 2.4), ("warn", 2.4, 0.5)],
    "s4": [("row_s4", 0.25, 1.2)],
    "d1": [("ghost", 0.0, 2.9), ("row_d1", 0.0, 0.7)],
    "d2": [("ghost", 0.0, 2.9), ("row_d2", 0.0, 0.7)],
}
RB = {}
for k, key in enumerate(CE.ROWS):
    z = CE.row_z(k) - BAR_H / 2 + 0.06
    parts = []
    for m, s0, du in ROWS[key]:
        objs = bar_obj(MA[m], du)
        parts.append((objs, s0, du, z + (0.0005 if m == "ghost" else 0.002)))
    if key == "s4":
        seal = add(lambda z=z: cyl(0.09, 0.02, BU0 + 0.1, FV + 0.01, z + 0.065, MA["seal"], "a", axis="v", seg=24))
        parts.append((seal, None, None, z))
    RB[key] = parts


def row_pose(key, f, a):
    vis = []
    for objs, s0, du, z in RB[key]:
        if s0 is None:   # 도장
            show(objs, f >= a)
            sc_ = 1.0 + 0.6 * max(0, 1 - (f - a) / 4) if f >= a else 1
            objs[0].scale = (sc_, sc_, sc_)
            vis += objs
            continue
        x = seg(f, a, a + 7) if s0 == 0.0 or du > 1 else seg(f, a + 5, a + 9)
        show(objs, f >= a and x > 0.01)
        o = objs[0]
        o.scale = (1, max(0.01, x), 1)
        o.location = L(BU0 + s0 + du * x / 2, FV, z + BAR_H / 2)
        vis += objs
    return vis


# ① 입고 · 계량 — 큰 저울 · 스크랩 저울이 차례로 재고, 입고 표가 빛남
U1, V1 = 3.0, LV
s1_w = scale_glow(U1, V1, 3.5, 2.3, (U1 - 1.2, V1 - 1.55))
s1_w2 = add(lambda: box(1.3, 1.2, 0.015, U1 + 2.75, V1 + 0.95, Z0 + 0.12, MA["data"], "a", bevel=0))
s1_tag = add(lambda: box(0.5, 0.36, 0.01, U1 + 0.6, V1 + 0.45, Z0 + 0.82, MA["white"], "a", bevel=0.004, seg=1))


def pose_s1(f):
    vis = weigh(s1_w, f, 2)
    show(s1_w2, 6 <= f <= 12 and f % 3 != 2)
    show(s1_tag, 10 <= f <= 18 and f % 3 != 0)
    return vis + s1_w2 + s1_tag + upload("s1", f, 14)


# ② 파쇄 · 선별 — 컨베이어 위 알갱이가 흐르고, 블랙매스 톤백 저울이 잼
U2, V2 = 8.2, LV
s2_w = scale_glow(U2 + 0.98, V2 - 1.25, 2.1, 1.1, (U2 + 2.35, V2 - 1.75))
s2_gr = [add(lambda: S.obj_from(S.cyl_mesh(0.08, 0.08, 10, r2=0.0), L(0, 0, 0), MA["bm"], "g", (0, 0, 0), "a")) for _ in range(4)]


def pose_s2(f):
    vis = []
    for j, objs in enumerate(s2_gr):
        x = (f - 1 - j * 2) / 8
        show(objs, 0 <= x <= 1)
        objs[0].location = L(U2 + 0.8 + 1.3 * min(max(x, 0), 1), V2 + (j % 2 - 0.5) * 0.2, Z0 + 0.7)
        vis += objs
    return vis + weigh(s2_w, f, 6) + upload("s2", f, 14)


# ③ 정제 — 제품 통 뚜껑이 차례로 빛나고(8종), 제품 저울이 잼
PU3, PV3 = 17.0, LV + 0.55
s3_w = scale_glow(PU3, PV3, 2.4, 1.7, (PU3 + 1.55, PV3 - 0.55))
s3_lid = []
for k, lid in enumerate(CE.DRUMS):
    i, j = k % 4, k // 4
    s3_lid.append(add(lambda i=i, j=j, lid=lid: cyl(0.195, 0.02, PU3 - 0.8 + i * 0.53, PV3 - 0.36 + j * 0.72, Z0 + 0.12 + 0.58, MA[lid], "a", seg=32)))


def pose_s3(f):
    vis = []
    for k, objs in enumerate(s3_lid):
        show(objs, f >= 1 + k)
        vis += objs
    return vis + weigh(s3_w, f, 8) + upload("s3", f, 14)


# ④ 인증 심사 — 서류 더미(서류 심사) → 안전모 둘(현장 심사) → 둥근 탁자(심의) → 인증서 도장
U4, V4 = 20.7, LV
DU4, DV4 = U4 - 0.35, V4 - 0.5
s4_doc = [add(lambda k=k, n=n: box(0.44, 0.32, 0.01, DU4 - 0.75 + k * 0.5, DV4 - 0.05, Z0 + 0.79 + n * 0.016 + 0.004, MA["white"], "a", bevel=0.003, seg=1)) for k, n in enumerate((6, 4, 8))]
s4_hat = [add(lambda dv=dv: S.obj_from(S.cyl_mesh(0.155, 0.145, 32, r2=0.095), L(DU4 + 0.3, DV4 + dv, Z0 + 0.79 + 0.025 + 0.0725), MA["seal"], "h", (0, 0, 0), "a")) for dv in (0.2, -0.22)]
TU4, TV4 = U4 + 0.95, V4 - 0.55
s4_tab = add(lambda: ring(0.52, 0.03, TU4, TV4, Z0 + 0.64, MA["data"], "a", t=0.04, seg=48))
CU4, CV4 = U4 + 0.55, V4 + 0.85
s4_paper = add(lambda: box(1.16, 0.01, 0.78, CU4, CV4 + 0.05, Z0 + 0.57, MA["white"], "a", bevel=0.004, seg=1))
s4_seal = add(lambda: cyl(0.125, 0.03, CU4 + 0.33, CV4 + 0.07, Z0 + 0.72, MA["seal"], "a", axis="v", seg=32))


def pose_s4(f):
    vis = []
    for k, objs in enumerate(s4_doc):
        show(objs, 1 + k * 2 <= f <= 9 + k * 2)
        vis += objs
    for k, objs in enumerate(s4_hat):
        show(objs, 6 + k * 2 <= f <= 14)
        vis += objs
    show(s4_tab, 10 <= f <= 15 and f % 3 != 2)
    show(s4_paper, f >= 14)
    show(s4_seal, f >= 15)
    if f >= 15:
        s_ = 1.0 + 0.5 * max(0, 1 - (f - 15) / 4)
        s4_seal[0].scale = (s_, s_, s_)
    return vis + s4_tab + s4_paper + s4_seal + upload("s4", f, 16)


# ⑤ 소재 · 셀 공장 — 벽 표시판에 함유율 막대가 차고, 나가는 셀 머리가 빛남
U5, V5 = 25.9, 2.2
d1_bar = add(lambda: box(0.78, 0.012, 0.14, U5 - 0.6, V5 + 0.745, Z0 + 0.63, MA["ok"], "a", bevel=0.004, seg=1))
d1_caps = [add(lambda i=i, j=j: cyl(0.055, 0.02, U5 - 2.3 + i * 0.3, V5 - 0.1 + j * 0.4, Z0 + 0.8, MA["ok"], "a", seg=16)) for i in range(3) for j in range(2)]


def pose_d1(f):
    vis = []
    x = seg(f, 2, 10) * 0.3   # 판 폭의 일부만 (개념)
    show(d1_bar, f >= 2)
    d1_bar[0].scale = (1, max(0.01, x), 1)
    d1_bar[0].location = L(U5 - 0.6 - 0.39 + 0.78 * x / 2, V5 + 0.745, Z0 + 0.63 + 0.07)
    for k, objs in enumerate(d1_caps):
        show(objs, f >= 4 + k)
        vis += objs
    return vis + d1_bar + upload("d1", f, 14)


# ⑥ 수출 — 팩의 식별 무늬가 빛나고(여권의 재생원료 칸), 컨테이너 문이 빛남
U6, V6 = 25.5, 8.45
d2_qr = add(lambda: box(0.36, 0.36, 0.01, U6 + 2.25, V6 + 0.15, Z0 + 0.5, MA["white"], "a", bevel=0.004, seg=1))
d2_door = add(lambda: box(0.012, 1.02, 0.98, U6 + 1.33, V6, Z0 + 0.06, MA["data"], "a", bevel=0.004, seg=1))


def pose_d2(f):
    show(d2_qr, 2 <= f <= 12 and f % 3 != 0)
    show(d2_door, 6 <= f <= 12 and f % 2 == 0)
    return d2_qr + d2_door + upload("d2", f, 14)


def rower(key, a):
    return lambda f: row_pose(key, f, a)


BB = {
    "s1": (1.0, 6.4, 4.8, 8.6, Z0, Z0 + 1.8),
    "s2": (8.0, 11.6, 4.6, 7.6, Z0, Z0 + 1.8),
    "s3": (15.6, 18.8, 4.7, 8.5, Z0, Z0 + 1.8),
    "s4": (19.3, 23.0, 4.7, 8.1, Z0, Z0 + 1.8),
    "d1": (23.4, 27.7, 1.6, 3.6, Z0, Z0 + 1.8),
    "d2": (26.7, 28.2, 6.0, 9.0, Z0, Z0 + 1.8),
    "row": (HU - 1.7, HU + 1.7, FV - 0.05, FV + 0.05, Z0 + 2.1, Z0 + 3.8),
}
DEFS = {
    "s1": dict(n=32, pose=pose_s1, bb=BB["s1"]),
    "s2": dict(n=32, pose=pose_s2, bb=BB["s2"]),
    "s3": dict(n=32, pose=pose_s3, bb=BB["s3"]),
    "s4": dict(n=34, pose=pose_s4, bb=BB["s4"]),
    "d1": dict(n=32, pose=pose_d1, bb=BB["d1"]),
    "d2": dict(n=32, pose=pose_d2, bb=BB["d2"]),
}
# 기록판 줄: 기둥 꼭대기 등이 켜질 즈음 그려짐
for key, a in (("s1", 22), ("s2", 22), ("s3", 22), ("s4", 24), ("d1", 22), ("d2", 22)):
    DEFS[f"r_{key}"] = dict(n=DEFS[key]["n"], pose=rower(key, a), bb=BB["row"], step=key)

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
