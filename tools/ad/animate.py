"""로봇 해체 셀 — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입구 → ① 비전 스캔 → ② 나사 풀기(팔 A) → ③ 사람 협업 → ④ 모듈 꺼내기(팔 B) → ⑤ 분류 (한 줄)
로봇 팔은 실제로 움직인다: 공구 끝 경로를 정하고 매 프레임 역기구학(cell.reach)으로 관절 각도를 푼다.
팔 A · 팔 B · 집히는 모듈은 클린 배경(팔을 뺀 영역)을 다시 렌더하고, 멈춰 있을 때는 제자리 모습(rest)을 얹는다.
움직임은 설명용이며 실제 설비 동작 · 속도와 다르다.
python animate.py out=anim [only=dry,coords,plate,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import bpy, bmesh
from mathutils import Vector
import cell as CL
import plant as PL
import scene as S
from plant import box, cyl, L
from motion_kit import Kit, lerp, seg, new_objs, along, mover

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,plate,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0 = CL.Z0
LV = CL.LV

K = Kit(CL.build)
sc = K.sc
ARM_A = CL.ARMS["armA"]["objs"]
ARM_B = CL.ARMS["armB"]["objs"]
MOD = CL.MOD_PICK["objs"]
move_mod = mover(MOD)
MU, MV, MZ = CL.MOD_PICK["at"]          # 집히는 모듈 바닥 중심
MTOP = MZ + 0.3

# ── 흐름선: 입구 → ①②③④ → ⑤ (한 줄) ──
K.routes([
    [("cin", 0.8, LV), ("s1", 3.6, LV), ("s2", 8.6, LV), ("s3", 13.2, LV), ("s4", 17.6, LV), (None, 21.9, LV), ("s5", 21.9, 6.6)],
], Z0)

# ── 재질 (빛나는 표시) ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "warn": E("a_warn", "#FF8A00", 1.3),
    "scan": E("a_scan", "#6F8CFF", 2.2),
    "beam": E("a_beam", "#FF5A4E", 1.6),
    "blue": E("a_blue", "#5B7CFA", 1.6),
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


def track(keys, f):
    """keys: [(프레임, (u, v, z)), ...] — 이웃한 두 점 사이를 부드럽게 잇는다"""
    if f <= keys[0][0]:
        return keys[0][1]
    for (fa, pa), (fb, pb) in zip(keys, keys[1:]):
        if fa <= f <= fb:
            x = seg(f, fa, fb) if fb > fa else 1
            return tuple(lerp(pa[i], pb[i], x) for i in range(3))
    return keys[-1][1]


REST_A = (8.6 + 0.4, 6.0 - 0.5, Z0 + 1.9)   # cell.s2_unscrew 쉬는 자세와 같게
REST_B = (17.6 + 1.0, 6.0 - 0.3, Z0 + 1.9)  # cell.s4_pick 쉬는 자세와 같게


def reset_all():
    CL.reach("armA", *REST_A)
    CL.reach("armB", *REST_B)
    move_mod(0, 0, 0)


# ① 비전 스캔 — 위 카메라 빛이 팩을 훑으며 나사 자리를 찾고(파란 표시), 화면에 같은 자리가 뜬 뒤 청록 확인
U1, V1 = 3.4, 6.0
ZT1 = Z0 + 0.5 + 0.42
SCREWS1 = [(U1 - 1.1 + i * 1.1, V1 + j * 0.78) for j in (-1, 1) for i in range(3)]
s1_scan = add(lambda: box(0.06, 1.8, 0.02, 0, 0, 0, MA["scan"], "a", bevel=0.01))
s1_mark = [(u, add(lambda: box(0.2, 0.2, 0.012, u, v, ZT1 + 0.002, MA["scan"], "a", bevel=0.01))) for u, v in SCREWS1]
s1_cam = add(lambda: box(0.012, 0.1, 0.1, 4.1 + 0.137, V1, Z0 + 2.05, MA["scan"], "a", bevel=0.005))
SCU, SCV, SCZ = 3.6 + 2.2, 6.0 + 0.52, Z0 + 1.15
s1_scr = [add(lambda: box(0.09, 0.012, 0.09, SCU - 0.18 + i * 0.18, SCV, SCZ + 0.08 + (j + 1) * 0.11, MA["scan"], "a", bevel=0.005)) for j in (0, 1) for i in range(3)]
s1_ok = add(lambda: box(0.5, 0.012, 0.05, SCU, SCV, SCZ + 0.04, MA["ok"], "a", bevel=0.005))


def pose_s1(f):
    x = lerp(U1 - 1.6, U1 + 1.6, seg(f, 1, 16))
    s1_scan[0].location = L(x, V1, ZT1 + 0.012)
    show(s1_scan, 1 <= f <= 16)
    show(s1_cam, 1 <= f <= 16 and f % 4 < 2 or f >= 24)
    vis = s1_scan + s1_cam
    for u, objs in s1_mark:
        show(objs, f >= 1 and x >= u)
        vis += objs
    for k, objs in enumerate(s1_scr):
        show(objs, f >= 17 + k)
        vis += objs
    show(s1_ok, f >= 25)
    return vis + s1_ok


# ② 나사 풀기 — 팔 A가 나사 여섯 개를 차례로 찾아가 풀고(청록 표시), 제자리로 돌아감
U2, V2 = 8.6, 6.0
ZS2 = Z0 + 0.97 + 0.03                   # 나사 머리 윗면
SCREWS2 = [(U2 - 1.1 + i * 1.1, V2 - 0.78) for i in range(3)] + [(U2 + 1.1 - i * 1.1, V2 + 0.78) for i in range(3)]
s2_done = [add(lambda: cyl(0.11, 0.012, u, v, ZS2 - 0.012, MA["ok"], "a", seg=24)) for u, v in SCREWS2]
KA = [(0, REST_A)]
DONE_AT = []
t = 5
for k, (u, v) in enumerate(SCREWS2):
    KA += [(t, (u, v, ZS2 + 0.3)), (t + 1, (u, v, ZS2)), (t + 2, (u, v, ZS2)), (t + 3, (u, v, ZS2 + 0.3))]
    DONE_AT.append(t + 2)
    t += 6
KA.append((t + 4, REST_A))
N2 = t + 6


def pose_s2(f):
    CL.reach("armA", *track(KA, f))
    vis = list(ARM_A)
    for k, objs in enumerate(s2_done):
        show(objs, f >= DONE_AT[k])
        vis += objs
    return vis


# ③ 사람 협업 — 라이트 커튼이 켜지고 상태등이 주황(사람 작업 중 · 로봇 대기), 고전압 커넥터를 사람이 떼어 분류함에 넣으면 청록
U3, V3 = 13.2, 6.0
s3_beam = [add(lambda: box(3.7, 0.015, 0.015, U3, V3 + 1.7, Z0 + 0.3 + k * 0.35, MA["beam"], "a", bevel=0)) for k in range(4)]
s3_lamp_w = add(lambda: cyl(0.085, 0.03, U3 + 1.9, V3 + 1.745, Z0 + 1.66, MA["warn"], "a", axis="v", seg=24))
s3_lamp_ok = add(lambda: cyl(0.085, 0.03, U3 + 1.9, V3 + 1.745, Z0 + 1.66, MA["ok"], "a", axis="v", seg=24))
CU = U3 - 0.1 + 1.58
s3_conn = add(lambda: box(0.24, 0.36, 0.2, CU, V3, Z0 + 0.6 + 0.06, MA["warn"], "a", bevel=0.03))
s3_bin = add(lambda: box(0.2, 0.1, 0.07, U3 + 2.2 + 0.2, V3 + 0.9 + 0.1, Z0 + 0.12, MA["warn"], "a", bevel=0.01))


def pose_s3(f):
    vis = []
    for k, objs in enumerate(s3_beam):
        show(objs, f >= 1 + k)
        vis += objs
    show(s3_lamp_w, 5 <= f < 22)
    show(s3_lamp_ok, f >= 22)
    show(s3_conn, 7 <= f < 17 and (f - 7) % 4 < 2)   # 두 번 깜빡: 떼어 낼 곳
    show(s3_bin, f >= 17)
    return vis + s3_lamp_w + s3_lamp_ok + s3_conn + s3_bin


# ④ 모듈 꺼내기 — 팔 B가 모듈을 집어 컨베이어에 올리고, 컨베이어가 재사용(청록) 통으로 보냄
CVU, CVV, CVZ = 21.9, 4.6, Z0 + 0.56     # 컨베이어 가운데 · 벨트 윗면
PU0 = CVU - 1.6                          # 모듈을 내려놓는 자리
BIN_U, BIN_V = CVU, CVV + 1.3            # 재사용 통 (가운데)
KB = [(0, REST_B),
      (7, (MU, MV, MTOP + 0.45)), (10, (MU, MV, MTOP)), (11, (MU, MV, MTOP)),
      (15, (MU, MV, MTOP + 0.6)), (24, (PU0, CVV, CVZ + 0.3 + 0.6)), (27, (PU0, CVV, CVZ + 0.3)), (28, (PU0, CVV, CVZ + 0.3)),
      (30, (PU0, CVV, CVZ + 0.3 + 0.5)), (36, REST_B)]
MPATH = [(PU0, CVV, CVZ), (BIN_U, CVV, CVZ), (BIN_U, CVV + 0.75, CVZ), (BIN_U, BIN_V, Z0 + 0.06)]
s4_led = add(lambda: cyl(0.06, 0.03, CVU + 2.0, CVV + 0.46, Z0 + 0.3, MA["ok"], "a", axis="v", seg=20))
N4 = 46


def pose_s4(f):
    tip = track(KB, f)
    CL.reach("armB", *tip)
    if 11 <= f < 28:                         # 집고 있는 동안: 모듈 윗면이 공구 끝에
        u, v, z = tip[0], tip[1], tip[2] - 0.3
    elif f >= 28:
        x = seg(f, 29, 39) * 0.72 + seg(f, 39, 44) * 0.28
        u, v, z = along(MPATH, x)
    else:
        u, v, z = MU, MV, MZ
    move_mod(u - MU, v - MV, z - MZ)
    show(s4_led, 29 <= f <= 39 and f % 4 < 2)
    return list(ARM_B) + list(MOD) + s4_led


# ⑤ 분류 — 세 통 표시가 차례로 켜지고(재제조 파랑 · 재사용 청록 · 재활용 주황), 모듈이 든 재사용 통이 두 번 깜빡
U5, V5 = CVU, CVV
s5_lab = [add(lambda: box(0.92, 0.012, 0.1, U5 - 1.2 + k * 1.2, V5 + 1.3 + 0.44, Z0 + 0.4, MA[m], "a", bevel=0.005)) for k, m in enumerate(("blue", "ok", "warn"))]


def pose_s5(f):
    vis = []
    for k, objs in enumerate(s5_lab):
        on = f >= 3 + k * 5
        if k == 1 and 16 <= f < 24:
            on = (f - 16) % 4 < 2
        show(objs, on)
        vis += objs
    return vis


BB = {
    "s1": (1.6, 6.3, 4.9, 7.0, Z0 + 0.9, Z0 + 2.2),
    "s2": (6.6, 10.6, 3.6, 7.2, Z0 + 0.2, Z0 + 3.0),
    "s3": (11.1, 15.9, 5.5, 7.9, Z0 + 0.1, Z0 + 1.8),
    "s4": (16.9, 24.1, 3.6, 7.1, Z0, Z0 + 3.0),
    "s5": (20.1, 23.7, 5.7, 6.4, Z0 + 0.35, Z0 + 0.55),
}
DEFS = {
    "s1": dict(n=30, pose=pose_s1, bb=BB["s1"]),
    "s2": dict(n=N2, pose=pose_s2, bb=BB["s2"], rest=True),
    "s3": dict(n=28, pose=pose_s3, bb=BB["s3"]),
    "s4": dict(n=N4, pose=pose_s4, bb=BB["s4"], rest=True),
    "s5": dict(n=28, pose=pose_s5, bb=BB["s5"]),
}
for d in DEFS.values():
    d["reset"] = reset_all

def max_err(d):
    """역기구학이 공구 끝을 목표에 제대로 두는지 (팔이 닿지 않으면 오차가 커짐)"""
    keys = KA if d is DEFS["s2"] else KB if d is DEFS["s4"] else None
    if keys is None:
        return 0.0
    name = "armA" if keys is KA else "armB"
    e = 0.0
    for f in range(d["n"]):
        reset_all()
        d["pose"](f)
        bpy.context.view_layer.update()
        j4 = CL.ARMS[name]["j"][3]
        tip = j4.matrix_world @ Vector((0, 0, CL.TOOL))
        e = max(e, (tip - Vector(L(*track(keys, f)))).length)
    return e


if "dry" in only:  # 렌더 없이 모든 프레임의 자세 함수를 돌리고, 움직이는 물체가 차지하는 범위를 출력
    for k, d in DEFS.items():
        lo, hi = [1e9] * 3, [-1e9] * 3
        for f in range(d["n"]):
            reset_all()
            vis = d["pose"](f)
            bpy.context.view_layer.update()
            for o in vis:
                assert hasattr(o, "hide_render"), (k, f, o)
                if o.hide_render:
                    continue
                for c in o.bound_box:
                    p = o.matrix_world @ Vector(c)
                    uvz = (p.y, p.x, p.z)
                    lo = [min(a, b) for a, b in zip(lo, uvz)]
                    hi = [max(a, b) for a, b in zip(hi, uvz)]
        print("[K] tip err", k, round(max_err(d), 4), flush=True)
        print("[K] dry", k, d["n"], "u", round(lo[0], 2), round(hi[0], 2), "v", round(lo[1], 2), round(hi[1], 2),
              "z-Z0", round(lo[2] - Z0, 2), round(hi[2] - Z0, 2), "bb", d["bb"][:4], flush=True)
    reset_all()
    print("[K] dry ok", flush=True)
if "coords" in only:
    K.save(OUT)
if "plate" in only:
    # 클린 배경: 팔 A가 없는 ② · 팔 B와 집히는 모듈이 없는 ④ / 마스크도 같은 물체를 빼고 다시
    reset_all()
    K.plate("s2", ARM_A, BB["s2"], OUT)
    K.plate("s4", ARM_B + MOD, BB["s4"], OUT)
    K.mask("s2", ARM_A, OUT)
    K.mask("s4", ARM_B + MOD, OUT)
    K.save(OUT)
if "occ" in only:
    reset_all()
    moving = ARM_A + ARM_B + MOD
    for o in moving:
        o.hide_render = True
    K.occ(OUT)
    for o in moving:
        o.hide_render = False
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
