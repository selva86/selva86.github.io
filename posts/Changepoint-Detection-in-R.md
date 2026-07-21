---
title: "Changepoint Detection in R: the changepoint Package and PELT"
slug: "Changepoint-Detection-in-R"
description: "Detect changepoints in R with the changepoint package: PELT, cpt.mean, cpt.var and cpt.meanvar, choosing a penalty with CROPS, and the traps that fake changes."
keywords: "changepoint detection in R, changepoint package, PELT algorithm, cpt.mean, cpt.var, cpt.meanvar, CROPS penalty, binary segmentation, structural break R, MBIC penalty"
auto_link_terms: "changepoint detection|changepoint detection in R|changepoint package|PELT algorithm|cpt.mean()|cpt.var()|cpt.meanvar()|CROPS penalty|binary segmentation|MBIC penalty|structural break|PELT"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "FR-adva-8"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Changepoint Detection"
sidebar_order: "28"
difficulty: "Advanced"
---

<p class="lead">A changepoint is the moment a time series stops behaving one way and starts behaving another. Changepoint detection is the job of finding those moments automatically, and in R the standard tool is the changepoint package, whose PELT algorithm searches every possible way of cutting a series into segments and returns the best one exactly, at close to linear cost.</p>

Most tutorials on this topic hand you `cpt.mean()`, print a list of numbers, and stop. You are left with an algorithm you cannot argue with and a penalty setting you cannot justify. This guide goes the other way. You will write the search by hand in about six lines of base R, watch it land on an answer, and only then meet the package that does the same thing properly. After that the package output stops being a black box.

Everything below uses either a dataset that ships with R itself or a series you simulate in one line from a fixed seed. The numbers you see are the numbers you will get.

## What is a changepoint, and why does the exact date matter?

In 1898 the British began building a dam at Aswan. R ships with `Nile`, the annual flow of the river measured at Aswan from 1871 to 1970, and somewhere inside that record the river's typical flow drops and never comes back. You could squint at a plot and guess the year. Three lines of R will find it for you, and tell you how big the drop was.

```r title="Find the year the Nile changed"
library(changepoint)

nile_z <- (Nile - mean(Nile)) / sd(Nile)
nile_fit <- cpt.mean(nile_z, method = "PELT")

cpts(nile_fit)
#> [1] 28
time(Nile)[cpts(nile_fit)]
#> [1] 1898
round(c(before = mean(Nile[1:28]), after = mean(Nile[29:100])), 1)
#> before  after 
#> 1097.8  850.0
```

Read that block line by line. The second line rescales the series so that it is measured in units of its own standard deviation. That step matters more than it looks: `cpt.mean()` uses a cost function that assumes the year-to-year noise has a variance of 1, and the Nile is measured in the hundreds, so without the rescaling the algorithm reads ordinary wobble as evidence of change. Only the division by `sd()` does that work; subtracting the mean first just centres the numbers on zero and never changes which split wins. The section on spread changes below shows exactly what goes wrong when you skip the division. The third line runs the search. `cpts()` then returns the *index* of the last observation before the change, which is 28, and `time(Nile)[28]` converts that index into the year 1898. The final line reports the average flow on each side of the split.

So the algorithm says the Nile's average annual flow fell from about 1098 units to about 850, a drop of roughly 23 percent, starting in 1899. It found the dam without being told that a dam existed.

Now look at the same result as a picture, because the eye is what convinces people in a report.

```r title="Plot the Nile with its two levels"
plot(Nile, col = "grey40", lwd = 1.5, ylab = "Annual flow", xlab = "Year",
     main = "Nile flow at Aswan, 1871 to 1970")
segments(1871, mean(Nile[1:28]), 1898, mean(Nile[1:28]), col = "firebrick", lwd = 3)
segments(1899, mean(Nile[29:100]), 1970, mean(Nile[29:100]), col = "steelblue", lwd = 3)
abline(v = 1898.5, lty = 2)

round(sd(Nile), 1)
#> [1] 169.2
```

The two horizontal bars are the segment means, and the dashed vertical line is the changepoint. Notice that the year-to-year wobble is large: the standard deviation of the whole series is 169 units. The drop of 248 units is only about one and a half of those wobbles, which is precisely why eyeballing this is unreliable and why you want an algorithm that weighs the evidence.

[KEY INSIGHT]
**A changepoint is not an outlier.** An outlier is one observation that does not fit its neighbours and is best deleted or downweighted; a changepoint is an index after which *every* later observation follows a different rule. Asking "which points are weird" and asking "when did the rules change" are different questions with different tools.

**Try it:** Build a series that jumps from an average of 10 to an average of 14 after the sixtieth observation, then check that the search recovers the jump. Put it on unit-variance scale first by dividing by its standard deviation, the step the Nile example explained above.

```r title="Your turn: find the simulated jump"
set.seed(7)
ex_jump <- c(rnorm(60, mean = 10), rnorm(40, mean = 14))

# your code here: standardise ex_jump, fit cpt.mean with PELT, and print cpts()

# Expected: a single changepoint at index 60
```

<details>
<summary>Click to reveal solution</summary>

```r title="Simulated jump solution"
ex_fit <- cpt.mean(ex_jump / sd(ex_jump), method = "PELT")
cpts(ex_fit)
#> [1] 60
```

**Explanation:** Dividing by the standard deviation puts the series on the scale the default cost function expects. The search then lands on index 60, the last observation generated with mean 10.

</details>

## How does an algorithm decide where the change happened?

You do not have to take the package on trust, because the idea underneath it fits in a few lines of base R. Start with a way of scoring a single stretch of data. A natural score is how badly that stretch is described by one flat line at its own average, which is the sum of squared deviations from the mean. Small score means the stretch really is flat and uniform.

```r title="Score a stretch of data"
seg_cost <- function(x) sum((x - mean(x))^2)

seg_cost(Nile)
#> [1] 2835157
seg_cost(Nile[1:28]) + seg_cost(Nile[29:100])
#> [1] 1597457
```

The first number is the cost of insisting that the whole Nile record is one flat series. The second is the cost of allowing two flat stretches that meet at 1898. Cutting the series in that one place removes 1,237,700 units of cost, which is nearly 44 percent of the total. That is the arithmetic behind "something happened in 1898".

Of course we picked 1898 because we already knew the answer. The honest version tries every possible cut and keeps the best.

```r title="Try every possible split"
n <- length(Nile)
candidates <- 2:(n - 2)
total_cost <- sapply(candidates, function(k) seg_cost(Nile[1:k]) + seg_cost(Nile[(k + 1):n]))

best_k <- candidates[which.min(total_cost)]
best_k
#> [1] 28
time(Nile)[best_k]
#> [1] 1898
round(min(total_cost))
#> [1] 1597457
```

That is the entire idea. We built a vector holding the cost of every one of the 97 possible two-segment splits, asked `which.min()` which entry is smallest, and got index 28. No package was involved, and the answer is identical to the one `cpt.mean()` gave in the opening block.

It helps to see the whole cost curve rather than only its minimum, because the shape tells you how confident the answer is.

```r title="Plot the cost of every split"
plot(time(Nile)[candidates], total_cost, type = "l", lwd = 2, col = "steelblue",
     xlab = "Year of the split", ylab = "Total cost of the two segments",
     main = "Cost of every possible single split")
abline(v = time(Nile)[best_k], lty = 2, col = "firebrick")

round(seg_cost(Nile) - min(total_cost))
#> [1] 1237700
```

The curve has one deep, clean valley around 1898. A series with no real changepoint gives a shallow, wandering curve with no obvious floor, and a series with several changes gives several local dips. Plotting this curve is a cheap sanity check that costs you one line.

Now for the problem that makes this whole field interesting. If cutting once is good, why not cut twice? Or ninety-nine times?

```r title="Why more cuts always look better"
sum(sapply(1:n, function(i) seg_cost(Nile[i])))
#> [1] 0
```

Give every observation its own segment and the cost falls to exactly zero, because a single number always sits perfectly on its own average. Cost alone will therefore always prefer more changepoints, right up to the absurd extreme of one per observation. Any usable method has to charge a fee for each cut.

![How a changepoint search scores one candidate segmentation](screenshots/Changepoint-Detection-in-R-cost-and-penalty.webp)

*Figure 1: How a changepoint search scores one candidate segmentation.*

That fee is called the penalty, and it turns the search into a single optimisation. Among all possible numbers of changepoints and all possible positions for them, find the combination with the lowest total of segment costs plus fees.

$$\min_{m,\ \tau}\ \left\{\ \sum_{i=1}^{m+1} \mathcal{C}\!\left(y_{(\tau_{i-1}+1):\tau_i}\right) \ +\ \beta m\ \right\}$$

Where:

- $m$ is the number of changepoints, which the algorithm chooses rather than you
- $\tau_1 < \tau_2 < \dots < \tau_m$ are the positions of those changepoints
- $\mathcal{C}(\cdot)$ is the cost of one segment, the `seg_cost()` we wrote above
- $\beta$ is the penalty charged for each changepoint kept

If you are not interested in the notation, the sentence before it is all you need: score every segmentation by how badly it fits plus how many cuts it used, and keep the winner.

[WARNING]
**Without a penalty the answer is always "a changepoint everywhere".** If you ever call a changepoint function with the penalty set to None and get hundreds of results, nothing is broken. You asked a question that has a degenerate answer, and the algorithm gave it to you honestly.

**Try it:** Run the same brute-force split search on `ex_jump` from the previous section, using `seg_cost()`. The series is 100 observations long. Confirm that the cheapest split is where you planted the jump.

```r title="Your turn: brute-force the simulated jump"
ex_cands <- 2:98

# your code here: build the vector of total costs for every split of ex_jump,
# then report the candidate with the lowest total cost

# Expected: index 60
```

<details>
<summary>Click to reveal solution</summary>

```r title="Brute-force solution"
ex_tc <- sapply(ex_cands, function(k) seg_cost(ex_jump[1:k]) + seg_cost(ex_jump[(k + 1):100]))
ex_cands[which.min(ex_tc)]
#> [1] 60
```

**Explanation:** The same three-step recipe as the Nile: cost each side of every candidate split, add the two halves, take the minimum. Those two lines reproduce what the package does for a single changepoint.

</details>

## How do you read what cpt.mean() gives you back?

The package returns an S4 object rather than a plain vector, and each accessor answers a different question. The clearest way to meet them is on the simplest possible search: AMOC, short for At Most One Change, which does exactly the brute-force sweep you just wrote by hand.

```r title="Fit an at-most-one-change model"
nile_amoc <- cpt.mean(nile_z, method = "AMOC")

cpts(nile_amoc)
#> [1] 28
round(param.est(nile_amoc)$mean, 3)
#> [1]  1.054 -0.410
nseg(nile_amoc)
#> [1] 2
seg.len(nile_amoc)
#> [1] 28 72
```

Four accessors, four answers. `cpts()` gives the changepoint positions as indices. `param.est()` returns the fitted parameter for each segment, here the two means, which are in standardized units because we fed the function standardized data. `nseg()` counts segments, always one more than the number of changepoints. `seg.len()` gives the length of each segment, so 28 years before the change and 72 after.

[TIP]
**param.est() reports whatever units you fed in.** Because we passed standardized data, the means above are 1.054 and -0.410 standard deviations, not flow units. Keep the original series to hand and summarise that instead when you report results, otherwise your table will be in units nobody recognises.

For a human-readable version of all of it at once, print the object's summary.

```r title="Summarise the fitted object"
summary(nile_amoc)
#> Created Using changepoint version 2.3 
#> Changepoint type      : Change in mean 
#> Method of analysis    : AMOC 
#> Test Statistic  : Normal 
#> Type of penalty       : MBIC with value, 13.81551 
#> Minimum Segment Length : 1 
#> Maximum no. of cpts   : 1 
#> Changepoint Locations : 28
```

Every line here is a decision that was made on your behalf, and each one is an argument you can override. The type of change was the mean. The search method was AMOC. The cost function assumed normally distributed data. The penalty was MBIC with a value of 13.81551. Segments were allowed to be as short as one observation, and at most one changepoint was permitted.

That penalty number is worth pinning down, because "MBIC" is otherwise just a label.

```r title="Where the default penalty comes from"
pen.value(nile_amoc)
#> [1] 13.81551
round(3 * log(100), 5)
#> [1] 13.81551
logLik(nile_amoc)
#>      -2*logLik -2*Loglike+pen 
#>       225.4143       233.0231
round(sum(log(seg.len(nile_amoc))), 4)
#> [1] 7.6089
```

The headline penalty value is exactly $3\log n$, which for 100 observations is 13.81551. The `logLik()` call then shows the fit two ways: 225.4143 is twice the negative log-likelihood of the fitted two-segment model, and 233.0231 is that same figure after a penalty charge has been added. Subtract them and the gap is 7.6088, which is `log(28) + log(72)`, the last line of the block. (The final digit differs only because each printed figure was already rounded.)

The two accessors are therefore reporting different pieces of the same charge. `pen.value()` gives the flat $3\log n$ term, and the penalised column of `logLik()` adds the segment-length term on top of the raw fit.

That is not a coincidence, and it is the whole point of MBIC. A plain BIC charges a flat fee per changepoint no matter where you put it. MBIC additionally charges for *lopsided* splits, because a changepoint that carves off a tiny sliver at the very edge of a series is usually noise rather than a real regime change. The segment-length term is how it expresses that scepticism.

[NOTE]
**The default method changed in changepoint 2.3.** Before version 2.3 the `cpt.*` functions defaulted to AMOC, so old tutorials that call `cpt.mean(x)` with no method argument were finding at most one change. They now default to PELT and can return many. Check yours with `packageVersion("changepoint")` before copying code from an undated blog post.

**Try it:** Fit PELT to `nile_z`, then use the accessors above to report how many segments it produced, how long each one is and what penalty value it charged.

```r title="Your turn: read the PELT fit"
ex_nile <- cpt.mean(nile_z, method = "PELT")

# your code here: report nseg(), seg.len() and pen.value() rounded to 2 decimals

# Expected: 2 segments of length 28 and 72, penalty 13.82
```

<details>
<summary>Click to reveal solution</summary>

```r title="Reading the PELT fit solution"
nseg(ex_nile)
#> [1] 2
seg.len(ex_nile)
#> [1] 28 72
round(pen.value(ex_nile), 2)
#> [1] 13.82
```

**Explanation:** On this series PELT and AMOC agree completely, because the Nile really does contain exactly one changepoint. The accessors work identically whichever search method produced the object.

</details>

## What makes PELT better than binary segmentation?

AMOC finds one changepoint. Real series often have several, and the moment you allow more than one the search space explodes: with 400 observations there are astronomically many ways to place an unknown number of cuts. Two strategies dominate, and the difference between them is the difference between "definitely the best answer" and "usually the best answer".

Binary segmentation is the greedy strategy. Find the single best split, then split each resulting half the same way, and keep going until no split pays for itself. It is fast and intuitive. PELT is the exact strategy: it evaluates the optimal segmentation of the whole series without ever committing to a split it might later regret.

Start with a well-behaved example where both work. Here is a series with four regimes and three genuine changepoints, at 100, 200 and 300.

```r title="Four regimes, three changepoints"
set.seed(2026)
sim <- c(rnorm(100, 0, 1), rnorm(100, 3, 1), rnorm(100, -1, 1), rnorm(100, 2, 1))

sim_pelt <- cpt.mean(sim, method = "PELT")
cpts(sim_pelt)
#> [1] 100 200 300
round(param.est(sim_pelt)$mean, 2)
#> [1] -0.10  3.12 -0.90  1.92
```

PELT nailed all three positions exactly and recovered means of -0.10, 3.12, -0.90 and 1.92 against true values of 0, 3, -1 and 2. Note that no scaling was needed here, because the simulated noise already has a standard deviation of 1.

Binary segmentation gets the same answer on this data, provided you let it look for enough changepoints.

```r title="Binary segmentation and the Q argument"
sim_binseg <- cpt.mean(sim, method = "BinSeg", Q = 5)
cpts(sim_binseg)
#> [1] 100 200 300
cpts(cpt.mean(sim, method = "BinSeg", Q = 2))
#> [1] 100 200
```

The `Q` argument caps how many changepoints binary segmentation is allowed to find. Set it to 5 and the method finds the three that exist. Set it to 2 and it returns only the first two splits it made, along with a warning advising you to raise `Q`. PELT has no equivalent argument, because it decides the number for itself.

Now the case that actually separates them. Consider a series that sits at zero, spikes up for fifteen observations, returns to roughly zero, dips down for fifteen observations, and settles back at zero. The true changepoints are at 40, 55, 95 and 110.

```r title="Where binary segmentation goes wrong"
set.seed(6)
tricky <- c(rnorm(40, 0, 1), rnorm(15, 3, 1), rnorm(40, 0.3, 1),
            rnorm(15, -3, 1), rnorm(40, 0, 1))

cpts(cpt.mean(tricky, method = "PELT"))
#> [1]  40  55  95 110
cpts(cpt.mean(tricky, method = "BinSeg", Q = 8))
#> [1]  95 110
cpts(cpt.mean(tricky, method = "AMOC"))
#> [1] 95
```

PELT recovered all four changepoints perfectly. Binary segmentation, allowed up to eight, found only the last two and missed the entire first half of the story.

The third line explains why. Binary segmentation's opening move is exactly the AMOC search, and AMOC's single best split for this series is at index 95. Having cut there, binary segmentation now looks at observations 1 to 95, a stretch containing an upward spike near the start whose effect on the segment average is diluted by forty quiet observations on each side. That diluted signal no longer clears the penalty, so the search stops. The first split was locally optimal and globally destructive, and the greedy method has no mechanism for taking it back.

```r title="Plot the two answers side by side"
plot(tricky, type = "l", col = "grey60", xlab = "Index", ylab = "Value",
     main = "PELT recovers all four changes, BinSeg finds two")
abline(v = cpts(cpt.mean(tricky, method = "PELT")), col = "steelblue", lwd = 2)
abline(v = cpts(cpt.mean(tricky, method = "BinSeg", Q = 8)), col = "firebrick", lwd = 2, lty = 3)

round(c(spike_up = mean(tricky[41:55]), spike_down = mean(tricky[96:110])), 2)
#> spike_up spike_down 
#>     2.95      -3.40
```

Both spikes are real and roughly equal in size, 2.95 up and 3.40 down. Only one of them survives the greedy search.

So why did anyone ever use the greedy method? Because exhaustively checking every segmentation used to be unaffordable.

```r title="The cost of checking every split"
n_big <- 20000
format(n_big * (n_big + 1) / 2, big.mark = ",", scientific = FALSE)
#> [1] "200,010,000"
format(n_big, big.mark = ",")
#> [1] "20,000"
```

For a series of 20,000 observations there are 200 million candidate segments to price. The naive exact method pays roughly that cost, growing with the square of the series length, which is why it was abandoned in practice.

PELT's contribution is a pruning rule that keeps exactness while removing almost all of that work. In plain terms: as the algorithm sweeps forward it maintains the best segmentation found so far for every position. If some old candidate position is already more expensive than the current best, even before you charge it the penalty it would still owe for the extra changepoint, then that candidate can never win at any later point in the series. It is deleted permanently and never priced again. When changepoints occur at a roughly steady rate, so much gets pruned that the total work grows about linearly with the length of the series.

[KEY INSIGHT]
**PELT is exact and fast, not fast at the cost of exactness.** It returns the same segmentation the exhaustive search would return, because pruning only discards candidates that are provably unable to win. Binary segmentation is an approximation that is usually right; PELT is a guarantee. Given they cost about the same on modern data, prefer the guarantee.

**Try it:** Run binary segmentation on `tricky` with `Q = 3` instead of 8. Does giving it a smaller budget change which changepoints it finds?

```r title="Your turn: BinSeg with a smaller budget"
# your code here: fit cpt.mean on tricky with method BinSeg and Q = 3, print cpts()

# Expected: the same two late changepoints, not the missing early pair
```

<details>
<summary>Click to reveal solution</summary>

```r title="BinSeg budget solution"
cpts(cpt.mean(tricky, method = "BinSeg", Q = 3))
#> [1]  95 110
```

**Explanation:** The answer is unchanged. The problem was never the budget, it was the first greedy split. Raising or lowering `Q` cannot repair a wrong decision made at the very first cut, because every later cut is searched inside the pieces that first cut created.

</details>

## How do you choose the penalty?

The penalty is the one number that changes your answer most, so it deserves more thought than accepting a default. Compare the standard options on the four-regime series, where we know the truth is three changepoints.

```r title="Compare the built-in penalties"
pens <- c("None", "AIC", "BIC", "Hannan-Quinn", "MBIC")
sapply(pens, function(p) length(cpts(cpt.mean(sim, method = "PELT", penalty = p))))
#>         None          AIC          BIC Hannan-Quinn         MBIC 
#>          399           16            3            3            3
```

One series of 400 observations containing three real changes, and the answers range from 3 to 399. No penalty at all gives the degenerate answer we predicted earlier: 399 changepoints, one between every pair of observations. AIC charges too little and returns 16, keeping thirteen spurious splits. BIC, Hannan-Quinn and MBIC all recover exactly 3.

The pattern generalises. AIC is designed for prediction and tolerates extra parameters, so it over-segments. BIC and its relatives charge a fee that grows with the length of the series, which makes them consistent: as you collect more data they stop inventing changepoints. MBIC adds the lopsidedness charge you saw earlier, making it the most sceptical of the three.

Rather than trusting any label, watch what happens as you turn the penalty dial by hand.

```r title="Sweep the penalty by hand"
beta_grid <- c(1, 2, 5, 10, 20, 50, 100, 200)
sapply(beta_grid, function(b)
  length(cpts(cpt.mean(sim, method = "PELT", penalty = "Manual", pen.value = b))))
#> [1] 135  57   8   3   3   3   3   3
```

This is the single most informative diagnostic in changepoint analysis. At a penalty of 1 the method finds 135 changes, at 2 it finds 57, at 5 it finds 8, and from 10 all the way to 200 it finds exactly 3 and refuses to budge. A twentyfold change in the penalty does not move the answer.

That flat stretch is what a real signal looks like. Spurious changepoints are cheap to buy and disappear as soon as the price rises, whereas genuine ones survive an enormous range of prices. If your answer changes every time you nudge the penalty, you do not have a changepoint, you have a preference.

Doing that sweep by refitting on a grid is wasteful, and the package offers a purpose-built alternative called CROPS, which computes every distinct segmentation across a whole penalty range in one pass.

```r title="Explore a whole penalty range with CROPS"
sim_crops <- cpt.mean(sim, method = "PELT", penalty = "CROPS", pen.value = c(5, 200))
round(pen.value.full(sim_crops), 2)
#> [1]   5.00   6.11   6.27 200.00
apply(cpts.full(sim_crops), 1, function(r) sum(!is.na(r)))
#> [1] 8 6 3
cpts.full(sim_crops)[, 1:5]
#>      [,1] [,2] [,3] [,4] [,5]
#> [1,]   23   30  100  200  300
#> [2,]  100  200  300  314  318
#> [3,]  100  200  300   NA   NA
```

CROPS reports that between penalties of 5 and 200 there are only three distinct answers. Penalties from 5 to about 6.11 give 8 changepoints, a narrow band up to 6.27 gives 6, and everything from 6.27 to 200 gives 3. The `cpts.full()` matrix lists those answers as rows, padded with `NA`, and the third row is the familiar 100, 200, 300.

Notice how the extra changepoints in the first row (23 and 30) and the second row (314, 318) are clustered and short-lived. They exist only in a penalty band of width 1.27, while the true answer holds across a band of width 194.

The package also draws this for you as an elbow plot.

```r title="Plot the CROPS diagnostic"
plot(sim_crops, diagnostic = TRUE)
```

The plot shows the number of changepoints against the penalty. You are looking for the elbow, the point after which paying more penalty stops buying you a meaningfully simpler model. Here the curve flattens hard at 3 and stays there.

[TIP]
**Choose the plateau, not the number.** Run CROPS or a manual sweep, find the widest range of penalties that all give the same answer, and report that answer. It is far more defensible than saying you used the default, and it takes one extra line of code.

**Try it:** Find a manual penalty that recovers all four changepoints in the `tricky` series. Sweep the grid 2, 4, 6, 8, 12, 20 and see which values give 4.

```r title="Your turn: tune the penalty on tricky"
ex_grid <- c(2, 4, 6, 8, 12, 20)

# your code here: for each value in ex_grid, count the changepoints PELT finds
# in tricky using penalty = "Manual"

# Expected: the counts fall and then settle on 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Penalty tuning solution"
sapply(ex_grid, function(b) length(cpts(cpt.mean(tricky, method = "PELT", penalty = "Manual", pen.value = b))))
#> [1] 29  7  6  4  4  4
```

**Explanation:** Penalties of 8, 12 and 20 all return 4 changepoints, which matches the truth. The plateau starting at 8 is the signal; the 29 changepoints at a penalty of 2 are noise being bought cheaply.

</details>

## What if the spread changes instead of the level?

So far every example has been about the average level moving. Plenty of real changes are not about the level at all. A machine starts vibrating more without running hotter on average. A market becomes turbulent while drifting nowhere. For those you need a different cost function, and the package gives you one function per question.

![Match the question you are asking to the cpt function that answers it](screenshots/Changepoint-Detection-in-R-which-function.webp)

*Figure 2: Match the question you are asking to the cpt function that answers it.*

Here is a series whose average never moves but whose standard deviation triples halfway through.

```r title="Detect a change in variance"
set.seed(11)
volt <- c(rnorm(200, 0, 1), rnorm(200, 0, 3))

volt_var <- cpt.var(volt, method = "PELT")
cpts(volt_var)
#> [1] 195
round(param.est(volt_var)$variance, 2)
#> [1] 0.86 8.54
round(sqrt(param.est(volt_var)$variance), 2)
#> [1] 0.93 2.92
```

`cpt.var()` found the break at index 195, five observations from the truth at 200, and estimated segment variances of 0.86 and 8.54. Taking square roots gives standard deviations of 0.93 and 2.92 against true values of 1 and 3. Variance is estimated less precisely than a mean, so being five observations out on 400 is a good result rather than a poor one.

Now watch what the mean-change function does with the same data, which is the failure mode worth burning into memory.

```r title="What cpt.mean does with a variance change"
cpts(cpt.mean(volt / sd(volt), method = "PELT"))
#> integer(0)
length(cpts(cpt.mean(volt, method = "PELT")))
#> [1] 31
```

Two lines, and neither one reports the change that actually happened. Scaled properly, `cpt.mean()` returns `integer(0)`, no changepoints, and that answer is correct as far as it goes: the mean genuinely never changes. It answered the question it was asked, which was about the level. It simply has no way to tell you that the spread tripled.

Unscaled, it reports 31 changepoints, and every one is an artefact. The default cost assumes the noise has variance 1, so the second half of the series, where the variance is really 9, does not fit that assumption at all. The search responds the only way it can: it cuts the second half into many short segments, each with its own fitted mean, because a staircase of shifting levels is the closest a mean-change model can get to describing extra spread.

[WARNING]
**Picking the wrong cpt function fails silently.** Neither of the results above throws an error or prints a message. You get a tidy vector of indices that looks exactly like a real answer. Decide what kind of change you are looking for before you fit, not after you see the output.

When both the level and the spread can move, `cpt.meanvar()` estimates them jointly.

```r title="Detect changes in mean and variance together"
set.seed(21)
both <- c(rnorm(150, 0, 1), rnorm(150, 4, 0.5), rnorm(150, 4, 2))

both_fit <- cpt.meanvar(both, method = "PELT")
cpts(both_fit)
#> [1] 150 300
round(param.est(both_fit)$mean, 2)
#> [1] 0.00 4.00 4.17
round(param.est(both_fit)$variance, 2)
#> [1] 1.02 0.22 4.23
```

Both changepoints were found exactly. The three segments have means of 0.00, 4.00 and 4.17 and variances of 1.02, 0.22 and 4.23, against true means 0, 4, 4 and true variances 1, 0.25 and 4. The second changepoint at 300 is a pure change in spread: the mean is 4 on both sides of it, so `cpt.mean()` has nothing to find there. `cpt.var()` would find that one, but it looks only for changes in spread, so it would say nothing about the level shift at 150, and that unmodelled shift would inflate the variance it estimates for the stretch containing it. Asking about both at once is what recovers the full story.

[TIP]
**When in doubt, start with cpt.meanvar().** It is the most general of the three and will find a level shift, a spread shift or both at once. Narrow to `cpt.mean()` or `cpt.var()` when you have a specific reason to believe only one kind of change is possible, since the narrower model estimates fewer parameters and is more sensitive when its assumption holds.

**Try it:** Simulate 150 observations with mean 5 and standard deviation 1, followed by 150 with mean 5 and standard deviation 4. Find the changepoint and report the two standard deviations.

```r title="Your turn: find the variance break"
set.seed(31)
ex_vol <- c(rnorm(150, 5, 1), rnorm(150, 5, 4))

# your code here: fit cpt.var with PELT, print cpts(), and report the two
# segment standard deviations via sqrt of param.est()$variance

# Expected: a changepoint at 150 and standard deviations near 1 and 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Variance break solution"
ex_v <- cpt.var(ex_vol, method = "PELT")
cpts(ex_v)
#> [1] 150
round(sqrt(param.est(ex_v)$variance), 2)
#> [1] 0.92 4.16
```

**Explanation:** `cpt.var()` finds the break exactly at 150 and recovers standard deviations of 0.92 and 4.16. It does not care that the mean is 5 rather than 0, because it estimates each segment's mean as a nuisance parameter.

</details>

## Which assumptions quietly break changepoint detection?

Everything so far has fed the algorithm independent observations that are flat within each segment. Real time series routinely violate that, and the failures are dangerous because they look like results. Here is a series with no changepoints whatsoever: it is pure AR(1) noise, where each value is 0.9 times the previous value plus a fresh random shock.

```r title="Autocorrelation invents changepoints"
set.seed(5)
ar_series <- as.numeric(arima.sim(list(ar = 0.9), n = 400))

ar_fit <- cpt.mean(ar_series / sd(ar_series), method = "PELT")
length(cpts(ar_fit))
#> [1] 7
cpts(ar_fit)
#> [1] 148 168 230 271 303 337 377
round(acf(ar_series, plot = FALSE, lag.max = 3)$acf[, , 1], 3)
#> [1] 1.000 0.911 0.833 0.767
```

Seven changepoints, every one of them fictional. Nothing about the process that generated the data ever changed. The problem is that the cost function assumes observations are independent, so a long run of above-average values is treated as strong evidence of a raised mean. In an autocorrelated series, long runs happen all the time simply because each value inherits most of the previous one.

The last line diagnoses the problem in advance. `acf()` reports lag 0 first, and that entry is always 1 because every observation matches itself, so the number to read is the second one: the correlation between each observation and the one immediately before it is 0.911. A value that high means the series drifts in long runs rather than bouncing around independently, which is precisely the pattern the cost function misreads as a shift in level. Checking it costs one line, and you can do it before you fit anything.

A trend causes the same failure through a different route.

```r title="A trend becomes a staircase"
set.seed(8)
trend <- 0.05 * (1:300) + rnorm(300)

cpts(cpt.mean(trend / sd(trend), method = "PELT"))
#> [1] 106 210
```

This series has no changepoints either. It slopes gently upward the whole way. PELT is forced to describe a ramp using flat segments, so it does the only thing it can and approximates the slope with a two-step staircase. The changepoints at 106 and 210 are just where the steps look best, and they would move if you extended the series.

The obvious first reflex is to forbid short segments, which helps but does not cure.

```r title="minseglen reduces but does not fix"
cpts(cpt.mean(ar_series / sd(ar_series), method = "PELT", minseglen = 50))
#> [1] 269 319
round(acf(Nile, plot = FALSE, lag.max = 2)$acf[, , 1], 3)
#> [1] 1.000 0.498 0.385
```

Requiring at least 50 observations per segment cuts the seven fake AR changepoints down to two. Two fake changepoints is better than seven and still wrong. `minseglen` is a useful guard against slivers, not a treatment for dependence.

The real fixes match the violation:

1. **Autocorrelation.** Model it away first, then look for changes in what remains. Fit an ARIMA model and run the changepoint search on its residuals, or difference the series if the dependence comes from a random walk.
2. **Trend.** Difference the series, or regress out the trend and search the residuals. A changepoint in the *slope* is a different question that needs a segmented-regression tool rather than `cpt.mean()`.
3. **Non-normal or heavy-tailed data.** The default cost assumes normality. The companion `changepoint.np` package provides `cpt.np()`, which uses a nonparametric cost that makes no distributional assumption, at the price of some sensitivity.
4. **Short segments.** Set `minseglen` to the shortest regime you would consider real. If a change lasting five observations is not actionable for you, do not let the algorithm report one.

The Nile passes the check comfortably enough to trust, with lag-1 autocorrelation of 0.498. Some of even that is caused by the changepoint itself, since 28 above-average years followed by 72 below-average years is autocorrelated by construction.

[TIP]
**Plot the acf before you fit anything.** One line, `acf(x)`, tells you whether the independence assumption is remotely plausible. It is the cheapest insurance in this entire workflow, and skipping it is how people publish staircases.

**Try it:** Take the `trend` series and remove its slope by differencing it with `diff()`, then run PELT on the standardized result. A differenced straight line is flat noise, so the honest answer is no changepoints.

```r title="Your turn: difference away the trend"
# your code here: difference trend, divide by the sd of the differenced series,
# fit cpt.mean with PELT, and print cpts()

# Expected: integer(0), meaning no changepoints
```

<details>
<summary>Click to reveal solution</summary>

```r title="Differencing solution"
cpts(cpt.mean(diff(trend) / sd(diff(trend)), method = "PELT"))
#> integer(0)
```

**Explanation:** Differencing converts a constant slope into a constant mean of about 0.05, so there is nothing left for the algorithm to find. The two staircase changepoints vanish, confirming they were an artefact of the trend rather than a feature of the data.

</details>

## How do the pieces fit into one workflow?

Put the whole thing together on the Nile, in the order a careful analysis actually runs. First, check the assumption before choosing a method.

```r title="Check the series before fitting"
round(acf(Nile, plot = FALSE, lag.max = 2)$acf[, , 1], 3)
#> [1] 1.000 0.498 0.385
round(acf(diff(Nile), plot = FALSE, lag.max = 2)$acf[, , 1], 3)
#> [1]  1.000 -0.402 -0.044
```

The first line is the 0.498 from the previous section, moderate rather than the 0.911 that broke the AR example, so nothing here disqualifies `cpt.mean()`. The second line adds something new: differencing flips the autocorrelation to -0.402, the signature of over-differencing a series that was not a random walk. That tells us the Nile is better described as a level that shifted than as a series that wanders, which is exactly the situation `cpt.mean()` is built for.

Second, confirm the answer is not an artefact of the penalty.

```r title="Confirm the answer across a penalty range"
nile_crops <- cpt.mean(nile_z, method = "PELT", penalty = "CROPS", pen.value = c(3, 60))
round(pen.value.full(nile_crops), 2)
#> [1]  3.00 43.22 60.00
apply(cpts.full(nile_crops), 1, function(r) sum(!is.na(r)))
#> [1] 1
```

Across the entire penalty range from 3 to 60, a twentyfold span, CROPS finds exactly one distinct segmentation containing exactly one changepoint. This is as strong as penalty evidence gets. Compare it to the four-regime simulation, where the same call produced three competing answers.

Third, report the result as a table a non-specialist can read, rather than a vector of indices.

```r title="Turn a fit into a readable segment table"
segment_table <- function(fit, series, times = seq_along(series)) {
  ends <- c(cpts(fit), length(series))
  starts <- c(1, head(ends, -1) + 1)
  data.frame(segment = seq_along(starts),
             from = times[starts], to = times[ends],
             years = ends - starts + 1,
             mean_flow = round(mapply(function(a, b) mean(series[a:b]), starts, ends), 1),
             sd_flow = round(mapply(function(a, b) sd(series[a:b]), starts, ends), 1))
}

segment_table(nile_fit, as.numeric(Nile), as.numeric(time(Nile)))
#>   segment from   to years mean_flow sd_flow
#> 1       1 1871 1898    28    1097.8   135.0
#> 2       2 1899 1970    72     850.0   124.8
```

The helper converts changepoint indices into segment boundaries, then computes summary statistics per segment. It takes the fitted object, the original unscaled series, and optionally a vector of labels such as years, which is why the table reads in calendar years rather than positions.

[TIP]
**Report the table next to the CROPS result.** A segment table alone invites the question "how do you know that is not just your penalty setting?" Pairing it with the one-line CROPS finding, that every penalty from 3 to 60 gives this same answer, closes that objection before anyone raises it.

The output is the finished analysis. The Nile ran at an average of 1098 units with a standard deviation of 135 from 1871 to 1898, then at 850 with a standard deviation of 125 from 1899 to 1970. The within-segment variability barely changed, which supports the choice of `cpt.mean()` over `cpt.meanvar()`: what happened at Aswan moved the level, not the volatility.

**Try it:** Apply `segment_table()` to `LakeHuron`, another built-in annual series, recording lake levels from 1875 to 1972. Standardize it the same way you did the Nile, fit PELT, then read off the segments.

```r title="Your turn: segment LakeHuron"
lh <- as.numeric(LakeHuron)

# your code here: standardise lh, fit cpt.mean with PELT, then call
# segment_table(fit, lh, as.numeric(time(LakeHuron)))

# Expected: two segments, split around 1890
```

<details>
<summary>Click to reveal solution</summary>

```r title="LakeHuron solution"
lh_fit <- cpt.mean((lh - mean(lh)) / sd(lh), method = "PELT")
segment_table(lh_fit, lh, as.numeric(time(LakeHuron)))
#>   segment from   to years mean_flow sd_flow
#> 1       1 1875 1890    16     580.8     0.6
#> 2       2 1891 1972    82     578.7     1.1
```

**Explanation:** Lake Huron sat about 2.1 feet higher on average before 1891 than after. The column names still say flow because the helper was written for the Nile, which is a good reminder to parameterise names when you reuse a function beyond its first purpose.

</details>

## Practice Exercises

### Exercise 1: Date the New Haven warming

`nhtemp` holds the mean annual temperature in Fahrenheit at New Haven, Connecticut, from 1912 to 1971. Standardize it, fit PELT, and report the year of the changepoint along with the average temperature before and after it.

```r title="Exercise 1 starter"
my_nh <- as.numeric(nhtemp)
# Hint: standardise, fit cpt.mean with PELT, then use as.numeric(time(nhtemp))
# to convert the index into a year.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_nh_fit <- cpt.mean((my_nh - mean(my_nh)) / sd(my_nh), method = "PELT")
cpts(my_nh_fit)
#> [1] 32
as.numeric(time(nhtemp))[cpts(my_nh_fit)]
#> [1] 1943
round(c(before = mean(my_nh[1:32]), after = mean(my_nh[33:60])), 2)
#> before  after 
#>  50.52  51.89
```

**Explanation:** The changepoint sits at index 32, which is 1943. New Haven averaged 50.52F through 1943 and 51.89F afterwards, a step of about 1.4F. Note that a single step is only one possible description of warming; a gradual trend would produce a staircase, as the trend example showed, so the acf check from the assumptions section matters here too.

</details>

### Exercise 2: Automate the penalty plateau

Write a function `smallest_penalty(series, max_cpts)` that searches a grid of manual penalty values and returns the smallest penalty producing no more than `max_cpts` changepoints, along with the count it actually produced. Test it on `sim` with `max_cpts = 3`.

```r title="Exercise 2 starter"
# Hint: sapply over a grid such as seq(2, 100, by = 2), count changepoints for
# each, then use which() to find the first grid value that satisfies the cap.

smallest_penalty <- function(series, max_cpts, grid = seq(2, 100, by = 2)) {
  # your code here
}

# Write your test call below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
smallest_penalty <- function(series, max_cpts, grid = seq(2, 100, by = 2)) {
  counts <- sapply(grid, function(b)
    length(cpts(cpt.mean(series, method = "PELT", penalty = "Manual", pen.value = b))))
  hits <- which(counts <= max_cpts)
  if (!length(hits)) return(c(penalty = NA, cpts = NA))
  c(penalty = grid[min(hits)], cpts = counts[min(hits)])
}

smallest_penalty(sim, max_cpts = 3)
#> penalty    cpts 
#>       8       3
```

**Explanation:** A penalty of 8 is the cheapest value on the grid that gets the count down to 3. The guard on `hits` matters: if no penalty in the grid meets the cap the function returns `NA` rather than failing on an empty subscript, which is what makes it safe to call in a loop over many series.

</details>

### Exercise 3: Segment a market into volatility regimes

`EuStockMarkets` holds daily closing prices for four European indices. Convert the DAX column into daily log returns in percent, then use `cpt.var()` with `minseglen = 100` to split the period into volatility regimes. Report a table with the start and end time of each regime and its daily standard deviation.

```r title="Exercise 3 starter"
my_dax <- as.numeric(diff(log(EuStockMarkets[, "DAX"])) * 100)
my_time <- as.numeric(time(EuStockMarkets))[-1]
# Hint: minseglen = 100 stops the search reporting week-long "regimes".
# Build starts and ends from cpts() the same way segment_table() did.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_dax_fit <- cpt.var(my_dax, method = "PELT", minseglen = 100)
my_ends <- c(cpts(my_dax_fit), length(my_dax))
my_starts <- c(1, head(my_ends, -1) + 1)
data.frame(segment = seq_along(my_starts),
           from = round(my_time[my_starts], 2), to = round(my_time[my_ends], 2),
           days = my_ends - my_starts + 1,
           daily_sd = round(sqrt(param.est(my_dax_fit)$variance), 2))
#>   segment    from      to days daily_sd
#> 1       1 1991.50 1991.88  101     1.24
#> 2       2 1991.89 1992.55  172     0.62
#> 3       3 1992.55 1995.84  857     0.97
#> 4       4 1995.85 1997.19  350     0.69
#> 5       5 1997.19 1998.65  379     1.43
```

**Explanation:** Five regimes, with daily volatility swinging between 0.62 and 1.43 percent, a factor of more than two. The long calm stretch of 857 days in the middle of the 1990s and the turbulent final 379 days are the kind of structure a single whole-sample volatility number would hide completely. Without `minseglen = 100` the same call fragments this into far more, much shorter regimes.

</details>

## Frequently Asked Questions

**When should I use cpt.mean() rather than cpt.meanvar()?**
Use `cpt.mean()` when you are confident the variability stays constant and only the level can shift, since it estimates fewer parameters and is therefore more sensitive to genuine level shifts. Use `cpt.meanvar()` when either could move or when you are not sure. The cost of guessing wrong is silent, as the variance example above showed.

**Why does cpt.mean() return dozens of changepoints on my data?**
Almost always because your series is not on a unit-variance scale. The default Normal cost assumes the noise has variance 1, so a series measured in thousands looks impossibly erratic and gets cut into many short segments. On the raw Nile, `cpt.mean(Nile, method = "PELT")` returns 94 changepoints; dividing by the standard deviation first returns 1. Either standardize, or switch to `cpt.meanvar()`, which estimates the variance rather than assuming it.

**Should I ever prefer binary segmentation to PELT?**
Rarely. PELT is exact and comparable in speed on typical series, so the guarantee is close to free. Binary segmentation is still useful when you want to force an exact number of changepoints via `Q`, or on extremely long series where the pruning happens to be ineffective because changepoints are very sparse.

**Can the changepoint package detect changes in real time?**
Not directly. The `cpt.*` functions are offline methods: they see the whole series at once and can revise where an earlier changepoint sits after seeing later data. For streaming detection you want sequential methods, though re-running PELT on a growing window is a workable approximation when new data arrives in batches.

**How much data do I need per segment?**
For a mean shift, roughly 20 to 30 observations on each side gives reliable detection when the shift is about one standard deviation, and less if the shift is larger. Variance changes need more, typically 50 or more, which is why the DAX example used `minseglen = 100`. Set `minseglen` to the shortest regime that would actually be meaningful to you. Bear in mind too that the index you get back is an estimate of the location, not an exact date: the variance example above landed on 195 when the truth was 200, and short segments or small shifts make that error larger. Report the changepoint as approximately when the change happened, not precisely.

**What if my data are not normally distributed?**
The default cost assumes normality, and heavy tails make it report changepoints where a few extreme values sit. Use the companion `changepoint.np` package and its `cpt.np()` function, which uses a nonparametric cost based on the empirical distribution and makes no distributional assumption. You trade a little sensitivity for robustness.

**How is this different from a structural break test?**
They answer overlapping questions from different directions. Structural break tests, such as those in the strucchange package, are usually framed around a regression model and ask whether its coefficients are stable over time. Changepoint methods are framed around the distribution of the series itself. If your question is "did the relationship between x and y change", reach for a structural break test; if it is "did this series change", reach for the changepoint package.

## Summary

![The order of operations that keeps changepoint results trustworthy](screenshots/Changepoint-Detection-in-R-workflow.webp)

*Figure 3: The order of operations that keeps changepoint results trustworthy.*

| Function or argument | Question it answers | What to watch |
|---|---|---|
| `cpt.mean()` | Did the average level shift? | Assumes variance is 1, so standardize first |
| `cpt.var()` | Did the spread change? | Needs longer segments than a mean change does |
| `cpt.meanvar()` | Did either or both change? | The safe default when you are unsure |
| `method = "PELT"` | Where are all the changepoints? | Exact and fast, the sensible default |
| `method = "BinSeg"` | Same, approximately | Greedy; a bad first split is unrecoverable |
| `method = "AMOC"` | Is there one changepoint? | Useful for teaching and for single-break questions |
| `penalty = "MBIC"` | How much is each changepoint worth? | Reported value is 3 log n, plus a charge for lopsided splits |
| `penalty = "CROPS"` | Which answers survive a range of penalties? | The best defence against a cherry-picked result |
| `minseglen` | How short may a regime be? | Guards against slivers, does not fix dependence |

The five things worth remembering:

1. **A changepoint search is cost plus a fee.** Score each segment by how badly one flat line fits it, then charge a fee per cut and minimise the total. Without the fee, the answer is always a cut everywhere.
2. **PELT gives the exact answer.** Its pruning rule discards only candidates that provably cannot win, so it matches an exhaustive search while running close to linear in the length of the series.
3. **`cpt.mean()` assumes unit variance.** This one detail causes more wrong results than everything else combined. Standardize, or use `cpt.meanvar()`.
4. **Report the plateau, not the default.** Sweep the penalty or run CROPS. An answer that survives a twentyfold range of penalties is a finding; one that changes with every nudge is not.
5. **Check the acf first.** Autocorrelation and trend both manufacture confident, entirely fictional changepoints. One line of diagnosis prevents a whole class of published mistakes.

## References

1. Killick, R., Fearnhead, P. and Eckley, I.A. *Optimal Detection of Changepoints with a Linear Computational Cost*. Journal of the American Statistical Association 107(500), 2012. The original PELT paper. [Link](https://arxiv.org/abs/1101.1438)
2. Killick, R. and Eckley, I.A. *changepoint: An R Package for Changepoint Analysis*. Journal of Statistical Software 58(3), 2014. [Link](https://www.jstatsoft.org/article/view/v058i03)
3. changepoint package reference manual, CRAN. Full argument documentation for every `cpt.*` function. [Link](https://cran.r-project.org/web/packages/changepoint/changepoint.pdf)
4. `cpt.mean` documentation, R Project. Argument-by-argument reference for mean changepoints. [Link](https://search.r-project.org/CRAN/refmans/changepoint/html/cpt.mean.html)
5. `cpt.meanvar` documentation, R Project. Covers the Normal, Gamma, Exponential and Poisson test statistics. [Link](https://search.r-project.org/CRAN/refmans/changepoint/html/cpt.meanvar.html)
6. Haynes, K., Eckley, I.A. and Fearnhead, P. *Computationally Efficient Changepoint Detection for a Range of Penalties*. The CROPS algorithm. [Link](https://arxiv.org/abs/1412.3617)
7. changepoint.np package, CRAN. Nonparametric changepoint detection for non-normal data. [Link](https://cran.r-project.org/package=changepoint.np)
8. `cpt.np` documentation, R Project. The nonparametric cost function in practice. [Link](https://search.r-project.org/CRAN/refmans/changepoint.np/html/cpt.np.html)

## Continue Learning

- [Anomaly Detection in Time Series in R](Anomaly-Detection-in-Time-Series-in-R.html) covers the other half of this problem, finding individual observations that do not belong rather than moments when the rules changed.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) shows how to strip out trend and seasonality, which is exactly the preprocessing that stops those two artefacts from manufacturing fake changepoints here.
- [ARIMA in R](ARIMA-in-R.html) is the tool for modelling the autocorrelation that broke the AR example above, so you can run a changepoint search on residuals that actually satisfy the independence assumption.
