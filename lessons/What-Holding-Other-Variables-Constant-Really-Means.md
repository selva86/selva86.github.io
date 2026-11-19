---
title: "Linear Regression, Properly Lesson 1: What holding other variables constant really means"
catalog_blurb: "Why a regression coefficient changes sign when you add a correlated predictor."
description: "A gym's 12 members: classes alone predicts lower satisfaction, but holding tenure constant flips the sign. What holding a variable constant really computes."
keywords: "multiple regression, holding other variables constant, partial regression coefficient, omitted variable bias, Simpson's paradox, confounding variable, residual regression, Frisch-Waugh-Lovell theorem, lm, R"
post_type: "LESSON"
curriculum_id: "4.60.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-linear-models"
course_title: "Linear Regression, Properly"
course_lesson: "1"
course_total: "8"
course_landing: "Linear-Regression-Properly-Course.html"
course_next: "The-Five-Assumptions-Ranked-by-What-They-Cost.html"
course_prev: ""
---

=== step === cover
## What holding other variables constant really means

Today let's understand what it actually means when someone says a regression result "holds another variable constant," using a small gym's own membership numbers.

A gym tracks 12 of its members: how many months each one has been a member, how many classes a week they attend, and a satisfaction score from 1 to 5.

Here are those 12 members, classes a week against satisfaction score.

::widget chart-plotter {"data": [{"x": 6, "y": 1.18}, {"x": 6, "y": 1.16}, {"x": 5, "y": 1.39}, {"x": 5, "y": 1.43}, {"x": 4, "y": 1.68}, {"x": 4, "y": 1.85}, {"x": 3, "y": 2.02}, {"x": 3, "y": 2.54}, {"x": 2, "y": 2.78}, {"x": 2, "y": 3.42}, {"x": 1, "y": 3.48}, {"x": 1, "y": 4.30}], "geoms": ["point"], "x": "classes", "y": "satisfaction"}

The points drift down and to the right. Members who attend more classes a week tend to report a lower satisfaction score, and members who attend fewer classes tend to report a higher one.

=== step === concept
## The naive regression: more classes, lower satisfaction

Classes and satisfaction look tied together, and the first question to ask is how strongly. Fitting a straight line through the 12 points puts a number on it.

```r
# Create the gym's 12-member data, then measure how strongly classes and satisfaction move together
gym_data <- data.frame(
  tenure = c(2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24),
  classes = c(6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1),
  satisfaction = c(1.18, 1.16, 1.39, 1.43, 1.68, 1.85, 2.02, 2.54, 2.78, 3.42, 3.48, 4.30)
)

cor(gym_data$classes, gym_data$satisfaction)
#> [1] -0.9469379

fit_naive <- lm(satisfaction ~ classes, data = gym_data)
coef(fit_naive)
#> (Intercept)     classes 
#>   4.1876667  -0.5481429 

summary(fit_naive)
#> 
#> Call:
#> lm(formula = satisfaction ~ classes, data = gym_data)
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -0.52324 -0.19749 -0.03695  0.26619  0.66048 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  4.18767    0.22913  18.276 5.17e-09 ***
#> classes     -0.54814    0.05884  -9.317 3.03e-06 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 0.3481 on 10 degrees of freedom
#> Multiple R-squared:  0.8967,	Adjusted R-squared:  0.8864 
#> F-statistic:  86.8 on 1 and 10 DF,  p-value: 3.03e-06
```

The correlation between classes and satisfaction comes out to -0.9469379, close to the strongest negative correlation two variables can have. Fitting a line through the 12 points with `lm()` gives an intercept of 4.188 and a classes coefficient of -0.548. Read that coefficient as: each extra class a week goes with about 0.55 points LESS on the satisfaction score.

The Residuals rows near the top of the summary are the 12 gaps between what the line predicts for each member and what that member actually reported. R-squared comes out to 0.8967: this one straight line already explains close to 90% of how satisfaction varies across these 12 members.

So the naive finding is simple: members who attend more classes a week report lower satisfaction. Taken at face value, running more classes would be working against the gym's own satisfaction scores.

=== step === widget
## Fitting the naive line by hand

`lm()` did not find that line by magic. It searched for the slope and intercept that make one number as small as possible: the sum of squared errors, the total of every point's squared vertical distance from the line.

Drag the sliders below to shrink that sum yourself, then press Snap to least squares to check your answer against `lm()`'s.

::widget ols-fit {"points": [{"x": 6, "y": 1.18}, {"x": 6, "y": 1.16}, {"x": 5, "y": 1.39}, {"x": 5, "y": 1.43}, {"x": 4, "y": 1.68}, {"x": 4, "y": 1.85}, {"x": 3, "y": 2.02}, {"x": 3, "y": 2.54}, {"x": 2, "y": 2.78}, {"x": 2, "y": 3.42}, {"x": 1, "y": 3.48}, {"x": 1, "y": 4.30}]}

The smallest possible sum of squared errors for these 12 points is 1.211571, at a slope of -0.5481429 and an intercept of 4.1876667, the same answer `lm()` already gave. "Least squares" is just this: the line that makes the sum of squared distances between the line and every point as small as it can possibly get.

=== step === concept
## The variable missing from the picture: tenure

Classes a week is not the only thing that differs between these 12 members. Each one also has a tenure: how many months they have been a member. Printing the full table shows all three numbers side by side.

```r
# Print the full table: tenure, classes and satisfaction, side by side
gym_data
#>    tenure classes satisfaction
#> 1       2       6         1.18
#> 2       3       6         1.16
#> 3       4       5         1.39
#> 4       5       5         1.43
#> 5       6       4         1.68
#> 6       8       4         1.85
#> 7      10       3         2.02
#> 8      12       3         2.54
#> 9      15       2         2.78
#> 10     18       2         3.42
#> 11     20       1         3.48
#> 12     24       1         4.30
```

Look down the tenure column. The members with only 2 or 3 months of tenure attend 6 classes a week. The members with 20 or 24 months of tenure attend just 1. Tenure and classes are moving together, in opposite directions.

That matters, because tenure could explain satisfaction on its own, with classes just along for the ride. A member two years in has likely already settled into a routine that suits them. A member two months in is still finding their footing, still comparing the gym to other options, and still showing up to every class to get their money's worth.

So there are three variables worth looking at together: classes, tenure, and satisfaction. Before deciding what classes alone is doing to satisfaction, it helps to see how all three correlate with each other at once.

The heatmap below shows the correlation between every pair of these three variables.

::widget correlation-heatmap {"vars": ["classes", "tenure", "satisfaction"], "data": {"classes": [6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1], "tenure": [2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24], "satisfaction": [1.18, 1.16, 1.39, 1.43, 1.68, 1.85, 2.02, 2.54, 2.78, 3.42, 3.48, 4.3]}}

The heatmap rounds each correlation to two decimals. Classes and tenure read as -0.97. Tenure and satisfaction read as 1: their true correlation is 0.995, close enough that rounding pushes the display up to a flat 1. Classes and satisfaction read as -0.95, the same relationship that came out to -0.9469379 when `cor()` computed it directly.

Tenure moves tightly with both classes and satisfaction. That is exactly the setup where leaving tenure out of a regression can give a misleading answer: tenure has enough pull on both sides of the classes-satisfaction relationship to distort what classes alone appears to do.

=== step === concept
## Controlling for tenure: the coefficient on classes flips sign

So let's put tenure into the regression alongside classes, and see what happens to the classes coefficient.

```r
# Add tenure to the regression, and see what happens to the coefficient on classes
fit_full <- lm(satisfaction ~ classes + tenure, data = gym_data)
coef(fit_full)
#> (Intercept)     classes      tenure 
#>  0.03170682  0.12282913  0.17079287 

summary(fit_full)
#> 
#> Call:
#> lm(formula = satisfaction ~ classes + tenure, data = gym_data)
#> 
#> Residuals:
#>       Min        1Q    Median        3Q       Max 
#> -0.121060 -0.074393  0.003534  0.068706  0.132219 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  0.03171    0.37745   0.084   0.9349    
#> classes      0.12283    0.06221   1.974   0.0798 .  
#> tenure       0.17079    0.01530  11.166 1.42e-06 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 0.0952 on 9 degrees of freedom
#> Multiple R-squared:  0.993,	Adjusted R-squared:  0.9915 
#> F-statistic: 642.5 on 2 and 9 DF,  p-value: 1.952e-10
```

Adding tenure changes the story. The intercept is now 0.03170682, the classes coefficient is 0.12282913, and the tenure coefficient is 0.17079287. R-squared climbs to 0.993: with both variables in the model, it explains 99.3% of how satisfaction varies across the 12 members.

Look at the classes coefficient: it flipped from -0.548 to +0.123, positive now, not negative. Holding tenure fixed, meaning comparing members who have been at the gym for the same length of time, one more class a week now predicts 0.123 points MORE satisfaction, not less.

Nothing about the data changed. The 12 members are the same, their numbers are the same. What changed is the question being answered.

One regression asks what classes alone predicts about satisfaction, ignoring everything else. This one asks what classes predicts among members of about the same tenure. Those are two different questions, and they can have different answers, even opposite ones, on the exact same data.

=== step === quiz
## Quick check: why two different numbers

Here's the same pattern, in a different business. A retailer regresses profit per square foot on store size alone, and finds LOWER profit at larger stores. Puzzled, they add each store's city population to the regression, and the size coefficient flips to HIGHER profit at larger stores. Which statement about those two results is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- One of the two regressions must be wrong, since a coefficient cannot change sign depending on what else is in the model. ::no
- Both are right. One is the effect of size alone, ignoring population; the other is the effect of size among stores of similar population. ::ok Right. The first regression answers what store size alone predicts about profit per square foot, ignoring everything else. The second answers what size predicts among stores of about the same city population. Both numbers are correct answers to two different questions, and neither contradicts the other.
- Adding more variables always makes a regression more trustworthy, so only the second result should be trusted. ::no
- The sign change means the second regression violates one of its assumptions. ::no A coefficient's value depends on what else sits in the regression alongside it. Store size alone predicts lower profit per square foot because large stores tend to sit in less populated areas, where profit per square foot runs lower for reasons that have nothing to do with size itself. Once population is held fixed, size on its own predicts higher profit. Neither regression is broken, and no assumption needs to be violated for a sign to flip: adding a variable correlated with both the predictor and the outcome is enough on its own.

=== step === concept
## What "holding constant" means, in arithmetic

That regression held tenure fixed by including it directly in the model. There's another way to reach the exact same answer, using nothing but residuals.

Here's the idea. Regress classes on tenure, and keep the residuals.

Those residuals are the part of each member's classes-a-week number that tenure does not explain. Do the same thing for satisfaction: regress it on tenure, and keep those residuals too. What's left in each case, the classes-residual and the satisfaction-residual, has already had tenure's share subtracted out of it.

```r
# Regress classes on tenure and keep the residuals, then do the same for satisfaction on tenure
classes_resid <- resid(lm(classes ~ tenure, data = gym_data))
satisfaction_resid <- resid(lm(satisfaction ~ tenure, data = gym_data))

round(classes_resid, 3)
#>      1      2      3      4      5      6      7      8      9     10     11 
#>  0.461  0.699 -0.064  0.174 -0.589 -0.114 -0.639 -0.164 -0.451  0.262 -0.263 
#>     12 
#>  0.687 

round(satisfaction_resid, 3)
#>      1      2      3      4      5      6      7      8      9     10     11 
#>  0.126 -0.035  0.053 -0.048  0.060 -0.053 -0.167  0.070 -0.115  0.100 -0.123 
#>     12 
#>  0.131 
```

Take member 1: 2 months of tenure, 6 classes a week, a satisfaction score of 1.18. Their classes-residual is 0.461, meaning they attend about 0.461 MORE classes than a member with 2 months of tenure is typically predicted to attend. Their satisfaction-residual is 0.126, meaning their satisfaction score sits 0.126 points above what 2 months of tenure alone would predict.

Every one of the 12 members now has a pair of residuals like this, showing how that member's classes and satisfaction sit relative to other members at the same tenure, once tenure's own share has been removed from both.

=== step === widget
## Fitting the holding-tenure-constant line by hand

Now do the same search on a different pair of numbers: not classes and satisfaction, but the classes-residual and the satisfaction-residual you just computed for all 12 members.

Drag the sliders until the sum of squared errors on these 12 residual pairs is as small as it can get, then press Snap to check.

::widget ols-fit {"points": [{"x": 0.461, "y": 0.126}, {"x": 0.699, "y": -0.035}, {"x": -0.064, "y": 0.053}, {"x": 0.174, "y": -0.048}, {"x": -0.589, "y": 0.060}, {"x": -0.114, "y": -0.053}, {"x": -0.639, "y": -0.167}, {"x": -0.164, "y": 0.070}, {"x": -0.451, "y": -0.115}, {"x": 0.262, "y": 0.100}, {"x": -0.263, "y": -0.123}, {"x": 0.687, "y": 0.131}]}

The R code beneath the widget runs that same search with `lm()`, and its coefficient comes out to 0.1229719, essentially identical to the 0.123 you got for the classes coefficient in the full regression of satisfaction on both classes and tenure. The intercept prints as -7.308567e-05, R's scientific notation for -0.0000731, close enough to zero that only rounding keeps it from landing exactly there.

That match is not a coincidence. Regressing the residuals of one variable on the residuals of another, after both have had tenure's share subtracted out first, is literally what "holding tenure constant" computes. There is no separate meaning hiding behind the phrase. This arithmetic is the whole of it. A coefficient computed this way, with every other variable in the model held fixed, has its own name: a partial regression coefficient.

=== step === concept
## Simpson's paradox: when the sign change is the whole story
::prose-only the definition rests on the sign change already shown in the regression two steps up; no new visual is needed to see a coefficient cross zero

The classes coefficient didn't just get smaller when tenure entered the regression. It crossed zero, from -0.548 to +0.123. Negative became positive. That particular kind of flip has a name: Simpson's paradox.

Simpson's paradox is what happens when a relationship between two variables reverses once a confounder enters the regression. A confounder is a variable correlated with both the predictor and the outcome, strong enough to carry the whole reversal on its own. Tenure is the confounder here: it correlates at -0.966 with classes and at 0.995 with satisfaction, which is strong enough to flip the sign of the classes coefficient once it's added.

Not every change when you add a variable counts as Simpson's paradox. A coefficient that shrinks from -0.548 to, say, -0.300 still points the same direction; it's just a weaker signal doing the same job, and that is ordinary. What makes this one a true Simpson's paradox is that the sign itself flips. The number crosses zero.

=== step === concept
## Neither coefficient is wrong, they answer different questions
::prose-only restates the two coefficients from the regression two steps up as answers to two different questions; both numbers are already on the page

So which number is right, -0.548 or +0.123? Both are. They answer different questions.

-0.548 answers this: if all you know about a member is how many classes a week they attend, what does that predict about their satisfaction? Knowing nothing else, more classes goes with lower satisfaction, because the members who attend more classes also tend to be newer members, and newer members report lower satisfaction for reasons that have nothing to do with the classes themselves.

+0.123 answers a narrower question: among members who have been at the gym for the same length of time, what does one more class a week predict about satisfaction? Once tenure is held fixed, more classes goes with slightly higher satisfaction.

The risk is reporting -0.548 by itself and presenting it as the whole answer. A reader who saw only that number would conclude that classes hurt satisfaction, when the truth, once tenure is accounted for, points the other way.

=== step === quiz
## Quick check: naming the paradox

Here's one more case, from medicine this time. A hospital compares a newer treatment against an older one, and the newer treatment's raw recovery rate comes out LOWER. But once the hospital accounts for how severe each patient's case was, the newer treatment's recovery rate comes out HIGHER. It turns out the newer treatment was given mostly to the most severe cases. What's happening here, and does it count as Simpson's paradox?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- This is Simpson's paradox: severity correlates with both which treatment a patient received and how likely they are to recover, and the sign reverses once severity is held constant. ::ok Right. Severity ties to both which treatment a patient received, since the newer one went mostly to the most severe cases, and to recovery, since the most severe cases recover least often regardless of treatment. Holding severity fixed removes that confounding, and the sign flips from lower to higher. A sign crossing zero like that is exactly Simpson's paradox.
- This cannot be Simpson's paradox, since recovery rate is a raw proportion, not a regression coefficient. ::no
- The newer treatment simply does not work; the raw recovery rate is the one to trust. ::no
- The data must contain an error, since the two numbers contradict each other. ::no Simpson's paradox does not need a regression coefficient or an error in the data; it can show up in a raw rate just as easily. It happens whenever a variable correlated with both the grouping, here, which treatment a patient got, and the outcome, here, recovery, is left out. Here that variable is severity: the newer treatment went mostly to the most severe cases, which drags its raw recovery rate down until severity is held fixed.

=== step === tryit
## Your turn: recover a partial coefficient by hand

One more dataset, so you can run the whole trick yourself. Ten salespeople, each with years of experience, a number of accounts they manage, and their monthly sales in thousands of dollars.

```r
# sales_data holds 10 salespeople: years of experience, accounts managed, and monthly sales in thousands of dollars
sales_data <- data.frame(
  experience = c(1, 2, 3, 3, 4, 5, 6, 7, 8, 10),
  accounts = c(8, 11, 14, 16, 19, 23, 26, 30, 34, 40),
  sales = c(34.2, 42.9, 51.6, 53.8, 62.5, 72.3, 81.0, 90.8, 100.6, 118.0)
)

# The naive fit: sales predicted from accounts alone
fit_sales_naive <- lm(sales ~ accounts, data = sales_data)
coef(fit_sales_naive)
#> (Intercept)    accounts 
#>   13.886019    2.573936 

# Now recover the "holding experience constant" coefficient on accounts, the
# same way you just saw it done for the gym data. Compute accounts_resid as
# the residuals of accounts regressed on experience, sales_resid as the
# residuals of sales regressed on experience, then regress sales_resid on
# accounts_resid and check its slope.
# Three lines. Press Check when you have them.
```
::check {"regex": "resid[(]lm[(]\\s*accounts\\s*~\\s*experience[\\s\\S]*resid[(]lm[(]\\s*sales\\s*~\\s*experience[\\s\\S]*lm[(]\\s*sales_resid\\s*~\\s*accounts_resid", "gate": true, "difficulty": "intermediate", "ok": "Right: the slope is 1.1, matching lm(sales ~ accounts + experience)'s accounts coefficient exactly. Once experience is held constant, one more account managed predicts $1,100 more in monthly sales, not the $2,574 the naive fit alone suggested.", "no": "Regress accounts on experience and keep the residuals: accounts_resid <- resid(lm(accounts ~ experience, data = sales_data)). Do the same for sales on experience to get sales_resid. Then regress sales_resid on accounts_resid and read its slope."}
::solution
```r
# Regress accounts and sales on experience, keep both residuals, then regress one on the other
accounts_resid <- resid(lm(accounts ~ experience, data = sales_data))
sales_resid <- resid(lm(sales ~ experience, data = sales_data))

fit_sales_partial <- lm(sales_resid ~ accounts_resid)
round(coef(fit_sales_partial), 3)
#>    (Intercept) accounts_resid 
#>            0.0            1.1 
```

The naive coefficient, 2.573936, says one more account predicts $2,574 more in monthly sales, full stop. The partial coefficient, 1.1, says that once experience is held fixed, one more account predicts only $1,100 more. The gap between the two, about $1,474, is experience's own fingerprint on both accounts and sales.

=== step === concept
## References

- Frisch, R. and Waugh, F.V. (1933). "Partial Time Regressions as Compared with Individual Trends." Econometrica. The residual-regression result behind the classes-on-tenure, satisfaction-on-tenure computation in this lesson.
- Lovell, M.C. (1963). "Seasonal Adjustment of Economic Time Series and Multiple Regression." Journal of the American Statistical Association. The general form of the same partialling-out result, for any number of other predictors.
- Simpson, E.H. (1951). "The Interpretation of Interaction in Contingency Tables." Journal of the Royal Statistical Society, Series B. The original paper behind the paradox named in this lesson.
- Wooldridge, J.M. "Introductory Econometrics: A Modern Approach." Cengage. Omitted-variable bias and the mechanics of what changes when a correlated predictor is added to a regression.
- [lm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html) - R Core Team. Fits every regression in this lesson, from the naive classes-only model to the full classes-plus-tenure one.
- [coef() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/coef.html) - R Core Team. Pulls the intercept and coefficients out of each fitted model throughout this lesson.
- [cor() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html) - R Core Team. Computes the Pearson correlation between classes, tenure and satisfaction.

=== step === complete
## Summary: what holding a variable constant computes

A regression coefficient on one predictor depends on what else is sitting in the regression alongside it. Add a correlated predictor, and the first coefficient can change, sometimes by a little, sometimes enough to flip its sign.

"Holding a variable constant" is not a figure of speech. It means regressing that variable's share out of both the predictor and the outcome first, using residuals, and then regressing what's left of one against what's left of the other. Do that by hand on the gym's 12 members and you land on exactly the same number the full multiple regression gives.

When the sign crosses zero rather than merely shrinking or growing, that is Simpson's paradox: a confounder correlated with both the predictor and the outcome, strong enough to carry a full reversal. Classes alone predicted lower satisfaction. Classes among members of equal tenure predicted higher satisfaction.

Neither answer was wrong. They were answers to two different questions, and now you know how to tell which question you are actually asking.

Once a regression is answering the right question, the next thing worth checking is whether it was built on solid ground to begin with.
