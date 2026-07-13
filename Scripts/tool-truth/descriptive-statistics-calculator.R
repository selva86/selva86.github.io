# ============================================================
# descriptive-statistics-calculator truth table
# Ground truth = R 4.6.0:
#   mean / median / sd / var / quantile(type=7) / fivenum
#   skewness/kurtosis -> e1071 type=3 (the package default)
#   CI of mean         -> mean +/- qt(1-(1-lvl)/2, n-1) * sd/sqrt(n)
#   FD histogram bins  -> grDevices::nclass.FD
#   1.5*IQR fences     -> q1-1.5*IQR, q3+1.5*IQR (type-7 quartiles)
# Run: Rscript descriptive-statistics-calculator.R -> descriptive-statistics-calculator.json
# ============================================================
suppressMessages({library(jsonlite); library(e1071)})

# scalar sanitizer: NA/NaN/non-finite -> NA so toJSON(na="null") emits null
S <- function(z) {
  if (length(z) != 1) return(z)
  if (is.na(z) || is.nan(z) || !is.finite(z)) return(NA_real_)
  z
}
sortv <- function(v) if (length(v)) sort(v) else numeric(0)

modes_of <- function(x) {
  tb <- table(x)
  mxf <- max(tb)
  n <- length(x)
  vals <- sort(as.numeric(names(tb)[tb == mxf]))
  # convention: if nothing repeats (max freq == 1) and >1 distinct value -> no mode
  hasMode <- !(mxf == 1 && n > 1)
  list(modes = if (hasMode) vals else numeric(0),
       modeFreq = as.integer(mxf),
       nModes = if (hasMode) length(vals) else 0L)
}

describe1 <- function(raw) {
  x    <- raw[!is.na(raw)]
  nTot <- length(raw)
  n    <- length(x)
  miss <- nTot - n
  if (n == 0) {
    return(list(nTotal = nTot, n = 0L, missing = miss, empty = TRUE))
  }
  m    <- mean(x)
  med  <- median(x)
  s    <- if (n > 1) sd(x) else NA_real_
  v    <- if (n > 1) var(x) else NA_real_
  ssd  <- sum((x - m)^2)
  vPop <- ssd / n
  sPop <- sqrt(vPop)
  se   <- if (n > 1) s / sqrt(n) else NA_real_
  ciOf <- function(level) {
    if (n < 2) return(c(NA_real_, NA_real_))
    tc <- qt(1 - (1 - level) / 2, n - 1)
    c(m - tc * se, m + tc * se)
  }
  c90 <- ciOf(0.90); c95 <- ciOf(0.95); c99 <- ciOf(0.99)
  mn <- min(x); mx <- max(x); rng <- mx - mn
  q  <- quantile(x, c(0.25, 0.5, 0.75), type = 7, names = FALSE)
  q1 <- q[1]; q3 <- q[3]; iqr <- q3 - q1
  sk <- if (n > 1) e1071::skewness(x, type = 3) else NA_real_
  ku <- if (n > 1) e1071::kurtosis(x, type = 3) else NA_real_
  cv    <- if (!is.na(s)   && m != 0) s   / m else NA_real_
  cvPop <- if (!is.na(sPop)&& m != 0) sPop/ m else NA_real_
  sm <- sum(x)
  fv <- fivenum(x)
  fenceLo <- q1 - 1.5 * iqr; fenceHi <- q3 + 1.5 * iqr
  outl <- sortv(x[x < fenceLo | x > fenceHi])
  md <- modes_of(x)
  fdbins <- tryCatch(as.integer(nclass.FD(x)), error = function(e) NA_integer_)
  stbins <- tryCatch(as.integer(nclass.Sturges(x)), error = function(e) NA_integer_)
  list(
    nTotal = nTot, n = n, missing = miss,
    mean = S(m), median = S(med),
    sd = S(s), var = S(v), sdPop = S(sPop), varPop = S(vPop),
    se = S(se),
    ci90lo = S(c90[1]), ci90hi = S(c90[2]),
    ci95lo = S(c95[1]), ci95hi = S(c95[2]),
    ci99lo = S(c99[1]), ci99hi = S(c99[2]),
    min = S(mn), max = S(mx), range = S(rng),
    q1 = S(q1), q3 = S(q3), iqr = S(iqr),
    skewness = S(sk), kurtosis = S(ku),
    cv = S(cv), cvPop = S(cvPop), sum = S(sm),
    five = fv, fenceLo = S(fenceLo), fenceHi = S(fenceHi),
    outliers = outl, nOut = length(outl),
    modes = md$modes, modeFreq = md$modeFreq, nModes = md$nModes,
    fdBins = fdbins, sturgesBins = stbins
  )
}

# ============================================================
# data vectors (deterministic) - covers the required edge grid
# ============================================================
bigN <- ((1:50) * 37) %% 100          # deterministic 50-length integer vector
D <- list(
  seq10       = c(1,2,3,4,5,6,7,8,9,10),
  classic_out = c(2,3,4,5,6,7,8,9,10,40),
  n1          = c(5),
  n2          = c(3, 9),
  constant    = rep(7, 8),
  allNA       = as.numeric(c(NA, NA, NA, NA)),
  withNA      = c(1, 2, NA, 4, 5, NA, 7),
  negatives   = c(-5, -3, -1, 0, 2, 4, 6),
  huge        = c(1e12, 2e12, 3e12, 4e12, 5e12),
  tinyvar     = c(1.0000001, 1.0000002, 1.0000003, 1.0000002, 1.0000001),
  heavyskew   = c(1,1,1,2,2,3,4,5,10,25,60),
  tiesmode    = c(2,2,3,3,3,4,5,5,5,6),
  bimodal2    = c(1,1,2,2,3),
  nomode      = c(1,2,3,4,5,6,7),
  decimals    = c(2.1,2.3,2.2,2.4,8.9,2.5,2.2,2.3),
  grades      = c(88,92,76,81,95,89,73,100,68,85,90,77),
  lognorm     = c(0.4,0.9,1.1,1.3,1.6,1.9,2.4,3.1,4.2,6.8,12.5,22.0),
  negskew     = c(60,25,10,5,4,3,2,2,1,1,1),
  withNAneg   = c(-2, NA, -1, 0, NA, 3, 5, -4),
  bigN        = bigN,
  evenN       = c(10,20,30,40),
  oddN        = c(10,20,30,40,50),
  twoModesTie = c(1,1,2,2),
  currencyLik = c(1200,1300,1250,1400,999),
  pct         = c(0.12,0.45,0.78,0.33,0.29),
  mixedsign   = c(-100,50,-25,75,0,33,-8),
  repeated    = c(5,5,5,6,6,7),
  threeSame   = c(4,4,4),
  spread3     = c(-1000, 0, 1000),
  manyTies    = c(1,1,1,1,2,2,2,3,3,4),
  floatprec   = c(0.1,0.2,0.3,0.4,0.5,0.6,0.7),
  micro       = c(1e-9, 2e-9, 3e-9),
  wide        = c(-500,-200,-50,0,50,200,500,1000),
  dupmax      = c(9,8,8,7,7,7,6)
)

cases <- list()
for (nm in names(D)) {
  cases[[length(cases) + 1]] <- list(name = nm, data = D[[nm]],
                                     expect = describe1(D[[nm]]))
}

writeLines(toJSON(cases, auto_unbox = TRUE, digits = NA, na = "null", pretty = TRUE),
           "descriptive-statistics-calculator.json")
cat(sprintf("wrote descriptive-statistics-calculator.json with %d vectors\n", length(cases)))
