# Nurture topics, curated from the corpus

The owner's model (2026-08-13): every nurture email creates interest in ONE
topic by focusing on the outcome - what the reader will be able to do - in a
natural, friendly spoken voice, then links to interactive learning on the
site. This file is the curation: 1,526 posts scanned (386 C, 259 FR, 733
PSEO, 148 EX), the magnetic ones picked per persona. Subjects below are
candidates in the outcome-first register, not final copy.

## Selection principles (what made the cut)

Three magnetism categories, in priority order:

1. **Capability-wow**: the reader gains a power they didn't know was
   reachable ("100M rows on a laptop", "forecast hundreds of series
   automatically"). The subject names the power, never the package.
2. **Fear-and-trust**: silent wrong answers, reviewer attacks, career traps.
   Openable because ignoring them has a cost ("R silently gave you the wrong
   answer", "Reviewer 2's favorite question").
3. **Career-identity**: salary, interviews, Excel-outgrowers, tool choices.
   Openable because it is about THEM, not about R.

Rejected: anything whose honest subject is a function name or a chore.
The topic can still appear as the *teaching* inside a capability email.

## Link-target rule

Link to the interactive LESSON when one exists (free first lessons of
courses are the ideal landing: interactive, generous, and the course's own
lesson-3 gate makes the Pro introduction at the right moment). Otherwise the
interactive post (every post runs code in the browser). Mark L = lesson
exists, P = post only. P-topics that win on opens/clicks become the queue
for the lesson factory - the emails vote on what gets built next.

## Pro placement (decided direction, owner to confirm)

No pitch step BEFORE lesson value (trust economics: email links must never
smell like pitches). Pro appears via the existing player chip, the lesson-3
gate (which triggers the 3e wall follow-up email), and optionally ONE
skippable "What Pro is" step at the END of free lessons reached from email.

---

## Data Analyst (20)

| # | Candidate subject | The outcome sold | Target |
|---|---|---|---|
| 1 | 100 million rows, 2 seconds, your laptop | Handle data Excel can't open, without a server | DuckDB-in-R.html (P) |
| 2 | The report that writes itself | Monday's report regenerates from data, zero manual steps | Reproducible-Reports-with-Quarto (L, free) |
| 3 | A full data profile in 5 minutes | One command, every variable examined, before you commit to anything | Automated-EDA-in-R.html (P) |
| 4 | Five lines that clean a filthy spreadsheet | janitor turns an ugly export into analyzable data | janitor-Package-in-R.html (P) |
| 5 | When R silently gives you the wrong answer | Recycling: no error, wrong numbers; two habits prevent it | R-Warning-Object-Length.html (P) |
| 6 | Scrape any website in 10 minutes | Data no one will export for you, pulled yourself | Web-Scraping-in-R-with-rvest.html (P) |
| 7 | Your charts, but people can hover them | Interactive charts your team explores in the browser | ggiraph-Interactive-Charts-in-R.html (P) |
| 8 | The dashboard your boss stops asking about | A live dashboard instead of the weekly screenshot ritual | Interactive-Charts-and-Maps-in-R (L, free) |
| 9 | Put your data on a real map | Leaflet maps with your own points, in an afternoon | Interactive-Maps-in-R-with-leaflet.html (P) |
| 10 | 7 signs your analysis has outgrown Excel | Identity: the moment spreadsheet people become R people | R-vs-Excel.html (P) |
| 11 | Steal these three professional charts | Recreate FT-grade charts, learn the moves by copying | Recreating-Professional-Charts-in-R.html (P) |
| 12 | Ten things to check before you trust a dataset | The pre-flight checklist that catches bad data early | Data-Quality-Checking-in-R.html (P) |
| 13 | dplyr code that runs on the SQL database | Same verbs, million-row tables, no data download | dbplyr-in-R.html (P) |
| 14 | See your missing data in 3 lines | naniar shows the holes before they bite | Missing-Data-Visualization-in-R-naniar.html (P) |
| 15 | Charts that move | gganimate: the bar-race and the growing line, shippable | gganimate-in-R.html (P) |
| 16 | The join that quietly drops rows | anti_join insurance before every merge | Joining-Tables-in-R (L, free) |
| 17 | Excel's date mess, fixed for good | lubridate: three formats in one column, parsed | lubridate-in-R.html (P) |
| 18 | What R skills earn (real numbers) | Salary and career path data for R analysts | R-Data-Scientist-Career.html (P) |
| 19 | Tables that go straight into the report | gt: publication tables without the Word wrestling | gt-Package.html (P) |
| 20 | 50 errors, decoded | The bookmark that ends copy-paste-into-Google | R-Common-Errors.html (P) |

## Data Scientist (20)

| # | Candidate subject | The outcome sold | Target |
|---|---|---|---|
| 1 | The 50-line algorithm inside Stan | Build MCMC from scratch; the black box opens | MCMC-in-R.html (P) |
| 2 | Did the campaign actually work? | CausalImpact: effect of an intervention with no control group | CausalImpact-in-R.html (P) |
| 3 | Prediction intervals with a guarantee | Conformal prediction: distribution-free, and it just works | Conformal-Prediction-in-R.html (P) |
| 4 | The uncertainty lm() can't give you | Bayesian regression: full posterior instead of one number | Bayesian-Linear-Regression-in-R.html (P) |
| 5 | Find the day everything changed | Changepoint detection on any series, automatically | Changepoint-Detection-in-R.html (P) |
| 6 | The rows that don't belong | Anomaly detection: fraud, sensor faults, weirdness at scale | R-Anomaly-Detection-Course lessons (L, free) |
| 7 | Forecast 500 series before lunch | Batch forecasting: the fable workflow that scales | Batch-Forecasting-in-R.html (P) |
| 8 | Why your CV score lied | Evaluation failures: leakage, wrong splits, flattering metrics | Cross-Validation-Strategies (L, free) |
| 9 | LLM agents, in R | Yes, in R - tool-calling agents from your own session | LLM-Agents-Course.html (L) |
| 10 | The map that unfolds high dimensions | t-SNE vs UMAP: see structure nobody can tabulate | t-SNE-and-UMAP-in-R.html (P) |
| 11 | Clusters that aren't blobs | DBSCAN: the shapes k-means can't see | DBSCAN-Clustering-in-R.html (P) |
| 12 | Fake data that keeps real secrets | Synthetic data for testing and sharing, privacy intact | Synthetic-Data-in-R.html (P) |
| 13 | One model for a thousand series | Global forecasting models: learn across series | Global-Forecasting-Models-in-R.html (P) |
| 14 | What the M competitions settled | 40 years of forecasting bake-offs, distilled | M-Competition-Lessons-in-R.html (P) |
| 15 | Volatility has memory | GARCH: model the risk, not just the mean | GARCH-Models-in-R.html (P) |
| 16 | Boosting, built by hand | Gradient boosting from scratch; xgboost's knobs demystified | Gradient-Boosting-from-Scratch (L, free) |
| 17 | Deep learning for forecasting, honestly | When the neural net earns its complexity (rarely) | Deep-Learning-Forecasting-in-R.html (P) |
| 18 | Models rot in production | Drift, monitoring, retraining: the deployment afterlife | A-Monitoring-and-Robustness-Playbook.html (L) |
| 19 | data.table vs dplyr, benchmarked | The speed question answered with numbers, not vibes | data-table-vs-dplyr.html (P) |
| 20 | Beyond the mean | Quantile regression: model the tails everyone ignores | Quantile-Regression-in-R.html (P) |

## Researcher (20)

| # | Candidate subject | The outcome sold | Target |
|---|---|---|---|
| 1 | Reviewer 2's favorite question | Answer statistical reviewer comments with working R | Answering-Statistical-Reviewer-Comments.html (P) |
| 2 | "Your control group is not comparable" | The objection, the diagnosis, the response letter | Non-Comparable-Control-Groups-in-Peer-Review.html (P) |
| 3 | Power analysis without the formula lookup | Simulate your study, read the power off the curve | Power-by-Simulation-in-R.html (P) |
| 4 | p = 0.06: what you may and may not say | "Trending toward significance" and its survivable alternatives | Trending-Toward-Significance-in-Peer-Review.html (P) |
| 5 | Prove there's NO effect | Equivalence testing: the test most researchers never learned | Equivalence-Testing-in-R.html (P) |
| 6 | The five habits of replicable research | Reproducibility crisis-proofing, concretely | Reproducibility-Crisis.html (P) |
| 7 | Missing data without losing subjects | Multiple imputation with mice, plus how to report it | Multiple-Imputation-mice-in-R.html (P) |
| 8 | The convergence warning that eats your week | lme4 'failed to converge': five fixes in order | R-Error-lme4-Convergence.html (P) |
| 9 | How robust is your conclusion, really? | Sensitivity analysis: stress-test the finding pre-submission | Sensitivity-Analysis-in-R.html (P) |
| 10 | Significant but meaningless | Statistical vs practical significance, and reporting both | Statistical-vs-Practical-Significance.html (P) |
| 11 | The numbers journals expect, the words to use | Report statistics so reviewers nod | Reporting-Statistics-in-R.html (P) |
| 12 | The plot reviewers keep praising | Raincloud plots: distribution comparisons that persuade | Raincloud-Plots-in-R.html (P) |
| 13 | Stars on the chart, done right | Significance brackets with ggsignif, correctly placed | Statistical-Significance-on-Plots-in-R.html (P) |
| 14 | Pre-register before you peek | Forking paths, p-hacking, and the OSF workflow | p-Hacking-and-Preregistration.html (P) |
| 15 | The t-test, rebuilt from scratch | Own the test you use most; questions stop landing | The-t-test-from-scratch (L, free) |
| 16 | Latent variables, measured | SEM and CFA with lavaan, a complete walkthrough | CFA-and-Structural-Equation-Modeling-in-R.html (P) |
| 17 | Which test? Five questions, one answer | The decision flowchart that ends test anxiety | Which-Statistical-Test-in-R.html (P) |
| 18 | Uncertainty your readers can see | Communicate intervals without misleading anyone | Communicating-Uncertainty.html (P) |
| 19 | Repeated measures, done properly | Mixed models over rmANOVA, and when reviewers accept either | Multilevel-Models-in-R.html (P) |
| 20 | Design decides the paper's fate | RCT vs cohort vs case-control: what each may claim | Study-Design-Types-RCT-Cohort-Case-Control.html (P) |

## Notes

- Student/explorer personas reuse the analyst list's gentler half plus the
  foundations courses; job seekers get interview/salary items woven in
  (R-Interview-Questions, AB-Testing-Interview-Cases, R-Resume-Skills).
- The Peer Review series (25+ posts) is effectively a ready-made researcher
  season: one reviewer objection per email writes itself.
- PSEO posts were scanned and excluded as email topics (long-tail how-tos);
  they serve search, not inboxes.
- Emails vote on lesson builds: any P-target that sustains top-quartile
  clicks becomes a lesson-factory request, and the email later re-runs
  pointing at the lesson.
