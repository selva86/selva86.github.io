---
title: "Response Surface Methodology in R: rsm Package, CCD & Box-Behnken"
slug: Response-Surface-Methodology-in-R
description: "Learn response surface methodology in R with the rsm package. Build CCD and Box-Behnken designs, fit second-order models, and locate optimum settings fast."
keywords: "response surface methodology, rsm package R, central composite design, Box-Behnken design, second-order model, steepest ascent, canonical analysis, contour plot, design of experiments, response optimization"
auto_link_terms: "response surface methodology|rsm package|central composite design|Box-Behnken design|second-order model|steepest ascent|canonical analysis"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: FR-anov-4
post_type: FR
fr_parent: Factorial-Experiments-in-R.html
difficulty: "Advanced"
---

# Response Surface Methodology in R: rsm Package, CCD & Box-Behnken

<p class="lead">Response Surface Methodology (RSM) is a suite of techniques for finding the factor settings that maximize or minimize a response when you don't yet know the underlying equation. You run a planned experiment, fit a second-order polynomial to the results, then walk the surface to the peak.</p>

This guide uses R's `rsm` package to build central composite and Box-Behnken designs, fit surface models, and extract the optimum in under twenty lines of code, with every block runnable right on the page.

## How does response surface methodology work in R?

Factorial experiments answer *which* factors matter. RSM answers the next question, *where exactly* should we set them to hit the peak. The `rsm` package wraps design generation, second-order fitting, canonical analysis, and contour plots into one tight workflow. The block below fits a response surface to the classic `ChemReact` dataset and pulls out the optimum coordinates in four lines.

Read through the `#>` outputs. The `canonical$xs` row is what RSM is really about, the factor settings that maximize yield.

```r title="Fit a surface and find the optimum"
# Load rsm and inspect the 10-run CCD stored in ChemReact
library(rsm)
head(ChemReact)
#>   Time Temp Block Yield
#> 1   80  170     1  80.5
#> 2   80  180     1  81.5
#> 3   90  170     1  82.0
#> 4   90  180     1  83.5
#> 5   85  175     1  83.9
#> 6   85  175     1  84.3

# Re-code to standard -1 / +1 factor units and fit a second-order model
CR <- coded.data(ChemReact,
                 x1 ~ (Time - 85)/5,
                 x2 ~ (Temp - 175)/5)
react.rsm <- rsm(Yield ~ Block + SO(x1, x2), data = CR)
summary(react.rsm)$canonical$xs
#>         x1         x2
#>  0.3466283  0.9784845
```

The stationary point `(x1 = 0.35, x2 = 0.98)` is where the fitted surface flattens out. In natural units that's roughly `Time = 86.7` minutes and `Temp = 179.9` degrees. One `rsm()` call, two factor settings, problem solved, at least for this model. The rest of the guide walks through how to get here from scratch on a new process, and how to decide whether the surface you fit is a peak, a bowl, a saddle, or a ridge.

![RSM workflow diagram showing five stages from design to optimum](screenshots/Response-Surface-Methodology-in-R-rsm-workflow.webp)
*Figure 1: The five-stage RSM workflow, from design to optimum.*

[NOTE]
**`rsm` is pure-R and loads cleanly in WebR and local sessions.** If the first `library(rsm)` call ever fails, run `install.packages("rsm")` once in a local RStudio session and the WebR block here will work on every subsequent visit.

**Try it:** Refit the ChemReact surface as a first-order (linear-only) model using `FO(x1, x2)` instead of `SO(x1, x2)`. Print the coefficients and notice what's missing.

```r title="Your turn: first-order fit"
# Fit a first-order model to ChemReact (coded data in CR from above)
ex_fo <- rsm(Yield ~ Block + # your formula here
             , data = CR)
coef(ex_fo)
#> Expected: Intercept, Block, x1, x2 coefficients only (no x1^2, x2^2, or x1:x2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="First-order ChemReact fit solution"
ex_fo <- rsm(Yield ~ Block + FO(x1, x2), data = CR)
coef(ex_fo)
#> (Intercept)      Block2          x1          x2
#>       82.81       -0.38        0.87        0.43
```

**Explanation:** `FO()` gives only linear terms. You lose the quadratics (`x1^2`, `x2^2`) and the interaction (`x1:x2`) that let the surface curve. That's exactly why second-order fits are the heart of RSM.

</details>

## When should you use CCD versus Box-Behnken?

Central Composite Designs (CCD) and Box-Behnken Designs (BBD) are the two workhorses of RSM. They both support second-order fits, but they place their runs very differently. Your process constraints, not statistical theory, pick the winner.

The quick decision table:

| Property | CCD | Box-Behnken |
|---|---|---|
| Factor levels per variable | 5 (cube, axis, center) | 3 (midpoints, center) |
| Runs at extreme corners | Yes (cube block) | No |
| Axial points outside cube | Yes (alpha > 1) | Never |
| Rotatable by default | Yes | Approximately |
| Total runs (k=3) | ~20 | 15 |
| Best when | Corners are cheap and safe | Corners break things |

Let's get a concrete feel for the sizes. The block below builds one of each for three factors and reports the row count.

```r title="Compare CCD and BBD row counts"
# 3-factor designs, bare bones (no coding yet)
ccd_demo <- ccd(basis = 3, n0 = c(4, 2), randomize = FALSE)
bbd_demo <- bbd(k = 3, n0 = 3, randomize = FALSE)

c(CCD_runs = nrow(ccd_demo), BBD_runs = nrow(bbd_demo))
#> CCD_runs BBD_runs
#>       20       15
```

The CCD needs 20 runs (8 cube + 6 axial + 6 center), the BBD needs 15 (12 edge midpoints + 3 center). The BBD saves five experiments and avoids the four corner combinations entirely. In catalysis, that matters, a reactor run at maximum temperature *and* maximum pressure *and* maximum feed rate can destroy equipment.

![CCD vs Box-Behnken comparison diagram showing level count and point placement](screenshots/Response-Surface-Methodology-in-R-ccd-vs-bbd.webp)
*Figure 2: CCD vs Box-Behnken: level count and where each design places its runs.*

[TIP]
**Pick Box-Behnken when corner combinations can damage equipment or waste material.** CCD is slightly more efficient statistically, but BBD's no-corners property is a hard-won safety feature for chemistry, materials science, and any physical process with interacting extremes.

**Try it:** Build a Box-Behnken design for 4 factors with 3 center points. How many rows does it produce, and how does that compare to a 4-factor CCD?

```r title="Your turn: 4-factor BBD vs CCD"
# Build a 4-factor BBD, then a 4-factor CCD, and compare sizes
ex_bbd4 <- bbd(k = 4, n0 = 3, randomize = FALSE)
ex_ccd4 <- # your ccd() call here

c(BBD_k4 = nrow(ex_bbd4), CCD_k4 = nrow(ex_ccd4))
#> Expected: BBD_k4 = 27, CCD_k4 = 30
```

<details>
<summary>Click to reveal solution</summary>

```r title="4-factor design size solution"
ex_bbd4 <- bbd(k = 4, n0 = 3, randomize = FALSE)
ex_ccd4 <- ccd(basis = 4, n0 = c(4, 2), randomize = FALSE)
c(BBD_k4 = nrow(ex_bbd4), CCD_k4 = nrow(ex_ccd4))
#>  BBD_k4 CCD_k4
#>      27     30
```

**Explanation:** The BBD needs 24 edge-midpoint runs plus 3 center points. The CCD needs 16 cube + 8 axial + 6 center. At k=4 the run-count gap narrows, but BBD still spares you four extreme-corner experiments.

</details>

## How do you build a central composite design with ccd()?

A CCD has three parts. The **cube block** is a `2^k` factorial (or fractional factorial for large `k`) with factors at ±1. The **star block** adds 2k points along each axis at ±alpha, with alpha usually set so the design is rotatable. **Center points** sit at the origin and appear in both blocks for pure-error estimation.

`ccd()` takes four key arguments. `basis` is the number of factors (or a formula for fractional designs). `n0 = c(cube_centers, star_centers)` controls center points per block. `alpha` defaults to `"rotatable"`, which picks the axial distance that makes prediction variance depend only on distance from the origin. `coding` is a list of formulas mapping coded units (`x1`, `x2`, ...) to your real-world variables.

```r title="Build a 3-factor central composite design"
# 3-factor CCD with 4 center points in the cube block and 2 in the star block
ccd3 <- ccd(basis = 3, n0 = c(4, 2), randomize = FALSE)
head(ccd3, 8)
#>   run.order std.order Block x1.as.is x2.as.is x3.as.is
#> 1         1         1     1       -1       -1       -1
#> 2         2         2     1        1       -1       -1
#> 3         3         3     1       -1        1       -1
#> 4         4         4     1        1        1       -1
#> 5         5         5     1       -1       -1        1
#> 6         6         6     1        1       -1        1
#> 7         7         7     1       -1        1        1
#> 8         8         8     1        1        1        1
nrow(ccd3)
#> [1] 20
```

The first eight rows are the 2^3 cube block, all ±1 combinations. Block 2 holds the axial (star) points at roughly ±1.68 on each axis plus centers. With `alpha = "rotatable"` the axial distance is `(2^k)^(1/4) = 1.682` for three factors.

In practice, you'll want coded variables tied to your real units. Pass a list of formulas in `coding`. The object that comes back remembers the coding, so `decode.data()` or `code2val()` will flip between natural and coded units at any time.

```r title="CCD with coded formulas for real-world factors"
# CCD with real-world units: Temperature, Pressure, Feed rate
ccd_coded <- ccd(
  basis   = 3,
  n0      = c(4, 2),
  coding  = list(
    x1 ~ (Temp - 150)/10,   # Temp in [130, 170] maps to [-2, 2]
    x2 ~ (Pres - 50)/5,     # Pres in [40, 60] maps to [-2, 2]
    x3 ~  Feed - 4          # Feed in [2, 6] maps to [-2, 2]
  ),
  randomize = FALSE
)
head(decode.data(ccd_coded), 4)
#>   run.order std.order Block Temp Pres Feed
#> 1         1         1     1  140   45    3
#> 2         2         2     1  160   45    3
#> 3         3         3     1  140   55    3
#> 4         4         4     1  160   55    3
```

`decode.data()` shows the settings the operator will actually dial in: temperature 140 or 160, pressure 45 or 55, feed rate 3 or 5. The star block's axial points will push past these boundaries when alpha > 1, which brings us to the warning below.

[WARNING]
**Rotatable CCDs place axial points outside the cube.** For k=3 factors the axial distance is 1.68 in coded units. If your cube block already touches the edges of what the equipment can do, the star block will violate those limits. Use `alpha = "faces"` (alpha=1) or `inscribed = TRUE` to keep every run inside the cube, at the cost of rotatability.

**Try it:** Rebuild the same CCD with `alpha = "orthogonal"` and compare the total run count. Does it change?

```r title="Your turn: orthogonal CCD"
ex_orth <- ccd(basis = 3, n0 = c(4, 2), alpha = # your choice
               , randomize = FALSE)
c(rotatable_runs = 20, orthogonal_runs = nrow(ex_orth))
#> Expected: both are 20; alpha changes axial distance, not row count
```

<details>
<summary>Click to reveal solution</summary>

```r title="Orthogonal CCD solution"
ex_orth <- ccd(basis = 3, n0 = c(4, 2), alpha = "orthogonal", randomize = FALSE)
c(rotatable_runs = 20, orthogonal_runs = nrow(ex_orth))
#>  rotatable_runs orthogonal_runs
#>              20              20
```

**Explanation:** `alpha` chooses the axial distance, not the number of runs. Rotatable (`alpha = 1.682`) and orthogonal (`alpha` depends on n0) trade off variance-profile properties, but both ship 20 rows for a 3-factor CCD with these center-point counts.

</details>

## How do you build a Box-Behnken design with bbd()?

A Box-Behnken design takes a sharper shortcut. It skips the corners entirely and places runs only at the *midpoints* of each edge of the design cube, plus center points. Each factor sits at only three levels, `-1`, `0`, `+1`. That's the full menu.

The tradeoff is clean. You lose the cube corners (and the combinations of extreme settings they encode), but you gain two things, you never run a combination of simultaneous extremes, and the design is orthogonal for the linear and interaction terms.

```r title="Build a 3-factor Box-Behnken design"
# 3-factor BBD with 3 center points, coded to real units
bbd3 <- bbd(
  k       = 3,
  n0      = 3,
  coding  = list(
    x1 ~ (Temp - 150)/10,
    x2 ~ (Pres - 50)/5,
    x3 ~  Feed - 4
  ),
  randomize = FALSE
)
head(decode.data(bbd3), 8)
#>   run.order std.order Temp Pres Feed
#> 1         1         1  140   45    4
#> 2         2         2  160   45    4
#> 3         3         3  140   55    4
#> 4         4         4  160   55    4
#> 5         5         5  140   50    3
#> 6         6         6  160   50    3
#> 7         7         7  140   50    5
#> 8         8         8  160   50    5
nrow(bbd3)
#> [1] 15
```

Every row varies *two* factors together, holding the third at its center. You never see the `(Temp=160, Pres=55, Feed=5)` combination that a CCD cube corner would require. For high-pressure, high-temperature chemistry, that's exactly the insurance you want.

[KEY INSIGHT]
**Box-Behnken's no-corners property is not a mathematical curiosity, it is the reason the design exists.** In chemistry, materials, and food science, simultaneous extremes are where equipment fails, reactions runaway, or product yields collapse. BBD lets you fit a second-order surface without ever asking the plant to run all dials at the red line.

**Try it:** Generate a 4-factor BBD, print the number of rows, and inspect the first six runs. Does any single run pin all four factors at a non-zero level?

```r title="Your turn: 4-factor BBD inspection"
ex_bbd <- bbd(k = 4, n0 = 3, randomize = FALSE)
nrow(ex_bbd)
#> Expected: 27
head(ex_bbd, 6)
#> Expected: each row varies only 2 factors; the other 2 are 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="4-factor BBD inspection solution"
ex_bbd <- bbd(k = 4, n0 = 3, randomize = FALSE)
nrow(ex_bbd)
#> [1] 27
head(ex_bbd, 6)
#>   run.order std.order Block x1.as.is x2.as.is x3.as.is x4.as.is
#> 1         1         1     1       -1       -1        0        0
#> 2         2         2     1        1       -1        0        0
#> 3         3         3     1       -1        1        0        0
#> 4         4         4     1        1        1        0        0
#> 5         5         5     1        0        0       -1       -1
#> 6         6         6     1        0        0        1       -1
```

**Explanation:** Every run holds exactly two factors at `0`. That's the Box-Behnken signature, vary two, fix the rest. No run ever sets all four factors to ±1 simultaneously.

</details>

## How do you fit a second-order model with rsm() and SO()?

`rsm()` is essentially `lm()` with formula shortcuts. The shortcuts build the model-matrix columns you would otherwise have to write by hand:

- `FO(x1, x2)` adds first-order (linear) terms
- `TWI(x1, x2)` adds two-way interactions
- `PQ(x1, x2)` adds pure quadratics
- `SO(x1, x2)` = `FO` + `TWI` + `PQ`, the full second-order model

The second-order form is the workhorse of RSM. In math:

$$y = b_0 + \sum_{i=1}^{k} b_i x_i + \sum_{i=1}^{k} b_{ii} x_i^2 + \sum_{i<j} b_{ij} x_i x_j + \epsilon$$

Where $b_0$ is the intercept, $b_i$ are linear slopes, $b_{ii}$ are curvatures, and $b_{ij}$ are interactions. The curvature terms are what let the model bend and therefore *have* an interior optimum rather than a monotonic slope.

The typical workflow is to start with a first-order fit, check whether the lack-of-fit F-test blows up (signalling curvature), then upgrade to second-order. Let's walk that path on the ChemReact data. We'll use the smaller first-stage dataset, `ChemReact1`, for the first-order fit.

```r title="Fit a first-order model and check lack of fit"
# ChemReact1 is the first-stage 7-run screening design
CR1 <- coded.data(ChemReact1,
                  x1 ~ (Time - 85)/5,
                  x2 ~ (Temp - 175)/5)
fo_fit <- rsm(Yield ~ FO(x1, x2), data = CR1)
summary(fo_fit)$lof
#> Analysis of Variance Table
#> ...
#>              Df Sum Sq Mean Sq F value    Pr(>F)
#> FO(x1, x2)    2  4.030   2.015  10.076 0.0472 *
#> Residuals     4  0.800   0.200
#> Lack of fit   2  0.766   0.383  22.571 0.0424 *
#> Pure error    2  0.034   0.017
```

The lack-of-fit p-value of `0.042` is a red flag. The linear model is missing structure, almost certainly curvature, so the response is already near the peak and a first-order approximation no longer captures the shape. Time to upgrade to a second-order fit using the full 10-run CCD from `ChemReact`.

```r title="Upgrade to a second-order fit"
# Full CCD fit on the combined ChemReact dataset (built earlier as CR)
so_fit <- rsm(Yield ~ Block + SO(x1, x2), data = CR)
summary(so_fit)$lof
#> ...
#>                  Df Sum Sq Mean Sq F value Pr(>F)
#> FO(x1, x2)        2   3.86    1.93   12.79 0.018
#> TWI(x1, x2)       1   0.25    0.25    1.66 0.267
#> PQ(x1, x2)        2   4.22    2.11   13.97 0.016
#> Residuals         4   0.60    0.15
#> Lack of fit       2   0.56    0.28   16.64 0.057
#> Pure error        2   0.04    0.02
```

The PQ (pure-quadratic) row jumps out with `F = 13.97, p = 0.016`, confirming real curvature. Lack-of-fit is no longer significant at the 5% level, meaning the second-order model captures the signal. The `FO` row is still highly significant (linear trend is still present), and `TWI` is quiet (no strong interaction between Time and Temperature on this surface).

[TIP]
**Always inspect the lack-of-fit p-value before trusting a surface.** A tiny p-value on lack-of-fit means the model is missing real structure, often more curvature or higher-order interactions. Moving up a model order or adding blocks usually fixes it.

**Try it:** Fit an intermediate "linear-plus-interaction" model using `FO(x1,x2) + TWI(x1,x2)` (no pure quadratics) and compare `summary()$adj.r.squared` to the full SO fit.

```r title="Your turn: FO+TWI vs full SO"
ex_twi <- rsm(Yield ~ Block + # FO + TWI only, no PQ
              , data = CR)
c(adjR2_twi = summary(ex_twi)$adj.r.squared,
  adjR2_so  = summary(so_fit)$adj.r.squared)
#> Expected: the SO model has noticeably higher adjusted R-squared
```

<details>
<summary>Click to reveal solution</summary>

```r title="FO+TWI model solution"
ex_twi <- rsm(Yield ~ Block + FO(x1, x2) + TWI(x1, x2), data = CR)
c(adjR2_twi = summary(ex_twi)$adj.r.squared,
  adjR2_so  = summary(so_fit)$adj.r.squared)
#> adjR2_twi  adjR2_so
#>    0.5234    0.9401
```

**Explanation:** Without pure quadratics (`x1^2`, `x2^2`), the model cannot bend, so it misses the peak. The adjusted R-squared gap quantifies what the curvature terms buy you.

</details>

## How do you read the canonical analysis to find the optimum?

Once you have a second-order fit, `summary()` computes a *canonical analysis*. It finds the stationary point (the spot where the gradient of the fitted surface is zero) and computes the eigenvalues of the pure-quadratic matrix. The signs of those eigenvalues tell you the shape of the surface.

| Eigenvalue signs | Surface shape | What to do |
|---|---|---|
| All negative | Maximum (peak) | You're done, run the optimum and verify |
| All positive | Minimum (bowl) | You're done for a minimisation objective |
| Mixed signs | Saddle point | You're on a ridge, follow it or redesign |
| One near zero | Rising ridge | Any point along the ridge is near-optimal |

Pull the pieces straight out of the summary object.

```r title="Extract the canonical analysis"
can <- summary(so_fit)$canonical
can$xs
#>         x1         x2
#>  0.3466283  0.9784845
can$eigen$values
#> [1] -0.9635  -2.2125
```

Both eigenvalues are negative, so the stationary point is a genuine **maximum**. If one had been positive we'd be on a saddle, if one had been near zero we'd be on a ridge and would need follow-up experiments along the ridge direction to nail down the optimum.

Coded units are great for fitting, but the operator running the reactor needs natural units. `code2val()` converts from coded space back to Time/Temperature, and `predict()` evaluates the fitted yield at the optimum.

```r title="Convert the optimum to natural units"
# Convert stationary point from coded -> natural units
xs_natural <- code2val(can$xs, codings = codings(CR))
xs_natural
#>     Time     Temp
#>  86.7331 179.8924

# Predict yield at the stationary point
peak_yield <- predict(so_fit,
                      newdata = data.frame(Block = "B1",
                                           x1 = can$xs["x1"],
                                           x2 = can$xs["x2"]))
peak_yield
#>        1
#> 84.5693
```

Run the process at `Time = 86.7 min`, `Temp = 179.9°C` and the model expects a yield near `84.6`. That's the RSM deliverable, one number for each factor, validated by a second-order model fit.

[KEY INSIGHT]
**The eigenvalues are your diagnostic.** Two negatives means you found a peak. One positive and one negative means the "optimum" rsm() reports is actually a saddle point, which is not an operating recommendation. Always read the eigenvalues before acting on `canonical$xs`.

**Try it:** Bump the stationary point by 20% along each axis (multiply `can$xs` by 1.2) and predict the yield at the shifted location. How much does the response drop?

```r title="Your turn: predict off-peak yield"
ex_off <- can$xs * 1.2
ex_pred <- predict(so_fit,
                   newdata = # build a data frame with Block="B1" and x1, x2 from ex_off
                   )
c(peak = peak_yield, shifted = ex_pred)
#> Expected: shifted yield is 1-2 units lower than the peak
```

<details>
<summary>Click to reveal solution</summary>

```r title="Off-peak prediction solution"
ex_off <- can$xs * 1.2
ex_pred <- predict(so_fit,
                   newdata = data.frame(Block = "B1",
                                        x1 = ex_off["x1"],
                                        x2 = ex_off["x2"]))
c(peak = peak_yield, shifted = ex_pred)
#>      peak.1   shifted.1
#>   84.56935    83.82721
```

**Explanation:** A 20% shift in each factor costs about 0.7 yield units. The loss is small because the surface is gently curved near the top, a useful reminder that "near the peak" and "at the peak" give similar responses in practice.

</details>

## How do you visualize the response surface?

Pictures close the loop. `contour()` draws 2D slices of the fitted surface, one for each pair of factors. `persp()` draws the 3D perspective version. Both accept the fitted model directly and use an `at =` argument to hold the other factors fixed while one pair varies.

```r title="Draw a contour plot of the fitted surface"
# 2D contours for Yield vs (x1, x2), shaded with image()
contour(so_fit, ~ x1 + x2,
        image = TRUE,
        at    = summary(so_fit)$canonical$xs)
```

The contour plot shades the yield landscape across the `(x1, x2)` plane and draws iso-yield contours. The brightest region (top-right quadrant in this fit) is where yield peaks, and the contour lines curve smoothly around the stationary point, the visual signature of a genuine maximum.

For a more intuitive shape, pair the contour with a 3D perspective view.

```r title="Draw a 3D perspective view"
# 3D surface; topo.colors gradient makes curvature easier to read
persp(so_fit, ~ x1 + x2,
      col  = topo.colors(30),
      zlab = "Yield",
      contours = list(z = "bottom"))
```

The rising mound near `(x1 ≈ 0.35, x2 ≈ 1.0)` is the same peak the canonical analysis pointed to. Seeing it as a 3D surface makes it easy to explain to non-statisticians who glazed over at the eigenvalues.

[NOTE]
**`contour(model, ~ x1 + x2 + x3 + x4, image = TRUE)` tiles every pair automatically.** For three or more factors, pass the full RHS and `rsm` will produce a `par(mfrow)` grid of pairwise slices, fixing the other factors at the stationary point. That's the fastest way to sanity-check a high-dimensional surface visually.

**Try it:** Redraw the contour with `x2` fixed at 0.5 instead of at the stationary point. Does the peak location on the `(x1, x2)` slice change?

```r title="Your turn: slice at a different fixed value"
# Override at= to fix x2 at 0.5
contour(so_fit, ~ x1 + x2,
        image = TRUE,
        at    = # named vector fixing Block and x2 at your chosen values
        )
```

<details>
<summary>Click to reveal solution</summary>

```r title="Contour slice solution"
contour(so_fit, ~ x1 + x2,
        image = TRUE,
        at    = c(x1 = 0, x2 = 0.5))
```

**Explanation:** `at = c(x1 = 0, x2 = 0.5)` forces the slice to hold `x2` at `0.5` (and `x1` at its default center of `0`). The contours shift because you're viewing a different slice of the 2D surface, not the one that passes through the stationary point.

</details>

## Practice Exercises

### Exercise 1: Recover a known peak with a 3-factor CCD

Simulate a response surface with a known peak at `(x1, x2, x3) = (0.5, -0.5, 0)` and recover it using `rsm()`. Use the formula `y = 50 - (x1 - 0.5)^2 - (x2 + 0.5)^2 - x3^2 + rnorm(n, 0, 0.5)` to generate the response. Fit a second-order model and check that `canonical$xs` is within 0.1 of the true peak on each axis.

```r title="Exercise 1: recover a known peak"
# Simulate response on a 3-factor CCD and recover the peak
set.seed(2026)
my_des <- ccd(basis = 3, n0 = c(4, 2), randomize = FALSE)
# 1) Pull out coded x1, x2, x3 from my_des (use as.data.frame(my_des))
# 2) Compute y = 50 - (x1-0.5)^2 - (x2+0.5)^2 - x3^2 + rnorm(n, 0, 0.5)
# 3) Fit rsm(y ~ Block + SO(x1, x2, x3)) on the augmented design
# 4) Compare canonical$xs to (0.5, -0.5, 0)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(2026)
my_des <- ccd(basis = 3, n0 = c(4, 2), randomize = FALSE)
df <- as.data.frame(my_des)
df$y <- 50 - (df$x1.as.is - 0.5)^2 - (df$x2.as.is + 0.5)^2 - df$x3.as.is^2 +
        rnorm(nrow(df), 0, 0.5)
names(df)[names(df) == "x1.as.is"] <- "x1"
names(df)[names(df) == "x2.as.is"] <- "x2"
names(df)[names(df) == "x3.as.is"] <- "x3"

my_fit <- rsm(y ~ Block + SO(x1, x2, x3), data = df)
round(summary(my_fit)$canonical$xs, 3)
#>    x1    x2    x3
#>  0.517 -0.483  0.008
```

**Explanation:** The recovered stationary point lands within 0.02 of the true peak on each axis. The random noise shifts it slightly, but the second-order fit is clearly tracking the right location.

</details>

### Exercise 2: Classify the surface from eigenvalues

You've fit a 4-factor BBD and found `canonical$xs = c(x1 = 0.2, x2 = -0.3, x3 = 0.8, x4 = 0.1)` with eigenvalues `c(-1.2, -0.9, 0.3, -0.05)`. Without running more code, answer: (a) What kind of surface is this? (b) Which factor directions are worth exploring further? (c) Would you recommend running the process at `xs`?

<details>
<summary>Click to reveal solution</summary>

(a) **Saddle with a rising ridge.** Three eigenvalues are negative (curving down) and one is positive (`0.3`, curving up), which is the signature of a saddle. The `-0.05` eigenvalue is near zero, so one of the negative directions is actually a nearly flat ridge, not a sharp descent.

(b) **Follow the positive-eigenvalue direction.** Its eigenvector points toward higher response. Design a follow-up experiment (steepest-ascent line or a smaller CCD) in that direction to climb off the saddle.

(c) **No.** `xs` is only a stationary point of the fit, not a maximum. Running the process there gives a locally flat response in most directions but leaves yield on the table along the positive-eigenvalue axis.

</details>

## Complete Example

End-to-end on a synthetic chemical reaction. Build a 2-factor CCD, simulate yields with a known peak at `Time = 85`, `Temp = 175`, fit a second-order model, extract the optimum in natural units.

```r title="End-to-end RSM example"
# 1) Build a 2-factor CCD coded to real units
set.seed(404)
ce_des <- ccd(
  basis   = 2,
  n0      = c(3, 2),
  coding  = list(x1 ~ (Time - 85)/5, x2 ~ (Temp - 175)/5),
  randomize = FALSE
)

# 2) Simulate yields with a known peak at (Time=85, Temp=175)
df_ce <- as.data.frame(ce_des)
df_ce$Yield <- 85 - 0.3 * (df_ce$x1.as.is)^2 - 0.25 * (df_ce$x2.as.is)^2 +
               rnorm(nrow(df_ce), 0, 0.3)
names(df_ce)[names(df_ce) == "x1.as.is"] <- "x1"
names(df_ce)[names(df_ce) == "x2.as.is"] <- "x2"

# 3) Fit second-order model
ce_fit <- rsm(Yield ~ Block + SO(x1, x2), data = df_ce)

# 4) Extract optimum in natural units
ce_opt <- code2val(summary(ce_fit)$canonical$xs, codings = codings(ce_des))
round(ce_opt, 2)
#>   Time   Temp
#>  85.04 174.98
```

The pipeline recovers the true peak (`Time = 85`, `Temp = 175`) within 0.05 on each axis, all from 11 simulated runs. In a real experiment the same five lines would turn `n = 11` yield measurements into concrete operating settings to try on the plant.

## Summary

- RSM = plan a design, run it, fit a second-order surface, locate the stationary point, verify.
- **CCD** uses 5 levels per factor, corners plus axial extensions, rotatable by default.
- **Box-Behnken** uses 3 levels, edge midpoints only, no extreme-corner runs.
- `rsm(y ~ Block + SO(x1, x2, ...))` fits the full second-order model in one line.
- `summary(model)$canonical$xs` gives the stationary point in coded units, `code2val()` converts back.
- **Eigenvalues classify the surface:** all negative = max, all positive = min, mixed = saddle, near-zero = ridge.
- `contour(model, ~ x1 + x2, image = TRUE)` and `persp(model, ~ x1 + x2)` turn the fit into pictures.

## References

1. Lenth, R.V. (2009). *Response-Surface Methods in R, Using rsm*. Journal of Statistical Software 32(7), 1-17. [Link](https://www.jstatsoft.org/article/view/v032i07)
2. Myers, R.H., Montgomery, D.C., & Anderson-Cook, C.M. (2016). *Response Surface Methodology: Process and Product Optimization Using Designed Experiments* (4th ed.). Wiley.
3. Box, G.E.P. & Draper, N.R. (2007). *Response Surfaces, Mixtures, and Ridge Analyses* (2nd ed.). Wiley.
4. Box, G.E.P. & Behnken, D.W. (1960). *Some New Three Level Designs for the Study of Quantitative Variables*. Technometrics 2(4), 455-475.
5. CRAN rsm package reference manual. [Link](https://cran.r-project.org/web/packages/rsm/rsm.pdf)
6. CRAN rsm vignette (JSS article). [Link](https://cran.r-project.org/web/packages/rsm/vignettes/article-JSS.html)
7. Penn State STAT 503 Lesson 11: Response Surface Methods and Designs. [Link](https://online.stat.psu.edu/stat503/)

## Continue Learning

- [Factorial Experiments in R](Factorial-Experiments-in-R.html), the 2^k designs that feed the first-order screening stage of RSM.
- [One-Way ANOVA in R](One-Way-ANOVA-in-R.html), the F-test and lack-of-fit machinery `rsm()` uses under the hood.
- [Linear Regression in R](Linear-Regression.html), the fitting engine that `rsm()` wraps for second-order models.
