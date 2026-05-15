---
title: "stringr str_ends() in R: Detect String Suffixes"
slug: "stringr-str_ends-in-R"
description: "Use stringr str_ends() in R to test if strings end with a pattern. Covers regex, fixed match, case-insensitive, negate, dplyr filter, with 6 examples."
keywords: "stringr str_ends, str_ends function R, str_ends examples, R string ends with, str_ends vs endsWith, detect suffix R, str_ends regex"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_ends()|stringr str_ends|stringr::str_ends()|string ends with|ends with suffix"
auto_link_case_sensitive: true
target_keyword: "stringr str_ends"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_ends() in R: Detect String Suffixes

<p class="lead">The <code>stringr str_ends()</code> function returns TRUE or FALSE for each string indicating whether it ends with a given pattern. It is the readable, vectorized replacement for base R <code>endsWith()</code> when you want regex support.</p>

[QUICK ANSWER]
str_ends(x, "csv")                              # regex suffix
str_ends(x, fixed(".csv"))                      # literal suffix
str_ends(x, regex("CSV", ignore_case = TRUE))   # case-insensitive
str_ends(x, "csv", negate = TRUE)               # opposite
str_ends(x, "\\.(csv|tsv|txt)")                 # alternative suffixes
str_ends(c("a.csv","b.txt"), "csv")             # vectorized
filter(df, str_ends(file, "\\.log"))            # dplyr filter

[DECISION TREE: Is str_ends() the right tool?]
- test suffix (TRUE/FALSE per string): str_ends()
- test prefix instead of suffix: str_starts()
- match anywhere in the string: str_detect()
- match a literal suffix only: str_ends with fixed()
- extract the suffix that matched: str_extract() with $ anchor
- replace the suffix: str_replace() with $ anchor
- match exact whole string: str_detect with ^pattern$

## What str_ends() does in one sentence

**`str_ends(string, pattern)` returns a logical vector the same length as `string`, with TRUE where the string ends with the pattern and FALSE elsewhere.** The pattern is a regular expression by default, so you do not need to add a `$` anchor yourself.

It is the simplest way to filter file paths by extension, validate input formats like email TLDs or currency codes, and partition character vectors by their trailing characters.

## Syntax

**`str_ends(string, pattern, negate = FALSE)`. Three arguments, one return type.**

```r title="Load stringr and test a suffix"
library(stringr)

files <- c("report.csv", "notes.txt", "data.csv", "image.png")
str_ends(files, "csv")
#> [1]  TRUE FALSE  TRUE FALSE
```

| Argument | Type | Purpose |
|---|---|---|
| `string` | character vector | Input strings to test |
| `pattern` | regex or modifier | Suffix to match at the end |
| `negate` | logical | If TRUE, return the inverse |

[TIP]
**No need to write `$` yourself.** The function anchors the pattern to the end of each string. `str_ends(x, "csv")` and `str_detect(x, "csv$")` return the same result, but the first reads cleaner and signals intent.

## Six common use cases

### 1. File extension filtering

```r title="Find CSV files in a path list"
paths <- c("data/raw.csv", "data/clean.csv", "logs/run.log", "README")
str_ends(paths, "csv")
#> [1]  TRUE  TRUE FALSE FALSE
```

The pattern is a regex, but a single literal substring like `csv` behaves identically to a fixed match because none of its characters are special.

### 2. Multiple alternative suffixes

```r title="Find any tabular data file"
files <- c("a.csv", "b.tsv", "c.xlsx", "d.txt", "e.png")
str_ends(files, "\\.(csv|tsv|txt)")
#> [1]  TRUE  TRUE FALSE  TRUE FALSE
```

Group the alternatives in `(...)` and use `|` to mean OR. The escaped `\\.` matches a literal dot, which is important here because `.` by itself matches any character.

### 3. Literal (fixed) suffix

```r title="Match a literal closing parenthesis"
notes <- c("draft (v1)", "final v2", "review (v3)")
str_ends(notes, fixed(")"))
#> [1]  TRUE FALSE  TRUE
```

`fixed()` skips regex parsing entirely. Use it when the suffix contains characters with special regex meaning like `)`, `]`, `.`, `+`, `*`, `?`.

### 4. Case-insensitive suffix match

```r title="Match .PDF, .pdf, or .Pdf"
docs <- c("report.PDF", "memo.pdf", "draft.Pdf", "scan.png")
str_ends(docs, regex("\\.pdf", ignore_case = TRUE))
#> [1]  TRUE  TRUE  TRUE FALSE
```

Wrap the pattern in `regex(..., ignore_case = TRUE)`. This is more explicit than lowercasing the input first and leaves the original vector untouched.

### 5. Negate (find non-matches)

```r title="Strings NOT ending in csv"
str_ends(c("data.csv", "data.json", "data.parquet"), "csv", negate = TRUE)
#> [1] FALSE  TRUE  TRUE
```

`negate = TRUE` flips the result. Equivalent to `!str_ends(...)` but reads better in dplyr pipelines.

### 6. Use in dplyr filter

```r title="Filter rows where file ends in .log"
library(dplyr)
library(tibble)
df <- tibble(
  file = c("app.log", "app.log.gz", "server.log", "config.yml")
)

df |> filter(str_ends(file, "\\.log"))
#> # A tibble: 2 x 1
#>   file
#>   <chr>
#> 1 app.log
#> 2 server.log
```

Note that `app.log.gz` does not match because the suffix `.log.gz` does not end in `.log`. The function tests the last characters, not whether the substring appears.

[KEY INSIGHT]
**`str_ends(x, "csv")` is equivalent to `str_detect(x, "csv$")`, but `str_ends()` is the right call when suffix is your intent.** The named function tells the next reader of your code what condition you actually care about. Anchors hidden inside a regex are easy to miss.

## str_ends() vs alternatives

| Function | Package | Regex? | Vectorized | Best for |
|---|---|---|---|---|
| `str_ends()` | stringr | Yes (default) | Yes | Suffix tests in tidyverse code |
| `endsWith()` | base R | No (literal only) | Yes | Pure base R, no extra package |
| `str_detect()` with `$` | stringr | Yes | Yes | Mixed pattern logic, complex regex |
| `grepl()` with `$` | base R | Yes | Yes | Base R when regex is needed |

**Choose `endsWith()` when you want zero dependencies and a literal suffix; choose `str_ends()` when you want regex flexibility or are already inside a stringr/dplyr pipeline.** Performance is comparable on million-element vectors; readability is the real driver.

[NOTE]
**`endsWith()` does not interpret regex.** `endsWith("ab.", ".")` returns TRUE because it looks for the literal one character `.`. `str_ends("ab.", ".")` returns TRUE too, but `str_ends("abc", ".")` also returns TRUE because `.` matches any character in regex. Use `fixed(".")` with `str_ends()` to match base R behavior.

## Common pitfalls

**Pitfall 1: Forgetting that regex metacharacters need escaping.** `str_ends(x, ".csv")` matches `"acsv"`, `"1csv"`, and any other one-character-plus-csv ending, not just `".csv"`. Use `fixed(".csv")` or escape as `"\\.csv"` when you want the literal dot.

**Pitfall 2: NA in returns NA out.** `str_ends(c("a.csv", NA), "csv")` returns `c(TRUE, NA)`, not `c(TRUE, FALSE)`. Filtering with `!is.na(x) & str_ends(x, "csv")` drops missing values cleanly.

[WARNING]
**Anchors `^` and `$` inside the pattern are still active.** `str_ends(x, "csv$")` works but the `$` is redundant. `str_ends(x, "^csv")` is almost certainly a bug because it asks for a string that both starts with `csv` AND ends with `csv`, which only matches the exact string `"csv"`.

**Pitfall 3: Pattern length zero.** `str_ends(x, "")` returns TRUE for every non-NA element because every string ends with the empty suffix. Validate user-supplied patterns before passing them in.

## Try it yourself

**Try it:** Filter `state.name` to keep only states whose name ends with "a". Save the result to `ex_a_states`.

```r title="Your turn: filter state names by suffix"
# Try it: filter state.name to states ending with "a"
ex_a_states <- # your code here

length(ex_a_states)
#> Expected: 21 states (Alabama, Alaska, Arizona, ...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_a_states <- state.name[str_ends(state.name, "a")]
length(ex_a_states)
#> [1] 21
head(ex_a_states)
#> [1] "Alabama"    "Alaska"     "Arizona"    "California" "Florida"    "Georgia"
```

**Explanation:** `str_ends(state.name, "a")` returns TRUE for each state whose name has `"a"` as its final character. `state.name[...]` subsets to those 21 entries.

</details>

## Related stringr functions

After you are comfortable with `str_ends()`, the related boundary and detection tools are worth a look:

- `str_starts()`: the prefix counterpart, same arguments
- `str_detect()`: match a pattern anywhere in the string
- `str_subset()`: return the strings that match instead of a logical vector
- `str_extract()`: pull out the matched portion of each string
- `str_which()`: return integer positions of matching strings
- `endsWith()`: base R equivalent for literal suffixes

For broader stringr context, see the [official stringr reference](https://stringr.tidyverse.org/reference/str_starts.html) for the full list of pattern modifiers.

## FAQ

**How do I check if a string ends with a substring in R?**

Use `stringr::str_ends(string, "suffix")`. It returns a logical vector the same length as `string`, with TRUE for each element that ends with the pattern. The pattern is a regex by default; wrap with `fixed("suffix")` to match the suffix literally without regex parsing.

**What is the difference between str_ends and endsWith in R?**

Both return logical vectors and both are vectorized. `str_ends()` interprets the pattern as a regex by default and lives in the stringr package. `endsWith()` is base R, takes a literal suffix only, and has no regex support. Use `str_ends()` for regex flexibility or tidyverse consistency; use `endsWith()` for zero-dependency code.

**How do I do a case-insensitive str_ends in R?**

Wrap the pattern in `regex(pattern, ignore_case = TRUE)`. For example, `str_ends(x, regex("\\.pdf", ignore_case = TRUE))` matches `.PDF`, `.pdf`, and `.Pdf` alike. This is preferred over lowercasing the input because it leaves the original string vector untouched.

**Can str_ends use regex patterns?**

Yes. By default `str_ends()` treats the pattern as a regular expression, so you can use alternatives `(csv|tsv)`, character classes `[0-9]`, quantifiers `\\d+`, and escaped metacharacters. You do not need to add a `$` anchor; the function applies one internally.

**How do I find strings that do not end with a pattern?**

Pass `negate = TRUE` as the third argument: `str_ends(x, "csv", negate = TRUE)`. This is equivalent to `!str_ends(x, "csv")` but reads better when used as a filter condition in dplyr or in long pipelines.
