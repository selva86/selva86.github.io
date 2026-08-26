---
title: "Credible vs confidence intervals: the difference that matters"
slug: "Bayesian-Mini-4"
description: "Build a confidence interval and a credible interval on the same twenty delivery times, watch where they split, and learn the sentence each one lets you say."
keywords: "credible interval vs confidence interval, credible interval in R, confidence interval meaning, Bayesian credible interval, posterior interval, 95% credible interval, interval interpretation"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "4"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-3"
course_next: ""
curriculum_id: "0.0.35"
lesson_access: "windowed"
catalog_blurb: "Which interval lets you state a probability, and which one cannot."
---

=== step === cover
::eyebrow Bayesian Decisions
## Credible vs confidence intervals: the difference that matters

Mario runs a pizza place two streets over, and his menu page carries a promise: your order arrives in 22 to 30 minutes.

Those two numbers are not a guess. He kept a log of his last twenty deliveries, handed the times to R, and asked for a 95% interval for his true average delivery time. R came back with 21.98 to 30.02, and he rounded it for the menu.

Now, here is the sentence almost everybody says next: there is a 95% chance Mario's true average sits between those two numbers.

The problem is that the interval R handed him does not allow that sentence.

There is another interval that does allow it, plainly and with no hedging, and it is called a credible interval. On the same twenty deliveries it comes back as 22.23 to 29.77. Those are almost the same two numbers, and a completely different promise.

So we are going to build both of them by hand, out of those same twenty times, and find out exactly which sentence each one lets you say.

::widget process-flow {"steps":[{"title":"Take the classical interval","sub":"ask R for the 95% confidence interval on the twenty times"},{"title":"Build the posterior by hand","sub":"score every candidate average, then read the middle 95% off it"},{"title":"Read what each one permits","sub":"the single sentence each interval entitles you to say"}]}

That is the whole plan. Everything from here is doing it.

=== step === concept
## The twenty deliveries behind the 22 to 30 on the menu

Let's get the twenty times on the table first, because every number we compute from here comes out of them.

Mario records the minutes from the moment an order is placed to the moment it reaches the door. Here they are, sorted, from his quickest delivery to his slowest.

Press Run.

```r
# The last twenty delivery times, and what they average
deliveries <- c(13, 15, 15, 16, 20, 21, 22, 24, 24, 25, 25, 27, 27, 28,
                32, 33, 33, 33, 42, 45)

n <- length(deliveries)
round(c(orders = n, average = mean(deliveries), spread = sd(deliveries),
        std_error = sd(deliveries) / sqrt(n)), 2)
#>    orders   average    spread std_error
#>     20.00     26.00      8.60      1.92
```

Twenty orders came in, averaging 26.0 minutes and scattering about 8.60 minutes around that average. The last number is the standard error, 1.92 minutes, and it says how much the average of twenty orders like these would move if Mario logged another twenty.

That 26.0 is the average of the twenty orders he happened to log, and it is not quite the number we are after. Every interval in this lesson is chasing Mario's true average: the figure his delivery times would settle on over thousands of orders, which nobody ever gets to see directly. These twenty times are all the evidence we have about where it sits.

The interval on his menu comes out of a single line.

```r
# The classical 95% confidence interval for Mario's true average
t.test(deliveries)
#>
#> 	One Sample t-test
#>
#> data:  deliveries
#> t = 13.526, df = 19, p-value = 3.344e-11
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  21.97685 30.02315
#> sample estimates:
#> mean of x
#>        26
```

The line to read is the one under `95 percent confidence interval`: 21.98 to 30.02 minutes. The p-value above it is testing whether Mario's true average is zero, which is not a worry any pizza shop has, so leave it alone.

Underneath, that interval is just the average give or take 2.093 standard errors, which works out at 26.0 give or take 4.02 minutes. That 2.093 is the t multiplier for the 19 degrees of freedom R printed above, and it is what makes the interval come out at 95% rather than at some other percentage. The whole question in front of us is what that 95 is promising.

=== step === concept
## What the 95% in a confidence interval is counting

The 95% is a promise about the recipe, not about the two numbers the recipe handed back this time.

Stated carefully, the promise goes like this. Suppose Mario's true average really is 26 minutes. Log twenty fresh deliveries, run that same line, get an interval. Do it again and again. About 95 out of every 100 of those intervals will contain 26.

That is checkable, so let's check it. We build a world where we know the truth, because we set it ourselves, and then we count.

```r
# Rerun the whole evening 2,000 times and count how often the interval catches 26
set.seed(2026)
true_average <- 26

caught <- replicate(2000, {
  fresh_evening <- rnorm(20, mean = true_average, sd = 8.6)
  ci <- t.test(fresh_evening)$conf.int
  true_average >= ci[1] && true_average <= ci[2]
})

mean(caught)
#> [1] 0.948
```

`rnorm(20, mean = 26, sd = 8.6)` invents twenty fresh delivery times from a world whose true average is exactly 26 minutes. For each of those 2,000 evenings we build the interval Mario built and ask one question: did it contain 26? The answer was yes 94.8% of the time.

So the recipe does what it says. Now watch it happen one interval at a time.

```r
# Draw 100 of those intervals and mark the ones that miss the true 26
set.seed(3)
many <- replicate(100, t.test(rnorm(20, mean = 26, sd = 8.6))$conf.int)
hit  <- many[1, ] <= 26 & many[2, ] >= 26

sum(hit)
#> [1] 96

plot(NULL, xlim = range(many), ylim = c(1, 100),
     xlab = "Minutes", ylab = "Rerun number",
     main = "100 reruns, 100 confidence intervals")
segments(many[1, ], 1:100, many[2, ], 1:100,
         col = ifelse(hit, "grey70", "orangered"), lwd = 2)
abline(v = 26, lwd = 3)
```

Every horizontal bar is one rerun's interval. The thick vertical line is the truth, 26 minutes. Ninety-six of the bars cross it. Four of them, drawn in orange, sit entirely to one side and miss it.

That plot is the whole meaning of 95% confidence. Cast the net this way and about 95 nets in 100 come back with the fish in them.

=== step === concept
## Why a confidence interval cannot give you a probability
::prose-only the point is what the hundred plotted intervals do not permit, and that picture is already on the page

Look again at what we just counted. We counted bars. The truth stayed put at 26 minutes the entire time, and the bars were the things that moved.

That is the classical setup in one sentence: the true average is a fixed number we happen not to know, and the interval is the random thing.

And that is exactly why the sentence people want is not available. Once Mario has his one interval, 21.98 to 30.02, nothing random is left in the room. His true average is a fixed number. It is either inside that range or it is outside it. There is no coin still in the air to put a probability on.

Ask what the probability is that the truth lies in 21.98 to 30.02, and the honest classical answer is that it is 1 or it is 0, and we do not know which.

The 95% was spent earlier, on the recipe, before anyone saw any data. It bought a method that works 95 times in 100. It did not buy a probability for the run you actually got.

That is a genuine limitation and not a technicality, and it is the reason a second kind of interval exists: one that keeps the probability instead of spending it.

=== step === quiz
## Quick check: what does the 95% attach to?

Mario's twenty deliveries gave a 95% confidence interval of 21.98 to 30.02 minutes. Which sentence is that 95% actually making?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- There is a 95% chance Mario's true average lies between 21.98 and 30.02 minutes. ::no
- The interval covers 95% of Mario's future delivery times. ::no
- If Mario logged twenty fresh deliveries and rebuilt the interval over and over, about 95% of those intervals would contain his true average. ::ok That is the one. The 95% is a hit rate for the method across reruns, which is precisely what the hundred bars showed you.
- 95% of the twenty deliveries he already logged fall inside the interval. ::no All three wrong answers pin the 95% on something sitting right in front of you: this one interval, these twenty times, or tomorrow's pizza. It belongs to none of them. It belongs to the recipe, measured across reruns nobody ever actually does. Ninety-six of the hundred bars caught the truth, and not one of those bars carried a probability of its own.

=== step === concept
## Treating the unknown average as a distribution

We want a probability statement about Mario's true average. To get one, something has to change, and it is not the arithmetic. It is which thing we treat as random.

The classical view held the average fixed and let the interval wobble. So flip it around. Hold the twenty delivery times fixed, because they genuinely are fixed and Mario wrote them down, and let the unknown average be the thing we spread a probability over.

That flip sounds exotic until you notice you already do it. When you say "he is probably running around 26 minutes, could be 24, almost certainly not 40", that sentence is a distribution over candidate averages. We are simply going to compute it instead of feeling it.

It takes three moves.

1. Line up every candidate average worth considering: 10 minutes, 10.01, 10.02, all the way up to 45.
2. Score each candidate by how well it explains the twenty times Mario logged. That score is called the **likelihood**.
3. Multiply each score by whatever you believed before the data arrived. That belief is called the **prior**.

The product is the **posterior**: what you believe about the average now that you have seen the deliveries.

\[ \text{posterior}(\mu) \;\propto\; \text{likelihood}(\mu) \times \text{prior}(\mu) \]

The symbol in the middle is "proportional to". It says the thing on the left has the same shape as the product on the right, up to a constant, and we pin that constant down at the end by making the whole curve add up to 1.

Two practical notes before the code runs. The likelihood has to know the spread of delivery times as well as the candidate average, and we hold that spread fixed at what Mario's own log shows, `sd(deliveries)`, which is 8.596 minutes. The prior here is flat: every candidate from 10 to 45 starts out equally plausible, which is as close to having no opinion as you can get.

```r
# Score every candidate average by how well it explains the twenty deliveries
spread <- sd(deliveries)
grid   <- seq(10, 45, by = 0.01)

loglik <- sapply(grid, function(m) sum(dnorm(deliveries, mean = m, sd = spread, log = TRUE)))
lik    <- exp(loglik - max(loglik))

prior_flat <- rep(1, length(grid))
post_flat  <- lik * prior_flat
post_flat  <- post_flat / sum(post_flat)

round(c(spread = spread,
        best_average = grid[which.max(post_flat)],
        total_area = sum(post_flat)), 3)
#>       spread best_average   total_area
#>        8.596       26.000        1.000
```

Four lines are doing the real work, so here is what each one means.

- `dnorm(deliveries, mean = m, sd = spread, log = TRUE)` asks, for one candidate average `m`, how plausible each of the twenty times was. Adding the logs and exponentiating afterwards is the safe way to multiply twenty small numbers without them collapsing to zero.
- `exp(loglik - max(loglik))` subtracts the best score before exponentiating. That keeps every number in a sane range and does not change the shape one bit.
- `rep(1, length(grid))` is the flat prior. A 1 for every candidate, so nobody gets a head start.
- Dividing by the sum turns raw scores into a proper probability distribution, which is why `total_area` comes back as exactly 1.000.

The best scoring candidate is 26.000 minutes, which is Mario's sample average. With a flat prior that is exactly what you would expect, because with no prior opinion pulling on anything, the data decides on its own.

But the single best candidate is not the prize here. The whole curve is. A curve has area, and area is probability.

=== step === concept
## How to read a 95% credible interval off the posterior

We now have a probability distribution laid out over every candidate average, and pulling an interval out of it takes no theory at all.

Walk along the curve from the left, adding up the probability as you go. Stop when 2.5% of the total area is behind you and mark the spot. Keep walking until 97.5% is behind you and mark that spot too. Those two marks are the interval, and by construction 95% of the area sits between them.

`cumsum()` does the walking.

```r
# Walk the posterior to the 2.5% and 97.5% marks and read off the two cuts
credible <- function(post, level = 0.95) {
  lower_tail <- (1 - level) / 2
  running    <- cumsum(post)
  c(grid[which.max(running >= lower_tail)],
    grid[which.max(running >= 1 - lower_tail)])
}

ci_credible <- credible(post_flat)
round(ci_credible, 2)
#> [1] 22.23 29.77
```

`cumsum(post)` is the running total of area from the left end of the grid. `which.max(running >= 0.025)` finds the first position where that running total reaches 2.5%, and the same trick at 97.5% finds the other end. Then `grid[...]` reads off the minutes at each stopping point.

Here is the curve with that middle 95% filled in.

```r
# Draw the posterior with its middle 95% shaded and both cuts marked
plot(grid, post_flat, type = "l", lwd = 2, xlim = c(15, 37),
     xlab = "Candidate average delivery time (minutes)", ylab = "Posterior",
     main = "The middle 95% of the posterior")
inside <- grid >= ci_credible[1] & grid <= ci_credible[2]
polygon(c(ci_credible[1], grid[inside], ci_credible[2]),
        c(0, post_flat[inside], 0), col = "grey85", border = NA)
lines(grid, post_flat, lwd = 2)
abline(v = ci_credible, lty = 2, lwd = 2)
```

The shaded region holds 95% of the curve's area, and the two dashed lines are where it stops: 22.23 minutes and 29.77 minutes. That is a 95% credible interval for Mario's true average, and here is the sentence it lets you say, in full.

Given these twenty deliveries and a flat prior, there is a 95% probability that Mario's true average delivery time lies between 22.23 and 29.77 minutes.

[KEY INSIGHT]
Read that against the confidence interval's sentence and the difference is the direction of the probability. The credible interval puts it on the unknown average, which is the thing you wanted to know about all along. It can do that because the posterior is an honest probability distribution over averages, and 95% of its area is inside those two cuts.

One footnote on the arithmetic, so nothing surprises you later. We chopped the range into cells 0.01 minutes wide, so a printed cut can land one cell away from the exact answer. That is the grid rounding, not a difference in method.

=== step === quiz
## Quick check: which sentence does the credible interval permit?

The credible interval on Mario's twenty deliveries runs from 22.23 to 29.77 minutes. Which write-up of it is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Ninety-five percent of Mario's deliveries take between 22.23 and 29.77 minutes. ::no
- Given these twenty deliveries and a flat prior, there is a 95% probability that Mario's true average is between 22.23 and 29.77 minutes. ::ok Exactly. The probability sits on the average itself, the given is stated out loud, and that is the whole reason anyone builds one of these.
- If Mario logged twenty fresh deliveries many times over, 95% of the intervals built this way would contain his true average. ::no Two of the wrong answers belong to other objects entirely: one talks about single pizzas rather than about the average, and one recites the confidence interval's repeat-the-experiment promise. The last one throws the uncertainty away completely. A credible interval is a probability about the unknown average, conditional on the data and the prior you fed it, and it says so out loud.
- Mario's true average is definitely inside 22.23 to 29.77 minutes. ::no

=== step === concept
## The two intervals on one axis

We now have two intervals out of the same twenty deliveries. Put them side by side and see how little the arithmetic actually disagrees.

```r
# Put the confidence interval and the credible interval on one minutes axis
ci_conf <- as.numeric(t.test(deliveries)$conf.int)

both <- rbind(confidence = ci_conf, credible = ci_credible)
colnames(both) <- c("lower", "upper")
round(both, 2)
#>            lower upper
#> confidence 21.98 30.02
#> credible   22.23 29.77

plot(NULL, xlim = c(20, 32), ylim = c(0.5, 2.5), yaxt = "n",
     xlab = "Minutes", ylab = "",
     main = "Same data, nearly the same numbers, two different sentences")
axis(2, at = c(2, 1), labels = c("confidence", "credible"), las = 1)
segments(ci_conf[1], 2, ci_conf[2], 2, lwd = 6, col = "grey60")
segments(ci_credible[1], 1, ci_credible[2], 1, lwd = 6, col = "steelblue")
```

They sit a quarter of a minute apart at one end and a quarter at the other. Print either one on the menu and no customer alive would spot the difference.

That closeness is not luck, and the reason is worth knowing. With twenty data points and a prior that says nothing, the data is doing all of the work in both calculations, so both land in the same place. The credible interval comes out very slightly narrower, 7.54 minutes wide against 8.05, because `t.test()` pays a small premium for estimating the spread from the same twenty numbers it is averaging, while our posterior held that spread fixed at 8.596.

So the argument between these two is not an argument about numbers. It is an argument about sentences.

=== step === concept
## The chance Mario's true average beats the thirty minute promise

Mario advertises thirty minutes or the pizza is free, so there is one question he actually cares about: what are the odds his true average is under thirty?

A confidence interval cannot answer it, and no bigger sample or extra decimal place will change that, because it never had a probability to give away.

The posterior answers it in one line, because the answer is just area.

```r
# The probability that Mario's true average beats the thirty minute promise
sum(post_flat[grid < 30])
#> [1] 0.9811629

plot(grid, post_flat, type = "l", lwd = 2, xlim = c(15, 37),
     xlab = "Candidate average delivery time (minutes)", ylab = "Posterior",
     main = "The area below 30 minutes")
under <- grid < 30
polygon(c(min(grid), grid[under], 30), c(0, post_flat[under], 0),
        col = "grey85", border = NA)
lines(grid, post_flat, lwd = 2)
abline(v = 30, lwd = 3, col = "orangered")
```

`grid < 30` picks out every candidate average below thirty minutes, and adding up their posterior probability gives the shaded area to the left of the red line. It comes to 0.981.

Say it out loud: given these twenty deliveries, there is a 98.1% probability that Mario's true average delivery time is under thirty minutes. That leaves 1.9% on the other side, which is the chance the promise printed on his menu is one he cannot keep on average.

That is the payoff of everything we built. You get a direct answer to a direct question, in the units the question was asked in, out of the same twenty times that produced the confidence interval.

[KEY INSIGHT]
Any question you can phrase as an area under the posterior has a one line answer: the chance the average beats 30, the chance it sits between 24 and 28, the chance it is worse than a rival down the road. A confidence interval has no area to add up, so it has none of these answers.

=== step === tryit
## Your turn: what are the odds Mario beats a 25-minute rival?

A new place opens across the street advertising a 25 minute average, and Mario wants to know his real chances of being genuinely faster.

`post_flat` and `grid` are both still in memory. One line does it.

```r
# post_flat holds the posterior probability of every candidate average in grid.
# The chance Mario is truly faster than 25 minutes is the area below 25.
# One line. Press Check when you have it.
```
::check {"regex": "post_flat\\[\\s*grid\\s*<=?\\s*25", "gate": true, "difficulty": "beginner", "ok": "It comes to 0.30. So on the strength of twenty deliveries, Mario has roughly a 30% chance of genuinely being the faster shop, which is honest and not especially comforting.", "no": "Same shape as the thirty minute question with the number moved: sum(post_flat[grid < 25])."}
::solution
```r
# The probability that Mario's true average is under 25 minutes
sum(post_flat[grid < 25])
#> [1] 0.3005403
```

The answer is nowhere near 50%, even though 25 minutes sits close to his 26 minute sample average. A posterior this wide leaves a great deal of room on both sides.

=== step === widget
## What the prior does to the posterior

The flat prior we have been using says nothing on purpose. Real priors often say something, and it is worth seeing what that does before we try it on Mario.

Drag the sliders below. The grey curve is the prior, your belief before any data. The second curve is the likelihood, what the data alone says. The filled curve is the posterior, the two multiplied together.

::widget bayes-update {}

Three things to try, in this order.

1. Move the prior mean away from the data average. The posterior does not jump to either one. It settles between them, closer to whichever of the two is more confident.
2. Drag the prior confidence slider. The number sitting beside it is the prior's own spread, so a small value is a narrow, firm prior that holds the posterior close to itself, and a large value is a wide, vague one that lets the data take over.
3. Raise the data points slider and keep raising it. Past about sixty observations the posterior sits almost exactly on the data, whatever the prior was saying.

The widget's axis is deliberately generic, so translate its three numbers back into Mario's minutes. The prior mean is what you believed his average was before you opened the log. The data average is the 26.0 minutes his twenty deliveries actually show. The posterior mean is where belief and evidence settle together.

Prior confidence can be read in orders too. A normal prior on the average is worth a specific number of observations: take the spread of the deliveries, square it, and divide by the square of the prior's own spread. A prior with a spread of 2.5 minutes, set against deliveries that scatter by 8.596, is carrying about 12 orders' worth of weight.

[KEY INSIGHT]
The prior loses to data, and it loses quickly. That is the honest version of the usual worry about priors: they matter most exactly when you have too little data to argue with them, and they fade to almost nothing once the orders pile up.

=== step === concept
## Where the two answers split: a prior that knows something

Now let's give Mario's posterior something to know.

The delivery app publishes averages for shops of his size across the city, and they come in around 31 minutes. That is real information, gathered from hundreds of restaurants, and it exists whether or not Mario ever logs a single order.

We write it down as a normal prior centred on 31 minutes with a spread of 2.5 minutes. By the weighing we just did, 8.596 squared over 2.5 squared is about 12, so this prior walks in carrying roughly 12 orders' worth of weight against Mario's 20 real ones. That is enough to be heard and not enough to shout.

Everything else stays exactly as it was. The twenty deliveries are the same, the likelihood is the same, and only one line changes.

```r
# Rebuild the posterior with the delivery app's city wide 31 minutes as the prior
prior_city <- dnorm(grid, mean = 31, sd = 2.5)
post_city  <- lik * prior_city
post_city  <- post_city / sum(post_city)

priors <- rbind(flat_prior = ci_credible, city_prior = credible(post_city))
colnames(priors) <- c("lower", "upper")
round(priors, 2)
#>            lower upper
#> flat_prior 22.23 29.77
#> city_prior 24.87 30.84

plot(grid, post_flat, type = "l", lwd = 2, xlim = c(18, 38),
     xlab = "Candidate average delivery time (minutes)", ylab = "Posterior",
     main = "Flat prior against the city wide prior")
lines(grid, post_city, lwd = 2, col = "steelblue")
lines(grid, prior_city / sum(prior_city), lwd = 2, lty = 3, col = "grey50")
legend("topright", c("flat prior", "city prior", "the city prior itself"),
       lwd = 2, lty = c(1, 1, 3), col = c("black", "steelblue", "grey50"), bty = "n")
```

The interval moved. It slid up, from 22.23 to 29.77 out to 24.87 to 30.84, because the city data says shops like Mario's usually run slower than his twenty orders suggest. The lower end travelled furthest, a full 2.64 minutes against the upper end's 1.07, so the range came out narrower as well as later.

Here is the part worth stopping on. The confidence interval did not move, and could not have. It is still 21.98 to 30.02. There is no slot in `t.test()` where the city average goes.

That is the real practical difference between the two, and it cuts in both directions.

- The credible interval can take in outside knowledge, and it will change your answer when you feed it some.
- That means two analysts with the same data and different priors will report different intervals, and both of them are right given what each one assumed.
- So a credible interval is only as defensible as the prior behind it, and the prior belongs in writing, where colleagues can argue with it.

Notice what did not change: the sentence. It still reads "given this data and this prior, a 95% probability". The prior simply became part of the given.

=== step === concept
## Where they split hardest: three deliveries

The two intervals agreed on twenty orders and drifted apart when the prior spoke up. Now starve them both.

Suppose Mario had only ever logged three deliveries.

```r
# Take three of the twenty deliveries and build the classical interval on them
set.seed(5)
three <- sample(deliveries, 3)

round(c(one = three[1], two = three[2], three = three[3],
        average = mean(three), spread = sd(three)), 2)
#>     one     two   three average  spread
#>   15.00   25.00   32.00   24.00    8.54

ci_conf_three <- as.numeric(t.test(three)$conf.int)
round(ci_conf_three, 2)
#> [1]  2.78 45.22
```

Read that confidence interval again: Mario's true average is somewhere between under three minutes and three quarters of an hour. That is not a mistake. It is an honest report of how little three orders tell you, and it is completely useless for deciding anything.

Now rebuild the posterior on those same three orders, once with the flat prior and once with the city prior.

```r
# Rebuild both posteriors on the same three deliveries
loglik_three <- sapply(grid, function(m) sum(dnorm(three, mean = m, sd = spread, log = TRUE)))
lik_three    <- exp(loglik_three - max(loglik_three))

post_three_flat <- lik_three / sum(lik_three)
post_three_city <- lik_three * prior_city
post_three_city <- post_three_city / sum(post_three_city)

small <- rbind(confidence    = ci_conf_three,
               credible_flat = credible(post_three_flat),
               credible_city = credible(post_three_city))
colnames(small) <- c("lower", "upper")
round(small, 2)
#>               lower upper
#> confidence     2.78 45.22
#> credible_flat 14.46 33.73
#> credible_city 25.21 33.96
```

The bottom row runs 25.2 to 34.0 minutes. That is narrow, usable and tight enough to actually decide something with.

Before you conclude that the Bayesian answer is simply the better one, read the middle row. With a flat prior, the credible interval on three orders is 14.46 to 33.73, which is more than nineteen minutes wide and nearly as useless as the classical one. So the narrowness in the bottom row is not coming from Bayes. It is coming from the prior: twelve orders' worth of city data walked in and did most of the work when the data itself brought only three.

One more thing about that middle row, since it is doing the honest work here. Both posteriors were handed the spread from all twenty orders, 8.596 minutes, while `t.test()` had to estimate the spread from the three orders alone and paid dearly for it. So part of the middle row's advantage is that head start, not Bayes either. Everything you feed a posterior shows up in how confident it comes back.

[WARNING]
That is the whole trade, in one table. A prior rescues you from a tiny sample by supplying information the sample does not have. When that information is right, you gain a great deal. When it is wrong, you have just published a narrow, confident, wrong interval, and nothing in the arithmetic will warn you.

=== step === quiz
## Quick check: when do the two intervals part company?

On twenty deliveries with a flat prior, the two intervals were 21.98 to 30.02 and 22.23 to 29.77. On three deliveries with the city prior, they were 2.78 to 45.22 and 25.21 to 33.96. What opens the gap?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The credible interval is always the narrower of the two, so the gap grows with any sample at all. ::no
- A prior that carries real information, a sample too small to argue with it, or both. Give them plenty of data and a prior that says nothing and the two land in nearly the same place. ::ok Yes. Those are the only two levers, and Mario's numbers show both of them: twenty orders and a flat prior agreed to a quarter of a minute, and three orders with a real prior did not agree at all.
- The credible interval uses a different standard error formula, and that formula breaks down below ten observations. ::no The split is not a formula quirk and it has nothing to do with skew. Two things pull the intervals apart: a prior bringing in outside information, and a sample too small to overrule it. Take both away and the two agreed to within a quarter of a minute on Mario's twenty orders.
- They part company whenever the underlying data is skewed rather than symmetric. ::no

=== step === concept
## The sentence each interval entitles you to say

You are in a meeting and Mario's numbers are on the screen. Here is what you are allowed to say about each interval, word for word.

The confidence interval, 21.98 to 30.02 minutes:

> Our method produces an interval that contains the true average about 95 times in 100. This is one of those intervals.

The credible interval, 22.23 to 29.77 minutes:

> Given these twenty deliveries and a flat prior, there is a 95% probability that the true average is between 22.23 and 29.77 minutes.

The first sentence is about the method. The second is about Mario. That is the difference, and everything we built was showing you why it has to be that way.

Here are the three readings people reach for instead, and why each one is wrong.

| What people say | Why it is wrong |
|---|---|
| "There is a 95% chance the true average is in 21.98 to 30.02." | Said of the confidence interval, this puts a probability on a fixed unknown. Once the interval exists, the truth is inside it or outside it. Say the same words of the credible interval and they are correct. |
| "95% of deliveries take between 22.23 and 29.77 minutes." | Both intervals are about the average, not about single orders. Mario's own log holds a 13 minute delivery and a 45 minute one. |
| "The credible interval is narrower, so it is the better estimate." | Narrower only means more information went in, and some of that information came from the prior rather than from the data. On three orders the prior did most of the work. |

[TIP]
When someone hands you an interval, ask one question before you read it out: is the probability on the parameter, or on the procedure? That single question sorts credible from confidence every time.

=== step === quiz
## Which of these four sentences is legitimate?

Mario's twenty deliveries gave a confidence interval of 21.98 to 30.02, a flat prior credible interval of 22.23 to 29.77, and a posterior probability of 0.981 that his true average beats thirty minutes. One of these four write-ups is defensible.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The confidence interval tells us there is a 95% probability the true average is between 21.98 and 30.02 minutes. ::no
- The credible interval of 22.23 to 29.77 means 95% of Mario's orders arrive inside that window. ::no
- Given the twenty deliveries and a flat prior, there is a 98.1% probability the true average beats the thirty minute promise, and a 95% probability it falls between 22.23 and 29.77 minutes. ::ok Correct, and notice what makes it defensible: the data and the prior are both named, and every probability is attached to the true average rather than to the method or to a single pizza.
- Because the confidence interval sits mostly below thirty, there is roughly a 98% chance Mario keeps his promise. ::no The three wrong ones borrow the credible interval's sentence for a confidence interval, or swap the average for individual orders. A confidence interval never yields a probability about the truth, not even a rough one eyeballed from where it sits on the axis, and neither interval says anything about how long your own pizza takes. Only the posterior can hand you 0.981, because only the posterior has area to add up.

=== step === tryit
## Your turn: a 90% credible interval and one probability

Mario decides 95% is stricter than he needs and asks for a 90% interval instead. He wants one more number too: the chance his true average is under 28 minutes, which is the point where his drivers start missing their bonuses.

The `credible()` function and `post_flat` are both still in memory. Two lines.

```r
# credible(post, level) walks the posterior and returns the two cuts.
# post_flat holds the posterior for every candidate average in grid.
# Line one: the 90% credible interval.
# Line two: the probability the true average is under 28 minutes.
# Press Check when you have both.
```
::check {"regex": "(?=[\\s\\S]*0[.]90?(?![0-9]))(?=[\\s\\S]*grid\\s*<=?\\s*28)", "gate": true, "difficulty": "intermediate", "ok": "Right on both: 22.84 to 29.16 for the 90% interval, and 0.85 for the chance he is under 28 minutes. Notice the 90% interval is the narrower one. Ask for less confidence and you buy a tighter range on exactly the same data.", "no": "Two lines, both reusing what is already in memory. The interval is credible(post_flat, level = 0.90), and the probability is sum(post_flat[grid < 28])."}
::solution
```r
# A 90% credible interval, and the chance the true average is under 28 minutes
round(credible(post_flat, level = 0.90), 2)
#> [1] 22.84 29.16

sum(post_flat[grid < 28])
#> [1] 0.8503395
```

=== step === quiz
## What happens to the gap when the orders pile up?

Suppose Mario keeps logging and comes back with two thousand deliveries instead of twenty, and you keep the same city prior worth about twelve orders. What happens to the two intervals?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- They stay exactly as far apart as they were on twenty orders, because the prior has not changed. ::no
- Both of them get wider, because more data means more variation to account for. ::no
- They close on each other, because twelve orders of prior weight against two thousand real ones is almost nothing, so the data decides both. ::ok That is it. The prior's weight is fixed in orders, so its share of the answer shrinks as real orders arrive, and the two intervals converge.
- The credible interval keeps shrinking while the confidence interval stays where it is. ::no Both intervals shrink as data arrives, and they shrink toward each other. The prior's weight is fixed at about twelve orders, so its share of the answer falls as real orders pile up. That is why the two agreed to a quarter of a minute on twenty deliveries and disagreed wildly on three, and it is why the argument over which interval to use is loudest exactly where the data is thinnest.

=== step === concept
## References

- [The fallacy of placing confidence in confidence intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee and Wagenmakers (2016), Psychonomic Bulletin and Review 23(1), 103-123. Works through why the probability sentence belongs to the credible interval and not to the confidence interval.
- [Robust misinterpretation of confidence intervals](https://doi.org/10.3758/s13423-013-0572-3) - Hoekstra, Morey, Rouder and Wagenmakers (2014), Psychonomic Bulletin and Review 21(5), 1157-1164. Students, researchers and teachers were shown six readings of one interval, and all three groups endorsed the wrong ones at high rates.
- [Outline of a theory of statistical estimation based on the classical theory of probability](https://doi.org/10.1098/rsta.1937.0005) - Neyman (1937), Philosophical Transactions of the Royal Society A 236, 333-380. The original definition of the confidence interval, stated as a long run coverage property from the very start.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013). Chapter 2 covers single parameter models and posterior intervals, which is the machinery we built by hand here.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()` and the interval it returns.

=== step === complete
## Quick recap

You built both intervals from scratch on the same twenty pizza deliveries and watched exactly where they agree and where they come apart. To summarise:

- A confidence interval's 95% is a hit rate for the recipe across reruns. You counted it: 94.8% over 2,000 reruns, and 96 of 100 plotted intervals caught the truth.
- Because the truth is fixed and the interval is the random thing, no probability is left over for the one interval you hold. It is in or it is out, and you do not know which.
- A credible interval flips what is random. Score every candidate average, multiply by the prior, normalise, and read the middle 95% off the curve: 22.23 to 29.77 minutes.
- That one carries the sentence people actually want, and it carries area, which is how you get a direct 0.981 for the chance Mario beats his thirty minute promise.
- The two split when a prior carries real information or the sample is small. On twenty orders they agreed to a quarter of a minute. On three orders the classical interval ran 2.78 to 45.22 while the city prior held the credible one at 25.2 to 34.0.
- A narrower interval is not automatically a better one. Always check how much of that narrowness came from the prior rather than from the data.

So the next time an interval lands on your desk, ask which kind it is before you read it aloud. One of them lets you say "there is a 95% probability the true average is in here". The other never will, no matter how much data you collect. Have a great day!
