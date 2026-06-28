---
title: "Exploratory Data Analysis in R: Quiz"
description: "A short, graded check on the Exploratory Data Analysis in R section."
keywords: "R quiz, data analyst, da-eda, practice"
post_type: "LESSON"
curriculum_id: "2.3.9"
webr: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "9"
course_total: "9"
course_landing: "EDA-Course.html"
lesson_kind: "quiz"
course_prev: "Data-Quality-and-Validation.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished EDA: a framework for a first look, one and two variables, outliers, categorical and multivariate views, and data quality. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## Mean versus median
A column of household incomes is right-skewed (a few very high earners). How do the mean and median compare?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The mean sits above the median, pulled up by the high values. ::ok Correct: extreme highs drag the mean above the more robust median.
- The mean sits below the median. ::no Right skew pulls the mean up, not down.
- They are always equal. ::no They are equal only for a symmetric distribution.
- The median is undefined for skewed data. ::no The median is always defined.

=== step === quiz
::eyebrow Question 2 of 8
## Reading a correlation
Two variables have a correlation of 0.9. The safest reading is:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- One variable causes the other. ::no Correlation alone never establishes causation.
- They have a strong positive linear association. ::ok Correct: r measures linear association, nothing more.
- They are unrelated. ::no 0.9 is a strong relationship.
- The relationship is definitely a straight line. ::no High r is consistent with, but does not prove, linearity.

=== step === quiz
::eyebrow Question 3 of 8
## The 1.5 x IQR rule
The common boxplot rule flags a value as a potential outlier when it falls:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- More than one standard deviation from the mean. ::no That is a different (and very loose) rule.
- Outside the minimum and maximum. ::no Nothing is outside the min and max.
- Below Q1 minus 1.5 x IQR or above Q3 plus 1.5 x IQR. ::ok Correct: the fences sit 1.5 IQRs beyond the quartiles.
- Above the mean. ::no Half the data is above the mean; that is not an outlier rule.

=== step === quiz
::eyebrow Question 4 of 8
## A spurious link
Ice-cream sales and drowning rates rise together across the year. The best explanation is:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Ice cream causes drowning. ::no A classic spurious-causation trap.
- A third factor (hot weather) drives both. ::ok Correct: a confounder produces the correlation without a direct link.
- The correlation is a coincidence with no cause. ::no There is a cause, it is just shared, not direct.
- Drowning causes ice-cream sales. ::no Reversing it is no more sensible.

=== step === quiz
::eyebrow Question 5 of 8
## Taming skew
A strongly right-skewed variable is hard to model. A common first remedy is to:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Take a log transform. ::ok Correct: a log pulls in a long right tail toward symmetry.
- Delete the largest half of the rows. ::no That throws away real data.
- Multiply every value by 100. ::no Scaling does not change the shape.
- Round every value to an integer. ::no Rounding does not address skew.

=== step === quiz
::eyebrow Question 6 of 8
## What PCA finds
The first principal component of a dataset is:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The direction along which the data varies the most. ::ok Correct: PC1 captures the largest share of variance.
- The column with the most missing values. ::no PCA is about variance, not missingness.
- The average of every column. ::no That is the centroid, not a component.
- The least important variable. ::no PC1 is the most informative direction.

=== step === concept
::eyebrow Run it: summarise one variable
## One variable at a glance
Run this to see the centre, spread, and quartiles of `mpg`, then check its correlation with weight.

```r
summary(mtcars$mpg)

cor(mtcars$mpg, mtcars$wt)
```

The summary gives the five-number picture; the negative correlation says heavier cars get fewer miles per gallon.

=== step === concept
::eyebrow Run it: see the distribution
## Reading a histogram
Run this histogram of `mpg`, then change `bins` to 15 and run again to see the shape at a finer resolution.

```r
library(ggplot2)

ggplot(mtcars, aes(mpg)) +
  geom_histogram(bins = 8)
```

A histogram turns a column of numbers into a shape you can read at a glance.

=== step === complete
## Section complete
Strong work. You can profile a new dataset, read one and two variables, flag outliers, and judge data quality before modelling. Next: visualization with ggplot2.
