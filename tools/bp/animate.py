"""부산물 회수 라인 — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입구 → ① 전해액 회수 → ② 파쇄 · 선별 → ③ 리튬 먼저(COOL) → ④ 니켈 · 코발트 · 망간 침출 → ⑤ 흑연 재생 (한 줄)
모든 동작이 덧그림(빛 · 액체 · 가루 · 조각)이라 클린 배경이 필요 없다. 움직임은 설명용이며 실제 설비와 다르다.
python animate.py out=anim [only=dry,coords,occ,clips] [clip=s1,...]
"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import bpy, bmesh
from mathutils import Vector
import byprod as BP
import plant as PL
import scene as S
from plant import box, cyl, L
from motion_kit import Kit, lerp, seg, new_objs, along

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0 = BP.Z0
LV = BP.LV

K = Kit(BP.build)
sc = K.sc

# ── 흐름선: 입구 → ①②③④⑤ (한 줄) ──
K.routes([
    [("cin", 0.8, LV), ("s1", 3.6, LV), ("s2", 8.9, LV), ("s3", 13.1, LV), ("s4", 17.2, LV), ("s5", 21.4, LV), (None, 22.6, LV)],
], Z0)

# ── 재질 ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "ok": E("a_ok", "#39C6B6", 1.8),
    "co2": E("a_co2", "#6F8CFF", 2.0),
    "warn": E("a_warn", "#FF8A00", 1.3),
    "elec": P("a_elec", PL.hexlin("#F6C75E"), rough=0.12, coat=0.6, emit=(PL.hexlin("#F6C75E"), 0.35)),
    "puff": P("a_puff", PL.hexlin("#FFFFFF"), rough=0.5, emit=(PL.hexlin("#EEF2FA"), 0.5)),
    "li": P("a_li", PL.hexlin("#FFFFFF"), rough=0.45, emit=(PL.hexlin("#FFFFFF"), 0.25)),
    "ni": E("a_ni", "#2BB594", 0.8),
    "co": E("a_co", "#C23D69", 0.7),
    "glow": E("a_glow", "#FF7A2E", 2.4),
    "alu": P("a_alu", PL.hexlin("#D9DDE3"), metal=0.3, rough=0.3),
    "cu": P("a_cu", PL.hexlin("#D9895B"), metal=0.3, rough=0.3),
    "bm": P("a_bm", PL.hexlin("#30343D"), rough=0.85),
    "gr": P("a_gr", PL.hexlin("#4A505C"), rough=0.7),
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


def put(o, u, v, z, s=1.0):
    o.location = L(u, v, z)
    o.scale = (s, s, s)


def pulses(path, n, m, r=0.075):
    return [add(lambda: sphere(r, m)) for _ in range(n)]


def run_pulses(objs, path, f, f0, f1, gap=0.3):
    vis = []
    for j, o in enumerate(objs):
        x = (f - f0) / max(1, f1 - f0) * (1 + gap * (len(objs) - 1)) - j * gap
        show(o, f0 <= f <= f1 and 0 <= x <= 1)
        o[0].location = L(*along(path, min(max(x, 0), 1)))
        vis += o
    return vis


# ① 전해액 회수 — CO₂(파랑)가 용기로 들어가 전해액을 녹여 나오고, 분리기에서 CO₂는 날아가며 받는 통에 호박색 전해액이 참
U1, V1 = 3.6, 5.8
P1 = [(U1 - 1.95, V1 - 0.9, Z0 + 1.62), (U1 - 1.95, V1 - 0.2, Z0 + 1.62), (U1 - 1.1, V1 - 0.2, Z0 + 1.62), (U1 - 1.1, V1 - 0.2, Z0 + 0.62),
      (U1 - 0.75, V1 - 0.2, Z0 + 0.42), (U1 - 0.3, V1 - 0.2, Z0 + 0.42), (U1 - 0.3, V1 - 0.2, Z0 + 1.92), (U1 - 0.2, V1 - 0.2, Z0 + 1.92)]
P1b = [(U1 + 0.5, V1 - 0.1, Z0 + 0.55), (U1 + 1.1, V1 - 0.3, Z0 + 0.55)]
s1_co2 = pulses(P1, 3, MA["co2"])
s1_out = pulses(P1b, 2, MA["elec"], r=0.07)
s1_lamp = add(lambda: cyl(0.065, 0.03, U1 - 1.1, V1 + 0.135, Z0 + 0.42, MA["ok"], "a", axis="v", seg=20))
s1_puff = [add(lambda: sphere(0.12, MA["puff"])) for _ in range(3)]
DU1, DV1 = U1 + 1.5, V1 + 0.75
s1_liq = add(lambda: cyl(0.285, 0.02, DU1, DV1, 0, MA["elec"], "a", seg=40))


def pose_s1(f):
    vis = run_pulses(s1_co2, P1, f, 1, 14)
    vis += run_pulses(s1_out, P1b, f, 10, 18)
    show(s1_lamp, 1 <= f <= 20 and f % 4 < 2 or f >= 24)
    for j, objs in enumerate(s1_puff):
        x = (f - 14 - j * 3) / 8
        show(objs, 0 <= x <= 1)
        put(objs[0], U1 + 1.4, V1 - 0.3, Z0 + 1.3 + 0.8 * x, 0.6 + 0.8 * max(x, 0))
        vis += objs
    h = lerp(0.06, 0.34, seg(f, 14, 26))
    s1_liq[0].location = L(DU1, DV1, Z0 + h)
    show(s1_liq, f >= 14)
    return vis + s1_lamp + s1_liq


# ② 파쇄 · 선별 — 파쇄기가 돌고, 체 위로 조각이 흘러 포일 조각(은색 · 구리색)은 앞 통에, 검은 가루는 끝 통에 쌓임
U2, V2 = 8.4, 5.8
s2_lamp = add(lambda: cyl(0.075, 0.03, U2 - 1.0, V2 + 0.71, Z0 + 0.8, MA["ok"], "a", axis="v", seg=20))
s2_bits = [add(lambda: box(0.12, 0.12, 0.08, 0, 0, 0, MA["bm"], "a", bevel=0.02)) for _ in range(4)]
FOIL = [(U2 + 0.55 + (k % 3) * 0.3, V2 + 1.05 + (k // 3) * 0.28, k) for k in range(5)]
s2_foil = [(u, v, k, add(lambda: box(0.24, 0.16, 0.02, 0, 0, 0, MA["cu"] if k % 2 == 0 else MA["alu"], "a", bevel=0, rotz=0.5 + 0.7 * k))) for u, v, k in FOIL]
s2_bm = add(lambda: box(0.98, 0.88, 1.0, 0, 0, 0, MA["bm"], "a", bevel=0.02))


def pose_s2(f):
    show(s2_lamp, f % 4 < 2 and f < 22 or f >= 22)
    vis = list(s2_lamp)
    for j, objs in enumerate(s2_bits):
        x = ((f - 2 - j * 3) % 12) / 12
        show(objs, 2 <= f < 22)
        put(objs[0], U2 - 0.1 + 2.0 * x, V2 - 0.2 + 0.13 * j, Z0 + 0.8)
        vis += objs
    for u, v, k, objs in s2_foil:
        t0 = 5 + k * 3
        x = seg(f, t0, t0 + 3)
        show(objs, f >= t0)
        put(objs[0], u, v, Z0 + 0.1 + k * 0.03 + 0.7 * (1 - x))
        vis += objs
    h = lerp(0.2, 0.42, seg(f, 6, 26))
    o = s2_bm[0]
    o.scale = (1, 1, h)
    o.location = L(U2 + 2.4, V2, Z0 + 0.05 + h / 2)
    show(s2_bm, f >= 6)
    return vis + s2_bm


# ③ 리튬 먼저 — CO₂가 오토클레이브로 들어가고 압력계가 주황(고압 · 고온), 흘러나온 액에서 흰 탄산리튬이 쟁반에 쌓임
U3, V3 = 13.0, 5.8
P3 = [(U3 - 1.9, V3 - 0.8, Z0 + 1.37), (U3 - 1.9, V3 - 0.8, Z0 + 1.92), (U3, V3 - 0.1, Z0 + 1.92), (U3, V3 - 0.1, Z0 + 1.77)]
P3b = [(U3 + 1.1, V3 + 0.2, Z0 + 0.74), (U3 + 1.8, V3 + 0.2, Z0 + 0.74), (U3 + 1.8, V3 + 0.55, Z0 + 0.44)]
s3_co2 = pulses(P3, 3, MA["co2"])
s3_out = pulses(P3b, 2, MA["li"], r=0.07)
s3_dial = add(lambda: cyl(0.1, 0.02, U3 + 1.0, V3 + 0.94, Z0 + 1.2, MA["warn"], "a", axis="v", seg=24))
TU3, TV3 = U3 + 2.1, V3 + 0.7
s3_pile = add(lambda: S.obj_from(S.cyl_mesh(0.34, 0.3, 32, 0.04), L(TU3, TV3, Z0 + 0.2), MA["li"], "pile", (0, 0, 0), "a"))
s3_ok = add(lambda: cyl(0.06, 0.03, U3 + 1.0, V3 + 0.94, Z0 + 0.9, MA["ok"], "a", axis="v", seg=20))


def pose_s3(f):
    vis = run_pulses(s3_co2, P3, f, 1, 10)
    show(s3_dial, 7 <= f < 20 and (f - 7) % 4 < 3)
    vis += s3_dial
    vis += run_pulses(s3_out, P3b, f, 14, 22)
    k = max(0.05, seg(f, 17, 28))
    o = s3_pile[0]
    o.scale = (0.5 + 0.5 * k, 0.5 + 0.5 * k, k)
    o.location = L(TU3, TV3, Z0 + 0.05 + 0.15 * k)
    show(s3_pile, f >= 17)
    show(s3_ok, f >= 26)
    return vis + s3_pile + s3_ok


# ④ 니켈 · 코발트 · 망간 침출 — 두 침출조의 용액 색이 차례로 바뀌고(니켈 초록 · 코발트 분홍), 청록 배관으로 03 재활용 공정에 넘어감
U4, V4 = 17.2, 5.8
s4_liq = [add(lambda: cyl(0.5, 0.02, U4 - 0.7 + k * 1.4, V4, Z0 + 0.83, MA[m], "a", seg=48)) for k, m in enumerate(("ni", "co"))]
P4 = [(U4 + 0.7, V4 - 0.5, Z0 + 0.98), (U4 + 0.7, V4 - 2.1, Z0 + 0.98)]
s4_out = pulses(P4, 3, MA["ok"])
s4_bub = [add(lambda: sphere(0.045, MA["puff"])) for _ in range(6)]


def pose_s4(f):
    vis = []
    for k, objs in enumerate(s4_liq):
        show(objs, f >= 4 + k * 6)
        vis += objs
    for j, objs in enumerate(s4_bub):
        k = j % 2
        x = ((f + j * 4) % 10) / 10
        show(objs, 2 <= f <= 22)
        put(objs[0], U4 - 0.7 + k * 1.4 + 0.25 * ((j * 0.37) % 1 - 0.5), V4 + 0.25 * ((j * 0.61) % 1 - 0.5), Z0 + 0.86 + 0.02 * x, 0.6 + 0.6 * x)
        vis += objs
    vis += run_pulses(s4_out, P4, f, 14, 26)
    return vis


# ⑤ 흑연 재생 — 산 세척조에 거품, 열분해로 창이 달아오르고 배기 처리탑 위로 김(바인더가 분해된 가스를 씻어 냄), 재생 흑연이 통에 쌓임
U5, V5 = 21.4, 5.8
s5_bub = [add(lambda: sphere(0.045, MA["puff"])) for _ in range(4)]
s5_win = add(lambda: box(0.86, 0.02, 0.22, U5, V5 + 0.535, Z0 + 0.34, MA["glow"], "a", bevel=0.01))
s5_puff = [add(lambda: sphere(0.14, MA["puff"])) for _ in range(3)]
s5_gr = add(lambda: box(0.88, 0.78, 1.0, 0, 0, 0, MA["gr"], "a", bevel=0.02))
s5_ok = add(lambda: cyl(0.06, 0.03, U5 + 1.9, V5 + 0.975, Z0 + 0.3, MA["ok"], "a", axis="v", seg=20))


def pose_s5(f):
    vis = []
    for j, objs in enumerate(s5_bub):
        x = ((f + j * 3) % 8) / 8
        show(objs, 1 <= f <= 9)
        put(objs[0], U5 - 1.8 + 0.2 * ((j * 0.37) % 1 - 0.5), V5 + 0.2 + 0.2 * ((j * 0.61) % 1 - 0.5), Z0 + 0.63 + 0.02 * x, 0.6 + 0.5 * x)
        vis += objs
    show(s5_win, 6 <= f <= 22)
    vis += s5_win
    for j, objs in enumerate(s5_puff):
        x = (f - 10 - j * 4) / 10
        show(objs, 0 <= x <= 1)
        put(objs[0], U5 + 0.6, V5 - 1.3, Z0 + 2.6 + 0.9 * x, 0.6 + 0.9 * max(x, 0))
        vis += objs
    h = lerp(0.1, 0.3, seg(f, 18, 28))
    o = s5_gr[0]
    o.scale = (1, 1, h)
    o.location = L(U5 + 1.9, V5 + 0.5, Z0 + 0.05 + h / 2)
    show(s5_gr, f >= 18)
    show(s5_ok, f >= 27)
    return vis + s5_gr + s5_ok


BB = {
    "s1": (1.3, 5.6, 4.7, 7.2, Z0, Z0 + 2.3),
    "s2": (7.2, 11.4, 5.2, 7.4, Z0, Z0 + 1.1),
    "s3": (10.9, 15.6, 4.8, 7.2, Z0, Z0 + 2.1),
    "s4": (15.8, 18.5, 3.5, 6.5, Z0 + 0.8, Z0 + 1.2),
    "s5": (19.3, 23.9, 4.2, 7.0, Z0 + 0.1, Z0 + 3.9),
}
DEFS = {
    "s1": dict(n=32, pose=pose_s1, bb=BB["s1"]),
    "s2": dict(n=30, pose=pose_s2, bb=BB["s2"]),
    "s3": dict(n=30, pose=pose_s3, bb=BB["s3"]),
    "s4": dict(n=28, pose=pose_s4, bb=BB["s4"]),
    "s5": dict(n=30, pose=pose_s5, bb=BB["s5"]),
}

if "dry" in only:  # 렌더 없이 모든 프레임의 자세 함수를 돌리고, 보이는 물체가 차지하는 범위를 출력
    for k, d in DEFS.items():
        lo, hi = [1e9] * 3, [-1e9] * 3
        for f in range(d["n"]):
            for o in extra:
                o.hide_render = True
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
        print("[K] dry", k, d["n"], "u", round(lo[0], 2), round(hi[0], 2), "v", round(lo[1], 2), round(hi[1], 2),
              "z-Z0", round(lo[2] - Z0, 2), round(hi[2] - Z0, 2), "bb", d["bb"], flush=True)
    print("[K] dry ok", flush=True)
if "coords" in only:
    K.save(OUT)
if "occ" in only:
    K.occ(OUT)
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
