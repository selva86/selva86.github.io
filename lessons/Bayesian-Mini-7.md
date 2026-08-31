---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "A fitted Bayesian model can look tidy and still be wrong. Make it write fake datasets, hold your real data against them, and read the misfit as a number."
keywords: "posterior predictive check, posterior predictive check in R, posterior predictive p-value, pp_check brms, Bayesian model checking, replicated datasets, model misspecification, test statistic"
mathjax: true
webr: true
date: "2026-08-30"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "7"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-6"
course_next: ""
curriculum_id: "0.0.52"
lesson_access: "windowed"
catalog_blurb: "How to tell whether a fitted Bayesian model actually describes your data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

Two friends run a small online shop that sells handmade leather bags. Sixty consecutive days of orders sit in one column of a spreadsheet. Most days one or two bags go out, and on fifteen of them nobody ordered anything at all.

Somebody fitted a Bayesian model to that column, the ordinary way. It put the shop's average day at 1.67 bags, which is what the column averages to, near enough. Both friends read that, agreed it sounded like their shop, and got back to cutting leather.

Then we asked the fitted model to write out a day-book of its own, sixty days of orders it thinks the shop could have had. Day nine of the book it handed back says the shop sold minus one and a half bags.

Nobody sells minus one and a half bags.

The fit never complained about it, because nobody had ever asked it to. So let's ask it now, and let the model answer on itself. There are three moves, and all three run on the shop's real numbers.

::widget process-flow {"steps":[{"title":"Draw from the posterior","sub":"a cloud of mean and spread pairs, not one answer"},{"title":"Simulate a day-book from each draw","sub":"one made-up run of sixty days per draw"},{"title":"Compare the real data with the fakes","sub":"what the real shop shows and no fake does is the misfit"}]}

So we will write those day-books ourselves, turn the mismatch into a single number you can report, and work out which statistic actually catches a broken model instead of quietly letting it through.

=== step === concept
## Sixty days of orders, and the model that was fitted to them

Let's get the shop's data on the table first, because every number from here on comes out of it.

There are sixty consecutive days here, one row per day, and the value is how many bags went out that day. Press Run.

```r
# Put the shop's sixty days of orders on the table and look at their shape
orders <- c(0, 2, 2, 0, 4, 4, 0, 3, 1, 1, 1, 1, 2, 0, 1, 3, 4, 1, 1, 0,
            2, 1, 3, 0, 1, 1, 0, 1, 4, 0, 0, 0, 3, 3, 1, 2, 3, 1, 2, 0,
            5, 1, 0, 0, 4, 2, 4, 1, 1, 3, 0, 0, 2, 3, 1, 3, 2, 5, 2, 2)

table(orders)
#> orders
#>  0  1  2  3  4  5
#> 15 17 11  9  6  2

round(c(days = length(orders), mean = mean(orders),
        sd = sd(orders), busiest = max(orders)), 3)
#>    days    mean      sd busiest
#>  60.000   1.667   1.434   5.000

barplot(table(orders), col = "grey85", border = "white",
        main = "Sixty days at the bag shop",
        xlab = "orders in a day", ylab = "number of days")
```

The top row of the table is the number of bags and the row under it is how many days sold that many. Fifteen days sold nothing, seventeen sold a single bag, and only twice did the shop reach five. The average day is 1.667 bags with a standard deviation of 1.434.

The bar chart says the same, and two things in it are worth holding on to. The values are whole numbers with nothing in between them, and the tallest bars sit hard against the left edge, where zero is.

Now let's look at the model that was fitted to this. Whoever did it reached for the default, a Normal likelihood, which treats every day's count as a draw from a Normal distribution with some unknown mean and some unknown spread. That is what the usual Bayesian packages start you on, and for a column of numbers it is very often right.

It does carry one property that matters here. A Normal distribution spreads its probability over every number on the line, 4.3 bags and minus one bag included, and the shop's column can hold neither.

[NOTE]
Nothing has gone wrong yet. A Normal likelihood on count data is not automatically a mistake, and plenty of count columns get fitted this way without any trouble at all. The question is whether it is a mistake for **this** column, and that is a question you settle with the data rather than with a rule of thumb.

=== step === concept
## How the fitted model generates one replicated dataset

Here is the piece that makes everything else work, so let's go through it slowly.

When you fit a Bayesian model you do not come away with one mean and one spread. You come away with a posterior, which is a whole cloud of mean-and-spread pairs the data finds plausible, and the more plausible pairs turn up more often in it. For this shop the first pair drawn is a mean of 1.94 with a spread of 1.19, and the next one is a mean of 1.73 with a spread of 1.63.

Now take one of those pairs and put it to work. The likelihood is just the rule for turning a mean and a spread into data, so apply it and draw sixty numbers from a Normal distribution with that mean and that spread. What comes back is a complete made-up run of the shop, sixty days long, exactly as long as the real one. That is a **replicated dataset**, usually written y-rep.

Do that two thousand times, once per pair, and you have two thousand versions of the same shop, every one of them written by the model you actually fitted.

Drawing those pairs is the only part we will take as given. For a Normal likelihood with the usual uninformative prior the posterior comes out in closed form, so no sampler is needed. The squared spread comes from a scaled chi-square draw, and the mean comes from a Normal centred on the sample mean. Those two lines are the fit.

```r
# Draw 2,000 mean-and-spread pairs from the posterior, then let each pair write a day-book
set.seed(7)
n    <- length(orders)
nrep <- 2000

sigma2 <- (n - 1) * var(orders) / rchisq(nrep, df = n - 1)
mu     <- rnorm(nrep, mean(orders), sqrt(sigma2 / n))

round(head(data.frame(mean = mu, spread = sqrt(sigma2)), 2), 2)
#>   mean spread
#> 1 1.94   1.19
#> 2 1.73   1.63

yrep_norm <- matrix(0, nrow = nrep, ncol = n)
for (i in 1:nrep) {
  yrep_norm[i, ] <- rnorm(n, mu[i], sqrt(sigma2[i]))
}

round(yrep_norm[1, ], 2)
#>  [1]  0.93  2.19  2.06  2.26  2.54  2.98  0.05  0.38 -1.57  1.23  1.05  0.46
#> [13]  0.50  3.69  1.31  3.16  2.71  3.82  4.28  1.58  3.63  0.84  5.13  4.02
#> [25]  1.98  3.72  2.97  1.11  0.00  1.49  2.92  0.63  2.80  2.22  5.33  1.34
#> [37]  2.74  2.80  1.83  1.20  3.98  1.06  2.50  0.16  2.76  0.69  3.23  1.59
#> [49]  2.01  1.73  1.72  3.78  1.88 -0.66  2.20  3.51  3.26  1.72  0.88  1.23
```

`sigma2` holds two thousand draws of the squared spread and `mu` holds the matching two thousand draws of the mean. The loop then walks those pairs one at a time, and each pass writes one row of sixty numbers into `yrep_norm`. By the end the matrix is two thousand rows deep and sixty days wide, and every single row is one thing the fitted model says the shop could have looked like.

The row printed above is the model's first day-book, sixty days of trading. Day one sold 0.93 bags, day two sold 2.19, day nine sold minus 1.57, and day thirty five sold 5.33.

Not one of those four is a possible day at a shop. And the model is not misbehaving. It is doing exactly what a Normal likelihood does, which is to spread its probability smoothly over every real number. We asked what data it would produce, and this is the data it produces.

[KEY INSIGHT]
A replicated dataset is not a prediction and not a summary. It is a full dataset, the same size and shape as yours, drawn from the model you fitted. You get to look at it the same way you would look at real data, which is the whole trick.

=== step === quiz
## Quick check: what counts as a replicate?

`yrep_norm` holds two thousand rows and the one you just printed is the first of them. Which of these describes what that row really is?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Sixty of the shop's own days drawn again at random with replacement, so some real days appear twice and others not at all. ::no
- The model's best guess for each of the sixty days, one fitted average per day. ::no
- Sixty brand new days simulated from one mean-and-spread pair out of the posterior, so the whole row is data the fitted model could have produced. ::ok That is it. The row shares nothing with your data except its length, which is precisely why holding the two side by side tells you something.
- The shop's real sixty days with a bit of random noise added on top of each one. ::no Only one of these builds the row out of the model alone. Resampling the real days and jittering the real days both keep your data inside the answer, and a fitted average per day is one prediction rather than a dataset. A replicate starts at a posterior draw and ends with sixty numbers the model made up by itself.

=== step === concept
## Two hundred replicated datasets over the real data

One made-up day-book on its own does not tell you much. Two thousand of them show you everything the fitted model believes the shop could be, and the quickest way to see that is to draw a couple of hundred of them on one pair of axes.

So let's plot the smoothed shape of two hundred rows in grey, lay the real sixty days over the top in red, and then count how many of the made-up days came out below zero.

```r
# Draw 200 of the fake day-books over the real one, then count the fake days that go negative
plot(density(yrep_norm[1, ]), col = "grey80",
     xlim = c(-5, 8), ylim = c(0, 0.5),
     main = "200 fake shops in grey, the real one in red",
     xlab = "orders in a day")
for (i in 2:200) {
  lines(density(yrep_norm[i, ]), col = "grey80")
}
lines(density(orders), col = "red", lwd = 3)

round(mean(yrep_norm < 0), 3)
#> [1] 0.126
```

Look at the grey first. Two hundred bell shapes sit in there, their centres scattered around 1.67, and each one falls away at much the same rate on both sides. That is what a Normal likelihood is built to produce. Plenty of them spill left past zero and carry on going.

Now look at the red curve. It climbs to its highest point at about 0.85 orders and then slides away to the right, piled up at the left end where the shop's quiet days are. The little bit of red that crosses below zero is the smoothing, not the data.

The gap between the grey and the red is the misfit, and it has a size. Across all two thousand replicates, 12.6 percent of the days the model wrote are negative. That is roughly one made-up day in eight on which the shop sold less than nothing.

What you just did has a name. Holding your own data against a crowd of replicates drawn from the fitted model is a posterior predictive check, and all that is left is to make its answer reportable.

That matters, because seeing the problem is not the same as being able to state it. Somebody is going to ask how bad it is, and pointing at a plot is not an answer.

=== step === concept
## The test statistic and the posterior predictive p-value

To turn that picture into a number you have to say out loud what you care about. Pick one summary of a dataset, compute it on your real data, compute it on every replicate, and see where your value lands in the crowd. That chosen summary is called the **test statistic**.

For this shop the pick is what the plot was pointing at: how many days sold nothing at all. Fifteen of the real sixty did. So the statistic is a function that takes a dataset and hands back its number of no-sale days.

One detail before we run it. The Normal model writes fractional days like 0.93 and 0.38, so "sold nothing" has to mean something for those too, and the plain reading is to round each day to the nearest whole bag. A made-up day of 0.38 counts as a no-sale day, and a made-up day of 0.93 counts as one bag sold.

```r
# Count the no-sale days in the real book and in every fake book, then compare
zero_days <- function(y) sum(round(y) == 0)

T_obs  <- zero_days(orders)
T_norm <- apply(yrep_norm, 1, zero_days)

hist(T_norm, breaks = 20, col = "grey85", border = "white",
     main = "No-sale days in 2,000 fake shops",
     xlab = "days with no order")
abline(v = T_obs, col = "red", lwd = 3)

round(c(observed = T_obs, fake_average = mean(T_norm),
        p_value = mean(T_norm >= T_obs)), 3)
#>     observed fake_average      p_value
#>       15.000        8.507        0.025
```

Every bar of that histogram counts how many of the two thousand fakes came out with that many no-sale days. The average fake shop has 8.507 quiet days, and the middle half of them land between six and ten. The red line at fifteen is the real shop.

Fifteen is not off the chart. It does sit out at the thin right-hand edge, though. Exactly 51 of the two thousand fakes reached fifteen quiet days or more, and the line prints that share as 0.025.

That share is the **posterior predictive p-value**: the probability that a replicate's statistic reaches your observed value or goes past it, computed inside the fitted model itself.

\[ p = P\left( T(y^{\text{rep}}) \ge T(y) \mid y \right) \]

Now read the number for what it is. A model that describes the shop would write fakes landing on both sides of fifteen, so a healthy check comes back somewhere in the middle, near 0.5. At 0.025 the fitted model can only just manage the shop's quiet days, and it manages them about one time in forty.

[KEY INSIGHT]
A posterior predictive p-value is not a hypothesis test and there is no 0.05 to clear. It is a position: it says where your data sits inside the crowd of data your model would write. Near the middle is where a working model puts you, and either edge is the model telling you it cannot produce something your data plainly does.

=== step === concept
## The same check after refitting with a Poisson likelihood

So we know the fit cannot produce enough quiet days, and we know exactly what it does instead. It spends its probability on fractions and negatives, when the shop only ever writes whole bags. The repair is to fit a likelihood that can produce nothing but whole bags, zero included, and that is the Poisson.

Move the toggle below from the wrong fit to the right one and watch the observed line move. The statistic, the shop and the count of quiet days are the same in both views. Only the likelihood changes.

::widget ppc-overlay {}

Now let's do the refit on the shop's own numbers. A Poisson has a single parameter, the rate, and with a Gamma(1, 1) prior on that rate the posterior again comes out in closed form: a Gamma whose shape is the prior's 1 plus the total bags sold, and whose rate is the prior's 1 plus the number of days. Each draw of the rate then writes its own sixty-day book, the same way as before.

```r
# Refit the shop with a Poisson likelihood and run exactly the same no-sale-days check
set.seed(11)
lambda <- rgamma(nrep, shape = 1 + sum(orders), rate = 1 + n)

yrep_pois <- matrix(0, nrow = nrep, ncol = n)
for (i in 1:nrep) {
  yrep_pois[i, ] <- rpois(n, lambda[i])
}

T_pois <- apply(yrep_pois, 1, zero_days)

round(c(observed = T_obs, fake_average = mean(T_pois),
        p_value = mean(T_pois >= T_obs)), 3)
#>     observed fake_average      p_value
#>       15.000       11.707        0.212
```

The fakes now average 11.707 quiet days instead of 8.507, and the real fifteen sits inside that crowd rather than past its edge. The check comes back at 0.212, so about one fake shop in five is at least as quiet as the real one. That is a number you can work with.

Notice what actually did the work here. Nobody added a parameter for zeros and nobody tuned anything. A Poisson simply cannot write minus one and a half bags, so all the probability the Normal was spending on impossible days now goes to days the shop can really have, and a good share of it lands on zero.

[NOTE]
Passing this check does not make the Poisson the true story of the shop. It says the model reproduces the one feature we asked it about. Ask about a different feature and it may well fail, and asking about the right features turns out to be the whole skill.

=== step === concept
## The one-line version, once the model is fitted with brms

Nobody writes those loops at work. Once a model is fitted with brms, everything you just built by hand is one function call, `pp_check()`, which draws the replicates, applies the statistic and plots the comparison for you.

Here is the same shop done the short way. This one needs Stan on your machine, so run it in your local R rather than here.

```r-static
# Fit the bag shop with brms and run the same checks, one line each
library(brms)

shop <- data.frame(orders = orders)
fit  <- brm(orders ~ 1, data = shop, family = poisson())

no_sale_days <- function(y) sum(y == 0)

pp_check(fit, type = "bars", ndraws = 200)
pp_check(fit, type = "dens_overlay", ndraws = 200)
pp_check(fit, type = "stat", stat = "no_sale_days")
```

Three types will cover most of what you need.

1. `type = "bars"` is the one for counts. It draws one bar per whole number for the real data and puts the replicates' range on each bar as a point with an interval, so a shop with more zeros than its model can manage shows up as one bar poking out above its interval.
2. `type = "dens_overlay"` is the grey-curves-over-red picture, and it is the right default whenever the outcome is continuous.
3. `type = "stat"` takes any statistic you can write as a function and hands you the histogram with the observed value marked on it, which is the posterior predictive p-value in picture form.

The loop underneath has not changed. `pp_check()` calls `posterior_predict()` for the matrix of replicates and hands it to bayesplot to draw. You can always ask for that matrix yourself and count whatever you like in it, which is what we have been doing all along.

=== step === concept
## Which statistic you check decides what you find out

Here is the part that decides whether a posterior predictive check teaches you anything at all.

The Normal fit failed on quiet days. So let's put two more statistics through exactly the same machinery, the mean and the standard deviation, and watch how that same broken model does on them.

```r
# Run three different statistics through the same check, under both fitted models
ppc_p <- function(yrep, stat) mean(apply(yrep, 1, stat) >= stat(orders))

data.frame(
  statistic = c("no-sale days", "mean", "sd"),
  observed  = round(c(zero_days(orders), mean(orders), sd(orders)), 2),
  p_normal  = round(c(ppc_p(yrep_norm, zero_days), ppc_p(yrep_norm, mean),
                      ppc_p(yrep_norm, sd)), 3),
  p_poisson = round(c(ppc_p(yrep_pois, zero_days), ppc_p(yrep_pois, mean),
                      ppc_p(yrep_pois, sd)), 3)
)
#>      statistic observed p_normal p_poisson
#> 1 no-sale days    15.00    0.025     0.212
#> 2         mean     1.67    0.515     0.491
#> 3           sd     1.43    0.504     0.155
```

Read the `p_normal` column downward. The model we already know is wrong, the one writing negative bags, checks out at 0.515 on the mean and 0.504 on the standard deviation. You cannot land much closer to the middle of a crowd than that. On those two statistics the broken fit looks flawless.

The `p_poisson` column is worth a glance while you are here. The Poisson passes the mean at 0.491 but comes back at 0.155 on the standard deviation, drifting down towards the low edge. A Poisson's spread is pinned to its rate, and this shop swings a little more from day to day than that allows.

There is nothing mysterious about the 0.515 and the 0.504 once you see where those numbers came from. The Normal fit was built out of the sample mean and the sample spread. Asking it afterwards to reproduce the sample mean and the sample spread is asking it to repeat what you handed it, so it repeats it.

So a statistic the model was fitted to can hardly fail. A check on it tells you close to nothing, and a report full of such checks is a report full of passes that were never at risk.

The rule that follows is short. Check one statistic for the middle of the data, so a fit landing in the wrong place would be caught, and check at least one for the feature you would notice yourself if it were wrong. For this shop that feature is the quiet days. For yours it might be the longest gap between sales, the biggest single day, or how often the number goes above ten.

[WARNING]
A passing check is weak evidence and a failing check is a verdict. Passing means the model reproduced the features you thought to ask about. Failing means the model cannot produce your data, and there is no reading of that number that lets you report the fit as it stands.

=== step === quiz
## Quick check: a check that comes back at 0.99

Suppose you ran the standard-deviation check on a different shop and it came back at 0.99. What has the model just told you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The model reproduces that shop's spread 99 percent of the time, so the fit is about as good as it gets. ::no
- Ninety nine percent of the replicates are at least as spread out as the real data, so the model predicts far more day to day swing than the shop actually has. ::ok Right. It is the same failure you saw at 0.025 read from the other end, with the observed value out at an edge of the crowd instead of inside it. This time the model produces too much variation rather than too little.
- There is a 1 percent chance the model is wrong. ::no
- The shop's spread is statistically significant at the 1 percent level. ::no A posterior predictive p-value is a position in a crowd of replicates. It is not the probability that your model is right and it is not a significance test. Near the middle is fine, and both edges are failures: near zero your data is more extreme than the model can write, near one it is tamer than anything the model writes.

=== step === tryit
## Your turn: does either model predict the busiest day?

Both matrices of replicates are still here. `yrep_norm` holds the two thousand day-books from the Normal fit and `yrep_pois` holds the two thousand from the Poisson fit, one book per row.

The shop's busiest real day sold 5 bags. Run that statistic, the busiest day, through the same check under both models, and see whether either one struggles to produce a day like it.

```r
# yrep_norm and yrep_pois each hold 2,000 fake day-books, one per row.
# The busiest real day is max(orders), which is 5 bags.
# Work out the share of fake books whose own busiest day reaches 5 or more,
# once for each of the two models.
# Two lines. Press Check when you have them.
```
::check {"regex": "apply[(]yrep_(norm|pois), 1, max[)]", "gate": true, "difficulty": "intermediate", "ok": "Yes: 0.479 under the broken Normal fit and 0.793 under the Poisson. Both sit well inside their own crowd, so the busiest day is a statistic that lets the broken model straight through.", "no": "Same shape as the no-sale-days check with a different statistic: take the summary across the rows, compare it to the real value, and average. Start with mean(apply(yrep_norm, 1, max) >= max(orders))."}
::solution
```r
# The busiest-day check under each of the two fitted models
round(mean(apply(yrep_norm, 1, max) >= max(orders)), 3)
#> [1] 0.479
round(mean(apply(yrep_pois, 1, max) >= max(orders)), 3)
#> [1] 0.793
```

Look at the two numbers, 0.479 and 0.793. Both models produce a five-bag day about as readily as the shop did, so this statistic separates nothing, and a report showing only this check would have handed the broken fit a clean bill of health.

The busiest day is a real feature of the shop and it was a fair thing to ask about. It just happens to be a feature both likelihoods can manage. That is why the statistic has to be chosen with care. You learn something only when the check you ran was one the model could have failed.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/oldpdf/A6n41.pdf) - Gelman, Meng and Stern (1996), Statistica Sinica 6, 733-807. The paper that defines the posterior predictive p-value and the discrepancy measures behind it.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013), Chapman and Hall. Chapter 6 is model checking, including why a statistic the model was fitted to returns a p-value near 0.5.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society A 182(2), 389-402. The case for reading these checks as pictures first.
- [Graphical posterior predictive checks](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - Gabry and Mahr, the bayesplot vignette. Every plot type, with the code that draws it.
- [pp_check for brmsfit objects](https://paulbuerkner.com/brms/reference/pp_check.brmsfit.html) - Burkner, the brms reference page listing every type argument.

=== step === complete
## Quick recap

You took a fitted model, made it write two thousand versions of the shop, and used them to catch a fit that every ordinary summary had let straight through.

- A replicate is a full made-up dataset the size of yours, produced by taking one parameter pair from the posterior and running the likelihood at it.
- Two hundred of them drawn over the real sixty days showed the shape of the problem, and across all two thousand the Normal fit spent 12.6 percent of its days below zero, on a shop that cannot sell less than nothing.
- A test statistic turns that picture into one number. Fifteen no-sale days against replicates averaging 8.507 gave a posterior predictive p-value of 0.025.
- The same statistic under the Poisson refit came back at 0.212, with the real fifteen sitting inside the crowd instead of past its edge.
- The mean and the standard deviation both passed under the broken fit, at 0.515 and 0.504, because a model can always repeat what it was fitted to.

So here is the sentence to carry away. A check that passes tells you the model reproduces the features you thought to ask about, and a check that fails tells you the model cannot produce your data at all. Only the second settles anything.

That is why the statistic you choose matters so much. Go and run this on the last model you fitted, on something you would actually notice going wrong.
