"""안전 동선 — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입구 → ① 입고 · 격리 검사 → ② 방전 → ③ 전압 반등 확인 → ④ 안전 보관 → ⑤ 운송 포장 (한 줄)
움직임은 설명용이며 실제 설비 동작과 다르다. 모든 동작이 덧그림(표시등 · 빛)이라 클린 배경이 필요 없다.
python animate.py out=anim [only=dry,coords,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import bpy, bmesh
import depot as DP
import plant as PL
import scene as S
from plant import box, cyl, L
from motion_kit import Kit, lerp, seg, new_objs, along

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0 = DP.Z0
LV = DP.LV

K = Kit(DP.build)
sc = K.sc

# ── 흐름선: 입구 → ①②③④ → ⑤ (한 줄) ──
K.routes([
    [("cin", 0.8, LV), ("s1", 2.6, LV), ("s2", 8.2, LV), ("s3", 12.8, LV), ("s4", 17.2, LV), (None, 19.6, LV), ("s5", 19.6, 5.8)],
], Z0)

# ── 재질 (빛나는 표시) ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "pulse": E("a_pulse", "#39C6B6", 2.0),
    "warn": E("a_warn", "#FF8A00", 1.3),
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


# ① 입고 · 격리 검사 — 열화상 빛이 팩을 훑고 뜨거운 곳(주황)을 찾으면, 화면에 표시되고 그 팩은 주황 점선을 따라 격리함으로(경고등)
U1, V1 = 3.2, 6.5
ZL1 = Z0 + 0.14 + 0.42 + 0.01
s1_scan = add(lambda: box(0.06, 1.8, 0.02, 0, 0, 0, MA["scan"], "a", bevel=0.01))
s1_hot = add(lambda: box(0.4, 0.4, 0.012, U1 + 0.5, V1 + 0.35, ZL1, MA["warn"], "a", bevel=0.01))
SU1, SV1 = U1 + 2.1, V1 - 0.6
s1_scr = add(lambda: box(0.16, 0.015, 0.16, SU1 + 0.12, SV1 + 0.117, Z0 + 1.28, MA["warn"], "a", bevel=0.01))
QPATH = [(2.6, LV - 0.3, Z0 + 0.12), (2.6, 3.4, Z0 + 0.12), (2.6, 2.6, Z0 + 0.9)]
s1_dot = add(lambda: sphere(0.08, MA["warn"]))
s1_lamp = add(lambda: cyl(0.105, 0.15, 2.6 - 0.7, 2.4 - 0.5, Z0 + 1.2, MA["warn"], "a", seg=24))


def pose_s1(f):
    x = lerp(U1 - 1.6, U1 + 1.6, seg(f, 1, 12))
    s1_scan[0].location = L(x, V1, ZL1 + 0.02)
    show(s1_scan, 1 <= f <= 12)
    show(s1_hot, f >= 7)
    show(s1_scr, f >= 9)
    y = seg(f, 14, 22)
    s1_dot[0].location = L(*along(QPATH, y))
    show(s1_dot, 14 <= f <= 22)
    show(s1_lamp, (23 <= f < 26) or f >= 28)  # 느리게 두 번, 끝은 켜진 채
    return s1_scan + s1_hot + s1_scr + s1_dot + s1_lamp


# ② 방전 — 팩에서 캐비닛으로 전기가 빠져나가고(케이블 빛), 잔량 표시가 위에서부터 꺼진 뒤 상태등이 청록
U2, V2 = 8.2, 2.4
CABLES = [[(pu, V2 + 3.3, Z0 + 0.55), (pu, V2 + 2.4, Z0 + 1.3), (pu + 0.1, V2 + 1.2, Z0 + 1.3), (pu + 0.1, V2 + 0.56, Z0 + 0.9)] for pu in (U2 - 0.8, U2 + 1.0)]
s2_pulse = [(c, j, add(lambda: sphere(0.065, MA["pulse"]))) for c in range(2) for j in range(3)]
s2_lvl = [(k, j, add(lambda: box(0.5, 0.02, 0.08, U2 - 0.9 + k * 0.9, V2 + 0.575, Z0 + 0.45 + j * 0.16, MA["ok"], "a", bevel=0.005))) for k in range(3) for j in range(4)]
s2_led = [lamp(U2 - 0.9 + k * 0.9, V2 + 0.6, Z0 + 1.1, MA["ok"], r=0.055) for k in range(3)]


def pose_s2(f):
    vis = []
    for c, j, objs in s2_pulse:
        x = f / 12 - j * 0.33
        show(objs, 0 <= x <= 1 and f < 24)
        objs[0].location = L(*along(CABLES[c], min(max(x, 0), 1)))
        vis += objs
    for k, j, objs in s2_lvl:
        show(objs, f < 6 + (3 - j) * 5 + k)  # 위 칸부터 하나씩 꺼짐
        vis += objs
    for k, objs in enumerate(s2_led):
        show(objs, f >= 26 + k)
        vis += objs
    return vis


# ③ 전압 반등 확인 — 화면 막대가 기준선 아래로 내려갔다가 다시 올라옴(주황), 되살아난 모듈 하나는 주황 표시(다시 방전), 나머지는 청록
U3, V3 = 12.8, 6.6
KU, KV = U3 + 2.2, V3 - 0.6
ZS = Z0 + 1.1  # 화면 아래
s3_line = add(lambda: box(0.7, 0.012, 0.012, KU, KV + 0.167, ZS + 0.2, MA["wave"], "a", bevel=0))
s3_bar = add(lambda: box(0.16, 0.012, 1.0, 0, 0, 0, MA["ok"], "a", bevel=0))
s3_bar_w = add(lambda: box(0.16, 0.012, 1.0, 0, 0, 0, MA["warn"], "a", bevel=0))
ZM3 = [Z0 + 0.35 + k * 0.6 + 0.3 for k in range(2)]
s3_tag = []
for k in range(2):
    for i in range(3):
        m = MA["warn"] if (i, k) == (1, 1) else MA["ok"]
        s3_tag.append((i, k, add(lambda: box(0.2, 0.2, 0.012, U3 - 0.8 + i * 0.8, V3 + 0.12, ZM3[k], m, "a", bevel=0.01))))


def bar(objs, h):
    o = objs[0]
    h = max(0.005, h)
    o.dimensions = (0.012, 0.16, h)  # Blender x = v, y = u
    o.location = L(KU - 0.2, KV + 0.167, ZS + 0.04 + h / 2)


def pose_s3(f):
    show(s3_line, True)
    if f <= 12:
        h = lerp(0.42, 0.1, seg(f, 1, 10))
        bar(s3_bar, h)
        show(s3_bar, True)
        show(s3_bar_w, False)
    else:
        h = lerp(0.1, 0.26, seg(f, 14, 22))  # 쉬는 동안 다시 올라옴 — 기준선(0.2)을 넘음
        bar(s3_bar_w, h)
        show(s3_bar_w, True)
        show(s3_bar, False)
    vis = s3_line + s3_bar + s3_bar_w
    for i, k, objs in s3_tag:
        show(objs, f >= 22 + i + k * 2)
        vis += objs
    return vis


# ④ 안전 보관 — 칸마다 온도 감지등이 차례로 확인(두 번 훑음)하고, 보관 중인 팩 상태가 청록
U4, V4 = 17.2, 2.2
s4_temp = [lamp(U4 - 1.6 + k * 1.6, V4 - 0.755, Z0 + 1.35, MA["ok"], r=0.065) for k in range(3)]
s4_pack = [add(lambda: box(0.3, 0.02, 0.1, U4 - 1.6 + k * 1.6, V4 + 0.54, Z0 + 0.1 + 0.12, MA["ok"], "a", bevel=0.01)) for k in range(3)]


def pose_s4(f):
    vis = []
    for k, objs in enumerate(s4_temp):
        sweep = any(t0 + k * 3 <= f < t0 + k * 3 + 3 for t0 in (2, 12))
        show(objs, sweep or f >= 22)
        vis += objs
    for k, objs in enumerate(s4_pack):
        show(objs, f >= 22 + k * 2)
        vis += objs
    return vis


# ⑤ 운송 포장 — 용기 표시가 켜지고(청록: 일반 · 주황: 손상 배터리 별도 표시), 트럭 짐칸에 적재 완료 표시
U5, V5 = 20.4, 6.6
TU, TV = 22.6, 7.2
s5_lab = [
    add(lambda: box(0.5, 0.02, 0.3, U5 - 0.7, V5 + 0.575, Z0 + 0.35, MA["ok"], "a", bevel=0.01)),            # 일반 용기: 앞면 표시
    add(lambda: box(0.6, 0.6, 0.012, U5 + 0.8, V5, Z0 + 0.98, MA["warn"], "a", bevel=0.01)),               # 손상 배터리 용기: 뚜껑 위 표시 (앞면은 트럭에 가려짐)
]
s5_truck = add(lambda: box(0.02, 2.2, 0.08, TU + 0.665, TV + 0.3, Z0 + 1.45, MA["ok"], "a", bevel=0.005))


def pose_s5(f):
    vis = []
    for i, objs in enumerate(s5_lab):
        show(objs, f >= 4 + i * 6)
        vis += objs
    show(s5_truck, f >= 20)
    return vis + s5_truck


DEFS = {
    "s1": dict(n=32, pose=pose_s1, bb=(1.4, 5.8, 1.6, 7.6, Z0 + 0.1, Z0 + 1.6)),
    "s2": dict(n=30, pose=pose_s2, bb=(6.9, 9.6, 2.9, 5.8, Z0 + 0.4, Z0 + 1.5)),
    "s3": dict(n=30, pose=pose_s3, bb=(11.8, 15.4, 6.0, 6.8, Z0 + 0.6, Z0 + 1.7)),
    "s4": dict(n=30, pose=pose_s4, bb=(15.3, 19.1, 1.3, 2.8, Z0 + 0.1, Z0 + 1.5)),
    "s5": dict(n=28, pose=pose_s5, bb=(19.6, 23.4, 6.3, 8.7, Z0 + 0.3, Z0 + 1.6)),
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
