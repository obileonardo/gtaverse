"""The Capsa glyph method, vendored. Geometry and compositing helpers copied verbatim from the owner's Capsa icon system
(Capsa/design-references/brand/icons/src: materials.py, heroes.py, ui_glyphs.py, glyph_sets.py and glyphs.py, as of
2 Nov 2026; STYLE.md there is the rule book). Capsa is the owner's own project, so the method is reused here as is.
Do not edit these functions to change a drawing: draw with them in build.py. If Capsa's method changes, copy them again.

The method (Capsa STYLE.md, "UI glyph rules"):
- 20 unit grid, live area 2 to 18. Capsa shows it at 14, 16 and 20 px; this site shows it at 16, 20 and 24 px.
- A glyph is an ordered list of layers: ("w", d) adds a fill, ("k", d) knocks one out, ("s", d[, width[, cap, join]])
  adds a line and ("sk", ...) knocks a line out. They are composited in order through an SVG mask, so a solid can sit
  inside a knock-out and shapes may overlap freely.
- Solid set: things you could hold are filled with their details knocked out; marks are blunt 1.75 bars (SW) with
  small corner radii; chevrons are carets; arrows get filled heads. Bars, stems and gaps are at least 1.5, knock-outs
  at least 1.25.
- Line set: one 1.5 line (LW), round caps and joins, centres within 2.75 and 17.25. Dots and on-states stay filled.
- Every curve is a cubic bezier.
"""
import math

K = 0.5523   # cubic kappa for a quarter circle
LW = 1.5     # the line set's one weight: 1.2 px at 16, 1.5 px at 20, 1.8 px at 24
SW = 1.75    # the solid set's bar: 1.4 px at 16, never heavier than the text beside it


# ---- from src/materials.py
def f(v):
    s = "%.2f" % v
    return s.rstrip("0").rstrip(".") if "." in s else s


def pt(p):
    return f(p[0]) + "," + f(p[1])


def rpoly(pts, r):
    """Closed polygon with every corner rounded by a cubic (r: one radius or one per corner)."""
    n = len(pts)
    rs = r if isinstance(r, (list, tuple)) else [r] * n
    seg = []
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        l1, l2 = math.dist(p0, p1), math.dist(p1, p2)
        ri = min(rs[i], l1 / 2, l2 / 2)
        a = (p1[0] + (p0[0] - p1[0]) * ri / l1, p1[1] + (p0[1] - p1[1]) * ri / l1)
        b = (p1[0] + (p2[0] - p1[0]) * ri / l2, p1[1] + (p2[1] - p1[1]) * ri / l2)
        c1 = (a[0] + (p1[0] - a[0]) * K, a[1] + (p1[1] - a[1]) * K)
        c2 = (b[0] + (p1[0] - b[0]) * K, b[1] + (p1[1] - b[1]) * K)
        seg.append((a, c1, c2, b))
    d = "M" + pt(seg[-1][3])
    for a, c1, c2, b in seg:
        d += " L" + pt(a) + " C" + pt(c1) + " " + pt(c2) + " " + pt(b)
    return d + " Z"


def rrect(x, y, w, h, r):
    return rpoly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], r)


def ellipse(cx, cy, rx, ry=None, ccw=False):
    ry = rx if ry is None else ry
    kx, ky = rx * K, ry * K
    if ccw:   # reverse winding (counter-clockwise on screen), for holes under the nonzero rule
        return ("M%s C%s %s %s C%s %s %s C%s %s %s C%s %s %s Z" % (
            pt((cx + rx, cy)),
            pt((cx + rx, cy - ky)), pt((cx + kx, cy - ry)), pt((cx, cy - ry)),
            pt((cx - kx, cy - ry)), pt((cx - rx, cy - ky)), pt((cx - rx, cy)),
            pt((cx - rx, cy + ky)), pt((cx - kx, cy + ry)), pt((cx, cy + ry)),
            pt((cx + kx, cy + ry)), pt((cx + rx, cy + ky)), pt((cx + rx, cy))))
    return ("M%s C%s %s %s C%s %s %s C%s %s %s C%s %s %s Z" % (
        pt((cx - rx, cy)),
        pt((cx - rx, cy - ky)), pt((cx - kx, cy - ry)), pt((cx, cy - ry)),
        pt((cx + kx, cy - ry)), pt((cx + rx, cy - ky)), pt((cx + rx, cy)),
        pt((cx + rx, cy + ky)), pt((cx + kx, cy + ry)), pt((cx, cy + ry)),
        pt((cx - kx, cy + ry)), pt((cx - rx, cy + ky)), pt((cx - rx, cy))))


def rot(pts, deg, o):
    r = math.radians(deg)
    cs, sn = math.cos(r), math.sin(r)
    return [(o[0] + (x - o[0]) * cs - (y - o[1]) * sn, o[1] + (x - o[0]) * sn + (y - o[1]) * cs) for x, y in pts]


def bar(p0, p1, w):
    """Capsule from p0 to p1, width w (a rounded rectangle along the segment)."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    nx, ny = -dy / L * w / 2, dx / L * w / 2
    ex, ey = dx / L * w / 2, dy / L * w / 2
    pts = [(p0[0] - ex + nx, p0[1] - ey + ny), (p1[0] + ex + nx, p1[1] + ey + ny),
           (p1[0] + ex - nx, p1[1] + ey - ny), (p0[0] - ex - nx, p0[1] - ey - ny)]
    return rpoly(pts, w / 2)


def arc_cubics(cx, cy, r, a0, a1):
    """Cubic segments approximating a circular arc from angle a0 to a1 (degrees, clockwise on screen)."""
    n = max(1, int(math.ceil(abs(a1 - a0) / 90.0)))
    da = (a1 - a0) / n
    out = []
    for i in range(n):
        t0, t1 = math.radians(a0 + i * da), math.radians(a0 + (i + 1) * da)
        k = 4 / 3 * math.tan((t1 - t0) / 4)
        p0 = (cx + r * math.cos(t0), cy + r * math.sin(t0))
        p3 = (cx + r * math.cos(t1), cy + r * math.sin(t1))
        c1 = (p0[0] - k * r * math.sin(t0), p0[1] + k * r * math.cos(t0))
        c2 = (p3[0] + k * r * math.sin(t1), p3[1] - k * r * math.cos(t1))
        out.append((c1, c2, p3))
    return out


def polar(cx, cy, r, a):
    t = math.radians(a)
    return (cx + r * math.cos(t), cy + r * math.sin(t))


def arc_arrow(cx, cy, ro, ri, a0, a1, head=1.0):
    """A thick arc from a0 to a1 with an arrowhead at a1 (clockwise when a1 > a0)."""
    sgn = 1 if a1 > a0 else -1
    band = ro - ri
    hw = band * .55 * head                       # how far the head flares past each edge
    hl = math.degrees(band * 1.25 * head / ((ro + ri) / 2))   # head length as an angle
    ab = a1 - sgn * hl                           # where the head starts
    d = "M" + pt(polar(cx, cy, ro, a0))
    for c1, c2, p3 in arc_cubics(cx, cy, ro, a0, ab):
        d += " C%s %s %s" % (pt(c1), pt(c2), pt(p3))
    d += " L%s L%s L%s L%s" % (pt(polar(cx, cy, ro + hw, ab)), pt(polar(cx, cy, (ro + ri) / 2, a1)),
                               pt(polar(cx, cy, ri - hw, ab)), pt(polar(cx, cy, ri, ab)))
    for c1, c2, p3 in arc_cubics(cx, cy, ri, ab, a0):
        d += " C%s %s %s" % (pt(c1), pt(c2), pt(p3))
    return d + " Z"


# ---- from src/heroes.py
def bubble_path(x, y, w, h, r, tail):
    """Speech card: a rounded rectangle whose bottom edge runs out into a tail at the bottom-left (cubic only)."""
    tx, ty = tail
    x2, y2 = x + w, y + h
    k = r * K
    return ("M%s L%s C%s %s %s L%s C%s %s %s L%s "
            "C%s %s %s C%s %s %s L%s L%s C%s %s %s Z") % (
        pt((x + r, y)), pt((x2 - r, y)), pt((x2 - r + k, y)), pt((x2, y + r - k)), pt((x2, y + r)),
        pt((x2, y2 - r)), pt((x2, y2 - r + k)), pt((x2 - r + k, y2)), pt((x2 - r, y2)),
        pt((x + r * 2.0, y2)),
        pt((x + r * 1.55, y2 + (ty - y2) * .35)), pt((tx + (x + r - tx) * .35, ty - (ty - y2) * .05)), pt((tx, ty)),
        pt((tx + (x + r * .5 - tx) * .4, ty - (ty - y2) * .45)), pt((x + r * .45, y2 - r * .05)), pt((x + r * .1, y2 - r * .55)),
        pt((x, y2 - r * .9)),
        pt((x, y + r)), pt((x, y + r - k)), pt((x + r - k, y)), pt((x + r, y)))


def gear_path(cx, cy, ro, rr, n=8, tip=11, root=19, hole=None):
    import math
    pts, radii = [], []
    for i in range(n):
        th = 90 + i * 360.0 / n
        for a, r_, rad in ((th - root, rr, 8), (th - tip, ro, 10), (th + tip, ro, 10), (th + root, rr, 8)):
            t = math.radians(a)
            pts.append((cx + r_ * math.cos(t), cy + r_ * math.sin(t)))
            radii.append(rad)
    d = rpoly(pts, radii)
    if hole:
        d += " " + ellipse(cx, cy, hole, ccw=True)
    return d


# ---- from src/ui_glyphs.py
def P(*pts):
    return "M" + " L".join(pt(p) for p in pts)


def Z(*pts):
    return P(*pts) + " Z"


def A(cx, cy, r, a0, a1, move=True):
    p0 = (cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0)))
    d = ("M" if move else "L") + pt(p0)
    for c1, c2, p3 in arc_cubics(cx, cy, r, a0, a1):
        d += " C%s %s %s" % (pt(c1), pt(c2), pt(p3))
    return d


def star4(cx, cy, R, k=.16):
    t, r_, b, l = (cx, cy - R), (cx + R, cy), (cx, cy + R), (cx - R, cy)
    q = R * k
    return "M%s C%s %s %s C%s %s %s C%s %s %s C%s %s %s Z" % (
        pt(t), pt((cx + q, cy - q)), pt((cx + q, cy - q)), pt(r_), pt((cx + q, cy + q)), pt((cx + q, cy + q)), pt(b),
        pt((cx - q, cy + q)), pt((cx - q, cy + q)), pt(l), pt((cx - q, cy - q)), pt((cx - q, cy - q)), pt(t))


def star5(cx, cy, ro, ri):
    pts = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        r_ = ro if i % 2 == 0 else ri
        pts.append((cx + r_ * math.cos(a), cy + r_ * math.sin(a)))
    return pts


def chevron(direction, cx=10, cy=10, s=4.5):
    h = s / 2
    return {"down": P((cx - s, cy - h), (cx, cy + h), (cx + s, cy - h)), "up": P((cx - s, cy + h), (cx, cy - h), (cx + s, cy + h)),
            "left": P((cx + h, cy - s), (cx - h, cy), (cx + h, cy + s)), "right": P((cx - h, cy - s), (cx + h, cy), (cx - h, cy + s))}[direction]


def S(*ds, w=LW):
    return [("s", d, w) for d in ds]


def person(cx, top, w, r):
    """A head and shoulders (the user-round silhouette) centred on cx: head radius r, shoulders w wide, feet on 17.5."""
    hw = w / 2
    sh = top + 2 * r + 1.5   # the shoulder line, 1.5 below the chin (user-round: 6.5 + 3.75 + 1.5)
    return [("w", ellipse(cx, top + r, r)),
            ("w", "M%s,17.5 C%s,%s %s,%s %s,%s C%s,%s %s,%s %s,17.5 Z" % (
                f(cx - hw), f(cx - hw), f(sh + (17.5 - sh) * .4), f(cx - hw * .55), f(sh), f(cx), f(sh),
                f(cx + hw * .55), f(sh), f(cx + hw), f(sh + (17.5 - sh) * .4), f(cx + hw)))]


def shoulders(cx, sh, w, base=17.5):
    """The open curve of a person's shoulders (the line set's user-round), centred on cx."""
    hw = w / 2
    return "M%s,%s C%s,%s %s,%s %s,%s C%s,%s %s,%s %s,%s" % (
        f(cx - hw), f(base), f(cx - hw), f(sh + (base - sh) * .4), f(cx - hw * .55), f(sh), f(cx), f(sh),
        f(cx + hw * .55), f(sh), f(cx + hw), f(sh + (base - sh) * .4), f(cx + hw), f(base))


def round_tip(a, tip, b, r=.6):
    """Two edges meeting at tip, the corner rounded by r: 'L…' segments to append to a path that ends at a."""
    ua = ((tip[0] - a[0]) / math.dist(a, tip), (tip[1] - a[1]) / math.dist(a, tip))
    ub = ((b[0] - tip[0]) / math.dist(tip, b), (b[1] - tip[1]) / math.dist(tip, b))
    p0 = (tip[0] - ua[0] * r, tip[1] - ua[1] * r)
    p1 = (tip[0] + ub[0] * r, tip[1] + ub[1] * r)
    return " L%s C%s %s %s" % (pt(p0), pt((tip[0] - ua[0] * r * .45, tip[1] - ua[1] * r * .45)),
                               pt((tip[0] + ub[0] * r * .45, tip[1] + ub[1] * r * .45)), pt(p1))


def bubble_round(cx, cy, r, a0, a1, tip, rr=.6):
    """A round speech bubble: the circle from angle a0 the long way round to a1, then a tail to tip (corner rounded)."""
    p_end = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
    p_start = (cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0)))
    return A(cx, cy, r, a0, a1) + round_tip(p_end, tip, p_start, rr) + " Z"


def mirror(d, axis=10):
    """A path flipped left to right about x = axis (absolute M/L/C commands with x,y pairs only)."""
    import re
    return re.sub(r"(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)", lambda m: "%s,%s" % (f(2 * axis - float(m.group(1))), m.group(2)), d)


def page():
    """A sheet with a dog-eared corner (solid), the crease knocked out."""
    return [("w", rpoly([(4, 2.5), (11.25, 2.5), (16, 7.25), (16, 17.5), (4, 17.5)], [1.75, .4, .4, 1.75, 1.75])),
            ("sk", P((11.25, 2.75), (11.25, 7.25), (15.75, 7.25)), 1.25)]


def frame_image(x=2.5, y=3.5, w=15, h=13):
    sx, sy = w / 15, h / 13
    m = lambda px, py: (x + (px - 2.5) * sx, y + (py - 3.5) * sy)
    return [("w", rrect(x, y, w, h, 2.25)),
            ("k", rpoly([m(4.75, 14.5), m(8.5, 9.5), m(11, 12.5), m(12.75, 10.75), m(15.25, 14.5)], .5)),
            ("k", ellipse(*m(13, 7.25), 1.4))]


def shield():
    return ("M10,2.5 C12.4,3.9 14.5,4.5 16.5,4.5 L16.5,9.5 C16.5,13.4 13.6,16.2 10,17.5 "
            "C6.4,16.2 3.5,13.4 3.5,9.5 L3.5,4.5 C5.5,4.5 7.6,3.9 10,2.5 Z")


def speaker():
    return ("w", rpoly([(2.5, 7.5), (5.75, 7.5), (10, 3.75), (10, 16.25), (5.75, 12.5), (2.5, 12.5)], [1, .5, .6, .6, .5, 1]))


def bubble():
    return ("w", bubble_path(2, 2.5, 16, 12.5, 3.5, (3.5, 18)))


# ---- from src/glyph_sets.py
def pl(pts, w=SW, r=.45, ext=0.0, miter=2.4):
    """A filled bar along an open polyline: mitred joins, blunt (butt) ends pushed out by ext, corners rounded by r.
    The solid family's answer to a stroke: a shape with the set's corner language, not a round-capped line."""
    h = w / 2
    dirs = []
    for a, b in zip(pts, pts[1:]):
        L = math.dist(a, b)
        dirs.append(((b[0] - a[0]) / L, (b[1] - a[1]) / L))
    nrm = [(-dy, dx) for dx, dy in dirs]
    left, right = [], []
    p0, d0, n0 = pts[0], dirs[0], nrm[0]
    s = (p0[0] - d0[0] * ext, p0[1] - d0[1] * ext)
    left.append((s[0] + n0[0] * h, s[1] + n0[1] * h)); right.append((s[0] - n0[0] * h, s[1] - n0[1] * h))
    for i in range(1, len(pts) - 1):
        na, nb = nrm[i - 1], nrm[i]
        m = (na[0] + nb[0], na[1] + nb[1]); ml = math.hypot(*m); m = (m[0] / ml, m[1] / ml)
        k = h / max(1e-6, m[0] * na[0] + m[1] * na[1])
        p = pts[i]
        if k / h <= miter:
            left.append((p[0] + m[0] * k, p[1] + m[1] * k)); right.append((p[0] - m[0] * k, p[1] - m[1] * k))
        else:   # bevel the outside of a sharp turn
            cross = dirs[i - 1][0] * dirs[i][1] - dirs[i - 1][1] * dirs[i][0]
            inner = (p[0] - m[0] * k, p[1] - m[1] * k) if cross > 0 else (p[0] + m[0] * k, p[1] + m[1] * k)
            if cross > 0:   # turning right on screen: the outside is the left side
                left += [(p[0] + na[0] * h, p[1] + na[1] * h), (p[0] + nb[0] * h, p[1] + nb[1] * h)]; right.append(inner)
            else:
                right += [(p[0] - na[0] * h, p[1] - na[1] * h), (p[0] - nb[0] * h, p[1] - nb[1] * h)]; left.append(inner)
    pn, dn, nn = pts[-1], dirs[-1], nrm[-1]
    e = (pn[0] + dn[0] * ext, pn[1] + dn[1] * ext)
    left.append((e[0] + nn[0] * h, e[1] + nn[1] * h)); right.append((e[0] - nn[0] * h, e[1] - nn[1] * h))
    return rpoly(left + right[::-1], r)


def W(*ds):
    return [("w", d) for d in ds]


def bars(*polys, w=SW, ext=0.0):
    return [("w", pl(p, w, ext=ext)) for p in polys]


def tri(pts, r=.8):
    return ("w", rpoly(pts, r))


def band(d, w=SW):
    """A curved bar: the path stroked with blunt ends and mitred joins (used only where the bar must bend)."""
    return ("s", d, w, "butt", "miter")


def bandk(d, w):
    return ("sk", d, w, "butt", "miter")


def shell(outer, inner):
    """A filled silhouette with its middle knocked out: a toggle's off-state inside the solid set."""
    return [("w", outer), ("k", inner)]


def head(tip, direction, length=4.5, width=9.0, r=.8):
    """A filled arrowhead (rounded triangle) with its tip at tip, pointing along direction (a unit vector)."""
    dx, dy = direction
    bx, by = tip[0] - dx * length, tip[1] - dy * length
    nx, ny = -dy * width / 2, dx * width / 2
    return ("w", rpoly([tip, (bx + nx, by + ny), (bx - nx, by - ny)], [r * .9, r, r]))


def caret(direction, cx=10, cy=10, w=9.5, h=5.25):
    hw, hh = w / 2, h / 2
    pts = {"down": [(cx - hw, cy - hh), (cx + hw, cy - hh), (cx, cy + hh)],
           "up": [(cx - hw, cy + hh), (cx, cy - hh), (cx + hw, cy + hh)],
           "left": [(cx + hh, cy - hw), (cx + hh, cy + hw), (cx - hh, cy)],
           "right": [(cx - hh, cy - hw), (cx + hh, cy), (cx - hh, cy + hw)]}[direction]
    return ("w", rpoly(pts, [.9, .9, 1.1] if direction != "up" else [.9, 1.1, .9]))


def rbar(x, y, w, h=SW, r=.5):
    return ("w", rrect(x, y, w, h, r))


def crescent(c1, r1, c2, r2):
    """Outline of circle 1 minus circle 2 (they must intersect): the long arc of 1, then the short arc of 2 back."""
    (x1, y1), (x2, y2) = c1, c2
    d = math.dist(c1, c2)
    a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    hh = math.sqrt(max(0, r1 * r1 - a * a))
    ux, uy = (x2 - x1) / d, (y2 - y1) / d
    mx, my = x1 + ux * a, y1 + uy * a
    p, q = (mx - uy * hh, my + ux * hh), (mx + uy * hh, my - ux * hh)
    ang = lambda c, pnt: math.degrees(math.atan2(pnt[1] - c[1], pnt[0] - c[0]))
    a1p, a1q = ang(c1, p), ang(c1, q)
    # long way round circle 1 from p to q (away from circle 2)
    if (a1q - a1p) % 360 < 180:
        a1q -= 360 if a1q > a1p else 0
    else:
        a1q += 360 if a1q < a1p else 0
    a2q, a2p = ang(c2, q), ang(c2, p)
    # short way on circle 2 from q back to p
    diff = (a2p - a2q + 540) % 360 - 180
    return A(x1, y1, r1, a1p, a1q) + " " + A(x2, y2, r2, a2q, a2q + diff, move=False) + " Z"


def dot(x, y, r=1.0):
    return ("w", ellipse(x, y, r))


def sline(*ds, w=LW):
    return [("s", d, w) for d in ds]


def tray_solid():
    return ("w", rrect(2.75, 13.25, 14.5, 4.25, 1.5))


def page_line():
    return [("s", rpoly([(4.25, 2.75), (11.25, 2.75), (15.75, 7.25), (15.75, 17.25), (4.25, 17.25)], [1.75, .5, .5, 1.75, 1.75])),
            ("s", P((11, 3), (11, 7.5), (15.5, 7.5)))]


def frame_image_line(x=2.75, y=3.25, w=14.5, h=13.5):
    sx, sy = w / 14.5, h / 13.5
    m = lambda px, py: pt((x + (px - 2.75) * sx, y + (py - 3.25) * sy))
    return [("s", rrect(x, y, w, h, 2.25)),
            ("s", "M%s L%s C%s %s %s L%s" % (m(17, 13.25), m(14.45, 10.7), m(13.85, 10.1), m(12.9, 10.1), m(12.3, 10.7), m(5.5, 16.5))),
            ("s", ellipse(*[float(v) for v in m(7.5, 7.75).split(",")], 1.4 * min(sx, sy)))]


def shield_line():
    return ("M10,3 C12.3,4.3 14.3,4.85 16.25,4.85 L16.25,9.6 C16.25,13.2 13.5,15.85 10,17.1 "
            "C6.5,15.85 3.75,13.2 3.75,9.6 L3.75,4.85 C5.7,4.85 7.7,4.3 10,3 Z")


def bubble_line():
    return ("s", bubble_path(2.75, 3, 14.5, 11.25, 3.25, (3.75, 17.25)))


# ---- from src/glyphs.py
def mask_paths(layers, invert=False):
    """The glyph's layers as mask content: adds white and knock-outs black, or the reverse with invert=True."""
    add, ko = ("#000", "#fff") if invert else ("#fff", "#000")
    m = ""
    for layer in layers:
        k, d = layer[0], layer[1]
        if k in ("w", "k"):
            m += '<path d="%s" fill="%s"/>' % (d, add if k == "w" else ko)
        else:   # "s" line, "sk" knock-out line
            w = layer[2] if len(layer) > 2 else 1.5
            cap, join = (layer[3], layer[4]) if len(layer) > 4 else ("round", "round")
            m += ('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="%s" stroke-linejoin="%s"/>'
                  % (d, add if k == "s" else ko, ("%.2f" % w).rstrip("0").rstrip("."), cap, join))
    return m
