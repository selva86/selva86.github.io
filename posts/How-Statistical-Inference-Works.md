---
title: "How Statistical Inference Works (No Formulas Yet)"
slug: "How-Statistical-Inference-Works"
description: "Learn how statistical inference works using plain-English intuition and runnable R simulations. See the leap from a sample to a whole population, no formulas."
keywords: "statistical inference, how statistical inference works, inferential statistics, sample to population, sampling variability, statistical inference in R, uncertainty in statistics, population vs sample, statistical inference explained"
auto_link_terms: "statistical inference|inferential statistics|how statistical inference works|the logic of statistical inference|from sample to population|sample to population|statistical inference in R|drawing conclusions from data|statistical inference explained|logic of inference"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-26"
curriculum_id: "ST2-5.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "How Inference Works"
sidebar_order: "160"
difficulty: "Beginner"
---

<p class="lead">Statistical inference is how you use a small, manageable sample of data to make a confident, measured guess about a much larger group you could never fully measure. This guide builds the whole idea from the ground up, with no formulas, using simulations you run yourself.</p>

We will use base R for everything except two plots (which use ggplot2), and we will lean on one friendly trick: we will build a pretend world where we secretly know the true answer. That way, every time we make a guess from a sample, we can grade it against the truth and watch how inference actually behaves.

## What is statistical inference, in plain English?

Imagine a cook with a huge pot of soup. To judge whether the whole pot is seasoned right, the cook does not drink all of it. They give it one good stir, taste a single spoonful, and decide. That leap, from one spoonful to a verdict about the entire pot, is statistical inference.

In data terms, the pot is the **population**, everyone or everything you actually care about. The spoonful is the **sample**, the small part you can afford to look at. The true seasoning of the whole pot is a **parameter**, the real number you wish you knew. The seasoning you taste in your spoonful is a **statistic**, the number you actually measure. Inference is the art of using the statistic (the spoonful) to say something trustworthy about the parameter (the pot).

Let us watch the leap happen. We will build a whole city of 100,000 coffee drinkers, where each person drinks some number of cups per week. Because we are building this world, we get to peek at the true city-wide average, something you can almost never do in real life. Then we will pretend we are a market researcher who can only afford to ask 50 people, and see how close our sample guess lands.

```r title="Build a city and take one sample"
set.seed(2024)
city <- rpois(100000, lambda = 8)     # 100,000 people, cups of coffee per week
true_average <- mean(city)            # the real answer (normally invisible)

set.seed(11)
one_sample <- sample(city, size = 50) # ask just 50 people
sample_average <- mean(one_sample)    # our guess from those 50

round(c(truth = true_average, guess = sample_average), 2)
#> truth guess 
#>   8.0   7.8
```

Here is what just happened. We created a population of 100,000 numbers whose true average is 8.0 cups. We then drew 50 of those people at random and averaged only them. Our sample of 50 guessed 7.8 cups, without ever looking at the other 99,950 people.

![Statistical inference is the leap from a random sample to a measured guess about the whole population.](screenshots/How-Statistical-Inference-Works-the-leap.webp)

*Figure 1: Statistical inference is the leap from a random sample to a measured guess about the whole population.*

That gap between 8.0 and 7.8 is the entire subject in miniature. In the real world we would only ever see the 7.8. The 8.0 would stay hidden, which is exactly why we needed to invent a world where we can see both. Let us measure the miss directly.

```r title="Measure how far off the guess is"
round(sample_average - true_average, 2)
#> [1] -0.2
```

Our guess was off by two-tenths of a cup, a tiny amount. Fifty people out of a hundred thousand, and we nearly nailed the city average. That reliability is what makes surveys, polls, medical trials, and A/B tests possible. You do not need the whole pot; a good spoonful will do.

[KEY INSIGHT]
**Inference is the spoonful-to-pot leap, and the whole subject is about how good that leap is.** Everything else in this guide, variability, sample size, and uncertainty, is just a careful study of how much you can trust one spoonful.

**Try it:** Ask an even smaller group. Take a random sample of just 10 people from the city and see how close their average lands to the true 8 cups.

```r title="Your turn: guess from just 10 people"
# Goal: take a random sample of 10 from `city` and find its average.
# set.seed(10)
# ex_small <- sample(city, size = 10)
# round(mean(ex_small), 2)   # target: about 8.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ten-person guess solution"
set.seed(10)
ex_small <- sample(city, size = 10)
round(mean(ex_small), 2)
#> [1] 8.6
```

**Explanation:** Even 10 people land in the right neighborhood, near 8. A smaller sample is allowed to miss by more, which is a hint about what is coming next.

</details>

## Why not just measure everyone?

The honest answer is that you usually cannot. A national population is too large to interview. A blood test that used all of your blood would defeat its own purpose. Asking every possible customer would cost more than the decision is worth. So we sample out of pure necessity.

The good news is that we do not need everyone. A single well-stirred spoonful genuinely represents the pot. The catch is in the word *stirred*. If you only taste the thick stuff that settled at the bottom, your spoonful lies about the whole pot. In sampling, the equivalent of a good stir is picking people **at random**, so that every person has a fair chance of being chosen.

To feel why this matters, let us run two surveys of the same city. The first is lazy: it only asks the 50 heaviest coffee drinkers, the easy-to-find superfans. The second is fair: it picks 50 people completely at random.

```r title="A lazy survey versus a fair survey"
# Lazy survey: only ask the 50 heaviest coffee drinkers
heaviest <- sort(city, decreasing = TRUE)[1:50]
biased_guess <- mean(heaviest)

# Fair survey: 50 people picked at random
set.seed(303)
fair <- sample(city, 50)
fair_guess <- mean(fair)

round(c(truth = true_average, lazy_survey = biased_guess, fair_survey = fair_guess), 2)
#>       truth lazy_survey fair_survey 
#>        8.00       19.68        7.32
```

Look at how badly the lazy survey fails. It guessed 19.68 cups when the truth is 8.00, more than double. It was not unlucky; it was rigged from the start by only looking at extreme drinkers. The fair survey, using the same 50-person budget, landed at 7.32, close to the truth. The only difference was randomness in who got picked.

[WARNING]
**A bigger sample cannot rescue a biased one.** If your method systematically leaves people out, adding more people just gives you a larger, more confident wrong answer. Fixing the stir matters far more than making the spoon bigger. This is why careful [populations and sampling bias](Populations-Samples-and-Bias-in-R.html) choices come before any calculation.

**Try it:** Bias can tilt the other way too. Build a lazy survey from the 50 lightest drinkers instead and see how wrong it gets.

```r title="Your turn: survey the lightest drinkers"
# Goal: build a lazy survey from the 50 LIGHTEST coffee drinkers
# (sort city in ascending order, take the first 50), then average them.
# ex_lightest <- sort(city)[1:50]
# round(mean(ex_lightest), 2)   # target: about 0.28, far below the truth of 8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lightest-drinkers survey solution"
ex_lightest <- sort(city)[1:50]
round(mean(ex_lightest), 2)
#> [1] 0.28
```

**Explanation:** Cherry-picking the lightest drinkers is just as misleading as cherry-picking the heaviest, only in the opposite direction. Bias, not sample size, is what wrecks the guess.

</details>

## Why does every sample give a different answer?

If two friends each dip their own spoon into the same pot, they taste slightly different things. Neither is wrong; a spoonful is just a little bit random. The same is true of samples. Ask 50 random people today and 50 different random people tomorrow, and you will get two different averages. This bouncing around has a name: **sampling variability**.

Instead of taking one sample, let us take five thousand. Each one is 50 random people, and each produces its own guess about the city average. We will collect all five thousand guesses in one go and peek at the first eight.

```r title="Take 5,000 samples and collect their guesses"
set.seed(77)
guesses <- replicate(5000, mean(sample(city, size = 50)))
round(head(guesses, 8), 2)
#> [1] 7.86 8.14 7.48 8.90 7.96 7.92 7.92 7.62
```

The `replicate()` function simply repeats the "draw 50 people and average them" experiment 5,000 times and stores each answer. The first eight guesses range from 7.48 to 8.90. They are all in the same ballpark, clustered around 8, but no two are identical. That scatter is the sampling variability made visible.

Now let us look at all 5,000 guesses at once by measuring their spread: the smallest, the largest, and the typical distance from the middle.

```r title="Look at the spread of the guesses"
round(c(smallest = min(guesses), largest = max(guesses), typical_spread = sd(guesses)), 2)
#>       smallest        largest typical_spread 
#>           6.64           9.74           0.41
```

Across 5,000 tries, the guesses never fell below 6.64 or rose above 9.74, and a typical guess sat about 0.41 cups away from the center. So a single sample of 50 is not a precise instrument, but it is a reliable one: it lands near the truth, give or take about half a cup. A picture makes this unmistakable.

```r title="Plot the pile of 5,000 guesses"
library(ggplot2)

ggplot(data.frame(guesses), aes(guesses)) +
  geom_histogram(bins = 40, fill = "#6c5ce7", color = "white") +
  geom_vline(xintercept = true_average, linewidth = 1) +
  labs(title = "5,000 guesses from 5,000 different samples",
       x = "Sample average (cups per week)", y = "Number of samples")
```

When you run that block, you see a tidy bell-shaped hill of guesses, tallest right over the true value marked by the vertical line and thinning out on both sides. That pile has a formal name, the **sampling distribution**, but the picture is the point: the guesses are not scattered randomly, they form a predictable shape centered on the truth.

![Different samples from the same population give different guesses that pile up around the truth.](screenshots/How-Statistical-Inference-Works-sampling-variability.webp)

*Figure 2: Different samples from the same population give different guesses that pile up around the truth.*

[KEY INSIGHT]
**The wobble in your guess is predictable, bell-shaped, and centered on the truth.** That predictability is the hinge the entire field turns on. Because we know how much guesses bounce, we can say how much to trust any single one, which is the whole game of inference.

**Try it:** Bigger spoonfuls should wobble less. Repeat the experiment with samples of 200 people instead of 50 and measure the new spread.

```r title="Your turn: tighten the pile with bigger samples"
# Goal: repeat the experiment with samples of 200 (not 50), using 2,000
# draws, and measure the typical spread of the guesses.
# set.seed(200)
# ex_guesses <- replicate(2000, mean(sample(city, size = 200)))
# round(sd(ex_guesses), 3)   # target: about 0.2, roughly half of 0.41
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spread at size 200 solution"
set.seed(200)
ex_guesses <- replicate(2000, mean(sample(city, size = 200)))
round(sd(ex_guesses), 3)
#> [1] 0.2
```

**Explanation:** Quadrupling the sample from 50 to 200 roughly halves the spread, from about 0.41 to about 0.2. That relationship is exactly what the next section is about.

</details>

## How does a bigger sample make you more sure?

A bigger spoonful is a better miniature of the pot. Ask more people and their average clings more tightly to the truth, because one unusual person gets diluted by all the ordinary ones around them. We just saw a hint of this; now let us map it properly across four sample sizes.

For each size, we repeat the "draw a sample and average it" experiment two thousand times and record how much those guesses typically miss by. That typical miss is just the spread of the guesses we have been measuring all along.

```r title="Compare the wobble at four sample sizes"
set.seed(88)
spread_at <- function(n) sd(replicate(2000, mean(sample(city, n))))

sizes <- c(25, 50, 100, 400)
data.frame(sample_size = sizes,
           typical_miss = round(sapply(sizes, spread_at), 3))
#>   sample_size typical_miss
#> 1          25        0.568
#> 2          50        0.395
#> 3         100        0.281
#> 4         400        0.143
```

Read down the table and the pattern jumps out. At 25 people a guess typically misses by about 0.57 cups; at 400 people it misses by only about 0.14. More data means less wobble, exactly as intuition promised.

But notice the shape of the improvement. Going from 25 to 100 (four times the data) cut the miss roughly in half, from 0.57 to 0.28. Going from 100 to 400 (four times again) halved it once more, from 0.28 to 0.14. To double your precision, you need about four times the sample, not twice. Accuracy gets expensive.

[TIP]
**To halve your uncertainty, plan for roughly four times the sample, not double.** This is why polls of a few thousand people are common but polls of a few hundred thousand are rare. Past a point, extra precision is not worth the cost. Getting the size right is its own skill, covered in [sample size planning](Sample-Size-Planning-in-R.html).

**Try it:** Push the sample size higher still. Reuse the `spread_at()` helper to find the typical miss for a sample of 1,000 people.

```r title="Your turn: how tight at 1,000 people?"
# Goal: reuse spread_at() to find the typical miss for a sample of 1,000.
# set.seed(41)
# round(spread_at(1000), 3)   # target: about 0.091, even smaller than 0.143 at 400
```

<details>
<summary>Click to reveal solution</summary>

```r title="Typical miss at size 1,000 solution"
set.seed(41)
round(spread_at(1000), 3)
#> [1] 0.091
```

**Explanation:** The wobble keeps shrinking as the sample grows, but ever more slowly. Each extra person helps a little less than the one before.

</details>

## How do we put a number on our uncertainty?

Reporting a single number like "about 8 cups" hides something important: how sure are we? A far more honest report is a **range** plus a confidence level, such as "somewhere between 7.4 and 8.5, and we are quite sure." The beautiful part is that this range comes straight from the wobble we have already measured. We are not adding new machinery, just reading what the sampling distribution already told us.

Let us make the range concrete. We will take five thousand guesses from samples of 100 people, then find the band that holds the middle 95% of them, cutting off the lowest 2.5% and the highest 2.5%.

```r title="Find the middle 95% of all guesses"
set.seed(2025)
guesses_100 <- replicate(5000, mean(sample(city, size = 100)))
band <- quantile(guesses_100, c(0.025, 0.975))
round(band, 2)
#>  2.5% 97.5% 
#>  7.44  8.54
```

This says that 95% of all possible samples of 100 people produce a guess between 7.44 and 8.54 cups. The true value, 8, sits comfortably inside. So if someone hands you one sample of 100, you can expect its guess to land in that band almost every time.

In real life, though, you only get one sample, and you do not know the truth, so you cannot compute that band directly. Instead you use the typical wobble to build a range around your single guess. Let us first measure that wobble for samples of 100.

```r title="Measure the typical bounce at this size"
typical_miss <- sd(guesses_100)
round(typical_miss, 2)
#> [1] 0.28
```

A guess from 100 people typically bounces about 0.28 cups. A handy rule is to reach out about two typical-misses on each side of your guess, which covers roughly 95% of the bounce. Now the real test: if every researcher builds such a range around their own single guess, how many of those ranges actually capture the hidden truth? Let us build 100 of them and count.

```r title="Count how many ranges capture the truth"
set.seed(4242)
hits <- 0
for (i in 1:100) {
  sample_i <- sample(city, size = 100)
  guess_i  <- mean(sample_i)
  low_i    <- guess_i - 2 * typical_miss
  high_i   <- guess_i + 2 * typical_miss
  if (true_average >= low_i && true_average <= high_i) hits <- hits + 1
}
hits
#> [1] 95
```

Ninety-five out of a hundred. Each range was built from its own single sample, blind to the truth, yet 95 of them successfully bracketed the real answer of 8. That number is not a coincidence; it is what "95%" means. Let us see all 100 ranges at once.

```r title="Plot 100 ranges against the hidden truth"
set.seed(4242)
make_range <- function(i) {
  guess_i <- mean(sample(city, size = 100))
  data.frame(trial = i,
             guess = guess_i,
             low   = guess_i - 2 * typical_miss,
             high  = guess_i + 2 * typical_miss)
}
ranges <- do.call(rbind, lapply(1:100, make_range))
ranges$captures <- ranges$low <= true_average & ranges$high >= true_average

ggplot(ranges, aes(y = trial, color = captures)) +
  geom_segment(aes(x = low, xend = high, yend = trial)) +
  geom_point(aes(x = guess)) +
  geom_vline(xintercept = true_average, linewidth = 1) +
  scale_color_manual(values = c("TRUE" = "#6c5ce7", "FALSE" = "#d63031")) +
  labs(title = "100 samples, 100 ranges: about 95 capture the truth",
       x = "Estimated average (cups per week)", y = "Sample number")
```

The plot shows 100 horizontal ranges, each with its guess marked as a dot, and one vertical line at the true value. Almost all of the ranges cross that line. A handful, about five, miss it entirely and are colored red. Those unlucky few came from samples that happened to land far from the truth.

[KEY INSIGHT]
**"95% confident" is a statement about the method, not about any single range.** It means that if you repeated the whole procedure many times, about 95% of the ranges you built would contain the truth. Your one particular range either does or does not, you cannot know which, but the recipe that made it succeeds 95 times in 100. This is the exact idea behind a formal [confidence interval](Confidence-Intervals-in-R.html).

**Try it:** A bigger sample should give a narrower band. Build the middle-95% band from guesses of 400 people and compare it to the size-100 band of 7.44 to 8.54.

```r title="Your turn: a narrower band at size 400"
# Goal: build the middle-95% band from 5,000 guesses of size 400.
# set.seed(54)
# ex_guesses_400 <- replicate(5000, mean(sample(city, size = 400)))
# round(quantile(ex_guesses_400, c(0.025, 0.975)), 2)   # target: about 7.72 to 8.27
```

<details>
<summary>Click to reveal solution</summary>

```r title="Band at size 400 solution"
set.seed(54)
ex_guesses_400 <- replicate(5000, mean(sample(city, size = 400)))
round(quantile(ex_guesses_400, c(0.025, 0.975)), 2)
#>  2.5% 97.5% 
#>  7.72  8.27
```

**Explanation:** The band shrank from a width of about 1.1 cups (7.44 to 8.54) to about 0.55 cups (7.72 to 8.27). A bigger sample buys a more precise, more useful statement about the truth.

</details>

## What are the two big jobs of inference?

Now that you understand the wobble and the range, here is the payoff: almost everything statistical inference does is one of just two jobs. The first is **estimation**: pinning down what a value is, reported as a number plus a range. The second is **hypothesis testing**: deciding whether a specific claim or difference is real, or whether it is just the wobble playing tricks.

Let us do the estimation job first, using our fair sample of 50 people from earlier. We build a best guess and wrap a range around it using the typical wobble at that size.

```r title="Build an estimate and a range from one sample"
one_est <- mean(fair)                    # our fair sample of 50 from earlier

set.seed(99)
miss50 <- sd(replicate(3000, mean(sample(city, 50))))   # the wobble at size 50

low  <- one_est - 2 * miss50
high <- one_est + 2 * miss50
round(c(estimate = one_est, low = low, high = high), 2)
#> estimate      low     high 
#>     7.32     6.54     8.10
```

Our estimate is 7.32 cups, and our range runs from 6.54 to 8.10. That is the estimation job done: a value and an honest range around it. Now the testing job turns out to be the same range, read differently. Suppose three people each make a claim about the true city average: one says 8, one says 9, one says 10. Which claims can our sample rule out?

```r title="Check three possible claims against the range"
claims <- c(8, 9, 10)
data.frame(claim = claims,
           plausible = ifelse(claims >= low & claims <= high, "yes", "no"))
#>   claim plausible
#> 1     8       yes
#> 2     9        no
#> 3    10        no
```

The claim of 8 falls inside our range, so our sample cannot rule it out; it is plausible. The claims of 9 and 10 fall outside the range, so this sample gives us grounds to doubt them. That, in one small table, is the seed of every hypothesis test you will ever run: compare a claim against the range of what your data could plausibly produce.

![Every inference task is either estimation or hypothesis testing.](screenshots/How-Statistical-Inference-Works-two-jobs.webp)

*Figure 3: Every inference task is either estimation or hypothesis testing.*

[NOTE]
**A formal hypothesis test just measures surprise more precisely.** Instead of a simple in-or-out check, it computes exactly how unlikely your data would be if the claim were true. The intuition is identical to the table above. When you are ready for the full version, see [hypothesis testing](Hypothesis-Testing-in-R.html).

**Try it:** Test one more claim. Using the same range, check whether 7 could be the true city average.

```r title="Your turn: is 7 a plausible true average?"
# Goal: using the range low..high from the block above, check whether 7
# could be the true average.
# 7 >= low & 7 <= high   # target: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Is 7 plausible solution"
7 >= low & 7 <= high
#> [1] TRUE
```

**Explanation:** 7 sits inside the range, so on this evidence we cannot rule it out. A value like 5 would fall outside and could be ruled out. Your data narrows the field of believable answers rather than picking exactly one.

</details>

## The Complete Picture: Inference From Start to Finish

So far we invented our population. Let us prove the same logic works on a real dataset by treating R's built-in `iris` flowers as a population. We will hide from ourselves that we know all 150 flowers, sample just 20 of them, and run the full pipeline: estimate, range, and a check against the truth.

```r title="Run the whole pipeline on real data"
population <- iris$Sepal.Length     # treat all 150 flowers as the population
truth <- mean(population)           # peek at the real average sepal length (cm)

set.seed(1)
my_sample <- sample(population, size = 20)   # measure only 20 flowers
estimate  <- mean(my_sample)                 # our best guess

miss <- sd(replicate(3000, mean(sample(population, 20))))   # the wobble at size 20
low  <- estimate - 2 * miss
high <- estimate + 2 * miss

round(c(truth = truth, estimate = estimate, low = low, high = high), 2)
#>    truth estimate      low     high 
#>     5.84     5.89     5.55     6.23
```

Follow the story in the output. The true average sepal length across all 150 flowers is 5.84 cm, but we only allowed ourselves to see 20 flowers. From those 20 we estimated 5.89 cm, then built a range from 5.55 to 6.23. The truth of 5.84 sits inside our range. We used a sample to make a measured, honest statement about a population, and it worked, with no formulas anywhere in sight.

That is the complete arc of statistical inference: sample fairly, make a guess, quantify the wobble, wrap the guess in a range, and state your confidence in the method. Every advanced technique you will meet later is a more precise version of these same five moves.

## Practice Exercises

These combine several ideas from the guide. Each uses fresh variable names so it will not disturb the `city` and `true_average` values from earlier. Try each before opening the solution.

### Exercise 1: Grade your own guess

Draw a random sample of 30 people from the `city` population, estimate the true average from it, and check whether your estimate lands within 0.5 cups of the true value. Use `set.seed(500)` so your answer matches.

```r title="Exercise 1 starter"
# Goal: sample 30 from city, estimate the average, and test whether the
# estimate is within 0.5 of true_average.
# set.seed(500)
# cap_sample <- sample(city, size = 30)
# ...   # target: estimate about 8.17, within-0.5 check TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(500)
cap_sample <- sample(city, size = 30)
cap_est <- mean(cap_sample)
round(c(estimate = cap_est, truth = true_average, miss = cap_est - true_average), 2)
#> estimate    truth     miss 
#>     8.17     8.00     0.17

abs(cap_est - true_average) <= 0.5
#> [1] TRUE
```

**Explanation:** A sample of 30 guessed 8.17, missing the truth by only 0.17 cups, comfortably inside half a cup. Small samples can still be close; they just carry more wobble than large ones.

</details>

### Exercise 2: Show that bigger samples wobble less

Measure the typical miss for samples of 20 and compare it to samples of 200, using 2,000 repeats each. Use `set.seed(600)`. Which size wobbles less, and by roughly how much?

```r title="Exercise 2 starter"
# Goal: compute the typical miss (sd of the sample averages) for n = 20
# and for n = 200, with 2,000 repeats each.
# set.seed(600)
# miss20  <- sd(replicate(2000, mean(sample(city, 20))))
# ...   # target: about 0.619 at n=20 versus 0.197 at n=200
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(600)
miss20  <- sd(replicate(2000, mean(sample(city, 20))))
miss200 <- sd(replicate(2000, mean(sample(city, 200))))
round(c(miss_n20 = miss20, miss_n200 = miss200), 3)
#>  miss_n20 miss_n200 
#>     0.619     0.197
```

**Explanation:** Samples of 200 wobble about a third as much as samples of 20. Ten times the data cut the typical miss by roughly three times, another view of the "four times the sample to double precision" rule.

</details>

### Exercise 3: Build a range and test it

Build a 95%-style range for a fresh sample of 80 people (use `set.seed(700)` for the wobble and `set.seed(701)` for the sample), then check whether it captures the true average. In one sentence, explain what would happen if you repeated this for many samples.

```r title="Exercise 3 starter"
# Goal: estimate the wobble at n = 80, draw one sample of 80, build a range
# of estimate +/- two typical-misses, and test whether it captures true_average.
# set.seed(700)
# g80 <- replicate(3000, mean(sample(city, 80)))
# ...   # target: range about 7.20 to 8.47, captures truth = TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(700)
g80 <- replicate(3000, mean(sample(city, 80)))
m80 <- sd(g80)

set.seed(701)
s80 <- sample(city, 80)
e80 <- mean(s80)

cap_low  <- e80 - 2 * m80
cap_high <- e80 + 2 * m80
round(c(estimate = e80, low = cap_low, high = cap_high, truth = true_average), 2)
#> estimate      low     high    truth 
#>     7.84     7.20     8.47     8.00

true_average >= cap_low && true_average <= cap_high
#> [1] TRUE
```

**Explanation:** This range runs from 7.20 to 8.47 and captures the true 8.00. If you repeated the whole procedure for many fresh samples, about 95% of the ranges you built would capture the truth, which is exactly what a 95% confidence level promises.

</details>

## Frequently Asked Questions

### Is statistical inference the same as descriptive statistics?

No. Descriptive statistics summarize the data you actually have, such as the average of the 50 people you surveyed. Statistical inference uses that sample to make a measured claim about a larger population you did not measure, and it always comes with a statement of how uncertain that claim is.

### Does a 95% range mean there is a 95% chance the true value is inside it?

No, and this is the most common misunderstanding. The 95% describes the method: if you repeated the whole sample-and-build-a-range procedure many times, about 95% of the ranges would contain the truth. Your one particular range either contains the truth or it does not, so the 95% is the long-run hit rate of the recipe, not a probability about your single range.

### How big does my sample need to be?

It depends on how precise you need to be. Because the wobble shrinks with the square root of the sample size, you need roughly four times the data to cut your uncertainty in half. Past a point the extra precision is not worth the cost, which is why most polls stop at a few thousand people. See [sample size planning](Sample-Size-Planning-in-R.html) for how to choose a number.

### Can a bigger sample fix a biased one?

No. Bias is a systematic error in who gets picked, so drawing more people with the same flawed method just gives you a more confident wrong answer. The fix is a fair, random selection, not a larger one.

### What is the difference between a parameter and a statistic?

A parameter is the true value in the whole population, like the real city-wide average of 8 cups, and it is usually hidden from you. A statistic is the value you compute from your sample, like the 7.8 cups your 50 people averaged. Inference is the work of using the statistic to say something trustworthy about the parameter.

## Summary

Statistical inference is the disciplined leap from a small sample to a confident statement about a large population. You never need the whole pot; a fair spoonful, honestly measured, is enough. Here are the ideas to carry forward.

| Idea | Plain meaning |
|---|---|
| Population vs sample | The whole group you care about, versus the small part you actually measure. |
| Parameter vs statistic | The true value you want (hidden), versus the value your sample gives (seen). |
| Random sampling | The fair "stir" that makes a sample resemble the population; bias cannot be fixed by size. |
| Sampling variability | Every sample gives a slightly different guess; the guesses form a bell centered on the truth. |
| Sample size | More data means less wobble, but you need about four times the sample to double precision. |
| The range and 95% | Report a guess plus a range; "95% confident" describes the method's long-run hit rate, not one range. |
| The two jobs | Estimation finds a value with a range; hypothesis testing checks whether a claim fits that range. |

![The whole logic of statistical inference on one page.](screenshots/How-Statistical-Inference-Works-overview-mindmap.webp)

*Figure 4: The whole logic of statistical inference on one page.*

You now understand the engine behind confidence intervals, hypothesis tests, A/B tests, and polls, all without a single formula. When you meet the formulas later, they will simply be a faster way to compute the ranges and the surprise you just simulated by hand.

## References

1. Kass, R. E. Statistical Inference: The Big Picture. *Statistical Science*, 26(1), 2011. [Link](https://projecteuclid.org/journals/statistical-science/volume-26/issue-1/Statistical-Inference-The-Big-Picture/10.1214/10-STS337.full)
2. Diez, D., Barr, C., Cetinkaya-Rundel, M. *OpenIntro Statistics*, 4th Edition. Foundations for inference. [Link](https://www.openintro.org/book/os/)
3. Wasserman, L. *All of Statistics: A Concise Course in Statistical Inference*. Springer (2004). [Link](https://link.springer.com/book/10.1007/978-0-387-21736-9)
4. R Core Team. *An Introduction to R*, sampling and simulation. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
5. Wikipedia. Statistical inference. [Link](https://en.wikipedia.org/wiki/Statistical_inference)
6. Frost, J. Statistical Inference: Definition, Methods & Example. Statistics By Jim. [Link](https://statisticsbyjim.com/hypothesis-testing/statistical-inference/)

## Continue Learning

- [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html) explains why the pile of sample guesses always turns out bell-shaped, the fact that makes ranges work.
- [Confidence Intervals in R](Confidence-Intervals-in-R.html) is the formal, one-sample version of the range you built by simulation here.
- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html) turns the "real or just wobble?" question into a precise, repeatable procedure.
