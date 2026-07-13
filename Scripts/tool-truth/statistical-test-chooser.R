# statistical-test-chooser.R
# Pass 1 for the Statistical Test Chooser: the primary artifact is a decision
# engine (wizard path -> recommended test), so there is no numeric truth table
# to match. What DOES need R verification is that every self-contained R
# snippet shown on a recommendation card actually runs in R 4.6.0 and produces
# sensible output. This script evaluates each snippet in a fresh environment,
# records pass/fail + a short output sample, and writes the JSON summary.
#
# Run:
#   "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/statistical-test-chooser.R

options(warn = 1)

snippets <- list(
  `one-sample-t` = 'x <- c(5.1, 4.8, 5.4, 5.0, 5.3, 4.9, 5.2)
t.test(x, mu = 5)',
  `student-t` = 'new  <- c(84, 88, 79, 91, 85, 87)
ctrl <- c(78, 82, 75, 80, 79, 81)
t.test(new, ctrl, var.equal = TRUE)',
  `welch-t` = 'new  <- c(84, 88, 79, 91, 85, 87)
ctrl <- c(78, 82, 75, 80, 79, 81)
t.test(new, ctrl)',
  `paired-t` = 'before <- c(72, 68, 75, 71, 66, 70)
after  <- c(75, 70, 79, 74, 68, 74)
t.test(after, before, paired = TRUE)',
  `mann-whitney` = 'g1 <- c(21, 25, 30, 19, 27)
g2 <- c(14, 18, 11, 20, 16)
wilcox.test(g1, g2)',
  `wilcoxon-signed-rank` = 'before <- c(72, 68, 75, 71, 66, 70)
after  <- c(75, 70, 79, 74, 68, 74)
wilcox.test(after, before, paired = TRUE)',
  `sign-test` = 'before <- c(72, 68, 75, 71, 66, 70)
after  <- c(75, 70, 79, 74, 68, 74)
d <- after - before
binom.test(sum(d > 0), sum(d != 0))',
  `kruskal-wallis` = 'score <- c(21, 25, 30, 14, 18, 11, 33, 29, 40)
group <- factor(rep(c("A", "B", "C"), each = 3))
kruskal.test(score ~ group)',
  `friedman` = 'm <- matrix(c(1,2,3, 2,3,1, 1,3,2, 2,3,1), nrow = 4, byrow = TRUE)
friedman.test(m)',
  `one-way-anova` = 'score <- c(84, 88, 79, 78, 82, 75, 91, 89, 94)
group <- factor(rep(c("A", "B", "C"), each = 3))
summary(aov(score ~ group))',
  `welch-anova` = 'score <- c(84, 88, 79, 78, 82, 75, 91, 89, 94)
group <- factor(rep(c("A", "B", "C"), each = 3))
oneway.test(score ~ group)',
  `rm-anova` = 'score   <- c(5,6,7, 6,7,8, 4,5,7, 5,6,6)
subject <- factor(rep(1:4, each = 3))
time    <- factor(rep(c("t1","t2","t3"), times = 4))
summary(aov(score ~ time + Error(subject/time)))',
  `chi-square-gof` = 'observed <- c(20, 30, 25, 25)
chisq.test(observed, p = rep(1/4, 4))',
  `chi-square-independence` = 'tab <- matrix(c(30, 20, 15, 35), nrow = 2,
              dimnames = list(group = c("A","B"), outcome = c("yes","no")))
chisq.test(tab)',
  `fisher-exact` = 'tab <- matrix(c(8, 2, 1, 9), nrow = 2)
fisher.test(tab)',
  `mcnemar` = 'tab <- matrix(c(30, 12, 5, 20), nrow = 2)
mcnemar.test(tab)',
  `cochran-q` = 'm <- matrix(c(1,1,0, 1,0,0, 1,1,1, 0,1,0, 1,1,0), nrow = 5, byrow = TRUE)
k  <- ncol(m); Cj <- colSums(m); Ri <- rowSums(m)
Q  <- (k - 1) * (k * sum(Cj^2) - sum(Cj)^2) / (k * sum(Ri) - sum(Ri^2))
c(Q = Q, df = k - 1, p = pchisq(Q, k - 1, lower.tail = FALSE))',
  `one-prop-z` = 'prop.test(x = 46, n = 100, p = 0.5, correct = FALSE)',
  `two-prop-z` = 'prop.test(c(34, 48), c(100, 100), correct = FALSE)',
  `binomial-test` = 'binom.test(x = 8, n = 20, p = 0.5)',
  `pearson` = 'x <- c(1, 2, 3, 4, 5, 6)
y <- c(2.1, 3.9, 6.2, 7.8, 10.1, 12.3)
cor.test(x, y, method = "pearson")',
  `spearman` = 'x <- c(1, 2, 3, 4, 5, 6)
y <- c(2, 4, 5, 4, 6, 9)
cor.test(x, y, method = "spearman")',
  `kendall` = 'x <- c(1, 2, 3, 4, 5, 6)
y <- c(2, 1, 4, 3, 6, 5)
cor.test(x, y, method = "kendall")',
  `simple-linear-regression` = 'x <- c(1, 2, 3, 4, 5, 6)
y <- c(2.1, 3.9, 6.2, 7.8, 10.1, 12.3)
summary(lm(y ~ x))',
  `multiple-linear-regression` = 'summary(lm(mpg ~ wt + hp + disp, data = mtcars))',
  `logistic-regression` = 'fit <- glm(vs ~ wt + hp, family = binomial, data = mtcars)
summary(fit)',
  `poisson-regression` = 'counts <- c(2, 3, 6, 7, 8, 9, 10, 12, 15)
dose   <- c(1, 1, 2, 2, 3, 3, 4, 4, 5)
summary(glm(counts ~ dose, family = poisson))',
  `ordinal-logistic` = 'library(MASS)
fit <- polr(factor(gear) ~ mpg + hp, data = mtcars, Hess = TRUE)
summary(fit)',
  `multinomial-logistic` = 'library(nnet)
fit <- multinom(factor(gear) ~ mpg + hp, data = mtcars, trace = FALSE)
summary(fit)',
  `log-rank` = 'library(survival)
survdiff(Surv(time, status) ~ sex, data = lung)',
  `cox-regression` = 'library(survival)
fit <- coxph(Surv(time, status) ~ age + sex, data = lung)
summary(fit)',
  `cohen-kappa` = 'rater1 <- c("a","a","b","b","a","b","a","b")
rater2 <- c("a","b","b","b","a","b","a","a")
tab <- table(rater1, rater2)
po <- sum(diag(tab)) / sum(tab)
pe <- sum(rowSums(tab) * colSums(tab)) / sum(tab)^2
(po - pe) / (1 - pe)',
  `icc` = 'm <- matrix(c(9,8,8, 7,6,7, 5,6,5, 8,9,8, 6,5,6), nrow = 5, byrow = TRUE)
n <- nrow(m); k <- ncol(m)
d <- data.frame(y = as.vector(m),
                s = factor(rep(1:n, k)),
                r = factor(rep(1:k, each = n)))
a <- summary(aov(y ~ s + r, data = d))[[1]]
MSR <- a["s","Mean Sq"]; MSC <- a["r","Mean Sq"]; MSE <- a["Residuals","Mean Sq"]
(MSR - MSE) / (MSR + (k-1)*MSE + k*(MSC - MSE)/n)',
  `describe-continuous` = 'x <- c(5.1, 4.8, 5.4, 5.0, 5.3, 4.9, 5.2)
summary(x); sd(x)',
  `describe-categorical` = 'g <- c("A","B","A","C","B","A","C","C")
table(g); prop.table(table(g))'
)

esc <- function(s) {
  s <- gsub('\\\\', '\\\\\\\\', s)
  s <- gsub('"', '\\\\"', s)
  s <- gsub('\n', '\\\\n', s)
  s <- gsub('\t', '\\\\t', s)
  s
}

results <- character(0)
pass <- 0L; fail <- 0L
for (id in names(snippets)) {
  code <- snippets[[id]]
  env <- new.env()
  ok <- TRUE; msg <- ""
  out <- tryCatch(
    capture.output(eval(parse(text = code), envir = env)),
    error = function(e) { ok <<- FALSE; msg <<- conditionMessage(e); character(0) },
    warning = function(w) {
      # re-run swallowing the warning so we still get output
      withCallingHandlers(
        capture.output(eval(parse(text = code), envir = env)),
        warning = function(w2) invokeRestart("muffleWarning")
      )
    }
  )
  sample <- paste(utf8ToInt("")[0], collapse = "")  # placeholder
  sample <- paste(head(out[nzchar(out)], 3), collapse = " | ")
  if (ok) pass <- pass + 1L else fail <- fail + 1L
  cat(sprintf("[%s] %s\n", if (ok) "PASS" else "FAIL", id))
  if (!ok) cat("   error:", msg, "\n")
  results <- c(results, sprintf(
    '  {"id":"%s","ok":%s,"error":"%s","sample":"%s"}',
    id, if (ok) "true" else "false", esc(msg), esc(sample)
  ))
}

json <- paste0(
  '{\n  "tool": "statistical-test-chooser",\n  "r_version": "', R.version.string, '",\n',
  '  "n_snippets": ', length(snippets), ', "pass": ', pass, ', "fail": ', fail, ',\n',
  '  "snippets": [\n', paste(results, collapse = ",\n"), '\n  ]\n}\n'
)
outfile <- file.path("Scripts", "tool-truth", "statistical-test-chooser.json")
writeLines(json, outfile)
cat(sprintf("\n%d/%d snippets ran clean. Wrote %s\n", pass, length(snippets), outfile))
if (fail > 0) quit(status = 1)
