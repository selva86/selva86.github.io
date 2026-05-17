---
title: "R Markdown Exercises: 25 Real-World Practice Problems"
slug: "R-Markdown-Exercises"
description: "25 practice problems on R Markdown: YAML, chunk options, parameters, kable tables, child docs, bookdown refs, Quarto. Hidden solutions."
keywords: "R Markdown exercises, R Markdown practice problems, knitr exercises, Quarto practice, parameterised reports R, kable exercises"
mathjax: false
webr: false
date: "2026-05-12"
post_type: "EX"
sidebar_title: "R Markdown Exercises"
sidebar_order: 134
fr_parent: "R-Tutorial.html"
auto_link_terms: "R Markdown exercises|R Markdown practice problems|knitr exercises|parameterised reports in R|Quarto practice"
auto_link_case_sensitive: false
target_keyword: "R Markdown exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Markdown Exercises: 25 Real-World Practice Problems

<p class="lead">Twenty-five practice problems on R Markdown drawn from reporting workflows a working analyst actually runs: YAML setup, knitr chunk options, kable tables, ggplot figures, parameterised renders, child documents, citations, cross-references, and a Quarto crossover. Each problem hides the solution until you click; explanations cover the why, common mistakes, and alternatives.</p>

```r title="Run this once before any exercise"
library(rmarkdown)
library(knitr)
library(kableExtra)
library(ggplot2)
library(dplyr)
library(tibble)
```

## Section 1. YAML and Output Formats (5 problems)

### Exercise 1.1: Build YAML for an HTML report with TOC and code folding

**Task:** A reporting analyst needs an HTML report titled "Quarterly KPI Review" with a floating table of contents and code chunks collapsed by default so readers can expand them on demand. Compose the full YAML header (between the triple-dash fences) as a single string and save it to `ex_1_1`.

**Expected result:**

```
#> ---
#> title: "Quarterly KPI Review"
#> output:
#>   html_document:
#>     toc: true
#>     toc_float: true
#>     code_folding: hide
#> ---
```

**Difficulty:** Beginner

[HINTS]
Think about which feature controls reader navigation and which lets readers expand or collapse code, and remember YAML nests with two spaces per level.
Write a multi-line string with a `title:` line, then `output:` containing `html_document:` with `toc: true`, `toc_float: true`, and `code_folding: hide`.

```r title="Your turn"
ex_1_1 <- # your code here
cat(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- '---
title: "Quarterly KPI Review"
output:
  html_document:
    toc: true
    toc_float: true
    code_folding: hide
---'
cat(ex_1_1)
#> ---
#> title: "Quarterly KPI Review"
#> output:
#>   html_document:
#>     toc: true
#>     toc_float: true
#>     code_folding: hide
#> ---
```

**Explanation:** YAML in an Rmd is whitespace-sensitive: two-space indentation under `html_document:` is the contract. `toc_float: true` requires `toc: true` to be set, otherwise it silently does nothing. `code_folding: hide` collapses chunks by default; use `show` if you want them open and let readers hide. A common mistake is using tabs instead of spaces, which throws a parser error at render time.

</details>

### Exercise 1.2: Compose YAML for a PDF report with Xelatex and a custom font

**Task:** A finance team wants a PDF version of the same report rendered through the Xelatex engine using the "TeX Gyre Termes" font at 11pt, with one-inch margins. Compose the YAML header containing only the output block and save it as a string to `ex_1_2`.

**Expected result:**

```
#> output:
#>   pdf_document:
#>     latex_engine: xelatex
#>     fontsize: 11pt
#>     geometry: margin=1in
#>     mainfont: "TeX Gyre Termes"
```

**Difficulty:** Intermediate

[HINTS]
A custom system font only takes effect under an engine that can load such fonts, so the engine choice and the font field belong together.
Under `pdf_document:` set `latex_engine: xelatex`, `fontsize: 11pt`, `geometry: margin=1in`, and `mainfont: "TeX Gyre Termes"`.

```r title="Your turn"
ex_1_2 <- # your code here
cat(ex_1_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- 'output:
  pdf_document:
    latex_engine: xelatex
    fontsize: 11pt
    geometry: margin=1in
    mainfont: "TeX Gyre Termes"'
cat(ex_1_2)
#> output:
#>   pdf_document:
#>     latex_engine: xelatex
#>     fontsize: 11pt
#>     geometry: margin=1in
#>     mainfont: "TeX Gyre Termes"
```

**Explanation:** `mainfont` is only honoured under xelatex or lualatex; the default pdflatex engine ignores it because it cannot load system fonts. The `geometry` field accepts the LaTeX geometry-package syntax, so you can specify per-side margins like `top=1in, bottom=0.75in` for asymmetric layouts. Double-quote font names that contain spaces, otherwise YAML treats the trailing word as a separate value.

</details>

### Exercise 1.3: Define multi-format output in a single YAML block

**Task:** The same Rmd source needs to render to three deliverables: an HTML page with floating TOC, a Word document with the reference template `corp_template.docx`, and a PDF through Xelatex. Compose the YAML output block listing all three formats and save it to `ex_1_3`.

**Expected result:**

```
#> output:
#>   html_document:
#>     toc_float: true
#>   word_document:
#>     reference_docx: corp_template.docx
#>   pdf_document:
#>     latex_engine: xelatex
```

**Difficulty:** Intermediate

[HINTS]
A single output block can list several deliverables, each one its own nested child with its own settings.
Under `output:` nest `html_document:` with `toc_float: true`, `word_document:` with `reference_docx: corp_template.docx`, and `pdf_document:` with `latex_engine: xelatex`.

```r title="Your turn"
ex_1_3 <- # your code here
cat(ex_1_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- 'output:
  html_document:
    toc_float: true
  word_document:
    reference_docx: corp_template.docx
  pdf_document:
    latex_engine: xelatex'
cat(ex_1_3)
#> output:
#>   html_document:
#>     toc_float: true
#>   word_document:
#>     reference_docx: corp_template.docx
#>   pdf_document:
#>     latex_engine: xelatex
```

**Explanation:** When `output:` has multiple children, `rmarkdown::render()` defaults to the first listed format; pick the one your stakeholders see most often. To render every format in one go from the command line, call `rmarkdown::render("report.Rmd", output_format = "all")`. The `reference_docx` path is resolved relative to the Rmd file, not the working directory, so colocate the template with the source.

</details>

### Exercise 1.4: Add a bibliography and CSL style to the YAML

**Task:** A research group wants citations rendered in the APA style using a `refs.bib` file colocated with the Rmd, plus a custom `.csl` stylesheet at `csl/apa-7th.csl`. Compose the YAML fields that wire up the bibliography and CSL style and save the snippet to `ex_1_4`.

**Expected result:**

```
#> bibliography: refs.bib
#> csl: csl/apa-7th.csl
#> link-citations: true
```

**Difficulty:** Intermediate

[HINTS]
Three top-level fields wire up citations: where the references live, which style formats them, and whether each citation becomes a link.
Set `bibliography: refs.bib`, `csl: csl/apa-7th.csl`, and `link-citations: true`.

```r title="Your turn"
ex_1_4 <- # your code here
cat(ex_1_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- 'bibliography: refs.bib
csl: csl/apa-7th.csl
link-citations: true'
cat(ex_1_4)
#> bibliography: refs.bib
#> csl: csl/apa-7th.csl
#> link-citations: true
```

**Explanation:** Pandoc handles citations transparently when these three fields are set; you reference entries inline with `[@smith2020]` and pandoc replaces them at render time. `link-citations: true` turns each citation into a hyperlink that jumps to the references section, which readers expect in HTML output. The `csl` field accepts paths relative to the Rmd; if omitted, pandoc uses its default Chicago-style.

</details>

### Exercise 1.5: Add a params block with two typed parameters

**Task:** A team running regional sales reports wants to parameterise the Rmd by `region` (a character defaulting to "EMEA") and `cutoff_date` (a Date defaulting to today). Compose the YAML `params:` block with default values and value-type declarations and save it to `ex_1_5`.

**Expected result:**

```
#> params:
#>   region:
#>     value: "EMEA"
#>   cutoff_date:
#>     value: !r Sys.Date()
```

**Difficulty:** Intermediate

[HINTS]
Each parameter needs a default, and a date default has to be computed live rather than frozen as a literal string.
Under `params:` give `region:` a `value: "EMEA"` and `cutoff_date:` a `value: !r Sys.Date()`.

```r title="Your turn"
ex_1_5 <- # your code here
cat(ex_1_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- 'params:
  region:
    value: "EMEA"
  cutoff_date:
    value: !r Sys.Date()'
cat(ex_1_5)
#> params:
#>   region:
#>     value: "EMEA"
#>   cutoff_date:
#>     value: !r Sys.Date()
```

**Explanation:** The `!r` tag is a YAML directive that knitr evaluates as R code at render time, which is how you get a live `Sys.Date()` default rather than a hard-coded string. You can also add `input: select` with a `choices:` list to expose a dropdown when rendering interactively. Inside the body, reference these as `params$region` and `params$cutoff_date`; they arrive as the types you declared.

</details>

## Section 2. Chunk Options and knitr Configuration (5 problems)

### Exercise 2.1: Compose a chunk header that hides code and shows output

**Task:** An executive summary chunk should run R code that prints summary statistics but should hide the source code from the reader while still rendering the printed output and any plots. Compose the chunk header line (the part after the triple-backtick-r) with the right knitr options and save it to `ex_2_1`.

**Expected result:**

```
#> {r exec-summary, echo=FALSE, message=FALSE, warning=FALSE}
```

**Difficulty:** Beginner

[HINTS]
You want the source code invisible but its printed output and plots still shown, so pick the option that hides only the code, not the option that hides everything.
Build the `{r exec-summary, ...}` header string with `echo=FALSE`, `message=FALSE`, and `warning=FALSE`.

```r title="Your turn"
ex_2_1 <- # your code here
cat(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- "{r exec-summary, echo=FALSE, message=FALSE, warning=FALSE}"
cat(ex_2_1)
#> {r exec-summary, echo=FALSE, message=FALSE, warning=FALSE}
```

**Explanation:** `echo=FALSE` hides the code, `results='asis'` would mean something different (it tells knitr the chunk output is already markdown). Suppressing messages and warnings is standard for an executive-facing chunk where startup chatter from packages would clutter the page. A common mistake is using `include=FALSE`, which hides BOTH code and output; that is what you want for setup chunks, not summary ones.

</details>

### Exercise 2.2: Set global chunk defaults with opts_chunk$set

**Task:** In the first setup chunk of every report, the team wants to default all subsequent chunks to suppressed messages and warnings, with figure width 7, height 4, and centered alignment. Write the R call that sets these defaults globally and save it as a string to `ex_2_2`.

**Expected result:**

```
#> knitr::opts_chunk$set(
#>   message = FALSE,
#>   warning = FALSE,
#>   fig.width = 7,
#>   fig.height = 4,
#>   fig.align = "center"
#> )
```

**Difficulty:** Beginner

[HINTS]
One call in the setup chunk can change the defaults that every later chunk inherits.
Save a string calling `knitr::opts_chunk$set()` with `message`, `warning`, `fig.width`, `fig.height`, and `fig.align` arguments.

```r title="Your turn"
ex_2_2 <- # your code here
cat(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- 'knitr::opts_chunk$set(
  message = FALSE,
  warning = FALSE,
  fig.width = 7,
  fig.height = 4,
  fig.align = "center"
)'
cat(ex_2_2)
#> knitr::opts_chunk$set(
#>   message = FALSE,
#>   warning = FALSE,
#>   fig.width = 7,
#>   fig.height = 4,
#>   fig.align = "center"
#> )
```

**Explanation:** `opts_chunk$set()` writes into the knitr session's chunk option defaults, so every subsequent chunk inherits them unless it overrides individual options in its header. Place this call in a chunk with `include=FALSE` so the defaults change without leaking into the rendered output. Per-chunk overrides always beat the global defaults, which is exactly the pattern you want for one-off "show this code" exceptions.

</details>

### Exercise 2.3: Cache an expensive chunk with cache.extra invalidation

**Task:** A modelling chunk that takes ninety seconds to refit a glm should cache its results between renders, but the cache must invalidate whenever the input CSV `sales.csv` changes on disk. Compose the chunk header that turns on caching and ties the cache key to the file's mtime via `cache.extra`, then save it to `ex_2_3`.

**Expected result:**

```
#> {r fit-model, cache=TRUE, cache.extra=file.info("sales.csv")$mtime}
```

**Difficulty:** Advanced

[HINTS]
Caching on the code alone misses data changes, so the cache key has to also depend on the input file's current state.
Compose the `{r fit-model, ...}` header with `cache=TRUE` and `cache.extra=file.info("sales.csv")$mtime`.

```r title="Your turn"
ex_2_3 <- # your code here
cat(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- '{r fit-model, cache=TRUE, cache.extra=file.info("sales.csv")$mtime}'
cat(ex_2_3)
#> {r fit-model, cache=TRUE, cache.extra=file.info("sales.csv")$mtime}
```

**Explanation:** `cache=TRUE` alone hashes the chunk's source code, so the cache stays valid even when the underlying data changes, which is the most painful bug in cached reports. Pinning `cache.extra` to the file's modification time forces knitr to recompute when the file is touched. You can also use `tools::md5sum("sales.csv")` to invalidate on content rather than timestamp; pick mtime for cheap files and md5 for ones a build process might re-write with identical content.

</details>

### Exercise 2.4: Configure figure dimensions and a caption for a ggplot chunk

**Task:** A figure chunk producing a ggplot of `mtcars` mpg-vs-wt needs a six-inch wide by three-and-a-half-inch tall plot at 150 dpi, with the caption "Fuel economy declines with vehicle weight" and the alt text "Scatterplot of mpg versus weight". Compose the chunk header and save it to `ex_2_4`.

**Expected result:**

```
#> {r mpg-wt, fig.width=6, fig.height=3.5, dpi=150, fig.cap="Fuel economy declines with vehicle weight", fig.alt="Scatterplot of mpg versus weight"}
```

**Difficulty:** Intermediate

[HINTS]
Device size, raster resolution, the visible caption, and the screen-reader text are four separate chunk options.
Set `fig.width=6`, `fig.height=3.5`, `dpi=150`, `fig.cap=`, and `fig.alt=` in the `{r mpg-wt, ...}` header.

```r title="Your turn"
ex_2_4 <- # your code here
cat(ex_2_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- '{r mpg-wt, fig.width=6, fig.height=3.5, dpi=150, fig.cap="Fuel economy declines with vehicle weight", fig.alt="Scatterplot of mpg versus weight"}'
cat(ex_2_4)
#> {r mpg-wt, fig.width=6, fig.height=3.5, dpi=150, fig.cap="Fuel economy declines with vehicle weight", fig.alt="Scatterplot of mpg versus weight"}
```

**Explanation:** `fig.width` and `fig.height` are in inches and feed into the device sizing; `dpi` controls the raster resolution for HTML and Word output. `fig.alt` is the accessibility text screen readers announce and is distinct from `fig.cap`, which appears visibly under the figure. PDF output ignores dpi for vector graphics, so a high dpi only matters for the html and docx pipelines.

</details>

### Exercise 2.5: Suppress everything from a setup chunk with include=FALSE

**Task:** A library-loading and global-options chunk should run for its side effects, but neither its code nor any messages it emits should appear in the rendered document. Compose the chunk header for this setup chunk and save it to `ex_2_5`.

**Expected result:**

```
#> {r setup, include=FALSE}
```

**Difficulty:** Beginner

[HINTS]
A setup chunk runs only for its side effects, so suppress both the code and everything it emits with a single option.
Save the string `{r setup, include=FALSE}`.

```r title="Your turn"
ex_2_5 <- # your code here
cat(ex_2_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- "{r setup, include=FALSE}"
cat(ex_2_5)
#> {r setup, include=FALSE}
```

**Explanation:** `include=FALSE` is the only flag you need: it implicitly sets `echo=FALSE`, suppresses results, hides messages and warnings, and skips figure output. By convention this chunk is labelled `setup` so RStudio knows to evaluate it first when you run any later chunk interactively. Avoid putting `eval=FALSE` here by mistake; that would skip the side effects entirely and your later chunks would not see the loaded packages.

</details>

## Section 3. Tables, Figures, and Inline Code (5 problems)

### Exercise 3.1: Embed an inline R value in a markdown sentence

**Task:** A summary paragraph should say "The dataset contains N observations" where N is the row count of `mtcars` computed at render time. Compose the full markdown sentence with the inline R expression embedded between backticks and save it as a string to `ex_3_1`.

**Expected result:**

```
#> The dataset contains `r nrow(mtcars)` observations.
```

**Difficulty:** Beginner

[HINTS]
An inline expression keeps the sentence's number in sync with the data computed at render time.
Embed `` `r nrow(mtcars)` `` inside the sentence string where the count should appear.

```r title="Your turn"
ex_3_1 <- # your code here
cat(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- "The dataset contains `r nrow(mtcars)` observations."
cat(ex_3_1)
#> The dataset contains `r nrow(mtcars)` observations.
```

**Explanation:** Inline R is the single most-used feature in non-trivial reports because it keeps text and numbers in sync; rewrite the sentence, not the source data. The leading `r` after the opening backtick is what tells knitr to evaluate (vs. styling code as monospace). For values that need formatting, wrap them: `` `r format(nrow(mtcars), big.mark = ",")` `` produces `32` here but `1,234,567` on a bigger frame.

</details>

### Exercise 3.2: Render a kable table with caption and column alignment

**Task:** A small summary table of the first six rows of `mtcars` should render with a caption "Top of mtcars" and right-aligned numeric columns. Build the kable call with `knitr::kable()` and save the returned object to `ex_3_2`.

**Expected result:**

```
#> Table: Top of mtcars
#> 
#> |                  |  mpg| cyl| disp|  hp| drat|    wt|  qsec| vs| am| gear| carb|
#> |:-----------------|----:|---:|----:|---:|----:|-----:|-----:|--:|--:|----:|----:|
#> |Mazda RX4         | 21.0|   6|  160| 110| 3.90| 2.620| 16.46|  0|  1|    4|    4|
#> |Mazda RX4 Wag     | 21.0|   6|  160| 110| 3.90| 2.875| 17.02|  0|  1|    4|    4|
#> ...
```

**Difficulty:** Intermediate

[HINTS]
A table-rendering call takes the data plus a caption and a column-alignment choice as extra arguments.
Call `knitr::kable(head(mtcars), caption = "Top of mtcars", align = "r")`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- knitr::kable(head(mtcars), caption = "Top of mtcars", align = "r")
ex_3_2
#> Table: Top of mtcars
#> 
#> |                  |  mpg| cyl| disp|  hp| drat|    wt|  qsec| vs| am| gear| carb|
#> |:-----------------|----:|---:|----:|---:|----:|-----:|-----:|--:|--:|----:|----:|
#> |Mazda RX4         | 21.0|   6|  160| 110| 3.90| 2.620| 16.46|  0|  1|    4|    4|
#> ...
```

**Explanation:** `kable()` returns a markdown-formatted string when output format is HTML or PDF and pipes through pandoc cleanly; pass `format = "html"` only if you need raw HTML for further styling. The `align` argument accepts either a single character like `"r"` (right-align everything except the row labels) or a per-column string like `"lrrrrr"`. For numeric formatting use the `digits` argument, which avoids fragile global `options(scipen = ...)` hacks.

</details>

### Exercise 3.3: Style a kable with kableExtra striped rows and a header group

**Task:** The previous table needs alternating striped rows in HTML and a grouped header that labels columns 2 through 5 as "Engine" and columns 6 through 12 as "Performance". Pipe the kable through `kableExtra::kable_styling()` and `kableExtra::add_header_above()` and save the result to `ex_3_3`.

**Expected result:**

```
#> <table class="table table-striped">
#>   <thead>
#>     <tr><th></th><th colspan="4">Engine</th><th colspan="7">Performance</th></tr>
#>     <tr><th></th><th>mpg</th>... </tr>
#>   </thead>
#>   <tbody>...</tbody>
#> </table>
```

**Difficulty:** Intermediate

[HINTS]
Striping and grouped headers only apply to an HTML-format table, and a grouped header must account for the row-label column too.
Build an HTML kable, then pipe through `kableExtra::kable_styling(bootstrap_options = "striped")` and `kableExtra::add_header_above(c(" " = 1, "Engine" = 4, "Performance" = 7))`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- knitr::kable(head(mtcars), format = "html") |>
  kableExtra::kable_styling(bootstrap_options = "striped") |>
  kableExtra::add_header_above(c(" " = 1, "Engine" = 4, "Performance" = 7))
ex_3_3
#> <table class="table table-striped">
#>   <thead>
#>     <tr><th></th><th colspan="4">Engine</th><th colspan="7">Performance</th></tr>
#>     ...
#>   </thead>
#>   <tbody>...</tbody>
#> </table>
```

**Explanation:** `format = "html"` is required because `kable_styling()` only operates on HTML kables; the default markdown output would silently ignore the styling pipe. The named vector passed to `add_header_above()` must sum to the total column count including the row-label column, so the leading `" " = 1` is mandatory. For PDF output, swap to `bootstrap_options = NULL` and use `latex_options = "striped"` instead.

</details>

### Exercise 3.4: Format kable numbers with custom digits per column

**Task:** A monetary summary table needs `mpg` and `wt` rounded to two decimals, `disp` rounded to zero decimals, and a thousand-separator big mark on `disp`. Build the kable call passing a `digits` vector and `format.args`, applied to the first six rows of `mtcars`, and save it to `ex_3_4`.

**Expected result:**

```
#> |                  |   mpg| cyl| disp|  hp| drat|   wt|  qsec| vs| am| gear| carb|
#> |:-----------------|-----:|---:|----:|---:|----:|----:|-----:|--:|--:|----:|----:|
#> |Mazda RX4         | 21.00|   6|  160| 110| 3.90| 2.62| 16.46|  0|  1|    4|    4|
#> |Hornet 4 Drive    | 21.40|   6|  258| 110| 3.08| 3.21| 19.44|  1|  0|    3|    1|
#> ...
```

**Difficulty:** Intermediate

[HINTS]
Per-column rounding needs one rounding value per column, while a thousand-separator is a formatting argument rather than a rounding one.
Pass `digits` as a length-11 vector and `format.args = list(big.mark = ",")` to `knitr::kable(head(mtcars), ...)`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- knitr::kable(
  head(mtcars),
  digits = c(2, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0),
  format.args = list(big.mark = ",")
)
ex_3_4
#> |                  |   mpg| cyl| disp|  hp| drat|   wt|  qsec| vs| am| gear| carb|
#> |:-----------------|-----:|---:|----:|---:|----:|----:|-----:|--:|--:|----:|----:|
#> |Mazda RX4         | 21.00|   6|  160| 110| 3.90| 2.62| 16.46|  0|  1|    4|    4|
#> ...
```

**Explanation:** Pass `digits` as a vector of length equal to the data column count to control per-column rounding; pass a scalar for uniform rounding. `format.args` is forwarded to base R's `format()` and accepts `big.mark`, `decimal.mark`, `scientific`, and so on. For percentages, format the value upstream with `scales::percent()` and then drop the column into kable as a character; otherwise `digits` will fight with your formatter.

</details>

### Exercise 3.5: Set fig.show='hold' to display two plots side by side

**Task:** A diagnostics chunk should produce two ggplot figures shown side by side rather than stacked, each one half the chunk width. Compose the chunk header with the right `out.width`, `fig.show`, and `fig.ncol` options and save it to `ex_3_5`.

**Expected result:**

```
#> {r diag-plots, fig.show='hold', out.width='50%', fig.ncol=2}
```

**Difficulty:** Intermediate

[HINTS]
To place plots side by side, knitr must hold their output until the chunk ends and know each plot's display width and how many fit per row.
Compose `{r diag-plots, ...}` with `fig.show='hold'`, `out.width='50%'`, and `fig.ncol=2`.

```r title="Your turn"
ex_3_5 <- # your code here
cat(ex_3_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- "{r diag-plots, fig.show='hold', out.width='50%', fig.ncol=2}"
cat(ex_3_5)
#> {r diag-plots, fig.show='hold', out.width='50%', fig.ncol=2}
```

**Explanation:** `fig.show='hold'` tells knitr to defer rendering plot output until the end of the chunk so multiple plots can be laid out together rather than appearing inline with the print statements that produced them. `out.width='50%'` is the display width in the final document, distinct from `fig.width`, which is the device-side rendering width. `fig.ncol` controls the column count of the resulting grid. For three plots at one-third width, switch to `out.width='33%', fig.ncol=3`.

</details>

## Section 4. Parameterised and Programmatic Rendering (5 problems)

### Exercise 4.1: Reference two params in an R chunk and filter a dataset

**Task:** A regional report receives `params$region` and `params$cutoff_date` from the YAML header and needs to filter a sales tibble down to rows matching that region and dated on or after the cutoff. Write the R code that performs the filter and save the filtered tibble to `ex_4_1`. Use the inline tibble built right below.

```r
sales <- tibble::tibble(
  region   = c("EMEA","EMEA","APAC","APAC","NA"),
  sale_dt  = as.Date(c("2026-01-15","2026-03-02","2026-02-20","2026-04-10","2026-03-25")),
  revenue  = c(120, 340, 210, 480, 195)
)
params <- list(region = "EMEA", cutoff_date = as.Date("2026-02-01"))
```

**Expected result:**

```
#> # A tibble: 1 x 3
#>   region sale_dt    revenue
#>   <chr>  <date>       <dbl>
#> 1 EMEA   2026-03-02     340
```

**Difficulty:** Intermediate

[HINTS]
The two parameters arrive as fields of a named list, and the date comparison only works because the cutoff is a real Date.
Filter `sales` keeping rows where `region == params$region` and `sale_dt >= params$cutoff_date`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- sales |>
  filter(region == params$region, sale_dt >= params$cutoff_date)
ex_4_1
#> # A tibble: 1 x 3
#>   region sale_dt    revenue
#>   <chr>  <date>       <dbl>
#> 1 EMEA   2026-03-02     340
```

**Explanation:** Inside an Rmd, `params` is a regular named list available everywhere; you reference fields with `$` exactly like any list. The YAML `value: !r Sys.Date()` ensures `cutoff_date` arrives as a Date, so date-comparison works without coercion. If you ever see a date comparison silently match zero rows, check `class(params$cutoff_date)`: a string default coerces silently to character and produces lexicographic comparisons that look like dates but aren't.

</details>

### Exercise 4.2: Render the same Rmd across a vector of regions

**Task:** A reporting pipeline needs to produce one HTML deliverable per region in `c("EMEA","APAC","NA")` from the same source file `report.Rmd`, with each output named `report_<region>.html`. Compose the R code that iterates over the regions and saves the resulting character vector of output paths to `ex_4_2`.

**Expected result:**

```
#> [1] "report_EMEA.html" "report_APAC.html" "report_NA.html"
```

**Difficulty:** Advanced

[HINTS]
Iterate the regions, render once per region into a region-named file, and keep each render isolated so one region's parameters do not leak into the next.
Use `vapply()` over the regions calling `rmarkdown::render()` with `output_file`, `params`, and `envir = new.env()`, with template `character(1)`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
regions <- c("EMEA", "APAC", "NA")
ex_4_2 <- vapply(
  regions,
  function(r) rmarkdown::render(
    "report.Rmd",
    output_file = paste0("report_", r, ".html"),
    params      = list(region = r),
    envir       = new.env()
  ),
  character(1)
)
ex_4_2
#> [1] "report_EMEA.html" "report_APAC.html" "report_NA.html"
```

**Explanation:** Each `render()` call must use a fresh environment via `envir = new.env()`, otherwise the second render would inherit the first one's `params` and side effects, producing wrong-region output that silently looks right. `vapply()` with `character(1)` enforces a single-string return type, which catches a render error early rather than letting it surface as a list with an `NA` element. For dozens of regions, swap to `furrr::future_map()` to render in parallel processes.

</details>

### Exercise 4.3: Include a child Rmd that holds a shared header section

**Task:** Every regional report should start with the same boilerplate disclaimer chunk held in `_disclaimer.Rmd`. Inside the parent Rmd, write the R code that knits the child and saves the resulting character string of rendered markdown to `ex_4_3`.

**Expected result:**

```
#> [1] "## Disclaimer\n\nThis report contains forward-looking statements...\n"
```

**Difficulty:** Advanced

[HINTS]
Shared boilerplate lives in its own child file that the parent knits and captures as a string of rendered markdown.
Call `knitr::knit_child("_disclaimer.Rmd", envir = environment(), quiet = TRUE)`.

```r title="Your turn"
ex_4_3 <- # your code here
cat(ex_4_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- knitr::knit_child(
  "_disclaimer.Rmd",
  envir = environment(),
  quiet = TRUE
)
cat(ex_4_3)
#> ## Disclaimer
#> 
#> This report contains forward-looking statements...
```

**Explanation:** `knit_child()` returns the rendered markdown as a single string, so you wrap the call in an inline R expression: `` `r knitr::knit_child("_disclaimer.Rmd")` `` inside body text injects it at that exact spot. The leading underscore on the filename is a convention indicating "not a standalone output", and rmarkdown will skip it when you call `rmarkdown::render_site()`. Passing `envir = environment()` lets the child see the parent's variables, including `params`.

</details>

### Exercise 4.4: Pass an environment variable into params at render time

**Task:** A CI job sets the environment variable `REPORT_REGION` before calling render, and the Rmd needs to pick it up as the `region` parameter without hard-coding the value in YAML. Write the R call that reads the env var and renders `report.Rmd`, saving the returned output file path to `ex_4_4`.

**Expected result:**

```
#> [1] "report.html"
```

**Difficulty:** Advanced

[HINTS]
Read the value from the environment at render time and supply a fallback so a missing variable does not silently empty the report.
Pass `params = list(region = Sys.getenv("REPORT_REGION", unset = "EMEA"))` to `rmarkdown::render("report.Rmd", ...)`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- rmarkdown::render(
  "report.Rmd",
  params = list(region = Sys.getenv("REPORT_REGION", unset = "EMEA"))
)
ex_4_4
#> [1] "report.html"
```

**Explanation:** `Sys.getenv()` with `unset = "EMEA"` provides a fallback when the env var is missing; without it, an unset variable returns the empty string, which silently produces a report filtered to zero rows. CI pipelines normally export the variable before invoking R: `REPORT_REGION=APAC Rscript -e 'rmarkdown::render(...)'`. For secret values (API tokens) prefer `Sys.getenv()` over passing them on the command line, where they end up in shell history.

</details>

### Exercise 4.5: Build a grid of param combinations and render each one

**Task:** A weekly cross-tab needs one HTML per combination of region and product line drawn from `tidyr::expand_grid(region = c("EMEA","APAC"), product = c("widgets","gadgets"))`. Write the code that walks the grid with `purrr::pmap_chr()` and returns the output file paths, saving the character vector to `ex_4_5`.

**Expected result:**

```
#> [1] "report_EMEA_widgets.html" "report_EMEA_gadgets.html"
#> [3] "report_APAC_widgets.html" "report_APAC_gadgets.html"
```

**Difficulty:** Advanced

[HINTS]
Walk every row of the region-by-product grid, rendering one isolated report each into a file named after the combination.
Use `purrr::pmap_chr()` over the `expand_grid()` result, calling `rmarkdown::render()` with `output_file`, `params`, and `envir = new.env()`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(purrr)
library(tidyr)
grid <- expand_grid(region = c("EMEA","APAC"), product = c("widgets","gadgets"))
ex_4_5 <- pmap_chr(grid, function(region, product) {
  rmarkdown::render(
    "report.Rmd",
    output_file = paste0("report_", region, "_", product, ".html"),
    params      = list(region = region, product = product),
    envir       = new.env()
  )
})
ex_4_5
#> [1] "report_EMEA_widgets.html" "report_EMEA_gadgets.html"
#> [3] "report_APAC_widgets.html" "report_APAC_gadgets.html"
```

**Explanation:** `pmap_chr()` runs the function once per row of `grid` and binds the results into a character vector, type-checked to be exactly one string per row. `expand_grid()` is the tidyverse equivalent of base R's `expand.grid()` but preserves column order and returns a tibble. For a sparse subset (only EMEA-widgets and APAC-gadgets), build the tibble directly with `tribble()` rather than a full grid then filter, which keeps intent visible to the reader.

</details>

## Section 5. References, Cross-references, and Quarto Crossover (5 problems)

### Exercise 5.1: Cite a BibTeX entry inline and add a references heading

**Task:** A literature review needs an inline citation to entry `smith2020` in parentheses with a page number, followed by a level-two heading "References" that pandoc will populate automatically. Compose the markdown body snippet containing both the inline citation and the heading, and save the snippet to `ex_5_1`.

**Expected result:**

```
#> The drift detection approach builds on prior work [@smith2020, p. 14].
#> 
#> ## References
```

**Difficulty:** Intermediate

[HINTS]
An inline citation carries a page locator, and an empty section heading lets pandoc fill in the reference list on its own.
Build a string containing `[@smith2020, p. 14]` and a `## References` heading separated by a `\n\n` break.

```r title="Your turn"
ex_5_1 <- # your code here
cat(ex_5_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- "The drift detection approach builds on prior work [@smith2020, p. 14].\n\n## References"
cat(ex_5_1)
#> The drift detection approach builds on prior work [@smith2020, p. 14].
#> 
#> ## References
```

**Explanation:** Pandoc's citeproc reads citations of the form `[@key]` and emits the formatted version per your CSL stylesheet; the page suffix after the comma renders as "(Smith 2020, 14)" or similar. The references section auto-populates at the end of the document, so the convention is to put your `## References` heading near the bottom and pandoc fills it. To cite multiple works at once: `[@smith2020; @jones2021]`.

</details>

### Exercise 5.2: Cross-reference a figure with the bookdown @ref syntax

**Task:** A bookdown document needs a sentence that points to a figure labelled `fig:mpg-wt` (the chunk's label is `mpg-wt`). Compose the markdown sentence using the `\@ref(fig:...)` cross-reference syntax bookdown understands and save it to `ex_5_2`.

**Expected result:**

```
#> As shown in Figure \@ref(fig:mpg-wt), heavier cars consume more fuel.
```

**Difficulty:** Intermediate

[HINTS]
Bookdown turns a chunk label into a numbered figure reference, and the figure-type prefix is part of that reference.
Write the sentence string using `\@ref(fig:mpg-wt)`, escaping the backslash inside the R string.

```r title="Your turn"
ex_5_2 <- # your code here
cat(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- "As shown in Figure \\@ref(fig:mpg-wt), heavier cars consume more fuel."
cat(ex_5_2)
#> As shown in Figure \@ref(fig:mpg-wt), heavier cars consume more fuel.
```

**Explanation:** Bookdown prepends `fig:`, `tab:`, or `eq:` to the chunk label depending on the artifact type, which is why the cross-reference always specifies the prefix. Cross-references only resolve under the `bookdown::html_document2` (or `pdf_document2`, `word_document2`) output formats, not plain `html_document`. If a reference renders literally as `\@ref(fig:mpg-wt)` in the output, the chunk almost certainly lacks `fig.cap`: bookdown needs a caption to register the label.

</details>

### Exercise 5.3: Build a tabbed section using the .tabset CSS class

**Task:** A model-evaluation chapter needs three tabs (Accuracy, Calibration, Drift) under a single level-two heading, where each tab is a level-three subheading. Compose the markdown snippet using the `{.tabset}` class on the parent heading and save it to `ex_5_3`.

**Expected result:**

```
#> ## Model evaluation {.tabset}
#> 
#> ### Accuracy
#> 
#> ### Calibration
#> 
#> ### Drift
```

**Difficulty:** Intermediate

[HINTS]
An attribute attached to the parent heading converts each child heading beneath it into a clickable tab.
Compose a string with `## Model evaluation {.tabset}` followed by three `### ` subheadings joined by `\n\n`.

```r title="Your turn"
ex_5_3 <- # your code here
cat(ex_5_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- "## Model evaluation {.tabset}\n\n### Accuracy\n\n### Calibration\n\n### Drift"
cat(ex_5_3)
#> ## Model evaluation {.tabset}
#> 
#> ### Accuracy
#> 
#> ### Calibration
#> 
#> ### Drift
```

**Explanation:** The `.tabset` class turns every immediate child heading into a clickable tab, with the first tab active by default. Add `.tabset-pills` for pill-style buttons, or `.tabset-fade` to fade between tabs. To close the tabset, drop back to the parent heading level or higher; otherwise every later subheading also becomes a tab, which is the most common surprise when the section runs longer than expected.

</details>

### Exercise 5.4: Translate an Rmd YAML block into Quarto syntax

**Task:** Migrate the Rmd YAML for an HTML report with floating TOC, code folding, and a `params` block for `region` to its Quarto-flavoured equivalent. Compose the Quarto YAML and save it to `ex_5_4`. Note that Quarto uses `format:` instead of `output:` and dash-keyed field names.

**Expected result:**

```
#> ---
#> title: "Quarterly KPI Review"
#> format:
#>   html:
#>     toc: true
#>     toc-location: left
#>     code-fold: true
#> params:
#>   region: "EMEA"
#> ---
```

**Difficulty:** Intermediate

[HINTS]
Quarto renames the output key, prefers dash-separated field names, and takes plain key-value pairs for parameters.
Write YAML with `format:` containing `html:` carrying `toc: true`, `toc-location: left`, and `code-fold: true`, plus a `params:` block with `region: "EMEA"`.

```r title="Your turn"
ex_5_4 <- # your code here
cat(ex_5_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- '---
title: "Quarterly KPI Review"
format:
  html:
    toc: true
    toc-location: left
    code-fold: true
params:
  region: "EMEA"
---'
cat(ex_5_4)
#> ---
#> title: "Quarterly KPI Review"
#> format:
#>   html:
#>     toc: true
#>     toc-location: left
#>     code-fold: true
#> params:
#>   region: "EMEA"
#> ---
```

**Explanation:** Quarto normalises field names to dash-separated lowercase (`toc-location`, `code-fold`) versus Rmd's `toc_float`, `code_folding`; both engines accept either convention but Quarto code in the wild uses dashes. The top-level key is `format:` (not `output:`), and the HTML-specific options live one level deeper under `html:`. Quarto's `params:` block accepts plain key-value pairs without the `value:` wrapper Rmd needs for typed defaults.

</details>

### Exercise 5.5: Build a per-region render pipeline that titles each report dynamically

**Task:** A pipeline renders one HTML per region in `c("EMEA","APAC","NA")` and the rendered output should carry a region-specific title like "Q1 KPI Review: EMEA" rather than the static YAML title. Write the R code that uses `output_options` to inject a per-region title at render time, and save the resulting character vector of file paths to `ex_5_5`.

**Expected result:**

```
#> [1] "report_EMEA.html" "report_APAC.html" "report_NA.html"
```

**Difficulty:** Advanced

[HINTS]
Each render needs a region-specific title that overrides the static YAML one, supplied at render time rather than baked into the source.
Inside a `vapply()` loop call `rmarkdown::render()` with `output_options = list(pandoc_args = c("--metadata", paste0("title=Q1 KPI Review: ", r)))` alongside `output_file`, `params`, and `envir`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
regions <- c("EMEA","APAC","NA")
ex_5_5 <- vapply(regions, function(r) {
  rmarkdown::render(
    "report.Rmd",
    output_file    = paste0("report_", r, ".html"),
    params         = list(region = r),
    output_options = list(pandoc_args = c("--metadata", paste0("title=Q1 KPI Review: ", r))),
    envir          = new.env()
  )
}, character(1))
ex_5_5
#> [1] "report_EMEA.html" "report_APAC.html" "report_NA.html"
```

**Explanation:** Pandoc reads metadata from both YAML and command-line `--metadata key=value` pairs, with command-line winning, which is how you override the static YAML title without editing the source. `output_options` is forwarded to the underlying output-format function (`html_document()` here), so `pandoc_args` lands in the right place. For a richer override (subtitle, author, date) chain multiple `--metadata` pairs in the same vector.

</details>

## What to do next

- Walk through the parent tutorial: [R Tutorial](R-Tutorial.html) for the foundational concepts these reports build on.
- Practice the data manipulation that feeds your reports with the [dplyr Exercises](dplyr-Exercises-in-R.html).
- Sharpen the tables and figures inside your reports with the [ggplot2 Exercises](ggplot2-Exercises-in-R.html).
- Drill the data-loading layer with the [Reading Data Exercises](Reading-Data-Exercises-in-R.html).
