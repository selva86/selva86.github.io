---
title: "R for Sports Analytics Exercises: 20 Practice Problems"
slug: "R-for-Sports-Analytics-Exercises"
description: "Master sports analytics in R with 20 practice problems: ratings, ELO, win probability, player metrics, season summaries. Hidden solutions."
keywords: "sports analytics R, R sports analytics exercises, ELO rating R, win probability R, R sports practice"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R for Sports Analytics"
sidebar_order: 148
fr_parent: "R-Tutorial.html"
auto_link_terms: "sports analytics R|R sports analytics exercises|ELO rating R|win probability R"
auto_link_case_sensitive: false
target_keyword: "sports analytics R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# R for Sports Analytics Exercises: 20 Practice Problems

<p class="lead">Twenty practice problems for sports analytics in R: rankings, ratings, ELO, win probability, player metrics, season summaries. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(tidyr)
```

### Exercise 1: Standings from results

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
games <- tibble(home = c("A","B","C","A","B"), away = c("B","C","A","C","A"),
                home_score = c(2,1,3,0,2), away_score = c(1,1,2,1,2))
games |>
  transmute(team = home, points = ifelse(home_score > away_score, 3,
                                          ifelse(home_score == away_score, 1, 0))) |>
  bind_rows(games |> transmute(team = away, points = ifelse(away_score > home_score, 3,
                                                             ifelse(away_score == home_score, 1, 0)))) |>
  group_by(team) |> summarise(pts = sum(points)) |> arrange(desc(pts))
```

</details>

### Exercise 2: Win percentage

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
wins <- 25; losses <- 15
wins / (wins + losses)
```

</details>

### Exercise 3: Pythagorean expectation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
runs_for <- 720; runs_against <- 650
runs_for^2 / (runs_for^2 + runs_against^2)
```

</details>

### Exercise 4: Top scorers

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
df <- tibble(player = letters[1:5], goals = c(20, 15, 30, 12, 25))
df |> arrange(desc(goals)) |> head(3)
```

</details>

### Exercise 5: Z-score for player stat

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
goals <- c(20, 15, 30, 12, 25, 18, 22)
(goals - mean(goals)) / sd(goals)
```

</details>

### Exercise 6: Goals per game

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
df <- tibble(player = c("a","b"), goals = c(20, 25), games = c(30, 28))
df |> mutate(g_per_game = goals / games)
```

</details>

### Exercise 7: ELO update

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
elo_update <- function(rA, rB, sA, K = 32) {
  eA <- 1 / (1 + 10^((rB - rA) / 400))
  rA + K * (sA - eA)
}
elo_update(1500, 1500, 1)
```

</details>

### Exercise 8: Apply ELO across season

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
games <- tibble(team1 = c("A","B","A"), team2 = c("B","C","C"),
                winner = c("A","C","A"))
ratings <- c(A = 1500, B = 1500, C = 1500)
for (i in seq_len(nrow(games))) {
  r1 <- ratings[games$team1[i]]; r2 <- ratings[games$team2[i]]
  s1 <- as.integer(games$winner[i] == games$team1[i])
  e1 <- 1 / (1 + 10^((r2 - r1)/400))
  ratings[games$team1[i]] <- r1 + 32*(s1 - e1)
  ratings[games$team2[i]] <- r2 + 32*((1-s1) - (1-e1))
}
ratings
```

</details>

### Exercise 9: Win probability from ELO

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
rA <- 1600; rB <- 1500
1 / (1 + 10^((rB - rA) / 400))
```

</details>

### Exercise 10: Head-to-head record

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
games <- tibble(t1 = c("A","B","A","A"), t2 = c("B","A","B","B"),
                winner = c("A","A","B","A"))
games |> filter((t1 == "A" & t2 == "B") | (t1 == "B" & t2 == "A")) |>
  count(winner)
```

</details>

### Exercise 11: Streak detection

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
res <- c("W","W","L","W","W","W","L")
rle(res)
```

</details>

### Exercise 12: Plus-minus per player

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
events <- tibble(player = c("a","b","c","a"),
                 on_court = c(TRUE, TRUE, FALSE, TRUE),
                 score_change = c(2, 2, 0, -1))
events |> filter(on_court) |> group_by(player) |> summarise(plus_minus = sum(score_change))
```

</details>

### Exercise 13: Home-field advantage estimate

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
games <- tibble(home_pts = c(100, 95, 110, 88, 105),
                away_pts = c(95, 92, 100, 90, 102))
mean(games$home_pts - games$away_pts)
```

</details>

### Exercise 14: Player percentile

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
goals <- c(20, 15, 30, 12, 25, 18, 22, 28)
ecdf(goals)(25)
```

</details>

### Exercise 15: Team form (last 5 games)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
games <- tibble(team = rep("A", 10),
                result = sample(c("W","L","D"), 10, replace = TRUE),
                date = Sys.Date() - 9:0)
games |> arrange(desc(date)) |> head(5) |> count(result)
```

</details>

### Exercise 16: Expected goals (xG) aggregate

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
shots <- tibble(player = c("a","a","b","b","b"),
                xg = c(0.1, 0.3, 0.05, 0.4, 0.2))
shots |> group_by(player) |> summarise(total_xg = sum(xg))
```

</details>

### Exercise 17: Goals vs xG (efficiency)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
players <- tibble(player = c("a","b"), goals = c(5, 3), xg = c(4.2, 5.1))
players |> mutate(over_perform = goals - xg)
```

</details>

### Exercise 18: Visualize standings

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
standings <- tibble(team = c("A","B","C","D"), pts = c(30, 22, 18, 12))
ggplot2::ggplot(standings, ggplot2::aes(reorder(team, pts), pts)) +
  ggplot2::geom_col() + ggplot2::coord_flip()
```

</details>

### Exercise 19: Compare positions

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
players <- tibble(pos = c("F","M","D","F","M","D"),
                  goals = c(20, 5, 1, 18, 8, 2))
players |> group_by(pos) |> summarise(mean_goals = mean(goals))
```

</details>

### Exercise 20: Days rest between games

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
games <- tibble(team = "A", date = as.Date(c("2024-09-01","2024-09-05","2024-09-12")))
games |> mutate(rest = as.integer(date - lag(date)))
```

</details>

## What to do next

- **EDA-Exercises** (shipped) — explore your dataset.
- **Linear-Regression-Exercises** (shipped) — model on player stats.
