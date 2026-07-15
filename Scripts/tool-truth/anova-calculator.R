# Ground truth for tools/lib/anova-math.js  (anova-calculator, wave-3)
# R 4.6.0.  This tool COMPUTES a full ANOVA table from RAW pasted group data
# (distinct from anova-output-interpreter, which decodes a printed table).
#
# One-way:  aov(y ~ g)              -> SS/df/MS/F/p, eta^2, omega^2, Cohen's f
#           car::leveneTest (median center = Brown-Forsythe) for homogeneity
#           effectsize::eta_squared / omega_squared (partial = FALSE)
# Two-way:  aov(y ~ A * B)          -> Type I sequential table (what aov prints),
#           verified for BALANCED and UNBALANCED data; effectsize eta^2.
#
# The raw group vectors are serialized into the JSON so the Node harness feeds
# tools/lib/anova-math.js the exact same numbers and asserts <= 1e-6.
options(digits = 17, scipen = 999)
suppressWarnings(suppressMessages({
  library(jsonlite); library(car); library(effectsize)
}))
setwd(dirname(sub("--file=", "", grep("--file=", commandArgs(FALSE), value = TRUE))))

# ---------------------------------------------------------------------------
# one-way record: raw groups (named numeric vectors) -> every displayed number
# ---------------------------------------------------------------------------
oneway_record <- function(name, groups, conf = 0.95) {
  # groups: named list of numeric vectors
  y <- unlist(groups, use.names = FALSE)
  g <- factor(rep(names(groups), lengths(groups)), levels = names(groups))
  fit <- aov(y ~ g)
  tab <- summary(fit)[[1]]
  ss_b <- tab[["Sum Sq"]][1]; df_b <- tab[["Df"]][1]
  ss_w <- tab[["Sum Sq"]][2]; df_w <- tab[["Df"]][2]
  ms_b <- ss_b / df_b; ms_w <- ss_w / df_w
  Fv <- ms_b / ms_w
  pv <- tab[["Pr(>F)"]][1]
  ss_t <- ss_b + ss_w
  eta2 <- ss_b / ss_t
  omega2 <- (ss_b - df_b * ms_w) / (ss_t + ms_w)
  cohens_f <- sqrt(eta2 / (1 - eta2))
  # effectsize cross-checks (classical, partial = FALSE)
  es_eta2 <- as.data.frame(effectsize::eta_squared(fit, partial = FALSE, ci = NULL))$Eta2[1]
  es_omega2 <- as.data.frame(effectsize::omega_squared(fit, partial = FALSE, ci = NULL))$Omega2[1]
  # Levene (Brown-Forsythe, median center) via car
  lev <- car::leveneTest(y ~ g)   # default center = median
  lev_f <- lev[["F value"]][1]; lev_p <- lev[["Pr(>F)"]][1]
  summ <- lapply(names(groups), function(nm) {
    v <- groups[[nm]]
    list(name = nm, n = length(v), mean = mean(v), sd = sd(v))
  })
  list(name = name, conf = conf,
       groups = lapply(names(groups), function(nm) list(name = nm, values = groups[[nm]])),
       n = length(y), k = length(groups),
       ss_between = ss_b, df_between = df_b, ms_between = ms_b,
       ss_within = ss_w, df_within = df_w, ms_within = ms_w,
       ss_total = ss_t, df_total = df_b + df_w,
       f = Fv, p = pv,
       eta2 = eta2, omega2 = omega2, cohens_f = cohens_f,
       es_eta2 = es_eta2, es_omega2 = es_omega2,
       levene_f = lev_f, levene_p = lev_p,
       summary = summ)
}

# ---------------------------------------------------------------------------
# two-way record: raw (A, B, y) long form -> aov Type I table (balanced+unbal)
# ---------------------------------------------------------------------------
twoway_record <- function(name, A, B, y) {
  A <- factor(A); B <- factor(B)
  fit <- aov(y ~ A * B)
  tab <- as.data.frame(summary(fit)[[1]])
  rn <- trimws(rownames(tab))
  ss <- tab[["Sum Sq"]]; df <- tab[["Df"]]; names(ss) <- rn; names(df) <- rn
  ss_res <- ss[["Residuals"]]; df_res <- df[["Residuals"]]; ms_res <- ss_res / df_res
  ss_total <- sum(ss)  # A + B + A:B + Residuals
  es_non <- as.data.frame(effectsize::eta_squared(fit, partial = FALSE, ci = NULL))
  es_par <- as.data.frame(effectsize::eta_squared(fit, partial = TRUE,  ci = NULL))
  look <- function(dfr, tm, col) { i <- match(tm, dfr$Parameter); if (is.na(i)) NA_real_ else dfr[[col]][i] }
  terms <- c("A", "B", "A:B")
  rows <- lapply(terms, function(tm) {
    s <- ss[[tm]]; d <- df[[tm]]; ms <- s / d; Fv <- ms / ms_res
    list(term = tm, ss = s, df = d, ms = ms, f = Fv,
         p = pf(Fv, d, df_res, lower.tail = FALSE),
         eta2 = s / ss_total,
         partial_eta2 = s / (s + ss_res),
         es_eta2 = look(es_non, tm, "Eta2"),
         es_partial_eta2 = look(es_par, tm, if ("Eta2_partial" %in% names(es_par)) "Eta2_partial" else "Eta2"))
  })
  list(name = name,
       A = as.character(A), B = as.character(B), y = y,
       n = length(y),
       rows = rows,
       resid = list(ss = ss_res, df = df_res, ms = ms_res),
       total = list(ss = ss_total, df = length(y) - 1))
}

# ============================================================================
# ONE-WAY cases
# ============================================================================
pg <- PlantGrowth
pg_groups <- list(ctrl = pg$weight[pg$group == "ctrl"],
                  trt1 = pg$weight[pg$group == "trt1"],
                  trt2 = pg$weight[pg$group == "trt2"])
mt <- mtcars
mt_groups <- list(`4` = mt$mpg[mt$cyl == 4],
                  `6` = mt$mpg[mt$cyl == 6],
                  `8` = mt$mpg[mt$cyl == 8])

oneway <- list(
  oneway_record("plantgrowth_balanced", pg_groups),                 # 3 x 10 balanced
  oneway_record("mtcars_unbalanced", mt_groups),                    # 11/7/14 unbalanced
  oneway_record("two_groups", list(A = c(5,7,6,8,9), B = c(10,12,11,13,9))),
  oneway_record("tiny_n2", list(A = c(1,2), B = c(5,6), C = c(9,10))),
  oneway_record("huge_effect", list(A = c(1,1.1,0.9,1.05), B = c(100,101,99,100.5))),
  oneway_record("near_null", list(A = c(5.0,5.1,4.9,5.05), B = c(5.02,4.98,5.01,5.0))),
  oneway_record("four_groups", list(
     G1 = c(23,25,21,24,22), G2 = c(28,30,27,29,31),
     G3 = c(20,19,22,21,18), G4 = c(35,33,36,34,37)))
)

# ============================================================================
# TWO-WAY cases
# ============================================================================
tg <- ToothGrowth; tg$dose <- factor(tg$dose)
tw_bal <- twoway_record("toothgrowth_balanced", tg$supp, tg$dose, tg$len)   # 2 x 3 x 10
wb <- warpbreaks
tw_wb  <- twoway_record("warpbreaks_balanced", wb$wool, wb$tension, wb$breaks) # 2 x 3 x 9

# unbalanced 2 x 2 literal (exercises the additive-model Type I solve)
uA <- c("Low","Low","Low","Low","Low","High","High","High","High","High","High","High")
uB <- c("Off","Off","Off","On","On","Off","Off","Off","Off","On","On","On")
uy <- c( 12,  14,  13,  18,  20,  22,   25,  24,  23,   30,  33,  31)
tw_unbal <- twoway_record("unbalanced_2x2", uA, uB, uy)

twoway <- list(tw_bal, tw_wb, tw_unbal)

out <- list(oneway = oneway, twoway = twoway)
writeLines(toJSON(out, auto_unbox = TRUE, digits = 17, na = "string"),
           "anova-calculator.json")

# ---- authentic printed tables for on-page scenario copy ---------------------
cat("=== one-way aov(weight ~ group, PlantGrowth) ===\n"); print(summary(aov(weight ~ group, PlantGrowth)))
cat("\n=== leveneTest(weight ~ group, PlantGrowth) [median] ===\n"); print(car::leveneTest(weight ~ group, PlantGrowth))
cat("\n=== two-way aov(len ~ supp*dose, ToothGrowth) ===\n"); print(summary(aov(len ~ supp*factor(dose), ToothGrowth)))
cat("\n=== two-way aov(y ~ A*B) unbalanced 2x2 ===\n"); print(summary(aov(uy ~ factor(uA)*factor(uB))))
cat("\nwrote anova-calculator.json:", length(oneway), "one-way,", length(twoway), "two-way\n")
