---
title: "Sampling Methods in R: Random, Stratified, Cluster"
slug: "Sampling-Methods-in-R"
description: "Learn simple random, systematic, stratified, and cluster sampling in R with runnable code, and see how stratifying makes your sample estimates more precise."
keywords: "sampling methods in R, simple random sampling, stratified sampling in R, cluster sampling, systematic sampling, slice_sample, probability sampling, proportional allocation, multistage sampling"
auto_link_terms: "sampling methods in R|simple random sampling|stratified sampling|stratified random sample|cluster sampling|systematic sampling|probability sampling|multistage sampling|proportional allocation|slice_sample()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-25"
curriculum_id: "ST2-1.4"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Sampling Methods"
sidebar_order: "4"
difficulty: "Beginner"
---

<p class="lead">Sampling means measuring a small group so you can learn about a much larger group without surveying everyone. A sampling method is the rule you use to pick that small group. This guide covers the four methods you meet most often, simple random, systematic, stratified, and cluster, and shows you how to run each one in R, when to reach for it, and why the choice changes how good your answer is.</p>

Everything below runs on a small employee population we build in the first code block, using base R and the `dplyr` package. You can run every block right here in the page and change the numbers to experiment. No files to download.

## How do you draw a simple random sample in R?

The simplest fair way to pick a sample is to give every member of the group the same chance of being chosen. That is a simple random sample, and it is the baseline every other method is measured against. Let's build a small population of employees and draw one, so you can see the whole move in code before we name any of the parts.

The code below creates a data frame called `company` with 1000 employees. Each employee has a region, a team, and a satisfaction score from a survey. Then `slice_sample()` from dplyr picks 5 employees at random. Watch the output: it is 5 rows pulled from the 1000, with no pattern to who got picked.

```r title="Build a population and take a random sample"
suppressMessages(library(dplyr))

# Build a population of 1000 employees across three regions of unequal size
set.seed(2026)
region <- rep(c("East", "Central", "West"), times = c(500, 300, 200))
team   <- paste0("T", sprintf("%02d", rep(1:50, each = 20)))
region_mean  <- c(East = 70, Central = 60, West = 50)
satisfaction <- round(rnorm(1000, mean = region_mean[region], sd = 8))
company <- tibble(id = 1:1000, region = region, team = team, satisfaction = satisfaction)

# Draw a simple random sample of 5 employees
set.seed(1)
slice_sample(company, n = 5)
#> # A tibble: 5 × 4
#>      id region  team  satisfaction
#>   <int> <chr>   <chr>        <dbl>
#> 1   836 West    T42             27
#> 2   679 Central T34             51
#> 3   129 East    T07             74
#> 4   930 West    T47             61
#> 5   509 Central T26             60
```

Here is what just happened, line by line. `set.seed(2026)` fixes the random number generator so the population comes out the same for you as it did for me. `rep()` builds the region column: 500 in East, 300 in Central, 200 in West. `rnorm()` gives each person a satisfaction score that depends on their region. Then `set.seed(1)` resets the generator again, and `slice_sample(company, n = 5)` returns 5 randomly chosen rows.

The practical takeaway is that those 5 employees were chosen by pure chance. Nobody's satisfaction score, region, or team made them more or less likely to appear. That is the defining feature of a simple random sample, and it is why the sample tends to look like the population in miniature.

[KEY INSIGHT]
**Equal chance is what buys representativeness on average.** Because every employee is equally likely to be picked, high and low scores get pulled in at the same rate they occur in the population, so the sample average lands near the true average without you having to steer it.

Base R has done this since long before dplyr existed. The `sample()` function picks random positions without replacement (no employee is picked twice), and you use those positions to subset the data. It gives you the same kind of result.

```r title="Draw the same sample with base R"
# Base R: sample 5 row positions without replacement, then subset those rows
set.seed(1)
idx <- sample(nrow(company), size = 5)
company[idx, ]
#> # A tibble: 5 × 4
#>      id region  team  satisfaction
#>   <int> <chr>   <chr>        <dbl>
#> 1   836 West    T42             27
#> 2   679 Central T34             51
#> 3   129 East    T07             74
#> 4   930 West    T47             61
#> 5   509 Central T26             60
```

Notice the rows are identical to the dplyr version. That is not a coincidence. `slice_sample()` is a tidy wrapper around the same idea: pick random row positions, then return those rows. Use whichever style fits the rest of your code. We will lean on `slice_sample()` from here because it drops straight into a dplyr pipeline.

Often you want a fraction of the data rather than a fixed count. The `prop` argument does that. Here we take 10 percent of the 1000 employees, which is 100 people.

```r title="Sample a fixed fraction of rows"
# Take 10 percent of the population instead of a fixed count
set.seed(3)
srs_frac <- slice_sample(company, prop = 0.10)
nrow(srs_frac)
#> [1] 100
```

The `prop = 0.10` argument means "give me 10 percent of the rows," so `nrow()` confirms 100 employees came back. Fixed count with `n` or a fraction with `prop`, both are simple random sampling. You just picked the size differently.

**Try it:** Draw a simple random sample of 8 employees from `company` and confirm the size with `nrow()`. Use `slice_sample()`.

```r title="Your turn: draw 8 employees at random"
# Fill in the sample size, then run.
# ex_srs <- slice_sample(company, n = ___)
# nrow(ex_srs)
# Expected: 8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Simple random sample of 8 solution"
set.seed(8)
ex_srs <- slice_sample(company, n = 8)
nrow(ex_srs)
#> [1] 8
```

**Explanation:** `slice_sample(company, n = 8)` returns 8 randomly chosen rows, and `nrow()` counts them. The `set.seed()` line just makes the draw repeatable.

</details>

## What is systematic sampling, and how do you do it in R?

Simple random sampling needs a random draw for every unit you pick. Systematic sampling is a lighter-weight cousin: you line the population up in some order, pick one random starting point, then take every k-th unit from there. It is popular when items arrive in a stream, like every 20th product off a line or every 10th visitor through a door.

The step size `k` is the population size divided by the sample size. For 1000 employees and a target of 50, `k` is 20. You then pick a random start between 1 and 20 and grab positions like 10, 30, 50, and so on. The code computes the step, picks the start, and builds the row positions with `seq()`.

```r title="Draw a systematic sample every k-th row"
# Systematic sample: N = 1000, we want n = 50, so the step k = N / n = 20
N <- nrow(company); n <- 50
k <- N %/% n
set.seed(7)
start <- sample(1:k, 1)
idx_sys <- seq(from = start, by = k, length.out = n)
sys_sample <- company[idx_sys, ]
c(start = start, step = k, rows = nrow(sys_sample))
#> start  step  rows 
#>    10    20    50 
```

Reading the output: the random start landed on position 10, so with a step of 20 we collected 50 rows. So this sample is employees at positions 10, 30, 50, and onward to 990. The only randomness was choosing where to start; everything after that is mechanical.

Because our population is ordered by region, taking every 20th person spreads the sample evenly across the whole ordered list. Let's check how the regions came out.

```r title="Check the systematic sample's region mix"
count(sys_sample, region)
#> # A tibble: 3 × 2
#>   region      n
#>   <chr>   <int>
#> 1 Central    15
#> 2 East       25
#> 3 West       10
```

The systematic sample landed 25 East, 15 Central, 10 West employees. That matches the population split of 500, 300, 200 almost perfectly. When the ordering has no hidden pattern, systematic sampling behaves a lot like simple random sampling and costs less effort.

[WARNING]
**Systematic sampling breaks when the list has a repeating cycle that matches your step.** If employees were sorted so that every 20th one is a team lead, a step of 20 would hand you a sample of all leads or no leads. Shuffle the order first, or use simple random sampling, whenever the sort order might line up with your step.

**Try it:** Draw a systematic sample of 100 employees. Work out the step `k` as `nrow(company) %/% 100`, pick a random start, then take every k-th row. Report the step and the number of rows.

```r title="Your turn: systematic sample of 100"
# ex_k <- nrow(company) %/% 100        # work out the step
# set.seed(11)
# ex_start <- sample(1:ex_k, 1)        # random start in 1..k
# ex_sys <- company[seq(ex_start, by = ex_k, length.out = 100), ]
# c(step = ex_k, rows = nrow(ex_sys))
# Expected: step 10, rows 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Systematic sample of 100 solution"
ex_n <- 100
ex_k <- nrow(company) %/% ex_n
set.seed(11)
ex_start <- sample(1:ex_k, 1)
ex_sys <- company[seq(ex_start, by = ex_k, length.out = ex_n), ]
c(step = ex_k, rows = nrow(ex_sys))
#> step rows 
#>   10  100 
```

**Explanation:** A bigger sample means a smaller step. For 100 out of 1000 the step drops to 10, so you take every 10th employee.

</details>

## How does stratified sampling work in R?

Sometimes you have subgroups you must represent no matter what, like regions or age bands. Stratified sampling guarantees it. You split the population into groups called strata, then draw a random sample inside each stratum. No stratum can be missed, because you sample from every one.

In dplyr this is a two-verb move. `group_by(region)` tells dplyr to treat each region separately, and `slice_sample()` then draws inside each group. The `|>` between the lines is the pipe: it feeds the result of each line into the next, so you read the steps top to bottom. The `ungroup()` at the end clears the grouping so later steps behave normally. Here we take 10 percent of each region.

```r title="Draw a proportional stratified sample"
set.seed(42)
strat_prop <- company |>
  group_by(region) |>
  slice_sample(prop = 0.10) |>
  ungroup()
count(strat_prop, region)
#> # A tibble: 3 × 2
#>   region      n
#>   <chr>   <int>
#> 1 Central    30
#> 2 East       50
#> 3 West       20
```

Ten percent of each region gives 50 from East, 30 from Central, and 20 from West, for 100 in total. Because each region contributes the same fraction, the big regions send more people and the small ones send fewer. This is called proportional allocation, and it keeps the sample's group sizes in step with the population's.

Does the sample really mirror the population? Let's put the two side by side. `prop.table(table(...))` turns raw counts into shares that add to 1.

```r title="Compare sample and population proportions"
# Population share of each region vs the stratified sample's share
pop_share    <- prop.table(table(company$region))
sample_share <- prop.table(table(strat_prop$region))
round(rbind(population = pop_share, sample = sample_share), 3)
#>            Central East West
#> population     0.3  0.5  0.2
#> sample         0.3  0.5  0.2
```

The two rows are identical: 30 percent Central, 50 percent East, 20 percent West, in both the population and the sample. Proportional stratified sampling locks the group shares in place. A simple random sample would land close to these shares but wobble a little from draw to draw; stratifying removes that wobble.

You do not have to match the population shares. Sometimes you want the same number from each group, for example to compare regions on equal footing. That is equal allocation: just pass a fixed `n` instead of `prop`.

```r title="Draw an equal-size stratified sample"
set.seed(42)
strat_equal <- company |>
  group_by(region) |>
  slice_sample(n = 30) |>
  ungroup()
count(strat_equal, region)
#> # A tibble: 3 × 2
#>   region      n
#>   <chr>   <int>
#> 1 Central    30
#> 2 East       30
#> 3 West       30
```

Now every region contributes exactly 30 people, even though West has far fewer employees than East. Equal allocation is great for comparing groups, but the sample no longer mirrors the population, so you would need to weight the groups back to their true sizes before making a population-wide estimate.

[TIP]
**Always ungroup() after a grouped slice_sample().** If you forget, later verbs like `mutate()` or `summarise()` silently keep running per region, which can produce puzzling results three steps downstream.

The formula behind proportional allocation is short. If you want stratum `h` to get its fair share, set its sample size to the total sample size times the stratum's share of the population.

$$n_h = n \times \frac{N_h}{N}$$

Where:

- $n_h$ = how many to sample from stratum $h$
- $n$ = total sample size you want
- $N_h$ = number of people in stratum $h$ in the population
- $N$ = total population size

If you are not interested in the formula, skip it. Passing `prop` to `slice_sample()` does this arithmetic for you.

**Try it:** Draw a proportional stratified sample of 5 percent from each region and count how many came from each. Use `group_by()` and `slice_sample(prop = ...)`.

```r title="Your turn: 5 percent from each region"
# ex_strat <- company |>
#   group_by(region) |>
#   slice_sample(prop = ___) |>
#   ungroup()
# count(ex_strat, region)
# Expected: Central 15, East 25, West 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Proportional 5 percent solution"
set.seed(5)
ex_strat <- company |> group_by(region) |> slice_sample(prop = 0.05) |> ungroup()
count(ex_strat, region)
#> # A tibble: 3 × 2
#>   region      n
#>   <chr>   <int>
#> 1 Central    15
#> 2 East       25
#> 3 West       10
```

**Explanation:** Five percent of 300, 500, and 200 is 15, 25, and 10, so the sample keeps the region proportions exactly.

</details>

## Why does stratified sampling give more precise estimates?

We keep saying stratified sampling is "more precise." Rather than assert it, let's measure it. Precision here means how much your estimate jumps around if you were to repeat the whole sampling process many times. A precise method gives nearly the same answer every time; a noisy one swings widely.

First, the target. The whole point of a sample is to estimate something about the population, so let's compute the true average satisfaction we are trying to hit.

```r title="Find the true population mean"
# The true population mean we are trying to estimate
mu <- mean(company$satisfaction)
round(mu, 2)
#> [1] 63.12
```

The true average is 63.12. In real life you never get to see this number, which is exactly why you sample. Now we run a fair race. We draw 1000 simple random samples of 100 people, and 1000 proportional stratified samples of 100 people, and record the mean satisfaction each time. Then we compare how much each method's estimates spread out.

```r title="Compare SRS and stratified over 1000 samples"
set.seed(99)
reps <- 1000
srs_means <- replicate(reps, mean(slice_sample(company, n = 100)$satisfaction))
strat_means <- replicate(reps, {
  s <- company |> group_by(region) |> slice_sample(prop = 0.10) |> ungroup()
  mean(s$satisfaction)
})
round(c(srs_sd = sd(srs_means), strat_sd = sd(strat_means)), 3)
#>   srs_sd strat_sd 
#>    1.073    0.762 
```

The standard deviation of the 1000 estimates is the spread we care about. Simple random sampling scattered its estimates with a standard deviation of 1.073, while stratified sampling scattered its estimates by only 0.762. A smaller number means the estimates cluster tighter around the truth. Let's express that as a percentage.

```r title="How much does stratifying reduce the spread"
# Fraction by which stratifying shrinks the spread of the estimate
round(1 - sd(strat_means) / sd(srs_means), 3)
#> [1] 0.29
```

Stratifying cut the spread of the estimate by 29 percent, using the exact same sample size of 100. That is a free precision gain, bought only by organizing the draw by region instead of ignoring region.

[KEY INSIGHT]
**Stratifying pays off exactly when the strata averages differ.** Our regions have very different satisfaction levels, so pinning down each region's share removes a big source of variation from the overall estimate. If every region had the same average, stratifying would buy you almost nothing.

**Try it:** The spread also shows up in the range. Compute the range (max minus min) of `srs_means` and of `strat_means` and compare. Use `diff(range(...))`.

```r title="Your turn: compare the range of estimates"
# ex_ranges <- c(srs = diff(range(srs_means)), strat = diff(range(strat_means)))
# round(ex_ranges, 3)
# Expected: srs range wider than strat range
```

<details>
<summary>Click to reveal solution</summary>

```r title="Range of estimates solution"
ex_ranges <- c(srs = diff(range(srs_means)), strat = diff(range(strat_means)))
round(ex_ranges, 3)
#>   srs strat 
#>  6.55  4.99 
```

**Explanation:** Across 1000 samples, the simple random estimates spanned 6.55 points while the stratified estimates spanned only 4.99. The stratified method is steadier by every measure of spread.

</details>

## What is cluster sampling, and how is it different from stratified?

Stratified and cluster sampling both start by splitting the population into groups, which makes them easy to confuse. The difference is what you do next. Stratified sampling draws a few units from every group. Cluster sampling picks a few whole groups at random and takes everyone inside them.

![Stratified sampling draws from every group; cluster sampling picks whole groups and takes everyone in them.](screenshots/Sampling-Methods-in-R-stratified-vs-cluster.webp)

*Figure 1: Stratified sampling draws from every group; cluster sampling picks whole groups and takes everyone in them.*

You reach for cluster sampling when the groups are natural units that are expensive or slow to reach one by one, like schools or city blocks. It is far cheaper to visit 10 schools and survey everyone there than to chase 300 students scattered across 200 schools. In our data, teams are natural clusters. Let's pick 10 of the 50 teams at random and take every employee in them.

```r title="Draw a one-stage cluster sample"
# Teams are natural clusters. Pick 10 of the 50 teams, then take everyone in them.
set.seed(123)
chosen_teams <- sample(unique(company$team), size = 10)
cluster_sample <- company |> filter(team %in% chosen_teams)
c(teams = length(chosen_teams), people = nrow(cluster_sample))
#>  teams people 
#>     10    200 
```

We selected 10 teams, and because every team has 20 people, that gave us 200 employees. The random draw was over teams, not people. Once a team was chosen, all 20 of its members came along automatically.

There is a catch, and it is the whole reason cluster sampling is different from stratified. Because we only visited 10 of the 50 teams, the regions can come out lopsided. Let's look.

```r title="See which regions the clusters landed in"
count(cluster_sample, region)
#> # A tibble: 3 × 2
#>   region      n
#>   <chr>   <int>
#> 1 Central    60
#> 2 East       80
#> 3 West       60
```

Compare this to the population shares of 30 percent Central, 50 percent East, 20 percent West. The cluster sample came out 30, 40, 30 percent instead, over-representing West and under-representing East. Cluster sampling gives no guarantee that subgroups stay balanced, which is the opposite of what stratified sampling promises.

[NOTE]
**Cluster sampling trades precision for cost.** People in the same team tend to resemble each other, so each extra person from a chosen team adds less new information than a fresh random person would. You save money and effort, but your estimate is usually noisier for the same number of responses. We measure exactly how much noisier in the practice exercises.

**Try it:** Draw a cluster sample of 5 teams and count how many people it contains. Use `sample()` to pick the teams, then `filter()`.

```r title="Your turn: cluster sample of 5 teams"
# set.seed(21)
# ex_teams <- sample(unique(company$team), size = 5)
# ex_cluster <- company |> filter(team %in% ex_teams)
# c(teams = length(ex_teams), people = nrow(ex_cluster))
# Expected: 5 teams, 100 people
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cluster sample of 5 teams solution"
set.seed(21)
ex_teams <- sample(unique(company$team), size = 5)
ex_cluster <- company |> filter(team %in% ex_teams)
c(teams = length(ex_teams), people = nrow(ex_cluster))
#>  teams people 
#>      5    100 
```

**Explanation:** Five teams of 20 give exactly 100 people. You chose 5 clusters at random and took all their members.

</details>

## How do you choose the right sampling method?

You now have four tools. Picking between them comes down to two questions: are your natural groups costly to reach, and do you have subgroups you must represent? The guide below walks you through it.

![A quick decision guide for picking a sampling method.](screenshots/Sampling-Methods-in-R-decision-guide.webp)

*Figure 2: A quick decision guide for picking a sampling method.*

Here is the same advice as a table you can scan, with the trade-off each method makes.

| Method | How it picks | Best when | Precision | Cost |
|---|---|---|---|---|
| Simple random | Every unit an equal chance | You have a clean list of everyone | Good | Higher |
| Systematic | Every k-th unit after a random start | Units arrive in a stream | Good, if no cycle | Low |
| Stratified | Sample within every subgroup | Subgroups differ and must be shown | Best | Medium |
| Cluster | Take whole groups at random | Groups are costly or scattered to reach | Lower | Lowest |

Real surveys often combine these into multistage sampling. You cluster first to save travel, then sample inside each chosen cluster instead of surveying everyone, which cuts cost twice. The code below does two stages: pick 8 teams, then sample 5 people from each of those teams.

```r title="Draw a two-stage (multistage) sample"
# Stage 1: pick 8 teams at random. Stage 2: sample 5 people inside each chosen team.
set.seed(2025)
stage1 <- sample(unique(company$team), size = 8)
multistage <- company |>
  filter(team %in% stage1) |>
  group_by(team) |>
  slice_sample(n = 5) |>
  ungroup()
c(teams = length(stage1), people = nrow(multistage))
#>  teams people 
#>      8     40 
```

Stage 1 chose 8 teams with `sample()`. Stage 2 grouped by team and drew 5 people from each with `slice_sample(n = 5)`, for 40 people in all. You visit only 8 teams instead of all 50, and within each you talk to 5 people instead of all 20. That is a large saving in effort.

[KEY INSIGHT]
**Stratified versus cluster, in one line: strata mean you sample within all groups for balance, clusters mean you sample whole groups for cheapness.** Multistage sampling is just cluster sampling with a second random draw inside each chosen cluster.

**Try it:** Build a two-stage sample that picks 6 teams and then 4 people from each. Report the number of teams and total people.

```r title="Your turn: two-stage sample, 6 teams x 4 people"
# set.seed(31)
# ex_stage1 <- sample(unique(company$team), size = 6)
# ex_multi <- company |> filter(team %in% ex_stage1) |>
#   group_by(team) |> slice_sample(n = 4) |> ungroup()
# c(teams = length(ex_stage1), people = nrow(ex_multi))
# Expected: 6 teams, 24 people
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-stage 6 by 4 solution"
set.seed(31)
ex_stage1 <- sample(unique(company$team), size = 6)
ex_multi <- company |> filter(team %in% ex_stage1) |> group_by(team) |> slice_sample(n = 4) |> ungroup()
c(teams = length(ex_stage1), people = nrow(ex_multi))
#>  teams people 
#>      6     24 
```

**Explanation:** Six teams times 4 people each is 24 responses, gathered from only 6 site visits.

</details>

## Complete Example

Let's put the pieces together in a task you might actually get: survey 100 of the 1000 employees, and make sure each region is represented in proportion to its size. This is proportional stratified sampling from start to finish.

First, plan the allocation. We count how many employees are in each region, then work out each region's share of 100.

```r title="Plan a proportional stratified survey of 100 employees"
# Goal: survey 100 of the 1000 employees, allocated proportional to region size
alloc <- company |>
  count(region, name = "N_h") |>
  mutate(n_h = round(100 * N_h / sum(N_h)))
alloc
#> # A tibble: 3 × 3
#>   region    N_h   n_h
#>   <chr>   <int> <dbl>
#> 1 Central   300    30
#> 2 East      500    50
#> 3 West      200    20
```

The plan says survey 50 from East, 30 from Central, 20 from West. Since those are exactly 10 percent of each region, we can draw the survey by taking `prop = 0.10` within each region, and the counts will match the plan.

```r title="Draw the survey sample using the plan"
set.seed(808)
survey <- company |>
  group_by(region) |>
  slice_sample(prop = 0.10) |>
  ungroup()
count(survey, region)
#> # A tibble: 3 × 2
#>   region      n
#>   <chr>   <int>
#> 1 Central    30
#> 2 East       50
#> 3 West       20
```

The drawn sample matches the plan exactly: 50 East, 30 Central, 20 West. Now we use the survey to estimate the population's average satisfaction and attach a rough standard error, which measures how far off the estimate might be.

```r title="Estimate mean satisfaction from the survey"
# Estimate the population mean and a rough standard error from the survey
est <- mean(survey$satisfaction)
se  <- sd(survey$satisfaction) / sqrt(nrow(survey))
round(c(estimate = est, std_error = se, truth = mean(company$satisfaction)), 2)
#>  estimate std_error     truth 
#>     62.15      1.19     63.12 
```

The survey estimated average satisfaction at 62.15, and the truth is 63.12. The estimate is within about one standard error of the real value, which is exactly the kind of accuracy a well-designed sample of 100 should give you. You learned the whole population's satisfaction by measuring one in ten employees, with the regions kept in balance the entire way.

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution. The code uses `my_` names so it will not clash with the tutorial's variables.

### Exercise 1: Verify a stratified sample matches the population

Draw a proportional stratified sample of 15 percent from each region, then prove the sample's region shares match the population's shares. Build a two-row table of shares, one row for the population and one for the sample.

```r title="Exercise 1 starter"
# Hint: slice_sample(prop = 0.15) inside group_by(region), then
# compare prop.table(table(...)) for company and for your sample.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(303)
my_strat <- company |> group_by(region) |> slice_sample(prop = 0.15) |> ungroup()
my_check <- rbind(
  population = round(prop.table(table(company$region)), 3),
  sample     = round(prop.table(table(my_strat$region)), 3)
)
my_check
#>            Central East West
#> population     0.3  0.5  0.2
#> sample         0.3  0.5  0.2
```

**Explanation:** Proportional allocation forces the sample shares to equal the population shares, so both rows read 0.3, 0.5, 0.2. This is the guarantee stratified sampling gives you and simple random sampling does not.

</details>

### Exercise 2: Measure the precision cost of cluster sampling

Run a small simulation to compare precision. Over 500 repeats, draw a simple random sample of 100 people and a cluster sample of 5 teams (also 100 people), record the mean satisfaction each time, and compare the standard deviation of the two sets of estimates. Which method is noisier?

```r title="Exercise 2 starter"
# Hint: use replicate(500, ...). For the cluster arm, sample 5 teams then
# average satisfaction over everyone in those teams.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(404)
sim <- 500
srs_est <- replicate(sim, mean(slice_sample(company, n = 100)$satisfaction))
clus_est <- replicate(sim, {
  tms <- sample(unique(company$team), size = 5)   # 5 teams x 20 = 100 people
  mean(company$satisfaction[company$team %in% tms])
})
round(c(srs_sd = sd(srs_est), cluster_sd = sd(clus_est)), 3)
#>     srs_sd cluster_sd 
#>      1.050      3.485 
```

**Explanation:** With the same 100 people, cluster sampling scattered its estimates more than three times as widely as simple random sampling (3.485 versus 1.050). That is the precision you pay for the convenience of visiting only 5 teams.

</details>

### Exercise 3: Estimate from a multistage sample

Draw a two-stage sample: pick 6 teams, then 8 people from each. Estimate the population's mean satisfaction from your 48 responses and compare it to the true mean of 63.12. Do not be surprised if it is off by a few points.

```r title="Exercise 3 starter"
# Hint: filter to 6 sampled teams, group_by(team), slice_sample(n = 8),
# then mean() the satisfaction column.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(505)
stage1_c <- sample(unique(company$team), size = 6)
my_multi <- company |> filter(team %in% stage1_c) |> group_by(team) |> slice_sample(n = 8) |> ungroup()
round(c(estimate = mean(my_multi$satisfaction), truth = mean(company$satisfaction), people = nrow(my_multi)), 2)
#> estimate    truth   people 
#>    67.79    63.12    48.00 
```

**Explanation:** This draw estimated 67.79 against a truth of 63.12, a miss of about 4.7 points from just 48 people spread over 6 teams. That gap is the precision cost from Exercise 2 showing up in a single sample: fewer clusters means a noisier answer. More teams, or a larger sample, would tighten it.

</details>

## Frequently Asked Questions

**What is the difference between stratified and cluster sampling?**
Stratified sampling draws a few units from every group, so all groups are represented. Cluster sampling picks a few whole groups at random and takes everyone in them, so some groups are left out entirely. Use strata for balance and precision, clusters to save cost when groups are hard to reach.

**Should I use slice_sample() or sample_n() and sample_frac()?**
Use `slice_sample()`. The older `sample_n()` and `sample_frac()` still work but have been superseded in modern dplyr, and `slice_sample()` covers both with the `n` and `prop` arguments.

**Is systematic sampling a probability sample?**
Yes, as long as the starting point is chosen at random, every unit has a known chance of selection. The one thing to watch is periodicity: if the list repeats on a cycle equal to your step size, the sample can be biased, so shuffle the order when in doubt.

**Do I always need set.seed()?**
Only when you want the exact same random draw again, which is useful for reproducible reports and for debugging. Set a seed before any random step. In a real one-off survey you can skip it, since you draw the sample once.

**Does stratified sampling always beat simple random sampling?**
It helps most when the strata have different averages, as our regions do. If the groups are nearly identical on the thing you are measuring, stratifying adds effort for little precision gain. It never hurts precision, though, so it is a safe default when you have meaningful subgroups.

**How large should my sample be?**
That depends on how precise you need the answer and how much the population varies. Sample size planning is its own topic, but the pattern you saw holds: bigger samples and smarter designs like stratification both shrink the spread of your estimate.

## Summary

Sampling lets you answer questions about a large population by measuring a small slice of it. The method you pick decides how representative and how precise that slice is.

![The four sampling methods at a glance, all starting from one population.](screenshots/Sampling-Methods-in-R-methods-overview.webp)

*Figure 3: The four sampling methods at a glance, all starting from one population.*

| Method | One-line how | Best when |
|---|---|---|
| Simple random | `slice_sample(n =)` or `sample()` picks at random | You have a full list and want a fair baseline |
| Systematic | Every k-th unit after a random start | Units stream past in some order |
| Stratified | `group_by()` then `slice_sample()` inside each group | You must represent subgroups and want precision |
| Cluster | `sample()` whole groups, then `filter()` to them | Groups are costly or scattered to reach |

Key things to carry forward:

- Simple random sampling gives every unit an equal chance and is the baseline for everything else.
- Systematic sampling is cheaper but assumes the ordering has no hidden cycle.
- Stratified sampling represents every subgroup and tightened our estimate by 29 percent for free.
- Cluster sampling saves cost by taking whole groups, at the price of lower precision.
- Multistage sampling chains these together, most often clustering first, then sampling inside each cluster.

## References

1. dplyr documentation. slice_sample() and the slice family reference. The canonical docs for slice_sample() and its `n`, `prop`, and `weight_by` arguments. [Link](https://dplyr.tidyverse.org/reference/slice.html)
2. dplyr documentation. group_by() reference. Explains how grouping makes slice_sample() draw within each stratum. [Link](https://dplyr.tidyverse.org/reference/group_by.html)
3. R Core Team. An Introduction to R, section on the sample() function. The base R sample() function used here for row positions and for picking clusters. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
4. Wickham, H., Cetinkaya-Rundel, M., and Grolemund, G. R for Data Science, 2nd Edition. A practical, beginner-friendly introduction to dplyr and the tidyverse workflow. [Link](https://r4ds.hadley.nz/)
5. Simple random sample. Wikipedia. A plain-language definition of simple random sampling and its properties. [Link](https://en.wikipedia.org/wiki/Simple_random_sample)
6. Stratified sampling. Wikipedia. Background on strata, proportional versus equal allocation, and the variance reduction. [Link](https://en.wikipedia.org/wiki/Stratified_sampling)
7. Cluster sampling. Wikipedia. More depth on the cost-precision trade-off and the design effect. [Link](https://en.wikipedia.org/wiki/Cluster_sampling)

## Continue Learning

- [Populations, Samples and Sampling Bias in R](Populations-Samples-and-Bias-in-R.html): the why behind sampling, and how a bad sampling method quietly distorts your answer.
- [Types of Data in Statistics: Categorical to Continuous](Types-of-Data-in-Statistics.html): what kind of variable you are sampling shapes how you summarize it.
- [What Statistics Is For: Questions, Evidence, Decisions](What-Statistics-Is-For.html): where sampling fits in the bigger job of learning from data.
