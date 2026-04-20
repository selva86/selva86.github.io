---
title: "Correspondence Analysis in R: Visualise Categorical Associations in 2D Space"
slug: "Correspondence-Analysis-in-R"
description: "Learn correspondence analysis in R with FactoMineR. Build a 2D biplot that reveals which row and column categories co-occur, plus how to interpret it."
keywords: "correspondence analysis R, FactoMineR CA, categorical data visualization, contingency table analysis, chi-square decomposition, biplot interpretation, factoextra, inertia, row profiles, column profiles"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-20"
curriculum_id: "2.5.8"
post_type: "C"
auto_link_terms: "correspondence analysis|FactoMineR|factoextra|chi-square distance|row profiles|column profiles|inertia|contingency table"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "Correspondence Analysis"
sidebar_order: 74
---

# Correspondence Analysis in R: Visualise Categorical Associations in 2D Space

<p class="lead">Correspondence analysis (CA) takes a contingency table of two categorical variables and turns it into a 2D map where row and column categories sit close together when they co-occur more than chance would predict. In R, <code>FactoMineR::CA()</code> plus <code>factoextra</code> gives you the fit, the coordinates, and the biplot in three lines of code.</p>

## How does correspondence analysis turn a contingency table into a map?

A two-way table of counts is easy to tabulate, hard to *see*. If you have 13 household chores across 4 "who does it" categories, that's 52 cells of numbers. Your eye cannot spot the pattern. CA rearranges those 52 cells into a scatterplot where categories that behave alike land near each other. We'll fit it on the `housetasks` dataset from FactoMineR, then peek at the theory.

Before any math, let's see the payoff. The block below loads `FactoMineR` and `factoextra`, fits CA on the 13-by-4 housetasks table, and draws the biplot.

```r title="Fit CA on housetasks and draw the biplot"
library(FactoMineR)
library(factoextra)

data(housetasks)
res.ca <- CA(housetasks, graph = FALSE)

fviz_ca_biplot(res.ca, repel = TRUE, title = "Who does which chore?")
#> (plot: rows like Laundry, Main_meal sit near Wife;
#>        Repairs, Driving sit near Husband;
#>        Holidays sits near Jointly; Official sits near Alternating)
```

The plot places each chore (row, blue) and each doer category (column, red) on the same coordinate system. Laundry, cooking, and tidying cluster near `Wife`. Repairs and driving cluster near `Husband`. Holidays and finances drift towards `Jointly`. The biplot recovers the gendered division of chores from a pile of counts without you writing a single comparison.

![CA workflow diagram showing four steps from contingency table to 2D biplot](screenshots/Correspondence-Analysis-in-R-workflow.webp)
*Figure 1: CA compresses a contingency table into a 2D map in four steps.*

[KEY INSIGHT]
**Proximity in a CA biplot means "more than expected by chance."** If the row and column were independent, every point would pile up at the origin. A point drifts *away* from the origin only when its row-column combination shows up more (or less) than the independence model predicts.

**Try it:** Swap the column order of `housetasks` (put Husband first, Wife last), refit CA, and confirm the coordinates come back unchanged. CA doesn't care about the order in which you list categories.

```r title="Your turn: confirm CA is column-order invariant"
# Reorder the columns, then compare first two coordinates of the rows.
tasks_reordered <- housetasks[, c("Husband", "Alternating", "Jointly", "Wife")]

ex_res_a <- # your code: fit CA on housetasks
ex_res_b <- # your code: fit CA on tasks_reordered

# Test: the absolute values of row coordinates should match
round(abs(ex_res_a$row$coord[, 1:2]) - abs(ex_res_b$row$coord[, 1:2]), 6)
#> Expected: a matrix of zeros (signs may flip, magnitudes identical)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Column-order invariance solution"
tasks_reordered <- housetasks[, c("Husband", "Alternating", "Jointly", "Wife")]
ex_res_a <- CA(housetasks,        graph = FALSE)
ex_res_b <- CA(tasks_reordered,   graph = FALSE)

round(abs(ex_res_a$row$coord[, 1:2]) - abs(ex_res_b$row$coord[, 1:2]), 6)
#>             Dim 1 Dim 2
#> Laundry         0     0
#> Main_meal       0     0
#> ...             0     0
```

**Explanation:** Reordering columns permutes the coordinate system's axes or flips their signs, but it cannot change the geometry of the point cloud. The chi-square distances that CA optimises depend on profiles, not on the order in which categories sit in the table.

</details>

## What does the CA biplot actually show?

Now that you've seen the biplot, let's be strict about what it does and does not mean. There are two common display modes, and mixing them up is the classic CA misread. In the default **symmetric biplot**, both row and column points get *principal coordinates*. In the **asymmetric biplot**, one set keeps principal coordinates and the other switches to standard coordinates.

The block below redraws the housetasks CA using the asymmetric `rowprincipal` map, so row-to-column distance becomes directly interpretable as association strength.

```r title="Draw the asymmetric rowprincipal biplot"
fviz_ca_biplot(res.ca,
               map     = "rowprincipal",
               arrows  = c(FALSE, TRUE),
               repel   = TRUE,
               title   = "Asymmetric biplot (rows in principal coords)")
#> (plot: column vectors shoot out as arrows;
#>        row chores project onto each arrow to show association strength)
```

In this asymmetric view, a row chore's projection onto a column arrow is its *deviation* from the independence model. `Repairs` projects strongly onto the `Husband` arrow and negatively onto `Wife`, telling you repairs are a male-dominated chore in this survey. Arrows that point in similar directions (for example `Wife` and `Alternating` both sitting above the axis) indicate column profiles that share row-profile shape.

![Cheat sheet for reading a CA biplot with four rules](screenshots/Correspondence-Analysis-in-R-read-biplot.webp)
*Figure 2: The four rules for reading a CA biplot.*

[WARNING]
**Never measure row-to-column Euclidean distance in the default symmetric biplot.** Symmetric plots are optimised for row-to-row and column-to-column distances separately. If you want to read row-to-column association directly, switch to `map = "rowprincipal"` or `"colprincipal"`, or interpret angles from the origin instead of straight-line distances.

**Try it:** Redraw the biplot in `colprincipal` mode and describe one thing that flips compared with `rowprincipal`.

```r title="Your turn: compare rowprincipal and colprincipal"
# Plot with map = "colprincipal"
# your code here

# Hint: arrows should now belong to rows, not columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="colprincipal mode solution"
fviz_ca_biplot(res.ca,
               map     = "colprincipal",
               arrows  = c(TRUE, FALSE),
               repel   = TRUE,
               title   = "Asymmetric biplot (columns in principal coords)")
#> (plot: row chores now appear as arrows; column doers as dots)
```

**Explanation:** `rowprincipal` preserves chi-square distance between *row* profiles; `colprincipal` preserves it between *column* profiles. Which one to use depends on which side of the table you want to interpret geometrically. For a survey of chores-by-doer, `rowprincipal` is usually the more natural story because you ask "which doer does each chore?" rather than the reverse.

</details>

## Why are inertia and chi-square distance the engine of CA?

*You can skip to the next section if you only need the practical code. The intuition below helps you justify results to reviewers who ask "but what does the biplot minimise?"*

Every row in a contingency table has a **row profile**: its counts divided by its row total. That profile is a discrete probability distribution over columns, saying "given you are in this row, which columns are you likely to fall into?" CA's job is to place rows so that rows with similar profiles land near each other.

The distance metric CA uses is **chi-square distance**. It is like Euclidean distance but it divides each squared difference by the column mass (the column's total share of the sample). Rare columns get louder; common columns get quieter.

$$\chi^2_{\text{dist}}(i, i') = \sum_{j} \frac{1}{c_j} \left(\frac{n_{ij}}{r_i} - \frac{n_{i'j}}{r_{i'}}\right)^2$$

Where:
- $n_{ij}$ = observed count in row $i$, column $j$
- $r_i$ = sum of row $i$
- $c_j$ = column mass (column sum divided by grand total $N$)
- $i, i'$ = any two row indices

The **total inertia** of the table is the weighted sum of squared chi-square distances from every row profile to the average row profile. It equals Pearson's chi-square statistic divided by $N$. So the number CA is decomposing is literally the independence test statistic.

Let's confirm this numerically. The block below computes total inertia two ways: from `CA()` output and from `chisq.test()`.

```r title="Reproduce total inertia from Pearson chi-square"
tasks <- as.matrix(housetasks)
chi   <- chisq.test(tasks)
N     <- sum(tasks)

inertia_from_chisq <- chi$statistic / N
inertia_from_ca    <- sum(res.ca$eig[, 1])

c(from_chisq = inertia_from_chisq, from_ca = inertia_from_ca)
#> from_chisq.X-squared        from_ca
#>            1.115123            1.115123
```

The two numbers match because CA is, under the hood, a singular-value decomposition of the standardised residual matrix whose sum of squares equals $\chi^2 / N$. Everything else in CA, the coordinates, the eigenvalues, the contributions, falls out of that SVD.

[NOTE]
**If `chisq.test()` warns about small expected counts, CA still runs.** The biplot will still show you the association structure, but a formal chi-square *test* may be underpowered. Interpret the geometry; skip the p-value.

**Try it:** Given the total inertia of 1.115 for `housetasks` (N = 1744), recover the chi-square statistic by hand.

```r title="Your turn: derive chi-square from inertia"
inertia <- 1.115
N       <- 1744

ex_chisq <- # your code here
ex_chisq
#> Expected: about 1944.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Inertia to chi-square solution"
inertia <- 1.115
N       <- 1744
ex_chisq <- inertia * N
ex_chisq
#> [1] 1944.56
```

**Explanation:** The identity `inertia = chi-square / N` rearranges to `chi-square = inertia * N`. This is how the independence test statistic gets recycled as a decomposable quantity in CA.

</details>

## How much of the structure does each axis capture?

CA returns as many dimensions as `min(rows - 1, cols - 1)`. The housetasks table is 13 by 4, so CA returns 3 dimensions. Each dimension has an **eigenvalue** equal to the inertia it captures. The ratio of eigenvalue to total inertia tells you what fraction of the association the axis has absorbed.

You want the first two dimensions to absorb enough of the total inertia that the 2D plot is trustworthy. A common rule of thumb is 60-80%. The block below prints the full eigenvalue table and draws a scree plot.

```r title="Inspect eigenvalues and scree plot"
eig <- get_eigenvalue(res.ca)
round(eig, 3)
#>        eigenvalue variance.percent cumulative.variance.percent
#> Dim.1       0.543           48.692                      48.692
#> Dim.2       0.445           39.913                      88.605
#> Dim.3       0.127           11.395                     100.000

fviz_screeplot(res.ca, addlabels = TRUE, ylim = c(0, 60))
#> (plot: three bars; dim 1 ~49%, dim 2 ~40%, dim 3 ~11%, cumulative line shown)
```

Two dimensions absorb 88.6% of the inertia, so the 2D biplot you saw earlier is not hiding much structure. The drop from dim 2 (40%) to dim 3 (11%) creates a natural elbow. Dimension 3 is mostly noise here and can be safely ignored.

[TIP]
**If the first two dimensions explain less than 50%, don't rely on a single 2D plot.** Show a pair of 2D plots (Dim 1 vs 2 and Dim 1 vs 3), or upgrade to three dimensions with `plotly`. A 2D picture of a truly 3D association is a caricature, not a summary.

**Try it:** From the eigenvalue table, read off the cumulative inertia captured by dims 1 and 2.

```r title="Your turn: read cumulative inertia"
# Use eig already stored above
ex_cum <- # your code: pick the right cell
ex_cum
#> Expected: about 88.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cumulative inertia solution"
ex_cum <- eig["Dim.2", "cumulative.variance.percent"]
ex_cum
#> [1] 88.605
```

**Explanation:** The `cumulative.variance.percent` column adds proportions as you walk down the dimensions. Row 2 contains the cumulative coverage of Dim 1 *plus* Dim 2.

</details>

## Which categories drive each dimension?

Two diagnostics turn a pretty picture into a report you can defend. **Contributions** (`contrib`) say how much each category contributes to a given axis's inertia; they sum to 100 per axis. **Quality of representation** (`cos2`) says how well the chosen dimensions picture each category; they sit between 0 and 1.

The first block plots contributions to dimension 1 for both rows and columns, so you can name the axis by its top contributors.

```r title="Plot contributions to dimension 1"
fviz_contrib(res.ca, choice = "row", axes = 1, top = 10,
             title = "Row contributions to Dim 1")
#> (bar chart: Laundry, Main_meal, Repairs, Driving lead; red dashed line = expected avg)

fviz_contrib(res.ca, choice = "col", axes = 1,
             title = "Column contributions to Dim 1")
#> (bar chart: Wife and Husband dominate; Alternating and Jointly small)
```

The row chart is led by `Laundry`, `Main_meal`, `Repairs`, `Driving`. The column chart is led by `Wife` on one side and `Husband` on the other. That's your Dim 1 label: **wife-coded chores versus husband-coded chores**. The dashed line marks the contribution an "average" category would make (100 / number of categories); anything above it is a meaningful driver.

Now `cos2`. A category with `cos2` near 1 on dims 1:2 is well pictured by your 2D biplot. A category with low `cos2` sits near the origin because those two dims miss it.

```r title="Plot cos2 quality on dims 1 and 2"
fviz_cos2(res.ca, choice = "row", axes = 1:2,
          title = "Row cos2 on Dim 1 + Dim 2")
#> (bar chart: most rows > 0.8 quality; Official lowest because it defines Dim 3)
```

Most row chores are well represented. `Official` is the notable exception because it splits along dimension 3 (the "alternating" axis). If you only read the 2D plot, you'll underestimate how distinctive Official is.

A faster way to get a ranked, statistical read is `dimdesc()`. It returns, per dimension, the categories sorted by their contribution direction and tags each with a p-value.

```r title="Describe dimensions with dimdesc()"
descr <- dimdesc(res.ca, axes = 1:2, proba = 0.05)
descr$`Dim 1`$row
#>                estimate       pvalue
#> Laundry       1.4122715 1.020000e-52
#> Main_meal     1.2561974 9.710000e-36
#> Tidying       1.0167655 2.480000e-28
#> ...
#> Repairs      -1.6807163 2.540000e-67
```

The output gives you named directions with significance. Positive estimates lie on one side of the axis, negative on the other, and the p-value lets you cut off noise. Dim 1 cleanly divides *Repairs-side* chores from *Laundry-side* chores with p-values below any reasonable threshold.

[KEY INSIGHT]
**A CA dimension's name comes from its two opposing high-contributor groups, not from a single label.** Dim 1 is not "Laundry"; it is "Laundry, Main_meal, Tidying (wife cluster) versus Repairs, Driving (husband cluster)." Always describe an axis as a contrast.

**Try it:** Using `descr$\`Dim 2\`$row`, name Dim 2 by writing down its strongest positive and negative drivers.

```r title="Your turn: name Dim 2"
ex_d2 <- # your code: grab the Dim 2 row descriptors
head(ex_d2, 3)     # top positives
tail(ex_d2, 3)     # top negatives
#> Expected: "Holidays" pole on one end, "Official" / "Insurance" on the other
```

<details>
<summary>Click to reveal solution</summary>

```r title="Name Dim 2 solution"
ex_d2 <- descr$`Dim 2`$row
head(ex_d2, 3)
#>            estimate       pvalue
#> Holidays   1.058...   2.3e-20
#> ...
tail(ex_d2, 3)
#>            estimate       pvalue
#> Official  -0.841...   4.1e-15
```

**Explanation:** Dim 2 contrasts joint-effort tasks (`Holidays`) against tasks done by one person taking turns (`Official`, `Insurance`). That is, it captures the "shared versus rotated" character of each chore, orthogonal to the wife-versus-husband split on Dim 1.

</details>

## How do I add supplementary rows or columns without distorting the map?

Sometimes you want to project a category onto a map *without* letting it influence the axes. A survey rerun adds a new wave of respondents; a clinical study has a reference group you want to overlay; a market survey has a "total" column you don't want driving the fit. CA calls these **supplementary** rows or columns.

`CA()` takes `row.sup` and `col.sup` arguments. Supplementary categories get projected onto the existing axes after they are fit on the active categories.

```r title="Treat Alternating and Jointly as supplementary columns"
res.sup <- CA(housetasks,
              col.sup = 3:4,     # columns 3 and 4 are 'Alternating' and 'Jointly'
              graph   = FALSE)

fviz_ca_biplot(res.sup, repel = TRUE,
               title = "Active = Wife, Husband. Supplementary = Alternating, Jointly")
#> (plot: active columns drive the axes;
#>        Alternating and Jointly appear as dark triangles, projected post hoc)
```

The axes are now defined purely by the `Wife` versus `Husband` split. `Alternating` and `Jointly` still appear on the plot but they got zero weight during the fit. Their positions tell you where they sit relative to the wife-husband axis without them pulling the solution towards themselves.

[TIP]
**Use supplementary columns to carry "total" or "other" categories.** If your survey has an "Other" bucket that lumps together unrelated categories, making it supplementary prevents it from bending the geometry while still letting you see where it lands.

**Try it:** Make `Wife` a supplementary *row* (so active rows are rows 2:13) and refit. Does the new biplot still separate wife-coded from husband-coded tasks?

```r title="Your turn: supplementary row"
ex_res_sup <- # your code: CA(housetasks, row.sup = 1, graph = FALSE)
fviz_ca_biplot(ex_res_sup, repel = TRUE)
#> Expected: Laundry appears as a triangle; axes still separate chores by doer
```

<details>
<summary>Click to reveal solution</summary>

```r title="Supplementary row solution"
ex_res_sup <- CA(housetasks, row.sup = 1, graph = FALSE)
fviz_ca_biplot(ex_res_sup, repel = TRUE,
               title = "Laundry projected as supplementary")
#> (plot: Laundry shown as a triangle, still pulled to the Wife side)
```

**Explanation:** Even after removing Laundry from the fit, the other 12 chores still split cleanly by doer, and Laundry projects right where you'd expect, near `Wife`. That's a sanity check: Laundry is consistent with the pattern the other rows define, not an outlier that was single-handedly creating the axis.

</details>

## Practice Exercises

Two capstone exercises that combine multiple ideas from the tutorial. Work through them using only functions covered above.

### Exercise 1: Run CA on occupational mobility

The built-in `occupationalStatus` dataset is an 8 by 8 contingency table of father's occupation versus son's occupation from a British social mobility study. Fit CA, report the cumulative inertia captured by the first two dimensions, and name the leading pole of Dim 1 using the top row contributor. Save the result to `my_mobility_ca`.

```r title="Exercise: occupational mobility CA"
# Hint: occupationalStatus is already loaded as a 'table' object
# Use as.matrix() or pass directly to CA()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Occupational mobility solution"
my_mobility_ca <- CA(as.matrix(occupationalStatus), graph = FALSE)

# (a) cumulative inertia
round(get_eigenvalue(my_mobility_ca)["Dim.2", "cumulative.variance.percent"], 1)
#> [1] 87.4

# (b) top row (father) contributor to Dim 1
top_row <- sort(my_mobility_ca$row$contrib[, 1], decreasing = TRUE)[1]
top_row
#>        1
#> 27.5...

fviz_ca_biplot(my_mobility_ca, repel = TRUE,
               title = "Father (row) vs Son (col) occupational status")
#> (plot: low-status 1-2 cluster at one pole; high-status 7-8 cluster at the other)
```

**Explanation:** Dim 1 captures a low-status versus high-status contrast. Categories 1-2 (lowest status) sit on one side; 7-8 (highest) sit on the other. The first two dimensions capture about 87% of the association, so a 2D map of mobility is a fair summary.

</details>

### Exercise 2: Build a small brand-attribute survey inline

Create a 4-by-4 contingency table where rows are car brands `c("Brand_A", "Brand_B", "Brand_C", "Brand_D")` and columns are attributes `c("Reliable", "Innovative", "Affordable", "Prestigious")`. Use the counts below. Fit CA, identify which brand has the highest contribution to Dim 1, and check its `cos2` on dims 1:2 to confirm it is well represented. Save the fit to `my_brand_ca`.

Counts to use:
```
         Reliable Innovative Affordable Prestigious
Brand_A        70         20         85          15
Brand_B        35         80         20          45
Brand_C        25         55         30          80
Brand_D        90         25         75          20
```

```r title="Exercise: brand-attribute CA"
# Hint: build the matrix with rbind() or matrix(), set dimnames, then CA()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Brand-attribute solution"
brand_tab <- rbind(
  Brand_A = c(70, 20, 85, 15),
  Brand_B = c(35, 80, 20, 45),
  Brand_C = c(25, 55, 30, 80),
  Brand_D = c(90, 25, 75, 20)
)
colnames(brand_tab) <- c("Reliable", "Innovative", "Affordable", "Prestigious")

my_brand_ca <- CA(brand_tab, graph = FALSE)

# (a) top brand contributor to Dim 1
sort(my_brand_ca$row$contrib[, 1], decreasing = TRUE)[1]
#>  Brand_D
#> 37.8...

# (b) quality of that brand on dims 1:2
sum(my_brand_ca$row$cos2["Brand_D", 1:2])
#> [1] 0.98...

fviz_ca_biplot(my_brand_ca, repel = TRUE,
               title = "Brand perception map")
#> (plot: Brand_A and Brand_D near Reliable/Affordable;
#>        Brand_B near Innovative; Brand_C near Prestigious)
```

**Explanation:** Brand_D has the strongest contribution to Dim 1 and its cos2 on dims 1:2 is near 1, so the 2D map captures it well. The biplot reads as two axes: "everyday-value" (Reliable, Affordable) versus "aspirational" (Innovative, Prestigious). Brand_B owns the innovation slot; Brand_C owns the prestige slot; Brand_A and Brand_D fight over the value slot.

</details>

## Complete Example: Hair-colour and eye-colour associations

Let's pull every step into one end-to-end pipeline. We'll use `HairEyeColor`, a 3D contingency array shipped with base R (Hair by Eye by Sex, 592 students). We collapse over Sex to get a 4-by-4 Hair-by-Eye table, then walk through the full CA workflow.

```r title="Full CA pipeline on HairEyeColor"
# 1. Collapse the 3D array to a 2D table
he <- apply(HairEyeColor, c(1, 2), sum)
he
#>        Eye
#> Hair    Brown Blue Hazel Green
#>   Black    68   20    15     5
#>   Brown   119   84    54    29
#>   Red      26   17    14    14
#>   Blond     7   94    10    16

# 2. Fit CA
res.he <- CA(he, graph = FALSE)

# 3. Inertia captured per axis
round(get_eigenvalue(res.he), 3)
#>        eigenvalue variance.percent cumulative.variance.percent
#> Dim.1       0.209           89.368                      89.368
#> Dim.2       0.022            9.506                      98.874
#> Dim.3       0.003            1.126                     100.000

# 4. Biplot
fviz_ca_biplot(res.he, repel = TRUE,
               title = "Hair colour vs Eye colour (HairEyeColor, n=592)")
#> (plot: Blond near Blue; Black/Brown near Brown eye; Red near Green; Hazel mid)

# 5. Top contributors to Dim 1
fviz_contrib(res.he, choice = "row", axes = 1, title = "Hair -> Dim 1")
#> (bar chart: Blond dominates, followed by Black)
```

Dimension 1 captures 89% of the association on its own, and the first two dimensions together cover 99%. The biplot reads as a clean gradient: `Blond` hair sits right next to `Blue` eyes, `Black` and `Brown` hair sit near `Brown` eyes, and `Red` hair sits near `Green` eyes. `Hazel` lands in the middle because it partners with multiple hair colours. In one plot, a 4-by-4 table of numbers has become a story about which hair-eye pairs co-occur more than chance predicts.

## Summary

CA turns a two-variable contingency table into a 2D scatterplot you can interpret like any map.

| Concept | What to check | Code |
|---|---|---|
| Fit | Geometry looks interpretable | `CA(data, graph = FALSE)` |
| Total inertia | Matches chi-square / N | `sum(res$eig[, 1])` |
| Axis coverage | Dims 1:2 above 60% | `get_eigenvalue(res)` |
| Axis drivers | Top contributors flag both poles | `fviz_contrib()`, `dimdesc()` |
| Quality | `cos2` > 0.5 on dims 1:2 | `fviz_cos2()` |
| Extra groups | Project without distorting | `row.sup`, `col.sup` |
| Biplot mode | Symmetric for same-side distances; asymmetric for row-column | `fviz_ca_biplot(map = "rowprincipal")` |

Pick CA when you have exactly two categorical variables. Move to Multiple Correspondence Analysis (MCA) for three or more, and to PCA when your variables are numeric.

![Flowchart showing when to choose CA, MCA, or PCA based on variable types](screenshots/Correspondence-Analysis-in-R-method-choice.webp)
*Figure 3: Pick CA, MCA, or PCA based on your variable types.*

## References

1. Husson, F., Lê, S., Pagès, J. *Exploratory Multivariate Analysis by Example Using R*, 2nd Edition, CRC Press (2017). Chapter on Correspondence Analysis. [Link](https://factominer.free.fr/)
2. FactoMineR `CA()` reference manual. [Link](https://rdrr.io/cran/FactoMineR/man/CA.html)
3. Kassambara, A. *factoextra: Extract and Visualize the Results of Multivariate Data Analyses*. [Link](https://rpkgs.datanovia.com/factoextra/)
4. Greenacre, M. *Correspondence Analysis in Practice*, 3rd Edition, CRC Press (2017).
5. Nenadić, O. & Greenacre, M. Correspondence Analysis in R, with Two- and Three-Dimensional Graphics: The `ca` Package. *Journal of Statistical Software*, 20(3), 2007. [Link](https://www.jstatsoft.org/article/view/v020i03)
6. STHDA, CA Correspondence Analysis in R: Essentials. [Link](https://www.sthda.com/english/articles/31-principal-component-methods-in-r-practical-guide/113-ca-correspondence-analysis-in-r-essentials/)
7. Programming Historian, Correspondence Analysis for Historical Research with R. [Link](https://programminghistorian.org/en/lessons/correspondence-analysis-in-R)

## Continue Learning

1. [PCA in R](PCA-in-R.html), CA's numeric cousin. Same SVD machinery, different distance metric.
2. [Exploratory Factor Analysis in R](Exploratory-Factor-Analysis-in-R.html), for modelling latent factors behind numeric items rather than visualising association.
3. [Cluster Analysis in R](Cluster-Analysis-in-R.html), another way to find rows that behave alike, using numeric similarity rather than chi-square distance.
