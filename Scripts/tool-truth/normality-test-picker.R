# normality-test-picker.R  -  ground truth for the Normality Test Picker tool.
# Covers shapiro.test (base stats), ad.test + lillie.test (nortest),
# jarque.bera.test (tseries) across many n and shapes incl. edge cases.
#
# Bit-exact vectors: each generated vector is serialised to %.17g strings, then
# READ BACK as doubles, and every statistic is computed on the read-back values.
# The JS test harness parses the SAME strings, so it computes on identical doubles.
#
# Run:  /c/Program\ Files/R/R-4.6.0/bin/Rscript.exe Scripts/tool-truth/normality-test-picker.R
# Out:  Scripts/tool-truth/normality-test-picker.json

suppressMessages({
  library(nortest)
  library(tseries)
  library(jsonlite)
})

# Round-trip a numeric vector through %.17g so R and JS see identical doubles.
# (No helper named rt(): that would shadow R's t-distribution RNG used in gT.)
strs <- function(x) sprintf("%.17g", x)

cases <- list()
add <- function(id, test, x) {
  xs <- strs(x)
  xr <- as.numeric(xs)      # bit-identical to what JS parseFloat() yields
  n  <- length(xr)
  stat <- NA_real_; p <- NA_real_; statName <- NA_character_; err <- NA_character_
  res <- tryCatch({
    if (test == "sw") {
      r <- shapiro.test(xr); list(s = unname(r$statistic), p = r$p.value, nm = "W")
    } else if (test == "ad") {
      r <- ad.test(xr);      list(s = unname(r$statistic), p = r$p.value, nm = "A2")
    } else if (test == "lillie") {
      r <- lillie.test(xr);  list(s = unname(r$statistic), p = r$p.value, nm = "D")
    } else if (test == "jb") {
      r <- jarque.bera.test(xr); list(s = unname(r$statistic), p = r$p.value, nm = "JB")
    } else stop("unknown test")
  }, error = function(e) list(err = conditionMessage(e)))
  if (!is.null(res$err)) {
    err <- res$err
  } else {
    stat <- res$s; p <- res$p; statName <- res$nm
  }
  # summary stats (population skew/excess-kurt, sample sd) for a few sanity checks
  m  <- mean(xr)
  m2 <- mean((xr - m)^2); m3 <- mean((xr - m)^3); m4 <- mean((xr - m)^4)
  sdv  <- sd(xr)
  skew <- if (m2 > 0) m3 / m2^1.5 else 0
  exk  <- if (m2 > 0) m4 / m2^2 - 3 else 0
  cases[[length(cases) + 1]] <<- list(
    id = id, test = test, n = n, x = xs,
    stat = stat, p = p, statName = statName, err = err,
    mean = m, sd = sdv, skew = skew, exkurt = exk
  )
}

# ---- generators (seeded, reproducible) --------------------------------------
gN  <- function(n, mean = 0, sd = 1, seed) { set.seed(seed); rnorm(n, mean, sd) }
gLN <- function(n, ml = 0, sl = 1, seed)   { set.seed(seed); rlnorm(n, ml, sl) }
gT  <- function(n, df, seed)               { set.seed(seed); rt(n, df) }        # NB rt() = R's t-dist rng here
gU  <- function(n, seed)                   { set.seed(seed); runif(n) }
gBi <- function(n, seed) { set.seed(seed); c(rnorm(n %/% 2, -3, 1), rnorm(n - n %/% 2, 3, 1)) }
gExp<- function(n, seed) { set.seed(seed); rexp(n, 1) }

# ===== Shapiro-Wilk (n 3..5000) ==============================================
add("sw_n3_norm",   "sw", c(1.2, -0.4, 0.8))                 # n=3 exact-null branch
add("sw_n4_norm",   "sw", c(-1.1, 0.2, 0.9, -0.3))           # n=4 special branch
add("sw_n5_norm",   "sw", gN(5, seed = 101))
add("sw_n8_norm",   "sw", gN(8, seed = 102))
add("sw_n11_norm",  "sw", gN(11, seed = 103))                # boundary of small-n branch
add("sw_n12_norm",  "sw", gN(12, seed = 104))                # first large-n branch
add("sw_n20_norm",  "sw", gN(20, seed = 7))
add("sw_n30_norm",  "sw", gN(30, seed = 1))
add("sw_n50_norm",  "sw", gN(50, seed = 105))
add("sw_n100_norm", "sw", gN(100, seed = 106))
add("sw_n500_norm", "sw", gN(500, seed = 11))
add("sw_n2000_norm","sw", gN(2000, seed = 107))
add("sw_n5000_norm","sw", gN(5000, seed = 108))              # upper limit
add("sw_n80_lnorm", "sw", gLN(80, 0, 0.7, 19))               # right-skew, rejects
add("sw_n100_t3",   "sw", gT(100, 3, 23))                    # heavy tails
add("sw_n60_unif",  "sw", gU(60, 109))                       # light tails
add("sw_n40_exp",   "sw", gExp(40, 110))                     # strong skew
add("sw_n50_bimod", "sw", gBi(50, 111))                      # bimodal
add("sw_const",     "sw", rep(5, 10))                        # sd=0 -> error

# ===== Anderson-Darling (nortest, n>=8) ======================================
add("ad_n8_norm",   "ad", gN(8, seed = 201))                 # min n
add("ad_n12_norm",  "ad", gN(12, seed = 202))
add("ad_n30_norm",  "ad", gN(30, seed = 1))
add("ad_n50_norm",  "ad", gN(50, seed = 203))
add("ad_n100_norm", "ad", gN(100, seed = 204))
add("ad_n500_norm", "ad", gN(500, seed = 205))
add("ad_n80_lnorm", "ad", gLN(80, 0, 0.7, 19))              # rejects, big AA
add("ad_n100_t3",   "ad", gT(100, 3, 23))
add("ad_n60_unif",  "ad", gU(60, 206))
add("ad_n40_exp",   "ad", gExp(40, 207))
add("ad_n200_lnorm","ad", gLN(200, 0, 1.2, 208))            # AA in far branch
add("ad_n7_toosmall","ad", gN(7, seed = 209))               # n<8 -> error

# ===== Lilliefors (nortest, n>=5) ============================================
add("lil_n5_norm",   "lillie", gN(5, seed = 301))            # min n
add("lil_n12_norm",  "lillie", gN(12, seed = 302))
add("lil_n30_norm",  "lillie", gN(30, seed = 1))
add("lil_n50_norm",  "lillie", gN(50, seed = 303))
add("lil_n100_norm", "lillie", gN(100, seed = 304))          # nd=n boundary
add("lil_n101_norm", "lillie", gN(101, seed = 305))          # n>100 scaling branch
add("lil_n150_norm", "lillie", gN(150, seed = 306))
add("lil_n200_norm", "lillie", gN(200, seed = 307))
add("lil_n500_norm", "lillie", gN(500, seed = 308))
add("lil_n80_lnorm", "lillie", gLN(80, 0, 0.7, 19))          # rejects
add("lil_n100_t3",   "lillie", gT(100, 3, 23))
add("lil_n60_unif",  "lillie", gU(60, 309))
add("lil_n40_exp",   "lillie", gExp(40, 310))
add("lil_n4_toosmall","lillie", gN(4, seed = 311))           # n<5 -> error

# ===== Jarque-Bera (tseries) =================================================
add("jb_n4_norm",   "jb", c(-1.1, 0.2, 0.9, -0.3))
add("jb_n30_norm",  "jb", gN(30, seed = 1))
add("jb_n50_norm",  "jb", gN(50, seed = 401))
add("jb_n100_norm", "jb", gN(100, seed = 402))
add("jb_n500_norm", "jb", gN(500, seed = 403))
add("jb_n80_lnorm", "jb", gLN(80, 0, 0.7, 19))
add("jb_n100_t3",   "jb", gT(100, 3, 23))
add("jb_n200_exp",  "jb", gExp(200, 404))
add("jb_n50_bimod", "jb", gBi(50, 405))

out <- list(
  tool = "normality-test-picker",
  generated_by = "Scripts/tool-truth/normality-test-picker.R",
  r_version = R.version.string,
  packages = list(nortest = as.character(packageVersion("nortest")),
                  tseries = as.character(packageVersion("tseries"))),
  n_cases = length(cases),
  cases = cases
)

writeLines(
  toJSON(out, auto_unbox = TRUE, digits = 17, na = "null", pretty = TRUE),
  "Scripts/tool-truth/normality-test-picker.json"
)
cat("Wrote", length(cases), "cases to Scripts/tool-truth/normality-test-picker.json\n")
