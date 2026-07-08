---
title: "Interpretability Lesson 4: Partial Dependence, ICE, and ALE"
catalog_blurb: "See the shape of a feature's effect on predictions, averaged and row by row."
description: "Partial dependence, ICE and ALE in R: draw the shape of a feature's effect on a model, on average and row by row, and fix the bias correlated features cause."
keywords: "partial dependence plot, PDP, individual conditional expectation, ICE, accumulated local effects, ALE, feature effects, model interpretability, explainable AI, XAI, R"
post_type: "LESSON"
curriculum_id: "6.110.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-interpretability"
course_title: "Model Interpretability in R"
course_lesson: "4"
course_total: "6"
course_landing: "R-Interpretability-Course.html"
course_next: "Fairness-Basics.html"
course_prev: "SHAP-Values.html"
---

=== step === cover
::eyebrow Lesson 4 of 6
## Partial Dependence, ICE, and ALE

In Lesson 3, **SHAP** gave you one number per feature per row: for *this* customer, how much did monthly charge push the prediction? That is a single point on a story. This lesson draws the **whole story**: as one feature sweeps from its lowest value to its highest, what *shape* does the prediction trace out?

We will draw that shape three ways, each fixing a blind spot in the one before. **Partial dependence (PDP)** draws the average shape. **ICE** draws it for every customer at once, revealing when the average is a lie. **ALE** repairs the average when features move together.

By the end you will be able to:

- Compute a **partial-dependence** curve: sweep one feature over a grid, force it for every row, and average the predictions
- Draw **ICE** curves (one line per customer) and read the **fan** they make as a sign the feature interacts with another
- Diagnose the PDP's **extrapolation flaw**: forcing a value asks the model about customer combinations that never existed
- Compute **ALE**, which accumulates small local effects on the data's real distribution, and say when to trust it over a PDP

**Prerequisites:** you can fit and use a model in R such as a [random forest](Random-Forest-Course.html) and know that `predict()` returns a per-row score, and you have done [Lesson 3: SHAP Values](SHAP-Values.html) (baseline, per-feature contribution, "explains the model, not the world").

::widget pdp-curve {}

=== step === concept
::eyebrow The setup
## One question: what shape is a feature's effect?

Here is the churn model from Lessons 2 and 3, rebuilt so this page runs on its own. Each row is a customer; `churned` is "yes" if they left. Two features carry the two surprises in this lesson: **contract** (month-to-month or annual) and **total_spend** (lifetime dollars, which naturally tracks the monthly charge). Build it and fit the forest once.

```r
library(randomForest)
set.seed(42)
n <- 400
contract      <- factor(sample(c("monthly", "annual"), n, TRUE, prob = c(0.6, 0.4)))
tenure        <- round(runif(n, 1, 60))         # months as a customer
monthly       <- round(runif(n, 20, 120), 1)    # monthly charge (dollars)
support_calls <- rpois(n, 1.2)
total_spend   <- round(monthly * 22 + rnorm(n, 0, 200))   # tracks the monthly charge

# churn risk: a high charge hurts, but FAR more on month-to-month contracts (an interaction);
# long tenure and high total spend are protective
mm <- as.integer(contract == "monthly")
lp <- -3.0 + 0.055 * monthly * mm + 0.004 * monthly * (1 - mm) -
       0.04 * tenure + 0.30 * support_calls - 0.0004 * total_spend
churn <- data.frame(tenure, monthly, support_calls, contract, total_spend,
                    churned = factor(ifelse(rbinom(n, 1, plogis(lp)) == 1, "yes", "no")))

set.seed(1)
rf <- randomForest(churned ~ ., data = churn, ntree = 150)
cat("churned  no:", sum(churn$churned == "no"), " yes:", sum(churn$churned == "yes"), "\n")
cat("mean predicted P(churn):", round(mean(predict(rf, churn, type = "prob")[, "yes"]), 3), "\n")
#> churned  no: 304  yes: 96
#> mean predicted P(churn): 0.238
```

The forest is a black box: hundreds of trees vote, and there is no slope to read. The product lead asks a plain question anyway: *as the monthly charge rises from $20 to $120, how does predicted churn move?* We want a curve, not a single number. The next three tools are three honest ways to draw it.

=== step === concept
::eyebrow The first tool
## Partial dependence: force it, then average

Here is the recipe in one breath. Pick a grid of monthly charges. For each value on the grid, **pin the monthly charge to that value for every customer** while leaving all their other features exactly as they are, ask the forest to predict, and **average** those predictions. Plot the grid against those averages, and you have the partial-dependence curve: the average shape of the charge's effect.

Written down, let \(\hat{f}\) be the fitted model, \(x_S\) the feature we sweep (monthly charge), and \(x_C^{(i)}\) customer \(i\)'s values for every *other* feature. The partial-dependence function at a value \(v\) is

\[ \text{PD}_S(v) \;=\; \frac{1}{n}\sum_{i=1}^{n} \hat{f}\big(v,\; x_C^{(i)}\big), \]

where \(n\) is the number of customers. In words: hold the feature at \(v\) for all \(n\) rows, predict, average. Do it for every \(v\) on the grid.

```r
grid <- seq(20, 120, by = 10)             # the charges we sweep across
pdp <- sapply(grid, function(v) {
  tmp <- churn                            # a copy of every customer
  tmp$monthly <- v                        # pin monthly at v for ALL of them
  mean(predict(rf, tmp, type = "prob")[, "yes"])   # predict, then average
})
round(setNames(pdp, grid), 3)
#>    20    30    40    50    60    70    80    90   100   110   120
#> 0.236 0.193 0.201 0.198 0.207 0.245 0.277 0.376 0.391 0.429 0.455
plot(grid, pdp, type = "o", pch = 16, xlab = "monthly charge ($)",
     ylab = "avg predicted churn", main = "Partial dependence of monthly charge")
```

Read the curve: below about $70 the charge barely moves average churn (the little wiggles there are the forest's noise, not signal), then risk climbs steeply, from roughly 0.25 to 0.46 as the charge goes from $70 to $120. That single line is the model's *average* answer to the product lead's question.

=== step === quiz
::eyebrow Check yourself
## What is one PDP point?

The partial-dependence value at a monthly charge of $100 came out to **0.391**. What exactly is that number?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model's predicted churn probability for a single customer who pays $100 a month ::no That is one customer's prediction. A PDP forces monthly to $100 for EVERY customer (each keeping their own other features), predicts all of them, and averages, so 0.391 is a whole-dataset average, not one person.
- The average predicted churn if every customer in the data were switched to a $100 charge, their other features unchanged ::ok Exactly. You pin monthly at $100 for all n rows, keep each customer's real other features, predict, and average. It is an average over the whole dataset, which is what makes it a smooth "average effect" curve.
- The causal amount churn would rise if you raised a real customer's charge to $100 ::no A PDP describes what the MODEL outputs when fed that value, not what happens in the world if you change a price. Like SHAP in Lesson 3, it explains the model, not reality.

=== step === widget
::eyebrow The second tool
## ICE: draw every customer, do not average

The PDP throws away a lot of information the moment it averages. An **Individual Conditional Expectation** (ICE) curve keeps it: run the exact same sweep, but instead of averaging, **keep one line per customer**. Row \(i\)'s ICE curve is

\[ \text{ICE}^{(i)}(v) \;=\; \hat{f}\big(v,\; x_C^{(i)}\big), \]

the model's prediction for customer \(i\) as we slide their monthly charge across the grid, holding the rest of *their* features fixed. The PDP is simply the average of all these lines: \(\text{PD}_S(v) = \frac{1}{n}\sum_{i=1}^{n}\text{ICE}^{(i)}(v)\). The widget shows the faint ICE lines and the bold PDP average riding through them.

::widget pdp-curve {}

Now watch what the average was hiding in our churn data. Split the ICE lines by contract type and average within each group:

```r
ice <- sapply(grid, function(v) {
  tmp <- churn; tmp$monthly <- v
  predict(rf, tmp, type = "prob")[, "yes"]     # KEEP every row, do not average
})
# ice has one row per customer and one column per grid value: row i is customer i's ICE curve.
mtm <- churn$contract == "monthly"
round(setNames(colMeans(ice[mtm, ]),  grid), 3)   # month-to-month customers
round(setNames(colMeans(ice[!mtm, ]), grid), 3)   # annual customers
#>    20    30    40    50    60    70    80    90   100   110   120
#> 0.359 0.292 0.305 0.301 0.317 0.375 0.419 0.547 0.574 0.640 0.666
#>    20    30    40    50    60    70    80    90   100   110   120
#> 0.041 0.036 0.037 0.036 0.033 0.040 0.052 0.106 0.103 0.096 0.121
```

The two groups could not be more different. For **month-to-month** customers, a rising charge sends churn from 0.36 up to 0.67, a steep climb. For **annual** customers, the same charge barely nudges churn (0.04 to 0.12), because they are locked into a contract and cannot easily leave. The ICE lines **fan apart**. The PDP's gentle average curve describes neither group; it is a blend of a steep line and a flat one.

[KEY INSIGHT]
When ICE curves run parallel, every customer shares one common effect and the PDP tells the whole story. When they fan out or cross, the feature's effect **depends on another feature** (an interaction), and the single PDP average misrepresents everyone. Always look at the ICE spread before you trust a PDP.

=== step === tryit
::eyebrow Your turn
## Compute a PDP point by hand

Recreate the partial-dependence value at a monthly charge of **$100**. We have pinned the column for you; fill in the one line that averages the forest's predicted churn probability across all customers.

```r
tmp <- churn
tmp$monthly <- 100                # pin monthly at $100 for every customer
pdp_100 <- ____                   # average predicted churn probability across all rows
round(pdp_100, 3)
```
::check {"regex":"mean\\(\\s*predict\\(\\s*rf\\s*,\\s*tmp","gate":true,"difficulty":"intermediate","ok":"That is the PDP recipe in one line: predict for every pinned row, then average. It lands on 0.391, exactly the grid value from before.","no":"Average the per-row churn probabilities: mean(predict(rf, tmp, type = \"prob\")[, \"yes\"])."}
::solution
```r
tmp <- churn
tmp$monthly <- 100
pdp_100 <- mean(predict(rf, tmp, type = "prob")[, "yes"])
round(pdp_100, 3)
#> [1] 0.391
```

=== step === quiz
::eyebrow Check yourself
## Reading the fan

Your ICE plot for monthly charge shows a bundle of steep rising lines and a bundle of nearly flat lines, and they fan apart as the charge increases. The PDP (their average) rises only gently. A teammate says the fan is just model noise, so you should trust the smooth PDP instead. What is actually going on?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The teammate is right: fanned ICE lines are random noise, and the averaged PDP smooths it away ::no Noise would jitter each line up and down; it would not split the customers into two coherent bundles. Two clean bundles is real structure, not noise, and the average is hiding it.
- The fan means monthly charge interacts with another feature: it strongly raises risk for one group and barely moves it for another, so the single PDP average fits neither ::ok Exactly. Parallel lines would mean one shared effect; a fan means the effect depends on another feature (here, contract type). The PDP blends the steep and flat groups into a middling curve that describes neither.
- The fan means monthly charge has no real effect, since the lines head in different directions ::no The lines do not head in opposite directions; both bundles rise or stay flat, none fall. The charge clearly matters for the steep group. The point is that the effect is not the SAME for every customer.

=== step === widget
::eyebrow The catch
## The PDP asks the model impossible questions

Both PDP and ICE share a hidden flaw, and it bites hardest exactly when features move together. In our data, `monthly` charge and `total_spend` are almost the same information: pricier plans rack up more lifetime spend. Look at how tightly they track.

::widget chart-plotter {"data":[{"x":24,"y":300},{"x":29,"y":725},{"x":35,"y":999},{"x":41,"y":784},{"x":47,"y":728},{"x":54,"y":1173},{"x":61,"y":1452},{"x":68,"y":1749},{"x":74,"y":1348},{"x":81,"y":1485},{"x":88,"y":2098},{"x":95,"y":2199},{"x":103,"y":2619},{"x":110,"y":2646},{"x":117,"y":2551}],"geoms":["point"],"x":"monthly","y":"total_spend"}

```r
round(cor(churn$monthly, churn$total_spend), 2)
#> [1] 0.96
# how many REAL customers pay over $100 a month but have spent under $800 total?
sum(churn$monthly > 100 & churn$total_spend < 800)
#> [1] 0
```

Now remember what the PDP did at $120: it pinned `monthly` to $120 for **every** customer, including someone whose `total_spend` is $500, a genuine low-charge customer. But not one of the 400 real customers pays over $100 a month with under $800 of total spend, that corner of the data is empty. The PDP marched the model straight into it and asked, "what is the churn risk of a customer who pays $120 a month yet has spent almost nothing?" The forest has never seen such a person, so its answer there is a guess. Averaging over impossible combinations can bend the whole curve.

[WARNING]
A PDP forces a feature to each grid value for every row, ignoring how features move together. When two features are correlated, that manufactures customer profiles that do not exist, and the model must **extrapolate** into empty space. The stronger the correlation, the less you can trust a PDP.

=== step === concept
::eyebrow The third tool
## ALE: accumulate small, local, honest steps

Accumulated Local Effects (ALE) fixes the flaw by never leaving the real data. Instead of forcing one value on everyone, ALE chops the feature's range into intervals (using the data's own quantiles), and inside each interval it moves **only the customers who actually live there**, and only a little, from the interval's lower edge to its upper edge. It measures how much each of *their* predictions changes, averages that **local** change, then **accumulates** the changes across intervals to build the curve.

With interval edges \(z_0 < z_1 < \dots < z_K\), let \(n_k\) be the number of customers whose charge falls in interval \(k\). ALE at a value \(v\) is

\[ \text{ALE}(v) \;=\; \sum_{k=1}^{k(v)} \frac{1}{n_k} \sum_{i:\, x^{(i)} \in (z_{k-1},\, z_k]} \Big[\hat{f}\big(z_k, x_C^{(i)}\big) - \hat{f}\big(z_{k-1}, x_C^{(i)}\big)\Big] \; - \; c, \]

where \(k(v)\) is the interval containing \(v\), the inner bracket is one customer's **local effect** (their prediction at the interval's top edge minus at its bottom edge), and \(c\) is a constant that shifts the finished curve to average zero so it is easy to read. Because every move stays inside a small interval on customers who are really there, ALE never asks about a $120 plan with $500 of spend.

```r
edges <- unique(quantile(churn$monthly, probs = seq(0, 1, length.out = 11)))  # 10 intervals
bin   <- cut(churn$monthly, breaks = edges, include.lowest = TRUE, labels = FALSE)

local_effect <- numeric(length(edges) - 1)
for (k in seq_along(local_effect)) {
  here <- churn[bin == k, ]                 # only customers whose charge is in interval k
  lo <- here; lo$monthly <- edges[k]        # nudge them to the interval's lower edge
  hi <- here; hi$monthly <- edges[k + 1]    # and to its upper edge
  local_effect[k] <- mean(predict(rf, hi, type = "prob")[, "yes"] -
                          predict(rf, lo, type = "prob")[, "yes"])
}
ale <- c(0, cumsum(local_effect))           # accumulate the local effects
ale <- ale - mean(ale)                      # centre so the curve averages to zero
round(setNames(ale, round(edges, 0)), 3)
#>     20     26     34     46     57     67     76     89    100    111    120
#> -0.058 -0.133 -0.111 -0.115 -0.090 -0.059 -0.035  0.103  0.098  0.186  0.213
```

Put the two curves on the same centred scale and compare their shapes:

```r
round(setNames(pdp - mean(pdp), grid), 3)   # the PDP, centred to average zero
#>    20    30    40    50    60    70    80    90   100   110   120
#> -0.056 -0.099 -0.091 -0.093 -0.085 -0.046 -0.015 0.085 0.100 0.138 0.163
```

They agree on the big picture, flat until about $80, then rising, but they **part at the top end**. ALE reaches +0.213 at $120 while the PDP only reaches +0.163. ALE reports a steeper high-charge climb because it measured real high-charge customers moving a little, whereas the PDP diluted that climb by dragging low-spend customers into charges they never pay. At \(r = 0.96\), trust ALE's version.

In real work you would not hand-roll any of this. Reach for a package (run this in your local R):

```r-static
library(iml)                              # model-agnostic interpretability toolkit
predictor <- Predictor$new(rf, data = churn, y = "churned", type = "prob", class = "yes")

FeatureEffect$new(predictor, feature = "monthly", method = "pdp+ice")$plot()  # PDP with ICE overlaid
FeatureEffect$new(predictor, feature = "monthly", method = "ale")$plot()      # ALE, extrapolation-safe
```

=== step === quiz
::eyebrow Check yourself
## PDP or ALE?

Monthly charge and total spend are correlated at \(r = 0.96\). Your PDP and ALE for monthly charge trace the same overall shape, but the PDP is flatter at the high-charge end. Which reading is right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The PDP is simply wrong, and ALE is the true causal effect of raising the charge ::no ALE is more trustworthy under correlation, but it still explains the MODEL, not the world, so it is not a causal effect. And the PDP is not wrong everywhere, only distorted where it is forced to extrapolate.
- Because the two features are strongly correlated, the PDP averages over combinations that do not exist and gets pulled off; ALE only moves customers within realistic local ranges, so trust its steeper top end here ::ok Exactly. At r = 0.96 there are almost no real customers with a high charge and a low total spend, yet the PDP forces exactly those rows. ALE sidesteps that with local within-interval differences on customers who are really there.
- They should be identical, so the gap means an arithmetic mistake somewhere ::no PDP and ALE match only when the swept feature is roughly independent of the others. With correlation this strong they are EXPECTED to differ; the gap is the fingerprint of PDP extrapolation, not a bug.

=== step === concept
::eyebrow Go deeper
## References

- [Friedman (2001), Greedy Function Approximation: A Gradient Boosting Machine, Annals of Statistics 29(5)](https://doi.org/10.1214/aos/1013203451) - the paper that introduced partial dependence plots (Section 8.2).
- [Goldstein, Kapelner, Bleich, Pitkin (2015), Peeking Inside the Black Box: ICE plots](https://arxiv.org/abs/1309.6392) - the ICE paper: why the average hides interactions, and how one-line-per-row exposes them.
- [Apley and Zhu (2020), Visualizing the Effects of Predictor Variables in Black Box Supervised Learning Models](https://arxiv.org/abs/1612.08468) - the ALE paper, with the extrapolation problem and the accumulated-local-effects fix in full.
- [Molnar, Interpretable Machine Learning: Accumulated Local Effects chapter (free online)](https://christophm.github.io/interpretable-ml-book/ale.html) - the clearest free walkthrough of PDP vs ALE, with the correlated-feature pictures.

=== step === complete
## Lesson 4 complete

You can now draw the shape of a feature's effect three ways, each answering the last one's weakness. A **PDP** forces a feature to each value for every row and averages, the average effect in one line. **ICE** keeps one line per row so a fanning bundle warns you the effect interacts with another feature and the average is misleading. And **ALE** accumulates small local effects on the data's real distribution, so a strong correlation between features cannot push it into impossible territory the way it pushes a PDP. All three describe the model, never a guaranteed real-world outcome.

Next, Lesson 5: **Fairness Basics.** So far we have asked *how* the model behaves. The final tools ask *for whom*: does it behave differently across groups of people, how would you even measure that, and what can you actually do about it?
