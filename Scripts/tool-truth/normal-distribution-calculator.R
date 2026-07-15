# Truth table for normal-distribution-calculator
# Ground truth: R 4.6.0 pnorm() / qnorm() on a general Normal(mean, sd).
# Modes: below, above, between, outside (forward area) + inverse (value for
# a left / right / central probability). All arithmetic composed from the
# same pnorm/qnorm the tool reuses via tools/lib/normal-math.js.

g <- function(x) formatC(x, format = "e", digits = 12)  # 13 sig figs

cases <- list()
add <- function(id, mode, inp, out) {
  cases[[length(cases) + 1]] <<- list(id = id, mode = mode, inp = inp, out = out)
}

# ---- BELOW: P(X < x) ----------------------------------------------------
below <- function(id, x, m, s) {
  z <- (x - m) / s
  add(id, "below", list(x = x, mean = m, sd = s),
      list(z = z, p_below = pnorm(x, m, s), p_above = pnorm(x, m, s, lower.tail = FALSE)))
}
below("below_std_196", 1.96, 0, 1)
below("below_iq_130", 130, 100, 15)
below("below_neg_tail", -5, 0, 1)          # deep left tail
below("below_shift", 250, 200, 25)
below("below_exact_mean", 100, 100, 15)    # 0.5

# ---- ABOVE: P(X > x) ----------------------------------------------------
above <- function(id, x, m, s) {
  z <- (x - m) / s
  add(id, "above", list(x = x, mean = m, sd = s),
      list(z = z, p_below = pnorm(x, m, s), p_above = pnorm(x, m, s, lower.tail = FALSE)))
}
above("above_iq_115", 115, 100, 15)
above("above_std_pos", 2.5, 0, 1)
above("above_deep", 6, 0, 1)               # deep right tail
above("above_lo", 70, 100, 15)

# ---- BETWEEN: P(a < X < b) ---------------------------------------------
between <- function(id, a, b, m, s) {
  za <- (a - m) / s; zb <- (b - m) / s
  pr <- pnorm(b, m, s) - pnorm(a, m, s)
  add(id, "between", list(a = a, b = b, mean = m, sd = s),
      list(z_a = za, z_b = zb, p_between = pr, p_outside = 1 - pr))
}
between("between_iq_85_115", 85, 115, 100, 15)     # ~68%
between("between_one_sd", -1, 1, 0, 1)             # 0.6826895
between("between_two_sd", -2, 2, 0, 1)             # 0.9544997
between("between_wide", -4, 4, 0, 1)
between("between_asym", 90, 140, 100, 15)

# ---- OUTSIDE: P(X < a or X > b) = 1 - between --------------------------
outside <- function(id, a, b, m, s) {
  za <- (a - m) / s; zb <- (b - m) / s
  pr <- pnorm(b, m, s) - pnorm(a, m, s)
  add(id, "outside", list(a = a, b = b, mean = m, sd = s),
      list(z_a = za, z_b = zb, p_between = pr, p_outside = 1 - pr))
}
outside("outside_iq_85_115", 85, 115, 100, 15)
outside("outside_two_sd", -2, 2, 0, 1)
outside("outside_narrow", 99, 101, 100, 15)

# ---- INVERSE, left region: value x with P(X < x) = p ------------------
inv_below <- function(id, p, m, s) {
  x <- qnorm(p, m, s)
  add(id, "inv_below", list(p = p, mean = m, sd = s),
      list(x = x, z = (x - m) / s))
}
inv_below("inv_below_975", 0.975, 0, 1)     # 1.959964
inv_below("inv_below_90_iq", 0.90, 100, 15)
inv_below("inv_below_001", 0.001, 0, 1)
inv_below("inv_below_99_shift", 0.99, 200, 25)

# ---- INVERSE, right region: value x with P(X > x) = p -----------------
inv_above <- function(id, p, m, s) {
  x <- qnorm(p, m, s, lower.tail = FALSE)
  add(id, "inv_above", list(p = p, mean = m, sd = s),
      list(x = x, z = (x - m) / s))
}
inv_above("inv_above_05", 0.05, 0, 1)       # 1.644854
inv_above("inv_above_025_iq", 0.025, 100, 15)
inv_above("inv_above_001", 0.001, 0, 1)

# ---- INVERSE, central region: symmetric [lo,hi] holding p -------------
inv_central <- function(id, p, m, s) {
  q <- qnorm((1 + p) / 2)
  lo <- m - q * s; hi <- m + q * s
  add(id, "inv_central", list(p = p, mean = m, sd = s),
      list(lo = lo, hi = hi, z = q))
}
inv_central("inv_central_95_iq", 0.95, 100, 15)
inv_central("inv_central_6827", 0.6826895, 0, 1)   # ~ +/-1
inv_central("inv_central_99", 0.99, 0, 1)

# ---- Emit JSON ---------------------------------------------------------
esc <- function(s) gsub('"', '\\\\"', s)
kv <- function(name, val) paste0('"', name, '":', g(val))
obj <- function(lst) paste0("{", paste(mapply(function(n, v) kv(n, v), names(lst), lst), collapse = ","), "}")

parts <- vapply(cases, function(c) {
  paste0('{"id":"', esc(c$id), '","mode":"', c$mode, '",',
         '"inp":', obj(c$inp), ',',
         '"out":', obj(c$out), '}')
}, character(1))

json <- paste0("[\n", paste(parts, collapse = ",\n"), "\n]\n")
writeLines(json, "Scripts/tool-truth/normal-distribution-calculator.json")
cat("wrote", length(cases), "cases\n")
