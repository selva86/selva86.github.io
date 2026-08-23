---
title: "Multicollinearity: why your coefficients look wrong, and the fix"
slug: "Regression-Health-Mini-1"
description: "Two predictors that move together can flip a coefficient and hide a real effect. Measure the overlap with a VIF, then fix it without dropping a variable."
keywords: "multicollinearity, VIF in R, variance inflation factor, car vif, correlated predictors, collinearity, ridge regression, regression coefficients"
mathjax: true
webr: true
date: "2026-08-24"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "1"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.11"
lesson_access: "windowed"
catalog_blurb: "Why correlated predictors flip a coefficient, and how to fix it."
---

=== step === cover
::eyebrow Regression Health Check
## Multicollinearity: why your coefficients look wrong, and the fix

Today, we have a small horror story from regression.

You are predicting house prices from the floor area in square feet and the number of rooms. Both obviously matter, and you would happily bet money on both. So you fit the model, print the summary, and the coefficient next to rooms comes back negative. It says a house loses about 6,340 dollars for every extra room it has.

The p-value beside it is 0.46. Read literally, the model is telling you that the number of rooms has nothing to do with what a house sells for.

Nothing errored. No warning was printed. The R-squared is perfectly respectable.

What actually happened is that big houses have many rooms, so the two predictors move together, and the model cannot tell which one deserves the credit. That is multicollinearity. It catches people out because it never announces itself. It just hands you a number you would be embarrassed to put in a report.

The good news is that it takes one line to measure, and the repairs do not ask you to throw away a variable you know matters. To get there, we will do three things.

::widget process-flow {"steps":[{"title":"Watch the coefficient break","sub":"one model, three predictors, a room worth minus 6,340 dollars"},{"title":"Measure the overlap","sub":"build the VIF by hand, then read it off in one line"},{"title":"Repair it","sub":"four fixes, and what each one costs you"}]}

Everything after this is just doing it, on ninety houses whose true price rule we already know.

=== step === concept
## The ninety houses, and the price rule we already know

Before we can accuse a model of getting something wrong, we need to know what right looks like. Real sales data will never tell us that, because nobody knows what a room is really worth. So we are going to build ninety houses ourselves and set the rule by hand.

The rule is simple. Every square foot adds 110 dollars, every room adds 8,000 dollars, and every year of age takes 600 dollars off. Then we add a little noise on top, because no two houses with the same specification ever sell for exactly the same price.

One note on units before you run it. Price is measured in thousands of dollars, so 8,000 dollars a room appears in the code as 8, and 110 dollars a square foot appears as 0.110. The number of rooms is tied to the floor area, one room for roughly every 250 square feet, and that is the part that causes all the trouble.

Press Run.

```r
# Build 90 houses from a price rule we choose ourselves
set.seed(46)
sqft  <- round(rnorm(90, 2000, 350))            # floor area, square feet
rooms <- round(sqft / 250 + rnorm(90, 0, 0.2))  # roughly one room per 250 sq ft
age   <- round(runif(90, 2, 60))                # years since it was built

# price in thousands: 0.110 a square foot, 8 a room, 0.6 off per year of age
price <- round(55 + 0.110 * sqft + 8 * rooms - 0.6 * age + rnorm(90, 0, 26), 1)

homes <- data.frame(sqft, rooms, age, price)
head(homes)
#>   sqft rooms age price
#> 1 1685     6  38 283.6
#> 2 2074     8  36 363.8
#> 3 1745     7   8 324.0
#> 4 2432    10   4 348.5
#> 5 2409    10   4 411.7
#> 6 1782     7  30 291.7

rbind(lowest = sapply(homes, min), highest = sapply(homes, max))
#>         sqft rooms age price
#> lowest  1119     5   2 197.6
#> highest 2794    12  60 463.1
```

So the smallest house on the street is 1,119 square feet with five rooms, the largest is 2,794 square feet with twelve, and the prices run from 197.6 to 463.1 thousand dollars. That looks like an ordinary dataset, and it is the one we work with the rest of the way.

Hold on to three numbers: 0.110, 8 and 0.6. Every coefficient we look at from here has a correct answer sitting behind it. You never get that with real data, and it is exactly what we need to catch a model in the act.

=== step === concept
## The coefficient that comes back negative

Let's start where a real analysis would start, with each predictor on its own.

```r
# Price the houses on rooms alone, then on floor area alone
model_rooms <- lm(price ~ rooms, data = homes)
round(summary(model_rooms)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  56.6305    20.9807  2.6992   0.0083
#> rooms        33.1307     2.5683 12.8998   0.0000

model_sqft <- lm(price ~ sqft, data = homes)
round(summary(model_sqft)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2259    19.8922  1.8714   0.0646
#> sqft          0.1428     0.0098 14.5829   0.0000
```

Both predictors look excellent. A room is worth 33.13 thousand dollars with a t of 12.9, and a square foot is worth 143 dollars with a t of 14.6. Neither p-value is anywhere near 0.05, and if you had to defend either variable in a meeting you would have no trouble at all.

Now put them in the same model, along with the age of the house.

```r
# Price the houses on all three predictors at once
model_both <- lm(price ~ sqft + rooms + age, data = homes)
round(summary(model_both)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  67.3545    19.1602  3.5153   0.0007
#> sqft          0.1648     0.0354  4.6547   0.0000
#> rooms        -6.3390     8.5540 -0.7411   0.4607
#> age          -0.8192     0.1780 -4.6026   0.0000
```

There it is. Three things happened at once, and each one is worth naming.

1. The rooms coefficient went from plus 33.13 to minus 6.34. It changed sign, and now says a house loses about 6,340 dollars for every extra room.
2. Its standard error went from 2.57 to 8.55, more than three times wider. That is why the p-value is 0.4607, and why a reader would strike rooms out of the model.
3. The floor area coefficient moved too. We built these houses at 0.110 a square foot, and the model now charges 0.1648, which is 165 dollars a square foot for houses we priced at 110.

Read that last one again, because it is the part people miss. The predictor that survived did not survive intact. It is absorbing the credit that rooms lost, and it now overstates the price of floor area by half.

[WARNING]
Nothing in this output is broken in a way R can detect. There is no warning, no NA, no rank deficiency. The model fitted cleanly and returned a sentence about houses that is simply false.

=== step === concept
## Why the model cannot tell the two predictors apart

To see why, it helps to say out loud what a regression coefficient actually claims. The number next to rooms is not "what rooms are worth". It is what one more room is worth **among houses of the same floor area and the same age**. Everything else is held still, and one room is added.

So the model needs houses that differ in their number of rooms while their floor area stays put. Let's see how many of those we gave it.

```r
# How tightly do rooms and floor area move together
round(cor(homes$sqft, homes$rooms), 3)
#> [1] 0.968

plot(homes$sqft, homes$rooms, pch = 19, col = "grey35",
     xlab = "Floor area in square feet", ylab = "Number of rooms",
     main = "Rooms against floor area, 90 houses")
```

The correlation is 0.968, and the plot says the same thing more bluntly. The points sit along a line. Take any vertical slice of that plot, say the houses near 2,000 square feet, and the room counts inside that slice barely vary.

We can put a number on how little they vary. Take the part of the rooms column that floor area cannot predict, and measure its spread.

```r
# How much room-to-room variation is left once floor area is known
round(sd(residuals(lm(rooms ~ sqft, data = homes))), 2)
#> [1] 0.36
```

About a third of a room. That is the entire supply of "same size, different number of rooms" in the dataset, and it is what the model has to price a room from. Ninety houses went in, and the question the coefficient answers is being settled by a third of a room of variation.

That is the whole mechanism. The coefficient is not unreliable because the data is dirty or because the sample is small. It is unreliable because the comparison it stands for is one this data can barely see.

=== step === quiz
## Quick check: what is the regression actually short of?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It is short of rows. Ninety houses is too small a sample to support three predictors. ::no
- It is short of houses that differ in rooms without also differing in floor area, so there is almost nothing left to price a room from. ::ok Exactly. The rows are there and the signal is there. What is missing is the one comparison the coefficient is defined as, and no amount of staring at the summary will produce it.
- It is short of signal. The number of rooms turns out not to affect the price after all. ::no
- It is short of a link between rooms and price, because the two are too weakly correlated to measure. ::no The data has plenty of rows and plenty of signal: rooms on its own priced a house at 33.13 thousand a room with a t of 12.9. What it does not have is houses that differ in rooms while floor area holds still. At a fixed floor area the room count moves by about a third of a room, and that sliver is all the model gets.

=== step === concept
## How much of rooms the other predictors already explain

The shortage has a name, and more usefully it has a size. Measuring it is just another regression, one you already know how to run.

Ask this about the rooms column: how much of it can the other predictors reproduce on their own? Put rooms on the left of the formula and everything else on the right. Nothing about price is involved, because the overlap is a fact about the predictors and has nothing to do with the outcome.

```r
# Ask how much of the rooms column the other predictors already explain
aux_rooms <- lm(rooms ~ sqft + age, data = homes)
r2_rooms  <- summary(aux_rooms)$r.squared
round(r2_rooms, 4)
#> [1] 0.9375

round(1 / (1 - r2_rooms), 2)
#> [1] 15.99
```

93.75 percent of the variation in the number of rooms is already accounted for by floor area and age. Only 6.25 percent of the column is the room count on its own, and that 6.25 percent is the whole budget the regression has for working out what a room is worth.

Flip that leftover fraction upside down and you get the standard measure:

\[ \text{VIF}_j = \frac{1}{1 - R_j^2} \]

where \(R_j^2\) is the R-squared from regressing predictor \(j\) on all the other predictors. Here 1 divided by 0.0625 gives 15.99.

That number is the variance inflation factor, VIF for short, and the name means what it says. The variance of the rooms coefficient is 15.99 times what it would have been if rooms had shared nothing with the rest of the model. A VIF is not a mysterious diagnostic. It is one auxiliary regression, turned upside down.

[KEY INSIGHT]
A VIF answers a question about your predictors alone: how much of this column do the others already know? The price of a house never enters the calculation. That is why a VIF can be high in a model that fits beautifully, and why it says nothing at all about whether the predictor belongs in your model on subject-matter grounds.

=== step === concept
## The one line that measures the overlap: vif() from the car package

You will not run an auxiliary regression by hand in real work. The `car` package does all of them at once, and its output is the number people quote.

```r
# Get the variance inflation factor for every predictor at once
suppressMessages(library(car))
round(vif(model_both), 2)
#>  sqft rooms   age 
#> 15.95 15.99  1.01 
```

There is 15.99 for rooms, the same value we built by hand a moment ago. The `suppressMessages()` wrapper is only there to keep the console tidy, since attaching `car` prints a line about loading its data package.

Look at the other two while they are on screen. Floor area sits at 15.95, almost the same number, which makes sense because the overlap is between that pair, so each one carries the other's weight. Age sits at 1.01, and a VIF of 1 means a predictor standing entirely on its own.

There is a third route to the same three numbers, worth seeing once because it shows there is no magic inside the function.

```r
# The same three numbers from the predictor correlation matrix alone
round(diag(solve(cor(homes[, c("sqft", "rooms", "age")]))), 2)
#>  sqft rooms   age 
#> 15.95 15.99  1.01 
```

Invert the correlation matrix of the predictors, read the diagonal, and there they are. Three routes, one answer, and not one of them ever looked at price.

=== step === concept
## How to read a VIF number

A VIF of 15.99 sounds alarming, but alarming by how much? The number lives on the variance scale, and nothing you report lives on the variance scale. Standard errors, confidence intervals and t values all sit one square root down.

So take the square root.

```r
# Turn each VIF into how many times wider that standard error got
round(sqrt(vif(model_both)), 2)
#>  sqft rooms   age 
#>  3.99  4.00  1.01 
```

Four. The standard error on rooms is four times what it would have been if rooms had carried no overlap at all, and the confidence interval around it is four times wider for the same reason.

We can check that claim directly against the summary we already printed.

```r
# Undo the inflation on the room standard error and see what is underneath
se_rooms <- summary(model_both)$coefficients["rooms", "Std. Error"]
round(se_rooms, 3)
#> [1] 8.554

round(se_rooms / sqrt(15.99), 2)
#> [1] 2.14
```

Without the overlap the standard error on rooms would have been about 2.14 rather than 8.55, and that difference is the whole story of this fit. The truth is 8. With a standard error of 2.14, an estimate of minus 6.34 would sit about seven standard errors below the truth, which effectively never happens. With 8.55 it sits less than two below, which happens all the time.

That same square root is the right way to hear the rules of thumb you have seen quoted.

```r
# What the usual VIF thresholds mean once you square-root them
round(sqrt(c(5, 10)), 2)
#> [1] 2.24 3.16
```

A VIF of 5 is a standard error a bit over twice as wide, and a VIF of 10 is about three times as wide. Those two thresholds get repeated as though they were laws. They are not. They are round numbers somebody picked, and whether three times wider ruins your day depends on how wide the interval was to begin with and how precise an answer you owe someone.

[TIP]
Read a VIF by taking its square root and saying the result out loud as a multiple: "this standard error is 4 times wider than it needed to be". That sentence tells you what to do next. The raw VIF does not.

=== step === tryit
## Your turn: work out the VIF for the age of the house

Age came back at 1.01, the smallest number in that output. Build it yourself, so you can see what a predictor with no overlap looks like from the inside.

```r
# homes holds sqft, rooms, age and price, and model_both is the fit on all three.
# Do for age what we just did for rooms: regress age on the other two
# predictors, take the R-squared, and turn it into a VIF.
# Two lines. Press Check when you have them.
```
::check {"regex": "age\\s*~\\s*(sqft|rooms)", "gate": true, "difficulty": "beginner", "ok": "Right: an R-squared of 0.0121 and a VIF of 1.01. Floor area and rooms know almost nothing about how old a house is, so the age coefficient gets the full standard error the data can support.", "no": "Reuse the two lines from the rooms version with age as the response. Fit lm(age ~ sqft + rooms, data = homes), pull r.squared out of its summary, then divide 1 by 1 minus that number."}
::solution
```r
# The same auxiliary regression, with age as the response
aux_age <- lm(age ~ sqft + rooms, data = homes)
round(summary(aux_age)$r.squared, 4)
#> [1] 0.0121

round(1 / (1 - summary(aux_age)$r.squared), 2)
#> [1] 1.01
```

Just 1.2 percent of the age column is predictable from the other two, so 98.8 percent of it survives into the coefficient. That is what a healthy predictor looks like, and it is why age got a standard error of 0.178 while rooms got 8.554 out of the very same fit.

=== step === concept
## Why a correlation matrix is not a collinearity check

The habit most people fall into is to scan the correlation matrix, look for anything above 0.8, and call it done. It works for our two predictors, since 0.968 is impossible to miss. It stops working the moment three variables are involved.

Here is the case that breaks it. Split the room count into its parts: bedrooms, bathrooms, and, in a few houses, a separate dining room. Every house also has a kitchen and a living room, which is the 2 in the arithmetic below. Nothing about the original data changes here, we are only describing the same houses in more detail.

```r
# Describe the same houses by their individual room counts
set.seed(92)
counts <- homes
counts$dining    <- rbinom(nrow(homes), 1, 0.08)
counts$bathrooms <- pmax(1, round(0.35 * counts$rooms + rnorm(nrow(homes), 0, 0.7)))
counts$bedrooms  <- counts$rooms - counts$bathrooms - 2 - counts$dining

round(cor(counts[, c("bedrooms", "bathrooms", "rooms")]), 2)
#>           bedrooms bathrooms rooms
#> bedrooms      1.00     -0.04  0.69
#> bathrooms    -0.04      1.00  0.68
#> rooms         0.69      0.68  1.00
```

::widget correlation-heatmap {"vars":["bedrooms","bathrooms","rooms"],"matrix":[[1,-0.04,0.69],[-0.04,1,0.68],[0.69,0.68,1]]}

Scan that grid the way you normally would. Bedrooms against bathrooms is minus 0.04, which is nothing at all. The other two pairs sit at 0.69 and 0.68, and most people would wave those through without a second thought. Not one pair reaches 0.7.

Now put all three in a model.

```r
# Fit the three room counts together and measure the overlap
model_counts <- lm(price ~ bedrooms + bathrooms + rooms, data = counts)
round(vif(model_counts), 2)
#>  bedrooms bathrooms     rooms 
#>     35.92     35.35     67.27 
```

Thirty-six, thirty-five and sixty-seven. That is far worse than the pair we started with, out of a correlation matrix that looked perfectly healthy.

The reason is that no pair of these is redundant, but the three together are. Bedrooms plus bathrooms plus two always comes to the total number of rooms, except in the few houses that also have a dining room. That one rare extra room is the only thing standing between these three predictors and an exact dependency, which is why the VIFs are in the tens rather than infinite.

So collinearity does not have to live inside a pair. It lives in any linear combination of the predictors, and a correlation matrix can only ever show you pairs.

[NOTE]
This is the everyday version of that trap: putting a total and its components in the same model. Revenue with unit price and quantity, total spend with online spend and store spend, a test score with its section scores. Every pair can look harmless while the set of them is nearly a straight line.

=== step === widget
## What happens to the confidence interval as the overlap gets worse

So far we have watched one dataset at one level of overlap. The dial below runs the whole range. It is not a drawing: at every setting it fits a couple of thousand complete studies and measures what happened to them.

Drag it from left to right. On the left the two predictors are unrelated. On the right they are correlated at 0.995, which is worse than anything we have looked at so far.

::widget assumption-dial {"assumption": "multicollinearity", "levels": 11, "start": 0}

Two numbers are worth watching as you drag, and they behave very differently.

Coverage is the share of those studies whose 95 percent interval contained the true value. It is supposed to be 95 percent, and it stays at 95 percent the whole way across. Collinearity biases nothing. The estimates stay centred on the truth, and the intervals keep the promise they make.

Width is the number that moves, and it moves a long way. Watch the individual study intervals in the lower panel stretch out as the dial climbs.

Put those two together and you have the summary of the whole problem. As two predictors converge, your estimate does not become wrong. It becomes vague, and the interval says so in plain sight. A wide, honest interval is a result to report, not a fault to hide.

=== step === concept
## The predictions and the R-squared do not move

Here is the part that surprises almost everyone, and it decides whether you need to do anything at all.

We have a model with a VIF of 16 in it. Let's fit the version without the offending predictor and compare the two on the things a model is usually judged by.

```r
# Compare the collinear fit with the one that drops the collinear predictor
model_drop <- lm(price ~ sqft + age, data = homes)

round(c(collinear = summary(model_both)$r.squared,
        dropped   = summary(model_drop)$r.squared), 4)
#> collinear   dropped 
#>    0.7655    0.7640 

round(c(collinear = summary(model_both)$sigma,
        dropped   = summary(model_drop)$sigma), 2)
#> collinear   dropped 
#>     28.84     28.77 
```

Keeping the collinear predictor buys 0.0015 of R-squared, a move from 0.7640 to 0.7655. It costs about as little on the residual standard deviation, which goes from 28.77 up to 28.84, because sigma charges you for the extra column and R-squared does not.

Either way the verdict is the same. Removing a predictor with a VIF of 16 changed this model's ability to predict a house price by an amount nobody could notice.

That is not a quirk of these ninety houses. It follows from what collinearity is. The two predictors carry the same information, so the model has all of that information either way. What it cannot do is decide how much of it to write next to each name.

[KEY INSIGHT]
Multicollinearity damages the individual coefficients and their standard errors. It leaves the fitted values, the R-squared, the residual spread and the overall F test alone. If you are predicting, a high VIF is not your problem. If you are quoting a coefficient, it is the whole problem.

=== step === quiz
## Quick check: which part of the model does collinearity break?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The predictions and the R-squared, which is why a collinear model fits so badly. ::no
- The individual coefficients and their standard errors. The fit, the predictions and the residual spread barely move. ::ok Yes. That split is the whole practical rule: a high VIF is a warning about what you can say about one variable, and about nothing else.
- Everything. A model with a VIF of 16 in it should not be used for any purpose. ::no
- Nothing at all. A high VIF is a technicality that can be ignored. ::no Dropping the collinear predictor moved R-squared from 0.7655 to 0.7640 and the residual spread from 28.84 to 28.77, which is nothing. What moved was the room coefficient: minus 6.34 with a standard error of 8.55, for a variable we know is worth 8 thousand a room. The damage is real, and it is confined to the split of credit between predictors.

=== step === concept
## The total is known precisely, only the split is not

If the estimates are unbiased and the intervals cover, then something in this fit is pinned down. It is worth finding out what, because it turns out to be the most useful idea here.

An extra room in these houses does not arrive on its own. We built one room for roughly every 250 square feet, so a room turns up with about 250 square feet attached to it. Ask about that package rather than about a bare room, and the data can answer.

The package is worth 250 times the floor area coefficient plus 1 times the rooms coefficient. Combining coefficients also combines their uncertainty, and `vcov()` holds exactly what that needs: the variances of the estimates and the covariances between them. Sandwiching that matrix between the weights on both sides adds all of those pieces up with the right weight on each, and the square root of what comes out is the standard error of the combination.

```r
# Price one extra room together with the 250 square feet it arrives with
w   <- c(0, 250, 1, 0)                                  # (Intercept), sqft, rooms, age
est <- sum(w * coef(model_both))
se  <- sqrt(drop(t(w) %*% vcov(model_both) %*% w))
round(c(estimate = est, std_error = se), 2)
#>  estimate std_error 
#>     34.86      2.22 

# What our own price rule says the same package is worth
250 * 0.110 + 8
#> [1] 35.5
```

34.86, give or take 2.22. The truth is 35.50, so the model landed within seven hundred dollars of it, and the standard error is small enough to quote in a meeting.

Now set that beside the two pieces on their own. Floor area came back at 0.1648 against a truth of 0.110, and rooms came back at minus 6.34 against a truth of 8. Both are badly off, and the room coefficient alone carries a standard error of 8.55, yet the combination of the two comes with a standard error of 2.22. That is not a coincidence.

```r
# How the two estimates move relative to each other
round(cov2cor(vcov(model_both))["sqft", "rooms"], 3)
#> [1] -0.968
```

The two estimates are correlated at minus 0.968. Whenever this data pushes the floor area coefficient up, it pushes the room coefficient down by very nearly the offsetting amount. The pair is tied together, and that is what holds the total steady while each piece moves around.

[KEY INSIGHT]
Multicollinearity is not a defect in your data waiting to be repaired. It is a statement about what your data can answer. It cannot separate two things that always travel together, and it can price them accurately as a bundle. Ask the question the data can answer, and the imprecision disappears.

=== step === concept
## Ridge regression: keep both predictors and shrink them

That was the first repair, and the cheapest one: leave the model exactly as it is and ask it the question it can answer. The next repair changes the model instead. It still keeps every predictor, and it simply refuses to let the pair run off in opposite directions.

Ordinary least squares picks the coefficients that minimise the squared errors, full stop. Ridge regression minimises the squared errors plus a penalty on how large the coefficients get. When the estimates are tied at minus 0.968, pairing a big positive with a big negative is expensive under that penalty, so ridge will not do it. The size of the penalty is called lambda, and cross-validation picks it for you.

`glmnet` wants a matrix of predictors rather than a formula, and `alpha = 0` is what makes it ridge.

```r
# Fit ridge with a cross-validated penalty and set it beside the OLS fit
suppressMessages(library(glmnet))
X <- as.matrix(homes[, c("sqft", "rooms", "age")])

set.seed(46)
ridge_cv <- cv.glmnet(X, homes$price, alpha = 0)
round(ridge_cv$lambda.min, 3)
#> [1] 4.897

ridge_coef <- as.numeric(coef(ridge_cv, s = "lambda.min"))
comparison <- rbind(ols = coef(model_both), ridge = ridge_coef)
round(comparison, 4)
#>       (Intercept)   sqft   rooms     age
#> ols       67.3545 0.1648 -6.3390 -0.8192
#> ridge     80.1110 0.0925  9.8135 -0.7451
```

Look at what happened to rooms. Ordinary least squares said minus 6.34, and ridge says plus 9.81, against a truth of 8. Floor area came down from 0.1648 to 0.0925, against a truth of 0.110. Both are now close to the rule we wrote ourselves.

That is a better answer, and it comes at a real cost. Ridge estimates are biased on purpose. The penalty keeps the coefficients small and will not hand back the least squares answer even when that answer is the unbiased one. What you buy in exchange is a large drop in how far the estimates swing from one sample to the next, and with this much overlap that is a trade worth making.

[WARNING]
The catch is what you are allowed to say afterwards. A ridge coefficient is a shrunken estimate whose amount of shrinkage depends on lambda, so it is not the unbiased effect of one more room and it has no honest p-value beside it. Use ridge when you want stable predictions and plausible coefficients. Do not use it to produce a number you are going to defend as the effect of a variable.

=== step === concept
## More houses: the VIF stays high, the estimate becomes usable

The third repair is the least clever and the most effective. Collect more houses.

It is natural to expect the VIF to fall as the sample grows, so it is worth watching what actually happens. Here is the identical generator, run at 900 houses instead of 90.

```r
# Regenerate the same houses at 900 rows and refit
set.seed(46)
big_sqft  <- round(rnorm(900, 2000, 350))
big_rooms <- round(big_sqft / 250 + rnorm(900, 0, 0.2))
big_age   <- round(runif(900, 2, 60))
big_price <- round(55 + 0.110 * big_sqft + 8 * big_rooms - 0.6 * big_age +
                     rnorm(900, 0, 26), 1)
big_homes <- data.frame(sqft = big_sqft, rooms = big_rooms,
                        age = big_age, price = big_price)

model_big <- lm(price ~ sqft + rooms + age, data = big_homes)
round(summary(model_big)$coefficients, 4)
#>             Estimate Std. Error  t value Pr(>|t|)
#> (Intercept)  52.7598     5.2084  10.1297    0e+00
#> sqft          0.1062     0.0105  10.1375    0e+00
#> rooms         9.2672     2.5369   3.6529    3e-04
#> age          -0.5968     0.0536 -11.1386    0e+00

round(vif(model_big), 2)
#>  sqft rooms   age 
#> 18.59 18.60  1.00 
```

The VIF did not improve. It went up, from 15.99 to 18.60, because the overlap between floor area and rooms is a fact about how houses are built and not about how many of them you measured.

Everything you care about improved anyway. The room coefficient is 9.27 against a truth of 8. Its standard error fell from 8.55 to 2.54, a bit more than threefold, which is roughly what ten times the data buys you. The p-value is 0.0003, so the variable that looked worthless at ninety houses is now solidly reported.

And here is the line that should change how you read the small model.

```r
# The 95 percent interval for a room, from each fit
round(confint(model_both)["rooms", ], 2)
#>  2.5 % 97.5 % 
#> -23.34  10.67 

round(confint(model_big)["rooms", ], 2)
#>  2.5 % 97.5 % 
#>   4.29  14.25 
```

At ninety houses the interval for a room ran from minus 23.34 to plus 10.67, and the true value, 8, sits comfortably inside it. The small model was never lying to us. It said "somewhere between minus 23 and plus 11", and we read that as "a room is worth nothing" only because the point estimate happened to land on the wrong side of zero.

[TIP]
A non-significant coefficient with a high VIF is not evidence that the variable does not matter. It is evidence that this dataset cannot tell. Look at the confidence interval before concluding anything: when it stretches from a large negative to a large positive, the honest report is that the effect was not measured.

=== step === concept
## What dropping a predictor quietly changes

The fourth repair is the one everybody reaches for first, which is to take the redundant variable out. It works. It also changes the meaning of what is left, and that part usually goes unsaid.

```r
# Compare the floor area coefficient with and without rooms in the model
round(coef(summary(model_both))["sqft", 1:2], 4)
#>   Estimate Std. Error 
#>     0.1648     0.0354 

round(coef(summary(model_drop))["sqft", 1:2], 4)
#>   Estimate Std. Error 
#>     0.1394     0.0089 
```

The standard error collapsed from 0.0354 to 0.0089, four times tighter, which is exactly what the square root of the VIF promised. That is the win, and it is a real one.

The estimate moved as well, from 0.1648 to 0.1394, and that movement is not noise. With rooms in the model, 0.1648 meant "one more square foot, rooms held fixed". With rooms gone, nothing is being held fixed any more, so 0.1394 means "one more square foot, and whatever fraction of a room comes with it".

We can check that reading against the rule we wrote, since we know exactly what comes with a square foot.

```r
# What a square foot is worth once the rooms it brings are counted in
0.110 + 8 / 250
#> [1] 0.142
```

A square foot is worth 0.110 directly, and it brings one two-hundred-and-fiftieth of a room with it, worth another 0.032. That comes to 0.142. The dropped model reported 0.1394, and the floor-area-only fit reported 0.1428. Both are estimating that combined quantity, and both found it.

So dropping a predictor did not remove its effect from the model. It folded that effect into the coefficient that stayed, without saying so.

[NOTE]
If you drop a collinear predictor, the surviving coefficients change meaning and you owe your reader that sentence. Write "the effect of floor area, not adjusted for the number of rooms" rather than reporting 0.1394 as though it were the same quantity as 0.1648. And when two variables are interchangeable, keep the one that is cheaper to collect or easier to explain, not the one with the lower VIF.

=== step === quiz
## Quick check: your model reports a VIF of 9

You have inherited someone else's model. One predictor comes back with a VIF of 9, and you need that predictor's coefficient for a report.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The coefficient on that predictor is wrong, and so are the predictions the model makes. ::no
- Its standard error is about 3 times wider than it would be with no overlap, and the predictions and R-squared are unaffected. ::ok Right on both halves. The square root turns a VIF into the multiple that matters, and the fit side of the model is untouched, which is why a high VIF is only ever a warning about the coefficients.
- Its standard error is about 9 times wider, and nothing in the output can be trusted. ::no
- Nine is under the usual threshold of 10, so there is nothing here to think about. ::no Take the square root: a VIF of 9 means the standard error, and therefore the confidence interval, is 3 times wider than it would otherwise be. The predictions and the R-squared are not affected at all. And 10 is a convention somebody chose, not a law, so 9 is not safe simply because it sits below it.

=== step === tryit
## Your turn: price a 500 square foot extension that adds 2 rooms

A client is adding a 500 square foot extension containing 2 new rooms, and wants to know what it does to the value of the house.

That is a bundle, so the collinear model can answer it even though its room coefficient is minus 6.34. Build the same kind of weighted combination we used for one room and its 250 square feet.

```r
# model_both is the three-predictor fit, and its coefficients come out in the
# order (Intercept), sqft, rooms, age.
# The extension is worth 500 times the sqft coefficient plus 2 times the
# rooms coefficient.
# Build that weight vector with c(), multiply it into coef(model_both), and sum.
# Press Check when you have it.
```
::check {"regex": "c[(]\\s*0\\s*,\\s*500\\s*,\\s*2|500\\s*[*]", "gate": true, "difficulty": "intermediate", "ok": "Yes: 69.72 thousand dollars. Our own price rule says 500 times 0.110 plus 2 times 8, which is 71.00, so the model landed within 1.3 thousand of the truth out of a fit whose room coefficient was minus 6.34.", "no": "Line up the weights with the coefficients in order, so w2 is c(0, 500, 2, 0), and then take sum(w2 * coef(model_both))."}
::solution
```r
# Price the extension out of the same collinear model
w2 <- c(0, 500, 2, 0)
round(sum(w2 * coef(model_both)), 2)
#> [1] 69.72

# What our own price rule says the extension is worth
round(500 * 0.110 + 2 * 8, 2)
#> [1] 71
```

Two coefficients that were individually useless combine into an answer good to within about two percent. Whenever someone asks about a realistic change rather than a textbook one, this is usually the move, and it needs no repair to the model at all.

=== step === quiz
## Quick check: choosing a fix that keeps your variables

You need to report what one more room is worth. Floor area and rooms are correlated at 0.968, and your company has years of unprocessed sales records it could still add.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Drop rooms from the model and report the floor area coefficient instead. ::no
- Collect more houses. The overlap will not fall, but the standard error will, until the estimate is precise enough to report. ::ok Exactly. Nine hundred houses left the VIF at 18.60 and still brought the room coefficient to 9.27 with a standard error of 2.54. More information is the only fix that hands you the number you were asked for.
- Fit ridge regression and quote its room coefficient as the effect of one more room. ::no
- Report the model as it stands, noting that the number of rooms was not statistically significant. ::no Dropping rooms does not produce a room price, it changes what the floor area coefficient means. Ridge deliberately biases the coefficients to buy stability, which is right for prediction and wrong for a number you will defend. And calling rooms not significant would state something false about houses, when the interval ran from minus 23 to plus 11 and the truth was 8.

=== step === concept
## References

- [car: Companion to Applied Regression](https://cran.r-project.org/package=car) - Fox and Weisberg. The R package behind `vif()`, and the software companion to An R Companion to Applied Regression, 3rd edition (2019), Sage.
- [Generalized Collinearity Diagnostics](https://doi.org/10.1080/01621459.1992.10475190) - Fox and Monette (1992), Journal of the American Statistical Association 87(417), 178-183. Defines the generalized VIF that `vif()` returns once a factor is in the model.
- [A Caution Regarding Rules of Thumb for Variance Inflation Factors](https://doi.org/10.1007/s11135-006-9018-6) - O'Brien (2007), Quality and Quantity 41, 673-690. Why 5 and 10 are conventions rather than laws.
- [Regression Diagnostics: Identifying Influential Data and Sources of Collinearity](https://doi.org/10.1002/0471725153) - Belsley, Kuh and Welsch (1980), Wiley. The original full treatment, including the condition number as a second diagnostic.
- [Ridge Regression: Biased Estimation for Nonorthogonal Problems](https://doi.org/10.1080/00401706.1970.10488634) - Hoerl and Kennard (1970), Technometrics 12(1), 55-67. The paper that introduced ridge as the answer to correlated predictors.

=== step === complete
## Quick recap

You started with a room worth minus 6,340 dollars and finished with a model you can read properly. Five things are worth keeping.

- A coefficient answers "one more of this, everything else held fixed". When two predictors move together there is almost no data left in which one moves and the other holds, and 0.968 left us about a third of a room to work with.
- A VIF is one auxiliary regression turned upside down. Regress a predictor on the others, take the R-squared, and compute 1 divided by 1 minus it.
- Read a VIF by taking its square root. A VIF of 15.99 means the standard error is 4 times wider, and a VIF of 9 means 3 times wider.
- Collinearity damages the coefficients and their standard errors, and leaves the predictions, the R-squared and the residual spread alone. Dropping our worst predictor moved R-squared by 0.0015.
- The bundle is estimable even when the pieces are not. One room and its 250 square feet came out at 34.86 give or take 2.22, against a truth of 35.50, from the very fit that priced a room at minus 6.34.

And four repairs. In the order worth trying them, which is not the order we met them: ask about the bundle instead of the piece, collect more rows, fit ridge if you only need predictions, and drop a predictor last, saying out loud what the survivors now mean.

The one line to run on the next model you fit is `vif(model)`. Take the square root of whatever comes back, and if your interval is still narrow enough to answer the question at that width, the coefficients are yours to quote. If something comes back at 16, you now know exactly which part of that output to stop trusting and which part you can keep using.

Congratulations, that is multicollinearity done properly. Have a great day!
