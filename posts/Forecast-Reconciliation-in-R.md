---
title: "Forecast Reconciliation in R: Bottom-Up to Middle-Out"
slug: "Forecast-Reconciliation-in-R"
description: "Learn forecast reconciliation in R with fable. Compare bottom-up, top-down and middle-out, work the proportions by hand, and see which method wins."
keywords: "forecast reconciliation in R, bottom-up forecasting, top-down forecasting, middle-out forecasting, single level approaches, fable reconcile, coherent forecasts, hierarchical forecasting in R, top_down proportions, bottom_up in R"
auto_link_terms: "bottom_up()|top_down()|middle_out()|single level approaches|bottom-up reconciliation|top-down reconciliation|middle-out reconciliation|forecast proportions|average historical proportions|proportions of historical averages|disaggregation proportions|splitting a total forecast"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "TS2-12.2"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Forecast Reconciliation"
sidebar_order: "34"
difficulty: "Advanced"
---

<p class="lead">Forecast reconciliation is the step that makes a set of forecasts add up. The oldest family of methods, bottom-up, top-down and middle-out, all do it the same way: pick one level of the hierarchy, trust it completely, and rebuild every other level from it. This tutorial shows exactly what each one computes, verifies the arithmetic by hand, and measures which one actually forecasts better.</p>

## Why does one hierarchy give you three different totals?

A forecasting model does not know that Tasmania and Western Australia are supposed to add up to a national total. It just sees numbers. Fit one model per series and you get one answer for the total, a different answer from summing the states, and a third from summing the regions. Let's build that hierarchy and watch the three answers disagree.

The `tourism` dataset ships inside the `tsibble` package. It records quarterly overnight trips in Australia from 1998 to 2017, broken down by region, state and trip purpose. We will keep two states, Tasmania and Western Australia, because they have five regions each. That gives a small hierarchy we can print in full and check by hand.

```r title="Build a three-level tourism hierarchy"
library(tsibble)
library(fable)
library(dplyr)
library(tidyr)

options(pillar.sigfig = 5)

trips <- tourism |>
  filter(State %in% c("Tasmania", "Western Australia")) |>
  as_tibble() |>
  summarise(Trips = sum(Trips), .by = c(Quarter, State, Region)) |>
  as_tsibble(index = Quarter, key = c(State, Region))

hier <- trips |> aggregate_key(State / Region, Trips = sum(Trips))
hier
#> # A tsibble: 1,040 x 4 [1Q]
#> # Key:       State, Region [13]
#>    Quarter State        Region        Trips
#>      <qtr> <chr*>       <chr*>        <dbl>
#>  1 1998 Q1 <aggregated> <aggregated> 2622.7
#>  2 1998 Q2 <aggregated> <aggregated> 2269.6
#>  3 1998 Q3 <aggregated> <aggregated> 1990.2
#>  4 1998 Q4 <aggregated> <aggregated> 2520.3
#>  5 1999 Q1 <aggregated> <aggregated> 2761.1
#>  6 1999 Q2 <aggregated> <aggregated> 2457.8
#>  7 1999 Q3 <aggregated> <aggregated> 2155.6
#>  8 1999 Q4 <aggregated> <aggregated> 2110.7
#>  9 2000 Q1 <aggregated> <aggregated> 2424.7
#> 10 2000 Q2 <aggregated> <aggregated> 2317.4
#> # ℹ 1,030 more rows
```

Three things happened in that block. First, `summarise()` added up the four trip purposes inside each region and quarter, because purpose is a breakdown we do not want here. Second, `as_tsibble()` declared the time column (`index = Quarter`) and the columns that identify a series (`key = c(State, Region)`). Third, and this is the important one, `aggregate_key(State / Region, ...)` read the slash as "Region nests inside State" and physically added every implied total as extra rows.

The `<aggregated>` label marks those added rows. A row with `<aggregated>` in both columns is the grand total across both states. `options(pillar.sigfig = 5)` just asks tibbles to print five significant digits instead of the default three, so we can read the decimals that the rest of this tutorial depends on.

Let's see exactly which series now exist.

```r title="List every series in the hierarchy"
hier |>
  as_tibble() |>
  distinct(State, Region) |>
  mutate(State = as.character(State), Region = as.character(Region)) |>
  print(n = 13)
#> # A tibble: 13 × 2
#>    State             Region                         
#>    <chr>             <chr>                          
#>  1 <aggregated>      <aggregated>                   
#>  2 Tasmania          <aggregated>                   
#>  3 Western Australia <aggregated>                   
#>  4 Tasmania          East Coast                     
#>  5 Tasmania          Hobart and the South           
#>  6 Tasmania          Launceston, Tamar and the North
#>  7 Tasmania          North West                     
#>  8 Tasmania          Wilderness West                
#>  9 Western Australia Australia's Coral Coast        
#> 10 Western Australia Australia's Golden Outback     
#> 11 Western Australia Australia's North West         
#> 12 Western Australia Australia's South West         
#> 13 Western Australia Experience Perth               
```

Thirteen series in three tiers: one grand total, two states, ten regions. We started with ten. The other three were created by `aggregate_key()`.

That is the structure. Now we fit a model to every one of those thirteen series independently and forecast one quarter ahead. `ETS()` fits an exponential smoothing model, and `model()` applies it to each series separately. Nothing in this step knows the hierarchy exists.

```r title="Fit one model per series and forecast"
label <- function(state, region) {
  ifelse(region != "<aggregated>", region,
         ifelse(state != "<aggregated>", state, "TOTAL"))
}

fit <- hier |> model(base = ETS(Trips))

base_mean <- fit |>
  forecast(h = 1) |>
  as_tibble() |>
  mutate(State = as.character(State),
         Region = as.character(Region),
         Series = label(State, Region)) |>
  select(State, Region, Series, base = .mean)

base_mean |>
  select(Series, base) |>
  mutate(base = round(base, 1)) |>
  print(n = 13)
#> # A tibble: 13 × 2
#>    Series                            base
#>    <chr>                            <dbl>
#>  1 East Coast                       153.6
#>  2 Hobart and the South             439.3
#>  3 Launceston, Tamar and the North  241.2
#>  4 North West                       183  
#>  5 Wilderness West                   59.7
#>  6 Tasmania                        1120.2
#>  7 Australia's Coral Coast          247.5
#>  8 Australia's Golden Outback       255  
#>  9 Australia's North West           248.8
#> 10 Australia's South West           903.9
#> 11 Experience Perth                1084.4
#> 12 Western Australia               2734.5
#> 13 TOTAL                           3942.6
```

The `label()` helper collapses the two key columns into one readable name so the tables in this tutorial stay narrow: a region keeps its own name, a state row shows the state, and the grand total shows `TOTAL`. The `.mean` column that `forecast()` produces is the point forecast, which is the single number you would put in a plan. These are called **base forecasts**: the raw, unreconciled output of thirteen independent models.

Now the punchline. Ask this hierarchy for next quarter's total three different ways.

```r title="Compare the three answers for the total"
three <- c(
  top_model  = sum(base_mean$base[base_mean$State == "<aggregated>"]),
  state_sum  = sum(base_mean$base[base_mean$State != "<aggregated>" &
                                  base_mean$Region == "<aggregated>"]),
  region_sum = sum(base_mean$base[base_mean$Region != "<aggregated>"])
)

top_fc <- three[["top_model"]]
round(three, 1)
#>  top_model  state_sum region_sum 
#>     3942.6     3854.6     3816.3 
```

Each element picks a different set of rows and adds them up. `top_model` is the single forecast from the model fitted to the grand-total series. `state_sum` adds the two state forecasts. `region_sum` adds the ten region forecasts. We also stash the top-level number in `top_fc`, because every top-down calculation later in this tutorial starts from it.

Three answers to one question: 3942.6, 3854.6 and 3816.3. The spread is about 126 thousand trips, roughly 3 percent. Nothing in R warned us. Every model was fitted correctly; they simply were never told they had to agree.

Forecasts that do add up correctly are called **coherent**. Turning an incoherent set into a coherent one is **reconciliation**. The question this tutorial answers is which of the three numbers above you should build the coherent set around.

![Each single-level method keeps one level and rebuilds the rest](screenshots/Forecast-Reconciliation-in-R-which-level.webp)

*Figure 1: Each single-level method keeps one level and rebuilds the rest.*

[KEY INSIGHT]
**Bottom-up, top-down and middle-out are the same move applied at three different heights.** Each one nominates a single level of the hierarchy, keeps that level's forecasts exactly as they came out of the model, and regenerates every other level from them. That is why they are known collectively as single level approaches.

**Try it:** The disagreement is not only between the top and the bottom. Tasmania has its own model, and its five regions have theirs. Check whether Tasmania's own forecast matches the sum of its five regions.

```r title="Your turn: measure Tasmania's internal gap"
ex_tas_gap <- NULL
# ex_tas_gap: filter base_mean to State == "Tasmania", then compute
#   state_model = the base forecast on the row where Region is "<aggregated>"
#   region_sum  = the sum of the base forecasts on the other five rows
#   gap         = state_model - region_sum
# Expected: state_model 1120.2, region_sum 1076.8, gap 43.4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tasmania internal gap solution"
ex_tas_gap <- base_mean |>
  filter(State == "Tasmania") |>
  summarise(state_model = sum(base[Region == "<aggregated>"]),
            region_sum  = sum(base[Region != "<aggregated>"])) |>
  mutate(gap = state_model - region_sum) |>
  mutate(across(everything(), function(x) round(x, 1)))

ex_tas_gap
#> # A tibble: 1 × 3
#>   state_model region_sum   gap
#>         <dbl>      <dbl> <dbl>
#> 1      1120.2     1076.8  43.4
```

**Explanation:** Tasmania's own model says 1120.2 and its regions say 1076.8, a gap of 43.4. Incoherence happens at every internal node, not just at the top, so a fix has to work on the whole tree at once.

</details>

## How does bottom-up reconciliation work?

Bottom-up is the method you would invent yourself in about ten seconds. Trust the smallest series, the ones closest to the actual thing being counted, and add them up. No proportions, no matrices, no assumptions.

Let's do it manually first, so there is no mystery about what the function does. We take the ten region forecasts, add them within each state, and then add the two state numbers.

```r title="Bottom-up by hand"
bu_hand <- base_mean |>
  filter(Region != "<aggregated>") |>
  summarise(bu_state = sum(base), .by = State) |>
  mutate(bu_state = round(bu_state, 1))

bu_hand
#> # A tibble: 2 × 2
#>   State             bu_state
#>   <chr>                <dbl>
#> 1 Tasmania            1076.8
#> 2 Western Australia   2739.5

sum(bu_hand$bu_state)
#> [1] 3816.3
```

The `filter()` keeps only rows whose `Region` is a real region, dropping the three aggregate rows. `summarise(.by = State)` then adds the five region forecasts inside each state. Tasmania comes to 1076.8 and Western Australia to 2739.5, and those two add to 3816.3.

Notice what we never used: the model fitted to Tasmania, the model fitted to Western Australia, and the model fitted to the grand total. Three of our thirteen models contributed nothing. Bottom-up throws them away.

Now the same thing with fable. The `reconcile()` step sits between `model()` and `forecast()` and attaches a reconciliation method to the existing models.

```r title="Bottom-up with the bottom_up() function"
fc_bu <- fit |>
  reconcile(bu = bottom_up(base)) |>
  forecast(h = 1)

bu_tab <- fc_bu |>
  as_tibble() |>
  mutate(State = as.character(State),
         Region = as.character(Region),
         Series = label(State, Region)) |>
  select(Series, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))

bu_tab |> print(n = 13)
#> # A tibble: 13 × 3
#>    Series                            base     bu
#>    <chr>                            <dbl>  <dbl>
#>  1 East Coast                       153.6  153.6
#>  2 Hobart and the South             439.3  439.3
#>  3 Launceston, Tamar and the North  241.2  241.2
#>  4 North West                       183    183  
#>  5 Wilderness West                   59.7   59.7
#>  6 Tasmania                        1120.2 1076.8
#>  7 Australia's Coral Coast          247.5  247.5
#>  8 Australia's Golden Outback       255    255  
#>  9 Australia's North West           248.8  248.8
#> 10 Australia's South West           903.9  903.9
#> 11 Experience Perth                1084.4 1084.4
#> 12 Western Australia               2734.5 2739.5
#> 13 TOTAL                           3942.6 3816.3
```

`reconcile(bu = bottom_up(base))` says "take the column of models called `base` and add a second column called `bu` that reconciles them bottom-up". `forecast()` then produces both sets at once, which `pivot_wider()` turns into side-by-side columns.

Read the two columns against each other. Rows 1 to 5 and 7 to 11 are the regions, and they are identical in both columns. Rows 6, 12 and 13 are the aggregates, and they moved: Tasmania from 1120.2 to 1076.8, Western Australia from 2734.5 to 2739.5, the total from 3942.6 to 3816.3. Those are exactly the numbers we computed by hand.

Also note that the two adjustments went in opposite directions. Tasmania's own model was optimistic relative to its regions, Western Australia's was pessimistic. Bottom-up applies the same rule in both cases: replace the aggregate forecast with the sum of the series below it, whichever direction that moves the number.

[TIP]
**Bottom-up is the only reconciliation method that needs nothing but the bottom-level forecasts.** No residual history, no covariance estimate, no proportions. That makes it the safe fallback when you have just added a new product or region with no track record, and it is why it is still running in production forecasting systems decades after better methods appeared.

The cost is noise. Small series are erratic, and adding ten erratic forecasts gives you an erratic total, even when the total itself was smooth and easy to model. We will measure that cost against a real holdout later in this tutorial.

**Try it:** The table above suggests bottom-up left every region untouched. Prove it, rather than eyeballing it, by finding the largest absolute change across all ten region rows.

```r title="Your turn: confirm the regions were untouched"
ex_bu_regions <- NULL
# ex_bu_regions: from bu_tab, drop the three aggregate rows
#   ("TOTAL", "Tasmania", "Western Australia"), then compute the
#   largest value of abs(bu - base)
# Expected: a single column named biggest_change holding 0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Region preservation solution"
ex_bu_regions <- bu_tab |>
  filter(!Series %in% c("TOTAL", "Tasmania", "Western Australia")) |>
  summarise(biggest_change = max(abs(bu - base)))

ex_bu_regions
#> # A tibble: 1 × 1
#>   biggest_change
#>            <dbl>
#> 1              0
```

**Explanation:** Zero, not "nearly zero". Bottom-up copies the bottom level across verbatim, so any accuracy you gained by modelling regions carefully survives reconciliation completely intact.

</details>

## How does top-down split a total into its parts?

Top-down is the mirror image. Trust the total, then break it into pieces. The only question is what share each bottom series should get.

Those shares are called **disaggregation proportions**, written $p_1, p_2, \dots, p_m$ for the $m$ bottom-level series. They have to sum to 1, otherwise the pieces would not add back up to the whole. Given the top-level forecast $\hat{y}_h$, every bottom series gets

$$\tilde{y}_{j,h} = p_j \, \hat{y}_h$$

Where:

- $\tilde{y}_{j,h}$ = the reconciled forecast for bottom series $j$, $h$ steps ahead
- $\hat{y}_h$ = the base forecast for the grand total, $h$ steps ahead
- $p_j$ = the share of the total that series $j$ gets, with $\sum_j p_j = 1$

![Top-down splits one number down the hierarchy using proportions](screenshots/Forecast-Reconciliation-in-R-top-down-split.webp)

*Figure 2: Top-down splits one number down the hierarchy using proportions.*

So where do the $p_j$ come from? The two classical answers both look at history, and they differ in a way that sounds like hair-splitting but is not.

**Average of historical proportions.** For each quarter, work out what share this region took of that quarter's total, then average those shares across all quarters.

$$p_j = \frac{1}{T}\sum_{t=1}^{T}\frac{y_{j,t}}{y_t}$$

**Proportions of historical averages.** Average the region across all quarters, average the total across all quarters, then divide one by the other.

$$p_j = \frac{\sum_{t=1}^{T} y_{j,t} / T}{\sum_{t=1}^{T} y_t / T}$$

Where, in both formulas:

- $y_{j,t}$ = the observed value of bottom series $j$ in period $t$
- $y_t$ = the observed grand total in period $t$
- $T$ = the number of historical periods

The difference is the order of the division and the averaging. The first treats every quarter as one equal vote regardless of how big that quarter was. The second lets big quarters count for more, because it averages the raw values first. Let's compute both.

```r title="Compute both historical proportions by hand"
totals <- trips |>
  as_tibble() |>
  summarise(y_total = sum(Trips), .by = Quarter)

shares <- trips |>
  as_tibble() |>
  left_join(totals, by = "Quarter") |>
  mutate(share = Trips / y_total)

p_ap <- shares |> summarise(p_ap = mean(share), .by = Region)

p_pa <- shares |>
  summarise(mean_region = mean(Trips), .by = Region) |>
  transmute(Region, p_pa = mean_region / mean(totals$y_total))

p_both <- p_ap |> left_join(p_pa, by = "Region")

p_both |>
  mutate(across(where(is.numeric), function(x) round(x, 4))) |>
  print(n = 10)
#> # A tibble: 10 × 3
#>    Region                            p_ap   p_pa
#>    <chr>                            <dbl>  <dbl>
#>  1 East Coast                      0.0327 0.0332
#>  2 Hobart and the South            0.1081 0.108 
#>  3 Launceston, Tamar and the North 0.0674 0.067 
#>  4 North West                      0.0438 0.044 
#>  5 Wilderness West                 0.0158 0.0159
#>  6 Australia's Coral Coast         0.0754 0.0751
#>  7 Australia's Golden Outback      0.0745 0.0744
#>  8 Australia's North West          0.0644 0.0647
#>  9 Australia's South West          0.205  0.2071
#> 10 Experience Perth                0.3129 0.3107
```

Follow the two paths. `totals` is the observed grand total in each of the 80 quarters. `shares` attaches that total to every region row and divides, giving each region's share in each quarter. Then `p_ap` averages those 80 shares per region, which is the first formula. `p_pa` instead averages each region's raw trips and divides by the average total, which is the second formula.

Experience Perth takes about 31 percent of the two-state total either way. The two columns are close but not equal, and we will quantify that gap in a moment.

Now let's confirm that the package is doing exactly this arithmetic. We run `top_down()` twice, once per method, and compare against our hand-computed numbers multiplied by the top-level forecast.

```r title="Check the hand proportions against top_down()"
fc_td2 <- fit |>
  reconcile(td_ap = top_down(base, method = "average_proportions"),
            td_pa = top_down(base, method = "proportion_averages")) |>
  forecast(h = 1)

td_fable <- fc_td2 |>
  as_tibble() |>
  mutate(Region = as.character(Region)) |>
  filter(Region != "<aggregated>") |>
  select(Region, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean)

td_check <- p_both |>
  transmute(Region,
            hand_ap = p_ap * top_fc,
            hand_pa = p_pa * top_fc) |>
  left_join(td_fable, by = "Region")

td_check |>
  summarise(max_gap_ap = max(abs(hand_ap - td_ap)),
            max_gap_pa = max(abs(hand_pa - td_pa)))
#> # A tibble: 1 × 2
#>   max_gap_ap max_gap_pa
#>        <dbl>      <dbl>
#> 1          0          0
```

We multiplied each hand-computed proportion by `top_fc`, the 3942.6 grand-total forecast, then joined fable's own output alongside and took the largest absolute difference. Both gaps are exactly zero across all ten regions.

That is worth pausing on. The formulas above are not an approximation of what `top_down()` does; they are what it does. Here are the numbers themselves.

```r title="Both top-down variants, hand versus package"
td_check |>
  transmute(Region,
            hand_ap = round(hand_ap, 2),
            td_ap   = round(td_ap, 2),
            hand_pa = round(hand_pa, 2),
            td_pa   = round(td_pa, 2)) |>
  print(n = 10)
#> # A tibble: 10 × 5
#>    Region                          hand_ap   td_ap hand_pa   td_pa
#>    <chr>                             <dbl>   <dbl>   <dbl>   <dbl>
#>  1 East Coast                       128.79  128.79  130.85  130.85
#>  2 Hobart and the South             426.26  426.26  425.98  425.98
#>  3 Launceston, Tamar and the North  265.7   265.7   263.96  263.96
#>  4 North West                       172.55  172.55  173.54  173.54
#>  5 Wilderness West                   62.45   62.45   62.53   62.53
#>  6 Australia's Coral Coast          297.35  297.35  296.09  296.09
#>  7 Australia's Golden Outback       293.63  293.63  293.17  293.17
#>  8 Australia's North West           253.95  253.95  255.09  255.09
#>  9 Australia's South West           808.34  808.34  816.5   816.5 
#> 10 Experience Perth                1233.6  1233.6  1224.9  1224.9 
```

Column by column, hand and package agree to the last displayed digit. Now compare East Coast against its own base forecast of 153.6: top-down puts it at about 129 instead. East Coast's own fitted model contributed nothing to that figure. It came entirely from the grand total multiplied by a historical share.

[WARNING]
**Top-down cannot improve the top-level forecast, by construction.** It starts from the grand-total forecast and only divides it up, so the total it produces is bit-for-bit the total you already had. If the reason you are reconciling is that the board-level number needs to be as accurate as possible, top-down delivers exactly the accuracy you started with and fixes only the disagreement underneath it.

**Try it:** A set of disaggregation proportions is only valid if it accounts for the entire total. Check that both of our hand-computed proportion vectors sum to 1.

```r title="Your turn: check the proportions sum to one"
ex_p_sum <- NULL
# ex_p_sum: build a named vector holding sum(p_both$p_ap) and sum(p_both$p_pa)
# Expected: both entries equal 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Proportion sum solution"
ex_p_sum <- c(sum_p_ap = sum(p_both$p_ap), sum_p_pa = sum(p_both$p_pa))

ex_p_sum
#> sum_p_ap sum_p_pa 
#>        1        1 
```

**Explanation:** Both sum to exactly 1, which is what makes the split coherent. Every trip in the forecast total is assigned to exactly one region, none created and none lost.

</details>

## Which top-down proportions should you use?

We now have two ways to compute $p_j$ and a third still to meet. Start by asking how much the first two actually differ, because if the answer is "barely", the choice does not deserve much of your attention.

```r title="How far apart are the two historical variants"
ex_p_shift <- p_both |>
  mutate(shift = round((p_pa - p_ap) * 100, 3)) |>
  arrange(desc(abs(shift))) |>
  select(Region, shift) |>
  head(3)

ex_p_shift
#> # A tibble: 3 × 2
#>   Region                  shift
#>   <chr>                   <dbl>
#> 1 Experience Perth       -0.221
#> 2 Australia's South West  0.207
#> 3 East Coast              0.052
```

We converted each proportion to a percentage, took the difference between the two methods, and sorted by the largest absolute move. The biggest disagreement anywhere in the hierarchy is 0.22 percentage points, on Experience Perth. On a total of 3942.6 that is about 9 thousand trips out of nearly 4 million.

So the choice between the two historical variants is close to a coin flip in practice. Both share a much more serious weakness: the proportions are frozen. They are computed once from the whole history and then applied to every future horizon. A region whose share has been climbing steadily for twenty years gets its twenty-year average share, not the share it is heading towards.

That is the problem the third method solves. **Forecast proportions** compute the shares from the base forecasts themselves rather than from history, level by level. For a bottom series $j$ in a hierarchy with $K$ levels:

$$p_j = \prod_{\ell=0}^{K-1} \frac{\hat{y}_{j,h}^{(\ell)}}{\hat{S}_{j,h}^{(\ell+1)}}$$

Where:

- $\hat{y}_{j,h}^{(\ell)}$ = the base forecast of the node that sits $\ell$ levels above series $j$
- $\hat{S}_{j,h}^{(\ell+1)}$ = the sum of the base forecasts of all the children of the node $\ell + 1$ levels above $j$
- $K$ = the number of levels in the hierarchy

That product notation hides a very simple recipe, so let's just perform it. Our hierarchy has two levels below the top. Step one: split the grand total between the two states in proportion to their own base forecasts. Step two: split each state's resulting number among its five regions in proportion to their base forecasts.

```r title="Work forecast proportions by hand"
state_base <- base_mean |>
  filter(State != "<aggregated>", Region == "<aggregated>")

state_total <- sum(state_base$base)

fp_hand <- base_mean |>
  filter(Region != "<aggregated>") |>
  mutate(region_share = base / sum(base), .by = State) |>
  left_join(transmute(state_base, State, state_share = base / state_total),
            by = "State") |>
  transmute(Series,
            state_share  = round(state_share, 4),
            region_share = round(region_share, 4),
            fp = round(top_fc * state_share * region_share, 2))

fp_hand |> print(n = 10)
#> # A tibble: 10 × 4
#>    Series                          state_share region_share      fp
#>    <chr>                                 <dbl>        <dbl>   <dbl>
#>  1 East Coast                           0.2906       0.1426  163.38
#>  2 Hobart and the South                 0.2906       0.4079  467.34
#>  3 Launceston, Tamar and the North      0.2906       0.224   256.64
#>  4 North West                           0.2906       0.17    194.77
#>  5 Wilderness West                      0.2906       0.0555   63.59
#>  6 Australia's Coral Coast              0.7094       0.0904  252.84
#>  7 Australia's Golden Outback           0.7094       0.0931  260.39
#>  8 Australia's North West               0.7094       0.0908  253.96
#>  9 Australia's South West               0.7094       0.3299  922.69
#> 10 Experience Perth                     0.7094       0.3958 1107   
```

Read the two share columns. `state_share` is each state's base forecast divided by the sum of the two state base forecasts, so Tasmania gets 0.2906 and Western Australia 0.7094. `region_share` is each region's base forecast divided by the sum of the five regions in its own state, which is what `.by = State` inside `mutate()` arranges. Multiplying the grand total by both shares walks the number down two levels.

Every base forecast in the hierarchy influenced the answer. That is the crucial difference from the historical variants, which only ever looked at the top model and at raw history. Let's put all three variants next to each other.

```r title="Three top-down variants side by side"
fc_td3 <- fit |>
  reconcile(td_ap = top_down(base, method = "average_proportions"),
            td_pa = top_down(base, method = "proportion_averages"),
            td_fp = top_down(base, method = "forecast_proportions")) |>
  forecast(h = 1)

td3 <- fc_td3 |>
  as_tibble() |>
  mutate(State = as.character(State),
         Region = as.character(Region),
         Series = label(State, Region)) |>
  select(Series, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))

td3 |> print(n = 13)
#> # A tibble: 13 × 5
#>    Series                            base  td_ap  td_pa  td_fp
#>    <chr>                            <dbl>  <dbl>  <dbl>  <dbl>
#>  1 East Coast                       153.6  128.8  130.8  163.4
#>  2 Hobart and the South             439.3  426.3  426    467.4
#>  3 Launceston, Tamar and the North  241.2  265.7  264    256.7
#>  4 North West                       183    172.6  173.5  194.7
#>  5 Wilderness West                   59.7   62.5   62.5   63.5
#>  6 Tasmania                        1120.2 1055.8 1056.9 1145.7
#>  7 Australia's Coral Coast          247.5  297.3  296.1  252.7
#>  8 Australia's Golden Outback       255    293.6  293.2  260.3
#>  9 Australia's North West           248.8  254    255.1  254  
#> 10 Australia's South West           903.9  808.3  816.5  922.8
#> 11 Experience Perth                1084.4 1233.6 1224.9 1107.1
#> 12 Western Australia               2734.5 2886.8 2885.7 2796.8
#> 13 TOTAL                           3942.6 3942.6 3942.6 3942.6
```

Row 13 is the fixed point of the whole family: all three variants reproduce 3942.6, the base total, unchanged. Rows 1 to 12 tell the interesting story. The `td_ap` and `td_pa` columns track each other closely, as we already measured. The `td_fp` column sits somewhere else entirely, and consistently closer to `base`, because it was built from those base forecasts.

Look at Experience Perth in row 11. Its own model said 1084.4. The historical variants pushed it up past 1224, because Perth has historically taken a bigger share than its current forecast implies. Forecast proportions landed at 1107.1, much nearer its own model. That is the trend-tracking behaviour the historical variants cannot produce.

[NOTE]
**forecast_proportions is the default, and it should usually stay that way.** It is the only top-down variant that adapts as the shape of the hierarchy shifts. Reach for the historical variants only when the bottom series are too sparse or too noisy for their own forecasts to be worth using as shares, which is exactly the situation that makes people choose top-down in the first place.

One more property of the whole top-down family is worth knowing, and it is easy to miss because everything above looks so reasonable. A forecast is **unbiased** when its errors average out to zero over many forecasts: it comes out too high about as often, and by about as much, as it comes out too low. Even when every base forecast is unbiased in that sense, top-down reconciled forecasts are **not** guaranteed to be. Splitting a total by fixed shares introduces a distortion whenever the shares themselves are uncertain, and no choice of $p_j$ removes it. Bottom-up has no such problem, because summing unbiased forecasts gives an unbiased sum.

**Try it:** The three variants clearly disagree, but not equally everywhere. Find the three regions where the spread between the highest and lowest of the three top-down forecasts is largest.

```r title="Your turn: find the biggest disagreement"
ex_td_spread <- NULL
# ex_td_spread: from td3, drop the three aggregate rows, then add
#   spread = pmax(td_ap, td_pa, td_fp) - pmin(td_ap, td_pa, td_fp)
#   keep Series and spread, sort descending, and take the top 3
# Expected: Experience Perth 126.5, Australia's South West 114.5,
#   Australia's Coral Coast 44.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top-down spread solution"
ex_td_spread <- td3 |>
  filter(!Series %in% c("TOTAL", "Tasmania", "Western Australia")) |>
  mutate(spread = round(pmax(td_ap, td_pa, td_fp) - pmin(td_ap, td_pa, td_fp), 1)) |>
  select(Series, spread) |>
  arrange(desc(spread)) |>
  head(3)

ex_td_spread
#> # A tibble: 3 × 2
#>   Series                  spread
#>   <chr>                    <dbl>
#> 1 Experience Perth         126.5
#> 2 Australia's South West   114.5
#> 3 Australia's Coral Coast   44.6
```

**Explanation:** The biggest series disagree the most, in absolute terms, because they absorb the largest slice of the total. `pmax()` and `pmin()` work element by element across the three columns, which is what makes this a one-line row-wise comparison.

</details>

## What does middle-out do differently?

Deep hierarchies often have one level where the data is simply better than anywhere else. Individual stores are noisy, the national total is too coarse to plan against, but regions have enough volume to be stable and enough detail to be useful. Middle-out is built for that situation.

The recipe combines the two methods you have already seen. Pick a level. Above it, go bottom-up: add the chosen level's forecasts upward. Below it, go top-down: split each chosen-level forecast among its children using forecast proportions.

![Middle-out adds up above the chosen level and splits down below it](screenshots/Forecast-Reconciliation-in-R-middle-out.webp)

*Figure 3: Middle-out adds up above the chosen level and splits down below it.*

In fable the function is `middle_out()`, and it takes a `split` argument naming the level to anchor on. Level 1 is the first level below the grand total, which in our hierarchy is State.

```r title="Middle-out anchored at the state level"
fc_mo <- fit |>
  reconcile(mo = middle_out(base, split = 1)) |>
  forecast(h = 1)

mo_tab <- fc_mo |>
  as_tibble() |>
  mutate(State = as.character(State),
         Region = as.character(Region),
         Series = label(State, Region)) |>
  select(Series, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))

mo_tab |> print(n = 13)
#> # A tibble: 13 × 3
#>    Series                            base     mo
#>    <chr>                            <dbl>  <dbl>
#>  1 East Coast                       153.6  159.8
#>  2 Hobart and the South             439.3  457  
#>  3 Launceston, Tamar and the North  241.2  250.9
#>  4 North West                       183    190.4
#>  5 Wilderness West                   59.7   62.1
#>  6 Tasmania                        1120.2 1120.2
#>  7 Australia's Coral Coast          247.5  247.1
#>  8 Australia's Golden Outback       255    254.5
#>  9 Australia's North West           248.8  248.3
#> 10 Australia's South West           903.9  902.2
#> 11 Experience Perth                1084.4 1082.4
#> 12 Western Australia               2734.5 2734.5
#> 13 TOTAL                           3942.6 3854.6
```

Rows 6 and 12 did not move: Tasmania stayed at 1120.2 and Western Australia at 2734.5. That is the anchored level, preserved exactly, the same way bottom-up preserved the regions. Row 13 became 3854.6, which is simply 1120.2 plus 2734.5, the bottom-up step. Every region row moved, because each one was regenerated from its state's number.

Notice the direction of the region moves. Tasmania's regions all went up, because Tasmania's own model was higher than the sum of its regions. Western Australia's all went down slightly, for the opposite reason. Let's verify that this is really the recipe, rather than trusting the label on the function.

```r title="Verify middle-out by hand"
mo_hand <- base_mean |>
  filter(Region != "<aggregated>") |>
  mutate(region_share = base / sum(base), .by = State) |>
  left_join(transmute(state_base, State, state_fc = base), by = "State") |>
  transmute(Series, by_hand = round(state_fc * region_share, 1)) |>
  left_join(select(mo_tab, Series, from_fable = mo), by = "Series")

mo_hand |> print(n = 10)
#> # A tibble: 10 × 3
#>    Series                          by_hand from_fable
#>    <chr>                             <dbl>      <dbl>
#>  1 East Coast                        159.8      159.8
#>  2 Hobart and the South              457        457  
#>  3 Launceston, Tamar and the North   250.9      250.9
#>  4 North West                        190.4      190.4
#>  5 Wilderness West                    62.1       62.1
#>  6 Australia's Coral Coast           247.1      247.1
#>  7 Australia's Golden Outback        254.5      254.5
#>  8 Australia's North West            248.3      248.3
#>  9 Australia's South West            902.2      902.2
#> 10 Experience Perth                 1082.4     1082.4
```

We reused `region_share`, each region's base forecast as a fraction of its state's five regions, and multiplied it by that state's own base forecast instead of by a share of the grand total. Ten rows, ten exact matches. Middle-out below the anchor is precisely top-down with forecast proportions, started one level lower.

Now a practical trap. The widely-read textbook description of this function uses a signature that current fabletools does not accept. If you copy `middle_out(base, level = 1, method = "forecast_proportions")` from a tutorial, here is what happens.

```r title="The signature that no longer works"
tryCatch(
  fit |> reconcile(mo = middle_out(base, level = 1)) |> forecast(h = 1),
  error = function(e) cat(conditionMessage(e), "\n")
)
#> ℹ In argument: `mo = middle_out(base, level = 1)`.
#> Caused by error in `middle_out()`:
#> ! unused argument (level = 1) 
```

`tryCatch()` runs the expression and, if it raises an error, hands the error object to the handler function instead of stopping the session. We print the message with `cat()` so you can read it. The message says exactly what is wrong: `middle_out()` has no `level` argument. The real signature is `middle_out(models, split = 1)`, with no `method` argument at all, because the downward step always uses forecast proportions.

[WARNING]
**Check the signature of middle_out() against the installed package, not against a textbook.** The current fabletools signature is `middle_out(models, split = 1)`. Passing `level =` fails immediately, which is the good case. Passing a `split` that points at the bottom level of the hierarchy raises an internal error asking you to file a bug report, which is far more confusing. Anchor on a genuine middle level, and if you want the bottom level, call `bottom_up()`, which is what middle-out there would reduce to anyway.

**Try it:** The claim above is that middle-out preserves the anchored level exactly. Verify it on the two state rows rather than taking it on trust.

```r title="Your turn: confirm the anchored level is preserved"
ex_mo_states <- NULL
# ex_mo_states: from mo_tab, keep the rows where Series is "Tasmania"
#   or "Western Australia", then add change = mo - base
# Expected: change is 0 on both rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Anchored level preservation solution"
ex_mo_states <- mo_tab |>
  filter(Series %in% c("Tasmania", "Western Australia")) |>
  mutate(change = mo - base)

ex_mo_states
#> # A tibble: 2 × 4
#>   Series              base     mo change
#>   <chr>              <dbl>  <dbl>  <dbl>
#> 1 Tasmania          1120.2 1120.2      0
#> 2 Western Australia 2734.5 2734.5      0
```

**Explanation:** Both zero. Each single-level method has exactly one level it never touches, and for `middle_out(split = 1)` that level is the states.

</details>

## What do all three methods have in common?

You have now seen three recipes that look quite different: adding upward, splitting by historical shares, splitting by forecast shares. They are all the same operation with one ingredient swapped.

Every reconciliation method in fable computes

$$\tilde{y}_h = S G \hat{y}_h$$

Where:

- $\hat{y}_h$ = the vector of all base forecasts, one per series in the hierarchy
- $G$ = a matrix that maps those base forecasts down to a set of bottom-level values
- $S$ = the summing matrix, which adds those bottom-level values back up to fill in every aggregate
- $\tilde{y}_h$ = the vector of reconciled, coherent forecasts

$S$ is fixed the moment you decide the shape of the hierarchy. It contains no choices. **The method is entirely the $G$ matrix.** Let's build both by hand and multiply them, which is the most direct way to see what "the method is $G$" actually means.

Our thirteen-series hierarchy would need a 10 by 13 matrix, too wide to read on screen. So we shrink to Tasmania alone: one total and five regions, six series. Same ideas, matrices that fit.

```r title="A six-series hierarchy for the matrix view"
tas <- tourism |>
  filter(State == "Tasmania") |>
  as_tibble() |>
  summarise(Trips = sum(Trips), .by = c(Quarter, Region)) |>
  as_tsibble(index = Quarter, key = Region) |>
  aggregate_key(Region, Trips = sum(Trips))

short <- c("<aggregated>" = "Total", "East Coast" = "EastC",
           "Hobart and the South" = "Hobart",
           "Launceston, Tamar and the North" = "Launc",
           "North West" = "NorthW", "Wilderness West" = "Wild")

tas_fc <- tas |>
  model(base = ETS(Trips)) |>
  reconcile(bu = bottom_up(base),
            td = top_down(base, method = "proportion_averages")) |>
  forecast(h = 1) |>
  as_tibble() |>
  mutate(id = unname(short[as.character(Region)])) |>
  select(id, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean)

ord <- c("Total", "EastC", "Hobart", "Launc", "NorthW", "Wild")
yhat <- setNames(tas_fc$base, tas_fc$id)[ord]
round(yhat, 2)
#>   Total   EastC  Hobart   Launc  NorthW    Wild 
#> 1120.19  153.58  439.26  241.22  183.00   59.72 
```

The `short` lookup swaps the long region names for abbreviations so the matrices print in a readable width. `ord` fixes the order of the six series, total first and then the five regions, and `yhat` is the base-forecast vector in that order. These are the same Tasmania numbers you saw earlier, now as a plain named vector ready for matrix algebra.

Here is the summing matrix. Six rows, one per series in the hierarchy, and five columns, one per bottom series.

```r title="The summing matrix S"
S <- rbind(rep(1, 5), diag(5))
dimnames(S) <- list(ord, ord[-1])
S
#>        EastC Hobart Launc NorthW Wild
#> Total      1      1     1      1    1
#> EastC      1      0     0      0    0
#> Hobart     0      1     0      0    0
#> Launc      0      0     1      0    0
#> NorthW     0      0     0      1    0
#> Wild       0      0     0      0    1
```

Read row by row. The `Total` row is all ones, meaning the total is the sum of all five regions. Each region row is a single one in its own column, meaning a region is just itself. That is the entire hierarchy encoded as arithmetic, and it never changes no matter which method you pick.

Now the bottom-up $G$. Its job is to answer "given all six base forecasts, what are the five bottom-level values?" Bottom-up's answer is "ignore the total, keep the five regions as they are".

```r title="The bottom-up G matrix"
G_bu <- cbind(0, diag(5))
dimnames(G_bu) <- list(ord[-1], ord)
G_bu
#>        Total EastC Hobart Launc NorthW Wild
#> EastC      0     1      0     0      0    0
#> Hobart     0     0      1     0      0    0
#> Launc      0     0      0     1      0    0
#> NorthW     0     0      0     0      1    0
#> Wild       0     0      0     0      0    1
```

A zero column for the total, then an identity matrix for the regions. "Discard the top forecast, copy the bottom ones." Multiply it out and compare against what fable produced.

```r title="Matrix arithmetic reproduces bottom_up()"
check_bu <- rbind(by_matrix  = as.vector(S %*% G_bu %*% yhat),
                  from_fable = setNames(tas_fc$bu, tas_fc$id)[ord])
colnames(check_bu) <- ord
round(check_bu, 2)
#>              Total  EastC Hobart  Launc NorthW  Wild
#> by_matrix  1076.78 153.58 439.26 241.22    183 59.72
#> from_fable 1076.78 153.58 439.26 241.22    183 59.72
```

`%*%` is R's matrix multiplication operator, and R evaluates it left to right: $G$ turns the six base forecasts into five bottom values, then $S$ expands those five back into all six coherent forecasts. Two identical rows. Six lines of matrix algebra reproduced the package exactly.

Now swap in top-down's $G$ and change nothing else.

```r title="The top-down G matrix"
p_tas <- tourism |>
  filter(State == "Tasmania") |>
  as_tibble() |>
  summarise(m = mean(Trips), .by = Region) |>
  mutate(id = unname(short[Region]))

pv <- setNames(p_tas$m, p_tas$id)[ord[-1]]
pv <- pv / sum(pv)

G_td <- cbind(pv, matrix(0, 5, 5))
dimnames(G_td) <- list(ord[-1], ord)
round(G_td, 4)
#>         Total EastC Hobart Launc NorthW Wild
#> EastC  0.1238     0      0     0      0    0
#> Hobart 0.4031     0      0     0      0    0
#> Launc  0.2498     0      0     0      0    0
#> NorthW 0.1642     0      0     0      0    0
#> Wild   0.0592     0      0     0      0    0
```

`pv` holds the proportions-of-historical-averages shares for Tasmania's five regions, computed the same way as before. They occupy the `Total` column, and every other column is zero. In words: "take the total, multiply it by these shares, ignore all five region forecasts."

```r title="Matrix arithmetic reproduces top_down()"
check_td <- rbind(by_matrix  = as.vector(S %*% G_td %*% yhat),
                  from_fable = setNames(tas_fc$td, tas_fc$id)[ord])
colnames(check_td) <- ord
round(check_td, 2)
#>              Total  EastC Hobart  Launc NorthW  Wild
#> by_matrix  1120.19 138.69 451.51 279.78 183.94 66.28
#> from_fable 1120.19 138.69 451.51 279.78 183.94 66.28
```

Identical again. Same $S$, same $\hat{y}$, same multiplication. The only thing that changed between the two results was thirty numbers in a matrix.

[KEY INSIGHT]
**A single-level method is a G matrix with exactly one non-zero block of columns.** Bottom-up puts its weight on the bottom columns and zeroes the top. Top-down puts everything in the top column and zeroes the bottom. Middle-out zeroes everything except its anchored level. Each one is throwing away most of the forecasts it was handed, and that discarded information is precisely what the modern MinT method recovers.

**Try it:** Count the all-zero columns in each $G$ matrix. The count tells you how many base forecasts the method ignored completely.

```r title="Your turn: count the ignored forecasts"
ex_zero_cols <- NULL
# ex_zero_cols: build a named vector with one entry per matrix, each counting
#   how many columns have colSums(abs(...)) equal to 0, for G_bu and G_td
# Expected: G_bu ignores 1 forecast, G_td ignores 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Zero column count solution"
ex_zero_cols <- c(zero_cols_G_bu = sum(colSums(abs(G_bu)) == 0),
                  zero_cols_G_td = sum(colSums(abs(G_td)) == 0))

ex_zero_cols
#> zero_cols_G_bu zero_cols_G_td 
#>              1              5 
```

**Explanation:** Bottom-up discarded one model, the total. Top-down discarded five, every region. On this six-series hierarchy top-down is throwing away five sixths of the modelling work, which is a good reason to be sure the top-level model is worth that trade.

</details>

## Which method actually forecasts best?

Everything so far has been mechanics. Now we measure. Reconciliation costs nothing to try, since it never refits a model, so there is no excuse for guessing.

The test is a holdout. Train on data up to the end of 2015, forecast the eight quarters of 2016 and 2017, and score those forecasts against what actually happened. Crucially, we score each level separately, because a method that helps at the top can hurt at the bottom.

```r title="Train, forecast and hold out two years"
train <- hier |> filter(Quarter <= yearquarter("2015 Q4"))

fc_all <- train |>
  model(base = ETS(Trips)) |>
  reconcile(bu = bottom_up(base),
            td = top_down(base, method = "forecast_proportions"),
            mo = middle_out(base, split = 1)) |>
  forecast(h = 8)

fc_all
#> # A fable: 416 x 6 [1Q]
#> # Key:     State, Region, .model [52]
#>    State    Region     .model Quarter
#>    <chr*>   <chr*>     <chr>    <qtr>
#>  1 Tasmania East Coast base   2016 Q1
#>  2 Tasmania East Coast base   2016 Q2
#>  3 Tasmania East Coast base   2016 Q3
#>  4 Tasmania East Coast base   2016 Q4
#>  5 Tasmania East Coast base   2017 Q1
#>  6 Tasmania East Coast base   2017 Q2
#>  7 Tasmania East Coast base   2017 Q3
#>  8 Tasmania East Coast base   2017 Q4
#>  9 Tasmania East Coast bu     2016 Q1
#> 10 Tasmania East Coast bu     2016 Q2
#> # ℹ 406 more rows
#> # ℹ 2 more variables: Trips <dist>, .mean <dbl>
```

`yearquarter("2015 Q4")` converts that piece of text into a quarterly date of the same type as the `Quarter` column, which is what lets `filter()` compare the two. The header then tells the story: 52 keys, which is thirteen series times four methods, and 416 rows, which is 52 times the eight-quarter horizon. All four sets of forecasts came out of one `forecast()` call, because reconciliation is a cheap linear adjustment applied after the models are already fitted.

Now score them. `accuracy()` compares each forecast against the full dataset and returns the standard error measures per series, which we group into the three levels and average.

```r title="RMSE by hierarchy level"
acc <- fc_all |>
  accuracy(hier) |>
  mutate(Level = ifelse(is_aggregated(State), "Total",
                 ifelse(is_aggregated(Region), "State", "Region"))) |>
  summarise(RMSE = mean(RMSE), MASE = mean(MASE), .by = c(Level, .model))

rmse_tab <- acc |>
  select(Level, .model, RMSE) |>
  pivot_wider(names_from = .model, values_from = RMSE) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))

rmse_tab
#> # A tibble: 3 × 5
#>   Level   base    bu    mo    td
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 Region  52.3  52.3  50.7  53.5
#> 2 State  156.3 189.3 156.3 191.7
#> 3 Total  179.8 172.8 143.6 179.8
```

`is_aggregated()` is a tsibble helper that tests whether a key value is one of the totals `aggregate_key()` created, which is how we sort the thirteen series into Total, State and Region. RMSE is the root mean squared error in the same units as the data, thousands of trips, so lower is better.

Middle-out won at the total by a wide margin, 143.6 against the base 179.8, and it also won at the region level. Bottom-up improved the total a little and hurt the state level badly. Top-down was the worst option at both lower levels here.

But look more carefully at three of those numbers. Bottom-up scored 52.3 at Region and so did base. Top-down scored 179.8 at Total and so did base. Middle-out scored 156.3 at State and so did base. Those are not coincidences.

```r title="The preservation identity"
acc |>
  select(Level, .model, RMSE) |>
  pivot_wider(names_from = .model, values_from = RMSE) |>
  transmute(Level,
            bu_minus_base = round(bu - base, 6),
            td_minus_base = round(td - base, 6),
            mo_minus_base = round(mo - base, 6))
#> # A tibble: 3 × 4
#>   Level  bu_minus_base td_minus_base mo_minus_base
#>   <chr>          <dbl>         <dbl>         <dbl>
#> 1 Region        0             1.2232       -1.6318
#> 2 State        32.987        35.309         0     
#> 3 Total        -7.0088        0           -36.242 
#> 
```

Zero to six decimal places, once in each column, and each zero sits on a different row. Bottom-up's accuracy at the region level is not merely similar to the base forecast's, it is the base forecast. Same for top-down at the total and middle-out at the state level.

This is the whole argument of the tutorial visible as three zeros. Each method has one level it copies verbatim and cannot possibly improve, and every gain or loss it delivers happens somewhere else.

[TIP]
**Never judge reconciliation on a single overall accuracy number.** Average the four methods here into one figure each and you would conclude they are all much the same. Broken out by level, bottom-up costs 21 percent at the state level while saving 4 percent at the top, which is a trade you can only accept or reject if you know which level your business actually plans on.

**Try it:** RMSE punishes big errors on big series, so it naturally favours whatever helps the largest numbers. MASE rescales every series by how hard it is to forecast, which makes small and large series comparable. Build the same table using MASE and see whether the ranking survives.

```r title="Your turn: rank the methods on MASE"
ex_mase <- NULL
# ex_mase: from acc, select Level, .model and MASE, pivot the .model column
#   wider, and round every numeric column to 3 decimals
# Expected: at Region, mo scores 1.208 while base and bu score 1.179
```

<details>
<summary>Click to reveal solution</summary>

```r title="MASE ranking solution"
ex_mase <- acc |>
  select(Level, .model, MASE) |>
  pivot_wider(names_from = .model, values_from = MASE) |>
  mutate(across(where(is.numeric), function(x) round(x, 3)))

ex_mase
#> # A tibble: 3 × 5
#>   Level   base    bu    mo    td
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 Region 1.179 1.179 1.208 1.181
#> 2 State  1.181 1.316 1.181 1.296
#> 3 Total  0.696 0.733 0.587 0.696
```

**Explanation:** The ranking flips at the region level. On RMSE middle-out was the best there, on MASE it is the worst. Middle-out helped the big regions and hurt the small ones, and RMSE only noticed the first half of that. The preservation zeros survive both metrics, because they are structural rather than statistical.

</details>

## When should you use each method?

The bake-off above was one hierarchy over one holdout window. Do not generalise from it. What does generalise is the structure, so here is the decision framed around what each method keeps and what it destroys.

![Which single-level method to reach for first](screenshots/Forecast-Reconciliation-in-R-method-choice.webp)

*Figure 4: Which single-level method to reach for first.*

| Method | Preserves exactly | Discards | Choose it when |
|---|---|---|---|
| `bottom_up()` | Every bottom-level forecast | Every model above the bottom | Bottom series have real volume and clean history |
| `top_down()` | The grand-total forecast | Every model below the top | Bottom series are sparse, intermittent or brand new |
| `middle_out()` | The anchored middle level | Models above and below that level | One middle level clearly has the best data |
| `min_trace()` | Nothing exactly | Nothing | You have residual history and want to use all of it |

The recurring question is which level is genuinely most forecastable. That is measurable before you reconcile anything. One quick proxy is the coefficient of variation, the standard deviation of a series divided by its mean, which says how much a series bounces around relative to its own size.

```r title="How noisy is each level"
noise <- hier |>
  as_tibble() |>
  mutate(State = as.character(State), Region = as.character(Region)) |>
  mutate(Level = ifelse(State == "<aggregated>", "Total",
                 ifelse(Region == "<aggregated>", "State", "Region")),
         Series = label(State, Region)) |>
  summarise(cv = sd(Trips) / mean(Trips), .by = c(Level, Series)) |>
  summarise(series = n(), mean_cv = round(mean(cv), 3), .by = Level)

noise
#> # A tibble: 3 × 3
#>   Level  series mean_cv
#>   <chr>   <int>   <dbl>
#> 1 Total       1   0.196
#> 2 State       2   0.248
#> 3 Region     10   0.323
```

We computed the coefficient of variation for each of the thirteen series, then averaged within each level. It climbs steadily on the way down: 0.196 at the total, 0.248 at the states, 0.323 at the regions. Aggregation cancels out idiosyncratic noise, which is why totals are almost always the easiest series in a hierarchy to forecast.

That is the honest case for top-down, and the reason bottom-up can disappoint. It is also why the answer changes with the data: run this on a hierarchy where the bottom series are large and stable and the gap narrows or reverses.

There are situations where a single-level method is not a compromise but the correct choice:

- **The bottom is brand new.** Products launched last month have no history to model. Top-down gives them a share of a total you can actually forecast.
- **The bottom is intermittent.** Series that are zero most weeks break most forecasting models. Aggregate first, split afterwards.
- **A number is mandated.** If finance has committed to a total, top-down is the only family member that reproduces it untouched.
- **You have no residuals.** Judgemental forecasts, or numbers arriving from another team, come without an error history. Every single-level method works anyway; the modern alternatives do not.

[NOTE]
**Single-level methods need no residual history, and that is why they survive.** `min_trace()` estimates a covariance matrix from in-sample errors, so it needs models you fitted yourself with enough history behind them. Bottom-up, top-down and middle-out need only the point forecasts, which is exactly what you have when the numbers arrive as a spreadsheet from another department.

When none of those constraints apply and you do have residuals, the case for a single-level method weakens sharply. Throwing away most of your models to satisfy a structural constraint is a strange trade when a method exists that uses all of them. That method is MinT, and it is the subject of the next tutorial in this series.

**Try it:** Your finance team has signed off on the total in the plan and it may not change. Work out which of the reconciliation methods you have seen leaves that total exactly as the base model produced it.

```r title="Your turn: which method preserves a mandated total"
ex_mandated <- NULL
# ex_mandated: build a tibble with a method column naming
#   "base", "bottom_up", "top_down", "middle_out" and a total column holding
#   the TOTAL row from base_mean$base, bu_tab$bu, td3$td_fp and mo_tab$mo,
#   then round total to 1 decimal
# Expected: only top_down matches base at 3942.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mandated total solution"
ex_mandated <- tibble(
  method = c("base", "bottom_up", "top_down", "middle_out"),
  total  = c(base_mean$base[base_mean$Series == "TOTAL"],
             bu_tab$bu[bu_tab$Series == "TOTAL"],
             td3$td_fp[td3$Series == "TOTAL"],
             mo_tab$mo[mo_tab$Series == "TOTAL"])
) |>
  mutate(total = round(total, 1))

ex_mandated
#> # A tibble: 4 × 2
#>   method      total
#>   <chr>       <dbl>
#> 1 base       3942.6
#> 2 bottom_up  3816.3
#> 3 top_down   3942.6
#> 4 middle_out 3854.6
```

**Explanation:** Top-down alone reproduces 3942.6. Bottom-up moved the total by 126 and middle-out by 88. If the committed number cannot move, that constraint picks your method for you, whatever the accuracy table says.

</details>

## Complete Example: reconcile a fresh hierarchy three ways

Here is the whole workflow end to end on data we have not touched, Queensland and South Australia, in one uninterrupted pipeline. Raw quarterly data goes in, three coherent sets of forecasts come out.

```r title="End-to-end reconciliation pipeline"
final_fc <- tourism |>
  filter(State %in% c("Queensland", "South Australia")) |>
  as_tibble() |>
  summarise(Trips = sum(Trips), .by = c(Quarter, State, Region)) |>
  as_tsibble(index = Quarter, key = c(State, Region)) |>
  aggregate_key(State / Region, Trips = sum(Trips)) |>
  model(base = ETS(Trips)) |>
  reconcile(bu = bottom_up(base),
            td = top_down(base, method = "forecast_proportions"),
            mo = middle_out(base, split = 1)) |>
  forecast(h = 4)

final_tab <- final_fc |>
  as_tibble() |>
  filter(is_aggregated(State)) |>
  select(Quarter, .model, .mean) |>
  pivot_wider(names_from = .model, values_from = .mean) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))

final_tab
#> # A tibble: 4 × 5
#>   Quarter   base     bu     td     mo
#>     <qtr>  <dbl>  <dbl>  <dbl>  <dbl>
#> 1 2018 Q1 7452   7331   7452   7427.1
#> 2 2018 Q2 7529.5 7428.8 7529.5 7497.2
#> 3 2018 Q3 7808.3 7693.5 7808.3 7769.3
#> 4 2018 Q4 7601.2 7551.4 7601.2 7570.8
```

Six verbs, in the order you will always use them: `summarise()` to collapse breakdowns you do not want, `as_tsibble()` to declare index and key, `aggregate_key()` to create the totals, `model()` to fit every series, `reconcile()` to attach the methods, `forecast()` to produce them all.

The output is the four quarters of 2018 at the grand-total level. The `td` column matches `base` in every row, because top-down never touches the total, on any horizon. Bottom-up sits consistently below both, and middle-out lands between them. The same structural pattern you saw on Tasmania and Western Australia reappears immediately on a completely different pair of states.

## Practice Exercises

These combine several ideas from the tutorial. Every exercise is solvable with what you have already seen. Variables are prefixed `my_` so they do not disturb anything defined above, and Exercise 3 reuses the hierarchy you build in Exercise 1.

### Exercise 1: Reconcile a new pair of states two ways

Build a hierarchy from Victoria and South Australia with `State / Region` nesting, fit `ETS()` to every series, reconcile it with both `bottom_up()` and `top_down(method = "forecast_proportions")`, and report the one-step-ahead grand-total forecast for each of the three model columns.

```r title="Exercise 1: build and reconcile"
# Steps:
# 1. filter tourism to Victoria and South Australia
# 2. sum Trips by Quarter, State and Region, then as_tsibble()
# 3. aggregate_key(State / Region, Trips = sum(Trips)) into my_hier
# 4. model(base = ETS(Trips)), reconcile with bu and td, forecast(h = 1)
# 5. keep the rows where is_aggregated(State) and show total by .model

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_hier <- tourism |>
  filter(State %in% c("Victoria", "South Australia")) |>
  as_tibble() |>
  summarise(Trips = sum(Trips), .by = c(Quarter, State, Region)) |>
  as_tsibble(index = Quarter, key = c(State, Region)) |>
  aggregate_key(State / Region, Trips = sum(Trips))

my_totals <- my_hier |>
  model(base = ETS(Trips)) |>
  reconcile(bu = bottom_up(base),
            td = top_down(base, method = "forecast_proportions")) |>
  forecast(h = 1) |>
  as_tibble() |>
  filter(is_aggregated(State)) |>
  summarise(.by = .model, total = round(.mean, 1))

my_totals
#> # A tibble: 3 × 2
#>   .model  total
#>   <chr>   <dbl>
#> 1 base   9656.6
#> 2 bu     8975.5
#> 3 td     9656.6
```

**Explanation:** Top-down reproduces the base total exactly, as it must. Bottom-up lands 681 lower, a 7 percent gap, which is much wider than the 3 percent we saw on Tasmania and Western Australia. Victoria has 21 regions, so there are far more small noisy series feeding the sum.

</details>

### Exercise 2: Rebuild top_down() from scratch with matrices

Reproduce `top_down(method = "average_proportions")` on the original thirteen-series hierarchy using only matrix algebra, then prove your result matches fable. You will need a 13 by 10 summing matrix and a 10 by 13 $G$ matrix whose only non-zero column holds the proportions from `p_both$p_ap`.

Order the series as `TOTAL`, then the two states, then the ten regions in the order they appear in `base_mean`.

```r title="Exercise 2: reconstruct top-down"
# Steps:
# 1. my_bottom <- base_mean rows where Region != "<aggregated>"
# 2. my_ord <- c("TOTAL", "Tasmania", "Western Australia", my_bottom$Series)
# 3. my_yhat <- base_mean$base reordered to match my_ord
# 4. my_S: row 1 is ten 1s, row 2 is five 1s then five 0s, row 3 the reverse,
#    then diag(10)
# 5. my_G: cbind the p_ap proportions with a 10 by 12 matrix of zeros
# 6. compare as.vector(my_S %*% my_G %*% my_yhat) against the td_ap forecasts

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_bottom <- base_mean |> filter(Region != "<aggregated>")
my_ord <- c("TOTAL", "Tasmania", "Western Australia", my_bottom$Series)
my_yhat <- base_mean$base[match(my_ord, base_mean$Series)]

my_S <- rbind(rep(1, 10),
              c(rep(1, 5), rep(0, 5)),
              c(rep(0, 5), rep(1, 5)),
              diag(10))

my_p <- p_both$p_ap[match(my_bottom$Region, p_both$Region)]
my_G <- cbind(my_p, matrix(0, 10, 12))

my_fable <- fc_td3 |>
  as_tibble() |>
  mutate(Series = label(as.character(State), as.character(Region))) |>
  filter(.model == "td_ap") |>
  select(Series, td_ap = .mean)

tibble(Series     = my_ord,
       by_matrix  = round(as.vector(my_S %*% my_G %*% my_yhat), 2),
       from_fable = round(my_fable$td_ap[match(my_ord, my_fable$Series)], 2)) |>
  print(n = 13)
#> # A tibble: 13 × 3
#>    Series                          by_matrix from_fable
#>    <chr>                               <dbl>      <dbl>
#>  1 TOTAL                             3942.6     3942.6 
#>  2 Tasmania                          1055.8     1055.8 
#>  3 Western Australia                 2886.8     2886.8 
#>  4 East Coast                         128.79     128.79
#>  5 Hobart and the South               426.26     426.26
#>  6 Launceston, Tamar and the North    265.7      265.7 
#>  7 North West                         172.55     172.55
#>  8 Wilderness West                     62.45      62.45
#>  9 Australia's Coral Coast            297.35     297.35
#> 10 Australia's Golden Outback         293.63     293.63
#> 11 Australia's North West             253.95     253.95
#> 12 Australia's South West             808.34     808.34
#> 13 Experience Perth                  1233.6     1233.6 
```

**Explanation:** Thirteen exact matches. The three rows of `my_S` above `diag(10)` encode the grand total, Tasmania's five regions and Western Australia's five regions. `my_G` has twelve zero columns and one column of proportions, which is the matrix statement of "use the total, ignore everything else".

</details>

### Exercise 3: Run a bake-off and decide what to ship

Using `my_hier` from Exercise 1, train on data through 2015 Q4, forecast eight quarters with `base`, `bottom_up()`, `top_down(method = "forecast_proportions")` and `middle_out(split = 1)`, and report mean RMSE by level. Then decide which method you would ship for Victoria and South Australia, and say why.

```r title="Exercise 3: bake-off on your own hierarchy"
# Steps:
# 1. my_train <- my_hier filtered to Quarter <= yearquarter("2015 Q4")
# 2. model + reconcile with bu, td and mo, then forecast(h = 8)
# 3. accuracy(my_hier), add a Level column with is_aggregated()
# 4. mean RMSE by Level and .model, pivot wider, round to 1 decimal

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_train <- my_hier |> filter(Quarter <= yearquarter("2015 Q4"))

my_acc <- my_train |>
  model(base = ETS(Trips)) |>
  reconcile(bu = bottom_up(base),
            td = top_down(base, method = "forecast_proportions"),
            mo = middle_out(base, split = 1)) |>
  forecast(h = 8) |>
  accuracy(my_hier) |>
  mutate(Level = ifelse(is_aggregated(State), "Total",
                 ifelse(is_aggregated(Region), "State", "Region"))) |>
  summarise(RMSE = mean(RMSE), .by = c(Level, .model)) |>
  pivot_wider(names_from = .model, values_from = RMSE) |>
  mutate(across(where(is.numeric), function(x) round(x, 1)))

my_acc
#> # A tibble: 3 × 5
#>   Level   base     bu    mo    td
#>   <chr>  <dbl>  <dbl> <dbl> <dbl>
#> 1 Region  42.8   42.8  37.7  37.4
#> 2 State  431.8  546.7 431.8 424.5
#> 3 Total  829.8 1078.2 844.7 829.8
```

**Explanation:** The ranking is completely different from the Tasmania and Western Australia bake-off, where top-down was worst at both lower levels. Here top-down wins at Region and State and ties base at Total, while bottom-up is the worst option everywhere. Victoria's 21 regions are individually noisy, so the aggregate carries more signal than the parts, and top-down is the method to ship. The preservation zeros still hold: `bu` matches `base` at Region, `td` matches `base` at Total, `mo` matches `base` at State.

</details>

## Frequently Asked Questions

### Does making forecasts coherent also make them more accurate?

Not on its own. Coherence is a constraint on the numbers, not new information about the future, so reconciliation mostly moves accuracy around the hierarchy rather than adding it. In the bake-off above, bottom-up improved RMSE at the total from 179.8 to 172.8 and made the state level clearly worse, from 156.3 to 189.3. Score the methods on a holdout at the level you actually plan on, rather than assuming that adding up correctly means forecasting well.

### If I only remember one of these methods, which should it be?

Bottom-up. It needs nothing but the bottom-level point forecasts, it works on every hierarchy shape, it never makes the bottom level worse, and it has no arguments to get wrong. It is the sensible default when you have real volume in the bottom series.

### Can I use top_down() on a grouped structure?

No. If you build a crossed structure with `aggregate_key(State * Purpose, ...)`, where two attributes cut across each other instead of nesting, `top_down()` stops with the message "Top down reconciliation requires strictly hierarchical structures". The reason is that a grouped structure has more than one path from the bottom to the total, so there is no single set of proportions to split by. `middle_out()` has the same restriction. `bottom_up()` works fine, because summing upward is well defined no matter how many paths there are.

### Do these methods reconcile prediction intervals, or only the point forecasts?

The whole distribution. The `Trips` column in a fable is a distribution, not a number, and `reconcile()` acts on it. On the hierarchy in this tutorial the base 80 percent interval for the total was [3530.7, 4354.4] and the bottom-up one was [3565.1, 4067.4], so the reconciled interval is both shifted and considerably narrower.

### Does reconciliation refit any models?

No. Every method here is a linear transformation applied to forecasts that already exist, which is why `reconcile()` sits after `model()` and costs essentially nothing. Adding a fourth or fifth method to the same call adds no model fitting at all, so there is no reason to guess which one is best when you can score them all.

### Does any of this depend on using ETS?

No. Swap `ETS(Trips)` for `ARIMA(Trips)` and everything works identically, because reconciliation only ever sees the forecasts. On this hierarchy an ARIMA base gives a total of 3773.6 and its bottom-up reconciliation gives 3716.4, the same structural relationship as with ETS but different numbers.

### Why is my middle_out() call asking me to file a bug report?

You almost certainly passed a `split` that points at the bottom level of the hierarchy. There is nothing below the bottom to split into, and rather than saying so, fabletools raises an internal error inviting a bug report. Anchor on a genuine middle level, and use `bottom_up()` if the bottom is what you meant.

### Can reconciliation turn a positive forecast negative?

Bottom-up cannot, because it only adds non-negative numbers together. Top-down and middle-out cannot either, as long as the proportions are positive, because they multiply a positive total by fractions. Negative reconciled forecasts do appear with methods that subtract, such as MinT, and they are a known nuisance on low-count series.

## Summary

The three classical methods, in one table:

| Method | Level it trusts | What it preserves exactly | What it ignores |
|---|---|---|---|
| `bottom_up()` | The bottom | Every bottom-level forecast | All aggregate models |
| `top_down()` | The top | The grand-total forecast | All models below the top |
| `middle_out(split = k)` | Level `k` | Every forecast at level `k` | Everything above and below |

The ideas worth carrying away:

- **Incoherence is silent.** Thirteen correctly fitted models gave three different answers for the same total, 3942.6, 3854.6 and 3816.3, and nothing warned us.
- **Every method is $\tilde{y} = SG\hat{y}$.** $S$ is fixed by the hierarchy shape; $G$ is the entire method. Bottom-up, top-down and middle-out differ only in which columns of $G$ are non-zero.
- **The preservation identity is structural.** Each method's accuracy at the level it trusts is identical to the base forecast's, to the last decimal, on every metric.
- **Top-down has three proportion variants.** The two historical ones differed by at most 0.22 percentage points here, and both freeze the shares. `forecast_proportions` is the default because it tracks trends in the mix.
- **Check the signature, not the textbook.** It is `middle_out(models, split = 1)`. There is no `level` argument and no `method` argument.
- **Always score by level.** A single averaged accuracy number hides the whole trade, which is always "better here, worse there".

## References

1. Hyndman, R.J. and Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 11.2: Single level approaches. [Link](https://otexts.com/fpp3/single-level.html)
2. Hyndman, R.J. and Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition. Chapter 11.1: Hierarchical and grouped time series. [Link](https://otexts.com/fpp3/hts.html)
3. fabletools reference - `top_down()`: top-down forecast reconciliation. [Link](https://fabletools.tidyverts.org/reference/top_down.html)
4. fabletools reference - `bottom_up()`: bottom-up forecast reconciliation. [Link](https://fabletools.tidyverts.org/reference/bottom_up.html)
5. fabletools reference - `middle_out()`: middle-out forecast reconciliation. [Link](https://fabletools.tidyverts.org/reference/middle_out.html)
6. Athanasopoulos, G., Ahmed, R.A. and Hyndman, R.J. - Hierarchical forecasts for Australian domestic tourism. *International Journal of Forecasting* 25(1), 146-166 (2009). [Link](https://robjhyndman.com/publications/hierarchical-tourism/)
7. Hyndman, R.J., Ahmed, R.A., Athanasopoulos, G. and Shang, H.L. - Optimal combination forecasts for hierarchical time series. *Computational Statistics and Data Analysis* 55(9), 2579-2589 (2011). [Link](https://robjhyndman.com/publications/hierarchical/)
8. Athanasopoulos, G., Hyndman, R.J., Kourentzes, N. and Panagiotelis, A. - Forecast reconciliation: a review. *International Journal of Forecasting* 40(2), 430-456 (2024). [Link](https://robjhyndman.com/publications/frreview.html)

## Continue Learning

- [Hierarchical and Grouped Time Series in R: Reconciliation](Hierarchical-Time-Series-in-R.html) - how to build hierarchies with `aggregate_key()`, what the summing matrix encodes in full, and how grouped structures differ from nested ones.
- [fable in R: Tidy Time Series Forecasting with tsibble](fable-in-R.html) - the tsibble and fable foundations underneath every code block here, including how `model()`, mables and fables fit together.
- [Forecast Accuracy in R: MAE, RMSE, MAPE, and MASE](Forecast-Accuracy-in-R.html) - what the RMSE and MASE numbers in the bake-off actually measure, and which one to believe when they disagree.
