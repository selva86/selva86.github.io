---
title: "stringr str_view_all() in R: Highlight Every Regex Match"
slug: "stringr-str_view_all-in-R"
description: "Use stringr str_view_all() to highlight every regex match in a string for debugging. Covers the str_view() rewrite, ANSI output, and 5 worked examples."
keywords: "str_view_all, stringr str_view_all, R regex debug, str_view vs str_view_all, str_view_all examples, R highlight regex matches, stringr visualize regex"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_view_all()|stringr str_view_all|stringr::str_view_all()|highlight regex matches|visualize regex matches"
auto_link_case_sensitive: true
target_keyword: "stringr str_view_all"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_view_all() in R: Highlight Every Regex Match

<p class="lead">The <code>str_view_all()</code> function in stringr highlights every regex match in each input string, printing the strings with matched substrings bracketed and color-coded so you can debug a pattern without writing test code. In stringr 1.5.0 and later it is a deprecated alias for <code>str_view()</code>, which now shows every match by default.</p>

[QUICK ANSWER]
str_view_all(x, "\\d+")                     # highlight every digit run
str_view(x, "\\d+")                         # same in stringr >= 1.5.0
str_view_all(x, fixed("."))                 # literal dot, not regex
str_view_all(x, regex("a", ignore_case=TRUE)) # case-insensitive
str_view_all(x, "\\d+", match = TRUE)       # show only strings with a match
str_view_all(x, "\\d+", match = NA)         # show only strings without a match
str_view_all(c("a", NA), "a")               # NA shown as <NA>

[DECISION TREE: Is str_view_all() the right tool?]
- visually debug a regex against sample strings: str_view_all()
- get the matched text out as a value: str_extract_all()
- count matches per string: str_count()
- get start and end positions of every match: str_locate_all()
- check whether a string matches at all: str_detect()
- replace every match in place: str_replace_all()
- modern stringr equivalent (>= 1.5.0): str_view()

## What str_view_all() does in one sentence

**`str_view_all(string, pattern)` prints each input string with every non-overlapping regex match wrapped in brackets so you can see at a glance where the pattern fires.** The function is a debugging aid, not a data-extraction tool. Its return value is invisible, the printed display is the entire point.

The function exists for one job: shortening the regex feedback loop. Instead of calling `str_extract_all()`, inspecting a list of matches, and mentally re-mapping them to the original strings, you read the highlighted strings directly.

## Syntax and behavior across stringr versions

**The function signature is `str_view_all(string, pattern, match = NA)`, where `match` filters which strings appear in the output.** Set `match = TRUE` to show only strings that contain at least one match, `match = FALSE` to show only strings without a match, or `match = NA` (the default) to show every string.

```r title="Highlight every digit run per string"
library(stringr)

x <- c("order 12 then 345 then 6789", "no numbers", "1 2 3")
str_view_all(x, "\\d+")
#> [1] | order <12> then <345> then <6789>
#> [2] | no numbers
#> [3] | <1> <2> <3>
```

Each input string prints on its own indexed line, with matches wrapped in angle brackets. In an interactive console the brackets are colored; in a plain text capture they appear as the literal characters above. Strings with zero matches still print (as line 2), so you keep visual context.

[TIP]
**Reach for `str_view_all()` the moment a regex behaves unexpectedly on real strings.** Two minutes inspecting the highlighted output saves an afternoon of writing `cat()` and `print()` calls around `str_extract()`.

## str_view vs str_view_all: the 1.5.0 rewrite

**`str_view_all()` and `str_view()` do the same thing in modern stringr; the rename happened in version 1.5.0.** In stringr 1.4 and earlier, `str_view()` showed only the first match per string and `str_view_all()` showed every match. In stringr 1.5.0 (released October 2022), `str_view()` was rewritten to highlight every match and produce styled console output instead of an HTML widget. `str_view_all()` became a deprecated wrapper that simply calls the new `str_view()`.

| Behavior | stringr 1.4.x | stringr 1.5.0+ |
|---|---|---|
| `str_view(x, p)` returns | First match per string | Every match per string |
| `str_view_all(x, p)` returns | Every match per string | Every match (deprecated alias) |
| Output format | HTML widget | ANSI-styled console text |
| Recommended call | `str_view_all()` | `str_view()` |
| Status of `str_view_all()` | Active | Deprecated, still works |

```r title="Confirm both calls now produce identical output"
x <- c("aaa bbb aaa", "no match")
identical(
  capture.output(str_view(x, "a+")),
  capture.output(str_view_all(x, "a+"))
)
#> [1] TRUE
```

The call still works and will keep working for backward compatibility, but `str_view_all()` is the deprecated name. New code should use `str_view()`. Existing scripts can stay as-is, no behavior change.

[KEY INSIGHT]
**The function rename solved an ambiguity that confused beginners for years.** "Show me the matches" almost always meant "show me ALL matches," so the 1.5.0 redesign made the all-matches behavior the default and folded the two functions into one. If you see `str_view_all()` in older tutorials or Stack Overflow answers, mentally replace it with `str_view()` in current stringr.

## Five practical patterns

### 1. Filter to only matching strings

When most of your input is noise, set `match = TRUE` to print only the strings that fire the pattern. The output collapses to the relevant rows so you can scan a long vector quickly.

```r title="Show only the strings that match"
logs <- c(
  "INFO startup ok",
  "ERROR code 42 in auth",
  "INFO heartbeat",
  "ERROR code 7 in db"
)
str_view_all(logs, "code \\d+", match = TRUE)
#> [2] | ERROR <code 42> in auth
#> [4] | ERROR <code 7> in db
```

The line index in brackets is preserved from the original vector, so you still know that the matches came from rows 2 and 4. Use this whenever your sample size is large and the match rate is small.

### 2. Invert the filter to find non-matches

Pass `match = FALSE` to flip the filter and show only the strings without a match. This is the fastest way to spot inputs your regex misses.

```r title="Show only the rows where the regex failed to fire"
ids <- c("USR-001", "usr-002", "USR 003", "user004")
str_view_all(ids, "USR-\\d{3}", match = FALSE)
#> [2] | usr-002
#> [3] | USR 003
#> [4] | user004
```

The failure modes are obvious at a glance: case mismatch, missing dash, different prefix. Tighten with `regex("USR-\\d{3}", ignore_case = TRUE)` or relax to `"USR[-\\s]\\d{3}"`.

### 3. Pair with fixed() for literal strings

Regex metacharacters in a literal lookup are easy to forget. Wrap the pattern in `fixed()` to disable regex and search for the bytes as-is.

```r title="Highlight literal dots, not any-character"
paths <- c("a.b.c", "abc", "x.y")
str_view_all(paths, fixed("."))
#> [1] | a<.>b<.>c
#> [2] | abc
#> [3] | x<.>y
```

Without `fixed()`, the pattern `"."` would match every character in the input. The wrapper signals literal intent and is also faster than the regex engine on long strings.

### 4. Case-insensitive matching with regex()

To switch on case-insensitivity without rewriting the pattern, wrap it in `regex(..., ignore_case = TRUE)`. The same wrapper accepts `multiline`, `dotall`, and `comments` flags.

```r title="Match codes regardless of case"
codes <- c("Err-12", "ERR-99", "err-7", "ok")
str_view_all(codes, regex("err-\\d+", ignore_case = TRUE))
#> [1] | <Err-12>
#> [2] | <ERR-99>
#> [3] | <err-7>
#> [4] | ok
```

All three case variants light up. Without the wrapper, only `err-7` would match the lowercase pattern.

### 5. Highlight word boundaries to debug tokens

The `boundary("word")` matcher is locale-aware and respects contractions and apostrophes. Use it to confirm your tokenizer splits a sentence the way you expect.

```r title="Visualize word-boundary tokenization"
sentence <- "Don't split contractions, please."
str_view_all(sentence, boundary("word"))
#> [1] | <Don't> <split> <contractions>, <please>.
```

`Don't` stays as one token because the boundary matcher knows the apostrophe is part of the word. A naive `\\w+` would split it into two adjacent highlights.

[NOTE]
**Coming from Python?** There is no direct equivalent in `re`. The closest pattern is to loop with `re.finditer()` and print each string with `[m.start():m.end()]` substituted. R's stringr exposes the visual debugger as a one-liner; in Python you build it.

## Common pitfalls

**Pitfall 1: treating the printed output as a value.** `str_view_all()` returns the input invisibly; the display is a side effect. Assigning the result to a variable does not capture the highlighted output. Use `capture.output()` if you need the string form for testing.

**Pitfall 2: looking for the HTML widget.** In stringr 1.4 the function rendered an HTML widget. From 1.5.0 the output is ANSI-styled console text. If you piped the old result into RMarkdown HTML, the widget is gone and the styled text appears in the code chunk instead.

**Pitfall 3: confusing visual highlights with extractable data.** The output is not usable as input to other functions. For matched text as values use `str_extract_all()`; for positions use `str_locate_all()`. `str_view_all()` is for human eyes only.

[WARNING]
**Non-overlapping matches only.** Like every stringr matcher, `str_view_all()` consumes each match before scanning further, so `str_view_all("aaaa", "aa")` highlights two matches, not three. For overlapping matches use a lookahead pattern such as `(?=aa)`; the highlight will mark zero-width positions.

## Try it yourself

**Try it:** Highlight every email-like token in `ex_text` so you can confirm the pattern catches both addresses. Use a pattern that matches one or more non-space characters around an `@`.

```r title="Your turn: highlight emails"
ex_text <- c(
  "contact selva@example.com or hadley@tidyverse.org for details",
  "no email here",
  "support@r-statistics.co is the help line"
)

# Highlight every email-like token below
# str_view_all(...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
str_view_all(ex_text, "\\S+@\\S+")
#> [1] | contact <selva@example.com> or <hadley@tidyverse.org> for details
#> [2] | no email here
#> [3] | <support@r-statistics.co> is the help line
```

**Explanation:** `\\S+@\\S+` matches one or more non-whitespace characters, an `@`, then one or more non-whitespace characters. It is intentionally loose: it catches anything that looks like `local@domain` so you can spot edge cases before tightening to RFC-5322.

</details>

## Related stringr functions

After mastering str_view_all, look at:

- `str_view()`: identical behavior in stringr 1.5.0+, the recommended modern name
- `str_extract_all()`: returns the matched text as a list of character vectors
- `str_locate_all()`: returns the start and end positions of every match
- `str_count()`: returns only the count of matches per string
- `str_detect()`: returns a logical vector, one TRUE/FALSE per string
- `str_replace_all()`: replaces every match with a given string

For full regex syntax, see the official [stringr regular expressions vignette](https://stringr.tidyverse.org/articles/regular-expressions.html).

## FAQ

**Is str_view_all() deprecated in R?**

Yes, in stringr 1.5.0 (October 2022) and later. The function still works for backward compatibility but is a thin wrapper around `str_view()`, which now highlights every match by default. New code should use `str_view()`. Existing scripts do not need to change immediately; the wrapper is not scheduled for removal.

**What is the difference between str_view and str_view_all in R?**

In stringr 1.4 and earlier, `str_view()` highlighted only the first match per string and `str_view_all()` highlighted every match. From stringr 1.5.0, `str_view()` highlights every match by default and `str_view_all()` is a deprecated alias. In modern stringr the two calls are interchangeable.

**Does str_view_all() return a value I can save?**

No, not the highlighted display. The function returns the input string invisibly; the visualization is a side effect printed to the console. To capture the rendered string, wrap the call in `capture.output()`. To extract matched text as values, use `str_extract_all()` instead.

**Why does str_view_all() show colors in the console but not in my saved file?**

The 1.5.0 rewrite uses ANSI color codes that only render in ANSI-aware terminals and IDEs (RStudio console, modern terminals). When you `sink()` the output or redirect to a plain text file, the colors are stripped and the brackets remain as plain `<...>` markers.

**Can str_view_all() handle NA values?**

Yes. NA inputs print as `<NA>` and never match any pattern. They are excluded under `match = TRUE` and included under `match = FALSE`, matching the rest of the stringr family which treats NA as missing rather than as a scannable string.
