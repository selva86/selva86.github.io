---
title: "glue trim() in R: Strip Indentation From Multiline Strings"
slug: "glue-trim-in-R"
description: "Use glue trim() in R to strip common leading indentation and empty edge lines from multiline strings. Five examples, comparison with trimws, three pitfalls."
keywords: "glue trim, trim function R, glue trim examples, R strip indentation multiline, glue trim vs trimws, glue::trim, glue trim heredoc"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "glue::trim()|glue trim|glue trim function|strip indentation in glue|trim multiline string"
auto_link_case_sensitive: true
target_keyword: "glue trim"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue trim() in R: Strip Indentation From Multiline Strings

<p class="lead">glue trim() takes a multiline string and removes the leading whitespace shared across every line, plus any empty first or last line. It is the helper that lets you write heredoc-style templates in R source code without the indentation leaking into the rendered output.</p>

[QUICK ANSWER]
trim("\n  hello\n  world\n")                # strip common indent
trim(glue("\n  a is {a}\n  b is {b}\n"))    # post-process a glue() result
glue::trim(string_var)                       # explicit namespace call
glue("\n  multi\n  line\n", .trim = TRUE)   # glue's built-in equivalent
trim("\nfoo\n  bar\n  baz\n")                # drops empty first/last line
trim(readLines("template.txt"))              # multi-element vector input
as.character(trim(x))                        # cast back to plain character

[DECISION TREE: Is trim() the right tool?]
- clean up a heredoc-style multiline string: trim(x)
- trim per-element whitespace from a vector: trimws(x)
- strip leading or trailing whitespace from one string: stringr::str_trim(x)
- interpolate variables AND trim in one step: glue("...", .trim = TRUE)
- remove all internal whitespace: gsub("\\s+", "", x)
- strip only a fixed number of leading spaces: sub("^ {4}", "", x)

## What trim() does in one sentence

**trim() removes shared leading indentation and empty edge lines from a string so a multiline template in source code renders flush-left.** You pass in a string that may have leading newlines, common indentation, or a trailing newline; you get back the same string with all three stripped.

This is not whitespace squeezing. trim() does not touch spaces inside a line, only the indentation common to every non-empty line and any empty first or last line. The result is what a reader would expect from a Python triple-quoted dedent or a shell heredoc.

```r title="Load glue and trim an indented string"
library(glue)

raw <- "
  Hello
  world
"
trim(raw)
#> Hello
#> world
```

The two leading spaces shared by both lines disappear, the empty first and last lines disappear, and what remains is two flush-left lines.

## Syntax

**trim(x) takes one character vector and returns its trimmed form as a glue object.** There is only one argument and no separator, width, or last-line option. The function is pure string surgery on whatever you pass it.

```r title="Function signature and behaviour"
# trim(x)
#
# x : a character vector. Usually a single string with embedded
#     newlines, though a multi-element vector works too (each
#     element is treated as its own string and trimmed independently).
```

The return value is a `glue` object, which prints without quotes and behaves like a character vector in most contexts. If you need a plain character vector for downstream code that type-checks strictly, wrap the call in `as.character()`.

[TIP]
**Reach for `.trim = TRUE` first.** glue() already calls trim() on its result when you set `.trim = TRUE`, which is the default. Use the standalone trim() only when the input did not come from glue(), like a literal heredoc, a sprintf() result, or a chunk read from disk.

## Common use cases

### 1. Clean up an indented multiline literal

```r title="Strip indentation from a literal heredoc"
sql <- "
  SELECT id, name
  FROM users
  WHERE active = 1
"
trim(sql)
#> SELECT id, name
#> FROM users
#> WHERE active = 1
```

This is the canonical pattern: write SQL or YAML or prose inline with comfortable indentation, then trim() before sending it anywhere. The two-space indent that made the source readable disappears from the output.

### 2. Trim the result of a non-glue function

```r title="Trim a string returned by sprintf"
report <- sprintf("
  Total: %d
  Mean:  %.2f
", 42L, 3.14)
trim(report)
#> Total: 42
#> Mean:  3.14
```

sprintf() does not have a `.trim` option, so the leading newline and shared indent survive. trim() rescues the output and produces a clean two-line report ready for cat() or writeLines().

### 3. Compose a multi-step pipeline with the pipe

```r title="Pipe into trim after glue"
name <- "Selva"
count <- 7
msg <- glue("
  Hi {name},
  You have {count} messages.
", .trim = FALSE) |> trim()
msg
#> Hi Selva,
#> You have 7 messages.
```

Here we deliberately turn off glue's internal trim with `.trim = FALSE`, then re-apply it via the native pipe. The end result is the same as `.trim = TRUE`, but the two-step form is clearer when the post-glue side also does other string transforms.

### 4. Build a template once, trim everywhere

```r title="Trim a stored template before reuse"
tpl <- "
  | row | value |
  |-----|-------|
  | 1   | a     |
  | 2   | b     |
"
cat(trim(tpl))
#> | row | value |
#> |-----|-------|
#> | 1   | a     |
#> | 2   | b     |
```

Storing the template in a variable separates the layout from the rendering. trim() runs at the point of use, so the same template can be passed to cat(), writeLines(), or knitr without each call having to re-handle the leading indent.

[NOTE]
**Indentation must be uniform.** trim() strips only the indentation common to every non-empty line. If one line has two spaces of indent and another has four, trim() removes the two-space prefix and leaves the extra spaces on the second line intact.

## trim() vs trimws() and str_trim()

**The three trim functions cover three different jobs, and mixing them up is the most common mistake.** trim() handles indentation across a whole multiline block. trimws() handles leading and trailing whitespace per element. str_trim() is the stringr equivalent of trimws() with the same per-element semantics.

| Function | Package | Scope | Removes shared indent? | Removes empty edge lines? |
|---|---|---|---|---|
| `glue::trim(x)` | glue | The whole multiline block | Yes | Yes |
| `trimws(x)` | base | Each element of x | No | Only if no other content |
| `stringr::str_trim(x)` | stringr | Each element of x | No | Only if no other content |

The decision rule: use trim() when the input is one string with embedded newlines and you want flush-left output. Use trimws() or str_trim() when the input is a character vector and you want each element cleaned independently.

[KEY INSIGHT]
**trim() thinks in blocks, trimws() thinks in rows.** Picture the input as a rectangle of text. trim() shaves the empty top and bottom rows and the shared left margin off the whole rectangle. trimws() processes each row in isolation and never looks at the others. Pick the function that matches the shape of your problem.

## Common pitfalls

1. **Calling trim() on a vector of independent words.** trim() treats each vector element as its own string and looks for embedded newlines. If you pass `c(" a", " b ", " c")`, you get the same vector back with no per-element trimming, because no element has a leading newline or common indentation across lines. For that, use trimws().

2. **Forgetting glue() already trims.** glue() runs trim() internally when `.trim = TRUE`, which is the default. Calling trim() on the result of a default glue() is harmless but redundant. Only reach for the standalone helper when the input did not pass through glue() with default options.

3. **Mixing tabs and spaces.** trim() compares prefixes literally. A line indented with one tab and a sibling indented with four spaces share no common prefix, so trim() leaves both alone. Normalise the indentation in your editor (or run a regex) before relying on trim() to clean things up.

## Try it yourself

**Try it:** Use trim() to clean up the indented `ex_letter` template below. Save the result to `ex_clean` and confirm it has two lines starting flush-left.

```r title="Your turn: trim an indented multiline string"
# Try it: strip the shared indent
ex_letter <- "
  Dear reader,
  Thanks for reading.
"
ex_clean <- # your code here

ex_clean
#> Expected: Dear reader,
#>           Thanks for reading.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- trim(ex_letter)
ex_clean
#> Dear reader,
#> Thanks for reading.
```

**Explanation:** trim() drops the empty first and last lines and strips the two-space leading indent shared by both content lines. The result is two flush-left lines ready for cat() or any downstream consumer.

</details>

## Related glue functions

- `glue()` interpolates `{expressions}` into a template, and it calls trim() internally by default; reach for it first whenever the input has variables to substitute.
- `glue_data()` is the data-frame counterpart of glue() and inherits the same `.trim` argument for per-row templates.
- `glue_collapse()` joins a character vector into one string; combine it with trim() when the joined result has surrounding whitespace.
- `glue_sql()` and `glue_safe()` are specialised interpolators that also accept `.trim` for safe quoting and signature-checked substitution.
- See the [glue::trim reference](https://glue.tidyverse.org/reference/trim.html) for the source and edge-case behaviour.

## FAQ

**What is the difference between glue trim() and base R trimws()?**

trim() operates on the whole string as one multiline block: it strips the indentation shared across every line and drops empty first or last lines. trimws() operates per element of a character vector and strips leading and trailing whitespace from each element independently. Use trim() for cleaning heredoc-style templates and use trimws() for cleaning user input or column values one element at a time.

**Does trim() remove internal whitespace?**

No. trim() only touches the indentation common to all lines and the first or last line if they are empty. Spaces inside a line, blank lines in the middle of a block, and tabs inside content are all preserved. If you need to squeeze internal whitespace, use `gsub("\\s+", " ", x)` or a stringr regex such as `str_squish()`.

**Why does my glue() output not need trim()?**

Because glue() already calls trim() internally when `.trim = TRUE`, which is the default. The standalone trim() exists for inputs that did not go through glue() with defaults: literal strings, sprintf() output, file reads, or glue() calls where you set `.trim = FALSE` to defer the cleaning step.

**Can trim() handle mixed tab and space indentation?**

Only if the indentation is identical on every line. trim() finds the longest prefix shared by all non-empty lines; if some lines start with a tab and others with spaces, the shared prefix is empty and trim() leaves the indentation in place. Normalise the indentation before calling trim().

**What does trim() return when the input is empty?**

trim() on a zero-length character vector returns a zero-length glue object. trim() on a single empty string `""` returns the same empty string. Neither case throws an error, which makes it safe to call on the output of filter pipelines that may legitimately produce no rows.
