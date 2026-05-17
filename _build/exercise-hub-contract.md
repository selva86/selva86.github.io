# Exercise Hub Component Contract (v1)

Canonical DOM contract for exercise hubs (`post_type: EX`). The runtime layer
(`www/exercise-hub.js` + `exercise-hub.css`) consumes exactly this markup.
`md2html.py` emits it; `write-exercise-hub` authors it; the validator enforces it.
Locked 2026-05-17. Do not change markup without bumping the version.

---

## 1. Scope

- Applies to every `post_type: EX` fragment in `_posts/`.
- Does NOT apply to: `*-quiz.html` pages (separate product, standalone HTML, not
  built from `_posts/`), tutorial `[C]` posts, PSEO posts.
- The 3 legacy-format hubs (`dplyr-Exercises`, `ggplot2-Exercises`,
  `purrr-Exercises`) are being rewritten to this contract; until rewritten the
  layer skips any hub failing the validator.

## 2. Exercise section markup

Each exercise is ONE `<section class="exercise">`. Everything for that exercise
lives inside it — nothing relies on sibling order or positional index.

```html
<section class="exercise"
         data-exercise-id="<hub-slug>-ex-<n-dashed>"
         data-grade-mode="output-compare"
         data-difficulty="beginner">
  <h3 class="exercise-title">Exercise 1.1: <title></h3>
  <p class="exercise-task"><strong>Task:</strong> <task html></p>
  <div class="exercise-expected">
    <p><strong>Expected result:</strong></p>
    <pre><code>#&gt; ...</code></pre>
  </div>
  <div class="exercise-hints" hidden>
    <p><!-- Hint 1: conceptual, names no function --></p>
    <p><!-- Hint 2: near-solution, names function/args, not full pipeline --></p>
  </div>
  <div class="webr-container" data-block-title="Your turn"> ... </div>
  <details class="exercise-solution">
    <summary>Click to reveal solution</summary>
    <div class="webr-container" data-block-title="Solution"> ... </div>
    <p class="exercise-explanation"><strong>Explanation:</strong> ...</p>
  </details>
</section>
```

## 3. Required attributes

| Attribute | On | Rule |
|---|---|---|
| `data-exercise-id` | `section.exercise` | `<hub-slug>-ex-<n>` with dots → dashes (`...-ex-1-1`). Unique per hub. Progress + hint-usage key off THIS, never DOM position. |
| `data-grade-mode` | `section.exercise` | One of §4. |
| `data-difficulty` | `section.exercise` | `beginner` \| `intermediate` \| `advanced` (lowercase). |

`data-exercise-id` stability: tied to the exercise number. Renumbering an
exercise changes its id and resets that exercise's saved progress — an accepted,
explicit author cost. Never key state on positional block index.

## 4. Grade modes (`data-grade-mode`)

| Mode | When | Layer behavior |
|---|---|---|
| `output-compare` | Default. Deterministic text output, complete Expected block. | Run → capture `.webr-output`, normalize, diff against `.exercise-expected pre code`. Verdict ✓/✗ + line-level diff. |
| `self-check` | Plot/visual exercises; nondeterministic code (`rnorm`/`runif`/`sample`/`Sys.*` without `set.seed`); Expected block containing `...` or prose comments. | Expected result shown as the target; NO ✓/✗ verdict; learner self-verifies. Counts as "attempted" on Run. |
| `assertion` | Reserved (authored hidden R checks). Not in v1 scope. | — |

Auto-detection (md2html / migration): assign `self-check` if the Your-turn OR
Solution code matches `ggplot(|[^a-z]plot(|hist(|barplot(|boxplot(` OR
`rnorm|runif|sample\(|Sys\.` without a `set.seed` on the page, OR the Expected
block contains `...`; else `output-compare`. Author may override in frontmatter.

## 5. Hints block

- Rendered: `<div class="exercise-hints" hidden>` — exactly TWO `<p>` children.
- Markdown source syntax — a `[HINTS]` block (house style, cf. `[QUICK ANSWER]`):
  ```
  [HINTS]
  Conceptual nudge — names no function.
  Near-solution — names the function/args, not the full pipeline.
  ```
  `[HINTS]` on its own line, then one hint per line until a blank line.
  Placed after the `**Difficulty:**` line, before the Your-turn code fence.
  `md2html.py` renders one `<p>` per line (inline markdown applies).
- Hint 1: conceptual nudge, names no function. Hint 2: near-solution, names the
  function/args but not the full pipeline.
- `hidden` attribute keeps it out of no-JS render; the layer lifts both `<p>`
  into the progressive hint ladder.
- Block is REQUIRED on every exercise (backfilled across all 127 hubs).

## 6. What the layer must skip

- The opening "Run this once before any exercise" `webr-container` (not inside
  any `section.exercise`).
- `<section class="tryit-block">` and its `<details>` — scope solution lookup to
  inside `details.exercise-solution` only.
- `<h2>` section headers ("Section 1. ...") — match exercises by
  `section.exercise`, never by heading tag/text.
- Any hub that fails the validator (logged, skipped, not half-rendered).

## 7. Validator rules (publish-time gate)

A hub passes only if EVERY `section.exercise` has: unique `data-exercise-id`,
valid `data-grade-mode`, valid `data-difficulty`, one `.exercise-task`, one
`.exercise-expected` with a non-empty `<pre><code>`, one `.exercise-hints` with
exactly 2 non-empty `<p>`, one Your-turn `webr-container`. `details.exercise-solution`
is OPTIONAL (md2html tolerates a missing solution) but if present needs a
`<summary>` and a Solution `webr-container`. Failure blocks publish.

## 8. Emission & enforcement

- `md2html.py` — emits §2 markup from markdown; assigns `data-exercise-id`,
  auto-detects `data-grade-mode` per §4, carries hints through.
- `write-exercise-hub` — authors the 2 hints and may set an explicit grade-mode.
- One-time migration upgrades the 124 conforming fragments to §2 markup
  (wrap, ids, grade-mode, empty hints block pending backfill).
- Validator (§7) runs at publish; conformance cannot erode silently.
