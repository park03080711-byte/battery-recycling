"""전과정평가 — '두 갈래 공급망' 등각 장면 (Blender 5 / bpy).

같은 양극재 1 kg을 두 길로 만든다.
 뒤쪽 길(광산 원료): ① 광산 → ② 제련 → ③ 배로 먼 운송 → 양극재 공장
 앞쪽 길(재활용 원료): ④ 폐배터리 수거 → ⑤ 재활용 공장 → 양극재 공장, ⑥ 재활용 공장에 전기를 대는 발전 단지(석탄 · 태양광)
단계마다 옆에 빈 유리 '탄소 기둥'이 있고(공정 재생에서 채워짐), 가운데 오른쪽 양극재 공장 지붕 위 큰 기둥 두 개에 두 길의 합이 쌓인다.
기둥 높이는 개념이며 실제 수치가 아니다(실제 수치는 페이지 그림에).
03 공정 지도(../rc/plant.py) · 01 작업장(../rm/workshop.py) · 09 이력관리(../tr/passport.py) · 10 인증(../ce/certify.py) 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래. 배치는 설명용으로 단순화했다.
"""
import math, os, sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
for d in ("rc", "rm", "tr", "ce"):
    sys.path.insert(0, os.path.join(HERE, "..", d))
import plant as PL
import workshop as WK
import passport as TR
import certify as CE
from plant import box, cyl, open_box, ring, pipe, poly_pipe, L

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=28.8, v0=0.0, v1=10.6)
VM = 2.6          # 광산 원료가 지나는 길 (뒤)
VR = 8.0          # 재활용 원료가 지나는 길 (앞)
UJ = 22.2         # 두 길이 공장으로 꺾이는 자리
HUB = (24.7, 5.3)  # 양극재 공장
WATER = dict(u0=14.4, u1=19.4, v0=0.25, v1=4.95)
# 단계 옆 탄소 기둥 (u, v, 높이)
TUBES = {"s1": (6.3, 1.1), "s2": (12.6, 0.9), "s3": (20.4, 4.3), "d1": (6.6, 6.4), "d2": (11.9, 6.3), "d3": (21.2, 9.6)}
TUBE_H = 1.5
TUBE_R = 0.2
# 양극재 공장 지붕 위 합계 기둥
COLS = {"m": (HUB[0] - 0.8, HUB[1] - 0.1), "r": (HUB[0] + 0.8, HUB[1] - 0.1)}
COL_H = 3.0
COL_R = 0.34
HUB_ROOF = Z0 + 1.6


def mats_lc():
    M = CE.mats_ce()
    P = S.P
    M["earth"] = P("earth", PL.hexlin("#C9B79C"), rough=0.85, bump=0.3, bump_scale=30)
    M["earth2"] = P("earth2", PL.hexlin("#B39E80"), rough=0.85, bump=0.3, bump_scale=30)
    M["ore"] = P("ore", PL.hexlin("#8A7A66"), rough=0.9, bump=0.6, bump_scale=40)
    M["water"] = P("water", PL.hexlin("#9CC3F2"), rough=0.08, coat=0.9)
    M["hull"] = P("hull", PL.hexlin("#2E3B5C"), rough=0.4, coat=0.3)
    M["hull_r"] = P("hull_red", PL.hexlin("#C2563F"), rough=0.45)
    M["tube"] = P("tube_glass", PL.hexlin("#DCE6F7"), rough=0.08, coat=0.9, alpha=0.32)
    M["tube_rim"] = P("tube_rim", PL.hexlin("#AEB8C9"), metal=0.5, rough=0.35)
    M["solar"] = P("solar", PL.hexlin("#26365E"), rough=0.15, coat=0.8)
    M["coal"] = P("coal", PL.hexlin("#2F3440"), rough=0.85, bump=0.5, bump_scale=40)
    M["cool"] = P("cooling", PL.hexlin("#E3E7EE"), rough=0.6)
    M["wire"] = P("wire", PL.hexlin("#F3B64A"), rough=0.4)
    M["power"] = P("power", PL.hexlin("#F3B64A"), rough=0.35, coat=0.3)
    return M


def regroup(fn, g):
    return CE.regroup(fn, g)


# ─────────────────────────── 부품 ───────────────────────────
def tube(M, key, g):
    """빈 유리 탄소 기둥 (받침 + 유리 + 눈금 테)"""
    u, v = TUBES[key]
    cyl(TUBE_R + 0.08, 0.1, u, v, Z0, M["body2"], g, seg=32)
    cyl(TUBE_R, TUBE_H, u, v, Z0 + 0.1, M["tube"], g, seg=32)
    for k in range(1, 4):
        ring(TUBE_R + 0.005, 0.02, u, v, Z0 + 0.1 + k * TUBE_H / 4, M["tube_rim"], g, t=0.01, seg=32)
    ring(TUBE_R + 0.01, 0.05, u, v, Z0 + 0.1 + TUBE_H - 0.05, M["tube_rim"], g, t=0.02, seg=32)


def truck(M, u, v, g, load="bag"):
    """u 방향으로 달리는 작은 트럭 (짐: 톤백 / 팩)"""
    z = Z0
    for du in (-0.7, 0.5):
        for dv in (-0.42, 0.42):
            cyl(0.2, 0.14, u + du, v + dv, z + 0.2, M["rubber"], g, axis="v", seg=28)
    box(2.2, 0.9, 0.14, u - 0.15, v, z + 0.22, M["navy"], g, bevel=0.03)
    box(0.7, 0.9, 0.72, u + 0.85, v, z + 0.34, M["blue"], g, bevel=0.1, seg=4)
    box(0.02, 0.8, 0.3, u + 1.2, v, z + 0.66, M["navy2"], g, bevel=0.01)
    box(1.5, 0.9, 0.06, u - 0.45, v, z + 0.36, M["body2"], g, bevel=0.02)
    if load == "bag":
        for du in (-0.85, -0.1):
            box(0.62, 0.66, 0.58, u + du, v, z + 0.42, M["bag"], g, bevel=0.12, seg=4)
    else:
        for du in (-0.85, -0.15):
            box(0.62, 0.74, 0.3, u + du, v, z + 0.42, M["navy"], g, bevel=0.05)
            box(0.14, 0.2, 0.08, u + du + 0.22, v, z + 0.72, M["amber"], g, bevel=0.02)


# ─────────────────────────── ① 광산 ───────────────────────────
def s1_mine(M):
    """노천 광산: 계단식 언덕 + 굴착기 + 광석 더미 + 운반 트럭"""
    g = "s1"
    u, v = 2.9, VM - 0.2
    for k, (du, dv, h) in enumerate(((4.4, 3.4, 0.35), (3.5, 2.6, 0.3), (2.6, 1.9, 0.3), (1.6, 1.2, 0.28))):
        box(du, dv, h, u - 0.2 * k, v - 0.15 * k, Z0 + sum((0.35, 0.3, 0.3, 0.28)[:k]), M["earth"] if k % 2 == 0 else M["earth2"], g, bevel=0.08, seg=3)
    # 굴착기 (맨 위 단)
    zt = Z0 + 0.35 + 0.3 + 0.3 + 0.28
    box(0.7, 0.5, 0.18, u - 0.5, v - 0.3, zt, M["navy"], g, bevel=0.04)
    box(0.5, 0.45, 0.36, u - 0.5, v - 0.3, zt + 0.18, M["amber"], g, bevel=0.06, seg=3)
    pipe([(u - 0.3, v - 0.3, zt + 0.45), (u + 0.25, v - 0.3, zt + 0.8), (u + 0.6, v - 0.3, zt + 0.45)], 0.05, M["amber"], g)
    box(0.26, 0.3, 0.2, u + 0.6, v - 0.3, zt + 0.25, M["steel"], g, bevel=0.03)
    # 광석 더미
    pile = S.obj_from(S.cyl_mesh(0.55, 0.55, 40, r2=0.04), L(u + 2.6, v + 1.2, Z0 + 0.275), M["ore"], "pile", (0, 0, 0), g)
    for p in pile.data.polygons:
        p.use_smooth = True
    truck(M, u + 2.4, v - 0.9, g, load="bag")
    tube(M, "s1", g)
    return (u, v, Z0 + 1.7)


# ─────────────────────────── ② 제련 ───────────────────────────
def s2_refine(M):
    """제련 · 정제: 건물 + 굴뚝 둘 + 반응 탱크"""
    g = "s2"
    u, v = 10.0, VM
    box(3.0, 2.0, 1.3, u - 0.3, v - 0.2, Z0, M["body"], g, bevel=0.06, seg=4)
    box(3.04, 2.04, 0.08, u - 0.3, v - 0.2, Z0 + 1.3, M["navy"], g, bevel=0.03)
    for k in range(4):
        box(0.5, 0.03, 0.4, u - 1.3 + k * 0.7, v + 0.81, Z0 + 0.5, M["glass_d"], g, bevel=0.01)
    for du in (-1.2, -0.4):
        cyl(0.2, 2.4, u + du, v - 0.6, Z0 + 1.3, M["body2"], g, seg=32)
        cyl(0.22, 0.12, u + du, v - 0.6, Z0 + 2.6, M["hull_r"], g, seg=32)
        cyl(0.22, 0.08, u + du, v - 0.6, Z0 + 3.4, M["hull_r"], g, seg=32)
    for k, dv in enumerate((-0.6, 0.5)):
        cyl(0.42, 1.1, u + 1.75, v + dv, Z0, M["body"], g, seg=48)
        cyl(0.44, 0.06, u + 1.75, v + dv, Z0 + 1.1, M["blue"] if k == 0 else M["amber"], g, seg=48)
    poly_pipe([(u + 1.75, v - 0.6, Z0 + 1.15), (u + 1.75, v - 0.6, Z0 + 1.4), (u + 1.2, v - 0.6, Z0 + 1.4)], 0.05, M["pipe"], g)
    tube(M, "s2", g)
    return (u - 0.3, v, Z0 + 2.2)


# ─────────────────────────── ③ 먼 운송 (배) ───────────────────────────
def water():
    g = "lane"
    w = WATER
    du, dv = w["u1"] - w["u0"], w["v1"] - w["v0"]
    S_ = PL.S
    box(du, dv, 0.02, (w["u0"] + w["u1"]) / 2, (w["v0"] + w["v1"]) / 2, Z0 - 0.005, _M["water"], g, bevel=0.15, seg=3)


def s3_ship(M):
    """광석 · 정광을 실은 배 — 바다를 건너는 먼 운송"""
    g = "s3"
    u, v = 16.9, VM
    z = Z0 + 0.02
    box(3.6, 1.2, 0.5, u, v, z, M["hull"], g, bevel=0.12, seg=4)
    box(3.6, 1.2, 0.12, u, v, z, M["hull_r"], g, bevel=0.08, seg=3)
    bow = S.obj_from(S.cyl_mesh(0.6, 0.5, 3, r2=0.6, smooth=False), L(u + 1.95, v, z + 0.25), M["hull"], "bow", (0, 0, math.pi / 2), g)
    box(3.4, 1.0, 0.05, u, v, z + 0.5, M["body2"], g, bevel=0.02)
    for k in range(3):
        box(0.8, 0.8, 0.35, u + 0.6 - k * 0.95, v, z + 0.55, M["bag"] if k != 1 else M["ore"], g, bevel=0.12, seg=4)
    box(0.7, 0.9, 0.7, u - 1.45, v, z + 0.55, M["body"], g, bevel=0.05, seg=3)
    box(0.74, 0.94, 0.06, u - 1.45, v, z + 1.25, M["navy"], g, bevel=0.02)
    box(0.02, 0.7, 0.18, u - 1.09, v, z + 0.95, M["glass_d"], g, bevel=0.01)
    cyl(0.12, 0.45, u - 1.6, v, z + 1.3, M["hull_r"], g, seg=24)
    # 부두
    box(0.9, 2.2, 0.3, 14.9, v, Z0 - 0.02, M["body2"], g, bevel=0.03)
    box(0.9, 2.2, 0.3, 19.0, v, Z0 - 0.02, M["body2"], g, bevel=0.03)
    tube(M, "s3", g)
    return (u, v, Z0 + 1.6)


# ─────────────────────────── ④ 폐배터리 수거 ───────────────────────────
def d1_collect(M):
    """다 쓴 전기차에서 떼어 낸 팩을 모아 가까운 재활용 공장으로 (짧은 운송)"""
    g = "d1"
    u, v = 3.4, VR
    box(4.6, 2.4, 0.06, u, v, Z0, M["body2"], g, bevel=0.03)
    WK.car(M, u - 0.6, v - 0.2, Z0 + 0.06, g)
    # 수거 상자 (팩 두 개)
    open_box(1.3, 1.0, 0.5, u + 2.2, v - 1.1, Z0, M["body"], g, wall=0.06)
    box(1.2, 0.9, 0.2, u + 2.2, v - 1.1, Z0 + 0.06, M["navy"], g, bevel=0.03)
    box(1.32, 0.04, 0.1, u + 2.2, v - 0.58, Z0 + 0.35, M["hazard"], g, bevel=0.01)
    truck(M, u + 1.5, v + 1.15, g, load="pack")
    tube(M, "d1", g)
    return (u, v, Z0 + 1.5)


# ─────────────────────────── ⑤ 재활용 공장 ───────────────────────────
def d2_recycle(M):
    """03 재활용 공정의 파쇄 · 선별 + 침출조를 그대로 옮겨 놓음"""
    g = "d2"
    regroup(lambda: PL.s3_shred(M, 8.0, VR), g)
    regroup(lambda: PL.h1_leach(M, 13.6, VR - 0.15), g)
    # 전력 받는 배전함
    box(0.6, 0.4, 0.8, 15.0, VR + 1.25, Z0, M["body"], g, bevel=0.04)
    box(0.5, 0.03, 0.22, 15.0, VR + 1.46, Z0 + 0.45, M["power"], g, bevel=0.01)
    tube(M, "d2", g)
    return (11.0, VR, Z0 + 1.8)


# ─────────────────────────── ⑥ 전력 ───────────────────────────
def d3_power(M):
    """재활용 공장에 전기를 대는 단지: 석탄 발전(굴뚝 · 냉각탑 · 석탄 더미) + 태양광 판"""
    g = "d3"
    u, v = 18.6, 9.0
    # 석탄 발전
    box(1.6, 1.1, 0.9, u - 1.0, v - 0.2, Z0, M["body"], g, bevel=0.05, seg=4)
    cyl(0.16, 2.0, u - 1.5, v - 0.4, Z0 + 0.9, M["body2"], g, seg=32)
    cyl(0.18, 0.1, u - 1.5, v - 0.4, Z0 + 2.7, M["hull_r"], g, seg=32)
    tower = S.obj_from(S.cyl_mesh(0.55, 1.2, 48, r2=0.38), L(u - 0.15, v - 0.7, Z0 + 0.6), M["cool"], "tower", (0, 0, 0), g)
    pile = S.obj_from(S.cyl_mesh(0.42, 0.35, 32, r2=0.05), L(u - 1.0, v + 0.75, Z0 + 0.175), M["coal"], "coal", (0, 0, 0), g)
    # 태양광 판 (u 방향 두 줄)
    for i in range(3):
        for j in range(2):
            pu, pv = u + 1.0 + i * 0.75, v - 0.45 + j * 0.85
            box(0.05, 0.05, 0.3, pu, pv, Z0, M["steel"], g, bevel=0.01)
            box(0.66, 0.6, 0.04, pu, pv, Z0 + 0.32, M["solar"], g, bevel=0.01, rotz=0)["tilt"] = 1
    # 변압기
    box(0.55, 0.5, 0.55, u + 3.3, v + 0.1, Z0, M["body2"], g, bevel=0.04)
    for k in range(3):
        cyl(0.04, 0.22, u + 3.15 + k * 0.15, v + 0.1, Z0 + 0.55, M["steel"], g, seg=12)
    tube(M, "d3", g)
    return (u + 0.6, v, Z0 + 1.6)


def tilt_panels():
    for o in bpy.context.scene.objects:
        if o.get("tilt"):
            o.rotation_euler[0] = math.radians(-22)


# ─────────────────────────── 양극재 공장 ───────────────────────────
def hub(M):
    """같은 양극재를 만드는 공장 — 지붕 위 큰 유리 기둥 두 개(왼쪽: 광산 원료 길 합계, 오른쪽: 재활용 원료 길 합계)"""
    g = "hub"
    u, v = HUB
    box(3.6, 2.8, 1.5, u, v, Z0, M["body"], g, bevel=0.07, seg=4)
    box(3.64, 2.84, 0.1, u, v, Z0 + 1.5, M["navy"], g, bevel=0.04)
    for k in range(4):
        box(0.55, 0.03, 0.5, u - 1.2 + k * 0.8, v + 1.41, Z0 + 0.55, M["glass_d"], g, bevel=0.01)
    box(0.9, 0.04, 0.9, u + 1.25, v + 1.42, Z0, M["body2"], g, bevel=0.01)
    # 소성로 (옆으로 누운 원통)
    cyl(0.32, 1.6, u, v - 1.75, Z0 + 0.55, M["body2"], g, axis="u")
    for du in (-0.6, 0.6):
        box(0.3, 0.5, 0.25, u + du, v - 1.75, Z0, M["steel"], g, bevel=0.03)
    # 지붕 위 큰 기둥 두 개
    for key, (cu, cv) in COLS.items():
        cyl(COL_R + 0.12, 0.12, cu, cv, HUB_ROOF, M["body2"], g, seg=48)
        cyl(COL_R, COL_H, cu, cv, HUB_ROOF + 0.12, M["tube"], g, seg=48)
        for k in range(1, 6):
            ring(COL_R + 0.005, 0.025, cu, cv, HUB_ROOF + 0.12 + k * COL_H / 6, M["tube_rim"], g, t=0.01, seg=48)
        ring(COL_R + 0.012, 0.06, cu, cv, HUB_ROOF + 0.12 + COL_H - 0.06, M["tube_rim"], g, t=0.025, seg=48)
        box(0.4, 0.06, 0.16, cu, cv + COL_R + 0.12, HUB_ROOF, M["navy"] if key == "m" else M["teal"], g, bevel=0.02)
    return (u, v, HUB_ROOF + COL_H + 0.3)


def col_z0():
    return HUB_ROOF + 0.12


# ─────────────────────────── 바닥 선 ───────────────────────────
def lanes(M):
    g = "lane"
    d = TR.dashes
    d(M, [(0.8, VM), (UJ, VM), (UJ, HUB[1] - 0.8), (HUB[0] - 1.9, HUB[1] - 0.8)], M["navy2"], g)
    d(M, [(0.8, VR), (UJ, VR), (UJ, HUB[1] + 0.8), (HUB[0] - 1.9, HUB[1] + 0.8)], M["teal"], g)
    # 전력선 (호박): 발전 단지 → 재활용 공장 배전함
    d(M, [(17.0, 9.95), (15.0, 9.95), (15.0, VR + 1.5)], M["wire"], g)


_M = None


def build():
    global _M
    M = _M = mats_lc()
    PL.platform(M, PLAT, "plat")
    water()
    lanes(M)
    a = {}
    a["s1"] = s1_mine(M)
    a["s2"] = s2_refine(M)
    a["s3"] = s3_ship(M)
    a["d1"] = d1_collect(M)
    a["d2"] = d2_recycle(M)
    a["d3"] = d3_power(M)
    tilt_panels()
    a["hub"] = hub(M)
    a["zh"] = (HUB[0] + 2.6, HUB[1] - 2.6, 0.0)     # 양극재 공장 이름표 자리 (공장 오른쪽 뒤 빈 바닥)
    a["zr"] = (9.0, 10.25, 0.0)                      # 앞 길 이름표
    return a
