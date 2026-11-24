# Find the faint grid lines in each Game Checklists image (column/row brightness ridges),
# map them to official pixels and compare with content/map.json grid lines.
import sys, json, cv2, numpy as np
DL, MAPJ = sys.argv[1], sys.argv[2]
reg = json.load(open("reg.json"))
g = json.load(open(MAPJ))["grid"]
xs_ref = [c["x0"] for c in g["columns"]][1:]          # interior vertical lines
ys_ref = [r_["y0"] for r_ in g["rows"]][1:]
out = {}
for i in range(1, 13):
    m = f"m{i:02d}"
    img = cv2.imread(f"{DL}/{m}.jpg", cv2.IMREAD_GRAYSCALE).astype(np.float32)
    H = np.array(reg[m]["similarity"]["H"])
    Hi = np.linalg.inv(H)
    s = reg[m]["similarity"]["scale"]
    errs = []
    for axis, refs in (("x", xs_ref), ("y", ys_ref)):
        for ref in refs:
            # predicted position in GC image
            if axis == "x":
                pts = np.array([[[ref, yy]] for yy in np.linspace(400, 7500, 60)], float)
            else:
                pts = np.array([[[xx, ref]] for xx in np.linspace(400, 5400, 60)], float)
            q = cv2.perspectiveTransform(pts, Hi).reshape(-1, 2)
            best = []
            for off in np.arange(-6, 6.01, 0.25):
                vals = []
                for (qx, qy) in q:
                    x, y = (qx + off, qy) if axis == "x" else (qx, qy + off)
                    if 2 <= x < img.shape[1] - 2 and 2 <= y < img.shape[0] - 2:
                        c = cv2.getRectSubPix(img, (1, 1), (x, y))[0, 0]
                        if axis == "x":
                            sd = (cv2.getRectSubPix(img, (1, 1), (x - 3, y))[0, 0] + cv2.getRectSubPix(img, (1, 1), (x + 3, y))[0, 0]) / 2
                        else:
                            sd = (cv2.getRectSubPix(img, (1, 1), (x, y - 3))[0, 0] + cv2.getRectSubPix(img, (1, 1), (x, y + 3))[0, 0]) / 2
                        vals.append(c - sd)
                best.append((np.median(vals) if vals else -1e9, off))
            sc, off = max(best)
            errs.append(off * s)  # official px
    errs = np.array(errs)
    out[m] = dict(mean_abs_official_px=float(np.mean(np.abs(errs))), max_abs_official_px=float(np.max(np.abs(errs))))
    print(m, "grid offset vs our grid: mean |d| %.1f px, max %.1f px (official)" % (out[m]["mean_abs_official_px"], out[m]["max_abs_official_px"]))
json.dump(out, open("gridcheck.json", "w"), indent=1)
