---
title: "Estimation and the Bootstrap Lesson 2: Maximum likelihood, from the curve up"
catalog_blurb: "See where a maximum likelihood estimate comes from, not just the formula for it."
description: "See how maximum likelihood scores every candidate value of a parameter against real data, then find its peak by eye, by grid search, and by optimise()."
keywords: "maximum likelihood, likelihood function, log-likelihood, maximum likelihood estimation, MLE, optimise, grid search, dbinom, R"
post_type: "LESSON"
curriculum_id: "4.20.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-estimation"
course_title: "Estimation and the Bootstrap"
course_lesson: "2"
course_total: "7"
course_landing: "Estimation-and-the-Bootstrap-Course.html"
course_next: "Matching-Moments-to-Estimate-a-Parameter.html"
course_prev: "Bias-Variance-and-the-Cost-of-an-Estimator.html"
---

=== step === cover
## Maximum likelihood, from the curve up

Today let's work out how to find the one value of an unknown number, hidden somewhere in a process, that explains the data you already collected better than any other value could.

Mia has a coin she suspects is weighted, and she wants to find out by how much. She flips it 40 times and counts the heads: 12 of them. That's 30% heads, 70% tails.

The coin has one unknown number attached to it, the true chance it lands heads, the kind of number statisticians call a parameter. Call it p. Mia doesn't know p. All she has is this one set of 40 flips and the 12 heads inside it.

So here's the question this lesson answers: given that data, 12 heads in 40 flips, which value of p explains it best? Not guessed, not assumed. Found.

It only takes three moves to get there.

::widget process-flow {"steps":[{"title":"40 flips, 12 heads","sub":"the one set of data Mia already has in hand"},{"title":"Score every candidate value of p","sub":"how well would this exact data look under each one"},{"title":"Keep the best-scoring value","sub":"that value is the maximum likelihood estimate"}]}

That's the whole shape of it. Everything from here works through those three moves on Mia's coin, slowly enough to see why each one works.

=== step === concept
## Scoring one candidate value against the data

Let's try something simple first. Pick a value for p and ask: if that value were true, how probable would Mia's actual data, 12 heads out of 40 flips, be?

R already has a function for exactly this. `dbinom(k, n, p)` returns the probability of getting exactly k successes in n independent trials, each with success probability p. Mia's data is k = 12 heads out of n = 40 flips.

Let's score three candidate values of p: 0.1, 0.3 and 0.6.

```r
# Score three candidate values of p against Mia's data: 12 heads in 40 flips
k <- 12
n <- 40
candidates <- c(0.1, 0.3, 0.6)
scores <- dbinom(k, n, candidates)
names(scores) <- candidates
round(scores, 6)
#>      0.1      0.3      0.6 
#> 0.000292 0.136574 0.000088 
```

Look at those three numbers. At p = 0.1, the data you actually saw, 12 heads, would be a near-impossible outcome: a score of 0.000292. At p = 0.6 it's even less likely: 0.000088. But at p = 0.3, the exact same data scores 0.136574: hundreds of times higher than 0.1's score, and well over a thousand times higher than 0.6's.

So 0.3 explains Mia's 40 flips far better than 0.1 or 0.6 does. That score, `dbinom(12, 40, p)` worked out for one fixed value of p with the data held fixed, is called the **likelihood** of that value of p. It's a score for how well a candidate explains data you already have. It is not a probability that the candidate is the true value, and that distinction is worth holding onto.

=== step === widget
## Plotting the score across every value of p

Three candidate values already told you 0.3 beats 0.1 and 0.6 by a wide margin. But there's nothing forcing you to stop at three. You can score every value of p across a range and see the whole shape the scores trace out.

One change makes that practical. Away from the peak, `dbinom()` returns numbers so small they're hard to compare usefully, as you just saw at p = 0.1 and p = 0.6. Taking the logarithm of the likelihood fixes that: it turns those vanishingly small scores into ordinary numbers that plot cleanly, and because log is a strictly increasing function, it never changes which value of p scores highest. This is called the **log-likelihood**.

The chart below scores every value of p from 0.02 to 0.60 this way, shifted so the highest point on the curve sits at zero. Switch between the point view and the line view. Both show the same shape.

::widget chart-plotter {"data":[{"x":0.02,"y":-23.075},{"x":0.0332,"y":-17.379},{"x":0.0464,"y":-13.75},{"x":0.0595,"y":-11.137},{"x":0.0727,"y":-9.132},{"x":0.0859,"y":-7.534},{"x":0.0991,"y":-6.228},{"x":0.1123,"y":-5.142},{"x":0.1255,"y":-4.229},{"x":0.1386,"y":-3.455},{"x":0.1518,"y":-2.797},{"x":0.165,"y":-2.236},{"x":0.1782,"y":-1.759},{"x":0.1914,"y":-1.356},{"x":0.2045,"y":-1.017},{"x":0.2177,"y":-0.735},{"x":0.2309,"y":-0.505},{"x":0.2441,"y":-0.323},{"x":0.2573,"y":-0.185},{"x":0.2705,"y":-0.087},{"x":0.2836,"y":-0.026},{"x":0.2968,"y":-0.001},{"x":0.31,"y":-0.009},{"x":0.3232,"y":-0.05},{"x":0.3364,"y":-0.121},{"x":0.3495,"y":-0.221},{"x":0.3627,"y":-0.35},{"x":0.3759,"y":-0.507},{"x":0.3891,"y":-0.691},{"x":0.4023,"y":-0.902},{"x":0.4155,"y":-1.14},{"x":0.4286,"y":-1.404},{"x":0.4418,"y":-1.694},{"x":0.455,"y":-2.01},{"x":0.4682,"y":-2.353},{"x":0.4814,"y":-2.722},{"x":0.4945,"y":-3.119},{"x":0.5077,"y":-3.543},{"x":0.5209,"y":-3.996},{"x":0.5341,"y":-4.477},{"x":0.5473,"y":-4.988},{"x":0.5605,"y":-5.53},{"x":0.5736,"y":-6.103},{"x":0.5868,"y":-6.71},{"x":0.6,"y":-7.351}],"geoms":["point","line"],"x":"p","y":"log_likelihood"}

One curve, one peak. It climbs from the left, tops out somewhere close to p = 0.3, and falls away again on the right. Every other value of p you could have picked, 0.1 and 0.6 included, scores lower than the values right around that peak. Finding exactly where that peak sits is the next job.

=== step === quiz
## Quick check: what a likelihood score means

Earlier, `dbinom(12, 40, 0.3)` scored 0.136574.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It is the probability that 0.3 is the true heads-probability of Mia's coin. ::no
- It is the probability of seeing the data Mia actually has, 12 heads in 40 flips, worked out as if p were 0.3. ::ok Exactly right. A likelihood score always answers that one question: how probable is the data you already have, under one candidate value of the parameter. It never says how probable that candidate itself is.
- It is one of several numbers that must add up to 1 as p ranges over every candidate value. ::no
- It is how many more heads Mia's coin would show at p = 0.3 than at p = 0.1 or p = 0.6. ::no A likelihood score is the probability of the data you already have, worked out under one candidate value of p, nothing more. It says nothing about how probable that candidate is, and unlike a probability distribution over the data, these scores are not required to add up to 1 as p ranges over its candidates: the three you tried added up to barely more than 0.13.

=== step === concept
## Finding the peak exactly: grid search and optimise()

Reading a peak off a chart gets you close, but "close to 0.3" isn't the same as knowing it is 0.3. Let's find the peak exactly, two ways.

The first way is still just comparing scores, only on a much finer grid. Try every value of p from 0.01 to 0.99 in steps of 0.0005, nearly 2,000 candidates, score each one with the log-likelihood, and keep whichever one scored highest.

```r
# Find the value of p that maximizes the log-likelihood: grid search, then optimise()
loglik <- function(p) k * log(p) + (n - k) * log(1 - p)

p_grid <- seq(0.01, 0.99, by = 0.0005)
p_hat_grid <- p_grid[which.max(loglik(p_grid))]
p_hat_grid
#> [1] 0.3

p_hat_opt <- optimise(loglik, c(0.001, 0.999), maximum = TRUE)$maximum
p_hat_opt
#> [1] 0.2999945
```

`loglik(p)` is the same scoring rule as before, just written as a function so you can hand it any value of p you like. `which.max()` finds the position of the largest score in the grid, and `p_grid[...]` reads off the value of p sitting at that position. On this grid, the winner is exactly 0.3.

The second way never builds a grid at all. `optimise()` searches for the value of p that maximizes `loglik()` directly, trying only as many candidates as it needs to home in on the answer. It returns 0.2999945, the same answer as the grid search give or take about 0.0000055, a gap that only shows up because it isn't restricted to the grid's fixed steps.

Three different ways of finding the same number now: your eye on the curve in the last chart, the grid search here, and optimise() here. All three point at 0.3. That value, the one that maximizes the likelihood of the data you have, is called the **maximum likelihood estimate**, or MLE for short.

=== step === concept
## Why the maximum likelihood estimate works out to k over n

Grid search and optimise() both found 0.3 by trying lots of candidate values and keeping the best one. There's a third way, one that needs no trying at all: write the log-likelihood as a function of p, use calculus to find where it stops climbing and starts falling, and solve for p directly.

Here is the log-likelihood again, for a general k heads out of n flips rather than Mia's particular numbers:

$$\ell(p) = k \log(p) + (n - k)\log(1 - p)$$

At the peak, the slope of this curve is exactly zero. That's what "peak" means. So differentiate with respect to p and set the result to zero:

$$\frac{d\ell}{dp} = \frac{k}{p} - \frac{n-k}{1-p} = 0$$

Multiply both sides by p(1 - p) to clear the fractions, and the terms cancel in a way that leaves almost nothing behind:

$$k(1-p) = p(n-k) \quad\Rightarrow\quad k - kp = pn - pk \quad\Rightarrow\quad k = pn \quad\Rightarrow\quad \hat{p} = \frac{k}{n}$$

So the maximum likelihood estimate of a heads-probability is just the share of flips that came up heads. For Mia's coin, that's 12 divided by 40. A formula like this one, that you plug numbers into directly with no searching required, is called a **closed form**.

```r
# Check the closed-form shortcut against the slower optimise() result from before
p_hat_formula <- k / n
round(c(formula = p_hat_formula, optimise = p_hat_opt), 4)
#> formula optimise 
#>     0.3      0.3 
```

They agree, because they were never two different answers. The formula is just a shortcut for the thing you already did the slow way twice: search a grid, or let optimise() search for you. Calculus gets there without searching at all, but it's finding the same peak on the same curve.

=== step === widget
## Watching the curve as the sample grows

Every number so far came from one fixed sample: 40 flips, 12 heads. What happens to the picture if Mia had flipped more, or fewer, times, always landing on the same 30% heads rate?

The widget below is the same log-likelihood curve from earlier, but now you can slide the sample size and watch what happens. It runs on a coin held at exactly 30% heads at every setting, so at 40 flips it is showing you Mia's own 12-heads-in-40 data. At the other settings it's the same coin, just flipped more or fewer times.

::widget likelihood-curve {"model": "bern", "n": 40}

Move the slider from 10 flips up to 320. Watch two things.

The peak never moves. It sits at 0.3 whatever the sample size, because the ratio of heads to flips is held at 30% throughout, and you already know the estimate is exactly that ratio.

The curve itself does move, though. At 10 flips it's wide and shallow: plenty of other values of p nearby score almost as well as 0.3 does, because 10 flips isn't enough data to rule much out. At 320 flips the curve is narrow and sharp: values even a little away from 0.3 score far worse, because 320 flips pin the rate down tightly. That narrowing has a number attached to it. The standard error of the estimate, how much it would typically wobble if Mia repeated her flips over and over at that sample size, falls from about 0.1449 at 10 flips to about 0.0256 at 320 flips.

So more data doesn't move the estimate here. The ratio was always 0.3. What more data buys is a sharper curve: a tighter range of values that explain the data about as well as the best one does.

=== step === quiz
## Quick check: does the estimate move, or just the curve?

A different coin is flipped 80 times and lands heads 24 times, the same 30% rate as Mia's 40-flip coin.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Its maximum likelihood estimate is higher than 0.3, because 24 heads is a bigger number than Mia's 12. ::no
- Its maximum likelihood estimate is still 0.3, and its log-likelihood curve is sharper than Mia's, because 80 flips pin the rate down more tightly than 40 flips do. ::ok Exactly. The ratio decides the estimate: 24 over 80 is 0.3, same as 12 over 40. The sample size decides the curve's sharpness, not the estimate, and a bigger sample always means a sharper curve.
- Its maximum likelihood estimate is still 0.3, but its log-likelihood curve is flatter than Mia's, because more flips means more different ways the 24 heads could have come up. ::no
- Its maximum likelihood estimate is lower than 0.3, because more flips give the coin more chances to miss the rate by accident. ::no A coin's estimate is set by the ratio of heads to flips alone, 24 over 80 here, which is 0.3, exactly Mia's rate. Flip count changes how sharply the curve rules out nearby values, never the estimate itself: more data always means a sharper curve, not a different answer. Raw counts like 24 and 12, or 80 and 40, only matter through their ratio.

=== step === tryit
## Your turn: a new coin, a new estimate

A second coin is flipped 50 times and lands heads 9 times. Find its maximum likelihood estimate yourself, the fast way, then check it against optimise() on the same data.

```r
# A second coin: 9 heads in 50 flips
k2 <- 9
n2 <- 50
loglik2 <- function(p) k2 * log(p) + (n2 - k2) * log(1 - p)

# Fill in the one-line closed-form estimate: heads divided by flips


# optimise() is already here, to check your answer against
p_hat2_opt <- optimise(loglik2, c(0.001, 0.999), maximum = TRUE)$maximum
p_hat2_opt
#> [1] 0.1800051
```
::check {"regex": "p_hat2_formula\\s*<-\\s*k2\\s*/\\s*n2", "gate": true, "difficulty": "intermediate", "ok": "Right: both read 0.18. The ratio of heads to flips gives you the maximum likelihood estimate directly, no search needed, and optimise() confirms it on the very same data.", "no": "Use the same shortcut from two steps back: the maximum likelihood estimate of a heads-probability is heads divided by flips. Write p_hat2_formula <- k2 / n2."}
::solution
```r
# Fill in the closed form, then check it against optimise()
p_hat2_formula <- k2 / n2
p_hat2_opt <- optimise(loglik2, c(0.001, 0.999), maximum = TRUE)$maximum
round(c(formula = p_hat2_formula, optimise = p_hat2_opt), 4)
#> formula optimise 
#>    0.18    0.18 
```

0.18, both ways. The closed form skips the search entirely; optimise() just confirms there was nothing left for it to find that the formula had missed.

=== step === concept
::prose-only the sources are text, not a visual
## References

- Fisher, R. A. (1922). "On the Mathematical Foundations of Theoretical Statistics." *Philosophical Transactions of the Royal Society A*, 222, 309-368. The original paper naming and developing the method of maximum likelihood.
- Casella, G. and Berger, R. L. *Statistical Inference* (2nd ed., Duxbury/Cengage). The chapter on point estimation, covering the likelihood function and its maximum.
- [Wasserman, L., *All of Statistics* (Springer, 2004), the chapter on point estimation and the maximum likelihood estimator](https://doi.org/10.1007/978-0-387-21736-9)
- Pawitan, Y. (2001). *In All Likelihood: Statistical Modelling and Inference Using Likelihood*. Oxford University Press. Treats the likelihood function itself as the primary object of statistical inference.
- [Wikipedia, "Likelihood function"](https://en.wikipedia.org/wiki/Likelihood_function), the general definition of the likelihood and its role in maximum likelihood estimation.
- [R Core Team, documentation for `optimise()` (stats package)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/optimize.html), the one-dimensional optimiser used in this lesson to find the maximum without a grid.

=== step === complete
## What you can do with any likelihood curve now

Mia's coin landed on 0.3. The second coin, 9 heads in 50 flips, landed on 0.18. Both numbers came from the same idea: score every candidate value of a parameter by how well it explains the data you have, and pick the one that scores highest.

You found that peak three ways that all agree. Reading the curve by eye got you close. A grid search found it exactly, by trying enough candidates and keeping the best. optimise() found the same peak without ever building a grid. And for a heads-probability specifically, calculus handed you a shortcut, k divided by n, that skips the search entirely because it already knows where the peak has to land.

That shortcut isn't a separate rule to memorise. It's the answer you already found twice, written down once and for all.

The next lesson in this course estimates a parameter a different way, by matching the sample's own mean to a distribution's mean instead of maximizing a likelihood, and compares what that shortcut gets right against what maximum likelihood still does better.
