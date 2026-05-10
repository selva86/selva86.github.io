---
title: "tidyr Nest and Unnest Exercises in R: 25 Practice Problems"
slug: "tidyr-Nest-Unnest-Exercises-in-R"
description: "Master tidyr nest/unnest with 25 practice problems: list-columns, many-models, hoist, pack, unpack. Hidden solutions."
keywords: "tidyr nest exercises, unnest R exercises, list column R practice, many models R, tidyr nest unnest"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "tidyr Nest/Unnest Exercises"
sidebar_order: 130
fr_parent: "Data-Wrangling-With-tidyr.html"
auto_link_terms: "tidyr nest exercises|unnest R exercises|list column R practice|many models R"
auto_link_case_sensitive: false
target_keyword: "tidyr nest exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# tidyr Nest and Unnest Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on nest, unnest, hoist, pack, unpack, and the many-models pattern. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(tidyr)
library(dplyr)
library(purrr)
library(tibble)
library(broom)
```

### Exercise 1: nest by group

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |> nest()
```

</details>

### Exercise 2: nest specific columns

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
iris |> nest(sepal = starts_with("Sepal"))
```

</details>

### Exercise 3: unnest

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nested <- iris |> group_by(Species) |> nest()
nested |> unnest(data)
```

</details>

### Exercise 4: unnest_longer (vectors)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, vals = list(c(10,20), c(30,40,50))) |>
  unnest_longer(vals)
```

</details>

### Exercise 5: unnest_wider (named lists)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, payload = list(list(a=1,b=2), list(a=10,b=20))) |>
  unnest_wider(payload)
```

</details>

### Exercise 6: hoist specific fields

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, payload = list(list(a=1,b=2,c=3), list(a=10,b=20,c=30))) |>
  hoist(payload, val_a = "a", val_c = "c")
```

</details>

### Exercise 7: pack

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |> pack(sepal = starts_with("Sepal"))
```

</details>

### Exercise 8: unpack

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
packed <- iris |> pack(sepal = starts_with("Sepal"))
packed |> unpack(sepal)
```

</details>

### Exercise 9: chop

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = c(1,1,2,2), v = 1:4) |> chop(v)
```

</details>

### Exercise 10: unchop

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2, v = list(1:2, 3:4)) |> unchop(v)
```

</details>

### Exercise 11: nest into list-column from groups

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl) |> nest()
```

</details>

### Exercise 12: Many models per group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)))
```

</details>

### Exercise 13: Tidy results from per-group models

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)),
         tidy  = map(model, broom::tidy)) |>
  unnest(tidy)
```

</details>

### Exercise 14: Glance per group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)),
         glance = map(model, broom::glance)) |>
  unnest(glance) |>
  select(Species, r.squared, p.value)
```

</details>

### Exercise 15: Predict back into the data

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  nest() |>
  mutate(model = map(data, ~ lm(Sepal.Length ~ Petal.Length, data = .x)),
         pred  = map2(model, data, ~ predict(.x, .y))) |>
  unnest(c(data, pred))
```

</details>

### Exercise 16: nest then summarise list-col

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  summarise(stats = list(summary(Sepal.Length)))
```

</details>

### Exercise 17: unnest_longer with names

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2,
       vals = list(c(a=1, b=2), c(a=10, b=20))) |>
  unnest_longer(vals)
```

</details>

### Exercise 18: hoist with deep paths

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1, json = list(list(meta = list(version = "1.2"), data = 5))) |>
  hoist(json, version = c("meta","version"), data = "data")
```

</details>

### Exercise 19: nest by multiple vars

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mtcars |> group_by(cyl, gear) |> nest()
```

</details>

### Exercise 20: List-column from a custom function

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  summarise(quartiles = list(quantile(Sepal.Length, c(0.25, 0.5, 0.75))))
```

</details>

### Exercise 21: unnest with names_repair

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:2,
       v1 = list(tibble(x = 1)), v2 = list(tibble(x = 2))) |>
  unnest(c(v1, v2), names_repair = "unique")
```

</details>

### Exercise 22: Filter list elements then unnest

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tibble(id = 1:3, v = list(1:3, 1, 1:5)) |>
  mutate(v = map(v, ~ .x[.x > 1])) |>
  unnest_longer(v)
```

</details>

### Exercise 23: nest_join

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
parents <- tibble(id = 1:2)
children <- tibble(parent_id = c(1,1,2), value = c("a","b","c"))
parents |> nest_join(children, by = c("id" = "parent_id"))
```

</details>

### Exercise 24: Walk per nested group

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  nest() |>
  mutate(_ = walk2(data, Species, ~ message(.y, ": ", nrow(.x), " rows")))
```

</details>

### Exercise 25: Round-trip nest -> unnest

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
n <- iris |> group_by(Species) |> nest()
back <- n |> unnest(data)
identical(arrange(iris, Species), arrange(back, Species))
```

</details>

## What to do next

- **tidyr-Exercises** (shipped) — broader tidyr practice.
- **purrr-Exercises** (shipped) — list-col iteration drills.
