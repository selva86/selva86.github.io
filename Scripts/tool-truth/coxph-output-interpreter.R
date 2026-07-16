# Truth table for tools/coxph-output-interpreter.html
#
# Two jobs:
#   1. PARSE fidelity  - capture the EXACT text summary(coxph) prints, plus the
#      numbers R printed inside it, so the JS parser can be checked digit for
#      digit against what a user would actually paste.
#   2. ARITHMETIC      - capture full-precision coef/se/exp(coef)/CI/z/p/global
#      tests/concordance so the recomputation (HR = exp(coef), CI = exp(coef +-
#      qnorm(.975)*se)) can be gated against R's own internals.
#
# Note the deliberate asymmetry: a pasted summary carries ROUNDED coef/se, so a
# recomputed CI cannot equal R's full-precision CI exactly. The harness derives
# the achievable bound from the printed precision rather than loosening a
# tolerance until it passes.
#
# R 4.6.0 + survival. Run: Rscript Scripts/tool-truth/coxph-output-interpreter.R

suppressPackageStartupMessages({
  library(survival)
  library(jsonlite)
})

set.seed(11)

# capture exactly what the console shows
printed <- function(x) paste(capture.output(print(x)), collapse = "\n")

# every number R printed in the coef table / CI table, at print precision
model_case <- function(id, label, fit, conf = 0.95, note = "") {
  s <- summary(fit, conf.int = conf)
  cm <- s$coefficients          # coef, exp(coef), se(coef), [robust se,] z, Pr(>|z|)
  ci <- s$conf.int              # exp(coef), exp(-coef), lower .95, upper .95

  # a robust/cluster fit inserts a "robust se" column, and THAT column (not
  # se(coef)) is what drives z and the confidence interval.
  has_robust <- "robust se" %in% colnames(cm)

  terms <- lapply(seq_len(nrow(cm)), function(i) {
    list(
      name      = rownames(cm)[i],
      coef      = unname(cm[i, "coef"]),
      expcoef   = unname(cm[i, "exp(coef)"]),
      se        = unname(cm[i, "se(coef)"]),
      robust_se = if (has_robust) unname(cm[i, "robust se"]) else NULL,
      se_used   = if (has_robust) unname(cm[i, "robust se"]) else unname(cm[i, "se(coef)"]),
      z         = unname(cm[i, "z"]),
      p         = unname(cm[i, "Pr(>|z|)"]),
      expneg    = unname(ci[i, 2]),
      lower     = unname(ci[i, 3]),
      upper     = unname(ci[i, 4])
    )
  })

  list(
    id       = id,
    label    = label,
    note     = note,
    conf     = conf,
    robust   = has_robust,
    text     = printed(s),           # <- the parser's input
    n        = unname(s$n),
    nevent   = unname(s$nevent),
    nmiss    = if (is.null(s$na.action)) 0L else length(s$na.action),
    terms    = terms,
    conc     = unname(s$concordance[1]),
    conc_se  = unname(s$concordance[2]),
    logtest  = list(stat = unname(s$logtest[1]),  df = unname(s$logtest[2]),  p = unname(s$logtest[3])),
    waldtest = list(stat = unname(s$waldtest[1]), df = unname(s$waldtest[2]), p = unname(s$waldtest[3])),
    sctest   = list(stat = unname(s$sctest[1]),   df = unname(s$sctest[2]),   p = unname(s$sctest[3]))
  )
}

cases <- list()
add <- function(x) cases[[length(cases) + 1]] <<- x

lung2 <- lung
lung2$sexf <- factor(lung2$sex, levels = c(1, 2), labels = c("male", "female"))

# ---- the three shipped presets (must be byte-identical on the page) --------
add(model_case("preset_sex", "lung, sex only",
               coxph(Surv(time, status) ~ sex, data = lung),
               note = "preset"))

add(model_case("preset_multi", "lung, age + sex + ph.ecog",
               coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung),
               note = "preset"))

add(model_case("preset_factor", "lung, age + sexf + ph.karno + wt.loss",
               coxph(Surv(time, status) ~ age + sexf + ph.karno + wt.loss, data = lung2),
               note = "preset"))

# ---- more real models: different datasets, shapes, effect sizes -----------
add(model_case("veteran_karno", "veteran, karno + age",
               coxph(Surv(time, status) ~ karno + age, data = veteran)))

add(model_case("veteran_celltype", "veteran, multi-level factor",
               coxph(Surv(time, status) ~ trt + celltype + karno, data = veteran)))

add(model_case("ovarian_small", "ovarian, tiny n",
               coxph(Surv(futime, fustat) ~ age + rx, data = ovarian)))

add(model_case("colon_big", "colon, large n strong effect",
               coxph(Surv(time, status) ~ rx + nodes + extent, data = colon)))

add(model_case("pbc_bili", "pbc, strongly significant continuous",
               coxph(Surv(time, status == 2) ~ log(bili) + age + edema, data = pbc)))

# ---- shapes that change the printed columns ------------------------------
# cluster/robust: inserts a "robust se" column (with a SPACE in the name) and
# appends ", Robust = .. p=.." to the score-test line plus a trailing note.
add(model_case("robust_cluster", "lung, cluster(inst) robust se",
               coxph(Surv(time, status) ~ age + sex + cluster(inst), data = lung),
               note = "robust se column"))

# strata: normal columns, but the strata term never appears in the coef table
add(model_case("strata_sex", "lung, age + strata(sex)",
               coxph(Surv(time, status) ~ age + strata(sex), data = lung),
               note = "stratified"))

# ---- confidence levels other than 95 -------------------------------------
add(model_case("lung_sex_90", "lung sex only, 90 percent",
               coxph(Surv(time, status) ~ sex, data = lung), conf = 0.90))
add(model_case("lung_sex_99", "lung sex only, 99 percent",
               coxph(Surv(time, status) ~ sex, data = lung), conf = 0.99))

# ---- edge cases ----------------------------------------------------------
# a covariate with essentially no effect (HR ~ 1, CI straddles 1)
add(model_case("null_effect", "simulated null covariate", {
  n <- 200
  d <- data.frame(x = rnorm(n))
  d$time <- rexp(n, 0.05)
  d$status <- rbinom(n, 1, 0.7)
  coxph(Surv(time, status) ~ x, data = d)
}, note = "HR near 1"))

# a very strong effect -> deep-tail p, tests the p recomputation
add(model_case("huge_effect", "simulated very strong effect", {
  n <- 400
  d <- data.frame(x = rnorm(n))
  d$time <- rexp(n, 0.03 * exp(1.6 * d$x))
  d$status <- 1L
  coxph(Surv(time, status) ~ x, data = d)
}, note = "deep tail p"))

# few events relative to n
add(model_case("few_events", "simulated few events", {
  n <- 300
  d <- data.frame(x = rnorm(n))
  d$time <- rexp(n, 0.02)
  d$status <- rbinom(n, 1, 0.06)
  coxph(Surv(time, status) ~ x, data = d)
}, note = "sparse events"))

# a protective effect (coef < 0, HR < 1) plus a harmful one in one model
add(model_case("mixed_signs", "simulated mixed protective/harmful", {
  n <- 300
  d <- data.frame(good = rnorm(n), bad = rnorm(n))
  d$time <- rexp(n, 0.05 * exp(-0.7 * d$good + 0.9 * d$bad))
  d$status <- rbinom(n, 1, 0.85)
  coxph(Surv(time, status) ~ good + bad, data = d)
}, note = "mixed directions"))

# ---- qnorm multipliers the CI arithmetic must use ------------------------
zmult <- list(
  z90 = qnorm(0.95),
  z95 = qnorm(0.975),
  z99 = qnorm(0.995)
)

# ---- deep chi-square tail -------------------------------------------------
# R prints the global tests as "p=<2e-16" and stops. Recomputing the real tail
# from the printed statistic is the whole reason to bother, so gate it: these
# reach 1e-103, far past where 1 - pchisq() cancels to a flat zero.
tailgrid <- expand.grid(stat = c(0.34, 1.56, 3.18, 10.63, 30.5, 61.07, 100,
                                 210.7, 218.5, 279.5, 466.5, 800),
                        df = 1:6)
chisq_tail <- lapply(seq_len(nrow(tailgrid)), function(i) {
  list(stat = tailgrid$stat[i], df = tailgrid$df[i],
       p = pchisq(tailgrid$stat[i], tailgrid$df[i], lower.tail = FALSE))
})

# ---- deep normal tail (Wald p from a printed z) ---------------------------
ztail <- lapply(c(0.5, 1.28, 1.96, 3.176, 5.527, 11.745, 19.6, 25), function(z) {
  list(z = z, p = 2 * pnorm(-abs(z)))
})

out <- list(
  generated  = "R 4.6.0 survival",
  zmult      = zmult,
  chisq_tail = chisq_tail,
  ztail      = ztail,
  cases      = cases
)

write_json(out, "Scripts/tool-truth/coxph-output-interpreter.json",
           auto_unbox = TRUE, digits = 17, pretty = TRUE)

cat("cases:", length(cases), "\n")
for (cs in cases) cat(sprintf("  %-16s n=%-5d ev=%-4d terms=%d\n",
                              cs$id, cs$n, cs$nevent, length(cs$terms)))
