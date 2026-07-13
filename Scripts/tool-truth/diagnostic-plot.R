# diagnostic-plot truth table  ---  ground truth = R 4.6.0 stats::lm + lmtest
# Emits Scripts/tool-truth/diagnostic-plot.json : frozen raw datasets + every
# diagnostic number R produces (hatvalues, rstandard, cooks.distance) and the
# four formal tests (bptest, resettest, shapiro.test, dwtest).
#
# The v2 tool actually FITS lm(y ~ x1 + ...) in the browser (the predecessor
# never did), so the truth table is a real fit on frozen data. The SAME rounded
# numbers are embedded in the page, so R, the math lib and the page agree.
suppressWarnings(suppressMessages({
  library(lmtest)
  library(jsonlite)
}))

rd <- function(x, d = 10) if (is.null(x)) NULL else round(x, d)

# ---- build one frozen dataset: named predictor columns + response y ---------
# vals rounded to 4 dp so the browser can embed identical numbers.
freeze <- function(df) {
  df[] <- lapply(df, function(c) round(as.numeric(c), 4))
  df
}

datasets <- list()
labels    <- list()

# clean: y = 2 + 1.5 x + N(0,1)  -- all assumptions hold, 1 predictor
set.seed(21)
x <- round(runif(40, 0, 10), 4)
datasets$clean <- freeze(data.frame(y = 2 + 1.5 * x + rnorm(40, 0, 1), x = x))
labels$clean   <- "Healthy fit - all assumptions hold"

# hetero: spread grows with x (variance fans out)
set.seed(22)
x <- round(runif(40, 0, 10), 4)
datasets$hetero <- freeze(data.frame(y = 2 + 1.5 * x + rnorm(40, 0, 0.25 + 0.35 * x), x = x))
labels$hetero   <- "Spread grows with X - heteroscedastic"

# nonlinear: true quadratic, fit as straight line (missing curvature)
set.seed(33)
x <- round(runif(40, -5, 5), 4)
datasets$nonlinear <- freeze(data.frame(y = 3 + 0.4 * x + 0.45 * x^2 + rnorm(40, 0, 1.2), x = x))
labels$nonlinear   <- "A curve the model missed - nonlinear"

# outlier: clean line with two large vertical outliers
set.seed(44)
x <- round(runif(40, 0, 10), 4)
y <- 2 + 1.5 * x + rnorm(40, 0, 1)
y[6]  <- y[6]  + 9
y[27] <- y[27] - 8
datasets$outlier <- freeze(data.frame(y = y, x = x))
labels$outlier   <- "One value way off - outliers"

# influence: one high-leverage point that drags the line (high Cook's d)
set.seed(55)
x <- round(runif(39, 0, 10), 4)
y <- 2 + 1.5 * x + rnorm(39, 0, 1)
x <- c(x, 24)          # far-out x  -> high leverage
y <- c(y, 12)          # off the line -> influential
datasets$influence <- freeze(data.frame(y = round(y, 4), x = x))
labels$influence   <- "One point dragging the line - high leverage"

# mtcars: REAL two-predictor fit  mpg ~ wt + hp  (matches the R emitter example)
datasets$mtcars <- freeze(data.frame(mpg = mtcars$mpg, wt = mtcars$wt, hp = mtcars$hp))
labels$mtcars   <- "mtcars: mpg ~ wt + hp (multiple regression)"

# tiny: small-sample edge (n = 6) - tests still run, low power
datasets$tiny <- freeze(data.frame(y = c(1.2, 2.9, 3.1, 5.4, 4.8, 7.1),
                                    x = c(1, 2, 3, 4, 5, 6)))
labels$tiny   <- "Tiny sample (n=6) - low power edge case"

# ---- compute every diagnostic R produces, for one dataset ------------------
analyse <- function(df) {
  resp <- names(df)[1]
  preds <- names(df)[-1]
  form <- as.formula(paste(resp, "~", paste(preds, collapse = " + ")))
  fit <- lm(form, data = df)
  n <- nrow(df)
  p <- length(coef(fit))                 # incl. intercept
  s <- summary(fit)
  e   <- unname(residuals(fit))
  fv  <- unname(fitted(fit))
  hat <- unname(hatvalues(fit))
  rst <- unname(rstandard(fit))
  ck  <- unname(cooks.distance(fit))

  bp <- bptest(fit)                                        # studentized (Koenker)
  rs <- resettest(fit, power = 2:3, type = "fitted")       # F test, fitted powers
  dw <- dwtest(fit)
  sw <- shapiro.test(e)

  # residuals-mode (predecessor parity): user pastes only e + fitted.
  # Heteroscedasticity = Breusch-Pagan score of e^2 on fitted (single regressor);
  # Nonlinearity = Ramsey RESET of e on fitted^2, fitted^3. Both exact, base R.
  e2 <- e^2
  aux_h <- lm(e2 ~ fv)
  rbp <- n * summary(aux_h)$r.squared
  rbp_p <- pchisq(rbp, 1, lower.tail = FALSE)
  rm1 <- lm(e ~ fv); rm2 <- lm(e ~ fv + I(fv^2) + I(fv^3))
  ran <- anova(rm1, rm2)
  rreset <- ran$F[2]; rreset_p <- ran$`Pr(>F)`[2]

  a <- ifelse(n <= 10, 3/8, 0.5)
  pp <- (1:n - a) / (n + 1 - 2 * a)                        # ppoints(n)

  list(
    resp = resp, preds = preds, n = n, p = p, df_resid = fit$df.residual,
    coef = rd(unname(coef(fit))),
    coef_names = names(coef(fit)),
    sigma = rd(s$sigma), r_squared = rd(s$r.squared), adj_r2 = rd(s$adj.r.squared),
    fstat = rd(unname(s$fstatistic[1])), fstat_df1 = unname(s$fstatistic[2]),
    fstat_df2 = unname(s$fstatistic[3]),
    fitted = rd(fv), resid = rd(e), hat = rd(hat), rstandard = rd(rst), cooks = rd(ck),
    ppoints = rd(pp), qq_theo = rd(qnorm(pp)),
    bp_stat = rd(unname(bp$statistic)), bp_df = unname(bp$parameter), bp_p = rd(unname(bp$p.value)),
    reset_stat = rd(unname(rs$statistic)), reset_df1 = unname(rs$parameter[1]),
    reset_df2 = unname(rs$parameter[2]), reset_p = rd(unname(rs$p.value)),
    dw_stat = rd(unname(dw$statistic)), dw_p = rd(unname(dw$p.value)),
    sw_W = rd(unname(sw$statistic)), sw_p = rd(unname(sw$p.value)),
    resid_bp_stat = rd(rbp), resid_bp_p = rd(rbp_p),
    resid_reset_stat = rd(rreset), resid_reset_p = rd(rreset_p),
    n_out2 = sum(abs(rst) > 2), n_out25 = sum(abs(rst) > 2.5),
    n_cook_4n = sum(ck > 4 / n), max_cook = rd(max(ck)), max_hat = rd(max(hat))
  )
}

cases <- lapply(datasets, analyse)

# frozen raw data: emit each dataset as {cols: [names], rows: [[...]]}
ds_out <- lapply(datasets, function(d) list(cols = names(d),
                                            rows = unname(as.matrix(d))))

out <- list(datasets = ds_out, labels = labels, cases = cases,
            meta = list(R = R.version.string,
                        lmtest = as.character(packageVersion("lmtest"))))
writeLines(toJSON(out, auto_unbox = TRUE, digits = 10, null = "null", na = "null"),
           "Scripts/tool-truth/diagnostic-plot.json")

cat("Wrote Scripts/tool-truth/diagnostic-plot.json\n")
for (id in names(cases)) {
  c <- cases[[id]]
  cat(sprintf("%-10s n=%2d p=%d  BP p=%.4f  RESET p=%.4f  SW p=%.4f  DW=%.3f  out2=%d cook4n=%d\n",
              id, c$n, c$p, c$bp_p, c$reset_p, c$sw_p, c$dw_stat, c$n_out2, c$n_cook_4n))
}
