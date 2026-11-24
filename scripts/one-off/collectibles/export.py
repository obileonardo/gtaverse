# Write content/collectibles.json from compiled.json, reg.json and gridcheck.json.
import sys, json
OUT = sys.argv[1]
c = json.load(open("compiled.json"))
reg = json.load(open("reg.json"))
grid = json.load(open("gridcheck.json"))
VIA = "https://x.com/Sksj002/status/2124675198209364423"
MAPS = ["m01", "m02", "m03", "m04", "m05", "m06", "m07", "m08", "m09", "m10", "m11", "m12"]
SINGULAR = {
    "card-sets": "Card set", "cocaine-flamingos": "Cocaine flamingo", "drone-time-trials": "Drone time trial",
    "fishing": "Fishing spot", "kitty-litter-labs": "Kitty litter lab", "magazines-books-comics": "Magazine, book or comic",
    "meditation-spots": "Meditation spot", "meteorites": "Meteorite", "payday-loan-jobs": "Payday loan job",
    "shops": "Shop", "stunts": "Stunt", "tattoo-studios": "Tattoo studio",
}
MARKED = {"card-sets": (102, 480), "cocaine-flamingos": (8, 22), "drone-time-trials": (42, 42), "fishing": (35, 41),
          "kitty-litter-labs": (12, 13), "magazines-books-comics": (25, 36), "meditation-spots": (10, 10), "meteorites": (11, 11),
          "payday-loan-jobs": (7, 7), "shops": (234, 261), "stunts": (397, 397), "tattoo-studios": (9, 11)}

layers, items = [], []
for k, m in enumerate(MAPS, 1):
    recs = [r for r in c["records"] if r["map"] == m]
    layer = recs[0]["layer"]
    s = reg[m]["similarity"]
    marked, total = MARKED[layer]
    photo = f"{VIA}/photo/{k}"
    layers.append({
        "layer": layer,
        "source_image": photo,
        "image_px": reg[m]["size"],
        "marked": marked,
        "total": total,
        "transcribed": len(recs),
        "numbers_unreadable": sum(r["number"] is None for r in recs),
        "numbers_uncertain": sum(bool(r["uncertain"]) and r["number"] is not None for r in recs),
        "registration": {
            "model": "similarity",
            "scale_official_px_per_source_px": round(s["scale"], 4),
            "rotation_deg": round(s["rotation_deg"], 4),
            "inliers": s["inliers"],
            "rmse_px": round(s["rmse_official_px"], 2),
            "grid_offset_px": round(grid[m]["mean_abs_official_px"], 1),
        },
        "pin_radius_px": recs[0]["pin_radius_official"],
    })
    for r in sorted(recs, key=lambda r: (r["number"] is None, r["number"] or 0, r["det"])):
        notes = []
        rad = r["pin_radius_official"]
        if r["number"] is None:
            notes.append(f"Number unreadable on the source image (reads like {r['alt']}).")
        elif r["uncertain"]:
            notes.append("Number hard to read on the source image; it may be wrong.")
        if r["how"] in ("hub-leg", "hub-adjacent", "group-hub", "fan-nearest-hub", "hub-manual"):
            notes.append(f"Fanned out with nearby pins on the source map; placed at the shared spot they point to ({r['fan_shift']} px from its drawn pin).")
        elif r["how"] == "touching":
            notes.append(f"Touches other pins on the source map, so it may have been nudged by up to one pin width (about {2 * rad} px).")
        num = r["number"]
        ident = f"{layer}-{num}" if num is not None else f"{layer}-unread-{r['det'].split('-')[1]}"
        items.append({
            "id": ident,
            "layer": layer,
            "number": num,
            "pin": {"x": r["x"], "y": r["y"]},
            "pin_accuracy": "transcribed",
            "label": f"{SINGULAR[layer]} {num}" if num is not None else f"{SINGULAR[layer]} (number unreadable)",
            "source": {"name": "Game Checklists", "url": photo, "via": VIA},
            "verification": "single-source",
            "notes": " ".join(notes) or None,
        })

doc = {
    "about": "Collectible locations transcribed from the 12 Game Checklists collectible maps reposted by @Sksj002 on X (owner exception of 24 Nov 2026, docs/DECISIONS.md C1). Their pins are their work and every item credits them. Positions are pixels of the official map image (docs/MAP.md). How they were made: docs/MAP.md, Collectible layers.",
    "transcribed": "2026-11-24",
    "method": "Each source map was registered to the official image by SIFT feature matching and a RANSAC similarity transform, computed in code without viewing the official image. Pin discs were found by colour and shape in code; numbers were read by eye from the source maps; pins the source fanned out around a shared spot were moved back to that spot.",
    "layers": layers,
    "items": items,
}
json.dump(doc, open(OUT, "w"), indent=2, ensure_ascii=False)
open(OUT, "a").write("\n")
print(len(items), "items")
