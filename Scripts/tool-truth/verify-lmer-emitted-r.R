# Runs the R code the page EMITS, verbatim, and checks it reproduces what the
# page DISPLAYS. Rubric item 6: "the emitted R code actually runs in R and
# reproduces the displayed result".
#
# The blocks are executed exactly as captured from the rendered page (no edits,
# no print() injection) in a fresh environment each time.
options(width = 80, digits = 7)
suppressMessages({ library(jsonlite) })

emitted <- fromJSON("Scripts/tool-truth/lmer-emitted-r.json", simplifyVector = FALSE)
fails <- 0; checks <- 0

for (key in names(emitted)) {
  code <- emitted[[key]]$rcode
  shown_icc <- suppressWarnings(as.numeric(emitted[[key]]$icc))
  cat("\n=========================== ", key, " ===========================\n", sep = "")

  # Each block runs in its OWN R process. Sourcing them into one session let an
  # earlier block's library(lmerTest) stay attached and mask lme4::lmer, so the
  # random-slope block silently fitted a lmerModLmerTest. Separate processes make
  # each block prove it stands alone, exactly as a reader pasting it would.
  tmp <- tempfile(fileext = ".R")
  rds <- tempfile(fileext = ".rds")
  writeLines(c(code, sprintf('saveRDS(m, %s)', deparse(rds))), tmp)
  out <- suppressWarnings(system2(file.path(R.home("bin"), "Rscript"),
                                  c("--vanilla", shQuote(tmp)),
                                  stdout = TRUE, stderr = TRUE))
  status <- attr(out, "status")
  checks <- checks + 1
  if (!is.null(status) && status != 0) {
    cat("  RUN: FAIL - block exited ", status, "\n", sep = "")
    cat("       ", paste(utils::tail(out, 3), collapse = "\n       "), "\n", sep = "")
    fails <- fails + 1; next
  }
  cat("  RUN: the emitted block executes cleanly in a fresh R process\n")

  # the model the block built must be a real merMod
  m <- readRDS(rds)
  checks <- checks + 1
  if (!inherits(m, "merMod")) { cat("  MODEL: FAIL - not a merMod\n"); fails <- fails + 1; next }
  cat("  MODEL: ", class(m)[1], " fitted\n", sep = "")

  # performance::icc(m), which the block invites the reader to run
  ic <- suppressMessages(performance::icc(m))
  adj <- as.numeric(ic$ICC_adjusted)
  is_slope <- nrow(as.data.frame(lme4::VarCorr(m))) > 2 &&
              any(!is.na(as.data.frame(lme4::VarCorr(m))$var2))
  checks <- checks + 1
  if (is_slope) {
    # The page shows the AT-ZERO icc here and says so; performance::icc must
    # differ. That divergence is the claim under test.
    caveat_shown <- grepl("x = 0", emitted[[key]]$k1, fixed = TRUE)
    diverges <- abs(shown_icc - adj) > 0.05
    if (caveat_shown && diverges) {
      cat("  ICC: page shows ", shown_icc, " (labelled at x=0); performance::icc = ",
          round(adj, 4), " -- divergence expected and labelled: OK\n", sep = "")
    } else {
      cat("  ICC: FAIL - slope model must be labelled at x=0 and differ from performance::icc\n")
      fails <- fails + 1
    }
  } else {
    d <- abs(shown_icc - adj)
    if (d < 5e-4) {
      cat("  ICC: page ", shown_icc, " vs performance::icc ", round(adj, 6),
          "  diff ", format(d, scientific = TRUE, digits = 2), ": OK\n", sep = "")
    } else {
      cat("  ICC: FAIL - page ", shown_icc, " vs performance::icc ", adj, "\n", sep = "")
      fails <- fails + 1
    }
  }

  # confint(method="Wald") is emitted; confirm it runs and is finite for the
  # fixed effects (the intervals the page prints)
  checks <- checks + 1
  ci <- tryCatch(suppressMessages(suppressWarnings(confint(m, method = "Wald"))),
                 error = function(e) NULL)
  fe <- rownames(coef(summary(m)))
  if (!is.null(ci) && all(fe %in% rownames(ci)) && all(is.finite(ci[fe, ]))) {
    cat("  WALD: confint(m, method=\"Wald\") returns finite intervals for all ",
        length(fe), " fixed effects\n", sep = "")
  } else {
    cat("  WALD: FAIL\n"); fails <- fails + 1
  }
}

cat("\n---------------------------------------------\n")
cat("emitted-R checks: ", checks, "  failures: ", fails, "\n", sep = "")
if (fails > 0) quit(status = 1)
