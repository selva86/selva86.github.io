---
title: "Interaction effects: test and interpret them"
description: "An interaction means one thing's effect depends on another. Add it to a model in R, read all four coefficient rows, test it, and report an effect per group."
keywords: "interaction effects in R, interaction term lm, moderation, simple slopes, anova model comparison, interpreting interaction coefficients, predict interaction R"
post_type: "LESSON"
curriculum_id: "0.0.5"
course_id: "reading-model-output"
course_title: "Reading Regression Models"
course_lesson: "1"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
lesson_access: "windowed"
catalog_blurb: "How to find and report an effect that is different for different groups."
mathjax: "false"
webr: "true"
date: "2026-08-19"
---

=== step === cover

## Interaction effects: test and interpret them

Let's say an online store posts a discount coupon to some of its customers and
not to others, and a month later the finance team asks the obvious question.
Did the coupon work?

Somebody runs the numbers. Customers who got a coupon spent about $10 more
than customers who did not, which is ten dollars a head, so the coupon works.

Then somebody else splits that same crowd in two: customers who were new to
the store, and long-time regulars who were going to shop there anyway.

New customers spent about $19 more, and regulars spent about $1 more.

So the $10 is true of nobody. It is the average of a large effect and almost
no effect, and it fits neither of the two kinds of people it was measured on.
The question "does the coupon work?" turns out to have no single answer,
because the answer depends on who got it.

Below are the four real averages from that store, the ones you are about to
build and check yourself. Look at the gap between the first two bars, and then
look at the gap between the last two bars.

::widget chart-plotter {"geoms": ["bar"], "x": "group", "y": "avg_spend", "data": [{"x": "new, no coupon", "y": 44.85}, {"x": "new, coupon", "y": 63.88}, {"x": "regular, no coupon", "y": 67.16}, {"x": "regular, coupon", "y": 68.07}]}

That difference between the two gaps has a name. It is called an interaction,
and you are about to spot one, put it in a model, read every row the model
prints, test whether it is real, and write it up in a sentence your finance
team would understand.

=== step === concept

## Who is in this data?

The data covers three hundred customers of one online store.

Half of them are new, meaning this was their first month buying anything, and
the other half are long-time regulars who have been ordering for over a year.
That is the `type` column.

Each customer was assigned a discount of 0, 5, 10, 15 or 20 percent off. A
discount of 0 means no coupon arrived at all, and those customers are the ones
everybody else is compared against. That is the `discount` column, and the
`coupon` column is the same thing collapsed to a plain yes or no.

Then the store wrote down one more number for each person, which is how much
that person spent over the following month, in dollars. That is `spend`.

Run the block. It builds the table and shows you the first six customers.

```r
set.seed(271)

type <- rep(c("new", "regular"), each = 150)
discount <- rep(c(0, 0, 5, 10, 15, 20), times = 50)
coupon <- factor(ifelse(discount > 0, "yes", "no"), levels = c("no", "yes"))

spend <- 45 + 22 * (type == "regular") +
  ifelse(type == "new", 1.5, 0.1) * discount +
  rnorm(300, sd = 9)

shoppers <- data.frame(type = factor(type, levels = c("new", "regular")),
                       discount = discount,
                       coupon = coupon,
                       spend = round(spend, 1))

head(shoppers)
#>   type discount coupon spend
#> 1  new        0     no  39.1
#> 2  new        0     no  42.2
#> 3  new        5    yes  52.2
#> 4  new       10    yes  58.0
#> 5  new       15    yes  85.9
#> 6  new       20    yes  83.7

xtabs(~ type + coupon, data = shoppers)
#>          coupon
#> type       no yes
#>   new      50 100
#>   regular  50 100
```

`set.seed(271)` fixes the random noise, so the numbers you get are the same
numbers printed here, and the same numbers you saw in the bar chart. If you
change the seed, every figure moves, and that is a fine thing to try once you
have finished.

The second table is the important one for what follows. Fifty new customers
and fifty regulars got no coupon, and a hundred of each got one. Both kinds of
customer sit on both sides of the comparison, so nothing that follows is an
accident of who happened to receive what.

=== step === concept

## What did the coupon do, on average?

Let's start with the comparison anyone would make first. Take everybody who got
a coupon, take everybody who did not, and subtract one average from the other.

```r
with_coupon <- mean(shoppers$spend[shoppers$coupon == "yes"])
no_coupon   <- mean(shoppers$spend[shoppers$coupon == "no"])

round(c(no_coupon = no_coupon,
        with_coupon = with_coupon,
        difference = with_coupon - no_coupon), 2)
#>   no_coupon with_coupon  difference
#>       56.00       65.98        9.97
```

Customers with no coupon spent $56.00 on average. Customers with a coupon
spent $65.98. The coupon is worth $9.97 a head.

That number is real and the arithmetic behind it is correct. It is the way
people then read it that is about to fall apart.

=== step === concept

## Does that one number describe anybody?

Now run that same comparison twice, once inside the new customers and once
inside the regulars, and `aggregate()` will do it in one line. Read the formula
as "average spend, broken down by coupon and by type".

```r
cell_means <- aggregate(spend ~ coupon + type, data = shoppers, FUN = mean)
cell_means$spend <- round(cell_means$spend, 2)
cell_means
#>   coupon    type spend
#> 1     no     new 44.85
#> 2    yes     new 63.88
#> 3     no regular 67.16
#> 4    yes regular 68.07

lift_new     <- with(cell_means, spend[type == "new" & coupon == "yes"] -
                                 spend[type == "new" & coupon == "no"])
lift_regular <- with(cell_means, spend[type == "regular" & coupon == "yes"] -
                                 spend[type == "regular" & coupon == "no"])

round(c(lift_new = lift_new, lift_regular = lift_regular), 2)
#>     lift_new lift_regular
#>        19.03         0.91
```

There it is. A new customer who got a coupon spent $19.03 more than a new
customer who did not, and a regular who got a coupon spent $0.91 more than a
regular who did not. That is ninety-one cents.

Now hold the pooled $9.97 up against those two numbers. It sits between them
because it is their average: half the customers are new and half are regulars,
so $9.97 is the midpoint of $19.03 and $0.91 and nothing more. No customer in
this data experienced a $9.97 coupon, because new customers got far more than
that and regulars got almost nothing.

[KEY INSIGHT]
When the effect of something differs by group, the pooled average is not a
compromise everyone can live with. It is a number that is wrong for every
group you have. That is what an interaction is: the effect of one thing
(the coupon) depends on the value of another thing (customer type).

=== step === quiz

## Is "the coupon adds $10" a fair thing to say?

The store's newsletter wants one line about the coupon campaign. Someone
proposes: "the coupon raised spending by about $10 per customer."

You have both group averages in front of you. Is that line fair?

::quiz {"correct": 4, "gate": true, "difficulty": "beginner"}
- Yes. It is the honest average over all 300 customers, so it is the fairest one-line summary available. ::no Arithmetically honest, and still misleading.
- No. The two groups have different numbers of coupon customers, so the $10 is a biased average. ::no The design is balanced: both types have 50 customers without a coupon and 100 with one.
- Yes, as long as the line also mentions that regulars spend more overall than new customers. ::no Regulars do spend more overall, and saying so does not repair the sentence. The problem is not the baseline, it is the lift. The $10 overstates what the coupon did for regulars by about ten times, and understates what it did for new customers by half. An average across two groups can be wrong for both of them, and this one is.
- No. It is the average of a $19.03 effect and a $0.91 effect, so it is wrong for both kinds of customer. ::ok Exactly. The $10 is real as arithmetic and useless as a description. Anyone acting on it would over-invest in coupons for regulars and under-invest in coupons for new customers.

=== step === concept

## What does a model without the interaction say?

Now hand the same question to a linear model. The obvious formula is
`spend ~ coupon + type`: predict spending from whether a coupon arrived, and
from what kind of customer this is.

```r
m_add <- lm(spend ~ coupon + type, data = shoppers)
round(coef(summary(m_add)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   50.887      1.290  39.433        0
#> couponyes      9.975      1.369   7.287        0
#> typeregular   10.230      1.290   7.927        0
```

Look at the `couponyes` row. The model says the coupon is worth $9.98, with a
standard error of $1.37 and a p-value too small to show at three decimals. It
is strongly significant and tightly estimated, and it is the same $10 you
already know is wrong for both groups.

The model is not making a mistake. It is answering the question you asked. The
`+` in `spend ~ coupon + type` says one thing and only that: the coupon shifts
spending by some fixed amount, customer type shifts spending by some other
fixed amount, and the size of one shift has nothing to do with the other.
Written that way, there is exactly one coupon effect to report, so one is what
you get back.

=== step === widget

## Why can it only ever say one number?

It helps to see what a model with a `+` in it is able to draw at all.

The picture below is not the store data. It is a deliberately extreme case,
two groups whose effects run in opposite directions, so the shape of the
problem is impossible to miss. The solid lines are what a model with an
interaction fits, and the dashed lines are what the additive model fits.

::widget wrong-family-fit {"mode": "interaction", "seed": 31}

The two dashed lines are parallel, and they are not parallel by accident.
There is no term anywhere in `y ~ x + g` that can make one group's slope differ
from the other's, so the fitted lines cannot come out any other way. The group
term can move a line up or down, and nothing in that formula can change how
steeply a line rises.

That is why the store model returned a single $9.98. Parallel lines have one
slope between them, and that single slope is what the model reports.

[NOTE]
This is the right way to think about a model that "found nothing". Before you
conclude an effect is absent, check whether the formula you wrote was even
able to express the effect you were looking for.

=== step === concept

## How do I let the effect depend on the group?

Change one character. Write `coupon * type` instead of `coupon + type`.

The `*` is shorthand. R expands it into three terms:
`coupon + type + coupon:type`. The first two are the same main effects you
already had. The third one, the one with the colon, is the new part. It is
called the interaction term, or the cross term, and it is what lets the coupon
effect come out differently for different customer types.

```r
m_int <- lm(spend ~ coupon * type, data = shoppers)
round(coef(summary(m_int)), 3)
#>                       Estimate Std. Error t value Pr(>|t|)
#> (Intercept)             44.846      1.462  30.681        0
#> couponyes               19.036      1.790  10.634        0
#> typeregular             22.312      2.067  10.794        0
#> couponyes:typeregular  -18.123      2.532  -7.158        0
```

You get four rows now instead of three. The $9.98 is gone, and one of the
numbers you worked out by hand has appeared in its place: 19.036, which is
exactly the lift you measured for the new customers.

[TIP]
`coupon * type` and `coupon + type + coupon:type` are two ways of writing the
same model, so use the star. A colon on its own gives you the cross term
without the main effects, and that is almost never what you want.

=== step === concept

## How do I read those four rows?

This is the part that ties people's brains in knots, so let's go slowly. Every
row is a comparison, and each one is measured from the same starting point.

That starting point is a new customer who got no coupon, because `new` is the
first level of `type` and `no` is the first level of `coupon`. R calls those
two the reference levels, and it measures everything else from there.

```r
round(coef(m_int), 2)
#>           (Intercept)             couponyes           typeregular
#>                 44.85                 19.04                 22.31
#> couponyes:typeregular
#>                -18.12
```

| Row | Number | What it says, in plain words |
|---|---|---|
| `(Intercept)` | 44.85 | Average spend of a new customer with no coupon. The starting point. |
| `couponyes` | 19.04 | What a coupon is worth **to a new customer**. Not to everybody. |
| `typeregular` | 22.31 | How much more a regular spends than a new customer **when neither got a coupon**. |
| `couponyes:typeregular` | -18.12 | How much the coupon effect **changes** when you move from a new customer to a regular. It shrinks by $18.12. |

Now check the first two rows against the group averages you computed by hand.
The intercept 44.85 is exactly the new-and-no-coupon cell, and the 19.04 is
exactly the new customers' lift, give or take a cent of rounding.

The last row is the one that is genuinely new. It is not an effect on
spending. It is an effect on an effect: a number saying how much the coupon
effect moves when the customer type changes. That is also why a lone
interaction coefficient means nothing to a reader on its own. Minus $18.12 of
what?

=== step === tryit

## What is the coupon worth to a regular customer?

You already know the answer from the table of averages: $0.91. Now let's get
it out of the model, because on real data you will often have the coefficients
in front of you and no tidy two-by-two table to check them against.

The coupon effect for a new customer is the `couponyes` row. The interaction
row says how much that effect changes when you move to a regular. So the
coupon effect for a regular is those two rows put together.

Fill in the blank.

```r
b <- coef(m_int)
b

# The coupon effect for a regular customer:
regular_lift <- ____
round(unname(regular_lift), 2)
```

::check {"regex": "couponyes.*\\+.*couponyes:typeregular", "gate": true, "difficulty": "intermediate", "ok": "That is it. Adding the cross term to the couponyes row gives 0.91, exactly the regulars lift you measured straight off the group averages.", "no": "Not yet. The couponyes row is the coupon effect for new customers only, and the cross term is what has to be added to it. Add the row named couponyes:typeregular to the row named couponyes."}

::solution

```r
b <- coef(m_int)

regular_lift <- b["couponyes"] + b["couponyes:typeregular"]
round(unname(regular_lift), 2)
#> [1] 0.91
```

That rule holds in general. In a model with an interaction, a group's own
effect is the main effect plus that group's cross term, and the reference
group is the only one whose effect you can read straight off a single row.

=== step === concept

## How do I get both effects without that arithmetic?

Adding coefficients by hand works, and it stops being fun the moment you have
three groups and two interaction terms to keep straight. There is a way to
make R do that work for you.

Build a small grid of the combinations you care about, ask `predict()` what the
model expects in each one, and subtract within each customer type. You handle
no coefficients, you add nothing up yourself, and you make no sign errors.

```r
cell_grid <- expand.grid(coupon = factor(c("no", "yes"), levels = c("no", "yes")),
                         type   = factor(c("new", "regular"), levels = c("new", "regular")))
cell_grid$predicted <- round(predict(m_int, newdata = cell_grid), 2)
cell_grid
#>   coupon    type predicted
#> 1     no     new     44.85
#> 2    yes     new     63.88
#> 3     no regular     67.16
#> 4    yes regular     68.07

pred_lift_new     <- with(cell_grid, predicted[type == "new" & coupon == "yes"] -
                                     predicted[type == "new" & coupon == "no"])
pred_lift_regular <- with(cell_grid, predicted[type == "regular" & coupon == "yes"] -
                                     predicted[type == "regular" & coupon == "no"])

round(c(pred_lift_new = pred_lift_new, pred_lift_regular = pred_lift_regular), 2)
#>     pred_lift_new pred_lift_regular
#>             19.03              0.91
```

You get $19.03 and $0.91 straight out, with no arithmetic on your part.

Now compare the four predicted values against the four averages in
`cell_means`. They are identical. That is worth a pause, because a model with
an interaction between two grouping columns is not smoothing anything and it
is not borrowing strength from one cell to another. It reproduces the group
averages exactly, and the four coefficients are just another way of writing
down the same four averages you computed earlier.

=== step === quiz

## What does the couponyes row mean now?

In the additive model, `couponyes` was $9.98. In the interaction model, the
row with the same name reads 19.04.

The coupon did not change. The data did not change. So what does that row
report now?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The average coupon effect across all 300 customers, the same as it always was. ::no That was its meaning in the additive model, and it is not its meaning any more.
- The coupon effect for regular customers, since `regular` is the second level of `type`. ::no The wrong group. R measures from the first level, not the second.
- The coupon effect for new customers only, because `new` is the reference level of `type`. ::ok Right. Once a cross term is in the model, a main effect stops being an average over everybody and becomes one specific group's effect, the reference group's. Every other group needs its cross term added.
- The extra effect of a coupon once you already know what type of customer you are looking at. ::no Once an interaction is in the model, a main effect is no longer an average over everybody. It is the effect for the reference group, which here is new customers, and every other group's effect is that row plus its own cross term. This is the most common misreading of an interaction model, so it is worth saying out loud whenever you report one: this number is for new customers.

=== step === concept

## How do I picture it?

Those four numbers make two lines. Put the coupon on the horizontal axis and
average spending on the vertical, then draw one line per customer type.

```r
library(ggplot2)

ggplot(cell_means, aes(x = coupon, y = spend, colour = type, group = type)) +
  geom_line(linewidth = 1) +
  geom_point(size = 3) +
  labs(x = "coupon sent", y = "average spend in dollars",
       colour = "customer",
       title = "Two lines that are not parallel") +
  theme_minimal(base_size = 13)
```

The new customers' line climbs steeply, from 44.85 up to 63.88, while the
regulars' line is nearly flat, from 67.16 to 68.07.

Lines that are not parallel mean there is an interaction. Lines that are
parallel would have meant the coupon did the same thing to both groups,
whatever their starting levels.

The shape gives you the sentence to write as well. These two lines start far
apart and finish close together, which is the store's real finding said
without a single coefficient: the coupon does not lift regulars, it brings new
customers up to where regulars already were.

=== step === concept

## Are those two lines really not parallel?

Your eyes say the lines are not parallel. Eyes will say that about any two
lines drawn from any two samples, because averages wobble. So let's test it.

The test compares the two models you have already fitted. The additive model
is the interaction model with one term removed, which makes it a fair
comparison: same data, same everything else, one fewer number to estimate.
`anova()` asks whether that extra number bought enough improvement in fit to
be worth having.

```r
anova(m_add, m_int)
#> Analysis of Variance Table
#>
#> Model 1: spend ~ coupon + type
#> Model 2: spend ~ coupon * type
#>   Res.Df   RSS Df Sum of Sq      F    Pr(>F)
#> 1    297 37094
#> 2    296 31620  1    5474.1 51.244 6.466e-12 ***
```

Read the second row. `Df = 1` is the one extra term. `Sum of Sq = 5474.1` is
how much unexplained variation that one term accounts for. `F = 51.244` sets
that improvement against the noise still left over.
And `Pr(>F)` works out at about six in a trillion.
If the coupon really did the same thing to both groups, a gap between the
lines this large would essentially never turn up. So the gap you are looking
at is not wobble.

There is one fair question to ask here. Why run this test at all, when the
`couponyes:typeregular` row already came with its own p-value? For a single
extra term the two say the same thing: square that row's t value of -7.158 and
you get 51.2, the F above. The model comparison is the version that keeps
working when the term you add is worth more than one row, which happens the
moment your group column has three levels instead of two.

And when the test comes back the other way, with a large p-value, that result
is useful as well. It means the data cannot tell the two effects apart. The
usual move then is to drop the cross term and report the single pooled number,
which now means something, because you have checked that one number really
does describe both groups.

=== step === widget

## What if the thing that changes the effect is a number?

So far the coupon has been a yes or a no. However, the store did not send just
one kind of coupon, it sent five sizes of it: 0, 5, 10, 15 and 20 percent off.
The interesting question for next quarter is not whether to send a coupon at
all. It is whether a deeper discount is worth more on one kind of customer than
it is on the other.

Plot spending against discount size and you can see the difficulty. Pooled into
one chart, the two customer types sit on top of each other and the pattern is a
smear. Split into one chart per type and the two stories come apart.

Press the toggle.

::widget facet-grid {"geom": "point", "x": "discount", "y": "spend", "facetVar": "type", "data": [{"x": 0, "y": 39.1, "facet": "new"}, {"x": 0, "y": 45.6, "facet": "new"}, {"x": 5, "y": 44.2, "facet": "new"}, {"x": 10, "y": 65.4, "facet": "new"}, {"x": 15, "y": 56, "facet": "new"}, {"x": 20, "y": 70.8, "facet": "new"}, {"x": 0, "y": 41.6, "facet": "new"}, {"x": 0, "y": 38.5, "facet": "new"}, {"x": 5, "y": 46.2, "facet": "new"}, {"x": 10, "y": 57.2, "facet": "new"}, {"x": 15, "y": 69.4, "facet": "new"}, {"x": 20, "y": 74.3, "facet": "new"}, {"x": 0, "y": 52.9, "facet": "new"}, {"x": 0, "y": 37.1, "facet": "new"}, {"x": 5, "y": 64.9, "facet": "new"}, {"x": 10, "y": 70.5, "facet": "new"}, {"x": 15, "y": 69.2, "facet": "new"}, {"x": 20, "y": 80.8, "facet": "new"}, {"x": 0, "y": 28.3, "facet": "new"}, {"x": 0, "y": 55.3, "facet": "new"}, {"x": 5, "y": 62.1, "facet": "new"}, {"x": 10, "y": 48.2, "facet": "new"}, {"x": 15, "y": 79.9, "facet": "regular"}, {"x": 20, "y": 76.9, "facet": "regular"}, {"x": 0, "y": 71.5, "facet": "regular"}, {"x": 0, "y": 66.8, "facet": "regular"}, {"x": 5, "y": 72.7, "facet": "regular"}, {"x": 10, "y": 61.9, "facet": "regular"}, {"x": 15, "y": 71.2, "facet": "regular"}, {"x": 20, "y": 64.2, "facet": "regular"}, {"x": 0, "y": 66.5, "facet": "regular"}, {"x": 0, "y": 54.9, "facet": "regular"}, {"x": 5, "y": 57.7, "facet": "regular"}, {"x": 10, "y": 63.5, "facet": "regular"}, {"x": 15, "y": 80.7, "facet": "regular"}, {"x": 20, "y": 60.1, "facet": "regular"}, {"x": 0, "y": 63, "facet": "regular"}, {"x": 0, "y": 58.8, "facet": "regular"}, {"x": 5, "y": 68.6, "facet": "regular"}, {"x": 10, "y": 74.4, "facet": "regular"}, {"x": 15, "y": 63.8, "facet": "regular"}, {"x": 20, "y": 66.8, "facet": "regular"}, {"x": 0, "y": 68.6, "facet": "regular"}]}

Those are real customers out of the same 300, every seventh one, so the panels
are thin enough to see through. In the new customers' panel the cloud climbs
from left to right, and in the regulars' panel it drifts along flat. It is the
same chart in both panels telling two different stories, and pooling them would
have averaged the climb and the drift into a single slope in between.

Customer type is doing the same job here that it did with the yes-or-no
coupon, because it decides how big the discount's effect is. A column with
that job has a name. It is called the moderator.

=== step === concept

## Fitting it when the moderator is a number

Nothing about the syntax changes. Swap the yes-or-no `coupon` column for the
numeric `discount` column and keep the star.

```r
m_disc <- lm(spend ~ discount * type, data = shoppers)
round(coef(summary(m_disc)), 3)
#>                      Estimate Std. Error t value Pr(>|t|)
#> (Intercept)            45.185      1.130  39.977        0
#> discount                1.482      0.101  14.662        0
#> typeregular            21.264      1.598  13.303        0
#> discount:typeregular   -1.324      0.143  -9.261        0
```

The rows mean exactly what they meant before, with one phrase swapped in.
Where you used to say "the effect of a coupon", you now say "per extra
percentage point of discount".

`discount` is 1.482, so for a new customer every extra percentage point off is
worth another $1.48 of spending. `discount:typeregular` is -1.324, so that
per-point value is $1.32 smaller for a regular.

The one genuinely new thing to watch is the intercept. It is the expected
spend of a new customer at `discount = 0`, which here is a real customer who
really did get no coupon. When zero is not a value your data actually contains
(think income, or year, or temperature in Fahrenheit), the intercept and both
main effects are describing somebody who does not exist, which is why people
often subtract the mean from a numeric predictor before fitting.

=== step === tryit

## What is one point of discount worth to each group?

The store has a budget question. If they deepen the discount by one percentage
point, whose extra spending does that buy the most of?

It is the same rule as before. The reference group's slope is the main effect,
and any other group's slope is the main effect plus that group's cross term.

Fill in both blanks.

```r
b <- coef(m_disc)
b

slope_new     <- ____
slope_regular <- ____
round(c(slope_new = unname(slope_new),
        slope_regular = unname(slope_regular)), 3)
```

::check {"regex": "discount.*\\+.*discount:typeregular", "gate": true, "difficulty": "intermediate", "ok": "Right: about 1.48 dollars per point from a new customer and about 0.16 from a regular, roughly nine times the return on the same discount. That is a decision, not just a coefficient.", "no": "Not yet. The slope for new customers is the discount row on its own, because new is the reference level. The slope for regulars is that row plus the row named discount:typeregular."}

::solution

```r
b <- coef(m_disc)

slope_new     <- b["discount"]
slope_regular <- b["discount"] + b["discount:typeregular"]
round(c(slope_new = unname(slope_new),
        slope_regular = unname(slope_regular)), 3)
#>     slope_new slope_regular
#>         1.482         0.158
```

One percentage point of discount buys $1.48 of extra spending from a new
customer, and it buys 16 cents from a regular. If the store has a fixed
discount budget for next quarter, that one comparison tells them where to
spend it.

=== step === concept

## How do I write this up?

Someone who is never going to read a coefficient table needs three things from
you: the effect inside each group, in the units of the thing being measured,
and the test that says the difference between those effects is not noise.

Here is the store result written that way, and every number in it came off
your own screen while you were working through the code.

> Sending a discount coupon raised average monthly spending by $19.03 among
> new customers, from $44.85 to $63.88, and by $0.91 among long-time regulars,
> from $67.16 to $68.07. The difference between those two lifts is larger than
> sampling noise can account for (F(1, 296) = 51.2, p < 0.001). In plain terms,
> the coupon pays for itself on new customers and does close to nothing on
> regulars.

Notice what is missing from that paragraph. The number -18.12 never appears.
It is the correct interaction coefficient, and it is the one number in the
whole analysis a reader cannot do anything with, because it is a difference
between two effects they were never told.

[WARNING]
Keep both main effects whenever you keep the interaction. Fitting something
like `spend ~ coupon:type` without `coupon` and `type` in the model leaves you
with a cross term that depends entirely on where zero happens to sit, and the
coefficients stop meaning anything you can defend. Leave the main effects in
even when their own p-values are large.

=== step === quiz

## Which write-up would you send?

Four versions of the same result land in your inbox. All four are about the
store data you just analysed. Which one would you actually send to the finance
team?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The interaction between coupon and customer type was significant (b = -18.12, p < 0.001). ::no Correct, and unusable. The reader is handed a difference between two effects without being told either effect.
- The coupon raised spending by $19.03 for new customers and by $0.91 for regulars, and that difference is far larger than sampling noise (F(1, 296) = 51.2, p < 0.001). ::ok That is the one. Both effects in dollars, the groups named, and the test saying the gap between them is real. A reader can act on this without knowing what a cross term is.
- The coupon raised spending by about $10 per customer (p < 0.001). ::no The pooled number, reported as though it described somebody.
- The coupon had no consistent effect across customer types, so no reliable conclusion can be drawn. ::no Not that one. A reader needs the two effects themselves, in dollars, plus the test that the difference between them is real. A lone cross-term coefficient gives a difference without the things being differenced. A pooled $10 describes neither group. And "no consistent effect" turns the actual finding upside down: you did not fail to find an effect, you found that the effect depends on who receives it, and that is a result worth reporting on its own.

=== step === concept

## References

- [Faraway, J. Practical Regression and Anova using R](https://cran.r-project.org/doc/contrib/Faraway-PRA.pdf), on model comparison and factor coding in linear models.
- [Fox, J. and Weisberg, S. An R Companion to Applied Regression](https://www.john-fox.ca/Companion/), the chapter on linear models with categorical and continuous predictors.
- [UCLA OARC: Decomposing, Probing, and Plotting Interactions in R](https://stats.oarc.ucla.edu/r/seminars/interactions-r/), a long worked treatment of group-by-group slopes.
- [R documentation for `formula`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html), which defines what `*` and `:` expand to.
- [R documentation for `anova.lm`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/anova.lm.html), the F test used here to compare the two models.

If you want to go further than this, the standard book-length treatment is
*Multiple Regression: Testing and Interpreting Interactions*, written by
Aiken, L.S. and West, S.G. and published by Sage in 1991.

=== step === complete

## What you can do now

You started with a $10 coupon effect that described nobody. Here is what to do
the next time one turns up.

- **Spot it before modelling.** Compute the effect separately inside each
  group. If the two numbers differ a lot, as $19.03 and $0.91 do, there is an
  interaction and a pooled average will bury it.
- **Put it in the model.** `spend ~ coupon * type`. The star gives you both
  main effects and the cross term in one character.
- **Read every row.** The intercept is the reference cell, a main effect is
  the reference group's effect, and the cross term is how much that effect
  changes for the other group.
- **Recover each group's own effect.** Add the cross term to the main effect,
  or skip the arithmetic and run `predict()` on a small grid of combinations.
- **Test it.** `anova(m_add, m_int)` asks whether the extra term earns its
  place. If it does not, drop it and report the pooled effect with a clear
  conscience.
- **Report it.** Give both effects in real units, name the groups, add the
  test. Never send the cross-term coefficient on its own.

The same moves work when the moderator is a number instead of a group.
`spend ~ discount * type` told you a percentage point of discount is worth
$1.48 to a new customer and 16 cents to a regular, which is the kind of
sentence a budget meeting can actually use.
