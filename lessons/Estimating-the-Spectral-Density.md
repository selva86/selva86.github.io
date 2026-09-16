---
title: "Spectral and Frequency Domain Analysis Lesson 2: Estimating the spectral density"
catalog_blurb: "Smooth a jagged periodogram into a reliable spectral density estimate, and know its limits."
description: "Smooth Northside Diner's jagged periodogram with a Daniell kernel, compare it with an AR spectral estimate, and test both against a known AR(2) truth."
keywords: "spectral density estimation, Daniell kernel smoothing, spec.pgram spans in R, bias-variance trade-off, spec.ar autoregressive spectral estimate, chi-squared confidence interval, periodogram smoothing in R, AR(2) theoretical spectrum, degrees of freedom spectral analysis"
post_type: "LESSON"
curriculum_id: "5.90.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-spectral"
course_title: "Spectral and Frequency Domain Analysis"
course_lesson: "2"
course_total: "5"
course_landing: "Spectral-and-Frequency-Domain-Analysis-Course.html"
course_next: "Filtering-Low-Pass-High-Pass-and-Band-Pass.html"
course_prev: "The-Frequency-Domain-and-the-Periodogram.html"
---

=== step === cover
## Estimating the spectral density

Today let's understand how to turn a periodogram's jagged spikes into a smooth, reliable estimate of the spectral density hiding underneath them.

Northside Diner is a lunch restaurant that logged how many lunch covers it served every day for ten weeks, seventy days in all. Feed those seventy days into R's spec.pgram(), and it returns a periodogram: one number, called an ordinate, for every candidate frequency, saying how strongly the series moves in step with a wave of that frequency. Two ordinates tower over the rest, a real weekly cycle at frequency 1/7 with ordinate 14,997.4, and a smaller cycle at frequency 2/7, repeating every 3.5 days, with ordinate 3,576.7. Away from those two frequencies, the ordinates are just noise, jumping up and down with no real pattern.

Here is that whole raw periodogram again, all 35 ordinates together.

::widget chart-plotter {"data":[{"x":0.01429,"y":175.5},{"x":0.02857,"y":34.8},{"x":0.04286,"y":49.6},{"x":0.05714,"y":140.6},{"x":0.07143,"y":334.1},{"x":0.08571,"y":172.3},{"x":0.1,"y":65},{"x":0.11429,"y":89.8},{"x":0.12857,"y":62.4},{"x":0.14286,"y":14997.4},{"x":0.15714,"y":54.4},{"x":0.17143,"y":40.4},{"x":0.18571,"y":269.2},{"x":0.2,"y":135.6},{"x":0.21429,"y":59.8},{"x":0.22857,"y":67.4},{"x":0.24286,"y":3.1},{"x":0.25714,"y":80.2},{"x":0.27143,"y":307.6},{"x":0.28571,"y":3576.7},{"x":0.3,"y":31},{"x":0.31429,"y":252},{"x":0.32857,"y":97},{"x":0.34286,"y":121.4},{"x":0.35714,"y":33.2},{"x":0.37143,"y":23.1},{"x":0.38571,"y":28.9},{"x":0.4,"y":10.8},{"x":0.41429,"y":113.3},{"x":0.42857,"y":35.9},{"x":0.44286,"y":345.8},{"x":0.45714,"y":25.9},{"x":0.47143,"y":184},{"x":0.48571,"y":149.7},{"x":0.5,"y":54.9}],"geoms":["line","point"],"x":"frequency","y":"ordinate"}

Two real cycles poking out of a jagged floor. Turning that floor into something you can trust at every frequency, not only the two tallest points, is what today's lesson does.

=== step === concept
## The spectral density: the curve behind a periodogram

Every raw ordinate spec.pgram() prints, big or small, stands in for something it can never show you directly: the series' true spectral density, a fixed curve saying exactly how much of the series' variance sits at each frequency. Call that curve \(f(\nu)\), a number for every frequency \(\nu\). A raw ordinate at frequency \(\nu\), written \(I(\nu)\), is only an estimate of \(f(\nu)\), and a specific kind of noisy one.

Rebuild Northside Diner's covers and its raw periodogram, and look at the top ordinates again.

```r
# Rebuild Northside Diner's covers and its raw periodogram
set.seed(2024)
day <- 1:70
northside_covers <- round(120 + 30 * cos(2 * pi * (day - 5) / 7) + 12 * cos(4 * pi * (day - 5) / 7) + rnorm(70, 0, 10))

pg <- spec.pgram(ts(northside_covers), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)

pg$df

top5 <- order(pg$spec, decreasing = TRUE)[1:5]
data.frame(frequency = round(pg$freq[top5], 6), ordinate = round(pg$spec[top5], 1))
#> [1] 2
#>   frequency ordinate
#> 1  0.142857  14997.4
#> 2  0.285714   3576.7
#> 3  0.442857    345.8
#> 4  0.071429    334.1
#> 5  0.271429    307.6
```

pg$df reads 2. Every one of those ordinates, the towering 14,997.4 at 1/7 included, was built from a distribution with exactly 2 degrees of freedom, and that number would still read 2 whether Northside Diner had kept 70 days of records or 7,000. For a series long enough that the usual large-sample approximations hold, twice a raw ordinate divided by the true spectral density at that frequency, \(2I(\nu)/f(\nu)\), behaves like a draw from a chi-squared distribution with 2 degrees of freedom.

That distribution has a mean of 2 and a standard deviation of 2 as well, so its spread relative to its own average, called its coefficient of variation, sits at 100%, permanently. A chi-squared distribution with exactly 2 degrees of freedom even has a simpler name, an exponential distribution, the same shape you'd get timing how long you wait for a rare event, whose standard deviation always equals its mean no matter how you set its rate.

That's the real reason a single raw ordinate never settles down: it carries a fixed 100% relative spread by construction, not because Northside Diner's 70 days happen to be too few. What can shrink that spread is averaging several ordinates together instead of reading just one.

=== step === concept
## Smoothing the periodogram with a Daniell kernel

A raw ordinate's 100% relative spread doesn't have to stay that high forever. Average several neighboring ordinates together, and so long as the true spectral density doesn't swing wildly across that narrow band of frequencies, you trade away some of that spread for a steadier number.

R does this with what's called a Daniell kernel, set with the spans argument to spec.pgram(). Ask for spans = c(5), and R builds a window 5 ordinates wide: the ordinate itself, its nearest neighbor on each side, and the next neighbor out on each side. The two outer neighbors get half the weight of the three inner ones, so the window's pull fades out gently at the edges, and every weight in the window adds up to exactly 1, so smoothing never changes the general scale of the numbers.

```r
# Smooth the periodogram with a Daniell kernel of span 5
kernel("modified.daniell", 2)$coef

pg5 <- spec.pgram(ts(northside_covers), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, spans = c(5), plot = FALSE)

pg5$freq[10]
round(pg5$df, 2)
round(pg5$spec[10], 1)
#> [1] 0.250 0.250 0.125
#> [1] 0.1428571
#> [1] 9.14
#> [1] 3794.8
```

kernel("modified.daniell", 2)$coef prints half of the window's weights, since the other half mirrors it: 0.25 for the ordinate itself and its immediate neighbor, and 0.125 for the neighbor two steps away. Put the full symmetric window together and it reads 0.125, 0.25, 0.25, 0.25, 0.125, five numbers that add to 1.

Apply that window to Northside Diner's periodogram at frequency 1/7, still pg5$freq[10], and two things move at once. The degrees of freedom rises from 2 to 9.14, since averaging five values worth of information behind one number acts like having several times the effective sample size. But the ordinate itself falls hard, from 14,997.4 down to 3,794.8, because four ordinary frequencies got mixed into the window along with the peak, and every one of them pulled the average down toward the floor.

A steadier number and a shorter peak arrived together, and that trade only gets sharper as the window widens further.

=== step === concept
## The span controls the bias-variance trade

Widen that window and the same trade keeps playing out, more of one thing for more of the other. Try spans of 3, 5, 7 and 9 side by side and read both numbers at once.

```r
# Compare spans 3, 5, 7 and 9: does df rise as the span widens?
spans_to_try <- c(3, 5, 7, 9)
span_stats <- lapply(spans_to_try, function(m) {
  pg_m <- spec.pgram(ts(northside_covers), taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, spans = c(m), plot = FALSE)
  data.frame(span = m, df = round(pg_m$df, 2), ordinate_1_7 = round(pg_m$spec[10], 1))
})
do.call(rbind, span_stats)
#>   span    df ordinate_1_7
#> 1    3  5.33       7527.9
#> 2    5  9.14       3794.8
#> 3    7 13.09       2568.6
#> 4    9 17.07       1966.6
```

Degrees of freedom climbs steadily, 5.33, 9.14, 13.09, 17.07, each wider span folding in more neighboring ordinates and buying a steadier number. The 1/7 ordinate falls just as steadily in the other direction, 7,527.9, 3,794.8, 2,568.6, 1,966.6, each wider span blending in more of the ordinary floor around the peak and flattening it further.

This is the bias-variance trade in spectral smoothing, and it has plain names for both sides. Variance is how much a smoothed ordinate would jump around if you reran the whole experiment with fresh noise, and a wider span lowers it, which is exactly what a higher degrees of freedom means. Bias is how far a smoothed ordinate's own average sits from the true spectral density it's estimating, and a wider span raises it, because it blends in real information from frequencies that don't actually share the peak's height.

You can't lower one without raising the other. See all four curves at once, and the trade shows up as a picture, not just a table.

::widget chart-plotter {"data":[{"x":0.01429,"y":175.5,"fill":"raw"},{"x":0.02857,"y":34.8,"fill":"raw"},{"x":0.04286,"y":49.6,"fill":"raw"},{"x":0.05714,"y":140.6,"fill":"raw"},{"x":0.07143,"y":334.1,"fill":"raw"},{"x":0.08571,"y":172.3,"fill":"raw"},{"x":0.1,"y":65,"fill":"raw"},{"x":0.11429,"y":89.8,"fill":"raw"},{"x":0.12857,"y":62.4,"fill":"raw"},{"x":0.14286,"y":14997.4,"fill":"raw"},{"x":0.15714,"y":54.4,"fill":"raw"},{"x":0.17143,"y":40.4,"fill":"raw"},{"x":0.18571,"y":269.2,"fill":"raw"},{"x":0.2,"y":135.6,"fill":"raw"},{"x":0.21429,"y":59.8,"fill":"raw"},{"x":0.22857,"y":67.4,"fill":"raw"},{"x":0.24286,"y":3.1,"fill":"raw"},{"x":0.25714,"y":80.2,"fill":"raw"},{"x":0.27143,"y":307.6,"fill":"raw"},{"x":0.28571,"y":3576.7,"fill":"raw"},{"x":0.3,"y":31,"fill":"raw"},{"x":0.31429,"y":252,"fill":"raw"},{"x":0.32857,"y":97,"fill":"raw"},{"x":0.34286,"y":121.4,"fill":"raw"},{"x":0.35714,"y":33.2,"fill":"raw"},{"x":0.37143,"y":23.1,"fill":"raw"},{"x":0.38571,"y":28.9,"fill":"raw"},{"x":0.4,"y":10.8,"fill":"raw"},{"x":0.41429,"y":113.3,"fill":"raw"},{"x":0.42857,"y":35.9,"fill":"raw"},{"x":0.44286,"y":345.8,"fill":"raw"},{"x":0.45714,"y":25.9,"fill":"raw"},{"x":0.47143,"y":184,"fill":"raw"},{"x":0.48571,"y":149.7,"fill":"raw"},{"x":0.5,"y":54.9,"fill":"raw"},{"x":0.01429,"y":140.4,"fill":"span 3"},{"x":0.02857,"y":73.7,"fill":"span 3"},{"x":0.04286,"y":68.7,"fill":"span 3"},{"x":0.05714,"y":166.2,"fill":"span 3"},{"x":0.07143,"y":245.3,"fill":"span 3"},{"x":0.08571,"y":185.9,"fill":"span 3"},{"x":0.1,"y":98,"fill":"span 3"},{"x":0.11429,"y":76.7,"fill":"span 3"},{"x":0.12857,"y":3803,"fill":"span 3"},{"x":0.14286,"y":7527.9,"fill":"span 3"},{"x":0.15714,"y":3786.7,"fill":"span 3"},{"x":0.17143,"y":101.1,"fill":"span 3"},{"x":0.18571,"y":178.6,"fill":"span 3"},{"x":0.2,"y":150.1,"fill":"span 3"},{"x":0.21429,"y":80.7,"fill":"span 3"},{"x":0.22857,"y":49.4,"fill":"span 3"},{"x":0.24286,"y":38.5,"fill":"span 3"},{"x":0.25714,"y":117.8,"fill":"span 3"},{"x":0.27143,"y":1068.1,"fill":"span 3"},{"x":0.28571,"y":1873,"fill":"span 3"},{"x":0.3,"y":972.7,"fill":"span 3"},{"x":0.31429,"y":158,"fill":"span 3"},{"x":0.32857,"y":141.8,"fill":"span 3"},{"x":0.34286,"y":93.2,"fill":"span 3"},{"x":0.35714,"y":52.7,"fill":"span 3"},{"x":0.37143,"y":27.1,"fill":"span 3"},{"x":0.38571,"y":22.9,"fill":"span 3"},{"x":0.4,"y":40.9,"fill":"span 3"},{"x":0.41429,"y":68.3,"fill":"span 3"},{"x":0.42857,"y":132.7,"fill":"span 3"},{"x":0.44286,"y":188.4,"fill":"span 3"},{"x":0.45714,"y":145.4,"fill":"span 3"},{"x":0.47143,"y":135.9,"fill":"span 3"},{"x":0.48571,"y":134.6,"fill":"span 3"},{"x":0.5,"y":102.3,"fill":"span 3"},{"x":0.01429,"y":124.6,"fill":"span 5"},{"x":0.02857,"y":104.5,"fill":"span 5"},{"x":0.04286,"y":120,"fill":"span 5"},{"x":0.05714,"y":157,"fill":"span 5"},{"x":0.07143,"y":176.1,"fill":"span 5"},{"x":0.08571,"y":171.7,"fill":"span 5"},{"x":0.1,"y":131.3,"fill":"span 5"},{"x":0.11429,"y":1950.5,"fill":"span 5"},{"x":0.12857,"y":3802.3,"fill":"span 5"},{"x":0.14286,"y":3794.8,"fill":"span 5"},{"x":0.15714,"y":3814.5,"fill":"span 5"},{"x":0.17143,"y":1982.6,"fill":"span 5"},{"x":0.18571,"y":125.6,"fill":"span 5"},{"x":0.2,"y":129.6,"fill":"span 5"},{"x":0.21429,"y":99.8,"fill":"span 5"},{"x":0.22857,"y":59.6,"fill":"span 5"},{"x":0.24286,"y":83.6,"fill":"span 5"},{"x":0.25714,"y":553.3,"fill":"span 5"},{"x":0.27143,"y":995.4,"fill":"span 5"},{"x":0.28571,"y":1020.4,"fill":"span 5"},{"x":0.3,"y":1015.5,"fill":"span 5"},{"x":0.31429,"y":557.3,"fill":"span 5"},{"x":0.32857,"y":125.6,"fill":"span 5"},{"x":0.34286,"y":97.3,"fill":"span 5"},{"x":0.35714,"y":60.2,"fill":"span 5"},{"x":0.37143,"y":37.8,"fill":"span 5"},{"x":0.38571,"y":34,"fill":"span 5"},{"x":0.4,"y":45.6,"fill":"span 5"},{"x":0.41429,"y":86.8,"fill":"span 5"},{"x":0.42857,"y":128.3,"fill":"span 5"},{"x":0.44286,"y":139.1,"fill":"span 5"},{"x":0.45714,"y":162.1,"fill":"span 5"},{"x":0.47143,"y":140,"fill":"span 5"},{"x":0.48571,"y":119.1,"fill":"span 5"},{"x":0.5,"y":134.6,"fill":"span 5"},{"x":0.01429,"y":122.3,"fill":"span 9"},{"x":0.02857,"y":148.7,"fill":"span 9"},{"x":0.04286,"y":150.4,"fill":"span 9"},{"x":0.05714,"y":138.1,"fill":"span 9"},{"x":0.07143,"y":125.7,"fill":"span 9"},{"x":0.08571,"y":1053.7,"fill":"span 9"},{"x":0.1,"y":1989.2,"fill":"span 9"},{"x":0.11429,"y":1983.2,"fill":"span 9"},{"x":0.12857,"y":1972.9,"fill":"span 9"},{"x":0.14286,"y":1966.6,"fill":"span 9"},{"x":0.15714,"y":1964,"fill":"span 9"},{"x":0.17143,"y":1962.2,"fill":"span 9"},{"x":0.18571,"y":1957.1,"fill":"span 9"},{"x":0.2,"y":1021.1,"fill":"span 9"},{"x":0.21429,"y":104.6,"fill":"span 9"},{"x":0.22857,"y":341.5,"fill":"span 9"},{"x":0.24286,"y":547.6,"fill":"span 9"},{"x":0.25714,"y":540,"fill":"span 9"},{"x":0.27143,"y":549.6,"fill":"span 9"},{"x":0.28571,"y":555.3,"fill":"span 9"},{"x":0.3,"y":560.5,"fill":"span 9"},{"x":0.31429,"y":558.8,"fill":"span 9"},{"x":0.32857,"y":537.8,"fill":"span 9"},{"x":0.34286,"y":297.5,"fill":"span 9"},{"x":0.35714,"y":79.8,"fill":"span 9"},{"x":0.37143,"y":71.4,"fill":"span 9"},{"x":0.38571,"y":73.5,"fill":"span 9"},{"x":0.4,"y":83.1,"fill":"span 9"},{"x":0.41429,"y":86.5,"fill":"span 9"},{"x":0.42857,"y":103.9,"fill":"span 9"},{"x":0.44286,"y":113.4,"fill":"span 9"},{"x":0.45714,"y":123.7,"fill":"span 9"},{"x":0.47143,"y":136.8,"fill":"span 9"},{"x":0.48571,"y":140.6,"fill":"span 9"},{"x":0.5,"y":140,"fill":"span 9"}],"geoms":["line","point"],"x":"frequency","y":"ordinate","code":{"line":"ggplot(span_comparison, aes(frequency, ordinate, colour = group)) +\n  geom_line(linewidth = 1)","point":"ggplot(span_comparison, aes(frequency, ordinate, colour = group)) +\n  geom_point()"}}

Raw is the most jagged of the four almost everywhere, while span 9's curve is the smoothest, and also the one with the shortest peak. There's no span that wins on both counts at once.

=== step === quiz
## Quick check: reading the span trade-off

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Span 9 has the higher degrees of freedom, 17.07 against span 3's 5.33, but span 3 keeps the sharper peak, 7527.9 against span 9's 1966.6. ::ok Right. A wider span averages in more neighboring ordinates, which raises the degrees of freedom and steadies the number, but it also blends more of the ordinary floor into a real peak, which is why span 9's peak sits so much lower than span 3's.
- Span 3 has the higher degrees of freedom, since averaging fewer neighbors leaves more of the original noise intact. ::no
- Span 9 has both the higher degrees of freedom and the sharper peak, since more smoothing improves every number at once. ::no
- Neither number changes with the span. Only the width of a confidence interval depends on which span you pick. ::no Both numbers move with the span, in opposite directions. A wider span like 9 averages in more neighboring ordinates, so its degrees of freedom rises, 17.07 against span 3's 5.33, which is exactly what makes its own confidence interval tighter. But averaging in more neighbors also blends more of the ordinary floor into a real peak, which is why span 9's peak, 1966.6, sits so much lower than span 3's, 7527.9. A higher degrees of freedom and a flatter peak are the same trade, seen from two different sides.

=== step === concept
## Turning degrees of freedom into a confidence band

A degrees-of-freedom number is more than a badge of steadiness. A raw ordinate satisfies \(2I(\nu)/f(\nu)\), a chi-squared distribution with 2 degrees of freedom, and a smoothed ordinate with \(d\) degrees of freedom satisfies the same kind of relationship, \(dI(\nu)/f(\nu)\), a chi-squared distribution with \(d\) degrees of freedom instead.

Invert that relationship and it bounds the unknown \(f(\nu)\) directly:

\[
\frac{d\,I(\nu)}{\chi^2_{d}(0.975)} \;\le\; f(\nu) \;\le\; \frac{d\,I(\nu)}{\chi^2_{d}(0.025)}
\]

Here \(\chi^2_{d}(p)\) is the value R's qchisq(p, d) returns, the number a chi-squared distribution with \(d\) degrees of freedom sits below \(p\) of the time. Apply it to span 5's smoothed ordinate at 1/7.

```r
# Turn span 5's smoothed ordinate at 1/7 into a 95% confidence interval
df5 <- pg5$df
I5 <- pg5$spec[10]
lo <- df5 * I5 / qchisq(0.975, df5)
hi <- df5 * I5 / qchisq(0.025, df5)
round(c(df = df5, ordinate = I5, lower = lo, upper = hi), 1)
#>       df ordinate    lower    upper 
#>      9.1   3794.8   1804.0  12494.0 
```

Span 5's ordinate at 1/7 was 3,794.8, and now there's a real interval around it: the true spectral density there is estimated to sit somewhere between 1,804.0 and 12,494.0, with 95% confidence. That's a wide interval, nearly seven times as wide at the top as at the bottom, and that width is a direct consequence of only having 9.1 degrees of freedom behind the number.

Push the span up to 9, with 17.07 degrees of freedom, and the same formula returns a tighter interval around a smaller ordinate. There's the bias-variance trade again, now visible in an actual confidence band instead of just a falling number.

=== step === concept
## The autoregressive alternative: spec.ar()

Choosing a span is one way to smooth a periodogram. R has an entirely different route to the same kind of curve, one that never asks you to pick a span at all.

spec.ar() fits an autoregressive model to the series, the same kind of model used to forecast a series from its own past values, and then evaluates that model's own spectral density formula directly, at as many frequencies as you like. The only choice left is the AR model's order, and ar() picks that by AIC on its own.

```r
# Fit an AR model chosen by AIC, and read its own spectral density
ar_fit <- spec.ar(ts(northside_covers), plot = FALSE)
ar(ts(northside_covers))$order

peak <- which.max(ar_fit$spec)
round(ar_fit$freq[peak], 6)
round(ar_fit$spec[peak], 1)
#> [1] 7
#> [1] 0.143287
#> [1] 20202.6
```

AIC settled on an AR model of order 7, meaning the fitted model explains each day's covers using its own last seven days. Evaluate that model's spectral density formula and its peak lands at frequency 0.143287, essentially the same 1/7 weekly cycle every other method already found, with a value of 20,202.6.

There's no span to argue about here. The trade-off moved somewhere else: instead of choosing how wide a smoothing window should be, you're choosing how many past days the model should look back on, and AIC made that choice for you.

=== step === concept
## An AR(2) series with a known theoretical spectrum

Every estimate so far, raw, span 3, span 5, span 9, spec.ar(), has been checked only against each other, never against a real answer, because Northside Diner's true spectral density is not something anyone can write down. Real series never come with an answer key. A simulated one can.

Simulate 300 points from an AR(2) process, an autoregressive model of order 2 meaning each value depends on its own previous two values, with coefficients 1.5 and -0.75 and innovation variance 1, and its spectral density is known exactly, because the process that generated it is known exactly.

```r
# Simulate 300 points from a known AR(2) process
set.seed(42)
ar2_series <- round(as.numeric(arima.sim(list(ar = c(1.5, -0.75)), n = 300, sd = 1)), 2)
range(ar2_series)
round(sd(ar2_series), 2)
#> [1] -7.16  6.49
#> [1] 2.43
```

That's 300 values ranging from -7.16 to 6.49, standard deviation 2.43, built entirely from \(x_t = 1.5 x_{t-1} - 0.75 x_{t-2} + w_t\), where \(w_t\) is fresh random noise with variance 1 at every step. An AR(2) process like this has a closed-form spectral density, a formula you can evaluate directly instead of estimating:

\[
f(\nu) = \frac{\sigma^2}{\left|\,1 - \phi_1 e^{-2\pi i \nu} - \phi_2 e^{-4\pi i \nu}\,\right|^2}
\]

\(\phi_1\) and \(\phi_2\) are the AR(2) coefficients, \(\sigma^2\) is the innovation variance, and \(i\) is the imaginary unit, since the denominator is a complex number whose size, its modulus, is what matters. Write that formula as an R function and evaluate it at the coefficients used to build the series.

```r
# The exact spectral density formula for an AR(2) process
theo_spec <- function(nu, phi1, phi2, sigma2) {
  sigma2 / Mod(1 - phi1 * exp(-2i * pi * nu) - phi2 * exp(-4i * pi * nu))^2
}

round(theo_spec(0.0804, 1.5, -0.75, 1), 2)
#> [1] 64
```

At frequency 0.0804, this exact formula returns 64.00, and that is the true peak of this series' spectral density, not an estimate of it. Plot the formula across every frequency from 0 to 0.5 and the peak stands out clearly.

::widget chart-plotter {"data":[{"x":0.005,"y":16.1,"fill":"theoretical spectral density"},{"x":0.0141,"y":16.77,"fill":"theoretical spectral density"},{"x":0.0231,"y":18.21,"fill":"theoretical spectral density"},{"x":0.0322,"y":20.65,"fill":"theoretical spectral density"},{"x":0.0413,"y":24.54,"fill":"theoretical spectral density"},{"x":0.0504,"y":30.63,"fill":"theoretical spectral density"},{"x":0.0594,"y":39.92,"fill":"theoretical spectral density"},{"x":0.0685,"y":52.51,"fill":"theoretical spectral density"},{"x":0.0776,"y":63.13,"fill":"theoretical spectral density"},{"x":0.0804,"y":64,"fill":"peak"},{"x":0.0867,"y":59.59,"fill":"theoretical spectral density"},{"x":0.0957,"y":42.94,"fill":"theoretical spectral density"},{"x":0.1048,"y":27.13,"fill":"theoretical spectral density"},{"x":0.1139,"y":16.94,"fill":"theoretical spectral density"},{"x":0.123,"y":10.94,"fill":"theoretical spectral density"},{"x":0.132,"y":7.38,"fill":"theoretical spectral density"},{"x":0.1411,"y":5.19,"fill":"theoretical spectral density"},{"x":0.1502,"y":3.78,"fill":"theoretical spectral density"},{"x":0.1593,"y":2.83,"fill":"theoretical spectral density"},{"x":0.1683,"y":2.18,"fill":"theoretical spectral density"},{"x":0.1774,"y":1.72,"fill":"theoretical spectral density"},{"x":0.1865,"y":1.38,"fill":"theoretical spectral density"},{"x":0.1956,"y":1.12,"fill":"theoretical spectral density"},{"x":0.2046,"y":0.93,"fill":"theoretical spectral density"},{"x":0.2137,"y":0.78,"fill":"theoretical spectral density"},{"x":0.2228,"y":0.66,"fill":"theoretical spectral density"},{"x":0.2319,"y":0.57,"fill":"theoretical spectral density"},{"x":0.2409,"y":0.49,"fill":"theoretical spectral density"},{"x":0.25,"y":0.43,"fill":"theoretical spectral density"},{"x":0.2591,"y":0.38,"fill":"theoretical spectral density"},{"x":0.2681,"y":0.34,"fill":"theoretical spectral density"},{"x":0.2772,"y":0.3,"fill":"theoretical spectral density"},{"x":0.2863,"y":0.27,"fill":"theoretical spectral density"},{"x":0.2954,"y":0.25,"fill":"theoretical spectral density"},{"x":0.3044,"y":0.23,"fill":"theoretical spectral density"},{"x":0.3135,"y":0.21,"fill":"theoretical spectral density"},{"x":0.3226,"y":0.19,"fill":"theoretical spectral density"},{"x":0.3317,"y":0.18,"fill":"theoretical spectral density"},{"x":0.3407,"y":0.17,"fill":"theoretical spectral density"},{"x":0.3498,"y":0.16,"fill":"theoretical spectral density"},{"x":0.3589,"y":0.15,"fill":"theoretical spectral density"},{"x":0.368,"y":0.14,"fill":"theoretical spectral density"},{"x":0.377,"y":0.13,"fill":"theoretical spectral density"},{"x":0.3861,"y":0.13,"fill":"theoretical spectral density"},{"x":0.3952,"y":0.12,"fill":"theoretical spectral density"},{"x":0.4043,"y":0.12,"fill":"theoretical spectral density"},{"x":0.4133,"y":0.11,"fill":"theoretical spectral density"},{"x":0.4224,"y":0.11,"fill":"theoretical spectral density"},{"x":0.4315,"y":0.1,"fill":"theoretical spectral density"},{"x":0.4406,"y":0.1,"fill":"theoretical spectral density"},{"x":0.4496,"y":0.1,"fill":"theoretical spectral density"},{"x":0.4587,"y":0.1,"fill":"theoretical spectral density"},{"x":0.4678,"y":0.1,"fill":"theoretical spectral density"},{"x":0.4769,"y":0.1,"fill":"theoretical spectral density"},{"x":0.4859,"y":0.1,"fill":"theoretical spectral density"},{"x":0.495,"y":0.09,"fill":"theoretical spectral density"}],"geoms":["line","point"],"x":"frequency","y":"spectral_density"}

Every estimator from here on gets checked against that one number, 64.00 at frequency 0.0804, known for certain because the series was built to have it.

=== step === concept
## Reading the AR(2) estimates against the known spectral density

With a real answer in hand, run the same three estimators on the AR(2) series and see how close each one actually lands.

```r
# Build the AR(2) periodogram, a Daniell-smoothed version, and an AR spectral estimate
ts_ar2 <- ts(ar2_series)
pg_ar2_raw <- spec.pgram(ts_ar2, taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, plot = FALSE)
pg_ar2_s9  <- spec.pgram(ts_ar2, taper = 0, detrend = FALSE, demean = TRUE, fast = FALSE, spans = c(9), plot = FALSE)
ar2_fit    <- spec.ar(ts_ar2, order = 2, plot = FALSE)

i <- which(pg_ar2_raw$freq == 0.08)
round(c(theory  = theo_spec(0.08, 1.5, -0.75, 1),
        raw     = pg_ar2_raw$spec[i],
        span9   = pg_ar2_s9$spec[i],
        spec_ar = ar2_fit$spec[which.min(abs(ar2_fit$freq - 0.08))]), 2)

round(ar(ts_ar2, order.max = 2, aic = FALSE)$ar, 3)
#>  theory     raw   span9 spec_ar 
#>   63.98   23.95   37.44   37.12 
#> [1]  1.440 -0.705
```

At frequency 0.08, right beside the true peak, theory says 63.98. The raw periodogram says 23.95, well under half of that, which is exactly the kind of miss a single chi-squared ordinate with only 2 degrees of freedom is prone to. Both smoothed methods do better: Daniell span 9 reads 37.44 and spec.ar with the correct order 2 reads 37.12, close to each other and a little over half the true peak instead of raw's well-under-half.

Neither smoothed method fully recovers the peak's true height, and the AR(2) coefficients spec.ar() actually fitted explain why: 1.440 and -0.705, close to the true 1.5 and -0.75 but not exact. This particular AR(2) process sits near a boundary where its spectral density forms a sharp, tall peak, and small errors in the fitted coefficients pull that peak down. Fit a model on any one sample and its coefficients come out slightly off the truth, and here that ordinary estimation error is enough to leave even the better methods short of the real answer.

See all four curves together across the whole frequency range.

::widget chart-plotter {"data":[{"x":0.01,"y":16.38,"fill":"theory"},{"x":0.0198,"y":17.58,"fill":"theory"},{"x":0.0296,"y":19.82,"fill":"theory"},{"x":0.0394,"y":23.57,"fill":"theory"},{"x":0.0492,"y":29.67,"fill":"theory"},{"x":0.059,"y":39.35,"fill":"theory"},{"x":0.0688,"y":52.89,"fill":"theory"},{"x":0.0786,"y":63.62,"fill":"theory"},{"x":0.0884,"y":57.03,"fill":"theory"},{"x":0.0982,"y":38.23,"fill":"theory"},{"x":0.108,"y":22.99,"fill":"theory"},{"x":0.1178,"y":13.99,"fill":"theory"},{"x":0.1276,"y":8.92,"fill":"theory"},{"x":0.1373,"y":5.98,"fill":"theory"},{"x":0.1471,"y":4.19,"fill":"theory"},{"x":0.1569,"y":3.04,"fill":"theory"},{"x":0.1667,"y":2.28,"fill":"theory"},{"x":0.1765,"y":1.76,"fill":"theory"},{"x":0.1863,"y":1.38,"fill":"theory"},{"x":0.1961,"y":1.11,"fill":"theory"},{"x":0.2059,"y":0.91,"fill":"theory"},{"x":0.2157,"y":0.75,"fill":"theory"},{"x":0.2255,"y":0.63,"fill":"theory"},{"x":0.2353,"y":0.54,"fill":"theory"},{"x":0.2451,"y":0.46,"fill":"theory"},{"x":0.2549,"y":0.4,"fill":"theory"},{"x":0.2647,"y":0.35,"fill":"theory"},{"x":0.2745,"y":0.31,"fill":"theory"},{"x":0.2843,"y":0.28,"fill":"theory"},{"x":0.2941,"y":0.25,"fill":"theory"},{"x":0.3039,"y":0.23,"fill":"theory"},{"x":0.3137,"y":0.21,"fill":"theory"},{"x":0.3235,"y":0.19,"fill":"theory"},{"x":0.3333,"y":0.18,"fill":"theory"},{"x":0.3431,"y":0.16,"fill":"theory"},{"x":0.3529,"y":0.15,"fill":"theory"},{"x":0.3627,"y":0.14,"fill":"theory"},{"x":0.3724,"y":0.13,"fill":"theory"},{"x":0.3822,"y":0.13,"fill":"theory"},{"x":0.392,"y":0.12,"fill":"theory"},{"x":0.4018,"y":0.12,"fill":"theory"},{"x":0.4116,"y":0.11,"fill":"theory"},{"x":0.4214,"y":0.11,"fill":"theory"},{"x":0.4312,"y":0.1,"fill":"theory"},{"x":0.441,"y":0.1,"fill":"theory"},{"x":0.4508,"y":0.1,"fill":"theory"},{"x":0.4606,"y":0.1,"fill":"theory"},{"x":0.4704,"y":0.1,"fill":"theory"},{"x":0.4802,"y":0.1,"fill":"theory"},{"x":0.49,"y":0.09,"fill":"theory"},{"x":0.01,"y":16.21,"fill":"raw"},{"x":0.0198,"y":1.17,"fill":"raw"},{"x":0.0296,"y":14.43,"fill":"raw"},{"x":0.0394,"y":9.51,"fill":"raw"},{"x":0.0492,"y":18.27,"fill":"raw"},{"x":0.059,"y":23.74,"fill":"raw"},{"x":0.0688,"y":27.46,"fill":"raw"},{"x":0.0786,"y":21.99,"fill":"raw"},{"x":0.0884,"y":38.08,"fill":"raw"},{"x":0.0982,"y":15.87,"fill":"raw"},{"x":0.108,"y":8.4,"fill":"raw"},{"x":0.1178,"y":11.69,"fill":"raw"},{"x":0.1276,"y":4.66,"fill":"raw"},{"x":0.1373,"y":2.62,"fill":"raw"},{"x":0.1471,"y":5.95,"fill":"raw"},{"x":0.1569,"y":4.63,"fill":"raw"},{"x":0.1667,"y":3.14,"fill":"raw"},{"x":0.1765,"y":1.45,"fill":"raw"},{"x":0.1863,"y":0.64,"fill":"raw"},{"x":0.1961,"y":0.31,"fill":"raw"},{"x":0.2059,"y":2.52,"fill":"raw"},{"x":0.2157,"y":1.19,"fill":"raw"},{"x":0.2255,"y":0.81,"fill":"raw"},{"x":0.2353,"y":0.6,"fill":"raw"},{"x":0.2451,"y":1.02,"fill":"raw"},{"x":0.2549,"y":0.44,"fill":"raw"},{"x":0.2647,"y":0.1,"fill":"raw"},{"x":0.2745,"y":0.77,"fill":"raw"},{"x":0.2843,"y":0.13,"fill":"raw"},{"x":0.2941,"y":0.35,"fill":"raw"},{"x":0.3039,"y":0.19,"fill":"raw"},{"x":0.3137,"y":0.11,"fill":"raw"},{"x":0.3235,"y":0.89,"fill":"raw"},{"x":0.3333,"y":0.15,"fill":"raw"},{"x":0.3431,"y":0.03,"fill":"raw"},{"x":0.3529,"y":0.06,"fill":"raw"},{"x":0.3627,"y":0.25,"fill":"raw"},{"x":0.3724,"y":0.11,"fill":"raw"},{"x":0.3822,"y":0.08,"fill":"raw"},{"x":0.392,"y":0.19,"fill":"raw"},{"x":0.4018,"y":0.03,"fill":"raw"},{"x":0.4116,"y":0.03,"fill":"raw"},{"x":0.4214,"y":0.16,"fill":"raw"},{"x":0.4312,"y":0.2,"fill":"raw"},{"x":0.441,"y":0.01,"fill":"raw"},{"x":0.4508,"y":0.03,"fill":"raw"},{"x":0.4606,"y":0.11,"fill":"raw"},{"x":0.4704,"y":0.14,"fill":"raw"},{"x":0.4802,"y":0.16,"fill":"raw"},{"x":0.49,"y":0.04,"fill":"raw"},{"x":0.01,"y":5.49,"fill":"span 9"},{"x":0.0198,"y":8.86,"fill":"span 9"},{"x":0.0296,"y":10.03,"fill":"span 9"},{"x":0.0394,"y":16.46,"fill":"span 9"},{"x":0.0492,"y":22.17,"fill":"span 9"},{"x":0.059,"y":38,"fill":"span 9"},{"x":0.0688,"y":46.22,"fill":"span 9"},{"x":0.0786,"y":41.04,"fill":"span 9"},{"x":0.0884,"y":27.85,"fill":"span 9"},{"x":0.0982,"y":21.13,"fill":"span 9"},{"x":0.108,"y":13.87,"fill":"span 9"},{"x":0.1178,"y":9,"fill":"span 9"},{"x":0.1276,"y":6.61,"fill":"span 9"},{"x":0.1373,"y":5.22,"fill":"span 9"},{"x":0.1471,"y":4.21,"fill":"span 9"},{"x":0.1569,"y":3.67,"fill":"span 9"},{"x":0.1667,"y":2.73,"fill":"span 9"},{"x":0.1765,"y":1.56,"fill":"span 9"},{"x":0.1863,"y":0.94,"fill":"span 9"},{"x":0.1961,"y":0.97,"fill":"span 9"},{"x":0.2059,"y":1,"fill":"span 9"},{"x":0.2157,"y":1.08,"fill":"span 9"},{"x":0.2255,"y":0.71,"fill":"span 9"},{"x":0.2353,"y":0.64,"fill":"span 9"},{"x":0.2451,"y":0.59,"fill":"span 9"},{"x":0.2549,"y":0.49,"fill":"span 9"},{"x":0.2647,"y":0.37,"fill":"span 9"},{"x":0.2745,"y":0.26,"fill":"span 9"},{"x":0.2843,"y":0.3,"fill":"span 9"},{"x":0.2941,"y":0.21,"fill":"span 9"},{"x":0.3039,"y":0.17,"fill":"span 9"},{"x":0.3137,"y":0.2,"fill":"span 9"},{"x":0.3235,"y":0.2,"fill":"span 9"},{"x":0.3333,"y":0.21,"fill":"span 9"},{"x":0.3431,"y":0.11,"fill":"span 9"},{"x":0.3529,"y":0.15,"fill":"span 9"},{"x":0.3627,"y":0.14,"fill":"span 9"},{"x":0.3724,"y":0.12,"fill":"span 9"},{"x":0.3822,"y":0.13,"fill":"span 9"},{"x":0.392,"y":0.12,"fill":"span 9"},{"x":0.4018,"y":0.1,"fill":"span 9"},{"x":0.4116,"y":0.07,"fill":"span 9"},{"x":0.4214,"y":0.11,"fill":"span 9"},{"x":0.4312,"y":0.11,"fill":"span 9"},{"x":0.441,"y":0.08,"fill":"span 9"},{"x":0.4508,"y":0.06,"fill":"span 9"},{"x":0.4606,"y":0.09,"fill":"span 9"},{"x":0.4704,"y":0.1,"fill":"span 9"},{"x":0.4802,"y":0.08,"fill":"span 9"},{"x":0.49,"y":0.07,"fill":"span 9"},{"x":0.01,"y":12.5,"fill":"spec.ar"},{"x":0.0198,"y":13.28,"fill":"spec.ar"},{"x":0.0296,"y":14.7,"fill":"spec.ar"},{"x":0.0394,"y":16.99,"fill":"spec.ar"},{"x":0.0492,"y":20.48,"fill":"spec.ar"},{"x":0.059,"y":25.52,"fill":"spec.ar"},{"x":0.0688,"y":31.84,"fill":"spec.ar"},{"x":0.0786,"y":36.8,"fill":"spec.ar"},{"x":0.0884,"y":35.31,"fill":"spec.ar"},{"x":0.0982,"y":27.14,"fill":"spec.ar"},{"x":0.108,"y":18.24,"fill":"spec.ar"},{"x":0.1178,"y":11.85,"fill":"spec.ar"},{"x":0.1276,"y":7.83,"fill":"spec.ar"},{"x":0.1373,"y":5.35,"fill":"spec.ar"},{"x":0.1471,"y":3.79,"fill":"spec.ar"},{"x":0.1569,"y":2.77,"fill":"spec.ar"},{"x":0.1667,"y":2.08,"fill":"spec.ar"},{"x":0.1765,"y":1.61,"fill":"spec.ar"},{"x":0.1863,"y":1.27,"fill":"spec.ar"},{"x":0.1961,"y":1.02,"fill":"spec.ar"},{"x":0.2059,"y":0.83,"fill":"spec.ar"},{"x":0.2157,"y":0.69,"fill":"spec.ar"},{"x":0.2255,"y":0.58,"fill":"spec.ar"},{"x":0.2353,"y":0.49,"fill":"spec.ar"},{"x":0.2451,"y":0.43,"fill":"spec.ar"},{"x":0.2549,"y":0.37,"fill":"spec.ar"},{"x":0.2647,"y":0.33,"fill":"spec.ar"},{"x":0.2745,"y":0.29,"fill":"spec.ar"},{"x":0.2843,"y":0.26,"fill":"spec.ar"},{"x":0.2941,"y":0.23,"fill":"spec.ar"},{"x":0.3039,"y":0.21,"fill":"spec.ar"},{"x":0.3137,"y":0.19,"fill":"spec.ar"},{"x":0.3235,"y":0.17,"fill":"spec.ar"},{"x":0.3333,"y":0.16,"fill":"spec.ar"},{"x":0.3431,"y":0.15,"fill":"spec.ar"},{"x":0.3529,"y":0.14,"fill":"spec.ar"},{"x":0.3627,"y":0.13,"fill":"spec.ar"},{"x":0.3724,"y":0.12,"fill":"spec.ar"},{"x":0.3822,"y":0.12,"fill":"spec.ar"},{"x":0.392,"y":0.11,"fill":"spec.ar"},{"x":0.4018,"y":0.11,"fill":"spec.ar"},{"x":0.4116,"y":0.1,"fill":"spec.ar"},{"x":0.4214,"y":0.1,"fill":"spec.ar"},{"x":0.4312,"y":0.1,"fill":"spec.ar"},{"x":0.441,"y":0.09,"fill":"spec.ar"},{"x":0.4508,"y":0.09,"fill":"spec.ar"},{"x":0.4606,"y":0.09,"fill":"spec.ar"},{"x":0.4704,"y":0.09,"fill":"spec.ar"},{"x":0.4802,"y":0.09,"fill":"spec.ar"},{"x":0.49,"y":0.09,"fill":"spec.ar"}],"geoms":["line","point"],"x":"frequency","y":"spectral_density","code":{"line":"ggplot(ar2_estimates, aes(frequency, spectral_density, colour = group)) +\n  geom_line(linewidth = 1)","point":"ggplot(ar2_estimates, aes(frequency, spectral_density, colour = group)) +\n  geom_point()"}}

Both smoothed curves track the true curve's general shape far better than the raw periodogram does, rising and falling roughly where it does. But right at the peak, where it matters most, both still sit below the true curve. A smoothed spectral estimate is far more useful than a raw one, and it is still not the same thing as the truth.

=== step === concept
## What a spectral confidence band's coverage claim assumes

A few steps back, a 95% confidence interval came straight out of a chi-squared formula, and that formula rested on one assumption worth stating plainly: it treats the ordinates feeding into a smoothed estimate as behaving close to independently of each other. For a series with only mild dependence between nearby time points, that assumption is a reasonable one. For a series like the AR(2) here, where each value leans heavily on its own last two values, that assumption is under real strain.

The widget below doesn't build periodogram ordinates. It runs the same kind of failure on a plainer case: a straight-line trend fitted with ordinary least squares, with its errors allowed to correlate with their own recent past, the way a series trending over time often does. Drag the dial from no correlation to strong correlation and watch two numbers, R-squared, which measures how well the fitted line matches the data, and the interval's real coverage, the share of many repeated studies whose stated 95% interval actually contains the true value.

::widget assumption-dial {"assumption": "autocorrelation"}

Press Run on the code beneath the widget, and R reproduces this experiment for real: 60 points on a trend line, correlated errors with phi = 0.92, 2,000 repeats. It returns coverage 0.324 against the 95% the interval claims, while R-squared sits at 0.630. Change sev <- 1 to sev <- 0 in that same code, the way its own comment invites you to, and rerun it: coverage jumps back up to 0.949, right where 95% should be, while R-squared actually falls slightly, to 0.505.

The fit did not get better when the interval broke. It got slightly, misleadingly better-looking. This is the same failure mode the confidence interval built earlier is exposed to, just easier to see here.

When the ordinates behind a smoothed spectral estimate are not close to independent, because the series itself has strong short-range dependence like this lesson's AR(2), the stated coverage of an interval like span 5's 1,804.0 to 12,494.0 can be worse than 95% in practice, even though nothing about the fitted curve looks wrong. Widening the span further doesn't repair this, since a wider span only trades bias for variance under the same independence assumption. It doesn't make the assumption true.

=== step === quiz
## Closing quiz: what a smoothed spectral estimate does and does not tell you

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The interval's stated 95% coverage is exact, since it comes straight from the chi-squared distribution with the reported degrees of freedom. ::no
- If nearby ordinates are strongly dependent, the interval's real coverage can fall below the stated 95%, and widening the span further would not fix that, since the underlying chi-squared math still assumes the ordinates behave close to independently. ::ok Right. The chi-squared confidence interval assumes nearby ordinates behave close to independently. When the series itself has strong short-range dependence, that assumption breaks, and the stated 95% coverage can run below what it promises, even though the fitted curve barely moves. A wider span only trades bias for variance under that same assumption. It doesn't repair a broken one.
- Widening the span to something larger, like 15, would restore the promised coverage no matter how dependent the underlying series is. ::no
- The interval only describes the point estimate itself, and says nothing about how much to trust it. ::no A stated 95% interval is a promise about how often intervals built this same way would actually contain the true value, and that promise rests on the chi-squared math's assumption that nearby ordinates behave close to independently. When a series has strong short-range dependence, like the AR(2) in this lesson, that assumption can break, and the real coverage can sit under 95% even while the fitted curve barely moves. Choosing a wider span does not fix this. It only trades more bias for less variance under the same independence assumption, it does not make that assumption true.

=== step === tryit
## Your turn: check an estimate against the AR(2) theory

theo_spec(), pg_ar2_s9 and ar2_fit all still exist from earlier steps. Evaluate the true spectral density at frequency 0.15, then read both estimates' nearest values at that same frequency, side by side.

```r
# theo_spec(), pg_ar2_s9 and ar2_fit already exist from earlier steps.
# Line 1: evaluate theo_spec() at frequency 0.15 with phi1 = 1.5,
# phi2 = -0.75, sigma2 = 1
# Line 2: print pg_ar2_s9's and ar2_fit's nearest values to that
# same frequency, side by side
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*theo_spec[(]\\s*0\\.15)(?=[\\s\\S]*pg_ar2_s9)(?=[\\s\\S]*ar2_fit)", "gate": true, "difficulty": "beginner", "ok": "Right: theory reads 3.80 at frequency 0.15, span 9 reads 4.36 and spec.ar reads 3.41, both still in the right neighborhood of the true curve out on its tail.", "no": "Call theo_spec(0.15, 1.5, -0.75, 1) for the theoretical value, then index pg_ar2_s9$spec and ar2_fit$spec at whichever frequency in each is nearest 0.15, using which.min(abs(... $freq - 0.15))."}
::solution
```r
# Evaluate the true spectral density at 0.15, then read both estimates there
theo_spec(0.15, 1.5, -0.75, 1)
c(daniell_span9 = pg_ar2_s9$spec[which.min(abs(pg_ar2_s9$freq - 0.15))],
  spec_ar        = ar2_fit$spec[which.min(abs(ar2_fit$freq - 0.15))])
#> [1] 3.800808
#> daniell_span9       spec_ar 
#>      4.362461      3.410539 
```

=== step === concept
## References

- [Shumway, R.H. & Stoffer, D.S. (2017), Time Series Analysis and Its Applications (4th ed.)](https://www.stat.pitt.edu/stoffer/tsa4/) - Springer, Ch. 4 "Spectral Analysis and Filtering": Daniell kernels, smoothed spectral estimation, and confidence intervals for a spectral density.
- [Chatfield, C. (2003), The Analysis of Time Series: An Introduction (6th ed.)](https://www.routledge.com/The-Analysis-of-Time-Series-An-Introduction-with-R/Chatfield-Xing/p/book/9781498706954) - Chapman & Hall/CRC, Ch. 7 "Spectral Analysis": smoothing the periodogram and the autoregressive spectral estimate.
- Priestley, M.B. (1981), "Spectral Analysis and Time Series", Academic Press: kernel spectral estimation and its bias-variance trade-off.
- [Venables, W.N. & Ripley, B.D. (2002), Modern Applied Statistics with S (4th ed.)](http://www.stats.ox.ac.uk/pub/MASS4/) - Springer, Ch. 14 "Time Series Analysis": background for spec.pgram() and spec.ar().
- [R documentation, stats::spec.pgram() and stats::spec.ar()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/spec.pgram.html)

=== step === complete
## Quick recap

You now have two working ways to turn a noisy periodogram into a usable estimate of the spectral density, and a clear sense of what neither one promises. To summarize:

- A Daniell kernel smooths a periodogram by averaging neighboring ordinates inside a span. A wider span buys a higher degrees of freedom and a steadier number, at the cost of blending real peaks into their neighbors and shrinking them.
- spec.ar() sidesteps the span question entirely. It fits an autoregressive model, chosen by AIC, and evaluates that model's own spectral density formula.
- Checked against a known AR(2) truth, both smoothed methods landed closer to the real peak than a raw periodogram ever could, 37.44 and 37.12 against 63.98, but neither fully recovered it, since the fitted coefficients were themselves only estimates.
- A smoothed ordinate's confidence interval assumes nearby ordinates behave close to independently. When a series has strong short-range dependence, that assumption strains, and the interval's real coverage can fall under what it promises even while the fitted curve looks fine.

Next, you'll turn this same frequency picture into a tool for filtering a series itself, not just describing it.
