#  Truth table for tools/bayesian-output-interpreter.html
#
#  Fits REAL rstanarm models locally and captures the ACTUAL text that
#  print(summary(fit)) wrote to the console. Nothing here is hand-typed:
#  every preset string is what rstanarm printed, and every expected number
#  is read back off the fitted model object.
#
#  The presets are deliberately a spread of decode surfaces:
#    gauss    - healthy gaussian stan_glm, the happy path
#    logit    - binomial stan_glm, log-odds coefficients
#    weak     - too few iterations on purpose -> genuine Rhat / ESS trouble
#    mlm      - stan_glmer, group-level Sigma row + b[] rows
#    diverge  - low adapt_delta on the same glmer -> genuine divergent
#               transitions, with the warnings R actually emitted appended
#
#  Run:  "C:/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/bayesian-output-interpreter.R
#  Out:  Scripts/tool-truth/bayesian-output-interpreter.json

suppressMessages(library(rstanarm))
suppressMessages(library(jsonlite))
options(mc.cores = 1)

PRINT_DIGITS <- 3

# ---------------------------------------------------------------- helpers

# Capture the warnings rstanarm genuinely emits while sampling, so the
# "diverge" preset can carry R's own divergence text rather than a
# paraphrase of it.
fit_capturing <- function(expr) {
  w <- character(0)
  val <- withCallingHandlers(
    expr,
    warning = function(x) { w <<- c(w, conditionMessage(x)); invokeRestart("muffleWarning") }
  )
  list(fit = val, warnings = w)
}

summary_text <- function(fit) {
  paste(capture.output(print(summary(fit), digits = PRINT_DIGITS)), collapse = "\n")
}

# Re-render R's warning list the way the console prints it, from the
# messages R actually produced. The numbers and URLs are R's own.
warning_block <- function(w) {
  if (!length(w)) return("")
  lines <- c("Warning messages:")
  for (i in seq_along(w)) {
    msg <- sub("\n$", "", w[i])
    parts <- strsplit(msg, "\n", fixed = TRUE)[[1]]
    parts[1] <- paste0(i, ": ", parts[1])
    lines <- c(lines, parts)
  }
  paste(lines, collapse = "\n")
}

# An INDEPENDENT reader of the printed text, used only to prove that the
# numbers in the text are exactly round(<model object>, PRINT_DIGITS).
# If this disagrees with the object the script stops: that would mean the
# presets and the truth table describe different things.
parse_printed <- function(txt) {
  lines <- strsplit(txt, "\n", fixed = TRUE)[[1]]
  out <- list()
  block <- NA_character_
  hdr <- NULL
  for (ln in lines) {
    if (grepl("^Estimates:", ln))        { block <- "est"; hdr <- NULL; next }
    if (grepl("^Fit Diagnostics:", ln))  { block <- "est"; hdr <- NULL; next }
    if (grepl("^MCMC diagnostics", ln))  { block <- "diag"; hdr <- NULL; next }
    if (grepl("^The mean_ppd", ln) || grepl("^For each parameter", ln)) { block <- NA_character_; next }
    if (is.na(block)) next
    if (!nzchar(trimws(ln))) next
    if (is.null(hdr)) { hdr <- strsplit(trimws(ln), "\\s+")[[1]]; next }
    toks <- strsplit(trimws(ln), "\\s+")[[1]]
    nums <- character(0)
    while (length(toks) && grepl("^[-+]?([0-9]+\\.?[0-9]*|\\.[0-9]+)([eE][-+]?[0-9]+)?$", toks[length(toks)])) {
      nums <- c(toks[length(toks)], nums); toks <- toks[-length(toks)]
    }
    if (!length(toks) || !length(nums)) next
    nm <- paste(toks, collapse = " ")
    vals <- as.numeric(nums)
    if (length(vals) != length(hdr)) next
    names(vals) <- hdr
    prev <- out[[nm]]
    out[[nm]] <- if (is.null(prev)) vals else c(prev, vals)
  }
  out
}

# Pull the expected numbers off the model object, rounded exactly the way the
# console rounded them -- but ONLY for the (parameter, column) pairs the console
# actually printed. The summary object carries more than the print method shows:
# log-posterior, for instance, has a mean in the object but appears only in the
# MCMC diagnostics table on screen. The tool decodes TEXT, so anything absent
# from the text must not be expected of it.
expected_params <- function(fit, txt) {
  s <- summary(fit)
  m <- as.matrix(s)
  cn <- colnames(m)
  rn <- rownames(m)
  fromtext <- parse_printed(txt)
  rows <- list()
  for (i in seq_along(rn)) {
    nm <- rn[i]
    tv <- fromtext[[nm]]
    if (is.null(tv)) next            # never printed -> not decodable
    rec <- list(name = nm)
    for (cj in cn) {
      if (!(cj %in% names(tv))) next # this column was not printed for this row
      v <- round(unname(m[i, cj]), PRINT_DIGITS)
      got <- unname(tv[[cj]][1])
      # prove the printed text agrees with the fitted object
      if (!isTRUE(all.equal(got, v, tolerance = 1e-9))) {
        stop(sprintf("TEXT/OBJECT MISMATCH for %s[%s]: text=%s object=%s", nm, cj, got, v))
      }
      key <- switch(cj, "mean" = "mean", "sd" = "sd", "10%" = "q10", "50%" = "q50",
                    "90%" = "q90", "mcse" = "mcse", "n_eff" = "n_eff", "Rhat" = "rhat", cj)
      rec[[key]] <- v
    }
    rows[[length(rows) + 1]] <- rec
  }
  rows
}

describe <- function(fit, txt, label, blurb, rcall, extra_text = "") {
  s <- summary(fit)
  full <- if (nzchar(extra_text)) paste0(txt, "\n", extra_text) else txt
  list(
    label = label,
    blurb = blurb,
    r_call = rcall,
    summary_text = full,
    expect = list(
      engine = "rstanarm",
      stan_function = as.character(attr(s, "stan_function")),
      # as printed: "gaussian [identity]" - family and link in one string, which
      # the parser is expected to split back into the two parts
      family_printed = as.character(attr(s, "family")),
      formula = paste(deparse(attr(s, "formula")), collapse = " "),
      nobs = as.integer(attr(s, "nobs")),
      sample = as.integer(attr(s, "posterior_sample_size")),
      print_digits = PRINT_DIGITS,
      params = expected_params(fit, txt)
    )
  )
}

presets <- list()

# ---------------------------------------------------------------- 1. gauss
cat("fitting gauss ...\n")
r1 <- fit_capturing(
  stan_glm(mpg ~ wt + hp, data = mtcars, chains = 4, iter = 2000, seed = 1234, refresh = 0)
)
t1 <- summary_text(r1$fit)
presets$gauss <- describe(
  r1$fit, t1,
  "Healthy linear model",
  "A well behaved gaussian fit: every Rhat sits at 1.00 and n_eff is in the thousands. This is what a trustworthy fit looks like.",
  'library(rstanarm)\nfit <- stan_glm(mpg ~ wt + hp, data = mtcars, seed = 1234)\nprint(summary(fit), digits = 3)'
)

# ---------------------------------------------------------------- 2. logit
# wells ships dist (metres); the rstanarm vignette rescales it to hundreds of
# metres before fitting, so dist100 is derived here the same way.
cat("fitting logit ...\n")
data(wells, package = "rstanarm")
wells$dist100 <- wells$dist / 100
r2 <- fit_capturing(
  stan_glm(switch ~ dist100 + arsenic, data = wells, family = binomial(link = "logit"),
           chains = 4, iter = 2000, seed = 4321, refresh = 0)
)
t2 <- summary_text(r2$fit)
presets$logit <- describe(
  r2$fit, t2,
  "Logistic regression",
  "The wells example from the rstanarm documentation. Coefficients are on the log-odds scale, so they need exponentiating before they mean anything.",
  'library(rstanarm)\ndata(wells)\nwells$dist100 <- wells$dist / 100\nfit <- stan_glm(switch ~ dist100 + arsenic, data = wells,\n                family = binomial(link = "logit"), seed = 4321)\nprint(summary(fit), digits = 3)'
)

# ---------------------------------------------------------------- 3. weak
cat("fitting weak (too few iterations, on purpose) ...\n")
r3 <- fit_capturing(
  stan_glm(mpg ~ wt + hp + disp + drat, data = mtcars, chains = 4, iter = 50,
           seed = 99, refresh = 0)
)
t3 <- summary_text(r3$fit)
presets$weak <- describe(
  r3$fit, t3,
  "Too few iterations",
  "The same kind of model run for 50 iterations instead of 2000. The Rhat and n_eff columns are what a fit you must not report looks like.",
  'library(rstanarm)\n# iter = 50 is deliberately far too short\nfit <- stan_glm(mpg ~ wt + hp + disp + drat, data = mtcars,\n                chains = 4, iter = 50, seed = 99)\nprint(summary(fit), digits = 3)',
  warning_block(r3$warnings)
)

# ---------------------------------------------------------------- 4. mlm
cat("fitting mlm ...\n")
r4 <- fit_capturing(
  stan_glmer(mpg ~ wt + (1 | cyl), data = mtcars, chains = 4, iter = 2000,
             seed = 2024, refresh = 0)
)
t4 <- summary_text(r4$fit)
presets$mlm <- describe(
  r4$fit, t4,
  "Multilevel model",
  "A varying intercept per cylinder count. Adds the b[] group offsets and the Sigma[] variance row that only multilevel output carries.",
  'library(rstanarm)\nfit <- stan_glmer(mpg ~ wt + (1 | cyl), data = mtcars, seed = 2024)\nprint(summary(fit), digits = 3)'
)

# ---------------------------------------------------------------- 5. diverge
cat("fitting diverge (low adapt_delta, on purpose) ...\n")
r5 <- fit_capturing(
  stan_glmer(mpg ~ wt + (1 | cyl), data = mtcars, chains = 2, iter = 800,
             seed = 5, refresh = 0, adapt_delta = 0.40)
)
t5 <- summary_text(r5$fit)
ndiv <- sum(sapply(rstan::get_sampler_params(r5$fit$stanfit, inc_warmup = FALSE),
                   function(z) sum(z[, "divergent__"])))
cat("  divergences:", ndiv, "\n")
presets$diverge <- describe(
  r5$fit, t5,
  "Divergent transitions",
  "The same multilevel model with adapt_delta dialled down to 0.40. The sampler genuinely diverges, and R's own warnings are pasted underneath the summary.",
  'library(rstanarm)\n# adapt_delta = 0.40 is deliberately far too low\nfit <- stan_glmer(mpg ~ wt + (1 | cyl), data = mtcars, chains = 2,\n                  iter = 800, seed = 5, adapt_delta = 0.40)\nprint(summary(fit), digits = 3)',
  warning_block(r5$warnings)
)
presets$diverge$expect$divergences <- as.integer(ndiv)

# ---------------------------------------------------------------- write

out <- list(
  meta = list(
    generated_by = "Scripts/tool-truth/bayesian-output-interpreter.R",
    r_version = R.version.string,
    rstanarm_version = as.character(packageVersion("rstanarm")),
    rstan_version = as.character(packageVersion("rstan")),
    stanheaders_version = as.character(packageVersion("StanHeaders")),
    print_digits = PRINT_DIGITS,
    note = paste("Every summary_text below is the verbatim console output of",
                 "print(summary(fit), digits = 3) on a model fitted by this script.",
                 "Expected values are read off the fitted model object and asserted",
                 "to equal the printed text.")
  ),
  presets = presets
)

writeLines(
  jsonlite::toJSON(out, auto_unbox = TRUE, pretty = TRUE, digits = NA),
  "Scripts/tool-truth/bayesian-output-interpreter.json"
)
cat("\nwrote Scripts/tool-truth/bayesian-output-interpreter.json\n")
cat("presets:", paste(names(presets), collapse = ", "), "\n")
