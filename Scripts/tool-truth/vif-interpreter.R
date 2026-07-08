# Tool Farm v2: VIF / multicollinearity interpreter truth table (R 4.6.0 ground truth).
# Validates: VIF_j = diag(solve(cor(X))) == car::vif(); condition number =
# sqrt(max/min eigenvalue of cor(X)) == kappa(scale(X), exact = TRUE); GVIF^(1/(2Df))
# squaring; 2-predictor closed form; singular / perfect-collinearity detection.
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

# helper: emit a "cor" case from a data frame of predictors
corCase <- function(id, X, vif_truth) {
  R  <- cor(X)
  ev <- eigen(R)$values
  cond <- sqrt(max(ev) / min(ev))
  add(id = id, type = "cor",
      names = colnames(X), R = R,
      vif = as.numeric(vif_truth), cond = cond)
}

# ---- car::vif ground-truth models (continuous predictors) ----
f1 <- lm(mpg ~ wt + hp + disp, data = mtcars)
corCase("mtcars_wt_hp_disp", mtcars[, c("wt", "hp", "disp")], vif(f1))

f2 <- lm(mpg ~ wt + hp + disp + cyl, data = mtcars)
corCase("mtcars_wt_hp_disp_cyl", mtcars[, c("wt", "hp", "disp", "cyl")], vif(f2))

f3 <- lm(mpg ~ wt + qsec + am, data = mtcars)
corCase("mtcars_wt_qsec_am", mtcars[, c("wt", "qsec", "am")], vif(f3))

f4 <- lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width, data = iris)
corCase("iris_4pred", iris[, c("Sepal.Width", "Petal.Length", "Petal.Width")], vif(f4))

# ---- 2-predictor closed form: VIF = 1/(1-r^2) for both ----
f5 <- lm(mpg ~ wt + disp, data = mtcars)
corCase("mtcars_wt_disp_2pred", mtcars[, c("wt", "disp")], vif(f5))

# ---- high correlation (constructed r = 0.99) ----
set.seed(1)
a <- rnorm(200); b <- a * 0.99 + rnorm(200) * sqrt(1 - 0.99^2); cc <- rnorm(200)
Xhi <- data.frame(a = a, b = b, c = cc)
yhi <- a + b + cc + rnorm(200)
fhi <- lm(yhi ~ a + b + c, data = Xhi)
corCase("constructed_r099", Xhi, vif(fhi))

# ---- GVIF (factor predictor): car::vif returns GVIF, Df, GVIF^(1/(2*Df)) ----
mtc <- mtcars
mtc$cylf <- factor(mtc$cyl)
fg <- lm(mpg ~ wt + hp + cylf, data = mtc)
g  <- vif(fg)                      # matrix: rows = terms, cols = GVIF, Df, GVIF^(1/(2*Df))
for (i in seq_len(nrow(g))) {
  adj <- g[i, 3]; df <- g[i, 2]
  add(id = paste0("gvif_", rownames(g)[i]), type = "gvif",
      adj = adj, df = df, comparable_vif = adj^2)
}

# ---- scalar identities: tolerance, SE inflation ----
for (v in c(1, 2.5, 5, 10, 25, 100)) {
  add(id = paste0("scalar_", v), type = "scalar",
      vif = v, tolerance = 1 / v, se_infl = sqrt(v))
}

# ---- singular / perfect collinearity: predictor cor matrix is rank deficient ----
Rsing <- matrix(c(1, 1, 0.5,
                  1, 1, 0.5,
                  0.5, 0.5, 1), 3, 3, byrow = TRUE)
add(id = "singular_perfect", type = "singular", R = Rsing)

# ---- emit JSON ----
out <- character(0)
for (i in seq_along(cases)) {
  cc <- cases[[i]]
  parts <- c(sprintf("\"id\":\"%s\"", cc$id), sprintf("\"type\":\"%s\"", cc$type))
  if (!is.null(cc$names)) parts <- c(parts, sprintf("\"names\":%s", strvec(cc$names)))
  if (!is.null(cc$R))     parts <- c(parts, sprintf("\"R\":%s", matJSON(cc$R)))
  if (!is.null(cc$vif))   parts <- c(parts, sprintf("\"vif\":%s", vecJSON(cc$vif)))
  if (!is.null(cc$cond))  parts <- c(parts, sprintf("\"cond\":%s", esc(cc$cond)))
  if (!is.null(cc$adj))   parts <- c(parts, sprintf("\"adj\":%s", esc(cc$adj)))
  if (!is.null(cc$df))    parts <- c(parts, sprintf("\"df\":%s", esc(cc$df)))
  if (!is.null(cc$comparable_vif)) parts <- c(parts, sprintf("\"comparable_vif\":%s", esc(cc$comparable_vif)))
  if (!is.null(cc$tolerance)) parts <- c(parts, sprintf("\"tolerance\":%s", esc(cc$tolerance)))
  if (!is.null(cc$se_infl))   parts <- c(parts, sprintf("\"se_infl\":%s", esc(cc$se_infl)))
  out <- c(out, paste0("{", paste(parts, collapse = ","), "}"))
}
writeLines(paste0("[\n", paste(out, collapse = ",\n"), "\n]"),
           con = file.path("Scripts", "tool-truth", "vif-interpreter.json"))
cat("Wrote", length(cases), "cases to Scripts/tool-truth/vif-interpreter.json\n")
