---
title: "Generalized Linear Models Lesson 7: Too many zeros, and the two ways to model them"
catalog_blurb: "Tell apart two reasons a count variable has too many zeros."
description: "Some counts carry far more zeros than Poisson or negative binomial can explain. Fit a zero-inflated model and a hurdle model by hand, and learn to tell the two stories apart."
keywords: "zero-inflated poisson regression, hurdle model, excess zeros count data, pscl package in r, zeroinfl function, structural zeros, negative binomial regression, overdispersion, aic model comparison, count data regression"
post_type: "LESSON"
curriculum_id: "4.80.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "7"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: "Checking-a-GLM-with-Simulated-Residuals"
course_prev: "Outcomes-with-an-Order-and-Outcomes-Without"
---

=== step === cover
## Too many zeros, and the two ways to model them

Today let's understand why some count data carry far more zeros than any standard model expects, and the two different stories that explain where all those zeros actually come from.

300 adults took part in a health survey. One question asked how many alcoholic drinks each of them had in the past week. Here are eight of the 300 respondents.

::widget styled-table {"cols": ["respondent", "drinks last week"], "rows": [[1, 3], [2, 3], [3, 4], [4, 0], [5, 4], [6, 1], [7, 0], [8, 5]], "formats": {}, "title": "Eight of the 300 respondents", "note": "All 300 respondents answered the same survey question: how many alcoholic drinks did you have in the past week."}

Two of these eight reported zero. Across all 300 respondents, let's see the full picture.

```r
# Build 300 respondents' drink counts and see how often each count occurs
library(ggplot2)

set.seed(1204)
weekly_pattern <- rpois(300, 3.5)
never_drinker <- rbinom(300, 1, 0.35)
drinks <- ifelse(never_drinker == 1, 0, weekly_pattern)

drinks_capped <- ifelse(drinks > 8, 9, drinks)
drinks_capped <- factor(drinks_capped, levels = 0:9, labels = c(as.character(0:8), "9+"))
drink_counts <- as.data.frame(table(drinks_capped))
names(drink_counts) <- c("drinks", "respondents")

ggplot(drink_counts, aes(x = drinks, y = respondents)) +
  geom_col(fill = "#2b6cb0") +
  labs(x = "Drinks last week", y = "Number of respondents",
       title = "300 respondents' drink counts")

cat(sprintf("Respondents reporting zero drinks: %d out of 300\n", sum(drinks == 0)))
cat(sprintf("Fraction reporting zero drinks: %.2f\n", mean(drinks == 0)))
#> Respondents reporting zero drinks: 111 out of 300
#> Fraction reporting zero drinks: 0.37
```

Look at that chart. The bar at zero towers over every other bar: 111 of the 300 respondents, 37%, report no drinks at all last week. That is a lot of zeros for one count variable to carry.

=== step === concept
## Why a plain Poisson cannot match this many zeros

A Poisson model is usually the first model anyone reaches for with a count outcome like this one. It assumes every respondent's weekly drink count comes from the same process, a process fully described by one number, its mean.

Let's fit that model to the drinks data and see what it predicts at zero.

```r
# Fit a Poisson model to drinks and read off its predicted P(Y = 0)
poisson_fit <- glm(drinks ~ 1, family = poisson)
mu_hat <- unname(exp(coef(poisson_fit)))
round(mu_hat, 3)
#> [1] 2.273

poisson_zero_pred <- exp(-mu_hat)
observed_zero_frac <- mean(drinks == 0)
round(c(poisson_predicted = poisson_zero_pred, observed = observed_zero_frac), 3)
#> poisson_predicted          observed 
#>             0.103             0.370 
```

The Poisson model's fitted mean is 2.273 drinks a week. For a Poisson distribution, the chance of landing on exactly zero is \(e^{-\mu}\), and with mu_hat at 2.273 that works out to 0.103, about 10%. The real data put 37% of respondents at zero, not 10%, and a Poisson model with a single mean parameter cannot close that gap without also changing the mean itself.

This widget fits a Poisson model to a different count variable with its own pile of structural zeros, not this survey's drinks data, so you can watch the same kind of failure happen on a second example.

::widget wrong-family-fit {"mode": "zero-inflation"}

The gap you see here is the same shape as the 0.103-versus-0.370 gap you just computed: the data pile up at zero far more than the Poisson model's single mean can explain, on two completely different count variables.

[NOTE]
This is not a case of the Poisson being the wrong family entirely. It is the right starting point for a count outcome. It is just missing a piece that lets some respondents sit at zero for a different reason than ordinary low counts do.

=== step === concept
## Negative binomial narrows the gap, but two stories are what is left

The next model anyone reaches for is the negative binomial. It still has one process generating every count, but it adds a second parameter that lets the variance grow faster than the mean, the usual fix for overdispersion, counts that are more spread out than a Poisson allows.

Let's fit it and see how far it closes the gap.

```r
# Fit a negative binomial model to drinks and compare its predicted P(Y = 0)
library(MASS)

nb_fit <- glm.nb(drinks ~ 1)
mu_nb <- unname(exp(coef(nb_fit)))
theta_nb <- nb_fit$theta
round(c(mu_nb = mu_nb, theta_nb = theta_nb), 3)
#>    mu_nb theta_nb 
#>    2.273    1.053 

nb_zero_pred <- dnbinom(0, mu = mu_nb, size = theta_nb)
round(c(poisson_predicted = poisson_zero_pred, nb_predicted = nb_zero_pred, observed = observed_zero_frac), 3)
#> poisson_predicted      nb_predicted          observed 
#>             0.103             0.298             0.370 
```

The negative binomial's dispersion parameter, theta_nb at 1.053, lifts the predicted zero probability from 0.103 up to 0.298. That is real progress, nearly four times closer to the observed 0.370 than the Poisson managed.

But it still falls short, and it always will, because nothing in a negative binomial distribution is a point mass sitting right on zero. It just has a longer, fatter left tail that happens to put more weight near zero than a Poisson does. Overdispersion and excess zeros are two different problems, and fixing the first one does not fix the second.

So where do the extra zeros actually come from? There are two different, equally believable stories.

1. **Zero-inflated.** Some respondents are never-drinkers. Nothing about this week, or any week, will ever get them to report a positive count. They are structurally zero, and mixed in among them are ordinary drinkers whose weekly count follows a Poisson process.
2. **Hurdle.** Nobody is structurally zero. Instead, drinking at all is one decision, and how much you drink given that you decided to is a second, separate decision.

This widget shows how a Poisson, negative binomial, and zero-inflated fit each handle a similar pile of excess zeros, on its own built-in count data.

::widget count-dist {}

Flip through the three fits. The Poisson line undershoots the zero bar every time, the negative binomial line gets closer but still undershoots, and the zero-inflated line is the only one that can sit right on top of it. That is the same shape of problem you just measured with the drinks data, on a second example.

=== step === concept
## Building and fitting the zero-inflated model by hand

The zero-inflated model turns the never-drinker story into two equations. Call \(\pi\) the fraction of respondents who are structural never-drinkers, and \(\lambda\) the average weekly count among everyone else.

A respondent can land on zero in two different ways: being a structural never-drinker, or being an ordinary drinker whose Poisson draw happened to come out zero. A positive count can only come from an ordinary drinker.

\[P(Y=0) = \pi + (1-\pi)e^{-\lambda}\]
\[P(Y=k>0) = (1-\pi)\dfrac{e^{-\lambda}\lambda^k}{k!}\]

Let's write that mixture as a log-likelihood and maximize it with optim(), the same way you would maximize any likelihood by hand.

```r
# Write the zero-inflated Poisson log-likelihood and maximize it with optim()
zip_negloglik <- function(par, y) {
  pi <- plogis(par[1])      # back-transform so pi stays between 0 and 1
  lambda <- exp(par[2])     # back-transform so lambda stays positive
  p_zero <- pi + (1 - pi) * exp(-lambda)
  log_lik <- ifelse(y == 0,
                     log(p_zero),
                     log(1 - pi) + dpois(y, lambda, log = TRUE))
  -sum(log_lik)
}

zip_fit <- optim(c(0, log(3)), zip_negloglik, y = drinks, method = "BFGS")
pi_hat <- unname(plogis(zip_fit$par[1]))
lambda_hat <- unname(exp(zip_fit$par[2]))
round(c(pi_hat = pi_hat, lambda_hat = lambda_hat), 3)
#>     pi_hat lambda_hat 
#>      0.350      3.499 
```

optim() is searching over two numbers, written on the logit and log scales so the search can never wander outside what \(\pi\) and \(\lambda\) are allowed to be. At each candidate pair it adds up the log-likelihood from every one of the 300 respondents, and the pair it lands on, pi_hat at 0.350 and lambda_hat at 3.499, is the one that makes the observed drinks data most likely under this mixture.

Those numbers recover the truth almost exactly. This survey really was built from 35% never-drinkers mixed with a Poisson(3.5) process, and the hand-fit model found both numbers back from nothing but the counts.

[TIP]
In production you would not write this likelihood by hand. One line, `pscl::zeroinfl(drinks ~ 1 | 1, dist = "poisson")`, fits the identical mixture. Shown here rather than run, so the hand-written fit above stays the one you interact with:

```r-static
# The production shortcut: fits the identical zero-inflated mixture
library(pscl)
zip_prod <- zeroinfl(drinks ~ 1 | 1, dist = "poisson")
coef(zip_prod)
```

It solves the exact same likelihood, so it lands on the same pi_hat and lambda_hat you just found by hand.

=== step === quiz
## Quick check: reading the zero-inflated model

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- pi_hat is simply the fraction of the 300 respondents who happened to report zero drinks last week. ::no
- lambda_hat is the average weekly drink count among the respondents who are not structurally zero, the at-risk drinkers' own mean. ::ok Right. lambda_hat, about 3.5, is the Poisson mean among respondents who can drink at all. pi_hat, about 0.35, is the separate, structural never-drinker fraction, close to but not the same number as the 0.37 that simply counts every zero in the data.
- pi_hat is the drinkers' average weekly count, and lambda_hat is the never-drinker fraction. ::no
- lambda_hat is the probability that any one respondent reports zero drinks that week. ::no Neither parameter is a probability of zero on its own. pi_hat, about 0.35, is the fraction who can never report a positive count. lambda_hat, about 3.5, is the Poisson mean among everyone else. The chance of an actual zero mixes both of them together: pi_hat plus (1 minus pi_hat) times the chance that Poisson draw itself lands on zero.

=== step === concept
## Gym visits: zeros from one source, not two

The same 300 respondents answered a second question: how many times did you visit the gym last month? Let's look at that count the same way.

```r
# Build the same 300 respondents' gym-visit counts and plot them
library(ggplot2)

set.seed(1204)
crossed_hurdle <- rbinom(300, 1, 0.55)
positive_u <- runif(sum(crossed_hurdle), dpois(0, 6), 1)
positive_visits <- qpois(positive_u, 6)
gym_visits <- replace(rep(0, 300), crossed_hurdle == 1, positive_visits)

gym_capped <- ifelse(gym_visits > 8, 9, gym_visits)
gym_capped <- factor(gym_capped, levels = 0:9, labels = c(as.character(0:8), "9+"))
gym_counts <- as.data.frame(table(gym_capped))
names(gym_counts) <- c("visits", "respondents")

ggplot(gym_counts, aes(x = visits, y = respondents)) +
  geom_col(fill = "#2b6cb0") +
  labs(x = "Gym visits last month", y = "Number of respondents",
       title = "300 respondents' gym-visit counts")

cat(sprintf("Respondents with zero gym visits: %d out of 300\n", sum(gym_visits == 0)))
cat(sprintf("Fraction crossing the hurdle: %.2f\n", mean(gym_visits > 0)))
#> Respondents with zero gym visits: 135 out of 300
#> Fraction crossing the hurdle: 0.55
```

Put this chart next to the drinks chart from the first step. The shape is different: the bar at zero is tall, 45% of respondents, but the bars right after it climb quickly instead of fading out the way the drinks counts did.

That difference matters. Ask yourself whether a genuinely never-at-risk group exists among these 135 people who logged zero gym visits. For drinking, a real never-drinker group exists, people who do not drink at all, for any reason, in any week. For the gym, that is much harder to argue, since every one of the 135 people who logged zero visits could, in principle, have gone.

So the zeros here come from one source, not two. 55% of respondents crossed the hurdle into going at all, and the other 45% simply did not go. None of that 45% is a person who is incapable of ever setting foot in a gym. They are only zero this month, by choice or circumstance, not by any permanent trait.

=== step === concept
## Building and fitting the hurdle model by hand

The hurdle model turns that one-source story into two separate equations instead of one mixture. Call \(p\) the fraction of respondents who cross the hurdle at all, and \(\lambda\) the average visit count among those who do, counting only the positive values.

\[P(Y=0) = 1-p\]
\[P(Y=k>0) = p\cdot\dfrac{e^{-\lambda}\lambda^k/k!}{1-e^{-\lambda}}\]

The second equation is an ordinary Poisson probability divided by \(1-e^{-\lambda}\), the chance that Poisson itself avoids zero. That division rescales the positive-count probabilities so they add up to 1 across 1, 2, 3, and onward, since zero is no longer part of what this half of the model describes. Statisticians call this a truncated Poisson.

Because the hurdle model treats crossing and counting as two separate decisions, you can fit each one on its own instead of maximizing one joint mixture.

```r
# Fit the hurdle model in two separate pieces: who crosses, then how much
p_hat <- mean(gym_visits > 0)
round(p_hat, 3)
#> [1] 0.55

positive_counts <- gym_visits[gym_visits > 0]

trunc_pois_negloglik <- function(log_lambda, y) {
  lambda <- exp(log_lambda)       # back-transform so lambda stays positive
  log_lik <- dpois(y, lambda, log = TRUE) - log(1 - exp(-lambda))
  -sum(log_lik)
}

hurdle_fit <- optim(log(5), trunc_pois_negloglik, y = positive_counts,
                     method = "Brent", lower = log(0.5), upper = log(20))
lambda_hat_hurdle <- unname(exp(hurdle_fit$par))
round(c(p_hat = p_hat, lambda_hat_hurdle = lambda_hat_hurdle), 3)
#>             p_hat lambda_hat_hurdle 
#>              0.55              5.56 
```

p_hat has a closed form: it is simply the share of respondents who logged any gym visits at all, no optimizer needed. lambda_hat_hurdle does need optim(), maximizing the truncated-Poisson log-likelihood on only the 165 respondents who crossed the hurdle, the ones in positive_counts.

Both numbers land close to the truth this survey was built from: 55% crossing the hurdle, and a Poisson(6) among them. The small gap between lambda_hat_hurdle at 5.56 and the true 6 is just sampling noise from asking only 165 people.

[TIP]
In production, `pscl::hurdle(gym_visits ~ 1 | 1, dist = "poisson", zero.dist = "binomial")` fits this identical two-part model in one line. Shown here rather than run, so the two fits above stay the ones you interact with:

```r-static
# The production shortcut: fits the identical two-part hurdle model
library(pscl)
hurdle_prod <- hurdle(gym_visits ~ 1 | 1, dist = "poisson", zero.dist = "binomial")
coef(hurdle_prod)
```

It solves the same two pieces, so it lands on the same p_hat and lambda_hat_hurdle you just found by hand.

=== step === concept
## Fitting both models to both datasets, and reading the AIC table

You have now fit the zero-inflated model to drinks, its own matching data, and the hurdle model to gym_visits, its own matching data. To compare them properly, fit each model to the other dataset too, the one it was not built for.

```r
# Cross-fit: zero-inflated on gym_visits, hurdle on drinks
zip_fit_gym <- optim(c(0, log(5)), zip_negloglik, y = gym_visits, method = "BFGS")
aic_zip_gym <- 2 * zip_fit_gym$value + 2 * 2
aic_zip_drinks <- 2 * zip_fit$value + 2 * 2

p_hat_drinks <- mean(drinks > 0)
positive_drinks <- drinks[drinks > 0]
hurdle_fit_drinks <- optim(log(3), trunc_pois_negloglik, y = positive_drinks,
                            method = "Brent", lower = log(0.5), upper = log(20))

n0_drinks <- sum(drinks == 0)
npos_drinks <- sum(drinks > 0)
loglik_hurdle_drinks <- n0_drinks * log(1 - p_hat_drinks) +
  npos_drinks * log(p_hat_drinks) - hurdle_fit_drinks$value
aic_hurdle_drinks <- -2 * loglik_hurdle_drinks + 2 * 2

n0_gym <- sum(gym_visits == 0)
npos_gym <- sum(gym_visits > 0)
loglik_hurdle_gym <- n0_gym * log(1 - p_hat) +
  npos_gym * log(p_hat) - hurdle_fit$value
aic_hurdle_gym <- -2 * loglik_hurdle_gym + 2 * 2

cat(sprintf("AIC, zero-inflated model: drinks = %.1f, gym_visits = %.1f\n", aic_zip_drinks, aic_zip_gym))
cat(sprintf("AIC, hurdle model:        drinks = %.1f, gym_visits = %.1f\n", aic_hurdle_drinks, aic_hurdle_gym))
#> AIC, zero-inflated model: drinks = 1130.8, gym_visits = 1151.9
#> AIC, hurdle model:        drinks = 1130.8, gym_visits = 1151.9
```

zip_fit$value is already a negative log-likelihood, straight from optim(), so its AIC is just twice that plus twice the parameter count. The hurdle model's log-likelihood has to be built from its two separate pieces instead: n0 * log(1 - p_hat) plus npos * log(p_hat) is the log-likelihood of the crossing decision alone, the same binomial counting that gave you p_hat in the first place, and hurdle_fit$value is the truncated-Poisson piece already fit on the positive counts. Add those two pieces together and you have the hurdle model's full log-likelihood, ready for the same AIC formula.

Here is the same comparison as a table.

::widget styled-table {"cols": ["dataset", "zero-inflated AIC", "hurdle AIC"], "rows": [["drinks", 1130.8, 1130.8], ["gym visits", 1151.9, 1151.9]], "formats": {"zero-inflated AIC": "1dp", "hurdle AIC": "1dp"}, "title": "AIC, both models fit to both datasets", "note": "Every number here comes from the four fits in the code above: the zero-inflated and hurdle log-likelihoods, each fit to drinks and to gym_visits."}

Now look at that table. Within each row, the two AIC numbers are exactly equal: 1130.8 and 1130.8 for drinks, 1151.9 and 1151.9 for gym_visits.

That is not a coincidence, and it is not a rounding accident either. Without any covariate to tell respondents apart, the zero-inflated model and the hurdle model are the same family of distributions wearing two different names. Both of them only ever have two things to decide: how many zeros there are overall, and what shape the positive counts take. Whatever \((\pi, \lambda)\) pair the zero-inflated model would pick, there is always some \((p, \lambda)\) pair in the hurdle model, with the exact same \(\lambda\), that describes that same distribution exactly, and the other direction holds too.

[KEY INSIGHT]
AIC compares how well two models fit the same data. It cannot prefer the zero-inflated story over the hurdle story, or the other way round, when the two models are mathematically the same thing. That is exactly what you are seeing here: an intercept-only comparison has no way to settle which story is right, no matter which dataset you point it at.

So how do you ever tell the two stories apart? Not from the fit, from the question you ask about where the zeros come from. Does a group exist that genuinely could not have logged a positive count, separate from ordinary bad luck?

For drinks, yes, the never-drinkers. For gym visits, no, everyone who logged zero could, in principle, have gone. That question, not the AIC table, is what decided the right model for each dataset all along.

=== step === quiz
## Your turn: which model fits the story?

A factory logs how many defects each of 400 machines produced today. This morning, maintenance recalibrated 120 of the machines, and a freshly recalibrated machine cannot produce a single defect until it has run for at least an hour, so all 120 of them log a guaranteed zero today. The other 280 machines were not touched and could log anywhere from 0 defects upward, depending on how the day goes. Which model fits this defect count?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Hurdle: whether a machine logs any defects today is one decision and how many is a second, so a count with extra zeros always calls for the hurdle model. ::no
- Zero-inflated: the 120 recalibrated machines are a separate, genuinely never-at-risk group today, structurally zero, mixed in with the 280 machines' ordinary defect-generating process. ::ok Right. The recalibrated machines are not merely unlucky enough to log zero, they cannot log anything else today. That is exactly the never-at-risk group the zero-inflated model is built for.
- Whichever model gives the lower AIC once both are fit to the data, since AIC always settles it outright. ::no
- Negative binomial, since it already handles overdispersion and so avoids having to choose between the two stories. ::no None of the other three answers ask the one question that actually decides it: does a group exist that could not possibly produce a positive count today, separate from ordinary bad luck? Here the 120 recalibrated machines are exactly that group, which is why zero-inflated, not hurdle, fits. AIC cannot help without a covariate marking who was recalibrated, since without one its intercept-only zero-inflated and hurdle fits always tie exactly, as you just saw. And negative binomial fixes overdispersion, not which story explains the zeros.

=== step === tryit
## Your turn: fit the piece you have not fit yet

positive_counts still holds the 165 gym visits that crossed the hurdle, from a few steps back. Using the same truncated-Poisson log-likelihood pattern, write the one line that computes that log-likelihood at a trial value of lambda = 5, and assign it to trial_loglik.

```r
# positive_counts holds the 165 gym visits that crossed the hurdle.
# Write one line that computes the truncated-Poisson log-likelihood
# at lambda = 5: dpois(positive_counts, 5, log = TRUE) minus the
# correction that rescales it onto the positive counts only, then
# summed. Assign it to trial_loglik. Press Check when you have it.
```
::check {"regex": "trial_loglik\\s*<-\\s*sum\\s*[(]\\s*dpois\\s*[(]\\s*positive_counts\\s*,\\s*5\\s*,\\s*log\\s*=\\s*TRUE\\s*[)]\\s*-\\s*log\\s*[(]\\s*1\\s*-\\s*exp\\s*[(]\\s*-\\s*5\\s*[)]\\s*[)]\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: about -372.4. That is the log-likelihood this dataset would have under a truncated Poisson with lambda fixed at 5, the same quantity optim() searched over a few steps back, just evaluated once instead of maximized.", "no": "Reuse the truncated-Poisson pattern from a few steps back: dpois(positive_counts, 5, log = TRUE) minus log(1 - exp(-5)), summed, assigned to trial_loglik."}
::solution
```r
# Compute the truncated-Poisson log-likelihood at a trial lambda of 5
trial_loglik <- sum(dpois(positive_counts, 5, log = TRUE) - log(1 - exp(-5)))
round(trial_loglik, 3)
#> [1] -372.415
```

=== step === concept
## References

::prose-only a list of citations carries no visualizable concept

- [Zero-Inflated Poisson Regression, With an Application to Defects in Manufacturing](https://doi.org/10.1080/00401706.1992.10484793) - Lambert, D. (1992), Technometrics 34(1), 1-14. The paper that introduced the zero-inflated Poisson model.
- [Specification and Testing of Some Modified Count Data Models](https://doi.org/10.1016/0304-4076(86)90002-3) - Mullahy, J. (1986), Journal of Econometrics 33(3), 341-365. The paper that introduced the hurdle model.
- [Regression Models for Count Data in R](https://doi.org/10.18637/jss.v027.i08) - Zeileis, A., Kleiber, C., and Jackman, S. (2008), Journal of Statistical Software 27(8). The paper behind the pscl package's zeroinfl() and hurdle() functions.
- Cameron, A.C. and Trivedi, P.K. (2013). Regression Analysis of Count Data, 2nd edition. Cambridge University Press. The standard reference for count-data models generally, including both models in this lesson.
- [pscl package](https://cran.r-project.org/package=pscl) - CRAN, the source of zeroinfl() and hurdle(), named as the production shortcut in the two model-fitting steps.

=== step === complete
## Two models, two stories, one honest test to tell them apart

Both drinks and gym visits carry far more zeros than a Poisson or a negative binomial can explain, but the reason is different for each. Drinks mixes a structurally-zero group, the never-drinkers, in with an ordinary drinking Poisson process. Gym visits has no structural group at all, just one Poisson-shaped decision about whether to cross the hurdle, and a second about how much once you do.

You fit each model by hand on the data it matches, and each one recovered the true numbers it was built from: pi_hat near 0.35 and lambda_hat near 3.5 for the zero-inflated fit on drinks, p_hat at 0.55 and lambda_hat_hurdle near 6 for the hurdle fit on gym visits.

The twist came from fitting both models to both datasets. Without a covariate to separate respondents, zero-inflated and hurdle tie on AIC every time, because without one they are the same family of distributions under two different names. So the question that actually decides it is never statistical: does a genuinely never-at-risk group exist, separate from ordinary bad luck, or could every unit in the data have crossed the hurdle given a different day?

Next time a count variable shows up with far more zeros than its mean predicts, ask that question first. The answer tells you which likelihood to write down, long before any AIC table could.
