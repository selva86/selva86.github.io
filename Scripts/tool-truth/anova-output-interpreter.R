# Ground truth for tools/lib/anova-math.js  (anova-output-interpreter)
# R 4.6.0.  The tool parses a printed ANOVA table (aov() or car::Anova())
# and RE-COMPUTES, from the Sum-Sq / Df columns:
#   MS  = SS / df
#   F   = MS_term / MS_resid
#   p   = pf(F, df_term, df_resid, lower.tail = FALSE)     <- the verified number
#   eta^2, partial eta^2, omega^2, partial omega^2, Cohen's f  (effect sizes)
#
# Ground truth = stats::pf  and the effectsize package (eta_squared /
# omega_squared, partial = TRUE / FALSE).  We ALSO carry the closed-form
# algebra the JS implements and assert it reproduces effectsize to 1e-6, so
# the browser math is provably the same quantity R's effectsize returns.
options(digits = 17, scipen = 999)
suppressWarnings(suppressMessages({
  library(jsonlite); library(car); library(effectsize)
}))
setwd(dirname(sub("--file=", "", grep("--file=", commandArgs(FALSE), value = TRUE))))

# ---- closed forms the JS implements (partial = TRUE default in effectsize) --
cf_eta2         <- function(ss, ss_total)          ss / ss_total
cf_partial_eta2 <- function(ss, ss_resid)          ss / (ss + ss_resid)
cf_omega2       <- function(ss, df, ms_resid, ss_total) (ss - df * ms_resid) / (ss_total + ms_resid)
cf_partial_omega2 <- function(ss, df, ms_resid, N)  (ss - df * ms_resid) / (ss + (N - df) * ms_resid)
cf_cohens_f     <- function(partial_eta2)           sqrt(partial_eta2 / (1 - partial_eta2))

# ---- build a per-term truth record from a fitted lm + an anova-type table ---
# `tab` is a data.frame with rownames = term, and columns Sum Sq + Df (both
# aov() and car::Anova() expose these, just in different column orders).
term_records <- function(name, fit, tab, es_type, esobj = fit, es_parity = TRUE) {
  N       <- stats::nobs(fit)
  rownames(tab) <- trimws(rownames(tab))   # aov summary pads rownames w/ spaces
  ss      <- tab[["Sum Sq"]];  names(ss) <- rownames(tab)
  df      <- tab[["Df"]];      names(df) <- rownames(tab)
  is_res  <- rownames(tab) == "Residuals"
  is_int  <- rownames(tab) == "(Intercept)"
  ss_res  <- unname(ss[is_res]); df_res <- unname(df[is_res])
  ms_res  <- ss_res / df_res
  # "classical" total the tool uses: every non-intercept SS (incl. residual)
  keep    <- !is_int
  ss_total <- sum(ss[keep])
  # effectsize references (partial + non-partial), matched by Parameter name.
  # Feed effectsize the SAME anova object the tool parses so the SS partition
  # is identical -- otherwise effectsize recomputes its own default-type SS.
  e_par <- as.data.frame(effectsize::eta_squared(esobj,   partial = TRUE,  ci = NULL))
  e_non <- as.data.frame(effectsize::eta_squared(esobj,   partial = FALSE, ci = NULL))
  o_par <- as.data.frame(effectsize::omega_squared(esobj, partial = TRUE,  ci = NULL))
  o_non <- as.data.frame(effectsize::omega_squared(esobj, partial = FALSE, ci = NULL))
  look <- function(dfr, term, col) {
    i <- match(term, dfr$Parameter); if (is.na(i)) return(NA_real_); dfr[[col]][i]
  }
  terms <- rownames(tab)[!is_res & !is_int]
  recs <- lapply(terms, function(tm) {
    s <- unname(ss[tm]); d <- unname(df[tm]); ms <- s / d
    Fv <- ms / ms_res
    list(
      term            = tm,
      ss              = s,
      df              = d,
      ss_resid        = ss_res,
      df_resid        = df_res,
      ms              = ms,
      ms_resid        = ms_res,
      ss_total        = ss_total,
      N               = N,
      f               = Fv,
      p               = pf(Fv, d, df_res, lower.tail = FALSE),
      # closed forms (what the JS computes)
      eta2            = cf_eta2(s, ss_total),
      partial_eta2    = cf_partial_eta2(s, ss_res),
      omega2          = cf_omega2(s, d, ms_res, ss_total),
      partial_omega2  = cf_partial_omega2(s, d, ms_res, N),
      cohens_f        = cf_cohens_f(cf_partial_eta2(s, ss_res)),
      # effectsize package references
      es_eta2         = look(e_non, tm, "Eta2"),
      es_partial_eta2 = look(e_par, tm, if ("Eta2_partial" %in% names(e_par)) "Eta2_partial" else "Eta2"),
      es_omega2       = look(o_non, tm, "Omega2"),
      es_partial_omega2 = look(o_par, tm, if ("Omega2_partial" %in% names(o_par)) "Omega2_partial" else "Omega2")
    )
  })
  list(name = name, es_type = es_type, n = N, es_parity = es_parity,
       ss_resid = ss_res, df_resid = df_res, ss_total = ss_total, terms = recs)
}

# ============================================================================
# Real models (one-way, factorial w/ interaction, additive, unbalanced)
# ============================================================================
tg <- ToothGrowth; tg$dose <- factor(tg$dose)
mt <- mtcars; mt$cyl <- factor(mt$cyl); mt$am <- factor(mt$am); mt$gear <- factor(mt$gear)
wb <- warpbreaks

fit_oneway <- aov(mpg ~ cyl, data = mt)                       # one-way, balanced-ish
fit_tg     <- lm(len ~ supp * dose, data = tg)                # factorial (balanced)
fit_wb     <- lm(breaks ~ wool + tension, data = wb)          # additive (balanced)
fit_unbal  <- lm(mpg ~ cyl + gear, data = mt)                 # additive, UNBALANCED

# car::Anova objects (fed to effectsize so its SS partition == the parsed table)
A_tg2  <- car::Anova(fit_tg,    type = 2)
A_tg3  <- car::Anova(fit_tg,    type = 3)
A_wb2  <- car::Anova(fit_wb,    type = 2)
A_ub2  <- car::Anova(fit_unbal, type = 2)
A_ub3  <- car::Anova(fit_unbal, type = 3)

models <- list(
  # aov() -> Type I sequential table (balanced -> effectsize parity holds)
  term_records("oneway_typeI",  fit_oneway, as.data.frame(summary(fit_oneway)[[1]]), "I",
               esobj = fit_oneway, es_parity = TRUE),
  # car::Anova Type II / III on the factorial and unbalanced fits. effectsize is
  # fed the SAME Anova object. es_parity=FALSE where a table-based number is
  # expected to diverge from a fit-based one: Type III main effects under
  # default (non sum-to-zero) contrasts, and negative omega^2 (effectsize floors
  # at 0, the tool reports the raw value).
  term_records("tg_typeII",     fit_tg,    as.data.frame(A_tg2), "II",
               esobj = A_tg2, es_parity = TRUE),
  term_records("tg_typeIII",    fit_tg,    as.data.frame(A_tg3), "III",
               esobj = A_tg3, es_parity = FALSE),
  term_records("wb_typeII",     fit_wb,    as.data.frame(A_wb2), "II",
               esobj = A_wb2, es_parity = TRUE),
  term_records("unbal_typeII",  fit_unbal, as.data.frame(A_ub2), "II",
               esobj = A_ub2, es_parity = FALSE),
  term_records("unbal_typeIII", fit_unbal, as.data.frame(A_ub3), "III",
               esobj = A_ub3, es_parity = FALSE)
)

# ============================================================================
# F upper-tail p-value edge cases (the verified distribution) -- reproduce pf
# ============================================================================
f_edge <- function(f, df1, df2) list(f = f, df1 = df1, df2 = df2,
                                     p = pf(f, df1, df2, lower.tail = FALSE),
                                     cdf = pf(f, df1, df2))
f_edges <- list(
  f_edge(39.70,   2, 29),     # one-way mtcars ballpark
  f_edge(1.0,     1, 10),     # F = 1 -> p ~ 0.34
  f_edge(0.01,    3, 50),     # tiny F -> p ~ 1
  f_edge(200,     4, 27),     # big F -> p ~ 0
  f_edge(1e5,     1, 1000),   # extreme
  f_edge(2.5,     5, 5),      # small df both
  f_edge(954.787, 1, 28),     # intercept-sized F
  f_edge(0.5,     2, 100),    # p ~ 0.6
  f_edge(16.85,   1, 28),     # interaction ballpark
  f_edge(1e-6,   10, 10)      # near-zero F
)

# ============================================================================
# Effect-size algebra edge cases (independent of a fit): assert closed forms
# ============================================================================
es_edge <- function(ss, df, ss_resid, df_resid, ss_total, N) {
  ms_res <- ss_resid / df_resid
  list(ss = ss, df = df, ss_resid = ss_resid, df_resid = df_resid,
       ss_total = ss_total, N = N, ms_resid = ms_res,
       eta2 = cf_eta2(ss, ss_total),
       partial_eta2 = cf_partial_eta2(ss, ss_resid),
       omega2 = cf_omega2(ss, df, ms_res, ss_total),
       partial_omega2 = cf_partial_omega2(ss, df, ms_res, N),
       cohens_f = cf_cohens_f(cf_partial_eta2(ss, ss_resid)))
}
es_edges <- list(
  es_edge(824.78, 2, 301.26, 29, 1126.04, 32),
  es_edge(183.35, 1, 250.20, 28, 598.61, 32),
  es_edge(0.0001, 1, 500,   40, 900,     45),   # negligible term
  es_edge(456.40, 2, 341.66, 27, 834.83, 32)
)

out <- list(models = models, f_edges = f_edges, es_edges = es_edges)
writeLines(toJSON(out, auto_unbox = TRUE, digits = 17, na = "string"),
           "anova-output-interpreter.json")

# ---- also print authentic tables so the page can carry real scenario text --
cat("=== SCENARIO: one-way aov(mpg ~ cyl) ===\n")
print(summary(fit_oneway))
cat("\n=== SCENARIO: ToothGrowth car::Anova type II (len ~ supp*dose) ===\n")
print(car::Anova(fit_tg, type = 2))
cat("\n=== SCENARIO: ToothGrowth car::Anova type III ===\n")
print(car::Anova(fit_tg, type = 3))
cat("\n=== SCENARIO: warpbreaks car::Anova type II (breaks ~ wool+tension) ===\n")
print(car::Anova(fit_wb, type = 2))
cat("\n=== SCENARIO: unbalanced car::Anova type III (mpg ~ cyl+gear) ===\n")
print(car::Anova(fit_unbal, type = 3))

cat("\nwrote anova-output-interpreter.json:",
    length(models), "models,",
    length(f_edges), "F edges,",
    length(es_edges), "effect-size edges\n")
