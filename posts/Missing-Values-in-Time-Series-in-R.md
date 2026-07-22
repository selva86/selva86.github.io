---
title: "Missing Values in Time Series: Imputation That Keeps the Season"
slug: "Missing-Values-in-Time-Series-in-R"
description: "Fill gaps in an R time series without wrecking its autocorrelation. Profile the gaps, compare locf, spline, na.interp and Kalman, and score them honestly."
keywords: "missing values in time series R, time series imputation R, na.interp, zoo na.approx, na.locf R, Kalman imputation R, imputeTS, fill_gaps tsibble, seasonal imputation R"
mathjax: false
webr: true
date: "2026-07-22"
curriculum_id: "TS2-1.6"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Missing Values in Time Series"
sidebar_order: "50"
auto_link_terms: "missing values in time series|time series imputation|impute missing time series values|na.interp()|na.approx()|na.locf()|na.spline()|fill_gaps()|count_gaps()|Kalman smoothing imputation|seasonal imputation|imputation leakage|gap length distribution"
auto_link_case_sensitive: false
difficulty: "Intermediate"
---

<p class="lead">Imputing a time series means filling its gaps with values that preserve how each observation relates to its own past. That relationship, called autocorrelation, is what every forecasting method actually reads. Fill the holes carelessly and you do not just get a few wrong numbers, you hand the next model a series whose memory has been rewritten.</p>

## What breaks when you fill a time series with the mean?

The habit is almost automatic. There are `NA` values in the column, so you reach for `mean(x, na.rm = TRUE)` and paint it over every hole. In a spreadsheet of customer ages that is defensible. In a time series it quietly destroys the thing you are about to model.

To see the damage we need a series whose true values we already know, so we can compare. R ships with `nottem`, twenty years of monthly average air temperature at Nottingham Castle, with no missing values at all. We will knock holes in it ourselves: a twelve-month logger outage, plus twenty-four scattered dropouts.

Two numbers tell the story. The standard deviation says how much the series moves. The autocorrelation at lag 12 says how strongly each month resembles the same month a year earlier, which for monthly temperature should be very strong indeed. One detail about reading it off: `acf()` returns the whole run of autocorrelations starting at lag 0, so the lag-12 value sits in position 13 of `$acf`.

```r title="Punch holes and fill them with the mean"
temps <- as.numeric(nottem)

set.seed(2026)
gapped <- temps
gapped[121:132] <- NA                               # a 12-month logger outage
gapped[sample(setdiff(1:240, 121:132), 24)] <- NA   # 24 scattered dropouts

# The laziest possible repair.
mean_filled <- gapped
mean_filled[is.na(mean_filled)] <- mean(gapped, na.rm = TRUE)

c(missing = sum(is.na(gapped)), total = length(gapped))
#> missing   total
#>      36     240

round(c(sd_true = sd(temps), sd_meanfill = sd(mean_filled)), 2)
#>     sd_true sd_meanfill
#>        8.57        7.77

round(c(acf12_true     = acf(temps,       lag.max = 12, plot = FALSE)$acf[13],
        acf12_meanfill = acf(mean_filled, lag.max = 12, plot = FALSE)$acf[13]), 3)
#>     acf12_true acf12_meanfill
#>          0.884          0.729
```

Fifteen percent of the values are gone and we replaced them with a constant. The standard deviation dropped from 8.57 to 7.77, because a constant contributes no variation. More seriously, the year-over-year autocorrelation fell from 0.884 to 0.729. The series still looks like temperature data, but its seasonal memory has been visibly weakened, and every seasonal model you fit next will inherit that weakening.

Look at what the mean actually put into the outage year to see why.

```r title="What the mean fill wrote into the outage"
data.frame(
  month     = month.abb,
  truth     = temps[121:132],
  mean_fill = round(mean_filled[121:132], 2)
)
#>    month truth mean_fill
#> 1    Jan  41.6     49.02
#> 2    Feb  37.1     49.02
#> 3    Mar  41.2     49.02
#> 4    Apr  46.9     49.02
#> 5    May  51.2     49.02
#> 6    Jun  60.4     49.02
#> 7    Jul  60.1     49.02
#> 8    Aug  61.6     49.02
#> 9    Sep  57.0     49.02
#> 10   Oct  50.9     49.02
#> 11   Nov  43.0     49.02
#> 12   Dec  38.8     49.02
```

The real January was 41.6 and the real August was 61.6, a swing of twenty degrees. The mean fill claims both months were 49.02. It has asserted that this particular year had no summer and no winter. Averaged over the whole series that value is perfectly reasonable, which is exactly what makes the error so easy to miss: nothing looks obviously wrong until you check the seasonal structure.

[KEY INSIGHT]
**A time series carries its information in the ordering, not in the individual values.** Mean imputation is a fine estimate of a typical value and a terrible estimate of a value at a particular time, so it preserves the average while flattening the pattern that models actually learn from.

**Try it:** Autocorrelation at lag 1 measures how much each month resembles the month directly before it. Compute it for `temps` and for `mean_filled` and see whether mean filling hurt the short-range memory too.

```r title="Your turn: compare the lag-1 autocorrelation"
# Hint: acf(x, lag.max = 1, plot = FALSE)$acf[2] pulls out the lag-1 value.

ex_acf1 <- function(x) {
  # your code here
}

# Test:
# round(c(true = ex_acf1(temps), mean_fill = ex_acf1(mean_filled)), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lag-1 autocorrelation solution"
ex_acf1 <- function(x) acf(x, lag.max = 1, plot = FALSE)$acf[2]

round(c(true = ex_acf1(temps), mean_fill = ex_acf1(mean_filled)), 3)
#>      true mean_fill
#>     0.808     0.692
```

**Explanation:** `acf()` returns lag 0 in position 1, so the lag-1 value sits in position 2. Short-range memory took the same kind of hit as the seasonal memory, falling from 0.808 to 0.692. Every imputed point sits at the series average, so it neither follows the point before it nor leads the point after it.

</details>

## Where are your gaps, and are they even visible?

Before choosing a repair you need to know exactly what you are repairing. That means three questions in order: are all the gaps visible at all, how long are they, and is there a pattern in where they fall.

Start with visibility, because this is where most real projects go wrong. A time series can be missing data in two completely different ways. Either the row is present and the value is `NA`, or the row is simply not there. Only the first kind is visible to `is.na()`.

Here are six daily water-level readings from a logger. Count the missing values.

```r title="Six readings with no NA values"
library(dplyr)

readings <- tibble(
  date  = as.Date(c("2024-03-01", "2024-03-02", "2024-03-05",
                    "2024-03-06", "2024-03-09", "2024-03-10")),
  level = c(4.1, 4.3, 5.2, 5.0, 6.1, 6.4)
)

c(rows = nrow(readings), na_values = sum(is.na(readings$level)))
#>      rows na_values
#>         6         0
```

Zero missing values, says R. Now read the dates. The 3rd, 4th, 7th and 8th of March never appear. Four days of data are gone, and the standard check reports a clean dataset, because you cannot have an `NA` in a row that does not exist.

A `tsibble` catches this, because a tsibble knows what the spacing of its index is supposed to be and can therefore tell you where the index skips.

```r title="Find the gaps a tsibble can see"
library(tsibble)

levels_ts <- as_tsibble(readings, index = date)

has_gaps(levels_ts)
#> # A tibble: 1 × 1
#>   .gaps
#>   <lgl>
#> 1 TRUE

count_gaps(levels_ts)
#> # A tibble: 2 × 3
#>   .from      .to           .n
#>   <date>     <date>     <int>
#> 1 2024-03-03 2024-03-04     2
#> 2 2024-03-07 2024-03-08     2
```

`has_gaps()` gives the yes or no answer, and `count_gaps()` gives the detail: two gaps, two days each, with exact start and end dates. There is also `scan_gaps()`, which returns one row per absent timestamp rather than one row per run.

Knowing about the gaps is not enough, because no imputation function can fill a row that is not there. `fill_gaps()` inserts the missing rows and puts `NA` in the value column, which converts an invisible problem into a visible one.

```r title="Turn implicit gaps into explicit NA values"
levels_full <- fill_gaps(levels_ts)
levels_full
#> # A tsibble: 10 x 2 [1D]
#>    date       level
#>    <date>     <dbl>
#>  1 2024-03-01   4.1
#>  2 2024-03-02   4.3
#>  3 2024-03-03  NA
#>  4 2024-03-04  NA
#>  5 2024-03-05   5.2
#>  6 2024-03-06   5
#>  7 2024-03-07  NA
#>  8 2024-03-08  NA
#>  9 2024-03-09   6.1
#> 10 2024-03-10   6.4

sum(is.na(levels_full$level))
#> [1] 4
```

Six rows became ten, and the four hidden absences are now four honest `NA` values that every function in the rest of this tutorial can act on.

![Diagram showing that an absent row and an NA value are both missing data but only one is visible to is.na()](screenshots/Missing-Values-in-Time-Series-in-R-two-kinds-of-missing.webp)

*Figure 1: An absent row and an NA are both missing data, but only one of them is visible to is.na().*

[WARNING]
**Never build a ts() object straight from data with skipped timestamps.** The `ts()` function just numbers the values one after another, so ten calendar days collapse into six evenly spaced periods and every date after the first gap is silently shifted. Regularise the index first, then convert. The [tsibble tutorial](tsibble-in-R.html) covers index handling in more depth.

With every gap now visible, the second question is how long the gaps are. A dozen scattered single-month dropouts and one twelve-month outage need completely different treatment, even though `sum(is.na(x))` reports the same total for both. `rle()` compresses a logical vector into runs, which is exactly the summary you want.

```r title="Profile the gap lengths with rle"
runs <- rle(is.na(gapped))
gap_lengths <- runs$lengths[runs$values]

table(gap_lengths)
#> gap_lengths
#>  1  2 13
#> 17  3  1
```

Read that as: seventeen isolated single-month gaps, three two-month gaps, and one run of thirteen consecutive months. The thirteen is our twelve-month outage plus one scattered dropout that happened to land right beside it. That single long run is the reason a method that handles the seventeen easy gaps beautifully can still ruin the series.

The third question is whether the gaps cluster anywhere meaningful. To ask that of monthly data you need each gap's calendar month, and `cycle()` gives it: on a monthly `ts` object it reports each observation's position within its season, returning 1 for every January through 12 for every December. Indexing `month.abb` by those positions turns them into month names, and `table()` counts the ones that landed on a gap.

```r title="Check which calendar months went missing"
table(factor(month.abb[cycle(nottem)[is.na(gapped)]], levels = month.abb))
#>
#> Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#>   3   6   3   2   3   2   4   4   4   2   1   2
```

Nothing dramatic here, which is what we expect since we generated the scattered gaps at random. February looks slightly heavy at six, but with thirty-six gaps spread over twelve months that is ordinary noise. The reason to run this check is the case where it is not noise, and that brings us to why the gaps went missing in the first place.

Statisticians sort missing data into three mechanisms. Translated into time series terms, they look like this.

| Mechanism | In time series terms | Example | Can you impute it? |
|---|---|---|---|
| Missing completely at random | Dropouts unrelated to time or value | Radio packet lost | Yes, safely |
| Missing at random | Dropouts tied to a known feature of the calendar | Store shut on public holidays | Yes, if you model the calendar feature |
| Missing not at random | Dropouts tied to the value that would have been recorded | Sensor saturates and fails above 40 degrees | No, imputation pulls extremes toward the middle |

The third row is the dangerous one and it is very common in sensor data. If a meter cuts out precisely when readings run high, then every gap hides a high value, and any method that interpolates between neighbours will guess something moderate. You will not see the error in a residual plot, because the true values were never recorded. The only defence is knowing your instrument.

[NOTE]
**A zero is not the same as a missing value, and confusing them costs you either way.** A shop closed for a public holiday genuinely sold nothing, so zero is the correct value and imputing it invents revenue. A till that failed to report is missing, so a zero there teaches the model a crash that never happened.

**Try it:** Add a seventh reading on 14 March 2024 with a level of 7.2 to `readings`, rebuild the tsibble, and count the gaps again. How many gaps are there now, and how long is the new one?

```r title="Your turn: count the gaps after adding a reading"
# Hint: dplyr::add_row() appends, then as_tsibble() and count_gaps().

ex_readings <- readings
# your code here

# Test:
# count_gaps(as_tsibble(ex_readings, index = date))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Counting gaps after adding a reading"
ex_readings <- readings |> add_row(date = as.Date("2024-03-14"), level = 7.2)
ex_ts <- as_tsibble(ex_readings, index = date)

count_gaps(ex_ts)
#> # A tibble: 3 × 3
#>   .from      .to           .n
#>   <date>     <date>     <int>
#> 1 2024-03-03 2024-03-04     2
#> 2 2024-03-07 2024-03-08     2
#> 3 2024-03-11 2024-03-13     3
```

**Explanation:** Adding a later date extends the range the tsibble considers, so the three days between 10 March and 14 March become a third gap. Adding one observation revealed three absences, which is a good reminder that a gap only exists relative to a defined start and end.

</details>

## Which simple fills work, and where do they break?

Four repairs cover most of what people reach for. Carry the last value forward, carry the next value back, draw a straight line between the neighbours, or fit a curve through them. The `zoo` package provides all four, and the fastest way to understand them is to watch them work on seven numbers rather than 240.

Our toy series is deliberately uneven: it climbs gently from 10 to 16, then jumps to 25, then to 50.

```r title="Four simple fills on a seven-point series"
library(zoo)

toy <- c(10, NA, NA, 16, 25, NA, 50)

round(rbind(
  original = toy,
  locf     = na.locf(toy, na.rm = FALSE),
  nocb     = na.locf(toy, na.rm = FALSE, fromLast = TRUE),
  linear   = na.approx(toy, na.rm = FALSE),
  spline   = na.spline(toy)
), 2)
#>          [,1]  [,2]  [,3] [,4] [,5]  [,6] [,7]
#> original   10    NA    NA   16   25    NA   50
#> locf       10 10.00 10.00   16   25 25.00   50
#> nocb       10 16.00 16.00   16   25 50.00   50
#> linear     10 12.00 14.00   16   25 37.50   50
#> spline     10  7.92 10.11   16   25 36.53   50
```

Four different answers for the same two holes. `na.locf()` holds 10 flat until real data returns, which produces a staircase. Setting `fromLast = TRUE` reverses it into next observation carried backward, which jumps to 16 immediately. `na.approx()` draws the straight line most people picture when they say interpolation, landing on 12 and 14.

Now look at the spline row, and specifically at the 7.92. The observed series never goes below 10, yet the spline invented a value beneath its own minimum. Splines fit a smooth curve through the surrounding points, and when the series bends sharply, as ours does at the jump to 50, the curve overshoots on the way in. That is the standing risk with `na.spline()`: it is the most flexible option and the one most willing to produce values your process could never generate.

[WARNING]
**A spline can return values outside the observed range of the series.** On strictly positive quantities like sales, rainfall or concentration, that means negative imputed values which then propagate into every downstream calculation. Always check `range()` of a spline-filled series before using it.

Watching the mechanics is one thing. Scoring them is another, and because we hid the true values ourselves, we can score them exactly. Root mean squared error over just the imputed positions tells us how far each method landed from the truth, in degrees.

```r title="Score the simple fills against the hidden truth"
rmse <- function(filled, truth, where) sqrt(mean((filled[where] - truth[where])^2))
holes <- is.na(gapped)

round(c(
  mean_fill = rmse(mean_filled, temps, holes),
  locf      = rmse(na.locf(gapped, na.rm = FALSE), temps, holes),
  linear    = rmse(na.approx(gapped, na.rm = FALSE), temps, holes),
  spline    = rmse(na.spline(gapped), temps, holes)
), 3)
#> mean_fill      locf    linear    spline
#>     9.310     7.758     7.524     6.562
```

Every method beats the mean fill, and the ranking runs from 9.31 degrees down to 6.56. But hold the celebration, because even the best of these is off by six and a half degrees on average, on a series whose entire annual range is about twenty-five degrees. Something is badly wrong, and it is the thirteen-month run we found earlier. We will fix that in the next section.

First, there is a subtler problem that accuracy alone will not reveal. Recall that the whole reason to care is autocorrelation. Mean filling pushed it down. What does interpolation do to it? To isolate the effect, here is a fresh copy of the series with thirty-six scattered gaps and no long run at all.

```r title="Measure what each fill does to the autocorrelation"
set.seed(11)
sc <- temps
sc[sample(13:228, 36)] <- NA

mean_sc <- sc
mean_sc[is.na(mean_sc)] <- mean(sc, na.rm = TRUE)
lin_sc <- na.approx(sc, na.rm = FALSE)

acf_at <- function(x, k) acf(x, lag.max = k, plot = FALSE)$acf[k + 1]

round(c(true = acf_at(temps, 1),  mean_fill = acf_at(mean_sc, 1),  linear = acf_at(lin_sc, 1)), 3)
#>      true mean_fill    linear
#>     0.808     0.664     0.820

round(c(true = acf_at(temps, 12), mean_fill = acf_at(mean_sc, 12), linear = acf_at(lin_sc, 12)), 3)
#>      true mean_fill    linear
#>     0.884     0.711     0.881

round(c(sd_true = sd(temps), sd_mean = sd(mean_sc), sd_linear = sd(lin_sc)), 3)
#>   sd_true   sd_mean sd_linear
#>     8.572     7.815     8.318
```

The two methods fail in opposite directions. Mean filling does what it did in the first section, dragging autocorrelation down at every lag: 0.664 against a true 0.808 at lag 1, and 0.711 against 0.884 at lag 12. Linear interpolation does the reverse at lag 1, returning 0.820 against a true 0.808, and that direction is the new result here. An interpolated point lies exactly on the straight line joining its two neighbours, so it resembles them more closely than a real observation ever would, and the series comes out looking smoother than it is.

Both distortions matter, and they matter in different ways. A depressed autocorrelation makes a series look noisier than it is and pushes model selection toward simpler models. An inflated one makes it look smoother and more predictable than it is, which produces forecast intervals that are too narrow. If your next step is reading an [ACF and PACF plot](ACF-and-PACF-in-R.html) to choose model orders, both errors land directly on that decision.

The last simple tool is a guard rail rather than a method. Every `zoo` fill accepts `maxgap`, which sets the longest run it is willing to bridge. Anything longer is left as `NA`.

```r title="Refuse to interpolate across long gaps"
short_only <- na.approx(gapped, na.rm = FALSE, maxgap = 3)
sum(is.na(short_only))
#> [1] 13

filled_short <- holes & !is.na(short_only)
round(rmse(short_only, temps, filled_short), 3)
#> [1] 2.577
```

The thirteen-month run stayed untouched, and on the gaps it did agree to fill, linear interpolation scored 2.577 degrees instead of 7.524. That is the whole lesson of this section in one number: linear interpolation is not a bad method, it was being asked to do something no straight line can do. `maxgap` lets you use it where it works and forces you to make a deliberate decision everywhere else.

[TIP]
**Set maxgap to something well under one seasonal period.** For monthly data with an annual cycle, a value of 2 or 3 keeps interpolation inside the range where the series is roughly linear. Anything approaching 12 is asking a straight line to replace a full season.

**Try it:** Rerun the interpolation with `maxgap = 1` so that only isolated single-month gaps are filled. How many `NA` values survive, and how many were filled?

```r title="Your turn: interpolate only isolated gaps"
# Hint: pass maxgap = 1 to na.approx(), then count NA values.

ex_tight <- gapped
# your code here

# Test:
# c(still_missing = sum(is.na(ex_tight)), filled = sum(holes) - sum(is.na(ex_tight)))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Interpolating only isolated gaps"
ex_tight <- na.approx(gapped, na.rm = FALSE, maxgap = 1)

c(still_missing = sum(is.na(ex_tight)), filled = sum(holes) - sum(is.na(ex_tight)))
#> still_missing        filled
#>            19            17
```

**Explanation:** Exactly the seventeen single-month gaps from the `rle()` profile got filled. The nineteen survivors are the three two-month gaps plus the thirteen-month run, which matches the gap-length table precisely.

</details>

## How do you fill a gap without erasing the season?

We know why the long outage defeats every method so far. A straight line across twelve months replaces an entire annual cycle with a gentle slope. No interpolation of the raw values can avoid this, because the information needed to fill a January is not in the surrounding months at all. It is in the nineteen other Januaries in the series.

That points straight at the fix. Split the series into a seasonal part and everything else, interpolate only the part that has no pattern, then put the season back. This is exactly what [seasonal decomposition](Time-Series-Decomposition-in-R.html) gives you, and `na.interp()` from the `forecast` package does the whole sequence in one call. It runs an STL decomposition on the observed data, interpolates the seasonally adjusted series, then adds the seasonal component back onto the filled points.

For that to work the function has to know the seasonal period, which means handing it a `ts` object with the right frequency rather than a bare vector.

```r title="Impute with seasonal decomposition"
library(forecast)

gapped_ts <- ts(gapped, start = c(1920, 1), frequency = 12)
seasonal_fill <- as.numeric(na.interp(gapped_ts))

round(c(linear    = rmse(na.approx(gapped, na.rm = FALSE), temps, holes),
        na_interp = rmse(seasonal_fill, temps, holes)), 3)
#>    linear na_interp
#>     7.524     2.182
```

From 7.524 degrees down to 2.182, on identical gaps. That is not a tuning improvement, it is a different class of answer, and it comes entirely from telling the method that the series repeats every twelve months.

The month-by-month view of the outage shows where the gain came from.

```r title="Compare both fills across the outage year"
data.frame(
  month     = month.abb,
  truth     = temps[121:132],
  linear    = round(na.approx(gapped, na.rm = FALSE)[121:132], 1),
  na_interp = round(seasonal_fill[121:132], 1)
)
#>    month truth linear na_interp
#> 1    Jan  41.6   41.6      40.6
#> 2    Feb  37.1   41.4      40.3
#> 3    Mar  41.2   41.1      42.0
#> 4    Apr  46.9   40.9      46.7
#> 5    May  51.2   40.6      52.5
#> 6    Jun  60.4   40.4      58.0
#> 7    Jul  60.1   40.1      62.3
#> 8    Aug  61.6   39.9      60.6
#> 9    Sep  57.0   39.6      56.1
#> 10   Oct  50.9   39.4      48.5
#> 11   Nov  43.0   39.1      42.1
#> 12   Dec  38.8   38.9      40.2
```

The linear column drifts from 41.6 down to 38.9 and never leaves the low forties. It claims that year had a January in July. The `na.interp` column runs 40.6, 42.0, 46.7, 52.5, up to 62.3 in July and back down to 40.2 in December. It reconstructed a summer, because the other nineteen summers in the record told it what one looks like.

[KEY INSIGHT]
**Interpolate the part of the series that has no pattern, and reconstruct the part that does.** Neighbouring values can only tell you about the smooth local trend. Everything seasonal has to come from the same month in other years, which is why declaring the frequency matters more than choosing between straight lines and curves.

**Try it:** Prove that the frequency is doing the work. Build a `ts` object from `gapped` with `frequency = 1`, so R believes there is no season, run `na.interp()` on it, and compare the error to the version that knows about the twelve-month cycle.

```r title="Your turn: run na.interp without a declared season"
# Hint: ts(gapped, frequency = 1) then na.interp(), then rmse(..., temps, holes).

ex_flat <- gapped
# your code here

# Test:
# round(c(freq_12 = rmse(seasonal_fill, temps, holes), freq_1 = rmse(ex_flat, temps, holes)), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="na.interp with the season hidden"
ex_flat <- as.numeric(na.interp(ts(gapped, frequency = 1)))

round(c(freq_12 = rmse(seasonal_fill, temps, holes),
        freq_1  = rmse(ex_flat, temps, holes)), 3)
#> freq_12  freq_1
#>   2.182   7.524
```

**Explanation:** With no seasonal period declared there is nothing to decompose, so `na.interp()` falls back to plain linear interpolation and reproduces the 7.524 exactly. The entire improvement came from the frequency argument, not from the function name.

</details>

## Can a model tell you how unsure each filled value is?

Every method so far returns a single number per gap, and that number then sits in your data looking exactly like an observation. A value you invented and a value you measured are treated identically by everything downstream, which is a real problem when a quarter of a year was invented.

A state-space model handles this differently. It treats the series as driven by hidden components you never observe directly, in this case a slowly moving level and a repeating seasonal pattern, plus measurement noise on top. `StructTS()` estimates those components, and `type = "BSM"` asks for the basic structural model, the version that carries three hidden components: a level, a slope, and a season. The Kalman smoother then works out the most likely value of each hidden component at every time point, using the whole series, and reports how uncertain it is about each one. Where data exists, the uncertainty is small. Where data is missing, it grows.

Filling a gap means adding the smoothed level and the smoothed seasonal component at that time point. `KalmanSmooth()` returns the smoothed components as columns of `sm$smooth`, in the order level, slope, season, so the two we want are columns 1 and 3.

```r title="Fill gaps with a structural model"
fit_ss <- StructTS(gapped_ts, type = "BSM")
sm     <- KalmanSmooth(gapped_ts, fit_ss$model)

kalman_fill <- gapped
kalman_fill[holes] <- (sm$smooth[, 1] + sm$smooth[, 3])[holes]

round(c(na_interp = rmse(seasonal_fill, temps, holes),
        kalman    = rmse(kalman_fill,   temps, holes)), 3)
#> na_interp    kalman
#>     2.182     2.884
```

The structural model scored 2.884 against 2.182 for `na.interp`. It lost. That result is worth sitting with, because state-space methods carry a reputation as the sophisticated option, and on this series the simpler seasonal decomposition was more accurate. Sophistication is not accuracy, and the only way to know which wins on your data is to measure, which is the subject of the next section.

What the state-space model does give you, and no interpolation can, is a per-point measure of its own uncertainty. The smoother's variance output tells you how confident it is about the level and season at each time point. `sm$var` holds one variance matrix per time point, so `sm$var[, 1, 1]` is the variance of the level and `sm$var[, 3, 3]` the variance of the season. Add the two and take the square root and you have a standard error in degrees.

```r title="Read the uncertainty on each filled value"
se_level <- sqrt(sm$var[, 1, 1] + sm$var[, 3, 3])

round(c(observed_month = se_level[60],
        one_month_gap  = se_level[31],
        outage_start   = se_level[121],
        outage_middle  = se_level[126]), 2)
#> observed_month  one_month_gap   outage_start  outage_middle
#>           1.66           2.87           3.74           4.55
```

The pattern is exactly what intuition demands. At an observed month the standard error is 1.66 degrees, which is just the model's measurement noise. At an isolated one-month gap it rises to 2.87, because the value is inferred from neighbours rather than measured. At the start of the long outage it is 3.74, and six months in, as far from real data as you can get, it reaches 4.55.

That is a real, usable number. It tells you that the mid-outage estimates deserve roughly three times the doubt of an observed month, and it gives you grounds to widen a downstream interval or to exclude those months from an evaluation. Every other method in this tutorial reports the same confidence for a value squeezed between two neighbours and a value invented in the middle of a year-long blackout.

The `imputeTS` package packages these approaches behind a consistent interface, along with the best gap diagnostics available anywhere. It is not part of the interactive environment here, so run this one locally, in a session where `gapped`, `temps` and `holes` from the blocks above already exist.

```r-static title="Diagnose and impute with imputeTS locally"
# Run this locally in RStudio: install.packages("imputeTS") first.
gts_static <- ts(gapped, start = c(1920, 1), frequency = 12)

profile <- imputeTS::statsNA(gts_static, print_only = FALSE)
c(missing = profile$number_NAs, gaps = profile$number_na_gaps,
  longest_gap = profile$longest_na_gap, commonest_gap = profile$most_frequent_na_gap)
#>       missing          gaps   longest_gap commonest_gap
#>            36            21            13             1

profile$percentage_NAs
#> [1] "15%"

round(c(na_interpolation = rmse(imputeTS::na_interpolation(gts_static), temps, holes),
        na_seadec        = rmse(imputeTS::na_seadec(gts_static),        temps, holes),
        na_kalman        = rmse(imputeTS::na_kalman(gts_static, model = "StructTS"), temps, holes)), 3)
#> na_interpolation        na_seadec        na_kalman
#>            7.524            2.188            2.944
```

Those three numbers should look familiar. `na_interpolation` reproduces the linear result to three decimals, `na_seadec` lands within 0.006 of `na.interp`, and `na_kalman` matches the structural model we built by hand. The package is a convenience layer over the same mechanics, which is worth knowing because it means the reasoning transfers: understanding why seasonal decomposition beat interpolation here tells you why `na_seadec` will beat `na_interpolation` on your data too.

[NOTE]
**Attaching imputeTS with library() masks zoo's na.locf.** The two packages export functions with clashing names, so a script that loads both can break in confusing ways. Either load `imputeTS` last and use `zoo::na.locf()` explicitly, or skip the attach and call `imputeTS::na_kalman()` with the prefix as shown above. Older tutorials also use dot names like `na.kalman` and `plotNA.distribution`, which were replaced by `na_kalman` and `ggplot_na_distribution` in version 3.0.

**Try it:** The thirteen-month run in this series covers indices 121 to 133. Read the smoother's standard error at the first month of the run, the seventh, the thirteenth, and the first observed month afterwards. Does the uncertainty peak where you expect?

```r title="Your turn: trace the uncertainty through a long gap"
# Hint: se_level is already computed. Index it at 121, 127, 133 and 134.

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Uncertainty across the outage"
round(c(outage_month_1       = se_level[121],
        outage_month_7       = se_level[127],
        outage_month_13      = se_level[133],
        first_observed_after = se_level[134]), 2)
#>       outage_month_1       outage_month_7      outage_month_13 first_observed_after
#>                 3.74                 4.56                 3.93                 2.37
```

**Explanation:** Uncertainty climbs to a peak of 4.56 in the middle of the run, where the smoother is furthest from real data in both directions, then falls back as it approaches the observations on the far side. The first observed month afterwards drops to 2.37, still above the 1.66 of a month deep inside clean data, because the smoother is partly reconstructing that neighbourhood too.

</details>

## How do you prove which method is best for your series?

Three sections have now produced three different winners. Spline led among the simple fills, `na.interp` beat everything on the long outage, and the structural model came third despite being the most elaborate. There is no ranking that holds across series, and there is no ranking that even holds across different gap patterns in the same series.

The way out is the same trick we have been using implicitly all along: hide values you already know, fill them, and score the answers. This works on any real series, because there is always a stretch of complete data to hide values from. No ground truth needed beyond the data you already have.

![Diagram of the mask and score loop: hide known values, run candidate methods, score against the hidden truth, repeat over gap patterns](screenshots/Missing-Values-in-Time-Series-in-R-mask-and-score.webp)

*Figure 2: Hide values you already know, then score every candidate method against them.*

Here is the harness. It takes a complete series plus a logical mask of positions to hide. It blanks those positions, then reports how far each of four methods landed from the values it hid.

```r title="Build a mask and score harness"
score_methods <- function(truth, mask, freq = 12) {
  y <- truth
  y[mask] <- NA
  y_ts <- ts(y, frequency = freq)
  fits <- list(
    locf      = as.numeric(na.locf(y, na.rm = FALSE)),
    linear    = as.numeric(na.approx(y, na.rm = FALSE)),
    spline    = as.numeric(na.spline(y)),
    na_interp = as.numeric(na.interp(y_ts))
  )
  sapply(fits, function(f) sqrt(mean((f[mask] - truth[mask])^2)))
}

set.seed(7)
scatter_mask <- rep(FALSE, 240)
scatter_mask[sample(13:228, 30)] <- TRUE

round(score_methods(temps, scatter_mask), 3)
#>      locf    linear    spline na_interp
#>     5.479     2.827     3.051     2.605
```

With thirty scattered single-month gaps the four methods finish close together. `na_interp` wins at 2.605, linear is barely behind at 2.827, and even carrying the last value forward only costs 5.479. When gaps are isolated, the choice of method is a minor decision.

Now change one thing. Same series, same number of methods, but the missing values sit in one block of eighteen consecutive months.

```r title="Score the same methods on one long block"
block_mask <- rep(FALSE, 240)
block_mask[100:117] <- TRUE

round(score_methods(temps, block_mask), 3)
#>      locf    linear    spline na_interp
#>    12.232    10.570    19.542     2.856
```

The winner did not change, but everything behind it did. `na_interp` barely moved, from 2.605 to 2.856. Every other method got several times worse. Linear quadrupled to 10.570, and spline went from second-best at 3.051 to worst by a wide margin at 19.542, because an unconstrained curve fitted across eighteen months goes wherever the polynomial takes it.

One mask could be luck, so repeat it. Twenty random twelve-month outages at different positions in the series, averaged.

```r title="Average over twenty random outages"
set.seed(99)
reps <- t(sapply(1:20, function(i) {
  m <- rep(FALSE, 240)
  start <- sample(20:210, 1)
  m[start:(start + 11)] <- TRUE
  score_methods(temps, m)
}))

round(colMeans(reps), 3)
#>      locf    linear    spline na_interp
#>    11.710    11.900    15.212     2.928
```

The result is stable. Across twenty different outage positions `na_interp` averages 2.928 degrees while everything else sits above eleven. For this series with gaps of this shape, the decision is not close, and now you have evidence rather than a rule of thumb.

[KEY INSIGHT]
**Gap length relative to the seasonal period is what decides the method, not the series and not the package.** The same four methods finished within a whisker of each other on scattered gaps and spread across a sixteen-degree range on block gaps. Run the harness with masks shaped like your real gaps, which is why profiling them first was step one.

**Try it:** Add mean filling to the comparison so you can see how far ahead of the baseline the good methods really are on a long block. Write a small scoring function containing just mean fill and `na.interp`, and run it on `block_mask`.

```r title="Your turn: add mean fill to the comparison"
# Hint: inside the function, ifelse(mask, mean(y, na.rm = TRUE), truth) builds the mean-filled series.

ex_score <- function(truth, mask, freq = 12) {
  y <- truth
  y[mask] <- NA
  # your code here
}

# Test:
# round(ex_score(temps, block_mask), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean fill against seasonal imputation"
ex_score <- function(truth, mask, freq = 12) {
  y <- truth
  y[mask] <- NA
  fits <- list(
    mean_fill = ifelse(mask, mean(y, na.rm = TRUE), truth),
    na_interp = as.numeric(na.interp(ts(y, frequency = freq)))
  )
  sapply(fits, function(f) sqrt(mean((f[mask] - truth[mask])^2)))
}

round(ex_score(temps, block_mask), 3)
#> mean_fill na_interp
#>     9.710     2.856
```

**Explanation:** Mean filling scores 9.710 on the block, which is better than spline at 19.542 and roughly on par with locf and linear. That is a genuinely uncomfortable result: three methods that look far more principled than painting the average across a gap did not actually beat it here, because none of them knows about the season either.

</details>

## When should you skip imputation, and how do you avoid leaking the future?

There is an assumption buried in everything above: that you need complete data before you can model. For a large family of models that assumption is simply false, and acting on it makes your results worse rather than better.

ARIMA models are estimated through a Kalman filter, and the filter has a built-in rule for a missing observation: skip the update step and carry the prediction forward. Missing values are handled exactly, as part of the likelihood, with no filling required. Watch what happens to the estimated noise variance when you impute first instead.

```r title="Compare noise variance with and without imputation"
fit_true <- arima(ts(temps, start = c(1920, 1), frequency = 12),
                  order = c(1, 0, 0), seasonal = c(1, 0, 0))
fit_na   <- arima(gapped_ts, order = c(1, 0, 0), seasonal = c(1, 0, 0))
fit_imp  <- arima(ts(seasonal_fill, start = c(1920, 1), frequency = 12),
                  order = c(1, 0, 0), seasonal = c(1, 0, 0))

round(c(complete = fit_true$sigma2, with_na = fit_na$sigma2, imputed = fit_imp$sigma2), 3)
#>  complete   with_na   imputed
#>    10.644     9.444     8.723
```

The complete series, the truth, gives a noise variance of 10.644. Fitting to the gappy series gives 9.444, a mild underestimate. Fitting to the imputed series gives 8.723, the furthest from the truth of the three.

Think about what that means. Imputing made the model more confident than the complete data would justify. The filled values sit on a smooth reconstruction with no noise of their own, so the model sees a tidier series than reality and shrinks its error variance to match. Every prediction interval built on that fit will be too narrow, and the more you impute the more confident and the more wrong it gets.

If you want the model's own estimate of the missing values, ask it directly. In `fable`, `interpolate()` returns the fitted model's best guess at each gap.

```r title="Let the ARIMA model fill its own gaps"
library(fable)

gap_tbl <- tsibble(month = yearmonth("1920 Jan") + 0:239, temp = gapped, index = month)
arima_fit <- gap_tbl |> model(arima = ARIMA(temp))
arima_fit
#> # A mable: 1 x 1
#>                       arima
#>                     <model>
#> 1 <ARIMA(0,0,0)(2,1,0)[12]>

interpolated <- interpolate(arima_fit, gap_tbl)
round(c(na_interp = rmse(seasonal_fill, temps, holes),
        fable_arima = rmse(interpolated$temp, temps, holes)), 3)
#>   na_interp fable_arima
#>       2.182       2.260
```

`ARIMA()` selected a seasonal model on its own and interpolated to within 2.260 degrees, essentially tying with `na.interp`. The difference is that this estimate is internally consistent with the model you are going to forecast from, rather than being produced by a separate procedure and then handed over as if it were data.

Not every model is so accommodating, and the failure can be silent. Exponential smoothing has no equivalent way to skip a missing observation, so gaps do not throw an error, they change what gets fitted.

```r title="Watch ETS lose the season on gappy data"
full_tbl <- tsibble(month = yearmonth("1920 Jan") + 0:239, temp = temps, index = month)

full_tbl |> model(ets = ETS(temp))
#> # A mable: 1 x 1
#>            ets
#>        <model>
#> 1 <ETS(A,N,A)>

gap_tbl  |> model(ets = ETS(temp))
#> # A mable: 1 x 1
#>            ets
#>        <model>
#> 1 <ETS(M,N,N)>
```

On complete data `ETS()` selects (A,N,A): additive error, no trend, additive season. On the same series with fifteen percent missing it selects (M,N,N), which has no seasonal component at all. Nothing warned us. A model of monthly temperature that does not know about summer will forecast a flat line, and the only visible symptom is a model specification you would have to be paying attention to notice.

[NOTE]
**Which models tolerate missing values in fable: ARIMA, dynamic regression, NNAR and the naive benchmarks handle them natively; ETS and STL do not.** If your pipeline compares several model families, impute once up front so every candidate sees the same series, and be aware you are paying the confidence penalty shown above.

That leads to the last trap, and it is the one that silently inflates backtest results. Look again at how these methods work. Linear interpolation reads the next observed value. `na.interp` decomposes the entire series. The Kalman smoother explicitly uses observations from both directions. All of them are two-sided by construction.

For describing history that is a strength, since more information gives better estimates. For evaluating a forecast it is cheating, because at the moment you were forecasting, the future values those methods used had not happened yet.

```r title="Two-sided imputation quietly uses the future"
scattered <- holes & !(seq_along(gapped) %in% 118:135)
sum(scattered)
#> [1] 23

two_sided <- na.approx(gapped, na.rm = FALSE)
one_sided <- na.locf(gapped, na.rm = FALSE)

round(c(two_sided_linear = rmse(two_sided, temps, scattered),
        one_sided_locf   = rmse(one_sided, temps, scattered)), 3)
#> two_sided_linear   one_sided_locf
#>            2.577            5.221
```

Two-sided interpolation looks twice as accurate. It is not twice as clever, it just had twice the information, half of which was unavailable at the time. Here is a single gap to make that concrete.

```r title="Inspect one gap to see the future leak in"
first_gap <- which(scattered)[1]

round(c(index = first_gap, truth = temps[first_gap],
        two_sided = two_sided[first_gap], one_sided = one_sided[first_gap],
        next_observed = gapped[first_gap + 1]), 2)
#>         index         truth     two_sided     one_sided next_observed
#>         31.00         56.80         56.05         57.80         54.30
```

At index 31 the truth is 56.80. Carrying the previous value forward gives 57.80, using only the past. Linear interpolation gives 56.05, and it landed closer because it averaged toward 54.30, the value at index 32, a month that had not occurred yet. Its accuracy is borrowed from the future.

[WARNING]
**Impute inside the backtest fold, never before splitting.** If you fill the whole series and then split into training and test sets, future information has already flowed backwards into the training data and your accuracy scores are optimistic. See [time series cross-validation](Time-Series-Cross-Validation-in-R.html) for the fold structure this fits into.

The rule is simple once the distinction is clear. For describing, cleaning or charting a historical series, two-sided methods are correct and you should use the best one you can find. For anything evaluated as a forecast, impute using only data available at the forecast origin, which means one-sided methods or a Kalman filter run in filtering mode rather than smoothing mode.

**Try it:** Confirm that `arima()` really did use only the observed months. Fit the model to `gapped_ts` and report how many months the series contains against how many were actually observed, then look at the estimated coefficients.

```r title="Your turn: check what arima() actually used"
# Hint: length() gives the series length, sum(!is.na()) the observed count.

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="ARIMA on the gappy series"
ex_fit <- arima(gapped_ts, order = c(1, 0, 0), seasonal = c(1, 0, 0))

c(months_in_series = length(gapped_ts), months_observed = sum(!is.na(gapped_ts)))
#> months_in_series  months_observed
#>              240              204

round(ex_fit$coef, 3)
#>       ar1      sar1 intercept
#>     0.290     0.885    48.985
```

**Explanation:** The model fitted happily to 204 observations spread across 240 time points, and it recovered a strong seasonal autoregressive coefficient of 0.885. No imputation was involved at any stage. The [ARIMA tutorial](ARIMA-in-R.html) covers what these coefficients mean.

</details>

## Complete Example

Here is the whole workflow on one series: regularise the index, make gaps explicit, mark which values are invented, then fill with a method chosen for the gap profile.

```r title="End to end missing value workflow"
sensor <- tibble(
  month = yearmonth("1920 Jan") + 0:239,
  temp  = gapped
) |>
  as_tsibble(index = month) |>
  fill_gaps()

repaired <- sensor |>
  mutate(imputed  = is.na(temp),
         temp_fix = as.numeric(na.interp(ts(temp, frequency = 12))))

sum(repaired$imputed)
#> [1] 36

repaired |> filter(imputed) |> head(4)
#> # A tsibble: 4 x 4 [1M]
#>      month  temp imputed temp_fix
#>      <mth> <dbl> <lgl>      <dbl>
#> 1 1922 Jul    NA TRUE        59.9
#> 2 1923 Feb    NA TRUE        40.9
#> 3 1923 Aug    NA TRUE        61.2
#> 4 1923 Sep    NA TRUE        56.7
```

Five steps, and the fourth is the one people skip. `fill_gaps()` guarantees no absence stays invisible. The `imputed` flag is computed before filling, so it records the truth about the original data, and it travels with the series from then on. Later you can exclude invented points from an accuracy calculation, colour them differently in a chart, or feed the flag to a model as a regressor. Once the values are filled and the flag is gone, no one downstream can tell measurement from reconstruction.

## Frequently Asked Questions

**What is the best imputation method for time series?**
There is no fixed answer, and the mask-and-score harness above exists precisely because of that. As a starting point: for scattered gaps much shorter than one seasonal period, linear interpolation via `na.approx()` is hard to beat. For gaps approaching or exceeding one seasonal period, use a seasonal method such as `forecast::na.interp()` or `imputeTS::na_seadec()`. In the twenty-outage test here the seasonal method averaged 2.928 degrees against 11.9 for linear.

**What is the difference between na.approx() and na.locf()?**
`na.locf()` carries the last observed value forward, producing flat steps and using only past information. `na.approx()` draws a straight line between the observations either side, which is more accurate for describing history but uses future values. That difference matters when the imputed series feeds a backtest.

**Can I use mean imputation for time series data?**
Only as a deliberate baseline. Mean filling shrinks the variance and pushes autocorrelation down at every lag, which biases model selection and forecast intervals. In the first example it dropped the lag-12 autocorrelation from 0.884 to 0.729.

**What does maxgap do in na.approx()?**
It sets the longest run of consecutive `NA` values the function will bridge. Longer runs are left as `NA` so you have to decide about them explicitly. Setting `maxgap = 3` on the example series improved the error on filled gaps from 7.524 to 2.577 by simply declining the impossible ones.

**Does ARIMA handle missing values automatically?**
Yes. Both `stats::arima()` and `fable::ARIMA()` evaluate the likelihood through a Kalman filter, which skips the update step at a missing observation. Imputing first is not required and makes the estimated noise variance too small, as shown above. `fable::interpolate()` returns the model's own estimate of the gaps if you want the values.

**Which forecasting models can handle NA values in R?**
In fable, ARIMA, dynamic regression, NNAR and the naive benchmarks tolerate missing values. ETS and STL do not, and ETS fails quietly by selecting a non-seasonal specification rather than raising an error.

**How much missing data is too much for imputation?**
The total percentage matters much less than the shape. Twenty percent scattered across isolated points is routine. Five percent concentrated in one block spanning a full season may be unrecoverable, because no information about that stretch survives. Profile the gap lengths with `rle()` before judging.

**Is forward fill or backward fill better for time series?**
Forward fill, in almost every case. Backward fill takes a value from the future and writes it into the past, which corrupts any evaluation that respects time order. Use backward fill only for a leading `NA` at the very start of a series, where no earlier value exists.

**Can mice be used for time series data?**
Not usefully on a single series. Multiple imputation methods like `mice` exploit correlations between variables, and a univariate series has none to exploit. The information lives in the time dimension instead, which is what the methods in this tutorial use. For missing values in ordinary cross-sectional data, see the [general missing value tutorial](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html).

## Practice Exercises

### Exercise 1: Profile a gap pattern, then choose from the profile

Generate a mixed gap pattern on `temps`: eight scattered single-month dropouts somewhere between index 20 and 200, plus one twelve-month block at indices 60 to 71. Use `set.seed(505)` and `sample(20:200, 8)`. Profile the gap lengths with `rle()`, then score all four methods and check that your profile predicted the winner.

```r title="Exercise 1 starter"
# Build the mask, blank the series, profile it, then score.
# Hint: rle() on is.na(), then score_methods(temps, my_mask).

set.seed(505)
my_mask <- rep(FALSE, 240)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(505)
my_mask <- rep(FALSE, 240)
my_mask[sample(20:200, 8)] <- TRUE
my_mask[60:71] <- TRUE

my_series <- temps
my_series[my_mask] <- NA

my_runs <- rle(is.na(my_series))
table(my_runs$lengths[my_runs$values])
#>
#>  1 12
#>  8  1

round(score_methods(temps, my_mask), 3)
#>      locf    linear    spline na_interp
#>     9.131    10.433    15.470     2.914
```

**Explanation:** The profile shows eight one-month gaps and one twelve-month run, and that single long run decides everything. `na_interp` wins at 2.914 while the others sit between 9.1 and 15.5. The eight easy gaps are filled well by every method, but the twelve-month block dominates the error, so the presence of one long run is enough to settle the choice.

</details>

### Exercise 2: Extend the harness and vary the missingness rate

Write a scoring function with three methods: next observation carried backward (`na.locf` with `fromLast = TRUE`), linear interpolation, and `na.interp`. Score it at two rates of scattered missingness, 12 points and 60 points, both sampled from indices 13 to 228 with `set.seed(31)`. Present the result as a two-row matrix.

```r title="Exercise 2 starter"
# Hint: build the two masks first, then rbind() the two score vectors.

my_score2 <- function(truth, mask, freq = 12) {
  y <- truth
  y[mask] <- NA
  # Write your code below:
}

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_score2 <- function(truth, mask, freq = 12) {
  y <- truth
  y[mask] <- NA
  fits <- list(
    nocb      = as.numeric(na.locf(y, na.rm = FALSE, fromLast = TRUE)),
    linear    = as.numeric(na.approx(y, na.rm = FALSE)),
    na_interp = as.numeric(na.interp(ts(y, frequency = freq)))
  )
  sapply(fits, function(f) sqrt(mean((f[mask] - truth[mask])^2)))
}

set.seed(31)
rate_5  <- rep(FALSE, 240); rate_5[sample(13:228, 12)]  <- TRUE
rate_25 <- rep(FALSE, 240); rate_25[sample(13:228, 60)] <- TRUE

round(rbind(rate_5 = my_score2(temps, rate_5), rate_25 = my_score2(temps, rate_25)), 3)
#>          nocb linear na_interp
#> rate_5  3.876  2.531     2.927
#> rate_25 6.281  2.882     2.632
```

**Explanation:** The ranking flips between the two rates. At five percent missing, linear wins at 2.531 because gaps are isolated and neighbours are close. At twenty-five percent, gaps start clumping into runs of two and three, neighbours drift further apart, and the seasonal method takes over at 2.632. A method chosen at one missingness rate is not automatically right at another.

</details>

### Exercise 3: Build the honest comparison against the leaky one

Set a forecast origin at index 180. Impute the history two ways: honestly, using `na.locf()` on `gapped[1:origin]` only, and leakily, by interpolating the full 240-month series and then taking the first 180 values. Score both on the scattered gaps within the history, excluding indices 118 to 135 so the long outage does not dominate. Report the two errors.

```r title="Exercise 3 starter"
# Hint: my_gaps <- holes[1:origin] & !(1:origin %in% 118:135)

origin <- 180

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
origin <- 180
my_gaps <- holes[1:origin] & !(1:origin %in% 118:135)
sum(my_gaps)
#> [1] 19

honest <- na.locf(gapped[1:origin], na.rm = FALSE)
leaky  <- na.approx(gapped, na.rm = FALSE)[1:origin]
truth  <- temps[1:origin]

round(c(honest_locf  = sqrt(mean((honest[my_gaps] - truth[my_gaps])^2)),
        leaky_linear = sqrt(mean((leaky[my_gaps]  - truth[my_gaps])^2))), 3)
#>  honest_locf leaky_linear
#>        5.559        2.226
```

**Explanation:** The leaky version scores 2.226 against 5.559, so it looks two and a half times better. That gap is not skill, it is the amount of future information that flowed into the past. If you fill the whole series before splitting, this is the size of the illusion baked into your backtest, and it will not reproduce when the model meets data that has not happened yet.

</details>

## Summary

![Decision diagram showing gap length relative to one seasonal period selecting between linear interpolation, seasonal decomposition and Kalman smoothing](screenshots/Missing-Values-in-Time-Series-in-R-method-choice.webp)

*Figure 3: Gap length relative to one seasonal period is the variable that decides the method.*

| Method | Function | Wins when | Fails when |
|---|---|---|---|
| Mean fill | `x[is.na(x)] <- mean(...)` | Never, except as a baseline | Always; it flattens the season and shrinks autocorrelation |
| Carry forward | `zoo::na.locf()` | You need a one-sided fill for a backtest | Gaps are long; it produces flat steps |
| Linear | `zoo::na.approx()` | Gaps are short relative to the season | Gaps span a seasonal cycle |
| Spline | `zoo::na.spline()` | The series curves smoothly and gaps are short | Long gaps; it overshoots outside the observed range |
| Seasonal decomposition | `forecast::na.interp()` | The series is seasonal, at any gap length | The series has no seasonal structure to exploit |
| State space | `StructTS()` plus `KalmanSmooth()` | You need per-value uncertainty | You need the single most accurate point estimate |
| No imputation | `arima()`, `fable::ARIMA()` | The model handles NA natively | The model family is ETS or STL |

The workflow that holds regardless of series:

1. Make every gap visible with `fill_gaps()` before you count anything.
2. Profile gap lengths with `rle()`, and compare the longest run to one seasonal period.
3. Ask why the data is missing. Missingness tied to the value itself cannot be safely imputed.
4. Hide known values and score the candidates. Let the numbers pick the winner.
5. Keep a flag column marking which values were invented.
6. If the model handles missing values natively, consider not imputing at all.
7. For anything evaluated as a forecast, impute inside the fold using only the past.

## References

1. Hyndman, R.J. and Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition, section 13.9 on outliers and missing values. [Link](https://otexts.com/fpp3/missing-outliers.html)
2. Moritz, S. and Bartz-Beielstein, T. imputeTS: Time Series Missing Value Imputation in R. *The R Journal* 9(1), 2017. [Link](https://journal.r-project.org/articles/RJ-2017-009/index.html)
3. Moritz, S. et al. Comparison of different methods for univariate time series imputation in R. arXiv:1510.03924. [Link](https://arxiv.org/abs/1510.03924)
4. tsibble reference: handling implicit missing values. [Link](https://tsibble.tidyverts.org/articles/implicit-na.html)
5. zoo reference: `na.approx` and `na.spline`. [Link](https://search.r-project.org/CRAN/refmans/zoo/html/na.approx.html)
6. forecast reference: `na.interp`. [Link](https://search.r-project.org/CRAN/refmans/forecast/html/na.interp.html)
7. R Core Team. `StructTS` and Kalman filtering reference. [Link](https://search.r-project.org/R/refmans/stats/html/StructTS.html)
8. imputeTS package documentation, current API. [Link](https://steffenmoritz.github.io/imputeTS/)

## Continue Learning

- [tsibble in R](tsibble-in-R.html) covers index handling, keys and gap detection in depth, and is the natural companion to the `fill_gaps()` work here.
- [Missing Values in R](Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html) handles the cross-sectional case, where correlations between columns do the work that time dependence does here.
- [Time Series Cross-Validation in R](Time-Series-Cross-Validation-in-R.html) shows the fold structure that imputation must live inside if your backtest scores are going to mean anything.
