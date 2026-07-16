# Truth table for tools/acf-pacf-calculator.html
# Ground truth = stats::acf() / stats::pacf() / stats::diff() / stats::Box.test()
# Emits acf-pacf-calculator.json consumed by test-acf-pacf-calculator-math.js
#
# Conventions being pinned (these are the whole point of the tool):
#   * acf() returns lag 0..lag.max  (lag 0 == 1 by construction)  -> length lag.max+1
#   * pacf() returns lag 1..lag.max                                -> length lag.max
#   * default lag.max = floor(10 * log10(n)), then min(., n-1)
#   * plot.acf white-noise band = qnorm((1+ci)/2)/sqrt(n.used)   (NOT 1.96/sqrt(n))
#   * plot.acf ci.type="ma" band = clim0 * sqrt(cumsum(c(1, 2*acf[-1]^2)))
#   * after diff(), n.used is the DIFFERENCED length, so the band widens

options(digits = 17)
set.seed(20260716)

out <- list()

# ---- series -----------------------------------------------------------------
# Real R datasets: a user can literally run acf(AirPassengers) and match the page.
air  <- as.numeric(AirPassengers)   # n=144, trend + strong 12-month seasonality
lyn  <- as.numeric(lynx)            # n=114, ~10y cycle
nil  <- as.numeric(Nile)            # n=100, level shift ~1899

# Simulated, rounded to 3dp so the pasted literal IS the series (no drift).
ar1    <- round(as.numeric(arima.sim(list(ar = 0.7), n = 120)) * 10 + 50, 3)
ma1    <- round(as.numeric(arima.sim(list(ma = 0.8), n = 120)) * 10 + 50, 3)
wn     <- round(rnorm(120, 50, 10), 3)
short30<- round(rnorm(30, 100, 15), 3)   # spec: short series n=30
tiny10 <- round(rnorm(10, 20, 4), 3)
min8   <- round(rnorm(8, 5, 1), 3)

series <- list(air = air, lynx = lyn, nile = nil, ar1 = ar1, ma1 = ma1,
               wn = wn, short30 = short30, tiny10 = tiny10, min8 = min8)

# ---- transforms (exactly what the mode pills do) ----------------------------
applyTransform <- function(x, tr) {
  if (tr == "none")    return(x)
  if (tr == "diff1")   return(diff(x))
  if (tr == "diff2")   return(diff(x, differences = 2))
  if (tr == "sdiff12") return(diff(x, lag = 12))
  stop("bad transform")
}

bandsFor <- function(n, ci) qnorm((1 + ci) / 2) / sqrt(n)

caseFor <- function(id, sname, tr, lagMax) {
  x <- applyTransform(series[[sname]], tr)
  n <- length(x)
  a <- if (is.null(lagMax)) acf(x, plot = FALSE) else acf(x, lag.max = lagMax, plot = FALSE)
  p <- if (is.null(lagMax)) pacf(x, plot = FALSE) else pacf(x, lag.max = lagMax, plot = FALSE)
  av <- as.numeric(drop(a$acf))     # lag 0 .. lag.max
  pv <- as.numeric(drop(p$acf))     # lag 1 .. lag.max
  L  <- max(a$lag)
  clim0 <- bandsFor(a$n.used, 0.95)
  bart  <- clim0 * sqrt(cumsum(c(1, 2 * av[-1]^2)))
  # cumulative Ljung-Box at every lag h = 1..L (what forecast::checkresiduals reports)
  lb <- lapply(1:L, function(h) {
    bt <- Box.test(x, lag = h, type = "Ljung-Box")
    list(lag = h, stat = as.numeric(bt$statistic), df = as.numeric(bt$parameter),
         p = as.numeric(bt$p.value))
  })
  # I() keeps length-1 vectors as JSON ARRAYS: with lag.max = 1 the pacf is a
  # single number and auto_unbox would silently collapse it to a scalar.
  list(id = id, series = sname, transform = tr,
       lagMaxArg = if (is.null(lagMax)) NA else lagMax,
       n_used = a$n.used, lagmax = L,
       acf = I(av), pacf = I(pv),
       band95 = clim0, band90 = bandsFor(a$n.used, 0.90), band99 = bandsFor(a$n.used, 0.99),
       bartlett = I(as.numeric(bart)), lb = lb)
}

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- caseFor(...)

# every series, raw
for (s in names(series)) add(paste0(s, "-none"), s, "none", NULL)
# differencing: the spec's "match R's diff() then acf" requirement
for (s in c("air", "lynx", "nile", "ar1", "short30")) add(paste0(s, "-diff1"), s, "diff1", NULL)
for (s in c("air", "nile", "short30"))                add(paste0(s, "-diff2"), s, "diff2", NULL)
# seasonal difference (needs n > 12)
for (s in c("air", "lynx", "nile"))                   add(paste0(s, "-sdiff12"), s, "sdiff12", NULL)
# explicit lag.max, incl. clamping to n-1 and the lag.max=1 floor
add("air-lm40",     "air",     "none",  40)
add("air-lm5",      "air",     "none",  5)
add("tiny10-lm20",  "tiny10",  "none",  20)   # clamps to n-1 = 9
add("min8-lm7",     "min8",    "none",  7)
add("short30-lm1",  "short30", "none",  1)
add("air-diff1-lm30", "air",   "diff1", 30)

out$series <- series
out$cases  <- cases

# ---- degenerate variance: R returns NaN, never 0 ----------------------------
# Every acf divides by c0 = sum((x-xbar)^2)/n. Three ways that goes degenerate,
# and R gives NaN for all three. The page must refuse rather than print a number.
cst <- rep(5, 20)
ac  <- suppressWarnings(acf(cst, plot = FALSE))
out$constant <- list(n = 20, acf_is_nan = all(is.nan(as.numeric(drop(ac$acf))[-1])))

huge <- c(1e300, 2e300, 3e300, 1e300, 2e300, 3e300, 1e300, 2e300, 1e300, 3e300)
tiny <- c(1e-300, 2e-300, 3e-300, 1e-300, 2e-300, 1e-300, 3e-300, 2e-300, 1e-300, 2e-300)
ah <- suppressWarnings(acf(huge, plot = FALSE))
at <- suppressWarnings(acf(tiny, plot = FALSE))
out$degenerate <- list(
  huge = list(x = I(huge), acf_is_nan = all(is.nan(as.numeric(drop(ah$acf))))),
  tiny = list(x = I(tiny), acf_is_nan = all(is.nan(as.numeric(drop(at$acf))))),
  # a near-constant series has a tiny but REAL variance: R answers, so must we
  nearconst = list(
    x = I(rep(c(1, 1 + 1e-9), 6)),
    acf = I(as.numeric(drop(acf(rep(c(1, 1 + 1e-9), 6), plot = FALSE)$acf)))
  )
)

con <- file("Scripts/tool-truth/acf-pacf-calculator.json", open = "w", encoding = "UTF-8")
writeLines(jsonlite::toJSON(out, auto_unbox = TRUE, digits = NA, na = "null"), con)
close(con)
cat("cases:", length(cases), " constant-is-nan:", out$constant$acf_is_nan, "\n")
