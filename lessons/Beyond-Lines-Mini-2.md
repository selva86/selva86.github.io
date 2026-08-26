---
title: "Poisson regression: model count data right"
slug: "Beyond-Lines-Mini-2"
description: "A straight line predicts negative counts. Fit a Poisson model in R instead, read every coefficient as a rate multiplier, and check the spread it assumes."
keywords: "Poisson regression in R, count data regression, glm family poisson, log link, rate ratio, exponentiate coefficient, overdispersion, negative binomial regression"
mathjax: true
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "beyond-straight-lines"
course_title: "Beyond Straight Lines"
course_lesson: "2"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Beyond-Lines-Mini-1"
course_next: ""
curriculum_id: "0.0.45"
lesson_access: "windowed"
catalog_blurb: "How to model counts so your predictions never fall below zero."
---

=== step === cover
::eyebrow Beyond Straight Lines
## Poisson regression: model count data right

Let's say you run support for a business software product.

Every month each of your customers files some number of tickets. One files two, the next files none, another files eleven. You want to know what drives that number, because if you can predict it you can staff for it. The obvious suspects are the plan they pay for, how long they have been with you, and how big their company is.

So you fit a regression, the same way you would for revenue or for weight or for anything else, and it quietly goes wrong.

It predicts minus half a ticket for your quietest customers. And it assumes the wobble around a prediction of 1 ticket is exactly as wide as the wobble around a prediction of 50, which anyone who has watched a support queue knows is false.

Counts are their own kind of data, and they need their own model.

That model is Poisson regression, and there are three moves in it.

::widget process-flow {"steps":[{"title":"Model the rate","sub":"work on the log of the ticket rate, never on the count itself"},{"title":"Fit it in one line","sub":"the same formula you would hand lm, plus family = poisson"},{"title":"Read the multipliers","sub":"exp of a coefficient says how many times the rate changes"}]}

By the end of today you will have fitted one yourself, and you will be able to say out loud what a coefficient of 0.5879 means: enterprise customers file 1.80 times as many tickets as basic customers. That multiplier reading is the part most people never learn.

=== step === concept
## Nine hundred customers and the tickets they filed

We need data before we can model anything, so let's make some.

These 900 customers are built right here instead of loaded from a file, and that is deliberate. Building them means we know the true answer in advance. I have planted a real enterprise effect in the data, so when the model hands back a number later you can grade it against what went in.

Each customer gets four columns: the plan they pay for, how many months they have been with us, how many seats they have bought, and the number of support tickets they filed last month. That last column is the thing we want to explain.

Press Run.

```r
# Build 900 support customers and the tickets each one filed last month
set.seed(140)
n_customers <- 900

plan_type <- sample(c("basic", "pro", "enterprise"), n_customers,
                    replace = TRUE, prob = c(0.5, 0.3, 0.2))
tenure <- round(runif(n_customers, 1, 36))    # months as a customer
seats  <- round(runif(n_customers, 5, 250))   # paid seats on the account

log_rate <- 0.55 + 0.30 * (plan_type == "pro") +
            0.588 * (plan_type == "enterprise") -
            0.02 * tenure + 0.05 * (seats / 10)
tickets <- rnbinom(n_customers, size = 3, mu = exp(log_rate))

support <- data.frame(plan_type, tenure, seats, tickets)
head(support)
#>    plan_type tenure seats tickets
#> 1 enterprise      3   112       4
#> 2 enterprise     35    14       2
#> 3        pro     29    26       2
#> 4        pro      2    50       5
#> 5 enterprise     31    58       2
#> 6 enterprise      9    45       1
```

The number to hold on to from that block is 0.588. It is the amount the enterprise plan adds inside `exp()`, and `exp(0.588)` is 1.8004. So enterprise accounts in this data really do file 1.80 times as many tickets as basic accounts on the same tenure and the same seats. That is the truth the model has to find on its own, from the ticket counts alone.

Now look at the outcome column by itself, because its shape is the whole reason this model exists.

```r
# Count how many customers filed 0 tickets, 1 ticket, 2 tickets, and so on
table(tickets = support$tickets)
#> tickets
#>   0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  19  21  22
#> 122 184 145 135 109  66  37  25  19  17  11   4   7   2   3   3   6   2   1   1
#>  25
#>   1

# Compare the average number of tickets with how much they vary
round(c(mean = mean(support$tickets), variance = var(support$tickets)), 2)
#>     mean variance
#>     3.22    10.21
```

Three things stand out. There is a hard floor at zero, and 122 customers are sitting on it. There are no halves and no negatives, only whole numbers. And the counts do not fall away neatly on both sides of the average: they pile up low and then trail off to the right, one customer all the way out at 25.

The last line is the one to remember. The average is 3.22 tickets and the variance is 10.21, more than three times as large. Hold that number.

=== step === concept
## What a straight line predicts for your quietest customer

The natural first move is to fit the model you already trust. So let's do that and see what it gives us.

One piece of the formula needs a word first. Writing `I(seats / 10)` tells R to divide seats by ten before fitting, so the seats coefficient comes out per ten seats rather than per single seat. The `I()` wrapper is there because arithmetic inside a formula would otherwise be read as formula syntax rather than as division.

```r
# Fit an ordinary straight line to the ticket counts and see what it predicts
line_fit <- lm(tickets ~ plan_type + tenure + I(seats / 10), data = support)

range(round(fitted(line_fit), 2))
#> [1] -0.56  7.30
sum(fitted(line_fit) < 0)
#> [1] 15
```

The lowest fitted value is minus 0.56 tickets, and fifteen customers were handed a number below zero. Let's see who they are.

```r
# Show the customers the straight line hands a negative number of tickets
below_zero <- support[fitted(line_fit) < 0, ]
below_zero$line_says <- round(fitted(line_fit)[fitted(line_fit) < 0], 2)
head(below_zero, 5)
#>     plan_type tenure seats tickets line_says
#> 35      basic     32     8       2     -0.52
#> 76      basic     27     8       2     -0.16
#> 156     basic     28     8       1     -0.23
#> 256     basic     33    10       0     -0.56
#> 535     basic     26    11       0     -0.03
```

They are exactly who you would guess: long-standing basic accounts with a handful of seats. These are the quiet ones. Customer 35 filed two tickets last month and the model says minus 0.52.

That is not a rounding annoyance you can shrug off. It means the model does not know that its outcome has a floor. Nothing stops it from walking straight through zero, and the further the quiet end of your customer base stretches, the further through zero it walks.

[WARNING]
Any model that can return a negative number is the wrong shape for a count. Clipping the prediction at zero afterwards does not fix it, because the coefficients were fitted by a method that believed negatives were possible in the first place.

=== step === concept
## Why the spread grows with the count

The second failure is quieter than the first, and it does more damage.

Ordinary regression assumes one fixed noise width. Whatever the model predicts, the leftover scatter around that prediction is supposed to be about the same size everywhere. Here is what that assumption looks like when it holds and when it does not. Switch between the first two panels below.

::widget residual-plot {"start": "funnel"}

The healthy panel is a flat band of the same thickness all the way across. The funnel is what count data actually does. Let's measure which of the two we have.

We can sort our customers by what the straight line predicted for them, cut that into four equal groups, and then ask how much the real ticket counts vary inside each group.

```r
# Compare the average and the variance of tickets across four bands of fitted value
band <- cut(fitted(line_fit),
            breaks = quantile(fitted(line_fit), probs = seq(0, 1, 0.25)),
            include.lowest = TRUE,
            labels = c("lowest", "second", "third", "highest"))

data.frame(fitted_band  = levels(band),
           mean_tickets = round(tapply(support$tickets, band, mean), 2),
           variance     = round(tapply(support$tickets, band, var), 2),
           row.names    = NULL)
#>   fitted_band mean_tickets variance
#> 1      lowest         1.65     2.22
#> 2      second         2.45     4.53
#> 3       third         3.07     5.55
#> 4     highest         5.72    19.31
```

Read the two number columns together. In the quietest quarter of customers the average is 1.65 tickets and the variance is 2.22. In the busiest quarter the average is 5.72 and the variance is 19.31. The average went up by about three and a half times, and the variance by nearly nine.

So the noise is not one width. It grows with the count. Here is the same fact as a picture, drawn from our own model rather than from an illustration.

```r
# Plot the residuals of the straight line against the values it predicted
plot(fitted(line_fit), resid(line_fit),
     pch = 16, col = rgb(0, 0, 0, 0.35),
     xlab = "fitted tickets", ylab = "residual",
     main = "Residuals of the straight line, against what it predicted")
abline(h = 0, col = "red", lwd = 2)
```

On the left the points hug the red line within a ticket or two either side. On the right they spray out five and ten tickets away. That is the funnel, in the data we are actually modelling. And it matters for a practical reason. Standard errors, confidence intervals and p-values are all computed from an assumed noise width. When the real width changes across the range, every one of those numbers is quoting a spread that is wrong nearly everywhere.

Two failures, then, from one wrong choice of model: the floor, and the fan.

=== step === quiz
## Quick check: what goes wrong when you fit a line to counts?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Nothing serious. The predictions come out a little off at the edges, but the coefficients and their standard errors are still fine to report. ::no
- It can predict counts below zero, and it assumes the spread around every prediction is one fixed width when the real spread grows with the count. ::ok Both, and they are separate problems. Fifteen customers got a negative prediction, and the variance climbed from 2.22 in the quietest quarter to 19.31 in the busiest one. The first failure is embarrassing in a meeting; the second one silently corrupts every standard error the model reports.
- It rounds every prediction to a whole number, so small differences between customers disappear. ::no
- It cannot use the plan column at all, because a straight line needs every predictor to be numeric. ::no A straight line handles a text column fine, by turning it into indicators, and it never rounds anything. The two real failures are the ones you saw: predictions that fall below zero, and an assumed noise width that stays constant while the true spread grows with the count.

=== step === concept
## The Poisson distribution, and the one number behind it

If a straight line is the wrong shape, we need a description of counts that is the right shape. The standard one is the Poisson distribution.

A Poisson describes how many times something happens in a fixed window: tickets in a month, calls in an hour, arrivals in a day. It only ever gives whole numbers, it never goes below zero, and it has exactly one parameter, the average rate. Call that rate mu. Once you fix mu, everything else about the distribution is fixed along with it.

R's own Poisson functions call that same rate `lambda` rather than mu. It is one number under two letters, and you will meet both. The function `dpois(k, lambda)` gives the probability of seeing exactly k events when the average is lambda. Let's draw that shape at two rates that matter to us, roughly our overall average of 3.2 tickets and roughly the busiest quarter's 5.7.

```r
# Draw the Poisson shape at two ticket rates, side by side
par(mfrow = c(1, 2))
barplot(dpois(0:15, lambda = 3.2), names.arg = 0:15,
        col = "grey85", border = "white",
        main = "Poisson at a rate of 3.2", xlab = "tickets in a month")
barplot(dpois(0:15, lambda = 5.7), names.arg = 0:15,
        col = "grey85", border = "white",
        main = "Poisson at a rate of 5.7", xlab = "tickets in a month")
par(mfrow = c(1, 1))
```

Both shapes start at zero, lean left, and trail off to the right. Raise the rate and the whole pile slides right and spreads out at the same time. That second half is the important bit, and it is worth measuring rather than eyeballing.

```r
# Draw 5,000 months at each of those two rates and compare the mean with the variance
set.seed(4)
at_low  <- rpois(5000, lambda = 3.2)
at_high <- rpois(5000, lambda = 5.7)

round(c(mean_at_3.2 = mean(at_low),  variance_at_3.2 = var(at_low),
        mean_at_5.7 = mean(at_high), variance_at_5.7 = var(at_high)), 2)
#>     mean_at_3.2 variance_at_3.2     mean_at_5.7 variance_at_5.7
#>            3.18            3.17            5.69            5.58
```

At a rate of 3.2 the mean came out 3.18 and the variance 3.17. At a rate of 5.7 the mean is 5.69 and the variance 5.58. In a Poisson the variance equals the mean, always, and there is no second knob to turn.

That is the funnel, built into the distribution rather than bolted on afterwards. Predict a bigger count and the Poisson automatically expects a wider spread around it, which is exactly the behaviour our ticket data showed and the straight line refused to allow.

[NOTE]
The equal-variance rule cuts both ways. It gives you the growing spread for free, but it also means you cannot ask a Poisson for more spread than that. Whether our tickets are content with the amount it allows is a question we owe the model later.

=== step === concept
## Why the model works on the log of the rate

We have a distribution for the counts. Now we need to connect it to the plan, the tenure and the seats. This is the design choice everything else in the model follows from, so it is worth going slowly.

Give each customer their own expected rate and call it mu. The obvious thing would be to write mu as a straight sum of the predictors. That fails immediately, because a sum of terms can land anywhere on the number line, including below zero, and a rate cannot.

So we do not model mu. We model the log of mu.

$$\log(\mu) = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \beta_3 x_3 + \beta_4 x_4$$

Reading that left to right: mu is the customer's expected ticket count, beta-nought is the log rate for a customer whose predictors are all zero or at their reference level, and each other beta is what one unit of its predictor adds to the log rate. This arrangement is called the log link, because log is the function that links the rate to the straight-line part.

Now undo the log on both sides, and you get the same statement as a rate.

$$\mu = e^{\beta_0 + \beta_1 x_1 + \beta_2 x_2 + \beta_3 x_3 + \beta_4 x_4}$$

The sum inside the exponent is free to be anything at all, positive or negative, huge or tiny. The rate that comes out of `exp()` is not. Watch.

```r
# Show that exp() of any number at all, however extreme, is still above zero
log_scale <- c(-40, -5, -1, 0, 1, 3)
data.frame(log_rate = log_scale, rate = exp(log_scale))
#>   log_rate         rate
#> 1      -40 4.248354e-18
#> 2       -5 6.737947e-03
#> 3       -1 3.678794e-01
#> 4        0 1.000000e+00
#> 5        1 2.718282e+00
#> 6        3 2.008554e+01
```

Feed `exp()` a log rate of minus 40, an absurd value no real model would produce, and it returns `4.248354e-18`. That is R's shorthand for a decimal point followed by seventeen zeros and then 4248354. It is vanishingly small, and still above zero.

There is the guarantee. The straight-line part can wander wherever the data pulls it, and the prediction that reaches you has already been passed through `exp()`, so a negative predicted count is not merely unlikely. It is impossible.

[KEY INSIGHT]
Poisson regression models the log of the rate, not the rate itself. That single choice is what keeps predictions positive, and it is also what makes every coefficient a multiplier rather than an amount.

=== step === concept
## Fitting it in one line with glm(family = poisson)

The fitting itself is almost boring, which is the nicest thing about it. It is the same formula you gave `lm()`, with one different function and one extra argument.

```r
# Fit the Poisson regression: the same formula as before, with one extra argument
pois_fit <- glm(tickets ~ plan_type + tenure + I(seats / 10),
                data = support, family = poisson)

summary(pois_fit)
#>
#> Call:
#> glm(formula = tickets ~ plan_type + tenure + I(seats/10), family = poisson,
#>     data = support)
#>
#> Coefficients:
#>                      Estimate Std. Error z value Pr(>|z|)
#> (Intercept)          0.560358   0.059265   9.455   <2e-16 ***
#> plan_typeenterprise  0.587925   0.046392  12.673   <2e-16 ***
#> plan_typepro         0.373932   0.044361   8.429   <2e-16 ***
#> tenure              -0.022907   0.001879 -12.189   <2e-16 ***
#> I(seats/10)          0.052735   0.002653  19.881   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>
#>     Null deviance: 2472.4  on 899  degrees of freedom
#> Residual deviance: 1765.4  on 895  degrees of freedom
#> AIC: 4067.4
#>
#> Number of Fisher Scoring iterations: 5
```

Let's walk the coefficient block one column at a time.

- The row names tell you what each coefficient compares. R turned the plan column into indicators and used basic as the reference level, because it comes first alphabetically, so `plan_typeenterprise` and `plan_typepro` are both comparisons against basic.
- `Estimate` is the coefficient itself, and it lives on the log-rate scale. That is why enterprise reads 0.587925 rather than anything that looks like a number of tickets.
- `Std. Error` is how precisely that estimate is pinned down, also on the log scale.
- `z value` is the estimate divided by its standard error, and `Pr(>|z|)` is the p-value that goes with it. The `<2e-16` in every row is R telling you the p-value is smaller than the smallest number it will print.

One line further down is worth marking now: the residual deviance, 1765.4 on 895 degrees of freedom. We will need both of those numbers when we ask whether this model deserves to be trusted.

And one warning before you get attached to any of it. Do not read the Estimate column as tickets. As it stands, 0.587925 is not a quantity of anything a support manager cares about. Turning it into one takes a single function.

=== step === concept
## What exp() does to a coefficient

Here is the move that turns all of that into English.

```r
# Turn every coefficient into a multiplier on the ticket rate
round(exp(coef(pois_fit)), 4)
#>         (Intercept) plan_typeenterprise        plan_typepro              tenure
#>              1.7513              1.8002              1.4534              0.9774
#>         I(seats/10)
#>              1.0542
```

The enterprise entry reads 1.8002. Enterprise customers file 1.80 times as many tickets as basic customers on the same tenure and the same seats.

Why exponentiating does that is worth seeing rather than accepting. Take two customers who are identical except for the plan. On the log scale the model says their log rates differ by exactly the enterprise coefficient, 0.5879. Subtracting logs is dividing, so once you undo the log you are left with a ratio.

$$\frac{\mu_{\text{enterprise}}}{\mu_{\text{basic}}} = e^{0.5879} = 1.80$$

You can do that arithmetic by hand and watch it land.

```r
# Work the enterprise multiplier out by hand from its own coefficient
enterprise_coef <- unname(coef(pois_fit)["plan_typeenterprise"])
round(enterprise_coef, 4)
#> [1] 0.5879
round(exp(enterprise_coef), 4)
#> [1] 1.8002
```

Now compare that with what we planted. The data was built with 0.588 added inside `exp()` for enterprise accounts, a true multiplier of 1.8004. The model saw only the four columns and the ticket counts, never the recipe, and it came back with 1.8002. It found the answer.

Two things about the word multiplier tend to get lost.

It multiplies a rate, so it is not an amount added on. A quiet customer whose rate is 1 ticket goes to 1.8 tickets, and a busy one at 10 goes to 18. The multiplier is the same for both, the change in tickets is not.

And it is a ratio, so the neutral value is 1, not 0. Above 1 the predictor raises the rate, below 1 it lowers the rate, and exactly 1 means it does nothing at all.

[KEY INSIGHT]
A Poisson coefficient is a log-rate difference and means nothing in tickets until you exponentiate it. `exp(coefficient)` is how many times the rate changes: 1.80 for enterprise means 80 percent more tickets, not 0.59 more tickets and not 80 percent as many.

=== step === quiz
## Quick check: reading the pro coefficient

The pro row of that same model came back at 0.3739. Which sentence says what it means?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Pro customers file 0.37 more tickets a month than basic customers do. ::no
- Pro customers file about 1.45 times as many tickets as basic customers, everything else held fixed. ::ok Right. `exp(0.3739)` is 1.4534, so the pro rate is about 1.45 times the basic rate, which you can also say out loud as roughly 45 percent more tickets.
- Pro customers file 37 percent of the tickets that basic customers file. ::no
- Pro customers file 0.3739 times as many tickets as basic customers. ::no A Poisson coefficient is a log-rate difference, so it is neither an amount of tickets nor a percentage nor a multiplier until you exponentiate it. `exp(0.3739)` is 1.4534, so pro customers file about 1.45 times as many tickets as basic ones. Reading 0.3739 as the multiplier itself would say pro customers file fewer tickets, which is backwards.

=== step === concept
## Multipliers for tenure and seats, and how they compound over a bigger step

Plan is a category, so its multiplier compares one level against the reference. Tenure and seats are numbers, and that changes what the multiplier is attached to.

For a numeric predictor, the multiplier is per one unit of that predictor. Tenure is measured in months, so its multiplier of 0.9774 is per extra month. It sits below 1, which means the ticket rate falls slightly as an account gets older: about 2.3 percent lower for each additional month.

That per-month figure is honest but useless in a conversation. Nobody plans staffing around one month. The question is what a year does.

The wrong instinct is to multiply 0.9774 by twelve. Multipliers do not add up like that. Twelve months of the same effect stack on top of each other, so you raise the multiplier to the twelfth power. The tidier way to write the same thing is to multiply the coefficient by twelve first and exponentiate once, because adding on the log scale is what multiplying on the rate scale looks like.

```r
# Scale the per-unit multipliers up to a full year of tenure
b_tenure <- unname(coef(pois_fit)["tenure"])
b_seats  <- unname(coef(pois_fit)["I(seats/10)"])

round(c(tenure_per_month = exp(b_tenure),
        tenure_per_year  = exp(b_tenure * 12),
        seats_per_ten    = exp(b_seats)), 4)
#> tenure_per_month  tenure_per_year    seats_per_ten
#>           0.9774           0.7597           1.0542
```

A year of tenure multiplies the ticket rate by 0.7597. The same customer, twelve months later, is expected to file about three quarters of the tickets they file today. Told that way it is a real finding: accounts get less noisy as people learn the product.

Seats works the same way, with one wrinkle already built into the formula. Because it divided seats by ten, the coefficient is per ten seats, and 1.0542 says ten more seats multiply the rate by about 1.05. Sales teams do not talk in ten-seat units either, so the same compounding has to carry that number up to whatever jump you actually care about.

[NOTE]
The rule for any numeric predictor: to move it by k units, multiply its coefficient by k and then exponentiate once. `exp(b * k)` is the multiplier for a k-unit move, and it is the same thing as the one-unit multiplier raised to the power k.

=== step === tryit
## Your turn: what does fifty more seats do to the rate?

An account manager wants to know what happens when a customer buys fifty extra seats. You have the coefficient, and you have the rule. Work out the multiplier for a fifty-seat jump.

Careful with the units. `b_seats` is the coefficient for `I(seats / 10)`, so it moves the rate per ten seats, not per one.

```r
# Turn the per-ten-seat coefficient into the multiplier for fifty extra seats
# b_seats is already in the session; it is the coefficient on the log scale.
# One line, rounded to 4 places. Press Check when you have it.
```
::check {"regex": "b_seats\\s*[*]\\s*5(?![0-9])|5(?![0-9])\\s*[*]\\s*b_seats|\\^\\s*5(?![0-9])", "gate": true, "difficulty": "beginner", "ok": "That is it: 1.3017. Fifty more seats multiply a customer's ticket rate by about 1.30, so roughly 30 percent more tickets a month. That is a number a capacity plan can actually use.", "no": "Fifty seats is five of the model's ten-seat units, so multiply the coefficient by 5 before exponentiating: exp(b_seats * 5). Raising the per-ten multiplier to the fifth power gets you the same answer."}
::solution
```r
# Scale the per-ten-seat multiplier up to a jump of fifty seats
round(exp(b_seats * 5), 4)
#> [1] 1.3017
```

=== step === concept
## How sure are we about 1.80?

A single number on its own invites more confidence than it has earned. The model saw 900 customers and one month of their tickets, and another 900 would hand back a slightly different number. So put an interval around it.

The interval is built on the log scale first, then carried across with `exp()`, exactly the way the coefficient was. Because `exp()` always turns a bigger number into a bigger number, the low end stays the low end and the high end stays the high end, so both ends survive the trip in order.

```r
# Put a 95 percent confidence interval around every multiplier
round(exp(confint.default(pois_fit)), 3)
#>                     2.5 % 97.5 %
#> (Intercept)         1.559  1.967
#> plan_typeenterprise 1.644  1.972
#> plan_typepro        1.332  1.585
#> tenure              0.974  0.981
#> I(seats/10)         1.049  1.060
```

The enterprise multiplier runs from 1.644 to 1.972. So the honest version of the headline is that enterprise customers file somewhere between about 1.6 and 2.0 times as many tickets as basic ones. The 1.8004 we planted sits comfortably inside that range.

The number to compare each interval against is 1, not 0. A multiplier of 1 is a predictor that changes nothing, so an interval sitting entirely above 1 says the predictor raises the rate, and one sitting entirely below 1 says it lowers the rate. Tenure's interval, 0.974 to 0.981, is wholly below 1: the decline with age is real, and it is small.

`confint.default()` is the fast version, built straight from the estimate and its standard error. R also has `confint()`, which refits the model repeatedly to profile the likelihood and is a little more accurate on small samples. On 900 rows the two agree closely enough that the fast one is fine.

=== step === concept
## Predicting how many tickets one customer will file

Coefficients are for explaining. Predictions are for planning. Let's take two accounts and ask the model what next month looks like for each.

Both have been customers for six months and both bought 120 seats. The only difference between them is the plan.

```r
# Predict a month of tickets for two customers who differ only in plan
two_customers <- data.frame(plan_type = c("enterprise", "basic"),
                            tenure    = c(6, 6),
                            seats     = c(120, 120))

two_customers$expected_tickets <- round(
  predict(pois_fit, newdata = two_customers, type = "response"), 2)
two_customers
#>    plan_type tenure seats expected_tickets
#> 1 enterprise      6   120             5.17
#> 2      basic      6   120             2.87
```

The argument doing the work is `type = "response"`. Leave it out and `predict()` hands back the log rate, because that is the scale the model was fitted on. Ask for the response and R runs the answer through `exp()` for you, so what arrives is an expected count of tickets.

Notice that neither number is a whole number, and that is right. 5.17 is an average over many months of accounts like this one. In any single month that customer files 4 or 7 or 2. What the model is saying is that if you had a hundred such accounts you would budget for about 517 tickets between them.

Now divide one by the other.

```r
# Divide one expected count by the other
round(two_customers$expected_tickets[1] / two_customers$expected_tickets[2], 3)
#> [1] 1.801
```

There is 1.80 again, arriving from a completely different direction. It turned up first as `exp()` of a coefficient, and now it turns up as the ratio of two predicted ticket counts. Same number, because that is what a multiplier on the rate scale means: hold everything else fixed, switch the plan, and the expected count is multiplied by 1.80.

=== step === concept
## Does the variance really equal the mean here?

The model just promised 5.17 tickets for that enterprise account. Read the fine print and it promised something else at the same time. In a Poisson the variance equals the mean, so it also claims the spread around 5.17 is 5.17. If the true spread is wider than that, every standard error and every interval you just read is too small.

You might reach back for the raw numbers: an average of 3.22 against a variance of 10.21. It is tempting, but that comparison is not proof. The rate legitimately differs from customer to customer, and pooling groups with different rates inflates the overall variance all by itself. The honest check has to be made after the model has accounted for the predictors.

The tool for that sits in the summary output we already have. Residual deviance measures how far the fitted model is from a perfect fit, and when the Poisson assumption holds it lands near its degrees of freedom. So the ratio of the two should be near 1.

```r
# Compare the residual deviance with its degrees of freedom
round(c(residual_deviance = deviance(pois_fit),
        degrees_of_freedom = df.residual(pois_fit),
        ratio = deviance(pois_fit) / df.residual(pois_fit)), 2)
#>  residual_deviance degrees_of_freedom              ratio
#>            1765.37             895.00               1.97
```

The ratio comes back at 1.97. The counts are about twice as spread out as a Poisson is willing to allow. That condition has a name, overdispersion, and as a rough working rule a ratio under about 1.2 is fine while anything approaching 2 needs dealing with.

Here is what overdispersion looks like in general. The bars below are a different sample of counts, not our tickets, and the line is the model's own fitted shape. Start on Poisson and watch where the line fails to reach the bars.

::widget count-dist {}

The Poisson line falls short at the zero bar and runs out before the tail does. A distribution with only one knob cannot stretch to cover both ends at once. Switch to the negative binomial and the tail comes into range, because that distribution carries a second parameter whose only job is to let the variance exceed the mean.

=== step === concept
## Quasi-Poisson and negative binomial: what actually changes

There are two standard repairs for overdispersion, and they work in different places.

Quasi-Poisson leaves the coefficients exactly alone. It estimates how much wider the spread really is and multiplies every standard error by the square root of that. It is a correction to the uncertainty, nothing more.

The negative binomial goes further and swaps the distribution itself for one with a second parameter, so the variance is free to sit above the mean. Because the fitting changes, the coefficients can move a little too.

Let's fit both on the same formula and put the standard errors side by side.

```r
# Refit the same model two more ways and line the standard errors up side by side
library(MASS)

quasi_fit <- glm(tickets ~ plan_type + tenure + I(seats / 10),
                 data = support, family = quasipoisson)
nb_fit <- glm.nb(tickets ~ plan_type + tenure + I(seats / 10), data = support)

round(data.frame(poisson      = summary(pois_fit)$coefficients[, 2],
                 quasipoisson = summary(quasi_fit)$coefficients[, 2],
                 negbinomial  = summary(nb_fit)$coefficients[, 2]), 4)
#>                     poisson quasipoisson negbinomial
#> (Intercept)          0.0593       0.0833      0.0801
#> plan_typeenterprise  0.0464       0.0652      0.0665
#> plan_typepro         0.0444       0.0623      0.0617
#> tenure               0.0019       0.0026      0.0026
#> I(seats/10)          0.0027       0.0037      0.0037
```

Every standard error grows by roughly 40 percent. The enterprise row goes from 0.0464 to 0.0652. That is the size of the lie the plain Poisson was telling you about its own precision.

Now look at the coefficients themselves.

```r
# Compare the enterprise multiplier across the three fits
round(c(poisson      = exp(coef(pois_fit))[[2]],
        quasipoisson = exp(coef(quasi_fit))[[2]],
        negbinomial  = exp(coef(nb_fit))[[2]]), 4)
#>      poisson quasipoisson  negbinomial
#>       1.8002       1.8002       1.7700
```

The three multipliers read 1.8002, 1.8002 and 1.7700. Quasi-Poisson is identical by construction, and the negative binomial moved by three hundredths. Everything you learned to say out loud about the enterprise plan survives untouched.

What does move is the width around it. Here is that same enterprise multiplier carrying the negative binomial's own interval.

```r
# Put the negative binomial's interval around the enterprise multiplier
round(exp(confint.default(nb_fit))["plan_typeenterprise", ], 3)
#>  2.5 % 97.5 %
#>  1.554  2.016
```

From 1.554 to 2.016, against the Poisson's 1.644 to 1.972. Same reading, wider and more honest. That is the interval worth quoting from here on.

One number picks between the two count models.

```r
# AIC is defined for the Poisson and the negative binomial, not for quasi-Poisson
round(c(poisson = AIC(pois_fit), negbinomial = AIC(nb_fit)), 1)
#>     poisson negbinomial
#>      4067.4      3812.8
```

AIC scores how well a model describes the data with a penalty for extra parameters, and lower is better. 3812.8 against 4067.4 is a clear win for the negative binomial. Quasi-Poisson is missing from that comparison for a real reason: it has no likelihood of its own, so `AIC()` returns NA for it, and there is nothing to compare.

And that win is a second planted truth turning up. Look back at how the tickets were built: `rnbinom()`, a count generator carrying exactly the extra spread a Poisson is not allowed to hold. The dispersion ratio dug that out of the ticket counts alone, the same way the coefficient dug out 1.80.

[KEY INSIGHT]
Overdispersion costs you certainty, not the multipliers. The enterprise standard error was understated by 40 percent while the multiplier itself moved only from 1.8002 to 1.7700. So do not throw out the reading, widen the interval around it.

=== step === quiz
## Practice: which sentence reports the enterprise result correctly?

You have the model, the multiplier, the interval and the dispersion check. Somebody now needs one sentence for a document. Which of these is it?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The enterprise plan raises tickets by 0.59 per customer per month, and the result is significant. ::no
- Enterprise customers file about 1.80 times as many tickets as basic customers, all else held equal, and the 95 percent interval runs from 1.64 to 1.97. ::ok That is the shape of an honest count result: a multiplier, and an interval around it. One refinement you now know to make. With dispersion at 1.97 those Poisson limits are too tight, so the interval worth quoting is the negative binomial one, which runs from 1.55 to 2.02.
- The enterprise coefficient is 0.5879 with a p-value below 0.001, so plan type matters. ::no
- Enterprise customers file 80 percent of the tickets that basic customers file. ::no A count result is reported as a multiplier with an interval around it. `exp(0.5879)` is 1.80, so enterprise customers file 1.80 times as many tickets, which is 80 percent more than basic customers rather than 80 percent as many, and it is not 0.59 tickets more. A raw coefficient with a p-value beside it tells your reader neither how big the effect is nor how sure of it you are.

=== step === tryit
## Practice: fit the negative binomial and compare the pro interval

You have just seen what overdispersion does to the enterprise standard error. Now find out what it does to a whole interval, on a different predictor.

Both fits are already in the session, `pois_fit` and `nb_fit`. Pull the pro multiplier interval out of each and print them together, so you can see the two ranges one above the other. The row you want is named `plan_typepro`.

```r
# Print the pro multiplier interval from the Poisson fit and the negative binomial fit
# pois_fit and nb_fit are both in the session already.
# Exponentiate each interval, keep the plan_typepro row, and stack the two.
# Round to 3 places. Press Check when you have them.
```
::check {"regex": "glm[.]nb|confint[^)]*nb_fit", "gate": true, "difficulty": "intermediate", "ok": "Exactly. The Poisson says 1.332 to 1.585 and the negative binomial says 1.293 to 1.647. The centre barely moved, 1.4534 against 1.4591, while the range got about 40 percent wider. That extra width is the honesty the plain Poisson was withholding.", "no": "Build each row with exp(confint.default(fit)) and then subset it by name, so exp(confint.default(pois_fit)) followed by the plan_typepro row in square brackets. Do the same for nb_fit, then put the two rows together with rbind()."}
::solution
```r
# Compare the pro multiplier interval from the two fits, side by side
pro_poisson <- exp(confint.default(pois_fit))["plan_typepro", ]
pro_negbin  <- exp(confint.default(nb_fit))["plan_typepro", ]

round(rbind(poisson = pro_poisson, negbinomial = pro_negbin), 3)
#>             2.5 % 97.5 %
#> poisson     1.332  1.585
#> negbinomial 1.293  1.647
```

=== step === quiz
## Practice: what does a dispersion ratio of 2 cost you?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The coefficients come out biased, so every multiplier read off the Poisson fit is wrong and has to be discarded. ::no
- Nothing much. A ratio near 2 is ordinary for count data and needs no action. ::no
- The standard errors come out too small, so intervals are too narrow and p-values too small, while the point estimates stay roughly where they were. ::ok Yes, and that is what makes it dangerous. Nothing in the output looks broken. The multipliers you would quote barely moved, 1.8002 to 1.7700, while every standard error was understated by about 40 percent, and that part nobody sees unless they check.
- The model can no longer produce predictions, so `predict()` stops working. ::no Overdispersion is a statement about spread, not about the fitted rates. Predictions still work and the multipliers barely move; what breaks is the uncertainty around them. A ratio near 2 means the standard errors are understated by roughly 40 percent, so intervals come out too narrow and p-values too small, and that is worth fixing rather than ignoring.

=== step === concept
## References

- [Regression Analysis of Count Data, 2nd edition](https://doi.org/10.1017/CBO9781139013567) - Cameron and Trivedi (2013), Cambridge University Press. The standard reference on count models, overdispersion tests and the negative binomial.
- [Generalized Linear Models, 2nd edition](https://doi.org/10.1201/9780203753736) - McCullagh and Nelder (1989), Chapman and Hall. Where the log link and the quasi-likelihood dispersion correction are laid out.
- [Modern Applied Statistics with S, 4th edition](https://www.stats.ox.ac.uk/pub/MASS4/) - Venables and Ripley (2002), Springer. The book behind the MASS package and its negative binomial fitting.
- [Fitting generalized linear models](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html) - R Core Team, the documentation for `glm()`.
- [Family objects for models](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/family.html) - R Core Team, the poisson and quasipoisson families and the link functions they accept.

=== step === complete
## Quick recap

You started with 900 customers, a straight line that predicted minus half a ticket, and a fan of residuals that got wider the more it predicted. You finished with a model that cannot do either of those things, and with a way of reading it out loud.

- Counts have a floor at zero and a spread that grows with the average, so a straight line is the wrong shape twice over.
- Poisson regression models the log of the rate, which is what makes a negative prediction impossible.
- The fit is `glm(formula, family = poisson)`, and its estimates arrive on the log scale, worth nothing in tickets until you exponentiate them.
- `exp(coefficient)` is a multiplier on the rate. Enterprise came back at 1.80 against a planted truth of 1.80, and for a numeric predictor you scale it with `exp(b * k)` for a k-unit move.
- The Poisson also promises that the variance equals the mean. Check it with the residual deviance over its degrees of freedom, and when that ratio comes back near 2, widen the standard errors with quasi-Poisson or the negative binomial.

And the sentence you can now say in a meeting without being wrong:

"Enterprise customers file about 1.8 times as many tickets as basic customers on the same tenure and seat count, somewhere between 1.55 and 2.02 once we allow for how spread out the counts are."

That is your count outcome modelled properly, floor and fan and all. Nice work today.
