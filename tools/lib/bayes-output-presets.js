/* bayes-output-presets.js - GENERATED, do not hand-edit.
   Regenerate: python Scripts/tool-truth/gen-bayes-presets.py

   Every "text" below is REAL console output, never hand-typed.

   The five rstanarm presets are the verbatim output of
   print(summary(fit), digits = 3) on models fitted by
   Scripts/tool-truth/bayesian-output-interpreter.R with
   R version 4.6.0 (2026-04-24 ucrt) / rstanarm 2.32.2 / rstan 2.32.7.

   The brms preset could not be fitted here: brms compiles every model with a
   C++ toolchain and no Rtools is installed on the build box. It is therefore
   quoted verbatim from the official brms documentation at
   https://paulbuerkner.com/brms/ (knitr's "#> " prefix stripped,
   nothing else changed) rather than invented. The page says so too. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.BayesPresets = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
  "meta": {
    "brms_source_url": "https://paulbuerkner.com/brms/",
    "print_digits": 3,
    "r_version": "R version 4.6.0 (2026-04-24 ucrt)",
    "rstan_version": "2.32.7",
    "rstanarm_version": "2.32.2"
  },
  "order": [
    "gauss",
    "logit",
    "mlm",
    "brms",
    "weak",
    "diverge"
  ],
  "presets": {
    "brms": {
      "blurb": "The epilepsy example from the brms documentation. Shows the brms layout: credible interval columns, Bulk_ESS and Tail_ESS, and a group-level sd row.",
      "engine": "brms",
      "label": "brms, multilevel Poisson",
      "provenance": "Verbatim from the official brms documentation at https://paulbuerkner.com/brms/ (package homepage, maintained by the brms author Paul Buerkner). knitr's \"#> \" output prefix is stripped; nothing else is changed.",
      "r": "library(brms)\nfit1 <- brm(count ~ zAge + zBase * Trt + (1|patient),\n            data = epilepsy, family = poisson())\nsummary(fit1)",
      "text": " Family: poisson \n  Links: mu = log \nFormula: count ~ zAge + zBase * Trt + (1 | patient) \n   Data: epilepsy (Number of observations: 236) \n  Draws: 4 chains, each with iter = 2000; warmup = 1000; thin = 1;\n         total post-warmup draws = 4000\n\nGroup-Level Effects: \n~patient (Number of levels: 59) \n              Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS\nsd(Intercept)     0.58      0.07     0.46     0.73 1.01      768     1579\n\nPopulation-Level Effects: \n           Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS\nIntercept      1.77      0.11     1.54     1.99 1.00      753     1511\nzAge           0.09      0.08    -0.07     0.26 1.00      830     1429\nzBase          0.70      0.12     0.47     0.95 1.00      678     1389\nTrt1          -0.26      0.16    -0.59     0.05 1.01      709     1356\nzBase:Trt1     0.05      0.17    -0.29     0.37 1.01      721     1404\n\nDraws were sampled using sampling(NUTS). For each parameter, Bulk_ESS\nand Tail_ESS are effective sample size measures, and Rhat is the potential\nscale reduction factor on split chains (at convergence, Rhat = 1)."
    },
    "diverge": {
      "blurb": "The same multilevel model with adapt_delta dialled down to 0.40. The sampler genuinely diverges, and R's own warnings are pasted underneath the summary.",
      "engine": "rstanarm",
      "label": "Divergent transitions",
      "r": "library(rstanarm)\n# adapt_delta = 0.40 is deliberately far too low\nfit <- stan_glmer(mpg ~ wt + (1 | cyl), data = mtcars, chains = 2,\n                  iter = 800, seed = 5, adapt_delta = 0.40)\nprint(summary(fit), digits = 3)",
      "text": "\nModel Info:\n function:     stan_glmer\n family:       gaussian [identity]\n formula:      mpg ~ wt + (1 | cyl)\n algorithm:    sampling\n sample:       800 (posterior sample size)\n priors:       see help('prior_summary')\n observations: 32\n groups:       cyl (3)\n\nEstimates:\n                                     mean   sd     10%    50%    90% \n(Intercept)                        32.163  3.671 27.700 32.479 36.723\nwt                                 -3.791  0.993 -5.042 -3.799 -2.412\nb[(Intercept) cyl:4]                2.614  1.915  0.205  2.476  5.405\nb[(Intercept) cyl:6]               -0.555  1.645 -2.641 -0.598  1.470\nb[(Intercept) cyl:8]               -1.700  1.591 -3.830 -1.714  0.158\nsigma                               2.780  0.413  2.295  2.751  3.323\nSigma[cyl:(Intercept),(Intercept)]  6.302  4.712  1.162  5.354 12.463\n\nFit Diagnostics:\n           mean   sd     10%    50%    90% \nmean_PPD 20.012  0.699 19.114 19.996 20.917\n\nThe mean_ppd is the sample average posterior predictive distribution of the outcome variable (for details see help('summary.stanreg')).\n\nMCMC diagnostics\n                                   mcse  Rhat  n_eff\n(Intercept)                        0.620 1.086  35  \nwt                                 0.141 1.054  50  \nb[(Intercept) cyl:4]               0.350 1.100  30  \nb[(Intercept) cyl:6]               0.223 1.022  54  \nb[(Intercept) cyl:8]               0.270 1.048  35  \nsigma                              0.067 1.049  38  \nSigma[cyl:(Intercept),(Intercept)] 0.563 1.010  70  \nmean_PPD                           0.036 1.005 374  \nlog-posterior                      0.440 1.031  41  \n\nFor each parameter, mcse is Monte Carlo standard error, n_eff is a crude measure of effective sample size, and Rhat is the potential scale reduction factor on split chains (at convergence Rhat=1).\nWarning messages:\n1: There were 100 divergent transitions after warmup. See\nhttps://mc-stan.org/misc/warnings.html#divergent-transitions-after-warmup\nto find out why this is a problem and how to eliminate them.\n2: Examine the pairs() plot to diagnose sampling problems\n3: The largest R-hat is 1.1, indicating chains have not mixed.\nRunning the chains for more iterations may help. See\nhttps://mc-stan.org/misc/warnings.html#r-hat\n4: Bulk Effective Samples Size (ESS) is too low, indicating posterior means and medians may be unreliable.\nRunning the chains for more iterations may help. See\nhttps://mc-stan.org/misc/warnings.html#bulk-ess\n5: Tail Effective Samples Size (ESS) is too low, indicating posterior variances and tail quantiles may be unreliable.\nRunning the chains for more iterations may help. See\nhttps://mc-stan.org/misc/warnings.html#tail-ess\n6: Markov chains did not converge! Do not analyze results!"
    },
    "gauss": {
      "blurb": "A well behaved gaussian fit: every Rhat sits at 1.00 and n_eff is in the thousands. This is what a trustworthy fit looks like.",
      "engine": "rstanarm",
      "label": "Healthy linear model",
      "r": "library(rstanarm)\nfit <- stan_glm(mpg ~ wt + hp, data = mtcars, seed = 1234)\nprint(summary(fit), digits = 3)",
      "text": "\nModel Info:\n function:     stan_glm\n family:       gaussian [identity]\n formula:      mpg ~ wt + hp\n algorithm:    sampling\n sample:       4000 (posterior sample size)\n priors:       see help('prior_summary')\n observations: 32\n predictors:   3\n\nEstimates:\n              mean   sd     10%    50%    90% \n(Intercept) 37.217  1.656 35.084 37.245 39.253\nwt          -3.868  0.659 -4.705 -3.858 -3.033\nhp          -0.032  0.009 -0.043 -0.032 -0.020\nsigma        2.672  0.361  2.251  2.634  3.141\n\nFit Diagnostics:\n           mean   sd     10%    50%    90% \nmean_PPD 20.092  0.651 19.284 20.095 20.931\n\nThe mean_ppd is the sample average posterior predictive distribution of the outcome variable (for details see help('summary.stanreg')).\n\nMCMC diagnostics\n              mcse  Rhat  n_eff\n(Intercept)   0.031 1.000 2935 \nwt            0.015 1.002 1914 \nhp            0.000 1.002 1876 \nsigma         0.007 1.000 2699 \nmean_PPD      0.011 1.000 3822 \nlog-posterior 0.035 1.001 1780 \n\nFor each parameter, mcse is Monte Carlo standard error, n_eff is a crude measure of effective sample size, and Rhat is the potential scale reduction factor on split chains (at convergence Rhat=1)."
    },
    "logit": {
      "blurb": "The wells example from the rstanarm documentation. Coefficients are on the log-odds scale, so they need exponentiating before they mean anything.",
      "engine": "rstanarm",
      "label": "Logistic regression",
      "r": "library(rstanarm)\ndata(wells)\nwells$dist100 <- wells$dist / 100\nfit <- stan_glm(switch ~ dist100 + arsenic, data = wells,\n                family = binomial(link = \"logit\"), seed = 4321)\nprint(summary(fit), digits = 3)",
      "text": "\nModel Info:\n function:     stan_glm\n family:       binomial [logit]\n formula:      switch ~ dist100 + arsenic\n algorithm:    sampling\n sample:       4000 (posterior sample size)\n priors:       see help('prior_summary')\n observations: 3020\n predictors:   3\n\nEstimates:\n              mean   sd     10%    50%    90% \n(Intercept)  0.002  0.080 -0.102  0.003  0.105\ndist100     -0.898  0.104 -1.032 -0.896 -0.764\narsenic      0.462  0.042  0.408  0.462  0.515\n\nFit Diagnostics:\n           mean   sd    10%   50%   90%\nmean_PPD 0.575  0.013 0.559 0.575 0.591\n\nThe mean_ppd is the sample average posterior predictive distribution of the outcome variable (for details see help('summary.stanreg')).\n\nMCMC diagnostics\n              mcse  Rhat  n_eff\n(Intercept)   0.001 0.999 4652 \ndist100       0.002 1.000 3839 \narsenic       0.001 1.000 2975 \nmean_PPD      0.000 1.000 3653 \nlog-posterior 0.030 1.001 1681 \n\nFor each parameter, mcse is Monte Carlo standard error, n_eff is a crude measure of effective sample size, and Rhat is the potential scale reduction factor on split chains (at convergence Rhat=1)."
    },
    "mlm": {
      "blurb": "A varying intercept per cylinder count. Adds the b[] group offsets and the Sigma[] variance row that only multilevel output carries.",
      "engine": "rstanarm",
      "label": "Multilevel model",
      "r": "library(rstanarm)\nfit <- stan_glmer(mpg ~ wt + (1 | cyl), data = mtcars, seed = 2024)\nprint(summary(fit), digits = 3)",
      "text": "\nModel Info:\n function:     stan_glmer\n family:       gaussian [identity]\n formula:      mpg ~ wt + (1 | cyl)\n algorithm:    sampling\n sample:       4000 (posterior sample size)\n priors:       see help('prior_summary')\n observations: 32\n groups:       cyl (3)\n\nEstimates:\n                                     mean   sd     10%    50%    90% \n(Intercept)                        32.102  3.395 27.719 32.177 36.375\nwt                                 -3.690  0.844 -4.779 -3.661 -2.661\nb[(Intercept) cyl:4]                2.654  2.340  0.042  2.548  5.542\nb[(Intercept) cyl:6]               -0.705  2.200 -3.251 -0.592  1.767\nb[(Intercept) cyl:8]               -2.041  2.323 -4.836 -1.832  0.449\nsigma                               2.699  0.385  2.249  2.665  3.187\nSigma[cyl:(Intercept),(Intercept)] 13.301 17.717  1.658  7.638 30.459\n\nFit Diagnostics:\n           mean   sd     10%    50%    90% \nmean_PPD 20.094  0.675 19.243 20.079 20.961\n\nThe mean_ppd is the sample average posterior predictive distribution of the outcome variable (for details see help('summary.stanreg')).\n\nMCMC diagnostics\n                                   mcse  Rhat  n_eff\n(Intercept)                        0.105 1.002 1041 \nwt                                 0.021 1.000 1554 \nb[(Intercept) cyl:4]               0.081 1.003  836 \nb[(Intercept) cyl:6]               0.072 1.003  943 \nb[(Intercept) cyl:8]               0.077 1.003  905 \nsigma                              0.008 1.000 2487 \nSigma[cyl:(Intercept),(Intercept)] 0.504 1.003 1233 \nmean_PPD                           0.010 1.000 4195 \nlog-posterior                      0.078 1.003  959 \n\nFor each parameter, mcse is Monte Carlo standard error, n_eff is a crude measure of effective sample size, and Rhat is the potential scale reduction factor on split chains (at convergence Rhat=1)."
    },
    "weak": {
      "blurb": "The same kind of model run for 50 iterations instead of 2000. The Rhat and n_eff columns are what a fit you must not report looks like.",
      "engine": "rstanarm",
      "label": "Too few iterations",
      "r": "library(rstanarm)\n# iter = 50 is deliberately far too short\nfit <- stan_glm(mpg ~ wt + hp + disp + drat, data = mtcars,\n                chains = 4, iter = 50, seed = 99)\nprint(summary(fit), digits = 3)",
      "text": "\nModel Info:\n function:     stan_glm\n family:       gaussian [identity]\n formula:      mpg ~ wt + hp + disp + drat\n algorithm:    sampling\n sample:       100 (posterior sample size)\n priors:       see help('prior_summary')\n observations: 32\n predictors:   5\n\nEstimates:\n              mean   sd     10%    50%    90% \n(Intercept) 24.829 15.532 11.567 26.308 39.727\nwt          -3.460  2.081 -6.021 -3.322 -1.061\nhp          -0.038  0.025 -0.061 -0.037 -0.011\ndisp         0.006  0.026 -0.024  0.001  0.030\ndrat         2.103  3.160 -0.683  2.013  4.603\nsigma        4.956  3.006  2.791  3.953  7.567\n\nFit Diagnostics:\n           mean   sd     10%    50%    90% \nmean_PPD 17.125  3.553 12.406 18.028 19.960\n\nThe mean_ppd is the sample average posterior predictive distribution of the outcome variable (for details see help('summary.stanreg')).\n\nMCMC diagnostics\n              mcse  Rhat  n_eff\n(Intercept)   1.985 1.028 61   \nwt            0.315 1.087 44   \nhp            0.003 1.036 70   \ndisp          0.003 1.079 55   \ndrat          0.365 0.984 75   \nsigma         1.480 2.448  4   \nmean_PPD      1.779 3.007  4   \nlog-posterior 8.497 3.970  3   \n\nFor each parameter, mcse is Monte Carlo standard error, n_eff is a crude measure of effective sample size, and Rhat is the potential scale reduction factor on split chains (at convergence Rhat=1).\nWarning messages:\n1: There were 8 divergent transitions after warmup. See\nhttps://mc-stan.org/misc/warnings.html#divergent-transitions-after-warmup\nto find out why this is a problem and how to eliminate them.\n2: There were 1 chains where the estimated Bayesian Fraction of Missing Information was low. See\nhttps://mc-stan.org/misc/warnings.html#bfmi-low\n3: Examine the pairs() plot to diagnose sampling problems\n4: The largest R-hat is 2.68, indicating chains have not mixed.\nRunning the chains for more iterations may help. See\nhttps://mc-stan.org/misc/warnings.html#r-hat\n5: Bulk Effective Samples Size (ESS) is too low, indicating posterior means and medians may be unreliable.\nRunning the chains for more iterations may help. See\nhttps://mc-stan.org/misc/warnings.html#bulk-ess\n6: Tail Effective Samples Size (ESS) is too low, indicating posterior variances and tail quantiles may be unreliable.\nRunning the chains for more iterations may help. See\nhttps://mc-stan.org/misc/warnings.html#tail-ess\n7: Markov chains did not converge! Do not analyze results!"
    }
  }
};
}));
