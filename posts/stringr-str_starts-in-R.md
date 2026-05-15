---
title: "stringr str_starts() in R: Detect String Prefixes"
slug: "stringr-str_starts-in-R"
description: "Use stringr str_starts() in R to test if strings begin with a pattern. Covers regex, fixed match, case-insensitive, negate, dplyr filter, with 6 examples."
keywords: "stringr str_starts, str_starts function R, str_starts examples, R string starts with, str_starts vs startsWith, detect prefix R, str_starts regex"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_starts()|stringr str_starts|stringr::str_starts()|string starts with|starts with prefix"
auto_link_case_sensitive: true
target_keyword: "stringr str_starts"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_starts() in R: Detect String Prefixes

<p class="lead">The <code>stringr str_starts()</code> function returns TRUE or FALSE for each string indicating whether it begins with a given pattern. It is the readable, vectorized replacement for base R <code>startsWith()</code> when you want regex support.</p>

[QUICK ANSWER]
str_starts(x, "ab")                              # regex prefix
str_starts(x, fixed("a."))                       # literal prefix
str_starts(x, regex("ab", ignore_case = TRUE))   # case-insensitive
str_starts(x, "ab", negate = TRUE)               # opposite
str_starts(x, "^(Mr|Mrs|Ms)\\.")                 # alternative prefixes
str_starts(c("apple","banana"), "a")             # vectorized
filter(df, str_starts(name, "Smith"))            # dplyr filter

[DECISION TREE: Is str_starts() the right tool?]
- test prefix (TRUE/FALSE per string): str_starts()
- test suffix instead of prefix: str_ends()
- match anywhere in the string: str_detect()
- match a literal prefix only: str_starts with fixed()
- extract the prefix that matched: str_extract()
- replace the prefix: str_replace() with ^ anchor
- match exact whole string: str_detect with ^pattern$

## What str_starts() does in one sentence

**`str_starts(string, pattern)` returns a logical vector the same length as `string`, with TRUE where the string begins with the pattern and FALSE elsewhere.** The pattern is a regular expression by default, so you do not need to add a `^` anchor yourself.

It is the simplest way to filter rows by prefix, validate input formats like phone codes or country codes, and partition character vectors by their leading characters.

## Syntax

**`str_starts(string, pattern, negate = FALSE)`. Three arguments, one return type.**

```r title="Load stringr and test a prefix"
library(stringr)

fruit <- c("apple", "banana", "pear", "pineapple")
str_starts(fruit, "p")
#> [1] FALSE FALSE  TRUE  TRUE
```

| Argument | Type | Purpose |
|---|---|---|
| `string` | character vector | Input strings to test |
| `pattern` | regex or modifier | Prefix to match at the start |
| `negate` | logical | If TRUE, return the inverse |

[TIP]
**No need to write `^` yourself.** The function anchors the pattern to the start of each string. `str_starts(x, "ab")` and `str_detect(x, "^ab")` return the same result, but the first reads cleaner and signals intent.

## Six common use cases

### 1. Basic prefix detection

```r title="Strings starting with the letter p"
str_starts(c("apple", "pear", "plum", "kiwi"), "p")
#> [1] FALSE  TRUE  TRUE FALSE
```

The pattern is a regex, but a single literal character behaves identically to a fixed match.

### 2. Multiple alternative prefixes

```r title="Names starting with Mr, Mrs, or Ms"
names <- c("Mr. Smith", "Mrs. Jones", "Dr. Lee", "Ms. Patel")
str_starts(names, "(Mr|Mrs|Ms)\\.")
#> [1]  TRUE  TRUE FALSE  TRUE
```

Group the alternatives in `(...)` and use `|` to mean OR. The escaped `\\.` matches a literal dot.

### 3. Literal (fixed) prefix

```r title="Match a literal opening parenthesis"
codes <- c("(1) intro", "1 intro", "(2) body")
str_starts(codes, fixed("("))
#> [1]  TRUE FALSE  TRUE
```

`fixed()` skips regex parsing entirely. Use it when the prefix contains characters with special regex meaning like `(`, `[`, `.`, `+`, `*`, `?`.

### 4. Case-insensitive prefix match

```r title="Match Apple, APPLE, or apple"
items <- c("Apple Pie", "apple sauce", "APPLE JUICE", "Banana")
str_starts(items, regex("apple", ignore_case = TRUE))
#> [1]  TRUE  TRUE  TRUE FALSE
```

Wrap the pattern in `regex(..., ignore_case = TRUE)`. This is more explicit than lowercasing the input first.

### 5. Negate (find non-matches)

```r title="Strings NOT starting with p"
str_starts(c("apple", "pear", "plum", "kiwi"), "p", negate = TRUE)
#> [1]  TRUE FALSE FALSE  TRUE
```

`negate = TRUE` flips the result. Equivalent to `!str_starts(...)` but reads better in dplyr pipelines.

### 6. Use in dplyr filter

```r title="Filter rows where name starts with Smith"
library(dplyr)
library(tibble)
df <- tibble(
  name = c("Smith, Alice", "Jones, Bob", "Smithson, Carol", "Adams, Dan")
)

df |> filter(str_starts(name, "Smith"))
#> # A tibble: 2 x 1
#>   name
#>   <chr>
#> 1 Smith, Alice
#> 2 Smithson, Carol
```

Note that "Smithson" also matches because the function tests a prefix, not the whole word. Add a word boundary or comma in the pattern to be stricter.

[KEY INSIGHT]
**`str_starts(x, "ab")` is equivalent to `str_detect(x, "^ab")`, but `str_starts()` is the right call when prefix is your intent.** The named function tells the next reader of your code what condition you actually care about. Anchors hidden inside a regex are easy to miss.

## str_starts() vs alternatives

| Function | Package | Regex? | Vectorized | Best for |
|---|---|---|---|---|
| `str_starts()` | stringr | Yes (default) | Yes | Prefix tests in tidyverse code |
| `startsWith()` | base R | No (literal only) | Yes | Pure base R, no extra package |
| `str_detect()` with `^` | stringr | Yes | Yes | Mixed pattern logic, complex regex |
| `grepl()` with `^` | base R | Yes | Yes | Base R when regex is needed |

**Choose `startsWith()` when you want zero dependencies and a literal prefix; choose `str_starts()` when you want regex flexibility or are already inside a stringr/dplyr pipeline.** Performance is comparable on million-element vectors; readability is the real driver.

[NOTE]
**`startsWith()` does not interpret regex.** `startsWith("a.b", "a.")` returns FALSE because it looks for the literal two characters `a` then `.`. `str_starts("a.b", "a.")` returns TRUE because `.` matches any character in regex. Use `fixed()` with `str_starts()` to match base R behavior.

## Common pitfalls

**Pitfall 1: Forgetting that regex metacharacters need escaping.** `str_starts(x, "(")` errors because `(` opens a regex group. Use `fixed("(")` or escape as `"\\("`. The error message is "missing closing parenthesis", which can confuse newcomers.

**Pitfall 2: NA in returns NA out.** `str_starts(c("apple", NA), "a")` returns `c(TRUE, NA)`, not `c(TRUE, FALSE)`. Filtering with `!is.na(x) & str_starts(x, "a")` drops missing values cleanly.

[WARNING]
**Anchors `^` and `$` inside the pattern are still active.** `str_starts(x, "^ab")` works but the `^` is redundant. `str_starts(x, "ab$")` is almost certainly a bug because it asks for a string that both starts with `ab` AND ends with `ab`, which only matches the exact string `"ab"`.

**Pitfall 3: Pattern length zero.** `str_starts(x, "")` returns TRUE for every non-NA element. Validate user-supplied patterns before passing them in.

## Try it yourself

**Try it:** Filter `state.name` to keep only states whose name starts with "New". Save the result to `ex_new_states`.

```r title="Your turn: filter state names"
# Try it: filter state.name to states starting with "New"
ex_new_states <- # your code here

ex_new_states
#> Expected: 4 states (New Hampshire, New Jersey, New Mexico, New York)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_new_states <- state.name[str_starts(state.name, "New ")]
ex_new_states
#> [1] "New Hampshire" "New Jersey"    "New Mexico"    "New York"
```

**Explanation:** `str_starts(state.name, "New ")` returns TRUE for each state whose name begins with "New " (note the trailing space, which excludes hypothetical "Newport"). `state.name[...]` subsets to those four entries.

</details>

## Related stringr functions

After you are comfortable with `str_starts()`, the related boundary and detection tools are worth a look:

- `str_ends()`: the suffix counterpart, same arguments
- `str_detect()`: match a pattern anywhere in the string
- `str_subset()`: return the strings that match instead of a logical vector
- `str_extract()`: pull out the matched portion of each string
- `str_which()`: return integer positions of matching strings
- `startsWith()`: base R equivalent for literal prefixes

For broader stringr context, see the [official stringr reference](https://stringr.tidyverse.org/reference/str_starts.html) for the full list of pattern modifiers.

## FAQ

**How do I check if a string starts with a substring in R?**

Use `stringr::str_starts(string, "prefix")`. It returns a logical vector the same length as `string`, with TRUE for each element that begins with the pattern. The pattern is a regex by default; wrap with `fixed("prefix")` to match the prefix literally without regex parsing.

**What is the difference between str_starts and startsWith in R?**

Both return logical vectors and both are vectorized. `str_starts()` interprets the pattern as a regex by default and lives in the stringr package. `startsWith()` is base R, takes a literal prefix only, and has no regex support. Use `str_starts()` for regex flexibility or tidyverse consistency; use `startsWith()` for zero-dependency code.

**How do I do a case-insensitive str_starts in R?**

Wrap the pattern in `regex(pattern, ignore_case = TRUE)`. For example, `str_starts(x, regex("apple", ignore_case = TRUE))` matches "Apple", "APPLE", and "apple" alike. This is preferred over lowercasing the input because it leaves the original string vector untouched.

**Can str_starts use regex patterns?**

Yes. By default `str_starts()` treats the pattern as a regular expression, so you can use alternatives `(a|b)`, character classes `[A-Z]`, quantifiers `\\d+`, and escaped metacharacters. You do not need to add a `^` anchor; the function applies one internally.

**How do I find strings that do not start with a pattern?**

Pass `negate = TRUE` as the third argument: `str_starts(x, "ab", negate = TRUE)`. This is equivalent to `!str_starts(x, "ab")` but reads better when used as a filter condition in dplyr or in long pipelines.
