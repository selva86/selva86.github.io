---
title: "Time Series Decomposition Exercises in R: 50 Problems"
slug: "Time-Series-Decomposition-Exercises-in-R"
description: "Fifty time series decomposition exercises in R covering decompose(), STL, moving-average trends, seasonal adjustment and remainder diagnostics. Solutions hidden."
keywords: "time series decomposition exercises, decompose in R exercises, STL decomposition practice R, seasonal adjustment exercises R, moving average trend exercises R"
mathjax: false
webr: true
date: "2026-07-22"
post_type: "EX"
sidebar_title: "Decomposition Exercises"
sidebar_order: 109
fr_parent: "Time-Series-Decomposition-in-R.html"
auto_link_terms: "time series decomposition exercises|decomposition practice problems|stl exercises in r|seasonal adjustment exercises|decompose practice problems"
auto_link_case_sensitive: false
target_keyword: "time series decomposition exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Time Series Decomposition Exercises in R: 50 Problems

<p class="lead">Fifty problems that take a series apart and put it back together: classical <code>decompose()</code>, moving-average trends built by hand, <code>stl()</code> with its window controls, seasonal adjustment, and the diagnostics that tell you whether the split worked. Every solution is hidden until you click, and every one runs.</p>

```r title="Run this once before any exercise"
library(dplyr)
```

## Section 1. Read the series before you split it (8 problems)

### Exercise 1.1: Turn a bare numeric vector into a monthly ts object

**Task:** A retail operations analyst has three years of monthly unit sales in a plain numeric vector and needs it recognised as a monthly series before any decomposition will work. Convert the `units` vector below into a `ts` object starting in January 2021 with frequency 12 and save it to `ex_1_1`.

**Expected result:**

```
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 2021 412 388 455 470 502 545 560 548 512 498 540 615
#> 2022 430 405 472 495 528 570 588 574 536 522 566 648
#> 2023 451 424 496 519 553 601 617 604 563 549 594 681
```

**Difficulty:** Beginner

[HINTS]
A series needs three facts attached to the numbers: where it starts, how often it is sampled, and how many observations make one full cycle.
Call `ts()` with `start = c(2021, 1)` and `frequency = 12`.

```r title="Your turn"
units <- c(412, 388, 455, 470, 502, 545, 560, 548, 512, 498, 540, 615,
           430, 405, 472, 495, 528, 570, 588, 574, 536, 522, 566, 648,
           451, 424, 496, 519, 553, 601, 617, 604, 563, 549, 594, 681)

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
units <- c(412, 388, 455, 470, 502, 545, 560, 548, 512, 498, 540, 615,
           430, 405, 472, 495, 528, 570, 588, 574, 536, 522, 566, 648,
           451, 424, 496, 519, 553, 601, 617, 604, 563, 549, 594, 681)

ex_1_1 <- ts(units, start = c(2021, 1), frequency = 12)
ex_1_1
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 2021 412 388 455 470 502 545 560 548 512 498 540 615
#> 2022 430 405 472 495 528 570 588 574 536 522 566 648
#> 2023 451 424 496 519 553 601 617 604 563 549 594 681
```

**Explanation:** `frequency = 12` is the load-bearing argument. It tells R that twelve observations complete one seasonal cycle, which is exactly the number every decomposition function reads to know how long a season is. Leave it out and you get `frequency = 1`, and `decompose()` will refuse to run because a series with no repeating cycle has no seasonal component to extract. The printed month-by-year grid is your confirmation that the calendar landed where you intended.

</details>

### Exercise 1.2: Pull the calendar facts out of an existing series

**Task:** Before decomposing anyone else's data you should confirm what you actually received. Extract the start year and period, end year and period, frequency, and total length of the built-in `AirPassengers` series into a single named numeric vector and save it to `ex_1_2`.

**Expected result:**

```
#>   start_year start_period     end_year   end_period    frequency            n
#>         1949            1         1960           12           12          144
```

**Difficulty:** Beginner

[HINTS]
Four small accessor functions report the calendar attributes of a series, and two of them return a pair of numbers rather than one.
`start()` and `end()` each return a length-2 vector, so index them with `[1]` and `[2]`; add `frequency()` and `length()`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- c(start_year = start(AirPassengers)[1],
            start_period = start(AirPassengers)[2],
            end_year = end(AirPassengers)[1],
            end_period = end(AirPassengers)[2],
            frequency = frequency(AirPassengers),
            n = length(AirPassengers))
ex_1_2
#>   start_year start_period     end_year   end_period    frequency            n
#>         1949            1         1960           12           12          144
```

**Explanation:** `start()` and `end()` return the cycle position as a pair, so `c(1949, 1)` means January 1949 rather than the decimal year 1949.0. Checking `length()` against the span matters: twelve years of monthly data should be 144 rows, and if it is not, someone has dropped observations and your seasonal indices will silently shift. `tsp(AirPassengers)` returns the same information as a compact three-number vector if you prefer one call.

</details>

### Exercise 1.3: Slice a four-year window out of a longer series

**Task:** An airline revenue analyst reviewing the mid-1950s only wants the traffic covering January 1955 through December 1958, without breaking the monthly calendar attached to the data. Subset `AirPassengers` to that span and save the result to `ex_1_3`.

**Expected result:**

```
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1955 242 233 267 269 270 315 364 347 312 274 237 278
#> 1956 284 277 317 313 318 374 413 405 355 306 271 306
#> 1957 315 301 356 348 355 422 465 467 404 347 305 336
#> 1958 340 318 362 348 363 435 491 505 404 359 310 337
```

**Difficulty:** Beginner

[HINTS]
Ordinary `[` bracket subsetting strips the time attributes and hands you a bare vector; you need the time-aware equivalent.
Use `window()` with `start = c(1955, 1)` and `end = c(1958, 12)`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- window(AirPassengers, start = c(1955, 1), end = c(1958, 12))
ex_1_3
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1955 242 233 267 269 270 315 364 347 312 274 237 278
#> 1956 284 277 317 313 318 374 413 405 355 306 271 306
#> 1957 315 301 356 348 355 422 465 467 404 347 305 336
#> 1958 340 318 362 348 363 435 491 505 404 359 310 337
```

**Explanation:** `window()` keeps the series a series. Compare it with `AirPassengers[73:120]`, which returns the same 48 numbers as a plain vector with no start date and no frequency, so a later `decompose()` call on it fails. Both ends are inclusive, and you can omit either one to mean "from the beginning" or "to the end". Every later exercise that reports a single year uses this same function.

</details>

### Exercise 1.4: Average each calendar month across all twelve years

**Task:** Get a first, crude read of the seasonal shape by averaging every January together, every February together, and so on across the whole of `AirPassengers`. Round the twelve means to one decimal place and save the named result to `ex_1_4`.

**Expected result:**

```
#>     1     2     3     4     5     6     7     8     9    10    11    12
#> 241.8 235.0 270.2 267.1 271.8 311.7 351.3 351.1 302.4 266.6 232.8 261.8
```

**Difficulty:** Intermediate

[HINTS]
You need a grouping variable that says which position in the cycle each observation occupies, then a split-apply-combine over that grouping.
`cycle()` returns the month number for every observation; feed it to `tapply()` as the index alongside `mean`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- round(tapply(AirPassengers, cycle(AirPassengers), mean), 1)
ex_1_4
#>     1     2     3     4     5     6     7     8     9    10    11    12
#> 241.8 235.0 270.2 267.1 271.8 311.7 351.3 351.1 302.4 266.6 232.8 261.8
```

**Explanation:** July and August stand far above November and February, which is the summer travel peak showing through. Treat this as a sketch, not a seasonal index: because the series trends steeply upward, later years pull every month's average up by roughly the same amount, so the raw month means confound season with growth. Removing the trend first is exactly what `decompose()` does, and Section 3 rebuilds that step by hand.

</details>

### Exercise 1.5: Collapse a monthly series to annual totals

**Task:** Management wants the yearly passenger totals rather than the monthly detail, so the growth path can be read without seasonal noise. Aggregate `AirPassengers` from monthly to annual frequency by summing each year and save the resulting series to `ex_1_5`.

**Expected result:**

```
#> Time Series:
#> Start = 1949
#> End = 1960
#> Frequency = 1
#>  [1] 1520 1676 2042 2364 2700 2867 3408 3939 4421 4572 5140 5714
```

**Difficulty:** Beginner

[HINTS]
There is a time-series method that changes the sampling frequency of a series and applies a summary function to each new period.
Call `aggregate()` on the series with `FUN = sum`; the default target frequency is 1, meaning annual.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- aggregate(AirPassengers, FUN = sum)
ex_1_5
#> Time Series:
#> Start = 1949
#> End = 1960
#> Frequency = 1
#>  [1] 1520 1676 2042 2364 2700 2867 3408 3939 4421 4572 5140 5714
```

**Explanation:** `aggregate()` dispatches to a time-series method here, not the data-frame one, so it slices the series into whole cycles and applies `FUN` to each. Annual totals are one legitimate way to see trend without seasonality, but they cost you eleven twelfths of your resolution and only work when the cycle divides evenly into the span. Seasonal adjustment, covered in Section 2, gives you a trend view that keeps every monthly observation.

</details>

### Exercise 1.6: Test whether seasonal swings grow with the level

**Task:** Choosing between an additive and a multiplicative decomposition comes down to one question: do the swings get bigger as the series gets bigger? Build a data frame with one row per year of `AirPassengers` holding the year, the yearly mean, the yearly standard deviation, and their ratio, then save it to `ex_1_6`.

**Expected result:**

```
#>    year  mean   sd    cv
#> 1  1949 126.7 13.7 0.108
#> 2  1950 139.7 19.1 0.137
#> 3  1951 170.2 18.4 0.108
#> 4  1952 197.0 23.0 0.117
#> 5  1953 225.0 28.5 0.127
#> 6  1954 238.9 34.9 0.146
#> 7  1955 284.0 42.1 0.148
#> 8  1956 328.2 47.9 0.146
#> 9  1957 368.4 57.9 0.157
#> 10 1958 381.0 64.5 0.169
#> 11 1959 428.3 69.8 0.163
#> 12 1960 476.2 77.7 0.163
```

**Difficulty:** Intermediate

[HINTS]
The same frequency-changing function from the previous exercise accepts any summary function, so run it twice with different ones.
Use `aggregate(AirPassengers, FUN = mean)` and `aggregate(AirPassengers, FUN = sd)`, wrap both in `as.numeric()`, and add the ratio with `mutate()`.

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- data.frame(
  year = as.integer(time(aggregate(AirPassengers, FUN = mean))),
  mean = round(as.numeric(aggregate(AirPassengers, FUN = mean)), 1),
  sd   = round(as.numeric(aggregate(AirPassengers, FUN = sd)), 1)
) |>
  mutate(cv = round(sd / mean, 3))
ex_1_6
#>    year  mean   sd    cv
#> 1  1949 126.7 13.7 0.108
#> 2  1950 139.7 19.1 0.137
#> 3  1951 170.2 18.4 0.108
#> ...
#> 12 1960 476.2 77.7 0.163
```

**Explanation:** The standard deviation grows from 13.7 to 77.7, a factor of nearly six, while the mean grows by a factor of under four. Absolute swings clearly widen with the level, which rules out a pure additive split. The ratio column, the coefficient of variation, is the sharper diagnostic: it drifts up only mildly, from about 0.11 to 0.16, meaning the swings are roughly proportional to the level. That proportionality is the definition of a multiplicative series.

</details>

### Exercise 1.7: Show that a log transform stabilises the seasonal swing

**Task:** A multiplicative series becomes additive on the log scale, which is why analysts so often decompose logs. Compare the first-year and last-year standard deviations of `AirPassengers` on the raw scale against the same two figures on the log scale, report both ratios, and save the named vector to `ex_1_7`.

**Expected result:**

```
#> raw_first  raw_last raw_ratio log_first  log_last log_ratio
#>    13.720    77.737     5.670     0.108     0.157     1.440
```

**Difficulty:** Advanced

[HINTS]
Compute yearly spread twice, once on the original series and once on its logarithm, then compare the last year against the first.
Take `as.numeric(aggregate(AirPassengers, FUN = sd))` and the same for `log(AirPassengers)`, then divide element 12 by element 1.

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw_sd <- as.numeric(aggregate(AirPassengers, FUN = sd))
log_sd <- as.numeric(aggregate(log(AirPassengers), FUN = sd))

ex_1_7 <- c(raw_first = round(raw_sd[1], 3), raw_last = round(raw_sd[12], 3),
            raw_ratio = round(raw_sd[12] / raw_sd[1], 2),
            log_first = round(log_sd[1], 3), log_last = round(log_sd[12], 3),
            log_ratio = round(log_sd[12] / log_sd[1], 2))
ex_1_7
#> raw_first  raw_last raw_ratio log_first  log_last log_ratio
#>    13.720    77.737     5.670     0.108     0.157     1.440
```

**Explanation:** Raw spread multiplies by 5.67 across the twelve years; log spread multiplies by only 1.44. Taking logs converts multiplication into addition, so a seasonal factor that scales the level becomes a seasonal offset that shifts it, and a constant-width additive model suddenly fits. This is why `stl()`, which only knows how to do additive splits, is almost always applied to `log(x)` for series like this. Note the log yearly standard deviations, 0.108 and 0.157, match the coefficients of variation from Exercise 1.6 closely, because for small variation the log spread approximates the relative spread.

</details>

### Exercise 1.8: Draw a seasonal subseries plot to see the shape per month

**Task:** Before trusting any automatic split, look at the seasonal pattern directly. Draw a seasonal subseries plot of `AirPassengers`, which puts all twelve Januaries side by side, then all twelve Februaries, with a horizontal mean line per month. Save the plotting call to `ex_1_8`.

**Expected result:**

```
#> A panel of twelve short line segments, one per calendar month, left to right
#> Jan through Dec. Each segment rises steeply from 1949 to 1960 (the trend).
#> The horizontal mean bars step up from Jan to a July/Aug peak near 351, then
#> fall to a November low near 233, tracing the seasonal shape.
```

**Difficulty:** Intermediate

[HINTS]
Base R ships a dedicated plot for viewing each position in the cycle as its own mini-series against time.
`monthplot()` takes the series directly; add `ylab` to label the axis.

```r title="Your turn"
ex_1_8 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- monthplot(AirPassengers, ylab = "Passengers (thousands)",
                    main = "Seasonal subseries plot, AirPassengers")
#> A panel of twelve short line segments, one per calendar month.
#> Mean bars peak in Jul and Aug and bottom out in Nov.
```

**Explanation:** A subseries plot separates the two effects that a raw time plot tangles together. Read across the mean bars and you see the seasonal shape; read up each individual segment and you see the trend within that month. Both are visible at once, which is what makes this more useful than a plain `plot()` for deciding whether seasonality is stable. If one month's segment sloped differently from the rest, the seasonal pattern would be evolving, and you would want `stl()` with a numeric `s.window` rather than a fixed index.

</details>

## Section 2. Classical decomposition with decompose() (9 problems)

### Exercise 2.1: Run a classical decomposition and inspect what comes back

**Task:** A climatologist is starting work on the Mauna Loa carbon dioxide record and needs to know the structure of the object R hands back. Run an additive `decompose()` on the built-in `co2` series, save it to `ex_2_1`, then print the component names, the type, and the rounded seasonal figure.

**Expected result:**

```
#> [1] "x"        "seasonal" "trend"    "random"   "figure"   "type"
#> [1] "additive"
#>  [1] -0.054  0.611  1.376  2.517  3.000  2.329  0.813 -1.251 -3.055 -3.252 -2.070 -0.965
```

**Difficulty:** Beginner

[HINTS]
The decomposition returns a list, so the usual list-inspection tools apply to see what slots it carries.
Call `decompose(co2, type = "additive")`, then `names()`, `$type` and `round($figure, 3)` on the result.

```r title="Your turn"
ex_2_1 <- # your code here
names(ex_2_1)
ex_2_1$type
round(ex_2_1$figure, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- decompose(co2, type = "additive")
names(ex_2_1)
#> [1] "x"        "seasonal" "trend"    "random"   "figure"   "type"
ex_2_1$type
#> [1] "additive"
round(ex_2_1$figure, 3)
#>  [1] -0.054  0.611  1.376  2.517  3.000  2.329  0.813 -1.251 -3.055 -3.252 -2.070 -0.965
```

**Explanation:** Six slots, and the distinction between two of them matters. `seasonal` is a full-length series that repeats the pattern for every observation, whereas `figure` holds just the twelve distinct monthly values once. Reach for `figure` when you want to report or plot the seasonal profile, and for `seasonal` when you want to subtract it from the data. The values say May runs about 3.0 ppm above the trend and October about 3.25 ppm below it, the annual breathing cycle of Northern Hemisphere plant growth.

</details>

### Exercise 2.2: Extract multiplicative seasonal factors for an airline series

**Task:** Because `AirPassengers` swings proportionally with its level, the seasonal component belongs on a multiplicative scale where each month is a factor around 1. Run a multiplicative decomposition, pull out the twelve seasonal factors, round them to three decimals, and save them to `ex_2_2`.

**Expected result:**

```
#>  [1] 0.910 0.884 1.007 0.976 0.981 1.113 1.227 1.220 1.060 0.922 0.801 0.899
```

**Difficulty:** Beginner

[HINTS]
The same function from the previous exercise takes an argument that switches the model from offsets to ratios.
Pass `type = "multiplicative"` to `decompose()` and take the `figure` element of the result.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- round(decompose(AirPassengers, type = "multiplicative")$figure, 3)
ex_2_2
#>  [1] 0.910 0.884 1.007 0.976 0.981 1.113 1.227 1.220 1.060 0.922 0.801 0.899
```

**Explanation:** Read these as percentages of a normal month. July at 1.227 means July traffic runs about 23% above trend, and November at 0.801 means November runs about 20% below it. Multiplicative factors average to 1 by construction, whereas the additive offsets in Exercise 2.1 sum to roughly 0. The practical advantage is portability: a 23% July uplift stays meaningful as the airline grows, while an additive offset measured in 1949 passenger counts does not.

</details>

### Exercise 2.3: Count the missing values the moving-average trend leaves behind

**Task:** Classical decomposition estimates trend with a centred moving average, which cannot be computed at the very start and end of a series. Decompose `AirPassengers`, then report the trend length, total missing values, how many fall in the first and last twelve months, and the positions of the first and last non-missing values, saving the named vector to `ex_2_3`.

**Expected result:**

```
#>         n  na_total   na_head   na_tail first_obs  last_obs
#>       144        12         6         6         7       138
```

**Difficulty:** Intermediate

[HINTS]
Pull the trend component out first, then apply the standard missingness test to different slices of it.
Combine `sum(is.na(trend))` with `head(trend, 12)` and `tail(trend, 12)`, and use `which(!is.na(trend))` for the positions.

```r title="Your turn"
tr <- decompose(AirPassengers)$trend
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tr <- decompose(AirPassengers)$trend
ex_2_3 <- c(n = length(tr), na_total = sum(is.na(tr)),
            na_head = sum(is.na(head(tr, 12))), na_tail = sum(is.na(tail(tr, 12))),
            first_obs = which(!is.na(tr))[1],
            last_obs = max(which(!is.na(tr))))
ex_2_3
#>         n  na_total   na_head   na_tail first_obs  last_obs
#>       144        12         6         6         7       138
```

**Explanation:** Six months are lost at each end, exactly half the seasonal period, because a centred 12-month average needs six observations on either side of the point it is estimating. That is a real cost when the most recent months are the ones a stakeholder cares about, and it is the single strongest argument for `stl()`, which uses local regression and returns a trend for every observation including the last. Any accuracy metric you compute on the components must handle these NAs with `na.rm = TRUE` or it returns NA.

</details>

### Exercise 2.4: Produce the seasonally adjusted figures for 1960

**Task:** Seasonal adjustment removes the calendar effect so consecutive months become comparable. Using a multiplicative decomposition of `AirPassengers`, divide the series by its seasonal component, keep the twelve months of 1960, round to one decimal place and save the result to `ex_2_4`.

**Expected result:**

```
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1960 458.1 442.5 415.9 472.4 481.0 480.8 507.1 496.8 479.0 500.1 486.8 480.6
```

**Difficulty:** Intermediate

[HINTS]
In a multiplicative model the components multiply together, so removing one of them means the inverse of multiplication.
Divide `AirPassengers` by the `seasonal` component, then take `window(..., start = c(1960, 1))`.

```r title="Your turn"
dm <- decompose(AirPassengers, type = "multiplicative")
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dm <- decompose(AirPassengers, type = "multiplicative")
ex_2_4 <- round(window(AirPassengers / dm$seasonal, start = c(1960, 1)), 1)
ex_2_4
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1960 458.1 442.5 415.9 472.4 481.0 480.8 507.1 496.8 479.0 500.1 486.8 480.6
```

**Explanation:** Raw 1960 traffic runs from 390 in November to 622 in July, a spread that tells you nothing except that summer exists. Adjusted, the same year sits between 416 and 507, and the real story appears: March was the genuinely weak month, not November. Note that adjustment uses only the seasonal component, so unlike the trend it is defined for every observation including the final month. Use division for multiplicative models and subtraction for additive ones; mixing them up leaves a residual seasonal wave.

</details>

### Exercise 2.5: Prove the three components multiply back to the original series

**Task:** A decomposition is only an identity if the pieces reassemble exactly. Multiply the trend, seasonal and random components of a multiplicative decomposition of `AirPassengers` back together, then report how many observations could be compared and the largest absolute difference from the original, saving both to `ex_2_5`.

**Expected result:**

```
#>   n_compared max_abs_diff
#>          132            0
```

**Difficulty:** Intermediate

[HINTS]
Reassemble the product first, then compare it against the input, remembering that the trend has gaps at both ends.
Compute `d$trend * d$seasonal * d$random` and take `max(abs(recon - AirPassengers), na.rm = TRUE)`.

```r title="Your turn"
d <- decompose(AirPassengers, type = "multiplicative")
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- decompose(AirPassengers, type = "multiplicative")
recon <- d$trend * d$seasonal * d$random

ex_2_5 <- c(n_compared = sum(!is.na(recon)),
            max_abs_diff = round(max(abs(recon - AirPassengers), na.rm = TRUE), 10))
ex_2_5
#>   n_compared max_abs_diff
#>          132            0
```

**Explanation:** The difference is zero to ten decimal places, and it must be, because the random component is defined as whatever is left over: `random = x / (trend * seasonal)`. That makes reassembly a tautology rather than evidence the model is good. The count of 132 is the informative half of this answer, since 12 of the 144 observations have no trend estimate and therefore no residual. For an additive decomposition run the same check with `+` in place of `*`.

</details>

### Exercise 2.6: Decide additive versus multiplicative from the residuals

**Task:** Exercise 1.6 argued for a multiplicative model from the raw data; now settle it from the residuals. Fit both an additive and a multiplicative decomposition of `AirPassengers`, compute residuals in passenger units for each, then report both residual standard deviations and the correlation between yearly residual spread and yearly level, saving all four numbers to `ex_2_6`.

**Expected result:**

```
#>   sd_add  sd_mult  cor_add cor_mult
#>   19.340    9.910    0.300    0.556
```

**Difficulty:** Advanced

[HINTS]
Residuals in original units are the data minus whatever the model predicts, and the two models predict differently.
Additive residual is `x - trend - seasonal`; multiplicative is `x - trend * seasonal`. Compare yearly `sd` against yearly `mean` with `cor()`.

```r title="Your turn"
add <- decompose(AirPassengers, type = "additive")
mult <- decompose(AirPassengers, type = "multiplicative")
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
add <- decompose(AirPassengers, type = "additive")
mult <- decompose(AirPassengers, type = "multiplicative")

res_add <- AirPassengers - add$trend - add$seasonal
res_mult <- AirPassengers - mult$trend * mult$seasonal

yr_sd <- function(r) as.numeric(aggregate(window(r, start = c(1950, 1), end = c(1959, 12)), FUN = sd))
yr_mean <- as.numeric(aggregate(window(AirPassengers, start = c(1950, 1), end = c(1959, 12)), FUN = mean))

ex_2_6 <- c(sd_add = round(sd(res_add, na.rm = TRUE), 2),
            sd_mult = round(sd(res_mult, na.rm = TRUE), 2),
            cor_add = round(cor(yr_sd(res_add), yr_mean), 3),
            cor_mult = round(cor(yr_sd(res_mult), yr_mean), 3))
ex_2_6
#>   sd_add  sd_mult  cor_add cor_mult
#>   19.340    9.910    0.300    0.556
```

**Explanation:** The multiplicative model leaves residuals roughly half the size, 9.91 passengers against 19.34, measured in the same units, which is the decisive comparison. Both models still show residual spread rising with the level, and the correlations are noisy over only ten yearly points, so treat them as a weaker secondary signal than the raw standard deviations. Comparing residuals in original units is the trick worth keeping: the multiplicative `random` component is a ratio around 1, so its standard deviation is not comparable to the additive one until you convert it back.

</details>

### Exercise 2.7: Rank the calendar months by seasonal strength

**Task:** The commercial team wants a ranked list showing which months run hottest and coldest relative to trend. Take the multiplicative seasonal factors of `AirPassengers`, attach month abbreviations as names, sort them from strongest to weakest and save the result to `ex_2_7`.

**Expected result:**

```
#>   Jul   Aug   Jun   Sep   Mar   May   Apr   Oct   Jan   Dec   Feb   Nov
#> 1.227 1.220 1.113 1.060 1.007 0.981 0.976 0.922 0.910 0.899 0.884 0.801
```

**Difficulty:** Intermediate

[HINTS]
The twelve factors come out in calendar order and unnamed, so you need to label them before reordering.
R has a built-in constant `month.abb`; assign it with `names()`, then use `sort(..., decreasing = TRUE)`.

```r title="Your turn"
fig <- decompose(AirPassengers, type = "multiplicative")$figure
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fig <- decompose(AirPassengers, type = "multiplicative")$figure
names(fig) <- month.abb

ex_2_7 <- round(sort(fig, decreasing = TRUE), 3)
ex_2_7
#>   Jul   Aug   Jun   Sep   Mar   May   Apr   Oct   Jan   Dec   Feb   Nov
#> 1.227 1.220 1.113 1.060 1.007 0.981 0.976 0.922 0.910 0.899 0.884 0.801
```

**Explanation:** Sorting turns a wall of numbers into a finding: the summer block of June through September carries everything above trend, and November is the deepest trough at 20% below. `month.abb` and `month.name` are built-in character constants, which saves typing the labels and guarantees the order matches `cycle()`. The one trap is that `sort()` reorders the values away from calendar order, so never feed a sorted index back into a reconstruction; keep it for reporting only.

</details>

### Exercise 2.8: Handle a series that has no seasonality to extract

**Task:** The `Nile` series records annual flow, so it has frequency 1 and no repeating within-year cycle for a decomposition to find. Attempt `decompose(Nile)` inside an error handler that captures and returns the error message as a string, and save that message to `ex_2_8`.

**Expected result:**

```
#> [1] "time series has no or less than 2 periods"
```

**Difficulty:** Intermediate

[HINTS]
R lets you intercept an error and turn it into a value instead of letting it stop your script.
Wrap the call in `tryCatch()` with an `error = function(e) conditionMessage(e)` handler.

```r title="Your turn"
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- tryCatch(decompose(Nile),
                   error = function(e) conditionMessage(e))
ex_2_8
#> [1] "time series has no or less than 2 periods"
```

**Explanation:** The message is precise about the requirement: `decompose()` needs at least two complete cycles, so with frequency 1 there is nothing to average across. This is the single most common decomposition error, and it usually means someone built their `ts()` without a `frequency` argument rather than that the data is genuinely aseasonal. Check `frequency(x)` first. An annual series like this still has a trend, which you can estimate with a moving average or `loess()`, but it has no seasonal component by definition.

</details>

### Exercise 2.9: Compare the variance carried by each component

**Task:** Quantify how the carbon dioxide record splits its variation between long-run growth, the annual cycle and noise. Decompose `co2` additively, then report the variance of the trend, seasonal and random components alongside the variance of the original series over the span where the trend exists, saving all four to `ex_2_9`.

**Expected result:**

```
#>    var_trend var_seasonal   var_random    var_total
#>      210.608        4.207        0.070      215.996
```

**Difficulty:** Intermediate

[HINTS]
Variance of each component is a direct call, but the total must be measured over a comparable span or the comparison is unfair.
Use `var(..., na.rm = TRUE)` on each component and compute the total on `window(co2, start = c(1959, 7), end = c(1997, 6))`.

```r title="Your turn"
dc <- decompose(co2, type = "additive")
ex_2_9 <- # your code here
ex_2_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dc <- decompose(co2, type = "additive")
tot <- var(window(co2, start = c(1959, 7), end = c(1997, 6)))

ex_2_9 <- round(c(
  var_trend = var(dc$trend, na.rm = TRUE),
  var_seasonal = var(dc$seasonal, na.rm = TRUE),
  var_random = var(dc$random, na.rm = TRUE),
  var_total = tot), 3)
ex_2_9
#>    var_trend var_seasonal   var_random    var_total
#>      210.608        4.207        0.070      215.996
```

**Explanation:** Trend accounts for 210.6 of the 216.0 total, so the steady rise in atmospheric carbon dioxide dwarfs both the annual breathing cycle and the noise. Two cautions on this arithmetic. The component variances sum to 214.9 rather than exactly 216.0, because the components are not perfectly uncorrelated, so treat these as shares rather than an exact partition. And a `var_random` of 0.07 does not mean the model is near-perfect; it means the remainder is small relative to a very strong trend.

</details>

## Section 3. Build the trend by hand with moving averages (8 problems)

### Exercise 3.1: Smooth an annual series with a five-year moving average

**Task:** A water resources engineer studying the `Nile` annual flow record wants year-to-year noise smoothed away to see the underlying level. Apply a centred five-term moving average to the series, keep 1871 through 1880, round to one decimal place and save the result to `ex_3_1`.

**Expected result:**

```
#> Time Series:
#> Start = 1871
#> End = 1880
#> Frequency = 1
#>  [1]     NA     NA 1122.6 1130.6 1061.2 1114.6 1146.6 1142.6 1109.6 1134.0
```

**Difficulty:** Beginner

[HINTS]
A moving average is a linear filter with equal weights, and R has a function for applying weights along a series.
Call `stats::filter(Nile, rep(1/5, 5), sides = 2)`, then `window()` the result.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- round(window(stats::filter(Nile, rep(1/5, 5), sides = 2),
                       start = 1871, end = 1880), 1)
ex_3_1
#> Time Series:
#> Start = 1871
#> End = 1880
#> Frequency = 1
#>  [1]     NA     NA 1122.6 1130.6 1061.2 1114.6 1146.6 1142.6 1109.6 1134.0
```

**Explanation:** Write `stats::filter()` rather than plain `filter()`. Once `dplyr` is loaded, an unqualified `filter()` resolves to the data-frame verb and throws a confusing error about an unused argument, and this collision catches almost everyone at least once. `sides = 2` centres the window so each average sits at the middle of its five years, which is why the first two and last two values are NA: there is no complete window there. Weights `rep(1/5, 5)` sum to 1, keeping the smoothed series on the original scale.

</details>

### Exercise 3.2: Reproduce the decompose() trend with a 2x12 moving average

**Task:** Classical decomposition of monthly data uses a specific weighted average with half weights on the two end points, so a twelve-month window can sit centred on a month. Build that filter yourself, apply it to `AirPassengers`, and report the largest absolute difference from `decompose()`'s own trend plus the number of points compared, saving both to `ex_3_2`.

**Expected result:**

```
#> max_abs_diff    n_matched
#>            0          132
```

**Difficulty:** Advanced

[HINTS]
An even-length window cannot be centred on an observation, so the standard fix averages two adjacent windows, which collapses to thirteen weights.
Use weights `c(0.5, rep(1, 11), 0.5) / 12` with `stats::filter(..., sides = 2)`.

```r title="Your turn"
w <- # your code here
ma <- stats::filter(AirPassengers, w, sides = 2)
tr <- decompose(AirPassengers)$trend
ex_3_2 <- c(max_abs_diff = round(max(abs(ma - tr), na.rm = TRUE), 10),
            n_matched = sum(!is.na(ma) & !is.na(tr)))
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
w <- c(0.5, rep(1, 11), 0.5) / 12
ma <- stats::filter(AirPassengers, w, sides = 2)
tr <- decompose(AirPassengers)$trend

ex_3_2 <- c(max_abs_diff = round(max(abs(ma - tr), na.rm = TRUE), 10),
            n_matched = sum(!is.na(ma) & !is.na(tr)))
ex_3_2
#> max_abs_diff    n_matched
#>            0          132
```

**Explanation:** An exact match, which tells you `decompose()` is not doing anything mysterious in its first step. The half weights exist because averaging twelve consecutive months leaves the result sitting between two months; averaging two such windows shifts it back onto a month and gives January and the following January half a vote each, so no month is double counted. Thirteen weights summing to 1 is the 2x12 moving average, written as 2x4 with weights `c(0.5, 1, 1, 1, 0.5)/4` for quarterly data.

</details>

### Exercise 3.3: Detrend a series by dividing out the moving average

**Task:** With a trend estimate in hand, the next step of classical decomposition is removing it so only season and noise remain. Divide `AirPassengers` by its 2x12 moving-average trend, keep the twelve months of 1955, round to three decimals and save the detrended values to `ex_3_3`.

**Expected result:**

```
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1955 0.924 0.874 0.985 0.977 0.969 1.117 1.274 1.199 1.064 0.922 0.787 0.910
```

**Difficulty:** Intermediate

[HINTS]
For a multiplicative model, removing a component means dividing rather than subtracting.
Compute the trend with the 2x12 filter, then `AirPassengers / trend_hat`, then `window()` to 1955.

```r title="Your turn"
w <- c(0.5, rep(1, 11), 0.5) / 12
trend_hat <- stats::filter(AirPassengers, w, sides = 2)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
w <- c(0.5, rep(1, 11), 0.5) / 12
trend_hat <- stats::filter(AirPassengers, w, sides = 2)

ex_3_3 <- round(window(AirPassengers / trend_hat, start = c(1955, 1), end = c(1955, 12)), 3)
ex_3_3
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1955 0.924 0.874 0.985 0.977 0.969 1.117 1.274 1.199 1.064 0.922 0.787 0.910
```

**Explanation:** These are one year's worth of season-plus-noise ratios: July 1955 ran 27.4% above its local trend. They are close to the final seasonal factors from Exercise 2.2 but not identical, because each year's detrended value still carries that year's noise. Averaging these ratios across years is what removes the noise, and that is the next exercise. For an additive model you would subtract the trend instead, leaving values scattered around 0 rather than around 1.

</details>

### Exercise 3.4: Average the detrended values within each calendar month

**Task:** Detrended values still contain noise, and averaging all twelve Julys together cancels most of it. Compute the mean detrended ratio for each calendar month of `AirPassengers`, ignoring the missing values at both ends, round to four decimals and save the twelve means to `ex_3_4`.

**Expected result:**

```
#>      1      2      3      4      5      6      7      8      9     10     11     12
#> 0.9086 0.8821 1.0056 0.9742 0.9796 1.1108 1.2244 1.2178 1.0586 0.9201 0.7998 0.8972
```

**Difficulty:** Intermediate

[HINTS]
Group the detrended series by position in the cycle, the same grouping you used back in Exercise 1.4, and average within groups.
`tapply(detr, cycle(AirPassengers), mean, na.rm = TRUE)`; the `na.rm` matters because the trend has gaps.

```r title="Your turn"
w <- c(0.5, rep(1, 11), 0.5) / 12
trend_hat <- stats::filter(AirPassengers, w, sides = 2)
detr <- AirPassengers / trend_hat
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
w <- c(0.5, rep(1, 11), 0.5) / 12
trend_hat <- stats::filter(AirPassengers, w, sides = 2)
detr <- AirPassengers / trend_hat

ex_3_4 <- round(tapply(detr, cycle(AirPassengers), mean, na.rm = TRUE), 4)
ex_3_4
#>      1      2      3      4      5      6      7      8      9     10     11     12
#> 0.9086 0.8821 1.0056 0.9742 0.9796 1.1108 1.2244 1.2178 1.0586 0.9201 0.7998 0.8972
```

**Explanation:** Forgetting `na.rm = TRUE` returns NA for the six months at each end of the cycle, since their first or last year has no trend estimate. Note the asymmetry this creates: January through June average over eleven years while July through December average over twelve, which is a small imbalance classical decomposition simply accepts. Compare these against Exercise 1.4's raw month means, which were dominated by growth; detrending first is what turns them into a usable seasonal profile.

</details>

### Exercise 3.5: Normalise the seasonal indices so they average to one

**Task:** Averaged detrended ratios will not quite average to 1, so classical decomposition rescales them before calling them seasonal factors. Divide the twelve month means from the previous exercise by their own mean, round to three decimals, and save the normalised indices to `ex_3_5`, then print `decompose()`'s figure alongside to compare.

**Expected result:**

```
#>     1     2     3     4     5     6     7     8     9    10    11    12
#> 0.910 0.884 1.007 0.976 0.981 1.113 1.227 1.220 1.060 0.922 0.801 0.899
#>  [1] 0.910 0.884 1.007 0.976 0.981 1.113 1.227 1.220 1.060 0.922 0.801 0.899
```

**Difficulty:** Advanced

[HINTS]
Rescaling a set of factors so they centre on 1 is a single division by a summary of the set itself.
Divide the raw index vector by `mean(raw_idx)`.

```r title="Your turn"
w <- c(0.5, rep(1, 11), 0.5) / 12
detr <- AirPassengers / stats::filter(AirPassengers, w, sides = 2)
raw_idx <- tapply(detr, cycle(AirPassengers), mean, na.rm = TRUE)

ex_3_5 <- # your code here
ex_3_5
round(decompose(AirPassengers, type = "multiplicative")$figure, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
w <- c(0.5, rep(1, 11), 0.5) / 12
detr <- AirPassengers / stats::filter(AirPassengers, w, sides = 2)
raw_idx <- tapply(detr, cycle(AirPassengers), mean, na.rm = TRUE)

ex_3_5 <- round(raw_idx / mean(raw_idx), 3)
ex_3_5
#>     1     2     3     4     5     6     7     8     9    10    11    12
#> 0.910 0.884 1.007 0.976 0.981 1.113 1.227 1.220 1.060 0.922 0.801 0.899
round(decompose(AirPassengers, type = "multiplicative")$figure, 3)
#>  [1] 0.910 0.884 1.007 0.976 0.981 1.113 1.227 1.220 1.060 0.922 0.801 0.899
```

**Explanation:** Identical to three decimals, so you have now rebuilt `decompose()` end to end from a filter and a group mean. Normalisation matters because unnormalised factors would quietly inflate or deflate the reconstructed series: if the twelve factors averaged 1.02, dividing the data by them would shrink the seasonally adjusted level by 2% everywhere. For an additive decomposition the equivalent step subtracts the mean instead, forcing the offsets to sum to zero.

</details>

### Exercise 3.6: Recover the remainder and check it against decompose()

**Task:** The last piece of a hand-built decomposition is whatever the trend and seasonal factors fail to explain. Divide `AirPassengers` by the product of your moving-average trend and your normalised seasonal factors, then compare the standard deviation of that remainder against `decompose()`'s own random component, saving both to `ex_3_6`.

**Expected result:**

```
#>      sd_hand sd_decompose
#>      0.03339      0.03339
```

**Difficulty:** Advanced

[HINTS]
The twelve seasonal factors have to be repeated across the whole span before you can divide the series by them.
Build the full-length seasonal series with `ts(rep(idx, length.out = length(x)), start = start(x), frequency = 12)`.

```r title="Your turn"
w <- c(0.5, rep(1, 11), 0.5) / 12
trend_hat <- stats::filter(AirPassengers, w, sides = 2)
idx <- tapply(AirPassengers / trend_hat, cycle(AirPassengers), mean, na.rm = TRUE)
idx <- idx / mean(idx)

ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
w <- c(0.5, rep(1, 11), 0.5) / 12
trend_hat <- stats::filter(AirPassengers, w, sides = 2)
idx <- tapply(AirPassengers / trend_hat, cycle(AirPassengers), mean, na.rm = TRUE)
idx <- idx / mean(idx)

seas <- ts(rep(idx, length.out = length(AirPassengers)),
           start = start(AirPassengers), frequency = 12)
rand_hat <- AirPassengers / (trend_hat * seas)

ex_3_6 <- c(sd_hand = round(sd(rand_hat, na.rm = TRUE), 5),
            sd_decompose = round(sd(decompose(AirPassengers, "multiplicative")$random,
                                    na.rm = TRUE), 5))
ex_3_6
#>      sd_hand sd_decompose
#>      0.03339      0.03339
```

**Explanation:** Both routes give 0.03339, meaning the residual noise is about 3.3% of the local level. The `rep(idx, length.out = n)` idiom works here only because the series starts in January, so the recycling lines up with the calendar; a series starting in April would need the index vector rotated first, and getting that wrong shifts the entire seasonal pattern by a few months without any error message. That silent failure mode is the main reason to let `decompose()` or `stl()` handle the bookkeeping in production code.

</details>

### Exercise 3.7: Show how the window length controls smoothness

**Task:** Longer moving-average windows produce smoother trends but respond more slowly to real turns. Apply 3-term and 13-term centred moving averages to `co2`, then compare the standard deviation of the first differences of the raw series against both smoothed versions, saving the three numbers to `ex_3_7`.

**Expected result:**

```
#>  sd_diff_raw  sd_diff_ma3 sd_diff_ma13
#>       1.2065       1.0101       0.1036
```

**Difficulty:** Intermediate

[HINTS]
Smoothness can be measured by how much a series jumps between consecutive points, which is a spread measure on the differenced series.
Apply `sd(diff(x), na.rm = TRUE)` to the raw series and to each filtered version.

```r title="Your turn"
s3 <- stats::filter(co2, rep(1/3, 3), sides = 2)
s13 <- stats::filter(co2, rep(1/13, 13), sides = 2)
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s3 <- stats::filter(co2, rep(1/3, 3), sides = 2)
s13 <- stats::filter(co2, rep(1/13, 13), sides = 2)

ex_3_7 <- c(sd_diff_raw = round(sd(diff(co2)), 4),
            sd_diff_ma3 = round(sd(diff(s3), na.rm = TRUE), 4),
            sd_diff_ma13 = round(sd(diff(s13), na.rm = TRUE), 4))
ex_3_7
#>  sd_diff_raw  sd_diff_ma3 sd_diff_ma13
#>       1.2065       1.0101       0.1036
```

**Explanation:** The 3-term average barely helps, cutting month-to-month movement from 1.21 to 1.01, because a three-month window cannot span an annual cycle and so leaves the seasonal wave almost intact. The 13-term average drops it to 0.10, an order of magnitude, because its window covers a full year and averages the cycle out. The lesson is that the window must match the seasonal period to remove seasonality: use 13 terms for monthly data and 5 for quarterly, and pay for it with lost observations at each end.

</details>

### Exercise 3.8: Apply a 2x4 moving average to quarterly sales

**Task:** Quarterly data needs a four-period window, which is again even and again needs half weights at the ends. Build the quarterly series from the `sales` vector below starting in Q1 2021, apply a centred 2x4 moving average, round to two decimals and save the smoothed series to `ex_3_8`.

**Expected result:**

```
#>        Qtr1   Qtr2   Qtr3   Qtr4
#> 2021     NA     NA 240.75 244.88
#> 2022 249.25 255.00 260.75 265.75
#> 2023 270.88 276.25 281.50 286.50
#> 2024 291.88 298.12     NA     NA
```

**Difficulty:** Intermediate

[HINTS]
Scale the 2x12 idea down: half weights on the outermost two positions, full weights in between, all divided by the seasonal period.
Use `c(0.5, 1, 1, 1, 0.5) / 4` as the filter weights with `sides = 2`.

```r title="Your turn"
sales <- c(180, 245, 210, 320, 196, 262, 228, 348, 214, 284, 247, 372,
           232, 306, 268, 401)
q <- ts(sales, start = c(2021, 1), frequency = 4)

ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- c(180, 245, 210, 320, 196, 262, 228, 348, 214, 284, 247, 372,
           232, 306, 268, 401)
q <- ts(sales, start = c(2021, 1), frequency = 4)

ex_3_8 <- round(stats::filter(q, c(0.5, 1, 1, 1, 0.5) / 4, sides = 2), 2)
ex_3_8
#>        Qtr1   Qtr2   Qtr3   Qtr4
#> 2021     NA     NA 240.75 244.88
#> 2022 249.25 255.00 260.75 265.75
#> 2023 270.88 276.25 281.50 286.50
#> 2024 291.88 298.12     NA     NA
```

**Explanation:** Five weights for a four-quarter average, exactly the pattern from Exercise 3.2 scaled down. The raw series swings violently between a weak Q1 and a strong Q4, while the smoothed version climbs steadily from 240.75 to 298.12: the seasonality is gone and only growth is left. Two quarters are lost at each end, half the period, and with only sixteen observations that is a quarter of your data. Short series are where classical decomposition hurts most and where `stl()` earns its keep.

</details>

## Section 4. STL decomposition (9 problems)

### Exercise 4.1: Run STL and read the three-column component matrix

**Task:** STL uses local regression rather than moving averages and returns its components as a matrix rather than a list of series. Run `stl()` on `co2` with a periodic seasonal window, save the fit to `ex_4_1`, and print the first four rows of its component matrix rounded to three decimals.

**Expected result:**

```
#>          seasonal   trend remainder
#> Jan 1959   -0.061 315.195     0.286
#> Feb 1959    0.595 315.302     0.413
#> Mar 1959    1.329 315.409    -0.238
#> Apr 1959    2.469 315.515    -0.424
```

**Difficulty:** Intermediate

[HINTS]
The seasonal window argument is mandatory, and one special string value forces the seasonal pattern to be identical in every cycle.
Call `stl(co2, s.window = "periodic")` and look inside the `time.series` element.

```r title="Your turn"
ex_4_1 <- # your code here
round(head(ex_4_1$time.series, 4), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- stl(co2, s.window = "periodic")
round(head(ex_4_1$time.series, 4), 3)
#>          seasonal   trend remainder
#> Jan 1959   -0.061 315.195     0.286
#> Feb 1959    0.595 315.302     0.413
#> Mar 1959    1.329 315.409    -0.238
#> Apr 1959    2.469 315.515    -0.424
```

**Explanation:** Three differences from `decompose()` matter here. The components live in a single multiple time series called `time.series`, so you reach them with `fit$time.series[, "trend"]` rather than `fit$trend`. The third is named `remainder`, not `random`. And there are no NAs: STL estimates trend at January 1959, the very first observation, because local regression does not need a symmetric window. STL is always additive, so decompose logs when the series is multiplicative.

</details>

### Exercise 4.2: Extract the twelve repeating seasonal values from an STL fit

**Task:** With `s.window = "periodic"` the seasonal component repeats exactly, so the whole pattern is described by twelve numbers. Pull the first twelve seasonal values out of an STL fit of `co2`, label them with month abbreviations, round to three decimals and save them to `ex_4_2`.

**Expected result:**

```
#>    Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
#> -0.061  0.595  1.329  2.469  2.957  2.318  0.822 -1.227 -3.032 -3.217 -2.030 -0.923
```

**Difficulty:** Intermediate

[HINTS]
Unlike `decompose()`, an STL fit has no `figure` slot, so take the first full cycle from the seasonal column yourself.
Subset with `fit$time.series[1:12, "seasonal"]` and name it with `month.abb`.

```r title="Your turn"
fit <- stl(co2, s.window = "periodic")
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- stl(co2, s.window = "periodic")
ex_4_2 <- round(fit$time.series[1:12, "seasonal"], 3)
names(ex_4_2) <- month.abb
ex_4_2
#>    Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
#> -0.061  0.595  1.329  2.469  2.957  2.318  0.822 -1.227 -3.032 -3.217 -2.030 -0.923
```

**Explanation:** Taking the first twelve rows is only valid under `s.window = "periodic"`; with a numeric seasonal window the pattern evolves and row 1 differs from row 13, so you would be reporting one particular year as if it were the whole story. Compare these with the `decompose()` figures from Exercise 2.1: May is 2.96 here against 3.00 there, close but not identical, because STL fits the seasonal component with weighted local regression rather than a plain average of detrended values.

</details>

### Exercise 4.3: Turn STL seasonal offsets back into multiplicative factors

**Task:** STL only does additive splits, so the standard route for a proportional series is to decompose the log and exponentiate the seasonal component afterwards. Fit `stl()` to `log(AirPassengers)`, convert the twelve seasonal offsets back to factors with `exp()`, round to three decimals and save the named result to `ex_4_3`.

**Expected result:**

```
#>   Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 0.912 0.892 1.016 0.986 0.985 1.116 1.242 1.233 1.070 0.932 0.808 0.904
```

**Difficulty:** Advanced

[HINTS]
Addition on the log scale is multiplication on the original scale, so the inverse transform turns offsets into ratios.
Fit on `log(AirPassengers)`, then apply `exp()` to the first twelve seasonal values.

```r title="Your turn"
fit <- stl(log(AirPassengers), s.window = "periodic")
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- stl(log(AirPassengers), s.window = "periodic")
ex_4_3 <- round(exp(fit$time.series[1:12, "seasonal"]), 3)
names(ex_4_3) <- month.abb
ex_4_3
#>   Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 0.912 0.892 1.016 0.986 0.985 1.116 1.242 1.233 1.070 0.932 0.808 0.904
```

**Explanation:** July comes out at 1.242 against `decompose()`'s 1.227 from Exercise 2.2, and the ordering of months is identical. Both are defensible estimates of the same quantity, arrived at differently, and a gap of that size is normal. The reason this works is that `log(T * S * R) = log(T) + log(S) + log(R)`, so an additive method on logs is a multiplicative method on the original scale. Do not exponentiate the trend and multiply it back if you need a forecast in original units without a bias correction, since `exp()` of a mean is not the mean of the exponential.

</details>

### Exercise 4.4: Let the seasonal pattern evolve with a numeric s.window

**Task:** Real seasonal patterns drift, and a numeric `s.window` lets STL track that drift instead of forcing one fixed shape. Fit `stl(co2, s.window = 7)` and compare the seasonal value for January and July at the start of the record in 1959 against the same two months in 1997, saving the four rounded values to `ex_4_4`.

**Expected result:**

```
#> jan_1959 jan_1997 jul_1959 jul_1997
#>   -0.142    0.062    0.902    0.768
```

**Difficulty:** Advanced

[HINTS]
Pull the seasonal column as a series, then extract single observations at specific dates rather than by row number.
`window(seas, start = c(1959, 1), end = c(1959, 1))` returns exactly that one month.

```r title="Your turn"
fit <- stl(co2, s.window = 7)
seas <- fit$time.series[, "seasonal"]
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- stl(co2, s.window = 7)
seas <- fit$time.series[, "seasonal"]

ex_4_4 <- c(jan_1959 = round(window(seas, start = c(1959, 1), end = c(1959, 1)), 3),
            jan_1997 = round(window(seas, start = c(1997, 1), end = c(1997, 1)), 3),
            jul_1959 = round(window(seas, start = c(1959, 7), end = c(1959, 7)), 3),
            jul_1997 = round(window(seas, start = c(1997, 7), end = c(1997, 7)), 3))
ex_4_4
#> jan_1959 jan_1997 jul_1959 jul_1997
#>   -0.142    0.062    0.902    0.768
```

**Explanation:** January moved from 0.14 ppm below trend to 0.06 above it across 38 years, and July fell from 0.90 to 0.77, so the annual cycle has genuinely changed shape. `s.window = 7` means the seasonal smoother looks at roughly seven cycles when estimating each month, so smaller values track faster drift at the cost of absorbing noise into the seasonal component. Always use an odd number, and treat `"periodic"` as the extreme where the window is infinite and the pattern is frozen.

</details>

### Exercise 4.5: Control trend flexibility with t.window

**Task:** The `t.window` argument sets how many observations the trend smoother considers, trading responsiveness against smoothness. Fit `stl()` on `co2` twice with `t.window = 15` and `t.window = 201`, then compare the standard deviation of the first differences of each trend, saving both to `ex_4_5`.

**Expected result:**

```
#>  sd_diff_t15 sd_diff_t201
#>      0.05716      0.02220
```

**Difficulty:** Intermediate

[HINTS]
Reuse the smoothness measure from Exercise 3.7, applied to the trend column of each fit rather than to the raw series.
Extract `$time.series[, "trend"]` from both fits and apply `sd(diff(...))`.

```r title="Your turn"
t_short <- stl(co2, s.window = "periodic", t.window = 15)$time.series[, "trend"]
t_long  <- stl(co2, s.window = "periodic", t.window = 201)$time.series[, "trend"]
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
t_short <- stl(co2, s.window = "periodic", t.window = 15)$time.series[, "trend"]
t_long  <- stl(co2, s.window = "periodic", t.window = 201)$time.series[, "trend"]

ex_4_5 <- c(sd_diff_t15 = round(sd(diff(t_short)), 5),
            sd_diff_t201 = round(sd(diff(t_long)), 5))
ex_4_5
#>  sd_diff_t15 sd_diff_t201
#>      0.05716      0.02220
```

**Explanation:** The wide window moves less than half as much month to month, giving a nearly straight line, while the narrow one wiggles and picks up short-run variation that arguably belongs in the remainder. Neither is correct in the abstract; the choice depends on whether a two-year dip counts as a change in trend or as noise, which is a subject-matter judgement rather than a statistical one. Left unset, STL picks `t.window` from the frequency, a sensible default worth keeping unless you have a reason not to.

</details>

### Exercise 4.6: Stop one outlier from contaminating trend and seasonal

**Task:** A single bad observation can drag the trend and seasonal components toward itself unless the fit is told to resist it. Add 250 to observation 100 of `AirPassengers`, fit `stl()` with and without `robust = TRUE`, then report the remainder at that point and how much of the 250 leaked into the other components, saving all four values to `ex_4_6`.

**Expected result:**

```
#>  remainder_plain remainder_robust       leak_plain      leak_robust
#>            202.5            253.4             47.5             -3.4
```

**Difficulty:** Advanced

[HINTS]
If a spike is fully isolated in the remainder, then trend and seasonal are untouched; whatever is missing from the remainder went somewhere else.
Compute `250 - remainder[100]` for each fit as the leak, using `as.numeric()` on the remainder column first.

```r title="Your turn"
spiked <- AirPassengers
spiked[100] <- spiked[100] + 250
r_plain  <- as.numeric(stl(spiked, s.window = "periodic")$time.series[, "remainder"])
r_robust <- as.numeric(stl(spiked, s.window = "periodic", robust = TRUE)$time.series[, "remainder"])

ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
spiked <- AirPassengers
spiked[100] <- spiked[100] + 250
r_plain  <- as.numeric(stl(spiked, s.window = "periodic")$time.series[, "remainder"])
r_robust <- as.numeric(stl(spiked, s.window = "periodic", robust = TRUE)$time.series[, "remainder"])

ex_4_6 <- c(remainder_plain = round(r_plain[100], 1),
            remainder_robust = round(r_robust[100], 1),
            leak_plain = round(250 - r_plain[100], 1),
            leak_robust = round(250 - r_robust[100], 1))
ex_4_6
#>  remainder_plain remainder_robust       leak_plain      leak_robust
#>            202.5            253.4             47.5             -3.4
```

**Explanation:** The ordinary fit routes only 202.5 of the injected 250 into the remainder, meaning about 47.5 passengers of pure error were absorbed into trend and seasonal, permanently distorting them. The robust fit captures 253.4, essentially the entire spike, leaving the components clean. Robust fitting works by running extra iterations that down-weight observations with large remainders, which costs computation and can under-react when a large move is genuine rather than erroneous. Use it when you suspect data errors, not when you suspect real shocks you want modelled.

</details>

### Exercise 4.7: Seasonally adjust a series using the STL seasonal component

**Task:** Seasonal adjustment with STL is a subtraction because the fit is additive. Fit `stl()` to `co2`, subtract the seasonal component from the original series, keep the twelve months of 1997, round to two decimals and save the adjusted values to `ex_4_7`.

**Expected result:**

```
#>         Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
#> 1997 363.29 363.47 363.28 363.93 363.88 363.36 363.70 363.80 363.27 364.05 364.52 365.26
```

**Difficulty:** Intermediate

[HINTS]
An additive model means the seasonal piece comes off by subtraction, not division.
Compute `co2 - fit$time.series[, "seasonal"]`, then `window()` to 1997.

```r title="Your turn"
fit <- stl(co2, s.window = "periodic")
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- stl(co2, s.window = "periodic")
adj <- co2 - fit$time.series[, "seasonal"]

ex_4_7 <- round(window(adj, start = c(1997, 1), end = c(1997, 12)), 2)
ex_4_7
#>         Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
#> 1997 363.29 363.47 363.28 363.93 363.88 363.36 363.70 363.80 363.27 364.05 364.52 365.26
```

**Explanation:** Raw 1997 carbon dioxide swings by roughly 6 ppm across the year purely from the seasonal cycle; adjusted, it rises quietly from 363.29 to 365.26, which is the actual annual increase. The adjusted series is trend plus remainder by construction, so it stays bumpy, and those bumps are real information rather than calendar artefacts. Use division instead of subtraction only when the decomposition itself was multiplicative, as in Exercise 2.4.

</details>

### Exercise 4.8: Compare the STL trend against the classical trend

**Task:** Two methods, one series: check whether they actually disagree. Extract the trend from an STL fit of `co2` and from a classical `decompose()` of the same series, then report their correlation, the largest absolute gap between them, and how many missing values each carries, saving all four to `ex_4_8`.

**Expected result:**

```
#>          cor max_abs_diff     n_stl_na     n_dec_na
#>         1.00         0.06         0.00        12.00
```

**Difficulty:** Intermediate

[HINTS]
Correlating two series with different missingness needs an argument telling the function to use only complete pairs.
Pass `use = "complete.obs"` to `cor()`, and count gaps with `sum(is.na(...))` on each trend.

```r title="Your turn"
stl_tr <- stl(co2, s.window = "periodic")$time.series[, "trend"]
dec_tr <- decompose(co2)$trend
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stl_tr <- stl(co2, s.window = "periodic")$time.series[, "trend"]
dec_tr <- decompose(co2)$trend

ex_4_8 <- c(cor = round(cor(stl_tr, dec_tr, use = "complete.obs"), 5),
            max_abs_diff = round(max(abs(stl_tr - dec_tr), na.rm = TRUE), 3),
            n_stl_na = sum(is.na(stl_tr)), n_dec_na = sum(is.na(dec_tr)))
ex_4_8
#>          cor max_abs_diff     n_stl_na     n_dec_na
#>         1.00         0.06         0.00        12.00
```

**Explanation:** On a clean, strongly trending series the two methods agree almost perfectly, never differing by more than 0.06 ppm out of about 340. The real difference is coverage: STL returns a trend for all 468 months while `decompose()` returns NA for twelve of them, six at each end. When your stakeholder cares most about the latest month, that gap decides the method for you. On messier series with outliers or evolving seasonality the estimates diverge much more, which is when the robustness options of Exercise 4.6 start to matter.

</details>

### Exercise 4.9: Score trend strength and seasonal strength

**Task:** Two standard summary measures compare how much of a series is explained by trend and by season, both on a 0 to 1 scale. Write a function that returns both from an STL fit, apply it to `log(AirPassengers)` and to `co2`, and save the resulting two-row matrix to `ex_4_9`.

**Expected result:**

```
#>               trend seasonal
#> AirPassengers 0.994    0.937
#> co2           1.000    0.984
```

**Difficulty:** Advanced

[HINTS]
Each score compares the variance of the remainder against the variance of that component plus the remainder, then subtracts from 1.
Trend strength is `max(0, 1 - var(remainder) / var(trend + remainder))`; seasonal strength swaps trend for seasonal.

```r title="Your turn"
strength <- function(x) {
  # your code here
}

ex_4_9 <- rbind(AirPassengers = strength(log(AirPassengers)),
                co2 = strength(co2))
ex_4_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
strength <- function(x) {
  cmp <- stl(x, s.window = "periodic")$time.series
  r <- cmp[, "remainder"]; s <- cmp[, "seasonal"]; t <- cmp[, "trend"]
  c(trend = round(max(0, 1 - var(r) / var(t + r)), 3),
    seasonal = round(max(0, 1 - var(r) / var(s + r)), 3))
}

ex_4_9 <- rbind(AirPassengers = strength(log(AirPassengers)),
                co2 = strength(co2))
ex_4_9
#>               trend seasonal
#> AirPassengers 0.994    0.937
#> co2           1.000    0.984
```

**Explanation:** Both series are strongly trended and strongly seasonal, which is why they are the standard teaching examples. The `max(0, ...)` guard matters: when a component is weaker than the noise around it the ratio exceeds 1 and the raw score goes negative, which is meaningless, so it is clamped to zero. Scores near 1 justify seasonal adjustment and a seasonal forecasting model; a seasonal score near 0, as you will see for daily stock prices in Exercise 5.5, says the seasonal component is noise and should be ignored.

</details>

## Section 5. Diagnose the components (8 problems)

### Exercise 5.1: Check the remainder for leftover autocorrelation

**Task:** If a decomposition has captured all the structure, the remainder should look close to unpredictable noise. Fit `stl()` to `log(AirPassengers)`, compute the autocorrelation of the remainder at lags 1 through 6 without drawing a plot, round to three decimals and save the named vector to `ex_5_1`.

**Expected result:**

```
#>   lag1   lag2   lag3   lag4   lag5   lag6
#>  0.371  0.089 -0.190 -0.354 -0.251 -0.190
```

**Difficulty:** Intermediate

[HINTS]
The autocorrelation function can return its values instead of drawing, and its first entry is always the trivial correlation of a series with itself.
Call `acf(rem, lag.max = 6, plot = FALSE)` and take elements 2 through 7 of `$acf`, since element 1 is lag 0.

```r title="Your turn"
rem <- stl(log(AirPassengers), s.window = "periodic")$time.series[, "remainder"]
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rem <- stl(log(AirPassengers), s.window = "periodic")$time.series[, "remainder"]
a <- acf(rem, lag.max = 6, plot = FALSE)

ex_5_1 <- round(setNames(as.numeric(a$acf)[2:7], paste0("lag", 1:6)), 3)
ex_5_1
#>   lag1   lag2   lag3   lag4   lag5   lag6
#>  0.371  0.089 -0.190 -0.354 -0.251 -0.190
```

**Explanation:** Lag 1 sits at 0.371 and lag 4 at -0.354, both well beyond the roughly plus or minus 0.16 band that 144 observations would give for pure noise. The remainder is therefore not white noise: a high month tends to be followed by another high month. That does not invalidate the decomposition, it just means trend and seasonality were never the whole story and short-run dynamics remain, which is exactly what an ARIMA model on the remainder would capture. The `[2:7]` indexing is the classic off-by-one trap, since `acf` always reports lag 0 first with a value of 1.

</details>

### Exercise 5.2: Flag outlier months from the remainder component

**Task:** Large remainders point to months the model could not explain, which is a cheap and effective anomaly detector. Using an STL fit of `log(AirPassengers)`, flag every observation whose remainder exceeds 2.5 standard deviations in absolute value and build a data frame of the date, passenger count, remainder and z-score, saving it to `ex_5_2`.

**Expected result:**

```
#>       date passengers remainder     z
#> 1 Mar 1951        178    0.0859  2.62
#> 2 Feb 1952        180    0.0865  2.64
#> 3 Mar 1960        419   -0.1050 -3.20
```

**Difficulty:** Intermediate

[HINTS]
Scale the remainder by its own standard deviation, then find the positions that break your threshold and use them to index everything else.
`which(abs(rem) > 2.5 * sd(rem))` gives the positions; `month.abb[cycle(x)[idx]]` and `floor(time(x)[idx])` build the labels.

```r title="Your turn"
rem <- stl(log(AirPassengers), s.window = "periodic")$time.series[, "remainder"]
idx <- # your code here
ex_5_2 <- data.frame(
  date = paste(month.abb[cycle(AirPassengers)[idx]], floor(time(AirPassengers)[idx])),
  passengers = as.numeric(AirPassengers)[idx],
  remainder = round(as.numeric(rem)[idx], 4),
  z = round(as.numeric(rem)[idx] / sd(rem), 2))
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cmp <- stl(log(AirPassengers), s.window = "periodic")$time.series
rem <- cmp[, "remainder"]
idx <- which(abs(rem) > 2.5 * sd(rem))

ex_5_2 <- data.frame(
  date = paste(month.abb[cycle(AirPassengers)[idx]], floor(time(AirPassengers)[idx])),
  passengers = as.numeric(AirPassengers)[idx],
  remainder = round(as.numeric(rem)[idx], 4),
  z = round(as.numeric(rem)[idx] / sd(rem), 2))
ex_5_2
#>       date passengers remainder     z
#> 1 Mar 1951        178    0.0859  2.62
#> 2 Feb 1952        180    0.0865  2.64
#> 3 Mar 1960        419   -0.1050 -3.20
```

**Explanation:** Three months out of 144 break the threshold, and March 1960 is the largest miss at 3.2 standard deviations below expectation, roughly 10% fewer passengers than trend and season predicted. Because the fit was on logs, the remainder is a proportional error, so the same threshold means the same relative miss in 1951 and in 1960; on the raw scale a fixed cutoff would flag only late years. One caveat: an extreme outlier inflates `sd(rem)` and so raises its own threshold, which is why a robust STL fit or a median-based scale makes this more reliable in production.

</details>

### Exercise 5.3: Test the remainder for white noise with Ljung-Box

**Task:** Eyeballing an autocorrelation plot is subjective, so use a formal portmanteau test on the remainder instead. Run a Ljung-Box test at 12 lags on the STL remainder of `log(AirPassengers)` and build a one-row data frame holding the remainder mean, test statistic, degrees of freedom and p-value, saving it to `ex_5_3`.

**Expected result:**

```
#>   mean_remainder statistic df  p_value
#> 1       -0.00033     99.74 12 6.66e-16
```

**Difficulty:** Advanced

[HINTS]
Base R has one function covering both the Box-Pierce and Ljung-Box portmanteau tests, selected by an argument.
Use `Box.test(rem, lag = 12, type = "Ljung-Box")`, then pull `$statistic`, `$parameter` and `$p.value`.

```r title="Your turn"
rem <- stl(log(AirPassengers), s.window = "periodic")$time.series[, "remainder"]
bt <- # your code here
ex_5_3 <- data.frame(mean_remainder = round(mean(rem), 6),
                     statistic = round(as.numeric(bt$statistic), 2),
                     df = as.numeric(bt$parameter),
                     p_value = signif(bt$p.value, 3))
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rem <- stl(log(AirPassengers), s.window = "periodic")$time.series[, "remainder"]
bt <- Box.test(rem, lag = 12, type = "Ljung-Box")

ex_5_3 <- data.frame(mean_remainder = round(mean(rem), 6),
                     statistic = round(as.numeric(bt$statistic), 2),
                     df = as.numeric(bt$parameter),
                     p_value = signif(bt$p.value, 3))
ex_5_3
#>   mean_remainder statistic df  p_value
#> 1       -0.00033     99.74 12 6.66e-16
```

**Explanation:** The null hypothesis is that the first twelve autocorrelations are jointly zero, and a p-value of about 7e-16 rejects it emphatically, confirming what Exercise 5.1 showed by eye. The remainder mean of -0.00033 is effectively zero, as it must be, since a decomposition centres the remainder by construction and so tells you nothing about fit. Choosing the lag count is a judgement call: a common rule of thumb is one full seasonal period for seasonal data, which is why 12 is used here.

</details>

### Exercise 5.4: Report each component as a percentage of total variance

**Task:** Percentages communicate a decomposition to non-technical stakeholders far better than raw variances do. Using an STL fit of `co2`, express the variance of the trend, seasonal and remainder components as percentages of their combined total, round to two decimals and save the named vector to `ex_5_4`.

**Expected result:**

```
#>     trend  seasonal remainder
#>     98.15      1.82      0.03
```

**Difficulty:** Intermediate

[HINTS]
Compute the three variances, add them for a denominator, then scale the whole vector at once.
Divide the vector of variances by their sum and multiply by 100 before rounding.

```r title="Your turn"
cmp <- stl(co2, s.window = "periodic")$time.series
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cmp <- stl(co2, s.window = "periodic")$time.series
tot <- var(cmp[, "trend"]) + var(cmp[, "seasonal"]) + var(cmp[, "remainder"])

ex_5_4 <- round(100 * c(trend = var(cmp[, "trend"]),
                        seasonal = var(cmp[, "seasonal"]),
                        remainder = var(cmp[, "remainder"])) / tot, 2)
ex_5_4
#>     trend  seasonal remainder
#>     98.15      1.82      0.03
```

**Explanation:** Trend carries 98% of the variation, so any summary of this record that ignores the long-run rise is missing almost everything. Two honest caveats. The denominator here is the sum of component variances rather than the variance of the original series, and those differ slightly because the components are not exactly uncorrelated, so these are shares of a constructed total. And a tiny remainder share is a statement about the size of the trend, not proof of a good model: Exercise 5.3 showed this same remainder is far from white noise.

</details>

### Exercise 5.5: Compare seasonal strength across three very different series

**Task:** The strength scores earn their keep when they tell you a series has no seasonality worth modelling. Apply the strength function from Exercise 4.9 to `log(AirPassengers)`, `co2`, and the first 500 daily DAX closes from `EuStockMarkets` treated as a five-day weekly cycle, then save the three-row data frame to `ex_5_5`.

**Expected result:**

```
#>               trend seasonal
#> AirPassengers 0.994    0.937
#> co2           1.000    0.984
#> DAX_weekly    0.988    0.007
```

**Difficulty:** Advanced

[HINTS]
The stock series arrives as a matrix column with an awkward frequency, so rebuild it as a fresh series with the cycle length you want to test.
`ts(as.numeric(EuStockMarkets[1:500, "DAX"]), frequency = 5)` gives a five-day weekly cycle.

```r title="Your turn"
strength <- function(x) {
  cmp <- stl(x, s.window = "periodic")$time.series
  r <- cmp[, "remainder"]; s <- cmp[, "seasonal"]; tr <- cmp[, "trend"]
  c(trend = round(max(0, 1 - var(r) / var(tr + r)), 3),
    seasonal = round(max(0, 1 - var(r) / var(s + r)), 3))
}

ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
strength <- function(x) {
  cmp <- stl(x, s.window = "periodic")$time.series
  r <- cmp[, "remainder"]; s <- cmp[, "seasonal"]; tr <- cmp[, "trend"]
  c(trend = round(max(0, 1 - var(r) / var(tr + r)), 3),
    seasonal = round(max(0, 1 - var(r) / var(s + r)), 3))
}

dax <- ts(as.numeric(EuStockMarkets[1:500, "DAX"]), frequency = 5)

ex_5_5 <- as.data.frame(rbind(
  AirPassengers = strength(log(AirPassengers)),
  co2 = strength(co2),
  DAX_weekly = strength(dax)))
ex_5_5
#>               trend seasonal
#> AirPassengers 0.994    0.937
#> co2           1.000    0.984
#> DAX_weekly    0.988    0.007
```

**Explanation:** A seasonal score of 0.007 for the DAX is the useful answer: there is no meaningful day-of-week pattern in the index level, so the seasonal component STL dutifully returned is noise, and seasonally adjusting the series would remove nothing real. Its trend score of 0.988 is high but nearly meaningless too, because a random walk drifts and therefore scores as strongly trended without being predictable. Strength scores tell you which components exist, never whether the series can be forecast.

</details>

### Exercise 5.6: Locate a level shift in a series with no seasonality

**Task:** The `Nile` record is famous for dropping sharply after the first Aswan dam was built, and a decomposition cannot help because the series has no seasonality. Search every candidate split year from 1881 to 1960 for the one that maximises the drop between the mean before and the mean after, and save the year, the drop and both means to `ex_5_6`.

**Expected result:**

```
#> best_year  level_drop mean_before  mean_after
#>    1899.0      -247.8      1097.8       850.0
```

**Difficulty:** Advanced

[HINTS]
Try every possible breakpoint and score each one by the difference between the two segment means it creates.
Loop candidate years with `sapply()`, computing `mean(Nile[yrs >= y]) - mean(Nile[yrs < y])`, then take `which.min()`.

```r title="Your turn"
yrs <- time(Nile)
candidates <- yrs[yrs >= 1881 & yrs <= 1960]
gap <- # your code here
ex_5_6 <- c(best_year = candidates[which.min(gap)],
            level_drop = round(min(gap), 1),
            mean_before = round(mean(Nile[yrs < candidates[which.min(gap)]]), 1),
            mean_after = round(mean(Nile[yrs >= candidates[which.min(gap)]]), 1))
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
yrs <- time(Nile)
candidates <- yrs[yrs >= 1881 & yrs <= 1960]

gap <- sapply(candidates, function(y)
  mean(Nile[yrs >= y]) - mean(Nile[yrs < y]))

ex_5_6 <- c(best_year = candidates[which.min(gap)],
            level_drop = round(min(gap), 1),
            mean_before = round(mean(Nile[yrs < candidates[which.min(gap)]]), 1),
            mean_after = round(mean(Nile[yrs >= candidates[which.min(gap)]]), 1))
ex_5_6
#> best_year  level_drop mean_before  mean_after
#>    1899.0      -247.8      1097.8       850.0
```

**Explanation:** The search lands on 1899, matching the historical construction of the Aswan Low Dam, with average annual flow falling from 1097.8 to 850.0. This is a step change in level, not a trend and not a season, which is why decomposition tools have nothing to say about it: a moving-average trend would smear the step across several years and make it look like a gradual decline. Restricting candidates to 1881 onward avoids degenerate splits with only a handful of years on one side, and this brute-force search is the intuition behind formal changepoint methods.

</details>

### Exercise 5.7: Plot the remainder distribution to check for skew

**Task:** A quick histogram of the remainder tells you whether the errors are roughly symmetric or whether the model systematically misses in one direction. Draw a histogram of the STL remainder of `log(AirPassengers)` with 20 bins and a descriptive title, and save the plotting call to `ex_5_7`.

**Expected result:**

```
#> A roughly symmetric, single-peaked histogram of about 144 values centred
#> near 0, spanning roughly -0.105 to 0.086 on the x axis, with the tallest
#> bars just either side of zero and a slightly longer left tail.
```

**Difficulty:** Beginner

[HINTS]
This is the standard distribution plot for a numeric vector, with an argument controlling how finely the range is cut.
`hist(rem, breaks = 20, main = "...")`.

```r title="Your turn"
rem <- stl(log(AirPassengers), s.window = "periodic")$time.series[, "remainder"]
ex_5_7 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rem <- stl(log(AirPassengers), s.window = "periodic")$time.series[, "remainder"]

ex_5_7 <- hist(rem, breaks = 20,
               main = "STL remainder, log(AirPassengers)",
               xlab = "Remainder (log scale)")
#> A roughly symmetric mound centred on 0, spanning about -0.105 to 0.086.
```

**Explanation:** Symmetry around zero is what you want, and this remainder delivers it, which supports the decision to work on the log scale. Run the same plot on the untransformed series and the histogram skews right, because large positive misses in the high-traffic later years have no small-scale counterpart early on. A histogram checks the shape of the errors while the Ljung-Box test of Exercise 5.3 checks their independence, and the two answer different questions: this remainder looks well shaped but is definitely not independent.

</details>

### Exercise 5.8: Test whether the seasonal shape has changed over decades

**Task:** Fitting one fixed seasonal pattern to forty years assumes the pattern never changed, and that assumption is testable. Split `co2` at the end of 1978, fit a periodic STL to each half separately, and build a data frame comparing the twelve monthly seasonal values early against late with their change, saving it to `ex_5_8`.

**Expected result:**

```
#>    month  early   late change
#> 1    Jan -0.099 -0.038  0.062
#> 2    Feb  0.530  0.649  0.119
#> 3    Mar  1.191  1.462  0.271
#> ...
#> 9    Sep -2.769 -3.302 -0.533
#> 10   Oct -3.063 -3.368 -0.304
#> 11   Nov -1.955 -2.093 -0.138
#> 12   Dec -0.944 -0.882  0.062
```

**Difficulty:** Intermediate

[HINTS]
Cut the series into two spans with the time-aware subsetting function, then fit each independently and line the two seasonal profiles up.
`window(co2, end = c(1978, 12))` and `window(co2, start = c(1979, 1))`, taking `[1:12, "seasonal"]` from each fit.

```r title="Your turn"
early <- # your code here
late  <- # your code here
ex_5_8 <- data.frame(month = month.abb,
                     early = round(as.numeric(early), 3),
                     late = round(as.numeric(late), 3),
                     change = round(as.numeric(late) - as.numeric(early), 3))
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
early <- stl(window(co2, end = c(1978, 12)), s.window = "periodic")$time.series[1:12, "seasonal"]
late  <- stl(window(co2, start = c(1979, 1)), s.window = "periodic")$time.series[1:12, "seasonal"]

ex_5_8 <- data.frame(month = month.abb,
                     early = round(as.numeric(early), 3),
                     late = round(as.numeric(late), 3),
                     change = round(as.numeric(late) - as.numeric(early), 3))
ex_5_8
#>    month  early   late change
#> 1    Jan -0.099 -0.038  0.062
#> 2    Feb  0.530  0.649  0.119
#> 3    Mar  1.191  1.462  0.271
#> ...
#> 12   Dec -0.944 -0.882  0.062
```

**Explanation:** The cycle has widened at both ends: spring peaks climbed by up to 0.36 ppm while the September trough deepened by 0.53 ppm, so the annual amplitude has grown by roughly a fifth. That is a real geophysical finding and it means `s.window = "periodic"` is the wrong choice for this record; a numeric window as in Exercise 4.4 tracks the drift properly. Splitting a series and fitting each half is the general, assumption-light way to test any modelling choice you are unsure about, at the cost of halving the data behind each estimate.

</details>

## Section 6. Put decomposition to work end to end (8 problems)

### Exercise 6.1: Build a seasonal adjustment report for a full year

**Task:** A reporting analyst has to explain to the commercial team why raw monthly traffic is misleading. Build a data frame for 1960 with the month, reported passengers, the multiplicative seasonal index, the seasonally adjusted figure and the gap between adjusted and reported, and save it to `ex_6_1`.

**Expected result:**

```
#>    month reported seasonal_index adjusted    gap
#> 1    Jan      417          0.910    458.1   41.1
#> 2    Feb      391          0.884    442.5   51.5
#> 3    Mar      419          1.007    415.9   -3.1
#> ...
#> 7    Jul      622          1.227    507.1 -114.9
#> ...
#> 11   Nov      390          0.801    486.8   96.8
#> 12   Dec      432          0.899    480.6   48.6
```

**Difficulty:** Intermediate

[HINTS]
Everything you need comes from one decomposition: the raw series, the twelve-value figure, and the series divided by its seasonal component.
Assemble with `data.frame()` using `window(..., start = c(1960, 1))` for the 1960 slice, then add the gap with `mutate()`.

```r title="Your turn"
d <- decompose(AirPassengers, type = "multiplicative")
adj <- AirPassengers / d$seasonal
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- decompose(AirPassengers, type = "multiplicative")
adj <- AirPassengers / d$seasonal

ex_6_1 <- data.frame(
  month = month.abb,
  reported = as.numeric(window(AirPassengers, start = c(1960, 1))),
  seasonal_index = round(as.numeric(d$figure), 3),
  adjusted = round(as.numeric(window(adj, start = c(1960, 1))), 1)) |>
  mutate(gap = round(adjusted - reported, 1))
ex_6_1
#>    month reported seasonal_index adjusted    gap
#> 1    Jan      417          0.910    458.1   41.1
#> 2    Feb      391          0.884    442.5   51.5
#> 3    Mar      419          1.007    415.9   -3.1
#> ...
#> 12   Dec      432          0.899    480.6   48.6
```

**Explanation:** The gap column is what makes this a report rather than a table of numbers: July's 622 passengers overstate underlying demand by 115, and November's 390 understate it by 97. A stakeholder reading only reported figures would conclude demand collapsed after summer, when adjusted demand actually held near 490 all year. This works because `d$figure` is in calendar order and the 1960 slice starts in January, so the two line up; a slice starting mid-year would need the index rotated to match.

</details>

### Exercise 6.2: Forecast a year ahead by reseasonalising a flat trend

**Task:** The simplest decomposition forecast holds the seasonally adjusted level flat and multiplies the seasonal factors back in. Take the last seasonally adjusted value of `AirPassengers`, multiply it by each of the twelve multiplicative factors, and save the result as a monthly series starting January 1961 to `ex_6_2`.

**Expected result:**

```
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 437.5 424.7 484.2 469.0 471.7 534.8 589.5 586.3 509.7 443.0 385.1 432.0
```

**Difficulty:** Advanced

[HINTS]
Forecast the adjusted series first with the crudest possible rule, then undo the adjustment on the forecast.
Take `window(adj, start = c(1960, 12))` as the level, multiply by `d$figure`, and wrap in `ts(..., start = c(1961, 1), frequency = 12)`.

```r title="Your turn"
d <- decompose(AirPassengers, type = "multiplicative")
adj <- AirPassengers / d$seasonal
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- decompose(AirPassengers, type = "multiplicative")
adj <- AirPassengers / d$seasonal
last_level <- as.numeric(window(adj, start = c(1960, 12)))

ex_6_2 <- ts(round(last_level * as.numeric(d$figure), 1),
             start = c(1961, 1), frequency = 12)
ex_6_2
#>        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
#> 1961 437.5 424.7 484.2 469.0 471.7 534.8 589.5 586.3 509.7 443.0 385.1 432.0
```

**Explanation:** This is the seasonal naive forecast done properly: forecast the adjusted series, then reseasonalise. The forecast reproduces the summer peak and November trough without any model of seasonality beyond the twelve factors already estimated. Its weakness is the flat level assumption, which throws away the obvious upward trend and so forecasts 1961 at roughly 1960's level. Extrapolating the adjusted trend, or fitting a drift or damped trend to it, is the natural next step. The forecast is also point-only: no interval comes free from this construction.

</details>

### Exercise 6.3: Backtest the decomposition forecast against a held-out year

**Task:** A forecast method is only worth using if it beats a naive baseline out of sample. Train a multiplicative decomposition on `AirPassengers` through 1959, forecast the twelve months of 1960 by reseasonalising the last adjusted level, and save the MAPE, RMSE and the MAPE of a seasonal naive baseline to `ex_6_3`.

**Expected result:**

```
#>       mape       rmse mape_naive
#>       6.82      38.16       9.99
```

**Difficulty:** Advanced

[HINTS]
Everything must be estimated on the training slice only, including the seasonal factors, or you have leaked the test year into the model.
Split with `window(..., end = c(1959, 12))` and `window(..., start = c(1960, 1))`; the seasonal naive baseline is simply 1959's twelve values.

```r title="Your turn"
train <- window(AirPassengers, end = c(1959, 12))
test <- window(AirPassengers, start = c(1960, 1))
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
train <- window(AirPassengers, end = c(1959, 12))
test <- window(AirPassengers, start = c(1960, 1))

d <- decompose(train, type = "multiplicative")
adj <- train / d$seasonal
level <- as.numeric(window(adj, start = c(1959, 12)))
fc <- level * as.numeric(d$figure)

ex_6_3 <- c(mape = round(mean(abs(fc - test) / test) * 100, 2),
            rmse = round(sqrt(mean((fc - test)^2)), 2),
            mape_naive = round(mean(abs(as.numeric(window(train, start = c(1959, 1))) - test) / test) * 100, 2))
ex_6_3
#>       mape       rmse mape_naive
#>       6.82      38.16       9.99
```

**Explanation:** The decomposition forecast misses by 6.82% on average against the seasonal naive baseline's 9.99%, a genuine improvement of about a third, achieved with no model fitting beyond a moving average and twelve ratios. The reason it wins is that the naive forecast repeats 1959 including its noise, while the decomposition forecast uses a level averaged over the whole series and smoothed seasonal factors. Note the discipline that makes this an honest test: `decompose()` runs on `train`, never on the full series, because seasonal factors estimated with 1960 in them would leak the answer.

</details>

### Exercise 6.4: Compare month-over-month growth before and after adjustment

**Task:** Month-over-month growth rates computed on raw seasonal data are close to meaningless, and adjustment is what makes them readable. Build a data frame of the twelve 1960 month-over-month percentage changes computed on the raw `AirPassengers` series and on the seasonally adjusted series, and save it to `ex_6_4`.

**Expected result:**

```
#>    month raw_mom adj_mom
#> 1    Jan     3.0     1.7
#> 2    Feb    -6.2    -3.4
#> 3    Mar     7.2    -6.0
#> ...
#> 7    Jul    16.3     5.5
#> ...
#> 9    Sep   -16.2    -3.6
#> 12   Dec    10.8    -1.3
```

**Difficulty:** Intermediate

[HINTS]
A month-over-month change needs the previous month too, so start both windows in December 1959 and difference from there.
`100 * diff(v) / head(v, -1)` where `v` runs from Dec 1959 through Dec 1960.

```r title="Your turn"
d <- decompose(AirPassengers, type = "multiplicative")
adj <- AirPassengers / d$seasonal
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d <- decompose(AirPassengers, type = "multiplicative")
adj <- AirPassengers / d$seasonal

ex_6_4 <- data.frame(
  month = month.abb,
  raw_mom = round(100 * diff(as.numeric(window(AirPassengers, start = c(1959, 12)))) /
                    head(as.numeric(window(AirPassengers, start = c(1959, 12))), -1), 1),
  adj_mom = round(100 * diff(as.numeric(window(adj, start = c(1959, 12)))) /
                    head(as.numeric(window(adj, start = c(1959, 12))), -1), 1))
ex_6_4
#>    month raw_mom adj_mom
#> 1    Jan     3.0     1.7
#> 2    Feb    -6.2    -3.4
#> 3    Mar     7.2    -6.0
#> ...
#> 12   Dec    10.8    -1.3
```

**Explanation:** Raw September shows a 16.2% collapse and raw July a 16.3% boom, but both are the calendar talking, not the business: adjusted, they are -3.6% and +5.5%. The most instructive row is March, where raw growth of +7.2% turns into an adjusted decline of -6.0%, a complete sign reversal. Reporting raw month-over-month figures for a seasonal series will eventually put a sign error in front of a stakeholder, which is the practical case for adjustment. Year-over-year change is the other common fix and needs no model, at the cost of a twelve-month lag in spotting turns.

</details>

### Exercise 6.5: Measure the damage done by interpolating missing months

**Task:** Decomposition functions refuse to run on series with gaps, so analysts interpolate, and it is worth knowing what that costs. Blank out observations 40, 41 and 90 of `AirPassengers`, fill them by linear interpolation, then build a data frame comparing the interpolated values against the true ones with the error, saving it to `ex_6_5`.

**Expected result:**

```
#>   position    month actual interpolated error
#> 1       40 Apr 1952    181        201.3  20.3
#> 2       41 May 1952    183        209.7  26.7
#> 3       90 Jun 1956    374        365.5  -8.5
```

**Difficulty:** Intermediate

[HINTS]
Base R has a linear interpolation function that ignores missing pairs and evaluates a straight line at the points you ask for.
`approx(time(gappy), as.numeric(gappy), xout = time(gappy))$y`, rewrapped with `ts()`.

```r title="Your turn"
gappy <- AirPassengers
gappy[c(40, 41, 90)] <- NA
filled <- # your code here
ex_6_5 <- data.frame(
  position = c(40, 41, 90),
  month = paste(month.abb[cycle(AirPassengers)[c(40, 41, 90)]],
                floor(time(AirPassengers)[c(40, 41, 90)])),
  actual = as.numeric(AirPassengers)[c(40, 41, 90)],
  interpolated = round(filled[c(40, 41, 90)], 1)) |>
  mutate(error = round(interpolated - actual, 1))
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
gappy <- AirPassengers
gappy[c(40, 41, 90)] <- NA

filled <- ts(approx(time(gappy), as.numeric(gappy), xout = time(gappy))$y,
             start = start(gappy), frequency = 12)

ex_6_5 <- data.frame(
  position = c(40, 41, 90),
  month = paste(month.abb[cycle(AirPassengers)[c(40, 41, 90)]],
                floor(time(AirPassengers)[c(40, 41, 90)])),
  actual = as.numeric(AirPassengers)[c(40, 41, 90)],
  interpolated = round(filled[c(40, 41, 90)], 1)) |>
  mutate(error = round(interpolated - actual, 1))
ex_6_5
#>   position    month actual interpolated error
#> 1       40 Apr 1952    181        201.3  20.3
#> 2       41 May 1952    183        209.7  26.7
#> 3       90 Jun 1956    374        365.5  -8.5
```

**Explanation:** April and May 1952 are overestimated by 20 and 27 passengers because straight-line interpolation between March and June ignores the fact that spring months sit below the summer level, so it draws a line straight through the seasonal dip. The isolated June 1956 gap fares much better at -8.5, since a single missing point between two neighbours in the same part of the cycle is an easier problem. The lesson is to interpolate on the seasonally adjusted series and reseasonalise, or to fill from the same month in adjacent years, rather than drawing a naive line through a seasonal series.

</details>

### Exercise 6.6: Run the full pipeline on a quarterly retail series

**Task:** A retail operations analyst has five years of quarterly unit sales and needs the underlying trend separated from the Q4 holiday spike. Build the quarterly series from the `units` vector below starting Q1 2020, decompose it multiplicatively, and save a data frame of quarter label, raw units and seasonally adjusted units to `ex_6_6`.

**Expected result:**

```
#>    quarter units adjusted
#> 1  Q1 2020   180    227.1
#> 2  Q2 2020   245    238.5
#> 3  Q3 2020   210    239.5
#> 4  Q4 2020   320    245.5
#> ...
#> 17 Q1 2024   251    316.7
#> 18 Q2 2024   329    320.3
#> 19 Q3 2024   288    328.5
#> 20 Q4 2024   430    329.9
```

**Difficulty:** Intermediate

[HINTS]
The whole pipeline is three steps: build the series with the right frequency, decompose it, then divide out the seasonal component.
Build the quarter labels with `paste0("Q", cycle(q), " ", floor(time(q)))`.

```r title="Your turn"
units <- c(180, 245, 210, 320, 196, 262, 228, 348, 214, 284, 247, 372,
           232, 306, 268, 401, 251, 329, 288, 430)
q <- ts(units, start = c(2020, 1), frequency = 4)

ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
units <- c(180, 245, 210, 320, 196, 262, 228, 348, 214, 284, 247, 372,
           232, 306, 268, 401, 251, 329, 288, 430)
q <- ts(units, start = c(2020, 1), frequency = 4)
dq <- decompose(q, type = "multiplicative")

ex_6_6 <- data.frame(
  quarter = paste0("Q", cycle(q), " ", floor(time(q))),
  units = as.numeric(q),
  adjusted = round(as.numeric(q / dq$seasonal), 1))
ex_6_6
#>    quarter units adjusted
#> 1  Q1 2020   180    227.1
#> 2  Q2 2020   245    238.5
#> 3  Q3 2020   210    239.5
#> 4  Q4 2020   320    245.5
#> ...
#> 20 Q4 2024   430    329.9
```

**Explanation:** Raw sales zigzag between a weak Q1 and a strong Q4 in every year, hiding the actual story. Adjusted, the series climbs almost monotonically from 227 to 330, roughly 45% growth over five years, with no zigzag left. The adjusted column has no gaps even though the trend component does, because adjustment uses only the seasonal factors, which are defined everywhere. That is why seasonal adjustment is usually the right deliverable for a business audience and the trend component is not.

</details>

### Exercise 6.7: Test a daily price series for weekly seasonality

**Task:** A risk analyst wants to know whether the DAX index shows a day-of-week pattern worth modelling before building anything more complicated. Take the first 500 daily DAX closes from `EuStockMarkets` as a five-day cycle, decompose additively, and save the five daily factors plus the seasonal and trend ranges to `ex_6_7`.

**Expected result:**

```
#>           day1           day2           day3           day4           day5 seasonal_range
#>         -0.569          0.311         -1.291          0.451          1.098          2.390
#>    trend_range
#>        372.280
```

**Difficulty:** Intermediate

[HINTS]
A seasonal effect only matters relative to how much the series moves overall, so measure both spans on the same scale.
Use `diff(range(dd$figure))` for the seasonal span and `diff(range(dd$trend, na.rm = TRUE))` for the trend span.

```r title="Your turn"
dax <- ts(as.numeric(EuStockMarkets[1:500, "DAX"]), frequency = 5)
dd <- decompose(dax, type = "additive")
ex_6_7 <- # your code here
names(ex_6_7)[1:5] <- paste0("day", 1:5)
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dax <- ts(as.numeric(EuStockMarkets[1:500, "DAX"]), frequency = 5)
dd <- decompose(dax, type = "additive")

ex_6_7 <- c(round(dd$figure, 3),
            seasonal_range = round(diff(range(dd$figure)), 2),
            trend_range = round(diff(range(dd$trend, na.rm = TRUE)), 2))
names(ex_6_7)[1:5] <- paste0("day", 1:5)
ex_6_7
#>           day1           day2           day3           day4           day5 seasonal_range
#>         -0.569          0.311         -1.291          0.451          1.098          2.390
#>    trend_range
#>        372.280
```

**Explanation:** `decompose()` always returns a seasonal component, so getting numbers back is never evidence that seasonality exists. The comparison is what matters: the day-of-week effect spans 2.39 index points while the trend spans 372.28, so seasonality is about 0.6% of the movement and is almost certainly sampling noise. This matches the near-zero seasonal strength score in Exercise 5.5. Report the ratio rather than the factors, and resist the temptation to explain why Wednesday looks weak.

</details>

### Exercise 6.8: Build a one-glance decomposition summary for three series

**Task:** Analysts screening many series need one table that says which are trending, which are seasonal and how noisy each is. Write a function returning trend strength, seasonal strength and remainder standard deviation from an STL fit, apply it to `log(AirPassengers)`, `co2` and the 500-day weekly DAX series, and save the labelled three-row data frame to `ex_6_8`.

**Expected result:**

```
#>                series trend_strength seasonal_strength remainder_sd
#> 1 AirPassengers (log)          0.994             0.937       0.0328
#> 2                 co2          1.000             0.984       0.2601
#> 3        DAX (weekly)          0.988             0.007       9.4734
```

**Difficulty:** Advanced

[HINTS]
Have the function return a one-row data frame including a label column, so the results stack cleanly.
Return `data.frame(series = label, ...)` from the function and combine the calls with `rbind()`.

```r title="Your turn"
report <- function(x, label) {
  # your code here
}

ex_6_8 <- rbind(report(log(AirPassengers), "AirPassengers (log)"),
                report(co2, "co2"),
                report(ts(as.numeric(EuStockMarkets[1:500, "DAX"]), frequency = 5), "DAX (weekly)"))
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
report <- function(x, label) {
  cmp <- stl(x, s.window = "periodic")$time.series
  r <- cmp[, "remainder"]
  data.frame(series = label,
             trend_strength = round(max(0, 1 - var(r) / var(cmp[, "trend"] + r)), 3),
             seasonal_strength = round(max(0, 1 - var(r) / var(cmp[, "seasonal"] + r)), 3),
             remainder_sd = round(sd(r), 4))
}

ex_6_8 <- rbind(report(log(AirPassengers), "AirPassengers (log)"),
                report(co2, "co2"),
                report(ts(as.numeric(EuStockMarkets[1:500, "DAX"]), frequency = 5), "DAX (weekly)"))
ex_6_8
#>                series trend_strength seasonal_strength remainder_sd
#> 1 AirPassengers (log)          0.994             0.937       0.0328
#> 2                 co2          1.000             0.984       0.2601
#> 3        DAX (weekly)          0.988             0.007       9.4734
```

**Explanation:** Returning a one-row data frame rather than a named vector is the design decision that makes this scale: `rbind()` stacks the rows, a character label survives alongside the numbers, and swapping `rbind` for `lapply` plus `do.call` handles hundreds of series unchanged. Read `remainder_sd` only within a series, never across, since it carries the units of its own input: 0.0328 is a log ratio, 0.2601 is ppm and 9.4734 is index points. The strength columns are the comparable ones, and they route each series to a different treatment: seasonal models for the first two, none for the third.

</details>

## What to do next

Work through these related practice sets and tutorials:

- [Time Series Decomposition in R: STL vs Classical](Time-Series-Decomposition-in-R.html) is the tutorial these problems are built on, if you want the walkthrough before the drills.
- [Time Series in R Exercises](Time-Series-in-R-Exercises.html) covers the wider forecasting workflow: `ts` objects, stationarity, ACF, ARIMA and backtesting.
- [Time Series Exercises in R](Time-Series-Exercises-in-R.html) is a second problem set with a different mix of series and methods.
- [Visualize Time Series in R](Visualize-Time-Series-in-R.html) covers the plots that make seasonality and trend visible before you model anything.
