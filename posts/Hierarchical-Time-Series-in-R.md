---
title: "Hierarchical and Grouped Time Series in R: Reconciliation"
slug: "Hierarchical-Time-Series-in-R"
description: "Forecast hierarchical and grouped time series in R with fable. Build the hierarchy with aggregate_key(), then reconcile with bottom-up, top-down and MinT."
keywords: "hierarchical time series in R, grouped time series, forecast reconciliation, aggregate_key, min_trace, MinT reconciliation, bottom-up forecasting, top-down forecasting, coherent forecasts, fable reconcile"
auto_link_terms: "hierarchical time series|hierarchical time series in R|grouped time series|forecast reconciliation|reconciled forecasts|coherent forecasts|aggregate_key()|min_trace()|reconcile()|MinT reconciliation|bottom-up forecasting|top-down forecasting|middle-out forecasting|summing matrix|hierarchical forecasting"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "TS2-12.1"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Hierarchical Time Series"
sidebar_order: "34"
difficulty: "Advanced"
---

<p class="lead">A hierarchical time series is a set of series that must add up: store sales sum to region sales, region sales sum to national sales. Forecast each series on its own and those totals stop matching. Reconciliation fixes that by nudging every forecast by the smallest amount that makes the whole set add up again.</p>

## What is a hierarchical time series?

Australia's tourism board publishes quarterly overnight trips for every state. Add the eight state numbers together and you get the national number, exactly, in every quarter of the record. That word "exactly" is the whole subject of this tutorial. Let's pull the real data first and look at it. Everything here uses the tidyverts stack: `tsibble` holds the data, `fable` fits the models.

The `tourism` dataset ships inside the `tsibble` package. It is quarterly, it runs from 1998 to 2017, and it is broken down by region, state and trip purpose. We only want state-level totals for now, so we add up the regions and purposes inside each state and each quarter.

```r title="Build the state-level tourism series"
library(tsibble)
library(fable)
library(dplyr)

trips <- tourism |>
  as_tibble() |>
  summarise(Trips = sum(Trips), .by = c(Quarter, State)) |>
  as_tsibble(index = Quarter, key = State)

trips
#> # A tsibble: 640 x 3 [1Q]
#> # Key:       State [8]
#>    Quarter State Trips
#>      <qtr> <chr> <dbl>
#>  1 1998 Q1 ACT    551.
#>  2 1998 Q2 ACT    416.
#>  3 1998 Q3 ACT    436.
#>  4 1998 Q4 ACT    450.
#>  5 1999 Q1 ACT    379.
#>  6 1999 Q2 ACT    558.
#>  7 1999 Q3 ACT    449.
#>  8 1999 Q4 ACT    595.
#>  9 2000 Q1 ACT    600.
#> 10 2000 Q2 ACT    557.
#> # ℹ 630 more rows
```

Read the header before the rows. `A tsibble: 640 x 3 [1Q]` says we have 640 rows, three columns and a quarterly index. `Key: State [8]` says the rows are not one series, they are eight separate series stacked on top of each other, told apart by the `State` column. A tsibble always needs an index (the time column) and a key (whatever identifies each individual series). We converted to a plain tibble first because `summarise()` behaves differently on a tsibble, then converted back once the totals were computed. The `.by =` argument is dplyr's inline grouping: it says "give me one sum for each distinct combination of `Quarter` and `State`", and does the same job as wrapping the call in `group_by()`.

Eighty quarters times eight states gives exactly the 640 rows we see. That is the raw material. `Trips` counts overnight trips in thousands, so `551.` means about 551,000 trips.

This shape, many small series that roll up into bigger ones, is what a hierarchy looks like.

![A hierarchy where every level is the sum of the level below it](screenshots/Hierarchical-Time-Series-in-R-hierarchy-tree.webp)

*Figure 1: A hierarchy: every level is the sum of the level below it.*

The bottom of the tree holds the finest series you actually measure. Every level above it is a sum of the level below. The single series at the very top is usually the one your CEO cares about, and the ones at the bottom are the ones your operations team cares about.

Now let's verify the claim about adding up. Take a single quarter, print all eight states and add them together.

```r title="Check that the states sum to the national total"
q4 <- trips |> filter(Quarter == yearquarter("2017 Q4"))

q4
#> # A tsibble: 8 x 3 [1Q]
#> # Key:       State [8]
#>   Quarter State              Trips
#>     <qtr> <chr>              <dbl>
#> 1 2017 Q4 ACT                 720.
#> 2 2017 Q4 New South Wales    8542.
#> 3 2017 Q4 Northern Territory  346.
#> 4 2017 Q4 Queensland         5814.
#> 5 2017 Q4 South Australia    1869.
#> 6 2017 Q4 Tasmania            801.
#> 7 2017 Q4 Victoria           6865.
#> 8 2017 Q4 Western Australia  2636.

sum(q4$Trips)
#> [1] 27593.55
```

`yearquarter("2017 Q4")` turns the text into the same quarterly type that the index uses, so the comparison works. The filter leaves eight rows, one per state, and `sum()` adds their `Trips` column.

Australians took about 27.6 million domestic overnight trips in the last quarter of 2017. That number is not an estimate or an approximation. It is the sum of the eight rows above it, and it will be the sum of those eight rows in every single quarter of the data.

[KEY INSIGHT]
**The summing constraint is a property of the data, not of your model.** The states add to the national total because national tourism is literally defined as the sum of state tourism. Any forecast that breaks that relationship is describing a world that cannot happen.

**Try it:** Work out what share of the 2017 Q4 national total each state accounts for, and print the three biggest.

```r title="Your turn: rank the states by share"
ex_shares <- NULL
# 1. ex_shares: add a column Share = Trips / sum(Trips) * 100 to q4
# 2. sort it so the biggest state is first, and keep only State and Share
# your code here
# Expected: New South Wales is first, at about 31 percent
```

<details>
<summary>Click to reveal solution</summary>

```r title="State shares solution"
ex_shares <- q4 |>
  as_tibble() |>
  mutate(Share = round(Trips / sum(Trips) * 100, 1)) |>
  arrange(desc(Share)) |>
  select(State, Share)

head(ex_shares, 3)
#> # A tibble: 3 × 2
#>   State           Share
#>   <chr>           <dbl>
#> 1 New South Wales  31
#> 2 Victoria         24.9
#> 3 Queensland       21.1
```

**Explanation:** `as_tibble()` drops the tsibble machinery so `sum(Trips)` runs over all eight rows instead of being blocked by the key. Three states carry more than three quarters of Australian domestic tourism, which is worth remembering: hierarchies are usually very lopsided.

</details>

## Why don't independent forecasts add up?

The obvious way to forecast a hierarchy is to forecast each piece separately. Fit a model to the national series, fit a model to each state series, publish all nine numbers. That approach fails in a specific way, and seeing it happen once is the fastest route to understanding why reconciliation exists.

The reason it fails is that the national model never looks at the states. It sees one series of numbers and finds the trend and seasonality in that series. Each state model does the same for its own series. Nothing in that process knows the nine forecasts are supposed to be related.

Let's build the national series, fit exponential smoothing to everything, forecast a year ahead, and compare the national forecast with the sum of the state forecasts. `ETS()` is fable's exponential smoothing model, which picks its own trend and seasonal form automatically.

```r title="Forecast the total and the parts separately"
national <- trips |>
  as_tibble() |>
  summarise(Trips = sum(Trips), .by = Quarter) |>
  as_tsibble(index = Quarter)

fc_national <- national |> model(ETS(Trips)) |> forecast(h = 4)
fc_states   <- trips    |> model(ETS(Trips)) |> forecast(h = 4)

fc_national |>
  as_tibble() |>
  select(Quarter, national_forecast = .mean) |>
  left_join(
    fc_states |> as_tibble() |> summarise(sum_of_states = sum(.mean), .by = Quarter),
    by = "Quarter"
  ) |>
  mutate(gap = round(national_forecast - sum_of_states, 1))
#> # A tibble: 4 × 4
#>   Quarter national_forecast sum_of_states   gap
#>     <qtr>             <dbl>         <dbl> <dbl>
#> 1 2018 Q1            29068.        28925.  144.
#> 2 2018 Q2            27794.        26929.  865.
#> 3 2018 Q3            27619.        26267. 1352.
#> 4 2018 Q4            28627.        27166. 1461
```

Follow the pipeline. `model(ETS(Trips))` fits one model per series, so it produces one model for `national` and eight for `trips`. `forecast(h = 4)` extends each of them four quarters past the end of the data. The `.mean` column holds the point forecast. We then pull out the national point forecasts, collapse the state point forecasts into one sum per quarter, join those two tables on `Quarter`, and take the difference.

The `gap` column is the damage. In 2018 Q4 the national model predicts 28,627 thousand trips while the eight state models add up to 27,166 thousand. Roughly 1.46 million trips exist in one forecast and not in the other. There is no way to publish both numbers and have them both be true.

A forecast set with gaps like this is called **incoherent**. A forecast set where every total equals the sum of its parts is called **coherent**.

[WARNING]
**Incoherence is completely silent.** R does not warn you, no model diagnostic flags it, and every individual forecast looks perfectly reasonable on its own chart. You only find out when someone compares two dashboards and asks why the numbers disagree.

Notice also that the gap grows with the horizon: 144 in the first quarter, 1,461 in the fourth. Forecast errors accumulate independently in each model, so the further out you look, the larger the difference between the two sets of numbers.

**Try it:** The raw gap is hard to judge without context. Express it as a percentage of the national forecast instead.

```r title="Your turn: express the gap as a percentage"
ex_gap_pct <- NULL
# ex_gap_pct: repeat the join above, but report the gap as a percentage
# of national_forecast, rounded to 2 decimals
# your code here
# Expected: the gap grows from about 0.5 percent to about 5 percent
```

<details>
<summary>Click to reveal solution</summary>

```r title="Percentage gap solution"
ex_gap_pct <- fc_national |>
  as_tibble() |>
  select(Quarter, national_forecast = .mean) |>
  left_join(
    fc_states |> as_tibble() |> summarise(sum_of_states = sum(.mean), .by = Quarter),
    by = "Quarter"
  ) |>
  mutate(gap_pct = round((national_forecast - sum_of_states) / national_forecast * 100, 2)) |>
  select(Quarter, gap_pct)

ex_gap_pct
#> # A tibble: 4 × 2
#>   Quarter gap_pct
#>     <qtr>   <dbl>
#> 1 2018 Q1    0.49
#> 2 2018 Q2    3.11
#> 3 2018 Q3    4.9
#> 4 2018 Q4    5.1
```

**Explanation:** A half-percent disagreement in the first quarter is easy to hand-wave away. A five-percent disagreement a year out is a different conversation entirely, and it is the one you will be having with whoever owns the budget.

</details>

## How do you build a hierarchy with aggregate_key()?

To fix incoherence, fable first has to know that the eight state series belong to one hierarchy. Right now `trips` is just eight unrelated series that happen to sit in the same table. The function that adds the structure is `aggregate_key()`.

`aggregate_key()` takes a key specification and an aggregation rule, and returns a new tsibble containing the original series **plus** every total implied by that structure. Ask for `State` and you get the eight states back, plus a ninth series holding their sum.

```r title="Add the aggregate series with aggregate_key()"
trips_hts <- trips |> aggregate_key(State, Trips = sum(Trips))

trips_hts
#> # A tsibble: 720 x 3 [1Q]
#> # Key:       State [9]
#>    Quarter State         Trips
#>      <qtr> <chr*>        <dbl>
#>  1 1998 Q1 <aggregated> 23182.
#>  2 1998 Q2 <aggregated> 20323.
#>  3 1998 Q3 <aggregated> 19827.
#>  4 1998 Q4 <aggregated> 20830.
#>  5 1999 Q1 <aggregated> 22087.
#>  6 1999 Q2 <aggregated> 21458.
#>  7 1999 Q3 <aggregated> 19914.
#>  8 1999 Q4 <aggregated> 20028.
#>  9 2000 Q1 <aggregated> 22339.
#> 10 2000 Q2 <aggregated> 19941.
#> # ℹ 710 more rows

n_keys(trips_hts)
#> [1] 9
```

Three things changed. The row count went from 640 to 720, which is the 80 extra rows of the new national series. `Key: State [9]` confirms there are now nine series instead of eight. And the `State` column prints as `<chr*>` rather than `<chr>`, because it is no longer plain text.

The rows shown are the new series. Its `State` value is the special marker `<aggregated>`, which is how fable says "this row is a total across every state, not one particular state". The `Trips` value of 23,182 for 1998 Q1 is the sum of all eight states in that quarter, computed by the `Trips = sum(Trips)` rule we passed in.

Printing the distinct keys makes the whole structure visible at once.

```r title="List every series in the hierarchy"
trips_hts |> as_tibble() |> distinct(State)
#> # A tibble: 9 × 1
#>   State
#>   <chr*>
#> 1 <aggregated>
#> 2 ACT
#> 3 New South Wales
#> 4 Northern Territory
#> 5 Queensland
#> 6 South Australia
#> 7 Tasmania
#> 8 Victoria
#> 9 Western Australia
```

One total plus eight states. That is the complete hierarchy fable will now reason about, and the `<aggregated>` row is the only thing we added.

[NOTE]
**The aggregation column is a special vector type called an agg_vec, not a character column.** That is what the asterisk in `<chr*>` means. It mostly behaves like text, but to filter on it you use the helper `is_aggregated()` rather than comparing against a string, and to turn it back into ordinary text you call `as.character()`.

**Try it:** Use `is_aggregated()` to pull out only the national rows and count them.

```r title="Your turn: count the national rows"
ex_n_total <- NULL
# ex_n_total: use is_aggregated() inside filter() to keep only the national rows
# of trips_hts, then count them with nrow()
# your code here
# Expected: one row per quarter, 80 in total
```

<details>
<summary>Click to reveal solution</summary>

```r title="Counting aggregated rows solution"
ex_n_total <- trips_hts |> filter(is_aggregated(State)) |> nrow()
ex_n_total
#> [1] 80
```

**Explanation:** Eighty quarters, one national row each. Flip the test to `!is_aggregated(State)` and you get the other 640 rows, the eight original state series.

</details>

## How do you reconcile forecasts with fable?

Now for the part that fixes the gap. Reconciliation is a step that sits between fitting models and producing forecasts. You fit your models as usual, then you tell fable "take these fitted models and produce a coherent version of their forecasts using this method". The verb is `reconcile()`.

![Reconciliation maps base forecasts down to a bottom level then sums them back up](screenshots/Hierarchical-Time-Series-in-R-reconciliation-flow.webp)

*Figure 2: Reconciliation maps base forecasts down to a bottom level with G, then sums them back up with S.*

The forecasts you get before reconciliation have a name: **base forecasts**. They are the raw, independent, incoherent predictions from each model. Reconciliation never refits anything. It takes the base forecasts as input and adjusts them.

Here we fit one ETS model per series, then add three reconciled versions of it side by side so we can compare them later. Keeping the unreconciled `base` column is deliberate.

Two method names appear in the code below, so here is what each does in plain words before you run it. `bottom_up(base)` keeps the eight state forecasts exactly as they are and replaces the national forecast with their sum. `min_trace(base, method = ...)` adjusts all nine forecasts at once, picking the adjustments that make the reconciled forecast errors as small as possible; `"ols"` and `"mint_shrink"` are two different assumptions about those errors, and the next section derives both from scratch.

```r title="Fit once, then reconcile three ways"
fit <- trips_hts |>
  model(base = ETS(Trips)) |>
  reconcile(
    bu   = bottom_up(base),
    ols  = min_trace(base, method = "ols"),
    mint = min_trace(base, method = "mint_shrink")
  )

fit
#> # A mable: 9 x 5
#> # Key:     State [9]
#>   State                      base bu           ols          mint
#>   <chr*>                  <model> <model>      <model>      <model>
#> 1 ACT                <ETS(M,A,N)> <ETS(M,A,N)> <ETS(M,A,N)> <ETS(M,A,N)>
#> 2 New South Wales    <ETS(A,N,A)> <ETS(A,N,A)> <ETS(A,N,A)> <ETS(A,N,A)>
#> 3 Northern Territory <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)>
#> 4 Queensland         <ETS(A,N,A)> <ETS(A,N,A)> <ETS(A,N,A)> <ETS(A,N,A)>
#> 5 South Australia    <ETS(M,N,A)> <ETS(M,N,A)> <ETS(M,N,A)> <ETS(M,N,A)>
#> 6 Tasmania           <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)>
#> 7 Victoria           <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)>
#> 8 Western Australia  <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)> <ETS(M,N,M)>
#> 9 <aggregated>       <ETS(A,A,A)> <ETS(A,A,A)> <ETS(A,A,A)> <ETS(A,A,A)>
```

The result is a mable, a table of fitted models with one row per series and one column per model specification. The `base` column holds the ETS fits. The three new columns are not new fits, they are the same fits tagged with a reconciliation rule, which is why the model descriptions are identical across every column.

Those descriptions are worth a glance. `ETS(M,A,N)` for ACT means multiplicative errors, an additive trend and no seasonality. `ETS(A,A,A)` for the national total means additive everything including seasonality. Each series got the model that suited it, chosen automatically.

Now forecast all four specifications at once and lay the first quarter out side by side. `pivot_wider()` from `tidyr` turns the four model rows per state into four columns.

```r title="Compare the four methods for 2018 Q1"
library(tidyr)

fc <- fit |> forecast(h = 4)

fc |>
  as_tibble() |>
  filter(Quarter == yearquarter("2018 Q1")) |>
  mutate(State = as.character(State)) |>
  select(State, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))
#> # A tibble: 9 × 5
#>   State                base     bu    ols   mint
#>   <chr>               <dbl>  <dbl>  <dbl>  <dbl>
#> 1 ACT                  701.   701.   717.   703.
#> 2 New South Wales     8886.  8886.  8902.  8906.
#> 3 Northern Territory   263.   263.   279.   264.
#> 4 Queensland          5570.  5570.  5586.  5583.
#> 5 South Australia     1857.  1857.  1873.  1861.
#> 6 Tasmania            1120.  1120.  1136.  1125.
#> 7 Victoria            7793.  7793.  7809.  7812.
#> 8 Western Australia   2734.  2734.  2750.  2738.
#> 9 <aggregated>       29068. 28925. 29052. 28991.
```

Read down each column. The `bu` column is identical to `base` for all eight states and differs only in the last row, because bottom-up keeps the state forecasts exactly as they are and replaces the total with their sum. The `ols` and `mint` columns nudge every single number, states included, and land on a slightly different total.

That is the essential difference. Bottom-up discards one forecast and trusts eight. The `min_trace` methods keep information from all nine and spread the correction across all of them.

Do the numbers actually add up now? Let's check rather than assume.

```r title="Verify that each method is coherent"
fc |>
  as_tibble() |>
  filter(Quarter == yearquarter("2018 Q1")) |>
  summarise(
    total       = round(sum(.mean[is_aggregated(State)]), 1),
    sum_states  = round(sum(.mean[!is_aggregated(State)]), 1),
    .by = .model
  )
#> # A tibble: 4 × 3
#>   .model  total sum_states
#>   <chr>   <dbl>      <dbl>
#> 1 base   29068.     28925.
#> 2 bu     28925.     28925.
#> 3 ols    29052.     29052.
#> 4 mint   28991.     28991.
```

For each method we pick out the national forecast with `is_aggregated(State)` and the sum of the eight state forecasts with its negation, then compare. The `base` row disagrees with itself by 144. The other three rows match to the decimal.

That equality is not a coincidence and not a rounding artefact. Every reconciliation method in fable is constructed so the constraint holds exactly, for every quarter of the horizon.

[TIP]
**Always keep the unreconciled base column in your mable.** It costs nothing, since reconciliation reuses the same fitted models, and it is the only way to measure what coherence cost you in accuracy later on.

**Try it:** Coherence should hold at every horizon, not just the first. Check the last quarter.

```r title="Your turn: check coherence at the far horizon"
ex_coherent <- NULL
# ex_coherent: repeat the check above for 2018 Q4 instead of 2018 Q1
# your code here
# Expected: base is still off, the other three still match exactly
```

<details>
<summary>Click to reveal solution</summary>

```r title="Coherence at 2018 Q4 solution"
ex_coherent <- fc |>
  as_tibble() |>
  filter(Quarter == yearquarter("2018 Q4")) |>
  summarise(
    total      = round(sum(.mean[is_aggregated(State)]), 1),
    sum_states = round(sum(.mean[!is_aggregated(State)]), 1),
    .by = .model
  )

ex_coherent
#> # A tibble: 4 × 3
#>   .model  total sum_states
#>   <chr>   <dbl>      <dbl>
#> 1 base   28626.     27166.
#> 2 bu     27166.     27166.
#> 3 ols    28464.     28464.
#> 4 mint   27844.     27844.
```

**Explanation:** The base gap has grown to 1,460 while all three reconciled methods still match exactly. Note how far apart the reconciled totals are from each other though: 27,166 against 28,464. Coherence guarantees the numbers are consistent, not that different methods agree.

</details>

## What is the summing matrix, and what does reconciliation actually compute?

*If you only want to use reconciliation, the previous section is enough and you can skip to the next one. This section opens the box, because understanding the two matrices makes every method name in fable obvious instead of arbitrary.*

Every reconciliation method, without exception, is the same two steps:

1. Take the base forecasts for all series and produce an estimate of the **bottom-level** series only.
2. Sum those bottom-level estimates back up to fill in every other level.

Step 2 is mechanical and identical for every method. Step 1 is where methods differ. Let's build both steps by hand on a hierarchy small enough to print, then confirm our hand calculation matches what fable produced.

Our mini hierarchy is three states, so four series in total: one national plus ACT, the Northern Territory and Tasmania. We forecast one quarter ahead and collect the four base forecasts into a plain named vector.

```r title="Base forecasts for a three-state hierarchy"
mini <- trips |>
  filter(State %in% c("ACT", "Northern Territory", "Tasmania")) |>
  aggregate_key(State, Trips = sum(Trips))

fc_mini <- mini |> model(base = ETS(Trips)) |> forecast(h = 1)

base_mean <- fc_mini$.mean
names(base_mean) <- as.character(fc_mini$State)
yhat <- round(base_mean[c("<aggregated>", "ACT", "Northern Territory", "Tasmania")], 1)
names(yhat) <- c("Total", "ACT", "NT", "TAS")

yhat
#>  Total    ACT     NT    TAS
#> 2052.3  700.7  263.2 1120.2
```

We pulled the `.mean` column out as a bare numeric vector, labelled it with the series names, reordered it so the total comes first, and shortened the labels so the matrices below stay readable. This vector is what the maths calls $\hat{y}$, the base forecasts.

Sanity check the incoherence: 700.7 plus 263.2 plus 1120.2 is 2084.1, but the total forecast says 2052.3. Off by 31.8.

The **summing matrix**, written $S$, is the object that encodes "which series add up to which". It has one row per series in the hierarchy and one column per bottom-level series. Each row says how to build that series out of the bottom ones.

```r title="Build the summing matrix S"
S <- rbind(c(1, 1, 1), diag(3))
rownames(S) <- c("Total", "ACT", "NT", "TAS")
colnames(S) <- c("ACT", "NT", "TAS")

S
#>       ACT NT TAS
#> Total   1  1   1
#> ACT     1  0   0
#> NT      0  1   0
#> TAS     0  0   1
```

`diag(3)` makes a 3x3 identity matrix and `rbind()` stacks a row of ones on top of it. Read the result one row at a time. The `Total` row is all ones, meaning the total is one of each bottom series added together. The `ACT` row is `1 0 0`, meaning ACT is just ACT. The identity block at the bottom is always there, because every bottom series is trivially equal to itself.

So if $b$ is a vector of the three bottom-level values, then $Sb$ is the full vector of all four series. That is all $S$ does, and it never changes for a given hierarchy.

The **mapping matrix**, written $G$, does step 1: it turns the four base forecasts into three bottom-level estimates. Different choices of $G$ are different reconciliation methods. Put them together and you get the one equation that describes every method in this tutorial:

$$\tilde{y}_h = S G \hat{y}_h$$

Where:

- $\hat{y}_h$ = the base forecasts, $h$ steps ahead, one per series (our `yhat`, length 4)
- $G$ = the mapping matrix that produces bottom-level estimates (3 rows by 4 columns)
- $S$ = the summing matrix that rebuilds every level (4 rows by 3 columns)
- $\tilde{y}_h$ = the reconciled, coherent forecasts (length 4)

Because the result always comes out of $S$, it is coherent automatically. Coherence is built into the shape of the calculation, which is why it holds exactly rather than approximately.

Bottom-up is the simplest possible $G$: ignore the total, keep the three state forecasts.

```r title="Bottom-up as a mapping matrix"
G_bu <- cbind(0, diag(3))
colnames(G_bu) <- c("Total", "ACT", "NT", "TAS")
rownames(G_bu) <- c("ACT", "NT", "TAS")

G_bu
#>     Total ACT NT TAS
#> ACT     0   1  0   0
#> NT      0   0  1   0
#> TAS     0   0  0   1

bottom_bu <- G_bu %*% yhat
round(as.vector(S %*% bottom_bu), 1)
#> [1] 2084.1  700.7  263.2 1120.2
```

`cbind()` glues a column of zeros onto the left of a 3x3 identity matrix, and `%*%` is R's matrix multiplication operator (a plain `*` would multiply element by element, which is not what we want here). The first column of `G_bu` is all zeros, which is the matrix way of saying "throw the national forecast away". The identity block copies the three state forecasts through untouched. Then `S %*% bottom_bu` sums them back up.

The three state numbers came out unchanged, and the total became 2084.1, exactly their sum. Bottom-up in one line of matrix algebra.

The problem with bottom-up is that first column of zeros. The national model saw eighty quarters of a smooth, high-volume series, which is usually the easiest thing in the hierarchy to forecast well, and that column of zeros discards its forecast completely.

**Minimum trace** reconciliation, or MinT, chooses $G$ to minimise the total variance of the reconciled forecast errors. The name is literal: those variances sit on the diagonal of the error covariance matrix, and the trace of a matrix is the sum of its diagonal entries, so minimising the trace is minimising the total error variance. The solution has a closed form:

$$G = (S' W_h^{-1} S)^{-1} S' W_h^{-1}$$

Where:

- $W_h$ = the covariance matrix of the base forecast errors, $h$ steps ahead
- $S'$ = the transpose of the summing matrix
- $(\cdot)^{-1}$ = matrix inverse

Nobody knows $W_h$ exactly, so every practical method is a different guess at it, and that guess is exactly what the `method` argument of `min_trace()` selects. The simplest guess is that all errors are equally sized and uncorrelated, $W_h = kI$, where $I$ is the identity matrix and $k$ is any positive number (it cancels out of the formula). That is `method = "ols"`, and it collapses the formula to $G = (S'S)^{-1}S'$, which we can compute directly.

```r title="OLS reconciliation by hand"
G_ols <- solve(t(S) %*% S) %*% t(S)
round(G_ols, 3)
#>     Total   ACT    NT   TAS
#> ACT  0.25  0.75 -0.25 -0.25
#> NT   0.25 -0.25  0.75 -0.25
#> TAS  0.25 -0.25 -0.25  0.75

y_tilde <- S %*% (G_ols %*% yhat)
round(as.vector(y_tilde), 1)
#> [1] 2060.2  692.8  255.2 1112.2
```

`solve()` inverts a matrix and `t()` transposes one, so this is the formula copied straight across. Look at the ACT row of `G_ols`: it takes a quarter of the national forecast, three quarters of the ACT forecast, and subtracts a quarter of each other state. Every bottom estimate is a blend of all four base forecasts, with the weights falling out of the hierarchy's shape.

The reconciled numbers are 2060.2, 692.8, 255.2 and 1112.2, and the three states now add to the total: 692.8 plus 255.2 plus 1112.2 is 2060.2. Two matrices we built by hand did the entire job, and they are the same two `min_trace(base, method = "ols")` builds internally.

Do not expect these figures to match the `ols` column of the earlier eight-state table. They should not: $S$ and $G$ are built from whichever hierarchy you hand them, so a three-state hierarchy produces different weights, and therefore different adjustments, from an eight-state one.

[KEY INSIGHT]
**Every reconciliation method is the same two matrix multiplications, and only G changes.** Bottom-up, top-down, middle-out, OLS and MinT are all just different answers to one question: how should the bottom-level estimate be built from the base forecasts?

**Try it:** Build the summing matrix for a hierarchy with four bottom series instead of three.

```r title="Your turn: build S for four bottom series"
ex_S4 <- NULL
# ex_S4: build the summing matrix for a hierarchy with FOUR bottom series
# (one total row of 1s on top of a 4x4 identity matrix), then print its dimensions
# your code here
# Expected: a 5 by 4 matrix
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four-series summing matrix solution"
ex_S4 <- rbind(rep(1, 4), diag(4))

dim(ex_S4)
#> [1] 5 4

ex_S4
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    1    1    1
#> [2,]    1    0    0    0
#> [3,]    0    1    0    0
#> [4,]    0    0    1    0
#> [5,]    0    0    0    1
```

**Explanation:** Five rows because the hierarchy has five series (one total plus four bottom), four columns because four of them are at the bottom. In general $S$ is always `n` by `m`, where `n` counts every series and `m` counts the bottom ones.

</details>

## When should you use bottom-up, top-down, or middle-out?

Three older methods predate MinT and still show up constantly in forecasting teams, so it is worth knowing exactly what each one does and where it breaks.

**Bottom-up** forecasts only the bottom-level series and adds them up. It preserves every bottom-level forecast perfectly and needs no extra assumptions. Its weakness is noise: individual stores or regions are often erratic, and adding up eight noisy forecasts gives you a noisy total, even though the total itself was smooth and easy to forecast.

**Top-down** does the opposite. It forecasts only the top series, then splits that number down using historical proportions. Let's watch it on the mini hierarchy.

```r title="Top-down reconciliation on the mini hierarchy"
fc_td <- mini |>
  model(base = ETS(Trips)) |>
  reconcile(td = top_down(base, method = "forecast_proportions")) |>
  forecast(h = 1)

fc_td |>
  as_tibble() |>
  mutate(State = as.character(State)) |>
  select(State, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))
#> # A tibble: 4 × 3
#>   State               base    td
#>   <chr>              <dbl> <dbl>
#> 1 ACT                 701.  690
#> 2 Northern Territory  263.  259.
#> 3 Tasmania           1120. 1103.
#> 4 <aggregated>       2052. 2052.
```

Look at the last row: the top-down total is 2052, identical to the base total. Every state forecast moved down slightly to fit under that ceiling. `forecast_proportions` decides the split using each state's own forecast share rather than its historical average, which handles states whose share is trending.

That preserved total is top-down's defining property, and also its ceiling. If the national model was wrong, top-down cannot fix it, because it never consults the state models at all. It is guaranteed to be no better than the top forecast it starts from.

**Middle-out** picks a level in between, forecasts that, then goes bottom-up above it and top-down below it. It suits deep hierarchies where one middle level, say region, has the cleanest data. In fable it is `middle_out()`.

Here is the comparison in one place.

| Method | What it uses | What it discards | Pick it when |
|---|---|---|---|
| `bottom_up()` | Bottom-level forecasts only | Every model above the bottom | Bottom series are clean and plentiful |
| `top_down()` | Top-level forecast plus proportions | Every model below the top | Bottom series are sparse, intermittent or brand new |
| `middle_out()` | One chosen middle level | Models above and below that level | A middle level has the best data quality |
| `min_trace()` | Every forecast in the hierarchy | Nothing | Almost always, if you have residuals |

[WARNING]
**Top-down cannot improve the top-level forecast, by construction.** If your reason for reconciling is that the CEO dashboard number needs to be as accurate as possible, top-down gives you exactly the accuracy you already had, and only fixes the disagreement below it.

`min_trace()` is the modern default because it is the only one of the four that uses all the information. Its `method` argument picks the guess at $W_h$, and the choice matters less than people expect.

![Decision tree for choosing a min_trace method](screenshots/Hierarchical-Time-Series-in-R-method-choice.webp)

*Figure 3: Which min_trace method to reach for first.*

| `method` | Assumption about errors | Notes |
|---|---|---|
| `"ols"` | All equal and uncorrelated | Ignores scale, so big and small series get equal say |
| `"wls_struct"` | Variance proportional to how many series were summed | Needs no residuals at all |
| `"wls_var"` | Variance from each model's own residuals | Good default when the series differ a lot in size |
| `"mint_shrink"` | Full covariance, shrunk towards the diagonal | Usually the best when you have enough history |

**Try it:** The table above showed that top-down keeps the national number, but not whether the three adjusted state forecasts actually land on it. Check that top-down is coherent too.

```r title="Your turn: confirm top-down preserves the total"
ex_td_total <- NULL
# ex_td_total: from fc_td, keep the top_down rows only and confirm the three
# state forecasts add up to the national forecast
# your code here
# Expected: both numbers are 2052.3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top-down total preservation solution"
ex_td_total <- fc_td |>
  as_tibble() |>
  filter(.model == "td") |>
  summarise(
    total      = round(sum(.mean[is_aggregated(State)]), 1),
    sum_states = round(sum(.mean[!is_aggregated(State)]), 1)
  )

ex_td_total
#> # A tibble: 1 × 2
#>   total sum_states
#>   <dbl>      <dbl>
#> 1 2052.      2052.
```

**Explanation:** Coherent, and equal to the original base total of 2052.3. Top-down buys you consistency without touching the number at the top.

</details>

## How do you handle grouped series that don't nest?

Everything so far assumed a clean tree: each region belongs to exactly one state, each state to exactly one country. Real data often does not have that shape.

Australian tourism is also broken down by trip purpose: business, holiday, visiting friends and relatives, and other. Purpose does not sit under state, and state does not sit under purpose. They cut across each other. Every combination of state and purpose exists, so there are two different routes from the bottom cells up to the same grand total.

![A grouped structure has two routes to the same grand total](screenshots/Hierarchical-Time-Series-in-R-grouped-structure.webp)

*Figure 4: A grouped structure has two routes to the same grand total.*

A structure like this is called a **grouped time series** rather than a hierarchical one. The distinction is exactly this: a hierarchy has one unique path from bottom to top, a grouped structure has several.

In `aggregate_key()` the operator tells fable which one you mean. Nesting uses a forward slash, `State / Region`, meaning "regions live inside states". Crossing uses an asterisk, `State * Purpose`, meaning "these two attributes are independent, give me the totals for both". You can mix them, as in `(State / Region) * Purpose`.

We will use three states here so the key table prints in full. Dropping the `filter()` line scales it to all eight without any other change.

```r title="Build a crossed State by Purpose structure"
gts <- tourism |>
  as_tibble() |>
  filter(State %in% c("New South Wales", "Queensland", "Victoria")) |>
  summarise(Trips = sum(Trips), .by = c(Quarter, State, Purpose)) |>
  as_tsibble(index = Quarter, key = c(State, Purpose)) |>
  aggregate_key(State * Purpose, Trips = sum(Trips))

n_keys(gts)
#> [1] 20

gts |> as_tibble() |> distinct(State, Purpose) |> print(n = 8)
#> # A tibble: 20 × 2
#>   State           Purpose
#>   <chr*>          <chr*>
#> 1 <aggregated>    <aggregated>
#> 2 New South Wales <aggregated>
#> 3 Queensland      <aggregated>
#> 4 Victoria        <aggregated>
#> 5 <aggregated>    Business
#> 6 <aggregated>    Holiday
#> 7 <aggregated>    Other
#> 8 <aggregated>    Visiting
#> # ℹ 12 more rows
```

Twenty series, and the arithmetic explains every one. Twelve bottom cells (3 states times 4 purposes), plus 3 state totals, plus 4 purpose totals, plus 1 grand total.

The printed rows show how the marker doubles up. Row 1 has `<aggregated>` in both columns, so it is the grand total. Rows 2 to 4 are aggregated over purpose but not state, so they are state totals. Rows 5 to 8 are the reverse, purpose totals across all three states. The 12 rows hidden below are the bottom cells with a real value in both columns.

Now reconcile it. The code is identical to the hierarchical case, because fable does not care which structure you built.

```r title="Reconcile a grouped structure and check both paths"
gfc <- gts |>
  model(base = ETS(Trips)) |>
  reconcile(mint = min_trace(base, method = "mint_shrink")) |>
  forecast(h = 1)

gfc |>
  as_tibble() |>
  filter(.model == "mint") |>
  summarise(
    grand_total   = round(sum(.mean[is_aggregated(State) & is_aggregated(Purpose)]), 1),
    via_states    = round(sum(.mean[!is_aggregated(State) & is_aggregated(Purpose)]), 1),
    via_purposes  = round(sum(.mean[is_aggregated(State) & !is_aggregated(Purpose)]), 1),
    via_bottom    = round(sum(.mean[!is_aggregated(State) & !is_aggregated(Purpose)]), 1)
  )
#> # A tibble: 1 × 4
#>   grand_total via_states via_purposes via_bottom
#>         <dbl>      <dbl>        <dbl>      <dbl>
#> 1      22170.     22170.       22170.     22170.
```

Each of the four columns computes the grand total a different way: the single grand-total series, the sum of the three state totals, the sum of the four purpose totals, and the sum of the twelve bottom cells. Combining the two `is_aggregated()` tests with `&` selects exactly one band of the structure at a time.

All four routes give 22,170. In a grouped structure coherence is a stronger requirement than in a hierarchy, because every path has to land on the same answer, and MinT delivers it.

[NOTE]
**The hts package handled this with a separate gts() function; fable does not need one.** `hts` is still on CRAN but is no longer developed, and its authors point new work at fable. One `aggregate_key()` call covers nested, crossed and mixed structures alike.

**Try it:** Run the same four-way check on the unreconciled base forecasts.

```r title="Your turn: check the base forecasts across all four paths"
ex_paths <- NULL
# ex_paths: run the same four-way check on the base (unreconciled) forecasts
# your code here
# Expected: the four numbers disagree
```

<details>
<summary>Click to reveal solution</summary>

```r title="Base forecast path check solution"
ex_paths <- gfc |>
  as_tibble() |>
  filter(.model == "base") |>
  summarise(
    grand_total  = round(sum(.mean[is_aggregated(State) & is_aggregated(Purpose)]), 1),
    via_states   = round(sum(.mean[!is_aggregated(State) & is_aggregated(Purpose)]), 1),
    via_purposes = round(sum(.mean[is_aggregated(State) & !is_aggregated(Purpose)]), 1),
    via_bottom   = round(sum(.mean[!is_aggregated(State) & !is_aggregated(Purpose)]), 1)
  )

ex_paths
#> # A tibble: 1 × 4
#>   grand_total via_states via_purposes via_bottom
#>         <dbl>      <dbl>        <dbl>      <dbl>
#> 1      22285.     22249.       22097.     21852.
```

**Explanation:** Four routes, four different answers, spread across 433 thousand trips. A grouped structure gives incoherence more ways to show up, which is exactly why it needs reconciliation more than a simple hierarchy does.

</details>

## Does reconciliation actually improve accuracy?

Coherence is worth having on its own, but the interesting question is whether reconciliation also makes the forecasts more accurate. Most tutorials assert that it does and move on. Let's actually measure it.

The test is an ordinary holdout. Train on everything up to the end of 2016, forecast the four quarters of 2017, and compare against what really happened. All four methods are trained on identical data, so any difference is the reconciliation and nothing else.

```r title="Hold out 2017 and forecast it four ways"
train <- trips_hts |> filter(Quarter <= yearquarter("2016 Q4"))

fc_test <- train |>
  model(base = ETS(Trips)) |>
  reconcile(
    bu   = bottom_up(base),
    ols  = min_trace(base, method = "ols"),
    mint = min_trace(base, method = "mint_shrink")
  ) |>
  forecast(h = 4)

fc_test |> as_tibble() |> count(.model)
#> # A tibble: 4 × 2
#>   .model     n
#>   <chr>  <int>
#> 1 base      36
#> 2 bu        36
#> 3 mint      36
#> 4 ols       36
```

Nine series times four quarters gives 36 forecasts per method, which is the sanity check that nothing got dropped. Now score them. Crucially, we score each level of the hierarchy separately, because reconciliation affects the top and the bottom in opposite directions and a single blended number would hide that completely.

`accuracy()` takes the fable and the full dataset, matches forecasts to actuals by date and key, and computes error metrics. RMSE is the root mean squared error in trips; MASE compares the model against a seasonal naive benchmark, where below 1 means better than that benchmark.

```r title="Accuracy at the national level"
fc_test |>
  filter(is_aggregated(State)) |>
  accuracy(trips_hts) |>
  select(.model, RMSE, MAPE, MASE) |>
  arrange(RMSE) |>
  mutate(across(where(is.numeric), function(x) round(x, 2)))
#> # A tibble: 4 × 4
#>   .model  RMSE  MAPE  MASE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 base   1336.  4.11  1.21
#> 2 ols    1357.  4.22  1.24
#> 3 mint   1470.  4.75  1.4
#> 4 bu     1534.  5.03  1.48
```

At the top of the hierarchy the unreconciled base forecast wins. `ols` gives up 21 thousand trips of RMSE, about 1.6 percent, and bottom-up gives up 198 thousand, about 15 percent. Bottom-up doing worst here is exactly what the theory predicted: it deleted the national model, which was the best model in the set.

Now the same scoring at the state level, averaged across the eight states.

```r title="Accuracy averaged across the eight states"
fc_test |>
  filter(!is_aggregated(State)) |>
  accuracy(trips_hts) |>
  summarise(RMSE = round(mean(RMSE), 1), MASE = round(mean(MASE), 3), .by = .model) |>
  arrange(RMSE)
#> # A tibble: 4 × 3
#>   .model  RMSE  MASE
#>   <chr>  <dbl> <dbl>
#> 1 ols     227. 0.951
#> 2 mint    234. 1.01
#> 3 base    239. 1.05
#> 4 bu      239. 1.05
```

The order flips. `ols` is now best at 227, beating base at 239 by 4.7 percent, and it is the only method whose MASE drops below 1, meaning it is the only one beating a seasonal naive forecast on the states.

Look at `bu` and `base`: identical to the decimal on both metrics. That is not a bug. Bottom-up leaves every bottom-level forecast exactly as it found it, so at the bottom level it *is* the base forecast. Its only effect is on the levels above.

[KEY INSIGHT]
**Coherence is a constraint you are buying, not a free accuracy win.** On this data `ols` costs 1.6 percent at the top and pays back 4.7 percent at the bottom, and it makes every number in the set consistent. Whether that trade is good depends on which level your decisions are made at, and the only way to know is to measure it on your own data.

The general finding in the research literature is that MinT-family methods usually improve accuracy across a hierarchy taken as a whole, with the gains concentrated in the sparser lower levels. That is what we see here.

**Try it:** Put a number on what reconciliation bought at the state level.

```r title="Your turn: quantify the state-level gain"
ex_gain <- NULL
# ex_gain: from the state-level table above, compute the percentage RMSE
# improvement of ols over base
# your code here
# Expected: a bit under 5 percent
```

<details>
<summary>Click to reveal solution</summary>

```r title="State-level RMSE gain solution"
state_acc <- fc_test |>
  filter(!is_aggregated(State)) |>
  accuracy(trips_hts) |>
  summarise(RMSE = mean(RMSE), .by = .model)

ex_gain <- round((state_acc$RMSE[state_acc$.model == "base"] -
                  state_acc$RMSE[state_acc$.model == "ols"]) /
                 state_acc$RMSE[state_acc$.model == "base"] * 100, 1)

ex_gain
#> [1] 4.7
```

**Explanation:** A 4.7 percent RMSE reduction on every state, obtained without fitting a single extra model. The state forecasts improved purely because reconciliation fed information from the national series into them.

</details>

## Complete Example: an end-to-end hierarchical forecast

Let's put the whole workflow together in the order you would actually run it. Build the hierarchy, fit models, reconcile, forecast, and report the number the business asked for.

We use `min_trace(method = "ols")` because the holdout test above showed it was the best of the four on this data. On your own data, run that holdout first and let it choose for you.

```r title="Fit, reconcile and forecast in one pipeline"
final_fc <- trips_hts |>
  model(ets = ETS(Trips)) |>
  reconcile(reconciled = min_trace(ets, method = "ols")) |>
  forecast(h = 4)

final_fc |>
  filter(.model == "reconciled", is_aggregated(State)) |>
  as_tibble() |>
  transmute(Quarter, forecast = round(.mean, 1))
#> # A tibble: 4 × 2
#>   Quarter forecast
#>     <qtr>    <dbl>
#> 1 2018 Q1   29052.
#> 2 2018 Q2   27698.
#> 3 2018 Q3   27469.
#> 4 2018 Q4   28464.
```

This time we fit on the complete history including 2017, since the holdout has done its job and there is no reason to withhold real data from the final model. About 29.1 million trips in the first quarter of 2018, easing to 27.5 million in the winter quarter. Every one of these numbers is the exact sum of the eight state forecasts sitting underneath it.

A chart makes the seasonal pattern and the continuation obvious.

```r title="Plot the history and the reconciled forecast"
library(ggplot2)

history <- trips_hts |>
  filter(is_aggregated(State), Quarter >= yearquarter("2010 Q1")) |>
  as_tibble() |>
  select(Quarter, Trips)

future <- final_fc |>
  filter(.model == "reconciled", is_aggregated(State)) |>
  as_tibble() |>
  select(Quarter, Trips = .mean)

ggplot(history, aes(x = Quarter, y = Trips)) +
  geom_line(colour = "grey40") +
  geom_line(data = future, colour = "#3454d1", linewidth = 1) +
  geom_point(data = future, colour = "#3454d1", size = 2) +
  labs(title = "Australian domestic trips: history and reconciled forecast",
       x = NULL, y = "Trips (thousands)") +
  theme_minimal()
```

We split the data into a grey history layer and a blue forecast layer, then draw both on the same axes. The forecast picks up the upward trend of the last few years and repeats the yearly shape, with the Q1 peak and the Q3 trough carried forward.

The recipe is five steps, and it does not change with the size of the hierarchy:

1. Shape the data as a tsibble with an index and a key.
2. Call `aggregate_key()` to declare the structure, `/` for nesting and `*` for crossing.
3. Fit models with `model()`, keeping an unreconciled base column.
4. Add reconciliations with `reconcile()`.
5. Call `forecast()` once and get every method back together.

## Practice Exercises

### Exercise 1: Build and reconcile a region hierarchy

Tasmania has five tourism regions in the `tourism` data. Build a hierarchy of those regions with their state total on top, reconcile with `mint_shrink`, and prove that the reconciled region forecasts for 2018 Q1 add up to the Tasmania forecast while the base ones do not. Save the hierarchy to `my_hts`.

```r title="Exercise 1 starter"
my_hts <- NULL
# 1. filter tourism to State == "Tasmania", sum Trips by Quarter and Region
# 2. as_tsibble(index = Quarter, key = Region), then aggregate_key(Region, ...)
# 3. model(base = ETS(Trips)) |> reconcile(mint = min_trace(base, method = "mint_shrink"))
# 4. forecast(h = 4), then compare the aggregated row against the sum of the rest
# Hint: reuse the is_aggregated() summarise pattern from the coherence check
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tasmania region hierarchy solution"
my_hts <- tourism |>
  as_tibble() |>
  filter(State == "Tasmania") |>
  summarise(Trips = sum(Trips), .by = c(Quarter, Region)) |>
  as_tsibble(index = Quarter, key = Region) |>
  aggregate_key(Region, Trips = sum(Trips))

my_fc <- my_hts |>
  model(base = ETS(Trips)) |>
  reconcile(mint = min_trace(base, method = "mint_shrink")) |>
  forecast(h = 4)

my_fc |>
  as_tibble() |>
  filter(Quarter == yearquarter("2018 Q1")) |>
  summarise(
    total      = round(sum(.mean[is_aggregated(Region)]), 1),
    sum_parts  = round(sum(.mean[!is_aggregated(Region)]), 1),
    .by = .model
  )
#> # A tibble: 2 × 3
#>   .model total sum_parts
#>   <chr>  <dbl>     <dbl>
#> 1 base   1120.     1077.
#> 2 mint   1097.     1097.
```

**Explanation:** The base row is off by 43 thousand trips, roughly 4 percent of Tasmania's quarterly total. MinT lands between the two base numbers, which is typical: it does not simply trust the total or the parts, it weighs both.

</details>

### Exercise 2: Bake off four methods on the region hierarchy

Using `my_hts` from Exercise 1, hold out 2017, forecast it with `base`, `bottom_up`, `min_trace(ols)` and `min_trace(mint_shrink)`, and rank all four by mean RMSE across every series. Save the ranking to `my_bakeoff`.

```r title="Exercise 2 starter"
my_bakeoff <- NULL
# 1. my_train: filter my_hts to Quarter <= yearquarter("2016 Q4")
# 2. model + reconcile with all three methods, then forecast(h = 4)
# 3. accuracy(my_hts), then summarise mean RMSE by .model and arrange it
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Region hierarchy bake-off solution"
my_train <- my_hts |> filter(Quarter <= yearquarter("2016 Q4"))

my_bakeoff <- my_train |>
  model(base = ETS(Trips)) |>
  reconcile(
    bu   = bottom_up(base),
    ols  = min_trace(base, method = "ols"),
    mint = min_trace(base, method = "mint_shrink")
  ) |>
  forecast(h = 4) |>
  accuracy(my_hts) |>
  summarise(RMSE = round(mean(RMSE), 2), .by = .model) |>
  arrange(RMSE)

my_bakeoff
#> # A tibble: 4 × 2
#>   .model  RMSE
#>   <chr>  <dbl>
#> 1 ols     41.7
#> 2 base    42.4
#> 3 mint    43.4
#> 4 bu      45.1
```

**Explanation:** `ols` wins again, `mint_shrink` loses to plain base here, and bottom-up is worst. Six short, noisy series are not enough history for the shrinkage estimator to learn a reliable covariance matrix, which is exactly the situation where the simpler `ols` or `wls_struct` methods do better.

</details>

### Exercise 3: Build a grouped structure from scratch

Build a grouped `State * Purpose` structure for Tasmania and ACT only, reconcile with `min_trace(method = "wls_struct")`, and confirm that the grand-total forecast equals the sum of the bottom cells. Work out how many series the structure should contain before you run it. Save it to `my_grouped`.

```r title="Exercise 3 starter"
my_grouped <- NULL
# 1. filter tourism to Tasmania and ACT, sum Trips by Quarter, State and Purpose
# 2. as_tsibble(index = Quarter, key = c(State, Purpose))
# 3. aggregate_key(State * Purpose, Trips = sum(Trips)), then check n_keys()
# 4. model + reconcile with wls_struct, forecast(h = 1), compare grand vs bottom
# Hint: combine two is_aggregated() tests with & to select each band
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Grouped structure solution"
my_grouped <- tourism |>
  as_tibble() |>
  filter(State %in% c("Tasmania", "ACT")) |>
  summarise(Trips = sum(Trips), .by = c(Quarter, State, Purpose)) |>
  as_tsibble(index = Quarter, key = c(State, Purpose)) |>
  aggregate_key(State * Purpose, Trips = sum(Trips))

n_keys(my_grouped)
#> [1] 15

my_grouped_fc <- my_grouped |>
  model(base = ETS(Trips)) |>
  reconcile(mint = min_trace(base, method = "wls_struct")) |>
  forecast(h = 1)

my_grouped_fc |>
  as_tibble() |>
  filter(.model == "mint") |>
  summarise(
    grand  = round(sum(.mean[is_aggregated(State) & is_aggregated(Purpose)]), 1),
    bottom = round(sum(.mean[!is_aggregated(State) & !is_aggregated(Purpose)]), 1)
  )
#> # A tibble: 1 × 2
#>   grand bottom
#>   <dbl>  <dbl>
#> 1 1773.  1773.
```

**Explanation:** Fifteen series: 8 bottom cells (2 states times 4 purposes), 2 state totals, 4 purpose totals and 1 grand total. `wls_struct` is the right pick here because it derives its weights from the structure alone and never touches the residuals, so it works even when some of these small series fit badly.

</details>

## Frequently Asked Questions

### Do I still need the hts package?

No. `hts` was the original R package for this and it still works, but it is in maintenance mode and its own authors point new work at fable. `hts` wanted your data as a wide matrix with encoded column names, which is awkward to build and easy to get wrong. `aggregate_key()` reads the structure off your existing long-format columns instead.

### Which min_trace method should I use by default?

Start with `"mint_shrink"` if you have a reasonable amount of history, since it uses the most information. Use `"wls_struct"` when series are short, sparse or fit badly, because it needs no residuals at all. Then run the holdout bake-off from the accuracy section and let the data decide. Exercise 2 above is a real case where `"ols"` beat `"mint_shrink"`.

### Can I use ARIMA, or mix different models across the hierarchy?

Yes to both. `reconcile()` operates on whatever is in the mable, so `model(m = ARIMA(Trips))` works identically. You can also fit several model types at once, as in `model(ets = ETS(Trips), arima = ARIMA(Trips))`, and reconcile each of them separately. Different series can end up with genuinely different fitted models, which is the normal case.

### Why did reconciliation make my top-level forecast worse?

Because reconciliation optimises the whole hierarchy, not any single level. If your top series was already the easiest to forecast, spreading information from noisier lower series into it can cost a little accuracy there while gaining more further down. We measured exactly that above. If the top-level number is all that matters to you, forecast it directly and use top-down to fill in below it.

### Does reconciliation work on prediction intervals too?

Yes. `forecast()` returns a distribution in the `Trips` column, not just a point forecast, and fable reconciles the whole distribution rather than only the mean. Call `hilo()` on the fable to see the reconciled intervals, and note that reconciled intervals are usually narrower than base intervals at the aggregate levels.

### Can reconciliation produce a negative forecast?

Yes, and it is worth checking for. Reconciliation adds and subtracts amounts across series, so a bottom-level series already sitting close to zero, an intermittent product or a tiny region, can be pushed below zero by the adjustment. Nothing in the arithmetic prevents it, because the only thing being enforced is that the numbers add up. Inspect the bottom level of your reconciled forecast for negatives, and if they appear, forecast a transformed series where negatives cannot occur rather than clipping them at zero, since clipping breaks the coherence you just paid for.

### What if my hierarchy has thousands of bottom series?

The MinT formula inverts matrices whose size grows with the number of series, so very large hierarchies get slow and memory-hungry. `"wls_struct"` and `"wls_var"` use diagonal weight matrices and scale far better than `"mint_shrink"`. Beyond that, common practice is to reconcile within sub-hierarchies, for example one region at a time, rather than solving the whole structure at once.

## Summary

The workflow, in the order you run it:

| Step | Function | What it does |
|---|---|---|
| 1 | `as_tsibble()` | Declare the time index and the series key |
| 2 | `aggregate_key()` | Add every implied total, `/` nests and `*` crosses |
| 3 | `model()` | Fit one model per series, keep a `base` column |
| 4 | `reconcile()` | Attach one or more reconciliation methods |
| 5 | `forecast()` | Produce coherent forecasts for every method at once |

The ideas worth carrying away:

- **Coherence is not optional in a business setting.** Independent forecasts disagreed by 5 percent a year out on this data, and nothing in R warned us.
- **Reconciliation never refits anything.** It is a linear adjustment of forecasts you already had, so trying four methods costs almost nothing.
- **Every method is $\tilde{y} = SG\hat{y}$.** Only $G$ changes; $S$ is fixed by the hierarchy.
- **Bottom-up throws away the top model, top-down throws away the bottom ones.** MinT uses everything, which is why it is the default worth reaching for.
- **Grouped is not hierarchical.** When attributes cross rather than nest, use `*` and check that every aggregation path agrees.
- **Measure the trade by level.** Reconciliation typically costs a little at the top and pays more at the bottom, and only your own holdout can tell you the balance.

## References

1. Hyndman, R.J. and Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 11.1: Hierarchical and grouped time series. [Link](https://otexts.com/fpp3/hts.html)
2. Hyndman, R.J. and Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 11.3: Forecast reconciliation. [Link](https://otexts.com/fpp3/reconciliation.html)
3. fabletools reference - `reconcile()`: forecast reconciliation. [Link](https://fabletools.tidyverts.org/reference/reconcile.html)
4. fabletools reference - `min_trace()`: minimum trace forecast reconciliation. [Link](https://fabletools.tidyverts.org/reference/min_trace.html)
5. fabletools reference - `aggregate_key()`: aggregate a dataset over the key variables. [Link](https://fabletools.tidyverts.org/reference/aggregate_key.html)
6. Wickramasuriya, S.L., Athanasopoulos, G. and Hyndman, R.J. - Optimal forecast reconciliation for hierarchical and grouped time series through trace minimization. *Journal of the American Statistical Association* 114(526), 804-819 (2019). [Link](https://robjhyndman.com/publications/mint/)
7. Athanasopoulos, G., Hyndman, R.J., Kourentzes, N. and Panagiotelis, A. - Forecast reconciliation: a review. *International Journal of Forecasting* 40(2), 430-456 (2024). [Link](https://robjhyndman.com/publications/frreview.html)
8. Hyndman, R.J. et al. - `hts`: Hierarchical and grouped time series. CRAN package page. [Link](https://cran.r-project.org/package=hts)

## Continue Learning

- [fable in R: Tidy Time Series Forecasting with tsibble](fable-in-R.html) - the tsibble and fable foundations this tutorial builds on, including how `model()`, mables and fables fit together.
- [Forecast Accuracy in R: MAE, RMSE, MAPE, and MASE](Forecast-Accuracy-in-R.html) - what the RMSE and MASE numbers in the bake-off actually measure, and which one to trust when they disagree.
- [Combining Forecasts in R: Ensemble Averaging](Combining-Forecasts-in-R.html) - the other way to get more out of models you already fitted, by averaging across models instead of across levels.
