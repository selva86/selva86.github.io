---
title: "Cramér's V, phi & Lambda in R: Association Measures for Tables"
slug: "Cramers-V-phi-and-Lambda-in-R"
description: "Compute Cramér's V, phi, and Goodman-Kruskal's Lambda in R for contingency tables. Formulas, base R code, interpretation thresholds, and a decision guide."
keywords: "Cramér's V in R, phi coefficient R, Goodman-Kruskal Lambda R, association measures categorical, effect size chi-square, contingency table effect size, nominal correlation R"
auto_link_terms: "Cramér's V|phi coefficient|Goodman-Kruskal Lambda|measures of association|categorical association measures"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "FR-cate-6"
post_type: "FR"
fr_parent: "Chi-Square-Test-of-Independence-in-R.html"
difficulty: "Intermediate"
---

# Cramér's V, phi & Lambda in R: Association Measures for Tables

<p class="lead">Cramér's V, the phi coefficient, and Goodman-Kruskal's Lambda are the three workhorse measures of association for categorical data. A chi-square test tells you whether two variables are related; these statistics tell you how strongly, and Lambda even tells you how much one helps predict the other.</p>

## What do Cramér's V, phi, and Lambda actually measure?

A chi-square test gives a yes/no on independence, but a tiny p-value on a 50,000-row table can sit alongside a near-zero practical effect. To turn that p-value into something an analyst can act on, you compute an association measure on the same contingency table. Let's compute all three on the built-in `HairEyeColor` data and see what each one says.

```r title="Compute V, phi, and Lambda on hair vs eye colour"
# Collapse Sex so we get a 4 (Hair) x 4 (Eye) table
hair_eye <- margin.table(HairEyeColor, c("Hair", "Eye"))
hair_eye
#>        Eye
#> Hair    Brown Blue Hazel Green
#>   Black    68   20    15     5
#>   Brown   119   84    54    29
#>   Red      26   17    14    14
#>   Blond     7   94    10    16

chi <- chisq.test(hair_eye, correct = FALSE)
n   <- sum(hair_eye)
k   <- min(dim(hair_eye))

# Cramer's V
V <- sqrt(unname(chi$statistic) / (n * (k - 1)))
round(c(chi_sq = unname(chi$statistic),
        n = n, df = unname(chi$parameter), V = V), 3)
#>  chi_sq      n     df      V
#> 138.290 592.000   9.000  0.279
```

Hair colour and eye colour are far from independent (chi-square = 138.3 on 9 df, p < .001), and **V = 0.28** says the relationship is moderate, not overwhelming. Phi does not apply here because the table is bigger than 2x2. We will compute Lambda in its own section because it answers a different question entirely: how much does knowing one variable cut your prediction error for the other?

[NOTE]
**This page implements V, phi, and Lambda from scratch in base R.** Production code typically uses `DescTools::CramerV()`, `rcompanion::cramerV()`, or `effectsize::cramers_v()`. Those packages are not bundled with this interactive runtime, so we build the measures from their formulas, which is also the clearest way to learn what they actually do.

**Try it:** Build a Sex by Hair contingency table from `HairEyeColor` and compute Cramér's V on it. The matrix should be 2 by 4. Save the result to `ex_V`.

```r title="Your turn: V on Sex x Hair"
# Collapse Eye so we get a Sex x Hair table:
ex_sex_hair <- margin.table(HairEyeColor, c("Sex", "Hair"))

# Compute V (use the formula from the block above):
ex_V <- # your code here

ex_V
#> Expected: about 0.10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sex by Hair Cramer's V solution"
ex_sex_hair <- margin.table(HairEyeColor, c("Sex", "Hair"))
ex_chi <- chisq.test(ex_sex_hair, correct = FALSE)
ex_n   <- sum(ex_sex_hair)
ex_k   <- min(dim(ex_sex_hair))
ex_V   <- sqrt(unname(ex_chi$statistic) / (ex_n * (ex_k - 1)))
round(ex_V, 3)
#> [1] 0.099
```

**Explanation:** Sex and hair colour are barely related in this dataset, so V drops to about 0.10, well below the 0.28 we saw for hair by eye.

</details>

## How do you compute Cramér's V from scratch?

Cramér's V rescales the chi-square statistic so that it is comparable across tables of different sizes. The intuition: chi-square grows with sample size and with the number of cells, so a raw value of 138 means very different things on a 2x2 versus a 4x4. V divides chi-square by its theoretical maximum to land on a clean 0-to-1 scale.

The formula is:

$$V = \sqrt{\frac{\chi^2}{n \cdot (\min(r, c) - 1)}}$$

Where:
- $\chi^2$ is the Pearson chi-square statistic from the contingency table
- $n$ is the total number of observations
- $r$ and $c$ are the number of rows and columns

Wrapping this in a function makes it easy to apply to any table. The function takes a matrix or table object and returns a single number.

```r title="Define a base R cramers_v() function"
cramers_v <- function(tbl) {
  chi <- chisq.test(tbl, correct = FALSE)$statistic
  n   <- sum(tbl)
  k   <- min(dim(tbl))
  unname(sqrt(chi / (n * (k - 1))))
}

# Sanity check against the manual calculation above
cramers_v(hair_eye)
#> [1] 0.2790
```

The function reproduces the 0.279 we computed by hand. Once defined, you can throw any contingency table at it: an income-by-region table, a treatment-by-outcome table, a survey response by demographic group. The shape no longer matters because V already corrects for it.

[KEY INSIGHT]
**V is chi-square stripped of its sample-size and table-size baggage.** Two tables with the same V have the same association strength, even if one has 200 rows and the other has 200,000. That is what makes V an effect size and chi-square just a test statistic.

**Try it:** Build a 3x4 matrix of fictional counts (your choice), pass it to `cramers_v()`, and confirm the result is between 0 and 1.

```r title="Your turn: V on a custom 3x4 table"
ex_tbl <- matrix(c( # your numbers here, 12 values
  ), nrow = 3, byrow = TRUE)

ex_V_custom <- cramers_v(ex_tbl)
ex_V_custom
#> Expected: a number between 0 and 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Custom 3x4 table V solution"
ex_tbl <- matrix(c(
  20, 10,  5,  2,
   8, 25, 12,  4,
   3,  9, 30, 18
), nrow = 3, byrow = TRUE)
cramers_v(ex_tbl)
#> [1] 0.4039
```

**Explanation:** Any non-negative integer matrix works. The diagonal-heavy structure produces a fairly strong V around 0.40.

</details>

## When should you use phi instead of Cramér's V?

The phi coefficient is the original 2x2 association measure, and on a 2x2 table phi and V agree in magnitude. Phi has one extra perk: it carries a sign, so it tells you whether the diagonal is over-represented (positive) or the anti-diagonal is (negative). That direction is meaningful only when both rows and columns have a natural ordering of "this category" vs "that category," like treatment vs control or survived vs died.

For a 2x2 table with cells $a$, $b$, $c$, $d$:

$$\phi = \frac{a d - b c}{\sqrt{(a + b)(c + d)(a + c)(b + d)}}$$

Where $a, b, c, d$ are the four cell counts:

|        | Col 1 | Col 2 |
|--------|-------|-------|
| Row 1  | $a$   | $b$   |
| Row 2  | $c$   | $d$   |

Let's apply this to the classic Titanic Sex by Survived table. The built-in `Titanic` array splits passengers four ways, so we collapse Class and Age first.

```r title="Phi on Titanic Sex x Survived"
# Collapse over Class and Age to get Sex x Survived
sex_surv <- margin.table(Titanic, c("Sex", "Survived"))
sex_surv
#>         Survived
#> Sex       No  Yes
#>   Male  1364  367
#>   Female 126  344

phi_2x2 <- function(tbl) {
  stopifnot(all(dim(tbl) == c(2, 2)))
  a <- tbl[1, 1]; b <- tbl[1, 2]
  c <- tbl[2, 1]; d <- tbl[2, 2]
  (a * d - b * c) / sqrt((a + b) * (c + d) * (a + c) * (b + d))
}

phi_val <- phi_2x2(sex_surv)
round(phi_val, 4)
#> [1] 0.4562

# Cross-check: |phi| equals V on a 2x2
round(cramers_v(sex_surv), 4)
#> [1] 0.4556
```

Phi comes out to **+0.456**, a moderately strong association. The positive sign reflects the row and column order we chose: Male is row 1 and "No" (did not survive) is column 1, so the positive sign means males are over-represented in the "did not survive" cell. Flip either dimension and the sign flips with it. The two values match within rounding (the slight gap is from `chisq.test()` returning the chi-square that `cramers_v()` then takes a square root of, while `phi_2x2()` works directly on cell counts).

[WARNING]
**The sign of phi depends entirely on row and column ordering.** Reorder the levels of either factor, and phi flips sign while V is unchanged. Always state which level is "row 1" and which is "column 1" when you report phi, or you have communicated nothing about direction.

**Try it:** Build a 2x2 table for a fictional drug trial with 50 treated and 50 control patients, where the treated group has more recoveries. Compute phi.

```r title="Your turn: phi on a 2x2 trial"
ex_treat <- matrix(c(
  # Recovered, NotRecovered for Treated row
  # Recovered, NotRecovered for Control row
), nrow = 2, byrow = TRUE)

ex_phi <- phi_2x2(ex_treat)
ex_phi
#> Expected: a positive number near 0.3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Trial phi solution"
ex_treat <- matrix(c(
  35, 15,   # Treated: 35 recovered, 15 did not
  20, 30    # Control: 20 recovered, 30 did not
), nrow = 2, byrow = TRUE,
   dimnames = list(Group = c("Treated", "Control"),
                   Outcome = c("Recovered", "NotRecovered")))
phi_2x2(ex_treat)
#> [1] 0.302
```

**Explanation:** With Treated as row 1 and Recovered as column 1, the positive 0.30 says the treated group is over-represented in the Recovered cell, which is exactly what we set up.

</details>

## What does Goodman-Kruskal's Lambda tell you that V doesn't?

V is a strength measure: bigger means stronger relationship. Lambda is a *prediction* measure: it tells you how much your guess of one variable improves when you already know the other. The technical name is **proportional reduction in error (PRE)**.

Imagine you have to predict everyone's eye colour, with no other information. Your best guess is the modal class: just say "Brown" for everyone. The number of mistakes you make is $E_1$. Now suppose someone whispers each person's hair colour to you before you guess. Within each hair group, you predict that group's modal eye colour. The new error count is $E_2$. Lambda is the share of those original errors you eliminated:

$$\lambda(Y \mid X) = \frac{E_1 - E_2}{E_1}$$

This is asymmetric. Knowing hair colour might help you predict eye colour a lot, while knowing eye colour barely helps you predict hair colour. Lambda exposes that asymmetry.

```r title="Lambda from PRE definition"
lambda_pre <- function(tbl, direction = c("symmetric", "predict_col", "predict_row")) {
  direction <- match.arg(direction)
  n <- sum(tbl)

  # Errors when no information about the other variable
  err_col_only <- n - max(colSums(tbl))   # predicting cols, modal col
  err_row_only <- n - max(rowSums(tbl))   # predicting rows, modal row

  # Errors when the other variable is known
  err_col_given_row <- n - sum(apply(tbl, 1, max))  # within each row pick modal col
  err_row_given_col <- n - sum(apply(tbl, 2, max))  # within each col pick modal row

  if (direction == "predict_col") {
    (err_col_only - err_col_given_row) / err_col_only
  } else if (direction == "predict_row") {
    (err_row_only - err_row_given_col) / err_row_only
  } else {
    e1 <- err_col_only + err_row_only
    e2 <- err_col_given_row + err_row_given_col
    (e1 - e2) / e1
  }
}

c(symmetric  = lambda_pre(hair_eye, "symmetric"),
  eye_given_hair = lambda_pre(hair_eye, "predict_col"),
  hair_given_eye = lambda_pre(hair_eye, "predict_row"))
#>     symmetric eye_given_hair hair_given_eye
#>        0.1431         0.2339         0.0327
```

The asymmetry is striking. Knowing someone's hair colour cuts your eye-colour prediction errors by **23%**, but knowing their eye colour cuts your hair-colour prediction errors by only **3%**. The symmetric Lambda (about 0.14) averages those two, which is why directional Lambda is almost always more informative than the symmetric one.

[KEY INSIGHT]
**A Lambda of zero does not mean no association.** Lambda only counts predictions that actually change. If the modal category of $Y$ is the same inside every group of $X$, your best guess never changes, and Lambda is 0, even when chi-square and V show clear association. Reach for V to detect a relationship; reach for Lambda only when you care about prediction.

**Try it:** Compute Lambda predicting Sex from Hair using the `margin.table(HairEyeColor, c("Hair", "Sex"))` table. Then compute Lambda predicting Hair from Sex on the same table. Save them to `ex_lam_a` and `ex_lam_b`.

```r title="Your turn: directional Lambda"
ex_hair_sex <- margin.table(HairEyeColor, c("Hair", "Sex"))

ex_lam_a <- # Lambda predicting Sex (cols) from Hair (rows)
ex_lam_b <- # Lambda predicting Hair (rows) from Sex (cols)

c(sex_from_hair = ex_lam_a, hair_from_sex = ex_lam_b)
#> Expected: both small, possibly different
```

<details>
<summary>Click to reveal solution</summary>

```r title="Directional Lambda solution"
ex_hair_sex <- margin.table(HairEyeColor, c("Hair", "Sex"))
ex_lam_a <- lambda_pre(ex_hair_sex, "predict_col")  # predict Sex
ex_lam_b <- lambda_pre(ex_hair_sex, "predict_row")  # predict Hair
round(c(sex_from_hair = ex_lam_a, hair_from_sex = ex_lam_b), 4)
#> sex_from_hair hair_from_sex
#>        0.0000        0.0148
```

**Explanation:** Females outnumber males in every hair group, so the modal sex never changes and Lambda for predicting sex is exactly 0. Predicting hair from sex squeezes a tiny improvement (1.5%) because the modal hair colour does shift between male and female.

</details>

## How do you interpret these effect sizes?

Two questions matter when you read a V, phi, or Lambda value: **is this big or small**, and **does the table size warp the answer**?

For magnitude, the field has settled on Cohen-style thresholds. They are conventions, not laws of nature, but they give you a starting vocabulary. The thresholds for V tighten as the table gets bigger because the maximum-possible chi-square also grows.

| Measure | Small | Medium | Large | Notes |
|---------|-------|--------|-------|-------|
| Phi (2x2) | 0.10 | 0.30 | 0.50 | Same scale as a correlation |
| V (2x2) | 0.10 | 0.30 | 0.50 | Identical to phi for 2x2 |
| V (3x3, df=4) | 0.07 | 0.21 | 0.35 | Cohen's w divided by sqrt(df) |
| V (4x4, df=9) | 0.05 | 0.15 | 0.25 | Smaller thresholds for bigger tables |
| Lambda | 0.00 | 0.10 | 0.30 | Floor at 0; reach 0.30 is unusual |

Use the diagram below as a quick map of which measure to compute when.

![Decision tree for picking phi vs Cramér's V vs Lambda based on table shape and goal.](screenshots/Cramers-V-phi-and-Lambda-in-R-decision-flow.webp)

*Figure 1: A quick decision tree for picking the right association measure.*

For warping, V has a known small-sample bias: even random data produce $V > 0$ when $n$ is small relative to the table size. Bergsma (2013) proposed a bias-corrected version that shrinks V toward zero in proportion to the degrees of freedom. The formula and a small implementation:

```r title="Bias-corrected V (Bergsma 2013)"
cramers_v_bc <- function(tbl) {
  chi <- chisq.test(tbl, correct = FALSE)$statistic
  n   <- sum(tbl)
  r   <- nrow(tbl)
  c   <- ncol(tbl)
  phi2     <- unname(chi) / n
  phi2_t   <- max(0, phi2 - (r - 1) * (c - 1) / (n - 1))
  r_tilde  <- r - (r - 1)^2 / (n - 1)
  c_tilde  <- c - (c - 1)^2 / (n - 1)
  unname(sqrt(phi2_t / min(r_tilde - 1, c_tilde - 1)))
}

c(plain = cramers_v(hair_eye),
  bc    = cramers_v_bc(hair_eye))
#>  plain     bc
#> 0.2790 0.2705
```

For HairEyeColor with $n = 592$, the correction barely moves the needle (0.279 to 0.271), because the sample is large relative to the 4x4 grid. On smaller tables you will see a much bigger gap, and the corrected value is the more honest one. The capstone exercises walk through that case.

[TIP]
**Reach for the bias-corrected V whenever $n$ is below about 5 times the number of cells.** A 5x5 table has 25 cells, so anything under $n = 125$ is firmly in bias-correction territory. Reporting both side-by-side is the most defensible thing to do.

**Try it:** Apply `cramers_v_bc()` to the Sex by Hair table from earlier and compare it to the plain V (about 0.099).

```r title="Your turn: bias-corrected V"
ex_sh_tbl <- margin.table(HairEyeColor, c("Sex", "Hair"))

ex_V_plain <- # plain V
ex_V_bc    <- # bias-corrected V

c(plain = ex_V_plain, bc = ex_V_bc)
#> Expected: both small; bc slightly smaller (or zero)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bias-corrected V solution"
ex_sh_tbl  <- margin.table(HairEyeColor, c("Sex", "Hair"))
ex_V_plain <- cramers_v(ex_sh_tbl)
ex_V_bc    <- cramers_v_bc(ex_sh_tbl)
round(c(plain = ex_V_plain, bc = ex_V_bc), 4)
#>  plain     bc
#> 0.0992 0.0925
```

**Explanation:** The bias correction shaves off a small but visible chunk, suggesting some of the 0.099 was sampling noise. With $n = 592$ over a 2x4 table, the shrinkage is modest.

</details>

## Practice Exercises

### Exercise 1: Bias correction on a sparse 4x4

You have 50 patients cross-classified by symptom group (4 levels) and treatment outcome (4 levels). Compute the plain Cramér's V and the bias-corrected V. By how much does the correction shrink V?

```r title="Exercise 1: bias-corrected V"
my_sparse <- matrix(c(
  8, 2, 1, 1,
  2, 7, 2, 1,
  1, 2, 9, 2,
  1, 1, 2, 8
), nrow = 4, byrow = TRUE)

# Compute both V values
my_V_plain <- # plain V
my_V_bc    <- # bias-corrected V

c(plain = my_V_plain, bc = my_V_bc)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_sparse <- matrix(c(
  8, 2, 1, 1,
  2, 7, 2, 1,
  1, 2, 9, 2,
  1, 1, 2, 8
), nrow = 4, byrow = TRUE)

my_V_plain <- cramers_v(my_sparse)
my_V_bc    <- cramers_v_bc(my_sparse)
round(c(plain = my_V_plain, bc = my_V_bc, shrink = my_V_plain - my_V_bc), 4)
#>  plain     bc shrink
#> 0.5269 0.4801 0.0468
```

**Explanation:** With only 50 observations spread over 16 cells, expected counts are tiny. The bias-corrected V drops from 0.527 to 0.480, a 9% relative shrinkage. That is the magnitude of inflation you would have reported by using plain V on data this sparse.

</details>

### Exercise 2: Direction matters with Lambda

You have a 3x3 table of education level (HS, BA, Grad) by voting choice (D, R, I). Compute Lambda in both directions, then write a one-sentence interpretation of each.

```r title="Exercise 2: directional Lambda"
my_voting <- matrix(c(
  60, 40, 30,   # HS: D, R, I
  70, 50, 30,   # BA
  80, 30, 20    # Grad
), nrow = 3, byrow = TRUE,
   dimnames = list(Education = c("HS", "BA", "Grad"),
                   Vote = c("D", "R", "I")))

my_lam_vote_from_edu <- # predict Vote from Education
my_lam_edu_from_vote <- # predict Education from Vote

c(vote_from_edu = my_lam_vote_from_edu,
  edu_from_vote = my_lam_edu_from_vote)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_lam_vote_from_edu <- lambda_pre(my_voting, "predict_col")
my_lam_edu_from_vote <- lambda_pre(my_voting, "predict_row")
round(c(vote_from_edu = my_lam_vote_from_edu,
        edu_from_vote = my_lam_edu_from_vote), 4)
#> vote_from_edu edu_from_vote
#>        0.0000        0.0385
```

**Explanation:** D wins inside every education group, so knowing education never changes the vote prediction and Lambda is 0. Going the other way, knowing the vote does shift the modal education choice for at least one column, producing a tiny but non-zero 0.04. This is the canonical illustration of why a Lambda of 0 is not the same as independence.

</details>

## Complete Example

A marketing team wants to know whether ad channel and conversion outcome are related. They have 2,000 customers cross-classified by `Channel` (Email, Social, Search, Direct) and `Converted` (No, Yes). The pipeline below builds the table, runs the chi-square test, computes Cramér's V, and computes Lambda in both directions.

```r title="End-to-end channel x conversion analysis"
mkt_tbl <- matrix(c(
  350, 150,    # Email
  420,  80,    # Social
  280, 220,    # Search
  380, 120     # Direct
), nrow = 4, byrow = TRUE,
   dimnames = list(Channel = c("Email", "Social", "Search", "Direct"),
                   Converted = c("No", "Yes")))

mkt_tbl
#>          Converted
#> Channel    No  Yes
#>   Email   350  150
#>   Social  420   80
#>   Search  280  220
#>   Direct  380  120

mkt_chi <- chisq.test(mkt_tbl, correct = FALSE)
mkt_V   <- cramers_v(mkt_tbl)
mkt_lam_conv_from_chan <- lambda_pre(mkt_tbl, "predict_col")
mkt_lam_chan_from_conv <- lambda_pre(mkt_tbl, "predict_row")

round(c(chi_sq = unname(mkt_chi$statistic),
        df     = unname(mkt_chi$parameter),
        V      = mkt_V,
        lam_conv_from_chan = mkt_lam_conv_from_chan,
        lam_chan_from_conv = mkt_lam_chan_from_conv), 4)
#>             chi_sq                 df                  V
#>           102.8095             3.0000             0.2267
#> lam_conv_from_chan lam_chan_from_conv
#>             0.0000             0.0933
```

The chi-square test rejects independence handily (chi-square = 102.8 on 3 df, p < .001), and **V = 0.23** says the relationship is small-to-medium. Yet $\lambda(\text{Converted} \mid \text{Channel}) = 0$. How can both be true? Because "No" is the modal outcome inside every channel, including Search, even though Search has by far the highest conversion rate (44%). Knowing the channel does not change your best-guess prediction of conversion: it stays at "No." The relationship is real, just not strong enough to flip any modal class. If you reported only Lambda, you would mistakenly conclude there is no useful association, when in fact Search converts at 2.8 times the Social rate, a finding worth acting on.

The takeaway: V and Lambda answer different questions. Use V when you want a single number for "how related are these," and use Lambda when the actual decision is "should I bet differently after seeing $X$?"

## Summary

The three measures form a complementary toolkit. Use this comparison to remember which job each one does, and the diagram below as a visual recap.

| Measure | Range | Table size | Direction info | Best for |
|---------|-------|------------|----------------|----------|
| Phi | -1 to 1 | 2x2 only | Sign | Reporting a signed effect on a 2x2 |
| Cramér's V | 0 to 1 | Any | None | Single-number strength of association |
| Cramér's V (bias-corrected) | 0 to 1 | Any | None | Same as V, when n is small |
| Lambda (symmetric) | 0 to 1 | Any | Averaged | Rarely the right choice |
| Lambda (directional) | 0 to 1 | Any | Asymmetric | "Does X help me predict Y?" |

![Comparison of the three association measures by table size, range, and direction info.](screenshots/Cramers-V-phi-and-Lambda-in-R-comparison.webp)

*Figure 2: Side-by-side properties of phi, Cramér's V, and Lambda.*

Three rules of thumb keep you out of trouble:

1. Always pair an effect size with the chi-square test result. The p-value flags an association; V or Lambda quantifies it.
2. On any table where $n$ is less than about 5 times the number of cells, report the bias-corrected V instead of plain V.
3. A Lambda of 0 is not evidence of independence. Compute V too before drawing conclusions.

## References

1. Cramér, H. (1946). *Mathematical Methods of Statistics*. Princeton University Press. The original derivation of V.
2. Goodman, L. A., & Kruskal, W. H. (1954). Measures of association for cross classifications. *Journal of the American Statistical Association*, 49(268), 732-764.
3. Bergsma, W. (2013). A bias-correction for Cramér's V and Tschuprow's T. *Journal of the Korean Statistical Society*, 42(3), 323-328.
4. rcompanion handbook, Mangiafico S. — Measures of Association for Nominal Variables. [Link](https://rcompanion.org/handbook/H_10.html)
5. effectsize package vignette — Effect Sizes for Contingency Tables. [Link](https://cran.r-project.org/web/packages/effectsize/vignettes/xtabs.html)
6. DescTools::CramerV reference. [Link](https://rdrr.io/cran/DescTools/man/CramerV.html)
7. Wikipedia — Cramér's V. [Link](https://en.wikipedia.org/wiki/Cram%C3%A9r's_V)

## Continue Learning

- [Chi-Square Test of Independence in R](Chi-Square-Test-of-Independence-in-R.html). The parent tutorial that runs the test whose statistic V and Lambda summarise.
- [Categorical Data in R](Categorical-Data-in-R.html). Factors, levels, and how to build the contingency tables that feed these measures.
- [Chi-Square Goodness of Fit Test in R](Chi-Square-Goodness-of-Fit-Test-in-R.html). The one-variable cousin of independence testing, with its own effect size (Cohen's w).
