---
title: "Unsupervised Learning Lesson 2: Factor Analysis"
catalog_blurb: "Uncover the hidden factors that produce a set of correlated measurements."
description: "Learn factor analysis in R from scratch: what a latent factor is, the common-factor model, how to run and read factanal(), and how it differs from PCA."
keywords: "factor analysis in R, factanal, latent factor, common factor model, factor loadings, communality, uniqueness, varimax rotation, factor analysis vs PCA, unsupervised learning"
post_type: "LESSON"
curriculum_id: "6.9.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "2"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: "k-Means-and-Choosing-k.html"
course_prev: "PCA-in-R.html"
---

=== step === cover
::eyebrow Lesson 2 of 8
## Factor Analysis

In Lesson 1, PCA took Rosa's four flower measurements and compressed them into a couple of readable directions. It answered one question: *which directions capture the most spread?* Factor analysis answers a different, deeper one: *what hidden things could have produced these measurements in the first place?*

Meet Priya, a school counselor. At the end of term she has percentage scores for 250 students in six subjects: reading, vocabulary and essay writing (English), and arithmetic, algebra and geometry (maths). When she lines the columns up and looks at how they move together, a pattern jumps out, shown in the grid below. The three English subjects rise and fall together. The three maths subjects rise and fall together. But an English score tells you almost nothing about a maths score.

Priya never gave a test called "language ability" or "number ability". Yet it is as if two such hidden abilities are quietly steering all six columns. Factor analysis is the tool that finds them.

By the end of this lesson you will be able to:

- Say what a latent (hidden) factor is, and how the common-factor model explains a set of correlations
- Run factor analysis in R, then read the loadings, communalities and uniquenesses
- Decide how many factors to keep, rotate them so you can name them, and say how all this differs from PCA

**Prerequisites:** [Lesson 1, PCA in R](PCA-in-R.html) (correlation, loadings, standardizing, variance explained). You can run R and read its output. No linear algebra is assumed; every term is defined as it appears.

::widget correlation-heatmap {"vars":["read","vocab","essay","arith","algebra","geom"],"matrix":[[1,0.57,0.51,0.13,0.04,0.09],[0.57,1,0.51,0.03,0.01,0.04],[0.51,0.51,1,0.13,0.04,0.09],[0.13,0.03,0.13,1,0.64,0.63],[0.04,0.01,0.04,0.64,1,0.62],[0.09,0.04,0.09,0.63,0.62,1]]}

Two green blocks, and cold blue-white everywhere else. That two-block shape is the fingerprint we are about to explain.

=== step === concept
::eyebrow The clue
## The clue is in the correlations

Let us make Priya's data concrete so you can compute on it. Each lesson runs in a fresh R session, so we build the marks right here (run this once). Two hidden abilities, one number per student, are turned into six subject scores, each with its own random noise. You never see the two abilities; you only see the six columns they produce.

```r
set.seed(1)
n <- 250
language <- rnorm(n)   # a hidden "language ability", one value per student (unseen)
number   <- rnorm(n)   # a hidden "number ability" (unseen)

# Each ability drives some subjects strongly, plus that subject's own noise:
make <- function(load, ability) round(pmin(100, pmax(0, 62 + 15 * (load * ability + rnorm(n, 0, 0.62)))))
scores <- data.frame(
  reading    = make(0.80, language),
  vocabulary = make(0.75, language),
  essay      = make(0.70, language),
  arithmetic = make(0.78, number),
  algebra    = make(0.82, number),
  geometry   = make(0.72, number)
)
head(scores, 3)
#>   reading vocabulary essay arithmetic algebra geometry
#> 1      55         41    66         64      72       66
#> 2      61         56    74         76      58       67
#> 3      41         41    45         82      69       43
```

Now look at how the six columns move together:

```r
round(cor(scores), 2)
#>            reading vocabulary essay arithmetic algebra geometry
#> reading       1.00       0.57  0.51       0.13    0.04     0.09
#> vocabulary    0.57       1.00  0.51       0.03    0.01     0.04
#> essay         0.51       0.51  1.00       0.13    0.04     0.09
#> arithmetic    0.13       0.03  0.13       1.00    0.64     0.63
#> algebra       0.04       0.01  0.04       0.64    1.00     0.62
#> geometry      0.09       0.04  0.09       0.63    0.62     1.00
```

Inside the English block, correlations sit around 0.5. Inside the maths block, around 0.6. Across the two blocks, they collapse to near zero. Six columns, but really only two "clumps" of shared movement.

[KEY INSIGHT]
Correlation that clusters into blocks is the tell-tale sign of hidden structure. Something the three English subjects share, and something different the three maths subjects share, is making each block move as one. Naming those two somethings is the whole job of factor analysis.

=== step === concept
::eyebrow The idea
## The hidden ability you never tested

Two kinds of variable are in play here, and keeping them straight is the key to the whole lesson.

- An **observed variable** (also called a *manifest* variable, or an *indicator*) is something you actually measured. Priya has six of them: the six subject scores sitting in her spreadsheet.
- A **latent factor** is a hidden variable you did **not** measure, but that influences several observed variables at once. Priya suspects two: a *language ability* and a *number ability*. She never scored a student on "language ability" directly, yet its fingerprints are all over the reading, vocabulary and essay columns.

Why would a hidden ability create correlation? Because it is a **common cause**. A student who happens to be strong in language will tend to score high on reading *and* vocabulary *and* essays, all together. A student who is weak in language dips on all three together. That shared push and pull is exactly what makes the three columns rise and fall in step, which is exactly the correlation you saw.

[NOTE]
This is the founding idea of the whole method. In 1904 the psychologist Charles Spearman looked at exactly this kind of table, exam marks that clumped together, and proposed that a single hidden "general ability" explained the pattern. Factor analysis grew directly out of that question.

=== step === concept
::eyebrow The model
## The common-factor model

Here is the machinery, stated plainly, then in symbols. Factor analysis assumes each observed score is **built from the hidden factors, plus a leftover that belongs to that subject alone**. Read the arrows as "produces": the hidden factors produce the scores you see. The flow below traces one student's marks being generated.

::widget process-flow {"steps":[{"title":"Hidden factors","sub":"each student has a language and a number ability (never measured)"},{"title":"Scale by loadings","sub":"each ability pushes some subjects hard, others barely"},{"title":"Add a unique part","sub":"each subject also has its own quirks and luck"},{"title":"Observed scores","sub":"the six subject marks you actually see"}]}

Now the formula. For one subject \(j\) (say, reading) and two factors, the model is:

\[ X_j = \lambda_{j1} F_1 + \lambda_{j2} F_2 + \varepsilon_j \]

Every symbol, in words:

- \(X_j\) is the observed, standardized score on subject \(j\).
- \(F_1, F_2\) are the two **hidden factors** (the number ability and the language ability), the same two for every student.
- \(\lambda_{j1}, \lambda_{j2}\) are the **loadings**: how strongly subject \(j\) responds to each factor. A big loading means that factor drives that subject hard.
- \(\varepsilon_j\) is the **unique factor**: everything about subject \(j\) that the common factors do *not* explain, its own quirks plus measurement noise.

Notice the direction. In PCA a component was a blend built *out of* the observed columns. Here it is the reverse: the observed columns are built *out of* the hidden factors. Factor analysis is a **model of where the data came from**, and its promise is that a couple of hidden factors can reproduce the whole web of correlations you measured.

=== step === quiz
::eyebrow Check yourself
## What is a factor, really?

Priya never gave a test called "language ability", yet it appears in the model as \(F\). In the common-factor model, what is that language ability?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is just the average of her three English subject scores ::no A factor is not a plain average of the columns. It is an unobserved variable; the English scores are consequences of it, not its definition.
- A hidden variable she never measured, whose shared influence shows up as the correlation among the English subjects ::ok Exactly. The factor is latent. We only ever see its footprints, the correlation it creates among the subjects it drives.
- The one English subject that best predicts the other two ::no No single observed subject is the factor. The factor sits behind all three and is never measured directly.

=== step === tryit
::eyebrow Your turn
## Fit the model in R

R has factor analysis built in: the function is `factanal()`. Give it the data frame and the number of factors to look for. Priya has two hunches, a language ability and a number ability, so ask for two factors. Fill in the blank.

```r
fa <- factanal(scores, factors = ____)
fa
```
::check {"regex":"factors\\s*=\\s*2","gate":true,"difficulty":"beginner","ok":"That fits a two-factor model by maximum likelihood and standardizes the columns for you. The printout has three parts: uniquenesses, loadings, and a test at the bottom.","no":"Priya suspects two hidden abilities, so ask for two factors: factors = 2."}
::solution
```r
fa <- factanal(scores, factors = 2)
fa
#> Uniquenesses:
#>    reading vocabulary      essay arithmetic    algebra   geometry
#>      0.416      0.430      0.544      0.341      0.372      0.397
#>
#> Loadings:
#>            Factor1 Factor2
#> reading            0.760
#> vocabulary         0.755
#> essay              0.671
#> arithmetic  0.808
#> algebra     0.792
#> geometry    0.775
#>
#>                Factor1 Factor2
#> SS loadings      1.892   1.607
#> Proportion Var   0.315   0.268
#> Cumulative Var   0.315   0.583
#>
#> Test of the hypothesis that 2 factors are sufficient.
#> The p-value is 0.678
```

Run it (fill in 2) and R prints three parts: the **uniquenesses** at the top, the **loadings** table in the middle (values below about 0.1 are left blank so the pattern pops), and a sufficiency **test** at the bottom (p = 0.678). We will read each part in turn, starting with the loadings, the part that carries the meaning.

=== step === concept
::eyebrow Reading the output
## Reading the loadings, and naming the factors

The **loadings** table is the heart of the result. Each number is close to the correlation between that subject and that factor, so it runs from -1 to +1, and a large size (either sign) means a strong tie. Look at the pattern:

- **Factor1** loads high on arithmetic (0.81), algebra (0.79) and geometry (0.78), and near zero on the English subjects.
- **Factor2** loads high on reading (0.76), vocabulary (0.76) and essay (0.67), and near zero on the maths subjects.

That clean split is called **simple structure**: each subject leans on essentially one factor. And now the factors are nameable. Factor1 is the hidden **number ability**; Factor2 is the hidden **language ability**, exactly the two abilities Priya suspected. The bars below show Factor2's loadings across all six subjects, so you can see the language factor pick out its three subjects and ignore the rest.

::widget importance-bars {"items":[{"label":"reading","value":0.76},{"label":"vocabulary","value":0.76},{"label":"essay","value":0.67},{"label":"arithmetic","value":0.08},{"label":"algebra","value":-0.01},{"label":"geometry","value":0.05}]}

You can pull the loadings out as a plain table too:

```r
round(fa$loadings[, 1:2], 3)
#>            Factor1 Factor2
#> reading      0.077   0.760
#> vocabulary  -0.005   0.755
#> essay        0.075   0.671
#> arithmetic   0.808   0.079
#> algebra      0.792  -0.012
#> geometry     0.775   0.047
```

=== step === quiz
::eyebrow Check yourself
## Which factor is which?

Factor1 has loadings near 0.80 on arithmetic, algebra and geometry, and near 0 on the three English subjects. What is Factor1?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The hidden number ability: it drives the three maths subjects together and barely touches the English ones ::ok Right. A factor is named from the subjects that load on it. High on all three maths subjects, near zero elsewhere, so it is the maths (number) ability.
- A general ability that drives all six subjects equally ::no It cannot be general: it loads near zero on reading, vocabulary and essay. It only moves the maths block.
- Noise, because three of its loadings are near zero ::no Near-zero loadings are the point, not a defect. They tell you which subjects the factor does not touch, which is how you name it.

=== step === concept
::eyebrow How much is explained
## Communality and uniqueness

Each subject's variance splits cleanly into two parts: the share the common factors explain, and the share that is the subject's own. Because the columns are standardized, the two shares add up to exactly 1.

The part the factors explain is the **communality**, written \(h_j^2\). It is just the sum of that subject's squared loadings:

\[ h_j^2 = \lambda_{j1}^2 + \lambda_{j2}^2 \]

Whatever is left over is the **uniqueness**, \(\psi_j = 1 - h_j^2\), the `Uniquenesses` line R printed. Let us not just assert it; let us watch it add up for reading, whose loadings are 0.077 and 0.760:

```r
L <- fa$loadings
round(sum(L["reading", ]^2), 3)         # communality: 0.077^2 + 0.760^2
#> [1] 0.584
round(fa$uniquenesses["reading"], 3)    # the leftover, unique to reading
#>   reading
#>     0.416
```

0.584 plus 0.416 is 1: the two hidden abilities account for 58% of reading's ups and downs, and the remaining 42% is reading's own. The bars below rank every subject by communality, how much of it the two factors capture:

::widget importance-bars {"items":[{"label":"arithmetic","value":0.66},{"label":"algebra","value":0.63},{"label":"geometry","value":0.60},{"label":"reading","value":0.58},{"label":"vocabulary","value":0.57},{"label":"essay","value":0.46}]}

Essay has the lowest communality (0.46), so it is the most "its own thing": more of an essay mark is personal style and luck than the two abilities can reach.

=== step === concept
::eyebrow The payoff
## The model rebuilds the correlations

Here is the promise made good. If the factors really produced the scores, then the correlation between any two subjects should be recoverable from their loadings, specifically, the sum of their paired loadings. Watch the model reconstruct a correlation it was never handed directly:

```r
L <- fa$loadings
# Same block: the model predicts cor(reading, vocabulary) from their loadings
round(sum(L["reading", ] * L["vocabulary", ]), 3)   # model says
#> [1] 0.573
round(cor(scores$reading, scores$vocabulary), 3)    # actual data
#> [1] 0.575
```

0.573 versus 0.575, a near-perfect match, from two subjects the model treated separately. And across the two blocks, where there should be almost no shared cause:

```r
round(sum(L["reading", ] * L["algebra", ]), 3)      # model says
#> [1] 0.052
round(cor(scores$reading, scores$algebra), 3)       # actual data
#> [1] 0.043
```

Both tiny. This is the difference from PCA in one picture: factor analysis is judged by how well a few hidden factors **reproduce the correlation matrix**. That is its whole objective.

=== step === concept
::eyebrow Making factors nameable
## Rotation: spinning to simple structure

There is one catch. The raw factanal solution does not always come out neatly aligned to "maths" and "language". The naked, unrotated loadings can be muddy, with the first factor loading a little on everything:

```r
round(factanal(scores, factors = 2, rotation = "none")$loadings[, 1:2], 3)
#>            Factor1 Factor2
#> reading      0.280   0.711
#> vocabulary   0.199   0.728
#> essay        0.253   0.626
#> arithmetic   0.799  -0.142
#> algebra      0.760  -0.225
#> geometry     0.759  -0.164
```

Here Factor1 loads on reading (0.28) as well as the maths subjects, so it is hard to name. **Rotation** fixes this. A rotation spins the factor axes to a spot where each subject loads strongly on one factor and near zero on the others, without changing how well the model fits (the communalities stay identical). The most common choice, **varimax**, is what `factanal()` applies by default:

```r
round(factanal(scores, factors = 2, rotation = "varimax")$loadings[, 1:2], 3)
#>            Factor1 Factor2
#> reading      0.077   0.760
#> vocabulary  -0.005   0.755
#> essay        0.075   0.671
#> arithmetic   0.808   0.079
#> algebra      0.792  -0.012
#> geometry     0.775   0.047
```

[NOTE]
Varimax keeps the factors at right angles, which assumes the hidden abilities are unrelated to each other. If you believe they are themselves correlated (a strong reader is often a strong writer and a decent mathematician too), an **oblique** rotation such as promax lets the factors lean together. That is a judgment call about your subject, not a mechanical default.

[KEY INSIGHT]
Rotation does not improve the fit; it improves the *interpretation*. Same model, same communalities, but now every subject points at one clear factor, so you can put a name on each column of loadings.

=== step === concept
::eyebrow How many factors
## How many factors should Priya keep?

We told `factanal()` to look for two. How would she have known? Three tools, and they agree here.

**1. The Kaiser rule: keep factors whose eigenvalue exceeds 1.** An eigenvalue of the correlation matrix is how much total variance a direction captures; one bigger than 1 means it beats a single original column. Count them:

```r
round(eigen(cor(scores))$values, 3)
#> [1] 2.384 1.944 0.512 0.434 0.385 0.341
```

Exactly two values top 1, then a steep drop. That drop, plotted, would be the *scree plot* elbow you met in Lesson 1: keep the factors before the curve flattens.

**2. The likelihood test.** `factanal()` runs a formal test whose null hypothesis is "this many factors is enough". A small p-value (below 0.05) rejects that number as too few:

```r
factanal(scores, factors = 1)$PVAL   # is one factor enough?
#> [1] 4.873289e-38
factanal(scores, factors = 2)$PVAL   # are two enough?
#> [1] 0.6776156
```

One factor is crushed (p far below 0.05, so one is not enough). Two factors give p = 0.68, comfortably above 0.05, so we do not reject two. Both signals point to the same answer Priya suspected: **two**.

=== step === tryit
::eyebrow Your turn
## Compute a communality yourself

A subject's communality is the sum of its **squared** loadings, the share of its ups and downs the two abilities explain. Compute it for algebra (its loadings are in `fa$loadings`). Fill in the exponent that makes the loadings squared.

```r
L <- fa$loadings
round(sum(L["algebra", ] ^ ____), 3)
```
::check {"regex":"\\^\\s*2","gate":true,"difficulty":"beginner","ok":"Squaring is the point: communality is the sum of SQUARED loadings, which comes out to about 0.63 for algebra. That plus its uniqueness (0.37) is 1.","no":"Communality is the sum of squared loadings, so raise them to the power 2."}
::solution
```r
L <- fa$loadings
round(sum(L["algebra", ] ^ 2), 3)
#> [1] 0.628
```

=== step === quiz
::eyebrow Check yourself
## Reading the evidence

Two eigenvalues of the correlation matrix exceed 1, the one-factor model has p far below 0.05, and the two-factor model has p = 0.68. How many factors should Priya keep?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- One, because the first eigenvalue (2.38) is the largest ::no The largest eigenvalue does not mean one factor. Two eigenvalues top 1, and the one-factor test is rejected, so one is too few.
- Two: two eigenvalues exceed 1, and two factors is the first count the test does not reject ::ok Right. The eigenvalues and the likelihood test agree. Two factors is enough (p = 0.68, not rejected) and one is not (p far below 0.05).
- Six, one factor for each subject ::no Six factors would just relabel the original columns and explain nothing. The point is to find fewer hidden causes than observed variables.

=== step === concept
::eyebrow Placing the students
## Factor scores: where each student lands

Loadings describe the *subjects*. Priya also wants a number per *student*: how strong is each student in language, and in number ability? Those are the **factor scores**, estimated for every row. Ask `factanal()` for them:

```r
fs <- factanal(scores, factors = 2, scores = "regression")
round(head(fs$scores), 2)
#>      Factor1 Factor2
#> [1,]    0.39   -0.69
#> [2,]    0.38    0.08
#> [3,]    0.33   -1.46
#> [4,]   -0.24    1.60
#> [5,]    0.58    0.19
#> [6,]    1.03   -1.11
```

Each student now has two numbers, roughly standardized (mean 0, so positive is above average). Student 4 sits high on Factor2 (strong language, +1.60) but slightly below average on Factor1 (number). Student 6 is the mirror image: strong in number (+1.03), weak in language (-1.11). Priya has turned six raw columns into two interpretable abilities she can actually act on.

=== step === concept
::eyebrow The distinction that matters
## Factor analysis is not PCA

They look similar (both take correlated columns and hand back a few loadings) but they answer opposite questions. PCA re-expresses the data; factor analysis models where it came from.

| | PCA (Lesson 1) | Factor analysis |
|---|---|---|
| Question | Which directions capture the most spread? | What hidden factors produced these correlations? |
| Direction | Components are built **from** the observed columns | Observed columns are built **from** the factors |
| What it targets | Total variance | The shared correlation between variables |
| The leftover | No separate noise term; every bit of variance is kept | Splits off a **unique** part per variable (communality vs uniqueness) |
| Use it to | Compress or visualize | Test and name a theory of hidden causes |

You can feel the difference by running PCA on the very same data. It reports variance captured by components, not a model of hidden causes:

```r
round(summary(prcomp(scores, scale. = TRUE))$importance[, 1:3], 3)
#>                          PC1   PC2   PC3
#> Standard deviation     1.544 1.394 0.716
#> Proportion of Variance 0.397 0.324 0.085
#> Cumulative Proportion  0.397 0.721 0.807
```

Useful, but it never separates a subject's shared variance from its own, and it makes no claim about hidden abilities. Rule of thumb: reach for **PCA to compress or plot**, and **factor analysis to test and name the hidden structure** behind a correlation pattern.

=== step === quiz
::eyebrow Check yourself
## PCA or factor analysis?

Priya's colleague insists factor analysis and PCA are the same thing. What is the key difference?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- There is none; factanal and prcomp return identical loadings ::no They are genuinely different models and generally return different loadings, as you just saw on the same data.
- PCA blends the observed subjects to summarize variance; factor analysis models the subjects as arising from hidden factors, to explain their correlations ::ok Exactly. The arrow runs the opposite way, and factor analysis alone splits off a per-subject unique part and targets the correlations.
- PCA needs scaling but factor analysis ignores correlations entirely ::no Backwards. Factor analysis is built entirely around reproducing the correlation matrix; the correlations are its whole target.

=== step === concept
::eyebrow Honesty about limits
## Where factor analysis can go wrong

Factor analysis is powerful precisely because it commits to a model, and a model can be wrong. Keep these in mind:

- **It needs genuine latent structure.** Feed it columns with no real shared causes and it will still hand back factors, but they will be noise dressed as insight. Blocks in the correlation matrix are your sanity check that factors are worth seeking.
- **Heywood cases.** Sometimes the fit produces a communality above 1 or a negative uniqueness, which is impossible for real variance. It signals too many factors, too small a sample, or a variable that does not fit the model.
- **Factors are inferred, not proven.** The maths and language labels are *your* interpretation of the loadings, not a fact the data guarantees. A different analyst might name them differently.
- **Assumptions.** It expects roughly interval-scale, linearly related variables and enough rows (a common rule of thumb is several times more students than subjects). Too few rows and the loadings wobble.

[WARNING]
"The factors explain the correlations" is not the same as "these hidden abilities exist and caused the scores". Factor analysis proposes a plausible, testable structure. Confirming it is real takes theory and, ideally, fresh data.

=== step === concept
::eyebrow Go deeper
## References

Four trustworthy places to take factor analysis further:

- [An Introduction to Statistical Learning, ch. 12 (free PDF)](https://www.statlearning.com/) - the gentle, canonical treatment of unsupervised methods, with PCA alongside for contrast.
- [factanal: the R function documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/factanal.html) - every argument and every value the function you used returns.
- [William Revelle, psych package and "An Introduction to Psychometric Theory"](https://personality-project.org/r/book/) - the standard R toolkit (`fa()`, parallel analysis) and a deep, readable text on factor analysis.
- [Spearman (1904), General Intelligence, Objectively Determined and Measured](https://doi.org/10.2307/1412107) - the founding paper that started factor analysis from exactly Priya's kind of table.

=== step === complete
## Lesson 2 complete

You can now look at a wall of correlated columns and ask a modeler's question: what few hidden factors could have produced all this? You met the latent factor and the common-factor model, ran `factanal()` and read its loadings, split each variable into communality and uniqueness, watched the model rebuild the correlations, rotated to nameable simple structure, chose the number of factors three different ways, scored each student, and drew the sharp line between factor analysis and PCA.

Next, Lesson 3: k-Means and choosing k. PCA and factor analysis compressed the columns; now you will group the rows, sorting students (or flowers, or customers) into clusters, and face the central puzzle of how many clusters the data really has.
