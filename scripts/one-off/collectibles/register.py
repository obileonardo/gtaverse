# Code-only registration of Game Checklists maps to the official map pixel space.
# The official image is only read numerically here; it is never displayed.
import sys, json, cv2, numpy as np

DL, OFF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
OFF_W = 2310
SCALE = 5775 / OFF_W  # official_2310 px -> official full px

off = cv2.imread(f"{OFF}/official_{OFF_W}.png", cv2.IMREAD_GRAYSCALE)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
off_e = clahe.apply(off)
sift = cv2.SIFT_create(nfeatures=40000)
kp_o, des_o = sift.detectAndCompute(off_e, None)
print("official kps", len(kp_o), file=sys.stderr)

results = {}
for i in range(1, 13):
    name = f"m{i:02d}"
    img = cv2.imread(f"{DL}/{name}.jpg")
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Mask out saturated non-map overlays loosely: header box (top-left) and logo (bottom-right)
    mask = np.full((h, w), 255, np.uint8)
    mask[0:100, 0:600] = 0
    mask[h - 90:h, w - 330:w] = 0
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # upsample GC image 2x so its scale is closer to official_2310 (approx 2.0x)
    g2 = cv2.resize(g, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
    m2 = cv2.resize(mask, (w * 2, h * 2), interpolation=cv2.INTER_NEAREST)
    g2e = clahe.apply(g2)
    kp_g, des_g = sift.detectAndCompute(g2e, m2)
    bf = cv2.BFMatcher(cv2.NORM_L2)
    raw = bf.knnMatch(des_g, des_o, k=2)
    good = [m for m, n in raw if m.distance < 0.75 * n.distance]
    src = np.float32([kp_g[m.queryIdx].pt for m in good]) / 2.0  # GC px
    dst = np.float32([kp_o[m.trainIdx].pt for m in good]) * SCALE  # official px
    out = {"size": [w, h], "matches": len(good)}
    for model in ("similarity", "affine", "homography"):
        if model == "similarity":
            M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=15, maxIters=20000, confidence=0.999)
            H = np.vstack([M, [0, 0, 1]])
        elif model == "affine":
            M, inl = cv2.estimateAffine2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=15, maxIters=20000, confidence=0.999)
            H = np.vstack([M, [0, 0, 1]])
        else:
            H, inl = cv2.findHomography(src, dst, cv2.RANSAC, 15, maxIters=20000, confidence=0.999)
        inl = inl.ravel().astype(bool)
        p = cv2.perspectiveTransform(src[inl].reshape(-1, 1, 2), H).reshape(-1, 2)
        err = np.linalg.norm(p - dst[inl], axis=1)
        out[model] = {
            "H": H.tolist(), "inliers": int(inl.sum()),
            "rmse_official_px": float(np.sqrt((err ** 2).mean())),
            "median_official_px": float(np.median(err)),
            "p95_official_px": float(np.percentile(err, 95)),
        }
    sim = np.array(out["similarity"]["H"])
    out["similarity"]["scale"] = float(np.hypot(sim[0, 0], sim[1, 0]))
    out["similarity"]["rotation_deg"] = float(np.degrees(np.arctan2(sim[1, 0], sim[0, 0])))
    results[name] = out
    print(name, w, h, len(good), {k: (out[k]["inliers"], round(out[k]["rmse_official_px"], 1), round(out[k]["median_official_px"], 1)) for k in ("similarity", "affine", "homography")}, round(out["similarity"]["scale"], 4), round(out["similarity"]["rotation_deg"], 3), file=sys.stderr)

json.dump(results, open(OUT, "w"), indent=1)
