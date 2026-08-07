---
title: "Interaction Terms in Peer Review"
slug: Interaction-Terms-in-Peer-Review
description: "A reviewer says you claimed an interaction without testing the interaction term. Fit the cross term, test it directly in one model, then word your reply."
keywords: "claimed an interaction without testing the interaction term, interaction not tested reviewer, test the interaction term, subgroup analysis instead of interaction, moderation not tested peer review, difference between significant and not significant, interaction term p-value"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 59
auto_link_terms: test the interaction term|interaction was not tested|claimed an interaction|difference in significance|interaction term|subgroup analysis instead of interaction|reviewer says interaction not tested
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">An interaction claim says the effect of one variable depends on the level of another, and the reviewer's point is that a claim about a difference has to be tested as a difference. Running the model separately in each subgroup and noticing the effect is significant in one but not the other does not test it, because a gap between a significant result and a non-significant one can open up even when the two effects are the same size. The test the reviewer wants is the interaction term itself, fitted in one model, with its own p-value.</p>

## What the reviewer wrote

> The authors conclude that the association is present in men but not in women. It would strengthen the paper to formally test the sex-by-exposure interaction rather than relying on two separate models.

> You cannot claim the effect differs between groups without testing the interaction. Please report the interaction term and its p-value.

> The manuscript is a valuable contribution and the cohort is well characterised, so I have only minor points. On page 11 the effect is described as significant in the treatment arm and non-significant among controls, and the Discussion reads this as evidence of moderation. I was left wondering whether the interaction term was actually fitted, since two subgroup analyses on their own do not establish that the effects differ.

## What they actually mean

The reviewer is asking for one specific number: the coefficient on the product of the two variables, tested in a single model. When you fit the model separately within each subgroup and report that the effect is significant in one and not the other, you have described the two effects but you have not compared them. The comparison the claim rests on is the interaction, which either has a small p-value or it does not. A common misreading is to think the reviewer doubts the effect exists at all. The doubt is narrower: it is about whether the effect differs across the groups you say it differs across.

## Why they are asking

The failure mode here is specific and well documented. Two effects can look different only because one landed on its side of the 0.05 line and the other did not, even when the effects themselves are identical to within noise, since the boundary is a convention and a small difference in precision is enough to push one estimate across it (Gelman and Stern, 2006). A moderation claim built on that contrast is a claim about nothing, and when the interaction is finally fitted it often comes back non-significant. Nieuwenhuis and colleagues went through a year of neuroscience papers and found that of those that could have made this error, about half did, comparing two effects by their significance rather than testing the difference between them (Nieuwenhuis, Forstmann and Wagenmakers, 2011). Interaction tests also carry much less power than the main effects they qualify, because the interaction is estimated from the difference between subgroup slopes rather than from the pooled data, so a study that comfortably detected an effect is usually too small to detect a change in it. The mechanics of adding and reading an interaction are covered in [Interaction Effects in R](/Interaction-Effects-in-R.html); what a reviewer needs here is the decision and the defence, not the method again.

## How to check it

The check is to put both variables and their product in one model, then read the p-value on the product term. The `mtcars` data let you ask whether the effect of weight on fuel economy depends on the transmission, coded `am` as 0 for automatic and 1 for manual. The `*` operator enters weight, transmission and their interaction together.

```r
fit <- lm(mpg ~ wt * am, data = mtcars)
round(coef(summary(fit)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  31.4161     3.0201 10.4023   0.0000
#> wt           -3.7859     0.7856 -4.8188   0.0000
#> am           14.8784     4.2640  3.4893   0.0016
#> wt:am        -5.2984     1.4447 -3.6674   0.0010
```

The `wt:am` row is the interaction, and its p-value of 0.0010 is the test the reviewer asked for. It says the weight slope is 5.30 units more negative for manual cars than for automatic ones, and a gap that large is unlikely if weight acted the same way in both. If you would rather test it as a comparison of two models, the nested F-test gives the identical answer.

```r
anova(lm(mpg ~ wt + am, data = mtcars), fit)
#> Analysis of Variance Table
#>
#> Model 1: mpg ~ wt + am
#> Model 2: mpg ~ wt * am
#>   Res.Df    RSS Df Sum of Sq     F   Pr(>F)
#> 1     29 278.32
#> 2     28 188.01  1    90.312 13.45 0.001017 **
```

The F-test returns p = 0.001017, the same value as the coefficient's t-test, because a single-degree-of-freedom term is tested the same way whichever route you take. An interaction p-value has no special threshold; it is judged against the same 0.05 you would use for any coefficient, with the same caveat that the line is a convention and not a law of nature.

## What to do about it

### You are fine

You are fine when the interaction term is already in the model and already tested, and the reviewer has simply missed it in a crowded table. The remedy is to point at the row and quote the interval around it, which the weight-by-transmission model above hands you directly.

```r
round(confint(fit)["wt:am", ], 4)
#>   2.5 %  97.5 %
#> -8.2577 -2.3390
```

The interval runs from -8.26 to -2.34, so it stays clear of zero across its whole range, and reporting it beside the coefficient answers the objection with the exact quantity the reviewer wanted. When your interaction is genuinely fitted and reported, the reply is a pointer to the relevant table rather than a new analysis, and it helps to make that row easy to find so the next reader does not raise the same point.

### It is fixable

The fixable case is the common one, where you have the data to test the interaction but you presented two subgroup analyses instead of the cross term. Take the effect of dose on tooth length in the `ToothGrowth` data, fitted once for orange juice and once for ascorbic acid.

```r
oj <- lm(len ~ dose, data = subset(ToothGrowth, supp == "OJ"))
vc <- lm(len ~ dose, data = subset(ToothGrowth, supp == "VC"))
c(OJ_slope = round(coef(oj)[["dose"]], 4), VC_slope = round(coef(vc)[["dose"]], 4))
#> OJ_slope VC_slope
#>   7.8114  11.7157
```

The dose slope is 7.81 under orange juice and 11.72 under ascorbic acid, and it is tempting to report those two numbers and call the supplement a moderator. The fix is to fit them in one model so that the interaction term carries the comparison.

```r
tg <- lm(len ~ supp * dose, data = ToothGrowth)
round(coef(summary(tg))["suppVC:dose", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|)
#>     3.9043     1.6906     2.3094     0.0246
```

The interaction coefficient is 3.9043, which is exactly the gap between the two subgroup slopes, 11.7157 minus 7.8114, except that now it has a standard error and a p-value of 0.0246. The two separate regressions gave two slopes and no test of whether they differ; the single model gives their difference and tests it. Here the difference is real, so the moderation claim survives, and it survives on a number the reviewer can check rather than on an eyeballed contrast between two panels.

### It is a real problem

The real problem is the case where you fit the interaction and it is not there, so the difference you reported across subgroups was the artefact the reviewer suspected. In `mtcars`, quarter-mile time falls with horsepower among V-engined cars but not among straight-engined ones, coded `vs` as 0 and 1.

```r
vengine  <- lm(qsec ~ hp, data = subset(mtcars, vs == 0))
straight <- lm(qsec ~ hp, data = subset(mtcars, vs == 1))
ix       <- lm(qsec ~ hp * vs, data = mtcars)
c(V_engine_p    = round(coef(summary(vengine))["hp", 4], 4),
  straight_p    = round(coef(summary(straight))["hp", 4], 4),
  interaction_p = round(coef(summary(ix))["hp:vs", 4], 4))
#>    V_engine_p    straight_p interaction_p
#>        0.0316        0.5387        0.9565
```

Horsepower predicts quarter-mile time in the V-engine cars at p = 0.0316 and not in the straight-engine cars at p = 0.5387, which reads like moderation until you fit the interaction and its p-value comes back at 0.9565. The two slopes cannot be told apart. All that separated them was which side of 0.05 each subgroup happened to land on. The honest response is to drop the moderation claim and report the pooled effect of horsepower, and where the interaction still matters to the question, to say the study was not powered to detect one and leave it for a larger sample. Reporting the contrast as a finding would mean publishing a difference the data do not contain.

## How to word your response

### If you are fine

> The reviewer asks us to test the interaction rather than rely on separate subgroup models. The interaction term is in fact included in the model in Table 2: the weight-by-transmission coefficient is -5.30 (95% CI -8.26 to -2.34, p = 0.001), which is the formal test of whether the weight effect differs by transmission. We have highlighted this row and added the confidence interval so the test is easier to locate (Results, page X). The conclusion is unchanged.

### If it was fixable

> We thank the reviewer for this point. We had reported the dose effect separately within each supplement, which describes the two slopes but does not test whether they differ. We have refitted a single model with the supplement-by-dose interaction, which estimates that difference directly at 3.90 units (p = 0.025), so the moderation we described now rests on a formal test rather than on a comparison of two subgroup analyses. The interaction term and its test appear in the revised Table 3 (Results, page X). Our conclusion is unchanged, but its basis is now the interaction itself.

### If it is a real problem

> The reviewer is right that we compared subgroups without testing the interaction. On fitting it, the interaction is not significant (p = 0.96) and the two subgroup slopes are statistically indistinguishable, so the apparent difference reflected only which subgroup crossed the significance threshold. We have removed the claim that the effect is moderated and now report the pooled effect instead (Results, page X). We have also added a limitation noting that the study was not powered to detect an interaction of this size, so we cannot rule one out; we can only report that our data do not support it.

## Practice

A reviewer writes: *"You report that rear axle ratio predicts fuel economy in automatic cars but not in manual cars, and conclude the relationship depends on the transmission. Did you test that interaction?"* You have the `mtcars` data, so you check before you answer. Automatic is `am == 0` and manual is `am == 1`.

```r
ex_auto   <- lm(mpg ~ drat, data = subset(mtcars, am == 0))
ex_manual <- lm(mpg ~ drat, data = subset(mtcars, am == 1))
ex_ix     <- lm(mpg ~ drat * am, data = mtcars)
c(automatic_p   = round(coef(summary(ex_auto))["drat", 4], 4),
  manual_p      = round(coef(summary(ex_manual))["drat", 4], 4),
  interaction_p = round(coef(summary(ex_ix))["drat:am", 4], 4))
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

Run it and rear axle ratio predicts fuel economy among automatics at p = 0.0432 and not among manuals at p = 0.1050, exactly the split the reviewer describes, so the obvious reading is that the transmission moderates the effect. The obvious reading is wrong: the interaction term returns p = 0.4538, nowhere near significant, so the two slopes cannot be distinguished and the difference in significance was an accident of the 0.05 boundary rather than evidence of moderation. This is the real-problem outcome. The correct response is to drop the claim that the axle-ratio effect depends on transmission, report the main effect of rear axle ratio across all cars, and state that the sample was too small to test the interaction with any power. Reporting the significant subgroup and the non-significant one as though the contrast between them were itself a finding is the exact error the reviewer is guarding against.

</details>
