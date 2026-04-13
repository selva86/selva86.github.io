# Plan: R solve() Error: 'singular matrix'

## A. Frontmatter

| Field | Value |
|---|---|
| title | R solve() Error: 'singular matrix' — Diagnose Multicollinearity and Fix It |
| slug | R-Error-Singular-Matrix |
| description | R's solve() fails on singular matrices when columns are linearly dependent. Diagnose with rcond(), then fix via ridge, variable removal, or MASS::ginv(). |
| keywords | R singular matrix error, system is computationally singular R, solve() error R, rcond R, multicollinearity R, ridge regression R, MASS ginv, R matrix inversion |
| auto_link_terms | computationally singular\|singular matrix error\|rcond()\|MASS::ginv()\|multicollinearity in R |
| auto_link_case_sensitive | false |
| mathjax | true |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | ERR18 |
| post_type | FR |
| fr_parent | R-Common-Errors.html |

## B. Breadcrumb (auto-generated): Home > Learn R > Errors > R solve() Error: 'singular matrix'

## C. Section outline

**Lead:** `Error in solve.default(...) : system is computationally singular` means R tried to invert a matrix whose columns carry duplicate information — one column can be built as a weighted sum of the others. In regression language, that's **multicollinearity**, and the fix is to diagnose which columns collide and remove, combine, or regularise them.

### H2-1: Why does solve() complain that my matrix is 'computationally singular'?
- **Opening prose (≤80 words):** solve() inverts a matrix by running Gaussian elimination. If a column repeats information already carried by other columns, one elimination step divides by zero — or by a number so small that the result explodes into machine noise. R refuses to return nonsense and throws the error. The cleanest demo is to feed solve() a 3×3 matrix whose second column is exactly twice the first, then watch R call out the zero determinant and refuse the inverse.
- **Code Block 1 (payoff):** Build 3×3 matrix with col2 = 2*col1, show `det()`, `rcond()`, then `tryCatch(solve(...))` printing the exact error message.
- **Callout:** KEY INSIGHT — an NA coefficient in `lm()` is the friendlier face of the same singular-matrix error.
- **Try it 1:** compute `ex_rank` via `qr()$rank` and verify it's less than `ncol()`.

### H2-2: What kinds of R models quietly trigger a singular matrix?
- **Opening prose:** Real bugs hide inside regression design matrices — a predictor that's a scaled copy of another, a factor encoded twice, a derived column sneaked in with `mutate()`. `lm()` tries to hide it by dropping redundant terms and returning NA coefficients, but the underlying `solve(t(X) %*% X)` call still blows up if you reach for it yourself.
- **Code Block 2:** simulate height_cm + height_m (= height_cm/100) in a lm; show NA coefficient; call solve() on X'X directly and print the error.
- **Try it 2:** use `alias()` to print the dependency as an equation.

### H2-3: How do I find the exact column causing the problem?
- **Opening prose:** Knowing the matrix is singular isn't enough — you want the column name. QR decomposition gives you both the numerical rank and the pivot order, so the independent columns sit at the front and the redundant ones at the back.
- **Code Block 3:** build 5-column X where col5 = col1+col2, use `qr(X)$rank` and `qr(X)$pivot` to name independent and redundant columns.
- **Callout:** TIP — `qr(X)$rank` is the fastest rank check in base R.
- **Try it 3:** drop the redundant column and confirm solve(t(X_fixed) %*% X_fixed) succeeds.

### H2-4: When should I use ridge regularisation versus a generalised inverse?
- **Opening prose:** Dropping a column is right when the redundancy is accidental (duplicate). Dropping it is wrong when many predictors are mildly correlated — you'd throw away signal. Two fixes preserve all columns: ridge regression, which nudges the diagonal of X'X so it's invertible, and the Moore–Penrose pseudoinverse, which uses SVD to compute a unique solution even on singular matrices.
- **Math:** $\hat{\beta}_{ridge} = (X^TX + \lambda I)^{-1} X^T y$
- **Code Block 4:** near-collinear matrix (a ≈ b), show rcond, compute ridge manually with lambda=0.1 and compute ginv via `MASS::ginv()`; compare coefficients.
- **Callout:** WARNING — ridge and ginv agree on near-perfect collinearity; on moderate collinearity they diverge and ridge usually generalises better.
- **Try it 4:** double lambda to 1.0 and observe further shrinkage.

### H2-5: How do I avoid the dummy-variable trap with factor-heavy models?
- **Opening prose:** Categorical variables give you a second route to singularity. If you expand a factor into one dummy per level and also add an intercept, the dummy columns sum to the intercept — a perfect linear dependency. R's `model.matrix()` handles this automatically when you write `~ factor_name`, but hand-built design matrices skip the drop.
- **Code Block 5:** 3-level group factor, compare X_bad = intercept + 3 dummies vs X_good = `model.matrix(~ group)`, print qr rank for each.
- **Callout:** NOTE — if you need all K levels, drop the intercept instead: `lm(y ~ 0 + group)`.
- **Try it 5:** build a two-factor interaction design matrix and verify its rank.

### Practice Exercises (capstone, 2-3 items)
1. **diagnose_and_fix(X)** — medium. Write a function that checks rcond, finds the redundant column via qr, drops it, and returns solve(t(X_fix) %*% X_fix).
2. **ridge_beta(X, y, lambda)** — hard. Implement closed-form ridge regression from scratch and verify against `MASS::lm.ridge`.
3. **safe_solve(A)** — hard. Wrap solve() so that if rcond < 1e-12 it falls back to `MASS::ginv()` and emits a warning.

### Complete Example
End-to-end walkthrough: simulate 100 rows × 6 predictors with one exact duplicate and two near-duplicates, detect with rcond, diagnose with qr, fix with drop-then-ridge, verify coefficients match the true generating process.

### Summary
Table: Symptom → Diagnosis → Fix.

### References
1. R Core — `?solve` / `?rcond`
2. Venables & Ripley — MASS package (Moore-Penrose via `ginv`)
3. Hastie, Tibshirani, Friedman — *Elements of Statistical Learning*, Ch 3 (Ridge Regression)
4. Hadley Wickham — *Advanced R*, numerical linear algebra section
5. Wikipedia — Condition number
6. Wikipedia — Moore–Penrose pseudoinverse
7. StatisticsGlobe — R error in solve.default tutorial

### Continue Learning
1. R Common Errors — parent reference
2. R Linear Regression — the main place this error appears
3. Ridge and Lasso Regression in R — deeper regularisation treatment

## D. Diagrams
None (FR post — diagrams optional; topic is text-heavy and a diagram would not add pedagogical value).

## E. Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used from prior |
|---|---|---|---|---|
| 1 | Reproduce error + rcond | — | X | — |
| 1a | try_it: qr rank | — | ex_rank | X |
| 2 | lm() NA + solve() on X'X | — | height_cm, height_m, y, fit | — |
| 2a | try_it: alias() | — | — | fit |
| 3 | qr rank + pivot to name cols | — | X5, qr_X, independent_cols, redundant_cols | — |
| 3a | try_it: drop + solve | — | ex_X_fixed | X5 |
| 4 | Ridge + ginv (loads MASS) | MASS | X_near, y_near, beta_ridge, beta_ginv | — |
| 4a | try_it: lambda=1.0 | — | ex_beta_ridge_big | X_near, y_near |
| 5 | Dummy trap | — | group, y_fac, X_bad, X_good | — |
| 5a | try_it: interaction rank | — | ex_X_inter | group |
| CE1-3 | Complete example: simulate + diagnose + fix | — | sim_*, full_* | — |
| EX1-3 | Capstone solutions | — | my_* | — |

Rule check: libraries only on block 4 (MASS); every "vars used" traces to a prior block's "vars introduced". OK.

## Estimated: ~2600 words, 5 H2 core + 5 tail = 10 H2 total, 5 inline try-it + 3 capstone, 5 callouts (1 KEY INSIGHT + 1 TIP + 1 WARNING + 1 NOTE + 1 more TIP in Complete Example).
