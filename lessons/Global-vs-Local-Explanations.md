---
title: "Interpretability Lesson 1: Global vs Local Explanations"
catalog_blurb: "What a model learned overall versus why it made one prediction."
description: "Global vs local model explanations in R: read a feature-importance ranking, split one prediction into per-feature contributions, and know which to use."
keywords: "global vs local explanations, model interpretability, feature importance, local explanations, SHAP, explainable AI, interpretable machine learning, R"
post_type: "LESSON"
curriculum_id: "6.110.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-interpretability"
course_title: "Model Interpretability in R"
course_lesson: "1"
course_total: "6"
course_landing: "R-Interpretability-Course.html"
course_next: "Permutation-and-Drop-Column-Importance.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 6
## Global vs Local Explanations

Welcome to Model Interpretability. A model that only spits out numbers is hard to trust and impossible to act on. This course teaches you to open the box and explain what a model is doing, in plain terms a colleague or a customer can follow.

Here is the situation we will use all the way through. A telecom has trained a model that scores each customer on how likely they are to leave (to "churn"). This morning it flagged **Ravi**, a customer who is 3 months in, pays $105 a month, and has called support 4 times. His score: **0.96**, very likely to leave.

Two colleagues walk over with two very different questions:

- The product lead asks: *"In general, what makes our customers leave?"*
- Ravi's account manager asks: *"Why did the model flag **Ravi** in particular?"*

Those are not the same question, and they do not have the same answer. One is **global** (about the whole model), the other is **local** (about one prediction). Telling them apart, and answering each correctly, is the foundation everything else in this course builds on.

By the end you will be able to:

- Tell a **global** question (about the whole model) from a **local** one (about one prediction)
- Read a global **feature-importance** ranking, and say what it does and does not tell you
- Split a single prediction into per-feature pushes that add back to exactly that prediction
- Explain how the same feature can matter one way overall yet push the opposite way for one person

**Prerequisites:** you can fit and use a predictive model in R and read its output, and you know what a feature and a prediction are (any earlier Data Scientist lesson, for example [The Bias-Variance Tradeoff](The-Bias-Variance-Tradeoff.html)).

The picture below is a preview of a *local* explanation: one customer's score, taken apart feature by feature. We will build up to reading it.

::widget shap-bars {}

=== step === concept
::eyebrow The one distinction that organizes everything
## Two questions about one model

Every question you can ask a trained model falls into one of two buckets.

A **global** explanation describes the model as a whole, summarized over *all* the data it was trained on. "Which features does this churn model lean on the most?" is global. The answer is one story about the model, and it does not change from customer to customer.

A **local** explanation is about a *single* prediction. "Why did the model score **Ravi** at 0.96?" is local. The answer is specific to Ravi and his particular feature values, and it can look completely different for the next customer.

Here they are side by side, on our churn model:

| | Global explanation | Local explanation |
|---|---|---|
| The question | What has the model learned overall? | Why did it make THIS one prediction? |
| Scope | The whole model, across all 500 customers | One customer, one prediction |
| Example | Which features drive churn in general? | Why was Ravi scored 0.96? |
| Who asks | A data scientist auditing the model, a product lead | The customer, a support agent, a regulator |

[KEY INSIGHT]
Global answers "what did the model learn?" Local answers "why this prediction?" Reaching for the wrong one is the single most common interpretability mistake, and by the end of this lesson you will never confuse them again.

=== step === concept
::eyebrow Something concrete to explain
## The model we will explain

Before we explain a model, we need one in front of us. Each lesson here runs in a fresh R session, so we build the customer data right now (run this once). Each row is one customer; each column is something the company knows about them.

```r
set.seed(42)
n <- 500
churn <- data.frame(
  tenure        = round(runif(n, 0, 60)),   # months as a customer
  monthly       = round(runif(n, 20, 120)), # current monthly bill, dollars
  support_calls = rpois(n, 1.6),            # support calls this year
  senior        = rbinom(n, 1, 0.16),       # 1 = senior citizen
  addons        = rbinom(n, 1, 0.45),       # 1 = has add-on services
  annual        = rbinom(n, 1, 0.5)         # 1 = on an annual contract
)
# Whether each customer left (1) or stayed (0), driven by the features above plus chance:
lo <- -1.0 - 0.045*churn$tenure + 0.020*churn$monthly + 0.45*churn$support_calls -
       0.9*churn$annual + 0.2*churn$senior - 0.1*churn$addons
churn$churned <- rbinom(n, 1, plogis(lo))

round(mean(churn$churned), 3)   # the overall churn rate
#> [1] 0.382
```

So about **38%** of these customers left. Now we fit the model. To keep every explanation exact and easy to see, we use a deliberately simple, fully transparent model: a straight-line (linear) fit that predicts the 0/1 "churned" outcome from the six features. It gives each customer a churn score.

```r
fit   <- lm(churned ~ tenure + monthly + support_calls + senior + addons + annual,
            data = churn)
preds <- c("tenure", "monthly", "support_calls", "senior", "addons", "annual")

# The one customer we want to understand:
ravi  <- data.frame(tenure = 3, monthly = 105, support_calls = 4,
                    senior = 0, addons = 0, annual = 0)
round(predict(fit, ravi), 3)    # Ravi's churn score
#>     1
#> 0.963
```

There it is: the model scores Ravi at **0.963**. That single number is the thing a *local* explanation will take apart. First, though, let us zoom all the way out and ask the *global* question.

[NOTE]
We chose a simple linear model on purpose, so its contributions are exact and you can check them by hand. Real projects use logistic regression, random forests, and boosted trees. Those need a tool called SHAP to get the same clean breakdown, which is exactly what Lesson 3 covers.

=== step === concept
::eyebrow The whole-model view
## Global: what did it learn overall?

The global question is: **across all 500 customers, which features does this model rely on the most?** For a linear model, the answer lives in the size of each coefficient (each feature's slope). A big slope means the feature moves the prediction a lot; a slope near zero means the feature barely matters.

There is one catch. A slope is measured in the feature's own units. The `monthly` slope is "churn per extra dollar," while the `support_calls` slope is "churn per extra call." A dollar and a call are not comparable, so raw slopes cannot be ranked directly. We fix this by multiplying each slope by how much its feature actually varies across customers, its standard deviation. That puts every feature on a common "typical swing" scale:

\\( I_j = |\beta_j| \, s_j \\)

where \\( \beta_j \\) is the model's coefficient (slope) for feature \\( j \\), and \\( s_j \\) is the standard deviation of feature \\( j \\) across the 500 customers. \\( I_j \\) is that feature's global importance: the size of the push it typically applies.

```r
b   <- coef(fit)                                 # intercept + six slopes
imp <- abs(b[-1]) * sapply(churn[, preds], sd)   # slope size on a common scale
round(100 * sort(imp, decreasing = TRUE) / max(imp))   # rescaled: top feature = 100
#>        tenure       monthly support_calls        annual        senior
#>           100            81            69            54            31
#>        addons
#>             6
```

Read top to bottom, that is the model's overall story: **tenure** matters most, then the **monthly bill**, then **support calls**; add-ons barely register. The chart shows the same ranking:

::widget importance-bars {"items":[{"label":"tenure","value":100},{"label":"monthly bill","value":81},{"label":"support calls","value":69},{"label":"annual contract","value":54},{"label":"senior","value":31},{"label":"add-ons","value":6}]}

This ranking is genuinely useful. It tells you where the model's attention goes, which features are worth collecting well, and where to look first. But be careful about what it does *not* say.

[WARNING]
A global ranking is an average over everyone. It does **not** tell you why any single customer was scored the way they were (that is a local question). It shows the *size* of a feature's effect, not its *direction*. And a feature ranking high means the model leans on it, not that it *causes* churn in the real world.

=== step === quiz
::eyebrow Check yourself
## What the ranking tells you

The global ranking above puts **tenure** at the top. What does that let you conclude?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Across all customers, the model relies on tenure more than any other feature ::ok Exactly. A global ranking is a whole-model summary: on average, tenure carries the most weight. It says nothing about any one customer, and nothing about real-world cause.
- Tenure is the reason the model flagged Ravi ::no Careful: that is a LOCAL question about one customer, and the global ranking cannot answer it. Global importance is an average over all 500 customers; it measures a feature's weight in the model, not why one prediction came out the way it did, and not real-world cause.
- Short tenure causes customers to churn ::no Careful: that is a LOCAL question about one customer, and the global ranking cannot answer it. Global importance is an average over all 500 customers; it measures a feature's weight in the model, not why one prediction came out the way it did, and not real-world cause.

=== step === concept
::eyebrow The single-prediction view
## Local: why THIS prediction?

Now the other question: why did the model score **Ravi** at 0.963, and not the average? A local explanation answers it by starting from a neutral **baseline** and then adding one signed push for each feature.

- The **baseline**, written \\( \phi_0 \\), is the model's *average* prediction across all customers. It is where you would start if you knew nothing about a particular person. For our model the baseline is the base churn rate, about 0.38.
- Each feature then contributes a **push**, written \\( \phi_j \\) for feature \\( j \\). A push can be positive (raises the score) or negative (lowers it).

Add the baseline and all the pushes and you land exactly on the prediction:

\\( \hat f(x) = \phi_0 + \sum_{j=1}^{p} \phi_j \\)

Here \\( \hat f(x) \\) is the model's prediction for this customer \\( x \\), \\( \phi_0 \\) is the baseline, \\( \phi_j \\) is feature \\( j \\)'s push, and \\( p \\) is the number of features (6 for us). That "everything sums back to the prediction" property is the whole point: it means the explanation leaves nothing out.

For our linear model each push has a simple, exact form:

\\( \phi_j = \beta_j \, (x_j - \bar x_j) \\)

In words: a feature's push is its slope \\( \beta_j \\) times how far *this customer's* value \\( x_j \\) sits from the average value \\( \bar x_j \\). A customer who is exactly average on a feature gets a push of zero from it; the further from average they are, the bigger the push. The widget on the cover was one of these breakdowns: a baseline, a stack of signed pushes, adding up to one prediction. Let us compute Ravi's for real.

=== step === concept
::eyebrow The pushes, computed
## Add up Ravi's pushes

Ravi is far from average in a few ways: he is very new (tenure 3 against a typical 30-ish), his bill is high, and he has called support more than most. Each of those becomes a push. Using the formula \\( \phi_j = \beta_j (x_j - \bar x_j) \\):

```r
mu        <- colMeans(churn[, preds])                # the average customer
ravi_push <- b[preds] * (unlist(ravi[preds]) - mu)   # each feature's push for Ravi
round(ravi_push, 3)
#>        tenure       monthly support_calls        senior        addons
#>         0.207         0.140         0.190        -0.020        -0.008
#>        annual
#>         0.072
baseline  <- mean(fitted(fit))                       # the average prediction
round(baseline, 3)
#> [1] 0.382
```

Read Ravi's story straight off the pushes: being new (**tenure**, +0.207), having made several **support calls** (+0.190), and a high **monthly** bill (+0.140) each shove his risk up hard. Being on a month-to-month plan (**annual** = 0) adds a bit more (+0.072). Nothing pulls him down much. Start at the 0.382 baseline, pile on those pushes, and you should land back on his 0.963 score.

[KEY INSIGHT]
A local explanation is honest only because it is complete: baseline + every push = the exact prediction, with no leftover. That is what separates it from a vague "well, he is new and calls a lot" hand-wave.

=== step === tryit
::eyebrow Your turn
## Rebuild Ravi's score

`baseline` (0.382) and `ravi_push` (his six pushes) are already in memory from the last step. Reconstruct Ravi's prediction by starting at the baseline and adding all of his pushes. You should get back the exact **0.963** the model gave him.

```r
# Fill in the blank: baseline plus the sum of all of Ravi's pushes
prediction <- ____
round(prediction, 3)
```
::check {"regex":"baseline\\s*\\+\\s*sum\\s*\\(\\s*ravi_push|sum\\s*\\(\\s*ravi_push\\s*\\)\\s*\\+\\s*baseline","gate":true,"difficulty":"beginner","ok":"That is it. baseline + sum(ravi_push) rebuilds 0.963, the very score the model gave Ravi. Local contributions always add back to the prediction.","no":"Start at the baseline (the average prediction) and add every one of Ravi's pushes: prediction <- baseline + sum(ravi_push)."}
::solution
```r
prediction <- baseline + sum(ravi_push)
round(prediction, 3)
#> [1] 0.963
```

=== step === concept
::eyebrow Where the two views split apart
## Global is not local

Here is the trap that catches people. It is tempting to read the global ranking, see **tenure** at the top, and conclude "so tenure is why the model flags people." That is wrong, and one more customer shows why.

Meet **Meera**: a 52-month loyal customer (long tenure), a $95 bill, but **9** support calls this year. The model flags her too, at 0.94. Let us break down her prediction the same way:

```r
meera      <- data.frame(tenure = 52, monthly = 95, support_calls = 9,
                         senior = 0, addons = 1, annual = 0)
meera_push <- b[preds] * (unlist(meera[preds]) - mu)
round(meera_push, 3)
#>        tenure       monthly support_calls        senior        addons
#>        -0.177         0.102         0.577        -0.020         0.009
#>        annual
#>         0.072
round(baseline + sum(meera_push), 3)   # Meera's churn score
#> [1] 0.944
```

Look at what drives Meera versus what drives the model overall:

| Feature | Global rank | Ravi's push | Meera's push |
|---|---|---|---|
| tenure | 1st (strongest overall) | +0.207 (he is new) | **-0.177 (she is loyal)** |
| monthly bill | 2nd | +0.140 | +0.102 |
| support calls | 3rd | +0.190 | **+0.577 (drives her flag)** |
| annual contract | 4th | +0.072 | +0.072 |

For Meera, **tenure**, the model's number-one *global* feature, actually pushes her risk *down*: she is loyal, so it protects her. What flags her is **support calls**, which ranks only third globally but dominates *her* prediction. The global ranking and Meera's local explanation point at different features, and neither is wrong.

[KEY INSIGHT]
Global importance measures a feature's *average* weight across everyone. A local push is about *one* customer's own value and its *direction*. So a top-global feature can raise one person's risk, protect another, and barely touch a third. You cannot read a single prediction off the global chart.

=== step === quiz
::eyebrow Check yourself
## The same feature, two directions

Tenure is the model's number-one *global* feature, yet for Meera it pushed her churn score *down*. How can both be true at once?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Tenure's global rank is an average size over everyone; Meera's long tenure lowers HER score, while her many support calls are what flag her ::ok Right. Global importance is an average magnitude; a local push is about one customer's value and its direction. A top-global feature can help one person, hurt another, and barely move a third.
- The model is inconsistent and should be retrained ::no Nothing is broken. Global importance measures a feature's average weight across all customers; a local push is about one customer's own value and its direction. A top-global feature can help, hurt, or barely matter for any single person, all from the same correct model.
- The global ranking must be wrong ::no Nothing is broken. Global importance measures a feature's average weight across all customers; a local push is about one customer's own value and its direction. A top-global feature can help, hurt, or barely matter for any single person, all from the same correct model.

=== step === concept
::eyebrow Picking the right tool
## Which explanation do you need?

Global and local are not competitors; they answer different questions. The skill is reaching for the right one. A quick guide:

| You want to... | Use | Why |
|---|---|---|
| Decide which features to keep or collect better | Global | It ranks features across the whole model |
| Audit what a model relies on before you ship it | Global | It describes the model's overall behaviour |
| Tell a customer why *they* were flagged | Local | It is about their one prediction |
| Write a loan-decline or adverse-action notice | Local | The law asks for the reasons behind *that* decision |
| Debug one surprising prediction | Local | You need that row's own drivers |

Often you want both: a global ranking to understand the model, then a local explanation whenever a single decision has to be justified. The rest of this course fills in the modern tools for each: **permutation importance** for global (Lesson 2), **SHAP** for exact local explanations on any model (Lesson 3), and **partial dependence** for the shape of a feature's effect (Lesson 4).

=== step === quiz
::eyebrow Check yourself
## Match the question to the explanation

Ravi phones in and asks: *"Why did your system flag ME as likely to leave?"* Which explanation answers him?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The global feature-importance ranking ::no His question is about ONE prediction (his own), so it needs a LOCAL explanation. The global ranking describes the model in general and cannot say why Ravi specifically was scored the way he was.
- A local explanation of Ravi's own prediction ::ok Exactly. "Why ME?" is a single-prediction question, so you break down Ravi's own score into its per-feature pushes.
- Neither; you cannot explain one prediction ::no A single prediction absolutely can be explained: that is what a local explanation does, feature by feature. Ravi's "why ME?" is a LOCAL question, so give him a local explanation, not the global ranking.

=== step === concept
::eyebrow Go deeper
## References

- [Molnar, Interpretable Machine Learning](https://christophm.github.io/interpretable-ml-book/) - the standard free reference; its global-versus-local split is the frame for this whole course.
- [iml: Interpretable Machine Learning in R](https://cran.r-project.org/package=iml) - one package that computes both global importance and local explanations for any model you fit.
- [Lundberg and Lee (2017), A Unified Approach to Interpreting Model Predictions (SHAP)](https://arxiv.org/abs/1705.07874) - the additive local breakdown you met here, made exact for any model; the subject of Lesson 3.
- [Ribeiro, Singh and Guestrin (2016), Why Should I Trust You? (LIME)](https://arxiv.org/abs/1602.04938) - the first widely used model-agnostic local explanation.
- [Breiman (2001), Random Forests](https://doi.org/10.1023/A:1010933404324) - introduces the variable-importance idea behind most global rankings.

=== step === complete
## Lesson complete

You now have the distinction that the rest of this course rests on. **Global** explanations describe the whole model over all its data; **local** explanations take apart one prediction. You read a feature-importance ranking (\\( I_j = |\beta_j| s_j \\)), broke Ravi's score into pushes that summed back exactly to 0.963 (\\( \hat f(x) = \phi_0 + \sum_j \phi_j \\)), and saw with Meera why the top global feature can be the wrong reason for a single flag.

You also saw a soft spot: our global ranking came from reading a linear model's coefficients, which only works because the model is a straight line. **Lesson 2, Permutation and Drop-Column Importance,** gives you a global-importance method that works for *any* model, a random forest, a boosted tree, a neural net, and shows the ways it can quietly mislead you.
