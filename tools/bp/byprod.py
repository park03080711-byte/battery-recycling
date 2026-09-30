"""부산물 회수 라인 등각 장면 — Blender 5 / bpy.

① 전해액 회수(CO₂ 추출 용기 · 분리기 · 받는 통) → ② 파쇄 · 선별(포일 스크랩 · 블랙파우더) → ③ 리튬 먼저(COOL: CO₂+물 오토클레이브 · 탄산리튬)
→ ④ 니켈 · 코발트 · 망간 침출(→ 03 재활용) → ⑤ 흑연 재생(산 세척 · 저온 열분해 · 배기 처리).
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
from plant import box, cyl, open_box, ring, pipe, L

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=24.6, v0=3.0, v1=8.9)
LV = 8.2


def mats_bp():
    M = WK.mats_rm()
    P = S.P
    M["co2"] = P("co2", PL.hexlin("#8FA6FC"), rough=0.35, coat=0.4)       # CO₂ 용기
    M["tank"] = P("tank", PL.hexlin("#E6EBF3"), metal=0.2, rough=0.35)
    M["dial"] = P("dial", PL.hexlin("#FFFFFF"), rough=0.4)
    M["elec"] = P("elec", PL.hexlin("#F6D38A"), rough=0.12, coat=0.6)   # 전해액 (호박색)
    M["gr"] = P("graphite", PL.hexlin("#4A505C"), rough=0.7)
    M["brick"] = P("brick", PL.hexlin("#C9D2E3"), rough=0.6)
    return M


def pad(du, dv, u, v, g, M):
    box(du, dv, 0.06, u, v, Z0, M["body2"], g, bevel=0.03)


def band(r, u, v, z, m, g, axis="z"):
    cyl(r, 0.09, u, v, z, m, g, axis=axis, seg=48)


def lamp(u, v, z, m, g, r=0.07):
    cyl(r, 0.05, u, v, z, m, g, axis="v", seg=20)


# ─────────────────────────── ① 전해액 회수 ───────────────────────────
def s1_electrolyte(M):
    g = "s1"
    u, v = 3.6, 5.8
    pad(4.6, 2.6, u - 0.2, v, g, M)
    for k in range(2):                                                         # CO₂ 용기 두 병
        cyl(0.2, 1.5, u - 2.1 + k * 0.5, v - 0.9, Z0, M["co2"], g, seg=32)
        cyl(0.07, 0.14, u - 2.1 + k * 0.5, v - 0.9, Z0 + 1.5, M["steel"], g, seg=16)
    box(0.7, 0.6, 0.6, u - 1.1, v - 0.2, Z0, M["body2"], g, bevel=0.05)       # 압축 펌프
    lamp(u - 1.1, v + 0.11, Z0 + 0.42, M["body"], g, r=0.06)
    box(1.1, 1.1, 0.12, u + 0.1, v, Z0, M["body2"], g, bevel=0.03)            # 추출 용기 받침
    cyl(0.42, 2.0, u + 0.1, v, Z0 + 0.12, M["tank"], g, seg=48)               # 추출 용기 (전지 · 조각이 들어감)
    cyl(0.48, 0.14, u + 0.1, v, Z0 + 2.12, M["steel"], g, seg=48)             # 뚜껑 플랜지
    for zz in (0.5, 1.7):
        band(0.44, u + 0.1, v, Z0 + zz, M["blue"], g)
    cyl(0.3, 1.1, u + 1.4, v - 0.3, Z0, M["tank"], g, seg=40)                 # 분리기 (압력을 낮추면 CO₂가 날아감)
    cyl(0.33, 0.1, u + 1.4, v - 0.3, Z0 + 1.1, M["steel"], g, seg=40)
    ring(0.32, 0.5, u + 1.5, v + 0.75, Z0, M["body"], g, t=0.04, seg=40)       # 받는 통 (위가 열림)
    cyl(0.3, 0.03, u + 1.5, v + 0.75, Z0 + 0.02, M["body2"], g, seg=40)
    band(0.335, u + 1.5, v + 0.75, Z0 + 0.3, M["amber"], g)
    pts = [(u - 1.95, v - 0.9, Z0 + 1.62), (u - 1.95, v - 0.2, Z0 + 1.62), (u - 1.1, v - 0.2, Z0 + 1.62), (u - 1.1, v - 0.2, Z0 + 0.6)]
    pipe(pts, 0.04, M["pipe"], g)
    pipe([(u - 0.75, v - 0.2, Z0 + 0.4), (u - 0.3, v - 0.2, Z0 + 0.4), (u - 0.3, v - 0.2, Z0 + 1.9), (u - 0.2, v - 0.2, Z0 + 1.9)], 0.04, M["pipe"], g)
    pipe([(u + 0.5, v - 0.1, Z0 + 0.5), (u + 1.1, v - 0.3, Z0 + 0.5)], 0.04, M["pipe"], g)
    pipe([(u + 1.4, v, Z0 + 0.25), (u + 1.5, v + 0.45, Z0 + 0.25), (u + 1.5, v + 0.55, Z0 + 0.6)], 0.035, M["pipe"], g)
    return (u + 0.1, v, Z0 + 2.3)


# ─────────────────────────── ② 파쇄 · 선별 ───────────────────────────
def s2_shred(M):
    g = "s2"
    u, v = 8.4, 5.8
    pad(4.2, 2.9, u + 0.5, v + 0.35, g, M)
    box(1.3, 1.3, 1.1, u - 1.0, v, Z0, M["body2"], g, bevel=0.06)              # 파쇄기
    open_box(1.4, 1.4, 0.5, u - 1.0, v, Z0 + 1.1, M["body"], g, wall=0.06)      # 투입구
    lamp(u - 1.0, v + 0.66, Z0 + 0.8, M["body"], g)
    box(2.2, 1.0, 0.14, u + 0.8, v, Z0 + 0.62, M["steel"], g, bevel=0.03)      # 진동 체
    for k in range(7):
        box(0.03, 0.9, 0.02, u - 0.1 + k * 0.3, v, Z0 + 0.76, M["body2"], g, bevel=0)
    for du in (-0.2, 1.8):
        for dv in (-0.4, 0.4):
            box(0.1, 0.1, 0.62, u + du, v + dv, Z0, M["body2"], g, bevel=0.02)
    open_box(1.0, 0.8, 0.5, u + 0.9, v + 1.15, Z0, M["body"], g, wall=0.05)     # 포일 스크랩 통 (앞)
    box(1.02, 0.04, 0.1, u + 0.9, v + 1.57, Z0 + 0.36, M["steel"], g, bevel=0.01)
    for k in range(5):
        m = M["alu"] if k % 2 else M["cu"]
        box(0.26, 0.18, 0.02, u + 0.6 + (k % 3) * 0.28, v + 1.0 + (k // 3) * 0.3, Z0 + 0.06 + k * 0.03, m, g, bevel=0, rotz=0.4 * k)
    open_box(1.1, 1.0, 0.7, u + 2.4, v, Z0, M["body"], g, wall=0.05)           # 블랙파우더 통 (체 끝)
    box(0.98, 0.88, 0.2, u + 2.4, v, Z0 + 0.05, M["bm"], g, bevel=0.02)
    return (u + 0.8, v, Z0 + 1.7)


# ─────────────────────────── ③ 리튬 먼저 (COOL) ───────────────────────────
def s3_cool(M):
    g = "s3"
    u, v = 13.0, 5.8
    pad(4.0, 2.6, u + 0.1, v, g, M)
    for du in (-0.7, 0.7):                                                     # 받침 두 개
        box(0.3, 1.1, 0.45, u + du, v, Z0, M["body2"], g, bevel=0.04)
    cyl(0.6, 2.2, u, v, Z0 + 1.0, M["tank"], g, axis="u", seg=48)              # 오토클레이브 (가로)
    for du in (-1.12, 1.12):
        cyl(0.64, 0.1, u + du, v, Z0 + 1.0, M["steel"], g, axis="u", seg=48)
    for du in (-0.5, 0.5):
        band(0.62, u + du, v, Z0 + 1.0, M["blue"], g, axis="u")
    cyl(0.14, 0.4, u, v, Z0 + 1.55, M["steel"], g, seg=24)                     # 윗 노즐
    cyl(0.2, 1.3, u - 1.9, v - 0.8, Z0, M["co2"], g, seg=32)                   # CO₂ 용기
    pipe([(u - 1.9, v - 0.8, Z0 + 1.35), (u - 1.9, v - 0.8, Z0 + 1.9), (u, v - 0.1, Z0 + 1.9), (u, v - 0.1, Z0 + 1.75)], 0.04, M["pipe"], g)
    box(0.1, 0.1, 1.1, u + 1.0, v + 0.85, Z0, M["steel"], g, bevel=0.02)      # 압력계 기둥
    cyl(0.16, 0.05, u + 1.0, v + 0.9, Z0 + 1.2, M["dial"], g, axis="v", seg=32)
    open_box(1.1, 0.8, 0.22, u + 2.1, v + 0.7, Z0, M["body"], g, wall=0.05)    # 탄산리튬 받는 쟁반
    box(1.0, 0.7, 0.03, u + 2.1, v + 0.7, Z0 + 0.05, M["navy2"], g, bevel=0)   # 쟁반 바닥 (흰 가루가 보이게 어둡게)
    pipe([(u + 1.1, v + 0.2, Z0 + 0.7), (u + 1.8, v + 0.2, Z0 + 0.7), (u + 1.8, v + 0.55, Z0 + 0.4)], 0.035, M["pipe"], g)
    return (u, v, Z0 + 2.0)


# ─────────────────────────── ④ 니켈 · 코발트 · 망간 침출 ───────────────────────────
def s4_leach(M):
    g = "s4"
    u, v = 17.2, 5.8
    pad(3.2, 2.0, u, v, g, M)
    for k in range(2):
        cu_ = u - 0.7 + k * 1.4
        ring(0.55, 1.2, cu_, v, Z0, M["tank"], g, t=0.05, seg=48)                # 침출조 (위가 열림)
        cyl(0.55, 0.03, cu_, v, Z0 + 0.02, M["body2"], g, seg=48)
        cyl(0.51, 0.02, cu_, v, Z0 + 0.8, M["liquid"], g, seg=48)                # 용액 (위에서 보임)
        cyl(0.04, 1.0, cu_, v, Z0 + 1.2, M["steel"], g, seg=12)                   # 교반축
        box(0.5, 0.14, 0.14, cu_, v, Z0 + 2.2, M["body2"], g, bevel=0.03)
    pipe([(u + 0.7, v - 0.5, Z0 + 0.9), (u + 0.7, v - 1.5, Z0 + 0.9), (u + 0.7, v - 2.1, Z0 + 0.9)], 0.05, M["pipe_t"], g)   # 03 재활용으로
    box(0.6, 0.3, 0.9, u + 0.7, v - 2.3, Z0, M["teal"], g, bevel=0.05)
    return (u, v, Z0 + 2.3)


# ─────────────────────────── ⑤ 흑연 재생 ───────────────────────────
def s5_graphite(M):
    g = "s5"
    u, v = 21.4, 5.8
    pad(5.2, 2.8, u, v - 0.2, g, M)
    ring(0.4, 0.8, u - 1.8, v + 0.2, Z0, M["tank"], g, t=0.04, seg=40)          # 산 세척조
    cyl(0.37, 0.02, u - 1.8, v + 0.2, Z0 + 0.6, M["liquid"], g, seg=40)
    box(2.0, 1.0, 0.9, u, v, Z0, M["brick"], g, bevel=0.06)                    # 저온 열분해로
    cyl(0.28, 2.3, u, v, Z0 + 0.62, M["steel"], g, axis="u", seg=40)           # 관
    box(0.9, 0.04, 0.26, u, v + 0.5, Z0 + 0.32, M["navy2"], g, bevel=0.02)     # 창
    cyl(0.32, 2.4, u + 0.6, v - 1.3, Z0, M["tank"], g, seg=40)                 # 배기 처리탑 (불소 가스)
    cyl(0.36, 0.12, u + 0.6, v - 1.3, Z0 + 2.4, M["steel"], g, seg=40)
    band(0.34, u + 0.6, v - 1.3, Z0 + 1.6, M["amber"], g)
    pipe([(u + 0.4, v - 0.4, Z0 + 0.9), (u + 0.4, v - 0.9, Z0 + 0.9), (u + 0.6, v - 1.0, Z0 + 0.9)], 0.05, M["pipe"], g)
    open_box(1.0, 0.9, 0.4, u + 1.9, v + 0.5, Z0, M["body"], g, wall=0.05)     # 재생 흑연 통
    box(0.88, 0.78, 0.1, u + 1.9, v + 0.5, Z0 + 0.05, M["gr"], g, bevel=0.02)
    return (u, v, Z0 + 2.2)


def lanes(M):
    g = "lane"
    pts = [(0.8, LV), (22.6, LV)]
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(u1 - u0, v1 - v0) / 0.5))
        for k in range(n):
            t = (k + 0.25) / n
            box(0.26, 0.06, 0.01, u0 + (u1 - u0) * t, v0 + (v1 - v0) * t, Z0, M["teal"], g, bevel=0)


def build():
    M = mats_bp()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["s1"] = s1_electrolyte(M)
    a["s2"] = s2_shred(M)
    a["s3"] = s3_cool(M)
    a["s4"] = s4_leach(M)
    a["s5"] = s5_graphite(M)
    return a
