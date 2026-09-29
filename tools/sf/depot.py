"""안전 동선 등각 장면 — Blender 5 / bpy.

① 입고 · 격리 검사(열화상 · 손상 팩 격리) → ② 방전 → ③ 전압 반등 확인 → ④ 안전 보관 → ⑤ 운송 포장.
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
from plant import box, cyl, open_box, pipe

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=24.4, v0=0.0, v1=9.4)
LV = 4.7  # 본선 흐름선 v


def mats_sf():
    M = WK.mats_rm()
    P = S.P
    M["cam"] = P("cam", PL.hexlin("#2B3656"), rough=0.25, coat=0.6)
    M["hazard"] = P("hazard", PL.hexlin("#F3B64A"), rough=0.4)
    M["sand"] = P("sand", PL.hexlin("#E9D8AE"), rough=0.9, bump=0.3, bump_scale=40)
    M["wall"] = P("firewall", PL.hexlin("#E3E8F1"), rough=0.6)
    M["crate"] = P("crate", PL.hexlin("#C9D2E3"), rough=0.5)
    M["glass"] = P("glass_sf", PL.hexlin("#8FA2CF"), rough=0.12, coat=0.8)
    return M


def lamp(M, u, v, z, m, g, r=0.07):
    cyl(r, 0.05, u, v, z, m, g, axis="v", seg=20)


def screen_post(M, u, v, g, h=1.1):
    """기둥 위 화면 (화면이 +v를 향함)"""
    box(0.12, 0.12, h, u, v, Z0, M["steel"], g, bevel=0.02)
    box(0.72, 0.06, 0.46, u, v + 0.06, Z0 + h, M["body2"], g, bevel=0.02)
    box(0.62, 0.02, 0.36, u, v + 0.1, Z0 + h + 0.05, M["screen"], g, bevel=0.01)


# ─────────────────────────── ① 입고 · 격리 검사 ───────────────────────────
def s1_intake(M):
    """들어온 팩을 겉모습 · 열화상으로 보고, 부풀거나 뜨거운 팩은 격리함으로"""
    g = "s1"
    u, v = 3.2, 6.5
    box(3.3, 2.1, 0.14, u, v, Z0, M["body2"], g, bevel=0.03)          # 팔레트
    WK.pack(M, u, v, Z0 + 0.14, g, lid=True)
    # 열화상 카메라 기둥 (팩을 내려다봄) + 화면
    cu, cv = u + 2.1, v + 0.9
    box(0.1, 0.1, 1.9, cu, cv, Z0, M["steel"], g, bevel=0.02)
    box(0.9, 0.1, 0.08, cu - 0.45, cv, Z0 + 1.9, M["steel"], g, bevel=0.02)
    box(0.24, 0.24, 0.18, cu - 0.85, cv, Z0 + 1.76, M["cam"], g, bevel=0.03)
    screen_post(M, u + 2.1, v - 0.6, g)
    # 격리함: 모래를 채운 뚜껑 열린 철제 함 (흐름선 뒤쪽)
    qu, qv = 2.6, 2.4
    open_box(1.8, 1.4, 0.8, qu, qv, Z0, M["steel"], g, wall=0.06)
    box(1.66, 1.26, 0.55, qu, qv, Z0 + 0.06, M["sand"], g, bevel=0.02)
    box(1.82, 0.04, 0.12, qu, qv + 0.71, Z0 + 0.6, M["hazard"], g, bevel=0.01)
    box(0.04, 1.42, 0.12, qu + 0.91, qv, Z0 + 0.6, M["hazard"], g, bevel=0.01)
    box(0.1, 0.1, 1.2, qu - 0.7, qv - 0.5, Z0, M["steel"], g, bevel=0.02)
    cyl(0.1, 0.14, qu - 0.7, qv - 0.5, Z0 + 1.2, M["body2"], g, seg=24)   # 경고등 자리
    return (u, v, Z0 + 1.2)


# ─────────────────────────── ② 방전 ───────────────────────────
def s2_discharge(M):
    """방전 캐비닛에 팩을 연결해 남은 전기를 뺀다"""
    g = "s2"
    u, v = 8.2, 2.4
    box(2.8, 1.1, 1.9, u, v, Z0, M["body"], g, bevel=0.06, seg=4)
    box(2.84, 1.14, 0.08, u, v, Z0 + 1.9, M["blue"], g, bevel=0.03)
    for k in range(3):
        bu = u - 0.9 + k * 0.9
        box(0.04, 0.02, 1.6, bu + 0.45, v + 0.56, Z0 + 0.15, M["body2"], g, bevel=0) if k < 2 else None
        box(0.6, 0.02, 0.34, bu, v + 0.56, Z0 + 1.35, M["screen"], g, bevel=0.01)
        for j in range(4):
            box(0.5, 0.02, 0.08, bu, v + 0.56, Z0 + 0.45 + j * 0.16, M["body2"], g, bevel=0.005)   # 잔량 표시 자리
        lamp(M, bu, v + 0.575, Z0 + 1.1, M["body2"], g, r=0.05)
    # 팩 두 개 (수레 위) + 케이블
    for i in range(2):
        pu = u - 0.8 + i * 1.8
        box(1.5, 1.2, 0.35, pu, v + 3.9, Z0, M["body2"], g, bevel=0.04)
        box(1.3, 1.0, 0.3, pu, v + 3.9, Z0 + 0.35, M["navy"], g, bevel=0.05)
        box(0.18, 0.2, 0.12, pu, v + 3.36, Z0 + 0.45, M["amber"], g, bevel=0.02)
        pipe([(pu, v + 3.3, Z0 + 0.55), (pu, v + 2.4, Z0 + 1.3), (pu + 0.1, v + 1.2, Z0 + 1.3), (pu + 0.1, v + 0.56, Z0 + 0.9)], 0.035, M["navy"], g)
    return (u, v, Z0 + 2.1)


# ─────────────────────────── ③ 전압 반등 확인 ───────────────────────────
def s3_rest(M):
    """방전한 모듈을 한동안 두었다가 다시 잰다 — 전압이 되살아나면 다시 방전"""
    g = "s3"
    u, v = 12.8, 6.6
    for k in range(2):
        box(2.6, 1.0, 0.05, u, v, Z0 + 0.3 + k * 0.6, M["body2"], g, bevel=0.02)
    for uu in (u - 1.25, u + 1.25):
        for vv in (v - 0.45, v + 0.45):
            box(0.07, 0.07, 1.3, uu, vv, Z0, M["steel"], g, bevel=0.01)
    for k in range(2):
        for i in range(3):
            WK.module_(M, u - 0.8 + i * 0.8, v, Z0 + 0.35 + k * 0.6, M["mod"], g)
    # 측정 키오스크 (큰 화면)
    ku, kv = u + 2.2, v - 0.6
    box(0.8, 0.6, 1.0, ku, kv, Z0, M["body"], g, bevel=0.05, seg=4)
    box(0.84, 0.64, 0.05, ku, kv, Z0 + 1.0, M["body2"], g, bevel=0.02)
    box(0.9, 0.08, 0.66, ku, kv + 0.1, Z0 + 1.05, M["body2"], g, bevel=0.02)
    box(0.8, 0.02, 0.56, ku, kv + 0.15, Z0 + 1.1, M["screen"], g, bevel=0.01)
    pipe([(ku - 0.3, kv + 0.2, Z0 + 0.7), (u + 1.0, v + 0.1, Z0 + 0.6), (u + 0.8, v + 0.3, Z0 + 0.66)], 0.022, M["navy"], g)
    return (u, v, Z0 + 1.6)


# ─────────────────────────── ④ 안전 보관 ───────────────────────────
def s4_store(M):
    """방화벽으로 나눈 칸에 간격을 두고 보관 — 온도 감시 · 소화 설비"""
    g = "s4"
    u, v = 17.2, 2.2
    w = 0.1
    box(4.8, 1.8, w, u, v, Z0, M["body2"], g, bevel=0.02)
    box(4.8, w, 1.6, u, v - 0.85, Z0, M["wall"], g, bevel=0.02)                # 뒷벽
    for k in range(4):
        box(w, 1.8, 1.6, u - 2.4 + k * 1.6, v, Z0, M["wall"], g, bevel=0.02)   # 칸막이 (방화벽)
    for k in range(3):
        bu = u - 1.6 + k * 1.6
        box(1.1, 1.0, 0.3, bu, v, Z0 + w, M["navy"], g, bevel=0.05)
        box(0.3, 0.03, 0.1, bu, v + 0.515, Z0 + w + 0.12, M["body2"], g, bevel=0.01)     # 팩 상태 자리
        lamp(M, bu, v - 0.79, Z0 + 1.35, M["body2"], g, r=0.06)                          # 온도 감지기 자리
    # 소화 배관 (위) + 헤드
    pipe([(u - 2.5, v + 0.2, Z0 + 1.8), (u + 2.5, v + 0.2, Z0 + 1.8)], 0.04, M["pipe"], g)
    for k in range(3):
        cyl(0.05, 0.12, u - 1.6 + k * 1.6, v + 0.2, Z0 + 1.68, M["steel"], g, seg=12)
    # 모래 · 소화기 함
    fu, fv = u + 3.2, v + 0.6
    box(0.8, 0.8, 1.2, fu, fv, Z0, M["hazard"], g, bevel=0.05, seg=4)
    box(0.6, 0.02, 0.5, fu, fv + 0.41, Z0 + 0.45, M["body"], g, bevel=0.01)
    return (u, v, Z0 + 2.0)


# ─────────────────────────── ⑤ 운송 포장 ───────────────────────────
def s5_ship(M):
    """전용 용기에 포장하고 표시를 붙여 트럭으로 — 손상 배터리는 따로"""
    g = "s5"
    u, v = 20.4, 6.6
    for i in range(2):
        cu = u - 0.7 + i * 1.5
        box(1.2, 1.1, 0.9, cu, v, Z0, M["crate"], g, bevel=0.04, seg=3)
        box(1.24, 1.14, 0.08, cu, v, Z0 + 0.9, M["steel"], g, bevel=0.02)
        box(0.5, 0.02, 0.3, cu, v + 0.56, Z0 + 0.35, M["body"], g, bevel=0.01)    # 표시 자리
    # 트럭 (짐칸이 +u 쪽, 앞이 -v)
    tu, tv = 22.6, 7.2
    box(1.3, 2.6, 1.3, tu, tv + 0.3, Z0 + 0.35, M["body"], g, bevel=0.05, seg=3)   # 짐칸
    box(1.3, 0.9, 1.0, tu, tv - 1.45, Z0 + 0.35, M["blue"], g, bevel=0.1, seg=4)   # 운전석
    box(1.1, 0.04, 0.4, tu, tv - 1.9, Z0 + 0.8, M["glass"], g, bevel=0.02)
    for dv in (-1.4, 0.0, 1.0):
        for du in (-0.66, 0.66):
            cyl(0.26, 0.2, tu + du, tv + dv, Z0 + 0.26, M["rubber"], g, axis="u", seg=32)
    for du in (-0.45, 0.45):
        lamp(M, tu + du, tv - 1.9, Z0 + 0.5, M["body2"], g, r=0.08)   # 전조등 자리 (앞 -v 면이지만 윗면이 보임)
    return (u, v, Z0 + 1.4)


def lanes(M):
    """흐름선: 입고 → ① → ② → ③ → ④ → ⑤"""
    g = "lane"
    pts = [(0.8, LV), (19.6, LV), (19.6, 5.8)]
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(u1 - u0, v1 - v0) / 0.5))
        for k in range(n):
            t = (k + 0.25) / n
            uu, vv = u0 + (u1 - u0) * t, v0 + (v1 - v0) * t
            horiz = abs(u1 - u0) > abs(v1 - v0)
            box(0.26 if horiz else 0.06, 0.06 if horiz else 0.26, 0.01, uu, vv, Z0, M["teal"], g, bevel=0)
    # 격리함으로 가는 짧은 갈래 (주황 점선 — 손상 팩)
    for k in range(4):
        box(0.06, 0.26, 0.01, 2.6, LV - 0.45 - k * 0.5, Z0, M["hazard"], g, bevel=0)


def build():
    M = mats_sf()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["s1"] = s1_intake(M)
    a["s2"] = s2_discharge(M)
    a["s3"] = s3_rest(M)
    a["s4"] = s4_store(M)
    a["s5"] = s5_ship(M)
    return a
