"""기술경제성 분석 — '돈이 오가는 공장' 등각 장면 (Blender 5 / bpy).

다 쓴 배터리 팩이 공장을 한 바퀴 돌며 단계마다 비용이 붙고, 마지막에 금속으로 팔려 수익이 된다.
 뒤 줄(왼쪽 → 오른쪽): ① 운송(먼 길 · 거리 표지 · 트럭) → ② 해체(작업대 · 열린 팩 · 시계 = 인건비) → ③ 파쇄 · 블랙매스(03의 파쇄기)
 앞 줄(오른쪽 → 왼쪽): ④ 정제(03의 침출조 · 약품 드럼 · 배전함) → ⑤ 판매(니켈 · 코발트 · 리튬 · 망간 상자) → ⑥ 저울
 단계마다 옆에 빈 '동전 쟁반'이 있고(공정 재생에서 동전이 쌓임: 산호색 = 비용, 청록 = 수익),
 앞 왼쪽 큰 저울(⑥)의 왼쪽 접시에 비용, 오른쪽 접시에 수익이 모인다.
동전 수와 저울의 기울기는 개념이며 실제 수치가 아니다(실제 수치는 페이지 그림에).
03 공정 지도(../rc/plant.py) · 01 작업장(../rm/workshop.py) · 09 이력관리(../tr/passport.py) · 10 인증(../ce/certify.py)
· 11 전과정평가(../lc/footprint.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래. 배치는 설명용으로 단순화했다.
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
from plant import box, cyl, ring, pipe, poly_pipe, L

S = PL.S
Z0 = PL.SLAB
VB = 2.2            # 뒤 줄 설비
VF = 8.7            # 앞 줄 설비
VROAD = VB + 0.55   # 트럭이 달려 온 길
LANE_B = 3.95       # 뒤 줄 앞으로 팩이 지나는 길
LANE_F = 6.85       # 앞 줄 뒤로 돌아오는 길
TURN = 18.4         # 길이 앞으로 꺾이는 자리
PLAT = dict(u0=0.0, u1=19.9, v0=0.0, v1=11.25)
# 단계별 동전 쟁반 자리 (u, v): 뒤 줄은 가운데 통로, 앞 줄은 설비 앞
TRAYS = {"t1": (5.6, 4.7), "t2": (9.6, 5.25), "t3": (14.4, 5.25), "t4": (16.4, 10.3), "t5": (10.7, 10.3)}
TRAY_R = 0.46
COIN_R = 0.34
COIN_H = 0.075
# 저울 (⑥)
BAL = (5.4, VF)                 # 받침 중심
BAL_H = 2.5                     # 기둥 높이 (받침 위)
BEAM = 2.2                      # 중심에서 접시 줄까지 (u 방향)
HANG = 1.15                     # 보에서 접시까지
PAN_R = 0.62


def mats_te():
    M = LC.mats_lc()
    P = S.P
    M["cost"] = P("cost", PL.hexlin("#E0715A"), rough=0.35, coat=0.3)
    M["gain"] = P("gain", PL.hexlin("#39C6B6"), rough=0.3, coat=0.3)
    M["tray"] = P("tray", PL.hexlin("#E9EDF4"), rough=0.4, coat=0.2)
    M["clock"] = P("clockface", PL.hexlin("#FFFFFF"), rough=0.4)
    M["post_c"] = P("kmpost", PL.hexlin("#F3B64A"), rough=0.4)
    M["crate"] = P("crate", PL.hexlin("#D9C2A0"), rough=0.75, bump=0.2, bump_scale=30)
    return M


def regroup(fn, g):
    return CE.regroup(fn, g)


# ─────────────────────────── 부품 ───────────────────────────
def tray(M, key, g):
    """빈 동전 쟁반: 받침 + 얕은 테 + 색 띠(산호 = 비용, 청록 = 수익)"""
    u, v = TRAYS[key]
    cyl(TRAY_R + 0.08, 0.06, u, v, Z0, M["body2"], g, seg=40)
    cyl(TRAY_R, 0.04, u, v, Z0 + 0.06, M["tray"], g, seg=40)
    ring(TRAY_R + 0.01, 0.08, u, v, Z0 + 0.06, M["steel"], g, t=0.02, seg=40)
    box(0.42, 0.05, 0.09, u, v + TRAY_R + 0.12, Z0, M["gain"] if key == "t5" else M["cost"], g, bevel=0.015)


def tray_z0():
    return Z0 + 0.1


# ─────────────────────────── ① 운송 ───────────────────────────
POSTS = (0.9, 2.2, 3.5)
TRUCK_U = 4.9


def t1_transport(M):
    """먼 길을 달려 온 트럭 — 길가 거리 표지가 이어진다"""
    g = "t1"
    box(6.6, 1.3, 0.025, 3.4, VROAD, Z0, M["road"], g, bevel=0.01)
    for k in range(6):
        box(0.5, 0.06, 0.01, 0.7 + k * 1.05, VROAD, Z0 + 0.025, M["body"], g, bevel=0)
    for u in POSTS:
        box(0.08, 0.08, 0.6, u, VROAD - 0.95, Z0, M["steel"], g, bevel=0.02)
        box(0.3, 0.05, 0.22, u, VROAD - 0.92, Z0 + 0.55, M["post_c"], g, bevel=0.02)
    LC.truck(M, TRUCK_U, VROAD, g, load="pack")
    # 짐 내리는 받침
    box(1.0, 0.95, 0.1, 6.55, VB - 1.05, Z0, M["body2"], g, bevel=0.03)
    WK.module_(M, 6.55, VB - 1.05, Z0 + 0.1, M["navy"], g)
    tray(M, "t1", g)
    return (TRUCK_U, VROAD, Z0 + 1.4)


# ─────────────────────────── ② 해체 ───────────────────────────
CLOCK = (7.45, VB - 1.15)
CLOCK_Z = Z0 + 1.75
BENCH = (9.75, VB)


def t2_dismantle(M):
    """해체 작업대: 뚜껑을 연 팩 + 떼어 낸 모듈 + 안전모 + 기둥 시계(일한 시간 = 인건비)"""
    g = "t2"
    u, v = BENCH
    box(3.3, 2.15, 0.62, u, v, Z0, M["body2"], g, bevel=0.04)
    box(3.36, 2.21, 0.06, u, v, Z0 + 0.62, M["steel"], g, bevel=0.02)
    WK.pack(M, u - 0.05, v, Z0 + 0.68, g, empty=(3, 1))
    # 떼어 낸 모듈 더미
    for k in range(3):
        WK.module_(M, u + 2.1, v + 0.45, Z0 + k * 0.31, M["mod"], g)
    box(0.6, 0.6, 0.05, u + 2.1, v - 0.55, Z0, M["body2"], g, bevel=0.02)
    CE.hat(M, u + 2.1, v - 0.55, Z0 + 0.05, M["amber"], g)
    # 기둥 시계 (+v 쪽을 봄). 바늘은 공정 재생 덧그림에서 그린다
    cu, cv = CLOCK
    box(0.4, 0.4, 0.06, cu, cv, Z0, M["body2"], g, bevel=0.02)
    box(0.12, 0.12, CLOCK_Z - Z0 - 0.3, cu, cv, Z0 + 0.06, M["steel"], g, bevel=0.02)
    cyl(0.4, 0.1, cu, cv + 0.02, CLOCK_Z, M["navy"], g, axis="v", seg=48)
    cyl(0.34, 0.02, cu, cv + 0.08, CLOCK_Z, M["clock"], g, axis="v", seg=48)
    for k in range(12):
        a = k * math.pi / 6
        h = 0.11 if k % 3 == 0 else 0.06
        box(0.03, 0.01, h, cu + 0.27 * math.sin(a), cv + 0.095, CLOCK_Z + 0.27 * math.cos(a) - h / 2, M["navy2"], g, bevel=0)
    cyl(0.035, 0.03, cu, cv + 0.1, CLOCK_Z, M["navy"], g, axis="v", seg=16)
    tray(M, "t2", g)
    return (u, v, Z0 + 1.5)


# ─────────────────────────── ③ 파쇄 · 블랙매스 ───────────────────────────
def t3_shred(M):
    """03 재활용의 파쇄 · 선별을 그대로 옮겨 놓음 — 블랙매스 더미와 톤백"""
    g = "t3"
    regroup(lambda: PL.s3_shred(M, 13.5, VB), g)
    tray(M, "t3", g)
    return (14.2, VB, Z0 + 1.9)


# ─────────────────────────── ④ 정제 ───────────────────────────
LEACH = (16.5, VF)
POWER = (18.95, VF - 0.2)
DRUMS = ((14.05, 9.55), (14.05, 9.05), (13.55, 9.55))


def t4_refine(M):
    """03의 침출조 + 약품 드럼 + 전기를 받는 배전함"""
    g = "t4"
    lu, lv = LEACH
    regroup(lambda: PL.h1_leach(M, lu, lv), g)
    for k, (du, dv) in enumerate(DRUMS):
        CE.drum(M, du, dv, Z0, ("amber", "blue", "amber")[k], g)
    pu, pv = POWER
    box(0.42, 0.6, 0.85, pu, pv, Z0, M["body"], g, bevel=0.04)
    box(0.03, 0.5, 0.22, pu + 0.22, pv, Z0 + 0.48, M["power"], g, bevel=0.01)
    poly_pipe([(pu, pv, Z0 + 0.85), (pu, pv, Z0 + 1.1), (lu + 1.55, pv, Z0 + 1.1)], 0.03, M["wire"], g)
    tray(M, "t4", g)
    return (lu, lv, Z0 + 2.3)


# ─────────────────────────── ⑤ 판매 ───────────────────────────
SELL = (10.7, VF)
CRATES = [("ni", -0.52, -0.5), ("co", 0.52, -0.5), ("li", -0.52, 0.5), ("mn", 0.52, 0.5)]


def t5_sell(M):
    """되찾은 금속 화합물을 상자에 담아 내보냄 (니켈 · 코발트 · 리튬 · 망간)"""
    g = "t5"
    su, sv = SELL
    box(2.35, 2.25, 0.12, su, sv, Z0, M["body2"], g, bevel=0.03)
    for key, du, dv in CRATES:
        u, v = su + du, sv + dv
        box(0.88, 0.85, 0.55, u, v, Z0 + 0.12, M["crate"], g, bevel=0.04)
        box(0.8, 0.77, 0.06, u, v, Z0 + 0.67, M[key], g, bevel=0.02)
        box(0.3, 0.02, 0.16, u, v + 0.43, Z0 + 0.3, M[key], g, bevel=0.01)
    tray(M, "t5", g)
    return (su, sv, Z0 + 1.2)


# ─────────────────────────── ⑥ 저울 ───────────────────────────
def bal_z():
    return Z0 + 0.3 + BAL_H


def beam_parts(M, g, a=0.0, tag=True, mats=None):
    """보 · 바늘 · 줄 · 접시 (a: 기울기 rad, +면 오른쪽(수익) 접시가 내려감). 만든 물체 목록을 돌려준다"""
    bu, bv = BAL
    zp = bal_z()
    before = set(bpy.context.scene.objects)
    b = box(2 * BEAM + 0.3, 0.16, 0.16, bu, bv, zp - 0.08, M["navy"], g, bevel=0.04)
    b.rotation_euler[0] = -a
    nd = box(0.06, 0.04, 0.7, bu, bv + 0.12, zp, M["amber"], g, bevel=0.01)
    nd.rotation_euler[0] = -a
    nd.location = L(bu + 0.35 * math.sin(a), bv + 0.12, zp + 0.35 * math.cos(a))
    for side, m in ((-1, M["cost"]), (1, M["gain"])):
        eu = bu + side * BEAM * math.cos(a)
        ez = zp - side * BEAM * math.sin(a)
        cyl(0.07, 0.12, eu, bv, ez, M["steel"], g, axis="v", seg=20)
        pz = ez - HANG + 0.05
        for du, dv in ((0, -0.46), (0, 0.46), (-0.46, 0), (0.46, 0)):
            pipe([(eu, bv, ez), (eu + du, bv + dv, pz)], 0.012, M["steel"], g)
        cyl(PAN_R, 0.05, eu, bv, ez - HANG, M["tray"], g, seg=48)
        ring(PAN_R + 0.01, 0.09, eu, bv, ez - HANG, m, g, t=0.03, seg=48)
    out = [o for o in bpy.context.scene.objects if o not in before]
    for o in out:
        o.visible_shadow = False   # 공정 재생에서 보가 기울 때 바닥 그림자가 남지 않게
        if tag:
            o["beam"] = 1
    return out


def pan_xyz(side, a=0.0):
    """접시 바닥 윗면 자리 (u, v, z)"""
    bu, bv = BAL
    return (bu + side * BEAM * math.cos(a), bv, bal_z() - side * BEAM * math.sin(a) - HANG + 0.05)


def balance(M):
    """큰 저울: 받침 + 기둥 + 눈금판, 보 양쪽에 접시(왼쪽 비용 · 오른쪽 수익)"""
    g = "bal"
    bu, bv = BAL
    box(3.2, 1.9, 0.3, bu, bv, Z0, M["body"], g, bevel=0.06, seg=4)
    box(3.24, 1.94, 0.06, bu, bv, Z0 + 0.3, M["body2"], g, bevel=0.03)
    box(3.24, 0.06, 0.08, bu, bv + 0.97, Z0 + 0.24, M["navy"], g, bevel=0.02)
    box(0.36, 0.36, BAL_H - 0.2, bu, bv, Z0 + 0.36, M["body2"], g, bevel=0.05)
    box(0.5, 0.5, 0.3, bu, bv, bal_z() - 0.3, M["steel"], g, bevel=0.05)
    # 눈금판 (바늘 뒤)
    box(0.9, 0.04, 0.5, bu, bv - 0.05, bal_z() + 0.12, M["body"], g, bevel=0.02)
    for k in range(-2, 3):
        box(0.03, 0.01, 0.12 if k else 0.2, bu + k * 0.16, bv - 0.02, bal_z() + 0.46 - (0.08 if k else 0), M["navy2"], g, bevel=0)
    # 받침 앞 색 띠: 왼쪽 비용 · 오른쪽 수익
    box(1.2, 0.04, 0.12, bu - 0.8, bv + 0.96, Z0 + 0.1, M["cost"], g, bevel=0.01)
    box(1.2, 0.04, 0.12, bu + 0.8, bv + 0.96, Z0 + 0.1, M["gain"], g, bevel=0.01)
    beam_parts(M, g, 0.0)
    return (bu, bv, bal_z() + 0.8)


# ─────────────────────────── 바닥 선 ───────────────────────────
LANE_PTS = [(7.0, VROAD + 0.45), (7.0, LANE_B), (TURN, LANE_B), (TURN, LANE_F), (BAL[0], LANE_F), (BAL[0], BAL[1] - 1.1)]


def lanes(M):
    TR.dashes(M, LANE_PTS, M["navy2"], "lane")


_M = None


def build():
    global _M
    M = _M = mats_te()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["t1"] = t1_transport(M)
    a["t2"] = t2_dismantle(M)
    a["t3"] = t3_shred(M)
    a["t4"] = t4_refine(M)
    a["t5"] = t5_sell(M)
    a["bal"] = balance(M)
    a["zb"] = (1.3, 10.6, 0.0)     # 저울 이름표 자리 (앞 왼쪽 빈 바닥)
    a["zr"] = (0.9, 1.2, 0.0)      # 먼 길 이름표 (길 시작)
    return a
