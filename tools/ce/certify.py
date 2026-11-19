"""재생원료 인증 — '인증서가 나오는 공장' 등각 장면 (Blender 5 / bpy).

폐배터리 · 공정 스크랩이 ① 입고 · 계량 → ② 파쇄 · 선별(블랙매스) → ③ 정제(재생원료 8종)를 지나며
단계마다 저울이 '넣은 양 · 나온 양'을 재고, 기록 기둥에서 파란 데이터 선을 따라 가운데 뒤 '투입 · 산출 기록판'으로 모인다.
④ 인증 심사(서류 · 현장 · 심의) 뒤 인증서가 나오면, ⑤ 소재 · 셀 공장(재생원료 사용 · 함유율 인증) 또는
⑥ 수출(EU에서 재생원료 비율 신고)로 간다. 분홍 길은 사후관리(분기마다 서류 · 수시 현장)가 공장으로 돌아가는 길.
03 공정 지도(../rc/plant.py) · 09 이력관리(../tr/passport.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래. 배치는 설명용으로 단순화했다.
"""
import math, os, sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
sys.path.insert(0, os.path.join(HERE, "..", "tr"))
import plant as PL
import workshop as WK
import passport as TR
from plant import box, cyl, open_box, ring, pipe, poly_pipe, L

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=28.8, v0=0.0, v1=10.6)
LV = 7.0          # 원료가 지나는 길 (청록 점선)
BUS = 4.4         # 데이터 선 본선 (파란 점)
LOOP = 10.0       # 사후관리 길 (분홍 점선, 판 앞 가장자리)
FORK = (23.6, LV)
HUB = (13.6, 1.9)  # 투입 · 산출 기록판
POSTS = {"s1": (5.8, 5.3), "s2": (11.3, 5.0), "s3": (18.4, 5.1), "s4": (22.6, 5.1), "d1": (27.4, 3.3), "d2": (27.9, 6.4)}
# 기록판의 줄 (단계 색) — 위에서부터
ROW_COL = {"s1": "#5B7CFA", "s2": "#7E879A", "s3": "#39C6B6", "s4": "#F3B64A", "d1": "#2BB594", "d2": "#8EA6FF"}
ROWS = ("s1", "s2", "s3", "s4", "d1", "d2")
# 재생원료 8종 (2026.6 시범사업 인증 대상): 탄산리튬 · 수산화리튬 · 황산니켈 · 황산코발트 · 황산망간 · 흑연 · 복합금속침전물 · 양극활물질
DRUMS = ("li", "li", "ni", "co", "mn", "bm", "mhp", "cam")


def mats_ce():
    M = TR.mats_tr()
    P = S.P
    M["scale"] = P("scale", PL.hexlin("#AEB8C9"), metal=0.5, rough=0.35)
    M["scale_d"] = P("scale_dark", PL.hexlin("#3A4358"), rough=0.5)
    M["mhp"] = P("mhp", PL.hexlin("#6E8F86"), rough=0.5, coat=0.3)
    M["cam"] = P("cam", PL.hexlin("#2E3B5C"), rough=0.4, coat=0.4)
    M["paper"] = P("paper", PL.hexlin("#FFFFFF"), rough=0.55)
    M["seal"] = P("seal", PL.hexlin("#F3B64A"), rough=0.35, coat=0.4)
    M["cont"] = P("container", PL.hexlin("#5B7CFA"), rough=0.45, coat=0.2)
    M["cont2"] = P("container2", PL.hexlin("#4A68D8"), rough=0.45)
    M["board"] = P("board", PL.hexlin("#26324F"), rough=0.3, coat=0.5)
    M["scrap"] = P("scrap", PL.hexlin("#3A4150"), metal=0.2, rough=0.45)
    return M


# ─────────────────────────── 부품 ───────────────────────────
def scale(M, u, v, du, dv, g, disp=None):
    """바닥 저울: 낮은 금속 판 + 테두리 (+ 표시기: disp=(u, v) 화면이 +v를 봄)"""
    box(du + 0.12, dv + 0.12, 0.05, u, v, Z0, M["scale_d"], g, bevel=0.02)
    box(du, dv, 0.1, u, v, Z0 + 0.02, M["scale"], g, bevel=0.03)
    if disp:
        su, sv = disp
        box(0.08, 0.08, 0.7, su, sv, Z0, M["steel"], g, bevel=0.02)
        box(0.56, 0.2, 0.34, su, sv, Z0 + 0.7, M["body"], g, bevel=0.04)
        box(0.44, 0.02, 0.18, su, sv + 0.1, Z0 + 0.78, M["scale_d"], g, bevel=0.01)
    return Z0 + 0.12


def regroup(fn, g):
    """다른 장면의 설비 함수를 불러 만든 물체를 이 장면의 단계 묶음으로 다시 표시"""
    before = set(bpy.context.scene.objects)
    out = fn()
    for o in set(bpy.context.scene.objects) - before:
        old = o.get("grp")
        if old is not None and o in S.GROUPS.get(old, []):
            S.GROUPS[old].remove(o)
        S.tag(o, g)
        if "anim" in o:
            del o["anim"]
    return out


def post(M, key, g):
    """기록 기둥 (09와 같은 모양): 작은 화면 + 위에 둥근 등"""
    u, v = POSTS[key]
    box(0.5, 0.5, 0.06, u, v, Z0, M["body2"], g, bevel=0.02)
    box(0.16, 0.16, 1.5, u, v, Z0 + 0.06, M["body"], g, bevel=0.03)
    box(0.42, 0.06, 0.3, u, v + 0.1, Z0 + 1.05, M["body2"], g, bevel=0.02)
    box(0.34, 0.02, 0.22, u, v + 0.14, Z0 + 1.09, M["screen"], g, bevel=0.01)
    cyl(0.12, 0.08, u, v, Z0 + 1.56, M["data"], g, seg=24)
    cyl(0.07, 0.1, u, v, Z0 + 1.64, M["body"], g, seg=24)


def drum(M, u, v, z, lid, g):
    cyl(0.2, 0.52, u, v, z, M["body"], g, seg=32)
    cyl(0.205, 0.04, u, v, z + 0.14, M["body2"], g, seg=32)
    cyl(0.205, 0.04, u, v, z + 0.36, M["body2"], g, seg=32)
    cyl(0.19, 0.06, u, v, z + 0.52, M[lid], g, seg=32)


def hat(M, u, v, z, m, g):
    """안전모 (현장 심사원)"""
    cyl(0.2, 0.025, u, v, z, m, g, seg=32)
    S.obj_from(S.cyl_mesh(0.15, 0.14, 32, r2=0.09), L(u, v, z + 0.025 + 0.07), m, "hat", (0, 0, 0), g)


# ─────────────────────────── ① 입고 · 계량 ───────────────────────────
def s1_intake(M):
    """폐배터리 팩과 공정 스크랩(제조 중 나온 불량 · 자투리)이 들어와 저울에서 무게를 잰다"""
    g = "s1"
    u, v = 3.0, LV
    zt = scale(M, u, v, 3.5, 2.3, g, disp=(u - 1.2, v - 1.55))
    box(3.3, 2.0, 0.12, u, v, zt, M["body2"], g, bevel=0.03)                 # 팰릿
    WK.pack(M, u - 0.05, v - 0.05, zt + 0.12, g, lid=True)
    box(0.5, 0.36, 0.03, u + 0.6, v + 0.45, zt + 0.58, M["paper"], g, bevel=0.005)   # 입고 표
    # 공정 스크랩 통 (작은 저울 위) — 전극 자투리
    su, sv = u + 2.75, v + 0.95
    zt2 = scale(M, su, sv, 1.2, 1.1, g)
    open_box(1.0, 0.9, 0.5, su, sv, zt2, M["body"], g, wall=0.05)
    for j in range(7):
        a = j * 1.7
        box(0.36, 0.22, 0.02, su - 0.2 + 0.12 * math.cos(a), sv + 0.15 * math.sin(a), zt2 + 0.3 + 0.03 * j,
            M["cu"] if j % 3 == 0 else (M["alu"] if j % 3 == 1 else M["scrap"]), g, bevel=0.005, rotz=a)
    box(0.9, 0.04, 0.1, su, sv + 0.46, zt2 + 0.32, M["hazard"], g, bevel=0.01)
    post(M, "s1", g)
    return (u, v, Z0 + 1.6)


# ─────────────────────────── ② 파쇄 · 선별 ───────────────────────────
def s2_shred(M):
    """파쇄 · 자력 선별 → 블랙매스 (03 공정 지도의 설비). 톤백은 저울 위"""
    g = "s2"
    u, v = 8.2, LV
    regroup(lambda: PL.s3_shred(M, u, v), g)
    # 블랙매스 톤백 아래 저울 + 표시기
    scale(M, u + 0.98, v - 1.25, 2.1, 1.1, g, disp=(u + 2.35, v - 1.75))
    post(M, "s2", g)
    return (u + 1.0, v, Z0 + 1.6)


# ─────────────────────────── ③ 정제 → 재생원료 8종 ───────────────────────────
def s3_refine(M):
    """침출 · 정제 뒤 배터리용 원료 8종이 통에 담겨 저울 위로"""
    g = "s3"
    u, v = 14.2, LV - 0.45
    regroup(lambda: PL.h1_leach(M, u, v), g)
    # 제품 통 8개 (2줄 × 4) — 뚜껑 색이 원료 종류
    pu, pv = 17.0, LV + 0.55
    zt = scale(M, pu, pv, 2.4, 1.7, g, disp=(pu + 1.55, pv - 0.55))
    for k, lid in enumerate(DRUMS):
        i, j = k % 4, k // 4
        drum(M, pu - 0.8 + i * 0.53, pv - 0.36 + j * 0.72, zt, lid, g)
    poly_pipe([(u + 1.5, v + 0.2, Z0 + 0.5), (u + 1.95, v + 0.2, Z0 + 0.5), (u + 1.95, pv - 0.36, Z0 + 0.5), (pu - 1.05, pv - 0.36, Z0 + 0.5)], 0.045, M["pipe_t"], g)
    post(M, "s3", g)
    return (15.9, LV + 0.3, Z0 + 1.7)


# ─────────────────────────── ④ 인증 심사 ───────────────────────────
def s4_review(M):
    """서류 심사 → 현장 심사(심사원 2명 이상) → 심의 → 인증서 (유효 2년)"""
    g = "s4"
    u, v = 20.7, LV
    box(3.4, 2.7, 0.06, u, v, Z0, M["body2"], g, bevel=0.03)
    # 심사 책상 + 서류 더미 + 도장
    du_, dv_ = u - 0.35, v - 0.5
    box(2.3, 0.85, 0.68, du_, dv_, Z0 + 0.06, M["body"], g, bevel=0.04, seg=4)
    box(2.36, 0.91, 0.05, du_, dv_, Z0 + 0.74, M["body2"], g, bevel=0.02)
    for k, n in enumerate((6, 4, 8)):
        for j in range(n):
            box(0.42, 0.3, 0.012, du_ - 0.75 + k * 0.5, dv_ - 0.05, Z0 + 0.79 + j * 0.016, M["paper"], g, bevel=0.002, seg=1, rotz=0.04 * ((j * 7) % 3 - 1))
    cyl(0.09, 0.08, du_ + 0.85, dv_ + 0.1, Z0 + 0.79, M["navy"], g, seg=24)
    cyl(0.035, 0.18, du_ + 0.85, dv_ + 0.1, Z0 + 0.87, M["navy2"], g, seg=16)
    S.obj_from(S.cyl_mesh(0.06, 0.06, 20), L(du_ + 0.85, dv_ + 0.1, Z0 + 1.08), M["navy2"], "knob", (0, 0, 0), g)
    # 현장 심사원 두 명 (안전모)
    hat(M, du_ + 0.3, dv_ + 0.2, Z0 + 0.79, M["amber"], g)
    hat(M, du_ + 0.3, dv_ - 0.22, Z0 + 0.79, M["amber"], g)
    # 인증서 (세운 액자, +v를 봄)
    cu, cv = u + 0.55, v + 0.85
    box(0.1, 0.4, 0.5, cu, cv - 0.12, Z0 + 0.06, M["steel"], g, bevel=0.02)
    box(1.3, 0.06, 0.92, cu, cv, Z0 + 0.5, M["blue"], g, bevel=0.02)
    box(1.16, 0.02, 0.78, cu, cv + 0.035, Z0 + 0.57, M["paper"], g, bevel=0.005)
    for j in range(4):
        box(0.8 - j * 0.12, 0.012, 0.04, cu - 0.08, cv + 0.05, Z0 + 1.15 - j * 0.12, M["body2"], g, bevel=0, seg=1)
    cyl(0.12, 0.03, cu + 0.33, cv + 0.06, Z0 + 0.72, M["seal"], g, axis="v", seg=32)
    for s in (-1, 1):
        box(0.06, 0.012, 0.2, cu + 0.33 + s * 0.05, cv + 0.05, Z0 + 0.5, M["seal"], g, bevel=0, seg=1, rotz=0)
    # 심의 위원회 탁자 (뒤쪽 둥근 탁자 + 의자)
    tu, tv = u + 0.95, v - 0.55
    cyl(0.5, 0.05, tu, tv, Z0 + 0.6, M["body"], g, seg=48)
    cyl(0.07, 0.55, tu, tv, Z0 + 0.06, M["steel"], g, seg=16)
    for k in range(6):
        a = k * math.pi / 3
        box(0.18, 0.18, 0.36, tu + 0.72 * math.cos(a), tv + 0.72 * math.sin(a), Z0 + 0.06, M["blue_l"], g, bevel=0.04)
    post(M, "s4", g)
    return (u, v, Z0 + 1.6)


# ─────────────────────────── ⑤ 소재 · 셀 공장 · ⑥ 수출 ───────────────────────────
def d1_cellplant(M):
    """재생원료를 넣어 만든 소재 · 셀 — 사용 여부 · 함유율 인증 (벽 표시판의 막대가 함유율 자리)"""
    g = "d1"
    u, v = 25.9, 2.2
    box(2.8, 1.4, 1.35, u, v, Z0, M["body"], g, bevel=0.06, seg=4)
    for k in range(3):   # 톱니 지붕
        box(0.93, 1.44, 0.08, u - 0.93 + k * 0.93, v, Z0 + 1.35, M["body2"], g, bevel=0.02)
        box(0.12, 1.36, 0.36, u - 0.6 + k * 0.93, v, Z0 + 1.42, M["blue_l"], g, bevel=0.02)
    box(0.9, 0.04, 0.85, u + 0.7, v + 0.71, Z0, M["body2"], g, bevel=0.02)           # 출입문
    for k in range(6):
        box(0.84, 0.01, 0.02, u + 0.7, v + 0.735, Z0 + 0.1 + k * 0.13, M["steel"], g, bevel=0)
    # 함유율 표시판 (빈 막대 틀 — 공정 재생에서 채워짐)
    box(1.0, 0.04, 0.62, u - 0.6, v + 0.71, Z0 + 0.42, M["board"], g, bevel=0.02)
    box(0.8, 0.012, 0.16, u - 0.6, v + 0.735, Z0 + 0.62, M["body2"], g, bevel=0.005)
    # 나가는 셀 (컨베이어 위)
    box(1.1, 1.0, 0.4, u - 2.0, v + 0.1, Z0, M["body2"], g, bevel=0.04)
    box(1.1, 0.8, 0.03, u - 2.0, v + 0.1, Z0 + 0.4, M["rubber"], g, bevel=0.01)
    for i in range(3):
        for j in range(2):
            cyl(0.1, 0.36, u - 2.3 + i * 0.3, v - 0.1 + j * 0.4, Z0 + 0.43, M["cell"], g, seg=20)
            cyl(0.05, 0.02, u - 2.3 + i * 0.3, v - 0.1 + j * 0.4, Z0 + 0.79, M["cell_cap"], g, seg=16)
    post(M, "d1", g)
    return (u, v, Z0 + 1.9)


def d2_export(M):
    """수출: 컨테이너에 실리는 배터리 — EU에서는 제조사가 재생원료 비율을 문서로 내고 여권에 적는다"""
    g = "d2"
    u, v = 25.5, 8.45
    box(2.6, 1.05, 1.1, u, v, Z0, M["cont"], g, bevel=0.03, seg=2)
    for k in range(11):   # 골판 무늬 (+v 면)
        box(0.06, 0.03, 0.96, u - 1.15 + k * 0.23, v + 0.53, Z0 + 0.07, M["cont2"], g, bevel=0.01)
    for dv in (-0.26, 0.26):   # 문 (+u 끝)
        box(0.03, 0.5, 1.0, u + 1.31, v + dv, Z0 + 0.05, M["cont2"], g, bevel=0.01)
        box(0.04, 0.04, 0.9, u + 1.33, v + dv * 0.5, Z0 + 0.1, M["steel"], g, bevel=0.01)
    # 실을 팩 (팰릿 + 모듈 묶음 + 식별 무늬)
    pu, pv = u + 2.25, v - 0.25
    box(1.1, 1.3, 0.14, pu, pv, Z0, M["body2"], g, bevel=0.03)
    for i in range(2):
        WK.module_(M, pu, pv - 0.4 + i * 0.8, Z0 + 0.14, M["mod_new"], g)
    TR.qr_top(M, pu, pv + 0.4, Z0 + 0.48, 0.34, g, seed=31)
    post(M, "d2", g)
    return (u, v, Z0 + 1.6)


# ─────────────────────────── 투입 · 산출 기록판 ───────────────────────────
def hub(M):
    """가운데 뒤: 기록 건물 + 지붕 위 큰 기록판 (+v를 봄). 줄마다 공정 재생에서 막대가 그려진다"""
    g = "hub"
    u, v = HUB
    box(4.4, 2.4, 1.5, u, v, Z0, M["body"], g, bevel=0.07, seg=4)
    box(4.44, 2.44, 0.1, u, v, Z0 + 1.5, M["navy"], g, bevel=0.04)
    box(3.6, 0.04, 1.0, u - 0.1, v + 1.21, Z0 + 0.25, M["glass_d"], g, bevel=0.01)
    for i in range(5):
        for k in range(5):
            m = M["rack_t"] if (i + k) % 3 == 0 else M["rack_l"]
            box(0.4, 0.02, 0.03, u - 1.6 + i * 0.75, v + 1.24, Z0 + 0.38 + k * 0.17, m, g, bevel=0)
    box(0.04, 0.8, 1.1, u + 2.21, v + 0.4, Z0 + 0.05, M["body2"], g, bevel=0.01)
    # 기록판 (다리 둘 + 판)
    for du in (-1.6, 1.6):
        box(0.14, 0.14, 0.5, u + du, v + 0.3, Z0 + 1.6, M["steel"], g, bevel=0.03)
    box(3.9, 0.14, 1.9, u, v + 0.3, Z0 + 2.0, M["body2"], g, bevel=0.05)
    box(3.7, 0.04, 1.7, u, v + 0.39, Z0 + 2.1, M["board"], g, bevel=0.02)
    for k, key in enumerate(ROWS):
        z = row_z(k)
        box(0.16, 0.02, 0.16, u - 1.6, v + 0.42, z, S.P(f"row_{key}", PL.hexlin(ROW_COL[key]), rough=0.35, coat=0.3), g, bevel=0.01)
        box(2.9, 0.012, 0.012, u + 0.05, v + 0.42, z - 0.02, M["navy2"], g, bevel=0, seg=1)
    # 데이터 선이 들어가는 자리
    box(0.6, 0.3, 0.3, u, v + 1.35, Z0, M["data"], g, bevel=0.04)
    return (u, v, Z0 + 4.0)


def row_z(k):
    return Z0 + 3.55 - k * 0.26


# ─────────────────────────── 바닥 선 ───────────────────────────
def lanes(M):
    g = "lane"
    d = TR.dashes
    # 원료가 지나는 길 (청록): 입구 → ①②③④ → 갈림점 → ⑤ / ⑥
    d(M, [(0.8, LV), FORK], M["teal"], g)
    d(M, [FORK, (FORK[0], 2.2), (24.2, 2.2)], M["teal"], g)
    d(M, [FORK, (FORK[0], 8.45), (24.0, 8.45)], M["teal"], g)
    # 사후관리 (분홍): ④ → 판 앞 가장자리 → ① 입구
    d(M, [(20.7, 8.5), (20.7, LOOP), (0.8, LOOP), (0.8, LV + 0.3)], M["loop"], g)
    # 데이터 선 (파란 점): 기록 기둥 → 본선 → 기록 건물
    TR.dots(M, [(5.8, BUS), (27.4, BUS)], M["data"], g)
    for k, (pu, pv) in POSTS.items():
        TR.dots(M, [(pu, pv - 0.3), (pu, BUS)] if pv > BUS else [(pu, pv + 0.3), (pu, BUS)], M["data"], g)
    TR.dots(M, [(HUB[0], HUB[1] + 1.5), (HUB[0], BUS)], M["data"], g)


def build():
    M = mats_ce()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["s1"] = s1_intake(M)
    a["s2"] = s2_shred(M)
    a["s3"] = s3_refine(M)
    a["s4"] = s4_review(M)
    a["d1"] = d1_cellplant(M)
    a["d2"] = d2_export(M)
    a["hub"] = hub(M)
    a["fork"] = (FORK[0], FORK[1], Z0)
    a["zl"] = (10.0, LOOP + 0.25, 0.0)            # 사후관리 길 이름표 자리
    a["zh"] = (HUB[0] - 5.6, HUB[1] - 1.9, 0.0)   # 기록판 이름표 자리 (건물 왼쪽 뒤 빈 바닥)
    return a
