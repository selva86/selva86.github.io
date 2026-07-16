# Truth table for tools/sample-size-calculator.html (the sample-size hub).
#
# WHAT IS BEING VERIFIED, HONESTLY:
# Base R ships no sample-size-for-a-margin-of-error function, so there is no
# black-box oracle to diff against here the way pwr.t.test served the t-test
# page. What R IS an oracle for is the part that is not arithmetic: qnorm().
# So this file computes the same closed forms the page uses, in R, from R's
# own qnorm, and the JS harness must reproduce every field. That pins:
#   * the normal quantile at 90/95/99 (the only non-trivial numeric step),
#   * the closed-form arithmetic,
#   * the finite-population correction algebra,
#   * the ceiling convention (always round UP to a whole respondent).
# It does not, and cannot, independently confirm the formula CHOICE. That is
# a modelling decision, taught on the page and stated in the method table.
#
# Formulas (Cochran):
#   proportion : n0 = z^2 * p(1-p) / E^2
#   mean       : n0 = (z * sd / E)^2
#   finite pop : n  = n0 / (1 + (n0 - 1)/N)      [matches margin-math.js
#                                                 sampleSizeProp, which this
#                                                 page composes rather than
#                                                 reimplements]
#   reported n = ceiling(n)
#
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/sample-size-calculator.R

zcrit <- function(conf) qnorm(1 - (1 - conf) / 2)

fpc_apply <- function(n0, Npop) {
  if (is.null(Npop) || is.na(Npop) || !is.finite(Npop)) return(n0)
  n0 / (1 + (n0 - 1) / Npop)
}

ss_prop <- function(E, p, conf, Npop = NA) {
  z  <- zcrit(conf)
  n0 <- z * z * p * (1 - p) / (E * E)
  n  <- fpc_apply(n0, Npop)
  list(n0 = n0, n_exact = n, n = ceiling(n), z = z)
}

ss_mean <- function(E, sd, conf, Npop = NA) {
  z  <- zcrit(conf)
  n0 <- (z * sd / E)^2
  n  <- fpc_apply(n0, Npop)
  list(n0 = n0, n_exact = n, n = ceiling(n), z = z)
}

cases <- list()
add <- function(id, mode, args, out) {
  cases[[length(cases) + 1]] <<- list(
    id = id, mode = mode, args = args,
    n0 = out$n0, n_exact = out$n_exact, n = out$n, z = out$z
  )
}

# ---------------------------------------------------------------- z criticals
# The one genuinely non-trivial number on the page. 90/95/99 plus the ends.
zs <- list()
for (cf in c(0.80, 0.90, 0.95, 0.98, 0.99, 0.999)) {
  zs[[length(zs) + 1]] <- list(conf = cf, z = zcrit(cf))
}

# ------------------------------------------------------- proportion, infinite
# p = 0.5 is the worst case: p(1-p) is maximised there, so it is the
# no-prior-knowledge default every polling shop uses.
for (cf in c(0.90, 0.95, 0.99)) {
  for (E in c(0.01, 0.02, 0.03, 0.05, 0.10)) {
    for (p in c(0.5, 0.1, 0.3, 0.8, 0.95)) {
      add(sprintf("prop_c%.2f_E%.2f_p%.2f", cf, E, p), "prop",
          list(E = E, p = p, conf = cf, Npop = NULL),
          ss_prop(E, p, cf))
    }
  }
}

# The textbook headline: 95%, +/-3%, p=0.5 -> 1068 (often quoted as ~1067/1100).
add("prop_headline_95_3pct", "prop",
    list(E = 0.03, p = 0.5, conf = 0.95, Npop = NULL),
    ss_prop(0.03, 0.5, 0.95))

# ---------------------------------------------------- proportion, finite pop
for (N in c(100, 500, 1000, 5000, 20000, 100000, 1e6)) {
  for (cf in c(0.90, 0.95, 0.99)) {
    for (E in c(0.03, 0.05)) {
      add(sprintf("propfpc_N%d_c%.2f_E%.2f", N, cf, E), "prop",
          list(E = E, p = 0.5, conf = cf, Npop = N),
          ss_prop(E, 0.5, cf, N))
    }
  }
}

# FPC edge: population SMALLER than the infinite-pop requirement. The
# correction must pull n below N, never above it (a census is the ceiling).
add("propfpc_tiny_N50", "prop", list(E = 0.03, p = 0.5, conf = 0.95, Npop = 50),
    ss_prop(0.03, 0.5, 0.95, 50))
add("propfpc_tiny_N30", "prop", list(E = 0.05, p = 0.5, conf = 0.99, Npop = 30),
    ss_prop(0.05, 0.5, 0.99, 30))
# Huge population: the correction must fade to ~nothing.
add("propfpc_huge_N1e9", "prop", list(E = 0.03, p = 0.5, conf = 0.95, Npop = 1e9),
    ss_prop(0.03, 0.5, 0.95, 1e9))

# --------------------------------------------------------- mean, infinite pop
for (cf in c(0.90, 0.95, 0.99)) {
  for (sd in c(1, 4, 15, 100)) {
    for (E in c(0.5, 1, 2, 5)) {
      add(sprintf("mean_c%.2f_sd%g_E%g", cf, sd, E), "mean",
          list(E = E, sd = sd, conf = cf, Npop = NULL),
          ss_mean(E, sd, cf))
    }
  }
}

# IQ-style headline: sd 15, E 2, 95% -> 217.
add("mean_headline_iq", "mean", list(E = 2, sd = 15, conf = 0.95, Npop = NULL),
    ss_mean(2, 15, 0.95))

# ------------------------------------------------------------ mean, finite pop
for (N in c(200, 1000, 10000, 500000)) {
  for (cf in c(0.90, 0.95, 0.99)) {
    add(sprintf("meanfpc_N%d_c%.2f", N, cf), "mean",
        list(E = 2, sd = 15, conf = cf, Npop = N),
        ss_mean(2, 15, cf, N))
  }
}
add("meanfpc_tiny_N40", "mean", list(E = 2, sd = 15, conf = 0.95, Npop = 40),
    ss_mean(2, 15, 0.95, 40))

# ------------------------------------------------------------------ edge cases
# Margin so wide that a handful of people will do -> n must still be >= 1.
add("mean_edge_hugeE", "mean", list(E = 100, sd = 1, conf = 0.95, Npop = NULL),
    ss_mean(100, 1, 0.95))
add("prop_edge_hugeE", "prop", list(E = 0.5, p = 0.5, conf = 0.95, Npop = NULL),
    ss_prop(0.5, 0.5, 0.95))
# Ceiling convention: an exact-integer n0 must NOT be bumped up a whole person.
# E chosen so z^2*p(1-p)/E^2 lands on an integer.
E_int <- sqrt(zcrit(0.95)^2 * 0.25 / 100)   # -> n0 exactly 100
add("prop_edge_exact_int", "prop", list(E = E_int, p = 0.5, conf = 0.95, Npop = NULL),
    ss_prop(E_int, 0.5, 0.95))
# p at the boundary: p(1-p) = 0, so no sampling variance to cover.
add("prop_edge_p0", "prop", list(E = 0.03, p = 0, conf = 0.95, Npop = NULL),
    ss_prop(0.03, 0, 0.95))
add("prop_edge_p1", "prop", list(E = 0.03, p = 1, conf = 0.95, Npop = NULL),
    ss_prop(0.03, 1, 0.95))
# Very tight margins -> very large n (the 1/E^2 blow-up).
add("prop_edge_E001", "prop", list(E = 0.001, p = 0.5, conf = 0.99, Npop = NULL),
    ss_prop(0.001, 0.5, 0.99))
add("mean_edge_tinyE", "mean", list(E = 0.01, sd = 1, conf = 0.99, Npop = NULL),
    ss_mean(0.01, 1, 0.99))

# ------------------------------- margin actually achieved at the rounded-up n
# The page reports the exact n AND the margin the whole-person n really buys
# (always a shade tighter than asked, because ceiling only ever adds people).
# These reuse margin-math.js's propMOE/meanMOE, already verified by the
# margin-of-error tool; re-pinned here so the round trip n -> margin is
# self-consistent on THIS page. Both use z, matching the z-based n formula.
moe_fpc <- function(n, Npop) {
  if (is.null(Npop) || is.na(Npop) || !is.finite(Npop)) return(1)
  if (Npop <= 1) return(1)
  sqrt((Npop - n) / (Npop - 1))
}
ach <- list()
add_ach <- function(id, mode, args, moe) {
  ach[[length(ach) + 1]] <<- list(id = id, mode = mode, args = args, moe = moe)
}
for (cf in c(0.90, 0.95, 0.99)) {
  for (E in c(0.01, 0.03, 0.05)) {
    r <- ss_prop(E, 0.5, cf)
    m <- zcrit(cf) * sqrt(0.5 * 0.5 / r$n) * moe_fpc(r$n, NA)
    add_ach(sprintf("ach_prop_c%.2f_E%.2f", cf, E), "prop",
            list(E = E, p = 0.5, conf = cf, Npop = NULL, n = r$n), m)
  }
  r <- ss_mean(2, 15, cf)
  m <- zcrit(cf) * (15 / sqrt(r$n)) * moe_fpc(r$n, NA)
  add_ach(sprintf("ach_mean_c%.2f", cf), "mean",
          list(E = 2, sd = 15, conf = cf, Npop = NULL, n = r$n), m)
}
# With a finite population the achieved margin shrinks further.
for (N in c(500, 5000)) {
  r <- ss_prop(0.03, 0.5, 0.95, N)
  m <- zcrit(0.95) * sqrt(0.25 / r$n) * moe_fpc(r$n, N)
  add_ach(sprintf("ach_propfpc_N%d", N), "prop",
          list(E = 0.03, p = 0.5, conf = 0.95, Npop = N, n = r$n), m)
  r <- ss_mean(2, 15, 0.95, N)
  m <- zcrit(0.95) * (15 / sqrt(r$n)) * moe_fpc(r$n, N)
  add_ach(sprintf("ach_meanfpc_N%d", N), "mean",
          list(E = 2, sd = 15, conf = 0.95, Npop = N, n = r$n), m)
}

# ------------------------------------------- quartering law (taught on page)
# Halving E must roughly QUADRUPLE n. Emitted so the harness can assert the
# exact 4x, not just eyeball the claim in the prose.
q <- list()
for (E in c(0.08, 0.04, 0.02, 0.01)) {
  r <- ss_prop(E, 0.5, 0.95)
  q[[length(q) + 1]] <- list(E = E, n0 = r$n0, n = r$n)
}

out <- list(
  meta = list(
    generated_by = "Scripts/tool-truth/sample-size-calculator.R",
    R_version = paste(R.version$major, R.version$minor, sep = "."),
    note = paste("Closed-form Cochran sample size from R's own qnorm.",
                 "R has no built-in n-for-margin function; qnorm is the oracle.")
  ),
  zcrit = zs,
  quartering = q,
  achieved = ach,
  cases = cases
)

json <- jsonlite::toJSON(out, auto_unbox = TRUE, digits = 17, null = "null")
writeLines(json, "Scripts/tool-truth/sample-size-calculator.json")
cat("cases:", length(cases), "\n")
cat("headline prop 95/3%/p=.5 ->", ss_prop(0.03, 0.5, 0.95)$n, "\n")
cat("headline mean sd15/E2/95% ->", ss_mean(2, 15, 0.95)$n, "\n")
cat("z(0.95) =", format(zcrit(0.95), digits = 17), "\n")
