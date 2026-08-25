---
title: "Cook's distance: find the points that change your model"
slug: "Regression-Health-Mini-4"
description: "One account can carry a whole regression. Compute Cook's distance on 40 rows, read the two influence plots, and decide what to do with the row you find."
keywords: "Cooks distance in R, influential observations, leverage, hatvalues, cooks.distance, leave-one-out refit, regression diagnostics, influential points in R"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "4"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: "Regression-Health-Mini-3"
course_next: ""
curriculum_id: "0.0.27"
lesson_access: "windowed"
catalog_blurb: "Find the rows steering your model, and decide what to do about them."
---

=== step === cover
::eyebrow Regression Health Check
## Cook's distance: find the points that change your model

Let's start with a question worth asking of any model you care about. If you deleted one row of your data, would your conclusions change?

Let's make that concrete. You pull forty business accounts off the billing system and ask whether customers spend more the longer they stay with you. The line says yes: every extra year of tenure is worth about 31,000 a year in revenue, at p = 0.0023.

Then you look at the rows properly and one of them stops you. Northwind is an enterprise client, twelve years with you, billing a million a year while the median of the other thirty-nine accounts bills 20,181. That one customer is about fifty times the middle of your book.

So you take Northwind out and refit. The slope falls to 96 a year, and the p-value climbs to 0.82.

The trend was never about tenure. It was about one customer.

Most rows are not like that. Delete one and nothing worth noticing changes. A row like Northwind is steering the whole model on its own, and you want its name before you present anything to anybody. Cook's distance is the number that finds rows like that, and here is how we are going to use it.

::widget process-flow {"steps":[{"title":"Measure every row","sub":"score how much each of the 40 rows moves the fit"},{"title":"Read the two plots","sub":"the influence plots R draws, and their cutoffs"},{"title":"Decide","sub":"keep, correct, down-weight, or drop for a reason"}]}

Everything from here is those three things, done on the forty accounts with the numbers in front of you. And the third one matters most, because quietly deleting the row you find is almost always the wrong move.

=== step === concept
## The forty accounts, and the trend they seem to show

Let's get the data on the table first, because every number after this comes out of it.

These are forty business accounts at a supplies company. For each one you have how long they have been a customer, in years, and what they bill you in a year. The account names go into the row names, so every diagnostic we run from here prints the account it is talking about instead of a row number.

Press Run to build the accounts and see the four biggest.

```r
# Build the 40 business accounts and print the four biggest by revenue
set.seed(42)
accounts <- data.frame(
  account        = paste0("C", 1:40),
  tenure_years   = round(runif(40, 1, 8), 1),
  annual_revenue = round(rnorm(40, 20000, 5000), 0)
)

accounts$account[23]        <- "Northwind"
accounts$tenure_years[23]   <- 12.0
accounts$annual_revenue[23] <- 1000000
rownames(accounts) <- accounts$account

biggest <- accounts[order(-accounts$annual_revenue), c("tenure_years", "annual_revenue")]
head(biggest, 4)
#>           tenure_years annual_revenue
#> Northwind         12.0        1000000
#> C5                 5.5          29476
#> C33                3.7          27879
#> C28                7.3          27221
```

Thirty-nine of the accounts are ordinary small customers, one to eight years old and billing somewhere between 5,000 and 30,000 a year. Northwind is the enterprise client: twelve years old, a million a year, and nothing else on the list comes within a factor of thirty of it.

Now fit the model anyone would fit here, revenue on tenure.

```r
# Fit annual revenue on tenure and read the slope and its p-value
fit <- lm(annual_revenue ~ tenure_years, data = accounts)
round(coef(summary(fit)), 4)
#>                Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  -118216.25  54161.743 -2.1827   0.0353
#> tenure_years   30978.81   9471.464  3.2708   0.0023
```

Read the `tenure_years` row. Each extra year of tenure comes with 30,978.81 more revenue a year, and the p-value of 0.0023 clears every conventional bar there is. Written up, that is a finding: customers spend more the longer they stay.

Glance at the intercept while you are here. It says an account with zero tenure bills minus 118,216 a year, which nobody in the room believes. That is the first hint that the line is being pulled somewhere it does not want to go.

Here is the same fit as a picture.

```r
# Plot revenue against tenure with the fitted line drawn on
plot(accounts$tenure_years, accounts$annual_revenue,
     pch = 19, col = "grey40",
     xlab = "Tenure (years)", ylab = "Annual revenue",
     main = "Forty accounts, and the line fitted through them")
abline(fit, col = "red", lwd = 2)
text(accounts$tenure_years[23], accounts$annual_revenue[23],
     labels = "Northwind", pos = 2, cex = 0.8)
```

Thirty-nine points sit squashed along the bottom, because the y axis has to stretch to a million to fit Northwind in. The red line runs from below zero on the left up to Northwind on the right. Looking at that, you would not say the line describes the thirty-nine. You would say it is reaching for the one.

=== step === widget
## What one far-out row does to a fitted line

Before we measure anything, let's get a feel for what is going on. Here is the same shape in miniature.

Seven ordinary points sit in an upward band on the left. One extra point sits far out to the right, well past where the others stop, and its value is yours to move. The solid line is the least squares fit with that point included. The dashed line is the fit without it.

::widget leverage-point {}

Drag the slider up and down and watch the two lines. The dashed line never moves, because the seven ordinary points never change. The solid line swings to chase the far point wherever you put it, and the slope readout underneath tells you how far apart the two fits have got.

Now try one more thing. Put the far point back down near the dashed line and the two fits sit on top of each other, even though the point is still just as far out to the right. Being far out on its own was never enough. It had to be far out on the right *and* miss the line for anything to move.

That is the whole mechanism, and both halves of it have names.

=== step === quiz
## Quick check: which rows can move a model

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- A row with an unusually large revenue value, wherever it happens to sit on tenure. ::no
- A row that sits far from the rest on tenure, so the line has room to swing toward it. ::ok That is it. A big value in the middle of the crowd is held in place by its neighbours. A row out at the edge has no neighbours to argue with it, so the line is free to move.
- The row the line misses by the most, since the largest miss must be doing the most damage. ::no
- Any row more than three standard deviations from the mean revenue. ::no The three-sigma habit is about the outcome column alone, and a model is not fitted to one column. What decides whether a row can steer the line is where it sits on the predictor, plus whether the line misses it. A big value sitting in the middle of the crowd is pinned by its neighbours and moves nothing.

=== step === concept
## Leverage: how unusual a row's predictor values are

The first half is called **leverage**, written h, and it measures one thing: how far a row sits from the middle of the predictors. It is computed from the x column alone, and the y column never enters into it. A row can have enormous leverage and still sit perfectly on the line.

`hatvalues()` returns h for every row. Let's see who is furthest from the middle on tenure.

```r
# Score every account on how unusual its tenure is, and show the top three
h <- hatvalues(fit)
round(sort(h, decreasing = TRUE)[1:3], 4)
#> Northwind       C35       C37
#>    0.2384    0.1081    0.1043
```

Northwind sits at 0.2384. Is that a lot? Leverage comes with its own yardstick: the h values across all rows always average p/n, where p is the number of coefficients you fitted and n is the number of rows. Here that is 2 over 40.

```r
# The average leverage every model has to obey
round(mean(h), 3)
#> [1] 0.05
```

So the average account carries 0.05 of the fit and Northwind carries 0.2384, roughly five average accounts rolled into one row. The usual flag is twice the average, 2p/n, which is 0.1 here. Northwind is far past it, and C35 at 0.1081 is just over.

Hold on to that last one. C35 flagged on leverage and we never looked at its revenue at all, which is exactly the point of this half of the measurement.

=== step === concept
## The residual: how far the fit misses that row

Leverage says a row could move the line. Whether it actually does depends on the other half: does the fitted line miss that row?

The plain answer is the residual, the account's revenue minus what the line predicts for it. Northwind's is enormous.

```r
# Northwind's raw miss, in revenue
round(residuals(fit)["Northwind"], 0)
#> Northwind
#>    746471
```

The line, dragged as far up as it can go, still lands 746,471 short of Northwind. That number is true but hard to judge, because the same residual means one thing when the model is precise and another when it is loose.

`rstandard()` fixes that by dividing each residual by the standard error of that residual, which puts every account on one scale where 1 means one standard error out.

```r
# The same miss, standardized
round(rstandard(fit)["Northwind"], 2)
#> Northwind
#>      6.16
```

That is six standard errors out. Anything past 2 or 3 already asks for an explanation, so Northwind is not simply high, it is high in a way this line cannot reach.

=== step === concept
## Cook's distance puts leverage and residual in one number

We now have two numbers per row, and each one says half of something. Cook's distance is what you get when you multiply the two halves together.

\[ D_i = \frac{r_i^2}{p} \times \frac{h_i}{1 - h_i} \]

Every symbol in that formula is something you have already computed:

- \( D_i \) is Cook's distance for row i, the number we are after.
- \( r_i \) is that row's standardized residual, so \( r_i^2 \) is how badly the line misses it, squared to make the direction of the miss irrelevant.
- \( p \) is the number of coefficients in the model, 2 here for an intercept and a slope.
- \( h_i \) is that row's leverage, and \( h_i / (1 - h_i) \) stretches it: at h = 0.05 that factor is 0.053, at h = 0.24 it is 0.32, and as h approaches 1 it runs away to infinity.

The shape of that formula is the whole idea. Because the two halves are multiplied, either one of them at zero gives you zero: a row that sits perfectly on the line has no influence however far out it is, and a badly missed row in the middle of the crowd has almost none either. A row has to be odd on x **and** missed on y before it can steer anything.

That is also why you want Cook's distance as a single number instead of reading leverage and residuals separately. Neither column on its own tells you which rows are carrying the fit.

[KEY INSIGHT]
Cook's distance is leverage times residual, and it needs both. What it actually measures is how far all your fitted values move when row i is deleted and the model refitted, which is why it answers the question you started with.

=== step === concept
## Cook's distance for Northwind, worked out by hand

The formula is short enough to run yourself, so let's do that before calling any function. Northwind's standardized residual and its leverage are both already stored, and p is 2.

```r
# Rebuild Cook's distance for Northwind from its own residual and leverage
r_nw <- rstandard(fit)["Northwind"]
h_nw <- hatvalues(fit)["Northwind"]
p    <- 2

d_hand <- (r_nw^2 / p) * (h_nw / (1 - h_nw))
round(c(by_hand     = unname(d_hand),
        by_function = unname(cooks.distance(fit)["Northwind"])), 3)
#>     by_hand by_function
#>       5.939       5.939
```

Take the two factors apart for a second. The residual half, 6.16 squared over 2, comes to about 19. The leverage half, 0.2384 over 0.7616, comes to about 0.31. Multiply them and you land on 5.939, and `cooks.distance()` hands back exactly the same number.

So the function is not doing anything you cannot do by hand. It is doing that arithmetic for every row at once, which is the useful part.

```r
# Score all 40 accounts in one call and print the five largest
cd <- cooks.distance(fit)
round(sort(cd, decreasing = TRUE)[1:5], 4)
#> Northwind       C35       C37       C17       C25
#>    5.9385    0.0409    0.0390    0.0187    0.0179
```

Look at the gap. Northwind is at 5.9385 and the runner-up, C35, is at 0.0409. One account has about 145 times the influence of the next most influential account, and the other thirty-eight are nowhere. That is not a list of suspicious rows. That is one row and a long tail of ordinary ones.

=== step === quiz
## Quick check: high leverage, ordinary residual

C35 turned up in both lists you have run: a leverage of 0.1081, over the 0.1 flag, and a Cook's distance of 0.0409, which is nothing. What does that pair of numbers tell you about C35?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Its residual must be large too, because leverage and residual rise together. ::no
- Its residual must be ordinary. It had the opportunity to move the line and did not take it, so the other factor has to be small. ::ok Exactly. C35's standardized residual is 0.82, a completely unremarkable miss, and 0.82 squared kills the product no matter how unusual its tenure is. C35 is an old customer who bills what an old customer should.
- Nothing, because leverage and Cook's distance measure unrelated things. ::no
- That C35 is a data-entry error, since two of its numbers came out unusual. ::no Leverage and Cook's distance are two views of the same row, and one is built out of the other. Leverage is the opportunity to move the line; Cook's distance is the movement that actually happened. A big h beside a tiny D says the row had the opportunity and did nothing with it, which means its residual must be small. Nothing there suggests the row is wrong.

=== step === concept
## Reading the two influence plots, and what their cutoffs are worth

You do not have to sort the numbers yourself, because R will draw them. `plot()` on a fitted model takes a `which` argument, and two of its six plots are about influence.

The fourth one puts Cook's distance on the y axis and the row on the x axis, one spike per account, with the loudest few labelled. The common rule of thumb draws a line at 4/n, which is 0.1 for forty accounts.

```r
# Rank every account by Cook's distance, with the 4/n line drawn on
plot(fit, which = 4)
abline(h = 4 / nrow(accounts), col = "red", lty = 2)
```

One spike goes off the top of the plot and thirty-nine sit flat on the floor. Only Northwind crosses the red line, and it crosses it by a factor of nearly sixty.

The fifth plot is the more informative one, because it shows you both halves at once: leverage along the x axis, standardized residual up the y axis, and dotted contours of constant Cook's distance drawn over the top at 0.5 and 1.

```r
# Put the standardized residual against leverage, with Cook's contours
plot(fit, which = 5)
```

Read a point by asking two things. How far right does it sit, which is leverage, and how far up or down from zero, which is the miss. Points near the origin are unremarkable on both counts, and points past a contour are high on both at once. Northwind sits alone in the top right, outside every contour on the plot.

Now the part that matters more than the plots. Those cutoffs are conventions, not tests:

- **4/n**, the line you just drew, shrinks as your dataset grows, so it keeps flagging roughly the same small share of rows however clean they are. On ten thousand ordinary rows it hands you several hundred names, and almost none of them will matter.
- **0.5 and 1**, the contours R draws, are round numbers that came from the early literature and stuck.

None of them was derived from a distribution, and none of them tells you a row is wrong. They exist to sort the rows worth a look from the rows that are not.

[WARNING]
Crossing 4/n means look at this row. It does not mean the row is bad data, it does not mean the row should go, and it does not mean your result is wrong. Every one of those is a separate question the cutoff cannot answer.

=== step === tryit
## Your turn: read the plot, then name every account above the 4/n line

Reading a spike off a plot is fine while you are the only one looking at it. When somebody asks which customers are carrying a result, they want names, and names come from the numbers.

`cd` holds the Cook's distance of all forty accounts, named by account. Return the names of every account above the 4/n line.

```r
# cd holds each account name and its Cook's distance.
# nrow(accounts) is 40, so the 4/n line sits at 0.1.
# Return the names of the accounts above that line.
# One line. Press Check when you have it.
```
::check {"regex": "cd\\s*>\\s*(4\\s*/|0?\\.1)", "gate": true, "difficulty": "beginner", "ok": "One name comes back: Northwind. Forty accounts, one row above the line, and now you can say so by name rather than by pointing at a spike.", "no": "Compare the whole vector against the line and ask for the names: `names(which(cd > 4 / nrow(accounts)))`. Writing 0.1 in place of 4 / nrow(accounts) works the same way."}
::solution
```r
# Name every account whose Cook's distance clears the 4/n line
names(which(cd > 4 / nrow(accounts)))
#> [1] "Northwind"
```

Be careful about what that sentence is allowed to say. Northwind is above the line means Northwind is worth looking at. It does not yet mean the finding depends on Northwind, and those two claims are not the same size.

=== step === concept
## The leave-one-out refit: does the conclusion hold?

Cook's distance told you where to look. What happens next is not something the size of D can settle, because 5.9385 is a fact about arithmetic and the question in front of you is about your conclusion.

There is one honest way to answer it. Take the row out, fit the same model again, and put the two results side by side.

```r
# Refit without Northwind and compare the tenure slope both ways
fit_small <- lm(annual_revenue ~ tenure_years, data = accounts[-23, ])

round(rbind(
  with_northwind    = coef(summary(fit))["tenure_years", ],
  without_northwind = coef(summary(fit_small))["tenure_years", ]
), 4)
#>                     Estimate Std. Error t value Pr(>|t|)
#> with_northwind    30978.8091  9471.4637  3.2708   0.0023
#> without_northwind    96.1751   416.6929  0.2308   0.8187
```

Read the Estimate column first. The tenure effect goes from 30,978.81 a year to 96.18 a year, which is about three tenths of one percent of what it was. In business terms, an extra year of tenure looked like thirty-one thousand and turns out to be ninety-six, which is not a number anybody would plan around.

Then read the last column. The p-value goes from 0.0023 to 0.8187. A result that cleared every conventional bar on all forty accounts cannot even see the bar on thirty-nine.

So the whole finding lived in one row. Not most of it, not a helpful chunk of it. All of it.

[KEY INSIGHT]
Cook's distance is a search tool, and the leave-one-out refit is the decision tool. Report the second one, because a reader does not care how large D was. They care whether your answer survives.

=== step === quiz
## Quick check: reading the with-and-without table

The slope fell from 30,978.81 to 96.18 and the p-value climbed from 0.0023 to 0.8187 when one account came out. What have you established?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Northwind's numbers must be wrong, since a correct row would not do that to a model. ::no
- That the tenure finding rests entirely on one account. That is a fact about how much evidence you have, not a verdict on the row. ::ok Right. The row did nothing wrong by existing. What collapsed is your claim, because it turned out to be supported by one customer rather than by forty.
- That 96.18 is the true effect, so report the smaller model and move on. ::no
- Nothing much: 0.0023 came from all forty accounts, so it is still the number to publish. ::no Both fits are real fits of real data, and neither is automatically the honest one. The full-sample p-value of 0.0023 describes forty accounts of which one is doing all the work, so publishing it alone tells a reader something the data does not support. The comparison is the finding, and it says the evidence for a tenure effect is one row deep.

=== step === concept
## Four honest things to do with an influential row

Now the question you came with. You have found the row, you have run the refit, and the answer moved. What do you actually do?

There are four defensible moves, and which one is right depends entirely on why the row is unusual, never on what it does to your p-value.

| Option | When it is the right call | What you show |
|---|---|---|
| Keep it, and report both fits | The row is valid data, whether or not the conclusion survives | The with-and-without comparison, so the reader sees exactly what the row is worth |
| Investigate and correct it | The value is a recording or entry error you can verify against the source | The corrected value and where the correction came from, never a silent edit |
| Down-weight it | Genuine extreme values you will not delete but do not want dominating the fit | The robust and least squares estimates side by side |
| Drop it, for a stated reason | The case falls outside the population you meant to study, on a criterion fixed before you saw its effect | The criterion itself, and when you set it |

One move is not on that list, and it is the one people reach for first: deleting the row because the result looks better without it. That is not a data decision, it is a results decision, and it inflates false positives the same way picking your analysis after seeing the data does.

It is also the move a reviewer is trained to look for. Anyone who suspects a point was removed to rescue a p-value will stop trusting the rest of the paper too, which is a high price for one row.

[TIP]
The test for whether a deletion is honest is simple. Could you have written the removal rule down before you saw its effect on the estimate? If yes, state the rule and drop the row. If no, keep the row and report both fits.

=== step === concept
## What to do about Northwind, and the sentence you would publish

Run those four options against Northwind and three of them close immediately.

Northwind is a real enterprise client billing a real million a year, so there is nothing to correct. Down-weighting is for when several genuine extremes are all leaning on a fit and you still want one line that describes everybody, and here there is exactly one, so shrinking its pull would give you a line that is neither the forty-account answer nor the thirty-nine-account one. It belongs to the population you were studying, business accounts at this company, so there is no pre-set criterion that excludes it. And the only reason to delete it would be that the finding disappears when you do, which is the one reason you are not allowed to use.

So you keep it, and you report both fits.

```r
# Print the two slopes the published sentence has to carry
slopes <- c(all_40      = unname(coef(fit)["tenure_years"]),
            without_one = unname(coef(fit_small)["tenure_years"]))
round(slopes, 1)
#>      all_40 without_one
#>     30978.8        96.2
```

Here is the sentence those two numbers turn into, in the form a reviewer or a director can read without needing your code:

> Revenue rose with tenure across all forty accounts (30,979 per year, p = 0.0023), but the association was carried by a single enterprise client. Excluding that account, the estimate fell to 96 per year (p = 0.82). We therefore report the tenure effect as specific to that one account rather than as a general pattern in the customer base.

Notice what the sentence does. It names the row, gives the estimate with and without, and states the conclusion that follows, so a reader is holding the same evidence you used to decide.

And notice what you have gained. The first fit said revenue grows with tenure, which was wrong. The pair of fits says the customer base shows no detectable tenure effect and one enterprise account is very large, which is true, and a good deal more useful to the people who have to act on it.

=== step === quiz
## Practice: what a large Cook's distance entitles you to do

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- To delete the row, since anything past 4/n counts as an outlier by definition. ::no
- To look at the row and refit without it. The size of D says where to look, and what you do next comes from why the row is unusual and what the refit showed. ::ok That is the whole discipline in one line. The statistic sends you to a row, the refit tells you what the row is worth, and the reason the row is unusual decides which of the four responses you get to use.
- To report the model without the row as your main result, with the full model as a footnote. ::no
- To keep the row and say nothing about it, since a valid observation is never removed. ::no Keeping a valid row is usually right, but keeping it silently is not. A reader cannot tell a model that was checked and held from one that was never checked, so the with-and-without comparison goes in the write-up either way. And deleting is not banned outright: it is allowed on a criterion you fixed before you saw its effect.

=== step === tryit
## Practice: separate the leverage from the influence

Here is the sharpest test of whether the two halves have come apart in your head.

Northwind's tenure of twelve years is not changing. Only its revenue changes: set it to 19,874, which is what the other thirty-nine accounts predict for a twelve-year customer, and refit. Then print its leverage and its Cook's distance from the new fit, and see which one moved.

```r
# accounts holds the 40 rows, and Northwind is row 23.
# Copy the data, set Northwind's revenue to 19874, and refit.
# Then print Northwind's leverage and Cook's distance from the new fit,
# next to the ones from the original fit.
# Press Check when you have them.
```
::check {"regex": "19874", "gate": true, "difficulty": "intermediate", "ok": "Leverage does not budge: 0.2384 before and 0.2384 after. Cook's distance falls from 5.9385 to effectively zero. Same row, same tenure, same distance from the middle of the x column, no influence at all.", "no": "Copy the frame first so the original survives: `alt <- accounts`, then `alt$annual_revenue[23] <- 19874`, refit with `lm(annual_revenue ~ tenure_years, data = alt)`, and pull `hatvalues()` and `cooks.distance()` for Northwind out of the new fit."}
::solution
```r
# Move Northwind onto the line the other 39 accounts imply, then remeasure it
alt <- accounts
alt$annual_revenue[23] <- 19874
fit_alt <- lm(annual_revenue ~ tenure_years, data = alt)

round(c(leverage_before = unname(hatvalues(fit)["Northwind"]),
        leverage_after  = unname(hatvalues(fit_alt)["Northwind"])), 4)
#> leverage_before  leverage_after
#>          0.2384          0.2384

round(c(cooks_before = unname(cooks.distance(fit)["Northwind"]),
        cooks_after  = unname(cooks.distance(fit_alt)["Northwind"])), 4)
#> cooks_before  cooks_after
#>       5.9385       0.0000
```

Leverage is fixed by the x column and you never touched the x column, so it could not move. Influence needed the miss as well, and once the miss went, so did all of it.

=== step === tryit
## Practice: report the sensitivity in two numbers

This is the thing people actually ask you for, so it is worth being able to produce without thinking.

`fit` is the model on all forty accounts and `cd` holds every account's Cook's distance. Find the most influential account by name rather than by typing 23, refit without it, and put the tenure slope and its p-value from both fits into one table.

```r
# fit is the model on all 40 accounts; cd holds their Cook's distances.
# Find the most influential account BY NAME, refit without it, and put
# the tenure slope and its p-value from both fits into one table.
# Press Check when you have it.
```
::check {"regex": "which\\.max", "gate": true, "difficulty": "advanced", "ok": "That is the sensitivity analysis: 30,978.81 at p = 0.0023 on all forty, 96.18 at p = 0.8187 without Northwind. Finding the row by name instead of by index means the same code works on the next dataset you point it at.", "no": "Get the name with `worst <- names(which.max(cd))`, then subset with `accounts[rownames(accounts) != worst, ]` and stack the two rows with `rbind()`, pulling `coef(summary(...))[\"tenure_years\", c(\"Estimate\", \"Pr(>|t|)\")]` from each fit."}
::solution
```r
# Find the most influential account, refit without it, and compare the slope
worst <- names(which.max(cd))
worst
#> [1] "Northwind"

fit_out <- lm(annual_revenue ~ tenure_years,
              data = accounts[rownames(accounts) != worst, ])

round(rbind(
  all_accounts  = coef(summary(fit))["tenure_years", c("Estimate", "Pr(>|t|)")],
  without_worst = coef(summary(fit_out))["tenure_years", c("Estimate", "Pr(>|t|)")]
), 4)
#>                 Estimate Pr(>|t|)
#> all_accounts  30978.8091   0.0023
#> without_worst    96.1751   0.8187
```

Two rows, four numbers, and the question is closed. Present that table alongside your result and nobody has to ask whether you checked.

=== step === concept
## References

- [Detection of Influential Observation in Linear Regression](https://doi.org/10.1080/00401706.1977.10489493) - Cook (1977), Technometrics 19(1), 15-18. The paper the statistic comes from, including the deleted-fitted-values interpretation.
- [Regression Diagnostics: Identifying Influential Data and Sources of Collinearity](https://doi.org/10.1002/0471725153) - Belsley, Kuh and Welsch (1980), Wiley. Hat values, the leverage cutoffs, and the per-coefficient DFBETAS measures.
- [An R Companion to Applied Regression](https://www.john-fox.ca/Companion/) - Fox and Weisberg (2019), 3rd edition, Sage. The chapter on unusual and influential data, worked in R.
- [Regression deletion diagnostics](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html) - R Core Team, the documentation for `influence.measures()`, listing `cooks.distance()`, `hatvalues()` and the flag R applies to each.
- [False-Positive Psychology](https://doi.org/10.1177/0956797611417632) - Simmons, Nelson and Simonsohn (2011), Psychological Science 22(11), 1359-1366. Why a deletion decided after seeing its effect on the result inflates false positives.

=== step === complete
## Quick recap

You started with a significant trend and finished knowing it belonged to one customer. The route there is short enough to keep in your head:

- Cook's distance is leverage times residual, and it needs both. A row out on the edge that sits on the line moves nothing, and a badly missed row in the middle moves almost nothing either.
- You computed it by hand for Northwind, 6.16 squared over 2 times 0.2384 over 0.7616, and got 5.939. That is the same number `cooks.distance()` returns, and it does that arithmetic for all forty rows at once.
- The cutoffs send you to look, and that is all they do. 4/n flagged one account here; on ten thousand rows it would hand you several hundred that mean nothing.
- The leave-one-out refit is what decides. The slope went from 30,978.81 at p = 0.0023 to 96.18 at p = 0.8187, so the finding was one row deep.
- There are four honest responses: keep it and show both fits, correct a verifiable error, down-weight it, or drop it on a criterion you fixed in advance. Deleting because the result improves is the one move off the table.

Next time you fit a model that matters, run `cooks.distance()` on it before you write the sentence, and refit without whatever it flags. If your answer survives, you have a stronger result than you had before. If it does not, you have just saved yourself from publishing a customer.
