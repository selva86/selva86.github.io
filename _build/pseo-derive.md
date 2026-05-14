# PSEO metadata derivation rules

How `/write-pseo-v2` Pass 0 computes title, target_keyword, target_keywords,
auto_link_terms, case_sensitive, and fr_parent from `{slug, category, type}`
in `pseo-status.json`. Never call `AskUserQuestion` — these rules always
resolve.

## Universal defaults

| Field | Value | Notes |
|---|---|---|
| `post_type` | `PSEO` | Always |
| `mathjax` | `false` | Override per-slug if formulas appear |
| `webr` | `true` | Always |
| `sibling_block_enabled` | `true` | Always |
| `difficulty` | `Beginner` | Override only if slug names an advanced concept |

`case_sensitive` defaults by category — see per-category sections.

## Category 1: function-deep

Slug shape: `<package>-<function>-in-R` (lowercase package + function name).
Examples: `ggplot2-aes-in-R`, `dplyr-select-in-R`, `lubridate-ymd-in-R`.

**Parse rule:** split slug on `-in-R` then on first `-`.
- `package = ggplot2`, `function_name = aes`
- For multi-word functions (`dplyr-pull-by-in-R`): split on first `-`, treat the rest before `-in-R` as the function name.
- For operator slugs in `base-r-essentials` (e.g., `R-Pipe-Operator-in-R`): there is no `package-function` structure. Use the slug body verbatim as the topic; defaults below in **operator override**.

**Title formula:**
```
{package} {function}() in R: {tagline}
```
Tagline is sub-Claude-generated, 4-8 words, describes the function's purpose
(e.g., "Map Data to Visual Properties", "Choose, Rename and Reorder Columns").
Tagline must avoid "How to" / "Guide" / "Tutorial" boilerplate.

**target_keyword formula:** `{package} {function}` (no trailing "in R" for SEO match).

**target_keywords (comma-separated, 5-7 variants):**
1. `{package} {function}` (base)
2. `{function} function R`
3. `{package} {function} examples`
4. `R {function} columns` / `R {function} data` (case-specific)
5. 2-3 use-case variants sub-Claude generates from function purpose

**auto_link_terms (pipe-separated, 4-6 variants):**
1. `{function}()` — with parens
2. `{package} {function}` — bare
3. `{package}::{function}()` — namespaced
4. Optional plain-English aliases for the function's purpose

**case_sensitive:** `true` (function names are usually case-significant).

**fr_parent (default by subcategory):**

`[EXISTS]` = parent published at site root today. `[ASPIRATIONAL]` = canonical
planned name not yet published (matches the convention already used by 122
existing PSEO posts). Aspirational links silently no-op until the parent ships.

| subcategory_id (`type`) | Default `fr_parent` | Status |
|---|---|---|
| `dplyr-functions` | `Data-Wrangling-With-dplyr.html` | ASPIRATIONAL |
| `tidyr-functions` | `pivot_longer-pivot_wider-Reshape-Data-in-R.html` | EXISTS |
| `ggplot2-functions` | `ggplot2-Tutorial-With-R.html` | EXISTS |
| `stringr-functions` | `stringr-in-R.html` | EXISTS |
| `lubridate-functions` | `lubridate-in-R.html` | EXISTS |
| `purrr-functions` | `Functional-Programming-in-R.html` | EXISTS |
| `forcats-functions` | `R-Vectors.html` | EXISTS (factors are a vector type) |
| `readr--readxl--haven` | `Importing-Data-in-R.html` | EXISTS |
| `datatable-functions` | `Data-Wrangling-With-dplyr.html` | ASPIRATIONAL |
| `tibble-functions` | `R-Vectors.html` | EXISTS (best available; R-Data-Types not yet published) |
| `janitor-functions` | `janitor-Package-in-R.html` | EXISTS |
| `glue-functions` | `stringr-in-R.html` | EXISTS (string-adjacent) |
| `broom-functions` | `Linear-Regression.html` | EXISTS |
| `caret-functions` | `Linear-Regression.html` | EXISTS (Caret-Package parent aspirational) |
| `tidymodels-family` | `Linear-Regression.html` | EXISTS (Tidymodels-in-R parent aspirational) |
| `base-r-essentials` | `R-Basic-Syntax-Beginners-Guide.html` | ASPIRATIONAL (used by 5 existing PSEO) |

Sub-Claude may override with a more-specific deep-dive parent if the slug
matches a published Core post (e.g., `ggplot2-aes-in-R` →
`ggplot2-Aesthetics-aes-Map-Data.html`). When in doubt, use the default.

**Operator override (for `base-r-essentials` operator slugs):**
Slugs like `R-Pipe-Operator-in-R`, `R-Assignment-Operators-in-R`,
`R-Logical-Operators-in-R`, `R-Comparison-Operators-in-R`:
- `target_keyword`: `R {operator_phrase}` (e.g., `R pipe operator`)
- `case_sensitive`: `false` (operator names vary in capitalization)
- `fr_parent`: `R-Basic-Syntax-Beginners-Guide.html`

## Category 2: error-message

Slug shape: `Error-<error-text-slugified>-in-R`.
Examples: `Error-subscript-out-of-bounds-in-R`,
`Error-could-not-find-function-in-R`.

**Parse rule:** strip `Error-` prefix and `-in-R` suffix, replace `-` with space →
error message text. Wrap in backticks in body.

**Title formula:**
```
"{error_message}" Error in R: Causes, Fixes, and Examples
```
Use the exact error text in quotes. Tagline is fixed: "Causes, Fixes, and Examples"
(matches user search intent for error pages).

**target_keyword:** the exact error text (without "Error" prefix or "in R" suffix).

**target_keywords (5-7 variants):**
1. `{error_text} R`
2. `fix {error_text}`
3. `{error_text} error meaning`
4. `R error {error_text}`
5. 2-3 sub-category context terms (e.g., for `tidyverse-errors`: add `dplyr`, `ggplot2`)

**auto_link_terms (3-5 variants):**
1. The exact error text (lowercase)
2. The error text wrapped in `Error:` prefix
3. 1-2 paraphrases sub-Claude generates

**case_sensitive:** `false` (errors get capitalized inconsistently in copy/paste).

**fr_parent (by subcategory):**

| subcategory_id (`type`) | Default `fr_parent` | Status |
|---|---|---|
| `base-r-errors` | `R-Common-Errors.html` | EXISTS |
| `tidyverse-errors` | `Data-Wrangling-With-dplyr.html` | ASPIRATIONAL |
| `ggplot2-errors` | `ggplot2-Tutorial-With-R.html` | EXISTS |
| `modeling-errors` | `Linear-Regression.html` | EXISTS |
| `io-errors` | `Importing-Data-in-R.html` | EXISTS |
| `install--environment-errors` | `Install-R-and-RStudio-2026.html` | EXISTS |
| `performance--memory-errors` | `R-Memory-lobstr.html` | EXISTS |

> **Speculative title/keyword formulas — refine with first 5 written.**
> No error-message PSEO has been written yet. fr_parents above are all
> verified; the title pattern, target_keywords, and auto_link_terms are
> proposals. First writer should validate Pass 9 passes and adjust if not.

## Category 3: chart-type

Slug shape: `<Chart-Name>-in-R`.
Examples: `Bar-Chart-in-R`, `Stacked-Area-Chart-in-R`,
`Lollipop-Chart-in-R`.

**Parse rule:** strip `-in-R`, replace `-` with space, title-case → chart name.

**Title formula:**
```
{Chart Name} in R: Build, Customize, and Annotate With ggplot2
```

**target_keyword:** `{chart name} R` (e.g., `bar chart R`).

**target_keywords (5-7):**
1. `{chart name} in R`
2. `R {chart name}`
3. `ggplot2 {chart name}`
4. `{chart name} ggplot2`
5. 2-3 task variants (`how to make {chart} in R`, `{chart} example R`)

**auto_link_terms (4-6):**
1. The chart name (lowercase)
2. `{chart name} in ggplot2`
3. `ggplot2 {chart name}`
4. 1-2 ggplot geom names if applicable (`geom_bar`, `geom_line`, etc.)

**case_sensitive:** `false`.

**fr_parent (by subcategory):**

| subcategory_id (`type`) | Default `fr_parent` | Status |
|---|---|---|
| `comparison-charts` | `ggplot2-Tutorial-With-R.html` | EXISTS |
| `composition-charts` | `ggplot2-Tutorial-With-R.html` | EXISTS |
| `distribution-charts` | `ggplot2-Tutorial-With-R.html` | EXISTS (Visualizing-Distributions-in-R aspirational) |
| `correlation-charts` | `Correlation-in-R.html` | EXISTS |
| `trend-charts` | `ggplot2-Tutorial-With-R.html` | EXISTS (Time-Series-Analysis aspirational) |
| `statistical-charts` | `Statistical-Tests-in-R.html` | EXISTS |
| `time--spatial--network-specialty` | `ggplot2-Tutorial-With-R.html` | EXISTS |

> **Speculative title/keyword formulas — refine with first 5 written.**

## Category 4: dataset-driven

Slug shape: `<Dataset-Name>-Dataset-EDA-in-R` or similar action suffix.
Examples: `mtcars-Dataset-EDA-in-R`, `iris-Dataset-EDA-in-R`,
`airquality-Dataset-Visualization-in-R`.

**Parse rule:** split slug on `-Dataset-`, take left side as dataset name; right
side (before `-in-R`) as the task verb (EDA, Visualization, etc.).

**Title formula:**
```
{Dataset Name} Dataset in R: {Task} Walkthrough With Code
```
Example: `mtcars Dataset in R: EDA Walkthrough With Code`.

**target_keyword:** `{dataset name} dataset R` (e.g., `mtcars dataset R`).

**target_keywords (5-7):**
1. `{dataset} dataset R`
2. `{dataset} in R`
3. `{dataset} {task}`
4. `R {dataset} dataset`
5. 2-3 column-name or content-specific terms

**auto_link_terms (3-5):**
1. `{dataset}` (bare lowercase)
2. `{dataset} dataset`
3. `{dataset} data`

**case_sensitive:** `true` (dataset names like `mtcars`, `iris`, `airquality` are
exact identifiers).

**fr_parent:** all dataset-driven slugs default to
`Exploratory-Data-Analysis-in-R.html` unless the task is specifically
visualization (then `ggplot2-Tutorial-With-R.html`).

> **Speculative — refine with first 5 written.**

## Categories not yet covered

Slugs in these categories will fail Pass 0's category check unless a
formula is added here:

- `statistical-test` (250 planned, 6 done; pattern from `One-Way-ANOVA-in-R` works)
- `regex-pattern` (80 planned)
- `date-time` (80 planned)
- `type-conversion` (50 planned)
- `beginner-faq` (60 planned)
- `time-series` (80 planned)
- `ml-metrics` (50 planned)
- `cookbook-recipe`, `comparison`, `ml-algorithm` (later phase)

When the first batch in any of these hits, add a section here using the
same template as Categories 2-4.

## Pass 0 algorithm

```
1. Read pseo-status.json. Find entry by slug. If not found:
   -> log to Scripts/pseo-failures.log
   -> exit non-zero  (never AskUserQuestion)

2. Look up category/type from the entry.

3. If category has a section in this file:
   apply its derivation rules -> title, target_keyword, target_keywords,
   auto_link_terms, case_sensitive, fr_parent.

4. If category has no section:
   -> log to Scripts/pseo-failures.log with reason "no derivation rule for category=<cat>"
   -> exit non-zero

5. Print: "Pre-flight passed: <slug> (<category>/<type>) parent=<fr_parent>"
```

Sub-Claude may override any derived field based on slug semantics, but the
default always resolves so Pass 0 never blocks on missing metadata.
