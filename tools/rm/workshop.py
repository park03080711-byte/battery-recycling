"""재제조 작업장 등각 장면 — Blender 5 / bpy.

전기차에서 떼어 낸 팩 → 개봉 · 진단 → 지친 모듈만 교체 → 셀밸런싱 → 재조립 · 검사 → 다시 전기차로.
03 재활용 공정 지도(../rc/plant.py)와 같은 도우미 · 재질 · 조명 · 카메라를 쓴다. 외부 모델 · AI 이미지 없음.
좌표: 도식 좌표 (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래.
"""
import math, os, sys
import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "rc"))
import plant as PL
from plant import box, cyl, ring, open_box, pipe, poly_pipe, L

S = PL.S
PLAT = dict(u0=0.0, u1=25.0, v0=0.2, v1=9.0)
Z0 = PL.SLAB


def mats_rm():
    M = PL.mats()
    P = S.P
    M["car"] = P("car", PL.hexlin("#5B7CFA"), rough=0.3, coat=0.6)
    M["car2"] = P("car2", PL.hexlin("#E8EDFF"), rough=0.35, coat=0.5)
    M["glass"] = P("glass", PL.hexlin("#2B3656"), rough=0.12, coat=0.8)
    M["mod"] = P("module", PL.hexlin("#C9D2E3"), rough=0.4, coat=0.2)
    M["mod_new"] = P("module_new", PL.hexlin("#A9BBFD"), rough=0.35, coat=0.3)
    M["mod_old"] = P("module_old", PL.hexlin("#F3B64A"), rough=0.4, coat=0.2)
    M["green"] = P("ok", PL.hexlin("#39C6B6"), rough=0.3, emit=(PL.hexlin("#39C6B6"), 0.6))
    return M


# ─────────────────────────── 부품 ───────────────────────────
def pack(M, u, v, z, g, empty=None, lid=False, old=None, new=None):
    """팩: 남색 트레이 + 모듈 2×4 (empty: 빈 자리, old/new: 표시할 모듈 자리)"""
    box(3.0, 1.9, 0.34, u, v, z, M["navy"], g, bevel=0.07, seg=4)
    box(2.8, 1.7, 0.02, u, v, z + 0.34, M["navy2"], g, bevel=0.0)
    if lid:
        box(3.0, 1.9, 0.08, u, v, z + 0.34, M["navy"], g, bevel=0.05, seg=3)
        for k in range(3):
            box(0.04, 1.6, 0.015, u - 0.9 + k * 0.9, v, z + 0.42, M["navy2"], g, bevel=0)
    else:
        for i in range(4):
            for j in range(2):
                if empty == (i, j):
                    continue
                m = M["mod"]
                if old == (i, j):
                    m = M["mod_old"]
                if new == (i, j):
                    m = M["mod_new"]
                mu, mv = u - 1.05 + i * 0.7, v - 0.42 + j * 0.84
                box(0.62, 0.76, 0.3, mu, mv, z + 0.34, m, g, bevel=0.04)
                box(0.5, 0.08, 0.03, mu, mv - 0.2, z + 0.64, M["steel"], g, bevel=0.01)
    box(0.18, 0.3, 0.16, u + 1.58, v, z + 0.08, M["amber"], g, bevel=0.03)  # 고전압 커넥터


def module_(M, u, v, z, m, g):
    box(0.62, 0.76, 0.3, u, v, z, m, g, bevel=0.04)
    box(0.5, 0.08, 0.03, u, v - 0.2, z + 0.3, M["steel"], g, bevel=0.01)


def car(M, u, v, z, g, lifted=False):
    """단순화한 전기차 (u 방향으로 긴 차체)"""
    for du in (-1.35, 1.35):
        for dv in (-0.78, 0.78):
            cyl(0.34, 0.24, u + du, v + dv, z + 0.34, M["rubber"], g, axis="v", seg=40)
            cyl(0.18, 0.25, u + du, v + dv, z + 0.34, M["steel"], g, axis="v", seg=24)
    box(4.3, 1.8, 0.5, u, v, z + 0.3, M["car"], g, bevel=0.2, seg=5)
    box(2.3, 1.6, 0.2, u - 0.2, v, z + 0.78, M["car"], g, bevel=0.08, seg=3)
    box(2.2, 1.52, 0.26, u - 0.2, v, z + 0.96, M["glass"], g, bevel=0.1, seg=4)
    box(1.7, 1.3, 0.08, u - 0.3, v, z + 1.2, M["car"], g, bevel=0.04, seg=3)
    box(0.12, 1.4, 0.14, u + 2.14, v, z + 0.5, M["car2"], g, bevel=0.05)  # 앞 등


def lift_posts(M, u, v, h, g):
    for dv in (-1.3, 1.3):
        box(0.28, 0.28, h + 0.6, u, v + dv, Z0, M["body2"], g, bevel=0.04)
        box(0.34, 0.34, 0.08, u, v + dv, Z0 + h + 0.6, M["blue"], g, bevel=0.02)
        box(1.8, 0.14, 0.08, u, v + dv * 0.62, Z0 + h - 0.08, M["steel"], g, bevel=0.02)


def screen_cart(M, u, v, g, tall=1.25):
    box(0.8, 0.55, 0.9, u, v, Z0, M["body"], g, bevel=0.05, seg=4)
    box(0.84, 0.59, 0.05, u, v, Z0 + 0.9, M["body2"], g, bevel=0.02)
    box(0.1, 0.1, tall - 0.9, u, v - 0.15, Z0 + 0.95, M["steel"], g, bevel=0.02)
    box(0.7, 0.05, 0.42, u, v - 0.1, Z0 + tall, M["body2"], g, bevel=0.02)
    box(0.62, 0.02, 0.34, u, v - 0.07, Z0 + tall + 0.04, M["screen"], g, bevel=0.01)


# ─────────────────────────── 장면 ───────────────────────────
def lane(M):
    """바닥 흐름선 (청록 점선) — 차 → 1 → 2 → 3 → 4 → 차"""
    g = "lane"
    pts = [(3.2, 5.0), (7.0, 5.0), (7.0, 3.6), (11.0, 3.6), (11.0, 2.4), (13.8, 2.4), (13.8, 6.6), (17.9, 6.6), (17.9, 3.6), (22.6, 3.6), (22.6, 4.6)]
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(u1 - u0, v1 - v0) / 0.5))
        for k in range(n):
            t = (k + 0.25) / n
            uu, vv = u0 + (u1 - u0) * t, v0 + (v1 - v0) * t
            horiz = abs(u1 - u0) > abs(v1 - v0)
            box(0.26 if horiz else 0.06, 0.06 if horiz else 0.26, 0.01, uu, vv, Z0, M["teal"], g, bevel=0)


def car_in(M):
    g = "cin"
    u, v = 3.2, 6.9
    lift_posts(M, u, v, 1.35, g)
    car(M, u, v, Z0 + 1.3, g)
    # 차 아래: 팩을 받아 내린 리프트 테이블
    box(1.6, 1.2, 0.08, u, v, Z0, M["steel"], g, bevel=0.02)
    box(0.12, 0.12, 0.35, u, v, Z0 + 0.08, M["steel"], g, bevel=0.02)
    return (u + 0.6, v + 1.9, Z0)


def r1_open(M):
    g = "r1"
    u, v = 7.4, 6.4
    box(3.3, 2.2, 0.55, u, v, Z0, M["body2"], g, bevel=0.05)
    pack(M, u, v, Z0 + 0.55, g, old=(2, 0))
    # 뚜껑: 앞쪽 낮은 거치대에 눕혀 둠
    box(3.2, 2.0, 0.3, u, v + 2.35, Z0, M["body2"], g, bevel=0.04)
    box(3.0, 1.9, 0.08, u, v + 2.35, Z0 + 0.3, M["navy"], g, bevel=0.05)
    for k in range(3):
        box(0.04, 1.6, 0.015, u - 0.9 + k * 0.9, v + 2.35, Z0 + 0.38, M["navy2"], g, bevel=0)
    # 진단 카트 + 측정선
    cu, cv = u - 0.4, v - 2.2
    screen_cart(M, cu, cv, g)
    for k, m in enumerate((M["navy"], M["amber"])):
        pipe([(cu + 0.2, cv + 0.3, Z0 + 0.8), (cu + 0.4 + k * 0.2, cv + 1.0, Z0 + 1.2), (u + 0.35 + k * 0.1, v - 0.4, Z0 + 1.15), (u + 0.35 + k * 0.1, v - 0.42, Z0 + 0.95)], 0.028, m, g)
    return (u, v - 0.2, Z0 + 1.3)


def r2_swap(M):
    g = "r2"
    u, v = 11.4, 5.4
    box(3.3, 2.2, 0.55, u, v, Z0, M["body2"], g, bevel=0.05)
    pack(M, u, v, Z0 + 0.55, g, empty=(2, 0))
    # 호이스트 문형 틀 + 들어 올린 지친 모듈(호박색)
    for du in (-1.9, 1.9):
        box(0.16, 0.16, 2.6, u + du, v - 1.3, Z0, M["steel"], g, bevel=0.02)
    box(4.0, 0.16, 0.16, u, v - 1.3, Z0 + 2.6, M["blue"], g, bevel=0.03)
    mu, mv = u - 1.05 + 2 * 0.7, v - 0.42
    before = set(bpy.context.scene.objects)
    box(0.2, 0.2, 0.16, mu, v - 1.3, Z0 + 2.44, M["navy"], g, bevel=0.03)
    pipe([(mu, v - 1.3, Z0 + 2.44), (mu, mv - 0.2, Z0 + 1.95)], 0.012, M["steel"], g)
    module_(M, mu, mv, Z0 + 1.5, M["mod_old"], g)
    for o in set(bpy.context.scene.objects) - before:  # 움직이는 부품 (animate.py가 씀)
        o["anim"] = "r2"
    # 교체용 모듈 선반 (등급이 맞는 모듈)
    su, sv = u - 0.6, v - 2.6
    for k in range(3):
        box(2.2, 0.9, 0.06, su, sv, Z0 + 0.35 + k * 0.55, M["body2"], g, bevel=0.02)
    for du in (-1.05, 1.05):
        for dv in (-0.4, 0.4):
            box(0.07, 0.07, 1.55, su + du, sv + dv, Z0, M["steel"], g, bevel=0.01)
    for k in range(3):
        for i in range(3):
            if k == 2 and i == 2:
                continue
            module_(M, su - 0.7 + i * 0.7, sv, Z0 + 0.41 + k * 0.55, M["mod_new"], g)
    # 빠진 모듈 → 재활용 상자
    open_box(1.0, 0.9, 0.55, u + 2.3, v + 0.9, Z0, M["body"], g, wall=0.06)
    module_(M, u + 2.3, v + 0.9, Z0 + 0.1, M["mod_old"], g)
    box(1.04, 0.94, 0.06, u + 2.3, v + 0.9, Z0 + 0.55, M["amber"], g, bevel=0.02)
    return (u + 0.35, v - 0.4, Z0 + 2.2)


def r3_balance(M):
    g = "r3"
    u, v = 16.2, 3.9
    # 충방전 · 밸런싱 캐비닛: 선반 세 칸에 모듈과 케이블
    box(2.8, 1.1, 2.3, u, v - 0.9, Z0, M["body"], g, bevel=0.06, seg=4)
    for k in range(3):
        box(2.5, 0.05, 0.56, u, v - 0.33, Z0 + 0.22 + k * 0.7, M["body2"], g, bevel=0.01)
        for i in range(3):
            mu = u - 0.8 + i * 0.8
            box(0.5, 0.05, 0.3, mu, v - 0.31, Z0 + 0.34 + k * 0.7, M["mod"], g, bevel=0.02)
            box(0.06, 0.03, 0.06, mu + 0.3, v - 0.29, Z0 + 0.6 + k * 0.7, M["green"] if (i + k) % 3 else M["amber"], g, bevel=0)
    box(2.84, 1.14, 0.08, u, v - 0.9, Z0 + 2.3, M["blue"], g, bevel=0.03)
    # 앞 작업대: 팩(모듈 교체 완료) + 연결선
    box(3.3, 2.2, 0.55, u, v + 1.4, Z0, M["body2"], g, bevel=0.05)
    pack(M, u, v + 1.4, Z0 + 0.55, g, new=(2, 0))
    for k in range(3):
        pipe([(u - 0.8 + k * 0.8, v - 0.3, Z0 + 0.9), (u - 0.7 + k * 0.8, v + 0.2, Z0 + 1.3), (u - 0.7 + k * 0.8, v + 0.9, Z0 + 1.0)], 0.022, M["navy"], g)
    return (u, v - 0.4, Z0 + 2.4)


def r4_test(M):
    g = "r4"
    u, v = 20.0, 2.0
    # 시험 부스 (앞이 트인 방) + 뚜껑 닫은 팩
    w = 0.1
    box(3.6, 2.6, w, u, v, Z0, M["body2"], g, bevel=0.02)                       # 바닥
    box(3.6, w, 1.8, u, v - 1.25, Z0, M["body"], g, bevel=0.03)                 # 뒷벽
    box(w, 2.6, 1.8, u - 1.75, v, Z0, M["body"], g, bevel=0.03)                 # 왼쪽 벽
    box(w, 2.6, 1.8, u + 1.75, v, Z0, M["body"], g, bevel=0.03)                 # 오른쪽 벽
    box(3.6, 0.1, 0.16, u, v + 1.25, Z0 + 1.64, M["amber"], g, bevel=0.02)       # 트인 앞면 위 안전 띠
    pack(M, u, v - 0.1, Z0 + 0.12, g, lid=True)
    # 검사기 탑
    tu, tv = u + 2.4, v - 0.6
    box(0.7, 0.7, 1.9, tu, tv, Z0, M["body"], g, bevel=0.05, seg=4)
    box(0.02, 0.5, 0.4, tu - 0.36, tv, Z0 + 1.3, M["screen"], g, bevel=0.01)
    box(0.74, 0.74, 0.08, tu, tv, Z0 + 1.9, M["body2"], g, bevel=0.02)
    cyl(0.1, 0.12, tu, tv, Z0 + 1.98, M["green"], g, seg=24)
    pipe([(tu - 0.3, tv + 0.2, Z0 + 0.6), (tu - 0.9, tv + 0.5, Z0 + 0.4), (u + 1.5, v - 0.1, Z0 + 0.3)], 0.03, M["navy"], g)
    return (u, v, Z0 + 2.0)


def car_out(M):
    g = "cout"
    u, v = 22.6, 5.9
    car(M, u, v, Z0, g)
    return (u - 0.4, v + 1.6, Z0)


def back_rack(M):
    """뒤쪽 벽면: 등급별로 분류해 둔 교체용 모듈 보관 선반"""
    g = "rack"
    u0, u1, v = 13.6, 18.2, 0.9
    for k in range(4):
        box(u1 - u0, 0.8, 0.05, (u0 + u1) / 2, v, Z0 + 0.3 + k * 0.5, M["body2"], g, bevel=0.02)
    for uu in (u0 + 0.05, (u0 + u1) / 2, u1 - 0.05):
        box(0.07, 0.8, 1.9, uu, v, Z0, M["steel"], g, bevel=0.01)
    for k in range(4):
        for i in range(6):
            if (i * 3 + k) % 5 == 4:
                continue
            m = M["mod"] if k else M["mod_new"]
            box(0.55, 0.6, 0.26, u0 + 0.5 + i * 0.72, v, Z0 + 0.35 + k * 0.5, m, g, bevel=0.03)


def build():
    M = mats_rm()
    PL.platform(M, PLAT, "plat")
    lane(M)
    a = {}
    a["cin"] = car_in(M)
    a["r1"] = r1_open(M)
    a["r2"] = r2_swap(M)
    a["r3"] = r3_balance(M)
    a["r4"] = r4_test(M)
    a["cout"] = car_out(M)
    back_rack(M)
    return a
