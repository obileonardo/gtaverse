# Detect Game Checklists pin discs (purple fill, white ring, white digits) by colour and shape.
import sys, json, cv2, numpy as np
DL, OUT = sys.argv[1], sys.argv[2]

def purple_mask(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, S, V = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    m = ((H >= 125) & (H <= 155) & (S >= 70) & (V >= 120)).astype(np.uint8)
    h, w = m.shape
    m[0:105, 0:720] = 0      # title box
    m[h - 95:h, w - 330:w] = 0  # logo
    return m

def fill_holes(comp):
    h, w = comp.shape
    pad = np.zeros((h + 2, w + 2), np.uint8)
    pad[1:-1, 1:-1] = comp
    ff = pad.copy()
    mask = np.zeros((h + 4, w + 4), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 1)
    holes = (ff == 0)
    return (pad | holes.astype(np.uint8))[1:-1, 1:-1]

def best_circle(points, r, cx0, cy0, others, search):
    best = None
    for dy in np.arange(-search, search + 0.01, 0.5):
        for dx in np.arange(-search, search + 0.01, 0.5):
            cx, cy = cx0 + dx, cy0 + dy
            if any((cx - ox) ** 2 + (cy - oy) ** 2 < (0.6 * r) ** 2 for ox, oy in others):
                continue
            d = np.hypot(points[:, 0] - cx, points[:, 1] - cy)
            score = np.mean(np.abs(d - r) < 1.2)
            if best is None or score > best[0]:
                best = (score, cx, cy)
    return best

res = {}
for i in range(1, 13):
    name = f"m{i:02d}"
    img = cv2.imread(f"{DL}/{name}.jpg")
    m = purple_mask(img)
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    comps = []
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if a < 15:
            continue
        sub = (lab[y:y + h, x:x + w] == k).astype(np.uint8)
        f = fill_holes(sub)
        A = int(f.sum())
        ys, xs = np.nonzero(f)
        cnts, _ = cv2.findContours(f, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cnts, key=cv2.contourArea)
        hull = cv2.convexHull(c)
        solidity = A / max(cv2.contourArea(hull), 1)
        comps.append(dict(x=int(x), y=int(y), w=int(w), h=int(h), A=A, cx=float(xs.mean() + x), cy=float(ys.mean() + y),
                          solidity=float(solidity), aspect=float(w / h), contour=(c.reshape(-1, 2) + [x, y]).tolist()))
    Amed = float(np.median([c["A"] for c in comps]))
    r = float(np.sqrt(Amed / np.pi))
    dets = []
    for c in comps:
        ok = 0.85 * Amed <= c["A"] <= 1.15 * Amed and c["solidity"] > 0.93 and 0.85 < c["aspect"] < 1.18
        c["r"] = r
        c["kind"] = "disc" if ok else "partial"
        dets.append(c)
    # refine partial ones by circle fit to their outer contour
    centres = [(d["cx"], d["cy"]) for d in dets if d["kind"] == "disc"]
    for d in dets:
        if d["kind"] == "disc":
            continue
        pts = np.array(d["contour"], float)
        if d["A"] < 0.35 * Amed:
            d["kind"] = "fragment"
        b = best_circle(pts, r, d["cx"], d["cy"], centres, search=max(4, r * 0.8))
        if b:
            d["fit_score"], d["cx"], d["cy"] = float(b[0]), float(b[1]), float(b[2])
    for d in dets:
        del d["contour"]
    dets.sort(key=lambda d: (d["cy"], d["cx"]))
    for j, d in enumerate(dets):
        d["id"] = f"{name}-{j:03d}"
    res[name] = dict(radius=r, area_median=Amed, detections=dets)
    kinds = {}
    for d in dets:
        kinds[d["kind"]] = kinds.get(d["kind"], 0) + 1
    print(name, "r=%.2f" % r, len(dets), kinds, file=sys.stderr)
json.dump(res, open(OUT, "w"), indent=1)
