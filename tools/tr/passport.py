"""이력관리 — '기록이 모이는 길' 등각 장면 (Blender 5 / bpy).

배터리 한 개가 ① 제조(식별번호 · QR) → ② 차량 등록 → ③ 운행 · 정비 · 검사 → ④ 탈거 · 성능평가를 지나
⑤ 재사용(새 여권이 이어짐) 또는 ⑥ 재활용(여권 종료 · 재생원료 기록이 새 셀로)으로 가는 동안,
각 장소의 기록 기둥에서 파란 데이터 선을 따라 가운데 뒤쪽의 '배터리 여권 서버'로 기록이 모인다.
03 공정 지도(../rc/plant.py) · 01 작업장(../rm/workshop.py) · 05 진단 라인(../sh/line.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래. 배치는 설명용으로 단순화했다.
"""
import math, os, sys, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import plant as PL
import workshop as WK
from plant import box, cyl, open_box, ring, pipe, L

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=28.8, v0=0.0, v1=10.6)
LV = 7.0          # 배터리가 지나는 길 (청록 점선)
BUS = 4.4         # 데이터 선 본선 (파란 점선)
LOOP = 10.0       # 재생원료가 새 셀로 돌아가는 길 (분홍 점선, 판 앞 가장자리)
FORK = (23.6, LV)
HUB = (13.6, 1.9)  # 여권 서버
# 각 장소의 기록 기둥 (u, v) — 여기서 데이터 선이 본선으로 이어진다
POSTS = {"s1": (5.8, 5.3), "s2": (11.3, 5.0), "s3": (17.9, 5.1), "s4": (22.5, 5.1), "d1": (27.4, 3.3), "d2": (27.9, 6.5)}
# 여권 한 장씩 (가운데 서버 위에 쌓임) — 단계 색
PAGE_COL = {"s1": "#5B7CFA", "s2": "#F3B64A", "s3": "#39C6B6", "s4": "#39C6B6", "d1": "#2BB594", "d2": "#E58FA8"}


def mats_tr():
    M = WK.mats_rm()
    P = S.P
    M["ess"] = P("ess", PL.hexlin("#E6ECF7"), rough=0.45, coat=0.2)
    M["hazard"] = P("hazard", PL.hexlin("#F3B64A"), rough=0.4)
    M["glass"] = P("glass_tr", PL.hexlin("#8FA2CF"), rough=0.12, coat=0.8)
    M["glass_d"] = P("glass_dark", PL.hexlin("#26324F"), rough=0.1, coat=0.9)
    M["qr_w"] = P("qr_white", PL.hexlin("#FFFFFF"), rough=0.4)
    M["qr_k"] = P("qr_black", PL.hexlin("#1F2A44"), rough=0.5)
    M["data"] = P("data", PL.hexlin("#5B7CFA"), rough=0.35, coat=0.3)
    M["loop"] = P("loop", PL.hexlin("#E58FA8"), rough=0.35, coat=0.3)
    M["rack_l"] = P("rack_led", PL.hexlin("#8EA6FF"), rough=0.3, emit=(PL.hexlin("#8EA6FF"), 1.6))
    M["rack_t"] = P("rack_led_t", PL.hexlin("#39C6B6"), rough=0.3, emit=(PL.hexlin("#39C6B6"), 1.4))
    M["holo"] = P("holo", PL.hexlin("#C9D6FF"), rough=0.3, alpha=0.35)
    M["cell"] = P("cell", PL.hexlin("#A9BBFD"), rough=0.3, coat=0.5)
    M["cell_cap"] = P("cell_cap", PL.hexlin("#C7CFDC"), metal=0.55, rough=0.3)
    return M


# ─────────────────────────── 부품 ───────────────────────────
_QR = {}


def qr_bits(seed, n=9):
    """식별용 무늬 (실제 QR이 아니라 모양만 닮은 무늬): 세 모서리 찾기 무늬(3×3 채움) + 한 칸 띄우고 무작위 칸"""
    if seed in _QR:
        return _QR[seed]
    rnd = random.Random(seed)
    g = [[rnd.random() < 0.5 for _ in range(n)] for _ in range(n)]
    for (r0, c0) in ((0, 0), (0, n - 3), (n - 3, 0)):
        for r in range(-1, 4):
            for c in range(-1, 4):
                rr, cc = r0 + r, c0 + c
                if 0 <= rr < n and 0 <= cc < n:
                    g[rr][cc] = 0 <= r < 3 and 0 <= c < 3
    _QR[seed] = g
    return g


def qr_top(M, u, v, z, s, g, seed=1, n=9):
    """윗면에 붙은 식별 무늬 (한 변 s)"""
    box(s, s, 0.012, u, v, z, M["qr_w"], g, bevel=0.004, seg=1)
    c = s * 0.84 / n
    bits = qr_bits(seed, n)
    for i in range(n):
        for j in range(n):
            if bits[i][j]:
                box(c * 0.96, c * 0.96, 0.006, u - s * 0.42 + c * (i + 0.5), v - s * 0.42 + c * (j + 0.5), z + 0.012, M["qr_k"], g, bevel=0, seg=1)


def qr_front_v(M, u, v, z, s, g, seed=2, n=9):
    """+v 면(화면 왼쪽 아래를 보는 벽)에 붙은 식별 무늬 — 바닥 높이 z, 한 변 s"""
    box(s, 0.012, s, u, v, z, M["qr_w"], g, bevel=0.004, seg=1)
    c = s * 0.84 / n
    bits = qr_bits(seed, n)
    for i in range(n):
        for j in range(n):
            if bits[i][j]:
                box(c * 0.96, 0.006, c * 0.96, u - s * 0.42 + c * (i + 0.5), v + 0.009, z + s * 0.08 + c * (n - 1 - j), M["qr_k"], g, bevel=0, seg=1)


def post(M, key, g):
    """기록 기둥: 작은 화면 + 위에 둥근 등 (여기서 기록이 서버로 올라간다)"""
    u, v = POSTS[key]
    box(0.5, 0.5, 0.06, u, v, Z0, M["body2"], g, bevel=0.02)
    box(0.16, 0.16, 1.5, u, v, Z0 + 0.06, M["body"], g, bevel=0.03)
    box(0.42, 0.06, 0.3, u, v + 0.1, Z0 + 1.05, M["body2"], g, bevel=0.02)
    box(0.34, 0.02, 0.22, u, v + 0.14, Z0 + 1.09, M["screen"], g, bevel=0.01)
    cyl(0.12, 0.08, u, v, Z0 + 1.56, M["data"], g, seg=24)
    cyl(0.07, 0.1, u, v, Z0 + 1.64, M["body"], g, seg=24)
    return (u, v, Z0 + 1.75)


def dashes(M, pts, m, g, step=0.5, size=0.26, w=0.06):
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(u1 - u0, v1 - v0) / step))
        for k in range(n):
            t = (k + 0.25) / n
            uu, vv = u0 + (u1 - u0) * t, v0 + (v1 - v0) * t
            horiz = abs(u1 - u0) > abs(v1 - v0)
            box(size if horiz else w, w if horiz else size, 0.01, uu, vv, Z0, m, g, bevel=0)


def dots(M, pts, m, g, step=0.34, s=0.09):
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(u1 - u0, v1 - v0) / step))
        for k in range(n):
            t = (k + 0.5) / n
            box(s, s, 0.01, u0 + (u1 - u0) * t, v0 + (v1 - v0) * t, Z0, m, g, bevel=0)


# ─────────────────────────── ① 제조 ───────────────────────────
def s1_make(M):
    """셀 · 팩 조립 라인 끝: 레이저 각인기가 팩 덮개에 식별번호(QR)를 새긴다"""
    g = "s1"
    u, v = 3.4, LV
    # 컨베이어
    box(4.6, 1.3, 0.5, u, v, Z0, M["body2"], g, bevel=0.05)
    box(4.6, 1.1, 0.04, u, v, Z0 + 0.5, M["rubber"], g, bevel=0.01)
    for k in range(9):
        cyl(0.07, 1.2, u - 2.1 + k * 0.52, v, Z0 + 0.43, M["steel"], g, axis="v", seg=16)
    # 팩 (덮개 닫힘) + 새긴 식별 무늬
    WK.pack(M, u + 0.2, v, Z0 + 0.54, g, lid=True)
    qr_top(M, u + 1.0, v + 0.25, Z0 + 0.96, 0.52, g, seed=11)
    # 레이저 각인 아치
    for dv in (-0.85, 0.85):
        box(0.24, 0.24, 1.9, u + 1.0, v + dv, Z0, M["body"], g, bevel=0.04)
    box(0.44, 2.0, 0.3, u + 1.0, v, Z0 + 1.9, M["blue"], g, bevel=0.05)
    box(0.24, 0.24, 0.2, u + 1.0, v + 0.25, Z0 + 1.7, M["navy"], g, bevel=0.03)
    # 셀 상자 (원통형 셀 묶음 — 만들어진 셀이 팩으로 들어감)
    open_box(1.1, 1.1, 0.42, u - 1.9, v - 1.45, Z0, M["body"], g, wall=0.05)
    for i in range(4):
        for j in range(4):
            cyl(0.1, 0.38, u - 2.28 + i * 0.25, v - 1.83 + j * 0.25, Z0 + 0.05, M["cell"], g, seg=20)
            cyl(0.05, 0.02, u - 2.28 + i * 0.25, v - 1.83 + j * 0.25, Z0 + 0.43, M["cell_cap"], g, seg=16)
    post(M, "s1", g)
    pipe([(POSTS["s1"][0] - 0.1, POSTS["s1"][1] + 0.2, Z0 + 0.4), (u + 1.6, v - 0.5, Z0 + 0.4), (u + 1.2, v - 0.85, Z0 + 1.0)], 0.03, M["navy"], g)
    return (u + 0.4, v, Z0 + 2.3)


# ─────────────────────────── ② 차량 등록 ───────────────────────────
def s2_register(M):
    """출고 · 등록: 차에 실린 배터리의 식별번호를 자동차등록원부에 올린다"""
    g = "s2"
    u, v = 9.4, LV
    box(5.0, 2.6, 0.06, u, v, Z0, M["body2"], g, bevel=0.03)
    WK.car(M, u - 0.3, v, Z0 + 0.06, g)
    qr_front_v(M, u + 0.6, v + 0.91, Z0 + 0.36, 0.3, g, seed=12)     # 차 옆면 식별 무늬 (배터리 자리)
    # 등록 창구 (화면이 앞쪽 +v)
    cu, cv = u + 2.6, v - 1.1
    box(1.0, 0.7, 1.0, cu, cv, Z0, M["body"], g, bevel=0.05, seg=4)
    box(1.04, 0.74, 0.05, cu, cv, Z0 + 1.0, M["body2"], g, bevel=0.02)
    box(0.84, 0.06, 0.5, cu, cv + 0.12, Z0 + 1.08, M["body2"], g, bevel=0.02)
    box(0.74, 0.02, 0.4, cu, cv + 0.16, Z0 + 1.13, M["screen"], g, bevel=0.01)
    box(0.5, 0.36, 0.03, cu, cv + 0.15, Z0 + 1.0, M["qr_w"], g, bevel=0.005)   # 등록 서류
    post(M, "s2", g)
    return (u, v, Z0 + 1.6)


# ─────────────────────────── ③ 운행 · 정비 · 검사 ───────────────────────────
def s3_service(M):
    """정기 검사 · 정비: 리프트에 올린 차에서 진단기가 BMS 기록(SOH · 충전 · 주행)을 읽는다"""
    g = "s3"
    u, v = 15.4, LV
    box(4.8, 3.0, 0.06, u, v, Z0, M["body2"], g, bevel=0.03)
    WK.lift_posts(M, u, v, 0.9, g)
    WK.car(M, u, v, Z0 + 0.85, g)
    box(1.6, 1.2, 0.06, u, v, Z0 + 0.06, M["steel"], g, bevel=0.02)
    # 진단 카트 + 케이블 (차 아래 팩 커넥터로)
    cu, cv = u + 2.3, v + 1.2
    box(0.8, 0.6, 0.9, cu, cv, Z0, M["body"], g, bevel=0.05, seg=4)
    box(0.84, 0.64, 0.05, cu, cv, Z0 + 0.9, M["body2"], g, bevel=0.02)
    box(0.1, 0.1, 0.4, cu, cv - 0.18, Z0 + 0.95, M["steel"], g, bevel=0.02)
    box(0.72, 0.06, 0.46, cu, cv - 0.12, Z0 + 1.3, M["body2"], g, bevel=0.02)
    box(0.62, 0.02, 0.36, cu, cv - 0.08, Z0 + 1.35, M["screen"], g, bevel=0.01)
    pipe([(cu - 0.35, cv - 0.1, Z0 + 0.7), (cu - 0.8, cv - 0.3, Z0 + 0.3), (u + 1.2, v + 0.2, Z0 + 0.3), (u + 1.0, v + 0.1, Z0 + 0.85)], 0.035, M["navy"], g)
    post(M, "s3", g)
    return (u, v, Z0 + 2.2)


# ─────────────────────────── ④ 탈거 · 성능평가 ───────────────────────────
def s4_assess(M):
    """떼어 낸 팩을 시험대에서 재고 상태를 기록 (05 잔존수명 진단)"""
    g = "s4"
    u, v = 20.6, LV
    box(3.6, 2.3, 0.62, u, v, Z0, M["body"], g, bevel=0.05, seg=4)
    WK.pack(M, u, v, Z0 + 0.62, g, lid=True)
    qr_top(M, u + 0.8, v + 0.25, Z0 + 1.04, 0.52, g, seed=11)
    tu, tv = u + 0.2, v - 1.75
    box(1.4, 0.8, 1.7, tu, tv, Z0, M["body"], g, bevel=0.05, seg=4)
    box(1.2, 0.03, 0.5, tu, tv + 0.41, Z0 + 1.0, M["screen"], g, bevel=0.01)
    for k in range(3):
        cyl(0.07, 0.04, tu - 0.35 + k * 0.35, tv + 0.42, Z0 + 0.6, M["body2"], g, axis="v", seg=20)
    for k in range(4):
        box(1.0, 0.02, 0.04, tu, tv + 0.41, Z0 + 0.2 + k * 0.08, M["body2"], g, bevel=0)
    pipe([(tu - 0.4, tv + 0.4, Z0 + 1.6), (tu - 0.6, tv + 0.9, Z0 + 1.8), (u - 0.3, v - 0.5, Z0 + 1.3), (u - 0.3, v - 0.4, Z0 + 1.05)], 0.03, M["navy"], g)
    post(M, "s4", g)
    return (u, v, Z0 + 2.0)


# ─────────────────────────── ⑤ 재사용 · ⑥ 재활용 ───────────────────────────
def d1_reuse(M):
    """재사용: ESS 캐비닛 — 새 여권이 원래 여권과 이어진다"""
    g = "d1"
    u, v = 25.9, 2.2
    box(2.8, 1.4, 1.8, u, v, Z0, M["ess"], g, bevel=0.06, seg=4)
    box(2.84, 1.44, 0.08, u, v, Z0 + 1.8, M["teal"], g, bevel=0.03)
    for k in range(3):
        box(0.04, 0.02, 1.5, u - 1.4 + 0.7 * (k + 1), v + 0.71, Z0 + 0.15, M["body2"], g, bevel=0)
    for k in range(5):
        box(0.34, 0.02, 0.1, u - 0.9 + k * 0.45, v + 0.71, Z0 + 1.45, M["body2"], g, bevel=0.005)
    qr_front_v(M, u - 1.0, v + 0.71, Z0 + 0.62, 0.34, g, seed=21)     # 새 여권
    box(1.0, 1.0, 0.05, u - 2.0, v + 0.1, Z0, M["teal"], g, bevel=0.02)
    post(M, "d1", g)
    return (u, v, Z0 + 2.1)


def d2_recycle(M):
    """재활용: 수거함 → 회수 소재 자루. 여권은 여기서 끝나고, 재생원료 기록이 새 셀로 넘어간다"""
    g = "d2"
    u, v = 25.6, 8.4
    open_box(1.8, 1.5, 0.95, u, v, Z0, M["body"], g, wall=0.07)
    box(1.82, 0.04, 0.12, u, v + 0.76, Z0 + 0.7, M["hazard"], g, bevel=0.01)
    box(0.04, 1.52, 0.12, u + 0.91, v, Z0 + 0.7, M["hazard"], g, bevel=0.01)
    for i in range(2):
        for j in range(2):
            WK.module_(M, u - 0.4 + i * 0.75, v - 0.35 + j * 0.8, Z0 + 0.07, M["mod_old"] if (i + j) % 2 else M["mod"], g)
    # 회수 소재 자루 (니켈 · 코발트 · 리튬) — 자루마다 원료 기록표
    for k, m in enumerate(("ni", "co", "li")):
        bu, bv = u + 1.75, v - 0.85 + k * 0.85
        box(0.7, 0.7, 0.75, bu, bv, Z0, M["bag"], g, bevel=0.12, seg=4)
        box(0.5, 0.5, 0.06, bu, bv, Z0 + 0.75, M[m], g, bevel=0.05)
    box(1.0, 1.0, 0.05, u - 1.95, v + 0.1, Z0, M["amber"], g, bevel=0.02)
    post(M, "d2", g)
    return (u, v, Z0 + 1.5)


# ─────────────────────────── 배터리 여권 서버 ───────────────────────────
def hub(M):
    """가운데 뒤: 데이터 센터 건물 + 지붕 위 여권 받침 (장이 쌓이는 자리는 공정 재생 클립이 그림)"""
    g = "hub"
    u, v = HUB
    box(4.6, 2.6, 1.7, u, v, Z0, M["body"], g, bevel=0.07, seg=4)
    box(4.64, 2.64, 0.1, u, v, Z0 + 1.7, M["navy"], g, bevel=0.04)
    # 앞 유리벽 (+v) 안의 서버 랙과 불빛
    box(3.8, 0.04, 1.2, u - 0.1, v + 1.31, Z0 + 0.25, M["glass_d"], g, bevel=0.01)
    for i in range(5):
        ru = u - 1.7 + i * 0.8
        for k in range(6):
            m = M["rack_t"] if (i + k) % 3 == 0 else M["rack_l"]
            box(0.4, 0.02, 0.03, ru, v + 1.34, Z0 + 0.4 + k * 0.17, m, g, bevel=0)
    # +u 면 문
    box(0.04, 0.8, 1.2, u + 2.31, v + 0.5, Z0 + 0.05, M["body2"], g, bevel=0.01)
    # 지붕 위: 여권 받침 (둥근 판 + 투명 테)
    cyl(1.25, 0.14, u, v, Z0 + 1.8, M["body2"], g, seg=64)
    cyl(1.15, 0.05, u, v, Z0 + 1.94, M["data"], g, seg=64)
    for a in range(4):
        ang = math.pi / 4 + a * math.pi / 2
        box(0.07, 0.07, 1.25, u + 1.0 * math.cos(ang), v + 1.0 * math.sin(ang), Z0 + 1.99, M["steel"], g, bevel=0.02)
    ring(1.05, 0.04, u, v, Z0 + 3.2, M["steel"], g, t=0.05, seg=64)
    # 데이터 선이 들어가는 자리
    box(0.6, 0.3, 0.3, u, v + 1.45, Z0, M["data"], g, bevel=0.04)
    return (u, v, Z0 + 3.4)


def page(M, key, k, g):
    """여권 한 장: 받침 위 k번째 높이에 뜬 얇은 판 + 글줄 무늬 (공정 재생에서 단계마다 한 장씩)"""
    u, v = HUB
    z = Z0 + 2.1 + k * 0.17
    col = S.P(f"page_{key}", PL.hexlin(PAGE_COL[key]), rough=0.3, coat=0.4, emit=(PL.hexlin(PAGE_COL[key]), 0.5))
    box(1.6, 1.2, 0.05, u, v, z, col, g, bevel=0.03, seg=2)
    for j in range(3):
        box(0.9 - j * 0.2, 0.06, 0.012, u - 0.1, v - 0.3 + j * 0.25, z + 0.05, M["qr_w"], g, bevel=0, seg=1)
    box(0.26, 0.26, 0.012, u + 0.5, v - 0.3, z + 0.05, M["qr_w"], g, bevel=0, seg=1)


# ─────────────────────────── 바닥 선 ───────────────────────────
def lanes(M):
    g = "lane"
    # 배터리가 지나는 길 (청록): 입구 → ①②③④ → 갈림점 → ⑤ / ⑥
    dashes(M, [(0.8, LV), FORK], M["teal"], g)
    dashes(M, [FORK, (FORK[0], 2.2), (24.2, 2.2)], M["teal"], g)
    dashes(M, [FORK, (FORK[0], 8.4), (24.3, 8.4)], M["teal"], g)
    # 재생원료가 새 셀로 돌아가는 길 (분홍): ⑥ → 판 앞 가장자리 → ① 입구
    dashes(M, [(24.3, 8.4), (24.3, LOOP), (0.8, LOOP), (0.8, LV + 0.3)], M["loop"], g)
    # 데이터 선 (파란 점): 기록 기둥 → 본선 → 서버
    dots(M, [(5.8, BUS), (27.4, BUS)], M["data"], g)
    for k, (pu, pv) in POSTS.items():
        dots(M, [(pu, pv - 0.3), (pu, BUS)] if pv > BUS else [(pu, pv + 0.3), (pu, BUS)], M["data"], g)
    dots(M, [(HUB[0], HUB[1] + 1.6), (HUB[0], BUS)], M["data"], g)


def build():
    M = mats_tr()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["s1"] = s1_make(M)
    a["s2"] = s2_register(M)
    a["s3"] = s3_service(M)
    a["s4"] = s4_assess(M)
    a["d1"] = d1_reuse(M)
    a["d2"] = d2_recycle(M)
    a["hub"] = hub(M)
    a["fork"] = (FORK[0], FORK[1], Z0)
    a["zl"] = (10.0, LOOP + 0.25, 0.0)       # 재생원료 길 이름표 자리
    a["zh"] = (HUB[0] - 8.6, HUB[1] - 1.2, 0.0)   # 여권 서버 이름표 자리 (건물 왼쪽 뒤 빈 바닥, 쌓이는 장 · 번호를 가리지 않게)
    return a
