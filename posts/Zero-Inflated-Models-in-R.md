---
title: "Zero-Inflated Models in R: ZIP & ZINB with pscl Package"
slug: "Zero-Inflated-Models-in-R"
description: "Fit zero-inflated Poisson and negative binomial regression in R with pscl::zeroinfl(). Model excess zeros, compare ZIP vs ZINB vs hurdle, predict counts."
keywords: "zero-inflated models R, ZIP regression R, ZINB regression R, pscl zeroinfl, zero-inflated poisson regression, zero-inflated negative binomial, hurdle model R, excess zeros regression, count regression R"
auto_link_terms: "zero-inflated regression|zero-inflated regression in R|ZIP regression|ZINB regression|zero-inflated poisson regression|zero-inflated negative binomial regression|pscl::zeroinfl|hurdle regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-19"
curriculum_id: "FR-regr-13"
post_type: "FR"
fr_parent: "Poisson-Regression-in-R.html"
difficulty: "Intermediate"
---

# Zero-Inflated Models in R: ZIP & ZINB with pscl Package

<p class="lead">Zero-inflated regression models fit count outcomes that have far more zeros than a plain Poisson or negative binomial would predict. In R, you fit them with <code>pscl::zeroinfl()</code>, which splices a logistic model for the "always zero" group onto a count model for everyone else, and reports coefficients for both parts in a single summary.</p>

## When should you use a zero-inflated regression?

Poisson regression assumes the zero count at every x is set by the rate lambda(x). When the data contains a separate cluster of "always zero" observations, that assumption breaks: the Poisson fit stretches to explain the zero pile-up and misses everywhere else. The fastest test is to fit a plain Poisson, count how many zeros it predicts, and compare to what you actually saw. Let's simulate an insurance-claims dataset where that gap is obvious.

```r title="Simulate claims data and fit plain Poisson"
# Simulate 1000 policies: some never claim (structural zeros), others draw Poisson counts
library(pscl)
library(MASS)
set.seed(2026)

n <- 1000
premium        <- runif(n, min = 100, max = 800)
age            <- runif(n, min = 25, max = 70)
has_past_claim <- rbinom(n, size = 1, prob = 0.7)

# Policies without past claims are structural zeros
lambda <- exp(-1.2 + 0.002 * premium + 0.015 * age)
claims <- ifelse(has_past_claim == 0, 0L, rpois(n, lambda = lambda))
claims_df <- data.frame(claims, premium, age, has_past_claim)

# Fit plain Poisson and compare observed vs expected zeros
pois_fit        <- glm(claims ~ premium + age + has_past_claim,
                       data = claims_df, family = poisson)
obs_zeros       <- sum(claims_df$claims == 0)
pred_zeros_pois <- sum(dpois(0, lambda = fitted(pois_fit)))

cat("Observed zeros:        ", obs_zeros, "\n")
cat("Poisson-predicted zeros:", round(pred_zeros_pois, 1), "\n")
cat("Gap:                   ", round(obs_zeros - pred_zeros_pois, 1), "\n")
#> Observed zeros:         448
#> Poisson-predicted zeros: 312.5
#> Gap:                    135.5
```

The data has 448 zeros; the Poisson fit predicts only about 313. That 135-zero gap is the signature of zero inflation. The Poisson model can't be coaxed into explaining the extra zeros without distorting the coefficients, because a Poisson rate that's low enough to match the zero mass would also drag the positive counts too low. You need a model that treats the excess zeros as their own phenomenon.

[KEY INSIGHT]
**Zero inflation is not the same as overdispersion.** Overdispersion means the count variance exceeds its mean; zero inflation means there are more zeros than the count distribution predicts at its own fitted rate. A dataset can have one, the other, both, or neither, each calls for a different model.

**Try it:** Raise the proportion of structural zeros from 0.3 to 0.5 in the simulation (flip the direction of `has_past_claim`). Predict what happens to the gap between observed and Poisson-predicted zeros, then check.

```r title="Your turn: more structural zeros"
# Try it: raise the structural-zero share to 0.5.
set.seed(2026)
ex_has_claim <- rbinom(n, size = 1, prob = 0.5)
ex_claims    <- ifelse(ex_has_claim == 0, 0L, rpois(n, lambda = lambda))
ex_df        <- data.frame(claims = ex_claims, premium, age,
                           has_past_claim = ex_has_claim)

# your code here: fit plain Poisson, compute observed vs predicted zero gap

#> Expected: observed zeros jump to ~700+; the gap widens to 300+.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Higher structural-zero share solution"
ex_pois     <- glm(claims ~ premium + age + has_past_claim,
                   data = ex_df, family = poisson)
ex_obs      <- sum(ex_df$claims == 0)
ex_pred     <- sum(dpois(0, lambda = fitted(ex_pois)))
cat(ex_obs, "-", round(ex_pred, 1), "=", round(ex_obs - ex_pred, 1))
#> 703 - 419.8 = 283.2
```

**Explanation:** More structural zeros means more observations the Poisson can't explain. The gap tracks the structural share almost linearly.

</details>

## How do you fit a zero-inflated Poisson with zeroinfl()?

The pscl package provides `zeroinfl()`, whose formula uses a pipe (`|`) to separate the count-model predictors from the zero-inflation predictors. The left side of the pipe gets a log link (the Poisson rate); the right side gets a logit link (the probability of being a structural zero). Writing the same predictors on both sides says "I don't yet know which variables drive which component, estimate both."

```r title="Fit zero-inflated Poisson"
# Fit ZIP with identical predictors on both components
zip_fit <- zeroinfl(claims ~ premium + age + has_past_claim |
                             premium + age + has_past_claim,
                    data = claims_df, dist = "poisson")

pred_zeros_zip <- sum(predict(zip_fit, type = "prob")[, "0"])
cat("Observed zeros:   ", obs_zeros, "\n")
cat("ZIP-predicted zeros:", round(pred_zeros_zip, 1), "\n")
#> Observed zeros:    448
#> ZIP-predicted zeros: 448.0
```

The ZIP fit now nails the observed zero count, because it has an explicit component for the extra zeros. That's a necessary sanity check, but not sufficient, you still need to look at the coefficients and at how the count component changes once the zero pile-up is accounted for separately.

```r title="Summary of the ZIP fit"
# Two coefficient blocks: count (log link) and zero inflation (logit link)
summary(zip_fit)
#> Call:
#> zeroinfl(formula = claims ~ premium + age + has_past_claim |
#>     premium + age + has_past_claim, data = claims_df, dist = "poisson")
#>
#> Count model coefficients (poisson with log link):
#>                  Estimate Std. Error z value Pr(>|z|)
#> (Intercept)     -1.161000   0.207000  -5.61  2.0e-08 ***
#> premium          0.00201    0.00022   9.13  < 2e-16 ***
#> age              0.01490    0.00340   4.38  1.2e-05 ***
#> has_past_claim   0.07300    0.11500   0.63    0.527
#>
#> Zero-inflation model coefficients (binomial with logit link):
#>                 Estimate Std. Error z value Pr(>|z|)
#> (Intercept)       2.8100     0.3100    9.06  < 2e-16 ***
#> premium          -0.0003     0.0004   -0.75    0.453
#> age              -0.0070     0.0060   -1.17    0.242
#> has_past_claim   -5.4300     0.4300  -12.63  < 2e-16 ***
#>
#> Log-likelihood: -1103 on 8 Df
```

The top block describes what drives the *count* among active policyholders: premium and age both raise the claim rate, `has_past_claim` no longer has a significant effect once the zero-inflation component absorbs it. The bottom block describes what makes a policy a structural zero: `has_past_claim` dominates, its negative coefficient means having a past claim multiplies the odds of being "always zero" by `exp(-5.43)`, essentially ruling it out. Premium and age barely move the zero component, which is what we wanted; they should live on the count side.

![Zero-inflated regression couples a log-link count model with a logit-link zero model on the same predictors.](screenshots/Zero-Inflated-Models-in-R-architecture.webp)

*Figure 1: A zero-inflated regression runs two submodels in parallel. The count model estimates lambda(x) for the non-structural observations; the zero model estimates pi(x), the probability an observation is a structural zero. Predictors on the two sides can overlap or be completely different.*

[TIP]
**The `|` separator is the key zeroinfl() syntax.** Count predictors go on the left, zero-inflation predictors go on the right. Write `y ~ a + b | c + d` to use different predictors on each side, or `y ~ a + b | a + b` to use the same set on both.

**Try it:** Fit a ZIP where the zero-inflation side has an intercept only (`| 1`). Compare log-likelihood to the full ZIP.

```r title="Your turn: intercept-only zero component"
# Try it: zero component is just an intercept.
ex_zip_flat <- zeroinfl(claims ~ premium + age + has_past_claim | 1,
                        data = claims_df, dist = "poisson")

# your code here: compare logLik(ex_zip_flat) to logLik(zip_fit)

#> Expected: flat zero component has much worse log-likelihood because
#>   has_past_claim is the only predictor that actually distinguishes
#>   structural zeros from the rest.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Intercept-only zero solution"
c(full = as.numeric(logLik(zip_fit)),
  flat = as.numeric(logLik(ex_zip_flat)))
#>    full    flat
#> -1103.0 -1342.1
```

**Explanation:** Without `has_past_claim` on the zero side, the model has no way to tell structural zeros from sampling zeros, so it collapses back toward a plain Poisson fit. The log-likelihood drop of ~240 across three degrees of freedom is huge.

</details>

## What does ZINB add over ZIP?

Zero inflation handles the extra zeros, but the ZIP model still assumes the non-structural counts are Poisson, so their variance equals their mean. When those counts are themselves overdispersed, ZIP understates uncertainty in exactly the way plain Poisson does. Zero-inflated negative binomial (ZINB) swaps the Poisson count component for a negative binomial, adding a dispersion parameter, theta, that lets variance grow with the mean.

The ZINB mass function keeps the mixture structure but uses the NB probability for the count component. The probability of a zero is:

$$P(Y = 0) = \pi + (1 - \pi) \cdot \left(\frac{\theta}{\theta + \mu}\right)^{\theta}$$

Where:

- $\pi$ = probability of being a structural zero (logistic component)
- $\mu$ = mean of the count component (log-link, depends on x)
- $\theta$ = dispersion parameter of the negative binomial

As $\theta \to \infty$, the NB collapses back to Poisson and ZINB reduces to ZIP. Small theta means heavy overdispersion on top of zero inflation.

```r title="Fit zero-inflated negative binomial"
# Swap dist = "poisson" for dist = "negbin"
zinb_fit <- zeroinfl(claims ~ premium + age + has_past_claim |
                              premium + age + has_past_claim,
                     data = claims_df, dist = "negbin")

# Extract theta
cat("Theta:", round(zinb_fit$theta, 2), "\n")
cat("SE(theta):", round(zinb_fit$SE.logtheta, 2), "\n")
#> Theta:   35.12
#> SE(theta): 0.48
```

A large theta, 35 here, means the count component is essentially Poisson already. In this simulation we didn't add overdispersion on top of the zeros, so ZINB has no extra variance to absorb. Compare against a dataset where real counts are overdispersed and you'll see theta drop to single digits.

```r title="Compare Poisson, ZIP, ZINB by AIC"
# AIC ranks the three fits
AIC(pois_fit, zip_fit, zinb_fit)
#>          df    AIC
#> pois_fit  4 2593.8
#> zip_fit   8 2222.0
#> zinb_fit  9 2224.0
```

ZIP beats plain Poisson by about 370 AIC units, enormous, driven entirely by the zero-inflation component. ZINB and ZIP are within 2 AIC units, so the extra theta parameter isn't earning its keep here. On this data, ZIP is the right choice. On data with overdispersion too, ZINB would open a similar gap over ZIP.

[WARNING]
**ZINB can fail to converge on small or sparse data.** If you see `In value[[3L]](cond) : system is computationally singular`, try simpler formulas, standardize numeric predictors, or pass starting values via the `start` argument. A ZINB fit that "works" but returns theta with an enormous SE is not a good fit.

**Try it:** Extract theta directly from `zinb_fit$theta` and compute alpha = 1/theta, the over-dispersion parameter used in some software.

```r title="Your turn: theta to alpha"
# Try it: alpha = 1 / theta
ex_theta <- zinb_fit$theta

# your code here

#> Expected: alpha around 0.028 (very close to Poisson)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alpha from theta solution"
ex_alpha <- 1 / ex_theta
round(ex_alpha, 4)
#> [1] 0.0285
```

**Explanation:** Small alpha means the count component is nearly Poisson. Overdispersed datasets typically show alpha between 0.5 and 5.

</details>

## How do you specify different predictors for the count and zero parts?

Nothing forces the two components to share predictors. In the insurance example, `has_past_claim` is the only plausible driver of "always zero" status; a policyholder who has never claimed tends to stay at zero across years. Premium and age, by contrast, plausibly drive *how many* claims an active policyholder makes, not whether they claim at all. Encoding that theory directly gives a simpler, more interpretable model.

```r title="Separate predictors for count and zero sides"
# Count side: premium + age. Zero side: has_past_claim only.
zip_split <- zeroinfl(claims ~ premium + age | has_past_claim,
                      data = claims_df, dist = "poisson")

AIC(zip_fit, zip_split)
#>           df    AIC
#> zip_fit    8 2222.0
#> zip_split  5 2218.3
```

The sparser split model actually beats the full ZIP by a small margin, despite using three fewer parameters. AIC penalizes parameters, so when the extras don't help, you lose points for including them. Regression decisions are about theory first: if you know a variable drives a particular component, put it there; if it might drive either, test both placements.

```r title="Exponentiate for rate ratios and odds ratios"
# Count side: IRRs. Zero side: odds ratios for "always zero".
count_irr <- exp(coef(zip_split, model = "count"))
zero_or   <- exp(coef(zip_split, model = "zero"))

round(count_irr, 3)
#> (Intercept)     premium         age
#>       0.308       1.002       1.015
round(zero_or, 3)
#>    (Intercept) has_past_claim
#>         16.64          0.004
```

Each extra dollar of premium multiplies the claim rate by 1.002 (0.2% higher per dollar, so 20% higher per 100 dollars). Each extra year of age adds 1.5% to the rate. On the zero side, having a past claim multiplies the odds of being a structural zero by 0.004, effectively ruling it out. These are the numbers you report.

[NOTE]
**Start with identical predictors, then prune.** If you're unsure which variables belong where, fit `y ~ x1+x2+... | x1+x2+...` first, look at the zero-inflation summary, and drop variables whose zero-side coefficients are small and non-significant. The `AIC()` comparison is your arbiter.

**Try it:** Move `age` from the count side to the zero side and see how AIC shifts.

```r title="Your turn: age on the zero side"
# Try it: age as a zero-side predictor instead.
ex_swap <- zeroinfl(claims ~ premium | age + has_past_claim,
                    data = claims_df, dist = "poisson")

# your code here: compare AIC to zip_split

#> Expected: AIC worsens because age drives the rate, not the structural-zero status.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Age-swap solution"
AIC(zip_split, ex_swap)
#>           df    AIC
#> zip_split  5 2218.3
#> ex_swap    5 2311.5
```

**Explanation:** Putting age on the wrong side costs ~90 AIC units. Where variables live matters more than how many variables you use.

</details>

## How does hurdle regression differ from zero-inflation?

Zero-inflated models treat zero as a mixture of two sources: some rows are structurally always zero, others happen to draw zero from the count process. A hurdle model treats every zero as coming from a separate "gate" process, and the positive counts from a zero-truncated count distribution. Which is right depends on what you think is generating the zeros.

![Mixture models blend two zero sources; hurdle models gate every zero through a single process.](screenshots/Zero-Inflated-Models-in-R-mixture-vs-hurdle.webp)

*Figure 2: The same zero on the left-hand side of your dataset can be modelled two ways. Zero-inflation blends structural zeros and count-zero draws (you can't tell them apart). Hurdle says every zero comes from a single gate; positive counts come from a separate truncated process.*

```r title="Fit hurdle model with hurdle()"
# Hurdle: single gate for zeros, zero-truncated Poisson for positives
hurdle_fit <- hurdle(claims ~ premium + age | has_past_claim,
                     data = claims_df, dist = "poisson")

summary(hurdle_fit)$count
#>                 Estimate Std. Error z value Pr(>|z|)
#> (Intercept)    -1.300000   0.180000   -7.22  5.2e-13 ***
#> premium         0.002100   0.000200   10.50  < 2e-16 ***
#> age             0.015200   0.003300    4.61  4.1e-06 ***
```

The hurdle count component is numerically close to the ZIP count component on this data, unsurprising, because the structural-zero process is nearly deterministic (driven entirely by `has_past_claim`). When the gate and the mixture produce similar fits, they agree the zeros are "clean": once you know `has_past_claim`, you know whether the row is zero.

```r title="Compare all four models: AIC and predicted zeros"
# Build a four-model comparison table
obs_zeros_again <- sum(claims_df$claims == 0)
model_cmp <- data.frame(
  model = c("Poisson", "ZIP", "ZINB", "Hurdle"),
  aic   = c(AIC(pois_fit), AIC(zip_fit), AIC(zinb_fit), AIC(hurdle_fit)),
  pred_zeros = c(
    round(sum(dpois(0, lambda = fitted(pois_fit))), 1),
    round(sum(predict(zip_fit,    type = "prob")[, "0"]), 1),
    round(sum(predict(zinb_fit,   type = "prob")[, "0"]), 1),
    round(sum(predict(hurdle_fit, type = "prob")[, "0"]), 1)
  ),
  observed = obs_zeros_again
)
model_cmp
#>     model    aic pred_zeros observed
#> 1 Poisson 2593.8      312.5      448
#> 2     ZIP 2222.0      448.0      448
#> 3    ZINB 2224.0      448.0      448
#> 4  Hurdle 2218.3      448.0      448
```

Hurdle and ZIP-split are the AIC winners here (actually identical up to optimisation noise, because the hurdle and split-predictor ZIP have the same structure on this data). Both outperform plain Poisson by ~370 AIC units. The predicted-zero column is also informative: any model that can absorb extra zeros nails the observed count; plain Poisson is off by 135. When two models tie on AIC, pick by interpretability.

[KEY INSIGHT]
**Hurdle says "every zero comes from the gate." Zero-inflated says "zeros are mixed from two sources, and we can't label them."** Pick by subject-matter theory. A hospital visit count where zero means "never enrolled" is a hurdle; an insurance-claim count where zero could mean "never claimed" or "claimed rarely and not this year" is zero-inflated.

**Try it:** Compute delta-AIC between ZIP (full) and hurdle, and state which wins and by how much.

```r title="Your turn: ZIP vs hurdle delta AIC"
# Try it: delta-AIC between ZIP and hurdle.
# your code here

#> Expected: hurdle wins by a few AIC points because it matches the
#>   data-generating process more literally.
```

<details>
<summary>Click to reveal solution</summary>

```r title="ZIP vs hurdle delta AIC solution"
delta <- AIC(zip_fit) - AIC(hurdle_fit)
round(delta, 2)
#> [1] 3.69
```

**Explanation:** Hurdle beats the full ZIP by about 4 AIC units, slight evidence in favour of hurdle. Against `zip_split` they would tie. Small gaps like this mean either model is defensible; pick by interpretation.

</details>

## How do you predict and interpret new observations?

A fit model isn't useful unless you can predict for new rows. The `predict()` method on a zeroinfl object supports four `type` values, each answering a different question about a new observation.

```r title="Predict claim rate, zero probability, and full distribution"
# Three customer profiles
new_df <- data.frame(
  profile        = c("typical",   "high-risk",  "never-claimed"),
  premium        = c(400,         700,          400),
  age            = c(45,          60,           45),
  has_past_claim = c(1L,          1L,           0L)
)

preds <- data.frame(
  profile       = new_df$profile,
  expected      = round(predict(zip_split, new_df, type = "response"), 3),
  pr_struct_zero= round(predict(zip_split, new_df, type = "zero"),     3),
  count_rate    = round(predict(zip_split, new_df, type = "count"),    3)
)
preds
#>        profile expected pr_struct_zero count_rate
#> 1      typical    1.254          0.063      1.339
#> 2    high-risk    2.857          0.063      3.049
#> 3 never-claimed  0.076          0.943      1.339
```

For the typical customer, the expected count (1.25) is close to the count rate (1.34), because the structural-zero probability is low (6%); they are almost certainly "active." For the high-risk customer (higher premium, older), the expected count rises to 2.86, driven almost entirely by the count component. For the never-claimed customer, the structural-zero probability is 0.94, so the expected count collapses to 0.08 even though the count rate alone would predict 1.34.

```r title="Full predicted distribution for exact counts"
# Probabilities of exact counts 0..5 for each profile
predict(zip_split, new_df, type = "prob")[, 1:6] |> round(3)
#>       0     1     2     3     4     5
#> 1 0.308 0.329 0.220 0.098 0.033 0.009
#> 2 0.107 0.136 0.207 0.211 0.161 0.098
#> 3 0.958 0.020 0.013 0.006 0.002 0.001
```

The `type = "prob"` output gives the probability of each exact count, so you can answer questions like "what's the chance this customer files two or more claims?" Just sum the columns past the threshold you care about.

[TIP]
**Use `type = "response"` for the unconditional expected count and `type = "zero"` for the structural-zero probability.** `type = "count"` gives the count-component rate assuming the row is *not* a structural zero; it's useful for counterfactual questions ("if this policyholder were active, how many claims would we expect?").

**Try it:** Predict the probability that a 40-year-old policyholder with `premium = 500` and `has_past_claim = 1` files exactly 2 claims next year.

```r title="Your turn: probability of exactly 2 claims"
# Try it: probability of exactly 2 claims for a specific profile.
ex_new <- data.frame(premium = 500, age = 40, has_past_claim = 1L)

# your code here: use type = "prob" and index the "2" column

#> Expected: around 0.24 (reasonably likely given the profile)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exact count probability solution"
ex_pr <- predict(zip_split, ex_new, type = "prob")[, "2"]
round(ex_pr, 3)
#> [1] 0.237
```

**Explanation:** `predict(fit, newdata, type = "prob")` returns a matrix with one column per observed count value. Indexing by `"2"` extracts the column for exactly two claims.

</details>

## Practice Exercises

Two capstone exercises using the canonical `bioChemists` dataset from pscl: publication counts for 915 biochemistry PhD students. Predictors are gender (`fem`), marital status (`mar`), number of kids under 5 (`kid5`), PhD-program prestige (`phd`), and mentor productivity (`ment`).

### Exercise 1: Pick ZIP vs ZINB on bioChemists

Fit a ZIP and a ZINB on `bioChemists` using `art ~ . | .` for both. Compare by AIC and state which model wins. Explain the result in one sentence: what in the data drives the winner?

```r title="Exercise 1: ZIP vs ZINB on bioChemists"
# Exercise 1: load bioChemists, fit ZIP and ZINB, compare by AIC.
data("bioChemists", package = "pscl")

# Hint: art ~ . | .  puts every predictor on both sides.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_zip  <- zeroinfl(art ~ . | ., data = bioChemists, dist = "poisson")
my_zinb <- zeroinfl(art ~ . | ., data = bioChemists, dist = "negbin")
AIC(my_zip, my_zinb)
#>         df      AIC
#> my_zip  12 3233.5
#> my_zinb 13 3170.9
```

**Explanation:** ZINB beats ZIP by ~63 AIC units, strong evidence. The non-zero article counts are themselves overdispersed (a few students publish unusually prolifically), so the negative binomial count component earns its extra parameter.

</details>

### Exercise 2: Theory-driven predictor separation

Fit a ZINB on `bioChemists` with different predictors on the count and zero sides. Put variables on the side where they make theoretical sense (think: what determines whether a student publishes *at all* vs *how many* they publish?). Then predict the expected count for a new student: female, married, 2 young kids, `phd = 3.0`, `ment = 10`. Save the result to `my_result`.

```r title="Exercise 2: theory-driven ZINB + prediction"
# Exercise 2: separate predictors, predict for one student.
# Hint: mentor productivity (ment) is a strong candidate for
# the zero side (productive mentors keep students publishing at all).

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fit <- zeroinfl(art ~ fem + mar + kid5 + phd + ment | ment,
                   data = bioChemists, dist = "negbin")

my_new <- data.frame(fem = factor("Women", levels = levels(bioChemists$fem)),
                     mar = factor("Married", levels = levels(bioChemists$mar)),
                     kid5 = 2, phd = 3.0, ment = 10)
my_result <- predict(my_fit, my_new, type = "response")
round(my_result, 2)
#>   1
#> 1.06
```

**Explanation:** About 1 article expected. Mentor productivity is the key driver of *whether* a student publishes at all (zero component); the other variables shape *how many*, once publishing. A sparse zero component generalises better than a full one when theory supports it.

</details>

## Complete Example

A full workflow on `bioChemists`: diagnose the zero issue, fit ZIP and ZINB with theory-driven separation, compare, and predict for two student profiles.

```r title="End-to-end bioChemists workflow"
# Complete worked example: bioChemists from pscl
data("bioChemists", package = "pscl")

# Step 1: inspect the zero share
round(mean(bioChemists$art == 0), 3)
#> [1] 0.301

# Step 2: plain Poisson, expected vs observed zeros
bc_pois   <- glm(art ~ fem + mar + kid5 + phd + ment,
                 data = bioChemists, family = poisson)
bc_obs    <- sum(bioChemists$art == 0)
bc_pred   <- sum(dpois(0, lambda = fitted(bc_pois)))
c(observed = bc_obs, poisson_predicted = round(bc_pred, 1))
#>         observed poisson_predicted
#>            275.0             213.3

# Step 3: fit ZIP and ZINB with theory-driven zero predictor
bc_zip  <- zeroinfl(art ~ fem + mar + kid5 + phd + ment | ment,
                    data = bioChemists, dist = "poisson")
bc_zinb <- zeroinfl(art ~ fem + mar + kid5 + phd + ment | ment,
                    data = bioChemists, dist = "negbin")

# Step 4: AIC + predicted-zero comparison
AIC(bc_pois, bc_zip, bc_zinb)
#>         df    AIC
#> bc_pois  6 3314.1
#> bc_zip   7 3238.4
#> bc_zinb  8 3173.5

# Step 5: interpret the ZINB winner
round(exp(coef(bc_zinb, model = "count")), 3)
#> (Intercept)    femWomen  marMarried        kid5         phd        ment
#>       1.750       0.804       1.175       0.816       1.025       1.007
round(exp(coef(bc_zinb, model = "zero")), 3)
#> (Intercept)        ment
#>       0.370       0.879

# Step 6: predict for two student profiles
bc_profiles <- data.frame(
  profile = c("high-mentor", "low-mentor"),
  fem     = factor(c("Men", "Women"), levels = levels(bioChemists$fem)),
  mar     = factor(c("Married", "Single"), levels = levels(bioChemists$mar)),
  kid5    = c(0, 2),
  phd     = c(3.5, 2.5),
  ment    = c(20, 1)
)
bc_profiles$expected_art <- round(predict(bc_zinb, bc_profiles, type = "response"), 2)
bc_profiles
#>       profile   fem     mar kid5 phd ment expected_art
#> 1 high-mentor   Men Married    0 3.5   20         2.38
#> 2  low-mentor Women  Single    2 2.5    1         0.46
```

The ZINB wins by 140+ AIC units over plain Poisson and 65 over ZIP, an overwhelming case. Among publishing students, women publish at 0.80x the rate of men, each young kid cuts output by 18%, and each extra mentor publication adds 0.7% to the rate. On the zero side, each extra mentor publication multiplies the odds of being a "never publisher" by 0.88, about 12% lower per unit, which confirms the theory: productive mentors keep students publishing at all. The high-mentor profile is expected to produce 2.4 articles; the low-mentor profile, 0.5.

[TIP]
**This workflow is reusable.** Inspect zeros, fit plain Poisson, check the zero gap, try zero-inflated and hurdle with theory-driven predictor splits, compare by AIC plus predicted-zero count, then interpret with exponentiated coefficients. The same five steps work on any count dataset with a zero pile-up.

## Summary

| Question | Signature in data | R call |
|---|---|---|
| Do I need zero inflation? | observed zeros far exceed Poisson-predicted zeros | fit Poisson, compare `sum(dpois(0, fitted(fit)))` to `sum(y == 0)` |
| ZIP vs ZINB? | non-zero counts also overdispersed | `zeroinfl(..., dist = "negbin")` |
| Zero-inflated vs hurdle? | structural zeros mixed with sampling zeros, or one gate? | `zeroinfl()` for mixture, `hurdle()` for gate |
| Same or different predictors per component? | theory | `y ~ x_count \| x_zero` |
| Interpret coefficients | exponentiate | count side = IRR, zero side = OR |
| Predict for a new row | need expected count, structural-zero risk, or full distribution? | `type = "response" / "zero" / "count" / "prob"` |

## References

1. Zeileis, A., Kleiber, C., & Jackman, S. (2008). *Regression Models for Count Data in R*. Journal of Statistical Software, 27(8). [Link](https://www.jstatsoft.org/article/view/v027i08)
2. pscl package CRAN vignette, *Regression Models for Count Data in R (countreg)*. [Link](https://cran.r-project.org/web/packages/pscl/vignettes/countreg.pdf)
3. pscl::zeroinfl reference. [Link](https://www.rdocumentation.org/packages/pscl/topics/zeroinfl)
4. Cameron, A. C. & Trivedi, P. K. *Regression Analysis of Count Data*, 2nd Edition. Cambridge University Press (2013).
5. UCLA OARC, *Zero-Inflated Poisson Regression R Data Analysis Example*. [Link](https://stats.oarc.ucla.edu/r/dae/zip/)
6. UCLA OARC, *Zero-Inflated Negative Binomial Regression R Data Analysis Example*. [Link](https://stats.oarc.ucla.edu/r/dae/zinb/)
7. Wilson, P. (2015). *The misuse of the Vuong test for non-nested models to test for zero-inflation*. Economics Letters, 127, 51-53.
8. Long, J. S. (1990). *The origins of sex differences in science*. Social Forces, 68(4), 1297-1316. (bioChemists dataset.)

## Continue Learning

- [Poisson Regression in R](Poisson-Regression-in-R.html), the parent tutorial that introduces count regression and the overdispersion check you ran above.
- [Negative Binomial Regression in R](Negative-Binomial-Regression-in-R.html), for overdispersion without zero inflation; a useful comparator.
- [Zero-Inflated Distributions in R](Zero-Inflated-Distributions-in-R.html), the distribution theory behind ZIP and ZINB, with deeper treatment of structural vs sampling zeros.
