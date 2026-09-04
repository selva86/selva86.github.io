---
title: "Interaction effects: test and interpret them"
slug: "Regression-Reading-Mini-1"
description: "A coupon lifts order value for new customers but not for regulars. Fit an interaction term in R, read all four coefficient rows, and test the two slopes."
keywords: "interaction effects in R, interaction term in lm, interpret interaction coefficient, anova model comparison, centring predictors, simple slopes in R, moderation in R"
mathjax: false
webr: true
date: "2026-09-04"
post_type: "LESSON"
course_id: "reading-model-output"
course_title: "Reading Regression Models"
course_lesson: "1"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: ""
course_next: "Regression-Reading-Mini-2"
curriculum_id: "0.0.5"
lesson_access: "windowed"
catalog_blurb: "Fit and read a model where one predictor's effect depends on another."
---

=== step === cover
::eyebrow Reading Regression Models
## Interaction effects: test and interpret them

Today we are going to look at what happens when one predictor's effect depends on the value of another, and at how to read a model that allows for it.

An online store ran a coupon test. 240 customers took part, 120 of them new to the store and 120 regulars who had ordered before. Each one was randomly given a discount coupon worth somewhere between 0 and 30 percent off, and the store recorded the value of the order that followed.

The store wants to know what a deeper discount is worth. Put that way it sounds like one question with one number for an answer.

There is a reason to doubt that. A first-time buyer and someone who already orders every month are in very different positions when a coupon arrives, so the same discount can move one of them a long way and the other hardly at all. When that happens, a single discount effect is an average over two different responses, and it can sit far from both of them.

So there are three things to do with this data.

::widget process-flow {"steps":[{"title":"Compare the two customer types","sub":"average order value at each discount depth, new against regular"},{"title":"Fit one model with an interaction term","sub":"the discount slope is allowed to differ by customer type"},{"title":"Test the difference in slopes","sub":"anova() against the model without the interaction term"}]}

Each move takes a few lines of R, and together they give a discount effect that differs by customer type and a test of whether that difference is more than noise.

=== step === concept
## The coupon test and the data it produced

Every number from here on comes out of one small data frame, so we build it first. Each row is one customer: `segment` says whether they were new or a regular, `discount` is the depth of the coupon they were given in percent, and `spend` is the value of the order in dollars.

```r
# Build the 240-customer coupon test and look at the first few rows
set.seed(5)
segment    <- rep(c("new", "regular"), each = 120)
discount   <- sample(seq(0, 30, by = 5), 240, replace = TRUE)
mean_spend <- ifelse(segment == "new", 60 + 0.9 * discount, 85 - 0.1 * discount)
spend      <- round(mean_spend + rnorm(240, sd = 22), 1)

coupons <- data.frame(segment, discount, spend)
head(coupons)
#>   segment discount spend
#> 1     new        5  40.4
#> 2     new       10  62.9
#> 3     new        0  70.2
#> 4     new       30  70.4
#> 5     new       10  58.3
#> 6     new        0  40.4
```

`set.seed(5)` fixes the random draws so your rows match mine. `sample()` deals out the seven coupon depths, 0, 5, 10, 15, 20, 25 and 30 percent, at random, which is what makes this a test rather than a pile of coupons the store chose to send to its favourite customers. The `rnorm(240, sd = 22)` on the end is the ordinary customer-to-customer variation any real order book has.

The first thing most people do with two groups is average them.

```r
# Average order value for each customer type
round(tapply(coupons$spend, coupons$segment, mean), 1)
#>     new regular
#>    70.8    86.3
```

Regulars spent 86.3 dollars per order and new customers 70.8, a gap of 15.5 dollars. That gap is worth knowing. But notice what it leaves out: it says nothing at all about the coupon, because it averages over every discount depth at once.

=== step === widget
## Does order value rise with the discount for both customer types?

To see what a coupon does, hold the customer type fixed and follow order value across the discount depths. `aggregate()` gives exactly that, one mean per customer type and depth.

```r
# Average order value at each discount depth, within each customer type
cell_means <- aggregate(spend ~ discount + segment, data = coupons, FUN = mean)
cell_means$spend <- round(cell_means$spend, 1)
cell_means
#>    discount segment spend
#> 1         0     new  49.8
#> 2         5     new  60.7
#> 3        10     new  74.5
#> 4        15     new  79.4
#> 5        20     new  74.4
#> 6        25     new  73.3
#> 7        30     new  84.8
#> 8         0 regular  90.9
#> 9         5 regular  79.4
#> 10       10 regular  90.0
#> 11       15 regular  86.4
#> 12       20 regular  81.7
#> 13       25 regular  90.0
#> 14       30 regular  84.1
```

Read the new-customer rows first. Order value climbs from 49.8 dollars at no discount to 84.8 at 30 percent off, wobbling on the way as averages of small groups do. Now read the regular rows: 90.9 at the top, 84.1 at the bottom, and nothing that could be called a climb in between.

That pattern has a name. When the effect of one predictor on the outcome depends on the level of a second predictor, the two are said to **interact**, and the extra term you put in a model to let that happen is an **interaction term**. Here the effect of `discount` on `spend` depends on `segment`.

A column of 14 numbers is hard to compare. Below, those same 14 cell means are plotted. The second button splits them into one panel per customer type, and Run draws the real chart.

::widget facet-grid {"data":[{"x":0,"y":49.8,"facet":"new"},{"x":5,"y":60.7,"facet":"new"},{"x":10,"y":74.5,"facet":"new"},{"x":15,"y":79.4,"facet":"new"},{"x":20,"y":74.4,"facet":"new"},{"x":25,"y":73.3,"facet":"new"},{"x":30,"y":84.8,"facet":"new"},{"x":0,"y":90.9,"facet":"regular"},{"x":5,"y":79.4,"facet":"regular"},{"x":10,"y":90.0,"facet":"regular"},{"x":15,"y":86.4,"facet":"regular"},{"x":20,"y":81.7,"facet":"regular"},{"x":25,"y":90.0,"facet":"regular"},{"x":30,"y":84.1,"facet":"regular"}],"geom":"point","x":"discount","y":"mean order value","facetVar":"segment"}

In one chart the two sets of points overlap and the climb is easy to miss. Split into panels, the new-customer points rise from left to right, while the regular points bounce around 86 and drift in no direction at all. Those are two different slopes, and no single line can be both of them.

=== step === quiz
## Quick check: what the two panels show

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- A deeper discount raises order value by the same amount for both customer types. ::no
- A deeper discount raises order value for new customers, and does close to nothing for regulars. ::ok That is what the two panels say. It is one effect with two answers, depending on which customer type you ask about.
- The discount does nothing at all, since one of the two panels is flat. ::no
- Regulars simply spend more than new customers, and that is the whole story. ::no Regulars do spend more, and their panel is flat, but neither of those is the point on its own. The panels sit side by side so you can compare the two climbs, and the climbs differ: about 35 dollars across the range for new customers, nothing much for regulars. An effect that was the same in both panels would show up as two runs of points with the same steepness.

=== step === concept
## The additive model and the single slope it gives

Start with the model most people write first. `lm(spend ~ discount + segment)` asks for the effect of the discount and the effect of the customer type, added together.

```r
# Fit the model without an interaction and read its coefficients
add <- lm(spend ~ discount + segment, data = coupons)
round(coef(summary(add)), 3)
#>                Estimate Std. Error t value Pr(>|t|)
#> (Intercept)      65.104      3.020  21.560    0.000
#> discount          0.397      0.152   2.619    0.009
#> segmentregular   15.624      2.990   5.225    0.000
```

The `discount` row is a slope: each extra discount point is worth 0.397 dollars of order value. The `segmentregular` row, 15.624, is how far a regular's order sits above a new customer's at the same depth. R names the row after the level it is measuring, `regular`, and measures it against the reference level, `new`, which is the reference only because it comes first alphabetically.

The `+` in that formula is doing more work than it looks. It says the discount slope is one number for everybody, so the model draws one line for new customers and one for regulars and forces them to run parallel, 15.6 dollars apart at every depth.

```r
# Draw the two parallel lines the additive model fits
cols <- ifelse(coupons$segment == "new", "grey35", "tomato")
plot(coupons$discount, coupons$spend, col = cols, pch = 16,
     xlab = "discount (percent)", ylab = "order value (dollars)",
     main = "One discount slope for both customer types")
abline(a = coef(add)[1], b = coef(add)[2], col = "grey35", lwd = 3)
abline(a = coef(add)[1] + coef(add)[3], b = coef(add)[2], col = "tomato", lwd = 3)
legend("topleft", c("new", "regular"), col = c("grey35", "tomato"),
       pch = 16, bty = "n")
```

Look at the job 0.397 has to do. The new-customer points climb steadily across the range, the regular points hold flat, and a single slope has to serve both. It splits the difference and comes out too shallow for the new customers and too steep for the regulars, which is a fair description of a number that fits nobody.

=== step === concept
## Adding the interaction term so the slope can differ

Change one character in the formula and the parallel constraint goes away. `discount * segment` expands to `discount + segment + discount:segment`, so you get both original terms plus a cross term that lets the discount slope move with the customer type.

```r
# Fit the model with an interaction term and read its four rows
int <- lm(spend ~ discount * segment, data = coupons)
round(coef(summary(int)), 3)
#>                         Estimate Std. Error t value Pr(>|t|)
#> (Intercept)               57.412      3.699  15.520    0.000
#> discount                   0.939      0.216   4.348    0.000
#> segmentregular            30.133      5.121   5.884    0.000
#> discount:segmentregular   -1.025      0.297  -3.451    0.001
```

There are four rows now instead of three, and the new one is `discount:segmentregular`. The colon is how R writes "discount crossed with segment", and the row is named for the level being compared, exactly as `segmentregular` is.

Here is the sentence to hold on to. That estimate of -1.025 is not a slope. It is the difference between two slopes, and it says how much steeper or shallower the discount line runs for regulars than it does for new customers.

Which means the table gives you the two slopes in pieces, and you add them back up.

```r
# Rebuild each customer type's discount slope from the coefficient rows
coefs <- coef(int)
new_slope     <- coefs["discount"]
regular_slope <- coefs["discount"] + coefs["discount:segmentregular"]

round(c(new = unname(new_slope), regular = unname(regular_slope)), 3)
#>     new regular
#>   0.939  -0.087
```

For a new customer, every extra discount point buys 0.939 dollars of order value. For a regular it buys -0.087 dollars, which is as close to nothing as 120 orders can measure. All three numbers are in the same units, dollars of order value per discount point: the two slopes, and the -1.025 that connects them.

[KEY INSIGHT]
The interaction row is a difference of slopes, not a slope. Read it on its own and you will report -1.025 as though it were the discount effect for regulars. The discount effect for regulars is 0.939 + (-1.025), which is -0.087.

=== step === concept
## What the discount and segment rows mean once the interaction is in

Two rows quietly changed meaning when the cross term arrived, and this is where most misreadings start.

`discount` is now 0.939. That is not an average discount effect across all 240 customers. It is the discount slope for the reference customer type on its own, the new customers, because the -1.025 adjustment only switches on for regulars.

`segmentregular` is now 30.133, and it is not the average gap between the two types either. It is the gap at a discount of exactly 0, because 0 is where that coefficient measures the distance between the two fitted lines. The lines start there and close in on each other as the discount deepens, so where you measure the gap decides what the gap is.

Nothing is wrong with 30.133. But a gap measured at a discount of 0 is an odd thing to report when the average coupon in the test was 14.15 percent. You can move the measuring point: subtract the mean from `discount` before fitting, and 0 on the new scale means an average-sized coupon.

```r
# Refit with the discount centred at its mean, then read the same four rows
mean(coupons$discount)
#> [1] 14.14583

coupons$discount_c <- coupons$discount - mean(coupons$discount)
int_c <- lm(spend ~ discount_c * segment, data = coupons)
round(coef(summary(int_c)), 3)
#>                           Estimate Std. Error t value Pr(>|t|)
#> (Intercept)                 70.691      2.067  34.195    0.000
#> discount_c                   0.939      0.216   4.348    0.000
#> segmentregular              15.627      2.924   5.345    0.000
#> discount_c:segmentregular   -1.025      0.297  -3.451    0.001
```

Compare the two tables row by row. The slope is still 0.939 and the interaction is still -1.025, because centring moves where you measure, not how steep anything is. The segment row has gone from 30.133 to 15.627, which is the gap between the two types at an average coupon, and that is a number you could put in front of the store.

It is worth knowing why 15.627 lands so near the 15.624 the additive model reported. That model forced the two lines to be parallel, so it had one gap to give and gave it for the whole range. Centring moves the interaction model's measuring point to the middle of that range, and the two numbers land together.

[NOTE]
Keep both `discount` and `segment` in the model for as long as `discount:segment` is in it. This is the hierarchical principle. Drop one of them and the cross term is left measuring a difference from a baseline the model no longer contains, so the estimate starts depending on where the zero of your predictor happens to sit rather than on the data.

=== step === concept
## Reading the model as one slope per customer type

Coefficient arithmetic is fine for you and hopeless for the person you report to. `predict()` turns the same four rows into order values, and order values everyone can read.

```r
# Predict order value at three discount depths for each customer type
pred_grid <- expand.grid(discount = c(0, 15, 30), segment = c("new", "regular"))
pred_grid$fitted <- round(predict(int, newdata = pred_grid), 1)
pred_grid
#>   discount segment fitted
#> 1        0     new   57.4
#> 2       15     new   71.5
#> 3       30     new   85.6
#> 4        0 regular   87.5
#> 5       15 regular   86.2
#> 6       30 regular   84.9
```

`expand.grid()` builds every combination of the values you hand it, six rows here, and `predict()` fills in what the fitted model expects for each. The three new-customer rows climb from 57.4 to 85.6 dollars, a gain of 28.2 across the full 30 points. The three regular rows drift from 87.5 down to 84.9, a fall of 2.6 dollars across that same range.

The two ends of that table are the interaction stated in money. With no coupon, regulars order 30.1 dollars more than new customers. At 30 percent off they order 0.7 dollars less. The coupon has closed a gap that was worth 30 dollars a head, and it did so by moving the new customers rather than the regulars.

[TIP]
Report the two slopes, or a small table like this one. "New customers spend 0.94 dollars more per discount point, regulars spend nothing more" is a sentence the store can act on. "The interaction coefficient is -1.025" is not.

=== step === widget
## Is the difference between the two slopes bigger than sampling noise?

0.939 against -0.087 certainly looks like a real difference. But each of those numbers came from 120 customers, and an estimate built on 120 customers wobbles. Two customer types who respond to a coupon in precisely the same way would still hand back two slightly different fitted slopes, so the question is whether a gap this wide can be explained by that wobble alone.

The interaction row already carries the answer. Its estimate is -1.025 and its standard error is 0.297, and a standard error is how far an estimate of this kind moves from one repeat of the test to the next. Measuring the estimate in those units gives -1.025 / 0.297, which is the -3.451 printed in the `t value` column: the difference in slopes sits about 3.45 standard errors from zero. The formal version compares the two models head to head.

```r
# Test the difference in slopes: the interaction row, then the two models compared
round(coef(summary(int))["discount:segmentregular", ], 3)
#>   Estimate Std. Error    t value   Pr(>|t|)
#>     -1.025      0.297     -3.451      0.001

anova(add, int)
#> Analysis of Variance Table
#>
#> Model 1: spend ~ discount + segment
#> Model 2: spend ~ discount * segment
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)
#> 1    237 127133
#> 2    236 121026  1    6106.1 11.907 0.0006625 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

`anova()` on two models asks what the extra term bought. The additive model leaves 127133 of squared error unexplained, the interaction model leaves 121026, and the F statistic of 11.907 on 1 and 236 degrees of freedom weighs that drop against the single parameter it cost. Its p-value is 0.00066. And 11.907 is that t value squared, because with a single interaction term the two tests are the same test written twice.

Below, that p-value is drawn as an area. The curve is the spread of differences in slopes you would see across repeated tests if the two customer types really did respond alike, measured in standard errors from zero, and the shaded tails are the results at least as far out as ours.

::widget null-distribution {"tails": 2, "start": 3.45, "max": 4, "label": "difference in slopes, in standard errors from zero"}

The slider starts at 3.45, our result, and the tails there are thin slivers. Its readout rounds to three decimals and shows 0.001 where `anova()` gave 0.00066, close enough to say the same thing. The `H0` in that readout is the usual shorthand for the assumption a test starts from, which here is that the two slopes are equal.

Drag the slider back towards zero and watch the shaded area swell. Park it at one standard error and roughly a third of the curve is shaded, which is another way of saying a gap that size would be an entirely ordinary result if the two customer types responded alike.

One caution before you take this test into a meeting. The standard error on the interaction row, 0.297, is wider than the 0.216 on the discount row it is built from, and that is the usual state of affairs: a difference between two slopes is always estimated less precisely than either slope alone. So a large p-value on an interaction term is weak evidence that the two slopes are equal, not good evidence.

[WARNING]
0.00066 says a difference this large would be rare if the two slopes were equal. It says nothing about how large the difference is. That part is the -1.025, and it is the number worth arguing over.

=== step === tryit
## Your turn: fit each customer type on its own

There is a second route to the same two slopes, and it is worth walking once because it shows what the one model has been doing all along. Split the 240 rows by customer type and fit an ordinary straight line to each half on its own.

```r
# coupons has 240 rows and three columns: segment, discount and spend.
# Split it in two by customer type, then fit spend against discount
# separately inside each half.
# Print the coefficients of both fits. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*lm\\s*[(])(?=[\\s\\S]*((subset|filter)\\s*[(]|coupons\\s*[[]))", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.939 for the new customers and -0.087 for the regulars, the same two slopes the single model gave, reached from the other side.", "no": "Not yet. Build each half first with subset(coupons, segment == ...), one for the new customers and one for the regulars, then run lm(spend ~ discount, data = ...) on each half."}
::solution
```r
# Fit each customer type on its own and print both sets of coefficients
new_only <- subset(coupons, segment == "new")
reg_only <- subset(coupons, segment == "regular")

new_fit <- lm(spend ~ discount, data = new_only)
reg_fit <- lm(spend ~ discount, data = reg_only)

round(coef(new_fit), 3)
#> (Intercept)    discount
#>      57.412       0.939
round(coef(reg_fit), 3)
#> (Intercept)    discount
#>      87.546      -0.087
```

Two separate fits, and out come 57.412 with a slope of 0.939 for the new customers, and 87.546 with a slope of -0.087 for the regulars. Those are the two lines the interaction model was describing: its intercept and `discount` row are the new-customer line, and adding `segmentregular` and `discount:segmentregular` to them gives you the regular line.

So why fit one model rather than two? Because two separate fits leave you no way to ask whether the difference between the slopes is real. They also estimate the noise twice, off 120 rows each, where the single model pools all 240 for that job. Keeping the comparison inside one model is what makes `anova()` possible at all.

=== step === quiz
## Quick check: what the test result lets you report

The store's marketing lead asks what came out of the coupon test. Which of these reports the model correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A discount point is worth -1.025 dollars of order value to a regular customer. ::no
- Regular customers order 30.13 dollars more than new customers, on average. ::no
- A discount point is worth 0.94 dollars of order value to a new customer and -0.09 to a regular, and a difference that large would be unlikely if the two responded alike. ::ok Exactly. That is two slopes in units the store already uses, plus a word on whether the difference between them survives the noise.
- A discount point is worth 0.40 dollars of order value, to every customer alike. ::no Three of these quote a real number from a real output and still get the model wrong. -1.025 is the difference between the two slopes, not the regular slope. 30.133 is the gap at a discount of 0, not an average. And 0.397 came from the additive model, which holds both customer types to a single slope.

=== step === concept
## References

- [Data Analysis Using Regression and Multilevel/Hierarchical Models](https://www.stat.columbia.edu/~gelman/arm/) - Gelman and Hill (2007), Cambridge University Press. Chapters 3 and 4 work through interactions and centring with the same coefficient-by-coefficient care used here.
- [Understanding Interaction Models: Improving Empirical Analyses](https://doi.org/10.1093/pan/mpi014) - Brambor, Clark and Golder (2006), Political Analysis 14(1), 63-82. The standard reference on keeping the lower-order terms in, and on why the interaction coefficient alone is not the result.
- [Model Formulae](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html) - R Core Team, the documentation for `formula` in the stats package. What `*` and `:` expand to, and the rest of the formula operators.
- Multiple Regression: Testing and Interpreting Interactions - Aiken and West (1991), Sage. The book-length treatment of centring and of reporting one slope per group.

=== step === complete
## Quick recap

You took one coupon test apart and got a separate answer for each type of customer.

- The two types moved differently with the discount: the new-customer means climbed from 49.8 to 84.8 dollars while the regular means sat near 85 the whole way.
- The additive model reduced all of that to one slope, 0.397 dollars per discount point, which fitted neither group.
- `discount * segment` gave four rows, and the interaction row, -1.025, is the difference between two slopes. Add it to 0.939 and you have -0.087, the regular slope.
- Once that cross term is in, the lower-order rows are read at a reference point: 0.939 is the slope for new customers alone, and 30.133 is the gap at a discount of 0. Centre the discount and that gap becomes 15.627 at an average coupon.
- `anova()` on the two models gave F = 11.907 on 1 and 236 degrees of freedom, p = 0.00066, so the difference between the slopes is more than the wobble in an estimate built on 120 orders.

Which makes the report a single sentence:

"A discount point adds about 0.94 dollars to a new customer's order and nothing to a regular's, and the two are far enough apart that we would not put it down to chance."

Next time we look at the five assumptions a linear model rests on, and the check that catches each one.
