# Ops Spec: PSEO Pipeline

Covers ops items 1, 2, 3, 4, 8 (must-haves):
- `/write-pseo-v2` skill
- `Scripts/validate_pseo.py` (demand-validation pre-flight)
- `Scripts/pseo_batch.py` and `Scripts/pseo_publish_batch.py` (batch orchestrator)
- `slug_registry` dedupe gate
- `Scripts/pseo_quality_check.py` (PSEO-specific quality gate)

---

## 1. `/write-pseo-v2` skill

**Replaces:** `/write-pseo` (the existing skill at `.claude/skills/write-pseo/`).
**Throughput target:** 6 to 8 minutes per post (vs ~25 minutes for current `/write-post-interactive`).
**Operating constraint:** sequential only (per `feedback_no_parallel_agents`).

### Inputs
- `category_id` (one of the 14 PSEO categories)
- `subcategory_id`
- `slug` (already validated by `validate_pseo.py`)
- `target_keyword`
- `parent_post_slug`

### Process (per post)

1. Look up category template from `_build/pseo-templates/<category_id>.yaml`
2. Read parent post for context (1 file)
3. Look up sibling posts in same series for cross-link candidates
4. Generate post content in single LLM pass:
   - Title (under 60 chars, includes target keyword)
   - Slug (validated against slug_registry already)
   - Meta description (150 to 160 chars)
   - H1 + lead paragraph (snippet-friendly)
   - 4 sections per template
   - 1 R code block (sanity-checked via WebR run)
   - 1 visual placeholder (Mermaid diagram for [C]-style cats; data viz for chart-type)
   - FAQ with 3 to 5 questions
5. Apply em-dash sanitizer (per `project_em_dash_sanitizer`) inline before save
6. Write to `posts/<slug>.md` with full frontmatter (incl `category_id`, `subcategory_id`, `fr_parent`, `auto_link_terms`)

### Per-category outline templates

Stored under `_build/pseo-templates/` as YAML:

```yaml
# _build/pseo-templates/function-deep.yaml
sections:
  - heading: "What is `<function>()` in R?"
    word_target: 100
  - heading: "Syntax"
    type: signature_block
  - heading: "Arguments"
    type: arguments_table
  - heading: "Examples"
    word_target: 400
    structure: 4_examples_runnable
  - heading: "Common pitfalls"
    word_target: 200
  - heading: "Related functions"
    type: cross_link_block
  - heading: "FAQ"
    word_target: 200
faq_seed_questions: 3
auto_link_terms_format: "<function>(), <function>"
```

14 templates total, one per category.

### Frontmatter contract

Every PSEO post written by this skill has:

```yaml
---
title: <SEO title under 60 chars>
slug: <validated slug>
description: <150-160 char meta desc>
keywords: <comma-separated>
mathjax: false
webr: true
date: <ISO>
post_type: PSEO
category_id: <one of 14>
subcategory_id: <subcategory>
fr_parent: <parent-slug.html>
auto_link_terms: <pipe-separated>
auto_link_case_sensitive: false
target_keyword: <primary keyword>
sibling_block_enabled: true
---
```

### Quality gate before save

Skill calls `Scripts/pseo_quality_check.py` against the in-memory draft. If the gate fails, the skill regenerates only the failing section, up to 1 retry. Two consecutive failures abort the post and log to `pseo-failures.log`.

---

## 2. `Scripts/validate_pseo.py` (demand-validation pre-flight)

**Purpose:** reject duds before writing. Saves ~3-5 hours per dud.

### Usage

```bash
python Scripts/validate_pseo.py <slug>
python Scripts/validate_pseo.py --batch queue.csv
```

### Gates (all must pass)

1. **Suggest gate:** `target_keyword` returns at least 1 result from Google Suggest API (proxy for "people search this")
2. **PAA gate:** at least 3 People-Also-Ask questions exist for the keyword (scraped via SerpApi or AlsoAsked API)
3. **SERP-domination gate:** of top-10 SERP results, fewer than 5 are from {reddit.com, stackoverflow.com, stackexchange.com, quora.com}. If >5, abort: Google rewards forum content for this query, educational content will not rank.
4. **Dedupe gate:** slug not in `slug_registry`, not in `curriculum-status.json`, not as `<slug>.html` at root.
5. **Sibling gate:** the slug is meaningfully different from siblings in same series (Levenshtein distance >5 from any sibling).

### Output

JSON record written to `programmatic-seo.json` under the post's `demand_validated` field:

```json
{
  "demand_validated": {
    "date": "2026-05-12T14:30:00Z",
    "suggest_pass": true,
    "paa_pass": true,
    "serp_pass": true,
    "dedupe_pass": true,
    "sibling_pass": true,
    "decision": "pass",
    "notes": ""
  }
}
```

If `decision: "fail"`, the `notes` field captures the failure reason; the post is moved to `programmatic-seo.json#rejected_slugs`.

### Dependencies

- `requests` (Python stdlib supplemental)
- API keys for SerpApi or DataForSEO (stored in `.env`, not committed)
- Optional fallback: scrape Google Suggest via simple HTTP if no API key (lower reliability, rate-limited)

---

## 3. Batch orchestrator

### `Scripts/pseo_batch.py`

**Purpose:** generate N posts sequentially from a queue.

```bash
python Scripts/pseo_batch.py queue.csv [--dry-run] [--limit N] [--category C]
```

Queue CSV columns:
```csv
slug,category_id,subcategory_id,target_keyword,parent_post_slug
```

Process:
1. Read queue
2. For each row: run `validate_pseo.py`; if pass, dispatch to `/write-pseo-v2` skill; if fail, log and skip
3. Write generated `.md` to `posts/<slug>.md`
4. Stage in `pseo-batch-staging/<batch-id>/` for human review
5. On completion: print summary (passed validation, drafted, failed)

Failures don't abort the batch; they're logged and skipped. Sequential per agent rule.

### `Scripts/pseo_publish_batch.py`

After human review:
```bash
python Scripts/pseo_publish_batch.py <batch-id> [--dry-run]
```

Process:
1. Read all `.md` files from `pseo-batch-staging/<batch-id>/`
2. For each: run existing `/publish-post` (md2html → fragment → status update → build → commit)
3. Aggregate publishes into a single git commit (avoids 100s of micro-commits): `chore(pseo): publish batch <batch-id> (N posts)`
4. Push once at end of batch

---

## 4. `slug_registry` dedupe gate

**Storage:** top-level `slug_registry` array in `www/programmatic-seo.json`:

```json
{
  "slug_registry": [
    "dplyr-select-in-R",
    "dplyr-filter-in-R",
    "..."
  ],
  "rejected_slugs": [
    {"slug": "...", "reason": "duplicate of dplyr-select-in-R", "date": "..."}
  ],
  "category_meta": { ... },
  "series": [ ... ]
}
```

### Sync behavior

- `validate_pseo.py` reads `slug_registry` and rejects any new slug already in the array
- `/publish-post` adds the slug to `slug_registry` after successful publish
- `Scripts/sync_registries.py` (existing) extends to keep `slug_registry` in sync with actual published posts on disk; flags drift (registered but no file, or file but not registered)

### Hooks

Add a pre-commit hook (project-local, not global):

```bash
# .git/hooks/pre-commit
#!/bin/sh
python Scripts/sync_registries.py --check-slug-registry || exit 1
```

If commit would introduce a new HTML file at root not registered in `slug_registry`, reject.

---

## 5. `Scripts/pseo_quality_check.py`

**Purpose:** block publish if PSEO post fails quality bar.

### Usage

```bash
python Scripts/pseo_quality_check.py posts/<slug>.md
python Scripts/pseo_quality_check.py --all  # checks every PSEO post in posts/
```

### Checks (all must pass for status=publishable)

| # | Check | Threshold |
|---|---|---|
| 1 | Word count | 800 ≤ N ≤ 1500 |
| 2 | R code blocks | ≥ 1 |
| 3 | Code blocks runnable | WebR session executes them without error |
| 4 | Visual present | ≥ 1 image, table, or Mermaid diagram |
| 5 | Internal-link candidates | ≥ 5 terms in `auto_link_terms` registry |
| 6 | FAQ section | H2 or H4 named "FAQ" with ≥ 3 question/answer pairs |
| 7 | Em-dash clean | zero U+2014 characters in body |
| 8 | Frontmatter complete | all 16 required fields present |
| 9 | Title length | ≤ 60 chars |
| 10 | Meta description length | 150 ≤ N ≤ 160 chars |
| 11 | Parent post exists | `fr_parent` resolves to a published HTML file |
| 12 | Slug matches frontmatter | filename slug == frontmatter slug |
| 13 | Sibling references | `inject_sibling_block()` candidate count ≥ 3 |

### Output

```
PASS: posts/dplyr-select-in-R.md (13/13)

FAIL: posts/dplyr-filter-in-R.md (10/13)
  - Check 1 (word count): 723 (below 800)
  - Check 5 (internal-link candidates): only 3 found (need 5+)
  - Check 7 (em-dash): 4 em-dashes detected at lines 12, 45, 67, 89
```

Exit code: 0 if all pass, 1 if any fail. CI / hooks use exit code.

### Integration

- Called by `/write-pseo-v2` against the in-memory draft
- Called by `/publish-post` Step 1.5 (between locate-md and convert-to-html)
- Called by `pseo_batch.py` after generation, before staging
- Called by `pseo_publish_batch.py` at start, before any publish action
