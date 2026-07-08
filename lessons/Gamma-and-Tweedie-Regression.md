---
title: "Advanced Regression Lesson 10: Gamma and Tweedie Regression"
catalog_blurb: "How to model strictly positive, skewed amounts and losses with many zeros."
description: "Model positive, right-skewed outcomes and insurance-style losses in R: fit a Gamma GLM with a log link, read multipliers on the mean, and handle zero-heavy loss with Tweedie."
keywords: "Gamma regression, Tweedie regression, GLM, log link, insurance pricing, pure premium, compound Poisson-Gamma, variance function, right-skewed, mgcv, tw, R"
post_type: "LESSON"
curriculum_id: "6.130.10"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "10"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Beta-and-Ordinal-Regression.html"
course_prev: "Zero-Inflated-and-Hurdle-Models.html"
---

=== step === cover
::eyebrow Lesson 10 of 13
## Gamma and Tweedie Regression

In Lesson 9 you tamed counts that piled up at zero. The thing you predicted was still a whole number: how many claims, how many repairs. Now the outcome changes character again. It becomes an amount of money: strictly positive, stretched out to the right by a few very large values, and sometimes floored at an exact zero.

Meet Nadia, who prices motor insurance. She has last year's book of business, thousands of policies, and for each one two numbers she has to model. First, when a driver did make a claim, how big was it: a few hundred pounds for a scraped bumper, occasionally many thousands for a write-off. Second, across every policy on the books, what did the company pay out in total: for most drivers, exactly nothing.

Those two outcomes have shapes an ordinary straight line cannot respect. The three curves below are the tools built for them. Gamma is for the positive, skewed claim amount. Tweedie is for the total loss with its wall of zeros. Toggle between them to see the shape each one is built to fit.

By the end of this lesson you will be able to:

- Say why ordinary regression is the wrong tool for a positive, right-skewed amount, and fit a Gamma model instead
- Read a Gamma model's coefficients as multipliers on the mean
- Recognise an outcome that is zero-or-positive, insurance-style loss, and model it with a Tweedie GLM

**Prerequisites:** you can fit and read [a linear model](OLS-Regression-from-Scratch.html), and you have met the GLM idea, the log link, and reading `exp(coef)` as a multiplier in the [count-model lessons](Count-Models-Poisson-and-Negative-Binomial.html). Comfortable with logs and exponents (`exp` is always positive).

::widget glm-family-shapes {}

=== step === concept
::eyebrow Why the straight line fails
## A claim amount is not a measurement on the whole number line

Nadia's first outcome is `amount`, the size of a claim in pounds. It has three habits that ordinary least squares (the straight-line `lm` you know) cannot honour:

- **It is never negative.** A claim cannot cost minus 400 pounds, yet a regression line runs happily below zero.
- **It is right-skewed.** Most claims are small, a few are enormous, so the mean sits well above the median. A symmetric bell curve is the wrong picture.
- **Its spread grows with its size.** Small claims barely vary; large ones swing by thousands. Ordinary regression assumes the noise is the same size everywhere.

Here is Nadia's book, built right here so every line on this page runs in interactive R. Each policy draws a Poisson number of claims (how often it claims) and a Gamma amount per claim (how big), and the total loss is those claims added up. Hold on to how this is built, it returns at the end of the lesson.

```r
set.seed(2026)
n <- 4000
car_value <- round(runif(n, 5, 45), 1)                 # car value, thousands of pounds
young     <- rbinom(n, 1, 0.30)                         # 1 = main driver under 25

# Each policy: a Poisson number of claims (how often), each a Gamma amount (how big).
# The total loss is those claims summed. Most policies never claim, so loss = 0.
claims_per <- rpois(n, exp(-1.9 + 0.55 * young + 0.010 * car_value))
sev_mean   <- exp(6.4 + 0.022 * car_value + 0.35 * young)   # mean claim size, pounds
loss <- numeric(n); amt <- c(); acv <- c(); ayg <- c()
for (i in seq_len(n)) {
  k <- claims_per[i]
  if (k > 0) {
    a <- rgamma(k, shape = 2, scale = sev_mean[i] / 2)
    loss[i] <- sum(a)
    amt <- c(amt, a); acv <- c(acv, rep(car_value[i], k)); ayg <- c(ayg, rep(young[i], k))
  }
}
yf <- function(z) factor(z, levels = c(0, 1), labels = c("25+", "under25"))
policies <- data.frame(loss = round(loss), car_value = car_value, young = yf(young))
claims   <- data.frame(amount = round(amt), car_value = acv, young = yf(ayg))
c(policies = nrow(policies), claims = nrow(claims), zero_loss = round(mean(policies$loss == 0), 3))
#>  policies    claims zero_loss
#>  4000.000   957.000     0.791
```

Of 4000 policies, only 957 ever produced a claim. The histogram below plots a representative sample of those claim amounts: a tall stack of small claims and a thin tail of rare, expensive ones (the largest of all 957 reaches 8462 pounds). The mean claim (1283) sits far above the median (999) precisely because that tail drags it up. This lopsided, floored-at-zero shape is exactly what a straight line gets wrong.

::widget chart-plotter {"data":[{"x":2389},{"x":2938},{"x":3071},{"x":673},{"x":787},{"x":575},{"x":2714},{"x":1268},{"x":2005},{"x":1241},{"x":392},{"x":982},{"x":811},{"x":99},{"x":207},{"x":1872},{"x":580},{"x":952},{"x":1882},{"x":1818},{"x":3769},{"x":1453},{"x":73},{"x":804},{"x":185},{"x":839},{"x":714},{"x":471},{"x":541},{"x":549},{"x":587},{"x":958},{"x":1348},{"x":4804},{"x":472},{"x":1372},{"x":1269},{"x":3598},{"x":1571},{"x":2236},{"x":1219},{"x":2043},{"x":2503},{"x":1278},{"x":396},{"x":942},{"x":1018},{"x":1279},{"x":1490},{"x":4049},{"x":1702},{"x":2675},{"x":517},{"x":754},{"x":1930},{"x":509},{"x":589},{"x":4075},{"x":913},{"x":1836},{"x":1193},{"x":924},{"x":1070},{"x":663},{"x":931},{"x":1090},{"x":462},{"x":1090},{"x":1992},{"x":6826}],"geoms":["histogram"],"x":"amount","y":"count","code":{"histogram":"ggplot(claim_sample, aes(amount)) +\n  geom_histogram(bins = 12)"}}

Fit a straight line anyway and watch two things break. Its point guess is fine, but the symmetric noise it assumes makes its 95% prediction interval dip well below zero, a real, sizeable chance of a negative claim, which is impossible:

```r
lm_fit <- lm(amount ~ car_value + young, data = claims)
predict(lm_fit, data.frame(car_value = 8, young = "25+"), interval = "prediction")
#>        fit       lwr      upr
#> 1 564.1949 -1309.925 2438.315
```

And the spread is not constant. Split the claims into three groups by their fitted size and look at the standard deviation in each: it climbs from 611 to 1344 as the mean climbs. But look at the last column, the ratio of spread to mean stays almost fixed near 0.72:

```r
claims$bucket <- cut(predict(lm_fit), 3, labels = c("cheap", "mid", "dear"))
aggregate(amount ~ bucket, claims,
          function(z) c(mean = round(mean(z)), sd = round(sd(z)), cv = round(sd(z) / mean(z), 2)))
#>   bucket amount.mean amount.sd amount.cv
#> 1  cheap      848.00    611.00      0.72
#> 2    mid     1198.00    851.00      0.71
#> 3   dear     1848.00   1344.00      0.73
```

That last fact, spread proportional to the mean, is not a nuisance. It is a fingerprint, and it points straight at the model we want.

=== step === concept
::eyebrow The right model, part 1
## Gamma regression: a positive mean, spread that scales with it

The **Gamma distribution** is the natural home for a positive, right-skewed amount. Its signature is the fingerprint you just saw: a roughly **constant coefficient of variation**. The coefficient of variation is the standard deviation divided by the mean, the spread expressed as a fraction of the size. For Nadia's claims it stayed near 0.72 whether the typical claim was 848 or 1848. Big claims vary more in absolute pounds, but by the same relative amount.

Written as a variance function, that is:

\[ \mathrm{Var}[Y] = \phi\, \mu^2, \]

where \(Y\) is the claim amount, \(\mu\) ("mu") is its mean (the value the model predicts), and \(\phi\) ("phi") is the **dispersion**, a single number setting the overall noise level. Because the mean is squared, the variance grows as the mean grows, exactly the funnel in the table. Line this up against the families you already know and the pattern is clear:

- **Normal:** \(\mathrm{Var}[Y] = \sigma^2\), constant everywhere. What `lm` assumes, and what Nadia's data breaks.
- **Poisson:** \(\mathrm{Var}[Y] = \mu\), variance equals the mean (Lesson 8).
- **Gamma:** \(\mathrm{Var}[Y] = \phi\,\mu^2\), variance grows with the square of the mean.

The second half of the model is the **link**, and it is the same log link from the count lessons. We do not model \(\mu\) with a straight line, because a line can go negative and a claim cannot. We model its logarithm:

\[ \log(\mu) = \beta_0 + \beta_1 x \quad\Longleftrightarrow\quad \mu = e^{\beta_0 + \beta_1 x}, \]

where \(x\) is a predictor (say the car's value), \(\beta_0\) the intercept and \(\beta_1\) the slope, both on the log scale. Whatever the line computes, \(e^{(\cdot)}\) maps it to a positive number, so the predicted mean claim is always above zero. And because effects sit inside an exponent, they **multiply** rather than add, precisely as the Poisson rate ratios did.

[KEY INSIGHT]
A Gamma GLM assumes the spread scales with the mean (constant coefficient of variation) and keeps the mean positive through a log link. It is the default model for money and other strictly positive, right-skewed amounts.

The panel below is that Gamma shape: pinned at zero on the left, a long tail on the right. If your outcome's spread does NOT scale with its mean, the Gamma assumption is the wrong one, and you would check a residual plot to catch it. But for claim amounts it fits like a glove.

::widget glm-family-shapes {}

=== step === tryit
::eyebrow Your turn
## Fit the Gamma model

`glm()` fits it in one line. The only new part versus a Poisson is the family: you name `Gamma` and, inside it, the link you want. Fill in the family with a Gamma using a log link, then run it.

```r
gam_fit <- glm(amount ~ car_value + young, family = ____, data = claims)
summary(gam_fit)
```
::check {"regex":"Gamma[\\s\\S]*log","gate":true,"difficulty":"beginner","ok":"That is the whole change: family = Gamma(link = \"log\") tells glm to use the Gamma likelihood and model the log of the mean.","no":"You need family = Gamma(link = \"log\"). Name the Gamma family and set its link to log inside the parentheses."}
::solution
```r
gam_fit <- glm(amount ~ car_value + young, family = Gamma(link = "log"), data = claims)
summary(gam_fit)
#> Coefficients:
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  6.374823   0.061279 104.029  < 2e-16 ***
#> car_value    0.023181   0.002055  11.280  < 2e-16 ***
#> youngunder25 0.331530   0.046851   7.076 2.87e-12 ***
#>
#> (Dispersion parameter for Gamma family taken to be 0.510382)
```

=== step === concept
::eyebrow Reading the model
## Coefficients are multipliers on the mean

On the log scale the estimates are hard to feel. Exponentiate them and each becomes a concrete multiplier on the expected claim:

```r
gam_fit <- glm(amount ~ car_value + young, family = Gamma(link = "log"), data = claims)
round(exp(coef(gam_fit)), 3)
#>  (Intercept)    car_value youngunder25
#>      586.882        1.023        1.393
```

Read them like this:

- \(e^{\beta_1} = 1.023\) for `car_value`: each extra 1000 pounds of car value multiplies the expected claim by about 1.023, roughly **2.3% more per 1000 pounds**. A pricier car costs a little more to fix.
- \(e^{\beta_2} = 1.393\) for `young`: a policy whose main driver is under 25 has an expected claim about **1.39 times** as large as an older driver's, close to 40% bigger. Not "plus 1.39", 1.39 times.

The log link is why these multiply. Because \(\mu = e^{\beta_0} \cdot e^{\beta_1 \text{car}} \cdot e^{\beta_2 \text{young}}\), turning `young` on scales the whole mean by \(e^{\beta_2}\). To get a mean claim in pounds for any policy, feed it to `predict` with `type = "response"`, which applies the link and hands back a number on the original scale:

```r
predict(gam_fit, data.frame(car_value = 40, young = "under25"), type = "response")
#>        1
#> 2066.477
```

A young driver in a 40000-pound car has an expected claim of about 2066 pounds. The dispersion (0.51) is the square of that coefficient of variation you measured (0.72 squared is about 0.51), the model reporting the same relative spread you saw by hand.

[KEY INSIGHT]
You might be tempted to just take `log(amount)` and run `lm`. That models the mean of the log, which back-transforms to the geometric mean (close to the median), not the mean in pounds, and getting the true mean back needs a bias correction (Duan's smearing). A Gamma GLM models the mean on the pound scale directly and keeps the natural mean-variance link, which is usually what you actually want to report.

=== step === quiz
::eyebrow Check yourself
## What does 1.393 mean?

Nadia's `young` coefficient exponentiates to \(e^{\beta_2} = 1.393\). Her manager asks her to say, in one plain sentence, what that means for an under-25 driver's claims. Which is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- An under-25 driver's expected claim is about 1.39 times as large, roughly 40% bigger, than an older driver's ::ok Right. An exponentiated Gamma log-link coefficient is a multiplicative factor on the mean: 1.39 times the expected claim, a 39% increase.
- An under-25 driver's expected claim is about 1.39 pounds larger than an older driver's ::no That reads it as an additive effect. The log link makes the coefficient a multiplier, not an amount added: 1.39 times as large, not plus 1.39 pounds.
- An under-25 driver's expected claim is about 1.39% larger than an older driver's ::no A multiplier of 1.393 means 39.3% larger, not 1.39%. Read exp(coef) as "times as large", so 1.393 is a 39% increase.

=== step === concept
::eyebrow A new problem
## Total loss per policy: mostly exactly zero

Nadia's second job is the one that actually sets the price: the **total loss per policy**, what the company expects to pay out over a year for each driver. That is the number a premium has to cover. And it looks nothing like the claim amounts, because now she counts **every** policy, including the many that never claimed at all.

```r
c(zero_share = round(mean(policies$loss == 0), 3), mean_loss = round(mean(policies$loss)))
#> zero_share  mean_loss
#>      0.791    307.000
```

Almost 79% of policies had a total loss of exactly zero pounds. The other 21% have a positive, skewed loss just like the claim amounts. So the outcome is a **spike at exactly 0 plus a positive tail**, and none of the tools so far can fit it:

- **Gamma** lives on strictly positive values; its density places zero probability at exactly 0, so it cannot explain the wall of zero-loss policies.
- **Poisson** only puts weight on whole numbers, but a total loss is a continuous amount of money, 307.42 pounds is perfectly possible.
- **Log-transform then `lm`** falls at the first hurdle: \(\log(0)\) is undefined, so the majority of the book would be thrown away.

Toggle the widget to Tweedie to see the shape we need: a bar of probability sitting right at 0, then a Gamma-like tail for the policies that did claim.

::widget glm-family-shapes {}

=== step === concept
::eyebrow The right model, part 2
## Tweedie: a Poisson count of Gamma-sized claims

The **Tweedie distribution** fits that spike-plus-tail shape, and it does so with a story you have already built. Look back at how Nadia's data was made: each policy drew a **Poisson number of claims** (how often it claimed, often zero) and each claim was a **Gamma amount** (how big), and the total loss was those amounts summed. A total that is a Poisson count of Gamma pieces is called a **compound Poisson-Gamma**, and that is exactly a Tweedie. When the Poisson draws zero claims, the sum is an exact 0 (the spike); when it draws one or more, the sum is positive and skewed (the tail). Frequency and severity, folded into one distribution.

Here is that mechanism in miniature, a handful of policies built the same way:

```r
set.seed(5)
n_claims <- rpois(8, 0.6)                                  # claims per policy: often 0
total    <- sapply(n_claims, function(k)
              if (k == 0) 0 else round(sum(rgamma(k, shape = 2, scale = 600))))
data.frame(policy = 1:8, claims = n_claims, total_loss = total)
#>   policy claims total_loss
#> 1      1      0          0
#> 2      2      1       2597
#> 3      3      2       1524
#> 4      4      0          0
#> 5      5      0          0
#> 6      6      1        391
#> 7      7      0          0
#> 8      8      1       1004
```

Five policies claimed nothing (a total of exactly 0), and policy 3 shows the sum of two claims. What ties Tweedie to the families you know is a single **power parameter** \(p\) in its variance function:

\[ \mathrm{Var}[Y] = \phi\, \mu^p. \]

Here \(\mu\) is the mean loss, \(\phi\) the dispersion, and \(p\) the power that sets the shape. That one number slides between everything you have met:

::widget process-flow {"steps":[{"title":"Poisson frequency","sub":"how many claims: often 0"},{"title":"Gamma severity","sub":"how big each claim is"},{"title":"Compound total","sub":"the claims summed = a Tweedie loss"}]}

[KEY INSIGHT]
The power \(p\) is a dial across the whole GLM family: \(p = 0\) is Normal (constant variance), \(p = 1\) is Poisson (variance = mean), \(p = 2\) is Gamma (variance grows with the mean squared). A Tweedie with \(1 < p < 2\) sits in between, the only region that produces a spike of exact zeros plus a positive continuous tail.

=== step === tryit
::eyebrow Your turn
## Fit the Tweedie model

There is no single "best" \(p\), so a good tool estimates it from the data. The `mgcv` package fits a Tweedie GLM with its `tw()` family and finds \(p\) for you. The formula and reading are just like a Gamma fit. Fill in the family with `tw()` and run it.

```r
library(mgcv)
tw_fit <- gam(loss ~ car_value + young, family = ____, data = policies)
tw_fit$family$family
```
::check {"regex":"family\\s*=\\s*tw","gate":true,"difficulty":"intermediate","ok":"Right. family = tw() tells mgcv to fit a Tweedie and estimate the power p from the data (here about 1.36, safely between Poisson and Gamma).","no":"Use family = tw(). That is mgcv's Tweedie family; it estimates the power parameter p for you."}
::solution
```r
library(mgcv)
tw_fit <- gam(loss ~ car_value + young, family = tw(), data = policies)
tw_fit$family$family
#> [1] "Tweedie(p=1.359)"
round(exp(coef(tw_fit)), 3)
#>  (Intercept)    car_value youngunder25
#>       98.393        1.030        2.317
```

The estimated power is 1.359, right in the compound Poisson-Gamma zone. And look at the `young` multiplier: **2.317**, against just 1.393 in the Gamma model. That is not a contradiction, it is the whole point. The Gamma model measured only how much bigger a young driver's claim is when they claim. The Tweedie model measures their **total loss**, which folds in the fact that young drivers also claim more **often**. Frequency times severity is exactly the pure premium a pricer needs, and Tweedie delivers it in one coefficient.

=== step === quiz
::eyebrow Putting it together
## Which model fits the outcome?

An insurer wants to model the **total payout per home-insurance policy** over a year. Most policies pay out exactly 0; a minority have one or more claims and pay a positive, right-skewed amount. Which model matches this outcome?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A Tweedie GLM: it places probability mass at exactly 0 (the many no-claim policies) plus a Gamma-like tail for those that pay out ::ok Right. A zero-or-positive outcome, a spike at 0 plus a skewed positive tail, is the Tweedie's home ground (a compound Poisson-Gamma, power p between 1 and 2).
- A Gamma GLM with a log link ::no Gamma lives on strictly positive values and puts zero probability at exactly 0, so it cannot explain the majority of policies that pay out nothing. That gap is the reason Tweedie exists.
- Log-transform the payout, then ordinary lm ::no log(0) is undefined, so every zero-payout policy (most of the book) would be dropped or break the fit. The zeros are the point here, not a nuisance to remove.
- A Poisson regression ::no The payout is a continuous amount of money, not a count of events; Poisson only places weight on whole numbers, so it cannot model a 307.42-pound loss.

=== step === concept
::eyebrow Go deeper
## References

- [Dunn and Smyth (2018), Generalized Linear Models With Examples in R](https://doi.org/10.1007/978-1-4419-0118-7) - has worked Gamma and Tweedie chapters in R; the closest companion to this lesson.
- [McCullagh and Nelder (1989), Generalized Linear Models, 2nd ed.](https://doi.org/10.1201/9780203753736) - the canonical reference for GLM families, link functions, and variance functions.
- [Ohlsson and Johansson (2010), Non-Life Insurance Pricing with Generalized Linear Models](https://doi.org/10.1007/978-3-642-10791-7) - how actuaries use Gamma for claim severity and Tweedie for the pure premium.
- [mgcv package (Simon Wood)](https://cran.r-project.org/package=mgcv) - the `tw()` Tweedie family you fit with here; see `?Tweedie` and `?tw`.
- [statmod package (Smyth and colleagues)](https://cran.r-project.org/package=statmod) - its `tweedie()` family fits a Tweedie GLM with a fixed power, the classic alternative to letting mgcv estimate `p`.

=== step === complete
## Lesson 10 complete

You can now model amounts, not just counts. You can say why a straight line fails on a positive, right-skewed outcome, fit a Gamma GLM with a log link, and read its coefficients as multipliers on the mean. And when the outcome is zero-or-positive, an insurance loss with a wall of zeros, you can reach for a Tweedie GLM, understand it as a compound Poisson-Gamma, and read its coefficient as the frequency-times-severity multiplier a pricer actually needs.

Next, Lesson 11: Beta and Ordinal Regression. You have handled outcomes that are positive and unbounded. Now come outcomes that are penned inside fixed walls: a proportion trapped in the interval from 0 to 1 (a beta model), and an ordered rating like "poor, fair, good, excellent" (proportional-odds ordinal regression).
