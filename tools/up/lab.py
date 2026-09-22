"""업사이클링 등각 장면 — Blender 5 / bpy.

폐배터리 · 폐PET · 철 캔 입고 → 해체 · 선별(양극 분말 · 흑연 · 철 케이스) → 다섯 갈래 전환:
촉매(에너지 장치용) · 흐름전지 직접 투입 · PET와 함께 금속-유기 전극 · 흑연+철 케이스 음극 · 광열 촉매로 PET 분해.
03 공정 지도(../rc/plant.py) · 01 작업장(../rm/workshop.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래.
"""
import math, os, sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import plant as PL
import workshop as WK
from plant import box, cyl, ring, open_box, pipe, poly_pipe

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=24.2, v0=0.0, v1=9.8)


def mats_up():
    M = WK.mats_rm()
    P = S.P
    M["pet"] = P("pet", PL.hexlin("#CFE3F7"), rough=0.12, coat=0.8)
    M["pet_cap"] = P("pet_cap", PL.hexlin("#5B7CFA"), rough=0.35)
    M["graphite"] = P("graphite", PL.hexlin("#4A505C"), rough=0.7, bump=0.3, bump_scale=30)
    M["mn_liq"] = P("mn_liq", PL.hexlin("#F2BFCB"), rough=0.12, coat=0.6)
    M["cat"] = P("catalyst", PL.hexlin("#2BB594"), rough=0.5, bump=0.3, bump_scale=40)
    M["mof"] = P("mof", PL.hexlin("#C23D69"), rough=0.35, coat=0.4)
    M["fe"] = P("fe_oxide", PL.hexlin("#B5643A"), rough=0.6)
    M["sun"] = P("sun", PL.hexlin("#FFF4D6"), rough=0.4, emit=(PL.hexlin("#FFD98A"), 3.0))
    M["glass2"] = P("glass2", PL.hexlin("#E6F0FB"), rough=0.08, coat=0.9)
    return M


def bottle(M, u, v, z, g, lying=False):
    if lying:
        cyl(0.11, 0.42, u, v, z + 0.11, M["pet"], g, axis="u", seg=20)
        cyl(0.045, 0.08, u + 0.25, v, z + 0.11, M["pet_cap"], g, axis="u", seg=12)
    else:
        cyl(0.11, 0.36, u, v, z, M["pet"], g, seg=20)
        cyl(0.11, 0.08, u, v, z + 0.36, M["pet"], g, seg=20, r2=0.05)
        cyl(0.05, 0.06, u, v, z + 0.44, M["pet_cap"], g, seg=12)


# ─────────────────────────── 입고 ───────────────────────────
def intake(M):
    g = "cin"
    u, v = 2.6, 6.6
    # 폐배터리 모듈 더미 (팔레트)
    box(2.4, 1.8, 0.14, u, v, Z0, M["body2"], g, bevel=0.03)
    for i in range(3):
        for j in range(2):
            WK.module_(M, u - 0.75 + i * 0.75, v - 0.42 + j * 0.84, Z0 + 0.14, M["mod_old"] if (i + j) % 2 else M["mod"], g)
    WK.module_(M, u - 0.35, v, Z0 + 0.47, M["mod"], g)
    WK.module_(M, u + 0.4, v + 0.1, Z0 + 0.47, M["mod_old"], g)
    # 폐PET 압축 더미 (끈으로 묶음) + 흩어진 병
    bu, bv = u - 0.2, v + 2.3
    for k, (du, dz) in enumerate(((-0.6, 0), (0.6, 0), (0.0, 0.9))):
        box(1.1, 1.0, 0.9, bu + du, bv, Z0 + dz, M["pet"], g, bevel=0.08, seg=3)
        for s in (-0.25, 0.25):
            box(1.12, 0.03, 0.92, bu + du + s * 0.0, bv + s, Z0 + dz - 0.01, M["pet_cap"], g, bevel=0)
    for k in range(4):
        bottle(M, bu + 1.4 + k * 0.3, bv - 0.6 + (k % 2) * 0.35, Z0, g, lying=True)
    # 철 캔(원통형 셀 케이스) 바구니
    cu, cv = u + 1.9, v - 1.9
    open_box(1.2, 1.0, 0.45, cu, cv, Z0, M["steel"], g, wall=0.05)
    for i in range(4):
        for j in range(3):
            cyl(0.1, 0.5, cu - 0.4 + i * 0.26, cv - 0.3 + j * 0.3, Z0 + 0.05, M["alu"], g, seg=16)
    return (u + 0.2, v + 1.0, Z0 + 1.6)


# ─────────────────────────── 해체 · 선별 ───────────────────────────
def s1_sort(M):
    g = "s1"
    u, v = 7.2, 5.0
    # 해체대 + 셀을 여는 작업대
    box(3.0, 1.8, 0.6, u, v, Z0, M["body2"], g, bevel=0.05)
    WK.module_(M, u - 0.8, v - 0.3, Z0 + 0.6, M["mod"], g)
    open_box(1.2, 0.9, 0.3, u + 0.6, v - 0.2, Z0 + 0.6, M["body"], g, wall=0.05)
    for k in range(3):
        box(0.9, 0.06, 0.2, u + 0.6, v - 0.45 + k * 0.25, Z0 + 0.66, M["cu"] if k == 1 else M["alu"], g, bevel=0.01)  # 벗긴 전극 시트
    # 선별 호퍼 → 세 통 (양극 분말 · 흑연 · 철 케이스)
    hop = S.obj_from(S.cyl_mesh(0.28, 0.6, 4, r2=0.6, smooth=False), PL.L(u + 0.2, v + 1.9, Z0 + 1.5), M["body"], "hop", (0, 0, math.pi / 4), g)
    box(0.12, 0.12, 1.2, u - 0.2, v + 1.5, Z0, M["steel"], g, bevel=0.02)
    box(0.12, 0.12, 1.2, u + 0.6, v + 1.5, Z0, M["steel"], g, bevel=0.02)
    box(2.9, 0.9, 0.08, u + 0.2, v + 2.3, Z0 + 0.62, M["rubber"], g, bevel=0.03)
    for k, (m, name) in enumerate(((M["bm"], "양극"), (M["graphite"], "흑연"), (M["alu"], "철"))):
        bu = u - 0.8 + k * 1.0
        open_box(0.8, 0.8, 0.5, bu, v + 3.3, Z0, M["body"], g, wall=0.05)
        if k < 2:
            pile = S.obj_from(S.cyl_mesh(0.3, 0.3, 30, r2=0.04), PL.L(bu, v + 3.3, Z0 + 0.45 + 0.15), m, "pile", (0, 0, 0), g)
            for p in pile.data.polygons:
                p.use_smooth = True
        else:
            for i in range(2):
                for j in range(2):
                    cyl(0.1, 0.44, bu - 0.14 + i * 0.28, v + 3.16 + j * 0.28, Z0 + 0.05, M["alu"], g, seg=16)
        box(0.82, 0.05, 0.08, bu, v + 2.88, Z0 + 0.42, [M["blue"], M["navy"], M["amber"]][k], g, bevel=0.01)
    return (u, v, Z0 + 1.5)


# ─────────────────────────── 전환 다섯 갈래 ───────────────────────────
def d1_catalyst(M):
    """양극 → 촉매 (순간 고온 가열) → 아연-공기 · 흐름전지 · 리튬-황 전지"""
    g = "d1"
    u, v = 12.4, 2.3
    # 순간 가열로 (유리창 안이 빛남)
    box(1.8, 1.4, 1.1, u, v, Z0, M["body"], g, bevel=0.06, seg=4)
    box(1.84, 1.44, 0.1, u, v, Z0 + 1.1, M["blue"], g, bevel=0.03)
    box(0.8, 0.03, 0.5, u - 0.2, v + 0.71, Z0 + 0.35, M["glow"], g, bevel=0.01)
    box(0.35, 0.03, 0.5, u + 0.55, v + 0.71, Z0 + 0.35, M["screen"], g, bevel=0.01)
    for k in range(2):
        cyl(0.06, 0.5, u - 0.5 + k * 1.0, v - 0.4, Z0 + 1.2, M["amber"], g, seg=12)  # 전극봉
    # 촉매 분말 접시
    cyl(0.4, 0.06, u + 1.6, v + 0.2, Z0 + 0.6, M["body2"], g, seg=36)
    box(0.9, 0.9, 0.6, u + 1.6, v + 0.2, Z0, M["body2"], g, bevel=0.04)
    cy = S.obj_from(S.cyl_mesh(0.3, 0.12, 30, r2=0.05), PL.L(u + 1.6, v + 0.2, Z0 + 0.72), M["cat"], "cat", (0, 0, 0), g)
    # 쓰이는 곳: 아연-공기 전지 셀 (적층)
    zu, zv = u + 0.4, v - 1.6
    for k in range(4):
        box(0.9, 0.7, 0.12, zu, zv, Z0 + k * 0.14, M["navy"] if k % 2 == 0 else M["alu"], g, bevel=0.02)
    box(0.9, 0.7, 0.06, zu, zv, Z0 + 0.56, M["cat"], g, bevel=0.02)
    for k in range(3):
        box(0.06, 0.72, 0.02, zu - 0.3 + k * 0.3, zv, Z0 + 0.62, M["steel"], g, bevel=0)  # 공기 구멍 줄
    return (u, v, Z0 + 1.7)


def d2_flow(M):
    """폐 LiMn2O4 → 수계 아연-망간 흐름전지에 직접 (전해액 탱크 두 개 + 셀 스택)"""
    g = "d2"
    u, v = 17.6, 2.4
    for k, (dv, m) in enumerate(((-0.9, M["mn_liq"]), (0.9, M["liquid"]))):
        ring(0.55, 1.6, u - 1.0, v + dv, Z0, M["glass2"], g, t=0.04)
        cyl(0.52, 1.35, u - 1.0, v + dv, Z0, m, g, seg=48)
        ring(0.57, 0.08, u - 1.0, v + dv, Z0 + 1.55, M["blue"], g, t=0.07)
        cyl(0.57, 0.08, u - 1.0, v + dv, Z0 + 0.35, M["body2"], g, seg=48)
    # 셀 스택
    box(0.9, 1.4, 0.3, u + 0.9, v, Z0, M["body2"], g, bevel=0.04)
    for k in range(7):
        box(0.12, 1.2, 0.9, u + 0.55 + k * 0.12, v, Z0 + 0.3, M["navy"] if k % 2 == 0 else M["blue_l"], g, bevel=0.02)
    box(0.16, 1.3, 1.0, u + 0.4, v, Z0 + 0.25, M["steel"], g, bevel=0.03)
    box(0.16, 1.3, 1.0, u + 1.4, v, Z0 + 0.25, M["steel"], g, bevel=0.03)
    poly_pipe([(u - 1.0, v - 0.9, Z0 + 1.68), (u - 1.0, v - 0.9, Z0 + 1.9), (u + 0.9, v - 0.9, Z0 + 1.9), (u + 0.9, v - 0.5, Z0 + 1.2)], 0.045, M["pipe"], g)
    poly_pipe([(u - 1.0, v + 0.9, Z0 + 1.68), (u - 1.0, v + 0.9, Z0 + 1.9), (u + 0.9, v + 0.9, Z0 + 1.9), (u + 0.9, v + 0.5, Z0 + 1.2)], 0.045, M["pipe_t"], g)
    # 망간 분리: 따로 모은 리튬 (흰 결정 접시)
    box(0.8, 0.8, 0.5, u + 2.3, v + 0.8, Z0, M["body2"], g, bevel=0.04)
    S.obj_from(S.cyl_mesh(0.26, 0.28, 7, r2=0.03, smooth=False), PL.L(u + 2.3, v + 0.8, Z0 + 0.5 + 0.14), M["li"], "li", (0, 0, 0.4), g)
    return (u, v, Z0 + 2.1)


def d3_mof(M):
    """LiCoO2 + 폐PET → 수열 반응기 → 금속-유기 골격체 전극(CoTPA)"""
    g = "d3"
    u, v = 12.8, 7.9
    # 수열 반응기 (볼트 조인 압력 용기)
    cyl(0.6, 1.4, u, v, Z0 + 0.3, M["steel"], g, seg=48)
    cyl(0.7, 0.14, u, v, Z0 + 1.7, M["body2"], g, seg=48)
    for k in range(8):
        a = k * math.pi / 4
        cyl(0.05, 0.22, u + 0.62 * math.cos(a), v + 0.62 * math.sin(a), Z0 + 1.66, M["navy"], g, seg=10)
    box(1.1, 1.1, 0.3, u, v, Z0, M["body2"], g, bevel=0.04)
    box(0.5, 0.03, 0.3, u, v + 0.61, Z0 + 0.9, M["screen"], g, bevel=0.01)
    # 투입: 양극 분말 병 + PET 병
    cyl(0.18, 0.45, u - 1.3, v - 0.5, Z0, M["bm"], g, seg=24)
    for k in range(3):
        bottle(M, u - 1.3 + k * 0.28, v + 0.4, Z0, g)
    pipe([(u - 1.3, v - 0.5, Z0 + 0.45), (u - 0.9, v - 0.3, Z0 + 1.6), (u - 0.4, v - 0.2, Z0 + 1.75)], 0.035, M["navy"], g)
    # 결과: CoTPA 분말 + 전극 시트 롤
    rb, rv = u + 1.6, v - 0.2
    box(1.2, 1.0, 0.55, rb, rv, Z0, M["body"], g, bevel=0.04)
    cyl(0.22, 0.9, rb, rv, Z0 + 0.8, M["alu"], g, axis="v", seg=32)
    cyl(0.25, 0.7, rb, rv, Z0 + 0.8, M["mof"], g, axis="v", seg=32)
    box(0.7, 0.02, 0.3, rb, rv + 0.5, Z0 + 0.56, M["mof"], g, bevel=0)
    return (u, v, Z0 + 2.0)


def d4_anode(M):
    """폐흑연 + 철 케이스 → 산화철을 박은 환원 그래핀 음극"""
    g = "d4"
    u, v = 18.0, 7.5
    # 관상로 (가로로 누운 원통 + 가운데 발열부)
    box(2.4, 0.9, 0.55, u, v, Z0, M["body2"], g, bevel=0.04)
    cyl(0.22, 2.6, u, v, Z0 + 0.95, M["glass2"], g, axis="u", seg=32)
    cyl(0.4, 1.2, u, v, Z0 + 0.95, M["body"], g, axis="u", seg=40)
    cyl(0.41, 0.08, u - 0.62, v, Z0 + 0.95, M["blue"], g, axis="u", seg=40)
    cyl(0.41, 0.08, u + 0.62, v, Z0 + 0.95, M["blue"], g, axis="u", seg=40)
    box(0.34, 0.03, 0.18, u, v + 0.42, Z0 + 0.95, M["glow"], g, bevel=0.01)
    # 투입: 흑연 · 잘게 자른 철 케이스
    open_box(0.7, 0.7, 0.3, u - 1.9, v - 0.9, Z0, M["body"], g, wall=0.05)
    pile = S.obj_from(S.cyl_mesh(0.26, 0.24, 30, r2=0.04), PL.L(u - 1.9, v - 0.9, Z0 + 0.25 + 0.12), M["graphite"], "gp", (0, 0, 0), g)
    for k in range(5):
        box(0.12, 0.08, 0.05, u - 2.6 + (k % 3) * 0.15, v - 0.2 + (k // 3) * 0.16, Z0 + 0.02, M["alu"], g, bevel=0.01, rotz=k * 0.7)
    # 결과: 음극 시트 (흑연 바탕 + 산화철 점)
    su, sv = u + 1.9, v + 0.9
    box(1.2, 0.9, 0.1, su, sv, Z0, M["cu"], g, bevel=0.02)
    box(1.1, 0.8, 0.06, su, sv, Z0 + 0.1, M["graphite"], g, bevel=0.02)
    for i in range(4):
        for j in range(3):
            cyl(0.05, 0.03, su - 0.4 + i * 0.27, sv - 0.25 + j * 0.25, Z0 + 0.16, M["fe"], g, seg=10)
    return (u, v, Z0 + 1.5)


def d5_photo(M):
    """폐 LiCoO2 → 광열 촉매 → 햇빛으로 폐PET를 단량체로 분해"""
    g = "d5"
    u, v = 22.2, 5.4
    # 빛 패널 (위에서 비춤) + 기둥
    for du in (-0.8, 0.8):
        box(0.1, 0.1, 2.2, u + du, v - 0.7, Z0, M["steel"], g, bevel=0.02)
    box(2.0, 1.6, 0.1, u, v, Z0 + 2.2, M["blue"], g, bevel=0.03)
    box(1.7, 1.3, 0.03, u, v, Z0 + 2.18, M["sun"], g, bevel=0.01)
    # 유리 반응기: PET 조각 + 촉매
    box(1.4, 1.2, 0.35, u, v, Z0, M["body2"], g, bevel=0.04)
    ring(0.5, 0.8, u, v, Z0 + 0.35, M["glass2"], g, t=0.04)
    cyl(0.47, 0.34, u, v, Z0 + 0.35, M["organic"], g, seg=48)
    for k in range(6):
        a = k * 1.05
        box(0.14, 0.1, 0.03, u + 0.25 * math.cos(a), v + 0.25 * math.sin(a), Z0 + 0.69, M["pet"], g, bevel=0.01, rotz=a)
    cyl(0.18, 0.04, u, v, Z0 + 0.69, M["bm"], g, seg=20)
    # 단량체 병 세 개
    for k in range(3):
        cyl(0.14, 0.4, u - 0.5 + k * 0.4, v + 1.3, Z0, M["glass2"], g, seg=20)
        cyl(0.12, 0.28, u - 0.5 + k * 0.4, v + 1.3, Z0 + 0.02, M["li"], g, seg=20)
        cyl(0.1, 0.06, u - 0.5 + k * 0.4, v + 1.3, Z0 + 0.4, M["pet_cap"], g, seg=12)
    return (u, v, Z0 + 2.4)


def lanes(M):
    """흐름선: 입고 → 해체 · 선별 → 갈림 → 다섯 전환"""
    g = "lane"
    paths = [
        [(4.0, 5.2), (5.6, 5.2)],
        [(9.0, 5.2), (21.0, 5.2)],
        [(10.2, 5.2), (10.2, 2.2), (11.2, 2.2)],
        [(15.4, 5.2), (15.4, 2.2), (16.0, 2.2)],
        [(10.4, 5.2), (10.4, 7.9), (11.8, 7.9)],
        [(15.6, 5.2), (15.6, 7.5), (16.4, 7.5)],
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
    M = mats_up()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["cin"] = intake(M)
    a["s1"] = s1_sort(M)
    a["d1"] = d1_catalyst(M)
    a["d2"] = d2_flow(M)
    a["d3"] = d3_mof(M)
    a["d4"] = d4_anode(M)
    a["d5"] = d5_photo(M)
    a["fork"] = (10.3, 5.2, Z0)
    return a
