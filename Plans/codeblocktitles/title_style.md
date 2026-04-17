# Title style rules

Every generated title must pass these rules. The applier's `sanitize_title()` will strip forbidden characters anyway, but producing clean titles upfront keeps the JSON auditable.

## Hard constraints

- **Length:** 3–8 words (6 max is usual; applier truncates at 8).
- **Case:** Sentence case. First word capitalised. Lowercase for ordinary words. Keep R identifiers/functions in their real case (`dbinom`, `ggplot`, `lm`, `mtcars`).
- **No trailing punctuation.** No period, colon, semicolon at the end.
- **No smart quotes, no em-dashes, no en-dashes.** (Sanitizer replaces them; don't rely on it.)
- **No double-quotes inside the title.** (Would break the `title="…"` attribute.)
- **No HTML, no Markdown, no backticks around identifiers.** Write `dbinom` not `` `dbinom` ``.
- **No trailing code-box reference** like "above", "below", "this block" — the reader already sees the block.

## Block-type patterns (use these conventions)

| Block type | Pattern | Example |
|---|---|---|
| Regular demo block | Verb-first action phrase | `Define a z-score function` |
| "Try it:" starter (user-edits, `is_tryit_starter=true`) | `Your turn: <short action>` | `Your turn: Celsius to Fahrenheit` |
| Solution for the above | `<same subject> solution` | `Celsius to Fahrenheit solution` |
| Numbered exercise starter | `Exercise N: <subject>` | `Exercise 3: at least three correct` |
| Numbered exercise solution | `Exercise N solution` | `Exercise 3 solution` |
| "Common mistake" / anti-example | Name the pitfall | `Common mistake using theta x` |
| Final capstone / workflow block | Describe the workflow | `Factory quality control workflow` |
| Library-only block | `Load …` | `Load ggplot2 and dplyr` |

## Detection hints (for Try-it vs solution vs exercise)

These flags are already in `_build/code_blocks.json` per block:

- `is_tryit_starter: true` → prefix `Your turn: `
- `is_solution: true` → append ` solution` (or use `Exercise N solution` for numbered exercises)
- Neither → regular demo block

If the block's `h2_above` starts with `Exercise N` or contains a numbered exercise marker, use the `Exercise N: …` pattern.

## When context is thin

If `prose_above` is empty and `h2_above` is generic, derive the title from the code itself:

- Leading `library(x); library(y)` → `Load packages` or `Load x and y`
- Single `plot()` / `ggplot()` call → `Plot <subject>`
- `lm(…)` / `glm(…)` / `summary(fit)` → `Fit <model> model` / `Summarise the fit`
- `read.csv` / `read_csv` → `Load the dataset` / `Read <name> data`

## Examples already in `code_titles.json` (pilot, user-approved)

```
R-Functions:
  0: Define a z-score function
  1: Your turn: Celsius to Fahrenheit
  2: Celsius to Fahrenheit solution
  17: Vectorised versus looped normalise
  30: Build a grouped summary function

Pie-Donut-Chart-in-R:
  0: Build a basic pie chart
  3: Turn the pie into a donut
  6: Common mistake using theta x

Binomial-Distribution-Exercises-in-R:
  0: Demo dbinom and pbinom on coin flips
  12: Exercise 1: dbinom for four heads
  13: Exercise 1 solution
  26: Exercise 8: plot the PMF
  32: Factory quality control workflow
```

Match this tone: specific, verb-led, informative at a glance.
