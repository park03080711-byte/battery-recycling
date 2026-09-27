"""업사이클링 지도 — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입고 → ① 해체 · 선별 → 갈림점 → ② 촉매 · ③ 흐름전지 · ④ PET 전극 · ⑤ 흑연 음극 · ⑥ 광열 촉매 (한 갈래씩)
각 설비는 논문 속 실험 장치를 단순화한 것이고, 움직임도 설명용이다.
python animate.py out=anim [only=coords,plate,occ,clips] [clip=s1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import bpy, bmesh
import lab as LB
import plant as PL
import scene as S
from plant import box, cyl, ring, L
from motion_kit import Kit, lerp, seg, new_objs, along

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,plate,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0 = LB.Z0

K = Kit(LB.build)
sc = K.sc

# ── 흐름선: 입고 → ① → 갈림점, 그리고 다섯 갈래 (바닥 점선을 그대로 따라감) ──
FORK = ("fork", 10.3, 5.2)
K.routes([
    [("cin", 4.0, 5.2), ("s1", 5.6, 5.2), (None, 9.0, 5.2), FORK],
    [FORK, (None, 10.2, 5.2), (None, 10.2, 2.2), ("d1", 11.2, 2.2)],
    [FORK, (None, 15.4, 5.2), (None, 15.4, 2.2), ("d2", 16.0, 2.2)],
    [FORK, (None, 10.4, 5.2), (None, 10.4, 7.9), ("d3", 11.8, 7.9)],
    [FORK, (None, 15.6, 5.2), (None, 15.6, 7.5), ("d4", 16.4, 7.5)],
    [FORK, ("d5", 21.0, 5.2)],
], Z0)

# ── 재질 (빛나는 표시) ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "warn": E("a_warn", "#FF9F1C", 1.4),
    "pulse": E("a_pulse", "#39C6B6", 2.0),
    "blue": E("a_blue", "#6F8CFF", 1.6),
    "tag_b": E("a_tag_b", "#5B7CFA", 1.0),   # ① 통 표시줄: 양극 분말
    "slate": E("a_slate", "#6E7C96", 0.5),   # 흑연
    "tag_a": E("a_tag_a", "#FF8A00", 0.9),   # 철 케이스
    "pink": E("a_pink", "#F2A7BA", 1.4),
    "rod": E("a_rod", "#FFB347", 2.0),
    "glow": E("a_glow", "#FF7A2E", 2.2),
    "flare": E("a_flare", "#FFF1CC", 4.0),
    "beam": P("a_beam", PL.hexlin("#FFF4D6"), rough=0.6, emit=(PL.hexlin("#FFE7A3"), 1.2)),
    "li": E("a_li", "#FFFFFF", 0.6),
    "bubble": P("a_bubble", PL.hexlin("#FFF6DA"), rough=0.2, emit=(PL.hexlin("#FFF1C4"), 0.6)),
}
MAT = lambda n: bpy.data.materials.get(n)
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


# ① 해체 · 선별 — 컨베이어 위 조각(양극 분말 · 흑연 · 철 케이스)이 제 통으로 가고, 통의 표시줄이 재료 색으로 켜짐
U1, V1 = 7.2, 5.0
BELT_V, BELT_Z = V1 + 2.3, Z0 + 0.70
BINS = [(U1 - 0.8 + k * 1.0, V1 + 3.3) for k in range(3)]
CHIP = [MAT("blackmass"), MAT("graphite"), MAT("alu")]
s1_chip = []
for j in range(6):
    k = j % 3
    s1_chip.append((k, j // 3, add(lambda: box(0.16, 0.13, 0.05, 0, 0, 0, CHIP[k], "a", bevel=0.015))))
s1_tag = [add(lambda: box(0.6, 0.025, 0.09, bu, bv + 0.415, Z0 + 0.3, MA[m], "a", bevel=0.01)) for (bu, bv), m in zip(BINS, ("tag_b", "slate", "tag_a"))]


def pose_s1(f):
    vis = []
    for k, n, objs in s1_chip:
        t0 = 2 + k * 6 + n * 10
        x = seg(f, t0, t0 + 8)       # 벨트 따라 제 통 위까지
        y = seg(f, t0 + 8, t0 + 11)  # 통으로 떨어짐
        bu, bv = BINS[k]
        show(objs, t0 <= f <= t0 + 11)
        put(objs[0], lerp(U1 + 0.2, bu, x), lerp(BELT_V, bv, y), lerp(BELT_Z, Z0 + 0.42, y))
        objs[0].rotation_euler = (0, 0, k * 0.9 + f * 0.06)
        vis += objs
    for k, objs in enumerate(s1_tag):
        show(objs, f >= 13 + k * 6)
        vis += objs
    return vis


# ② 촉매 — 전극봉이 달아오르고 가열로 창이 한 번 밝게 번쩍(순간 고온 가열) → 촉매 접시가 새 촉매로 채워지고 아연-공기 전지 윗면이 켜짐
U2, V2 = 12.4, 2.3
d1_rod = [o for k in range(2) for o in add(lambda: cyl(0.065, 0.5, U2 - 0.5 + k * 1.0, V2 - 0.4, Z0 + 1.2, MA["rod"], "a", seg=12))]
d1_flash = add(lambda: box(0.9, 0.03, 0.56, U2 - 0.2, V2 + 0.725, Z0 + 0.32, MA["flare"], "a", bevel=0.01))
d1_after = add(lambda: box(0.84, 0.03, 0.52, U2 - 0.2, V2 + 0.725, Z0 + 0.34, MA["glow"], "a", bevel=0.01))
DISH = (U2 + 1.6, V2 + 0.2)
d1_cat = add(lambda: S.obj_from(S.cyl_mesh(0.31, 0.13, 30, r2=0.05), L(DISH[0], DISH[1], Z0 + 0.725), MA["ok"], "cat2", (0, 0, 0), "a"))
d1_pulse = [add(lambda: sphere(0.06, MA["pulse"])) for _ in range(2)]
TO_ZN = [(DISH[0], DISH[1], Z0 + 0.8), (DISH[0] - 0.2, DISH[1] - 0.9, Z0 + 1.0), (U2 + 0.4, V2 - 1.6, Z0 + 0.8)]
d1_zn = add(lambda: box(0.9, 0.7, 0.02, U2 + 0.4, V2 - 1.6, Z0 + 0.62, MA["ok"], "a", bevel=0.01))


def pose_d1(f):
    show(d1_rod, 2 <= f)
    show(d1_flash, 9 <= f <= 11)   # 번쩍임은 한 번만
    show(d1_after, 12 <= f <= 17)
    s = seg(f, 13, 22)
    o = d1_cat[0]
    s = max(0.05, s)
    o.scale = (1, 1, s)
    o.location = L(DISH[0], DISH[1], Z0 + 0.66 + 0.065 * s)  # 바닥부터 차오름
    show(d1_cat, f >= 13)
    vis = d1_rod + d1_flash + d1_after + d1_cat
    for j, objs in enumerate(d1_pulse):
        x = (f - 20) / 8 - j * 0.4
        show(objs, 0 <= x <= 1)
        objs[0].location = L(*along(TO_ZN, min(max(x, 0), 1)))
        vis += objs
    show(d1_zn, f >= 29)
    return vis + d1_zn


# ③ 흐름전지 — 두 탱크의 전해액이 배관을 따라 셀 스택으로, 스택 판이 차례로 켜지고, 따로 모은 리튬이 반짝임
U3, V3 = 17.6, 2.4
PIPES = [[(U3 - 1.0, V3 + dv, Z0 + 1.7), (U3 - 1.0, V3 + dv, Z0 + 1.9), (U3 + 0.9, V3 + dv, Z0 + 1.9), (U3 + 0.9, V3 + dv * 0.55, Z0 + 1.2)] for dv in (-0.9, 0.9)]
d2_pulse = [(c, j, add(lambda: sphere(0.07, MA["pink"] if c == 0 else MA["pulse"]))) for c in range(2) for j in range(3)]
d2_plate = [add(lambda: box(0.08, 0.025, 0.7, U3 + 0.55 + k * 0.12, V3 + 0.61, Z0 + 0.4, MA["ok"], "a", bevel=0.005)) for k in range(7)]
d2_li = add(lambda: S.obj_from(S.cyl_mesh(0.265, 0.285, 7, r2=0.03, smooth=False), L(U3 + 2.3, V3 + 0.8, Z0 + 0.5 + 0.14), MA["li"], "li2", (0, 0, 0.4), "a"))


def pose_d2(f):
    vis = []
    for c, j, objs in d2_pulse:
        x = f / 14 - j * 0.33
        show(objs, 0 <= x <= 1)
        objs[0].location = L(*along(PIPES[c], min(max(x, 0), 1)))
        vis += objs
    for k, objs in enumerate(d2_plate):
        show(objs, f >= 10 + k * 2)
        vis += objs
    show(d2_li, f >= 28)
    return vis + d2_li


# ④ PET 전극 — 양극 분말이 반응기로 들어가고, 반응기 화면과 가열 띠가 켜진 뒤, 롤에서 CoTPA 전극 시트가 풀려 나옴
U4, V4 = 12.8, 7.9
FEED = [(U4 - 1.3, V4 - 0.5, Z0 + 0.45), (U4 - 0.9, V4 - 0.3, Z0 + 1.6), (U4 - 0.4, V4 - 0.2, Z0 + 1.75)]
d3_pulse = [add(lambda: sphere(0.06, MA["blue"])) for _ in range(3)]
d3_screen = add(lambda: box(0.46, 0.03, 0.26, U4, V4 + 0.625, Z0 + 0.92, MA["ok"], "a", bevel=0.01))
d3_band = add(lambda: ring(0.615, 0.08, U4, V4, Z0 + 1.2, MA["glow"], "a", t=0.02))
RU, RV = U4 + 1.6, V4 - 0.2
MOF = MAT("mof")
d3_sheet = add(lambda: box(1.0, 0.6, 0.012, 0, 0, 0, MOF, "a", bevel=0))
d3_drop = add(lambda: box(0.012, 0.6, 1.0, 0, 0, 0, MOF, "a", bevel=0))


def pose_d3(f):
    vis = []
    for j, objs in enumerate(d3_pulse):
        x = f / 10 - j * 0.3
        show(objs, 0 <= x <= 1)
        objs[0].location = L(*along(FEED, min(max(x, 0), 1)))
        vis += objs
    show(d3_screen, f >= 8)
    show(d3_band, (f >= 10 and (f // 6) % 2 == 1) or f >= 22)  # 느린 깜빡임 두 번, 초당 2회 이하
    # 시트: 롤 앞에서 상자 윗면을 따라 풀려 나와 앞면으로 늘어짐 (길이 0.32 + 0.3)
    a = seg(f, 18, 26)
    b = seg(f, 26, 33)
    top = max(0.01, 0.32 * a)
    o = d3_sheet[0]
    o.scale = (1, 1, 1)
    o.dimensions = (0.6, top, 0.012)  # Blender x = v, y = u
    o.location = L(RU + 0.26 + top / 2, RV, Z0 + 0.556)
    show(d3_sheet, f >= 18)
    d = max(0.01, 0.3 * b)
    o2 = d3_drop[0]
    o2.dimensions = (0.6, 0.012, d)
    o2.location = L(RU + 0.6 + 0.006, RV, Z0 + 0.55 - d / 2)
    show(d3_drop, f >= 26)
    return vis + d3_screen + d3_band + d3_sheet + d3_drop


# ⑤ 흑연 음극 — 흑연 · 철 조각이 관상로로 들어가고, 발열부가 주황으로 달아오른 뒤, 음극 시트에 산화철 점이 하나씩 생김
U5, V5 = 18.0, 7.5
TUBE = (U5 - 1.3, V5, Z0 + 0.95)
d4_chip = []
for j in range(4):
    src = (U5 - 1.9, V5 - 0.9, Z0 + 0.45) if j % 2 == 0 else (U5 - 2.45, V5 - 0.05, Z0 + 0.08)
    d4_chip.append((j, src, add(lambda: box(0.12, 0.09, 0.06, 0, 0, 0, MAT("graphite") if j % 2 == 0 else MAT("alu"), "a", bevel=0.015))))
d4_glow = add(lambda: box(0.4, 0.03, 0.22, U5, V5 + 0.425, Z0 + 0.93, MA["glow"], "a", bevel=0.01))
d4_band = [o for du in (-0.35, 0.35) for o in add(lambda: cyl(0.415, 0.05, U5 + du, V5, Z0 + 0.95, MA["glow"], "a", axis="u", seg=40))]
SU, SV = U5 + 1.9, V5 + 0.9
d4_dot = []
for i in range(4):
    for j in range(3):
        d4_dot.append(add(lambda: cyl(0.055, 0.02, SU - 0.4 + i * 0.27, SV - 0.25 + j * 0.25, Z0 + 0.19, MA["warn"], "a", seg=12)))


def pose_d4(f):
    vis = []
    for j, s0, objs in d4_chip:
        t0 = j * 2
        x = seg(f, t0, t0 + 8)
        mid = ((s0[0] + TUBE[0]) / 2, (s0[1] + TUBE[1]) / 2, max(s0[2], TUBE[2]) + 0.35)
        p = along([s0, mid, TUBE], x)
        show(objs, t0 <= f <= t0 + 8)
        put(objs[0], *p)
        objs[0].rotation_euler = (0, 0, j * 0.8 + f * 0.08)
        vis += objs
    show(d4_glow, f >= 9)
    show(d4_band, f >= 12)
    vis += d4_glow + d4_band
    order = [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]  # 대각선으로 퍼지듯
    for n, k in enumerate(order):
        show(d4_dot[k], f >= 17 + n)
        vis += d4_dot[k]
    return vis


# ⑥ 광열 촉매 — 빛 패널에서 빛줄기가 내려오고, 반응기 속 PET 조각이 줄어들며 기포가 오르고, 단량체 병의 표시띠가 차례로 켜짐
U6, V6 = 22.2, 5.4
flakes = [o for o in sc.objects if o.get("anim") == "d5"]
assert len(flakes) == 6, len(flakes)
F_BASE = {o.name: (o.location.copy(), o.scale.copy()) for o in flakes}
d5_beam = [add(lambda: box(0.035, 0.035, 1.0, U6 + du, V6 + dv, 0, MA["beam"], "a", bevel=0)) for du, dv in ((-0.3, -0.2), (0.25, -0.3), (0.05, 0.25), (-0.2, 0.35), (0.35, 0.15))]
d5_bub = [add(lambda: sphere(0.04, MA["bubble"])) for _ in range(5)]
d5_glint = [add(lambda: cyl(0.147, 0.07, U6 - 0.5 + k * 0.4, V6 + 1.3, Z0 + 0.16, MA["ok"], "a", seg=24)) for k in range(3)]  # 병의 표시띠 (유리 안은 보이지 않으므로 겉에)
ZTOP, ZLIQ = Z0 + 2.17, Z0 + 0.72


def reset_flakes():
    for o in flakes:
        loc, s = F_BASE[o.name]
        o.location, o.scale = loc, s


def pose_d5(f):
    vis = []
    for k, objs in enumerate(d5_beam):
        # 빛줄기가 위에서 아래로 뻗음 (조금씩 어긋나게)
        x = seg(f, 1 + k, 7 + k)
        ln = max(0.02, (ZTOP - ZLIQ) * x)
        o = objs[0]
        o.dimensions = (0.035, 0.035, ln)
        o.location = (o.location.x, o.location.y, ZTOP - ln / 2)
        show(objs, 1 + k <= f <= 26)
        vis += objs
    s = 1 - 0.8 * seg(f, 8, 26)
    for o in flakes:
        loc, s0 = F_BASE[o.name]
        o.scale = (s0.x * s, s0.y * s, s0.z)
    vis += flakes
    for j, objs in enumerate(d5_bub):
        x = ((f + j * 4) % 10) / 10
        a = math.pi + j * 0.38  # 앞쪽 벽에 가리지 않는 안쪽(뒤편) 액면
        r = 0.18 + 0.1 * ((j * 0.37) % 1)
        show(objs, 8 <= f <= 28)
        put(objs[0], U6 + r * math.cos(a), V6 + r * math.sin(a), Z0 + 0.71 + 0.08 * x, 0.6 + 0.6 * x)
        vis += objs
    for k, objs in enumerate(d5_glint):
        show(objs, f >= 22 + k * 3)
        vis += objs
    return vis


def reset_all():
    reset_flakes()


DEFS = {
    "s1": dict(n=36, pose=pose_s1, bb=(5.9, 9.0, 6.7, 8.8, Z0 + 0.25, Z0 + 0.9)),
    "d1": dict(n=34, pose=pose_d1, bb=(11.4, 14.5, 0.2, 3.1, Z0 + 0.3, Z0 + 1.75)),
    "d2": dict(n=34, pose=pose_d2, bb=(15.9, 20.2, 1.4, 3.5, Z0 + 0.4, Z0 + 2.0)),
    "d3": dict(n=34, pose=pose_d3, bb=(11.4, 15.1, 7.3, 8.6, Z0 + 0.2, Z0 + 1.85)),
    "d4": dict(n=32, pose=pose_d4, bb=(15.3, 20.4, 6.5, 9.0, Z0, Z0 + 1.45)),
    "d5": dict(n=34, pose=pose_d5, bb=(21.5, 23.0, 4.8, 6.9, Z0, Z0 + 2.2), rest=True),
}
for d in DEFS.values():
    d.setdefault("reset", reset_all)

if "coords" in only:
    K.save(OUT)
if "plate" in only:
    # 클린 배경: PET 조각이 없는 반응기 / 마스크: ⑥ 설비(조각 제외)
    reset_all()
    K.plate("d5", flakes, (21.6, 22.8, 4.8, 6.0, Z0 + 0.6, Z0 + 0.8), OUT)
    K.mask("d5", flakes, OUT)
    K.save(OUT)
if "occ" in only:
    reset_all()
    K.occ(OUT)
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
