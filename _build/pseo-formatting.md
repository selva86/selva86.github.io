# PSEO Formatting Spec (Single Source of Truth)

This is the canonical formatting bar for every PSEO post. Both `/write-pseo-v2` (when generating) and `Scripts/pseo_quality_check.py` (when checking) read from this file. Update rules here, not in the skill.

**Editing rule:** keep this file under 200 lines. If a rule needs more than 3 sentences, it belongs in a different doc, not here.

---

## 1. Lead and snippet block

- Open with `<p class="lead">` after the H1: 1 to 2 sentences, snippet-friendly, target keyword in first 10 words.
- Lead is the answer Google can show in a featured snippet without scrolling. Make it self-contained.

## 2. Bolded section openers

- The first declarative sentence of EVERY H2 and H3 opening paragraph must begin with a bolded clause.
- Format: `**Action verb or key claim.** Supporting prose.`
- Example: `**select() is a column subsetter.** You pass a data frame and a list of columns...`
- Skim-readers should grasp the post by reading only bolded leads + headings.
- **The bolded opener is the ONLY sentence in the paragraph shaped this way.** The supporting prose that follows is connected prose, not more short declaratives: it must obey P2 in `_build/prose-voice.md`. A paragraph of five bold-opener-shaped sentences in a row is the single most common defect in this corpus.

## 3. Callouts (mandatory: 2 to 4 per post; counts authored callouts only)

The auto-injected `[Run live]` callout (rule 3c) and the dedicated `[QUICK ANSWER]` (3a) and `[DECISION TREE]` (3b) blocks are NOT counted toward the 2-to-4 callout density rule. They are separate block types, not in the TIP/WARNING/NOTE/KEY-INSIGHT family.

- Use the 4-callout system: `[TIP]`, `[WARNING]`, `[NOTE]`, `[KEY INSIGHT]`.
- Format each as a single paragraph (md2html.py terminates at first blank line):
  ```
  [TIP]
  **Short bold claim.** Supporting sentence that elaborates.
  ```
- Density: 1 per 400 words. 800-word post = 2 callouts; 1,500-word post = 4 callouts.
- Type guidelines:
  - TIP: best practice, shortcut, or performance advice
  - WARNING: common pitfall, silent bug, or breaking change
  - NOTE: version notes, alternatives, side notes
  - KEY INSIGHT: the "aha" mental model that ties code to understanding (max 1 per section)
- Don't place 2 callouts within 3 paragraphs of each other.

## 3a. Quick Answer block (mandatory for function-deep PSEO; recommended for cookbook-recipe and chart-type)

Place ONE `[QUICK ANSWER]` block directly after the lead paragraph. Renders as an amber-bordered card with a dark code box containing 5 to 8 single-line answers, each with an inline `# label` comment.

Markdown syntax:

```
[QUICK ANSWER]
filter(df, mpg > 20)                # single condition
filter(df, mpg > 20, cyl == 4)      # AND
filter(df, mpg > 20 | cyl == 4)     # OR
filter(df, cyl %in% c(4, 6))        # set membership
filter(df, between(hp, 100, 200))   # range
filter(df, !is.na(x), x > 5)        # NA-safe
filter(df, x == max(x), .by = grp)  # by group
```

Rules:
- Each line: one functional pattern + one inline comment label
- 5 to 8 lines (more clutters; fewer leaves common cases out)
- Use realistic placeholder names (`df`, `mpg`, `x`) so the snippet is copy-paste ready
- No prose inside the block; the card auto-appends "Need explanation? Read on for examples and pitfalls."

## 3b. Decision Tree block (function-selector, NOT variant-selector)

Place ONE `[DECISION TREE: <title>]` block after the Quick Answer. Renders as inline SVG with a vertical trunk and labeled horizontal branches to code boxes.

**Critical content rule (do not violate):** the Decision Tree answers a DIFFERENT question from the Quick Answer. Quick Answer covers "how to write this function for various conditions" (variant selection). The Decision Tree covers "is this the right function for my problem?" (function selection). If the tree's content overlaps with Quick Answer, you have written it wrong.

The first branch confirms the function is the right tool for the canonical use case. Remaining branches send the reader to OTHER functions for adjacent tasks. This makes the post a hub rather than a dead-end and reduces bounce rate when Google routes the reader to the wrong page.

Markdown syntax:

```
[DECISION TREE: Is filter() the right tool?]
- filter rows by condition: filter(df, x > 5)
- drop columns (not rows): select(df, -bad_col)
- top N by value: slice_max(df, x, n = 5)
- drop rows with NA: drop_na(df, x)
- remove duplicates: distinct(df)
- match against another table: semi_join(df, lookup, by = "id")
```

Rules:
- 4 to 8 branches (fewer = no branching; more = visual clutter)
- First branch confirms THIS function for its canonical use case
- Remaining branches point to OTHER functions for related tasks
- Branch labels are short phrases (3 to 5 words), not single keywords
- Code lines must fit in ~70 characters (the box width)
- Skip the block entirely if the function has no meaningful "is this the right tool" decision (e.g., `glimpse()`, `print()`)
- The title must be a YES/NO style question: "Is X the right tool?" or "Should I use X?"

## 3d. Jump-chip strip (auto-injected, do not write manually)

For PSEO posts, `build.py` automatically injects a `<nav class="jump-chips">` strip immediately below the Decision Tree (or below the Quick Answer if no Decision Tree exists). The chips are anchor links generated from the post's H2 list.

Authors do NOT write this. Authors do NOT need to add `id="..."` attributes to H2 headings; the build pipeline auto-slugifies headings to ids and emits matching anchor chips.

Tail H2s like "FAQ", "Related dplyr functions", "Try it yourself" are included; `## Common pitfalls` is included; the first H2 (Definition / "What X does in one sentence") is INCLUDED so a reader who landed on the chip strip first can jump to the prose explanation.

Opt-out via frontmatter `jump_chips: false` if a post should not advertise navigation (rare).

## 3e. Try it yourself exercise (mandatory for function-deep PSEO)

Place ONE inline exercise under an `## Try it yourself` H2 between `## Common pitfalls` and `## Related ...`. The exercise uses the existing site-wide `**Try it:**` pattern (md2html.py wraps it in `<section class="tryit-block">`).

Format (do not deviate; the converter expects this exact shape):

```
## Try it yourself

**Try it:** Filter mtcars to keep cars with cyl == 4 AND mpg > 25. Save the result to ex_filtered.

\`\`\`r title="Your turn: filter mtcars"
# Try it: filter mtcars
ex_filtered <- # your code here

ex_filtered
#> Expected: 6 rows
\`\`\`

<details>
<summary>Click to reveal solution</summary>

\`\`\`r title="Solution"
ex_filtered <- mtcars |> filter(cyl == 4, mpg > 25)
nrow(ex_filtered)
#> [1] 6
\`\`\`

**Explanation:** Comma-separated conditions in filter() combine with AND. The result keeps only rows satisfying both.

</details>
```

Rules:
- Difficulty: easy to medium. Single concept (the function being explained), or two concepts at most.
- Variable names: prefix with `ex_` to avoid colliding with tutorial state in the shared WebR session.
- Expected output: include `#> Expected: ...` so readers can self-verify.
- Solution: ALWAYS in `<details>` with `<summary>Click to reveal solution</summary>`. Never inline.
- Explanation: 1 to 2 sentences after the solution code.
- Skip rule: omit the entire section if the function has no meaningful exercise (e.g., `glimpse()`, `print()`).

The jump-chip strip auto-detects `## Try it yourself` and renders the chip with class `try-it` (amber, drawn attention).

## 3c. Run-live callout (auto-injected, do not write manually)

For PSEO posts, build.py automatically injects a green "Run live, no install needed" callout above the first WebR code block. Authors do NOT write this; it appears once per post. Opt-out via frontmatter `runlive_callout: false` if a post should not advertise the runtime (rare).

## 4. Lists

- Bullet lists: 3+ related items, parallel grammar, 1 to 2 sentences each.
- Nested bullets: only 1 level deep (2-space or 4-space indent). md2html.py supports 1-level nesting; deeper levels render flat.
- For complex hierarchies, prefer sub-headings + flat lists over deep nesting.
- Numbered list: use `1.`, `2.`, `3.` only when order matters (steps, ranking).

## 5. Tables

- Use markdown pipe-tables. md2html.py auto-styles them with `<table class="table table-striped">`.
- 3 to 5 columns ideal. Never 8+.
- Never write raw `<table>` HTML.

## 6. Code blocks

- Every R code block must have a `title="..."` attribute: 3 to 6 words, sentence case, no punctuation.
- Format: `` ```r title="Load dplyr and inspect data" ``
- One concept per block (5 to 25 lines).
- Output as inline `#> ...` comments (knitr/reprex convention), NEVER as a separate output block.
- Pre-block prose explains the concept; post-block prose explains the result.

## 7. Headings

- Use H2 for top-level sections (`##`), H3 for sub-sections (`###`).
- Skip H4 except for capstone exercises and explicit Q in FAQ.
- H2 count target: 5 to 8 per post. Fewer = thin; more = unfocused.

## 8. FAQ section

- Every PSEO post has an `## FAQ` H2 near the end with 3 to 5 questions.
- Format each as `**Question text?**` bolded paragraph followed by 60 to 100 word answer.
- Target real "People Also Ask" questions when SerpApi is wired (Pass 6 of /write-pseo-v2). Otherwise, generate plausible questions and mark internally for refresh.

## 9. Punctuation and prose

- No em-dashes (U+2014). md2html.py strips them as backstop, but write without them. Use commas, hyphens, parens, semicolons.
- **Prose voice: `_build/prose-voice.md` (P1 cargo test, P2 sentences need each other). It governs; the ceilings below are subordinate to it.**
- Sentence ceiling: 40 words, and it is a ceiling, not a target. A paragraph whose sentences all run 8 to 14 words is a defect even though every sentence clears the ceiling: vary length hard, longest at least twice the shortest (P2).
- Paragraph ceiling: 4 sentences. 2 to 3 ideal. One idea per paragraph. This is about paragraph LENGTH, not sentence independence: the sentences inside a paragraph must still depend on each other, so a paragraph that survives the reorder test is wrong however short it is.
- Connect adjacent facts (`because`, `so`, `which means`, `whereas`, `even though`, `once`, `until`). `and` and `but` do not count. Check with `python Scripts/prose_flow_check.py posts/<slug>.md`.

## 10. Length

- Word count target: 800 to 1500 prose words (excluding code, frontmatter, and tables).
- If you cannot reach 800 with substance, abort the post; do not pad.
- Above 1500: split into 2 posts or move depth to a Further Reading post.

## 11. Internal linking

- 5 to 15 outbound auto-links (injected by `_build/auto_link.py`).
- 1 manual external authoritative link (e.g., dplyr.tidyverse.org reference).
- Cross-language callout when applicable: `[NOTE] **Coming from Python pandas?** The equivalent of select() is df[['a', 'b']].`

## 12. Frontmatter (16 required fields)

```yaml
title:                   <SEO title, <=60 chars>
slug:                    <URL slug>
description:             <150-160 char meta description>
keywords:                <comma-separated SEO keywords>
mathjax:                 <true if LaTeX, else false>
webr:                    true
date:                    <YYYY-MM-DD>
post_type:               PSEO
category_id:             <one of 14 categories>
subcategory_id:          <subcategory slug>
fr_parent:               <parent-slug.html>
auto_link_terms:         <pipe-separated terms>
auto_link_case_sensitive: <true for fn names with (), false for natural lang>
target_keyword:          <primary keyword>
sibling_block_enabled:   true
difficulty:              Beginner | Intermediate | Advanced
```

## 13. Auto-link safety

- Never register single uppercase abbreviations (e.g. "ARE", "MLE", "OLS") as case-insensitive terms in `links.json`. They false-positive on lowercase common words.
- Always set `case_sensitive: true` for terms containing all-caps abbreviations or function names with `()`.

## 14. E-E-A-T signals (auto-emitted by build.py)

- Author byline (Selva Prabhakaran) - automatic.
- Last updated date - automatic.
- Article JSON-LD schema - automatic.
- HowTo + FAQPage JSON-LD - PENDING (Phase 0 build.py extension).
- OG / Twitter card meta - automatic.

PSEO authors do not need to add these manually; build.py handles them.

---

## How this spec is enforced

- `/write-pseo-v2` reads this file and follows the rules during generation.
- `Scripts/pseo_quality_check.py` runs each rule as a deterministic check before publish; failures block.
- `_build/md2html.py` auto-corrects on save (em-dash strip, nested bullet handling).
- `_build/auto_link.py` honors rule 13 via case-sensitive matching.

If a rule cannot be enforced mechanically, the skill carries it; otherwise enforcement is the script's job.

## Changing this spec

When you change a rule here:

1. Update the corresponding check in `pseo_quality_check.py`
2. Run the check against all published PSEO posts; fix violations
3. Note the change in `git log` with prefix `pseo-formatting:`


## AI-tells (owner list, never emit)
- Stat-triplet flex copy: "N hubs, M problems, graded the moment you press Check" - a comma-chained stat parade with a punchy flourish clause. One plain sentence instead.
- JetBrains Mono font (wiped sitewide 2026-07-13). Em-dash (long-standing). Eyebrow kicker labels above headings.
