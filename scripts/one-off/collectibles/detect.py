# Detect Game Checklists pin discs (purple fill, white ring, white digits) by colour and shape.
# v2: pins never overlap on these maps (min centre spacing ~2.2r), so each pin is one disc.
# Merge components split by digit strokes, split components where two discs touch without a ring gap,
# and take the centre as the centroid of the convex hull (robust to digit notches).
import sys, json, cv2, numpy as np
DL, OUT = sys.argv[1], sys.argv[2]

def purple_mask(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, S, V = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    m = ((H >= 125) & (H <= 155) & (S >= 70) & (V >= 120)).astype(np.uint8)
    h, w = m.shape
    m[0:105, 0:720] = 0
    m[h - 95:h, w - 330:w] = 0
    return m

def hull_centre(pts):
    hull = cv2.convexHull(pts.astype(np.float32))
    M = cv2.moments(hull)
    if M["m00"] < 1e-6:
        return float(pts[:, 0].mean()), float(pts[:, 1].mean()), 0.0
    return M["m10"] / M["m00"], M["m01"] / M["m00"], float(M["m00"])

res = {}
for i in range(1, 13):
    name = f"m{i:02d}"
    img = cv2.imread(f"{DL}/{name}.jpg")
    m = purple_mask(img)
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    comps = []
    for k in range(1, n):
        if st[k][4] < 8:
            continue
        ys, xs = np.nonzero(lab == k) if False else (None, None)
        x, y, w, h, a = st[k]
        sub = lab[y:y + h, x:x + w] == k
        yy, xx = np.nonzero(sub)
        pts = np.stack([xx + x, yy + y], 1).astype(float)
        cx, cy, ha = hull_centre(pts)
        comps.append(dict(pts=pts, cx=cx, cy=cy, hullA=ha, a=int(a)))
    big = [c["hullA"] for c in comps if c["a"] >= 15]
    HA = float(np.median(big))
    APX = float(np.median([c["a"] for c in comps if c["a"] >= 15]))
    r = float(np.sqrt(HA / np.pi))
    # merge pieces of one disc (digit strokes cut it): union-find on centroid distance
    parent = list(range(len(comps)))
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    for a_ in range(len(comps)):
        for b_ in range(a_ + 1, len(comps)):
            ca, cb = comps[a_], comps[b_]
            if np.hypot(ca["cx"] - cb["cx"], ca["cy"] - cb["cy"]) < 1.25 * r and ca["hullA"] < 0.8 * HA and cb["hullA"] < 0.8 * HA:
                _, _, ua = hull_centre(np.concatenate([ca["pts"], cb["pts"]]))
                if ua < 1.3 * HA:
                    parent[find(a_)] = find(b_)
    groups = {}
    for k in range(len(comps)):
        groups.setdefault(find(k), []).append(k)
    dets, frags = [], []
    for g in groups.values():
        pts = np.concatenate([comps[k]["pts"] for k in g])
        cx, cy, ha = hull_centre(pts)
        merged = len(g) > 1
        if ha > 1.6 * HA:
            kk = max(2, int(round(sum(comps[k]["a"] for k in g) / APX)))
            crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.1)
            _, labels, _ = cv2.kmeans(pts.astype(np.float32), kk, None, crit, 10, cv2.KMEANS_PP_CENTERS)
            for q in range(kk):
                sp = pts[labels.ravel() == q]
                qx, qy, qa = hull_centre(sp)
                dets.append(dict(cx=qx, cy=qy, hullA=qa, kind="split"))
            continue
        if ha < 0.4 * HA:
            frags.append(dict(cx=cx, cy=cy, hullA=ha))
            continue
        kind = "disc" if 0.8 * HA <= ha <= 1.2 * HA else "odd"
        if merged:
            kind = "merged" if kind == "disc" else "merged-odd"
        dets.append(dict(cx=cx, cy=cy, hullA=ha, kind=kind))
    dets.sort(key=lambda d: (d["cy"], d["cx"]))
    for j, d in enumerate(dets):
        d["id"] = f"{name}-{j:03d}"
    res[name] = dict(radius=r, hull_area_median=HA, detections=dets, fragments=frags)
    kinds = {}
    for d in dets:
        kinds[d["kind"]] = kinds.get(d["kind"], 0) + 1
    print(name, "r=%.2f" % r, len(dets), kinds, "frags", len(frags), file=sys.stderr)
json.dump(res, open(OUT, "w"), indent=1)
