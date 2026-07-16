# Truth table for empirical-rule-calculator (the 68-95-99.7 rule).
# All math composes R's pnorm()/qnorm(); the JS reuses tools/lib/normal-math.js.
# Run: Rscript.exe Scripts/tool-truth/empirical-rule-calculator.R
options(digits = 15)

cases <- list()
add <- function(id, ...) cases[[length(cases) + 1]] <<- c(list(id = id), list(...))

# ---- Mode A: the three empirical-rule bands, exact areas ----
# For k SD around the mean: within = pnorm(k) - pnorm(-k); each tail = pnorm(-k).
for (k in 1:3) {
  within  <- pnorm(k) - pnorm(-k)
  tail1   <- pnorm(-k)
  outside <- 2 * pnorm(-k)
  add(paste0("band_k", k), k = k, within = within, tail_each = tail1, outside = outside)
}

# Band ranges for a concrete distribution: mean 100, sd 15 (an IQ scale).
bands_ranges <- function(mean, sd, id) {
  for (k in 1:3) {
    add(paste0(id, "_k", k), mean = mean, sd = sd, k = k,
        lo = mean - k * sd, hi = mean + k * sd,
        within = pnorm(k) - pnorm(-k))
  }
}
bands_ranges(100, 15, "iq")
bands_ranges(64, 2.5, "height")   # heights in inches ~ N(64, 2.5)
bands_ranges(0, 1, "std")
bands_ranges(-3.2, 0.8, "neg")    # negative mean

# ---- Mode B: value-to-band lookup ----
# z = (x - mean)/sd; within |z| = 2*pnorm(|z|)-1; beyond = 2*pnorm(-|z|);
# below = pnorm(z); above = pnorm(-z).
val <- function(x, mean, sd, id) {
  z  <- (x - mean) / sd
  az <- abs(z)
  add(id, x = x, mean = mean, sd = sd, z = z,
      within = 2 * pnorm(az) - 1,
      beyond = 2 * pnorm(-az),
      below  = pnorm(z),
      above  = pnorm(-z),
      pct_below = pnorm(z) * 100)
}
val(130, 100, 15, "v_iq130")   # z = 2 exactly
val(115, 100, 15, "v_iq115")   # z = 1 exactly
val(85,  100, 15, "v_iq85")    # z = -1
val(100, 100, 15, "v_atmean")  # z = 0
val(137, 100, 15, "v_iq137")   # z = 2.4667, in 2-3 SD band
val(160, 100, 15, "v_iq160")   # z = 4, way beyond 3 SD
val(68.5, 64, 2.5, "v_h685")   # z = 1.8
val(-5.0, -3.2, 0.8, "v_neg")  # z = -2.25

# ---- Mode C: reverse, range covering a target central proportion ----
# z = qnorm((1+c)/2); range = mean +/- z*sd; each tail = (1-c)/2.
rev <- function(cover, mean, sd, id) {
  z  <- qnorm((1 + cover) / 2)
  add(id, cover = cover, mean = mean, sd = sd, z = z,
      lo = mean - z * sd, hi = mean + z * sd,
      tail_each = (1 - cover) / 2)
}
rev(0.68,  100, 15, "r_68")    # z ~ 0.9945 (rule rounds to 1 SD)
rev(0.95,  100, 15, "r_95")    # z ~ 1.960  (rule rounds to 2 SD)
rev(0.997, 100, 15, "r_997")   # z ~ 2.968  (rule rounds to 3 SD)
rev(0.90,  100, 15, "r_90")    # z ~ 1.645
rev(0.50,  0,   1,  "r_50")    # z ~ 0.6745 (IQR-ish)
rev(0.99,  50,  10, "r_99")    # z ~ 2.576

# ---- serialize (minimal JSON writer, avoid jsonlite dependency) ----
to_json_val <- function(v) {
  if (is.character(v)) return(paste0('"', v, '"'))
  if (is.numeric(v)) {
    if (!is.finite(v)) return(paste0('"', v, '"'))
    return(formatC(v, format = "g", digits = 15))
  }
  paste0('"', as.character(v), '"')
}
parts <- vapply(cases, function(c) {
  kv <- vapply(names(c), function(nm) paste0('"', nm, '":', to_json_val(c[[nm]])), character(1))
  paste0("{", paste(kv, collapse = ","), "}")
}, character(1))
json <- paste0("[\n  ", paste(parts, collapse = ",\n  "), "\n]\n")
writeLines(json, "Scripts/tool-truth/empirical-rule-calculator.json")
cat("wrote", length(cases), "cases\n")
