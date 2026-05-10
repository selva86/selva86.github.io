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

## 3. Callouts (mandatory: 2 to 4 per post)

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
- Sentence ceiling: 30 words. Break longer ones.
- Paragraph ceiling: 4 sentences. 2 to 3 ideal. One idea per paragraph.

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
