"""메인 '네 층위' 패널의 3D 그림 — 칸마다 주인공 물체 하나 (Blender 5 / bpy, 코드로 직접 만듦 · 외부 모델 · AI 이미지 없음).

A 처리 경로: 받침대 위 다 쓴 팩 하나에서 네 갈래 길이 섬 넷으로 갈라져 올라감 (업사이클링 길만 점선)
B 지원 기술: 3단 열린 선반, 칸마다 05 진단기 · 06 방화함 · 07 로봇 팔 · 08 전해액 통 · 09 QR 태그 · 10 인증 도장
C 평가:     계단처럼 올라가는 3D 막대 셋 — 11 탄소 구름 · 12 동전 더미 · 13 화물선 섬, 위로 이어지는 선 끝에 노란 구슬
D 설계:     도면 위에서 위로 분해된 팩 — 받침 트레이 → 큰 셀 여섯 → 버스바 · 띠 → 클립 → 뚜껑, 모서리 점선 안내선
좌표는 03 재활용 지도와 같은 도식 좌표 (u 오른쪽 아래, v 왼쪽 아래, z 위). 재질은 지도와 같은 팔레트에 층위색 하나를 더한다.
"""
import math, sys, os
import bpy, bmesh
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "rc"))
sys.path.insert(0, os.path.join(HERE, "..", "anatomy"))
import plant as PL
import scene as S
from plant import box, cyl, L, hexlin

P = S.P


def mats():
    M = PL.mats()
    M["ni_l"] = P("ni_l", hexlin("#7FE0C6"), rough=0.3, coat=0.4)
    M["rose"] = P("rose", hexlin("#E58AAA"), rough=0.3, coat=0.4)
    M["gold"] = P("gold", hexlin("#E9B95A"), metal=0.35, rough=0.3, coat=0.3)
    M["paper"] = P("paper", hexlin("#F3EAD6"), rough=0.75)
    M["grid"] = P("grid", hexlin("#D8C49A"), rough=0.7)
    M["cloud"] = P("cloud", hexlin("#EEF2F8"), rough=0.6, sss=0.1)
    M["sun"] = P("ysun", hexlin("#F5C400"), rough=0.3, emit=(hexlin("#FFD54A"), 2.0))
    M["led"] = P("led", hexlin("#39C6B6"), rough=0.3, emit=(hexlin("#5CF0DE"), 4.0))
    M["red"] = P("redb", hexlin("#E5484D"), rough=0.35)
    return M


def sphere(r, u, v, z, m, seg=24):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    me = bpy.data.meshes.new("sph")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return S.obj_from(me, L(u, v, z), m, "sph")


def rbox(du, dv, dz, u, v, z, m, rot, bevel=0.03):
    """회전한 상자 (중심 기준). rot는 Blender (x, y, z) 회전"""
    return S.obj_from(S.box_mesh(dv, du, dz, bevel=bevel, seg=3), L(u, v, z), m, "rbox", rot)


def seg_line(a, b, r, m, dash=0.16, gap=0.12):
    """a → b 점선 (짧은 원통 토막)"""
    a, b = Vector(L(*a)), Vector(L(*b))
    d = b - a
    n = d.length
    k = d.normalized()
    q = k.to_track_quat("Z", "Y").to_euler()
    t = 0.0
    while t < n:
        e = min(n, t + dash)
        c = a + k * ((t + e) / 2)
        S.obj_from(S.cyl_mesh(r, e - t, 10), tuple(c), m, "dash", tuple(q))
        t = e + gap


def rod(a, b, r, m):
    a, b = Vector(L(*a)), Vector(L(*b))
    d = b - a
    q = d.normalized().to_track_quat("Z", "Y").to_euler()
    return S.obj_from(S.cyl_mesh(r, d.length, 16), tuple((a + b) / 2), m, "rod", tuple(q))


# ───────────────────────── A 처리 경로 ─────────────────────────
def build_paths(M):
    # 받침대 + 다 쓴 팩
    cyl(1.05, 0.32, 1.3, 1.3, 0, M["body2"])
    cyl(1.12, 0.05, 1.3, 1.3, 0.32, M["ni"])
    box(1.5, 0.95, 0.36, 1.3, 1.3, 0.37, M["navy"], bevel=0.05)
    box(1.3, 0.12, 0.02, 1.3, 1.3, 0.73, M["teal"], bevel=0)
    for du in (-0.5, 0.5):
        cyl(0.07, 0.06, 1.3 + du, 1.3 - 0.3, 0.73, M["amber"], seg=16)
    root = (1.3, 1.3, 0.78)
    isl = [  # (u, v, z) 섬 중심 — 왼쪽 · 오른쪽을 번갈아 올라감
        (0.05, 1.75, 1.75),
        (1.85, 0.0, 2.75),
        (-0.55, 1.0, 3.75),
        (1.2, -0.75, 4.75),
    ]
    for i, (u, v, z) in enumerate(isl):
        cyl(0.8, 0.16, u, v, z - 0.16, M["body"])
        cyl(0.84, 0.04, u, v, z - 0.2, M["ni"])
        if i < 3:
            rod(root, (u, v, z - 0.2), 0.045, M["teal"])
        else:
            seg_line(root, (u, v, z - 0.2), 0.045, M["teal"])
    # ① 재제조: 팩 + 바꿔 끼우는 모듈(호박색, 위로 들림)
    u, v, z = isl[0]
    box(0.9, 0.62, 0.22, u, v, z, M["navy"], bevel=0.04)
    for k in range(3):
        box(0.24, 0.5, 0.1, u - 0.28 + k * 0.28, v, z + 0.22, M["body2"], bevel=0.02)
    box(0.24, 0.5, 0.16, u + 0.28, v, z + 0.62, M["amber"], bevel=0.03)
    # ② 재사용: ESS 캐비닛 + 초록 등
    u, v, z = isl[1]
    box(0.62, 0.46, 0.95, u, v, z, M["body"], bevel=0.04)
    for k in range(4):
        box(0.5, 0.012, 0.03, u, v + 0.235, z + 0.25 + k * 0.14, M["navy2"], bevel=0)
    box(0.08, 0.012, 0.08, u + 0.18, v + 0.236, z + 0.8, M["led"], bevel=0)
    cyl(0.1, 0.05, u - 0.12, v, z + 0.95, M["ni"], seg=20)
    # ③ 재활용: 깔때기 + 결정 더미 (니켈 · 코발트 · 망간 · 리튬)
    u, v, z = isl[2]
    cyl(0.34, 0.36, u - 0.12, v - 0.1, z + 0.18, M["steel"], r2=0.13)
    cyl(0.12, 0.18, u - 0.12, v - 0.1, z, M["steel"])
    for (du, dv, s, m, rz) in [(0.28, 0.22, 0.17, "ni", 0.4), (0.42, 0.0, 0.13, "co", 1.1), (0.15, 0.4, 0.12, "mn", 0.2),
                               (0.4, 0.38, 0.1, "li", 0.8), (0.05, 0.25, 0.1, "ni", 1.6)]:
        rbox(s, s, s * 1.3, u + du, v + dv, z + s * 0.65, M[m], (0.3, 0.2, rz), bevel=0.015)
    # ④ 업사이클링: 플라스크(청록 액체) + 양극 분말 더미
    u, v, z = isl[3]
    cyl(0.2, 0.42, u - 0.12, v, z, M["body"], seg=32)
    cyl(0.17, 0.22, u - 0.12, v, z + 0.02, M["liquid"], seg=32)
    cyl(0.08, 0.2, u - 0.12, v, z + 0.42, M["body"], seg=24)
    cyl(0.3, 0.16, u + 0.28, v + 0.18, z, M["blue_l"], r2=0.05)


# ───────────────────────── B 지원 기술 ─────────────────────────
def build_support(M):
    """앞에서 뒤로 높아지는 3단 진열대 — 칸마다 물체 둘 (가리는 것 없이 모두 보임)"""
    W, D = 2.9, 1.12
    steps = []
    for k in range(3):
        v = 1.15 - k * D
        top = 0.34 + k * 0.92
        box(W, D, top, 0, v, 0, M["body"] if k % 2 == 0 else M["body2"], bevel=0.03)
        box(W + 0.02, 0.05, 0.05, 0, v + D / 2 - 0.02, top - 0.05, M["blue"], bevel=0.01)
        steps.append((v, top))
    a, b = -0.7, 0.7
    v, z = steps[2]  # 맨 뒤 · 맨 위: 05 진단기 · 06 방화함
    box(0.62, 0.42, 0.42, a - 0.1, v, z, M["body"], bevel=0.04)
    box(0.012, 0.3, 0.24, a + 0.212, v, z + 0.1, M["screen"], bevel=0)
    box(0.44, 0.012, 0.24, a - 0.1, v + 0.212, z + 0.1, M["screen"], bevel=0)
    cyl(0.12, 0.46, a + 0.38, v + 0.12, z, M["navy"], seg=24)
    cyl(0.125, 0.06, a + 0.38, v + 0.12, z + 0.3, M["teal"], seg=24)
    PL.poly_pipe([(a + 0.1, v + 0.15, z + 0.36), (a + 0.3, v + 0.15, z + 0.62), (a + 0.38, v + 0.12, z + 0.46)], 0.018, M["amber"])
    box(0.7, 0.5, 0.46, b - 0.08, v, z, M["navy"], bevel=0.04)
    box(0.72, 0.52, 0.07, b - 0.08, v, z + 0.2, M["amber"], bevel=0.01)
    cyl(0.035, 0.5, b + 0.42, v + 0.2, z + 0.08, M["body"], seg=12)
    sphere(0.065, b + 0.42, v + 0.2, z + 0.08, M["red"])
    v, z = steps[1]  # 가운데: 07 로봇 팔 · 08 전해액 통
    cyl(0.2, 0.1, a, v, z, M["navy"])
    cyl(0.08, 0.42, a, v, z + 0.1, M["body"], seg=20)
    sphere(0.1, a, v, z + 0.55, M["blue"])
    rod((a, v, z + 0.55), (a + 0.36, v + 0.02, z + 0.86), 0.05, M["body"])
    sphere(0.07, a + 0.36, v + 0.02, z + 0.86, M["blue"])
    rod((a + 0.36, v + 0.02, z + 0.86), (a + 0.52, v + 0.04, z + 0.64), 0.04, M["body"])
    box(0.14, 0.05, 0.12, a + 0.53, v, z + 0.52, M["amber"], bevel=0.01)
    box(0.14, 0.05, 0.12, a + 0.53, v + 0.09, z + 0.52, M["amber"], bevel=0.01)
    cyl(0.25, 0.52, b - 0.12, v, z, M["blue"])
    cyl(0.26, 0.04, b - 0.12, v, z + 0.16, M["navy2"])
    cyl(0.26, 0.04, b - 0.12, v, z + 0.38, M["navy2"])
    cyl(0.07, 0.05, b - 0.05, v + 0.1, z + 0.52, M["navy2"], seg=16)
    cyl(0.26, 0.18, b + 0.38, v + 0.2, z, M["bm"], r2=0.04)
    v, z = steps[0]  # 맨 앞 · 아래: 09 QR 태그 · 10 인증 도장
    box(0.56, 0.05, 0.56, a - 0.05, v + 0.1, z, M["body"], bevel=0.02)
    pat = [0b1110111, 0b1010101, 0b1110111, 0b0001000, 0b1101011, 0b0110110, 0b1011101]
    for r_, row in enumerate(pat):
        for c_ in range(7):
            if row >> (6 - c_) & 1:
                box(0.055, 0.012, 0.055, a - 0.05 - 0.18 + c_ * 0.06, v + 0.13, z + 0.1 + (6 - r_) * 0.06, M["navy"], bevel=0)
    box(0.26, 0.26, 0.05, a + 0.38, v - 0.1, z, M["navy"], bevel=0.01)
    for k in range(4):
        box(0.03, 0.06, 0.012, a + 0.29 + k * 0.06, v + 0.05, z, M["gold"], bevel=0)
        box(0.03, 0.06, 0.012, a + 0.29 + k * 0.06, v - 0.25, z, M["gold"], bevel=0)
    rbox(0.5, 0.64, 0.02, b - 0.05, v - 0.05, z + 0.01, M["body2"], (0, 0, math.radians(8)), bevel=0.005)
    for k in range(4):
        box(0.3, 0.02, 0.005, b - 0.1, v - 0.2 + k * 0.1, z + 0.025, M["steel"], bevel=0)
    cyl(0.18, 0.05, b + 0.12, v + 0.18, z + 0.02, M["gold"], seg=40)
    cyl(0.12, 0.012, b + 0.12, v + 0.18, z + 0.07, M["amber"], seg=40)


# ───────────────────────── C 평가 ─────────────────────────
def build_eval(M):
    box(3.7, 1.5, 0.12, 0, 0, 0, M["body2"], bevel=0.04)
    cols = [(-1.15, 1.25), (0.0, 2.15), (1.15, 3.2)]
    for u, h in cols:
        box(0.78, 0.78, h, u, 0, 0.12, M["body"], bevel=0.04)
        box(0.8, 0.8, 0.05, u, 0, 0.12 + h, M["rose"], bevel=0.015)
    tops = [(u, 0.17 + h) for u, h in cols]
    # 11 탄소 구름 + 잎
    u, z = tops[0]
    for (du, dv, dz, r) in [(0, 0, 0.18, 0.2), (-0.17, 0.08, 0.14, 0.15), (0.17, -0.05, 0.13, 0.15), (0.05, 0.12, 0.3, 0.13), (-0.06, -0.14, 0.12, 0.12)]:
        sphere(r, u + du, dv, z + dz, M["cloud"])
    rbox(0.22, 0.12, 0.03, u + 0.24, 0.24, z + 0.05, M["ni"], (0.3, 0.1, 0.6), bevel=0.01)
    # 12 동전 더미 둘
    u, z = tops[1]
    for k in range(6):
        cyl(0.17, 0.055, u - 0.1 + (k % 2) * 0.012, -0.08, z + k * 0.058, M["gold"], seg=40)
    for k in range(3):
        cyl(0.17, 0.055, u + 0.2, 0.18, z + k * 0.058, M["gold"], seg=40)
    # 13 화물선이 뜬 섬
    u, z = tops[2]
    cyl(0.36, 0.06, u, 0, z, M["blue_l"], seg=48)
    box(0.5, 0.18, 0.1, u - 0.02, 0.02, z + 0.06, M["navy"], bevel=0.03)
    for k, m in enumerate(["amber", "teal", "rose"]):
        box(0.11, 0.13, 0.09, u - 0.15 + k * 0.12, 0.02, z + 0.16, M[m], bevel=0.01)
    box(0.08, 0.12, 0.16, u + 0.2, 0.02, z + 0.16, M["body"], bevel=0.01)
    # 위로 이어지는 선 + 노란 구슬
    pts = [(-1.75, 0.55, 0.5), (-1.15, 0.55, 1.75), (0.0, 0.55, 2.7), (1.15, 0.55, 3.85), (1.6, 0.55, 4.4)]
    PL.poly_pipe(pts, 0.03, M["teal"])
    sphere(0.13, 1.6, 0.55, 4.4, M["sun"])


# ───────────────────────── D 설계 ─────────────────────────
def build_design(M):
    PW, PD = 3.3, 2.1
    box(4.4, 3.2, 0.03, 0, 0, 0, M["paper"], bevel=0.005)
    for k in range(-5, 6):
        box(0.012, 3.1, 0.004, k * 0.4, 0, 0.03, M["grid"], bevel=0)
    for k in range(-3, 4):
        box(4.3, 0.012, 0.004, 0, k * 0.44, 0.03, M["grid"], bevel=0)
    # 받침 트레이
    PL.open_box(PW, PD, 0.42, 0, 0, 0.06, M["navy"], wall=0.09)
    # 큰 셀 여섯 (모듈 없이)
    zc = 1.45
    for k in range(6):
        u = -PW / 2 + 0.36 + k * 0.52
        box(0.44, PD - 0.36, 0.5, u, 0, zc, M["body"], bevel=0.04)
        cyl(0.06, 0.05, u, -PD / 2 + 0.38, zc + 0.5, M["amber"], seg=16)
        cyl(0.06, 0.05, u, PD / 2 - 0.38, zc + 0.5, M["navy2"], seg=16)
    # 버스바 한 묶음 + 띠 둘
    zb = 2.75
    box(PW - 0.3, 0.16, 0.05, 0, -PD / 2 + 0.38, zb, M["teal"], bevel=0.01)
    for dv in (-0.25, 0.35):
        box(PW - 0.2, 0.1, 0.03, 0, dv, zb + 0.02, M["steel"], bevel=0.01)
    # 클립 여섯 (떠 있음)
    zk = 3.35
    for (u, v) in [(-1.3, -PD / 2), (0, -PD / 2), (1.3, -PD / 2), (-1.3, PD / 2), (0, PD / 2), (1.3, PD / 2)]:
        box(0.28, 0.06, 0.16, u, v, zk, M["gold"], bevel=0.015)
    # 뚜껑
    zl = 4.05
    box(PW + 0.04, PD + 0.04, 0.12, 0, 0, zl, M["body"], bevel=0.04)
    box(PW - 0.5, PD - 0.5, 0.012, 0, 0, zl + 0.12, M["body2"], bevel=0)
    box(0.34, 0.34, 0.014, PW / 2 - 0.45, PD / 2 - 0.45, zl + 0.12, M["navy"], bevel=0)
    # 모서리 점선 안내선
    for (u, v) in [(-PW / 2, -PD / 2), (PW / 2, -PD / 2), (-PW / 2, PD / 2), (PW / 2, PD / 2)]:
        seg_line((u, v, 0.5), (u, v, zl), 0.014, M["grid"], dash=0.12, gap=0.1)


BUILD = {"paths": build_paths, "support": build_support, "evaluation": build_eval, "design": build_design}


def build(name):
    S.reset()
    M = mats()
    BUILD[name](M)
    bpy.context.view_layer.update()
    if name == "paths":
        # 떠 있는 섬 · 길이 먼 바닥에 떨어뜨리는 그림자는 어두운 구멍처럼 보이므로 받침대만 그림자를 남김
        for o in bpy.context.scene.objects:
            if o.type in ("MESH", "CURVE") and min((o.matrix_world @ Vector(c)).z for c in o.bound_box) > 0.5:
                o.visible_shadow = False
    PL.lights()
