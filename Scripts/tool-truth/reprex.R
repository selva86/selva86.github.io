# reprex.R - R truth fixture for the Reprex Builder tool (R 4.6.0)
# Two jobs:
#   1. Lock the venue-wrapping conventions of reprex::reprex() (fences, #> prefix)
#      so the JS formatter can be asserted against the genuine package output.
#   2. Verify that every scenario's embedded #> output line is REAL R output
#      (the tool teaches reprex; it must never ship fabricated console output).
# Emits Scripts/tool-truth/reprex.json

suppressWarnings <- function(x) suppressWarnings(x)
suppressMessages(library(reprex))
options(warn = -1)

`%||%` <- function(a, b) if (is.null(a)) b else a

# ------------------------------------------------------------------
# 1. Venue conventions, captured from the real reprex 2.1.1 output.
# ------------------------------------------------------------------
probe <- c("x <- c(1, 2, 3, NA, 5)", "mean(x)", "mean(x, na.rm = TRUE)")
cap_venue <- function(v) {
  out <- reprex(input = probe, venue = v, advertise = FALSE, html_preview = FALSE)
  paste(out, collapse = "\n")
}
venues <- list()
for (v in c("gh", "r", "html", "slack")) {
  txt <- tryCatch(cap_venue(v), error = function(e) paste("ERROR:", conditionMessage(e)))
  venues[[v]] <- txt
  cat("=====VENUE ", v, "=====\n", txt, "\n\n", sep = "")
}

# ------------------------------------------------------------------
# 2. Scenario output verification. Each entry: run `code` in the stated
#    session state, capture the REAL console output/error, and record it.
#    The tool's embedded #> lines must match these.
# ------------------------------------------------------------------
run_capture <- function(expr_text, libs = character(0)) {
  # Fresh-ish evaluation environment; optionally attach libs first.
  env <- new.env(parent = globalenv())
  for (lb in libs) suppressMessages(suppressWarnings(
    tryCatch(library(lb, character.only = TRUE), error = function(e) NULL)))
  out <- tryCatch(
    capture.output(eval(parse(text = expr_text), envir = env)),
    error = function(e) paste("Error:", conditionMessage(e)),
    warning = function(w) paste("Warning:", conditionMessage(w)))
  paste(out, collapse = "\n")
}

scen <- list()

# minimal: mean of a vector with NA
scen$minimal <- run_capture("x <- c(1, 2, 3, NA, 5)\nmean(x)")
scen$minimal_narm <- run_capture("mean(c(1, 2, 3, NA, 5), na.rm = TRUE)")

# dplyr pipe with NO library loaded -> pipe not found
scen$dplyr_nolib <- run_capture("iris %>% head()")

# customdata: object not found
scen$customdata <- run_capture("sales_2024 |> head()")

# conflict: MASS::select masks dplyr::select (dplyr loaded first, MASS after)
# emulate by attaching in that order and calling select with dplyr semantics
conflict_err <- tryCatch({
  suppressMessages(library(dplyr))
  suppressMessages(library(MASS))
  capture.output(head(dplyr::select(mtcars, mpg, wt, hp)))  # explicit for truth
  # the masked call (bare select) is what the scenario shows failing:
  capture.output(mtcars |> select(mpg, wt, hp) |> head())
}, error = function(e) paste("Error:", conditionMessage(e)))
scen$conflict <- paste(conflict_err, collapse = "\n")
# unload to avoid contaminating later runs
try(detach("package:MASS", unload = TRUE), silent = TRUE)

# customfn: standardize() with an NA in the vector -> all NA (sd() propagates NA)
scen$customfn <- run_capture(paste(
  "standardize <- function(x){ (x - mean(x)) / sd(x) }",
  "set.seed(1)",
  "samples <- rnorm(20, mean = 5, sd = 2)",
  "samples[3] <- NA",
  "standardize(samples)", sep = "\n"))

# plot: ggplot continuous value on discrete brewer scale -> error on build
plot_err <- tryCatch({
  suppressMessages(library(ggplot2))
  p <- ggplot(mtcars, aes(wt, mpg, color = cyl)) +
    geom_point(size = 3) + scale_color_brewer(palette = "Set1")
  capture.output(print(p))
  "PRINTED_OK"
}, error = function(e) paste("Error:", conditionMessage(e)))
scen$plot <- paste(plot_err, collapse = "\n")

for (nm in names(scen)) cat("=====SCEN ", nm, "=====\n", scen[[nm]], "\n\n", sep = "")

# ------------------------------------------------------------------
# 3. Emit JSON fixture
# ------------------------------------------------------------------
if (requireNamespace("jsonlite", quietly = TRUE)) {
  fixture <- list(
    reprex_version = as.character(packageVersion("reprex")),
    r_version = paste(R.version$major, R.version$minor, sep = "."),
    venues = venues,
    scenario_outputs = scen
  )
  jsonlite::write_json(fixture, "Scripts/tool-truth/reprex.json",
                       auto_unbox = TRUE, pretty = TRUE)
  cat("WROTE Scripts/tool-truth/reprex.json\n")
} else {
  cat("jsonlite not available; JSON not written\n")
}
