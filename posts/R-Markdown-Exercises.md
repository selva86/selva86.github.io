---
title: "R Markdown Exercises: 25 Practice Problems"
slug: "R-Markdown-Exercises"
description: "Master R Markdown with 25 practice problems: chunks, output formats, parameters, tables, knitr options. Hidden solutions."
keywords: "R Markdown exercises, Quarto practice, R Markdown practice problems, knitr exercises, rmd exercises"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R Markdown Exercises"
sidebar_order: 134
fr_parent: "R-Tutorial.html"
auto_link_terms: "R Markdown exercises|Quarto practice|R Markdown practice problems|knitr exercises"
auto_link_case_sensitive: false
target_keyword: "R Markdown exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# R Markdown Exercises: 25 Practice Problems

<p class="lead">Twenty-five practice problems on R Markdown: chunks, output formats, parameterised reports, tables, references, knitr options. Solutions hidden.</p>

```r title="Run this once before any exercise"
library(rmarkdown)
library(knitr)
```

### Exercise 1: Minimal Rmd

**Difficulty:** Beginner. YAML + body that renders to HTML.

<details><summary>Show solution</summary>

```yaml
---
title: "Demo"
output: html_document
---

# Hello

Some text.
```

</details>

### Exercise 2: PDF output

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```yaml
output: pdf_document
```

</details>

### Exercise 3: Word output

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```yaml
output: word_document
```

</details>

### Exercise 4: Multiple outputs

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```yaml
output:
  html_document: default
  pdf_document: default
```

</details>

### Exercise 5: Code chunk

**Difficulty:** Beginner.

````
```{r}
mean(mtcars$mpg)
```
````

<details><summary>Show solution</summary>

A code chunk with `{r}` runs and shows code + output.

</details>

### Exercise 6: Chunk options echo=FALSE

**Difficulty:** Intermediate.

````
```{r echo=FALSE}
plot(mtcars$wt, mtcars$mpg)
```
````

<details><summary>Show solution</summary>

Hides code; shows output. Useful for narrative-heavy reports.

</details>

### Exercise 7: Chunk options message=FALSE

**Difficulty:** Intermediate.

````
```{r message=FALSE, warning=FALSE}
library(dplyr)
```
````

<details><summary>Show solution</summary>

Suppresses package-load messages and warnings.

</details>

### Exercise 8: Cache=TRUE

**Difficulty:** Intermediate.

````
```{r cache=TRUE}
slow_thing <- Sys.sleep(2)
```
````

<details><summary>Show solution</summary>

Saves chunk results so re-runs are fast.

</details>

### Exercise 9: Inline R

**Difficulty:** Intermediate.

```
The mean MPG is `r mean(mtcars$mpg)`.
```

<details><summary>Show solution</summary>

Backtick-r-space inserts an R expression result inline.

</details>

### Exercise 10: knitr::kable for tables

**Difficulty:** Intermediate.

````
```{r}
knitr::kable(head(mtcars))
```
````

<details><summary>Show solution</summary>

Renders a basic table. For richer styling: kableExtra, gt, flextable.

</details>

### Exercise 11: Figure caption

**Difficulty:** Intermediate.

````
```{r fig.cap="Weight vs MPG"}
plot(mtcars$wt, mtcars$mpg)
```
````

<details><summary>Show solution</summary>

fig.cap adds a caption below the rendered figure.

</details>

### Exercise 12: Figure size

**Difficulty:** Intermediate.

````
```{r fig.width=6, fig.height=4}
plot(1:10)
```
````

<details><summary>Show solution</summary>

Inches by default. dpi controls resolution.

</details>

### Exercise 13: Global options with knitr::opts_chunk

**Difficulty:** Advanced.

````
```{r setup, include=FALSE}
knitr::opts_chunk$set(echo = FALSE, warning = FALSE)
```
````

<details><summary>Show solution</summary>

Sets defaults for ALL chunks. Override per chunk as needed.

</details>

### Exercise 14: Parameterised report

**Difficulty:** Advanced.

```yaml
---
title: "Report"
output: html_document
params:
  region: US
  year: 2024
---
```

<details><summary>Show solution</summary>

Access via `params$region`. Render with rmarkdown::render(..., params = list(...)).

</details>

### Exercise 15: TOC

**Difficulty:** Intermediate.

```yaml
output:
  html_document:
    toc: true
    toc_depth: 2
```

<details><summary>Show solution</summary>

Auto table-of-contents from headings.

</details>

### Exercise 16: Theme

**Difficulty:** Intermediate.

```yaml
output:
  html_document:
    theme: cosmo
```

<details><summary>Show solution</summary>

Built-in Bootswatch themes: cosmo, flatly, journal, etc.

</details>

### Exercise 17: Code folding

**Difficulty:** Intermediate.

```yaml
output:
  html_document:
    code_folding: hide
```

<details><summary>Show solution</summary>

User can show/hide code blocks. Options: none, show, hide.

</details>

### Exercise 18: Tabsets

**Difficulty:** Advanced.

```
## Demo {.tabset}

### Tab A
content A

### Tab B
content B
```

<details><summary>Show solution</summary>

The `{.tabset}` class on a parent header turns child sections into tabs.

</details>

### Exercise 19: Math equation

**Difficulty:** Beginner.

```
$$E = mc^2$$
```

<details><summary>Show solution</summary>

Double-dollar for display; single-dollar for inline. Renders via MathJax.

</details>

### Exercise 20: Bibliography

**Difficulty:** Advanced.

```yaml
output: html_document
bibliography: refs.bib
```

<details><summary>Show solution</summary>

Cite with `[@key]`. Generate refs section automatically.

</details>

### Exercise 21: Render programmatically

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
rmarkdown::render("report.Rmd", output_format = "html_document")
```

</details>

### Exercise 22: Custom output filename

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
rmarkdown::render("report.Rmd", output_file = "out_2024.html")
```

</details>

### Exercise 23: Render with parameters

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
rmarkdown::render("report.Rmd", params = list(region = "EU", year = 2024))
```

</details>

### Exercise 24: Loop over many parameters

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
for (r in c("US","EU","ASIA")) {
  rmarkdown::render("report.Rmd",
                    output_file = paste0("report_", r, ".html"),
                    params = list(region = r))
}
```

</details>

### Exercise 25: Quarto equivalent

**Difficulty:** Intermediate.

```yaml
---
title: "Quarto"
format: html
---
```

<details><summary>Show solution</summary>

Quarto is the modern successor. `quarto render report.qmd` from terminal. Mostly compatible Rmd syntax.

</details>

## What to do next

- **Shiny-Exercises** (shipped) — interactive reports.
- **ggplot2-Exercises** (shipped) — visuals inside reports.
