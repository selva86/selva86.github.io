# Per-turn protocol

This is the exact procedure for generating titles during one turn of in-session work. Follow this every time you resume.

## Step 1 — Orient

```bash
cd D:/09_rstatisticsco/selva86.github.io
python Plans/codeblocktitles/_progress.py
```

Note the count of completed vs remaining posts.

## Step 2 — Pick the next batch

Open `Plans/codeblocktitles/batch_order.json`. Walk `ordered_remaining` top-to-bottom, skipping any slug already present as a key in `_build/code_titles.json`. Take the first **8–12 slugs** (≈200–350 blocks). Larger batches when context budget is healthy; smaller when it's tight.

## Step 3 — Read the block context for those slugs

Extract just the slugs you picked into a staging file so you don't thrash the main manifest:

```bash
python Plans/codeblocktitles/_stage_batch.py SLUG1 SLUG2 SLUG3 ...
```

This writes `Plans/codeblocktitles/_staging/batch.json` containing per-block `{index, h2_above, prose_above (200 chars), code (400 chars), is_tryit_starter, is_solution, fence_info}` for the chosen slugs only. Read that file.

## Step 4 — Generate titles

For each block in the staged batch, produce one title that satisfies `title_style.md`. Key rules:

- `is_tryit_starter: true` → `Your turn: <short action>`
- `is_solution: true` → `<subject> solution`, or `Exercise N solution` if the surrounding section is a numbered exercise
- Numbered exercises (`Exercise N:` in `h2_above`) → `Exercise N: <subject>` for the starter
- 3–8 words, sentence case, no trailing punctuation
- No smart quotes, em-dashes, or HTML

## Step 5 — Merge into `_build/code_titles.json`

Do not overwrite; read-modify-write. Preserve existing keys. Use this helper:

```bash
python Plans/codeblocktitles/_merge.py <path-to-patch.json>
```

Where `patch.json` is a dict shaped like `{slug: {"0": "Title", "1": "Title", ...}}` — just the new slugs you generated. The helper refuses to overwrite an existing block-level title unless `--force` is passed.

## Step 6 — Update progress + log

```bash
python Plans/codeblocktitles/_progress.py --save
```

This rewrites `progress.json` from the authoritative `code_titles.json` state, and appends one line to `batch_log.md`:

```
2026-04-17T22:30:15 | batch 4 | +9 posts, +214 blocks | cumulative 18/256 posts, 489/6839 blocks
```

## Step 7 — Hand-off snapshot (every batch)

After the log entry, also write a short hand-off note at the bottom of `progress.json` under `last_notes` summarising anything non-obvious from this batch (e.g. "Post X had 3 blocks with empty prose; inferred titles from code").

## When you have done all 253 non-zero-block remaining posts

All slugs with blocks are covered. Switch to the **Apply phase** in `PLAN.md` §Execution:

1. Create rollback tag `version-C-pre-code-titles` and push.
2. `python _build/apply_code_titles.py --dry-run` — review summary.
3. `python _build/apply_code_titles.py` — live apply.
4. `python _build/md2html.py` on every slug in `_build/.changed_slugs.txt`.
5. `python _build/build.py`.
6. Spot-check 5 pages in browser.
7. Commit + push.
