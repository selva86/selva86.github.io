# Ground truth for tools/lib/lm-math.js  (lm-output-interpreter)
# R 4.6.0.  Covers every quantity the tool recomputes from a parsed
# summary(lm()): per-coefficient t & two-sided p, coefficient CIs at
# 90/95/99, the overall F-statistic p-value, R-squared <-> F, and
# adjusted R-squared.  Ground truth = stats::lm / summary / confint / pf / pt / qt.
options(digits = 17, scipen = 999)
suppressWarnings(suppressMessages(library(jsonlite)))
setwd(dirname(sub("--file=", "", grep("--file=", commandArgs(FALSE), value = TRUE))))

# ---- Real fitted models: full coef table + CIs + F + R2/adjR2 ----------
model_case <- function(name, model) {
  s  <- summary(model)
  co <- s$coefficients                 # Estimate, Std. Error, t value, Pr(>|t|)
  dfres <- s$df[2L]                    # residual degrees of freedom
  terms <- rownames(co)
  ci90 <- confint(model, level = 0.90)
  ci95 <- confint(model, level = 0.95)
  ci99 <- confint(model, level = 0.99)
  coefs <- lapply(seq_along(terms), function(i) list(
    term     = terms[i],
    estimate = co[i, 1L],
    se       = co[i, 2L],
    df       = dfres,
    t        = co[i, 3L],
    p        = co[i, 4L],
    ci90     = as.numeric(ci90[i, ]),
    ci95     = as.numeric(ci95[i, ]),
    ci99     = as.numeric(ci99[i, ])
  ))
  fs  <- s$fstatistic                  # value, numdf, dendf
  fval <- unname(fs[1L]); df1 <- unname(fs[2L]); df2 <- unname(fs[3L])
  n    <- length(model$residuals)
  rss  <- sum(model$residuals^2)       # residual sum of squares
  list(
    name   = name,
    coefs  = coefs,
    r2     = s$r.squared,
    adjr2  = s$adj.r.squared,
    f      = fval, df1 = df1, df2 = df2,
    fp     = pf(fval, df1, df2, lower.tail = FALSE),
    sigma  = s$sigma,
    dfres  = dfres,
    n      = n,
    npar   = length(terms),           # coefficients incl. intercept (k+1)
    rss    = rss,
    aic    = AIC(model),               # exact stats::AIC
    bic    = BIC(model),               # exact stats::BIC
    loglik = as.numeric(logLik(model)) # exact stats::logLik
  )
}

models <- list(
  model_case("mtcars_mpg_wt",        lm(mpg ~ wt, mtcars)),
  model_case("mtcars_mpg_wt_hp",     lm(mpg ~ wt + hp, mtcars)),
  model_case("mtcars_full",          lm(mpg ~ wt + hp + qsec + am, mtcars)),
  model_case("iris_petal",           lm(Petal.Length ~ Sepal.Length + Sepal.Width, iris)),
  model_case("iris_species_factor",  lm(Petal.Length ~ Species, iris)),
  model_case("airquality",           lm(Ozone ~ Solar.R + Wind + Temp, airquality)),
  model_case("trees",                lm(Volume ~ Girth + Height, trees))
)

# ---- Synthetic coefficient edge cases (control extremes exactly) --------
coef_edge <- function(est, se, df) {
  tval <- est / se
  q90 <- qt(0.95, df); q95 <- qt(0.975, df); q99 <- qt(0.995, df)
  list(
    estimate = est, se = se, df = df,
    t = tval,
    p = 2 * pt(-abs(tval), df),
    ci90 = c(est - q90 * se, est + q90 * se),
    ci95 = c(est - q95 * se, est + q95 * se),
    ci99 = c(est - q99 * se, est + q99 * se)
  )
}
coef_edges <- list(
  coef_edge(0.5,   0.5,  5),      # t = 1, tiny n
  coef_edge(10,    0.01, 100),    # huge t -> p ~ 0
  coef_edge(1e-4,  1,    30),     # t ~ 0 -> p ~ 1
  coef_edge(-3.2,  1.1,  8),      # negative estimate
  coef_edge(2.5,   0.8,  2),      # df = 2
  coef_edge(1.5e6, 1,    1000),   # extreme t
  coef_edge(1.234, 0.987, 1)      # df = 1 (Cauchy)
)

# ---- Overall F-statistic p-value edge cases -----------------------------
f_edge <- function(f, df1, df2) list(f = f, df1 = df1, df2 = df2,
                                     fp = pf(f, df1, df2, lower.tail = FALSE))
f_edges <- list(
  f_edge(5,     1,  30),
  f_edge(0.5,   3,  100),
  f_edge(200,   4,  27),
  f_edge(1e5,   2,  1000),
  f_edge(1,     5,  5),
  f_edge(0.01, 10,  50),
  f_edge(2.2e2, 1,  2)
)

# ---- adjusted R-squared from (r2, n, k) ---------------------------------
# R: adjr2 = 1 - (1 - r2) * (n - 1) / (n - k - 1),  k = predictors (F numdf)
adj_edge <- function(r2, n, k) list(r2 = r2, n = n, k = k,
                                    adjr2 = 1 - (1 - r2) * (n - 1) / (n - k - 1))
adj_edges <- list(
  adj_edge(0.75,  32, 2),
  adj_edge(0.999, 150, 3),
  adj_edge(0.05,  100, 5),
  adj_edge(0.5,   10,  3),
  adj_edge(0.0,   20,  1)
)

# ---- R2 <-> F identity: R2 = df1*F / (df1*F + df2) ----------------------
r2_from_f <- function(f, df1, df2) list(f = f, df1 = df1, df2 = df2,
                                        r2 = (df1 * f) / (df1 * f + df2))
r2_edges <- list(
  r2_from_f(20,  2, 29),
  r2_from_f(100, 3, 146),
  r2_from_f(0.5, 4, 50)
)

# ---- Nested-model anova F-test: reproduce anova(fit_small, fit_big) -----
# From two parsed summaries we know RSS and residual df of each model.
# F = ((RSS_s - RSS_b)/(df_s - df_b)) / (RSS_b/df_b),  p = pf(.., lower=FALSE)
nested_case <- function(name, small, big) {
  a <- anova(small, big)               # R's ground-truth nested F-test
  rss_s <- sum(small$residuals^2); df_s <- small$df.residual
  rss_b <- sum(big$residuals^2);   df_b <- big$df.residual
  list(
    name  = name,
    rss_s = rss_s, df_s = df_s,
    rss_b = rss_b, df_b = df_b,
    f     = a[["F"]][2L],
    df1   = a[["Df"]][2L],
    df2   = df_b,
    p     = a[["Pr(>F)"]][2L]
  )
}
nested <- list(
  nested_case("mtcars_1v2",
              lm(mpg ~ wt, mtcars),
              lm(mpg ~ wt + hp, mtcars)),
  nested_case("mtcars_2v4",
              lm(mpg ~ wt + hp, mtcars),
              lm(mpg ~ wt + hp + qsec + am, mtcars)),
  nested_case("iris_1v2",
              lm(Petal.Length ~ Sepal.Length, iris),
              lm(Petal.Length ~ Sepal.Length + Sepal.Width, iris))
)

# ---- AIC/BIC/logLik reconstruction from (n, rss, npar) ------------------
# logLik(lm) = -n/2 * (log(2*pi) + 1 - log(n) + log(rss))
# AIC = -2*logLik + 2*(npar+1);  BIC = -2*logLik + log(n)*(npar+1)
#   npar here = coefficients incl. intercept; the +1 is the estimated sigma.
ic_case <- function(n, rss, npar) {
  ll  <- -n / 2 * (log(2 * pi) + 1 - log(n) + log(rss))
  k1  <- npar + 1
  list(n = n, rss = rss, npar = npar,
       loglik = ll, aic = -2 * ll + 2 * k1, bic = -2 * ll + log(n) * k1)
}
ic_edges <- list(
  ic_case(32, 195.46, 3),
  ic_case(150, 7.24, 4),
  ic_case(20, 1.0e-3, 2),
  ic_case(100, 5000, 6)
)

out <- list(
  models     = models,
  coef_edges = coef_edges,
  f_edges    = f_edges,
  adj_edges  = adj_edges,
  r2_edges   = r2_edges,
  nested     = nested,
  ic_edges   = ic_edges
)
writeLines(toJSON(out, auto_unbox = TRUE, digits = 17, na = "string"),
           "lm-output-interpreter.json")
cat("wrote lm-output-interpreter.json:",
    length(models), "models,",
    length(coef_edges), "coef edges,",
    length(f_edges), "F edges,",
    length(adj_edges), "adjR2 edges,",
    length(nested), "nested,",
    length(ic_edges), "IC edges\n")
