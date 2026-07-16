"""Arbitrary-precision oracle for the deep-tail Ljung-Box p-values.

WHY THIS EXISTS
---------------
R's pchisq(q, df, lower.tail = FALSE) loses relative accuracy far out in the
tail. Adjudicated 2026-07-16 against mpmath at 60 decimal places, feeding R's
OWN Ljung-Box statistic into both implementations (so the statistic is not a
confound - it agrees to 1e-16):

    case       exact (60dp)              R rel err   acf-pacf-math rel err
    nile lag3  2.5967769724029165e-11     5.297e-7   5.182e-17
    nile lag4  6.3825206335350885e-12     6.347e-6   2.790e-14
    nile lag5  1.831145354350254e-12      2.977e-5   2.715e-14
    nile lag6  4.9904358896570678e-13     3.328e-6   1.306e-14

acf-pacf-math wins every one. So below ~1e-10, R is NOT the oracle and the
harness must not gate against R's own tail noise. It gates against this file
instead, which is exact.

This never changes a displayed number (the page shows "< 0.001" long before
1e-10); it exists so the harness tests the truth rather than an artifact.

Regenerate: python Scripts/tool-truth/acf-pacf-deep-tail.py
"""
import json
import os

from mpmath import mp, mpf, gammainc, inf

mp.dps = 60
HERE = os.path.dirname(os.path.abspath(__file__))
CUTOFF = 1e-10  # below this, R's pchisq drifts; use the exact value

with open(os.path.join(HERE, "acf-pacf-calculator.json"), encoding="utf-8") as fh:
    truth = json.load(fh)

out = {}
for case in truth["cases"]:
    for entry in case["lb"]:
        p = entry["p"]
        if p is None or p >= CUTOFF:
            continue
        # Q(a, x) regularized == pchisq(2x, 2a, lower.tail = FALSE)
        a = mpf(entry["df"]) / 2
        x = mpf(repr(entry["stat"])) / 2
        exact = gammainc(a, x, inf, regularized=True)
        out["%s|%d" % (case["id"], entry["lag"])] = float(exact)

path = os.path.join(HERE, "acf-pacf-deep-tail.json")
with open(path, "w", encoding="utf-8") as fh:
    json.dump({"cutoff": CUTOFF, "dps": 60, "exact": out}, fh, indent=1)
print("deep-tail exact p-values:", len(out), "->", os.path.basename(path))
