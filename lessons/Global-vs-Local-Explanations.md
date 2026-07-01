---
title: "Interpretability Lesson 1: Global vs Local Explanations"
catalog_blurb: "What a model learned overall versus why it made one prediction."
description: "Global versus local explanations in R: read a global feature-importance ranking, break one prediction into per-feature contributions, and know which one you need."
keywords: "global vs local explanations, model interpretability, feature importance, local explanation, explainable AI, XAI, interpretable machine learning, SHAP, R"
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

Your team trained a model that predicts which customers will cancel their subscription, and it does well on the test set. This morning it flags **Ravi**, a three-month-old account, with a churn risk of **0.87**. Two colleagues walk over with two very different questions.

The retention rep asks: *why Ravi?* She has to call him today and needs a reason. The product lead asks: *what makes customers churn in general?* He wants to fix the product, not one account.

Those are not the same question, and they need two different kinds of explanation. This lesson is about telling them apart.

By the end you will be able to:

- Tell a **global** explanation (what the model learned overall) from a **local** one (why it made a single prediction)
- Read a global **feature-importance** ranking, and a local **per-feature contribution** breakdown, in R
- See why a feature that dominates the model overall can be irrelevant to one prediction, and pick the right explanation for the question you are answering

**Prerequisites:** you can fit and use a predictive model in R, such as a [logistic regression](Logistic-Regression-Done-Properly.html) or a [random forest](Random-Forest-Course.html), and you know what a feature and a prediction are.

::widget importance-bars {"items":[{"label":"tenure","value":0.99},{"label":"monthly charge","value":0.48},{"label":"support calls","value":0.35},{"label":"senior","value":0.18},{"label":"add-ons","value":0.02},{"label":"contract","value":0.02}]}

=== step === concept
::eyebrow The core idea
## Two questions about one model

The retention rep and the product lead are both asking the model to explain itself, but they point at different things.

The product lead wants a **global** explanation: a statement about the whole model, averaged over every customer. *In general, tenure matters more than anything else.* The rep wants a **local** explanation: a statement about one row, one prediction. *Ravi was flagged because his tenure is tiny and his bill is high.*

Keep those two straight and the rest of interpretability falls into place. Here is the whole distinction on one card.

| Aspect | Global explanation | Local explanation |
|---|---|---|
| Answers | What did the model learn overall? | Why did it make THIS prediction? |
| Scope | The whole model, across all customers | One customer, one prediction |
| Example | Tenure drives churn more than any other feature | Ravi was flagged for short tenure and a high bill |
| Who needs it | Product lead, auditor, regulator | The customer, the rep on the case, you debugging |
| Typical tool | Feature importance (a ranking) | Per-feature contributions (a waterfall) |

Same model, two lenses. The rest of the lesson builds one of each in R, then shows why you cannot swap one for the other.

=== step === concept
::eyebrow The model, in R
## Meet the model

Before we can explain a model, we need one to explain. Here is a small, self-contained churn dataset and a logistic-regression model fit on it. Each row is a customer; `churned` is 1 if they left. Run it once.

```r
set.seed(42)
n <- 500
churn <- data.frame(
  tenure        = round(runif(n, 0, 60)),       # months as a customer
  monthly       = round(runif(n, 20, 120), 1),  # monthly charge (dollars)
  support_calls = rpois(n, 1.5),                # support calls last quarter
  contract      = rbinom(n, 1, 0.5),            # 1 = on a 1-year contract
  addons        = rbinom(n, 1, 0.4),            # has paid add-ons
  senior        = rbinom(n, 1, 0.16)            # senior-citizen flag
)
# whether each customer left depends mostly on short tenure, high charges, and support calls
lp <- -1.0 - 0.06 * churn$tenure + 0.02 * churn$monthly +
       0.35 * churn$support_calls - 0.5 * churn$contract
churn$churned <- rbinom(n, 1, plogis(lp))       # 1 = the customer left

fit <- glm(churned ~ ., data = churn, family = binomial)   # a churn model

# Ravi: only 3 months in, on a pricey month-to-month plan, calling support a lot.
ravi <- data.frame(tenure = 3, monthly = 105, support_calls = 4,
                   contract = 0, addons = 0, senior = 0)
round(as.numeric(predict(fit, ravi, type = "response")), 2)
#> [1] 0.87
```

The model gives Ravi a **0.87** chance of churning, well above a typical customer. That single number is the prediction. Everything that follows is about explaining it, in two different ways.

=== step === concept
::eyebrow The first lens
## The global explanation: what did it learn?

A **global** explanation summarizes the whole model in one picture: which features move its predictions the most, across all 500 customers? That is exactly what **feature importance** measures.

For a linear model like this one, a natural importance for feature \(j\) is the size of its standardized effect,

\[ I_j = |\beta_j|\,\sigma_j, \]

where \(\beta_j\) is the model's coefficient on feature \(j\) and \(\sigma_j\) is that feature's standard deviation (how much it varies across customers). Multiplying by \(\sigma_j\) puts every feature on the same footing, so a coefficient measured in dollars and a coefficient on a 0/1 flag become comparable. A bigger \(I_j\) means the feature swings the model's score more.

```r
# Global importance: each coefficient, scaled by how much its feature varies.
imp <- abs(coef(fit)[-1]) * sapply(churn[, 1:6], sd)
round(sort(imp, decreasing = TRUE), 2)
#>        tenure       monthly support_calls        senior        addons      contract
#>          0.99          0.48          0.35          0.18          0.02          0.02
```

Read top to bottom: **tenure** dominates, then **monthly charge**, then **support calls**; the rest barely move the model. Here is that ranking as a chart.

::widget importance-bars {"items":[{"label":"tenure","value":0.99},{"label":"monthly charge","value":0.48},{"label":"support calls","value":0.35},{"label":"senior","value":0.18},{"label":"add-ons","value":0.02},{"label":"contract","value":0.02}]}

[NOTE]
Importance tells you *how much* a feature matters, not *which way*. This ranking does not say whether more tenure raises or lowers churn, and it says nothing about any single customer. It is a fact about the model's average behavior, not about Ravi.

=== step === quiz
::eyebrow Check yourself
## What does global importance tell you?

Your model ranks **tenure** as its most important feature by far. A teammate concludes: *so for every customer the model flags, short tenure is the main reason.* Is that a safe conclusion from the global ranking alone?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Yes: the most important feature is the main reason behind every prediction ::no Global importance is an average over all customers. It says tenure moves the model most ON AVERAGE, not that it drives every individual prediction. Some flagged customers have perfectly ordinary tenure.
- No: importance is an overall average, it does not tell you why any single customer was flagged ::ok Right. A global ranking describes the model's average behavior. Why one specific customer was flagged is a LOCAL question, and the answer can put a different feature on top.
- No, because the ranking also needs the direction, positive or negative, of each feature ::no True that importance omits direction, but that is not the flaw here. Even WITH directions, a global average still cannot give the reason behind one specific prediction.

=== step === widget
::eyebrow The second lens
## The local explanation: why THIS prediction?

Now the rep's question. A **local** explanation takes ONE prediction and splits it into a baseline plus one push per feature, so the pushes add up to exactly that prediction:

\[ \hat{y}(x) = \phi_0 + \sum_{j} \phi_j, \]

where \(\hat{y}(x)\) is the model's score for this one customer \(x\), \(\phi_0\) is the **baseline** (the average prediction, what the model would say knowing nothing about this customer), and \(\phi_j\) is the **contribution** of feature \(j\) to this prediction: positive if it pushed the score up, negative if it pushed it down. For a linear model each contribution has an exact form,

\[ \phi_j = \beta_j\,(x_j - \bar{x}_j), \]

the coefficient times how far this customer's feature sits from the average \(\bar{x}_j\). A customer who is average on a feature gets no push from it; a customer far from average gets a big one.

Read as a waterfall, that is a local explanation: start at the baseline and add each push until you land on this customer's prediction. Run the code beside it to watch the contributions add up exactly.

::widget shap-bars {}

The waterfall above breaks down one flagged customer. Ravi's looks the same in shape: his very short tenure and high monthly charge push his score far above the baseline, and nothing pulls it back, which is how he reaches **0.87**. One principled way to compute these contributions for *any* model, called **SHAP**, is the subject of Lesson 3; here the point is simply what a local explanation *is*.

=== step === tryit
::eyebrow Your turn
## Make the pushes add up

A local explanation has to reconstruct the prediction exactly: the baseline plus every push. Here is one flagged customer as a baseline and five contributions. Add them up to get the model's predicted risk, then check it.

```r
baseline <- 0.30                        # the average customer's predicted risk
contrib  <- c(tenure = 0.22, monthly = 0.14, support_calls = -0.18,
              contract = -0.07, addons = 0.09)   # this customer's per-feature pushes
prediction <- ____                      # the baseline plus every push
prediction
```
::check {"regex":"baseline\\s*\\+\\s*sum\\(\\s*contrib\\s*\\)|sum\\(\\s*contrib\\s*\\)\\s*\\+\\s*baseline","gate":true,"difficulty":"beginner","ok":"Exactly: baseline + sum(contrib) = 0.30 + 0.20 = 0.50. The pushes rebuild the prediction, and that add-up-to-the-prediction property is what makes it an explanation.","no":"Add the baseline to the total of the pushes: baseline + sum(contrib)."}
::solution
```r
baseline <- 0.30
contrib  <- c(tenure = 0.22, monthly = 0.14, support_calls = -0.18,
              contract = -0.07, addons = 0.09)
prediction <- baseline + sum(contrib)   # 0.30 + 0.20 = 0.50
prediction
```

=== step === concept
::eyebrow The trap
## Global importance is not a local reason

Here is the mistake that turns a good analyst into a wrong one: reading the global ranking as the reason behind an individual prediction. They come apart all the time.

Take two flagged customers. **Ravi** has been a customer for 3 months, well below the average tenure, so tenure pushes his score up hard. **Meera** has been a customer for four years, right around the average, so tenure barely moves her score at all, even though tenure is the model's number-one feature globally. Meera was flagged because she suddenly called support seven times.

| Feature | Global rank | Ravi's push | Meera's push |
|---|---|---|---|
| tenure | #1 (biggest overall) | large up (only 3 months) | about 0 (average tenure) |
| monthly charge | #2 | up (pricey plan) | small |
| support calls | #3 | up (calls often) | large up (7 calls) |

[KEY INSIGHT]
A feature at the top of the global ranking can contribute almost nothing to a particular prediction, and a mid-ranked feature can be the whole story for another. Global importance describes the model's habits; a local explanation describes one decision. Never quote the global ranking as the reason a specific customer was flagged.

=== step === quiz
::eyebrow Check yourself
## Reason about one prediction

Tenure is your churn model's most important feature globally. The model flags **Meera**, a four-year customer whose tenure is completely average. Her manager says: *tenure is the top feature, so tenure must be why she was flagged.* What is the right response?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- He is right: the globally most important feature always drives each prediction ::no That is the exact trap. Global importance is an average across customers; it does not fix the reason behind any one prediction.
- He is right only if Meera's tenure is above average ::no Direction aside, a globally important feature contributes little to a prediction when the customer is AVERAGE on it, which Meera is. Her tenure push is near zero.
- He is wrong: for an average-tenure customer tenure contributes little, so her flag comes from whatever pushed HER score up, read from a local explanation ::ok Exactly. Global rank and local contribution are different things. Meera is average on tenure, so it barely moves her score; only a local explanation of her row reveals the real reason, here a spike in support calls.

=== step === concept
::eyebrow Choosing
## Which explanation do you need?

Neither lens is better; they answer to different people and different decisions. Match the explanation to the question.

- **Reach for a global explanation** when the audience cares about the model as a whole: a product lead deciding what to fix, an auditor or regulator checking the model relies on sensible features, a data scientist choosing which inputs to monitor for drift. Global answers *is this model behaving reasonably, and on what?*
- **Reach for a local explanation** when a single decision has to be justified or acted on: telling a customer why they were denied (an adverse-action notice often legally has to be local), a rep deciding what to do for Ravi today, or you debugging one surprising prediction. Local answers *why this one, and what would change it?*

Often you want both: a global explanation to trust the model before you deploy it, and a local explanation every time it makes a call someone has to stand behind.

The next lessons deepen each lens. Lesson 2 makes global importance work for *any* model, not just linear ones, by permuting features. Lesson 3 computes the local contributions you saw here with SHAP. Later lessons turn the same tools on fairness and on documenting a model.

=== step === concept
::eyebrow Go deeper
## References

- [Molnar, Interpretable Machine Learning (free online book)](https://christophm.github.io/interpretable-ml-book/) - the standard free reference; its whole structure is organized around global versus local methods.
- ["Why Should I Trust You?", Ribeiro, Singh and Guestrin (2016), the LIME paper](https://arxiv.org/abs/1602.04938) - the work that popularized local, model-agnostic explanations of single predictions.
- [A Unified Approach to Interpreting Model Predictions, Lundberg and Lee (2017), the SHAP paper](https://arxiv.org/abs/1705.07874) - local contributions that sum exactly to the prediction, the method behind the waterfall here and Lesson 3.
- [Biecek and Burzykowski, Explanatory Model Analysis (free online book)](https://ema.drwhy.ai/) - a hands-on R walkthrough of both global and local explainers with the DALEX package.

=== step === complete
## Lesson 1 complete

You can now tell the two questions apart. A **global** explanation, like a feature-importance ranking, describes what the model learned across all data. A **local** explanation, like a per-feature contribution breakdown, describes why it made one prediction. They are computed differently, they answer to different people, and, as Meera showed, the global ranking is not a valid reason for an individual decision.

Next, Lesson 2: **Permutation and Drop-Column Importance.** Importance from coefficients only works for simple models. You will measure global importance for *any* model, including black boxes, by shuffling one feature at a time and watching accuracy fall, and you will see the ways that honest-looking method can quietly mislead you.
