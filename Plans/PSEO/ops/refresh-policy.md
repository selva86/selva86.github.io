# Ops Spec: Refresh Cadence and Calculator-Companion Pairing

Covers ops items 7, 9 (should-haves):
- `Scripts/refresh_audit.py` quarterly cadence
- Calculator + companion-post pairing playbook

---

## 1. Refresh cadence

### Why

PSEO pages (and tutorials in general) decay because:
- R packages evolve. dplyr 1.0+ broke gather/spread; tidyr/stringr ship breaking changes annually
- Code examples that ran at publish time may error on current package versions
- Search intent shifts (queries that mattered in 2024 may have lost volume by 2026)
- Competitors publish updated content, eroding ranking

Without a refresh cadence, pages quietly lose rankings while looking "evergreen" in the dashboard.

### Cadence

Every 12 months, every published PSEO post and every Core/FR/EX post is candidate for review.

Quarterly batches:
- Q1: posts published in Q1 of any prior year
- Q2: Q2 cohort
- Q3: Q3 cohort
- Q4: Q4 cohort

This spreads ~3,200 PSEO posts across 4 quarters: ~800 reviewed per quarter, ~200 per month.

### `Scripts/refresh_audit.py`

```bash
python Scripts/refresh_audit.py [--quarter Q1] [--year 2025]
python Scripts/refresh_audit.py --traffic-sorted [--limit 50]
```

#### Process

1. Read `programmatic-seo.json` + `curriculum-status.json`
2. Filter to posts where (a) `published_date` is >12 months old AND `last_reviewed` is null OR >12 months old, AND (b) match the quarter cohort filter
3. Sort by `traffic_30d` descending (high-traffic posts first; biggest impact if broken)
4. For each candidate, run automated checks:
   - WebR sanity: extract code blocks, run them, capture errors
   - Deprecated function detection: scan against `deprecated-functions.json` (curated list of dplyr 0.x → 1.x removals, etc.)
   - Broken internal links: check every `<a>` href resolves
   - Broken external links (sample): check 5 random outbound links
5. Output queue at `refresh-queue-<quarter>.csv`:

```csv
slug,traffic_30d,issues,severity,suggested_action
dplyr-spread-in-R,12450,"deprecated_function:spread","high","rewrite for pivot_wider"
ggplot-geom_smooth-in-R,3200,"none","none","skip"
arima-tutorial-in-R,8900,"webr_error:line_42","medium","fix code block"
```

6. Update `last_reviewed` on every audited post (so it's not re-audited next quarter)
7. For posts with severity `high` or `medium`, set `status="needs_refresh"` in tracker
8. Generate weekly digest email/markdown report (top 20 posts to refresh, sorted by traffic-loss-risk)

#### Severity rules

- `high`: deprecated function in core code block (page errors out for users)
- `medium`: deprecated function in side example, or 2+ minor warnings
- `low`: cosmetic only (e.g., screenshot from old IDE version)
- `none`: no issues detected

#### Output for the human

A dashboard at `Plans/PSEO/refresh-dashboard.md` (regenerated each quarter):

```markdown
# Q3 2026 Refresh Audit

Audited: 812 posts
Needs refresh (high): 24
Needs refresh (medium): 78
Clean: 710

Top 10 by impact (high-traffic + high-severity):
1. dplyr-spread-in-R (12,450 30d traffic) - rewrite for pivot_wider
2. ...
```

#### Refresh execution

For each post in `needs_refresh`:
- Re-run `/write-pseo-v2` against the original frontmatter, allowing the skill to refresh stale code/text
- `/publish-post` runs as normal; updates `last_modified`, sets `status="published"` again

### Frequency cap

A post can flip into `needs_refresh` at most once per 6 months. Prevents high-churn posts from cycling through endless refreshes.

---

## 2. Calculator + companion-post pairing playbook

### Why

A standalone calculator captures **transactional intent** ("p value calculator") but loses out on **informational intent** ("how to calculate p value", "what does p value mean"). Both queries deserve a page; both rank for different keywords; both link back to your tools surface.

Pairing every calculator with a 1500-word companion explainer doubles the SERP real estate per topic.

### Per-pair structure

| Asset | URL | Captures | Word count |
|---|---|---|---|
| Calculator | `/tools/<slug>.html` | transactional, "calculator" intent | minimal text + interactive UI |
| Companion | `/<Slug-Capitalized>-Calculator-Guide.html` | informational, "how to calculate", "what does X mean" | 1500 +/- 200 |

### Companion post template

```yaml
---
title: <Full Calculator Name>: Formula, Interpretation, and How to Calculate
slug: <Slug-Capitalized>-Calculator-Guide
description: <150-160 char>
keywords: <keyword>, calculator, formula, how to calculate, interpretation
mathjax: true
webr: true
post_type: C
sidebar_section: Statistics  # or relevant section
sidebar_title: <Short Calculator Guide>
sidebar_order: <next>
auto_link_terms: <keyword>|<related terms>
---

# <Full Calculator Name>: Formula, Interpretation, and How to Calculate

> Try the interactive [<Calculator Name>](/tools/<slug>.html) to compute it instantly.

## What is X
## Formula
## How to calculate (manual + R code)
## Interpretation
## Worked example (matches calculator's default inputs)
## Common mistakes
## Related calculators
## FAQ

> Ready to compute? Use the [<Calculator Name>](/tools/<slug>.html) above.
```

### Cross-linking rules

**Calculator -> Companion:**
- Hero block at top of calculator: "Learn the formula and interpretation in our X Calculator Guide"
- Footer block: "Read the full X Calculator Guide for detailed explanation"

**Companion -> Calculator:**
- Above-the-fold callout: "Skip the math. Try the X Calculator instantly"
- After "Worked example": embedded calculator iframe or screenshot + button
- Footer: "Try the calculator with your own values"

### Schema implication

- Calculator emits `SoftwareApplication` JSON-LD
- Companion emits `Article` + `HowTo` JSON-LD
- Both reference each other via `mainEntityOfPage` and `relatedLink`

### Build order

For new calculators, **always ship the companion first** if possible. Reasoning: the companion ranks for higher-volume informational keywords; once it ranks, it drives organic traffic that finds the calculator. Calculator alone takes longer to rank because transactional queries are dominated by big aggregators (calculator.net, gigacalculator.com, etc.).

For the existing 28 live calculators: backfill companions during Wave 1 (months 3 to 5 of the roadmap). One companion per week initially, prioritized by current calculator traffic.

### Tracking

- Calculator tracked in `Plans/PSEO/asset-tracker.json` (under `calculators`)
- Companion tracked in `curriculum-status.json` (post_type=C)
- Cross-reference field `companion_post_slug` in calculator entry, `paired_calculator_slug` in companion frontmatter
- `Scripts/orphan_check.py` (new) flags any calculator without a companion or vice versa

### Quality bar (companion)

- Word count 1300 to 1700
- ≥ 1 R code block (showing manual computation matching calculator's default inputs)
- ≥ 1 visual (formula diagram via Mermaid + LaTeX, or worked-example chart)
- FAQ with 5+ questions
- Cross-links: parent post + calculator + ≥ 3 related calculators + ≥ 3 related FR posts
- Schema: `Article` + `HowTo` JSON-LD validated

### Maintenance

Companion posts are subject to the standard 12-month refresh cadence. Calculators are subject to a separate **calculator-specific refresh** that checks UI dependencies (React versions, calculator-specific JS libraries) and runs every 6 months due to higher front-end churn.
