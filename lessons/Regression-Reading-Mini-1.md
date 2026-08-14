---
title: "Interaction effects: test and interpret them"
slug: "Regression-Reading-Mini-1"
catalog_blurb: "When one effect depends on another, and how to fit and report it."
description: "A coupon adds 12 dollars for new customers and about 3 for regulars, yet one model reports 7 for everybody. Fit it, test it, and report the difference honestly."
keywords: "interaction effects, interaction term in R, lm interaction, simple slopes, moderation, centering predictors, interpreting an interaction coefficient, statistics for beginners"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.5"
lesson_access: "windowed"
course_id: "reading-model-output"
course_title: "Reading Regression Models"
course_lesson: "1"
course_total: "2"
course_landing: "/dashboard.html"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 1 of 2
## Interaction effects: test and interpret them

You have had a lot of new ideas thrown at you this week, so today's is one you already know from ordinary life. It just needs a name and a bit of machinery.

Priya runs an online tea shop. Last month she emailed a discount coupon to two hundred of her customers, half of them buying for the first time and half of them regulars who order every few weeks. When the month closed she worked out the average spend in each of the four groups and stuck the numbers on the wall.

::widget chart-plotter {"data":[{"x":"new, no","y":22.22},{"x":"new, yes","y":34.17},{"x":"regular, no","y":39.07},{"x":"regular, yes","y":41.88}],"geoms":["bar"],"x":"who","y":"avg_spend"}

Read those bars in pairs. Among people ordering for the first time, the coupon moved the average from 22 dollars to 34, which is a lift of nearly 12. Among regulars it moved 39 to 42, a lift of about 3. So when her business partner asks the obvious question, does the coupon work, there is no single honest number to hand back, because it worked beautifully for one group and barely registered for the other.

That is an **interaction**: the effect of one thing depends on another thing. The awkward part is that a model which has not been told to look for one will not report both numbers. It averages them and reports about 7, which is far too small to describe what happened to the new customers and far too big to describe what happened to the regulars. Nobody in Priya's shop received a lift of 7 dollars.

By the end of this part you will be able to:

- Spot an interaction in a table of group averages, before fitting anything at all
- Put one into a model in R, and say in plain words what every coefficient means, including the strange-looking fourth one
- Test whether it earns its place, and say exactly what that test does and does not claim
- Report the result as two separate slopes with intervals, in a sentence someone can act on
- Read a main effect correctly once an interaction is present, and centre a predictor so the number means something
- Recognise the three ways this goes wrong: dropping a main effect, reading "not significant" as "the same in both groups", and running a study too small to find what you are looking for

**What you need first:** you can read a simple R script, so a variable, a vector, and a comparison like `customer == "new"` are familiar. No statistics background is assumed. Model, coefficient, slope, intercept, reference level, p-value, standard error and confidence interval all get defined here in plain words the moment they turn up.

One thing worth saying before we start. Priya and her shop are invented, and we build her two hundred orders ourselves in R in a moment. That is deliberate rather than lazy, because in a made-up shop you know the true rules in advance, so at the end you can check whether the model found what we planted. On real data you never get to see the answer key.

=== step === concept
::eyebrow Three answers in a meeting
## The three answers Priya could give

Put the three possible answers next to each other, because in a meeting they all sound equally reasonable.

- **Answer one.** Yes, the coupon adds about 7 dollars per customer.
- **Answer two.** Yes for new customers, who spend about 12 dollars more with it, and not really for regulars, who spend about 3 more.
- **Answer three.** It depends, which is what people say when they have not looked.

Answer one is a real number, correctly computed, and it describes nobody. Answer three is a shrug. Answer two is the one Priya can act on, because it tells her the coupon is a way of buying first orders rather than a way of getting more out of the people she already has, and those are two completely different business decisions.

[KEY INSIGHT]
An interaction is not a complication somebody invented to make regression harder. It is what you get whenever the honest answer to "what is the effect of X" begins with "well, it depends on...". The model is only being asked to say out loud what you would say anyway.

The rest of this part is about getting answer two out of R reliably, with a number attached to the difference, and a way to tell whether that difference is worth believing.

=== step === concept
::eyebrow The raw material
## Two hundred orders, built from nothing

Before we can model anything we need Priya's month. Here it is, made from scratch so we know exactly what is inside it.

```r
set.seed(42)

orders <- data.frame(
  customer = rep(c("new", "regular"), each = 100),
  coupon   = rep(c("no", "yes"), times = 100)
)

base_spend <- ifelse(orders$customer == "new", 22, 40)

coupon_lift <- rep(0, 200)
coupon_lift[orders$coupon == "yes" & orders$customer == "new"]     <- 12
coupon_lift[orders$coupon == "yes" & orders$customer == "regular"] <- 2

orders$spend <- round(base_spend + coupon_lift + rnorm(200, mean = 0, sd = 6), 2)

head(orders)
#>   customer coupon spend
#> 1      new     no 30.23
#> 2      new    yes 30.61
#> 3      new     no 24.18
#> 4      new    yes 37.80
#> 5      new     no 24.43
#> 6      new    yes 33.36
```

Take that apart line by line, because every rule we are about to try to recover is sitting in it.

`data.frame()` builds a table with one row per order. `rep(c("new", "regular"), each = 100)` writes "new" a hundred times and then "regular" a hundred times, and `rep(c("no", "yes"), times = 100)` alternates no, yes, no, yes all the way down, so within each customer type exactly half get a coupon. `set.seed(42)` pins R's random numbers so that your run prints the same figures as the ones here.

Then the truth we are planting. A new customer's typical order is 22 dollars and a regular's is 40, which is `base_spend`. The coupon adds 12 dollars to a new customer's order and 2 to a regular's, which is `coupon_lift`, written as three plain lines rather than one clever one so you can see exactly which group gets what. Finally `rnorm(200, mean = 0, sd = 6)` adds ordinary noise, because no two orders are ever identical: the 6 is a **standard deviation**, the usual word for how far a typical order strays from its group's average, so most orders land within about 6 dollars either side of what the rules say.

The interaction is that 12 against that 2. We put it there. Now everything that follows is a test of whether the tools can find it.

```r
table(orders$customer, orders$coupon)
#>          
#>           no yes
#>   new     50  50
#>   regular 50  50
```

Fifty orders in each of the four combinations, which is a tidy design and one less thing to worry about later.

=== step === concept
::eyebrow The tempting shortcut
## The answer you get if you do not look

Priya's first instinct is the natural one: compare everybody who got a coupon against everybody who did not.

```r
round(tapply(orders$spend, orders$coupon, mean), 2)
#>    no   yes 
#> 30.65 38.02
```

`tapply()` splits `spend` into groups defined by `coupon` and applies `mean()` to each group, so it is "average spend, one number per coupon status". The gap is 38.02 minus 30.65, which is 7.37 dollars.

Nothing about that calculation is wrong. It is the true average difference across her two hundred orders, and if she had to summarise the month in one number it is the correct one number.

The trouble starts the moment anyone uses it. Send a coupon to a new customer expecting 7 dollars back and you have badly undersold it. Send one to a regular expecting 7 and you have wasted the discount. A number that is wrong in opposite directions for the only two groups you have is worse than useless, because it is confidently wrong.

=== step === concept
::eyebrow Look again, in groups
## Split the same numbers four ways

The fix is not a technique. It is looking at the four cells you already have.

```r
cell_means <- tapply(orders$spend, list(orders$customer, orders$coupon), mean)
round(cell_means, 2)
#>            no   yes
#> new     22.22 34.17
#> regular 39.07 41.88
```

Passing `list(orders$customer, orders$coupon)` to `tapply()` splits by both columns at once, so you get a small grid: rows are customer type, columns are coupon status, and each entry is the average spend of the fifty orders in that combination. These four numbers are called **cell means**, cell being the old word for one box in a table like this.

Now do the subtraction inside each row, which is what "the effect of the coupon" actually means for that group.

```r
round(cell_means[, "yes"] - cell_means[, "no"], 2)
#>     new regular 
#>   11.95    2.81
```

`cell_means[, "yes"]` pulls out the whole "yes" column, so both coupon averages at once, and subtracting the "no" column gives the lift for each customer type in one line.

There it is, before any model has been fitted: **11.95 dollars for a first-time buyer and 2.81 for a regular.** We planted 12 and 2, and two hundred orders got us to within a rounding error of both. The single average of 7.37 sits halfway between the two, which is exactly what an average does, and it describes neither of them.

=== step === concept
::eyebrow The name for it
## Two lines that are not parallel

Draw those four averages and the whole idea becomes something you can see rather than something you have to hold in your head.

```r
interaction.plot(orders$coupon, orders$customer, orders$spend,
                 xlab = "coupon", ylab = "average spend in dollars",
                 trace.label = "customer", type = "b", pch = 19, lwd = 3,
                 col = c("#2563a8", "#b5631a"))
```

`interaction.plot()` is built into R for exactly this picture. The first argument goes on the horizontal axis, the second becomes one line per group, and the third is the thing being averaged. So you get two lines, each running from its group's no-coupon average up to its coupon average.

The line for new customers climbs steeply. The line for regulars is nearly flat. If the coupon had done the same thing to both groups the two lines would be **parallel**, sitting at different heights but rising by the same amount, and that is worth fixing in your memory because it is the whole visual signature:

- **Parallel lines** mean the effect of the coupon is the same for everyone, and the two variables just add up.
- **Non-parallel lines** mean the effect of one depends on the level of the other. That is an interaction.

The vertical gap between the two lines is 16.85 dollars on the left and only 7.71 on the right, so you can also read the same fact the other way round: the difference between new customers and regulars shrinks when a coupon is involved. An interaction is always symmetric like that. The coupon's effect depends on who you are, and the who-you-are effect depends on the coupon, and those are two descriptions of one thing.

=== step === quiz
::eyebrow Check yourself
## What the single number hides

Priya's partner sees the 7.37 dollar average lift and says the coupon is worth about 7 dollars a customer, so they should send it to everyone. Given the four cell means, what is wrong with that plan?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- Nothing is wrong. 7.37 is the correct average, so it is the right number to plan with
- The 7.37 is wrong, because averages of averages are never valid
- It buys about 12 dollars of extra spend from a first-time buyer and about 3 from a regular, so a plan built on 7 overpays for regulars and undervalues the coupon as a way of winning new customers ::ok Exactly, and notice that both halves of that sentence matter. The coupon looks like poor value if you judge it on regulars alone, and like a bargain if you judge it on new customers, so the single average leads to the wrong call in both directions at once. Priya can act on 12 and 3. Nobody can act on 7.
- The 7.37 is fine as a summary but coupons should never be sent to existing customers ::no The arithmetic behind 7.37 is perfectly correct, which is what makes it dangerous rather than obviously broken: it is the true average lift across her two hundred orders. What it is not is a description of what happens to any actual customer, because the two groups it averages behave differently. And no rule of business follows automatically from that: whether the 3 dollars a regular spends is worth the discount is a separate question about margins, one the data here cannot answer.

=== step === concept
::eyebrow Now fit a model
## The model that cannot say it

So far this has all been arithmetic on group averages. Let us hand the same job to a model, because with two variables you can just about do it by hand, and with five you cannot.

A **linear model** is a machine that takes the columns of your table and adds them up, with a weight on each one, to predict the outcome. Those weights are called **coefficients**, and `lm()` picks the ones that make the predictions miss the actual spends by as little as possible overall.

```r
m_add <- lm(spend ~ coupon + customer, data = orders)
round(coef(m_add), 3)
#>     (Intercept)       couponyes customerregular 
#>          24.506           7.378          12.280
```

The formula `spend ~ coupon + customer` reads as "explain spend using coupon and customer". The `+` matters enormously and we are about to see why.

Three coefficients came back. R turns each text column into a comparison against one level, chosen alphabetically and called the **reference level**, which here is "no" for coupon and "new" for customer. So:

- `(Intercept)` **24.506** is what the model predicts for the reference combination, a new customer with no coupon.
- `couponyes` **7.378** is what having a coupon adds.
- `customerregular` **12.280** is what being a regular adds.

Look hard at that middle number. It is one number. The model has exactly one slot for the effect of a coupon, so whatever it puts there gets applied to everybody, and it has landed on roughly the average lift we already computed by hand. This is not the model failing to notice something. It is the model doing precisely what `+` asked for: **spend is the base, plus a bit for the coupon, plus a bit for being a regular**, with the two bits never allowed to depend on each other.

=== step === concept
::eyebrow Where it goes wrong
## An additive model can only draw parallel lines

That single-slot design has a consequence you can measure. Ask the model what it predicts in each of the four cells, and compare with what actually happened.

```r
four_cells <- expand.grid(coupon = c("no", "yes"), customer = c("new", "regular"))
four_cells$additive <- round(predict(m_add, newdata = four_cells), 2)
four_cells$actual <- round(c(cell_means["new", "no"], cell_means["new", "yes"],
                             cell_means["regular", "no"], cell_means["regular", "yes"]), 2)
four_cells$miss <- round(four_cells$actual - four_cells$additive, 2)
four_cells
#>   coupon customer additive actual  miss
#> 1     no      new    24.51  22.22 -2.29
#> 2    yes      new    31.88  34.17  2.29
#> 3     no  regular    36.79  39.07  2.28
#> 4    yes  regular    44.16  41.88 -2.28
```

`expand.grid()` builds every combination of the values you give it, so here it makes the four rows of Priya's table, and `predict()` asks a fitted model what it expects in each one.

The model is wrong in all four cells by about the same 2.3 dollars, and the sign flips in a pattern: too high where the truth is low, too low where the truth is high. That is not random noise, which would scatter. It is a shape, and it is the shape of the thing the model was forbidden to fit.

Here is the same failure in its cleanest possible form. The panel below fits two invented groups whose responses genuinely point in opposite directions, once with an additive model and once with an interaction, and reports what each one concludes.

::widget wrong-family-fit {"mode":"interaction","seed":31}

The dashed lines are the additive fit and they are parallel because nothing in that model could make them anything else. It is allowed to move a group up or down, and it is not allowed to change a group's direction. So when the two groups disagree about direction it averages them and reports a slope near zero, which is the numerical equivalent of standing between two arguing people and announcing that nobody said anything.

[WARNING]
The sentence that comes out of an additive model when an interaction is present is not "there is no effect". It is "there is one effect and here is my best guess at it", said with complete confidence about a quantity that does not exist. The model has no way of telling you it was the wrong shape. Only you can notice that.

=== step === concept
::eyebrow The fix
## One character changes everything

Swap the `+` for a `*` and refit.

```r
m_int <- lm(spend ~ coupon * customer, data = orders)
round(coef(m_int), 3)
#>               (Intercept)                 couponyes           customerregular 
#>                    22.221                    11.949                    16.851 
#> couponyes:customerregular 
#>                    -9.143
```

`coupon * customer` is shorthand. It expands to `coupon + customer + coupon:customer`, so you get both original terms plus a new one, and the colon is R's way of writing "these two, multiplied together". That new term is the **interaction term**, and it buys the model exactly one thing: permission to give the coupon a different effect in each customer group.

Four coefficients now, and each has a job:

- `(Intercept)` **22.221** is the reference cell again, a new customer with no coupon.
- `couponyes` **11.949** is what the coupon adds **for new customers only**, because new is the reference level of customer.
- `customerregular` **16.851** is how much more a regular spends **when there is no coupon**, because no is the reference level of coupon.
- `couponyes:customerregular` **-9.143** is the new one: how much *less* the coupon does for a regular than it does for a new customer.

Compare the second number with what we computed by hand a few steps ago. The lift for new customers was 11.95, and here it is again as a coefficient. Then 11.949 minus 9.143 is 2.806, which is the regulars' lift. The model has recovered both group answers, and it stored them as one answer plus a correction.

[NOTE]
Once an interaction is in the model, `couponyes` is no longer "the effect of the coupon". It is the effect of the coupon *at the reference level of the other variable*. That single fact is behind most of the confusion people have with interaction output, and we will keep returning to it until it is boring.

=== step === concept
::eyebrow Proof it worked
## The model now reproduces all four cells exactly

The additive model missed every cell by 2.3 dollars. Ask the new one the same question.

```r
four_cells$with_interaction <- round(predict(m_int, newdata = four_cells), 2)
four_cells[, c("coupon", "customer", "actual", "additive", "with_interaction")]
#>   coupon customer actual additive with_interaction
#> 1     no      new  22.22    24.51            22.22
#> 2    yes      new  34.17    31.88            34.17
#> 3     no  regular  39.07    36.79            39.07
#> 4    yes  regular  41.88    44.16            41.88
```

Every prediction now matches its cell mean to the last decimal, and that is not luck. With two variables of two levels each you have four cell means to describe, and the interaction model has exactly four coefficients, so it can hit all four dead on. Fitting it is really just a way of re-expressing the table you already had.

Which raises a fair question: if it only reproduces the cell means, why bother fitting anything? Three reasons, and they are the rest of this lesson.

- The model attaches **uncertainty** to each of those numbers, so you can tell a real difference from a lucky one.
- It keeps working when the variables are **not** two-level groups, for example a discount that can be any percentage, where there are no cells to average.
- It lets you **test** the difference formally, which is what someone reviewing the decision is going to ask for.

=== step === concept
::eyebrow The interpretation that sticks
## An interaction coefficient is a difference of differences

The fourth coefficient looks strange, so let us build it from the cell means with nothing but subtraction.

```r
new_lift     <- cell_means["new", "yes"]     - cell_means["new", "no"]
regular_lift <- cell_means["regular", "yes"] - cell_means["regular", "no"]

round(c(new = new_lift,
        regular = regular_lift,
        difference = regular_lift - new_lift), 3)
#>        new    regular difference 
#>     11.949      2.806     -9.143
```

Read the last number and then look back at the coefficient table. **-9.143** appears in both places, and it is not a coincidence: an interaction coefficient is literally the difference between two differences. The coupon's effect for regulars, minus the coupon's effect for new customers.

That gives you a sentence you can use every time. Say it as: *the coupon does 9.14 dollars less for a regular than it does for a first-time buyer*. Not "regulars spend 9.14 less", which is a different claim about a different thing, and not "the interaction is significant", which is not a claim about the world at all.

The symmetry is worth checking too. Subtract the other way, taking the customer-type gap with a coupon minus the customer-type gap without one, and you get 7.71 minus 16.85, which is the same -9.14. There is one interaction between two variables, and you can tell its story from either side.

[TIP]
When you get lost in an interaction model, go back to the cell means. Every coefficient in a two-by-two model is a sum or difference of those four numbers, and reconstructing one by hand takes thirty seconds and settles any argument.

=== step === tryit
::eyebrow Your turn
## Write the same model the long way

`coupon * customer` is shorthand for writing out both single terms and the cross term. Prove it to yourself by writing the long form, and check that R gives back exactly the same four coefficients.

The colon operator, `a:b`, is the cross term on its own. Fill in the blank so the model has the coupon term, the customer term, and their interaction.

```r
m_colon <- lm(spend ~ ____, data = orders)
round(coef(m_colon), 3)
```
::check {"regex":"(coupon\\s*:\\s*customer|customer\\s*:\\s*coupon)","gate":true,"difficulty":"beginner","ok":"Identical coefficients, down to the last decimal, because the two formulas describe the same model. Most people write the star form because it is shorter and it makes forgetting a main effect impossible. The colon form is worth knowing anyway, because you will meet it in other people's code, and because it is the only way to write down a model that has a cross term without its main effects, which is a trap we come back to near the end.","no":"You need all three pieces separated by plus signs: coupon, customer, and the cross term written with a colon between the two names."}
::solution
```r
m_colon <- lm(spend ~ coupon + customer + coupon:customer, data = orders)
round(coef(m_colon), 3)
#>               (Intercept)                 couponyes           customerregular 
#>                    22.221                    11.949                    16.851 
#> couponyes:customerregular 
#>                    -9.143
```

=== step === quiz
::eyebrow Check yourself
## Say the coefficient out loud

The interaction coefficient `couponyes:customerregular` came back as **-9.143**. Which sentence states what it means?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Regulars spend 9.14 dollars less than new customers
- The coupon is worth 9.14 dollars less to a regular than it is to a first-time buyer, so the lift falls from 11.95 to 2.81 ::ok That is it, and the giveaway is that the sentence has to mention both variables to make sense. An interaction coefficient is a difference between two differences, so any correct reading of it names the effect that is changing and the thing it changes with. Note also that the negative sign says smaller, not harmful: the coupon still lifts a regular by 2.81 dollars, just far less than it lifts a newcomer.
- The coupon costs Priya 9.14 dollars every time a regular uses it
- Regulars are 9.14 dollars less likely to use the coupon ::no All three of the others quietly drop one of the two variables. The first describes a plain gap between customer types, which is a different coefficient in the same table, `customerregular`, and it is 16.85. The third invents a cost, when nothing here measures margins or discount value at all, only spend. The fourth talks about who uses the coupon, when every customer in the design was simply assigned one or not. The interaction is about how one effect changes across levels of the other, and nothing else.

=== step === concept
::eyebrow The notation
## The same thing written with symbols

You will meet this model written out formally, so here it is with every symbol named. Let \\(y\\) be the spend on an order, and write the two group memberships as switches that are either 0 or 1: \\(c = 1\\) if the order used a coupon and 0 if it did not, and \\(r = 1\\) if the customer is a regular and 0 if they are new.

\\[ y = \\beta_0 + \\beta_1 c + \\beta_2 r + \\beta_3 (c \\times r) + \\varepsilon \\]

The Greek letters are just names for the four coefficients R printed, in the same order: \\(\\beta_0\\) is the intercept 22.221, \\(\\beta_1\\) is `couponyes` 11.949, \\(\\beta_2\\) is `customerregular` 16.851, and \\(\\beta_3\\) is the interaction -9.143. The last symbol, \\(\\varepsilon\\), is the leftover for each order, the part the four rules do not explain, which for us is the noise we added with `rnorm()`.

Now do the useful thing with it. The effect of the coupon is whatever changes when \\(c\\) goes from 0 to 1 and the customer stays the same person, so write down both predictions and subtract. With a coupon, \\(c = 1\\), the prediction is \\(\\beta_0 + \\beta_1 + \\beta_2 r + \\beta_3 r\\). Without one, \\(c = 0\\), it is \\(\\beta_0 + \\beta_2 r\\). Take the second away from the first and the \\(\\beta_0\\) and \\(\\beta_2 r\\) cancel, leaving

\\[ \\text{effect of the coupon} = \\beta_1 + \\beta_3 r \\]

That is the whole idea in one line. The coupon's effect is not a number, it is a **function of who is receiving it**. Put \\(r = 0\\) in and you get \\(\\beta_1\\), which is 11.95 for a new customer. Put \\(r = 1\\) in and you get \\(\\beta_1 + \\beta_3\\), which is 11.949 minus 9.143, or 2.81 for a regular. Both of those are numbers we already had from the cell means, so the algebra is not telling us anything new, it is telling us where the numbers live.

Set \\(\\beta_3 = 0\\) and the effect of the coupon stops depending on \\(r\\) at all, which is precisely the additive model from earlier. So "is there an interaction" is the same question as "is \\(\\beta_3\\) something other than zero", and that is a question we can test.

=== step === concept
::eyebrow Does it earn its place
## Testing the extra term

Adding a term to a model always improves its fit to the data in front of you, even when the term is nonsense, so "the fit got better" proves nothing on its own. The proper question is whether it improved by more than a useless term would have. Start with the full output, which is what you would normally look at first anyway.

```r
summary(m_int)
#> 
#> Call:
#> lm(formula = spend ~ coupon * customer, data = orders)
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -18.1806  -3.5004   0.2844   3.7050  16.3318 
#> 
#> Coefficients:
#>                           Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)                22.2206     0.8307  26.749  < 2e-16 ***
#> couponyes                  11.9494     1.1748  10.171  < 2e-16 ***
#> customerregular            16.8514     1.1748  14.344  < 2e-16 ***
#> couponyes:customerregular  -9.1432     1.6614  -5.503 1.16e-07 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 5.874 on 196 degrees of freedom
#> Multiple R-squared:  0.6257,	Adjusted R-squared:   0.62 
#> F-statistic: 109.2 on 3 and 196 DF,  p-value: < 2.2e-16
```

That is a lot of print for one model, and most of it can wait. The `Residuals` block at the top and the `Residual standard error` line near the bottom both describe the leftovers, the part of each order the model could not explain, which is what part 2 is about. `Multiple R-squared` gets defined a few steps from now.

The row to read is the last one. `Estimate` is the coefficient, -9.1432. `Std. Error` is the **standard error**, 1.6614, which is how much that estimate would typically wobble if Priya ran the whole month again with two hundred different customers. `t value` is simply the estimate divided by its standard error, so it asks how many wobbles away from zero the estimate sits, and -9.1432 divided by 1.6614 gives -5.503. `Pr(>|t|)` is the **p-value**: how often you would see an estimate at least that far from zero if the coupon really did the same thing to both groups. Here it is 1.16e-07, which is 0.000000116, so almost never.

The same question can be asked by comparing the two models directly, which is the version to use when the interaction involves more than one coefficient.

```r
anova(m_add, m_int)
#> Analysis of Variance Table
#> 
#> Model 1: spend ~ coupon + customer
#> Model 2: spend ~ coupon * customer
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)    
#> 1    197 7807.7                                  
#> 2    196 6762.8  1      1045 30.286 1.157e-07 ***
```

`anova()` given two models compares them. `RSS` is the residual sum of squares, the total of all the squared misses, so smaller is a closer fit: allowing the coupon to act differently in the two groups cut the misses from 7807.7 to 6762.8. `Df` of 1 says the interaction cost exactly one extra coefficient. The `F` statistic weighs the improvement against that cost, and `Pr(>F)` is again the p-value, 1.157e-07.

=== step === concept
::eyebrow One decision, not three
## The t test, the F test and AIC agree because they must

Two p-values came out of what look like two different procedures, and they are the same number: the 1.16e-07 in the coefficient table is 1.157e-07 with fewer digits shown. That is not a coincidence either.

```r
t_value <- coef(summary(m_int))["couponyes:customerregular", "t value"]
round(c(t = t_value, t_squared = t_value^2), 3)
#>         t t_squared 
#>    -5.503    30.286
```

Square the t and you get the F exactly. When an interaction is a single coefficient, the row in the coefficient table and the model comparison are the same test wearing different clothes, so there is no point running both and no sense in which two agreeing results are stronger evidence than one.

A third tool gets used for the same decision and is genuinely different.

```r
AIC(m_add, m_int)
#>       df      AIC
#> m_add  4 1308.486
#> m_int  5 1281.750
```

**AIC** scores a model on how well it fits after charging it a fixed penalty for each coefficient it uses, and lower is better. The interaction model pays for its extra term and still comes out about 27 points ahead. AIC does not produce a p-value and does not test anything, it just ranks candidates, which makes it handy when you are choosing among several models rather than asking one yes-or-no question.

All three point the same way here, which is the comfortable case. When they disagree it is nearly always because the effect is small relative to the data you have, and the honest response is to report the size and its uncertainty rather than to keep running tests until one of them says something you like.

=== step === quiz
::eyebrow Check yourself
## What the p-value on the interaction claims

The interaction came back with a p-value of 0.000000116. Which of these does that number support?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- There is a 0.000000116 chance that the coupon works equally well for both groups
- The interaction explains 99.99 percent of what happened to spend
- If the coupon really did the same thing to both groups, a gap between the two lifts at least as big as the one Priya saw would turn up this rarely, so that explanation fits her data very badly ::ok Right, and the shape of the sentence is the part worth keeping: a p-value starts from a supposed world in which there is no difference, and reports how ordinary or extraordinary your result would be in it. It never runs the other way. Notice too that it says nothing about size. This one is tiny because the gap of 9.14 dollars is large and two hundred orders is plenty; a trivial gap measured on a million orders would also produce a tiny p-value.
- The gap between the two lifts is 0.000000116 dollars away from its true value
- Adding the interaction improved the fit, which is what the p-value measures ::no The three wrong answers each attach the number to the wrong thing. It is not the probability that the no-difference story is true, because that story is either true or it is not, and the p-value is computed by assuming it. It is not a share of anything explained, which is what R-squared reports, 0.6257 here for the whole model. And it is not a measure of improvement on its own, because any extra term improves the fit; the test is about whether the improvement is bigger than a useless term would have managed.

=== step === concept
::eyebrow A different flavour
## When the moderator is a number, not a group

Priya runs a second campaign, and this one is more interesting. Instead of one coupon she sends out coupons of different sizes, anything from 5 percent off to 30 percent off, and she wants to know whether a bigger discount buys more spend.

```r
set.seed(7)

campaign <- data.frame(
  customer = rep(c("new", "regular"), each = 90),
  discount = round(runif(180, min = 5, max = 30))
)

quiet_spend <- ifelse(campaign$customer == "new", 18, 39)
per_percent <- ifelse(campaign$customer == "new", 0.9, 0.1)

campaign$spend <- round(quiet_spend + per_percent * campaign$discount +
                          rnorm(180, mean = 0, sd = 5), 2)

head(campaign)
#>   customer discount spend
#> 1      new       30 53.18
#> 2      new       15 28.27
#> 3      new        8 28.29
#> 4      new        7 25.48
#> 5      new       11 32.13
#> 6      new       25 37.63
```

`runif(180, min = 5, max = 30)` draws 180 numbers spread evenly between 5 and 30, which is the size of the discount each customer was offered, rounded to whole percentages. The truth we are planting this time is in `per_percent`: every extra percentage point off is worth 90 cents of extra spend to a new customer and 10 cents to a regular.

Nothing structural has changed. One of the two variables is now a number that can take many values instead of a two-level group, so there are no cells to average any more, and the interaction stops being a difference of differences and becomes a difference of **slopes**. A slope is just "how much the outcome moves per one-unit change in the predictor", so here it is dollars of extra spend per extra percentage point off. The other variable gets a name at this point too. Whichever one the effect depends on is called the **moderator**, so customer type moderates the effect of the discount, and from here on that is the word for it.

=== step === concept
::eyebrow Two slopes
## The same formula, a different reading

The formula is the one you already know.

```r
m_disc <- lm(spend ~ discount * customer, data = campaign)
round(coef(summary(m_disc)), 3)
#>                          Estimate Std. Error t value Pr(>|t|)
#> (Intercept)                20.170      1.429  14.110        0
#> discount                    0.817      0.074  10.975        0
#> customerregular            20.249      2.111   9.592        0
#> discount:customerregular   -0.807      0.108  -7.445        0
```

Before reading the numbers, one note on that last column: it says 0.000 for every row because rounding to three decimals cannot show a number smaller than 0.0005, not because the p-values are actually zero. We get the real one in a moment.

Now the coefficients, which follow exactly the same rules as before with the word "slope" swapped in for "lift":

- `(Intercept)` **20.170** is predicted spend for a new customer with a discount of zero, which is outside the range Priya actually offered, so treat it as a starting point for the line rather than a fact about anybody.
- `discount` **0.817** is the slope **for new customers**, so 82 cents of extra spend per extra percentage point off.
- `customerregular` **20.249** is how much higher a regular's line starts, again at a discount of zero.
- `discount:customerregular` **-0.807** is how much *flatter* the regular's line is, in dollars per percentage point.

Add the first and last of those to get the regulars' own slope.

```r
b <- coef(m_disc)
round(c(new     = unname(b["discount"]),
        regular = unname(b["discount"] + b["discount:customerregular"])), 3)
#>     new regular 
#>   0.817   0.010
```

`coef()` pulls the coefficients out as a named vector, `b["discount"]` picks one by name, and `unname()` just strips the leftover label so the printout stays readable. **0.817 for new customers and 0.010 for regulars**, against the 0.9 and 0.1 we planted. A slope of 0.010 means a regular given one extra percentage point off spends about one more cent, which for practical purposes is nothing at all.

=== step === concept
::eyebrow See it
## One coupon, two very different answers

The numbers are the finding, and the picture is what you put in front of Priya.

```r
is_new <- campaign$customer == "new"

plot(campaign$discount, campaign$spend,
     col = ifelse(is_new, "#2563a8", "#b5631a"), pch = 19,
     xlab = "percent off the coupon gave", ylab = "spend in dollars",
     main = "One coupon, two very different answers")
abline(a = b["(Intercept)"], b = b["discount"], col = "#2563a8", lwd = 3)
abline(a = b["(Intercept)"] + b["customerregular"],
       b = b["discount"] + b["discount:customerregular"], col = "#b5631a", lwd = 3)
legend("topleft", c("new", "regular"), col = c("#2563a8", "#b5631a"),
       pch = 19, lwd = 3, bty = "n")
```

`plot()` draws one dot per customer, `ifelse(is_new, ...)` colours it by group, and `abline(a = , b = )` draws a straight line given an intercept and a slope. The two `abline()` calls are the two rows of algebra from the previous step, turned into lines: the blue line starts at the intercept and climbs at 0.817, and the orange line starts 20.25 higher and climbs at 0.010.

The blue cloud tilts. The orange cloud does not. If Priya had fitted an additive model here she would have got one line for the tilt, drawn twice at two heights, and it would have been too flat for the newcomers and too steep for the regulars, exactly as before.

Notice what happens across the chart, because this is the part that makes the finding actionable. At the small end, 5 percent off, the model puts a new customer at 24.26 dollars and a regular at 40.47, a gap of about 16. At 30 percent off it puts them at 44.69 and 40.72, so the newcomer has not merely caught up, they have gone about four dollars past. The deepest coupon Priya offers turns her lowest spenders into her highest, which tells her what the coupon is really for.

=== step === concept
::eyebrow Honest uncertainty
## Putting an interval on a slope you had to add up

The regulars' slope, 0.010, came from adding two coefficients together. Both of those coefficients are estimates with their own wobble, so the sum has wobble too, and R does not print it because it is not a row in the table. You have to build it.

For a sum of two estimated things, the variances do not simply add. There is a third term for how the two estimates move together:

\\[ \\text{Var}(\\beta_1 + \\beta_3) = \\text{Var}(\\beta_1) + \\text{Var}(\\beta_3) + 2\\,\\text{Cov}(\\beta_1, \\beta_3) \\]

**Variance** is the square of a standard error, so it is a measure of wobble, and **covariance** is how much two estimates tend to be wrong in the same direction. All of those numbers live in one table that `vcov()` hands you.

```r
V <- vcov(m_disc)

slope_regular <- unname(b["discount"] + b["discount:customerregular"])
se_regular <- sqrt(V["discount", "discount"] +
                     V["discount:customerregular", "discount:customerregular"] +
                     2 * V["discount", "discount:customerregular"])

t_crit <- qt(0.975, df = df.residual(m_disc))

round(c(slope = slope_regular,
        lower = slope_regular - t_crit * se_regular,
        upper = slope_regular + t_crit * se_regular), 3)
#>  slope  lower  upper 
#>  0.010 -0.145  0.166
```

`vcov()` returns the variance-covariance matrix of the coefficients: the diagonal entries are the variances and the off-diagonal ones are the covariances, all picked out here by name. `qt(0.975, df = ...)` gives the multiplier for a 95 percent interval, asking for 0.975 rather than 0.95 because the leftover 5 percent is split between the two ends. `df.residual()` reports the degrees of freedom, which is the sample size minus the number of coefficients, 176 here.

The estimate, plus and minus that multiplier times the standard error, is a **confidence interval**. The 95 percent is a claim about the method rather than about this one campaign: if Priya ran her month again and again and built an interval this way each time, about 95 in every 100 of them would contain the true slope. Day to day you read it as the range of values the data are compatible with. Written short it is a **CI**, which is how it turns up in the report at the end.

So the regulars' slope is **0.010, and the data are compatible with anything from -0.145 to 0.166**. The interval comfortably contains zero, which is the formal way of saying that on this evidence a bigger discount does not measurably move a regular in either direction. Do the same for the new customers.

```r
se_new <- sqrt(V["discount", "discount"])
slope_new <- unname(b["discount"])

round(c(slope = slope_new,
        lower = slope_new - t_crit * se_new,
        upper = slope_new + t_crit * se_new), 3)
#> slope lower upper 
#> 0.817 0.670 0.964
```

New customers: **0.817, with an interval from 0.670 to 0.964**, nowhere near zero. That one is easier because R already printed its standard error, since `discount` is a row in the table. The interval for a group that needs two coefficients added is the one people skip, and it is usually the one the reader cares about most.

=== step === tryit
::eyebrow Your turn
## Test the second interaction yourself

You have the coefficient and its t test. Run the model comparison instead, which is the version you would use if `customer` had more than two levels.

The model without the interaction is built for you below and called `m_flat`. Hand both models to `anova()`, the simpler one first.

```r
m_flat <- lm(spend ~ discount + customer, data = campaign)
anova(____, m_disc)
```
::check {"regex":"anova\\s*\\(\\s*m_flat","gate":true,"difficulty":"beginner","ok":"F is 55.4 with a p-value of 4.15e-12, so letting the two groups have their own slopes cut the residual sum of squares from 5723.9 to 4353.0, and a useless extra term would essentially never manage that. Putting the simpler model first is only a convention, but a helpful one, because the table then reads as a story of what the extra term bought rather than what removing it cost.","no":"The first argument is the simpler model, the one without the interaction, which we just built and called m_flat."}
::solution
```r
m_flat <- lm(spend ~ discount + customer, data = campaign)
anova(m_flat, m_disc)
#> Analysis of Variance Table
#> 
#> Model 1: spend ~ discount + customer
#> Model 2: spend ~ discount * customer
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)    
#> 1    177 5723.9                                  
#> 2    176 4353.0  1    1370.9 55.427 4.152e-12 ***
```

=== step === concept
::eyebrow What it is worth
## Turn the slopes into money

Slopes are the model's language. Priya's language is dollars per customer, so convert before you present anything.

```r
menu <- expand.grid(discount = c(10, 25), customer = c("new", "regular"))
menu$predicted <- round(predict(m_disc, newdata = menu), 2)
menu
#>   discount customer predicted
#> 1       10      new     28.34
#> 2       25      new     40.60
#> 3       10  regular     40.52
#> 4       25  regular     40.67
```

Read the pairs. Raising a new customer's coupon from 10 percent off to 25 percent off takes their expected order from 28.34 to 40.60, so **12.26 dollars more spend for 15 more percentage points of discount**. Doing the same for a regular takes 40.52 to 40.67. That is **fifteen cents**.

Priya can now do arithmetic that has nothing to do with statistics. Everybody in this second campaign got a coupon of some size, so her question is not whether to send one but how deep to cut, and going from 10 percent off to 25 on a roughly 40 dollar order hands over about another 6 dollars. For a new customer those 6 dollars buy 12.26 dollars of extra spend, and a first order from somebody who had never bought anything. For a regular they buy fifteen cents.

That is the decision the interaction opened up, and no single average lift could have got her there. It is also why the reporting step later insists on the slopes rather than the interaction coefficient: nobody can price a decision from "the interaction was -0.807".

=== step === concept
::eyebrow Both variables continuous
## When the moderator is a number too

There is one more shape to meet, and it is where interactions get genuinely slippery. Priya narrows her attention to regulars, who barely responded to the discount, and wonders whether that is true of all of them. Maybe a discount does nothing for somebody who ordered last week and quite a lot for somebody who has drifted away for months.

Now both variables are numbers: the size of the discount, and how long it has been since the customer's last order.

```r
set.seed(11)

regulars <- data.frame(
  discount  = round(runif(200, min = 5, max = 30)),
  days_away = round(runif(200, min = 10, max = 120))
)

regulars$spend <- round(38 + 0.02 * regulars$discount - 0.05 * regulars$days_away +
                          0.010 * regulars$discount * regulars$days_away +
                          rnorm(200, mean = 0, sd = 5), 2)

head(regulars)
#>   discount days_away spend
#> 1       12        46 44.75
#> 2        5        43 46.36
#> 3       18        76 41.96
#> 4        5        32 42.51
#> 5        7        90 43.65
#> 6       29       110 65.02
```

Everything we are about to try to recover sits in that third line. A regular's baseline order is 38 dollars, and on its own the discount barely moves it, adding 2 cents per percentage point, while each extra day away costs 5 cents. The term that matters is the last one. That 0.010 says every day a customer has been away makes each percentage point of discount worth one more cent to them, so a coupon that is close to pointless for somebody who ordered on Monday has turned into real money by the time they have been gone three months.

Fit it exactly as before.

```r
m_days <- lm(spend ~ discount * days_away, data = regulars)
round(coef(summary(m_days)), 4)
#>                    Estimate Std. Error t value Pr(>|t|)
#> (Intercept)         37.6038     2.1343 17.6186   0.0000
#> discount             0.0008     0.1162  0.0066   0.9948
#> days_away           -0.0187     0.0306 -0.6104   0.5423
#> discount:days_away   0.0086     0.0017  5.2083   0.0000
```

The interaction is there, 0.0086 against the 0.010 we planted, with a t value of 5.21. But look at the row above it, and imagine meeting this table without knowing what went into the data.

=== step === concept
::eyebrow The trap
## A main effect of nothing, with a p-value of 0.99

The `discount` row says **0.0008 with a p-value of 0.9948**. Taken at face value that is the most emphatically null result you will ever see: the effect is eight ten-thousandths of a dollar and the p-value could hardly be closer to 1.

It would be completely wrong to report that discounts do not move regulars. Here is why, and it follows from the algebra we did earlier.

With both variables continuous the slope of spend on discount is

\\[ \\text{slope of discount} = \\beta_1 + \\beta_3 \\times \\text{days away} \\]

so the coefficient in the table, \\(\\beta_1\\), is the slope **when days away equals zero**. A customer who is zero days away from their last order placed it today. Priya's file contains nobody like that, because the shortest gap in it is 11 days, so that coefficient is describing a customer who does not exist and it was never worth reading on its own.

Ask instead for the slope at gaps that do exist.

```r
d <- coef(m_days)
round(d["discount"] + d["discount:days_away"] * c(20, 60, 100), 3)
#> [1] 0.173 0.517 0.861
```

For somebody who last ordered three weeks ago, a percentage point off is worth about 17 cents. For somebody gone two months, 52 cents. For somebody gone over three months, 86 cents, which is nearly the response we saw from brand new customers. The discount works, and it works on exactly the people who have drifted away.

[KEY INSIGHT]
In a model with an interaction, a main effect is the effect at zero on the other variable. If zero is not a value your data contains, or not a value anyone cares about, that coefficient is arithmetic scaffolding rather than a finding, and its p-value is not evidence of anything.

=== step === concept
::eyebrow The fix
## Centre the moderator and the number means something

You do not have to live with a coefficient that describes an imaginary customer. Move the zero to somewhere useful by subtracting the average, which is called **centering**.

```r
round(mean(regulars$days_away), 2)
#> [1] 66.48

regulars$days_centred <- regulars$days_away - mean(regulars$days_away)
m_centred <- lm(spend ~ discount * days_centred, data = regulars)
round(coef(summary(m_centred)), 4)
#>                       Estimate Std. Error t value Pr(>|t|)
#> (Intercept)            36.3620     0.9199 39.5266   0.0000
#> discount                0.5725     0.0518 11.0588   0.0000
#> days_centred          -0.0187     0.0306 -0.6104   0.5423
#> discount:days_centred   0.0086     0.0017  5.2083   0.0000
```

The average gap is 66.48 days, so `days_centred` is 0 for a typical regular, negative for somebody who ordered recently and positive for somebody who has been away a while. Nothing else about the data changed.

Now the `discount` row reads **0.5725 with a t value of 11.06**. Same data, same model, and a coefficient that has gone from apparently nothing to unmistakably something, because it is now answering a question about a customer who exists: at a typical gap of 66 days, a percentage point off is worth about 57 cents.

Check that against the previous step's formula and you will find 0.0008 plus 0.0086 times 66.48, which is 0.5725. The two models are not disagreeing. They are quoting the same line at two different points on it.

```r
round(c(uncentred = summary(m_days)$r.squared,
        centred   = summary(m_centred)$r.squared), 6)
#> uncentred   centred 
#>  0.587104  0.587104
```

R-squared is the share of the variation in spend the model accounts for, and it is identical to six decimal places because these are the same model. The interaction coefficient is identical too, 0.0086 in both, which makes sense: how fast the slope changes per day does not depend on where you put the zero. Centering changes what the main effects mean, and nothing else.

[TIP]
Centre a continuous moderator before fitting whenever zero is not a real, interesting value, which is most of the time. Age, income, temperature, days away, all of them have a useless zero. It costs one line and it stops you and your readers from misreading a row of your own output.

=== step === quiz
::eyebrow Check yourself
## The zero that was not there

In the uncentred model the `discount` coefficient was 0.0008 with a p-value of 0.9948. What is the right thing to say about it?

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- Discounts have no effect on regular customers, and the p-value is about as clear as evidence gets
- The model has failed to converge and needs to be refitted
- The discount effect is real but too small to matter commercially
- It is the slope for a customer zero days since their last order, which nobody in the data is, so it is not a finding at all: at gaps that actually occur the slope runs from about 0.17 to 0.86 ::ok Exactly right, and the tell is that the coefficient is a conditional statement rather than a summary. Once an interaction is in the model, every main effect is pinned to zero on the other variable, and here zero sits eleven days below the closest customer in the file. Centering moved the zero to the average gap and the same coefficient came back as 0.5725 with a t of 11.06, which is the honest headline.
- It shows the interaction has absorbed all of the discount effect, which is a sign the model is overfitted ::no The three wrong readings all treat that row as a verdict on discounts in general. It is not: it is the slope at one specific value of the other variable, zero days away, chosen by nothing more than where the number line happens to start. Nothing went wrong with the fit, which is identical to the centred one down to six decimal places of R-squared, and nothing was absorbed by anything. Reading a main effect without asking "at what value of the other variable" is the single most common mistake with interaction output.

=== step === concept
::eyebrow The shape of it
## The slope is itself a straight line

With a categorical moderator you get two slopes. With a continuous one you get a slope for every possible value, and those slopes lie on a straight line of their own. That is what \\(\\beta_1 + \\beta_3 w\\) says, with \\(w\\) standing for the moderator.

```r
gap_grid <- seq(10, 120, by = 5)
slope_grid <- d["discount"] + d["discount:days_away"] * gap_grid

plot(gap_grid, slope_grid, type = "l", lwd = 3, col = "#2563a8",
     xlab = "days since their last order",
     ylab = "extra dollars per extra percent off")
abline(h = 0, lty = 3)
round(range(slope_grid), 3)
#> [1] 0.087 1.033
```

`seq(10, 120, by = 5)` makes a row of gaps covering the range in the data, and the line plots what a percentage point of discount is worth at each one. It runs from **8.7 cents** for a customer who ordered ten days ago up to **1.03 dollars** for one who has been gone four months. The dotted line at zero is there so you can see the slope never actually turns negative anywhere in the observed range.

The same fact drawn the other way is often easier for a non-technical reader, because it stays in dollars rather than dollars-per-percentage-point.

```r
percent_off <- seq(5, 30, by = 1)

plot(NA, xlim = c(5, 30), ylim = c(35, 65),
     xlab = "percent off", ylab = "predicted spend in dollars",
     main = "The same coupon, three kinds of regular")
for (i in 1:3) {
  gap <- c(20, 60, 100)[i]
  predicted <- predict(m_days, newdata = data.frame(discount = percent_off,
                                                    days_away = gap))
  lines(percent_off, predicted, lwd = 3, col = c("#2563a8", "#1f7a55", "#b5631a")[i])
}
legend("topleft", c("away 20 days", "away 60 days", "away 100 days"),
       col = c("#2563a8", "#1f7a55", "#b5631a"), lwd = 3, bty = "n")
```

`plot(NA, ...)` sets up empty axes, then the loop asks the model for predicted spend across the whole discount range at three chosen gaps and draws each as a line. The three lines fan out: nearly flat for somebody who ordered three weeks ago, distinctly uphill for somebody gone a hundred days.

Choosing three round values of the moderator to plot is the standard move for continuous-by-continuous interactions, and it is a presentation choice rather than a statistical one. Pick values you are willing to defend in writing, ideally ones that mean something in the business, and say in the caption that they were chosen rather than estimated.

=== step === concept
::eyebrow Naming what you see
## Four shapes, and what to call them

Every interaction you meet will look like one of these when you plot it. The block below draws all four from made-up slopes so you can see them side by side.

```r
two_lines <- function(slope_new, slope_regular, title) {
  percent_off <- seq(5, 30, by = 1)
  plot(NA, xlim = c(5, 30), ylim = c(15, 60), main = title,
       xlab = "percent off", ylab = "spend")
  lines(percent_off, 20 + slope_new * percent_off, col = "#2563a8", lwd = 3)
  lines(percent_off, 40 + slope_regular * percent_off, col = "#b5631a", lwd = 3)
}

par(mfrow = c(2, 2))
two_lines(0.5,  0.5,  "no interaction")
two_lines(0.9,  0.1,  "one group responds more")
two_lines(0.2,  0.9,  "the other way round")
two_lines(0.9, -0.4,  "crossover")
par(mfrow = c(1, 1))
```

`par(mfrow = c(2, 2))` tells R to arrange the next four plots in a two by two grid, and the last line puts it back to one plot at a time so later blocks are not affected.

- **Parallel** means no interaction. Both groups respond the same way and the model only needs the additive terms.
- **One group responds more** is Priya's case, and the usual textbook name for it is a fan.
- **The other way round** is the same shape mirrored, and it is worth drawing separately because which group is steeper is often the entire finding.
- **Crossover** is the one that catches people out. The lines cross, so the better group at one end is the worse group at the other, and any single average sits in the middle describing nobody. If you only ever report an average effect, a crossover is the situation where you will be most confidently wrong.

Naming the shape is not decoration. "The coupon pays off on first-time buyers and does nothing for regulars" is a sentence a reader keeps and repeats in a meeting, whereas "there was a significant interaction" is a sentence they immediately ask you to explain.

=== step === concept
::eyebrow The rule with teeth
## Never drop a main effect you are interacting

There is one structural rule about interaction models, and breaking it produces output that looks perfectly reasonable and is not.

The rule, called the **hierarchical principle**, is that if `discount:customer` is in the model then `discount` and `customer` must both be in it too, even if one of them looks unimpressive on its own. Watch what happens when you break it.

```r
m_no_main <- lm(spend ~ discount + discount:customer, data = campaign)
round(coef(summary(m_no_main)), 3)
#>                          Estimate Std. Error t value Pr(>|t|)
#> (Intercept)                29.453      1.294  22.755    0.000
#> discount                    0.367      0.071   5.162    0.000
#> discount:customerregular    0.166      0.047   3.546    0.001

bad <- coef(m_no_main)
round(c(new     = unname(bad["discount"]),
        regular = unname(bad["discount"] + bad["discount:customerregular"])), 3)
#>     new regular 
#>   0.367   0.534
```

That model says regulars respond to discounts *more* strongly than new customers, 0.53 against 0.37. We know the truth, because we planted it: the real slopes are 0.9 and 0.1, and the properly specified model recovered 0.817 and 0.010. The broken model has not just got the sizes wrong, it has reversed the finding, and every p-value in it is small enough to look convincing.

The reason is simple once you see it. Dropping `customer` forces both groups to share a single intercept, so the model has no way to say that regulars simply start higher. The only knob it has left is the slope, so it tilts the regulars' line upwards to reach their cloud of points, and the tilt gets reported as responsiveness to discounts.

[WARNING]
A model with a cross term and a missing main effect will fit, print, and lie. R will not warn you. If you ever see a formula with a colon and no matching plus terms, that is the first thing to fix, before reading a single coefficient.

=== step === quiz
::eyebrow Check yourself
## Why the main effects stay

In the campaign data, suppose `customer` on its own had come back with a large p-value while `discount:customer` was clearly significant. What should you do?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Drop `customer` and keep the interaction, since the data says the main effect is not needed
- Keep both, because the interaction is defined as a difference between group slopes, and removing the main effect forces the groups to share an intercept, which changes the slopes into something else entirely ::ok Yes, and the demonstration in the previous step is what makes it concrete: dropping the customer term did not shrink the finding, it flipped it, reporting regulars as the more discount-responsive group when they are the less. Keeping a main effect with an unimpressive p-value costs you one degree of freedom, which is nothing. Removing it costs you the interpretation of every coefficient that remains.
- Drop the interaction instead, since a main effect matters more than a cross term
- Refit with the interaction only, so the model is as simple as possible ::no All three alternatives treat model terms as independent items to be kept or binned on their p-values, and interaction terms are not independent of their parents. The interaction says how much the slope differs between groups, which is only meaningful once the model is allowed to give those groups different starting heights. A large p-value on a main effect that participates in a significant interaction is not evidence the term is useless, it is often just evidence that the two groups happen to be level at whatever point zero sits.

=== step === concept
::eyebrow The expensive part
## Interactions need far more data than main effects

Priya got a p-value of 0.000000116 for her first interaction, so it might look like these are easy to detect. They are not, and the reason is worth measuring rather than asserting.

A main effect is estimated from all your data at once. An interaction is a difference between two effects, so it is estimated from the difference between two subsets, and differences are noisier than the things they are made of. The practical consequence is a rule of thumb that we can check directly: to detect an effect of half the size, you need roughly four times the data.

The function below runs one imaginary version of Priya's whole experiment and reports whether the interaction came out significant. Then we run it hundreds of times under different conditions and count.

```r
detects_interaction <- function(per_cell, regular_lift) {
  shop <- data.frame(
    customer = rep(c("new", "regular"), each = 2 * per_cell),
    coupon   = rep(c("no", "yes"), times = 2 * per_cell)
  )
  base <- ifelse(shop$customer == "new", 22, 40)
  lift <- rep(0, nrow(shop))
  lift[shop$coupon == "yes" & shop$customer == "new"]     <- 12
  lift[shop$coupon == "yes" & shop$customer == "regular"] <- regular_lift
  shop$spend <- base + lift + rnorm(nrow(shop), mean = 0, sd = 6)

  fit <- lm(spend ~ coupon * customer, data = shop)
  coef(summary(fit))["couponyes:customerregular", "Pr(>|t|)"] < 0.05
}

set.seed(3)
round(c(gap_10_n100 = mean(replicate(400, detects_interaction(25, 2))),
        gap_5_n100  = mean(replicate(400, detects_interaction(25, 7))),
        gap_5_n400  = mean(replicate(400, detects_interaction(100, 7)))), 3)
#> gap_10_n100  gap_5_n100  gap_5_n400 
#>       0.993       0.525       0.988
```

The function rebuilds the shop with `per_cell` customers in each of the four combinations and whatever lift you specify for regulars, fits the model, and returns TRUE when the interaction clears the conventional 0.05 line. `replicate(400, ...)` runs four hundred separate imaginary months, and `mean()` of a pile of TRUEs and FALSEs gives the fraction that were TRUE, because R counts every TRUE as 1.

Read the three numbers as a story. With a hundred customers and the gap we actually planted, twelve against two, the test finds the interaction **99.3 percent** of the time. Halve the gap, so regulars get a lift of 7 instead of 2, and detection collapses to **52.5 percent**, a coin flip, on exactly the same sample size. Quadruple the sample to four hundred and it climbs back to **98.8 percent**.

That last pair is the rule of thumb, measured rather than quoted: half the effect, four times the data. This fraction has a name, **power**, meaning the chance a study finds an effect that is genuinely there.

=== step === concept
::eyebrow The honest sentence
## "Not significant" is not "the same in both groups"

The power simulation and the interval we built for the regulars point at the same habit, and it is the one that separates an honest null result from a careless one.

When a test comes back non-significant, whether it is the interaction itself or one group's own slope, there are two possibilities, and the test cannot tell them apart:

- The effect really is close to the same in both groups.
- The effect differs, and the study was too small to see it, which is exactly what the simulation above produced: a genuine gap of 5 dollars, missed 47.5 percent of the time.

The way to tell them apart is to look at the interval rather than the verdict. Priya's regulars had a discount slope of 0.010 with an interval running from -0.145 to 0.166. That interval is narrow in the units that matter: it says that even at the pessimistic end, a percentage point off costs her about 15 cents of spend, and at the optimistic end it gains 17. Both ends lead to the same decision, so she can genuinely conclude the effect is small.

Compare that with an imaginary study that returned a slope of 0.010 with an interval from -0.9 to 0.9. Same estimate, same non-significant verdict, and it is compatible with a discount being worthless or being worth as much as it is to a brand new customer. That study answered nothing, and reporting it as "no difference between groups" would be a straightforwardly false claim.

Two other honest limits worth carrying:

- **Interactions found by searching are weak evidence.** Fit a model with ten predictors and every pair of them, and you have tested forty-five interactions. Some will clear 0.05 by luck alone. An interaction you had a reason to look for before seeing the data is worth much more than one that turned up in a sweep, and if you did sweep, say so.
- **An interaction in the data is not a mechanism.** Priya's result says the coupon behaves differently for new customers. Whether that is because they are price-sensitive, or because they were sitting on the fence anyway, or because regulars had already stocked up, is not in these numbers.

=== step === concept
::eyebrow Writing it up
## Report two slopes, not one coefficient

Nobody outside your team can act on "the interaction was -0.807, p less than 0.001". Build the table you actually want to publish, which is one row per group with its own slope and interval.

```r
report <- data.frame(
  customer = c("new", "regular"),
  slope = round(c(slope_new, slope_regular), 3),
  lower = round(c(slope_new - t_crit * se_new,
                  slope_regular - t_crit * se_regular), 3),
  upper = round(c(slope_new + t_crit * se_new,
                  slope_regular + t_crit * se_regular), 3)
)
report
#>   customer slope  lower upper
#> 1      new 0.817  0.670 0.964
#> 2  regular 0.010 -0.145 0.166
```

Everything in there was computed a few steps ago, and putting it in one small frame is the difference between a result and a report. Those per-group slopes are usually called **simple slopes**, where simple means the effect of one variable held at a fixed level of the other.

Now the paragraph. Three sentences do it: one saying the effect differs, one for each group with its interval, and a closing line about what it means in the units of the decision.

> The size of a discount predicted spend very differently for the two customer types (interaction F(1, 176) = 55.4, p less than 0.001). Among first-time buyers, each extra percentage point off was worth 0.82 dollars of extra spend (95 percent CI 0.67 to 0.96). Among regulars it was worth 0.01 dollars (95 percent CI -0.15 to 0.17), so deepening a coupon from 10 percent off to 25 bought 12.26 dollars of extra spend from a first-time buyer and 15 cents from a regular.

[KEY INSIGHT]
The interaction coefficient belongs in your model, not in your headline. What the reader needs is both slopes, both intervals, and a sentence in their own units. If you have written the sentence and they still have to ask "so what should we do", the write-up is not finished.

=== step === quiz
::eyebrow Check yourself
## Which write-up is honest

A colleague tests whether a new checkout page helps mobile users more than desktop users. The interaction comes back with p = 0.21, and the estimated difference between the two lifts is 4 percent, with a 95 percent interval running from -3 percent to 11 percent. Which sentence should go in the report?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The new page works equally well on mobile and desktop, since the interaction was not significant
- The new page helps mobile users 4 percent more than desktop users
- The difference between mobile and desktop was estimated at 4 percent, but the data are compatible with anything from a 3 percent disadvantage to an 11 percent advantage, so this test cannot settle whether the page helps one group more ::ok Yes, and what makes it honest is that it reports what was learned, which is that the study was too small to answer its own question. Naming both ends of the interval puts the size of the uncertainty in front of the reader instead of hiding it behind a verdict, and it makes the next step obvious: either run it longer or accept that you cannot target by device on this evidence.
- The interaction was not significant, so the interaction term should be dropped and the main effect reported instead ::no The first two claims are opposite mistakes made from the same interval. Saying the page works equally well treats a failure to detect a difference as proof there is none, when an 11 percent advantage sits comfortably inside the range the data allow. Reporting the 4 percent as the finding does the reverse and drops the uncertainty entirely. And dropping the term to report a main effect instead is a decision that needs stating out loud, because the pooled number it produces is an average across two groups that may well differ.

=== step === tryit
::eyebrow Your turn
## Price the coupon for somebody who has drifted away

Back to the regulars and the days-since-last-order model, `m_days`. Priya wants to know what to expect from a customer who has not ordered in a hundred days, comparing a small coupon with a big one.

Fill in the gap so both rows describe a customer who has been away 100 days, one offered 5 percent off and one offered 25.

```r
away <- data.frame(discount = c(5, 25), days_away = c(____, ____))
round(predict(m_days, newdata = away), 2)
```
::check {"regex":"100\\s*,\\s*100","gate":true,"difficulty":"intermediate","ok":"40.04 and 57.26, so 20 extra percentage points of discount bought 17.22 dollars of extra spend from somebody who had drifted away. Run the same pair at days_away = 20 and you get 38.09 and 41.55, a gain of 3.46 dollars for the identical discount. That is the interaction priced in dollars, and it points at a policy: send the deep coupons to the people who have gone quiet, not to the ones who ordered last week.","no":"Both rows need the same gap, 100 days, because you are comparing two discount sizes for one kind of customer. Put 100 in both slots."}
::solution
```r
away <- data.frame(discount = c(5, 25), days_away = c(100, 100))
round(predict(m_days, newdata = away), 2)
#>     1     2 
#> 40.04 57.26
```

=== step === concept
::eyebrow The habit
## Four questions to ask of any interaction

::widget process-flow {"steps":[{"title":"What is interacting with what?","sub":"name both variables, and say which effect is the one that moves"},{"title":"At what value of the other?","sub":"a main effect is the effect at zero, so check that zero exists"},{"title":"How big is it, in your units?","sub":"two slopes with intervals, converted into money, days or people"},{"title":"Could the study have found it?","sub":"a small p-value with a wide interval settles nothing either way"}]}

Take them in order.

**What is interacting with what** stops the most common reporting error, which is quoting the interaction coefficient as though it described one variable. It describes the relationship between two, and any sentence you write about it has to mention both.

**At what value of the other** is the question that saves you from the `discount` row reading 0.0008 with a p-value of 0.99. Ask it of every main effect in every model that contains an interaction, and centre the moderator so the answer is a customer who exists.

**How big is it, in your units** is where an interaction beats a test. Priya's finding was not "F equals 55.4". It was 12.26 dollars against fifteen cents, which is a number her partner can put next to the cost of the discount.

**Could the study have found it** is the one people skip, and skipping it is what makes so many published interaction results unreadable. A non-significant interaction from four hundred customers with a tight interval is a genuine finding of similarity. The same verdict from forty is silence, and reporting silence as agreement is how a false claim gets into print.

=== step === concept
::eyebrow Go deeper
## References

Five places worth an hour each if you want to push past where this part stops.

- [Aiken and West, Multiple Regression: Testing and Interpreting Interactions](https://us.sagepub.com/en-us/nam/multiple-regression/book2223) - the standard book-length treatment, and the source of the centering and simple-slopes conventions used here.
- [Brambor, Clark and Golder, Understanding Interaction Models: Improving Empirical Analyses (2006)](https://doi.org/10.1093/pan/mpi014) - the clearest short paper on why main effects stay in and why you must report the effect across the range of the moderator rather than as one number.
- [Gelman, You need 16 times the sample size to estimate an interaction than to estimate a main effect](https://statmodeling.stat.columbia.edu/2018/03/15/need16/) - the arithmetic behind the power step, worked out for the case where the interaction is half the size of the main effect.
- [R documentation for the formula syntax](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html) - what `*`, `:`, `^` and `%in%` actually expand to, which is worth reading once properly rather than guessing.
- [The emmeans package vignette on interactions](https://cran.r-project.org/web/packages/emmeans/vignettes/interactions.html) - the package route to the simple slopes and intervals we built by hand, and the tool to reach for once your models get bigger than two predictors.

=== step === complete
## Part 1 complete

You started with four averages on Priya's wall and finished with a model that can be tested, priced and written up. The thread through all of it was one sentence: the effect of the coupon depends on who gets it, so any single number describing it has to be wrong for somebody.

The mechanics turned out to be small. One character, `*` instead of `+`, buys the model permission to give each group its own effect, and the extra coefficient it produces is a difference of differences, -9.143 dollars for Priya's coupon, which you can rebuild from the cell means with nothing but subtraction. Testing it is a single `anova()` against the model without the term, and the coefficient's t squared is that F exactly, so there is one decision to make rather than three.

The interpretation is where the care goes. A main effect stops being "the effect" and becomes the effect at zero on the other variable, which is why the discount row read 0.0008 with a p-value of 0.9948 until centering moved the zero to a customer who actually exists and the same coefficient came back as 0.5725. Simple slopes need their own intervals, built from `vcov()` rather than read off the table, and both of them go in the report because 0.82 dollars against 0.01 dollars is what anybody can act on. Then the three ways it goes wrong: a missing main effect that reversed the finding entirely, a study half the size finding a halved effect only 52.5 percent of the time, and the habit of reading "not significant" as "the same".

Part 2 turns to the checks that sit underneath all of this. Every model here assumed things about its leftovers, the residuals, that we never once looked at, and when those assumptions fail the coefficients keep printing and the standard errors quietly stop being trustworthy. Five checks catch nearly all of it, and none of them is any harder than what you just did.
