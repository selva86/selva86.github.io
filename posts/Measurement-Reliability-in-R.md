---
title: "Measurement Reliability in R: Alpha, ICC, Agreement"
slug: "Measurement-Reliability-in-R"
description: "Learn measurement reliability in R. Compute Cronbach's alpha, the intraclass correlation (ICC), and Cohen's kappa by hand, then verify with psych and irr."
keywords: "measurement reliability in R, Cronbach's alpha R, intraclass correlation R, ICC in R, Cohen's kappa R, inter-rater reliability R, internal consistency, psych package, irr package, weighted kappa"
auto_link_terms: "measurement reliability|reliability in R|Cronbach's alpha|internal consistency|intraclass correlation|ICC in R|Cohen's kappa|inter-rater reliability|inter-rater agreement|weighted kappa|Fleiss kappa|test-retest reliability|rater agreement|reliability coefficient"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-27"
curriculum_id: "ST2-12.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Measurement Reliability"
sidebar_order: "161"
difficulty: "Intermediate"
---

<p class="lead">Measurement reliability is the degree to which a measurement reflects a real, stable signal instead of random noise. In R you quantify it three ways: Cronbach's alpha for the internal consistency of a multi-item scale, the intraclass correlation (ICC) for agreement between raters on numeric scores, and Cohen's or Fleiss' kappa for agreement on categories.</p>

## What is measurement reliability, and why does it matter?

Every score you record is part real signal and part random noise. Reliability is simply the share that is signal. If two attempts to measure the same thing disagree wildly, the number is mostly noise, and any conclusion you build on it is unreliable too. The fastest way to feel this is to measure the same people twice and see how well the two attempts agree.

Let's build that demonstration. We invent 50 people with a fixed true ability, then measure each person twice with a precise instrument (small random error) and twice more with a sloppy one (large random error). Everything on this page uses base R unless a block says otherwise.

```r title="Compare a precise and a noisy instrument"
set.seed(101)
true_score <- rnorm(50, mean = 100, sd = 15)
reliable_1 <- true_score + rnorm(50, sd = 3)
reliable_2 <- true_score + rnorm(50, sd = 3)
noisy_1 <- true_score + rnorm(50, sd = 15)
noisy_2 <- true_score + rnorm(50, sd = 15)
cat("Reliable instrument, test-retest r:", round(cor(reliable_1, reliable_2), 2), "\n")
cat("Noisy instrument, test-retest r:   ", round(cor(noisy_1, noisy_2), 2), "\n")
#> Reliable instrument, test-retest r: 0.95
#> Noisy instrument, test-retest r:    0.39
```

That correlation between two attempts at the same measurement is called test-retest reliability. The precise instrument reproduces itself almost perfectly (0.95), while the noisy one barely agrees with itself (0.39). Same 50 people, same true abilities: the only difference is how much random error each instrument adds.

![Every observed score splits into a true part and a random error part; reliability is the true part's share of the total.](screenshots/Measurement-Reliability-in-R-true-score-model.webp)

*Figure 1: Every observed score splits into a true part and a random error part; reliability is the true part's share of the total.*

The figure names the model behind that demo. An observed score equals a true score plus random error, and because the two are independent, the observed variance is the true variance plus the error variance. Reliability is the true variance divided by the observed variance. We simulated the data, so we actually know each person's true score and can compute that ratio directly.

```r title="Reliability as a share of true variance"
rel_reliable <- var(true_score) / var(reliable_1)
rel_noisy    <- var(true_score) / var(noisy_1)
cat("Reliability of the precise instrument:", round(rel_reliable, 2), "\n")
cat("Reliability of the noisy instrument:  ", round(rel_noisy, 2), "\n")
#> Reliability of the precise instrument: 0.93
#> Reliability of the noisy instrument:   0.52
```

The precise instrument is 93% signal, the noisy one only 52%. In real studies you never see the true score, so you cannot compute this ratio directly. The rest of this tutorial estimates that same signal share from data you can actually collect: several items answered by one person, or several raters judging the same subjects.

[KEY INSIGHT]
**Reliability is the signal's share of the total.** A measurement is reliable when most of its variation comes from real differences between the things you measure, not from random noise added each time you measure.

**Try it:** Build a third instrument that is noisier than the precise one but cleaner than the sloppy one by using `rnorm(50, sd = 8)` for its error, then report its test-retest correlation. Reuse `true_score` and remember to seed for reproducibility.

```r title="Your turn: a middling instrument"
# Goal: two measurements of true_score, each with sd = 8 error, then their correlation.
# set.seed(202) first so your result is reproducible.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Middling instrument solution"
set.seed(202)
ex_meas1 <- true_score + rnorm(50, sd = 8)
ex_meas2 <- true_score + rnorm(50, sd = 8)
round(cor(ex_meas1, ex_meas2), 2)
#> [1] 0.74
```

**Explanation:** With error sd of 8, the test-retest correlation lands at 0.74, between the precise 0.95 and the noisy 0.39. More measurement error always lowers reliability.

</details>

## How do you measure internal consistency with Cronbach's alpha?

Often you cannot measure someone twice, but you can ask several related questions at once. A questionnaire that measures job satisfaction might have seven items. If they all tap the same underlying idea, people who score high on one should tend to score high on the others. That "hang-togetherness" is internal consistency, and Cronbach's alpha is its most common summary.

R ships with a real survey dataset called `attitude`: 30 departments rated on seven aspects of workplace experience, each on a 0 to 100 scale. Let's look at the first three rows.

```r title="Inspect the survey items"
data(attitude)
head(attitude, 3)
#>   rating complaints privileges learning raises critical advance
#> 1     43         51         30       39     61       92      45
#> 2     63         64         51       54     63       73      47
#> 3     71         70         68       69     76       86      48
```

Each column is one item, each row is one department. Alpha asks a simple question: relative to the spread of the total score, how much of the variation is shared across items rather than private to each one. We can compute it straight from variances. Add up the variance of each item, compare that to the variance of the row totals, and scale by the number of items.

```r title="Compute Cronbach's alpha by hand"
items <- attitude
k <- ncol(items)
item_variances <- apply(items, 2, var)
total_variance <- var(rowSums(items))
cronbach_alpha <- (k / (k - 1)) * (1 - sum(item_variances) / total_variance)
cat("Number of items:", k, "\n")
cat("Sum of item variances:", round(sum(item_variances), 1), "\n")
cat("Variance of total score:", round(total_variance, 1), "\n")
cat("Cronbach's alpha:", round(cronbach_alpha, 3), "\n")
#> Number of items: 7
#> Sum of item variances: 924.8
#> Variance of total score: 3334.9
#> Cronbach's alpha: 0.843
```

The seven items produce an alpha of 0.843. Here is the logic behind the arithmetic you just ran. If items were unrelated, the total variance would sit close to the sum of the item variances, the fraction inside the parentheses would fall near zero, and alpha would collapse toward zero. When items move together they reinforce each other, so the total variance grows well past the sum of the item variances. That shrinks the fraction and pushes alpha toward one.

$$\alpha = \frac{k}{k-1}\left(1 - \frac{\sum_{i=1}^{k} \sigma^2_{i}}{\sigma^2_{\text{total}}}\right)$$

Where:

- $k$ = the number of items (here 7)
- $\sigma^2_i$ = the variance of item $i$
- $\sigma^2_{\text{total}}$ = the variance of the summed total score

A close cousin, standardized alpha, ignores the raw variances and works only from the average correlation between items. It answers the same question on a cleaner footing when items use different scales.

```r title="Standardized alpha from item correlations"
item_cor <- cor(items)
mean_r <- mean(item_cor[lower.tri(item_cor)])
alpha_std <- (k * mean_r) / (1 + (k - 1) * mean_r)
cat("Average inter-item correlation:", round(mean_r, 3), "\n")
cat("Standardized alpha:", round(alpha_std, 3), "\n")
#> Average inter-item correlation: 0.427
#> Standardized alpha: 0.839
```

The average item pair correlates at 0.427, and standardized alpha is 0.839, right next to the raw value. In practice you would reach for a package rather than retype these formulas every time.

[NOTE]
**The psych and irr packages do not run in the browser here.** Every by-hand block on this page runs live as you read, but blocks marked to run locally rely on packages that are not part of the in-browser toolkit. Paste those into your own R session, after `install.packages(c("psych", "irr"))`, to reproduce the numbers.

The `alpha()` function in the psych package returns the same coefficient plus a diagnostic you will want: what alpha would become if each item were dropped. Run this locally.

```r-static title="Cronbach's alpha with the psych package"
library(psych)
rel <- alpha(attitude)
round(rel$total[, c("raw_alpha", "std.alpha", "average_r")], 3)
#>  raw_alpha std.alpha average_r
#>      0.843     0.839     0.427
round(rel$alpha.drop[, "raw_alpha", drop = FALSE], 3)
#>            raw_alpha
#> rating         0.810
#> complaints     0.797
#> privileges     0.828
#> learning       0.803
#> raises         0.795
#> critical       0.864
#> advance        0.840
```

The headline numbers match your hand calculation exactly (0.843 and 0.839). The drop table is the useful part: alpha stays near 0.80 no matter which item you remove, except that dropping `critical` would push alpha up to 0.864. That item is the weak link, contributing little shared signal. How do you read the coefficient itself? Use this common guide.

| Cronbach's alpha | Interpretation |
|---|---|
| below 0.60 | Poor |
| 0.60 to 0.69 | Questionable |
| 0.70 to 0.79 | Acceptable |
| 0.80 to 0.89 | Good |
| 0.90 and above | Excellent |

[WARNING]
**A high alpha does not prove your scale measures one single thing.** Alpha rises automatically as you add items, so a long questionnaire can post an impressive number while quietly blending two unrelated ideas. Confirm that the items share one dimension with factor analysis before you trust a high alpha.

**Try it:** Compute Cronbach's alpha for just three of the columns, `complaints`, `learning`, and `raises`, using the same by-hand recipe. Store the three-column data frame first.

```r title="Your turn: alpha of a three-item subset"
# Goal: subset attitude to complaints, learning, raises, then apply the alpha formula.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-item alpha solution"
ex_items <- attitude[, c("complaints", "learning", "raises")]
ex_k <- ncol(ex_items)
ex_alpha <- (ex_k / (ex_k - 1)) * (1 - sum(apply(ex_items, 2, var)) / var(rowSums(ex_items)))
round(ex_alpha, 3)
#> [1] 0.833
```

**Explanation:** Three strong items already reach 0.833, close to the full seven-item scale, which tells you those three carry most of the shared signal.

</details>

## How do you measure rater agreement on numeric scores with the ICC?

Now change the setup. Instead of one person answering many items, several raters each score the same subjects on a numeric scale: judges scoring gymnasts, doctors rating scan severity, coders scoring essays. You want to know whether the subjects can be told apart reliably despite differences between raters. The intraclass correlation, or ICC, answers this by asking what share of the total variation comes from real differences between subjects rather than from rater disagreement or noise.

We use a small, published example from Shrout and Fleiss (1979): six targets each rated by four judges. Working with a known dataset lets you check the results against the literature.

```r title="Ratings of six targets by four judges"
ratings <- matrix(c(9, 2, 5, 8,
                    6, 1, 3, 2,
                    8, 4, 6, 8,
                    7, 1, 2, 6,
                    10, 5, 6, 9,
                    6, 2, 4, 7),
                  nrow = 6, byrow = TRUE)
colnames(ratings) <- paste0("Judge", 1:4)
rownames(ratings) <- paste0("Target", 1:6)
ratings
#>         Judge1 Judge2 Judge3 Judge4
#> Target1      9      2      5      8
#> Target2      6      1      3      2
#> Target3      8      4      6      8
#> Target4      7      1      2      6
#> Target5     10      5      6      9
#> Target6      6      2      4      7
```

Scan the rows and you can see the judges disagree a lot on the raw numbers (Judge2 is consistently harsh), yet they mostly rank the targets the same way. The ICC turns that impression into a number. The tool that separates the sources of variation is a two-way analysis of variance with target and judge as factors.

```r title="Partition the variance with a two-way ANOVA"
n <- nrow(ratings)
k <- ncol(ratings)
long <- data.frame(score = as.vector(ratings),
                   target = factor(rep(1:n, times = k)),
                   judge = factor(rep(1:k, each = n)))
fit <- aov(score ~ target + judge, data = long)
summary(fit)
MSR <- summary(fit)[[1]]["target", "Mean Sq"]
MSC <- summary(fit)[[1]]["judge", "Mean Sq"]
MSE <- summary(fit)[[1]]["Residuals", "Mean Sq"]
cat("MSR =", round(MSR, 2), " MSC =", round(MSC, 2), " MSE =", round(MSE, 2), "\n")
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> target       5  56.21   11.24   11.03 0.000135 ***
#> judge        3  97.46   32.49   31.87 9.45e-07 ***
#> Residuals   15  15.29    1.02
#> MSR = 11.24  MSC = 32.49  MSE = 1.02
```

The ANOVA hands us three mean squares. `MSR` (11.24) measures how much the targets differ from each other, the real signal we hope dominates. `MSC` (32.49) measures how much the judges differ in overall strictness. `MSE` (1.02) is the leftover noise. The ICC formulas combine these three numbers, and the exact recipe depends on the question you are asking.

$$\text{ICC(3,1)} = \frac{MS_R - MS_E}{MS_R + (k-1)\,MS_E} \qquad \text{ICC(2,1)} = \frac{MS_R - MS_E}{MS_R + (k-1)\,MS_E + \frac{k}{n}(MS_C - MS_E)}$$

Where:

- $MS_R$ = the between-subjects mean square (real target differences)
- $MS_C$ = the between-raters mean square (judge strictness)
- $MS_E$ = the residual mean square (noise)
- $n$ = the number of subjects, $k$ = the number of raters

The two formulas differ in one place: the consistency version, ICC(3,1), ignores $MS_C$, while the absolute-agreement version, ICC(2,1), adds it as a penalty. Consistency forgives a judge who is harsh as long as they rank targets correctly; agreement demands that raters land on the same actual number. Let's compute both, plus the version for the average of all four judges.

```r title="Compute ICC by hand from the mean squares"
icc_consistency <- (MSR - MSE) / (MSR + (k - 1) * MSE)
icc_agreement   <- (MSR - MSE) / (MSR + (k - 1) * MSE + (k / n) * (MSC - MSE))
icc_avg_consistency <- (MSR - MSE) / MSR
cat("ICC(3,1) consistency, single rater:", round(icc_consistency, 3), "\n")
cat("ICC(2,1) agreement, single rater:  ", round(icc_agreement, 3), "\n")
cat("ICC(3,k) consistency, mean of 4:   ", round(icc_avg_consistency, 3), "\n")
#> ICC(3,1) consistency, single rater: 0.715
#> ICC(2,1) agreement, single rater:   0.29
#> ICC(3,k) consistency, mean of 4:    0.909
```

Look at how far apart these are for the very same ratings. Judged on ranking alone, a single rater is fairly reliable (0.715). Demand that raters agree on the exact score and reliability drops to 0.29, because Judge2's harshness now counts against them. Average all four judges together and reliability jumps to 0.909, since pooling cancels individual quirks. The psych package computes all six standard forms at once, with confidence intervals. Run this locally.

```r-static title="All six ICC forms with the psych package"
res <- psych::ICC(ratings)$results
data.frame(form  = res$type,
           ICC   = round(res$ICC, 3),
           lower = round(res$`lower bound`, 3),
           upper = round(res$`upper bound`, 3))
#>    form   ICC  lower upper
#> 1  ICC1 0.166 -0.133 0.723
#> 2  ICC2 0.290  0.019 0.761
#> 3  ICC3 0.715  0.342 0.946
#> 4 ICC1k 0.443 -0.884 0.912
#> 5 ICC2k 0.620  0.071 0.927
#> 6 ICC3k 0.909  0.676 0.986
```

Your hand-computed values sit right in this table: ICC3 is 0.715, ICC2 is 0.290, ICC3k is 0.909. The six forms come from three yes-or-no choices, laid out below.

| psych label | Model | Type | Unit |
|---|---|---|---|
| ICC1 | One-way random | Absolute | Single rater |
| ICC2 | Two-way random | Agreement | Single rater |
| ICC3 | Two-way mixed | Consistency | Single rater |
| ICC1k | One-way random | Absolute | Average |
| ICC2k | Two-way random | Agreement | Average |
| ICC3k | Two-way mixed | Consistency | Average |

The irr package lets you request one specific form directly, which is handy when a journal asks for exactly the absolute-agreement single-rater value. Run this locally.

```r-static title="One ICC form with the irr package"
library(irr)
icc(ratings, model = "twoway", type = "agreement", unit = "single")
#>  Single Score Intraclass Correlation
#>    Model: twoway
#>    Type : agreement
#>    Subjects = 6
#>      Raters = 4
#>    ICC(A,1) = 0.29
#>    F(5,15) = 11 , p = 0.000135
#>  95%-Confidence Interval for ICC Population Values:
#>   0.019 < ICC < 0.761
```

That confirms the by-hand agreement value of 0.29 once more. To interpret any ICC, the widely used Koo and Li (2016) guideline is a good default.

| ICC | Reliability |
|---|---|
| below 0.50 | Poor |
| 0.50 to 0.75 | Moderate |
| 0.75 to 0.90 | Good |
| above 0.90 | Excellent |

[TIP]
**Report which ICC you used, not just the number.** State clearly whether you chose the consistency or the absolute-agreement type, and whether the value describes a single rater or the average of several, because those choices can move the same ratings from "poor" to "good".

**Try it:** You have `MSR`, `MSC`, `MSE`, and `n` in memory from the ANOVA. Compute the absolute-agreement ICC for the average of the four judges, ICC(2,k), whose formula is `(MSR - MSE) / (MSR + (MSC - MSE) / n)`.

```r title="Your turn: average-rater agreement ICC"
# Goal: plug MSR, MSC, MSE, n into the ICC(2,k) agreement formula and round to 3 digits.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Average-rater agreement ICC solution"
ex_icc2k <- (MSR - MSE) / (MSR + (MSC - MSE) / n)
round(ex_icc2k, 3)
#> [1] 0.62
```

**Explanation:** Averaging the four judges lifts absolute agreement from 0.29 for a single rater to 0.62 for the panel mean, matching ICC2k in the psych table. More raters, averaged, cancel individual bias.

</details>

## How do you measure agreement on categories with Cohen's kappa?

Sometimes raters do not give numbers at all: they assign categories. Two examiners grade essays as Fail, Pass, Merit, or Distinction; two doctors label a scan as benign or malignant. The obvious measure is the percentage of cases the raters label the same way, but that number overstates agreement, because raters agree by pure luck a fair amount of the time. Cohen's kappa fixes this by subtracting the agreement expected from chance.

Here are two examiners grading the same 20 essays. We store the grades as ordered factors and cross-tabulate them into a confusion table.

```r title="Two examiners grade twenty essays"
levels_grade <- c("Fail", "Pass", "Merit", "Distinction")
examiner_A <- factor(c("Pass","Fail","Merit","Pass","Distinction","Merit","Fail","Pass",
                       "Merit","Distinction","Pass","Fail","Merit","Pass","Distinction",
                       "Merit","Pass","Fail","Distinction","Merit"), levels = levels_grade)
examiner_B <- factor(c("Pass","Fail","Merit","Merit","Distinction","Pass","Fail","Pass",
                       "Merit","Merit","Pass","Pass","Merit","Pass","Distinction",
                       "Distinction","Pass","Fail","Distinction","Merit"), levels = levels_grade)
conf <- table(examiner_A, examiner_B)
conf
#>              examiner_B
#> examiner_A    Fail Pass Merit Distinction
#>   Fail           3    1     0           0
#>   Pass           0    5     1           0
#>   Merit          0    1     4           1
#>   Distinction    0    0     1           3
```

The diagonal counts the essays both examiners graded identically. Everything off the diagonal is a disagreement. Adding up the diagonal and dividing by 20 gives the raw agreement.

```r title="Why raw percent agreement misleads"
n_essays <- length(examiner_A)
p_observed <- sum(diag(conf)) / n_essays
cat("Essays graded the same by both examiners:", sum(diag(conf)), "out of", n_essays, "\n")
cat("Observed (raw) agreement:", round(p_observed, 3), "\n")
#> Essays graded the same by both examiners: 15 out of 20
#> Observed (raw) agreement: 0.75
```

They agree on 15 of 20 essays, or 75%. That sounds decent, but part of it is luck. If both examiners hand out Pass often, they will land on Pass together sometimes even without reading the essays. Kappa asks how much of the 75% is real skill beyond that chance floor.

$$\kappa = \frac{p_o - p_e}{1 - p_e}$$

Where:

- $p_o$ = the observed proportion of agreement (0.75 here)
- $p_e$ = the proportion of agreement expected by chance, from the row and column totals

To get the chance floor, multiply each grade's row share by its column share and add across grades. That is the agreement you would expect if each examiner threw grades independently while keeping their overall habits.

```r title="Cohen's kappa by hand"
row_share <- rowSums(conf) / n_essays
col_share <- colSums(conf) / n_essays
p_expected <- sum(row_share * col_share)
cohen_kappa <- (p_observed - p_expected) / (1 - p_expected)
cat("Agreement expected by chance:", round(p_expected, 3), "\n")
cat("Cohen's kappa:", round(cohen_kappa, 3), "\n")
#> Agreement expected by chance: 0.265
#> Cohen's kappa: 0.66
```

Chance alone would produce about 27% agreement, so the raw 75% is a lot better than luck. Kappa rescales the gap into 0.66, meaning the examiners captured about two thirds of the possible agreement above chance.

[KEY INSIGHT]
**Kappa measures how far you beat blind guessing.** Two raters who both label almost everything the same category will agree often by luck alone, so kappa subtracts that expected luck before crediting the agreement that remains.

The irr package computes kappa directly, and it can also weight disagreements. For ordered grades, a Fail-versus-Distinction mix-up is worse than a Merit-versus-Distinction slip, and squared weights penalize far-apart disagreements more heavily. Run this locally.

```r-static title="Cohen's kappa with the irr package"
grades <- data.frame(examiner_A, examiner_B)
kappa2(grades, weight = "unweighted")
#>  Cohen's Kappa for 2 Raters (Weights: unweighted)
#>  Subjects = 20
#>    Raters = 2
#>     Kappa = 0.66
kappa2(grades, weight = "squared")
#>  Cohen's Kappa for 2 Raters (Weights: squared)
#>     Kappa = 0.718
```

The unweighted kappa reproduces your 0.66. The squared-weight version rises to 0.718, because the examiners' disagreements were all near misses between neighbouring grades rather than wild swings, and weighting rewards that. When you have three or more raters, Cohen's kappa no longer applies, but Fleiss' kappa extends the same chance-corrected idea to a whole panel. Run this locally.

```r-static title="Fleiss' kappa for three or more raters"
set.seed(9)
ticket_ratings <- matrix(c(
  1, 1, 1, 2, 2, 2, 3, 3, 3, 1, 1, 2, 2, 2, 3,
  3, 3, 3, 1, 1, 1, 2, 3, 2, 1, 1, 1, 2, 2, 2,
  3, 3, 3, 1, 2, 1, 2, 2, 2, 3, 3, 3, 1, 1, 1),
  ncol = 3, byrow = TRUE)
kappam.fleiss(ticket_ratings)
#>  Fleiss' Kappa for m Raters
#>  Subjects = 15
#>    Raters = 3
#>     Kappa = 0.733
```

Three coders labelling 15 support tickets into three categories reach a Fleiss' kappa of 0.733. To judge any kappa, the Landis and Koch (1977) scale is the classic reference.

| Kappa | Agreement |
|---|---|
| below 0.00 | Poor |
| 0.00 to 0.20 | Slight |
| 0.21 to 0.40 | Fair |
| 0.41 to 0.60 | Moderate |
| 0.61 to 0.80 | Substantial |
| 0.81 to 1.00 | Almost perfect |

[WARNING]
**When one category is rare, high agreement can still give a low kappa.** If most cases fall in one bucket, raters agree most of the time just by naming that common bucket, so kappa can look weak even when raw agreement looks excellent. You will meet this trap in the last practice exercise.

**Try it:** Two coders labelled 10 emails as Spam or Ham. Build the confusion table with `table()`, then compute both raw agreement and Cohen's kappa by hand. The two label vectors are provided.

```r title="Your turn: kappa for two spam coders"
ex_c1 <- c("Spam","Ham","Spam","Spam","Ham","Ham","Spam","Ham","Spam","Ham")
ex_c2 <- c("Spam","Ham","Spam","Ham","Ham","Ham","Spam","Ham","Spam","Spam")
# 1. ex_tab <- table(ex_c1, ex_c2)
# 2. observed agreement = sum(diag(ex_tab)) / length(ex_c1)
# 3. expected = sum(row shares * col shares)
# 4. kappa = (observed - expected) / (1 - expected)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spam coder kappa solution"
ex_tab <- table(ex_c1, ex_c2)
ex_po <- sum(diag(ex_tab)) / length(ex_c1)
ex_pe <- sum(rowSums(ex_tab) / length(ex_c1) * colSums(ex_tab) / length(ex_c1))
round(c(percent_agreement = ex_po, kappa = (ex_po - ex_pe) / (1 - ex_pe)), 3)
#> percent_agreement             kappa
#>               0.8               0.6
```

**Explanation:** The coders agree on 8 of 10 emails (0.8 raw), but after removing the chance floor the kappa is 0.6, moderate agreement. The correction matters even for a tidy binary task.

</details>

## How do you choose the right reliability measure?

The three coefficients are not competitors; each fits a different shape of data. The deciding question is what your ratings look like, as the figure and table below lay out.

![Pick the reliability measure from the kind of ratings you have.](screenshots/Measurement-Reliability-in-R-choose-measure.webp)

*Figure 2: Pick the reliability measure from the kind of ratings you have.*

| You have | You want to know | Use |
|---|---|---|
| Many items, one construct | Internal consistency | Cronbach's alpha |
| Numeric scores, several raters | Rater reliability | Intraclass correlation |
| Category labels, two raters | Agreement beyond chance | Cohen's kappa |
| Category labels, three or more raters | Agreement beyond chance | Fleiss' kappa |

[TIP]
**Match the coefficient to the decision you will make.** If future cases will be scored by the average of several raters, report the average-measures ICC; if a lone rater will score them, report the single-measures ICC, because that is the reliability you will actually get in production.

## Complete Example: an end-to-end reliability check

Let's put ICC and kappa on the same dataset to see how the lens changes the answer. Three interviewers score 10 job candidates on a 0 to 10 scale. First we generate and view the panel.

```r title="Three interviewers score ten candidates"
set.seed(88)
quality <- round(runif(10, 2, 9))
panel <- sapply(1:3, function(j) pmin(10, pmax(0, round(quality + rnorm(10, sd = 1.4)))))
colnames(panel) <- paste0("Interviewer", 1:3)
rownames(panel) <- paste0("Cand", 1:10)
panel
#>        Interviewer1 Interviewer2 Interviewer3
#> Cand1             5            4            4
#> Cand2             3            3            2
#> Cand3             4            8            5
#> Cand4             3            5            5
#> Cand5            10           10            8
#> Cand6             8            9            8
#> Cand7             3            1            3
#> Cand8             9            6            6
#> Cand9             7            5            8
#> Cand10            9           10           10
```

Treating the scores as numbers, we ask how reliable the panel is when we average all three interviewers, using the absolute-agreement ICC for the mean of the raters.

```r title="Panel reliability as an average-rater ICC"
np <- nrow(panel)
kp <- ncol(panel)
long_p <- data.frame(score = as.vector(panel),
                     cand = factor(rep(1:np, times = kp)),
                     rater = factor(rep(1:kp, each = np)))
tp <- summary(aov(score ~ cand + rater, data = long_p))[[1]]
MSR_p <- tp["cand", "Mean Sq"]
MSC_p <- tp["rater", "Mean Sq"]
MSE_p <- tp["Residuals", "Mean Sq"]
icc_panel <- (MSR_p - MSE_p) / (MSR_p + (MSC_p - MSE_p) / np)
cat("Panel ICC(2,k), average of 3 interviewers, absolute agreement:", round(icc_panel, 3), "\n")
#> Panel ICC(2,k), average of 3 interviewers, absolute agreement: 0.926
```

As a numeric panel, reliability is excellent at 0.926. Now suppose the company only cares about a yes-or-no call: recommend a candidate whose score is 6 or higher. We collapse two interviewers' scores into that decision and measure agreement with Cohen's kappa.

```r title="Turn scores into a hire decision and check agreement"
rec_1 <- ifelse(panel[, 1] >= 6, "Recommend", "Reject")
rec_2 <- ifelse(panel[, 2] >= 6, "Recommend", "Reject")
decision <- table(rec_1, rec_2)
decision
d_po <- sum(diag(decision)) / np
d_pe <- sum(rowSums(decision) / np * colSums(decision) / np)
cat("Raw agreement on the decision:", round(d_po, 2), "\n")
cat("Cohen's kappa on the decision:", round((d_po - d_pe) / (1 - d_pe), 3), "\n")
#>            rec_2
#> rec_1       Recommend Reject
#>   Recommend         4      1
#>   Reject            1      4
#> Raw agreement on the decision: 0.8
#> Cohen's kappa on the decision: 0.6
```

Here is the lesson. The same interviewers whose numeric scores were 0.926 reliable drop to a kappa of 0.6, only moderate, once you flatten the scores into a yes-or-no verdict. Dichotomizing throws away the fine gradations that made the panel look strong. When a numeric scale exists, keep it and report the ICC rather than reducing everything to a coarse label.

## Practice Exercises

These combine several ideas from the tutorial. Each solution runs on its own, so try it before you reveal the answer.

### Exercise 1: Find the weakest item in a scale

Build a five-item scale from the columns `complaints`, `privileges`, `learning`, `raises`, and `advance`. Compute Cronbach's alpha for the full scale, then compute alpha with each item removed in turn. Which single item, if dropped, raises alpha the most, and what does that tell you about that item?

```r title="Exercise 1 starter"
# Hint: write a helper alpha_of(m) that applies the alpha formula to a matrix,
# then loop over columns dropping one at a time with m[, -j].
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
scale_items <- attitude[, c("complaints", "privileges", "learning", "raises", "advance")]
alpha_of <- function(m) {
  kk <- ncol(m)
  (kk / (kk - 1)) * (1 - sum(apply(m, 2, var)) / var(rowSums(m)))
}
full_alpha <- alpha_of(scale_items)
drop_alpha <- sapply(seq_len(ncol(scale_items)), function(j) alpha_of(scale_items[, -j]))
names(drop_alpha) <- colnames(scale_items)
cat("Alpha with all 5 items:", round(full_alpha, 3), "\n")
round(drop_alpha, 3)
#> Alpha with all 5 items: 0.835
#> complaints privileges   learning     raises    advance
#>      0.799      0.818      0.775      0.773      0.837
```

**Explanation:** Dropping `advance` lifts alpha to 0.837, just above the full-scale 0.835. Every other removal lowers alpha. That makes `advance` the weakest contributor: it adds items to the scale without adding much shared signal.

</details>

### Exercise 2: Compute an ICC from scratch

Three raters scored six subjects, giving the matrix below. Using only base R, run a two-way ANOVA and compute the single-rater consistency ICC, ICC(3,1), from the mean squares. Its formula is `(MSR - MSE) / (MSR + (k - 1) * MSE)`.

```r title="Exercise 2 starter"
cap_r <- matrix(c(4, 5, 4,
                  7, 8, 7,
                  3, 3, 4,
                  9, 8, 9,
                  6, 7, 6,
                  5, 4, 5),
                nrow = 6, byrow = TRUE)
# Reshape to long form, fit aov(score ~ subject + rater), pull the mean squares,
# then apply the ICC(3,1) formula.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
cn <- nrow(cap_r)
ck <- ncol(cap_r)
cap_long <- data.frame(y = as.vector(cap_r),
                       subj = factor(rep(1:cn, times = ck)),
                       rtr = factor(rep(1:ck, each = cn)))
cap_ms <- summary(aov(y ~ subj + rtr, data = cap_long))[[1]]
cap_MSR <- cap_ms["subj", "Mean Sq"]
cap_MSE <- cap_ms["Residuals", "Mean Sq"]
cat("ICC(3,1):", round((cap_MSR - cap_MSE) / (cap_MSR + (ck - 1) * cap_MSE), 3), "\n")
#> ICC(3,1): 0.91
```

**Explanation:** These raters barely disagree, so almost all the variation reflects real subject differences, giving an excellent single-rater ICC of 0.91.

</details>

### Exercise 3: The base-rate trap

Two radiologists screened 100 scans for a rare disease. Their agreement is summarized in the 2-by-2 table below: both radiologists called 80 scans negative and 5 positive, and they disagreed on 10 scans split evenly in each direction. Compute the raw agreement and Cohen's kappa, then explain why they tell such different stories.

```r title="Exercise 3 starter"
scan_tab <- matrix(c(80, 5, 10, 5), nrow = 2, byrow = TRUE,
                   dimnames = list(RadiologistA = c("Neg", "Pos"),
                                   RadiologistB = c("Neg", "Pos")))
# raw agreement = sum(diag) / total; expected = sum(row shares * col shares);
# kappa = (raw - expected) / (1 - expected)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
N <- sum(scan_tab)
p_obs <- sum(diag(scan_tab)) / N
p_exp <- sum(rowSums(scan_tab) / N * colSums(scan_tab) / N)
cat("Raw agreement:", round(p_obs, 3), "\n")
cat("Cohen's kappa:", round((p_obs - p_exp) / (1 - p_exp), 3), "\n")
#> Raw agreement: 0.85
#> Cohen's kappa: 0.318
```

**Explanation:** Raw agreement is a comfortable 0.85, but kappa is only 0.318, merely fair. Because the disease is rare, both radiologists say "negative" most of the time and agree by default, so the chance floor is high and little genuine skill is left to credit. This is exactly why kappa, not raw percentage, is the honest measure for skewed categories.

</details>

## Summary

Measurement reliability is one idea, the signal's share of the total variation, measured three ways depending on the shape of your data. The mindmap below is your recap, and the table pins each family to its R tools.

![The three families of reliability and their coefficients.](screenshots/Measurement-Reliability-in-R-families.webp)

*Figure 3: The three families of reliability and their coefficients.*

| Family | Question it answers | By hand in R | Package function | Rule of thumb |
|---|---|---|---|---|
| Internal consistency | Do these items measure one thing? | item and total variances | psych::alpha() | alpha 0.80 or higher is good |
| Rater reliability (numeric) | Do raters score subjects alike? | two-way ANOVA mean squares | psych::ICC(), irr::icc() | ICC 0.75 or higher is good |
| Rater agreement (categorical) | Do raters pick the same category? | confusion table, chance correction | irr::kappa2(), irr::kappam.fleiss() | kappa 0.61 or higher is substantial |

Key takeaways to carry forward:

- Reliability is a proportion of variance, so it always sits between 0 and 1, and higher means less noise.
- Cronbach's alpha rewards items that move together, but a high alpha does not guarantee the scale is one-dimensional.
- The ICC has several forms; always state the model, and whether it describes a single rater or an average.
- Kappa beats raw percent agreement because it removes the agreement raters would reach by chance.
- Collapsing numeric ratings into categories can turn an excellent ICC into a merely moderate kappa, so keep the finer scale when you can.

## FAQ

### What counts as a good Cronbach's alpha?

A common rule treats 0.70 as acceptable, 0.80 as good, and 0.90 as excellent for research scales. Values above 0.95 can actually signal redundant items that ask the same question twice, so higher is not always better.

### What is the difference between Cronbach's alpha and the ICC?

Alpha summarizes how well several items on one questionnaire hang together to measure a single construct. The ICC summarizes how well several raters agree when they each score the same subjects. They answer different questions, though both express reliability as a share of variance.

### Why use Cohen's kappa instead of raw percent agreement?

Raw percent agreement counts every match, including the ones raters would hit by chance. Kappa subtracts that expected chance agreement, so it is not inflated when one category is very common. The base-rate exercise above shows raw agreement of 0.85 shrinking to a kappa of 0.318.

### Which ICC form should I report?

Pick the form that matches your design and use. Choose two-way if the same raters score every subject, absolute agreement if the exact score matters (not just the ranking), and single-rater if one rater will score future cases alone. Report the choice alongside the value.

### Does a high reliability score mean my measurement is accurate?

No. Reliability is about consistency, not correctness. A scale that reads five pounds heavy gives the same wrong number every time, so it is perfectly reliable yet completely inaccurate. Reliability is necessary for a good measure but not sufficient: to show that a measure captures the right thing, you also need validity evidence, such as a factor analysis that the items load on the intended construct or a comparison against an external standard.

### Can a reliability coefficient be negative?

Yes. Cronbach's alpha and the ICC can dip below zero when items or raters disagree more than chance would predict, which usually points to a reverse-coded item or a genuine measurement problem rather than a low-but-valid reliability.

## References

1. Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. Psychometrika. [Link](https://link.springer.com/article/10.1007/BF02310555)
2. Shrout, P. E., & Fleiss, J. L. (1979). Intraclass correlations: uses in assessing rater reliability. Psychological Bulletin. [Link](https://pubmed.ncbi.nlm.nih.gov/18839484/)
3. Koo, T. K., & Li, M. Y. (2016). A guideline of selecting and reporting intraclass correlation coefficients. Journal of Chiropractic Medicine. [Link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4913118/)
4. Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data. Biometrics. [Link](https://pubmed.ncbi.nlm.nih.gov/843571/)
5. McHugh, M. L. (2012). Interrater reliability: the kappa statistic. Biochemia Medica. [Link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3900052/)
6. Revelle, W. psych: Procedures for Psychological, Psychometric, and Personality Research. CRAN. [Link](https://cran.r-project.org/package=psych)
7. Gamer, M., et al. irr: Various Coefficients of Interrater Reliability and Agreement. CRAN. [Link](https://cran.r-project.org/package=irr)
8. R Core Team. An Introduction to R. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Factor Analysis in R](Factor-Analysis.html): confirm that your questionnaire items really measure one underlying construct before you trust their alpha.
- [Correlation Analysis in R](Correlation-Analysis-in-R.html): the pairwise correlation is the building block underneath both alpha and the ICC.
- [Statistical Tests in R](Statistical-Tests-in-R.html): round out your toolkit for comparing groups and validating measures.
