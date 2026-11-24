"""공급망 · 자원안보 — '섬을 도는 원료' 등각 장면 (Blender 5 / bpy).

바다 위 섬 넷으로 배터리 원료가 도는 길을 그린다.
 ① 광산 섬(노천 광산 · 리튬 염수 증발지 · 광석 바지선) → ② 정제 섬(정제 공장 넷이 한곳에 몰림; 앞 왼쪽 작은 섬에 다른 나라 정제 공장 하나)
 → ③ 배 운송(바다를 건너는 화물선 · 경고 부표) → ④ 한국 섬의 배터리 공장(양극재 · 셀)
 → ⑤ 사용후 배터리 수거(전기차 · 수거 상자 · 트럭) → ⑥ 국내 재활용 공장(03의 파쇄기 · 전처리 용량 통) → 다시 ④로 (도시광산 고리)
공장 수 · 통의 눈금은 설명용이다(정제 쏠림 · 전처리 용량 11%의 뜻은 페이지 본문과 그림에서 수치로 밝힘).
03 공정 지도(../rc/plant.py) · 01 작업장(../rm/workshop.py) · 09 이력관리(../tr/passport.py) · 10 인증(../ce/certify.py)
· 11 전과정평가(../lc/footprint.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래. 배치는 설명용으로 단순화했고 실제 지리와 다르다.
"""
import math, os, sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
for d in ("rc", "rm", "tr", "ce", "lc"):
    sys.path.insert(0, os.path.join(HERE, "..", d))
import plant as PL
import workshop as WK
import passport as TR
import certify as CE
import footprint as LC
from plant import box, cyl, open_box, ring, pipe, poly_pipe, L

S = PL.S
Z0 = PL.SLAB
LAND = 0.035                      # 섬 땅 두께 (설비는 Z0에 놓여 살짝 묻힘)
PLAT = dict(u0=0.0, u1=23.0, v0=0.0, v1=14.2)
# 섬 (u0, u1, v0, v1)
ISL = {
    "mine": (0.5, 8.0, 0.5, 5.6),
    "ref": (11.0, 21.6, 0.5, 5.6),
    "kr": (6.4, 22.4, 8.3, 13.7),
    "other": (0.7, 4.6, 8.6, 12.2),
}
# 흐름선이 지나는 자리
VB = 3.0            # 뒤쪽 섬들(광산 · 정제)의 길
KB = 8.95           # 한국 섬 뒤 길
KF = 13.25          # 한국 섬 앞 길
SHIP = (19.6, 7.0)  # 화물선 (v 방향으로 바다를 건넘)
BARGE = (9.5, VB)   # 광석 바지선 (u 방향)
PLANT = (19.0, 11.0)   # 배터리 공장
COLLECT = (8.7, 11.9)  # 수거
RECYC = (12.6, 10.35)  # 재활용 (03 파쇄기 기준점)
SILO = (14.7, 12.3)    # 전처리 용량 통
SILO_R = 0.5
SILO_H = 2.0
GAUGE = 0.11           # 김유정(2024): 2030년 국내 사용후 배터리 = 국내 전처리 용량의 11%


def mats_sc():
    M = LC.mats_lc()
    P = S.P
    M["sea"] = P("sea", PL.hexlin("#A8CCF5"), rough=0.1, coat=0.9)
    M["sea2"] = P("sea_deep", PL.hexlin("#8DB8EE"), rough=0.1, coat=0.9)
    M["sand"] = P("sand", PL.hexlin("#EFE3C8"), rough=0.8)
    M["grass"] = P("land_kr", PL.hexlin("#E4EEDF"), rough=0.75)
    M["land_r"] = P("land_ref", PL.hexlin("#E6E1D8"), rough=0.75)
    M["brine"] = P("brine", PL.hexlin("#BFEDE6"), rough=0.12, coat=0.7)
    M["brine2"] = P("brine2", PL.hexlin("#F4F7F2"), rough=0.3, coat=0.4)
    M["slot"] = P("gauge_slot", PL.hexlin("#26324F"), rough=0.4)
    M["buoy"] = P("buoy", PL.hexlin("#F3B64A"), rough=0.4, coat=0.3)
    return M


def regroup(fn, g):
    return CE.regroup(fn, g)


# ─────────────────────────── 바다 · 섬 ───────────────────────────
def sea(M):
    g = "sea"
    p = PLAT
    du, dv = p["u1"] - p["u0"] - 0.3, p["v1"] - p["v0"] - 0.3
    box(du, dv, 0.02, (p["u0"] + p["u1"]) / 2, (p["v0"] + p["v1"]) / 2, Z0 - 0.004, M["sea"], g, bevel=0.1, seg=3)
    # 물결 줄 몇 개 (아주 얕게)
    for k, (u, v, l) in enumerate(((3.0, 7.1, 1.6), (10.5, 6.6, 1.2), (5.2, 13.3, 1.4), (1.6, 6.4, 0.9), (22.2, 7.4, 0.9))):
        box(l, 0.05, 0.004, u, v, Z0 + 0.016, M["sea2"], g, bevel=0)


def island(M, key, m):
    u0, u1, v0, v1 = ISL[key]
    g = "isl"
    box(u1 - u0 + 0.24, v1 - v0 + 0.24, LAND * 0.6, (u0 + u1) / 2, (v0 + v1) / 2, Z0, M["sand"], g, bevel=0.12, seg=3)
    box(u1 - u0, v1 - v0, LAND, (u0 + u1) / 2, (v0 + v1) / 2, Z0, m, g, bevel=0.1, seg=3)


def dock(M, u, v, du, dv, g):
    box(du, dv, 0.12, u, v, Z0, M["body2"], g, bevel=0.03)
    for k in range(int(max(du, dv) / 0.6)):
        if du > dv:
            cyl(0.05, 0.25, u - du / 2 + 0.3 + k * 0.6, v + dv / 2, Z0 - 0.1, M["steel"], g, seg=12)
        else:
            cyl(0.05, 0.25, u + du / 2, v - dv / 2 + 0.3 + k * 0.6, Z0 - 0.1, M["steel"], g, seg=12)


# ─────────────────────────── ① 광산 섬 ───────────────────────────
MINE = (2.6, 2.6)
PONDS = [(5.6, 1.35), (6.9, 1.35), (5.6, 2.55), (6.9, 2.55)]


def m1_mine(M):
    """노천 광산(계단식 언덕 · 굴착기 · 광석 더미 · 트럭) + 리튬 염수 증발지 + 광석 바지선"""
    g = "m1"
    u, v = MINE
    hs = (0.35, 0.3, 0.3, 0.28)
    for k, (du, dv, h) in enumerate(((4.0, 3.4, 0.35), (3.2, 2.6, 0.3), (2.4, 1.9, 0.3), (1.5, 1.2, 0.28))):
        box(du, dv, h, u - 0.2 * k, v - 0.15 * k, Z0 + sum(hs[:k]), M["earth"] if k % 2 == 0 else M["earth2"], g, bevel=0.08, seg=3)
    zt = Z0 + sum(hs)
    box(0.7, 0.5, 0.18, u - 0.5, v - 0.3, zt, M["navy"], g, bevel=0.04)
    box(0.5, 0.45, 0.36, u - 0.5, v - 0.3, zt + 0.18, M["amber"], g, bevel=0.06, seg=3)
    pipe([(u - 0.3, v - 0.3, zt + 0.45), (u + 0.25, v - 0.3, zt + 0.8), (u + 0.6, v - 0.3, zt + 0.45)], 0.05, M["amber"], g)
    box(0.26, 0.3, 0.2, u + 0.6, v - 0.3, zt + 0.25, M["steel"], g, bevel=0.03)
    pile = S.obj_from(S.cyl_mesh(0.5, 0.5, 40, r2=0.04), L(u + 1.2, v + 2.2, Z0 + 0.25), M["ore"], "pile", (0, 0, 0), g)
    for p in pile.data.polygons:
        p.use_smooth = True
    LC.truck(M, u + 2.9, v + 1.9, g, load="bag")
    # 염수 증발지 (얕은 웅덩이 넷)
    for k, (pu, pv) in enumerate(PONDS):
        box(1.2, 1.1, 0.08, pu, pv, Z0, M["body2"], g, bevel=0.03)
        box(1.04, 0.94, 0.03, pu, pv, Z0 + 0.06, M["brine"] if k % 2 == 0 else M["brine2"], g, bevel=0.01)
    # 바지선 부두 + 광석 바지선 (섬 사이를 건넘)
    dock(M, 8.35, VB, 0.9, 1.6, g)
    bu, bv = BARGE
    box(2.0, 1.0, 0.3, bu, bv, Z0 - 0.02, M["hull"], g, bevel=0.08, seg=3)
    box(2.0, 1.0, 0.08, bu, bv, Z0 - 0.02, M["hull_r"], g, bevel=0.05)
    pile2 = S.obj_from(S.cyl_mesh(0.45, 0.4, 32, r2=0.08), L(bu, bv, Z0 + 0.48), M["ore"], "pile", (0, 0, 0), g)
    for p in pile2.data.polygons:
        p.use_smooth = True
    return (u, v, Z0 + 1.6)


# ─────────────────────────── ② 정제 섬 ───────────────────────────
REFS = [(13.0, 1.75), (16.0, 1.75), (13.0, 4.25), (16.0, 4.25)]
OTHER = (2.6, 10.4)


def refinery(M, u, v, g, small=False):
    """정제 공장 한 동: 건물 + 굴뚝 둘 + 반응 탱크"""
    s = 0.75 if small else 1.0
    box(2.0 * s, 1.5 * s, 1.1 * s, u, v, Z0, M["body"], g, bevel=0.05, seg=4)
    box(2.04 * s, 1.54 * s, 0.07, u, v, Z0 + 1.1 * s, M["navy"], g, bevel=0.03)
    for k in range(3):
        box(0.4 * s, 0.03, 0.32 * s, u - 0.6 * s + k * 0.6 * s, v + 0.76 * s, Z0 + 0.45 * s, M["glass_d"], g, bevel=0.01)
    for du in (-0.55, 0.1):
        cyl(0.15 * s, 1.5 * s, u + du * s, v - 0.35 * s, Z0 + 1.1 * s, M["body2"], g, seg=28)
        cyl(0.17 * s, 0.1, u + du * s, v - 0.35 * s, Z0 + 1.1 * s + 1.0 * s, M["hull_r"], g, seg=28)
    cyl(0.34 * s, 0.9 * s, u + 1.35 * s, v + 0.15 * s, Z0, M["body"], g, seg=40)
    cyl(0.36 * s, 0.05, u + 1.35 * s, v + 0.15 * s, Z0 + 0.9 * s, M["amber"], g, seg=40)


def chimneys():
    """굴뚝 꼭대기 자리 목록 (공정 재생의 연기용)"""
    out = []
    for (u, v) in REFS:
        for du in (-0.55, 0.1):
            out.append((u + du, v - 0.35, Z0 + 1.1 + 1.5))
    u, v = OTHER
    s = 0.75
    for du in (-0.55, 0.1):
        out.append((u + du * s, v - 0.35 * s, Z0 + 1.1 * s + 1.5 * s))
    return out


def m2_refine(M):
    """정제 공장 넷이 한 섬에 몰려 있음 — 앞 왼쪽 작은 섬에 다른 나라 정제 공장 하나"""
    g = "m2"
    dock(M, 11.6, VB, 0.9, 1.6, g)
    for (u, v) in REFS:
        refinery(M, u, v, g)
    # 정제 섬 부두 (화물선 출발)
    dock(M, SHIP[0], 5.85, 1.6, 0.8, g)
    # 다른 나라 작은 섬
    refinery(M, OTHER[0], OTHER[1], g, small=True)
    return (14.5, 3.0, Z0 + 2.9)


# ─────────────────────────── ③ 배 운송 ───────────────────────────
def m3_ship(M):
    """정제한 원료를 싣고 바다를 건너는 화물선 (v 방향) + 경고 부표"""
    g = "m3"
    u, v = SHIP
    z = Z0 + 0.01
    box(1.2, 3.4, 0.5, u, v, z, M["hull"], g, bevel=0.12, seg=4)
    box(1.2, 3.4, 0.12, u, v, z, M["hull_r"], g, bevel=0.08, seg=3)
    S.obj_from(S.cyl_mesh(0.6, 0.5, 3, r2=0.6, smooth=False), L(u, v + 1.85, z + 0.25), M["hull"], "bow", (0, 0, 0), g)
    box(1.0, 3.2, 0.05, u, v, z + 0.5, M["body2"], g, bevel=0.02)
    for k in range(3):
        box(0.8, 0.75, 0.38, u, v + 0.75 - k * 0.85, z + 0.55, M["bag"] if k != 1 else M["blue"], g, bevel=0.1, seg=4)
    box(0.9, 0.7, 0.7, u, v - 1.4, z + 0.55, M["body"], g, bevel=0.05, seg=3)
    box(0.94, 0.74, 0.06, u, v - 1.4, z + 1.25, M["navy"], g, bevel=0.02)
    box(0.7, 0.02, 0.18, u, v - 1.04, z + 0.95, M["glass_d"], g, bevel=0.01)
    cyl(0.12, 0.45, u, v - 1.55, z + 1.3, M["hull_r"], g, seg=24)
    # 경고 부표 (물류 위험)
    bu, bv = SHIP[0] - 1.6, SHIP[1] + 0.6
    cyl(0.2, 0.25, bu, bv, Z0, M["buoy"], g, seg=24)
    cyl(0.05, 0.4, bu, bv, Z0 + 0.25, M["steel"], g, seg=12)
    cyl(0.09, 0.1, bu, bv, Z0 + 0.65, M["hull_r"], g, seg=16)
    return (u, v, Z0 + 1.9)


# ─────────────────────────── ④ 배터리 공장 ───────────────────────────
def k1_plant(M):
    """한국 섬의 배터리 공장 (양극재 소성로 + 셀 공장) + 부두 + 출고된 전기차"""
    g = "k1"
    u, v = PLANT
    box(3.6, 2.4, 1.5, u, v, Z0, M["body"], g, bevel=0.07, seg=4)
    box(3.64, 2.44, 0.1, u, v, Z0 + 1.5, M["navy"], g, bevel=0.04)
    for k in range(4):
        box(0.55, 0.03, 0.5, u - 1.2 + k * 0.8, v + 1.21, Z0 + 0.55, M["glass_d"], g, bevel=0.01)
    box(0.9, 0.04, 0.9, u + 1.25, v + 1.22, Z0, M["body2"], g, bevel=0.01)
    cyl(0.32, 1.6, u, v - 1.55, Z0 + 0.55, M["body2"], g, axis="u")
    for du in (-0.6, 0.6):
        box(0.3, 0.5, 0.25, u + du, v - 1.55, Z0, M["steel"], g, bevel=0.03)
    # 지붕 표지 (청록 = 재생원료가 들어가는 공장)
    box(1.2, 0.5, 0.08, u + 0.9, v - 0.5, Z0 + 1.6, M["teal"], g, bevel=0.02)
    dock(M, SHIP[0], 8.55, 1.6, 0.6, g)
    return (u, v, Z0 + 2.2)


# ─────────────────────────── ⑤ 수거 ───────────────────────────
def k2_collect(M):
    """다 쓴 전기차에서 팩을 떼어 모음 (전기차 · 수거 상자 · 팩 트럭)"""
    g = "k2"
    u, v = COLLECT
    box(5.2, 2.2, 0.05, u + 0.5, v, Z0, M["body2"], g, bevel=0.03)
    WK.car(M, u - 0.3, v, Z0 + 0.05, g)
    open_box(1.2, 0.95, 0.5, u + 2.55, v + 0.3, Z0, M["body"], g, wall=0.06)
    box(1.1, 0.85, 0.2, u + 2.55, v + 0.3, Z0 + 0.06, M["navy"], g, bevel=0.03)
    box(1.22, 0.04, 0.1, u + 2.55, v + 0.8, Z0 + 0.35, M["hazard"], g, bevel=0.01)
    LC.truck(M, u + 0.3, 9.85, g, load="pack")
    return (u, v, Z0 + 1.4)


# ─────────────────────────── ⑥ 재활용 ───────────────────────────
def k3_recycle(M):
    """03 재활용의 파쇄 · 선별 + 전처리 용량 통(앞면 눈금 홈; 공정 재생에서 11%까지 참)"""
    g = "k3"
    regroup(lambda: PL.s3_shred(M, RECYC[0], RECYC[1]), g)
    su, sv = SILO
    cyl(SILO_R + 0.1, 0.12, su, sv, Z0, M["body2"], g, seg=40)
    cyl(SILO_R, SILO_H, su, sv, Z0 + 0.12, M["body"], g, seg=48)
    S.obj_from(S.cyl_mesh(SILO_R, 0.35, 48, r2=0.08), L(su, sv, Z0 + 0.12 + SILO_H + 0.175), M["body2"], "cap", (0, 0, 0), g)
    for k in range(1, 4):
        ring(SILO_R + 0.005, 0.03, su, sv, Z0 + 0.12 + k * SILO_H / 4, M["steel"], g, t=0.01, seg=48)
    # 앞(+v) 눈금 홈
    box(0.16, 0.03, SILO_H - 0.2, su, sv + SILO_R - 0.005, Z0 + 0.22, M["slot"], g, bevel=0.01)
    box(0.26, 0.03, 0.03, su, sv + SILO_R + 0.005, Z0 + 0.22 + (SILO_H - 0.2) * GAUGE, M["amber"], g, bevel=0)
    return (RECYC[0] + 0.6, RECYC[1], Z0 + 1.9)


# ─────────────────────────── 바닥 선 ───────────────────────────
ROUTE_A = [(1.0, VB), (MINE[0], VB), (BARGE[0], VB), (14.5, VB), (SHIP[0], VB), (SHIP[0], 9.0), (SHIP[0], KB), (PLANT[0], KB)]
ROUTE_B = [(PLANT[0] - 2.2, KF), (COLLECT[0], KF), (6.9, KF), (6.9, KB), (RECYC[0] + 0.9, KB), (PLANT[0] - 2.2, KB)]


def dashes(M, pts, m, g, step=0.5, size=0.26, w=0.06):
    """09의 점선과 같되, 섬 땅 · 바다 위로 살짝 띄움"""
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(u1 - u0, v1 - v0) / step))
        horiz = abs(u1 - u0) > abs(v1 - v0)
        for k in range(n):
            t = (k + 0.25) / n
            uu, vv = u0 + (u1 - u0) * t, v0 + (v1 - v0) * t
            box(size if horiz else w, w if horiz else size, 0.01, uu, vv, Z0 + LAND + 0.002, m, g, bevel=0)


def lanes(M):
    d = dashes
    d(M, [(8.0, VB), (11.0, VB)], M["navy2"], "lane")                 # 바지선 뱃길
    d(M, [(SHIP[0], 6.25), (SHIP[0], 8.25)], M["navy2"], "lane")      # 화물선 뱃길
    d(M, [(PLANT[0] - 2.2, KF), (6.9, KF), (6.9, KB), (PLANT[0] - 2.2, KB)], M["teal"], "lane")   # 도시광산 고리


_M = None


def build():
    global _M
    M = _M = mats_sc()
    PL.platform(M, PLAT, "plat")
    sea(M)
    island(M, "mine", M["land_r"])
    island(M, "ref", M["land_r"])
    island(M, "kr", M["grass"])
    island(M, "other", M["land_r"])
    lanes(M)
    a = {}
    a["m1"] = m1_mine(M)
    a["m2"] = m2_refine(M)
    a["m3"] = m3_ship(M)
    a["k1"] = k1_plant(M)
    a["k2"] = k2_collect(M)
    a["k3"] = k3_recycle(M)
    a["zr"] = (20.3, 0.9, 0.0)      # 정제 섬 이름표 자리 (섬 오른쪽 뒤 모서리)
    a["zk"] = (21.6, 13.4, 0.0)     # 한국 섬 이름표 (도시광산 고리; 섬 앞 오른쪽 빈 땅)
    a["zo"] = (1.0, 12.0, 0.0)      # 다른 나라 작은 섬
    return a
