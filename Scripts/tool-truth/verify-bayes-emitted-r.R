#  Run the R code the Bayesian Output Interpreter emits, exactly as emitted.
#
#  The page shows a "same reading, from the fit object in R" block. If that code
#  does not run, the page is handing the reader a line that errors. This script
#  executes every emitted block verbatim and fails loudly if any of it breaks.
#
#  Only the rstanarm presets are covered. brms compiles models with a C++ toolchain
#  that is not installed here, so its emitted code cannot be executed on this box;
#  the page's brms lines are the documented brms API and are not claimed to be
#  machine-verified.
#
#  Order:
#    node Scripts/tool-truth/extract-bayes-emitted-r.js http://localhost:8917
#    "C:/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/verify-bayes-emitted-r.R

suppressMessages(library(jsonlite))
suppressMessages(library(rstanarm))
options(mc.cores = 1)

blocks <- jsonlite::fromJSON("Scripts/tool-truth/bayes-emitted-r.json")$emitted
stopifnot(length(blocks) > 0)

# pp_check() and friends draw; send it to a temp device rather than the cwd
pdf(file.path(tempdir(), "emitted-r-plots.pdf"))
on.exit(dev.off(), add = TRUE)

fails <- character(0)
for (key in names(blocks)) {
  code <- blocks[[key]]
  cat("\n========================================\n")
  cat("preset:", key, "\n")
  cat("========================================\n")
  env <- new.env(parent = globalenv())
  res <- tryCatch({
    # parse() first: a syntax error should name the preset, not dump a stack
    exprs <- parse(text = code)
    for (e in exprs) {
      withCallingHandlers(
        eval(e, envir = env),
        warning = function(w) invokeRestart("muffleWarning")
      )
    }
    "ok"
  }, error = function(e) paste("ERROR:", conditionMessage(e)))

  if (!identical(res, "ok")) {
    cat("  FAILED:", res, "\n")
    fails <- c(fails, sprintf("%s: %s", key, res))
  } else {
    cat("  ran clean\n")
    # the block must actually have built a fit, not just parsed
    if (!exists("fit", envir = env, inherits = FALSE)) {
      fails <- c(fails, sprintf("%s: block ran but never created `fit`", key))
      cat("  FAILED: no `fit` object created\n")
    }
  }
}

cat("\n\n")
if (length(fails)) {
  cat("EMITTED R FAILED for", length(fails), "of", length(blocks), "presets:\n")
  for (f in fails) cat("  -", f, "\n")
  quit(status = 1)
}
cat("Emitted R runs clean for all", length(blocks), "rstanarm presets.\n")
