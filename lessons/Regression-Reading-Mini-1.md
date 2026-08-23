---
title: "Interaction effects: test and interpret them"
slug: "Regression-Reading-Mini-1"
description: "A coupon lifts new customers and does nothing for regulars. Fit the interaction in R, decode all four coefficients, test it, and report one effect per group."
keywords: "interaction effects in R, interaction term in lm, interpret interaction coefficients, anova nested model test, moderation in R, reference level, simple slopes, cross term"
mathjax: true
webr: true
date: "2026-08-23"
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
catalog_blurb: "Why one average can describe neither group, and how to model both."
---

=== step === cover
::eyebrow Reading Regression Models
## Interaction effects: test and interpret them

Let's say an online store mails a discount coupon to half of its customer list. Four hundred customers are on that list and two hundred of them get a coupon, and at the end of the month somebody asks the obvious question: did the coupon do anything?

You fit the obvious model and it says the coupon was worth about two dollars a head, and that number cannot even clear the usual significance bar. So the sensible call is to shut the program down and stop giving money away.

That call is wrong.

And you already know why from ordinary life. A coupon mostly works on the people who were still deciding. The regulars were going to buy anyway, so a discount just hands them money they never needed. Split those same four hundred customers into new and regular, and the coupon adds about \$14 a head for a new customer while costing about \$2 on a regular one.

One average of \$2 described neither group.

That is an interaction: the effect of one thing depends on another thing. Today let's find one in real data, put it inside a model, and read the answer back without tying your brain in knots.

Here is the shape of the whole thing.

::widget process-flow {"steps":[{"title":"Split the customers","sub":"new accounts on one side, regulars on the other"},{"title":"Let the effect differ","sub":"fit the coupon and the customer type together with a cross term"},{"title":"Read one effect per group","sub":"plus 14 dollars for a new customer, minus 2 for a regular"}]}

Three moves, and the third one is where most people go wrong.

=== step === concept
## The coupon test and the four averages it produced

Let's get the campaign on the table first, because every number after this comes out of it.

Four hundred customers of one online store took part. For each one we know how many months they have been with the store, whether they were sent the discount coupon, and what they spent over the following month in dollars. Half the list got a coupon and half did not.

We build the campaign in code, so every figure here is one you can rerun and poke at yourself. Press Run.

```r
# Build the coupon campaign data and look at the first few customers
set.seed(42)
tenure_months <- sample(0:24, 400, replace = TRUE)
coupon        <- factor(rep(c("no", "yes"), length.out = 400), levels = c("no", "yes"))
customer_type <- factor(ifelse(tenure_months < 6, "new", "regular"), levels = c("new", "regular"))

spend <- 42 + 1.1 * tenure_months +
         (coupon == "yes") * (16 - 1.3 * tenure_months) +
         rnorm(400, mean = 0, sd = 9)

store <- data.frame(tenure_months, coupon, customer_type, spend = round(spend, 1))
head(store)
#>   tenure_months coupon customer_type spend
#> 1            16     no       regular  55.8
#> 2             4    yes           new  51.6
#> 3             0     no           new  43.8
#> 4            24    yes       regular  66.7
#> 5             9     no       regular  41.6
#> 6             3    yes           new  61.9
```

So `tenure_months` runs from 0 for somebody who signed up this month to 24 for a two year old account, `coupon` is a yes or a no, and `spend` is in dollars.

The store also keeps a rough label on every account. Anybody under six months is a **new** customer and everybody else is a **regular**, and that label is sitting in the data as `customer_type`. It is the split the whole campaign question turns on, so let's count the customers in each of the four boxes and average what they spent.

```r
# Count the customers in each group, then average what each group spent
table(customer_type = store$customer_type, coupon = store$coupon)
#>              coupon
#> customer_type  no yes
#>       new      58  46
#>       regular 142 154

cell_means <- tapply(store$spend, list(store$customer_type, store$coupon), mean)
round(cell_means, 1)
#>           no  yes
#> new     44.0 58.1
#> regular 57.2 54.9
```

`tapply()` here just says: take the spend column, break it into pieces by customer type and coupon, and average each piece. Four pieces, four averages.

Read them slowly, because everything that follows comes out of these four numbers.

- New customers spent \$44.0 with no coupon and \$58.1 with one. The coupon is worth about \$14 to them.
- Regulars spent \$57.2 with no coupon and \$54.9 with one. The coupon costs them about \$2.

Same coupon, same month, two answers pointing in opposite directions.

=== step === concept
## What a model with no cross term says the coupon is worth

The usual first move is to put both columns on the right hand side of a formula and ask R for the effect of each one. Spend is explained by the coupon and by the customer type, and nothing more exotic than that.

```r
# Fit the model with no cross term and read what it says the coupon is worth
m_add <- lm(spend ~ coupon + customer_type, data = store)
round(coef(summary(m_add)), 4)
#>                      Estimate Std. Error t value Pr(>|t|)
#> (Intercept)           49.3759     1.1236 43.9463   0.0000
#> couponyes              1.9502     1.0465  1.8635   0.0631
#> customer_typeregular   5.6304     1.1929  4.7199   0.0000
```

Find the `couponyes` row. R names each row after the level it is measuring, so `couponyes` means coupon yes compared with coupon no. The estimate is 1.9502, so this model says the coupon was worth about \$1.95 a customer.

The p-value beside it is 0.0631, which sits on the wrong side of the usual 0.05 line.

Anybody reading that table would reach the same conclusion. The coupon bought us two dollars a head, we cannot even be confident of that, so stop mailing it.

That conclusion is wrong, and the four averages we printed a minute ago already show why.

=== step === concept
## The same coupon, worked out separately for each group

We do not have to argue about it, because we can do the subtraction ourselves. Take the coupon effect inside each group straight from the group averages, and put both answers next to what the model reported.

```r
# Work out the coupon effect separately inside each customer type
new_effect     <- cell_means["new", "yes"]     - cell_means["new", "no"]
regular_effect <- cell_means["regular", "yes"] - cell_means["regular", "no"]

round(c(new        = new_effect,
        regular    = regular_effect,
        model_says = coef(m_add)[["couponyes"]]), 2)
#>        new    regular model_says
#>      14.14      -2.28       1.95
```

There it is. Among new customers the coupon added \$14.14. Among regulars it took away \$2.28. The model reported \$1.95 for everybody.

That \$1.95 is a real number and there is no mistake in the arithmetic. It is a blend of +14.14 and -2.28, weighted by how many customers of each kind were in the campaign. The trouble is that a blend of those two describes neither of them. Not one customer in this campaign ever saw a coupon worth \$1.95.

The weak p-value comes from the same place. The two real effects point in opposite directions, so blending them lands near zero, and a number near zero is exactly what fails a significance test. The coupon did not do nothing. The model was only ever allowed to give one answer.

[KEY INSIGHT]
When one predictor's effect depends on another, a model that reports a single effect is reporting an average of things that disagree. That average can be small, it can look insignificant, and it can describe nobody at all in your data.

=== step === quiz
## Quick check: what is a model without a cross term assuming?

The model we just fitted had a plus sign between `coupon` and `customer_type`. That plus sign is a promise about how the world works. Which promise is it?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- That the two groups have to contain the same number of customers. ::no
- That new and regular customers can sit at different spend levels, but the coupon has to be worth the same to both. ::ok Exactly. The plus sign lets each group keep its own height and forces them to share one coupon effect. That is why a single `couponyes` row came out, and why it had to compromise between +14.14 and -2.28.
- That the coupon effect is zero until proven otherwise. ::no
- That new and regular customers spend the same amount on average. ::no An additive model is perfectly free to put the two groups at different spend levels, and it did: it gave regulars \$5.63 more than new customers. It says nothing about group sizes, and it does not assume the coupon effect is zero, it estimates it. The one thing it cannot do is let the two groups have different coupon effects.

=== step === concept
## Adding the cross term: lm(spend ~ coupon * customer_type)

To let the coupon be worth different amounts to the two groups, you change one character. Swap the plus for a star.

```r
# Fit the model that lets the coupon effect differ by customer type
m_int <- lm(spend ~ coupon * customer_type, data = store)
round(coef(summary(m_int)), 4)
#>                                Estimate Std. Error t value Pr(>|t|)
#> (Intercept)                     43.9862     1.2887 34.1329        0
#> couponyes                       14.1355     1.9377  7.2951        0
#> customer_typeregular            13.2215     1.5294  8.6450        0
#> couponyes:customer_typeregular -16.4167     2.2491 -7.2993        0
```

Four rows now instead of three. The new one at the bottom, the one with a colon in its name, is the interaction, and it is the row that carries the whole idea. It is usually called the **cross term**.

The star is shorthand. Writing `coupon * customer_type` expands to `coupon + customer_type + coupon:customer_type`, which is the two ordinary predictors plus a cross term written with a colon. Spell it out the long way and you get the same fit.

```r
# Check that the star really is shorthand for the plus and the colon
m_same <- lm(spend ~ coupon + customer_type + coupon:customer_type, data = store)
all.equal(coef(m_int), coef(m_same))
#> [1] TRUE
```

`all.equal()` returns TRUE when two objects match to within R's rounding tolerance, so those two formulas fitted one and the same model. Use the star when you want all three terms, which is nearly always, and the colon when you want the cross term alone and are handling the rest yourself.

=== step === concept
## Reading the four coefficients, one row at a time

Four coefficients, and every one of them now means something different from what it meant a minute ago. The safest way to read them is to write the model out and then switch it on one group at a time.

R turns each factor into a 0 or 1 indicator. Call \(C\) the coupon indicator, which is 1 when a coupon was sent, and \(R\) the regular indicator, which is 1 for a regular customer. The fitted model is then

\[ \widehat{\text{spend}} = 43.99 + 14.14\,C + 13.22\,R - 16.42\,C\,R \]

Now set \(C\) and \(R\) to 0 or 1 and read what each coefficient turns out to be.

- **43.99, the intercept.** Both indicators are 0, so this is a new customer who was sent no coupon. It is not a global average of anything, it is one specific corner of the data.
- **14.14, the `couponyes` row.** Set \(C\) to 1 while \(R\) stays 0. This is what a coupon is worth to a new customer, and to nobody else.
- **13.22, the `customer_typeregular` row.** Set \(R\) to 1 while \(C\) stays 0. This is how much more a regular spends than a new customer when neither of them was sent a coupon.
- **-16.42, the cross term.** Both indicators are 1, so this is the extra that appears only in that corner. Said plainly: the coupon is worth \$16.42 less to a regular than it is to a new customer.

The last one deserves saying twice, because it is the row people misread. The cross term is not the coupon effect for regulars. It is the distance between the two groups' coupon effects.

If that reading is right, the four coefficients have to rebuild the four averages we measured at the start. Let's hold them to it.

```r
# Rebuild the four group averages from the four coefficients
b0        <- coef(m_int)[["(Intercept)"]]
b_coupon  <- coef(m_int)[["couponyes"]]
b_regular <- coef(m_int)[["customer_typeregular"]]
b_cross   <- coef(m_int)[["couponyes:customer_typeregular"]]

fitted_cells <- rbind(
  new     = c(no = b0,             yes = b0 + b_coupon),
  regular = c(no = b0 + b_regular, yes = b0 + b_coupon + b_regular + b_cross)
)
round(fitted_cells, 1)
#>           no  yes
#> new     44.0 58.1
#> regular 57.2 54.9
```

Those are the four averages we computed straight from the raw data: 44.0, 58.1, 57.2 and 54.9, to the last decimal.

That is not a fluke, and the reason is worth knowing. Two factors plus their cross term give the model exactly as many free numbers as there are groups, so it can land on every group average exactly. The four coefficients are just those four averages rewritten as one baseline plus three differences.

=== step === tryit
## Your turn: recover the regulars' coupon effect from the coefficients

The fitted model is sitting in `m_int` and its four coefficients are in `coef(m_int)`. You have the coupon effect for new customers, and you have the distance between the two groups' coupon effects. That is everything you need to get the regulars' own coupon effect.

Work it out in one line, and check it against the -2.28 the raw group averages gave.

```r
# coef(m_int) holds the four coefficients by name. Two of them matter here:
# "couponyes" is the coupon effect for new customers, and
# "couponyes:customer_typeregular" is how far the regulars effect sits from it.
# Combine those two into the coupon effect among regular customers.
# One line. Press Check when you have it.
```
::check {"regex": "(coef[(]m_int[)][^\\n]*[+]|sum[(]coef[(]m_int[)]|b_coupon\\s*[+]\\s*b_cross)", "gate": true, "difficulty": "beginner", "ok": "That is it: minus 2.28 dollars, the same answer the raw group averages gave. Those two rows only mean something when you add them.", "no": "Pull both rows out of the fitted model and add them. The line is `coef(m_int)[[\"couponyes\"]] + coef(m_int)[[\"couponyes:customer_typeregular\"]]`."}
::solution
```r
# Add the coupon row and the cross-term row to get the regulars coupon effect
coef(m_int)[["couponyes"]] + coef(m_int)[["couponyes:customer_typeregular"]]
#> [1] -2.281123
```

Two routes, one answer. Subtracting the raw group averages gave -2.28 and so does adding these two coefficients, which is a good sign you are reading the table correctly.

=== step === concept
## Plotting the interaction: two lines that are not parallel

Coefficients are one way to see an interaction. A picture is the other, and for two groups it is the one people remember afterwards.

We already have the four fitted group averages. Put the coupon on the horizontal axis, spend on the vertical, and join each customer type with its own line.

```r
# Draw one line per customer type through the four fitted group averages
library(ggplot2)

plot_cells <- data.frame(
  customer_type = rep(c("new", "regular"), each = 2),
  coupon        = rep(c("no", "yes"), times = 2),
  spend         = c(fitted_cells["new", "no"],     fitted_cells["new", "yes"],
                    fitted_cells["regular", "no"], fitted_cells["regular", "yes"])
)

ggplot(plot_cells, aes(x = coupon, y = spend,
                       colour = customer_type, group = customer_type)) +
  geom_line(linewidth = 1.1) +
  geom_point(size = 3) +
  labs(x = "coupon sent", y = "average spend in dollars",
       colour = "customer type",
       title = "One coupon, two very different effects") +
  theme_minimal()
```

Two lines that are not parallel. That is what an interaction looks like.

The new customer line climbs steeply, from 44.0 up to 58.1. The regular line goes the other way, from 57.2 down to 54.9. If the coupon had been worth the same to both groups, the two lines would have risen by the same amount and stayed parallel, however far apart they started.

Three shapes turn up again and again, and naming the shape is often the quickest way to describe a result out loud:

- **Parallel lines.** No interaction. One number describes the coupon for everybody.
- **A fan.** Both groups move the same way, one of them further than the other.
- **Crossing lines.** The effect changes sign between the groups.

Ours cross, which is the strongest form there is. The coupon does not just help new customers more than regulars. It helps one group and costs money on the other.

=== step === concept
## Why the coupon row is no longer "the effect of the coupon"

This is where people trip, so let's slow down here.

In the additive model, the `couponyes` row was the coupon effect, full stop, for everybody. In the model with a cross term it is the coupon effect for new customers only. Every other row in that table is conditional in the same way.

The reason is that R has to pick one level of each factor to measure the others against, and it picks the first level, which is `new` here. That level is called the **reference level**. Move the reference and the rows change what they report, which you can watch happen with `relevel()`.

```r
# Refit the same model with regular customers as the reference level
store$type_regular_first <- relevel(store$customer_type, ref = "regular")
m_int_reg <- lm(spend ~ coupon * type_regular_first, data = store)
round(coef(summary(m_int_reg)), 4)
#>                                 Estimate Std. Error t value Pr(>|t|)
#> (Intercept)                      57.2077     0.8236 69.4610   0.0000
#> couponyes                        -2.2811     1.1418 -1.9978   0.0464
#> type_regular_firstnew           -13.2215     1.5294 -8.6450   0.0000
#> couponyes:type_regular_firstnew  16.4167     2.2491  7.2993   0.0000
```

Look at the `couponyes` row: -2.2811. The row that said 14.14 a moment ago now says -2.28, because it is now reporting the coupon effect among regulars.

The cross term flipped sign as well, from -16.42 to +16.42. It measures the distance from regulars to new customers now, instead of the other way round.

The fit itself did not move at all. Only the labels did.

```r
# Confirm the two fits are one model wearing two different sets of labels
round(c(r_squared_new_first     = summary(m_int)$r.squared,
        r_squared_regular_first = summary(m_int_reg)$r.squared), 4)
#>     r_squared_new_first r_squared_regular_first
#>                  0.1749                  0.1749

all.equal(unname(fitted(m_int)), unname(fitted(m_int_reg)))
#> [1] TRUE
```

Identical R-squared, and every one of the 400 fitted values unchanged. Both tables describe the same two lines on the same chart, they just count from a different corner.

That gives us a rule of thumb. Keep both ordinary predictors in the model whenever you keep their cross term, even when one of them looks unimpressive on its own. Dropping `coupon` while keeping `coupon:customer_type` leaves the surviving terms depending on how the groups happened to be coded, and the fit can no longer state either group's coupon effect. The convention has a name, the **hierarchical principle**, and it is why the star hands you all three terms by default.

[WARNING]
Once a cross term is in the model, no coefficient stands on its own. A main effect is that predictor's effect at the reference level of the other predictor, so it moves when the reference moves. Never report `couponyes` as the coupon effect without naming the group it belongs to.

=== step === quiz
## Quick check: what does the coupon row mean now?

In the fitted model `spend ~ coupon * customer_type`, with `new` as the reference level, the `couponyes` row reads 14.14. What is that number?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The effect of the coupon on every customer in the campaign. ::no
- The effect of the coupon on new customers, the group R is using as the reference level. ::ok Right. It belongs to one group only, and moving the reference to `regular` turned that same row into -2.28 without changing the fit at all.
- The average of the two groups' coupon effects. ::no
- How much more regulars spend than new customers. ::no With a cross term in the model, `couponyes` is one group's coupon effect, and which group depends entirely on the reference level. It is not everybody's effect, and it is not an average of the two, since the blended figure was \$1.95 while this row says 14.14. The regular minus new spend gap is a different row, `customer_typeregular`, and the distance between the two coupon effects is the cross term, -16.42.

=== step === concept
## Is the interaction real? The nested F test with anova()

So the two groups answered differently. Is that difference big enough to keep in the model, or is it the size of gap 400 customers throw up by luck anyway?

The clean way to ask is to compare the two models directly. They are identical apart from the cross term, so `anova()` can ask whether that one extra term bought enough fit to be worth its price. That price is one degree of freedom, which is just the one extra number the larger model has to estimate out of the same 400 customers.

```r
# Test whether the cross term earns its place in the model
anova(m_add, m_int)
#> Analysis of Variance Table
#>
#> Model 1: spend ~ coupon + customer_type
#> Model 2: spend ~ coupon * customer_type
#>   Res.Df   RSS Df Sum of Sq      F    Pr(>F)
#> 1    397 43275
#> 2    396 38143  1    5131.9 53.279 1.597e-12 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Read the bottom row. Letting the coupon effect differ by group cut the leftover error, the residual sum of squares, from 43,275 down to 38,143. The F statistic for that improvement is 53.279 on 1 and 396 degrees of freedom, and the p-value is 1.597e-12.

Written out, that p-value is 0.0000000000016. Luck does not manufacture a gap this size.

When the cross term costs exactly one degree of freedom, this F test and the t-test already sitting in the coefficient table are the same test in different clothes. F is t squared.

```r
# Square the cross-term t value and compare it with the F statistic
t_cross <- coef(summary(m_int))["couponyes:customer_typeregular", "t value"]
round(c(t = t_cross, t_squared = t_cross^2), 3)
#>         t t_squared
#>    -7.299    53.279
```

53.279 either way, to the last digit.

So for a single cross term you can read the verdict straight off the coefficient table and skip the comparison. `anova()` earns its keep when the interaction spans several rows at once, which happens as soon as a factor has three or more levels, and you want one verdict for the whole thing rather than one per row.

=== step === concept
## How to report an interaction so a marketing lead can act on it

Now for the meeting. Nobody in marketing wants to hear about a cross term, and if you open with -16.42 you will lose the room in seconds.

Report one effect per group, each with an interval, and let the test come last. Getting both effects with their intervals uses the same move as a moment ago: fit the model twice, once with each group as the reference, and read the `couponyes` row out of each fit.

```r
# Pull each group's own coupon effect with a 95 percent interval
new_row     <- c(estimate = coef(m_int)[["couponyes"]],     confint(m_int)["couponyes", ])
regular_row <- c(estimate = coef(m_int_reg)[["couponyes"]], confint(m_int_reg)["couponyes", ])

round(rbind(new = new_row, regular = regular_row), 2)
#>         estimate 2.5 % 97.5 %
#> new        14.14 10.33  17.94
#> regular    -2.28 -4.53  -0.04
```

`confint()` gives the 95 percent confidence interval for a coefficient, which is the range of true effects the data is consistent with. Two rows, both in dollars per customer, which is a unit the business already thinks in.

- A coupon sent to a **new** customer is worth \$14.14, and the data supports anything from \$10.33 to \$17.94.
- A coupon sent to a **regular** costs \$2.28, and the interval runs from \$4.53 of lost spend at worst down to 4 cents at best.

The two intervals come nowhere near overlapping, which is the same message the F test delivered in its own language.

[KEY INSIGHT]
Never report the cross term on its own. Saying the interaction is -16.42 with p below 0.001 gives a marketing lead nothing to act on. Saying a coupon is worth about \$14 to a new customer and costs about \$2 on a regular one, and that the difference is far too large to be luck, tells them exactly what to do next month.

=== step === quiz
## Quick check: which sentence reports the coupon test correctly?

You have three minutes in the marketing meeting. Which of these sentences reports the result honestly and usefully?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The interaction between coupon and customer type is -16.42, with p below 0.001. ::no
- The coupon raised spend by \$1.95 a customer. ::no
- A coupon is worth about \$14.14 to a new customer, anywhere from \$10.33 to \$17.94, and costs about \$2.28 on a regular one, and the two are far too different to be luck. ::ok That is the one. Both group effects, in dollars, each with the range the data supports, and the test kept as backup rather than as the headline.
- The coupon effect is significant at p below 0.001, so it is a large effect. ::no Three of these four hand the reader something they cannot act on. The cross term is the distance between two effects, not either of them. The \$1.95 is a blend that describes neither group. And a small p-value is not a size: it says the difference is hard to explain by luck, and nothing at all about how many dollars are in it.

=== step === concept
## What if the second predictor is a number rather than two groups?

Everything so far leaned on a label: new or regular, drawn at six months. That line was always a little arbitrary. A customer of five months and one of seven months are not different species, yet the label treats them as if they were.

Underneath the label sits a real number, `tenure_months`, running from 0 to 24. So ask the better question. Does the coupon fade off gradually as an account gets older?

Start by looking at the two halves of the campaign side by side, spend against months with the store.

::widget facet-grid {"data":[{"x":16,"y":55.8,"facet":"no coupon"},{"x":16,"y":49.2,"facet":"coupon sent"},{"x":13,"y":47.9,"facet":"no coupon"},{"x":3,"y":52.1,"facet":"coupon sent"},{"x":2,"y":36.8,"facet":"no coupon"},{"x":7,"y":56.2,"facet":"coupon sent"},{"x":3,"y":44.4,"facet":"no coupon"},{"x":16,"y":51.4,"facet":"coupon sent"},{"x":2,"y":42.5,"facet":"no coupon"},{"x":7,"y":45.8,"facet":"coupon sent"},{"x":9,"y":51.5,"facet":"no coupon"},{"x":15,"y":49.9,"facet":"coupon sent"},{"x":17,"y":76,"facet":"no coupon"},{"x":22,"y":68,"facet":"coupon sent"},{"x":9,"y":62.3,"facet":"no coupon"},{"x":21,"y":61.9,"facet":"coupon sent"},{"x":24,"y":78.1,"facet":"no coupon"},{"x":13,"y":47.2,"facet":"coupon sent"},{"x":9,"y":49.8,"facet":"no coupon"},{"x":13,"y":59,"facet":"coupon sent"},{"x":4,"y":41.1,"facet":"no coupon"},{"x":5,"y":57.1,"facet":"coupon sent"},{"x":9,"y":36.8,"facet":"no coupon"},{"x":23,"y":57.5,"facet":"coupon sent"},{"x":9,"y":58.4,"facet":"no coupon"},{"x":4,"y":66.7,"facet":"coupon sent"},{"x":21,"y":66.8,"facet":"no coupon"},{"x":19,"y":51.2,"facet":"coupon sent"},{"x":19,"y":56.7,"facet":"no coupon"},{"x":2,"y":76.5,"facet":"coupon sent"},{"x":14,"y":45.5,"facet":"no coupon"},{"x":8,"y":43.1,"facet":"coupon sent"},{"x":14,"y":65.5,"facet":"no coupon"},{"x":0,"y":55.2,"facet":"coupon sent"},{"x":19,"y":51.2,"facet":"no coupon"},{"x":20,"y":35.9,"facet":"coupon sent"},{"x":16,"y":54.9,"facet":"no coupon"},{"x":19,"y":44.6,"facet":"coupon sent"},{"x":17,"y":69.8,"facet":"no coupon"},{"x":18,"y":65.8,"facet":"coupon sent"},{"x":21,"y":69.3,"facet":"no coupon"},{"x":5,"y":41.8,"facet":"coupon sent"},{"x":6,"y":35.5,"facet":"no coupon"},{"x":24,"y":60.6,"facet":"coupon sent"},{"x":3,"y":51.1,"facet":"no coupon"},{"x":19,"y":47.9,"facet":"coupon sent"},{"x":5,"y":38.6,"facet":"no coupon"},{"x":6,"y":66.8,"facet":"coupon sent"},{"x":19,"y":62.2,"facet":"no coupon"},{"x":17,"y":53.1,"facet":"coupon sent"},{"x":13,"y":57.4,"facet":"no coupon"},{"x":22,"y":55.4,"facet":"coupon sent"},{"x":4,"y":61.3,"facet":"no coupon"},{"x":1,"y":53.1,"facet":"coupon sent"},{"x":21,"y":70.2,"facet":"no coupon"},{"x":9,"y":59.8,"facet":"coupon sent"},{"x":23,"y":64.2,"facet":"no coupon"},{"x":0,"y":54,"facet":"coupon sent"}],"geom":"point","x":"months with the store","y":"spend in dollars","facetVar":"coupon"}

Press the second button to split the single chart into one panel per group. Among the customers who got no coupon, spend climbs steadily with tenure, which is the ordinary fact that long standing customers spend more. Among the customers who did get a coupon, the climb is much flatter, because the youngest accounts there have already been lifted by the discount and the oldest ones have not.

That flattening is the interaction, drawn. Now fit it, with the same star and the number in place of the label.

```r
# Fit the coupon effect against months with the store instead of two groups
m_tenure <- lm(spend ~ coupon * tenure_months, data = store)
round(coef(summary(m_tenure)), 4)
#>                         Estimate Std. Error t value Pr(>|t|)
#> (Intercept)              41.1144     1.2605 32.6166        0
#> couponyes                16.3552     1.7920  9.1269        0
#> tenure_months             1.0582     0.0928 11.3985        0
#> couponyes:tenure_months  -1.2001     0.1263 -9.5037        0
```

Same four rows, and you read them the same way, with one change: the cross term is now measured per month.

- **41.11, the intercept.** A brand new signup, zero months old, with no coupon.
- **16.36, the `couponyes` row.** What the coupon is worth at zero months, which is the only tenure this row describes.
- **1.06, the `tenure_months` row.** What one more month with the store is worth to a customer who got no coupon.
- **-1.20, the cross term.** How much of the coupon's value is lost with every extra month of tenure.

So the coupon starts out at \$16.36 on day one and gives back \$1.20 of that every month.

=== step === concept
## Reading the fade: the coupon effect at 1, 6 and 12 months

Two coefficients now describe a whole line rather than a single number, so the coupon effect is a small formula. Write \(t\) for months with the store and it reads

\[ \text{coupon effect at } t \text{ months} = 16.36 - 1.20\,t \]

Pick a few tenures the store actually cares about and read the effect off that line.

```r
# Work out the coupon effect at three different tenures
b_coupon_t <- coef(m_tenure)[["couponyes"]]
b_cross_t  <- coef(m_tenure)[["couponyes:tenure_months"]]

data.frame(
  months_with_store = c(1, 6, 12),
  coupon_effect     = round(b_coupon_t + b_cross_t * c(1, 6, 12), 2)
)
#>   months_with_store coupon_effect
#> 1                 1         15.16
#> 2                 6          9.15
#> 3                12          1.95

round(mean(store$tenure_months), 1)
#> [1] 12.2
```

At one month the coupon is worth \$15.16. At six months \$9.15. At twelve months \$1.95, which is small enough that the mailing is hard to justify.

That last figure deserves a second look, because \$1.95 is exactly what the very first model reported for everybody. The average tenure on this list is 12.2 months, and a model with no cross term reports something close to the effect at a typical value of the other predictor. It was quoting one customer's answer and printing it as everyone's.

[TIP]
Pick the values you report because a decision hangs on them, not because they are round numbers. Month 1 is a fresh signup, month 6 is where this store draws its own line between new and regular, and month 12 sits beside the 12.2 month average tenure of the list.

=== step === tryit
## Your turn: find the month the coupon stops paying

The coupon effect falls by \$1.20 every month, so sooner or later the line crosses zero and the coupon stops paying for itself. The store wants that month, because it is the cutoff for who gets mailed next time.

Both coefficients are already in `b_coupon_t` and `b_cross_t`. Solve for the tenure where the effect reaches zero.

```r
# b_coupon_t is the coupon effect at zero months, and b_cross_t is how much
# that effect changes for every extra month with the store.
# The coupon effect at t months is b_coupon_t + b_cross_t * t.
# Solve that for the t where the effect reaches zero.
# One line. Press Check when you have it.
```
::check {"regex": "(b_coupon_t\\s*/|coef[(]m_tenure[)][^\\n]*/)", "gate": true, "difficulty": "intermediate", "ok": "Yes: 13.63 months. Mail the accounts younger than about thirteen and a half months, and leave the older ones alone.", "no": "Set b_coupon_t + b_cross_t * t to zero and solve for t, which means dividing one coefficient by the other: `-b_coupon_t / b_cross_t`."}
::solution
```r
# Solve the two coefficients for the month where the coupon effect reaches zero
-b_coupon_t / b_cross_t
#> [1] 13.62871
```

13.63 months. Below that the coupon still adds to what a customer spends, and above it the coupon takes spend away.

Notice what the crude label was doing. Cutting new from regular at six months threw away every customer between six and thirteen months, and the coupon was still worth real money to all of them. That is what you gain by letting the model use the number instead of the label.

=== step === quiz
## Quick check: which of these models is the mistake?

All four of these fit without complaint. Three of them are models you might reasonably choose. One is broken in a way R will never warn you about. Which one?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `lm(spend ~ coupon * customer_type, data = store)` ::no
- `lm(spend ~ coupon + customer_type + coupon:customer_type, data = store)` ::no
- `lm(spend ~ customer_type + coupon:customer_type, data = store)` ::ok That is the broken one. It keeps the cross term but drops `coupon` itself, so what is left depends on how the two groups happened to be coded, and the fit can no longer state either group's coupon effect.
- `lm(spend ~ coupon + customer_type, data = store)` ::no The first two are the same model written two ways, since the star expands to exactly the plus and the colon. The last one is the additive fit, which is a legitimate model that simply turned out to be the wrong one for this data. Only one of the four keeps a cross term while throwing away one of the terms it is built from.

=== step === quiz
## Quick check: what would parallel lines have meant?

Suppose the same campaign had come back with a cross term of 0.4, a p-value of 0.71, and two lines on the chart that looked parallel. What would you report?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Keep the cross term anyway, because the two groups are different sizes. ::no
- Report the single coupon effect from the additive model, since one number now describes both groups fairly, and keep the simpler fit. ::ok Yes. A cross term near zero is the case the additive model was built for, and its one `couponyes` row really is the coupon effect for everybody.
- Conclude that the coupon had no effect at all. ::no
- Report the two group effects separately anyway, because separate is always safer. ::no A cross term near zero with a large p-value says the two groups' coupon effects are close enough that one number covers both, so the simpler model is the honest report and splitting the groups just adds noise. It says nothing about whether the coupon worked: the coupon effect could be large and identical in both groups. Group sizes are a separate matter and never a reason to keep a term.

=== step === concept
## References

- [Understanding Interaction Models: Improving Empirical Analyses](https://doi.org/10.1093/pan/mpi014) - Brambor, Clark and Golder (2006), Political Analysis 14(1), 63-82. The paper that made the case for keeping both main effects and reporting effects at chosen values of the moderator.
- [An R Companion to Applied Regression](https://www.john-fox.ca/Companion/) - Fox and Weisberg (2019), third edition, Sage. Chapter 4 covers factor coding, contrasts and interactions in `lm()`.
- [Practical Regression and Anova using R](https://cran.r-project.org/doc/contrib/Faraway-PRA.pdf) - Faraway (2002). A free text with a careful treatment of factors, reference levels and interaction terms.
- [Model formulae in R](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html) - R Core Team. The reference for what `*` and `:` expand to.
- Aiken and West (1991), Multiple Regression: Testing and Interpreting Interactions, Sage. The standard book on probing an interaction once you have found one.

=== step === complete
## Quick recap

You started with a model that said a coupon was worth \$1.95 and could not clear the significance bar, and you finished with two numbers a marketing team can act on tomorrow morning. To pull it together:

- An interaction means one predictor's effect depends on another. Without one in the model, R reports a single blended effect that can describe nobody in the data.
- Fit it by swapping the plus for a star: `lm(spend ~ coupon * customer_type)`. The star expands to both ordinary terms plus the cross term.
- Once a cross term is there, a main effect belongs to one group only, the reference level. Move the reference with `relevel()` and the row changes from 14.14 to -2.28 while the fit stays put.
- The cross term is the distance between the two effects, -16.42, and never either effect on its own.
- Test it by comparing the two models with `anova()`. Here F was 53.279 on 1 and 396 degrees of freedom, which is the cross term's t of -7.299 squared.
- Report one effect per group with intervals: \$14.14 (\$10.33 to \$17.94) for a new customer, and -\$2.28 (-\$4.53 to -\$0.04) for a regular.
- When the second predictor is a number rather than a label, the same fit gives you a line instead of two values, and this one crossed zero at 13.63 months.

So the next time a model hands you one average and somebody says the change did nothing, you know the question to ask: did nothing for whom?
