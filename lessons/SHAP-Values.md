---
title: "Interpretability Lesson 3: SHAP Values"
catalog_blurb: "Split one prediction into fair per-feature contributions that sum to it."
description: "SHAP values in R: split one model prediction into per-feature contributions that sum exactly to it, computed from game theory, plus where SHAP misleads."
keywords: "SHAP values, Shapley values, additive feature attribution, local explanation, model interpretability, explainable AI, XAI, game theory, kernelshap, R"
post_type: "LESSON"
curriculum_id: "6.110.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-interpretability"
course_title: "Model Interpretability in R"
course_lesson: "3"
course_total: "6"
course_landing: "R-Interpretability-Course.html"
course_next: "Partial-Dependence-ICE-and-ALE.html"
course_prev: "Permutation-and-Drop-Column-Importance.html"
---

=== step === cover
::eyebrow Lesson 3 of 6
## SHAP Values

In Lesson 2 you ranked features for a black-box model by shuffling them. That answered the product lead's **global** question: *which features drive this model overall?* It said nothing about one customer.

Back in Lesson 1 the retention rep had a **local** question: *why was Ravi flagged at 0.87?* We answered it with a waterfall, a baseline plus one push per feature, but we never said where those pushes come from, or why they are the *fair* pushes to show. This lesson fixes that. **SHAP** is a principled recipe, borrowed from game theory, for splitting a single prediction into per-feature contributions that add up to it exactly, and it works on any model.

By the end you will be able to:

- Explain SHAP as a **fair split** of one prediction into per-feature contributions that sum exactly to it
- Derive a **Shapley value** as a feature's average marginal contribution over every join order, and compute one in R
- Read a SHAP **waterfall**, and turn many local explanations into a global importance
- Name SHAP's honest limits: its cost, correlated features, and why it explains the model, not the world

**Prerequisites:** you have done [Lesson 1: Global vs Local Explanations](Global-vs-Local-Explanations.html) and [Lesson 2: Permutation and Drop-Column Importance](Permutation-and-Drop-Column-Importance.html), you can fit and use a model in R such as a [random forest](Random-Forest-Course.html), and you know what a feature, a prediction, and a baseline are.

::widget shap-bars {}

=== step === concept
::eyebrow The setup
## One prediction, a payout to divide

Our churn model scores **Ravi** at a **0.87** risk of leaving. The *average* customer scores about **0.30**. That average is the **baseline**: the model's best guess before it looks at anything specific about Ravi. So something about Ravi pushed his score **0.57 above the baseline**, and a local explanation has to say which features did the pushing, and by how much.

Write \(\hat{f}(x)\) for the model's prediction on one customer \(x\), \(\phi_0\) for the baseline (the average prediction), and \(\phi_j\) for the contribution of feature \(j\) to this prediction. A complete local explanation splits the prediction like this:

\[ \hat{f}(x) = \phi_0 + \sum_{j=1}^{p} \phi_j, \]

where \(p\) is the number of features. In words: baseline plus every feature's push equals the prediction, with nothing left over. That "adds up exactly" property has a name, **efficiency** (or local accuracy), and it is the whole reason a waterfall is an *explanation* rather than a loose ranking. The gap it must divide up here is \(0.87 - 0.30 = 0.57\).

[NOTE]
Strictly, the pushes add up on the model's raw **score** (log-odds) scale, which is linear, not on the squashed 0-to-1 probability scale. We keep the probability numbers for the story, but do the exact arithmetic on the score in a moment.

The open question is the hard part: *how do we set each \(\phi_j\) fairly?* Especially when features interact or overlap, as the correlated twins in Lesson 2 did.

=== step === concept
::eyebrow The fairness idea
## A fair share is an average over orders

Forget models for one paragraph. **Ann, Ben, and Cara** ship a feature together and earn a **$60** team bonus. How much did each person add? The honest answer is not "split it three ways by default", it is "credit each person for what they actually contributed." The catch: a person's contribution depends on **who was already working** when they joined. If Ben joins a project Ann has already scoped, he adds less than if he had started from a blank page.

So we look at every order the team could have formed in, and average each person's **marginal contribution**: the extra value they add at the moment they join. Suppose any one person alone ships a small version worth $10, any pair ships $40, and all three ship $60. Here is Ann's marginal value across all six join orders:

| Join order | Ann joins | Ann's marginal value |
|---|---|---|
| Ann, Ben, Cara | first (blank page) | $10 |
| Ann, Cara, Ben | first (blank page) | $10 |
| Ben, Ann, Cara | after Ben | $30 |
| Cara, Ann, Ben | after Cara | $30 |
| Ben, Cara, Ann | last | $20 |
| Cara, Ben, Ann | last | $20 |

Ann's fair share is the average, \((10 + 10 + 30 + 30 + 20 + 20)/6 = \$20\). By symmetry Ben and Cara also get $20, and the three shares sum to the full **$60**. That is a **Shapley value**, from Lloyd Shapley's 1953 work on cooperative games, and it is the only way to divide the payout that satisfies a handful of fairness rules at once.

[KEY INSIGHT]
SHAP treats one prediction as exactly this game. The **players** are the features. The **payout** is the prediction minus the baseline (Ravi's $0.57$). Each feature's SHAP value \(\phi_j\) is its fair share of that payout: its average marginal contribution over every order the features could be added in. The shares summing to the payout is the efficiency property from the previous step.

=== step === concept
::eyebrow The formula
## The Shapley value, written down

Now the same idea in symbols, defining every one. Let \(N = \{1, 2, \dots, p\}\) be the set of all \(p\) features. A **coalition** \(S\) is any subset of features that has already "joined." Write \(v(S)\) for the **value** of a coalition: the model's prediction when only the features in \(S\) take this customer's values and every other feature is held at its average. So \(v(\varnothing) = \phi_0\) (no features known, the baseline) and \(v(N) = \hat{f}(x)\) (all features known, the full prediction).

The **marginal contribution** of feature \(j\) to a coalition \(S\) that does not contain it is \(v(S \cup \{j\}) - v(S)\): how much the prediction moves when \(j\) walks into the room. The Shapley value averages that over every coalition, weighted by how many join orders produce it:

\[ \phi_j = \sum_{S \subseteq N \setminus \{j\}} \frac{|S|!\,\big(p - |S| - 1\big)!}{p!}\,\Big(v(S \cup \{j\}) - v(S)\Big), \]

where \(|S|\) is the number of features in \(S\), and the fraction is the share of the \(p!\) possible orderings in which exactly the features of \(S\) come before \(j\). The weights across all coalitions add to 1, so \(\phi_j\) is a genuine weighted average of marginal contributions.

This one definition is forced by four properties you actually want, and no other split has all four:

- **Efficiency:** the contributions plus the baseline sum to the prediction (a complete explanation).
- **Symmetry:** two features that change every prediction identically get equal credit.
- **Dummy:** a feature that never changes the output gets exactly 0.
- **Additivity:** SHAP values of a model made of two parts are the sum of the parts' SHAP values.

=== step === concept
::eyebrow In R
## Compute SHAP for Ravi, two ways that agree

Let us make this concrete and exact. Here is a small, transparent churn model whose coefficients we can read off directly, so we can check SHAP by hand. It outputs a risk **score** (higher means more likely to leave); running the score through `plogis()` turns it into a probability. Build it and read off Ravi's numbers (run this once).

```r
b0 <- -1.00                                                   # intercept
b  <- c(tenure = -0.06, monthly = 0.02, support_calls = 0.35) # one slope per feature
predict_score <- function(x) b0 + sum(b * x)                  # the model's score for a customer x

avg  <- c(tenure = 30, monthly = 70,  support_calls = 1.5)    # the average customer
ravi <- c(tenure = 3,  monthly = 105, support_calls = 4)      # the customer we explain

baseline   <- predict_score(avg)      # score of the average customer = the baseline
prediction <- predict_score(ravi)     # Ravi's score
round(c(baseline = baseline, prediction = prediction, gap = prediction - baseline), 3)
#>   baseline prediction        gap
#>     -0.875      2.320      3.195
round(c(avg_prob = plogis(baseline), ravi_prob = plogis(prediction)), 2)
#>  avg_prob ravi_prob
#>      0.29      0.91
```

The baseline score is \(-0.875\) (about a 0.29 probability) and Ravi sits at \(2.32\) (about 0.91). The **gap** of \(3.195\) on the score scale is the payout SHAP must divide among the three features.

For a linear model the Shapley value has an exact closed form: each feature's contribution is its slope times how far this customer sits from the average, \(\phi_j = \beta_j\,(x_j - \bar{x}_j)\).

```r
phi <- b * (ravi - avg)               # SHAP contributions, linear closed form
round(phi, 3)
#>        tenure       monthly support_calls
#>         1.620         0.700         0.875
c(sum_contrib = sum(phi), gap = prediction - baseline)
#>  sum_contrib          gap
#>        3.195        3.195
all.equal(sum(phi), prediction - baseline)
#> [1] TRUE
```

The three contributions sum to exactly the gap: **efficiency**, holding. Tenure does most of the pushing (Ravi is far below the average tenure), and every push is positive, which is why nothing pulls his score back down.

Now prove those closed-form numbers really are the game-theoretic Shapley values by computing the definition directly: average each feature's marginal contribution over every coalition.

```r
feats <- names(b)                     # the three players
p <- length(feats)

# value of a coalition S: prediction when features in S take Ravi's values, the rest sit at avg
v <- function(S) {
  x <- avg
  x[S] <- ravi[S]
  predict_score(x)
}

# every subset of a set of names, including the empty coalition
subsets_of <- function(items) {
  out <- list(character(0))
  for (k in seq_along(items)) out <- c(out, combn(items, k, simplify = FALSE))
  out
}

# Shapley value of feature j: weighted average marginal contribution over all coalitions
shapley <- function(j) {
  rest  <- setdiff(feats, j)
  total <- 0
  for (S in subsets_of(rest)) {
    w <- factorial(length(S)) * factorial(p - length(S) - 1) / factorial(p)
    total <- total + w * (v(c(S, j)) - v(S))
  }
  total
}

shap <- sapply(feats, shapley)
round(shap, 3)
#>        tenure       monthly support_calls
#>         1.620         0.700         0.875
all.equal(shap, phi)                  # the enumeration matches the closed form
#> [1] TRUE
```

Identical. The slow, honest, average-over-every-order definition gives the same answer as the one-line shortcut. That shortcut only exists because this model is purely additive: here a feature's marginal contribution is the same no matter who joined first, so the averaging is trivial. On a model with **interactions** the orders genuinely disagree, and averaging over them is where SHAP earns its keep.

=== step === quiz
::eyebrow Check yourself
## What does "sums to the prediction" buy you?

Ravi's three SHAP contributions on the score scale are \(1.62\), \(0.70\), and \(0.875\), and they add up to his gap of \(3.195\). A teammate says: *nice, but that adding-up is just a coincidence of this tidy example, real SHAP values will not sum to the prediction.* Is that right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Right: the sum only lands on the prediction for simple linear models; for a forest the contributions overshoot or undershoot ::no Efficiency is a mathematical property of the Shapley value itself, not a lucky feature of linear models. For ANY model, the SHAP contributions plus the baseline are guaranteed to sum to that row's prediction.
- Wrong: summing to the prediction (efficiency) is guaranteed by the Shapley definition, for any model, not just linear ones ::ok Exactly. Efficiency is one of the four defining properties, so it holds for a forest, a neural net, anything. What changes with a complex model is the COST of computing the contributions, never whether they add up.
- Wrong, but only because we set the baseline to the average; with a different baseline they would not sum ::no The baseline is DEFINED as the average prediction so that efficiency holds; that is not a loophole. With that standard baseline, the contributions sum to the prediction for every model.

=== step === widget
::eyebrow Reading one
## A SHAP explanation is a waterfall

The standard way to show a local SHAP explanation is a **waterfall**: start at the baseline, add each feature's signed contribution (blue pushes the score up, amber pulls it down), and land exactly on this customer's prediction. Below is a SHAP waterfall for a different flagged customer, one with a few more features than Ravi's three, plus the exact R that computes the contributions for a linear model beside it. Press Run to watch the pieces add up.

::widget shap-bars {}

Read it left to right as a story about one prediction: a blue tenure bar and a blue monthly-spend bar push the score up, an amber support-calls bar pulls it back down, a couple of smaller bars nudge it, and the stack lands exactly on this customer's prediction. The direction is per customer, not fixed per feature: support calls point down for this customer even though they pushed Ravi's score up. A SHAP contribution is signed row by row, so the same feature can lift one person's score and lower another's. That is a local explanation you could read out loud to justify a single decision, which is exactly what the retention rep needed for Ravi.

=== step === tryit
::eyebrow Your turn
## Rebuild the prediction from the pieces

Efficiency says the baseline plus every SHAP contribution must reconstruct the prediction exactly. You already have `baseline` and the contribution vector `shap` from the code above. Put them together to recover Ravi's score, then check it.

```r
reconstructed <- ____                 # the baseline plus every SHAP contribution
round(reconstructed, 3)
```
::check {"regex":"baseline\\s*\\+\\s*sum\\(\\s*shap\\s*\\)|sum\\(\\s*shap\\s*\\)\\s*\\+\\s*baseline","gate":true,"difficulty":"intermediate","ok":"That is efficiency in one line: baseline + sum(shap) = -0.875 + 3.195 = 2.32, exactly Ravi's score. The pieces rebuild the whole.","no":"Add the baseline to the total of the contributions: baseline + sum(shap)."}
::solution
```r
reconstructed <- baseline + sum(shap) # -0.875 + 3.195
round(reconstructed, 3)
#> [1] 2.32
```

=== step === concept
::eyebrow Where it shines, and where it does not
## Correlated features, cost, and causation

Remember the correlated-feature trap from Lesson 2: add a near-duplicate `tenure_copy` and permutation importance made **both** twins look worthless, because either could cover for the other during a shuffle. SHAP behaves more gracefully here. Because it averages over coalitions, it **splits** the shared credit between the twins rather than zeroing them out, and, by efficiency, the two half-shares still sum into the total correctly.

| | Permutation (Lesson 2) | SHAP |
|---|---|---|
| Two near-duplicate features | each looks near-zero (either covers the other) | credit split between them, roughly half each |
| Do the parts add up? | no global guarantee | yes, contributions + baseline = prediction |
| Reading a single row | not designed for it | its native job (the waterfall) |

But be honest about three real limits:

- **Cost.** Exact SHAP averages over all \(2^p\) coalitions, which explodes past a handful of features. In practice you never enumerate by hand: **KernelSHAP** approximates it for any model by sampling coalitions, and **TreeSHAP** computes it exactly and fast for tree ensembles.
- **It explains the model, not the world.** A large SHAP value means a feature moved *this model's output* for *this row*. It is not a causal effect, and it inherits every bias the model learned.
- **Interactions hide inside additive bars.** SHAP hands each feature one number. When two features only matter together, that single bar can misrepresent the joint story, which is what partial dependence and ICE (the next lesson) are for.

In real R you reach for a package rather than the hand-rolled loop above. This block is for your local R session (it uses libraries that do not run in the browser):

```r-static
# Model-agnostic SHAP for a real fitted model (run this in your local R):
library(randomForest); library(kernelshap); library(shapviz)

rf <- randomForest(churned ~ ., data = train)              # any fitted model
s  <- kernelshap(rf, X = test[, predictors], bg_X = train[, predictors])
sv <- shapviz(s)
sv_waterfall(sv, row_id = 1)   # explain ONE prediction (the waterfall)
sv_importance(sv)              # mean(|SHAP|) over rows = a SHAP-based global importance
```

That last line closes the loop with Lessons 1 and 2: average the absolute SHAP value of a feature across many rows and you get a **global** importance built from honest local pieces, one that respects correlated features instead of being fooled by them.

=== step === quiz
::eyebrow Check yourself
## SHAP is not a lever

Ravi's SHAP explanation shows `monthly` charge with a large positive contribution. A manager concludes: *so if we cut Ravi's monthly charge, his churn risk will drop by that amount.* What is the right response?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- He is right: a positive SHAP contribution is exactly how much lowering that feature would lower the risk ::no SHAP attributes the model's OUTPUT for this row; it is not a promise about what happens if you intervene. Changing the charge changes the input, and the model, and the world, in ways a single attribution does not capture.
- He is right only if monthly charge is the most important feature globally ::no Global rank is irrelevant to the point. Even the top feature's SHAP value is an attribution of the current prediction, not the causal effect of changing that feature.
- He is wrong: SHAP explains why the MODEL scored this row as it did, which is not the causal effect of changing the charge ::ok Exactly. SHAP is a faithful account of the model's arithmetic on Ravi's row, not a controlled experiment. To claim "cutting the charge cuts churn" you need causal evidence (Lesson on experiments), not an attribution.

=== step === concept
::eyebrow Go deeper
## References

- [Lundberg and Lee (2017), A Unified Approach to Interpreting Model Predictions](https://arxiv.org/abs/1705.07874) - the SHAP paper: it showed the common additive explainers are all approximating one thing, the Shapley value.
- [Molnar, Interpretable Machine Learning: SHAP chapter (free online)](https://christophm.github.io/interpretable-ml-book/shap.html) - the clearest free walkthrough of the game-theory framing and the plots.
- [Lundberg et al. (2020), From local explanations to global understanding with explainable AI for trees](https://arxiv.org/abs/1905.04610) - TreeSHAP: exact, fast SHAP for tree ensembles, and building global insight from local values.
- [kernelshap + shapviz (R packages)](https://modeloriented.github.io/kernelshap/) - compute model-agnostic SHAP and draw the waterfall and importance plots in R, no hand-enumerated coalitions.

=== step === complete
## Lesson 3 complete

You can now explain one prediction the principled way. **SHAP** treats a prediction as a payout, \(\hat{f}(x) - \phi_0\), and splits it among the features by their average marginal contribution over every join order, a **Shapley value**. The split satisfies efficiency, so the contributions and the baseline always rebuild the prediction exactly, on any model. You computed one two ways that agreed, read it as a waterfall, and saw the honest limits: the \(2^p\) cost handled by KernelSHAP and TreeSHAP, credit split fairly across correlated features, and the standing rule that SHAP explains the model, not the world.

Next, Lesson 4: **Partial Dependence, ICE, and ALE.** SHAP gives one number per feature per row. The next tools ask a different question, the *shape* of a feature's effect: as one feature sweeps from low to high, how does the prediction move, on average and row by row?
