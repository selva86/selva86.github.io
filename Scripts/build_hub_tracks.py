# Build functions/_data/hub-tracks.json: exercise-hub slug -> human track label.
# Sources, in order:
#   1. curriculum-status.json (EX + C posts per learning path; gitignored, so
#      read from the main checkout when absent locally)
#   2. orphan EX fragments (_posts/*.html outside the curriculum tracker)
#      inherit the track of their fr_parent post when that parent is mapped
#   3. courses.json (lesson hubs via roadmap.trackLabel)
# Output lives in functions/_data/ so wrangler bundles it into the Worker.
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CURR = os.path.join(HERE, "curriculum-status.json")
if not os.path.exists(CURR):
    CURR = r"D:\09_rstatisticsco\selva86.github.io\curriculum-status.json"

PATH_LABEL = {
    "learn-r": "Learn R", "data-wrangling": "Data Wrangling",
    "visualization": "Visualization", "statistics": "Statistics",
    "time-series": "Time Series", "machine-learning": "Machine Learning",
    "advanced-r": "Advanced R", "reporting": "Reporting",
    "specializations": "Specializations",
}

out = {}

cs = json.load(open(CURR, encoding="utf-8"))
for pk, p in cs.get("paths", {}).items():
    label = PATH_LABEL.get(pk.strip("/"), pk.strip("/").replace("-", " ").title())
    for sk, s in p.get("sub_paths", {}).items():
        for post in s.get("posts", []):
            slug = post.get("slug")
            if slug and post.get("type") in ("EX", "C"):
                out[slug] = label

# Pass 2: orphan EX hubs inherit their fr_parent's track.
FM = re.compile(r"^---\s*\n(.*?)\n---", re.S)
PARENT = re.compile(r'fr_parent:\s*"?([A-Za-z0-9._-]+?)(?:\.html)?"?\s*$', re.M)
added_orphans = 0
for frag in glob.glob(os.path.join(HERE, "_posts", "*.html")):
    slug = os.path.splitext(os.path.basename(frag))[0]
    if slug in out:
        continue
    try:
        head = open(frag, encoding="utf-8", errors="ignore").read(4000)
    except OSError:
        continue
    m = FM.search(head)
    if not m:
        continue
    fm = m.group(1)
    if 'post_type: "EX"' not in fm and "post_type: EX" not in fm:
        continue
    pm = PARENT.search(fm)
    if pm and pm.group(1) in out:
        out[slug] = out[pm.group(1)]
        added_orphans += 1

cj = json.load(open(os.path.join(HERE, "courses.json"), encoding="utf-8"))
for c in cj.get("courses", []):
    tl = (c.get("roadmap") or {}).get("trackLabel") or "Courses"
    for l in c.get("lessons", []):
        if l.get("slug"):
            out[l["slug"]] = tl

dst = os.path.join(HERE, "functions", "_data", "hub-tracks.json")
json.dump(out, open(dst, "w", encoding="utf-8"), indent=0, sort_keys=True)
print("wrote", dst, "|", len(out), "hub mappings |", added_orphans, "orphans via fr_parent")
