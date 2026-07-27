---
title: "Capstone: A Survey Analysis End to End in R"
slug: "Survey-Analysis-Capstone-in-R"
description: "Analyze survey data end to end in R: post-stratification weighting, Likert diverging bars, Cronbach's alpha, group tests with effect sizes, and the report."
keywords: "survey analysis in R, post-stratification weighting, Likert scale analysis R, Cronbach's alpha R, diverging stacked bar R, survey response rate, effect size R, employee engagement survey R"
auto_link_terms: "survey analysis in R|survey data analysis|analyzing survey data|post-stratification|post-stratification weighting|survey weighting|Likert scale analysis|Likert data|diverging stacked bar|top-two-box|survey response rate|employee engagement survey|weighting survey data|survey capstone"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-27"
curriculum_id: "ST2-13.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Survey Analysis Capstone"
sidebar_order: "180"
difficulty: "Advanced"
---

<p class="lead">A survey analysis is not one test, it is a pipeline. You recap the design, explore the responses, weight them so they reflect the real population, summarise Likert items without misleading anyone, check whether the scale holds together, compare groups with honest effect sizes, and hand a leader a report they can act on. This capstone walks the whole pipeline on one reproducible employee-engagement survey, and it builds the weights, the reliability score, and the effect sizes by hand so you can see exactly what each number means.</p>

## What did this survey measure, and who actually answered it?

Picture a company of 1,000 people. HR emails an engagement survey to everyone, and about 600 reply. That gap is the first trap of survey work: the people who reply are rarely a fair copy of the people who were asked. Before you analyze a single answer, you need to know who was invited, who answered, and how the two differ. We rebuild the whole survey from a known population so that every figure on this page is reproducible and you can trust where it came from. Everything here uses base R plus a little dplyr and tidyr, all stated as we go.

Start with the sampling frame: the full workforce, split by department, with the headcount HR keeps on file. These department counts are our known population margins, and they will matter a lot once we weight.

```r title="The workforce by department"
library(dplyr)
library(tidyr)
dept_levels <- c("Engineering", "Sales", "Support", "Operations", "People")
population <- data.frame(
  department = dept_levels,
  headcount  = c(400, 250, 200, 100, 50)
)
population$pop_share <- population$headcount / sum(population$headcount)
population
#>    department headcount pop_share
#> 1 Engineering       400      0.40
#> 2       Sales       250      0.25
#> 3     Support       200      0.20
#> 4  Operations       100      0.10
#> 5      People        50      0.05
```

Engineering is 40% of the company, People (the HR team) just 5%. Hold onto those shares. If the survey respondents do not match them, our headline numbers will quietly tilt toward whichever department shows up the most.

![The seven stages of an end-to-end survey analysis.](screenshots/Survey-Analysis-Capstone-in-R-workflow.webp)

*Figure 1: The seven stages of an end-to-end survey analysis.*

Now simulate who responded. In real life you cannot choose the response pattern, so we bake in a realistic one: engaged departments answer more often. Engineering and the People team reply at high rates, Sales replies at a low rate. We draw a yes/no response for every one of the 1,000 employees using each department's response probability.

```r title="Simulate who responded"
set.seed(2027)
resp_rate <- c(Engineering = 0.75, Sales = 0.40, Support = 0.60,
               Operations = 0.55, People = 0.80)
employees <- data.frame(department = rep(dept_levels, population$headcount))
employees$responded <- rbinom(nrow(employees), 1, resp_rate[employees$department])
resp <- employees[employees$responded == 1, , drop = FALSE]
n <- nrow(resp)
cat("Invited:", nrow(employees), " Responded:", n, "\n")
#> Invited: 1000  Responded: 609
```

609 people answered. The `rbinom()` call flips a weighted coin for each employee, with the weight set by their department's response rate. Because those rates differ, the mix of respondents is already skewed away from the true workforce, and we will measure exactly how much in a moment.

Next, give each respondent a work arrangement (on-site, hybrid, or remote) and their actual answers. Behind the scenes each person has a hidden level of engagement driven by their department and their work mode, and each of six survey questions turns that hidden level into a 1-to-5 rating with a little noise. You do not need to follow the simulation line by line; the point is that we now hold a realistic answer sheet whose truth we happen to know.

```r title="Build the six Likert items"
resp$work_mode <- sample(c("On-site", "Hybrid", "Remote"), n,
                         replace = TRUE, prob = c(0.40, 0.35, 0.25))
mode_eff <- c(`On-site` = -0.30, Hybrid = 0.00, Remote = 0.30)
dept_eff <- c(Engineering = 0.45, Sales = -0.55, Support = -0.05,
              Operations = -0.25, People = 0.35)
latent <- dept_eff[resp$department] + mode_eff[resp$work_mode] + rnorm(n, 0, 0.80)

item_diff <- c(valued = 0.10, growth = -0.35, recommend = 0.25,
               manager = 0.30, tools = -0.10, voice = -0.30)
cuts <- c(-Inf, -1.1, -0.35, 0.45, 1.15, Inf)
make_item <- function(diff) as.integer(cut(latent + diff + rnorm(n, 0, 0.60),
                                           breaks = cuts, labels = FALSE))
items <- sapply(item_diff, make_item)

survey <- cbind(
  data.frame(respondent_id = seq_len(n), department = resp$department,
             work_mode = resp$work_mode),
  as.data.frame(items)
)
item_names <- names(item_diff)
dim(survey)
#> [1] 609   9
```

Each of the six columns `valued`, `growth`, `recommend`, `manager`, `tools`, and `voice` is one survey question answered on a 1-to-5 scale, where 1 means "strongly disagree" and 5 means "strongly agree". The `respondent_id`, `department`, and `work_mode` columns describe who gave each answer. That is 609 respondents and 9 columns, the shape of a real survey export.

Real surveys are never fully filled in: people skip questions. We add that too, with a bit more skipping on the `manager` item (people are cautious about rating their boss). This missingness is now part of the dataset we carry forward.

```r title="Add realistic item non-response"
set.seed(99)
miss_p <- c(valued = 0.04, growth = 0.05, recommend = 0.06,
            manager = 0.12, tools = 0.05, voice = 0.07)
for (nm in names(miss_p)) {
  survey[runif(n) < miss_p[nm], nm] <- NA
}
head(survey, 4)
#>   respondent_id  department work_mode valued growth recommend manager tools voice
#> 1             1 Engineering   On-site      1      1         2       1     1     1
#> 2             2 Engineering   On-site      4      3         3       4     4     3
#> 3             3 Engineering   On-site      4      1         4       3     4     4
#> 4             4 Engineering   On-site      3      2         3       3     3     2
```

The data is ready. Before any statistics, one number decides how seriously to take the rest: the response rate, and how it varies by department.

```r title="Response rate by department"
invited <- setNames(population$headcount, population$department)
rr <- data.frame(
  department = dept_levels,
  invited = as.integer(invited[dept_levels]),
  responded = as.integer(table(resp$department)[dept_levels])
)
rr$response_rate <- round(100 * rr$responded / rr$invited, 1)
rr
#>    department invited responded response_rate
#> 1 Engineering     400       309          77.2
#> 2       Sales     250        97          38.8
#> 3     Support     200       102          51.0
#> 4  Operations     100        59          59.0
#> 5      People      50        42          84.0
cat("Overall response rate:", round(100 * n / sum(invited), 1), "%\n")
#> Overall response rate: 60.9 %
```

The overall response rate is a healthy 60.9%, but the by-department rates tell the real story. Engineering answered at 77% and the People team at 84%, while Sales answered at only 39%. That gap in who chose to answer is the single most important fact in this dataset, and it is why a raw average will mislead us until we fix it.

[KEY INSIGHT]
**Non-response is almost never random.** When the groups that reply differ from the groups that stay silent, the raw results describe the responders, not the organization. Diagnosing that gap is the job of the response-rate table, and closing it is the job of weighting.

**Try it:** Compute the response rate for the Support department on its own, straight from the `invited` and `resp` objects. The answer should be 51.0.

```r title="Your turn: one department response rate"
# Goal: 100 * (Support responders) / (Support invited), rounded to 1 decimal.
# invited["Support"] holds the headcount; table(resp$department) counts responders.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="One department response rate solution"
ex_support <- 100 * as.integer(table(resp$department)["Support"]) / invited["Support"]
round(ex_support, 1)
#>  Support 
#>     51
```

**Explanation:** `table(resp$department)` counts responders per department and `invited["Support"]` is the headcount, so their ratio times 100 is the response rate. Support answered at 51%.

</details>

## What do the raw responses look like before any modelling?

Exploration comes before inference. Before you weight, test, or model anything, look at the shape of every item and map where the data is missing. Two questions drive this stage: how did people answer each item, and where are the holes?

Start with the full distribution of each item. A mean hides the shape; a count of every response level shows it.

```r title="Response counts per item"
dist_tab <- t(sapply(item_names, function(nm)
  tabulate(factor(survey[[nm]], levels = 1:5), nbins = 5)))
colnames(dist_tab) <- c("SD", "D", "N", "A", "SA")
dist_tab
#>           SD   D   N   A  SA
#> valued    73 110 161 147  98
#> growth   134 144 154  91  55
#> recommend 53 104 164 134 116
#> manager   44  89 163 128 126
#> tools     95 130 178 105  73
#> voice    130 134 149 100  52
```

Each row is one item; the columns run from strongly disagree (SD) to strongly agree (SA). Already the items behave differently. `manager` and `recommend` lean positive (fat right side), while `growth` and `voice` lean negative (fat left side). A single average per item would flatten all of that into one number.

Speaking of which, here are those averages, plus the spread of each item.

```r title="Naive item means and spread"
item_means <- round(sapply(item_names, function(nm) mean(survey[[nm]], na.rm = TRUE)), 2)
item_sd    <- round(sapply(item_names, function(nm) sd(survey[[nm]], na.rm = TRUE)), 2)
rbind(mean = item_means, sd = item_sd)
#>      valued growth recommend manager tools voice
#> mean   3.15   2.63      3.27    3.37  2.88  2.66
#> sd     1.26   1.26      1.24    1.22  1.24  1.26
```

The means range from 2.63 (`growth`) to 3.37 (`manager`), and every item has a standard deviation near 1.25, meaning opinions are genuinely spread out rather than clustered. We call these means "naive" for a reason: they ignore both the missing answers and the fact that some departments are over-represented. We will fix both.

First, the holes. A missingness map counts how many answers are absent for each item, so you know which numbers rest on thinner data.

```r title="Map the missing answers"
miss_map <- data.frame(
  item = item_names,
  n_missing = sapply(item_names, function(nm) sum(is.na(survey[[nm]]))),
  pct_missing = round(100 * sapply(item_names, function(nm) mean(is.na(survey[[nm]]))), 1),
  row.names = NULL
)
miss_map
#>        item n_missing pct_missing
#> 1    valued        20         3.3
#> 2    growth        31         5.1
#> 3 recommend        38         6.2
#> 4   manager        59         9.7
#> 5     tools        28         4.6
#> 6     voice        44         7.2
cat("Complete cases (all 6 items):", sum(complete.cases(survey[item_names])), "\n")
#> Complete cases (all 6 items): 422
```

The `manager` item is missing almost 10% of the time, more than any other, exactly the cautious pattern we built in. And though no single item is missing much, only 422 of 609 respondents answered all six. That gap matters later: any analysis that needs a complete row (like Cronbach's alpha) will run on 422 people, not 609.

[WARNING]
**A naive mean silently drops missing answers and ignores who is over-represented.** Writing `mean(x, na.rm = TRUE)` throws away the non-responders and treats an over-sampled Engineering as if it were the whole company. Both problems are fixable, but only once you have seen them in the map above.

**Try it:** How many respondents answered all three of `valued`, `manager`, and `voice`? Use `complete.cases()` on just those columns.

```r title="Your turn: complete cases for three items"
# Goal: count rows with no NA across valued, manager, and voice.
# complete.cases(survey[c(...)]) returns TRUE/FALSE per row; sum() counts the TRUEs.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Complete cases for three items solution"
ex_three <- c("valued", "manager", "voice")
sum(complete.cases(survey[ex_three]))
#> [1] 495
```

**Explanation:** With only three items in play, fewer rows contain an NA, so 495 respondents are complete here versus 422 across all six items. The more items you require, the more people you lose.

</details>

## Why weight the results, and how do you build the weights by hand?

Here is the fix for the over-representation problem. Weighting nudges each respondent's contribution up or down so that the weighted sample matches the known workforce. It is the difference between "what the responders think" and "what the company thinks".

First, prove there is a problem. Compare each department's share of the actual workforce with its share of the respondents.

```r title="Sample shares versus population shares"
sample_share <- as.numeric(table(resp$department)[dept_levels]) / n
share_cmp <- data.frame(
  department = dept_levels,
  pop_share = round(population$pop_share, 3),
  sample_share = round(sample_share, 3)
)
share_cmp
#>    department pop_share sample_share
#> 1 Engineering      0.40        0.507
#> 2       Sales      0.25        0.159
#> 3     Support      0.20        0.167
#> 4  Operations      0.10        0.097
#> 5      People      0.05        0.069
```

Engineering is 40% of the company but 51% of the respondents, while Sales is 25% of the company and only 16% of the respondents. The survey is over-weighted toward Engineering and under-weighted toward Sales, purely because of who replied. If Engineering and Sales feel differently about work, the raw average will drift toward Engineering's view.

![A post-stratification weight is the population share divided by the sample share.](screenshots/Survey-Analysis-Capstone-in-R-weighting.webp)

*Figure 2: A post-stratification weight is the population share divided by the sample share.*

The fix, called post-stratification, is almost embarrassingly simple. For each department, the weight is the share it should have divided by the share it actually has.

$$w_d = \frac{N_d / N}{n_d / n}$$

Where:

- $N_d$ = the department's headcount in the workforce, and $N$ = the total workforce (1,000)
- $n_d$ = the department's respondents, and $n$ = the total respondents (609)

A department that is over-represented gets a weight below 1 (its voices count for less), and an under-represented department gets a weight above 1 (its voices count for more). Let us compute them.

```r title="Post-stratification weights by hand"
w_by_dept <- population$pop_share / sample_share
names(w_by_dept) <- dept_levels
round(w_by_dept, 3)
#> Engineering       Sales     Support  Operations      People 
#>       0.788       1.570       1.194       1.032       0.725
survey$weight <- as.numeric(w_by_dept[survey$department])
```

Engineering's weight is 0.79 (dialled down) and Sales' is 1.57 (dialled up), exactly matching their over- and under-representation. Every respondent now carries their department's weight in a new `weight` column.

To use those weights, replace the plain average with a weighted average. A weighted mean multiplies each value by its weight, adds them up, and divides by the total weight.

$$\bar{y}_w = \frac{\sum_i w_i \, y_i}{\sum_i w_i}$$

Now build the engagement score (each person's average across the six items) and compare the raw average with the weighted one. Watch what happens to the headline number.

```r title="Unweighted versus weighted engagement"
survey$engagement <- rowMeans(survey[item_names], na.rm = TRUE)
top2 <- function(x, w = rep(1, length(x))) {
  keep <- !is.na(x)
  round(100 * sum(w[keep] * (x[keep] >= 4)) / sum(w[keep]), 1)
}
cat("Unweighted engagement:", round(mean(survey$engagement), 3), "\n")
#> Unweighted engagement: 2.996
cat("Weighted engagement:  ", round(weighted.mean(survey$engagement, survey$weight), 3), "\n")
#> Weighted engagement:   2.887
cat("recommend, top-2-box unweighted:", top2(survey$recommend), "%\n")
#> recommend, top-2-box unweighted: 43.8 %
cat("recommend, top-2-box weighted:  ", top2(survey$recommend, survey$weight), "%\n")
#> recommend, top-2-box weighted:   40.4 %
```

The raw engagement average is 3.00; the weighted average is 2.89. The share who would recommend the company drops from 43.8% to 40.4% once we account for who was really asked. The raw numbers flatter the company because the happiest departments answered the most. Weighting does not invent bad news; it just keeps the departments that answered most from counting for more than their share of the workforce.

[KEY INSIGHT]
**Weighting corrects the composition of your sample, not the mood of your respondents.** The weighted estimate answers "what would the whole workforce say", which is almost always the question a leader actually meant to ask, even when it returns a soberer number than the raw average.

[WARNING]
**Post-stratification only fixes imbalance on the variables you weight by.** We weighted by department, so the sample now matches the company on department. If non-responders differ from responders in some way department does not capture (say, the disengaged stay silent within every department), weighting cannot see it or fix it. Weights buy honesty about known gaps, not a clean bill of health.

**Try it:** Compute the weighted top-two-box (the share answering 4 or 5) for the `manager` item using the `top2()` helper and the `weight` column. The unweighted value is 46.2; the weighted value is lower.

```r title="Your turn: weighted top-two-box"
# Goal: call top2() on survey$manager, passing survey$weight as the second argument.
# top2(x) gives the unweighted share; top2(x, w) gives the weighted share.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weighted top-two-box solution"
c(unweighted = top2(survey$manager),
  weighted   = top2(survey$manager, survey$weight))
#> unweighted   weighted 
#>       46.2       42.5
```

**Explanation:** The `manager` item drops from 46.2% to 42.5% agreement once weighted, the same downward correction we saw on engagement: the over-represented departments were the more positive ones.

</details>

## How do you summarise Likert items without misleading anyone?

A Likert item (strongly disagree to strongly agree, scored 1 to 5) looks like a number, so people average it. Sometimes that is fine. Often it hides the very thing a leader needs to see. Before you report a single mean, you have to know when the mean lies.

Here is the classic trap, built from two imaginary teams answering one question.

```r title="When the mean hides everything"
team_a <- rep(3, 100)                    # everyone sits on the fence
team_b <- c(rep(1, 50), rep(5, 50))      # half furious, half delighted
c(mean_a = mean(team_a), mean_b = mean(team_b))
#> mean_a mean_b 
#>      3      3
c(sd_a = sd(team_a), sd_b = round(sd(team_b), 2))
#>  sd_a  sd_b 
#>  0.00  2.01
```

Both teams average exactly 3.0, yet Team A is uniformly indifferent while Team B is violently split. A leader told "both teams scored 3" would miss a workforce on the edge of walking out. The mean is identical; the story is opposite. This is why a Likert summary needs the shape, not just the centre.

![Pick the Likert summary that matches the question you are answering.](screenshots/Survey-Analysis-Capstone-in-R-summarise-likert.webp)

*Figure 3: Pick the Likert summary that matches the question you are answering.*

The figure names the two jobs a Likert summary can do. When you are reporting a headline, show the full distribution and a top-two-box percentage. When you are comparing groups, use an ordinal test (we get to that next section). For the headline, the distribution is best shown as a diverging stacked bar: disagreement grows to the left of centre, agreement grows to the right, and the neutral middle straddles zero. First compute the percentages by hand so you see what the chart is drawing.

```r title="Diverging percentages by hand"
lik_pct <- t(sapply(item_names, function(nm) {
  tab <- table(factor(survey[[nm]], levels = 1:5))
  round(100 * tab / sum(tab), 1)
}))
colnames(lik_pct) <- c("SD", "D", "N", "A", "SA")
lik_pct
#>            SD    D    N    A   SA
#> valued   12.4 18.7 27.3 25.0 16.6
#> growth   23.2 24.9 26.6 15.7  9.5
#> recommend 9.3 18.2 28.7 23.5 20.3
#> manager   8.0 16.2 29.6 23.3 22.9
#> tools    16.4 22.4 30.6 18.1 12.6
#> voice    23.0 23.7 26.4 17.7  9.2
```

Each row now sums to 100%. For `growth`, 48% disagree (23.2 + 24.9) and only 25% agree, a clearly negative item. For `manager`, 46% agree and 24% disagree, a clearly positive one. Those two totals, the agree side and the disagree side, are what the diverging bar draws. Here is the chart.

```r title="Draw the diverging stacked bar"
library(ggplot2)
labs <- c("Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree")
pcts <- survey |>
  select(all_of(item_names)) |>
  pivot_longer(everything(), names_to = "item", values_to = "score") |>
  filter(!is.na(score)) |>
  count(item, score) |>
  group_by(item) |>
  mutate(pct = 100 * n / sum(n)) |>
  ungroup()
pcts$response <- factor(pcts$score, levels = 1:5, labels = labs)

# order items by net agreement, and split the neutral bar so it centres on zero
net <- pcts |>
  mutate(s = ifelse(score >= 4, pct, ifelse(score <= 2, -pct, 0))) |>
  group_by(item) |> summarise(net = sum(s), .groups = "drop")
pcts$item <- factor(pcts$item, levels = net$item[order(net$net)])
dis <- pcts |> filter(score <= 3) |>
  mutate(pct = ifelse(score == 3, pct / 2, pct), y = -pct)
agr <- pcts |> filter(score >= 3) |>
  mutate(pct = ifelse(score == 3, pct / 2, pct), y = pct)

pal <- c("Strongly disagree" = "#c0392b", "Disagree" = "#e59866",
         "Neutral" = "#d5d8dc", "Agree" = "#7fb3d5", "Strongly agree" = "#1f618d")
ggplot(mapping = aes(x = item, y = y, fill = response)) +
  geom_col(data = dis, width = 0.7) +
  geom_col(data = agr, width = 0.7, position = position_stack(reverse = TRUE)) +
  geom_hline(yintercept = 0, colour = "grey30") +
  coord_flip() +
  scale_fill_manual(values = pal, breaks = labs, name = NULL) +
  labs(x = NULL, y = "Percent of respondents", title = "Agreement by item")
```

The bar sorts the items from most to least positive: `manager` and `recommend` sit at the top with long agree tails, `growth` and `voice` at the bottom with long disagree tails. A reader grasps the whole survey in one glance, something six separate means could never deliver. For an even shorter headline, most survey teams quote the top-two-box: the single percentage who chose 4 or 5.

```r title="Top-two-box percent per item"
t2box <- sort(sapply(item_names, function(nm) top2(survey[[nm]])), decreasing = TRUE)
t2box
#>   manager recommend    valued     tools     voice    growth 
#>      46.2      43.8      41.6      30.6      26.9      25.3
```

Read that as "46% agree their manager supports them, but only 25% agree they have room to grow". Top-two-box is blunt (it ignores the difference between a 4 and a 5, and between a 1 and a 3), but it is the number executives remember, and paired with the diverging bar it is honest.

[TIP]
**Report a top-two-box percentage next to a diverging bar, never a bare Likert mean.** The percentage gives the headline a leader can quote and the bar shows the shape behind it, so a split workforce like Team B can never hide inside an average of 3.0.

**Try it:** Compute the top-two-box for the `tools` item with `top2()`. It should come out to 30.6.

```r title="Your turn: top-two-box for one item"
# Goal: pass survey$tools to top2() for the unweighted agree share.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top-two-box for one item solution"
top2(survey$tools)
#> [1] 30.6
```

**Explanation:** Only 30.6% of respondents chose 4 or 5 on "I have the tools I need", making it one of the weaker items and a candidate for the report's watch-list.

</details>

## Do the six items hang together? Cronbach's alpha

We have been treating the six items as one engagement scale, averaging them into a single score. That only makes sense if the items actually measure the same underlying thing. If people who agree with one tend to agree with the others, the items are internally consistent, and Cronbach's alpha puts a number on that consistency, from 0 (unrelated) to 1 (perfectly redundant).

Alpha compares the spread of the total score against the spread of the individual items. When items move together, the total varies more than the items do on their own, and alpha climbs. We compute it by hand from the 422 complete cases.

$$\alpha = \frac{k}{k-1}\left(1 - \frac{\sum_{i=1}^{k} \sigma^2_i}{\sigma^2_{\text{total}}}\right)$$

Where $k$ is the number of items, $\sigma^2_i$ is the variance of item $i$, and $\sigma^2_{\text{total}}$ is the variance of each respondent's total score across the items.

```r title="Cronbach's alpha by hand"
cc <- survey[complete.cases(survey[item_names]), item_names]
k <- ncol(cc)
alpha <- (k / (k - 1)) * (1 - sum(apply(cc, 2, var)) / var(rowSums(cc)))
cat("Complete cases:", nrow(cc), " Items:", k, "\n")
#> Complete cases: 422  Items: 6
cat("Cronbach's alpha:", round(alpha, 3), "\n")
#> Cronbach's alpha: 0.91
```

Alpha is 0.91. As a rough guide, above 0.70 is usually called acceptable and above 0.80 good, so these six items clearly hang together as one engagement scale. That licenses the average we have been computing: it is measuring a single, coherent construct rather than six unrelated opinions.

A useful follow-up asks whether any single item is dragging the scale down. We recompute alpha six times, each time dropping one item, and see if the scale would improve without it.

```r title="Alpha if each item is dropped"
alpha_drop <- sapply(item_names, function(drop) {
  sub <- cc[setdiff(item_names, drop)]
  kk <- ncol(sub)
  (kk / (kk - 1)) * (1 - sum(apply(sub, 2, var)) / var(rowSums(sub)))
})
round(alpha_drop, 3)
#>    valued    growth recommend   manager     tools     voice 
#>     0.895     0.893     0.893     0.893     0.896     0.892
```

Every value is below the full-scale 0.91, which means dropping any item makes the scale worse. No item is redundant here; each of the six adds to the scale's consistency. If one row had come back higher than 0.91, that item would be a candidate to cut.

[WARNING]
**A high alpha is not proof that your scale is valid or one-dimensional.** Alpha mechanically rises as you add items, and it can look healthy even when the scale secretly measures two different things. It tells you the items are consistent, not that they measure what you named them. Confirm the meaning with the item wording and, for high-stakes scales, a factor analysis.

**Try it:** Compute alpha for just the three items `valued`, `manager`, and `voice`, using their complete cases. It should be lower than the full-scale 0.91 (fewer items usually means lower alpha).

```r title="Your turn: alpha for a three-item scale"
# Goal: subset cc-style to these three items' complete cases, then apply the alpha formula.
# sub <- survey[complete.cases(survey[three]), three]; k3 <- ncol(sub)
# alpha = (k3/(k3-1)) * (1 - sum(apply(sub,2,var)) / var(rowSums(sub)))
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-item alpha solution"
ex_three <- c("valued", "manager", "voice")
ex_sub <- survey[complete.cases(survey[ex_three]), ex_three]
ex_k <- ncol(ex_sub)
ex_alpha <- (ex_k / (ex_k - 1)) * (1 - sum(apply(ex_sub, 2, var)) / var(rowSums(ex_sub)))
round(ex_alpha, 3)
#> [1] 0.839
```

**Explanation:** Three items give alpha 0.839, lower than the six-item 0.91. Alpha rewards more items, which is exactly why you should not compare alphas across scales of different lengths.

</details>

## Which groups differ, and by how much?

The most common survey question is comparative: do remote workers feel differently from on-site workers? Answering it well means three things, not one. You need a test that fits ordinal data, an effect size that says how big the gap is, and a correction when you run many tests at once. We will do all three on the work-mode groups.

Start by looking before testing. Summarise engagement by work mode.

```r title="Engagement by work mode"
survey |>
  group_by(work_mode) |>
  summarise(n = n(),
            mean = round(mean(engagement), 2),
            median = round(median(engagement), 2), .groups = "drop")
#> # A tibble: 3 × 4
#>   work_mode     n  mean median
#>   <chr>     <int> <dbl>  <dbl>
#> 1 Hybrid      215  2.99   3   
#> 2 On-site     235  2.7    2.67
#> 3 Remote      159  3.44   3.6
```

Remote workers average 3.44, on-site workers 2.70, with hybrid in between. That is a gap worth testing. Because Likert-based scores are ordinal and not perfectly normal, the safe omnibus test is Kruskal-Wallis (a rank-based cousin of one-way ANOVA), and for the sharpest single contrast, remote versus on-site, a Welch t-test gives us a confidence interval on the difference in means.

```r title="Omnibus test and the focal contrast"
kruskal.test(engagement ~ factor(work_mode), data = survey)
#> 
#> 	Kruskal-Wallis rank sum test
#> 
#> data:  engagement by factor(work_mode)
#> Kruskal-Wallis chi-squared = 47.948, df = 2, p-value = 3.874e-11
rem <- survey$engagement[survey$work_mode == "Remote"]
ons <- survey$engagement[survey$work_mode == "On-site"]
tt <- t.test(rem, ons)
cat("Diff:", round(mean(rem) - mean(ons), 3),
    " 95% CI:", round(tt$conf.int[1], 3), "to", round(tt$conf.int[2], 3),
    " p:", format.pval(tt$p.value, digits = 3), "\n")
#> Diff: 0.742  95% CI: 0.55 to 0.934  p: 2.89e-13
```

Kruskal-Wallis says the three groups are not interchangeable (p is about 4e-11). The focal contrast is sharper still: remote workers score 0.74 points higher than on-site workers on the 1-to-5 scale, and the 95% confidence interval runs from 0.55 to 0.93, comfortably clear of zero. The gap is real. But "real" is not "big", so quantify the size.

An effect size turns a difference into a standardized magnitude you can compare across studies. Cohen's d divides the mean gap by the pooled standard deviation. Its ordinal cousin, Cliff's delta, ignores the scores entirely and asks: pick a random remote worker and a random on-site worker, how much more often is the remote one higher?

$$d = \frac{\bar{x}_1 - \bar{x}_2}{s_p}, \qquad s_p = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1 + n_2 - 2}}$$

```r title="Effect sizes: Cohen's d and Cliff's delta"
cohen_d <- function(a, b) {
  sp <- sqrt(((length(a)-1)*var(a) + (length(b)-1)*var(b)) / (length(a)+length(b)-2))
  (mean(a) - mean(b)) / sp
}
cliffs_delta <- function(a, b)
  (sum(outer(a, b, ">")) - sum(outer(a, b, "<"))) / (length(a) * length(b))
cat("Cohen's d:", round(cohen_d(rem, ons), 3), "\n")
#> Cohen's d: 0.769
cat("Cliff's delta:", round(cliffs_delta(rem, ons), 3), "\n")
#> Cliff's delta: 0.413
```

Cohen's d is 0.77, conventionally a medium-to-large effect, and Cliff's delta is 0.41, in the same medium-to-large range. Here the mean-based and rank-based effect sizes agree, which is reassuring: the remote-versus-on-site gap is a clean location shift, not an artefact of a few extreme scores. When those two measures disagree, trust the ordinal one for Likert data and go read the distributions to find out why.

Now the multiple-comparisons trap. The moment you compare more than two groups, or test more than one item, some "significant" results appear by chance alone. Comparing all three work modes is three tests; a correction like Holm keeps the overall error rate honest.

```r title="Pairwise comparison with a correction"
pairwise.wilcox.test(survey$engagement, survey$work_mode, p.adjust.method = "holm")$p.value
#>              Hybrid      On-site
#> On-site 8.455841e-03           NA
#> Remote  3.406394e-05 9.521051e-12
```

All three work-mode pairs survive correction, which strengthens the story. But corrections earn their keep when results are marginal. To see one bite, test the remote-versus-on-site gap on each of the six items separately (six tests), then correct.

```r title="A correction that changes the answer"
is_hy <- survey$work_mode == "Hybrid"; is_on <- survey$work_mode == "On-site"
raw_p <- sapply(item_names, function(nm)
  suppressWarnings(wilcox.test(survey[[nm]][is_hy], survey[[nm]][is_on])$p.value))
corr_tab <- data.frame(
  item = item_names,
  raw_p = round(raw_p, 4),
  holm_p = round(p.adjust(raw_p, "holm"), 4),
  sig_raw = ifelse(raw_p < 0.05, "yes", "no"),
  sig_holm = ifelse(p.adjust(raw_p, "holm") < 0.05, "yes", "no"),
  row.names = NULL
)
corr_tab
#>        item  raw_p holm_p sig_raw sig_holm
#> 1    valued 0.1295 0.1295      no       no
#> 2    growth 0.0365 0.0730     yes       no
#> 3 recommend 0.0209 0.0628     yes       no
#> 4   manager 0.0134 0.0535     yes       no
#> 5     tools 0.0074 0.0372     yes      yes
#> 6     voice 0.0036 0.0216     yes      yes
```

This is the whole lesson in one table. Comparing hybrid with on-site, five of the six items look significant at the raw 0.05 threshold, but after correcting for six tests, only two survive. Three findings (`growth`, `recommend`, `manager`) evaporate. If you had reported the raw column, you would have shipped three "differences" that are most likely noise.

[KEY INSIGHT]
**Statistical significance is not effect size, and neither survives multiple comparisons for free.** A capstone-quality comparison always reports the test, the size (with a confidence interval), and, whenever you run more than a couple of tests, a correction. Skip any one of the three and you will either overstate a trivial gap or ship a false alarm.

**Try it:** Compute Cohen's d for hybrid versus on-site engagement using the `cohen_d()` helper. It will be far smaller than the remote-versus-on-site 0.77.

```r title="Your turn: Cohen's d for a weaker gap"
# Goal: pass the Hybrid and On-site engagement vectors to cohen_d().
# survey$engagement[survey$work_mode == "Hybrid"] and == "On-site"
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cohen's d for a weaker gap solution"
hyb <- survey$engagement[survey$work_mode == "Hybrid"]
round(cohen_d(hyb, ons), 3)
#> [1] 0.277
```

**Explanation:** The hybrid-versus-on-site gap is d = 0.28, a small effect, versus the large 0.77 for remote-versus-on-site. Same scale, very different magnitude, which is exactly why an effect size belongs next to every p-value.

</details>

## Practice Exercises

These pull several stages together. Each is solvable with the tools above, and each prints an expected output so you can check yourself. Use the `my_` prefix so your work never overwrites the tutorial's objects.

### Exercise 1: Weighted top-two-box for the growth item

Report the weighted top-two-box percentage for the `growth` item, then compare it with the unweighted value. Use the existing `top2()` helper and the `weight` column.

```r title="Exercise 1 starter"
# Combine weighting with the top-two-box summary for one item.
# Hint: top2(x) is unweighted; top2(x, w) is weighted.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_growth <- c(unweighted = top2(survey$growth),
               weighted   = top2(survey$growth, survey$weight))
my_growth
#> unweighted   weighted 
#>       25.3       22.6
```

**Explanation:** `growth` agreement falls from 25.3% to 22.6% once weighted. It was already the weakest item, and correcting for over-represented departments makes it look weaker still, an honest signal for the report.

</details>

### Exercise 2: Weighted mean engagement by work mode

Build a single pipeline that returns, for each `work_mode` group, the weighted mean engagement. Use `weighted.mean()` inside `summarise()`.

```r title="Exercise 2 starter"
# Group by work_mode, then compute weighted.mean(engagement, weight) per group.
# Hint: survey |> group_by(work_mode) |> summarise(...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_wm <- survey |>
  group_by(work_mode) |>
  summarise(w_mean = round(weighted.mean(engagement, weight), 2), .groups = "drop")
my_wm
#> # A tibble: 3 × 2
#>   work_mode w_mean
#>   <chr>      <dbl>
#> 1 Hybrid      2.88
#> 2 On-site     2.59
#> 3 Remote      3.33
```

**Explanation:** Weighting lowers every group's mean a little (the over-represented departments were the more positive ones), but the remote-versus-on-site ordering and gap survive, so the headline conclusion is robust to weighting.

</details>

### Exercise 3: A three-item subscale and its weakest link

Treat `valued`, `manager`, and `voice` as a short "feeling supported" subscale. Compute its Cronbach's alpha, then find which of the three, if dropped, would most improve it (the largest alpha-if-dropped).

```r title="Exercise 3 starter"
# Step 1: alpha for the three items on their complete cases.
# Step 2: drop each item in turn (a 2-item alpha each time) and compare.
# Hint: with 2 items, k/(k-1) = 2.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_items <- c("valued", "manager", "voice")
my_cc <- survey[complete.cases(survey[my_items]), my_items]
my_alpha_drop <- sapply(my_items, function(drop) {
  sub <- my_cc[setdiff(my_items, drop)]
  2 * (1 - sum(apply(sub, 2, var)) / var(rowSums(sub)))
})
round(my_alpha_drop, 3)
#>  valued manager   voice 
#>   0.776   0.767   0.785
```

**Explanation:** Dropping `voice` yields the highest two-item alpha (0.785), meaning `voice` is the least consistent with the other two here. On a three-item scale that is a note to investigate, not an instruction to cut, since the full subscale alpha (0.839 from the earlier Try it) is already good and every drop stays below it.

</details>

## The deliverable: an executive summary and a technical appendix

An analysis nobody reads changes nothing. The final stage turns your work into a report a busy leader acts on in two minutes and a colleague can reproduce in an afternoon. The pattern is simple: a short executive summary on top, a technical appendix underneath. First, assemble the handful of numbers the summary will quote, so the report never contains a figure that is not backed by code.

```r title="The headline numbers the report quotes"
headline <- data.frame(
  metric = c("Respondents", "Response rate %", "Weighted engagement (1-5)",
             "Cronbach's alpha", "Remote vs On-site gap", "Effect size (Cohen d)"),
  value  = c(n, round(100 * n / sum(invited), 1),
             round(weighted.mean(survey$engagement, survey$weight), 2),
             round(alpha, 2), round(mean(rem) - mean(ons), 2),
             round(cohen_d(rem, ons), 2))
)
headline
#>                      metric  value
#> 1               Respondents 609.00
#> 2           Response rate %  60.90
#> 3 Weighted engagement (1-5)   2.89
#> 4          Cronbach's alpha   0.91
#> 5     Remote vs On-site gap   0.74
#> 6     Effect size (Cohen d)   0.77
```

With those numbers fixed, the write-up almost drafts itself. A strong executive summary is three findings, one caveat, and one recommendation, in plain language, leading with the decision rather than the method.

> **Executive summary.** 609 employees responded (a 61% response rate). After weighting to the company's real department mix, three findings stand out. **First**, overall engagement is modest: on a 1-to-5 scale the weighted average is 2.89, and only 40% would recommend us as a place to work. **Second**, growth is our weakest area: just 23% of employees (weighted) agree they have room to grow, the lowest of any question. **Third**, work arrangement matters more than we assumed: remote employees are markedly more engaged than on-site employees (a 0.74-point gap, a large effect of d = 0.77), a difference that holds up under rank-based tests and correction. **One caveat**: the survey heard far more from Engineering (77% replied) than from Sales (39%), and although we corrected for department mix, weighting cannot rule out that the least engaged employees stayed silent within every team, so the true picture may be a shade worse than 2.89. **Recommendation**: run a focused follow-up on growth and career pathing, starting with the on-site and Sales populations, and re-survey in two quarters to measure movement.

The technical appendix carries everything the summary compressed, so the analysis is reproducible and defensible. Keep it to a predictable checklist:

- **Instrument and scale.** Six 1-to-5 agreement items; internal consistency Cronbach's alpha = 0.91 on 422 complete cases; no item improves the scale if dropped.
- **Sample and response.** Census of 1,000 employees, 609 respondents (60.9%); response rate ranged from 39% (Sales) to 84% (People), documented in the response-rate table.
- **Weighting.** Post-stratification to department headcounts; weights ran from 0.73 (People) to 1.57 (Sales); weighting lowered mean engagement from 3.00 to 2.89.
- **Missing data.** Item non-response 3% to 10% (highest on `manager`); scale scores use available items, alpha uses complete cases.
- **Comparisons.** Kruskal-Wallis across work modes (p < 1e-10); remote vs on-site Welch t with 95% CI [0.55, 0.93]; effect sizes Cohen's d = 0.77 and Cliff's delta = 0.41; per-item tests Holm-corrected.

[TIP]
**Lead with the decision, bury the methods in the appendix.** A leader needs the three findings and the recommendation first; the weighting scheme and the confidence intervals belong in the appendix where a reviewer can check them. Same numbers, two audiences, one document.

## Summary

You have run a survey analysis the way a professional does: not as a single test, but as a pipeline where each stage guards against a specific way of being wrong.

| Stage | What you do | The honest trap it avoids |
|---|---|---|
| Design recap | Log who was invited and who replied | Treating responders as the whole company |
| EDA | Distributions and a missingness map | A mean that hides a split or a hole |
| Weighting | Post-stratify to known margins | Optimism introduced by uneven non-response |
| Likert summary | Diverging bar plus top-two-box | A bare mean that hides the shape |
| Reliability | Cronbach's alpha, alpha-if-dropped | Averaging items that do not belong together |
| Comparisons | Test, effect size with CI, correction | Confusing significant with big, or shipping false alarms |
| Report | Three findings, a caveat, a recommendation | An analysis nobody reads or can reproduce |

The through-line is honesty. Every stage exists to stop a number from claiming more than the data supports, and the reason each computation here was done by hand is so you can always see exactly what it is claiming.

## Frequently Asked Questions

**Do I always need to weight my survey?** No. Weight when a known population margin exists (a headcount, a census) and your respondents visibly differ from it, as ours did on department. If your sample already matches the population, or you have no trustworthy margins to weight to, weighting adds noise for no gain. Always report both the weighted and unweighted numbers so readers can see the effect.

**My subgroups are tiny. Can I still compare them?** You can run the test, but treat small-group results with suspicion: wide confidence intervals, unstable effect sizes, and little power to detect real gaps. Report the group size next to every estimate, lean on the confidence interval rather than the p-value, and resist splitting into ever-finer segments, which multiplies the comparison problem.

**How should I handle missing answers?** First map the missingness, as we did, because the pattern is itself a finding (people skipped the manager item most). For scale scores, averaging the available items is fine when missingness is light. When it is heavy or clearly non-random, a bare complete-case analysis can bias results, and multiple imputation is the sturdier tool.

**Is alpha above 0.7 always good enough?** It is a common rule of thumb, not a law. Alpha climbs simply by adding items, so a long scale can clear 0.7 while measuring two different things, and a short, sharp scale can be useful below it. Read alpha alongside the item wording and, for anything high-stakes, a factor analysis, rather than treating 0.7 as a pass-fail gate.

**Should I report the mean or the median for a Likert item?** For a single item, prefer the full distribution (a diverging bar) and a top-two-box percentage, because both the mean and the median throw away shape. When you must pick one number for an ordinal item, the median is more faithful than the mean, but a percentage agreeing is usually the most decision-useful of all.

**Which multiple-comparison correction should I use?** Holm (used here) is a safe, general default: it controls the chance of any false positive and is uniformly more powerful than the older Bonferroni. When you are running very many tests and can tolerate a known false-discovery rate rather than zero false positives, the Benjamini-Hochberg (`p.adjust` method `"BH"`) correction is more powerful. Both beat reporting raw p-values.

## References

1. Lumley, T. *Complex Surveys: A Guide to Analysis Using R*. Wiley (2010). The standard R reference for survey design and post-stratification. [Link](https://r-survey.r-forge.r-project.org/svybook/)
2. survey package documentation. `postStratify` and `rake` reference. [Link](https://cran.r-project.org/web/packages/survey/survey.pdf)
3. Cronbach, L. J. "Coefficient alpha and the internal structure of tests." *Psychometrika* 16, 297-334 (1951). [Link](https://link.springer.com/article/10.1007/BF02310555)
4. Robbins, N. B. & Heiberger, R. M. "Plotting Likert and Other Rating Scales." *JSM Proceedings* (2011). The design case for diverging stacked bars. [Link](http://www.asasrms.org/Proceedings/y2011/Files/300784_64164.pdf)
5. Wickham, H. & Grolemund, G. *R for Data Science*, 2nd Edition. Chapter on data transformation with dplyr. [Link](https://r4ds.hadley.nz/data-transform)
6. tidyr documentation. `pivot_longer` reference, used to reshape items for plotting. [Link](https://tidyr.tidyverse.org/reference/pivot_longer.html)
7. R Core Team. `p.adjust` reference: Holm, Bonferroni, and Benjamini-Hochberg corrections. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html)

## Continue Learning

- [Measurement Reliability in R](Measurement-Reliability-in-R.html): go deeper on Cronbach's alpha, the intraclass correlation, and rater agreement, with `psych` verification.
- [Sampling Methods in R](Sampling-Methods-in-R.html): how the sampling frame and design that we recapped here are chosen in the first place.
- [Statistical vs Practical Significance](Statistical-vs-Practical-Significance.html): the effect-size mindset behind reporting a d and a confidence interval, not just a p-value.
