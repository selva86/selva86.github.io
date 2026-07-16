# box-plot-calculator.R - ground-truth for the box plot / five-number summary
# calculator. R 4.6.0. Emits Scripts/tool-truth/box-plot-calculator.json.
#
# The tool displays R type-7 quartiles (== quantile(x), summary(x), and
# ggplot2::geom_boxplot hinges) for the box and the five-number summary, with
# 1.5*IQR fences, whiskers reaching the most extreme point still inside the
# fence, and outliers beyond it. This mirrors boxplot.stats()'s WHISKER +
# OUTLIER conventions; the key claim we assert here is that the type-7 fence
# outlier set equals boxplot.stats(x)$out on every dataset. We also emit
# fivenum() and boxplot.stats()$stats/$out so the R code the tool prints can be
# reproduced and the note about Tukey hinges is honest.

options(digits = 17)

vec_stats <- function(x) {
  x  <- as.numeric(x)
  n  <- length(x)
  q  <- as.numeric(quantile(x, c(0, .25, .5, .75, 1), type = 7, names = FALSE))
  q1 <- q[2]; med <- q[3]; q3 <- q[4]
  iqr <- IQR(x, type = 7)                      # == q3 - q1
  flo <- q1 - 1.5 * iqr
  fhi <- q3 + 1.5 * iqr
  flo3 <- q1 - 3 * iqr
  fhi3 <- q3 + 3 * iqr
  out  <- sort(x[x < flo | x > fhi])           # 1.5*IQR fence outliers (type 7)
  inl  <- x[x >= flo & x <= fhi]               # non-outliers
  if (length(inl) == 0) { wlo <- min(x); whi <- max(x) }
  else                  { wlo <- min(inl); whi <- max(inl) }
  fv  <- as.numeric(fivenum(x))
  bs  <- boxplot.stats(x, coef = 1.5)
  # I() marks vector fields AsIs so jsonlite keeps them as JSON arrays even
  # when they have length 0 or 1 (auto_unbox would otherwise collapse them).
  list(
    x        = I(x),
    n        = n,
    min      = q[1],
    q1       = q1,
    median   = med,
    q3       = q3,
    max      = q[5],
    iqr      = iqr,
    fenceLo  = flo,
    fenceHi  = fhi,
    fence3Lo = flo3,
    fence3Hi = fhi3,
    outliers = I(out),
    whiskLo  = wlo,
    whiskHi  = whi,
    fivenum  = I(fv),
    bpstats  = I(as.numeric(bs$stats)),
    bpout    = I(sort(as.numeric(bs$out)))
  )
}

# --- single-vector datasets (incl. edge cases) --------------------------------
single <- list(
  exam        = c(55,62,68,70,71,73,74,75,77,79,82,88,42),      # one low outlier
  reaction    = c(0.42,0.45,0.47,0.48,0.50,0.51,0.53,0.55,0.58,0.62,1.40,3.20),
  sensor      = c(20.5,20.7,20.1,20.8,20.4,21.2,20.6,21.5,21.0,22.0,18.9,28.9),
  home_price  = c(210,225,231,240,255,262,270,289,310,980),      # big high outlier
  n4          = c(4, 8, 15, 16),                                 # minimum n
  n5_odd      = c(3, 7, 8, 5, 12),
  all_equal   = c(9, 9, 9, 9, 9, 9),                             # IQR = 0
  negatives   = c(-12, -8, -5, -3, 0, 2, 4, 9, -40),
  two_out     = c(1,2,3,4,5,6,7,8,9,10, -20, 40),                # low + high outlier
  decimals    = c(1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0,5.5),
  even_n      = c(11,13,14,16,18,19,21,24,25,28),
  many_ties   = c(2,2,2,3,3,3,3,4,4,4,10)
)

# --- grouped datasets (side-by-side comparison) -------------------------------
# iris Sepal.Length by Species is the canonical R grouped boxplot.
iris_grp <- split(iris$Sepal.Length, iris$Species)

classes <- list(
  `Method A` = c(78,82,85,88,90,91,93,95,84,86),
  `Method B` = c(70,74,76,79,81,83,85,88,72,55),   # 55 is a low outlier
  `Method C` = c(88,90,92,93,95,96,97,98,91,94)
)

grouped <- list(
  iris_sepal_length = list(
    setosa     = as.numeric(iris_grp[["setosa"]]),
    versicolor = as.numeric(iris_grp[["versicolor"]]),
    virginica  = as.numeric(iris_grp[["virginica"]])
  ),
  classrooms = classes
)

# --- assemble output ----------------------------------------------------------
single_cases <- lapply(names(single), function(nm) {
  s <- vec_stats(single[[nm]]); s$name <- nm; s$kind <- "single"; s
})

grouped_cases <- lapply(names(grouped), function(gnm) {
  g <- grouped[[gnm]]
  members <- lapply(names(g), function(mn) {
    s <- vec_stats(g[[mn]]); s$name <- mn; s
  })
  list(name = gnm, kind = "grouped", groups = members)
})

out <- list(single = single_cases, grouped = grouped_cases)

# jsonlite if present, else a tiny hand-rolled writer (keeps this dependency-free)
if (requireNamespace("jsonlite", quietly = TRUE)) {
  writeLines(jsonlite::toJSON(out, auto_unbox = TRUE, digits = 17, pretty = TRUE),
             "Scripts/tool-truth/box-plot-calculator.json")
} else {
  num <- function(v) {
    if (length(v) == 0) return("[]")
    if (length(v) == 1) return(formatC(v, format = "g", digits = 17))
    paste0("[", paste(vapply(v, function(z) formatC(z, format = "g", digits = 17), ""),
                      collapse = ","), "]")
  }
  esc <- function(s) gsub('"', '\\\\"', s)
  vec_json <- function(s) {
    fields <- c(
      sprintf('"name":"%s"', esc(s$name)),
      sprintf('"n":%d', s$n),
      sprintf('"x":%s', num(s$x)),
      sprintf('"min":%s', num(s$min)),
      sprintf('"q1":%s', num(s$q1)),
      sprintf('"median":%s', num(s$median)),
      sprintf('"q3":%s', num(s$q3)),
      sprintf('"max":%s', num(s$max)),
      sprintf('"iqr":%s', num(s$iqr)),
      sprintf('"fenceLo":%s', num(s$fenceLo)),
      sprintf('"fenceHi":%s', num(s$fenceHi)),
      sprintf('"fence3Lo":%s', num(s$fence3Lo)),
      sprintf('"fence3Hi":%s', num(s$fence3Hi)),
      sprintf('"outliers":%s', num(s$outliers)),
      sprintf('"whiskLo":%s', num(s$whiskLo)),
      sprintf('"whiskHi":%s', num(s$whiskHi)),
      sprintf('"fivenum":%s', num(s$fivenum)),
      sprintf('"bpstats":%s', num(s$bpstats)),
      sprintf('"bpout":%s', num(s$bpout))
    )
    paste0("{", paste(fields, collapse = ","), "}")
  }
  single_json <- paste(vapply(single_cases, vec_json, ""), collapse = ",")
  grouped_json <- paste(vapply(grouped_cases, function(g) {
    members <- paste(vapply(g$groups, vec_json, ""), collapse = ",")
    sprintf('{"name":"%s","kind":"grouped","groups":[%s]}', esc(g$name), members)
  }, ""), collapse = ",")
  json <- sprintf('{"single":[%s],"grouped":[%s]}', single_json, grouped_json)
  writeLines(json, "Scripts/tool-truth/box-plot-calculator.json")
}
cat("wrote Scripts/tool-truth/box-plot-calculator.json\n")
