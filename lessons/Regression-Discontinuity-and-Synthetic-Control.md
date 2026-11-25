---
title: "Causal Inference from Data Lesson 7: Regression discontinuity and synthetic control"
catalog_blurb: "How a cutoff's jump and a weighted donor blend both estimate effects without randomizing."
description: "A $10 credit at $50 of spend and a store that switches to self-checkout: two designs that estimate a causal effect without ever randomizing treatment."
keywords: "regression discontinuity, synthetic control, running variable, bandwidth, local linear regression, McCrary test, manipulation check, donor weights, counterfactual, causal inference, R"
post_type: "LESSON"
curriculum_id: "4.130.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-causal"
course_title: "Causal Inference from Data"
course_lesson: "7"
course_total: "8"
course_landing: "Causal-Inference-from-Data-Course.html"
course_next: "Mediation-and-How-Wrong-You-Can-Afford-to-Be"
course_prev: "Instrumental-Variables-When-You-Cannot-Randomize"
---

=== step === cover
## Regression discontinuity and synthetic control

Today let's understand two designs that estimate a causal effect without randomizing anyone into a treatment group.

Rosewood Market, a small grocery chain, gives a $10 welcome credit to any shopper whose first-visit spend is $50 or more. Rosewood never flipped a coin to decide who got the credit. It handed it out by a rule. And yet Rosewood can still work out what that credit is worth, because the rule itself builds the comparison: a shopper who spent $49 and a shopper who spent $51 are alike in almost every way, except that one of them got the credit and the other did not.

Across town, Rosewood's Elm Street store switched its checkout lanes to self-checkout. There is only one Elm Street, so there is no twin store sitting untouched for comparison. But Rosewood runs four other stores, each on its own trend of weekly sales, and a careful blend of those four tracks Elm Street's sales closely enough, before the switch, to stand in for what Elm Street would have sold without it.

Both situations share the same shape. Something other than a coin flip decided who was treated, and the data itself, a cutoff rule in one case and a panel of untreated stores in the other, supplies the comparison a randomized experiment would otherwise have given you.

Here is what each design builds and what it ultimately hands you.

::widget styled-table {"cols":["Design","What creates the comparison","What you read off"],"rows":[["Regression discontinuity","A cutoff on a running variable","The jump at the cutoff"],["Synthetic control","A weighted blend of untreated units","The post-policy gap"]],"title":"Two designs, two different comparisons","note":"Both recover a causal effect without randomizing who gets treated."}

The left column is what each design needs before you can use it at all. The right column is the one number the whole lesson is building toward, twice over.

=== step === concept
## A cutoff that assigns the credit: the running variable

Let's start with Rosewood's credit, since it is the simpler of the two designs.

The variable that decides who crosses into treatment is called the **running variable**. Here it is first-visit spend. The point where treatment switches on is the **cutoff**, which for Rosewood is $50. Spend $50 or more on your first visit and you get the $10 credit automatically; spend less and you do not. Nobody applies for it and nobody is refused it. The rule alone decides, which makes this a **sharp** design: there are no exceptions on either side of the cutoff.

That rule is also what makes the comparison fair right at the boundary. A shopper who spent $49 and a shopper who spent $51 shop at the same stores, in the same week, with first-visit habits that are nearly identical. The only real difference between them is the credit. Compare a $10 shopper against a $90 shopper instead, and the gap is no longer just the credit. Those two differ in income, in how often they shop, in what they buy, in nearly everything that first-visit spend tends to track.

So let's build the data and see that comparison for real. Rosewood tracks 400 shoppers, each with their first-visit spend and whether they crossed the $50 line, and then their spend on a second visit. The second-visit spend is built from three pieces: a base amount, a small rise that tracks how much a shopper spent the first time, and a flat $6 bump for shoppers who got the credit, plus ordinary noise. That $6 is the real effect the jump at the cutoff needs to recover, underneath whatever the naive comparison says.

```r
# Simulate 400 shoppers and compare second-visit spend with and without the $10 credit
set.seed(11)
n <- 400
first_visit_spend <- round(runif(n, 0, 100), 2)
grant <- as.integer(first_visit_spend >= 50)
second_visit_spend <- round(10 + 0.15 * first_visit_spend + 6 * grant + rnorm(n, 0, 6), 2)
shops <- data.frame(first_visit_spend, grant, second_visit_spend)

naive_diff <- mean(shops$second_visit_spend[shops$grant == 1]) -
              mean(shops$second_visit_spend[shops$grant == 0])
round(naive_diff, 2)
#> [1] 12.4
```

The naive comparison, just the average second-visit spend of credited shoppers minus everyone else, comes out to 12.4. That is more than double the true $6 effect built into the data. The reason is the 0.15 slope: credited shoppers spent $50 or more on their first visit by definition, so on average they already spent a lot more than non-credited shoppers did. That extra first-visit spend carries forward into a higher second-visit spend on its own, with nothing to do with the credit. The naive gap bundles that trend together with the real $6 effect, and the trend is doing most of the work.

=== step === concept
## The jump at the cutoff is the effect

The fix is to stop comparing everyone and compare only the shoppers close to $50 on each side.

Fit one straight line through the shoppers just below the cutoff, and a second straight line through the shoppers just above it. Each line is a local description of how second-visit spend relates to first-visit spend on its own side. Then read both lines at exactly $50, the cutoff itself, using `predict()`. The gap between what the right-hand line predicts there and what the left-hand line predicts there is the jump, and that jump is the regression discontinuity estimate of the credit's effect.

"Close to $50" has to mean something specific, so pick a window: $15 on each side. That window is called the **bandwidth**. Shoppers between $35 and $50 fit the left line; shoppers between $50 and $65 fit the right line.

```r
# Fit a line on each side of the $50 cutoff and read the jump at the cutoff
h <- 15
left  <- lm(second_visit_spend ~ first_visit_spend, data = shops,
            subset = first_visit_spend <  50 & first_visit_spend >= 50 - h)
right <- lm(second_visit_spend ~ first_visit_spend, data = shops,
            subset = first_visit_spend >= 50 & first_visit_spend <= 50 + h)

pred_left  <- predict(left,  newdata = data.frame(first_visit_spend = 50))
pred_right <- predict(right, newdata = data.frame(first_visit_spend = 50))
jump <- pred_right - pred_left

round(c(true = 6, rdd = unname(jump), naive = naive_diff), 2)
#>  true   rdd naive 
#>  6.00  6.66 12.40 
```

With a $15 bandwidth, 63 shoppers fall into the left fit and 62 into the right fit. The jump between the two lines, read at the cutoff, comes out to 6.66, close to the true $6. Set that against the naive 12.40, and almost all of the bias is gone.

[KEY INSIGHT] The naive comparison bundles the $6 credit effect together with the trend that already existed in spend. Fitting a line on each side and reading the gap right at the cutoff cancels that trend out, because both lines are describing the same local slope in spend, just on opposite sides of $50.

=== step === widget
## How the bandwidth choice changes the answer

Rosewood's $15 bandwidth was a choice, not a law, and a different choice would have given a different jump.

The widget below runs the same idea on its own simulated data: 500 shoppers crossing a cutoff at 0 instead of $50, with a true jump of 4 instead of $6. Toggle between a narrow, medium and wide bandwidth and watch the two fitted lines, and the printed jump, move.

::widget rdd-cutoff {}

A narrow bandwidth keeps only the shoppers nearest the cutoff, the ones most alike on everything except treatment, so the estimate is less biased. But fewer shoppers also means the fitted line wobbles more from one sample to the next, so the estimate is noisier. A wide bandwidth does the opposite: more shoppers steady the line, but if spend and second-visit spend do not relate in a perfectly straight way further from the cutoff, the extra points pull the estimate away from the truth.

That is the bandwidth's trade-off, bias against variance, and it is the central practical judgment call in a regression discontinuity design. Rosewood's own $15 choice sits in the middle of that trade-off: wide enough to give each local line sixty-odd shoppers to fit, narrow enough that none of those shoppers are far enough from $50 for the relationship to have started curving.

=== step === concept
## Can shoppers manipulate their way across the cutoff?

The jump at the cutoff is only a fair comparison if shoppers end up just below or just above $50 for reasons that have nothing to do with the credit itself.

Imagine a shopper notices the $50 threshold and adds a dollar of filler to their basket on purpose, just to cross it. That shopper is no longer like an honest $51 spender. They wanted the credit badly enough to act on it, which is exactly the kind of difference the cutoff design is supposed to rule out. If enough shoppers do this, the comparison right at the cutoff stops being fair, because the shoppers who land just above $50 are no longer a random slice of "roughly $50 spenders," they are a slice that specifically wanted in.

The check for this looks at how many shoppers land in narrow bins on each side of the cutoff. If nobody is manipulating their spend, the counts just below and just above $50 should be close to even, since there is no reason for real shopping behavior to pile up on one side of an arbitrary dollar amount.

```r
# Count shoppers in $5-wide bins around the $50 cutoff
bins <- c(35, 40, 45, 50, 55, 60, 65)
table(cut(shops$first_visit_spend, bins, right = FALSE))
#> 
#> [35,40) [40,45) [45,50) [50,55) [55,60) [60,65) 
#>      19      20      24      22      18      22 
```

Rosewood's real data splits 24 against 22 in the two bins nearest the cutoff, close to even. Now look at what happens when some shoppers near $48 to $50 deliberately add a bit of filler to cross the line.

```r
# Simulate shoppers near $48-50 adding a bit of filler to cross the cutoff on purpose
set.seed(11)
manipulated_spend <- shops$first_visit_spend
near_cutoff <- which(manipulated_spend >= 48 & manipulated_spend < 50)
crossing    <- near_cutoff[runif(length(near_cutoff)) < 0.85]
manipulated_spend[crossing] <- manipulated_spend[crossing] + runif(length(crossing), 1.2, 3.5)

table(cut(manipulated_spend, bins, right = FALSE))
#> 
#> [35,40) [40,45) [45,50) [50,55) [55,60) [60,65) 
#>      19      20      15      31      18      22 
```

Ten of the thirteen shoppers who started out just under $50 crossed over on purpose, and the bin just below the cutoff drops from 24 to 15 while the bin just above jumps from 22 to 31. That spike is the signature of manipulation: a dip right below the cutoff and a pile-up right above it. Rosewood's own bin counts look nothing like that, which is what licenses treating the 6.66 jump as the credit's real effect rather than something shoppers engineered. A formal version of this bin-count comparison is called the McCrary test, after the paper that proposed it.

=== step === concept
## One store, no clean twin: the synthetic control setup

So that covers how to estimate and check a cutoff design. Now for a setting with no cutoff at all.

Rosewood's Elm Street store switched its checkout lanes to self-checkout in week 21 of a 30-week sales panel. There is exactly one Elm Street, so there is nobody to compare it against directly the way the credit example compared a $49 shopper to a $51 shopper. Rosewood runs four other stores that never switched, but each one sits on its own trend: one is busier and growing faster, another is smaller and flatter, and none of them tracks Elm Street's own sales closely enough on its own to serve as a stand-in.

The idea behind **synthetic control** is to stop looking for one good twin and instead build one, by blending the four donor stores together.

```r
# Simulate 30 weeks of sales for Elm Street and 4 donor stores
set.seed(21)
weeks <- 1:30
donor_A <- round(220 + 1.0 * weeks + rnorm(30, 0, 5), 1)
donor_B <- round(160 + 0.4 * weeks + rnorm(30, 0, 5), 1)
donor_C <- round(300 + 1.6 * weeks + rnorm(30, 0, 5), 1)
donor_D <- round(120 + 0.3 * weeks + rnorm(30, 0, 5), 1)

donors     <- cbind(donor_A, donor_B, donor_C, donor_D)
elm_base   <- as.numeric(donors %*% c(0.5, 0.3, 0.2, 0))
elm_street <- round(elm_base + rnorm(30, 0, 4), 1)
elm_street[21:30] <- round(elm_street[21:30] + 15, 1)

store_panel <- data.frame(week = weeks, elm_street, donor_A, donor_B, donor_C, donor_D)
head(store_panel, 5)
#>   week elm_street donor_A donor_B donor_C donor_D
#> 1    1      216.4   225.0   151.2   299.3   119.0
#> 2    2      219.2   224.6   158.8   307.8   123.6
#> 3    3      223.4   231.7   161.3   294.3   122.5
#> 4    4      219.7   217.6   166.2   298.0   121.5
#> 5    5      232.3   236.0   170.2   316.8   127.1
```

Elm Street's sales sit somewhere between the four donors, closer to some than others, with 15 extra units a week built in from week 21 onward as the true effect of the switch. No single donor store's own column is a close match for Elm Street's. Blending the four donor stores into one series that does track it, before the switch ever happens, takes the right weight on each one.

=== step === concept
## Building the donor blend: weights that sum to one

A blend only makes sense if the weights on the four donors are sensible: none of them negative, since a store cannot contribute "negative sales," and they should add up to one, so the blend stays on the same scale as a single store's sales rather than drifting off to some arbitrary size.

A neat trick enforces both of those at once. Instead of searching over weights directly, search over four unconstrained numbers, theta, and turn them into weights with `exp(theta) / sum(exp(theta))`. Exponentiating makes every value positive no matter what theta is, and dividing by the total forces the four weights to sum to exactly one. This is called a **softmax**, and it means `optim()` can search freely over theta without ever needing to know about the nonnegative-and-sums-to-one constraint at all.

The loss `optim()` minimizes is the summed squared gap between Elm Street and the weighted donor blend, using only the 20 pre-switch weeks. Pre-switch is the only period where a good blend is even checkable, since Elm Street had not changed yet.

```r
# Find donor weights that make the blend track Elm Street before week 21
pre <- 1:20
loss <- function(theta) {
  w    <- exp(theta) / sum(exp(theta))                 # softmax: weights are nonnegative and sum to 1
  pred <- as.numeric(as.matrix(store_panel[pre, c("donor_A", "donor_B", "donor_C", "donor_D")]) %*% w)
  sum((store_panel$elm_street[pre] - pred)^2)           # summed squared pre-period gap
}

set.seed(21)
fit   <- optim(rep(0, 4), loss)
w_hat <- exp(fit$par) / sum(exp(fit$par))
round(w_hat, 2)
#> [1] 0.70 0.19 0.12 0.00
```

The recovered weights lean heavily on `donor_A`, take a smaller share from `donor_B` and `donor_C`, and land on exactly zero for `donor_D`. That last donor's own trend, flat and slow, is the one that looks least like Elm Street's, so `optim()` gives it nothing. Now build the full blended series from those weights, for all 30 weeks, and compare it with Elm Street both before and after the switch.

```r
# Build the synthetic twin from the weights, then compare it with Elm Street
synthetic <- as.numeric(as.matrix(store_panel[, c("donor_A", "donor_B", "donor_C", "donor_D")]) %*% w_hat)
pre_gap   <- mean(store_panel$elm_street[1:20]  - synthetic[1:20])
effect    <- mean(store_panel$elm_street[21:30] - synthetic[21:30])
round(c(true = 15, effect = effect, pre_gap = pre_gap), 2)
#>    true  effect pre_gap 
#>   15.00   14.38    0.06 
```

Before the switch, the gap between Elm Street and its synthetic blend averages 0.06 units a week, essentially nothing. After the switch, that same gap jumps to 14.38 units a week, close to the true 15 built into the data. The pre-period number is what makes the post-period number worth believing.

=== step === widget
## Reading the post-policy gap as the effect

That near-zero pre-period gap and the jump after the switch are the whole payoff of the design, so it is worth seeing the general pattern once more, outside Rosewood's own numbers.

The widget below builds its own synthetic control from 5 donor units over 20 pre-policy and 10 post-policy periods, with a true effect of 3 baked in, the same kind of setup as Elm Street's 30-week panel with its true effect of 15 units a week. Toggle between the trajectories view and the gap view.

::widget synth-control {}

In the trajectories view, the treated line and its synthetic twin sit almost on top of each other before the policy point, then separate right after it. In the gap view, that separation becomes a single line: hovering near zero before the policy, then stepping up to about 3 after it. The same shape showed up in Elm Street's own numbers: a 0.06 gap before the switch, 14.38 after. A synthetic control whose pre-period gap is far from zero is not a trustworthy twin, and whatever gap it shows afterward is not a credible effect.

=== step === concept
## Which design fits your data?

Both designs recover a causal effect without randomizing anyone, but they need different raw materials.

Regression discontinuity needs a running variable and a cutoff rule that assigns treatment by crossing it, the way first-visit spend and $50 assigned Rosewood's credit. Synthetic control needs one treated unit and several untreated units observed over the same stretch of time, the way Elm Street and its four donor stores were observed over the same 30 weeks. A setting with neither, no threshold rule and no credible pool of untreated units to blend, fits neither design.

::prose-only the choice follows from what data exists, not from which design is more familiar

[TIP] Ask two questions. Is there a single rule and threshold deciding who gets treated? That is regression discontinuity. Is there one treated unit and several untreated ones, observed over the same periods, with no such rule? That is synthetic control.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Regression discontinuity, using the discount's start date as the cutoff on a running variable. ::no
- Synthetic control: one treated store set against several untreated stores over the same weeks, since there is no running variable or threshold deciding who gets the discount. ::ok Exactly. There is no spend level or any other running variable that switches the discount on, so no cutoff exists to build a discontinuity design around. One treated store and several untreated ones, observed over the same weeks, is precisely the setup synthetic control needs.
- Either design, since both compare a treated outcome against an untreated one. ::no
- Neither; a randomized trial is required before any causal effect can be estimated here. ::no Both designs exist precisely because you cannot always randomize. The deciding question is never "is a design available," it is which raw materials the data actually supply: a running variable and a threshold, or one treated unit against several untreated ones over the same periods. This setting supplies the second.

=== step === quiz
## Quick check: regression discontinuity and synthetic control

A synthetic control is only as good as the twin it builds. The question below checks what actually licenses trusting the gap it reports after a policy change.

::prose-only quiz only; the picture that carries it is the pre-period and post-period gap already read in the earlier step

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A large number of donor stores going into the blend. ::no
- A near-zero gap between the treated store and its synthetic twin in the period before the policy. ::ok Right. The pre-period gap is the only check available on whether the synthetic twin is a believable stand-in. If it tracks the treated unit closely before the policy, the gap that opens up afterward is credible; if it does not, nothing that follows can be trusted.
- A long post-policy period over which to observe the gap. ::no
- High sales at the treated store before the policy. ::no None of these touch the one thing that actually justifies the post-policy gap. A long post-period, many donors or high sales say nothing about whether the synthetic twin resembled the treated unit before anything changed. Only a near-zero pre-period gap does, which is why it is checked first, every time.

=== step === tryit
## Your turn: estimate the jump at your own bandwidth

Back to Rosewood's credit. The code below rescales first-visit spend so the cutoff sits at 0, the same units the bandwidth widget used earlier: a bandwidth of 1.0 reaches all the way to $50 on each side of the cutoff, and 0.3 reaches $15, the same window used earlier to fit the two local lines.

```r
# Rescale spend so the cutoff sits at 0, then fit the two local lines and read the jump
shops$z <- (shops$first_visit_spend - 50) / 50

h <- 0.05                                         # try a bandwidth between 0.2 and 1.0
left  <- lm(second_visit_spend ~ z, data = shops, subset = z <  0 & z >= -h)
right <- lm(second_visit_spend ~ z, data = shops, subset = z >= 0 & z <=  h)
jump  <- predict(right, data.frame(z = 0)) - predict(left, data.frame(z = 0))
round(unname(jump), 2)
```

Press Run first and see what a bandwidth this narrow gives you. Then edit `h` to a value between 0.2 and 1.0, and press Run again.

::check {"regex": "h\\s*<-\\s*(1(\\.0+)?(?![.\\d])|0\\.[2-9][0-9]*)", "gate": true, "difficulty": "intermediate", "ok": "Right. Across that whole range the jump stays close to $6, moving between about $6.10 and $7.90 depending on exactly where you set h, the same pattern the bandwidth widget showed between its narrow and wide settings.", "no": "Set h to a value between 0.2 and 1.0. Much narrower than that leaves too few shoppers on each side to fit a reliable line, the way 0.05 just did; much wider starts pulling in shoppers whose first-visit spend has little to do with being near the cutoff."}
::solution
```r
# Fit the two local lines at h = 0.6 and read the jump
h <- 0.6
left  <- lm(second_visit_spend ~ z, data = shops, subset = z <  0 & z >= -h)
right <- lm(second_visit_spend ~ z, data = shops, subset = z >= 0 & z <=  h)
jump  <- predict(right, data.frame(z = 0)) - predict(left, data.frame(z = 0))
round(unname(jump), 2)
#> [1] 6.76
```

A bandwidth of 0.6, $30 on each side of the cutoff, gives a jump of 6.76, still close to the true $6. That is the same point the widget made: inside a reasonable range, the bandwidth changes the estimate a little, not the conclusion.

=== step === complete
## References
::prose-only the sources are text, not a visual

- [Regression Discontinuity Designs: A Guide to Practice](https://econpapers.repec.org/RePEc:eee:econom:v:142:y:2008:i:2:p:615-635) - Imbens, G. & Lemieux, T. (2008), Journal of Econometrics, 142(2), 615-635. The practitioner's guide behind the local-linear fit and the bandwidth choice used in this lesson.
- [Regression Discontinuity Designs in Economics](https://doi.org/10.1257/jel.48.2.281) - Lee, D. S. & Lemieux, T. (2010), Journal of Economic Literature, 48(2), 281-355. A longer survey of the same design across empirical economics.
- [Manipulation of the Running Variable in the Regression Discontinuity Design: A Density Test](https://econpapers.repec.org/RePEc:eee:econom:v:142:y:2008:i:2:p:698-714) - McCrary, J. (2008), Journal of Econometrics, 142(2), 698-714. The formal version of the bin-count check used to look for manipulation near the cutoff.
- [Synthetic Control Methods for Comparative Case Studies](https://doi.org/10.1198/jasa.2009.ap08746) - Abadie, A., Diamond, A. & Hainmueller, J. (2010), Journal of the American Statistical Association, 105(490), 493-505. The paper that introduced building a synthetic control from donor weights.
- [Using Synthetic Controls: Feasibility, Data Requirements, and Methodological Aspects](https://doi.org/10.1257/jel.20191450) - Abadie, A. (2021), Journal of Economic Literature, 59(2), 391-425. Practical guidance on when a synthetic control fit is credible enough to trust.
