---
title: "Brms: Bayesian regression without writing Stan"
slug: "Bayesian-Mini-6"
description: "Hand brm() the same formula you give lm() and get a full Bayesian fit back. Read its summary line by line, rebuild every number, and check the model."
keywords: "brms in R, brm function, Bayesian regression in R, brms summary, credible interval, posterior draws, Rhat, effective sample size, brms priors, posterior predictive check"
mathjax: false
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "6"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-5"
course_next: ""
curriculum_id: "0.0.51"
lesson_access: "windowed"
catalog_blurb: "Fit a Bayesian regression from an ordinary formula and read the output."
---

=== step === cover
::eyebrow Bayesian Decisions
## Brms: Bayesian regression without writing Stan

Asha sells coffee from a cart outside a train station. She has kept a notebook for thirty mornings: how warm it was, whether it rained, and how many cups went over the counter.

She wants one number out of those thirty rows, and an honest sense of how sure it is. How much does rain cost her?

Fit that with `lm()` and you get a slope and a standard error, and the answer stops there. Fit it the Bayesian way and you get a whole spread of plausible answers, which is what lets you say a sentence like "there is a 41% chance rain costs Asha more than fifteen cups a morning".

The catch has always been the entry fee. To get that spread you had to think about the machinery: write the model out in the Stan language, compile it, sample it, and only then look at the answer.

brms removes that fee. You write the model as a regression formula, the very same line you would hand to `lm()`, and brms writes the Stan program for you, compiles it, runs it, and gives you the answer back.

::widget process-flow {"steps":[{"title":"You write the formula","sub":"cups ~ temp_c + rain, the same line lm() takes"},{"title":"brms writes the Stan program","sub":"then compiles it once, which is the wait on a first fit"},{"title":"The draws come back","sub":"4,000 plausible parameter sets, not a single estimate"}]}

That is the whole deal, and it is the reason brms is the tool I reach for first. Today we take Asha's thirty mornings through it and read every line of what comes back.

=== step === concept
## Thirty mornings at Asha's coffee cart

Let's get the notebook onto the page first, because every number from here on comes out of it.

Each row is one morning. `temp_c` is the temperature in Celsius when Asha opened, `rain` is 1 if it rained and 0 if it stayed dry, and `cups` is how many she sold. Press Run.

```r
# Write down thirty mornings at the cart: warmth, rain, and cups sold
set.seed(6)
cart <- data.frame(
  temp_c = round(runif(30, 6, 22), 1),    # temperature in Celsius at opening
  rain   = rbinom(30, 1, 0.30)            # 1 if it rained that morning, 0 if dry
)
cart$cups <- round(20 + 2.2 * cart$temp_c - 12 * cart$rain + rnorm(30, 0, 6))

head(cart)
#>   temp_c rain cups
#> 1   15.7    0   51
#> 2   21.0    0   69
#> 3   10.2    1   23
#> 4   12.1    1   28
#> 5   18.9    0   68
#> 6   21.6    1   55
```

Fourteen of the thirty mornings were wet. The coldest opening was 7.0 degrees and the warmest was 21.6, and she sold anywhere from 14 cups to 71.

So let's take the obvious first look. What did rain do to the average?

```r
# Compare rainy mornings with dry ones, before any model gets involved
tapply(cart$cups, cart$rain, mean)
#>        0        1
#> 55.25000 36.07143

tapply(cart$temp_c, cart$rain, mean)
#>        0        1
#> 15.67500 13.75714
```

Rainy mornings averaged 36.1 cups against 55.3 on dry ones, a gap of 19.2 cups. That looks like the answer, but it is not, because the rainy mornings were also colder on average, 13.8 degrees against 15.7. Some of that 19.2 cup gap is the cold, not the rain.

You can see both effects at once if you put the mornings on a chart.

```r
# Plot cups against temperature, marking which mornings were wet
plot(cart$temp_c, cart$cups,
     pch  = ifelse(cart$rain == 1, 19, 1),
     col  = ifelse(cart$rain == 1, "steelblue", "grey30"),
     xlab = "morning temperature (Celsius)",
     ylab = "cups sold",
     main = "Thirty mornings at the cart")
legend("topleft", c("rained", "stayed dry"),
       pch = c(19, 1), col = c("steelblue", "grey30"), bty = "n")
```

Cups climb steadily with warmth, and at any given temperature the filled points sit below the open ones. That is the rain effect, separate from the cold, and getting a number for it is exactly what a regression does.

=== step === concept
## The same formula you already hand to lm()

Before the Bayesian version, let's fit the ordinary one, so there is something familiar to compare against.

```r
# Fit the ordinary least squares version first, as a reference point
fit_lm <- lm(cups ~ temp_c + rain, data = cart)
round(coef(fit_lm), 2)
#> (Intercept)      temp_c        rain
#>       16.88        2.45      -14.48
```

Read those three numbers as a sentence about the cart. Every extra degree of warmth is worth about 2.45 more cups, and a rainy morning costs about 14.48 cups compared with a dry morning at the same temperature.

Notice it landed at 14.48 rather than the raw 19.2, exactly because holding temperature fixed strips the cold out of the comparison.

Now let's do the Bayesian fit. Here is the whole thing.

```r-static
# Fit the same model the Bayesian way, in one call
library(brms)

fit <- brm(cups ~ temp_c + rain,
           data   = cart,
           family = gaussian(),
           chains = 4,
           iter   = 2000,
           seed   = 6)
```

The first line is the formula, character for character the one `lm()` took. Everything after it is settings:

- `data` is the data frame the formula's names live in, same as `lm()`.
- `family = gaussian()` says the outcome is a number scattered around a line, which is what least squares assumes too. It is the default, so you can leave it out.
- `chains = 4` runs four independent samplers, and `iter = 2000` gives each one 2,000 steps. The first half of each chain is warm-up, the stretch where the sampler is still working its way over to the region the data likes, and it gets thrown away. Four chains therefore leave you 4,000 usable draws.
- `seed = 6` fixes the randomness so your run matches mine.

That is the entire call. No model file, no Stan syntax, no compiler flags.

[NOTE]
brms builds a Stan program and compiles it to C++ before it samples, and a browser page cannot run a C++ compiler. So the brms blocks here are for your own R session, and wherever one of them prints something I have pasted in the real output. The blocks with a Run button are plain R and work right here.

=== step === concept
## How brms turns your formula into a Stan program

You do not have to take the translation on faith. `make_stancode()` shows you the exact program brms writes, without fitting anything.

```r-static
# Show the Stan program brms writes for this formula
make_stancode(cups ~ temp_c + rain, data = cart, family = gaussian())
#> parameters {
#>   vector[Kc] b;  // regression coefficients
#>   real Intercept;  // temporary intercept for centered predictors
#>   real<lower=0> sigma;  // dispersion parameter
#> }
#> transformed parameters {
#>   // prior contributions to the log posterior
#>   real lprior = 0;
#>   lprior += student_t_lpdf(Intercept | 3, 48, 18.5);
#>   lprior += student_t_lpdf(sigma | 3, 0, 18.5)
#>     - 1 * student_t_lccdf(0 | 3, 0, 18.5);
#> }
#> model {
#>   // likelihood including constants
#>   if (!prior_only) {
#>     target += normal_id_glm_lpdf(Y | Xc, Intercept, b, sigma);
#>   }
#>   // priors including constants
#>   target += lprior;
#> }
```

That is trimmed to the part that defines the model, and there are three things in it worth naming.

The `parameters` block lists the unknowns. `b` is the vector of slopes, one for `temp_c` and one for `rain`, `Intercept` is the intercept, and `sigma` is how far a single morning typically falls from the line. That is three declarations holding four unknown numbers: two slopes, an intercept and a sigma.

The `model` block is the likelihood: one line saying the cups are normally scattered around the design matrix (the predictor columns, `temp_c` and `rain`, laid out as a table) times the coefficients, with spread `sigma`. That is the formula, restated in Stan's own words.

The two `lprior` lines are the interesting part, because you never asked for them. brms filled in priors of its own: a Student t prior on the intercept centred at 48 with a scale of 18.5, and another on `sigma`. We will come back and find out where 48 and 18.5 came from.

brms hands that program to a C++ compiler once. That compile is the thirty to sixty seconds you wait on a first fit, and it is the only slow part.

=== step === concept
## Four chains, four thousand rows: what the sampler returns

Here is the shift that matters, and everything printed later is a summary of it.

`lm()` returns one number per coefficient. brms returns a table. Each row of that table is one complete set of parameter values that hang together: one intercept, one temperature slope, one rain slope and one sigma. Every row is a set the data considers plausible, so four thousand rows means four thousand plausible answers, kept rather than collapsed.

A chain is one sampler walking through that space, step by step. It proposes a move, keeps it or refuses it depending on how well the new spot explains the data, and writes down where it stands. Do that a few thousand times and the places it visits often are the values the data likes.

Have a look at a chain at work. The panel on top is the walk itself and the one below is the pile of values it has visited so far, next to the answer it is trying to trace out. The buttons change how big a step it proposes.

::widget mcmc-walk {}

Watch what a bad step size does. Tiny steps get accepted almost every time but the walk barely moves, so the pile fills in slowly. Huge steps get refused almost every time, so the walk sticks in one place for long stretches. Somewhere in the middle it moves freely and the pile settles into the right shape quickly. That is the tuning problem brms and Stan handle for you.

For Asha's fit, the draws come out of the fitted object like this.

```r-static
# Pull the posterior draws out of the fitted model
draws <- as_draws_df(fit)
dim(draws)
#> [1] 4000   10
```

That is four thousand rows, and ten columns because only four of them are the parameters you came for. The other six are bookkeeping: which chain each draw came from, which iteration it was, the log density at that point, and a couple of internals brms keeps for its own use.

We need that table to keep going, so let's build one here. The block below draws 4,000 parameter sets from the posterior, which is the name for that spread of plausible parameter values, using the least squares fit we already have as its raw material.

```r
# Draw 4,000 plausible parameter sets, standing in for the table brms returns
library(MASS)
set.seed(11)

s2 <- summary(fit_lm)$sigma^2          # the leftover variance the data showed
V  <- summary(fit_lm)$cov.unscaled     # the shape of the coefficient uncertainty
b  <- coef(fit_lm)                     # the centre it is spread around

sigma_sq <- 27 * s2 / rchisq(4000, df = 27)
betas    <- t(sapply(sigma_sq, function(s) mvrnorm(1, mu = b, Sigma = s * V)))

draws <- data.frame(Intercept = betas[, 1],
                    temp_c    = betas[, 2],
                    rain      = betas[, 3],
                    sigma     = sqrt(sigma_sq))

round(head(draws), 2)
#>   Intercept temp_c   rain sigma
#> 1     13.14   2.68 -14.73  5.87
#> 2     23.02   2.12 -14.18  7.75
#> 3     10.61   2.60  -8.44  6.65
#> 4     13.60   2.62 -14.84  6.43
#> 5     13.29   2.49 -14.03  4.56
#> 6     18.01   2.52 -17.15  4.96
```

This samples the same posterior brms samples, so every number we read off it lands on what brms printed, give or take the wobble any sampler has. It is not digit for digit identical, and it is not meant to be.

Read the first two rows across. One of them says rain costs 14.73 cups, the other says 14.18, and each comes with its own intercept, its own temperature slope and its own sigma. Neither is the answer. The four thousand of them together are the answer.

=== step === quiz
## Quick check: reading a brm() call and what it returns

You run this and wait for it to finish:

`brm(cups ~ temp_c + rain, data = cart, family = gaussian(), chains = 4, iter = 2000, seed = 6)`

What does the object that comes back actually hold?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Three coefficients and their standard errors, the same shape lm() returns, arrived at a different way. ::no
- A table of 4,000 rows, each row holding a complete set of parameter values the data finds plausible. ::ok That is it. Four chains of 2,000 steps, half of each thrown away as warm-up, leaves 4,000 rows. Nothing gets collapsed to a single estimate, which is why you can ask the fit questions a coefficient table cannot answer.
- The single best set of coefficients, picked out of the 4,000 the sampler tried. ::no
- Four separate models, one per chain, which you choose between afterwards. ::no The four chains are four independent walks through the same space, and their draws get pooled into one table of 4,000 rows. Nothing is picked as best and nothing is thrown away except the warm-up half of each chain, because keeping the whole spread is the entire point.

=== step === concept
## The brms summary, read line by line

This is the output you will read on every brms fit you ever run, so let's go through it top to bottom.

```r-static
# Print the fitted model
summary(fit)
#>  Family: gaussian
#>   Links: mu = identity
#> Formula: cups ~ temp_c + rain
#>    Data: cart (Number of observations: 30)
#>   Draws: 4 chains, each with iter = 2000; warmup = 1000; thin = 1;
#>          total post-warmup draws = 4000
#>
#> Regression Coefficients:
#>           Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> Intercept    16.86      3.73     9.46    24.34 1.00     3901     2622
#> temp_c        2.45      0.22     2.01     2.89 1.00     4161     2796
#> rain        -14.49      2.10   -18.54   -10.40 1.00     4272     2758
#>
#> Further Distributional Parameters:
#>       Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> sigma     5.54      0.80     4.25     7.39 1.00     3583     2959
```

The header is a receipt for what was fitted. `Family: gaussian` and `Links: mu = identity` say the outcome was modelled as a number scattered around a line, with no transformation on the way. `Formula` and `Data` repeat what you handed in, including that there were 30 observations. `Draws` says four chains of 2,000, the first 1,000 of each discarded as warm-up, `thin = 1` meaning nothing else was dropped, and 4,000 draws kept.

Then come the coefficient rows. Every row is one parameter, and every column is a different question asked of that parameter's 4,000 draws:

- `Estimate` is the mean of the draws, the single number to quote if you must quote one.
- `Est.Error` is how spread out the draws are. It plays the same role a standard error plays in `lm()` output, but it is measured straight off the posterior.
- `l-95% CI` and `u-95% CI` are the bottom and top of the 95% credible interval, the range that holds the middle 95% of the draws.
- `Rhat`, `Bulk_ESS` and `Tail_ESS` say nothing about the cart at all. They report on the sampler, and we will look at them shortly.

Now say the `rain` row out loud, as a sentence about Asha. Rain costs her about 14.5 cups compared with a dry morning at the same temperature, and the plausible range for that cost runs from 10.4 cups to 18.5 cups.

That last part is the sentence you cannot say from `lm()` output. There is a 95% probability that the true cost of rain sits between 10.4 and 18.5 cups, given this data and this model. That is not a statement about what would happen in repeated samples. It is a statement about the number Asha cares about.

=== step === concept
## Where those four numbers come from

Nothing in that table is a special brms quantity. Every one of those four columns is an ordinary summary of the draws, and you can produce each one yourself.

```r
# Rebuild the Estimate column: the mean of each column of draws
round(colMeans(draws), 2)
#> Intercept    temp_c      rain     sigma
#>     16.91      2.45    -14.51      5.44
```

There is `Estimate`. brms printed 16.86, 2.45 and minus 14.49, and the column means land on 16.91, 2.45 and minus 14.51. Those are the same numbers, one sampler's worth of wobble apart.

`Est.Error` is the standard deviation of the same columns.

```r
# Rebuild the Est.Error column: the standard deviation of each column
round(apply(draws, 2, sd), 2)
#> Intercept    temp_c      rain     sigma
#>      3.78      0.22      2.03      0.79
```

And the two interval columns are quantiles. The 95% credible interval is just the 2.5% point and the 97.5% point of the draws, which by construction leaves 95% of them in between.

```r
# Rebuild the two CI columns: the 2.5% and 97.5% points of each column
round(apply(draws, 2, quantile, probs = c(0.025, 0.975)), 2)
#>       Intercept temp_c   rain sigma
#> 2.5%       9.66   2.00 -18.56  4.15
#> 97.5%     24.34   2.89 -10.42  7.20
```

Compare that `rain` column with the summary. brms printed minus 18.54 to minus 10.40, and we rebuilt minus 18.56 to minus 10.42.

This is worth holding on to. A brms summary is not a report the model computes and hands down. It is four questions asked of a table you are free to ask your own questions of, which is what we are going to do in a few minutes.

=== step === tryit
## Your turn: rebuild the 95% interval for the rain row

`draws` is still sitting there with its four columns and 4,000 rows. Pull out the 95% credible interval for the rain slope on its own, straight from the `rain` column, and see it match the two CI numbers brms printed.

```r
# draws holds 4,000 rows: Intercept, temp_c, rain and sigma.
# Read the 95% credible interval off the rain column alone.
# One line. Press Check when you have it.
```
::check {"regex": "quantile[(]\\s*draws\\$rain", "gate": true, "difficulty": "beginner", "ok": "That is it: minus 18.56 to minus 10.42, sitting on top of the minus 18.54 to minus 10.40 that brms printed. Rain costs Asha somewhere between about 10 and 19 cups a morning.", "no": "You want the 2.5% and 97.5% points of one column: quantile() on draws$rain, with probs = c(0.025, 0.975)."}
::solution
```r
# Read the 2.5% and 97.5% points off the rain column of the draws
quantile(draws$rain, probs = c(0.025, 0.975))
#>      2.5%     97.5%
#> -18.56293 -10.42324
```

=== step === concept
## sigma, and what it says about a normal morning

`sigma` got printed in its own block, under `Further Distributional Parameters`, and that separation is deliberate. It is not a coefficient. No predictor is attached to it and it does not tell you what anything is worth.

What `sigma` measures is how far one single morning typically lands from the line the coefficients draw. Asha's model says 2.45 cups per degree and minus 14.5 for rain, and `sigma` says that even after both of those, a real morning still misses the prediction by about five and a half cups.

It has its own 4,000 draws like everything else, so summarise it the same way.

```r
# Summarise the sigma column: how far a single morning falls from the line
mean(draws$sigma)
#> [1] 5.44449

quantile(draws$sigma, probs = c(0.025, 0.975))
#>     2.5%    97.5%
#> 4.151513 7.199803
```

So a typical morning comes in about 5.4 cups off the prediction, and thirty rows pin that down only to somewhere between 4.2 and 7.2.

That number is the one to quote when someone asks how well the model predicts. The coefficients tell you what warmth and rain are worth on average. `sigma` tells you how much of a real morning neither of them explains, and on a forty cup morning five and a half cups is not nothing.

=== step === concept
## Rhat and ESS: did the sampler do its job?

The last three columns are a different kind of number. They say nothing about coffee. They tell you whether to believe the other columns at all.

```r-static
# Pull the coefficient block out of the summary on its own
round(summary(fit)$fixed, 2)
#>           Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> Intercept    16.86      3.73     9.46    24.34    1  3901.37  2621.84
#> temp_c        2.45      0.22     2.01     2.89    1  4160.61  2796.04
#> rain        -14.49      2.10   -18.54   -10.40    1  4272.21  2757.80
```

`Rhat` compares the four chains against each other. Four independent walks explored the same space, so if they agree, each chain's spread should look like the pooled spread of all of them. Rhat is the ratio between those two things, and when the chains have settled on the same answer it sits at 1.00. When one chain wandered somewhere the others never went, it climbs. Anything above about 1.01 means you should not read the row until you have fixed the fit.

`Bulk_ESS` and `Tail_ESS` count how many genuinely independent draws you are holding. Consecutive draws in a chain are correlated, because each step starts where the last one ended, so 4,000 draws are worth fewer than 4,000 independent ones. Bulk_ESS is the count that matters for the middle of the distribution, which is where `Estimate` comes from. Tail_ESS is the count for the edges, which is where the interval bounds come from. The usual advice is to want both above about 400.

Asha's fit reads 1.00 on every row, with both ESS columns in the thousands. The sampler did its job, so the numbers beside them are worth reading.

[WARNING]
A clean Rhat is not a good model. It only says the four chains agree on where the answer is. They will agree just as happily on the answer to a badly chosen model, so a sampler that converged and a model that fits are two separate questions, checked separately.

=== step === quiz
## Quick check: reading the summary rows

The `temp_c` row came back with Estimate 2.45, Est.Error 0.22, a 95% CI of 2.01 to 2.89, and Rhat 1.00. Which reading of it is right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- If Asha collected thirty more mornings and refitted, the new interval would cover the true slope 95% of the time. ::no
- The 0.22 is how far a single morning typically falls from the line, so most mornings land within about a quarter of a cup of the prediction. ::no
- There is a 95% probability that the true cups-per-degree sits between 2.01 and 2.89, given this data and this model. ::ok Yes. The interval bounds are the 2.5% and 97.5% points of the temp_c draws, so 95% of the plausible slopes fall inside it. That is a statement about the slope itself, which is exactly what a credible interval is allowed to say.
- Rhat of 1.00 means the model explains the mornings almost perfectly. ::no Three of these describe something else. The repeated-sampling wording belongs to a confidence interval, not this one. How far a morning falls from the line is sigma, which was 5.54, not the 0.22 in the Est.Error column. And Rhat only reports that the four chains agree on the answer, which says nothing about whether the model suits the data.

=== step === concept
## The probability that rain costs more than fifteen cups

Now for the thing the summary cannot print, which is the whole reason it is worth keeping 4,000 rows instead of three numbers.

Asha does not really want a coefficient. She wants to decide whether rain is worth doing something about, and that means a threshold. Say she reckons a loss of fifteen cups or more is bad enough to justify moving the cart under the station awning on wet mornings. How likely is that?

With the draws in hand, that is a counting job. Every row is one plausible answer, so the share of rows below minus 15 is the probability that rain costs more than fifteen cups.

```r
# How likely is rain to cost more than 10, 15 or 20 cups?
mean(draws$rain < -10)
#> [1] 0.985

mean(draws$rain < -15)
#> [1] 0.40775

mean(draws$rain < -20)
#> [1] 0.00375
```

Read those three straight off. Rain almost certainly costs Asha more than ten cups, at 98.5%. Whether it costs more than fifteen is close to a coin flip, at 41%. And it costs more than twenty in about 4 rows out of every 1,000, so she can stop worrying about that.

Look back at what the summary told her and what this tells her. The interval ruled out zero, which she could already see. This says the move to the awning is a genuine toss-up on the evidence she has, and that thirty more mornings of notes would be worth more to her than any amount of rereading these thirty.

[KEY INSIGHT]
Because a Bayesian fit hands back the whole spread rather than one estimate, any question you can ask about the parameter becomes arithmetic on a column. Count the rows that satisfy the condition, divide by 4,000, and that share is the probability. No new test, no new model.

=== step === concept
## The priors brms picked without asking you

Something quiet happened in that one line call. You never mentioned a prior, and yet the Stan program had prior lines in it. `prior_summary()` lays out what brms chose.

```r-static
# Show every prior in the fitted model, including the ones brms chose
prior_summary(fit)
#>                   prior     class   coef group resp dpar nlpar lb ub       source
#>                  (flat)         b                                         default
#>                  (flat)         b   rain                             (vectorized)
#>                  (flat)         b temp_c                             (vectorized)
#>  student_t(3, 48, 18.5) Intercept                                         default
#>   student_t(3, 0, 18.5)     sigma                               0         default
```

Read it by the `class` column. Class `b` is the slopes, and both of Asha's slopes got `(flat)`, which means brms expressed no opinion at all: before seeing the notebook, a rain effect of minus 14 and a rain effect of minus 14,000 were equally welcome. The data alone decided.

The intercept and sigma got real priors, both Student t with 3 degrees of freedom, which is a bell shape with heavy tails so an unexpected value is never ruled out. The intercept prior is centred at 48 with a scale of 18.5, and those two numbers are not arbitrary. 48 is the median of Asha's cups and 18.5 is their median absolute deviation. brms read them off the outcome column so the prior sits on the right scale whether you are counting cups or measuring kilometres.

That is what a weakly informative prior means. It rules out the absurd, an intercept of a million cups, a sigma of zero, and leaves everything reasonable on the table.

[NOTE]
Defaults chosen for you are still choices, and it is your name on the analysis. `prior_summary()` on a fresh fit takes two seconds and tells you exactly what you agreed to.

=== step === concept
## What a tight prior does to thirty rows

A prior is not decoration on the front of a model. It is a claim about which answers were plausible before the data arrived, and it competes with the data for the final say.

Watch what happens if you set a narrow one. The block below refits Asha's model with a normal prior on the two slopes, centred at zero, at four different widths. It starts wide and gets tighter each time.

There is a loop inside it, and the loop is the honest part. Pulling the rain slope toward zero leaves bigger leftovers, bigger leftovers mean a larger `sigma`, and a larger `sigma` lets the prior pull harder still. So it refits, recomputes the spread, and goes round fifty times, by which point neither of them is moving.

```r
# Refit under four prior widths and watch the rain slope get pulled in
X <- model.matrix(fit_lm)
y <- cart$cups

refit <- function(prior_sd) {
  spread <- summary(fit_lm)$sigma^2
  for (i in 1:50) {
    penalty <- diag(c(0, spread / prior_sd^2, spread / prior_sd^2))   # slopes only
    beta    <- solve(crossprod(X) + penalty, crossprod(X, y))
    spread  <- sum((y - X %*% beta)^2) / nrow(cart)
  }
  c(temp_c = beta[2], rain = beta[3])
}

widths <- c(100, 5, 1, 0.5)
data.frame(prior_sd = widths, round(t(sapply(widths, refit)), 2))
#>   prior_sd temp_c   rain
#> 1    100.0   2.45 -14.48
#> 2      5.0   2.48 -12.65
#> 3      1.0   2.48  -1.44
#> 4      0.5   1.75  -0.30
```

Follow the rain column down. At a prior width of 100 the prior is so vague it does nothing, and the answer is the flat-prior answer, minus 14.48. At a width of 5 it gives a little, minus 12.65. At a width of 1 the rain effect all but disappears, minus 1.44. At 0.5 it is gone, minus 0.30.

Run the real thing in brms and it agrees.

```r-static
# Refit with a deliberately tight prior on the slopes
fit_tight <- brm(cups ~ temp_c + rain,
                 data  = cart,
                 prior = prior(normal(0, 1), class = "b"),
                 chains = 4, iter = 2000, seed = 6)

fixef(fit_tight)
#>            Estimate Est.Error      Q2.5     Q97.5
#> Intercept 11.061463  5.182360  1.016162 21.330446
#> temp_c     2.429101  0.333224  1.742213  3.061364
#> rain      -1.337900  1.042072 -3.438022  0.636599
```

Nothing broke and no warning appeared. A `normal(0, 1)` prior on the slopes is a straight-faced claim that a rain effect of one cup is typical and an effect of fourteen is off the charts. Thirty mornings are not enough to argue that down, so the prior won, and the fit now says rain costs Asha about one cup with an interval that comfortably includes zero.

Notice the temperature slope barely moved while the rain slope collapsed. Temperature ranges over nearly fifteen degrees across the notebook, so that column has a lot to say and pushes back hard. Rain is a yes or no flag on fourteen mornings, so it has less to say and the prior overrules it easily.

[WARNING]
A prior that is too tight does not announce itself. The chains converge, Rhat reads 1.00, the summary prints beautifully, and the answer is the prior's answer rather than the data's. If you set a prior, check it means what you think by asking whether the value you actually expect is comfortably inside it.

=== step === quiz
## Quick check: what is a tight prior claiming?

Someone hands you a brms fit of Asha's mornings with `prior = prior(normal(0, 1), class = "b")` and says it is more careful than the default. What has that prior actually claimed?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- That the slopes are exactly zero, so brms will ignore whatever the notebook says. ::no
- That the interval should come out narrower, which makes the fit more precise and therefore better. ::no
- That before seeing any data, slopes of about a cup were normal and a fourteen cup effect was extraordinary, and with only thirty mornings that claim outvotes the data. ::ok Exactly. A prior is a claim about which answers were plausible beforehand, and the less a column has to say, the more that claim decides. The rain slope came back at minus 1.34, not because the mornings said so, but because the prior did.
- That only the intercept and sigma are affected, since class b priors do not touch the slopes. ::no A prior is a claim about plausible values, not a switch. It does not force the slope to zero and it does not skip the slopes: class b is the slopes, which is precisely why rain fell from minus 14.5 to minus 1.3. And a narrower interval is not a better fit, it is a more confident one, which is worth nothing if the confidence came from you rather than the data.

=== step === concept
## Does the fitted model look like Asha's data?

Fitting is the easy half. The half people skip is asking whether the model that came back could plausibly have produced the mornings you fed it.

There is a direct way to ask. The fit is a recipe for generating mornings, so use it: pick a row of draws, generate a fresh set of thirty mornings from it, and compare that fake set with the real one. Do it many times. If the real data looks like an ordinary member of the crowd, the model is telling a story the data fits inside. If it stands apart, something is wrong with the model, no matter how clean Rhat was.

That comparison is a posterior predictive check. Here is one on a different dataset, so you can see what a pass and a failure look like side by side. The statistic being compared is how many zeros a dataset contains, the grey pile is what the fitted model produces, and the red line is what really happened.

::widget ppc-overlay {}

On the normal fit the replicated sets average about eight zeros and almost never reach fifteen, so the red line lands far out in the tail and the p-value underneath is close to nothing. That is a failure you would never see from a coefficient table. Switch to the Poisson fit and the same red line drops into the middle of the crowd.

Now run the same idea on Asha's cart. Instead of one statistic we will compare the whole shape: the black line is the thirty real mornings, and each grey line is thirty mornings generated from one row of `draws`.

```r
# Simulate fifty fresh sets of thirty mornings from the fit and overlay the real ones
set.seed(13)
design <- model.matrix(cups ~ temp_c + rain, data = cart)
picks  <- sample(nrow(draws), 50)

plot(density(cart$cups), lwd = 3, ylim = c(0, 0.035),
     main = "Thirty real mornings against fifty simulated sets",
     xlab = "cups sold")

for (i in picks) {
  mu       <- design %*% as.numeric(draws[i, 1:3])
  rep_cups <- rnorm(30, mu, draws$sigma[i])
  lines(density(rep_cups), col = "grey75")
}

lines(density(cart$cups), lwd = 3)
```

The black line stays inside the grey band the whole way across. It sits a little flatter at the peak than most of the simulated sets and carries a small shoulder up near 65 cups, which is about what thirty rows of a real notebook look like. Nothing here says the model is wrong.

In brms you get that plot in one line, with the same reading.

```r-static
# The same check, straight from the fitted model
pp_check(fit, ndraws = 50)
```

[TIP]
Run `pp_check()` on every fit before you quote a number from it. It costs one line and it is the only step that asks whether the model resembles reality, rather than whether the sampler behaved.

=== step === tryit
## Your turn: predict one cold rainy morning

Asha wants a number for tomorrow. The forecast says 8 degrees and wet, and she needs to know how many cups to prepare for.

A prediction from this fit is not a number, it is a spread, and you build it the same way you built everything else. For each row of `draws`, work out the line's prediction at 8 degrees with rain, then add one morning's worth of noise using that row's own `sigma`.

```r
# draws holds Intercept, temp_c, rain and sigma for 4,000 plausible fits.
# Build the spread of cups for one 8 degree rainy morning: for every row,
# take Intercept + 8 * temp_c + rain, then scatter it with that row's sigma.
# Then read its mean and its 95% interval.
# Press Check when you have it.
```
::check {"regex": "8\\s*[*]\\s*draws\\$temp_c", "gate": true, "difficulty": "intermediate", "ok": "Right: about 22 cups on average, with a 95% interval from 10.6 to 33.6. Asha should prepare for roughly 22 and not be surprised by 12 or by 32, because a single morning carries the coefficient uncertainty and a whole sigma of noise on top.", "no": "Two pieces. The line at 8 degrees with rain is draws$Intercept + 8 * draws$temp_c + draws$rain. Wrap that in rnorm(4000, ..., draws$sigma) to add one morning of noise, then take mean() and quantile()."}
::solution
```r
# Build the predicted spread for one 8 degree rainy morning, then read it
set.seed(12)
cold_wet <- rnorm(4000,
                  draws$Intercept + 8 * draws$temp_c + draws$rain,
                  draws$sigma)

mean(cold_wet)
#> [1] 22.00025

quantile(cold_wet, probs = c(0.025, 0.975))
#>     2.5%    97.5%
#> 10.57831 33.58860
```

That interval is far wider than the one on the rain coefficient, and it should be. The coefficient interval asks where the average effect sits. This one asks what a single unrepeatable morning will do, so it carries the coefficient uncertainty and a full sigma of morning to morning noise on top.

=== step === concept
## The same formula with a different family

Everything so far has assumed cups are a number scattered around a line. Plenty of questions Asha might ask are not shaped like that, and the useful thing about brms is how little changes when they are not.

Suppose she wants to model whether she sold out, a yes or no. The outcome is now 0 or 1, and a straight line is the wrong shape for it. One argument moves.

```r-static
# Model a yes or no outcome: did the cart sell out that morning?
cart$sold_out <- as.integer(cart$cups > 55)

fit_binary <- brm(sold_out ~ temp_c + rain,
                  data   = cart,
                  family = bernoulli(),
                  chains = 4, iter = 2000, seed = 6)
```

Or suppose she counts something that cannot go negative and clusters at small numbers, say how many customers asked for oat milk. Give the notebook an `oat_requests` column holding that count, and one argument moves again.

```r-static
# Model a count that cannot go below zero
fit_count <- brm(oat_requests ~ temp_c + rain,
                 data   = cart,
                 family = poisson(),
                 chains = 4, iter = 2000, seed = 6)
```

The formula never moved. The data never moved. `family` moved, and brms rewrote the Stan program underneath to match: a different likelihood, a different link between the line and the outcome, different default priors on the right scale.

What you read afterwards is the same summary with the same columns, so everything you have learned to read here still applies. The one thing that changes is the units of the coefficients, because a bernoulli fit reports on the log-odds scale rather than in cups.

=== step === quiz
## Quick check: which numbers decide whether to trust this fit?

A colleague sends you a brms fit and says it is solid: Rhat is 1.00 on every row and both ESS columns are in the thousands. What does that entitle you to conclude?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- That the model describes the data well, since the four chains all agree on the answer. ::no
- Only that the sampler did its job. Whether the model resembles the data is a separate question, answered by generating fresh data from the fit and comparing it with the real thing. ::ok Exactly right. Rhat and ESS audit the machinery, and a posterior predictive check audits the model. A wrongly chosen family converges just as cleanly as a right one, which is why the second check is not optional.
- Nothing, because Rhat and ESS come out near those values on every fit regardless. ::no
- That the credible intervals are correct, so nothing further needs checking. ::no Rhat and ESS are real diagnostics and they do fail: a badly mixing chain pushes Rhat above 1.01 and drags ESS into the dozens. What they cannot do is judge the model, because they only ever compare the chains against each other. A wrongly chosen family converges just as cleanly as a right one, so the intervals are worth reading only once both questions have been answered, the sampler one and the does-it-fit one.

=== step === tryit
## Your turn: how many more cups on a five degree warmer morning?

Asha is looking at the week ahead. Warmer weather is coming and she wants to know what a five degree lift is worth, with the uncertainty attached rather than stripped off.

Each row of `draws` holds one plausible cups-per-degree, so each row also holds one plausible answer to her question. Build the spread of the five degree gain, report its mean and 95% interval, then answer the decision question: how likely is the gain to beat twelve cups?

```r
# Each row of draws$temp_c is one plausible cups-per-degree.
# Build the spread of the gain from five extra degrees, then report
# its mean, its 95% interval, and the probability it beats 12 cups.
# Three lines. Press Check when you have them.
```
::check {"regex": "5\\s*[*]\\s*draws\\$temp_c", "gate": true, "difficulty": "intermediate", "ok": "That is it: a mean gain of 12.24 cups, a 95% interval from 10.0 to 14.4, and a 59% chance the gain beats twelve. Worth planning for, but not worth promising anyone.", "no": "Start with gain <- 5 * draws$temp_c, which gives you 4,000 plausible gains. Then mean(gain), quantile(gain, probs = c(0.025, 0.975)), and mean(gain > 12) for the probability."}
::solution
```r
# Turn each plausible slope into a five degree gain, then summarise it
gain <- 5 * draws$temp_c

mean(gain)
#> [1] 12.24061

quantile(gain, probs = c(0.025, 0.975))
#>      2.5%     97.5%
#>  9.995616 14.429432

mean(gain > 12)
#> [1] 0.59425
```

Multiplying a whole column by 5 carried the uncertainty through the arithmetic untouched, which is the habit worth keeping. Summarise last, always, because once you collapse the draws to a single number the uncertainty is gone and you cannot get it back.

=== step === quiz
## Quick check: a colleague's brms output, read cold

A colleague fits `spend ~ ads` in brms and sends one row of the summary: Estimate 3.10, Est.Error 2.60, l-95% CI minus 2.00, u-95% CI 8.20, Rhat 1.00. Their note says "we set no priors, so this is purely the data speaking, and the effect is 3.10". What is the right response?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- The interval crosses zero, so the effect is zero and the campaign did nothing. ::no
- Rhat is 1.00, so the fit is sound and 3.10 can be reported as the answer. ::no
- With no priors set, the fit is really a frequentist one, so the interval is a confidence interval. ::no Every one of these misses something. An interval that crosses zero does not prove the effect is zero, it says the data cannot tell a loss from a gain. Rhat only reports that the chains agree, not that the model fits. And a brms fit is Bayesian whether or not you set priors, so that interval is a credible interval and the defaults brms filled in are still there.
- The interval runs from a small loss to a large gain, so the data has not settled the question. And setting no priors is not the same as adding nothing, because brms filled in defaults that are worth checking. ::ok Both halves matter. An interval from minus 2.00 to 8.20 means the plausible answers include losing money and making a lot, which is a finding in itself: this data cannot decide. And prior_summary() on that fit would show what brms chose, which is a flat prior on the slope and priors read off the outcome for the intercept and sigma.

=== step === concept
## References

- [brms: An R Package for Bayesian Multilevel Models Using Stan](https://doi.org/10.18637/jss.v080.i01) - Burkner (2017), Journal of Statistical Software 80(1), 1-28. The package paper, including how a formula becomes a Stan program.
- [Advanced Bayesian Multilevel Modeling with the R Package brms](https://doi.org/10.32614/RJ-2018-017) - Burkner (2018), The R Journal 10(1), 395-411. Families, distributional models and non-linear models.
- [Rank-normalization, folding, and localization: an improved Rhat for assessing convergence of MCMC](https://doi.org/10.1214/20-BA1221) - Vehtari, Gelman, Simpson, Carpenter and Burkner (2021), Bayesian Analysis 16(2), 667-718. The source of Rhat, Bulk_ESS and Tail_ESS.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society A 182(2), 389-402. Posterior predictive checks and what `pp_check()` draws.
- [Prior Definitions for brms Models](https://paulbuerkner.com/brms/reference/set_prior.html) - the reference page for `set_prior()` and `prior()`, including the rules behind the defaults.

=== step === complete
## Quick recap

Asha's thirty mornings went in as a formula and came back as a full posterior, and you read every line of it. To pull it together:

- `brm()` takes the same formula `lm()` takes. `data`, `family`, `chains`, `iter` and `seed` are the settings around it, and brms writes and compiles the Stan program itself.
- What comes back is a table of 4,000 plausible parameter sets, not a point estimate. `Estimate` is a column mean, `Est.Error` a column standard deviation, and the two CI columns are the 2.5% and 97.5% quantiles.
- `sigma` is printed apart because it is not a coefficient. It says how far one morning falls from the line, about 5.4 cups here.
- `Rhat` and the two ESS columns audit the sampler, not the model. A posterior predictive check is what audits the model.
- Holding the draws lets you ask questions no summary row answers, by counting rows and dividing.

And the answer Asha wanted: rain costs her about 14.5 cups on a morning of the same temperature, somewhere between 10.4 and 18.5, with a 41% chance the true cost is worse than fifteen cups.

Next time you would have reached for `lm()`, write the identical formula into `brm()` instead, and read what comes back the way you read Asha's.

Congratulations, and enjoy the coffee.
