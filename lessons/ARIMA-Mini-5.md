---
title: "Test stationarity: ADF, KPSS, and when to difference"
slug: "ARIMA-Mini-5"
description: "A climbing series breaks the assumption every forecast rests on. Run ADF and KPSS on real data, settle their disagreements, and difference only when it helps."
keywords: "test stationarity, ADF test in R, KPSS test in R, adf.test, kpss.test, unit root, differencing in R, ndiffs, trend stationary, stationarity test"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "5"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-4"
course_next: ""
curriculum_id: "0.0.24"
lesson_access: "windowed"
catalog_blurb: "How to tell whether a series needs differencing, and when it does not."
---

=== step === cover
::eyebrow ARIMA from Zero
## Test stationarity: ADF, KPSS, and when to difference

Let's say you advise an analytics startup, and its dashboard carries five years of monthly revenue. January 2021 came in at 48.4 thousand dollars, and December 2025 came in at 213.4.

They want a forecast for next year. So you fit a model and it hands back a number with a tidy interval around it.

That number is nonsense, and the model has no way of telling you so.

Here is why. Almost every forecasting model assumes the series has settled down, that its average level and the size of its month-to-month wobble are the same in 2025 as they were in 2021. This startup's revenue breaks that on the first look. Every year sits higher than the one before it, so the average worked out from all 60 months describes no month in particular, and what the model learned from 2021 was never going to describe 2026.

The word for a series that has settled down is **stationary**. You do not have to judge it by eye, because two tests do the job properly.

::widget process-flow {"steps":[{"title":"Say what stationary means","sub":"three rules, and which one your series breaks"},{"title":"Run both tests","sub":"ADF and KPSS ask opposite questions, so read them differently"},{"title":"Difference and re-test","sub":"model the change instead of the level, then prove it worked"}]}

We will do all three on the startup's own numbers, and end on the decision that actually matters: does the series in front of you need differencing, or would differencing it make things worse?

=== step === concept
## Five years of a startup's monthly revenue

Let's get the actual series on the table, because everything from here on runs on these 60 numbers.

The startup bills monthly and records revenue in thousands of dollars. `ts()` wraps a plain vector into a time series object that carries its own calendar, so R knows the first value is January 2021 and that a year holds 12 observations. That is what `frequency = 12` says.

Press Run.

```r
# Build the startup's 60 months of revenue and look at the two ends
suppressMessages(library(tseries))
suppressMessages(library(forecast))

set.seed(20)
revenue <- ts(round(40 + cumsum(rnorm(60, mean = 3.2, sd = 4.5)), 1),
              start = c(2021, 1), frequency = 12)

c(months = length(revenue), first = revenue[1], last = revenue[60])
#> months  first   last 
#>   60.0   48.4  213.4 
```

`set.seed(20)` just fixes the random draws, so your series matches mine.

The line worth reading twice is `cumsum()`. It adds each month's change onto the running total, which is how revenue actually builds up: January's 48.4 became February's figure by adding whatever February brought in, and February's became March's the same way, sixty times over.

Now look at it.

```r
# Plot the revenue series month by month
plot(revenue, main = "Monthly revenue, January 2021 to December 2025",
     ylab = "Revenue (thousands of dollars)", xlab = "Year")
```

You get a line climbing from 48.4 to 213.4, wandering on the way up rather than following a ruler. That climb is the problem. Now let's name it properly.

=== step === concept
## What stationary actually means

Before you test for something, it helps to be able to say what that something is.

A series is **stationary** when its statistical behaviour does not depend on when you look at it. Put strictly, three conditions have to hold:

1. **Constant mean.** The long-run average is one fixed number, the same whether you measure it over 2021 or over 2025.
2. **Constant variance.** The size of the wobble around that average neither grows nor shrinks over time.
3. **Autocovariance depends only on the gap.** How strongly this month relates to a month k steps away depends on k alone, not on which month you started counting from.

Notice what is not on that list. A stationary series does not have to be flat, or boring, or free of pattern. It has to be anchored, which is a weaker and far more useful requirement.

Each rule fails in its own way. A climb breaks rule 1, because the average keeps moving. Swings that grow with the level break rule 2. A yearly cycle breaks rule 1 as well, since July's average is not January's.

For the first two rules we do not need a test at all. Cut the five years in half and compare the halves.

```r
# Compare the first half of the revenue series against the second half
first_half  <- window(revenue, start = c(2021, 1), end = c(2023, 6))
second_half <- window(revenue, start = c(2023, 7), end = c(2025, 12))

round(c(mean_first_30 = mean(first_half), mean_last_30 = mean(second_half)), 1)
#> mean_first_30  mean_last_30 
#>          75.6         153.3 

round(c(sd_first_30 = sd(first_half), sd_last_30 = sd(second_half)), 1)
#> sd_first_30  sd_last_30 
#>        19.8        33.9 
```

`window()` pulls a date range out of a time series object, and you write the range as `c(year, month)`, so `c(2023, 7)` means July 2023.

Average monthly revenue roughly doubled across the two halves, from 75.6 thousand to 153.3 thousand. Rule 1 is gone. The standard deviation went from 19.8 to 33.9, so the series does not just sit higher in the later years, it swings harder there as well. Rule 2 goes with it.

Hand someone six months of this series with the dates stripped off and the level alone would tell them which half it came from, almost every time. That is exactly what stationarity rules out.

=== step === quiz
## Quick check: which of these series is stationary?

Three of these four break one of the three rules. Which one does not?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Daily temperature in one city over ten years, swinging from summer highs to winter lows and back every year. ::no
- A factory's monthly reject rate, sitting around 2.1 percent for ten years with random ups and downs either side of it. ::ok That is the one. The rate is never exactly 2.1 percent in any given month, yet it always has 2.1 percent to come back to, and it wobbles about as much in year ten as in year one. Anchored, not flat.
- A country's population, recorded once a year, rising in every year on record. ::no
- A stock price over five years, which is famously unpredictable and looks like pure randomness. ::no Three of these break the anchor in different ways. The temperature series has no single average, because July's average is not January's. The population climbs, so the average keeps moving. The stock price is the sneakiest of the three: being unpredictable is not the same as being anchored, and a price that wanders wherever the last move left it has no home level at all.

=== step === concept
## What a unit root is

The two tests do not check those three rules directly. They hunt for something narrower, and once you can see what they are hunting for, both outputs become readable.

Start with the simplest useful model of a series, where this month's value is a fraction of last month's value plus a fresh random shock:

\[ y_t = \phi \, y_{t-1} + \varepsilon_t \]

In words: \(y_t\) is the value this month, \(y_{t-1}\) is the value last month, \(\varepsilon_t\) is a shock drawn fresh each month with an average of zero (think of it as this month's news), and \(\phi\), the Greek letter phi, is a single number saying how much of the past carries forward.

Everything depends on \(\phi\):

- When \(\phi\) is below 1, each shock fades. A shock this month is worth \(\phi\) of itself next month, \(\phi^2\) the month after, and so on down to nothing. The series has a home level, and it keeps getting pulled back to it.
- When \(\phi\) equals exactly 1, the model becomes \(y_t = y_{t-1} + \varepsilon_t\). Every shock is added to the level and none of it ever fades. The series has no home to return to. This is a random walk, and this case is what is called a **unit root**.

A unit root means shocks are permanent, permanent shocks mean there is no fixed mean, and no fixed mean means rule 1 is broken by construction. What you get instead of a straight line is a **stochastic trend**: the series drifts, but the drift is made of piled-up randomness rather than an underlying line.

The quickest way to see the difference is to hold the shocks still and move only \(\phi\). We can do exactly that, because the startup's revenue was built from 60 particular monthly shocks, and we can draw the same 60 again.

```r
# Replay the startup's own 60 monthly shocks at three values of phi
set.seed(20)
shocks <- rnorm(60, mean = 3.2, sd = 4.5)

replay <- function(phi) {
  y <- numeric(60)
  level <- 40                        # where the series sits before the first shock
  for (i in 1:60) {
    level <- phi * level + shocks[i]
    y[i] <- level
  }
  y
}

phi_06 <- replay(0.6)
phi_09 <- replay(0.9)
phi_10 <- replay(1.0)

round(c(phi_0.6 = mean(tail(phi_06, 24)),
        phi_0.9 = mean(tail(phi_09, 24)),
        phi_1.0 = mean(tail(phi_10, 24))), 1)
#> phi_0.6 phi_0.9 phi_1.0 
#>     9.3    31.6   162.8 
```

Those three numbers are the average level over the final two years. At \(\phi = 0.6\) the series settles around 9.3 and stays there. At \(\phi = 0.9\) it settles around 31.6, higher because more of each shock survives into the next month, but settled all the same. At \(\phi = 1.0\) the 162.8 is not a home level at all. It is just where the series happened to be wandering during those 24 months.

Draw all three together and the difference is obvious.

```r
# Draw the three replays together to compare their shapes
plot(phi_10, type = "l", col = "firebrick", lwd = 2, ylim = c(-10, 220),
     main = "The same 60 shocks, replayed at three values of phi",
     ylab = "Level", xlab = "Month")
lines(phi_09, col = "steelblue", lwd = 2)
lines(phi_06, col = "darkgreen", lwd = 2)
legend("topleft", legend = c("phi = 1.0", "phi = 0.9", "phi = 0.6"),
       col = c("firebrick", "steelblue", "darkgreen"), lwd = 2, bty = "n")
```

The green and blue lines both drop away from where they started and then stay inside a band, the green one around 9 and the blue one around 32, wider because 0.9 keeps more of each shock alive. The red line just leaves. Same shocks, same starting level, and the only thing separating a series that comes home from one that never does is whether \(\phi\) is 0.9 or 1.0.

One thing about that red line is worth checking, because it is why we bothered with the replay at all.

```r
# Check the phi = 1 replay against the revenue series itself
round(c(replay_last = tail(phi_10, 1), revenue_last = revenue[60]), 1)
#> replay_last revenue_last 
#>       213.4        213.4 
```

The red line is not a picture of something like the startup's revenue. It is the startup's revenue, redrawn from its own shocks. That series has a unit root because we built it with one, so we know the right answer before we ask any test for it.

[KEY INSIGHT]
A unit root is not "a series that goes up". It is a series that keeps every shock forever, which is why it has no average to return to. Both tests are hunting for this one thing.

=== step === concept
## How the ADF test asks about a unit root

The Augmented Dickey-Fuller test asks a single question: is \(\phi\) equal to 1?

Rather than estimate \(\phi\) and squint at how close it lands to 1, the test first subtracts \(y_{t-1}\) from both sides of the model. Writing \(\Delta y_t\) for the change from last month to this month, the regression `adf.test()` actually fits is this:

\[ \Delta y_t = \alpha + \beta t + \gamma \, y_{t-1} + \sum_{i=1}^{k} \delta_i \, \Delta y_{t-i} + \varepsilon_t \]

Every symbol in it, in plain words:

- \(\Delta y_t\) is this month's change, the thing being predicted.
- \(\alpha\) is an intercept, a constant level.
- \(\beta t\) is a straight-line trend term, with \(t\) counting months. Hold on to this one.
- \(\gamma\) is the coefficient the whole test is about, and it equals \(\phi - 1\).
- The \(\delta_i \, \Delta y_{t-i}\) terms are \(k\) recent changes: last month's change, the one before it, back \(k\) months. These are the "Augmented" in the name, and they are there to soak up the short-term stickiness that would otherwise contaminate the estimate of \(\gamma\).
- \(\varepsilon_t\) is the leftover error.

Because \(\gamma = \phi - 1\), asking whether \(\phi\) is 1 is the same as asking whether \(\gamma\) is 0. So the null hypothesis, the claim the test starts out assuming and drops only if the data makes it look ridiculous, is \(\gamma = 0\): there IS a unit root, and the series is non-stationary.

That is the sentence to keep. **A small ADF p-value is evidence against a unit root.**

```r
# Ask ADF whether the revenue series has a unit root
adf.test(revenue)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  revenue
#> Dickey-Fuller = -1.8528, Lag order = 3, p-value = 0.6343
#> alternative hypothesis: stationary
```

The Dickey-Fuller number, -1.8528, is the t-statistic on \(\gamma\). The more negative it is, the further \(\gamma\) sits below zero, and the stronger the evidence that \(\phi\) is under 1. This one is barely negative at all, and the p-value of 0.6343 is nowhere near 0.05, so we do not reject the unit root. Which is right, because we built this series with one.

Lag order is that \(k\). `adf.test()` picks it for you as `trunc((n - 1)^(1/3))`, which gives 3 for our 60 months.

[WARNING]
The `alternative hypothesis: stationary` line at the bottom is not the verdict. It is R restating what the alternative was, and it prints identically whether the test rejected or not. Reading that line as the answer is the most common misread of this output.

=== step === concept
## How the KPSS test asks the opposite question

KPSS, named for Kwiatkowski, Phillips, Schmidt and Shin, covers the same ground from the other side. Its null hypothesis is that the series IS stationary, and its alternative is a unit root. That was deliberate: the four authors built it specifically to complement tests like ADF.

Mechanically it regresses the series on its deterministic part, the fixed shape the series is supposed to sit on, then takes the running total of the residuals, which are the gaps left between the series and that shape. If the series really is anchored, those residuals hover around zero and their running total stays small. If the series is wandering, the residuals sit on one side of zero for long stretches and the running total grows. So a big KPSS statistic means a big running total, which is evidence against stationarity.

The sentence for this one runs backwards from ADF's. **A small KPSS p-value is evidence against stationarity.**

```r
# Ask KPSS the opposite question about the same revenue series
kpss.test(revenue)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  revenue
#> KPSS Level = 1.5303, Truncation lag parameter = 3, p-value = 0.01
#> 
#> Warning message:
#> In kpss.test(revenue) : p-value smaller than printed p-value
```

The statistic is 1.5303 with a p-value of 0.01, which is below 0.05, so we reject stationarity. Right again, and from the opposite side.

Two pieces of that output need a word each, because both puzzle people the first time.

**Truncation lag parameter.** The running total is noisy, so before comparing it against a critical value the test scales it by how variable the series is over the long run, and working that out means averaging over a window of nearby lags. The truncation lag is how wide that window is. `kpss.test()` picks it from the sample size as `trunc(4 * (n / 100)^0.25)`, which gives 3 here. It is KPSS's counterpart to ADF's lag order, chosen for you and not something you normally touch.

**That warning.** Neither test computes p-values from a formula. Both look the statistic up in a small printed table and interpolate between the entries. When your statistic falls off the end of that table, R hands back the nearest edge value and warns you that the truth lies further out. So `p-value = 0.01` from these functions means "0.01 or less", and `p-value = 0.1` means "0.1 or more". That is a table limit rather than a failure, and R is being straight with you about it.

=== step === concept
## How to read the two p-values together

Judge both tests at the usual 5 percent level, and hold on to which null each one carries, because that is where every misreading of these two comes from. ADF's null is a unit root, so a small p-value there is good news. KPSS's null is stationarity, so a small p-value there is bad news. Same number, opposite meaning, depending on which function printed it.

That gives four possible pairs, and each one calls for something different.

| ADF | KPSS | What it means | What to do |
|---|---|---|---|
| below 0.05, no unit root | above 0.05, stationarity stands | Both say stationary | Model it as it is. No differencing needed |
| above 0.05, unit root stands | below 0.05, not stationary | Both say non-stationary | Difference it, then re-test |
| below 0.05, no unit root | below 0.05, not stationary | The two were asked different questions | Re-run KPSS with `null = "Trend"` |
| above 0.05, unit root stands | above 0.05, stationarity stands | Neither test can decide | Too little data to tell the two apart |

The top two rows are the tests agreeing, and they are easy. The bottom two are the interesting ones.

The third row is both tests rejecting at once, which looks like a contradiction and is not. The fourth is the one people read as a double confirmation of stationarity. It is not that either. ADF failing to reject means it cannot rule out a unit root, and KPSS failing to reject means it cannot rule out stationarity, so together they are saying your sample is too short or too noisy to tell the two apart. That is a statement about your data, not about your series.

Worth saying plainly, because it applies to ADF on its own too. Failing to reject is not proving. When `adf.test(revenue)` returned 0.6343 it did not prove there is a unit root, it said there was not enough evidence to rule one out. That is the whole reason a second test with the opposite null earns its place.

=== step === quiz
## Quick check: what the two verdicts on revenue mean

ADF came back with a p-value of 0.6343, and KPSS came back with 0.01. What have the two of them said about the startup's revenue?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- They disagree. One p-value is large and the other is small, so the two tests have reached opposite conclusions. ::no
- Both say stationary, since one p-value cleared 0.05 and the other fell below it. ::no
- Both say non-stationary. ADF could not rule out a unit root, and KPSS rejected stationarity outright. ::ok Exactly. The p-values point in opposite directions precisely because the nulls do, so opposite numbers here are the two tests agreeing rather than arguing.
- ADF returned a large p-value, and a large p-value is strong evidence, so ADF is confirming the series is stationary. ::no Every one of these reads a p-value without checking which null it belongs to. ADF's 0.6343 leaves its unit-root null standing, which means non-stationary. KPSS's 0.01 knocks its stationarity null down, which also means non-stationary. And a large p-value is never strong evidence for anything: it only ever means the data gave that test no reason to abandon its null.

=== step === concept
## When both tests reject at once

The startup has a second series on the same dashboard: monthly marketing spend, also in thousands of dollars, also 60 months, also climbing. Run the same check on it.

```r
# Build the startup's monthly marketing spend and look at the two ends
set.seed(19)
spend <- ts(round(12 + 0.9 * (1:60) + rnorm(60, 0, 6), 1),
            start = c(2021, 1), frequency = 12)

c(months = length(spend), first = spend[1], last = spend[60])
#> months  first   last 
#>   60.0    5.8   67.4 
```

Spend went from 5.8 thousand in January 2021 to 67.4 thousand in December 2025, so on the face of it this is the same story as revenue: a series that ends far higher than it started.

```r
# Plot the spend series month by month
plot(spend, main = "Monthly marketing spend, January 2021 to December 2025",
     ylab = "Spend (thousands of dollars)", xlab = "Year")
```

It climbs, it wobbles, and by eye you would be hard pressed to say how it differs from the revenue line. Now run both tests on it.

```r
# Run both stationarity tests on the spend series
adf.test(spend)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  spend
#> Dickey-Fuller = -4.8775, Lag order = 3, p-value = 0.01
#> alternative hypothesis: stationary

kpss.test(spend)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  spend
#> KPSS Level = 1.5744, Truncation lag parameter = 3, p-value = 0.01
```

Read those two literally and they are fighting.

ADF returned 0.01, which is below 0.05, so we reject ADF's null. ADF's null is a unit root, so rejecting it says there is no unit root here and the series looks stationary.

KPSS also returned 0.01, which is below 0.05, so we reject KPSS's null too. KPSS's null is stationarity, so rejecting it says this series is not stationary.

One series, two respected tests, both run correctly, and the answers point in opposite directions. Most walkthroughs never show you this, because they pick an example where it does not happen. On real data it happens all the time, and it is not a bug in either test.

=== step === concept
## Why the disagreement happens: mismatched trend terms

Look again at what each test was actually asked, and the conflict goes away.

`adf.test()` always fits that \(\beta t\) trend term in its regression. You cannot switch it off. So its alternative hypothesis is not "stationary" in general, it is "stationary around a straight-line trend".

`kpss.test()` defaults to `null = "Level"`, which is the "Level" in the `KPSS Test for Level Stationarity` heading it printed. That regresses the series on a constant only. So its null is not "stationary" in general either, it is "stationary around a flat horizontal line".

So on marketing spend, ADF said this is not a random walk, it looks like a trend with tame wobble around it. And KPSS said this is definitely not flat. Both of those are true, and both are obvious once you remember the line climbing from 5.8 to 67.4. The two were never in conflict, because they were never answering the same question.

The `null` argument is what lets you fix that. Setting `null = "Trend"` tells KPSS to regress the series on a constant plus a straight-line trend, exactly the deterministic part ADF assumes, and to test what is left over once that line is taken out.

```r
# Ask KPSS the same question ADF is asking, by allowing a sloped line
kpss.test(spend, null = "Trend")
#> 
#> 	KPSS Test for Trend Stationarity
#> 
#> data:  spend
#> KPSS Trend = 0.05371, Truncation lag parameter = 3, p-value = 0.1
```

The statistic collapses from 1.5744 to 0.05371, a drop of nearly thirty times, and the p-value climbs from 0.01 to 0.1. Give KPSS a sloped line instead of a flat one and it stops rejecting completely.

Now the two agree, and they agree on something specific: marketing spend is not a random walk, it is a series sitting on a real straight line. The contradiction was never about the data. It was about mismatched deterministic terms.

[KEY INSIGHT]
When ADF and KPSS both reject, that is a message rather than a malfunction. Re-run KPSS with `null = "Trend"`. If it stops rejecting, the two agree that your series has a trend and no unit root.

=== step === quiz
## Quick check: what null equals Trend changes

Level KPSS on the spend series gave 1.5744 with p = 0.01. `null = "Trend"` on the very same data gave 0.05371 with p = 0.1. What did that argument change?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It lowers the bar the statistic has to clear, so KPSS becomes a more forgiving test and rejects less often on any series. ::no
- It changes the shape KPSS is allowed to assume the series sits on, from a flat line to a sloped one, so the wobble left over after removing that shape is what gets tested. ::ok Right. The test is just as strict as it was. You handed it a better description of where the series is supposed to sit, and once the slope was accounted for, what remained really was anchored.
- It swaps KPSS's null hypothesis over to a unit root, so KPSS now asks the same question ADF asks. ::no
- It permanently removes the trend from the spend data, so the object is detrended for everything you run afterwards. ::no None of these is what happened. The null stayed exactly what it always was, stationarity, and the test stayed exactly as strict. The `spend` object was never touched either, since the regression happens inside the test. The one thing that moved was the shape the series was allowed to sit on.

=== step === concept
## Differencing, and how many times to do it

Marketing spend needs a line taken out of it. Revenue is the other case, the one with a genuine unit root, and the standard cure for a unit root is **differencing**: replacing each month's level with the change from the month before.

There is a clean reason it works, too. If a series is a random walk, \(y_t = y_{t-1} + \varepsilon_t\), then the change \(\Delta y_t = y_t - y_{t-1}\) is just \(\varepsilon_t\), the shock on its own. Differencing turns a random walk into pure noise, and pure noise is stationary. `diff()` is the function, and the number of times you apply it is called \(d\).

Before trusting it, look at what it does to the actual numbers.

```r
# Difference the revenue series and check the arithmetic against the levels
head(revenue, 3)
#>       Jan  Feb  Mar
#> 2021 48.4 49.0 60.2

d1 <- diff(revenue)
head(d1, 2)
#>      Feb  Mar
#> 2021 0.6 11.2

c(original = length(revenue), differenced = length(d1))
#>    original differenced 
#>          60          59 
```

Put the two outputs side by side and the arithmetic is plain. January was 48.4 and February was 49.0, so February's differenced value is 49.0 minus 48.4, which is 0.6. March was 60.2, giving 60.2 minus 49.0, which is 11.2. The series now describes the change in revenue each month rather than the revenue itself.

Notice the count dropped from 60 to 59, and January 2021 has gone. That is unavoidable and worth knowing. The first month has no month before it to subtract from, so every difference costs you one observation off the front.

You do not have to pick \(d\) by squinting at p-values either. `ndiffs()` runs a stationarity test and reads the verdict. If the verdict is non-stationary it differences the series, tests again, and keeps going until the verdict comes back stationary. Then it reports how many rounds that took.

```r
# Let ndiffs() count the rounds of differencing for you
ndiffs(revenue)
#> [1] 1
```

One difference. That matches what we know, since we built revenue by accumulating shocks exactly once.

=== step === concept
## Did the differencing work?

Never assume a transform worked. Test it. This is the check people skip, and it is the one that catches the interesting problems.

What you want is both tests coming back clean, on a flat-line null, on the transformed series.

```r
# Re-run both tests on the differenced revenue series
adf.test(d1)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  d1
#> Dickey-Fuller = -5.1752, Lag order = 3, p-value = 0.01
#> alternative hypothesis: stationary

kpss.test(d1)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  d1
#> KPSS Level = 0.26014, Truncation lag parameter = 3, p-value = 0.1
```

Both have moved, and both moved the right way.

ADF's statistic went from -1.8528 to -5.1752, and its p-value from 0.6343 down to 0.01, so it now rejects the unit root. KPSS's statistic went from 1.5303 down to 0.26014, and its p-value from 0.01 up to 0.1, so it no longer rejects stationarity. That is the first row of the four: both say stationary, on a flat-line null, and no `null = "Trend"` was needed to get there.

Differencing worked, and now we know it did instead of hoping it did.

[TIP]
Run both tests again on the result of every transform you apply. A transform that fails this check has usually told you something useful about the series, and the cost of finding out is two lines of code.

=== step === tryit
## Your turn: difference the spend series and test it

`spend` still holds the startup's 60 months of marketing spend. Run the whole routine on it yourself: difference it once, then put both tests on the result.

```r
# spend holds 60 months of marketing spend, in thousands of dollars.
# Difference it once, then run both tests on what comes back.
# Three lines. Press Check when you have them.
```
::check {"regex": "diff[(]spend[)]", "gate": true, "difficulty": "beginner", "ok": "That is the pair: ADF at -6.8899 with p = 0.01, and KPSS at 0.046427 with p = 0.1. Both come back clean on a flat-line null, so the differenced spend series is stationary.", "no": "Store the difference first, then feed it to each test: `d_spend <- diff(spend)`, then `adf.test(d_spend)`, then `kpss.test(d_spend)`."}
::solution
```r
# Difference the spend series once, then test the result with both tests
d_spend <- diff(spend)

adf.test(d_spend)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  d_spend
#> Dickey-Fuller = -6.8899, Lag order = 3, p-value = 0.01
#> alternative hypothesis: stationary

kpss.test(d_spend)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  d_spend
#> KPSS Level = 0.046427, Truncation lag parameter = 3, p-value = 0.1
```

Both tests pass, which raises an awkward question, because spend never had a unit root to remove.

=== step === concept
## When differencing is the wrong fix

Differencing spend passed both tests, and it was still the wrong tool. Here is the distinction that explains why.

A **stochastic trend** is accumulated shocks, which is a unit root, which is revenue. The cure is differencing, and a series with one is called **difference stationary**.

A **deterministic trend** is a real underlying line with noise scattered around it. The cure is to subtract that line, which is called **detrending**, and a series like that is called **trend stationary**. Marketing spend is this one, and we have already seen the proof: `null = "Trend"` handed back 0.1, which says that once the line is accounted for, what remains is anchored.

Both cures flatten the series. Where they differ is in what they leave behind, and you can price that difference directly.

```r
# Compare the two ways of flattening spend: take the line out, or difference it
trendfit  <- lm(as.numeric(spend) ~ time(spend))
detrended <- residuals(trendfit)

round(c(sd_detrended = sd(detrended), sd_differenced = sd(diff(spend))), 3)
#>   sd_detrended sd_differenced 
#>          6.155         10.247 
```

`lm(as.numeric(spend) ~ time(spend))` fits a straight line through the series against its own calendar, and `residuals()` keeps what that line did not explain.

Detrending leaves a spread of 6.155. Differencing leaves 10.247, two thirds larger. Both are stationary and both would pass the tests, but the differenced one carries a lot more noise for a model to explain, and every bit of that extra noise widens the forecast intervals you eventually hand to the startup.

Why? Because differencing removed something that was not there. Spend had a line under it rather than a random walk, so subtracting last month from this month threw away a stable relationship and left the month-to-month churn on its own.

[WARNING]
Passing both tests does not mean you chose the right fix. Difference a trend-stationary series and you add noise you never needed. Detrend a difference-stationary series and the line you removed was never really there.

=== step === concept
## Differencing twice is not safer

Since differencing fixes non-stationarity, it is tempting to difference once more for good measure. That instinct costs you.

`d1`, the differenced revenue series, already passed both tests. Ask `ndiffs()` what it thinks, then difference anyway and price the result.

```r
# Ask whether the differenced revenue needs differencing again, then do it anyway
ndiffs(d1)
#> [1] 0

d2 <- diff(d1)
round(c(sd_one_difference = sd(d1), sd_two_differences = sd(d2)), 3)
#>  sd_one_difference sd_two_differences 
#>              4.548              5.945 
```

`ndiffs()` says zero rounds, which is the right answer for a series that is already stationary. Difference it a second time anyway and the standard deviation climbs from 4.548 to 5.945, about 31 percent more spread for a model to account for.

That extra spread is not information. Differencing a series with nothing left to remove subtracts one draw of noise from another draw of noise, and two draws of noise are always more variable than one. It also injects artificial negative autocorrelation, a made-up pattern where a high month is followed by a low one purely because the arithmetic says so. Your model will then go ahead and fit that pattern, which came from your keyboard rather than from the business.

The rule is short. Stop when `ndiffs()` says stop.

=== step === quiz
## Quick check: which verdict pair means difference it?

Four series, four pairs of results, all judged at the 5 percent level. Which pair is the one that calls for differencing?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- ADF returns 0.01 and KPSS returns 0.1. ::no
- ADF returns 0.01 and KPSS returns 0.01. ::no
- ADF returns 0.63 and KPSS returns 0.01. ::ok That is the pair, and it is the pair revenue gave us. ADF cannot rule out a unit root, KPSS rejects stationarity outright, and both point the same way because the nulls are opposite. Difference it, then test again.
- ADF returns 0.63 and KPSS returns 0.1. ::no The other three are each a different situation. ADF 0.01 with KPSS 0.1 is the clean pass on both counts, so leave the series alone. Both at 0.01 is the mismatched-trend case, so re-run KPSS with `null = "Trend"` before touching anything. And ADF 0.63 with KPSS 0.1 is neither test being able to decide, which says your sample is too short or too noisy to tell a unit root from an anchored series.

=== step === tryit
## Your turn: prove what null equals Trend actually does

`kpss.test(spend, null = "Trend")` returned a statistic of 0.05371, and you were told the argument regresses out a straight line and tests what remains. Prove it by doing the regression yourself.

Fit a straight line to `spend` against its own calendar with `lm()`, keep the residuals, and run an ordinary level KPSS on them. If the claim holds, the statistic that comes back should match.

```r
# spend holds 60 months of marketing spend, in thousands of dollars.
# Fit a straight line to it against time(spend), keep the residuals,
# then run an ordinary kpss.test() on those residuals.
# Two lines. Press Check when you have them.
```
::check {"regex": "residuals[(]", "gate": true, "difficulty": "intermediate", "ok": "0.05371, to every digit. That is not a coincidence, it is the definition: null = Trend regresses out a constant and a straight line, then runs the level test on what is left. You just did both halves in the open.", "no": "Fit the line, then test what it left behind: `trendfit <- lm(as.numeric(spend) ~ time(spend))`, then `kpss.test(residuals(trendfit))`."}
::solution
```r
# Detrend spend by hand, then run a level KPSS on what the line left behind
by_hand <- residuals(lm(as.numeric(spend) ~ time(spend)))

kpss.test(by_hand)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  by_hand
#> KPSS Level = 0.05371, Truncation lag parameter = 3, p-value = 0.1
```

Identical to what `null = "Trend"` printed, down to the last digit, because it is the same computation done by hand.

=== step === quiz
## Quick check: when a difference costs more than it fixes

A colleague hands you a series that climbs steadily over four years. ADF returns 0.01, level KPSS returns 0.01, and KPSS with `null = "Trend"` returns 0.1. They want to difference it once anyway, to be safe. What does that difference actually cost?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Nothing worth worrying about. The differenced series will pass both tests, so a spare difference is free. ::no
- It subtracts a straight line that was never a unit root, and leaves behind more spread than detrending would, plus an artificial negative autocorrelation the model will then try to fit. ::ok Exactly right. Those three results say trend stationary: no unit root, but not flat either. The series was already anchored around its line, so differencing removed something real and charged noise for it.
- It breaks the constant-mean rule, because differencing shifts the average of the series away from zero. ::no
- One observation off the front of the series, which is the only price any difference ever charges. ::no The three results together say trend stationary, and the cure for a line is to subtract the line. Passing the tests afterwards proves nothing about whether it was the right move, because an over-differenced series passes them comfortably. The lost observation is real but trivial next to the extra variance and the made-up autocorrelation that come with it.

=== step === concept
## References

- [Distribution of the Estimators for Autoregressive Time Series with a Unit Root](https://doi.org/10.2307/2286348) - Dickey and Fuller (1979), Journal of the American Statistical Association 74(366), 427-431. The original unit-root test, and the source of the critical values `adf.test()` interpolates.
- [Testing the null hypothesis of stationarity against the alternative of a unit root](https://doi.org/10.1016/0304-4076%2892%2990104-Y) - Kwiatkowski, Phillips, Schmidt and Shin (1992), Journal of Econometrics 54(1-3), 159-178. The paper that deliberately flipped the null, and the reasoning behind it.
- [Forecasting: Principles and Practice, section 9.1 Stationarity and differencing](https://otexts.com/fpp3/stationarity.html) - Hyndman and Athanasopoulos. The canonical free treatment of everything on this page.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The unit-root procedure behind `ndiffs()`.
- [tseries reference manual](https://cran.r-project.org/web/packages/tseries/tseries.pdf) - R Core Team. The definitive statement of what `adf.test()` and `kpss.test()` actually fit, including the constant-and-trend regression and the interpolated p-value tables.

=== step === complete
## Quick recap

You took two climbing series off the same dashboard and told them apart properly.

- **Stationary means statistically anchored**, not flat and not boring: constant mean, constant variance, and autocovariance depending only on the gap. Revenue broke the first two on a simple half-by-half comparison, 75.6 against 153.3 and 19.8 against 33.9.
- **A unit root is what both tests hunt for.** At \(\phi = 0.9\) the startup's own shocks settled around 31.6 and stayed. At \(\phi = 1.0\) the identical shocks redrew the revenue line and ended at 213.4, because nothing ever faded.
- **The two nulls are opposite.** ADF's null is a unit root, so small is good news. KPSS's null is stationarity, so small is bad news. Revenue's 0.6343 and 0.01 were the two tests agreeing.
- **Both rejecting at once is a message.** Marketing spend gave 0.01 and 0.01 because `adf.test()` always fits a trend while `kpss.test()` defaults to a flat line. `null = "Trend"` collapsed the statistic to 0.05371, and the conflict went with it.
- **Difference only what needs it, and prove it worked.** `ndiffs()` said one round for revenue, and both tests came back clean on the result. Spend needed a line taken out instead: detrending left a spread of 6.155 where differencing left 10.247, and a spare difference on an already clean series pushed 4.548 up to 5.945.

So when someone asks whether their series needs differencing:

"Run both tests. If ADF leaves the unit root standing and KPSS rejects stationarity, difference it and test again. If both reject, ask KPSS for a trend before you touch the data, because a line comes out with a regression rather than with a difference."

Congratulations, you made it through. Have a great day!
