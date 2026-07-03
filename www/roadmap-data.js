// _roadmap-data.js -- shared curriculum data for the ultimate roadmap mocks.
// Copied VERBATIM from the live www/roadmap-page.js so all three mock versions
// render the exact same real content (every level, stage, stop, hub, tool, cert).
// The only additions are presentation-grouping metadata (CORE_KEYS, TRACK_KEYS,
// TRACK_META, MASTERY, PROJECTS) used by the new layouts. No content is changed.
(function (root) {
  'use strict';

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

  // ---- THE CURRICULUM: ordered levels, each ending in a credential (verbatim). ----
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

  // ---- presentation-grouping metadata (NEW; does not alter content) ----
  // The shared core everyone completes, then four EQUAL role tracks.
  var CORE_KEYS = ['foundations', 'analyst'];
  var TRACK_KEYS = ['ds', 'ts', 'researcher', 'developer'];

  // Equal-weight role framing for the four advanced tracks.
  var TRACK_META = {
    ds:         { role: 'Data Scientist', short: 'Machine Learning', build: 'A validated model you can defend', salary: '$84k-$150k', salaryNote: 'entry level, US' },
    ts:         { role: 'Forecaster',     short: 'Time Series',      build: 'A forecast with honest intervals', salary: '$86k-$135k', salaryNote: 'US typical' },
    researcher: { role: 'Researcher',     short: 'Applied Statistics', build: 'A reproducible, review-proof report', salary: '$80k-$130k', salaryNote: 'analyst/scientist, US' },
    developer:  { role: 'R Engineer',     short: 'Advanced R',       build: 'A tested package, shipped to GitHub', salary: '$67k-$112k', salaryNote: 'R programmer, US' }
  };

  // Four mastery levels (horizontal axis: distance, not rank).
  // Beginner + Analyst are the shared core; Practitioner + Specialist happen inside a track.
  var MASTERY = [
    { id: 'beginner',     name: 'Beginner',     scope: 'shared',    can: 'Get fluent in the language itself.', maps: ['foundations'] },
    { id: 'analyst',      name: 'Analyst',      scope: 'shared',    can: 'Answer real questions with data.',   maps: ['analyst'] },
    { id: 'practitioner', name: 'Practitioner', scope: 'your track', can: 'Build something that works.',        maps: ['ds', 'ts', 'researcher', 'developer'] },
    { id: 'specialist',   name: 'Specialist',   scope: 'your track', can: 'Defend it like a professional.',     maps: ['ds', 'ts', 'researcher', 'developer'] }
  ];

  // Project spine: real deliverables, each fed by the curriculum levels above.
  var PROJECTS = [
    { n: 1, name: 'Clean a dataset',   sub: 'import, tidy, join',        feeds: ['foundations', 'analyst'] },
    { n: 2, name: 'An EDA report',     sub: 'viz, summary, correlation', feeds: ['analyst'] },
    { n: 3, name: 'Train a model',     sub: 'regression, ML, validation', feeds: ['ds'] },
    { n: 4, name: 'Ship a forecast',   sub: 'trend, ARIMA, intervals',   feeds: ['ts'] },
    { n: 5, name: 'Defend an analysis', sub: 'tests, ANOVA, reporting',  feeds: ['researcher'] },
    { n: 6, name: 'Package a tool',    sub: 'FP, OOP, performance',      feeds: ['developer'] }
  ];

  root.RM = {
    STOP_LINKS: STOP_LINKS,
    LEVELS: LEVELS,
    CAPSTONE: CAPSTONE,
    CORE_KEYS: CORE_KEYS,
    TRACK_KEYS: TRACK_KEYS,
    TRACK_META: TRACK_META,
    MASTERY: MASTERY,
    PROJECTS: PROJECTS,
    byKey: function (k) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].key === k) return LEVELS[i]; return null; }
  };
})(window);
