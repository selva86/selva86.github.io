---
title: "stringr str_to_upper() in R: Uppercase Strings With Locale"
slug: "stringr-str_to_upper-in-R"
description: "Use stringr str_to_upper() in R to convert character vectors to uppercase. Locale aware, NA safe, vectorised, with 5 examples, comparisons, and pitfalls."
keywords: "stringr str_to_upper, str_to_upper function R, stringr str_to_upper examples, R uppercase string, R convert text to uppercase, str_to_upper vs toupper, str_to_upper locale"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_to_upper()|stringr str_to_upper|stringr::str_to_upper()|R uppercase strings|str_to_upper function"
auto_link_case_sensitive: true
target_keyword: "stringr str_to_upper"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_to_upper() in R: Uppercase Strings With Locale

<p class="lead">stringr str_to_upper() converts every element of a character vector to uppercase. It is vectorised, NA aware, and locale aware via the underlying stringi engine, which makes it more predictable than base R toupper() across platforms and Unicode inputs.</p>

[QUICK ANSWER]
str_to_upper(x)                          # default English locale
str_to_upper(c("hello", "world"))        # vector input
str_to_upper(x, locale = "tr")           # Turkish dotted I rules
str_to_upper(NA_character_)              # NA, not "NA" (NA-safe)
str_to_upper(c("usd", "eur", "jpy"))     # standardize currency codes
df |> mutate(code = str_to_upper(code))  # uppercase a column
str_to_upper("straße", locale = "de")    # German ß rules
str_to_upper(c("abc", "Mixed", ""))      # empty string stays ""

[DECISION TREE: Is str_to_upper() the right tool?]
- uppercase the whole string: str_to_upper(x)
- lowercase instead: str_to_lower(x)
- title case (each word capitalized): str_to_title(x)
- sentence case (first letter only): str_to_sentence(x)
- case-insensitive match without changing data: str_detect(x, regex("foo", ignore_case = TRUE))
- pad to fixed width after uppercasing: str_pad(str_to_upper(x), 5, "right")
- strip accents before uppercasing: str_to_upper(stringi::stri_trans_general(x, "Latin-ASCII"))

## What str_to_upper() does in one sentence

**str_to_upper(string, locale = "en") returns a copy of the input with every character mapped to its uppercase equivalent.** It works element-wise on a character vector, propagates NA inputs as NA outputs, leaves digits and punctuation unchanged, and uses Unicode-aware rules drawn from the stringi package so the result is identical on Windows, macOS, and Linux.

Use str_to_upper() whenever you need a canonical loud form of text, for example when standardising ticker symbols, ISO currency codes, or fields that downstream systems expect in uppercase.

```r title="Load stringr and uppercase a vector"
library(stringr)

x <- c("usd", "eur", "jpy", NA, "")
str_to_upper(x)
#> [1] "USD" "EUR" "JPY" NA    ""
```

The output keeps the original length, NA stays NA, and the empty string is returned unchanged.

## Syntax

**str_to_upper(string, locale = "en") takes two arguments.** The first is the character vector you want to transform; the second is an ISO 639 language code that selects locale-specific rules. The default `"en"` covers most ASCII and Latin text.

```r title="Function signature and defaults"
# str_to_upper(string, locale = "en")
#
# string : character vector to uppercase
# locale : ISO 639 language code, e.g. "en", "tr", "de"
#          determines locale-specific casing rules
```

Because str_to_upper() is vectorised, you can apply it to thousands of strings in one call without writing a loop.

```r title="Vectorised across an entire column"
words <- c("apple", "Banana", "CHERRY", "date")
str_to_upper(words)
#> [1] "APPLE"  "BANANA" "CHERRY" "DATE"
```

Every element is processed independently and the original order is preserved, so str_to_upper() drops cleanly into a `mutate()` or `sapply()` pipeline.

[NOTE]
**str_to_upper() is the stringi-backed twin of base R toupper().** They agree on plain ASCII but diverge on locale-sensitive characters, where toupper() depends on the system locale and str_to_upper() reads its `locale` argument. Use str_to_upper() in production code that runs on multiple machines.

## Five common str_to_upper() scenarios

**Five scenarios cover almost every real use of str_to_upper().** Each block stands alone so you can paste it into the live console.

### Standardise currency or ticker codes

**Financial fields almost always travel in uppercase.** Casting raw input to str_to_upper() guarantees a uniform canonical form before joins or validations.

```r title="Normalise mixed-case ISO currency codes"
raw_codes <- c("usd", "Eur", "JPY", "gbp", "Chf")
str_to_upper(raw_codes)
#> [1] "USD" "EUR" "JPY" "GBP" "CHF"
```

Once the codes are uniform, `%in%` checks against an ISO 4217 lookup behave predictably and the same row will not appear twice under different casings.

### Build display labels for plots and tables

**Chart annotations often look better in all caps.** Combine str_to_upper() with `mutate()` to create a presentation-only column without overwriting your original data.

```r title="Add an uppercase display label to mtcars"
library(dplyr)
mtcars |>
  tibble::rownames_to_column("model") |>
  mutate(label = str_to_upper(model)) |>
  select(model, label) |>
  head(3)
#>               model            label
#> 1         Mazda RX4        MAZDA RX4
#> 2     Mazda RX4 Wag    MAZDA RX4 WAG
#> 3        Datsun 710       DATSUN 710
```

The original `model` column stays intact for filtering and joins, while `label` is ready to feed into `geom_text()` or a kable header.

### Validate input against an uppercase enum

**APIs and configuration files often define enums in capitals.** str_to_upper() lets users type whatever case they want while the matcher still works.

```r title="Case-insensitive validation against allowed values"
allowed <- c("DEBUG", "INFO", "WARN", "ERROR")
typed   <- c("debug", "Info", "WARNING", "error")

str_to_upper(typed) %in% allowed
#> [1]  TRUE  TRUE FALSE  TRUE
```

The third value, `"WARNING"`, fails because the enum spells it `"WARN"`; case is no longer the problem, the wrong word is.

### Locale-aware uppercasing for non-English text

**Turkish has both a dotted and a dotless I.** The default `"en"` locale maps `"i"` to `"I"`; the `"tr"` locale maps it to `"İ"` with the combining dot.

```r title="Turkish dotted I versus English plain I"
word <- "istanbul"
str_to_upper(word, locale = "en")
#> [1] "ISTANBUL"
str_to_upper(word, locale = "tr")
#> [1] "İSTANBUL"
```

Pick the locale that matches your data, or stick with `"en"` when you want stable cross-platform output for ASCII-dominant text.

### Generate hashtag or constant-style identifiers

**Code generators often need SHOUTING_SNAKE_CASE constants.** Pair str_to_upper() with str_replace_all() to flip phrases into legal identifier style.

```r title="Phrase to constant identifier"
phrases <- c("max retries", "default timeout", "user agent")
str_to_upper(str_replace_all(phrases, " ", "_"))
#> [1] "MAX_RETRIES"     "DEFAULT_TIMEOUT" "USER_AGENT"
```

The same chain works for hashtag prefixes, environment variable names, or feature-flag keys.

[KEY INSIGHT]
**str_to_upper() is a presentation step, not a content change.** It is safe at the edges of your pipeline (display, export, validation) but risky in the middle, because uppercasing can mask subtle character differences such as `"i"` versus `"İ"` that downstream systems will treat as distinct.

## str_to_upper() vs toupper() vs str_to_lower() vs str_to_title()

**Four functions look similar but solve different problems.** Picking the wrong one usually shows up as inconsistent output across platforms or as overly aggressive casing.

| Function | Source | Locale aware? | NA safe? | Best for |
|---|---|---|---|---|
| `str_to_upper(x)` | stringr / stringi | yes (`locale = "en"` default) | yes (NA in, NA out) | tidyverse code, cross-platform output |
| `toupper(x)` | base R | system-dependent | yes | base-only scripts, ASCII-only data |
| `str_to_lower(x)` | stringr / stringi | yes | yes | normalising free-text input |
| `str_to_title(x)` | stringr / stringi | yes | yes | proper-noun and headline formatting |

Reach for str_to_upper() in pipelines that ship to multiple machines, toupper() in quick base R scripts, str_to_lower() when you need a normalised search key, and str_to_title() when you want a Headline Style result.

## Common pitfalls

**Three pitfalls cause most str_to_upper() surprises.** Each has a one-line fix.

### German ß does not always become SS

**The German sharp s expands to two characters under uppercase rules.** Whether you get `"SS"` depends on the locale and the stringi version, so never assume a one-to-one length.

```r title="Sharp s under different locales"
str_to_upper("straße", locale = "en")
#> [1] "STRASSE"
str_to_upper("straße", locale = "de")
#> [1] "STRASSE"
```

If you index by character position after uppercasing, recompute lengths with `str_length()` rather than reusing the input lengths.

### Forgetting that NA stays NA

**str_to_upper() does not silently coerce NA into the literal string "NA".** That is usually what you want, but it can break code that expects every element to be a real string.

```r title="NA propagates through str_to_upper"
str_to_upper(c("yes", NA, "no"))
#> [1] "YES" NA    "NO"
```

If you need a placeholder, replace NA before uppercasing with `replace_na(x, "")` or `coalesce(x, "")`.

### Uppercasing a factor silently drops levels

**str_to_upper() returns a character vector even if you pass a factor.** That changes the column type, so any code that depended on the factor levels for ordering or modelling will quietly break.

```r title="Factor in, character out"
f <- factor(c("low", "med", "high"), levels = c("low", "med", "high"))
class(str_to_upper(f))
#> [1] "character"
```

Wrap the result with `factor()` to restore the type, or use `forcats::fct_relabel(f, str_to_upper)` to keep the original level order.

[WARNING]
**Coming from Python pandas?** The pandas equivalent is `df["col"].str.upper()`. Both are vectorised and NA-safe, but only stringr exposes a `locale` argument; pandas defaults to the system locale, which behaves like base R toupper().

## Try it yourself

**Try it:** Use the built-in `state.abb` and `state.name` vectors to build a lookup data frame whose `name_upper` column shows each state name in uppercase. Save the result to `ex_states`.

```r title="Your turn: build an uppercase state lookup"
# Try it: uppercase state names alongside their abbreviations
ex_states <- # your code here

head(ex_states)
#> Expected: tibble with columns abb, name, name_upper (50 rows)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(tibble)
ex_states <- tibble(
  abb        = state.abb,
  name       = state.name,
  name_upper = str_to_upper(state.name)
)
head(ex_states)
#> # A tibble: 6 x 3
#>   abb   name       name_upper
#>   <chr> <chr>      <chr>
#> 1 AL    Alabama    ALABAMA
#> 2 AK    Alaska     ALASKA
#> 3 AZ    Arizona    ARIZONA
#> 4 AR    Arkansas   ARKANSAS
#> 5 CA    California CALIFORNIA
#> 6 CO    Colorado   COLORADO
nrow(ex_states)
#> [1] 50
```

**Explanation:** str_to_upper() vectorises across the full `state.name` vector in one call, producing the new `name_upper` column without a loop. The original `name` column stays intact so you can still join on the mixed-case version.

</details>

## Related stringr functions

When str_to_upper() is not quite what you need, these are the next stops:

- [str_to_lower()](stringr-str_to_lower-in-R.html) returns the lowercase form, useful for normalising search keys and free-text input.
- [str_to_title()](stringr-str_to_title-in-R.html) capitalises the first letter of each word for headline-style output.
- [str_to_sentence()](stringr-str_to_sentence-in-R.html) capitalises only the first letter of the entire string.
- [str_detect()](stringr-str_detect-in-R.html) checks for pattern presence and accepts an `ignore_case` flag for case-insensitive matching.
- [str_pad()](stringr-str_pad-in-R.html) pads strings to a fixed width, often paired with str_to_upper() when generating fixed-format codes.
- The full [stringr reference](https://stringr.tidyverse.org/reference/case.html) documents every case-conversion helper.

## FAQ

**What is the difference between str_to_upper() and toupper() in R?**

Both convert text to uppercase, but str_to_upper() uses the stringi engine and accepts an explicit `locale` argument, while toupper() depends on the system locale set by the operating system. That makes str_to_upper() preferable when your code runs on multiple machines or when the input contains non-English characters that need locale-specific rules, such as Turkish dotted and dotless I or German sharp s.

**How do I uppercase a column in a data frame?**

Inside a dplyr pipeline, use `mutate()` with str_to_upper(): `df |> mutate(code = str_to_upper(code))`. The function is vectorised, so it processes the entire column in one call without a loop. If the column is a factor, str_to_upper() returns a character vector; wrap with `factor()` or use `forcats::fct_relabel(code, str_to_upper)` if you need to keep factor levels.

**Does str_to_upper() handle accented and Unicode characters?**

Yes. str_to_upper() uses Unicode-aware case mapping from the stringi package, so accented Latin letters, Cyrillic, Greek, and similar scripts are uppercased correctly. The accents are preserved; only the case changes. Note that some characters change length under uppercase rules: German `"ß"` expands to `"SS"`, so do not assume the output has the same character count as the input.

**Why does str_to_upper() turn "i" into "İ" sometimes?**

Turkish has a dotted I, which is the canonical uppercase form of `"i"` in Turkish. When you pass `locale = "tr"`, str_to_upper() applies Turkish casing rules and the dot is preserved on the capital. The default `"en"` locale uses the English convention and produces a plain `"I"`. Always set the locale explicitly when you process multilingual text.

**Can I use str_to_upper() to enforce case-insensitive comparisons?**

Yes, by uppercasing both sides of the comparison: `str_to_upper(x) == str_to_upper(y)`. For pattern matching, an alternative is `str_detect(x, regex("PATTERN", ignore_case = TRUE))`, which avoids mutating the data and reads more clearly when only the comparison itself needs to be case-insensitive.
