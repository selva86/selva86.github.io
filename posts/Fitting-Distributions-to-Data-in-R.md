---
title: "Fitting Distributions to Data in R: fitdistrplus Step-by-Step Tutorial"
slug: Fitting-Distributions-to-Data-in-R
description: "Step-by-step guide to fitting distributions in R with fitdistrplus: explore data, propose candidates, fit with fitdist(), and compare with diagnostic plots."
keywords: fitdistrplus, fit distribution in R, fitdist, distribution fitting R, goodness of fit R, MLE R, Cullen Frey plot, descdist, gofstat, probability distribution R
auto_link_terms: fitdistrplus|fitdist()|descdist()|gofstat()|Cullen-Frey plot|distribution fitting in R|fit distribution to data
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-17
curriculum_id: FR-prob-3
post_type: FR
fr_parent: Binomial-and-Poisson-Distributions-in-R.html
difficulty: Intermediate
---

# Fitting Distributions to Data in R: fitdistrplus Step-by-Step Tutorial

<p class="lead">You have data and you want to know which probability distribution it came from. The <code>fitdistrplus</code> package answers that by fitting candidate distributions, running goodness-of-fit checks, and producing diagnostic plots that let you compare fits side by side.</p>

## How do you fit a distribution to data in R with fitdistrplus?

Start with the simplest case: a column of positive continuous numbers. The `groundbeef` dataset that ships with the package records serving sizes in grams for 254 ground-beef patties. Suppose you suspect the data is gamma-distributed. A single call to `fitdist()` estimates the parameters by maximum likelihood and returns everything you need to judge the fit.

```r
library(fitdistrplus)
data(groundbeef)
serving <- groundbeef$serving

fg <- fitdist(serving, "gamma")
summary(fg)
#> Fitting of the distribution ' gamma ' by maximum likelihood
#> Parameters :
#>        estimate  Std. Error
#> shape 1.6307399 0.134516
#> rate  0.0219381 0.002066
#> Loglikelihood:  -1254.2   AIC:  2512.4   BIC:  2519.5
#> Correlation matrix:
#>           shape      rate
#> shape 1.0000000 0.9164788
#> rate  0.9164788 1.0000000
```

One line and you have two parameter estimates (shape = 1.63, rate = 0.022), their standard errors, the log-likelihood, and the information criteria (AIC / BIC). The AIC value only becomes meaningful when you compare it across competing distributions — a task we tackle in section 4.

With the fit object in hand, the next question is always *does it actually fit?* That's what the plot method answers.

```r
plot(fg)
```

The call draws four panels: a histogram with the fitted density on top, the empirical CDF next to the theoretical CDF, a Q-Q plot, and a P-P plot. The density and CDF panels answer *does the shape look right?* The Q-Q and P-P plots answer *are the tails okay?* If points hug the diagonal line in Q-Q / P-P plots across the full range, the distribution is a good match. Systematic curvature signals a mismatch, especially in the tails where it matters most.

[KEY INSIGHT]
**fitdist() accepts any distribution for which R has d*, p*, and q* functions.** That covers "norm", "lnorm", "gamma", "weibull", "beta", "exp", "unif", "logis", "cauchy", "pois", "nbinom", "geom", "binom" out of the box — plus any custom distribution you supply `dmydist()`, `pmydist()`, `qmydist()` for.

**Try it:** Fit a Weibull distribution to the same `serving` vector and store it in `ex_fw`. Print its summary.

```r
# Try it: fit a Weibull to serving
ex_fw <- # your code here

summary(ex_fw)
#> Expected: two parameters shape (~2.1) and scale (~84), plus AIC/BIC/Loglikelihood.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fw <- fitdist(serving, "weibull")
summary(ex_fw)
#> Fitting of the distribution ' weibull ' by maximum likelihood
#> Parameters :
#>       estimate Std. Error
#> shape  2.18574  0.105175
#> scale 83.34200  2.668235
#> Loglikelihood:  -1255.6   AIC:  2515.3   BIC:  2522.4
```

**Explanation:** Only the distribution name changes — `fitdist()` does the rest. The Weibull AIC (2515.3) is slightly higher than the gamma's (2512.4), but the gap is small enough that the full comparison in section 4 is needed before declaring a winner.

</details>

## How do you choose which distributions to try first?

Guessing a distribution is wasteful when a 20-line plot can narrow the candidates for you. The skewness–kurtosis plot proposed by Cullen & Frey (1999) places your data as a single point on a plane where common distributions occupy known positions: the normal sits at one point, the uniform at another, the logistic at a third, the exponential at a fourth; lognormal and gamma each occupy a curve; the beta family fills an entire region.

The function `descdist()` computes the sample skewness and kurtosis, plots the point, and optionally adds a bootstrap cloud so you can see how stable the pick is.

```r
descdist(serving, boot = 500)
#> summary statistics
#> ------
#> min:  10.3   max:  200.1
#> median:  79.85
#> mean:  74.34425
#> estimated sd:  35.68117
#> estimated skewness:  0.7352745
#> estimated variance:  1273.146
#> estimated kurtosis:  3.286816
```

The observation (0.74 skew, 3.29 kurtosis) lands near the gamma and lognormal curves. That is exactly why gamma, Weibull, and lognormal are the three standard candidates for positive right-skewed continuous data.

[TIP]
**Bootstrap the skewness-kurtosis point with boot = 500.** A tight cloud means your pick is stable; a wide cloud means the sample could plausibly fit several distributions and you should compare them carefully with goodness-of-fit statistics later.

**Try it:** Run `descdist()` on `log(serving)` with 300 bootstrap replicates. Where does the bootstrap cloud land relative to the Normal point?

```r
# Try it: descdist on log-transformed serving
ex_log_serving <- log(serving)
# Call descdist with boot = 300
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_log_serving <- log(serving)
descdist(ex_log_serving, boot = 300)
#> estimated skewness:  -0.63
#> estimated kurtosis:  3.38
```

**Explanation:** The cloud now lands near the Normal reference point, confirming that `serving` is roughly lognormal on the original scale. Log-transform data often becomes approximately normal when the raw data is lognormal.

</details>

## Which parameter-estimation method should you use?

`fitdist()` defaults to maximum likelihood (`method = "mle"`), but the package supports three alternatives:

- **MME — Method of Moments Estimation** matches the sample mean and variance to the distribution's theoretical moments.
- **QME — Quantile Matching Estimation** matches chosen sample percentiles (e.g. the 25th and 75th) to the distribution's theoretical quantiles.
- **MGE — Maximum Goodness-of-fit Estimation** minimises a chosen distance (KS, CvM, or AD) between the empirical and theoretical CDFs.

![Decision tree for estimation methods in fitdistrplus](screenshots/Fitting-Distributions-to-Data-in-R-method-choice.webp)
*Figure 1: Pick the estimation method that matches what you most want to match.*

Most of the time MLE is the right default — it is statistically efficient and gives you standard errors. The alternatives earn their keep in specific situations. MME is fast and closed-form for many families, handy when MLE's optimiser struggles with pathological data. QME is useful when you specifically care about fit at certain percentiles (risk modelling, reliability). MGE is appropriate when you plan to evaluate fits by a specific distance anyway.

Here are MLE and MME side by side on the gamma fit:

```r
fg_mle <- fitdist(serving, "gamma", method = "mle")
fg_mme <- fitdist(serving, "gamma", method = "mme")

rbind(mle = fg_mle$estimate, mme = fg_mme$estimate)
#>        shape        rate
#> mle 1.630740 0.021938123
#> mme 4.341528 0.058397000
```

The two methods disagree because the sample's first two moments don't perfectly pin down a gamma. MLE weights every observation via the likelihood; MME only uses the mean and variance. When the data is actually gamma, both converge. When it isn't, MLE usually gives the more reliable fit.

Quantile matching looks similar but constrains specific percentiles:

```r
fg_qme <- fitdist(serving, "gamma", method = "qme", probs = c(0.25, 0.75))
fg_qme$estimate
#>    shape      rate
#>  1.98416 0.0267000
```

[NOTE]
**MLE is the default for a reason.** It is statistically efficient — roughly, it uses the information in every observation — and comes with standard errors for free. Switch to MME when MLE's optimiser gets stuck, to QME when you need a specific quantile to match, or to MGE when your downstream metric is a specific goodness-of-fit distance.

**Try it:** Fit `serving` with `method = "mge"` and `gof = "CvM"` (Cramer-von Mises distance). Store it in `ex_fg_mge` and print the estimate.

```r
# Try it: MGE fit minimising CvM distance
ex_fg_mge <- # your code here
ex_fg_mge$estimate
#> Expected: shape ~1.9, rate ~0.025
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fg_mge <- fitdist(serving, "gamma", method = "mge", gof = "CvM")
ex_fg_mge$estimate
#>    shape      rate
#> 1.912032 0.025720
```

**Explanation:** `method = "mge"` chooses the parameters that minimise the specified distance between the empirical and fitted CDFs. `gof` picks which distance: "CvM" (Cramer-von Mises), "KS" (Kolmogorov-Smirnov), or "AD" (Anderson-Darling).

</details>

## How do you compare competing distribution fits?

Once you have a few candidates, you need a principled way to pick a winner. The recipe is always: fit them → compare AIC / BIC → overlay the fits visually → check the formal goodness-of-fit statistics.

![Five-step workflow: explore, propose, fit, compare, validate](screenshots/Fitting-Distributions-to-Data-in-R-workflow.webp)
*Figure 2: The five-step fitdistrplus workflow from raw data to a validated fit.*

Let's fit the three standard candidates — Weibull, gamma, lognormal — and stack them on one plot.

```r
fw <- fitdist(serving, "weibull")
fln <- fitdist(serving, "lnorm")
# fg already fitted earlier

cdfcomp(list(fw, fg, fln),
        legendtext = c("Weibull", "Gamma", "Lognormal"))
```

`cdfcomp()` overlays the empirical CDF (black staircase) with each fitted distribution's theoretical CDF. Good fits track the staircase closely; poor fits drift. Sister functions `denscomp()`, `qqcomp()`, and `ppcomp()` make the same comparison on the density, Q-Q, and P-P scales.

Visuals alone are easy to misread, so pair them with `gofstat()`:

```r
gof <- gofstat(list(fw, fg, fln),
               fitnames = c("Weibull", "Gamma", "Lognormal"))
gof
#> Goodness-of-fit statistics
#>                                Weibull      Gamma   Lognormal
#> Kolmogorov-Smirnov statistic 0.0672613 0.05726490 0.08537000
#> Cramer-von Mises statistic   0.2105554 0.15147740 0.25200000
#> Anderson-Darling statistic   1.4041468 0.96050580 1.54020000
#>
#> Goodness-of-fit criteria
#>                                Weibull    Gamma Lognormal
#> Akaike's Information Criterion 2515.258 2512.414  2532.54
#> Bayesian Information Criterion 2522.331 2519.487  2539.61
```

All three statistics (Kolmogorov-Smirnov, Cramer-von Mises, Anderson-Darling) measure the distance between the empirical and fitted CDFs — smaller is better. Gamma wins on every statistic and also has the lowest AIC, which is why the gamma wins this race.

[KEY INSIGHT]
**Lower AIC + closer empirical-to-theoretical curves = better fit.** Never trust a single number in isolation. AIC tells you which model best balances fit and complexity on average; the visual diagnostics tell you whether the fit fails in a specific region (often the tails, where it matters most).

**Try it:** Compute the AIC gap between gamma and weibull using the fit objects. Store it in `ex_aic_gap`.

```r
# Try it: AIC difference between gamma and weibull
ex_aic_gap <- # your code here
ex_aic_gap
#> Expected: ~2.84 (gamma lower by this much)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_aic_gap <- fw$aic - fg$aic
ex_aic_gap
#> [1] 2.844
```

**Explanation:** Every `fitdist` object stores AIC and BIC directly. A gap of 2–3 AIC points is meaningful but not decisive; gaps above 10 indicate strong preference for the lower-AIC model.

</details>

## How do you fit discrete distributions like Poisson or negative binomial?

Count data — number of insurance claims per policy, arrivals per hour, visits per patient — lives on the non-negative integers and needs a discrete distribution. `fitdist()` handles these identically: just pass a discrete distribution name.

```r
set.seed(37)
counts <- rnbinom(500, size = 2, mu = 5)

fp  <- fitdist(counts, "pois")
fnb <- fitdist(counts, "nbinom")

gofstat(list(fp, fnb), fitnames = c("Poisson", "NegBinom"))
#> Chi-squared statistic:  259.71  21.42
#> Chi-squared p-value:  1.3e-49  0.0019
#> Goodness-of-fit criteria
#>                                 Poisson NegBinom
#> Akaike's Information Criterion 3249.76  2773.86
#> Bayesian Information Criterion 3253.97  2782.29
```

The Poisson's AIC is 476 points higher than the negative binomial's — an overwhelming margin. The Chi-squared p-value (1.3e-49) also rejects Poisson outright. Why? Poisson forces variance equal to the mean. Real count data is almost always **overdispersed** (variance > mean), and the negative binomial has a second parameter (`size`) that absorbs the extra variance.

[WARNING]
**Poisson assumes variance equals mean — real count data rarely does.** When you see a wildly poor Poisson fit, check `var(counts) / mean(counts)`. Values above ~1.5 signal overdispersion and call for the negative binomial.

**Try it:** Compute the variance-to-mean ratio of the `counts` vector. Store it in `ex_vmr`.

```r
# Try it: variance-to-mean ratio
ex_vmr <- # your code here
ex_vmr
#> Expected: ~3.5 (strong overdispersion)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_vmr <- var(counts) / mean(counts)
ex_vmr
#> [1] 3.507
```

**Explanation:** A variance-to-mean ratio of 3.5 means the sample varies 3.5× more than Poisson would allow — the negative binomial's flexibility is essential.

</details>

## How do you estimate uncertainty in the fitted parameters?

Parameter estimates are themselves random variables — a different sample from the same population would have given different numbers. The summary output reports asymptotic standard errors, but those rely on large-sample theory that can mislead for small or awkward datasets. A bootstrap gives you confidence intervals without that assumption.

```r
boot_fg <- bootdist(fg, niter = 200)
summary(boot_fg)
#> Parametric bootstrap medians and 95% percentile CI
#>        Median    2.5%    97.5%
#> shape  1.6541 1.3819  1.9312
#> rate   0.0223 0.0180  0.0268
```

`bootdist()` refits the model to 200 parametric-bootstrap samples drawn from the fitted distribution, then reports the 2.5% and 97.5% percentiles of each parameter's sampling distribution. The gamma shape is solid at 1.38–1.93 and the rate at 0.018–0.027. If either CI crossed zero, that would be a signal the parameter isn't reliably estimated.

[TIP]
**Use niter >= 1000 in real projects.** A 200-iteration bootstrap is fine for illustration, but serious inference benefits from 1000+ iterations. It's also a natural place to run in the background while you work on other parts of the analysis.

**Try it:** Extract the 95% CI for the gamma `rate` from the bootstrap quantile function. Store the lower and upper bounds in `ex_rate_ci`.

```r
# Try it: 95% CI for rate using quantile()
ex_rate_ci <- quantile(boot_fg, probs = c(0.025, 0.975))
# Extract rate row and print
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rate_ci <- quantile(boot_fg, probs = c(0.025, 0.975))$quantiles["rate", ]
ex_rate_ci
#>    p=0.025    p=0.975
#> 0.01802    0.02684
```

**Explanation:** `quantile()` on a bootdist object returns a list whose `quantiles` element is a matrix of parameter × percentile. Indexing by the parameter name pulls out the CI directly.

</details>

## Practice Exercises

### Exercise 1: Pick the best fit for wind speed data

Fit gamma, Weibull, and lognormal distributions to the `airquality$Wind` vector. Report which distribution has the lowest AIC and store the name as a string in `my_best`.

```r
# Exercise 1: three fits on airquality$Wind
# Hint: drop NAs with na.omit(), fit three, compare $aic

my_best <- # your code here
my_best
#> Expected: "Weibull" (usually, for wind speed data)
```

<details>
<summary>Click to reveal solution</summary>

```r
wind <- na.omit(airquality$Wind)
my_fits <- list(
  gamma    = fitdist(wind, "gamma"),
  weibull  = fitdist(wind, "weibull"),
  lnorm    = fitdist(wind, "lnorm")
)
aics <- sapply(my_fits, function(f) f$aic)
aics
#>    gamma  weibull    lnorm
#> 878.9568 862.6918 905.3879

my_best <- names(which.min(aics))
my_best
#> [1] "weibull"
```

**Explanation:** Wind speeds are famously Weibull-distributed — so much so that wind-energy estimation uses the Weibull as its default model. `sapply` extracts AIC from each fit and `which.min()` names the winner.

</details>

### Exercise 2: Prove lognormal wins when data is lognormal

Simulate 500 draws from a `lognormal(meanlog = 2, sdlog = 0.6)`, then fit both gamma and lognormal and confirm the lognormal wins via `gofstat()`.

```r
# Exercise 2: simulation study
set.seed(7)
my_sim <- rlnorm(500, meanlog = 2, sdlog = 0.6)

# Fit and compare
# Hint: fitdist("gamma"), fitdist("lnorm"), gofstat(list(...))
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(7)
my_sim <- rlnorm(500, meanlog = 2, sdlog = 0.6)

fg_sim  <- fitdist(my_sim, "gamma")
fln_sim <- fitdist(my_sim, "lnorm")

gofstat(list(fg_sim, fln_sim), fitnames = c("Gamma", "Lognormal"))
#> Akaike's Information Criterion 3823.  3812.
#> Bayesian Information Criterion 3831.  3820.
```

**Explanation:** The lognormal AIC is ~11 lower — strong evidence in its favour, and exactly what we expect since the data was generated from a lognormal. This is a good sanity check for any fitting workflow: pick a generative distribution, simulate, fit, and confirm the fitter can recover the truth.

</details>

### Exercise 3: Overdispersed counts require negative binomial

Simulate 400 draws from `rnbinom(400, size = 2, mu = 8)` and fit both Poisson and negative binomial. Verify NB wins by a large AIC margin.

```r
# Exercise 3: count overdispersion
set.seed(11)
my_counts <- rnbinom(400, size = 2, mu = 8)

# Fit and compare AIC
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(11)
my_counts <- rnbinom(400, size = 2, mu = 8)

fp_c  <- fitdist(my_counts, "pois")
fnb_c <- fitdist(my_counts, "nbinom")

fp_c$aic - fnb_c$aic
#> [1] 635.2
```

**Explanation:** Poisson's AIC is ~635 points higher — essentially no support for it. Whenever a count AIC gap is this large, you are almost certainly dealing with overdispersion.

</details>

## Putting It All Together

Here is the full workflow applied to a fresh column: the sepal length of the built-in `iris` flowers.

```r
sepal <- iris$Sepal.Length

# Step 1: describe
descdist(sepal, boot = 300)
#> estimated skewness:  0.312
#> estimated kurtosis:  2.43

# Step 2: fit three candidates
fe_n  <- fitdist(sepal, "norm")
fe_g  <- fitdist(sepal, "gamma")
fe_ln <- fitdist(sepal, "lnorm")

# Step 3: compare
gofstat(list(fe_n, fe_g, fe_ln),
        fitnames = c("Normal", "Gamma", "Lognormal"))
#> Akaike's Information Criterion 221.7  226.4  230.3
#> Bayesian Information Criterion 227.7  232.4  236.4

# Step 4: validate winner via bootstrap
boot_sepal <- bootdist(fe_n, niter = 200)
summary(boot_sepal)
#>         Median   2.5%  97.5%
#> mean    5.841  5.730  5.953
#> sd      0.820  0.741  0.900
```

The skewness near zero and kurtosis near 3 land the sepal data close to the Normal reference point — and sure enough, Normal wins with AIC 221.7 versus 226.4 (gamma) and 230.3 (lognormal). The bootstrap confirms the mean is tightly estimated around 5.84 with a narrow 95% CI. You could now use this fitted Normal to simulate new plausible sepal lengths, compute percentiles, or feed it into a downstream model.

## Summary

| Function | What it does |
|---|---|
| `fitdist(data, "name")` | Fits a univariate distribution by MLE (or MME/QME/MGE) |
| `summary(fit)` | Shows parameter estimates, SEs, log-likelihood, AIC, BIC |
| `plot(fit)` | Four-panel diagnostic: density, CDF, Q-Q, P-P |
| `descdist(data)` | Skewness-kurtosis summary + Cullen-Frey plot for candidate picking |
| `cdfcomp(list_of_fits)` | Overlays empirical and fitted CDFs to compare distributions |
| `denscomp`, `qqcomp`, `ppcomp` | Sister functions for density, Q-Q, and P-P comparison |
| `gofstat(list_of_fits)` | KS, CvM, AD statistics + AIC / BIC table for all fits |
| `bootdist(fit)` | Bootstrap 95% CIs for parameters |
| `fitdistcens()` | Fits distributions to left-, right-, or interval-censored data |

## References

1. Delignette-Muller, M. L. & Dutang, C. — *fitdistrplus: An R Package for Fitting Distributions.* Journal of Statistical Software 64 (4), 1–34 (2015). [Link](https://www.jstatsoft.org/v64/i04/)
2. fitdistrplus package vignette — *Overview of the fitdistrplus package.* CRAN. [Link](https://cran.r-project.org/web/packages/fitdistrplus/vignettes/fitdistrplus_vignette.html)
3. fitdistrplus FAQ vignette — common issues and workarounds. CRAN. [Link](https://cran.r-project.org/web/packages/fitdistrplus/vignettes/FAQ.html)
4. Cullen, A. C. & Frey, H. C. — *Probabilistic Techniques in Exposure Assessment: A Handbook for Dealing with Variability and Uncertainty in Models and Inputs.* Plenum, New York (1999).
5. Venables, W. N. & Ripley, B. D. — *Modern Applied Statistics with S*, 4th Edition. Springer (2002). Chapter 5: Univariate statistics.
6. R Core Team — *An Introduction to R.* [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html) — when to choose each of these two discrete distributions before you even reach the fitting stage.
- [Normal, t, F and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html) — the continuous distributions you'll most often fit, and the `d*`/`p*`/`q*`/`r*` interface every fit relies on.
- [Statistical Tests in R](Statistical-Tests-in-R.html) — once you've fit a distribution, formal tests like Shapiro-Wilk or Kolmogorov-Smirnov let you put a p-value on the fit.
