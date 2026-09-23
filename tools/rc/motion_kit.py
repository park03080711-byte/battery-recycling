"""공정 재생 공통 도구 (Blender 쪽) — 01 재제조(tools/rm/animate.py)에서 만든 방식을 02~04 지도가 함께 쓰도록 정리.

장면 모듈(build)을 받아 render.py와 똑같이 카메라를 잡고,
- 흐름선 좌표(화면 %)
- 클린 배경(움직이는 부품을 뺀 영역만 다시 렌더) · 해당 설비 마스크
- 가림 마스크(바닥 · 판 · 흐름선을 뺀 물체의 알파 → 흐름선이 설비 뒤로 숨게)
- 설비 동작 클립(움직이는 것만 보이고 나머지는 holdout)
을 만든다. 카메라가 원래 장면과 같아야 하므로, 추가 물체는 카메라를 잡은 뒤에 만든다.
"""
import os, sys, math, time, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "anatomy"))
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
import plant as PL
import scene as S
from plant import L


class Kit:
    def __init__(self, build, W=2800, margin=0.035):
        S.reset()
        self.anchors = build()
        PL.lights()
        r = Vector((-1, 1, 0)).normalized()
        t = Vector((-1, -1, 2)).normalized()
        bpy.context.view_layer.update()
        xs, ys = [], []
        for o in bpy.context.scene.objects:
            if o.type in ("MESH", "CURVE") and o.name != "floor":
                for c in o.bound_box:
                    p = o.matrix_world @ Vector(c)
                    xs.append(p.dot(r))
                    ys.append(p.dot(t))
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        wx, wy = x1 - x0, y1 - y0
        wx *= 1 + 2 * margin
        wy = wy + wx * margin * 2
        self.W = W
        self.H = int(round(W * wy / wx / 2) * 2)
        self.cam = PL.iso_camera(r * ((x0 + x1) / 2) + t * ((y0 + y1) / 2), wx)
        bpy.context.view_layer.update()
        S.render_setup(W, self.H, 48, transparent=True)
        sc = self.sc = bpy.context.scene
        sc.view_settings.view_transform = "Standard"
        sc.view_settings.look = "None"
        sc.view_settings.exposure = 0.0
        sc.cycles.max_bounces = 6
        self.floor = bpy.data.objects["floor"]
        self.meta = {"w": W, "h": self.H}
        print("[K] size", W, self.H, flush=True)

    # ── 좌표 ──
    def cam_xy(self, p):
        c = world_to_camera_view(self.sc, self.cam, Vector(p))
        return c.x, c.y

    def pct(self, u, v, z):
        x, y = self.cam_xy(L(u, v, z))
        return [round(x * 100, 3), round((1 - y) * 100, 3)]

    def border_of(self, bb, pad=0.006):
        u0, u1, v0, v1, z0, z1 = bb
        pts = [self.cam_xy(L(u, v, z)) for u in (u0, u1) for v in (v0, v1) for z in (z0, z1)]
        return (max(0.0, min(p[0] for p in pts) - pad), min(1.0, max(p[0] for p in pts) + pad),
                max(0.0, min(p[1] for p in pts) - pad), min(1.0, max(p[1] for p in pts) + pad))

    def set_border(self, b):
        sc = self.sc
        sc.render.resolution_x, sc.render.resolution_y = self.W, self.H
        sc.render.use_border = True
        sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_max_x = b[0], b[1]
        sc.render.border_min_y, sc.render.border_max_y = b[2], b[3]

    @staticmethod
    def box_pct(b):
        return [round(b[0] * 100, 4), round((1 - b[3]) * 100, 4), round((b[1] - b[0]) * 100, 4), round((b[3] - b[2]) * 100, 4)]

    def shot(self, path):
        self.sc.render.filepath = path
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        print("[K]", os.path.relpath(path), round(time.time() - t0, 1), "s", flush=True)

    def quick(self, on=True):
        """마스크용: 4샘플 · 잡음 제거 끔"""
        c = self.sc.cycles
        c.samples = 4 if on else 48
        c.use_denoising = not on
        c.use_adaptive_sampling = not on

    # ── 경로 ──
    def routes(self, routes, Z0):
        """routes: [[(id|None, u, v[, z]), ...], ...] — 첫 경로는 입구부터, 나머지는 갈림점부터. z를 빼면 바닥(Z0)"""
        pt = lambda e: self.pct(e[1], e[2], e[3] if len(e) > 3 else Z0)
        self.meta["routes"] = [{"pts": [pt(e) for e in r], "stops": {e[0]: i for i, e in enumerate(r) if e[0]}} for r in routes]

    # ── 클린 배경 · 마스크 · 가림 마스크 ──
    def plate(self, name, hide, bb, out, pad=0.02):
        for o in hide:
            o.hide_render = True
        b = self.border_of(bb, pad)
        self.set_border(b)
        self.sc.cycles.samples = 48
        self.shot(f"{out}/plate_{name}.png")
        self.meta.setdefault("plates", {})[name] = {"box": self.box_pct(b)}
        for o in hide:
            o.hide_render = False

    def mask(self, grp, hide, out):
        sc = self.sc
        sc.render.use_border = False
        sc.render.resolution_x, sc.render.resolution_y = self.W, self.H
        self.quick(True)
        self.floor.hide_render = True
        for o in hide:
            o.hide_render = True
        for o in sc.objects:
            if o.get("grp") is not None:
                o.is_holdout = o["grp"] != grp
        self.shot(f"{out}/mask_{grp}.png")
        for o in sc.objects:
            o.is_holdout = False
        for o in hide:
            o.hide_render = False
        self.floor.hide_render = False
        self.quick(False)

    def occ(self, out, skip=("plat", "lane"), w=1400, flat=0.08):
        """flat: 두께가 이보다 얇은 물체(도로 · 바닥 줄눈 · 점선)는 가리지 않음"""
        sc = self.sc
        sc.render.use_border = False
        sc.render.resolution_x, sc.render.resolution_y = w, round(self.H * w / self.W)
        self.quick(True)
        self.floor.hide_render = True
        bpy.context.view_layer.update()

        def thin(o):
            if o.type != "MESH":
                return False
            zs = [(o.matrix_world @ Vector(c)).z for c in o.bound_box]
            return max(zs) - min(zs) < flat
        hid = [o for o in sc.objects if o.get("grp") in skip or thin(o)]
        for o in hid:
            o.hide_render = True
        self.shot(f"{out}/occ.png")
        for o in hid:
            o.hide_render = False
        self.floor.hide_render = False
        self.quick(False)

    # ── 설비 동작 클립 ──
    def clips(self, defs, extra, out, samples=24, only=None):
        """defs: {key: dict(n, pose(f) -> 보일 물체 목록, bb, step)} / extra: 평소엔 숨겨 두는 추가 물체"""
        sc = self.sc
        self.floor.hide_render = True
        sc.cycles.samples = samples
        self.meta.setdefault("clips", {})
        for key, d in defs.items():
            if only and key not in only:
                continue
            b = self.border_of(d["bb"])
            self.set_border(b)
            os.makedirs(f"{out}/{key}", exist_ok=True)
            for f in range(d["n"]):
                for o in extra:
                    o.hide_render = True
                if d.get("reset"):
                    d["reset"]()
                vis = set(d["pose"](f))
                for o in sc.objects:
                    if o.type in ("MESH", "CURVE") and o is not self.floor:
                        o.is_holdout = o not in vis
                self.shot(f"{out}/{key}/{f:03d}.png")
            self.meta["clips"][key] = {"box": self.box_pct(b), "frames": d["n"], "step": d.get("step", key), "rest": bool(d.get("rest"))}
            if d.get("carry"):
                self.meta["clips"][key]["carry"] = d["carry"]  # 이 프레임 구간 동안 빛 점이 다음 꼭짓점까지 함께 이동
        for o in sc.objects:
            o.is_holdout = False
        self.floor.hide_render = False

    def save(self, out):
        path = f"{out}/motion_meta.json"
        old = json.load(open(path)) if os.path.exists(path) else {}
        for k in ("clips", "plates"):
            if k in old and k in self.meta:
                old[k].update(self.meta[k])
                self.meta[k] = old[k]
        old.update(self.meta)
        json.dump(old, open(path, "w"), indent=1)


# ── 움직임 도우미 ──
def ease(x):
    x = min(1.0, max(0.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def lerp(a, b, x):
    return a + (b - a) * x


def seg(f, a, b):
    return ease((f - a) / (b - a))


def new_objs(fn):
    before = set(bpy.context.scene.objects)
    fn()
    return [o for o in bpy.context.scene.objects if o not in before]


def along(path, x):
    d = [math.dist(a, b) for a, b in zip(path, path[1:])]
    s = min(max(x, 0.0), 1.0) * sum(d)
    for (a, b), l in zip(zip(path, path[1:]), d):
        if s <= l:
            k = s / l
            return tuple(a[i] + (b[i] - a[i]) * k for i in range(3))
        s -= l
    return path[-1]


def mover(objs):
    """물체 묶음을 원래 자리 기준으로 옮기는 함수를 돌려준다 (u, v, z 차이)"""
    base = {o.name: o.location.copy() for o in objs}

    def move(du, dv, dz):
        for o in objs:
            b = base[o.name]
            o.location = (b.x + dv, b.y + du, b.z + dz)
    return move
