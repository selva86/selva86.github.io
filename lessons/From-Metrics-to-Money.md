---
title: "Model Evaluation Lesson 7: From Metrics to Money"
catalog_blurb: "How to turn a metric gain into dollars and the decision it should drive."
description: "A better AUC is not a better business. Turn a churn model's score into money: price each outcome, set the threshold by cost, and read the profit, in R."
keywords: "cost-sensitive threshold, expected value, cost-benefit matrix, break-even threshold, model business value, profit curve, AUC, ROC, churn, R"
post_type: "LESSON"
curriculum_id: "6.70.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "7"
course_total: "7"
course_landing: "R-Model-Evaluation-Course.html"
course_next: ""
course_prev: "Comparing-Models-Statistically.html"
---

=== step === cover
::eyebrow Lesson 7 of 7
## From Metrics to Money

In Lesson 6 you learned to tell a real metric difference between two models from the ordinary luck of a single split. So now you can say, with a straight face, that your new model is genuinely better.

Here is where that runs into a wall. Maya runs customer retention at FreshBox, a meal-kit company. Her data scientist just shipped a churn model with an AUC of **0.83**, a real, tested improvement over the old one. Maya's boss asks a simpler question: "Good. How many dollars a month is that worth?" The AUC is not an answer to that question. Nothing on the metrics dashboard is.

This lesson builds the bridge from a score to a number in dollars.

By the end you will be able to:

- Put a dollar value on each cell of a confusion matrix, and write a model's profit as one formula
- Set the decision threshold from the costs, and see why 0.5 is almost always the wrong line to draw
- Say what a metric gain is actually worth, and why a bigger AUC is not automatically more money

**Prerequisites:** you can run R and write a small function, and from [Lesson 5](Scoring-Rules-and-Regression-Metrics.html) you have met the confusion matrix, the ROC curve and AUC.

::widget process-flow {"steps":[{"title":"Score","sub":"the model gives each customer a churn probability"},{"title":"Price each outcome","sub":"attach a dollar value to a save, a wasted offer, a miss"},{"title":"Set the threshold by cost","sub":"contact everyone above break-even, not above 0.5"},{"title":"Read the profit","sub":"add up the dollars the policy earns"}]}

=== step === concept
::eyebrow The idea
## A prediction is only worth what it changes

A churn score sitting in a database earns nothing. It becomes worth something only when it triggers an **action**. At FreshBox that action is concrete: for every customer the model flags as likely to churn, Maya's team sends an **$8 retention offer** (a discount coupon). If the customer really was about to leave and the offer wins them back, FreshBox keeps a customer worth **$120** in future profit. If the customer was never going to leave, the $8 is simply wasted.

So each customer falls into one of four outcomes, the same four cells of the confusion matrix you already know, but now each cell is worth a different amount of money. Slide the threshold on the classifier below and watch those four counts move; that is the machine we are about to price.

::widget roc-curve {}

Here is the price tag on each cell, measured against the alternative of **running no offers at all**:

| Outcome | What happens | Dollar value |
|---|---|---|
| Save (true positive) | offer a real churner, win them back | +$112 |
| Waste (false positive) | offer a customer who would have stayed | -$8 |
| Miss (false negative) | a real churner you never contacted | $0 |
| Correct pass (true negative) | a loyal customer you left alone | $0 |

The two zeros surprise people, so let us be exact about them. We measure every cell against doing nothing. If we run no offers, the churner leaves anyway, so **failing** to contact one (a miss) changes nothing versus that baseline: $0. Likewise, correctly leaving a loyal customer alone costs and earns nothing: $0. The program only ever makes or loses money in the top row, when it **acts**: a save earns \(+\$112\) (the \$120 kept minus the \$8 offer), a wasted offer costs \(-\$8\).

That gives the whole program's profit as one clean formula. With \(b = 112\) the benefit of a save and \(c = 8\) the cost of a wasted offer:

\[ \Pi = b \cdot \mathrm{TP} - c \cdot \mathrm{FP} \]

where \(\mathrm{TP}\) (true positives) is the number of real churners you contacted and \(\mathrm{FP}\) (false positives) is the number of stayers you contacted. Every dollar the model is worth lives in that single line.

Let us set up FreshBox's month and price today's policy. Each lesson runs in a fresh R session, so we build everything inline (run this once):

```r
# FreshBox: this month's 2000 at-risk customers, each scored by the churn model.
# We spread them evenly across the risk range the model assigns (from near 0 up to
# about 30%). That keeps the arithmetic exact; the conclusion does not depend on the shape.
n <- 2000
p_churn <- 0.30 * (seq_len(n) - 0.5) / n   # each customer's predicted churn probability

# What each decision is worth in dollars, versus running no offers at all:
save_value <- 112   # contact a real churner and win them back: keep a $120 customer for an $8 offer
waste_cost <- 8     # contact someone who would have stayed: the $8 offer is wasted

# Profit of offering to everyone the model scores above a threshold t.
# A contacted customer is worth +112 with probability p (a save) and -8 with prob 1 - p (a waste).
profit <- function(t) {
  p <- p_churn[p_churn > t]
  sum(save_value * p - waste_cost * (1 - p))
}

profit(0.5)   # today's rule: send the offer only to scores above 0.5
#> [1] 0
```

Read that last line and sit with it. Today's perfectly reasonable-sounding rule, "act on customers who are *more likely than not* to churn," earns FreshBox exactly **$0**, because in a given month no customer is more than about 30% likely to cancel, so the offer never goes out. A model that is never acted on is worth nothing, no matter how good its AUC.

=== step === concept
::eyebrow The twist
## Why 0.5 is the wrong line to draw

The fix is not a better model. It is a better **threshold**, and the right threshold falls straight out of the costs. Ask the only question that matters for a single customer with churn probability \(p\): is sending them the offer worth it *on average*? Contacting them is worth \(+b\) if they were going to churn (probability \(p\)) and \(-c\) if they were not (probability \(1 - p\)). So the expected value of the offer is

\[ \mathrm{EV}_{\text{offer}}(p) = p \cdot b - (1 - p) \cdot c \]

Send the offer whenever that is positive. Setting \(\mathrm{EV}_{\text{offer}}(p) > 0\) and solving for \(p\) gives the tipping point, the **break-even threshold**:

\[ p \cdot b > (1 - p) \cdot c \quad\Longrightarrow\quad p^{*} = \frac{c}{b + c} = \frac{8}{112 + 8} \approx 0.067 \]

Contact anyone the model scores above about **6.7%**, not 50%. The cheaper the action and the more valuable the save, the lower this line drops. Sweep the threshold across the whole range and the profit traces a hill that peaks exactly at \(p^{*}\), then falls away on both sides, collapsing to $0 once the threshold climbs past the highest score in the book.

::widget chart-plotter {"data":[{"x":0,"y":20000},{"x":0.05,"y":21666},{"x":0.067,"y":21778},{"x":0.1,"y":21332},{"x":0.15,"y":19000},{"x":0.2,"y":14672},{"x":0.25,"y":8326},{"x":0.3,"y":0},{"x":0.4,"y":0},{"x":0.5,"y":0}],"geoms":["line","point"],"x":"threshold","y":"profit"}

Now put real dollars on three policies: offer to everyone, offer at today's 0.5 cutoff, and offer at the cost-based threshold.

```r
# Three policies, priced. (offer_all = contact everyone; cutoff_50 = today's rule;
# cost_based = contact everyone above the break-even threshold 8/120.)
round(c(offer_all  = profit(0),
        cutoff_50  = profit(0.5),
        cost_based = profit(8 / 120)))
#> offer_all  cutoff_50 cost_based
#>     20000          0      21778

# The break-even threshold itself: contact iff p*112 - (1 - p)*8 > 0, i.e. p > 8/(112 + 8)
waste_cost / (save_value + waste_cost)
#> [1] 0.06666667
```

The story is stark. Today's 0.5 rule earns **$0**. Blanket-offering to everyone earns about **$20,000** a month, better, but it wastes an $8 coupon on thousands of loyal customers. The cost-based threshold earns about **$21,800**, roughly **$2,000 more every month**, about **$24,000 a year**, from a single line of arithmetic and not one change to the model.

[KEY INSIGHT]
The best threshold is set by the costs, not by the number 0.5. When a false negative and a false positive cost the same, the break-even is 0.5 and the default is right. The whole discipline is to CHECK the ratio, \(c / (b + c)\), rather than assume it.

=== step === quiz
::eyebrow Check yourself
## Would lowering the cutoff make more money?

FreshBox's team currently sends the offer only to customers scored above 0.5, and the retention program is barely worth running. An analyst proposes dropping the cutoff to about 0.07. Why might that make *more* money, not less?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- An $8 offer that rescues a $120 customer is worth sending to anyone even slightly likely to churn: break-even is 8/120, about 7%, so every customer above ~7% is profitable to contact, and the 0.5 cutoff was leaving nearly all of them out ::ok Exactly. The action is cheap and the save is valuable, so the profitable threshold sits far below 0.5. Moving the line from 0.5 to 0.07 is what turns a dead program into a real one, with no change to the model.
- It cannot: a lower cutoff always means more offers wasted on stayers, so profit must fall ::no More false positives, yes, but each wasted offer costs only $8 while each extra save earns $112. As long as the customers you newly contact are above the 7% break-even, the saves more than pay for the wasted coupons.
- Only if the model's AUC improves; the threshold by itself cannot change the profit ::no The threshold changes WHO you act on, which changes the true and false positives directly, which changes the profit, all with the same model and the same AUC. That is the entire point of this lesson.

=== step === tryit
::eyebrow Your turn
## Find the break-even threshold

The break-even threshold is the cost of a wasted offer divided by the total swing between a save and a waste: \(p^{*} = c / (b + c)\). Fill in the blank with that expression, then check it. (`save_value` is \(b\), `waste_cost` is \(c\).)

```r
save_value <- 112   # benefit of a save
waste_cost <- 8     # cost of a wasted offer
break_even <- ____
round(break_even, 3)   # contact everyone the model scores above this
```
::check {"regex":"waste_cost\\s*/\\s*\\(\\s*save_value\\s*\\+\\s*waste_cost\\s*\\)|8\\s*/\\s*(120|\\(\\s*112\\s*\\+\\s*8\\s*\\))","gate":true,"difficulty":"beginner","ok":"That is it: 8 / (112 + 8) = 8/120 = 0.067. Contact anyone the model scores above about 7% churn risk.","no":"The break-even is the waste cost over the total swing: waste_cost / (save_value + waste_cost)."}
::solution
```r
save_value <- 112
waste_cost <- 8
break_even <- waste_cost / (save_value + waste_cost)
round(break_even, 3)
#> [1] 0.067
```

=== step === concept
::eyebrow A common trap
## A better AUC is not automatically more money

So Maya's model has an AUC of 0.83 and the old one had 0.80. Is the new one worth more money? Not necessarily, and seeing why is what separates a metric from a decision.

AUC measures one thing: how well the model **ranks** churners above stayers, averaged over *every* possible threshold. It is deliberately threshold-free. Slide the threshold on the curve below and the operating point walks up and down, but the AUC printed in the corner never moves a millimetre.

::widget roc-curve {}

Money is not threshold-free. It is made at **one** operating point (your cost-based cutoff), on a specific **volume** of customers, with specific **costs**. Three consequences follow:

- A ranking gain only pays if it adds true positives *near the threshold you actually use*. Extra separation out in a region you never operate in is worth nothing.
- Even a tiny AUC gain can be worth a fortune if it lands at your operating point and your volume is large.
- AUC is blind to **calibration** (whether a 0.1 really means 10%), yet the cost-based threshold *depends* on calibration. Chasing AUC can even break the very number the threshold rule needs. This is why Lesson 5's proper scores matter here.

So the honest way to value a ranking gain is to translate it into extra saves at your operating point, then multiply by the value of a save and the monthly volume.

```r
# Suppose the better model catches 40 more real churners each month at the SAME
# false-alarm rate, when both are used at Maya's cost-based cutoff.
extra_saves <- 40
round(c(per_month = extra_saves * save_value,
        per_year  = extra_saves * save_value * 12))
#> per_month  per_year
#>      4480     53760
```

[WARNING]
A 0.03 AUC bump is not "3% more profit." It is worth whatever extra true positives it buys at your operating point, times the value per save, times your volume, and that could be $54,000 a year or close to nothing. Always convert a metric gain into dollars before you celebrate it.

=== step === quiz
::eyebrow Check yourself
## What is the AUC bump worth?

Maya's team upgrades the churn model and its AUC rises from 0.80 to 0.83. The boss asks how much extra profit to expect. What is the honest answer?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It depends: translate the ranking gain into extra true positives at your cost-based operating point, then multiply by the value of a save and the monthly volume. A 0.03 AUC gain can be worth a lot or almost nothing ::ok Right. AUC summarises ranking across all thresholds; profit is earned at one threshold on a real volume with real costs. You have to convert the gain into dollars at the point you actually operate.
- About 3% more profit, since the AUC rose by about 0.03 ::no AUC is not measured in the same units as profit, and a 0.03 rise in a ranking summary does not translate into 3% more money. The extra separation has to land near your operating point to pay at all.
- Nothing changes: AUC is only a ranking metric, so profit cannot move ::no That overcorrects. A better ranking usually does let you catch more real churners at the same false-alarm rate, which is worth real money. It just is not guaranteed, and never equal to the AUC delta.

=== step === concept
::eyebrow The method
## The same recipe on any decision

Nothing here was special to churn. Any time a model drives a decision with unequal costs, the same four steps turn its score into money. This is the reusable bridge; keep it.

::widget process-flow {"steps":[{"title":"Score and calibrate","sub":"a probability per case, and check it means what it says"},{"title":"Fill the cost-benefit matrix","sub":"a dollar value for each of the four outcomes"},{"title":"Threshold at c / (b + c)","sub":"here 8 / 120, about 7%, not 0.5"},{"title":"Multiply by volume","sub":"expected profit per period is the bottom line"}]}

A fraud model, a loan approval, a medical screen, a marketing send: swap in that decision's costs and the recipe is unchanged. Two honest cautions before you ship it:

- The break-even threshold trusts the model's probabilities. If they are not **calibrated** (a 0.1 that does not mean 10%), fix that first, or the cost-based cutoff aims at the wrong place.
- Your costs are estimates. Re-run the profit at a few plausible values for \(b\) and \(c\); if the best policy barely moves, you can act with confidence, and if it swings wildly, you have learned that the costs are what you should go measure next.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Provost & Fawcett, Data Science for Business (2013)](https://data-science-for-biz.com/) - the definitive treatment of expected-value framing, cost-benefit matrices and profit curves; the source of the approach used here.
- [Elkan (2001), The Foundations of Cost-Sensitive Learning (IJCAI)](https://cseweb.ucsd.edu/~elkan/rescale.pdf) - the short, readable proof that the optimal decision threshold is set by the cost ratio.
- [Vickers & Elkin (2006), Decision Curve Analysis, Medical Decision Making](https://doi.org/10.1177/0272989X06295361) - net benefit versus threshold, the same idea applied to real clinical decisions.
- [probably: post-processing and threshold selection (tidymodels)](https://probably.tidymodels.org/) - choose and evaluate a cost-based cutoff in R, rather than by hand.

=== step === complete
## Course complete

You built the last piece the others were missing. Lesson 5 gave you a metric that matches your decision; Lesson 6 let you trust a metric difference over the luck of a split; and now you can turn that trustworthy difference into dollars: price each outcome, set the threshold from the costs, read the profit, and value a metric gain in money rather than in points.

That is the whole arc of Model Evaluation and Tuning: resample honestly, tune deliberately, score with the right rule, compare with real uncertainty, and translate the result into a business decision.

Model Evaluation and Tuning is one of the graded modules in the Data Scientist track. Pass the assessment and it goes on your verified certificate, with a portfolio build to match.
