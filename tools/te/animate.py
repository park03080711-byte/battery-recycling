"""기술경제성 분석 '돈이 오가는 공장' — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: ① 운송 → ② 해체 → ③ 파쇄 · 블랙매스 → (꺾어서) ④ 정제 → ⑤ 판매 → ⑥ 저울.
단계마다: 그 자리의 동작(트럭 등 · 거리 표지 · 시계 바늘 · 차례로 깜빡이는 모듈 · 컨베이어 알갱이 · 침출조 빛 · 상자 빛)과 함께
옆 쟁반에 동전이 쌓인다(산호 = 비용 2 · 2 · 4 · 5개, 청록 = 수익 14개).
⑥에서는 왼쪽 접시에 비용 동전, 오른쪽 접시에 수익 동전이 모이며 보가 비용 쪽으로 기울었다가 수익 쪽으로 살짝 기운다.
동전 수와 기울기는 개념이며 실제 수치가 아니다. 저울 보는 원래 장면에서 지운 클린 배경(plate_bal) 위에 클립으로 그린다.
python animate.py out=anim [only=dry,coords,plate,occ,clips] [clip=t1,...]
"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
for d in ("rc", "rm", "tr", "ce", "lc"):
    sys.path.insert(0, os.path.join(HERE, "..", d))
import bpy
from mathutils import Vector
import money as TE
import plant as PL
import scene as S
from plant import box, cyl, L
from motion_kit import Kit, seg, new_objs

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,plate,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0, VB, VF, VROAD = TE.Z0, TE.VB, TE.VF, TE.VROAD
LB, LF, TURN = TE.LANE_B, TE.LANE_F, TE.TURN
BU, BV = TE.BAL

K = Kit(TE.build)
sc = K.sc

# ── 흐름선: 길 → 뒤 줄 → 꺾어서 앞 줄 → 저울 ──
K.routes([
    [("in", 0.4, VROAD), ("t1", TE.TRUCK_U, VROAD), (None, 7.0, VROAD), (None, 7.0, LB), ("t2", TE.BENCH[0], LB), ("t3", 14.2, LB),
     (None, TURN, LB), (None, TURN, LF), ("t4", TE.LEACH[0], LF), ("t5", TE.SELL[0], LF), (None, BU, LF), ("bal", BU, BV - 1.1)],
], Z0)

# ── 재질 ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "cost": P("coin_cost", PL.hexlin("#E0715A"), rough=0.3, coat=0.4, metal=0.2, emit=(PL.hexlin("#E0715A"), 0.25)),
    "gain": P("coin_gain", PL.hexlin("#39C6B6"), rough=0.3, coat=0.4, metal=0.2, emit=(PL.hexlin("#39C6B6"), 0.25)),
    "lamp": E("a_lamp", "#FFC24D", 2.4),
    "head": E("a_head", "#FFF3D6", 3.0),
    "liq": E("a_liq", "#7FDCD1", 1.6),
    "amber": E("a_amber", "#F3B64A", 1.6),
    "hand": P("a_hand", PL.hexlin("#1F2A44"), rough=0.4),
    "hand_r": P("a_hand_r", PL.hexlin("#E0715A"), rough=0.4),
    "grain": P("a_grain", PL.hexlin("#30343D"), rough=0.85),
    "ni": E("a_ni", "#2BB594", 1.2),
    "co": E("a_co", "#C23D69", 1.2),
    "li": E("a_li", "#FFFFFF", 0.9),
    "mn": E("a_mn", "#F2BFCB", 1.0),
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


# ── 동전 쟁반: 단계마다 동전이 하나씩 떨어져 쌓임 (개수는 개념) ──
COINS = {"t1": 2, "t2": 2, "t3": 4, "t4": 5, "t5": 14}
CN = {}
for key, n in COINS.items():
    tu, tv = TE.TRAYS[key]
    m = MA["gain" if key == "t5" else "cost"]
    CN[key] = [add(lambda tu=tu, tv=tv, m=m: cyl(TE.COIN_R, TE.COIN_H - 0.008, tu, tv, 0, m, "a", seg=40)) for _ in range(n)]


def coins(key, f, a, step=2):
    """f0 = a부터 step 프레임마다 하나씩, 2프레임 동안 떨어져 앉음"""
    tu, tv = TE.TRAYS[key]
    vis = []
    for k, objs in enumerate(CN[key]):
        t = f - (a + k * step)
        show(objs, t >= 0)
        drop = 0.25 * max(0.0, 1 - t / 2) if t >= 0 else 0
        objs[0].location = L(tu, tv, TE.tray_z0() + k * TE.COIN_H + (TE.COIN_H - 0.008) / 2 + drop)
        vis += objs
    return vis


# ① 운송 — 트럭 앞등이 켜지고 지나온 거리 표지가 차례로 빛남
TU = TE.TRUCK_U
t1_head = [add(lambda dv=dv: box(0.03, 0.16, 0.1, TU + 1.215, VROAD + dv, Z0 + 0.42, MA["head"], "a", bevel=0.01)) for dv in (-0.3, 0.3)]
t1_post = [add(lambda u=u: box(0.31, 0.012, 0.2, u, VROAD - 0.89, Z0 + 0.56, MA["lamp"], "a", bevel=0, seg=1)) for u in TE.POSTS]


def pose_t1(f):
    vis = []
    for objs in t1_head:
        show(objs, f >= 1)
        vis += objs
    for k, objs in enumerate(t1_post):
        show(objs, f >= 3 + k * 4)
        vis += objs
    return vis + coins("t1", f, 14, step=4)


# ② 해체 — 시계 바늘이 돌고(일한 시간) 모듈이 차례로 잠깐씩 표시됨
CU, CV = TE.CLOCK
CZ = TE.CLOCK_Z
hand_m = add(lambda: box(0.035, 0.012, 0.27, 0, 0, 0, MA["hand_r"], "a", bevel=0.005, seg=1))
hand_h = add(lambda: box(0.05, 0.012, 0.18, 0, 0, 0, MA["hand"], "a", bevel=0.005, seg=1))
BU2, BV2 = TE.BENCH
MODS = [(i, j) for i in range(4) for j in range(2) if (i, j) != (3, 1)]
t2_mods = []
for i, j in MODS:
    mu, mv = BU2 - 0.05 - 1.05 + i * 0.7, BV2 - 0.42 + j * 0.84
    t2_mods.append(add(lambda mu=mu, mv=mv: box(0.54, 0.68, 0.012, mu, mv, Z0 + 0.68 + 0.34 + 0.3 + 0.035, MA["amber"], "a", bevel=0, seg=1)))


def hand(objs, th, ln):
    o = objs[0]
    o.rotation_euler[0] = -th
    o.location = L(CU + ln / 2 * math.sin(th), CV + 0.11, CZ + ln / 2 * math.cos(th))
    return objs


def pose_t2(f):
    x = f / 31
    vis = hand(hand_m, 2 * math.pi * 2 * x, 0.27) + hand(hand_h, math.radians(240) + 2 * math.pi / 6 * x, 0.18)
    show(hand_m, True)
    show(hand_h, True)
    for k, objs in enumerate(t2_mods):
        show(objs, 2 + k * 3 <= f < 2 + k * 3 + 4)   # 떼어 내는 모듈만 잠깐 표시
        vis += objs
    return vis + coins("t2", f, 18, step=5)


# ③ 파쇄 — 컨베이어 위 알갱이가 흘러가 블랙매스 더미로
SU = 13.5
t3_gr = [add(lambda: PL.S.obj_from(PL.S.cyl_mesh(0.075, 0.075, 10, r2=0.0), L(0, 0, 0), MA["grain"], "grain", (0, 0, 0), "a")) for _ in range(6)]


def pose_t3(f):
    vis = []
    for k, objs in enumerate(t3_gr):
        x = ((f * 0.07 + k / 6) % 1.0)
        show(objs, 1 <= f <= 26)
        objs[0].location = L(SU + 0.8 + 1.25 * x, VB + ((k * 37) % 5 - 2) * 0.09, Z0 + 0.69)
        vis += objs
    return vis + coins("t3", f, 8, step=3)


# ④ 정제 — 침출조 용액이 빛나고 약품 드럼 등 · 배전함 계기가 켜짐
LU, LV = TE.LEACH
t4_liq = [add(lambda du=du: cyl(0.58, 0.02, LU + du, LV, Z0 + 1.32, MA["liq"], "a", seg=48)) for du in (-0.55, 0.9)]
t4_drum = [add(lambda du=du, dv=dv: cyl(0.12, 0.02, du, dv, Z0 + 0.585, MA["lamp"], "a", seg=24)) for du, dv in TE.DRUMS]
PU, PV = TE.POWER
t4_meter = add(lambda: box(0.012, 0.5, 0.22, PU + 0.24, PV, Z0 + 0.48, MA["amber"], "a", bevel=0.005, seg=1))


def pose_t4(f):
    vis = []
    for k, objs in enumerate(t4_liq):
        show(objs, f >= 2 + k * 3 and (f < 20 or f % 3 != 0))
        vis += objs
    for k, objs in enumerate(t4_drum):
        show(objs, f >= 4 + k * 2)
        vis += objs
    show(t4_meter, f >= 6)
    return vis + t4_meter + coins("t4", f, 8, step=3)


# ⑤ 판매 — 금속 상자 뚜껑이 차례로 빛나고, 수익 동전이 쌓임
SX, SY = TE.SELL
t5_top = [add(lambda key=key, du=du, dv=dv: box(0.8, 0.77, 0.012, SX + du, SY + dv, Z0 + 0.735, MA[key], "a", bevel=0, seg=1)) for key, du, dv in TE.CRATES]


def pose_t5(f):
    vis = []
    for k, objs in enumerate(t5_top):
        show(objs, f >= 1 + k * 3)
        vis += objs
    return vis + coins("t5", f, 6, step=1)


# ⑥ 저울 — 보 · 접시는 클립에서 그림(원래 장면에서는 지움). 비용 13개 → 기울고, 수익 14개 → 반대로 살짝
BEAM = {}
STACK = [(-0.24, -0.16), (0.24, -0.16), (0.0, 0.26)]
PANC = {-1: [], 1: []}
for side, n, m in ((-1, 13, MA["cost"]), (1, 14, MA["gain"])):
    for k in range(n):
        PANC[side].append(add(lambda m=m: cyl(0.17, TE.COIN_H - 0.008, 0, 0, 0, m, "a", seg=32)))
A_COST = math.radians(-6.0)
A_END = math.radians(3.0)
F_COST, F_GAIN, F_SET = 3, 18, 33
NBAL = 46


def angle(f):
    nc = min(13, max(0, f - F_COST + 1))
    ng = min(14, max(0, f - F_GAIN + 1))
    if f < F_SET:
        return A_COST * nc / 13 + (A_END - A_COST) * ng / 14
    t = f - F_SET
    return A_END + math.radians(1.6) * math.sin(0.9 * t) * math.exp(-0.25 * t)


def beam_at(a):
    key = round(a, 5)
    if key not in BEAM:
        BEAM[key] = add(lambda: TE.beam_parts(TE._M, "a", a, tag=False))
    return BEAM[key]


def pose_bal(f):
    for objs in BEAM.values():
        show(objs, False)
    a = angle(f)
    vis = list(beam_at(a))
    show(vis, True)
    for side, a0 in ((-1, F_COST), (1, F_GAIN)):
        pu, pv, pz = TE.pan_xyz(side, a)
        for k, objs in enumerate(PANC[side]):
            t = f - (a0 + k)
            show(objs, t >= 0)
            su, sv = STACK[k % 3]
            lvl = k // 3
            drop = 0.3 * max(0.0, 1 - t / 2) if t >= 0 else 0
            objs[0].location = L(pu + su, pv + sv, pz + 0.025 + lvl * TE.COIN_H + (TE.COIN_H - 0.008) / 2 + drop)
            vis += objs
    return vis


BB = {
    "t1": (0.5, 6.4, VROAD - 1.2, TE.TRAYS["t1"][1] + 0.8, Z0, Z0 + 1.0),
    "t2": (7.0, 11.3, VB - 1.5, TE.TRAYS["t2"][1] + 0.6, Z0, Z0 + 2.3),
    "t3": (13.9, 15.7, VB - 0.5, TE.TRAYS["t3"][1] + 0.6, Z0, Z0 + 0.9),
    "t4": (13.2, 19.3, VF - 0.75, TE.TRAYS["t4"][1] + 0.6, Z0, Z0 + 1.4),
    "t5": (9.6, 11.8, VF - 1.0, TE.TRAYS["t5"][1] + 0.6, Z0, Z0 + 1.4),
    "bal": (BU - TE.BEAM - 0.9, BU + TE.BEAM + 0.9, BV - 0.9, BV + 0.9, TE.bal_z() - TE.HANG - 0.6, TE.bal_z() + 0.95),
}
DEFS = {
    "t1": dict(n=26, pose=pose_t1, bb=BB["t1"]),
    "t2": dict(n=32, pose=pose_t2, bb=BB["t2"], rest=True),
    "t3": dict(n=28, pose=pose_t3, bb=BB["t3"]),
    "t4": dict(n=28, pose=pose_t4, bb=BB["t4"]),
    "t5": dict(n=26, pose=pose_t5, bb=BB["t5"]),
    "bal": dict(n=NBAL, pose=pose_bal, bb=BB["bal"], rest=True),
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
    print("[K] bal angles", [round(math.degrees(angle(f)), 2) for f in range(NBAL)], flush=True)
    print("[K] dry ok", flush=True)
if "coords" in only:
    K.save(OUT)
if "plate" in only:
    beam = [o for o in sc.objects if o.get("beam")]
    K.plate("bal", beam, BB["bal"], OUT)
    sc.render.use_border = False
if "occ" in only:
    K.occ(OUT)
if "clips" in only:
    # 원래 장면의 수평 보는 클립에서 가림(holdout)이 되어 기운 보에 구멍을 내므로 숨긴다
    for o in sc.objects:
        if o.get("beam"):
            o.hide_render = True
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
