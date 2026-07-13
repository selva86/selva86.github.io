# Truth table for odds-ratio-calculator (W2.3 2x2 epidemiology suite)
# Ground truth: R 4.6.0 base fisher.test/chisq.test + explicit textbook formulas,
# cross-checked against epitools::oddsratio.wald / riskratio.wald.
#
# 2x2 layout used throughout:
#            Outcome+   Outcome-
#   Exposed     a          b        n1 = a+b
#   Unexposed   c          d        n0 = c+d
#            m1=a+c     m0=b+d      N
#
# Haldane-Anscombe: when ANY cell is 0, add 0.5 to every cell BEFORE computing
# the ratio measures (OR, RR, and the RR-derived AR% and PAF) and their Wald CIs.
# Absolute risks, the risk difference, NNT and the chi-square / Fisher tests use
# the ORIGINAL counts. This mirrors what the JS library computes.

suppressWarnings(suppressMessages(library(epitools)))
options(warn = -1)

fmt <- function(v) {
  if (is.null(v) || length(v) == 0) return("null")
  if (is.na(v)) return("\"NaN\"")
  if (is.infinite(v)) return(if (v > 0) "\"Inf\"" else "\"-Inf\"")
  sprintf("%.15g", v)
}

# ---- one table, one confidence level -> named list of truth values ----
compute <- function(a, b, c, d, level) {
  z <- qnorm(1 - (1 - level) / 2)
  n1 <- a + b; n0 <- c + d; m1 <- a + c; m0 <- b + d; N <- a + b + c + d
  risk1 <- a / n1
  risk0 <- c / n0

  # Haldane-Anscombe correction for ratio measures
  corrected <- (a == 0 || b == 0 || c == 0 || d == 0)
  A <- a; B <- b; C <- c; D <- d
  if (corrected) { A <- a + 0.5; B <- b + 0.5; C <- c + 0.5; D <- d + 0.5 }
  n1c <- A + B; n0c <- C + D; Nc <- A + B + C + D; m1c <- A + C

  # Odds ratio (Wald)
  OR <- (A * D) / (B * C)
  se_lnOR <- sqrt(1/A + 1/B + 1/C + 1/D)
  OR_lo <- exp(log(OR) - z * se_lnOR)
  OR_hi <- exp(log(OR) + z * se_lnOR)

  # Risk ratio (Wald)
  RR <- (A / n1c) / (C / n0c)
  se_lnRR <- sqrt(1/A - 1/n1c + 1/C - 1/n0c)
  RR_lo <- exp(log(RR) - z * se_lnRR)
  RR_hi <- exp(log(RR) + z * se_lnRR)

  # Risk difference (Wald, raw counts)
  RD <- risk1 - risk0
  se_RD <- sqrt(risk1 * (1 - risk1) / n1 + risk0 * (1 - risk0) / n0)
  RD_lo <- RD - z * se_RD
  RD_hi <- RD + z * se_RD

  # NNT / NNH (scalar); CI derived from RD CI in the app
  NNT <- if (RD != 0) 1 / abs(RD) else Inf

  # Attributable fraction among exposed and population attributable fraction
  # (from the corrected table so they stay consistent with RR when corrected)
  AFe <- (RR - 1) / RR * 100
  It <- m1c / Nc
  I0 <- C / n0c
  PAF <- (It - I0) / It * 100

  # Tests on RAW counts
  m <- matrix(c(a, b, c, d), nrow = 2, byrow = TRUE)
  expected <- outer(c(n1, n0), c(m1, m0)) / N
  minExp <- min(expected)
  cs_y <- suppressWarnings(chisq.test(m, correct = TRUE))
  cs_n <- suppressWarnings(chisq.test(m, correct = FALSE))
  ft <- fisher.test(m, conf.level = level)
  autopick <- if (minExp < 5) "fisher" else "chisq"

  list(
    a = a, b = b, c = c, d = d, level = level, corrected = corrected,
    risk1 = risk1, risk0 = risk0,
    OR = OR, OR_lo = OR_lo, OR_hi = OR_hi,
    OR_fisher_lo = ft$conf.int[1], OR_fisher_hi = ft$conf.int[2],
    OR_cmle = as.numeric(ft$estimate),
    RR = RR, RR_lo = RR_lo, RR_hi = RR_hi,
    RD = RD, RD_lo = RD_lo, RD_hi = RD_hi, NNT = NNT,
    AFe = AFe, PAF = PAF,
    chisq_y = as.numeric(cs_y$statistic), p_chisq_y = cs_y$p.value,
    chisq_n = as.numeric(cs_n$statistic), p_chisq_n = cs_n$p.value,
    p_fisher = ft$p.value, minExp = minExp, autopick = autopick
  )
}

# ---- table catalogue ----------------------------------------------------
tables <- list(
  # balanced / moderate
  c(40,60,30,70), c(50,50,50,50), c(45,55,35,65), c(60,40,45,55),
  c(25,75,15,85), c(90,110,70,130),
  # strong harmful effect (OR > 1)
  c(80,20,20,80), c(120,30,40,110), c(70,10,25,95),
  # protective effect (OR < 1)
  c(10,90,30,70), c(20,180,60,140), c(15,85,45,55), c(8,92,28,72),
  # rare outcome (cohort, large denominators)
  c(5,995,2,998), c(10,9990,3,9997), c(25,4975,12,4988), c(40,1960,20,1980),
  # small n
  c(3,2,1,4), c(2,3,4,1), c(4,6,7,3), c(6,4,2,8), c(1,9,5,5),
  # zero cells (single)
  c(0,20,10,15), c(12,0,8,20), c(10,20,0,15), c(15,10,20,0),
  c(0,50,8,42), c(30,0,10,40),
  # zero cells (double / corners)
  c(0,10,5,0), c(8,0,0,12),
  # huge counts
  c(5000,5000,4000,6000), c(12000,3000,8000,7000), c(25000,25000,20000,30000),
  # case-control style (fixed cases/controls, rare exposure)
  c(35,15,20,30), c(60,40,25,75), c(18,82,9,91),
  # RCT balanced arms
  c(45,105,70,80), c(12,138,28,122), c(90,60,110,40),
  # near-null (OR ~ 1)
  c(50,50,48,52), c(100,100,101,99),
  # extreme separation
  c(1,99,99,1), c(2,198,180,20)
)

levels <- c(0.90, 0.95, 0.99)
# every table at 95%; a broad subset also at 90% and 99%
subset90_99 <- 1:length(tables)

rows <- list()
key <- function(i, lv) sprintf("t%02d_L%d", i, round(lv * 100))

for (i in seq_along(tables)) {
  tb <- tables[[i]]
  for (lv in levels) {
    if (lv != 0.95 && !(i %in% subset90_99)) next
    r <- compute(tb[1], tb[2], tb[3], tb[4], lv)
    rows[[key(i, lv)]] <- r
  }
}

# ---- emit JSON ----------------------------------------------------------
con <- file("Scripts/tool-truth/odds-ratio-calculator.json", "w", encoding = "UTF-8")
cat("{\n", file = con)
knames <- names(rows)
for (ri in seq_along(rows)) {
  r <- rows[[ri]]
  fields <- c()
  for (nm in names(r)) {
    v <- r[[nm]]
    if (is.character(v)) {
      fields <- c(fields, sprintf("\"%s\":\"%s\"", nm, v))
    } else if (is.logical(v)) {
      fields <- c(fields, sprintf("\"%s\":%s", nm, if (v) "true" else "false"))
    } else {
      fields <- c(fields, sprintf("\"%s\":%s", nm, fmt(v)))
    }
  }
  comma <- if (ri < length(rows)) "," else ""
  cat(sprintf("  \"%s\": {%s}%s\n", knames[ri], paste(fields, collapse = ","), comma), file = con)
}
cat("}\n", file = con)
close(con)

# ---- epitools cross-check (sanity, printed to stderr; not part of gate) --
cc <- function(a, b, c, d) {
  # epitools reference-first orientation to reproduce OR = ad/bc
  tab <- matrix(c(d, c, b, a), nrow = 2, byrow = TRUE)
  orw <- oddsratio.wald(tab)
  rrw <- riskratio.wald(tab)
  mine_or <- (a * d) / (b * c)
  cat(sprintf("epitools OR=%.6f (mine %.6f) CI[%.5f,%.5f] | RR=%.6f CI[%.5f,%.5f]\n",
      orw$measure[2,1], mine_or, orw$measure[2,2], orw$measure[2,3],
      rrw$measure[2,1], rrw$measure[2,2], rrw$measure[2,3]), file = stderr())
}
cat("--- epitools cross-check (no zero cells) ---\n", file = stderr())
cc(40,60,30,70); cc(80,20,20,80); cc(10,90,30,70)

cat(sprintf("Wrote %d rows to odds-ratio-calculator.json\n", length(rows)))
