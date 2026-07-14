# Ground truth for tools/type-i-ii-error-visualizer.html
# R 4.6.0 + pwr. Emits type-i-ii-error-visualizer.json consumed by the node harness.
# Every displayed number the tool shows (power, beta, critical value, ncp) is verified here.
suppressMessages(library(pwr))

rows <- list()
add <- function(...) { rows[[length(rows) + 1L]] <<- list(...) }

# ---- helpers matching the tool's display formulas ----
critT   <- function(alpha, df, tail)  if (tail == 1) qt(1 - alpha, df)      else qt(1 - alpha/2, df)
critZ   <- function(alpha, tail)      if (tail == 1) qnorm(1 - alpha)       else qnorm(1 - alpha/2)
critFv  <- function(alpha, d1, d2)    qf(1 - alpha, d1, d2)
critRr  <- function(alpha, n, tail) { tt <- if (tail == 1) qt(1 - alpha, n - 2) else qt(1 - alpha/2, n - 2); sqrt(tt^2 / (tt^2 + n - 2)) }

# ============================ one-sample t ============================
for (p in list(
  list(d = 0.5,  n = 30,  a = 0.05, tl = 2), list(d = 0.5, n = 34, a = 0.05, tl = 2),
  list(d = 0.8,  n = 20,  a = 0.05, tl = 1), list(d = 0.2, n = 100, a = 0.01, tl = 2),
  list(d = -0.5, n = 30,  a = 0.05, tl = 2), list(d = 0.5, n = 30, a = 0.10, tl = 1),
  list(d = 0.0,  n = 30,  a = 0.05, tl = 2), list(d = 1.5, n = 5,  a = 0.05, tl = 2),
  list(d = 0.3,  n = 30,  a = 0.001, tl = 2))) {
  pw <- tryCatch(pwr.t.test(d = p$d, n = p$n, sig.level = p$a, type = "one.sample",
                            alternative = if (p$tl == 1) "greater" else "two.sided")$power,
                 error = function(e) p$a)
  add(design = "oneT", effect = p$d, n = p$n, alpha = p$a, tail = p$tl,
      power = pw, ncp = abs(p$d) * sqrt(p$n), crit = critT(p$a, p$n - 1, p$tl), df = p$n - 1)
}

# ============================ two-sample t ============================
for (p in list(
  list(d = 0.5, n = 30, a = 0.05, tl = 2), list(d = 0.5, n = 64, a = 0.05, tl = 2),
  list(d = 0.3, n = 20, a = 0.05, tl = 2), list(d = 0.5, n = 30, a = 0.01, tl = 2),
  list(d = 0.5, n = 105, a = 0.05, tl = 2), list(d = 0.1, n = 200, a = 0.05, tl = 2),
  list(d = 0.8, n = 15, a = 0.05, tl = 1), list(d = -0.6, n = 25, a = 0.05, tl = 2),
  list(d = 0.0, n = 40, a = 0.05, tl = 2))) {
  pw <- tryCatch(pwr.t.test(d = p$d, n = p$n, sig.level = p$a, type = "two.sample",
                            alternative = if (p$tl == 1) "greater" else "two.sided")$power,
                 error = function(e) p$a)
  add(design = "twoT", effect = p$d, n = p$n, alpha = p$a, tail = p$tl,
      power = pw, ncp = abs(p$d) * sqrt(p$n / 2), crit = critT(p$a, 2 * p$n - 2, p$tl), df = 2 * p$n - 2)
}

# ============================ one-proportion ============================
for (p in list(
  list(p0 = 0.50, p1 = 0.65, n = 30, a = 0.05, tl = 2),
  list(p0 = 0.03, p1 = 0.08, n = 100, a = 0.05, tl = 1),
  list(p0 = 0.50, p1 = 0.50, n = 40, a = 0.05, tl = 2),
  list(p0 = 0.10, p1 = 0.30, n = 25, a = 0.01, tl = 2),
  list(p0 = 0.90, p1 = 0.70, n = 30, a = 0.05, tl = 2))) {
  h <- ES.h(p$p1, p$p0)
  pw <- pwr.p.test(h = h, n = p$n, sig.level = p$a,
                   alternative = if (p$tl == 1) "greater" else "two.sided")$power
  add(design = "oneProp", p0 = p$p0, p1 = p$p1, n = p$n, alpha = p$a, tail = p$tl,
      power = pw, h = h, ncp = abs(h) * sqrt(p$n), crit = critZ(p$a, p$tl))
}

# ============================ two-proportion ============================
for (p in list(
  list(p1 = 0.50, p2 = 0.65, n = 30, a = 0.05, tl = 2),
  list(p1 = 0.12, p2 = 0.15, n = 500, a = 0.05, tl = 2),
  list(p1 = 0.50, p2 = 0.50, n = 60, a = 0.05, tl = 2),
  list(p1 = 0.20, p2 = 0.40, n = 40, a = 0.01, tl = 1),
  list(p1 = 0.80, p2 = 0.60, n = 45, a = 0.05, tl = 2))) {
  h <- ES.h(p$p2, p$p1)
  pw <- pwr.2p.test(h = h, n = p$n, sig.level = p$a,
                    alternative = if (p$tl == 1) "greater" else "two.sided")$power
  add(design = "twoProp", p1 = p$p1, p2 = p$p2, n = p$n, alpha = p$a, tail = p$tl,
      power = pw, h = h, ncp = abs(h) * sqrt(p$n / 2), crit = critZ(p$a, p$tl))
}

# ============================ one-way ANOVA ============================
for (p in list(
  list(f = 0.25, k = 4, n = 30, a = 0.05), list(f = 0.10, k = 3, n = 50, a = 0.05),
  list(f = 0.40, k = 2, n = 20, a = 0.05), list(f = 0.25, k = 4, n = 30, a = 0.01),
  list(f = 0.50, k = 6, n = 10, a = 0.05), list(f = 0.05, k = 5, n = 15, a = 0.05),
  list(f = 0.80, k = 3, n = 8, a = 0.05))) {
  pw <- pwr.anova.test(k = p$k, n = p$n, f = p$f, sig.level = p$a)$power
  d1 <- p$k - 1; d2 <- p$k * p$n - p$k
  add(design = "anova", effect = p$f, k = p$k, n = p$n, alpha = p$a, tail = 1,
      power = pw, ncp = p$f^2 * p$k * p$n, crit = critFv(p$a, d1, d2), df1 = d1, df2 = d2)
}

# ============================ correlation (Fisher-z) ============================
for (p in list(
  list(r = 0.30, n = 30, a = 0.05, tl = 2), list(r = 0.40, n = 30, a = 0.05, tl = 2),
  list(r = 0.50, n = 20, a = 0.05, tl = 1), list(r = 0.10, n = 100, a = 0.05, tl = 2),
  list(r = -0.60, n = 25, a = 0.01, tl = 2), list(r = 0.00, n = 30, a = 0.05, tl = 2),
  list(r = 0.90, n = 8, a = 0.05, tl = 2), list(r = 0.25, n = 84, a = 0.05, tl = 2))) {
  pw <- tryCatch(pwr.r.test(r = p$r, n = p$n, sig.level = p$a,
                            alternative = if (p$tl == 1) "greater" else "two.sided")$power,
                 error = function(e) p$a)
  rr <- abs(p$r)
  ncp_std <- (atanh(rr) + rr / (2 * (p$n - 1))) * sqrt(p$n - 3)
  add(design = "correlation", effect = p$r, n = p$n, alpha = p$a, tail = p$tl,
      power = pw, ncp = ncp_std, crit = critRr(p$a, p$n, p$tl), df = p$n - 2)
}

# ---- emit JSON (manual writer; numbers at full precision) ----
esc <- function(s) gsub('"', '\\\\"', s)
num <- function(x) if (is.null(x) || length(x) == 0 || !is.finite(x)) "null" else formatC(x, format = "g", digits = 15)
tojson <- function(o) {
  parts <- vapply(names(o), function(k) {
    v <- o[[k]]
    if (is.character(v)) paste0('"', k, '":"', esc(v), '"') else paste0('"', k, '":', num(v))
  }, character(1))
  paste0("{", paste(parts, collapse = ","), "}")
}
body <- paste(vapply(rows, tojson, character(1)), collapse = ",\n")
out <- paste0("[\n", body, "\n]\n")
writeLines(out, "Scripts/tool-truth/type-i-ii-error-visualizer.json")
cat("wrote", length(rows), "cases\n")
