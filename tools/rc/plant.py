"""재활용 공정 등각(아이소메트릭) 장면 — Blender 5 / bpy.

해외 전처리 거점(Spoke) 3단계 → 블랙매스 이송 → 국내 후처리 거점(Hub) 4단계.
정투영 카메라를 등각 각도(35.264° / 45°)에 두고, 밝은 바탕에 얹히도록 투명 배경 + 그림자 받이로 렌더한다.
형상 · 재질 모두 코드로 직접 만든다 — 외부 모델 · AI 이미지 없음.

좌표: 도식 좌표 (u, v, z) — u는 화면 오른쪽 아래, v는 왼쪽 아래(사이트 SVG 등각 함수와 같은 방향).
      Blender 좌표로는 (x, y, z) = (v, u, z).
"""
import math, sys, os
import bpy, bmesh
from mathutils import Vector

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "anatomy"))
import scene as S  # 공통 도우미(box_mesh, cyl_mesh, tube, 재질 P, render_setup, project)

R2 = math.sqrt(2)


def hexlin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def L(u, v, z=0.0):
    return (v, u, z)


def box(du, dv, dz, u, v, z, m, grp=None, bevel=0.05, seg=3, rotz=0.0):
    """(u, v)는 바닥면 중심, z는 바닥 높이"""
    return S.obj_from(S.box_mesh(dv, du, dz, bevel=bevel, seg=seg), L(u, v, z + dz / 2), m, "box", (0, 0, rotz), grp)


def cyl(r, h, u, v, z, m, grp=None, seg=48, r2=None, axis="z"):
    rot = {"z": (0, 0, 0), "u": (-math.pi / 2, 0, 0), "v": (0, math.pi / 2, 0)}[axis]
    if axis == "z":
        loc = L(u, v, z + h / 2)
    else:
        loc = L(u, v, z)
    o = S.obj_from(S.cyl_mesh(r, h, seg, r2), loc, m, "cyl", rot, grp)
    bev = o.modifiers.new("bev", "BEVEL")
    bev.width = min(0.03, r * 0.2)
    bev.segments = 2
    bev.limit_method = "ANGLE"
    return o


def open_box(du, dv, dz, u, v, z, m, grp=None, wall=0.07, bevel=0.03):
    """위가 열린 상자: 바닥 + 벽 네 장"""
    box(du, dv, wall, u, v, z, m, grp, bevel=bevel)
    box(wall, dv, dz, u - du / 2 + wall / 2, v, z, m, grp, bevel=bevel)
    box(wall, dv, dz, u + du / 2 - wall / 2, v, z, m, grp, bevel=bevel)
    box(du - 2 * wall, wall, dz, u, v - dv / 2 + wall / 2, z, m, grp, bevel=bevel)
    box(du - 2 * wall, wall, dz, u, v + dv / 2 - wall / 2, z, m, grp, bevel=bevel)


def ring(r, h, u, v, z, m, grp=None, t=0.05, seg=64):
    """두께 있는 원통 벽(뚜껑 없음)"""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=h)
    me = bpy.data.meshes.new("ring")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = S.obj_from(me, L(u, v, z + h / 2), m, "ring", (0, 0, 0), grp)
    so = o.modifiers.new("sol", "SOLIDIFY")
    so.thickness = t
    so.offset = -1
    return o


def pipe(pts, r, m, grp=None):
    return S.tube([L(*p) for p in pts], r, m, grp, res=3)


def poly_pipe(pts, r, m, grp=None):
    """꺾인 배관: 직선 구간 + 모서리 구"""
    cu = bpy.data.curves.new("pp", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        x, y, z = L(*c)
        p.co = (x, y, z, 1)
    o = bpy.data.objects.new("pp", cu)
    cu.materials.append(m)
    S.link(o)
    if grp:
        S.tag(o, grp)
    return o


# ─────────────────────────── 재질 (아이소메트릭 팔레트) ───────────────────────────
def mats():
    P = S.P
    M = {}
    M["slab"] = P("slab", hexlin("#FBFCFF"), rough=0.62)
    M["trim"] = P("trim", hexlin("#D5DCE8"), rough=0.6)
    M["road"] = P("road", hexlin("#E4E9F2"), rough=0.7)
    M["body"] = P("body", hexlin("#F1F4F9"), rough=0.5, coat=0.15)
    M["body2"] = P("body2", hexlin("#DCE2EC"), rough=0.5)
    M["steel"] = P("steel", hexlin("#C7CFDC"), metal=0.55, rough=0.32)
    M["navy"] = P("navy", hexlin("#1F2A44"), rough=0.42, coat=0.2)
    M["navy2"] = P("navy2", hexlin("#2E3B5C"), rough=0.45)
    M["blue"] = P("blue", hexlin("#5B7CFA"), rough=0.38, coat=0.25)
    M["blue_l"] = P("blue_l", hexlin("#A9BBFD"), rough=0.4)
    M["teal"] = P("teal", hexlin("#39C6B6"), rough=0.3, coat=0.3)
    M["liquid"] = P("liquid", hexlin("#7FDCD1"), rough=0.12, coat=0.6)
    M["organic"] = P("organic", hexlin("#F6D38A"), rough=0.12, coat=0.6)
    M["amber"] = P("amber", hexlin("#F3B64A"), rough=0.4, coat=0.2)
    M["glow"] = P("glow", hexlin("#F3B64A"), rough=0.5, emit=(hexlin("#FFB347"), 6.0))
    M["screen"] = P("screen", hexlin("#5B7CFA"), rough=0.2, emit=(hexlin("#8EA6FF"), 1.2))
    M["bm"] = P("blackmass", hexlin("#30343D"), rough=0.85, bump=0.6, bump_scale=40)
    M["bag"] = P("bag", hexlin("#3A4150"), rough=0.8, bump=0.2, bump_scale=30)
    M["rubber"] = P("belt", hexlin("#2A3040"), rough=0.75)
    M["pipe"] = P("pipe", hexlin("#B9C3D4"), metal=0.5, rough=0.3)
    M["pipe_t"] = P("pipe_t", hexlin("#39C6B6"), rough=0.35, coat=0.3)
    # 결정 — 사이트 금속 색과 같은 값
    M["ni"] = P("ni", hexlin("#2BB594"), rough=0.25, coat=0.5)
    M["co"] = P("co", hexlin("#C23D69"), rough=0.25, coat=0.5)
    M["mn"] = P("mn", hexlin("#F2BFCB"), rough=0.3, coat=0.5)
    M["li"] = P("li", hexlin("#FAFAFA"), rough=0.35, coat=0.4)
    M["alu"] = P("alu", hexlin("#D9DDE3"), metal=0.3, rough=0.3)
    M["cu"] = P("cu", hexlin("#D9895B"), metal=0.3, rough=0.3)
    return M


# ─────────────────────────── 배치 ───────────────────────────
SLAB = 0.32
SPOKE = dict(u0=0.0, u1=9.6, v0=5.2, v1=10.8)
HUB = dict(u0=10.2, u1=19.0, v0=-3.0, v1=4.2)


def platform(M, p, grp):
    du, dv = p["u1"] - p["u0"], p["v1"] - p["v0"]
    uc, vc = (p["u0"] + p["u1"]) / 2, (p["v0"] + p["v1"]) / 2
    box(du + 0.16, dv + 0.16, 0.08, uc, vc, 0.0, M["trim"], grp, bevel=0.06)
    box(du, dv, SLAB - 0.06, uc, vc, 0.06, M["slab"], grp, bevel=0.1, seg=4)
    # 바닥 격자 줄눈 (아주 얕게)
    for i in range(1, int(du // 1.5) + 1):
        uu = p["u0"] + i * 1.5
        if uu < p["u1"] - 0.3:
            box(0.025, dv - 0.3, 0.004, uu, vc, SLAB, M["trim"], grp, bevel=0)
    for i in range(1, int(dv // 1.5) + 1):
        vv = p["v0"] + i * 1.5
        if vv < p["v1"] - 0.3:
            box(du - 0.3, 0.025, 0.004, uc, vv, SLAB, M["trim"], grp, bevel=0)


Z0 = SLAB  # 설비 바닥 높이


def s1_discharge(M, u, v):
    g = "s1"
    # 작업대
    box(2.5, 1.7, 0.18, u, v, Z0, M["body2"], g, bevel=0.04)
    for du in (-1.1, 1.1):
        for dv in (-0.7, 0.7):
            box(0.12, 0.12, 0.25, u + du, v + dv, Z0, M["steel"], g, bevel=0.02)
    box(2.5, 1.7, 0.08, u, v, Z0 + 0.25, M["body"], g, bevel=0.03)
    zt = Z0 + 0.33
    # 배터리 팩 (남색 케이스 + 호박색 고전압 단자)
    box(2.0, 1.3, 0.42, u, v, zt, M["navy"], g, bevel=0.07, seg=4)
    box(1.84, 1.14, 0.03, u, v, zt + 0.42, M["navy2"], g, bevel=0.02)
    for k in range(4):
        box(0.03, 1.0, 0.012, u - 0.66 + k * 0.44, v, zt + 0.45, M["navy"], g, bevel=0)
    for dv in (-0.3, 0.3):
        box(0.16, 0.16, 0.12, u + 0.82, v + dv, zt + 0.42, M["amber"], g, bevel=0.03)
    # 방전기 (뒤쪽)
    cu_, cv_ = u + 0.25, v - 1.45
    box(1.0, 0.7, 1.55, cu_, cv_, Z0, M["body"], g, bevel=0.06, seg=4)
    box(0.62, 0.02, 0.4, cu_ - 0.05, cv_ + 0.36, Z0 + 1.0, M["screen"], g, bevel=0.01)
    for k in range(3):
        box(0.1, 0.02, 0.1, cu_ - 0.28 + k * 0.2, cv_ + 0.36, Z0 + 0.7, M["blue"] if k == 0 else M["body2"], g, bevel=0.01)
    box(1.04, 0.74, 0.08, cu_, cv_, Z0 + 1.55, M["body2"], g, bevel=0.03)
    # 방전 케이블 (방전기 → 단자)
    for dv, m in ((-0.3, M["navy"]), (0.3, M["amber"])):
        pipe([(cu_ + 0.3, cv_ + 0.36, Z0 + 0.45), (cu_ + 0.55, cv_ + 0.9, Z0 + 0.2), (u + 0.9, v + dv - 0.25, zt + 0.9), (u + 0.82, v + dv, zt + 0.56)], 0.035, m, g)
    # 해체로 나온 스크랩 상자 (Al · Cu)
    for du, m in ((-1.0, "alu"), (-0.15, "cu")):
        open_box(0.7, 0.55, 0.36, u + du, v + 1.45, Z0, M["body2"], g, wall=0.05)
        for j in range(5):
            a = j * 1.9 + du
            box(0.22, 0.1, 0.05, u + du + 0.15 * math.cos(a), v + 1.45 + 0.1 * math.sin(a), Z0 + 0.22 + 0.03 * j, M[m], g, bevel=0.01, rotz=a)
    return (u, v, zt + 0.45)


def s2_kiln(M, u, v):
    g = "s2"
    # 회전식 열처리로 (v 축으로 누운 원통) + 받침 롤러 + 굴뚝
    zc = Z0 + 0.8
    for dv in (-0.65, 0.65):
        box(1.0, 0.3, 0.45, u, v + dv, Z0, M["body2"], g, bevel=0.04)
        cyl(0.6, 0.14, u, v + dv, zc, M["steel"], g, axis="v")
    cyl(0.52, 2.3, u, v, zc, M["body"], g, axis="v")
    for dv in (-0.9, 0.0, 0.9):
        cyl(0.555, 0.05, u, v + dv, zc, M["blue"], g, axis="v")
    # 뜨거운 투입구 (앞쪽 끝)
    cyl(0.38, 0.04, u, v + 1.17, zc, M["glow"], g, axis="v")
    cyl(0.48, 0.07, u, v + 1.14, zc, M["steel"], g, axis="v")
    # 굴뚝 + 배기 처리
    box(0.7, 0.7, 0.8, u - 0.15, v - 1.6, Z0, M["body"], g, bevel=0.05)
    cyl(0.17, 1.5, u - 0.15, v - 1.6, Z0 + 0.8, M["body2"], g)
    cyl(0.2, 0.1, u - 0.15, v - 1.6, Z0 + 2.3, M["amber"], g)
    pipe([(u, v - 1.15, zc + 0.15), (u - 0.08, v - 1.35, zc + 0.3), (u - 0.15, v - 1.6, Z0 + 1.0)], 0.08, M["pipe"], g)
    return (u, v, zc + 0.52)


def s3_shred(M, u, v):
    g = "s3"
    # 파쇄기 본체 + 사각 호퍼
    box(1.2, 1.2, 0.95, u, v, Z0, M["body"], g, bevel=0.06, seg=4)
    box(1.24, 1.24, 0.1, u, v, Z0 + 0.95, M["blue"], g, bevel=0.03)
    hop = S.obj_from(S.cyl_mesh(0.62, 0.7, 4, r2=1.05, smooth=False), L(u, v, Z0 + 1.05 + 0.35), M["body2"], "hop", (0, 0, math.pi / 4), g)
    cyl(0.25, 0.3, u + 0.72, v, Z0 + 0.35, M["steel"], g, axis="v")  # 모터
    # 컨베이어 (u 방향)
    cu0, cu1 = u + 0.7, u + 2.1
    for du in (0.9, 1.95):
        box(0.1, 0.1, 0.55, u + du, v + 0.35, Z0, M["steel"], g, bevel=0.02)
        box(0.1, 0.1, 0.55, u + du, v - 0.35, Z0, M["steel"], g, bevel=0.02)
    box(cu1 - cu0, 0.7, 0.1, (cu0 + cu1) / 2, v, Z0 + 0.55, M["rubber"], g, bevel=0.04)
    for k in range(5):
        c = S.obj_from(S.cyl_mesh(0.07, 0.07, 10, r2=0.0), L(cu0 + 0.2 + k * 0.25, v + ((k * 37) % 5 - 2) * 0.1, Z0 + 0.68), M["bm"], "grain", (0, 0, 0), g)
    # 자력 선별 드럼
    cyl(0.22, 0.8, u + 1.55, v, Z0 + 0.95, M["navy"], g, axis="v")
    box(0.1, 0.1, 0.5, u + 1.55, v + 0.45, Z0 + 0.55, M["steel"], g, bevel=0.02)
    box(0.1, 0.1, 0.5, u + 1.55, v - 0.45, Z0 + 0.55, M["steel"], g, bevel=0.02)
    # 블랙매스 더미 + 톤백
    pile = S.obj_from(S.cyl_mesh(0.6, 0.7, 40, r2=0.04), L(u + 2.6, v + 0.15, Z0 + 0.35), M["bm"], "pile", (0, 0, 0), g)
    for p in pile.data.polygons:
        p.use_smooth = True
    for k, (du, dv) in enumerate(((0.5, -1.25), (1.45, -1.25))):
        box(0.8, 0.8, 0.85, u + du, v + dv, Z0, M["bag"], g, bevel=0.16, seg=5)
        box(0.84, 0.84, 0.05, u + du, v + dv, Z0 + 0.82, M["navy2"], g, bevel=0.02)
    return (u, v, Z0 + 1.6)


def transfer(M):
    g = "tr"
    # 두 거점을 잇는 길 (바닥 높이) — L자
    a = (SPOKE["u1"] - 0.2, 8.3)
    corner = (12.1, 8.3)
    b = (12.1, HUB["v1"] - 0.2)
    box(corner[0] + 0.6 - a[0], 1.2, 0.05, (a[0] + corner[0] + 0.6) / 2, a[1], 0.004, M["road"], g, bevel=0.02)
    box(1.2, corner[1] - 0.6 - b[1], 0.05, corner[0], (corner[1] - 0.6 + b[1]) / 2, 0.004, M["road"], g, bevel=0.02)
    # 청록 흐름 점선
    uu = a[0] + 0.2
    while uu < corner[0] - 0.4:
        box(0.28, 0.07, 0.012, uu, a[1], 0.054, M["teal"], g, bevel=0)
        uu += 0.5
    vv = corner[1] - 0.5
    while vv > b[1] + 0.1:
        box(0.07, 0.28, 0.012, corner[0], vv, 0.054, M["teal"], g, bevel=0)
        vv -= 0.5
    # 트럭 (블랙매스 톤백 두 개)
    tu, tv = corner[0], 6.4
    z = 0.05
    before = set(bpy.context.scene.objects)
    for du in (-0.36, 0.36):
        for dv in (-0.7, 0.55):
            cyl(0.16, 0.12, tu + du, tv + dv, z + 0.16, M["rubber"], g, axis="u")
    box(0.86, 2.1, 0.12, tu, tv - 0.1, z + 0.18, M["navy"], g, bevel=0.03)
    box(0.86, 0.62, 0.62, tu, tv + 0.78, z + 0.3, M["blue"], g, bevel=0.1, seg=4)
    box(0.8, 0.02, 0.26, tu, tv + 1.09, z + 0.58, M["navy2"], g, bevel=0.02)  # 유리
    box(0.86, 1.36, 0.08, tu, tv - 0.12, z + 0.3, M["body2"], g, bevel=0.02)
    for dv in (-0.45, 0.2):
        box(0.62, 0.58, 0.55, tu, tv + dv - 0.12, z + 0.38, M["bag"], g, bevel=0.12, seg=4)
    for o in set(bpy.context.scene.objects) - before:  # 공정 재생 때 도로를 달림
        o["anim"] = "tr"
    # 후처리 거점 입고장 — 내려놓은 톤백
    box(1.5, 0.9, 0.1, 10.95, 3.55, Z0, M["body2"], g, bevel=0.03)
    for du in (-0.36, 0.36):
        box(0.62, 0.62, 0.62, 10.95 + du, 3.55, Z0 + 0.1, M["bag"], g, bevel=0.13, seg=4)
    return (tu, tv, z + 0.95)


def h1_leach(M, u, v):
    g = "h1"
    # 침출 반응조 두 기 (위가 열린 단면으로 청록 용액이 보이게)
    for k, du in enumerate((-0.55, 0.9)):
        cu_ = u + du
        cyl(0.6, 1.3, cu_, v, Z0, M["body"], g, seg=64)
        cyl(0.6, 0.02, cu_, v, Z0 + 1.3, M["liquid"], g, seg=64)
        ring(0.62, 0.3, cu_, v, Z0 + 1.25, M["body"], g, t=0.05)
        ring(0.66, 0.07, cu_, v, Z0 + 1.5, M["blue"], g, t=0.09)
        cyl(0.66, 0.08, cu_, v, Z0 + 0.35, M["body2"], g, seg=64)
        # 교반기
        cyl(0.03, 0.7, cu_, v, Z0 + 1.3, M["steel"], g, seg=12)
        box(0.3, 0.3, 0.3, cu_, v, Z0 + 1.95, M["navy"], g, bevel=0.04)
        box(1.5, 0.12, 0.08, cu_, v, Z0 + 1.6, M["steel"], g, bevel=0.02)["anim"] = "h1"  # 교반 날개 (공정 재생 때 돎)
    # 약품 탱크 (황산 · 과산화수소)
    for k, (du, m) in enumerate(((-1.2, M["amber"]), (-1.2, M["body2"]))):
        pass
    cyl(0.3, 1.0, u - 1.55, v - 1.0, Z0, M["body2"], g)
    cyl(0.31, 0.06, u - 1.55, v - 1.0, Z0 + 1.0, M["amber"], g)
    cyl(0.3, 0.8, u - 0.9, v - 1.15, Z0, M["body2"], g)
    cyl(0.31, 0.06, u - 0.9, v - 1.15, Z0 + 0.8, M["blue"], g)
    poly_pipe([(u - 1.55, v - 1.0, Z0 + 0.9), (u - 1.55, v - 0.45, Z0 + 1.7), (u - 0.55, v - 0.45, Z0 + 1.7), (u - 0.55, v - 0.2, Z0 + 1.55)], 0.04, M["pipe"], g)
    return (u + 0.2, v, Z0 + 2.2)


def h2_purify(M, u, v):
    g = "h2"
    # 필터 프레스 (판 여러 장) + 침전조
    box(2.6, 0.9, 0.35, u, v, Z0, M["body2"], g, bevel=0.04)
    box(0.25, 1.0, 1.25, u - 1.25, v, Z0, M["navy"], g, bevel=0.04)
    box(0.25, 1.0, 1.25, u + 1.25, v, Z0, M["navy"], g, bevel=0.04)
    for dv in (-0.36, 0.36):
        cyl(0.05, 2.5, u, v + dv, Z0 + 1.1, M["steel"], g, axis="u")
    for k in range(11):
        box(0.12, 0.86, 0.8, u - 1.0 + k * 0.2, v, Z0 + 0.38, M["blue"] if k % 2 == 0 else M["blue_l"], g, bevel=0.02)
    # 걸러진 불순물 (Fe · Al 침전물) 받이
    box(1.6, 0.6, 0.22, u, v + 0.95, Z0, M["body2"], g, bevel=0.04)
    box(1.44, 0.46, 0.05, u, v + 0.95, Z0 + 0.18, M["amber"], g, bevel=0.02)
    return (u, v, Z0 + 1.35)


def h3_sx(M, u, v):
    g = "h3"
    # 혼합-정치조 (mixer-settler) 세 단 — 물층(청록) 위에 유기층(연노랑)
    for k in range(3):
        cu_ = u - 1.2 + k * 1.2
        z = Z0 + k * 0.0
        box(1.05, 1.5, 0.45, cu_, v, z, M["body"], g, bevel=0.04)
        box(0.94, 1.39, 0.08, cu_, v, z + 0.45, M["liquid"], g, bevel=0.01)
        box(0.94, 1.0, 0.07, cu_, v + 0.195, z + 0.53, M["organic"], g, bevel=0.01)
        open_box(1.05, 1.5, 0.35, cu_, v, z + 0.4, M["body"], g, wall=0.055)
        box(0.94, 0.05, 0.3, cu_, v - 0.3, z + 0.45, M["body2"], g, bevel=0.0)  # 혼합실 칸막이
        cyl(0.04, 0.5, cu_, v - 0.55, z + 0.6, M["steel"], g, seg=12)
        box(0.24, 0.24, 0.22, cu_, v - 0.55, z + 1.15, M["navy"], g, bevel=0.04)
    # 단 사이 흐름 배관
    poly_pipe([(u - 1.2, v + 0.72, Z0 + 0.55), (u - 1.2, v + 0.95, Z0 + 0.55), (u + 1.2, v + 0.95, Z0 + 0.55), (u + 1.2, v + 0.72, Z0 + 0.55)], 0.045, M["pipe_t"], g)
    return (u + 1.2, v + 0.2, Z0 + 0.55)


def h4_cryst(M, u, v):
    g = "h4"
    # 증발 결정화기 (원뿔 바닥 탑) + 제품 결정 4종
    for du in (-0.45, 0.45):
        for dv in (-0.45, 0.45):
            box(0.1, 0.1, 1.3, u + du, v + dv - 0.8, Z0, M["steel"], g, bevel=0.02)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=64, radius1=0.14, radius2=0.62, depth=0.5)
    me = bpy.data.meshes.new("cone")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = abs(p.normal.z) < 0.9
    S.obj_from(me, L(u, v - 0.8, Z0 + 0.95), M["body"], "cone", (0, 0, 0), g)
    cyl(0.1, 0.25, u, v - 0.8, Z0 + 0.45, M["steel"], g, seg=24)
    ring(0.66, 0.08, u, v - 0.8, Z0 + 1.2, M["body2"], g, t=0.05)
    cyl(0.62, 1.5, u, v - 0.8, Z0 + 1.2, M["body"], g, seg=64)
    cyl(0.64, 0.08, u, v - 0.8, Z0 + 1.6, M["blue"], g, seg=64)
    dome = S.obj_from(S.cyl_mesh(0.62, 0.3, 64, r2=0.2), L(u, v - 0.8, Z0 + 2.7 + 0.15), M["body2"], "dome", (0, 0, 0), g)
    cyl(0.08, 0.5, u, v - 0.8, Z0 + 3.0, M["steel"], g, seg=16)
    # 제품 팔레트
    PU, PV = u - 1.1, v + 1.5
    box(3.0, 1.2, 0.12, PU, PV, Z0, M["body2"], g, bevel=0.03)
    for k, m in enumerate(("ni", "co", "mn", "li")):
        cu_ = PU - 1.08 + k * 0.72
        box(0.62, 0.9, 0.08, cu_, PV, Z0 + 0.12, M["body"], g, bevel=0.02)
        pile = S.obj_from(S.cyl_mesh(0.27, 0.42, 7, r2=0.03, smooth=False), L(cu_, PV, Z0 + 0.2 + 0.21), M[m], "xtal", (0, 0, k * 0.5), g)
        for j in range(4):
            a = k * 1.3 + j * 1.6
            c = S.obj_from(S.box_mesh(0.1, 0.1, 0.1, bevel=0.01), L(cu_ + 0.22 * math.cos(a), PV + 0.3 * math.sin(a), Z0 + 0.25), M[m], "x", (0.3 * j, 0.5, a), g)
    return (u, v - 0.8, Z0 + 3.2)


def hub_pipes(M):
    g = "hp"
    z = Z0 + 0.12
    poly_pipe([(11.1, 2.5, z), (10.6, 2.5, z), (10.6, -1.0, z), (10.7, -1.0, z)], 0.06, M["pipe_t"], g)
    poly_pipe([(13.2, -1.9, z), (14.0, -1.9, z)], 0.06, M["pipe_t"], g)
    poly_pipe([(16.7, -0.8, z), (16.7, -0.1, z)], 0.06, M["pipe_t"], g)


def build():
    M = mats()
    platform(M, SPOKE, "plat")
    platform(M, HUB, "plat")
    anchors = {}
    anchors["s1"] = s1_discharge(M, 1.8, 8.2)
    anchors["s2"] = s2_kiln(M, 4.5, 8.0)
    anchors["s3"] = s3_shred(M, 6.3, 8.2)
    anchors["tr"] = transfer(M)
    anchors["h1"] = h1_leach(M, 12.2, 2.5)
    anchors["h2"] = h2_purify(M, 11.9, -1.5)
    anchors["h3"] = h3_sx(M, 15.7, -1.5)
    anchors["h4"] = h4_cryst(M, 17.0, 1.2)
    hub_pipes(M)
    # 거점 이름표 자리 (판 앞 모서리)
    anchors["zs"] = (SPOKE["u0"] + 3.0, SPOKE["v1"] + 0.2, 0.0)
    anchors["zh"] = (HUB["u0"] + 5.2, HUB["v1"] + 0.2, 0.0)
    return anchors


# ─────────────────────────── 조명 · 카메라 ───────────────────────────
def lights():
    sc = bpy.context.scene
    w = bpy.data.worlds.new("sky")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*hexlin("#EEF3FF"), 1)
    bg.inputs["Strength"].default_value = 0.55
    # 해: 위에서, 화면 왼쪽(= Blender +x) 쪽으로 기울여 — 윗면 밝음 · 왼면 중간 · 오른면 어두움
    ld = bpy.data.lights.new("sun", "SUN")
    ld.energy = 2.4
    ld.angle = math.radians(8)
    ld.color = (1.0, 0.985, 0.96)
    o = bpy.data.objects.new("sun", ld)
    S.link(o)
    d = Vector((0.55, 0.12, 1.0)).normalized()
    o.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    # 그림자 받이
    me = S.box_mesh(80, 80, 0.01, bevel=0)
    fl = bpy.data.objects.new("floor", me)
    fl.location = (0, 0, -0.006)
    fl.is_shadow_catcher = True
    S.link(fl)


def iso_camera(center, scale):
    cd = bpy.data.cameras.new("iso")
    cd.type = "ORTHO"
    cd.ortho_scale = scale
    cd.clip_end = 400
    o = bpy.data.objects.new("iso", cd)
    S.link(o)
    c = Vector(center)
    o.location = c + Vector((1, 1, 1)).normalized() * 60
    o.rotation_euler = (math.radians(54.7356), 0, math.radians(135))
    bpy.context.scene.camera = o
    return o
