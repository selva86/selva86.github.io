# Plan: R Error: 'no package called X' — Every Possible Cause and Fix

## Frontmatter

| Field | Value |
|---|---|
| title | R Error: 'no package called X' — Every Possible Cause and Fix |
| slug | R-Error-No-Package |
| description | The package exists but R can't find it — 6 reasons why. Failed installs, wrong .libPaths(), Bioconductor & GitHub-only packages, R upgrade fixes. |
| keywords | R error no package called, there is no package called R, R install package failed, R libPaths, BiocManager install, install_github R, R package not found, R library path mismatch |
| auto_link_terms | no package called\|there is no package called\|no package error |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | ERR6 |
| post_type | FR |
| fr_parent | R-Common-Errors.html |

## Lead paragraph

`Error in library(x) : there is no package called 'x'` means R searched every folder on its library path but found no installed copy of the package you asked for. The package may be uninstalled, half-installed, installed in a folder R no longer looks at, or hosted somewhere `install.packages()` doesn't reach.

## First H2 plan

**Heading:** What does R's "no package called X" error actually mean?

**Opening prose (≤80 words):** R looks up packages in a fixed list of folders called the library path. When you call `library(somepkg)`, R walks each folder, checks for a `somepkg/` subdirectory containing a parsed `DESCRIPTION` file, and stops at the first match. No match anywhere on the path triggers this error. Before guessing the cause, ask R to show you both lists — what is installed, and where it looked.

**Payoff code block:** reproduce the error, then run `installed.packages()[, "Package"]` filtered, plus `.libPaths()`.

## Core H2 sections

### H2 1 — What does R's "no package called X" error actually mean?
- Theory: library lookup chain, library path, parsed DESCRIPTION
- Code: reproduce error + `installed.packages()` + `.libPaths()` (the payoff block)
- Callout: KEY INSIGHT — error is literal, R checked every libPath and found nothing
- Inline exercise: reproduce for `ex_fakepkg` and confirm with `find.package()`

### H2 2 — Cause 1: Did you forget to install the package?
- Most common cause: typed library() without install.packages() first
- Code: install + load + verify
- Callout: TIP — `requireNamespace()` for graceful checks
- Inline exercise: load a package safely with `requireNamespace`

### H2 3 — Cause 2: Did install.packages() fail silently?
- Compilation errors, missing system deps, locked DLL on Windows, half-finished install
- Code: install with verbose, check return value, look at warnings
- Callout: WARNING — install.packages doesn't error, only warns
- Inline exercise: install a fictional package and inspect the warning

### H2 4 — Cause 3: Are your .libPaths() pointing to the wrong folder?
- Multiple library paths, user vs system, project libraries (renv)
- Code: print .libPaths(), check where the package actually lives, .libPaths() with new path
- Callout: NOTE — RStudio projects can override the library path
- Inline exercise: print libPaths and locate `dplyr`

### H2 5 — Cause 4: Did you upgrade R and lose your old packages?
- Major R version bumps create a new library folder; old packages don't transfer
- Code: detect old version libraries, reinstall workflow, `update.packages()`
- Callout: TIP — copy folder approach works for minor versions
- Inline exercise: detect mismatched library version

### H2 6 — Cause 5: Is it a Bioconductor package that needs BiocManager?
- CRAN vs Bioconductor; install.packages() can't find BioC packages
- Code: BiocManager::install() example with limma
- Callout: NOTE — Bioconductor has its own release cycle
- Inline exercise: install BiocManager and check available BioC packages

### H2 7 — Cause 6: Is it a GitHub-only package that needs remotes::install_github()?
- Many packages live only on GitHub (development versions, niche packages)
- Code: install with remotes::install_github(), then library()
- Callout: WARNING — pin commits for reproducibility
- Inline exercise: install a github package (commented), explain syntax

### H2 8 — How do you stop this error from happening again?
- Prevention checklist: pin a libPath, use renv, document R version, test scripts on fresh sessions
- Code: minimal renv workflow + sessionInfo() snapshot
- Callout: KEY INSIGHT — reproducibility starts with one library
- Inline exercise: print sessionInfo's package section

## Tail sections

### Practice Exercises (2-3 capstone)
1. **Diagnose a missing package** — given an error, write code to: list libPaths, search each for the package folder, return which (if any) contained it
2. **Build a safe loader** — function `safe_library(pkg)` that tries `library()`, on failure prints which libPath was checked and offers `install.packages()` 
3. **Source-aware installer** — function that installs from CRAN, Bioconductor, or GitHub based on a `source` argument

### Complete Example
End-to-end flow: hit the error → run diagnostic → identify cause (e.g., wrong libPath) → fix → verify with `library()` and `find.package()`. Show all 6 cause-detection branches in one decision-style script.

### Summary
Table mapping each cause → diagnostic command → fix command.

### References
1. R installation and admin manual — Add-on packages
2. CRAN — Installing R packages
3. Bioconductor — install instructions
4. remotes package — install_github documentation
5. renv documentation — project libraries
6. R FAQ — Common installation issues

### Continue Learning
1. R-Common-Errors.html — 50 R Errors Decoded (parent)
2. R-Error-Function-Not-Found.html — 'could not find function' (related)
3. R-Error-Object-Not-Found.html — 'object not found' (related)

## Diagrams
None — FR post; topic is sequential troubleshooting better served by code than visuals.

## Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Reproduce error + diagnose | — | — | — |
| 2 | Try-it: ex_fakepkg | — | — | — |
| 3 | Solution: ex_fakepkg | — | — | — |
| 4 | Cause 1: install then load | — | — | — |
| 5 | Cause 1 try-it scaffold | — | — | — |
| 6 | Cause 1 solution | — | — | — |
| 7 | Cause 2: silent install failure | — | — | — |
| 8 | Cause 2 try-it scaffold | — | — | — |
| 9 | Cause 2 solution | — | — | — |
| 10 | Cause 3: print libPaths | — | `lib_dirs` | — |
| 11 | Cause 3 try-it scaffold | — | — | — |
| 12 | Cause 3 solution | — | — | — |
| 13 | Cause 4: detect old R version libs | — | — | — |
| 14 | Cause 4 try-it scaffold | — | — | — |
| 15 | Cause 4 solution | — | — | — |
| 16 | Cause 5: BiocManager install (commented) | — | — | — |
| 17 | Cause 5 try-it scaffold | — | — | — |
| 18 | Cause 5 solution | — | — | — |
| 19 | Cause 6: remotes install_github (commented) | — | — | — |
| 20 | Cause 6 try-it scaffold | — | — | — |
| 21 | Cause 6 solution | — | — | — |
| 22 | Prevention: sessionInfo + renv | — | — | — |
| 23 | Prevention try-it scaffold | — | — | — |
| 24 | Prevention solution | — | — | — |
| 25 | Capstone 1: diagnose missing package | — | — | — |
| 26 | Capstone 2: safe_library | — | — | — |
| 27 | Capstone 3: source-aware installer | — | — | — |
| 28 | Complete example: full diagnostic flow | — | — | — |

Notebook note: WebR cannot actually install CRAN/BioC/GitHub packages, so install commands will be shown as runnable but commented out (`# install.packages("dplyr")`) with `[NOTE]` callouts pointing readers to local R for the install side.
