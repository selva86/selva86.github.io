---
title: "ANOVA and Multiple Comparisons Lesson 2: Two factors and their combined effect"
catalog_blurb: "Why adding a real second factor can make your first factor's test more sensitive."
description: "A two-way ANOVA on checkout button designs and traffic sources, built by hand: main effects, the sums-of-squares table, and why Type I and Type II disagree."
keywords: "two-way ANOVA, main effect, marginal means, grand mean, sums of squares, degrees of freedom, blocking factor, Type I sums of squares, Type II sums of squares, car::Anova, R"
post_type: "LESSON"
curriculum_id: "4.50.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "2"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: "When-an-Effect-Depends-on-Another.html"
course_prev: "Comparing-Several-Groups-at-Once.html"
---

=== step === cover
## Two factors and their combined effect

Today let's understand what happens when two things are changing at once in the same experiment, and how to tell which one is actually responsible for a result.

A growth team at an online retailer is testing three checkout button designs: Control, Bigger button, and Urgency text. At the same time, every visitor who sees one of those designs also arrives from one of four traffic sources: Organic, Paid search, Email, or Social. Instead of testing the button alone, the team ran all twelve design-source combinations, one week each, and recorded that week's conversion rate, the percent of visitors who completed checkout.

Here are all twelve weeks, plotted together first and then split into one small chart per traffic source.

::widget facet-grid {"data":[{"x":"Control","y":2.43,"facet":"Organic"},{"x":"Control","y":3.53,"facet":"Paid search"},{"x":"Control","y":5.93,"facet":"Email"},{"x":"Control","y":1.43,"facet":"Social"},{"x":"Bigger button","y":2.28,"facet":"Organic"},{"x":"Bigger button","y":3.78,"facet":"Paid search"},{"x":"Bigger button","y":6.38,"facet":"Email"},{"x":"Bigger button","y":1.48,"facet":"Social"},{"x":"Urgency text","y":2.49,"facet":"Organic"},{"x":"Urgency text","y":4.39,"facet":"Paid search"},{"x":"Urgency text","y":7.19,"facet":"Email"},{"x":"Urgency text","y":1.89,"facet":"Social"}],"geom":"bar","x":"design","y":"conversion rate","facetVar":"source"}

Flip the toggle. In the combined chart, the three designs sit close together inside every traffic source. Once each source gets its own small chart, Urgency text turns out to sit above the other two designs in every single one of them.

=== step === concept
## One factor alone says the three designs tie, and why

Let's bring that same data into R and see what a plain test on design alone says, before source enters the picture at all.

Build the data exactly as recorded, then compare the three designs' own average conversion rate against the grand average of all twelve weeks, and against the four sources' own averages too.

```r
# Compute the one-way test on design alone, plus each factor's own average
checkout <- data.frame(
  design = factor(c(rep("Control", 4), rep("Bigger button", 4), rep("Urgency text", 4)),
                   levels = c("Control", "Bigger button", "Urgency text")),
  source = factor(rep(c("Organic", "Paid search", "Email", "Social"), 3),
                   levels = c("Organic", "Paid search", "Email", "Social")),
  conversion = c(2.43, 3.53, 5.93, 1.43,
                 2.28, 3.78, 6.38, 1.48,
                 2.49, 4.39, 7.19, 1.89)
)

mean(checkout$conversion)
#> [1] 3.6

tapply(checkout$conversion, checkout$design, mean)
#>       Control Bigger button  Urgency text 
#>          3.33          3.48          3.99 

tapply(checkout$conversion, checkout$source, mean)
#>     Organic Paid search       Email      Social 
#>         2.4         3.9         6.5         1.6 

summary(aov(conversion ~ design, data = checkout))
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> design       2   0.96   0.479   0.102  0.904
#> Residuals    9  42.22   4.691               
```

"conversion" is each week's percent of visitors who checked out, and "design" has three factor levels: the three button designs under test.

Read the two `tapply()` lines first. The grand mean, the average of all twelve weeks regardless of design or source, is 3.6. The three designs sit at 3.33, 3.48 and 3.99, a spread of only 0.66 points, all close to each other and close to the grand mean.

The four sources tell a completely different story. They run from 1.6 (Social) up to 6.5 (Email), a spread of 4.9 points, more than seven times design's own spread.

`aov(conversion ~ design)` fits a one-way test using design alone, and the result, F = 0.102 on 2 and 9 degrees of freedom, p = 0.904, says the three designs look statistically identical. By this test alone, you would call it a toss-up and ship whichever design you liked.

That conclusion is wrong, and the Residuals row shows why. A one-way model only knows about design. Every bit of variation it cannot explain, including the huge swing between sources, gets dumped into that one residual term. Source here is what statisticians call a blocking factor: a factor whose own effect on the outcome is real, often large, but is not the thing the test is actually asking about. Left unnamed, its variation still has to go somewhere, and it inflates the very residual that design's small signal is being measured against.

=== step === widget
## Main effects as distances from the grand mean

A main effect is how far one level of a factor pulls the result away from the grand mean, considered entirely on its own: a design's main effect is its own row mean minus the grand mean, and a source's main effect is its own column mean minus the grand mean.

The table below lays out all twelve design-source combinations, plus every row mean, column mean, and the grand mean they are all measured against.

::widget styled-table {"cols":["design","Organic","Paid search","Email","Social","Row mean"],"rows":[["Control",2.43,3.53,5.93,1.43,3.33],["Bigger button",2.28,3.78,6.38,1.48,3.48],["Urgency text",2.49,4.39,7.19,1.89,3.99],["Column mean",2.4,3.9,6.5,1.6,3.6]],"title":"Conversion rate by design and source (percent)","note":"Column mean is the average for each source across the three designs; the grand mean of all twelve weeks is 3.6."}

Control's main effect is 3.33 minus 3.6, which is -0.27. Bigger button's is 3.48 minus 3.6, -0.12. Urgency text's is 3.99 minus 3.6, +0.39. On the source side, Organic's main effect is -1.2, Paid search's is +0.3, Email's is +2.9, and Social's is -2.0.

Every number from here on is built from this one table.

=== step === quiz
## Quick check: reading a main effect off the table

The table above shows Urgency text's row mean as 3.99 and the grand mean as 3.6. What is Urgency text's main effect?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- +0.39, since 3.99 minus 3.6 is 0.39 ::ok Correct. A main effect is always the row mean minus the grand mean, here 3.99 minus 3.6.
- 3.99, the row mean itself ::no
- -0.39, the grand mean minus the row mean ::no
- 0, since Urgency text was tested against all four sources equally ::no A main effect is never the row mean on its own, and it is not zero just because every design met every source once. It is the row mean minus the grand mean: 3.99 minus 3.6, which is +0.39.

=== step === concept
## The two main-effect sums of squares

Now compute SS design and SS source directly from the main effects above, using the identical formula on each factor's own margins.

```r
# Compute each factor's own sum of squares from its main effects
design_means <- tapply(checkout$conversion, checkout$design, mean)
source_means <- tapply(checkout$conversion, checkout$source, mean)
grand_mean <- mean(checkout$conversion)

design_effect <- design_means - grand_mean
source_effect <- source_means - grand_mean
design_effect
#>       Control Bigger button  Urgency text 
#>         -0.27         -0.12          0.39 
source_effect
#>     Organic Paid search       Email      Social 
#>        -1.2         0.3         2.9        -2.0 

ss_design <- sum(4 * design_effect^2)
ss_source <- sum(3 * source_effect^2)
ss_design
#> [1] 0.9576
ss_source
#> [1] 41.82
```

SS design squares each design's main effect, multiplies by 4 because each design was tested against 4 sources, and adds the three results. SS source does the same for each source's main effect, multiplied by 3 because each source met 3 designs.

SS design comes out to 0.9576, the exact same number the one-way test on design alone produced. That is not a coincidence: SS design only ever asks how far the design margins sit from the grand mean, and adding source to the model later does not move those margins at all.

SS source comes out to 41.82, more than forty times SS design. That is the large number the one-way model's residual, 42.22 of it, was quietly absorbing.

=== step === concept
## The residual left over, and the full table

Compute what is left over after both main effects are removed, then check the whole table against `aov()`.

```r
# Compute the residual sum of squares by subtraction, then check the full table against aov()
ss_total <- sum((checkout$conversion - grand_mean)^2)
ss_resid <- ss_total - ss_design - ss_source
ss_total
#> [1] 43.1776
ss_resid
#> [1] 0.4

ms_design <- ss_design / 2
ms_source <- ss_source / 3
ms_resid <- ss_resid / 6
ms_design
#> [1] 0.4788
ms_source
#> [1] 13.94
ms_resid
#> [1] 0.06666667

summary(aov(conversion ~ design + source, data = checkout))
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> design       2   0.96   0.479   7.182   0.0256 *  
#> source       3  41.82  13.940 209.100 1.85e-06 ***
#> Residuals    6   0.40   0.067                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

`ss_total`, the squared distance of every one of the twelve weeks from the grand mean, is 43.1776. Subtract SS design and SS source, and what is left is SS residual, 0.4, on (3-1) times (4-1), 6 degrees of freedom. Dividing each sum of squares by its own degrees of freedom gives a mean square: MS design 0.4788, MS source 13.94, MS resid 0.0667.

`aov(conversion ~ design + source)` fits design and source together in one model, and `summary()` reproduces every one of those numbers, this time with source sitting in its own row instead of hiding inside the residual.

Here is that same decomposition laid out as one clean table, with a total row added so every piece of variation is accounted for.

::widget styled-table {"cols":["term","df","SS","MS"],"rows":[["design",2,0.9576,0.4788],["source",3,41.82,13.94],["residual",6,0.4,0.0667],["total",11,43.1776,""]],"title":"The two-way sums-of-squares table for checkout conversion","note":"SS source is more than forty times SS design; the residual row is the variation neither main effect accounts for."}

=== step === concept
## Why removing real noise makes the other factor's test more sensitive

Now compute both F ratios, one-way and two-way, directly from the mean squares already on the page.

```r
# Compute both F ratios (and p-values) for design, one-way and two-way
f_design_1way <- (ss_design / 2) / ((ss_total - ss_design) / 9)
p_design_1way <- pf(f_design_1way, 2, 9, lower.tail = FALSE)

f_design_2way <- ms_design / ms_resid
p_design_2way <- pf(f_design_2way, 2, 6, lower.tail = FALSE)

f_design_1way
#> [1] 0.1020654
p_design_1way
#> [1] 0.9040007
f_design_2way
#> [1] 7.182
p_design_2way
#> [1] 0.02557788
```

F is always MS design divided by the residual mean square it gets measured against. In the one-way model, that residual mean square is 4.691: everything design does not explain, including all of source's swing, lands there. Divide MS design, 0.4788, by 4.691 and F comes out to 0.102, p = 0.904.

In the two-way model, the numerator has not moved at all. SS design is still 0.9576, MS design is still 0.4788. What changed is the denominator: MS resid dropped from 4.691 to 0.0667, because source's real variation now has its own row and is no longer sitting inside the residual. Divide that same 0.4788 by 0.0667 and F jumps to 7.182, p = 0.0256.

Nothing about design changed between the two models. The test around it got sharper because a real source of noise was named and pulled out of the error term, leaving a much smaller, more honest estimate of ordinary week-to-week variation for design to be measured against.

=== step === concept
## Does the formula's order matter? Only once balance breaks

`aov()`'s default sum of squares is called Type I, or sequential: it charges each term's sum of squares based on the order it enters the formula. Check both orders on the balanced data above first.

```r
# Check whether swapping the formula's term order changes anything, on balanced data
summary(aov(conversion ~ design + source, data = checkout))
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> design       2   0.96   0.479   7.182   0.0256 *  
#> source       3  41.82  13.940 209.100 1.85e-06 ***
#> Residuals    6   0.40   0.067                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

summary(aov(conversion ~ source + design, data = checkout))
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> source       3  41.82  13.940 209.100 1.85e-06 ***
#> design       2   0.96   0.479   7.182   0.0256 *  
#> Residuals    6   0.40   0.067                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

`design + source` and `source + design` return identical numbers either way, SS design 0.9576 and SS source 41.82. That is because every design was tested against every source exactly once: the design is balanced, design and source are completely unrelated to each other, and order cannot matter.

Now suppose the team reruns three of the twelve weeks a second time: Control paired with Organic again, Urgency text with Email again, and Bigger button with Social again, each giving a slightly different conversion rate the second time around. Add those three reruns, which breaks the balance, and fit both orderings again.

```r
# Add 3 reruns (breaking balance), then check both orderings again
checkout_unbalanced <- rbind(
  checkout,
  data.frame(design = factor(c("Control", "Urgency text", "Bigger button"), levels = levels(checkout$design)),
             source = factor(c("Organic", "Email", "Social"), levels = levels(checkout$source)),
             conversion = c(2.55, 7.35, 1.60))
)
nrow(checkout_unbalanced)
#> [1] 15

summary(aov(conversion ~ design + source, data = checkout_unbalanced))
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> design       2   7.74   3.872   50.24 1.31e-05 ***
#> source       3  53.87  17.957  233.00 7.58e-09 ***
#> Residuals    9   0.69   0.077                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

summary(aov(conversion ~ source + design, data = checkout_unbalanced))
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> source       3  60.39  20.131 261.210 4.56e-09 ***
#> design       2   1.22   0.611   7.933   0.0103 *  
#> Residuals    9   0.69   0.077                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

There are now 15 rows, and design is no longer balanced against source: Control, Urgency text and Bigger button were each tested an extra time, but against only one source apiece.

Put design first in the formula and SS design comes out to 7.74, F = 50.24, p = 1.31e-05. Put source first instead, so design becomes the second term, and SS design drops to 1.22, F = 7.933, p = 0.0103. Nothing about the data changed between those two calls, only the order of two words in a formula, and design's own sum of squares moved by more than sixfold.

That is what it means for Type I sums of squares to depend on order. On a balanced design, order is free to ignore. The moment the design is no longer balanced, which formula term arrives first decides what already counts as explained by the time a given term's sum of squares gets calculated.

=== step === widget
## Type II sums of squares: the answer that does not depend on order

Ask `car::Anova()` for the Type II sum of squares on the same unbalanced fit. It adjusts every term for every other term, regardless of formula order.

```r
# Compute Type II sums of squares, which do not depend on formula order
suppressMessages(library(car))
fit_unbalanced <- aov(conversion ~ design + source, data = checkout_unbalanced)
Anova(fit_unbalanced, type = 2)
#> Anova Table (Type II tests)
#> 
#> Response: conversion
#>           Sum Sq Df  F value    Pr(>F)    
#> design     1.223  2   7.9327   0.01033 *  
#> source    53.872  3 233.0046 7.576e-09 ***
#> Residuals  0.694  9                       
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Design's Type II sum of squares is 1.223, matching the source-first Type I ordering's 1.22, the small gap just rounding in the printed tables. That is not a coincidence: in that ordering, design was already the LAST term in the formula, which means it was already being measured after adjusting for source. Type II always reports that same fully adjusted number, no matter which order the formula lists design and source in.

Here is that order-dependent swing, lined up against the one answer that does not move.

::widget styled-table {"cols":["method","design SS","design F","design p"],"rows":[["Type I, design first",7.74,50.24,"1.31e-05"],["Type I, source first",1.22,7.93,"0.0103"],["Type II",1.22,7.93,"0.0103"]],"title":"Three ways of testing design on the unbalanced 15-row data","note":"Type II matches whichever Type I ordering already tested design last."}

On an unbalanced design, Type II is the sum of squares to reach for. It gives one honest answer regardless of which order you happened to type the terms in.

=== step === quiz
## Quick check: why the same SS design gave a more sensitive test

Back in the balanced data, SS design was 0.9576 in both the one-way model and the two-way model, yet F for design rose from 0.102 to 7.182 once source was added. Why?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- SS design itself increased once source was added to the model ::no
- Adding source shrank MS residual from 4.691 to 0.0667, so the unchanged SS design now sits over a far smaller denominator ::ok Exactly. F only moved because the denominator got smaller. SS design stayed at 0.9576 the whole time.
- The sample size doubled once a second factor was added ::no
- Any second factor raises every other factor's F, whether or not it explains real variation ::no SS design never changed, 0.9576 both times. What changed was MS resid, which fell from 4.691 to 0.0667 once source's real variation got its own row instead of hiding inside the error term. An irrelevant second factor would barely move the residual at all, and F would barely move either.

=== step === tryit
## Your turn: get the honest answer on a different unbalanced design

Here is a new, smaller example to test the same idea on your own. An agronomist compares two fertilizers, A and B, across three plots of land, but the readings were not spread evenly across them: fertilizer A was read 3 times in plot 1, once in plot 2, and twice in plot 3, while fertilizer B was read twice in plot 1 and once each in plots 2 and 3, ten readings in total.

Here is that data already built, with the fitted model ready to go.

```r
# Fertilizer heights across three unevenly sampled plots
fert_height <- data.frame(
  fert = factor(c("A", "A", "A", "A", "A", "A", "B", "B", "B", "B"), levels = c("A", "B")),
  plot = factor(c("Plot 1", "Plot 1", "Plot 1", "Plot 2", "Plot 3", "Plot 3", "Plot 1", "Plot 1", "Plot 2", "Plot 3"),
                levels = c("Plot 1", "Plot 2", "Plot 3")),
  height = c(22.5, 23.0, 21.8, 25.0, 24.0, 23.5, 19.0, 18.5, 20.5, 19.8)
)

tapply(fert_height$height, list(fert_height$fert, fert_height$plot), mean)
#>     Plot 1 Plot 2 Plot 3
#> A 22.43333   25.0  23.75
#> B 18.75000   20.5  19.80

fert_fit <- aov(height ~ fert + plot, data = fert_height)

# Your turn: ask car::Anova() for the Type II sum of squares on fert_fit
```
::check {"regex": "Anova\\s*[(]\\s*fert_fit\\s*,\\s*type\\s*=\\s*2\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: fert's Type II sum of squares is 36.571, F = 180.987, p = 1.045e-05, a real difference regardless of order.", "no": "Call car::Anova() on fert_fit with type = 2: Anova(fert_fit, type = 2)."}
::solution
```r
# Ask car::Anova() for the Type II sum of squares on fert_fit
car::Anova(fert_fit, type = 2)
#> Anova Table (Type II tests)
#> 
#> Response: height
#>           Sum Sq Df F value    Pr(>F)    
#> fert      36.571  1 180.987 1.045e-05 ***
#> plot       7.518  2  18.602  0.002678 ** 
#> Residuals  1.212  6                      
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Fert's Type II sum of squares, 36.571, is the one honest answer you would get no matter which order fert and plot were listed in the formula, F = 180.987, p = 1.045e-05: a real difference between the two fertilizers, even with uneven sampling across the three plots.

=== step === concept
## References

- Montgomery, D.C. (2017). "Design and Analysis of Experiments." Wiley. The two-way ANOVA sums-of-squares decomposition and the main effects built by hand in this lesson.
- Langsrud, O. (2003). "ANOVA for Unbalanced Data: Use Type II Instead of Type III Sums of Squares." Statistics and Computing. The order-dependence of Type I sums of squares shown once the twelve weeks are no longer balanced.
- [car: Companion to Applied Regression](https://cran.r-project.org/package=car) - Fox, J. and Weisberg, S., the CRAN package documentation for `Anova()` and the Type II sums of squares used once the design becomes unbalanced.
- [R documentation: aov](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html) - R Core Team, the function fitting every two-way model in this lesson.
- [R documentation: pf](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/pf.html) - R Core Team, the F distribution function behind every p-value computed by hand in this lesson.

=== step === complete
## Two factors, one honest table

A main effect is a row mean's or a column mean's distance from the grand mean, what statisticians call a marginal mean: how far one design, or one source, sits from the overall average on its own.

Naming a real second factor and giving it its own row shrinks the residual mean square, which is exactly why design's F rose from 0.102 to 7.182 once source entered the model. Nothing about design itself had to change.

And on an unbalanced design, Type II sums of squares is the one that does not depend on which order the formula lists its terms in, because it always adjusts each factor for the other.

The next lesson asks what happens once those two factors are allowed to interact, so that one factor's effect is allowed to depend on the level of the other.
