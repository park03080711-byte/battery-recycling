"""21700 원통형 셀 — 부분 절개(젤리롤 노출). 1 단위 = 1 cm.
python cyl.py rot=rx,ry,rz cut=az w=900 h=1100 s=24 out=path
"""
import sys, math, os
sys.path.insert(0, "../anatomy")
import bpy, bmesh
from mathutils import Vector
import scene as S

A = dict(a.split("=", 1) for a in sys.argv[1:] if "=" in a)
ROT = [math.radians(float(v)) for v in A.get("rot", "0,0,0").split(",")]
CUT_AZ = math.radians(float(A.get("cut", "-90")))  # 절개 중심 방향 (카메라 쪽 = -90)
CUT_W = math.radians(float(A.get("cutw", "90")))
W, H, SMP = int(A.get("w", 900)), int(A.get("h", 1100)), int(A.get("s", 24))
OUT = A.get("out", "cell.png")
LENS = float(A.get("lens", 85))
CAMEL = float(A.get("camel", 8))

R, HT = 1.05, 7.0
Z0, Z1 = -HT / 2, HT / 2
ZCUT = float(A.get("zcut", "-0.9"))  # 이 높이 위로 절개

S.reset()
M = S.mats()
root = bpy.data.objects.new("root", None)
S.link(root)


def in_cut(th):
    d = (th - CUT_AZ + math.pi) % (2 * math.pi) - math.pi
    return abs(d) < CUT_W / 2


def band_mesh(name, rfun, t, z0, z1, th0, th1, n):
    """두께 t 인 띠(반지름 rfun(θ))를 θ0→θ1 로 쓸어 닫힌 솔리드로."""
    bm = bmesh.new()
    rings = []
    for i in range(n + 1):
        th = th0 + (th1 - th0) * i / n
        r = rfun(th)
        c, s_ = math.cos(th), math.sin(th)
        v = [bm.verts.new((r * c, r * s_, z0)), bm.verts.new(((r + t) * c, (r + t) * s_, z0)),
             bm.verts.new(((r + t) * c, (r + t) * s_, z1)), bm.verts.new((r * c, r * s_, z1))]
        rings.append(v)
    for a, b in zip(rings, rings[1:]):
        for k in range(4):
            bm.faces.new((a[k], b[k], b[(k + 1) % 4], a[(k + 1) % 4]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


def segments(z0, z1, full):
    """절개 여부에 따라 (θ0, θ1) 구간 목록"""
    if full or z1 <= ZCUT:
        return [(0.0, 2 * math.pi)]
    a0 = CUT_AZ + CUT_W / 2
    return [(a0, a0 + 2 * math.pi - CUT_W)]


def solid(name, rfun, t, z0, z1, mat, turns=1.0, full=False, dens=128):
    """z0..z1 구간. ZCUT 위쪽은 절개. turns>1 이면 나선(젤리롤)."""
    parts = []
    spans = [(z0, min(z1, ZCUT)), (max(z0, ZCUT), z1)] if z0 < ZCUT < z1 else [(z0, z1)]
    for (a, b) in spans:
        if b - a <= 1e-4:
            continue
        cut = not full and a >= ZCUT - 1e-6
        if turns > 1:
            # 나선: 전체 각도 범위에서 절개 부분을 잘라 여러 조각으로
            total = 2 * math.pi * turns
            n = int(dens * turns)
            pieces, cur = [], []
            for i in range(n + 1):
                th = total * i / n
                if cut and in_cut(th):
                    if len(cur) > 1:
                        pieces.append((cur[0], cur[-1]))
                    cur = []
                else:
                    cur.append(th)
            if len(cur) > 1:
                pieces.append((cur[0], cur[-1]))
            for (t0, t1) in pieces:
                k = max(2, int((t1 - t0) / (2 * math.pi) * dens))
                me = band_mesh(name, rfun, t, a, b, t0, t1, k)
                parts.append(S.obj_from(me, (0, 0, 0), mat, name, grp="cyl"))
        else:
            for (t0, t1) in (segments(a, b, False) if cut else [(0, 2 * math.pi)]):
                me = band_mesh(name, rfun, t, a, b, t0, t1, dens)
                parts.append(S.obj_from(me, (0, 0, 0), mat, name, grp="cyl"))
    for o in parts:
        o.parent = root
    return parts


def disk(name, r0, r1, z0, z1, mat, full=False):
    return solid(name, lambda th: r0, r1 - r0, z0, z1, mat, full=full)


# ── 재질 ──
steel = S.P("steel_can", (0.80, 0.81, 0.83), metal=1.0, rough=0.2)
steel_cut = S.P("steel_cut", (0.9, 0.9, 0.92), metal=1.0, rough=0.12)
wrap = S.P("wrap", (0.72, 0.9, 0.88), rough=0.14, trans=0.35, coat=1.0)
_n = wrap.node_tree
_b = _n.nodes["Principled BSDF"]
_b.inputs["IOR"].default_value = 1.45
_tc = _n.nodes.new("ShaderNodeTexCoord"); _sp = _n.nodes.new("ShaderNodeSeparateXYZ")
_mr = _n.nodes.new("ShaderNodeMapRange"); _mr.inputs["From Min"].default_value = Z0; _mr.inputs["From Max"].default_value = Z1
_rp = _n.nodes.new("ShaderNodeValToRGB")
_rp.color_ramp.elements[0].color = (0.34, 0.80, 0.71, 1); _rp.color_ramp.elements[0].position = 0.0
_rp.color_ramp.elements[1].color = (0.93, 0.97, 0.98, 1); _rp.color_ramp.elements[1].position = 1.0
_n.links.new(_tc.outputs["Object"], _sp.inputs[0]); _n.links.new(_sp.outputs["Z"], _mr.inputs["Value"])
_n.links.new(_mr.outputs["Result"], _rp.inputs["Fac"]); _n.links.new(_rp.outputs["Color"], _b.inputs["Base Color"])
ncm = S.P("ncm", (0.07, 0.075, 0.085), rough=0.62, bump=0.3, bump_scale=2400)
graph = S.P("graphite", (0.035, 0.036, 0.04), metal=0.3, rough=0.45, bump=0.25, bump_scale=2000)
alf = S.P("alfoil", (0.92, 0.92, 0.93), metal=1.0, rough=0.15)
cuf = S.P("cufoil", (0.97, 0.58, 0.38), metal=1.0, rough=0.18)
sep = S.P("sep", (0.95, 0.95, 0.93), rough=0.5, sss=0.15)
blk = S.P("insul", (0.03, 0.03, 0.035), rough=0.4)
ni = M["ni"]

# ── 젤리롤: 양극(코팅/Al/코팅) · 분리막 · 음극(코팅/Cu/코팅) · 분리막 ──
R0, RJ = 0.18, 0.93
layers = [(ncm, 0.030), (alf, 0.010), (ncm, 0.030), (sep, 0.012), (graph, 0.032), (cuf, 0.008), (graph, 0.032), (sep, 0.012)]
pitch = sum(t for _, t in layers) + 0.004 * len(layers)
turns = (RJ - R0) / pitch
zj0, zj1 = Z0 + 0.35, Z1 - 0.55
off = 0.0
for i, (m, t) in enumerate(layers):
    o = off
    solid(f"L{i}", lambda th, o=o: R0 + o + pitch * th / (2 * math.pi), t, zj0 + (0.06 if m is sep else 0.1), zj1 - (0.06 if m is sep else 0.1), m, turns=turns, dens=96)
    off += t + 0.004
# 가운데 심 (맨드릴)
solid("pin", lambda th: 0.07, 0.035, zj0, zj1, steel, dens=48)

# ── 캔 · 수축 튜브 ──
T = 0.025
solid("can", lambda th: R - T, T, Z0 + 0.03, Z1 - 0.62, steel)
solid("can_groove", lambda th: R - T - 0.06, T, Z1 - 0.62, Z1 - 0.48, steel)  # 크림핑 홈
solid("can_top", lambda th: R - T, T, Z1 - 0.48, Z1 - 0.1, steel)
disk("can_bottom", 0.0, R, Z0, Z0 + 0.04, steel, full=True)
solid("wrap", lambda th: R, 0.012, Z0 - 0.01, Z1 - 0.66, wrap)
solid("wrap_top", lambda th: R, 0.012, Z1 - 0.44, Z1 - 0.08, wrap)
# 상단 캡 조립체
disk("gasket", 0.0, R - 0.03, Z1 - 0.2, Z1 - 0.1, blk)
disk("cap", 0.0, R - 0.1, Z1 - 0.1, Z1 - 0.04, steel)
disk("vent_ring", 0.42, 0.46, Z1 - 0.04, Z1 - 0.035, blk)
disk("terminal", 0.0, 0.36, Z1 - 0.04, Z1 + 0.05, ni)
disk("insul_bot", 0.0, RJ + 0.05, zj0 - 0.08, zj0 - 0.05, blk)
disk("insul_top", 0.0, RJ + 0.05, zj1 + 0.05, zj1 + 0.08, blk)
# 양극 탭 (젤리롤 → 캡)
tab = S.box((0.18, 0.012, 0.36), (0.3, 0.2, zj1 + 0.2), alf, "cyl", bevel=0.003, seg=1)
tab.parent = root

root.rotation_euler = ROT

# ── 조명 ──
sc = bpy.context.scene
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = nt.nodes["Background"]
tc = nt.nodes.new("ShaderNodeTexCoord"); sep_ = nt.nodes.new("ShaderNodeSeparateXYZ")
mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = -1
rp = nt.nodes.new("ShaderNodeValToRGB")
rp.color_ramp.elements[0].color = (0.42, 0.47, 0.55, 1); rp.color_ramp.elements[0].position = 0.3
rp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1); rp.color_ramp.elements[1].position = 0.8
nt.links.new(tc.outputs["Normal"], sep_.inputs[0]); nt.links.new(sep_.outputs["Z"], mr.inputs["Value"])
nt.links.new(mr.outputs["Result"], rp.inputs["Fac"]); nt.links.new(rp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 0.9


def area(name, loc, size, e, col=(1, 1, 1), sy=None):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = e; ld.color = col; ld.shape = "RECTANGLE"
    ld.size = size; ld.size_y = sy or size
    o = bpy.data.objects.new(name, ld); o.location = loc; S.link(o)
    o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()


area("key", (-14, -16, 14), 14, 2600, (1, 0.98, 0.95), 8)
area("rim_teal", (16, 10, 6), 6, 1500, (0.55, 0.95, 0.85), 18)
area("rim_pink", (-14, 12, 2), 6, 900, (1.0, 0.7, 0.8), 14)
area("fill", (12, -18, -4), 10, 500, (0.9, 0.95, 1.0))
area("top", (0, 0, 22), 10, 700)

cam = S.camera("cam", (0, -34, CAMEL), (0, 0, 0), LENS)
sc.camera = cam
S.render_setup(W, H, SMP)
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
