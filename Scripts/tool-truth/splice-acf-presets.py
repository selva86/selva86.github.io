"""Splice the demo series into tools/lib/acf-pacf-calculator-ui.js FROM the R truth table.

WHY PROGRAMMATIC: a hand-typed preset is a fabricated preset. The series the page
ships must be byte-identical to the vectors R was verified on, or the E2E test is
comparing the page against numbers R never saw. So the arrays are written here,
straight out of Scripts/tool-truth/acf-pacf-calculator.json, and re-asserted after
the write.

Run: python Scripts/tool-truth/splice-acf-presets.py
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
TRUTH = os.path.join(HERE, "acf-pacf-calculator.json")
UI = os.path.join(ROOT, "tools", "lib", "acf-pacf-calculator-ui.js")

# The chips the page offers, in display order.
WANT = ["air", "lynx", "nile", "ar1", "ma1", "wn"]

with open(TRUTH, encoding="utf-8") as fh:
    truth = json.load(fh)


def js_num(v):
    """Render a float the way JS will read it back identically."""
    if v == int(v):
        return str(int(v))
    return repr(float(v))


parts = []
for key in WANT:
    vals = truth["series"][key]
    parts.append("    %s: [%s]" % (key, ",".join(js_num(v) for v in vals)))
block = "{\n" + ",\n".join(parts) + "\n  }"

with open(UI, encoding="utf-8") as fh:
    src = fh.read()

pat = re.compile(r"/\*__PRESETS_START__\*/.*?/\*__PRESETS_END__\*/", re.DOTALL)
if not pat.search(src):
    sys.exit("FATAL: preset markers not found in %s" % UI)
out = pat.sub("/*__PRESETS_START__*/" + block + "/*__PRESETS_END__*/", src)

with open(UI, "w", encoding="utf-8", newline="\n") as fh:
    fh.write(out)

# ---- assert byte-identity: parse the arrays back out and compare to R --------
written = pat.search(out).group(0)
written = written.replace("/*__PRESETS_START__*/", "").replace("/*__PRESETS_END__*/", "")
ok = True
for key in WANT:
    m = re.search(r"\b%s:\s*\[([^\]]*)\]" % key, written)
    if not m:
        print("MISMATCH %s: not written" % key)
        ok = False
        continue
    got = [float(x) for x in m.group(1).split(",")]
    want = [float(x) for x in truth["series"][key]]
    if got != want:
        print("MISMATCH %s: %d vs %d values, or values differ" % (key, len(got), len(want)))
        ok = False
    else:
        print("  %-5s %3d values, byte-identical to the R truth vector" % (key, len(got)))

if not ok:
    sys.exit("FATAL: spliced presets do not match the R truth table")
print("presets spliced and verified against R ->", os.path.relpath(UI, ROOT))
