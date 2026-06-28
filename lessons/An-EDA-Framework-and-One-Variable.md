---
title: "Exploratory Data Analysis Lesson 1: Univariate EDA"
catalog_blurb: "Profile a new dataset one variable at a time."
description: "Learn a repeatable 7-step EDA framework, then analyze one variable at a time in R: distribution shape, center, spread, and how to read a histogram and a boxplot."
keywords: "exploratory data analysis, EDA in R, univariate analysis, histogram, boxplot, mean vs median, standard deviation, IQR, distribution, outliers"
post_type: "LESSON"
curriculum_id: "2.3.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "1"
course_total: "3"
course_landing: "EDA-Course.html"
course_next: "Two-Variables-and-Correlation-in-R.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## Univariate EDA
You can now get data into R, tidy it, and join tables together. So you are holding a clean data frame. The very next question, before any model or fancy chart, is the simplest one there is: what is actually in it?

Meet Maya, who runs a small neighbourhood bakery. She has just handed you one column: her daily revenue for the 30 days of March, in dollars. Below is every one of those 30 days drawn as a histogram. By the end of this lesson you will read a picture like this at a glance, and back it up with numbers.

By the end you will be able to:

- Follow a repeatable 7-step framework for exploring any new dataset
- Read one variable's **distribution** from a histogram: its shape, its typical value, and any surprises
- Summarise that variable with the right numbers (mean, median, spread) and a boxplot

**Prerequisites:** you can run R and load a package with `library()`, and you have a tidy data frame in hand (the dplyr and joins courses got you here). Every other term is defined as it appears.

::widget chart-plotter {"data":[{"x":195},{"x":250},{"x":180},{"x":300},{"x":360},{"x":225},{"x":410},{"x":210},{"x":300},{"x":275},{"x":320},{"x":235},{"x":190},{"x":355},{"x":265},{"x":205},{"x":250},{"x":330},{"x":300},{"x":240},{"x":260},{"x":400},{"x":285},{"x":230},{"x":315},{"x":290},{"x":255},{"x":905},{"x":340},{"x":270}],"geoms":["histogram"],"x":"revenue","y":"count","code":{"histogram":"ggplot(bakery, aes(revenue)) +\n  geom_histogram(bins = 8)"}}

=== step === concept
::eyebrow The map
## EDA is a disciplined first look

Exploratory Data Analysis (EDA) is the work of getting to know a dataset before you commit to any conclusion. Its goal is to *describe and question*, not to confirm. You are not trying to prove Maya's bakery is doing well; you are trying to see, honestly, what the numbers say, including the parts that surprise you.

It helps to follow the same path every time. Here is a 7-step framework you can run on any new dataset:

::widget process-flow {"steps":[{"title":"Question","sub":"what do you need to learn from this data?"},{"title":"Structure","sub":"how many rows and columns, and what type is each?"},{"title":"Clean","sub":"missing values, duplicates, obvious errors"},{"title":"One variable","sub":"shape, center and spread, one column at a time"},{"title":"Two variables","sub":"relationships and correlation between pairs"},{"title":"Outliers","sub":"find the surprises and decide what to do"},{"title":"Summarise","sub":"write down findings and the next question"}]}

[NOTE]
This lesson lives at step 4, **one variable at a time**, which is where real understanding starts. Step 5 (two variables and correlation) and step 6 (outliers, at scale) are the next two lessons in this course. You already met steps 2 and 3 in the import and tidy lessons.

=== step === quiz
::eyebrow Check yourself
## What is EDA for?

Maya hopes March was a good month. You have just imported and tidied her data. What is the first job of exploratory data analysis?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- To find the numbers that prove March was a good month ::no That is confirmatory analysis, and it is how you fool yourself. EDA's job is to look without deciding the answer in advance; the data may say March was ordinary, or odd, and you want to see that.
- To understand what the data actually contains, its shape, typical values and surprises, before drawing conclusions ::ok Exactly. EDA is an honest first look: describe and question the data so that any later claim or model rests on what is really there.
- To build the final predictive model as quickly as possible ::no Modeling comes later, and a model built on data you have not looked at is a model built on hidden surprises. Explore first.

=== step === concept
::eyebrow One variable
## The shape of a single column

Univariate analysis just means looking at **one variable at a time**, one column on its own. Maya's `revenue` column is 30 numbers, so let us build it in R and take a first glance. Each lesson runs in a fresh R session, so we create the data right here (run this once):

```r
# Maya's daily bakery revenue for the 30 days of March, in dollars
revenue <- c(195, 250, 180, 300, 360, 225, 410, 210, 300, 275,
             320, 235, 190, 355, 265, 205, 250, 330, 300, 240,
             260, 400, 285, 230, 315, 290, 255, 905, 340, 270)

length(revenue)   # how many days
#> [1] 30
head(revenue)     # peek at the first six days
#> [1] 195 250 180 300 360 225
```

Thirty numbers are hard to feel by reading them. So we draw them. A **histogram** chops the range of values into equal-width slices called **bins**, then draws a bar for each bin whose height is the count of days that fell in it. The shape of those bars is the variable's **distribution**.

::widget chart-plotter {"data":[{"x":195},{"x":250},{"x":180},{"x":300},{"x":360},{"x":225},{"x":410},{"x":210},{"x":300},{"x":275},{"x":320},{"x":235},{"x":190},{"x":355},{"x":265},{"x":205},{"x":250},{"x":330},{"x":300},{"x":240},{"x":260},{"x":400},{"x":285},{"x":230},{"x":315},{"x":290},{"x":255},{"x":905},{"x":340},{"x":270}],"geoms":["histogram"],"x":"revenue","y":"count","code":{"histogram":"ggplot(bakery, aes(revenue)) +\n  geom_histogram(bins = 8)"}}

Three things to read off this shape:

- **Where the bulk sits:** most days cluster between about $200 and $350. That is a typical day at Maya's bakery.
- **Skew:** the bars trail off to the right, a long thin tail. A distribution with a long right tail is called **right-skewed** (or positively skewed). Bakery revenue is skewed because a normal day has a floor near zero but a great day has no ceiling.
- **A lone bar far to the right:** one day sits near $900, all by itself, with empty space before it. Hold onto that day; it is going to matter for every number we compute next.

=== step === tryit
::eyebrow Your turn
## Draw the histogram in R

The widget above showed you the shape; now make it yourself. In **ggplot2** you name the data, map `revenue` to the x-axis with `aes()`, then add a **geom** (a geometric layer) for the chart type you want. Add the histogram layer. Fill in the blank.

```r
library(ggplot2)
bakery <- data.frame(revenue = revenue)

ggplot(bakery, aes(x = revenue)) +
  ____                              # add the histogram layer, try bins = 8
```
::check {"regex":"geom_histogram","gate":true,"difficulty":"beginner","ok":"That is the histogram: geom_histogram() bins revenue and draws a bar per bin. Try changing bins to 5 or 15 to see how the picture coarsens or sharpens.","no":"Add the histogram geom: geom_histogram(bins = 8)."}
::solution
```r
library(ggplot2)
bakery <- data.frame(revenue = revenue)

ggplot(bakery, aes(x = revenue)) +
  geom_histogram(bins = 8)
```

=== step === concept
::eyebrow Center
## The typical value: mean vs median

The first number anyone wants is the **center**: what is a typical day worth? There are two common answers, and the gap between them is the whole story.

The **mean** (the everyday "average") adds up every value and divides by how many there are. For \(n\) days with revenues \(x_1, x_2, \ldots, x_n\),

\[ \bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i \]

where \(\bar{x}\) is the mean, \(n\) is the number of days (30 here), and \(x_i\) is the revenue on day \(i\).

The **median** is the middle value: sort the days from smallest to largest and take the one in the middle (with an even count, the average of the two middle ones). Half the days fall below the median, half above.

```r
mean(revenue)     # the average day
#> [1] 298.1667
median(revenue)   # the middle day
#> [1] 272.5
```

The mean ($298) sits well above the median ($273). That gap is the right skew talking: the one $905 festival day drags the *average* upward, while the *middle* day barely notices it. To prove it, drop that single day and recompute:

```r
# drop the one festival day and recompute
ordinary <- revenue[revenue < 900]
mean(ordinary)    # the average falls a lot
#> [1] 277.2414
median(ordinary)  # the middle hardly moves
#> [1] 270
```

[KEY INSIGHT]
The median is **robust**: one extreme value can swing the mean by $21 here but the median by only $2.50. When a distribution is skewed or has outliers, the median is usually the more honest "typical value."

=== step === quiz
::eyebrow Check yourself
## Which number should Maya use?

Maya wants one number for a *typical* day's revenue, to plan how much dough to mix each morning. The $905 day was a one-off street-festival order she will not see again. Which summary should she rely on, and why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The median ($273), because it ignores how extreme the festival day was and reflects an ordinary middle day ::ok Right. The median is resistant to that single huge day, so it describes a normal morning far better than the mean does.
- The mean ($298), because the average always gives the most complete picture ::no The mean is pulled upward by the one festival day she will not repeat, so planning dough around $298 would leave her over-baking most mornings. With skew or outliers, the average is not the typical value.
- It does not matter, the mean and median are basically the same number ::no Here they differ by $25, and the reason matters: the gap is the skew. Treating them as interchangeable hides exactly the surprise EDA is meant to find.

=== step === concept
::eyebrow Spread
## How much days vary

A center alone can mislead: two bakeries can both average $298 a day, one steady and one wild. **Spread** measures how much the values bounce around the center. Three measures, from crudest to most useful:

The **range** is just the largest value minus the smallest. The **standard deviation** is the typical distance of a day from the mean. It is the square root of the **variance**, the average squared distance from the mean:

\[ s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2 \qquad s = \sqrt{s^2} \]

where \(s^2\) is the variance, \(s\) is the standard deviation, and \(x_i - \bar{x}\) is how far each day sits from the mean. (We divide by \(n-1\), not \(n\), so a sample gives an unbiased estimate; R does this for you.) The **IQR** (interquartile range) is the width of the middle 50% of the data. Sort the days and split them into four equal quarters; the three cut points are the **quartiles**. So \(Q_1\) (the 25th percentile) is the value a quarter of the days fall below, \(Q_3\) (the 75th percentile) the value three-quarters fall below, and the IQR is the gap between them, \(\text{IQR} = Q_3 - Q_1\).

```r
diff(range(revenue))   # max minus min, the full spread
#> [1] 725
sd(revenue)            # typical distance from the mean
#> [1] 128.9847
IQR(revenue)           # width of the middle 50% of days
#> [1] 82.5
```

[KEY INSIGHT]
Look at the gap: the IQR says the middle half of Maya's days span just $82.50, but the standard deviation is a huge $129 and the range a wild $725. Like the mean, the range and standard deviation are inflated by that one festival day. The **IQR is robust**, it throws away the extreme tails, so it describes an ordinary day's variation honestly.

=== step === widget
::eyebrow Center and spread, in one picture
## The boxplot and the five-number summary

Mean, median, spread: a boxplot shows them all at once. It is built from the **five-number summary**, the minimum, the three quartiles, and the maximum:

```r
quantile(revenue)   # min, Q1, median, Q3, max
#>     0%    25%    50%    75%   100%
#> 180.00 236.25 272.50 318.75 905.00
```

In the boxplot below, the **box** spans Q1 to Q3 (that middle-50% IQR), the **line inside the box** is the median, and the **whiskers** reach out toward the extremes:

::widget chart-plotter {"data":[{"y":195},{"y":250},{"y":180},{"y":300},{"y":360},{"y":225},{"y":410},{"y":210},{"y":300},{"y":275},{"y":320},{"y":235},{"y":190},{"y":355},{"y":265},{"y":205},{"y":250},{"y":330},{"y":300},{"y":240},{"y":260},{"y":400},{"y":285},{"y":230},{"y":315},{"y":290},{"y":255},{"y":905},{"y":340},{"y":270}],"geoms":["boxplot"],"x":"","y":"revenue","code":{"boxplot":"ggplot(bakery, aes(y = revenue)) +\n  geom_boxplot()"}}

A short box low down with a long reach upward is the same right skew you saw in the histogram, said a second way. There is also a precise rule for "surprise": a value is flagged as an **outlier** when it sits more than \(1.5 \times \text{IQR}\) beyond Q3 (or below Q1). R's own `boxplot()` draws any such value as a separate point past the whisker, and for Maya's data that is exactly the $905 festival day. You will pin it down in code next.

=== step === tryit
::eyebrow Your turn
## Flag the outlier with the 1.5xIQR rule

The upper outlier fence is \(Q_3 + 1.5 \times \text{IQR}\). Compute it for Maya's revenue, then count how many days exceed it. Fill in the blank with the function that returns the interquartile range.

```r
q3    <- as.numeric(quantile(revenue, 0.75))   # the 75th percentile, 318.75
fence <- q3 + 1.5 * ____                        # the upper outlier fence
fence
sum(revenue > fence)                            # how many days are flagged
```
::check {"regex":"IQR\\(\\s*revenue\\s*\\)","gate":true,"difficulty":"intermediate","ok":"That gives a fence of 442.5, and exactly one day (the $905 festival) sits above it. You found the outlier with a rule, not a guess.","no":"Use IQR(revenue): the fence is q3 + 1.5 * IQR(revenue)."}
::solution
```r
q3    <- as.numeric(quantile(revenue, 0.75))
fence <- q3 + 1.5 * IQR(revenue)
fence
#> [1] 442.5
sum(revenue > fence)
#> [1] 1
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Exploratory Data Analysis](https://r4ds.hadley.nz/eda) - the canonical free chapter on EDA in R: variation, distributions, and the questions to ask.
- [NIST/SEMATECH e-Handbook of Statistical Methods, EDA](https://www.itl.nist.gov/div898/handbook/eda/eda.htm) - the authoritative reference on EDA techniques and the philosophy behind looking before testing.
- [OpenIntro Statistics (free)](https://www.openintro.org/book/os/) - chapter 2 explains center, spread, histograms and boxplots from scratch, with worked examples.
- [ggplot2 reference: geom_histogram()](https://ggplot2.tidyverse.org/reference/geom_histogram.html) - every option for the histogram you built, including binning and `binwidth`.

=== step === complete
## Lesson 1 complete

You have a repeatable way to meet any dataset, and you can now describe a single variable properly. You ran the 7-step EDA framework, read a histogram for shape and skew, chose the median over the mean when an outlier was lurking, measured spread with the robust IQR, and flagged the $905 festival day with the 1.5xIQR rule.

Next, Lesson 2: Two variables and correlation. Maya does not just want to know how revenue behaves on its own, she wants to know what moves with it, foot traffic, weather, the day of the week. You will plot two variables against each other, read the relationship, and measure it with correlation.
