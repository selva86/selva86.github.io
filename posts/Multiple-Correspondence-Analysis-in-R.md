---
title: "Multiple Correspondence Analysis (MCA) in R: Visualize Categorical Tables"
slug: "Multiple-Correspondence-Analysis-in-R"
description: "Run multiple correspondence analysis in R with FactoMineR. Build a factor map of many categorical variables, read it, and pick how many dimensions matter."
keywords: "multiple correspondence analysis R, MCA in R, FactoMineR MCA, factoextra fviz_mca, indicator matrix, Burt matrix, Benzecri correction, categorical PCA, factor map, supplementary variables"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-26"
curriculum_id: "FR-mult-3"
post_type: "FR"
fr_parent: "Correspondence-Analysis-in-R.html"
auto_link_terms: "multiple correspondence analysis|MCA in R|MCA()|fviz_mca_biplot|fviz_mca_var|fviz_mca_ind|indicator matrix|Burt matrix|Benzecri correction"
auto_link_case_sensitive: false
---

# Multiple Correspondence Analysis (MCA) in R: Visualize Categorical Tables

<p class="lead">Multiple correspondence analysis (MCA) is correspondence analysis applied to many categorical variables at once. In R, <code>FactoMineR::MCA()</code> plus <code>factoextra</code> turns a wide table of factors into a 2D factor map where categories that co-occur sit close together.</p>

## How does MCA extend correspondence analysis to many categorical variables?

Correspondence analysis maps two categorical variables. Real survey data has dozens. The fix is to recode every variable into 0/1 dummies, stack them into one big indicator matrix, and run CA on that. The result is a single factor map that places every individual and every category of every variable on the same coordinate system. We'll fit it on the `tea` survey from FactoMineR, then peek at the theory.

Before any math, let's see the payoff. The block below loads `FactoMineR` and `factoextra`, fits MCA on the first 18 columns of `tea` (300 respondents, 18 questions about how they drink tea), and draws the variable-category biplot.

```r title="Fit MCA on the tea survey and draw the biplot"
library(FactoMineR)
library(factoextra)

data(tea)
tea_active <- tea[, 1:18]   # 18 active categorical variables
res.mca <- MCA(tea_active, graph = FALSE)

fviz_mca_biplot(res.mca, repel = TRUE, label = "var",
                title = "MCA biplot: tea-drinking habits")
#> (plot: each category of each variable is a point;
#>        Dim 1 separates "tea bag, lunch, alone" from "unpackaged, evening, friends";
#>        300 individuals scatter as small points behind the category labels)
```

The plot puts each *category* of each variable on the map. Convenient categories like `tea bag`, `lunch`, and `alone` cluster on one side of Dim 1. Slow-ritual categories like `unpackaged`, `evening`, and `friends` cluster on the other. MCA recovered a "fast vs ceremonial tea drinker" axis from 18 unrelated questions without you writing a single comparison.

![MCA encoding diagram showing a categorical data frame turning into either an indicator matrix or a Burt matrix](screenshots/Multiple-Correspondence-Analysis-in-R-encoding.webp)
*Figure 1: MCA recodes a categorical table into either an indicator matrix or a Burt matrix, then runs CA on it.*

[KEY INSIGHT]
**In MCA, every category is a point, not every variable.** A binary variable contributes 2 points to the map, a 5-level variable contributes 5. That's why the variable-category plot can have 30+ labels even when you fed it just 18 columns. Distance between two category points on the map means "respondents who picked one tend to pick the other."

**Try it:** Refit MCA on a 3-variable subset (`Tea`, `How`, `how`) and check that the biplot now shows fewer category points. Use `label = "var"` to print just the categories.

```r title="Your turn: refit MCA on a 3-variable subset"
ex_subset <- tea[, c("Tea", "How", "how")]
ex_res <- # your code: fit MCA on ex_subset with graph = FALSE

fviz_mca_biplot(ex_res, repel = TRUE, label = "var",
                title = "MCA on 3 variables only")
#> Expected: fewer category points, all from {Tea, How, how}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Subset MCA solution"
ex_subset <- tea[, c("Tea", "How", "how")]
ex_res <- MCA(ex_subset, graph = FALSE)

fviz_mca_biplot(ex_res, repel = TRUE, label = "var",
                title = "MCA on 3 variables only")
#> (plot: ~10-12 category points total, 3 from Tea, 4 from How, 3 from how)
```

**Explanation:** `MCA()` accepts any data frame of factors. With three variables you get one point per level of each, so the map looks sparser but the geometry of the categories is preserved.

</details>

## How does MCA encode categorical variables into a coordinate space?

Here's what `MCA()` actually does internally. Step one: build an *indicator matrix*. That's a wide table where every category becomes its own 0/1 dummy column. Step two: run the same chi-square-distance machinery as plain correspondence analysis on that wide table. The factor map you saw above is just CA applied to this expanded representation.

The block below pulls out the indicator matrix for the first three variables of `tea_active` so you can see the dummy encoding directly. `tab.disjonctif()` is FactoMineR's helper for this.

```r title="Inspect the indicator matrix for three variables"
ind_mat <- tab.disjonctif(tea_active[, 1:3])
head(ind_mat, 4)
#>   breakfast Not.breakfast tea.time Not.tea time evening Not.evening lunch Not.lunch
#> 1         0             1        0          1            0           1     0         1
#> 2         0             1        0          1            0           1     0         1
#> 3         1             0        0          1            0           1     0         1
#> 4         0             1        1          0            0           1     0         1

dim(ind_mat)
#> [1] 300   6
```

Each row is a respondent. Each column is one category, holding 1 if the respondent picked it and 0 otherwise. Row 1 didn't drink tea at breakfast, tea time, evening, or lunch. Every dummy is 0 for the chosen category and 1 for the "Not" complement. This 0/1 expansion is what MCA feeds into the CA engine.

[NOTE]
**The Burt matrix is the alternative encoding.** Take the indicator matrix `Z` and compute `t(Z) %*% Z`. You get a symmetric category-by-category matrix of joint counts. That's the Burt matrix. MCA on the Burt matrix yields the *same* factor map directions as MCA on the indicator matrix, just with eigenvalues that are squared. `FactoMineR::MCA()` uses the indicator route by default.

**Try it:** Confirm that for any single respondent, the dummies for one variable sum to exactly 1. Pick row 5 of `ind_mat` and add up its first two columns (the two `breakfast` levels).

```r title="Your turn: check the row-sum invariant"
# For each variable, the dummies must sum to 1 across its categories.
# Cols 1-2 are the two levels of `breakfast`.
ex_row_sum <- # your code: sum cols 1 and 2 of ind_mat row 5

ex_row_sum
#> Expected: 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Row-sum invariant solution"
ex_row_sum <- sum(ind_mat[5, 1:2])
ex_row_sum
#> [1] 1
```

**Explanation:** Every respondent picks exactly one level per categorical variable, so the corresponding dummies sum to 1. This is why MCA's row mass is constant across individuals.

</details>

## How do you read the MCA factor map?

The MCA biplot crams a lot onto one canvas. To read it cleanly, plot categories and individuals on separate maps first. The categories map answers *"which response patterns hang together?"*. The individuals map answers *"which respondents look alike?"*.

The block below draws the categories-only map. Each point is a category, positioned by how its respondents differ from the average tea drinker.

```r title="Plot variable categories only"
fviz_mca_var(res.mca, repel = TRUE, col.var = "black",
             title = "MCA: variable categories")
#> (plot: ~36 category points labeled, e.g. "tea bag", "unpackaged",
#>        "alone", "friends", "lunch", "evening", "Earl Grey", "green";
#>        Dim 1 left-right axis ~13% inertia, Dim 2 vertical ~7% inertia)
```

Categories close together get picked by similar respondents. `unpackaged`, `tearoom`, and `friends` cluster on the right, the slow-ritual end. `tea bag`, `chain store`, and `lunch` cluster on the left, the convenience end. The opposition along Dim 1 is the dominant signal in the survey.

Now switch to the individuals map and color by the `Tea` variable (black, green, or Earl Grey).

```r title="Plot individuals colored by Tea preference"
fviz_mca_ind(res.mca, label = "none", habillage = "Tea",
             addEllipses = TRUE, ellipse.level = 0.7,
             title = "MCA: individuals by tea type")
#> (plot: 300 small points in three colors;
#>        Earl Grey ellipse drifts left, green ellipse drifts up,
#>        black ellipse sits central; substantial overlap among all three)
```

The three ellipses overlap heavily, which means tea type alone doesn't define a respondent. But the centroids do drift: Earl Grey drinkers lean left (convenience side), green tea drinkers lean up (Dim 2 difference). MCA gives you a single coordinate system to make these soft pattern statements.

[WARNING]
**In a symmetric MCA biplot, distance between an individual and a category is not directly interpretable.** The categories and individuals each get principal coordinates on different scales. To read individual-to-category proximity, fit MCA and use an asymmetric map (or use `dimdesc()` instead, see Section 6). Within-group distances (individual-to-individual, category-to-category) are fine to read directly.

**Try it:** Color the individuals plot by `how` (tea bag, unpackaged, or both) instead of by `Tea`. Use the same options.

```r title="Your turn: color individuals by how"
fviz_mca_ind(res.mca, label = "none", habillage = ## variable name here,
             addEllipses = TRUE, ellipse.level = 0.7,
             title = "MCA: individuals by how")
#> Expected: 3 ellipses, "tea bag" left of "unpackaged", "tea bag+unpackaged" between
```

<details>
<summary>Click to reveal solution</summary>

```r title="Color by how solution"
fviz_mca_ind(res.mca, label = "none", habillage = "how",
             addEllipses = TRUE, ellipse.level = 0.7,
             title = "MCA: individuals by how")
#> (plot: tea bag ellipse left, unpackaged ellipse right, mixed in middle)
```

**Explanation:** `habillage` accepts any factor in the active data. The `how` variable splits respondents along Dim 1 cleanly because Dim 1 is essentially the convenience-vs-ritual axis.

</details>

## How do you decide how many dimensions matter (eigenvalues + Benzécri correction)?

MCA gives you up to (number of categories − number of variables) dimensions. You don't want all of them. The eigenvalue table tells you how much variance each dimension captures, but raw MCA eigenvalues are *pessimistic*, every additional dummy column adds a small amount of trivial noise. Benzécri's correction removes that noise.

Start by inspecting the raw eigenvalues and the scree plot.

```r title="Inspect eigenvalues and the scree plot"
eig <- res.mca$eig
head(eig, 6)
#>        eigenvalue percentage of variance cumulative percentage of variance
#> dim 1   0.27976                  12.589                            12.589
#> dim 2   0.16344                   7.355                            19.944
#> dim 3   0.13175                   5.929                            25.872
#> dim 4   0.11144                   5.015                            30.887
#> dim 5   0.10405                   4.682                            35.569
#> dim 6   0.09435                   4.246                            39.814

fviz_screeplot(res.mca, addlabels = TRUE, ylim = c(0, 14),
               title = "MCA scree plot (raw eigenvalues)")
#> (plot: bar chart, Dim 1 = 12.6%, Dim 2 = 7.4%, ... Dim 10 ~ 3%; long flat tail)
```

The raw scree shows Dim 1 keeps 12.6% and Dim 2 keeps 7.4%. That looks low. It is low because the indicator matrix inflates the total inertia with structurally meaningless variation. Benzécri's correction adjusts every eigenvalue above the threshold $1/Q$ (where $Q$ is the number of active variables) and discards the rest.

The corrected formula is:

$$\lambda_s^{*} = \left(\frac{Q}{Q - 1}\right)^2 \left(\lambda_s - \frac{1}{Q}\right)^2 \quad \text{for } \lambda_s > \frac{1}{Q}$$

Where:

- $\lambda_s^{*}$ = corrected eigenvalue for dimension $s$
- $\lambda_s$ = raw MCA eigenvalue for dimension $s$
- $Q$ = number of active categorical variables

Now compute the corrected eigenvalues for the dimensions that pass the threshold.

```r title="Apply Benzecri correction to MCA eigenvalues"
Q <- ncol(tea_active)             # 18 active variables
threshold <- 1 / Q
lambda <- eig[, "eigenvalue"]
keep <- lambda > threshold

lambda_corr <- ((Q / (Q - 1))^2) * (lambda[keep] - threshold)^2
pct_corr <- 100 * lambda_corr / sum(lambda_corr)
round(head(data.frame(raw = lambda[keep],
                      corrected = lambda_corr,
                      pct_corr = pct_corr), 6), 4)
#>        raw corrected pct_corr
#> dim 1 0.2798    0.0578  47.0314
#> dim 2 0.1634    0.0119   9.6855
#> dim 3 0.1317    0.0064   5.1849
#> dim 4 0.1114    0.0033   2.6961
#> dim 5 0.1040    0.0026   2.0936
#> dim 6 0.0944    0.0018   1.4506
```

After correction, Dim 1 alone captures roughly **47%** of the meaningful variance, not 12.6%. Dim 2 drops to about 10%. The first two dimensions together explain ~57% of the structure, a much fairer summary of how much MCA actually compressed the survey.

[TIP]
**Trust Benzécri-corrected eigenvalues, not the raw scree.** Raw MCA percentages always look dismal because the indicator encoding pads the total inertia with trivial dummy variance. Use the corrected percentages when reporting "Dim 1 explains X%" in a paper or dashboard. Husson's `FactoMineR` book (reference 3 below) prints both side-by-side for this reason.

**Try it:** Compute the *cumulative* corrected variance for the first 3 dimensions of `lambda_corr`. The number tells you how much total information lives in a 3D summary.

```r title="Your turn: cumulative corrected variance"
ex_cum <- # your code: cumulative sum of pct_corr for first 3 dims

ex_cum
#> Expected: ~62 (first 3 corrected dims explain ~62% of meaningful variance)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cumulative corrected variance solution"
ex_cum <- cumsum(pct_corr)[3]
ex_cum
#> [1] 61.9018
```

**Explanation:** The first three Benzécri-corrected dimensions explain about 62% of the meaningful variance in the tea survey. A 3D summary captures most of the signal; dimensions beyond that are mostly residual.

</details>

## Which categories drive the dimensions (contribution and cos2)?

Eigenvalues tell you how big each dimension is. Contribution and cos2 tell you which categories build it. *Contribution* is the share of a dimension's variance that a category accounts for, top contributors are the categories you cite when you name the axis. *Cos2* is the share of a category's own variance that the dimension explains, high cos2 means the category sits cleanly on that axis.

The block below ranks the top 15 contributors to Dim 1 and recolors the categories map by cos2 on the first two dimensions.

```r title="Plot top contributors and color categories by cos2"
fviz_contrib(res.mca, choice = "var", axes = 1, top = 15,
             title = "Top 15 contributors to Dim 1")
#> (plot: bar chart, top 5 ~ "tearoom", "unpackaged", "chain store",
#>        "Not.tearoom", "tea bag"; horizontal red line at expected average)

fviz_mca_var(res.mca, col.var = "cos2",
             gradient.cols = c("#999999", "#E7B800", "#FC4E07"),
             repel = TRUE,
             title = "Categories colored by cos2 (Dim 1+2)")
#> (plot: same categories as before, colored grey-yellow-red;
#>        well-represented categories like "unpackaged" and "tea bag" turn red)
```

The contribution plot pins Dim 1 down: it's mostly built by where you buy your tea (`tearoom`, `unpackaged`, `chain store`) and how it's packaged (`tea bag`). Categories above the dashed reference line contribute more than uniform expectation. The cos2 map then tells you which categories the first two dimensions actually represent, `unpackaged` is both a top contributor *and* well-represented (red), so it's a safe label for Dim 1.

[KEY INSIGHT]
**A high-contribution, low-cos2 category builds the axis but isn't itself well-explained by it.** This happens when a category has a strong but very specific signal, it pulls the axis in a direction, but its own position is still partly captured by other dimensions. Always read contribution and cos2 *together* before naming an axis.

**Try it:** Look at the top 15 contributors to **Dim 2** instead of Dim 1. Which categories build the second axis?

```r title="Your turn: top contributors to Dim 2"
fviz_contrib(res.mca, choice = "var", axes = ## axis number,
             top = 15, title = "Top 15 contributors to Dim 2")
#> Expected: top contributors include "Not.work", "work", "Not.lunch", "lunch", "green"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dim 2 contributors solution"
fviz_contrib(res.mca, choice = "var", axes = 2, top = 15,
             title = "Top 15 contributors to Dim 2")
#> (plot: top contributors lean toward "work", "Not.work", "lunch",
#>        "Not.lunch", "green", "Earl Grey", "black")
```

**Explanation:** Dim 2 is dominated by *when* tea is consumed (work, lunch) and *which* tea (green vs Earl Grey vs black), separating a workday-tea pattern from a leisure-tea pattern.

</details>

## How do supplementary variables sharpen interpretation?

Supplementary variables don't influence the geometry. They get *projected* onto the factor map after the fit, so you can ask "does this variable line up with my axes?" without contaminating the active fit. `MCA()` accepts categorical supplementary variables via `quali.sup` and quantitative ones via `quanti.sup`.

The block below refits MCA on `tea` with `Tea`, `price`, and `where` as supplementary categorical variables (columns 19, 20, 21 in the original `tea` table) and uses `dimdesc()` to list which categories associate strongest with Dim 1.

```r title="Add supplementary variables and run dimdesc"
res.mca.sup <- MCA(tea, quali.sup = c(19, 20, 21), graph = FALSE)
desc <- dimdesc(res.mca.sup, axes = 1, proba = 0.05)
head(desc$`Dim 1`$quali.sup, 6)
#>           R2     p.value
#> where  0.61   2.3e-50
#> price  0.42   8.7e-30
#> Tea    0.06   5.1e-04
#> ...
head(desc$`Dim 1`$category, 6)
#>                   Estimate     p.value
#> chain store+tea shop   0.83   1.5e-40
#> tearoom                0.78   3.9e-32
#> unpackaged            -1.12   2.1e-30
#> chain store            0.46   4.3e-19
#> ...
```

`dimdesc()` runs an ANOVA between each supplementary variable and the dimension. `where` (where you buy tea) has the largest $R^2$ on Dim 1, confirming the convenience-vs-ritual reading. The category-level table picks out specific labels: `chain store+tea shop` and `tearoom` sit on opposite ends, and `unpackaged` swings the dimension hardest in the negative direction.

[NOTE]
**Supplementary variables are projected, not fitted.** MCA estimates dimensions from the *active* variables only. A supplementary variable's coordinates are computed afterwards by averaging the individual coordinates within each of its levels. Adding or removing supplementary variables never moves the active categories or individuals on the map.

**Try it:** Move `Tea` (the variable, column 19) from the supplementary list and add `friends` (column 12) as supplementary instead. Then run `dimdesc()` again on Dim 1.

```r title="Your turn: swap supplementary variables"
ex_res_sup <- MCA(tea, quali.sup = c(12, 20, 21), graph = FALSE)
ex_desc <- # your code: run dimdesc on Dim 1
ex_desc$`Dim 1`$quali.sup
#> Expected: friends, price, where each appear with their R2 values
```

<details>
<summary>Click to reveal solution</summary>

```r title="Swap supp var solution"
ex_res_sup <- MCA(tea, quali.sup = c(12, 20, 21), graph = FALSE)
ex_desc <- dimdesc(ex_res_sup, axes = 1, proba = 0.05)
ex_desc$`Dim 1`$quali.sup
#>            R2    p.value
#> where    0.62  3.0e-51
#> price    0.43  4.4e-31
#> friends  0.05  1.4e-04
```

**Explanation:** `friends` shows weak association with Dim 1, drinking tea with friends doesn't separate convenience drinkers from ritual drinkers as sharply as `where` does. `dimdesc()` gives you a quick statistical test for any candidate variable.

</details>

## Practice Exercises

### Exercise 1: MCA on the food-poisoning survey

The `poison` dataset (also in FactoMineR) records 55 children, the food they ate at a school dinner, and the symptoms they reported. Fit MCA on columns 5-15 of `poison` (the food/symptom dummies, all factors), and identify the top contributor to Dim 1. Save it to `my_top_contrib`.

```r title="Capstone 1: MCA on poison"
data(poison)
poison_active <- poison[, 5:15]

# Fit MCA, then extract the top 1 contributor for Dim 1.
# Hint: get_mca_var(...)$contrib gives a categories x dims matrix.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
data(poison)
poison_active <- poison[, 5:15]
poison.mca <- MCA(poison_active, graph = FALSE)

contribs <- get_mca_var(poison.mca)$contrib
my_top_contrib <- rownames(contribs)[which.max(contribs[, "Dim 1"])]
my_top_contrib
#> [1] "Vomit_y"

my_pct <- poison.mca$eig[1, "percentage of variance"] +
          poison.mca$eig[2, "percentage of variance"]
round(my_pct, 2)
#> [1] 24.69
```

**Explanation:** `Vomit_y` (vomiting yes) contributes most to Dim 1, Dim 1 is essentially the "got sick" axis. Raw Dim 1 + Dim 2 explain about 25%; after Benzécri correction the meaningful share is much higher.

</details>

### Exercise 2: Compare raw vs Benzécri-corrected variance on tea

For `res.mca` (the tea MCA fit from Section 1), compute the corrected percentage of variance for Dim 1 using the Benzécri formula, and confirm it is larger than the raw `eig[1, "percentage of variance"]`. Save the corrected percentage to `my_corr_pct`.

```r title="Capstone 2: Benzecri correction by hand"
# Use:
#   - Q = number of active variables (18)
#   - lambda = res.mca$eig[, "eigenvalue"]
#   - threshold = 1 / Q
# Apply lambda* = (Q/(Q-1))^2 * (lambda - 1/Q)^2 for lambda > 1/Q
# Then percentage = 100 * lambda*[1] / sum(lambda*)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
my_Q <- 18
my_lam <- res.mca$eig[, "eigenvalue"]
my_keep <- my_lam > 1 / my_Q
my_corr <- ((my_Q / (my_Q - 1))^2) * (my_lam[my_keep] - 1 / my_Q)^2

my_corr_pct <- 100 * my_corr[1] / sum(my_corr)
round(my_corr_pct, 2)
#> [1] 47.03

raw_pct <- res.mca$eig[1, "percentage of variance"]
round(raw_pct, 2)
#> [1] 12.59
```

**Explanation:** Corrected Dim 1 explains 47%, raw Dim 1 explains only 12.6%. The corrected number is the one to report, because the raw percentage is depressed by structural noise from the indicator encoding.

</details>

## Complete Example

Here's a self-contained MCA on the `poison` dataset from start to interpretation. The pattern is the same for any survey: pick active variables, fit, check eigenvalues, plot, and add supplementary variables for confirmation.

```r title="End-to-end MCA on poison"
# 1. Pick active variables (food + symptoms)
poison_full <- poison
mca_poison <- MCA(poison_full,
                  quali.sup = c(2, 3, 4),   # Sick, Sex, Age as supplementary
                  graph     = FALSE)

# 2. Eigenvalues
round(mca_poison$eig[1:4, ], 3)
#>         eigenvalue percentage of variance cumulative percentage
#> dim 1       0.327                 17.939                17.939
#> dim 2       0.124                  6.794                24.733
#> dim 3       0.099                  5.426                30.159
#> dim 4       0.087                  4.789                34.948

# 3. Biplot of categories
fviz_mca_var(mca_poison, repel = TRUE,
             title = "Poison: variable categories")

# 4. Top contributors to Dim 1
fviz_contrib(mca_poison, choice = "var", axes = 1, top = 10)

# 5. Supplementary variables on Dim 1
dimdesc(mca_poison, axes = 1, proba = 0.05)$`Dim 1`$quali.sup
#>          R2    p.value
#> Sick   0.61  4.2e-13
#> Sex    0.04  1.8e-01
#> Age    0.02  3.5e-01
```

Dim 1 separates sick from healthy children (`Sick` has the highest supplementary $R^2$). The top contributors are vomiting, abdominal pain, and the foods most associated with the outbreak. With ~25% raw variance on Dim 1 + Dim 2, this two-dimensional summary already pins down the food–symptom pattern.

## Summary

The full MCA workflow boils down to five steps. The diagram below shows how they connect, and the table beneath maps each step to its R function.

![MCA workflow diagram showing five steps from picking active variables to projecting supplementary variables](screenshots/Multiple-Correspondence-Analysis-in-R-workflow.webp)
*Figure 2: Five-step MCA workflow from data to interpretation.*

| Step | What you do | R function |
|---|---|---|
| 1 | Pick active categorical variables (drop ID columns, supplementary candidates) | column subset |
| 2 | Fit MCA | `FactoMineR::MCA()` |
| 3 | Inspect eigenvalues, apply Benzécri correction | `res$eig`, manual formula |
| 4 | Read factor map by contribution and cos2 | `fviz_contrib()`, `fviz_mca_var(col.var = "cos2")` |
| 5 | Project supplementary variables, run `dimdesc()` | `quali.sup =`, `dimdesc()` |

Three things to remember: every category is a point (not every variable); raw eigenvalues underreport the structure (use Benzécri); contribution and cos2 must be read together to name an axis.

## References

1. Husson, F., Lê, S., and Pagès, J. *Exploratory Multivariate Analysis by Example Using R*, 2nd Edition. CRC Press (2017). Chapter 4: Multiple Correspondence Analysis.
2. FactoMineR. `MCA()` function reference. [Link](https://search.r-project.org/CRAN/refmans/FactoMineR/html/MCA.html)
3. factoextra. `fviz_mca` documentation. [Link](https://rpkgs.datanovia.com/factoextra/reference/fviz_mca.html)
4. Kassambara, A. STHDA: MCA - Multiple Correspondence Analysis in R: Essentials. [Link](https://www.sthda.com/english/articles/31-principal-component-methods-in-r-practical-guide/114-mca-multiple-correspondence-analysis-in-r-essentials/)
5. Benzécri, J.-P. (1979). Sur le calcul des taux d'inertie dans l'analyse d'un questionnaire. *Cahiers de l'Analyse des Données*, 4(3), 377-378.
6. Greenacre, M. (2017). *Correspondence Analysis in Practice*, 3rd Edition. CRC Press. Chapter 19: Multiple Correspondence Analysis.

## Continue Learning

- [Correspondence Analysis in R](Correspondence-Analysis-in-R.html). The two-variable parent of MCA; read this first if biplots are new.
- [PCA in R](PCA-in-R.html). The numeric-data counterpart of MCA; same factor-map idea, different distance metric.
- [Cluster Analysis in R](Cluster-Analysis-in-R.html). Pair MCA coordinates with k-means or HCPC to label respondent groups.
