---
title: "Estimation and the Bootstrap Lesson 3: Matching moments to estimate a parameter"
catalog_blurb: "Fit a distribution by matching its own mean to your sample's, no optimiser needed."
description: "Match a sample's mean and variance to a distribution's own to estimate its parameters in closed form, and see where that disagrees with maximum likelihood."
keywords: "method of moments, moment matching, maximum likelihood, Poisson distribution, exponential distribution, gamma distribution, parameter estimation, R"
post_type: "LESSON"
curriculum_id: "4.20.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-estimation"
course_title: "Estimation and the Bootstrap"
course_lesson: "3"
course_total: "7"
course_landing: "Estimation-and-the-Bootstrap-Course.html"
course_next: "How-Much-Information-a-Sample-Carries.html"
course_prev: "Maximum-Likelihood-from-the-Curve-Up.html"
---

=== step === cover
## Matching moments to estimate a parameter

Today let's work out how to estimate a parameter by matching arithmetic you already know how to do, a mean, a variance, straight to the distribution's own version of it, then solving.

Priya runs the helpdesk for a small software company, and she logs everything that moves through it. She has logged forty hourly counts of how many tickets came in, which average 4 an hour. She has timed forty gap times between one ticket and the next, which average 15 minutes. And she has fifty handling times, how long it took to close a ticket once someone picked it up, which average 8 minutes with a moment variance of 16 around that average.

Each of those logs hides a parameter Priya wants a number for: how many tickets to expect in an hour, how long a gap between tickets typically runs, and how a handling time is spread around its own average. For every one of them, this lesson uses the same three moves.

::widget process-flow {"steps":[{"title":"Compute the sample moment(s)","sub":"the mean, and the variance when a second parameter is unknown"},{"title":"Set it equal to the same moment of the distribution","sub":"the formula already relating the parameter to its mean and variance"},{"title":"Solve the small system for the parameter","sub":"algebra only, no optimiser"}]}

That is the whole shape of it. Everything from here works this exact recipe on Priya's own numbers, one distribution at a time.

=== step === concept
## The method of moments on one parameter: tickets per hour

Start with Priya's simplest log: how many tickets arrive in an hour. Over forty different hours she counted the tickets that came in each time, and those forty counts average 4 tickets an hour.

A Poisson distribution is the usual model for a count like this, the number of events in a fixed window with no upper limit. It has exactly one parameter, written \(\lambda\) (lambda), and lambda is not just some number attached to the distribution. It is literally the Poisson's own mean. Whatever value lambda takes, that is also the average count the Poisson produces.

So the method of moments here is short. Compute the sample's own mean, Priya's forty counts. Set it equal to the Poisson's mean, lambda. Solve for lambda, which takes one line because the Poisson's mean already equals lambda with nothing else attached.

Compute that sample mean directly in R.

```r
# Match the sample mean of 40 hourly ticket counts to the Poisson's own mean, lambda
hourly_tickets <- c(4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
                     3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
                     5, 5, 5, 5, 5, 5, 5, 5, 5, 5)
lambda_hat <- mean(hourly_tickets)
lambda_hat
#> [1] 4
```

The forty counts average exactly 4, so lambda-hat, the method-of-moments estimate of lambda, is 4. Nothing was optimised and nothing was searched for. The sample's own mean was already the answer the moment equation asked for.

The chart below plots the full shape of those forty counts, not just their average.

::widget chart-plotter {"data":[{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":4},{"x":3},{"x":3},{"x":3},{"x":3},{"x":3},{"x":3},{"x":3},{"x":3},{"x":3},{"x":3},{"x":5},{"x":5},{"x":5},{"x":5},{"x":5},{"x":5},{"x":5},{"x":5},{"x":5},{"x":5}],"geoms":["histogram"],"x":"ticket_count"}

Twenty of the forty hours sat at exactly 4 tickets, with ten running a little lower at 3 and ten a little higher at 5. That is the shape behind the single number 4. Not every hour saw exactly 4 tickets, but 4 is exactly where the counts centre, which is why it is also the Poisson's own mean.

=== step === concept
## The gaps between tickets: matching moments for the exponential

Now look at a different kind of log: not how many tickets arrive in an hour, but how long the gap is between one ticket and the next. Priya timed forty of these gaps, in minutes, and they average 15 minutes.

A gap like this, the waiting time until the next event in a process with no memory of how long you have already waited, is usually modelled with an exponential distribution. It also has exactly one parameter, written \(\theta\) (theta), called its rate. But unlike the Poisson, the exponential's own mean is not theta itself. It is 1 over theta. A higher rate means shorter average gaps, and a lower rate means longer ones.

So the method of moments here runs the same three moves, with one extra step at the end. Compute the sample mean, 15 minutes. Set it equal to the exponential's own mean, 1 over theta. Solve for theta by taking the reciprocal.

```r
# Match the sample mean of 40 gap times to the exponential's own mean, 1 over the rate
ticket_gaps <- c(9.14, 79.71, 0.24, 47.91, 28.08, 9.72, 0.97, 14.62, 5.33, 1.68,
                  9.15, 9.51, 13.09, 12.48, 31.73, 15.81, 14.66, 0.11, 11.44, 15.28,
                  22.86, 7.13, 3.24, 9.13, 31.19, 8.17, 33.30, 10.50, 3.14, 51.58,
                  0.07, 2.23, 9.65, 11.16, 19.24, 2.21, 16.69, 5.75, 20.28, 1.82)
theta_hat <- 1 / mean(ticket_gaps)
round(theta_hat, 5)
#> [1] 0.06667
```

The forty gaps average exactly 15 minutes, so theta-hat, the rate that makes the exponential's own mean equal to 15, is 1 divided by 15, about 0.0667 tickets a minute. The gap and the rate are just two readings of the same fact: a gap of 15 minutes on average means a ticket arrives at a rate of roughly 1 every 15 minutes.

The widget below shows the same recipe at work on a different, smaller set of waiting times, so you can watch what moves and what does not as the sample grows.

::widget likelihood-curve {"model": "expo", "n": 40}

This widget runs on its own canned waiting-time data, not Priya's own gaps. Its waits average 2 minutes rather than her 15, so its rate-hat settles at 0.5 rather than Priya's roughly 0.0667. The mechanics are identical either way: match a sample mean to 1 over the rate, then watch the curve.

Move the slider across the sample sizes and watch the curve sharpen around that peak as the sample grows. The peak itself never moves, because the widget always holds its own mean fixed at 2 minutes. That is the exact same thing that would happen to the picture behind Priya's 0.0667 if she kept logging more gaps at the same 15-minute average: the estimate would stay put, and only the certainty around it would improve.

=== step === concept
## Why these moment estimates are also maximum likelihood estimates

Maximum likelihood scores every candidate value of a parameter by how probable the data actually observed would be under that value, and keeps whichever value scores highest. That sounds like a completely different computation from matching a mean to a mean. For the Poisson and the exponential, it is not.

Take the Poisson first. For n ticket counts \(x_1\) through \(x_n\), the log of the likelihood is

\[\ell(\lambda) = \Big(\sum x_i\Big)\log\lambda - n\lambda - \sum\log(x_i!)\]

At the peak of this curve, its slope is zero, so differentiate with respect to lambda and set the result to zero:

\[\frac{d\ell}{d\lambda} = \frac{\sum x_i}{\lambda} - n = 0 \quad\Rightarrow\quad \hat\lambda = \frac{\sum x_i}{n}\]

That last line is the sample mean. It is the exact same equation the moment-matching step already solved: set lambda equal to the sample mean.

The exponential works out the same way. For n gaps, the log-likelihood is

\[\ell(\theta) = n\log\theta - \theta\sum x_i\]

Differentiate with respect to theta and set it to zero:

\[\frac{d\ell}{d\theta} = \frac{n}{\theta} - \sum x_i = 0 \quad\Rightarrow\quad \hat\theta = \frac{n}{\sum x_i} = \frac{1}{\bar{x}}\]

That is again exactly the moment equation: the rate that makes 1 over theta equal to the sample mean.

So moment matching and maximum likelihood are not two different answers that happen to coincide here. For these two distributions, the equation moment matching solves by algebra and the equation maximum likelihood solves by calculus are the same equation, written two different ways.

Confirm that numerically, by handing each log-likelihood to `optimise()` and comparing its answer to lambda-hat and theta-hat.

```r
# Confirm the moment estimates sit at the peak of each log-likelihood
loglik_pois <- function(lambda) sum(dpois(hourly_tickets, lambda, log = TRUE))
lambda_opt <- optimise(loglik_pois, c(0.1, 20), maximum = TRUE)$maximum

loglik_expo <- function(theta) sum(dexp(ticket_gaps, rate = theta, log = TRUE))
theta_opt <- optimise(loglik_expo, c(0.001, 1), maximum = TRUE)$maximum

round(c(lambda_hat = lambda_hat, lambda_opt = lambda_opt), 6)
#> lambda_hat lambda_opt 
#>   4.000000   3.999999 
round(c(theta_hat = theta_hat, theta_opt = theta_opt), 6)
#>  theta_hat  theta_opt 
#>   0.066667   0.066648 
```

`optimise()` searches for the peak without ever touching calculus, and it lands within a hair of both lambda-hat and theta-hat. The tiny gap left over, 0.000001 for lambda and 0.00002 for theta, is only there because `optimise()` stops as soon as it is close enough rather than solving the algebra all the way through.

=== step === quiz
## Quick check: why do these two estimates agree with maximum likelihood?

Lambda-hat came out to 4. Theta-hat came out to 1 over 15. It turns out both of those numbers are also the maximum likelihood estimate for their own distribution, the value that makes the data actually observed the most probable, found by a completely different calculation. Why do the two methods land on the exact same number here?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Because for the Poisson and the exponential, setting the log-likelihood's slope to zero algebraically reduces to the exact same equation the moment-matching step already solved: the sample mean equals the distribution's own mean. ::ok Exactly right. The two recipes look different on the surface, arithmetic against calculus, but for these two distributions they are forced down to one identical equation.
- Because method of moments and maximum likelihood always land on the same estimate, for any distribution. ::no
- Because this particular sample of forty tickets and forty gaps happened to behave unusually well; a different sample would likely give the two methods two different numbers. ::no Not a coincidence of this one sample. For the Poisson and the exponential, the equation method of moments solves by hand is identical, term for term, to the equation calculus produces by setting the log-likelihood's derivative to zero. A different sample of forty would still make both methods agree, just at a different lambda or theta.

=== step === concept
## Matching two moments at once: how long a ticket takes to resolve

The Poisson and the exponential each had one unknown parameter, and one moment equation was enough to find it. Handling time, how long it takes to close a ticket once someone picks it up, needs two.

Priya logged fifty handling times, in minutes. They average 8 minutes, with a moment variance of 16. Moment variance means the average squared distance of each handling time from that 8-minute average, dividing by 50 rather than by 49 the way R's own `var()` does. It is a small difference, but it is the version the method of moments actually matches.

A gamma distribution is the usual model for a positive, right-skewed measurement like a handling time: most tickets close reasonably quickly, and a few take much longer. It has two parameters, shape and rate, and this time one moment equation is not enough. The gamma's own mean is shape divided by rate, and its own variance is shape divided by rate squared:

\[\text{mean} = \frac{\text{shape}}{\text{rate}}, \qquad \text{variance} = \frac{\text{shape}}{\text{rate}^2}\]

Two equations, two unknowns. Divide the variance equation by the mean equation and the shape cancels, leaving the rate on its own:

\[\frac{\text{variance}}{\text{mean}} = \frac{1}{\text{rate}} \quad\Rightarrow\quad \hat{\text{rate}} = \frac{\text{mean}}{\text{variance}}\]

Then the mean equation hands back the shape directly:

\[\hat{\text{shape}} = \hat{\text{rate}} \times \text{mean}\]

No optimiser anywhere, just two equations solved by substitution. Here are fifty handling times, built in code so the mean and moment variance land on exactly the 8 and 16 Priya actually measured.

```r
# Match two moments at once: the gamma's mean and variance, to the 50 handling times
set.seed(42)
handling_times <- rgamma(50, shape = 4, rate = 0.5)
mv0 <- mean((handling_times - mean(handling_times))^2)
rescale <- sqrt(16 / mv0)
handling_times <- 8 + rescale * (handling_times - mean(handling_times))

m1 <- mean(handling_times)
m2 <- mean((handling_times - m1)^2)
rate_hat <- m1 / m2
shape_hat <- m1 * rate_hat
round(c(m1 = m1, m2 = m2, rate_hat = rate_hat, shape_hat = shape_hat), 4)
#>        m1        m2  rate_hat shape_hat 
#>       8.0      16.0       0.5       4.0 
```

Rate-hat comes out to 0.5 and shape-hat to 4, both closed form, both read straight off the mean and the moment variance with no search. Plot a histogram of those fifty handling times with the gamma density that shape-hat and rate-hat describe drawn over it.

```r
# Plot the 50 handling times with the fitted gamma density drawn over them
library(ggplot2)
handling_df <- data.frame(handling_time = handling_times)
ggplot(handling_df, aes(handling_time)) +
  geom_histogram(aes(y = after_stat(density)), bins = 10, fill = "grey80", color = "white") +
  stat_function(fun = dgamma, args = list(shape = shape_hat, rate = rate_hat),
                color = "steelblue", linewidth = 1)
```

The blue curve is not a separate fit laid on top as decoration. It is exactly the gamma with shape 4 and rate 0.5, the two numbers the moment equations above just handed back. It tracks the grey bars closely: a right-skewed hump centred a little under 8 minutes, with a long thin tail stretching out toward the handful of longer handling times.

=== step === concept
## Fitting the same handling times by maximum likelihood

The moment equations above solved for shape and rate directly, with no searching. Maximum likelihood cannot do that here. Differentiating the gamma's log-likelihood with respect to shape traps shape inside a function with no algebraic inverse, so there is no formula to solve by substitution the way there was for the mean and the variance. Maximum likelihood has to search for the gamma's shape and rate instead, the same way `optimise()` searched for lambda and theta earlier, except now searching over two unknowns at once with `optim()`.

`optim()` only knows how to minimise a function, so the code below flips the sign of the log-likelihood and asks `optim()` to minimise that. Minimising the negative of something is the same as maximising the thing itself.

```r
# Fit the gamma by maximum likelihood with optim(), starting from the moment estimates
negloglik_gamma <- function(par, x) -sum(dgamma(x, shape = par[1], rate = par[2], log = TRUE))
fit <- optim(c(shape_hat, rate_hat), negloglik_gamma, x = handling_times,
             method = "L-BFGS-B", lower = c(0.01, 0.01))
round(c(shape_mle = fit$par[1], rate_mle = fit$par[2]), 4)
#> shape_mle  rate_mle 
#>    3.6621    0.4578 
round(c(shape_hat = shape_hat, rate_hat = rate_hat), 4)
#> shape_hat  rate_hat 
#>       4.0       0.5 
```

This time the two methods do not agree. Maximum likelihood puts shape at 3.6621 and rate at 0.4578. The moment equations above put them at 4 and 0.5. Both describe roughly the same gamma, close but not identical, because unlike the Poisson and the exponential, the gamma's moment equation and its likelihood equation are not the same equation underneath. `optim()` started its search right at the moment estimates and still moved a little further to find its own, genuinely different, peak.

=== step === concept
## Why a moment estimator breaks first when the model is slightly wrong

Every number so far came from a clean sample of fifty handling times. Real logs are rarely that clean. Suppose two tickets this month took far longer than usual to close, 70 minutes and 90 minutes, and those two join the same fifty.

Recompute both the moment estimate and the maximum likelihood estimate on the fifty-two handling times now, and compare each to what it was before the two long ones arrived.

```r
# Add two unusually long handling times and recompute both estimators
handling_times_contam <- c(handling_times, 70, 90)

m1c <- mean(handling_times_contam)
m2c <- mean((handling_times_contam - m1c)^2)
rate_hat_c <- m1c / m2c
shape_hat_c <- m1c * rate_hat_c

fit_c <- optim(c(shape_hat, rate_hat), negloglik_gamma, x = handling_times_contam,
               method = "L-BFGS-B", lower = c(0.01, 0.01))

tab <- data.frame(
  estimator = c("moment shape", "MLE shape", "moment rate", "MLE rate"),
  before = round(c(shape_hat, fit$par[1], rate_hat, fit$par[2]), 4),
  after = round(c(shape_hat_c, fit_c$par[1], rate_hat_c, fit_c$par[2]), 4)
)
tab$change <- round(tab$after - tab$before, 4)
tab$pct <- round(100 * tab$change / tab$before, 1)
print(tab, row.names = FALSE)
#>     estimator before  after  change   pct
#>  moment shape 4.0000 0.5498 -3.4502 -86.3
#>     MLE shape 3.6621 1.5905 -2.0716 -56.6
#>   moment rate 0.5000 0.0511 -0.4489 -89.8
#>      MLE rate 0.4578 0.1477 -0.3101 -67.7
```

Read the change column. The moment-based shape estimate fell from 4 to 0.5498, a drop of 86.3%. The maximum likelihood shape estimate also fell, from 3.6621 to 1.5905, but only by 56.6%, a smaller move on the exact same two extra values. The rate tells the same story: the moment rate dropped 89.8%, the likelihood rate 67.7%.

There is a sharper way to see how much that moment-based drop costs. A gamma with shape below 1 has no hump at all; its density is highest right at zero and falls away from there. The moment estimate's shape just crossed that line, from 4, comfortably bell-shaped around 8 minutes, to 0.5498, which describes a distribution piled up near zero, nothing like fifty-two handling times that mostly run between 4 and 15 minutes. The likelihood estimate's shape, 1.5905, stayed on the believable side of that same line.

Why does the moment estimator move so much further on the same two numbers? Its equations are built from squared deviations, the same m2 computed above. Squaring a deviation of 70 or 90 minutes against a mean near 8 produces a huge number, and that huge number dominates the average it sits inside. The equation `optim()` is actually solving underneath is built differently, from the mean of the logarithms of the data rather than the mean of their squares, and a large value's logarithm grows far more slowly than its square does. Ninety's logarithm is only a little bigger than eight's; ninety squared against eight's own spread is enormous by comparison.

That is the trade the method of moments makes for its speed. It replaces a search with algebra by matching moments built from squares, but a square amplifies a stray large value far more than a logarithm does. So the moment estimator is usually the first one to move when a sample picks up a few genuinely unusual values, exactly as it just did here.

=== step === quiz
## Quick check: method of moments and its limits

Here is a different situation to test the same judgement on. A different team logs sixty call-wait times and fits a two-parameter distribution to them by matching its first two moments, the same way this lesson matched the gamma's. Partway through logging, a handful of unusually long waits get added to the sixty. What should the team expect?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The moment estimate and the maximum likelihood estimate will still land on the same number, the way lambda-hat and theta-hat did for the Poisson and the exponential. ::no
- The moment estimate will move more than a maximum likelihood estimate on the same contaminated data would, because the moment equations run on squared deviations, which a few large values dominate far more than a likelihood equation does. ::ok Right. The Poisson and the exponential were the special case where the two methods are forced to agree. For a two-parameter distribution like this one, or the gamma matched earlier, they already differ before any contamination, and the moment estimate is the one that moves further once a few large values arrive.
- Method of moments cannot be used here at all, since it only works when there is a single unknown parameter. ::no
- The moment estimate will be biased by the same fixed amount no matter how many long waits get added, since bias is a property of the estimator, not of the data in front of it. ::no Three slips to untangle here. Method of moments and maximum likelihood only agree exactly for a few distributions, including the Poisson and the exponential; for a two-parameter distribution like the gamma, the two already disagreed even before any contamination. Method of moments works perfectly well with two parameters, matching two moments at once is exactly what Priya's handling times did. And what moves here is not a fixed bias; it is the moment estimate's own sensitivity to a few extreme values, which grows with how extreme they are, the same way shape-hat collapsed from 4 to 0.5498 once two long handling times joined the sample.

=== step === tryit
## Your turn: match the moments for a new parameter

Priya also keeps each resolved ticket's customer satisfaction score, from 1 to 10. Ten of those scores are given below, and they look roughly normal. Match the normal distribution's first two moments to this sample the same way you just matched the gamma's two moments: set mu-hat equal to the sample mean, and sigma2-hat equal to the sample's moment variance, the average squared distance from that mean.

```r
# Match the normal's two moments, mu and sigma^2, to these ten satisfaction scores
x <- c(6, 7, 8, 7, 9, 6, 8, 7, 9, 8)

# Fill in the two lines: the sample mean, and the sample's moment variance


```
::check {"regex": "(?=[\\s\\S]*mu_hat\\s*<-\\s*mean[(]x[)])(?=[\\s\\S]*sigma2_hat\\s*<-\\s*mean[(][(]x\\s*-\\s*mean[(]x[)][)]\\^2[)])", "gate": true, "difficulty": "beginner", "ok": "Right: mu-hat is 7.5 and sigma2-hat is 1.05. A normal distribution has two parameters that are just its own mean and variance, so matching moments for it needs no algebra at all beyond computing the sample mean and moment variance directly.", "no": "Use the same two-line recipe shown for the gamma, now written for a normal distribution instead: mu_hat <- mean(x), then sigma2_hat <- mean((x - mean(x))^2)."}
::solution
```r
# Match the normal's two moments to the ten satisfaction scores
x <- c(6, 7, 8, 7, 9, 6, 8, 7, 9, 8)
mu_hat <- mean(x)
sigma2_hat <- mean((x - mean(x))^2)
round(c(mu_hat = mu_hat, sigma2_hat = sigma2_hat), 2)
#>     mu_hat sigma2_hat 
#>       7.50       1.05 
```

For a normal distribution, matching moments could not be more direct. Its two parameters are literally its own mean and variance, so the moment equations and the parameters are the same two numbers, with nothing left to solve for after you compute them.

=== step === concept
::prose-only the sources are text, not a visual
## References

- Pearson, K. (1894). "Contributions to the Mathematical Theory of Evolution." *Philosophical Transactions of the Royal Society A*, 185, 71-110. The paper that introduced the method of moments.
- Fisher, R. A. (1922). "On the Mathematical Foundations of Theoretical Statistics." *Philosophical Transactions of the Royal Society A*, 222, 309-368. The paper that introduced maximum likelihood, for contrast.
- [Casella, G. and Berger, R. L., *Statistical Inference* (2nd ed., Duxbury/Chapman and Hall)](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036), the chapter comparing method-of-moments and maximum likelihood estimators.
- Huber, P. J. (1981). *Robust Statistics*. Wiley. On why variance-based estimators are more sensitive to extreme values than likelihood-based ones.
- [Wikipedia, "Method of moments (statistics)"](https://en.wikipedia.org/wiki/Method_of_moments_(statistics)), the general definition and its use across distributions.
- [R documentation for `MASS::fitdistr`](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/fitdistr.html), for fitting a distribution by maximum likelihood in R.

=== step === complete
## What the method of moments gives, and what it costs

Three distributions, one recipe each time. Compute a sample moment, set it equal to the distribution's own, solve. For the Poisson and the exponential that solved in one line and landed on exactly the number maximum likelihood would have found by searching. For the gamma, matching two moments at once still solved in one line, closed form, no optimiser, but it landed a little away from the number maximum likelihood actually searches for, and a lot further away once two unusually long handling times joined the sample.

That is the whole trade. The method of moments buys speed: arithmetic instead of a search, exact for some distributions, close for others. What it spends is robustness, because the moments it matches are built from squares, and a square magnifies a stray large value far more than a search built on likelihoods does.

Forty counts, forty gaps, fifty handling times: none of those numbers is the true parameter itself, only this lesson's best arithmetic guess at it from one particular sample. A different forty hours, a different fifty tickets, would have handed back a slightly different lambda-hat, theta-hat, shape-hat and rate-hat every time.
