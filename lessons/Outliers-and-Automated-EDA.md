---
title: "Exploratory Data Analysis Lesson 3: Outliers & Automated EDA"
description: "Spot outliers with the 1.5xIQR rule and a boxplot, decide whether to keep, cap or drop them, then scan a whole data frame in one call with skimr and DataExplorer."
keywords: "outliers in R, IQR rule, boxplot outliers, automated EDA, skimr, DataExplorer, winsorize, robust statistics, trimmed mean, exploratory data analysis"
post_type: "LESSON"
curriculum_id: "2.3.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "3"
course_total: "3"
course_landing: "EDA-Course.html"
course_next: ""
course_prev: "Two-Variables-and-Correlation-in-R.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## The one value that breaks everything

Across Lessons 1 and 2 you met Maya's bakery and one number that kept causing trouble: a single $905 day, a one-off street-festival order. It dragged her *average* revenue above a typical day (Lesson 1), and a stray point like it can quietly distort a correlation (Lesson 2). That lone value has a name, an **outlier**, and handling it well is the difference between an honest analysis and a misleading one.

This lesson tackles the two things real data forces on you. First, **finding outliers and deciding what to do** with them, like Maya's $905 day. Second, doing the whole first look **at scale**: Maya had 30 numbers you could read by eye, but real datasets have dozens of columns and thousands of rows. The boxplot below is that $905 day, caught: notice it sitting alone, far past the whisker.

By the end of this lesson you will be able to:

- Spot outliers with the **1.5 x IQR rule** and a **boxplot**, in R
- Decide what to do with one: investigate, then keep, cap, transform or drop, and **document** it
- Scan an entire data frame in a single command with **skimr** and **DataExplorer**

**Prerequisites:** you can run R and load a package with `library()`, and you have met one-variable EDA in [Lesson 1](An-EDA-Framework-and-One-Variable.html) (histogram, mean vs median, IQR, the boxplot) and correlation in [Lesson 2](Two-Variables-and-Correlation-in-R.html). Every new term is defined as it appears.

::widget chart-plotter {"data":[{"y":195},{"y":250},{"y":180},{"y":300},{"y":360},{"y":225},{"y":410},{"y":210},{"y":300},{"y":275},{"y":320},{"y":235},{"y":190},{"y":355},{"y":265},{"y":205},{"y":250},{"y":330},{"y":300},{"y":240},{"y":260},{"y":400},{"y":285},{"y":230},{"y":315},{"y":290},{"y":255},{"y":905},{"y":340},{"y":270}],"geoms":["boxplot"],"x":"","y":"revenue","code":{"boxplot":"ggplot(bakery, aes(y = revenue)) +\n  geom_boxplot()"}}

=== step === concept
::eyebrow The troublemaker
## What an outlier is, and why it matters

An **outlier** is an observation that sits far away from the rest of the data, far enough that it looks like it might belong to a different story. Maya's $905 festival day is the textbook case: 29 ordinary days between $180 and $410, and then one value more than double the next-highest.

Why fuss over a single point? Because one outlier quietly bends the summaries you rely on:

- It **drags the mean.** From Lesson 1, Maya's mean was $298 but her median $273; drop the festival day and the mean falls to $277 while the median barely flinches.
- It **inflates the spread.** The standard deviation and the range are stretched wide by one far point; the IQR, the middle-half width, is not.
- It can **fake or hide a correlation.** As you saw in Lesson 2, a single stray point can swing Pearson's `r` up or down.
- It can **wreck a model** that minimises squared error, because the squared distance to a far-away point is enormous.

[KEY INSIGHT]
An outlier is not automatically a mistake to delete. It is a flag that says *look closer*. Sometimes it is a typo; sometimes it is the most interesting day of the month. Your job is to find it, understand it, and then choose, on purpose, what to do.

=== step === concept
::eyebrow Find it with a rule
## The 1.5 x IQR rule, and the boxplot that draws it

In Lesson 1 you flagged the $905 day with the 1.5 x IQR rule. Here it is in full, because it is the workhorse of outlier detection.

Recall the quartiles: \(Q_1\) is the value a quarter of the days fall below (the 25th percentile), \(Q_3\) the value three-quarters fall below (the 75th percentile), and the **interquartile range** \(\text{IQR} = Q_3 - Q_1\) is the width of the middle half of the data. The rule draws two **fences**, a distance of \(1.5 \times \text{IQR}\) beyond each quartile:

\[ \text{lower fence} = Q_1 - 1.5 \times \text{IQR}, \qquad \text{upper fence} = Q_3 + 1.5 \times \text{IQR} \]

Any value beyond a fence is flagged as an outlier. A **boxplot** is just a picture of this rule: the box spans \(Q_1\) to \(Q_3\), the line inside is the median, the whiskers reach to the most extreme values still *inside* the fences, and anything past a whisker is drawn as a separate dot. That lone dot above Maya's box is the $905 day.

Each lesson runs in a fresh R session, so let us build Maya's revenue here (run this once), then compute the fences and read off who is flagged:

```r
revenue <- c(195, 250, 180, 300, 360, 225, 410, 210, 300, 275,
             320, 235, 190, 355, 265, 205, 250, 330, 300, 240,
             260, 400, 285, 230, 315, 290, 255, 905, 340, 270)

q1    <- as.numeric(quantile(revenue, 0.25))   # 236.25, the 25th percentile
q3    <- as.numeric(quantile(revenue, 0.75))   # 318.75, the 75th percentile
iqr   <- IQR(revenue)                           # 82.5, the middle-half width
upper <- q3 + 1.5 * iqr
lower <- q1 - 1.5 * iqr
c(lower = lower, upper = upper)
#> lower upper
#> 112.5 442.5
revenue[revenue > upper | revenue < lower]      # the flagged day(s)
#> [1] 905
```

R will even hand you the flagged points directly, no fence arithmetic required:

```r
boxplot.stats(revenue)$out
#> [1] 905
```

[NOTE]
A second common rule uses the standard deviation: flag any value whose **z-score** \(z = \frac{x - \bar{x}}{s}\) (how many standard deviations \(s\) it sits from the mean \(\bar{x}\)) is bigger than about 3. It is quick, but fragile: the outlier inflates the very mean and SD it is being measured against, so a large enough outlier can hide itself. The IQR rule is built on quartiles, which an outlier barely moves, so it does not have that blind spot. That robustness is why boxplots use it.

::widget chart-plotter {"data":[{"y":195},{"y":250},{"y":180},{"y":300},{"y":360},{"y":225},{"y":410},{"y":210},{"y":300},{"y":275},{"y":320},{"y":235},{"y":190},{"y":355},{"y":265},{"y":205},{"y":250},{"y":330},{"y":300},{"y":240},{"y":260},{"y":400},{"y":285},{"y":230},{"y":315},{"y":290},{"y":255},{"y":905},{"y":340},{"y":270}],"geoms":["boxplot"],"x":"","y":"revenue","code":{"boxplot":"ggplot(bakery, aes(y = revenue)) +\n  geom_boxplot()"}}

=== step === quiz
::eyebrow Check yourself
## Is the biggest value always an outlier?

Maya's busiest *ordinary* Saturday brought in $410, the highest non-festival day. Does the 1.5 x IQR rule flag $410 as an outlier?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Yes: it is the largest ordinary value, so it must be an outlier ::no Being the maximum does not make a value an outlier. The rule only flags values *past the fence*, and the upper fence here is $442.50, so $410 sits comfortably inside the whisker.
- No: $410 is below the upper fence of $442.50, so the rule treats it as an ordinary day ::ok Exactly. Only values beyond a fence are flagged. $410 is less than $442.50, so it is inside the whisker; only the $905 festival day clears the fence.
- There is no way to tell without the mean and standard deviation ::no The IQR rule needs only the quartiles and the IQR, never the mean or SD. The upper fence is $442.50, and $410 falls below it, so the rule leaves it alone.

=== step === concept
::eyebrow What to do, step one
## A flagged value is a question, not a verdict

Finding an outlier is the easy part. Deciding what to do with it is where analyses are won or lost, and the worst move is to silently delete it because it is inconvenient.

Start with one question: **is this an error, or is it real?**

- An **error**: a data-entry typo ($9,050 fat-fingered for $905), a broken sensor, two rows merged into one, the wrong unit. These are genuinely wrong, and should be fixed or removed.
- A **genuine** value: a real, rare event. Maya's $905 day actually happened, it was a one-off street-festival order. It is not wrong, just unusual.

The only way to know which you are looking at is to **investigate**: open the row, check it against another record, ask whoever collected the data. Maya remembers the festival, so her $905 is genuine. Follow this same path every single time:

::widget process-flow {"steps":[{"title":"Spot","sub":"a boxplot or the IQR fences flag a suspicious value"},{"title":"Investigate","sub":"is it a data error or a genuine rare event?"},{"title":"Decide","sub":"fix, drop, cap, transform, or keep with robust stats"},{"title":"Document","sub":"write down what you did and why, every time"}]}

=== step === concept
::eyebrow What to do, step two
## Handling a genuine outlier

Once you know the $905 day is real, you have four honest options, and dropping it is rarely the best one.

**1. Keep it, and report robust summaries.** The median and IQR barely notice an outlier, so lead with them instead of the mean and SD. A **trimmed mean**, which chops a fixed fraction off each end before averaging, is another robust middle ground:

```r
mean(revenue)              # the festival day pulls this up
#> [1] 298.1667
median(revenue)            # the middle day barely moves
#> [1] 272.5
mean(revenue, trim = 0.1)  # drop the extreme 10% at each end, then average
#> [1] 277.7083
```

The plain mean claims a typical day is $298; the robust median and trimmed mean agree it is closer to $273 to $278.

**2. Cap it (winsorize).** Pull any value past the fence back *to* the fence. You keep the row but limit how far one point can pull a result:

```r
upper  <- as.numeric(quantile(revenue, 0.75)) + 1.5 * IQR(revenue)  # 442.5
capped <- pmin(revenue, upper)   # nothing may exceed the fence now
max(capped)
#> [1] 442.5
```

**3. Transform.** A log transform pulls in a long right tail so one big value no longer dominates, handy before computing a correlation or fitting a model.

**4. Drop it, but only with a written reason.** Legitimate when the value is a confirmed error, or genuinely outside the question you are answering (Maya might exclude the festival day to forecast an *ordinary* day). Never drop a value simply because it spoils a result.

[WARNING]
Whatever you choose, **write it down**. "Excluded the March 28 festival day ($905) when forecasting ordinary demand" is reproducible analysis. Quietly deleting the row is how an analysis becomes fiction.

=== step === tryit
::eyebrow Your turn
## Compute a robust typical day

You want one number for a typical day that the festival outlier cannot inflate. Use a trimmed mean: fill in the argument that tells `mean()` to chop a fraction off each end before averaging.

```r
# down-weight the festival day: trim 10% off each tail, then average
mean(revenue, ____ = 0.1)
```
::check {"regex":"trim\\s*=","gate":true,"difficulty":"beginner","ok":"That returns about $277.71, much closer to the median $272.50 than to the plain mean of $298.17. The trimmed mean ignores the extreme tails, so the festival day cannot drag it up.","no":"Use the trim argument: mean(revenue, trim = 0.1)."}
::solution
```r
mean(revenue, trim = 0.1)
#> [1] 277.7083
```

=== step === concept
::eyebrow Now do it for everything
## One command for the whole data frame

Everything so far worked on a single column of 30 numbers you could read by eye. Real data does not cooperate: Maya's full March log has several columns, and a serious dataset can have dozens of columns and thousands of rows. You cannot eyeball that. You need a tool that summarises **every column at once**.

First, build the full log here (run this once). It is Maya's `revenue` alongside daily `foot_traffic`, the `weather`, and `pastries_sold`, with one missing pastry count to keep things realistic:

```r
bakery <- data.frame(
  revenue       = revenue,          # the column you just cleaned
  foot_traffic  = c(110, 130, 95, 150, 175, 120, 195, 105, 150, 140,
                    160, 125, 100, 170, 135, 108, 128, 165, 150, 122,
                    132, 190, 145, 118, 158, 148, 130, 250, 168, 138),
  weather       = c("sunny", "cloudy", "rainy", "sunny", "sunny", "cloudy",
                    "sunny", "rainy", "sunny", "cloudy", "sunny", "cloudy",
                    "rainy", "sunny", "cloudy", "rainy", "cloudy", "sunny",
                    "sunny", "cloudy", "cloudy", "sunny", "sunny", "rainy",
                    "sunny", "cloudy", "cloudy", "sunny", "sunny", "cloudy"),
  pastries_sold = c(60, 78, 55, 92, 110, 70, 130, 64, 95, 85,
                    100, 72, NA, 108, 82, 62, 77, 102, 95, 74,
                    80, 125, 88, 70, 98, 90, 79, 210, 105, 84)
)
nrow(bakery); ncol(bakery)
#> [1] 30
#> [1] 4
```

The **skimr** package summarises the whole frame in one call. `skim()` groups the columns by type and, for each, reports the missing count, the mean and SD, the quartiles, and a tiny inline histogram:

```r
library(skimr)
skim(bakery)
#> -- Data Summary ------------------------
#>                            Values
#> Name                       bakery
#> Number of rows             30
#> Number of columns          4
#> Column type frequency:
#>   character                1
#>   numeric                  3
#>
#> -- Variable type: character ------------
#>   skim_variable n_missing complete_rate min max empty n_unique whitespace
#> 1 weather               0             1   5   6     0        3          0
#>
#> -- Variable type: numeric --------------
#>   skim_variable n_missing complete_rate  mean    sd  p0  p25  p50  p75 p100 hist
#> 1 revenue               0         1      298.  129.  180 236. 272. 319.  905 ▇▂▁▁▁
#> 2 foot_traffic          0         1      144.   32.4  95 123. 139  160.  250 ▆▇▃▁▁
#> 3 pastries_sold         1         0.967   91.0  29.4  55  74   85  100   210 ▇▆▁▁▁
```

Read what `skim()` surfaced for free. The `p` columns are percentiles: `p0` and `p100` are the minimum and maximum, and `p25`, `p50`, `p75` are exactly the quartiles \(Q_1\), median and \(Q_3\) from earlier. So the `revenue` row shows a maximum (`p100`) of 905 with a mean far above the median (`p50`) and a right-skewed `▇▂▁▁▁` sparkline: the festival outlier, flagged automatically. The `pastries_sold` row shows `n_missing` of 1 and a `complete_rate` of 0.967: the missing value, caught without your asking. One call did the entire first pass over the table.

A clean summary table like that beats squinting at raw console output. Toggle the two views below to feel the difference:

::widget styled-table {"cols":["variable","missing","complete_rate","mean","p50"],"rows":[["revenue",0,1,298,272.5],["foot_traffic",0,1,144,139],["pastries_sold",1,0.967,91,85]],"formats":{"complete_rate":"pct"},"title":"Bakery columns at a glance (skimr)","note":"One skim() call summarises every column."}

=== step === concept
::eyebrow The automated report
## DataExplorer: a full first pass in one function

skimr gives you the numbers; **DataExplorer** goes further and draws the whole report. Its fastest tool is `introduce()`, a one-row structural snapshot of the data:

```r
library(DataExplorer)
introduce(bakery)
#>   rows columns discrete_columns continuous_columns all_missing_columns
#> 1   30       4                1                  3                   0
#>   total_missing_values complete_rows total_observations memory_usage
#> 1                    1            29                120         2096
```

In one line it confirms the shape: 30 rows, 4 columns, 1 discrete (the `weather` text) and 3 continuous, exactly 1 missing value, and 29 complete rows. From there, DataExplorer can plot a histogram of every numeric column, bar charts of every categorical one, a correlation heatmap, and a missing-value map, then bundle them all into a single shareable HTML report:

```r-static
# the full visual report: one HTML file, a plot for every column.
# run this locally; it renders a document, so it needs a report engine.
library(DataExplorer)
create_report(bakery, output_file = "bakery_eda.html")
```

The histogram below is the kind of per-column picture that report draws automatically. It is Maya's revenue, with the festival day stranded in the lone far-right bin, the very same outlier surfacing yet again:

::widget chart-plotter {"data":[{"x":195},{"x":250},{"x":180},{"x":300},{"x":360},{"x":225},{"x":410},{"x":210},{"x":300},{"x":275},{"x":320},{"x":235},{"x":190},{"x":355},{"x":265},{"x":205},{"x":250},{"x":330},{"x":300},{"x":240},{"x":260},{"x":400},{"x":285},{"x":230},{"x":315},{"x":290},{"x":255},{"x":905},{"x":340},{"x":270}],"geoms":["histogram"],"x":"revenue","y":"count","code":{"histogram":"ggplot(bakery, aes(revenue)) +\n  geom_histogram(bins = 8)"}}

=== step === quiz
::eyebrow Check yourself
## What automated EDA is for

`skim()` and DataExplorer summarised Maya's whole table in seconds. Does that mean you can skip looking at the data yourself and just trust the automated report?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No: automated tools give you a fast first pass that tells you *where* to look, but you still investigate the surprises (the outlier, the missing value) yourself ::ok Exactly. The report flagged the $905 outlier and the missing pastry count in one call, but it cannot tell you the $905 was a real festival or what to do about it. Automation finds the questions; you answer them.
- Yes: a tool that summarises every column has already done the analysis, so reading the report is enough ::no The report *describes* the data, it does not *judge* it. It cannot know the $905 is a genuine festival day, decide whether to cap or keep it, or tell you a correlation is non-causal. Those judgements are still yours.
- Yes, as long as the dataset has no missing values ::no Missing values are only one kind of surprise. Outliers, skew, impossible values and lurking variables all need a human to interpret them, whether or not anything is missing.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Exploratory Data Analysis](https://r4ds.hadley.nz/eda) - the "Unusual values" section covers spotting outliers and the honest choices for handling them.
- [skimr documentation (rOpenSci)](https://docs.ropensci.org/skimr/) - the one-line whole-data-frame summary you used here, and how to customise what it reports.
- [DataExplorer documentation](https://boxuancui.github.io/DataExplorer/) - `introduce()`, the plotting functions, and the one-call `create_report()` automated report.
- [NIST/SEMATECH e-Handbook: detection of outliers](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) - the formal methods, from boxplot fences to Grubbs' test, and when each one applies.

=== step === complete
## Course complete

You can now handle the messy reality of real data. You learned what an outlier is and why it bends the mean, the spread and a correlation; detected one with the 1.5 x IQR fences and a boxplot; decided what to do with Maya's genuine $905 festival day (investigate, then keep with robust stats, cap, transform, or drop with a written reason); and scaled the whole first pass to an entire data frame with `skim()` and DataExplorer.

That completes Exploratory Data Analysis in R. Across three lessons you went from one variable (shape, center and spread), to two (scatterplots and correlation), to the surprises and the automation that make a real first look trustworthy. EDA is the habit every good analysis starts with, and it is the foundation the visualisation and modelling courses build on next.
