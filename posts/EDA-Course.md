---
title: "Exploratory Data Analysis in R: A Hands-On Interactive Course"
slug: "EDA-Course"
description: "Learn exploratory data analysis in R across eight interactive lessons: a repeatable 7-step framework, one variable at a time, correlation, outlier detection, categorical data, distribution shape and transformations, PCA, and data quality validation."
keywords: "exploratory data analysis in R, EDA in R, EDA framework, histogram in R, boxplot, five-number summary, IQR rule, Pearson correlation, correlation matrix, outlier detection in R, z-score, modified z-score, MAD, Mahalanobis distance, winsorize, frequency table, cross tabulation, skewness, Q-Q plot, Box-Cox transformation, scatterplot matrix, PCA in R, prcomp, scree plot, biplot, data validation, skimr, DataExplorer"
mathjax: false
webr: false
date: "2026-11-25"
curriculum_id: "2.3.0"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Exploratory Data Analysis (Course)"
sidebar_order: "4"
---

# Exploratory Data Analysis in R: A Hands-On Interactive Course

<p class="lead">Exploratory data analysis is the work of getting to know a dataset before you commit to a conclusion about it. Its job is to describe and to question rather than to confirm. This eight-lesson interactive course turns that into a repeatable routine you can run on any new data, using Maya's bakery as the running example.</p>

It begins with the framework rather than with a plot, because the most common way to waste a first look is to produce twenty charts with no question behind them. Seven steps, in order: what do you need to learn, what shape is the data, what needs cleaning, then one variable at a time, then pairs, then the surprises, then what you now know and what to ask next. Every later lesson in the course sits at one of those steps, which is what keeps it from becoming a gallery of techniques.

One variable comes first, and it is less obvious than it sounds. A histogram and a boxplot are read for what each one shows and hides, the mean and the median are compared on data where they genuinely disagree, and the decision of which to report becomes a judgment about the question rather than a convention. Spread gets the same treatment, and the five-number summary and the 1.5 times IQR rule arrive together, so a flagged point is understood from the start as a question rather than a verdict.

Pairs follow, where correlation is built up from the scatterplot it summarizes. The direction and strength you can see are then put into a number, extended to a correlation matrix and its heatmap, and immediately bounded by two limits that matter in practice: correlation is not causation, and Pearson's coefficient only sees straight lines, so a strong curved relationship can report an r near zero. Outliers then get a full lesson of their own, because the boxplot rule misses cases that a z-score catches, the z-score itself misses cases that a median-based robust score catches, and some points are only extreme in combination rather than on any single variable.

The second half handles the kinds of data that are easy to get wrong. Categorical variables bring frequency and proportion tables, the two-way cross-tab, the row-versus-column decision that changes what a table appears to say, and the practical mess of rare, missing and mislabeled levels. Distribution shape becomes precise, with skew measured rather than eyeballed, a Q-Q plot read against normality, and the ladder of powers and Box-Cox applied to straighten a skewed variable, including the detail that sinks people, which is what a log does to a zero. Many variables at once arrive through the scatterplot matrix, the correlation heatmap and then PCA, read through its scree plot, loadings and biplot. The course closes on data quality as fitness for use: types, ranges, consistency, key integrity, and the validation checks written down so they run themselves next time.

Each lesson is a guided, interactive experience: you run real R in the page, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Univariate EDA

The 7-step framework first, then the work of step 4, one variable at a time. A histogram drawn in R and read for shape, the mean and the median compared on a column where they disagree, and the choice between them settled by what the question needs. Spread, the boxplot and the five-number summary follow, and the 1.5 times IQR rule flags its first point, which the lesson immediately treats as something to investigate rather than something to delete.

[Start Lesson 1: Univariate EDA](An-EDA-Framework-and-One-Variable.html)

### Lesson 2: Bivariate EDA & Correlation

The scatterplot as one point per day, read for direction and strength before any coefficient is computed, and only then compressed into Pearson's r. The correlation matrix and its heatmap extend that to every pair at once. The lesson then spends its last third on the two things r will not tell you: that an association is not a cause, and that the coefficient only measures straight-line relationships, so a clear curve can hide behind a value near zero.

[Start Lesson 2: Bivariate EDA & Correlation](Two-Variables-and-Correlation-in-R.html)

### Lesson 3: Outliers & Automated EDA

What an outlier actually is, flagged with the 1.5 times IQR rule and the boxplot that draws it, followed by the question that matters more than the flag: is this value wrong, or merely unusual and true? The handling options are separated by what each one does to your conclusions, and a robust summary is computed so you can see how much the extreme point was moving the ordinary one. The lesson ends with a whole data frame scanned in a single call using `skimr` and `DataExplorer`, together with an honest account of what automated EDA is and is not for.

[Start Lesson 3: Outliers & Automated EDA](Outliers-and-Automated-EDA.html)

### Lesson 4: Outlier Detection Methods

Past the boxplot, to the methods that catch what it misses. The z-score, and the reason it fails on exactly the dataset that needed it, because the extreme value inflates the standard deviation it is being measured against. The modified z-score repairs that by measuring from the median with the MAD. Mahalanobis distance then handles the case where no single variable is unusual but the combination is. The lesson closes on keeping, capping and dropping, with winsorizing applied so the effect on the summary is visible.

[Start Lesson 4: Outlier Detection Methods](Detecting-Outliers-in-R.html)

### Lesson 5: Categorical EDA

Counting categories, then turning counts into proportions, then noticing what a proportion hides when the group sizes differ. The bar chart arrives as a frequency table you can see, and the two-way cross-tab brings the decision that quietly changes a table's meaning, which is whether to compute proportions across rows or down columns. The lesson ends on the practical mess: rare levels, missing levels, and the same category spelled three different ways, with the standardizing fix written out.

[Start Lesson 5: Categorical EDA](Categorical-and-Frequency-EDA.html)

### Lesson 6: Distributions & Transformations

Shape made precise. Two peaks usually mean two groups rather than one odd distribution, skew is measured rather than described, and the Q-Q plot is read as a direct check against normality. The ladder of powers then straightens a skewed variable, Box-Cox searches the whole ladder at once, and the lesson flags the detail that catches people out, which is that a log transform has nothing to say about a zero.

[Start Lesson 6: Distributions & Transformations](Distribution-Shape-and-Transformations.html)

### Lesson 7: Multivariate EDA & PCA

Many variables at once, starting with the scatterplot matrix and the correlation heatmap, where blocks of mutually correlated columns become visible as blocks. PCA then compresses those correlated columns, with `prcomp` run and read through the three outputs that matter: the scree plot for how many components are worth keeping, the loadings for what each component means, and the biplot for reading observations and variables on the same map.

[Start Lesson 7: Multivariate EDA & PCA](Multivariate-EDA-with-Pairs-and-PCA.html)

### Lesson 8: Data Quality & Validation

Data quality defined as fitness for use rather than as cleanliness, then checked in four passes: types, where a number arrives hiding as text and has to be converted back; ranges and completeness, where values must be both possible and present; consistency, where columns that should agree are tested against each other; and keys, where one row per thing is verified rather than assumed. The checks are then codified so they run themselves on the next export, which is the difference between cleaning data once and validating it every time.

[Start Lesson 8: Data Quality & Validation](Data-Quality-and-Validation.html)

The course finishes with a short graded check on the whole section: [EDA Quiz](EDA-Quiz.html).

## Who this is for

Anyone who has been handed an unfamiliar dataset and was not sure what to look at first. You should be comfortable reading a data frame and running basic R. If you are not yet, the [R Foundations](R-Foundations-Basics-Course.html) courses come first, and [Data Wrangling with dplyr](Data-Wrangling-dplyr-Course.html) covers the importing and tidying that steps 2 and 3 of the framework assume you have already done.

It is also the right course if you have produced a correlation matrix and were not sure which numbers in it deserved attention, or deleted an outlier because a rule flagged it and later wondered whether that was defensible.

## What you will be able to do

- Run a repeatable 7-step EDA routine on any new dataset instead of improvising
- Read a histogram and a boxplot for shape, center and spread, and say which summary the question needs
- Report a five-number summary and apply the 1.5 times IQR rule without treating a flag as a verdict
- Read a scatterplot for direction and strength, then quantify it with Pearson's r
- Explain why a strong curved relationship can produce a correlation near zero
- Detect outliers four ways, and say which method each one catches and misses
- Decide between keeping, capping and dropping an extreme value, and justify the choice
- Build frequency, proportion and two-way tables, and choose row or column proportions deliberately
- Measure skew, read a Q-Q plot, and straighten a variable with a log, a root or Box-Cox
- Compress correlated columns with PCA and read the scree plot, loadings and biplot
- Validate an export against explicit expectations for types, ranges, consistency and keys

Ready? [Begin with Lesson 1: Univariate EDA](An-EDA-Framework-and-One-Variable.html).
