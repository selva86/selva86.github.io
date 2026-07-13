# Ground truth for the Cronbach's alpha calculator (Tool Farm v2, W1.5).
# Every displayed number is verified against psych::alpha() 2.6.5 on R 4.6.0.
#   raw_alpha / std.alpha / G6 / average_r / S/N / ase / mean / sd / median_r
#                                        -> psych::alpha()$total
#   Feldt 90/95/99 CI                    -> psych::alpha.ci(raw_alpha, nsub, nvar, p.val)
#   item stats (n/raw.r/std.r/r.cor/r.drop/mean/sd) -> psych::alpha()$item.stats
#   alpha-if-deleted table               -> psych::alpha()$alpha.drop
#   inter-item r min/max                 -> range(cor(x, use=use)[lower.tri])
# Emits Scripts/tool-truth/cronbachs-alpha-calculator.json.
suppressWarnings(suppressPackageStartupMessages({
  library(psych); library(jsonlite)
}))
options(warn = -1)

# ---- helper: full extraction for one matrix + one `use` mode ----------------
extract <- function(x, use) {
  x <- as.matrix(x)
  storage.mode(x) <- "double"
  nsub <- nrow(x)
  a <- suppressWarnings(psych::alpha(x, use = use, warnings = FALSE, discrete = FALSE))
  tot <- a$total
  nvar <- a$nvar
  # kept-item R matrix (psych deletes zero-variance items first)
  isd <- apply(x, 2, sd, na.rm = TRUE)
  bad <- which(is.na(isd) | isd <= 0)
  xk <- if (length(bad) > 0) x[, -bad, drop = FALSE] else x
  Rk <- suppressWarnings(cor(xk, use = use))
  lt <- Rk[lower.tri(Rk)]
  feldt_lvl <- function(p) {
    ci <- psych::alpha.ci(tot[1, "raw_alpha"], nsub, nvar, p.val = p)
    c(lower = as.numeric(ci$lower.ci), upper = as.numeric(ci$upper.ci))
  }
  f90 <- feldt_lvl(0.10); f95 <- feldt_lvl(0.05); f99 <- feldt_lvl(0.01)
  istats <- a$item.stats
  adrop  <- a$alpha.drop
  items <- lapply(seq_len(nrow(istats)), function(i) {
    row <- list(
      name  = rownames(istats)[i],
      n     = as.numeric(istats[i, "n"]),
      raw_r = as.numeric(istats[i, "raw.r"]),
      std_r = as.numeric(istats[i, "std.r"]),
      r_cor = as.numeric(istats[i, "r.cor"]),
      r_drop = as.numeric(istats[i, "r.drop"]),
      mean  = as.numeric(istats[i, "mean"]),
      sd    = as.numeric(istats[i, "sd"])
    )
    # alpha-if-deleted row (present when nvar > 2; for 2 items psych fills a
    # degenerate row we still record)
    if (!is.null(adrop) && i <= nrow(adrop)) {
      row$drop_raw   <- as.numeric(adrop[i, "raw_alpha"])
      row$drop_std   <- as.numeric(adrop[i, "std.alpha"])
      row$drop_G6    <- as.numeric(adrop[i, "G6(smc)"])
      row$drop_avr   <- as.numeric(adrop[i, "average_r"])
      row$drop_sn    <- as.numeric(adrop[i, "S/N"])
      ase_col <- if ("alpha se" %in% colnames(adrop)) "alpha se" else NA
      row$drop_ase   <- if (!is.na(ase_col)) as.numeric(adrop[i, ase_col]) else NA
      row$drop_varr  <- as.numeric(adrop[i, "var.r"])
      row$drop_medr  <- as.numeric(adrop[i, "med.r"])
    }
    row
  })
  list(
    use = use, nvar = nvar, nsub = nsub,
    raw_alpha = as.numeric(tot[1, "raw_alpha"]),
    std_alpha = as.numeric(tot[1, "std.alpha"]),
    G6        = as.numeric(tot[1, "G6(smc)"]),
    average_r = as.numeric(tot[1, "average_r"]),
    sn        = as.numeric(tot[1, "S/N"]),
    ase       = if ("ase" %in% colnames(tot)) as.numeric(tot[1, "ase"]) else NA,
    mean_tot  = if ("mean" %in% colnames(tot)) as.numeric(tot[1, "mean"]) else NA,
    sd_tot    = if ("sd" %in% colnames(tot)) as.numeric(tot[1, "sd"]) else NA,
    median_r  = as.numeric(tot[1, "median_r"]),
    var_r     = as.numeric(a$var.r),
    interitem_min = as.numeric(min(lt)),
    interitem_max = as.numeric(max(lt)),
    feldt = list(
      "0.10" = list(lower = f90[["lower"]], upper = f90[["upper"]]),
      "0.05" = list(lower = f95[["lower"]], upper = f95[["upper"]]),
      "0.01" = list(lower = f99[["lower"]], upper = f99[["upper"]])
    ),
    items = items
  )
}

datarows <- function(x) {
  x <- as.matrix(x)
  lapply(seq_len(nrow(x)), function(i) as.numeric(x[i, ]))
}

cases <- list()
add <- function(id, label, x, uses = c("complete.obs")) {
  x <- as.matrix(x)
  storage.mode(x) <- "double"
  res <- list()
  for (u in uses) res[[u]] <- extract(x, u)
  cases[[length(cases) + 1]] <<- list(
    id = id, label = label, nrow = nrow(x), ncol = ncol(x),
    data = datarows(x), results = res
  )
}

set.seed(2026)

# --- 1. classic 5-item Likert (good reliability) ---------------------------
mk_likert <- function(n, k, latent_sd, noise_sd, min = 1, max = 5) {
  theta <- rnorm(n, 0, latent_sd)
  m <- sapply(seq_len(k), function(j) round(3 + theta + rnorm(n, 0, noise_sd)))
  m[m < min] <- min; m[m > max] <- max
  matrix(as.double(m), n, k)
}
add("likert5_good", "5-item Likert, good reliability", mk_likert(60, 5, 1.1, 0.6))
add("likert8_high", "8-item Likert, high reliability", mk_likert(80, 8, 1.3, 0.5, 1, 7))
add("likert10_mid", "10-item Likert, moderate", mk_likert(120, 10, 0.9, 1.1))
add("likert3_small", "3-item scale, small n", mk_likert(15, 3, 1.0, 0.7))
add("likert20_big", "20 items, big scale", mk_likert(150, 20, 1.0, 0.8, 1, 5))

# --- 2. two-item minimum ----------------------------------------------------
two <- matrix(c(4,5,3,5,2,4,5,5,1,2,3,3,4,4,2,3,5,4,1,1), ncol = 2, byrow = TRUE)
add("two_item", "2 items x 10 respondents", two)
two2 <- matrix(c(2,3,4,4,5,5,1,1,3,4,2,2,5,4,4,5,3,3,1,2,2,1,4,3), ncol = 2, byrow = TRUE)
add("two_item_b", "2 items x 12 respondents", two2)

# --- 3. k respondents < k items --------------------------------------------
wide <- mk_likert(4, 6, 1.2, 0.6)
add("more_items_than_subs", "6 items x 4 respondents (k < items)", wide)
wide2 <- mk_likert(3, 5, 1.0, 0.5)
add("three_subs_five_items", "5 items x 3 respondents (min rows)", wide2)

# --- 4. low / negative reliability -----------------------------------------
noisy <- matrix(as.double(sample(1:5, 50*4, replace = TRUE)), 50, 4)
add("random_noise", "4 items pure noise, low alpha", noisy)
neg <- mk_likert(40, 4, 1.0, 0.6)
neg[, 4] <- 6 - neg[, 4]            # one reverse-worded item (drags alpha down)
add("one_reversed_raw", "4 items, one reverse-worded (uncorrected)", neg)
# and the corrected version (item reversed back) -> high alpha
negc <- neg; negc[, 4] <- 6 - negc[, 4]
add("one_reversed_fixed", "same, reverse item recoded (6 - x)", negc)

# --- 5. near-zero variance item --------------------------------------------
nz <- mk_likert(50, 5, 1.0, 0.6)
nz[, 3] <- 3; nz[1, 3] <- 4          # almost constant (one bump)
add("near_constant_item", "5 items, one near-constant", nz)

# --- 6. constant (zero-variance) item -> psych deletes it -------------------
cst <- mk_likert(40, 5, 1.0, 0.6)
cst[, 2] <- 3                        # perfectly constant
add("constant_item", "5 items, one perfectly constant (deleted)", cst)

# --- 7. high-correlation / high alpha --------------------------------------
hi <- mk_likert(70, 6, 1.6, 0.35, 1, 7)
add("very_high_alpha", "6 items, very high alpha", hi)

# --- 8. NA patterns: pairwise vs listwise ----------------------------------
na1 <- mk_likert(60, 5, 1.1, 0.6)
na1[3, 2] <- NA; na1[10, 4] <- NA; na1[25, 1] <- NA; na1[40, 5] <- NA; na1[55, 3] <- NA
add("scattered_na", "5 items, scattered NA", na1, c("pairwise", "complete.obs"))

na2 <- mk_likert(50, 6, 1.0, 0.7)
na2[c(2,7,19,33), 1] <- NA
na2[c(5,12), 3] <- NA
na2[c(8,44), 6] <- NA
add("column_na", "6 items, column-clustered NA", na2, c("pairwise", "complete.obs"))

na3 <- mk_likert(30, 4, 1.2, 0.6)
na3[1, 1] <- NA; na3[1, 2] <- NA; na3[2, 3] <- NA; na3[15, 4] <- NA; na3[20, 1] <- NA
add("some_na_small", "4 items small w/ NA", na3, c("pairwise", "complete.obs"))

na4 <- mk_likert(80, 8, 1.2, 0.6, 1, 7)
idx <- sample(length(na4), 24)
na4[idx] <- NA
add("many_na_8item", "8 items, 24 scattered NA", na4, c("pairwise", "complete.obs"))

# --- 9. mixed magnitude / continuous (not Likert) --------------------------
cont <- matrix(rnorm(60*4, 50, 10), 60, 4)
cont[, 2] <- cont[, 1]*0.8 + rnorm(60, 0, 5)
cont[, 3] <- cont[, 1]*0.7 + rnorm(60, 0, 6)
cont[, 4] <- cont[, 1]*0.6 + rnorm(60, 0, 7)
add("continuous_items", "4 continuous items, correlated", cont)

# --- 10. classic psych::bfi-like 6-item subscale ---------------------------
bfi <- mk_likert(100, 6, 1.15, 0.7, 1, 6)
add("subscale6", "6-item subscale, n=100", bfi)

# --- 11. tiny-variance but not constant ------------------------------------
tv <- mk_likert(45, 4, 0.4, 0.9)
add("low_signal", "4 items, weak latent signal", tv)

# --- 12. wide 12-item ------------------------------------------------------
add("twelve_item", "12 items, n=90", mk_likert(90, 12, 1.0, 0.7, 1, 5))

# --- 13. two-item with NA --------------------------------------------------
twona <- two; twona[3, 1] <- NA; twona[7, 2] <- NA
add("two_item_na", "2 items w/ NA", twona, c("pairwise", "complete.obs"))

# --- Spearman-Brown prophecy (test-length planning) truth --------------------
# Standard identity: predicted = m*a / (1 + (m-1)*a); m = factor = newLen/oldLen.
# Items to reach target t from current alpha a on k items:
#   m = (t*(1-a))/(a*(1-t));  itemsNeeded = ceil(m*k).
sb_pred <- function(a, m) (m * a) / (1 + (m - 1) * a)
sb_m    <- function(a, t) (t * (1 - a)) / (a * (1 - t))
sb <- list()
sbadd <- function(a, k, factor = NA, target = NA) {
  row <- list(alpha = a, k = k)
  if (!is.na(factor)) { row$factor <- factor; row$predicted <- sb_pred(a, factor); row$newItems <- factor * k }
  if (!is.na(target)) { m <- sb_m(a, target); row$target <- target; row$m <- m; row$itemsNeeded <- ceiling(m * k) }
  sb[[length(sb) + 1]] <<- row
}
sbadd(0.72, 5, factor = 2)
sbadd(0.72, 5, factor = 0.5)
sbadd(0.72, 5, target = 0.90)
sbadd(0.85, 10, factor = 1.5)
sbadd(0.60, 4, target = 0.80)
sbadd(0.934, 6, factor = 3)
sbadd(0.55, 3, target = 0.70)
sbadd(0.80, 8, factor = 0.75)

out <- list(
  generator = "psych::alpha 2.6.5 / R 4.6.0",
  n_cases = length(cases),
  cases = cases,
  spearman_brown = sb
)
writeLines(toJSON(out, auto_unbox = TRUE, digits = 15, na = "null", pretty = FALSE),
           "Scripts/tool-truth/cronbachs-alpha-calculator.json")
cat("wrote", length(cases), "cases\n")
