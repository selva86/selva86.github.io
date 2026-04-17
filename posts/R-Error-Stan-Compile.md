---
title: "RStan 'failed to compile' Error, Every Known Fix in One Place"
slug: "R-Error-Stan-Compile"
description: "RStan's 'failed to compile' error is almost always a C++ toolchain problem, not your model. Diagnose, fix Rtools/Xcode, align versions, or switch to cmdstanr."
keywords: "RStan failed to compile, RStan compile error, Stan model won't compile, RStan Rtools44, RStan Makevars, RStan CXX17, RStan StanHeaders mismatch, cmdstanr alternative"
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR20"
post_type: "FR"
auto_link_terms: "RStan failed to compile|Stan failed to compile|RStan compile error|rstan::stan_model()|cmdstanr"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# RStan 'failed to compile' Error, Every Known Fix in One Place

<p class="lead">RStan's <code>failed to compile</code> error almost never comes from your Stan code, it comes from the C++ toolchain RStan uses to turn your model into a shared library. Fix the toolchain and the error disappears.</p>

## What does RStan's 'failed to compile' error actually mean?

Before chasing fixes, pin down *what* RStan is trying to do when it fails. RStan compiles your Stan code into C++, then hands that C++ to a system compiler, g++ on Linux/Mac, the Rtools toolchain on Windows, which turns it into a shared library R can load. The error is the compiler refusing that handoff. A 20-second diagnostic tells you which of the three links is broken.

Here's a self-contained `diagnose_rstan_toolchain()` helper you can drop into any R session. It inspects the five things that fail most often and returns a PASS/FAIL report:

```r
diagnose_rstan_toolchain <- function() {
  checks <- list()

  checks$r_version <- paste0(R.version$major, ".", R.version$minor)
  checks$r_ok <- as.numeric(R.version$major) >= 4

  checks$os <- .Platform$OS.type
  checks$make_found <- nzchar(Sys.which("make"))

  makevars_file <- if (.Platform$OS.type == "windows") "Makevars.win" else "Makevars"
  checks$makevars_path <- file.path(Sys.getenv("HOME"), ".R", makevars_file)
  checks$makevars_exists <- file.exists(checks$makevars_path)

  checks$rstan_installed <- "rstan" %in% rownames(installed.packages())
  checks$stanheaders_installed <- "StanHeaders" %in% rownames(installed.packages())

  checks
}

diag <- diagnose_rstan_toolchain()
diag
#> $r_version
#> [1] "4.4"
#>
#> $r_ok
#> [1] TRUE
#>
#> $os
#> [1] "windows"
#>
#> $make_found
#> [1] TRUE
#>
#> $makevars_path
#> [1] "C:/Users/you/Documents/.R/Makevars.win"
#>
#> $makevars_exists
#> [1] TRUE
```

Read the report top-to-bottom. Any `FALSE` points at the exact link in the chain that's broken: `make_found = FALSE` means no compiler on the PATH (install Rtools / Xcode); `makevars_exists = FALSE` with a modern RStan means no CXX17 flags; missing packages mean a clean reinstall is overdue. The sections below map each failure mode to its fix.

[NOTE]
**Run the install and toolchain commands in your own R session.** The interactive blocks on this page execute pure R diagnostics, but `install.packages()`, `remove.packages()`, and anything that touches Rtools or Xcode modify your local machine and must be run in your desktop R or RStudio.

![How RStan compiles a model](screenshots/R-Error-Stan-Compile-pipeline.webp)

*Figure 1: How RStan turns your model into an executable, and where each compile failure happens.*

[KEY INSIGHT]
**The compile error lies about its source.** The stack trace points at your Stan model, but the real failure is almost always one layer down, in the C++ codegen, the system compiler, or the shared-library loader. Fix the environment, not the model.

**Try it:** Extend `diagnose_rstan_toolchain()` so it also reports the installed `StanHeaders` version (or "not installed"). Use `packageVersion()` inside a `tryCatch()`.

```r
# Try it: add a stanheaders_version field to the checks list
ex_diag <- function() {
  checks <- diagnose_rstan_toolchain()
  # your code here: add checks$stanheaders_version
  checks
}

ex_diag()$stanheaders_version
#> Expected: "2.32.6"  (or similar), or "not installed"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_diag <- function() {
  checks <- diagnose_rstan_toolchain()
  checks$stanheaders_version <- tryCatch(
    as.character(packageVersion("StanHeaders")),
    error = function(e) "not installed"
  )
  checks
}

ex_diag()$stanheaders_version
#> [1] "not installed"
```

**Explanation:** `packageVersion()` errors if the package isn't installed, so wrapping it in `tryCatch()` lets you return a readable fallback instead of crashing the diagnostic.

</details>

## How do you fix it on Windows (Rtools + Makevars)?

Windows is where most compile failures happen, and the cause is almost always the same: Rtools isn't installed, isn't on the PATH, or the `Makevars.win` file still has CXX14 flags from an old RStan release. Fixing this is a three-minute job if you do it in order.

Start by checking whether Rtools is even reachable. `Sys.which("make")` returns an empty string when it isn't, and `pkgbuild::has_build_tools()` is the robust alternative if you have `pkgbuild` installed:

```r
# Works on any R install — returns "" if make is missing
make_path <- Sys.which("make")
rtools_ok <- nzchar(make_path)

list(make_path = unname(make_path), rtools_ok = rtools_ok)
#> $make_path
#> [1] ""
#>
#> $rtools_ok
#> [1] FALSE
```

An empty `make_path` means "no Rtools". Install it from [cran.r-project.org/bin/windows/Rtools](https://cran.r-project.org/bin/windows/Rtools/), pick the version matching your R (Rtools44 for R 4.4.x, Rtools45 for R 4.5.x) and take the default install options. **Restart R fully** after the install completes, a workspace clear is not enough, the PATH changes only reach R on a fresh process.

With Rtools present, the next failure mode is `Makevars.win`. Modern RStan (2.26+) requires C++17; a `.R/Makevars.win` file left over from RStan 2.21 will still have `CXX14FLAGS` lines and break the build. Here's a known-good template, the block is a plain character vector you can write to disk with `writeLines()`:

```r
makevars_win <- c(
  "CXX17FLAGS = -O3 -mtune=native -mmmx -msse -msse2 -mssse3 -mfpmath=sse",
  "CXX17 = $(BINPREF)g++ -m$(WIN) -std=c++17",
  "CXX17STD = -std=c++17"
)

cat(makevars_win, sep = "\n")
#> CXX17FLAGS = -O3 -mtune=native -mmmx -msse -msse2 -mssse3 -mfpmath=sse
#> CXX17 = $(BINPREF)g++ -m$(WIN) -std=c++17
#> CXX17STD = -std=c++17
```

In your local R session, write that to disk with `writeLines(makevars_win, file.path(Sys.getenv("HOME"), ".R", "Makevars.win"))`, the `.R` directory must already exist, so create it first with `dir.create(..., showWarnings = FALSE)`. Restart R once more and try compiling.

[WARNING]
**A stale `.Rprofile` with a `BINPREF` entry silently breaks R 4.x installs.** If you installed RStan under R 3.6 years ago, your `~/.Rprofile` may still set `BINPREF` to a path that no longer exists. The symptom is a compile error that ignores your new Makevars entirely. Open `~/.Rprofile`, remove any `BINPREF` lines, and restart R.

**Try it:** Modify `makevars_win` so the first line uses `-O2 -mtune=native` instead of the full optimization flag list. This is a safer default for older laptops that crash during heavy optimization.

```r
# Try it: build ex_makevars with a tamer first line
ex_makevars <- c(
  # your code here: replace the CXX17FLAGS line
  "CXX17 = $(BINPREF)g++ -m$(WIN) -std=c++17",
  "CXX17STD = -std=c++17"
)

ex_makevars[1]
#> Expected: "CXX17FLAGS = -O2 -mtune=native"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_makevars <- c(
  "CXX17FLAGS = -O2 -mtune=native",
  "CXX17 = $(BINPREF)g++ -m$(WIN) -std=c++17",
  "CXX17STD = -std=c++17"
)

ex_makevars[1]
#> [1] "CXX17FLAGS = -O2 -mtune=native"
```

**Explanation:** `-O2` is the GCC "reasonable optimization" level, it turns on most useful optimizations without the aggressive inlining that `-O3` adds. For slow or memory-constrained machines, `-O2` compiles faster and uses less RAM with negligible runtime cost.

</details>

## How do you fix it on macOS (Xcode + clang)?

Mac failures come in two flavours: missing Xcode Command Line Tools (easy), and Apple's bundled clang rejecting OpenMP flags (annoying). Both are solvable, but the fix depends on whether you're on Intel or Apple Silicon.

First, detect your architecture so you write the right paths. R exposes it via `R.version$arch`:

```r
mac_arch <- R.version$arch
mac_makevars_path <- file.path(Sys.getenv("HOME"), ".R", "Makevars")

list(arch = mac_arch, makevars_path = mac_makevars_path)
#> $arch
#> [1] "aarch64"
#>
#> $makevars_path
#> [1] "/Users/you/.R/Makevars"
```

`aarch64` means Apple Silicon (M1/M2/M3/M4); `x86_64` means Intel. The official [R Project macOS tools page](https://mac.r-project.org/tools/) ships a custom clang + gfortran bundle that includes OpenMP support. Install it first, then point `Makevars` at the new compilers:

```r
# A complete arm64 Makevars block that routes around Apple clang
makevars_mac <- c(
  "CC = /opt/R/arm64/bin/clang",
  "CXX = /opt/R/arm64/bin/clang++",
  "CXX17 = /opt/R/arm64/bin/clang++",
  "CXX17FLAGS = -O3 -arch arm64",
  "CXX17STD = -std=c++17"
)

cat(makevars_mac, sep = "\n")
#> CC = /opt/R/arm64/bin/clang
#> CXX = /opt/R/arm64/bin/clang++
#> CXX17 = /opt/R/arm64/bin/clang++
#> CXX17FLAGS = -O3 -arch arm64
#> CXX17STD = -std=c++17
```

For Intel Macs, swap `/opt/R/arm64/` for `/opt/R/x86_64/` and `arm64` for `x86_64`. That's the only difference.

[TIP]
**Start with `xcode-select --install` before anything else.** It's a 2-minute fix that resolves roughly a third of Mac compile errors, the ones where Xcode Command Line Tools were never installed or got nuked by a macOS upgrade. Only install the R Project toolchain if the Xcode approach still fails.

**Try it:** Write a function `ex_mac_makevars(arch)` that returns the right Makevars block for either `"arm64"` or `"x86_64"`. Use `sub()` to swap the architecture in the paths.

```r
# Try it: parameterize the Mac Makevars template by architecture
ex_mac_makevars <- function(arch) {
  # your code here: return a character vector like makevars_mac
}

ex_mac_makevars("x86_64")
#> Expected: a vector with "/opt/R/x86_64/bin/clang" etc.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mac_makevars <- function(arch) {
  stopifnot(arch %in% c("arm64", "x86_64"))
  c(
    paste0("CC = /opt/R/", arch, "/bin/clang"),
    paste0("CXX = /opt/R/", arch, "/bin/clang++"),
    paste0("CXX17 = /opt/R/", arch, "/bin/clang++"),
    paste0("CXX17FLAGS = -O3 -arch ", arch),
    "CXX17STD = -std=c++17"
  )
}

ex_mac_makevars("x86_64")
#> [1] "CC = /opt/R/x86_64/bin/clang"
#> [2] "CXX = /opt/R/x86_64/bin/clang++"
#> [3] "CXX17 = /opt/R/x86_64/bin/clang++"
#> [4] "CXX17FLAGS = -O3 -arch x86_64"
#> [5] "CXX17STD = -std=c++17"
```

**Explanation:** `paste0()` builds each line by gluing the architecture into the path template. `stopifnot()` guards the input so a typo like `"intel"` fails loudly instead of producing garbage.

</details>

## How do you fix RStan and StanHeaders version mismatches?

Once Rtools and Makevars are in order, the next most common failure is a version skew between `rstan` and `StanHeaders`. They ship from the same release cycle and rely on matching template code, so an `rstan` that's a release ahead will reference symbols the older `StanHeaders` never heard of, producing confusing C++ errors about missing templates and namespace members.

Start with a version check. Major.minor should match, the patch digit can differ:

```r
rstan_ver <- tryCatch(packageVersion("rstan"), error = function(e) NULL)
sh_ver    <- tryCatch(packageVersion("StanHeaders"), error = function(e) NULL)

match_ok <- !is.null(rstan_ver) && !is.null(sh_ver) &&
  identical(rstan_ver[,1:2], sh_ver[,1:2])

list(rstan = as.character(rstan_ver),
     stanheaders = as.character(sh_ver),
     match_ok = match_ok)
#> $rstan
#> character(0)
#>
#> $stanheaders
#> character(0)
#>
#> $match_ok
#> [1] FALSE
```

A `match_ok = FALSE` or an empty version string means you need a clean reinstall. The official recipe is four steps: remove both packages, **restart R completely**, reinstall from the stan-dev r-universe (which always ships the coordinated release), and verify by compiling a trivial model.

```r
# Run these four steps in your LOCAL R session, not here
remove.packages(c("rstan", "StanHeaders"))

# --- Restart R now. Session > Restart R in RStudio. ---

install.packages(
  "rstan",
  repos = c("https://stan-dev.r-universe.dev", getOption("repos"))
)

# Verify with a one-line model
rstan::stan_model(model_code = "parameters { real y; } model { y ~ normal(0,1); }")
```

If the trivial model compiles, every real model you already wrote will too. If it still fails, the toolchain is still wrong, loop back to the Rtools or Mac sections.

[NOTE]
**RStan 2.32+ requires C++17.** Older tutorials still reference `CXX14FLAGS` in `Makevars`. Those flags will not only be ignored, on some compilers they trigger silent fallbacks that cause opaque errors. Replace every `CXX14` line with a `CXX17` equivalent.

**Try it:** Extend the version check to also verify `BH` and `RcppEigen` are installed. These are upstream dependencies of StanHeaders and a missing one produces a compile error that looks identical to a version mismatch.

```r
# Try it: build ex_deps with four version fields
ex_deps <- list(
  rstan = as.character(packageVersion("rstan")),
  stanheaders = as.character(packageVersion("StanHeaders"))
  # your code here: add BH and RcppEigen
)

names(ex_deps)
#> Expected: c("rstan", "stanheaders", "BH", "rcppeigen")
```

<details>
<summary>Click to reveal solution</summary>

```r
safe_ver <- function(pkg) {
  tryCatch(as.character(packageVersion(pkg)), error = function(e) "not installed")
}

ex_deps <- list(
  rstan = safe_ver("rstan"),
  stanheaders = safe_ver("StanHeaders"),
  BH = safe_ver("BH"),
  rcppeigen = safe_ver("RcppEigen")
)

names(ex_deps)
#> [1] "rstan"       "stanheaders" "BH"          "rcppeigen"
```

**Explanation:** Wrapping `packageVersion()` in a helper avoids the same `tryCatch()` boilerplate for every package. A missing `BH` or `RcppEigen` is easy to miss because the compiler error blames Stan, not Boost.

</details>

## When should you switch to cmdstanr instead?

After three toolchain fights in a row, most Stan users eventually ask whether there's a less fragile R interface. The answer is `cmdstanr`. It talks to `CmdStan`, Stan's command-line interface, so it skips the Rcpp/StanHeaders compile dance entirely and just needs a working C++ compiler on the PATH. The Stan Development Team now recommends it as the primary R interface for new projects.

Installation is a one-time ritual: install the R package, then call `install_cmdstan()` to download and build CmdStan itself (takes a few minutes, no further config):

```r
# Run in your LOCAL R session
install.packages(
  "cmdstanr",
  repos = c("https://stan-dev.r-universe.dev", getOption("repos"))
)

library(cmdstanr)
install_cmdstan()              # One-time, downloads and builds CmdStan
check_cmdstan_toolchain()      # Should print "The C++ toolchain required for CmdStan is setup properly!"

stan_code <- "parameters { real y; } model { y ~ normal(0,1); }"
mod <- cmdstan_model(write_stan_file(stan_code))
fit <- mod$sample(chains = 1, iter_sampling = 100, refresh = 0)
fit$summary()
#> # A tibble: 2 × 10
#>   variable  mean median    sd   mad    q5   q95  rhat ess_bulk ess_tail
#>   <chr>    <dbl>  <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>    <dbl>    <dbl>
#> 1 lp__     -0.50 -0.22  0.72  0.31 -2.01 -0.00  1.00     42.1     56.7
#> 2 y         0.03  0.04  1.03  1.02 -1.68  1.74  1.00     59.2     68.3
```

A successful `fit$summary()` proves the entire toolchain is working and you can stop debugging RStan. Here's how the two interfaces compare day-to-day:

```r
iface_compare <- data.frame(
  feature = c("Install complexity",
              "Recompile after Stan upgrade",
              "Posterior handling",
              "Recommended by Stan team",
              "Active bug fixes"),
  rstan   = c("High (Rcpp + toolchain)",
              "Yes",
              "Built-in stanfit",
              "Maintenance mode",
              "Slow"),
  cmdstanr = c("Low (just CmdStan + g++)",
               "No (just rebuild CmdStan)",
               "posterior + draws objects",
               "Yes (primary)",
               "Fast")
)

iface_compare
#>                      feature                     rstan                  cmdstanr
#> 1         Install complexity   High (Rcpp + toolchain)  Low (just CmdStan + g++)
#> 2 Recompile after Stan upgrade                       Yes No (just rebuild CmdStan)
#> 3         Posterior handling          Built-in stanfit posterior + draws objects
#> 4     Recommended by Stan team         Maintenance mode             Yes (primary)
#> 5            Active bug fixes                      Slow                      Fast
```

For new projects and when RStan keeps fighting you, `cmdstanr` is the better default. For legacy codebases with deep `stanfit` coupling, fix RStan once and ride it out.

[TIP]
**`cmdstanr::check_cmdstan_toolchain()` is the single most useful diagnostic in the Stan ecosystem.** Run it anytime you suspect a broken install, it prints exactly which part of the toolchain is missing and how to fix it, and it works identically on Windows, Mac, and Linux.

**Try it:** Write a one-liner `ex_toolchain_ok` that runs `check_cmdstan_toolchain()` inside `tryCatch()` and returns `TRUE` on success, `FALSE` otherwise. This is the canonical gate for CI scripts that need Stan.

```r
# Try it: boolean wrapper around check_cmdstan_toolchain()
ex_toolchain_ok <- function() {
  # your code here
}

ex_toolchain_ok()
#> Expected: TRUE on a healthy install, FALSE otherwise
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_toolchain_ok <- function() {
  if (!requireNamespace("cmdstanr", quietly = TRUE)) return(FALSE)
  tryCatch({
    cmdstanr::check_cmdstan_toolchain(quiet = TRUE)
    TRUE
  }, error = function(e) FALSE)
}

ex_toolchain_ok()
#> [1] FALSE
```

**Explanation:** `check_cmdstan_toolchain(quiet = TRUE)` errors when the toolchain is broken, so a `tryCatch()` wrapper turns it into a clean boolean. Checking `requireNamespace()` first avoids a hard error if cmdstanr isn't installed.

</details>

## Practice Exercises

### Exercise 1: Build a `fix_stan_toolchain()` orchestrator

Write a function that detects the OS, prints the correct Makevars path for that OS, and returns a named list of action items based on which diagnostics pass. Combine `diagnose_rstan_toolchain()` from the first section with the OS-specific Makevars path logic.

```r
# Exercise: end-to-end diagnostic that outputs concrete next steps
# Hint: reuse diagnose_rstan_toolchain() and branch on diag$os

fix_stan_toolchain <- function() {
  # Write your code below:

}

my_actions <- fix_stan_toolchain()
print(my_actions)
```

<details>
<summary>Click to reveal solution</summary>

```r
fix_stan_toolchain <- function() {
  diag <- diagnose_rstan_toolchain()

  actions <- character(0)
  if (!diag$make_found) {
    if (diag$os == "windows") {
      actions <- c(actions, "Install Rtools from cran.r-project.org/bin/windows/Rtools/")
    } else {
      actions <- c(actions, "Run: xcode-select --install (Mac) or apt install build-essential (Linux)")
    }
  }
  if (!diag$makevars_exists) {
    actions <- c(actions, paste0("Create a CXX17 Makevars at: ", diag$makevars_path))
  }
  if (!diag$rstan_installed || !diag$stanheaders_installed) {
    actions <- c(actions,
      "Install from stan-dev r-universe: install.packages('rstan', repos = c('https://stan-dev.r-universe.dev', getOption('repos')))")
  }
  if (length(actions) == 0) actions <- "Toolchain looks healthy. Retry your compile."

  list(os = diag$os,
       makevars_path = diag$makevars_path,
       actions = actions)
}

my_actions <- fix_stan_toolchain()
print(my_actions)
#> $os
#> [1] "windows"
#>
#> $makevars_path
#> [1] "C:/Users/you/Documents/.R/Makevars.win"
#>
#> $actions
#> [1] "Create a CXX17 Makevars at: C:/Users/you/Documents/.R/Makevars.win"
```

**Explanation:** The orchestrator reuses the diagnostic from the first section, translates each `FALSE` into a concrete next step, and special-cases the Makevars path per OS. That's the whole "which fix do I try first?" decision tree in ~15 lines.

</details>

### Exercise 2: Compare RStan and cmdstanr on the same model

Write a function that compiles the same trivial Stan model with both interfaces, catches any errors, and returns a tibble-like comparison with success status and compile time in seconds. This mirrors a real-world decision: "which interface actually works on my machine right now?"

```r
# Exercise: benchmark both interfaces side by side
# Hint: wrap each compile in system.time() + tryCatch()

compare_stan_interfaces <- function(model_code) {
  # Write your code below:

}

my_comparison <- compare_stan_interfaces("parameters { real y; } model { y ~ normal(0,1); }")
print(my_comparison)
```

<details>
<summary>Click to reveal solution</summary>

```r
compare_stan_interfaces <- function(model_code) {
  time_rstan <- NA_real_
  ok_rstan <- FALSE
  time_cmdstan <- NA_real_
  ok_cmdstan <- FALSE

  if (requireNamespace("rstan", quietly = TRUE)) {
    t <- tryCatch(system.time(rstan::stan_model(model_code = model_code))[["elapsed"]],
                  error = function(e) NA_real_)
    time_rstan <- t
    ok_rstan <- !is.na(t)
  }

  if (requireNamespace("cmdstanr", quietly = TRUE)) {
    t <- tryCatch({
      f <- cmdstanr::write_stan_file(model_code)
      system.time(cmdstanr::cmdstan_model(f))[["elapsed"]]
    }, error = function(e) NA_real_)
    time_cmdstan <- t
    ok_cmdstan <- !is.na(t)
  }

  data.frame(
    interface = c("rstan", "cmdstanr"),
    success = c(ok_rstan, ok_cmdstan),
    compile_seconds = c(time_rstan, time_cmdstan)
  )
}

my_comparison <- compare_stan_interfaces("parameters { real y; } model { y ~ normal(0,1); }")
print(my_comparison)
#>   interface success compile_seconds
#> 1     rstan   FALSE              NA
#> 2  cmdstanr   FALSE              NA
```

**Explanation:** `system.time()` returns elapsed seconds and `tryCatch()` converts any compile failure into `NA`. The result is a two-row data frame you can read at a glance: if one row has `success = TRUE` and the other doesn't, you already know which interface to use.

</details>

## Complete Example

Here's the canonical end-to-end fix for the most common scenario: Windows, R 4.4+, RStan has never compiled on this machine. You can run the diagnostic pieces here; run the install commands in your local R.

Step 1, snapshot the current state with the diagnostic helper:

```r
demo_model_code <- "parameters { real y; } model { y ~ normal(0, 1); }"

diag <- diagnose_rstan_toolchain()
diag$os
#> [1] "windows"
diag$make_found
#> [1] TRUE
diag$makevars_exists
#> [1] FALSE
```

A missing Makevars is the issue. Build the template in memory so you see exactly what will be written:

```r
makevars_win <- c(
  "CXX17FLAGS = -O3 -mtune=native",
  "CXX17 = $(BINPREF)g++ -m$(WIN) -std=c++17",
  "CXX17STD = -std=c++17"
)
cat(makevars_win, sep = "\n")
#> CXX17FLAGS = -O3 -mtune=native
#> CXX17 = $(BINPREF)g++ -m$(WIN) -std=c++17
#> CXX17STD = -std=c++17
```

Step 2, in your local R session, commit the template to disk, remove the old RStan stack, restart R, and reinstall from the coordinated release channel:

```r
# --- Local R session only ---
dir.create(file.path(Sys.getenv("HOME"), ".R"), showWarnings = FALSE)
writeLines(makevars_win,
           file.path(Sys.getenv("HOME"), ".R", "Makevars.win"))

remove.packages(c("rstan", "StanHeaders"))
# Session > Restart R (RStudio), or quit and relaunch R.

install.packages(
  "rstan",
  repos = c("https://stan-dev.r-universe.dev", getOption("repos"))
)
```

Step 3, verify with the trivial model. If this compiles, you're done:

```r
# Local R session only
demo_mod <- rstan::stan_model(model_code = demo_model_code)
class(demo_mod)
#> [1] "stanmodel"
#> attr(,"package")
#> [1] "rstan"
```

A `stanmodel` class means the compile succeeded end-to-end. Your real models will now compile with the same toolchain, the only thing left is whatever inference work the model itself needs.

## Summary

![Pick your fix](screenshots/R-Error-Stan-Compile-decision-tree.webp)

*Figure 2: Decision flow for picking the right fix based on error symptom and operating system.*

The decision tree above captures the whole "which fix do I try first?" process. The table below maps the symptom you see in the R console to the root cause and the fix that resolves it:

| Symptom | Likely cause | Fix |
|---|---|---|
| `make: command not found` | No Rtools / no Xcode CLT | Install Rtools44/45 or run `xcode-select --install` |
| `CXX14 not defined` | Old Makevars from pre-2.26 RStan | Replace with the CXX17 template |
| Template / namespace errors | Version mismatch between rstan and StanHeaders | Clean reinstall from stan-dev r-universe |
| `unsupported option '-fopenmp'` | Apple clang on macOS | Install the R Project macOS toolchain |
| Error persists after fix | Stale cache or missed R restart | Restart R, clear `~/.cache/stan`, retry |
| Fragile across upgrades | Rcpp/StanHeaders fragility | Switch to cmdstanr |

Three mental models to take away: (1) the compile error lies about its source, always suspect the toolchain before the Stan code; (2) R restarts are load-bearing, skipping one turns a valid fix into a ghost bug; (3) cmdstanr sidesteps most of this class of problem entirely.

## References

1. Stan Development Team, *RStan Getting Started Wiki*. [Link](https://github.com/stan-dev/rstan/wiki/RStan-Getting-Started)
2. Stan Development Team, *Configuring C++ Toolchain for Windows*. [Link](https://github.com/stan-dev/rstan/wiki/Configuring-C---Toolchain-for-Windows)
3. Stan Development Team, *Configuring C++ Toolchain for Mac*. [Link](https://github.com/stan-dev/rstan/wiki/Configuring-C---Toolchain-for-Mac)
4. CRAN, *Rtools for Windows (Rtools44 / Rtools45 downloads)*. [Link](https://cran.r-project.org/bin/windows/Rtools/)
5. Simon Urbanek, *R for macOS Developers (toolchain downloads)*. [Link](https://mac.r-project.org/tools/)
6. Stan Development Team, *cmdstanr: R interface to CmdStan*. [Link](https://mc-stan.org/cmdstanr/)
7. Stan Forums, *Error when Configuring RStan C++ toolchain*. [Link](https://discourse.mc-stan.org/t/error-when-configuring-rstan-c-toolchain/17915)
8. stan-dev/rstan Issue #1129, *Cannot install rstan on R 4.5.0 with Rtools44*. [Link](https://github.com/stan-dev/rstan/issues/1129)

## Continue Learning

- [50 R Errors Decoded: Plain-English Explanations and Exact Fixes](/R-Common-Errors.html), The parent reference that lists all 50 common R error messages with short fixes.
- [R Debugging Tools: browser(), debug(), trace()](/R-Debugging.html), Once your toolchain is fixed, these are the tools you reach for when the model compiles but behaves badly.
- [Install R and RStudio (2026 Edition)](/Install-R-and-RStudio-2026.html), Get the base environment right before you layer RStan or cmdstanr on top.
