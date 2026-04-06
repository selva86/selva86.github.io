# Plan: The ADEMP Framework in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | The ADEMP Framework in R: Design & Report Simulation Studies Properly |
| slug | ADEMP-Framework-in-R |
| description | ADEMP (Aims, Data-generating, Estimands, Methods, Performance) gives simulation studies structure. Design, code, and report Monte Carlo simulations in R. |
| keywords | ADEMP framework R, simulation study R, Monte Carlo simulation R, data-generating mechanism, estimand, performance measures simulation, simulation study design, MCSE, simulation reporting |
| auto_link_terms | ADEMP framework\|ADEMP\|simulation study design\|Monte Carlo simulation study\|simulation performance measures |
| auto_link_case_sensitive | false |
| mathjax | true |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-cons-1 |
| post_type | FR |
| fr_parent | Statistical-Consulting-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > Consulting > The ADEMP Framework in R

## C. Full Section Outline

### Lead sentence
ADEMP (Aims, Data-generating mechanisms, Estimands, Methods, Performance measures) is a five-component framework that turns ad-hoc Monte Carlo simulations into structured, reproducible, and reportable studies.

### Introduction (## Introduction)
- Hook: Most simulation studies are written as one-off scripts. Results are hard to reproduce, methods are hard to compare, and reviewers have no standard to evaluate them against.
- ADEMP was introduced by Morris, White & Crowther (2019) to fix this. It gives every simulation study a skeleton: what are you testing, how do you generate data, what truth are you targeting, which methods compete, and how do you score them?
- What you'll learn: walk through each ADEMP component with R code, build a complete simulation comparing two estimators, and learn to report results with Monte Carlo Standard Errors (MCSE).
- Base R only -- all code runs in the browser.

### Core H2 sections (5 sections)

#### H2-1: What Does Each ADEMP Component Mean?
- Theory: Define all 5 components with plain-language explanations and real examples
- Diagram: ADEMP-Framework-in-R-overview.webp (Figure 1)
- Code: Print a named list summarizing the 5 components
- Callout: KEY INSIGHT -- ADEMP is not a checklist, it's a thinking tool
- Inline exercise: Create a named list for a different study aim

#### H2-2: How Do You Define the Data-Generating Mechanism?
- Theory: Parametric DGM vs resampling, choosing simulation factors, factorial designs
- Code block 1: Write a DGM function that generates linear regression data with configurable n, beta, error SD
- Code block 2: Generate one dataset and inspect it
- Callout: TIP -- Always wrap DGM in a function for reproducibility
- Inline exercise: Modify the DGM to add a binary confounder

#### H2-3: What Is an Estimand and Why Does It Matter?
- Theory: Estimand vs estimator vs estimate. The estimand is the "truth" you built into the DGM.
- Code: Show how to extract the true value from the DGM parameters
- Callout: WARNING -- Confusing estimand with estimator is the #1 simulation bug
- Inline exercise: Define the estimand for a different scenario

#### H2-4: How Do You Run the Full Simulation Loop?
- Theory: The replicate-apply-collect pattern. set.seed for reproducibility. Number of replications and MCSE.
- Diagram: ADEMP-Framework-in-R-simulation-workflow.webp (Figure 2)
- Code block 1: Write a function that runs one replication (generate data -> fit two methods -> return estimates)
- Code block 2: Use replicate() to run 1000 reps and collect results into a matrix
- Callout: NOTE -- 1000 reps gives MCSE of ~0.016 for coverage; use more for tighter bounds
- Inline exercise: Run the simulation with a different sample size

#### H2-5: How Do You Compute and Report Performance Measures?
- Theory: Bias, empirical SE, MSE, coverage, power. Formulas with LaTeX. MCSE for each.
- Code block 1: Compute bias, empSE, MSE for both methods
- Code block 2: Compute coverage of 95% CI for both methods
- Code block 3: Print a formatted comparison table
- Callout: KEY INSIGHT -- Always report MCSE alongside performance measures
- Inline exercise: Add RMSE to the performance table

### Tail sections

#### Common Mistakes (3-5)
1. Not setting seed before each replication (non-reproducible)
2. Confusing estimand with estimator (wrong truth)
3. Too few replications without checking MCSE
4. Forgetting to vary simulation factors (only testing one scenario)
5. Not reporting Monte Carlo uncertainty

#### Practice Exercises (2 capstone)
1. Medium: Design a simulation comparing mean vs median under contaminated normal data. Define all 5 ADEMP components, run 500 reps, report bias and MSE.
2. Hard: Extend the tutorial simulation to a factorial design (n = 50, 200; error SD = 1, 3). Collect results across all 4 scenarios and present in a table.

#### Complete Example
- End-to-end ADEMP simulation: compare OLS vs robust regression under heteroskedastic errors
- All 5 ADEMP components stated, DGM function, simulation loop, performance table with MCSE

#### Summary
- Table: ADEMP component | Key question | What to report

#### FAQ (5 questions)
1. How many replications do I need?
2. What R packages help with simulation studies?
3. Can I use ADEMP for power analysis?
4. Should I preregister a simulation study?
5. How do I report MCSE in a paper?

#### References (8 sources)
1. Morris, White & Crowther (2019) -- original ADEMP paper
2. Siepe et al. (2024) -- ADEMP-PreReg template
3. Pustejovsky -- Designing Monte Carlo Simulations in R
4. R Documentation -- replicate()
5. R Documentation -- set.seed()
6. rsimsum CRAN package
7. SimDesign CRAN package
8. Burton et al. (2006) -- simulation sample size guidance

#### What's Next
1. Statistical Consulting in R (parent post)
2. Sample Size Planning in R
3. Sensitivity Analysis in R

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | ADEMP-Framework-in-R-overview.webp | Figure 1 | The five ADEMP components form a cycle: aims drive data generation, which defines estimands, evaluated by methods, scored by performance measures. | What Does Each ADEMP Component Mean? |
| 2 | ADEMP-Framework-in-R-simulation-workflow.webp | Figure 2 | A Monte Carlo simulation repeats the generate-fit-collect loop N times, then computes performance measures. | How Do You Run the Full Simulation Loop? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | ADEMP components as named list | -- | ademp | -- |
| 2 | DGM function definition | -- | generate_data | -- |
| 3 | Generate one dataset | -- | dat | generate_data |
| 4 | Estimand extraction | -- | true_beta | -- |
| 5 | One-replication function | -- | run_one_rep | generate_data |
| 6 | Full simulation loop with replicate() | -- | results | run_one_rep |
| 7 | Bias and empSE computation | -- | bias_ols, bias_robust, emp_se_ols, emp_se_robust | results |
| 8 | Coverage computation | -- | coverage_ols, coverage_robust | results |
| 9 | Formatted performance table | -- | perf_table | bias_ols, bias_robust, emp_se_ols, emp_se_robust, coverage_ols, coverage_robust |
| 10 | Complete example: OLS vs robust under heteroskedasticity | -- | dgm_hetero, run_rep_hetero, sim_results, perf | -- |

Estimated word count: ~4000-4500 words
