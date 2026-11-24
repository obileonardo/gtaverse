# Combine detections, readings, spider hubs and registration into collectible records.
import sys, json, glob, cv2, numpy as np
DL, OUTJ, VIS = sys.argv[1], sys.argv[2], sys.argv[3]
det = json.load(open("det.json"))
det1 = json.load(open("det_v1.json"))
reg = json.load(open("reg.json"))
hubs = json.load(open("hubs.json"))

LAYERS = {"m01": "card-sets", "m02": "cocaine-flamingos", "m03": "drone-time-trials", "m04": "fishing",
          "m05": "kitty-litter-labs", "m06": "magazines-books-comics", "m07": "meditation-spots",
          "m08": "meteorites", "m09": "payday-loan-jobs", "m10": "shops", "m11": "stunts", "m12": "tattoo-studios"}

def load(pattern):
    out = {}
    for f in sorted(glob.glob(pattern)):
        for line in open(f):
            if line.strip():
                i, v = line.split()
                out[int(i)] = v
    return out

# Readings
readings = {}
for m in LAYERS:
    v2 = load(f"read2_{m}*.txt")
    if v2:
        readings[m] = v2
        continue
    v1 = load(f"read_{m}.txt")  # indexed on the first detector run: map by nearest centre
    d1 = det1[m]["detections"]
    rr = {}
    for k, p in enumerate(det[m]["detections"]):
        best = min(range(len(d1)), key=lambda j: (d1[j]["cx"] - p["cx"]) ** 2 + (d1[j]["cy"] - p["cy"]) ** 2)
        dist = np.hypot(d1[best]["cx"] - p["cx"], d1[best]["cy"] - p["cy"])
        assert dist < 4, (m, k, dist)
        rr[k] = v1[best]
    readings[m] = rr

# Manual resolutions after the uniqueness check (see check.py) and closer crops
FIX = {
    "m11": {101: "19", 154: "230", 270: "356", 278: "350", 293: "358", 300: "288", 305: "109"},
    "m10": {16: "160", 213: "180", 212: "157?", 202: "154?", 105: "217?", 143: "19?", 152: "152", 193: "102?",
            84: "163?", 27: "u:115 or 116", 67: "u:185 or 186", 109: "u:106 or 108", 200: "u:30 or 36", 225: "u:163 or 168"},
}
for m, fx in FIX.items():
    for k, v in fx.items():
        readings[m][k] = v

# manual: m12 tattoo 5 belongs to the 5/6/7 fan (hub between them; 5 sits just outside the touching distance)
MANUAL = {("m02", 4): ("same", 5), ("m12", 5): ("same", 6), ("m06", 34): "centre", ("m06", 2): ("same", 1)}

def to_off(m, x, y):
    H = np.array(reg[m]["similarity"]["H"])
    p = cv2.perspectiveTransform(np.array([[[x, y]]], float), H)[0, 0]
    return float(p[0]), float(p[1])

records, report = [], {}
for m, layer in LAYERS.items():
    d = det[m]
    r = d["radius"]
    scale = reg[m]["similarity"]["scale"]
    pins = d["detections"]
    hb = hubs[m]["hubs"]
    asg = hubs[m]["assign"]
    P = np.array([[p["cx"], p["cy"]] for p in pins])
    # touching groups (pins never overlap; touching discs mean the source fanned them out)
    n = len(pins)
    parent = list(range(n))
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    for i in range(n):
        for j in range(i + 1, n):
            if np.hypot(*(P[i] - P[j])) < 2.45 * r:
                parent[find(i)] = find(j)
    groups = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(i)
    final = {}
    how = {}
    hubcount = {}
    for p in pins:
        a = asg.get(p["id"])
        if a:
            hubcount[a["hub"]] = hubcount.get(a["hub"], 0) + 1
    gid = {i: find(i) for i in range(n)}
    for i, p in enumerate(pins):
        a = asg.get(p["id"])
        if not a:
            continue
        lone = len(groups[gid[i]]) == 1 and hubcount[a["hub"]] == 1
        if lone:
            continue  # a single pin cannot be fanned out; the leg is a false match
        final[i] = (hb[a["hub"]][0], hb[a["hub"]][1])
        how[i] = "hub-leg" if not a["short"] else "hub-adjacent"
    dense = m in ("m01", "m10", "m11")
    for g in groups.values():
        if len(g) < 2:
            continue
        cx, cy = P[g].mean(axis=0)
        near = [h for h in hb if np.hypot(h[0] - cx, h[1] - cy) < 1.2 * r]
        assigned = [i for i in g if i in final]
        if near and len(g) <= 8:
            h = min(near, key=lambda h: np.hypot(h[0] - cx, h[1] - cy))
            for i in g:
                if i not in final:
                    final[i] = (h[0], h[1])
                    how[i] = "group-hub"
        elif not assigned:
            for i in g:
                how[i] = "touching"  # no hub seen: keep the disc centre, flag the possible nudge
        elif dense and len(assigned) >= 0.5 * len(g):
            used = [final[i] for i in assigned]
            for i in g:
                if i not in final:
                    hx, hy = min(used, key=lambda h: np.hypot(h[0] - P[i][0], h[1] - P[i][1]))
                    final[i] = (hx, hy)
                    how[i] = "fan-nearest-hub"
    num2idx = {}
    for k, v in readings[m].items():
        if v != "x" and not v.startswith("u:"):
            num2idx[int(v.rstrip("?"))] = k
    for (mm, num), act in MANUAL.items():
        if mm != m:
            continue
        k = num2idx[num]
        if act == "centre":
            final.pop(k, None)
            how[k] = "touching"
        else:
            t = num2idx[act[1]]
            final[k] = final[t]
            how[k] = "hub-manual"
    for g in groups.values():
        if len(g) > 1:
            for i in g:
                if i not in final:
                    how[i] = "touching"
    rep = dict(pins=n, numbered=0, uncertain=0, unreadable=0, skipped=0, hub=0, maxshift_official=0.0)
    vis = cv2.imread(f"{DL}/{m}.jpg")
    for i, p in enumerate(pins):
        v = readings[m].get(i)
        if v is None:
            raise SystemExit(f"missing reading {m} {i}")
        if v == "x":
            rep["skipped"] += 1
            continue
        if v.startswith("u:"):
            number, uncertain, alt = None, True, v[2:]
        else:
            number, uncertain, alt = int(v.rstrip("?")), v.endswith("?"), None
        gx, gy = final.get(i, (p["cx"], p["cy"]))
        ox, oy = to_off(m, gx, gy)
        dx, dy = to_off(m, p["cx"], p["cy"])
        shift = float(np.hypot(ox - dx, oy - dy))
        rep["maxshift_official"] = max(rep["maxshift_official"], shift)
        rep["numbered"] += number is not None
        rep["uncertain"] += bool(uncertain and number is not None)
        rep["unreadable"] += number is None
        rep["hub"] += i in final
        records.append(dict(map=m, layer=layer, det=p["id"], number=number, uncertain=uncertain, alt=alt,
                            gc=[round(p["cx"], 1), round(p["cy"], 1)], gc_final=[round(gx, 1), round(gy, 1)],
                            x=int(round(ox)), y=int(round(oy)), how=how.get(i, "disc-centre"),
                            fan_shift=int(round(shift)), pin_radius_official=int(round(r * scale))))
        col = (0, 0, 255) if i in final else (0, 255, 0)
        cv2.line(vis, (int(p["cx"]), int(p["cy"])), (int(gx), int(gy)), col, 1)
        cv2.circle(vis, (int(round(gx)), int(round(gy))), 2, col, -1)
    cv2.imwrite(f"{VIS}/{m}_final.png", vis)
    report[m] = rep
    print(m, layer, rep, file=sys.stderr)
json.dump(dict(records=records, report=report), open(OUTJ, "w"), indent=1)
