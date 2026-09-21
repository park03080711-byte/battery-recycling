"""파우치형 셀 배터리팩 절차적 모델 (Blender 5 / bpy).

좌표: X = 팩 길이, Y = 폭, Z = 높이 (단위 m). 팩 바닥 중앙이 원점.
모든 형상은 코드로 직접 만든다 — 외부 모델·AI 이미지 없음.
"""
import math
import bpy
import bmesh
from mathutils import Vector

TEX = "tex"

# ─────────────────────────── 공통 도우미 ───────────────────────────
_mesh_cache = {}
GROUPS = {}  # tag -> [objects]
HIDE_FRONT = False


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mesh_cache.clear()
    GROUPS.clear()


def tag(obj, t):
    obj["grp"] = t
    GROUPS.setdefault(t, []).append(obj)


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def box_mesh(dx, dy, dz, bevel=0.0015, seg=2):
    key = ("box", round(dx, 5), round(dy, 5), round(dz, 5), bevel, seg)
    if key in _mesh_cache:
        return _mesh_cache[key]
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= dx
        v.co.y *= dy
        v.co.z *= dz
    if bevel > 0:
        b = min(bevel, dx * 0.45, dy * 0.45, dz * 0.45)
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=b, segments=seg, affect="EDGES", profile=0.5, clamp_overlap=True)
    me = bpy.data.meshes.new("box")
    bm.to_mesh(me)
    bm.free()
    _mesh_cache[key] = me
    return me


def cyl_mesh(r, h, seg=32, r2=None, smooth=True):
    key = ("cyl", round(r, 5), round(h, 5), seg, r2, smooth)
    if key in _mesh_cache:
        return _mesh_cache[key]
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    me = bpy.data.meshes.new("cyl")
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = abs(p.normal.z) < 0.5
    _mesh_cache[key] = me
    return me


def obj_from(me, loc, mat, name="o", rot=(0, 0, 0), grp=None, parent=None):
    if not me.materials:
        me.materials.append(None)
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.rotation_euler = rot
    link(o)
    if mat is not None:
        # 오브젝트 단위 재질 — 같은 메시를 여러 재질로 공유
        o.material_slots[0].link = "OBJECT"
        o.material_slots[0].material = mat
    if grp:
        tag(o, grp)
    if parent:
        o.parent = parent
    return o


def box(dims, loc, mat, grp=None, bevel=0.0015, seg=2, rot=(0, 0, 0), name="box"):
    return obj_from(box_mesh(*dims, bevel=bevel, seg=seg), loc, mat, name, rot, grp)


def cyl(r, h, loc, mat, grp=None, rot=(0, 0, 0), seg=32, r2=None, name="cyl"):
    return obj_from(cyl_mesh(r, h, seg, r2), loc, mat, name, rot, grp)


def plane_tex(w, h, loc, mat, grp=None, rot=(0, 0, 0), name="decal"):
    me = bpy.data.meshes.new(name)
    verts = [(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)]
    me.from_pydata(verts, [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new()
    for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = c
    return obj_from(me, loc, mat, name, rot, grp)


def tube(points, radius, mat, grp=None, name="tube", res=4):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    sp = cu.splines.new("NURBS")
    sp.points.add(len(points) - 1)
    for p, c in zip(sp.points, points):
        p.co = (c[0], c[1], c[2], 1)
    sp.order_u = min(4, len(points))
    sp.use_endpoint_u = True
    sp.resolution_u = 16
    o = bpy.data.objects.new(name, cu)
    cu.materials.append(mat)
    link(o)
    if grp:
        tag(o, grp)
    return o


# ─────────────────────────── 재질 ───────────────────────────
def P(name, color, metal=0.0, rough=0.5, aniso=0.0, coat=0.0, trans=0.0, alpha=1.0, bump=0.0, bump_scale=400.0, sss=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if aniso:
        b.inputs["Anisotropic"].default_value = aniso
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.08
    if trans:
        b.inputs["Transmission Weight"].default_value = trans
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
    if emit:
        b.inputs["Emission Color"].default_value = (*emit[0], 1)
        b.inputs["Emission Strength"].default_value = emit[1]
    if bump:
        n = nt.nodes.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = bump_scale
        n.inputs["Detail"].default_value = 6
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = bump
        bp.inputs["Distance"].default_value = 0.0004
        nt.links.new(n.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def brushed(name, color, rough=0.26, stretch=(1, 60, 1)):
    """방향성 헤어라인 가공 알루미늄"""
    m = P(name, color, metal=1.0, rough=rough, aniso=0.55)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = stretch
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 900
    n.inputs["Detail"].default_value = 4
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["To Min"].default_value = rough - 0.08
    ramp.inputs["To Max"].default_value = rough + 0.1
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
    nt.links.new(n.outputs["Fac"], ramp.inputs["Value"])
    nt.links.new(ramp.outputs["Result"], b.inputs["Roughness"])
    return m


def textured(name, path, rough=0.4, metal=0.0, coat=0.0):
    m = P(name, (1, 1, 1), metal=metal, rough=rough, coat=coat)
    nt = m.node_tree
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(path)
    img.interpolation = "Cubic"
    nt.links.new(img.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
    return m


def mats():
    M = {}
    M["alu"] = brushed("alu_brushed", (0.80, 0.81, 0.83))
    M["alu_cast"] = P("alu_cast", (0.50, 0.51, 0.53), metal=1.0, rough=0.38, bump=0.12, bump_scale=260)
    M["alu_dark"] = P("alu_anod", (0.16, 0.17, 0.19), metal=0.9, rough=0.36)
    M["lid"] = P("lid_paint", (0.045, 0.05, 0.058), metal=0.25, rough=0.38, coat=0.35, bump=0.05, bump_scale=900)
    M["pouch"] = P("pouch", (0.80, 0.79, 0.76), metal=0.9, rough=0.3, bump=0.25, bump_scale=55)
    M["pouch_edge"] = P("pouch_edge", (0.70, 0.69, 0.66), metal=0.75, rough=0.4)
    M["cu"] = P("copper", (0.96, 0.56, 0.36), metal=1.0, rough=0.22)
    M["cu_tin"] = P("tinned_cu", (0.80, 0.78, 0.74), metal=1.0, rough=0.3)
    M["ni"] = P("nickel", (0.72, 0.69, 0.64), metal=1.0, rough=0.28)
    M["al_tab"] = P("al_tab", (0.88, 0.88, 0.89), metal=1.0, rough=0.2)
    M["plastic"] = P("plastic_black", (0.018, 0.019, 0.021), rough=0.46)
    M["plastic_grey"] = P("plastic_grey", (0.12, 0.125, 0.13), rough=0.55)
    M["foam"] = P("foam", (0.06, 0.065, 0.07), rough=0.95, bump=0.3, bump_scale=900)
    M["pad"] = P("gap_filler", (0.46, 0.60, 0.72), rough=0.75, bump=0.12, bump_scale=120)
    M["steel"] = P("stainless", (0.72, 0.72, 0.73), metal=1.0, rough=0.22)
    M["zinc"] = P("zinc_bolt", (0.62, 0.64, 0.66), metal=1.0, rough=0.34)
    M["orange"] = P("hv_orange", (0.95, 0.20, 0.0), rough=0.36, coat=0.2)
    M["rubber"] = P("rubber", (0.025, 0.025, 0.028), rough=0.7)
    M["white"] = P("white_nylon", (0.82, 0.80, 0.74), rough=0.5, sss=0.08)
    M["ceramic"] = P("ceramic", (0.88, 0.87, 0.84), rough=0.35)
    M["chip"] = P("ic_black", (0.02, 0.02, 0.022), rough=0.4)
    M["gold"] = P("gold", (1.0, 0.77, 0.36), metal=1.0, rough=0.2)
    M["cap"] = P("capacitor", (0.70, 0.72, 0.76), metal=1.0, rough=0.3)
    M["blue"] = P("coolant_blue", (0.05, 0.24, 0.62), rough=0.4, coat=0.2)
    M["wire_w"] = P("wire_white", (0.85, 0.85, 0.82), rough=0.45)
    M["wire_r"] = P("wire_red", (0.62, 0.04, 0.04), rough=0.45)
    M["pcb_bms"] = textured("pcb_bms", f"{TEX}/pcb_bms.png", rough=0.32, coat=0.4)
    M["pcb_cmu"] = textured("pcb_cmu", f"{TEX}/pcb_cmu.png", rough=0.32, coat=0.4)
    M["pcb_edge"] = P("pcb_edge", (0.05, 0.22, 0.10), rough=0.4)
    M["hv_label"] = textured("hv_label", f"{TEX}/hv_label.png", rough=0.3, coat=0.3)
    M["id_plate"] = textured("id_plate", f"{TEX}/id_plate.png", rough=0.28, metal=0.6)
    M["weld"] = P("weld", (0.55, 0.40, 0.30), metal=1.0, rough=0.5, bump=0.6, bump_scale=2000)
    return M


# ─────────────────────────── 치수 ───────────────────────────
L, W = 1.60, 1.12
WALL = 0.028
H_TRAY = 0.13
FLOOR = 0.006
MOD_X = [-0.61, -0.295, 0.02, 0.335]
MOD_Y = [-0.27, 0.27]
MOD_L, MOD_W, MOD_H = 0.30, 0.48, 0.108
Z_MOD = 0.021  # 모듈 바닥 높이 (냉각판 + 갭필러 위)
N_CELL = 24
EMPTY_SLOT = (2, 0)  # (열, 행) — 정비 중 빠진 모듈 자리
BAY_X0, BAY_X1 = 0.50, L / 2 - WALL


def build_tray(M):
    g = "case"
    hw, hl = W / 2, L / 2
    box((L, W, FLOOR), (0, 0, FLOOR / 2), M["alu_cast"], g, bevel=0.002)
    # 둘레 벽
    for s in (-1, 1):
        box((L, WALL, H_TRAY), (0, s * (hw - WALL / 2), H_TRAY / 2), M["alu_cast"], g, bevel=0.003, seg=3)
        box((WALL, W - 2 * WALL, H_TRAY), (s * (hl - WALL / 2), 0, H_TRAY / 2), M["alu_cast"], g, bevel=0.003, seg=3)
    # 상단 플랜지
    F = 0.036
    for s in (-1, 1):
        box((L + 2 * F, F, 0.008), (0, s * (hw + F / 2 - 0.004), H_TRAY - 0.004), M["alu_cast"], g, bevel=0.002)
        box((F, W, 0.008), (s * (hl + F / 2 - 0.004), 0, H_TRAY - 0.004), M["alu_cast"], g, bevel=0.002)
    # 외벽 보강 리브
    for i in range(13):
        x = -hl + 0.08 + i * (L - 0.16) / 12
        for s in (-1, 1):
            box((0.012, 0.018, H_TRAY - 0.02), (x, s * (hw + 0.008), (H_TRAY - 0.02) / 2), M["alu_cast"], g, bevel=0.003)
    for j in range(8):
        y = -hw + 0.09 + j * (W - 0.18) / 7
        for s in (-1, 1):
            box((0.018, 0.012, H_TRAY - 0.02), (s * (hl + 0.008), y, (H_TRAY - 0.02) / 2), M["alu_cast"], g, bevel=0.003)
    # 차체 장착 브래킷
    for x in (-0.62, -0.2, 0.2, 0.62):
        for s in (-1, 1):
            box((0.09, 0.07, 0.012), (x, s * (hw + 0.06), 0.03), M["alu_cast"], g, bevel=0.004, seg=3)
            box((0.012, 0.05, 0.05), (x - 0.039, s * (hw + 0.04), 0.05), M["alu_cast"], g, bevel=0.003)
            box((0.012, 0.05, 0.05), (x + 0.039, s * (hw + 0.04), 0.05), M["alu_cast"], g, bevel=0.003)
            cyl(0.011, 0.014, (x, s * (hw + 0.07), 0.03), M["plastic"], g, seg=24)
            cyl(0.016, 0.004, (x, s * (hw + 0.07), 0.037), M["zinc"], g, seg=6)
    # 내부 보: 가운데 세로보 + 가로보
    box((BAY_X0 + hl - WALL, 0.024, 0.1), ((BAY_X0 - hl + WALL) / 2, 0, 0.05 + FLOOR), M["alu"], g, bevel=0.002)
    for x in (-0.4525, -0.1375, 0.1775, 0.4925):
        for s in (-1, 1):
            box((0.012, 0.50, 0.075), (x, s * 0.278, 0.0375 + FLOOR), M["alu"], g, bevel=0.002)
    # 플랜지 볼트 (뚜껑 체결)
    bolts = []
    for i in range(15):
        x = -hl + 0.05 + i * (L - 0.1) / 14
        for s in (-1, 1):
            bolts.append((x, s * (hw + 0.013)))
    for j in range(10):
        y = -hw + 0.06 + j * (W - 0.12) / 9
        for s in (-1, 1):
            bolts.append((s * (hl + 0.013), y))
    return bolts


def build_cooling(M):
    g = "case"
    x0, x1 = -L / 2 + WALL + 0.004, BAY_X0 - 0.008
    ym = W / 2 - WALL - 0.004
    box((x1 - x0, 2 * ym, 0.012), ((x0 + x1) / 2, 0, FLOOR + 0.006), M["alu"], g, bevel=0.0015)
    zt = FLOOR + 0.012
    # 모듈 자리별 유로(돌출 채널) — 빈 자리에서만 보이지만 전부 만든다
    for ci, xc in enumerate(MOD_X):
        for ri, yc in enumerate(MOD_Y):
            for k in range(7):
                x = xc - 0.12 + k * 0.04
                box((0.022, 0.44, 0.0045), (x, yc, zt + 0.00225), M["alu"], g, bevel=0.002, seg=3)
            for k in range(6):
                x = xc - 0.10 + k * 0.04
                yy = yc + (0.22 if k % 2 == 0 else -0.22)
                box((0.062, 0.022, 0.0045), (x, yy, zt + 0.00225), M["alu"], g, bevel=0.002, seg=3)
            if (ci, ri) != EMPTY_SLOT:
                box((MOD_L - 0.01, MOD_W - 0.03, 0.003), (xc, yc, Z_MOD - 0.0015), M["pad"], g, bevel=0.001)
            else:
                # 반쯤 벗겨진 갭필러 한 조각
                box((0.1, MOD_W - 0.05, 0.003), (xc + 0.09, yc, zt + 0.006), M["pad"], g, bevel=0.001)
    # 냉각수 매니폴드 + 배관 (팩 +X 벽으로 나감)
    ym2 = 0.515
    for s, zoff in ((1, 0.0), (1, 0.03)):
        pass
    tube([(x0 + 0.02, 0.50, zt + 0.012), (0.2, 0.50, zt + 0.012), (0.49, 0.50, zt + 0.012), (0.56, 0.49, 0.05), (0.70, 0.46, 0.07), (0.79, 0.44, 0.07)], 0.011, M["rubber"], g, "coolant_in")
    tube([(x0 + 0.02, 0.475, zt + 0.012), (0.2, 0.475, zt + 0.012), (0.48, 0.475, zt + 0.012), (0.56, 0.45, 0.04), (0.70, 0.37, 0.07), (0.79, 0.36, 0.07)], 0.011, M["rubber"], g, "coolant_out")
    for y in (0.44, 0.36):
        cyl(0.017, 0.05, (L / 2 + 0.018, y, 0.07), M["alu"], g, rot=(0, math.pi / 2, 0))
        cyl(0.019, 0.012, (L / 2 + 0.04, y, 0.07), M["blue"], g, rot=(0, math.pi / 2, 0))
        cyl(0.012, 0.03, (L / 2 + 0.058, y, 0.07), M["alu"], g, rot=(0, math.pi / 2, 0))


def build_module(M, xc, yc, idx):
    gC, gM = "cell", "module"
    z0 = Z_MOD
    pitch = 0.0112
    span = pitch * N_CELL
    cell_t, cell_w, cell_h = 0.0086, 0.372, 0.098
    # 셀 적층
    for i in range(N_CELL):
        x = xc - span / 2 + pitch * (i + 0.5)
        box((cell_t, cell_w, cell_h), (x, yc, z0 + 0.005 + cell_h / 2), M["pouch"], gC, bevel=0.0028, seg=3)
        # 실링 날개 (탭 방향 양 끝)
        for s in (-1, 1):
            box((0.0011, 0.014, cell_h - 0.01), (x, yc + s * (cell_w / 2 + 0.006), z0 + 0.005 + cell_h / 2), M["pouch_edge"], gC, bevel=0.0004, seg=1)
            # 탭: 양극(알루미늄) / 음극(니켈 도금 구리)
            tm = M["al_tab"] if (i + (s > 0)) % 2 == 0 else M["ni"]
            box((0.0009, 0.022, 0.046), (x, yc + s * (cell_w / 2 + 0.021), z0 + 0.06), tm, gC, bevel=0.0003, seg=1)
        if i % 2 == 1 and i < N_CELL - 1:
            box((0.0022, cell_w - 0.02, cell_h - 0.014), (x + pitch / 2, yc, z0 + 0.005 + cell_h / 2), M["foam"], gC, bevel=0.0006, seg=1)
    # 엔드플레이트 (알루미늄 압출, 리브)
    for s in (-1, 1):
        ex = xc + s * (span / 2 + 0.0075)
        box((0.013, MOD_W - 0.02, MOD_H), (ex, yc, z0 + MOD_H / 2), M["alu"], gM, bevel=0.002, seg=2)
        for k in range(3):
            box((0.006, MOD_W - 0.06, 0.008), (ex + s * 0.009, yc, z0 + 0.022 + k * 0.032), M["alu"], gM, bevel=0.002)
        for sy in (-1, 1):
            cyl(0.0075, 0.004, (ex + s * 0.0005, yc + sy * 0.2, z0 + MOD_H + 0.002), M["zinc"], gM, seg=6)
            cyl(0.0045, MOD_H + 0.004, (ex, yc + sy * 0.2, z0 + MOD_H / 2), M["zinc"], gM, seg=16)
    # 스테인리스 밴드 2줄
    for sy in (-0.1, 0.1):
        box((span + 0.034, 0.02, 0.0016), (xc, yc + sy, z0 + MOD_H + 0.0008), M["steel"], gM, bevel=0.0006, seg=1)
        for s in (-1, 1):
            box((0.0016, 0.02, MOD_H * 0.7), (xc + s * (span / 2 + 0.0165), yc + sy, z0 + MOD_H * 0.65), M["steel"], gM, bevel=0.0006, seg=1)
    # ICB (셀 연결 기판) — 탭 쪽 양 끝
    for s in (-1, 1):
        yb = yc + s * (cell_w / 2 + 0.036)
        box((span + 0.01, 0.01, 0.084), (xc, yb, z0 + 0.058), M["plastic"], gM, bevel=0.0015)
        # 버스바: 셀 2개씩 병렬 → 12직렬
        nbar = N_CELL // 4 + (1 if s > 0 else 0)
        for k in range(nbar):
            off = 0 if s < 0 else -2
            i0 = k * 4 + off
            i1 = min(i0 + 3, N_CELL - 1)
            i0 = max(i0, 0)
            xa = xc - span / 2 + pitch * (i0 + 0.5)
            xb = xc - span / 2 + pitch * (i1 + 0.5)
            wbar = (xb - xa) + 0.009
            box((wbar, 0.003, 0.034), ((xa + xb) / 2, yb + s * 0.0065, z0 + 0.062), M["cu_tin"], gM, bevel=0.0008, seg=1)
            # 레이저 용접 자국
            for i in range(i0, i1 + 1):
                xw = xc - span / 2 + pitch * (i + 0.5)
                box((0.0026, 0.0012, 0.02), (xw, yb + s * 0.0085, z0 + 0.062), M["weld"], gM, bevel=0.0004, seg=1)
    # 모듈 단자 (바깥쪽 ICB 위, 끝 버스바 + 볼트)
    so = 1 if yc > 0 else -1
    yt = yc + so * 0.226
    for tx in (xc - span / 2 + 0.01, xc + span / 2 - 0.01):
        box((0.028, 0.03, 0.006), (tx, yt, z0 + MOD_H - 0.002), M["cu"], gM, bevel=0.001)
        cyl(0.006, 0.012, (tx, yt, z0 + MOD_H + 0.005), M["zinc"], gM, seg=6)
    # CMU (셀 감시 보드) — 팩 가운데 쪽 ICB 위
    si = -so
    yb = yc + si * (cell_w / 2 + 0.036)
    yp = yb - si * 0.012
    box((0.11, 0.05, 0.0018), (xc, yp, z0 + MOD_H + 0.006), M["pcb_edge"], gM, bevel=0.0004, seg=1)
    plane_tex(0.11, 0.05, (xc, yp, z0 + MOD_H + 0.0071), M["pcb_cmu"], gM)
    for k in range(4):
        box((0.012, 0.012, 0.0022), (xc - 0.045 + k * 0.022, yp - si * 0.006, z0 + MOD_H + 0.0083), M["chip"], gM, bevel=0.0005, seg=1)
    box((0.026, 0.01, 0.009), (xc + 0.036, yp + si * 0.018, z0 + MOD_H + 0.011), M["white"], gM, bevel=0.001)
    for sy in (-1, 1):
        cyl(0.003, 0.006, (xc + sy * 0.05, yp - si * 0.018, z0 + MOD_H + 0.004), M["plastic"], gM, seg=12)
    return (xc + 0.036, yp + si * 0.022, z0 + MOD_H + 0.013)


def term(ci, ri, end):
    """모듈 단자 좌표. end = -1(−X 끝) / +1(+X 끝)"""
    span = 0.0112 * N_CELL
    so = 1 if MOD_Y[ri] > 0 else -1
    return (MOD_X[ci] + end * (span / 2 - 0.01), MOD_Y[ri] + so * 0.226, Z_MOD + MOD_H + 0.012)


def build_modules(M):
    cmu_ports = []
    for ci, xc in enumerate(MOD_X):
        for ri, yc in enumerate(MOD_Y):
            if (ci, ri) == EMPTY_SLOT:
                continue
            cmu_ports.append(build_module(M, xc, yc, (ci, ri)))
    zt = Z_MOD + MOD_H + 0.014
    # 직렬 연결: (3,0)+ … [빈 자리] … (1,0)→(0,0)→(0,1)→(1,1)→(2,1)→(3,1)−
    def bar(pa, pb):
        box((pb[0] - pa[0] + 0.03, 0.026, 0.004), ((pa[0] + pb[0]) / 2, pa[1], zt), M["cu"], "module", bevel=0.001)
        box((pb[0] - pa[0] - 0.02, 0.032, 0.012), ((pa[0] + pb[0]) / 2, pa[1], zt + 0.007), M["orange"], "module", bevel=0.003, seg=3)
    for ri in (0, 1):
        for ci in (0, 1, 2):
            if (ci, ri) == EMPTY_SLOT or (ci + 1, ri) == EMPTY_SLOT:
                continue
            bar(term(ci, ri, 1), term(ci + 1, ri, -1))
    # 열 전환: −X 끝 엔드플레이트 위로 넘어가는 케이블
    pa, pb = term(0, 0, -1), term(0, 1, -1)
    xe = MOD_X[0] - 0.0112 * N_CELL / 2 - 0.012
    tube([pa, (xe, pa[1] + 0.03, zt + 0.02), (xe, -0.1, zt + 0.02), (xe, 0.1, zt + 0.02), (xe, pb[1] - 0.03, zt + 0.02), pb], 0.009, M["orange"], "bms", "hv_link")
    # 빈 자리 양쪽 — 풀어 둔 단자 커버
    for (ci, e) in ((1, 1), (3, -1)):
        p = term(ci, 0, e)
        box((0.034, 0.036, 0.016), (p[0], p[1], p[2] + 0.004), M["orange"], "module", bevel=0.004, seg=3)
    return cmu_ports


def build_bay(M, cmu_ports):
    g = "bms"
    x0, x1 = BAY_X0 + 0.01, BAY_X1 - 0.01
    xc = (x0 + x1) / 2
    # BDU: 차단 장치 (-Y 쪽)
    box((x1 - x0, 0.40, 0.006), (xc, -0.27, FLOOR + 0.003), M["plastic_grey"], g, bevel=0.002)
    for k, y in enumerate((-0.40, -0.30)):
        cyl(0.03, 0.068, (xc - 0.03, y, FLOOR + 0.04), M["plastic"], g, seg=40)
        cyl(0.034, 0.008, (xc - 0.03, y, FLOOR + 0.01), M["plastic"], g, seg=40)
        for sx in (-1, 1):
            cyl(0.0075, 0.014, (xc - 0.03 + sx * 0.014, y, FLOOR + 0.08), M["cu"], g, seg=20)
            cyl(0.009, 0.004, (xc - 0.03 + sx * 0.014, y, FLOOR + 0.088), M["zinc"], g, seg=6)
        box((0.02, 0.012, 0.012), (xc - 0.03, y + 0.036, FLOOR + 0.07), M["white"], g, bevel=0.002)
    # 퓨즈 · 전류 션트 · 프리차지 릴레이
    box((0.09, 0.03, 0.03), (xc + 0.045, -0.35, FLOOR + 0.021), M["ceramic"], g, bevel=0.004, seg=3)
    for sx in (-1, 1):
        box((0.018, 0.034, 0.004), (xc + 0.045 + sx * 0.056, -0.35, FLOOR + 0.008), M["cu"], g, bevel=0.001)
    box((0.1, 0.02, 0.004), (xc + 0.01, -0.19, FLOOR + 0.03), M["cu"], g, bevel=0.001)
    box((0.03, 0.022, 0.008), (xc + 0.01, -0.19, FLOOR + 0.036), M["pcb_edge"], g, bevel=0.001)
    box((0.035, 0.03, 0.028), (xc + 0.06, -0.24, FLOOR + 0.02), M["plastic"], g, bevel=0.002)
    # 내부 구리 버스바
    box((0.05, 0.012, 0.004), (xc + 0.0, -0.375, FLOOR + 0.086), M["cu"], g, bevel=0.001)
    # BMS 마스터 보드 (+Y 쪽, 스탠드오프 위)
    pz = FLOOR + 0.05
    pw, ph = x1 - x0 - 0.02, 0.34
    pyc = 0.12
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(0.005, pz - FLOOR, (xc + sx * (pw / 2 - 0.012), pyc + sy * (ph / 2 - 0.012), (pz + FLOOR) / 2), M["zinc"], g, seg=6)
    box((pw, ph, 0.0018), (xc, pyc, pz), M["pcb_edge"], g, bevel=0.0005, seg=1)
    plane_tex(pw, ph, (xc, pyc, pz + 0.0011), M["pcb_bms"], g, rot=(0, 0, math.pi / 2))
    # MCU · IC · 콘덴서 · 커넥터
    box((0.03, 0.03, 0.0026), (xc, pyc + 0.02, pz + 0.0022), M["chip"], g, bevel=0.0006, seg=1)
    for k in range(4):
        box((0.014, 0.022, 0.002), (xc - 0.06 + k * 0.04, pyc - 0.08, pz + 0.002), M["chip"], g, bevel=0.0005, seg=1)
        box((0.012, 0.012, 0.002), (xc - 0.06 + k * 0.04, pyc + 0.09, pz + 0.002), M["chip"], g, bevel=0.0005, seg=1)
    for k in range(3):
        cyl(0.0065, 0.014, (xc + 0.07, pyc - 0.02 + k * 0.022, pz + 0.008), M["cap"], g, seg=24)
        cyl(0.0068, 0.0015, (xc + 0.07, pyc - 0.02 + k * 0.022, pz + 0.0012), M["plastic"], g, seg=24)
    box((0.07, 0.018, 0.014), (xc - 0.02, pyc + ph / 2 - 0.02, pz + 0.008), M["plastic"], g, bevel=0.0015)
    box((0.05, 0.016, 0.012), (xc - 0.05, pyc - ph / 2 + 0.02, pz + 0.007), M["white"], g, bevel=0.0015)
    for k in range(10):
        box((0.0018, 0.004, 0.0006), (xc - 0.04 + k * 0.004, pyc + 0.0, pz + 0.0012), M["gold"], g, bevel=0.0002, seg=1)
    # 외부 커넥터 (+X 벽)
    xw = L / 2 + 0.004
    box((0.05, 0.11, 0.07), (xw + 0.02, -0.30, 0.07), M["orange"], g, bevel=0.006, seg=3)
    for sy in (-1, 1):
        cyl(0.013, 0.012, (xw + 0.048, -0.30 + sy * 0.027, 0.07), M["plastic"], g, rot=(0, math.pi / 2, 0))
    box((0.04, 0.07, 0.05), (xw + 0.016, -0.12, 0.07), M["plastic"], g, bevel=0.006, seg=3)
    box((0.004, 0.05, 0.03), (xw + 0.036, -0.12, 0.07), M["plastic_grey"], g, bevel=0.001)
    # 고전압 주 케이블: 모듈 끝단 → BDU
    zt = Z_MOD + MOD_H + 0.012
    pp, pn = term(3, 0, 1), term(3, 1, 1)
    tube([pp, (pp[0] + 0.02, pp[1] - 0.01, zt + 0.03), (0.52, -0.43, 0.13), (xc - 0.05, -0.40, 0.11), (xc - 0.044, -0.40, FLOOR + 0.092)], 0.0105, M["orange"], g, "hv_main_p")
    tube([pn, (pn[0] + 0.015, pn[1] - 0.02, zt + 0.03), (0.492, 0.35, zt + 0.02), (0.492, 0.0, zt + 0.02), (0.495, -0.2, zt + 0.01), (xc - 0.05, -0.28, 0.11), (xc - 0.044, -0.30, FLOOR + 0.092)], 0.0105, M["orange"], g, "hv_main_n")
    tube([(xc - 0.016, -0.40, FLOOR + 0.092), (xc - 0.01, -0.42, 0.115), (xw - 0.03, -0.34, 0.09), (xw, -0.31, 0.07)], 0.0095, M["orange"], g, "hv_out_p")
    tube([(xc - 0.016, -0.30, FLOOR + 0.092), (xc - 0.01, -0.28, 0.115), (xw - 0.03, -0.28, 0.09), (xw, -0.29, 0.07)], 0.0095, M["orange"], g, "hv_out_n")
    # 셀 감시 배선: 각 CMU → 두 모듈 열 사이 → BMS
    for k, p in enumerate(cmu_ports):
        sy = 1 if p[1] > 0 else -1
        ry = sy * (0.008 + 0.0045 * (k % 4))
        zr = Z_MOD + MOD_H + 0.02
        pts = [p, (p[0] + 0.008, p[1] + sy * 0.006, p[2] + 0.006), (p[0] + 0.03, ry, zr), (0.3, ry, zr), (0.46, ry, zr), (0.53, -0.03 + ry * 0.5, pz + 0.03), (xc - 0.05, pyc - ph / 2 + 0.03, pz + 0.012)]
        tube(pts, 0.0026, M["wire_w"] if k % 3 else M["wire_r"], "module", "harness")


def build_lid(M, bolts):
    g = "lid"
    zl = H_TRAY
    box((L + 0.072, W + 0.072, 0.004), (0, 0, zl + 0.002), M["lid"], g, bevel=0.002)
    box((L - 0.02, W - 0.02, 0.05), (0, 0, zl + 0.025), M["lid"], g, bevel=0.022, seg=6)
    # 보강 비드
    for k in range(5):
        y = -0.38 + k * 0.19
        box((1.10, 0.06, 0.012), (-0.13, y, zl + 0.05), M["lid"], g, bevel=0.0055, seg=4)
    box((0.26, 0.9, 0.012), (0.62, 0, zl + 0.05), M["lid"], g, bevel=0.0055, seg=4)
    for (x, y) in bolts:
        cyl(0.0085, 0.006, (x, y, zl + 0.007), M["zinc"], g, seg=6)
        cyl(0.011, 0.0015, (x, y, zl + 0.0045), M["zinc"], g, seg=24)
    plane_tex(0.24, 0.104, (0.62, -0.36, zl + 0.0565), M["hv_label"], g)
    plane_tex(0.2, 0.1155, (0.62, 0.3, zl + 0.0565), M["id_plate"], g)


def build_pack():
    M = mats()
    bolts = build_tray(M)
    build_cooling(M)
    ports = build_modules(M)
    build_bay(M, ports)
    build_lid(M, bolts)
    # 플랜지 위 볼트 구멍 자리 (뚜껑 없을 때 보임)
    for (x, y) in bolts:
        cyl(0.0045, 0.002, (x, y, H_TRAY + 0.0005), M["plastic"], "case", seg=16)
    # 상세 화면에서 잘라 낼 앞쪽(−Y) 벽 표시
    for o in GROUPS.get("case", []):
        if o.location.y < -(W / 2 - WALL) - 0.001:
            o["front"] = True
    return M


# ─────────────────────────── 조명 · 카메라 · 렌더 ───────────────────────────
def studio():
    s = bpy.context.scene
    w = bpy.data.worlds.new("studio")
    s.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes["Background"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.03, 0.034, 0.04, 1)
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = (0.30, 0.33, 0.37, 1)
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -1
    nt.links.new(tc.outputs["Generated"], sep.inputs[0]) if False else None
    nt.links.new(tc.outputs["Normal"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.3

    def area(name, loc, size, energy, color=(1, 1, 1), shape="RECTANGLE", sy=None):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy
        ld.color = color
        ld.shape = shape
        ld.size = size
        if sy:
            ld.size_y = sy
        o = bpy.data.objects.new(name, ld)
        o.location = loc
        link(o)
        c = o.constraints.new("TRACK_TO")
        tgt = bpy.data.objects.get("aim") or link(bpy.data.objects.new("aim", None))
        c.target = tgt
        return o

    area("key", (-1.2, -2.2, 2.6), 2.2, 260, (1.0, 0.97, 0.93), sy=1.2)
    area("rim", (2.2, 1.8, 1.4), 1.6, 320, (0.82, 0.9, 1.0), sy=0.5)
    area("top", (0.2, 0.3, 3.2), 3.0, 140, (1, 1, 1), sy=2.0)
    area("fill", (2.6, -1.4, 0.7), 1.2, 70, (0.95, 0.97, 1.0), sy=0.6)
    # 그림자 받이 (투명 배경 합성용)
    me = box_mesh(8, 8, 0.01, bevel=0)
    fl = bpy.data.objects.new("floor", me)
    fl.location = (0, 0, -0.005)
    fl.is_shadow_catcher = True
    link(fl)


def camera(name, loc, target, lens=50):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = 36
    o = bpy.data.objects.new(name, cd)
    o.location = loc
    link(o)
    d = Vector(target) - Vector(loc)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o


def render_setup(w=1920, h=1080, samples=128, transparent=True):
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.device = "CPU"
    s.cycles.samples = samples
    s.cycles.use_adaptive_sampling = True
    s.cycles.adaptive_threshold = 0.015
    s.cycles.use_denoising = True
    s.cycles.denoiser = "OPENIMAGEDENOISE"
    s.cycles.max_bounces = 8
    s.cycles.glossy_bounces = 4
    s.cycles.transmission_bounces = 6
    s.cycles.diffuse_bounces = 3
    s.cycles.caustics_reflective = False
    s.cycles.caustics_refractive = False
    s.cycles.sample_clamp_indirect = 4
    s.render.resolution_x = w
    s.render.resolution_y = h
    s.render.resolution_percentage = 100
    s.render.film_transparent = transparent
    s.render.image_settings.file_format = "PNG"
    s.render.image_settings.color_mode = "RGBA"
    s.render.threads_mode = "AUTO"
    try:
        s.view_settings.view_transform = "AgX"
        s.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        try:
            s.view_settings.look = "Medium High Contrast"
        except Exception:
            pass


def set_visible(pred):
    for o in bpy.context.scene.objects:
        if o.type in ("MESH", "CURVE"):
            g = o.get("grp")
            if g is None:
                continue
            v = pred(g) and not (HIDE_FRONT and o.get("front"))
            o.hide_render = not v


def project(cam, pts):
    from bpy_extras.object_utils import world_to_camera_view

    s = bpy.context.scene
    bpy.context.view_layer.update()
    out = {}
    for k, p in pts.items():
        c = world_to_camera_view(s, cam, Vector(p))
        out[k] = [round(c.x * 100, 2), round((1 - c.y) * 100, 2)]
    return out


# ─────────────────────────── 파우치 셀 분해도 (상세 화면용) ───────────────────────────
def build_cell_exploded():
    """셀 1개를 층별로 띄워 놓은 분해도. 층 두께는 보이도록 과장."""
    M = mats()
    M["ncm"] = P("ncm_coat", (0.03, 0.03, 0.034), rough=0.72, bump=0.35, bump_scale=1400)
    M["graphite"] = P("graphite", (0.045, 0.046, 0.05), metal=0.35, rough=0.5, bump=0.3, bump_scale=1100)
    M["sep"] = P("separator", (0.9, 0.9, 0.88), rough=0.55, trans=0.35, sss=0.2)
    M["al_foil"] = P("al_foil", (0.9, 0.9, 0.91), metal=1.0, rough=0.16)
    Lc, Wc = 0.372, 0.098
    gap = 0.034
    layers = [
        ("pouch_bot", "pouch"),
        ("anode", "anode"),
        ("sep1", "sep"),
        ("cathode", "cathode"),
        ("sep2", "sep"),
        ("anode2", "anode"),
        ("pouch_top", "pouch"),
    ]
    anchors = {}
    for i, (name, kind) in enumerate(layers):
        z = i * gap
        dx = (i - 3) * 0.018  # 계단식으로 조금씩 밀어 층이 겹쳐 보이지 않게
        if kind == "pouch":
            # 성형된 컵 + 실링 플랜지
            box((Lc + 0.034, Wc + 0.026, 0.0012), (dx, 0, z), M["pouch_edge"], "cellx", bevel=0.0004, seg=1)
            box((Lc + 0.004, Wc + 0.004, 0.0055), (dx, 0, z + (0.003 if name == "pouch_bot" else -0.003) * -1 + 0.0), M["pouch"], "cellx", bevel=0.0025, seg=3)
            anchors[name] = (dx - Lc * 0.28, -Wc * 0.2, z + 0.004)
        elif kind == "sep":
            box((Lc + 0.006, Wc + 0.006, 0.0006), (dx, 0, z), M["sep"], "cellx", bevel=0.0002, seg=1)
            anchors[name] = (dx - Lc * 0.36, -Wc * 0.25, z + 0.001)
        else:
            cath = kind == "cathode"
            foil = M["al_foil"] if cath else M["cu"]
            coat = M["ncm"] if cath else M["graphite"]
            box((Lc - 0.004, Wc - 0.004, 0.0003), (dx, 0, z), foil, "cellx", bevel=0.0001, seg=1)
            box((Lc - 0.02, Wc - 0.006, 0.0022), (dx + (0.008 if cath else -0.008), 0, z), coat, "cellx", bevel=0.0005, seg=2)
            # 무지부(코팅 안 된 박) + 탭
            sx = 1 if cath else -1
            box((0.03, 0.04, 0.0003), (dx + sx * (Lc / 2 + 0.012), 0, z), foil, "cellx", bevel=0.0001, seg=1)
            tab = M["al_tab"] if cath else M["ni"]
            box((0.05, 0.036, 0.0009), (dx + sx * (Lc / 2 + 0.045), 0, z), tab, "cellx", bevel=0.0003, seg=1)
            box((0.012, 0.042, 0.0018), (dx + sx * (Lc / 2 + 0.034), 0, z), M["plastic"], "cellx", bevel=0.0004, seg=1)  # 탭 실런트
            anchors[name] = (dx - Lc * 0.2, -Wc * 0.2, z + 0.0015)
            anchors[name + "_tab"] = (dx + sx * (Lc / 2 + 0.06), 0, z)
    return anchors
