"""One-off: strip bogus 'are' -> ARE auto-links from all HTML files.

Pattern: <a class="auto-link" href="Asymptotic-Relative-Efficiency-in-R.html" title="...">are</a>
Replaces only the lowercase 'are' (the regression). Legitimate 'asymptotic relative efficiency'
phrase links use the full phrase as the visible text and are preserved.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Match the bad 'are' link only; do NOT touch links whose visible text is the legit phrase.
BAD = re.compile(
    r'<a class="auto-link" href="Asymptotic-Relative-Efficiency-in-R\.html" title="[^"]*">are</a>',
    re.IGNORECASE,
)

def clean(text):
    return BAD.sub("are", text)

def walk():
    targets = list(ROOT.glob("*.html")) + list((ROOT / "_posts").glob("*.html"))
    cleaned = 0
    for p in targets:
        try:
            t = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        nt = clean(t)
        if nt != t:
            p.write_text(nt, encoding="utf-8")
            cleaned += 1
    return cleaned, len(targets)

if __name__ == "__main__":
    n, total = walk()
    print(f"cleaned {n} files of {total} scanned")
