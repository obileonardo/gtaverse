#!/usr/bin/env python3
"""The Vice Files icon family: one set of original glyphs in GTA VI's map blip and HUD language, drawn with the owner's
Capsa glyph method (capsa.py, copied from Capsa/design-references/brand/icons). Rules and the style spec: docs/ICONS.md.
The map blip layer and its plate system live in gta.py (round 2); this file holds the other drawings and the output.

    python3 scripts/icons/build.py                 writes src/icons/family.ts (generated, never edit it by hand)
    python3 scripts/icons/build.py --sheet x.html  also writes a quick contact sheet for review outside the site

Standard library only. Every glyph has a Solid drawing (the default) and a Line drawing (the setting), on the
20 unit grid; map blips also get a plate and a pin drawing. The build checks the live area, that every old icon name in src/components/ui/icons.ts still resolves,
that every category in content/categories.json has a glyph, and that no text has an em or en dash.

Nothing here copies a Rockstar file or icon: every shape is drawn from scratch with the helpers below.
"""
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from capsa import (A, LW, P, S, SW, W, Z, arc_arrow, band, bar, bars, bubble, bubble_line, bubble_path, caret,  # noqa: E402
                   chevron, crescent, dot, ellipse, f, frame_image, frame_image_line, head, mask_paths, page, page_line,
                   person, pl, pt, rbar, rot, rpoly, rrect, shield, shield_line, shoulders, sline, speaker,
                   star4, tray_solid, mirror)
import gta  # noqa: E402  the round 2 blip layer and its plate system

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "src", "icons", "family.ts")
OLD = os.path.join(ROOT, "src", "components", "ui", "icons.ts")
CATEGORIES = os.path.join(ROOT, "content", "categories.json")

CONFIG = {
    "source": "Capsa glyph method (Capsa/design-references/brand/icons, STYLE.md 'UI glyph rules'), vendored in scripts/icons/capsa.py",
    "grid": 20,
    "liveArea": [2, 18],
    "lineCentres": [2.75, 17.25],
    "lineWeight": LW,
    "solidBar": SW,
    "minKnockOut": 1.25,
    "minGap": 1.5,
    "sizes": [16, 20, 24],
    "previewSizes": [16, 20, 24, 32],
    "defaultSet": "solid",
}


# ------------------------------------------------------------------------------------------------ new helpers
def seal(cx, cy, ro, ri, n=8, r=1.5):
    """A scalloped badge (a rosette): 2n points alternating ro and ri, every corner rounded by r."""
    pts = []
    for i in range(2 * n):
        a = math.radians(-90 + i * 180.0 / n)
        rr = ro if i % 2 == 0 else ri
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return rpoly(pts, r)


def line_head(tip, direction, length=2.9, spread=42):
    """The line set's arrowhead: two short strokes back from tip, spread degrees either side of the shaft."""
    dx, dy = direction
    L = math.hypot(dx, dy)
    dx, dy = dx / L, dy / L
    out = []
    for s in (spread, -spread):
        a = math.radians(s)
        # the back vector (-dx, -dy) turned by s degrees
        rx = -dx * math.cos(a) + dy * math.sin(a)
        ry = -dx * math.sin(a) - dy * math.cos(a)
        out.append((tip[0] + rx * length, tip[1] + ry * length))
    return P(out[0], tip, out[1])


def hb(x0, x1, y, w=SW):
    """A horizontal solid bar from x0 to x1, centred on y."""
    return rbar(x0, y - w / 2, x1 - x0, w)


def vb(x, y0, y1, w=SW):
    """A vertical solid bar from y0 to y1, centred on x."""
    return ("w", rrect(x - w / 2, y0, w, y1 - y0, .5))


def kline(d, w=1.25):
    """A knocked-out line with blunt ends (detail cut into a solid)."""
    return ("sk", d, w, "butt", "miter")


# ------------------------------------------------------------------------------------------------ Capsa glyphs reused
# Drawings copied as they are from Capsa (ui_glyphs.py, glyph_sets.py, glyphs.py) for marks and controls whose meaning is
# universal. Reusing them keeps the shared controls identical to the owner's other projects.
def capsa_reused():
    s, l = {}, {}
    U, D, Lf, R = (0, -1), (0, 1), (-1, 0), (1, 0)
    # marks
    s["close"] = bars([(5, 5), (15, 15)], [(15, 5), (5, 15)], ext=.35)
    l["close"] = S(P((5, 5), (15, 15)), P((15, 5), (5, 15)))
    s["plus"] = [rbar(9.125, 3.75, SW, 12.5), rbar(3.75, 9.125, 12.5)]
    l["plus"] = S(P((10, 4), (10, 16)), P((4, 10), (16, 10)))
    s["check"] = bars([(3.75, 10.25), (8, 14.5), (16.5, 5.25)])
    l["check"] = S(P((4, 10.5), (8, 14.5), (16, 5.75)))
    # lists and views
    s["list"] = [("w", rrect(2.75, y - 1.4, 2.8, 2.8, .7)) for y in (4.75, 10, 15.25)] + [hb(7.5, 17.25, y) for y in (4.75, 10, 15.25)]
    l["list"] = [("w", ellipse(4.25, y, 1.15)) for y in (5, 10, 15)] + S(*[P((7.75, y), (16.5, y)) for y in (5, 10, 15)])
    s["grid"] = W(*[rrect(x, y, 6.75, 6.75, 1.25) for x in (2.5, 10.75) for y in (2.5, 10.75)])
    l["grid"] = S(*[rrect(x, y, 5.75, 5.75, 1.4) for x in (3, 11.25) for y in (3, 11.25)])
    s["layers"] = [("w", rpoly([(10, 2.5), (17.5, 6.5), (10, 10.5), (2.5, 6.5)], .9))] + \
        S(P((2.75, 10.25), (10, 14.1), (17.25, 10.25)), P((2.75, 13.75), (10, 17.6), (17.25, 13.75)), w=1.6)
    l["layers"] = S(rpoly([(10, 3), (17.25, 6.75), (10, 10.5), (2.75, 6.75)], .8), P((2.75, 10.25), (10, 14), (17.25, 10.25)),
                    P((2.75, 13.75), (10, 17.5), (17.25, 13.75)))
    s["filter"] = [("w", rrect(2.5, 5, 15, 2, 1)), ("k", ellipse(7, 6, 3.75)), ("w", ellipse(7, 6, 2.75)),
                   ("w", rrect(2.5, 13, 15, 2, 1)), ("k", ellipse(13, 14, 3.75)), ("w", ellipse(13, 14, 2.75))]
    l["filter"] = sline(P((2.75, 6), (17.25, 6))) + [("k", ellipse(7, 6, 3.4)), ("s", ellipse(7, 6, 2.1))] + \
        sline(P((2.75, 14), (17.25, 14))) + [("k", ellipse(13, 14, 3.4)), ("s", ellipse(13, 14, 2.1))]
    s["search"] = [("w", ellipse(8.5, 8.5, 6.25)), ("k", ellipse(8.5, 8.5, 4.25)), ("w", bar((13, 13), (16.75, 16.75), 2.75))]
    l["search"] = sline(ellipse(8.6, 8.6, 5.6), P((12.85, 12.85), (17, 17)))
    s["rotate"] = [("w", arc_arrow(10, 10.25, 7.4, 5.65, 15, 330, 1.9))]
    l["rotate"] = S(A(10, 10.5, 6.75, 0, 315) + " L16.5,8", P((16.5, 3.75), (16.5, 8), (12.25, 8)))
    # sharing
    s["share"] = [("w", rpoly([(3.5, 7.75), (7, 7.75), (7, 12.25), (13, 12.25), (13, 7.75), (16.5, 7.75), (16.5, 17.5), (3.5, 17.5)],
                              [2, .6, .6, .6, .6, 2, 2.25, 2.25])),
                  rbar(9.125, 5.75, SW, 7.75), head((10, 2), U, 4.75, 8.75)]
    l["share"] = S("M4,10 L4,15 C4,16.1 4.9,17 6,17 L14,17 C15.1,17 16,16.1 16,15 L16,10", P((10, 3), (10, 12)), P((6.5, 6.5), (10, 3), (13.5, 6.5)))
    s["link"] = [("s", rpoly(rot([(2.5, 10.25), (11.5, 10.25), (11.5, 14.75), (2.5, 14.75)], -45, (7, 12.5)), 2.25), 2.1),
                 ("s", rpoly(rot([(8.5, 5.25), (17.5, 5.25), (17.5, 9.75), (8.5, 9.75)], -45, (13, 7.5)), 2.25), 2.1)]
    l["link"] = S(rpoly(rot([(2.5, 10.25), (11.5, 10.25), (11.5, 14.75), (2.5, 14.75)], -45, (7, 12.5)), 2.25),
                  rpoly(rot([(8.5, 5.25), (17.5, 5.25), (17.5, 9.75), (8.5, 9.75)], -45, (13, 7.5)), 2.25))
    s["copy"] = [("w", rrect(2.5, 2.5, 10.5, 10.5, 2.25)), ("k", rrect(5.75, 5.75, 13, 13, 3.25)), ("w", rrect(7.25, 7.25, 10.25, 10.25, 2.25))]
    l["copy"] = S(rrect(7, 7, 10, 10, 2), "M4.75,13 C3.8,13 3,12.2 3,11.25 L3,4.75 C3,3.8 3.8,3 4.75,3 L11.25,3 C12.2,3 13,3.8 13,4.75")
    s["download"] = [tray_solid(), ("k", rpoly([(4.25, 8.25), (15.75, 8.25), (10, 15.5)], 1)), rbar(9.125, 2.5, SW, 7), head((10, 13.75), D, 5.5, 9.5)]
    l["download"] = S(P((10, 3), (10, 12.5)), P((6.25, 8.75), (10, 12.5), (13.75, 8.75)),
                      "M3.5,12.75 L3.5,15 C3.5,16.1 4.4,17 5.5,17 L14.5,17 C15.6,17 16.5,16.1 16.5,15 L16.5,12.75")
    s["external-link"] = [("w", rrect(2.75, 5, 12.25, 12.25, 2.25)), ("k", rpoly([(8.5, 3.5), (19, 3.5), (19, 13.5), (11.25, 13.5), (8.5, 10.75)], 1.5)),
                          ("w", rpoly([(17, 3), (17, 10), (10, 3)], [.9, .9, .9]))] + bars([(14, 6), (8.25, 11.75)])
    l["external-link"] = S("M15,11.5 L15,15 C15,16.1 14.1,17 13,17 L5,17 C3.9,17 3,16.1 3,15 L3,7 C3,5.9 3.9,5 5,5 L8.5,5",
                           P((9.25, 10.75), (16.5, 3.5)), P((12, 3.5), (16.5, 3.5), (16.5, 8)))
    s["arrow-up-right"] = bars([(4.25, 15.75), (12, 8)]) + [("w", rpoly([(16.5, 3.5), (16.5, 13), (7, 3.5)], [.9, .9, .9]))]
    l["arrow-up-right"] = S(P((5.5, 14.5), (14.5, 5.5)), P((7, 5.5), (14.5, 5.5), (14.5, 13)))
    # directions
    s["arrow-down"] = [rbar(9.125, 3, SW, 9.5), head((10, 16.75), D, 6, 10.5)]
    s["arrow-up"] = [rbar(9.125, 7.5, SW, 9.5), head((10, 3.25), U, 6, 10.5)]
    s["arrow-left"] = [rbar(7.5, 9.125, 9.5), head((3.25, 10), Lf, 6, 10.5)]
    s["arrow-right"] = [rbar(3, 9.125, 9.5), head((16.75, 10), R, 6, 10.5)]
    arrows = {"down": [P((10, 3.5), (10, 16.5)), P((5, 11.5), (10, 16.5), (15, 11.5))],
              "up": [P((10, 16.5), (10, 3.5)), P((5, 8.5), (10, 3.5), (15, 8.5))],
              "left": [P((16.5, 10), (3.5, 10)), P((8.5, 5), (3.5, 10), (8.5, 15))],
              "right": [P((3.5, 10), (16.5, 10)), P((11.5, 5), (16.5, 10), (11.5, 15))]}
    for d in ("up", "down", "left", "right"):
        l["arrow-" + d] = S(*arrows[d])
        s["chevron-" + d] = [caret(d)]
        l["chevron-" + d] = S(chevron(d))
    # media and sound
    s["play"] = [("w", rpoly([(6, 3.5), (16.25, 10), (6, 16.5)], 1.5))]
    l["play"] = sline(rpoly([(6.25, 4), (16, 10), (6.25, 16)], 1.25))
    s["pause"] = [("w", rrect(5, 4, 3.5, 12, 1.1)), ("w", rrect(11.5, 4, 3.5, 12, 1.1))]
    l["pause"] = sline(rrect(5.25, 4.25, 3, 11.5, 1), rrect(11.75, 4.25, 3, 11.5, 1))
    spk = ("s", rpoly([(3, 7.75), (6, 7.75), (9.75, 4.5), (9.75, 15.5), (6, 12.25), (3, 12.25)], [1, .5, .6, .6, .5, 1]))
    s["sound-on"] = [speaker()] + S(A(10, 10, 3.25, -50, 50), A(10, 10, 6.5, -52, 52))
    l["sound-on"] = [spk] + sline(A(10, 10, 3.25, -50, 50), A(10, 10, 6.5, -52, 52))
    s["sound-off"] = [speaker()] + S(P((12.75, 7.75), (17.25, 12.25)), P((17.25, 7.75), (12.75, 12.25)))
    l["sound-off"] = [spk] + sline(P((12.75, 7.75), (17, 12)), P((17, 7.75), (12.75, 12)))
    s["clip"] = [("w", rrect(2.5, 2.5, 15, 15, 3.75)), ("k", rpoly([(8, 6.25), (13.75, 10), (8, 13.75)], .8))]
    l["clip"] = sline(rrect(2.75, 2.75, 14.5, 14.5, 3.5), rpoly([(8.25, 6.75), (13.25, 10), (8.25, 13.25)], .6))
    s["image"] = frame_image()
    l["image"] = frame_image_line()
    s["article"] = page() + [("k", rrect(6.5, 10.5, 7, 1.3, .65)), ("k", rrect(6.5, 13.25, 5, 1.3, .65))]
    l["article"] = page_line() + sline(P((7, 11), (13, 11)), P((7, 14), (11, 14)))
    s["chat"] = [bubble()]
    l["chat"] = [bubble_line()]
    # theme
    rays = []
    for a in range(0, 360, 45):
        c, s_ = math.cos(math.radians(a)), math.sin(math.radians(a))
        rays.append(("w", pl([(10 + 6 * c, 10 + 6 * s_), (10 + 8.1 * c, 10 + 8.1 * s_)], 1.9, r=.5)))
    s["theme-light"] = [("w", ellipse(10, 10, 4.1))] + rays
    l["theme-light"] = S(ellipse(10, 10, 3.25), *[P((10 + 5.6 * math.cos(math.radians(a)), 10 + 5.6 * math.sin(math.radians(a))),
                                                    (10 + 7.5 * math.cos(math.radians(a)), 10 + 7.5 * math.sin(math.radians(a)))) for a in range(0, 360, 45)])
    s["theme-dark"] = [("w", ellipse(10, 10.5, 7.25)), ("k", ellipse(13.75, 6.5, 6))]
    l["theme-dark"] = [("s", crescent((10, 10.5), 6.6, (13.6, 6.75), 5.6))]
    # status
    s["info"] = [("w", ellipse(10, 10, 8)), ("k", rrect(9.25, 8.75, 1.5, 6, .75)), ("k", ellipse(10, 6, 1.05))]
    l["info"] = [("s", ellipse(10, 10, 7.25)), ("s", P((10, 9.25), (10, 13.75))), dot(10, 6.4)]
    s["alert"] = [("w", rpoly([(10, 2.25), (18, 16.75), (2, 16.75)], 1.75)), ("k", rrect(9.25, 6.75, 1.5, 5.5, .75)), ("k", ellipse(10, 14.25, 1.05))]
    l["alert"] = sline(rpoly([(10, 3), (17.25, 16.25), (2.75, 16.25)], 1.5), P((10, 7.5), (10, 11))) + [dot(10, 13.4)]
    s["takedown"] = [("w", shield()), ("k", rrect(9.25, 5.75, 1.5, 5.5, .75)), ("k", ellipse(10, 13.5, 1.05))]
    l["takedown"] = sline(shield_line(), P((10, 6.6), (10, 10.25))) + [dot(10, 12.9)]
    eye = "M2,10 C4.1,5.9 6.8,4.25 10,4.25 C13.2,4.25 15.9,5.9 18,10 C15.9,14.1 13.2,15.75 10,15.75 C6.8,15.75 4.1,14.1 2,10 Z"
    s["eye"] = [("w", eye), ("k", ellipse(10, 10, 3.6)), ("w", ellipse(10, 10, 2.1))]
    l["eye"] = S("M2.5,10 C4.5,6.25 7,4.75 10,4.75 C13,4.75 15.5,6.25 17.5,10 C15.5,13.75 13,15.25 10,15.25 C7,15.25 4.5,13.75 2.5,10 Z") + \
        [("w", ellipse(10, 10, 2.5))]
    # people
    front = person(7.5, 3.25, 11, 3.5)
    s["finders"] = [("w", ellipse(13.75, 5.75, 3)), ("w", "M10,17.5 C10,13.6 11.9,11.25 14.5,11.25 C16.75,11.25 18,13.1 18,15.75 L18,17.5 Z"),
                    ("k", ellipse(7.5, 6.75, 4.75)), ("sk", front[1][1], 2.5)] + front
    l["finders"] = sline(ellipse(7.25, 6.75, 3.25), shoulders(7.25, 12, 9, 17.25), A(13.75, 6.25, 2.75, -120, 120),
                         "M14.75,12.1 C16.2,12.55 17.25,13.9 17.25,15.6 L17.25,17.25")
    # hand: the pan tool
    fingers = [(5.25, 4.75), (8.75, 2.5), (12.25, 3.25), (15.75, 5.5)]
    s["hand"] = [("w", rrect(x, y, 2.25, 9.5, 1.125)) for x, y in fingers] + \
        [("w", "M5.25,9.75 L18,9.75 L18,12.5 C18,15.55 15.55,18 12.5,18 L10.75,18 C8.75,18 7.4,17.3 6.3,16.2 L5.25,15.1 Z"),
         ("w", bar((6.6, 15.65), (3.4, 12.45), 2.5))]
    m = lambda x, y: (1.445 + .715 * x, 1.42 + .715 * y)
    r2, r8 = 2 * .715, 8 * .715
    fing = lambda x0, y0, top, x1, y1: "M%s L%s %s L%s" % (pt(m(x0, y0)), pt(m(x0, top)), A(*m(x0 - 2, top), r2, 0, -180, move=False), pt(m(x1, y1)))
    l["hand"] = sline(fing(18, 11, 6, 14, 6), fing(14, 10, 4, 10, 6), fing(10, 10.5, 6, 6, 14),
                      "M%s %s L%s %s L%s C%s %s %s L%s %s L%s" % (
                          pt(m(18, 8)), A(*m(20, 8), r2, 180, 360, move=False), pt(m(22, 14)), A(*m(14, 14), r8, 0, 90, move=False),
                          pt(m(12, 22)), pt(m(9.2, 22)), pt(m(7.5, 21.14)), pt(m(6.01, 19.66)), pt(m(2.41, 16.06)),
                          A(*m(3.825, 14.65), r2, 135, 315, move=False), pt(m(7, 15))))
    # source code (an original glyph, not GitHub's mark: see docs/ICONS.md)
    s["github"] = [rbar(5.125, 3, SW, 10), band("M14,7.5 C14,11.25 6,10 6,13.25"), ("w", ellipse(6, 15, 2.6)), ("w", ellipse(14, 5.25, 2.6))]
    l["github"] = S(P((6, 3), (6, 12.75)), ellipse(6, 15, 2.1), ellipse(14, 5.25, 2.1), "M14,7.4 C14,11 6,9.75 6,12.9")
    return s, l


# ------------------------------------------------------------------------------------------------ the family's own drawings
def drawn():
    s, l = {}, {}

    # ---------------- navigation and controls
    s["menu"] = [hb(3, 17, 7), hb(3, 17, 13)]
    l["menu"] = sline(P((3.5, 7.25), (16.5, 7.25)), P((3.5, 12.75), (16.5, 12.75)))
    s["minus"] = [rbar(3.75, 9.125, 12.5)]
    l["minus"] = sline(P((4, 10), (16, 10)))
    mp = [(2.5, 4.75), (7.25, 2.75), (12.75, 4.75), (17.5, 2.75), (17.5, 15.25), (12.75, 17.25), (7.25, 15.25), (2.5, 17.25)]
    s["map"] = [("w", rpoly(mp, [.75, .4, .4, .75, .75, .4, .4, .75])), kline(P((7.25, 1.5), (7.25, 16)), 1.25), kline(P((12.75, 4), (12.75, 18.5)), 1.25)]
    mpl = [(2.75, 5), (7.25, 3.25), (12.75, 5), (17.25, 3.25), (17.25, 15), (12.75, 16.75), (7.25, 15), (2.75, 16.75)]
    l["map"] = sline(rpoly(mpl, [.5, .3, .3, .5, .5, .3, .3, .5]), P((7.25, 3.5), (7.25, 14.75)), P((12.75, 5.25), (12.75, 16.5)))

    # 2D and 3D: lettered, as map apps label the view switch; drawn as bars, not set in a font
    two = "M3.4,7.25 C3.4,5.7 4.55,4.75 6,4.75 C7.5,4.75 8.6,5.75 8.6,7.15 C8.6,8.4 7.9,9.25 6.9,10.2 L3.5,13.4 L3.5,14.3 L9,14.3"
    three = ("M3.5,6.4 C3.85,5.35 4.8,4.75 6,4.75 C7.45,4.75 8.5,5.6 8.5,6.95 C8.5,8.3 7.45,9.3 5.9,9.3 "
             "C7.6,9.3 8.75,10.3 8.75,11.75 C8.75,13.25 7.55,14.25 6,14.25 C4.7,14.25 3.65,13.6 3.3,12.55")
    dee = "M11.35,4.75 L13.4,4.75 C15.4,4.75 16.75,6.7 16.75,9.5 C16.75,12.3 15.4,14.25 13.4,14.25 L11.35,14.25 Z"
    s["2d"] = [band(two, 1.9), band(dee, 1.9)]
    l["2d"] = sline(two.replace("L3.5,13.4 L3.5,14.3 L9,14.3", "L3.5,14.25 L8.75,14.25"), dee)
    s["3d"] = [band(three, 1.9), band(dee, 1.9)]
    l["3d"] = sline(three, dee)

    # tilt: the map plane leaning back, an arc over it
    s["tilt"] = [("w", rpoly([(5.75, 11.5), (14.25, 11.5), (17.75, 17), (2.25, 17)], [.6, .6, .9, .9])),
                 ("w", arc_arrow(10, 11, 7.6, 5.85, 200, 325, 1.15))]
    a0, a1, rr = 205, 318, 6.75
    tip = (10 + rr * math.cos(math.radians(a1)), 11 + rr * math.sin(math.radians(a1)))
    tdl = (-math.sin(math.radians(a1)), math.cos(math.radians(a1)))
    l["tilt"] = sline(rpoly([(6.25, 12), (13.75, 12), (17, 16.75), (3, 16.75)], [.5, .5, .75, .75]), A(10, 11, rr, a0, a1), line_head(tip, tdl, 2.6))

    # zoom: the search lens with a plus or a minus inside
    lens = [("w", ellipse(8.5, 8.5, 6.25)), ("k", ellipse(8.5, 8.5, 4.25)), ("w", bar((13, 13), (16.75, 16.75), 2.75))]
    s["zoom-in"] = lens + [("w", rrect(7.75, 6, 1.5, 5, .5)), ("w", rrect(6, 7.75, 5, 1.5, .5))]
    s["zoom-out"] = lens + [("w", rrect(6, 7.75, 5, 1.5, .5))]
    lensl = sline(ellipse(8.6, 8.6, 5.6), P((12.85, 12.85), (17, 17)))
    l["zoom-in"] = lensl + sline(P((8.6, 6.6), (8.6, 10.6)), P((6.6, 8.6), (10.6, 8.6)))
    l["zoom-out"] = lensl + sline(P((6.6, 8.6), (10.6, 8.6)))

    # spoiler: the eye, struck through
    eye = "M2,10 C4.1,5.9 6.8,4.25 10,4.25 C13.2,4.25 15.9,5.9 18,10 C15.9,14.1 13.2,15.75 10,15.75 C6.8,15.75 4.1,14.1 2,10 Z"
    s["spoiler"] = [("w", eye), ("k", ellipse(10, 10, 3.6)), ("w", ellipse(10, 10, 2.1)),
                    ("k", pl([(2.5, 2.5), (17.5, 17.5)], 4.6, ext=1)), ("w", pl([(3, 3), (17, 17)], 1.75, ext=.35))]
    l["spoiler"] = S("M2.5,10 C4.5,6.25 7,4.75 10,4.75 C13,4.75 15.5,6.25 17.5,10 C15.5,13.75 13,15.25 10,15.25 C7,15.25 4.5,13.75 2.5,10 Z") + \
        [("w", ellipse(10, 10, 2.5)), ("sk", P((2.75, 2.75), (17.25, 17.25)), 3.75), ("s", P((3, 3), (17, 17)), LW)]

    # chapter: the story's bookmark (the on-state stays filled in both sets)
    bm = [(4.75, 2.5), (15.25, 2.5), (15.25, 17.75), (10, 14), (4.75, 17.75)]
    s["chapter"] = [("w", rpoly(bm, [1.75, 1.75, .6, .6, .6])), ("k", rrect(7.5, 5.5, 5, 1.5, .75))]
    l["chapter"] = sline(Z((5.5, 3), (14.5, 3), (14.5, 17), (10, 13.5), (5.5, 17)), P((8, 6.5), (12, 6.5)))

    # found: a rosette with a check; hide found strikes it through
    tick = P((6.6, 10.2), (8.95, 12.5), (13.4, 7.9))
    s["found"] = [("w", seal(10, 10, 8, 6.75, 8, 1.6)), ("sk", tick, 1.75)]
    l["found"] = sline(seal(10, 10, 7.25, 6.15, 8, 1.3), P((7.1, 10.15), (9.05, 12.1), (12.9, 8.15)))
    s["hide-found"] = s["found"] + [("k", pl([(2.5, 2.5), (17.5, 17.5)], 4.25, ext=1)), ("w", pl([(3, 3), (17, 17)], 1.75, ext=.35))]
    l["hide-found"] = l["found"] + [("sk", P((2.75, 2.75), (17.25, 17.25)), 3.75), ("s", P((3, 3), (17, 17)), LW)]

    # rss: the web feed mark (a public, free-to-use symbol), drawn as bars
    s["rss"] = [("w", ellipse(4.85, 15.15, 2)), band(A(3.25, 16.75, 7, -90, 0), 2.1), band(A(3.25, 16.75, 12.25, -90, 0), 2.1)]
    l["rss"] = [dot(5, 15, 1.6)] + sline(A(3.75, 16.25, 6.5, -90, 0), A(3.75, 16.25, 11.5, -90, 0))

    s["dot"] = [("w", ellipse(10, 10, 3.5))]
    l["dot"] = [("w", ellipse(10, 10, 3.5))]

    # ---------------- site sections
    s["home"] = [("w", rpoly([(10, 2.5), (17.5, 8.75), (17.5, 17.5), (2.5, 17.5), (2.5, 8.75)], [1.1, 1, 1.75, 1.75, 1])),
                 ("k", rrect(8.25, 11.75, 3.5, 8, 1))]
    l["home"] = sline(rpoly([(10, 3), (16.75, 8.75), (16.75, 17.25), (3.25, 17.25), (3.25, 8.75)], [.75, .75, 1.5, 1.5, .75]),
                      "M8.25,17.25 L8.25,13.25 C8.25,12.7 8.7,12.25 9.25,12.25 L10.75,12.25 C11.3,12.25 11.75,12.7 11.75,13.25 L11.75,17.25")
    s["finds"] = [("w", ellipse(8.5, 8.5, 6.5)), ("k", star4(8.5, 8.5, 4, .2)), ("w", bar((13.1, 13.1), (16.75, 16.75), 2.75))]
    l["finds"] = sline(ellipse(8.6, 8.6, 5.6), P((12.85, 12.85), (17, 17)), star4(8.6, 8.6, 3, .2))
    pg = "M9.25,5 C7.5,3.75 5,3.25 2.25,3.5 L2.25,15.75 C5,15.5 7.5,16 9.25,17.25 Z"
    s["explainers"] = [("w", pg), ("w", mirror(pg))]
    l["explainers"] = sline("M10,5.75 C8.25,4.5 5.75,4 2.75,4.25 L2.75,15.5 C5.75,15.25 8.25,15.75 10,17 C11.75,15.75 14.25,15.25 17.25,15.5 "
                            "L17.25,4.25 C14.25,4 11.75,4.5 10,5.75 Z", P((10, 5.75), (10, 16.75)))
    nodes = [(5, 5.25), (15, 5.25), (10, 14.75)]
    s["gtaverse"] = bars([nodes[0], nodes[1]], [nodes[0], nodes[2]], [nodes[1], nodes[2]]) + [("w", ellipse(x, y, 2.75)) for x, y in nodes]
    nl = [(5.25, 5.5), (14.75, 5.5), (10, 14.5)]

    def edge(a, b, r=2.25):
        L = math.dist(a, b)
        ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        return P((a[0] + ux * r, a[1] + uy * r), (b[0] - ux * r, b[1] - uy * r))
    l["gtaverse"] = sline(*[ellipse(x, y, 2.25) for x, y in nl], edge(nl[0], nl[1]), edge(nl[0], nl[2]), edge(nl[1], nl[2]))
    pad = ("M6,5.5 L14,5.5 C16.2,5.5 17.4,7.2 17.8,9.6 L18,12.9 C18.2,14.9 16.9,16 15.6,16 C14.6,16 13.9,15.4 13.3,14.6 L12.4,13.4 "
           "L7.6,13.4 L6.7,14.6 C6.1,15.4 5.4,16 4.4,16 C3.1,16 1.8,14.9 2,12.9 L2.2,9.6 C2.6,7.2 3.8,5.5 6,5.5 Z")
    s["games"] = [("w", pad), ("k", rrect(4.25, 8.85, 3.6, 1.4, .45)), ("k", rrect(5.35, 7.75, 1.4, 3.6, .45)),
                  ("k", ellipse(13.4, 8.6, .95)), ("k", ellipse(15.1, 10.4, .95))]
    padl = ("M6.25,6.25 L13.75,6.25 C15.75,6.25 16.75,7.75 17.1,9.9 L17.25,12.9 C17.35,14.4 16.5,15.25 15.5,15.25 C14.75,15.25 14.2,14.8 13.75,14.15 "
            "L12.75,12.75 L7.25,12.75 L6.25,14.15 C5.8,14.8 5.25,15.25 4.5,15.25 C3.5,15.25 2.65,14.4 2.75,12.9 L2.9,9.9 C3.25,7.75 4.25,6.25 6.25,6.25 Z")
    l["games"] = sline(padl, P((4.75, 9.6), (7.75, 9.6)), P((6.25, 8.1), (6.25, 11.1))) + [dot(13.25, 8.85, .85), dot(14.85, 10.5, .85)]
    s["about"] = [("w", rrect(2, 4, 16, 12, 2)), ("k", ellipse(6.6, 8.6, 1.75)), ("k", "M3.85,13.75 C3.85,12.1 5.05,11.1 6.6,11.1 C8.15,11.1 9.35,12.1 9.35,13.75 Z"),
                  ("k", rrect(11, 7.6, 4.75, 1.4, .7)), ("k", rrect(11, 10.6, 3.5, 1.4, .7))]
    l["about"] = sline(rrect(2.75, 4.5, 14.5, 11, 2), ellipse(6.75, 8.4, 1.45), "M4.6,13 C4.75,11.85 5.65,11.25 6.75,11.25 C7.85,11.25 8.75,11.85 8.9,13",
                       P((11.25, 8), (14.75, 8)), P((11.25, 11), (13.75, 11)))

    # wire: the line-art view of the hero, a wireframe cube
    hexa = [(10, 2.25), (17, 6.25), (17, 13.75), (10, 17.75), (3, 13.75), (3, 6.25)]
    s["wire"] = [("w", rpoly(hexa, .9)), kline(P((2.5, 5.9), (10, 10.2), (17.5, 5.9)), 1.3), kline(P((10, 10.2), (10, 18.5)), 1.3)]
    hexl = [(10, 2.75), (16.5, 6.5), (16.5, 13.5), (10, 17.25), (3.5, 13.5), (3.5, 6.5)]
    l["wire"] = sline(rpoly(hexl, .6), P((3.5, 6.5), (10, 10.25), (16.5, 6.5)), P((10, 10.25), (10, 17.25)))
    return s, l


# ------------------------------------------------------------------------------------------------ the catalogue
# name: (label, group, keywords). Groups: blip (find categories), layer (collectible layers), wanted, verification,
# control, media, site. Order here is the order on the preview page.
CATALOGUE = [
    ("easter-egg", "Easter egg", "blip", ["egg", "joke", "hidden"]),
    ("weapon", "Weapon", "blip", ["gun", "pistol", "ammu"]),
    ("vehicle", "Vehicle", "blip", ["car", "rare"]),
    ("collectible", "Collectible", "blip", ["gem", "item"]),
    ("npc", "Character", "blip", ["person", "npc", "people"]),
    ("memorial", "Memorial", "blip", ["candle", "tribute"]),
    ("real-world-reference", "Real-world reference", "blip", ["globe", "world"]),
    ("rockstar-crossover", "Rockstar crossover", "blip", ["crossover", "universe", "overlap"]),
    ("paranormal", "Paranormal", "blip", ["ghost", "mystery"]),
    ("glitch", "Glitch", "blip", ["bug", "error"]),
    ("secret-location", "Secret location", "blip", ["keyhole", "hidden", "spot"]),
    ("activity", "Activity", "blip", ["flag", "side activity"]),
    ("card-sets", "Card sets", "layer", ["cards", "trading"]),
    ("cocaine-flamingo", "Cocaine flamingo", "layer", ["flamingo", "bird"]),
    ("drone-time-trial", "Drone time trial", "layer", ["drone", "race"]),
    ("fishing", "Fishing", "layer", ["fish"]),
    ("kitty-litter-lab", "Kitty litter lab", "layer", ["lab", "flask"]),
    ("magazine", "Magazines, books and comics", "layer", ["books", "print", "comic"]),
    ("meditation", "Meditation", "layer", ["focus", "calm"]),
    ("meteorite", "Meteorite", "layer", ["space", "rock"]),
    ("payday-loan-job", "Payday loan job", "layer", ["money", "cash", "note"]),
    ("shop", "Shop", "layer", ["store", "bag"]),
    ("stunt", "Stunt", "layer", ["jump", "ramp"]),
    ("tattoo-studio", "Tattoo studio", "layer", ["tattoo", "ink"]),
    ("star", "Wanted star", "wanted", ["wanted", "hollow"]),
    ("star-filled", "Wanted star, filled", "wanted", ["wanted", "pursuit"]),
    ("star-flash", "Wanted star, flashing", "wanted", ["wanted", "search", "lost"]),
    ("heat", "Heat", "wanted", ["flame", "fire"]),
    ("cops-responding", "Cops responding", "wanted", ["police", "siren", "beacon"]),
    ("suspect-unknown", "Suspect unknown", "wanted", ["mask", "anonymous"]),
    ("multi-source", "Multi-source", "verification", ["verified", "double check"]),
    ("single-source", "Single source", "verification", ["check"]),
    ("rumour", "Rumour", "verification", ["unconfirmed", "question"]),
    ("debunked", "Debunked", "verification", ["false", "cross"]),
    ("menu", "Menu", "control", ["hamburger"]),
    ("close", "Close", "control", ["x", "dismiss"]),
    ("search", "Search", "control", ["find", "lens"]),
    ("filter", "Filter", "control", ["sliders"]),
    ("layers", "Layers", "control", ["basemap"]),
    ("map", "Map", "control", ["folded map"]),
    ("list", "List", "control", ["rows"]),
    ("grid", "Grid", "control", ["tiles"]),
    ("2d", "2D view", "control", ["flat"]),
    ("3d", "3D view", "control", ["relief"]),
    ("tilt", "Tilt", "control", ["pitch"]),
    ("rotate", "Rotate", "control", ["bearing"]),
    ("zoom-in", "Zoom in", "control", ["magnify"]),
    ("zoom-out", "Zoom out", "control", ["magnify"]),
    ("plus", "Plus", "control", ["add"]),
    ("minus", "Minus", "control", ["remove"]),
    ("locate", "Locate", "control", ["gps", "me", "heading"]),
    ("pin", "Pin", "control", ["place", "marker"]),
    ("share", "Share", "control", ["send"]),
    ("link", "Link", "control", ["url"]),
    ("copy", "Copy", "control", ["duplicate"]),
    ("check", "Check", "control", ["done", "tick"]),
    ("play", "Play", "media", ["start"]),
    ("pause", "Pause", "media", ["stop"]),
    ("sound-on", "Sound on", "media", ["volume", "audio"]),
    ("sound-off", "Sound off", "media", ["mute"]),
    ("theme-light", "Light theme", "control", ["sun"]),
    ("theme-dark", "Dark theme", "control", ["moon"]),
    ("arrow-up", "Arrow up", "control", []),
    ("arrow-down", "Arrow down", "control", []),
    ("arrow-left", "Arrow left", "control", ["back"]),
    ("arrow-right", "Arrow right", "control", ["next"]),
    ("chevron-up", "Chevron up", "control", ["collapse"]),
    ("chevron-down", "Chevron down", "control", ["expand"]),
    ("chevron-left", "Chevron left", "control", ["previous"]),
    ("chevron-right", "Chevron right", "control", ["opens here"]),
    ("arrow-up-right", "Arrow up right", "control", ["opens another site"]),
    ("external-link", "External link", "control", ["new tab"]),
    ("info", "Info", "control", ["about"]),
    ("alert", "Alert", "control", ["warning"]),
    ("eye", "Show", "control", ["reveal"]),
    ("spoiler", "Spoiler", "control", ["hide", "eye off"]),
    ("chapter", "Chapter", "control", ["bookmark", "progress"]),
    ("found", "Found", "control", ["badge", "tracked"]),
    ("hide-found", "Hide found", "control", ["badge off"]),
    ("download", "Download data", "control", ["export", "json"]),
    ("github", "Source code", "control", ["repository", "branch"]),
    ("rss", "RSS feed", "control", ["feed", "subscribe"]),
    ("dot", "Dot", "control", ["bullet"]),
    ("hand", "Hand", "control", ["pan", "drag"]),
    ("clip", "Clip", "media", ["video", "film"]),
    ("image", "Image", "media", ["picture", "key art"]),
    ("wire", "Line art", "media", ["wireframe", "cube"]),
    ("article", "Article", "media", ["page", "news"]),
    ("chat", "Chat", "media", ["post", "comment"]),
    ("home", "Home", "site", ["start"]),
    ("finds", "Finds", "site", ["discoveries"]),
    ("explainers", "Explainers", "site", ["guide", "book"]),
    ("gtaverse", "GTAverse", "site", ["universe", "connections", "lore"]),
    ("games", "Games", "site", ["controller"]),
    ("finders", "Finders", "site", ["credits", "people"]),
    ("about", "About", "site", ["id", "who"]),
    ("takedown", "Takedown", "site", ["rights", "shield"]),
]

# A glyph name that reuses another glyph's drawing (no redraw).
SAME_AS = {}

# Old names in src/components/ui/icons.ts -> the new glyph. Names that did not change map to themselves implicitly.
ALIASES = {
    "lore": "gtaverse", "sun": "theme-light", "moon": "theme-dark", "question": "rumour", "cross": "debunked",
    "egg": "easter-egg", "person": "npc", "keyhole": "secret-location", "globe": "real-world-reference", "car": "vehicle",
    "candle": "memorial", "crosshair": "weapon", "gem": "collectible", "flag": "activity", "bolt": "glitch", "ghost": "paranormal",
    "film": "clip", "flame": "heat", "radio": "cops-responding", "sound": "sound-on",
}
# Old `<Icon name="x" solid>` pairs that meant a different glyph, not the Solid set
LEGACY_SOLID = {"star": "star-filled"}

# content/categories.json ids -> glyph
CATEGORY_GLYPHS = {
    "easter-egg": "easter-egg", "paranormal": "paranormal", "npc": "npc", "secret-location": "secret-location",
    "real-world-reference": "real-world-reference", "vehicle": "vehicle", "memorial": "memorial", "weapon": "weapon",
    "rockstar-crossover": "rockstar-crossover", "collectible": "collectible", "activity": "activity", "glitch": "glitch",
    "card-sets": "card-sets", "cocaine-flamingos": "cocaine-flamingo", "drone-time-trials": "drone-time-trial", "fishing": "fishing",
    "kitty-litter-labs": "kitty-litter-lab", "magazines-books-comics": "magazine", "meditation-spots": "meditation",
    "meteorites": "meteorite", "payday-loan-jobs": "payday-loan-job", "shops": "shop", "stunts": "stunt", "tattoo-studios": "tattoo-studio",
}


# ------------------------------------------------------------------------------------------------ output
def markup(layers):
    """SVG inner markup for one drawing on the 20 grid. Plain paths when nothing is knocked out; otherwise Capsa's
    mask compositing, with %ID% standing for a mask id the renderer makes unique per instance."""
    if not any(L[0] in ("k", "sk") for L in layers):
        out = ""
        for L in layers:
            if L[0] == "w":
                out += '<path d="%s"/>' % L[1]
            else:
                w = L[2] if len(L) > 2 else LW
                cap, join = (L[3], L[4]) if len(L) > 4 else ("round", "round")
                out += '<path d="%s" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="%s" stroke-linejoin="%s"/>' % (L[1], f(w), cap, join)
        return out
    return ('<mask id="%%ID%%" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">%s</mask>'
            '<rect width="20" height="20" fill="currentColor" mask="url(#%%ID%%)"/>' % mask_paths(layers))


def tone_var(tone, part):
    """A plate colour: the per-instance override (--blip-plate, --blip-ink, --blip-key) over the design token."""
    token, hexv = gta.TONES[tone][part]
    return "var(--blip-%s, var(%s, %s))" % (part, token, hexv)


def plate_paths(shape, pin):
    """The plate outline(s) for a shape, on the 20 unit square. A pin adds the pointer under the plate (map use)."""
    if shape == "square":
        p = gta.PLATE["pin" if pin else "square"]
        x, y = (20 - p["size"]) / 2, p.get("top", (20 - p["size"]) / 2)
        ds = [rrect(x, y, p["size"], p["size"], p["radius"])]
    else:
        p = gta.PLATE["pin-circle" if pin else "circle"]
        r = p["size"] / 2
        ds = [ellipse(10, p.get("top", 10 - r) + r, r)]
    if pin:
        tp = gta.PLATE["tail"]
        bottom = p.get("top", 0) + p["size"]
        ds.append(rpoly([(10 - tp["width"] / 2, bottom - 1), (10 + tp["width"] / 2, bottom - 1), (10, bottom + tp["depth"])], [.2, .2, tp["tip"]]))
    return ds, p


def blip_markup(layers, shape, tone, pin=False):
    """A glyph composed on its blip plate, on its own 20 unit square: keyline, plate, then the glyph at GLYPH_SCALE.
    Colours are CSS variables over design tokens, so a state (selected, found) only changes variables. pin=True draws
    the map form: the same plate with a pointer under it, the glyph sitting in the plate."""
    out = ""
    if shape in ("square", "circle"):
        ds, p = plate_paths(shape, pin)
        k = p["key"]
        g = gta.PIN_SCALE if pin else gta.GLYPH_SCALE
        cy = p.get("top", (20 - p["size"]) / 2) + p["size"] / 2
        out += '<g style="fill:%s;stroke:%s" stroke-width="%s" stroke-linejoin="round">%s</g>' % (
            tone_var(tone, "key"), tone_var(tone, "key"), f(2 * k), "".join('<path d="%s"/>' % d for d in ds))
        out += '<g style="fill:%s">%s</g>' % (tone_var(tone, "plate"), "".join('<path d="%s"/>' % d for d in ds))
    else:   # halo: no plate, the silhouette wears the keyline
        g, cy = gta.HALO_SCALE, 10
        w = gta.PLATE["halo"]["key"] * 2 / g
        halo = ""
        for L in layers:
            if L[0] == "w":
                halo += '<path d="%s" stroke-width="%s"/>' % (L[1], f(w))
            elif L[0] == "s":
                halo += '<path d="%s" fill="none" stroke-width="%s"/>' % (L[1], f((L[2] if len(L) > 2 else LW) + w))
        out += ('<g transform="translate(10 10) scale(%s) translate(-10 -10)" stroke-linejoin="round" stroke-linecap="round" '
                'style="fill:%s;stroke:%s">%s</g>' % (f(g), tone_var(tone, "key"), tone_var(tone, "key"), halo))
    out += ('<g transform="translate(10 %s) scale(%s) translate(-10 -10)" fill="currentColor" style="color:%s">%s</g>'
            % (f(cy), f(g), tone_var(tone, "ink"), markup(layers)))
    return out


NUM = re.compile(r"-?\d+(?:\.\d+)?")


def bounds(layers):
    """Extent of what is drawn (adds and lines, with half the line width), ignoring knock-outs."""
    xs, ys = [], []
    for L in layers:
        if L[0] not in ("w", "s"):
            continue
        nums = [float(v) for v in NUM.findall(L[1])]
        pad = (L[2] if len(L) > 2 else LW) / 2 if L[0] == "s" else 0
        for x, y in zip(nums[0::2], nums[1::2]):
            xs += [x - pad, x + pad]
            ys += [y - pad, y + pad]
    return min(xs), min(ys), max(xs), max(ys)


def build():
    cs, cl = capsa_reused()
    ds, dl = drawn()
    gs, gl = gta.drawings()
    overlap = (set(gs) & (set(cs) | set(ds))) | (set(gl) & (set(cl) | set(dl)))
    solid, line = {**cs, **ds, **gs}, {**cl, **dl, **gl}
    for n, src in SAME_AS.items():
        solid[n], line[n] = solid[src], line[src]
    names = [c[0] for c in CATALOGUE]
    problems = ["drawn twice: %s" % sorted(overlap)] if overlap else []
    for n in gta.BLIP:
        if n not in names:
            problems.append("blip %s: no such glyph" % n)
    if len(set(names)) != len(names):
        problems.append("duplicate names in CATALOGUE")
    for n in names:
        if n not in solid or n not in line:
            problems.append("%s: missing a %s drawing" % (n, "solid" if n not in solid else "line"))
    extra = (set(solid) | set(line)) - set(names)
    if extra:
        problems.append("drawn but not catalogued: %s" % sorted(extra))
    warnings = []
    for n in names:
        for st, layers in (("solid", solid.get(n)), ("line", line.get(n))):
            if not layers:
                continue
            x0, y0, x1, y1 = bounds(layers)
            if x0 < 1.25 or y0 < 1.25 or x1 > 18.75 or y1 > 18.75:
                problems.append("%s %s: outside the live area (%.2f %.2f %.2f %.2f)" % (n, st, x0, y0, x1, y1))
            elif x0 < 1.9 or y0 < 1.9 or x1 > 18.1 or y1 > 18.1:
                warnings.append("%s %s: touches the edge (%.2f %.2f %.2f %.2f)" % (n, st, x0, y0, x1, y1))
    # every old name still resolves
    old = re.findall(r"^\s{2}'?([a-z0-9-]+)'?: \{", open(OLD, encoding="utf-8").read(), re.M)
    for o in old:
        if o not in names and o not in ALIASES:
            problems.append("old icon name %r has no glyph or alias" % o)
    for a, t in {**ALIASES, **LEGACY_SOLID}.items():
        if t not in names:
            problems.append("alias %s -> %s: no such glyph" % (a, t))
    cats = [c["id"] for c in json.load(open(CATEGORIES, encoding="utf-8"))]
    for c in cats:
        if CATEGORY_GLYPHS.get(c) not in names:
            problems.append("category %s has no glyph" % c)
    return solid, line, names, old, cats, problems, warnings


def ts_str(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def emit(solid, line, names):
    by = {c[0]: c for c in CATALOGUE}
    rev = {}
    for a, t in ALIASES.items():
        rev.setdefault(t, []).append(a)
    lines = [
        "// GENERATED by scripts/icons/build.py. Do not edit by hand: change the drawing there and run",
        "// `python3 scripts/icons/build.py`. Rules and the old to new name map: docs/ICONS.md.",
        "//",
        "// The Vice Files icon family, round 2: original glyphs in GTA VI's map blip and HUD language, drawn with the owner's",
        "// Capsa glyph method (20 unit grid, Solid by default and Line as the setting). Never traced or copied from Rockstar.",
        "// Each drawing is SVG markup for a 0 0 20 20 viewBox, filled with currentColor. Drawings with knock-outs use a mask",
        "// whose id is the token %ID%: render them with src/icons/render.ts, which makes the id unique per instance.",
        "// Map blip glyphs also carry `blip`: the glyph composed on its plate (keyline, plate, glyph), coloured by CSS",
        "// variables over design tokens (--blip-plate, --blip-ink, --blip-key). Render it with blipSvg() in render.ts.",
        "",
        "export const config = %s as const;" % json.dumps(CONFIG),
        "",
        "export type IconSet = 'solid' | 'line';",
        "export type GlyphGroup = 'blip' | 'layer' | 'wanted' | 'verification' | 'control' | 'media' | 'site';",
        "export type PlateShape = 'square' | 'circle' | 'halo';",
        "export type Glyph = { label: string; group: GlyphGroup; keywords: readonly string[]; aliases: readonly string[]; solid: string; line: string; plate?: PlateShape; tone?: string; blip?: string; pin?: string };",
        "",
        "export const glyphs = {",
    ]
    for n in names:
        _, label, group, kw = by[n]
        lines.append("  %s: {" % ts_str(n))
        lines.append("    label: %s, group: %s, keywords: [%s], aliases: [%s]," % (
            ts_str(label), ts_str(group), ", ".join(ts_str(k) for k in kw), ", ".join(ts_str(a) for a in sorted(rev.get(n, [])))))
        lines.append("    solid: %s," % ts_str(markup(solid[n])))
        lines.append("    line: %s," % ts_str(markup(line[n])))
        if n in gta.BLIP:
            shape, tone = gta.BLIP[n]
            lines.append("    plate: %s, tone: %s," % (ts_str(shape), ts_str(tone)))
            lines.append("    blip: %s," % ts_str(blip_markup(solid[n], shape, tone)))
            if shape != "halo":
                lines.append("    pin: %s," % ts_str(blip_markup(solid[n], shape, tone, pin=True)))
        lines.append("  },")
    lines += [
        "} as const satisfies Record<string, Glyph>;",
        "",
        "export type GlyphName = keyof typeof glyphs;",
        "",
        "/** Old names from src/components/ui/icons.ts that changed, mapped to the new glyph. Unchanged names need no entry. */",
        "export const aliases = {",
    ]
    lines += ["  %s: %s," % (ts_str(a), ts_str(t)) for a, t in ALIASES.items()]
    lines += [
        "} as const satisfies Record<string, GlyphName>;",
        "",
        "/** Old `solid` pairs that meant another glyph (the filled wanted star), not the Solid set. */",
        "export const legacySolid = {",
    ]
    lines += ["  %s: %s," % (ts_str(a), ts_str(t)) for a, t in LEGACY_SOLID.items()]
    lines += [
        "} as const satisfies Record<string, GlyphName>;",
        "",
        "/** Blip plate geometry (20 unit grid) and the glyph scale inside a plate. Rules: docs/ICONS.md. */",
        "export const plates = %s as const;" % json.dumps({**gta.PLATE, "glyphScale": gta.GLYPH_SCALE, "pinScale": gta.PIN_SCALE, "haloScale": gta.HALO_SCALE}),
        "",
        "/** Corner badges a blip can wear (top right, over the keyline): new, found. Markup for the 20 unit square. */",
        "export const blipBadges = %s as const;" % json.dumps(gta.badges()),
        "",
        "/** Blip tones: the design token behind each plate, ink and keyline (with its dark theme value as a fallback). */",
        "export const blipTones = %s as const;" % json.dumps({k: {p: list(v) for p, v in t_.items()} for k, t_ in gta.TONES.items()}),
        "",
        "/** content/categories.json ids to their glyph (find categories and collectible layers). */",
        "export const categoryGlyphs = {",
    ]
    lines += ["  %s: %s," % (ts_str(a), ts_str(t)) for a, t in CATEGORY_GLYPHS.items()]
    lines += ["} as const satisfies Record<string, GlyphName>;", ""]
    text = "\n".join(lines)
    assert "\u2013" not in text and "\u2014" not in text, "no em or en dashes"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    emit_map_subset(solid, names)
    emit_cursors(solid, names)


def emit_map_subset(solid, names):
    """The map island's subset (docs/ICONS.md, migration step 6): only the blips and pins of the find categories and
    collectible layers, the badges and the category map, so the React island never bundles the whole family."""
    used = sorted(set(CATEGORY_GLYPHS.values()))
    lines = [
        "// GENERATED by scripts/icons/build.py from the same drawings as family.ts. Do not edit by hand.",
        "// The map island's subset (docs/ICONS.md, migration step 6): the plate and pin of every find category and",
        "// collectible layer, the badges and the category map. Render with src/components/map/blip.ts.",
        "",
        "export const mapBlips = {",
    ]
    for n in used:
        assert n in names and n in gta.BLIP and gta.BLIP[n][0] != "halo", n
        shape, tone = gta.BLIP[n]
        lines.append("  %s: { blip: %s, pin: %s }," % (ts_str(n), ts_str(blip_markup(solid[n], shape, tone)), ts_str(blip_markup(solid[n], shape, tone, pin=True))))
    lines += [
        "} as const;",
        "",
        "export type MapBlipName = keyof typeof mapBlips;",
        "",
        "export const blipBadges = %s as const;" % json.dumps(gta.badges()),
        "",
        "export const categoryGlyphs = {",
    ]
    lines += ["  %s: %s," % (ts_str(a), ts_str(t)) for a, t in CATEGORY_GLYPHS.items()]
    lines += ["} as const satisfies Record<string, MapBlipName>;", ""]
    text = "\n".join(lines)
    assert "\u2013" not in text and "\u2014" not in text, "no em or en dashes"
    with open(os.path.join(os.path.dirname(OUT), "blips-map.ts"), "w", encoding="utf-8") as fh:
        fh.write(text)


# The optional game cursors (owner decision LR48, 26 Nov 2026; docs/ICONS.md, "Cursors"): two glyphs of this family drawn
# the way the player arrow is drawn on the map (halo form: the silhouette wears a keyline, no plate), turned to point
# up and to the left like a system cursor, on a 32 px square (the largest size browsers show everywhere). The hotspot
# is the arrow's tip and the pistol's muzzle. Colours are the tokens named in CURSOR_TONE, filled in by the page.
CURSORS = {
    # name: (glyph, turn in degrees, mirror, the glyph point that clicks, label)
    "arrow": ("locate", -22, False, (10, 1.75), "Player arrow"),
    "pistol": ("weapon", 24, True, (18, 6.6), "Pistol"),
}
CURSOR_PX = 32
CURSOR_SCALE = 0.8      # HALO_SCALE: the same size as the plateless blips
CURSOR_KEY = 0.95       # keyline each side, in units (about 1.5 px at 32 px), thinner than a map halo
CURSOR_TONE = {"ink": gta.TONES["player"]["ink"], "key": gta.TONES["player"]["key"]}


def emit_cursors(solid, names):
    """src/icons/cursors.ts: one standalone SVG per cursor (it becomes a data URL, so it carries no CSS variables:
    %INK% and %KEY% stand for the token colours the page resolves), its size and its hotspot in pixels."""
    def place(matrix, x, y):
        a, b, c, d, e, g = matrix
        return a * x + c * y + e, b * x + d * y + g

    out = {}
    for name, (glyph, turn, mirror, hot, label) in CURSORS.items():
        assert glyph in names and glyph in solid, glyph
        layers = solid[glyph]
        assert not any(L[0] in ("k", "sk") for L in layers), "a cursor glyph has no knock-outs: %s" % glyph
        t, sc = math.radians(turn), CURSOR_SCALE
        mx = -1 if mirror else 1
        # glyph point p -> translate + rotate(turn) * scale * mirror * (p - centre)
        a, b, c, d = math.cos(t) * sc * mx, math.sin(t) * sc * mx, -math.sin(t) * sc, math.cos(t) * sc
        x0, y0, x1, y1 = bounds(layers)
        pts = [(x, y) for x in (x0, x1) for y in (y0, y1)]
        nums = [float(v) for L in layers if L[0] in ("w", "s") for v in NUM.findall(L[1])]
        pts += list(zip(nums[0::2], nums[1::2]))
        moved = [place((a, b, c, d, 0, 0), x - 10, y - 10) for x, y in pts]
        pad = CURSOR_KEY + 0.25
        e, g = pad - min(p[0] for p in moved), pad - min(p[1] for p in moved)
        m = (a, b, c, d, e, g)
        far = max(max(p[0] for p in moved) + e, max(p[1] for p in moved) + g)
        assert far <= 20 - pad + 0.01, "cursor %s does not fit its square (%.2f)" % (name, far)
        hx, hy = place(m, hot[0] - 10, hot[1] - 10)
        k = CURSOR_PX / 20
        tf = "matrix(%s %s %s %s %s %s) translate(-10 -10)" % tuple(f(v) for v in m)
        keyw = f(CURSOR_KEY * 2 / sc)
        halo = "".join(
            '<path d="%s" stroke-width="%s"/>' % (L[1], keyw) if L[0] == "w"
            else '<path d="%s" fill="none" stroke-width="%s"/>' % (L[1], f((L[2] if len(L) > 2 else LW) + CURSOR_KEY * 2 / sc))
            for L in layers if L[0] in ("w", "s"))
        body = markup(layers).replace('stroke="currentColor"', 'stroke="%INK%"')
        svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 20 20">'
               '<g transform="%s" fill="%%KEY%%" stroke="%%KEY%%" stroke-linejoin="round" stroke-linecap="round">%s</g>'
               '<g transform="%s" fill="%%INK%%">%s</g></svg>') % (CURSOR_PX, CURSOR_PX, tf, halo, tf, body)
        out[name] = {"glyph": glyph, "label": label, "size": CURSOR_PX, "hotspot": [round(hx * k), round(hy * k)], "svg": svg}
    lines = [
        "// GENERATED by scripts/icons/build.py from the same drawings as family.ts. Do not edit by hand.",
        "// The optional game cursors (decision LR48; docs/ICONS.md, \"Cursors\"): the player arrow and the pistol in the halo",
        "// form, turned to point up and to the left, on a 32 px square. %INK% and %KEY% stand for the colours of the tokens",
        "// in cursorTone, which the page resolves for the current theme. hotspot is in pixels from the top left.",
        "",
        "export const cursors = {",
    ]
    for name, c in out.items():
        lines.append("  %s: { glyph: %s, label: %s, size: %d, hotspot: [%d, %d], svg: %s }," % (
            ts_str(name), ts_str(c["glyph"]), ts_str(c["label"]), c["size"], c["hotspot"][0], c["hotspot"][1], ts_str(c["svg"])))
    lines += [
        "} as const;",
        "",
        "export type CursorName = keyof typeof cursors;",
        "",
        "export const cursorTone = %s as const;" % json.dumps({k: list(v) for k, v in CURSOR_TONE.items()}),
        "",
    ]
    text = "\n".join(lines)
    assert "\u2013" not in text and "\u2014" not in text, "no em or en dashes"
    with open(os.path.join(os.path.dirname(OUT), "cursors.ts"), "w", encoding="utf-8") as fh:
        fh.write(text)


def sheet(path, solid, line, names):
    """A quick contact sheet outside the site: every glyph, both sets, at 16, 20, 24 and 64, on dark and light."""
    uid = [0]

    def svg(layers, px):
        uid[0] += 1
        return '<svg width="%d" height="%d" viewBox="0 0 20 20" fill="currentColor">%s</svg>' % (px, px, markup(layers).replace("%ID%", "m%d" % uid[0]))
    def cards(prefix):
        out = []
        for n in names:
            rows = "".join('<div class="row">%s</div>' % "".join(svg(st[n], px) for px in (16, 20, 24, 48)) for st in (solid, line))
            out.append('<div class="card"><div class="n">%s</div>%s</div>' % (n, rows))
        return "".join(out)
    html = ("<!doctype html><meta charset=utf-8><style>body{margin:0;font:11px system-ui}"
            ".t{padding:12px;display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.d{background:#0d0c1a;color:#fff}.l{background:#f9f5f0;color:#0d0c1a}"
            ".card{padding:6px}.row{display:flex;align-items:center;gap:8px;height:52px}.n{opacity:.7}</style>"
            '<div class="t d">%s</div><div class="t l">%s</div>' % (cards("d"), cards("l")))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html)


def main(argv):
    solid, line, names, old, cats, problems, warnings = build()
    for w in warnings:
        print("note:", w)
    if problems:
        for p in problems:
            print("FAIL:", p)
        sys.exit(1)
    emit(solid, line, names)
    if "--sheet" in argv:
        only = argv[argv.index("--only") + 1].split(",") if "--only" in argv else names
        sheet(argv[argv.index("--sheet") + 1], solid, line, [n for n in names if n in only])
    print("built %d glyphs x 2 sets (solid + line) = %d drawings; %d old names resolve (%d through aliases); %d categories mapped -> %s"
          % (len(names), 2 * len(names), len(old), sum(1 for o in old if o in ALIASES), len(cats), os.path.relpath(OUT, ROOT)))


if __name__ == "__main__":
    main(sys.argv[1:])
