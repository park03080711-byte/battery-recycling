"""잔존수명 진단 라인 — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입구 → ① 탈거 전 평가 → ② 외관 · 안전 점검 → ③ 빠른 진단 → ④ 등급 판정 → 갈림점 → 재제조 · 재사용 · 재활용 (한 갈래씩)
움직임은 설명용이며 실제 설비 동작과 다르다. 모든 동작은 덧그림(표시등 · 빛 · 떨어지는 모듈)이라 클린 배경이 필요 없다.
python animate.py out=anim [only=coords,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import bpy, bmesh
import line as LN
import plant as PL
import scene as S
import workshop as WK
from plant import box, cyl, L
from motion_kit import Kit, lerp, seg, new_objs, along

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0 = LN.Z0
LV = LN.LV

K = Kit(LN.build)
sc = K.sc

# ── 흐름선: 입구 → ①②③④ → 갈림점, 그리고 세 출구 ──
FORK = ("fork", 18.6, LV)
K.routes([
    [("cin", 0.8, LV), ("s1", 3.0, LV), ("s2", 8.4, LV), ("s3", 13.2, LV), ("s4", 15.5, LV), FORK],
    [FORK, (None, 18.6, 1.6), ("d1", 20.1, 1.6)],
    [FORK, ("d2", 20.8, LV)],
    [FORK, (None, 18.6, 7.6), ("d3", 20.7, 7.6)],
], Z0)

# ── 재질 (빛나는 표시) ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "pulse": E("a_pulse", "#39C6B6", 2.0),
    "warn": E("a_warn", "#FF9F1C", 1.3),
    "blue": E("a_blue", "#5B7CFA", 1.4),
    "scan": E("a_scan", "#6F8CFF", 2.2),
    "wave": E("a_wave", "#FFFFFF", 1.2),
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


def lamp(u, v, z, m, r=0.06):
    return add(lambda: cyl(r, 0.03, u, v, z, m, "a", axis="v", seg=20))


# ① 탈거 전 평가 — 충전구에서 진단기로 자료가 흘러가고(케이블 빛), 화면 막대가 차오른 뒤 표시등이 청록
CU, CV = 6.3, 7.3
CAR_U, CAR_V = 3.0, 7.0
CAB = [(CAR_U + 2.05, CAR_V - 0.55, Z0 + 0.62), (CAR_U + 1.7, CAR_V - 0.3, Z0 + 0.35), (CU - 0.7, CV - 0.2, Z0 + 0.25), (CU - 0.35, CV - 0.1, Z0 + 0.7)]
s1_pulse = [add(lambda: sphere(0.065, MA["pulse"])) for _ in range(3)]
s1_bar = [add(lambda: box(0.09, 0.015, 0.05, 0, 0, 0, MA["ok"], "a", bevel=0)) for _ in range(4)]
s1_led = [lamp(CU - 0.22 + k * 0.22, CV + 0.345, Z0 + 0.62, MA["ok"], r=0.055) for k in range(3)]


def pose_s1(f):
    vis = []
    for j, objs in enumerate(s1_pulse):
        x = f / 9 - j * 0.35
        show(objs, 0 <= x <= 1 and f < 20)
        objs[0].location = L(*along(CAB, min(max(x, 0), 1)))
        vis += objs
    for k, objs in enumerate(s1_bar):
        h = 0.26 * (0.45 + 0.55 * ((k * 0.37 + 0.2) % 1)) * seg(f, 4 + k * 3, 12 + k * 3)
        o = objs[0]
        o.dimensions = (0.015, 0.09, max(0.005, h))  # Blender x = v, y = u
        o.location = L(CU - 0.21 + k * 0.14, CV - 0.062, Z0 + 1.4 + h / 2)
        show(objs, f >= 4 + k * 3)
        vis += objs
    for k, objs in enumerate(s1_led):
        show(objs, f >= 21 + k * 2)
        vis += objs
    return vis


# ② 외관 · 안전 점검 — 검사 문의 빛 막대가 팩 위를 훑고, 한 곳을 확인(주황 → 청록)한 뒤 옆 화면에 확인 표시 세 개
U2, V2 = 9.0, 6.6
PACK2 = (U2 - 0.5, V2)
ZL = Z0 + 0.55 + 0.42 + 0.01  # 팩 뚜껑 윗면 바로 위
s2_scan = add(lambda: box(0.06, 1.8, 0.02, 0, 0, 0, MA["scan"], "a", bevel=0.01))
s2_cams = [o for dv in (-0.55, 0.0, 0.55) for o in lamp(U2 + 0.6, V2 + dv + 0.115, Z0 + 1.88, MA["scan"], r=0.035)]
s2_spot_w = add(lambda: box(0.34, 0.34, 0.012, PACK2[0] + 0.5, PACK2[1] + 0.35, ZL, MA["warn"], "a", bevel=0.01))
s2_spot_ok = add(lambda: box(0.34, 0.34, 0.012, PACK2[0] + 0.5, PACK2[1] + 0.35, ZL, MA["ok"], "a", bevel=0.01))
SU, SV = U2 + 2.4, V2 + 0.2
s2_chk = [add(lambda: box(0.12, 0.015, 0.12, SU - 0.18 + k * 0.18, SV + 0.117, Z0 + 1.27, MA["ok"], "a", bevel=0.01)) for k in range(3)]


def pose_s2(f):
    x = lerp(PACK2[0] - 1.6, PACK2[0] + 1.6, seg(f, 1, 18))
    s2_scan[0].location = L(x, PACK2[1], ZL + 0.02)
    show(s2_scan, 1 <= f <= 18)
    show(s2_cams, 1 <= f <= 18)
    show(s2_spot_w, 8 <= f < 15)
    show(s2_spot_ok, f >= 15)
    vis = s2_scan + s2_cams + s2_spot_w + s2_spot_ok
    for k, objs in enumerate(s2_chk):
        show(objs, f >= 20 + k * 3)
        vis += objs
    return vis


# ③ 빠른 진단 — 측정기에서 모듈마다 짧은 펄스가 가고, 화면에 계단 모양 펄스가 지나가며, 모듈 위 표시가 켜짐(약한 모듈 하나는 주황)
U3, V3 = 13.2, 2.6
TU, TV = U3 + 2.5, V3 - 0.2
PU3 = U3 - 0.1
LEADS = [[(TU - 0.5, TV - 0.3 + k * 0.08, Z0 + 1.6 - k * 0.1), (TU - 1.0, TV - 0.3, Z0 + 1.9), (U3 - 1.15 + k * 0.7, V3 - 0.62, Z0 + 1.35), (U3 - 1.15 + k * 0.7, V3 - 0.62, Z0 + 1.12)] for k in range(4)]
s3_pulse = [add(lambda: sphere(0.05, MA["pulse"])) for _ in range(4)]
ZM = Z0 + 0.75 + 0.34 + 0.3  # 모듈 윗면
s3_mod = []
for i in range(4):
    for j in range(2):
        mu, mv = PU3 - 1.05 + i * 0.7, V3 - 0.42 + j * 0.84
        m = MA["warn"] if (i, j) == (2, 1) else MA["ok"]
        s3_mod.append((i, j, add(lambda: box(0.22, 0.22, 0.012, mu, mv + 0.12, ZM, m, "a", bevel=0.01))))
s3_ch = [add(lambda: box(0.7, 0.012, 0.1, 0, 0, 0, MA["ok"], "a", bevel=0)) for _ in range(4)]
s3_base = add(lambda: box(0.64, 0.012, 0.015, TU, TV + 0.522, Z0 + 1.5, MA["wave"], "a", bevel=0))
s3_step = add(lambda: box(0.1, 0.012, 0.16, 0, 0, 0, MA["wave"], "a", bevel=0))


def pose_s3(f):
    vis = []
    for k, objs in enumerate(s3_pulse):
        x = (f - k * 3) / 8
        show(objs, 0 <= x <= 1)
        objs[0].location = L(*along(LEADS[k], min(max(x, 0), 1)))
        vis += objs
    # 화면: 기준선 위로 펄스(계단)가 왼쪽 → 오른쪽
    show(s3_base, True)
    px = lerp(TU - 0.27, TU + 0.27, ((f % 12) / 12))
    s3_step[0].location = L(px, TV + 0.522, Z0 + 1.5 + 0.08)
    show(s3_step, f < 26)
    vis += s3_base + s3_step
    for k, objs in enumerate(s3_ch):
        w = max(0.01, 0.7 * seg(f, 6 + k * 4, 14 + k * 4))
        o = objs[0]
        o.dimensions = (0.012, w, 0.1)
        o.location = L(TU - 0.35 + w / 2, TV + 0.522, Z0 + 0.35 + k * 0.2 + 0.05)
        show(objs, f >= 6 + k * 4)
        vis += objs
    for i, j, objs in s3_mod:
        show(objs, f >= 10 + i * 3 + j)
        vis += objs
    return vis


# ④ 등급 판정 — 회전대 가장자리 빛이 한 바퀴 돌고, 화면 막대가 찬 뒤 세 등급 등(파랑 · 청록 · 주황)이 차례로 켜짐
U4, V4 = 16.6, LV
PX, PV = U4 + 0.2, V4 + 1.7
s4_arc = [add(lambda: box(0.16, 0.08, 0.02, 0, 0, 0, MA["ok"], "a", bevel=0.01)) for _ in range(3)]
s4_bar = add(lambda: box(0.7, 0.012, 0.1, 0, 0, 0, MA["ok"], "a", bevel=0))
s4_lamp = [lamp(PX - 0.25 + k * 0.25, PV + 0.11, Z0 + 1.72, MA[m], r=0.065) for k, m in enumerate(("blue", "ok", "warn"))]


def pose_s4(f):
    vis = []
    for j, objs in enumerate(s4_arc):
        a = -math.pi / 2 + 2 * math.pi * seg(f, 0, 16) + j * 0.22
        o = objs[0]
        o.location = L(U4 + 0.96 * math.cos(a), V4 + 0.96 * math.sin(a), Z0 + 0.165)
        o.rotation_euler = (0, 0, -a)
        show(objs, f <= 18)
        vis += objs
    w = max(0.01, 0.7 * seg(f, 4, 16))
    o = s4_bar[0]
    o.dimensions = (0.012, w, 0.1)
    o.location = L(PX - 0.35 + w / 2, PV + 0.082, Z0 + 1.95)
    show(s4_bar, f >= 4)
    vis += s4_bar
    for k, objs in enumerate(s4_lamp):
        show(objs, f >= 18 + k * 4)
        vis += objs
    return vis


# 재제조 출구 — 선반의 팩 상태 표시가 차례로 파랑 (차량 탑재 대기)
U5, V5 = 21.8, 1.6
d1_led = [add(lambda: box(0.3, 0.02, 0.08, U5 - 0.75 + i * 1.5, V5 + 0.53, Z0 + 0.47 + k * 0.7, MA["blue"], "a", bevel=0.01)) for k in range(2) for i in range(2)]


def pose_d1(f):
    vis = []
    for n, objs in enumerate(d1_led):
        show(objs, f >= 8 + n * 4)
        vis += objs
    return vis


# 재사용 출구 — ESS 캐비닛 충전 표시 다섯 칸이 차례로 참
U6, V6 = 22.2, LV
d2_lvl = [add(lambda: box(0.34, 0.02, 0.1, U6 - 0.9 + k * 0.45, V6 + 0.675, Z0 + 1.35, MA["ok"], "a", bevel=0.005)) for k in range(5)]


def pose_d2(f):
    vis = []
    for k, objs in enumerate(d2_lvl):
        show(objs, f >= 4 + k * 5)
        vis += objs
    return vis


# 재활용 출구 — 지친 모듈이 수거함으로 들어가고, 경고등이 천천히 두 번 켜진 뒤 켜진 채로
U7, V7 = 21.8, 7.6
d3_mod = add(lambda: WK.module_({"steel": bpy.data.materials.get("steel")}, 0, 0, 0, bpy.data.materials.get("module_old"), "a"))
d3_base = {o.name: o.location.copy() for o in d3_mod}
d3_lamp = add(lambda: cyl(0.105, 0.15, U7 - 1.3, V7 - 0.6, Z0 + 1.3, MA["warn"], "a", seg=24))


def pose_d3(f):
    x = seg(f, 2, 14)
    du, dv, dz = U7 - 0.1, V7 + 0.1, lerp(Z0 + 1.6, Z0 + 0.4, x)
    for o in d3_mod:
        b = d3_base[o.name]
        o.location = (b.x + dv, b.y + du, b.z + dz)
    show(d3_mod, 2 <= f <= 15)
    show(d3_lamp, (16 <= f < 20) or (24 <= f < 28) or f >= 31)
    return d3_mod + d3_lamp


DEFS = {
    "s1": dict(n=30, pose=pose_s1, bb=(4.9, 7.0, 6.3, 7.8, Z0 + 0.2, Z0 + 1.8)),
    "s2": dict(n=30, pose=pose_s2, bb=(6.8, 11.8, 5.5, 7.6, Z0 + 0.95, Z0 + 2.0)),
    "s3": dict(n=30, pose=pose_s3, bb=(11.6, 16.3, 1.6, 3.2, Z0 + 0.3, Z0 + 2.0)),
    "s4": dict(n=32, pose=pose_s4, bb=(15.5, 17.7, 3.5, 6.5, Z0 + 0.1, Z0 + 2.1)),
    "d1": dict(n=26, pose=pose_d1, bb=(19.6, 23.0, 1.0, 2.8, Z0, Z0 + 1.3)),
    "d2": dict(n=30, pose=pose_d2, bb=(20.8, 23.4, 5.2, 5.4, Z0 + 1.3, Z0 + 1.5)),
    "d3": dict(n=34, pose=pose_d3, bb=(20.4, 22.6, 6.8, 8.1, Z0 + 0.3, Z0 + 2.1)),
}

if "dry" in only:  # 렌더 없이 모든 프레임의 자세 함수만 돌려 오류를 미리 잡음
    for k, d in DEFS.items():
        for f in range(d["n"]):
            for o in d["pose"](f):
                assert hasattr(o, "hide_render"), (k, f, o)
    print("[K] dry ok", flush=True)
if "coords" in only:
    K.save(OUT)
if "occ" in only:
    K.occ(OUT)
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
