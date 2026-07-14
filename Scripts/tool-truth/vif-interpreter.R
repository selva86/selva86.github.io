# Tool Farm v2: VIF / multicollinearity truth table (R 4.6.0 ground truth).
# GROUND TRUTH SOURCE: car::vif() on lm() fits (car IS installed here). The VIFs
# depend ONLY on the predictor correlation matrix, not the response, so
#   car::vif(lm(y ~ x1 + x2 + ...)) == diag(solve(cor(cbind(x1, x2, ...)))).
# That identity is what lets the calculator compute VIFs from raw predictor
# columns (no response needed) and recompute them after dropping a predictor
# (drop that row/col from R and re-invert == refit car::vif on the reduced set).
#
# Validates: (1) VIF_j = diag(solve(cor(X)))            == car::vif()
#            (2) cor(X) itself (raw -> correlation)      == cor()
#            (3) after-drop recompute (the what-if loop) == car::vif(reduced lm)
#            (4) condition number = sqrt(max/min eigenvalue of cor(X))
#            (5) GVIF^(1/(2Df)) squaring, scalar identities, singular detection.
suppressMessages(library(car))
options(digits = 15)

esc <- function(v) {
  if (!is.finite(v)) return(if (is.nan(v)) "\"NaN\"" else if (v > 0) "\"Inf\"" else "\"-Inf\"")
  sprintf("%.15g", v)
}
vecJSON <- function(v) paste0("[", paste(vapply(v, esc, ""), collapse = ","), "]")
matJSON <- function(M) paste0("[", paste(apply(M, 1, vecJSON), collapse = ","), "]")
strvec  <- function(s) paste0("[", paste0("\"", s, "\"", collapse = ","), "]")

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- list(...)

# helper: emit a "cor" case (VIF from a correlation matrix)
corCase <- function(id, X, vif_truth) {
  R  <- cor(X)
  ev <- eigen(R)$values
  cond <- sqrt(max(ev) / min(ev))
  add(id = id, type = "cor",
      names = colnames(X), R = R,
      vif = as.numeric(vif_truth), cond = cond)
}

# helper: emit a "raw" case (VIF from raw predictor columns). Stores the raw
# data matrix, the expected cor(X), and car::vif on lm(response ~ predictors).
rawCase <- function(id, DF, response) {
  preds <- setdiff(colnames(DF), response)
  X  <- as.matrix(DF[, preds, drop = FALSE])
  f  <- lm(as.formula(paste(response, "~", paste(preds, collapse = " + "))), data = DF)
  R  <- cor(X)
  ev <- eigen(R)$values
  cond <- sqrt(max(ev) / min(ev))
  add(id = id, type = "raw",
      names = preds, data = X, R = R,
      vif = as.numeric(vif(f)), cond = cond)
}

# helper: emit a "drop" case (what-if: refit after removing predictors).
dropCase <- function(id, DF, response, drop) {
  preds <- setdiff(colnames(DF), response)
  keep  <- setdiff(preds, drop)
  X     <- as.matrix(DF[, preds, drop = FALSE])   # full predictor block (input)
  f     <- lm(as.formula(paste(response, "~", paste(keep, collapse = " + "))), data = DF)
  add(id = id, type = "drop",
      names = preds, data = X, drop = drop,
      names_after = keep, vif_after = as.numeric(vif(f)))
}

# ---- (A) VIF from a correlation matrix (kept from v1) ----
f1 <- lm(mpg ~ wt + hp + disp, data = mtcars)
corCase("mtcars_wt_hp_disp", mtcars[, c("wt", "hp", "disp")], vif(f1))
f2 <- lm(mpg ~ wt + hp + disp + cyl, data = mtcars)
corCase("mtcars_wt_hp_disp_cyl", mtcars[, c("wt", "hp", "disp", "cyl")], vif(f2))
f3 <- lm(mpg ~ wt + qsec + am, data = mtcars)
corCase("mtcars_wt_qsec_am", mtcars[, c("wt", "qsec", "am")], vif(f3))
f4 <- lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width, data = iris)
corCase("iris_4pred", iris[, c("Sepal.Width", "Petal.Length", "Petal.Width")], vif(f4))
f5 <- lm(mpg ~ wt + disp, data = mtcars)
corCase("mtcars_wt_disp_2pred", mtcars[, c("wt", "disp")], vif(f5))

# ---- (B) VIF from RAW predictor data (the new default mode) ----
rawCase("raw_mtcars_3", mtcars[, c("mpg", "wt", "hp", "disp")], "mpg")
rawCase("raw_mtcars_4", mtcars[, c("mpg", "wt", "hp", "disp", "cyl")], "mpg")
rawCase("raw_iris_3",   iris[, c("Sepal.Length", "Sepal.Width", "Petal.Length", "Petal.Width")], "Sepal.Length")

# constructed high collinearity r ~ 0.99 (raw)
set.seed(1)
a <- rnorm(200); b <- a * 0.99 + rnorm(200) * sqrt(1 - 0.99^2); cc <- rnorm(200)
DFhi <- data.frame(y = a + b + cc + rnorm(200), a = a, b = b, c = cc)
rawCase("raw_constructed_r099", DFhi, "y")

# near-singular but still invertible: x2 ~ x1 + tiny noise (r ~ 0.998, VIF ~ 250)
set.seed(7)
z1 <- rnorm(120); z2 <- z1 + rnorm(120) * 0.05; z3 <- rnorm(120)
DFns <- data.frame(y = z1 + z3 + rnorm(120), z1 = z1, z2 = z2, z3 = z3)
rawCase("raw_near_singular", DFns, "y")

# ---- (C) after-drop recompute (the drop-a-predictor what-if loop) ----
dropCase("drop_disp",        mtcars[, c("mpg", "wt", "hp", "disp", "cyl")], "mpg", "disp")
dropCase("drop_disp_cyl",    mtcars[, c("mpg", "wt", "hp", "disp", "cyl")], "mpg", c("disp", "cyl"))
dropCase("drop_petallen",    iris[, c("Sepal.Length", "Sepal.Width", "Petal.Length", "Petal.Width")], "Sepal.Length", "Petal.Length")
dropCase("drop_b_from_hi",   DFhi, "y", "b")

# ---- (D) GVIF (factor predictor): car::vif returns GVIF, Df, GVIF^(1/(2*Df)) ----
mtc <- mtcars
mtc$cylf <- factor(mtc$cyl)
fg <- lm(mpg ~ wt + hp + cylf, data = mtc)
g  <- vif(fg)
for (i in seq_len(nrow(g))) {
  add(id = paste0("gvif_", rownames(g)[i]), type = "gvif",
      adj = g[i, 3], df = g[i, 2], comparable_vif = g[i, 3]^2)
}

# ---- (E) scalar identities: tolerance, SE inflation ----
for (v in c(1, 2.5, 5, 10, 25, 100)) {
  add(id = paste0("scalar_", v), type = "scalar",
      vif = v, tolerance = 1 / v, se_infl = sqrt(v))
}

# ---- (F) singular / perfect collinearity (correlation matrix is rank deficient) ----
Rsing <- matrix(c(1, 1, 0.5,
                  1, 1, 0.5,
                  0.5, 0.5, 1), 3, 3, byrow = TRUE)
add(id = "singular_perfect", type = "singular", R = Rsing)

# ---- emit JSON ----
out <- character(0)
for (i in seq_along(cases)) {
  cc <- cases[[i]]
  parts <- c(sprintf("\"id\":\"%s\"", cc$id), sprintf("\"type\":\"%s\"", cc$type))
  if (!is.null(cc$names))       parts <- c(parts, sprintf("\"names\":%s", strvec(cc$names)))
  if (!is.null(cc$names_after)) parts <- c(parts, sprintf("\"names_after\":%s", strvec(cc$names_after)))
  if (!is.null(cc$drop))        parts <- c(parts, sprintf("\"drop\":%s", strvec(cc$drop)))
  if (!is.null(cc$data))        parts <- c(parts, sprintf("\"data\":%s", matJSON(cc$data)))
  if (!is.null(cc$R))           parts <- c(parts, sprintf("\"R\":%s", matJSON(cc$R)))
  if (!is.null(cc$vif))         parts <- c(parts, sprintf("\"vif\":%s", vecJSON(cc$vif)))
  if (!is.null(cc$vif_after))   parts <- c(parts, sprintf("\"vif_after\":%s", vecJSON(cc$vif_after)))
  if (!is.null(cc$cond))        parts <- c(parts, sprintf("\"cond\":%s", esc(cc$cond)))
  if (!is.null(cc$adj))         parts <- c(parts, sprintf("\"adj\":%s", esc(cc$adj)))
  if (!is.null(cc$df))          parts <- c(parts, sprintf("\"df\":%s", esc(cc$df)))
  if (!is.null(cc$comparable_vif)) parts <- c(parts, sprintf("\"comparable_vif\":%s", esc(cc$comparable_vif)))
  if (!is.null(cc$tolerance))   parts <- c(parts, sprintf("\"tolerance\":%s", esc(cc$tolerance)))
  if (!is.null(cc$se_infl))     parts <- c(parts, sprintf("\"se_infl\":%s", esc(cc$se_infl)))
  out <- c(out, paste0("{", paste(parts, collapse = ","), "}"))
}
writeLines(paste0("[\n", paste(out, collapse = ",\n"), "\n]"),
           con = file.path("Scripts", "tool-truth", "vif-interpreter.json"))
cat("Wrote", length(cases), "cases to Scripts/tool-truth/vif-interpreter.json\n")
