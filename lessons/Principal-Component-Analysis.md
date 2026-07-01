---
title: "Unsupervised Learning Lesson 1: PCA in R"
catalog_blurb: "Compress many correlated columns into a few directions that capture most variation."
description: "Learn PCA in R from scratch: what a principal component is, why you scale first, how to read variance explained and a scree plot, and how to read a biplot."
keywords: "PCA in R, principal component analysis, prcomp, variance explained, scree plot, biplot, dimensionality reduction, unsupervised learning, standardize, loadings"
post_type: "LESSON"
curriculum_id: "6.9.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "1"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: "Factor-Analysis.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 8
## PCA in R

Welcome to the Unsupervised Learning track. Meet Rosa, a botanist. She has measured 150 iris flowers, and for each one she wrote down four numbers with a ruler: the length and width of a petal, and the length and width of a sepal (the small green leaf under the petal), all in centimetres. Four numbers per flower does not sound like much, until you try to eyeball all 150 flowers at once and see which ones resemble each other. Rosa wishes she could place every flower as a single dot on a flat map, where similar flowers sit close together and different ones sit far apart.

Principal Component Analysis, or PCA, is exactly that machine. It takes many overlapping measurements and boils them down to a couple of new numbers you can actually plot and read. The panel below previews the map PCA builds for Rosa's flowers, and lets you build the real one in R.

By the end of this lesson you will be able to:

- Say what a principal component is, in plain words
- Run PCA in R the right way (scaling first), with one function
- Read how much each component is worth, choose how many to keep, and read a biplot

**Prerequisites:** you can run R and read its output, and you know what a variable, a mean, and a scatter plot are. No linear algebra is assumed. Every term is defined as it appears. (The iris measurements are real: they were collected by the botanist Edgar Anderson in 1935.)

::widget pca-projection {}

Each dot stands for a flower and the three colours are the three iris species. Notice how the species fall into clean, separate clumps, even though the map keeps just two new numbers per flower instead of the original four. Press Run to build that same map from the real measurements. That compression is what PCA is for.

=== step === concept
::eyebrow The problem
## Four rulers, one story

Here is the thing Rosa notices when she looks at her four columns: they overlap. A flower with a long petal almost always has a wide petal too. A flower with a long petal also tends to have a long sepal. The measurements are not four independent facts, they partly repeat each other. That repetition has a name: **correlation**, a number from -1 to +1 that says how tightly two columns move together (near +1 = rise together, near 0 = unrelated, near -1 = one rises as the other falls).

The grid below is the correlation between every pair of Rosa's four measurements, computed from the real data.

::widget correlation-heatmap {"vars":["Sepal.L","Sepal.W","Petal.L","Petal.W"],"matrix":[[1,-0.12,0.87,0.82],[-0.12,1,-0.43,-0.37],[0.87,-0.43,1,0.96],[0.82,-0.37,0.96,1]]}

Petal length and petal width move together almost perfectly (r = 0.96). You can confirm every number yourself:

```r
# The real correlations among Rosa's four measurements
round(cor(iris[, 1:4]), 2)
```

[KEY INSIGHT]
When columns are highly correlated, you do not really have four independent numbers, you have fewer. PCA's job is to find out how many numbers the data actually needs, and to build them.

=== step === concept
::eyebrow The idea
## What a principal component is

Picture Rosa's 150 flowers as a cloud of dots in space, one dot per flower. Because the measurements are correlated, that cloud is not a round ball, it is stretched, like a squashed rugby ball. PCA looks for the single direction along which the cloud stretches the most, and calls it the **first principal component (PC1)**. Then it looks for the best remaining direction at a right angle to PC1 and calls that **PC2**, and so on.

Two facts make this useful:

- Each component is a **weighted blend of all four original measurements**, not one of them. PC1 might be "mostly petal size, a little sepal length", tuned to point along the biggest spread.
- The components are **uncorrelated** with each other by construction, so each one carries fresh information, no repetition.

Because the cloud stretches most along the first couple of directions, PC1 and PC2 together capture most of what made the flowers different. Plot those two and you get Rosa's 2D map. Press Run in the panel to build these components on the real data.

::widget pca-projection {}

The panel above is a stylized picture of the idea. The exact percentages for Rosa's flowers will drop out when you run `summary()` in a couple of steps.

=== step === quiz
::eyebrow Check yourself
## What exactly is PC1?

Suppose Rosa's PC1 weights petal length and petal width heavily, sepal length a little, and sepal width barely at all. Which statement describes what PC1 actually is?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is the single original measurement that matters most ::no A component is not one of the original columns. It is a brand new axis, built as a weighted blend of all of them.
- It is a new axis, a weighted blend of all four measurements, pointing along the data's biggest spread ::ok Exactly. PC1 is a new direction built from all four columns, with the weights chosen so the flowers spread out along it as much as possible.
- It is the plain average of the four measurements ::no Not a plain average. The weights are chosen to maximize spread, they differ per column, and some can even be negative.

=== step === concept
::eyebrow Go one level deeper
## The math, in one breath

You do not need linear algebra to use PCA, but the formula makes "weighted blend chosen to maximize spread" precise. Let \(X_1, X_2, X_3, X_4\) be the four measurements, each first standardized (we get to that next). The first principal component is a weighted sum of them:

\[ Z_1 = \phi_{11}X_1 + \phi_{21}X_2 + \phi_{31}X_3 + \phi_{41}X_4 \]

The weights \(\phi_{j1}\) are called **loadings**. To stop PCA from cheating by simply making the weights huge, they are held to unit length: \(\sum_{j} \phi_{j1}^2 = 1\). Among all weight sets of that length, PCA picks the one that makes the **variance** of \(Z_1\) (how spread out the flowers are along this axis) as large as possible. PC2 does the same, with the extra rule that it must be at right angles to PC1.

Where do the weights come from? They are the **eigenvectors of the correlation matrix** (an eigenvector is just the special direction that matrix stretches without rotating). Each eigenvector comes with an **eigenvalue** \(\lambda_k\), and that eigenvalue equals the variance captured by component \(k\). So the fraction of the total spread a component explains is simply

\[ \text{proportion explained}_k = \frac{\lambda_k}{\lambda_1 + \lambda_2 + \lambda_3 + \lambda_4} \]

That single fraction is the number you will use to decide how many components are worth keeping. Here is the whole procedure end to end:

::widget process-flow {"steps":[{"title":"Standardize","sub":"put every column on a mean-0, sd-1 scale"},{"title":"Correlation matrix","sub":"measure how the columns move together"},{"title":"Eigen-decompose","sub":"find the axes of most spread, ranked by variance"},{"title":"Project","sub":"rewrite each flower in the new component coordinates"}]}

=== step === concept
::eyebrow The one step people skip
## Put every ruler on the same scale

PCA chases variance, and variance depends on units. If one column happens to be measured in big numbers, it will look "most spread out" for a silly reason and hijack PC1. Rosa's columns are all in centimetres, but they still vary by very different amounts, so the danger is real. Standardizing first (subtract each column's mean, divide by its standard deviation, so every column has mean 0 and spread 1) puts them on equal footing before PCA looks for the biggest spread.

Watch what changes:

```r
# The four raw variances are far from equal
sapply(iris[, 1:4], var)

# Component spreads WITHOUT scaling: Petal.Length's large variance dominates
prcomp(iris[, 1:4], scale. = FALSE)$sdev

# Component spreads WITH scaling: every column gets a fair say
prcomp(iris[, 1:4], scale. = TRUE)$sdev
```

[WARNING]
Scaling is the single most common PCA mistake. Unless every column is already in the same meaningful unit, set `scale. = TRUE`. When in doubt, scale.

=== step === tryit
::eyebrow Your turn
## Run PCA in R

The function is `prcomp()`. Give it the four numeric columns and tell it to scale. Fill in the blank so PCA standardizes the columns first, then run it.

```r
pca <- prcomp(iris[, 1:4], scale. = ____)
summary(pca)
```
::check {"regex":"scale\\.\\s*=\\s*TRUE","gate":true,"difficulty":"beginner","ok":"That is it. prcomp standardizes each column, then finds the components. The summary prints how much variance each one explains.","no":"You want PCA to standardize first: set scale. = TRUE."}
::solution
```r
pca <- prcomp(iris[, 1:4], scale. = TRUE)
summary(pca)
```

=== step === concept
::eyebrow Reading the output
## How many components? Read the variance

`summary(pca)` prints one number that matters most: the **proportion of variance** each component explains. For Rosa's flowers it comes out roughly PC1 = 73%, PC2 = 23%, PC3 = 4%, PC4 = 0.5%. So the first two components together hold about 96% of everything that made her flowers differ. A flat 2D map of PC1 versus PC2 throws away only about 4%.

A **scree plot** shows those values as a curve and helps you spot the "elbow", the point after which extra components add almost nothing:

```r
# Proportion of variance per component (row 2), and the running total (row 3)
summary(pca)$importance[, 1:4]

# Scree plot: variance per component. Keep components before the elbow flattens.
screeplot(pca, type = "lines", main = "Scree plot")
```

[NOTE]
There is no magic cutoff. Common rules of thumb: keep enough components to reach 80 to 90% cumulative variance, or stop at the elbow of the scree plot. For seeing structure in a picture, two components is the usual choice because you can plot it.

=== step === quiz
::eyebrow Check yourself
## Reading variance explained

For Rosa's flowers, PC1 explains 73% of the variance and PC2 explains 23%. She plots PC1 against PC2 to get a flat 2D map. How much of the original spread does that map preserve, and is it a good trade?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- 23%, only the second component counts on the vertical axis ::no You keep BOTH plotted components, so add their shares, do not take just one.
- 96%, the two components together, so the 2D map keeps almost everything ::ok Right: 73% + 23% = 96%. Going from four numbers to two costs only about 4% of the spread, an excellent trade.
- 50%, a 2D plot of four-dimensional data always keeps half ::no The fraction kept depends on the variances, not on the number of axes. Here it happens to be 96%.

=== step === concept
::eyebrow The full picture
## Reading a biplot

The 2D map tells you which flowers are alike. To also see WHY, add the loadings back onto the plot. That combined picture is a **biplot**: the dots are flowers (their scores, `pca$x`, the coordinates in the new component space) and the arrows are the original variables (their loadings, `pca$rotation`).

```r
# Loadings: how much each original variable weights into PC1 and PC2
round(pca$rotation[, 1:2], 2)

# Biplot: dots are flowers (scores), arrows are the variables (loadings)
biplot(pca, scale = 0, cex = 0.6)
```

Read a biplot like this: an arrow points in the direction where that variable increases, and a long arrow means the variable is strongly tied to the components on screen. Arrows that point the same way are correlated variables (petal length and petal width sit almost on top of each other here). Dots far out along an arrow's direction are flowers that score high on that variable, which is how you can tell one species has much larger petals than the others.

[WARNING]
PCA has limits, and they matter. It only finds **straight-line** directions of spread, so it can miss curved structure. It is **scale-sensitive**, so always standardize. Its components are **blends**, so they can be hard to name in plain language. And "explains the most variance" is not the same as "most useful for prediction", a low-variance component can still carry the signal you care about.

=== step === concept
::eyebrow Go deeper
## References

Four trustworthy places to take PCA further:

- [An Introduction to Statistical Learning, ch. 12 (free PDF)](https://www.statlearning.com/) - the gentle, canonical explanation of principal components and biplots.
- [The Elements of Statistical Learning, ch. 14.5 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - PCA as the directions of maximum variance, with the full math.
- [prcomp: the R function documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prcomp.html) - every argument and every value the function you used returns.
- [Jolliffe and Cadima (2016), Principal component analysis: a review](https://doi.org/10.1098/rsta.2015.0202) - an authoritative modern overview of what PCA does well and where it fails.

=== step === complete
## Lesson 1 complete

You can now take a wide table of correlated numbers and compress it into a few readable directions. You saw why correlated columns waste space, what a principal component really is (a weighted blend chosen to maximize spread), why you scale first, how to run `prcomp()` and read variance explained with a scree plot, and how to read a biplot's dots and arrows.

Next, Lesson 2: Factor Analysis. PCA asks "which directions capture the most spread?" Factor analysis asks a different question, "what hidden factors could have produced these measurements in the first place?" You will see how the two methods look similar, why they are not the same, and when to reach for each.
