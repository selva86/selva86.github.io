# PLAN — Per-block code-box titles across r-statistics.co

*This is the approved plan, preserved for resume. The original lives at*
*`C:\Users\DELL\.claude\plans\temporal-sleeping-squirrel.md`. If that file and*
*this one diverge, this one (committed in-repo) is authoritative.*

---

## Goal

Every interactive R code box on r-statistics.co should show a short, specific
one-line title in its dark header bar instead of the hardcoded "Interactive R"
label. Also: every new post authored via `/write-and-publish-v2` going forward
must include titles from day one.

## Why this is cheap

The rendering pipeline already supports per-block titles. `_build/md2html.py`:

- `extract_block_title(info_str)` (lines ~55-64) — parses `title="…"` off the
  fence info string.
- `webr_container_html(ecode, title_attr, block_title)` (lines ~68-94) — emits
  `<div class="webr-container" data-block-title="…">` with
  `<span class="webr-header-label">…</span>` filled in.

The hardcoded "Interactive R" is only the **fallback** when no title is given.
So the work is: generate titles + patch every fence + rebuild. No markup or
pipeline changes.

## Scope (confirmed with user)

- Bulk LLM backfill across all existing posts, one pass.
- Title renders **inside the existing header bar** (replacing the hardcoded
  label). No new CSS region.
- Titles are produced inside this Claude Code session (Opus 4.7), sequentially.
  No Anthropic API key required. No subagents.

## Rollback anchor

```bash
git tag version-C-pre-code-titles HEAD
git push origin version-C-pre-code-titles
```

Rollback = `git checkout version-C-pre-code-titles -- posts/ _posts/` + rebuild.

## Files

| File | Role |
|---|---|
| `.claude/skills/write-post-interactive-v3/SKILL.md` | ✅ Done. Adds `title="…"` authoring rule. |
| `_build/extract_code_blocks.py` | ✅ Done. Read-only scanner, emits `code_blocks.json`. |
| `_build/apply_code_titles.py` | ✅ Done. Deterministic applier with `--dry-run` / `--slug`. |
| `_build/code_blocks.json` | ✅ Done. 256 webr-enabled posts, 6,839 R blocks. |
| `_build/code_titles.json` | 🔄 In progress. 3 posts / 75 blocks so far. |
| `www/webr.css` | ✅ Done. `.webr-header-label` weight bump + ellipsis clamp + mobile fix. |
| `posts/*.md` | ⏳ Pending apply phase. |
| `_posts/*.html` | ⏳ Pending apply phase. |
| `*.html` (root) | ⏳ Pending rebuild. |

## Execution order

1. ✅ Create rollback tag `version-C-pre-code-titles`. *(Do this before the
   apply phase, not before generation.)*
2. ✅ Write both scripts + run extractor + commit scripts/CSS/skill.
3. ✅ Pilot 3 representative posts (`R-Functions`, `Pie-Donut-Chart-in-R`,
   `Binomial-Distribution-Exercises-in-R`) — 75 titles generated, user approved
   the style.
4. ⏳ **Generate titles for all remaining 253 posts** (6,764 blocks). In-session,
   batched. See `protocol.md`.
5. ⏳ Full dry-run: `python _build/apply_code_titles.py --dry-run`.
6. ⏳ Live apply: `python _build/apply_code_titles.py`.
7. ⏳ `python _build/md2html.py <slug>` for every slug in
   `_build/.changed_slugs.txt`.
8. ⏳ `python _build/build.py` to regenerate root HTML pages.
9. ⏳ Spot-check 5 random built pages in browser at http://localhost:8765/.
10. ⏳ Commit: *"Backfill per-block titles across all interactive code boxes"*.
11. ⏳ Push to `origin/master`.

## Edge cases considered

(Full 31-item list — preserved from the approved plan for reference.)

**Content / source variants**
1. `webr: false` posts — frontmatter disables WebR → plain `<pre><code>`, no
   header bar. Extractor marks `webr_enabled: false` and emits no blocks.
2. Non-R fences (`bash`, `python`, plain ` ``` `) — routed to `<pre><code>`.
   Skip.
3. `r-static` escape hatch — routed to plain `<pre>` with no container. Skip.
4. Try-it starter blocks — custom parser still routes through
   `webr_container_html`, so `title="…"` works the same way.
5. Solution blocks inside `<details>` — fences inside still get parsed by the
   normal loop. Titles work.
6. Block with no prose above (first after H2) — context fall-back to post title
   + H2 + code itself. Prompt tolerates generic titles.
7. Single-line block — fine, derive from code.
8. Library-only block — `Load packages` or `Load x and y`.

**Markdown format variants**
9. Fence already has info tokens — append `title="…"`, don't clobber.
10. Fence has a hand-authored `title="…"` — skip.
11. Fragment already has non-default `data-block-title` — skip.
12. Fence with leading whitespace — preserve indentation when rewriting.
13. Fences in blockquotes — md2html doesn't support; site doesn't use.
    Out of scope.

**Title-generation hazards**
14. Smart quotes / em-dashes — applier's `sanitize_title()` strips them.
15. Trailing period / all-caps — validator rejects; hand-editable JSON.
16. Title too long (>8 words) — hard cap at 8 words, plus CSS ellipsis.
17. HTML / Markdown markup in title — stripped.

**Display hazards**
18. Long title on narrow viewport — `.webr-header-label` has ellipsis clamp +
    `min-width: 0`.
19. Escape in `data-block-title` — `html.escape()` in both paths.
20. Header vertical shift — none (height is line-height bound, not text
    length).

**Pipeline hazards**
21. Applier writes markdown but fragment not regenerated — applier emits
    `.changed_slugs.txt`; md2html step reads from it.
22. Fragment manually edited after last md2html — out of scope; trust the
    markdown-is-source invariant.
23. Partial / crashed run — `code_titles.json` is durable; resume skips
    completed slugs.
24. Running applier twice — idempotent (skip if title already present).
25. No API key — irrelevant; generation happens in-session.
26. Model choice — Opus 4.7 (far better than Haiku for nuanced one-liners).

**Other-feature interactions**
27. Auto-link scanner — `www/links.json` already has `webr-container` in
    `skip_classes`. No change needed.
28. Copy button — reads `.webr-editor` textContent. Unaffected.
29. Run button / CodeJar — doesn't touch header. Unaffected.
30. Search engines — per-block titles in HTML → mildly positive.
31. `feed.xml` / `sitemap.xml` — generated from fragment text, not webr
    header. Unaffected.

## Verification

1. **Unit smoke on md2html.** Fence with `title="…"` → fragment has
   `data-block-title="…"` and `.webr-header-label` text.
2. **Build smoke.** `python _build/build.py` — zero errors, ~260 pages
   rebuilt.
3. **Local browser.** http://localhost:8765/R-Functions.html — every box shows
   a specific title, not "Interactive R".
4. **Mobile.** 380 px width — title ellipsises gracefully.
5. **Writer-skill.** One new `[C]` post via `/write-post-interactive-v3` — every
   fence includes `title="…"`.
6. **Rollback dry-run** on a scratch branch — confirms the tag works.

## Out of scope

- Redesigning the header layout or adding above-box captions.
- Keeping titles in sync when block content changes later.
- Non-R code blocks (Python, shell, SQL) — R-only site.
- Translating author-set `data-block-title` values.
