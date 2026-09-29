"""로봇 해체 셀 등각 장면 — Blender 5 / bpy.

① 비전 스캔(위 카메라 문) → ② 나사 풀기(로봇 팔 A · 공구 거치대) → ③ 사람 협업 구역(커넥터 · 들기) → ④ 모듈 꺼내기(로봇 팔 B)
→ ⑤ 분류 · 반출(컨베이어 · 세 통). 로봇 팔은 관절(빈 물체)로 묶어 공정 재생에서 실제로 움직인다(animate.py).
03 공정 지도(../rc/plant.py) · 01 작업장(../rm/workshop.py)의 도우미 · 재질 · 조명 · 카메라를 그대로 쓴다.
외부 모델 · AI 이미지 없음. 좌표: (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래. 배치는 설명용으로 단순화했다.
"""
import math, os, sys
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "rm"))
import plant as PL
import workshop as WK
from plant import box, cyl, open_box, pipe, L

S = PL.S
Z0 = PL.SLAB
PLAT = dict(u0=0.0, u1=24.6, v0=2.6, v1=9.0)
LV = 8.2
ARMS = {}


def mats_ad():
    M = WK.mats_rm()
    P = S.P
    M["robot"] = P("robot", PL.hexlin("#F1F4F9"), rough=0.35, coat=0.4)
    M["joint"] = P("joint", PL.hexlin("#5B7CFA"), rough=0.35, coat=0.3)
    M["cam"] = P("cam", PL.hexlin("#2B3656"), rough=0.25, coat=0.6)
    M["hazard"] = P("hazard", PL.hexlin("#F3B64A"), rough=0.4)
    M["zone"] = P("zone", PL.hexlin("#FCE6B8"), rough=0.7)
    M["roller"] = P("roller", PL.hexlin("#C7CFDC"), metal=0.4, rough=0.35)
    return M


def lamp(M, u, v, z, m, g, r=0.07):
    cyl(r, 0.05, u, v, z, m, g, axis="v", seg=20)


def empty(name, parent=None, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    S.link(e)
    if parent is not None:
        e.parent = parent
    e.location = loc
    return e


def child(o, parent, loc):
    """물체를 관절에 붙이고 관절 기준 위치로 옮김"""
    o.parent = parent
    o.matrix_parent_inverse.identity()
    o.location = loc          # 회전(원통 축 방향)은 그대로 둠
    return o


# ─────────────────────────── 로봇 팔 (6축을 단순화한 4관절) ───────────────────────────
A1, A2, TOOL = 1.45, 1.3, 0.34  # 위팔 · 아래팔 · 공구 길이


def arm(M, name, u, v, g, tool="nut"):
    """관절: J1(수직축 회전) → J2 어깨 → J3 팔꿈치 → J4 손목(공구가 늘 아래를 향하게)"""
    objs = []
    base = cyl(0.42, 0.22, u, v, Z0, M["body2"], g, seg=40)            # 고정 받침 (움직이지 않음)
    j1 = empty(f"{name}_j1", loc=L(u, v, Z0 + 0.22))
    t = cyl(0.3, 0.36, 0, 0, 0, M["robot"], g, seg=40); objs.append(child(t, j1, (0, 0, 0.18)))
    j2 = empty(f"{name}_j2", j1, (0, 0, 0.42))
    s = cyl(0.17, 0.42, 0, 0, 0, M["joint"], g, axis="u", seg=32); objs.append(child(s, j2, (0, 0, 0)))
    ua = box(0.3, 0.3, A1, 0, 0, 0, M["robot"], g, bevel=0.08, seg=3); objs.append(child(ua, j2, (0, 0, A1 / 2)))
    j3 = empty(f"{name}_j3", j2, (0, 0, A1))
    e = cyl(0.14, 0.34, 0, 0, 0, M["joint"], g, axis="u", seg=32); objs.append(child(e, j3, (0, 0, 0)))
    fa = box(0.24, 0.24, A2, 0, 0, 0, M["robot"], g, bevel=0.07, seg=3); objs.append(child(fa, j3, (0, 0, A2 / 2)))
    j4 = empty(f"{name}_j4", j3, (0, 0, A2))
    w = cyl(0.11, 0.26, 0, 0, 0, M["joint"], g, axis="u", seg=24); objs.append(child(w, j4, (0, 0, 0)))
    if tool == "nut":
        tl = cyl(0.07, TOOL, 0, 0, 0, M["steel"], g, seg=20); objs.append(child(tl, j4, (0, 0, TOOL / 2)))
    else:
        pl = box(0.46, 0.36, 0.06, 0, 0, 0, M["robot"], g, bevel=0.02); objs.append(child(pl, j4, (0, 0, TOOL - 0.03)))
        for dx in (-0.2, 0.2):
            f = box(0.05, 0.3, 0.16, 0, 0, 0, M["steel"], g, bevel=0.01); objs.append(child(f, j4, (dx, 0, TOOL + 0.05)))
    for o in objs:
        o["anim"] = name
    ARMS[name] = dict(j=(j1, j2, j3, j4), objs=objs, base=Vector(L(u, v, Z0 + 0.22 + 0.42)))
    return ARMS[name]


def reach(name, u, v, z):
    """공구 끝을 (u, v, z)에 두는 관절 각도 — 두 마디 역기구학, 공구는 수직 아래"""
    a = ARMS[name]
    j1, j2, j3, j4 = a["j"]
    tip = Vector(L(u, v, z))
    wrist = tip + Vector((0, 0, TOOL))
    d = wrist - a["base"]
    yaw = math.atan2(d.y, d.x)
    r = math.hypot(d.x, d.y)
    h = d.z
    dist = min(math.hypot(r, h), A1 + A2 - 1e-4)
    cg = (A1 * A1 + A2 * A2 - dist * dist) / (2 * A1 * A2)
    t3 = math.pi - math.acos(max(-1.0, min(1.0, cg)))       # 팔꿈치 굽힘 (앞으로)
    alpha = math.atan2(r, h)
    t2 = alpha - math.atan2(A2 * math.sin(t3), A1 + A2 * math.cos(t3))
    t4 = math.pi - t2 - t3
    j1.rotation_euler = (0, 0, yaw)
    j2.rotation_euler = (0, t2, 0)
    j3.rotation_euler = (0, t3, 0)
    j4.rotation_euler = (0, t4, 0)


# ─────────────────────────── ① 비전 스캔 ───────────────────────────
def s1_scan(M):
    g = "s1"
    u, v = 3.6, 6.0
    box(3.6, 1.6, 0.45, u, v, Z0, M["body2"], g, bevel=0.04)                # 롤러 컨베이어 받침
    for k in range(9):
        cyl(0.05, 1.5, u - 1.6 + k * 0.4, v, Z0 + 0.45, M["roller"], g, axis="v", seg=12)
    WK.pack(M, u - 0.2, v, Z0 + 0.5, g, lid=True)
    # 카메라 문 (위에서 내려다보는 2D 카메라)
    for dv in (-1.05, 1.05):
        box(0.16, 0.16, 2.2, u + 0.5, v + dv, Z0, M["body"], g, bevel=0.03)
    box(0.32, 2.3, 0.2, u + 0.5, v, Z0 + 2.2, M["body"], g, bevel=0.04)
    box(0.34, 2.32, 0.05, u + 0.5, v, Z0 + 2.4, M["blue"], g, bevel=0.02)
    box(0.26, 0.26, 0.2, u + 0.5, v, Z0 + 2.0, M["cam"], g, bevel=0.03)
    # 화면
    box(0.12, 0.12, 1.1, u + 2.2, v + 0.4, Z0, M["steel"], g, bevel=0.02)
    box(0.72, 0.06, 0.46, u + 2.2, v + 0.46, Z0 + 1.1, M["body2"], g, bevel=0.02)
    box(0.62, 0.02, 0.36, u + 2.2, v + 0.5, Z0 + 1.15, M["screen"], g, bevel=0.01)
    return (u, v, Z0 + 2.4)


# ─────────────────────────── ② 나사 풀기 ───────────────────────────
def s2_unscrew(M):
    g = "s2"
    u, v = 8.6, 6.0
    box(3.4, 2.1, 0.55, u, v, Z0, M["body2"], g, bevel=0.05)                # 고정대
    WK.pack(M, u, v, Z0 + 0.55, g, lid=True)
    for i in range(3):                                                        # 뚜껑 나사 자리 (윗면)
        for j in (-1, 1):
            cyl(0.06, 0.03, u - 1.1 + i * 1.1, v + j * 0.78, Z0 + 0.97, M["steel"], g, seg=16)
    arm(M, "armA", u, v - 1.45, g, tool="nut")
    reach("armA", u + 0.4, v - 0.5, Z0 + 1.9)                                 # 쉬는 자세
    # 공구 거치대 (공구 교체)
    tu, tv = u + 2.2, v - 2.0
    box(0.9, 0.5, 0.9, tu, tv, Z0, M["body"], g, bevel=0.04)
    for k in range(3):
        cyl(0.07, 0.3, tu - 0.28 + k * 0.28, tv, Z0 + 0.9, M["steel"] if k != 1 else M["amber"], g, seg=16)
    return (u, v, Z0 + 2.0)


# ─────────────────────────── ③ 사람 협업 구역 ───────────────────────────
def s3_collab(M):
    g = "s3"
    u, v = 13.2, 6.0
    box(3.8, 3.0, 0.012, u, v + 0.3, Z0, M["zone"], g, bevel=0)             # 협업 구역 바닥
    for k in range(10):
        box(0.35, 0.08, 0.013, u - 1.7 + k * 0.38, v + 1.8, Z0, M["hazard"] if k % 2 == 0 else M["navy"], g, bevel=0)
    box(3.0, 1.9, 0.6, u, v, Z0, M["body2"], g, bevel=0.05)                 # 작업대
    WK.pack(M, u - 0.1, v, Z0 + 0.6, g)                                       # 뚜껑을 연 팩
    box(3.0, 1.9, 0.08, u + 0.2, v - 1.5, Z0 + 0.02, M["navy"], g, bevel=0.04)  # 떼어 낸 뚜껑 (옆에 눕힘)
    # 라이트 커튼 기둥 (사람이 들어오면 로봇이 멈춤)
    for du in (-1.9, 1.9):
        box(0.1, 0.1, 1.6, u + du, v + 1.7, Z0, M["hazard"], g, bevel=0.02)
        for k in range(4):
            box(0.03, 0.02, 0.06, u + du + (0.06 if du < 0 else -0.06), v + 1.7, Z0 + 0.3 + k * 0.35, M["body2"], g, bevel=0)
    # 커넥터 · 배선 분류함
    bu, bv = u + 2.2, v + 0.9
    open_box(0.9, 0.7, 0.35, bu, bv, Z0, M["body"], g, wall=0.05)
    for k in range(4):
        box(0.14, 0.08, 0.06, bu - 0.2 + (k % 2) * 0.3, bv - 0.15 + (k // 2) * 0.25, Z0 + 0.05, M["amber"] if k % 2 else M["navy"], g, bevel=0.01)
    lamp(M, u + 1.9, v + 1.7, Z0 + 1.66, M["body2"], g, r=0.08)                # 상태등 자리 (기둥 위)
    return (u, v, Z0 + 1.8)


# ─────────────────────────── ④ 모듈 꺼내기 ───────────────────────────
MOD_PICK = None


def s4_pick(M):
    global MOD_PICK
    g = "s4"
    u, v = 17.6, 6.0
    box(3.0, 1.9, 0.55, u, v, Z0, M["body2"], g, bevel=0.05)
    WK.pack(M, u, v, Z0 + 0.55, g, empty=(3, 1))                                # 한 칸은 비움 → 그 모듈이 집히는 모듈
    before = set(bpy.context.scene.objects)
    mu, mv = u - 1.05 + 3 * 0.7, v - 0.42 + 1 * 0.84
    WK.module_(M, mu, mv, Z0 + 0.55 + 0.34, M["mod"], g)
    MOD_PICK = dict(objs=[o for o in bpy.context.scene.objects if o not in before], at=(mu, mv, Z0 + 0.55 + 0.34))
    for o in MOD_PICK["objs"]:
        o["anim"] = "armB"
    arm(M, "armB", u + 1.3, v - 1.5, g, tool="grip")
    reach("armB", u + 1.0, v - 0.3, Z0 + 1.9)
    return (u, v, Z0 + 2.0)


# ─────────────────────────── ⑤ 분류 · 반출 ───────────────────────────
def s5_sort(M):
    g = "s5"
    u, v = 21.9, 4.6
    box(4.2, 0.9, 0.5, u, v, Z0, M["body2"], g, bevel=0.04)                # 컨베이어 (팔 B가 모듈을 올려 두는 곳)
    box(4.0, 0.7, 0.06, u, v, Z0 + 0.5, M["rubber"], g, bevel=0.02)
    for k, m in enumerate((M["blue"], M["teal"], M["amber"])):             # 세 통: 재제조 · 재사용 · 재활용 (05 진단과 같은 색)
        bu = u - 1.2 + k * 1.2
        open_box(0.9, 0.8, 0.55, bu, v + 1.3, Z0, M["body"], g, wall=0.05)
        box(0.92, 0.04, 0.1, bu, v + 1.72, Z0 + 0.4, m, g, bevel=0.01)
    return (u, v + 0.7, Z0 + 1.2)


def lanes(M):
    g = "lane"
    pts = [(0.8, LV), (21.9, LV), (21.9, 6.6)]
    for (u0, v0), (u1, v1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(u1 - u0, v1 - v0) / 0.5))
        for k in range(n):
            t = (k + 0.25) / n
            uu, vv = u0 + (u1 - u0) * t, v0 + (v1 - v0) * t
            horiz = abs(u1 - u0) > abs(v1 - v0)
            box(0.26 if horiz else 0.06, 0.06 if horiz else 0.26, 0.01, uu, vv, Z0, M["teal"], g, bevel=0)


def build():
    ARMS.clear()
    M = mats_ad()
    PL.platform(M, PLAT, "plat")
    lanes(M)
    a = {}
    a["s1"] = s1_scan(M)
    a["s2"] = s2_unscrew(M)
    a["s3"] = s3_collab(M)
    a["s4"] = s4_pick(M)
    a["s5"] = s5_sort(M)
    return a
