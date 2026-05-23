---
title: "prod() in R: Multiply Vector Elements Into a Single Product"
slug: "base-prod-in-R"
description: "Use base R prod() to multiply the elements of one or more numeric vectors. Covers na.rm, underflow, factorials, the cumprod alternative, and 5 worked examples."
keywords: "prod in R, R prod function, base R prod, prod function R, product of vector R, na.rm prod R, cumprod R, factorial prod R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "base prod()|R prod function|product of a vector|prod() with na.rm|cumprod and prod"
auto_link_case_sensitive: true
target_keyword: "prod in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# prod() in R: Multiply Vector Elements Into a Single Product

<p class="lead">The <code>prod()</code> function in base R multiplies the elements of one or more numeric or logical vectors and returns a single number. It is the multiplicative twin of <code>sum()</code>, with the same two arguments that matter: the data you pass in and <code>na.rm</code>.</p>

[QUICK ANSWER]
prod(x)                              # multiply all elements
prod(x, y, z)                        # multiply across several vectors
prod(x, na.rm = TRUE)                # drop NA before multiplying
prod(1:n)                            # factorial of n
prod(x[x > 0])                       # product of values matching a condition
cumprod(x)                           # running product (returns a vector)
exp(sum(log(x)))                     # log-sum trick (avoids underflow)
prod(numeric(0))                     # 1 (the empty product)

[DECISION TREE: Is prod() the right tool?]
- multiply all values of one vector: prod(x)
- multiply across many vectors: prod(x, y, z)
- running cumulative product: cumprod(x)
- factorial of n: factorial(n) or prod(1:n)
- many small probabilities, risk of underflow: exp(sum(log(x)))
- add values rather than multiply: sum(x)
- element-wise product of two vectors: x * y
- product by group in a data frame: dplyr::summarise(p = prod(x), .by = grp)

## What prod() does in one sentence

**`prod(..., na.rm = FALSE)` multiplies every element of every argument passed in and returns a single number.** Like `sum()`, it coerces logical values to integers, so a `TRUE` becomes `1` and a `FALSE` becomes `0` (and a single `FALSE` collapses the whole product to zero).

`prod()` accepts any number of numeric, integer, logical, or complex vectors. If you pass three vectors, it multiplies every element of all three into one running product. If even one element is `NA` and `na.rm = FALSE` (the default), the result is `NA`.

## Syntax

**`prod(..., na.rm = FALSE)`. The `...` accepts one or more numeric, integer, logical, or complex vectors. `na.rm` controls NA propagation.**

```r title="Multiply the elements of a vector"
x <- c(2, 3, 4, 5)
prod(x)
#> [1] 120

prod(x, 10)
#> [1] 1200

prod(c(2, 3, NA, 4))
#> [1] NA

prod(c(2, 3, NA, 4), na.rm = TRUE)
#> [1] 24
```

The default `na.rm = FALSE` is deliberate. R refuses to silently hide missing data, so you must opt in by writing `na.rm = TRUE`.

[TIP]
**Reach for `prod()` only when the product itself is the answer.** For probabilities, likelihoods, or anything that could underflow, switch to the log-sum trick (`exp(sum(log(x)))`) early. A direct `prod()` of many small numbers rounds to zero long before mathematics says it should.

## Five common patterns

### 1. Product of a numeric vector

```r title="Most common prod use"
weights <- c(0.8, 0.9, 0.95, 0.99)
prod(weights)
#> [1] 0.67716
```

The cleanest case. Pass a single numeric vector and get the product. Useful for compounding survival rates, probabilities, growth factors, or discount factors.

### 2. Product with NA handling

```r title="na.rm drops missing values"
factors <- c(1.2, NA, 1.05, 0.97, NA, 1.10)
prod(factors)
#> [1] NA

prod(factors, na.rm = TRUE)
#> [1] 1.34442

sum(is.na(factors))
#> [1] 2
```

`sum(is.na(x))` is the idiomatic way to count NAs first. Decide explicitly whether to drop them or impute, then pass `na.rm = TRUE` only if dropping is the right call.

### 3. Factorial via `prod(1:n)`

```r title="Factorial as a special case of prod"
prod(1:5)
#> [1] 120

prod(1:10)
#> [1] 3628800

factorial(5)
#> [1] 120

factorial(170)
#> [1] 7.257416e+306

factorial(171)
#> [1] Inf
```

`prod(1:n)` and `factorial(n)` compute the same value. `factorial()` is the recommended call for clarity. Both top out around `n = 170` because the result exceeds the maximum double (`.Machine$double.xmax` is about `1.8e308`).

### 4. Cumulative product (running product)

```r title="cumprod returns a vector, not a scalar"
monthly_growth <- c(1.02, 1.01, 1.03, 0.98, 1.05)
cumprod(monthly_growth)
#> [1] 1.020000 1.030200 1.061106 1.039884 1.091878

prod(monthly_growth)
#> [1] 1.091878
```

`cumprod()` returns a vector of the same length showing the running product at each position. The final element of `cumprod(x)` always equals `prod(x)`. Use `cumprod()` when you need the product at every step (compounding curves, cumulative growth, survival functions); use `prod()` when only the final scalar matters.

### 5. The log-sum trick for tiny products

```r title="Avoid underflow with logs"
probs <- rep(0.5, 1500)

prod(probs)
#> [1] 0

exp(sum(log(probs)))
#> [1] 0

log_likelihood <- sum(log(probs))
log_likelihood
#> [1] -1039.721
```

Multiplying 1,500 values of `0.5` should give `0.5^1500`, which is about `1e-452`, far below the smallest representable double (`.Machine$double.xmin` is about `2.2e-308`). The naive `prod()` underflows to zero. The log-sum form computes the log of the product in a stable way; you keep the meaningful answer as a log-likelihood and only call `exp()` when (and if) you really need the raw probability. This is the standard pattern in maximum likelihood estimation and naive Bayes.

[KEY INSIGHT]
**`prod()` collapses; `cumprod()` keeps; `sum(log(...))` rescues.** Reach for `prod()` when one number is the answer, `cumprod()` when you need a running history, and `exp(sum(log(x)))` when the values are small enough that the direct product would underflow. Probability and likelihood code almost always wants the third form.

## prod vs cumprod vs Reduce vs sum-of-logs

**Four ways to multiply elements together, picked by input shape, output shape, and numeric scale.** Knowing which to reach for saves both code and precision.

| Function | Input | Output | Best for |
|---|---|---|---|
| `prod()` | One or more vectors | Single number | Product of values that won't underflow |
| `cumprod()` | One vector | Vector (running product) | Compounding curves, growth paths |
| `factorial(n)` | Single integer | Single number | `n!` (max safe `n` is 170) |
| `Reduce("*", x)` | List of vectors | Vector (element-wise) | Element-wise product across many vectors |
| `exp(sum(log(x)))` | One vector of positives | Single number (or log) | Likelihoods, probabilities, anything tiny |

When to use which:

- One vector, one number, not too small: `prod()`.
- Many compounding factors, want the curve: `cumprod()`.
- `n!`: `factorial(n)`.
- Many small probabilities: stay in log space with `sum(log(x))` and exponentiate at the end if needed.
- By group: `dplyr::summarise(p = prod(x), .by = grp)`.

## Common pitfalls

**Pitfall 1: a single zero collapses the whole product.** Unlike `sum()`, where a zero is invisible, a single `0` in the input makes `prod()` return `0`. This is mathematically correct but often surprising during exploration.

```r title="One zero zeroes the product"
x <- c(2, 3, 0, 4)
prod(x)
#> [1] 0

prod(x[x != 0])
#> [1] 24
```

If a stray zero from a missing measurement or a placeholder is contaminating your data, filter it out before calling `prod()`.

**Pitfall 2: numeric underflow with many small values.** When you multiply many probabilities, the running product shrinks past `.Machine$double.xmin` and silently rounds to zero. See Pattern 5 for the fix.

**Pitfall 3: numeric overflow for very large products.** A product that exceeds `.Machine$double.xmax` (about `1.8e308`) returns `Inf` with no warning. Cast inputs carefully and stay in log space when in doubt.

```r title="Overflow returns Inf"
prod(1:200)
#> [1] Inf

exp(sum(log(1:200)))
#> [1] Inf

sum(log(1:200))
#> [1] 863.232
```

Even the log-sum trick cannot recover an answer that the format cannot store, but it does give you `sum(log(1:200))` as a usable log-factorial.

**Pitfall 4: `prod()` of an empty vector is 1, not 0.**

```r title="The empty product is 1"
prod(numeric(0))
#> [1] 1

sum(numeric(0))
#> [1] 0
```

`1` is the multiplicative identity (multiplying by it changes nothing), so the empty product is `1` by convention. This trips up code that assumes `prod()` of an empty input is `0`.

[WARNING]
**Casting integers to doubles only delays overflow, it does not prevent it.** `prod(as.numeric(1:200))` still returns `Inf` because the true product exceeds the double range. For exact arbitrary-precision arithmetic on very large products, use a package like `Rmpfr` or stay in log space.

## Try it yourself

**Try it:** Use the built-in `mtcars` dataset. Compute the product of the first six values of the `mpg` column, ignoring any NAs. Save the result to `ex_mpg_prod`.

```r title="Your turn: product of first six mpg values"
ex_mpg_prod <- # your code here

ex_mpg_prod
#> Expected: about 9.07e7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mpg_prod <- prod(head(mtcars$mpg, 6), na.rm = TRUE)
ex_mpg_prod
#> [1] 90745994
```

**Explanation:** `head(mtcars$mpg, 6)` grabs the first six MPG values. `prod()` multiplies them; `na.rm = TRUE` is defensive even though `mtcars` has no NAs. The product grows quickly because every value is above 18, so multiplying six of them lands in the tens of millions.

</details>

## Related base R aggregators

After mastering `prod()`, look at:

- `sum()`, `mean()`, `median()`: additive aggregators and central tendency.
- `cumsum()`, `cumprod()`, `cummax()`, `cummin()`: cumulative aggregates.
- `factorial()`, `choose()`, `gamma()`, `lgamma()`: combinatorial and log-gamma helpers.
- `Reduce("*", list_of_vectors)`: element-wise product across many vectors.
- `apply(m, 2, prod)`: column products of a matrix (no dedicated `colProds` in base R).
- `dplyr::summarise(p = prod(x), .by = grp)`: grouped products on data frames.

For documentation, see [the R prod() reference](https://stat.ethz.ch/R-manual/R-devel/library/base/html/prod.html) on the official R site.

## FAQ

**How do I multiply all elements of a vector in R?**

Call `prod()` on the vector. For example, `prod(c(2, 3, 4))` returns `24`. You can pass several vectors at once (`prod(x, y)` multiplies every element of both into one running product), and you can ignore missing values with `prod(x, na.rm = TRUE)`. If the values are tiny probabilities, switch to `exp(sum(log(x)))` to avoid silently underflowing to zero.

**What is the difference between prod() and cumprod() in R?**

`prod()` collapses every element of every argument into a single number. `cumprod()` keeps the same length as the input and shows the running product at each position. The final element of `cumprod(x)` always equals `prod(x)`. Use `prod()` for a grand total; use `cumprod()` for compounding curves where you need the value at every step.

**How do I compute a factorial using prod() in R?**

`prod(1:n)` returns `n!`. For example, `prod(1:5)` is `120`. R also has a dedicated `factorial(n)` function that does the same thing and is easier to read. Both functions are limited by the double-precision range, so `factorial(170)` is the largest exact result; `factorial(171)` returns `Inf`. For larger factorials, work with `lgamma(n + 1)` to stay in log space.

**Why does prod() of an empty vector return 1 in R?**

`1` is the multiplicative identity, so multiplying by nothing leaves the running product unchanged. `prod(numeric(0))` returns `1` by mathematical convention, mirroring how `sum(numeric(0))` returns `0` (the additive identity). This is the behavior every numerical library uses, but it can surprise code that assumes "no values" means "zero."

**How do I avoid underflow when multiplying many probabilities in R?**

Switch to log space. Replace `prod(probs)` with `exp(sum(log(probs)))`, which is the standard trick in likelihood-based statistics. Better yet, keep the log-likelihood (`sum(log(probs))`) and only exponentiate at the very end. This handles inputs that would otherwise round to zero, and it is more numerically stable when comparing very small probabilities.
