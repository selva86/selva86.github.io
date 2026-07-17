# Ground truth for tools/lib/prediction-interval-math.js
# (tools/prediction-interval-calculator.html)
#
# R 4.6.0. Simple linear regression y ~ x, then BOTH intervals at a new x0:
#   - prediction interval for ONE new observation   predict(..., interval="prediction")
#   - confidence interval for the MEAN response     predict(..., interval="confidence")
# Ground truth = stats::lm / predict.lm / confint / qt / summary.
#
# Covers: several data shapes (textbook, cars subset, tiny n=3, wide spread,
# near-perfect fit, negative slope), x0 at the mean of x (where both bands are
# narrowest), interior points, the observed min/max, and EXTRAPOLATION points
# outside the observed x range. Levels 90 / 95 / 99.
options(digits = 17, scipen = 999)
suppressWarnings(suppressMessages(library(jsonlite)))
setwd(dirname(sub("--file=", "", grep("--file=", commandArgs(FALSE), value = TRUE))))

LEVELS <- c(0.90, 0.95, 0.99)

# ---- one (dataset, x0, level) cell: both intervals straight from predict.lm ----
cell <- function(fit, x0, level) {
  nd <- data.frame(x = x0)
  pi <- predict(fit, newdata = nd, interval = "prediction", level = level)
  ci <- predict(fit, newdata = nd, interval = "confidence", level = level)
  sf <- predict(fit, newdata = nd, se.fit = TRUE)
  list(
    x0      = x0,
    level   = level,
    fit     = unname(pi[1, "fit"]),      # same centre for BOTH intervals
    pi_lo   = unname(pi[1, "lwr"]),
    pi_hi   = unname(pi[1, "upr"]),
    ci_lo   = unname(ci[1, "lwr"]),
    ci_hi   = unname(ci[1, "upr"]),
    se_fit  = unname(sf$se.fit),         # s * sqrt(1/n + (x0-xbar)^2/Sxx)
    se_pred = unname(sqrt(sf$se.fit^2 + sf$residual.scale^2)), # extra sigma^2 term
    pi_width = unname(pi[1, "upr"] - pi[1, "lwr"]),
    ci_width = unname(ci[1, "upr"] - ci[1, "lwr"])
  )
}

case <- function(name, x, y, x0s, note = "") {
  fit <- lm(y ~ x)
  s   <- summary(fit)
  co  <- s$coefficients
  n   <- length(x)
  xbar <- mean(x)
  sxx <- sum((x - xbar)^2)
  cells <- list()
  for (x0 in x0s) for (L in LEVELS) cells[[length(cells) + 1L]] <- cell(fit, x0, L)
  list(
    name   = name,
    note   = note,
    x      = x,
    y      = y,
    n      = n,
    b0     = unname(co[1, 1]),           # intercept
    b1     = unname(co[2, 1]),           # slope
    se_b0  = unname(co[1, 2]),
    se_b1  = unname(co[2, 2]),
    t_b1   = unname(co[2, 3]),
    p_b1   = unname(co[2, 4]),
    sigma  = s$sigma,                    # residual standard error
    df     = unname(s$df[2]),            # n - 2
    r2     = s$r.squared,
    adjr2  = s$adj.r.squared,
    xbar   = xbar,
    sxx    = sxx,
    xmin   = min(x),
    xmax   = max(x),
    cells  = cells
  )
}

# ---------------------------------------------------------------- datasets ----
# Cases 1-4 are ALSO the tool's scenario presets, so the shipped presets are
# exactly the vectors verified here. Keep the numbers in sync with
# tools/prediction-interval-calculator.html (PRESETS).

# 1. DEFAULT preset. Hours studied -> exam score, n=12, honest scatter.
#    Realistic residual noise so the PI/CI gap is large and the teaching lands.
x1 <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
y1 <- c(54, 57, 61, 63, 71, 72, 74, 81, 83, 88, 89, 95)
c1 <- case("study_hours_n12", x1, y1,
           c(6.5, 4, 9, 1, 12, -1, 16),     # 6.5 == mean(x): narrowest band
           "DEFAULT preset. mean(x)=6.5; x0=-1 and x0=16 are extrapolation")

# 2. Preset. R's built-in cars, first 20 rows (speed -> stopping distance).
#    Real, genuinely noisy data: the PI dwarfs the CI here, which is the point.
x2 <- cars$speed[1:20]
y2 <- cars$dist[1:20]
c2 <- case("cars_head20", x2, y2,
           c(mean(cars$speed[1:20]), 10, 14, 4, 18, 25),
           "real noisy data; xmax=14, so x0=18 and x0=25 both extrapolate")

# 3. Preset. Ad spend (thousands) -> sales, wide x spread + large sigma:
#    tests numeric stability far from the mean.
x3 <- c(10, 25, 40, 55, 70, 85, 100, 115, 130, 145)
y3 <- c(112, 180, 141, 265, 220, 341, 288, 405, 372, 460)
c3 <- case("ad_spend_n10", x3, y3, c(77.5, 40, 130, 200, -20),
           "x0=200 and x0=-20 are extrapolation")

# 4. Preset. Tiny n=3 -> df=1, t(0.975,1)=12.7: intervals are enormous.
#    Teaches that three points buy you almost no predictive certainty.
x4 <- c(1, 2, 3)
y4 <- c(2.0, 4.1, 5.9)
c4 <- case("tiny_n3", x4, y4, c(2, 1, 3, 5), "df=1, huge t multiplier")

# 5. Edge. Near-perfect fit: sigma tiny, so PI ~ CI in absolute terms but the
#    RATIO of widths still follows sqrt(1 + 1/n + ...) vs sqrt(1/n + ...).
x5 <- c(1, 2, 3, 4, 5, 6, 7, 8)
y5 <- c(3.001, 5.000, 6.999, 9.002, 10.998, 13.001, 14.999, 17.000)
c5 <- case("near_perfect_n8", x5, y5, c(4.5, 2, 8, 12), "sigma ~ 0.0014")

# 6. Edge. Negative slope + non-integer x, n=12.
x6 <- c(0.5, 1.2, 2.3, 3.1, 4.4, 5.0, 6.7, 7.2, 8.9, 9.3, 10.5, 11.8)
y6 <- c(48.2, 45.1, 41.9, 39.0, 34.2, 33.1, 27.8, 26.0, 20.1, 19.4, 15.2, 10.9)
c6 <- case("negative_slope_n12", x6, y6, c(mean(x6), 2, 9, 0, 15),
           "negative slope; x0=0 and x0=15 extrapolate")

# 7. Edge. n=4 with duplicated x values (only two distinct x, Sxx small).
x7 <- c(2, 2, 5, 5)
y7 <- c(3.0, 3.4, 8.1, 8.9)
c7 <- case("duplicate_x_n4", x7, y7, c(3.5, 2, 5, 7), "duplicated x, df=2")

cases <- list(c1, c2, c3, c4, c5, c6, c7)

# ---- t quantiles the JS must reproduce exactly (multiplier check) -----------
tq <- list()
for (df in c(1, 2, 3, 5, 6, 8, 10, 18, 30, 48, 100)) {
  for (L in LEVELS) {
    tq[[length(tq) + 1L]] <- list(df = df, level = L,
                                  q = qt(1 - (1 - L) / 2, df))
  }
}

out <- list(
  meta = list(
    generator = "Scripts/tool-truth/prediction-interval-calculator.R",
    r_version = paste(R.version$major, R.version$minor, sep = "."),
    fns = "stats::lm, stats::predict.lm(interval=prediction|confidence), stats::qt",
    formulas = list(
      centre = "yhat = b0 + b1*x0  (identical for PI and CI)",
      ci     = "yhat +/- t(1-a/2, n-2) * s * sqrt(     1/n + (x0-xbar)^2/Sxx)",
      pi     = "yhat +/- t(1-a/2, n-2) * s * sqrt( 1 + 1/n + (x0-xbar)^2/Sxx)",
      note   = "the leading 1 under the PI root is the variance of a single new observation"
    )
  ),
  levels = LEVELS,
  tquantiles = tq,
  cases = cases
)

write(toJSON(out, digits = 17, auto_unbox = TRUE, pretty = TRUE),
      "prediction-interval-calculator.json")
cat("wrote prediction-interval-calculator.json\n")
cat("cases:", length(cases), " cells:", sum(sapply(cases, function(k) length(k$cells))), "\n")
