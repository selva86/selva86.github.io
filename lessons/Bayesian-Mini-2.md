---
title: "Choosing priors: the decision that matters"
slug: "Bayesian-Mini-2"
description: "A prior is a count of what you already watched. See why five heads and five winning trades give different answers, and how to pick one you can defend."
keywords: "choosing priors, Bayesian prior, Beta prior, prior strength, flat prior, prior predictive check, prior sensitivity, informative prior, Bayesian updating in R"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "2"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-1"
course_next: ""
curriculum_id: "0.0.33"
lesson_access: "windowed"
catalog_blurb: "How to choose a prior you can defend, and when it stops mattering."
---

=== step === cover
::eyebrow Bayesian Decisions
## Choosing priors: the decision that matters

A stranger at a bus stop takes out a coin and flips it five times. Heads, heads, heads, heads, heads.

You watch all five and it does not bother you. That coin is almost certainly fair, and if they offered you a bet on the sixth flip you would still call it close to even money. A lifetime of coins is sitting behind that judgement, and five flips is not going to shift it.

Now a second stranger tells you about a trading strategy they wrote last month. It has made five trades and won all five.

Five out of five again, and this time you honestly do not know what to think.

It is the same pattern in the data both times, and the two reactions are nothing alike. Nothing in the data did that. What did it was everything you believed before those five results turned up.

That belief has a name in Bayesian work. It is called the prior, and it is the piece people argue about hardest, because it is the one place where your own judgement enters the arithmetic.

Nothing has gone wrong here, by the way. Refusing to use what you knew walking in would be the careless move, not the careful one. What you do owe anyone reading your work is a prior you can write down, hand over, and defend.

So let's build one, in three moves.

::widget process-flow {"steps":[{"title":"Write down what you knew","sub":"as a curve, and then as a plain count of observations"},{"title":"Let the same five wins in","sub":"five heads for one stranger, five winning trades for the other"},{"title":"Read where each answer lands","sub":"one barely moves, the other swings all the way to 0.86"}]}

Do that once and you can say out loud how strong a prior is, work out which side wins when the prior and the data disagree, and check what a prior is claiming before it ever touches your data.

=== step === concept
## Five heads and five winning trades: what the data alone says

Let's get both stories onto the table as numbers, because every calculation from here runs off them.

Each story is a run of yes-or-no trials. The coin came up heads five times out of five flips. The strategy won five times out of five trades. A head counts as a success, and so does a win.

Press Run.

```r
# Put both stories on the table as counts, and see what the data alone says
runs <- data.frame(
  scenario  = c("coin", "strategy"),
  successes = c(5, 5),
  trials    = c(5, 5)
)
runs$rate <- runs$successes / runs$trials

runs
#>   scenario successes trials rate
#> 1     coin         5      5    1
#> 2 strategy         5      5    1
```

Both rates come back as 1. The data on its own, with nothing else added to it, says each of these things succeeds every single time.

Nobody believes that about the coin. Read literally, a rate of 1 says the sixth flip is heads, and the six hundredth, and every flip after that.

So the moment you shrugged at the coin and hesitated over the strategy, you were already using something the data never gave you. You just had not written it down.

Let's write it down.

=== step === concept
## What a prior looks like: a curve over every rate it could be

Before you can write a belief down, you have to be clear about what the belief is about.

In both stories the unknown is a single number. Call it p, the long-run share of trials that come out successes. For the coin, p is the share of flips that land heads over a very long run. For the strategy, p is the share of trades it would win over a long run.

You do not know p. What you do have is a sense of which values of p are plausible and which are not, and holding that sense is the prior's whole job.

A prior is a curve drawn over every value p could take, from 0 to 1. Where the curve is high you think that value is plausible, and where it sits near the floor you think it is unlikely. The height at each value is called the density, and the total area under the curve is 1, so the curve is spreading a fixed budget of belief across the range.

For a rate between 0 and 1, the standard family of curves is the Beta family. It is written Beta(a, b), and those two numbers are the only knobs. Move them and you get any shape from a flat line to a needle.

Here are the two priors that match the two reactions you had at the bus stop.

```r
# Draw two priors over the success rate: a tight one and a flat one
curve(dbeta(x, 200, 200), from = 0, to = 1, n = 401,
      col = "steelblue", lwd = 3, ylim = c(0, 17),
      main = "Two priors over the success rate",
      xlab = "p, the long-run share of successes", ylab = "density")

curve(dbeta(x, 1, 1), add = TRUE, col = "darkorange", lwd = 3)

legend("topright", legend = c("Beta(200, 200)", "Beta(1, 1)"),
       col = c("steelblue", "darkorange"), lwd = 3, bty = "n")
```

`dbeta()` gives the height of the curve at each value of p, and `curve()` draws it across the range.

The blue needle is the coin. It piles nearly all of its belief between 0.45 and 0.55 and leaves almost nothing anywhere else, which is a fair picture of what a lifetime of coins taught you.

The orange line is the untried strategy. It is flat, so every rate from 0 to 1 gets the same belief: a strategy that wins 5% of its trades and one that wins 95% are treated as equally plausible.

Nothing has been fitted here. This is belief before data, drawn as a picture.

=== step === concept
## How strong is a prior? Count it in observations

Calling one curve tight and the other flat is fine at a glance, but you cannot defend a picture in a meeting. Strength needs a number.

The Beta family hands you that number, and it is simpler than it looks. When a Beta(a, b) prior meets a run of yes-or-no trials, a behaves exactly like a count of successes you have already watched, and b behaves exactly like a count of failures. Add them and a + b is how many observations the prior is worth.

Read the two numbers out loud that way and the family stops being abstract.

Beta(200, 200) is 400 flips already watched, 200 heads and 200 tails. Beta(1, 1) is one success and one failure, which is the least this family can carry while still spreading its belief evenly across the range.

That one reading turns the whole business from a matter of taste into arithmetic. Let's put three candidate priors side by side and see what each one is claiming.

```r
# Read each candidate prior as a count of observations already watched
priors <- data.frame(
  label = c("Beta(1, 1)", "Beta(4, 4)", "Beta(200, 200)"),
  a     = c(1, 4, 200),
  b     = c(1, 4, 200)
)

priors$observations <- priors$a + priors$b
priors$mean  <- priors$a / (priors$a + priors$b)
priors$lower <- round(qbeta(0.025, priors$a, priors$b), 3)
priors$upper <- round(qbeta(0.975, priors$a, priors$b), 3)

priors
#>            label   a   b observations mean lower upper
#> 1     Beta(1, 1)   1   1            2  0.5 0.025 0.975
#> 2     Beta(4, 4)   4   4            8  0.5 0.184 0.816
#> 3 Beta(200, 200) 200 200          400  0.5 0.451 0.549
```

`qbeta()` returns the value of p below which a given share of the belief sits, so the `lower` and `upper` columns together are the middle 95% of each prior.

Read the mean column first. All three sit at 0.5, so all three are centred in exactly the same place. Centre is not strength.

Now read across the rows. Beta(200, 200) keeps 95% of its belief inside 0.451 to 0.549, which says a rate outside that band would be a real surprise. Beta(1, 1) spreads the same 95% across 0.025 to 0.975, which rules out very nearly nothing.

[KEY INSIGHT]
The strength of a Beta prior is a + b, read as observations already watched. Beta(200, 200) walks in carrying 400 of them. Beta(1, 1) walks in carrying 2.

So the coin gets Beta(200, 200), because a lifetime of coins genuinely is worth hundreds of flips. The untried strategy gets Beta(1, 1), because you had never watched it win or lose before those five trades.

=== step === quiz
## Quick check: what is Beta(20, 20) claiming?

A colleague hands you a model with a Beta(20, 20) prior on a success rate. What have they claimed?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- That the rate is exactly 0.5, with no room left for anything else. ::no
- That the rate is centred on 0.5, and that they are bringing the weight of 40 observations, 20 successes and 20 failures. ::ok That is the reading. Add the two numbers for the strength, and the split between them puts the centre.
- That they are bringing the weight of 20 observations, since 20 is the number that shows up. ::no
- Nothing much, because the two numbers are equal and cancel each other out. ::no Add the two numbers, do not cancel them. Here a is a count of successes already watched and b is a count of failures, so a + b is the strength. Equal numbers put the centre at 0.5, and 20 plus 20 makes that centre worth 40 observations, which is a real claim about the rate rather than a neutral one.

=== step === concept
## The same five wins, two different answers

Now we let the data in, and the rule for doing that is short.

With a Beta prior and a run of yes-or-no trials, the updated belief is another Beta curve, and you get it by adding the successes onto a and the failures onto b.

\[ \text{Beta}(a,\ b) \ \text{plus}\ s\ \text{successes and}\ f\ \text{failures} \;=\; \text{Beta}(a + s,\ b + f) \]

That is exact, not an approximation. The reason is that the two shapes fit together: a Beta curve is p raised to one power times 1 minus p raised to another, the data contributes p raised to the number of successes times 1 minus p raised to the number of failures, and multiplying them adds the powers. A prior and a data model that lock together like that are called conjugate.

The updated curve has a name of its own. It is the posterior, which is what you believe once the data is in.

Both of our stories brought five successes and no failures, so both get 5 added onto a and nothing onto b.

```r
# Add the same five wins to each prior and read the two posteriors
posteriors <- data.frame(
  scenario = runs$scenario,
  a = c(200, 1) + runs$successes,
  b = c(200, 1) + (runs$trials - runs$successes)
)

posteriors$mean  <- round(posteriors$a / (posteriors$a + posteriors$b), 4)
posteriors$lower <- round(qbeta(0.025, posteriors$a, posteriors$b), 3)
posteriors$upper <- round(qbeta(0.975, posteriors$a, posteriors$b), 3)

posteriors
#>   scenario   a   b   mean lower upper
#> 1     coin 205 200 0.5062 0.458 0.555
#> 2 strategy   6   1 0.8571 0.541 0.996
```

Look at the mean column, because that is one data pattern landing in two places.

The coin went from 0.5000 to 0.5062. Five heads against 400 flips of prior experience moved it by six thousandths, and its middle 95% still sits comfortably around 0.5.

The strategy went from 0.500 to 0.857. The very same five wins, against a prior worth two observations, dragged the answer most of the way to the top of the range.

There is the bus stop, written out in numbers. Neither answer is a mistake, and neither one is a matter of opinion once the priors are on the page.

A mean on its own rarely settles anything, though. The question someone will actually ask about the coin is whether it favours heads at all, and that is a question about how much of the posterior sits above 0.5.

```r
# How sure is the coin posterior that the rate beats a fair 0.5?
pbeta(0.5, 205, 200, lower.tail = FALSE)
#> [1] 0.5982078
```

`pbeta()` gives the share of a Beta curve below a value, and `lower.tail = FALSE` flips that to the share above it. So 0.598 of the coin's posterior sits above 0.5.

That is a shrug written as a number. Just under 60% is barely different from the 50% you would have said before the coin came out, which is the honest position after five flips.

=== step === tryit
## Your turn: how sure is the strategy that it beats a coin flip?

The coin came back at 0.598, close to a shrug. The strategy's posterior is Beta(6, 1), and it started from a flat prior rather than a lifetime of flips.

Work out the share of the strategy's posterior that sits above 0.5, the same way, and see how far apart the two answers really are.

```r
# The strategy posterior is Beta(6, 1). Find the share of it sitting
# above 0.5, the way the coin's 0.598 was worked out.
# One line. Press Check when you have it.
```
::check {"regex": "pbeta[\\s\\S]*lower\\.tail\\s*=\\s*FALSE", "gate": true, "difficulty": "intermediate", "ok": "That is it: 0.984. The strategy posterior puts 98.4% of its belief above a coin flip against the coin posterior's 59.8%, and the only thing that differs between the two is the prior each one started from.", "no": "Use the same call with the strategy's numbers in it: pbeta(0.5, 6, 1, lower.tail = FALSE). First the value you are cutting at, then the two Beta numbers, then the flip to the upper tail."}
::solution
```r
# How sure is the strategy posterior that its win rate beats 0.5?
pbeta(0.5, 6, 1, lower.tail = FALSE)
#> [1] 0.984375
```

=== step === concept
## The posterior mean is a weighted average of two counts

You have watched the same five wins land in two places. Now let's get the law behind it, because once you have that law you can answer "does my prior matter here" before you run anything at all.

Start from the posterior mean, which is nothing but the updated counts divided by their total. Here s is the number of successes and n is the number of trials.

\[ \text{posterior mean} \;=\; \frac{a + s}{a + b + n} \]

Now break that fraction apart. The a on top is the prior's count a + b times the prior's own mean, and the s on top is the data's count n times the data's own rate. Put those two pieces back in and the whole thing turns into an average.

\[ \text{posterior mean} \;=\; \frac{a+b}{a+b+n}\times\text{prior mean} \;+\; \frac{n}{a+b+n}\times\text{data rate} \]

Read the two fractions as vote shares. The prior votes with the observations it carries, the data votes with the trials it brought, and the answer lands wherever those two counts put it.

```r
# Work out how much of each posterior mean is carried by the prior
prior_strength <- c(coin = 400, strategy = 2)
n_trials       <- 5

weight_prior <- prior_strength / (prior_strength + n_trials)
round(weight_prior, 3)
#>     coin strategy 
#>    0.988    0.286 
```

The coin's prior holds 98.8% of the vote, because 400 observations against 5 is not a close contest. The strategy's prior holds 28.6%, because 2 against 5 is.

Let's check that the law reproduces both answers exactly.

```r
# Rebuild both posterior means as a weighted average of two counts
prior_mean <- c(coin = 0.5, strategy = 0.5)
data_mean  <- c(coin = 1.0, strategy = 1.0)

round(weight_prior * prior_mean + (1 - weight_prior) * data_mean, 4)
#>     coin strategy 
#>   0.5062   0.8571 
```

0.5062 and 0.8571, which is exactly what the two posteriors gave.

The reason it divides this cleanly is that a Beta prior and a run of yes-or-no trials lock together, so both sides can be written as counts. Where they do not lock together the prior still loses ground as the data grows, you just cannot read its share straight off two numbers.

[KEY INSIGHT]
A prior matters exactly as much as its strength compared with your sample size. Write both as counts, set them beside each other, and the argument about whether a prior is doing too much of the work becomes a division you can do in your head.

=== step === widget
## Prior, likelihood and posterior on one picture

Three curves are in play every time you do this, and they are worth seeing together once.

You have met two of them already. The prior is what you believed before, the posterior is what you believe after, and the third one is the likelihood, which is the curve the data alone supports with no prior involved. For five out of five, the likelihood piles everything at the top of the range, because a rate of 1 is where the data on its own points.

The picture below runs those same three curves for a measured quantity rather than a win rate, so the numbers along its axis are not the ones from our coin. What you get to do here is move the pieces and watch.

::widget bayes-update {}

Drag the prior confidence slider first. A narrow prior is the Beta(200, 200) coin, a wide one is the flat prior on the strategy, and the posterior slides between the two curves as you move it.

Then drag the data points slider up from 1. With very little data the posterior sits almost on top of the prior, and as the count climbs it walks across the picture and settles onto the likelihood. That is the weighted average moving in front of you.

Notice what never happens. The posterior never leaves the space between the prior and the likelihood, because an average of two things cannot land outside them.

=== step === concept
## How much data does it take to wash a prior out?

People say the data washes the prior out eventually, and that is true. The useful version of that sentence says how much data, and the vote shares can tell you exactly that.

Let's put the coin prior into a fight it deserves to lose. Suppose the coin really is bent and lands heads 80% of the time, and we keep on flipping. Beta(200, 200) insists on 0.5 with 400 observations behind it, the flips keep saying 0.8, and the counts settle it between them.

```r
# Feed the coin prior a run of flips that lands heads 80 percent of the time
flips <- c(5, 20, 100, 400, 2000, 10000)
heads <- 0.8 * flips

washout <- data.frame(
  flips          = flips,
  posterior_mean = (200 + heads) / (400 + flips),
  prior_weight   = 400 / (400 + flips)
)

round(washout, 3)
#>   flips posterior_mean prior_weight
#> 1     5          0.504        0.988
#> 2    20          0.514        0.952
#> 3   100          0.560        0.800
#> 4   400          0.650        0.500
#> 5  2000          0.750        0.167
#> 6 10000          0.788        0.038
```

Read the last column first, because it is the vote share and it explains everything to its left.

After 5 flips the prior still holds 98.8% of the vote and the answer has barely twitched, from 0.500 to 0.504. After 100 flips the prior is down to 80% and the answer has crept to 0.560, which is still nearer the prior than the truth.

At 400 flips the two sides carry the same count, the vote splits down the middle, and the posterior mean is 0.650, exactly halfway between the prior's 0.5 and the data's 0.8. That is the crossover point, and it arrives when your sample size equals the prior's strength.

Past there the data takes over. By 10,000 flips the prior is down to 3.8% of the vote and the answer sits at 0.788, close enough to the truth for any decision you would make with it.

[NOTE]
A strong prior is not dangerous by itself. It is dangerous in small samples. The same Beta(200, 200) that dominates five flips is a rounding error against ten thousand.

=== step === quiz
## Quick check: which side wins here?

A colleague puts a Beta(30, 30) prior on a click-through rate, then runs a campaign that gets 45 clicks out of 60 impressions. Where does the posterior mean land?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- At 0.75, the rate the campaign actually got, because 60 impressions is a decent sample. ::no
- At 0.5, the prior mean, because the colleague picked that prior deliberately. ::no
- At 0.625, exactly halfway between 0.5 and 0.75, because the prior carries 60 observations and so does the campaign. ::ok Yes. Beta(30, 30) is worth 60 observations, the campaign brought 60 trials, so the vote splits evenly and the answer sits midway between the two rates.
- Somewhere between 0.5 and 0.75, but you would have to fit the model to find out where. ::no There is nothing to fit. Beta(30, 30) is worth 30 plus 30, which is 60 observations, and the campaign brought 60 trials of its own, so each side holds half the vote and the posterior mean is the midpoint of 0.5 and 0.75.

=== step === concept
## A flat prior is not a neutral prior

The flat prior feels like the safe choice. It looks like a refusal to assume anything, and people reach for it when they want to say the data spoke for itself.

Look at what it actually claims.

```r
# Read off the rates the flat prior calls plausible
qbeta(c(0.025, 0.5, 0.975), 1, 1)
#> [1] 0.025 0.500 0.975
```

Ninety-five percent of Beta(1, 1) sits between 0.025 and 0.975. Spelled out, that prior says a strategy winning 97% of its trades is exactly as ordinary as one winning half of them, and both are as ordinary as one winning 3%.

Would you sign that? For a brand new strategy with five trades behind it, that is a strong claim, and it is the claim that carried the answer to 0.857.

Here is the flat curve on its own with that middle 95% marked, so the range has a picture beside it.

```r
# Draw the flat prior and mark the middle 95 percent of what it claims
curve(dbeta(x, 1, 1), from = 0, to = 1, n = 401, ylim = c(0, 1.6),
      col = "darkorange", lwd = 3,
      main = "Beta(1, 1): every win rate treated as equally plausible",
      xlab = "p, the long-run win rate", ylab = "density")

abline(v = qbeta(c(0.025, 0.975), 1, 1), col = "grey40", lty = 2, lwd = 2)
```

The two dashed lines sit almost on the edges of the plot, and that is the whole point. The middle of that curve gets no more belief than the edges do.

[WARNING]
A flat prior is not the absence of an assumption. It is the assumption that every value is equally plausible, and for most quantities you will ever model, that is a claim you would never make out loud.

The honest alternative is not a tight prior either. It is a prior wide enough that a careful colleague would not push back on the range, and tight enough to rule out the values you know are absurd. Beta(4, 4) does that job for a win rate: it is worth 8 observations, it leaves the door open from 0.184 to 0.816, and it does not treat 0.97 as an everyday result.

=== step === concept
## What does your prior predict before any data arrives?

Reading a prior off its two numbers is a good habit, but there is a sharper test, and it needs no data at all.

Ask the prior to play the game. Draw a rate out of the prior, run five trials at that rate, write down what happened, and repeat twenty thousand times. What comes back is the set of results your prior considers ordinary before it has seen anything. That is called a prior predictive check.

Our five out of five is the result to look for. If a prior says five out of five turns up all the time, then five out of five is not news under that prior.

```r
# Play five trials out of each prior alone and count the five-out-of-fives
prior_predictive <- function(a, b, trials = 5, draws = 20000) {
  set.seed(2026)                              # so the check repeats exactly
  rate <- rbeta(draws, a, b)
  wins <- rbinom(draws, trials, rate)
  mean(wins == trials)
}

data.frame(
  prior            = priors$label,
  five_out_of_five = round(mapply(prior_predictive, priors$a, priors$b), 4)
)
#>            prior five_out_of_five
#> 1     Beta(1, 1)           0.1614
#> 2     Beta(4, 4)           0.0704
#> 3 Beta(200, 200)           0.0333
```

`rbeta()` draws rates out of the prior and `rbinom()` plays five trials at each of those rates, so each row is what one prior expects a five-trial run to look like.

Under the flat prior, five out of five comes up 16% of the time, which is about one run in six. Under Beta(4, 4) it is 7%, about one in fourteen. Under the coin's Beta(200, 200) it is 3%, about one in thirty-one.

For these three the simulation is not even necessary. The same chance can be worked out exactly.

```r
# The same chance worked out exactly, written as one in how many runs
exact <- exp(lbeta(priors$a + 5, priors$b) - lbeta(priors$a, priors$b))
round(1 / exact, 1)
#> [1]  6.0 14.1 31.2
```

`lbeta(a, b)` is the logarithm of the number a Beta curve has to divide by to make its area come to 1. The chance of a clean sweep of five is that number with the five wins added on, divided by the same number before them, and subtracting the two logs then undoing it with `exp()` is the safe way to do that division when both numbers are this small.

One in six, one in fourteen, one in thirty-one, which is what the simulation found.

Now read the first of those as a sentence about your own beliefs. Choosing the flat prior for that strategy is choosing to say that a clean sweep of five would happen once in every six attempts, before you had ever watched the thing trade. That is a bold position to have taken by accident.

Beta(4, 4) says one in fourteen, which is unusual enough to be interesting and common enough not to be a miracle. That sounds a lot closer to what you actually believed at the bus stop, so let's see what answer it gives.

```r
# Refit the strategy's five wins under Beta(4, 4), which gives Beta(9, 4)
round(c(mean = 9 / 13,
        beats_a_coin = pbeta(0.5, 9, 4, lower.tail = FALSE)), 3)
#>         mean beats_a_coin 
#>        0.692        0.927 
```

Beta(4, 4) plus five wins is Beta(9, 4), which puts the mean at 0.692 and 92.7% of the belief above a coin flip. The flat prior said 0.857 and 98.4%.

Same five trades, and the number you would carry into a decision moved a long way. The only thing that changed was the belief you walked in with.

=== step === tryit
## Your turn: run the prior predictive check on a prior of your own

Suppose you are less certain than Beta(4, 4) and more careful than flat, and you settle on Beta(10, 10). Before you use it, find out what it predicts.

The function `prior_predictive()` is already loaded and takes the two Beta numbers. Run the check on Beta(10, 10), then get the exact figure with `lbeta()` the same way, and decide whether five out of five would be a shock under that prior.

```r
# prior_predictive(a, b) plays five trials out of a prior and returns the
# share of runs that come back five out of five.
# Run it on Beta(10, 10), then work out the exact figure with lbeta().
# Two lines. Press Check when you have them.
```
::check {"regex": "prior_predictive\\s*[(]\\s*10\\s*,\\s*10|rbeta[\\s\\S]*rbinom", "gate": true, "difficulty": "intermediate", "ok": "Right: about 0.047, which is one run in 21. Beta(10, 10) treats a clean sweep of five as uncommon but not remarkable, and that is a defensible thing to believe about a strategy you have never watched.", "no": "Call the function with the two numbers, prior_predictive(10, 10), then the exact version, exp(lbeta(10 + 5, 10) - lbeta(10, 10)). The 5 in there is the number of trials you are asking about."}
::solution
```r
# Run the same prior predictive check on Beta(10, 10)
prior_predictive(10, 10)
#> [1] 0.04565

# The exact chance of a clean sweep of five under Beta(10, 10)
exp(lbeta(10 + 5, 10) - lbeta(10, 10))
#> [1] 0.04710145
```

One run in 21, sitting between the flat prior's one in six and the coin prior's one in thirty-one. That is roughly where a cautious but open mind belongs.

=== step === concept
## How to check whether the prior is driving your answer

You have now seen the strategy's five wins produce 0.857 under one prior and 0.692 under another. So which one goes in the report?

Neither, on its own. When the prior is arguable, the professional move is to refit under every prior you could defend and show what each of them gives. That is a prior sensitivity analysis, and it is one loop over the priors you already wrote down.

```r
# Refit the same five wins under every candidate prior and compare the answers
sweep <- do.call(rbind, lapply(seq_len(nrow(priors)), function(i) {
  post_a <- priors$a[i] + 5
  post_b <- priors$b[i]
  data.frame(
    prior        = priors$label[i],
    mean         = post_a / (post_a + post_b),
    lower        = qbeta(0.025, post_a, post_b),
    upper        = qbeta(0.975, post_a, post_b),
    beats_a_coin = pbeta(0.5, post_a, post_b, lower.tail = FALSE)
  )
}))

sweep[, 2:5] <- round(sweep[, 2:5], 3)
sweep
#>            prior  mean lower upper beats_a_coin
#> 1     Beta(1, 1) 0.857 0.541 0.996        0.984
#> 2     Beta(4, 4) 0.692 0.428 0.901        0.927
#> 3 Beta(200, 200) 0.506 0.458 0.555        0.598
```

Read the last column. The share of belief above a coin flip runs 0.984, then 0.927, then 0.598, and the only thing that moved between those rows is what somebody believed before the five trades happened.

That spread is the finding. On five trials the prior is the answer, and any single number quoted off this data is really a statement about the prior and not about the strategy.

Look at the ranges as well. Even the flat prior's middle 95% runs from 0.541 all the way to 0.996, which is another way of saying that nobody in this table knows the win rate.

[TIP]
Report the sweep, not the prior you liked best. A table showing that three defensible priors disagree is an honest result. Picking the one that gave the number you wanted and leaving the others out is exactly what review exists to catch.

When the sweep comes back tight, you have something better still: the answer does not depend on the argument, so the argument does not need to be had.

=== step === concept
## How to choose a prior you can defend

Everything so far collapses into four rules. None of them is a matter of taste, and you have watched each one happen.

1. **Name the strength in observations.** Write a + b down before anything else. If your prior is worth 400 observations and your study has 5, say so out loud, because your answer is going to be mostly prior.
2. **Rule out the absurd, not the plausible.** Go wide enough to survive a colleague's review and tight enough to exclude what you know cannot be true. For a win rate, Beta(4, 4) does that. Beta(1, 1) does not, because it excludes nothing at all.
3. **Check what it predicts before you use it.** Play the prior forward and look at the results it calls ordinary. If those results would astonish you, that prior is not yours.
4. **Sweep it, and report the sweep.** Refit under every prior you could defend. If they agree, say so. If they disagree, the disagreement is your result.

The helper below does the first three in one call, which is a reasonable thing to keep around in a project of your own.

```r
# Report what a prior claims before any data arrives
describe_prior <- function(a, b, trials = 5, at_least = trials, draws = 20000) {
  set.seed(2026)                              # so the report repeats exactly
  rate <- rbeta(draws, a, b)
  wins <- rbinom(draws, trials, rate)
  cat("strength:", a + b, "observations\n")
  cat("prior mean:", round(a / (a + b), 3), "\n")
  cat("95% range for the rate:", round(qbeta(0.025, a, b), 3),
      "to", round(qbeta(0.975, a, b), 3), "\n")
  cat(at_least, "or more out of", trials, ":", round(mean(wins >= at_least), 3), "\n")
}

describe_prior(4, 4)
#> strength: 8 observations
#> prior mean: 0.5 
#> 95% range for the rate: 0.184 to 0.816 
#> 5 or more out of 5 : 0.07 
```

Read that last line as a sentence. Beta(4, 4) expects a clean sweep of five about 7% of the time before any data arrives, and its middle 95% runs from 0.184 to 0.816.

Change `trials` and `at_least` and the same call answers a different question: out of 200 visitors, how often would this prior expect 12 or more conversions? That is the form the check takes on real work, where you rarely care about a clean sweep and usually care about a threshold somebody is going to act on.

=== step === quiz
## Practice: what is this prior claiming?

A colleague is modelling the conversion rate of a checkout button. They put Beta(1, 1) on it and tell the room it is the assumption-free choice, so the data can speak for itself. Which reply is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- They are right. A flat curve is the one prior that makes no claim, which is why it is the safe default. ::no
- It is a claim like any other. It says every conversion rate from 0 to 1 is equally plausible, so a button converting at 97% is as ordinary as one converting at 3%. ::ok Exactly. Flat is not silent, it is loud in every direction at once, and about a checkout button you already know a great deal more than that.
- It is fine as long as the sample is small, because a weak prior cannot do much damage. ::no
- It is a strong prior centred on 0.5, so they are assuming half of all visitors convert. ::no Flat means every rate gets the same belief, so nothing is favoured and nothing is excluded, and the middle 95% of Beta(1, 1) runs from 0.025 to 0.975. That is not silence and it is not a claim about 0.5 either. It is the claim that a 97% conversion rate is as ordinary as a 3% one, which nobody who has watched a checkout page would sign. A weak prior also does the most damage in a small sample rather than the least, because that is exactly when it holds most of the vote.

=== step === tryit
## Practice: choose a prior and check what it predicts

Your turn on a real one. A checkout button on your site converts somewhere near 3%, and you know that from a couple of years of watching buttons like it, which you judge to be worth about 100 visitors of evidence.

Write that belief as a Beta prior, then check what it predicts for the next 200 visitors, and read off how often it expects 12 or more of them to convert. The helper `describe_prior(a, b, trials, at_least)` is already loaded.

```r
# Write a prior for a button that converts near 3 percent and is worth
# about 100 visitors of evidence, then ask what it predicts for the next
# 200 visitors, and how often it expects 12 or more conversions.
# Press Check when you have it.
```
::check {"regex": "describe_prior[\\s\\S]*200", "gate": true, "difficulty": "advanced", "ok": "That is the one. Beta(3, 97) is worth exactly 100 observations and centres on 0.03. It expects 12 or more conversions out of 200 visitors about 10.6% of the time, so seeing 12 is on the high side of ordinary and nothing to celebrate yet.", "no": "Pick a and b so that a + b comes to 100 and a divided by 100 sits near 0.03, which gives Beta(3, 97). Then call describe_prior(3, 97, trials = 200, at_least = 12)."}
::solution
```r
# A prior for a checkout button that converts near 3 percent, worth 100 visitors
describe_prior(3, 97, trials = 200, at_least = 12)
#> strength: 100 observations
#> prior mean: 0.03 
#> 95% range for the rate: 0.006 to 0.071 
#> 12 or more out of 200 : 0.106 
```

Now suppose those 200 visitors really did hand you 12 conversions. Adding them on is the same move as before: the 12 who converted go onto a, and the 188 who did not go onto b.

```r
# Update the prior with the 12 conversions those 200 visitors gave
post_a <- 3 + 12
post_b <- 97 + 188

round(c(mean = post_a / (post_a + post_b),
        prior_weight = 100 / (100 + 200)), 3)
#>         mean prior_weight 
#>        0.050        0.333 
```

The button converted at 6% in the test, your prior said 3%, and the posterior settles at 5.0%. The prior held a third of the vote, because 100 observations against 200 visitors is one to two, and the answer sits where those counts put it.

=== step === quiz
## Practice: when does the prior stop mattering?

You are using a Beta(4, 4) prior on the win rate of a trading strategy, and a colleague asks how much data it would take before the prior is more or less out of the picture. Say they want the data to outvote the prior ten to one. How many trades is that?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- 8 trades, because the prior is worth 8 observations and that levels the contest. ::no
- 40 trades, because the prior mean is 0.5 and you need enough trades to move it. ::no
- 80 trades, because the prior carries 8 observations and ten times 8 is 80. ::ok Yes. Beta(4, 4) is worth 4 plus 4, so 80 trades give the prior 8 votes against the data's 80, which leaves it about 9% of the answer.
- It never stops mattering, because the prior stays in the arithmetic no matter how much data you collect. ::no The prior does stay in the arithmetic, true, but its vote share is a + b over a + b + n and that shrinks as n grows. Beta(4, 4) carries 8 observations, so 80 trades outvote it ten to one and leave it holding about 9% of the answer. Eight trades would only level the contest, and the prior mean has nothing to do with how much weight the prior carries.

=== step === concept
## References

- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin. Chapter 2 covers single-parameter models and conjugate priors, including the Beta and binomial pair used throughout here.
- [Prior Choice Recommendations](https://github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations) - Stan development team. The working guidance on weakly informative priors, and on where flat priors go wrong.
- [The prior can often only be understood in the context of the likelihood](https://www.mdpi.com/1099-4300/19/10/555) - Gelman, Simpson and Betancourt (2017), Entropy 19(10). Why a prior cannot be judged on its own, only against the data it will meet.
- [Visualization in Bayesian workflow](https://arxiv.org/abs/1709.01449) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society A 182(2). The paper that made prior predictive checks standard practice.

=== step === complete
## Quick recap

You started with two strangers and one data pattern, and you finished with a prior you can write down and argue for. What to keep:

- A prior is a curve over every value the unknown rate could take, and for a rate the Beta family gives that curve two numbers.
- The strength of a Beta prior is a + b, read as observations already watched. Beta(200, 200) is 400 flips. Beta(1, 1) is 2.
- Updating is addition. Successes go onto a, failures go onto b, and the result is exact.
- The posterior mean is the prior mean and the data rate averaged by their counts, so a prior matters exactly as much as its strength compared with your sample size. At 400 flips against a prior worth 400 observations, the answer sat dead centre between them.
- A flat prior is a claim, not the absence of one. Beta(1, 1) calls a 97% win rate as ordinary as a coin flip, and that claim is what pushed five trades to 0.857.
- Play a prior forward before you use it. If the results it calls ordinary would astonish you, it is not your prior.
- When the choice is arguable, refit under every prior you could defend and report the whole sweep.

So the next time somebody tells you a prior is just an assumption you slipped in, you have the better answer. It is a count of what you already watched, it is written on the page where anyone can check it, and you can show them exactly how much of your result it is holding up.

Have a good one.
