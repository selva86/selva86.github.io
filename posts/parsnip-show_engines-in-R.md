---
title: "parsnip show_engines() in R: List Engines for a Model"
slug: parsnip-show_engines-in-R
description: "parsnip show_engines() in R lists every modeling engine available for a given model type. Learn the syntax, see worked examples, and avoid common mistakes."
keywords: "parsnip show_engines, show_engines function R, parsnip show_engines examples, R list parsnip engines, tidymodels show engines, parsnip model engines"
mathjax: false
webr: true
date: "2026-05-18"
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "show_engines()|parsnip show_engines|parsnip::show_engines()|show_engines|list modeling engines"
auto_link_case_sensitive: true
target_keyword: "parsnip show_engines"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip show_engines() in R: List Engines for a Model

<p class="lead">parsnip <code>show_engines()</code> returns a tibble of every modeling engine registered for a parsnip model type, paired with the mode (regression or classification) each engine supports. It is the fastest way to see your options before you commit one with <code>set_engine()</code>.</p>

[QUICK ANSWER]
show_engines("linear_reg")                          # all engines for a model
show_engines("rand_forest")                         # engines for random forest
show_engines("boost_tree")                          # boosted tree engines
show_engines("rand_forest") |> filter(mode == "regression")  # filter by mode
show_engines("boost_tree") |> pull(engine)          # engine names only
nrow(show_engines("linear_reg"))                    # count available engines
show_engines("linear_reg") |> distinct(engine)      # unique engines, drop mode

[DECISION TREE: Is show_engines() the right tool?]
- list engines for a model type: show_engines("linear_reg")
- see args and defaults per engine: show_model_info("linear_reg")
- attach one engine to a spec: set_engine(spec, "glmnet")
- check engine package requirements: required_pkgs(spec)
- see the translated engine call: translate(spec)
- inspect the fitted engine object: extract_fit_engine(fit)

## What show_engines() does

**`show_engines()` is a lookup function, not a modeling function.** It takes the name of a parsnip model type as a string and returns a two-column tibble listing every computational engine that can fit that model. An engine is the underlying package or system that does the real fitting work, such as `lm`, `glmnet`, `ranger`, or `spark`. parsnip wraps all of them behind one consistent interface, and `show_engines()` tells you which ones are on the menu.

```r title="Load parsnip and list engines"
library(parsnip)
library(dplyr)

# Every engine registered for linear regression
show_engines("linear_reg")
#> # A tibble: 7 x 2
#>   engine mode      
#>   <chr>  <chr>     
#> 1 lm     regression
#> 2 glm    regression
#> 3 glmnet regression
#> 4 stan   regression
#> 5 spark  regression
#> 6 keras  regression
#> 7 brulee regression
```

Each row is a valid `engine` and `mode` pairing. You read this as "linear regression can be fitted by `lm`, `glmnet`, `stan`, and four others, all in regression mode."

[NOTE]
**The engine list grows as you load extension packages.** Loading `multilevelmod`, `poissonreg`, or `bonsai` registers extra engines, so the exact rows you see depend on your installed packages and parsnip version. The columns are always `engine` and `mode`.

## show_engines() syntax and arguments

**`show_engines()` takes exactly one argument.** The signature is `show_engines(x)`, where `x` is a character string naming a parsnip model type. There is no `mode` argument and no `engine` argument: the function always returns the full set, and you filter the result afterwards with dplyr. The return value is a tibble with columns `engine` and `mode`, one row per valid combination.

The string you pass must match a parsnip model function name. These are the most common ones:

| Model type string | parsnip model | Typical task |
|---|---|---|
| `"linear_reg"` | Linear regression | Regression |
| `"logistic_reg"` | Logistic regression | Classification |
| `"rand_forest"` | Random forest | Both |
| `"boost_tree"` | Gradient boosting | Both |
| `"decision_tree"` | Decision tree | Both |

## show_engines() examples

**These four examples cover the use cases you hit most often.** Each one starts from a model type string and shapes the result with dplyr.

A classification-capable model returns rows for more than one mode:

```r title="Engines for a random forest"
show_engines("rand_forest")
#> # A tibble: 6 x 2
#>   engine       mode          
#>   <chr>        <chr>         
#> 1 ranger       classification
#> 2 ranger       regression    
#> 3 randomForest classification
#> 4 randomForest regression    
#> 5 spark        classification
#> 6 spark        regression
```

Filter to a single mode when you only care about one task. Here we keep just the regression engines:

```r title="Filter engines by mode"
show_engines("rand_forest") |>
  filter(mode == "regression")
#> # A tibble: 3 x 2
#>   engine       mode      
#>   <chr>        <chr>     
#> 1 ranger       regression
#> 2 randomForest regression
#> 3 spark        regression
```

Pull the engine names into a plain character vector when you want to loop over them or print a list:

```r title="Extract engine names only"
show_engines("boost_tree") |>
  pull(engine) |>
  unique()
#> [1] "xgboost" "C5.0"    "spark"   "h2o"
```

Once you have picked an engine, feed it straight into `set_engine()` to build the model spec:

```r title="Use the result with set_engine"
# show_engines confirmed 'glmnet' is valid for linear_reg
linear_reg() |>
  set_engine("glmnet")
#> Linear Regression Model Specification (regression)
#> 
#> Computational engine: glmnet
```

## show_engines() vs set_engine() vs show_model_info()

**These three functions answer different questions about engines.** `show_engines()` discovers what is available, `show_model_info()` dumps the full registry detail, and `set_engine()` commits your choice to a model specification.

| Function | Purpose | Returns | When to use |
|---|---|---|---|
| `show_engines()` | List engines for a model type | Tibble of `engine` + `mode` | Discover what is available |
| `show_model_info()` | Full registry detail for a model | Printed text dump | Inspect args, modes, and defaults |
| `set_engine()` | Attach one engine to a spec | Updated model specification | Build the model |

The decision rule is simple. Start with `show_engines()` to see the menu. If you need to know which tuning arguments an engine accepts, escalate to `show_model_info()`. Once you have decided, call `set_engine()` to lock it in.

[TIP]
**Chain show_engines() into your workflow during exploration.** Run `show_engines("boost_tree")` interactively before writing `set_engine()`, so you never guess an engine name and trigger an error halfway through a pipeline.

## Common pitfalls

**Most `show_engines()` errors come from how you pass the model name.** The argument must be a quoted string.

Passing the model function unquoted fails because R tries to evaluate it as an object:

```r title="Pitfall: unquoted model name"
show_engines(linear_reg)
#> Error: object 'linear_reg' of mode 'function' ...
# Fix: quote the model type
show_engines("linear_reg")
```

A misspelled or unknown model type returns a clear error rather than an empty tibble:

```r title="Pitfall: unknown model type"
show_engines("linear_regression")
#> Error: No results found for model function 'linear_regression'.
# Fix: use the exact parsnip name
show_engines("linear_reg")
```

The third trap is confusing `show_engines()` with `show_model_info()`. `show_engines()` gives you a tidy tibble you can filter; `show_model_info()` prints a long unstructured summary. Reach for the second only when you need argument-level detail.

[WARNING]
**An engine appearing in `show_engines()` does not mean it is installed.** The function reads the parsnip registry, not your library. `show_engines("rand_forest")` lists `ranger` even if `ranger` is not installed. Run `install.packages()` or check `required_pkgs()` before fitting.

## Try it yourself

**Try it:** Use `show_engines()` to list every engine for `"boost_tree"`, then keep only the rows where `mode` is `"regression"`. Save the result to `ex_engines`.

```r title="Your turn: filter boost_tree engines"
# Try it: list and filter boost_tree engines
ex_engines <- # your code here

ex_engines
#> Expected: a tibble with mode == "regression" only
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_engines <- show_engines("boost_tree") |>
  filter(mode == "regression")
ex_engines
#> # A tibble: 3 x 2
#>   engine  mode      
#>   <chr>   <chr>     
#> 1 xgboost regression
#> 2 spark   regression
#> 3 h2o     regression
```

**Explanation:** `show_engines("boost_tree")` returns every engine and mode pairing. The `filter()` call keeps only rows where the mode column equals `"regression"`, dropping the classification engines.

</details>

## Related parsnip functions

**These functions pair naturally with `show_engines()`** as you move from discovering an engine to fitting a model.

- `set_engine()`: attaches a chosen engine to a model specification.
- `set_mode()`: declares regression or classification for the spec.
- `show_model_info()`: prints the full argument and mode registry for a model.
- `translate()`: reveals the exact engine-level call parsnip will run.
- `required_pkgs()`: lists the packages an engine needs before fitting.

## FAQ

**What is the difference between show_engines() and set_engine()?**

`show_engines()` is read-only: it lists the engines available for a model type and returns a tibble. `set_engine()` is an action: it takes a model specification and one engine name, then returns an updated spec that will use that engine when fitted. You typically call `show_engines()` first to see your options, then call `set_engine()` once to commit. They are a discovery step followed by a configuration step.

**Why does show_engines() return an error instead of a tibble?**

The most common cause is passing an invalid model type. `show_engines()` expects an exact parsnip model function name as a string, such as `"linear_reg"` or `"rand_forest"`. Misspellings like `"linear_regression"` or unquoted names like `linear_reg` trigger an error. Check the spelling against the parsnip documentation, and always quote the argument.

**How do I see the default engine for a model?**

`show_engines()` lists engines but does not flag a default. To find the default, print the bare model specification, for example `linear_reg()`. parsnip shows the default engine in the printed output. For `linear_reg()` the default is `lm`, and for `rand_forest()` it is `ranger`. You can override it any time with `set_engine()`.

**Does show_engines() need the engine packages installed?**

No. `show_engines()` reads the internal parsnip engine registry, so it lists engines such as `glmnet` or `xgboost` whether or not those packages are installed. Installation only matters when you actually fit the model. Use `required_pkgs()` on a model specification to confirm which packages you still need to install.

**Can show_engines() list engines for every model type at once?**

No. `show_engines()` works on one model type per call. To survey several models, call it once per type and combine the results, for example with `purrr::map_dfr()` over a vector of model names. There is no single call that returns the entire registry as one tibble.
