"""배터리의 일생 — 첫 화면 반복 영상 (15초).
셀 → 모듈 · 팩 → 전기차 → 진단 → ESS 재사용 → 해체 · 파쇄 → 소재 회수 → 다시 새 셀.
1 단위 = 1 cm (탁상 모형 축척). 모든 형상은 코드로 직접 만든다 — 외부 모델 · AI 이미지 없음.

python life.py t=0,3,6 w=540 s=24 out=out/still     # 정지컷 (초)
python life.py frames=0-359 w=540 s=24 out=out/f    # 연속 프레임 (24fps)
"""
import sys, math, os, random, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "../anatomy"))
import bpy, bmesh
from mathutils import Vector
import scene as S

A = dict(a.split("=", 1) for a in sys.argv[1:] if "=" in a)
W = int(A.get("w", 540)); H = int(A.get("h", W)); SMP = int(A.get("s", 24))
OUT = A.get("out", "out/f")
FPS = 24
DUR = 15.0
PI = math.pi

S.reset()
sc = bpy.context.scene

# ─────────────────────────── 도우미 ───────────────────────────
def E(name, parent=None, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    S.link(o)
    if parent: o.parent = parent
    return o

def B(par, dims, loc, mat, bevel=0.08, rot=(0, 0, 0), seg=2):
    o = S.obj_from(S.box_mesh(*dims, bevel=bevel, seg=seg), loc, mat, "b", rot)
    o.parent = par
    return o

def C(par, r, h, loc, mat, rot=(0, 0, 0), seg=32, r2=None):
    o = S.obj_from(S.cyl_mesh(r, h, seg, r2), loc, mat, "c", rot)
    o.parent = par
    return o

_lathe = {}
def lathe_mesh(key, prof, mats, seg=48, sharp=35):
    """prof: [(r, z, 재질번호)] — z축 회전체. 각 구간은 시작점의 재질."""
    if key in _lathe: return _lathe[key]
    bm = bmesh.new()
    rings = []
    for (r, z, _) in prof:
        if r < 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * PI * i / seg), r * math.sin(2 * PI * i / seg), z)) for i in range(seg)])
    for k in range(len(prof) - 1):
        a, b = rings[k], rings[k + 1]
        mi = prof[k][2]
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1 and len(b) == 1: continue
            if len(a) == 1: f = bm.faces.new((a[0], b[i], b[j]))
            elif len(b) == 1: f = bm.faces.new((a[i], a[j], b[0]))
            else: f = bm.faces.new((a[i], a[j], b[j], b[i]))
            f.material_index = mi
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(key)
    bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    for p in me.polygons: p.use_smooth = True
    me.set_sharp_from_angle(angle=math.radians(sharp))
    _lathe[key] = me
    return me

def O(par, me, loc=(0, 0, 0), rot=(0, 0, 0), mat=None):
    o = bpy.data.objects.new(me.name, me)
    o.location = loc; o.rotation_euler = rot
    S.link(o)
    if mat is not None:
        if not me.materials: me.materials.append(None)
        o.material_slots[0].link = "OBJECT"; o.material_slots[0].material = mat
    o.parent = par
    return o

def tree(o):
    out = [o]
    for c in o.children: out += tree(c)
    return out

_vis = {}
def show(root, v):
    k = root.name
    if _vis.get(k) == v: return
    _vis[k] = v
    for o in tree(root): o.hide_render = not v

def cl(x): return 0.0 if x < 0 else 1.0 if x > 1 else x
def sg(t, a, b): return cl((t - a) / (b - a))
def sm(x): x = cl(x); return x * x * (3 - 2 * x)
def eo(x): x = cl(x); return 1 - (1 - x) ** 3
def ei(x): x = cl(x); return x ** 3
def back(x):
    x = cl(x); c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def mix(a, b, k): return a + (b - a) * k
def mix3(a, b, k): return tuple(a[i] + (b[i] - a[i]) * k for i in range(3))

# ─────────────────────────── 재질 ───────────────────────────
P = S.P
steel = P("steel", (0.80, 0.81, 0.83), metal=1.0, rough=0.22)
steel_d = P("steel_dark", (0.30, 0.31, 0.33), metal=1.0, rough=0.34)
alu = P("alu", (0.82, 0.83, 0.85), metal=1.0, rough=0.3)
alu_cast = P("alu_cast", (0.50, 0.51, 0.53), metal=1.0, rough=0.42, bump=0.1, bump_scale=3)
blk = P("plastic_black", (0.02, 0.021, 0.024), rough=0.45)
blk_s = P("plastic_satin", (0.035, 0.037, 0.042), rough=0.3, coat=0.3)
rubber = P("rubber", (0.022, 0.022, 0.025), rough=0.78)
ni = P("nickel", (0.74, 0.71, 0.66), metal=1.0, rough=0.28)
cu = P("copper", (0.96, 0.56, 0.36), metal=1.0, rough=0.22)
orange = P("hv_orange", (0.95, 0.20, 0.0), rough=0.36, coat=0.2)
navy = P("lid_navy", (0.028, 0.045, 0.095), metal=0.2, rough=0.34, coat=0.5)
white = P("paint_white", (0.86, 0.87, 0.89), rough=0.35, coat=0.3)
grey = P("paint_grey", (0.55, 0.58, 0.62), rough=0.4, coat=0.2)
dash = P("dash", (0.30, 0.36, 0.48), rough=0.6)
teal = P("paint_teal", (0.03, 0.46, 0.31), rough=0.35, coat=0.4)
blue = P("coolant_blue", (0.05, 0.24, 0.62), rough=0.4, coat=0.2)
led_t = P("led_teal", (0.02, 0.2, 0.15), rough=0.3, emit=((0.10, 0.95, 0.68), 7.0))
led_a = P("led_amber", (0.2, 0.08, 0.0), rough=0.3, emit=((1.0, 0.42, 0.04), 8.0))
led_o = P("led_off", (0.05, 0.055, 0.06), rough=0.25, coat=0.5)
bmass = P("black_mass", (0.012, 0.012, 0.014), rough=0.92, bump=0.9, bump_scale=9)
porc = P("porcelain", (0.90, 0.90, 0.88), rough=0.22, coat=0.5)
pw_li = P("li2co3", (0.93, 0.93, 0.92), rough=0.9, bump=0.7, bump_scale=10)
pw_ni = P("niso4", (0.012, 0.36, 0.23), rough=0.6, bump=0.8, bump_scale=10, coat=0.15)
pw_co = P("coso4", (0.40, 0.012, 0.07), rough=0.6, bump=0.8, bump_scale=10, coat=0.15)
pw_mn = P("mnso4", (0.90, 0.47, 0.56), rough=0.75, bump=0.8, bump_scale=10)

# 셀 수축 튜브: 아래 청록 → 위 흰색
wrap = P("wrap", (0.72, 0.9, 0.88), rough=0.16, coat=1.0)
_n = wrap.node_tree; _b = _n.nodes["Principled BSDF"]
_tc = _n.nodes.new("ShaderNodeTexCoord"); _sp = _n.nodes.new("ShaderNodeSeparateXYZ")
_mr = _n.nodes.new("ShaderNodeMapRange"); _mr.inputs["From Min"].default_value = -3.5; _mr.inputs["From Max"].default_value = 3.5
_rp = _n.nodes.new("ShaderNodeValToRGB")
_rp.color_ramp.elements[0].color = (0.10, 0.62, 0.50, 1); _rp.color_ramp.elements[0].position = 0.0
_rp.color_ramp.elements[1].color = (0.92, 0.97, 0.98, 1); _rp.color_ramp.elements[1].position = 0.9
_n.links.new(_tc.outputs["Object"], _sp.inputs[0]); _n.links.new(_sp.outputs["Z"], _mr.inputs["Value"])
_n.links.new(_mr.outputs["Result"], _rp.inputs["Fac"]); _n.links.new(_rp.outputs["Color"], _b.inputs["Base Color"])

# ─────────────────────────── 셀 ───────────────────────────
RC, HC = 1.05, 7.0
CELL_ME = lathe_mesh("cell", [
    (0, -3.5, 0), (0.96, -3.5, 0), (1.03, -3.46, 1), (1.062, -3.38, 1), (1.062, 2.82, 0),
    (0.985, 2.88, 0), (0.985, 2.98, 0), (1.062, 3.04, 1), (1.062, 3.36, 1), (1.02, 3.43, 2),
    (0.90, 3.43, 0), (0.86, 3.47, 0), (0.48, 3.47, 2), (0.44, 3.47, 3), (0.36, 3.47, 3), (0.36, 3.55, 3), (0, 3.55, 3)],
    [steel, wrap, blk, ni], seg=40)

def cut_cell(root, cut_az=math.radians(-120), cut_w=math.radians(90), zcut=-0.4):
    """부분 절개 21700 (젤리롤 노출) — tools/hero/cyl.py와 같은 구조"""
    Z0, Z1 = -HC / 2, HC / 2

    def in_cut(th):
        d = (th - cut_az + PI) % (2 * PI) - PI
        return abs(d) < cut_w / 2

    def band(name, rfun, t, z0, z1, th0, th1, n):
        bm = bmesh.new(); rings = []
        for i in range(n + 1):
            th = th0 + (th1 - th0) * i / n; r = rfun(th); c, s_ = math.cos(th), math.sin(th)
            rings.append([bm.verts.new((r * c, r * s_, z0)), bm.verts.new(((r + t) * c, (r + t) * s_, z0)),
                          bm.verts.new(((r + t) * c, (r + t) * s_, z1)), bm.verts.new((r * c, r * s_, z1))])
        for a, b in zip(rings, rings[1:]):
            for k in range(4): bm.faces.new((a[k], b[k], b[(k + 1) % 4], a[(k + 1) % 4]))
        bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        for p in me.polygons: p.use_smooth = True
        me.set_sharp_from_angle(angle=math.radians(50))
        return me

    def solid(name, rfun, t, z0, z1, mat, turns=1.0, full=False, dens=96):
        spans = [(z0, min(z1, zcut)), (max(z0, zcut), z1)] if z0 < zcut < z1 else [(z0, z1)]
        for (a, b) in spans:
            if b - a <= 1e-4: continue
            cut = not full and a >= zcut - 1e-6
            if turns > 1:
                total = 2 * PI * turns; n = int(dens * turns); pieces, cur = [], []
                for i in range(n + 1):
                    th = total * i / n
                    if cut and in_cut(th):
                        if len(cur) > 1: pieces.append((cur[0], cur[-1]))
                        cur = []
                    else: cur.append(th)
                if len(cur) > 1: pieces.append((cur[0], cur[-1]))
                for (t0, t1) in pieces:
                    O(root, band(name, rfun, t, a, b, t0, t1, max(2, int((t1 - t0) / (2 * PI) * dens))), mat=mat)
            else:
                a0 = cut_az + cut_w / 2
                t0, t1 = (a0, a0 + 2 * PI - cut_w) if cut else (0, 2 * PI)
                O(root, band(name, rfun, t, a, b, t0, t1, dens), mat=mat)

    def disk(name, r0, r1, z0, z1, mat, full=False): solid(name, lambda th: r0, r1 - r0, z0, z1, mat, full=full)

    ncm = P("ncm", (0.07, 0.075, 0.085), rough=0.62, bump=0.3, bump_scale=24)
    graph = P("graphite", (0.035, 0.036, 0.04), metal=0.3, rough=0.45, bump=0.25, bump_scale=20)
    alf = P("alfoil", (0.92, 0.92, 0.93), metal=1.0, rough=0.15)
    sep = P("sep", (0.95, 0.95, 0.93), rough=0.5)
    R0, RJ = 0.18, 0.93
    layers = [(ncm, 0.030), (alf, 0.010), (ncm, 0.030), (sep, 0.012), (graph, 0.032), (cu, 0.008), (graph, 0.032), (sep, 0.012)]
    pitch = sum(t for _, t in layers) + 0.004 * len(layers)
    turns = (RJ - R0) / pitch
    zj0, zj1 = Z0 + 0.35, Z1 - 0.55
    off = 0.0
    for i, (m, t) in enumerate(layers):
        o = off; d = 0.06 if m is sep else 0.1
        solid(f"L{i}", lambda th, o=o: R0 + o + pitch * th / (2 * PI), t, zj0 + d, zj1 - d, m, turns=turns, dens=72)
        off += t + 0.004
    solid("pin", lambda th: 0.07, 0.035, zj0, zj1, steel, dens=32)
    T = 0.025
    solid("can", lambda th: RC - T, T, Z0 + 0.03, Z1 - 0.62, steel)
    solid("groove", lambda th: RC - T - 0.06, T, Z1 - 0.62, Z1 - 0.52, steel)
    solid("can_top", lambda th: RC - T, T, Z1 - 0.52, Z1 - 0.1, steel)
    disk("bottom", 0.0, RC, Z0, Z0 + 0.04, steel, full=True)
    solid("wrap", lambda th: RC, 0.012, Z0 + 0.04, Z1 - 0.68, wrap)
    solid("wrap_top", lambda th: RC, 0.012, Z1 - 0.46, Z1 - 0.14, wrap)
    disk("gasket", 0.0, RC - 0.03, Z1 - 0.2, Z1 - 0.07, blk)
    disk("cap", 0.0, RC - 0.16, Z1 - 0.07, Z1 - 0.03, steel)
    disk("terminal", 0.0, 0.36, Z1 - 0.03, Z1 + 0.05, ni)
    disk("insul_bot", 0.0, RJ + 0.05, zj0 - 0.08, zj0 - 0.05, blk)
    disk("insul_top", 0.0, RJ + 0.05, zj1 + 0.05, zj1 + 0.08, blk)
    B(root, (0.18, 0.012, 0.36), (0.3, 0.2, zj1 + 0.2), alf, bevel=0.003, seg=1)

# ─────────────────────────── 모듈 (6×4 셀) ───────────────────────────
NX, NY, PITCH = 6, 4, 2.3
ML, MW, MH = 15.4, 9.8, 7.6
SLOTS = [(-8.2, -5.4), (8.2, -5.4), (-8.2, 5.4), (8.2, 5.4)]
HERO = (2, 1)  # 첫 화면의 그 셀
def cell_xy(i, j): return ((i - (NX - 1) / 2) * PITCH, (j - (NY - 1) / 2) * PITCH)
PC = (SLOTS[0][0] + cell_xy(*HERO)[0], SLOTS[0][1] + cell_xy(*HERO)[1])

class Mod: pass
MODS = []
for k, (sx, sy) in enumerate(SLOTS):
    m = Mod(); m.root = E(f"mod{k}"); m.fr = E(f"mod{k}_frame", m.root); m.cells = {}; m.parts = []
    for i in range(NX):
        for j in range(NY):
            x, y = cell_xy(i, j)
            m.cells[(i, j)] = O(m.root, CELL_ME, (x, y, 3.5))
    fr = m.fr
    m.parts.append(B(fr, (14.2, 9.6, 1.0), (0, 0, 0.5), blk, bevel=0.12))            # 아래 홀더
    m.parts.append(B(fr, (14.2, 9.6, 0.8), (0, 0, 6.1), blk, bevel=0.12))            # 위 홀더
    for sgn in (-1, 1):
        ep = B(fr, (0.55, 9.8, 7.4), (sgn * 7.42, 0, 3.7), alu, bevel=0.1)           # 엔드 플레이트
        m.parts.append(ep)
        for by in (-3.6, 3.6):
            for bz in (1.2, 6.2):
                C(ep, 0.32, 0.2, (sgn * 0.33, by, bz - 3.7), steel_d, rot=(0, PI / 2, 0), seg=6)
        m.parts.append(B(fr, (14.2, 0.2, 1.4), (0, sgn * 4.86, 3.4), steel, bevel=0.04))   # 조임 밴드
    bus = E(f"mod{k}_bus", fr); m.bus = bus
    for i in range(NX):
        x, _ = cell_xy(i, 0)
        B(bus, (1.5, 8.6, 0.07), (x, 0, 7.09), ni, bevel=0.02)
    for sgn in (-1, 1):
        B(bus, (0.7, 8.8, 0.3), (sgn * 6.75, 0, 7.2), cu, bevel=0.05)
        C(bus, 0.42, 0.5, (sgn * 6.75, -3.4 * sgn, 7.45), steel, seg=6)
    m.led = B(fr, (3.2, 0.42, 0.34), (-4.6, -4.5, 6.56), led_t, bevel=0.06)
    B(fr, (4.2, 0.3, 1.6), (4.2, -4.92, 5.0), blk_s, bevel=0.06)                      # 셀 감시 보드 덮개
    MODS.append(m)

# ─────────────────────────── 팩 (트레이 + 덮개) ───────────────────────────
TR = E("tray"); LD = E("lid")
PL, PW = 35.6, 24.4
B(TR, (PL, PW, 0.6), (0, 0, 0.3), alu_cast, bevel=0.1)
for sgn in (-1, 1):
    B(TR, (PL, 0.9, 6.4), (0, sgn * (PW / 2 - 0.45), 3.2), alu_cast, bevel=0.12)
    B(TR, (0.9, PW, 6.4), (sgn * (PL / 2 - 0.45), 0, 3.2), alu_cast, bevel=0.12)
    for x in (-13, -6.5, 0, 6.5, 13):
        B(TR, (1.6, 0.5, 5.2), (x, sgn * (PW / 2 + 0.2), 3.0), alu_cast, bevel=0.1)   # 보강 리브
    for x in (-12, 12):
        B(TR, (4.0, 1.6, 1.0), (x, sgn * (PW / 2 + 0.8), 1.4), alu, bevel=0.12)       # 장착 브래킷
B(TR, (PL + 1.2, PW + 1.2, 0.5), (0, 0, 6.35), alu, bevel=0.1)                        # 플랜지
B(TR, (PL - 1.8, 0.6, 5.6), (0, 0, 3.2), alu_cast, bevel=0.06)                        # 가운데 보
C(TR, 1.5, 1.6, (-PL / 2 - 0.7, -5.0, 3.6), orange, rot=(0, PI / 2, 0))               # 고전압 커넥터
C(TR, 1.05, 0.5, (-PL / 2 - 1.6, -5.0, 3.6), blk, rot=(0, PI / 2, 0))
C(TR, 0.7, 1.4, (-PL / 2 - 0.6, 4.0, 2.4), blue, rot=(0, PI / 2, 0))                  # 냉각 포트
C(TR, 0.7, 1.4, (-PL / 2 - 0.6, 6.6, 2.4), blue, rot=(0, PI / 2, 0))
B(LD, (PL, PW, 2.3), (0, 0, 7.75), navy, bevel=0.5, seg=4)
B(LD, (PL + 1.2, PW + 1.2, 0.3), (0, 0, 6.75), navy, bevel=0.12)
for y in (-7.6, -2.6, 2.6, 7.6):
    B(LD, (27, 2.6, 0.5), (1.5, y, 8.95), navy, bevel=0.22, seg=3)                    # 프레스 리브
for i in range(14):
    a = i / 14 * 2 * PI
    for (x, y) in [(-PL / 2 - 0.2 + (PL + 0.4) * (i % 7) / 6, (PW / 2 + 0.25) * (1 if i < 7 else -1))]:
        C(LD, 0.3, 0.3, (x, y, 7.0), steel, seg=6)
B(LD, (3.4, 5.0, 0.9), (-14.2, 5.5, 9.1), orange, bevel=0.2, seg=3)                   # 수동 차단 플러그
GAUGE = [B(LD, (2.2, 0.7, 0.3), (-9.6 + i * 2.7, -10.6, 8.98), led_t, bevel=0.08) for i in range(5)]
B(LD, (15.2, 1.5, 0.22), (-4.2, -10.6, 8.92), blk_s, bevel=0.08)

# ─────────────────────────── 전기차 하부 (스케이트보드) ───────────────────────────
CH = E("chassis")
ZP = 2.6  # 차에 실린 팩 바닥 높이
WR, WWD = 5.6, 3.6
TIRE = lathe_mesh("tire", [(3.5, -1.7, 0), (4.9, -1.8, 0), (5.45, -1.45, 0), (5.6, -0.9, 0), (5.6, 0.9, 0), (5.45, 1.45, 0), (4.9, 1.8, 0), (3.5, 1.7, 0), (3.5, -1.7, 0)], [rubber], seg=48)
RIM = lathe_mesh("rim", [(3.55, -1.7, 0), (3.75, -1.75, 0), (3.75, -1.3, 0), (3.3, -1.1, 0), (3.3, 1.3, 0), (3.75, 1.5, 0), (3.75, 1.75, 0), (3.55, 1.7, 0)], [alu], seg=48)
WHEELS = []
for sx in (-1, 1):
    for sy in (-1, 1):
        wroot = E("wheel", CH, (sx * 25, sy * 16.6, WR))
        O(wroot, TIRE, rot=(PI / 2, 0, 0)); O(wroot, RIM, rot=(PI / 2, 0, 0))
        for q in range(5):
            a = q / 5 * 2 * PI
            B(wroot, (3.3, 0.5, 0.9), (1.75 * math.cos(a), -sy * 1.2, 1.75 * math.sin(a)), alu, bevel=0.12, rot=(0, -a, 0))
        C(wroot, 0.9, 0.7, (0, -sy * 1.35, 0), steel_d, rot=(PI / 2, 0, 0), seg=24)
        WHEELS.append(wroot)
        C(CH, 3.0, 0.4, (sx * 25, sy * 14.5, WR), steel, rot=(PI / 2, 0, 0), seg=40)            # 브레이크 디스크
        B(CH, (2.4, 0.9, 1.6), (sx * 25 + 1.8, sy * 14.5, WR + 1.9), teal, bevel=0.2)            # 캘리퍼
        B(CH, (1.3, 6.4, 0.8), (sx * 25, sy * 11.4, WR - 1.6), steel_d, bevel=0.15)              # 로어 암
        C(CH, 0.95, 6.6, (sx * 25 - sx * 1.6, sy * 11.6, WR + 2.6), blk_s, rot=(sy * 0.38, 0, 0), seg=20)   # 스프링 · 댐퍼
        C(CH, 0.45, 7.4, (sx * 25 - sx * 1.6, sy * 11.6, WR + 2.6), steel, rot=(sy * 0.38, 0, 0), seg=12)
    C(CH, 0.5, 30, (sx * 25, 0, WR), steel_d, rot=(PI / 2, 0, 0), seg=16)                        # 구동축
    B(CH, (1.8, 27, 2.4), (sx * 19.4, 0, 4.2), alu, bevel=0.2)                                   # 크로스 멤버
    B(CH, (1.6, 20, 2.0), (sx * 31.5, 0, 4.8), alu, bevel=0.2)
    for sy in (-1, 1):
        B(CH, (12.5, 1.6, 2.0), (sx * 25.5, sy * 8.6, 4.8), alu, bevel=0.2)                      # 서브프레임
    B(CH, (1.5, 27, 2.6), (sx * 34.2, 0, 6.2), alu, bevel=0.3)                                   # 충돌 보
    for sy in (-1, 1):
        B(CH, (2.6, 1.3, 1.6), (sx * 32.9, sy * 8.6, 5.9), alu, bevel=0.15)
    C(CH, 3.0 if sx > 0 else 2.5, 7.0, (sx * 25, -1.5, WR), alu_cast, rot=(PI / 2, 0, 0), seg=40)   # 모터
    B(CH, (5.0, 3.6, 5.6), (sx * 25, 3.6, WR), alu_cast, bevel=0.4, seg=3)                        # 감속기
    C(CH, 0.55, 0.9, (sx * 25, -5.3, WR), orange, rot=(PI / 2, 0, 0), seg=16)
    B(CH, (5.5, 0.7, 0.7), (sx * 21.2, -5.0, 4.6), orange, bevel=0.2)                            # 고전압 케이블
for sy in (-1, 1):
    B(CH, (40.6, 1.7, 2.8), (0, sy * 13.4, 4.2), alu, bevel=0.25)                                # 사이드 실
C(CH, 0.45, 24, (-28.2, 0, WR + 0.6), steel, rot=(PI / 2, 0, 0), seg=12)                         # 조향 랙
DASH = E("dashes")
for sy in (-1, 1):
    for q in range(8):
        B(DASH, (7.0, 0.6, 0.06), (q * 18.0, sy * 22.5, 0.03), dash, bevel=0.02)

# ─────────────────────────── 진단 스캐너 ───────────────────────────
GA = E("gantry")
for sy in (-1, 1):
    B(GA, (2.0, 1.6, 15.5), (0, sy * 15.6, 7.75), white, bevel=0.2)
    B(GA, (5.0, 2.6, 0.9), (0, sy * 15.6, 0.45), grey, bevel=0.2)
B(GA, (2.6, 33.4, 2.4), (0, 0, 16.4), white, bevel=0.3)
B(GA, (2.7, 8.0, 0.8), (0, -7.0, 16.4), teal, bevel=0.1)
B(GA, (1.6, 25.0, 1.0), (0, 0, 14.8), blk_s, bevel=0.15)
B(GA, (0.5, 24.0, 0.2), (0, 0, 14.25), led_t, bevel=0.04)
_ld = bpy.data.lights.new("scan", "AREA"); _ld.shape = "RECTANGLE"; _ld.size = 1.2; _ld.size_y = 24; _ld.energy = 900; _ld.color = (0.25, 1.0, 0.75)
_ld.spread = math.radians(40)
SCAN = bpy.data.objects.new("scan", _ld); SCAN.location = (0, 0, 14.0); S.link(SCAN); SCAN.parent = GA

# ─────────────────────────── ESS 랙 ───────────────────────────
RK = E("rack"); RKP = (30.5, 8.5)
RW, RD, SH_ = 18.6, 12.4, 9.3
Z_SLOT = [3.4 + i * SH_ for i in range(3)]
RH = 3.4 + 3 * SH_ + 5.2
for sx in (-1, 1):
    B(RK, (0.5, RD, RH), (sx * (RW / 2 - 0.25), 0, RH / 2), white, bevel=0.1)
    for q in range(5):
        B(RK, (0.1, 6.0, 0.35), (sx * (RW / 2 + 0.01), 0, 8 + q * 5.2), grey, bevel=0.03)
B(RK, (RW, 0.5, RH), (0, RD / 2 - 0.25, RH / 2), white, bevel=0.1)
B(RK, (RW, RD, 3.0), (0, 0, 1.5), grey, bevel=0.15)
for i in range(1, 3):
    B(RK, (RW - 0.8, RD - 0.4, 0.4), (0, 0, Z_SLOT[i] - 0.45), grey, bevel=0.06)
B(RK, (RW, RD, 0.5), (0, 0, 3.15), grey, bevel=0.06)
B(RK, (RW, RD, 5.0), (0, 0, RH - 2.5), white, bevel=0.2)
B(RK, (RW - 3, 0.2, 3.0), (0, -RD / 2 - 0.02, RH - 2.6), blk_s, bevel=0.06)
B(RK, (8.0, 0.14, 0.5), (-2.0, -RD / 2 - 0.14, RH - 2.0), led_t, bevel=0.04)
RLED = [B(RK, (0.5, 0.2, 2.0), (-RW / 2 + 0.26, -RD / 2 - 0.06, Z_SLOT[i] + 4.0), led_o, bevel=0.05) for i in range(3)]
for sx in (-1, 1):
    for sy in (-1, 1):
        C(RK, 0.9, 0.5, (sx * 7.6, sy * 4.6, -0.0), blk, seg=20)

# ─────────────────────────── 파쇄기 ───────────────────────────
SH = E("shredder")
for sx in (-1, 1):
    for sy in (-1, 1):
        B(SH, (1.5, 1.5, 13), (sx * 9.6, sy * 7.6, 6.5), grey, bevel=0.15)
    B(SH, (1.2, 15.2, 1.2), (sx * 9.6, 0, 3.0), grey, bevel=0.12)
B(SH, (21.5, 17.5, 8.5), (0, 0, 17.2), white, bevel=0.35, seg=3)
B(SH, (21.6, 3.0, 1.4), (0, -7.4, 19.4), teal, bevel=0.1)
B(SH, (6.0, 0.2, 3.4), (-5.5, -8.8, 15.8), blk_s, bevel=0.08)
B(SH, (0.9, 0.24, 0.9), (-7.3, -8.9, 16.6), led_t, bevel=0.1)
C(SH, 3.4, 7.0, (14.2, 3.4, 17.2), grey, rot=(0, PI / 2, 0), seg=40)      # 구동 모터
C(SH, 3.6, 0.6, (11.0, 3.4, 17.2), steel_d, rot=(0, PI / 2, 0), seg=40)
B(SH, (2.4, 9.5, 6.4), (11.9, -1.6, 17.2), grey, bevel=0.3)
HOP = lathe_mesh("hopper", [(13.6, 21.4, 0), (19.6, 30.6, 0), (20.2, 30.6, 0), (20.2, 31.2, 0), (19.0, 31.2, 0), (13.0, 21.4, 0)], [steel], seg=4, sharp=20)
_h = O(SH, HOP, rot=(0, 0, PI / 4)); _h.scale = (1.0, 0.8, 1.0)
CHU = lathe_mesh("chute", [(8.5, 13.0, 0), (4.6, 8.4, 0), (4.2, 8.4, 0), (8.0, 13.0, 0)], [steel], seg=4, sharp=20)
_c = O(SH, CHU, rot=(0, 0, PI / 4)); _c.scale = (1.0, 0.85, 1.0)
SHAFT = []
for sy in (-1, 1):
    sh = E("shaft", SH, (0, sy * 2.7, 22.6))
    C(sh, 1.1, 19, (0, 0, 0), steel_d, rot=(0, PI / 2, 0), seg=16)
    for q in range(8):
        d = C(sh, 3.0, 1.0, (-7.7 + q * 2.2 + (0.55 if sy > 0 else -0.55), 0, 0), steel, rot=(q * 0.35, PI / 2, 0), seg=7)
    SHAFT.append(sh)
B(SH, (20.4, 15.6, 0.5), (0, 0, 21.0), steel_d, bevel=0.05)

# 받이 통 + 블랙매스 더미
BN = E("bin")
PAN = lathe_mesh("pan", [(0, 0, 0), (7.6, 0, 0), (8.6, 2.6, 0), (9.0, 2.6, 0), (9.0, 2.9, 0), (8.2, 2.9, 0), (7.3, 0.4, 0), (0, 0.4, 0)], [steel], seg=56)
O(BN, PAN)
def heap_mesh(key, r, h, seed, mat, rough=0.06):
    rnd = random.Random(seed); bm = bmesh.new(); n_r, n_a = 14, 40
    top = bm.verts.new((0, 0, h)); rings = []
    for i in range(1, n_r + 1):
        u = i / n_r; ring = []
        for j in range(n_a):
            a = 2 * PI * j / n_a
            z = h * (math.cos(u * PI / 2) ** 1.5) + (rnd.random() - 0.5) * rough * h * (1 - u * 0.6)
            rr = r * u * (1 + (rnd.random() - 0.5) * 0.04)
            ring.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), max(z, 0) if i < n_r else 0)))
        rings.append(ring)
    for j in range(n_a): bm.faces.new((top, rings[0][j], rings[0][(j + 1) % n_a]))
    for a, b in zip(rings, rings[1:]):
        for j in range(n_a): bm.faces.new((a[j], b[j], b[(j + 1) % n_a], a[(j + 1) % n_a]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(key); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    return me
PILE = O(BN, heap_mesh("pile", 7.0, 5.4, 3, bmass), (0, 0, 0.4))
STREAM = C(BN, 0.9, 1.0, (0, 0, 5), bmass, seg=12, r2=0.5)

# 회수 소재 4종 — 탄산리튬 · 황산니켈 · 황산코발트 · 황산망간
DISH = lathe_mesh("dish", [(0, 0, 0), (3.2, 0, 0), (4.9, 1.9, 0), (5.2, 1.9, 0), (5.2, 2.15, 0), (4.7, 2.15, 0), (3.0, 0.35, 0), (0, 0.35, 0)], [porc], seg=56)
DISHES = []
DPOS = [(-6.2, -5.4), (6.2, -5.4), (-6.2, 5.4), (6.2, 5.4)]
for q, pm in enumerate([pw_ni, pw_li, pw_co, pw_mn]):
    d = E(f"dish{q}"); O(d, DISH); O(d, heap_mesh(f"pw{q}", 4.1, 2.9, 10 + q, pm, rough=0.1), (0, 0, 0.35))
    DISHES.append(d)

CUT = E("cutcell"); cut_cell(CUT)

# ─────────────────────────── 조명 · 카메라 ───────────────────────────
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = nt.nodes["Background"]
tc = nt.nodes.new("ShaderNodeTexCoord"); sp_ = nt.nodes.new("ShaderNodeSeparateXYZ")
mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = -1
rp = nt.nodes.new("ShaderNodeValToRGB")
rp.color_ramp.elements[0].color = (0.40, 0.45, 0.54, 1); rp.color_ramp.elements[0].position = 0.38
rp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1); rp.color_ramp.elements[1].position = 0.78
nt.links.new(tc.outputs["Normal"], sp_.inputs[0]); nt.links.new(sp_.outputs["Z"], mr.inputs["Value"])
nt.links.new(mr.outputs["Result"], rp.inputs["Fac"]); nt.links.new(rp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 1.0

def sun(name, direction, strength, color=(1, 1, 1), angle=22):
    ld = bpy.data.lights.new(name, "SUN"); ld.energy = strength; ld.color = color; ld.angle = math.radians(angle)
    o = bpy.data.objects.new(name, ld); S.link(o)
    o.rotation_euler = (-Vector(direction)).to_track_quat("-Z", "Y").to_euler()
sun("key", (-0.75, -0.55, 1.0), 3.2, (1, 0.98, 0.95), 24)
sun("rim_teal", (0.9, 0.7, 0.35), 2.0, (0.55, 0.95, 0.85), 30)
sun("rim_pink", (-0.9, 0.8, 0.2), 1.1, (1.0, 0.72, 0.82), 30)

fl = bpy.data.objects.new("floor", S.box_mesh(900, 900, 0.02, bevel=0)); fl.location = (0, 0, -0.012); fl.is_shadow_catcher = True; S.link(fl)

AZ, EL, LENS = math.radians(-122), math.radians(27), 85
CDIR = Vector((math.cos(AZ) * math.cos(EL), math.sin(AZ) * math.cos(EL), math.sin(EL)))
cam = S.camera("cam", (0, -30, 10), (0, 0, 0), LENS); sc.camera = cam
cam.data.clip_end = 3000
cam.rotation_euler = (-CDIR).to_track_quat("-Z", "Y").to_euler()
KD = 1 / math.sin(math.atan(18 / LENS))

CAMK = [  # (초, 목표 x, y, z, 반경)
    (0.0, PC[0], PC[1], 3.55, 5.0), (0.4, PC[0], PC[1], 3.55, 5.0),
    (1.3, SLOTS[0][0], SLOTS[0][1], 4.0, 13.0), (1.5, SLOTS[0][0], SLOTS[0][1], 4.0, 13.0),
    (2.15, 0, 0, 5.5, 24.5), (2.6, 0, 0, 5.5, 24.5),
    (3.6, 0, 0, 6.0, 39.0), (5.0, 0, 0, 6.0, 39.0),
    (6.0, 0, 0, 7.0, 26.0), (7.3, 2, 0, 7.0, 26.0),
    (8.1, 12, 2, 14.0, 34.0), (9.2, 12, 2, 14.0, 34.0),
    (10.1, PC[0], PC[1], 19.0, 26.0), (12.0, PC[0], PC[1], 17.0, 26.0),
    (12.7, PC[0], PC[1], 2.6, 13.5), (13.3, PC[0], PC[1], 2.2, 15.0), (14.0, PC[0], PC[1], 2.2, 15.0),
    (15.0, PC[0], PC[1], 3.55, 5.0),
]
def cam_at(t):
    for a, b in zip(CAMK, CAMK[1:]):
        if t <= b[0]:
            k = sm(sg(t, a[0], b[0]))
            v = [mix(a[i], b[i], k) for i in range(1, 5)]
            # 반경은 로그 보간 — 줌이 고르게 느껴지도록
            v[3] = math.exp(mix(math.log(a[4]), math.log(b[4]), k))
            return v
    return list(CAMK[-1][1:])

# ─────────────────────────── 시간표 ───────────────────────────
STAGES = [0.0, 2.6, 5.0, 7.4, 9.8, 12.4]
rnd = random.Random(7)
CELL_RND = {k: (rnd.random(), rnd.random(), rnd.random()) for k in MODS[0].cells}
GOOD = [1, 2, 3]  # ESS로 가는 모듈
def setmat(o, m): o.material_slots[0].material = m

def pose(t):
    t = t % DUR
    cx, cy, cz, R = cam_at(t)
    cam.location = Vector((cx, cy, cz)) + CDIR * (R * KD)

    m0 = MODS[0]
    # ── 팩(트레이 · 덮개 · 모듈) 위치 ──
    pk = Vector((0, 0, 0)); pk_on = 1.6 <= t < 10.1
    if t < 2.6:                                   # 뒤에서 미끄러져 들어옴
        pk.x = mix(75, 0, eo(sg(t, 1.6, 2.15)))
    elif t < 5.9:                                 # 차에 실렸다 내려옴
        up = sm(sg(t, 2.65, 3.05)) * (1 - sm(sg(t, 3.5, 3.95)))
        pk.z = ZP + up * 13
        if t > 5.0:
            pk.z = mix(ZP, 15, sm(sg(t, 5.0, 5.4))) if t < 5.45 else mix(15, 0, sm(sg(t, 5.5, 5.9)))
    if t >= 9.5: pk.x = mix(0, -85, ei(sg(t, 9.5, 10.1)))
    show(TR, pk_on); TR.location = pk
    # 덮개
    lid_on = 1.6 <= t < 7.5
    lz = 0.0
    if t < 2.6: lz = mix(10, 0, sm(sg(t, 2.15, 2.55)))
    if t > 6.75: lz = mix(0, 11, sm(sg(t, 6.75, 7.15)))
    lx = mix(0, 95, ei(sg(t, 6.95, 7.5))) if t > 6.9 else 0
    show(LD, lid_on); LD.location = pk + Vector((lx, 0, lz))
    lit = 5 if t < 4.15 else 4 if t < 4.5 else 3 if t < 4.85 else 2
    for i, g in enumerate(GAUGE):
        setmat(g, (led_t if lit >= 4 else led_a) if i < lit else led_o)

    # ── 모듈 1~3 ──
    for n, k in enumerate(GOOD):
        m = MODS[k]; sx, sy = SLOTS[k]
        on = 1.6 <= t < 9.75
        p = pk + Vector((sx, sy, 0.6))
        if t >= 7.4:
            t0 = 7.5 + n * 0.28
            zs = Z_SLOT[2 - n]
            front = Vector((RKP[0], RKP[1] - 16, zs)); dock = Vector((RKP[0], RKP[1] + 0.2, zs))
            a = sm(sg(t, t0, t0 + 0.45)); b = sm(sg(t, t0 + 0.4, t0 + 0.95)); c = sm(sg(t, t0 + 0.95, t0 + 1.3))
            p = p + Vector((0, 0, 12 * a))
            p = p.lerp(front, b).lerp(dock, c)
            if c >= 1: setmat(RLED[2 - n], led_t)
            else: setmat(RLED[2 - n], led_o)
            if t > 9.1: p.x += mix(0, 90, ei(sg(t, 9.1, 9.75)))
        show(m.root, on); m.root.location = p
        setmat(m.led, led_t)
    if t < 7.4:
        for l in RLED: setmat(l, led_o)

    # ── 랙 ──
    rk_on = 7.3 <= t < 9.75
    rx = RKP[0] + mix(70, 0, eo(sg(t, 7.35, 7.95))) + (mix(0, 90, ei(sg(t, 9.1, 9.75))) if t > 9.1 else 0)
    show(RK, rk_on); RK.location = (rx, RKP[1], 0)

    # ── 차 ──
    ch_on = 2.7 <= t < 5.95
    chx = mix(-110, 0, eo(sg(t, 2.75, 3.6))) if t < 5.0 else mix(0, 120, ei(sg(t, 5.35, 5.95)))
    show(CH, ch_on); CH.location = (chx, 0, 0)
    drive = sm(sg(t, 3.85, 4.2)) * (1 - sm(sg(t, 4.7, 5.05)))
    # 굴러온 거리 + 제자리 주행 구간의 회전
    roll = (chx / WR) + (-(max(0.0, min(t, 5.0) - 3.85)) * 9.0 if t > 3.85 else 0)
    for wl in WHEELS: wl.rotation_euler = (0, roll, 0)
    show(DASH, ch_on and drive > 0.02)
    DASH.location = (-((t * 60) % 18.0) - 54 + 0, 0, 0); DASH.scale = (1, 1, 1)
    CH.location.z = 0.12 * math.sin(t * 19) * drive

    # ── 스캐너 ──
    ga_on = 5.75 <= t < 7.05
    show(GA, ga_on); SCAN.hide_render = not ga_on
    GA.location = (mix(-52, 52, sg(t, 5.8, 7.0)), 0, 0)

    # ── 모듈 0 (처음 만든 모듈 → 약한 모듈 → 파쇄) ──
    s0 = Vector((SLOTS[0][0], SLOTS[0][1], 0))
    mp = s0.copy()
    if t < 2.6:
        lift = sm(sg(t, 1.5, 1.8)) * (1 - sm(sg(t, 2.1, 2.4)))
        mp.z = lift * 7.5 + 0.6 * sm(sg(t, 2.1, 2.4))
    elif t < 9.2:
        mp = pk + Vector((SLOTS[0][0], SLOTS[0][1], 0.6))
    else:
        k = sm(sg(t, 9.2, 10.0))
        mp = Vector((mix(SLOTS[0][0], PC[0], k), mix(SLOTS[0][1], PC[1], k), mix(0.6, 34.5, k)))
    if t >= 12.3: mp = s0.copy()
    m0.root.location = mp
    show(m0.root, t < 12.0 or t >= 12.3)
    setmat(m0.led, led_t if t < 5.0 else led_a)
    # 틀 부품: 처음엔 위에서 내려와 조립, 파쇄 전엔 위로 흩어짐
    fr_on = 1.2 <= t < 11.0
    for o in tree(m0.fr): o.hide_render = not fr_on
    _vis[m0.fr.name] = None
    fz = mix(14, 0, eo(sg(t, 1.2, 1.6)))
    fs = 1.0
    if t > 10.4:
        k = ei(sg(t, 10.4, 11.0)); fz = 22 * k; fs = 1 - k
    m0.fr.location = (0, 0, fz); m0.fr.scale = (fs, fs, fs)
    # 셀
    hi, hj = HERO
    for (i, j), c in m0.cells.items():
        x, y = cell_xy(i, j); r1, r2, r3 = CELL_RND[(i, j)]
        d = math.hypot(i - hi, j - hj)
        vis = True; s = 1.0; z = 3.5; rot = (0, 0, 0); dx = dy = 0.0
        if t < 2.0:
            if (i, j) == HERO:
                vis = t >= 1.1
            else:
                k = back(sg(t, 0.6 + d * 0.12, 0.92 + d * 0.12)); s = max(k, 0.0); vis = k > 0.001
                z = 3.5 * s
        elif t >= 10.5 and t < 12.3:
            t0 = 10.6 + r1 * 0.75
            k = sg(t, t0, t0 + 0.42)
            z = 3.5 - 13.0 * k * k - 1.0 * k
            rot = (r2 * 2.6 * k, (r3 - 0.5) * 3.0 * k, 0)
            dx = -x * 0.45 * k; dy = -y * 0.5 * k
            vis = k < 1
        elif t >= 12.3:
            if (i, j) == HERO:
                k = back(sg(t, 14.05, 14.6)); s = max(k, 0.0); z = 3.5 * s
                vis = 14.05 < t < 14.5
            else: vis = False
        c.hide_render = not vis
        c.location = (x + dx, y + dy, z); c.scale = (s, s, s); c.rotation_euler = rot

    # ── 절개 셀 (처음과 끝) ──
    cut_on = t < 1.1 or t >= 14.5
    if _vis.get("cutcell") != cut_on:
        for o in tree(CUT): o.hide_render = not cut_on
        _vis["cutcell"] = cut_on
    if t < 1.1: ang = PI * sm(sg(t, 0.4, 1.1)); s = 1.0
    else: ang = PI + PI * eo(sg(t, 14.5, 15.0)); s = back(sg(t, 14.05, 14.6))
    CUT.location = (PC[0], PC[1], 3.5 * s); CUT.rotation_euler = (0, 0, ang); CUT.scale = (s, s, s)

    # ── 파쇄기 ──
    sh_on = 9.95 <= t < 12.3
    shy = PC[1] + mix(80, 0, eo(sg(t, 10.0, 10.55))) + (mix(0, 110, ei(sg(t, 11.75, 12.3))) if t > 11.75 else 0)
    show(SH, sh_on); SH.location = (PC[0], shy, 0)
    for n, s_ in enumerate(SHAFT): s_.rotation_euler = ((1 if n else -1) * t * 5.0, 0, 0)
    # 받이 통 · 더미
    bn_on = 10.05 <= t < 12.95
    show(BN, bn_on)
    bs = back(sg(t, 10.05, 10.5)) * (1 - ei(sg(t, 12.45, 12.95)))
    BN.location = (PC[0], PC[1], 0); BN.scale = (bs, bs, bs)
    g = sm(sg(t, 10.9, 11.8)); PILE.scale = (0.25 + 0.75 * g, 0.25 + 0.75 * g, max(g, 0.02))
    PILE.hide_render = not (bn_on and t > 10.85)
    pour = sm(sg(t, 10.85, 11.05)) * (1 - sm(sg(t, 11.6, 11.8)))
    STREAM.hide_render = not (bn_on and pour > 0.02)
    top = 0.4 + 5.4 * max(g, 0.02); STREAM.location = (0, 0, (8.6 + top) / 2); STREAM.scale = (pour, pour, 8.6 - top)

    # ── 회수 소재 접시 ──
    for q, d in enumerate(DISHES):
        on = 12.8 <= t < 14.6
        show(d, on)
        k = back(sg(t, 12.82 + q * 0.08, 13.3 + q * 0.08)); out = ei(sg(t, 14.0, 14.55))
        px, py = DPOS[q]
        d.location = (PC[0] + px * k * (1 - out), PC[1] + py * k * (1 - out), 0)
        s = max(k, 0.0) * (1 - out); d.scale = (s, s, s)
        d.rotation_euler = (0, 0, out * 2.5)

def render(path):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

S.render_setup(W, H, SMP)
sc.cycles.max_bounces = 5; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 3; sc.cycles.transmission_bounces = 2
sc.cycles.adaptive_threshold = float(A.get("thr", 0.03))
sc.render.use_persistent_data = A.get("persist", "0") == "1"
sc.render.image_settings.compression = 30
if "th" in A:
    sc.render.threads_mode = "FIXED"; sc.render.threads = int(A["th"])
os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)

if "t" in A:
    for ts in A["t"].split(","):
        t0 = time.time(); pose(float(ts)); render(f"{OUT}_{float(ts):05.2f}.png"); print("T", ts, round(time.time() - t0, 1), flush=True)
elif "frames" in A:
    a, b = [int(v) for v in A["frames"].split("-")]
    step = int(A.get("step", 1))
    for f in range(a, b + 1, step):
        f = f % int(DUR * FPS)
        p = f"{OUT}{f:04d}.png"
        if os.path.exists(p): continue
        t0 = time.time(); pose(f / FPS); render(p); print("F", f, round(time.time() - t0, 1), flush=True)
