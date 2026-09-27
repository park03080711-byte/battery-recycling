"""잔존수명 진단 라인 등각 장면 — Blender 5 / bpy.

① 탈거 전 평가(차에 달린 채 BMS 자료 읽기) → ② 외관 · 안전 점검 → ③ 빠른 진단(펄스 · 임피던스) → ④ 등급 판정
→ 세 출구: 재제조(다시 전기차) · 재사용(ESS 등) · 재활용(분해 · 금속 회수).
03 공정 지도(../rc/plant.py) · 01 작업장(../rm/workshop.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래. 배치는 설명용으로 단순화했다.
"""
import math, os, sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import plant as PL
import workshop as WK
from plant import box, cyl, ring, open_box, pipe

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=24.6, v0=0.0, v1=9.6)
LV = 4.6  # 본선 흐름선 v


def mats_sh():
    M = WK.mats_rm()
    P = S.P
    M["cam"] = P("cam", PL.hexlin("#2B3656"), rough=0.25, coat=0.6)
    M["hazard"] = P("hazard", PL.hexlin("#F3B64A"), rough=0.4)
    M["ess"] = P("ess", PL.hexlin("#E6ECF7"), rough=0.45, coat=0.2)
    M["glass"] = P("glass_sh", PL.hexlin("#8FA2CF"), rough=0.12, coat=0.8)  # 지붕이 팩처럼 보이지 않게 밝은 유리
    return M


def lamp(M, u, v, z, m, g, r=0.07):
    cyl(r, 0.05, u, v, z, m, g, axis="v", seg=20)


# ─────────────────────────── ① 탈거 전 평가 ───────────────────────────
def s1_onboard(M):
    """차에 달린 채로: 진단기를 충전구에 꽂아 BMS 기록 · 전압 응답을 읽는다"""
    g = "s1"
    u, v = 3.0, 7.0
    WK.car(M, u, v, Z0, g)
    # 진단기 카트 (화면이 앞쪽 +v를 향함)
    cu, cv = 6.3, 7.3
    box(0.8, 0.6, 0.9, cu, cv, Z0, M["body"], g, bevel=0.05, seg=4)
    box(0.84, 0.64, 0.05, cu, cv, Z0 + 0.9, M["body2"], g, bevel=0.02)
    box(0.1, 0.1, 0.4, cu, cv - 0.18, Z0 + 0.95, M["steel"], g, bevel=0.02)
    box(0.72, 0.06, 0.46, cu, cv - 0.12, Z0 + 1.3, M["body2"], g, bevel=0.02)
    box(0.62, 0.02, 0.36, cu, cv - 0.08, Z0 + 1.35, M["screen"], g, bevel=0.01)
    for k in range(3):
        lamp(M, cu - 0.22 + k * 0.22, cv + 0.31, Z0 + 0.62, M["body2"], g, r=0.05)
    # 케이블: 카트 → 차 앞쪽 충전구
    pipe([(cu - 0.35, cv - 0.1, Z0 + 0.7), (cu - 0.7, cv - 0.2, Z0 + 0.25), (u + 1.7, v - 0.3, Z0 + 0.35), (u + 2.05, v - 0.55, Z0 + 0.62)], 0.035, M["navy"], g)
    box(0.08, 0.2, 0.14, u + 2.12, v - 0.55, Z0 + 0.55, M["amber"], g, bevel=0.02)  # 충전구
    return (u + 0.4, v, Z0 + 1.6)


# ─────────────────────────── ② 외관 · 안전 점검 ───────────────────────────
def s2_inspect(M):
    """떼어 낸 팩을 검사 문(카메라 · 열화상) 아래로 통과시키며 부풂 · 손상 · 누액 · 발열을 본다"""
    g = "s2"
    u, v = 9.0, 6.6
    box(3.6, 1.9, 0.5, u, v, Z0, M["body2"], g, bevel=0.05)          # 롤러 테이블
    for k in range(9):
        cyl(0.05, 1.8, u - 1.6 + k * 0.4, v, Z0 + 0.5, M["steel"], g, axis="v", seg=12)
    WK.pack(M, u - 0.5, v, Z0 + 0.55, g, lid=True)
    # 검사 문
    for dv in (-1.15, 1.15):
        box(0.18, 0.18, 1.95, u + 0.6, v + dv, Z0, M["body"], g, bevel=0.03)
    box(0.36, 2.5, 0.22, u + 0.6, v, Z0 + 1.95, M["body"], g, bevel=0.04)
    box(0.38, 2.52, 0.05, u + 0.6, v, Z0 + 2.17, M["blue"], g, bevel=0.02)
    for dv in (-0.55, 0.0, 0.55):
        box(0.2, 0.2, 0.14, u + 0.6, v + dv, Z0 + 1.81, M["cam"], g, bevel=0.03)   # 카메라
    # 옆 화면 (판정 표시)
    su, sv = u + 2.4, v + 0.2
    box(0.12, 0.12, 1.1, su, sv, Z0, M["steel"], g, bevel=0.02)
    box(0.7, 0.06, 0.46, su, sv + 0.06, Z0 + 1.1, M["body2"], g, bevel=0.02)
    box(0.6, 0.02, 0.36, su, sv + 0.1, Z0 + 1.15, M["screen"], g, bevel=0.01)
    return (u, v, Z0 + 2.3)


# ─────────────────────────── ③ 빠른 진단 ───────────────────────────
def s3_test(M):
    """열어 둔 팩의 모듈마다 짧은 펄스 · 임피던스 측정 — 완전 충방전보다 훨씬 짧다"""
    g = "s3"
    u, v = 13.2, 2.6
    box(3.4, 2.0, 0.75, u, v, Z0, M["body2"], g, bevel=0.05)          # 시험대
    WK.pack(M, u - 0.1, v, Z0 + 0.75, g)
    # 측정기 캐비닛 (화면 · 표시등이 +v를 향함)
    tu, tv = u + 2.5, v - 0.2
    box(1.0, 1.0, 2.1, tu, tv, Z0, M["body"], g, bevel=0.05, seg=4)
    box(1.04, 1.04, 0.08, tu, tv, Z0 + 2.1, M["body2"], g, bevel=0.02)
    box(0.8, 0.02, 0.5, tu, tv + 0.51, Z0 + 1.35, M["screen"], g, bevel=0.01)
    for k in range(4):
        box(0.7, 0.02, 0.1, tu, tv + 0.51, Z0 + 0.35 + k * 0.2, M["body2"], g, bevel=0.005)   # 측정 채널 표시줄 자리
    # 측정선: 캐비닛 → 모듈 네 개
    for k in range(4):
        mu = u - 1.15 + k * 0.7
        pipe([(tu - 0.5, tv - 0.3 + k * 0.08, Z0 + 1.6 - k * 0.1), (tu - 1.0, tv - 0.3, Z0 + 1.9), (mu, v - 0.62, Z0 + 1.35), (mu, v - 0.62, Z0 + 1.12)], 0.022, M["navy"], g)
    return (u, v, Z0 + 2.2)


# ─────────────────────────── ④ 등급 판정 ───────────────────────────
def s4_grade(M):
    """측정값 · 기록을 모델에 넣어 등급을 매기고, 회전대가 팩을 해당 출구로 돌린다"""
    g = "s4"
    u, v = 16.6, LV
    cyl(1.0, 0.16, u, v, Z0, M["body2"], g, seg=64)
    cyl(0.9, 0.06, u, v, Z0 + 0.16, M["steel"], g, seg=64)
    WK.pack(M, u, v, Z0 + 0.22, g, lid=True)
    # 판정 기둥: 화면 + 세 등급 등 (파랑 재제조 · 청록 재사용 · 주황 재활용)
    pu, pv = u + 0.2, v + 1.7
    box(0.3, 0.3, 1.6, pu, pv, Z0, M["body"], g, bevel=0.04)
    box(0.9, 0.12, 0.6, pu, pv, Z0 + 1.6, M["body2"], g, bevel=0.03)
    box(0.8, 0.02, 0.28, pu, pv + 0.07, Z0 + 1.88, M["screen"], g, bevel=0.01)
    for k in range(3):
        lamp(M, pu - 0.25 + k * 0.25, pv + 0.08, Z0 + 1.72, M["body2"], g, r=0.06)
    return (u, v, Z0 + 2.3)


# ─────────────────────────── 세 출구 ───────────────────────────
def d1_reman(M):
    """재제조: 다시 전기차로 — 팩을 차량 탑재 대기 선반에"""
    g = "d1"
    u, v = 21.8, 1.6
    for k in range(2):
        box(3.2, 1.2, 0.05, u, v, Z0 + 0.35 + k * 0.7, M["body2"], g, bevel=0.02)
    for uu in (u - 1.55, u + 1.55):
        for vv in (v - 0.55, v + 0.55):
            box(0.07, 0.07, 1.5, uu, vv, Z0, M["steel"], g, bevel=0.01)
    for k in range(2):
        for i in range(2):
            box(1.35, 1.0, 0.22, u - 0.75 + i * 1.5, v, Z0 + 0.4 + k * 0.7, M["navy"], g, bevel=0.04)
            box(0.3, 0.03, 0.08, u - 0.75 + i * 1.5, v + 0.515, Z0 + 0.47 + k * 0.7, M["body2"], g, bevel=0.01)  # 상태 표시 자리
    box(0.9, 0.9, 0.05, u - 2.2, v + 1.1, Z0, M["blue"], g, bevel=0.02)   # 출구 바닥 표시
    return (u, v, Z0 + 1.6)


def d2_reuse(M):
    """재사용: 에너지저장장치(ESS) 캐비닛으로 모아 두 번째 삶"""
    g = "d2"
    u, v = 22.2, LV
    box(2.6, 1.3, 1.7, u, v, Z0, M["ess"], g, bevel=0.06, seg=4)
    box(2.64, 1.34, 0.08, u, v, Z0 + 1.7, M["teal"], g, bevel=0.03)
    for k in range(3):
        box(0.04, 0.02, 1.4, u - 1.3 + 0.65 * (k + 1), v + 0.66, Z0 + 0.15, M["body2"], g, bevel=0)   # 문 틈
    for k in range(5):
        box(0.34, 0.02, 0.1, u - 0.9 + k * 0.45, v + 0.66, Z0 + 1.35, M["body2"], g, bevel=0.005)  # 충전 표시 자리
    box(0.9, 0.9, 0.05, u - 2.2, v - 1.0, Z0, M["teal"], g, bevel=0.02)
    return (u, v, Z0 + 2.0)


def d3_recycle(M):
    """재활용: 안전 방전 뒤 분해 · 금속 회수로 — 전용 수거함"""
    g = "d3"
    u, v = 21.8, 7.6
    open_box(1.8, 1.5, 0.95, u, v, Z0, M["body"], g, wall=0.07)
    box(1.82, 0.04, 0.12, u, v + 0.76, Z0 + 0.7, M["hazard"], g, bevel=0.01)
    box(0.04, 1.52, 0.12, u + 0.91, v, Z0 + 0.7, M["hazard"], g, bevel=0.01)
    for i in range(2):
        for j in range(2):
            WK.module_(M, u - 0.4 + i * 0.75, v - 0.35 + j * 0.8, Z0 + 0.07, M["mod_old"] if (i + j) % 2 else M["mod"], g)
    # 톤백 (블랙매스로 갈 자리)
    for k in range(2):
        box(0.8, 0.8, 0.85, u + 2.0, v - 0.5 + k * 1.0, Z0, M["bag"], g, bevel=0.12, seg=4)
    lamp_post = (u - 1.3, v - 0.6)
    box(0.1, 0.1, 1.3, *lamp_post, Z0, M["steel"], g, bevel=0.02)
    cyl(0.1, 0.14, *lamp_post, Z0 + 1.3, M["body2"], g, seg=24)
    box(0.9, 0.9, 0.05, u - 2.2, v - 1.1, Z0, M["amber"], g, bevel=0.02)
    return (u, v, Z0 + 1.5)


def lanes(M):
    """흐름선: 입구 → ①②③④ → 갈림점 → 세 출구"""
    g = "lane"
    paths = [
        [(0.8, LV), (18.6, LV)],
        [(18.6, LV), (18.6, 1.6), (20.1, 1.6)],
        [(18.6, LV), (20.8, LV)],
        [(18.6, LV), (18.6, 7.6), (20.7, 7.6)],
    ]
    for pts in paths:
        for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
            n = max(1, int(math.hypot(u1 - u0, v1 - v0) / 0.5))
            for k in range(n):
                t = (k + 0.25) / n
                uu, vv = u0 + (u1 - u0) * t, v0 + (v1 - v0) * t
                horiz = abs(u1 - u0) > abs(v1 - v0)
                box(0.26 if horiz else 0.06, 0.06 if horiz else 0.26, 0.01, uu, vv, Z0, M["teal"], g, bevel=0)


def build():
    M = mats_sh()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["s1"] = s1_onboard(M)
    a["s2"] = s2_inspect(M)
    a["s3"] = s3_test(M)
    a["s4"] = s4_grade(M)
    a["d1"] = d1_reman(M)
    a["d2"] = d2_reuse(M)
    a["d3"] = d3_recycle(M)
    a["fork"] = (18.6, LV, Z0)
    return a
