# RESUME — Per-block code-box titles backfill

**Read this file first if you are a fresh Claude context picking up this task.**

## TL;DR

We are adding a short one-line `title="…"` attribute to every interactive R code box across r-statistics.co so the dark header bar shows something more useful than the current hardcoded "Interactive R". The rendering pipeline already supports this; the work is content generation + applier + rebuild.

## Where we are RIGHT NOW

- Plan approved (see `PLAN.md`).
- `_build/extract_code_blocks.py` exists and has already been run → `_build/code_blocks.json` is the source-of-truth manifest (256 webr-enabled posts, 6,839 R blocks).
- `_build/apply_code_titles.py` exists (deterministic write-back script with `--dry-run` + `--slug`).
- `.claude/skills/write-post-interactive-v3/SKILL.md` updated so future posts author `title="…"` from day one.
- `www/webr.css` polish applied (label color bump + ellipsis clamp + mobile fix).
- **Pilot done:** 3 posts, 75 titles in `_build/code_titles.json` — `R-Functions`, `Pie-Donut-Chart-in-R`, `Binomial-Distribution-Exercises-in-R`. **User has reviewed style and it was accepted** (see `title_style.md`).
- **Remaining:** 253 posts, 6,764 blocks to title. **4 zero-block posts skipped** (listed in `batch_order.json`).
- **Not yet done:** rollback tag `version-C-pre-code-titles`, dry-run of applier, live apply, md2html on changed markdowns, build.py, spot-check, commit.

## Single-source-of-truth files

| File | Role |
|---|---|
| `_build/code_blocks.json` | **Input.** Every block's source location + context. Read-only during generation. |
| `_build/code_titles.json` | **Output.** Growing dict `{slug: {block_idx: title}}`. Resuming = check which slugs are present. |
| `Plans/codeblocktitles/progress.json` | **Coordination.** Machine-readable: what's done, what's next. Updated after every batch. |
| `Plans/codeblocktitles/batch_order.json` | **Static ordering.** Pre-computed slug order (ascending block count). |
| `Plans/codeblocktitles/batch_log.md` | **Append-only log.** Each batch writes one entry. |

## Resume protocol (do this on every fresh wake-up)

1. **Read this file** (`RESUME.md`) first.
2. **Read `progress.json`** — gives current numbers.
3. **Read `title_style.md`** — style rules (3–6 words, "Your turn: …" for starters, "… solution" for solutions, etc.).
4. **Sanity-check by running:**
   ```bash
   cd D:/09_rstatisticsco/selva86.github.io
   python Plans/codeblocktitles/_progress.py
   ```
   This re-reads `_build/code_titles.json` and prints authoritative progress. If it disagrees with `progress.json`, trust `_build/code_titles.json` (the file that actually gets applied) and resync `progress.json`.
5. **Pick the next batch:** take the first N un-titled slugs from `batch_order.json`. Recommended batch size: 8–12 posts (~200–350 blocks) per turn.
6. **Generate + merge + log:** follow `protocol.md`.
7. **When `_build/code_titles.json` covers every non-zero-block slug**, move to the "Apply phase" in `PLAN.md` §Execution.

## How to know the task is complete

```python
python -c "import json; b=json.load(open('_build/code_blocks.json',encoding='utf-8')); t=json.load(open('_build/code_titles.json',encoding='utf-8')); need={s for s,e in b.items() if e['blocks']}; have=set(t); print('done' if need<=have else f'missing {len(need-have)}: {sorted(need-have)[:5]}')"
```

When that prints `done`, the generation phase is over. Then execute the Apply phase.

## If something is confusing

- The plan's original rationale lives in `PLAN.md`.
- The exact fence syntax md2html.py expects lives in `_build/md2html.py` function `extract_block_title` (lines ~55-64). The applier writes fences that match this regex.
- Edge cases are enumerated in `PLAN.md` §Edge cases considered.
- Skip any slug listed in `batch_order.json`→`zero_block_skip`.
