---
title: "Mixed Effects and Longitudinal Models Lesson 3: Modeling change within a person"
slug: "Modeling-Change-Within-a-Person"
description: "Fit a growth-curve mixed model with lme4, read one person's own slope back out of it, and see why pairing beats grouping when comparing two time points."
keywords: "mixed effects model, random slope for time, growth curve model in R, lmer in R, repeated measures analysis, longitudinal data analysis, within subject versus between subject, intraclass correlation"
mathjax: true
webr: true
post_type: "LESSON"
course_id: "res-mixed"
course_title: "Mixed Effects and Longitudinal Models"
course_lesson: "3"
course_total: "7"
course_landing: "Mixed-Effects-and-Longitudinal-Models-Course.html"
course_prev: "Random-Intercepts-and-Random-Slopes"
course_next: "Reading-Variance-Components-and-the-ICC"
curriculum_id: "4.90.3"
lesson_access: "pro"
catalog_blurb: "A growth-curve model gives each person their own slope over time."
---

=== step === cover
## Modeling change within a person

Today let's look at what happens when you measure the same person again and again, and learn how to model the way each one changes over time.

Here are 18 people from a sleep-deprivation study. Each one took the same reaction-time test once a day for 10 days, so you have 180 readings in total, 10 for every person.

Here is a first, plain look: every reading against the day it was taken, with no information yet on which person it belongs to.

::widget chart-plotter {"data": [{"x":0,"y":249.6},{"x":1,"y":258.7},{"x":2,"y":250.8},{"x":3,"y":321.4},{"x":4,"y":356.9},{"x":5,"y":414.7},{"x":6,"y":382.2},{"x":7,"y":290.1},{"x":8,"y":430.6},{"x":9,"y":466.4},{"x":0,"y":222.7},{"x":1,"y":205.3},{"x":2,"y":203},{"x":3,"y":204.7},{"x":4,"y":207.7},{"x":5,"y":216},{"x":6,"y":213.6},{"x":7,"y":217.7},{"x":8,"y":224.3},{"x":9,"y":237.3},{"x":0,"y":199.1},{"x":1,"y":194.3},{"x":2,"y":234.3},{"x":3,"y":232.8},{"x":4,"y":229.3},{"x":5,"y":220.5},{"x":6,"y":235.4},{"x":7,"y":255.8},{"x":8,"y":261},{"x":9,"y":247.5},{"x":0,"y":321.5},{"x":1,"y":300.4},{"x":2,"y":283.9},{"x":3,"y":285.1},{"x":4,"y":285.8},{"x":5,"y":297.6},{"x":6,"y":280.2},{"x":7,"y":318.3},{"x":8,"y":305.3},{"x":9,"y":354},{"x":0,"y":287.6},{"x":1,"y":285},{"x":2,"y":301.8},{"x":3,"y":320.1},{"x":4,"y":316.3},{"x":5,"y":293.3},{"x":6,"y":290.1},{"x":7,"y":334.8},{"x":8,"y":293.7},{"x":9,"y":371.6},{"x":0,"y":234.9},{"x":1,"y":242.8},{"x":2,"y":273},{"x":3,"y":309.8},{"x":4,"y":317.5},{"x":5,"y":310},{"x":6,"y":454.2},{"x":7,"y":346.8},{"x":8,"y":330.3},{"x":9,"y":253.9},{"x":0,"y":283.8},{"x":1,"y":289.6},{"x":2,"y":276.8},{"x":3,"y":299.8},{"x":4,"y":297.2},{"x":5,"y":338.2},{"x":6,"y":332},{"x":7,"y":348.8},{"x":8,"y":333.4},{"x":9,"y":362},{"x":0,"y":265.5},{"x":1,"y":276.2},{"x":2,"y":243.4},{"x":3,"y":254.7},{"x":4,"y":279},{"x":5,"y":284.2},{"x":6,"y":305.5},{"x":7,"y":331.5},{"x":8,"y":335.7},{"x":9,"y":377.3},{"x":0,"y":241.6},{"x":1,"y":273.9},{"x":2,"y":254.5},{"x":3,"y":270.8},{"x":4,"y":251.5},{"x":5,"y":254.6},{"x":6,"y":245.5},{"x":7,"y":235.3},{"x":8,"y":235.8},{"x":9,"y":237.2},{"x":0,"y":312.4},{"x":1,"y":313.8},{"x":2,"y":291.6},{"x":3,"y":346.1},{"x":4,"y":365.7},{"x":5,"y":391.8},{"x":6,"y":404.3},{"x":7,"y":416.7},{"x":8,"y":455.9},{"x":9,"y":458.9},{"x":0,"y":236.1},{"x":1,"y":230.3},{"x":2,"y":238.9},{"x":3,"y":254.9},{"x":4,"y":250.7},{"x":5,"y":269.8},{"x":6,"y":281.6},{"x":7,"y":308.1},{"x":8,"y":336.3},{"x":9,"y":351.6},{"x":0,"y":256.3},{"x":1,"y":243.5},{"x":2,"y":256.2},{"x":3,"y":255.5},{"x":4,"y":268.9},{"x":5,"y":329.7},{"x":6,"y":379.4},{"x":7,"y":362.9},{"x":8,"y":394.5},{"x":9,"y":389.1},{"x":0,"y":250.5},{"x":1,"y":300.1},{"x":2,"y":269.9},{"x":3,"y":280.6},{"x":4,"y":271.8},{"x":5,"y":304.6},{"x":6,"y":287.7},{"x":7,"y":266.6},{"x":8,"y":321.5},{"x":9,"y":347.6},{"x":0,"y":221.7},{"x":1,"y":298.2},{"x":2,"y":326.9},{"x":3,"y":346.9},{"x":4,"y":348.7},{"x":5,"y":352.8},{"x":6,"y":354.4},{"x":7,"y":360.4},{"x":8,"y":375.6},{"x":9,"y":388.5},{"x":0,"y":271.9},{"x":1,"y":268.4},{"x":2,"y":257.2},{"x":3,"y":277.7},{"x":4,"y":314.8},{"x":5,"y":317.2},{"x":6,"y":298.1},{"x":7,"y":348.1},{"x":8,"y":340.3},{"x":9,"y":366.5},{"x":0,"y":225.3},{"x":1,"y":234.5},{"x":2,"y":238.9},{"x":3,"y":240.5},{"x":4,"y":267.5},{"x":5,"y":344.2},{"x":6,"y":281.1},{"x":7,"y":347.6},{"x":8,"y":365.2},{"x":9,"y":372.2},{"x":0,"y":269.9},{"x":1,"y":272.4},{"x":2,"y":277.9},{"x":3,"y":281.8},{"x":4,"y":279.2},{"x":5,"y":284.5},{"x":6,"y":259.3},{"x":7,"y":304.6},{"x":8,"y":350.8},{"x":9,"y":369.5},{"x":0,"y":269.4},{"x":1,"y":273.5},{"x":2,"y":297.6},{"x":3,"y":310.6},{"x":4,"y":287.2},{"x":5,"y":329.6},{"x":6,"y":334.5},{"x":7,"y":343.2},{"x":8,"y":369.1},{"x":9,"y":364.1}], "geoms": ["point"], "x": "Days", "y": "Reaction", "code": {}}

Scattered like that, you can see reaction times climbing a little overall, but nothing about who is driving that climb. Now add back which reading belongs to which person, and draw one line per person instead of one blob of points.

```r
# Plot every subject's reaction time across the 10 days of sleep deprivation
library(lme4)
library(ggplot2)
sleepstudy <- lme4::sleepstudy

ggplot(sleepstudy, aes(x = Days, y = Reaction, group = Subject)) +
  geom_line(color = "steelblue", alpha = 0.6) +
  labs(x = "Day of sleep deprivation", y = "Reaction time (ms)")
```

The lines do not stay side by side. They fan out as the days go on, some climbing fast and some barely moving at all.

=== step === concept
## Ten days, eighteen people, one test of reaction time

This data looks different from the usual compare-two-groups setup. There is no control group and no treatment group here. Instead, the same 18 people are measured again and again, once a day for 10 days, so every person contributes 10 rows instead of one.

That repetition matters. In an ordinary dataset, each row usually belongs to a different, unrelated person. Here, 10 of the 180 rows all belong to the same person, so they are not independent of each other: a person who reacts slowly on day 0 will likely also react slowly on day 3, simply because it is the same brain and the same body being tested each time.

This kind of data has a name. It is called repeated measures, or longitudinal data when the repeats are spread out over time. The grouping factor, the thing the rows cluster around, is the person, called Subject in this data. And the number everyone eventually wants is each person's own rate of change per day, not just their average reaction time.

Look at the data's shape, then compare the first day against the last.

```r
# Check the data's shape, then compare day 0 with day 9
str(sleepstudy)

day0 <- subset(sleepstudy, Days == 0)
day9 <- subset(sleepstudy, Days == 9)

round(c(day0_mean = mean(day0$Reaction), day0_sd = sd(day0$Reaction),
        day9_mean = mean(day9$Reaction), day9_sd = sd(day9$Reaction)), 2)
#> 'data.frame':	180 obs. of  3 variables:
#>  $ Reaction: num  250 259 251 321 357 ...
#>  $ Days    : num  0 1 2 3 4 5 6 7 8 9 ...
#>  $ Subject : Factor w/ 18 levels "308","309","310",..: 1 1 1 1 1 1 1 1 1 1 ...
#> day0_mean   day0_sd day9_mean   day9_sd 
#>    256.65     32.13    350.85     66.99
```

180 rows, 3 variables, confirmed: a Reaction time in milliseconds, a Days count from 0 to 9, and a Subject label with 18 levels, one per person.

Day 0 looks tight: everyone sits close to the mean of 256.65 ms, with a standard deviation of 32.13 ms. By day 9, the mean has climbed to 350.85 ms, and the spread has more than doubled to 66.99 ms. Everyone got slower on average, but some far more than others, and that second part is exactly what an ordinary average cannot tell you.

=== step === concept
## Why one pooled line cannot be anyone's line

If everyone slowed down by a different amount, a single line fitted to all 180 rows together can only describe the average person, not any real one. Check that by fitting a separate line to each person instead.

```r
# Fit a separate OLS line to each of the 18 subjects
subj_slopes <- sort(sapply(levels(sleepstudy$Subject), function(s) {
  coef(lm(Reaction ~ Days, sleepstudy[sleepstudy$Subject == s, ]))[["Days"]]
}))
round(subj_slopes, 2)
cat("range:", round(min(subj_slopes), 2), "to", round(max(subj_slopes), 2),
    "| average:", round(mean(subj_slopes), 2),
    "| negative:", sum(subj_slopes < 0), "of 18\n")
#>   335   309   330   331   310   351   333   371   332   372   369   334   349 
#> -2.88  2.26  3.01  5.27  6.11  6.43  9.14  9.19  9.57 11.30 11.35 12.25 13.49 
#>   352   370   337   350   308 
#> 13.57 18.06 19.03 19.50 21.76 
#> range: -2.88 to 21.76 | average: 10.47 | negative: 1 of 18
```

Fit an ordinary least squares line, Reaction against Days, separately for each of the 18 people, then sort their slopes from smallest to largest. 17 of the 18 slopes come back positive, so most people really do get slower each day. The one exception, subject 335, comes back slightly negative at -2.88 ms a day. At the other end, subject 308 slows down by 21.76 ms every day, just over double the average of 10.47.

So a single pooled line, one slope for everyone, would describe none of these 18 people well. It would badly understate subject 308, and it would get the direction wrong for subject 335.

=== step === widget
## Watching the gap between people widen with every day

See that growing gap directly: one chart with all 18 lines together, next to 18 separate small panels of the same data.

::widget facet-grid {"data": [{"x":0,"y":249.6,"facet":"308"},{"x":1,"y":258.7,"facet":"308"},{"x":2,"y":250.8,"facet":"308"},{"x":3,"y":321.4,"facet":"308"},{"x":4,"y":356.9,"facet":"308"},{"x":5,"y":414.7,"facet":"308"},{"x":6,"y":382.2,"facet":"308"},{"x":7,"y":290.1,"facet":"308"},{"x":8,"y":430.6,"facet":"308"},{"x":9,"y":466.4,"facet":"308"},{"x":0,"y":222.7,"facet":"309"},{"x":1,"y":205.3,"facet":"309"},{"x":2,"y":203,"facet":"309"},{"x":3,"y":204.7,"facet":"309"},{"x":4,"y":207.7,"facet":"309"},{"x":5,"y":216,"facet":"309"},{"x":6,"y":213.6,"facet":"309"},{"x":7,"y":217.7,"facet":"309"},{"x":8,"y":224.3,"facet":"309"},{"x":9,"y":237.3,"facet":"309"},{"x":0,"y":199.1,"facet":"310"},{"x":1,"y":194.3,"facet":"310"},{"x":2,"y":234.3,"facet":"310"},{"x":3,"y":232.8,"facet":"310"},{"x":4,"y":229.3,"facet":"310"},{"x":5,"y":220.5,"facet":"310"},{"x":6,"y":235.4,"facet":"310"},{"x":7,"y":255.8,"facet":"310"},{"x":8,"y":261,"facet":"310"},{"x":9,"y":247.5,"facet":"310"},{"x":0,"y":321.5,"facet":"330"},{"x":1,"y":300.4,"facet":"330"},{"x":2,"y":283.9,"facet":"330"},{"x":3,"y":285.1,"facet":"330"},{"x":4,"y":285.8,"facet":"330"},{"x":5,"y":297.6,"facet":"330"},{"x":6,"y":280.2,"facet":"330"},{"x":7,"y":318.3,"facet":"330"},{"x":8,"y":305.3,"facet":"330"},{"x":9,"y":354,"facet":"330"},{"x":0,"y":287.6,"facet":"331"},{"x":1,"y":285,"facet":"331"},{"x":2,"y":301.8,"facet":"331"},{"x":3,"y":320.1,"facet":"331"},{"x":4,"y":316.3,"facet":"331"},{"x":5,"y":293.3,"facet":"331"},{"x":6,"y":290.1,"facet":"331"},{"x":7,"y":334.8,"facet":"331"},{"x":8,"y":293.7,"facet":"331"},{"x":9,"y":371.6,"facet":"331"},{"x":0,"y":234.9,"facet":"332"},{"x":1,"y":242.8,"facet":"332"},{"x":2,"y":273,"facet":"332"},{"x":3,"y":309.8,"facet":"332"},{"x":4,"y":317.5,"facet":"332"},{"x":5,"y":310,"facet":"332"},{"x":6,"y":454.2,"facet":"332"},{"x":7,"y":346.8,"facet":"332"},{"x":8,"y":330.3,"facet":"332"},{"x":9,"y":253.9,"facet":"332"},{"x":0,"y":283.8,"facet":"333"},{"x":1,"y":289.6,"facet":"333"},{"x":2,"y":276.8,"facet":"333"},{"x":3,"y":299.8,"facet":"333"},{"x":4,"y":297.2,"facet":"333"},{"x":5,"y":338.2,"facet":"333"},{"x":6,"y":332,"facet":"333"},{"x":7,"y":348.8,"facet":"333"},{"x":8,"y":333.4,"facet":"333"},{"x":9,"y":362,"facet":"333"},{"x":0,"y":265.5,"facet":"334"},{"x":1,"y":276.2,"facet":"334"},{"x":2,"y":243.4,"facet":"334"},{"x":3,"y":254.7,"facet":"334"},{"x":4,"y":279,"facet":"334"},{"x":5,"y":284.2,"facet":"334"},{"x":6,"y":305.5,"facet":"334"},{"x":7,"y":331.5,"facet":"334"},{"x":8,"y":335.7,"facet":"334"},{"x":9,"y":377.3,"facet":"334"},{"x":0,"y":241.6,"facet":"335"},{"x":1,"y":273.9,"facet":"335"},{"x":2,"y":254.5,"facet":"335"},{"x":3,"y":270.8,"facet":"335"},{"x":4,"y":251.5,"facet":"335"},{"x":5,"y":254.6,"facet":"335"},{"x":6,"y":245.5,"facet":"335"},{"x":7,"y":235.3,"facet":"335"},{"x":8,"y":235.8,"facet":"335"},{"x":9,"y":237.2,"facet":"335"},{"x":0,"y":312.4,"facet":"337"},{"x":1,"y":313.8,"facet":"337"},{"x":2,"y":291.6,"facet":"337"},{"x":3,"y":346.1,"facet":"337"},{"x":4,"y":365.7,"facet":"337"},{"x":5,"y":391.8,"facet":"337"},{"x":6,"y":404.3,"facet":"337"},{"x":7,"y":416.7,"facet":"337"},{"x":8,"y":455.9,"facet":"337"},{"x":9,"y":458.9,"facet":"337"},{"x":0,"y":236.1,"facet":"349"},{"x":1,"y":230.3,"facet":"349"},{"x":2,"y":238.9,"facet":"349"},{"x":3,"y":254.9,"facet":"349"},{"x":4,"y":250.7,"facet":"349"},{"x":5,"y":269.8,"facet":"349"},{"x":6,"y":281.6,"facet":"349"},{"x":7,"y":308.1,"facet":"349"},{"x":8,"y":336.3,"facet":"349"},{"x":9,"y":351.6,"facet":"349"},{"x":0,"y":256.3,"facet":"350"},{"x":1,"y":243.5,"facet":"350"},{"x":2,"y":256.2,"facet":"350"},{"x":3,"y":255.5,"facet":"350"},{"x":4,"y":268.9,"facet":"350"},{"x":5,"y":329.7,"facet":"350"},{"x":6,"y":379.4,"facet":"350"},{"x":7,"y":362.9,"facet":"350"},{"x":8,"y":394.5,"facet":"350"},{"x":9,"y":389.1,"facet":"350"},{"x":0,"y":250.5,"facet":"351"},{"x":1,"y":300.1,"facet":"351"},{"x":2,"y":269.9,"facet":"351"},{"x":3,"y":280.6,"facet":"351"},{"x":4,"y":271.8,"facet":"351"},{"x":5,"y":304.6,"facet":"351"},{"x":6,"y":287.7,"facet":"351"},{"x":7,"y":266.6,"facet":"351"},{"x":8,"y":321.5,"facet":"351"},{"x":9,"y":347.6,"facet":"351"},{"x":0,"y":221.7,"facet":"352"},{"x":1,"y":298.2,"facet":"352"},{"x":2,"y":326.9,"facet":"352"},{"x":3,"y":346.9,"facet":"352"},{"x":4,"y":348.7,"facet":"352"},{"x":5,"y":352.8,"facet":"352"},{"x":6,"y":354.4,"facet":"352"},{"x":7,"y":360.4,"facet":"352"},{"x":8,"y":375.6,"facet":"352"},{"x":9,"y":388.5,"facet":"352"},{"x":0,"y":271.9,"facet":"369"},{"x":1,"y":268.4,"facet":"369"},{"x":2,"y":257.2,"facet":"369"},{"x":3,"y":277.7,"facet":"369"},{"x":4,"y":314.8,"facet":"369"},{"x":5,"y":317.2,"facet":"369"},{"x":6,"y":298.1,"facet":"369"},{"x":7,"y":348.1,"facet":"369"},{"x":8,"y":340.3,"facet":"369"},{"x":9,"y":366.5,"facet":"369"},{"x":0,"y":225.3,"facet":"370"},{"x":1,"y":234.5,"facet":"370"},{"x":2,"y":238.9,"facet":"370"},{"x":3,"y":240.5,"facet":"370"},{"x":4,"y":267.5,"facet":"370"},{"x":5,"y":344.2,"facet":"370"},{"x":6,"y":281.1,"facet":"370"},{"x":7,"y":347.6,"facet":"370"},{"x":8,"y":365.2,"facet":"370"},{"x":9,"y":372.2,"facet":"370"},{"x":0,"y":269.9,"facet":"371"},{"x":1,"y":272.4,"facet":"371"},{"x":2,"y":277.9,"facet":"371"},{"x":3,"y":281.8,"facet":"371"},{"x":4,"y":279.2,"facet":"371"},{"x":5,"y":284.5,"facet":"371"},{"x":6,"y":259.3,"facet":"371"},{"x":7,"y":304.6,"facet":"371"},{"x":8,"y":350.8,"facet":"371"},{"x":9,"y":369.5,"facet":"371"},{"x":0,"y":269.4,"facet":"372"},{"x":1,"y":273.5,"facet":"372"},{"x":2,"y":297.6,"facet":"372"},{"x":3,"y":310.6,"facet":"372"},{"x":4,"y":287.2,"facet":"372"},{"x":5,"y":329.6,"facet":"372"},{"x":6,"y":334.5,"facet":"372"},{"x":7,"y":343.2,"facet":"372"},{"x":8,"y":369.1,"facet":"372"},{"x":9,"y":364.1,"facet":"372"}], "geom": "line", "x": "Days", "y": "Reaction", "facetVar": "Subject"}

Switch to the small-panel view and each person gets their own chart, which makes the different slopes much easier to see one at a time.

A model that only lets each person start at a different point, called a random intercept, keeps every person's line parallel to the population line: same slope, different starting height. That alone could explain a gap that stays the same width over time, but it cannot explain a gap that keeps growing, from 32.13 ms at day 0 to 66.99 ms at day 9. Only letting the slope itself vary from person to person can do that.

=== step === quiz
## Quick check: what a widening gap says about the slopes

The chart above showed the spread between the 18 people growing from a standard deviation of 32.13 ms at day 0 to 66.99 ms at day 9. What does that growth actually tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It only means some of the 18 people started out faster or slower than others on day 0, nothing more. ::no
- Each of the 18 people has their own rate of change over the 10 days, and those rates genuinely differ from each other, not just where they started. ::ok Right. A spread that only reflected different starting points would stay the same width at every day. Here it grows from 32.13 ms to 66.99 ms, so the people are pulling apart as the days pass, which only happens if their own rates of change differ.
- It means the average reaction time across all 18 people increased over the 10 days. ::no
- It means the random intercept in the model needs to be bigger to fit the data. ::no Not quite. The average reaction time did rise, and the random intercept does let each person start at a different point, but neither one explains a spread that keeps growing. Only differing personal rates of change, one person speeding up faster than another, can widen the gap day after day.

=== step === concept
## The growth curve model: a random slope for time, not just a random intercept

Write the model down before fitting it, so every number lmer() hands back already has a meaning waiting for it.

\[ \text{Reaction}_{ij} = (\beta_0 + u_{0i}) + (\beta_1 + u_{1i}) \times \text{Days}_{ij} + e_{ij} \]

Read the subscripts as day j for subject i. \(\beta_0\) and \(\beta_1\) are the fixed effects, the population-average intercept and slope shared by everyone. \(u_{0i}\) and \(u_{1i}\) are subject i's own deviations from those two fixed numbers, one pair per subject, drawn from a distribution whose variance is exactly what lmer() estimates. \(e_{ij}\) is what is left over once both the fixed and random parts are accounted for, the residual.

Fit that model with lmer(), using (Days | Subject) to ask for a random slope and a random intercept together.

```r
# Fit the growth-curve model: a random intercept and a random slope for Days
m <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
summary(m)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (Days | Subject)
#>    Data: sleepstudy
#> 
#> REML criterion at convergence: 1743.6
#> 
#> Scaled residuals: 
#>     Min      1Q  Median      3Q     Max 
#> -3.9536 -0.4634  0.0231  0.4634  5.1793 
#> 
#> Random effects:
#>  Groups   Name        Variance Std.Dev. Corr 
#>  Subject  (Intercept) 612.10   24.741        
#>           Days         35.07    5.922   0.07 
#>  Residual             654.94   25.592        
#> Number of obs: 180, groups:  Subject, 18
#> 
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)  251.405      6.825  36.838
#> Days          10.467      1.546   6.771
#> 
#> Correlation of Fixed Effects:
#>      (Intr)
#> Days -0.138
```

```r
# Read the variance components on their own, with no fixed-effect table around them
VarCorr(m)
#>  Groups   Name        Std.Dev. Corr  
#>  Subject  (Intercept) 24.7407        
#>           Days         5.9221  0.066 
#>  Residual             25.5918
```

Start with the Fixed effects table. The fixed intercept is 251.41 ms and the fixed slope is 10.47 ms a day, almost exactly the 10.47 average you got a moment ago from fitting 18 separate lines. That is not a coincidence: with every subject measured on the same 10 days, lmer's population slope lands very close to the plain average of the per-subject slopes.

Now the Random effects table, repeated more cleanly by VarCorr(). It reports three variances: 612.10 for the intercept, meaning how much subjects differ from each other in where they start; 35.07 for the slope, meaning how much subjects differ from each other in their own rate of change; and 654.94 for the residual, the leftover noise inside a single person's own readings once their line is subtracted. The Corr column next to the random effects, about 0.07, says the intercept and the slope barely relate to each other: starting fast or slow tells you almost nothing about how quickly a person will decline.

Look at the Random effects block for that 0.07. The separate line below it, Correlation of Fixed Effects, -0.138, is a different number: it describes the estimated intercept and slope themselves, not the subjects, and this lesson does not need it.

=== step === concept
## Reading one person's own line back out of the model

The model does not throw away each person's own line once it estimates the population average. Pull subject 308 and subject 335's own fitted lines back out, and compare them with the separate-regression slopes from a few steps back.

```r
# Read subject 308 and subject 335's own fitted line out of the model
round(coef(m)$Subject[c("308", "335"), ], 2)
cat("subject 308 - mixed model:", round(coef(m)$Subject["308", "Days"], 2),
    " separate regression:", round(subj_slopes["308"], 2), "\n")
cat("subject 335 - mixed model:", round(coef(m)$Subject["335", "Days"], 2),
    " separate regression:", round(subj_slopes["335"], 2), "\n")
#>     (Intercept)  Days
#> 308      253.66 19.67
#> 335      251.07 -0.28
#> subject 308 - mixed model: 19.67  separate regression: 21.76 
#> subject 335 - mixed model: -0.28  separate regression: -2.88
```

coef() gives each subject their own intercept and slope, fixed effect plus that subject's own random deviation added back in. Subject 308's own slope comes out at 19.67 ms a day, nearly double the population's 10.47. Subject 335's comes out at -0.28, essentially flat.

Notice both numbers moved a little from their separate-regression values: 21.76 became 19.67, and -2.88 became -0.28. Both were pulled slightly toward the population slope of 10.47. That pull is the model borrowing a little information from the other 17 subjects, trading away a bit of each person's own signal for a more stable estimate.

=== step === concept
## The trap: a population slope describing no one in particular

Here is exactly how costly it would be to apply the population slope to one specific person instead of reading that person's own line.

```r
# Predict subject 335's day 9 reading using only the population slope
fixefs <- fixef(m)
pop_slope <- fixefs[["Days"]]

s335 <- subset(sleepstudy, Subject == "335")
day0_335 <- s335$Reaction[s335$Days == 0]
day9_335 <- s335$Reaction[s335$Days == 9]

predicted_335 <- day0_335 + pop_slope * 9

round(c(day0 = day0_335, actual_day9 = day9_335, predicted_day9 = predicted_335,
        overprediction = predicted_335 - day9_335), 1)
#>           day0    actual_day9 predicted_day9 overprediction 
#>          241.6          237.2          335.8           98.6
```

Subject 335 starts day 0 at 241.6 ms. Add the population slope of 10.47 ms a day for 9 days, and the prediction comes to 335.8 ms on day 9. The actual day 9 reading is 237.2 ms, almost unchanged from day 0.

That is an overprediction of about 99 ms, and the reason is simple: subject 335's own slope is near zero, while the population slope says everyone gains about 10.47 ms a day. A fixed effect is an average over 18 people. It was never a promise about any one of them, and subject 335 is the clearest proof of that in this data.

=== step === widget
## The same person, twice: what day 0 says about day 9

Look at the relationship between each person's two readings directly: their day 0 score plotted against their own day 9 score.

::widget chart-plotter {"data": [{"x":249.6,"y":466.4},{"x":222.7,"y":237.3},{"x":199.1,"y":247.5},{"x":321.5,"y":354},{"x":287.6,"y":371.6},{"x":234.9,"y":253.9},{"x":283.8,"y":362},{"x":265.5,"y":377.3},{"x":241.6,"y":237.2},{"x":312.4,"y":458.9},{"x":236.1,"y":351.6},{"x":256.3,"y":389.1},{"x":250.5,"y":347.6},{"x":221.7,"y":388.5},{"x":271.9,"y":366.5},{"x":225.3,"y":372.2},{"x":269.9,"y":369.5},{"x":269.4,"y":364.1}], "geoms": ["point"], "x": "Day0", "y": "Day9", "code": {}}

Each of the 18 points is one person: their reaction time on day 0 against their reaction time on day 9. The Pearson correlation shown on the chart works out to about 0.516, a real, positive relationship. People who started relatively fast tend to still be on the faster side by day 9, though the relationship is far from perfect.

=== step === concept
## Why comparing the same person twice beats comparing two different people

Turn that correlation into something practical. Compare day 0 against day 9 two different ways on these same 18 people, and see which way is more precise.

```r
# Build one row per subject: their day 0 reading next to their day 9 reading
day_pairs <- data.frame(
  Subject = day0$Subject,
  Day0 = day0$Reaction,
  Day9 = day9$Reaction[match(day0$Subject, day9$Subject)]
)
day_pairs
#>    Subject     Day0     Day9
#> 1      308 249.5600 466.3535
#> 2      309 222.7339 237.3142
#> 3      310 199.0539 247.5153
#> 4      330 321.5426 354.0487
#> 5      331 287.6079 371.5811
#> 6      332 234.8606 253.8644
#> 7      333 283.8424 362.0428
#> 8      334 265.4731 377.2990
#> 9      335 241.6083 237.2466
#> 10     337 312.3666 458.9167
#> 11     349 236.1032 351.6451
#> 12     350 256.2968 389.0527
#> 13     351 250.5265 347.5655
#> 14     352 221.6771 388.5417
#> 15     369 271.9235 366.5131
#> 16     370 225.2640 372.2288
#> 17     371 269.8804 369.4692
#> 18     372 269.4117 364.1236
```

```r
# Compare the day 0 vs day 9 gap as paired data, then as two unrelated groups of 18
diffs <- day_pairs$Day9 - day_pairs$Day0
n <- nrow(day_pairs)

se_paired <- sd(diffs) / sqrt(n)
se_unpaired <- sqrt(var(day_pairs$Day0) / n + var(day_pairs$Day9) / n)

cat("correlation:", round(cor(day_pairs$Day0, day_pairs$Day9), 3), "\n")
cat("se_paired  :", round(se_paired, 2), "\n")
cat("se_unpaired:", round(se_unpaired, 2), "\n")
#> correlation: 0.516 
#> se_paired  : 13.54 
#> se_unpaired: 17.51
```

The paired standard error, 13.54, treats these as 18 before-and-after differences from the same 18 people. The unpaired standard error, 17.51, pretends day 0 and day 9 came from two different, unrelated groups of 18 people each, even though they are the same 18 people.

The paired version is smaller, and the 0.516 correlation from the widget is exactly why. When a person's two readings move together, subtracting one from the other cancels out the part of their variability that is shared across both readings, the part that makes that person consistently faster or slower than average. An unpaired comparison cannot cancel that out, because it never pairs each person against themselves in the first place. That is the whole reason a within-subject comparison needs fewer people to reach the same precision as a between-subject one.

=== step === quiz
## Quick check: population slope, individual trajectory

Suppose a different growth-curve model, fitted the same way on a new sample, reports a fixed-effect slope of -1.2 units a day, a between-subject slope variance of 4.0, and a residual variance of 9.0. One specific person's own fitted slope, read separately from coef(), comes back at +0.3 a day. Which conclusion is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- The model must be wrong, since a personal slope cannot run in the opposite direction from the fixed-effect slope. ::no
- The fixed-effect slope describes the population average rate of change. The rate for any one person, read separately from coef(), can differ from it and even run the opposite direction, the same trap this lesson showed for subject 335. ::ok Right. A fixed effect is an average across all the groups, not a forecast for any one of them. The function coef() gives the line for one specific person, and that line can disagree with the population line exactly the way it did for subject 335.
- Comparing the first and last reading for this person will have a larger standard error than comparing it against a single reading from a different person, because pairing removes useful information. ::no
- Since the between-subject slope variance is smaller than the residual variance, individual rates of change barely differ from the population average. ::no Not quite. A fixed-effect slope is a population average, not a ceiling on how far any one rate of change can run, so the safe way to read a specific trajectory is from coef(), never from the fixed effect alone. The two variance components answer a different question, how much subjects vary from each other, not how precise one slope estimate is, and pairing a person against themselves lowers the standard error because the two readings are correlated, it does not raise it.

=== step === tryit
## Your turn: compute the within versus between-subject standard error

The same pairing trick works on any two days in this data, not only day 0 and day 9. Build the equivalent table for day 1 and day 8.

```r
# Build day_pairs2 the same way day_pairs was built, but for days 1 and 8
day1 <- subset(sleepstudy, Days == 1)
day8 <- subset(sleepstudy, Days == 8)

day_pairs2 <- data.frame(
  Subject = day1$Subject,
  Day1 = day1$Reaction,
  Day8 = day8$Reaction[match(day1$Subject, day8$Subject)]
)
day_pairs2
#>    Subject     Day1     Day8
#> 1      308 258.7047 430.5853
#> 2      309 205.2658 224.2957
#> 3      310 194.3322 261.0125
#> 4      330 300.4002 305.3495
#> 5      331 285.0000 293.7469
#> 6      332 242.8118 330.3003
#> 7      333 289.5550 333.3600
#> 8      334 276.2012 335.7469
#> 9      335 273.9472 235.7541
#> 10     337 313.8058 455.8643
#> 11     349 230.3167 336.2806
#> 12     350 243.4543 394.4872
#> 13     351 300.0576 321.5418
#> 14     352 298.1939 375.6406
#> 15     369 268.4369 340.2800
#> 16     370 234.5235 365.1630
#> 17     371 272.4428 350.7807
#> 18     372 273.4740 369.1417
```

day_pairs2 holds the day 1 and day 8 readings for all 18 subjects, built the same way as day_pairs.

```r
# Compute the paired standard error: the standard deviation of the Day8
# minus Day1 differences, divided by the square root of 18.
# Then compute the unpaired standard error: the square root of
# (the variance of Day1 over 18) plus (the variance of Day8 over 18).
# Two lines. Press Check when you have them.
```
::check {"regex": "sd[(][^)]*day_pairs2[^)]*[)]\\s*/\\s*sqrt[(]", "gate": true, "difficulty": "intermediate", "ok": "Right. For this new pair, the paired standard error comes out lower than the unpaired one, about 13.23 ms against 16.23 ms, the same ordering seen for day 0 against day 9. How much lower depends on how strongly the two days correlate, 0.395 here against 0.516 earlier, but pairing beats grouping either way.", "no": "Build the paired standard error the same way as the previous step: the standard deviation of the Day8 minus Day1 differences, divided by the square root of 18. Then the unpaired version: the square root of (the variance of Day1 over 18) plus (the variance of Day8 over 18)."}
::solution
```r
# Paired standard error, then unpaired standard error, for day 1 vs day 8
sd(day_pairs2$Day8 - day_pairs2$Day1) / sqrt(nrow(day_pairs2))
#> [1] 13.23093
sqrt(var(day_pairs2$Day1) / nrow(day_pairs2) + var(day_pairs2$Day8) / nrow(day_pairs2))
#> [1] 16.23028
```

The ordering holds again: 13.23 paired against 16.23 unpaired. The gap is a little smaller than it was for day 0 against day 9, because day 1 and day 8 correlate a little less strongly, 0.395 rather than 0.516. The design still belongs to the same family either way: it compares the same 18 people at two points in time, so it is a within-subject, paired comparison, not a between-subject one.

=== step === concept
## References

- [Fitting Linear Mixed-Effects Models Using lme4](https://doi.org/10.18637/jss.v067.i01) - Bates, Maechler, Bolker and Walker (2015), Journal of Statistical Software, 67(1). The paper behind the lmer() function used throughout this lesson.
- [Patterns of performance degradation and restoration during sleep restriction and subsequent recovery: a sleep dose-response study](https://doi.org/10.1046/j.1365-2869.2003.00337.x) - Belenky and colleagues (2003), Journal of Sleep Research, 12(1), 1-12. The study behind the sleepstudy data used in this lesson.
- [Mixed-Effects Models in S and S-PLUS](https://doi.org/10.1007/b98882) - Pinheiro and Bates (2000), Springer. The reference text on how these models are fitted and read.
- [Data Analysis Using Regression and Multilevel/Hierarchical Models](https://doi.org/10.1017/CBO9780511790942) - Gelman and Hill (2007), Cambridge University Press. A wider treatment of random effects beyond the growth-curve case covered here.
- [Linear Mixed Models: A Practical Guide Using Statistical Software](https://websites.umich.edu/~bwest/almmussp.html) - West, Welch and Galecki (2014), CRC Press. A practical, software-first walkthrough of the same model family.

=== step === complete
## What you can now read off a growth-curve model

You took 18 people, measured 10 times each, and fitted a model that gives every one of them their own intercept and their own slope, not just the population's.

The fixed effects, 251.41 ms and 10.47 ms a day, describe the average person in this study. Subject 308 and subject 335 showed why that average cannot be read onto a specific person: one declines at nearly double the population rate, and the other barely declines at all. And the 0.516 correlation between a person's own day 0 and day 9 readings is why comparing someone against themselves, rather than against a different group of people, gives you a smaller standard error for the same 18 people.

The next part of this course opens up the variance components you printed with VarCorr() today, 612.10, 35.07 and 654.94, and turns them into a single number worth reading on its own.
