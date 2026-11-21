"""전과정평가 '두 갈래 공급망' — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 뒤 길(광산 원료) ① 광산 → ② 제련 → ③ 배 운송 → 양극재 공장,
      앞 길(재활용 원료) ④ 수거 → ⑤ 재활용 공장 → 양극재 공장, 마지막으로 ⑥ 발전 단지 → 재활용 공장(전력선).
단계마다: 그 자리의 동작(굴착기 등 · 굴뚝 연기 · 배 물살 · 트럭 등 · 침출조 빛 · 석탄 연기 → 태양광 빛)과 함께
옆 유리 '탄소 기둥'이 차오르고, 양극재 공장 지붕 위 큰 기둥(왼쪽 광산 길 · 오른쪽 재활용 길)에 그 단계 몫이 한 칸씩 쌓인다
(클립 c_*: 끝난 칸은 남음). ⑥은 재활용 길 기둥 옆에 '전력에 따라 이 사이' 괄호를 그린다.
기둥 높이는 개념이며 실제 수치가 아니다. 모든 동작이 덧그림이라 클린 배경은 필요 없다.
python animate.py out=anim [only=dry,coords,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
for d in ("rc", "rm", "tr", "ce"):
    sys.path.insert(0, os.path.join(HERE, "..", d))
import bpy, bmesh
from mathutils import Vector
import footprint as LC
import plant as PL
import scene as S
from plant import box, cyl, ring, L
from motion_kit import Kit, lerp, seg, new_objs, along

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0, VM, VR, UJ = LC.Z0, LC.VM, LC.VR, LC.UJ
HU, HV = LC.HUB

K = Kit(LC.build)
sc = K.sc

# ── 흐름선: 뒤 길 → 공장, 앞 길 → 공장, 전력선 ──
K.routes([
    [("min", 0.8, VM), ("s1", 3.0, VM), ("s2", 9.7, VM), ("s3", 16.9, VM), (None, UJ, VM), (None, UJ, HV - 0.8), (None, HU - 1.9, HV - 0.8)],
    [("rin", 0.8, VR), ("d1", 3.4, VR), ("d2", 11.0, VR), (None, UJ, VR), (None, UJ, HV + 0.8), (None, HU - 1.9, HV + 0.8)],
    [("pw", 17.0, 9.95), (None, 15.0, 9.95), ("d3", 15.0, VR + 1.5)],
], Z0)

# ── 재질 ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
COL = {"s1": "#9A8466", "s2": "#4A5675", "s3": "#2E3B5C", "d1": "#7FDCD1", "d2": "#39C6B6", "d3": "#F3B64A"}
MA = {k: P("fill_" + k, PL.hexlin(c), rough=0.4, coat=0.3, emit=(PL.hexlin(c), 0.25)) for k, c in COL.items()}
MA.update({
    "lamp": E("a_lamp", "#FFC24D", 2.4),
    "smoke": P("a_smoke", PL.hexlin("#8D95A6"), rough=0.9, alpha=0.85),
    "wake": E("a_wake", "#FFFFFF", 0.6),
    "liq": E("a_liq", "#7FDCD1", 1.6),
    "sun": E("a_sun", "#8EA6FF", 1.8),
    "amber": E("a_amber", "#F3B64A", 1.6),
})
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


# ── 단계 옆 탄소 기둥 채우기 (높이 = 기둥의 몇 할, 개념) ──
FILL = {"s1": 0.45, "s2": 1.0, "s3": 0.35, "d1": 0.06, "d2": 0.45, "d3": 0.9}
TF = {}
for key, (tu, tv) in LC.TUBES.items():
    TF[key] = add(lambda tu=tu, tv=tv, key=key: cyl(LC.TUBE_R - 0.03, 1.0, tu, tv, 0, MA[key], "a", seg=32))


def tube_fill(key, h):
    tu, tv = LC.TUBES[key]
    o = TF[key][0]
    h = max(0.002, h)
    show(TF[key], h > 0.01)
    o.scale = (1, 1, LC.TUBE_H * h)
    o.location = L(tu, tv, Z0 + 0.1 + LC.TUBE_H * h / 2)
    return TF[key]


def rise(key, f, a, b):
    return tube_fill(key, FILL[key] * seg(f, a, b))


def puffs(objs, u, v, z, f, f0, f1, dz=1.0, gap=4):
    vis = []
    for j, o in enumerate(objs):
        x = (f - f0 - j * gap) / 10
        on = f0 <= f <= f1 and 0 <= x <= 1
        show(o, on)
        put(o[0], u + 0.1 * x, v - 0.05 * x, z + dz * x, 0.7 + 0.8 * x)
        vis += o
    return vis


# ① 광산 — 굴착기 등이 깜빡이고 바가지에 광석, 기둥이 차오름
U1, V1 = 2.9, VM - 0.2
ZT1 = Z0 + 0.35 + 0.3 + 0.3 + 0.28
s1_lamp = add(lambda: cyl(0.06, 0.06, U1 - 0.5, V1 - 0.3, ZT1 + 0.54, MA["lamp"], "a", seg=16))
s1_ore = add(lambda: box(0.2, 0.24, 0.1, U1 + 0.6, V1 - 0.3, ZT1 + 0.45, MA["s1"], "a", bevel=0.03))


def pose_s1(f):
    show(s1_lamp, 1 <= f <= 20 and f % 4 < 2)
    show(s1_ore, 4 <= f <= 14)
    return s1_lamp + s1_ore + rise("s1", f, 6, 20)


# ② 제련 — 굴뚝 둘에서 연기가 오르고, 기둥이 끝까지 참
U2, V2 = 10.0, VM
s2_sm = [[add(lambda: sphere(0.17, MA["smoke"])) for _ in range(3)] for _ in range(2)]


def pose_s2(f):
    vis = []
    for i, du in enumerate((-1.2, -0.4)):
        vis += puffs(s2_sm[i], U2 + du, V2 - 0.6, Z0 + 3.55, f, 1 + i * 2, 26)
    return vis + rise("s2", f, 4, 22)


# ③ 배 운송 — 뒤로 물살이 생기고 굴뚝 연기, 기둥이 조금 참
U3, V3 = 16.9, VM
s3_wake = [add(lambda k=k: box(0.5 - k * 0.08, 0.06, 0.012, 0, 0, 0, MA["wake"], "a", bevel=0, seg=1)) for k in range(4)]
s3_sm = [add(lambda: sphere(0.12, MA["smoke"])) for _ in range(3)]


def pose_s3(f):
    vis = []
    for k, objs in enumerate(s3_wake):
        x = ((f + k * 3) % 12) / 12
        show(objs, 1 <= f <= 24)
        for o in objs:
            o.location = L(U3 - 2.1 - 0.9 * x, V3 + (0.35 if k % 2 else -0.35) * (1 + x), Z0 + 0.03)
        vis += objs
    vis += puffs(s3_sm, U3 - 1.6, V3, Z0 + 1.8, f, 1, 24, dz=0.7)
    return vis + rise("s3", f, 6, 18)


# ④ 수거 — 트럭 짐칸 팩의 단자 등이 켜지고, 기둥은 바닥만 살짝
U4, V4 = 3.4, VR
d1_lamps = [add(lambda du=du: box(0.16, 0.22, 0.04, U4 + 1.5 + du + 0.22, V4 + 1.15, Z0 + 0.8, MA["lamp"], "a", bevel=0.02)) for du in (-0.85, -0.15)]


def pose_d1(f):
    vis = []
    for k, objs in enumerate(d1_lamps):
        show(objs, f >= 3 + k * 4)
        vis += objs
    return vis + rise("d1", f, 8, 16)


# ⑤ 재활용 — 침출조 용액이 빛나고 기둥이 절반쯤
d2_liq = [add(lambda du=du: cyl(0.58, 0.02, 13.6 + du, VR - 0.15, Z0 + 1.32, MA["liq"], "a", seg=48)) for du in (-0.55, 0.9)]
d2_meter = add(lambda: box(0.5, 0.012, 0.22, 15.0, VR + 1.48, Z0 + 0.45, MA["amber"], "a", bevel=0.005, seg=1))


def pose_d2(f):
    vis = []
    for k, objs in enumerate(d2_liq):
        show(objs, f >= 2 + k * 3 and (f < 18 or f % 3 != 0))
        vis += objs
    show(d2_meter, f >= 6)
    return vis + d2_meter + rise("d2", f, 6, 20)


# ⑥ 전력 — 석탄 굴뚝 연기 동안 기둥이 높이 차고, 태양광 판이 켜지면 낮아짐 (높은 자리에 고리 표시)
U6, V6 = 18.6, 9.0
d3_sm = [add(lambda: sphere(0.13, MA["smoke"])) for _ in range(3)]
d3_sun = []
for i in range(3):
    for j in range(2):
        pu, pv = U6 + 1.0 + i * 0.75, V6 - 0.45 + j * 0.85
        d3_sun.append(add(lambda pu=pu, pv=pv: box(0.62, 0.56, 0.01, pu, pv, Z0 + 0.37, MA["sun"], "a", bevel=0, seg=1)))
for objs in d3_sun:
    objs[0].rotation_euler[0] = math.radians(-22)
TU6, TV6 = LC.TUBES["d3"]
d3_mark = add(lambda: ring(LC.TUBE_R + 0.03, 0.04, TU6, TV6, Z0 + 0.1 + LC.TUBE_H * 0.9, MA["amber"], "a", t=0.03, seg=32))


def pose_d3(f):
    vis = puffs(d3_sm, U6 - 1.5, V6 - 0.4, Z0 + 2.85, f, 1, 13, dz=0.8)
    h = FILL["d3"] * seg(f, 2, 10)
    if f > 14:
        h = FILL["d3"] * (1 - 0.8 * seg(f, 14, 22))
    for k, objs in enumerate(d3_sun):
        show(objs, f >= 14 + k)
        vis += objs
    show(d3_mark, f >= 12)
    return vis + d3_mark + tube_fill("d3", h)


# ── 양극재 공장 지붕 위 큰 기둥: 단계 몫이 한 칸씩 쌓임 (개념) ──
SEGS = {"s1": ("m", 0.0, 0.55), "s2": ("m", 0.55, 1.65), "s3": ("m", 2.2, 0.5), "d1": ("r", 0.0, 0.06), "d2": ("r", 0.06, 0.75)}
CZ = LC.col_z0()
CS = {}
for key, (c, z0, h) in SEGS.items():
    cu, cv = LC.COLS[c]
    CS[key] = add(lambda cu=cu, cv=cv, key=key: cyl(LC.COL_R - 0.04, 1.0, cu, cv, 0, MA[key], "a", seg=48))
# ⑥ 괄호: 재활용 기둥 오른쪽에 '전력에 따라' 범위 (위 끝 = 지금 칸 꼭대기, 아래 끝 = 그 1/5)
RU, RV = LC.COLS["r"]
TOP = 0.81
br = []
br.append(add(lambda: box(0.05, 0.05, TOP * 0.8, RU + 0.55, RV + 0.3, 0, MA["amber"], "a", bevel=0, seg=1)))
for zz in (TOP / 5, TOP):
    br.append(add(lambda zz=zz: box(0.24, 0.05, 0.05, RU + 0.45, RV + 0.3, CZ + zz - 0.025, MA["amber"], "a", bevel=0, seg=1)))


def col_pose(key, f, a):
    if key == "d3":
        x = seg(f, a, a + 8)
        vis = []
        o = br[0][0]
        show(br[0], f >= a)
        o.scale = (1, 1, max(0.01, x))
        o.location = L(RU + 0.55, RV + 0.3, CZ + TOP / 5 + TOP * 0.8 * x / 2)
        vis += br[0]
        for k, objs in enumerate(br[1:]):
            show(objs, f >= a + (0 if k == 0 else 8))
            vis += objs
        return vis
    c, z0, h = SEGS[key]
    cu, cv = LC.COLS[c]
    x = seg(f, a, a + 8)
    o = CS[key][0]
    show(CS[key], f >= a and x > 0.01)
    o.scale = (1, 1, max(0.002, h * x))
    o.location = L(cu, cv, CZ + z0 + h * x / 2)
    return CS[key]


def coler(key, a):
    return lambda f: col_pose(key, f, a)


BB = {
    "s1": (0.6, 6.6, 0.4, 3.6, Z0, Z0 + 1.9),
    "s2": (8.5, 12.9, 0.5, 2.5, Z0, Z0 + 4.6),
    "s3": (13.5, 20.8, 0.8, 4.7, Z0, Z0 + 2.7),
    "d1": (4.0, 6.9, 6.1, 9.3, Z0, Z0 + 1.7),
    "d2": (11.6, 15.4, 6.0, 9.5, Z0, Z0 + 1.7),
    "d3": (16.9, 21.5, 8.3, 9.9, Z0, Z0 + 3.8),
    "col": (HU - 1.25, HU + 1.45, HV - 0.55, HV + 0.45, CZ - 0.05, CZ + LC.COL_H + 0.1),
}
DEFS = {
    "s1": dict(n=30, pose=pose_s1, bb=BB["s1"]),
    "s2": dict(n=30, pose=pose_s2, bb=BB["s2"]),
    "s3": dict(n=30, pose=pose_s3, bb=BB["s3"]),
    "d1": dict(n=28, pose=pose_d1, bb=BB["d1"]),
    "d2": dict(n=30, pose=pose_d2, bb=BB["d2"]),
    "d3": dict(n=30, pose=pose_d3, bb=BB["d3"]),
}
for key, a in (("s1", 18), ("s2", 20), ("s3", 16), ("d1", 14), ("d2", 18), ("d3", 20)):
    DEFS[f"c_{key}"] = dict(n=DEFS[key]["n"], pose=coler(key, a), bb=BB["col"], step=key)

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
    # 반투명 유리 기둥은 holdout을 일부 통과해 클립마다 흐린 유리가 겹쳐 쌓이므로, 클립을 찍는 동안만 숨긴다
    # (채움은 유리 안에 있지만 덧그림이라 원래 장면의 유리 위에 그려진다. 금속 테는 그대로 가림으로 남음)
    for o in sc.objects:
        if o.type == "MESH" and o.active_material and o.active_material.name.startswith("tube_glass"):
            o.hide_render = True
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
