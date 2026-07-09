# Ground truth for tools/lib/glm-math.js  (glm-output-interpreter)
# R 4.6.0.  Covers every quantity the tool recomputes from a parsed
# summary(glm()): per-coefficient statistic (z for fixed-dispersion families,
# t on residual df for estimated-dispersion families) + two-sided p, Wald CIs
# (confint.default) at 90/95/99, exp(coef) + exp(CI) odds/rate ratios, the
# model-level likelihood-ratio test (null - residual deviance ~ chi-sq),
# McFadden / deviance-ratio pseudo-R2, deviance goodness-of-fit p, dispersion,
# BIC reconstruction from AIC, and nested-model tests (chi-sq + quasi F).
# Ground truth = stats::glm / summary / confint.default / AIC / BIC / logLik /
# anova / pchisq / pf ; MASS::glm.nb.
options(digits = 17, scipen = 999)
suppressWarnings(suppressMessages({ library(jsonlite); library(MASS) }))
setwd(dirname(sub("--file=", "", grep("--file=", commandArgs(FALSE), value = TRUE))))

# ---------------------------------------------------------------------------
# Family -> (does the tool use z or t for the coefficient p-value?)
#   binomial / poisson / negbin  -> dispersion fixed = 1  -> z (normal)
#   quasi* / Gamma / gaussian    -> dispersion estimated  -> t on residual df
# ---------------------------------------------------------------------------
dist_for <- function(fam) {
  if (fam %in% c("binomial", "poisson", "negbin")) "z" else "t"
}

fit_case <- function(name, fit, family, link, expify, isNB = FALSE) {
  s      <- summary(fit)
  co     <- s$coefficients                 # Estimate, Std.Error, z-or-t, Pr
  terms  <- rownames(co)
  dfres  <- fit$df.residual
  ci90   <- suppressMessages(confint.default(fit, level = 0.90))
  ci95   <- suppressMessages(confint.default(fit, level = 0.95))
  ci99   <- suppressMessages(confint.default(fit, level = 0.99))
  coefs  <- lapply(seq_along(terms), function(i) {
    est <- co[i, 1L]; se <- co[i, 2L]
    row <- list(
      term = terms[i], est = est, se = se,
      stat = co[i, 3L], p = co[i, 4L],
      ci90 = as.numeric(ci90[i, ]),
      ci95 = as.numeric(ci95[i, ]),
      ci99 = as.numeric(ci99[i, ])
    )
    if (expify) {
      row$exp_est <- exp(est)
      row$exp_ci95 <- as.numeric(exp(ci95[i, ]))
    }
    row
  })

  nullDev <- fit$null.deviance; nullDf <- fit$df.null
  residDev <- fit$deviance;     residDf <- fit$df.residual
  lr   <- nullDev - residDev
  lrdf <- nullDf - residDf
  lrp  <- pchisq(lr, lrdf, lower.tail = FALSE)

  # null model for exact McFadden (log-likelihood based)
  nullfit <- update(fit, . ~ 1)
  mcf <- 1 - as.numeric(logLik(fit)) / as.numeric(logLik(nullfit))
  devratio <- 1 - residDev / nullDev
  gofp <- pchisq(residDev, residDf, lower.tail = FALSE)  # deviance GOF / overdispersion

  disp <- s$dispersion
  aic  <- tryCatch(AIC(fit), error = function(e) NA_real_)
  bic  <- tryCatch(BIC(fit), error = function(e) NA_real_)
  k    <- tryCatch(attr(logLik(fit), "df"), error = function(e) NA_real_)

  list(
    name = name, family = family, link = link, exp = expify, dist = dist_for(family),
    coefs = coefs,
    nullDev = nullDev, nullDf = nullDf, residDev = residDev, residDf = residDf,
    lr = lr, lrdf = lrdf, lrp = lrp,
    mcfadden = mcf, devratio = devratio, gofp = gofp,
    dispersion = disp, aic = aic, bic = bic, k = k, n = as.numeric(nobs(fit))
  )
}

# ---- Synthetic positive-continuous data for the Gamma case (deterministic) --
set.seed(42)
n_g <- 200
gload <- runif(n_g, 0, 3)
gprio <- rbinom(n_g, 1, 0.5)
gmu   <- exp(1.4 + 0.32 * gload - 0.18 * gprio)
gwait <- rgamma(n_g, shape = 2, scale = gmu / 2)         # positive continuous
svc   <- data.frame(wait = gwait, load = gload, priority = gprio)

# ---- Real / semi-real fitted models ---------------------------------------
fits <- list(
  fit_case("logistic_mtcars",
           glm(am ~ wt + hp, family = binomial, data = mtcars),
           "binomial", "logit", TRUE),
  fit_case("probit_mtcars",
           glm(am ~ wt + hp, family = binomial(link = "probit"), data = mtcars),
           "binomial", "probit", FALSE),
  fit_case("poisson_warpbreaks",
           glm(breaks ~ wool + tension, family = poisson, data = warpbreaks),
           "poisson", "log", TRUE),
  fit_case("quasipoisson_warpbreaks",
           glm(breaks ~ wool + tension, family = quasipoisson, data = warpbreaks),
           "quasipoisson", "log", TRUE),
  fit_case("gamma_log_svc",
           glm(wait ~ load + priority, family = Gamma(link = "log"), data = svc),
           "Gamma", "log", TRUE),
  fit_case("gaussian_mtcars",
           glm(mpg ~ wt + hp, family = gaussian, data = mtcars),
           "gaussian", "identity", FALSE),
  fit_case("negbin_warpbreaks",
           glm.nb(breaks ~ wool + tension, data = warpbreaks),
           "negbin", "log", TRUE, isNB = TRUE)
)

# ---- Nested chi-sq tests (non-quasi): anova(small, big, test = "Chisq") ----
nested_chisq_case <- function(name, small, big) {
  a <- anova(small, big, test = "Chisq")
  list(name = name,
       devSmall = small$deviance, dfSmall = small$df.residual,
       devBig   = big$deviance,   dfBig   = big$df.residual,
       dev = a[["Deviance"]][2L], df = a[["Df"]][2L], p = a[["Pr(>Chi)"]][2L])
}
nested_chisq <- list(
  nested_chisq_case("pois_1v2",
    glm(breaks ~ wool, family = poisson, data = warpbreaks),
    glm(breaks ~ wool + tension, family = poisson, data = warpbreaks)),
  nested_chisq_case("logit_1v2",
    glm(am ~ wt, family = binomial, data = mtcars),
    glm(am ~ wt + hp, family = binomial, data = mtcars))
)

# ---- Nested quasi F test: anova(small, big, test = "F") --------------------
nested_f_case <- function(name, small, big) {
  a <- anova(small, big, test = "F")
  phiBig <- summary(big)$dispersion
  list(name = name,
       devSmall = small$deviance, dfSmall = small$df.residual,
       devBig   = big$deviance,   dfBig   = big$df.residual,
       phiBig = phiBig,
       f = a[["F"]][2L], df = a[["Df"]][2L], p = a[["Pr(>F)"]][2L])
}
nested_f <- list(
  nested_f_case("qpois_1v2",
    glm(breaks ~ wool, family = quasipoisson, data = warpbreaks),
    glm(breaks ~ wool + tension, family = quasipoisson, data = warpbreaks))
)

# ---- Chi-square upper-tail edges (LR / GOF p) ------------------------------
chisq_edge <- function(x, k) list(x = x, k = k, upper = pchisq(x, k, lower.tail = FALSE))
chisq_edges <- list(
  chisq_edge(33.171, 2),    # logistic_mtcars LR
  chisq_edge(86.98, 3),     # poisson LR
  chisq_edge(0.5, 1),
  chisq_edge(210.39, 50),   # warpbreaks resid deviance GOF
  chisq_edge(1e-8, 4),
  chisq_edge(500, 10),
  chisq_edge(2.5, 5)
)

# ---- F upper-tail edges (quasi nested) -------------------------------------
f_edge <- function(f, df1, df2) list(f = f, df1 = df1, df2 = df2,
                                     p = pf(f, df1, df2, lower.tail = FALSE))
f_edges <- list(
  f_edge(10.2, 2, 50),
  f_edge(0.8, 1, 100),
  f_edge(45, 3, 197),
  f_edge(1e4, 2, 500),
  f_edge(1, 5, 5)
)

# ---- Synthetic coefficient edges: z family (Wald normal CI) ----------------
coef_z_edge <- function(est, se) {
  stat <- est / se
  q90 <- qnorm(0.95); q95 <- qnorm(0.975); q99 <- qnorm(0.995)
  list(est = est, se = se, stat = stat, p = 2 * pnorm(-abs(stat)),
       ci90 = c(est - q90 * se, est + q90 * se),
       ci95 = c(est - q95 * se, est + q95 * se),
       ci99 = c(est - q99 * se, est + q99 * se),
       exp_est = exp(est),
       exp_ci95 = c(exp(est - q95 * se), exp(est + q95 * se)))
}
coef_z_edges <- list(
  coef_z_edge(0.036, 0.0177),   # small positive log-OR
  coef_z_edge(-8.08, 3.07),     # large negative
  coef_z_edge(12, 0.01),        # huge z -> p ~ 0
  coef_z_edge(1e-5, 1),         # z ~ 0 -> p ~ 1
  coef_z_edge(3.69, 0.045)      # big intercept
)

# ---- Synthetic coefficient edges: t family (still Wald qnorm CI, t p) ------
coef_t_edge <- function(est, se, df) {
  stat <- est / se
  q90 <- qnorm(0.95); q95 <- qnorm(0.975); q99 <- qnorm(0.995)  # confint.default = normal
  list(est = est, se = se, df = df, stat = stat, p = 2 * pt(-abs(stat), df),
       ci90 = c(est - q90 * se, est + q90 * se),
       ci95 = c(est - q95 * se, est + q95 * se),
       ci99 = c(est - q99 * se, est + q99 * se))
}
coef_t_edges <- list(
  coef_t_edge(0.321, 0.0423, 197),
  coef_t_edge(-0.182, 0.0561, 197),
  coef_t_edge(2.5, 0.8, 3),
  coef_t_edge(1.234, 0.987, 1)
)

# ---- BIC reconstruction from AIC: BIC = AIC - 2k + log(n)*k -----------------
bic_edge <- function(fit) {
  k <- attr(logLik(fit), "df"); n <- nobs(fit)
  list(aic = AIC(fit), k = as.numeric(k), n = as.numeric(n), bic = BIC(fit))
}
bic_edges <- list(
  bic_edge(glm(am ~ wt + hp, family = binomial, data = mtcars)),
  bic_edge(glm(breaks ~ wool + tension, family = poisson, data = warpbreaks)),
  bic_edge(glm(mpg ~ wt + hp, family = gaussian, data = mtcars)),
  bic_edge(glm(wait ~ load + priority, family = Gamma(link = "log"), data = svc))
)

out <- list(
  fits         = fits,
  nested_chisq = nested_chisq,
  nested_f     = nested_f,
  chisq_edges  = chisq_edges,
  f_edges      = f_edges,
  coef_z_edges = coef_z_edges,
  coef_t_edges = coef_t_edges,
  bic_edges    = bic_edges
)
writeLines(toJSON(out, auto_unbox = TRUE, digits = 17, na = "string"),
           "glm-output-interpreter.json")
cat("wrote glm-output-interpreter.json:",
    length(fits), "fits,",
    length(nested_chisq), "nested-chisq,",
    length(nested_f), "nested-F,",
    length(chisq_edges), "chisq edges,",
    length(f_edges), "F edges,",
    length(coef_z_edges), "z-coef edges,",
    length(coef_t_edges), "t-coef edges,",
    length(bic_edges), "BIC edges\n")
