"""재활용 공정 지도 — 공정 재생 자료 렌더 (공통 도구 motion_kit.py 사용).

흐름: 해외 전처리 ① 방전·해체 → ② 열처리 → ③ 파쇄·선별 → 도로(트럭이 블랙매스를 싣고 달림)
     → 국내 후처리 ④ 침출 → ⑤ 정제 → ⑥ 용매추출 → ⑦ 결정화 (국내 거점에서는 빛이 배관을 따라 흐름)
python animate.py out=anim [only=coords,plate,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy, bmesh
import plant as PL
import scene as S
from plant import box, cyl, L
from motion_kit import Kit, lerp, seg, ease, new_objs, along, mover

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,plate,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0 = PL.Z0

K = Kit(PL.build)
sc = K.sc
ZR = 0.055          # 도로 윗면
ZP = Z0 + 0.12      # 국내 거점 배관 높이
T_REST, T_END = 7.6, 4.9   # 트럭: 해외 쪽 출발(정지 모습) → 국내 입고장

# ── 흐름선: 해외 거점 앞 바닥 → 도로 → 국내 거점 배관 (한 줄) ──
K.routes([[
    ("cin", 0.6, 10.25), ("s1", 1.8, 10.25), ("s2", 4.5, 10.25), ("s3", 6.9, 10.25), (None, 9.4, 10.25), (None, 9.4, 8.3),
    (None, 9.9, 8.3, ZR), (None, 12.1, 8.3, ZR), ("tr", 12.1, T_REST, ZR), (None, 12.1, T_END, ZR),
    (None, 12.1, 3.9), ("h1", 11.1, 3.3), (None, 11.1, 2.5, ZP), (None, 10.6, 2.5, ZP), ("h2", 10.6, -1.0, ZP), (None, 10.7, -1.0, ZP),
    (None, 13.2, -1.9, ZP), ("h3", 14.0, -1.9, ZP), (None, 16.7, -0.8, ZP), ("h4", 16.7, -0.1, ZP),
]], Z0)

P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "warn": E("a_warn", "#FF9F1C", 1.4),
    "pulse": E("a_pulse", "#39C6B6", 2.0),
    "glow": E("a_glow", "#FF7A2E", 2.2),
    "steam": P("a_steam", PL.hexlin("#EEF2F8"), rough=0.9, emit=(PL.hexlin("#FFFFFF"), 0.25)),
    "grain": bpy.data.materials.get("blackmass"),
    "steel": bpy.data.materials.get("steel"),
    "bubble": P("a_bubble", PL.hexlin("#DFFBF6"), rough=0.2, emit=(PL.hexlin("#BFF5EC"), 0.6)),
    "amber": bpy.data.materials.get("amber"),
    "mn": E("a_mn", "#F2BFCB", 0.9), "co": E("a_co", "#C23D69", 0.8), "ni": E("a_ni", "#2BB594", 0.8), "li": E("a_li", "#FFFFFF", 0.6),
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


def sphere(r, u, v, z, m):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    me = bpy.data.meshes.new("sph")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return S.obj_from(me, L(u, v, z), m, "sph", (0, 0, 0), "a")


def put(o, u, v, z, s=1.0):
    o.location = L(u, v, z)
    o.scale = (s, s, s)


# ① 안전 방전 · 해체 — 방전기 화면의 잔량이 줄고, 케이블로 전기가 빠져나가고, 끝나면 상태등이 청록
U1, V1 = 1.8, 8.2
CU1, CV1 = U1 + 0.25, V1 - 1.45
ZT = Z0 + 0.33
s1_level = [add(lambda: box(0.12, 0.012, 0.26, CU1 - 0.26 + k * 0.15, CV1 + 0.372, Z0 + 1.07, MA["warn"], "a", bevel=0.005)) for k in range(4)]
CABLES = [[(U1 + 0.82, V1 + dv, ZT + 0.56), (U1 + 0.9, V1 + dv - 0.25, ZT + 0.9), (CU1 + 0.55, CV1 + 0.9, Z0 + 0.2), (CU1 + 0.3, CV1 + 0.36, Z0 + 0.45)] for dv in (-0.3, 0.3)]
s1_pulse = [add(lambda: sphere(0.06, 0, 0, 0, MA["warn"])) for _ in range(4)]
s1_led = [add(lambda: box(0.11, 0.025, 0.11, CU1 - 0.28 + k * 0.2, CV1 + 0.365, Z0 + 0.695, MA["ok"], "a", bevel=0.005)) for k in range(3)]


def pose_s1(f):
    vis = []
    for k, objs in enumerate(s1_level):
        show(objs, f < 4 + (3 - k) * 4)  # 오른쪽 칸부터 하나씩 꺼짐
        vis += objs
    for n, objs in enumerate(s1_pulse):
        c, j = n // 2, n % 2
        x = f / 9 - j * 0.5 - c * 0.2
        show(objs, 0 <= x <= 1 and f < 20)
        objs[0].location = L(*along(CABLES[c], min(max(x, 0), 1)))
        vis += objs
    for k, objs in enumerate(s1_led):
        show(objs, f >= 21 + k * 2)
        vis += objs
    return vis


# ② 열처리 — 투입구가 달아오르고(느린 맥동) 굴뚝으로 증기가 피어오름
U2, V2 = 4.5, 8.0
ZC2 = Z0 + 0.8
s2_glow = add(lambda: cyl(0.4, 0.05, U2, V2 + 1.19, ZC2, MA["glow"], "a", axis="v", seg=40))
CH = (U2 - 0.15, V2 - 1.6, Z0 + 2.45)
s2_puff = [add(lambda: sphere(0.18, 0, 0, 0, MA["steam"])) for _ in range(4)]


def pose_s2(f):
    show(s2_glow, (f // 5) % 2 == 0 or f >= 24)  # 초당 2회 이하로 맥동, 끝은 켜진 채
    vis = list(s2_glow)
    for j, objs in enumerate(s2_puff):
        x = f / 14 - j * 0.3
        show(objs, 0 <= x <= 1)
        put(objs[0], CH[0] + 0.1 * x, CH[1] - 0.15 * x, CH[2] + 0.2 + 1.0 * x, 0.6 + 0.9 * x)
        vis += objs
    return vis


# ③ 파쇄 · 선별 — 컨베이어 위 조각이 흘러가고, 자력 드럼이 철 조각을 끌어올림
U3, V3 = 6.3, 8.2
# 파쇄 조각: 알루미늄 · 구리 포일 조각 (어두운 벨트 위에서 보이도록 밝은 금속)
CHIP = [bpy.data.materials.get("alu"), bpy.data.materials.get("cu")]
s3_grain = [add(lambda: box(0.15, 0.12, 0.04, 0, 0, 0, CHIP[j % 2], "a", bevel=0.015)) for j in range(6)]
s3_iron = [add(lambda: box(0.09, 0.05, 0.06, 0, 0, 0, MA["steel"], "a", bevel=0.01)) for _ in range(2)]


def pose_s3(f):
    vis = []
    for j, objs in enumerate(s3_grain):
        x = (f / 22 - j / 6) % 1.0 if f >= 0 else 0
        show(objs, f <= 26)
        put(objs[0], lerp(U3 + 0.8, U3 + 2.05, x), V3 + ((j * 37) % 5 - 2) * 0.09, Z0 + 0.665 + 0.02)
        objs[0].rotation_euler = (0, 0, j * 1.1 + f * 0.05)
        vis += objs
    for j, objs in enumerate(s3_iron):
        x = seg(f, 6 + j * 8, 12 + j * 8)
        show(objs, f >= 6 + j * 8)
        put(objs[0], U3 + 1.55 - 0.3 + 0.3 * x, V3 + (j - 0.5) * 0.3, Z0 + 0.7 + 0.06 * x)
        vis += objs
    return vis


# 트럭 이송 — 블랙매스 톤백을 실은 트럭이 국내 입고장까지 (국내 쪽을 보도록 돌려 세움)
truck = [o for o in sc.objects if o.get("anim") == "tr"]
assert len(truck) > 8, len(truck)
TU, TV0 = 12.1, 6.4
pivot = bpy.data.objects.new("truck_pivot", None)
S.link(pivot)
pivot.location = L(TU, TV0, 0)
bpy.context.view_layer.update()
for o in truck:
    mw = o.matrix_world.copy()
    o.parent = pivot
    o.matrix_world = mw


def truck_at(v):
    pivot.location = L(TU, v, 0)
    pivot.rotation_euler = (0, 0, math.pi)


def pose_tr(f):
    truck_at(lerp(T_REST, T_END, seg(f, 2, 34)))
    return truck


# ④ 침출 — 교반 날개가 돌고, 용액에서 기포가 올라옴
U4, V4 = 12.2, 2.5
blades = [o for o in sc.objects if o.get("anim") == "h1"]
assert len(blades) == 2, len(blades)
TANKS = [U4 - 0.55, U4 + 0.9]
h1_bub = []
for t in TANKS:
    for j in range(4):
        a = j * 1.7 + t
        h1_bub.append((t, a, j, add(lambda: sphere(0.05, 0, 0, 0, MA["bubble"]))))


def pose_h1(f):
    for o in blades:
        o.rotation_euler = (0, 0, f * 0.28)
    vis = list(blades)
    for t, a, j, objs in h1_bub:
        x = ((f + j * 5) % 12) / 12
        show(objs, True)
        r = 0.18 + 0.25 * ((j * 0.37) % 1)
        put(objs[0], t + r * math.cos(a + f * 0.1), V4 + r * math.sin(a + f * 0.1), Z0 + 1.32 + 0.03 * x, 0.6 + 0.6 * x)
        vis += objs
    return vis


# ⑤ 불순물 정제 — 필터 프레스에서 침전물이 떨어져 받이에 호박색 침전물이 쌓임
U5, V5 = 11.9, -1.5
h2_drop = [add(lambda: sphere(0.05, 0, 0, 0, MA["amber"])) for _ in range(3)]
h2_layer = add(lambda: box(1.44, 0.46, 0.05, U5, V5 + 0.95, Z0 + 0.23, MA["amber"], "a", bevel=0.01))


def pose_h2(f):
    vis = []
    for j, objs in enumerate(h2_drop):
        x = ((f - j * 5) % 10) / 10
        show(objs, 0 <= f - j * 5 and f < 26)
        put(objs[0], U5 - 0.5 + j * 0.5, V5 + 0.62 + 0.2 * x, Z0 + 0.45 - 0.2 * x)
        vis += objs
    s = max(0.05, seg(f, 4, 28))
    o = h2_layer[0]
    o.scale = (1, 1, s)
    o.location = L(U5, V5 + 0.95, Z0 + 0.23 + 0.025 * s)
    show(h2_layer, True)
    return vis + h2_layer


# ⑥ 용매추출 — 세 단의 유기층이 차례로 망간 → 코발트 → 니켈 색으로, 배관으로 흐름
U6, V6 = 15.7, -1.5
h3_org = [add(lambda: box(0.95, 1.01, 0.075, U6 - 1.2 + k * 1.2, V6 + 0.195, Z0 + 0.528, MA[m], "a", bevel=0.01)) for k, m in enumerate(("mn", "co", "ni"))]
H3P = [(U6 - 1.2, V6 + 0.72, Z0 + 0.55), (U6 - 1.2, V6 + 0.95, Z0 + 0.55), (U6 + 1.2, V6 + 0.95, Z0 + 0.55), (U6 + 1.2, V6 + 0.72, Z0 + 0.55)]
h3_pulse = [add(lambda: sphere(0.065, 0, 0, 0, MA["pulse"])) for _ in range(3)]


def pose_h3(f):
    vis = []
    for k, objs in enumerate(h3_org):
        show(objs, f >= 4 + k * 10)
        vis += objs
    for j, objs in enumerate(h3_pulse):
        x = f / 30 - j * 0.33
        show(objs, 0 <= x <= 1)
        objs[0].location = L(*along(H3P, min(max(x, 0), 1)))
        vis += objs
    return vis


# ⑦ 결정화 — 결정화기 위로 증기, 팔레트의 결정이 니켈 · 코발트 · 망간 · 리튬 순서로 반짝임
U7, V7 = 17.0, 1.2
TOP7 = (U7, V7 - 0.8, Z0 + 3.5)
h4_puff = [add(lambda: sphere(0.16, 0, 0, 0, MA["steam"])) for _ in range(3)]
PU, PV = U7 - 1.1, V7 + 1.5
h4_glint = []
for k, m in enumerate(("ni", "co", "mn", "li")):
    cu_ = PU - 1.08 + k * 0.72
    h4_glint.append(add(lambda: S.obj_from(S.cyl_mesh(0.285, 0.44, 7, r2=0.035, smooth=False), L(cu_, PV, Z0 + 0.2 + 0.21), MA[m], "xg", (0, 0, k * 0.5), "a")))


def pose_h4(f):
    vis = []
    for j, objs in enumerate(h4_puff):
        x = f / 14 - j * 0.35
        show(objs, 0 <= x <= 1)
        put(objs[0], TOP7[0], TOP7[1] - 0.1 * x, TOP7[2] + 0.9 * x, 0.6 + 0.9 * x)
        vis += objs
    for k, objs in enumerate(h4_glint):
        show(objs, f >= 8 + k * 5)
        vis += objs
    return vis


def reset_all():
    truck_at(TV0)
    pivot.rotation_euler = (0, 0, 0)
    for o in blades:
        o.rotation_euler = (0, 0, 0)


def reset_tr():
    truck_at(T_REST)  # 트럭 정지 모습 = 해외 쪽 출발 자리, 국내를 향함
    for o in blades:
        o.rotation_euler = (0, 0, 0)


DEFS = {
    "s1": dict(n=30, pose=pose_s1, bb=(1.3, 3.4, 6.2, 8.4, Z0 + 0.3, Z0 + 1.6)),
    "s2": dict(n=30, pose=pose_s2, bb=(3.9, 5.2, 6.1, 9.4, Z0 + 0.3, Z0 + 3.9)),
    "s3": dict(n=28, pose=pose_s3, bb=(6.9, 8.6, 7.7, 8.7, Z0 + 0.6, Z0 + 1.1)),
    "tr": dict(n=40, pose=pose_tr, bb=(11.4, 12.8, 3.9, 8.6, 0.0, 1.3), rest=True, carry=[2, 34]),
    "h1": dict(n=30, pose=pose_h1, bb=(10.8, 14.0, 1.6, 3.4, Z0 + 1.2, Z0 + 1.75), rest=True),
    "h2": dict(n=30, pose=pose_h2, bb=(10.9, 12.9, -1.1, 0.8, Z0 + 0.15, Z0 + 0.6)),
    "h3": dict(n=34, pose=pose_h3, bb=(13.9, 17.5, -1.2, -0.3, Z0 + 0.45, Z0 + 0.7)),
    "h4": dict(n=32, pose=pose_h4, bb=(14.2, 17.6, -0.3, 3.2, Z0 + 0.1, Z0 + 4.8)),
}
for k, d in DEFS.items():
    d.setdefault("reset", reset_tr)

if "coords" in only:
    K.save(OUT)
if "plate" in only:
    # 클린 배경: 트럭이 없는 도로, 날개가 없는 반응조 / 마스크: 반응조(날개 제외)
    reset_all()
    K.plate("tr", truck, (11.3, 12.9, 3.8, 8.7, 0.0, 1.3), OUT)
    K.plate("h1", blades, (10.9, 13.9, 1.7, 3.3, Z0 + 1.5, Z0 + 1.75), OUT)
    K.mask("h1", blades, OUT)
    K.save(OUT)
if "occ" in only:
    reset_all()
    for o in truck:
        o.hide_render = True
    K.occ(OUT, skip=("plat", "lane", "hp"))
    for o in truck:
        o.hide_render = False
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
