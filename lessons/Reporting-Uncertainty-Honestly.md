---
title: "Uncertainty Quantification Lesson 7: Reporting Uncertainty Honestly"
catalog_blurb: "Pick the interval that fits the decision and report it without false precision."
description: "Report uncertainty honestly in R: tell aleatoric from epistemic uncertainty, match the interval to the decision, and quote a range without false precision."
keywords: "aleatoric uncertainty, epistemic uncertainty, prediction interval, confidence interval, coverage, over-coverage, under-coverage, critical fractile, decision cost, false precision, communicating uncertainty, uncertainty quantification, R"
post_type: "LESSON"
curriculum_id: "6.210.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "7"
course_total: "7"
course_landing: "R-Uncertainty-Course.html"
course_next: ""
course_prev: "The-Bootstrap-and-Jackknife-Plus.html"
---

=== step === cover
::eyebrow Lesson 7 of 7
## Reporting Uncertainty Honestly

Across six lessons you built machinery for honesty: a prediction interval that really covers 90% of the time, a conformal band with a guarantee, a recalibrated probability that means what it says, a bootstrap standard error for a statistic with no formula. You can now put a defensible number on what you do not know. This final lesson is about the last, most human step: carrying that number into a decision, and saying it out loud, without lying, either by sounding more certain than you are or by dressing a rough estimate in false precision.

Rohan the real-estate agent and Nadia the rain forecaster both come back, each holding an honest number and facing a real choice: what to quote, how much to stock, how to write it down. Getting from a correct interval to an honest decision turns on four ideas, and we take them one at a time.

By the end of this lesson you will be able to:

- Separate **aleatoric** uncertainty (the world's own irreducible noise) from **epistemic** uncertainty (what more data could still teach you), and see which part of a prediction interval each one is
- Match the uncertainty tool to the question, so you quote the interval a decision actually needs
- Weigh the asymmetric cost of over- versus under-covering, and pick the coverage level or quantile a decision's stakes call for
- Communicate an estimate without false precision: a point, a range, its meaning, and its assumptions

**Prerequisites:** Lessons 1 to 6 of this course, especially [prediction intervals and coverage](Prediction-Intervals-You-Can-Trust.html), [calibration](Calibration-Reliability-and-Recalibration.html), and the [bootstrap and jackknife+](The-Bootstrap-and-Jackknife-Plus.html). Base R: `lm()`, `predict()`, `quantile()`, vectors, a small function. A residual is actual minus predicted. Every new term is defined as it appears.

::widget calibration-curve {}

=== step === concept
::eyebrow Where we left off
## Two honest questions, one hidden split

In Lesson 6 you handed Rohan two honest numbers by resampling: a standard error for his headline median, and a jackknife+ range for one new home. Both were correct. But before you can *report* a number well, you have to understand what its uncertainty is made of, because not all not-knowing is the same kind.

Let us rebuild Rohan's 50 recent sales so we have something concrete to take apart. Each lesson runs in a fresh R session, so we create the data right here (run this once). Sizes are right-skewed like a real market, and price climbs with size plus honest, even scatter.

```r
set.seed(1)
n     <- 50
sqft  <- round(exp(rnorm(n, log(1500), 0.35)))          # home sizes, right-skewed like a real market
price <- round(60000 + 175 * sqft + rnorm(n, 0, 20000)) # price grows with size, plus honest noise
homes <- data.frame(sqft, price)
head(homes, 3)
#>   sqft  price
#> 1 1205 278837
#> 2 1600 327759
#> 3 1120 262822
```

Rohan's client is back with the same 1,500 square foot flat from Lesson 1. When Rohan predicts its price, his uncertainty comes from two completely separate places, and telling them apart is the first honest move.

=== step === concept
::eyebrow The first idea
## Aleatoric and epistemic: two kinds of not-knowing

Picture the two reasons Rohan cannot name an exact sale price.

First, suppose Rohan somehow knew the *true* average price of every 1,500 square foot flat in the city, down to the dollar. This one flat would still not sell for exactly that average. It has its own story: a fresh kitchen, a motivated seller, a bidding war, a rainy open-house week. That built-in, one-home-at-a-time randomness is **aleatoric uncertainty**, the irreducible noise in the world itself. No amount of extra data removes it, because it is not about Rohan's knowledge, it is about the coin the world flips for each home.

Second, Rohan does *not* know the true average line. He estimated it from just 50 sales, so the line itself could be a little off. That is **epistemic uncertainty**, uncertainty that comes from limited knowledge. It is the reducible kind: gather more sales and the line pins down, and this piece shrinks toward zero. (The names come from Latin *alea*, a die, and Greek *episteme*, knowledge.)

The prediction interval you met in Lesson 1 is exactly these two pieces combined. Its normal-theory half-width for a new home at size \(x_0\) was

\[ t \; s \sqrt{\,1 \;+\; \frac{1}{n} \;+\; \frac{(x_0 - \bar x)^2}{S_{xx}}\,}, \]

where \(s\) is the residual standard deviation (the typical miss), \(t\) is the multiplier that sets the level, \(n\) is the sample size, \(\bar x\) is the mean size, and \(S_{xx} = \sum_i (x_i - \bar x)^2\) is the spread of the sizes. The lone \(1\) under the root is the **aleatoric** piece: a single home's own scatter. It carries no \(n\), so more data cannot shrink it. The \(\tfrac{1}{n} + \tfrac{(x_0 - \bar x)^2}{S_{xx}}\) piece is the **epistemic** wobble in the fitted line, and every term in it has an \(n\), so it melts as data grows.

The aleatoric scale is a number we can read straight off the fitted model: it is \(s\), the residual standard deviation.

```r
fit <- lm(price ~ sqft, data = homes)
s   <- summary(fit)$sigma        # residual standard deviation: the typical single-home miss
round(s)
#> [1] 19563
```

That \(s\), about \$19,600, is the scale of the aleatoric noise: a typical home lands roughly \$19,600 off the line for reasons no model of size can explain. Hold onto it.

=== step === widget
::eyebrow Feel it
## Which piece shrinks with data?

The cleanest way to feel the split is to watch the two pieces respond differently to more data. In the panel below, slide the sample size up. The green **confidence** band, the epistemic uncertainty about the average line, collapses toward the line as data piles up. The orange **prediction** band, which also carries the aleatoric scatter of a single new home, barely narrows: you can always learn the average better, but you can never learn away an individual home's own dice.

::widget regression-intervals {}

Push the sample size to the maximum: the green band nearly vanishes, the orange band holds its width. That stubborn orange floor is aleatoric uncertainty. Next we put real numbers on both pieces.

=== step === concept
::eyebrow Measure the split
## Put a number on each piece

Let us compute the two pieces for Rohan's flat directly from the formula, using the \(s\), \(n\), and sizes we already have. The client's flat is \(x_0 = 1500\).

```r
x0   <- 1500                                       # the client's flat
xbar <- mean(homes$sqft)
Sxx  <- sum((homes$sqft - xbar)^2)
epistemic <- s * sqrt(1/n + (x0 - xbar)^2 / Sxx)   # uncertainty about the average LINE
aleatoric <- s                                     # one home's own scatter (the lone 1)
round(c(epistemic = epistemic, aleatoric = aleatoric))
#> epistemic aleatoric
#>      2864     19563
```

At 50 sales the epistemic wobble in the line is about \$2,900, while the aleatoric scatter is about \$19,600, nearly seven times larger. For a *single new home* the irreducible noise dominates. That is why a prediction interval stays stubbornly wide, and why Rohan cannot make the client's range much tighter just by studying harder.

Now the decisive test: does gathering far more data shrink the two pieces differently? Draw 2,000 sales from the very same market and recompute.

```r
set.seed(2)
N2     <- 2000
sqft2  <- round(exp(rnorm(N2, log(1500), 0.35)))
price2 <- round(60000 + 175 * sqft2 + rnorm(N2, 0, 20000))
big    <- data.frame(sqft = sqft2, price = price2)
fit2   <- lm(price ~ sqft, data = big)
s2     <- summary(fit2)$sigma
epistemic2 <- s2 * sqrt(1/N2 + (x0 - mean(big$sqft))^2 / sum((big$sqft - mean(big$sqft))^2))
round(c(epistemic_n2000 = epistemic2, aleatoric_n2000 = s2))
#> epistemic_n2000 aleatoric_n2000
#>             458           20089
```

Forty times more data cut the epistemic piece from about \$2,900 to about \$460 (it falls roughly with \(1/\sqrt{n}\)), while the aleatoric scale barely moved, near \$20,000, exactly what \(s\) estimated all along. More data buys down epistemic uncertainty and leaves aleatoric untouched.

[KEY INSIGHT]
Epistemic uncertainty is a to-do item: collect more or better data and it shrinks. Aleatoric uncertainty is a fact of the world: report it, do not promise to remove it. Knowing which is which tells you whether more data will help, and stops you promising a precision the world will not grant.

=== step === quiz
::eyebrow Check yourself
## More data, which piece?

Rohan collects ten times more sales and refits. What happens to the 90% prediction interval for one specific new flat?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both the epistemic and aleatoric pieces shrink, so the interval narrows a lot ::no More data shrinks only the epistemic piece, the wobble in the line. The aleatoric scatter of a single home is set by the world, not the sample size, so the interval narrows only a little and then stops.
- The epistemic piece shrinks toward zero but the aleatoric piece stays, so the interval narrows only modestly and then hits a floor ::ok Right. Ten times the data pins the line down (epistemic falls with 1 over root n), but a single new home still carries its own irreducible scatter, so the prediction interval settles at a floor set by the aleatoric noise.
- The prediction interval shrinks until it equals the confidence interval ::no They never meet. The confidence interval is the epistemic piece alone; the prediction interval always adds the aleatoric scatter on top, and that does not shrink. With infinite data the confidence interval goes to zero while the prediction interval keeps its aleatoric width.

=== step === concept
::eyebrow The second idea
## Match the interval to the question

Every tool in this course answers a *specific* question. Reach for the wrong one and you can be perfectly correct and still mislead. The most common slip is the one from Lesson 1: quoting a *confidence* interval, which is about the average, when someone asked about *one* outcome. Watch the two side by side for the client's flat.

```r
ci <- predict(fit, data.frame(sqft = x0), interval = "confidence", level = 0.90)
pi <- predict(fit, data.frame(sqft = x0), interval = "prediction", level = 0.90)
round(rbind(confidence = ci[1, ], prediction = pi[1, ]))
#>               fit    lwr    upr
#> confidence 325046 320243 329849
#> prediction 325046 291885 358206
```

The confidence interval is about \$9,600 wide; the prediction interval is about \$66,000 wide, nearly seven times more. Both are correct, to *different questions*. The confidence interval answers "what does the average 1,500 foot flat sell for?", the number you would want to price a whole development. The prediction interval answers "what will THIS flat sell for?", the only question the client is asking. Quote the tight \$9,600 range to a single seller and you have technically not lied, yet you have promised a precision that will be wrong most of the time.

So the discipline is: name the decision first, then pick the object. Here is the whole course as a chooser.

::widget process-flow {"steps":[{"title":"A summary of your data?","sub":"a mean, median, correlation, or coefficient: bootstrap it for a standard error and a percentile interval"},{"title":"One new numeric outcome?","sub":"a prediction interval: split conformal or the jackknife+ when you need a guarantee"},{"title":"An outcome whose spread changes?","sub":"quantile regression, for a band whose width breathes with the input"},{"title":"Is a stated probability honest?","sub":"a reliability diagram and recalibration, not an interval at all"}]}

Pick by the question, not by habit: a summary statistic wants a bootstrap; one new outcome wants a prediction interval (conformal or jackknife+ when you need a guarantee); a spread that changes with the input wants quantile regression; and a probability wants a calibration check, not an interval at all.

=== step === quiz
::eyebrow Check yourself
## Which tool answers the question?

Nadia's dispatcher asks: "on mornings the model calls 0.82, how often does it actually rain, so I know whether to trust that number?" Which tool from this course answers *that* question?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A bootstrap standard error on the overall rain rate ::no That gives the uncertainty of a summary statistic (the average rain frequency), not whether a stated 0.82 is honest. The question is about the meaning of the probability itself.
- A reliability diagram, and recalibration if it is off ::ok Right. Asking whether mornings labeled 0.82 actually rain about 82% of the time is exactly calibration. A reliability diagram checks it and Platt or isotonic recalibration repairs it; no interval is involved.
- A 90% prediction interval from a linear model ::no A prediction interval is for a numeric outcome with a spread. Nadia's outcome is a yes or no event summarized by a probability, and the honesty of that probability is a calibration question, not an interval width.

=== step === concept
::eyebrow The third idea
## Over- and under-covering cost different amounts

An interval keeps a promise about how often the truth lands inside it. You can break that promise in two directions.

An interval that **under-covers** is too narrow: it catches the truth *less* often than its label claims, a 90% interval that really covers 80%. This is the same disease as an **over-confident** probability from Lesson 5 (predict 0.9, it rains 0.8): the number oversells its certainty, so you are surprised more often than you bargained for. Drag the panel below toward over-confident to see the reliability curve sag below the diagonal, the visual signature of under-coverage.

::widget calibration-curve {}

An interval that **over-covers** is too wide: a 99% interval quoted when 80% would do. It keeps its promise, but says so little that it is nearly useless. Rohan quoting any home at "somewhere between \$0 and \$5,000,000" covers every sale and informs no one.

Between too narrow and too wide sits a real trade, and here is the key move: the right point on it is not automatically 90%. It depends on which mistake hurts more. When being surprised is catastrophic (a bridge load, a drug dose, an evacuation call) you buy wide intervals and high coverage. When a miss is cheap and a wide answer is costly, you accept lower coverage. The decision's stakes, not convention, set the level.

=== step === concept
::eyebrow When the costs are lopsided
## Let the decision pick the quantile

Nadia's dispatcher makes exactly this trade, with money. Each morning it must pre-position rain-gear kits before the couriers roll out, without knowing the day's exact demand. The two mistakes are not equal: running one kit *short* means a courier caught in the rain and a ruined package, while one *unused* kit is a small waste. Say a shortfall costs four times an overage.

When the costs of over- and under-shooting are lopsided, aiming at the middle (the median demand) is wrong: you should deliberately over-stock, because here the cheap mistake is to have too many. The exact target is a classic result, the **critical fractile**: stock at the quantile

\[ q^\star \;=\; \frac{c_u}{c_u + c_o}, \]

where \(c_u\) is the cost of being one unit short (under-shooting) and \(c_o\) is the cost of one unit of overage. With a shortfall four times as costly as an overage, \(c_u = 4\) and \(c_o = 1\), so \(q^\star = 4/5 = 0.8\): stock at the 80th percentile of demand, not the 50th. Let us build the demand and confirm the fractile.

```r
set.seed(7)
demand <- rpois(1000, lambda = 20)   # rain-gear kits needed per morning, uncertain
cu <- 4                              # cost of being ONE kit short: a courier caught in the rain
co <- 1                              # cost of ONE unused kit
round(c(mean_demand = mean(demand), median_demand = median(demand)))
#>   mean_demand median_demand
#>            20            20
q_star <- cu / (cu + co)             # the critical fractile
q_star
#> [1] 0.8
```

=== step === tryit
::eyebrow Your turn
## Stock to the critical fractile

The cost-minimizing stock is the \(q^\star\) quantile of demand, rounded up to whole kits (you cannot stock a fraction of a kit). `demand` holds the 1,000 daily figures and `q_star` is 0.8. Fill in the blank.

```r
# stock at the critical-fractile quantile, rounded up to whole kits
stock <- ceiling(quantile(demand, ____))
stock
```
::check {"regex":"quantile\\(\\s*demand\\s*,\\s*(q_star|cu\\s*/\\s*\\(\\s*cu\\s*\\+\\s*co\\s*\\)|0?\\.8)","gate":true,"difficulty":"intermediate","ok":"24 kits, four above the median of 20. Because a shortfall costs four times an overage, the honest target is the 0.8 quantile, quantile(demand, cu / (cu + co)), not the middle. Aiming at the median would under-stock on exactly the mornings that hurt most.","no":"The optimal stock is the critical-fractile quantile of demand. q_star is cu / (cu + co) = 0.8, so quantile(demand, q_star), or equivalently quantile(demand, cu / (cu + co))."}
::solution
```r
stock <- ceiling(quantile(demand, q_star))
stock
#> 80%
#>  24
```

=== step === concept
::eyebrow See the minimum
## The cost curve confirms it

You do not have to trust the formula on faith. Sweep every candidate stock level, compute the average daily cost of each against the 1,000 days of demand, and find the cheapest. The average cost of stocking \(S\) kits is \(c_u\) times the shortfall plus \(c_o\) times the overage, averaged over days.

```r
expected_cost <- function(S) mean(cu * pmax(demand - S, 0) + co * pmax(S - demand, 0))
kits  <- 14:30
costs <- sapply(kits, expected_cost)
best  <- kits[which.min(costs)]
data.frame(kits = c(20, 22, 24, 26),
           avg_cost = round(sapply(c(20, 22, 24, 26), expected_cost), 2))
#>   kits avg_cost
#> 1   20     9.42
#> 2   22     7.12
#> 3   24     6.33
#> 4   26     6.93
c(best_stock = best, quantile_0.8 = as.numeric(ceiling(quantile(demand, 0.8))))
#>   best_stock quantile_0.8
#>           24           24
```

Stocking to the median (20 kits) averages 9.42 a day; stocking 24 drops it to 6.33, a third cheaper, purely from aiming at the right quantile. And the cheapest level, 24, is exactly the 0.8 quantile the critical fractile predicted. Plotting the whole sweep shows the familiar U: too few kits is expensive (costly shortfalls), too many is expensive (wasted kits), and the bottom sits at the critical fractile.

```r
plot(kits, costs, type = "b", pch = 19, col = "#1a73e8",
     xlab = "kits stocked", ylab = "average daily cost")
abline(v = best, lty = 2, col = "#1f7a55")   # the critical-fractile minimum
```

Run it: a clean valley bottoming at 24. The coverage, or here the quantile, a decision needs is the one its costs point to, not a default level pulled from habit.

=== step === concept
::eyebrow The fourth idea
## Say it without false precision

You have an honest number and the right interval. The last way to lie is in how you write it down. Ask Rohan's model for the client's price.

```r
pred <- predict(fit, data.frame(sqft = x0))   # the point prediction
pred
#>        1
#> 325045.7
```

The model prints \$325,045.70, to the cent. Reporting it that way is a quiet falsehood: those trailing digits claim a precision the model does not have. How much precision does it have? Look at the interval around it.

```r
band <- predict(fit, data.frame(sqft = x0), interval = "prediction", level = 0.90)
half <- (band[, "upr"] - band[, "lwr"]) / 2
round(c(point = as.numeric(pred), half_width = as.numeric(half)))
#>      point half_width
#>     325046      33160
```

The 90% interval reaches about \$33,000 either side. When your uncertainty is in the tens of thousands, quoting a prediction to the cent, or even to the exact dollar, is noise dressed as knowledge. The honest rule: round the estimate to the resolution its uncertainty allows, roughly the place of the first significant digit of the interval's half-width. A \$33,000 uncertainty lives in the ten-thousands, so round to the nearest \$10,000.

```r
round(as.numeric(pred), -4)                              # the point, nearest 10,000
#> [1] 330000
round(as.numeric(c(band[, "lwr"], band[, "upr"])), -4)   # the interval, nearest 10,000
#> [1] 290000 360000
```

So Rohan says: "about \$330,000, and I am 90% confident it lands between \$290,000 and \$360,000." Every digit in that sentence is one he can stand behind, and the range does the honest work the point pretended to do.

=== step === tryit
::eyebrow Your turn
## Round to what you can defend

Report the point prediction to the precision its roughly 33,000 uncertainty justifies: the nearest 10,000. `pred` holds the raw prediction. Fill in the blank to produce the honest figure.

```r
# round to the nearest 10,000, the resolution a ~33,000 uncertainty allows
honest_point <- ____
honest_point
```
::check {"regex":"(round\\([^)]*pred[^,]*,\\s*-4|signif\\([^)]*pred[^,]*,\\s*2)","gate":true,"difficulty":"intermediate","ok":"330000. Rounding to the nearest 10,000 with round(pred, -4), or to two significant figures with signif(pred, 2), drops the fake precision and keeps only the digits the interval can support.","no":"You want the nearest 10,000: round(as.numeric(pred), -4), or signif(pred, 2) for two significant figures. Both give 330000."}
::solution
```r
honest_point <- round(as.numeric(pred), -4)
honest_point
#> [1] 330000
```

=== step === concept
::eyebrow Put it together
## An honest number, every time

Four ideas, one habit. Whenever you report a result under uncertainty, run the same short checklist.

::widget process-flow {"steps":[{"title":"State a point and a range","sub":"never the single number alone: quote the interval it lives in"},{"title":"Say the level and what it means","sub":"90 percent coverage means about nine in ten such cases land inside"},{"title":"Round to the precision you earned","sub":"drop digits finer than the uncertainty: 330,000, not 325,045.70"},{"title":"Name the assumptions and scope","sub":"which population, which method, and when the guarantee holds"}]}

Rohan's brief now reads: about \$330,000 for this flat, 90% confident between \$290,000 and \$360,000, from a straight-line model on 50 recent local sales, valid for homes like these in this neighborhood. Nadia's reads: stock 24 kits, the 80th percentile of demand, because a shortfall costs us four times an unused kit. Neither hides its uncertainty; neither fakes a precision it lacks.

[WARNING]
Honest reporting cannot rescue a dishonest model. Every interval in this course assumes the model is roughly right and the data are exchangeable, that the new case looks like the ones you learned from. If the model is biased, or the world has shifted since training (a market crash, a new weather regime), your interval will faithfully quantify the wrong answer. Honest uncertainty still needs an honest model and honest sampling; when either is in doubt, say *that* too.

=== step === concept
::eyebrow Go deeper
## References

- [Kendall and Gal (2017), What Uncertainties Do We Need in Bayesian Deep Learning for Computer Vision?](https://arxiv.org/abs/1703.04977) - the clean split between aleatoric (data noise) and epistemic (model) uncertainty that this lesson turns on.
- [Gneiting (2011), Making and Evaluating Point Forecasts](https://arxiv.org/abs/0912.0902) - why the summary you report (a mean, a median, or a specific quantile) must match the decision's loss function; the theory behind the critical fractile.
- [Spiegelhalter (2017), Risk and Uncertainty Communication (Annual Review of Statistics)](https://doi.org/10.1146/annurev-statistics-010814-020148) - how to communicate a number and its uncertainty to a real audience without misleading them.
- [Manski (2020), The Lure of Incredible Certitude (Economics and Philosophy)](https://doi.org/10.1017/S0266267119000105) - the damage done by reporting estimates with false precision, and the case for honest interval reporting.
- [Angelopoulos and Bates (2023), A Gentle Introduction to Conformal Prediction](https://arxiv.org/abs/2107.07511) - the distribution-free toolkit this course used to guarantee coverage without assuming a bell curve.

=== step === complete
## Lesson 7 complete

You can now carry an uncertain number into a decision and report it honestly. You learned to split uncertainty into **aleatoric** (the world's own irreducible noise, which more data cannot shrink) and **epistemic** (limited knowledge of the model, which it can), and to see both pieces inside a single prediction interval. You learned to **match the tool to the question**, so a single seller hears a prediction interval, not a confidence interval, and a suspect probability gets a calibration check, not a band. You learned that over- and under-covering **cost different amounts**, so the right coverage or quantile is the one a decision's stakes call for, the critical fractile when they are lopsided. And you learned to state a result **without false precision**: a point, a range, its level, and its assumptions.

That closes the course. Across seven lessons you went from a single point prediction to a full, defensible account of what you do not know: prediction intervals and their coverage, split and classification conformal with finite-sample guarantees, quantile and distributional regression for spreads that breathe, calibration for honest probabilities, the bootstrap and jackknife+ for uncertainty from resampling alone, and finally the judgment to report all of it honestly. Quantifying uncertainty well is not pessimism; it is the difference between a number people can act on and one that only sounds confident.
