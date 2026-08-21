---
title: "Interaction effects: test and interpret them"
slug: "Regression-Reading-Mini-1"
description: "A coupon lifted new customers by 12 dollars and regulars by 1. Learn to spot that split in your data, put it into a model, test it, and report it right."
keywords: "interaction effects in R, interaction term in lm, interpret interaction coefficient, test an interaction, nested F test in R, moderation in R, cross term regression"
mathjax: false
webr: true
date: "2026-08-21"
post_type: "LESSON"
course_id: "reading-model-output"
course_title: "Reading Regression Models"
course_lesson: "1"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.5"
lesson_access: "windowed"
catalog_blurb: "How to spot an effect that changes by group, and report it."
---

=== step === cover
::eyebrow Reading Regression Models
## Interaction effects: test and interpret them

Let's say your store mails a discount coupon to half of its customers.

A month later the numbers come in. Customers who got a coupon spent about six and a half dollars more than customers who did not. So the coupon works, and someone in the meeting is already asking how much bigger the next mailing should be.

Then, before you agree to anything, you split those customers into two piles: the people who were already buying from you, and the people who were not.

New customers spent about twelve dollars more when they had a coupon. Regulars spent about one dollar more, which is nothing at all. They were going to buy anyway, so the coupon just handed them a discount on an order they had already decided to make.

So the question, does the coupon work, turns out to have no single answer. It depends entirely on who gets the coupon.

Right?

That is an interaction, and you already know it from ordinary life. The part that is easy to miss is what happens when a model does not know about it. It will report one average effect that is wrong for both groups, and nothing in the output will look broken.

So here is what we are going to do about it.

::widget process-flow {"steps":[{"title":"Split the effect by group","sub":"what the coupon did to new customers and to regulars"},{"title":"Put the split into the model","sub":"one star lets the coupon effect differ between groups"},{"title":"Test whether it earned its place","sub":"keep the extra term only if it pays for itself"}]}

We are going to do all three on a table of 1,200 customers, one piece at a time.

=== step === concept
## The coupon test the store ran

Let's build the store's data first, because every number from here on comes out of it.

There are 1,200 customers. Six hundred of them are new, meaning this is their first month with the store, and six hundred are regulars who have bought before. Inside each of those two halves, a coin toss decided who got a coupon and who did not.

We then record what each customer spent over the next thirty days, in dollars, and the device the order came from, mobile or desktop.

One thing worth saying out loud before you run it: this data is made up, and we are building it in front of you rather than loading it from somewhere. That is deliberate. Because we plant the answer ourselves, we can check at the end whether the model finds it.

What we plant is this. The coupon adds 12 dollars for a new customer and 1 dollar for a regular. Desktop orders run 6 dollars larger than mobile ones no matter who is ordering. And everybody's spending wobbles around by a random amount, the way real spending does.

Press Run.

```r
# Build the store's coupon test: 1,200 customers, half new and half regular
set.seed(117)

n <- 1200
customer <- factor(rep(c("new", "regular"), each = 600), levels = c("new", "regular"))
coupon   <- factor(sample(c("no", "yes"), n, replace = TRUE), levels = c("no", "yes"))
device   <- factor(sample(c("mobile", "desktop"), n, replace = TRUE), levels = c("mobile", "desktop"))

spend <- 40 +
  18 * (customer == "regular") +                           # regulars start out spending more
  6  * (device == "desktop") +                             # desktop orders run a little larger
  ifelse(customer == "new", 12, 1) * (coupon == "yes") +   # the coupon, and it is not one number
  rnorm(n, sd = 15)                                        # everyday random wobble

coupons <- data.frame(customer, coupon, device, spend = round(spend, 2))

head(coupons, 4)
#>   customer coupon  device spend
#> 1      new     no  mobile 54.98
#> 2      new    yes  mobile 40.99
#> 3      new     no desktop 33.86
#> 4      new    yes desktop 59.10

table(coupons$customer, coupons$coupon)
#>          
#>            no yes
#>   new     297 303
#>   regular 300 300
```

Let me say a few words about that code, in case any of it is new to you.

- `factor()` turns text into a labelled category with a fixed list of allowed values, which is how R knows `customer` is a grouping and not a word it should try to do arithmetic on. The order you pass to `levels` matters later, so keep it in mind.
- `set.seed(117)` fixes the random numbers, so the table on your screen is the same as the one on mine.
- `rnorm(n, sd = 15)` is the wobble: 1,200 random nudges, mostly within about 15 dollars of zero.

Now read the table of counts at the bottom. The four groups came out at 297, 303, 300 and 300 customers, near enough to even, which is what a coin toss inside each half should give you. That balance matters, because it means no group is so thin that we would be reading noise.

=== step === concept
## What the coupon did to the average order

The store's first instinct is the obvious one. Take everyone who got a coupon, take everyone who did not, and compare the two averages.

`mean()` gives the average of a column, and the square brackets pick out just the rows we want.

```r
# The headline number: average spend with a coupon, minus average spend without
with_coupon <- mean(coupons$spend[coupons$coupon == "yes"])
no_coupon   <- mean(coupons$spend[coupons$coupon == "no"])

round(c(with_coupon = with_coupon,
        no_coupon   = no_coupon,
        difference  = with_coupon - no_coupon), 2)
#> with_coupon   no_coupon  difference 
#>       58.20       51.61        6.58
```

So there it is: 58.20 dollars against 51.61, a difference of 6.58 dollars per customer.

That number is not wrong. The arithmetic is fine, and if the store mailed a coupon to another thousand customers drawn the same way, it really would expect about six and a half extra dollars each on average.

The trouble is what people do with it next. They say "the coupon is worth 6.58 dollars a customer" and plan the next mailing around that figure, as though every customer walked around carrying that number.

Not one of the 1,200 customers has an effect of 6.58 dollars. Let's see why.

=== step === concept
## The same coupon, new customers against regulars

Instead of two averages, let's take four: one for each combination of customer type and coupon.

`aggregate()` does exactly that. The formula `spend ~ coupon + customer` reads as "average `spend`, broken down by `coupon` and by `customer`", and `FUN = mean` says which kind of average we want.

```r
# Average spend in each of the four groups, then the coupon gap inside each customer type
cell_means <- aggregate(spend ~ coupon + customer, data = coupons, FUN = mean)
cell_means
#>   coupon customer    spend
#> 1     no      new 42.09364
#> 2    yes      new 54.45479
#> 3     no  regular 61.03870
#> 4    yes  regular 61.97590

new_no  <- cell_means$spend[cell_means$customer == "new"     & cell_means$coupon == "no"]
new_yes <- cell_means$spend[cell_means$customer == "new"     & cell_means$coupon == "yes"]
reg_no  <- cell_means$spend[cell_means$customer == "regular" & cell_means$coupon == "no"]
reg_yes <- cell_means$spend[cell_means$customer == "regular" & cell_means$coupon == "yes"]

round(c(new_customers = new_yes - new_no,
        regulars      = reg_yes - reg_no), 2)
#> new_customers      regulars 
#>         12.36          0.94
```

Look at the two gaps at the bottom, because they are the whole story in two numbers.

A new customer with a coupon spent 12.36 dollars more than a new customer without one. A regular with a coupon spent 0.94 dollars more than a regular without one, and 94 cents is a rounding error on a sixty dollar order.

Now put the headline back beside them. The store's one number was 6.58, and it sits neatly between 12.36 and 0.94 because it is roughly their average. It is too small for new customers, too big for regulars, and right for nobody.

[KEY INSIGHT]
When an effect is different in different groups, the single overall effect is an average of those group effects. It is arithmetically correct and practically useless, because there is no customer it applies to.

One more thing to notice while it is on screen. Regulars spent 61.04 dollars without a coupon and new customers spent 42.09, so regulars simply spend more. That gap of about 19 dollars is a difference in height between the two groups and has nothing to do with the coupon. Keep those two ideas apart: how high a group sits, and how far the coupon moves it.

=== step === concept
## Two lines that refuse to stay parallel

Four numbers are easy to misread. The same four as a picture are hard to argue with.

We are going to plot spending up the vertical axis and coupon along the horizontal, with one line for new customers and one for regulars. `interaction.plot()` is built into R for exactly this, and it works out the group averages for you.

```r
# Draw the four group averages as two lines, one per customer type
interaction.plot(x.factor     = coupons$coupon,
                 trace.factor = coupons$customer,
                 response     = coupons$spend,
                 fun          = mean,
                 type = "b", pch = 19, lwd = 2,
                 col  = c("#2563a8", "#b5631a"),
                 xlab = "Coupon",
                 ylab = "Mean spend in dollars",
                 trace.label = "Customer",
                 main = "What the coupon did to each customer type")
```

There are your two lines, and they are not parallel. The lower line, new customers, climbs steeply from 42 to 54. The upper line, regulars, is nearly flat.

That shape is the thing to learn to see, so here is how to read any version of it.

- **Parallel lines** mean the effect is the same in both groups. Whatever the coupon is worth, it is worth that to everybody, and one number describes the whole store.
- **Lines at different angles** mean the effect depends on the group. There is no single coupon effect to report, because the coupon does one thing to new customers and something else to regulars.

Our lines are at different angles. In one word, that is an **interaction**: the effect of one thing, the coupon, depends on the value of another thing, the customer type.

And notice that an interaction is symmetric. You can read the same picture the other way round and say the gap between new customers and regulars depends on whether a coupon was sent, which is equally true. It is one fact about the data, and you can say it from either side.

=== step === quiz
## Quick check: what do the two gaps say about the coupon?

The coupon moved new customers by 12.36 dollars and regulars by 0.94, and the store's headline number was 6.58 dollars.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The 6.58 figure is a mistake in the arithmetic, because neither group actually moved by that much. ::no
- The coupon does a lot for new customers and almost nothing for regulars, so a single average effect answers a question the store never asked. ::ok Exactly. Nothing about 6.58 is miscalculated, it is just the wrong shape of answer. Once the effect changes from group to group, the useful output is two numbers rather than one.
- The coupon works, and 6.58 dollars is the best single summary of how well it works. ::no
- Regulars spend more per order than new customers, so the coupon must be working better on regulars. ::no Careful with those two ideas. Regulars do sit higher, at about 61 dollars against 42, but that is where they started before any coupon existed. What the coupon is worth is the gap inside each group, and there it is 12.36 for new customers against 0.94 for regulars. And 6.58 is not an error, it is the average of those two, which is exactly why it fits neither.

=== step === concept
## What a model without a cross term has to believe

Now let's move from averages to a model, because a model is what you would actually fit.

`lm()` fits a linear model: you hand it a formula and a data frame, and it hands back one number per term, chosen so the model's predictions land as close to the real spending as possible. The formula `spend ~ coupon + customer` says "explain spend using coupon and customer".

That plus sign is saying more than it looks. It says the coupon shifts spending by some amount, the customer type shifts spending by some other amount, and the two shifts simply add up. That is one coupon effect, applied to everybody.

Let's fit it and hold its four predictions next to the four real averages. `predict()` takes a fitted model and a table of situations, and returns what the model expects in each one.

```r
# Fit a model with no cross term, then compare what it expects with what happened
m_add <- lm(spend ~ coupon + customer, data = coupons)

comparison <- cell_means
names(comparison)[3] <- "actual_mean"
comparison$actual_mean  <- round(comparison$actual_mean, 2)
comparison$additive_fit <- round(predict(m_add, newdata = cell_means), 2)
comparison
#>   coupon customer actual_mean additive_fit
#> 1     no      new       42.09        44.98
#> 2    yes      new       54.45        51.63
#> 3     no  regular       61.04        58.18
#> 4    yes  regular       61.98        64.83
```

Compare the last two columns row by row and you can watch the model struggle.

For new customers without a coupon it predicts 44.98 when the truth is 42.09, so it is nearly 3 dollars too high. For new customers with a coupon it predicts 51.63 when the truth is 54.45, so now it is nearly 3 dollars too low. For regulars with a coupon it predicts 64.83 against a real 61.98, which is almost 3 dollars out in the other direction again.

Those misses are not random. They follow a pattern, and the pattern comes straight from what the model is forced to believe.

Work out the coupon step inside each customer type in the fitted column. For new customers it is 51.63 minus 44.98, which is 6.65. For regulars it is 64.83 minus 58.18, which is also 6.65. It is exactly the same number, and that is no coincidence.

[NOTE]
A model built with `+` has no term that could make the coupon do different things in different groups. It can put the two groups at different heights, and that is all it can do. Drawn on the picture from a moment ago, its two lines are parallel by construction, so it splits the difference and misses in both groups.

=== step === concept
## Adding the interaction with a single star

The fix is one character. Swap the `+` between `coupon` and `customer` for a `*`.

```r
# Fit the same model, but let the coupon effect differ between the two customer types
m_int <- lm(spend ~ coupon * customer, data = coupons)

round(coef(summary(m_int))[, c("Estimate", "Std. Error")], 2)
#>                           Estimate Std. Error
#> (Intercept)                  42.09       0.88
#> couponyes                    12.36       1.24
#> customerregular              18.95       1.24
#> couponyes:customerregular   -11.42       1.75
```

Before we read the numbers, look at the formula itself. `coupon * customer` is shorthand, and R expands it into three terms:

```
coupon * customer   becomes   coupon + customer + coupon:customer
```

So you get both original terms plus a new one, `coupon:customer`, which is written with a colon and is called the **cross term** or the interaction term. The colon on its own gives you only the cross term, so `spend ~ coupon:customer` would leave the other two out. In practice you almost always want the star, and in a few minutes we are going to see why.

Now let's read the output. The model has four rows where the earlier one had three, and the new fourth row is the cross term.

The **Estimate** column holds the numbers the model fitted. The **Std. Error** column beside it says how much each of those numbers would wobble if the store ran the whole test again on a fresh 1,200 customers, so it measures how firmly the data pins each estimate down.

Those four estimates are not four separate effects. They are four instructions for rebuilding the four group averages, so let's read them one at a time.

=== step === concept
## What the four numbers in the coefficient table stand for

R turned the two categories into rows with names like `couponyes` and `customerregular`, and those names tell you exactly what each number does.

When R meets a factor it picks one level as the **reference level** and measures everything else against it. The reference is the first level, which for us is `no` for the coupon and `new` for the customer, because that is the order we put in `levels`. There is no row for the reference level itself, because it is the baseline that every other row is a step away from.

So let's take them one row at a time.

- `(Intercept)` = **42.09** is not an effect at all. It is the average spend of one specific group: new customers with no coupon, the corner where both factors sit at their reference level.
- `couponyes` = **12.36** is one step away from that corner. Take a new customer, hand them a coupon, and spending goes up by 12.36 dollars.
- `customerregular` = **18.95** is the other step. Take a customer with no coupon, make them a regular instead of new, and spending goes up by 18.95 dollars. That is the height difference we spotted earlier, the one that has nothing to do with coupons.
- `couponyes:customerregular` = **-11.42** is the cross term, and it is a correction to a step rather than a step itself. It says the coupon does 11.42 dollars less for a regular than it does for a new customer.

That last one is the one people misread, so say it slowly. The cross term is not the coupon's effect on regulars. It is the difference between two coupon effects: 12.36 for new customers, and 12.36 minus 11.42, which is 0.94, for regulars.

And 12.36 and 0.94 are the two gaps we worked out by hand from the averages. The model found them.

Let's prove the four numbers really do rebuild the four group averages. `coef()` pulls the estimates out of a fitted model as a plain vector.

```r
# Rebuild all four group averages by adding up the coefficients
b <- coef(m_int)

round(c(new_no      = unname(b[1]),
        new_yes     = unname(b[1] + b[2]),
        regular_no  = unname(b[1] + b[3]),
        regular_yes = unname(b[1] + b[2] + b[3] + b[4])), 2)
#>      new_no     new_yes  regular_no regular_yes 
#>       42.09       54.45       61.04       61.98
```

Those four numbers, 42.09, 54.45, 61.04 and 61.98, are the same averages `aggregate()` gave us earlier, to the cent.

Notice which pieces each corner needed. A new customer with a coupon takes the intercept plus the coupon row. A regular with no coupon takes the intercept plus the customer row. A regular with a coupon is the only corner that needs all four, because it is the only one where both factors have moved off their reference at once, and the cross term is the number that says what happens when they do.

[KEY INSIGHT]
With a cross term in the model, a main effect is no longer an average effect. `couponyes` is the coupon's effect for new customers only, because new is the reference level. To get any other group's effect, you add the cross term to it.

=== step === quiz
## Quick check: what does the cross-term coefficient measure?

The cross term `couponyes:customerregular` came back as -11.42 dollars.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The coupon's effect on regular customers. ::no
- How much the coupon's effect changes when you move from a new customer to a regular. ::ok That is it. It is a difference between two effects, so on its own it describes nobody. Add it to `couponyes` and you get the effect for regulars: 12.36 plus -11.42, which is 0.94.
- The average coupon effect across both customer types. ::no
- The difference in spending between regulars and new customers. ::no Two of these name real numbers in the table, just not this one. The coupon's effect on regulars is 0.94 and the height difference between the groups is 18.95, and neither of those is -11.42. The cross term is the gap between the two coupon effects, which is why it comes out negative even though the coupon never once reduced anybody's spending.

=== step === tryit
## Your turn: find the coupon effect for regular customers

The fitted model `m_int` is still loaded, and `coef(m_int)` holds its four numbers under these names:

`(Intercept)`, `couponyes`, `customerregular`, `couponyes:customerregular`.

Two of those four combine to give the coupon's effect on regular customers. Write the line that adds them and prints the answer, rounded to two decimals.

```r
# Pull the coupon effect for REGULAR customers out of the fitted coefficients.
# Start from coef(m_int) and add the two rows that belong together.
# One line, then press Check.
```
::check {"regex": "(?=[\\s\\S]*couponyes(?!:))(?=[\\s\\S]*couponyes:customerregular)", "gate": true, "difficulty": "beginner", "ok": "Yes: 0.94 dollars. The coupon row is the effect for new customers, and the cross term is what to add when you move to regulars, so 12.36 plus -11.42 gives you 94 cents.", "no": "Name the two rows rather than counting positions: take `coef(m_int)` and add `couponyes` to `couponyes:customerregular`, then wrap the result in round(). The cross term is the piece that carries you from one group to the other."}
::solution
```r
# The coupon effect for regular customers: the coupon row plus the cross term
b <- coef(m_int)

round(unname(b["couponyes"] + b["couponyes:customerregular"]), 2)
#> [1] 0.94
```

=== step === concept
## Why the coupon row no longer means what it used to

There is a trap sitting in that coefficient table, and it catches careful people.

The row labelled `couponyes` says 12.36. In a model with no cross term, a row like that would be the coupon's effect across the whole store. Here it is the coupon's effect for new customers alone, because new is the reference level, and nothing in the label warns you.

Here is how to see that it really is tied to the reference. `relevel()` makes a different level the reference, so let's make `regular` the baseline and fit the very same model again.

```r
# Refit the identical model with regular customers as the reference level
coupons_reg <- coupons
coupons_reg$customer <- relevel(coupons_reg$customer, ref = "regular")

m_int2 <- lm(spend ~ coupon * customer, data = coupons_reg)

round(coef(summary(m_int2))[, c("Estimate", "Std. Error")], 2)
#>                       Estimate Std. Error
#> (Intercept)              61.04       0.87
#> couponyes                 0.94       1.24
#> customernew             -18.95       1.24
#> couponyes:customernew    11.42       1.75
```

Every number moved. The intercept is now 61.04, the average spend of a regular with no coupon, and `couponyes` is now 0.94, the coupon's effect on regulars. The customer row flipped sign, and so did the cross term.

Nothing about the store changed. We changed which group R measures the others against, and the coefficients rearranged themselves to describe the same data from a new corner.

That raises a fair question. If the numbers move around like that, is the model itself any different? It is not. Watch what both fits predict for the four groups.

```r
# The same four predictions from both fits, despite the different coefficients
round(cbind(first_fit  = predict(m_int,  newdata = cell_means),
            second_fit = predict(m_int2, newdata = cell_means)), 2)
#>   first_fit second_fit
#> 1     42.09      42.09
#> 2     54.45      54.45
#> 3     61.04      61.04
#> 4     61.98      61.98
```

They are identical, to the cent. It is the same model and the same fit, telling you the same thing from a different starting corner.

[WARNING]
Once a cross term is in the model, never read a main effect as an overall effect. It answers only about the reference level, and moving the reference moves the number. If somebody hands you an interaction model and quotes the `couponyes` row as "the coupon effect", ask which group is the reference before you believe it.

This is also why `relevel()` is worth knowing. Setting the reference to the group you actually want to talk about is the quickest way to read that group's effect straight off the table, with no arithmetic at all.

=== step === concept
## Is the interaction real, or is it noise?

We have been treating the split as a fact, and so far the only evidence for it is that 12.36 and 0.94 look different. They do. But two group averages built from about 300 customers each will always differ a bit, even when nothing is going on, purely because different people happened to land in each group.

So we need to ask a harder question. If the coupon really were worth the same to everybody, how often would random assignment hand us a split this big anyway?

The way to ask it is to compare the two models we have already fitted. One says there is a single coupon effect. The other says there are two. `anova()` takes both and reports whether the extra term bought enough improvement in fit to justify the extra number it cost.

```r
# Compare the model with one coupon effect against the model with two
anova(m_add, m_int)
#> Analysis of Variance Table
#>
#> Model 1: spend ~ coupon + customer
#> Model 2: spend ~ coupon * customer
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)    
#> 1   1197 283581                                  
#> 2   1196 273794  1    9787.5 42.754 9.172e-11 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Let's read that table across, because every column has a job.

- `RSS` is the residual sum of squares, which is how much of the spending each model failed to explain, so smaller is better. It falls from 283,581 to 273,794.
- `Sum of Sq` is what the cross term recovered out of that leftover: 9,787.5.
- `Df` is 1, meaning the cross term cost exactly one extra number.
- `F` is 42.754. Roughly speaking, it is the improvement in fit measured against the everyday noise in the data, so a large F means the improvement is far bigger than noise usually manages.
- `Pr(>F)` is 9.172e-11, which is R's shorthand for 0.00000000009172.

That last number is the one to lean on. It says that in a world where the coupon was worth the same to both groups, an improvement this big would turn up about once in ten billion tests. We ran one test and got it.

So the split is not sampling noise. Keep the term.

[TIP]
Run this test on the pair of models rather than reading the cross term's own p-value. With a two-level factor the two say almost the same thing. With a factor of three or more levels the cross term spreads across several rows, and only the test on the pair asks the one question you care about, which is whether the interaction as a whole earned its place.

=== step === tryit
## Your turn: does the coupon effect depend on the device too?

The store also recorded whether each order came from a mobile or a desktop. Which raises the obvious question: does the coupon do more on one device than on the other?

Run the same comparison you just watched, with `device` where `customer` was. Fit the model with no cross term, fit the model with one, and hand both to `anova()`.

Then read the answer honestly, whichever way it comes out.

```r
# Test whether the coupon effect depends on the device.
# Fit a model with no cross term, fit one with a cross term,
# then compare the pair. The data frame is coupons.
# Three lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*coupon\\s*[*]\\s*device)(?=[\\s\\S]*anova)", "gate": true, "difficulty": "intermediate", "ok": "Right, and the answer is no. F comes out at 0.43 with a p-value of 0.511, so the cross term bought almost nothing. On this data the coupon is worth about the same on a phone as on a laptop, and the model should stay additive in device.", "no": "You need three lines: `m_dev_add <- lm(spend ~ coupon + device, data = coupons)`, then the same thing with `coupon * device` saved as `m_dev_int`, then `anova(m_dev_add, m_dev_int)`."}
::solution
```r
# Compare a device model with no cross term against one with a cross term
m_dev_add <- lm(spend ~ coupon + device, data = coupons)
m_dev_int <- lm(spend ~ coupon * device, data = coupons)

anova(m_dev_add, m_dev_int)
#> Analysis of Variance Table
#>
#> Model 1: spend ~ coupon + device
#> Model 2: spend ~ coupon * device
#>   Res.Df    RSS Df Sum of Sq      F Pr(>F)
#> 1   1197 320400                           
#> 2   1196 320285  1    115.79 0.4324  0.511
```

Put that beside the customer test and the difference is hard to miss. There the cross term recovered 9,787 and F was 42.75. Here it recovered 116 and F is 0.43, which means the improvement is smaller than ordinary noise produces on its own.

A p-value of 0.511 says a gain at least this big turns up about half the time when there is nothing there at all. So drop this cross term and keep `spend ~ coupon + device`, which is the honest model for that pair.

That is a real result, not a failed one. The device shifts how much people spend, but it does not change what the coupon is worth, and knowing which of your variables behave that way is worth as much as knowing which ones do not.

=== step === widget
## When a coupon helps one group and hurts the other

So far the coupon has been a yes or a no. Suppose instead the store varies the size of the discount, from nothing up to ten dollars off, and measures spending as that discount grows.

Now the two customer types can do more than climb at different speeds. They can move in opposite directions. A bigger discount pulls new customers in, so their spending rises. Regulars were buying anyway, so a bigger discount only shaves money off an order that was already coming, and their spending falls.

That is the sharpest version of an interaction, and it has a name: a **crossover**, because the two lines cross.

The panel below runs that case on its own set of made-up numbers, so its axes are labelled in general terms. Read the predictor along the bottom as the size of the discount, and the outcome up the side as spending. It fits both models to the same points and shows you what each one says. The dashed pair is the model with no cross term, the two solid lines are the model with one, and there is real R underneath that you can run and edit.

::widget wrong-family-fit {"mode": "interaction"}

Look at what the model without the cross term reports. Its single slope comes out close to zero, because it is averaging a rise against a fall and the two very nearly cancel.

Read that slope on its own and you would write "the discount makes no difference" in your report and move on. It would be completely wrong. The discount makes a large difference to both groups, in opposite directions, and the model you fitted had no way to say so.

[WARNING]
A near-zero effect can mean nothing is happening, or it can mean two things are happening that cancel out. The two look identical in the output. The only way to tell them apart is to ask whether the effect might differ by group, and then test it.

Notice also that the two dashed lines stay parallel no matter what. That is not the data speaking, it is the model. `+` has no term capable of bending them, so a model built that way cannot report a crossover even when the crossover is the entire story.

=== step === concept
## Saying the finding in one sentence the team can act on

The analysis is done. Now somebody has to hear it, and this is where interactions usually get mangled.

There are two ways to mangle it. Report the average effect, 6.58 dollars, and you have described nobody. Report the cross term, -11.42 dollars, and you have quoted a difference between two effects that you never actually stated, which sounds a lot like the coupon costing money.

Report the two group effects instead. That is what the store can act on.

While we are at it, let's put a range around each one, because a single number hides how firmly the data pins it down. A **95% confidence interval** is the range of true effects that sit comfortably with the data we collected, and `confint()` reads it straight off a fitted model.

We already have both fits we need. `m_int` has new customers as the reference, so its `couponyes` row is the new-customer effect. `m_int2` has regulars as the reference, so its `couponyes` row is the regulars' effect.

```r
# The coupon effect inside each customer type, with a 95% interval on each
new_effect     <- c(coef(m_int)["couponyes"],  confint(m_int)["couponyes", ])
regular_effect <- c(coef(m_int2)["couponyes"], confint(m_int2)["couponyes", ])

effects <- round(rbind(new_customers = new_effect, regulars = regular_effect), 2)
colnames(effects) <- c("effect", "low", "high")
effects
#>               effect   low  high
#> new_customers  12.36  9.94 14.79
#> regulars        0.94 -1.49  3.36
```

There are two rows there, and each one is a sentence waiting to be written.

For new customers the coupon is worth 12.36 dollars, and the data is consistent with anything from about 10 to about 15. Every value in that range is real money, so the finding holds up whichever end you take.

For regulars the coupon is worth 0.94 dollars, and the range runs from -1.49 to 3.36. It includes zero, which means the data cannot rule out the coupon doing nothing whatsoever for regulars, and the largest effect it can support is a few dollars.

So here is the sentence for the meeting:

> The coupon added about 12 dollars per new customer, somewhere between 10 and 15. For regular customers it added about a dollar, and we cannot tell that apart from nothing. Send it to new customers.

Read it back. It names both groups, it carries a range for each, and it never once mentions the average effect or the cross term. That is the whole reporting rule.

[TIP]
Two habits make this easier every time. Refit with `relevel()` so each group takes its turn as the reference, and read that group's effect and interval straight off the table. And put the picture in the deck, because two lines at different angles convince a room faster than any coefficient will.

=== step === quiz
## Quick check: which write-up of the coupon result is right?

You are writing one line about the coupon test for the team. The model gave 12.36 dollars for new customers with an interval of 9.94 to 14.79, and 0.94 dollars for regulars with an interval of -1.49 to 3.36. The cross term was -11.42, and the store's overall average was 6.58.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The coupon raised spending by 6.58 dollars per customer. ::no
- The coupon effect is -11.42 dollars, so the coupon reduced spending. ::no
- The coupon added about 12.36 dollars per new customer, between 9.94 and 14.79, and about 0.94 for regulars, between -1.49 and 3.36. ::ok Exactly right. Both groups named, both with a range, no averaged effect and no bare cross term. That is a sentence somebody can make a decision on.
- The coupon added 12.36 dollars per customer, and customer type mattered as well. ::no Every one of these carries a real number, which is what makes them tempting. 6.58 is the average of two effects and describes neither group. The figure -11.42 is the gap between the two effects rather than an effect, and nobody's spending ever went down. And 12.36 belongs to new customers only, so quoting it for the whole store promises regulars a lift they did not get.

=== step === tryit
## Your turn: recover both coupon effects from a model you fit yourself

Let's do it one more time, without the scaffolding.

The data frame `coupons` is still loaded, with columns `customer`, `coupon`, `device` and `spend`. Fit the model that lets the coupon effect differ between customer types, then pull both group effects out of its coefficients and print them together.

You are aiming for 12.36 and 0.94.

```r
# Fit the interaction model on coupons, then read out BOTH coupon effects:
# the one for new customers and the one for regular customers.
# Three lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*coupon\\s*[*]\\s*customer)(?=[\\s\\S]*couponyes:customerregular)", "gate": true, "difficulty": "intermediate", "ok": "That is the whole skill in three lines. The coupon row is the reference group's effect, and the cross term carries you to the other group, so 12.36 and 12.36 plus -11.42 give you both numbers.", "no": "Two pieces are needed. Fit with a star, `lm(spend ~ coupon * customer, data = coupons)`, then read `couponyes` for new customers and add `couponyes:customerregular` to it for regulars."}
::solution
```r
# Fit the interaction model and read both group effects off the coefficients
m_mine <- lm(spend ~ coupon * customer, data = coupons)
b <- coef(m_mine)

round(c(new_customers = unname(b["couponyes"]),
        regulars      = unname(b["couponyes"] + b["couponyes:customerregular"])), 2)
#> new_customers      regulars 
#>         12.36          0.94
```

=== step === quiz
## Quick check: which model should the store ship?

The customer comparison came back with F = 42.75 and p = 9.172e-11. The device comparison came back with F = 0.43 and p = 0.511.

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- `spend ~ coupon * customer` for the customer question, and `spend ~ coupon + device` for the device question. ::ok Right on both counts. The customer cross term paid for itself and stays, the device one did not and goes, and each model keeps both of its main effects.
- `spend ~ coupon * customer * device`, since more terms can only fit the data better. ::no
- `spend ~ coupon:customer`, since the cross term is in and the main effects are now redundant. ::no
- `spend ~ coupon + customer` for both, since one average effect per variable is easier to report. ::no Two traps here are worth naming. Adding every cross term you can think of buys fit you never tested for and did not need, which is why the device term was tested and dropped rather than kept for safety. And dropping a main effect while keeping its cross term breaks the model in a quieter way: with `couponyes` gone there is nothing for the cross term to correct, so it stops meaning "how much the coupon effect changes" and starts meaning whatever the arbitrary zero point of the other variable makes it mean. Keep both main effects whenever you keep their interaction.

=== step === concept
## References

- [Understanding Interaction Models: Improving Empirical Analyses](https://doi.org/10.1093/pan/mpi014) - Brambor, Clark and Golder (2006), Political Analysis 14(1), 63-82. The clearest statement of why both main effects stay in the model whenever the cross term does.
- [An R Companion to Applied Regression](https://www.john-fox.ca/Companion/) - Fox and Weisberg (2019), 3rd edition, Sage. The chapters on factors and on models with interacting predictors, including how R builds those coefficient names.
- [Linear Models with R](https://julianfaraway.github.io/faraway/LMR/) - Faraway (2014), 2nd edition, Chapman and Hall/CRC. Factors, factor-covariate models and interactions, worked in R throughout.
- [Model formulae in R](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html) - R Core Team. The reference for what `*` and `:` expand into.
- [ANOVA for linear model fits](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/anova.lm.html) - R Core Team. The documentation for the nested F test that decides whether a cross term stays.

=== step === complete
## Quick recap

You took a coupon test where one average effect was wrong for everybody, found the split, put it into a model, tested it and wrote it up. Here is what is worth keeping:

- An interaction means one thing's effect depends on another thing's value. The coupon was worth 12.36 dollars to new customers and 0.94 to regulars, so the store's 6.58 dollar headline described nobody.
- You can see it before you fit anything. Take the four group averages, work out the gap inside each group, and look at whether the two lines come out parallel.
- `coupon * customer` expands into `coupon + customer + coupon:customer`. The cross term is a difference between two effects and never an effect on its own, so -11.42 means the coupon does 11.42 dollars less for a regular.
- With a cross term in, a main effect only answers about the reference level. Moving the reference with `relevel()` moves the coefficients and leaves the predictions untouched.
- `anova()` on the two models decides whether the term stays. The customer split earned its place at p = 9.172e-11, the device split did not at p = 0.511, and either way both main effects stay in.

And the sentence to say out loud, every time:

"The coupon added about 12 dollars per new customer, between 10 and 15. For regulars it added about a dollar, and we cannot tell that apart from nothing."

That is two groups, each one with its own number and its own range. Next time you meet a coefficient table with a star in the formula, you will take it apart the same way, right down to the harder case where the predictor is a measured number rather than a group. Congratulations, and have a great day!
