# Plan: Sample Size Planning in R

## Frontmatter

| Field | Value |
|---|---|
| title | Sample Size in R: Calculate Your N Before You Collect a Single Observation |
| slug | Sample-Size-Planning-in-R |
| description | Underpowered studies waste effort. Learn pwr Package power analysis in R, simulation-based power for complex designs, and how to defend your N. |
| keywords | sample size R, power analysis R, pwr package R, statistical power R, sample size calculation R, Cohen's d R, effect size R, pwr.t.test, simulation power analysis R |
| auto_link_terms | sample size planning in R\|power analysis in R\|pwr package\|pwr.t.test()\|statistical power\|effect size R\|sample size calculation |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-07 |
| curriculum_id | 2.10.3 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | Sample Size Planning |
| sidebar_order | 18 |
| fr_parent | (none — C post) |

## Lead
Sample size planning is calculating how many observations you need to reliably detect an effect of a given size — a decision you make before collecting data, not after.

## Introduction Plan
- Hook: Most studies fail not because of bad analysis but bad planning — underpowered studies can't detect real effects even when they exist
- What power analysis is (4 interrelated quantities: n, alpha, power, effect size)
- What reader will learn: pwr package for standard tests, simulation for complex designs, writing a defensible N

## Core Sections

### H2 1: What is statistical power and why does it matter before you collect data?
- Theory: Type I/II errors, power = P(detect real effect), the 0.80 convention
- Diagram: power-tradeoffs flowchart (Figure 1)
- Code: simulate power intuitively — show two distributions, shade overlap
- Inline exercise: change effect size and observe how power changes

### H2 2: How do you calculate sample size for a t-test in R?
- pwr.t.test() for two-sample, one-sample, paired; Cohen's d
- Code: two-sample t-test N; one-sample; paired design comparison
- Diagram: workflow flowchart (Figure 2)
- Code: power curve plot (power vs n)
- Inline exercise: calculate N for a one-sample t-test

### H2 3: How do you calculate sample size for proportions, ANOVA, and chi-squared tests?
- pwr.2p.test() for proportions, pwr.anova.test() for ANOVA, pwr.chisq.test()
- Code: proportion test N; one-way ANOVA N; chi-squared N
- KEY INSIGHT callout: effect size conventions differ by test type
- Inline exercise: calculate N for a proportion test

### H2 4: How do you use simulation to estimate power for complex designs?
- When pwr fails: mixed models, unequal variances, non-normal data
- Code: simulation loop — generate data, fit model, check p-value, repeat
- TIP callout: use replicate() for clean simulation loops
- Inline exercise: modify simulation for a different effect size

### H2 5: How do you write a defensible sample size justification?
- The 4 elements: effect size source, alpha, power, formula/function used
- Code: extract results and format them as text
- WARNING: never justify N post-hoc
- Inline exercise: write a one-sentence justification from pwr output

## Common Mistakes (3-5)
1. Treating pwr n as total sample, not per-arm
2. Using Cohen's "small/medium/large" without domain justification
3. Forgetting dropout inflation
4. Running power analysis after seeing the data (post-hoc power)
5. Using alpha=0.05 blindly for multiple comparisons

## Capstone Practice Exercises (2-3)
1. Medium: Full pipeline — define hypothesis, estimate Cohen's d, run pwr.t.test(), inflate for 15% dropout, report result
2. Hard: Simulate power for a 2x2 factorial ANOVA with unequal group sizes

## Complete Example
End-to-end: clinical trial comparing two treatments for blood pressure reduction — define effect size from prior literature, calculate N with pwr.t2n.test(), inflate for dropout, write the methods paragraph

## Summary
Table: function → test type → key arguments

## FAQ (3-5)
1. What if I don't know the effect size?
2. Can I run power analysis after data collection?
3. What power should I target — 0.80 or 0.90?
4. How do I handle multiple primary endpoints?
5. Is simulation-based power more accurate than pwr?

## References
- Cohen (1988), pwr vignette, Higgins bookdown, Masur blog, pwrss package

## What's Next
- Correlation Analysis in R, Statistical Tests in R, Data Quality Checking

## Diagrams

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | Sample-Size-Planning-in-R-power-tradeoffs.webp | Figure 1 | The four interdependent quantities in power analysis. Fix any three and solve for the fourth. | What is statistical power? |
| 2 | Sample-Size-Planning-in-R-workflow.webp | Figure 2 | The six-step sample size planning workflow, from hypothesis to written justification. | How do you calculate sample size for a t-test? |

## Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Install/load pwr; Cohen's d formula | pwr | d_example | — |
| 2 | pwr.t.test() two-sample | — | n_two_sample | d_example |
| 3 | pwr.t.test() one-sample + paired comparison | — | n_one, n_paired | — |
| 4 | Power curve plot | — | power_curve | — |
| 5 | pwr.2p.test() proportions | — | n_prop | — |
| 6 | pwr.anova.test() + pwr.chisq.test() | — | n_anova, n_chisq | — |
| 7 | Simulation-based power | — | sim_power | — |
| 8 | Format justification text | — | justification | n_two_sample |
