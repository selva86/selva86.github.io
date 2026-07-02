---
title: "Advanced Regression Lesson 13: Random Slopes and GLMMs"
catalog_blurb: "How to let each group respond differently, and model yes/no or count outcomes."
description: "Fit random-slope and generalized linear mixed models in R with lme4: let each group have its own slope, model non-normal outcomes with glmer, and fix convergence warnings."
keywords: "random slopes, GLMM, generalized linear mixed model, lme4, lmer, glmer, singular fit, convergence, binomial mixed model, mixed models, R"
post_type: "LESSON"
curriculum_id: "6.130.13"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "13"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: ""
course_prev: "Mixed-Models-Random-Intercepts.html"
---

=== step === cover
::eyebrow Lesson 13 of 13
## Random Slopes and GLMMs

Last lesson you gave every group its own baseline. Maya, the customer-success data scientist, let each of her 12 sales regions sit at its own height with a random intercept, `lmer(satisfaction ~ onboarding + (1 | region))`, while every region shared one common onboarding slope: two extra hours of guided onboarding was assumed to move satisfaction by the same amount everywhere.

That shared-slope assumption is the crack in the model. In some regions a customer-success team turns onboarding into loyalty and satisfaction climbs steeply; in others the same hours barely register. The *slope itself* varies by region. And Maya's real question is not always a number on a scale: often it is yes or no. Did the account **churn**? A satisfaction model cannot answer that.

This lesson closes both gaps. You will let each region carry its own slope (a **random slope**), stretch mixed models to yes/no and count outcomes (a **GLMM**), and learn to read the convergence warnings that richer models start to throw. The engine underneath is the same partial pooling from last lesson: drag the slider to feel small, noisy groups being pulled toward the average, exactly what will now steady each region's slope as well as its baseline.

By the end of this lesson you will be able to:

- Say why a shared slope is wrong when groups respond differently, and write and fit a **random-slope** model with `lmer`
- Read the random-slope output: the slope variance, the intercept-slope correlation, and why the average slope's standard error grows
- Fit a **GLMM** for a yes/no outcome with `glmer`, choose the family and link, and read the effect as an odds ratio
- Diagnose a **singular fit** or convergence warning and fix it by simplifying the random-effects structure

**Prerequisites:** [Lesson 12 on random intercepts, partial pooling, and the ICC](Mixed-Models-Random-Intercepts.html), and [logistic regression](Logistic-Regression-Done-Properly.html) (the logit link and odds ratios).

::widget shrinkage-pool {}

=== step === concept
::eyebrow The setup
## When the slope itself varies by group

Here is Maya's book of accounts, rebuilt inline so every line on this page runs. Each account has its hours of guided `onboarding` and a monthly `satisfaction` score, and belongs to one of 12 `region`s. The new ingredient compared to last lesson: each region gets not only its own baseline but its own **onboarding slope**, drawn around the overall slope of 2.5.

```r
set.seed(2026)
sizes  <- c(38, 30, 25, 22, 18, 15, 12, 9, 6, 4, 3, 2)   # accounts per region
region <- factor(rep(sprintf("R%02d", 1:12), times = sizes))
n      <- length(region)                                 # 184 accounts in all
ri     <- as.integer(region)
region_base  <- rnorm(12, 0, 6)                          # each region's own baseline
region_slope <- rnorm(12, 0, 1.1)                        # each region's OWN onboarding slope
onboarding   <- round(runif(n, 0, 8), 1)                 # hours of guided onboarding
satisfaction <- 62 + (2.5 + region_slope[ri]) * onboarding +   # slope now differs by region
                region_base[ri] +                             # baseline differs by region
                rnorm(n, 0, 5)                                # account-level noise
accounts <- data.frame(region, onboarding, satisfaction = round(satisfaction, 1))
# a yes/no churn flag we will need later: more onboarding, less churn
accounts$churned <- rbinom(n, 1, plogis(1.0 - 0.45 * onboarding + 0.12 * region_base[ri]))
nrow(accounts)
#> [1] 184
```

Pick four sizeable regions and fit a plain line to each. Watch the lines **fan out**: some regions climb steeply with onboarding, one is nearly flat. A single shared slope would have to average all of these into one number and would misdescribe every region.

```r
library(ggplot2)
four <- subset(accounts, region %in% c("R01", "R02", "R03", "R04"))
four$region <- droplevels(four$region)
ggplot(four, aes(onboarding, satisfaction, colour = region)) +
  geom_point(size = 2, alpha = 0.7) +
  geom_smooth(method = "lm", se = FALSE, formula = y ~ x) +
  labs(title = "Each region climbs at its own rate", y = "satisfaction (CSAT)")
```

Those four fitted slopes are roughly 2.4, 2.8, 0.1, and 3.4. Region R03 barely responds to onboarding while R04 responds strongly. Forcing one slope on all of them repeats last lesson's mistake, one level up: there we wrongly assumed a single intercept for every region, and here we would be wrongly assuming a single slope.

=== step === concept
::eyebrow The idea
## The random-slope model

Last lesson's model let the intercept vary by group. Now we let the slope vary too. Write the satisfaction of account \(i\) in region \(j\) as:

\[ y_{ij} = \beta_0 + \beta_1\,x_{ij} + u_{0j} + u_{1j}\,x_{ij} + \varepsilon_{ij}. \]

Read it piece by piece. \(y_{ij}\) is the satisfaction of account \(i\) in region \(j\) and \(x_{ij}\) is its onboarding hours. \(\beta_0\) and \(\beta_1\) are the **fixed effects**: the average baseline and the average slope across all regions. The two new terms are the random effects. \(u_{0j}\) shifts region \(j\)'s whole line up or down (the random intercept you already know). \(u_{1j}\) is new: it tilts region \(j\)'s line, adding to the common slope, so region \(j\)'s actual response to onboarding is \(\beta_1 + u_{1j}\). The residual \(\varepsilon_{ij}\) is the leftover account-level noise.

Here is the move that makes it a mixed model. We do not estimate 12 free intercepts and 12 free slopes. We assume each region's pair \((u_{0j}, u_{1j})\) is a draw from one shared two-dimensional normal distribution:

\[ \begin{pmatrix} u_{0j} \\ u_{1j} \end{pmatrix} \sim N\!\left(\begin{pmatrix}0\\0\end{pmatrix},\ \Sigma\right), \qquad \Sigma = \begin{pmatrix} \tau_0^2 & \rho\,\tau_0\tau_1 \\ \rho\,\tau_0\tau_1 & \tau_1^2 \end{pmatrix}. \]

So we estimate just three numbers instead of 24: \(\tau_0^2\) ("tau-zero squared"), how much baselines vary between regions; \(\tau_1^2\), how much slopes vary between regions; and \(\rho\) ("rho"), the **correlation** between a region's baseline and its slope. A positive \(\rho\) would mean regions that start high also gain fastest; a negative \(\rho\) means high-baseline regions have less room to climb.

[KEY INSIGHT]
A raw per-region slope from a tiny region is worthless: region R11's three accounts gave an OLS slope of -8.5, as if onboarding *destroyed* satisfaction. Because the model treats the 12 slopes as draws from one \(N(0, \tau_1^2)\), it pulls that nonsense slope hard toward the shared average, the same partial pooling that steadied the intercepts, now steadying the slopes.

=== step === concept
::eyebrow In R
## Fit it with lmer

The random-slope model needs one change to the formula. Last lesson's `(1 | region)` becomes `(1 + onboarding | region)`: read it as "let the intercept (the `1`) **and** the `onboarding` slope vary by region." That single term adds the per-region slope and its correlation with the intercept.

```r
library(lme4)
m_slope <- lmer(satisfaction ~ onboarding + (1 + onboarding | region), data = accounts)
summary(m_slope)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: satisfaction ~ onboarding + (1 + onboarding | region)
#>    Data: accounts
#> 
#> REML criterion at convergence: 1127.4
#> 
#> Random effects:
#>  Groups   Name        Variance Std.Dev. Corr 
#>  region   (Intercept) 33.721   5.807         
#>           onboarding   1.002   1.001    -0.40
#>  Residual             21.083   4.592         
#> Number of obs: 184, groups:  region, 12
#> 
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)   59.573      1.878  31.715
#> onboarding     2.262      0.365   6.196
```

The **Random effects** block now has three rows, not two. `(Intercept)` is \(\tau_0^2\) (33.7): regions differ a lot in baseline. `onboarding` is \(\tau_1^2\) (1.00, standard deviation 1.00): region slopes scatter by about one satisfaction point per onboarding hour around the average, so a region at the low end gains near 1.3 per hour while one at the high end gains near 3.3. The `Corr` of -0.40 is \(\rho\): regions with higher baselines tend to have gentler slopes (they started high, with less room to grow).

Now look at the **Fixed effects**. The average onboarding slope is 2.26, close to the truth of 2.5, but its standard error is 0.365. Last lesson, with a shared slope, that same standard error was 0.154. It more than doubled, and that is honest, not worse: once you admit that regions respond differently, you know the *average* response less precisely than a model that pretended every region was identical.

[KEY INSIGHT]
Adding a random slope almost always widens the standard error of the corresponding fixed effect. A too-simple model does not just miss the group differences, it reports false confidence in its average. To check whether the extra slope earns its keep, compare it against last lesson's random-intercept model (call it `m_int`) with `anova(m_int, m_slope)`, which refits both by maximum likelihood and runs a likelihood-ratio test; here it is highly significant (p below 0.001), so the random slope stays.

=== step === tryit
::eyebrow Your turn
## Write the random-slope term

Maya wants each region to have its own baseline **and** its own onboarding slope. Complete the random-effects term, then run it.

```r
library(lme4)
m_slope <- lmer(satisfaction ~ onboarding + ____, data = accounts)
summary(m_slope)
```
::check {"regex":"\\(\\s*1\\s*\\+\\s*onboarding\\s*\\|\\s*region\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right. (1 + onboarding | region) lets both the intercept and the onboarding slope vary by region, drawn together from a shared 2-D normal with a correlation.","no":"You want both the intercept and the slope to vary by region: write (1 + onboarding | region). The 1 is the intercept, onboarding is the slope, the bar means varies by, and region is the grouping factor."}
::solution
```r
library(lme4)
m_slope <- lmer(satisfaction ~ onboarding + (1 + onboarding | region), data = accounts)
```

=== step === quiz
::eyebrow Check yourself
## Reading the random slopes

Maya's fitted model reports a random-effects `onboarding` standard deviation of 1.00 and an intercept-slope correlation of -0.40, and the fixed `onboarding` estimate is 2.26. Which reading is correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Every region responds to onboarding at exactly 2.26 points per hour; the 1.00 is just measurement error ::no The 2.26 is the AVERAGE slope. The random-effects SD of 1.00 says the true region slopes genuinely scatter around it (roughly 1.3 to 3.3 per hour), which is the whole point of a random slope.
- The -0.40 correlation means onboarding and satisfaction are negatively related ::no The -0.40 is the correlation between each region's random INTERCEPT and its random SLOPE, not between onboarding and satisfaction. It says high-baseline regions tend to have gentler slopes.
- Regions differ in how strongly onboarding helps (SD about 1.00 around a mean of 2.26), and high-baseline regions tend to gain a little less per hour (correlation -0.40) ::ok Right. The slope SD describes real region-to-region variation in the onboarding effect, and the negative correlation ties a higher baseline to a slightly gentler slope.
- Because the average slope is positive, every region must have a positive slope ::no Not guaranteed. With a mean of 2.26 and an SD of 1.00 most regions are positive, but a raw small-region slope can even come out negative from noise, which is exactly why the model pools it toward the average.

=== step === concept
::eyebrow Beyond the normal outcome
## GLMMs: when the outcome is not a number

Satisfaction is a number, so a linear mixed model fits. But Maya's sharper question is binary: did the account churn, yes or no? You cannot model a 0/1 outcome with a straight line; it would predict probabilities below 0 and above 1. Ordinary [logistic regression](Logistic-Regression-Done-Properly.html) solved that for independent rows by modeling the log-odds through a **link function**:

\[ \operatorname{logit}(p_{ij}) = \log\frac{p_{ij}}{1 - p_{ij}} = \beta_0 + \beta_1\,x_{ij} + u_j, \]

where \(p_{ij}\) is the probability that account \(i\) in region \(j\) churns. A **generalized linear mixed model** (GLMM) is exactly this: a GLM's link function plus the random effects \(u_j\) that handle the grouping. In R the function is `glmer`, and you name the outcome's distribution with `family`, here `binomial` for yes/no.

```r
library(lme4)
gm <- glmer(churned ~ onboarding + (1 | region), data = accounts, family = binomial)
summary(gm)
#> Generalized linear mixed model fit by maximum likelihood (Laplace
#>   Approximation) [glmerMod]
#>  Family: binomial  ( logit )
#> Formula: churned ~ onboarding + (1 | region)
#>    Data: accounts
#> 
#> Random effects:
#>  Groups Name        Variance Std.Dev.
#>  region (Intercept) 0.2182   0.4671  
#> Number of obs: 184, groups:  region, 12
#> 
#> Fixed effects:
#>             Estimate Std. Error z value Pr(>|z|)    
#> (Intercept)  0.56186    0.34542   1.627    0.104    
#> onboarding  -0.44779    0.09149  -4.894 9.87e-07 ***
```

Two things to notice. First, unlike `lmer`, `glmer` **does** print a p-value column: the maximum-likelihood fit for a GLMM gives usable z-tests, so the degrees-of-freedom problem that made `lmer` withhold p-values does not bite here. Second, the coefficients live on the log-odds scale, so exponentiate to read them as **odds ratios**:

```r
round(exp(fixef(gm)), 3)
#> (Intercept)  onboarding 
#>       1.754       0.639
```

Each extra hour of onboarding multiplies the odds of churn by 0.64, a 36% cut in churn odds per hour, after accounting for the region each account sits in. The random intercept absorbs the fact that some regions are simply churnier than others. Plotting each region's fitted churn curve makes the structure visible: the same S-shaped fall, shifted up or down by each region's baseline.

```r
library(ggplot2)
accounts$p_churn <- predict(gm, type = "response")
ggplot(accounts, aes(onboarding, p_churn, group = region, colour = region)) +
  geom_line(alpha = 0.85) +
  labs(title = "Each region's churn curve, shifted by its baseline",
       y = "predicted P(churn)")
```

=== step === quiz
::eyebrow Check yourself
## Choosing the family and link

A colleague wants to model the **number of support tickets** each account files (0, 1, 2, ...), grouped by region, with a mixed model. What should they fit?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A linear mixed model with lmer, because counts are numbers ::no Counts are non-negative integers, often skewed with many zeros; a linear model can predict negative counts and gets the variance wrong. Counts need a count family through a GLMM.
- glmer(tickets ~ ... + (1 | region), family = poisson): a GLMM with a Poisson family and its log link ::ok Right. Counts call for a Poisson (or negative-binomial) GLMM; glmer with family = poisson uses the log link so fitted counts stay non-negative, while the random intercept handles the regions.
- glmer(tickets ~ ... + (1 | region), family = binomial), because glmer always uses the binomial family ::no glmer supports many families; binomial is for yes/no (or proportion) outcomes, not counts. The family must match the outcome's distribution; for counts that is poisson (or negative binomial for overdispersion).
- Drop the grouping and use an ordinary glm, because glmer cannot do counts ::no glmer handles Poisson counts fine, and dropping region reintroduces the pseudoreplication that mixed models exist to fix.

=== step === concept
::eyebrow When the fit complains
## Troubleshooting convergence

Richer random-effects structures ask more of your data, and `lme4` will warn you when you have asked for too much. The most common message is a **singular fit**. Here is one on purpose: only five groups, and a slope that does not actually vary between them, yet we still ask for a random slope.

```r
set.seed(7)
grp <- factor(rep(letters[1:5], each = 8))          # only 5 groups to learn from
x    <- round(runif(40, 0, 10), 1)
y    <- 3 + 1.5 * x +                                # ONE slope shared by every group
        rnorm(5, 0, 4)[as.integer(grp)] +           # baselines differ by group
        rnorm(40, 0, 2)                             # noise
small <- data.frame(grp, x, y)

library(lme4)
fit <- lmer(y ~ x + (1 + x | grp), data = small)    # we ASK for a per-group slope too
#> boundary (singular) fit: see help('isSingular')
isSingular(fit)
#> [1] TRUE
```

A singular fit means the model pushed a variance to zero or a correlation to exactly plus or minus one: the random-effects structure is more complex than the data can support (five groups cannot pin down a slope variance, and the true slope did not vary anyway). The estimated correlation here collapses to -1.00, a tell-tale sign. It is a warning about the *model*, not a bug in your code, and the fix is to simplify, in this order:

- **Drop the correlation.** Replace `(1 + x | grp)` with `(1 + x || grp)`: the `||` keeps the random slope but stops estimating the intercept-slope correlation, removing the hardest parameter.
- **Drop the random slope.** Fall back to `(1 | grp)` when a slope genuinely does not vary, or when too few groups can support one.
- **Rescale predictors.** Very different variable scales (dollars next to a 0-to-1 flag) cause convergence, not singularity, warnings; `scale()` the numeric predictors and refit.
- **Switch the optimizer.** `lme4::allFit(fit)` refits with several optimizers; if they all land in the same place, trust the result despite a borderline warning.

[WARNING]
Never ignore a convergence or singular-fit warning and report the numbers as if nothing happened. A singular model is telling you it cannot estimate what you asked for. Simplify the random-effects structure until the warning clears, and let the likelihood-ratio test, not habit, decide how much structure the data can carry.

=== step === tryit
::eyebrow Your turn
## Fix a singular fit

The `(1 + x | grp)` model above was singular. Apply the first fix: keep the random slope but drop the intercept-slope correlation, using the double-bar `||` operator. Fill in the blank, then run it.

```r
library(lme4)
fixed <- lmer(y ~ x + (1 + x ____ grp), data = small)
isSingular(fixed)
```
::check {"regex":"\\|\\|","gate":true,"difficulty":"intermediate","ok":"Right. (1 + x || grp) keeps a random intercept and a random slope but stops estimating the correlation between them, dropping the parameter the small data set could not support. The fit is no longer singular.","no":"Use the double-bar operator: (1 + x || grp). One bar keeps the correlation; two bars drop it while still allowing a random slope."}
::solution
```r
library(lme4)
fixed <- lmer(y ~ x + (1 + x || grp), data = small)
isSingular(fixed)
#> [1] FALSE
```

=== step === concept
::eyebrow Go deeper
## References

- [Gelman and Hill (2007), Data Analysis Using Regression and Multilevel/Hierarchical Models](http://www.stat.columbia.edu/~gelman/arm/) - the definitive, readable treatment of varying intercepts and slopes and when each is worth it.
- [Bates, Machler, Bolker and Walker (2015), Fitting Linear Mixed-Effects Models Using lme4 (JSS 67:1)](https://doi.org/10.18637/jss.v067.i01) - the paper behind lme4, the `(1 + x | g)` syntax, and the REML fit you read here.
- [Barr, Levy, Scheepers and Tily (2013), Random effects structure for confirmatory hypothesis testing: Keep it maximal (J. Memory and Language)](https://doi.org/10.1016/j.jml.2012.11.001) - the classic argument for including random slopes, and the trade-offs when data is thin.
- [Bolker et al. (2009), Generalized linear mixed models: a practical guide for ecology and evolution (Trends in Ecology and Evolution)](https://doi.org/10.1016/j.tree.2008.10.008) - a clear, example-led introduction to GLMMs and choosing a family.
- [Bolker, GLMM FAQ](https://bbolker.github.io/mixedmodels-misc/glmmFAQ.html) - the go-to reference for convergence and singular-fit troubleshooting, kept current by the lme4 authors.

=== step === complete
## Lesson 13 complete

You can now fit mixed models that let each group respond differently and that handle outcomes beyond the normal. A **random slope**, `lmer(y ~ x + (1 + x | group))`, gives every group its own slope drawn from a shared distribution, reports how much slopes vary and how they correlate with the baseline, and honestly widens the average slope's standard error. A **GLMM**, `glmer(y ~ x + (1 | group), family = ...)`, adds a link function so mixed models reach yes/no and count outcomes, read on the odds or rate scale. And when a richer model throws a **singular fit** or convergence warning, you know it is telling you the random-effects structure outran the data, and you simplify with `||`, a dropped slope, rescaling, or a different optimizer.

That completes Advanced Regression and GLMs. You started with a single outlier tilting an OLS line and finished fitting hierarchical models to grouped, non-normal data, the full modern regression toolkit. From here, the natural next steps are the tree-based and Bayesian tracks, where many of these same ideas (partial pooling, shrinkage, honest uncertainty) return in new forms.
