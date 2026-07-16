/* coxph-presets.js - GENERATED, do not hand-edit.
   Source: Scripts/tool-truth/coxph-output-interpreter.json, written by
   Scripts/tool-truth/coxph-output-interpreter.R (R 4.6.0 survival).
   Regenerate: python Scripts/tool-truth/gen-coxph-presets.py
   Every string below is byte-for-byte what summary(coxph(...)) printed. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.CoxPresets = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
  "sex": {
    label: "sex only",
    blurb: "The classic teaching fit: one binary covariate on the NCCTG lung cancer data.",
    text: "Call:\ncoxph(formula = Surv(time, status) ~ sex, data = lung)\n\n  n= 228, number of events= 165 \n\n       coef exp(coef) se(coef)      z Pr(>|z|)   \nsex -0.5310    0.5880   0.1672 -3.176  0.00149 **\n---\nSignif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n\n    exp(coef) exp(-coef) lower .95 upper .95\nsex     0.588      1.701    0.4237     0.816\n\nConcordance= 0.579  (se = 0.021 )\nLikelihood ratio test= 10.63  on 1 df,   p=0.001\nWald test            = 10.09  on 1 df,   p=0.001\nScore (logrank) test = 10.33  on 1 df,   p=0.001\n"
  },
  "multi": {
    label: "age + sex + ph.ecog",
    blurb: "Three covariates, one of them continuous, and a row that is not significant.",
    text: "Call:\ncoxph(formula = Surv(time, status) ~ age + sex + ph.ecog, data = lung)\n\n  n= 227, number of events= 164 \n   (1 observation deleted due to missingness)\n\n             coef exp(coef)  se(coef)      z Pr(>|z|)    \nage      0.011067  1.011128  0.009267  1.194 0.232416    \nsex     -0.552612  0.575445  0.167739 -3.294 0.000986 ***\nph.ecog  0.463728  1.589991  0.113577  4.083 4.45e-05 ***\n---\nSignif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n\n        exp(coef) exp(-coef) lower .95 upper .95\nage        1.0111     0.9890    0.9929    1.0297\nsex        0.5754     1.7378    0.4142    0.7994\nph.ecog    1.5900     0.6289    1.2727    1.9864\n\nConcordance= 0.637  (se = 0.025 )\nLikelihood ratio test= 30.5  on 3 df,   p=1e-06\nWald test            = 29.93  on 3 df,   p=1e-06\nScore (logrank) test = 30.5  on 3 df,   p=1e-06\n"
  },
  "factor": {
    label: "a factor and four terms",
    blurb: "A named factor level plus three continuous terms, and two rows worth arguing about.",
    text: "Call:\ncoxph(formula = Surv(time, status) ~ age + sexf + ph.karno + \n    wt.loss, data = lung2)\n\n  n= 214, number of events= 152 \n   (14 observations deleted due to missingness)\n\n                coef exp(coef)  se(coef)      z Pr(>|z|)   \nage         0.015140  1.015255  0.009837  1.539  0.12379   \nsexffemale -0.513955  0.598125  0.174410 -2.947  0.00321 **\nph.karno   -0.012871  0.987211  0.006184 -2.081  0.03741 * \nwt.loss    -0.002246  0.997757  0.006357 -0.353  0.72389   \n---\nSignif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n\n           exp(coef) exp(-coef) lower .95 upper .95\nage           1.0153      0.985    0.9959    1.0350\nsexffemale    0.5981      1.672    0.4249    0.8419\nph.karno      0.9872      1.013    0.9753    0.9993\nwt.loss       0.9978      1.002    0.9854    1.0103\n\nConcordance= 0.643  (se = 0.027 )\nLikelihood ratio test= 18.84  on 4 df,   p=8e-04\nWald test            = 18.68  on 4 df,   p=9e-04\nScore (logrank) test = 18.99  on 4 df,   p=8e-04\n"
  }
  };
}));
