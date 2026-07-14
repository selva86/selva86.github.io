---
title: "Fix 'missing value where TRUE/FALSE needed' in R"
slug: "Error-missing-value-where-TRUE-FALSE-needed-in-R"
description: "R's missing value where TRUE/FALSE needed error means if() received NA. See the 4 causes, from NA comparisons to any() without na.rm, with working fixes."
keywords: "missing value where TRUE/FALSE needed, missing value where true false needed R, fix missing value where TRUE/FALSE needed, R error missing value where TRUE/FALSE needed, if NA error R, R if statement NA error, missing value error in if statement"
mathjax: false
webr: true
date: "2026-07-14"
post_type: "PSEO"
category_id: "error-message"
subcategory_id: "base-r-errors"
fr_parent: "R-Common-Errors.html"
auto_link_terms: "missing value where TRUE/FALSE needed|missing value where true false needed|NA in an if condition|error in if missing value|NA condition error"
auto_link_case_sensitive: false
target_keyword: "missing value where TRUE/FALSE needed"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Fix 'missing value where TRUE/FALSE needed' in R

<p class="lead">The error <code>missing value where TRUE/FALSE needed</code> means <code>if()</code> or <code>while()</code> received <code>NA</code> as its condition: a value arrived, but R does not know whether it is true or false. It usually traces back to an <code>NA</code> hiding in your data, a comparison written as <code>x == NA</code>, or an <code>any()</code> call that swallowed a missing value.</p>

[QUICK ANSWER]
if (!is.na(x) && x > 5) "big"          # rule out NA before comparing
if (isTRUE(x > 5)) "big"               # one call absorbs NA, NULL, empty
is.na(x)                               # test for NA; x == NA never works
if (any(x > 100, na.rm = TRUE)) "hit"  # keep NA out of any() and all()
x[!is.na(x)]                           # drop NAs before a loop
colSums(is.na(df))                     # find the NAs you did not expect

## What this error means

**`if()` needs a definite `TRUE` or `FALSE`, and you handed it a maybe.** In R, `NA` marks a value that exists but is unknown: a survey answer left blank, a sensor that failed, a cell someone typed "n/a" into. R refuses to pick a branch based on an unknown, so it stops and reports exactly what it was missing.

The shortest way to trigger it is to test `NA` directly:

```r title="Reproduce the error in one line"
if (NA) "runs"
#> Error in if (NA) "runs" : missing value where TRUE/FALSE needed
```

Real code rarely writes `NA` by hand. Instead, a comparison manufactures it. Any comparison involving `NA` returns `NA`, because if the input is unknown, the answer is unknown too:

```r title="Watch a comparison turn into NA"
x <- NA
x > 5
#> [1] NA
```

That `NA` then flows into `if()`, and the error fires at the condition rather than at the true source of the missing value. The debugging job is always the same: find where the `NA` entered.

[KEY INSIGHT]
**The error names a missing condition, not a missing variable.** `if (x > 5)` fails with "object 'x' not found" when `x` does not exist, with "argument is of length zero" when `x` is `NULL` or empty, and with "missing value where TRUE/FALSE needed" when `x` is `NA`. Three similar-looking failures, three different bugs.

## The four causes and their fixes

**Almost every occurrence comes from one of four patterns.** Each subsection reproduces the failure, then shows the repair.

### 1. An NA in the data reaches the comparison

The most direct route: a column contains a missing value, and a condition tests the row that holds it:

```r title="A missing value meets a condition"
sales <- data.frame(region = c("east", "west", "north"),
                    profit = c(1200, NA, 950))

if (sales$profit[2] > 1000) "target met"
#> Error in if (sales$profit[2] > 1000) "target met" : missing value where TRUE/FALSE needed
```

Guard the comparison so `NA` takes a defined branch instead of crashing:

```r title="Rule out NA before comparing"
p <- sales$profit[2]
if (!is.na(p) && p > 1000) "target met" else "no data yet"
#> [1] "no data yet"
```

The `&&` operator short-circuits: when `!is.na(p)` is `FALSE`, R never evaluates the risky right-hand side.

[WARNING]
**Coercion manufactures NAs silently.** `as.numeric(c("120", "n/a"))` returns `c(120, NA)` with only a warning, and warnings are easy to miss in a long script. The crash then happens much later, at the first `if()` the value reaches. When this error appears right after importing or converting data, suspect coercion first.

### 2. Testing for NA with == (it never works)

Many people hit this error while trying to handle `NA`, by writing the check the intuitive way:

```r title="The == NA test that cannot work"
score <- NA
score == NA
#> [1] NA
```

`==` asks "are these two values equal?", and comparing anything with an unknown is unknown. Even `NA == NA` returns `NA`: two unknowns may or may not be equal. The only correct test is `is.na()`:

```r title="Test for NA the right way"
if (is.na(score)) "no score recorded" else "scored"
#> [1] "no score recorded"
```

### 3. any() or all() swallowed an NA

`any()` and `all()` look like safe wrappers, but they follow the same logic as comparisons. When no element settles the answer, a single `NA` makes the whole result `NA`:

```r title="One NA poisons any()"
temps <- c(21, NA, 19)
any(temps > 30)
#> [1] NA
```

No temperature exceeds 30, but the missing one *might have*, so `any()` refuses to say `FALSE`. Both functions take `na.rm = TRUE` to drop missing values before deciding:

```r title="Let any() ignore the NA"
if (any(temps > 30, na.rm = TRUE)) "heatwave" else "normal range"
#> [1] "normal range"
```

### 4. A loop hits the NA row

This is the version that feels random: a loop runs fine for hundreds of iterations, then dies partway through. It worked until it met the missing value:

```r title="A loop that dies mid-run"
readings <- c(98, 102, NA, 105)
for (r in readings) {
  if (r > 100) print(r)
}
#> [1] 102
#> Error in if (r > 100) print(r) : missing value where TRUE/FALSE needed
```

Note the `102` printed before the error: the first two iterations succeeded. Drop the missing values before looping, and the loop also reaches the `105` that sat beyond the crash point:

```r title="Clean the vector before the loop"
for (r in readings[!is.na(readings)]) {
  if (r > 100) print(r)
}
#> [1] 102
#> [1] 105
```

## Why comparisons return NA

**R treats `NA` as "unknown", and unknowns follow three-valued logic.** An operation returns `NA` whenever the missing value could change the answer, and a definite result whenever it could not. That single rule explains every entry in this table:

| Expression | Result | Why |
|---|---|---|
| `NA > 5` | `NA` | Comparing with an unknown is unknown |
| `NA == NA` | `NA` | Two unknowns may or may not be equal |
| `TRUE & NA` | `NA` | The outcome depends on the unknown |
| `FALSE & NA` | `FALSE` | `FALSE` and anything is `FALSE` |
| `any(c(FALSE, NA))` | `NA` | The `NA` could have been the `TRUE` |
| `all(c(TRUE, NA))` | `NA` | The `NA` could have been the `FALSE` |

The two `&` rows are worth running yourself, because they show `NA` is not simply contagious. When the known part already settles the answer, R gives it:

```r title="NA only spreads when it matters"
TRUE & NA
#> [1] NA

FALSE & NA
#> [1] FALSE
```

The same reasoning makes `TRUE | NA` return `TRUE`: one confirmed `TRUE` settles an OR no matter what the unknown turns out to be. Conditions built from `&&` and comparisons inherit these rules, which is why the error can depend on which side of the condition R evaluates first.

[NOTE]
**Coming from Python or SQL?** Python happily branches on missing-ish values: `if float("nan"):` runs the true branch because NaN is truthy. SQL sits closer to R: `NULL = NULL` is not true, which is why SQL has `IS NULL` and R has `is.na()`. R is the strictest of the three, refusing to branch on an unknown at all.

## Find the NA that caused it

**Work backward from the failing condition: some ingredient in it is `NA`.** First confirm the suspect, then locate it:

```r title="Confirm and locate the NA"
anyNA(sales$profit)
#> [1] TRUE

which(is.na(sales$profit))
#> [1] 2
```

For a whole data frame, one line counts the missing values per column and points at the one you did not know about:

```r title="Count NAs across every column"
colSums(is.na(sales))
#> region profit 
#>      0      1
```

In a long script, run `traceback()` immediately after the error to see which call contained the failing `if()`, then apply the checks above to that condition's inputs.

[TIP]
**Count your NAs right after import, not after the crash.** A `colSums(is.na(df))` line at the top of a script costs nothing and turns this error from a mid-run surprise into a known quantity you handle on your own terms.

## Try it yourself

**Try it:** The vector `ex_scores` holds four test scores, one of them missing. Set `ex_top` to `TRUE` if any score is above 90, ignoring the missing value, and print it. The wrong approach returns `NA`; yours should return a definite answer.

```r title="Your turn: an NA-proof any()"
ex_scores <- c(72, NA, 91, 58)

ex_top <- # your code here

ex_top
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_scores <- c(72, NA, 91, 58)

ex_top <- any(ex_scores > 90, na.rm = TRUE)
ex_top
#> [1] TRUE
```

**Explanation:** Without `na.rm = TRUE`, the comparison `ex_scores > 90` contains an `NA`, and `any()` would return `TRUE` here only because 91 settles the answer; change 91 to 89 and it returns `NA` instead. `na.rm = TRUE` drops the missing value so the result is always a definite `TRUE` or `FALSE`.

</details>

## FAQ

<!-- faq: 5 llm-invented (SerpAPI PAA 2026-07-14 returned only generic missing-data questions, none error-specific); refresh with real PAA later -->

**Is this the same error as "argument is of length zero"?**

No, and telling them apart speeds up debugging. "Missing value where TRUE/FALSE needed" means the condition has exactly one element and it is `NA`: a value arrived, but it is unknown. "Argument is of length zero" means the condition has no elements at all, typically from `NULL` or an empty subset. The first sends you hunting for missing data; the second for a value that was never there.

**Why does `if (x == NA)` fail even when x really is NA?**

Because `==` cannot confirm equality with an unknown. `x == NA` evaluates to `NA` for every possible `x`, including when `x` is itself `NA`, so the condition is never `TRUE` or `FALSE`. The test you want is `is.na(x)`, which returns a definite logical answer. This single substitution resolves a large share of real-world hits on this error.

**How do I find which line or row triggers the error in a long script?**

Run `traceback()` right after the error to see the call stack; the top entries show the `if()` that failed. Then inspect that condition's inputs with `anyNA()` and `which(is.na(x))` to get the offending positions. For data frames, `colSums(is.na(df))` gives a per-column missing count, and `df[!complete.cases(df), ]` shows the exact rows carrying the NAs.

**Does ifelse() throw this error too?**

No. `ifelse()` is vectorized and handles missing conditions by returning `NA` in those positions instead of stopping. That tolerance cuts both ways: the NAs pass through silently and surface later in results, plots, or models. `if()` crashing early is loud but honest; after switching to `ifelse()` or dplyr's `if_else()`, check the output for NAs you did not plan for.

**Can while() loops raise it?**

Yes, `while()` applies the same rule: its condition must evaluate to a single `TRUE` or `FALSE` on every iteration. A loop like `while (total < 100)` fails the moment `total` becomes `NA`, which commonly happens when arithmetic inside the loop touches a missing value, since `total + NA` is `NA`. Guard the update step with `is.na()` or clean the data the loop consumes.

## Related R errors

Start with the parent guide, [common R errors and how to read them](R-Common-Errors.html). The official [R documentation on NA](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html) specifies how missing values behave in every operation. For the closest sibling error, see [argument is of length zero](Error-argument-is-of-length-zero-in-R.html), which fires when the condition is empty rather than unknown. To deal with the missing values themselves, [handling missing values in R](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html) covers detecting, counting, and imputing NAs, [control flow in R](Control-Flow-in-R.html) explains what `if`, `else`, and `while` expect, and [object not found](R-Error-Object-Not-Found.html) covers the error you get when the variable itself is missing.
