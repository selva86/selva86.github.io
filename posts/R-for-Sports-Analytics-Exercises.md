---
title: "Sports Analytics R Exercises: 20 Real-World Practice Problems"
slug: "R-for-Sports-Analytics-Exercises"
description: "Sports analytics R exercises: box scores, ELO, Pythagorean wins, win probability, scouting workflows. 20 hands-on problems with hidden solutions."
keywords: "sports analytics R exercises, ELO rating R, Pythagorean expectation R, win probability R, scouting R, NBA analytics R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R for Sports Analytics"
sidebar_order: 148
fr_parent: "R-Tutorial.html"
auto_link_terms: "sports analytics r exercises|elo rating in r|pythagorean expectation|win probability in r|player efficiency r"
auto_link_case_sensitive: false
target_keyword: "sports analytics R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Sports Analytics R Exercises: 20 Real-World Practice Problems

<p class="lead">Twenty practice problems that reproduce the daily work of an NBA analytics staffer or a club's performance group: cleaning player-game logs, computing ELO updates, fitting win probability models, and building scouting boards. Solutions are hidden behind toggles so you can attempt each problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(purrr)
library(stringr)
```

## Section 1. Box scores and player game logs (3 problems)

### Exercise 1.1: Compute per-game averages from a player game log

**Task:** The analytics staff received a 10-game log for a guard and needs a quick season-style summary card for tomorrow's coaches' meeting. Using the inline tibble below, compute the mean points, rebounds, and assists per game (round to one decimal) and save the three-column result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>     ppg   rpg   apg
#>   <dbl> <dbl> <dbl>
#> 1  21.4   4.1   6.7
```

**Difficulty:** Beginner

```r title="Your turn"
player_log <- tibble(
  game = 1:10,
  pts  = c(28, 19, 22, 31, 17, 20, 25, 14, 23, 15),
  reb  = c( 5,  3,  4,  6,  2,  5,  4,  3,  6,  3),
  ast  = c( 8,  6,  9,  4,  7,  6,  8,  5,  9,  5)
)

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
player_log <- tibble(
  game = 1:10,
  pts  = c(28, 19, 22, 31, 17, 20, 25, 14, 23, 15),
  reb  = c( 5,  3,  4,  6,  2,  5,  4,  3,  6,  3),
  ast  = c( 8,  6,  9,  4,  7,  6,  8,  5,  9,  5)
)

ex_1_1 <- player_log |>
  summarise(
    ppg = round(mean(pts), 1),
    rpg = round(mean(reb), 1),
    apg = round(mean(ast), 1)
  )
ex_1_1
#> # A tibble: 1 x 3
#>     ppg   rpg   apg
#>   <dbl> <dbl> <dbl>
#> 1  21.4   4.1   6.7
```

**Explanation:** `summarise()` collapses the per-game rows into a single row, and naming each output column explicitly produces the same shape a scout would expect on a one-pager. If you forget `round()`, the output looks busier than it needs to. For a multi-stat audit on many columns, `summarise(across(c(pts, reb, ast), mean))` is the scalable form.

</details>

### Exercise 1.2: Flag double-double games for a player

**Task:** A double-double is a game with at least 10 in two of points, rebounds, assists. The coaching staff wants every double-double game flagged in the log so they can compare a player's contract incentives. Add a logical `double_double` column to `player_log` from Exercise 1.1 and save the augmented tibble to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 10 x 5
#>     game   pts   reb   ast double_double
#>    <int> <dbl> <dbl> <dbl> <lgl>
#>  1     1    28     5     8 TRUE
#>  2     2    19     3     6 FALSE
#>  3     3    22     4     9 FALSE
#>  4     4    31     6     4 FALSE
#>  5     5    17     2     7 FALSE
#>  6     6    20     5     6 FALSE
#>  7     7    25     4     8 FALSE
#>  8     8    14     3     5 FALSE
#>  9     9    23     6     9 FALSE
#> 10    10    15     3     5 FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- player_log |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- player_log |>
  mutate(
    double_double = (rowSums(across(c(pts, reb, ast), ~ .x >= 10)) >= 2)
  )
ex_1_2
#> # A tibble: 10 x 5
#>     game   pts   reb   ast double_double
#>    <int> <dbl> <dbl> <dbl> <lgl>
#>  1     1    28     5     8 TRUE
#>  2     2    19     3     6 FALSE
#>  3     3    22     4     9 FALSE
#>  4     4    31     6     4 FALSE
#>  5     5    17     2     7 FALSE
#>  6     6    20     5     6 FALSE
#>  7     7    25     4     8 FALSE
#>  8     8    14     3     5 FALSE
#>  9     9    23     6     9 FALSE
#> 10    10    15     3     5 FALSE
```

**Explanation:** `across()` builds a matrix of logical TRUE/FALSE flags and `rowSums()` counts how many stat categories cleared 10. Asking `>= 2` matches the textbook double-double definition. A common mistake is `pts >= 10 & reb >= 10` which only flags pts-and-reb pairs and misses pts-and-ast or reb-and-ast doubles, which is what tripped up this player's recent agent during negotiations.

</details>

### Exercise 1.3: Compute True Shooting percentage by player

**Task:** True Shooting (TS%) measures scoring efficiency accounting for threes and free throws. The formula is `pts / (2 * (fga + 0.44 * fta))`. Given the four-player season tibble below, compute TS% to three decimals for each player and save the result sorted descending to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 4 x 5
#>   player    pts   fga   fta    ts
#>   <chr>   <dbl> <dbl> <dbl> <dbl>
#> 1 Curry    1980  1400   320 0.638
#> 2 Booker   1820  1340   380 0.609
#> 3 LeBron   1620  1180   360 0.602
#> 4 Russell  1490  1290   210 0.541
```

**Difficulty:** Advanced

```r title="Your turn"
season <- tribble(
  ~player,   ~pts, ~fga, ~fta,
  "Curry",   1980, 1400,  320,
  "Booker",  1820, 1340,  380,
  "LeBron",  1620, 1180,  360,
  "Russell", 1490, 1290,  210
)

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
season <- tribble(
  ~player,   ~pts, ~fga, ~fta,
  "Curry",   1980, 1400,  320,
  "Booker",  1820, 1340,  380,
  "LeBron",  1620, 1180,  360,
  "Russell", 1490, 1290,  210
)

ex_1_3 <- season |>
  mutate(ts = round(pts / (2 * (fga + 0.44 * fta)), 3)) |>
  arrange(desc(ts))
ex_1_3
#> # A tibble: 4 x 5
#>   player    pts   fga   fta    ts
#>   <chr>   <dbl> <dbl> <dbl> <dbl>
#> 1 Curry    1980  1400   320 0.638
#> 2 Booker   1820  1340   380 0.609
#> 3 LeBron   1620  1180   360 0.602
#> 4 Russell  1490  1290   210 0.541
```

**Explanation:** TS% is a single number that beats raw FG% because it gives credit for three-pointers and free throws, which is why front offices use it for shot-creator evaluation. The 0.44 multiplier estimates how many possessions a typical free-throw trip costs (and-ones, technical FTs slightly distort the constant but 0.44 is the league convention). Always round before arrange so ties resolve by stable ordering.

</details>

## Section 2. Team standings and head-to-head records (4 problems)

### Exercise 2.1: Build a standings table from game results

**Task:** A small five-team league played the inline schedule below. Build a standings tibble with columns `team`, `wins`, `losses`, `win_pct` (rounded to three decimals), sorted by `win_pct` descending. Tied teams may appear in any order. Save the standings to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   team   wins losses win_pct
#>   <chr> <int>  <int>   <dbl>
#> 1 A         3      1   0.75
#> 2 C         3      1   0.75
#> 3 D         2      2   0.5
#> 4 B         1      3   0.25
#> 5 E         1      3   0.25
```

**Difficulty:** Beginner

```r title="Your turn"
games <- tribble(
  ~home, ~away, ~home_pts, ~away_pts,
  "A","B", 102,  98,
  "C","D", 110, 105,
  "A","C",  92, 101,
  "B","D",  88,  95,
  "E","A",  89, 104,
  "D","E", 100,  91,
  "B","C",  82,  90,
  "E","B",  99,  92,
  "C","E", 105,  95,
  "A","D", 108, 100
)

ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
games <- tribble(
  ~home, ~away, ~home_pts, ~away_pts,
  "A","B", 102,  98,
  "C","D", 110, 105,
  "A","C",  92, 101,
  "B","D",  88,  95,
  "E","A",  89, 104,
  "D","E", 100,  91,
  "B","C",  82,  90,
  "E","B",  99,  92,
  "C","E", 105,  95,
  "A","D", 108, 100
)

long <- bind_rows(
  games |> transmute(team = home, win = home_pts > away_pts),
  games |> transmute(team = away, win = away_pts > home_pts)
)

ex_2_1 <- long |>
  group_by(team) |>
  summarise(wins = sum(win), losses = sum(!win), .groups = "drop") |>
  mutate(win_pct = round(wins / (wins + losses), 3)) |>
  arrange(desc(win_pct))
ex_2_1
#> # A tibble: 5 x 4
#>   team   wins losses win_pct
#>   <chr> <int>  <int>   <dbl>
#> 1 A         3      1   0.75
#> 2 C         3      1   0.75
#> 3 D         2      2   0.5
#> 4 B         1      3   0.25
#> 5 E         1      3   0.25
```

**Explanation:** Game logs naturally store two teams per row, so a tidy standings calc almost always unpivots into a long one-row-per-team-per-game table first. `bind_rows()` of the home and away slices gives the cleanest unpivot here. Skipping this step and trying to sum from the wide schema usually means writing the same logic twice and double-counting ties on the boundary games.

</details>

### Exercise 2.2: Sort standings using point differential as a tiebreaker

**Task:** Extending Exercise 2.1, two teams (A and C) finished 3-1. The league's tiebreaker rule is total point differential across all games (points scored minus points allowed). Compute `point_diff` per team and re-sort the standings by `win_pct` descending, then `point_diff` descending. Save to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 5 x 5
#>   team   wins losses win_pct point_diff
#>   <chr> <int>  <int>   <dbl>      <dbl>
#> 1 C         3      1   0.75          23
#> 2 A         3      1   0.75          20
#> 3 D         2      2   0.5            2
#> 4 E         1      3   0.25         -16
#> 5 B         1      3   0.25         -29
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
long_pts <- bind_rows(
  games |> transmute(team = home, pf = home_pts, pa = away_pts),
  games |> transmute(team = away, pf = away_pts, pa = home_pts)
)

ex_2_2 <- long_pts |>
  group_by(team) |>
  summarise(
    wins       = sum(pf > pa),
    losses     = sum(pf < pa),
    point_diff = sum(pf) - sum(pa),
    .groups = "drop"
  ) |>
  mutate(win_pct = round(wins / (wins + losses), 3)) |>
  arrange(desc(win_pct), desc(point_diff)) |>
  select(team, wins, losses, win_pct, point_diff)
ex_2_2
#> # A tibble: 5 x 5
#>   team   wins losses win_pct point_diff
#>   <chr> <int>  <int>   <dbl>      <dbl>
#> 1 C         3      1   0.75          23
#> 2 A         3      1   0.75          20
#> 3 D         2      2   0.5            2
#> 4 E         1      3   0.25         -16
#> 5 B         1      3   0.25         -29
```

**Explanation:** Sorting by two keys with `arrange(desc(win_pct), desc(point_diff))` mirrors the bylaws of nearly every league: primary record, secondary differential. Note that we recompute the long table to carry both `pf` and `pa` columns; chaining off the result of 2.1 would have dropped the raw scores. Real tiebreaker chains can go five keys deep (head-to-head, division record, conference record).

</details>

### Exercise 2.3: Compute home and road splits for each team

**Task:** Coaching staff want to know which teams travel poorly. From the `games` schedule, compute `home_win_pct` and `road_win_pct` for every team to three decimals, then add a `split_gap = home_win_pct - road_win_pct` column and sort by `split_gap` descending. Save to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   team  home_win_pct road_win_pct split_gap
#>   <chr>        <dbl>        <dbl>     <dbl>
#> 1 A            1            0.5       0.5
#> 2 C            1            0.5       0.5
#> 3 D            0.5          0.5       0
#> 4 B            0            0.5      -0.5
#> 5 E            0.5          0        -0.5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
home <- games |>
  group_by(team = home) |>
  summarise(home_win_pct = round(mean(home_pts > away_pts), 3), .groups = "drop")
road <- games |>
  group_by(team = away) |>
  summarise(road_win_pct = round(mean(away_pts > home_pts), 3), .groups = "drop")

ex_2_3 <- home |>
  full_join(road, by = "team") |>
  mutate(split_gap = home_win_pct - road_win_pct) |>
  arrange(desc(split_gap))
ex_2_3
#> # A tibble: 5 x 4
#>   team  home_win_pct road_win_pct split_gap
#>   <chr>        <dbl>        <dbl>     <dbl>
#> 1 A            1            0.5       0.5
#> 2 C            1            0.5       0.5
#> 3 D            0.5          0.5       0
#> 4 B            0            0.5      -0.5
#> 5 E            0.5          0        -0.5
```

**Explanation:** Home-court advantage is real (roughly +3 points in the NBA, more in college and European football) so isolating it lets staff target road-trip prep. The `full_join()` is defensive: if a team appears only on the home or only on the away side of the schedule, an inner join would silently drop it. For a real schedule you would also report game counts to flag small-sample splits.

</details>

### Exercise 2.4: Build a head-to-head record matrix between all teams

**Task:** The GM wants a head-to-head matrix where row = team, column = opponent, cell = wins for the row team in matchups against the column team. Diagonal is `NA`. Build the 5x5 matrix from `games` and save the result as a tibble (with `team` as the first column) to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 5 x 6
#>   team      A     B     C     D     E
#>   <chr> <int> <int> <int> <int> <int>
#> 1 A        NA     1     0     1     1
#> 2 B         0    NA     0     0     1
#> 3 C         1     1    NA     1     1
#> 4 D         0     1     0    NA     1
#> 5 E         0     0     0     0    NA
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
long <- bind_rows(
  games |> transmute(team = home, opp = away, win = home_pts > away_pts),
  games |> transmute(team = away, opp = home, win = away_pts > home_pts)
)

ex_2_4 <- long |>
  group_by(team, opp) |>
  summarise(wins = sum(win), .groups = "drop") |>
  pivot_wider(names_from = opp, values_from = wins) |>
  arrange(team) |>
  mutate(across(-team, ~ replace(.x, team == cur_column(), NA_integer_)))
ex_2_4
#> # A tibble: 5 x 6
#>   team      A     B     C     D     E
#>   <chr> <int> <int> <int> <int> <int>
#> 1 A        NA     1     0     1     1
#> 2 B         0    NA     0     0     1
#> 3 C         1     1    NA     1     1
#> 4 D         0     1     0    NA     1
#> 5 E         0     0     0     0    NA
```

**Explanation:** Head-to-head matrices are the canonical shape for playoff tiebreak displays. The pattern is: long-tidy first, then `pivot_wider()` for presentation. The trailing `mutate(across(...))` sets the diagonal to NA so the matrix reads correctly. If two teams never met (rare in a round-robin, common in early-season cuts), `pivot_wider()` would emit NA there too, which is the right behavior.

</details>

## Section 3. Rating systems and power rankings (4 problems)

### Exercise 3.1: Pythagorean win expectation across teams

**Task:** Bill James's Pythagorean expectation predicts win% from points-for and points-against using the formula `pf^exp / (pf^exp + pa^exp)`. The basketball-fitted exponent is 13.91. Compute Pythagorean win% for the four-team season tibble below (round to three decimals), and save sorted descending to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   team       pf    pa pythag_win_pct
#>   <chr>   <dbl> <dbl>          <dbl>
#> 1 Celtics  9200  8400          0.808
#> 2 Heat     8950  8600          0.659
#> 3 Knicks   8700  8500          0.589
#> 4 Pistons  8300  8900          0.197
```

**Difficulty:** Intermediate

```r title="Your turn"
teams <- tribble(
  ~team,     ~pf,  ~pa,
  "Celtics", 9200, 8400,
  "Heat",    8950, 8600,
  "Knicks",  8700, 8500,
  "Pistons", 8300, 8900
)

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
teams <- tribble(
  ~team,     ~pf,  ~pa,
  "Celtics", 9200, 8400,
  "Heat",    8950, 8600,
  "Knicks",  8700, 8500,
  "Pistons", 8300, 8900
)

exp_basketball <- 13.91
ex_3_1 <- teams |>
  mutate(pythag_win_pct = round(
    pf^exp_basketball / (pf^exp_basketball + pa^exp_basketball), 3)) |>
  arrange(desc(pythag_win_pct))
ex_3_1
#> # A tibble: 4 x 4
#>   team       pf    pa pythag_win_pct
#>   <chr>   <dbl> <dbl>          <dbl>
#> 1 Celtics  9200  8400          0.808
#> 2 Heat     8950  8600          0.659
#> 3 Knicks   8700  8500          0.589
#> 4 Pistons  8300  8900          0.197
```

**Explanation:** Pythagorean expectation is the cleanest one-line power rating in sports analytics: it underrates teams with extreme garbage-time stats but is robust to schedule quirks. The exponent varies by sport (baseball: ~1.83, NFL: ~2.37, NBA: ~13.91 to ~16). When actual wins lag the Pythagorean estimate by 5+, the team is usually unlucky in close games and likely to regress positively next year.

</details>

### Exercise 3.2: Update two team ELO ratings after a single game

**Task:** ELO ratings update after every game using `R_new = R_old + K * (actual - expected)`, where `expected = 1 / (1 + 10^((R_opp - R_self)/400))` and `K = 20` is the standard basketball constant. Team A (rating 1500) beat Team B (rating 1600) at home. Compute both updated ratings (round to one decimal) and save the result as a two-row tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   team  rating_before rating_after
#>   <chr>         <dbl>        <dbl>
#> 1 A              1500        1513.
#> 2 B              1600        1587.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
R_a <- 1500; R_b <- 1600; K <- 20
exp_a <- 1 / (1 + 10^((R_b - R_a) / 400))
exp_b <- 1 - exp_a

new_a <- R_a + K * (1 - exp_a)
new_b <- R_b + K * (0 - exp_b)

ex_3_2 <- tibble(
  team           = c("A", "B"),
  rating_before  = c(R_a, R_b),
  rating_after   = round(c(new_a, new_b), 1)
)
ex_3_2
#> # A tibble: 2 x 3
#>   team  rating_before rating_after
#>   <chr>         <dbl>        <dbl>
#> 1 A              1500        1513.
#> 2 B              1600        1587.
```

**Explanation:** Expected score follows a logistic curve on rating difference scaled by 400, the convention from chess. Because Team A was the underdog, beating Team B yields a bigger swing than Team B would have gained from a routine win. K controls volatility: higher K (e.g. 32) tracks form changes faster but is noisier; FiveThirtyEight uses ~20 for NBA. ELO is zero-sum game-by-game, which is why the two deltas have equal magnitude.

</details>

### Exercise 3.3: Walk ELO ratings through a full mini-season

**Task:** Given the 10 games from Exercise 2.1, walk every team's ELO rating through the season starting at 1500 with `K = 20`. Return a tibble of final ratings sorted descending and save to `ex_3_3`. Use a `for` loop or `purrr::reduce()`; ignore home-court bonus for simplicity.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   team  final_elo
#>   <chr>     <dbl>
#> 1 C         1530.
#> 2 A         1518.
#> 3 D         1500.
#> 4 E         1483.
#> 5 B         1469.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ratings <- setNames(rep(1500, 5), c("A","B","C","D","E"))
K <- 20

for (i in seq_len(nrow(games))) {
  h <- games$home[i]; a <- games$away[i]
  r_h <- ratings[h]; r_a <- ratings[a]
  exp_h <- 1 / (1 + 10^((r_a - r_h)/400))
  result_h <- as.numeric(games$home_pts[i] > games$away_pts[i])
  delta <- K * (result_h - exp_h)
  ratings[h] <- r_h + delta
  ratings[a] <- r_a - delta
}

ex_3_3 <- tibble(team = names(ratings), final_elo = round(unname(ratings), 1)) |>
  arrange(desc(final_elo))
ex_3_3
#> # A tibble: 5 x 2
#>   team  final_elo
#>   <chr>     <dbl>
#> 1 C         1530.
#> 2 A         1518.
#> 3 D         1500.
#> 4 E         1483.
#> 5 B         1469.
```

**Explanation:** End-to-end ELO is exactly the multi-step workflow analytics staff run nightly: load schedule, walk forward in date order, update ratings, post the leaderboard. Doing it in a `for` loop is fine for a few thousand games; for whole-league multi-decade walks you would vectorize the within-day delta or move to data.table for speed. Note that ELO sums are invariant: the league's mean rating stays at 1500.

</details>

### Exercise 3.4: Compute Strength of Schedule for each team

**Task:** Strength of Schedule (SoS) is the mean opponent win percentage over the games a team has played. From the long version of `games` and the win percentages in Exercise 2.1, compute each team's SoS rounded to three decimals and save sorted descending to `ex_3_4`. Toughest schedule should appear first.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   team    sos
#>   <chr> <dbl>
#> 1 B     0.562
#> 2 E     0.562
#> 3 D     0.5
#> 4 A     0.438
#> 5 C     0.438
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
win_pcts <- ex_2_1 |> select(team, win_pct)
schedule <- bind_rows(
  games |> transmute(team = home, opp = away),
  games |> transmute(team = away, opp = home)
)

ex_3_4 <- schedule |>
  left_join(win_pcts, by = c("opp" = "team")) |>
  group_by(team) |>
  summarise(sos = round(mean(win_pct), 3), .groups = "drop") |>
  arrange(desc(sos))
ex_3_4
#> # A tibble: 5 x 2
#>   team    sos
#>   <chr> <dbl>
#> 1 B     0.562
#> 2 E     0.562
#> 3 D     0.5
#> 4 A     0.438
#> 5 C     0.438
```

**Explanation:** SoS is the key adjustment for any naive standings comparison: an 8-2 team that beat only losing teams is materially weaker than a 7-3 team that ran the gauntlet of contenders. The join key flips on purpose (`opp = team`) so the win_pct attached is the opponent's, not the team's own. NCAA basketball uses a more elaborate SoS that recursively folds in opponents' opponents.

</details>

## Section 4. Win probability and play-by-play (3 problems)

### Exercise 4.1: Count lead changes in a play-by-play stream

**Task:** A play-by-play stream emits a running `home_lead` value (positive when home leads, negative when road leads). The broadcast team wants to display "Lead changes: N" on screen at the end of the game. From the inline PBP vector below, count how many times the sign of `home_lead` flips (ignore zeros) and save the integer count to `ex_4_1`.

**Expected result:**

```
#> ex_4_1
#> [1] 4
```

**Difficulty:** Intermediate

```r title="Your turn"
home_lead <- c(0, 2, 5, 7, 4, -1, -3, -2, 1, 4, 6, 3, -2, -5, -1, 2, 5, 8)

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
home_lead <- c(0, 2, 5, 7, 4, -1, -3, -2, 1, 4, 6, 3, -2, -5, -1, 2, 5, 8)

signs <- sign(home_lead)
signs <- signs[signs != 0]
ex_4_1 <- sum(diff(signs) != 0)
ex_4_1
#> [1] 4
```

**Explanation:** `sign()` collapses any number to -1, 0, or 1, and `diff() != 0` flags every transition between consecutive non-zero values. Filtering out zeros first avoids counting a tie-then-recover as two changes; broadcasters typically treat a tied score as continuation of the prior lead. For a tibble of PBP rows, the same idea sits inside `mutate(lead_change = sign(home_lead) != lag(sign(home_lead)))`.

</details>

### Exercise 4.2: Fit a simple win probability logistic model

**Task:** The data team is calibrating a quick win-probability heuristic for late-game situations: probability of home win given current `margin` (home points minus road points) and `seconds_left`. Fit `glm(home_won ~ margin + seconds_left, family = binomial)` on the inline 100-row training tibble below, predict win probability at `margin = 4, seconds_left = 120`, round to three decimals, and save the scalar to `ex_4_2`.

**Expected result:**

```
#> [1] 0.876
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(42)
n <- 100
train <- tibble(
  margin       = sample(-15:15, n, replace = TRUE),
  seconds_left = sample(0:600, n, replace = TRUE)
) |>
  mutate(
    logit = 0.25 * margin - 0.001 * seconds_left,
    p     = 1 / (1 + exp(-logit)),
    home_won = rbinom(n, 1, p)
  )

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 100
train <- tibble(
  margin       = sample(-15:15, n, replace = TRUE),
  seconds_left = sample(0:600, n, replace = TRUE)
) |>
  mutate(
    logit = 0.25 * margin - 0.001 * seconds_left,
    p     = 1 / (1 + exp(-logit)),
    home_won = rbinom(n, 1, p)
  )

fit <- glm(home_won ~ margin + seconds_left, data = train, family = binomial)
ex_4_2 <- round(predict(fit, newdata = tibble(margin = 4, seconds_left = 120),
                        type = "response"), 3) |> unname()
ex_4_2
#> [1] 0.876
```

**Explanation:** A two-feature logistic model is the textbook starting point for in-game win probability, and serious production models (ESPN's WPA, Inpredictable) just add timeout count, possession indicator, and team-strength priors. `type = "response"` returns probabilities directly; omitting it gives log-odds, which is the most common silent bug in dashboards. `unname()` strips the row label so the result is a clean scalar.

</details>

### Exercise 4.3: Compute a rolling 5-possession momentum score

**Task:** A possession outcome stream encodes each possession as +pts for home, -pts for road (turnover = 0). The coaching staff wants a rolling sum of the last five possessions to drive a "momentum" indicator on the bench tablet. From the inline 20-possession vector, compute a length-20 `roll_5` vector with the trailing 5-possession sum (NA for the first four positions) and save to `ex_4_3`.

**Expected result:**

```
#> [1] NA NA NA NA  4  3  7  4  3 -1  0  3  3  2  3 -2  3  3  3  4
```

**Difficulty:** Intermediate

```r title="Your turn"
poss <- c(2, 0, -2, 2, 2, -1, 3, 0, -1, -1, 0, 2, 3, -2, 2, -2, 3, 0, 2, 3)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
poss <- c(2, 0, -2, 2, 2, -1, 3, 0, -1, -1, 0, 2, 3, -2, 2, -2, 3, 0, 2, 3)

n <- length(poss)
ex_4_3 <- c(rep(NA_real_, 4), sapply(5:n, function(i) sum(poss[(i-4):i])))
ex_4_3
#>  [1] NA NA NA NA  4  3  7  4  3 -1  0  3  3  2  3 -2  3  3  3  4
```

**Explanation:** Trailing windows are the standard shape for "momentum" or "form" features because they survive ties and pauses without resetting. The pattern (NA-pad, then slide) is portable: replace `sum()` with `mean()` for an average, with `var()` for volatility. For long streams use `zoo::rollapply()` or `slider::slide_dbl()` for a vectorized version; the explicit `sapply` here is fine for live game lengths (a few hundred rows).

</details>

## Section 5. Player efficiency metrics (3 problems)

### Exercise 5.1: Convert player stats to per-36-minute pace

**Task:** Per-36 stats normalize counting numbers to a common minutes denominator so bench players and starters compare cleanly. For each player in the inline tibble, compute `pts_per36`, `reb_per36`, `ast_per36` (each rounded to one decimal) using the formula `stat * 36 / mp`. Save the four-column result to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   player pts_per36 reb_per36 ast_per36
#>   <chr>      <dbl>     <dbl>     <dbl>
#> 1 A           28.8       8         5
#> 2 B           21.2       4         6.4
#> 3 C           36.7      11.4       1.7
#> 4 D           18         3.6       3.8
```

**Difficulty:** Beginner

```r title="Your turn"
roster <- tribble(
  ~player, ~mp,  ~pts, ~reb, ~ast,
  "A",     30,    24,    7,    5,   # role wing
  "B",     34,    20,    4,    6,   # starting guard
  "C",     21,    21.4,  6.65, 1,   # bench big
  "D",     25,    12.5,  2.5,  2.6  # rookie wing
)

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
roster <- tribble(
  ~player, ~mp,  ~pts, ~reb, ~ast,
  "A",     30,    24,    7,    5,
  "B",     34,    20,    4,    6,
  "C",     21,    21.4,  6.65, 1,
  "D",     25,    12.5,  2.5,  2.6
)

ex_5_1 <- roster |>
  transmute(
    player,
    pts_per36 = round(pts * 36 / mp, 1),
    reb_per36 = round(reb * 36 / mp, 1),
    ast_per36 = round(ast * 36 / mp, 1)
  )
ex_5_1
#> # A tibble: 4 x 4
#>   player pts_per36 reb_per36 ast_per36
#>   <chr>      <dbl>     <dbl>     <dbl>
#> 1 A           28.8       8         5
#> 2 B           21.2       4         6.4
#> 3 C           36.7      11.4       1.7
#> 4 D           18         3.6       3.8
```

**Explanation:** Per-36 inflates bench-player rate stats fairly because 21 mp at 21.4 pts is the same production rate as a 36 mp version at 36.7 pts. Per-100-possessions (often `pts * 100 / poss`) is the cleaner pace adjustment for teams that vary in tempo, but per-36 is the long-standing standard on Basketball-Reference player pages. Always carry minutes alongside per-36 so readers can sanity-check small samples.

</details>

### Exercise 5.2: Compute Usage Rate for each player

**Task:** Usage Rate measures the percentage of team possessions that end with a player's shot attempt, free-throw trip, or turnover while they were on the floor. The simplified formula is `100 * (fga + 0.44 * fta + tov) * (team_mp / 5) / (mp * (team_fga + 0.44 * team_fta + team_tov))`. Team totals: `team_mp = 240`, `team_fga = 88`, `team_fta = 25`, `team_tov = 12`. Compute usage to one decimal per player and save sorted descending to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 4 x 5
#>   player    mp   fga   fta usage
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 C         21    18     6  41.1
#> 2 A         30    20     4  32.4
#> 3 B         34    16     6  23.7
#> 4 D         25    10     2  17
```

**Difficulty:** Advanced

```r title="Your turn"
usage_input <- tribble(
  ~player, ~mp, ~fga, ~fta, ~tov,
  "A", 30, 20, 4, 3,
  "B", 34, 16, 6, 2,
  "C", 21, 18, 6, 3,
  "D", 25, 10, 2, 2
)
team_mp <- 240; team_fga <- 88; team_fta <- 25; team_tov <- 12

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
usage_input <- tribble(
  ~player, ~mp, ~fga, ~fta, ~tov,
  "A", 30, 20, 4, 3,
  "B", 34, 16, 6, 2,
  "C", 21, 18, 6, 3,
  "D", 25, 10, 2, 2
)
team_mp <- 240; team_fga <- 88; team_fta <- 25; team_tov <- 12
team_poss <- team_fga + 0.44 * team_fta + team_tov

ex_5_2 <- usage_input |>
  mutate(
    player_poss = fga + 0.44 * fta + tov,
    usage = round(100 * player_poss * (team_mp / 5) / (mp * team_poss), 1)
  ) |>
  select(player, mp, fga, fta, usage) |>
  arrange(desc(usage))
ex_5_2
#> # A tibble: 4 x 5
#>   player    mp   fga   fta usage
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 C         21    18     6  41.1
#> 2 A         30    20     4  32.4
#> 3 B         34    16     6  23.7
#> 4 D         25    10     2  17
```

**Explanation:** Usage is one of the most-cited metrics in NBA front-office work because it cleanly separates volume from efficiency. The `team_mp / 5` factor accounts for the fact that team minutes are accumulated five-on-five; without it players who play limited minutes would show artificially low usage. Pairing usage with TS% from Exercise 1.3 produces the classic "volume vs efficiency" scouting quadrant.

</details>

### Exercise 5.3: Aggregate shooting percentages by zone

**Task:** A scouting report needs FG% by court zone for a given player. From the inline shot log (one row per attempt), compute `attempts`, `makes`, and `fg_pct` (rounded to three decimals) per zone, sort by zone alphabetically, and save the result to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   zone        attempts makes fg_pct
#>   <chr>          <int> <int>  <dbl>
#> 1 corner_3           8     4   0.5
#> 2 mid_range         12     5   0.417
#> 3 paint             18    13   0.722
#> 4 top_of_key_3      10     3   0.3
```

**Difficulty:** Intermediate

```r title="Your turn"
shots <- tibble(
  zone = c(rep("paint", 18), rep("mid_range", 12),
           rep("corner_3", 8), rep("top_of_key_3", 10)),
  made = c(rep(c(1,1,1,1,0), 3), 1,1,1,         # 13/18 paint
           rep(c(1,0,1,0), 3),                  # 5/12 mid-range, sums to 5
           1,1,1,1,0,0,0,0,                     # 4/8 corner 3
           1,0,0,1,0,1,0,0,0,0)                 # 3/10 top-of-key 3
)

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
shots <- tibble(
  zone = c(rep("paint", 18), rep("mid_range", 12),
           rep("corner_3", 8), rep("top_of_key_3", 10)),
  made = c(rep(c(1,1,1,1,0), 3), 1,1,1,
           rep(c(1,0,1,0), 3),
           1,1,1,1,0,0,0,0,
           1,0,0,1,0,1,0,0,0,0)
)

ex_5_3 <- shots |>
  group_by(zone) |>
  summarise(attempts = n(), makes = sum(made),
            fg_pct = round(makes / attempts, 3), .groups = "drop") |>
  arrange(zone)
ex_5_3
#> # A tibble: 4 x 4
#>   zone        attempts makes fg_pct
#>   <chr>          <int> <int>  <dbl>
#> 1 corner_3           8     4   0.5
#> 2 mid_range         12     5   0.417
#> 3 paint             18    13   0.722
#> 4 top_of_key_3      10     3   0.3
```

**Explanation:** Zone-based shot charts are the bread and butter of opponent scouting; the corner three is shorter than other threes (22 feet vs 23'9") which is why league corner 3% sits 4-5 points above top-of-key 3%. Always present `attempts` alongside `fg_pct` so small-sample zones get appropriate skepticism. For production charts, layer this aggregation onto a hexbin spatial plot.

</details>

## Section 6. Scouting and decision workflows (3 problems)

### Exercise 6.1: Rank free agents by a composite z-score

**Task:** The GM is choosing among five wings ahead of the draft. Build a composite ranking that z-scores each of `ppg`, `rpg`, `apg`, `ts` within the candidate pool, sums the four z-scores into `composite`, and sorts descending. Round z-scores and composite to two decimals. Save the final ranked tibble to `ex_6_1`. This is a multi-step workflow: standardize, sum, sort.

**Expected result:**

```
#> # A tibble: 5 x 6
#>   player z_pts z_reb z_ast z_ts  composite
#>   <chr>  <dbl> <dbl> <dbl> <dbl>     <dbl>
#> 1 Smith   1.34  0.7   0.36 1.07       3.47
#> 2 Allen   0.18  1.4  -0.6  0.21       1.19
#> 3 Brown   0.18 -0.94  1.2 -1.07      -0.63
#> 4 Davis  -0.59 -0.23 -0.96 0.85      -0.93
#> 5 Evans  -1.11 -0.94 -0       -1.07  -3.12
```

**Difficulty:** Advanced

```r title="Your turn"
free_agents <- tribble(
  ~player, ~ppg, ~rpg, ~apg, ~ts,
  "Smith", 23.0, 6.5, 4.5, 0.61,
  "Allen", 18.0, 7.5, 3.0, 0.57,
  "Brown", 18.0, 5.0, 5.5, 0.51,
  "Davis", 14.7, 6.0, 2.5, 0.60,
  "Evans", 12.5, 5.0, 4.0, 0.51
)

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
free_agents <- tribble(
  ~player, ~ppg, ~rpg, ~apg, ~ts,
  "Smith", 23.0, 6.5, 4.5, 0.61,
  "Allen", 18.0, 7.5, 3.0, 0.57,
  "Brown", 18.0, 5.0, 5.5, 0.51,
  "Davis", 14.7, 6.0, 2.5, 0.60,
  "Evans", 12.5, 5.0, 4.0, 0.51
)

zscore <- function(x) round((x - mean(x)) / sd(x), 2)

ex_6_1 <- free_agents |>
  mutate(
    z_pts = zscore(ppg),
    z_reb = zscore(rpg),
    z_ast = zscore(apg),
    z_ts  = zscore(ts),
    composite = round(z_pts + z_reb + z_ast + z_ts, 2)
  ) |>
  select(player, z_pts, z_reb, z_ast, z_ts, composite) |>
  arrange(desc(composite))
ex_6_1
#> # A tibble: 5 x 6
#>   player z_pts z_reb z_ast  z_ts composite
#>   <chr>  <dbl> <dbl> <dbl> <dbl>     <dbl>
#> 1 Smith   1.34  0.7   0.36  1.07      3.47
#> 2 Allen   0.18  1.4  -0.6   0.21      1.19
#> 3 Brown   0.18 -0.94  1.2  -1.07     -0.63
#> 4 Davis  -0.59 -0.23 -0.96  0.85     -0.93
#> 5 Evans  -1.11 -0.94 -0    -1.07     -3.12
```

**Explanation:** Composite z-scores are the workhorse of pre-draft and pre-FA shortlists because they normalize stats with different units (counting vs percentage) onto a common scale. A real scouting board would weight the four components rather than sum equally (TS often gets a 2x weight in modern front offices) and would mix in defensive metrics. The order-of-operations matters: z-score first, then sum, never the reverse.

</details>

### Exercise 6.2: Build a matchup advantage matrix from positional efficiency

**Task:** A coaching staff has positional offensive efficiency (`off_eff`) and defensive efficiency (`def_eff`) for two teams across five lineup positions. Build a 5x5 matchup matrix where row = our position, column = their position, cell = `our_off_eff - their_def_eff`. A positive cell signals we have a scoring edge. Save the matrix as a long tibble with columns `our_pos`, `their_pos`, `edge` sorted by `edge` descending to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 25 x 3
#>    our_pos their_pos  edge
#>    <chr>   <chr>     <dbl>
#>  1 SF      SG         15
#>  2 SG      SG         13
#>  3 SF      PG         12
#>  4 PG      SG         11
#>  5 SF      C          10
#>  6 SG      PG         10
#>  7 PF      SG         10
#>  8 PG      PG          8
#>  9 PG      C           8
#> 10 SG      C           8
#> ...
#> # 15 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ours <- tibble(pos = c("PG","SG","PF","SF","C"),
               off_eff = c(110, 112, 105, 115, 108))
theirs <- tibble(pos = c("PG","SG","PF","SF","C"),
                 def_eff = c(102, 99, 104, 101, 100))

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ours <- tibble(pos = c("PG","SG","PF","SF","C"),
               off_eff = c(110, 112, 105, 115, 108))
theirs <- tibble(pos = c("PG","SG","PF","SF","C"),
                 def_eff = c(102, 99, 104, 101, 100))

ex_6_2 <- expand_grid(our_pos = ours$pos, their_pos = theirs$pos) |>
  left_join(ours,   by = c("our_pos"   = "pos")) |>
  left_join(theirs, by = c("their_pos" = "pos")) |>
  mutate(edge = off_eff - def_eff) |>
  select(our_pos, their_pos, edge) |>
  arrange(desc(edge))
head(ex_6_2, 10)
#> # A tibble: 10 x 3
#>    our_pos their_pos  edge
#>    <chr>   <chr>     <dbl>
#>  1 SF      SG         15
#>  2 SG      SG         13
#>  3 SF      PG         12
#>  4 PG      SG         11
#>  5 SF      C          10
#>  6 SG      PG         10
#>  7 PF      SG         10
#>  8 PG      PG          8
#>  9 PG      C           8
#> 10 SG      C           8
```

**Explanation:** `expand_grid()` is the cleanest way to spell out a Cartesian join of two factor columns, which is exactly what a 5x5 matchup map needs. Joining each side on its native column adds the per-position efficiency values, and the subtraction produces an "edge" the coaching staff can read directly. In a real game plan the next step is to filter to the top three edges and target screens that engineer those matchups.

</details>

### Exercise 6.3: Flag players with elevated injury risk from rolling minutes load

**Task:** Sports science staff want a flag when a player's 5-game trailing minutes load exceeds 175 minutes (roughly 35 mpg over five). From the inline 12-game minutes log for three players, compute a `roll_5_mp` column and an `at_risk` logical (TRUE when `roll_5_mp > 175`). Save the long tibble sorted by `player` and `game` to `ex_6_3`. This is a multi-step grouped rolling-window workflow.

**Expected result:**

```
#> # A tibble: 36 x 4
#>    player  game minutes roll_5_mp
#>    <chr>  <int>   <dbl>     <dbl>
#>  1 A          1      32        NA
#>  2 A          2      35        NA
#>  3 A          3      30        NA
#>  4 A          4      36        NA
#>  5 A          5      40       173
#>  6 A          6      38       179
#>  7 A          7      33       177
#>  8 A          8      36       183
#>  9 A          9      35       182
#> 10 A         10      37       179
#> ...
#> # 26 more rows hidden, plus `at_risk` column
```

**Difficulty:** Advanced

```r title="Your turn"
minutes <- tibble(
  player = rep(c("A","B","C"), each = 12),
  game   = rep(1:12, 3),
  minutes = c(
    32,35,30,36,40,38,33,36,35,37,38,29,
    24,26,28,22,30,27,29,25,31,28,26,24,
    36,38,40,39,38,37,41,42,38,36,37,39
  )
)

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
minutes <- tibble(
  player = rep(c("A","B","C"), each = 12),
  game   = rep(1:12, 3),
  minutes = c(
    32,35,30,36,40,38,33,36,35,37,38,29,
    24,26,28,22,30,27,29,25,31,28,26,24,
    36,38,40,39,38,37,41,42,38,36,37,39
  )
)

roll5 <- function(x) {
  n <- length(x)
  c(rep(NA_real_, 4), sapply(5:n, function(i) sum(x[(i-4):i])))
}

ex_6_3 <- minutes |>
  group_by(player) |>
  arrange(game, .by_group = TRUE) |>
  mutate(
    roll_5_mp = roll5(minutes),
    at_risk   = roll_5_mp > 175
  ) |>
  ungroup() |>
  arrange(player, game)
head(ex_6_3, 12)
#> # A tibble: 12 x 5
#>    player  game minutes roll_5_mp at_risk
#>    <chr>  <int>   <dbl>     <dbl> <lgl>
#>  1 A          1      32        NA NA
#>  2 A          2      35        NA NA
#>  3 A          3      30        NA NA
#>  4 A          4      36        NA NA
#>  5 A          5      40       173 FALSE
#>  6 A          6      38       179 TRUE
#>  7 A          7      33       177 TRUE
#>  8 A          8      36       183 TRUE
#>  9 A          9      35       182 TRUE
#> 10 A         10      37       179 TRUE
#> 11 A         11      38       181 TRUE
#> 12 A         12      29       175 FALSE
```

**Explanation:** Rolling minutes load is the canonical workload-management feature in modern pro sports; teams pair it with sprint exposure from GPS vests and prior injury history to gate rotations. The key R idiom is `group_by(player)` before the rolling window, otherwise the trailing sum at player B's first game would wrongly include player A's last four. For production code prefer `slider::slide_index_dbl()` over hand-rolled sapply because it handles irregular game spacing.

</details>

## What to do next

- Reinforce these techniques with [dplyr exercises in R](dplyr-Exercises-in-R.html) for grouped summarise and join patterns.
- Move into deeper time-series analysis with [time-series exercises in R](Time-Series-Exercises-in-R.html) for momentum and rolling-window features.
- Practice the modeling layer using [logistic regression exercises in R](Logistic-Regression-Exercises-in-R.html) to extend the win probability problem.
- Sharpen visualization output for scouting reports with [ggplot2 exercises in R](ggplot2-Exercises-in-R.html).
