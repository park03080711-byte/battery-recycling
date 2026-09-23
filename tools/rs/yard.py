"""재사용(두 번째 삶) 등각 장면 — Blender 5 / bpy.

전기차에서 떼어 낸 팩 → 등급 판정 → 재포장 → ESS(태양광) · UPS · 태양광 가로등 · 소형 모빌리티.
01 재제조 작업장(../rm/workshop.py)과 03 공정 지도(../rc/plant.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래.
"""
import math, os, sys
import bpy, bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import plant as PL
import workshop as WK
from plant import box, cyl, ring, open_box, pipe, poly_pipe

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=26.5, v0=0.0, v1=10.4)


def mats_rs():
    M = WK.mats_rm()
    P = S.P
    M["panel"] = P("solar", PL.hexlin("#2E4BC6"), rough=0.18, coat=0.8)
    M["panel_f"] = P("solar_frame", PL.hexlin("#D8DEE9"), metal=0.4, rough=0.3)
    M["seat"] = P("seat", PL.hexlin("#2B3656"), rough=0.6)
    M["lamp"] = P("lamp", PL.hexlin("#FFF4D6"), rough=0.4, emit=(PL.hexlin("#FFE7A3"), 2.5))
    return M


# ─────────────────────────── 준비 ───────────────────────────
def car_in(M):
    g = "cin"
    u, v = 2.8, 7.6
    WK.car(M, u, v, Z0, g)
    # 차 옆으로 빼낸 팩을 실은 운반대
    box(3.2, 2.0, 0.12, u + 0.2, v - 2.4, Z0 + 0.2, M["steel"], g, bevel=0.03)
    for du in (-1.3, 1.3):
        for dv in (-0.8, 0.8):
            cyl(0.12, 0.1, u + 0.2 + du, v - 2.4 + dv, Z0 + 0.12, M["rubber"], g, axis="u", seg=20)
    WK.pack(M, u + 0.2, v - 2.4, Z0 + 0.32, g, lid=True)
    return (u - 0.2, v + 1.7, Z0)


def r1_grade(M):
    g = "s1"
    u, v = 7.4, 4.6
    box(3.3, 2.2, 0.55, u, v, Z0, M["body2"], g, bevel=0.05)
    WK.pack(M, u, v, Z0 + 0.55, g)
    # 모듈 위 등급 표시 (청록 · 호박)
    for i in range(4):
        for j in range(2):
            mu, mv = u - 1.05 + i * 0.7, v - 0.42 + j * 0.84
            box(0.14, 0.14, 0.04, mu + 0.18, mv + 0.22, Z0 + 1.23, M["green"] if (i + j) % 3 else M["amber"], g, bevel=0.01)
    # 시험 캐비닛 (충방전 · 임피던스)
    cu, cv = u - 0.2, v - 2.2
    box(2.4, 0.9, 1.9, cu, cv, Z0, M["body"], g, bevel=0.06, seg=4)
    box(1.0, 0.03, 0.6, cu - 0.5, cv + 0.46, Z0 + 1.1, M["screen"], g, bevel=0.01)
    for k in range(4):
        box(0.12, 0.03, 0.12, cu + 0.4 + (k % 2) * 0.25, cv + 0.46, Z0 + 1.35 - (k // 2) * 0.3, M["green"] if k != 2 else M["amber"], g, bevel=0)
    box(2.44, 0.94, 0.08, cu, cv, Z0 + 1.9, M["blue"], g, bevel=0.03)
    for k, m in enumerate((M["navy"], M["amber"])):
        pipe([(cu - 0.2 + k * 0.4, cv + 0.46, Z0 + 0.9), (cu + k * 0.3, cv + 1.2, Z0 + 1.35), (u + 0.3 + k * 0.2, v - 0.4, Z0 + 1.2)], 0.026, m, g)
    return (u, v - 0.2, Z0 + 1.4)


def r2_repack(M):
    g = "s2"
    u, v = 11.6, 4.0
    # 작업대: 모듈을 새 함체(회색 캐비닛 유닛)에 다시 묶음
    box(3.4, 2.0, 0.55, u, v, Z0, M["body2"], g, bevel=0.05)
    for i in range(3):
        before = set(bpy.context.scene.objects)
        WK.module_(M, u - 1.1 + i * 0.75, v - 0.3, Z0 + 0.55, M["mod"], g)
        if i == 2:  # 새 함체로 옮겨 담는 모듈 (공정 재생 때 움직임)
            for o in set(bpy.context.scene.objects) - before:
                o["anim"] = "s2"
    open_box(1.4, 1.1, 0.7, u + 0.9, v + 0.2, Z0 + 0.55, M["body"], g, wall=0.06)
    WK.module_(M, u + 0.9, v + 0.2, Z0 + 0.62, M["mod_new"], g)
    box(0.5, 0.06, 0.2, u + 0.9, v - 0.33, Z0 + 1.05, M["pcb_g"] if "pcb_g" in M else M["green"], g, bevel=0.01)  # 새 BMS 기판
    # 완성된 두 번째 삶 유닛 (팔레트 위)
    box(2.4, 1.6, 0.14, u + 0.4, v + 2.4, Z0, M["body2"], g, bevel=0.03)
    for i in range(3):
        box(0.7, 1.2, 0.9, u - 0.4 + i * 0.8, v + 2.4, Z0 + 0.14, M["body"], g, bevel=0.06, seg=3)
        box(0.72, 0.06, 0.12, u - 0.4 + i * 0.8, v + 3.0, Z0 + 0.8, M["blue"], g, bevel=0.02)
    return (u + 0.2, v, Z0 + 1.4)


# ─────────────────────────── 활용처 ───────────────────────────
def solar_strip(M, u, v, z, n, g, tilt=0.32):
    """태양광 패널 한 줄: u 방향으로 이어 붙인 n장, v 방향으로 기울임"""
    L = n * 1.05
    S.obj_from(S.box_mesh(1.3, L + 0.1, 0.04, bevel=0.01), PL.L(u, v, z), M["panel_f"], "pf", (0, 0, 0), g).rotation_euler = (0, -tilt, 0)
    for k in range(n):
        o = S.obj_from(S.box_mesh(1.2, 0.98, 0.03, bevel=0.005), PL.L(u - L / 2 + 0.525 + k * 1.05, v, z + 0.03), M["panel"], "panel", (0, 0, 0), g)
        o.rotation_euler = (0, -tilt, 0)
        # 기울인 판의 중심 높이를 맞춘다 (패널도 같은 축으로 회전)
    for du in (-L / 2 + 0.2, L / 2 - 0.2):
        box(0.06, 0.06, 0.28, u + du, v - 0.45, z - 0.28, M["steel"], g, bevel=0)


def d1_ess(M):
    g = "d1"
    u, v = 18.6, 2.6
    # 컨테이너형 ESS + 냉방기 + 지붕 위 태양광 패널
    box(5.0, 2.2, 2.3, u, v, Z0, M["body"], g, bevel=0.06, seg=4)
    for k in range(6):
        box(0.04, 0.02, 1.9, u - 2.0 + k * 0.8, v + 1.11, Z0 + 0.2, M["body2"], g, bevel=0)
    box(1.4, 0.03, 1.8, u + 1.4, v + 1.12, Z0 + 0.1, M["body2"], g, bevel=0.01)  # 문
    box(0.9, 0.02, 0.5, u - 1.6, v + 1.12, Z0 + 1.5, M["screen"], g, bevel=0.01)
    box(5.04, 2.24, 0.1, u, v, Z0 + 2.3, M["blue"], g, bevel=0.03)
    box(0.8, 1.9, 0.5, u - 2.0, v, Z0 + 2.4, M["body2"], g, bevel=0.05)
    cyl(0.22, 0.05, u - 2.0, v - 0.4, Z0 + 2.9, M["steel"], g, seg=24)
    cyl(0.22, 0.05, u - 2.0, v + 0.4, Z0 + 2.9, M["steel"], g, seg=24)
    solar_strip(M, u + 0.6, v - 0.5, Z0 + 2.75, 3, g)
    solar_strip(M, u + 0.6, v + 0.55, Z0 + 2.75, 3, g)
    return (u - 0.4, v, Z0 + 3.0)


def prism(M, du, dv, h, u, v, z, m, g):
    """삼각 지붕: v 방향 폭 dv, u 방향 길이 du, 높이 h"""
    bm = bmesh.new()
    pts = [(-dv / 2, 0), (dv / 2, 0), (0, h)]
    vs = []
    for x in (-du / 2, du / 2):
        for (a, b) in pts:
            vs.append(bm.verts.new((a, x, b)))
    bm.faces.new([vs[0], vs[1], vs[2]])
    bm.faces.new([vs[5], vs[4], vs[3]])
    for i in range(3):
        j = (i + 1) % 3
        bm.faces.new([vs[i], vs[3 + i], vs[3 + j], vs[j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("roof")
    bm.to_mesh(me)
    bm.free()
    S.obj_from(me, PL.L(u, v, z), m, "roof", (0, 0, 0), g)


def d1_home_station(M):
    """ESS의 다른 쓰임: 가정용(벽걸이 배터리) · 충전소용(배터리 캐비닛 + 충전기)"""
    g = "d1"
    # 충전소: 주차한 전기차 + 충전기 + 재사용 배터리 캐비닛
    WK.car(M, 23.2, 6.3, Z0, g)
    box(0.45, 0.45, 1.3, 25.9, 5.5, Z0, M["body"], g, bevel=0.05, seg=3)
    box(0.02, 0.4, 0.3, 25.66, 5.5, Z0 + 0.9, M["screen"], g, bevel=0.01)
    pipe([(25.66, 5.5, Z0 + 0.6), (25.5, 5.7, Z0 + 0.3), (25.3, 5.8, Z0 + 0.55)], 0.03, M["navy"], g)
    box(0.7, 1.1, 1.4, 25.9, 7.0, Z0, M["body"], g, bevel=0.05, seg=3)
    box(0.06, 1.12, 0.14, 25.53, 7.0, Z0 + 1.1, M["blue"], g, bevel=0.02)
    # 집: 벽걸이 배터리
    hu, hv = 24.2, 2.3
    box(2.4, 2.2, 1.7, hu, hv, Z0, M["body"], g, bevel=0.05, seg=3)
    prism(M, 2.6, 2.5, 1.0, hu, hv, Z0 + 1.7, M["body2"], g)
    box(0.9, 0.03, 1.1, hu - 0.4, hv + 1.12, Z0 + 0.1, M["navy2"], g, bevel=0.02)   # 문
    box(0.03, 0.5, 0.8, hu - 1.22, hv - 0.2, Z0 + 0.4, M["body2"], g, bevel=0.02)   # 벽걸이 배터리
    box(0.03, 0.52, 0.08, hu - 1.23, hv - 0.2, Z0 + 1.1, M["blue"], g, bevel=0.01)
    return (25.9, 6.2, Z0 + 1.6)


def d2_ups(M):
    g = "d2"
    u, v = 12.0, 8.2
    # 전산실 한 칸 (앞이 트인 방) + UPS 랙 두 대
    w = 0.1
    box(3.6, 2.6, w, u, v, Z0, M["body2"], g, bevel=0.02)
    box(3.6, w, 2.0, u, v - 1.25, Z0, M["body"], g, bevel=0.03)
    box(w, 2.6, 2.0, u - 1.75, v, Z0, M["body"], g, bevel=0.03)
    for k in range(3):
        du = -1.0 + k * 0.95
        box(0.7, 0.9, 1.8, u + du, v - 0.6, Z0 + w, M["navy"] if k < 2 else M["body"], g, bevel=0.04)
        for j in range(5):
            box(0.6, 0.02, 0.1, u + du, v - 0.14, Z0 + 0.4 + j * 0.28, M["green"] if (j + k) % 4 else M["blue"], g, bevel=0)
    return (u, v - 0.6, Z0 + 2.0)


def d3_lamp(M):
    g = "d3"
    u, v = 16.6, 9.2
    box(0.5, 0.5, 0.12, u, v, Z0, M["steel"], g, bevel=0.02)
    cyl(0.07, 3.2, u, v, Z0 + 0.12, M["body2"], g, seg=20)
    box(0.5, 0.36, 0.6, u, v, Z0 + 0.9, M["body"], g, bevel=0.04)  # 배터리 함
    box(0.52, 0.38, 0.06, u, v, Z0 + 1.5, M["blue"], g, bevel=0.02)
    pipe([(u, v, Z0 + 3.2), (u + 0.4, v, Z0 + 3.45), (u + 0.9, v, Z0 + 3.4)], 0.05, M["body2"], g)
    box(0.5, 0.26, 0.1, u + 0.95, v, Z0 + 3.3, M["lamp"], g, bevel=0.03)
    S.obj_from(S.box_mesh(0.9, 1.2, 0.04, bevel=0.01), PL.L(u - 0.1, v, Z0 + 3.45), M["panel"], "lamp_panel", (0.5, 0, 0), g)
    return (u, v, Z0 + 3.6)


def golf_cart(M, u, v, g):
    for du in (-0.7, 0.7):
        for dv in (-0.5, 0.5):
            cyl(0.22, 0.14, u + du, v + dv, Z0 + 0.22, M["rubber"], g, axis="v", seg=24)
    box(2.0, 1.1, 0.35, u, v, Z0 + 0.25, M["car2"], g, bevel=0.1, seg=3)
    box(0.7, 1.0, 0.35, u + 0.1, v, Z0 + 0.6, M["seat"], g, bevel=0.08)
    for du in (-0.7, 0.5):
        for dv in (-0.45, 0.45):
            box(0.05, 0.05, 1.0, u + du, v + dv, Z0 + 0.6, M["steel"], g, bevel=0)
    box(1.5, 1.2, 0.07, u - 0.1, v, Z0 + 1.6, M["car"], g, bevel=0.03)


def scooter(M, u, v, g):
    for du in (-0.55, 0.55):
        cyl(0.2, 0.08, u + du, v, Z0 + 0.2, M["rubber"], g, axis="v", seg=24)
    box(1.1, 0.28, 0.18, u, v, Z0 + 0.25, M["car"], g, bevel=0.06)
    box(0.5, 0.3, 0.2, u - 0.25, v, Z0 + 0.43, M["seat"], g, bevel=0.06)
    box(0.07, 0.07, 0.7, u + 0.5, v, Z0 + 0.35, M["steel"], g, bevel=0)
    box(0.07, 0.5, 0.05, u + 0.5, v, Z0 + 1.05, M["steel"], g, bevel=0)


def wheelchair(M, u, v, g):
    for dv in (-0.33, 0.33):
        cyl(0.28, 0.05, u, v + dv, Z0 + 0.28, M["rubber"], g, axis="v", seg=28)
        cyl(0.08, 0.05, u + 0.4, v + dv * 0.9, Z0 + 0.08, M["rubber"], g, axis="v", seg=16)
    box(0.5, 0.56, 0.08, u + 0.1, v, Z0 + 0.45, M["seat"], g, bevel=0.03)
    box(0.08, 0.56, 0.5, u - 0.14, v, Z0 + 0.5, M["seat"], g, bevel=0.03)
    box(0.3, 0.3, 0.18, u - 0.05, v, Z0 + 0.22, M["blue"], g, bevel=0.03)  # 배터리 팩


def d4_mobility(M):
    g = "d4"
    u, v = 19.2, 8.6
    golf_cart(M, u, v - 0.6, g)
    scooter(M, u - 0.9, v + 1.2, g)
    wheelchair(M, u + 0.9, v + 1.25, g)
    # 충전 기둥
    box(0.4, 0.4, 1.1, u - 1.7, v - 1.4, Z0, M["body"], g, bevel=0.04)
    cyl(0.07, 0.08, u - 1.7, v - 1.2, Z0 + 0.9, M["green"], g, seg=16)
    return (u, v, Z0 + 1.8)


def lanes(M):
    """흐름선: 차 → 판정 → 재포장 → 갈림 → 네 활용처"""
    g = "lane"
    paths = [
        [(4.0, 5.2), (5.6, 5.2)],
        [(9.2, 4.2), (9.8, 4.2)],
        [(13.5, 4.4), (23.4, 4.4)],
        [(14.4, 4.4), (14.4, 9.8), (19.6, 9.8), (19.6, 8.8)],
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
    M = mats_rs()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["cin"] = car_in(M)
    a["s1"] = r1_grade(M)
    a["s2"] = r2_repack(M)
    a["d1"] = d1_ess(M)
    a["d1b"] = d1_home_station(M)
    a["d2"] = d2_ups(M)
    a["d3"] = d3_lamp(M)
    a["d4"] = d4_mobility(M)
    a["fork"] = (14.4, 4.6, Z0)
    return a
