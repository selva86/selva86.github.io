# post-hoc-calculator.R - ground truth for tools/post-hoc-calculator.html
#
# Oracles (all local R 4.6.0):
#   omnibus        stats::aov / stats::kruskal.test
#   Tukey HSD      stats::TukeyHSD  (-> stats::ptukey / stats::qtukey)
#   Bonferroni     stats::pairwise.t.test(p.adjust.method = "bonferroni")
#   Dunn + BH      FSA::dunnTest(method = "bh")  (wraps dunn.test::dunn.test)
#   letters        multcompView::multcompLetters
#
# Every factor is built with levels = unique(g) (order of appearance) so the
# oracle's pair order matches what the tool displays and what its emitted R
# reproduces.
#
# Run:  Rscript Scripts/tool-truth/post-hoc-calculator.R
# Out:  Scripts/tool-truth/post-hoc-calculator.json

suppressMessages({
  library(FSA)
  library(multcompView)
  library(jsonlite)
})

set.seed(20260717)

# ---------------------------------------------------------------- datasets ----
# Each: list(name, labels, values, note). Order of appearance defines levels.
mk <- function(name, groups, note = "") {
  labels <- unlist(lapply(names(groups), function(nm) rep(nm, length(groups[[nm]]))))
  values <- unlist(groups, use.names = FALSE)
  list(name = name, labels = labels, values = values, note = note)
}

DS <- list()

# 1. balanced k=3 n=6, clear separation
DS[[1]] <- mk("balanced_k3", list(
  Control = c(21.0, 19.5, 22.3, 20.1, 21.8, 20.6),
  DrugA   = c(25.2, 26.1, 24.8, 27.0, 25.5, 26.3),
  DrugB   = c(23.1, 22.4, 23.9, 22.0, 24.2, 23.3)
), "balanced three-group, the canonical case")

# 2. unbalanced k=4
DS[[2]] <- mk("unbalanced_k4", list(
  Placebo = c(4.2, 5.1, 3.8, 4.9, 4.4),
  Low     = c(6.1, 5.8, 6.9, 6.3, 5.5, 6.7, 6.0),
  Mid     = c(7.8, 8.3, 7.1, 8.9),
  High    = c(9.2, 8.7, 9.9, 10.3, 9.5, 8.8)
), "unbalanced n = 5,7,4,6 -> unequal Tukey SEs per pair")

# 3. tiny n, k=3
DS[[3]] <- mk("tiny_n3", list(
  A = c(1.0, 2.0, 3.0),
  B = c(4.0, 5.0, 6.0),
  C = c(7.0, 8.0, 9.5)
), "n = 3 per group, df_resid = 6")

# 4. ties-heavy Likert, k=3 (Dunn's reason to exist)
DS[[4]] <- mk("ties_likert_k3", list(
  Novice = c(2, 3, 2, 1, 3, 2, 2, 3, 1, 2),
  Inter  = c(3, 4, 3, 3, 4, 2, 3, 4, 3, 3),
  Expert = c(4, 5, 4, 5, 4, 4, 5, 5, 4, 3)
), "1-5 Likert, massive ties -> tie-corrected Dunn variance")

# 5. k=5 unbalanced
DS[[5]] <- mk("unbalanced_k5", list(
  S1 = c(12.1, 13.4, 11.8, 12.9),
  S2 = c(14.2, 15.1, 13.9, 14.8, 15.3),
  S3 = c(12.5, 13.1, 12.2),
  S4 = c(17.1, 16.5, 17.8, 16.9, 17.4, 16.2),
  S5 = c(14.9, 15.5, 14.2, 15.1)
), "k = 5, 10 pairs")

# 6. k=6 balanced
DS[[6]] <- mk("balanced_k6", list(
  G1 = c(5.1, 5.4, 4.9, 5.3),
  G2 = c(6.2, 6.5, 6.0, 6.3),
  G3 = c(5.3, 5.0, 5.6, 5.2),
  G4 = c(7.1, 7.4, 6.9, 7.2),
  G5 = c(6.1, 6.4, 5.9, 6.2),
  G6 = c(8.2, 8.5, 8.0, 8.3)
), "k = 6, 15 pairs, wide studentized range")

# 7. null: means equal
DS[[7]] <- mk("null_k3", list(
  X = c(10.1, 9.8, 10.3, 9.9, 10.2),
  Y = c(10.0, 10.2, 9.9, 10.1, 9.8),
  Z = c(9.9, 10.1, 10.2, 9.8, 10.0)
), "no real difference -> every adjusted p near 1")

# 8. huge effect (deep tail p)
DS[[8]] <- mk("huge_effect_k3", list(
  Lo = c(1.0, 1.1, 0.9, 1.05, 0.95),
  Mid = c(50.0, 50.1, 49.9, 50.05, 49.95),
  Hi = c(100.0, 100.1, 99.9, 100.05, 99.95)
), "separation -> p adj at the ptukey floor")

# 9. one group with n = 2 (minimum)
DS[[9]] <- mk("min_n2", list(
  P = c(3.1, 3.5),
  Q = c(6.2, 6.8, 6.5, 6.1),
  R = c(9.1, 9.7, 9.3)
), "n = 2 group, df_resid = 6")

# 10. PlantGrowth (real, shipped with R)
DS[[10]] <- local({
  d <- PlantGrowth
  list(name = "plantgrowth", labels = as.character(d$group), values = as.numeric(d$weight),
       note = "R's PlantGrowth, the textbook TukeyHSD example")
})

# 11. ordinal ties, k=4
DS[[11]] <- mk("ties_ordinal_k4", list(
  Q1 = c(1, 1, 2, 1, 2, 1, 1),
  Q2 = c(2, 2, 3, 2, 2, 3, 2),
  Q3 = c(3, 3, 3, 4, 3, 3, 4),
  Q4 = c(4, 5, 4, 4, 5, 4, 5)
), "four ordinal groups, ties across every group")

# 12. negatives + decimals
DS[[12]] <- mk("negatives_k3", list(
  Cold = c(-5.2, -4.8, -6.1, -5.5, -4.9),
  Warm = c(-1.1, -0.8, -1.5, -0.9, -1.2),
  Hot  = c(3.2, 2.8, 3.9, 3.1, 3.5)
), "negative values")

# 13. large scale
DS[[13]] <- mk("large_scale_k3", list(
  A = c(120000, 125000, 118000, 122000, 119500),
  B = c(140000, 145000, 138000, 142000, 139500),
  C = c(121000, 124000, 119000, 123000, 120500)
), "salary-scale magnitudes")

# 14. near-tie means (letters display stress)
DS[[14]] <- mk("chain_k4", list(
  A = c(10.0, 10.5, 9.5, 10.2, 9.8),
  B = c(11.5, 12.0, 11.0, 11.7, 11.3),
  C = c(13.0, 13.5, 12.5, 13.2, 12.8),
  D = c(14.5, 15.0, 14.0, 14.7, 14.3)
), "overlapping chain A<B<C<D -> multi-letter CLD")

# --------------------------------------------------------------- computers ----
tukey_of <- function(y, g, conf) {
  fit <- aov(y ~ g)
  th <- TukeyHSD(fit, conf.level = conf)$g
  data.frame(pair = rownames(th), diff = th[, "diff"], lwr = th[, "lwr"],
             upr = th[, "upr"], padj = th[, "p adj"], stringsAsFactors = FALSE)
}

bonf_of <- function(y, g) {
  pt <- pairwise.t.test(y, g, p.adjust.method = "bonferroni")  # pool.sd = TRUE
  raw <- pairwise.t.test(y, g, p.adjust.method = "none")
  out <- NULL
  m <- pt$p.value
  for (r in rownames(m)) for (cc in colnames(m)) {
    if (!is.na(m[r, cc])) out <- rbind(out, data.frame(
      pair = paste0(r, "-", cc), padj = m[r, cc], praw = raw$p.value[r, cc],
      stringsAsFactors = FALSE))
  }
  out
}

dunn_of <- function(y, g) {
  res <- FSA::dunnTest(y, g, method = "bh")$res
  data.frame(pair = as.character(res$Comparison), z = res$Z,
             praw = res$P.unadj, padj = res$P.adj, stringsAsFactors = FALSE)
}

letters_of <- function(tk, conf) {
  p <- tk$padj
  names(p) <- gsub("-", "-", tk$pair)
  # multcompLetters wants named p-values "lvl1-lvl2"
  ml <- multcompView::multcompLetters(p, threshold = 1 - conf)
  data.frame(group = names(ml$Letters), letters = as.character(ml$Letters),
             stringsAsFactors = FALSE)
}

CONFS <- c(0.90, 0.95, 0.99)

cases <- list()
for (d in DS) {
  g <- factor(d$labels, levels = unique(d$labels))
  y <- as.numeric(d$values)
  k <- nlevels(g); N <- length(y)

  fit <- aov(y ~ g); sm <- summary(fit)[[1]]
  kw <- kruskal.test(y, g)

  # group summaries (what summary-mode reconstruction must reproduce)
  gs <- data.frame(
    name = levels(g),
    n = as.numeric(tapply(y, g, length)),
    mean = as.numeric(tapply(y, g, mean)),
    sd = as.numeric(tapply(y, g, sd)),
    stringsAsFactors = FALSE
  )

  tk <- lapply(CONFS, function(cf) tukey_of(y, g, cf))
  names(tk) <- sprintf("%.2f", CONFS)

  lt <- lapply(CONFS, function(cf) letters_of(tukey_of(y, g, cf), cf))
  names(lt) <- sprintf("%.2f", CONFS)

  cases[[d$name]] <- list(
    name = d$name, note = d$note,
    labels = as.character(d$labels), values = y,
    levels = levels(g), k = k, N = N,
    aov = list(ssB = sm[["Sum Sq"]][1], ssW = sm[["Sum Sq"]][2],
               dfB = sm[["Df"]][1], dfW = sm[["Df"]][2],
               msB = sm[["Mean Sq"]][1], msW = sm[["Mean Sq"]][2],
               f = sm[["F value"]][1], p = sm[["Pr(>F)"]][1]),
    kruskal = list(chisq = unname(kw$statistic), df = unname(kw$parameter), p = kw$p.value),
    groups = gs,
    tukey = tk,
    letters = lt,
    bonferroni = bonf_of(y, g),
    dunn = dunn_of(y, g)
  )
}

# --------------------------------------- summary-mode exact reconstruction ----
# x <- m + s*scale(1:n) has mean exactly m and sd exactly s, so aov() on the
# reconstructed vectors IS ground truth for summary-input Tukey/Bonferroni.
recon <- list()
SUMMARY_CASES <- list(
  list(name = "sum_balanced", nm = c("A", "B", "C"), n = c(10, 10, 10),
       m = c(50, 55, 62), s = c(5, 6, 5.5)),
  list(name = "sum_unbalanced", nm = c("Ctrl", "T1", "T2", "T3"), n = c(8, 12, 6, 9),
       m = c(100, 108, 95, 115), s = c(10, 12, 9, 11)),
  list(name = "sum_null", nm = c("X", "Y", "Z"), n = c(7, 7, 7),
       m = c(20, 20.1, 19.9), s = c(3, 3.1, 2.9)),
  list(name = "sum_min_n2", nm = c("P", "Q", "R"), n = c(2, 5, 4),
       m = c(3.3, 6.4, 9.4), s = c(0.28, 0.3, 0.31))
)
for (sc in SUMMARY_CASES) {
  lab <- c(); val <- c()
  for (i in seq_along(sc$nm)) {
    xi <- sc$m[i] + sc$s[i] * as.numeric(scale(1:sc$n[i]))
    lab <- c(lab, rep(sc$nm[i], sc$n[i])); val <- c(val, xi)
  }
  g <- factor(lab, levels = sc$nm); y <- val
  fit <- aov(y ~ g); sm <- summary(fit)[[1]]
  tk <- lapply(CONFS, function(cf) tukey_of(y, g, cf)); names(tk) <- sprintf("%.2f", CONFS)
  recon[[sc$name]] <- list(
    name = sc$name, groupNames = sc$nm, n = sc$n, mean = sc$m, sd = sc$s,
    # prove the reconstruction is exact:
    reconMean = as.numeric(tapply(y, g, mean)), reconSd = as.numeric(tapply(y, g, sd)),
    aov = list(f = sm[["F value"]][1], p = sm[["Pr(>F)"]][1],
               msW = sm[["Mean Sq"]][2], dfW = sm[["Df"]][2], ssB = sm[["Sum Sq"]][1],
               ssW = sm[["Sum Sq"]][2], dfB = sm[["Df"]][1]),
    tukey = tk,
    bonferroni = bonf_of(y, g)
  )
}

# ------------------------------------------------- ptukey / qtukey raw grid ----
# The special function underneath TukeyHSD. cc = nmeans, rr = nranges = 1.
pt_grid <- NULL
for (cc in c(2, 3, 4, 5, 6, 8, 10, 20)) {
  for (df in c(2, 3, 5, 10, 24, 60, 99, 100, 101, 500, 800, 801, 2000, 5000, 5001, 24999, 25001, 1e6)) {
    for (q in c(0.01, 0.1, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 15, 20, 30)) {
      pt_grid <- rbind(pt_grid, data.frame(
        q = q, cc = cc, df = df,
        p = ptukey(q, cc, df),
        pupper = ptukey(q, cc, df, lower.tail = FALSE),
        stringsAsFactors = FALSE))
    }
  }
}
qt_grid <- NULL
for (cc in c(2, 3, 4, 5, 6, 8, 10, 20)) {
  for (df in c(2, 3, 5, 10, 24, 60, 100, 500, 1000, 5000, 30000)) {
    for (p in c(0.5, 0.75, 0.9, 0.95, 0.975, 0.99, 0.995, 0.999)) {
      qt_grid <- rbind(qt_grid, data.frame(
        p = p, cc = cc, df = df, q = qtukey(p, cc, df), stringsAsFactors = FALSE))
    }
  }
}

# ----------------------------------- dunn.test BH vs stats::p.adjust BH note ----
# dunn.test applies the raw BH multiplier with NO cummin; p.adjust enforces
# monotonicity. They genuinely differ. The tool must reproduce dunn.test.
bh_divergence <- local({
  p <- c(0.001, 0.049, 0.05); m <- 3
  o <- order(p, decreasing = TRUE); raw <- rep(NA, m)
  for (i in 1:m) raw[i] <- min(1, p[o][i] * (m / (m + 1 - i)))
  list(p = p, padjust_bh = p.adjust(p, "BH"), dunntest_bh = raw[order(o)])
})

out <- list(
  meta = list(
    generated = as.character(Sys.time()),
    R = R.version.string,
    FSA = as.character(packageVersion("FSA")),
    dunn.test = as.character(packageVersion("dunn.test")),
    multcompView = as.character(packageVersion("multcompView")),
    confs = CONFS
  ),
  cases = cases,
  summaryMode = recon,
  ptukey = pt_grid,
  qtukey = qt_grid,
  bhDivergence = bh_divergence
)

writeLines(jsonlite::toJSON(out, digits = NA, auto_unbox = TRUE, na = "null", pretty = FALSE),
           "Scripts/tool-truth/post-hoc-calculator.json")
cat("cases:", length(cases), "| summaryMode:", length(recon),
    "| ptukey grid:", nrow(pt_grid), "| qtukey grid:", nrow(qt_grid), "\n")
