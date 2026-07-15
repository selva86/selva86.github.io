# Truth table for fisher-exact-test-calculator (wave-3)
# Ground truth: R 4.6.0 base fisher.test / chisq.test + base dhyper (mid-p).
#
# 2x2 layout used throughout:
#            Outcome+   Outcome-
#   Group 1     a          b
#   Group 2     c          d
#
# fisher.test internals: m = a+c (col1), n = b+d (col2), k = a+b (row1), x = a.
# one-sided p: greater = P(X >= x), less = P(X <= x) under the null (OR = 1).
# mid-p = tail - 0.5 * point mass; two-sided mid-p uses the minlike ordering.
# sample OR = (a*d)/(b*c) with Haldane 0.5 added to every cell if any cell is 0.

options(warn = -1)

fmt <- function(v) {
  if (is.null(v) || length(v) == 0) return("null")
  if (is.na(v)) return("\"NaN\"")
  if (is.infinite(v)) return(if (v > 0) "\"Inf\"" else "\"-Inf\"")
  sprintf("%.15g", v)
}

# base-R mid-p from the central (null) hypergeometric over the support
midp_calc <- function(a, b, c, d) {
  m <- a + c; n <- b + d; k <- a + b; x <- a
  lo <- max(0, k - n); hi <- min(k, m)
  s <- lo:hi
  dv <- dhyper(s, m, n, k)
  dv <- dv / sum(dv)
  dobs <- dv[s == x]
  relErr <- 1 + 1e-7
  lessMass <- sum(dv[dv < dobs / relErr])
  eqMass   <- sum(dv[dv >= dobs / relErr & dv <= dobs * relErr])
  two <- lessMass + 0.5 * eqMass
  pg <- sum(dv[s >= x]); pl <- sum(dv[s <= x])
  c(two = two, greater = pg - 0.5 * dobs, less = pl - 0.5 * dobs)
}

sample_or <- function(a, b, c, d) {
  if (a == 0 || b == 0 || c == 0 || d == 0) { A <- a + .5; B <- b + .5; C <- c + .5; D <- d + .5 }
  else { A <- a; B <- b; C <- c; D <- d }
  (A * D) / (B * C)
}

compute <- function(a, b, c, d, level) {
  m <- matrix(c(a, b, c, d), nrow = 2, byrow = TRUE)
  ft2 <- fisher.test(m, alternative = "two.sided", conf.level = level)
  ftg <- fisher.test(m, alternative = "greater",   conf.level = level)
  ftl <- fisher.test(m, alternative = "less",      conf.level = level)

  n1 <- a + b; n0 <- c + d; m1 <- a + c; m0 <- b + d; N <- a + b + c + d
  expected <- outer(c(n1, n0), c(m1, m0)) / N
  minExp <- min(expected)
  cs_y <- suppressWarnings(chisq.test(m, correct = TRUE))
  cs_n <- suppressWarnings(chisq.test(m, correct = FALSE))

  mp <- midp_calc(a, b, c, d)

  list(
    a = a, b = b, c = c, d = d, level = level,
    p_two = ft2$p.value, p_greater = ftg$p.value, p_less = ftl$p.value,
    estimate = as.numeric(ft2$estimate),
    ci2_lo = ft2$conf.int[1], ci2_hi = ft2$conf.int[2],
    cig_lo = ftg$conf.int[1], cig_hi = ftg$conf.int[2],
    cil_lo = ftl$conf.int[1], cil_hi = ftl$conf.int[2],
    sample_or = sample_or(a, b, c, d),
    minExp = minExp,
    chisq_y = as.numeric(cs_y$statistic), p_chisq_y = cs_y$p.value,
    chisq_n = as.numeric(cs_n$statistic), p_chisq_n = cs_n$p.value,
    midp_two = as.numeric(mp["two"]),
    midp_greater = as.numeric(mp["greater"]),
    midp_less = as.numeric(mp["less"])
  )
}

# ---- table catalogue (Fisher = small-count territory + a few large) ----
tables <- list(
  c(3,1,1,3), c(8,2,1,9), c(10,2,3,15), c(1,9,8,2), c(2,7,9,3),
  c(6,4,2,8), c(5,5,5,5), c(7,1,2,6), c(4,6,7,3), c(2,3,8,1),
  c(9,1,3,7), c(1,4,9,2), c(2,8,10,4), c(13,3,4,12), c(3,17,11,9),
  # zero cells (single)
  c(0,10,8,5), c(12,0,3,9), c(10,20,0,15), c(15,10,20,0),
  c(0,50,8,42), c(30,0,10,40),
  # zero cells (double / corners)
  c(0,5,5,0), c(5,0,0,5), c(1,0,0,1),
  # min expected >= 5 -> chi-square territory
  c(20,10,15,25), c(30,70,40,60), c(100,50,60,90), c(45,55,35,65),
  # larger, bigger support (near-normal null, viz windowing)
  c(60,40,45,55), c(90,110,70,130)
)

levels <- c(0.90, 0.95, 0.99)
rows <- list()
key <- function(i, lv) sprintf("t%02d_L%d", i, round(lv * 100))

for (i in seq_along(tables)) {
  tb <- tables[[i]]
  for (lv in levels) {
    r <- compute(tb[1], tb[2], tb[3], tb[4], lv)
    rows[[key(i, lv)]] <- r
  }
}

# ---- emit JSON ----------------------------------------------------------
con <- file("Scripts/tool-truth/fisher-exact-test-calculator.json", "w", encoding = "UTF-8")
cat("{\n", file = con)
knames <- names(rows)
for (ki in seq_along(knames)) {
  k <- knames[ki]
  r <- rows[[k]]
  fields <- names(r)
  parts <- vapply(fields, function(f) paste0("\"", f, "\": ", fmt(r[[f]])), character(1))
  cat("  \"", k, "\": {", paste(parts, collapse = ", "), "}", file = con, sep = "")
  cat(if (ki < length(knames)) ",\n" else "\n", file = con)
}
cat("}\n", file = con)
close(con)
cat("wrote", length(rows), "rows\n")
