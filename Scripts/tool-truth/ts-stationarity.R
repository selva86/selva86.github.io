#!/usr/bin/env Rscript
# Truth table for tools/ts-stationarity-calculator.html (v2 rebuild).
#
# Ground truth: R 4.6.0
#   tseries::adf.test  (Augmented Dickey-Fuller, trend model, fixed lag)
#   tseries::kpss.test (KPSS, Level + Trend nulls, lshort T/F)
#   tseries::pp.test   (Phillips-Perron, Z(alpha) + Z(t_alpha))
#   forecast::ndiffs   (differencing order; default test="kpss" -> urca::ur.kpss)
#   stats::acf / pacf  (sample ACF; Durbin-Levinson PACF)
#
# Series are generated deterministically here and written verbatim into the
# JSON so the JS math lib + Playwright E2E operate on the IDENTICAL vectors.
# auto.arima AICc ranking is deliberately NOT reproduced (MLE optimisation is
# not bit-reproducible outside arima()); the tool teaches that on-page.

suppressWarnings(suppressMessages({
  library(tseries)
  library(forecast)
  library(jsonlite)
}))

# ----- canonical test series --------------------------------------------------
series <- list()

set.seed(7)
{ n <- 120; e <- rnorm(n); x <- numeric(n); x[1] <- e[1]
  for (i in 2:n) x[i] <- 0.5 * x[i-1] + e[i]; series$ar1 <- x }

set.seed(13)
{ n <- 120; series$rw <- cumsum(rnorm(n)) }

set.seed(31)
{ n <- 120; e <- numeric(n); w <- rnorm(n); e[1] <- w[1]
  for (i in 2:n) e[i] <- 0.4 * e[i-1] + w[i]
  series$trend <- 0.05 * (1:n) + e }

set.seed(53)
{ n <- 144; series$seasonal <- 2 * sin(2 * pi * (1:n) / 12) + 0.5 * rnorm(n) }

set.seed(97)
{ n <- 200; series$arma11 <- as.numeric(arima.sim(n = n,
    model = list(ar = 0.6, ma = 0.4), sd = 1)) }

set.seed(101)
{ series$wn <- rnorm(100) }

set.seed(202)
{ series$short12 <- rnorm(12) }          # edge: minimum-ish for adf default lag

set.seed(303)
{ series$small8 <- rnorm(8) }            # edge: tiny n

set.seed(404)
{ n <- 60; x <- numeric(n); x[1] <- 0.1   # explosive-ish (phi>1 damped)
  for (i in 2:n) x[i] <- 1.02 * x[i-1] + rnorm(1, sd = 0.2); series$explosive <- x }

set.seed(505)
{ series$i2 <- cumsum(cumsum(rnorm(120))) }  # doubly-integrated -> ndiffs should reach 2

series$constant <- rep(5, 40)             # ndiffs is.constant -> 0

# ----- helpers ----------------------------------------------------------------
num <- function(v) if (length(v) == 0 || all(is.na(v))) NULL else as.numeric(v)

adf_case <- function(x) {
  r <- tryCatch(suppressWarnings(adf.test(x, alternative = "stationary")),
                error = function(e) NULL)
  if (is.null(r)) return(NULL)
  list(statistic = unname(r$statistic), lag = unname(r$parameter),
       p = unname(r$p.value))
}

kpss_case <- function(x, null, lshort) {
  r <- tryCatch(suppressWarnings(kpss.test(x, null = null, lshort = lshort)),
                error = function(e) NULL)
  if (is.null(r)) return(NULL)
  list(statistic = unname(r$statistic), lag = unname(r$parameter),
       p = unname(r$p.value))
}

pp_case <- function(x, type) {
  r <- tryCatch(suppressWarnings(pp.test(x, alternative = "stationary",
                                         type = type, lshort = TRUE)),
                error = function(e) NULL)
  if (is.null(r)) return(NULL)
  list(statistic = unname(r$statistic), lag = unname(r$parameter),
       p = unname(r$p.value))
}

acf_case <- function(x) {
  a <- tryCatch(suppressWarnings(acf(x, plot = FALSE)), error = function(e) NULL)
  if (is.null(a)) return(NULL)
  v <- as.numeric(a$acf[, , 1])          # lags 0..lag.max
  list(lagmax = length(v) - 1, values = v)   # values[1] = lag0 = 1
}

pacf_case <- function(x) {
  p <- tryCatch(suppressWarnings(pacf(x, plot = FALSE)), error = function(e) NULL)
  if (is.null(p)) return(NULL)
  v <- as.numeric(p$acf[, , 1])          # lags 1..lag.max
  list(lagmax = length(v), values = v)
}

ndiffs_case <- function(x, test, type = "level") {
  tryCatch(suppressWarnings(as.integer(ndiffs(x, test = test, type = type))),
           error = function(e) NA_integer_)
}

# ----- build cases ------------------------------------------------------------
# Round each series to 6 dp FIRST, then compute every test on the rounded
# vector, and store that same rounded vector. This guarantees the JS lib (which
# parses the printed 6-dp decimals) sees byte-identical double inputs to R, so
# the <=1e-6 gate reflects the math, not input drift.
cases <- lapply(names(series), function(nm) {
  x <- round(series[[nm]], 6)
  list(
    name        = nm,
    n           = length(x),
    series      = num(x),
    adf         = adf_case(x),
    kpss_level  = kpss_case(x, "Level", TRUE),
    kpss_trend  = kpss_case(x, "Trend", TRUE),
    kpss_level_long = kpss_case(x, "Level", FALSE),
    pp_alpha    = pp_case(x, "Z(alpha)"),
    pp_talpha   = pp_case(x, "Z(t_alpha)"),
    ndiffs_kpss = ndiffs_case(x, "kpss"),
    ndiffs_kpss_trend = ndiffs_case(x, "kpss", "trend"),
    ndiffs_adf  = ndiffs_case(x, "adf"),
    acf         = acf_case(x),
    pacf        = pacf_case(x)
  )
})
names(cases) <- names(series)

out <- toJSON(cases, auto_unbox = TRUE, digits = 12, na = "null", pretty = TRUE)
writeLines(out, "Scripts/tool-truth/ts-stationarity.json")
cat("Wrote Scripts/tool-truth/ts-stationarity.json with", length(cases), "cases\n")

# quick human summary
for (nm in names(cases)) {
  c1 <- cases[[nm]]
  cat(sprintf("%-10s n=%-4d ADF t=%s p=%s lag=%s | KPSS(L) eta=%s p=%s l=%s | ndiffs(kpss)=%s\n",
    nm, c1$n,
    if (is.null(c1$adf)) "NA" else formatC(c1$adf$statistic, digits = 4, format = "f"),
    if (is.null(c1$adf)) "NA" else formatC(c1$adf$p, digits = 4, format = "f"),
    if (is.null(c1$adf)) "NA" else c1$adf$lag,
    if (is.null(c1$kpss_level)) "NA" else formatC(c1$kpss_level$statistic, digits = 4, format = "f"),
    if (is.null(c1$kpss_level)) "NA" else formatC(c1$kpss_level$p, digits = 4, format = "f"),
    if (is.null(c1$kpss_level)) "NA" else c1$kpss_level$lag,
    c1$ndiffs_kpss))
}
