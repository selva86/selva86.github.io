# ============================================================
# survival-power truth table
# Ground truth = R 4.6.0 qnorm/pnorm (normal-dist precision reference)
# for the log-rank closed forms, and R integrate() for the
# event-probability integrals (validates the calculus, not just
# the arithmetic). gsDesign / powerSurvEpi are NOT required.
# Run: Rscript survival-power.R  -> survival-power.json
# ============================================================
suppressMessages(library(jsonlite))

cases <- list()
add <- function(fn, args, expect, note="") {
  cases[[length(cases)+1]] <<- list(fn=fn, args=args, expect=expect, note=note)
}

# ---- reference formulas -------------------------------------
zsum <- function(alpha, power, sided) qnorm(1 - alpha/sided) + qnorm(power)

schoen <- function(HR, alpha, power, k, sided) {
  z <- zsum(alpha, power, sided)
  z^2 * (1+k)^2 / (k * (log(HR))^2)
}
freed <- function(HR, alpha, power, k, sided) {
  z <- zsum(alpha, power, sided)
  ((1 + k*HR)/(1 - HR))^2 * z^2 / k
}
powS <- function(D, HR, alpha, k, sided) {
  za <- qnorm(1 - alpha/sided)
  pnorm(sqrt(D*k)/(1+k) * abs(log(HR)) - za)
}
powF <- function(D, HR, alpha, k, sided) {
  za <- qnorm(1 - alpha/sided)
  pnorm(sqrt(D*k) * abs(1 - HR)/(1 + k*HR) - za)
}
dropHaz <- function(annual) if (annual <= 0) 0 else -log(1 - annual)/12

# event probability, exponential survival, uniform accrual [0,A], follow to A+F
pExp_closed <- function(lambda, A, F) {
  if (A <= 0) return(1 - exp(-lambda*F))
  1 - (exp(-lambda*F) - exp(-lambda*(A+F)))/(lambda*A)
}
pExp_int <- function(lambda, A, F) {
  if (A <= 0) return(1 - exp(-lambda*F))
  integrate(function(u) 1 - exp(-lambda*(A+F-u)), 0, A)$value / A
}
pDrop_closed <- function(lambda, mu, A, F) {
  if (mu <= 0) return(pExp_closed(lambda, A, F))
  tot <- lambda + mu
  if (A <= 0) return((lambda/tot) * (1 - exp(-tot*F)))
  (lambda/tot) * (1 - (exp(-tot*F) - exp(-tot*(A+F)))/(tot*A))
}
pDrop_int <- function(lambda, mu, A, F) {
  tot <- lambda + mu
  if (A <= 0) return((lambda/tot) * (1 - exp(-tot*F)))
  integrate(function(u) (lambda/tot) * (1 - exp(-tot*(A+F-u))), 0, A)$value / A
}

# internal self-check: closed form must equal integrate()
maxdiff <- 0
chk <- function(a, b) { maxdiff <<- max(maxdiff, abs(a-b)) }

# ============================================================
# 1. Schoenfeld events  (events mode)
# ============================================================
for (sided in c(2,1))
  for (a in c(0.05, 0.01, 0.10, 0.025))
    for (pw in c(0.80, 0.90, 0.99, 0.70))
      for (k in c(1, 2, 0.5))
        for (HR in c(0.5, 0.6, 0.7, 0.8, 1.3, 1.5)) {
          add("schoenfeldEvents", list(HR=HR, alpha=a, power=pw, k=k, sided=sided),
              schoen(HR, a, pw, k, sided))
        }
# tiny effect (large D), extreme power
add("schoenfeldEvents", list(HR=0.95, alpha=0.05, power=0.80, k=1, sided=2), schoen(0.95,0.05,0.80,1,2), "tiny effect")
add("schoenfeldEvents", list(HR=0.3,  alpha=0.05, power=0.90, k=1, sided=2), schoen(0.30,0.05,0.90,1,2), "large effect")

# ============================================================
# 2. Freedman events
# ============================================================
for (sided in c(2,1))
  for (a in c(0.05, 0.01, 0.10))
    for (pw in c(0.80, 0.90))
      for (k in c(1, 2, 0.5))
        for (HR in c(0.5, 0.6, 0.7, 0.8, 1.4)) {
          add("freedmanEvents", list(HR=HR, alpha=a, power=pw, k=k, sided=sided),
              freed(HR, a, pw, k, sided))
        }
add("freedmanEvents", list(HR=0.95, alpha=0.05, power=0.80, k=1, sided=2), freed(0.95,0.05,0.80,1,2), "tiny effect")

# ============================================================
# 3. dropout hazard + median->hazard
# ============================================================
for (annual in c(0, 0.05, 0.10, 0.20, 0.35, 0.50)) {
  add("dropoutMonthlyHazard", list(annual=annual), dropHaz(annual))
}
for (m in c(6, 12, 18, 24, 36, 60)) {
  add("medianToHazard", list(median=m), log(2)/m)
}

# ============================================================
# 4. Event probability, no dropout (validated vs integrate)
# ============================================================
for (m in c(6, 12, 18, 24, 36))
  for (A in c(0, 6, 12, 24))
    for (F in c(0, 6, 12, 24, 60)) {
      if (A == 0 && F == 0) next
      lam <- log(2)/m
      pc <- pExp_closed(lam, A, F)
      chk(pc, pExp_int(lam, A, F))
      add("pEventExp", list(lambda=lam, A=A, F=F), pc, sprintf("median=%g", m))
    }

# ============================================================
# 5. Event probability with dropout (validated vs integrate)
# ============================================================
for (m in c(12, 18, 24))
  for (annual in c(0.05, 0.10, 0.20, 0.50))
    for (A in c(0, 12, 24))
      for (F in c(6, 12, 24)) {
        lam <- log(2)/m
        mu  <- dropHaz(annual)
        pc  <- pDrop_closed(lam, mu, A, F)
        chk(pc, pDrop_int(lam, mu, A, F))
        add("pEventWithDropout", list(lambda=lam, mu=mu, A=A, F=F), pc,
            sprintf("median=%g dropout=%g", m, annual))
      }

# ============================================================
# 6. Power from events (Schoenfeld + Freedman inverse)
# ============================================================
for (D in c(50, 100, 200, 380, 500))
  for (HR in c(0.5, 0.65, 0.7, 0.8, 1.4))
    for (k in c(1, 2))
      for (sided in c(2, 1)) {
        add("powerFromEvents",         list(D=D, HR=HR, alpha=0.05, k=k, sided=sided), powS(D, HR, 0.05, k, sided))
        add("powerFromEventsFreedman", list(D=D, HR=HR, alpha=0.05, k=k, sided=sided), powF(D, HR, 0.05, k, sided))
      }

# ============================================================
# 7. Full planner pipeline (n mode): events -> pbar -> n
#    mirrors the tool's compute() end to end.
# ============================================================
plan <- function(HR, alpha, power, k, medianC, A, F, dropoutAnnual, method, sided) {
  lamC <- log(2)/medianC
  lamT <- HR*lamC
  mu   <- dropHaz(dropoutAnnual)
  pEC  <- if (mu > 0) pDrop_closed(lamC, mu, A, F) else pExp_closed(lamC, A, F)
  pET  <- if (mu > 0) pDrop_closed(lamT, mu, A, F) else pExp_closed(lamT, A, F)
  pbar <- (pEC + k*pET)/(1+k)
  D    <- if (method == "freedman") freed(HR, alpha, power, k, sided) else schoen(HR, alpha, power, k, sided)
  nTot <- D / pbar
  list(lamC=lamC, lamT=lamT, mu=mu, pEC=pEC, pET=pET, pEbar=pbar,
       D=D, nTotal=nTot, n1=nTot/(1+k), n2=k*nTot/(1+k))
}

plan_grid <- list(
  list(HR=0.7,  alpha=0.05, power=0.80, k=1, medianC=12, A=24, F=12, dropoutAnnual=0,    method="schoenfeld", sided=2),  # cancer
  list(HR=0.5,  alpha=0.05, power=0.80, k=1, medianC=36, A=12, F=24, dropoutAnnual=0,    method="schoenfeld", sided=2),  # rare
  list(HR=0.7,  alpha=0.05, power=0.80, k=1, medianC=18, A=24, F=18, dropoutAnnual=0.10, method="schoenfeld", sided=2),  # dropout
  list(HR=0.6,  alpha=0.05, power=0.80, k=1, medianC=24, A=0,  F=60, dropoutAnnual=0,    method="schoenfeld", sided=2),  # long-fu
  list(HR=0.65, alpha=0.05, power=0.80, k=1, medianC=15, A=18, F=18, dropoutAnnual=0,    method="schoenfeld", sided=2),  # balanced
  list(HR=0.7,  alpha=0.05, power=0.80, k=2, medianC=12, A=24, F=12, dropoutAnnual=0,    method="schoenfeld", sided=2),  # 2:1
  list(HR=0.7,  alpha=0.05, power=0.80, k=1, medianC=18, A=24, F=18, dropoutAnnual=0.10, method="freedman",   sided=2),  # freedman + dropout
  list(HR=0.6,  alpha=0.01, power=0.90, k=1, medianC=24, A=36, F=24, dropoutAnnual=0.05, method="freedman",   sided=2)   # freedman strict
)
for (g in plan_grid) {
  ex <- do.call(plan, g)
  add("plan", g, ex)
}

# ============================================================
# emit
# ============================================================
cat(sprintf("closed-vs-integrate max abs diff: %.3e\n", maxdiff))
if (maxdiff > 1e-8) stop("closed form disagrees with integrate() beyond 1e-8")
writeLines(toJSON(cases, auto_unbox=TRUE, digits=NA, pretty=TRUE),
           "survival-power.json")
cat(sprintf("wrote survival-power.json with %d cases\n", length(cases)))
