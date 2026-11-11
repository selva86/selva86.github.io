"""Print the conversion funnel and weekly signup cohorts from r-stats-prod.

The plan's Phase 0 asks for a baseline to be taken before anything is
regated, and for signup cohorts so a change can be told apart from
seasonality. This is that, as a repeatable command rather than a one-off
query, so the same numbers can be pulled again after each phase.

Usage, from the repo root:
    python Scripts/funnel_baseline.py              # funnel + cohorts
    python Scripts/funnel_baseline.py --weeks 20   # longer cohort window
    python Scripts/funnel_baseline.py --json       # machine-readable

Reads only. Requires wrangler to be logged in (it shells out to
`wrangler d1 execute --remote`), which is how every other script here
talks to D1.
"""
import argparse
import json
import subprocess
import sys

DB = "r-stats-prod"

# lesson_start only began recording in Nov 2026; before that the signal was
# accepted by /api/signal but never sent, so activation has no denominator
# for earlier cohorts. Say so rather than printing a misleading zero.
LESSON_START_FROM = "2026-11-11"


def q(sql):
    """Run one statement against the production database and return its rows."""
    out = subprocess.run(
        ["npx", "wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql],
        capture_output=True, shell=True,
    )
    try:
        d = json.loads(out.stdout.decode("utf-8", "replace"))
    except ValueError:
        sys.stderr.write(out.stdout.decode("utf-8", "replace")[-800:])
        sys.stderr.write(out.stderr.decode("utf-8", "replace")[-800:])
        raise SystemExit("could not parse wrangler output; is wrangler logged in?")
    if isinstance(d, dict) and d.get("error"):
        raise SystemExit("D1 error: %s" % json.dumps(d["error"])[:300])
    first = d[0] if isinstance(d, list) else d.get("result", [{}])[0]
    return first.get("results", [])


def one(sql, key, default=0):
    r = q(sql)
    return r[0].get(key, default) if r else default


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--weeks", type=int, default=12)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    users = one("SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL;", "n")
    pro = one("SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL "
              "AND pro_until IS NOT NULL AND pro_until > strftime('%s','now');", "n")

    sig = {r["signal"]: r for r in q(
        "SELECT signal, COUNT(DISTINCT COALESCE(user_id, anon_id)) AS people, "
        "COUNT(*) AS events FROM intent_signals GROUP BY signal;")}

    def people(name):
        return (sig.get(name) or {}).get("people", 0)

    funnel = [
        ("Signed up", users),
        ("Started a lesson", people("lesson_start")),
        ("Completed a lesson", people("lesson_complete")),
        ("Hit the Pro wall", people("pro_wall_hit")),
        ("Saw pricing", people("pricing_view")),
        ("Started checkout", people("checkout_start")),
        ("Purchased", people("purchase_client")),
        ("Pro right now", pro),
    ]

    print("FUNNEL  (distinct people, all time)")
    print("-" * 52)
    for label, n in funnel:
        print("  %-22s %8d" % (label, n))
    cs, pc = people("checkout_start"), people("purchase_client")
    pv = people("pricing_view")
    print()
    print("  pricing view -> checkout   %5.1f%%" % (100.0 * cs / pv if pv else 0))
    print("  checkout -> purchase       %5.1f%%" % (100.0 * pc / cs if cs else 0))
    print("  signup -> purchase         %5.2f%%" % (100.0 * pc / users if users else 0))
    ls = people("lesson_start")
    if ls:
        print("  signup -> lesson started   %5.1f%%" % (100.0 * ls / users if users else 0))
    else:
        print("  signup -> lesson started       n/a  (lesson_start ships %s)" % LESSON_START_FROM)

    print()
    print("OBJECTION WIDGET  (which answer people picked)")
    print("-" * 52)
    obj = q("SELECT meta AS reason, COUNT(DISTINCT COALESCE(user_id, anon_id)) AS people "
            "FROM intent_signals WHERE signal='objection' GROUP BY meta ORDER BY people DESC;")
    if obj:
        tot = sum(r["people"] for r in obj)
        for r in obj:
            print("  %-22s %8d  %5.1f%%" % ((r["reason"] or "(none)")[:22], r["people"],
                                            100.0 * r["people"] / tot if tot else 0))
    else:
        print("  no answers recorded yet")

    print()
    print("PRO WALL  (which lesson, top 10)")
    print("-" * 52)
    for r in q("SELECT path, COUNT(DISTINCT COALESCE(user_id, anon_id)) AS people "
               "FROM intent_signals WHERE signal='pro_wall_hit' GROUP BY path "
               "ORDER BY people DESC LIMIT 10;"):
        print("  %4d  %s" % (r["people"], (r["path"] or "(none)")[:44]))

    print()
    print("SIGNUP COHORTS  (last %d weeks)" % a.weeks)
    print("-" * 52)
    print("  %-12s %7s %9s %9s" % ("week of", "signups", "activated", "paid"))
    rows = q(
        "SELECT strftime('%%Y-%%m-%%d', created_at, 'unixepoch', 'weekday 1', '-6 days') AS wk, "
        "COUNT(*) AS signups, "
        "SUM(CASE WHEN pro_until IS NOT NULL AND pro_until > strftime('%%s','now') THEN 1 ELSE 0 END) AS paid "
        "FROM users WHERE deleted_at IS NULL AND created_at IS NOT NULL "
        "GROUP BY wk ORDER BY wk DESC LIMIT %d;" % a.weeks)
    act = {r["wk"]: r["n"] for r in q(
        "SELECT strftime('%Y-%m-%d', u.created_at, 'unixepoch', 'weekday 1', '-6 days') AS wk, "
        "COUNT(DISTINCT u.id) AS n FROM users u "
        "JOIN intent_signals s ON s.user_id = u.id AND s.signal='lesson_complete' "
        "WHERE u.deleted_at IS NULL GROUP BY wk;")}
    for r in rows:
        wk = r["wk"]
        print("  %-12s %7d %9d %9d" % (wk, r["signups"], act.get(wk, 0), r["paid"] or 0))

    if a.json:
        print()
        print(json.dumps({"funnel": dict(funnel), "objection": obj}, indent=1))


if __name__ == "__main__":
    main()
