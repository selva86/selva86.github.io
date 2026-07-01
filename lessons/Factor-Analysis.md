---
title: "Unsupervised Learning Lesson 2: Factor Analysis"
catalog_blurb: "Find the hidden factors behind correlated measurements, and how it differs from PCA."
description: "Learn factor analysis in R: what a latent factor is, the factor model and communalities, running factanal to read loadings, and how it differs from PCA."
keywords: "factor analysis in R, factanal, latent factors, loadings, communalities, uniqueness, exploratory factor analysis, PCA vs factor analysis, unsupervised learning"
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

In Lesson 1, PCA took many correlated columns and repackaged them into a few directions of maximum spread. Factor analysis starts from the same raw material, correlated columns, but asks a completely different question.

Meet Dr. Anand, a school psychologist. She gives 300 students six tests: vocabulary, reading, and essay writing, then algebra, geometry, and calculus. Six numbers per student. When she lines up how the scores move together, a striking pattern appears in the grid below: the three language tests rise and fall together, the three math tests rise and fall together, and across the two groups there is almost no relationship at all.

::widget correlation-heatmap {"vars":["vocabulary","reading","essay","algebra","geometry","calculus"],"matrix":[[1,0.81,0.75,-0.01,0.02,-0.06],[0.81,1,0.76,-0.01,0.03,-0.04],[0.75,0.76,1,-0.01,0.03,-0.06],[-0.01,-0.01,-0.01,1,0.81,0.76],[0.02,0.03,0.03,0.81,1,0.75],[-0.06,-0.04,-0.06,0.76,0.75,1]]}

Two green blocks, nothing in between. It is as if two invisible things are pulling the strings: one lifts every language score, another lifts every math score. Dr. Anand cannot measure "verbal ability" or "math ability" with a ruler, yet the pattern begs for them. Factor analysis is the tool that recovers those hidden things from the correlations alone.

By the end of this lesson you will be able to:

- Say what a latent factor is, and how factor analysis differs from PCA
- Read the factor model equation and define loading, communality, and uniqueness
- Run factor analysis in R, read the loadings, and check how many factors you need

**Prerequisites:** you have done [Lesson 1 on PCA](PCA-in-R.html) (correlation, variance explained, scaling) and can run R. No linear algebra assumed; every term is defined as it appears.

=== step === concept
::eyebrow The reframe
## Two questions, two tools

PCA and factor analysis both start with a table of correlated numbers, and both hand you back a smaller set of numbers. That is why they are so often confused. But they are answers to different questions.

PCA is a **summary**. It rebuilds your data as new axes ranked by spread, with no story about where the data came from. Factor analysis is a **model**. It assumes there are a few unseen causes, called **latent factors** (latent just means hidden, not directly measured), and that those causes are what make your observed columns correlate. A latent factor for Dr. Anand is "verbal ability": no single column, but the shared thing that makes vocabulary, reading, and essay move together.

| Question | PCA | Factor analysis |
|---|---|---|
| What it asks | Which new axes capture the most spread? | What hidden factors could have produced these scores? |
| Direction of thinking | Data leads to components (a summary of the data) | Factors lead to data (a model of the data's causes) |
| Noise term | None; components re-express all the variance | Each variable keeps its own leftover, its unique part |
| What you read at the end | Scores and variance explained | Loadings, communalities, and the factors' meaning |

[KEY INSIGHT]
PCA re-describes the variance you have. Factor analysis proposes hidden causes that would explain why your variables correlate in the first place. Same input, opposite direction of reasoning.

=== step === concept
::eyebrow The model
## The factor model, in one equation

Here is the whole idea as a formula. Write each student's standardized test score \(x_j\) (the j-th of the six tests) as a blend of the shared factors plus a leftover:

\[ x_j = \lambda_{j1} F_1 + \lambda_{j2} F_2 + \varepsilon_j \]

Every symbol, in plain words:

- \(x_j\): one observed, standardized test score (say, vocabulary).
- \(F_1, F_2\): the two **common factors** shared by all six tests. Here \(F_1\) is verbal ability and \(F_2\) is quantitative ability. They are unmeasured; we only ever see the six \(x_j\).
- \(\lambda_{jm}\): the **loading** of test \(j\) on factor \(m\), how strongly that factor drives that test. Vocabulary should load heavily on \(F_1\) and near zero on \(F_2\).
- \(\varepsilon_j\): the **unique factor** for test \(j\), everything about that one test the common factors do not explain: its own specific skill plus measurement noise.

From the loadings come the two numbers you will read most. Because the scores are standardized (total variance 1), the **communality** is the share of a test's variance the common factors explain, and the **uniqueness** is the leftover:

\[ h_j^2 = \lambda_{j1}^2 + \lambda_{j2}^2, \qquad \psi_j = 1 - h_j^2 \]

And here is the deepest difference from PCA. Factor analysis chooses the loadings \(\Lambda\) and uniquenesses \(\Psi\) so that together they rebuild the correlation matrix you started with:

\[ \Sigma = \Lambda \Lambda^\top + \Psi \]

\(\Sigma\) is the correlation grid from the cover, \(\Lambda\) is the 6-by-2 table of loadings, and \(\Psi\) is a diagonal of the six uniquenesses. PCA has no \(\Psi\) term at all. That extra "each variable gets its own private noise" is exactly what turns a summary into a model of hidden causes.

=== step === quiz
::eyebrow Check yourself
## What is a uniqueness?

In Dr. Anand's fit, the vocabulary test comes out with a uniqueness of about 0.20. What does that 0.20 represent?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The share of vocabulary's variance the two common factors do NOT explain: its own specific part plus noise ::ok Exactly. Uniqueness is 1 minus communality. About 80% of vocabulary is explained by the shared verbal factor, and the remaining 20% is unique to that test.
- The correlation between vocabulary and reading ::no That is a correlation between two tests. Uniqueness is about ONE test: the slice of its variance the common factors leave unexplained.
- The weight of vocabulary on the verbal factor ::no That weight is the loading (about 0.89 here). Uniqueness is the leftover variance after the factors, not a loading.

=== step === tryit
::eyebrow Your turn
## Fit factor analysis in R

Base R ships factor analysis in one function, `factanal`. Before running it, here is the whole procedure so nothing is a black box:

::widget process-flow {"steps":[{"title":"Standardize","sub":"put every test on a mean-0, sd-1 scale (factanal does this for you)"},{"title":"Estimate","sub":"find the loadings and uniquenesses that best rebuild the correlations"},{"title":"Test","sub":"ask whether this many factors is enough (a chi-square test)"},{"title":"Rotate and score","sub":"rotate for a clean reading, then place each student on the factors"}]}

First, build the data. To have an answer we can check against, we invent two hidden abilities and let them drive the six tests. In real life you never see these two columns; you see only the six scores, and recovering the abilities is the entire job of factor analysis.

```r
set.seed(42)
n <- 300
verbal <- rnorm(n)   # each student's hidden verbal ability
quant  <- rnorm(n)   # each student's hidden quantitative ability

# Six tests, each driven by ONE ability plus its own noise:
tests <- data.frame(
  vocabulary = round(55 + 10*verbal + rnorm(n, 0, 5)),
  reading    = round(58 + 11*verbal + rnorm(n, 0, 5)),
  essay      = round(60 +  9*verbal + rnorm(n, 0, 6)),
  algebra    = round(57 + 11*quant  + rnorm(n, 0, 5)),
  geometry   = round(59 + 10*quant  + rnorm(n, 0, 5)),
  calculus   = round(56 +  9*quant  + rnorm(n, 0, 6))
)
round(cor(tests), 2)          # the same two blocks you saw on the cover
#>            vocabulary reading essay algebra geometry calculus
#> vocabulary       1.00    0.81  0.75   -0.01     0.02    -0.06
#> reading          0.81    1.00  0.76   -0.01     0.03    -0.04
#> essay            0.75    0.76  1.00   -0.01     0.03    -0.06
#> algebra         -0.01   -0.01 -0.01    1.00     0.81     0.76
#> geometry         0.02    0.03  0.03    0.81     1.00     0.75
#> calculus        -0.06   -0.04 -0.06    0.76     0.75     1.00
```

Now fit the model. `factanal` needs one thing from you: how many hidden factors you believe are behind the six tests. Fill in the blank.

```r
fa <- factanal(tests, factors = ____, scores = "regression")
fa
```
::check {"regex":"factors\\s*=\\s*2","gate":true,"difficulty":"beginner","ok":"Two abilities, so two factors. factanal estimates them by maximum likelihood and prints the loadings and uniquenesses.","no":"We suspect two hidden abilities, verbal and quantitative, so set factors = 2."}
::solution
```r
fa <- factanal(tests, factors = 2, scores = "regression")
fa
```

=== step === concept
::eyebrow Reading the output
## Loadings: what each factor means

The **loadings** are the heart of the result: how strongly each factor drives each test. `factanal` hides tiny loadings (below about 0.1) so the structure jumps out.

```r
fa <- factanal(tests, factors = 2, scores = "regression")
fa$loadings
#>
#> Loadings:
#>            Factor1 Factor2
#> vocabulary  0.893
#> reading     0.907
#> essay       0.837
#> algebra             0.909
#> geometry            0.890
#> calculus            0.839
#>
#>                Factor1 Factor2
#> SS loadings      2.326   2.322
#> Proportion Var   0.388   0.387
#> Cumulative Var   0.388   0.775
```

Read it row by row. Vocabulary, reading, and essay load heavily on Factor 1 and blank on Factor 2. Algebra, geometry, and calculus do the reverse. Each test loads on exactly one factor. That clean one-factor-per-variable pattern is called **simple structure**, and it is what lets Dr. Anand confidently name Factor 1 "verbal ability" and Factor 2 "quantitative ability". Factor analysis recovered the two hidden columns from the correlations alone, never having seen them.

Because we asked for `scores = "regression"`, we also get each student's estimated position on the two factors. Plot them and every student becomes a single dot on a verbal-versus-quantitative map:

```r
scores <- as.data.frame(fa$scores)
plot(scores$Factor1, scores$Factor2,
     xlab = "Factor 1 (verbal ability)",
     ylab = "Factor 2 (quantitative ability)",
     pch = 19, col = "#2563a8")
```

=== step === concept
::eyebrow How much was explained
## Communalities: the factors' reach

The **communality** of a test is how much of its variance the two factors together account for. It is just the squared loadings added up, and the leftover is the uniqueness.

```r
# Communality = variance a test shares with the common factors
round(1 - fa$uniquenesses, 2)
#> vocabulary    reading      essay    algebra   geometry   calculus
#>       0.80       0.82       0.70       0.83       0.79       0.71
```

Reading and algebra sit around 0.82 and 0.83: the shared abilities explain most of what those tests measure. Essay and calculus, near 0.70, keep more that is theirs alone (essay writing leans on something beyond raw verbal ability). The bars below rank the tests by communality, so you can see at a glance which tests the two factors capture best.

::widget importance-bars {"items":[{"label":"algebra","value":83},{"label":"reading","value":82},{"label":"vocabulary","value":80},{"label":"geometry","value":79},{"label":"calculus","value":71},{"label":"essay","value":70}]}

=== step === concept
::eyebrow Choosing and trusting
## How many factors? And the fine print

We assumed two factors. `factanal` can check that assumption with a formal test: its null hypothesis is "this many factors is enough to reproduce the correlations."

```r
# Is two factors enough? A high p-value here is GOOD news.
c(chi_square = round(fa$STATISTIC, 2),
  df         = fa$dof,
  p_value    = round(fa$PVAL, 3))
#> chi_square         df    p_value
#>       1.25       4.00      0.869
```

The p-value is 0.869, far above 0.05, so we do not reject the two-factor model: two factors already rebuild the six correlations well. Note the flipped logic from most tests you have met: a **high** p-value means the model fits, because the null is the model being adequate.

Two more things worth knowing before you trust a factor solution:

- **Rotation.** The clean simple structure above is not automatic; `factanal` applies a varimax rotation by default, which spins the factors to make each variable load on as few as possible. Rotation changes the loadings' presentation, not the fit.

[WARNING]
Factor analysis has real limits. It needs several variables per factor (three or more) to be stable. Factor **scores are estimated, not exact**, so treat a student's position as approximate. And the method only finds **linear common causes**: you still choose the number of factors and must name them yourself, which takes judgement, not just code.

=== step === quiz
::eyebrow Check yourself
## PCA or factor analysis?

A colleague has 15 survey items and believes a few unmeasured attitudes are what make the items correlate. She wants to estimate those attitudes and see which items measure each one. Which method fits her goal?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Factor analysis: she is positing hidden causes behind the correlations, exactly what it models ::ok Right. She hypothesizes latent attitudes that PRODUCE the item correlations and wants their loadings. That is the factor-analysis question, not the PCA one.
- PCA, because it always keeps more of the variance ::no PCA re-expresses variance; it does not model hidden causes. "More variance kept" is not her goal, recovering interpretable latent attitudes is.
- Neither, you cannot model variables you never observed ::no Modeling unobserved (latent) variables from the correlations of observed ones is precisely what factor analysis does.

=== step === concept
::eyebrow Go deeper
## References

Four trustworthy places to take factor analysis further:

- [The Elements of Statistical Learning, section 14.7 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - factor analysis as a latent-variable model, and how it relates to PCA.
- [factanal: the R function you used, full documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/factanal.html) - every argument and every value it returns.
- [Costello and Osborne (2005), Best Practices in Exploratory Factor Analysis (open access)](https://scholarworks.umass.edu/pare/vol10/iss1/7/) - a short, practical checklist: how many factors, which rotation, how much data.
- [Revelle, Using the psych package for factor analysis in R (PDF)](https://personality-project.org/r/psych/HowTo/factor.pdf) - a step-by-step walkthrough for when you outgrow factanal.

=== step === complete
## Lesson 2 complete

You can now tell factor analysis apart from PCA (a model of hidden causes, not a summary of variance), read the factor model equation, run `factanal`, and interpret loadings, communalities, and the number-of-factors test. You watched it recover Dr. Anand's two abilities from the correlations alone.

Next, Lesson 3: k-Means and Choosing k. PCA and factor analysis both work on the columns, the variables. k-means turns to the rows, the individual students, and asks a new question: which ones clump together into groups, and how do you decide how many groups there are?
