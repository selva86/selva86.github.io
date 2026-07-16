# Truth table for tools/lmer-output-interpreter.html
# Generates REAL lme4 summary() output for the presets, plus an ICC truth table
# spanning simulated models, verified against performance::icc().
#
# Key facts this script establishes (see the JSON it writes):
#  1. random-intercept: ICC = tau00 / (tau00 + sigma^2)      == performance::icc adjusted
#  2. glmer logit:      ICC = tau00 / (tau00 + pi^2/3)       == performance::icc adjusted
#  3. random-slope:     performance::icc adjusted is NOT recoverable from the printed
#     summary. It is the Nakagawa/Johnson mean random-effect variance
#        var.random = v_int + 2*mean(x)*cov + mean(x^2)*v_slope
#     which depends on mean(x) and mean(x^2) -- i.e. on the DATA, which the printed
#     summary does not contain. Proven below to machine precision.

# digits MUST stay at R's default 7: the presets have to look exactly like what a
# user copies out of a default console. jsonlite's digits=15 below is independent,
# so the JSON keeps full precision while the pasted text stays realistic.
options(width = 80, digits = 7)
suppressMessages({
  library(lme4)
  library(lmerTest)
  library(performance)
  library(jsonlite)
})

set.seed(20260717)

sumtext <- function(m) paste(capture.output(print(summary(m))), collapse = "\n")

vc_list <- function(m) {
  d <- as.data.frame(VarCorr(m))
  lapply(seq_len(nrow(d)), function(i) {
    list(grp = d$grp[i], var1 = if (is.na(d$var1[i])) NULL else d$var1[i],
         var2 = if (is.na(d$var2[i])) NULL else d$var2[i],
         vcov = d$vcov[i], sdcor = d$sdcor[i])
  })
}

icc_of <- function(m) {
  r <- performance::icc(m)
  list(adjusted = as.numeric(r$ICC_adjusted), unadjusted = as.numeric(r$ICC_unadjusted))
}

fixed_list <- function(m) {
  co <- coef(summary(m))
  lapply(seq_len(nrow(co)), function(i) {
    row <- as.list(co[i, ])
    names(row) <- colnames(co)
    c(list(term = rownames(co)[i]), row)
  })
}

out <- list()

## ---------------------------------------------------------------- PRESETS ----
data(sleepstudy, package = "lme4")
data(VerbAgg, package = "lme4")

# P1: random intercept (plain lmer, REML, NO p-values -- the teaching case)
p1 <- lme4::lmer(Reaction ~ Days + (1 | Subject), sleepstudy)
# P2: random slope (correlated intercept+slope -- the ICC-is-ambiguous case)
p2 <- lme4::lmer(Reaction ~ Days + (Days | Subject), sleepstudy)
# P3: glmer binary (Bernoulli, z + p, latent-scale ICC)
p3 <- lme4::glmer(r2 ~ Anger + Gender + btype + (1 | id), family = binomial, data = VerbAgg)
# P4: lmerTest (Satterthwaite df + p-values -- the answer to "where are my p-values")
p4 <- lmerTest::lmer(Reaction ~ Days + (1 | Subject), sleepstudy)

presets <- list()
mk_preset <- function(key, m, label, kind) {
  ic <- icc_of(m)
  list(key = key, label = label, kind = kind,
       summary_text = sumtext(m),
       varcorr = vc_list(m),
       fixed = fixed_list(m),
       nobs = as.integer(nobs(m)),
       ngrps = as.list(lme4::ngrps(m)),
       icc_adjusted = ic$adjusted, icc_unadjusted = ic$unadjusted)
}
presets$ri <- mk_preset("ri", p1, "sleepstudy: random intercept", "lmer")
presets$rs <- mk_preset("rs", p2, "sleepstudy: random slope", "lmer")
presets$glmer <- mk_preset("glmer", p3, "VerbAgg: glmer binary", "glmer")
presets$lmertest <- mk_preset("lmertest", p4, "sleepstudy: lmerTest with p-values", "lmerTest")
out$presets <- presets

## Wald CIs for the fixed effects (the honest "approximate CI" option the tool emits)
wald <- function(m) {
  ci <- confint(m, method = "Wald")
  ci <- ci[!is.na(ci[, 1]) | !is.na(ci[, 2]), , drop = FALSE]
  keep <- rownames(ci) %in% rownames(coef(summary(m)))
  ci <- ci[keep, , drop = FALSE]
  lapply(seq_len(nrow(ci)), function(i)
    list(term = rownames(ci)[i], lower = ci[i, 1], upper = ci[i, 2]))
}
out$wald_ci <- list(ri = wald(p1), rs = wald(p2), glmer = wald(p3))

## ------------------------------------------- PROOF: random-slope ICC needs data
d <- sleepstudy$Days
vcr <- as.data.frame(VarCorr(p2))
v_int <- vcr$vcov[1]; v_slp <- vcr$vcov[2]; cov_is <- vcr$vcov[3]; v_res <- vcr$vcov[4]
nak <- v_int + 2 * mean(d) * cov_is + mean(d^2) * v_slp
out$rs_proof <- list(
  v_int = v_int, v_slope = v_slp, cov_int_slope = cov_is, v_resid = v_res,
  mean_x = mean(d), mean_x2 = mean(d^2),
  nakagawa_var_random = nak,
  icc_from_nakagawa = nak / (nak + v_res),
  performance_adjusted = icc_of(p2)$adjusted,
  insight_var_random = insight::get_variance(p2)$var.random,
  # what you CAN get from the printed summary alone:
  icc_at_x0 = v_int / (v_int + v_res),
  naive_sum_icc = (v_int + v_slp) / (v_int + v_slp + v_res)
)

## ------------------------------------------------------- ICC TRUTH TABLE ------
## Simulated random-intercept models spanning the ICC range, checked against
## performance::icc(). These are the cases the JS math library must reproduce.
cases <- list()
add_case <- function(id, m, kind) {
  ic <- icc_of(m)
  vcd <- as.data.frame(VarCorr(m))
  cases[[length(cases) + 1]] <<- list(
    id = id, kind = kind,
    varcorr = vc_list(m),
    nobs = as.integer(nobs(m)),
    ngrps = as.integer(lme4::ngrps(m)[[1]]),
    icc_adjusted = ic$adjusted, icc_unadjusted = ic$unadjusted
  )
}

grid <- list(
  list(g = 12, n = 10, tau = 1,  sig = 1),
  list(g = 20, n = 8,  tau = 4,  sig = 1),
  list(g = 30, n = 5,  tau = 0.5, sig = 3),
  list(g = 15, n = 20, tau = 2,  sig = 2),
  list(g = 40, n = 6,  tau = 9,  sig = 1),
  list(g = 25, n = 12, tau = 0.2, sig = 5),
  list(g = 10, n = 30, tau = 6,  sig = 2),
  list(g = 50, n = 4,  tau = 1.5, sig = 1.5),
  list(g = 18, n = 10, tau = 3,  sig = 0.5),
  list(g = 22, n = 15, tau = 0.8, sig = 4)
)
for (k in seq_along(grid)) {
  p <- grid[[k]]
  gid <- factor(rep(seq_len(p$g), each = p$n))
  x <- rnorm(p$g * p$n)
  u <- rnorm(p$g, 0, sqrt(p$tau))[as.integer(gid)]
  y <- 3 + 1.5 * x + u + rnorm(p$g * p$n, 0, sqrt(p$sig))
  dat <- data.frame(y = y, x = x, gid = gid)
  m <- lme4::lmer(y ~ x + (1 | gid), data = dat,
                  control = lmerControl(check.conv.singular = "ignore"))
  add_case(paste0("ri_sim_", k), m, "lmer")
}

## crossed / multiple grouping factors -> ICC sums the random variances
for (k in 1:2) {
  g1 <- factor(rep(seq_len(15), each = 12))
  g2 <- factor(rep(seq_len(12), times = 15))
  u1 <- rnorm(15, 0, sqrt(c(2, 5)[k]))[as.integer(g1)]
  u2 <- rnorm(12, 0, sqrt(c(1, 0.5)[k]))[as.integer(g2)]
  x <- rnorm(180)
  y <- 1 + 0.7 * x + u1 + u2 + rnorm(180, 0, sqrt(c(1, 2)[k]))
  dat <- data.frame(y = y, x = x, g1 = g1, g2 = g2)
  m <- lme4::lmer(y ~ x + (1 | g1) + (1 | g2), data = dat,
                  control = lmerControl(check.conv.singular = "ignore"))
  add_case(paste0("crossed_", k), m, "lmer")
}

## glmer logit models -> latent-scale ICC = tau/(tau+pi^2/3)
for (k in 1:3) {
  tau <- c(0.5, 1.5, 3)[k]
  gid <- factor(rep(seq_len(60), each = 20))
  x <- rnorm(1200)
  u <- rnorm(60, 0, sqrt(tau))[as.integer(gid)]
  eta <- -0.3 + 0.8 * x + u
  y <- rbinom(1200, 1, plogis(eta))
  dat <- data.frame(y = y, x = x, gid = gid)
  m <- lme4::glmer(y ~ x + (1 | gid), family = binomial, data = dat,
                   control = glmerControl(check.conv.singular = "ignore"))
  add_case(paste0("glmer_sim_", k), m, "glmer")
}

## the four real presets also enter the truth table
add_case("preset_ri", p1, "lmer")
add_case("preset_rs", p2, "lmer")
add_case("preset_glmer", p3, "glmer")
add_case("preset_lmertest", p4, "lmerTest")

out$cases <- cases
out$pi2_3 <- pi^2 / 3
out$R_version <- R.version.string
out$lme4_version <- as.character(packageVersion("lme4"))

write(toJSON(out, auto_unbox = TRUE, digits = 15, pretty = TRUE, null = "null"),
      "Scripts/tool-truth/lmer-output-interpreter.json")
cat("cases:", length(cases), " presets:", length(presets), "\n")
cat("RS proof diff:", abs(out$rs_proof$icc_from_nakagawa - out$rs_proof$performance_adjusted), "\n")
