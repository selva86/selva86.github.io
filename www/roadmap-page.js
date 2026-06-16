// roadmap-page.js -- ONE integrated learning journey (not a goal switcher).
// A single ascending climb: New to R -> Data Analyst -> Data Scientist ->
// Time Series Specialist -> Researcher -> R Developer. Each LEVEL ends in a
// real credential, building to the capstone. Vanilla JS, no libraries.
// Anon-safe; never throws. Dark mode + reveal come from sections-v3.js.
//
// Honesty: level nodes are NEUTRAL for everyone. The only personalized bit is
// the per-level progress, filled from the real /api/me/tracks.
(function () {
  'use strict';

  // Each milestone tutorial links to its real page. Verified to exist at build.
  var STOP_LINKS = {
      'Bar Charts': '/ggplot2-Bar-Charts.html',
      'Bivariate EDA': '/Bivariate-EDA-in-R.html',
      'Bootstrap (boot package)': '/Bootstrap-in-R.html',
      'Central Limit Theorem': '/Central-Limit-Theorem-in-R.html',
      'Choosing the Right Test': '/Which-Statistical-Test-in-R.html',
      'Clustering (k-Means / HC / DBSCAN)': '/Clustering-with-R.html',
      'Communicating Uncertainty': '/Communicating-Uncertainty.html',
      'Confidence Intervals': '/Confidence-Intervals-in-R.html',
      'Correlation Analysis': '/Correlation-Analysis-in-R.html',
      'Descriptive Statistics': '/Descriptive-Statistics-in-R.html',
      'Distribution Charts': '/ggplot2-Distribution-Charts.html',
      'EDA (7-Step Framework)': '/Exploratory-Data-Analysis-in-R.html',
      'Feature Selection': '/Variable-Selection-in-R.html',
      'Getting Help in R': '/Getting-Help-in-R.html',
      'Grammar of Graphics': '/ggplot2-Grammar-of-Graphics.html',
      'Hypothesis Testing': '/Hypothesis-Testing-in-R.html',
      'Importing Data': '/Importing-Data-in-R.html',
      'Interaction Effects': '/Interaction-Effects-in-R.html',
      'Interpreting PCA Output': '/PCA-in-R.html',
      'Line Charts': '/ggplot2-Line-Charts.html',
      'Linear Regression': '/Linear-Regression.html',
      'Linear Regression Assumptions': '/Linear-Regression-Assumptions-in-R.html',
      'Logistic Regression': '/Logistic-Regression-With-R.html',
      'Missing Values (NA)': '/Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html',
      'Model Selection': '/Model-Selection-in-R.html',
      'More Time Series Forecasting': '/Time-Series-Forecasting-With-R-part2.html',
      'Multiple Testing Correction': '/Multiple-Comparisons-in-R.html',
      'Normal, t, F, Chi-Squared': '/Normal-t-F-and-Chi-Squared-Distributions-in-R.html',
      'One-Way ANOVA': '/One-Way-ANOVA-in-R.html',
      'PCA with prcomp()': '/PCA-in-R.html',
      'Poisson Regression': '/Poisson-Regression-in-R.html',
      'Post-Hoc Tests After ANOVA': '/Post-Hoc-Tests-After-ANOVA.html',
      'Publication-Ready Figures': '/Publication-Quality-Figures-in-R.html',
      'R Data Frames': '/R-Data-Frames.html',
      'R Joins': '/R-Joins.html',
      'R Project Structure': '/R-Project-Structure.html',
      'R Subsetting': '/R-Subsetting.html',
      'R Syntax 101': '/R-Syntax-101.html',
      'R Vectors': '/R-Vectors.html',
      'R for Excel Users': '/R-for-Excel-Users.html',
      'Random Variables': '/Random-Variables-in-R.html',
      'Regression Diagnostics': '/Regression-Diagnostics-in-R.html',
      'Regression Tables (3 packages)': '/Regression-Tables-in-R.html',
      'Reporting Statistics': '/Reporting-Statistics-in-R.html',
      'Reproducibility': '/Reproducibility-Crisis.html',
      'Ridge & Lasso Regression': '/Ridge-and-Lasso-Regression-in-R.html',
      'Sampling Distributions': '/Sampling-Distributions-in-R.html',
      'Scatter Plots': '/ggplot2-Scatter-Plots.html',
      'Secondary Axis': '/ggplot2-Secondary-Axis.html',
      'Tidy Data': '/Tidy-Data-in-R.html',
      'Time Series Analysis': '/Time-Series-Analysis-With-R.html',
      'Time Series Forecasting': '/Time-Series-Forecasting-With-R.html',
      'Univariate EDA': '/Univariate-EDA-in-R.html',
      'Variable Selection': '/Variable-Selection-in-R.html',
      'Writing R Functions': '/R-Functions.html',
      'dplyr filter & select': '/dplyr-filter-select.html',
      'dplyr group_by & summarise': '/dplyr-group-by-summarise.html',
      'geom_smooth()': '/geom_smooth-in-R.html',
      'ggplot2 Getting Started': '/ggplot2-Getting-Started.html',
      'lubridate': '/lubridate-in-R.html',
      'pivot_longer & pivot_wider': '/pivot_longer-pivot_wider-Reshape-Data-in-R.html',
      't-SNE and UMAP': '/t-SNE-and-UMAP-in-R.html',
      't-Tests': '/t-Tests-in-R.html',
      'Functional Programming': '/Functional-Programming-in-R.html',
      'purrr map() Variants': '/purrr-map-Variants.html',
      'Function Factories': '/R-Function-Factories.html',
      'Reduce, Filter, Map': '/Reduce-Filter-Map-in-R.html',
      'OOP in R (S3/S4/R6)': '/OOP-in-R.html',
      'S3 Classes': '/S3-Classes-in-R.html',
      'S4 Classes': '/S4-Classes-in-R.html',
      'R6 Classes': '/R6-Classes-in-R.html',
      'R Names & Values': '/R-Names-and-Values.html',
      'R Environments': '/R-Environments.html',
      'Lexical Scoping': '/R-Lexical-Scoping.html',
      'R Closures': '/R-Closures.html',
      'Conditions System': '/R-Conditions-System.html',
      'Debugging R Code': '/R-Debugging.html',
      'Parallel Computing': '/Parallel-Computing-With-R.html',
      'Speedup R Code': '/Strategies-To-Improve-And-Speedup-R-Code.html',
      'Top 50 ggplot2 Visualizations': '/Top50-Ggplot2-Visualizations-MasterList-R-Code.html',
      'R Data Types': '/R-Data-Types.html',
      'R Control Flow': '/R-Control-Flow.html',
      'R Lists': '/R-Lists.html',
      'Missing Value Treatment': '/Missing-Value-Treatment-With-R.html',
      'Outlier Detection': '/Outlier-Detection-in-R.html',
      'Variable Selection & Importance': '/Variable-Selection-and-Importance-With-R.html',
      'PCA in R': '/PCA-in-R.html',
      'Interpreting PCA Results': '/Interpreting-PCA-Results-in-R.html',
      'DBSCAN Clustering': '/DBSCAN-Clustering-in-R.html',
      'Cluster Analysis': '/Cluster-Analysis-in-R.html',
      'Elastic Net Regression': '/Elastic-Net-Regression-in-R.html',
      'EDA for Time Series': '/EDA-for-Time-Series-in-R.html',
      'Bootstrap Confidence Intervals': '/Bootstrap-Confidence-Intervals-in-R.html',
      'Effect Size': '/Effect-Size-in-R.html',
      'Nonparametric Tests': '/When-to-Use-Nonparametric-Tests-in-R.html',
      'Two-Way ANOVA': '/Two-Way-ANOVA-in-R.html',
      'Function Operators': '/R-Function-Operators.html',
      'Operator Overloading': '/Operator-Overloading-in-R.html',
      'R Memory & lobstr': '/R-Memory-lobstr.html'
    };

  // ---- THE JOURNEY: ordered levels, each ending in a credential. ----
  // track: the /api/me/tracks id that powers signed-in progress (null = not wired yet).
  var LEVELS = [
    { n: 1, key: 'foundations', persona: 'New to R', color: '#2c5e8f',
      head: 'R programming <em>foundations</em>',
      become: 'Command of base R: data types, vectors and data frames, control flow, and writing your own functions with correct scope.',
      weeks: '~3 weeks', cert: 'R Fundamentals', track: 'r-fundamentals',
      arrive: 'You can read and write idiomatic base R with confidence.',
      stages: [
        { title: 'Syntax, data types and data structures',
          why: 'The grammar everything else is built on: how R stores values, the difference between a vector, a list and a data frame, and the operators you will use in every script.',
          stops: ['R Syntax 101', 'R Data Types', 'R Vectors', 'R Lists', 'R Data Frames'],
          payoff: 'store, inspect and reshape any object in R without guesswork',
          hub: 'R Vectors (12 problems)', tool: 'R syntax cheat sheet', time: 'about two weeks' },
        { title: 'Control flow, functions and project structure',
          why: 'Where you stop pasting snippets and start writing programs: conditionals and loops, your own functions and their scope, subsetting, and a project layout that scales.',
          stops: ['R Control Flow', 'Writing R Functions', 'R Subsetting', 'Getting Help in R', 'R Project Structure'],
          payoff: 'write a reusable function and structure a project you can return to in six months',
          hub: 'R Functions (15 problems)', tool: 'R project starter', time: 'about a week' }
      ] },

    { n: 2, key: 'analyst', persona: 'Data Analyst', color: '#1f7a78',
      head: 'Data analysis with the <em>tidyverse</em>',
      become: 'Take a dataset from raw file to a clear, defensible analysis: reshape and join it, then communicate it with ggplot2 and a disciplined EDA.',
      weeks: '~4 weeks', cert: 'Tidyverse Practitioner', track: 'tidyverse-practitioner',
      arrive: 'You can wrangle, explore and present real data end to end.',
      stages: [
        { title: 'Data wrangling with dplyr and tidyr',
          why: 'The daily craft of analysis: import, filter, mutate, group and summarise, join across tables, reshape between wide and long, and handle missing values honestly.',
          stops: ['Importing Data', 'dplyr filter & select', 'dplyr group_by & summarise', 'R Joins', 'pivot_longer & pivot_wider', 'Missing Value Treatment'],
          payoff: 'turn a raw file and several lookup tables into one clean, analysis-ready dataset',
          hub: 'dplyr (15 problems)', tool: 'dplyr verb picker', time: 'about two weeks' },
        { title: 'Visualization with ggplot2',
          why: 'The grammar of graphics, learned once and applied everywhere: map data to aesthetics, layer geoms, and produce presentation-quality figures, including any chart in the 50-visualization gallery.',
          stops: ['Grammar of Graphics', 'ggplot2 Getting Started', 'Scatter Plots', 'Top 50 ggplot2 Visualizations', 'Publication-Ready Figures'],
          payoff: 'reproduce any chart in the gallery and adapt it to your own data',
          hub: 'ggplot2 (15 problems)', tool: 'chart type chooser', time: 'about a week' },
        { title: 'Exploratory data analysis',
          why: 'A repeatable framework for understanding a dataset before you model it: distributions, relationships, correlation, and the outliers that change conclusions.',
          stops: ['EDA (7-Step Framework)', 'Univariate EDA', 'Bivariate EDA', 'Correlation Analysis', 'Outlier Detection'],
          payoff: 'profile an unfamiliar dataset and surface what matters before drawing conclusions',
          hub: 'EDA Exercises in R', tool: 'summary stats explorer', time: 'about a week' }
      ] },

    { n: 3, key: 'ds', persona: 'Data Scientist', color: '#2d7d4e',
      head: 'Predictive modelling and <em>machine learning</em>',
      become: 'Build, tune and evaluate supervised and unsupervised models, and judge honestly when they will generalise.',
      weeks: '~6 weeks', cert: 'Machine Learning with R', track: 'machine-learning',
      arrive: 'You can take a problem from raw data to a validated model, and know its limits.',
      stages: [
        { title: 'Regression and model diagnostics',
          why: 'The workhorse of supervised learning and the foundation under everything else: fit linear and logistic models, read the diagnostics, and select the variables that matter.',
          stops: ['Linear Regression', 'Logistic Regression', 'Regression Diagnostics', 'Variable Selection & Importance'],
          payoff: 'fit a regression model, check its assumptions, and defend the variables you kept',
          hub: 'Linear Regression (15 problems)', tool: 'regression diagnostics tool', time: 'about three weeks' },
        { title: 'Unsupervised learning: PCA and clustering',
          why: 'Find structure without labels: reduce dimensionality with PCA and interpret the components, then group observations with k-means, hierarchical and density-based clustering.',
          stops: ['PCA in R', 'Interpreting PCA Results', 'Cluster Analysis', 'DBSCAN Clustering', 't-SNE and UMAP'],
          payoff: 'reduce and cluster a high-dimensional dataset, and explain what the groups mean',
          hub: 'Clustering Exercises (10 problems)', tool: 'PCA explorer', time: 'about two weeks' },
        { title: 'Regularization, selection and validation',
          why: 'The discipline that separates a model that fits from one that generalises: ridge, lasso and elastic net to control complexity, and principled model selection.',
          stops: ['Ridge & Lasso Regression', 'Elastic Net Regression', 'Variable Selection', 'Model Selection'],
          payoff: 'regularize a model and choose between candidates without fooling yourself',
          hub: 'Cross Validation Exercises', tool: 'model comparison board', time: 'about two weeks' }
      ] },

    { n: 4, key: 'ts', persona: 'Time Series', color: '#b1832f',
      head: 'Time series analysis and <em>forecasting</em>',
      become: 'Decompose, model and forecast ordered data, with prediction intervals you can stand behind.',
      weeks: '~3 weeks', cert: 'Time Series Forecasting', track: null,
      arrive: 'You can produce and validate forecasts for temporal data.',
      stages: [
        { title: 'Exploring trend and seasonality',
          why: 'Forecasting begins with looking. Build the EDA habits specific to ordered data: visualizing level, trend and seasonality, and reading a series before modelling it.',
          stops: ['EDA for Time Series', 'Line Charts', 'geom_smooth()', 'Secondary Axis'],
          payoff: 'read a time series for trend, season and anomalies before fitting anything',
          hub: 'Time Series Exercises in R', tool: 'chart type chooser', time: 'a few days' },
        { title: 'Decomposition, ARIMA and forecasting',
          why: 'The core toolkit: separate a series into components, fit models that respect temporal order, and generate forecasts with honest uncertainty.',
          stops: ['Time Series Analysis', 'Time Series Forecasting', 'More Time Series Forecasting'],
          payoff: 'produce a multi-month forecast with calibrated prediction intervals',
          hub: 'Time Series Exercises in R', tool: 'forecast horizon tool', time: 'about two weeks' }
      ] },

    { n: 5, key: 'researcher', persona: 'Researcher', color: '#9c5732',
      head: 'Statistical <em>inference</em> and reporting',
      become: 'Run and defend the right statistical test, model effects rigorously, and report results reproducibly.',
      weeks: '~6 weeks', cert: 'Applied Statistics with R', track: 'statistics-for-ds',
      arrive: 'Your analysis can withstand methodological review.',
      stages: [
        { title: 'Probability and sampling distributions',
          why: 'The foundation reviewers test first: random variables, the common distributions, the central limit theorem, and what a sampling distribution actually is, built through simulation.',
          stops: ['Random Variables', 'Normal, t, F, Chi-Squared', 'Central Limit Theorem', 'Sampling Distributions', 'Bootstrap Confidence Intervals'],
          payoff: 'reason about uncertainty from first principles, by simulation when needed',
          hub: 'Probability in R Exercises', tool: 'distribution playground', time: 'about two weeks' },
        { title: 'Hypothesis testing and test selection',
          why: 'The hard part of inference is choosing the correct test, not running it. A decision framework, the parametric workhorses, nonparametric alternatives, and reporting effect sizes.',
          stops: ['Hypothesis Testing', 'Choosing the Right Test', 't-Tests', 'Nonparametric Tests', 'Effect Size'],
          payoff: 'select, run and report the right test for a real, imperfect design',
          hub: 'Hypothesis Testing Exercises', tool: 'which-test chooser', time: 'about two weeks' },
        { title: 'ANOVA and regression modelling',
          why: 'Move from differences to effects: one- and two-way ANOVA, interaction effects, regression assumptions, and the post-hoc analysis that follows a significant result.',
          stops: ['Linear Regression Assumptions', 'One-Way ANOVA', 'Two-Way ANOVA', 'Interaction Effects', 'Post-Hoc Tests After ANOVA'],
          payoff: 'model and report an effect size with the correct post-hoc procedure',
          hub: 'ANOVA Exercises (15 problems)', tool: 'effect size calculator', time: 'about two weeks' },
        { title: 'Statistical reporting and reproducibility',
          why: 'A result is only as good as how it is communicated: reproducible reports, regression tables across packages, honest uncertainty, and the practices that survive scrutiny.',
          stops: ['Reporting Statistics', 'Regression Tables (3 packages)', 'Communicating Uncertainty', 'Reproducibility'],
          payoff: 'produce a reproducible report and tables a journal will accept',
          hub: 'R Markdown Exercises', tool: 'regression table builder', time: 'about a week' }
      ] },

    { n: 6, key: 'developer', persona: 'R Developer', color: '#7a4e2e',
      head: 'Advanced R and <em>software engineering</em>',
      become: 'Functional and object-oriented R, language internals, performance, and the engineering that turns scripts into tools.',
      weeks: '~7 weeks', cert: 'Advanced R', track: 'advanced-r',
      arrive: 'You can read, extend and engineer production-grade R.',
      stages: [
        { title: 'Functional programming',
          why: 'Compose behaviour instead of repeating it: higher-order functions, the purrr map family, function factories and operators, and the functional patterns that underlie the tidyverse.',
          stops: ['Functional Programming', 'purrr map() Variants', 'Function Factories', 'Function Operators', 'Reduce, Filter, Map'],
          payoff: 'replace repetitive code with composable, higher-order functions',
          hub: 'Functional Programming (mastery quiz)', tool: 'purrr verb picker', time: 'about two weeks' },
        { title: 'Object-oriented R: S3, S4 and R6',
          why: 'R has three object systems and using each well is its own skill: S3 for lightweight dispatch, S4 for formal rigour, R6 for mutable state, plus operator overloading.',
          stops: ['OOP in R (S3/S4/R6)', 'S3 Classes', 'S4 Classes', 'R6 Classes', 'Operator Overloading'],
          payoff: 'choose the right object system on purpose and read any package source',
          hub: 'OOP in R exercises', tool: 'class system chooser', time: 'about two weeks' },
        { title: 'Environments, scoping and internals',
          why: 'The mental model that turns baffling bugs into obvious ones: how names bind to values, environments and lexical scoping, closures, and where memory actually goes.',
          stops: ['R Names & Values', 'R Environments', 'Lexical Scoping', 'R Closures', 'R Memory & lobstr'],
          payoff: 'explain precisely why a value changed, or did not, and fix it fast',
          hub: 'R internals exercises', tool: 'environment inspector', time: 'about a week' },
        { title: 'Debugging, performance and parallelism',
          why: 'The engineering layer: a real debugging workflow and the conditions system, then the two routes to faster R, vectorisation and parallel execution.',
          stops: ['Conditions System', 'Debugging R Code', 'Parallel Computing', 'Speedup R Code'],
          payoff: 'diagnose a failure quickly and make slow R substantially faster',
          hub: 'Debugging exercises', tool: 'profiling guide', time: 'about two weeks' }
      ] }
  ];

  var CAPSTONE = {
    name: 'Certified R Data Scientist',
    blurb: 'Hold all six credentials and this one is awarded automatically: the single line that says you can take a problem end to end in R, from a raw file to a result that holds up.'
  };

  var USER_TRACKS = null;   // {trackId: {pct, solved, total}} once signed in
  var journeyEl = document.getElementById('journey');
  var overviewEl = document.getElementById('overview');

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  // ---- the climb map: an ascending ridgeline trail you read in one glance ----
  var SHORT = { foundations: 'New to R', analyst: 'Data Analyst', ds: 'Data Scientist',
                ts: 'Time Series', researcher: 'Researcher', developer: 'R Developer' };
  var SHORTCERT = { foundations: 'R Fundamentals', analyst: 'Tidyverse', ds: 'Machine Learning',
                    ts: 'Time Series', researcher: 'Applied Stats', developer: 'Advanced R' };

  // Catmull-Rom spline through the waypoints -> a smooth rising trail.
  function crPath(P) {
    var d = 'M ' + P[0].x.toFixed(1) + ' ' + P[0].y.toFixed(1);
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
        c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }

  function overviewHTML() {
    var W = 1040, baseY = 232, topY = 60, padX = 92, n = LEVELS.length;
    var step = (W - 2 * padX) / n;
    var pts = [];
    for (var i = 0; i < n; i++) pts.push({ x: padX + i * step, y: baseY - (baseY - topY) * (i / n), L: LEVELS[i] });
    var sx = padX + n * step, sy = topY;
    pts.push({ x: sx, y: sy, summit: true });
    var trail = crPath(pts);
    var area = trail + ' L ' + sx.toFixed(1) + ' 268 L ' + pts[0].x.toFixed(1) + ' 268 Z';
    var nodes = pts.map(function (p) {
      if (p.summit) {
        return '<g class="cn cn-cap" data-jump="capstone" transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')">' +
          '<circle class="cn-halo" r="24"/>' +
          '<rect class="cn-dot" x="-18" y="-18" width="36" height="36" rx="11"/>' +
          '<path class="cn-star" d="M0 -9 2.6 -2.5 9.4 -2.5 3.9 1.7 6 8.5 0 4.3 -6 8.5 -3.9 1.7 -9.4 -2.5 -2.6 -2.5 Z"/>' +
          '<text class="cn-p" y="-28" text-anchor="middle">The summit</text>' +
          '<text class="cn-c cn-c-cap" y="34" text-anchor="middle">R Data Scientist</text>' +
        '</g>';
      }
      var L = p.L;
      return '<g class="cn" data-jump="level-' + L.key + '" transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')" style="--lc:' + L.color + '">' +
        '<circle class="cn-halo" r="23"/>' +
        '<circle class="cn-dot" r="16"/>' +
        '<text class="cn-num" y="5" text-anchor="middle">' + L.n + '</text>' +
        '<text class="cn-p" y="-26" text-anchor="middle">' + esc(SHORT[L.key]) + '</text>' +
        '<text class="cn-c" y="33" text-anchor="middle">' + esc(SHORTCERT[L.key]) + '</text>' +
      '</g>';
    }).join('');
    var svg = '<svg class="climb-svg" viewBox="0 0 ' + W + ' 286" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A six-level climb from New to R up to R Developer, ending in the R Data Scientist capstone">' +
      '<defs><linearGradient id="trailg" x1="0" y1="1" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#2c5e8f"/><stop offset=".5" stop-color="#2d7d4e"/><stop offset="1" stop-color="#c79b3e"/>' +
      '</linearGradient></defs>' +
      '<path class="trail-area" d="' + area + '"/>' +
      '<path class="trail-line" d="' + trail + '"/>' +
      nodes + '</svg>';
    var list = '<ol class="climb-list">' + LEVELS.map(function (L) {
      return '<li style="--lc:' + L.color + '"><a data-jump="level-' + L.key + '"><span class="cl-n">' + L.n + '</span>' +
        '<span class="cl-b"><b>' + esc(L.persona) + '</b><i>' + esc(L.cert) + ' certificate</i></span></a></li>';
    }).join('') + '<li class="cl-cap"><a data-jump="capstone"><span class="cl-n">&#9733;</span>' +
      '<span class="cl-b"><b>R Data Scientist</b><i>the capstone</i></span></a></li></ol>';
    return '<figure class="climb">' + svg + list + '</figure>';
  }

  function stageHTML(s) {
    var stops = s.stops.map(function (t) {
      return '<a class="stop" href="' + (STOP_LINKS[t] || '/tutorials/') + '">' +
        '<svg class="mk"><use href="#i-dot"/></svg>' +
        '<span class="mt">' + esc(t) + '</span>' +
        '<span class="arr"><svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></span>' +
        '</a>';
    }).join('');
    return '<div class="jstage">' +
      '<span class="jdot" aria-hidden="true"></span>' +
      '<div class="scard">' +
        '<h3>' + s.title + '</h3>' +
        '<p class="why">' + s.why + '</p>' +
        '<div class="stops">' + stops + '</div>' +
        (s.payoff ? '<p class="payoff"><svg class="ic ic-sm"><use href="#i-flag"/></svg>' +
          '<span>By the end, you can <b>' + s.payoff + '</b></span></p>' : '') +
        '<div class="reinforce">' +
          '<span class="chip"><svg><use href="#i-dumbbell"/></svg> practice &middot; <b>' + s.hub + '</b></span>' +
          '<span class="chip"><svg><use href="#i-tool"/></svg> tool &middot; <b>' + s.tool + '</b></span>' +
          '<span class="chip"><svg><use href="#i-clock"/></svg> ' + s.time + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function levelHTML(L) {
    var stages = L.stages.map(stageHTML).join('');
    return '<section class="level" id="level-' + L.key + '" style="--lc:' + L.color + '">' +
      '<div class="lhead">' +
        '<span class="lnum">' + L.n + '</span>' +
        '<div class="lhead-b">' +
          '<span class="leyebrow">Level ' + L.n + ' &middot; ' + esc(L.persona) + '</span>' +
          '<h2>' + L.head + '</h2>' +
          '<p class="lbecome">' + esc(L.become) + '</p>' +
          '<div class="lmeta">' +
            '<span class="lpill"><svg class="ic ic-sm"><use href="#i-clock"/></svg> ' + L.weeks + '</span>' +
            '<span class="lpill lpill-cert"><svg class="ic ic-sm"><use href="#i-award"/></svg> earns the ' + esc(L.cert) + ' certificate</span>' +
            '<span class="lprog" data-track="' + (L.track || '') + '"></span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      stages +
      '<div class="milestone">' +
        '<span class="mnode"><svg class="ic ic-sm"><use href="#i-check"/></svg></span>' +
        '<div class="mcard">' +
          '<span class="mlabel">Checkpoint &middot; Level ' + L.n + ' complete</span>' +
          '<p>' + esc(L.arrive) + ' You earn the <b>' + esc(L.cert) + '</b> certificate.</p>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function capstoneHTML() {
    return '<section class="capstone" id="capstone">' +
      '<span class="cnode"><svg class="ic ic-md"><use href="#i-award"/></svg></span>' +
      '<div class="ccard">' +
        '<span class="ck">The summit</span>' +
        '<h2>The <span class="u">' + CAPSTONE.name + '</span></h2>' +
        '<p>' + CAPSTONE.blurb + '</p>' +
        '<div class="cacts">' +
          '<a class="btn btn-gold" href="/certifications">See how the certificates work <svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></a>' +
          '<span class="cnote">6 credentials &middot; every tutorial stays free</span>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function render() {
    if (overviewEl) overviewEl.innerHTML = overviewHTML();
    if (journeyEl) {
      journeyEl.innerHTML = LEVELS.map(levelHTML).join('') + capstoneHTML();
    }
  }

  function applyProgress() {
    if (!USER_TRACKS || !journeyEl) return;
    journeyEl.querySelectorAll('.lprog').forEach(function (el) {
      var id = el.getAttribute('data-track');
      var t = id && USER_TRACKS[id];
      if (t) {
        el.innerHTML = '<b>You:</b> ' + t.pct + '% &middot; ' + t.solved + '/' + t.total + ' exercises';
        el.classList.add('on');
      }
    });
    var done = 0, tracked = 0;
    LEVELS.forEach(function (L) {
      if (L.track && USER_TRACKS[L.track]) { tracked++; done += USER_TRACKS[L.track].pct; }
    });
    var cap = document.getElementById('jou-prog');
    if (cap && tracked) {
      cap.innerHTML = '<b>Your climb:</b> ' + Math.round(done / tracked) +
        '% across the tracked levels. Keep solving and it fills in here.';
      cap.classList.add('on');
    }
  }

  render();

  // smooth-scroll for the climb map (SVG waypoints use data-jump) + in-page anchors
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var j = e.target.closest('[data-jump]');
    var a = e.target.closest('a[href^="#"]');
    var id = j ? j.getAttribute('data-jump') : (a ? a.getAttribute('href').slice(1) : null);
    if (!id) return;
    var t = document.getElementById(id);
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  // ---- signed-in progress (anon-safe) ----
  function readAccessToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('sb-') !== 0 || key.slice(-11) !== '-auth-token') continue;
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.access_token === 'string') return parsed.access_token;
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      }
    } catch (_) { }
    return null;
  }

  function hydrate() {
    var token = readAccessToken();
    if (!token) return;
    fetch('/api/me/tracks', { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }, credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !Array.isArray(d.tracks)) return;
        USER_TRACKS = {};
        d.tracks.forEach(function (t) {
          if (t && t.id) USER_TRACKS[t.id] = {
            pct: Math.max(0, Math.min(100, Math.round((Number(t.pct) || 0) * 100))),
            solved: Number(t.solved) || 0,
            total: Number(t.total_exercises) || 0
          };
        });
        try { applyProgress(); } catch (_) { }
      })
      .catch(function () { });
  }
  hydrate();
})();
