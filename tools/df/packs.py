"""분해를 고려한 설계 — '두 팩 나란히 뜯기' 등각 장면 (Blender 5 / bpy).

작업대 둘에 뚜껑을 연 배터리 팩이 하나씩 놓여 있다(뚜껑은 뒤쪽 받침대에 세워 둠).
 왼쪽 위 '뜯기 어려운 팩': ① 뚜껑 — 둘레 볼트 수십 개 + 실링 / ② 작은 모듈 열두 개 · 모듈마다 나사 넷 · 팩 곳곳을 지나는 배선
   / ③ 모듈 사이 구조용 접착제 · 용접 점 → 셀째 떼지 못하고 앞쪽 파쇄기로
 오른쪽 아래 '뜯기 쉬운 팩': ④ 뚜껑 — 클립 여섯 / ⑤ 한쪽 끝에 모은 배선(버스바 묶음) · 띠 두 줄 / ⑥ 큰 셀 여덟 · 식별 무늬 → 앞쪽 선반에 그대로 분류
 팩마다 뒤 모서리에 '걸린 시간' 막대(빈 홈)가 있고 공정 재생에서 단계마다 한 칸씩 쌓인다(높이는 개념, 어려운 팩이 약 4배).
03 공정 지도(../rc/plant.py) · 09 이력관리(../tr/passport.py)의 식별 무늬 · 10 인증(../ce/certify.py) · 11 전과정평가(../lc/footprint.py)의
도우미 · 재질 · 조명 · 카메라를 그대로 쓴다. 외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래.
팩 모양은 설명용으로 단순화했고 특정 차종을 본뜨지 않았다.
"""
import math, os, sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
for d in ("rc", "rm", "tr", "ce", "lc"):
    sys.path.insert(0, os.path.join(HERE, "..", d))
import plant as PL
import passport as TR
import certify as CE
import footprint as LC
from plant import box, cyl, open_box, ring, pipe, poly_pipe, L

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=21.4, v0=0.0, v1=10.6)
BENCH_H = 0.55
TRAY_H = 0.4
PACK = {"h": (5.0, 5.0), "e": (15.6, 5.0)}   # 팩(작업대) 중심
PW, PD = 6.6, 3.8                              # 팩 트레이 크기 (u, v)
COVER_V = 1.25                                 # 뒤쪽 뚜껑 받침 줄
COVER_H = 2.6
LANE_B = 2.55                                  # 뒤 길 (뚜껑과 작업대 사이)
LANE_F = 7.65                                  # 앞 길
SIDE = {"h": 9.25, "e": 19.85}                 # 옆 길
GAUGE = {"h": (9.3, 3.35), "e": (19.9, 3.35)}  # 걸린 시간 막대
GAUGE_H = 3.2
SHRED = (4.6, 9.0)                             # 파쇄기 (어려운 팩 앞)
RACK = (15.6, 9.2)                             # 분류 선반 (쉬운 팩 앞)
RACK_D = 1.4


def mats_df():
    M = LC.mats_lc()
    P = S.P
    M["glue"] = P("glue", PL.hexlin("#F2D16B"), rough=0.6, bump=0.3, bump_scale=60)
    M["weld"] = P("weld", PL.hexlin("#6E7787"), metal=0.6, rough=0.4)
    M["harness"] = P("harness", PL.hexlin("#E9894A"), rough=0.5)
    M["seal"] = P("sealant", PL.hexlin("#3A4358"), rough=0.6)
    M["clip"] = P("clip", PL.hexlin("#39C6B6"), rough=0.35, coat=0.3)
    M["cellb"] = P("cell_blade", PL.hexlin("#C9D2E3"), rough=0.35, coat=0.25)
    M["mod_s"] = P("module_small", PL.hexlin("#AEB8C9"), rough=0.4, coat=0.2)
    M["slot"] = P("gauge_slot", PL.hexlin("#26324F"), rough=0.4)
    M["qr_w"] = P("qr_white", PL.hexlin("#FFFFFF"), rough=0.4)
    M["qr_k"] = P("qr_black", PL.hexlin("#1F2A44"), rough=0.5)
    return M


def tray_z():
    return Z0 + BENCH_H + 0.06


def inner_z():
    """트레이 바닥 윗면"""
    return tray_z() + 0.06


# ─────────────────────────── 공통 ───────────────────────────
def bench(M, key, g):
    u, v = PACK[key]
    box(PW + 0.8, PD + 0.8, BENCH_H, u, v, Z0, M["body2"], g, bevel=0.05, seg=3)
    box(PW + 0.86, PD + 0.86, 0.06, u, v, Z0 + BENCH_H, M["steel"], g, bevel=0.02)
    # 트레이(위가 열린 팩 바닥)
    open_box(PW, PD, TRAY_H, u, v, tray_z(), M["navy"], g, wall=0.1, bevel=0.03)


def cover(M, key, g):
    """뒤쪽 받침대에 세워 둔 뚜껑 (+v 면이 앞을 봄)"""
    u, _ = PACK[key]
    for du in (-2.6, 2.6):
        box(0.5, 0.7, 0.15, u + du, COVER_V, Z0, M["steel"], g, bevel=0.03)
    box(PW, 0.12, COVER_H, u, COVER_V, Z0 + 0.15, M["navy2"], g, bevel=0.03)
    box(PW - 0.3, 0.02, COVER_H - 0.3, u, COVER_V + 0.065, Z0 + 0.3, M["navy"], g, bevel=0.01)


def gauge(M, key, g):
    """걸린 시간 막대 — 앞(+v) 면 홈 (공정 재생에서 채워짐)"""
    u, v = GAUGE[key]
    box(0.7, 0.7, 0.1, u, v, Z0, M["body2"], g, bevel=0.03)
    box(0.5, 0.5, GAUGE_H, u, v, Z0 + 0.1, M["body"], g, bevel=0.04)
    box(0.24, 0.03, GAUGE_H - 0.3, u, v + 0.25, Z0 + 0.25, M["slot"], g, bevel=0.01)
    cyl(0.16, 0.05, u, v, Z0 + 0.1 + GAUGE_H, M["amber"] if key == "h" else M["teal"], g, seg=24)


# ─────────────────────────── 뜯기 어려운 팩 ───────────────────────────
HB = []          # 뚜껑 볼트 자리 (u, z)
HMODS = []       # 작은 모듈 중심 (u, v)
HSCREWS = []     # 모듈 나사 (u, v)
HGLUE = []       # 접착 줄 (u, v, du, dv)
HWELDS = []      # 용접 점 (u, v)
HARNESS = []     # 배선 꼭짓점 목록들


def h1_cover(M):
    """뚜껑: 둘레 볼트 수십 개 + 안쪽 실링 띠"""
    g = "h1"
    u, _ = PACK["h"]
    cover(M, "h", g)
    vf = COVER_V + 0.075
    x0, x1 = u - PW / 2 + 0.25, u + PW / 2 - 0.25
    z0, z1 = Z0 + 0.4, Z0 + 0.15 + COVER_H - 0.25
    n_u, n_z = 13, 6
    for i in range(n_u):
        for zz in (z0, z1):
            HB.append((x0 + (x1 - x0) * i / (n_u - 1), zz))
    for j in range(1, n_z):
        for xx in (x0, x1):
            HB.append((xx, z0 + (z1 - z0) * j / n_z))
    for (bu, bz) in HB:
        cyl(0.07, 0.05, bu, vf, bz, M["steel"], g, axis="v", seg=16)
    # 실링 띠 (안쪽 테두리)
    for (a, b, c, d) in ((x0 + 0.2, x1 - 0.2, z0 + 0.25, z0 + 0.25), (x0 + 0.2, x1 - 0.2, z1 - 0.25, z1 - 0.25)):
        box(b - a, 0.02, 0.06, (a + b) / 2, vf, c - 0.03, M["seal"], g, bevel=0)
    for xx in (x0 + 0.2, x1 - 0.2):
        box(0.06, 0.02, z1 - z0 - 0.5, xx, vf, z0 + 0.25, M["seal"], g, bevel=0)
    bench(M, "h", "h2")
    gauge(M, "h", g)
    return (u, COVER_V, Z0 + COVER_H + 0.5)


def h2_modules(M):
    """작은 모듈 열둘(3×4) — 모듈마다 나사 넷, 팩 곳곳을 지나는 배선"""
    g = "h2"
    u, v = PACK["h"]
    z = inner_z()
    mw, md, mh = 1.35, 1.0, 0.36
    for i in range(4):
        for j in range(3):
            mu, mv = u - 2.4 + i * 1.6, v - 1.18 + j * 1.18
            HMODS.append((mu, mv))
            box(mw, md, mh, mu, mv, z, M["mod_s"], g, bevel=0.04)
            box(mw - 0.2, 0.06, 0.02, mu, mv - 0.32, z + mh, M["steel"], g, bevel=0)
            for du, dv in ((-0.55, -0.38), (0.55, -0.38), (-0.55, 0.38), (0.55, 0.38)):
                HSCREWS.append((mu + du, mv + dv))
                cyl(0.06, 0.04, mu + du, mv + dv, z + mh, M["weld"], g, seg=12)
    # 배선 (모듈 사이를 구불구불 지남)
    zc = z + mh + 0.08
    paths = [
        [(u - 3.0, v - 1.75, zc), (u - 1.6, v - 1.75, zc), (u - 1.6, v - 0.6, zc), (u + 0.0, v - 0.6, zc), (u + 0.0, v + 0.6, zc), (u + 1.6, v + 0.6, zc), (u + 1.6, v + 1.75, zc)],
        [(u - 3.0, v + 1.0, zc), (u - 0.8, v + 1.0, zc), (u - 0.8, v - 1.2, zc), (u + 2.4, v - 1.2, zc), (u + 2.4, v + 0.0, zc), (u + 3.0, v + 0.0, zc)],
    ]
    for pts in paths:
        HARNESS.append(pts)
        poly_pipe(pts, 0.045, M["harness"], g)
    return (u, v, z + 1.3)


def h3_cells(M):
    """모듈 사이 구조용 접착제(노란 띠) · 셀 탭 용접 점 → 앞쪽 파쇄기"""
    g = "h3"
    u, v = PACK["h"]
    z = inner_z()
    for i in range(3):
        gu = u - 1.6 + i * 1.6
        HGLUE.append((gu, v, 0.2, PD - 0.4))
        box(0.2, PD - 0.4, 0.3, gu, v, z, M["glue"], g, bevel=0.03)
    for j in range(2):
        gv = v - 0.59 + j * 1.18
        HGLUE.append((u, gv, PW - 0.4, 0.14))
        box(PW - 0.4, 0.14, 0.24, u, gv, z, M["glue"], g, bevel=0.03)
    for (mu, mv) in HMODS:
        for du in (-0.3, 0.0, 0.3):
            HWELDS.append((mu + du, mv + 0.36))
            cyl(0.045, 0.03, mu + du, mv + 0.36, z + 0.36, M["weld"], g, seg=10)
    # 파쇄기 + 블랙매스 더미
    su, sv = SHRED
    box(1.4, 1.3, 0.95, su, sv, Z0, M["body"], g, bevel=0.06, seg=4)
    box(1.44, 1.34, 0.08, su, sv, Z0 + 0.95, M["blue"], g, bevel=0.03)
    S.obj_from(S.cyl_mesh(0.72, 0.6, 4, r2=1.05, smooth=False), L(su, sv, Z0 + 1.03 + 0.3), M["body2"], "hop", (0, 0, math.pi / 4), g)
    cyl(0.22, 0.28, su + 0.85, sv, Z0 + 0.35, M["steel"], g, axis="v")
    pile = S.obj_from(S.cyl_mesh(0.55, 0.5, 40, r2=0.04), L(su + 1.9, sv + 0.1, Z0 + 0.25), M["bm"], "pile", (0, 0, 0), g)
    for p in pile.data.polygons:
        p.use_smooth = True
    return (su, sv, Z0 + 2.0)


# ─────────────────────────── 뜯기 쉬운 팩 ───────────────────────────
EC = []          # 뚜껑 클립 자리 (u, z)
ECELLS = []      # 큰 셀 중심 (u, v)
STRAPS = []      # 띠 v 좌표
BUSBAR = None    # 버스바 묶음 (u, v)
QR_E = None


def e1_cover(M):
    """뚜껑: 클립 여섯 (실링 없음)"""
    g = "e1"
    u, _ = PACK["e"]
    cover(M, "e", g)
    vf = COVER_V + 0.075
    for (du, zz) in ((-2.9, Z0 + 0.55), (0.0, Z0 + 0.4), (2.9, Z0 + 0.55), (-2.9, Z0 + COVER_H - 0.25), (0.0, Z0 + COVER_H - 0.1), (2.9, Z0 + COVER_H - 0.25)):
        EC.append((u + du, zz))
        box(0.36, 0.08, 0.2, u + du, vf + 0.02, zz - 0.1, M["clip"], g, bevel=0.03)
    bench(M, "e", "e2")
    gauge(M, "e", g)
    return (u, COVER_V, Z0 + COVER_H + 0.5)


def e2_bus(M):
    """큰 셀을 잡는 띠 두 줄 + 한쪽 끝(+u)에 모은 버스바 묶음"""
    global BUSBAR
    g = "e2"
    u, v = PACK["e"]
    z = inner_z()
    for dv in (-0.95, 0.95):
        STRAPS.append(v + dv)
        box(PW - 1.4, 0.16, 0.05, u - 0.45, v + dv, z + 0.62, M["steel"], g, bevel=0.01)
        for du in (-3.55 + 0.45, 2.65):
            box(0.12, 0.26, 0.6, u + du, v + dv, z, M["clip"], g, bevel=0.03)
    BUSBAR = (u + 2.95, v)
    box(0.5, PD - 0.5, 0.55, BUSBAR[0], v, z, M["body"], g, bevel=0.04)
    box(0.44, PD - 0.6, 0.06, BUSBAR[0], v, z + 0.55, M["teal"], g, bevel=0.02)
    for k in range(6):
        box(0.2, 0.2, 0.1, BUSBAR[0], v - 1.35 + k * 0.54, z + 0.6, M["amber"], g, bevel=0.02)
    return (BUSBAR[0], v, z + 1.3)


def e3_cells(M):
    """큰 셀 여덟(v 방향으로 긴 판) · 셀마다 식별 무늬 · 팩 앞면 무늬 → 앞쪽 분류 선반"""
    global QR_E
    g = "e3"
    u, v = PACK["e"]
    z = inner_z()
    for i in range(8):
        cu = u - 2.95 + i * 0.68
        ECELLS.append((cu, v))
        box(0.58, PD - 0.4, 0.55, cu, v, z, M["cellb"], g, bevel=0.04)
        box(0.3, 0.3, 0.012, cu, v - 1.2, z + 0.55, M["qr_w"], g, bevel=0.004, seg=1)
    QR_E = (u - 2.2, v + PD / 2 + 0.06)
    TR.qr_front_v(M, QR_E[0], QR_E[1], tray_z() + 0.02, 0.34, g, seed=14)
    # 분류 선반 (셀이 그대로 놓임)
    ru, rv = RACK
    for k in range(3):
        box(4.2, RACK_D, 0.06, ru, rv, Z0 + 0.25 + k * 0.62, M["body2"], g, bevel=0.02)
    for du in (-2.05, 2.05):
        for dv in (-RACK_D / 2 + 0.05, RACK_D / 2 - 0.05):
            box(0.07, 0.07, 1.6, ru + du, rv + dv, Z0, M["steel"], g, bevel=0.01)
    return (u, v, z + 1.4)


# ─────────────────────────── 바닥 선 ───────────────────────────
ROUTE_H = [(0.8, LANE_B), (PACK["h"][0], LANE_B), (SIDE["h"], LANE_B), (SIDE["h"], LANE_F), (SHRED[0], LANE_F), (SHRED[0], SHRED[1] - 0.75)]
ROUTE_E = [(11.4, LANE_B), (PACK["e"][0], LANE_B), (SIDE["e"], LANE_B), (SIDE["e"], LANE_F), (RACK[0], LANE_F), (RACK[0], RACK[1] - 0.8)]


def lanes(M):
    TR.dashes(M, ROUTE_H[:-1], M["navy2"], "lane")
    TR.dashes(M, ROUTE_E[:-1], M["teal"], "lane")


_M = None


def build():
    global _M
    M = _M = mats_df()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["h1"] = h1_cover(M)
    a["h2"] = h2_modules(M)
    a["h3"] = h3_cells(M)
    a["e1"] = e1_cover(M)
    a["e2"] = e2_bus(M)
    a["e3"] = e3_cells(M)
    a["zh"] = (-2.0, 5.0, 0.0)      # 어려운 팩 이름표 (바닥판 왼쪽 바깥, 팩 왼쪽 위)
    a["ze"] = (9.1, 8.5, 0.0)       # 쉬운 팩 이름표 (두 작업대 사이 앞, 선반 왼쪽)
    return a
