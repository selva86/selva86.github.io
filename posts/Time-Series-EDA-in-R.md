---
title: "Time Series EDA in R: Trend, Seasonality, Autocorrelation"
slug: "Time-Series-EDA-in-R"
description: "Run a six-check EDA pass on any R time series: catch a broken index, decide additive vs multiplicative, decompose it, then read the leftover autocorrelation."
keywords: "time series EDA in R, exploratory data analysis time series R, trend and seasonality R, autocorrelation R, stl decomposition R, additive vs multiplicative, seasonal strength R, Ljung-Box test R"
auto_link_terms: "time series EDA|EDA for time series|exploratory data analysis of a time series|time series diagnostics|diagnosing a time series|additive or multiplicative|multiplicative seasonality|additive seasonality|seasonal strength|trend strength|strength of seasonality|Ljung-Box test|leftover autocorrelation|drifting seasonality"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "FR-foun-1"
post_type: "FR"
fr_parent: "Visualize-Time-Series-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Exploratory analysis of a time series is not a pile of plots. It is an ordered pass of six checks, and it ends in a written verdict that decides what you model and how: is the index trustworthy, is there a trend, do the swings grow with the level, what is the seasonal shape, and is anything left over that a model could still use. This post runs that whole pass on one real series, in order, and shows you what each check answers and where each one will lie to you.</p>

Ordinary EDA on a `data.frame` is a scatter of habits: a `summary()`, some histograms, a correlation matrix. Time series EDA is different because the observations are not interchangeable. The order carries the information, so the questions come in a fixed order too, and each answer changes what the next question means. Decide the transform before you decompose, or the decomposition is answering the wrong question.

Our one series for the whole post is `JohnsonJohnson`, which ships with R in the `datasets` package: **quarterly Johnson & Johnson earnings per share, in US dollars, from 1960 Q1 to 1980 Q4.** That is 84 numbers, starting at $0.71 a share and ending at $16.20. It is small enough to print and real enough to surprise us, which it will, twice.

## What does an EDA pass tell you about a series you've never seen?

Here is the whole pass, as one function, before any explanation. Read it as six questions asked in order. Each row of the answer is one check, and the six rows together are the verdict.

```r title="The six-check pass, end to end"
jj <- JohnsonJohnson   # quarterly J&J earnings per share, US dollars, 1960-1980

eda_report <- function(x) {
  period <- frequency(x)
  year   <- floor(time(x))
  level  <- tapply(as.numeric(x), year, mean)   # how big is the series each year?
  swing  <- tapply(as.numeric(x), year, sd)     # how wide is its wobble each year?
  tracks <- summary(lm(swing ~ level))$r.squared

  parts     <- stl(log(x), s.window = "periodic")$time.series
  remainder <- parts[, "remainder"]
  strength  <- function(part) round(max(0, 1 - var(remainder) / var(part + remainder)), 2)
  leftover  <- Box.test(remainder, lag = 2 * period, type = "Ljung-Box")$p.value

  data.frame(
    check   = c("1 index", "2 trend", "3 multiplicative", "4 season", "5 remainder", "6 leftover"),
    finding = c(
      sprintf("%d obs, %d per year, %d-%d, %d missing",
              length(x), period, min(year), max(year), sum(is.na(x))),
      sprintf("strength %.2f, level %.2f -> %.2f", strength(parts[, "trend"]),
              level[1], level[length(level)]),
      sprintf("swing tracks level, R2 = %.2f", tracks),
      sprintf("strength %.2f", strength(parts[, "seasonal"])),
      sprintf("sd = %.3f on the log scale", sd(remainder)),
      sprintf("Ljung-Box p = %.2g", leftover)
    )
  )
}

eda_report(jj)
#>              check                                  finding
#> 1          1 index 84 obs, 4 per year, 1960-1980, 0 missing
#> 2          2 trend       strength 0.99, level 0.66 -> 14.62
#> 3 3 multiplicative            swing tracks level, R2 = 0.88
#> 4         4 season                            strength 0.61
#> 5      5 remainder              sd = 0.077 on the log scale
#> 6       6 leftover                    Ljung-Box p = 3.9e-14
```

Six lines, and you already know more about this series than a `summary()` would ever tell you. Read them in order.

**Row 1** says the index is sane: 84 observations, 4 per year (so the seasonal period is a quarter), spanning 1960 to 1980, with nothing missing. **Row 2** says there is a trend and it is overwhelming: the yearly average earnings went from $0.66 a share to $14.62, a 22-fold rise, and the trend accounts for essentially all of the series' movement (strength 0.99, on a 0-to-1 scale defined later). **Row 3** says the size of the quarterly wobble is strongly predicted by how big the series is that year (an R-squared of 0.88), which is the signature of *multiplicative* seasonality and the reason the function took `log(x)` before decomposing. **Row 4** says a real quarterly season exists but is much weaker than the trend (0.61). **Row 5** says that once trend and season are removed, what is left has a standard deviation of 0.077 on the log scale, which is roughly plus or minus 7.7% around the fitted value.

**Row 6 is the one that should bother you.** The Ljung-Box p-value is 0.000000000000039. That test asks "is what is left over indistinguishable from random noise?", and a p-value that small is a flat no. Something structured is still sitting in the remainder. A good EDA pass is not one that comes back clean, it is one that tells you exactly where to look next. Check 6 is where we find out what that leftover is, and the answer turns out to be a real property of J&J's business.

That is the pass. Here is its map, which is worth keeping in view, because the arrows that go *backwards* are the whole reason the order matters.

![Flowchart of the six-check time series EDA pass, from a new series through index, time plot, shape, decompose, season and remainder checks to a verdict](screenshots/Time-Series-EDA-in-R-workflow.webp)
*Figure 1: The six-check pass. The solid path is the happy case. The two dashed arrows are the ones that make this a pass and not a checklist: a broken index sends you back to the data, and a season that leaks into the remainder sends you back to the decomposition.*

Now we walk the six checks one at a time, on the same series.

## Check 1: is the time index actually right?

Before you plot anything, ask whether the *index* is real. This is the check people skip, because it feels like paperwork, and it is the one that silently ruins everything downstream. A series whose `frequency` is wrong will decompose into nonsense, and the decomposition will not complain: it will hand you a confident, meaningless seasonal component.

Three things go wrong in practice. Let us build a series where all three have gone wrong, in view, then catch them. We take our real series and damage it deliberately.

```r title="A series as it might arrive from a messy export"
jj_messy <- jj
jj_messy[30] <- NA                     # one quarter failed to import
jj_messy[55] <- jj_messy[55] * 10      # one decimal point in the wrong place

frequency(jj_messy)     # how many observations make up one year?
#> [1] 4
sum(is.na(jj_messy))    # any holes?
#> [1] 1
which(is.na(jj_messy))  # where?
#> [1] 30
```

`frequency()` returns the seasonal period: the number of observations that make up one full seasonal cycle. It is 4 here, meaning quarterly data, so R knows that observation 5 is the same quarter as observation 1. This number is not inferred from the data, it is a label you (or whoever built the object) attached to it, and if it is wrong nothing later can detect that. A monthly series read in with `frequency = 4` will happily produce a "quarterly season" that does not exist. `sum(is.na())` found the one hole we punched, and `which()` located it at observation 30. Worth knowing now: `stl()` refuses to run on a series with an `NA` in it, so a hole you did not know about becomes a confusing error message twenty minutes later.

The typo is harder, because $1.65 mistyped as $16.50 is not missing and not obviously impossible. It is just wrong. You cannot catch it with a plain z-score across the whole series either, because this series *grows 22-fold*: the standard deviation of the raw values is dominated by the trend, so a big value near the end is completely normal. The trick is to look at *growth* instead of level. Quarter-on-quarter growth has no trend in it, so an outlier stands out.

```r title="Catch the typo by scoring growth, not level"
growth <- diff(log(jj_messy))     # quarter-on-quarter growth, on the log scale
spread <- abs(growth - median(growth, na.rm = TRUE)) / mad(growth, na.rm = TRUE)

which(spread > 5)                 # which growth steps are wildly unusual?
#> [1] 54 55
round(as.numeric(spread)[53:56], 1)
#> [1]  0.1 11.6 12.8  0.3
time(jj_messy)[55]                # what date is the culprit?
#> [1] 1973.5
```

Walk through that. `diff(log(x))` gives the log growth from each quarter to the next, so a 10-fold jump becomes a large positive number and the trend cancels out. `median()` and `mad()` (median absolute deviation) are the robust cousins of `mean()` and `sd()`: they describe the typical growth without being dragged around by the very outlier we are hunting. Dividing the distance-from-median by the `mad` gives each growth step a robust score, in units of "typical deviations". Anything past 5 is a flag.

Two flags, at growth steps 54 and 55. That pairing is the tell: one bad observation creates **two** bad growth steps, and here is how to turn the pair back into the culprit. Growth step *k* is the move from observation *k* to observation *k+1*, so step 54 is the jump *up* into observation 55 (score 11.6) and step 55 is the jump back *down* out of observation 55 (score 12.8). The one observation both steps touch is number 55, and that is your suspect: two adjacent flags at *k* and *k+1* always accuse observation *k+1*. `time()` confirms it sits at 1973.5, meaning 1973 Q3. That is our planted typo. Real imports produce exactly this pattern, and once you have seen the paired-flag signature you never misread it as two separate problems.

> **Watch out:** a `frequency` that is wrong is undetectable from the data alone. If a series arrives from someone else, verify the period against what you know about the world (12 for monthly, 4 for quarterly, 52 for weekly, 7 for daily-with-a-weekly-cycle) rather than trusting the object. If you are unsure how the four R time series classes store this, [Time Series Objects in R](Time-Series-Objects-in-R.html) walks through where each one keeps the index.

We now drop `jj_messy` and go back to the real, clean series for the rest of the pass.

## Check 2: what does the time plot say?

With a trustworthy index, plot the thing. This is the highest-information-per-second act in all of time series analysis, and it takes one line.

```r title="The plot you always draw first"
plot(jj, main = "J&J quarterly earnings per share, 1960-1980",
     ylab = "US dollars per share", xlab = "year")

round(aggregate(jj, FUN = mean), 2)   # collapse each year to its mean
#> Time Series:
#> Start = 1960 
#> End = 1980 
#> Frequency = 1 
#>  [1]  0.66  0.69  0.75  0.85  1.04  1.29  1.52  1.70  2.05  2.39  3.38  4.07  4.84  5.83  6.30  7.16
#> [17]  7.94  9.52 11.25 12.96 14.62
```

The plot shows a line that climbs from under a dollar to sixteen dollars, with a visible sawtooth riding on top of it, and the teeth of the saw get bigger as the line gets higher. `aggregate(jj, FUN = mean)` collapses each year of four quarters into a single yearly mean, which is the numeric version of the same story: 0.66, 0.69, 0.75 in the early sixties, then 3.38 by 1970, then 14.62 by 1980. That is what "trend" means here, and having the numbers matters, because the eye is bad at telling a straight climb from an accelerating one.

Look at the ratios rather than the differences. From 1960 to 1970 the level went from 0.66 to 3.38, roughly 5-fold. From 1970 to 1980 it went from 3.38 to 14.62, roughly 4-fold. The *differences* over those two decades are wildly different ($2.72 vs $11.24), but the *ratios* are similar. A series that grows by a roughly constant percentage rather than a roughly constant amount is growing exponentially, and that is the first hint of what Check 3 is about to confirm.

Four things are worth naming, because they are what your eye should be hunting for on any time plot:

- **Trend**: a slow movement in the level that does not repeat. Here it dominates.
- **Season**: a pattern that repeats on a *fixed, known* period. Here it is the sawtooth, repeating every 4 quarters.
- **Level shift**: a sudden step to a new level that stays. There is none here.
- **Outlier**: a single value off on its own. There is none here, because we cleaned it in Check 1.

> **Note:** "season" means a cycle with a *fixed, known* period, tied to the calendar. A business cycle that runs "about every 7 to 10 years" is not a season, it is a cycle, and no seasonal method will catch it. The distinction matters because everything in Checks 4 and 5 depends on knowing the period in advance. For the full catalogue of plots that make each of these features pop, see [Visualize Time Series in R](Visualize-Time-Series-in-R.html).

## Check 3: is the seasonality additive or multiplicative?

The sawtooth teeth got bigger as the line got higher. That observation is the whole of Check 3, and it decides the transform, which decides everything after it. There are two models a decomposition can assume. In the **additive** model, the three parts are added:

\[ y_t = T_t + S_t + R_t \]

and in the **multiplicative** model they are multiplied:

\[ y_t = T_t \times S_t \times R_t \]

where \(y_t\) is the observed value at time \(t\), \(T_t\) is the trend (the slow level), \(S_t\) is the season (the fixed-period repeat), and \(R_t\) is the remainder, meaning everything the first two do not explain. The difference is not cosmetic. Under the additive model, a season worth \(+\$0.30\) adds thirty cents in 1960 and thirty cents in 1980. Under the multiplicative model, a season worth \(\times 1.10\) adds ten cents when the level is a dollar and a dollar-fifty when the level is fifteen. Real growth series are almost always the second kind, and J&J is a growth series.

Here is the useful part: taking logs turns one into the other, because the logarithm of a product is the sum of the logarithms.

\[ \log y_t = \log T_t + \log S_t + \log R_t \]

So a multiplicative series *is* an additive series, once you look at it on the log scale. Every additive tool then works, and you convert back at the end.

Do not decide this by eyeballing. Make it a number. If the seasonality is multiplicative, the size of each year's wobble should be predicted by that year's level. So measure both once per year, then regress one on the other.

Two small tools do the grouping, and they recur for the rest of the post. `time(jj)` gives each observation's date as a decimal year, the same numbers we met in Check 1 (1973.5 meaning 1973 Q3), so `floor(time(jj))` throws the fraction away and leaves the plain year: 1960, 1960, 1960, 1960, 1961, and so on, one label per observation. `tapply(values, group, FUN)` then splits `values` into groups according to `group` and applies `FUN` to each group on its own, returning one number per group. So `tapply(as.numeric(jj), year, mean)` reads as "the mean of each year's four quarters" and gives back 21 numbers, one per year. The `as.numeric()` just strips the time series wrapper so that `tapply` sees a plain vector of values.

```r title="Does the swing size track the level? (raw scale)"
year  <- floor(time(jj))
level <- tapply(as.numeric(jj), year, mean)   # each year's average level
swing <- tapply(as.numeric(jj), year, sd)     # each year's spread across quarters

plot(level, swing, pch = 19, col = "steelblue",
     main = "Raw scale: the wobble grows with the level",
     xlab = "that year's mean ($)", ylab = "that year's SD ($)")
abline(lm(swing ~ level), col = "tomato", lwd = 2)

raw_fit <- lm(swing ~ level)
round(coef(raw_fit)[2], 4)               # dollars of swing per dollar of level
#>  level 
#> 0.1338 
round(summary(raw_fit)$r.squared, 3)     # how much of the swing does level explain?
#> [1] 0.875
```

The points march up and to the right in a tight line. The slope says that for every extra dollar of average earnings, the within-year spread grows by about 13.4 cents, and the R-squared of **0.875** says the year's level alone explains 87.5% of how big that year's wobble is. That is not a subtle tendency. The swing is not a fixed number of dollars, it is a fixed *percentage*, so this series is multiplicative and needs a log.

Now repeat the identical measurement on the logged series. If the log fixed the problem, the relationship should vanish.

```r title="Does the swing size track the level? (log scale)"
log_level <- tapply(as.numeric(log(jj)), year, mean)
log_swing <- tapply(as.numeric(log(jj)), year, sd)

plot(log_level, log_swing, pch = 19, col = "steelblue",
     main = "Log scale: the relationship is gone",
     xlab = "that year's mean log level", ylab = "that year's SD (log scale)")
abline(lm(log_swing ~ log_level), col = "tomato", lwd = 2)

log_fit <- lm(log_swing ~ log_level)
round(coef(log_fit)[2], 4)
#> log_level 
#>   -0.0226 
round(summary(log_fit)$r.squared, 3)
#> [1] 0.185
```

The slope went from +0.1338 to **-0.0226**, which is near zero and, if anything, points very slightly the other way. The R-squared collapsed from **0.875 to 0.185**. On the log scale, how big a year's wobble is tells you almost nothing about how big that year was, which is exactly the property the additive model assumes. The log did its job. Everything from here on works on `log(jj)`.

> **Note:** the log only works if every value is strictly positive, because \(\log 0\) is undefined and the log of a negative number does not exist. Series with zeros or negatives (net profit, temperature in Celsius, anomalies) need a different tool: a Box-Cox transform with a suitable parameter, or `log1p()` for counts that touch zero. If the swing-versus-level plot is flat to begin with, your series is already additive and you should not transform it at all.

## Check 4: what is the series actually made of?

We now know the model (additive, on logs) and can finally split the series into its parts. The tool is `stl()`, which stands for **Seasonal-Trend decomposition using Loess**. Loess is a local smoother: to estimate the trend at 1972, it fits a small regression using mostly the points near 1972 and largely ignores 1961. STL applies that idea repeatedly, peeling the season and the trend apart until they stop changing.

```r title="Split the logged series into trend, season and remainder"
fit_fixed <- stl(log(jj), s.window = "periodic")
parts <- fit_fixed$time.series

plot(fit_fixed, main = "STL decomposition of log(J&J earnings)")

round(head(parts, 4), 3)
#>         seasonal  trend remainder
#> 1960 Q1   -0.003 -0.361     0.022
#> 1960 Q2    0.034 -0.407    -0.088
#> 1960 Q3    0.116 -0.452     0.173
#> 1960 Q4   -0.147 -0.481    -0.193
```

`stl()` returns an object whose `time.series` element is a matrix with one column per part. The four rows printed are 1960's quarters, on the log scale. Add the three numbers in any row and you get back `log(jj)` for that quarter exactly, because that is what an additive decomposition guarantees. Check the first row: -0.003 + -0.361 + 0.022 = -0.342, and `log(0.71)` is -0.342. The decomposition is not an approximation of the series, it is a re-expression of it. The plot stacks the four panels (the data, then the three parts) so you can see each one on its own.

The trend values are negative simply because they are logs of numbers below 1 (earnings were 71 cents in 1960, and `log(0.71)` is negative). Nothing is wrong.

Now, how much does each part actually matter? Compare each one against the noise it sits next to. The **strength of the trend** is defined as

\[ F_T = \max\left(0,\; 1 - \frac{\operatorname{Var}(R_t)}{\operatorname{Var}(T_t + R_t)}\right) \]

and the strength of the season, \(F_S\), is the same formula with \(S_t\) in place of \(T_t\). Read it as a fraction. The denominator is how much the part and the noise wobble together; the numerator is how much the noise wobbles alone. If the part is huge next to the noise, the ratio is near 0 and the strength is near 1. If the part is pure noise, the ratio is near 1 and the strength is near 0. The `max(0, ...)` just stops tiny negative values from a part that explains nothing.

```r title="How strong is each part?"
rem_fixed <- parts[, "remainder"]
strength  <- function(part) round(max(0, 1 - var(rem_fixed) / var(part + rem_fixed)), 3)

c(trend = strength(parts[, "trend"]), season = strength(parts[, "seasonal"]))
#>  trend season 
#>  0.994  0.608 
```

A trend strength of **0.994** is about as strong as this measure gets: essentially all of the non-seasonal movement in J&J's earnings is the long climb, not noise. A seasonal strength of **0.608** is moderate. It is real and worth modelling, but it is not the story. These two numbers are what you would report if someone asked "what kind of series is this?": strongly trending, moderately seasonal. [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) goes deeper on how STL does the peeling, and on the classical alternative.

## Check 4b: is the season really the same every year?

We just used `s.window = "periodic"`, and it is worth knowing what we agreed to. That setting tells STL that **the seasonal pattern is identical in every single year**: whatever Q3 does, it does the same forever. It is the default choice in most tutorials and it is an *assumption*, not a finding. Twenty-one years is a long time for a company's seasonal rhythm to hold perfectly still, so check it.

`s.window` controls how fast the season is allowed to drift. It is the width, in years, of the window used to smooth each quarter's seasonal value across time. A small number lets the season change quickly; a large number holds it nearly fixed; `"periodic"` is the extreme, meaning infinitely rigid. Set it to 9 and the season is estimated from a moving 9-year neighbourhood, so it can drift slowly but cannot jump.

```r title="Let the season drift, then measure how much it did"
fit_flex  <- stl(log(jj), s.window = 9)
seas_flex <- fit_flex$time.series[, "seasonal"]

plot(seas_flex, main = "The seasonal component, allowed to drift",
     ylab = "seasonal effect (log scale)", xlab = "year")

# How wide is the seasonal swing within each year?
round(tapply(as.numeric(seas_flex), floor(time(jj)), function(v) diff(range(v))), 2)
#> 1960 1961 1962 1963 1964 1965 1966 1967 1968 1969 1970 1971 1972 1973 1974 1975 1976 1977 1978 1979 
#> 0.43 0.41 0.40 0.36 0.28 0.21 0.20 0.21 0.19 0.16 0.14 0.16 0.17 0.20 0.22 0.25 0.28 0.30 0.31 0.32 
#> 1980 
#> 0.33 
```

`diff(range(v))` is the distance from the year's lowest seasonal effect to its highest, so it measures how *wide* that year's seasonal swing was. Read the numbers left to right and a real story appears. In 1960 the seasonal swing spanned 0.43 on the log scale, roughly a 54% gap between the best and worst quarter. It then narrowed steadily through the sixties to a minimum of **0.14 in 1970**, a third of what it had been. Then it widened again, reaching 0.33 by 1980, most of the way back to where it started.

That is not noise. The decline is steady (a single 0.01 tick up in 1967 is the only interruption) and the rise after 1970 gets wider in every single year without exception, and it is the second surprise this series had for us. J&J's earnings became markedly less seasonal through the 1960s and then more seasonal again through the 1970s. Whether that reflects the product mix, acquisitions or accounting practice is a question for someone who knows the company. What matters for us is that `s.window = "periodic"` claimed this variation does not exist, and it plainly does.

> **Watch out:** `s.window = "periodic"` is not a neutral default, it is a strong claim that the seasonal pattern never changes. On a series spanning decades that claim is usually false. The cost of being wrong is not a worse-looking plot: the seasonal variation the model refuses to fit does not disappear, it gets dumped into the remainder, where it masquerades as structure. Check 6 catches it.

## Check 5: what is the seasonal shape?

"There is a season, strength 0.61" is not yet useful. The shape is the useful part: **which quarter is high, which is low, and by how much.** A `monthplot()` answers this in one picture. Despite the name, it does not care about months: it groups by whatever the seasonal period is, which here is the quarter.

```r title="The seasonal shape, as a picture and as percentages"
monthplot(seas_flex, main = "Seasonal effect by quarter (each line drifts over 21 years)",
          ylab = "seasonal effect (log scale)", xlab = "quarter")

quarter_effect <- round(tapply(as.numeric(seas_flex), cycle(jj), mean), 4)
quarter_effect                                  # average effect, log scale
#>       1       2       3       4 
#> -0.0035  0.0381  0.1039 -0.1417 
round(100 * (exp(quarter_effect) - 1), 1)       # same thing, as percentages
#>     1     2     3     4 
#>  -0.3   3.9  10.9 -13.2 
```

`monthplot()` draws one vertical group per quarter, so you see all 21 Q1s together, then all 21 Q2s, and so on, with a horizontal bar at each quarter's mean. It is the right plot for this question because it puts like with like: on an ordinary time plot the quarters are interleaved and you cannot see a quarter's own history.

`cycle(jj)` returns which quarter each observation belongs to (1, 2, 3, 4, 1, 2, ...), so `tapply(..., cycle(jj), mean)` averages the seasonal effect within each quarter across all 21 years. The result is on the log scale, which nobody thinks in, so we convert. Because the model is multiplicative, a log effect of \(s\) means a multiplier of \(e^{s}\), and \(100 \times (e^{s} - 1)\) turns that into "percent above or below the trend".

Now the shape is in plain English. **Q3 runs about 10.9% above trend, Q4 about 13.2% below, Q2 is mildly high at +3.9%, and Q1 is essentially neutral at -0.3%.** The gap between the best and worst quarter is about 24 percentage points. In 1980, with earnings around $14.62 a share, that is roughly the difference between a $16 quarter and a $12.70 one. The Q4 dip is the strongest single feature of the season, which is a genuinely useful fact: any model that ignores seasonality will overpredict every Q4 for twenty-one years running.

## Check 6: what is left in the remainder?

The remainder is what trend and season could not explain. If the decomposition captured everything with a pattern, what is left should be noise: unpredictable, with no memory of itself. If instead the remainder still correlates with its own past, there is structure left that a model can exploit, and you want to know that before choosing one.

The tool is the ACF (autocorrelation function). The autocorrelation at lag \(k\) is the correlation between the series and a copy of itself shifted \(k\) steps back:

\[ r_k = \frac{\sum_{t=k+1}^{n} (x_t - \bar{x})(x_{t-k} - \bar{x})}{\sum_{t=1}^{n} (x_t - \bar{x})^2} \]

where \(x_t\) is the value at time \(t\), \(\bar{x}\) is the mean of the series, \(n\) is its length, and \(k\) is the lag. An \(r_k\) near zero means "knowing the value 4 quarters ago tells you nothing about today". Anything else means it does.

Recall the two decompositions we now have: `fit_fixed`, which forced an identical season every year, and `fit_flex`, which let it drift. Compare their remainders at lag 1 and at lag 4, the seasonal lag.

```r title="The rigid fit versus the flexible fit, judged by their leftovers"
rem_flex <- fit_flex$time.series[, "remainder"]

par(mfrow = c(1, 2))
acf(rem_fixed, lag.max = 12, main = "Remainder: s.window = periodic")
acf(rem_flex,  lag.max = 12, main = "Remainder: s.window = 9")
par(mfrow = c(1, 1))

# autocorrelation at lag 1 and lag 4 (the seasonal lag)
round(as.numeric(acf(rem_fixed, lag.max = 8, plot = FALSE)$acf)[c(2, 5)], 3)
#> [1] -0.459  0.605
round(as.numeric(acf(rem_flex,  lag.max = 8, plot = FALSE)$acf)[c(2, 5)], 3)
#> [1] -0.351  0.006
```

Two mechanics before the finding. `par(mfrow = c(1, 2))` splits the drawing area into one row of two panels so the ACFs sit side by side for comparison, and the second `par()` call puts it back to one plot per figure. And `acf(...)$acf` starts at **lag 0**, not lag 1, whose autocorrelation is always exactly 1 because a series is perfectly correlated with an unshifted copy of itself. So element 2 is lag 1 and element 5 is lag 4, which is why the code asks for `[c(2, 5)]`. Passing `plot = FALSE` hands back the numbers instead of drawing the picture.

There is the answer to the mystery from the opening report. The rigid fit's remainder has an autocorrelation of **0.605 at lag 4**, which is enormous. Lag 4 is exactly one year on quarterly data, so that number says: *whatever this remainder did last Q3, it does again this Q3.* That is a seasonal pattern, sitting in the component that is supposed to hold no pattern at all. It is precisely the drifting seasonality we measured in Check 4b, refusing to vanish just because `s.window = "periodic"` declined to model it.

Let the season drift and the leak stops: the flexible fit's lag-4 autocorrelation is **0.006**, which is zero for practical purposes. The seasonal structure moved out of the remainder and into the seasonal component, where it belongs. This is the dashed feedback arrow in Figure 1, and it is why Check 6 sits after Check 4 rather than at the end of a checklist.

Note what did *not* go away: the lag-1 autocorrelation of **-0.351**. That one is real, and it is not a decomposition artefact. A negative lag-1 correlation means an above-average quarter tends to be followed by a below-average one, a bounce. Let us test formally whether the remainder is noise. The Ljung-Box test asks one question about a whole *group* of lags at once, rather than running a separate eyeball test at each lag and collecting false alarms.

```r title="Is the remainder noise? Ask all 8 lags at once"
Box.test(rem_flex, lag = 8, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  rem_flex
#> X-squared = 23.081, df = 8, p-value = 0.003262
```

The null hypothesis is "the first 8 autocorrelations are all zero", meaning the remainder is noise. The p-value of **0.0033** rejects it: the remainder is not noise, even after we fixed the seasonal leak. It went from 3.9e-14 (catastrophic) to 0.0033 (real but modest), and the residual signal is that lag-1 bounce.

This is a good finding, not a failure. It says a model has something left to work with. The remainder is not white noise, so an ARIMA term can earn its keep on this series after the trend and season are handled. For how to read the ACF alongside the PACF to turn that into an actual order, see [ACF and PACF in R](ACF-and-PACF-in-R.html).

## How do six checks become one verdict?

The point of the pass is a verdict, so write it down. One more number is needed first: how much differencing does the series need to be stationary (roughly, to have a stable mean and variance)? `ndiffs()` and `nsdiffs()` from the `forecast` package answer that by running the standard tests for you.

```r title="How much differencing does it need?"
library(forecast)

ndiffs(log(jj))    # ordinary differences needed
#> [1] 1
nsdiffs(log(jj))   # seasonal differences needed
#> [1] 1
```

One ordinary difference and one seasonal difference. Ordinary differencing (subtracting the previous quarter) removes the trend; seasonal differencing (subtracting the same quarter last year) removes the season. Both are needed here, which is exactly what you would expect from a series that Check 4 called strongly trending and moderately seasonal. The mechanics of these tests are in [Test Stationarity in R](Test-Stationarity-in-R.html).

Now the verdict, six checks in six lines:

| Check | Finding | What it forces |
|---|---|---|
| 1 Index | 84 quarters, 1960-1980, period 4, no gaps or outliers | Safe to proceed |
| 2 Time plot | Level climbs 22-fold; sawtooth grows with it | Expect a transform |
| 3 Shape | Swing tracks level, R2 0.875 raw vs 0.185 logged | **Model `log(jj)`, not `jj`** |
| 4 Decompose | Trend strength 0.994, season 0.608 | Trend dominates; season is real |
| 4b Drift | Seasonal width 0.43 -> 0.14 -> 0.33 | **Use `s.window = 9`, not `"periodic"`** |
| 5 Season | Q3 +10.9%, Q4 -13.2%, spread ~24pp | Any model must be seasonal |
| 6 Remainder | Lag-4 leak fixed; lag-1 -0.351, Ljung-Box p = 0.0033 | Structure remains; ARIMA has work to do |

In one paragraph: *J&J quarterly earnings, 1960-1980, is a strongly trending, moderately seasonal, multiplicative series with no data-quality problems and a seasonal pattern that narrows through the sixties and re-widens through the seventies. Model it on the log scale. It needs one ordinary and one seasonal difference. Q4 runs 13% below trend and any non-seasonal model will overpredict it every year. After trend and season are removed a lag-1 bounce of -0.35 remains, so a seasonal ARIMA on the logs is the natural first candidate, and a non-seasonal model on the raw scale is ruled out twice over.*

That paragraph is the deliverable. Notice that two of the six checks *overturned a default*: Check 3 vetoed modelling the raw series, and Check 4b vetoed the standard `"periodic"` decomposition. Skip the pass and you would have made both mistakes silently, and neither would have announced itself.

## Where does time series EDA mislead you?

Each check has a failure mode. These are the four that catch people.

**1. The ACF of a trending series tells you nothing except that it trends.** Run an ACF on a series before removing the trend and you get a wall of huge, slowly decaying bars. It looks like profound memory. It is not.

```r title="The trend trap: a meaningless ACF that looks meaningful"
round(as.numeric(acf(jj, lag.max = 6, plot = FALSE)$acf)[2:7], 3)
#> [1] 0.925 0.888 0.833 0.824 0.764 0.718
round(2 / sqrt(length(jj)), 3)   # the significance band
#> [1] 0.218
```

Every bar from lag 1 to lag 6 sits between 0.72 and 0.93, and the band is only 0.218, so all of them are "significant" by a mile. This says nothing about J&J's business. It is a mechanical consequence of the fact that a series which climbs steadily is always near where it was recently. Any trending series produces this picture. Run the ACF on the *remainder*, as Check 6 does, or on the differenced series, never on the raw trending one.

**2. Short series cannot see anything.** The significance band is roughly \(\pm 2/\sqrt{n}\), so it shrinks slowly.

```r title="Why a short series is nearly blind"
round(2 / sqrt(c(20, 84, 400)), 3)
#> [1] 0.447 0.218 0.100
```

With 20 observations the band is **plus or minus 0.447**. An autocorrelation of 0.4, which is a strong real relationship, would not clear it. With our 84 it is 0.218, and at 400 it is 0.100. "Not significant" on a short series does not mean "not there", it means "this data cannot tell". Our lag-1 finding of -0.351 clears the 0.218 band at n = 84; on 20 quarters the identical fact would have been invisible.

**3. One outlier can fake or hide any of this.** A single bad value inflates the variance, which drags down every strength measure, and can flip a swing-versus-level slope on its own. This is why Check 1 comes first rather than whenever you get around to it.

**4. A strength number is not a significance test.** A seasonal strength of 0.608 says the season is large relative to the remainder in *this* series. It carries no p-value and no confidence interval, and comparing 0.608 against another series' 0.55 is not a hypothesis test. Treat strengths as descriptions, not evidence.

## FAQ

**How is EDA for a time series different from EDA for a normal data frame?**
The order of the rows is the data. Shuffle a `data.frame` and every histogram, mean and correlation survives; shuffle a time series and you have destroyed everything worth knowing. So the usual tools (`summary()`, histograms, a correlation matrix) all silently throw away the one dimension that matters. Time series EDA replaces them with tools that read the ordering: the time plot, the seasonal plot, decomposition and the ACF.

**Do I have to do the checks in this order?**
Checks 1 and 3 must come where they are. Check 1 is first because an outlier or a wrong period corrupts every number after it. Check 3 must precede Check 4 because the transform decides what the decomposition is decomposing; decompose first and you have answered the wrong question and will not notice. Checks 5 and 6 can swap freely. Check 2 could in principle move, but you would be giving up your cheapest look at the data.

**How do I know whether to log the series or not?**
Run the Check 3 measurement rather than eyeballing it. Regress each year's standard deviation on that year's mean. A clear positive slope with a high R-squared (0.875 here) means multiplicative, so log it; a flat scatter means additive, so leave it alone. Then repeat on the logged series and confirm the relationship is gone (R-squared fell to 0.185 here). If your series has zeros or negative values a log is impossible, and you need a Box-Cox transform instead.

**What is a good value for `s.window`?**
There is no universal answer, which is the honest reason to check rather than default. `"periodic"` asserts the season never changes; a number, in years, is how long a window is used to let it drift. Start with `"periodic"`, then look at the remainder's ACF at the seasonal lag (4 for quarterly, 12 for monthly). If that bar is large, as our 0.605 was, the season is drifting and the window is too rigid. Loosen it until the seasonal lag is quiet, as our 0.006 was, and no further; an over-loose window lets the season absorb noise and steal real signal from the remainder.

**My Ljung-Box p-value is tiny. Is that bad?**
No, and it is often good news at the EDA stage. A tiny p-value on a *remainder* means predictable structure is still there, which is what a model is for. It is only bad news when you run it on a fitted model's **residuals**, where leftover structure means the model missed something. During EDA it is a to-do item; after fitting it is a defect.

**Can I run this pass with tidyverts (tsibble, feasts, fable) instead of base R?**
Yes, and the checks are identical. `feasts::features(x, feat_stl)` returns the trend and seasonal strengths computed with the same formula used here, `gg_season()` and `gg_subseries()` replace `monthplot()`, and `model(STL(...))` replaces `stl()`. The base R version is used here because it needs no installs and the objects print small enough to read. The six questions do not change with the dialect.

## Summary

| Check | Question | Tool | Our answer |
|---|---|---|---|
| 1 Index | Is the index trustworthy? | `frequency()`, `is.na()`, robust growth score | Clean: 84 obs, period 4, no gaps |
| 2 Time plot | What is visibly there? | `plot()`, `aggregate()` | Trend dominates; season rides on it |
| 3 Shape | Additive or multiplicative? | SD-vs-mean regression by year | Multiplicative (R2 0.875 -> 0.185 logged) |
| 4 Decompose | What is it made of? | `stl()` + strengths | Trend 0.994, season 0.608 |
| 4b Drift | Is the season fixed? | seasonal width by year | No: 0.43 -> 0.14 -> 0.33, use `s.window = 9` |
| 5 Season | What is the shape? | `monthplot()`, `cycle()` | Q3 +10.9%, Q4 -13.2% |
| 6 Remainder | Is anything left? | `acf()`, `Box.test()` | Lag-1 -0.351, p = 0.0033: yes |

The three habits worth keeping from this post:

- **Check the index before you look at a single plot.** A wrong `frequency` and an unspotted outlier both produce confident, wrong answers with no error message.
- **Decide additive versus multiplicative with a number, not an eyeball.** It determines the transform, and the transform determines every result after it.
- **Judge a decomposition by its remainder.** A big autocorrelation at the seasonal lag means the season leaked, and the fix is to loosen `s.window`, not to accept it.

The pass ends where modelling begins. You now have the transform, the differencing orders, the seasonal shape and an honest statement of what structure remains: everything a model choice needs.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., ch. 2 "Time series graphics". [otexts.com/fpp3/graphics.html](https://otexts.com/fpp3/graphics.html). The canonical treatment of what to look for on a time plot, and free.
2. Hyndman & Athanasopoulos, ch. 3.1 "Transformations and adjustments". [otexts.com/fpp3/transformations.html](https://otexts.com/fpp3/transformations.html). Why and when to log, plus the Box-Cox alternative for series with zeros.
3. Hyndman & Athanasopoulos, ch. 3.6 "STL decomposition". [otexts.com/fpp3/stl.html](https://otexts.com/fpp3/stl.html). The clearest short explanation of what `s.window` actually controls.
4. Hyndman & Athanasopoulos, ch. 4.3 "STL features". [otexts.com/fpp3/stlfeatures.html](https://otexts.com/fpp3/stlfeatures.html). The source of the trend and seasonal strength formulas used in Check 4.
5. Cleveland, R. B., Cleveland, W. S., McRae, J. E. & Terpenning, I. "STL: A Seasonal-Trend Decomposition Procedure Based on Loess." *Journal of Official Statistics* 6(1), 1990. [scb.se](https://www.scb.se/contentassets/ca21efb41fee47d293bbee5bf7be7fb3/stl-a-seasonal-trend-decomposition-procedure-based-on-loess.pdf). The original paper, readable, and the definitive word on the seasonal window.
6. R Core Team. `stl()` reference manual. [stat.ethz.ch](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/stl.html). Every argument, including the robustness options for series with outliers.
7. R Core Team. `Box.test()` reference manual. [stat.ethz.ch](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/box.test.html). Note the `fitdf` argument, which you need when testing model residuals rather than a remainder.
8. Hyndman, R. J. `ndiffs()` and `nsdiffs()` reference. [pkg.robjhyndman.com](https://pkg.robjhyndman.com/forecast/reference/ndiffs.html). Which stationarity test each one runs by default, and how to change it.
9. R Core Team. `JohnsonJohnson` dataset documentation. [stat.ethz.ch](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/JohnsonJohnson.html). The provenance of the series used throughout this post.

## Continue Learning

- [Visualize Time Series in R](Visualize-Time-Series-in-R.html), the full catalogue of plots behind Checks 2 and 5, including seasonal and lag plots this post did not use.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html), a deeper look at Check 4: how STL peels the parts apart and how classical decomposition differs.
- [ACF and PACF in R](ACF-and-PACF-in-R.html), the next step after Check 6: turning leftover autocorrelation into an ARIMA order.
- [Test Stationarity in R](Test-Stationarity-in-R.html), the tests behind `ndiffs()` and `nsdiffs()`, and what differencing actually does.
