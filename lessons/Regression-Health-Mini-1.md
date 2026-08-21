---
title: "Multicollinearity: why your coefficients look wrong, and the fix"
slug: "Regression-Health-Mini-1"
description: "Two predictors that move together can flip a coefficient sign. See it on sixty houses, measure the overlap with a VIF, then fix it without dropping a column."
keywords: "multicollinearity, VIF in R, variance inflation factor, correlated predictors, regression diagnostics, collinearity, lm coefficients"
mathjax: true
webr: true
date: "2026-08-21"
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
catalog_blurb: "Why correlated predictors scramble your coefficients, and how to fix it."
---

=== step === cover
::eyebrow Regression Health Check
## Multicollinearity: why your coefficients look wrong, and the fix

Today we have a small horror story from regression.

You are predicting house prices from square footage and the number of rooms. Both obviously matter. A bigger house costs more, and a house with more rooms in it costs more.

So you fit the room count, and every extra room adds \$48,078 to the price. That is a clean, believable answer.

Then you add the square footage to the same model, because floor area obviously matters too. And now that same extra room takes \$4,387 off the price, with a p-value of 0.730.

So now a room costs you money. A variable you know matters looks useless. And yet nothing is technically broken: no warning, no error, and this model fits the data better than the one that gave you the sensible answer.

That is multicollinearity. Big houses have more rooms, so the two predictors move together, and the model cannot tell which one deserves the credit.

The good news is that detecting it takes one line of R. Here is the whole plan.

::widget process-flow {"steps":[{"title":"See the damage","sub":"the same room goes from plus 48 thousand to minus 4 thousand"},{"title":"Measure the overlap","sub":"one line gives a VIF for every predictor in the model"},{"title":"Fix it without losing a column","sub":"ask a question these sixty houses can answer"}]}

We do all three on sixty houses that you build yourself in a minute, so every number you see here is one you can check for yourself.

=== step === concept
## Sixty houses and what we know about each one

Let's get the data on the table first, because every number from here on comes out of it.

We have sixty houses that sold on one street. For each house we know four things: the price it sold for in thousands of dollars, its floor area in square feet, how many rooms it has, and how old it is in years.

The question the seller wants answered is a simple one. What is one more room worth?

Press Run to build the street.

```r
# Build the sixty houses we work with all the way through
set.seed(185)
n_houses <- 60

sqft  <- round(runif(n_houses, 900, 3200))
rooms <- round(1 + sqft / 500 + rnorm(n_houses, 0, 0.25))
age   <- round(runif(n_houses, 1, 60))
price <- round(55 + 0.075 * sqft + 14 * rooms - 0.8 * age + rnorm(n_houses, 0, 30), 1)

homes <- data.frame(price, sqft, rooms, age)
head(homes)
#>   price sqft rooms age
#> 1 117.3 1045     3  39
#> 2 243.3 2325     6  46
#> 3 317.0 2655     6  10
#> 4 284.8 2846     7  33
#> 5 268.4 2334     6  13
#> 6 342.6 2902     6  43
```

Read the first row as one house. It sold for \$117,300, it has 1,045 square feet of floor area, it has 3 rooms, and it is 39 years old.

`set.seed(185)` fixes the random draws, so your sixty houses are exactly my sixty houses.

Two things about how this street was built are worth saying out loud, because we lean on both of them later.

- The room count comes from the floor area. It is `1 + sqft / 500` plus a small wobble, which is what happens on a real street: bigger houses get chopped into more rooms.
- The price was built with a known truth inside it. Every square foot adds \$75, every room adds \$14,000, and every year of age takes \$800 off.

That second one matters more than it looks. Because we know a room is truly worth \$14,000 here, we can tell exactly how wrong a model is when it says otherwise.

=== step === concept
## Rooms and floor area both look strong on their own

Before the horror story starts, let's fit each of the two predictors on its own and see how it looks.

We fit two separate models. The first explains price using the room count and the age of the house. The second swaps rooms for floor area and keeps age. Age sits in both of them, so apart from that one swap the two fits are identical.

```r
# Fit rooms and floor area separately, each with age alongside
m_rooms <- lm(price ~ rooms + age, data = homes)
m_sqft  <- lm(price ~ sqft + age, data = homes)

round(summary(m_rooms)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   39.865     24.848   1.604    0.114
#> rooms         48.078      3.966  12.122    0.000
#> age           -1.020      0.304  -3.361    0.001

round(summary(m_sqft)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   63.103     19.341   3.263    0.002
#> sqft           0.104      0.007  14.638    0.000
#> age           -0.855      0.264  -3.234    0.002
```

Read the Estimate column in each table. Rooms says \$48,078 a room. Floor area says 0.104 thousand dollars a square foot, which is \$104.

Both have a p-value that rounds to zero in the last column, so both look rock solid. That p-value asks how often a predictor with no real effect at all would still produce an estimate this far from zero, and a value near zero means almost never.

And yet both of them are overstating, and it is worth seeing why before we go on. Remember how we built this street: a room is truly worth \$14,000 and a square foot is truly worth \$75.

When a predictor is fitted on its own, it collects the credit for the other one as well. Rooms has no floor area sitting beside it to hand that credit to, so \$48,078 is the value of a room plus all the extra floor area that comes with it.

That is not the problem yet. It is the setup for the problem.

=== step === concept
## Put both in and a room starts costing money

So the obvious repair is to put both predictors into one model and let the regression sort out who deserves what. Separating tangled effects is exactly what a regression is for.

```r
# Fit floor area and rooms together and watch the room coefficient
m_both <- lm(price ~ sqft + rooms + age, data = homes)

round(summary(m_both)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   67.081     22.609   2.967    0.004
#> sqft           0.113      0.026   4.319    0.000
#> rooms         -4.387     12.633  -0.347    0.730
#> age           -0.844      0.268  -3.144    0.003
```

Look at the rooms row. It went from plus 48.078 to minus 4.387. The estimate now says an extra room takes \$4,387 off the price, and the p-value of 0.730 says that even this cannot be told apart from zero.

Now look at the age row, because age is the control that tells you the fitting itself is fine. Age was -1.020 on its own and it is -0.844 here. It shifted a little and stayed strongly significant.

Then look at one more number, the standard error on rooms: 12.633, against 3.966 in the model without floor area. A standard error is the model's own estimate of how much a coefficient would bounce around if you went out and collected another sixty houses.

So that is the real tell. The estimate did not just move. It lost all of its precision.

[WARNING]
Nothing here is an error. `lm()` gave no warning, the model fits the data well, and every number in that table is the correct answer to the question the model was asked. What changed is the question, and floor area is what changed it.

=== step === quiz
## Quick check: what changed when floor area joined the model?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The data changed. Adding a column to the formula changes which houses the model is fitted on. ::no
- The room coefficient is now simply wrong, and the one from the model without floor area was the right one. ::no
- The question the room coefficient answers changed. On its own it answers what a house with one more room is worth. Alongside floor area it answers what one more room is worth at the same floor area. ::ok Exactly right. Adding a predictor rewrites the question, and once floor area is held fixed there is barely a house left on this street that can answer it.
- Rooms and price are not really related, and the second model is the one that caught it. ::no Both models are fitted on the same sixty houses, and neither one is broken or lying. A coefficient always reports the effect of its own predictor with every other predictor in the model held fixed, so putting floor area in changed what the room coefficient was being asked. When two columns move together, that held-fixed question has almost no data left to answer it.

=== step === concept
## Big houses have more rooms, and these sixty have almost no exceptions

If the model cannot separate two columns, the place to look is the columns themselves.

Here is every pairwise correlation on the street. Green is positive, blue is negative, and the darker the cell the stronger the relationship.

::widget correlation-heatmap {"vars": ["price", "sqft", "rooms", "age"], "matrix": [[1, 0.88, 0.834, -0.303], [0.88, 1, 0.961, -0.133], [0.834, 0.961, 1, -0.095], [-0.303, -0.133, -0.095, 1]]}

The cell to look at is sqft against rooms, and it reads 0.961. Floor area and room count are very nearly the same column under two different names. Age sits at -0.133 with floor area, which is why age came through the last model almost untouched.

A correlation is only a summary though, so let's see what 0.961 does to the actual houses. We group the street into floor-area bands and count the room counts inside each band.

```r
# Group the houses into floor-area bands and count the room counts in each band
band <- cut(homes$sqft, breaks = seq(900, 3300, by = 400),
            labels = c("900-1300", "1300-1700", "1700-2100",
                       "2100-2500", "2500-2900", "2900-3300"))

table(band, rooms = homes$rooms)
#>            rooms
#> band         3  4  5  6  7  8
#>   900-1300   5  0  0  0  0  0
#>   1300-1700  0 10  0  0  0  0
#>   1700-2100  0  1  6  0  0  0
#>   2100-2500  0  0  3 10  0  0
#>   2500-2900  0  0  0 12  3  0
#>   2900-3300  0  0  0  1  8  1
```

Read one row of that table. Every single house between 1,300 and 1,700 square feet has exactly 4 rooms. All ten of them.

To learn what a room is worth at a fixed floor area, a model needs houses of the same size that differ in their room count, and this street has very few. Let's count exactly how few.

```r
# Count the houses that differ from the most common room count in their band
band_table <- table(band, homes$rooms)
nrow(homes) - sum(apply(band_table, 1, max))
#> [1] 9
```

Nine. Fifty-one of the sixty houses sit at whatever room count is most common in their band, and only nine break the pattern. Those nine houses are the whole of the evidence the model has for telling rooms and floor area apart.

[KEY INSIGHT]
Multicollinearity is not a flaw in your model, it is a shortage in your data. The regression is being asked about houses that are the same size but have different room counts, and this street contains nine of them.

=== step === concept
## How much of floor area the other columns already explain

A tangle between two columns is easy enough to spot by eye. Real models carry ten or twenty predictors though, and the overlap is usually spread over several of them at once rather than sitting in one neat pair.

So we want a number, one per predictor, that answers this question: how much of this column do the other columns already explain?

That number is called the Variance Inflation Factor, and everybody says VIF out loud. You build it from a regression that leaves price out completely.

```r
# Explain floor area using only the OTHER predictors, with price left out
aux_sqft <- lm(sqft ~ rooms + age, data = homes)
r2_sqft  <- summary(aux_sqft)$r.squared

round(r2_sqft, 4)
#> [1] 0.9261
```

Rooms and age together explain 92.61% of the variation in floor area. So only 7.39% of floor area is information the rest of the model does not already hold, and that thin 7.39% is all the model has to work out what a square foot is worth.

Turning that leftover share into the VIF takes one division.

\[ \text{VIF}_j = \frac{1}{1 - R^2_j} \]

Here \(R^2_j\) is the R-squared from regressing predictor \(j\) on all the other predictors, and \(1 - R^2_j\) is the share of that predictor which nothing else in the model can explain.

```r
# Turn the leftover share into the variance inflation factor
1 / (1 - r2_sqft)
#> [1] 13.52653
```

So floor area comes back with a VIF of 13.53. Because the leftover share sits in the denominator, the VIF climbs fast once predictors start to overlap: an R-squared of 0.5 gives a VIF of 2, an R-squared of 0.9 gives 10, and 0.99 gives 100.

=== step === concept
## The same three numbers from car::vif

You will not build auxiliary regressions by hand in real work. The `car` package does every predictor in the model at once, and its `vif()` is the function the regression textbooks point at.

```r
# Get the variance inflation factor for every predictor in one line
suppressMessages(library(car))

round(vif(m_both), 2)
#>  sqft rooms   age
#> 13.53 13.41  1.03
```

Floor area comes back at 13.53, matching the number we built by hand. Rooms is right beside it at 13.41. Age sits at 1.03, which is what a predictor looks like when nothing else in the model overlaps with it.

You will hear two rules of thumb: look into anything above 5, and act on anything above 10. Treat them as habits rather than laws. They are conventions that got repeated rather than thresholds derived from anything, and O'Brien wrote a whole paper about how loosely they get applied.

The more useful reading is a plain multiplication. A VIF is the number that the overlap multiplies the variance of that coefficient by. So its square root is what it multiplies the standard error by, and with it the width of the confidence interval.

```r
# How many times wider the overlap makes each interval
round(sqrt(vif(m_both)), 2)
#>  sqft rooms   age
#>  3.68  3.66  1.02
```

So the interval around the room coefficient is 3.66 times wider than it would have been if rooms overlapped with nothing. That one number explains the whole strange table we saw earlier. It was never a wrong answer. It was an answer with all of the precision taken out of it.

=== step === tryit
## Your turn: work out the VIF for rooms by hand

`car` reported 13.41 for rooms. Prove that number yourself.

Regress `rooms` on the other two predictors, pull the R-squared out of that fit, and turn it into a VIF the same way we did for floor area. Two lines.

```r
# homes holds the sixty houses: price, sqft, rooms, age.
# Regress rooms on the other two predictors and read off its R-squared,
# then turn that R-squared into a VIF.
# Two lines. Press Check when you have them.
```
::check {"regex": "lm[(]\\s*rooms\\s*~", "gate": true, "difficulty": "beginner", "ok": "That is it. An R-squared of 0.9254 gives a VIF of 13.41, exactly what car reported. Only 7.5% of the room count is information that floor area and age do not already carry.", "no": "Copy the auxiliary fit and swap the response for rooms: lm(rooms ~ sqft + age, data = homes). Take summary(...)$r.squared from it, then divide 1 by 1 minus that."}
::solution
```r
# Rebuild the rooms VIF from its own auxiliary regression
aux_rooms <- lm(rooms ~ sqft + age, data = homes)
r2_rooms  <- summary(aux_rooms)$r.squared

round(r2_rooms, 4)
#> [1] 0.9254

1 / (1 - r2_rooms)
#> [1] 13.40808
```

=== step === quiz
## Quick check: what does a VIF of 13.4 actually say?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Rooms is 13.4 times less important than a predictor with a VIF of 1. ::no
- The variance of the room coefficient is 13.4 times what it would have been with no overlap, so its interval is wider by the square root of that, about 3.66 times. ::ok Yes. A VIF is a multiplier on variance, which makes its square root the multiplier on the standard error and on the width of the interval.
- About 13.4% of the room coefficient is unreliable. ::no
- The room coefficient is biased: collinearity has pushed it 13.4 times further from the truth than it should be. ::no A VIF says nothing about importance, and it is neither a percentage nor a measure of bias. It is a multiplier on the variance of one coefficient, which is why the interval widens by its square root, about 3.66 times here. The estimate itself is not pushed anywhere.

=== step === concept
## Minus 4.4 was just one draw out of two thousand

We keep saying the estimate is imprecise. Let's watch that happen.

We built this street ourselves, so nothing stops us from building another one. It has sixty houses again, the same rules and the same true \$14,000 a room, and the only thing that changes is which houses happen to turn up. Do that two thousand times, fit the same three-predictor model each time, and keep the room coefficient out of every fit.

```r
# Rebuild the same kind of street 2,000 times, keeping the rooms coefficient each time
one_street <- function() {
  new_sqft  <- round(runif(60, 900, 3200))
  new_rooms <- round(1 + new_sqft / 500 + rnorm(60, 0, 0.25))
  new_age   <- round(runif(60, 1, 60))
  new_price <- round(55 + 0.075 * new_sqft + 14 * new_rooms -
                       0.8 * new_age + rnorm(60, 0, 30), 1)
  coef(lm(new_price ~ new_sqft + new_rooms + new_age))[["new_rooms"]]
}

set.seed(21)
many_rooms <- replicate(2000, one_street())

hist(many_rooms, breaks = 40, col = "grey85", border = "white",
     main = "2,000 streets of sixty houses, one room coefficient each",
     xlab = "Estimated value of one extra room (thousands of dollars)")
abline(v = 14, col = "darkgreen", lwd = 3)
abline(v = coef(m_both)[["rooms"]], col = "red", lwd = 3)
```

The green line is the truth we built in, \$14,000 a room. The red line is the minus \$4,387 that our own street handed back. Our answer is not sitting off in some freak corner of the picture. It sits comfortably inside the pile.

Now let's get the three numbers that describe that pile.

```r
# Summarise the 2,000 estimates: centre, spread, and how often the sign flips
round(c(mean = mean(many_rooms), sd = sd(many_rooms),
        share_negative = mean(many_rooms < 0)), 3)
#>           mean             sd share_negative
#>         13.941         10.442          0.095
```

Three things in there are worth reading slowly.

- The average of the 2,000 estimates is 13.941, which is essentially the \$14,000 we built in. Collinearity did not bend the answer in any direction. Run enough streets and it lands on the truth.
- The spread is enormous. A standard deviation of 10.442 around a true value of 14 means individual estimates land anywhere from well below zero to the middle thirties.
- 9.5% of them come out negative. About one street in ten produces the sign flip that started all of this.

[KEY INSIGHT]
Collinearity does not push your coefficient in a wrong direction. It makes the coefficient wobble so violently from one sample to the next that any single one of them, yours included, can land almost anywhere. The estimate is unbiased and useless at the same time.

=== step === concept
## The interval said all along that we could not tell

Here is the reassuring part. You never needed two thousand streets to know your estimate was that shaky. Your one street told you the first time you asked, in the confidence interval.

A 95% confidence interval is the range of values that the data cannot rule out for a coefficient. It is built so that intervals made this way hold the true value 95 times out of 100. `confint()` prints one for every term in a model.

```r
# Compare what each model can pin down about one extra room
ci_alone <- confint(m_rooms)["rooms", ]
ci_both  <- confint(m_both)["rooms", ]

round(rbind(rooms_alone = ci_alone, rooms_with_sqft = ci_both), 1)
#>                 2.5 % 97.5 %
#> rooms_alone      40.1   56.0
#> rooms_with_sqft -29.7   20.9

round(c(alone = unname(diff(ci_alone)), with_sqft = unname(diff(ci_both))), 1)
#>     alone with_sqft
#>      15.9      50.6
```

Without floor area in the model, the interval runs from 40.1 to 56.0, a span of 15.9 thousand dollars. With floor area in, it runs from -29.7 to 20.9, a span of 50.6.

Let's draw those two intervals so the difference is impossible to miss.

```r
# Draw the two room intervals as bars, with zero and the truth marked
plot(NULL, xlim = c(-35, 60), ylim = c(0.5, 2.5), yaxt = "n", bty = "n",
     xlab = "Value of one extra room (thousands of dollars)", ylab = "",
     main = "What each model can pin down about one room")
axis(2, at = c(2, 1), labels = c("without sqft", "with sqft"), las = 1)

segments(ci_alone[1], 2, ci_alone[2], 2, lwd = 10, col = "grey70")
segments(ci_both[1], 1, ci_both[2], 1, lwd = 10, col = "grey70")
points(c(coef(m_rooms)[["rooms"]], coef(m_both)[["rooms"]]), c(2, 1), pch = 19)
abline(v = 0, col = "red", lwd = 2, lty = 2)
abline(v = 14, col = "darkgreen", lwd = 2)
```

The lower bar crosses the red zero line, so the data cannot even settle the sign. It also comfortably contains the green line at 14, the truth. The model never claimed to know the answer. We were the ones who read a point estimate and believed it.

Meanwhile the age interval hardly moves at all.

```r
# The clean predictor, before and after floor area joins
round(rbind(age_alone     = confint(m_rooms)["age", ],
            age_with_sqft = confint(m_both)["age", ]), 2)
#>               2.5 % 97.5 %
#> age_alone     -1.63  -0.41
#> age_with_sqft -1.38  -0.31
```

[TIP]
A coefficient with a very wide interval is not a broken coefficient. It is an honest report that this data cannot settle this question. The dangerous move is to read only the estimate, because the estimate on its own never tells you how little the data had to work with.

=== step === concept
## The predictions never suffered at all

So far collinearity looks like a catastrophe. There is one place where it does no damage at all, and knowing where that is saves you from repairing things that are not broken.

Let's compare the tangled three-predictor model against a clean one that keeps floor area and age and drops the redundant room count.

```r
# Compare the fit with and without the redundant room count
round(c(without_rooms = summary(m_sqft)$r.squared,
        with_both     = summary(m_both)$r.squared), 4)
#> without_rooms     with_both
#>        0.8091        0.8095

round(max(abs(fitted(m_sqft) - fitted(m_both))), 2)
#> [1] 3.58
```

The R-squared figures are 0.8091 and 0.8095. Across all sixty houses, the biggest disagreement between the two sets of predictions is 3.58, which is \$3,580 on houses selling between \$102,000 and \$419,400.

Let's put every house on a chart twice, priced once by each model.

```r
# Plot every house twice: predicted by each model, against each other
plot(fitted(m_sqft), fitted(m_both), pch = 19, col = "grey40",
     xlab = "Predicted price without rooms (thousands of dollars)",
     ylab = "Predicted price with rooms",
     main = "The same sixty houses, priced by both models")
abline(0, 1, col = "red", lwd = 2)
```

Every point sits on the red line. The two models disagree violently about what a room is worth and agree almost perfectly about what each house is worth.

That makes sense once you say it plainly. Rooms and floor area between them carry a fixed amount of information about price, and collinearity is an argument about how to divide the credit, not about how much credit there is.

[KEY INSIGHT]
Collinearity ruins your ability to attribute an effect to one predictor. It does not touch your predictions, your R-squared, or the coefficients of the predictors that are not tangled up. Age kept a VIF of 1.03 through all of this and came out untouched.

=== step === widget
## Dial the overlap between rooms and floor area up and down

Our two thousand streets were all built with the same tangle in them, since 0.961 is the correlation we wrote into the generator. So we still do not know what changes when the tangle gets milder or worse.

The panel below sweeps it. At every setting of the dial it builds two predictors with exactly that much correlation between them, runs two thousand complete studies at that setting, and measures two things across all of them: how often the 95% interval really does contain the true value, and what the R-squared came out at.

Start at the left, where the two predictors are unrelated, and drag the dial to the right. The label above it tells you the correlation and the VIF you are asking for.

::widget assumption-dial {"assumption": "multicollinearity"}

Watch the two lines as you drag.

The coverage line does not move. At every level of overlap, about 95 out of every 100 intervals contain the true value, which is exactly what a 95% interval promises. R-squared does not move either.

What does move is the strip of individual study intervals underneath. Turn the dial up and watch them stretch.

[KEY INSIGHT]
Collinearity does not break the confidence interval. It widens it. The interval keeps its promise the whole way up the dial, and that promise is an honest one: with predictors this tangled, a wide interval really is all your data can give you.

=== step === quiz
## Quick check: the model only has to predict. Do you fix it?

You are building a model that estimates house prices for a listings site. It will price houses and nothing else, and nobody will ever read a single coefficient. Every VIF in it is above 10.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Fix it. A VIF above 10 has to be dealt with before any model can be trusted for anything. ::no
- Leave it. Collinearity widens the coefficient intervals, and this job never reads a coefficient. The predictions and the R-squared are untouched. ::ok Right. A high VIF is a warning about attributing credit, and this model is not attributing credit to anything. Repairing it here would cost you effort and buy you nothing.
- Fix it, because collinearity biases the predictions upward. ::no A high VIF damages exactly one thing: your ability to say what one predictor is worth on its own. Predictions, fitted values and R-squared come out the same either way, so a pure prediction job can carry a tangle of correlated predictors without any trouble at all. It becomes a problem the moment somebody asks what one of those coefficients means.

=== step === concept
## Asking a question these sixty houses can answer

So here is the repair that gets the least attention and deserves the most of it.

The model kept failing because we asked it something the street cannot answer: what is one more room worth at the same floor area? Only nine houses on this street can speak to it. So let's ask these houses something they can actually answer instead.

Keep the room count, and replace floor area with the average size of a room, which is floor area divided by rooms. Both columns are still there and no information is thrown away, but the pair no longer moves together.

```r
# Replace the overlapping pair with rooms and the average size of a room
homes$room_size <- round(homes$sqft / homes$rooms)

round(c(smallest = min(homes$room_size), largest = max(homes$room_size),
        cor_with_rooms = cor(homes$rooms, homes$room_size)), 2)
#>       smallest        largest cor_with_rooms
#>         320.00         484.00           0.44
```

Room sizes run from 320 square feet to 484, and the correlation between the room count and the room size is 0.44 rather than 0.961. Big houses on this street have more rooms, but their rooms are not much bigger, so the two columns finally carry different things.

Let's refit with the new pair.

```r
# Refit price on rooms and average room size, then check the overlap
m_fix <- lm(price ~ rooms + room_size + age, data = homes)

round(summary(m_fix)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -159.942     52.794  -3.030    0.004
#> rooms         41.131      3.876  10.613    0.000
#> room_size      0.565      0.136   4.160    0.000
#> age           -0.793      0.273  -2.905    0.005

round(vif(m_fix), 2)
#>     rooms room_size       age
#>      1.24      1.29      1.05
```

Both predictors are strongly significant, and every VIF is under 1.3. The standard error on rooms fell from 12.633 to 3.876. Here is the whole repair side by side.

| The model | rooms estimate | standard error | p-value | rooms VIF |
|---|---|---|---|---|
| price ~ sqft + rooms + age | -4.387 | 12.633 | 0.730 | 13.41 |
| price ~ rooms + room_size + age | 41.131 | 3.876 | below 0.001 | 1.24 |

Be careful about what you have actually won here, because this is the point where the fix gets oversold. The 41.131 is not the \$14,000 we built into the street. That \$14,000 was the value of a room with floor area held fixed, and that is the question these sixty houses cannot answer.

What 41.131 answers is a different and perfectly useful question: what is one more room of typical size worth, floor area and all? The honest way to report a repair like this is to say which question you switched to, and why.

=== step === concept
## At nine hundred houses the same overlap stops hurting

There is one more thing worth knowing before we talk about remedies, because it tells you what was actually missing.

It was never the correlation itself. It was the number of houses that break the pattern. Let's build the same kind of street with nine hundred houses instead of sixty, changing nothing else about the rules.

```r
# Regenerate the same kind of street with nine hundred houses instead of sixty
set.seed(34)
n_big <- 900

big_sqft  <- round(runif(n_big, 900, 3200))
big_rooms <- round(1 + big_sqft / 500 + rnorm(n_big, 0, 0.25))
big_age   <- round(runif(n_big, 1, 60))
big_price <- round(55 + 0.075 * big_sqft + 14 * big_rooms -
                     0.8 * big_age + rnorm(n_big, 0, 30), 1)

big <- data.frame(price = big_price, sqft = big_sqft,
                  rooms = big_rooms, age = big_age)

m_big <- lm(price ~ sqft + rooms + age, data = big)

round(cor(big$sqft, big$rooms), 3)
#> [1] 0.963

round(vif(m_big), 2)
#>  sqft rooms   age
#> 13.71 13.71  1.00
```

The correlation is 0.963 and the VIFs are 13.71. The tangle is exactly as bad as it was before, by every measure we have. Now look at what the model says.

```r
# The same three-predictor model, now fitted on nine hundred houses
round(summary(m_big)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   57.629      4.804  11.995        0
#> sqft           0.075      0.006  13.298        0
#> rooms         14.016      2.749   5.098        0
#> age           -0.839      0.060 -13.969        0

round(confint(m_big)["rooms", ], 1)
#>  2.5 % 97.5 %
#>    8.6   19.4
```

Rooms comes back at 14.016, which is the \$14,000 we built in, with an interval of 8.6 to 19.4 instead of -29.7 to 20.9. Floor area comes back at 0.075, its true value, instead of the inflated 0.113. The tangle is exactly the same and the answers are now right.

The reason is the count we did earlier.

```r
# Count the nine-hundred-house street the same way we counted the sixty
big_table <- table(cut(big$sqft, breaks = seq(900, 3300, by = 400)), big$rooms)
nrow(big) - sum(apply(big_table, 1, max))
#> [1] 219
```

Two hundred and nineteen houses break their band's pattern, against nine before. The VIF never changed, because a VIF measures overlap, not evidence. What changed is how many houses were available to answer the held-fixed question.

[NOTE]
A high VIF is not a verdict on its own. It tells you that your predictors overlap, and how much that overlap multiplies the variance of each coefficient. Whether the resulting interval is too wide to use depends on how much data you have, which is why the interval is the number to look at and the VIF is the number that explains it.

=== step === concept
## You have four ways out, and each one costs something

Suppose you have found a real tangle, you do care about the coefficients, and more data is not arriving next week. Here are your options, and what each one takes from you.

| Way out | What you do | What it costs |
|---|---|---|
| Redefine the predictors | Replace the overlapping pair with quantities that separate, the way rooms and average room size did | You are answering a slightly different question, so you have to say which one |
| Collect more data | Go and find the houses that break the pattern: small houses with many rooms, large ones with few | Time and money, and sometimes those houses genuinely do not exist |
| Ridge regression | Add a penalty that stops the coefficients from swinging so wildly | The estimates are deliberately pulled toward zero, so they are biased on purpose |
| Drop one of them | Take one of the overlapping columns out of the model | You give up saying anything at all about the column you dropped |

Dropping a column is the most common move and the one to think twice about, because it does not delete the overlap, it hides it. Take floor area out and the room coefficient goes back to 48.078, which is the room plus all the floor area that comes with it.

Ridge is worth seeing once, because it is built for exactly this situation. It solves the usual least-squares equations with a small amount added down the diagonal.

\[ \hat{\beta}_{\text{ridge}} = (X^{T}X + \lambda I)^{-1} X^{T} y \]

The \(\lambda\) is the penalty. At zero you get ordinary least squares back, and as it grows the coefficients are pulled toward zero. Predictors are standardised first so that the penalty treats them evenly.

```r
# Shrink the coefficients with a ridge penalty, on standardised predictors
X_scaled  <- scale(as.matrix(homes[, c("sqft", "rooms", "age")]))
y_centred <- homes$price - mean(homes$price)

ridge_beta <- function(lambda) {
  as.vector(solve(t(X_scaled) %*% X_scaled + lambda * diag(3)) %*%
              t(X_scaled) %*% y_centred)
}

data.frame(predictor  = c("sqft", "rooms", "age"),
           no_penalty = round(ridge_beta(0), 2),
           penalty_5  = round(ridge_beta(5), 2))
#>   predictor no_penalty penalty_5
#> 1      sqft      69.48     42.36
#> 2     rooms      -5.56     18.90
#> 3       age     -13.98    -14.07
```

These coefficients are in thousands of dollars per standard deviation of each predictor, not per room, because the columns were standardised first.

With no penalty you get the familiar fight between the two: floor area takes 69.48 and rooms is pushed to -5.56. Add a penalty of 5 and that fight settles down. Floor area comes to 42.36, rooms comes to 18.90, and both are positive and sensible. Age barely moves, because age was never part of the tangle.

In real work the penalty is chosen by cross-validation rather than picked by hand, which is what the `glmnet` package is built for. What matters here is what the penalty does. It stops two tangled predictors from taking wild opposite positions, and the price you pay for that is a little bias.

=== step === quiz
## Practice: which of these is true about the house model?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The room coefficient of -4.387 is biased downward by the collinearity, and averaging many streets would show the same downward pull. ::no
- The three-predictor model predicts noticeably worse than the model without rooms, because two of its VIFs sit above 13. ::no
- Its room interval of -29.7 to 20.9 does contain the true 14, its VIF of 13.41 says the variance of that coefficient is inflated 13.41 times, and its R-squared is within 0.0004 of the model that leaves rooms out. ::ok All three at once, and together they are the whole picture: an honest interval, an inflated variance, untouched predictions.
- A VIF of 13.41 means 13.41% of the room coefficient cannot be trusted, so the model should be thrown out. ::no Collinearity inflates variance without introducing bias, which is why 2,000 streets averaged 13.941 around a true 14. It leaves prediction alone, which is why the R-squared barely moved. And a VIF is a multiplier on variance, never a percentage.

=== step === tryit
## Practice: diagnose the model with all four columns in it

`homes` now carries five columns: `price`, `sqft`, `rooms`, `age` and `room_size`. Somebody looks at that and decides to keep everything, on the theory that more predictors cannot hurt.

Fit `price` on all four predictors, then get the VIF for each one and the R-squared of the fit.

```r
# homes has price, sqft, rooms, age and room_size.
# Fit price on ALL FOUR predictors, then report the VIF for each one
# and the R-squared of the fit.
# Press Check when you have it.
```
::check {"regex": "sqft\\s*[+]\\s*rooms\\s*[+]\\s*room_size", "gate": true, "difficulty": "intermediate", "ok": "There it is. VIFs of 221, 154 and 21, because room_size is sqft divided by rooms and the three of them carry one piece of information between them. The R-squared did not move at all.", "no": "Fit lm(price ~ sqft + rooms + room_size + age, data = homes), then call vif() on it and read summary(...)$r.squared."}
::solution
```r
# Diagnose the model that keeps all four predictors at once
m_all4 <- lm(price ~ sqft + rooms + room_size + age, data = homes)

round(vif(m_all4), 1)
#>      sqft     rooms room_size       age
#>     221.3     154.1      21.1       1.1

round(summary(m_all4)$r.squared, 4)
#> [1] 0.8095
```

Adding a column that is built out of two others is the fastest way to wreck a coefficient table, and the fit statistic will not warn you: 0.8095, exactly what the three-predictor model gave.

=== step === tryit
## Practice: fix it and prove the fix worked

Now repair that four-predictor model. One of its columns is a function of two others, since floor area is the room count multiplied by the average room size.

Drop the redundant one, refit, and show two things: that every VIF is now under 5, and that the fit survived.

```r
# m_all4 has all four predictors and VIFs in the hundreds.
# Drop the redundant column, refit, and report the VIFs
# and the R-squared of the new model.
# Press Check when you have it.
```
::check {"regex": "price\\s*~\\s*rooms\\s*[+]\\s*room_size", "gate": true, "difficulty": "intermediate", "ok": "Exactly. Take floor area out and the VIFs fall from 221 and 154 to 1.24 and 1.29, while the R-squared holds at 0.806 against 0.8095. You lost a column and kept the model.", "no": "Floor area is the redundant one, since sqft equals rooms times room_size. Fit lm(price ~ rooms + room_size + age, data = homes), then call vif() on it and read summary(...)$r.squared."}
::solution
```r
# Drop the redundant column and confirm the damage is gone
m_fixed <- lm(price ~ rooms + room_size + age, data = homes)

round(vif(m_fixed), 2)
#>     rooms room_size       age
#>      1.24      1.29      1.05

round(summary(m_fixed)$r.squared, 4)
#> [1] 0.806
```

Every VIF is close to 1, and the R-squared moved from 0.8095 to 0.806. That is the trade in one line: a fraction of a percent of fit, in exchange for coefficients that mean something.

=== step === concept
## References

- [An R Companion to Applied Regression, 3rd edition](https://www.john-fox.ca/Companion/) - Fox and Weisberg (2019), Sage. The book behind the `car` package, and the reference for how `vif()` is defined and read.
- [A Caution Regarding Rules of Thumb for Variance Inflation Factors](https://doi.org/10.1007/s11135-006-9018-6) - O'Brien (2007), Quality and Quantity 41(5), 673-690. Why 5 and 10 are conventions rather than thresholds derived from anything.
- [Generalized Collinearity Diagnostics](https://doi.org/10.1080/01621459.1992.10475190) - Fox and Monette (1992), Journal of the American Statistical Association 87(417), 178-183. The generalised VIF that `car` reports when a predictor is a factor with several levels.
- [Applied Linear Statistical Models, 5th edition](https://archive.org/details/appliedlinearsta0000kutn_5edi) - Kutner, Nachtsheim, Neter and Li (2005), McGraw-Hill. Chapter 10 works through multicollinearity and its effects at length.
- [Regression Diagnostics: Identifying Influential Data and Sources of Collinearity](https://books.google.com/books/about/Regression_Diagnostics.html?id=GECBEUJVNe0C) - Belsley, Kuh and Welsch (1980), Wiley. The standard treatment of collinearity as a condition of the data rather than a fault in the model.

=== step === complete
## Quick recap

You took a regression that gave an absurd answer, found out why, measured it, and repaired it without throwing away a variable you needed. Worth carrying away:

- A coefficient always means the effect of that predictor with the others held fixed. When two predictors move together, almost no data is left to answer that held-fixed question, and the estimate goes wild. On this street, nine houses out of sixty carried the whole burden.
- The VIF measures the overlap. It is 1 divided by 1 minus the R-squared from regressing that predictor on all the others, `car::vif()` gives it in one line, and its square root is how many times wider your interval got.
- Collinearity inflates variance, it does not introduce bias. Two thousand streets averaged 13.941 around a true 14, and 9.5% of them came out negative.
- It leaves predictions, fitted values and R-squared alone, and it leaves uncorrelated predictors alone too. Age sat at a VIF of 1.03 the whole way through.
- The best repair is often to redefine rather than to drop. Rooms plus average room size kept both columns, brought every VIF under 1.3, and cost 0.0035 of R-squared.

And here is the sentence to say when somebody hands you a table with a sign flip in it:

"That coefficient is not wrong, it is imprecise. These two predictors are 0.96 correlated, so the data cannot separate them, and the interval is telling you so."

Congratulations, you made it through. Have a great day!
