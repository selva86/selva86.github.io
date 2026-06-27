---
title: "Exploratory Data Analysis Lesson 6: Distribution shape and transformations"
description: "Read distribution shape in R: skew, heavy tails, multiple peaks. Check normality with a Q-Q plot, then fix skew with log, square-root and Box-Cox transforms."
keywords: "distribution shape, skewness in R, right-skewed, heavy tails, Q-Q plot, normality, log transformation, square root transform, Box-Cox, power transformation, EDA in R"
post_type: "LESSON"
curriculum_id: "2.3.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "6"
course_total: "8"
course_landing: "EDA-Course.html"
course_next: "Multivariate-EDA-with-Pairs-and-PCA.html"
course_prev: "Categorical-and-Frequency-EDA.html"
---

=== step === cover
::eyebrow Lesson 6 of 8
## Same average, very different shape

In Lesson 5 you explored the **categories** in Maya's bakery data, what sells and how it is ordered. Now we come back to her **numbers**, but we ask a deeper question than "what is a typical value?" We ask: what is the **shape** of the whole distribution?

Below is what each of 50 customers spent on a single visit to Maya's bakery, in dollars. Most spend a few dollars on a coffee and a pastry; a handful spend far more. That lopsided picture, a tall stack on the left and a long thin tail reaching right, is the most common shape in real data, and reading it is today's skill.

Shape matters for a practical reason: almost every method you meet later, the t-test, linear regression, control charts, quietly assumes your data is roughly symmetric. Feed them a lopsided variable and they mislead. So before you model, you read the shape, and when it is badly skewed, you fix it.

By the end of this lesson you will be able to:

- Read a distribution's **shape** from a histogram: its peaks, its symmetry, and the weight of its tails
- Tell **right** skew from **left** skew, and measure it with a number
- Check whether a variable is **normal** using a **Q-Q plot**
- **Transform** a skewed variable with log, square-root or Box-Cox so later methods behave

**Prerequisites:** you can run R and load a package with `library()`, and you have met the histogram, the mean, the median and the boxplot in [Lesson 1](An-EDA-Framework-and-One-Variable.html). Every new term is defined as it appears.

::widget chart-plotter {"data":[{"x":28},{"x":25},{"x":37},{"x":8},{"x":13},{"x":10},{"x":3},{"x":27},{"x":13},{"x":12},{"x":14},{"x":16},{"x":4},{"x":41},{"x":34},{"x":26},{"x":9},{"x":12},{"x":6},{"x":78},{"x":24},{"x":6},{"x":35},{"x":18},{"x":15},{"x":3},{"x":25},{"x":30},{"x":18},{"x":10},{"x":3},{"x":6},{"x":21},{"x":9},{"x":6},{"x":14},{"x":3},{"x":7},{"x":9},{"x":7},{"x":7},{"x":44},{"x":18},{"x":15},{"x":5},{"x":12},{"x":12},{"x":9},{"x":44},{"x":7}],"geoms":["histogram"],"x":"spend (dollars)","y":"count","code":{"histogram":"ggplot(spend_df, aes(spend)) +\n  geom_histogram(bins = 8)"}}

=== step === concept
::eyebrow The three questions
## What "shape" really means

A distribution's **shape** is the silhouette its histogram traces out, and you read it by asking three questions in order:

1. **How many peaks?** One hump, two, or more. This is the distribution's **modality**.
2. **Is it symmetric or skewed?** A symmetric shape looks the same flipped left-to-right (a bell). A **skewed** shape leans, with one tail longer than the other.
3. **How heavy are the tails?** Do extreme values trail off quickly, or is there a long thin reach toward one side?

Let us build Maya's spend and look. Each lesson runs in a fresh R session, so we create the data right here (run this once); it is fixed, so every number below is exact.

```r
# What 50 customers each spent on one visit to Maya's bakery, in dollars
spend <- c(28, 25, 37, 8, 13, 10, 3, 27, 13, 12, 14, 16, 4, 41, 34,
           26, 9, 12, 6, 78, 24, 6, 35, 18, 15, 3, 25, 30, 18, 10,
           3, 6, 21, 9, 6, 14, 3, 7, 9, 7, 7, 44, 18, 15, 5,
           12, 12, 9, 44, 7)
spend_df <- data.frame(spend = spend)   # a tidy frame for ggplot later

length(spend)
#> [1] 50
summary(spend)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    3.00    7.00   12.50   17.16   24.75   78.00
```

Now read the histogram against the three questions: **one** peak (unimodal), clearly **skewed** to the right (the bulk piles up on the low side, the tail leans right), and a **heavy right tail**, that lone $78 catering order sits far from everyone else. That last point is the same $78 the `summary` reports as the maximum, more than four times the median.

::widget chart-plotter {"data":[{"x":28},{"x":25},{"x":37},{"x":8},{"x":13},{"x":10},{"x":3},{"x":27},{"x":13},{"x":12},{"x":14},{"x":16},{"x":4},{"x":41},{"x":34},{"x":26},{"x":9},{"x":12},{"x":6},{"x":78},{"x":24},{"x":6},{"x":35},{"x":18},{"x":15},{"x":3},{"x":25},{"x":30},{"x":18},{"x":10},{"x":3},{"x":6},{"x":21},{"x":9},{"x":6},{"x":14},{"x":3},{"x":7},{"x":9},{"x":7},{"x":7},{"x":44},{"x":18},{"x":15},{"x":5},{"x":12},{"x":12},{"x":9},{"x":44},{"x":7}],"geoms":["histogram"],"x":"spend (dollars)","y":"count","code":{"histogram":"ggplot(spend_df, aes(spend)) +\n  geom_histogram(bins = 8)"}}

=== step === concept
::eyebrow When one peak becomes two
## Two peaks usually mean two groups

The first question, **how many peaks**, is worth a closer look, because the answer often hides a story. A shape with one peak is **unimodal**; with two distinct peaks it is **bimodal**; with several, **multimodal**. And a second peak is almost always a clue that **two different groups have been mixed into one column.**

Maya actually serves two crowds: a quick **morning** coffee-and-pastry crowd with small tickets, and a **lunch** crowd buying sandwiches and boxes with bigger tickets. Pool their spend into one variable and you get two humps with a valley between them:

```r
# the morning coffee crowd vs the bigger lunch crowd
coffee <- c(4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 9, 10)
lunch  <- c(14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22, 24)
visits <- data.frame(
  spend   = c(coffee, lunch),
  daypart = rep(c("morning", "lunch"), c(length(coffee), length(lunch)))
)

tapply(visits$spend, visits$daypart, median)   # a typical ticket in each crowd
#>   lunch morning
#>    17.5     6.5
```

The two crowds have very different typical tickets ($17.50 versus $6.50), so combined they make two peaks. The histogram below shows the valley around $11 to $13, exactly where neither crowd lives.

::widget chart-plotter {"data":[{"x":4},{"x":4},{"x":5},{"x":5},{"x":5},{"x":6},{"x":6},{"x":6},{"x":7},{"x":7},{"x":7},{"x":8},{"x":8},{"x":9},{"x":9},{"x":10},{"x":14},{"x":15},{"x":15},{"x":16},{"x":16},{"x":17},{"x":17},{"x":18},{"x":18},{"x":19},{"x":20},{"x":21},{"x":22},{"x":24}],"geoms":["histogram"],"x":"spend (dollars)","y":"count","code":{"histogram":"ggplot(visits, aes(spend)) +\n  geom_histogram(bins = 8)"}}

[NOTE]
A single summary (one mean, one distribution model) assumes **one** population. When you see two peaks, stop and ask what subgroup each peak is, then analyze them separately. Bimodality is the histogram telling you the average is describing nobody.

=== step === concept
::eyebrow Putting a number on lopsidedness
## Skew, made precise

Back to the single-peaked spend. We said it leans **right**. Here is the precise vocabulary: a distribution is **right-skewed** (or positively skewed) when its long tail points toward larger values, and **left-skewed** when the long tail points toward smaller values. Maya's spend is right-skewed: a few big tickets stretch the high end.

You already met the quickest diagnostic in Lesson 1. The **mean** is pulled toward the long tail, while the **median** (the middle value) resists it, so the gap between them reveals the skew:

```r
mean(spend)      # dragged up by the big tickets
#> [1] 17.16
median(spend)    # the middle customer
#> [1] 12.5
```

The mean ($17.16) sits well above the median ($12.50): the textbook signature of right skew. To turn that into a single comparable number, use the **skewness coefficient** \(g_1\):

\[ g_1 = \frac{\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^3}{\left[\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^2\right]^{3/2}} \]

where \(n\) is the number of customers (50 here), \(x_i\) is the \(i\)-th customer's spend, and \(\bar{x}\) is the mean. The cubed deviation \((x_i - \bar{x})^3\) **keeps its sign**, so values far out in the right tail (large and positive) dominate the sum: \(g_1 > 0\) means right skew, \(g_1 < 0\) means left skew, and \(g_1 \approx 0\) means symmetric. Dividing by the spread (the denominator) makes it unitless, so it compares across variables.

```r
skewness <- function(x) {
  n <- length(x); m <- mean(x)
  (sum((x - m)^3) / n) / (sum((x - m)^2) / n)^1.5
}
round(skewness(spend), 2)
#> [1] 1.92
```

A \(g_1\) of 1.92 is strong right skew (a rough rule: past about \(\pm 1\) is "strongly skewed"). The boxplot says the same thing a second way: the box (the middle 50%) sits low, while the upper whisker and the points beyond it stretch far up the dollar axis.

::widget chart-plotter {"data":[{"y":28},{"y":25},{"y":37},{"y":8},{"y":13},{"y":10},{"y":3},{"y":27},{"y":13},{"y":12},{"y":14},{"y":16},{"y":4},{"y":41},{"y":34},{"y":26},{"y":9},{"y":12},{"y":6},{"y":78},{"y":24},{"y":6},{"y":35},{"y":18},{"y":15},{"y":3},{"y":25},{"y":30},{"y":18},{"y":10},{"y":3},{"y":6},{"y":21},{"y":9},{"y":6},{"y":14},{"y":3},{"y":7},{"y":9},{"y":7},{"y":7},{"y":44},{"y":18},{"y":15},{"y":5},{"y":12},{"y":12},{"y":9},{"y":44},{"y":7}],"geoms":["boxplot"],"x":"","y":"spend (dollars)","code":{"boxplot":"ggplot(spend_df, aes(y = spend)) +\n  geom_boxplot()"}}

[KEY INSIGHT]
Mean **above** median, long tail to the **right**, \(g_1 > 0\): three names for the same lopsidedness. Mean **below** median is the mirror, a left skew. The bigger the mean-median gap, the stronger the skew.

=== step === quiz
::eyebrow Check yourself
## Read the gap

Maya signs up a courier and logs delivery times for 200 orders. The **mean** delivery time is **22 minutes**; the **median** is **15 minutes**. What does that gap tell you about the shape, and which number is the honest "typical" delivery time?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is left-skewed, because the mean is larger than the median ::no Check the direction: when the MEAN sits ABOVE the median, the long tail points to the RIGHT (a few very slow deliveries pull the average up). That is right skew, not left.
- It is right-skewed; a few slow deliveries pull the mean above the median, so the median (15 min) is the more honest typical time ::ok Exactly. Mean above median signals a long right tail. The median resists those few slow runs, so it describes an ordinary delivery far better than the 22-minute mean.
- It is symmetric, so the mean and median describe it equally well ::no They differ by 7 minutes (22 versus 15). A gap that size is the signature of skew; a symmetric distribution has its mean and median almost equal.

=== step === concept
::eyebrow A sharper normality check
## The Q-Q plot

The histogram shows skew, but for the question "is this variable **normal** (bell-shaped)?" there is a sharper tool: the **normal Q-Q plot** (quantile-quantile plot).

First, a **quantile**: the \(p\)-quantile of your data is the value below which a share \(p\) of it falls (the median is the 0.5 quantile). A Q-Q plot pairs each **sample quantile** (your sorted data) against the value a perfectly normal distribution would put at the same position, its **theoretical quantile** (written \(\Phi^{-1}(p)\), which just means the normal distribution's own \(p\)-quantile). Then it plots those pairs as points.

The payoff is one simple reading rule: **if the data is normal, the points fall on a straight line.** Systematic departures name the shape. An **upward bend at the top right** means the high values climb faster than a normal tail would, that is a heavy right tail, our skew.

```r
library(ggplot2)
ggplot(spend_df, aes(sample = spend)) +
  stat_qq() +          # one point per customer: sample vs normal quantile
  stat_qq_line()       # the straight line normal data would follow
```

In the plot below the points sag below the line at the low end and then swing sharply above it on the right, the $44 and $78 tickets are far heavier than a normal distribution allows. That bow away from the line is right skew, seen yet another way.

::widget chart-plotter {"data":[{"x":-2.33,"y":3},{"x":-1.88,"y":3},{"x":-1.64,"y":3},{"x":-1.48,"y":3},{"x":-1.34,"y":4},{"x":-1.23,"y":5},{"x":-1.13,"y":6},{"x":-1.04,"y":6},{"x":-0.95,"y":6},{"x":-0.88,"y":6},{"x":-0.81,"y":7},{"x":-0.74,"y":7},{"x":-0.67,"y":7},{"x":-0.61,"y":7},{"x":-0.55,"y":8},{"x":-0.5,"y":9},{"x":-0.44,"y":9},{"x":-0.39,"y":9},{"x":-0.33,"y":9},{"x":-0.28,"y":10},{"x":-0.23,"y":10},{"x":-0.18,"y":12},{"x":-0.13,"y":12},{"x":-0.08,"y":12},{"x":-0.03,"y":12},{"x":0.03,"y":13},{"x":0.08,"y":13},{"x":0.13,"y":14},{"x":0.18,"y":14},{"x":0.23,"y":15},{"x":0.28,"y":15},{"x":0.33,"y":16},{"x":0.39,"y":18},{"x":0.44,"y":18},{"x":0.5,"y":18},{"x":0.55,"y":21},{"x":0.61,"y":24},{"x":0.67,"y":25},{"x":0.74,"y":25},{"x":0.81,"y":26},{"x":0.88,"y":27},{"x":0.95,"y":28},{"x":1.04,"y":30},{"x":1.13,"y":34},{"x":1.23,"y":35},{"x":1.34,"y":37},{"x":1.48,"y":41},{"x":1.64,"y":44},{"x":1.88,"y":44},{"x":2.33,"y":78}],"geoms":["point"],"x":"theoretical normal quantile","y":"sorted spend (dollars)","code":{"point":"ggplot(spend_df, aes(sample = spend)) +\n  stat_qq() + stat_qq_line()"}}

[NOTE]
The widget prints a correlation \(r\) out of habit (it does that for any scatter); ignore it here. For a Q-Q plot the only question is whether the points sit on a straight line, and these clearly curve upward at the right.

=== step === concept
::eyebrow The fix
## Taming skew: the ladder of powers

A right-skewed, all-positive variable can usually be straightened by replacing each value with a **power** of itself. This is Tukey's **ladder of powers**: stepping *down* the ladder, from the raw value to its square root, to its logarithm, to its reciprocal, squeezes large values harder than small ones, which pulls a long right tail back in.

The **logarithm** is the workhorse. Replacing each \(x\) with \(\ln x\) (the natural log) compresses the tail because the log grows so slowly: \(\ln 78 \approx 4.36\) is only about twice \(\ln 8 \approx 2.08\), even though $78 is nearly ten times $8. The far end gets pulled in much more than the body.

Compare the skewness of the raw spend with two transforms, using the `skewness()` you defined earlier:

```r
round(skewness(spend),       2)   # raw: strong right skew
#> [1] 1.92
round(skewness(log(spend)),  2)   # natural log: essentially symmetric
#> [1] 0.01
round(skewness(sqrt(spend)), 2)   # square root: helps, but only halfway
#> [1] 0.88
```

The log all but erases the skew (1.92 down to 0.01); the square root halves it but leaves a clear lean (0.88). The histogram of `log(spend)` is the proof, a tidy near-symmetric mound where the lopsided pile used to be:

::widget chart-plotter {"data":[{"x":3.33},{"x":3.22},{"x":3.61},{"x":2.08},{"x":2.56},{"x":2.3},{"x":1.1},{"x":3.3},{"x":2.56},{"x":2.48},{"x":2.64},{"x":2.77},{"x":1.39},{"x":3.71},{"x":3.53},{"x":3.26},{"x":2.2},{"x":2.48},{"x":1.79},{"x":4.36},{"x":3.18},{"x":1.79},{"x":3.56},{"x":2.89},{"x":2.71},{"x":1.1},{"x":3.22},{"x":3.4},{"x":2.89},{"x":2.3},{"x":1.1},{"x":1.79},{"x":3.04},{"x":2.2},{"x":1.79},{"x":2.64},{"x":1.1},{"x":1.95},{"x":2.2},{"x":1.95},{"x":1.95},{"x":3.78},{"x":2.89},{"x":2.71},{"x":1.61},{"x":2.48},{"x":2.48},{"x":2.2},{"x":3.78},{"x":1.95}],"geoms":["histogram"],"x":"log(spend)","y":"count","code":{"histogram":"ggplot(spend_df, aes(log(spend))) +\n  geom_histogram(bins = 8)"}}

[KEY INSIGHT]
Pick the **mildest** transform that does the job. Square root for mild right skew and for counts; the log for strong right skew and for multiplicative quantities like money, populations, or concentrations. The reciprocal is the strongest and is rarely needed.

=== step === tryit
::eyebrow Your turn
## Straighten Maya's spend

You just saw that raw spend is strongly right-skewed (\(g_1 = 1.92\)) and that one transform pulled its skewness almost to zero. Apply **that** transform inside `skewness()` and confirm the variable is now symmetric. Fill in the blank with the function that compresses a long right tail.

```r
# transform spend so its skewness collapses toward 0
round(skewness(____(spend)), 2)
```
::check {"regex":"\\blog\\s*\\(","gate":true,"difficulty":"intermediate","ok":"That is it: log() compresses the long right tail, dropping skewness from 1.92 to about 0.01. The logged spend is symmetric enough for the methods in later courses.","no":"Use the natural log, log(): round(skewness(log(spend)), 2)."}
::solution
```r
round(skewness(log(spend)), 2)
#> [1] 0.01
```

=== step === concept
::eyebrow Letting the data choose
## Box-Cox: the whole ladder at once

Instead of guessing between log, square root and reciprocal, the **Box-Cox** transform indexes the entire ladder with one number, \(\lambda\) (lambda), and lets the data pick the \(\lambda\) that makes the result as close to normal as possible:

\[ x^{(\lambda)} = \frac{x^{\lambda} - 1}{\lambda} \;\; (\lambda \neq 0), \qquad x^{(0)} = \ln x \]

where \(\lambda\) is the power on the ladder: \(\lambda = 1\) leaves the data essentially unchanged, \(\lambda = 0.5\) is the square root, and \(\lambda = 0\) is the log. R's `MASS::boxcox()` evaluates a grid of \(\lambda\) values and returns the one with the highest likelihood of normality.

```r
library(MASS)
bc <- boxcox(spend ~ 1, lambda = seq(-2, 2, 0.1), plotit = FALSE)
bc$x[which.max(bc$y)]   # the best lambda on the grid
#> [1] 0
```

The peak sits at \(\lambda = 0\): Box-Cox independently confirms that the **log** was the right call. Two cautions before you reach for any of these:

- **Positivity.** The log and most of the ladder need values **strictly above zero**. Maya's smallest spend is $3, so we are safe; with zeros or negatives, shift the data first or use `log1p(x)`, which computes \(\ln(1 + x)\) and is defined at zero.
- **Back-transform to report.** A model fitted on `log(spend)` predicts in log-dollars. Apply `exp()` to bring predictions back to dollars before you tell Maya anything.

Here is the whole routine as a checklist you can run on any skewed variable:

::widget process-flow {"steps":[{"title":"Plot the shape","sub":"histogram plus Q-Q plot, then name it: skewed, heavy-tailed, or fine"},{"title":"Right-skewed and positive?","sub":"the exact case a power transform is built to fix"},{"title":"Try the ladder","sub":"square root, then log; compare the skewness of each"},{"title":"Re-check","sub":"new histogram and Q-Q plot: is it straighter and more symmetric?"},{"title":"Keep and note it","sub":"record the transform so you can back-transform results later"}]}

=== step === quiz
::eyebrow Check yourself
## Mind the zeros

A colleague has a strongly right-skewed `income` column that includes some **zeros** (people with no income that month) and wants to `log()`-transform it to fix the skew. What is the problem, and the safest fix?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- No problem: log() handles zero by returning zero ::no log(0) is negative infinity (-Inf), not 0, and a single -Inf poisons every later mean, model and plot. Zeros are exactly what plain log() cannot take.
- Drop every zero-income row first, then take the log of what remains ::no Deleting the zeros silently changes who is in the dataset and biases the result, the same trap as quietly deleting outliers. Keep the rows; adjust the transform instead.
- log() is undefined at zero, so use log1p(income) = log(1 + income): it is defined at zero and barely changes the larger values ::ok Right. The ladder needs values above zero; log1p adds 1 before logging, so zero maps to 0 and no rows are dropped. Always check the minimum before you transform.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take distribution shape and transformations further:

- [R for Data Science (2e), Exploratory Data Analysis](https://r4ds.hadley.nz/eda) - the free canonical chapter on variation and distributions, reading shape and skew in a tidyverse workflow.
- [OpenIntro Statistics (free), Chapter 2](https://www.openintro.org/book/os/) - histograms, skew, modality and shape explained from scratch with worked examples.
- [NIST/SEMATECH e-Handbook: Quantile-Quantile Plot](https://www.itl.nist.gov/div898/handbook/eda/section3/qqplot.htm) - the authoritative how-to-read reference for the Q-Q plot you used here.
- [Box and Cox (1964), An Analysis of Transformations, JRSS-B](https://doi.org/10.1111/j.2517-6161.1964.tb00553.x) - the original paper that introduced the power-transform family R computes for you.

=== step === complete
## Lesson 6 complete

You can now read a distribution's **shape** and act on it. You named the three features (peaks, symmetry, tails), used **modality** to catch two crowds hiding in one column, pinned down **right skew** with the mean-median gap and the skewness coefficient \(g_1 = 1.92\), checked normality with a **Q-Q plot**, and straightened Maya's spend with a **log** transform (skewness 1.92 to 0.01), which **Box-Cox** confirmed at \(\lambda = 0\). You also know the two rules that keep transforms honest: values must be positive, and results must be back-transformed to report.

Next, Lesson 7: Multivariate EDA with pairs and PCA. So far you have looked at variables one or two at a time. Maya now has a dozen columns at once, and you will see them all together with a scatterplot matrix and a correlation heatmap, then compress the correlated ones into a few **principal components** to find the structure hiding in many dimensions.
