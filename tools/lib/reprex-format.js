/* reprex-format.js - reproducible-example cleaner, linter and venue-wrapper
   for Tool Farm v2 (tools/reprex-builder.html).

   This engine does NOT run R. It is a pre-flight cleaner: it hoists library()
   calls, pins the seed, optionally appends sessionInfo(), re-prefixes any
   console output the user pasted as reprex-style #> comments, wraps the result
   for the target venue, and lints the code for the reproducibility problems
   that get questions closed (local file reads, network calls, undefined data,
   missing seed, missing library). To capture REAL interleaved output the user
   still runs reprex::reprex() (the tool shows the exact call).

   Venue-wrapping conventions and the #> comment prefix are locked to the real
   reprex 2.1.1 output, captured in Scripts/tool-truth/reprex.json and asserted
   by Scripts/tool-truth/test-reprex-math.js. Every SCENARIO's embedded #>
   output line is genuine R 4.6.0 console output (also asserted against that
   fixture). Pure: no DOM, no globals beyond the exported namespace.

   reprex venue reference: "so" (Stack Overflow) is an alias for "gh"; the
   GitHub venue emits "``` r" fences, "r" emits a bare script, "slack" uses
   unlabelled "```" fences, "html" a <pre class="r"><code> block. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.ReprexFormat = api;
    ['buildReprex', 'buildLints', 'detectLibraries', 'detectAssignments',
     'detectUndefinedRefs', 'detectFileOps', 'detectNetworkOps', 'detectPlots',
     'detectRandomCalls', 'hasSetSeed', 'hasSessionInfo'].forEach(function (k) {
      if (typeof root[k] === 'undefined') root[k] = api[k];
    });
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  // ----------------------------------------------------------------
  // Vocabulary: base-R / common symbols we never flag as undefined data.
  // ----------------------------------------------------------------
  var R_KEYWORDS = ['if', 'else', 'for', 'while', 'repeat', 'function', 'return',
    'break', 'next', 'in', 'TRUE', 'FALSE', 'NULL', 'NA', 'NA_integer_',
    'NA_real_', 'NA_character_', 'Inf', 'NaN'];

  var BUILTIN_DATASETS = ['mtcars', 'iris', 'airquality', 'ToothGrowth',
    'ChickWeight', 'InsectSprays', 'PlantGrowth', 'sleep', 'women', 'co2',
    'presidents', 'UScereal', 'Titanic', 'Orange', 'BOD', 'OrchardSprays',
    'swiss', 'HairEyeColor', 'quakes', 'rivers', 'trees', 'cars', 'faithful',
    'Nile', 'LifeCycleSavings', 'pressure', 'WorldPhones', 'warpbreaks',
    'Loblolly', 'Indometh', 'Theoph', 'Puromycin', 'EuStockMarkets',
    'UKLungDeaths', 'UKgas', 'USAccDeaths', 'UKDriverDeaths', 'diamonds',
    'economics', 'mpg', 'msleep', 'storms', 'txhousing'];

  var R_SYMBOLS = new Set(R_KEYWORDS.concat(['c', 'list', 'seq', 'seq_len',
    'seq_along', 'rep', 'sum', 'mean', 'median', 'var', 'sd', 'min', 'max',
    'length', 'range', 'quantile', 'abs', 'sqrt', 'exp', 'log', 'log2', 'log10',
    'round', 'signif', 'floor', 'ceiling', 'trunc', 'print', 'cat', 'paste',
    'paste0', 'sprintf', 'format', 'formatC', 'as.numeric', 'as.integer',
    'as.character', 'as.factor', 'as.logical', 'as.Date', 'as.POSIXct',
    'is.na', 'is.null', 'is.numeric', 'is.character', 'head', 'tail', 'nrow',
    'ncol', 'NROW', 'NCOL', 'dim', 'names', 'colnames', 'rownames', 'rbind',
    'cbind', 'data.frame', 'matrix', 'array', 'factor', 'levels', 'nlevels',
    'table', 'prop.table', 'tapply', 'sapply', 'lapply', 'vapply', 'mapply',
    'apply', 'Reduce', 'Map', 'Filter', 'Find', 'Position', 'do.call',
    'match.arg', 'match.call', 'library', 'require', 'suppressWarnings',
    'suppressMessages', 'message', 'warning', 'stop', 'stopifnot', 'tryCatch',
    'try', 'withCallingHandlers', 'invisible', 'set.seed', 'Sys.time',
    'Sys.Date', 'Sys.getenv', 'Sys.sleep', 'options', 'getOption', 'par',
    'plot', 'points', 'lines', 'abline', 'hist', 'boxplot', 'barplot', 'pie',
    'image', 'contour', 'curve', 'legend', 'title', 'axis', 'text', 'mtext',
    'grid', 'dev.off', 'png', 'pdf', 'svg', 'jpeg', 'sessionInfo',
    'sessioninfo', 'Sys.setlocale', 'Sys.setenv', 'readLines', 'writeLines',
    'file', 'close', 'formals', 'body', 'args', 'environment', 'globalenv',
    'emptyenv', 'baseenv', 'parent.frame', 'sys.call', 'sys.function',
    'setNames', 'structure', 'attr', 'attributes', 'class', 'unclass',
    'inherits', 'typeof', 'mode', 'storage.mode', 'exists', 'get', 'assign',
    'rm', 'ls', 'search', 'requireNamespace', 'loadNamespace',
    'attachNamespace', 'sample', 'sample.int', 'rnorm', 'runif', 'rbinom',
    'rpois', 'rexp', 'rgamma', 'rbeta', 'rchisq', 'rt', 'rf', 'dnorm', 'dunif',
    'dbinom', 'dpois', 'pnorm', 'punif', 'pbinom', 'ppois', 'qnorm', 'qunif',
    'qbinom', 'qpois', 'lm', 'glm', 'aov', 'anova', 'summary', 'coef',
    'coefficients', 'residuals', 'resid', 'fitted', 'predict', 'confint',
    'vcov', 'model.matrix', 'model.frame', 'update', 'step', 'AIC', 'BIC',
    'logLik', 'deviance', 'formula', 'terms', 'offset', 'weights', 'optim',
    'optimize', 'uniroot', 'integrate', 'solve', 'det', 'diag', 'crossprod',
    'tcrossprod', 't', 'outer', 'kronecker', 'svd', 'qr', 'eigen', 'chol',
    'expand.grid', 'complete.cases', 'na.omit', 'na.exclude', 'na.fail',
    'reshape', 'aggregate', 'merge', 'split', 'unsplit', 'order', 'rank',
    'sort', 'unique', 'duplicated', 'intersect', 'union', 'setdiff', 'which',
    'which.max', 'which.min', 'any', 'all', 'xor', 'identical', 'all.equal',
    'isTRUE', 'isFALSE', 'interaction', 'rev', 'cumsum', 'cumprod', 'cummax',
    'cummin', 'diff', 'prod', 'Recall', 'UseMethod', 'NextMethod', 'nchar',
    'substr', 'substring', 'strsplit', 'sub', 'gsub', 'grepl', 'grep', 'regmatches',
    'gregexpr', 'toupper', 'tolower', 'trimws', 'startsWith', 'endsWith',
    'TRUE', 'FALSE', 'NA', 'NULL', 'Inf', 'NaN', 'T', 'F', 'pi', 'letters',
    'LETTERS', 'month.name', 'month.abb', 'Vectorize', 'Negate', 'identity',
    'ifelse', 'switch', 'on.exit', 'do', 'with', 'within']));

  // ----------------------------------------------------------------
  // Detection primitives (regex tokenizer, not a full R AST).
  // ----------------------------------------------------------------
  function detectLibraries(code) {
    var out = [], re = /\b(library|require|requireNamespace)\s*\(\s*["']?([A-Za-z_.][A-Za-z_.0-9]*)["']?/g, m;
    while ((m = re.exec(code)) !== null) out.push({ fn: m[1], pkg: m[2] });
    return out;
  }

  function detectAssignments(code) {
    var out = new Set(), m;
    var re = /(?:^|[\n;{(])\s*([A-Za-z_.][A-Za-z_.0-9]*)\s*(?:<<-|<-|=)\s*(?!=)/g;
    while ((m = re.exec(code)) !== null) out.add(m[1]);
    var re2 = /\bfor\s*\(\s*([A-Za-z_.][A-Za-z_.0-9]*)\s+in\b/g;
    while ((m = re2.exec(code)) !== null) out.add(m[1]);
    var re3 = /\bfunction\s*\(([^)]*)\)/g;
    while ((m = re3.exec(code)) !== null) {
      m[1].split(',').forEach(function (a) {
        var an = a.trim().split('=')[0].trim();
        if (/^[A-Za-z_.][A-Za-z_.0-9]*$/.test(an)) out.add(an);
      });
    }
    // right-assign: value -> name
    var re4 = /(?:->>|->)\s*([A-Za-z_.][A-Za-z_.0-9]*)/g;
    while ((m = re4.exec(code)) !== null) out.add(m[1]);
    return out;
  }

  function detectUndefinedRefs(code) {
    // Mask strings + comments, mask NSE-verb interiors (column names), mask the
    // package half of ns-qualified calls, then any surviving bare identifier
    // that is not base-R, not a builtin dataset, not assigned, and not a call
    // is a candidate undefined data reference.
    var NSE_VERBS = ['filter', 'mutate', 'select', 'arrange', 'group_by',
      'summarise', 'summarize', 'transmute', 'rename', 'count', 'distinct',
      'slice', 'pull', 'aes', 'aes_string', 'vars', 'across', 'case_when',
      'if_else', 'recode', 'tally', 'top_n', 'with', 'within', 'subset',
      'library', 'require', 'requireNamespace', 'loadNamespace',
      'attachNamespace', 'suppressPackageStartupMessages'];
    var masked = code
      .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, function (m) { return ' '.repeat(m.length); })
      .replace(/#[^\n]*/g, function (m) { return ' '.repeat(m.length); });
    masked = masked.replace(/\b([A-Za-z_][A-Za-z0-9_.]*):{2,3}/g, function (m, pkg) {
      return ' '.repeat(pkg.length) + m.slice(pkg.length);
    });
    NSE_VERBS.forEach(function (v) {
      var re = new RegExp('\\b' + v + '\\s*\\(', 'g'), m;
      while ((m = re.exec(masked)) !== null) {
        var depth = 1, i = m.index + m[0].length;
        while (i < masked.length && depth > 0) {
          var ch = masked.charAt(i);
          if (ch === '(') depth++; else if (ch === ')') depth--;
          i++;
        }
        var interiorEnd = i - 1, interiorStart = m.index + m[0].length;
        masked = masked.slice(0, interiorStart) +
          ' '.repeat(Math.max(0, interiorEnd - interiorStart)) +
          masked.slice(interiorEnd);
      }
    });
    var assigned = detectAssignments(code);
    var ids = [], re = /[A-Za-z_.][A-Za-z_.0-9]*/g, mm;
    while ((mm = re.exec(masked)) !== null) ids.push({ name: mm[0], pos: mm.index });
    var seen = new Set(), undef = [];
    ids.forEach(function (id) {
      var n = id.name;
      if (seen.has(n)) return;
      if (R_SYMBOLS.has(n)) return;
      if (BUILTIN_DATASETS.indexOf(n) >= 0) return;
      if (assigned.has(n)) return;
      if (/^[A-Z][A-Z_]*$/.test(n) && n.length > 1) return; // CONSTANTS
      var next = masked.charAt(id.pos + n.length);
      if (next === '(') return;                              // a function call
      var prev = id.pos > 0 ? masked.charAt(id.pos - 1) : '';
      if (prev === '$' || prev === '@' || prev === ':') return;
      var j = id.pos + n.length;
      while (j < masked.length && masked.charAt(j) === ' ') j++;
      if (masked.charAt(j) === '=' && masked.charAt(j + 1) !== '=') return; // named arg
      if (n.length === 1) return;
      seen.add(n);
      undef.push(n);
    });
    return undef;
  }

  function detectFileOps(code) {
    var out = [], patterns = [
      { re: /\bread\.csv2?\s*\(/, fn: 'read.csv' },
      { re: /\bread\.table\s*\(/, fn: 'read.table' },
      { re: /\bread\.delim\s*\(/, fn: 'read.delim' },
      { re: /\bread_csv2?\s*\(/, fn: 'read_csv' },
      { re: /\bread_tsv\s*\(/, fn: 'read_tsv' },
      { re: /\bread_excel\s*\(/, fn: 'read_excel' },
      { re: /\bread_xlsx?\s*\(/, fn: 'read_xlsx' },
      { re: /\bfread\s*\(/, fn: 'fread' },
      { re: /\bload\s*\(/, fn: 'load' },
      { re: /\breadRDS\s*\(/, fn: 'readRDS' },
      { re: /\bsource\s*\(/, fn: 'source' }
    ];
    var seen = new Set();
    patterns.forEach(function (p) { if (p.re.test(code) && !seen.has(p.fn)) { seen.add(p.fn); out.push(p.fn); } });
    return out;
  }

  function detectNetworkOps(code) {
    var out = [], patterns = [
      { re: /\bdownload\.file\s*\(/, fn: 'download.file' },
      { re: /\bhttr::?GET\s*\(/, fn: 'httr::GET' },
      { re: /\bhttr2::/, fn: 'httr2' },
      { re: /\burl\s*\(/, fn: 'url' },
      { re: /\bcurl::/, fn: 'curl' }
    ];
    patterns.forEach(function (p) { if (p.re.test(code)) out.push(p.fn); });
    return out;
  }

  function detectPlots(code) {
    var out = [], patterns = ['plot', 'ggplot', 'boxplot', 'hist', 'barplot',
      'pie', 'image', 'contour', 'curve', 'autoplot', 'qplot', 'ggsave'];
    patterns.forEach(function (fn) {
      var re = new RegExp('\\b' + fn.replace(/\./g, '\\.') + '\\s*\\(');
      if (re.test(code)) out.push(fn);
    });
    return out;
  }

  function detectRandomCalls(code) {
    var out = [], fns = ['sample', 'rnorm', 'runif', 'rbinom', 'rpois', 'rexp',
      'rgamma', 'rbeta', 'rchisq', 'rt', 'rf', 'rmultinom', 'rgeom', 'rhyper',
      'rweibull', 'rlogis', 'rcauchy', 'rnbinom', 'kmeans', 'randomForest'];
    fns.forEach(function (fn) {
      var re = new RegExp('\\b' + fn + '\\s*\\(');
      if (re.test(code)) out.push(fn);
    });
    return out;
  }

  function hasSetSeed(code) { return /\bset\.seed\s*\(/.test(code); }
  function hasSessionInfo(code) { return /\b(sessionInfo|session_info)\s*\(/.test(code); }

  // ----------------------------------------------------------------
  // Venue registry - locked to reprex 2.1.1 output (see reprex.json).
  //   "so" (Stack Overflow) is an alias for "gh" in reprex >= 2.0.
  // ----------------------------------------------------------------
  var VENUES = {
    gh:    { label: 'GitHub / Stack Overflow', open: '``` r', close: '```', escape: false },
    r:     { label: 'Plain R script',          open: '',       close: '',    escape: false },
    slack: { label: 'Slack',                   open: '```',    close: '```', escape: false },
    html:  { label: 'HTML',                    open: '<pre class="r"><code>', close: '</code></pre>', escape: true }
  };
  var COMMENT = '#> ';

  // ----------------------------------------------------------------
  // buildReprex: clean + wrap the pasted code per the active options.
  //   opts: { venue:'gh'|'r'|'slack'|'html', sessionInfo, commentsOut,
  //           seed, seedVal }
  // Returns the formatted reprex string (fences included per venue).
  // ----------------------------------------------------------------
  function buildReprex(rawCode, opts) {
    opts = opts || {};
    var venueKey = VENUES[opts.venue] ? opts.venue : 'gh';
    var venue = VENUES[venueKey];

    var code = (rawCode || '')
      .replace(/\r\n/g, '\n')
      .replace(/[—–]/g, '-'); // em/en dash -> hyphen
    code = code.split('\n').map(function (l) { return l.replace(/[\t ]+$/, ''); }).join('\n');

    // Hoist library()/require() to the top, de-duplicated, in first-seen order.
    var libs = detectLibraries(code), seenPkgs = new Set(), libBlock = [];
    libs.forEach(function (l) {
      if (l.fn === 'requireNamespace') return; // leave in place; not a load
      if (seenPkgs.has(l.pkg)) return;
      seenPkgs.add(l.pkg);
      libBlock.push('library(' + l.pkg + ')');
    });
    var bodyLines = code.split('\n').filter(function (line) {
      return !/^\s*(library|require)\s*\(/.test(line);
    });
    var body = bodyLines.join('\n').replace(/^\s*\n+/, '');

    if (opts.seed) body = body.replace(/^[ \t]*set\.seed\s*\([^)]*\)[ \t]*\n?/gm, '');

    var pieces = [];
    if (libBlock.length) { pieces.push(libBlock.join('\n')); pieces.push(''); }
    if (opts.seed) { pieces.push('set.seed(' + (parseInt(opts.seedVal, 10) || 42) + ')'); pieces.push(''); }
    if (body.trim()) pieces.push(body.replace(/\s+$/, ''));

    var assembled = pieces.join('\n');

    // Re-prefix pasted console output as reprex-style #> comments. We cannot run
    // the code, so we only touch lines that already LOOK like console output.
    if (opts.commentsOut) {
      assembled = assembled.split('\n').map(function (l) {
        if (/^\s*#>/.test(l)) return l;                        // already commented
        if (/^\s*\[\d+\]/.test(l)) return l.replace(/^(\s*)/, '$1' + COMMENT);
        if (/^\s*(Error|Warning|Message)\b/.test(l)) return COMMENT + l.replace(/^\s*/, '');
        return l;
      }).join('\n');
    }

    if (opts.sessionInfo && !hasSessionInfo(assembled)) {
      assembled = assembled.replace(/\s+$/, '') + '\n\nsessionInfo()';
    }

    assembled = assembled.replace(/\s+$/, '');

    // Wrap per venue.
    if (venue.escape) {
      return venue.open + escapeHtml(assembled) + venue.close;
    }
    if (venue.open) {
      return venue.open + '\n' + assembled + '\n' + venue.close;
    }
    return assembled; // plain R script, no fence
  }

  // ----------------------------------------------------------------
  // Lints: the reproducibility problems that get questions closed.
  //   Returns [{ level:'danger'|'warn'|'info'|'ok', tag, msg, hint }]
  //   msg/hint may contain safe <code> markup; user tokens are escaped.
  // ----------------------------------------------------------------
  function buildLints(rawCode, opts) {
    opts = opts || {};
    var lints = [];
    if (!rawCode || !rawCode.trim()) return lints;

    var libs = detectLibraries(rawCode);
    var undef = detectUndefinedRefs(rawCode);
    var fileOps = detectFileOps(rawCode);
    var netOps = detectNetworkOps(rawCode);
    var plots = detectPlots(rawCode);
    var randoms = detectRandomCalls(rawCode);
    var hasSeed = hasSetSeed(rawCode);
    var hasSI = hasSessionInfo(rawCode);

    undef.forEach(function (name) {
      lints.push({
        level: opts.builtinOnly ? 'danger' : 'warn', tag: 'data',
        msg: 'References <code>' + escapeHtml(name) + '</code> but no <code>dput()</code> or assignment is present.',
        hint: 'In your real session run <code>dput(head(' + escapeHtml(name) + ', 6))</code>, then paste the output here as an assignment. Six rows is usually enough to reproduce anything that is not a sample-size issue.'
      });
    });

    fileOps.forEach(function (fn) {
      lints.push({
        level: 'warn', tag: 'file',
        msg: 'Uses <code>' + escapeHtml(fn) + '()</code>. The helper does not have your file, so this line will not run for them.',
        hint: 'Inline the data with <code>dput()</code>, or switch to a built-in dataset like <code>mtcars</code>, <code>iris</code> or <code>airquality</code>.'
      });
    });

    netOps.forEach(function (fn) {
      lints.push({
        level: 'warn', tag: 'net',
        msg: 'Uses <code>' + escapeHtml(fn) + '</code>. Network calls are not reproducible offline and slow the helper down.',
        hint: 'Fetch the resource once, keep the relevant subset, then paste a <code>dput()</code> of that subset into the reprex.'
      });
    });

    if (plots.length) {
      lints.push({
        level: 'info', tag: 'plot',
        msg: 'Plot calls detected (<code>' + escapeHtml(plots.join(', ')) + '</code>). A reader cannot see your plot from code alone.',
        hint: 'Describe what the plot looks like in the question, or attach a screenshot. reprex::reprex() embeds rendered plots for you automatically.'
      });
    }

    if (randoms.length && !hasSeed) {
      lints.push({
        level: 'warn', tag: 'seed',
        msg: 'Random calls (<code>' + escapeHtml(randoms.join(', ')) + '</code>) without <code>set.seed()</code>. Results will not reproduce across runs.',
        hint: 'Add <code>set.seed(42)</code> at the top, or toggle "Add set.seed()" on the left.'
      });
    } else if (randoms.length && hasSeed) {
      lints.push({ level: 'ok', tag: 'seed', msg: 'Seed is pinned. Random output will reproduce.', hint: '' });
    }

    if (!libs.length && /\b(ggplot|geom_|filter|mutate|select|arrange|summari[sz]e|group_by|pivot_longer|pivot_wider|map_dbl|map_chr|tibble|%>%)\b/.test(rawCode)) {
      lints.push({
        level: 'warn', tag: 'lib',
        msg: 'Tidyverse-style verbs detected but no <code>library()</code> call.',
        hint: 'Add the packages you use, e.g. <code>library(dplyr)</code> / <code>library(ggplot2)</code> / <code>library(tidyr)</code>, so the reader knows what to install.'
      });
    }

    libs.forEach(function (l) {
      if (l.pkg === 'reshape2') {
        lints.push({ level: 'info', tag: 'pkg', msg: '<code>reshape2</code> is retired.', hint: 'Prefer <code>tidyr::pivot_longer()</code> / <code>tidyr::pivot_wider()</code>.' });
      } else if (l.pkg === 'plyr') {
        lints.push({ level: 'info', tag: 'pkg', msg: '<code>plyr</code> is retired.', hint: 'Prefer <code>dplyr</code> + <code>purrr</code>.' });
      }
    });

    if (opts.sessionInfo && !hasSI) {
      lints.push({ level: 'ok', tag: 'meta', msg: '<code>sessionInfo()</code> will be appended to the reprex.', hint: '' });
    }

    var lineCount = rawCode.split('\n').filter(function (l) { return l.trim().length; }).length;
    if (lineCount > 50) {
      lints.push({ level: 'warn', tag: 'size', msg: 'Reprex is ' + lineCount + ' lines. A good reprex is usually under 50.', hint: 'Bisect: cut the second half; does the bug still appear? If yes, repeat on what remains. If no, the bug lives in the half you cut.' });
    }

    return lints;
  }

  // ----------------------------------------------------------------
  // Scenarios - six common reprex problems. Every embedded #> line is
  // genuine R 4.6.0 output; `verify` is the distinctive substring the
  // Node harness checks against Scripts/tool-truth/reprex.json.
  // ----------------------------------------------------------------
  var SCENARIOS = {
    minimal: {
      name: 'Bare-bones runnable example',
      code: [
        '# Why does this give NA?',
        'x <- c(1, 2, 3, NA, 5)',
        'mean(x)',
        '#> [1] NA',
        '',
        '# Expected: 2.75'
      ].join('\n'),
      verify: '[1] NA'
    },
    plot: {
      name: 'Reproduce a plotting bug',
      code: [
        'library(ggplot2)',
        '',
        '# The colour scale errors out instead of mapping cyl.',
        'ggplot(mtcars, aes(wt, mpg, color = cyl)) +',
        '  geom_point(size = 3) +',
        '  scale_color_brewer(palette = "Set1")',
        '#> Error: Continuous value supplied to a discrete scale.'
      ].join('\n'),
      verify: 'Continuous value supplied to a discrete scale.'
    },
    dplyr: {
      name: 'Show a tidyverse pipeline',
      code: [
        '# group_by + summarise on iris, but the pipe is not found.',
        'iris %>%',
        '  group_by(Species) %>%',
        '  summarise(m = mean(Sepal.Length))',
        '#> Error in iris %>% group_by(Species) : could not find function "%>%"'
      ].join('\n'),
      verify: 'could not find function "%>%"'
    },
    conflict: {
      name: 'Two packages clashing',
      code: [
        'library(dplyr)',
        'library(MASS)',
        '',
        '# MASS::select() masks dplyr::select() because MASS loads last.',
        'mtcars |>',
        '  select(mpg, wt, hp) |>',
        '  head()',
        '#> Error in select(mtcars, mpg, wt, hp) : unused arguments (mpg, wt, hp)'
      ].join('\n'),
      verify: 'unused arguments (mpg, wt, hp)'
    },
    customdata: {
      name: 'When data is not shareable',
      code: [
        'library(dplyr)',
        '',
        '# Using my own data frame called sales_2024.',
        'sales_2024 |>',
        '  filter(region == "EMEA") |>',
        '  group_by(quarter) |>',
        '  summarise(total = sum(revenue))',
        '#> Error: object \'sales_2024\' not found'
      ].join('\n'),
      verify: "object 'sales_2024' not found"
    },
    customfn: {
      name: 'A function that misbehaves',
      code: [
        'standardize <- function(x){',
        '  (x - mean(x)) / sd(x)',
        '}',
        '',
        'set.seed(1)',
        'samples <- rnorm(20, mean = 5, sd = 2)',
        'samples[3] <- NA',
        'standardize(samples)',
        '#>  [1] NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA'
      ].join('\n'),
      verify: 'NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA NA'
    }
  };

  return {
    VERSION: '2.0.0',
    escapeHtml: escapeHtml,
    R_KEYWORDS: R_KEYWORDS,
    R_SYMBOLS: R_SYMBOLS,
    BUILTIN_DATASETS: BUILTIN_DATASETS,
    VENUES: VENUES,
    COMMENT: COMMENT,
    SCENARIOS: SCENARIOS,
    detectLibraries: detectLibraries,
    detectAssignments: detectAssignments,
    detectUndefinedRefs: detectUndefinedRefs,
    detectFileOps: detectFileOps,
    detectNetworkOps: detectNetworkOps,
    detectPlots: detectPlots,
    detectRandomCalls: detectRandomCalls,
    hasSetSeed: hasSetSeed,
    hasSessionInfo: hasSessionInfo,
    buildReprex: buildReprex,
    buildLints: buildLints
  };
}));
