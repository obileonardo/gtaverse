import sys, glob, json, collections
TOT = {"m10": 261, "m11": 397}
for m in ("m10", "m11"):
    rows = []
    for f in sorted(glob.glob(f"read2_{m}*.txt")):
        for line in open(f):
            if line.strip():
                i, v = line.split()
                rows.append((i, v))
    ids = [i for i, _ in rows]
    assert len(ids) == len(set(ids)), "dup idx"
    nums = [(i, v.rstrip("?"), v.endswith("?")) for i, v in rows if v != "x"]
    c = collections.Counter(n for _, n, _ in nums)
    dup = {n: [(i, q) for i, nn, q in nums if nn == n] for n, k in c.items() if k > 1}
    have = set(int(n) for n in c)
    missing = [k for k in range(1, TOT[m] + 1) if k not in have]
    out = [n for n in have if n > TOT[m]]
    print(m, "rows", len(rows), "pins", len(nums), "unique", len(c), "uncertain", sum(q for *_, q in nums))
    print("  dups", dup)
    print("  missing", missing, "out of range", out)
