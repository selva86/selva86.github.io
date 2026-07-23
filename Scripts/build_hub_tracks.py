# Build www/hub-tracks.json: exercise-hub slug -> human track label.
# Sources: curriculum-status.json (EX posts per learning path; gitignored, so
# read from the main checkout when absent locally) + courses.json (lesson hubs
# via roadmap.trackLabel). Committed like other registries; profile pages read
# it to render "Skills by track" without any per-request scanning.
# Output lives in functions/_data/ so wrangler bundles it into the Worker.
import json, os, sys

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

cj = json.load(open(os.path.join(HERE, "courses.json"), encoding="utf-8"))
for c in cj.get("courses", []):
    tl = (c.get("roadmap") or {}).get("trackLabel") or "Courses"
    for l in c.get("lessons", []):
        if l.get("slug"):
            out[l["slug"]] = tl

dst = os.path.join(HERE, "functions", "_data", "hub-tracks.json")
json.dump(out, open(dst, "w", encoding="utf-8"), indent=0, sort_keys=True)
print("wrote", dst, "|", len(out), "hub mappings")
