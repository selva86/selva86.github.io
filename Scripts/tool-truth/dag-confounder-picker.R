#!/usr/bin/env Rscript
# Truth table for the DAG Confounder Picker tool.
# Ground truth = dagitty::adjustmentSets() (minimal + all) and descendants().
# We verify the tool's minimal adjustment sets against dagitty's minimal sets;
# these coincide with Pearl's back-door criterion for the canonical DAGs below.
suppressWarnings(suppressMessages(library(dagitty)))

# ---- JSON helpers (manual, no jsonlite dependency) --------------------------
jstr <- function(s) paste0('"', gsub('"', '\\\\"', s), '"')
# a "set" -> sorted JSON array of strings
set_to_json <- function(v) {
  v <- sort(as.character(v))
  if (length(v) == 0) return('[]')
  paste0('[', paste(vapply(v, jstr, ''), collapse = ','), ']')
}
# list-of-sets -> JSON array of arrays, canonically ordered (by size then content)
sets_to_json <- function(sets) {
  if (length(sets) == 0) return('[]')
  arrs <- lapply(sets, function(s) sort(as.character(s)))
  keys <- vapply(arrs, function(a) paste0(sprintf('%03d', length(a)), '|', paste(a, collapse = ',')), '')
  arrs <- arrs[order(keys)]
  paste0('[', paste(vapply(arrs, set_to_json, ''), collapse = ','), ']')
}

# ---- Build one truth record --------------------------------------------------
# edges: character vector like c("Z -> X","Z -> Y","X -> Y")
record <- function(name, edges, X, Y) {
  body <- paste(edges, collapse = '; ')
  spec <- sprintf('dag { %s [exposure]; %s [outcome]; %s }', X, Y, body)
  g <- dagitty(spec)
  minimal <- adjustmentSets(g, exposure = X, outcome = Y, type = 'minimal', effect = 'total')
  allsets <- adjustmentSets(g, exposure = X, outcome = Y, type = 'all',     effect = 'total')
  # strict descendants of X (dagitty includes the node itself -> drop it)
  descX <- setdiff(descendants(g, X), X)
  min_l <- lapply(minimal, function(s) as.character(s))
  all_l <- lapply(allsets, function(s) as.character(s))
  paste0(
    '{',
    '"name":', jstr(name), ',',
    '"X":', jstr(X), ',',
    '"Y":', jstr(Y), ',',
    '"edges":[', paste(vapply(edges, jstr, ''), collapse = ','), '],',
    '"minimal":', sets_to_json(min_l), ',',
    '"all":', sets_to_json(all_l), ',',
    '"descendantsX":', set_to_json(descX),
    '}'
  )
}

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- record(...)

# 1. Classic confounder: Z -> X, Z -> Y, X -> Y ; minimal {Z}
add('confounder', c('Z -> X','Z -> Y','X -> Y'), 'X', 'Y')
# 2. Collider trap: X -> M, Y -> M ; minimal {} (path blocked at collider)
add('collider', c('X -> M','Y -> M'), 'X', 'Y')
# 3. Instrumental variable: Z -> X, X -> Y ; minimal {}
add('iv', c('Z -> X','X -> Y'), 'X', 'Y')
# 4. Pure mediator: X -> M, M -> Y ; minimal {} for total effect
add('mediator', c('X -> M','M -> Y'), 'X', 'Y')
# 5. M-bias: Z1 -> X, Z1 -> M, Z2 -> Y, Z2 -> M ; minimal {}
add('mbias', c('Z1 -> X','Z1 -> M','Z2 -> Y','Z2 -> M'), 'X', 'Y')
# 6. Direct chain only: X -> Y ; minimal {}
add('direct', c('X -> Y'), 'X', 'Y')
# 7. Butterfly: confounder + collider on same nodes (Z conf, M collider)
add('confounder-plus-collider', c('Z -> X','Z -> Y','X -> Y','X -> M','Y -> M'), 'X', 'Y')
# 8. Two independent confounders: Z1 -> X/Y, Z2 -> X/Y ; minimal {Z1,Z2}
add('two-confounder', c('Z1 -> X','Z1 -> Y','Z2 -> X','Z2 -> Y','X -> Y'), 'X', 'Y')
# 9. Confounder OR its proxy (alternative minimal sets): A -> X, A -> Y, A -> B, B is not needed
add('mediator-with-descendant', c('X -> M','M -> Y','M -> D'), 'X', 'Y')
# 10. Diamond: Z -> X, Z -> W, W -> Y, X -> Y ; backdoor X<-Z->W->Y ; minimal {Z} or {W}
add('diamond', c('Z -> X','Z -> W','W -> Y','X -> Y'), 'X', 'Y')
# 11. No causal path (Y -> X only) ; minimal {} but no causal path
add('no-path', c('Y -> X'), 'X', 'Y')
# 12. Confounder with mediator: Z conf + M mediator ; minimal {Z}
add('confounder-and-mediator', c('Z -> X','Z -> Y','X -> M','M -> Y'), 'X', 'Y')

out <- paste0('[', paste(unlist(cases), collapse = ',\n'), ']')
writeLines(out, 'Scripts/tool-truth/dag-confounder-picker.json')
cat('Wrote', length(cases), 'DAG truth records.\n')
# echo minimal sets for eyeballing
for (i in seq_along(cases)) {
  g <- cases[[i]]
  nm <- sub('.*"name":"([^"]*)".*', '\\1', g)
  mn <- sub('.*"minimal":(\\[[^]]*\\]|\\[.*?\\]\\]),"all".*', '\\1', g)
  cat(sprintf('  %-26s minimal=%s\n', nm, regmatches(g, regexpr('"minimal":.*?,"all"', g))))
}
