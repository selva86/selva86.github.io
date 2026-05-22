---
title: "janitor round_half_up() in R: Round Numbers Away From Zero"
slug: "janitor-round_half_up-in-R"
description: "Use janitor round_half_up() to round numeric vectors with conventional half-up rounding, not R's default banker's rounding. Digits, negatives, pitfalls."
keywords: "janitor round_half_up, round_half_up function R, janitor round_half_up examples, R round half up, conventional rounding R, half up rounding R, banker's rounding alternative"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "round_half_up()|janitor round_half_up|janitor::round_half_up()|round half up|conventional rounding"
auto_link_case_sensitive: true
target_keyword: "janitor round_half_up"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor round_half_up() in R: Round Numbers Away From Zero

<p class="lead">The <code>janitor round_half_up()</code> function rounds a numeric vector using conventional half-up rounding so that exact midpoints like 2.5 always go away from zero, instead of R's default banker's rounding that sends 2.5 to 2. It is the small utility you reach for when audit, regulatory, or survey results require the rounding rule that most people expect intuitively.</p>

[QUICK ANSWER]
round_half_up(2.5)                          # 3, not 2
round_half_up(c(0.5, 1.5, 2.5, 3.5))        # 1 2 3 4
round_half_up(-2.5)                         # -3, away from zero
round_half_up(0.125, digits = 2)            # 0.13
round_half_up(c(1.2345, 5.6789), digits = 3)# 1.235 5.679
round_half_up(c(NA, 1.5, 2.5))              # NA 2 3
mtcars$mpg |> round_half_up(digits = 1)     # vectorised over a column

[DECISION TREE: Is round_half_up() the right tool?]
- round a numeric vector with conventional half-up: round_half_up(x, digits = 2)
- round a whole data frame in a tabyl chain: adorn_rounding(df, rounding = "half up")
- keep R's default banker's rounding: round(x, digits = 2)
- explicit half-to-even on a vector: janitor::round_half_to_even(x, digits = 2)
- round by significant digits, not decimals: signif(x, digits = 3)
- format for display (string output): formatC(x, digits = 2, format = "f")
- floor or ceiling, not nearest: floor(x) or ceiling(x)

## What round_half_up() does in one sentence

**`round_half_up()` rounds a numeric vector so exact midpoints move away from zero, matching the convention taught in school.** Internally it shifts the value by 0.5 plus a tiny epsilon, truncates, then restores the original sign, which sidesteps the floating-point edge cases that trip up naive implementations.

The contrast with base R is the whole point. `round(2.5)` returns 2 (IEC 60559 banker's rounding). `round_half_up(2.5)` returns 3, restoring the rule a non-statistician expects.

## Syntax

**`round_half_up()` takes a numeric vector and an integer digits argument, and returns a numeric vector of the same length.** No data frame plumbing, no tidyselect, no extra arguments.

```r title="Load janitor and inspect the signature"
library(janitor)

args(round_half_up)
#> function (x, digits = 0) 
#> NULL
```

The full signature is short:

```
round_half_up(x, digits = 0)
```

`x` is a numeric vector. `digits` is the number of decimal places to keep, defaulting to 0 (integer rounding). The function preserves `NA` values, vectorises naturally, and works inside `dplyr::mutate()`, `sapply()`, or any other vectorised context. There is no `na.rm`, no `rounding` mode toggle, no second positional argument to worry about.

## Common patterns

**Five patterns cover almost every reason to reach for `round_half_up()`.** Run them in order; each block builds on the one before.

### 1. Round to an integer

**The default call rounds to the nearest integer, sending each `.5` away from zero.** This is the most common use: percentages reported as whole numbers, head counts, age in years.

```r title="Round midpoints to integers"
x <- c(0.5, 1.5, 2.5, 3.5, 4.5)
round_half_up(x)
#> [1] 1 2 3 4 5

round(x)
#> [1] 0 2 2 4 4
```

Every midpoint in `x` rounded up under `round_half_up()`. Base R `round()` sent each to the nearest even number, which surprises readers who expected 1, 2, 3, 4, 5.

### 2. Keep decimals with the digits argument

**Pass `digits` to keep N decimal places.** The same half-up rule applies at that scale.

```r title="Round to two decimals"
prices <- c(19.125, 25.005, 4.575, 0.085)
round_half_up(prices, digits = 2)
#> [1] 19.13 25.01  4.58  0.09

round(prices, digits = 2)
#> [1] 19.12 25.00  4.58  0.08
```

The difference shows up wherever the third decimal is exactly 5. In a financial report, the half-up result matches the rule an auditor expects.

[TIP]
**Reach for `round_half_up()` whenever the rounded numbers feed a report a non-technical reader will check.** Survey percentages, dollar amounts, age groups, and grade boundaries all benefit from the conventional rule. Save banker's rounding for places where accumulated bias actually matters, like long simulation chains.

### 3. Negative numbers round away from zero

**For negatives, half-up means "away from zero", not "toward positive infinity".** This matches the intuitive symmetry: 2.5 to 3 mirrors -2.5 to -3.

```r title="Half-up on negative midpoints"
neg <- c(-0.5, -1.5, -2.5, -3.5)
round_half_up(neg)
#> [1] -1 -2 -3 -4
```

A naive `floor(x + 0.5)` implementation gets negatives wrong: it sends -0.5 to 0 and -1.5 to -1 by rounding toward positive infinity. `round_half_up()` uses `sign(x)` and `abs(x)` so the rule stays symmetric.

[WARNING]
**Do not write your own `floor(x + 0.5)` shortcut and assume it matches `round_half_up()`.** It works on positive midpoints, then quietly disagrees on negative ones. The janitor implementation handles this case for you; the time you save by importing the package is the time you do not spend debugging an audit reconciliation.

### 4. Use it inside dplyr pipelines

**`round_half_up()` is just a vector function, so it composes with `mutate()` and `across()`.** This is the natural way to apply it to selected columns of a data frame.

```r title="Round selected columns in a summary"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    mpg_mean = mean(mpg),
    hp_mean  = mean(hp),
    .groups  = "drop"
  ) |>
  mutate(across(c(mpg_mean, hp_mean), \(v) round_half_up(v, digits = 1)))
#>   cyl mpg_mean hp_mean
#>     4     26.7    82.6
#>     6     19.7   122.3
#>     8     15.1   209.2
```

The lambda `\(v) round_half_up(v, digits = 1)` is the pattern: wrap the call so `across()` can pass the column. Without the lambda the second argument never reaches the function.

### 5. Handle NA values without surprises

**`NA` propagates cleanly; no extra argument needed.** This matters in real survey data where missing responses are common.

```r title="NA stays NA"
survey <- c(0.5, NA, 1.5, 2.5, NA)
round_half_up(survey)
#> [1]  1 NA  2  3 NA
```

If you want NAs dropped before rounding, do it explicitly with `na.omit()` or `[complete.cases(.)]`. The function intentionally does not silently remove them.

## Compare with alternatives

**Base R, janitor, and the formatting helpers each round in a different way.** Pick by what the downstream consumer expects.

| Approach | Rounds | Best for |
|---|---|---|
| `janitor::round_half_up()` | Half away from zero | Reports, audits, surveys, anything a non-statistician reviews |
| `base::round()` | Half to even (banker's) | Long simulations, anywhere cumulative bias matters |
| `janitor::round_half_to_even()` | Half to even, vector form | Explicit banker's rounding when you want the name visible |
| `janitor::adorn_rounding()` | Configurable, data frame input | Tabyl chains and `adorn_*` pipelines |
| `base::signif()` | Significant digits, not decimals | Scientific notation, very small or very large values |
| `formatC()` / `sprintf()` | Returns a character string | Display only, when no further math happens |

[KEY INSIGHT]
**Choose `round_half_up()` when the rounded values will be read; choose `round()` when they will be re-aggregated.** Conventional rounding is correct for the reader; banker's rounding is correct for the math. Most reports want the first, most simulations want the second, and the only real mistake is using one when you should have used the other.

## Common pitfalls

**Pitfall 1: assuming `round_half_up()` works on a data frame.** It does not. Passing a data frame returns an error or unexpected coercion. Use `mutate(across(...))` for a data frame, or use `janitor::adorn_rounding()` for a tabyl chain.

**Pitfall 2: assuming `round_half_up()` defeats floating-point error.** A value like `0.1 + 0.2` is not literally 0.3 in memory, so `round_half_up(0.15, digits = 1)` can still return 0.1 in extreme cases. The function adds `sqrt(.Machine$double.eps)` to mitigate this, but it is not a guarantee.

**Pitfall 3: confusing `round_half_up()` with `ceiling()`.** Ceiling always rounds toward positive infinity; half-up rounds the `.5` cases only. `ceiling(2.1)` is 3, but `round_half_up(2.1)` is 2.

## Try it yourself

**Try it:** Take the vector `c(-1.5, -0.5, 0.5, 1.5, 2.5)` and round it with `round_half_up()`. Compare the result with base `round()`. Save the half-up result to `ex_rounded`.

```r title="Your turn: compare rounding rules"
# Try it: half-up vs banker's on midpoints
ex_rounded <- # your code here

ex_rounded
#> Expected: -2 -1 1 2 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
midpoints <- c(-1.5, -0.5, 0.5, 1.5, 2.5)

ex_rounded <- round_half_up(midpoints)
ex_rounded
#> [1] -2 -1  1  2  3

round(midpoints)
#> [1] -2  0  0  2  2
```

**Explanation:** `round_half_up()` rounds each midpoint away from zero, so -1.5 goes to -2 and 0.5 goes to 1. Base R `round()` uses banker's rounding, sending 0.5 to 0 and 1.5 to 2 (toward the even integer). The two rules agree on -1.5 and 2.5 here only by coincidence.

</details>

## Related janitor functions

**`round_half_up()` is one piece of the janitor rounding family.** Each helper sits at a slightly different abstraction level.

- `round_half_to_even()`: vector-level banker's rounding, the explicit twin of `round_half_up()`
- `adorn_rounding()`: data frame rounding for tabyl chains, with a `rounding` mode argument
- `adorn_pct_formatting()`: format proportions as percent strings instead of numerics
- `tabyl()`: build the frequency table that `adorn_rounding()` polishes
- `signif_half_up()`: half-up rounding by significant digits, niche but available
- `clean_names()`: standardise column names before any numeric cleanup

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/round_half_up.html) for the source and full argument list.

## FAQ

**What is the difference between round_half_up() and base R round()?**

`round_half_up()` rounds every exact midpoint away from zero, so 2.5 becomes 3 and -2.5 becomes -3. Base R `round()` uses IEC 60559 banker's rounding, which sends midpoints to the nearest even integer: 2.5 becomes 2 and 3.5 becomes 4. Both are defensible, but only `round_half_up()` matches the convention most readers learned in school. Switch when the rounded numbers will end up in a report, regulatory filing, or audit.

**Does round_half_up() work on negative numbers?**

Yes, and the behaviour is symmetric. Negative midpoints round away from zero: -0.5 becomes -1, -1.5 becomes -2, -2.5 becomes -3. This is what most people expect when they say "round half up" out loud, even though the literal phrase suggests rounding toward positive infinity. The janitor implementation uses `sign(x)` and `abs(x)` internally to keep the rule consistent regardless of sign.

**Can I apply round_half_up() to a data frame column inside dplyr?**

Yes. Wrap the call in a lambda when using `across()`: `mutate(across(c(col1, col2), \(v) round_half_up(v, digits = 2)))`. The lambda is needed so the `digits` argument reaches the function. For a single column, `mutate(col1 = round_half_up(col1, digits = 2))` is shorter.

**Why does round_half_up(0.15, digits = 1) sometimes return 0.1?**

Floating-point storage. The value 0.15 cannot be represented exactly in binary, so it lives in memory as something like 0.14999999999999997, which rounds down. `round_half_up()` adds `sqrt(.Machine$double.eps)` to mitigate this for typical inputs, and it succeeds for almost all real-world values, but a few pathological cases slip through. If exactness on tiny decimals matters, round at the data entry stage or use a fixed-point package like `Rmpfr`.

**Is there a half-up version of signif()?**

Yes, janitor ships `signif_half_up()` for half-up rounding by significant digits rather than decimal places. Reach for it when the audience expects "3 significant figures, half up" instead of "2 decimal places, half up", a common request in chemistry and engineering reports.
