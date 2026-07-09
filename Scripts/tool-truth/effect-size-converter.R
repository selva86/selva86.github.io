# =====================================================================
# Effect Size Converter - R truth table
# Ground truth for tools/lib/effect-size-math.js
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/effect-size-converter.R
# Emits: Scripts/tool-truth/effect-size-converter.json
#
# All conversions are exact closed forms (Cohen 1988; Borenstein et al. 2009;
# Hasselblad & Hedges 1995; Kraemer & Kupfer 2006). The two genuinely-inverted
# quantities are verified against base R's own routines:
#   - exact Hedges' J  via lgamma()   (matches effectsize::hedges_g)
#   - exact d CI        via pt(.,ncp) + uniroot  (noncentral-t; matches MBESS::ci.smd)
# =====================================================================

options(digits = 15)

# ---- closed-form conversions -----------------------------------------
d_to_r  <- function(d, n1 = NA, n2 = NA) {
  a <- if (is.na(n1) || is.na(n2) || n1 == n2) 4 else (n1 + n2)^2 / (n1 * n2)
  d / sqrt(d * d + a)
}
r_to_d  <- function(r) 2 * r / sqrt(1 - r * r)
d_to_or <- function(d) exp(d * pi / sqrt(3))
or_to_d <- function(or) log(or) * sqrt(3) / pi
eta2_to_f <- function(e) sqrt(e / (1 - e))
f_to_eta2 <- function(f) (f * f) / (1 + f * f)
d_to_cles <- function(d) pnorm(d / sqrt(2))
cles_to_d <- function(p) sqrt(2) * qnorm(p)

# exact Hedges' correction factor J (df = n1 + n2 - 2)
hedges_J <- function(n1, n2) {
  df <- n1 + n2 - 2
  exp(lgamma(df / 2) - 0.5 * log(df / 2) - lgamma((df - 1) / 2))
}
d_to_g <- function(d, n1, n2) d * hedges_J(n1, n2)
g_to_d <- function(g, n1, n2) g / hedges_J(n1, n2)

# Kraemer & Kupfer (2006) distributional NNT: 1 / SRD, SRD = 2*CLES - 1
d_to_nnt <- function(d) {
  srd <- 2 * pnorm(d / sqrt(2)) - 1
  if (srd <= 0) return(Inf)
  1 / srd
}

# canonical Cohen's d from any source (matches the tool's routing)
to_d <- function(kind, v, n1 = 50, n2 = 50) {
  switch(kind,
    d    = v,
    r    = r_to_d(v),
    or   = or_to_d(v),
    eta2 = 2 * sqrt(v / (1 - v)),   # = 2f ; equals r_to_d(sqrt(eta2))
    f    = 2 * v,
    stop("bad kind"))
}

# exact noncentral-t CI for the standardized mean difference (two independent groups)
ci_smd <- function(d, n1, n2, level) {
  alpha <- 1 - level
  df <- n1 + n2 - 2
  scale <- sqrt(n1 * n2 / (n1 + n2))     # t = d * scale ; ncp = delta * scale
  tval <- d * scale
  fL <- function(ncp) pt(tval, df, ncp) - (1 - alpha / 2)  # lower ncp limit
  fU <- function(ncp) pt(tval, df, ncp) - (alpha / 2)      # upper ncp limit
  ncpL <- uniroot(fL, interval = c(tval - 40, tval + 40), extendInt = "yes", tol = 1e-10)$root
  ncpU <- uniroot(fU, interval = c(tval - 40, tval + 40), extendInt = "yes", tol = 1e-10)$root
  c(ncpL / scale, ncpU / scale)
}

# Fisher-z CI for Pearson r
ci_r <- function(r, n, level) {
  alpha <- 1 - level
  z  <- atanh(r)
  se <- 1 / sqrt(n - 3)
  zc <- qnorm(1 - alpha / 2)
  c(tanh(z - zc * se), tanh(z + zc * se))
}

# clinical OR + baseline -> p2, RR, ARR, NNT
or_clinical <- function(or, p1) {
  odds1 <- p1 / (1 - p1)
  odds2 <- or * odds1
  p2 <- odds2 / (1 + odds2)
  arr <- p2 - p1
  list(p2 = p2, rr = p2 / p1, arr = arr, nnt = if (arr == 0) Inf else 1 / abs(arr))
}

esc <- function(x) if (is.na(x) || is.infinite(x)) "null" else formatC(x, format = "e", digits = 12)

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- list(...)

# ---- SOURCE = Cohen's d : full derived set + exact CI at 3 levels ----
d_grid <- list(
  c(0.5, 50, 50), c(-0.5, 50, 50), c(0.2, 30, 70), c(0.8, 12, 12),
  c(1.3, 200, 200), c(2.5, 8, 8), c(0.0, 40, 40), c(-1.2, 25, 75), c(0.65, 30, 30)
)
for (g in d_grid) {
  d <- g[1]; n1 <- g[2]; n2 <- g[3]
  ci95 <- ci_smd(d, n1, n2, 0.95); ci90 <- ci_smd(d, n1, n2, 0.90); ci99 <- ci_smd(d, n1, n2, 0.99)
  add(id = sprintf("d_%s_%d_%d", d, n1, n2), kind = "d", d = d, n1 = n1, n2 = n2,
      r = d_to_r(d, n1, n2), or = d_to_or(d), g = d_to_g(d, n1, n2),
      eta2 = d_to_r(d, n1, n2)^2, f = eta2_to_f(d_to_r(d, n1, n2)^2),
      cles = d_to_cles(d), nnt = d_to_nnt(d),
      dci_lo90 = ci90[1], dci_hi90 = ci90[2],
      dci_lo95 = ci95[1], dci_hi95 = ci95[2],
      dci_lo99 = ci99[1], dci_hi99 = ci99[2])
}

# ---- SOURCE = Hedges' g : recover d via exact J ----------------------
for (g in list(c(0.48, 50, 50), c(0.6, 20, 20), c(-0.4, 15, 25), c(1.0, 100, 100))) {
  gg <- g[1]; n1 <- g[2]; n2 <- g[3]
  add(id = sprintf("g_%s_%d_%d", gg, n1, n2), kind = "g", g = gg, n1 = n1, n2 = n2,
      d = g_to_d(gg, n1, n2), J = hedges_J(n1, n2))
}

# ---- SOURCE = Pearson r : canonical d + Fisher CI --------------------
r_grid <- list(c(0.30, 100), c(-0.30, 100), c(0.10, 30), c(0.50, 200),
               c(0.85, 40), c(0.99, 10), c(0.0, 50))
for (g in r_grid) {
  r <- g[1]; n <- g[2]
  c95 <- ci_r(r, n, 0.95); c90 <- ci_r(r, n, 0.90); c99 <- ci_r(r, n, 0.99)
  add(id = sprintf("r_%s_%d", r, n), kind = "r", r = r, n = n,
      d = r_to_d(r), or = d_to_or(r_to_d(r)), cles = d_to_cles(r_to_d(r)),
      rci_lo90 = c90[1], rci_hi90 = c90[2],
      rci_lo95 = c95[1], rci_hi95 = c95[2],
      rci_lo99 = c99[1], rci_hi99 = c99[2])
}

# ---- SOURCE = Odds ratio : canonical d + clinical RR/ARR/NNT ---------
for (g in list(c(2.0, 0.20), c(0.5, 0.30), c(3.5, 0.10), c(8.0, 0.05), c(1.0, 0.40), c(0.25, 0.50))) {
  or <- g[1]; p1 <- g[2]
  cl <- or_clinical(or, p1)
  add(id = sprintf("or_%s_%s", or, p1), kind = "or", or = or, p1 = p1,
      d = or_to_d(or), r = d_to_r(or_to_d(or)),
      p2 = cl$p2, rr = cl$rr, arr = cl$arr, nnt_clin = cl$nnt)
}

# ---- SOURCE = eta-squared : Cohen's f + canonical d ------------------
for (e in c(0.001, 0.01, 0.06, 0.14, 0.30, 0.50, 0.80)) {
  add(id = sprintf("eta2_%s", e), kind = "eta2", eta2 = e,
      f = eta2_to_f(e), d = to_d("eta2", e), r = d_to_r(to_d("eta2", e)))
}

# ---- SOURCE = Cohen's f : eta-squared + canonical d ------------------
for (f in c(0.10, 0.25, 0.40, 0.80, 1.20)) {
  add(id = sprintf("f_%s", f), kind = "f", f = f,
      eta2 = f_to_eta2(f), d = to_d("f", f))
}

# ---- CLES -> d round trip --------------------------------------------
for (p in c(0.55, 0.638, 0.70, 0.84)) {
  add(id = sprintf("cles_%s", p), kind = "cles", cles = p, d = cles_to_d(p))
}

# ---- serialize -------------------------------------------------------
to_json_val <- function(v) {
  if (is.character(v)) return(sprintf('"%s"', v))
  if (is.logical(v))   return(tolower(as.character(v)))
  esc(v)
}
rows <- vapply(cases, function(cs) {
  kv <- vapply(names(cs), function(k) sprintf('"%s": %s', k, to_json_val(cs[[k]])), character(1))
  paste0("  {", paste(kv, collapse = ", "), "}")
}, character(1))
json <- paste0("[\n", paste(rows, collapse = ",\n"), "\n]\n")
writeLines(json, "Scripts/tool-truth/effect-size-converter.json")
cat("Wrote", length(cases), "cases to Scripts/tool-truth/effect-size-converter.json\n")

# sanity prints
cat("\n-- spot checks --\n")
cat("d=0.5 -> r =", d_to_r(0.5), "(expect ~0.2425)\n")
cat("OR=2 -> d =", or_to_d(2), "(expect ~0.3823)\n")
cat("d=0.5 -> CLES =", d_to_cles(0.5), "(expect ~0.6382)\n")
cat("eta2=0.06 -> f =", eta2_to_f(0.06), "(expect ~0.2526)\n")
cat("r=0.3 -> d =", r_to_d(0.3), "(expect ~0.6290)\n")
cat("d=0.5,n=50/50 95% CI =", paste(round(ci_smd(0.5, 50, 50, 0.95), 4), collapse = ", "), "\n")
cat("exact J(20,20) =", hedges_J(20, 20), "vs approx 1-3/(4*38-1) =", 1 - 3/(4*38 - 1), "\n")
