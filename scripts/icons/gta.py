"""Round 2 of the icon family: the map blip layer, redrawn from scratch in GTA VI's blip language (docs/ICONS.md,
"GTA VI style spec"), with Capsa's geometry helpers (capsa.py). Original drawings: nothing here is traced or copied from
a Rockstar icon. The spec was learned by looking; every coordinate below was set by hand on the 20 unit grid.

The blip language, in short: a chunky dark silhouette with one to three bold knock-outs, sitting on a light rounded
square plate (or a round plate for live states) that wears a dark keyline so it holds over any map. Knock-out holes are
at least 2 units wide and knocked lines at least 1.75, because a blip glyph is shown at 0.62 scale inside its plate.

drawings() returns (solid, line) dicts for the blip layer: find categories, collectible layers, wanted and heat,
verification, plus the two map controls that are blips in the game too (`locate`, the player arrow).
PLATE, TONES and BLIP describe how build.py composes a glyph onto its plate.
"""
import math

from capsa import A, LW, P, band, ellipse, pl, pt, rot, rpoly, rrect, star4, star5

# ------------------------------------------------------------------------------------------------ plate system
# On the 20 unit grid of the glyph. A blip is drawn on its own 20 unit square: keyline, plate, then the glyph scaled
# to GLYPH_SCALE about the centre. Measured from the game: plate about 21 px with a 1 to 1.5 px dark edge, corners about
# a quarter of the side, glyph about 60 % of the plate.
PLATE = {
    "square": {"size": 17.5, "radius": 4.75, "key": 1.25},             # map blips in lists, legends and the minimap
    "circle": {"size": 17.5, "key": 1.25},                              # live states: wanted, heat, verification
    "pin": {"size": 15.5, "radius": 4.25, "key": 1.1, "top": 1.1},      # the map form: the plate on a pointer
    "pin-circle": {"size": 15.5, "key": 1.1, "top": 1.1},
    "tail": {"width": 5, "depth": 2.6, "tip": .8},                      # the pointer under a pin plate
    "halo": {"key": 1.75},                                               # plateless: stars, the player arrow, the waypoint
}
GLYPH_SCALE = 0.62   # the glyph inside a square or round plate
PIN_SCALE = 0.55     # the glyph inside a pin plate
HALO_SCALE = 0.8     # a plateless glyph, leaving room for its keyline

# Plate tones. Every colour is an existing design token (src/styles/tokens.css); no new colour is introduced.
# plate, ink (the glyph) and key (the keyline). The fallback hex is the dark theme value of the same token, used where
# CSS variables cannot reach (canvas images, the 3D pin atlas).
TONES = {
    "find": {"plate": ("--inverse-fill", "#f2f2f2"), "ink": ("--inverse-text", "#0d0c1a"), "key": ("--bg", "#0d0c1a")},
    "layer": {"plate": ("--blip-collectible", "#f76685"), "ink": ("--blip-collectible-ink", "#0d0c1a"), "key": ("--blip-collectible-key", "#0d0c1a")},
    "alert": {"plate": ("--accent", "#f976b0"), "ink": ("--on-accent", "#0d0c1a"), "key": ("--bg", "#0d0c1a")},
    "star": {"plate": ("--inverse-fill", "#f2f2f2"), "ink": ("--inverse-fill", "#f2f2f2"), "key": ("--bg", "#0d0c1a")},
    "verified": {"plate": ("--badge-verify-fill", "#fbc7e4"), "ink": ("--badge-verify-text", "#0d0c1a"), "key": ("--bg", "#0d0c1a")},
    "muted": {"plate": ("--surface-3", "#2f2e52"), "ink": ("--text-1", "#ffffff"), "key": ("--bg", "#0d0c1a")},
    "player": {"plate": ("--bg", "#0d0c1a"), "ink": ("--inverse-fill", "#f2f2f2"), "key": ("--bg", "#0d0c1a")},
    "waypoint": {"plate": ("--accent", "#f976b0"), "ink": ("--accent", "#f976b0"), "key": ("--bg", "#0d0c1a")},
}

# glyph -> (plate shape, tone). Only glyphs listed here get a blip drawing.
BLIP = {}
for n in ("easter-egg", "weapon", "vehicle", "collectible", "npc", "memorial", "real-world-reference", "rockstar-crossover",
          "paranormal", "glitch", "secret-location", "activity"):
    BLIP[n] = ("square", "find")
for n in ("card-sets", "cocaine-flamingo", "drone-time-trial", "fishing", "kitty-litter-lab", "magazine", "meditation",
          "meteorite", "payday-loan-job", "shop", "stunt", "tattoo-studio"):
    BLIP[n] = ("square", "layer")
BLIP.update({"star": ("halo", "star"), "star-filled": ("halo", "star"), "star-flash": ("halo", "star"),
             "heat": ("circle", "alert"), "cops-responding": ("circle", "alert"), "suspect-unknown": ("circle", "alert"),
             "multi-source": ("circle", "verified"), "single-source": ("circle", "find"), "rumour": ("circle", "muted"),
             "debunked": ("circle", "muted"), "locate": ("halo", "player"), "pin": ("halo", "waypoint")})


def badges():
    """Corner badges (top right of the 20 unit square, drawn over the plate): `new` is the amber diamond the game puts on
    new map items; `found` is a mint disc with a check, for finds the visitor has marked found."""
    key = "var(--blip-key, var(--bg, #0d0c1a))"
    dia = rpoly([(16.25, .75), (19.25, 3.75), (16.25, 6.75), (13.25, 3.75)], .5)
    chk = "M14.6,3.8 L15.75,4.95 L17.9,2.75"
    return {
        "new": '<path d="%s" style="fill:var(--level-5, #ffa948);stroke:%s" stroke-width="1.2" stroke-linejoin="round"/>' % (dia, key),
        "found": ('<path d="%s" style="fill:var(--level-1, #89f5e3);stroke:%s" stroke-width="1.2"/>'
                  '<path d="%s" fill="none" style="stroke:var(--inverse-text, #0d0c1a)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>'
                  % (ellipse(16.25, 3.75, 3), key, chk)),
    }


# ------------------------------------------------------------------------------------------------ helpers
def kl(d, w=1.75):
    """A knocked-out line with blunt ends: the blip set's detail line, never thinner than 1.75."""
    return ("sk", d, w, "butt", "miter")


def gap(d, w):
    """A knocked-out outline around a shape that is drawn next, so overlapping parts read as separate pieces."""
    return ("sk", d, w, "round", "round")


def mx(p, axis=10):
    return (2 * axis - p[0], p[1])


def sl(*ds, w=LW):
    return [("s", d, w) for d in ds]


def dot(x, y, r):
    return ("w", ellipse(x, y, r))


def drawings():
    s, l = {}, {}

    # ================================================================ find categories (white plates)
    # easter egg: a full egg with one bold zigzag band cut through it
    egg = "M10,1.75 C13.75,1.75 16.5,7.6 16.5,11.75 C16.5,15.4 13.6,18.25 10,18.25 C6.4,18.25 3.5,15.4 3.5,11.75 C3.5,7.6 6.25,1.75 10,1.75 Z"
    s["easter-egg"] = [("w", egg), kl(P((2.5, 11.9), (6.25, 9.4), (10, 11.9), (13.75, 9.4), (17.5, 11.9)), 1.9)]
    eggl = "M10,2.75 C13.2,2.75 15.5,7.9 15.5,11.75 C15.5,14.85 13.05,17.25 10,17.25 C6.95,17.25 4.5,14.85 4.5,11.75 C4.5,7.9 6.8,2.75 10,2.75 Z"
    l["easter-egg"] = sl(eggl, P((4.6, 11.4), (7.3, 9.1), (10, 11.6), (12.7, 9.1), (15.4, 11.4)))

    # weapon: a pistol in profile, muzzle right. Long slide, front sight, raked grip, a trigger guard with a real hole.
    slide = rpoly([(2, 4.5), (18, 4.5), (18, 8.75), (2, 8.75)], [.8, .6, .6, .8])
    grip = rpoly([(2.6, 8.25), (8.6, 8.25), (6.6, 17.75), (1.85, 17.25)], [0, .5, 1, 1])
    guard = "M8.4,8.5 L8.4,10.9 C8.4,12.15 9.35,13 10.6,13 L11,13 C12.1,13 12.85,12.25 12.85,11.15 L12.85,8.5"
    s["weapon"] = [("w", slide), ("w", rrect(15.25, 3.25, 1.75, 1.75, .4)), ("w", rrect(1.75, 3.25, 2.75, 1.75, .5)), ("w", grip),
                   band(guard, 1.75)]
    l["weapon"] = sl(rpoly([(2.75, 4.5), (17.25, 4.5), (17.25, 8.5), (2.75, 8.5)], .75),
                     "M3.5,8.5 L2.85,16.4 C2.8,16.9 3.2,17.25 3.7,17.25 L6.5,17.25 C7,17.25 7.35,16.9 7.4,16.4 L8.1,8.5",
                     "M8.75,8.5 L8.75,11.25 C8.75,12.35 9.65,13 10.75,13 L12.25,13 C13.1,13 13.5,12.4 13.5,11.5 L13.5,8.5",
                     P((15.5, 4.5), (15.5, 3.25)))

    # vehicle: a car seen head on (the blip idea of a car), windscreen and headlights cut out, wheels below the body
    cabin = rpoly([(5.6, 2.75), (14.4, 2.75), (16.4, 8.75), (3.6, 8.75)], [1.25, 1.25, .2, .2])
    s["vehicle"] = [("w", cabin), ("w", rrect(2, 8, 16, 6.75, 1.75)),
                    ("w", rrect(2.75, 13.5, 3.75, 4.5, 1)), ("w", rrect(13.5, 13.5, 3.75, 4.5, 1)),
                    ("k", rpoly([(6.9, 4.5), (13.1, 4.5), (14.3, 8.1), (5.7, 8.1)], [.6, .6, .3, .3])),
                    ("k", ellipse(5.4, 11.25, 1.35)), ("k", ellipse(14.6, 11.25, 1.35)), kl(P((8.25, 12.4), (11.75, 12.4)), 1.75)]
    l["vehicle"] = sl(P((4.1, 8.75), (6, 3.5), (14, 3.5), (15.9, 8.75)),
                      rrect(2.75, 8.75, 14.5, 5.5, 1.5), P((4.6, 14.25), (4.6, 17.25)), P((15.4, 14.25), (15.4, 17.25)),
                      P((8.5, 11.5), (11.5, 11.5))) + [dot(5.6, 11.5, 1.05), dot(14.4, 11.5, 1.05)]

    # collectible: a cut gem, girdle and crown facets cut
    gem = [(6, 2.5), (14, 2.5), (18.25, 7.75), (10, 18), (1.75, 7.75)]
    s["collectible"] = [("w", rpoly(gem, [.9, .9, .8, 1.2, .8])), kl(P((1, 7.75), (19, 7.75)), 1.75),
                        kl(P((8.9, 1.75), (7.6, 7.75), (9.3, 14.6)), 1.5), kl(P((11.1, 1.75), (12.4, 7.75), (10.7, 14.6)), 1.5)]
    l["collectible"] = sl(rpoly([(6.25, 3.25), (13.75, 3.25), (17.25, 8), (10, 16.75), (2.75, 8)], [.6, .6, .6, .9, .6]),
                          P((2.75, 8), (17.25, 8)), P((8.6, 3.25), (7.4, 8), (10, 16.6)), P((11.4, 3.25), (12.6, 8), (10, 16.6)))

    # npc: a bust, big head, broad shoulders, a clear neck gap
    s["npc"] = [("w", ellipse(10, 6, 4)),
                ("w", "M2.5,18 L2.5,16.5 C2.5,13.4 5.6,11.75 10,11.75 C14.4,11.75 17.5,13.4 17.5,16.5 L17.5,18 Z")]
    l["npc"] = sl(ellipse(10, 6.5, 3.5), "M3.25,17.25 L3.25,16.4 C3.25,13.9 6,12.4 10,12.4 C14,12.4 16.75,13.9 16.75,16.4 L16.75,17.25")

    # memorial: a vigil candle; flame, candle with a drip cut, base
    flame = "M10,1.75 C11.9,3.9 12.9,5.4 12.9,6.75 C12.9,8.35 11.6,9.55 10,9.55 C8.4,9.55 7.1,8.35 7.1,6.75 C7.1,5.4 8.1,3.9 10,1.75 Z"
    s["memorial"] = [("w", flame), ("w", rrect(6.25, 11.25, 7.5, 5.25, .9)), ("w", rrect(3.5, 15.75, 13, 2.5, 1))]
    flamel = "M10,2.75 C11.4,4.4 12.1,5.6 12.1,6.7 C12.1,7.9 11.15,8.75 10,8.75 C8.85,8.75 7.9,7.9 7.9,6.7 C7.9,5.6 8.6,4.4 10,2.75 Z"
    l["memorial"] = sl(flamel, "M7,16.75 L7,12.5 C7,12.1 7.35,11.75 7.75,11.75 L12.25,11.75 C12.65,11.75 13,12.1 13,12.5 L13,16.75",
                       P((4, 17), (16, 17)))

    # real-world reference: the globe, one meridian and the equator cut
    s["real-world-reference"] = [("w", ellipse(10, 10, 8.25)), ("sk", ellipse(10, 10, 3.4, 7.25), 1.75),
                                 kl(P((1.5, 10), (18.5, 10)), 1.75)]
    l["real-world-reference"] = sl(ellipse(10, 10, 7.25), ellipse(10, 10, 3, 7.25), P((2.75, 10), (17.25, 10)))

    # rockstar crossover: two worlds touching, the second cut clear of the first (never the Rockstar mark)
    ra, rb = (7.4, 10), (12.6, 10)
    s["rockstar-crossover"] = [("s", ellipse(*ra, 4.4), 2.5), ("s", ellipse(*rb, 4.4), 2.5)]
    l["rockstar-crossover"] = sl(ellipse(7.25, 10, 4.5), ellipse(12.75, 10, 4.5))

    # paranormal: a sheet ghost, big eyes
    def ghost(x0, x1, top, yb):
        w = x1 - x0
        r = w / 6
        cx, cy = (x0 + x1) / 2, top + w / 2
        d = "M%s L%s %s L%s" % (pt((x0, yb)), pt((x0, cy)), A(cx, cy, w / 2, 180, 360, move=False), pt((x1, yb)))
        for i in range(3):
            c = x1 - r - 2 * r * i
            d += " " + A(c, yb, r, 0, 180, move=False)
        return d + " Z"
    s["paranormal"] = [("w", ghost(3.5, 16.5, 1.75, 16.25)), ("k", ellipse(7.6, 8.5, 1.3, 1.9)), ("k", ellipse(12.4, 8.5, 1.3, 1.9))]
    l["paranormal"] = sl(ghost(4.5, 15.5, 2.75, 15.75)) + [dot(8, 8.6, 1), dot(12, 8.6, 1)]

    # glitch: a bug (the gamer's word for one), shell split down the middle
    legs = [((5.9, 9.4), (2.6, 7.2)), ((5.4, 12.6), (2, 12.6)), ((5.9, 15.6), (2.6, 17.6))]
    s["glitch"] = [("w", ellipse(10, 12.4, 4.75, 5.6)), kl(P((10, 7.5), (10, 19)), 1.75)] + \
        [("w", pl([a, b], 1.75, r=.45)) for a, b in legs] + [("w", pl([mx(a), mx(b)], 1.75, r=.45)) for a, b in legs] + \
        [gap(ellipse(10, 4.6, 2.9, 2.4), 2.5), ("w", ellipse(10, 4.6, 2.9, 2.4))]
    legsl = [((6.4, 9.6), (3.9, 7.85)), ((6, 12.5), (2.75, 12.5)), ((6.4, 15.25), (3.9, 17))]
    l["glitch"] = sl(ellipse(10, 12.4, 4, 4.85), P((10, 7.6), (10, 17.1)), "M7.6,7.9 C7.6,6.05 8.7,4.75 10,4.75 C11.3,4.75 12.4,6.05 12.4,7.9",
                     *[P(a, b) for a, b in legsl], *[P(mx(a), mx(b)) for a, b in legsl])

    # secret location: a lock plate, a bold keyhole
    s["secret-location"] = [("w", ellipse(10, 10, 8.25)), ("k", ellipse(10, 7.9, 2.6)),
                            ("k", rpoly([(8.75, 9), (11.25, 9), (12.4, 15), (7.6, 15)], [.2, .2, .6, .6]))]
    l["secret-location"] = sl(ellipse(10, 10, 7.25), A(10, 8.3, 2.3, 125, 415) + " L12.1,14 L7.9,14 Z")

    # activity: a pennant on a pole, the fly notched
    s["activity"] = [("w", rrect(2.75, 1.75, 2.25, 16.5, 1)),
                     ("w", rpoly([(4.5, 2.25), (17.5, 2.25), (13.9, 6.9), (17.5, 11.5), (4.5, 11.5)], [.2, .9, .5, .9, .2]))]
    l["activity"] = sl(P((4, 2.75), (4, 17.25)), rpoly([(4, 3.25), (16.25, 3.25), (13.25, 7.25), (16.25, 11.25), (4, 11.25)], [0, .6, .4, .6, 0]))

    # ================================================================ collectible layers (coral plates)
    back = rot([(2.75, 3), (10.25, 3), (10.25, 14), (2.75, 14)], -12, (6.5, 8.5))
    front = rot([(7.75, 5), (16.25, 5), (16.25, 17.25), (7.75, 17.25)], 8, (12, 11.1))
    s["card-sets"] = [("w", rpoly(back, 1.4)), gap(rpoly(front, 1.4), 3.5), ("w", rpoly(front, 1.4)), ("k", star4(12, 11.1, 3.6, .24))]
    backl = rot([(3.5, 3.5), (10.25, 3.5), (10.25, 13.75), (3.5, 13.75)], -12, (6.75, 8.75))
    frontl = rot([(8.5, 5.75), (15.5, 5.75), (15.5, 16.25), (8.5, 16.25)], 8, (12, 11))
    l["card-sets"] = [("s", rpoly(backl, 1.25)), ("k", rpoly(frontl, 1.25)), ("sk", rpoly(frontl, 1.25), 4.5), ("s", rpoly(frontl, 1.25)),
                      ("s", star4(12, 11, 2.5, .22))]

    # cocaine flamingo: the lawn flamingo. Plump body with a tail point, an S neck rising from the breast, a small
    # head with the hooked beak pointing down, one straight leg and one folded leg (the pose everybody knows)
    body = rpoly([(7.25, 10.3), (9.5, 7.6), (14, 7.1), (18.25, 6), (17.2, 10.3), (13.4, 12.5), (9.25, 12.6)],
                 [2.4, 2.4, 2, .5, 2.2, 2.4, 2.4])
    neck = "M9.1,9.1 C7.5,8.2 6.95,6.9 7.45,5.6 C7.8,4.7 8.35,4.2 8.45,3.3"
    beak = rpoly([(7.2, 2.2), (4.2, 2.95), (4.75, 6.3), (6.15, 4.1)], [.35, .6, .4, .3])
    s["cocaine-flamingo"] = [("w", body), band(neck, 2), ("w", ellipse(8.5, 3.15, 1.65, 1.4)), ("w", beak),
                             ("w", rrect(11.9, 11.9, 1.6, 6.35, .6)), ("w", pl([(12.7, 14.6), (15.6, 13.3), (14.2, 11.9)], 1.6, r=.35))]
    l["cocaine-flamingo"] = sl(rpoly([(8, 10.3), (10, 8.2), (14, 7.75), (17.25, 6.9), (16.4, 10.1), (13.2, 11.8), (9.6, 11.8)],
                                     [2, 2, 1.5, .4, 1.8, 2, 2]),
                               "M9.3,9.4 C7.95,8.6 7.5,7.4 7.95,6.2 C8.25,5.4 8.6,4.9 8.6,4.2",
                               P((7.4, 3), (5, 3.6), (5.4, 5.9)), P((12.7, 11.75), (12.7, 17.25)), P((12.7, 14.3), (15.2, 13.1), (14.1, 12.1))) + \
        [dot(8.4, 3.3, 1.2)]

    # drone time trial: a quadcopter from above, rotors cut from the arms
    rotors = [(4.75, 4.75), (15.25, 4.75), (4.75, 15.25), (15.25, 15.25)]
    s["drone-time-trial"] = [("w", pl([(4.75, 4.75), (15.25, 15.25)], 2.25)), ("w", pl([(15.25, 4.75), (4.75, 15.25)], 2.25))] + \
        sum([[gap(ellipse(x, y, 2.9), 1.75), ("w", ellipse(x, y, 2.9))] for x, y in rotors], []) + \
        [("k", ellipse(x, y, 1)) for x, y in rotors] + [gap(rrect(6.75, 6.75, 6.5, 6.5, 2), 1.75), ("w", rrect(6.75, 6.75, 6.5, 6.5, 2))]
    rl = [(5, 5), (15, 5), (5, 15), (15, 15)]
    l["drone-time-trial"] = sl(*[ellipse(x, y, 2.25) for x, y in rl], rrect(8, 8, 4, 4, 1.25),
                               P((6.6, 6.6), (8.35, 8.35)), P((13.4, 6.6), (11.65, 8.35)), P((6.6, 13.4), (8.35, 11.65)), P((13.4, 13.4), (11.65, 11.65)))

    # fishing: a fish nose left, a big eye and the gill cut
    fish = ("M1.75,10 C3.6,6.4 6.75,4.4 10,4.4 C12.55,4.4 14.4,5.8 15.5,7.8 L17.85,5.7 C18.2,5.4 18.5,5.6 18.5,6 "
            "L18.5,14 C18.5,14.4 18.2,14.6 17.85,14.3 L15.5,12.2 C14.4,14.2 12.55,15.6 10,15.6 C6.75,15.6 3.6,13.6 1.75,10 Z")
    s["fishing"] = [("w", fish), ("k", ellipse(5.9, 9.2, 1.25)),
                    kl("M9.4,6 C10.7,7.15 11.3,8.5 11.3,10 C11.3,11.5 10.7,12.85 9.4,14", 1.75)]
    fishl = "M2.75,10 C4.4,7 7,5.5 10,5.5 C12.15,5.5 13.75,6.6 14.75,8.25 L17.25,6.4 L17.25,13.6 L14.75,11.75 C13.75,13.4 12.15,14.5 10,14.5 C7,14.5 4.4,13 2.75,10 Z"
    l["fishing"] = sl(fishl, "M9.75,7.25 C10.5,8 10.85,9 10.85,10 C10.85,11 10.5,12 9.75,12.75") + [dot(6.25, 9.4, .95)]

    # kitty litter lab: a conical flask, the liquid line cut
    flask = [(7.5, 3.25), (12.5, 3.25), (12.5, 7.25), (17.5, 15.6), (16.1, 18), (3.9, 18), (2.5, 15.6), (7.5, 7.25)]
    s["kitty-litter-lab"] = [("w", rpoly(flask, [.3, .3, .6, 1.4, 1.4, 1.4, 1.4, .6])), ("w", rrect(6, 1.75, 8, 2.5, 1)),
                             kl(P((4.5, 12.25), (15.5, 12.25)), 2)]
    l["kitty-litter-lab"] = sl(rpoly([(8.25, 2.75), (11.75, 2.75), (11.75, 7.75), (16.4, 15.4), (15.4, 17.25), (4.6, 17.25), (3.6, 15.4), (8.25, 7.75)],
                                     [.3, .3, .5, 1, 1, 1, 1, .5]), P((6.75, 2.75), (13.25, 2.75)), P((6, 12.5), (14, 12.5)))

    # magazine: two issues fanned, the masthead and the cover picture cut from the front one
    rear = rot([(3.5, 2.5), (13.5, 2.5), (13.5, 16), (3.5, 16)], -9, (8.5, 9.25))
    cover = [(6.5, 4.5), (17, 4.5), (17, 18.25), (6.5, 18.25)]
    s["magazine"] = [("w", rpoly(rear, 1.25)), gap(rpoly(cover, 1.25), 3.5), ("w", rpoly(cover, 1.25)),
                     ("k", rrect(8.4, 6.4, 6.7, 2.4, .6)), kl(P((8.4, 11.6), (15.1, 11.6)), 1.75), kl(P((8.4, 14.6), (12.6, 14.6)), 1.75)]
    l["magazine"] = sl(rpoly(rot([(3.75, 3.25), (12.75, 3.25), (12.75, 15.25), (3.75, 15.25)], -9, (8.25, 9.25)), 1),
                       rrect(7.25, 5.25, 9.5, 12, 1.1), P((9.5, 8), (14.5, 8)), P((9.5, 11.5), (14.5, 11.5)), P((9.5, 14.25), (12.5, 14.25)))

    # meditation: a figure sitting cross-legged, hands on knees
    s["meditation"] = [("w", ellipse(10, 3.9, 2.4)),
                       ("w", rpoly([(7.3, 7.4), (12.7, 7.4), (13.9, 10.4), (16.9, 13), (3.1, 13), (6.1, 10.4)], [1.5, 1.5, .8, 1, 1, .8])),
                       ("w", rrect(1.75, 13.6, 16.5, 4.4, 2.2)), kl(P((1.5, 13.3), (18.5, 13.3)), 1.5)]
    l["meditation"] = sl(ellipse(10, 4.75, 2), rpoly([(8, 8.75), (12, 8.75), (13.75, 12.75), (6.25, 12.75)], [1, 1, .5, .5]),
                         rrect(2.75, 14.5, 14.5, 2.75, 1.375))

    # meteorite: a pitted rock and its three streaks
    rock = [(2.75, 12.25), (5.5, 8.75), (10, 8), (12.75, 11), (12.25, 15.4), (8.75, 18.1), (4.25, 17.25)]
    s["meteorite"] = [("w", rpoly(rock, 2.1)), ("k", ellipse(6.6, 13.75, 1.5)), ("k", ellipse(10, 11.4, 1.05)),
                      ("w", pl([(12.1, 7.4), (17, 2.5)], 2.5, r=1.2)), ("w", pl([(14.1, 11.4), (17.75, 7.75)], 2, r=1)),
                      ("w", pl([(7.9, 5.6), (11, 2.5)], 2, r=1))]
    rockl = [(3.75, 12.25), (6, 9.5), (9.5, 9.1), (11.6, 11.4), (11.2, 14.75), (8.5, 16.9), (5, 16.25)]
    l["meteorite"] = sl(rpoly(rockl, 1.6), P((12, 7.75), (16.75, 3)), P((14, 11), (17.25, 7.75)), P((8.25, 6.25), (11.25, 3.25))) + \
        [dot(7.1, 13.4, 1)]

    # payday loan job: a wad of notes, the front note's seal cut
    s["payday-loan-job"] = [("w", rrect(4, 2.75, 14.25, 9, 1.6)), gap(rrect(1.75, 6.75, 14.25, 10.5, 1.6), 3.5),
                            ("w", rrect(1.75, 6.75, 14.25, 10.5, 1.6)), ("k", ellipse(8.9, 12, 2.9)), ("w", ellipse(8.9, 12, 1.4))]
    l["payday-loan-job"] = sl(P((5, 5), (5, 4.5), (17.25, 4.5), (17.25, 12.25), (16.25, 12.25)),
                              rrect(2.75, 7.25, 12.75, 9.5, 1.5), ellipse(9.1, 12, 2.1))

    # shop: a shopping bag, the handle cut through
    s["shop"] = [("w", rpoly([(3.5, 6.75), (16.5, 6.75), (17.4, 18), (2.6, 18)], [1, 1, 1.75, 1.75])),
                 ("k", ellipse(7, 9.75, 1.25)), ("k", ellipse(13, 9.75, 1.25)),
                 band("M7,9.75 L7,6.1 C7,4.2 8.4,2.75 10,2.75 C11.6,2.75 13,4.2 13,6.1 L13,9.75", 1.9)]
    l["shop"] = sl(rpoly([(4.25, 7.25), (15.75, 7.25), (16.5, 17.25), (3.5, 17.25)], [.75, .75, 1.5, 1.5]),
                   "M7.25,9.75 L7.25,6 C7.25,4.2 8.5,2.75 10,2.75 C11.5,2.75 12.75,4.2 12.75,6 L12.75,9.75")

    # stunt: the ramp and the jump's arc with a filled head
    arc = "M8.75,10.5 C9.75,5 13.5,3.75 15,9"
    tan = (15 - 13.5, 9 - 3.75)
    tl = math.hypot(*tan)
    td = (tan[0] / tl, tan[1] / tl)
    tip = (15 + td[0] * 5, 9 + td[1] * 5)
    nx, ny = -td[1] * 3.6, td[0] * 3.6
    s["stunt"] = [("w", rpoly([(1.75, 18), (10, 18), (10, 11.75)], [.6, .8, .8])), band(arc, 2.1),
                  ("w", rpoly([tip, (15 + nx, 9 + ny), (15 - nx, 9 - ny)], [.7, .8, .8]))]
    l["stunt"] = sl(rpoly([(2.75, 17.25), (9.25, 17.25), (9.25, 13)], .5), "M8.5,11 C9.85,6.5 14.25,5.25 15.6,11",
                    P((13.4, 9.2), (15.6, 11), (17.1, 8.6)))

    # tattoo studio: the flash-sheet heart and its banner
    heart = ("M10,18.25 C10,18.25 1.75,13.1 1.75,7.25 C1.75,4.45 3.75,2.25 6.35,2.25 C8.05,2.25 9.3,3.25 10,4.6 "
             "C10.7,3.25 11.95,2.25 13.65,2.25 C16.25,2.25 18.25,4.45 18.25,7.25 C18.25,13.1 10,18.25 10,18.25 Z")
    ban = rot([(1.5, 8.4), (18.5, 8.4), (17, 10.4), (18.5, 12.4), (1.5, 12.4), (3, 10.4)], -14, (10, 10.4))
    banin = rot([(2.6, 9.15), (17.4, 9.15), (16.2, 10.4), (17.4, 11.65), (2.6, 11.65), (3.8, 10.4)], -14, (10, 10.4))
    s["tattoo-studio"] = [("w", heart), ("sk", rpoly(ban, .3), 3), ("k", rpoly(ban, .3)), ("w", rpoly(banin, .25))]
    heartl = ("M10,16.9 C10,16.9 2.75,12.4 2.75,7.25 C2.75,5 4.4,3.25 6.5,3.25 C8.05,3.25 9.3,4.2 10,5.5 C10.7,4.2 11.95,3.25 13.5,3.25 "
              "C15.6,3.25 17.25,5 17.25,7.25 C17.25,12.4 10,16.9 10,16.9 Z")
    banl = rpoly(rot([(2.75, 8.9), (17.25, 8.9), (16.1, 10.4), (17.25, 11.9), (2.75, 11.9), (3.9, 10.4)], -14, (10, 10.4)), .3)
    l["tattoo-studio"] = [("s", heartl), ("sk", banl, 4), ("k", banl), ("s", banl)]

    # ================================================================ wanted and heat
    # stars are crisp, as in the game's wanted meter: points rounded only 0.35
    st = star5(10, 10.75, 8.6, 3.9)
    s["star"] = [("w", rpoly(st, .35)), ("k", rpoly(star5(10, 10.75, 4.9, 2.2), .2))]
    l["star"] = sl(rpoly(star5(10, 10.6, 7.6, 3.5), .45))
    s["star-filled"] = [("w", rpoly(st, .35))]
    stl = rpoly(star5(10, 10.6, 7.6, 3.5), .45)
    l["star-filled"] = [("w", stl), ("s", stl)]
    small = star5(10, 11, 5.9, 2.7)
    flash = [-126, -54, 18, 162]
    pol = lambda r, a: (10 + r * math.cos(math.radians(a)), 11 + r * math.sin(math.radians(a)))
    s["star-flash"] = [("w", rpoly(small, .3))] + [("w", pl([pol(6.9, a), pol(8.4, a)], 2, r=.5)) for a in flash]
    l["star-flash"] = [("w", rpoly(star5(10, 10.9, 5.1, 2.4), .4)), ("s", rpoly(star5(10, 10.9, 5.1, 2.4), .4))] + \
        sl(*[P(pol(6.9, a), pol(8.1, a)) for a in flash])

    # heat: a flame, its core cut
    fl = ("M10,1.75 C10.65,4.75 13.5,6.3 14.9,8.85 C15.85,10.5 16.25,11.9 16.25,13.3 C16.25,16.3 13.5,18.25 10,18.25 "
          "C6.5,18.25 3.75,16.3 3.75,13.3 C3.75,10.85 5.1,8.7 6.85,7.3 C6.95,8.85 7.7,9.95 8.8,10.4 C8.45,7.15 8.7,4.1 10,1.75 Z")
    s["heat"] = [("w", fl), ("k", "M10,10.4 C11.15,11.8 12.35,12.7 12.35,14.35 C12.35,15.75 11.3,16.6 10,16.6 C8.7,16.6 7.65,15.75 7.65,14.35 C7.65,12.85 8.85,11.9 10,10.4 Z")]
    l["heat"] = sl("M10,3 C10.55,5.4 12.85,6.75 14,8.85 C14.7,10.15 15,11.3 15,12.6 C15,15.25 12.75,17.25 10,17.25 "
                   "C7.25,17.25 5,15.25 5,12.6 C5,10.65 6,8.95 7.35,7.75 C7.6,9 8.2,9.85 9.1,10.25 C8.85,7.6 9,5.1 10,3 Z",
                   "M10,11.6 C10.7,12.4 11.25,13 11.25,13.8 C11.25,14.5 10.7,15 10,15 C9.3,15 8.75,14.5 8.75,13.8 C8.75,13 9.3,12.4 10,11.6 Z")

    # cops responding: the patrol car's beacon, three flashes over it
    s["cops-responding"] = [("w", "M5,14.25 L5,11.4 C5,8.35 7.25,6 10,6 C12.75,6 15,8.35 15,11.4 L15,14.25 Z"),
                            ("w", rrect(2.5, 14.75, 15, 3.25, 1)), ("k", rrect(7.6, 9.1, 2, 3.9, 1)),
                            ("w", pl([(10, 1.75), (10, 4.25)], 2, r=.5)),
                            ("w", pl([(3.6, 4.1), (5.4, 5.9)], 2, r=.5)), ("w", pl([(16.4, 4.1), (14.6, 5.9)], 2, r=.5))]
    l["cops-responding"] = sl("M5.75,14 L5.75,11.25 C5.75,8.8 7.65,7 10,7 C12.35,7 14.25,8.8 14.25,11.25 L14.25,14",
                              rrect(3.25, 14, 13.5, 3.25, 1), P((10, 2.75), (10, 4.5)), P((4.6, 5), (5.85, 6.25)), P((15.4, 5), (14.15, 6.25)))

    # suspect unknown: a bust in a balaclava, the eye slit cut
    s["suspect-unknown"] = [("w", "M5.4,9.9 L5.4,6.6 C5.4,3.85 7.45,1.75 10,1.75 C12.55,1.75 14.6,3.85 14.6,6.6 L14.6,9.9 "
                                  "C14.6,11.45 13.35,12.6 11.8,12.6 L8.2,12.6 C6.65,12.6 5.4,11.45 5.4,9.9 Z"),
                            ("k", rrect(6.6, 5.4, 6.8, 2.3, 1.15)),
                            ("w", "M2.5,18.25 L2.5,17 C2.5,15.15 5.4,14 10,14 C14.6,14 17.5,15.15 17.5,17 L17.5,18.25 Z")]
    l["suspect-unknown"] = sl("M6.25,9.6 L6.25,6.75 C6.25,4.4 7.9,2.75 10,2.75 C12.1,2.75 13.75,4.4 13.75,6.75 L13.75,9.6 "
                              "C13.75,10.85 12.85,11.75 11.6,11.75 L8.4,11.75 C7.15,11.75 6.25,10.85 6.25,9.6 Z",
                              P((8, 6.6), (12, 6.6)), "M3.25,17.25 C3.25,15.6 6.25,14.75 10,14.75 C13.75,14.75 16.75,15.6 16.75,17.25")

    # ================================================================ verification (round plates on the map)
    s["multi-source"] = [("w", pl([(2.4, 10.25), (6.25, 14.1), (13.6, 6.4)], 2.1)), ("w", pl([(10.6, 12.6), (12.1, 14.1), (17.6, 8.3)], 2.1))]
    l["multi-source"] = sl(P((2.5, 10.25), (6.25, 14), (13.75, 6.25)), P((10.5, 12.75), (11.75, 14), (17.5, 8)))
    # single source: one source, drawn the way the site's badge says it (an outline with a dot), its own glyph
    s["single-source"] = [("w", ellipse(10, 10, 8.25)), ("k", ellipse(10, 10, 6.1)), ("w", ellipse(10, 10, 3))]
    l["single-source"] = sl(ellipse(10, 10, 7.25)) + [dot(10, 10, 2.6)]
    bub = ("M10,2 C14.55,2 18,5.1 18,9.25 C18,13.4 14.55,16.5 10,16.5 C9.1,16.5 8.25,16.4 7.45,16.15 L3.6,18.1 "
           "C3.2,18.3 2.8,17.95 2.95,17.5 L3.95,14.4 C2.75,13.05 2,11.25 2,9.25 C2,5.1 5.45,2 10,2 Z")
    s["rumour"] = [("w", bub), ("sk", "M7.75,7.35 C7.75,6.05 8.75,5.1 10,5.1 C11.3,5.1 12.25,6 12.25,7.15 C12.25,8.75 10,8.9 10,10.6", 2),
                   ("k", ellipse(10, 13.1, 1.3))]
    l["rumour"] = sl("M10,2.75 C14.15,2.75 17.25,5.55 17.25,9.25 C17.25,12.95 14.15,15.75 10,15.75 C9.15,15.75 8.35,15.65 7.6,15.4 L4,17.15 "
                     "L4.85,14.2 C3.55,12.9 2.75,11.15 2.75,9.25 C2.75,5.55 5.85,2.75 10,2.75 Z",
                     "M8.35,7.3 C8.35,6.35 9.1,5.75 10,5.75 C10.95,5.75 11.65,6.35 11.65,7.2 C11.65,8.35 10,8.5 10,9.8") + [dot(10, 12.1, .95)]
    s["debunked"] = [("w", ellipse(10, 10, 8.25)), kl(P((6.6, 6.6), (13.4, 13.4)), 2.25), kl(P((13.4, 6.6), (6.6, 13.4)), 2.25)]
    l["debunked"] = sl(ellipse(10, 10, 7.25), P((7.25, 7.25), (12.75, 12.75)), P((12.75, 7.25), (7.25, 12.75)))

    # ================================================================ map controls that are blips in the game too
    # locate: the player arrow, a heading arrowhead (generic navigation mark), notched at the back
    s["locate"] = [("w", rpoly([(10, 1.75), (17, 17.25), (10, 13.4), (3, 17.25)], [.9, 1, .6, 1]))]
    l["locate"] = sl(rpoly([(10, 2.9), (16.1, 16.4), (10, 13), (3.9, 16.4)], [.6, .8, .5, .8]))
    # pin: the waypoint drop, its centre cut
    drop = "M10,18.25 C10,18.25 3.25,12.5 3.25,7.9 C3.25,4.2 6.25,1.75 10,1.75 C13.75,1.75 16.75,4.2 16.75,7.9 C16.75,12.5 10,18.25 10,18.25 Z"
    s["pin"] = [("w", drop), ("k", ellipse(10, 7.9, 2.6))]
    l["pin"] = sl("M10,17.25 C10,17.25 4.25,12.1 4.25,7.9 C4.25,4.8 6.85,2.75 10,2.75 C13.15,2.75 15.75,4.8 15.75,7.9 C15.75,12.1 10,17.25 10,17.25 Z",
                  ellipse(10, 7.9, 2.1))
    return s, l
