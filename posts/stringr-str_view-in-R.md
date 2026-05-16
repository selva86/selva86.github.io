---
title: "stringr str_view() in R: Preview Regex Pattern Matches"
slug: "stringr-str_view-in-R"
description: "Use stringr str_view() in R to preview which strings a regex matches, with matches highlighted in the console. Covers match modes, escapes, and 5 examples."
keywords: "stringr str_view, str_view function R, stringr str_view examples, R str_view regex, view regex matches R, str_view match argument"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_view()|stringr str_view|stringr::str_view()|preview regex matches|view regex matches"
auto_link_case_sensitive: true
target_keyword: "stringr str_view"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_view() in R: Preview Regex Pattern Matches

<p class="lead">The <code>str_view()</code> function in stringr shows you exactly which parts of your strings a regular expression matches, highlighting each match inline in the console. It is a debugging tool for building and verifying regex patterns before you use them in real code.</p>

[QUICK ANSWER]
str_view(x, "pattern")                      # highlight matches, matching strings only
str_view(x, "pattern", match = NA)          # show every string, matched or not
str_view(x, "pattern", match = FALSE)       # show only non-matching strings
str_view(x)                                 # inspect strings, reveal hidden escapes
str_view(x, fixed("."))                     # literal match, no regex parsing
str_view(x, regex("p", ignore_case = TRUE)) # case-insensitive highlight
str_view(x, "pattern", html = TRUE)         # HTML widget for R Markdown

[DECISION TREE: Is str_view() the right tool?]
- preview which strings a regex hits: str_view(x, "pattern")
- get TRUE/FALSE per string: str_detect(x, "pattern")
- pull out the matched text: str_extract(x, "pattern")
- find match start and end position: str_locate(x, "pattern")
- replace what the regex matches: str_replace_all(x, "p", "new")
- count matches inside each string: str_count(x, "pattern")

## What str_view() does in one sentence

**`str_view(string, pattern)` prints each matching string with the matched substrings wrapped in angle brackets so you can see your regex in action.** It does not return data you compute on. It returns a view object meant for your eyes during interactive work.

Think of it as a magnifying glass for regular expressions. You write a pattern, run `str_view()`, and immediately confirm whether it catches what you intended before wiring it into `str_detect()` or `str_replace()`.

## Syntax

**`str_view(string, pattern = NULL, match = TRUE, html = FALSE)`. Only `string` is required; everything else tunes what you see.**

```r title="Load stringr and view a match"
library(stringr)

x <- c("apple", "banana", "pear")
str_view(x, "an")
#> [2] │ b<an><an>a
```

Each argument controls the display:

- `string`: the character vector you want to inspect.
- `pattern`: the regex to highlight. Leave it `NULL` to just inspect the raw strings.
- `match`: `TRUE` shows only matching strings, `FALSE` only non-matching, `NA` shows all.
- `html`: `TRUE` returns an HTML widget instead of console text, useful inside R Markdown.

Notice the output above: only `banana` appears, and `an` is wrapped in `<>` twice because the pattern matches twice. The `[2]` is the original index in the vector.

[TIP]
**Run `str_view()` with no pattern to reveal invisible characters.** `str_view("a\tb\nc")` displays tabs and newlines as visible escape codes, which makes it the fastest way to debug strings that look fine but behave strangely.

## Five common patterns

### 1. Highlight matches in the console

```r title="See where a pattern matches"
str_view(c("cat", "scatter", "dog"), "cat")
#> [1] │ <cat>
#> [2] │ s<cat>ter
```

Only strings containing `cat` are listed. The match is bracketed wherever it occurs, including mid-word in `scatter`.

### 2. Show every string with match = NA

```r title="Display matched and unmatched together"
str_view(c("cat", "scatter", "dog"), "cat", match = NA)
#> [1] │ <cat>
#> [2] │ s<cat>ter
#> [3] │ dog
```

With `match = NA`, `dog` still appears even though nothing is highlighted. This is the best mode when you want full context on a small vector.

### 3. Show only the non-matches

```r title="Find strings your regex misses"
str_view(c("2024-01", "Jan 2024", "2024-12"), "^\\d{4}-\\d{2}$", match = FALSE)
#> [2] │ Jan 2024
```

`match = FALSE` flips the view to show what your pattern failed to catch. Here it surfaces the one date string that does not fit the `YYYY-MM` format.

### 4. Inspect strings without a pattern

```r title="Reveal hidden whitespace and escapes"
str_view(c("clean", "  padded  ", "tab\there"))
#> [1] │ clean
#> [2] │   padded
#> [3] │ tab{\t}here
```

Passing no pattern shows the raw strings. The tab character appears as `{\t}`, exposing formatting problems that a plain `print()` would hide.

### 5. Develop a regex on a real dataset

```r title="Test a pattern on the fruit vector"
str_view(fruit, "berry$")
#> [4]  │ blue<berry>
#> [6]  │ <NA>
#> [22] │ rasp<berry>
#> [69] │ straw<berry>
```

`fruit` is a built-in stringr vector of 80 fruit names. Running `str_view()` against it lets you refine `berry$` until it catches exactly the berries you want.

[KEY INSIGHT]
**`str_view()` is a lens, not a calculation.** It never goes in production code or pipelines. Use it to design and verify a pattern, then move that exact pattern into `str_detect()`, `str_extract()`, or `str_replace()` for the work that actually transforms data.

## str_view() vs related functions

**`str_view()` answers "does my regex look right?", not "what is the result?"** The other stringr functions return values you compute on; `str_view()` returns a display. Pick by what you need back.

| Function | Returns | Use when |
|----------|---------|----------|
| `str_view()` | A printed view (no usable value) | Debugging or teaching a regex |
| `str_detect()` | Logical vector | You need TRUE/FALSE to filter rows |
| `str_extract()` | Character vector of matches | You want the matched text |
| `str_locate()` | Matrix of start/end positions | You need numeric match positions |

Decision rule: if the next line of code uses the result, you do not want `str_view()`. If you are still figuring out the pattern, `str_view()` is the right call.

[NOTE]
**`str_view_all()` is deprecated.** Before stringr 1.5.0, `str_view()` showed only the first match and `str_view_all()` showed every match. Since 1.5.0, `str_view()` shows all matches on its own, and `str_view_all()` just calls `str_view()` with a warning. Use `str_view()` in all new code.

## Common pitfalls

**Pitfall 1: expecting a value back.** `result <- str_view(x, "a")` stores a view object, not the matches. Saving and reusing it almost never does what you want. Reach for `str_extract()` if you need the matched text.

**Pitfall 2: thinking your regex failed.** With the default `match = TRUE`, non-matching strings simply vanish from the output. A short result list does not mean a broken pattern. Add `match = NA` to confirm.

[WARNING]
**Default regex syntax means special characters are not literal.** `str_view(x, "1.5")` highlights `145`, `1a5`, and `1.5` alike, because `.` matches any character. Wrap the pattern in `fixed("1.5")` or escape it as `"1\\.5"` to match a literal dot.

## Try it yourself

**Try it:** Use `str_view()` to preview which entries of the built-in `fruit` vector contain the word "berry". Save nothing; just generate the view into `ex_view`.

```r title="Your turn: preview berry fruits"
# Try it: view fruits containing "berry"
ex_view <- # your code here

ex_view
#> Expected: berry fruits highlighted with <berry>
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_view <- str_view(fruit, "berry")
ex_view
#> [4]  │ blue<berry>
#> [22] │ rasp<berry>
#> [69] │ straw<berry>
```

**Explanation:** `str_view(fruit, "berry")` highlights `berry` wherever it appears in the `fruit` vector. Only the matching entries print, each with the substring wrapped in angle brackets.

</details>

## Related stringr functions

Once a pattern looks correct in `str_view()`, move to the function that does the work:

- `str_detect()`: get a logical vector for filtering
- `str_extract()`: pull the matched substring out
- `str_locate()`: find the numeric position of a match
- `str_replace_all()`: substitute every match
- `str_count()`: count matches within each string

The modifier functions `regex()`, `fixed()`, and `coll()` work inside `str_view()` exactly as they do in those functions, so a pattern you verify here behaves identically downstream. See the [stringr reference](https://stringr.tidyverse.org/reference/str_view.html) for the full argument list.

## FAQ

**What does str_view() do in R?**

`str_view()` prints a character vector with the parts matched by a regular expression highlighted in angle brackets. It is an interactive debugging aid: you use it to confirm a regex pattern is correct before applying it with functions like `str_detect()` or `str_replace()`.

**What is the difference between str_view and str_view_all?**

Before stringr 1.5.0, `str_view()` highlighted only the first match per string and `str_view_all()` highlighted every match. Since 1.5.0, `str_view()` highlights all matches by itself, and `str_view_all()` is deprecated. Always use `str_view()` in new code.

**Why does str_view() not show all my strings?**

By default `match = TRUE`, so only strings that contain a match are displayed. Non-matching strings are hidden. Pass `match = NA` to show every string regardless of whether it matched, or `match = FALSE` to show only the non-matching ones.

**Can I use str_view() output in a script?**

No. `str_view()` returns a view object meant for visual inspection, not data you compute on. Use `str_detect()` for TRUE/FALSE results or `str_extract()` for the matched text. Keep `str_view()` for interactive regex development only.

**How do I see whitespace and special characters with str_view()?**

Call `str_view()` with just the string and no pattern, for example `str_view("a\tb")`. Tabs, newlines, and other escapes render as visible codes like `{\t}`, which makes hidden formatting problems easy to spot.
