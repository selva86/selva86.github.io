---
title: "Causal Inference for Decisions Lesson 7: Synthetic Control"
catalog_blurb: "Estimate a policy's effect when only one unit was treated and no control fits."
description: "When just one unit gets a policy and no control fits, build a synthetic twin from a weighted blend of donor units, then read the effect as the post-policy gap."
keywords: "synthetic control, causal inference, donor pool, weighted average, placebo test, RMSPE, treatment effect, policy evaluation, comparative case study, R"
post_type: "LESSON"
curriculum_id: "6.180.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "7"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Uplift-and-Heterogeneous-Effects.html"
course_prev: "Instrumental-Variables-and-2SLS.html"
---

=== step === cover
::eyebrow Lesson 7 of 11
## Synthetic Control

Lesson 6 found a hidden lever, a randomized reminder, to pull a clean effect out of confounded data. But look back at every method in this course so far: matching, weighting, difference-in-differences, instruments. Each one needed a comparison **group**, many treated units and many untreated ones. What do you do when exactly **one** unit ever got the policy, one city, one company, one country, and no single other unit is a fair stand-in for it?

The answer is one of the most elegant ideas in causal inference: if no real control fits, **build** one. Blend several untreated units into a synthetic twin that tracks your treated unit before the policy, then read the effect as the gap that opens after.

By the end of this lesson you will be able to:

- Explain the synthetic control setup and why a single control unit or a plain average is not good enough
- Build a synthetic control as a weighted blend of donor units, with the weights fit on the pre-policy period only
- Read the treatment effect as the post-policy gap, and know why a near-zero pre-policy gap is what makes it believable
- Judge the result with a placebo test when you have just one treated unit and no standard error to lean on

**Prerequisites:** [Lesson 3](Difference-in-Differences-and-Parallel-Trends.html) (why a naive before/after comparison is biased) and [Lesson 6](Instrumental-Variables-and-2SLS.html) (recovering an effect when there is no clean control). You can read base R: `%*%`, `optim`, and indexing a vector.

::widget synth-control {}

=== step === concept
::eyebrow The setup
## One city taxes soda; nowhere is a perfect copy

Meet **Marisol**, a mid-sized city that, on the first day of **month 25**, put a small tax on sugary soda. The city council wants one honest number: how many cans of soda per person, per month, did the tax actually remove? Get it right and other cities will copy the policy; get it wrong and a good idea dies or a useless one spreads.

The trouble is that Marisol is the only city that taxed. We have **ten comparison cities** that never did, but no single one of them is a twin: some are bigger, some drink more soda, some were already cutting back faster. And soda drinking was drifting down everywhere anyway, so we cannot just compare Marisol before and after and blame the whole change on the tax.

Each lesson runs in a fresh R session, so we build the data ourselves. Because we simulated it, we know the true answer to check against: the tax truly removes **5 cans per person per month**.

```r
set.seed(1)
Tpre <- 24; Tpost <- 12; Tt <- Tpre + Tpost      # 36 months of data; the tax starts at month 25
pre  <- 1:Tpre                                    # the 24 months BEFORE Marisol's soda tax
post <- (Tpre + 1):Tt                             # the 12 months AFTER it

# ten comparison cities that never taxed soda: cans of soda sold per person, each month
donors <- sapply(1:10, function(j) 46 + cumsum(rnorm(Tt, mean = -0.03 * j, sd = 0.7)))

# Marisol moves like a blend of cities 1, 2 and 3 ... until the tax cuts 5 cans a month
marisol <- as.numeric(donors %*% c(0.5, 0.3, 0.2, rep(0, 7))) + rnorm(Tt, 0, 0.4)
marisol[post] <- marisol[post] - 5                # the TRUE effect we will spend the lesson recovering

round(head(cbind(month = 1:Tt, marisol = marisol, city1 = donors[, 1], city2 = donors[, 2])), 1)
#>      month marisol city1 city2
#> [1,]     1    44.7  45.5  45.7
#> [2,]     2    46.1  45.6  45.6
#> [3,]     3    45.1  45.0  46.3
#> [4,]     4    45.9  46.1  46.7
#> [5,]     5    45.9  46.3  46.6
#> [6,]     6    45.8  45.7  46.3
```

Plot all eleven cities. Marisol is the dark line; the ten comparison cities are grey. Before the tax they weave through the same band; the question is which combination of them is Marisol's true twin.

```r
library(ggplot2)
traj <- data.frame(month   = rep(1:Tt, 11),
                   cans    = c(marisol, as.numeric(donors)),
                   city    = rep(c("Marisol", paste0("city", 1:10)), each = Tt),
                   treated = rep(c(TRUE, rep(FALSE, 10)), each = Tt))
donors_lines  <- subset(traj, !treated)
marisol_line  <- subset(traj,  treated)
ggplot(mapping = aes(month, cans, group = city)) +
  geom_vline(xintercept = 24.5, linetype = "dotted") +
  geom_line(data = donors_lines, colour = "grey78", linewidth = 0.5) +
  geom_line(data = marisol_line, colour = "#1c2c4f", linewidth = 1.2) +
  annotate("text", x = 24.5, y = min(traj$cans), label = "soda tax", hjust = -0.05, size = 3) +
  labs(x = "month", y = "cans of soda per person",
       title = "Marisol (dark) among ten comparison cities: which blend is its twin?")
```

=== step === concept
::eyebrow Why the easy answers fail
## Before-after, one twin, or an average: all wrong

Three tempting shortcuts, three wrong numbers. Watch them miss.

**Just compare Marisol before and after.** Soda sales were already drifting, so this credits the tax with whatever the city was doing anyway.

```r
naive_ba <- mean(marisol[post]) - mean(marisol[pre])   # after minus before, Marisol alone
round(naive_ba, 2)
#> [1] -4.23
```

**Pick the single city that looks most like Marisol.** Even the closest twin has its own quirks after month 25, so its gap is noisy. And **average all ten cities**, and you get a line that never even matched Marisol to begin with, so its post-tax gap is meaningless. Here is each idea scored two ways: how tightly it tracks Marisol before the tax (`pre_RMSE`, smaller is better), and the effect it would report.

```r
rmse_pre <- function(x) sqrt(mean((marisol[pre] - x[pre])^2))     # typical pre-tax gap
best <- which.min(sapply(1:10, function(j) rmse_pre(donors[, j])))  # the closest single city
avg  <- rowMeans(donors)                                          # the plain 10-city average
round(c(single_pre_RMSE  = rmse_pre(donors[, best]),
        single_effect    = mean(marisol[post] - donors[, best][post]),
        average_pre_RMSE = rmse_pre(avg),
        average_effect   = mean(marisol[post] - avg[post])), 2)
#>  single_pre_RMSE    single_effect average_pre_RMSE   average_effect
#>             0.76            -7.04             3.01             0.23
```

The truth is **-5**. The before-after says -4.23, the best single city says **-7.04**, the plain average says **+0.23** (essentially "no effect"). Three shortcuts, three misses, bracketing the truth on both sides. Notice the tell in the numbers: the average tracks Marisol terribly before the tax (`pre_RMSE` 3.01), so nothing it says afterward can be trusted. That is the whole clue we need.

[KEY INSIGHT]
A control is only believable if it matched the treated unit **before** the policy. No single donor city does that well enough. The fix is not to pick one, but to **mix** several so the blend traces Marisol exactly, up to the day the tax lands.

=== step === concept
::eyebrow The fix
## A weighted blend that traces the treated unit

The idea is simple to say. Instead of choosing one comparison city, take a **weighted average** of all of them, and choose the weights so the blend lies right on top of Marisol for every pre-tax month. That blend is the **synthetic control**: a made-to-measure twin, assembled from real untreated cities.

Here is the recipe, then the math.

::widget process-flow {"steps":[{"title":"Match on the pre-period","sub":"choose donor weights so the weighted blend tracks the treated unit through every month BEFORE the policy"},{"title":"Build the synthetic control","sub":"the weighted average of donor units is the synthetic twin of the treated unit"},{"title":"Read the gap","sub":"after the policy, treated minus synthetic is the estimated effect"}]}

Write \(Y_{jt}\) for the outcome (cans per person) of city \(j\) in month \(t\). City 1 is Marisol, treated from month \(T_0 + 1\) on (here \(T_0 = 24\)); cities \(2\) through \(11\) are the **donor pool**. The synthetic control is a weighted average of the donors,

\[ \hat Y_{1t} \;=\; \sum_{j=2}^{11} w_j\, Y_{jt}, \]

and the weights live on the **simplex**: every weight is non-negative, \(w_j \ge 0\), and together they sum to one, \(\sum_j w_j = 1\). We choose them to make the synthetic hug Marisol over the pre-tax months **only**:

\[ \mathbf{w}^{\star} \;=\; \arg\min_{\mathbf{w}}\ \sum_{t \le T_0}\Big(Y_{1t} - \sum_{j=2}^{11} w_j\, Y_{jt}\Big)^{2}. \]

Read that in words: find the weights that make the total squared gap between Marisol and its blend, added up across the pre-tax months, as small as possible.

Why force the weights onto the simplex, non-negative and summing to one? Because it makes the synthetic a genuine **interpolation**. A blend of real cities can never sit outside the range of what those cities actually did; it cannot invent a city that sold more soda than every donor or less than all of them. An unconstrained regression would happily extrapolate to such fictions to shave the last bit of pre-period error. The simplex keeps the twin honest.

=== step === tryit
::eyebrow Your turn
## Fit the weights on the pre-period

The one subtle move in the whole method: the weights are fit on the **pre-tax months only**. If you let the fit see the post-tax data, the tax itself would leak into the weights and the twin would chase the drop, hiding the very effect you are trying to measure.

Below, the softmax `exp(th) / sum(exp(th))` turns any unconstrained numbers `th` into weights that are automatically non-negative and sum to one, so `optim` can search freely and still land on the simplex. The `local({ ... })` wrapper on the next line just runs the optimizer and hands back the finished weights, keeping its scratch variables out of your workspace. Fill in the blank so the tracking error is summed over the pre-tax months.

```r
loss <- function(th) {
  w <- exp(th) / sum(exp(th))                   # softmax: any theta -> weights >= 0 that sum to 1
  sum((marisol[pre] - donors[____, ] %*% w)^2)  # squared tracking error, over WHICH months?
}
w <- local({ o <- optim(rep(0, 10), loss, control = list(maxit = 3000)); exp(o$par) / sum(exp(o$par)) })
synth <- as.numeric(donors %*% w)               # the synthetic Marisol
round(w, 2)
```
::check {"regex":"donors\\[\\s*pre\\s*,","gate":true,"difficulty":"intermediate","ok":"Yes. Fitting on donors[pre, ] keeps the tax out of the weights; the blend leans on cities 1, 2 and 3 (about 0.49, 0.32, 0.19) and zeroes the other seven, recovering the true mix.","no":"The weights must be learned from the pre-tax months so the policy cannot leak in. Subset the donor rows to the pre-period: donors[pre, ]."}
::solution
```r
loss <- function(th) {
  w <- exp(th) / sum(exp(th))
  sum((marisol[pre] - donors[pre, ] %*% w)^2)
}
w <- local({ o <- optim(rep(0, 10), loss, control = list(maxit = 3000)); exp(o$par) / sum(exp(o$par)) })
synth <- as.numeric(donors %*% w)
round(w, 2)
#>  [1] 0.49 0.32 0.19 0.00 0.00 0.00 0.00 0.00 0.00 0.00
```

=== step === widget
::eyebrow The payoff
## Match before, split after

The fit put about **half its weight on city 1, a third on city 2, a fifth on city 3**, and essentially nothing on the other seven. Recall we built Marisol as exactly `0.5, 0.3, 0.2` of those three cities, so the method recovered the true mix on its own, using only the pre-tax data. And it tracks Marisol far tighter than any shortcut: a pre-period gap of about 0.4 cans, versus 0.76 for the best single city and 3.01 for the average.

Now read the effect. For each post-tax month the gap between Marisol and its twin is the estimated effect,

\[ \hat\tau_t \;=\; Y_{1t} - \hat Y_{1t}, \qquad t > T_0, \]

and we report the average post-tax gap. The one guardrail: trust it only if the **pre-tax** gap is near zero. If the twin already failed to match Marisol before the tax, a post-tax gap tells you nothing about the tax.

```r
round(c(true    = -5,
        effect  = mean(marisol[post] - synth[post]),   # post-tax gap = the estimated effect
        pre_gap = mean(marisol[pre]  - synth[pre])), 2) # near zero => the twin is trustworthy
#>    true  effect pre_gap
#>   -5.00   -5.09   -0.05
```

An estimate of **-5.09** against a true **-5**, with a pre-tax gap of essentially zero. Toggle the widget above between **Trajectories** and **Gap** to see the same story: the two lines sit on top of each other, then peel apart the moment the policy lands. Here is Marisol and its real synthetic twin:

```r
gap_df <- data.frame(month = rep(1:Tt, 2),
                     cans  = c(marisol, synth),
                     line  = rep(c("Marisol (taxed)", "synthetic Marisol"), each = Tt))
ggplot(gap_df, aes(month, cans, colour = line, linetype = line)) +
  geom_vline(xintercept = 24.5, linetype = "dotted") +
  geom_line(linewidth = 0.9) +
  labs(x = "month", y = "cans of soda per person", colour = NULL, linetype = NULL,
       title = "Matched before the tax, split by about 5 cans after")
```

=== step === quiz
::eyebrow Check yourself
## What a bad pre-period fit means

Suppose you build a synthetic control for a different city and find that, **before** the policy, the synthetic sits a steady 4 cans above the treated city (a large, non-zero pre-period gap). After the policy the gap is 6 cans. What can you conclude about the policy's effect?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The effect is 6 cans, the full post-period gap ::no The post-period gap is only meaningful as a departure from a matched baseline. Here the baseline was never matched (a 4-can gap before anything happened), so 6 is not a clean effect.
- The effect is 2 cans: subtract the 4-can pre-period gap from the 6-can post-period gap ::no Subtracting the pre-gap is the difference-in-differences move, and it leans on the gap being a stable, parallel offset. A synthetic control that misses by 4 cans pre-policy has shown it is a poor twin; you cannot assume that miss stays constant. The honest conclusion is that this synthetic is not usable.
- You cannot trust any effect from it: the synthetic never matched the city before the policy, so it is a bad twin ::ok Exactly. A near-zero pre-period gap is the license to read the post-period gap as an effect. A large pre-period gap means the donor pool cannot reproduce this city, and the whole comparison is void. Report the poor fit and stop, or find better donors.
- The large gap proves the effect is large and real ::no A pre-period gap exists before the policy could have done anything, so it cannot be an effect. It is evidence the twin is wrong, not that the effect is big.

=== step === concept
::eyebrow Inference with n = 1
## Is the gap real, or could any city fake it?

You have **one** treated city. There is no sample of treated units to compute a standard error from, so the usual p-value machinery does not apply. Synthetic control answers a different, cleverer question: **if the tax did nothing, how unusual is Marisol's gap?**

The trick is a **placebo test in space**. Pretend, in turn, that each untreated donor city was the one that got taxed. Build a synthetic control for it from the *other* donors, and measure its post-period gap. None of these cities was actually taxed, so their gaps show the size of gap you get from noise and imperfect fit alone. If Marisol's real gap towers over this placebo distribution, the tax, not chance, is the likely cause.

We score each city fairly with the ratio of its **post-period** to its **pre-period** typical gap, the RMSPE ratio, where RMSPE (root mean squared prediction error) is just the typical size of the gap over a set of months:

\[ r \;=\; \frac{\mathrm{RMSPE}_{\text{post}}}{\mathrm{RMSPE}_{\text{pre}}}, \qquad \mathrm{RMSPE}(\mathcal{T}) = \sqrt{\frac{1}{|\mathcal{T}|}\sum_{t \in \mathcal{T}} \hat\tau_t^{\,2}}. \]

Dividing by the pre-period fit is the key: a city its donors track badly will post a big gap for a boring reason, and the ratio cancels that out. A large ratio means a city that was fit well and then jumped, exactly the tax signature.

```r
rmspe <- function(g, idx) sqrt(mean(g[idx]^2))          # typical gap over a set of months
fit_gap <- function(y, X) {                             # synthetic twin for series y from donors X
  lo <- function(th) { w <- exp(th) / sum(exp(th)); sum((y[pre] - X[pre, ] %*% w)^2) }
  o  <- optim(rep(0, ncol(X)), lo, control = list(maxit = 3000))
  w  <- exp(o$par) / sum(exp(o$par)); y - as.numeric(X %*% w)   # the gap: actual minus synthetic
}
ratio_of <- function(g) rmspe(g, post) / rmspe(g, pre)  # post misfit relative to pre fit

real_ratio    <- ratio_of(marisol - synth)                             # Marisol
placebo_ratio <- sapply(1:10, function(j) ratio_of(fit_gap(donors[, j], donors[, -j])))
round(real_ratio, 1)
#> [1] 13.8
round(sort(placebo_ratio, decreasing = TRUE), 1)
#> [1] 8.9 5.3 4.4 3.4 2.8 2.3 1.8 1.5 1.3 1.3
```

Marisol's ratio is **13.8**, above every placebo. A one-line p-value is the fraction of all eleven cities whose ratio is at least as extreme as Marisol's:

```r
all_ratios <- c(real_ratio, placebo_ratio)
round(c(marisol_rank = rank(-all_ratios)[1],
        n_units      = length(all_ratios),
        p_value      = mean(all_ratios >= real_ratio)), 3)
#> marisol_rank      n_units      p_value
#>        1.000       11.000        0.091
```

Marisol ranks **first of eleven**, so the p-value is 1/11, about **0.091**. Plot every city's gap over time. Marisol (red) barely moves before the tax, then plunges; the grey placebos wobble around zero throughout.

```r
gaps <- sapply(1:10, function(j) fit_gap(donors[, j], donors[, -j]))   # a gap path per placebo city
gap_paths <- data.frame(
  month = rep(1:Tt, 11),
  gap   = c(marisol - synth, as.numeric(gaps)),
  unit  = rep(c("Marisol", paste0("placebo", 1:10)), each = Tt),
  taxed = rep(c(TRUE, rep(FALSE, 10)), each = Tt))
placebo_paths <- subset(gap_paths, !taxed)
marisol_path  <- subset(gap_paths,  taxed)
ggplot(mapping = aes(month, gap, group = unit)) +
  geom_hline(yintercept = 0, colour = "grey70") +
  geom_vline(xintercept = 24.5, linetype = "dotted") +
  geom_line(data = placebo_paths, colour = "grey75", linewidth = 0.5) +
  geom_line(data = marisol_path,  colour = "#c0392b", linewidth = 1.2) +
  labs(x = "month", y = "gap: city minus its synthetic",
       title = "Marisol's post-tax drop is the most extreme of eleven cities")
```

=== step === quiz
::eyebrow Check yourself
## Reading the placebo result

Marisol's gap was the most extreme of all eleven cities, giving a p-value of 0.091, which is above the usual 0.05 line. A colleague says: "0.091 is not significant, so the tax had no effect." What is the right reading?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- They are right: p above 0.05 means we accept that the effect is zero ::no A p-value never proves the effect is zero, and 0.091 is not weak evidence here. With so few donors the test simply cannot report a smaller number, no matter how dramatic the drop.
- With only 10 donors the smallest possible p-value is 1/11 = 0.091, so ranking first is the strongest result the test can give; more donor cities would allow a smaller p ::ok Right. The p-value is a rank among J+1 units, so its floor is 1/(J+1). Marisol hitting that floor means it is the single most extreme of every city tested, which is the most convincing outcome available. A larger, well-matched donor pool is how you would push the p-value lower.
- The 0.091 is wrong: we should compute a standard error from the regression and get a real p-value instead ::no With one treated unit there is no sampling distribution of treated units to build a standard error from. The placebo distribution IS the inference here; that is the whole point of the method.
- The result is meaningless because a p-value needs a large sample ::no The placebo test is exact for the design: it asks how Marisol ranks against every city pretending to be treated. It is small-sample by nature, not broken by it.

=== step === concept
::eyebrow Read the fine print
## What synthetic control assumes, and when it breaks

The method is powerful, but like every tool in this course it buys its answer with assumptions. Name them out loud, because a synthetic control that looks clean can still be wrong.

- **A good pre-period fit is mandatory, not optional.** If no blend of donors tracks the treated unit before the policy, stop. There is no honest effect to read, and reporting the poor fit is the correct result, not a failure.
- **No anticipation.** If Marisol's residents stockpiled soda the month before the tax, the "pre" period is already contaminated. The intervention date must be a clean break.
- **A clean donor pool.** Donors must be units the policy did not touch, directly or by spillover. A neighbouring city where shoppers cross the border to dodge the tax is a contaminated donor.
- **Enough pre-periods, and a stable structure.** A handful of pre-policy months cannot pin down weights reliably; the method wants a long, well-behaved history. And a big shock hitting only the donors after the policy (a soda-price war elsewhere) would masquerade as an effect.

In practice you would not hand-roll `optim` every time. The `tidysynth` package fits the whole method, including the classic Abadie predictor-matching weights and the placebo inference you just built, in a short pipeline.

```r-static
# The production tool (run this locally): install.packages("tidysynth")
library(tidysynth)

soda_out <- soda_panel |>                              # long: one row per city-month
  synthetic_control(outcome = cans, unit = city, time = month,
                    i_unit = "Marisol", i_time = 25,
                    generate_placebos = TRUE) |>
  generate_predictor(time_window = 1:24, mean_cans = mean(cans)) |>
  generate_weights() |>
  generate_control()

soda_out |> plot_trends()        # treated vs synthetic over time
soda_out |> plot_placebos()      # the placebo gaps you built by hand
soda_out |> grab_signif()        # the RMSPE-ratio p-value
```

Same three ideas you built from scratch, one tested pipeline. Building it by hand once is how you know what that pipeline is doing, and when to distrust it.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take synthetic control further:

- [Abadie and Gardeazabal (2003), The Economic Costs of Conflict: A Case Study of the Basque Country (AER)](https://doi.org/10.1257/000282803321455188) - the paper that introduced the synthetic control method.
- [Abadie, Diamond and Hainmueller (2010), Synthetic Control Methods for Comparative Case Studies (JASA)](https://doi.org/10.1198/jasa.2009.ap08746) - the canonical worked example (California's Proposition 99 tobacco tax) and the placebo inference you used here.
- [Abadie (2021), Using Synthetic Controls: Feasibility, Data Requirements, and Methodological Aspects (Journal of Economic Literature)](https://doi.org/10.1257/jel.20191450) - the modern, practical guide to when the method works and how to defend it.
- [tidysynth (CRAN)](https://cran.r-project.org/package=tidysynth) - the production R package: weights, plots, and placebo p-values in one pipeline.
- [Cunningham, Causal Inference: The Mixtape, Synthetic Control chapter](https://mixtape.scunning.com/10-synthetic_control) - a free, from-scratch walk-through with runnable R.

=== step === complete
## Lesson 7 complete

You measured a policy's effect with a single treated unit and no control group anywhere. When before-after (-4.23), the closest single city (-7.04), and a plain average (+0.23) all missed the true -5, you built a **synthetic Marisol**: a weighted blend of donor cities, with weights fit on the pre-tax months alone, that tracked the real city almost perfectly until the tax landed. The post-tax gap read **-5.09**, and because there was no standard error to lean on, you tested it with a **placebo in space**, ranking Marisol's RMSPE ratio first of eleven cities. The lesson underneath: when you cannot find a fair comparison, you can construct one, as long as it earns its keep by matching the past.

Next, Lesson 8: Uplift and Heterogeneous Effects. Every method so far has chased one average effect. But a policy that helps the average person can still hurt many individuals. You will build a model that predicts the effect for each unit separately, so you can target the people a treatment actually helps.
