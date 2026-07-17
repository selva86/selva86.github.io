---
title: "Moving Averages in R: Simple, Weighted, and Exponential"
slug: "Moving-Averages-in-R"
description: "Moving averages smooth a time series by averaging nearby values. Learn simple, weighted and exponential moving averages in R, with runnable code and plots."
keywords: "moving average in R, simple moving average R, weighted moving average R, exponential moving average R, ma function R, rolling mean R, smooth time series R, centred moving average"
auto_link_terms: "moving average|moving averages|moving average in R|simple moving average|weighted moving average|exponential moving average|centred moving average|centered moving average|rolling mean|rolling average|2x12-MA|smooth a time series|trailing moving average|window length|moving average window"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "3.8.6"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Moving Averages"
sidebar_order: 8
difficulty: "Beginner"
---

<p class="lead">A moving average replaces each value in a series with an average of the values around it. The wiggle cancels out and the trend survives, so you can finally see the shape of the thing. The three versions differ only in how much weight each neighbour gets: a <b>simple</b> moving average gives every value in the window the same weight, a <b>weighted</b> moving average lets you set the weights yourself, and an <b>exponential</b> moving average lets the weight fade smoothly the further back you go. This post builds all three by hand on one dataset, checks each against R's built-in functions to the last decimal, and shows you the four ways they mislead you.</p>

Everything below uses one dataset, so you always have something concrete to picture.

**`AirPassengers`** ships with R. It is the monthly total of international airline passengers, in **thousands**, from **January 1949 to December 1960**. That is 144 numbers. It starts at 112 thousand passengers in January 1949 and ends above 600 thousand by 1960, and it has a loud yearly cycle: summer is always busy, November is always quiet. It is the same series used in [Visualize Time Series in R](Visualize-Time-Series-in-R.html) and [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html), so if you have read those, you already know the data.

One month in it will do most of the work in this post: **July 1949**. Hold on to that month. The number R gives you for it is not the number you will expect, and understanding the gap is most of what there is to understand about moving averages.

## What does a moving average actually do?

The raw monthly data jumps around so much that the growth is hard to see: every summer spike is followed by a winter dip, and the eye keeps getting dragged into the zigzag. A moving average smooths that away. For each month, take the twelve months centred on it and use their average in place of the raw value. A full year in every window means every window contains exactly one busy July and one quiet November, so the yearly cycle cancels itself out and what is left is the growth.

Here is the whole idea, working, before any explanation.

```r title="Smooth the airline series and see the trend"
suppressMessages(library(forecast))

# AirPassengers: monthly airline passengers in thousands, Jan 1949 to Dec 1960.
window(AirPassengers, start = c(1949, 1), end = c(1949, 12))
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1949 112 118 132 129 121 135 148 148 136 119 104 118

# Replace each month by an average of the twelve months centred on it.
trend <- ma(AirPassengers, order = 12)

window(trend, start = c(1949, 1), end = c(1949, 12))
#>           Jan      Feb      Mar      Apr      May      Jun      Jul      Aug      Sep      Oct
#> 1949       NA       NA       NA       NA       NA       NA 126.7917 127.2500 127.9583 128.5833
#>           Nov      Dec
#> 1949 129.0000 129.7500

plot(AirPassengers, col = "grey65", xlab = "year", ylab = "passengers (thousands)",
     main = "AirPassengers, and a 12-month moving average through it")
lines(trend, col = "tomato", lwd = 3)
legend("topleft", legend = c("monthly data", "12-month moving average"),
       col = c("grey65", "tomato"), lwd = c(1, 3), bty = "n")
```

Read the output row by row. The first line loads the `forecast` package, which gives us `ma()`, the function that computes moving averages. The `window()` call is just a way of asking a time series for one slice of itself; here it prints the twelve months of 1949 so you can see the raw data. The airline carried 112 thousand passengers in January, climbed to 148 in July, and fell back to 104 by November. That November dip is the yearly cycle, not a decline in the business.

Then `ma(AirPassengers, order = 12)` did the smoothing. `order = 12` is the **window length**: how many months go into each average. The result is another time series, one value per month, and printing 1949's twelve values shows two things worth noticing straight away.

The first is the `NA`s. January through June came back empty. A window of twelve months centred on January would have to reach back into 1948, and 1948 is not in the data, so R returns `NA` rather than inventing numbers. You lose months at each end. That is not a flaw in the code, it is a property of the method, and section 3 puts an exact number on the loss.

The second is the numbers themselves. July 1949 came back as **126.7917**. The raw July value was 148, and the smoothed value is much lower because July is one of the busiest months and the average pulls it back toward the rest of the year. The plot makes the point better than any number: the grey line saws up and down twelve times a year, and the red line walks calmly through the middle of it, climbing from about 127 to over 470. The airline business grew roughly four-fold in eleven years, and now you can see it.

> **Note:** The plot has no `NA` gap in the middle, only at the two ends, where the red line starts six months in and stops six months early. Keep an eye on the right-hand end of that red line. It stops in mid-1960 even though the data runs to December. Section 8 is about why that missing piece is the expensive one.

Hold on to **126.7917**. In section 4 we will compute the average of those first twelve months by hand. The answer will not match, and the reason why is the most useful thing in this post.

## How is a simple moving average computed?

Start with the simplest possible version and make the window small enough to check by hand. A **simple moving average** of order \(m\) replaces the value at time \(t\) with the plain, unweighted average of the \(m\) values centred on \(t\):

$$ \hat{T}_t = \frac{1}{m} \sum_{j=-k}^{k} y_{t+j}, \qquad k = \frac{m-1}{2} $$

Every symbol in that line, in words. \(y_{t+j}\) is the observed value \(j\) steps away from month \(t\) (so \(y_{t-1}\) is last month, \(y_{t+1}\) is next month, and \(y_t\) is the month itself). \(\hat{T}_t\) is the smoothed value at month \(t\); the hat means "estimate of" and the \(T\) stands for trend, because the trend is what we are trying to estimate. \(m\) is the window length, the number of values we average. \(k\) is the **half-width**: how far the window reaches on each side, which is \((m-1)/2\). The \(\sum_{j=-k}^{k}\) means "add up the values from \(k\) steps before to \(k\) steps after", and dividing by \(m\) turns that sum into an average. That is the entire formula. "Simple" means every value in the window is divided by the same \(m\), so every value counts the same.

Notice that \(k = (m-1)/2\) is only a whole number when \(m\) is odd. With \(m = 3\), \(k = 1\): reach one month back, one month forward. That is why we start with an odd window.

![How a 3-month moving average slides across 1949](screenshots/Moving-Averages-in-R-window.webp)
*Figure 1: A 3-month moving average walking across the first months of 1949. Each window drops its oldest value and picks up the next one. January has no month before it, so its window never fills and it comes back NA.*

Now check the diagram against R.

```r title="A 3-month moving average, verified by hand"
y <- as.numeric(AirPassengers)   # the 144 values, with the dates stripped off
y[1:5]
#> [1] 112 118 132 129 121

ma3 <- ma(AirPassengers, order = 3)
as.numeric(ma3)[1:5]
#> [1]       NA 120.6667 126.3333 127.3333 128.3333

# The second value should be the plain average of the first three months.
mean(y[1:3])
#> [1] 120.6667
```

Walk through it. `as.numeric()` throws away the date information and leaves a plain vector of 144 numbers, which makes it easy to grab values by position: `y[1]` is January 1949, `y[2]` is February, and so on. The first five are 112, 118, 132, 129, 121.

Then `ma(AirPassengers, order = 3)` computes the 3-month moving average. Its first value is `NA`, exactly as the diagram predicted: the window centred on January needs December 1948. Its second value, the one centred on February, is 120.6667. And `mean(y[1:3])`, the plain average of January, February and March that you could do on a calculator, is **also 120.6667**. Same number. The function is not doing anything mysterious; it is doing what you would do by hand, 144 times, quickly.

The window length is not special either. Widen it to five and the same logic holds.

```r title="The same idea with a wider window"
mean(y[1:5])
#> [1] 122.4

as.numeric(ma(AirPassengers, order = 5))[1:5]
#> [1]    NA    NA 122.4 127.0 133.0
```

With `order = 5`, \(k = (5-1)/2 = 2\), so the window reaches two months each way. Now the first **two** values are `NA` instead of one, and the third value (centred on March, the first month with two months on each side) is 122.4, which is exactly `mean(y[1:5])`. Widen the window, lose more at the edges, get a smoother line. That trade is the whole of the next section.

## What window length should you use?

The window length \(m\) is the only choice a simple moving average asks you to make, and it controls one trade-off. A short window follows the data closely, so it reacts quickly to real changes but keeps a lot of the noise. A long window averages more values together, so it is smoother and more stable but it blurs real turning points and it costs you more months at each end. There is no universally correct \(m\); there is only the \(m\) that matches what you want the smooth line to *mean*.

Look at three of them on the same series.

```r title="Three window lengths on the same data"
ma12 <- ma(AirPassengers, order = 12)
ma25 <- ma(AirPassengers, order = 25)

# How many values does each one lose?
sapply(list(m3 = ma3, m12 = ma12, m25 = ma25), function(s) sum(is.na(s)))
#>  m3 m12 m25
#>   2  12  24

plot(AirPassengers, col = "grey75", xlab = "year", ylab = "passengers (thousands)",
     main = "Short windows follow the data, long windows flatten it")
lines(ma3,  col = "darkgreen", lwd = 2)
lines(ma12, col = "tomato",    lwd = 3)
lines(ma25, col = "steelblue", lwd = 2)
legend("topleft", legend = c("order 3", "order 12", "order 25"),
       col = c("darkgreen", "tomato", "steelblue"), lwd = c(2, 3, 2), bty = "n")
```

The `sapply()` line counts the `NA`s in each smoothed series, and the counts are not random. For an odd window the rule is \(2k = m - 1\) values lost in total, \(k\) at the start and \(k\) at the end: order 3 loses 1 each way, and order 25 loses 12 each way, a full year at each end of an eleven-year series.

Order 12 breaks that pattern, and the 12 in the middle column is worth a second look, because \(m - 1\) predicts 11. An even window has no middle month to sit on, so R has to do something slightly different with it, and that something costs one extra value. Section 4 is entirely about what it does and why. For now just note the even-order rule: you lose \(m\) values, \(m/2\) at each end, which is why the red line back in section 1 started six months in and stopped six months early.

On the plot, the three lines behave exactly as the trade-off predicts. The dark green order-3 line still zigzags: a 3-month window is far shorter than the 12-month cycle, so the seasonal swing survives the smoothing almost intact. The red order-12 line is smooth, because averaging a full year cancels the yearly cycle. The blue order-25 line is smoother still, but it starts a year late, ends a year early, and has flattened the growth spurts that the red line shows honestly.

That gives a rule that is better than any number: **match the window to the cycle you want to remove.** Monthly data with a yearly cycle wants \(m = 12\). Quarterly data with a yearly cycle wants \(m = 4\). Daily data with a weekly cycle wants \(m = 7\). If your window is not a whole number of cycles, part of the cycle leaks through and the smooth line will still wobble, which is exactly what the order-3 line is doing.

> **Watch out:** A window of 12 does not remove a yearly cycle from *quarterly* data, it removes a three-year cycle. The window is counted in **observations**, not months. Ask `frequency(x)` if you are not sure how many observations a cycle takes; for `AirPassengers` it returns 12.

**Try it:** Compute a 7-month moving average of `AirPassengers` and count its `NA`s before you run it. The formula says \(m - 1\) values are lost in total.

```r title="Your turn: a 7-month window"
ex_ma7 <- ma(AirPassengers, order = 7)

# 1. Work out m - 1 on paper first, then run sum(is.na(ex_ma7)) to check
# 2. Use head(as.numeric(ex_ma7), 4) to see which position holds the first real value
```

<details><summary>Click to reveal solution</summary>

```r title="7-month window solution"
ex_ma7 <- ma(AirPassengers, order = 7)
sum(is.na(ex_ma7))
#> [1] 6

# 3 lost at the start, 3 at the end
head(as.numeric(ex_ma7), 4)
#> [1]       NA       NA       NA 127.8571
```

Six `NA`s, which is \(m - 1 = 7 - 1\), split as \(k = 3\) at each end. The first real value sits at position 4, the first month with three months on each side of it. Note that a 7-month window on monthly data is not a whole number of years, so this smooth line will still carry some of the seasonal wobble.

</details>

## Why does an even-order moving average need a second pass?

Everything so far used an odd window, and there was a reason. Look again at the formula: \(k = (m-1)/2\). For \(m = 12\) that gives \(k = 5.5\). You cannot reach 5.5 months back. An even window has no middle observation to sit on, which is a real problem, because the most useful window on monthly data is exactly the even one: 12.

Here is what it looks like. We know from section 1 that R gave July 1949 the value 126.7917. Let us just take the plain average of the first twelve months and compare.

```r title="The plain 12-month average, versus what R returned"
mean(y[1:12])       # the simple average of Jan through Dec 1949
#> [1] 126.6667

as.numeric(ma12)[7] # what ma(order = 12) returned for July 1949
#> [1] 126.7917
```

Those are different numbers. Not a rounding artifact, not a bug: 126.6667 and 126.7917 differ by 0.125, and the difference is real. **`ma(x, order = 12)` does not return the average of twelve months.** If you have been describing your `ma(order = 12)` output to colleagues as "the 12-month average", you have been describing something else. Here is what it actually did.

The problem is placement. The average of January through December 1949 is centred on the midpoint of that span, which falls between June and July, not on any month. So R computes **two** such averages, one that leans early and one that leans late, then averages the pair to land back on a real month.

```r title="What ma() is really doing to an even window"
# centre = FALSE gives the raw, uncentred even-order average
ma12_off <- ma(AirPassengers, order = 12, centre = FALSE)
as.numeric(ma12_off)[6:7]
#> [1] 126.6667 126.9167

mean(y[1:12])   # Jan..Dec, sits between Jun and Jul
#> [1] 126.6667
mean(y[2:13])   # Feb..Jan 1950, sits between Jul and Aug
#> [1] 126.9167

# Average the two, and you land exactly on July
(mean(y[1:12]) + mean(y[2:13])) / 2
#> [1] 126.7917
```

That is the whole trick, and the numbers line it up perfectly. `mean(y[1:12])` = 126.6667 sits half a month before July. `mean(y[2:13])` = 126.9167 sits half a month after July. Average those two and you get **126.7917**, which is exactly the number R gave for July 1949 in section 1. A 12-month average, then a 2-month average of the result. That is why this is called a **2x12-MA**, said "two by twelve": a 2-MA of a 12-MA. The `centre = TRUE` default is doing the second pass for you silently.

> **Note:** This is not an obscure detail. The 2x12-MA is the standard way to extract a trend from monthly data and it is exactly the first step of classical decomposition, which is why [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) opens with the same 2x12 window. Any even season length needs the same fix: quarterly data uses a 2x4-MA, and half-hourly data with a daily cycle uses a 2x48-MA.

The important consequence is that the 2x12-MA is **no longer a simple moving average.** Averaging two overlapping windows means January 1949 and January 1950 each got counted once, while every month in between got counted twice. The values are not equally weighted anymore. Which raises the obvious question.

## What is a weighted moving average?

A **weighted moving average** drops the requirement that every value in the window counts the same. Instead of dividing everything by \(m\), you hand each position its own weight:

$$ \hat{T}_t = \sum_{j=-k}^{k} a_j \, y_{t+j}, \qquad \sum_{j=-k}^{k} a_j = 1 $$

\(a_j\) is the weight given to the value \(j\) steps from the centre. The condition that the weights add up to 1 is what keeps the smooth line on the same scale as the data: if the weights summed to 2, your smoothed series would come out roughly twice as high as the series it smooths. The simple moving average is just the special case where every \(a_j\) equals \(1/m\), which of course adds up to 1.

Now we can write the 2x12-MA down as one set of weights. The two overlapping 12-month windows share eleven months and disagree on two, so the eleven shared months get the full \(1/12\) and the two end months get half of that, \(1/24\), each.

```r title="The 2x12-MA written as thirteen weights"
w212 <- c(0.5, rep(1, 11), 0.5) / 12
round(w212, 4)
#>  [1] 0.0417 0.0833 0.0833 0.0833 0.0833 0.0833 0.0833 0.0833 0.0833 0.0833 0.0833 0.0833 0.0417

sum(w212)
#> [1] 1

# Apply the weights by hand to the first thirteen months
sum(y[1:13] * w212)
#> [1] 126.7917
```

Thirteen weights, not twelve, because the window now reaches six months each way plus the centre month. The two outer weights are 0.0417 (that is \(1/24\)) and the eleven inner ones are 0.0833 (that is \(1/12\)). They sum to exactly 1: \(2 \times \frac{1}{24} + 11 \times \frac{1}{12} = \frac{1}{12} + \frac{11}{12} = 1\). And multiplying the first thirteen months by those weights and adding up gives **126.7917** again, the third independent route to the same number. `ma(order = 12)` was a weighted moving average all along.

Base R will apply any weight vector you like with `stats::filter()`, which is the general engine underneath all of this.

```r title="filter() applies any weights you give it"
wma <- stats::filter(AirPassengers, filter = w212, sides = 2)
as.numeric(wma)[7]
#> [1] 126.7917

# Does it match forecast::ma() across all 144 months?
all.equal(as.numeric(wma), as.numeric(ma12))
#> [1] TRUE

# And equal weights reproduce the simple moving average exactly
all.equal(as.numeric(stats::filter(AirPassengers, filter = rep(1/5, 5), sides = 2)),
          as.numeric(ma(AirPassengers, order = 5)))
#> [1] TRUE
```

`stats::filter()` takes the series, a vector of weights (`filter =`), and `sides = 2`, which means "centre the window on each point" as opposed to `sides = 1`, which only looks backward. The `all.equal()` calls check every one of the 144 values, not just July, and both return `TRUE`. So `forecast::ma(x, order = 12)` and `stats::filter(x, w212, sides = 2)` are the same computation with a friendlier name, and a simple moving average is genuinely just a weighted one with boring weights.

> **Note:** `filter()` exists in both `stats` and `dplyr`, and they do completely unrelated things. If you have loaded the tidyverse, plain `filter(x, ...)` will try to filter rows and give you a confusing error. Writing `stats::filter()` explicitly, as above, keeps the ambiguity away.

## What is an exponential moving average?

Both averages so far have a hard edge. A 12-month window treats every month inside it as relevant and the first month outside it as worth nothing at all. Nothing in the world works that way; relevance fades, it does not fall off a cliff. An **exponential moving average** replaces the cliff with a slope, and it does it with a formula short enough to memorise:

$$ s_t = \alpha \, y_t + (1 - \alpha)\, s_{t-1} $$

\(s_t\) is the smoothed value at time \(t\), \(y_t\) is the new observation, and \(s_{t-1}\) is the smoothed value you already had from last time. \(\alpha\) (alpha) is a number between 0 and 1 called the **smoothing parameter**, and it is the only knob. Read the formula in English: *the new smooth value is a blend of the new observation and the old smooth value, with \(\alpha\) deciding how much you trust the news.* Set \(\alpha = 0.9\) and the line chases every jump. Set \(\alpha = 0.05\) and it barely notices.

The formula refers to itself: \(s_t\) depends on \(s_{t-1}\), which depends on \(s_{t-2}\). That is called **recursive**, and it means we need somewhere to start. The usual choice is to set \(s_1 = y_1\), the first smooth value equals the first observation, and let it settle from there. Write it as a loop and it is six lines.

```r title="An exponential moving average, written out in full"
ema <- function(y, alpha) {
  s <- numeric(length(y))
  s[1] <- y[1]                                     # start the level at the first observation
  for (t in 2:length(y)) {
    s[t] <- alpha * y[t] + (1 - alpha) * s[t - 1]  # blend: alpha news, (1-alpha) memory
  }
  s
}

e20 <- ema(y, alpha = 0.2)
round(e20[1:6], 4)
#> [1] 112.0000 113.2000 116.9600 119.3680 119.6944 122.7555
```

Check the first two values against the formula by hand. \(s_1 = y_1 = 112\), which matches. Then \(s_2 = 0.2 \times y_2 + 0.8 \times s_1 = 0.2 \times 118 + 0.8 \times 112 = 23.6 + 89.6 = 113.2\), which also matches. February's reading was 118, but the smooth line only moved from 112 to 113.2, because with \(\alpha = 0.2\) it takes 20% of the news and keeps 80% of what it already believed.

Base R has the same recursion built in, which is worth knowing because the loop above gets slow on long series.

```r title="The same thing, using the built-in recursive filter"
e20_fast <- c(y[1], stats::filter(0.2 * y[-1], filter = 0.8,
                                  method = "recursive", init = y[1]))
all.equal(e20, as.numeric(e20_fast))
#> [1] TRUE

# And notice what is NOT here
sum(is.na(e20))
#> [1] 0
```

`method = "recursive"` tells `filter()` to feed its own output back in rather than slide a window, and `init` sets the starting value. It agrees with the hand-written loop on all 144 values.

The second result is the one to care about: **zero `NA`s**. No warm-up at the start, and nothing missing at the end. Every centred moving average in this post handed back `NA`s at both edges; the exponential moving average has a value for every single month, including December 1960, because it never needs to look forward.

So where did the "exponential" go? It is hiding in the recursion. Unroll the formula and each old observation reappears with its weight multiplied by \((1-\alpha)\) one more time:

$$ s_t = \alpha \sum_{j=0}^{t-2} (1-\alpha)^j \, y_{t-j} \;+\; (1-\alpha)^{t-1} y_1 $$

The weight on the observation \(j\) steps back is \(\alpha(1-\alpha)^j\), which shrinks by a constant factor at every step. That is exactly what "exponential decay" means, and you can just print it.

```r title="The weights decay geometrically and still sum to 1"
j <- 0:9
round(0.2 * 0.8^j, 5)
#>  [1] 0.20000 0.16000 0.12800 0.10240 0.08192 0.06554 0.05243 0.04194 0.03355 0.02684

# Every observation ever recorded gets some weight, and they add up to 1
sum(0.2 * 0.8^(0:500))
#> [1] 1
```

This month gets 20% of the weight, last month 16%, the month before 12.8%, each one 0.8 times the one before it. Ten months back still gets 2.7%, and the weight never actually reaches zero, it just gets too small to matter. So an exponential moving average has an **infinite window**: it uses every observation that ever happened, but it forgets them smoothly. And the weights sum to 1, so the same scale rule from section 5 holds.

```r title="What alpha does to the smooth line"
alphas <- c(0.05, 0.2, 0.6)
cols <- c("darkgreen", "tomato", "steelblue")

plot(AirPassengers, col = "grey75", xlab = "year", ylab = "passengers (thousands)",
     main = "One knob: alpha decides how much the line trusts the news")
for (i in seq_along(alphas)) {
  smoothed <- ema(y, alpha = alphas[i])
  lines(ts(smoothed, start = c(1949, 1), frequency = 12), col = cols[i], lwd = 2)
}
legend("topleft", legend = paste("alpha =", alphas), col = cols, lwd = 2, bty = "n")
```

The loop calls `ema()` at each alpha and wraps the plain numeric result back into a time series with `ts(..., start = c(1949, 1), frequency = 12)` so it lines up on the year axis. The three lines separate cleanly. At \(\alpha = 0.05\) the green line is very smooth and very late, still climbing out of the 1950s when the data has already spiked. At \(\alpha = 0.6\) the blue line hugs the data so tightly that it has kept most of the seasonal zigzag, which is exactly what we were trying to remove. At \(\alpha = 0.2\) the red line sits in between, following the growth without copying every summer.

> **Watch out:** No alpha gives you what a 12-month window gives you. Geometric weights never cover a whole seasonal cycle evenly, so some of the yearly swing always survives. An exponential moving average is a good way to track a **level**; it is a poor way to strip out a **season**. That is what the 2x12-MA is for, and it is why this is a choice about your goal rather than a contest.

**Try it:** Pick an alpha and predict what happens before you run it. What does `ema(y, alpha = 1)` return, and why?

```r title="Your turn: the extreme case"
ex_e1 <- ema(y, alpha = 1)

# 1. Put alpha = 1 into s[t] = alpha * y[t] + (1 - alpha) * s[t-1] and simplify
# 2. Then check your answer with all.equal(ex_e1, y)
```

<details><summary>Click to reveal solution</summary>

```r title="alpha = 1 solution"
ex_e1 <- ema(y, alpha = 1)
all.equal(ex_e1, y)
#> [1] TRUE
```

With \(\alpha = 1\) the formula becomes \(s_t = 1 \times y_t + 0 \times s_{t-1} = y_t\). The line takes 100% of the news and keeps none of its memory, so the "smoothed" series is the raw series, unchanged. The other extreme, \(\alpha = 0\), gives \(s_t = s_{t-1}\) forever, a flat line stuck at \(y_1 = 112\) that ignores the data entirely. Every useful alpha lives strictly between those two failures, and most practical values fall between 0.05 and 0.3.

</details>

## How do the three compare on the same series?

We now have three smoothers built and verified on one dataset. Put them on one plot, and put their weights on another, because the weights are what actually distinguishes them.

```r title="The three smoothers, and the three weight profiles"
par(mfrow = c(1, 2), mar = c(4, 4, 3, 1))

plot(AirPassengers, col = "grey75", xlab = "year", ylab = "passengers (thousands)",
     main = "Three smoothers")
lines(ma3,  col = "darkgreen", lwd = 2)
lines(ma12, col = "tomato", lwd = 3)
lines(ts(e20, start = c(1949, 1), frequency = 12), col = "steelblue", lwd = 2)
legend("topleft", legend = c("simple 3-MA", "2x12-MA", "EMA, alpha = 0.2"),
       col = c("darkgreen", "tomato", "steelblue"), lwd = 2, bty = "n")

# The weights, which is where the real difference lives
off <- -7:7
w_simple13 <- ifelse(abs(off) <= 6, 1/13, 0)
w_2x12     <- ifelse(abs(off) == 6, 1/24, ifelse(abs(off) <= 5, 1/12, 0))
plot(off, w_simple13, type = "h", lwd = 5, col = "grey55", ylim = c(0, 0.1),
     xlab = "months from the centre", ylab = "weight", main = "Weight profiles")
points(off + 0.3, w_2x12, type = "h", lwd = 5, col = "tomato")
points(0:7, 0.2 * 0.8^(0:7), type = "h", lwd = 5, col = "steelblue")
legend("topleft", legend = c("simple 13-MA", "2x12-MA", "EMA, alpha = 0.2"),
       fill = c("grey55", "tomato", "steelblue"), bty = "n", cex = 0.8)

par(mfrow = c(1, 1))
```

`par(mfrow = c(1, 2))` splits the drawing area into one row of two panels, and the last line puts it back to normal so later plots are not squeezed. On the left panel, the green 3-MA still zigzags, the red 2x12-MA is the clean trend, and the blue EMA sits between them and lags behind the red one whenever the series turns.

The right panel is the summary of this whole post. The grey bars are flat: a simple 13-MA gives every month in the window \(1/13\) and everything outside it zero. The red bars are flat too except at \(\pm 6\), where they drop to half height: that is the 2x12 fix from section 4, drawn. The blue bars start high at lag 0 and decay to the right, never quite reaching zero and never reaching into the future at all. Flat, flat-with-clipped-corners, and decaying. That is the difference.

![Which moving average should you use](screenshots/Moving-Averages-in-R-choose.webp)
*Figure 2: Choosing a moving average is a question about the job, not about which one is best. The last box is the one people forget: every centred moving average leaves you blind at exactly the end of the series you care about most.*

If you work with financial data you will meet these same three under different names in the `TTR` package, which is the standard toolkit for that world. It is not available in the browser, so run this one locally.

```r-static title="The same three in TTR (run this locally)"
library(TTR)

head(SMA(y, n = 3), 5)          # simple
#> [1]       NA       NA 120.6667 126.3333 127.3333

head(WMA(y, n = 3), 5)          # weighted, linearly declining weights by default
#> [1]       NA       NA 124.0000 128.1667 125.5000

head(EMA(y, n = 5), 7)          # exponential, alpha = 2/(n+1)
#> [1]       NA       NA       NA       NA 122.4000 126.6000 133.7333
```

Two differences are worth naming so they do not surprise you. First, `TTR` smoothers are **trailing**, not centred: `SMA(y, n = 3)` puts the average of the first three months at position 3, not at position 2 where `ma()` put it. Traders cannot use next week's price, so the whole package looks backward only. Second, `EMA` seeds itself with the simple average of the first `n` values rather than with \(y_1\), which is why it starts with four `NA`s and then 122.4, the same number as `mean(y[1:5])` from section 2. Different seeding conventions, same recursion. Neither is wrong; just know which one you are using before you compare two people's numbers.

## Where do moving averages mislead you?

A moving average is a very cheap way to see a trend, and cheap tools have edges. There are four ways this one cuts.

**It turns late.** A trailing moving average, the kind every dashboard and trading rule uses, only looks backward, so it reports the middle of the window as though it were now. Its output is systematically old by \(k = (m-1)/2\) periods. This is not a subtle effect and you can measure it exactly.

```r title="Measuring the lag of a trailing moving average"
# A clean sine wave with a known peak, so we can see the shift exactly
tt <- 1:200
wave <- ts(sin(2 * pi * tt / 40))

trail11 <- stats::filter(wave, filter = rep(1/11, 11), sides = 1)  # backward only
cent11  <- stats::filter(wave, filter = rep(1/11, 11), sides = 2)  # centred

which.max(wave[1:40])      # where the real peak is
#> [1] 10
which.max(trail11[1:40])   # where the trailing MA says it is
#> [1] 15
which.max(cent11[1:40])    # where the centred MA says it is
#> [1] 10
```

The signal is a sine wave with a period of 40, so its first peak is at 10, and `which.max()` confirms it. The centred moving average finds the peak at 10 as well: dead on. The trailing one reports it at **15**, five periods late, which is exactly \(k = (11-1)/2 = 5\). If that were a daily series, your dashboard would announce the peak five days after it happened, every time. The lag is a property of the method, not bad luck, so you can subtract it if you know it. This is the strongest argument for the exponential moving average in live monitoring: it also lags, but for a given amount of smoothing it lags less, because its weight is concentrated on recent values instead of spread evenly across the window.

**It goes blind exactly where you need it.** The `NA`s at the right-hand edge are not cosmetic. They fall on the most recent months, which are the ones anyone actually wants to know about.

```r title="The end of the series is where the trend is missing"
tail(as.numeric(ma12), 8)
#> [1] 472.7500 475.0417       NA       NA       NA       NA       NA       NA

tail(as.numeric(e20), 3)
#> [1] 501.2970 479.0376 469.6301
```

The 2x12-MA's last real value is at July 1960; the final six months come back `NA`. Someone standing in December 1960 asking "what is the trend right now?" gets nothing. The exponential moving average answers all the way to the last month, which is most of why it is the one that ends up in production dashboards. The other standard answer is to use a method built to reach the edge, such as the STL decomposition in [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html), which estimates the trend at both ends rather than giving up.

**It manufactures cycles that are not there.** This is the one that catches people. Smoothing pure random noise produces a wandering line with what look like real cycles in it, because neighbouring windows share most of their values and are therefore correlated by construction. It is called the Slutsky-Yule effect, and it has been generating fake business cycles since the 1920s.

```r title="There is nothing here, and yet"
set.seed(42)
noise <- ts(rnorm(300))                                        # pure noise, no trend, no cycle
smooth_noise <- stats::filter(noise, filter = rep(1/24, 24), sides = 2)

plot(noise, col = "grey80", xlab = "time", ylab = "value",
     main = "A 24-point moving average of pure random noise")
lines(smooth_noise, col = "tomato", lwd = 3)
abline(h = 0, lty = 2)
```

`rnorm(300)` draws 300 independent random numbers. There is no trend and no cycle: each value is unrelated to the one before it. But the red line does not look like nothing. It swings above and below zero in slow, smooth arcs that a person would happily describe as a multi-year cycle, and if you saw it on a slide with a business label attached you would believe it. The wave is entirely an artifact of the smoothing. Any two neighbouring windows share 23 of their 24 values, so consecutive smoothed points are almost forced to be similar, and that manufactured stickiness is what your eye reads as a cycle. **A smooth line is not evidence of a real pattern.**

**It cannot forecast.** A moving average has no opinion about the future. Extending one means either stopping at the last value and drawing a flat line, or feeding it its own output, which just decays toward a constant. Either way it ignores the trend and the season, which for `AirPassengers` are the only two things that matter. The exponential moving average is the interesting case here: it is the computational core of **simple exponential smoothing**, a genuine forecasting method, but that method's forecast is still a flat line, and it only becomes useful once trend and seasonal terms are bolted on top. That is the Holt-Winters and ETS family, and it is where this section of the site goes next. If you want to predict next month, start at [Time Series Forecasting in R](Time-Series-Forecasting-With-R.html) rather than extending a moving average.

## Practice Exercises

### Exercise 1: The 2x4-MA for quarterly data

Section 4 built the 2x12-MA for monthly data. Quarterly data has an even season length too, so it needs the same fix with \(m = 4\). Work out the five weights by the same logic (two overlapping 4-quarter windows, so the shared quarters get the full weight and the two end quarters get half), then confirm they reproduce `ma(order = 4)` exactly. Use `UKgas`, a quarterly series that ships with R.

```r title="Exercise 1 starter"
# 1. Build the weight vector: c(0.5, 1, 1, 1, 0.5) / 4
# 2. Check that it sums to 1
# 3. Compare stats::filter(UKgas, filter = w24, sides = 2) with ma(UKgas, order = 4)
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
w24 <- c(0.5, 1, 1, 1, 0.5) / 4
w24
#> [1] 0.125 0.250 0.250 0.250 0.125

sum(w24)
#> [1] 1

all.equal(as.numeric(stats::filter(UKgas, filter = w24, sides = 2)),
          as.numeric(ma(UKgas, order = 4)))
#> [1] TRUE
```

Five weights for a 4-quarter season, exactly as thirteen weights covered a 12-month season: the window reaches \(m/2 = 2\) quarters each way plus the centre. The three inner quarters get \(1/4 = 0.25\) and the two outer ones get \(1/8 = 0.125\), summing to 1. It matches `ma(order = 4)` on every value. The pattern generalises to any even \(m\): half weights on the two ends, full weights on everything between.

</details>

### Exercise 2: Does the alpha rule of thumb do what people say?

You will often see the rule \(\alpha = 2/(m+1)\) offered as the way to make an exponential moving average "equivalent" to a simple \(m\)-period one. Compute that alpha for \(m = 12\), build both smoothers on `AirPassengers`, and compare their roughness with `sd(diff(.))`, which measures how much the smooth line jumps from one month to the next. Do they come out equivalent? If not, what is the rule actually equalising?

```r title="Exercise 2 starter"
# 1. alpha <- 2 / (12 + 1)
# 2. Build ema(y, alpha) and compare with ma12
# 3. Roughness: sd(diff(x)) on each, and on the raw y for reference
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
2 / (12 + 1)
#> [1] 0.1538462

e_rule <- ema(y, alpha = 2 / 13)

round(sd(diff(y)), 3)                      # the raw series
#> [1] 33.754
round(sd(diff(e_rule)), 3)                 # EMA with the rule-of-thumb alpha
#> [1] 7.153
round(sd(diff(ma12[!is.na(ma12)])), 3)     # the 2x12-MA
#> [1] 1.376
```

They are not equivalent, and not by a little: the 2x12-MA is about five times smoother than the exponential moving average the rule told you was its equal. The rule is not wrong, it is answering a different question. What it equalises is the **average age** of the data in the smoother, and that part is exact:

```r title="What the rule actually matches"
(12 - 1) / 2          # average age of the data in a simple 12-period MA
#> [1] 5.5

(1 - 2/13) / (2/13)   # average age of the data in an EMA with alpha = 2/13
#> [1] 5.5
```

Both smoothers are looking at data that is on average 5.5 months old, so they are equally *delayed*. They are not equally *smooth*, because smoothness here comes from something else: twelve equal weights spanning exactly one seasonal cycle cancel the yearly swing perfectly, while geometric weights never cover a whole cycle evenly, so the swing leaks through. The rule of thumb is a fine way to match responsiveness. It is not a way to match seasonal cancellation, and only one of these two smoothers can do that at all.

</details>

### Exercise 3: Trailing or centred?

Section 8 said a trailing moving average lags but reaches the edge, while a centred one is on time but goes blind at both ends. Build a 12-month trailing moving average of `AirPassengers` with `stats::filter(..., sides = 1)` and check that claim: count the `NA`s at each end and compare with the centred `ma12`. Then decide which one belongs in a dashboard that answers "how are we doing this month?"

```r title="Exercise 3 starter"
trail12 <- stats::filter(AirPassengers, filter = rep(1/12, 12), sides = 1)

# 1. How many NAs in total? Where are they?
# 2. Confirm trail12[12] equals mean(y[1:12])
# 3. Count NAs in the LAST 6 months of trail12 and of ma12
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
trail12 <- stats::filter(AirPassengers, filter = rep(1/12, 12), sides = 1)

sum(is.na(trail12))
#> [1] 11

as.numeric(trail12)[12]   # the first month with 12 months behind it
#> [1] 126.6667
mean(y[1:12])
#> [1] 126.6667

sum(is.na(tail(as.numeric(trail12), 6)))   # trailing: NAs in the last 6 months
#> [1] 0
sum(is.na(tail(as.numeric(ma12), 6)))      # centred: NAs in the last 6 months
#> [1] 6
```

The trailing version loses 11 values, all of them at the **start**, and its first real value at December 1949 is `mean(y[1:12])`, the plain average of the twelve months up to and including that one. Nothing is missing at the end: it has a value for December 1960. The centred `ma12` is missing all six of the final months.

So for a dashboard, the trailing version is the only one of the two that can answer the question at all, and you accept that its answer describes roughly six months ago (\(k = 5.5\)) rather than now. The centred version is the right choice when you are studying history and the end of the series is not where the interest is. If you need both currency and low lag, that is the argument for an exponential moving average, which has no `NA`s anywhere and concentrates its weight on recent months.

</details>

## FAQ

**Is a moving average the same as the MA in ARIMA?**

No, and this is the single most common confusion in time series. The moving average in this post is a smoother: it averages nearby **observations** to reveal a trend. The MA(q) part of an ARIMA model is a model component that regresses the series on past **forecast errors**, which are not observations and are not something you can see in the data. They share a name for historical reasons and almost nothing else. When you fit `arima(x, order = c(0, 0, 2))` you are not smoothing anything.

**Should I use a centred or a trailing moving average?**

Centred if you are describing the past, trailing if you are tracking the present. A centred average is on time but cannot see the last \(k\) periods, which makes it right for analysis and useless for monitoring. A trailing average always has a value for right now, but that value describes the middle of its window, so it is old by \(k\) periods. Exercise 3 measures both effects.

**How do I choose alpha for an exponential moving average?**

Three ways, in increasing order of rigour. Pick it by feel from a plot like the one in section 6, which is fine for a chart. Use \(\alpha = 2/(m+1)\) to match the responsiveness of an \(m\)-period simple average, which is the trader's convention (see Exercise 2 for what it really guarantees). Or estimate it from the data by minimising the sum of squared one-step-ahead errors, which is what `forecast::ses()` does when you leave `alpha` unset, and which is the right answer whenever you plan to forecast rather than just draw.

**Can I forecast with a moving average?**

Not usefully. A moving average has no mechanism for extrapolation, so the honest forecast is a flat line at the last value, which ignores both trend and season. Its exponential cousin is the engine inside simple exponential smoothing, a real forecasting method, but that method also forecasts a flat line until you add trend and seasonal terms. Those additions are Holt-Winters and ETS, and that is the next stop in this section.

**Why does `ma(x, order = 12)` not equal the mean of 12 months?**

Because with an even window there is no middle month to put the answer on, so `ma()` averages two overlapping 12-month windows to land back on a real month. That makes it a weighted average with half weights on the two end months, a 2x12-MA. Section 4 shows the three numbers side by side: 126.6667 for the plain mean, 126.9167 for the shifted mean, and 126.7917 for their average, which is what `ma()` returns. Pass `centre = FALSE` if you genuinely want the uncentred version.

**What about `zoo::rollmean()` or `TTR::SMA()`?**

They compute the same simple moving average with different defaults, and the defaults are where people get burned. `zoo::rollmean(x, k)` is centred for odd `k` and needs `fill = NA` if you want the output to stay the same length as the input. `TTR::SMA(x, n)` is trailing, because it was written for financial data where looking forward is cheating. Before comparing two people's moving averages, check three things: the window length, whether it is centred or trailing, and how the ends are handled.

## Summary

A moving average replaces each value with an average of its neighbours. All three versions in this post are the same operation with different weights, and the weights are the only thing that ever really changes.

| | Simple MA | Weighted MA (2xm) | Exponential MA |
|---|---|---|---|
| Weights | all equal, \(1/m\) | your choice, must sum to 1 | \(\alpha(1-\alpha)^j\), decaying |
| Window | fixed, \(m\) values | fixed, \(m+1\) values | infinite, fades out |
| R call | `ma(x, order = m)` | `stats::filter(x, w, sides = 2)` | `stats::filter(a*x, 1-a, method = "recursive")` |
| Knob | \(m\) | the weight vector | \(\alpha\) |
| Values lost | \(m-1\), split across both ends | \(m\), split across both ends | none |
| Best at | describing the past with an order everyone understands | stripping an even-length season out of a trend | tracking a live level with no edge blindness |
| Fails at | even season lengths | nothing, if the weights are right | cancelling a season |

The five things worth carrying away:

1. **`ma(x, order = 12)` is not the average of 12 months.** It is a 2x12-MA, a weighted average with half weights on the two end months, because an even window has no centre. July 1949 is 126.7917, not 126.6667.
2. **Match the window to the cycle you want to remove**, and count it in observations, not months. Monthly data with a yearly cycle wants 12; quarterly wants 4; daily with a weekly cycle wants 7.
3. **Every centred moving average costs you \((m-1)/2\) values at each end**, and the ones at the right-hand end are the recent months you care about most.
4. **A trailing moving average is old by \((m-1)/2\) periods**, exactly and measurably. Section 8 catches an 11-period trailing average reporting a peak five periods late.
5. **A smooth line is not evidence of a pattern.** Smoothing pure noise produces convincing cycles that are entirely an artifact of the overlapping windows.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., section 3.3 "Moving averages". The clearest published treatment of m-MAs and the 2xm-MA, and the source of the notation used here. [otexts.com/fpp3/moving-averages.html](https://otexts.com/fpp3/moving-averages.html)
2. `forecast::ma()` reference. Documents the `centre` argument that silently turns an even-order average into a 2xm-MA. [pkg.robjhyndman.com/forecast/reference/ma.html](https://pkg.robjhyndman.com/forecast/reference/ma.html)
3. `stats::filter()` reference. The base R engine for both convolution (windowed) and recursive (exponential) filters, including the `sides` argument. [stat.ethz.ch/R-manual/R-devel/library/stats/html/filter.html](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/filter.html)
4. NIST/SEMATECH *e-Handbook of Statistical Methods*, section 6.4.2 on single exponential smoothing. Works the recursion through by hand and derives the geometric weights. [itl.nist.gov/div898/handbook/pmc/section4/pmc431.htm](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc431.htm)
5. `TTR` package vignette. The financial toolkit's `SMA`, `WMA` and `EMA`, all trailing by convention. [cran.r-project.org/web/packages/TTR/TTR.pdf](https://cran.r-project.org/web/packages/TTR/TTR.pdf)
6. `zoo` package vignette on rolling functions. `rollmean()` and `rollapply()`, and the `fill` and `align` arguments that decide how the ends behave. [cran.r-project.org/web/packages/zoo/vignettes/zoo.pdf](https://cran.r-project.org/web/packages/zoo/vignettes/zoo.pdf)
7. Slutsky, E. "The Summation of Random Causes as the Source of Cyclic Processes." *Econometrica* 5(2), 1937. The original demonstration that averaging random shocks manufactures convincing cycles, which is what section 8 reproduces with `rnorm()`. The paper is paywalled on JSTOR; background and the effect's later name are at [Eugen Slutsky](https://en.wikipedia.org/wiki/Eugen_Slutsky)

## Continue Learning

- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) puts the 2x12-MA from section 4 to work. Classical decomposition's first step is exactly the moving average you just built, and STL is the answer to the endpoint problem in section 8.
- [Visualize Time Series in R](Visualize-Time-Series-in-R.html) covers the plots to draw before you smooth anything, on the same `AirPassengers` series. The season and subseries plots show you the cycle that tells you what window length to pick.
- [Time Series Objects in R](Time-Series-Objects-in-R.html) explains the `ts` object, `frequency()` and `window()` used throughout this post, and why a series with gaps in it breaks every method here.
