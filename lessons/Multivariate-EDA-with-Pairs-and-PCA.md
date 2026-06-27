---
title: "Exploratory Data Analysis Lesson 7: Multivariate EDA with pairs and PCA"
description: "Multivariate EDA in R: read a scatterplot matrix and correlation heatmap, then compress correlated columns with PCA (prcomp) and read a scree plot and biplot."
keywords: "PCA in R, prcomp, scatterplot matrix, ggpairs, GGally, correlation heatmap, scree plot, biplot, principal component analysis, multivariate EDA, dimensionality reduction"
post_type: "LESSON"
curriculum_id: "2.3.7"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "7"
course_total: "8"
course_landing: "EDA-Course.html"
course_next: "Data-Quality-and-Validation.html"
course_prev: "Distribution-Shape-and-Transformations.html"
---

=== step === cover
::eyebrow Lesson 7 of 8
## Six columns, two hidden stories

In Lesson 6 you read the **shape** of one column at a time, and in Lesson 2 you compared **two** columns with a scatterplot and a correlation. But Maya's bakery has outgrown one-and-two-at-a-time. Her new logbook has **six** numeric columns recorded over **22 days**: how many people walked in (`foot_traffic`), how many sales she rang up (`transactions`), her takings (`revenue`), the day's `temperature`, and how many `iced_coffee` and `hot_cocoa` cups she sold.

Six columns make \(15\) different pairs to inspect. Squint at them one by one and you drown. The skill in this lesson is to take in **all the columns at once**, find which ones really move together, and then **squeeze** them down to the handful of underlying stories actually driving the data. The heatmap below is the first hint: paint every pair's correlation as colour and two blocks jump out, before you compute anything by hand.

By the end of this lesson you will be able to:

- See every pair of numeric columns at once with a **scatterplot matrix** and a **correlation heatmap**
- Explain what a **principal component** is and why many correlated columns can be compressed into a few
- Run **PCA** with `prcomp()` and use a **scree plot** to decide how many components to keep
- Read a component's **loadings** to name what it measures, and read a **biplot** to place each day in component space

**Prerequisites:** you can run R and load a package with `library()`, and you have met the scatterplot, Pearson's `cor()`, and the **correlation matrix** in [Lesson 2](Two-Variables-and-Correlation-in-R.html). Every new term is defined as it appears.

::widget correlation-heatmap {"vars":["foot_traffic","transactions","revenue","temperature","iced_coffee","hot_cocoa"],"data":{"foot_traffic":[170,196,146,199,228,113,170,153,131,90,128,181,163,98,187,90,153,155,141,166,130,155],"transactions":[132,157,110,157,184,90,138,114,107,70,99,147,128,85,156,70,122,118,108,134,108,122],"revenue":[510,600,435,588,659,377,526,456,429,300,426,552,522,338,576,300,477,478,435,523,426,476],"temperature":[71,70,68,48,65,74,75,75,66,62,68,71,59,69,78,69,84,62,69,73,49,69],"iced_coffee":[30,25,27,4,19,38,33,28,21,13,26,30,13,22,33,26,50,16,32,27,4,36],"hot_cocoa":[10,15,11,30,14,9,7,10,23,18,22,10,23,15,10,12,1,19,8,10,22,12]}}

=== step === concept
::eyebrow Every pair at once
## The scatterplot matrix

The honest first move with many numeric columns is to **look at all the pairs**, not pick favourites. The tool for that is the **scatterplot matrix** (also called a **pairs plot**): a grid with your variables along both the rows and the columns, where each cell is the scatterplot of that row's variable against that column's variable. With four variables you get a 4-by-4 grid of little scatters, all on one screen.

Each lesson runs in a fresh R session, so let us build Maya's 22-day logbook right here (run this once). It is fixed, so every number below is exact.

```r
bakery <- data.frame(
  foot_traffic = c(170,196,146,199,228,113,170,153,131,90,128,181,163,98,187,90,153,155,141,166,130,155),
  transactions = c(132,157,110,157,184,90,138,114,107,70,99,147,128,85,156,70,122,118,108,134,108,122),
  revenue      = c(510,600,435,588,659,377,526,456,429,300,426,552,522,338,576,300,477,478,435,523,426,476),
  temperature  = c(71,70,68,48,65,74,75,75,66,62,68,71,59,69,78,69,84,62,69,73,49,69),
  iced_coffee  = c(30,25,27,4,19,38,33,28,21,13,26,30,13,22,33,26,50,16,32,27,4,36),
  hot_cocoa    = c(10,15,11,30,14,9,7,10,23,18,22,10,23,15,10,12,1,19,8,10,22,12)
)
nrow(bakery)   # one row per day
#> [1] 22
head(bakery)
#>   foot_traffic transactions revenue temperature iced_coffee hot_cocoa
#> 1          170          132     510          71          30        10
#> 2          196          157     600          70          25        15
#> 3          146          110     435          68          27        11
#> 4          199          157     588          48           4        30
#> 5          228          184     659          65          19        14
#> 6          113           90     377          74          38         9
```

The `ggpairs()` function from the **GGally** package draws the whole matrix in one line. Below the diagonal it puts the scatterplots, above it prints each pair's correlation, and down the diagonal it shows each variable's own distribution:

```r
library(GGally)
# every pair of four columns at once
ggpairs(bakery[, c("foot_traffic", "revenue", "temperature", "iced_coffee")])
```

Reading a pairs plot is just reading many small scatters at once. Here is one cell pulled out and enlarged, `foot_traffic` against `revenue`: the dots march tightly up and to the right, a near-perfect line, exactly the strong positive relationship the matrix would show you in miniature.

::widget chart-plotter {"data":[{"x":170,"y":510},{"x":196,"y":600},{"x":146,"y":435},{"x":199,"y":588},{"x":228,"y":659},{"x":113,"y":377},{"x":170,"y":526},{"x":153,"y":456},{"x":131,"y":429},{"x":90,"y":300},{"x":128,"y":426},{"x":181,"y":552},{"x":163,"y":522},{"x":98,"y":338},{"x":187,"y":576},{"x":90,"y":300},{"x":153,"y":477},{"x":155,"y":478},{"x":141,"y":435},{"x":166,"y":523},{"x":130,"y":426},{"x":155,"y":476}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

=== step === concept
::eyebrow All the numbers, as colour
## The correlation heatmap

The pairs plot shows you the shapes, but with six columns the grid gets busy fast. The faster summary is the one you met in Lesson 2: hand the whole data frame to `cor()` and read the **correlation matrix**, every variable against every other, as a single grid of numbers between \(-1\) and \(+1\).

```r
round(cor(bakery), 2)
#>              foot_traffic transactions revenue temperature iced_coffee hot_cocoa
#> foot_traffic         1.00         0.99    0.99       -0.00       -0.01     -0.02
#> transactions         0.99         1.00    0.99        0.00       -0.01     -0.02
#> revenue              0.99         0.99    1.00       -0.00       -0.01      0.01
#> temperature         -0.00         0.00   -0.00        1.00        0.93     -0.87
#> iced_coffee         -0.01        -0.01   -0.01        0.93        1.00     -0.87
#> hot_cocoa           -0.02        -0.02    0.01       -0.87       -0.87      1.00
```

Thirty-six numbers are still a lot to scan, so paint them: the **heatmap** below colours each cell green for positive, blue for negative, deeper colour for stronger. Now the structure is impossible to miss, it falls into two **blocks**.

::widget correlation-heatmap {"vars":["foot_traffic","transactions","revenue","temperature","iced_coffee","hot_cocoa"],"data":{"foot_traffic":[170,196,146,199,228,113,170,153,131,90,128,181,163,98,187,90,153,155,141,166,130,155],"transactions":[132,157,110,157,184,90,138,114,107,70,99,147,128,85,156,70,122,118,108,134,108,122],"revenue":[510,600,435,588,659,377,526,456,429,300,426,552,522,338,576,300,477,478,435,523,426,476],"temperature":[71,70,68,48,65,74,75,75,66,62,68,71,59,69,78,69,84,62,69,73,49,69],"iced_coffee":[30,25,27,4,19,38,33,28,21,13,26,30,13,22,33,26,50,16,32,27,4,36],"hot_cocoa":[10,15,11,30,14,9,7,10,23,18,22,10,23,15,10,12,1,19,8,10,22,12]}}

- A **busyness block**: `foot_traffic`, `transactions` and `revenue` all correlate at about \(0.99\). On a busy day all three rise together; they are practically three thermometers for one thing, how busy the shop was.
- A **weather block**: `temperature` and `iced_coffee` rise together (\(0.93\)), and both push `hot_cocoa` down (\(-0.87\)). One underlying thing again, how hot the day was.

And the two blocks barely talk to each other: every cross-block correlation is essentially \(0.00\). Maya's takings track footfall, not the weather, exactly as you found in Lesson 2.

=== step === quiz
::eyebrow Check yourself
## Read the blocks

In Maya's heatmap, `foot_traffic`-`revenue` is \(0.99\) (deep green) and `foot_traffic`-`temperature` is \(-0.00\) (white). Read together, what do those two cells tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Temperature must be measured wrong, because a real variable cannot correlate \(0.00\) with anything ::no A correlation of \(0.00\) is a perfectly real, informative result: it says the two have no straight-line relationship. Here it correctly reports that how hot the day is has nothing to do with how busy the shop is.
- Revenue rises almost perfectly with footfall, while footfall has essentially no straight-line relationship with temperature ::ok Exactly. A near-\(1\) cell means the pair moves together tightly (the busyness block); a near-\(0\) cell means no linear link (busyness and weather are separate stories). That is the two-block structure.
- The \(0.99\) proves foot_traffic and revenue are the same column entered twice ::no They are different things, people through the door versus dollars taken. A high correlation means they move together, not that they are identical. Only a variable with itself, the diagonal, is exactly \(1\).

=== step === concept
::eyebrow Why compress
## What a principal component is

Here is the insight the heatmap hands you: those six columns are not six independent facts. Three of them (the busyness block) say almost exactly the same thing, and three more (the weather block) say one other thing. So the logbook really only carries about **two** pieces of information, dressed up as six columns. **Principal Component Analysis (PCA)** is the method that finds those few underlying pieces automatically and hands you new columns that capture them.

The intuition first. Look again at the `foot_traffic`-versus-`revenue` cloud below: the points lie along one long diagonal stripe. Almost all their spread runs *along* that stripe; hardly any runs across it. PCA does exactly what your eye does, it draws a **new axis** down the longest direction of the cloud, and that single new axis captures nearly everything the two original columns were telling you.

::widget chart-plotter {"data":[{"x":170,"y":510},{"x":196,"y":600},{"x":146,"y":435},{"x":199,"y":588},{"x":228,"y":659},{"x":113,"y":377},{"x":170,"y":526},{"x":153,"y":456},{"x":131,"y":429},{"x":90,"y":300},{"x":128,"y":426},{"x":181,"y":552},{"x":163,"y":522},{"x":98,"y":338},{"x":187,"y":576},{"x":90,"y":300},{"x":153,"y":477},{"x":155,"y":478},{"x":141,"y":435},{"x":166,"y":523},{"x":130,"y":426},{"x":155,"y":476}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

Now the formalism. A **principal component** is a new variable built as a weighted blend of the originals. Write the standardized columns as \(z_1, z_2, \ldots, z_p\) (here \(p = 6\)). The first component is

\[ \mathrm{PC}_1 = w_1 z_1 + w_2 z_2 + \cdots + w_p z_p, \qquad \sum_{j=1}^{p} w_j^2 = 1 \]

where each \(z_j\) is the \(j\)-th column after **standardizing** it (subtract its mean, divide by its standard deviation, so it has mean \(0\) and spread \(1\)), and the **weights** \(w_j\) (called the **loadings**) say how much each column contributes to the blend. PCA chooses those weights to make \(\mathrm{PC}_1\) have the **largest possible variance**, the most spread, which is the same as finding that longest direction through the cloud. The keep-the-weights-on-a-unit-circle rule \(\sum w_j^2 = 1\) just stops it cheating by making the weights huge. Then \(\mathrm{PC}_2\) is the next blend with the most remaining variance, with the extra rule that it is **uncorrelated** with \(\mathrm{PC}_1\), and so on. (For the curious: the weight vectors are the eigenvectors of the correlation matrix, and each component's variance is its eigenvalue.)

[KEY INSIGHT]
Two ideas carry all of PCA. (1) **Standardize first**, or a big-unit column like `revenue` (hundreds) would dwarf `iced_coffee` (tens) just for being measured in larger numbers. (2) Each component points along a **direction of maximum remaining variance**, and the components are **ordered** so the first few capture the most. That is why a few of them can replace many columns.

=== step === concept
::eyebrow Doing it in R
## prcomp and the scree plot

R's built-in `prcomp()` runs PCA for you. Pass `scale. = TRUE` so it standardizes every column first (the non-negotiable step from the last slide), then ask `summary()` how much of the total spread each component captures.

```r
pca <- prcomp(bakery, scale. = TRUE)
summary(pca)
#> Importance of components:
#>                           PC1    PC2    PC3    PC4    PC5    PC6
#> Standard deviation     1.7274 1.6668 0.3911 0.2663 0.0944 0.0693
#> Proportion of Variance 0.4973 0.4631 0.0255 0.0118 0.0015 0.0008
#> Cumulative Proportion  0.4973 0.9604 0.9859 0.9977 0.9992 1.0000
```

Read the bottom two rows. **Proportion of Variance** is the share of the total spread each component explains. For component \(k\) it is

\[ \text{proportion}_k = \frac{\lambda_k}{\lambda_1 + \lambda_2 + \cdots + \lambda_p} \]

where \(\lambda_k\) (lambda) is the variance of component \(k\). PC1 carries \(49.7\%\) and PC2 \(46.3\%\): together **\(96\%\)** of everything in six columns, in just two new ones. PC3 onward scrape up tiny leftovers.

The picture that makes this decision obvious is the **scree plot**: the proportion of variance against the component number. You look for the **elbow**, the point where the bars fall off a cliff and flatten into rubble (scree is the loose rock at the foot of a hill). Keep the components above the elbow.

```r
pve <- pca$sdev^2 / sum(pca$sdev^2)   # proportion of variance explained
round(pve * 100, 1)
#> [1] 49.7 46.3  2.5  1.2  0.1  0.1
```

::widget chart-plotter {"data":[{"x":"PC1","y":49.7},{"x":"PC2","y":46.3},{"x":"PC3","y":2.5},{"x":"PC4","y":1.2},{"x":"PC5","y":0.1},{"x":"PC6","y":0.1}],"geoms":["col"],"x":"component","y":"percent variance explained","code":{"col":"ggplot(scree, aes(factor(component), variance)) +\n  geom_col()"}}

The cliff after PC2 could not be clearer: two tall bars, then nothing. Two components it is.

=== step === tryit
::eyebrow Your turn
## How much do two components capture?

The scree plot says keep two components. Confirm it with a number: add up the proportion of variance for the **first two** components and turn it into a percentage. Fill in the blank with the index range that selects components 1 and 2 from `pve`.

```r
pve <- pca$sdev^2 / sum(pca$sdev^2)
round(sum(pve[____]) * 100, 1)   # total variance kept by PC1 and PC2
```
::check {"regex":"1\\s*:\\s*2","gate":true,"difficulty":"intermediate","ok":"That returns 96: two components keep 96% of everything in six columns. Dropping the other four costs you only 4% of the spread, a great trade.","no":"Select the first two with the range 1:2, so sum(pve[1:2])."}
::solution
```r
pve <- pca$sdev^2 / sum(pca$sdev^2)
round(sum(pve[1:2]) * 100, 1)
#> [1] 96
```

=== step === concept
::eyebrow Naming the components
## Loadings: what each component means

A component is only useful once you can say what it *measures*, and that is what the **loadings** tell you, the weights \(w_j\) from the blend. They live in `pca$rotation`, one column per component. Before reading them, one honest caveat that trips up everyone.

[WARNING]
The sign of a whole component is **arbitrary**. A direction and its exact opposite describe the same axis, so `prcomp` may hand you any component with all its signs flipped, and a different machine may flip it back. Only the **pattern** within a component matters (which variables share a sign, and their relative sizes), never whether the numbers come out \(+\) or \(-\). To make the table readable we orient each component so the busier and hotter direction is positive:

```r
# orient PC1 and PC2 so busier / hotter reads as positive (signs only, no analysis change)
if (pca$rotation["revenue", 1] < 0)     { pca$rotation[, 1] <- -pca$rotation[, 1]; pca$x[, 1] <- -pca$x[, 1] }
if (pca$rotation["temperature", 2] < 0) { pca$rotation[, 2] <- -pca$rotation[, 2]; pca$x[, 2] <- -pca$x[, 2] }
round(pca$rotation[, 1:2], 2)
#>                PC1   PC2
#> foot_traffic  0.58  0.02
#> transactions  0.58  0.02
#> revenue       0.58  0.02
#> temperature  -0.02  0.58
#> iced_coffee  -0.03  0.58
#> hot_cocoa     0.01 -0.57
```

Now read each column as a recipe:

- **PC1** loads heavily and equally on `foot_traffic`, `transactions` and `revenue` (all \(0.58\)) and near-zero on everything else. PC1 *is* the busyness block. Call it **"how busy the day was."**
- **PC2** loads on `temperature` and `iced_coffee` (\(0.58\)) and pulls `hot_cocoa` the opposite way (\(-0.57\)), with near-zero on the busyness columns. PC2 *is* the weather block. Call it **"how hot the day was."**

PCA rediscovered, with no hints, the exact two stories you spotted in the heatmap, and handed you a single clean number for each.

=== step === concept
::eyebrow Placing every day
## The biplot

The loadings name the components; the **scores** place each day on them. Scores live in `pca$x`, one row per day giving its PC1 and PC2 value (its position along the two new axes).

```r
round(head(pca$x[, 1:2]), 2)
#>        PC1   PC2
#> [1,]  0.71  0.85
#> [2,]  2.21  0.14
#> [3,] -0.55  0.35
#> [4,]  2.31 -3.77
#> [5,]  3.64 -0.39
#> [6,] -1.88  1.48
```

Plot those scores, PC1 across and PC2 up, and you get a map of all 22 days in the two-dimensional space PCA built. Because PC1 means "how busy" and PC2 means "how hot," it reads like a weather-and-trade chart. (R's `biplot(pca)` draws the full **biplot**, this same map of days with the variable loadings overlaid as arrows, so you see the points and what pushes them in one picture; the day positions below are its heart.)

::widget chart-plotter {"data":[{"x":0.71,"y":0.85},{"x":2.21,"y":0.14},{"x":-0.55,"y":0.35},{"x":2.31,"y":-3.77},{"x":3.64,"y":-0.39},{"x":-1.88,"y":1.48},{"x":0.91,"y":1.55},{"x":-0.25,"y":0.99},{"x":-0.85,"y":-1.13},{"x":-3.02,"y":-1.49},{"x":-1.09,"y":-0.65},{"x":1.45,"y":0.87},{"x":0.69,"y":-1.99},{"x":-2.4,"y":-0.25},{"x":1.85,"y":1.54},{"x":-3.08,"y":0.2},{"x":-0.06,"y":3.55},{"x":0.07,"y":-1.31},{"x":-0.7,"y":0.94},{"x":0.77,"y":0.83},{"x":-0.79,"y":-3.14},{"x":0.06,"y":0.84}],"geoms":["point"],"x":"PC1 score (busier to the right)","y":"PC2 score (hotter is higher)","code":{"point":"ggplot(scores, aes(PC1, PC2)) +\n  geom_point()"}}

Read the map by its edges:

- **Far right** sits day 5 (\(228\) people through the door), the busiest day of the fortnight. **Far left** sit days 10 and 16 (just \(90\) people), the quietest.
- **Top** sits day 17 (\(84\) degrees, \(50\) iced coffees), the hottest. **Bottom-right** sits day 4: busy *and* cold (\(48\) degrees, \(30\) hot cocoas), high on PC1, low on PC2.

One last detail worth noticing: the widget prints \(r = 0\) for this scatter. That is not a coincidence, it is the design. PC1 and PC2 are built to be **uncorrelated**, so the busyness axis and the weather axis carry genuinely separate information, no overlap.

=== step === quiz
::eyebrow Check yourself
## Read the map

A new Saturday comes in with a PC1 score of about \(+3\) and a PC2 score of about \(0\). Using Maya's components (PC1 = how busy, PC2 = how hot), what kind of day was it?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A very busy day at an unremarkable, middling temperature ::ok Exactly. A large positive PC1 means far over on the busyness axis (lots of footfall, sales and takings); a PC2 near \(0\) means an average-temperature day. The two axes read independently.
- A scorching hot day with average trade ::no That swaps the axes. Heat lives on PC2; this day's PC2 is about \(0\) (average temperature). The big number is on PC1, which is busyness.
- A quiet day, because a single score of \(3\) is small ::no On these standardized components a score of \(+3\) is far out toward the high end, the busy extreme, not small. Compare it to the biplot, where the busiest day sat near \(+3.6\) on PC1.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take multivariate EDA and PCA further:

- [An Introduction to Statistical Learning (free PDF), Chapter 12](https://www.statlearning.com/) - the canonical, gentle-but-rigorous treatment of PCA, loadings, scores, scree plots and the proportion of variance explained.
- [Lever, Krzanowski and Altman (2017), Principal component analysis, Nature Methods](https://doi.org/10.1038/nmeth.4346) - a two-page primer that builds the geometric intuition (directions of maximum variance) cleanly and visually.
- [R help: prcomp {stats}](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prcomp.html) - the canonical docs for the function you used, including `scale.`, `rotation`, `x` and `sdev`.
- [GGally: ggpairs() reference](https://ggobi.github.io/ggally/reference/ggpairs.html) - how to build and customise the scatterplot matrix you started the lesson with.

=== step === complete
## Lesson 7 complete

You can now explore many variables at once instead of two at a time. You read a **scatterplot matrix** with `ggpairs()`, summarised every pair as a **correlation heatmap** and spotted its two blocks, then used **PCA** (`prcomp(scale. = TRUE)`) to compress six correlated columns into two components carrying \(96\%\) of the spread. You read a **scree plot** to choose how many to keep, named each component from its **loadings** (PC1 = how busy, PC2 = how hot) while respecting the arbitrary-sign caveat, and placed all 22 days on a **biplot** of their scores.

Next, Lesson 8: Data Quality and Validation. Every method in this course, from a histogram to PCA, quietly trusts that the data is clean. Before you believe any of it, you will run a pre-analysis quality pass, checking types, ranges, uniqueness and key integrity, and codify those checks as reusable rules that run on every refresh.
