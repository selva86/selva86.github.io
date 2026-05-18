---
title: "parsnip required_pkgs() in R: Find a Model's Packages"
slug: parsnip-required_pkgs-in-R
description: "Use parsnip required_pkgs() in R to list every package a model spec or fit needs. See worked examples, the infra argument, and how tidymodels uses it."
keywords: "parsnip required_pkgs, required_pkgs function R, parsnip required_pkgs examples, required_pkgs tidymodels, R model package dependencies, required_pkgs infra argument"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "required_pkgs()|parsnip required_pkgs|parsnip::required_pkgs()|required_pkgs|model package dependencies"
auto_link_case_sensitive: true
target_keyword: "parsnip required_pkgs"
sibling_block_enabled: true
difficulty: Beginner
---

# parsnip required_pkgs() in R: Find a Model's Packages

<p class="lead">The parsnip <code>required_pkgs()</code> function returns a character vector of every R package needed to fit and predict with a model specification or fitted model. It is how tidymodels knows which packages to load on parallel workers.</p>

[QUICK ANSWER]
required_pkgs(spec)                  # all packages a model spec needs
required_pkgs(spec, infra = FALSE)   # engine package only, drop parsnip
required_pkgs(fitted_model)          # packages for a fitted model object
required_pkgs(linear_reg())          # errors: engine not set
spec |> set_engine("ranger") |> required_pkgs()   # pipe-friendly form
generics::required_pkgs(spec)        # the S3 generic behind the method

[DECISION TREE: Is required_pkgs() the right tool?]
- list packages a model needs: required_pkgs(spec)
- see which engines exist: show_engines("rand_forest")
- view the engine's actual call: translate(spec)
- pull the underlying fitted model: extract_fit_engine(fit)
- check if a package is installed: rlang::is_installed("ranger")
- load packages on parallel workers: tune does this internally

## What required_pkgs() does

**required_pkgs() answers one question: what do I need installed to run this model?** You pass a parsnip model specification or a fitted model, and it returns the names of every package that fitting and prediction depend on. The result is a plain character vector, so it slots straight into `install.packages()` or a dependency check.

The function is an S3 method dispatched on the object class. parsnip registers methods for both `model_spec` (an unfitted specification) and `model_fit` (a fitted model). The underlying generic lives in the `generics` package, which is why recipes, workflows, and tune can all answer the same question for their own object types.

[KEY INSIGHT]
**required_pkgs() reads the parsnip registry, not your library.** It reports what a model *would* need, so it works even when the engine package is not installed yet. That is exactly what makes it useful for a pre-flight dependency check.

## Syntax and arguments

**The signature is short.** Both methods take the object plus one meaningful argument.

```r title="required_pkgs signature"
required_pkgs(x, infra = TRUE, ...)
```

| Argument | What it does |
|---|---|
| `x` | A parsnip `model_spec` or `model_fit` object |
| `infra` | If `TRUE` (default), include infrastructure packages such as `parsnip` itself |
| `...` | Unused; present for S3 method consistency |

Set `infra = FALSE` when you only care about the engine package and not the tidymodels plumbing. The model must have an engine assigned with `set_engine()` first, otherwise the function stops with an error.

## required_pkgs() examples

**Start with a model specification.** Load parsnip, build a spec, and ask for its packages. The `glmnet` engine pulls in the `glmnet` package alongside `parsnip`.

```r title="Packages for a model spec"
library(parsnip)

spec <- linear_reg() |>
  set_engine("glmnet")

required_pkgs(spec)
#> [1] "parsnip" "glmnet"
```

**Drop the infrastructure packages with infra = FALSE.** This leaves only the engine package, which is handy when you already know tidymodels is installed.

```r title="Engine package only"
required_pkgs(spec, infra = FALSE)
#> [1] "glmnet"
```

**A fitted model can report different packages.** Once you fit, the result reflects what prediction actually touches. Here the `lm` engine adds `stats`, the base package that powers it.

```r title="Packages for a fitted model"
fitted <- linear_reg() |>
  set_engine("lm") |>
  fit(mpg ~ ., data = mtcars)

required_pkgs(fitted)
#> [1] "parsnip" "stats"
```

**Compare several engines at once.** Because the result is a character vector, `lapply()` over a list of specs gives a tidy dependency map for a whole modeling workflow.

```r title="Compare packages across engines"
specs <- list(
  rf  = rand_forest(mode = "regression") |> set_engine("ranger"),
  xgb = boost_tree(mode = "regression")  |> set_engine("xgboost"),
  knn = nearest_neighbor(mode = "regression") |> set_engine("kknn")
)

lapply(specs, required_pkgs, infra = FALSE)
#> $rf
#> [1] "ranger"
#>
#> $xgb
#> [1] "xgboost"
#>
#> $knn
#> [1] "kknn"
```

None of these calls need the engine package installed. `required_pkgs()` only looks up the registered model definition, so you can audit dependencies before downloading a single package.

## required_pkgs() vs related parsnip helpers

**required_pkgs() is one of several model-inspection tools.** Each answers a different question about a spec or fit.

| Function | Returns | Use it to |
|---|---|---|
| `required_pkgs()` | character vector of package names | know what to install or load for a model |
| `show_engines()` | tibble of engines and modes | discover which engines a model supports |
| `translate()` | the literal engine function call | see the exact code parsnip will run |
| `extract_fit_engine()` | the raw fitted model object | reach the underlying engine output |

Reach for `required_pkgs()` when the question is about dependencies. Reach for `translate()` when the question is about the call parsnip generates. They complement each other during debugging.

[TIP]
**This is the function behind parallel tuning.** When `tune_grid()` or `fit_resamples()` runs across multiple cores, tune calls `required_pkgs()` to learn which packages each worker must load. If a parallel run fails with "could not find function", a manual `required_pkgs()` check usually shows the missing piece.

## Common pitfalls

**Calling it before set_engine() is the most frequent mistake.** A bare model spec has no engine, so parsnip cannot know the dependencies.

```r title="Pitfall: no engine set"
required_pkgs(linear_reg())
#> Error in `required_pkgs()`:
#> ! Please set an engine.
```

The fix is to pipe through `set_engine()` first. Second, remember that `required_pkgs()` does not check whether packages are installed. It only lists names. To verify availability, pass the result to `rlang::is_installed()` or wrap it in a `requireNamespace()` loop.

Third, the default `infra = TRUE` always includes `parsnip`. If you feed the output straight into a "missing engine packages" report, switch to `infra = FALSE` so tidymodels infrastructure does not show up as a dependency you need to chase.

## Try it yourself

**Try it:** Build a `boost_tree()` regression spec with the `xgboost` engine and list only its engine packages, excluding parsnip. Save the result to `ex_pkgs`.

```r title="Your turn: list engine packages"
# Try it: engine packages for an xgboost spec
ex_pkgs <- # your code here

ex_pkgs
#> Expected: "xgboost"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pkgs <- boost_tree(mode = "regression") |>
  set_engine("xgboost") |>
  required_pkgs(infra = FALSE)

ex_pkgs
#> [1] "xgboost"
```

**Explanation:** Setting `infra = FALSE` drops `parsnip` from the result, leaving just the engine package. The spec never has to be fitted, because `required_pkgs()` reads the registered model definition.

</details>

## Related parsnip functions

These functions pair naturally with `required_pkgs()` when inspecting or debugging a model:

- `show_engines()` lists every engine available for a model type.
- `set_engine()` assigns the engine that `required_pkgs()` reports on.
- `translate()` reveals the exact engine call parsnip builds.
- `extract_fit_engine()` returns the raw model object after fitting.
- `fit()` trains the spec so you can call `required_pkgs()` on the result.

## FAQ

**What does required_pkgs() return in R?**

It returns a character vector of package names. For a model specification, the vector lists every package needed to fit and predict with that model, including `parsnip` itself by default. For a fitted model, the vector reflects what prediction touches, which can differ slightly from the spec. The output is ordinary character data, so you can pass it to `install.packages()` or a dependency check directly.

**What is the infra argument in required_pkgs()?**

The `infra` argument controls whether infrastructure packages appear in the result. When `infra = TRUE`, the default, parsnip and other tidymodels plumbing packages are included. When `infra = FALSE`, only the engine package is returned, such as `glmnet` or `ranger`. Use `infra = FALSE` when you already know tidymodels is installed and only want to confirm the engine dependency.

**Does required_pkgs() install missing packages?**

No. The function only reports package names; it never downloads or attaches anything. It also works when the engine package is not installed, because it reads the parsnip model registry rather than your library. To act on the result, pass it to `rlang::is_installed()` to check availability or to `install.packages()` to fetch the missing ones.

**Why does required_pkgs() say "Please set an engine"?**

A parsnip model specification has no engine until you call `set_engine()`. Without an engine, parsnip cannot look up which package implements the model, so `required_pkgs()` stops with that error. Fix it by piping the spec through `set_engine()` before calling `required_pkgs()`, for example `linear_reg() |> set_engine("lm") |> required_pkgs()`.

**How does tidymodels use required_pkgs() for parallel processing?**

When the tune package runs `tune_grid()` or `fit_resamples()` across multiple workers, each worker is a fresh R process with nothing loaded. tune calls `required_pkgs()` on the model and recipe to learn which packages every worker needs, then loads them automatically. This is why parallel tidymodels runs usually work without you attaching engine packages by hand.
