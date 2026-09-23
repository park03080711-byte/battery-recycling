"""재사용(두 번째 삶) 지도 — 공정 재생 자료 렌더 (공통 도구 tools/rc/motion_kit.py 사용).

흐름: 입고 → ① 등급 판정 → ② 재포장 → 갈림점 → ③ ESS · ④ UPS · ⑤ 가로등 · ⑥ 소형 모빌리티 (한 갈래씩)
python animate.py out=anim [only=coords,plate,occ,clips] [clip=s1,...]
"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import bpy
import yard as Y
import plant as PL
import scene as S
from plant import box, cyl, pipe, L
from motion_kit import Kit, lerp, seg, new_objs, along, mover

args = dict(a.split("=") for a in sys.argv[1:] if "=" in a)
OUT = args.get("out", "anim")
only = set(args.get("only", "coords,plate,occ,clips").split(","))
CLIP_ONLY = set(args["clip"].split(",")) if "clip" in args else None
os.makedirs(OUT, exist_ok=True)
Z0 = Y.Z0

K = Kit(Y.build)
sc = K.sc

# ── 흐름선: 입구 → ① → ② → 갈림점, 그리고 갈래 넷 ──
K.routes([
    [("cin", 4.0, 5.2), ("s1", 5.6, 5.2), (None, 9.2, 4.2), ("s2", 9.8, 4.2), (None, 13.5, 4.4), ("fork", 14.4, 4.4)],
    [("fork", 14.4, 4.4), ("d1", 20.4, 4.4), (None, 23.4, 4.4)],
    [("fork", 14.4, 4.4), ("d2", 14.4, 8.0)],
    [("fork", 14.4, 4.4), (None, 14.4, 9.8), ("d3", 16.6, 9.8)],
    [("fork", 14.4, 4.4), (None, 14.4, 9.8), (None, 19.6, 9.8), ("d4", 19.6, 8.8)],
], Z0)

# ── 재질 (빛나는 표시) ──
P = S.P
E = lambda n, c, s: P(n, PL.hexlin(c), rough=0.35, emit=(PL.hexlin(c), s))
MA = {
    "scan": E("a_scan", "#6F8CFF", 2.2),
    "ok": E("a_ok", "#39C6B6", 1.8),
    "warn": E("a_warn", "#FF9F1C", 1.4),
    "blue": E("a_blue", "#6F8CFF", 1.6),
    "pulse": E("a_pulse", "#39C6B6", 2.0),
    "sun": E("a_sun", "#FFC24A", 2.2),
    "pool": P("a_pool", PL.hexlin("#FFF1C9"), rough=0.6, emit=(PL.hexlin("#FFE7A3"), 0.7)),
    "flare": E("a_flare", "#FFE7A3", 5.0),
    "glint": P("a_glint", PL.hexlin("#5B7CFA"), rough=0.1, emit=(PL.hexlin("#8EA6FF"), 0.55)),
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


# ① 등급 판정 — 스캔 막대가 지나가면 모듈 표시가 청록(재사용) · 호박(재활용)으로 켜지고, 시험 캐비닛 불이 들어옴
U1, V1 = 7.4, 4.6
s1_scan = add(lambda: box(0.07, 1.85, 0.03, U1, V1, Z0 + 1.3, MA["scan"], "a", bevel=0.01))
s1_marks = []
for i in range(4):
    for j in range(2):
        mu, mv = U1 - 1.05 + i * 0.7, V1 - 0.42 + j * 0.84
        m = MA["ok"] if (i + j) % 3 else MA["warn"]
        s1_marks.append((mu + 0.18, add(lambda: box(0.165, 0.165, 0.05, mu + 0.18, mv + 0.22, Z0 + 1.225, m, "a", bevel=0.01))))
CU, CV = U1 - 0.2, V1 - 2.2
s1_cab = [add(lambda: box(0.135, 0.035, 0.135, CU + 0.4 + (k % 2) * 0.25, CV + 0.465, Z0 + 1.343 - (k // 2) * 0.3, MA["warn"] if k == 2 else MA["ok"], "a", bevel=0)) for k in range(4)]


def pose_s1(f):
    x = lerp(U1 - 1.5, U1 + 1.5, seg(f, 2, 20))
    s1_scan[0].location.y = x
    show(s1_scan, 2 <= f <= 20)
    vis = list(s1_scan)
    for mu, objs in s1_marks:
        show(objs, f > 2 and x >= mu)
        vis += objs
    for k, objs in enumerate(s1_cab):
        show(objs, f >= 22 + k * 2)
        vis += objs
    return vis


# ② 재포장 — 작업대 모듈이 새 함체로 들어가고, 새 BMS 기판 · 완성 유닛 표시등이 켜짐
U2, V2 = 11.6, 4.0
s2_mod = [o for o in sc.objects if o.get("anim") == "s2"]
assert len(s2_mod) == 2, len(s2_mod)
s2_move = mover(s2_mod)
REST = (U2 - 1.1 + 1.5, V2 - 0.3, Z0 + 0.55)
DEST = (U2 + 0.9, V2 + 0.2, Z0 + 0.92)
HI2 = Z0 + 1.45
s2_bms = add(lambda: box(0.52, 0.066, 0.21, U2 + 0.9, V2 - 0.33, Z0 + 1.045, MA["ok"], "a", bevel=0.01))
s2_units = [add(lambda: box(0.73, 0.066, 0.125, U2 - 0.4 + i * 0.8, V2 + 3.0, Z0 + 0.795, MA["blue"], "a", bevel=0.02)) for i in range(3)]


def pose_s2(f):
    if f <= 6:
        p = (REST[0], REST[1], lerp(REST[2], HI2, seg(f, 0, 6)))
    elif f <= 16:
        x = seg(f, 6, 16)
        p = (lerp(REST[0], DEST[0], x), lerp(REST[1], DEST[1], x), HI2)
    else:
        p = (DEST[0], DEST[1], lerp(HI2, DEST[2], seg(f, 16, 24)))
    s2_move(p[0] - REST[0], p[1] - REST[1], p[2] - REST[2])
    show(s2_bms, f >= 25)
    vis = s2_mod + s2_bms
    for i, objs in enumerate(s2_units):
        show(objs, f >= 29 + i * 3)
        vis += objs
    return vis


def reset_s2():
    s2_move(0, 0, 0)


# ③ ESS — 지붕 패널이 햇빛에 반짝이고 컨테이너 충전 표시가 차오름 / 충전소: 충전기 표시 · 케이블 빛 · 캐비닛 충전 표시
U3, V3 = 18.6, 2.6
GM = {"panel": MA["glint"], "panel_f": bpy.data.materials.get("solar_frame"), "steel": bpy.data.materials.get("steel")}
d1_glint = add(lambda: (Y.solar_strip(GM, U3 + 0.6, V3 - 0.5, Z0 + 2.762, 3, "a"), Y.solar_strip(GM, U3 + 0.6, V3 + 0.55, Z0 + 2.762, 3, "a")))
d1_level = [add(lambda: box(0.34, 0.025, 0.12, U3 - 0.85 + k * 0.42, V3 + 1.115, Z0 + 1.98, MA["ok"], "a", bevel=0.01)) for k in range(5)]
CAB = [(25.66, 5.5, Z0 + 0.6), (25.5, 5.7, Z0 + 0.3), (25.3, 5.8, Z0 + 0.55)]
d1b_chg = add(lambda: box(0.3, 0.025, 0.09, 25.9, 5.735, Z0 + 1.0, MA["ok"], "a", bevel=0.01))
d1b_pulse = [add(lambda: box(0.1, 0.1, 0.1, 0, 0, 0, MA["pulse"], "a", bevel=0.045)) for _ in range(2)]
d1b_cab = [add(lambda: box(0.4, 0.025, 0.18, 25.9, 7.565, Z0 + 0.3 + k * 0.3, MA["ok"], "a", bevel=0.01)) for k in range(3)]


def pose_d1(f):
    show(d1_glint, 1 <= f <= 9)
    vis = list(d1_glint)
    for k, objs in enumerate(d1_level):
        show(objs, f >= 8 + k * 4)
        vis += objs
    return vis


def pose_d1b(f):
    show(d1b_chg, f >= 2)
    vis = list(d1b_chg)
    for j, objs in enumerate(d1b_pulse):
        x = ((f - 4) / 10 - j * 0.5) % 1.0 if f >= 4 else -1
        show(objs, 4 <= f <= 26 and x >= 0)
        p = along(CAB, max(0.0, x))
        objs[0].location = L(*p)
        vis += objs
    for k, objs in enumerate(d1b_cab):
        show(objs, f >= 10 + k * 5)
        vis += objs
    return vis


# ④ UPS — 랙 표시등이 아래에서 위로 차례로 켜짐 (비상 전력 준비)
U4, V4 = 12.0, 8.2
d2_rows = []
for j in range(5):
    for k in range(3):
        d2_rows.append((j, k, add(lambda: box(0.62, 0.026, 0.11, U4 - 1.0 + k * 0.95, V4 - 0.128, Z0 + 0.1 + 0.395 + j * 0.28 - 0.1, MA["ok"], "a", bevel=0.005))))


def pose_d2(f):
    vis = []
    for j, k, objs in d2_rows:
        show(objs, f >= 3 + j * 5 + k)
        vis += objs
    return vis


# ⑤ 태양광 가로등 — 패널에서 기둥을 타고 배터리 함으로 빛이 내려가 표시가 차오르고, 가로등 불빛이 바닥을 비춤
U5, V5 = 16.6, 9.2
POLE = [(U5, V5, Z0 + 3.3), (U5, V5, Z0 + 1.55)]
d3_pulse = [add(lambda: box(0.13, 0.13, 0.13, 0, 0, 0, MA["sun"], "a", bevel=0.06)) for _ in range(2)]
d3_bat = [add(lambda: box(0.3, 0.025, 0.1, U5, V5 + 0.19, Z0 + 1.02 + k * 0.15, MA["ok"], "a", bevel=0.01)) for k in range(3)]
d3_pool = add(lambda: cyl(0.75, 0.004, U5 + 0.95, V5, Z0 + 0.002, MA["pool"], "a", seg=48))
d3_flare = add(lambda: box(0.54, 0.3, 0.115, U5 + 0.95, V5, Z0 + 3.293, MA["flare"], "a", bevel=0.03))


def pose_d3(f):
    vis = []
    for j, objs in enumerate(d3_pulse):
        x = (f / 8 - j * 0.5)
        show(objs, 0 <= x <= 1 and f <= 16)
        objs[0].location = L(*along(POLE, min(max(x, 0), 1)))
        vis += objs
    for k, objs in enumerate(d3_bat):
        show(objs, f >= 5 + k * 4)
        vis += objs
    show(d3_pool + d3_flare, f >= 20)
    return vis + d3_pool + d3_flare


# ⑥ 소형 모빌리티 — 충전 기둥 불이 켜지고 골프카 · 이륜차 · 휠체어의 배터리 표시가 차례로 켜짐
U6, V6 = 19.2, 8.6
d4_post = add(lambda: box(0.26, 0.025, 0.09, U6 - 1.7, V6 - 1.2 + 0.015, Z0 + 0.68, MA["ok"], "a", bevel=0.01))
d4_cart = add(lambda: box(1.0, 0.025, 0.08, U6, V6 - 0.6 + 0.565, Z0 + 0.38, MA["ok"], "a", bevel=0.01))
d4_scoot = add(lambda: box(0.5, 0.025, 0.06, U6 - 0.9, V6 + 1.2 + 0.152, Z0 + 0.3, MA["ok"], "a", bevel=0.01))
d4_chair = add(lambda: box(0.27, 0.27, 0.02, U6 + 0.9 - 0.05, V6 + 1.25, Z0 + 0.4, MA["ok"], "a", bevel=0.01))


def pose_d4(f):
    show(d4_post, (f >= 0 and f % 8 < 5) if f < 8 else True)
    show(d4_cart, f >= 9)
    show(d4_scoot, f >= 14)
    show(d4_chair, f >= 19)
    return d4_post + d4_cart + d4_scoot + d4_chair


DEFS = {
    "s1": dict(n=32, pose=pose_s1, bb=(5.6, 9.2, 2.0, 5.6, Z0 + 1.0, Z0 + 1.6)),
    "s2": dict(n=38, pose=pose_s2, bb=(10.9, 13.4, 3.2, 6.9, Z0 + 0.5, Z0 + 1.8), rest=True, reset=reset_s2),
    "d1": dict(n=30, pose=pose_d1, bb=(16.0, 21.1, 1.4, 3.8, Z0 + 1.85, Z0 + 3.2)),
    "d1b": dict(n=28, pose=pose_d1b, bb=(24.9, 26.3, 5.0, 7.8, Z0 + 0.2, Z0 + 1.2), step="d1"),
    "d2": dict(n=32, pose=pose_d2, bb=(10.6, 13.5, 7.9, 8.2, Z0 + 0.3, Z0 + 1.8)),
    "d3": dict(n=30, pose=pose_d3, bb=(15.7, 18.3, 8.3, 10.1, Z0, Z0 + 3.5)),
    "d4": dict(n=26, pose=pose_d4, bb=(17.3, 21.0, 7.1, 10.0, Z0 + 0.25, Z0 + 1.0)),
}

for d in DEFS.values():  # 다른 클립을 그릴 때 ② 모듈은 제자리
    d.setdefault("reset", reset_s2)

if "coords" in only:
    K.save(OUT)
if "plate" in only:
    K.plate("s2", s2_mod, DEFS["s2"]["bb"], OUT)
    K.mask("s2", s2_mod, OUT)
    K.save(OUT)
if "occ" in only:
    K.occ(OUT)
if "clips" in only:
    K.clips(DEFS, extra, OUT, only=CLIP_ONLY)
    K.save(OUT)
print("[K] done", flush=True)
