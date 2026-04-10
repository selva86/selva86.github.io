---
title: "Run Multiple R Versions Side-by-Side (and Switch Without Breaking Anything)"
slug: "Multiple-R-Versions"
description: "Install and switch between multiple R versions on Windows, Mac, and Linux. Keep old projects working while using the latest R for new work."
keywords: "multiple R versions, R version manager, switch R versions, rig, installr, R side by side, R upgrade"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-fund-8"
post_type: "FR"
auto_link_terms: "multiple R versions|R version manager|switch R versions"
auto_link_case_sensitive: false
fr_parent: "Install-R-and-RStudio-2026.html"
---

# Run Multiple R Versions Side-by-Side (and Switch Without Breaking Anything)

<p class="lead">You can install multiple R versions on the same computer and switch between them. This lets you use the latest R for new projects while keeping an older version for existing work that depends on it.</p>

A new R version comes out every April. You want the new features, but updating might break packages your current project relies on. The solution: install both versions and switch as needed.

## Why You'd Need Multiple R Versions

```r
cat("Common scenarios:\n\n")
cat("1. UPGRADE SAFETY\n")
cat("   New R version released, but your thesis depends on R 4.3\n")
cat("   → Keep 4.3 for the thesis, install 4.4 for new work\n\n")

cat("2. PACKAGE COMPATIBILITY\n")
cat("   A critical package hasn't been updated for the latest R\n")
cat("   → Run that package on the old R, everything else on new\n\n")

cat("3. REPRODUCIBILITY\n")
cat("   Reviewer asks you to verify results with the exact R version\n")
cat("   → Install that specific version and re-run\n\n")

cat("4. TEAM ALIGNMENT\n")
cat("   Your team uses R 4.3, you have R 4.4\n")
cat("   → Match their version to avoid 'works on my machine' bugs\n")
```

## How R Versions Coexist

On all operating systems, each R version installs to its own directory. They don't overwrite each other:

```r
cat("=== Installation paths ===\n\n")

cat("Windows:\n")
cat("  C:/Program Files/R/R-4.3.3/\n")
cat("  C:/Program Files/R/R-4.4.2/\n\n")

cat("Mac:\n")
cat("  /Library/Frameworks/R.framework/Versions/4.3-arm64/\n")
cat("  /Library/Frameworks/R.framework/Versions/4.4-arm64/\n\n")

cat("Linux (Ubuntu, with rig):\n")
cat("  /opt/R/4.3.3/\n")
cat("  /opt/R/4.4.2/\n\n")

cat("Each version has its own:\n")
cat("  - R executable\n")
cat("  - Package library\n")
cat("  - Configuration files\n")
```

## Method 1: rig — The Best Tool (All Platforms)

**rig** (R Installation Manager) is the modern way to manage R versions. It works on Windows, Mac, and Linux:

```
# Install rig (one-time setup)

# Windows (PowerShell as admin):
# winget install posit.rig

# Mac (Homebrew):
# brew tap r-lib/rig
# brew install --cask rig

# Ubuntu/Debian:
# curl -Ls https://github.com/r-lib/rig/releases/download/latest/rig-linux-latest.tar.gz |
#   sudo tar xz -C /usr/local

# After installing rig:
rig list              # Show installed R versions
rig add 4.3           # Install R 4.3.x
rig add 4.4           # Install R 4.4.x
rig default 4.4       # Set default version
rig resolve 4.3       # Find exact version number
```

### Switching versions with rig

```r
cat("=== rig commands ===\n\n")

cat("rig list\n")
cat("  Shows all installed R versions\n")
cat("  * marks the default\n\n")

cat("rig default 4.3\n")
cat("  Sets R 4.3 as the default for new terminals\n\n")

cat("rig rstudio 4.3\n")
cat("  Opens RStudio using R 4.3 (instead of default)\n")
cat("  This is the killer feature — project-specific R versions!\n\n")

cat("rig add release\n")
cat("  Installs the latest stable R release\n\n")

cat("rig add devel\n")
cat("  Installs the development version of R\n")
```

## Method 2: Windows — Side-by-Side Installation

On Windows, you can install multiple R versions without any special tools:

```r
cat("=== Windows: Manual side-by-side ===\n\n")

cat("Step 1: Install R 4.3.3\n")
cat("  Download from CRAN, install to default path\n")
cat("  → C:/Program Files/R/R-4.3.3/\n\n")

cat("Step 2: Install R 4.4.2\n")
cat("  Download from CRAN, install to default path\n")
cat("  → C:/Program Files/R/R-4.4.2/\n")
cat("  Both versions now exist in C:/Program Files/R/\n\n")

cat("Step 3: Switch in RStudio\n")
cat("  Tools → Global Options → General → R version → Change\n")
cat("  Select the version you want → Restart RStudio\n\n")

cat("The installr package can automate upgrades:\n")
cat("  install.packages('installr')\n")
cat("  installr::updateR()  # Downloads and installs latest R\n")
```

## Method 3: Mac — Framework Versions

Mac's R installer places each version in a separate framework directory:

```r
cat("=== Mac: Side-by-side ===\n\n")

cat("Step 1: Download both .pkg installers from CRAN\n")
cat("Step 2: Install both — they go to separate directories\n\n")

cat("Step 3: Switch in RStudio\n")
cat("  RStudio → Preferences → General → R version → Change\n")
cat("  Select the version you want → Restart RStudio\n\n")

cat("Step 4: Switch on command line (optional)\n")
cat("  # Create a symbolic link to switch the default:\n")
cat("  sudo ln -sf /Library/Frameworks/R.framework/Versions/4.3-arm64 \\\n")
cat("    /Library/Frameworks/R.framework/Versions/Current\n\n")

cat("Recommended: Use rig instead — it handles all this automatically.\n")
```

## Method 4: Linux — Multiple Installs with rig

On Linux, managing multiple R versions without rig requires manual compilation. With rig, it's simple:

```r
cat("=== Linux: rig is essential ===\n\n")

cat("# Install multiple versions\n")
cat("sudo rig add 4.3\n")
cat("sudo rig add 4.4\n\n")

cat("# Each version gets its own directory:\n")
cat("# /opt/R/4.3.3/bin/R\n")
cat("# /opt/R/4.4.2/bin/R\n\n")

cat("# Switch default\n")
cat("sudo rig default 4.4\n\n")

cat("# Run a specific version directly\n")
cat("R-4.3    # Runs R 4.3\n")
cat("R-4.4    # Runs R 4.4\n")
```

## Managing Package Libraries

Each R version has its own package library. When you switch versions, packages from one version aren't automatically available in the other:

```r
# Check your current R version and library path
cat("R version:", R.version.string, "\n")
cat("Library path:", .libPaths(), "\n")

# See installed packages
pkgs <- installed.packages()
cat("Installed packages:", nrow(pkgs), "\n")
cat("First 10:", head(rownames(pkgs), 10), "\n")
```

### Reinstalling packages after upgrading

```r
cat("=== Package migration strategies ===\n\n")

cat("Strategy 1: Reinstall everything (cleanest)\n")
cat("  # On the OLD version, save package list:\n")
cat("  old_pkgs <- installed.packages()[, 'Package']\n")
cat("  saveRDS(old_pkgs, 'my_packages.rds')\n\n")
cat("  # On the NEW version, reinstall:\n")
cat("  old_pkgs <- readRDS('my_packages.rds')\n")
cat("  install.packages(old_pkgs)\n\n")

cat("Strategy 2: Shared library (risky)\n")
cat("  # Point both versions to the same library\n")
cat("  # .libPaths('/path/to/shared/library')\n")
cat("  # Warning: can cause compatibility issues\n\n")

cat("Strategy 3: renv per project (recommended)\n")
cat("  # Each project has its own package library\n")
cat("  # renv::init() in each project\n")
cat("  # Completely isolated — version switches are safe\n")
```

### renv: The Best Solution for Projects

```r
cat("=== renv: Project-level package management ===\n\n")

cat("# Initialize renv in a project:\n")
cat("# renv::init()\n\n")

cat("# renv creates a project-local library:\n")
cat("# project/renv/library/R-4.3/...\n\n")

cat("# Snapshot your packages:\n")
cat("# renv::snapshot()  → saves to renv.lock\n\n")

cat("# Restore on another machine (or after R upgrade):\n")
cat("# renv::restore()   → installs exact package versions from renv.lock\n\n")

cat("Benefits:\n")
cat("  - Each project is isolated\n")
cat("  - Switching R versions doesn't affect projects\n")
cat("  - renv.lock is a reproducible recipe\n")
cat("  - Collaborators get the exact same packages\n")
```

## Checking Your R Version

```r
# Multiple ways to check which R you're running
cat("R.version.string:", R.version.string, "\n")
cat("R.version$major:", R.version$major, "\n")
cat("R.version$minor:", R.version$minor, "\n")

# Check if a minimum version is met
required <- "4.1.0"
current <- paste(R.version$major, R.version$minor, sep = ".")
cat("\nCurrent version:", current, "\n")
cat("Required:", required, "\n")
cat("Meets requirement:", compareVersion(current, required) >= 0, "\n")
```

```r
# Useful for scripts that need a specific version
check_r_version <- function(min_version = "4.1.0") {
  current <- paste(R.version$major, R.version$minor, sep = ".")
  if (compareVersion(current, min_version) < 0) {
    stop(paste("This script requires R >=", min_version,
               "but you have R", current))
  }
  cat("R version check passed:", current, ">=", min_version, "\n")
}

check_r_version("4.0.0")
```

## When to Upgrade R

```r
cat("=== R release cycle ===\n\n")

cat("Major releases (4.x.0): Every April\n")
cat("  - May contain breaking changes\n")
cat("  - Packages may need updates\n")
cat("  - Wait 2-4 weeks for package ecosystem to catch up\n\n")

cat("Patch releases (4.x.y): Throughout the year\n")
cat("  - Bug fixes only\n")
cat("  - Safe to update immediately\n")
cat("  - Packages remain compatible\n\n")

cat("Recommendation:\n")
cat("  1. Update patch releases immediately\n")
cat("  2. Wait 2-4 weeks after major releases\n")
cat("  3. Keep the old version until your key packages work on the new one\n")
cat("  4. Use renv for projects that must be reproducible\n")
```

## Practice Exercises

### Exercise 1: Version Check Script

```r
# Exercise: Write a function that:
# 1. Prints the current R version
# 2. Checks if the native pipe |> is available (requires R >= 4.1)
# 3. Checks if the lambda syntax \(x) is available (requires R >= 4.1)
# 4. Reports which features are available

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
check_features <- function() {
  ver <- paste(R.version$major, R.version$minor, sep = ".")
  cat("R version:", ver, "\n\n")

  # Native pipe |> (R 4.1+)
  has_pipe <- compareVersion(ver, "4.1.0") >= 0
  cat("Native pipe |>:", if (has_pipe) "Available" else "Not available", "\n")

  # Lambda \(x) syntax (R 4.1+)
  has_lambda <- compareVersion(ver, "4.1.0") >= 0
  cat("Lambda \\(x):", if (has_lambda) "Available" else "Not available", "\n")

  # Underscore placeholder _ (R 4.2+)
  has_placeholder <- compareVersion(ver, "4.2.0") >= 0
  cat("Pipe placeholder _:", if (has_placeholder) "Available" else "Not available", "\n")

  # Raw string literals r"(...)" (R 4.0+)
  has_raw_string <- compareVersion(ver, "4.0.0") >= 0
  cat("Raw strings r\"(...)\":", if (has_raw_string) "Available" else "Not available", "\n")
}

check_features()
```

**Explanation:** `compareVersion()` compares version strings correctly (it knows "4.10" > "4.9"). Each R feature was introduced in a specific version — this function checks which ones are available in your current installation.

</details>

### Exercise 2: Package Inventory

```r
# Exercise: Write a script that creates a "package backup" — a data frame
# listing all installed packages with their versions and source (CRAN/other).
# This is what you'd save before upgrading R.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
pkg_info <- installed.packages()

backup <- data.frame(
  package = pkg_info[, "Package"],
  version = pkg_info[, "Version"],
  priority = pkg_info[, "Priority"],
  stringsAsFactors = FALSE
)

# Separate base/recommended from user-installed
backup$type <- ifelse(
  is.na(backup$priority), "user-installed",
  backup$priority
)

cat("Package inventory:\n")
cat("  Base packages:", sum(backup$type == "base"), "\n")
cat("  Recommended:", sum(backup$type == "recommended"), "\n")
cat("  User-installed:", sum(backup$type == "user-installed"), "\n")
cat("  Total:", nrow(backup), "\n\n")

# Show user-installed packages (these need reinstalling after upgrade)
user_pkgs <- backup[backup$type == "user-installed", ]
cat("User-installed packages (first 15):\n")
print(head(user_pkgs[, c("package", "version")], 15))

# To save: saveRDS(user_pkgs$package, "my_packages.rds")
```

**Explanation:** `installed.packages()` returns a matrix with all package metadata. Base and recommended packages come with R — you only need to reinstall "user-installed" ones after upgrading. Saving this list before upgrading lets you restore your setup quickly.

</details>

## Summary

| Method | Platform | Best for |
|--------|----------|----------|
| **rig** | All | Modern, recommended approach |
| Manual side-by-side | Windows | Simple, no extra tools |
| RStudio version selector | All | Quick switching without terminal |
| **renv** | All | Project-level package isolation |

**The recommended workflow:**
1. Install **rig** for managing R versions
2. Use **renv** for project-level package isolation
3. Keep one version behind for critical projects
4. Wait 2-4 weeks after major releases before upgrading

## FAQ

### Do I need to reinstall all packages when I upgrade R?

For **minor** upgrades (4.3.2 → 4.3.3): no, packages are compatible. For **major** upgrades (4.3 → 4.4): usually yes, especially packages that contain compiled C/C++ code. The safest approach is to save your package list, upgrade, and reinstall.

### Can RStudio use different R versions for different projects?

Not natively per-project, but with **rig** you can run `rig rstudio 4.3` to open RStudio with a specific R version. Or use RStudio's global setting: **Tools → Global Options → General → R version**.

### What's the difference between rig and renv?

**rig** manages R versions (the engine). **renv** manages packages (the libraries). They work together: rig switches R versions, renv ensures each project has the right packages for its R version.

### Will my old scripts break on a new R version?

Usually no. R is very backwards-compatible. The most common breaking changes involve: (1) `stringsAsFactors` defaulting to FALSE in R 4.0, (2) new pipe `|>` syntax in R 4.1, (3) changes in default random number generation. Check the R NEWS file for specific version changes.

### How do I check which R version a project was built with?

If the project uses renv, check `renv.lock` — it records the R version. Otherwise, look for `sessionInfo()` output in reports or README files.

## Continue Learning

Version management is part of the broader reproducibility toolkit:

1. **Positron vs RStudio** — the new IDE alternative
2. **R Project Structure** — organize your R projects properly
3. **renv and Reproducibility** — lock down package versions for reproducible research
