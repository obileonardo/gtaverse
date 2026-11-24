# Find spider hubs (small purple dots where co-located pins are fanned out) and
# assign each pin to a hub by tracing its leg line. Game Checklists images only.
import sys, json, cv2, numpy as np
DL, DET, REG, OUT, VIS = sys.argv[1:6]
det = json.load(open(DET))
reg = json.load(open(REG))

def purple(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, S, V = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    return ((H >= 124) & (H <= 158) & (S >= 65) & (V >= 115)).astype(np.uint8)

def to_off(name, pts):
    Hm = np.array(reg[name]["similarity"]["H"])
    pts = np.asarray(pts, float).reshape(-1, 1, 2)
    return cv2.perspectiveTransform(pts, Hm).reshape(-1, 2)

# pass 1: raw hub candidates per map
cands = {}
cache = {}
for name, d in det.items():
    img = cv2.imread(f"{DL}/{name}.jpg")
    h, w = img.shape[:2]
    r = d["radius"]
    pins = [p for p in d["detections"] if p["kind"] != "fragment"]
    P = np.array([[p["cx"], p["cy"]] for p in pins]) if pins else np.zeros((0, 2))
    m = purple(img)
    m[0:105, 0:720] = 0
    m[h - 95:h, w - 330:w] = 0
    cover = np.zeros_like(m)
    for (x, y) in P:
        cv2.circle(cover, (int(round(x)), int(round(y))), int(round(r + 2.5)), 1, -1)
    rest = m & (1 - cover)
    n, lab, st, cen = cv2.connectedComponentsWithStats(rest, 8)
    hc = []
    for k in range(1, n):
        x, y, bw, bh, a = st[k]
        if 2 <= a <= 40 and bw <= 9 and bh <= 9:
            hc.append([float(cen[k][0]), float(cen[k][1]), int(a)])
    cands[name] = hc
    cache[name] = (img, P, pins, r)

# pass 2: drop candidates that recur at the same official location in other maps (base-map purple)
offc = {n: (to_off(n, [c[:2] for c in hc]) if hc else np.zeros((0, 2))) for n, hc in cands.items()}
res = {}
for name, d in det.items():
    img, P, pins, r = cache[name]
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hubs = []
    for c, oc in zip(cands[name], offc[name]):
        rec = 0
        for other, ocs in offc.items():
            if other == name or len(ocs) == 0:
                continue
            if np.min(np.hypot(ocs[:, 0] - oc[0], ocs[:, 1] - oc[1])) < 25:
                rec += 1
        if rec >= 3:
            continue
        # direct check: is there purple at the same official spot in other maps (away from their pins)?
        hits = 0
        for other in det:
            if other == name:
                continue
            Ho = np.array(reg[other]["similarity"]["H"])
            q = cv2.perspectiveTransform(np.array([[oc]], float), np.linalg.inv(Ho))[0, 0]
            oimg, oP, _, orr = cache[other]
            if len(oP) and np.min(np.hypot(oP[:, 0] - q[0], oP[:, 1] - q[1])) < orr + 6:
                continue
            xi, yi = int(round(q[0])), int(round(q[1]))
            if not (4 <= xi < oimg.shape[1] - 4 and 4 <= yi < oimg.shape[0] - 4):
                continue
            win = purple(oimg[yi - 3:yi + 4, xi - 3:xi + 4])
            if win.sum() >= 2:
                hits += 1
        if hits >= 2:
            continue
        hubs.append(c)

    def leg_score(px, py, hx, hy):
        L = np.hypot(hx - px, hy - py)
        ux, uy = (hx - px) / L, (hy - py) / L
        nx, ny = -uy, ux
        ok, tot = 0, 0
        for t in np.arange(r + 1.5, L - 2.0, 0.6):
            x, y = px + ux * t, py + uy * t
            if len(P) and np.min((P[:, 0] - x) ** 2 + (P[:, 1] - y) ** 2) < (r + 1.5) ** 2:
                continue
            if not (3 <= x < w - 3 and 3 <= y < h - 3):
                continue
            c = cv2.getRectSubPix(gray, (1, 1), (x, y))[0, 0]
            s1 = cv2.getRectSubPix(gray, (1, 1), (x + nx * 2.0, y + ny * 2.0))[0, 0]
            s2 = cv2.getRectSubPix(gray, (1, 1), (x - nx * 2.0, y - ny * 2.0))[0, 0]
            tot += 1
            if (c - s1) * (c - s2) > 0 and min(abs(c - s1), abs(c - s2)) > 3:
                ok += 1
        if tot < 3:
            return None, tot
        span = max(L - 3.5 - r, 0.6)
        if tot * 0.6 < 4 or (tot * 0.6) / span < 0.3:
            return 0.0, tot
        return ok / tot, tot

    assign = {}
    Rmax = 10 * r
    for p in pins:
        scored = []
        for j, (hx, hy, a) in enumerate(hubs):
            dist = np.hypot(hx - p["cx"], hy - p["cy"])
            if dist > Rmax:
                continue
            sc, nv = leg_score(p["cx"], p["cy"], hx, hy)
            if sc is None:
                if dist < r + 6:
                    scored.append((0.99, j, dist, nv, True))
                continue
            scored.append((sc, j, dist, nv, False))
        scored.sort(reverse=True)
        if scored and scored[0][0] >= 0.55:
            sc, j, dist, nv, short = scored[0]
            second = scored[1][0] if len(scored) > 1 else 0
            assign[p["id"]] = dict(hub=j, score=sc, second=second, dist=dist, samples=nv, short=short)
    res[name] = dict(hubs=hubs, assign=assign)
    vis = img.copy()
    for p in pins:
        a = assign.get(p["id"])
        if a:
            hx, hy, _ = hubs[a["hub"]]
            cv2.line(vis, (int(round(p["cx"])), int(round(p["cy"]))), (int(round(hx)), int(round(hy))), (0, 0, 255) if not a["short"] else (0, 200, 255), 1)
    for (hx, hy, a) in hubs:
        cv2.circle(vis, (int(round(hx)), int(round(hy))), 3, (0, 255, 255), 1)
    cv2.imwrite(f"{VIS}/{name}_hubs.png", vis)
    print(name, "cands", len(cands[name]), "hubs", len(hubs), "assigned", len(assign), "short", sum(1 for a in assign.values() if a["short"]), file=sys.stderr)
json.dump(res, open(OUT, "w"), indent=1)
