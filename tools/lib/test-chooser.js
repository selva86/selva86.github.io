/*!
 * test-chooser.js - Statistical test selection engine for r-statistics.co
 *
 * A pure decision engine: it maps a wizard state (research goal, outcome
 * type, number of groups, design, normality, variances, sample size) to a
 * recommended statistical test, plus a parametric<->nonparametric
 * alternative. No numeric estimation happens here; every R snippet in the
 * registry is self-contained and run-verified in R 4.6.0
 * (see Scripts/tool-truth/statistical-test-chooser.R).
 *
 * UMD: browser global window.TestChooser + CommonJS require.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TestChooser = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- link helpers ------------------------------------------------------
  function tut(file, label) { return { href: '/' + file, label: label }; }
  function tool(file, label) { return { href: '/tools/' + file, label: label }; }

  // Shared link targets (all verified to resolve, 2026-07-13).
  var L = {
    ttest:       tool('t-test-calculator.html', 'Open the t-test calculator'),
    nonpar:      tool('nonparametric.html', 'Open the nonparametric test calculator'),
    anova:       tool('anova-output-interpreter.html', 'Open the ANOVA output interpreter'),
    chisq:       tool('chi-square-calculator.html', 'Open the chi-square calculator'),
    lm:          tool('lm-output-interpreter.html', 'Open the linear-model interpreter'),
    glm:         tool('glm-output-interpreter.html', 'Open the GLM output interpreter'),
    surv:        tool('survival-power-calculator.html', 'Open the survival calculator'),
    abtest:      tool('ab-test-calculator.html', 'Open the A/B (two-proportion) calculator'),
    confusion:   tool('confusion-matrix-interpreter.html', 'Open the confusion-matrix interpreter')
  };

  // ---- the test registry -------------------------------------------------
  // id -> { name, why, family, assumptions[], r, calc, tutorial, exercises, alt }
  var TESTS = {

    'one-sample-t': {
      name: 'One-sample t-test',
      why: 'Compares one group’s mean against a known or claimed value.',
      family: 'parametric',
      assumptions: ['Observations are independent', 'Values are roughly normal (or n is large enough for the CLT)', 'The variable is continuous'],
      r: 'x <- c(5.1, 4.8, 5.4, 5.0, 5.3, 4.9, 5.2)\nt.test(x, mu = 5)',
      calc: L.ttest, tutorial: tut('t-Tests-in-R.html', 't-tests in R'), exercises: tut('t-Test-Exercises-in-R.html', 't-test exercises'),
      alt: 'wilcoxon-signed-rank'
    },
    'student-t': {
      name: 'Two-sample t-test (pooled)',
      why: 'Compares the means of two independent groups when their spreads are similar.',
      family: 'parametric',
      assumptions: ['The two groups are independent', 'Each group is roughly normal', 'Equal variances (this is the pooled version)'],
      r: 'new  <- c(84, 88, 79, 91, 85, 87)\nctrl <- c(78, 82, 75, 80, 79, 81)\nt.test(new, ctrl, var.equal = TRUE)',
      calc: L.ttest, tutorial: tut('t-Tests-in-R.html', 't-tests in R'), exercises: tut('t-Test-Exercises-in-R.html', 't-test exercises'),
      alt: 'mann-whitney'
    },
    'welch-t': {
      name: 'Welch’s t-test',
      why: 'Compares two independent group means without assuming equal variances (R’s default).',
      family: 'parametric',
      assumptions: ['The two groups are independent', 'Each group is roughly normal', 'Variances may differ freely (Welch corrects for it)'],
      r: 'new  <- c(84, 88, 79, 91, 85, 87)\nctrl <- c(78, 82, 75, 80, 79, 81)\nt.test(new, ctrl)          # Welch by default',
      calc: L.ttest, tutorial: tut('t-Tests-in-R.html', 't-tests in R'), exercises: tut('t-Test-Exercises-in-R.html', 't-test exercises'),
      alt: 'mann-whitney'
    },
    'paired-t': {
      name: 'Paired t-test',
      why: 'Compares two measurements taken on the same subjects (before vs after).',
      family: 'parametric',
      assumptions: ['Each pair is matched (same subject)', 'The differences are roughly normal', 'Pairs are independent of each other'],
      r: 'before <- c(72, 68, 75, 71, 66, 70)\nafter  <- c(75, 70, 79, 74, 68, 74)\nt.test(after, before, paired = TRUE)',
      calc: L.ttest, tutorial: tut('t-Tests-in-R.html', 't-tests in R'), exercises: tut('t-Test-Exercises-in-R.html', 't-test exercises'),
      alt: 'wilcoxon-signed-rank'
    },

    'mann-whitney': {
      name: 'Mann-Whitney U test',
      why: 'Compares two independent groups by ranks when normality is doubtful.',
      family: 'nonparametric',
      assumptions: ['The two groups are independent', 'The outcome is at least ordinal', 'No normality needed'],
      r: 'g1 <- c(21, 25, 30, 19, 27)\ng2 <- c(14, 18, 11, 20, 16)\nwilcox.test(g1, g2)',
      calc: L.nonpar, tutorial: tut('Mann-Whitney-U-Test-in-R.html', 'Mann-Whitney U in R'), exercises: tut('Nonparametric-Tests-Exercises-in-R.html', 'Nonparametric exercises'),
      alt: 'welch-t'
    },
    'wilcoxon-signed-rank': {
      name: 'Wilcoxon signed-rank test',
      why: 'Rank-based test for paired data (or one sample vs a value) when data are skewed.',
      family: 'nonparametric',
      assumptions: ['Pairs are matched', 'Differences are symmetric around the median', 'No normality needed'],
      r: 'before <- c(72, 68, 75, 71, 66, 70)\nafter  <- c(75, 70, 79, 74, 68, 74)\nwilcox.test(after, before, paired = TRUE)',
      calc: L.nonpar, tutorial: tut('Wilcoxon-Signed-Rank-Test-in-R.html', 'Wilcoxon signed-rank in R'), exercises: tut('Nonparametric-Tests-Exercises-in-R.html', 'Nonparametric exercises'),
      alt: 'paired-t'
    },
    'sign-test': {
      name: 'Sign test',
      why: 'Tests whether paired differences tend to be positive or negative; needs only the direction.',
      family: 'nonparametric',
      assumptions: ['Pairs are matched', 'Differences can be ranked as + or -', 'Weakest assumptions of the paired tests'],
      r: 'before <- c(72, 68, 75, 71, 66, 70)\nafter  <- c(75, 70, 79, 74, 68, 74)\nd <- after - before\nbinom.test(sum(d > 0), sum(d != 0))   # sign test',
      calc: L.nonpar, tutorial: tut('Sign-Test-in-R.html', 'Sign test in R'), exercises: tut('Nonparametric-Tests-Exercises-in-R.html', 'Nonparametric exercises'),
      alt: 'wilcoxon-signed-rank'
    },
    'kruskal-wallis': {
      name: 'Kruskal-Wallis test',
      why: 'Compares 3+ independent groups by ranks (the nonparametric one-way ANOVA).',
      family: 'nonparametric',
      assumptions: ['Groups are independent', 'The outcome is at least ordinal', 'No normality needed'],
      r: 'score <- c(21, 25, 30, 14, 18, 11, 33, 29, 40)\ngroup <- factor(rep(c("A", "B", "C"), each = 3))\nkruskal.test(score ~ group)',
      calc: L.nonpar, tutorial: tut('Kruskal-Wallis-Test-in-R.html', 'Kruskal-Wallis in R'), exercises: tut('Nonparametric-Tests-Exercises-in-R.html', 'Nonparametric exercises'),
      alt: 'one-way-anova'
    },
    'friedman': {
      name: 'Friedman test',
      why: 'Compares 3+ repeated measures by ranks (the nonparametric repeated-measures ANOVA).',
      family: 'nonparametric',
      assumptions: ['Same subjects measured under every condition', 'The outcome is at least ordinal', 'No normality needed'],
      r: '# rows = subjects, columns = conditions\nm <- matrix(c(1,2,3, 2,3,1, 1,3,2, 2,3,1), nrow = 4, byrow = TRUE)\nfriedman.test(m)',
      calc: L.nonpar, tutorial: tut('Friedman-Test-in-R.html', 'Friedman test in R'), exercises: tut('Nonparametric-Tests-Exercises-in-R.html', 'Nonparametric exercises'),
      alt: 'rm-anova'
    },

    'one-way-anova': {
      name: 'One-way ANOVA',
      why: 'Compares the means of 3+ independent groups in a single test.',
      family: 'anova',
      assumptions: ['Groups are independent', 'Residuals are roughly normal', 'Equal variances across groups'],
      r: 'score <- c(84, 88, 79, 78, 82, 75, 91, 89, 94)\ngroup <- factor(rep(c("A", "B", "C"), each = 3))\nsummary(aov(score ~ group))',
      calc: L.anova, tutorial: tut('One-Way-ANOVA-in-R.html', 'One-way ANOVA in R'), exercises: tut('ANOVA-Exercises-in-R.html', 'ANOVA exercises'),
      alt: 'kruskal-wallis'
    },
    'welch-anova': {
      name: 'Welch’s ANOVA',
      why: 'Compares 3+ group means when the variances are unequal.',
      family: 'anova',
      assumptions: ['Groups are independent', 'Residuals are roughly normal', 'Variances may differ (Welch corrects for it)'],
      r: 'score <- c(84, 88, 79, 78, 82, 75, 91, 89, 94)\ngroup <- factor(rep(c("A", "B", "C"), each = 3))\noneway.test(score ~ group)   # var.equal = FALSE (Welch)',
      calc: L.anova, tutorial: tut('Welchs-ANOVA-in-R.html', 'Welch’s ANOVA in R'), exercises: tut('ANOVA-Exercises-in-R.html', 'ANOVA exercises'),
      alt: 'kruskal-wallis'
    },
    'rm-anova': {
      name: 'Repeated-measures ANOVA',
      why: 'Compares 3+ conditions measured on the same subjects.',
      family: 'anova',
      assumptions: ['Same subjects across all conditions', 'Residuals are roughly normal', 'Sphericity (equal variance of differences)'],
      r: 'score   <- c(5,6,7, 6,7,8, 4,5,7, 5,6,6)\nsubject <- factor(rep(1:4, each = 3))\ntime    <- factor(rep(c("t1","t2","t3"), times = 4))\nsummary(aov(score ~ time + Error(subject/time)))',
      calc: L.anova, tutorial: tut('Repeated-Measures-ANOVA-in-R.html', 'Repeated-measures ANOVA in R'), exercises: tut('Repeated-Measures-Exercises-in-R.html', 'Repeated-measures exercises'),
      alt: 'friedman'
    },

    'chi-square-gof': {
      name: 'Chi-square goodness-of-fit test',
      why: 'Checks whether one categorical variable’s frequencies match an expected distribution.',
      family: 'categorical',
      assumptions: ['One categorical variable', 'Expected count ≥ 5 in most cells', 'Observations are independent'],
      r: 'observed <- c(20, 30, 25, 25)\nchisq.test(observed, p = rep(1/4, 4))',
      calc: L.chisq, tutorial: tut('Chi-Square-Goodness-of-Fit-Test-in-R.html', 'Goodness-of-fit in R'), exercises: tut('Chi-Square-Test-Exercises-in-R.html', 'Chi-square exercises'),
      alt: null
    },
    'chi-square-independence': {
      name: 'Chi-square test of independence',
      why: 'Tests whether two categorical variables are associated.',
      family: 'categorical',
      assumptions: ['Two categorical variables', 'Expected count ≥ 5 in most cells (else use Fisher)', 'Observations are independent'],
      r: 'tab <- matrix(c(30, 20, 15, 35), nrow = 2,\n              dimnames = list(group = c("A","B"), outcome = c("yes","no")))\nchisq.test(tab)',
      calc: L.chisq, tutorial: tut('Chi-Square-Test-of-Independence-in-R.html', 'Independence test in R'), exercises: tut('Chi-Square-Test-Exercises-in-R.html', 'Chi-square exercises'),
      alt: 'fisher-exact'
    },
    'fisher-exact': {
      name: 'Fisher’s exact test',
      why: 'Exact test of association for small 2x2 tables (when expected counts fall below 5).',
      family: 'categorical',
      assumptions: ['Two categorical variables (2x2 is classic)', 'Works with small or sparse tables', 'Observations are independent'],
      r: 'tab <- matrix(c(8, 2, 1, 9), nrow = 2)\nfisher.test(tab)',
      calc: L.chisq, tutorial: tut('Fishers-Exact-Test-in-R.html', 'Fisher’s exact test in R'), exercises: tut('Chi-Square-Test-Exercises-in-R.html', 'Chi-square exercises'),
      alt: 'chi-square-independence'
    },
    'mcnemar': {
      name: 'McNemar’s test',
      why: 'Tests a change in a paired binary outcome (same subjects, before vs after).',
      family: 'categorical',
      assumptions: ['Paired binary outcome', 'Focuses on the discordant pairs', 'Pairs are independent of each other'],
      r: 'tab <- matrix(c(30, 12, 5, 20), nrow = 2)\nmcnemar.test(tab)',
      calc: L.chisq, tutorial: tut('McNemars-Test-in-R.html', 'McNemar’s test in R'), exercises: null,
      alt: null
    },
    'cochran-q': {
      name: 'Cochran’s Q test',
      why: 'Extends McNemar to 3+ repeated binary measures on the same subjects.',
      family: 'categorical',
      assumptions: ['Same subjects across all conditions', 'Binary (0/1) outcome', 'Blocks (subjects) are independent'],
      r: '# rows = subjects, columns = conditions (0/1)\nm <- matrix(c(1,1,0, 1,0,0, 1,1,1, 0,1,0, 1,1,0), nrow = 5, byrow = TRUE)\nk  <- ncol(m); Cj <- colSums(m); Ri <- rowSums(m)\nQ  <- (k - 1) * (k * sum(Cj^2) - sum(Cj)^2) / (k * sum(Ri) - sum(Ri^2))\nc(Q = Q, df = k - 1, p = pchisq(Q, k - 1, lower.tail = FALSE))',
      calc: null, tutorial: tut('McNemars-Test-in-R.html', 'McNemar’s test (Q generalises it)'), exercises: null,
      alt: null
    },

    'one-prop-z': {
      name: 'One-sample z-test for a proportion',
      why: 'Tests whether one proportion differs from a hypothesised value, with a large sample.',
      family: 'proportion',
      assumptions: ['A single binary outcome', 'n large enough (np and n(1-p) ≥ ~10)', 'Observations are independent'],
      r: 'prop.test(x = 46, n = 100, p = 0.5, correct = FALSE)',
      calc: null, tutorial: tut('One-Sample-Proportion-z-Test-in-R.html', 'One-sample proportion z-test'), exercises: null,
      alt: 'binomial-test'
    },
    'two-prop-z': {
      name: 'Two-sample z-test for proportions',
      why: 'Compares a yes/no rate between two independent groups.',
      family: 'proportion',
      assumptions: ['Two independent groups', 'A binary outcome per group', 'Enough successes and failures in each group'],
      r: 'prop.test(c(34, 48), c(100, 100), correct = FALSE)',
      calc: L.abtest, tutorial: tut('Proportion-Tests-in-R.html', 'Proportion tests in R'), exercises: null,
      alt: 'chi-square-independence'
    },
    'binomial-test': {
      name: 'Exact binomial test',
      why: 'Exact test for one proportion; the right choice when the sample is small.',
      family: 'proportion',
      assumptions: ['A single binary outcome', 'Fixed number of independent trials', 'Exact, so no large-sample requirement'],
      r: 'binom.test(x = 8, n = 20, p = 0.5)',
      calc: null, tutorial: tut('Exact-Binomial-Test-in-R.html', 'Exact binomial test in R'), exercises: null,
      alt: 'one-prop-z'
    },

    'pearson': {
      name: 'Pearson correlation',
      why: 'Measures the strength of a straight-line relationship between two continuous variables.',
      family: 'correlation',
      assumptions: ['Both variables are continuous', 'The relationship is linear', 'Roughly normal, no extreme outliers'],
      r: 'x <- c(1, 2, 3, 4, 5, 6)\ny <- c(2.1, 3.9, 6.2, 7.8, 10.1, 12.3)\ncor.test(x, y, method = "pearson")',
      calc: null, tutorial: tut('How-to-do-Pearson-Correlation-Test-in-R.html', 'Pearson correlation in R'), exercises: tut('Correlation-Exercises-in-R.html', 'Correlation exercises'),
      alt: 'spearman'
    },
    'spearman': {
      name: 'Spearman correlation',
      why: 'Rank-based correlation for monotonic relationships that need not be linear.',
      family: 'correlation',
      assumptions: ['Variables are at least ordinal', 'The relationship is monotonic', 'No normality needed'],
      r: 'x <- c(1, 2, 3, 4, 5, 6)\ny <- c(2, 4, 5, 4, 6, 9)\ncor.test(x, y, method = "spearman")',
      calc: null, tutorial: tut('Spearman-and-Kendall-Correlation-in-R.html', 'Spearman & Kendall in R'), exercises: tut('Correlation-Exercises-in-R.html', 'Correlation exercises'),
      alt: 'pearson'
    },
    'kendall': {
      name: 'Kendall’s tau',
      why: 'Rank correlation that stays reliable with small samples and many ties.',
      family: 'correlation',
      assumptions: ['Variables are at least ordinal', 'The relationship is monotonic', 'Handles ties and small n well'],
      r: 'x <- c(1, 2, 3, 4, 5, 6)\ny <- c(2, 1, 4, 3, 6, 5)\ncor.test(x, y, method = "kendall")',
      calc: null, tutorial: tut('Spearman-and-Kendall-Correlation-in-R.html', 'Spearman & Kendall in R'), exercises: tut('Correlation-Exercises-in-R.html', 'Correlation exercises'),
      alt: 'spearman'
    },

    'simple-linear-regression': {
      name: 'Simple linear regression',
      why: 'Models a continuous outcome from a single predictor.',
      family: 'regression',
      assumptions: ['Linear relationship', 'Independent, normally distributed residuals', 'Constant variance (homoscedasticity)'],
      r: 'x <- c(1, 2, 3, 4, 5, 6)\ny <- c(2.1, 3.9, 6.2, 7.8, 10.1, 12.3)\nsummary(lm(y ~ x))',
      calc: L.lm, tutorial: tut('Simple-Linear-Regression-in-R.html', 'Simple linear regression in R'), exercises: tut('Linear-Regression-Exercises-in-R.html', 'Regression exercises'),
      alt: 'pearson'
    },
    'multiple-linear-regression': {
      name: 'Multiple linear regression',
      why: 'Models a continuous outcome from two or more predictors at once.',
      family: 'regression',
      assumptions: ['Linear in the coefficients', 'Independent, normal residuals with constant variance', 'Predictors not strongly collinear'],
      r: 'summary(lm(mpg ~ wt + hp + disp, data = mtcars))',
      calc: L.lm, tutorial: tut('Multiple-Regression-in-R.html', 'Multiple regression in R'), exercises: tut('Multiple-Regression-Exercises-in-R.html', 'Multiple-regression exercises'),
      alt: null
    },
    'logistic-regression': {
      name: 'Logistic regression',
      why: 'Models a binary (yes/no) outcome from one or more predictors.',
      family: 'regression',
      assumptions: ['Binary outcome', 'Log-odds are linear in the predictors', 'Observations are independent'],
      r: 'fit <- glm(vs ~ wt + hp, family = binomial, data = mtcars)\nsummary(fit)',
      calc: L.glm, tutorial: tut('Logistic-Regression-With-R.html', 'Logistic regression in R'), exercises: tut('Logistic-Regression-Exercises-in-R.html', 'Logistic-regression exercises'),
      alt: null
    },
    'poisson-regression': {
      name: 'Poisson regression',
      why: 'Models a count outcome (events per unit) from predictors.',
      family: 'regression',
      assumptions: ['Count outcome', 'Mean roughly equals variance (else negative binomial)', 'Observations are independent'],
      r: 'counts <- c(2, 3, 6, 7, 8, 9, 10, 12, 15)\ndose   <- c(1, 1, 2, 2, 3, 3, 4, 4, 5)\nsummary(glm(counts ~ dose, family = poisson))',
      calc: L.glm, tutorial: tut('Poisson-Regression-in-R.html', 'Poisson regression in R'), exercises: tut('Poisson-Regression-Exercises-in-R.html', 'Poisson-regression exercises'),
      alt: 'kruskal-wallis'
    },
    'ordinal-logistic': {
      name: 'Ordinal logistic regression',
      why: 'Models an ordered categorical outcome (the proportional-odds model).',
      family: 'regression',
      assumptions: ['Ordered categorical outcome', 'Proportional odds across thresholds', 'Observations are independent'],
      r: 'library(MASS)\nfit <- polr(factor(gear) ~ mpg + hp, data = mtcars, Hess = TRUE)\nsummary(fit)',
      calc: null, tutorial: tut('Ordinal-Logistic-Regression-With-R.html', 'Ordinal logistic regression in R'), exercises: null,
      alt: 'logistic-regression'
    },
    'multinomial-logistic': {
      name: 'Multinomial logistic regression',
      why: 'Models an unordered categorical outcome with 3+ categories.',
      family: 'regression',
      assumptions: ['Unordered categorical outcome', 'Independence of irrelevant alternatives', 'Observations are independent'],
      r: 'library(nnet)\nfit <- multinom(factor(gear) ~ mpg + hp, data = mtcars, trace = FALSE)\nsummary(fit)',
      calc: null, tutorial: tut('Multinomial-Logistic-Regression-in-R.html', 'Multinomial logistic regression in R'), exercises: null,
      alt: 'ordinal-logistic'
    },

    'log-rank': {
      name: 'Log-rank test',
      why: 'Compares survival curves between two or more groups.',
      family: 'survival',
      assumptions: ['Time-to-event outcome with censoring', 'Comparing groups (no covariate modelling)', 'Proportional hazards over time'],
      r: 'library(survival)\nsurvdiff(Surv(time, status) ~ sex, data = lung)',
      calc: L.surv, tutorial: tut('Kaplan-Meier-and-the-Log-Rank-Test.html', 'Kaplan-Meier & log-rank'), exercises: tut('Survival-Analysis-Exercises-in-R.html', 'Survival exercises'),
      alt: 'cox-regression'
    },
    'cox-regression': {
      name: 'Cox proportional-hazards regression',
      why: 'Models time-to-event from covariates without assuming a survival distribution.',
      family: 'survival',
      assumptions: ['Time-to-event outcome with censoring', 'Proportional hazards', 'Observations are independent'],
      r: 'library(survival)\nfit <- coxph(Surv(time, status) ~ age + sex, data = lung)\nsummary(fit)',
      calc: L.surv, tutorial: tut('Cox-Proportional-Hazards.html', 'Cox proportional hazards'), exercises: tut('Survival-Analysis-Exercises-in-R.html', 'Survival exercises'),
      alt: 'log-rank'
    },

    'cohen-kappa': {
      name: 'Cohen’s kappa',
      why: 'Measures agreement between two raters on categorical labels, correcting for chance.',
      family: 'agreement',
      assumptions: ['Two raters (or two methods)', 'Categorical (nominal) labels', 'For 3+ raters use Fleiss’ kappa'],
      r: 'rater1 <- c("a","a","b","b","a","b","a","b")\nrater2 <- c("a","b","b","b","a","b","a","a")\ntab <- table(rater1, rater2)\npo <- sum(diag(tab)) / sum(tab)\npe <- sum(rowSums(tab) * colSums(tab)) / sum(tab)^2\n(po - pe) / (1 - pe)   # Cohen’s kappa',
      calc: L.confusion, tutorial: null, exercises: null,
      alt: null
    },
    'icc': {
      name: 'Intraclass correlation (ICC)',
      why: 'Measures how consistently raters agree on continuous scores.',
      family: 'agreement',
      assumptions: ['Continuous ratings', 'Two or more raters', 'Pick a model: consistency vs absolute agreement'],
      r: 'm <- matrix(c(9,8,8, 7,6,7, 5,6,5, 8,9,8, 6,5,6), nrow = 5, byrow = TRUE)\nn <- nrow(m); k <- ncol(m)\nd <- data.frame(y = as.vector(m),\n                s = factor(rep(1:n, k)),\n                r = factor(rep(1:k, each = n)))\na <- summary(aov(y ~ s + r, data = d))[[1]]\nMSR <- a["s","Mean Sq"]; MSC <- a["r","Mean Sq"]; MSE <- a["Residuals","Mean Sq"]\n(MSR - MSE) / (MSR + (k-1)*MSE + k*(MSC - MSE)/n)   # ICC(2,1)',
      calc: null, tutorial: null, exercises: null,
      alt: 'cohen-kappa'
    },

    // ---- non-test "describe" recommendations ----------------------------
    'describe-continuous': {
      name: 'Summary (descriptive) statistics',
      why: 'Summarise one continuous variable: centre, spread and shape, no test needed.',
      family: 'describe',
      assumptions: ['You want to describe, not compare', 'Report mean/median, SD/IQR and a plot', 'Add a 95% CI to quantify uncertainty'],
      r: 'x <- c(5.1, 4.8, 5.4, 5.0, 5.3, 4.9, 5.2)\nsummary(x); sd(x)',
      calc: null, tutorial: tut('Descriptive-Statistics-in-R.html', 'Descriptive statistics in R'), exercises: tut('Confidence-Interval-Exercises-in-R.html', 'Confidence-interval exercises'),
      alt: null
    },
    'describe-categorical': {
      name: 'Frequency table and proportions',
      why: 'Summarise one categorical variable with counts and percentages.',
      family: 'describe',
      assumptions: ['You want to describe, not compare', 'Report counts and proportions', 'A bar chart shows the distribution'],
      r: 'g <- c("A","B","A","C","B","A","C","C")\ntable(g); prop.table(table(g))',
      calc: null, tutorial: tut('Descriptive-Statistics-in-R.html', 'Descriptive statistics in R'), exercises: null,
      alt: null
    }
  };

  // ---- the decision engine ----------------------------------------------
  // Given a wizard state, return { id, notes:[] }. altId is TESTS[id].alt.
  //
  // state fields (only the relevant ones are read per goal):
  //   goal:       compare | relationship | predict | describe | survival | agreement
  //   outcome:    continuous | ordinal | binary | nominal | count
  //   groups:     '1' | '2' | '3+'
  //   design:     independent | paired
  //   normal:     yes | no | unsure
  //   equalvar:   yes | no | unsure
  //   n:          small | medium | large
  //   predictors: '1' | '2+'
  //   survGoal:   compare | model
  //   ratingType: categorical | continuous
  //   raters:     '2' | '3+'

  function isNonparam(s) {
    if (s.outcome === 'ordinal') return true;
    if (s.normal === 'yes') return false;
    if (s.normal === 'no') return true;
    // unsure: the t-test / ANOVA is robust once n is large (CLT); otherwise
    // play it safe with a rank test and tell the user to check normality.
    return s.n !== 'large';
  }

  function unsureNote(s, np) {
    if (s.normal === 'unsure' && s.outcome !== 'ordinal') {
      return np
        ? 'Normality is unsure and the sample is not large, so a rank-based test is the safe pick. Confirm with a normality check first.'
        : 'Normality is unsure but n is large, so the central limit theorem keeps this test valid. A quick normality check is still worth it.';
    }
    return null;
  }

  function compareDecide(s) {
    var notes = [];
    var out = s.outcome;

    if (out === 'continuous' || out === 'ordinal') {
      var np = isNonparam(s);
      var un = unsureNote(s, np); if (un) notes.push(un);
      if (s.groups === '1') {
        if (np) return { id: s.outcome === 'ordinal' ? 'sign-test' : 'wilcoxon-signed-rank', notes: notes };
        return { id: 'one-sample-t', notes: notes };
      }
      if (s.groups === '2') {
        if (s.design === 'paired') {
          // Wilcoxon signed-rank needs the differences to be rankable by
          // magnitude; for purely ordinal paired data the sign test (which
          // uses only the direction of change) is the safer minimal choice.
          if (np) return { id: s.outcome === 'ordinal' ? 'sign-test' : 'wilcoxon-signed-rank', notes: notes };
          return { id: 'paired-t', notes: notes };
        }
        if (np) return { id: 'mann-whitney', notes: notes };
        if (s.equalvar === 'yes') return { id: 'student-t', notes: notes };
        return { id: 'welch-t', notes: notes };
      }
      // 3+
      if (s.design === 'paired') return { id: np ? 'friedman' : 'rm-anova', notes: notes };
      if (np) return { id: 'kruskal-wallis', notes: notes };
      if (s.equalvar === 'yes') return { id: 'one-way-anova', notes: notes };
      return { id: 'welch-anova', notes: notes };
    }

    if (out === 'binary') {
      if (s.groups === '1') return { id: s.n === 'small' ? 'binomial-test' : 'one-prop-z', notes: notes };
      if (s.groups === '2') {
        if (s.design === 'paired') return { id: 'mcnemar', notes: notes };
        if (s.n === 'small') return { id: 'fisher-exact', notes: notes };
        notes.push('A chi-square test of independence on the 2x2 table gives an equivalent p-value.');
        return { id: 'two-prop-z', notes: notes };
      }
      // 3+
      if (s.design === 'paired') return { id: 'cochran-q', notes: notes };
      return { id: 'chi-square-independence', notes: notes };
    }

    if (out === 'nominal') {
      if (s.groups === '1') return { id: 'chi-square-gof', notes: notes };
      if (s.groups === '2' && s.design === 'paired') return { id: 'mcnemar', notes: notes };
      if (s.groups === '3+' && s.design === 'paired') return { id: 'cochran-q', notes: notes };
      if (s.n === 'small') return { id: 'fisher-exact', notes: notes };
      return { id: 'chi-square-independence', notes: notes };
    }

    if (out === 'count') {
      notes.push('Model the group as a predictor; if the variance far exceeds the mean, switch to negative binomial. Kruskal-Wallis is a rank-based alternative.');
      return { id: 'poisson-regression', notes: notes };
    }

    return { id: 'welch-t', notes: notes };
  }

  function relDecide(s) {
    var out = s.outcome, notes = [];
    if (out === 'continuous') {
      if (s.normal === 'yes') return { id: 'pearson', notes: notes };
      if (s.n === 'small') { notes.push('With a small sample and possible ties, Kendall’s tau is more reliable than Spearman.'); return { id: 'kendall', notes: notes }; }
      return { id: 'spearman', notes: notes };
    }
    if (out === 'ordinal') return { id: 'kendall', notes: notes };
    // nominal / categorical association
    if (s.n === 'small') return { id: 'fisher-exact', notes: notes };
    return { id: 'chi-square-independence', notes: notes };
  }

  function predictDecide(s) {
    var out = s.outcome, notes = [];
    if (out === 'continuous') return { id: s.predictors === '1' ? 'simple-linear-regression' : 'multiple-linear-regression', notes: notes };
    if (out === 'binary') return { id: 'logistic-regression', notes: notes };
    if (out === 'count') { notes.push('If the variance far exceeds the mean, use negative binomial regression instead.'); return { id: 'poisson-regression', notes: notes }; }
    if (out === 'ordinal') return { id: 'ordinal-logistic', notes: notes };
    if (out === 'nominal') return { id: 'multinomial-logistic', notes: notes };
    return { id: 'multiple-linear-regression', notes: notes };
  }

  function survivalDecide(s) {
    if (s.survGoal === 'model') return { id: 'cox-regression', notes: [] };
    return { id: 'log-rank', notes: [] };
  }

  function agreementDecide(s) {
    if (s.ratingType === 'continuous') return { id: 'icc', notes: [] };
    if (s.raters === '3+') return { id: 'cohen-kappa', notes: ['With 3+ raters, use Fleiss’ kappa (irr::kappam.fleiss); Cohen’s kappa is the two-rater case.'] };
    return { id: 'cohen-kappa', notes: [] };
  }

  function describeDecide(s) {
    if (s.outcome === 'continuous') return { id: 'describe-continuous', notes: [] };
    return { id: 'describe-categorical', notes: [] };
  }

  function decide(s) {
    s = s || {};
    var r;
    switch (s.goal) {
      case 'compare':      r = compareDecide(s); break;
      case 'relationship': r = relDecide(s); break;
      case 'predict':      r = predictDecide(s); break;
      case 'survival':     r = survivalDecide(s); break;
      case 'agreement':    r = agreementDecide(s); break;
      case 'describe':     r = describeDecide(s); break;
      default:             r = { id: null, notes: [] };
    }
    if (r && r.id) r.alt = TESTS[r.id].alt || null;
    return r;
  }

  return {
    TESTS: TESTS,
    decide: decide,
    // count of genuine statistical tests (excludes the 2 "describe" cards)
    testCount: Object.keys(TESTS).filter(function (k) { return TESTS[k].family !== 'describe'; }).length
  };
}));
