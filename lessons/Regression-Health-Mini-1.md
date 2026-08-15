---
title: "Multicollinearity: why your coefficients look wrong, and the fix"
slug: "Regression-Health-Mini-1"
catalog_blurb: "Why two overlapping predictors ruin a coefficient, and what to do."
description: "Floor area and room count both lift a house price, yet the model says a room is worth minus 4,400 dollars. See why, check it in one line, and fix it properly."
keywords: "multicollinearity, VIF in R, variance inflation factor, correlated predictors, car vif, coefficient sign flip, ridge regression, regression diagnostics, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.11"
lesson_access: "windowed"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "1"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 1 of 5
## Multicollinearity: why your coefficients look wrong, and the fix

Anita values houses for a small estate agency, and her boss asks her the same two questions every week. What is a square foot worth around here, and what is an extra room worth? She has last year's sixty sales in a spreadsheet with the floor area, the number of rooms, the age of the house and the price it sold for, so both questions look like they should drop straight out of a regression.

Here is her whole problem in one picture. Each dot is a house, with floor area along the bottom and number of rooms up the side.

::widget chart-plotter {"data":[{"x":1084,"y":4},{"x":1636,"y":5},{"x":1379,"y":5},{"x":1308,"y":5},{"x":1843,"y":6},{"x":1417,"y":5},{"x":1783,"y":6},{"x":1239,"y":4},{"x":1409,"y":4},{"x":1436,"y":5},{"x":1682,"y":6},{"x":1809,"y":6},{"x":1706,"y":6},{"x":1431,"y":5},{"x":1731,"y":5},{"x":1409,"y":5},{"x":1300,"y":4},{"x":1992,"y":7},{"x":1676,"y":5},{"x":1255,"y":4},{"x":1998,"y":7},{"x":1135,"y":4},{"x":1500,"y":5},{"x":1882,"y":6},{"x":1150,"y":4},{"x":1687,"y":6},{"x":1457,"y":5},{"x":2242,"y":8},{"x":970,"y":3},{"x":1589,"y":5},{"x":2027,"y":7},{"x":1363,"y":5},{"x":1703,"y":6},{"x":1574,"y":5},{"x":1830,"y":6},{"x":861,"y":3},{"x":2504,"y":8},{"x":671,"y":3},{"x":1293,"y":4},{"x":1161,"y":4},{"x":1566,"y":5},{"x":2170,"y":8},{"x":1282,"y":5},{"x":1128,"y":4},{"x":1380,"y":5},{"x":1465,"y":5},{"x":1702,"y":6},{"x":1790,"y":6},{"x":1959,"y":7},{"x":1562,"y":5},{"x":2096,"y":7},{"x":1298,"y":4},{"x":1254,"y":4},{"x":1409,"y":4},{"x":2173,"y":7},{"x":1424,"y":5},{"x":1100,"y":4},{"x":1775,"y":6},{"x":1097,"y":4},{"x":1583,"y":5}],"geoms":["point"],"x":"area_sqft","y":"rooms"}

Bigger houses have more rooms, which is not a surprise and not a mistake. It is simply true of houses, and the number in the corner of that chart says how true: the correlation between the two columns is 0.955, which is about as close as two different measurements of the world ever get.

Now watch what happens when Anita asks a model both of her questions at once. It answers that an extra room is worth **minus 4,400 dollars**, and that the answer is so uncertain it might as well be nothing at all. Nothing has crashed, no warning has been printed, and the model has not made an arithmetic error. It is telling her, in the only language it has, that her sixty houses cannot separate the value of a room from the value of the floor space that comes with it.

That situation has a name, **multicollinearity**, and by the end of this part you will be able to:

- Say in plain words why two predictors that move together cannot both get a clean coefficient, and spot the symptom in a table of results
- Run the one-line check that measures it, and read what the number is actually telling you
- Say exactly what it damages and what it leaves completely alone, which is more than most write-ups will admit
- Recognise the three lookalikes that panic people for no reason, including the one that a correlation matrix cannot see
- Pick a fix that suits your question, and avoid the popular one that turns an honest wide answer into a confident wrong one

**What you need first:** you can read a simple R script, so a variable, a vector and a function call are familiar. No statistics background is assumed. Coefficient, intercept, standard error, p-value, confidence interval, residual, bias and variance are all defined here in ordinary words at the moment they turn up.

One thing before we start. Anita is invented and so are her sixty houses, which we build ourselves in R in a moment. That is deliberate, because in an invented town you get to write down the true answer first and then check whether the model finds it. On real sales data nobody hands you the answer key, which is exactly why this problem goes unnoticed for so long.

=== step === concept
::eyebrow Two questions, not one
## What Anita is actually asking

It is worth slowing down on the two questions, because they sound like the same question and they are not.

- **What is a square foot worth?** If a house has an extra hundred square feet and everything else about it stays as it was, how much more does it sell for?
- **What is a room worth?** If a house has an extra room and everything else about it stays as it was, including its total floor area, how much more does it sell for?

That second question is stranger than it looks. An extra room without any extra floor area means the same space divided differently: five smallish rooms instead of four larger ones. There is a real answer to it, because buyers do pay something for a separate room rather than one big open space, and Anita needs that answer whenever a client asks whether knocking a wall through will cost them money.

The trouble is that her sixty houses barely contain the comparison. Almost every large house in her spreadsheet has many rooms and almost every small one has few, so when she asks what a room is worth on its own, she is asking a question her data has hardly any examples of. The rest of this part is about what a model does when you ask it a question like that, how to notice, and what to do next.

=== step === concept
::eyebrow The raw material
## Sixty houses, built from scratch

Here is Anita's year, made up on purpose so we know what is inside it. Run this block first, because everything later on this page uses it.

```r
set.seed(19)

n <- 60
area  <- round(rnorm(n, mean = 1500, sd = 350))              # floor area in square feet
rooms <- round(area / 300 + rnorm(n, mean = 0, sd = 0.2))    # bigger houses have more rooms
age   <- round(runif(n, min = 0, max = 40))                  # years since it was built

price <- round(60 + 0.12 * area + 8 * rooms - 0.8 * age +
               rnorm(n, mean = 0, sd = 25), 1)

houses <- data.frame(area, rooms, age, price)
head(houses)
#>   area rooms age price
#> 1 1084     4  27 215.3
#> 2 1636     5   9 284.0
#> 3 1379     5  21 221.8
#> 4 1308     5  38 201.9
#> 5 1843     6  40 322.7
#> 6 1417     5   4 238.6
```

Take that apart slowly, because the last line of it is the answer key for the whole lesson.

`rnorm(n, mean = 1500, sd = 350)` draws sixty floor areas that cluster around 1,500 square feet, and `sd = 350` is the **standard deviation**, the usual word for how far a typical house strays from that middle. The rooms line is where the collinearity is planted: each house gets roughly one room per 300 square feet, give or take a small wobble, which is how rooms work in real housing stock. `set.seed(19)` pins R's random numbers so that your run prints the same figures as the ones printed here.

Then the prices. Every house starts at 60, and after that it gains **0.12 for every square foot**, **8 for every room** and loses **0.8 for every year of age**, before `rnorm(n, mean = 0, sd = 25)` adds the ordinary randomness of a real sale. Prices here are in thousands of dollars, so the first house sold for 215,300 dollars, a square foot is worth 120 dollars, a room is worth 8,000 dollars and a year of age costs 800.

Write those three numbers down: **0.12, 8 and -0.8**. Anita cannot see them, and everything the model reports from here on can be marked against them.

=== step === concept
::eyebrow The fact behind everything
## How tightly the two move together

Before fitting anything, look at the relationship the cover chart showed.

```r
round(cor(houses$area, houses$rooms), 3)
#> [1] 0.955

range(houses$rooms)
#> [1] 3 8
```

**Correlation** is a single number between -1 and 1 that says how closely two columns rise and fall together, where 0 means knowing one tells you nothing about the other and 1 means knowing one tells you the other exactly. At 0.955 the two columns are not identical, since the room counts run from 3 to 8 and a few houses are unusually chopped up or unusually open plan, but they are close to being two spellings of the same word.

[NOTE]
Nothing has gone wrong yet. A correlation of 0.955 between floor area and room count is a true fact about houses, not a data-entry error and not a broken assumption. It only becomes a problem when you ask the model a question that needs the two to be told apart.

=== step === concept
::eyebrow One at a time
## Area on its own looks perfect

Anita starts the easy way, with one predictor.

```r
model_area <- lm(price ~ area, data = houses)
round(coef(summary(model_area)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  40.6009    16.1634  2.5119   0.0148
#> area          0.1465     0.0102 14.3144   0.0000
```

A **linear model** is a machine that multiplies each column by a weight and adds the results up to predict the outcome, and `lm()` picks the weights that miss the actual prices by as little as possible overall. Those weights are the **coefficients**, printed in the first column.

So `(Intercept)` 40.6 is what the model predicts for an imaginary house of zero square feet, which is not a house anybody sells and is mostly there to let the line sit at the right height. The `area` coefficient **0.1465** is the interesting one: each extra square foot goes with 0.1465 thousand dollars, or about 147 dollars, more on the price tag.

The three columns after it describe how sure the model is. `Std. Error` is the **standard error**, roughly how far this estimate would typically move if Anita had sold a different sixty houses, and 0.0102 against an estimate of 0.1465 is tiny. `Pr(>|t|)` is the **p-value**, the chance of seeing a pattern this strong if area truly had no effect at all, and 0.0000 means the pattern is nothing like an accident.

Hold on to one detail, because it comes back. We planted 0.12 a square foot and this model reports 0.1465, which is noticeably more. That gap is not noise.

=== step === concept
::eyebrow One at a time
## Rooms on its own also looks perfect

Now the other question, asked the same way.

```r
model_rooms <- lm(price ~ rooms, data = houses)
round(coef(summary(model_rooms)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  53.1315    18.7485  2.8339   0.0063
#> rooms        40.9388     3.5119 11.6571   0.0000
```

Rooms come out at **40.94**, so on the face of it every extra room is worth nearly 41,000 dollars, with a standard error of 3.5 and a p-value that rounds to zero. If Anita stopped here she would tell her boss that a room is worth about 41,000 dollars, and she would be badly wrong, because we planted 8.

Here is what happened. When rooms is the only predictor, the model has no way to hold floor area constant, so a five-room house is being compared with a four-room house that is also about 300 square feet smaller. The 40.94 is therefore paying for both things at once: 300 square feet of floor at 0.12, which is 36, plus the 8 that the room itself is worth. Those add to 44, and the estimate lands a bit under that because the tie between rooms and area is strong without being perfect, so an extra room does not always drag a full 300 square feet along with it.

The same logic explains the earlier 0.1465 a square foot. When area is alone, every extra 300 square feet quietly drags a room along with it, and area gets credited for that room too.

[KEY INSIGHT]
A coefficient means nothing on its own. It always means "what goes with this variable, given whatever else is in the model", so the same column can honestly report 40.94 in one model and something completely different in another. Neither number is a lie; they are answers to different questions.

=== step === concept
::eyebrow Both at once
## The model everybody actually fits

The whole point of a multiple regression is to separate those tangled effects, so let us ask for exactly that: what is area worth holding rooms and age fixed, and what is a room worth holding area and age fixed?

```r
model <- lm(price ~ area + rooms + age, data = houses)
round(coef(summary(model)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  56.3540    15.9241  3.5389   0.0008
#> area          0.1643     0.0322  5.1075   0.0000
#> rooms        -4.3789     9.4604 -0.4629   0.6453
#> age          -0.9324     0.2883 -3.2336   0.0021
```

Read the `rooms` row and then read it again. The estimate is **-4.3789**, so this model says an extra room takes about 4,400 dollars **off** the price of a house, when we know for a fact that it adds 8,000. The p-value of 0.6453 says the pattern is entirely consistent with rooms doing nothing whatsoever.

Meanwhile `age` behaves beautifully. We planted -0.8 a year and the model reports **-0.9324** with a small standard error and a p-value of 0.002, which is the sort of result a person would happily put in a report.

The interval makes the contrast unmissable.

```r
round(confint(model), 1)
#>             2.5 % 97.5 %
#> (Intercept)  24.5   88.3
#> area          0.1    0.2
#> rooms       -23.3   14.6
#> age          -1.5   -0.4
```

A **confidence interval** is the range of values the data cannot rule out for a coefficient, and the one for rooms runs from **-23.3 to 14.6**. In plain words, Anita's data is consistent with an extra room knocking 23,000 dollars off a house and equally consistent with it adding 15,000. That is not an answer. It is a shrug with decimal places.

[WARNING]
Nothing here is broken. No warning was printed, no assumption of the model was violated, and `lm()` did precisely what it was asked. A sign that flips and a p-value that collapses are what an honest model looks like when it is asked a question the data cannot answer.

=== step === quiz
::eyebrow Check yourself
## What the minus sign means

Anita takes that table to her boss, who reads the `rooms` row and says: so rooms are worthless, we should stop counting them. Given what you know about how these prices were built, which reading is right?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- Rooms genuinely have no effect on price in this town, and the model has proved it
- The model has a bug, because a negative price for a room is impossible
- The data cannot separate rooms from floor area, so the estimate is enormously imprecise and this particular sample happened to land on the wrong side of zero ::ok Exactly. The estimate is -4.38 with a standard error of 9.46, which is more than twice the size of the estimate itself, so an answer anywhere between roughly minus 23 and plus 15 would have been unremarkable. Landing at -4.38 says almost nothing about rooms and quite a lot about how little independent evidence about rooms this sample contains.
- The negative sign is fine but the p-value is wrong, since we know rooms matter ::no The p-value is doing its job correctly. It answers "how surprising would a pattern this weak be if rooms truly had no effect", and the honest answer is: not surprising at all, because the data can barely see the room effect separately from the floor-area effect. A p-value of 0.65 is not evidence that rooms do nothing. It is a report that this study could not tell. Those two statements sound similar and lead to opposite decisions.

=== step === concept
::eyebrow The mechanism
## What "holding area constant" really asks for

To see why the rooms coefficient fell apart, ask what the model has to do to compute it. It has to compare houses that differ in rooms while agreeing on floor area and age, so the only evidence it can use is the part of `rooms` that floor area and age cannot already predict.

That part is measurable. Regress rooms on the other predictors and see how much of it they account for.

```r
aux_rooms <- lm(rooms ~ area + age, data = houses)
round(summary(aux_rooms)$r.squared, 4)
#> [1] 0.9114
```

This little model is called an **auxiliary regression**, meaning a side calculation that exists only to tell you about your main model, and notice that `price` appears nowhere in it. **R-squared** is the share of a column's variation that a model accounts for, on a scale from 0 to 1, so 0.9114 says that floor area and age between them already explain 91 percent of what makes one house have more rooms than another.

Only 9 percent of that variation is news, and those 9 percent are the entire evidence base for the rooms coefficient.

=== step === concept
::eyebrow The mechanism
## Nine percent of a column, in actual rooms

Percentages are slippery, so put that leftover in the units Anita works in.

```r
leftover <- residuals(aux_rooms)
round(c(sd_rooms = sd(houses$rooms), sd_leftover = sd(leftover)), 3)
#>    sd_rooms sd_leftover
#>       1.219       0.363
```

`residuals()` returns what is left of each house's room count after the auxiliary regression's prediction is subtracted, which is why we called it `leftover`. Across the sixty houses, room counts vary with a standard deviation of **1.219 rooms**, and once floor area and age have had their say the leftover varies by only **0.363 of a room**.

Look at the first six houses to see what a leftover actually is.

```r
head(round(data.frame(area = houses$area,
                      rooms = houses$rooms,
                      rooms_expected = fitted(aux_rooms),
                      leftover = leftover), 2))
#>   area rooms rooms_expected leftover
#> 1 1084     4           3.72     0.28
#> 2 1636     5           5.53    -0.53
#> 3 1379     5           4.68     0.32
#> 4 1308     5           4.43     0.57
#> 5 1843     6           6.16    -0.16
#> 6 1417     5           4.83     0.17
```

House 1 is 1,084 square feet, so a house that size usually has about 3.72 rooms, and this one has 4. It is 0.28 of a room more chopped up than its size suggests. House 2 is 0.53 of a room more open plan than its size suggests. Those small fractions, and nothing else, are what the model has to work with when it estimates the value of a room.

=== step === concept
::eyebrow Proof, not assertion
## The coefficient is fitted on the leftover alone

That claim is worth checking rather than believing, so check it. Regress the price directly on the leftover and compare the slope with the rooms coefficient from the full model.

```r
round(coef(lm(houses$price ~ leftover)), 4)
#> (Intercept)    leftover
#>    266.0133     -4.3789
```

**-4.3789**, to four decimal places, which is exactly the rooms coefficient from the three-predictor model. This is not a coincidence or an approximation. It is a theorem, usually named after Frisch, Waugh and Lovell, and it says that a multiple-regression coefficient is precisely the slope you get from the part of that predictor which the other predictors could not explain.

So the -4.38 was never computed from the full range of 3 to 8 rooms. It was computed from wobbles of about a third of a room, on sixty houses, with prices that bounce around by 25 thousand for reasons nobody recorded.

[KEY INSIGHT]
Multicollinearity is not a mysterious statistical illness. It is the simple fact that after the other predictors have taken their share, there may be almost nothing left of your variable to learn from. A tiny amount of evidence produces a wobbly estimate, and a wobbly estimate is free to come out negative.

=== step === quiz
::eyebrow Check yourself
## Where the estimate comes from

Anita's colleague suggests that since the room counts run all the way from 3 to 8, there is plenty of variety in the column and the model has plenty to work with. What is wrong with that?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is wrong. A range of 3 to 8 rooms is ample, so the problem must be the sample size
- The full range of 3 to 8 is mostly explained by floor area, and the coefficient is estimated only from the 0.363 of a room that remains once area and age are accounted for ::ok Right, and this is the whole mechanism in one sentence. The model is not allowed to use the part of the room count that floor area already predicts, because that part is exactly what "holding area constant" removes. Regressing price on the leftover gave the identical -4.3789, which is proof rather than analogy.
- The range is fine but the room counts are whole numbers, and regression needs continuous predictors ::no Whole numbers are not the issue: `age` is also recorded in whole years and its coefficient came out tight and correct. What matters is how much of a predictor survives after the others have explained what they can. Age is almost uncorrelated with the rest of the model, so nearly all of it survives, while 91 percent of the room count is already spoken for by floor area.

=== step === concept
::eyebrow The formula
## The one term in the formula that collinearity touches

There is a formula behind the standard error, and it is worth meeting once because every idea in the rest of this lesson is one of its four pieces.

For a predictor \(x_j\) in a model fitted on \(n\) observations, the standard error of its coefficient \(b_j\) is

\[ \text{SE}(b_j) = \sqrt{\frac{\sigma^2}{(n-1)\, s_j^2\, (1 - R_j^2)}} \]

Every symbol in words:

- \(\sigma\) is the size of the leftover noise in the outcome, so here it is how unpredictable house prices are after the model has done its best. We built the prices with \(\sigma = 25\) thousand dollars.
- \(n\) is the number of observations, which is Anita's 60 houses.
- \(s_j\) is how much the predictor itself varies, so for rooms it is that 1.219.
- \(R_j^2\) is the R-squared of the auxiliary regression, the share of \(x_j\) the other predictors already explain, which we measured as 0.9114.

Three of those four are about your data and your luck. Noisier prices push the standard error up, more houses pull it down, and a predictor that barely varies pushes it up. Collinearity lives entirely in the fourth, \(1 - R_j^2\), which for rooms is \(1 - 0.9114 = 0.0886\). Notice that the whole fraction sits under a square root, so the thing being divided by 0.0886 is the **variance** of the coefficient, which is simply the standard error squared. Dividing by 0.0886 instead of by 1 multiplies that variance by about eleven.

That multiplier is so useful that it has its own name.

=== step === concept
::eyebrow The number
## The variance inflation factor

The **variance inflation factor**, always written VIF, is that multiplier and nothing more:

\[ \text{VIF}_j = \frac{1}{1 - R_j^2} \]

It answers one question. How many times bigger is the variance of this coefficient, compared with a world where this predictor had no overlap with the others at all? Because we already have the auxiliary regression, we can compute it by hand right now.

```r
1 / (1 - summary(aux_rooms)$r.squared)
#> [1] 11.29199
```

So the variance of Anita's rooms coefficient is about **11.3 times** what it would have been if room count and floor area had been unrelated. A VIF of 1 means no overlap at all, and there is no upper limit: as a predictor approaches being a perfect combination of the others, \(R_j^2\) approaches 1 and the VIF runs off to infinity.

=== step === concept
::eyebrow The one line
## Getting all of them at once

Doing that by hand once is worth it, because now you know exactly what the function is doing. In practice you call the function, which lives in the `car` package.

```r
suppressMessages(library(car))
round(vif(model), 2)
#>  area rooms   age
#> 11.34 11.29  1.02
```

That is the whole check. `vif()` runs one auxiliary regression per predictor behind the scenes and hands back the multiplier for each, and the rooms figure of 11.29 matches the one we computed by hand. `suppressMessages()` is only there to keep the output tidy, because plain `library(car)` prints a note about also loading the `carData` package.

Read the three numbers as one sentence. Area and rooms are tangled with each other at about eleven, which always comes in a group because two variables can only be collinear together. Age sits at 1.02, meaning it is essentially independent of both, which is why its coefficient came out clean.

[TIP]
High VIFs never arrive alone. If exactly one predictor has a high VIF, look again: it is being explained by some combination of the others, so at least one of them is implicated too.

=== step === tryit
::eyebrow Your turn
## Compute one yourself

The VIF for a predictor comes from regressing that predictor on all the other predictors, and never on the outcome. Fill in the formula below to get the VIF for `area` the long way, then check it against the 11.34 that `vif()` printed.

```r
aux_area <- lm(____, data = houses)
1 / (1 - summary(aux_area)$r.squared)
```
::check {"regex":"area\\s*~\\s*(rooms\\s*\\+\\s*age|age\\s*\\+\\s*rooms)","gate":true,"difficulty":"beginner","ok":"That is it. The auxiliary regression gives an R-squared of 0.9118, and 1 / (1 - 0.9118) is 11.34, exactly what vif() reported for area.","no":"Regress the predictor on the OTHER predictors, with price left out entirely: area ~ rooms + age."}
::solution
```r
aux_area <- lm(area ~ rooms + age, data = houses)
round(summary(aux_area)$r.squared, 4)
#> [1] 0.9118

1 / (1 - summary(aux_area)$r.squared)
#> [1] 11.33549
```

=== step === concept
::eyebrow What the number buys you
## The square root is the number you feel

The VIF multiplies the variance, but nobody reads variances. What a person reads is a standard error and the width of an interval, and those are on the square-root scale.

```r
round(sqrt(vif(model)), 2)
#>  area rooms   age
#>  3.37  3.36  1.01
```

So Anita's interval for rooms is about **3.36 times wider** than it would have been without the overlap. That is the sentence to remember, because it converts a bare diagnostic number into something you can argue about with a boss.

You do not have to take it on faith either. Build the same town again with one change, letting each house get a room count drawn independently of its size, and see what the standard error looks like when the overlap is gone.

```r
set.seed(202)
rooms_free <- round(rnorm(n, mean = 5, sd = sd(houses$rooms)))
price_free <- round(60 + 0.12 * houses$area + 8 * rooms_free - 0.8 * houses$age +
                    rnorm(n, mean = 0, sd = 25), 1)
free_town <- data.frame(area = houses$area, rooms = rooms_free,
                        age = houses$age, price = price_free)

round(cor(free_town$area, free_town$rooms), 3)
#> [1] -0.022

round(vif(lm(price ~ area + rooms + age, data = free_town)), 2)
#>  area rooms   age
#>  1.01  1.00  1.01

round(coef(summary(lm(price ~ area + rooms + age, data = free_town))), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  34.5338    21.7195  1.5900   0.1175
#> area          0.1285     0.0095 13.5654   0.0000
#> rooms         9.3836     2.8124  3.3365   0.0015
#> age          -0.7279     0.2838 -2.5645   0.0130
```

Same sixty floor areas, same ages, same 8,000 dollars a room planted in the prices, same amount of noise. The only difference is that room count no longer tracks floor area, and every number that matters improves: rooms comes out at **9.38** instead of -4.38, and its standard error is **2.8124** instead of 9.4604.

Divide one by the other. 9.4604 divided by 2.8124 is **3.36**, which is the square root of the VIF, arriving on the nose. The two towns are not identical in every last respect, since the prices were drawn afresh, so agreement to two decimal places is a little lucky. The size of it is not luck at all: that is what the formula says the overlap costs, and this is it being paid.

=== step === quiz
::eyebrow Check yourself
## Reading a VIF

A colleague sends you a model with a VIF of 4 on the predictor you care about. What does that number tell you, on its own?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The coefficient is four times too large and should be divided by four
- The interval around that coefficient is about twice as wide as it would be if the predictor had no overlap with the others, because the square root of 4 is 2 ::ok Correct, and notice how modest that sounds compared with the panic the word multicollinearity usually causes. A VIF of 4 doubles the width. Whether doubling matters depends entirely on how wide the interval was to begin with and what decision rests on it.
- Four of the predictors in the model are redundant and should be removed
- There is a 4 percent chance the coefficient has the wrong sign ::no VIF is not a probability and it is not a count of variables. It is a multiplier on the VARIANCE of one coefficient, which means the square root of it is the multiplier on the standard error and therefore on the width of the interval. It says how much precision you lost, never how much bias you have, and never how many columns to delete.

=== step === concept
::eyebrow Thresholds
## Five and ten are conventions, not laws

You will read everywhere that a VIF above 5 deserves a look and a VIF above 10 is serious. Those numbers are conventions that spread through textbooks, not results derived from anything, and it helps to see what they correspond to.

| VIF | Interval width against a no-overlap world |
|---|---|
| 1 | 1.00 times |
| 2 | 1.41 times |
| 5 | 2.24 times |
| 10 | 3.16 times |
| 11.29 | 3.36 times |
| 20 | 4.47 times |
| 50 | 7.07 times |

Read the table as a translation, because the right-hand column is the only thing the VIF actually knows. A VIF of 10 means your interval is a bit over three times wider than it might have been, which is a disaster if you needed to distinguish 8 from 0, and completely irrelevant if the interval is still narrow enough for your decision.

The honest test is not a threshold. It is this: write down your interval, then ask whether both ends of it lead to the same decision. Anita's runs from -23 to +15, so one end says rip the walls out and the other says put more in. Different decisions, so her interval is too wide and the VIF is worth acting on. If her interval had run from 6 to 11 she would have a VIF of 11 and nothing to worry about.

[NOTE]
O'Brien's paper in the references at the end takes this argument apart properly and is worth twenty minutes if anyone ever quotes the rule of ten at you as though it were law.

=== step === concept
::eyebrow What survives, part one
## Predictions do not care at all

Now for the half of this subject that gets left out. Multicollinearity has a reputation as a model-wrecker, and the reputation is mostly undeserved, so it is worth being precise about what it leaves untouched.

Start with prediction. Ask both the tangled model and a model with rooms deleted what a 1,600 square foot, five-room, ten-year-old house should sell for.

```r
new_house <- data.frame(area = 1600, rooms = 5, age = 10)
round(predict(model, new_house, interval = "prediction"), 1)
#>     fit   lwr   upr
#> 1 287.9 233.7 342.2
```

```r
model_no_rooms <- lm(price ~ area + age, data = houses)
round(predict(model_no_rooms, new_house, interval = "prediction"), 1)
#>     fit   lwr   upr
#> 1 286.1 232.8 339.4

round(c(with_rooms = summary(model)$r.squared,
        without_rooms = summary(model_no_rooms)$r.squared), 4)
#>    with_rooms without_rooms
#>        0.8144        0.8137
```

287,900 dollars against 286,100, with prediction intervals that sit almost on top of each other and an R-squared that differs in the fourth decimal place. The two collinear predictors carry the same information, so it makes no difference which of them delivers it, and the model's ability to guess a price is exactly as good either way.

[KEY INSIGHT]
If your job is prediction, collinearity between predictors is close to a non-issue. It damages your ability to say which variable deserves the credit, and that is a completely different job from saying what the price will be.

=== step === concept
::eyebrow What survives, part two
## The rest of the model is fine

The second thing left standing is every coefficient that is not part of the tangle. Look back at the full model and follow the `age` row.

Age has a VIF of 1.02, a coefficient of -0.9324 against a planted truth of -0.8, a standard error of 0.2883 and a p-value of 0.002. It is not contaminated, not inflated and not in any way suspect, even though it sits in the same model as two predictors that are 0.955 correlated with each other.

This matters practically. People sometimes throw away a whole analysis because "the model has multicollinearity", when the coefficient they actually needed was never in the collinear block.

[KEY INSIGHT]
Collinearity is local. It costs precision on the variables that overlap each other, and it leaves every other coefficient in the model exactly as sharp as it would have been. Ask which block your question lives in before deciding whether you have a problem at all.

=== step === concept
::eyebrow What survives, part three
## The estimate is not biased and the interval is honest

The third survivor is the one that surprises people most, so here it is on a dial you can drag. Below, a full study is simulated a couple of thousand times at every setting of the slider, and two things are measured at each position: how often the 95 percent interval contains the true value, which is what a 95 percent interval promises, and the R-squared of the fit.

::widget assumption-dial {"assumption":"multicollinearity","levels":11,"start":0,"bars":26}

Drag it from none to severe and watch which line moves. Coverage stays flat at 95 percent, because collinearity does not **bias** anything, meaning it never pushes the estimates systematically too high or too low, and the fit sits still too. What grows, dramatically, is the width of the individual intervals drawn underneath. The estimates get less certain and say so.

That is the correct mental model. A wide interval is not a broken interval. It is a true statement about how little this data can pin down, which is a result you can report rather than a fault you have to repair.

=== step === concept
::eyebrow Anita in a thousand parallel towns
## What would have happened in a different sixty houses

The dial is a general simulation, so let us run the same idea on Anita's exact setup. This block builds her town a thousand times over, each with different houses drawn from the same rules, fits the same model each time and records what happened to the rooms coefficient.

```r
set.seed(7)
one_town <- function() {
  a <- round(rnorm(60, mean = 1500, sd = 350))
  r <- round(a / 300 + rnorm(60, mean = 0, sd = 0.2))
  g <- round(runif(60, min = 0, max = 40))
  p <- round(60 + 0.12 * a + 8 * r - 0.8 * g + rnorm(60, mean = 0, sd = 25), 1)
  fit <- lm(p ~ a + r + g)
  ci  <- confint(fit)["r", ]
  c(rooms_estimate = unname(coef(fit)["r"]),
    area_estimate  = unname(coef(fit)["a"]),
    covers_truth   = unname(ci[1] < 8 && 8 < ci[2]))
}

towns <- as.data.frame(t(replicate(1000, one_town())))

round(c(average_estimate = mean(towns$rooms_estimate),
        spread           = sd(towns$rooms_estimate),
        share_negative   = mean(towns$rooms_estimate < 0),
        interval_covers  = mean(towns$covers_truth)), 3)
#> average_estimate           spread   share_negative  interval_covers
#>            7.688            9.631            0.208            0.944
```

Four numbers, and each one settles an argument.

The **average estimate is 7.688** against a truth of 8, so the method is not biased. Nothing about collinearity pulls estimates in a systematic direction; run enough towns and they average out to the right answer. The **spread is 9.631**, which is enormous next to an effect of 8, and that is the actual damage. In **20.8 percent** of towns the estimate came out negative, so Anita was not unlucky in any remarkable way, she was in the one-in-five bucket. And the interval **covered the truth 94.4 percent** of the time, which is what a 95 percent interval is supposed to do, so the model's own uncertainty statement was telling the truth the whole way through.

Here is the same thing as a picture.

```r
hist(towns$rooms_estimate, breaks = 30, col = "#dbe4f0", border = "white",
     main = "What one more room is worth, in 1000 different towns",
     xlab = "estimated value of one room (thousands of dollars)")
abline(v = 8, col = "#1f7a55", lwd = 3)
abline(v = 0, col = "#c2410c", lwd = 2, lty = 2)
```

The green line is the truth we planted and the dashed orange line is zero. The pile of estimates is centred on the green line, exactly as an unbiased method should be, and it is wide enough that a fifth of it spills over to the wrong side of the orange one.

=== step === tryit
::eyebrow Your turn
## Ask the towns a question

`towns` has one row per simulated town, with the estimated value of a room in `rooms_estimate`. Write the single line that answers this: in what share of those thousand towns would Anita have concluded that an extra room is worth more than 20,000 dollars, which is more than double the truth?

```r
____
```
::check {"regex":"mean\\s*\\(\\s*towns\\$rooms_estimate\\s*>\\s*20","gate":true,"difficulty":"intermediate","ok":"Yes, 0.105. One town in ten overstates the room effect by more than a factor of two, which is the mirror image of the one in five that gets a negative. Both come out of the same wide spread.","no":"A comparison like towns$rooms_estimate > 20 gives one TRUE or FALSE per town, and mean() of TRUE and FALSE is the share that are TRUE. So: mean(towns$rooms_estimate > 20)."}
::solution
```r
mean(towns$rooms_estimate > 20)
#> [1] 0.105
```

=== step === concept
::eyebrow Why the estimates swing
## The two coefficients trade against each other

There is one more thing hiding in those thousand towns, and it explains why the damage is survivable. Plot each town's two estimates against each other.

```r
plot(towns$area_estimate, towns$rooms_estimate, pch = 19, col = "#2563a888",
     xlab = "estimated value of one square foot",
     ylab = "estimated value of one room",
     main = "Every town lands somewhere on the same band")
points(0.12, 8, pch = 4, cex = 2, lwd = 3, col = "#1f7a55")

round(cor(towns$area_estimate, towns$rooms_estimate), 3)
#> [1] -0.96
```

The cloud is not a blob, it is a narrow diagonal band, and the correlation between the two estimates is **-0.96**. Whenever a town's model credits floor area generously it compensates by charging rooms, and whenever it credits rooms generously it takes the difference back off floor area. The pair is pinned down even though neither member of it is.

That is not a metaphor. You can price the combination directly in Anita's own data, using the covariances that `lm()` already computed.

```r
V <- vcov(model)
round(V[c("area", "rooms"), c("area", "rooms")], 6)
#>            area    rooms
#> area   0.001034 -0.29032
#> rooms -0.290320 89.49828
```

`vcov()` returns the variances of the coefficients on the diagonal and their **covariances** off it, a covariance being the unscaled twin of a correlation: same sign, same meaning, just not squeezed into the range -1 to 1. The entry off the diagonal here is **negative**, which is the arithmetic of that band. Now ask a question that respects it: what is a 300 square foot extension that also adds one room worth? That is 300 lots of the area coefficient plus one lot of the rooms coefficient, and the standard error of a sum includes the covariance term.

```r
value_of_300_feet <- unname(300 * coef(model)["area"])
value_of_one_room <- unname(coef(model)["rooms"])
bundle     <- value_of_300_feet + value_of_one_room
var_bundle <- 300^2 * V["area", "area"] + V["rooms", "rooms"] + 2 * 300 * V["area", "rooms"]
std_err    <- sqrt(var_bundle)

round(c(feet = value_of_300_feet, room = value_of_one_room, bundle = bundle,
        std_error = std_err, low = bundle - 2 * std_err, high = bundle + 2 * std_err), 2)
#>      feet      room    bundle std_error       low      high
#>     49.28     -4.38     44.90      2.90     39.10     50.69
```

Separately those two numbers are nonsense: 49.28 for the floor space is too high and -4.38 for the room is negative. Added together they give **44.90 with a standard error of 2.90**, and the truth we planted is 0.12 times 300 plus 8, which is exactly **44**. The interval runs from 39 to 51 and it is tight.

[KEY INSIGHT]
The data knows precisely what a bigger house is worth. What it cannot do is split that value between the square feet and the rooms, because in this town the two always arrive together. Multicollinearity takes away a decomposition, not information.

=== step === quiz
::eyebrow Check yourself
## What is damaged and what is not

Anita's boss now wants a rule of thumb. Which of these is the accurate summary of what her tangled model can and cannot do?

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- The model is unusable until the collinearity is removed, because everything it reports is unreliable
- Only the p-values are affected; the estimates and intervals are fine
- The estimates are biased towards zero, so the true room effect must be larger than any of them suggest
- Predictions are unaffected, age keeps its clean coefficient, the room estimate is unbiased and its interval is honest, and the only real casualty is how precisely area and rooms can be told apart ::ok That is the full picture, and each piece was measured rather than asserted: the predicted price moved by less than 2 thousand when rooms was deleted, age came out at -0.93 against a truth of -0.8, the thousand towns averaged 7.688 against a truth of 8, and the intervals covered that truth 94.4 percent of the time. What blew up was the width, by a factor of 3.36.
- Nothing is affected at all, since the intervals covered the truth 94.4 percent of the time ::no Coverage holding at 95 percent is genuinely reassuring, but it is not the same as nothing being wrong. An interval running from -23 to +15 is honest and useless at the same time, because it covers the truth by being wide enough to cover almost everything. Honest and informative are different properties, and collinearity costs you the second one.

=== step === concept
::eyebrow Lookalike one
## The exact duplicate

Three situations get called multicollinearity and behave completely differently, so it is worth being able to tell them apart on sight. The first is the harmless-looking one where the same measurement appears twice.

Suppose Anita's spreadsheet also carries floor area in square metres, which is the same column times 0.0929.

```r
houses$area_sqm <- houses$area * 0.0929
round(coef(lm(price ~ area + area_sqm + rooms + age, data = houses)), 4)
#> (Intercept)        area    area_sqm       rooms         age
#>     56.3540      0.1643          NA     -4.3789     -0.9324
```

R prints **NA** for the second copy and carries on. This is **perfect collinearity**, where one predictor is an exact combination of others, and there is genuinely no answer to be had: any amount you take off the square-feet coefficient can be handed to the square-metres one with the fit unchanged, so there are infinitely many equally good answers. R picks one, drops the redundant column and tells you with the NA.

That NA is a feature. The software noticed and protected you.

=== step === concept
::eyebrow Lookalike one
## Round the duplicate and the protection vanishes

Now make the duplicate nearly rather than exactly redundant, which is what happens when the second column was typed in by hand, converted and rounded, or measured with a slightly different tape.

```r
houses$area_sqm_rounded <- round(houses$area * 0.0929, 2)
round(coef(summary(lm(price ~ area + area_sqm_rounded + rooms + age, data = houses))), 2)
#>                  Estimate Std. Error t value Pr(>|t|)
#> (Intercept)         57.36      16.02    3.58     0.00
#> area                97.12     117.99    0.82     0.41
#> area_sqm_rounded -1043.66    1270.10   -0.82     0.41
#> rooms               -4.55       9.49   -0.48     0.63
#> age                 -0.96       0.29   -3.29     0.00
```

No NA this time, no warning, and two coefficients that are complete nonsense: **97.12** thousand dollars a square foot, cancelled by **-1043.66** thousand for every square metre. The two absurdities sit almost exactly on top of each other, so the predictions are still fine, which is why nothing complains.

```r
round(vif(lm(price ~ area + area_sqm_rounded + rooms + age, data = houses)), 0)
#>             area area_sqm_rounded            rooms              age
#>        151708543        151706478               11                1
```

A VIF of **151 million**. When you see numbers on that scale, stop looking for a statistical remedy and go and find the duplicated column, because that is what the diagnostic is pointing at. Rounding to two decimal places was the only thing standing between this model and an honest NA.

=== step === concept
::eyebrow Lookalike two
## Parts and a total, which correlations cannot see

The second lookalike is the one that catches careful people, because it hides from the check most analysts do first. Here is a different building: sixty flats, each recorded with a number of bedrooms, a number of bathrooms, a number of other rooms, and a total room count that somebody typed into its own column.

```r
set.seed(5)
beds  <- sample(1:4, 60, replace = TRUE)
baths <- sample(1:3, 60, replace = TRUE)
other <- sample(1:3, 60, replace = TRUE)
recorded_total <- beds + baths + other + sample(c(rep(0, 54), 1, 1, 1, -1, -1, -1))
flat_price <- round(150 + 20 * beds + 15 * baths + 10 * other + rnorm(60, 0, 25), 1)

flats <- data.frame(beds, baths, other, recorded_total, price = flat_price)
head(flats)
#>   beds baths other recorded_total price
#> 1    2     1     2              5 275.5
#> 2    3     3     3              9 237.4
#> 3    1     3     2              6 260.4
#> 4    3     2     3              7 249.5
#> 5    3     1     3              6 265.9
#> 6    1     3     3              7 244.5
```

The three parts are drawn independently of each other, and the total is their sum except in six flats where the recorded figure is out by one, which is what real data entry looks like. Prices are built from the parts alone: 20 thousand a bedroom, 15 a bathroom, 10 for anything else.

Now do what almost everybody does first and look at the correlations.

::widget correlation-heatmap {"vars":["beds","baths","other","recorded_total"],"matrix":[[1,-0.13,-0.12,0.6],[-0.13,1,-0.04,0.49],[-0.12,-0.04,1,0.42],[0.6,0.49,0.42,1]]}

Not one cell is alarming. The three parts are essentially uncorrelated with each other, and each of them correlates only 0.42 to 0.60 with the total, which most people would call moderate and move on. There is no pair of near-duplicates anywhere in this table.

=== step === concept
::eyebrow Lookalike two
## And yet every coefficient falls apart

Fit the model that includes the parts and the total together.

```r
flat_model <- lm(price ~ beds + baths + other + recorded_total, data = flats)
round(coef(summary(flat_model)), 3)
#>                Estimate Std. Error t value Pr(>|t|)
#> (Intercept)     143.718     15.854   9.065    0.000
#> beds              5.934     11.009   0.539    0.592
#> baths             0.419     11.871   0.035    0.972
#> other             8.095     10.739   0.754    0.454
#> recorded_total   10.870     10.750   1.011    0.316

round(vif(flat_model), 1)
#>           beds          baths          other recorded_total
#>           13.3            9.2            7.3           22.6
```

Bedrooms come out at **5.93** against a planted 20, bathrooms at **0.42** against 15, and not one predictor reaches significance, in a dataset where all three effects are real and strong. The VIFs run from 7.3 to 22.6.

The reason no correlation could show this is that the dependency involves four columns at once. No single pair is redundant, but `recorded_total` is almost exactly `beds + baths + other`, and "almost exactly a combination of the other three" is precisely what an auxiliary regression measures and a pairwise correlation cannot.

Drop the total, which contains nothing the parts do not already say, and everything recovers.

```r
round(coef(summary(lm(price ~ beds + baths + other, data = flats))), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  145.017     15.805   9.175    0.000
#> beds          16.626      3.066   5.423    0.000
#> baths         11.738      3.953   2.969    0.004
#> other         18.171      4.005   4.537    0.000
```

[TIP]
Any time your table carries both the pieces and their sum, or both a count and a rate built from that count, or a set of shares that add to 100, you have this. It is the most common collinearity in business data and the one most likely to be missed, because the correlation matrix looks calm.

=== step === quiz
::eyebrow Check yourself
## Why the matrix missed it

You inspect a correlation matrix of six predictors and the largest value anywhere is 0.60. What can you conclude about multicollinearity?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing is collinear, since 0.60 is well below any of the usual danger levels
- Nothing is collinear yet, but adding more predictors could change that
- Very little, because a predictor can be almost perfectly explained by a combination of several others while sharing only a moderate correlation with each of them individually ::ok Exactly what the flats showed. The largest cell in that matrix was 0.60 and the largest VIF was 22.6, because `recorded_total` was nearly the sum of three columns that were each only moderately related to it. A pairwise correlation looks at two columns at a time, and this dependency needed four.
- Nothing, because correlations are meaningless when predictors are on different scales ::no Correlation is already scale-free, so different units are not the problem: multiplying a column by a thousand leaves every correlation identical. The real limitation is arithmetic. A correlation compares two columns, whereas a VIF regresses one predictor on ALL the others at once, which is why it can see a dependency spread across three or four columns that no single pair reveals.

=== step === concept
::eyebrow Lookalike three
## The high VIF that means nothing

The third lookalike is the one that causes the most needless panic. Suppose Anita wonders whether price rises a little faster in bigger houses, so she adds a squared term to let the line bend. Working in hundreds of square feet keeps the numbers readable.

```r
houses$area_100 <- houses$area / 100
curve_model <- lm(price ~ area_100 + I(area_100^2), data = houses)
round(coef(summary(curve_model)), 3)
#>               Estimate Std. Error t value Pr(>|t|)
#> (Intercept)     42.001     52.018   0.807    0.423
#> area_100        14.461      6.663   2.170    0.034
#> I(area_100^2)    0.006      0.208   0.028    0.977

round(vif(curve_model), 1)
#>      area_100 I(area_100^2)
#>          41.7          41.7
```

A VIF of **41.7** on both terms, four times worse than the one that wrecked the room coefficient. And yet nothing here is wrong at all, because of where the collinearity comes from. Across the range 6.71 to 25.04 hundred square feet, the function \(x^2\) rises steadily wherever \(x\) does, so the two columns correlate at 0.988 purely as arithmetic. It is not a fact about houses and no amount of extra data would reduce it.

This is called **structural multicollinearity**, meaning collinearity you created yourself by building one predictor out of another, and squares, cubes and interaction terms all produce it.

=== step === concept
::eyebrow Lookalike three
## Centring makes it disappear, and changes nothing

The cure is to measure floor area from its own average rather than from zero, which is called **centring**.

```r
houses$area_100c <- houses$area_100 - mean(houses$area_100)
curve_centred <- lm(price ~ area_100c + I(area_100c^2), data = houses)
round(coef(summary(curve_centred)), 3)
#>                Estimate Std. Error t value Pr(>|t|)
#> (Intercept)     265.939      4.525  58.774    0.000
#> area_100c        14.642      1.048  13.975    0.000
#> I(area_100c^2)    0.006      0.208   0.028    0.977

round(vif(curve_centred), 2)
#>      area_100c I(area_100c^2)
#>           1.03           1.03
```

The VIF collapses from 41.7 to **1.03**. Once area is measured either side of its average, the small houses have negative values whose squares are large and the large houses have positive values whose squares are also large, so the squared column stops marching in step with the plain one.

Is this a real improvement or a trick? Check the only thing that could tell you.

```r
all.equal(unname(fitted(curve_model)), unname(fitted(curve_centred)))
#> [1] TRUE
```

Every single predicted price is identical. The two models are the same model, written in two coordinate systems, and the curvature term is unchanged at 0.006 with a p-value of 0.977 in both, which is the correct verdict here since we built these prices from a straight line with no curvature at all.

[KEY INSIGHT]
Structural collinearity is a property of your parameterisation, not of your data, and centring fixes the display without touching the model. If a high VIF sits on a squared term or an interaction, centre the ingredients and look again before you change anything real.

=== step === quiz
::eyebrow Check yourself
## Which high VIF should worry you

Four models come back with a VIF above 10. In which one is the high VIF a genuine warning about what the data can tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A model containing `age` and `age^2`, both with a VIF near 30
- A model containing floor area and room count, both with a VIF near 11, in a town where big houses reliably have more rooms ::ok Yes. This one is about the world: the houses that exist really do tie the two together, so the data genuinely lacks the comparison you are asking for, and only different houses or more of them can help. The other three are artefacts of how the columns were written down, and centring or deleting a redundant column fixes them without changing a single prediction.
- A model containing spend in dollars and spend in thousands of dollars, one showing NA
- A model containing four regional shares that add to 100 percent, with VIFs in the hundreds ::no Look at where each dependency comes from. A squared term, a unit conversion and a set of shares that add to a fixed total are all things YOU created when you built the columns, and each has a mechanical fix that leaves the model identical: centre it, drop the duplicate, drop one share as the reference. Only the floor-area case describes a limitation of the houses themselves, which is why it is the one that needs a real decision rather than a tidy-up.

=== step === concept
::eyebrow Categorical predictors
## What to read when a factor is involved

One practical wrinkle before the remedies. If a predictor is a category rather than a number, R turns it into several yes-no columns internally, so a single VIF per column would be misleading. Say Anita adds the style of the property.

```r
houses$style <- factor(ifelse(houses$rooms <= 4, "terrace",
                       ifelse(houses$rooms <= 6, "semi", "detached")),
                       levels = c("terrace", "semi", "detached"))
table(houses$style)
#>
#>  terrace     semi detached
#>       18       33        9

style_model <- lm(price ~ area + rooms + age + style, data = houses)
round(vif(style_model), 3)
#>         GVIF Df GVIF^(1/(2*Df))
#> area  11.421  1           3.379
#> rooms 19.043  1           4.364
#> age    1.023  1           1.011
#> style  7.333  2           1.646
```

With a factor in the model, `vif()` returns three columns instead of one. `GVIF` is the generalised version, `Df` is how many yes-no columns the factor needed, which is one fewer than its number of levels, and the third column is the one to read. It is the GVIF taken to the power \(1/(2\,\text{Df})\), which puts factors and plain numbers back on the same scale, so you compare it against the square roots you already understand: about 2.24 is the old threshold of 5, and about 3.16 is the old threshold of 10.

Note what happened to rooms as well. Its VIF climbed from 11.29 to 19.04, because `style` was carved out of the room count, so adding it made the tangle worse. Building a category out of a number you are already using is a reliable way to manufacture collinearity.

=== step === concept
::eyebrow One more diagnostic
## The condition number, and why it is slippery

You will sometimes see a second diagnostic quoted, the **condition number** of the design matrix, which is the name for the grid of predictor columns the model was fitted on, with a rule that anything above 30 is trouble. It is worth knowing what it does and why it is easier to misread than the VIF.

```r
round(kappa(scale(houses[, c("area", "rooms", "age")]), exact = TRUE), 2)
#> [1] 6.61
```

```r
design <- model.matrix(model)
unit_length <- apply(design, 2, function(column) column / sqrt(sum(column^2)))
round(kappa(unit_length, exact = TRUE), 1)
#> [1] 40.5
```

Same data, same model, and two answers on opposite sides of the famous threshold: **6.61** when the predictors are centred and standardised, **40.5** when the columns are only scaled to unit length, which is the recipe the rule of 30 was written for. Neither calculation is wrong, and the number simply depends on a choice about scaling that the rule of thumb does not mention.

The condition number looks at the whole set of predictors at once and summarises how close those columns are to carrying an exact redundancy, which makes it a decent global alarm. What it will not tell you is which coefficient is affected or by how much, and those are the two things you actually need. Use the VIF for that, and treat a condition number as background information.

=== step === concept
::eyebrow Before you fix anything
## The routine, and the question that comes first

Anita now knows what she has. The temptation at this point is to reach for a technique, and the first move is not a technique at all: it is deciding which question you are being paid to answer, because that determines whether there is anything to fix.

::widget process-flow {"steps":[{"title":"Fit what your question needs","sub":"the variables the question requires, not the ones with tidy numbers"},{"title":"Read the standard errors first","sub":"a too-wide interval is the symptom, and VIF only explains it"},{"title":"Run vif and find the block","sub":"high values always come in groups of two or more"},{"title":"Ask what the decision needs","sub":"prediction and unrelated controls are unaffected, so often nothing must change"},{"title":"If you need the split, buy it or bundle it","sub":"more data, more spread, a combined variable, or a penalty"}]}

Notice the order. The interval comes before the diagnostic, because a wide interval is what actually hurts and the VIF is only an explanation of why. A model can have a VIF of 12 and intervals narrow enough for every decision on the table, in which case the correct action is to write the number in a footnote and move on.

The five remedies that follow are in the order you should consider them, and the first one is doing nothing at all.

=== step === concept
::eyebrow Remedy one
## Leave it alone, which is more often right than not

The first remedy is to write the finding down and carry on, and it applies more often than the literature's tone suggests. Three situations qualify, and every one of them has already appeared on this page:

- **Your output is a prediction.** Anita's valuation tool guesses prices, and the tangled model guessed 287.9 where the trimmed one guessed 286.1. Nothing to fix.
- **The coefficient you need is outside the collinear block.** If the question this month is what age does to a price, `age` has a VIF of 1.02 and an interval of -1.5 to -0.4, and the tangle elsewhere in the model is somebody else's problem.
- **The interval is wide but still decisive.** The bundle came out at 44.9 with an interval of 39.1 to 50.7, and if every value in that range leads to the same decision then the width has cost you nothing that matters.

Leaving it alone does not mean staying quiet about it. Report the VIF, report the wide interval, and say plainly which question the data could not settle, because a reader who finds that out later will wonder what else went unsaid.

=== step === concept
::eyebrow The trap
## The fix that makes everything worse

Before the remedies that take actual work, here is the popular one, because you will be offered it constantly: drop the variable with the high VIF. Anita deletes floor area, which does make the diagnostic problem vanish.

```r
round(coef(summary(lm(price ~ rooms + age, data = houses))), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  66.9533    18.9467  3.5338   0.0008
#> rooms        41.7287     3.3947 12.2923   0.0000
#> age          -0.8218     0.3451 -2.3817   0.0206
```

Look how good that looks. Rooms is **41.73** with a standard error of 3.39 and a p-value under 0.001, every VIF is near 1, and the table would sail through any review. It is also wrong by a factor of five, because the truth is 8.

What Anita has done is ask the earlier question again, the one where rooms is paid for the floor area it drags along, and this time she has done it without noticing. The bias has a name, **omitted variable bias**: leave out something that matters and is correlated with what you kept, and its effect gets absorbed into the coefficient of what you kept.

[WARNING]
Deleting a predictor to bring a VIF down does not create the information you were missing. It hides the uncertainty by producing a narrow interval around the wrong number, which is the worst of the outcomes available, because now nothing in the output warns you. A wide honest interval at least tells the truth about itself.

The exception is when the two variables really are the same measurement, like the square feet and square metres columns from earlier. Deleting one of those loses nothing, because there was nothing there to lose.

=== step === quiz
::eyebrow Check yourself
## Ranking the outcomes

Anita has two write-ups on her desk. Version A comes from the full model and reports that a room is worth somewhere between -23 and +15 thousand dollars. Version B comes from the model with floor area deleted and reports 41.7 thousand, plus or minus about 7. Which is the better report to hand over, and why?

::quiz {"correct":1,"gate":true,"difficulty":"advanced"}
- Version A, because it is honest about how little the data can say, whereas version B is a precise number that is wrong by a factor of five ::ok Right, and it is worth being blunt about why. Version B is more dangerous precisely because it looks better: its interval is narrow, its p-value is tiny, and nothing in it hints that floor area was quietly folded into that 41.7. Version A is unsatisfying and correct, which is a much easier position to improve from, since the fixes that follow all start by admitting what the current data cannot separate.
- Version B, because a usable number beats an interval nobody can act on
- Version B, because its p-value is far smaller and the estimate is far more precise
- Neither, because both models are invalid once multicollinearity is present ::no Multicollinearity does not invalidate a model. The full model in version A is unbiased, its interval covers the truth 94.4 percent of the time, and its predictions are fine, so it is a perfectly valid piece of work that happens to be uninformative about one coefficient. Version B is the invalid one, not because of any diagnostic, but because deleting floor area biased the room coefficient by omitting something that genuinely belongs in the model.

=== step === concept
::eyebrow Remedy two
## Ask a question the data can answer

The first real remedy costs nothing, because it changes the question rather than the data. Anita cannot separate rooms from floor area, but she can ask about things her houses actually vary in, and one of those is how big the rooms are.

```r
houses$room_size <- round(houses$area / houses$rooms, 1)
size_model <- lm(price ~ rooms + room_size + age, data = houses)
round(coef(summary(size_model)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -153.4953    48.3692 -3.1734   0.0024
#> rooms         43.3290     2.8963 14.9603   0.0000
#> room_size      0.7238     0.1498  4.8317   0.0000
#> age           -0.9364     0.2934 -3.1915   0.0023

round(vif(size_model), 2)
#>     rooms room_size       age
#>      1.02      1.02      1.02
```

Every VIF is back to 1, and both coefficients are sharp. Read them carefully, because they answer different questions from before. `rooms` at **43.33** is the value of one more room of the usual size for this town, meaning the room itself plus the floor space that comes with it. The average room here is 296.5 square feet, so the truth we planted works out at 8 plus 0.12 times 296.5, which is 43.6, and the estimate lands within a third of that. `room_size` at **0.72** says that stretching every room in the house by one square foot adds about 720 dollars, and since a typical house here has 5.2 rooms the planted value implies 0.12 times 5.2, or 0.62, which sits comfortably inside this coefficient's interval of 0.42 to 1.02.

Once you do need a number rather than a caveat, this is the remedy to reach for before any of the others, because it is the only one that hands you a well-determined answer without inventing anything. Its cost is that you must be willing to answer the question your data can support instead of the one you first wrote down.

=== step === concept
::eyebrow Remedy two, honestly
## Reparameterising invents nothing

That result can be oversold, so here is the honest limit of it. Suppose Anita insists on the original question and only wants the diagnostic to look better. She can replace rooms with the leftover from earlier, the part of the room count that floor area cannot explain, and call it `extra_rooms`.

```r
houses$extra_rooms <- residuals(lm(rooms ~ area, data = houses))
extra_model <- lm(price ~ area + extra_rooms + age, data = houses)
round(coef(summary(extra_model)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  55.4097    15.7677  3.5141   0.0009
#> area          0.1501     0.0096 15.6057   0.0000
#> extra_rooms  -4.3789     9.4604 -0.4629   0.6453
#> age          -0.9324     0.2883 -3.2336   0.0021

round(vif(extra_model), 2)
#>        area extra_rooms         age
#>        1.01        1.00        1.02
```

The VIFs are all 1, so on the diagnostic this model is perfectly healthy. Now compare the `extra_rooms` row with the `rooms` row from the original model: estimate **-4.3789**, standard error **9.4604**, p-value **0.6453**. Not similar, identical, to every decimal place printed.

The question "what is a room worth, holding floor area constant" is just as unanswerable as it was, and it has to be, because no amount of rearranging can add evidence that was never collected. What did change is the meaning of the area coefficient, which is now 0.1501 and covers the whole size effect including the rooms that come with it, which is why its standard error shrank.

[KEY INSIGHT]
A remedy that only makes the VIF smaller has not helped you. Judge every fix by the width of the interval on the quantity you care about, since that is the thing that was damaged, and a diagnostic returning to 1 while the interval sits still is a cosmetic result.

=== step === concept
::eyebrow Remedy three
## Buy the answer with more data, or more variety

The problem is a shortage of independent evidence, so the direct cure is more of it. Give Anita ten times the sales from the same town, generated by exactly the same rules.

```r
set.seed(19)
big_area  <- round(rnorm(600, mean = 1500, sd = 350))
big_rooms <- round(big_area / 300 + rnorm(600, mean = 0, sd = 0.2))
big_age   <- round(runif(600, min = 0, max = 40))
big_price <- round(60 + 0.12 * big_area + 8 * big_rooms - 0.8 * big_age +
                   rnorm(600, mean = 0, sd = 25), 1)
big_town  <- data.frame(area = big_area, rooms = big_rooms, age = big_age, price = big_price)

big_model <- lm(price ~ area + rooms + age, data = big_town)
round(coef(summary(big_model)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  55.4328     4.8150 11.5125    0e+00
#> area          0.1142     0.0102 11.1604    0e+00
#> rooms        10.4610     2.8943  3.6144    3e-04
#> age          -0.7141     0.0878 -8.1298    0e+00

round(vif(big_model), 2)
#>  area rooms   age
#> 12.22 12.23  1.00
```

Rooms now comes out at **10.46** with a standard error of 2.89 and a p-value of 0.0003, close to the planted 8 and comfortably positive. Both original questions have usable answers.

Then look at the VIF: **12.23**, slightly higher than the 11.29 we started with. The overlap between floor area and room count did not improve at all, because it is a fact about houses, and yet the problem is solved. The formula said this would happen, since \(n\) and \(1 - R_j^2\) are separate terms and enlarging one offsets the other.

[KEY INSIGHT]
The VIF is not the disease. It is one of four things that set the width of your interval, and beating any of the others works just as well. More houses, or a more varied set of houses, buys precision that no rearrangement of the same sixty ever could.

The cheaper version of the same idea is to go looking for the unusual cases: a 2,000 square foot loft with three rooms, or a chopped-up 900 square foot cottage with six. Those houses are worth ten ordinary ones each here, because they are the only ones that carry information about rooms independently of size.

=== step === concept
::eyebrow Remedy four
## Ridge, which trades a little bias for a lot of stability

When you must keep every predictor and cannot get more data, there is a technique that accepts a small amount of bias in exchange for a large reduction in the swinging. The panel below opens on a cousin of it called the lasso, so press **Ridge (L2)** first, then drag the penalty slider from left to right: all six coefficients are squeezed towards zero together, and not one of them ever quite arrives.

::widget coef-path {}

That squeezing is **ridge regression**. Ordinary least squares picks the coefficients that fit the data best; ridge picks the ones that fit well while also keeping the coefficients small, and the size of that second requirement is set by a number called lambda. Since collinearity is what lets two coefficients run off in opposite directions, a penalty on their size stops them.

```r
suppressMessages(library(glmnet))
X <- as.matrix(houses[, c("area", "rooms", "age")])
y <- houses$price

ridge <- glmnet(X, y, alpha = 0, lambda = c(30, 10, 3, 1))
round(as.matrix(coef(ridge)), 3)
#>                 s0     s1     s2     s3
#> (Intercept) 97.035 71.736 61.150 57.973
#> area         0.066  0.087  0.115  0.139
#> rooms       15.199 14.676  9.079  2.718
#> age         -0.521 -0.731 -0.851 -0.899
```

`alpha = 0` asks for ridge specifically, and the four columns are the four lambdas in the order given, from the strong penalty of 30 on the left to the weak penalty of 1 on the right. Follow the rooms row from right to left as the penalty tightens: **2.718, 9.079, 14.676, 15.199**, moving away from the negative value that unpenalised fitting produced. Every one of those is a defensible number in a way that -4.38 was not.

Choosing lambda by hand is guesswork, so let cross-validation pick it, which means repeatedly fitting on part of the data and checking the rest.

```r
set.seed(3)
ridge_cv <- cv.glmnet(X, y, alpha = 0, nfolds = 10)
round(ridge_cv$lambda.min, 3)
#> [1] 5.216

round(as.matrix(coef(ridge_cv, s = "lambda.min")), 3)
#>             lambda.min
#> (Intercept)     64.603
#> area             0.101
#> rooms           12.147
#> age             -0.807
```

Area lands at **0.101** and rooms at **12.147**, against planted values of 0.12 and 8. Both are far closer to the truth than the least-squares pair of 0.164 and -4.38.

[WARNING]
Ridge is not free and the textbooks are honest about this even when blog posts are not. These estimates are **biased on purpose**, so they should not be quoted as unbiased effects, and there is no simple p-value or confidence interval to go with them. Ridge is the right tool when you need stable coefficients for a prediction or a decision rule, and the wrong tool when you need a defensible statement about the size of one effect.

=== step === concept
::eyebrow Remedy five
## Fold the pair into a single index

The last remedy admits that the two columns are measuring one underlying thing and builds that thing explicitly. **Principal component analysis** takes a set of correlated columns and produces new columns that are uncorrelated by construction, ordered so the first one carries as much of the shared variation as possible.

```r
pc <- prcomp(houses[, c("area", "rooms")], scale. = TRUE)
round(pc$sdev^2 / sum(pc$sdev^2), 3)
#> [1] 0.977 0.023

round(pc$rotation, 3)
#>         PC1    PC2
#> area  0.707 -0.707
#> rooms 0.707  0.707
```

The first component carries **97.7 percent** of what those two columns contain, and the recipe for it is an equal blend of standardised floor area and standardised room count, which is a sensible definition of "how big is this house". The second component is the remaining 2.3 percent, the part where the two disagree, which is the very sliver Anita could not estimate reliably.

```r
houses$size_index <- pc$x[, 1]
round(coef(summary(lm(price ~ size_index + age, data = houses))), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  285.300      7.565  37.714    0.000
#> size_index    37.894      2.614  14.495    0.000
#> age           -0.884      0.305  -2.900    0.005
```

A tight, stable estimate of **37.894** per unit of size index. The catch is in the units: nobody can picture one unit of size index, and Anita cannot tell a client what a room is worth from this model at all. She has traded the original question for a well-measured substitute, which is a good trade when the pair is genuinely one concept, such as several survey questions measuring the same attitude, and a poor one when a client is standing in front of you asking about a wall.

=== step === tryit
::eyebrow Your turn
## Price a real decision

A client asks Anita what a 300 square foot extension containing one extra room would add to her house. That is the bundle from earlier, and it is the combination her data pins down at 44.9 thousand dollars even though neither piece of it is pinned down alone.

Write the line that computes it from the fitted `model`, using its coefficients directly.

```r
____
```
::check {"regex":"300\\s*\\*[^\\n]*\\barea\\b[^\\n]*\\+[^\\n]*\\brooms\\b","gate":true,"difficulty":"advanced","ok":"That gives 44.9, and the truth we planted is 0.12 times 300 plus 8, which is exactly 44. Anita can answer this client with confidence while still being unable to say what the room alone is worth, and those two facts are perfectly consistent.","no":"Multiply the area coefficient by 300, because the extension is 300 square feet, and add the rooms coefficient once. In code: 300 * coef(model)[\"area\"] + coef(model)[\"rooms\"]."}
::solution
```r
300 * coef(model)["area"] + coef(model)["rooms"]
#>     area
#> 44.89695
```

=== step === concept
::eyebrow Writing it down
## The sentence to hand your boss

The last skill is saying all this in a way a non-statistician can act on. Anita's report needs three things: the answer she does have, the answer she does not, and what would buy the missing one.

Here is the whole finding as a table she can paste in.

| Question | Answer from 60 houses | How sure |
|---|---|---|
| What does a 300 sq ft extension with one extra room add? | 44.9 thousand dollars | 39.1 to 50.7, solid |
| What is a year of age worth? | -0.93 thousand dollars a year | -1.5 to -0.4, solid |
| What is one extra room worth, at the same floor area? | cannot be answered from this data | -23.3 to 14.6, useless |

And the paragraph:

> Floor area and room count are 0.955 correlated across our sixty sales, so the model cannot separate their individual contributions: the variance inflation factor is 11.3, which makes the interval on each about three and a half times wider than it would otherwise be. We can price size confidently, and a 300 square foot extension with one extra room comes to 44.9 thousand dollars with an interval of 39 to 51. We cannot yet say what a room is worth on its own, and the honest interval for it runs from -23 to +15. Deleting floor area from the model would produce a tidy-looking 41.7 thousand, but that number is inflated by the floor space that comes with a room and should not be used. To answer the room question properly we need either several hundred more sales or, better, a deliberate sample of unusual layouts.

Notice what that paragraph never does. It does not call the model broken, it does not apologise, and it does not quietly delete the difficult variable to make the table look better.

=== step === quiz
::eyebrow Check yourself
## The honest write-up

Which sentence should not appear in a report about a model with a VIF of 11 on two predictors?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- We cannot separate these two predictors in this sample, so we report the combined effect and flag the individual ones as unresolved
- The interval on each of these coefficients is about three and a half times wider than it would be with independent predictors
- Room count was not statistically significant, so room count does not affect price ::ok That is the sentence to strike, and it is the most common one in real reports. Not significant here means the study could not tell, not that the effect is absent. We know the effect is real and worth 8 thousand, because we planted it, and one town in five would still have produced a negative estimate for it. The correct phrasing names the limitation instead of converting it into a finding.
- Predictions from this model are unaffected by the collinearity, so the valuation tool built on it remains reliable
- The multicollinearity means the model is invalid and the results should be disregarded ::no Two different errors are on offer here. Turning "not significant" into "no effect" invents a finding the data cannot support, while calling the whole model invalid throws away a model whose predictions are fine, whose other coefficients are clean and whose intervals are honest. Both come from treating a diagnostic as a verdict on the entire piece of work rather than a statement about how precisely two particular variables can be told apart.

=== step === concept
::eyebrow Go deeper
## References

Five places worth your time, each for a specific reason.

- [An Introduction to Statistical Learning, chapter 3 (free PDF)](https://www.statlearning.com/) - section 3.3.3 covers collinearity and the variance inflation factor with the same geometry, in a book written for people who are not statisticians.
- [O'Brien (2007), A Caution Regarding Rules of Thumb for Variance Inflation Factors](https://doi.org/10.1007/s11135-006-9018-6) - the paper to read before anyone quotes the rule of ten at you, showing how much the sensible cut-off depends on your sample size and your effect.
- [Fox and Monette (1992), Generalized Collinearity Diagnostics](https://doi.org/10.1080/01621459.1992.10475190) - where the GVIF comes from and why the third column is the one to compare with the usual thresholds.
- [The car package documentation on CRAN](https://cran.r-project.org/package=car) - the reference manual for `vif()` and the rest of the regression diagnostics in the package you used here.
- [The glmnet vignette](https://glmnet.stanford.edu/articles/glmnet.html) - the official guide to ridge and lasso in R, including how `cv.glmnet()` chooses lambda and what the resulting coefficients do and do not mean.

=== step === complete
## Part 1 complete

You started with a coefficient that said an extra room takes 4,400 dollars off a house, and you can now explain exactly how an honest model produces that, in one sentence about a third of a room of leftover information. You can measure it with a single line, translate the number into the width of your own interval, and say precisely which parts of your work it damages and which it does not touch at all.

More importantly, you know what to do next, and that the popular answer of deleting the awkward variable is the one outcome worse than the problem.

Part 2 stays with the same regression but goes after a different fault. When your rows have an order, in time or in space, the errors your model makes stop being independent of each other, which quietly makes every interval too narrow rather than too wide. It is the mirror image of what you saw today, and it is far easier to miss.
