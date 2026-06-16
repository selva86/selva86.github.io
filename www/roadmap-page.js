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
      'Top 50 ggplot2 Visualizations': '/Top50-Ggplot2-Visualizations-MasterList-R-Code.html'
    };

  // ---- THE JOURNEY: ordered levels, each ending in a credential. ----
  // track: the /api/me/tracks id that powers signed-in progress (null = not wired yet).
  var LEVELS = [
    { n: 1, key: 'foundations', persona: 'New to R', color: '#2056d2', head: 'Find your <em>feet</em> in R',
      become: 'read R fluently instead of fighting it', weeks: '~3 weeks',
      cert: 'R Fundamentals', track: 'r-fundamentals',
      arrive: 'You can hold your own in any R script. Stop here and you are already dangerous.',
      stages: [
        { title: 'Read R like a sentence, not a puzzle',
          why: 'Most people who quit R quit in week one, decoding every line by hand. Get the grammar down and code starts reading like a sentence instead of a cipher. The twenty minutes that saves twenty hours.',
          stops: ['R Syntax 101', 'R Vectors', 'R Data Frames', 'Writing R Functions'],
          payoff: 'write your own functions and run a whole analysis without copy-pasting from Stack Overflow',
          hub: 'R Basics (15 problems)', tool: 'R syntax cheat sheet', time: 'about a week' },
        { title: 'The unglamorous habits that make you fast',
          why: 'The habits that separate people who finish from people who flail: clean subsetting, knowing how to get unstuck, and a project structure future-you can navigate.',
          stops: ['R Subsetting', 'Getting Help in R', 'R Project Structure'],
          payoff: 'pull any slice out of a dataset and set up a project that still makes sense in six months',
          hub: 'R Subsetting (10 problems)', tool: 'R project starter', time: 'a few days' }
      ] },

    { n: 2, key: 'analyst', persona: 'Data Analyst', color: '#2e7d4f', head: 'Become a <em>Data Analyst</em>',
      become: 'turn raw data into the answer, and the chart that proves it', weeks: '~4 weeks',
      cert: 'Tidyverse Practitioner', track: 'tidyverse-practitioner',
      arrive: 'You can wrangle and present data end to end. This is the job most analyst roles are hiring for.',
      stages: [
        { title: 'Bend messy data to your will',
          why: 'Real data never arrives clean. This is where R stops feeling like a toy and starts feeling like a power tool. filter, mutate, group, summarise, join, reshape, the verbs you reach for daily.',
          stops: ['Importing Data', 'dplyr filter & select', 'dplyr group_by & summarise', 'R Joins', 'pivot_longer & pivot_wider', 'Tidy Data'],
          payoff: 'join three messy tables into the one tidy answer your team thought needed a meeting',
          hub: 'dplyr (15 problems)', tool: 'dplyr verb picker', time: 'about two weeks' },
        { title: 'Make a chart that earns a second look',
          why: 'Once the grammar of graphics clicks, you stop memorising chart recipes and start composing them. One idea that pays off in every chart you make after.',
          stops: ['Grammar of Graphics', 'ggplot2 Getting Started', 'Scatter Plots', 'Top 50 ggplot2 Visualizations', 'Publication-Ready Figures'],
          payoff: 'rebuild any chart from our 50-visualization gallery, from scratch',
          hub: 'ggplot2 (15 problems)', tool: 'chart type chooser', time: 'about a week' },
        { title: 'Find the story before you tell it',
          why: 'Good analysts explore before they conclude. A repeatable EDA framework keeps you honest and catches the outlier that would have embarrassed you in the readout.',
          stops: ['EDA (7-Step Framework)', 'Univariate EDA', 'Bivariate EDA', 'Correlation Analysis'],
          payoff: 'run a full EDA and catch the problem in the data before anyone else does',
          hub: 'EDA Exercises in R', tool: 'summary stats explorer', time: 'about a week' }
      ] },

    { n: 3, key: 'ds', persona: 'Data Scientist', color: '#d68910', head: 'Think like a <em>Data Scientist</em>',
      become: 'build and defend models that survive data they have never seen', weeks: '~6 weeks',
      cert: 'Machine Learning with R', track: 'machine-learning',
      arrive: 'You can carry a problem from raw data to an evaluated model, and know when not to trust it.',
      stages: [
        { title: 'Understand the machine before you trust it',
          why: 'Every model you will use is regression wearing a costume. Build the intuition on linear and logistic regression and their diagnostics, and the rest of ML stops being magic.',
          stops: ['Linear Regression', 'Logistic Regression', 'Regression Diagnostics', 'Feature Selection'],
          payoff: 'read any model output and say what it actually claims, and where it lies',
          hub: 'Linear Regression (15 problems)', tool: 'regression diagnostics tool', time: 'about three weeks' },
        { title: 'See the shape of your data',
          why: 'Before you predict, you reduce and group. PCA and clustering teach you to find structure you did not know was there, the unsupervised half every good modeller leans on.',
          stops: ['PCA with prcomp()', 'Interpreting PCA Output', 'Clustering (k-Means / HC / DBSCAN)', 't-SNE and UMAP'],
          payoff: 'find structure with PCA and clustering that nobody told you was there',
          hub: 'Clustering Exercises (10 problems)', tool: 'PCA explorer', time: 'about two weeks' },
        { title: 'Build models that hold up out of sample',
          why: 'A model that fits your training data is easy. One that survives new data is the whole point. Regularization, the right validation, and the discipline not to fool yourself.',
          stops: ['Ridge & Lasso Regression', 'Model Selection', 'Poisson Regression', 'Variable Selection'],
          payoff: 'cross-validate honestly and pick the model that survives new data',
          hub: 'Cross Validation Exercises', tool: 'model comparison board', time: 'about two weeks' }
      ] },

    { n: 4, key: 'ts', persona: 'Time Series Specialist', color: '#0d9488', head: 'Master <em>data in motion</em>',
      become: 'forecast what comes next, with honest intervals', weeks: '~3 weeks',
      cert: 'Time Series Forecasting', track: null,
      arrive: 'You can decompose, model and forecast a series, not just plot one.',
      stages: [
        { title: 'Learn to read a series by eye',
          why: 'Half of forecasting is looking. Train your eye on trend and seasonality first, because a model that contradicts the plot is a model you have mis-specified.',
          stops: ['Line Charts', 'geom_smooth()', 'Secondary Axis'],
          payoff: 'spot trend, season and the anomaly before you fit a single model',
          hub: 'ggplot2 (15 problems)', tool: 'chart type chooser', time: 'a few days' },
        { title: 'Decompose, model, and forecast',
          why: 'The payoff. Pull a series apart into trend and season, fit a model that respects its order, and produce a forecast with honest intervals.',
          stops: ['Time Series Analysis', 'Time Series Forecasting', 'More Time Series Forecasting'],
          payoff: 'ship a 12-month forecast with honest prediction intervals',
          hub: 'Time Series Exercises in R', tool: 'forecast horizon tool', time: 'about two weeks' }
      ] },

    { n: 5, key: 'researcher', persona: 'Researcher', color: '#c0392b', head: 'Earn the right to <em>conclude</em>',
      become: 'produce results that survive peer review', weeks: '~6 weeks',
      cert: 'Applied Statistics with R', track: 'statistics-for-ds',
      arrive: 'Your analysis can stand behind the methods section of a paper.',
      stages: [
        { title: 'Get probability right in your bones',
          why: 'Reviewers smell shaky foundations. Before any test, the intuition: distributions, the central limit theorem, and what a sampling distribution actually is. Simulation first, formulas second.',
          stops: ['Random Variables', 'Normal, t, F, Chi-Squared', 'Central Limit Theorem', 'Sampling Distributions'],
          payoff: 'simulate a sampling distribution and explain the CLT to a skeptical reviewer',
          hub: 'Probability in R Exercises', tool: 'distribution playground', time: 'about two weeks' },
        { title: 'Choose and run the right test',
          why: 'The hardest part of inference is picking the correct test, not running it. A decision framework plus the workhorses: t-tests, chi-square, and honest handling of multiple comparisons.',
          stops: ['Hypothesis Testing', 'Choosing the Right Test', 't-Tests', 'Multiple Testing Correction'],
          payoff: 'pick the correct test for a messy real design, and defend why',
          hub: 'Hypothesis Testing Exercises', tool: 'which-test chooser', time: 'about two weeks' },
        { title: 'Model effects, not just differences',
          why: 'A p-value tells you something happened. Regression and ANOVA tell you how much, controlling for what. Where your analysis starts answering the question a reviewer will actually ask.',
          stops: ['Linear Regression Assumptions', 'Interaction Effects', 'One-Way ANOVA', 'Post-Hoc Tests After ANOVA'],
          payoff: 'report an effect size with the right post-hoc correction, not just a p-value',
          hub: 'ANOVA Exercises (15 problems)', tool: 'effect size calculator', time: 'about two weeks' },
        { title: 'Write it up so it survives scrutiny',
          why: 'Brilliant analysis dies in a sloppy methods section. Turn your work into something reproducible and submittable: clean tables, reported statistics, and uncertainty stated plainly.',
          stops: ['Reporting Statistics', 'Regression Tables (3 packages)', 'Communicating Uncertainty', 'Reproducibility'],
          payoff: 'produce a reproducible methods section and tables a journal will accept',
          hub: 'R Markdown Exercises', tool: 'regression table builder', time: 'about a week' }
      ] },

    { n: 6, key: 'developer', persona: 'R Developer', color: '#5b4b8a', head: 'Go <em>deeper</em> than most ever do',
      become: 'read the source of the tools everyone else just imports', weeks: '~7 weeks',
      cert: 'Advanced R', track: null,
      arrive: 'You can read, write and debug production-grade R, and understand how it works underneath.',
      stages: [
        { title: 'Treat functions as your building blocks',
          why: 'Most people use R. Fewer can compose it. Functional programming is the shift from writing the same loop ten times to writing one function that writes them for you.',
          stops: ['Functional Programming', 'purrr map() Variants', 'Function Factories', 'Reduce, Filter, Map'],
          payoff: 'replace ten near-identical loops with one function that writes them',
          hub: 'Functional Programming (mastery quiz)', tool: 'purrr verb picker', time: 'about two weeks' },
        { title: "Model your domain with R's object systems",
          why: 'R has not one object system but three, and knowing which to reach for is its own skill. S3 for speed, S4 for rigour, R6 for state. Learn them and package source stops looking like magic.',
          stops: ['OOP in R (S3/S4/R6)', 'S3 Classes', 'S4 Classes', 'R6 Classes'],
          payoff: 'pick S3, S4 or R6 on purpose and read the source of any package',
          hub: 'OOP in R exercises', tool: 'class system chooser', time: 'about two weeks' },
        { title: 'Understand R from the inside out',
          why: 'Why does changing one variable change another? Why does that function remember a value you thought was gone? Names, environments, scoping and closures turn baffling bugs into obvious ones.',
          stops: ['R Names & Values', 'R Environments', 'Lexical Scoping', 'R Closures'],
          payoff: 'explain exactly why a value changed, or did not, and fix the bug in minutes',
          hub: 'R internals exercises', tool: 'environment inspector', time: 'about a week' },
        { title: 'Make it robust, then make it fast',
          why: 'The last mile of real R: code that fails loudly and recovers gracefully, then code that does it quickly. The conditions system, a real debugging workflow, and the two ways to make slow R fast.',
          stops: ['Conditions System', 'Debugging R Code', 'Parallel Computing', 'Speedup R Code'],
          payoff: 'make slow R fast, and write code that fails with a useful message',
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

  // ---- the climb map: see the whole journey at a glance, jump to any level ----
  function overviewHTML() {
    var rungs = LEVELS.map(function (L) {
      return '<a class="rung" href="#level-' + L.key + '" style="--lc:' + L.color + '">' +
        '<span class="rung-n">' + L.n + '</span>' +
        '<span class="rung-b">' +
          '<span class="rung-p">' + esc(L.persona) + '</span>' +
          '<span class="rung-c">' + esc(L.cert) + ' certificate</span>' +
        '</span>' +
      '</a>';
    }).join('<span class="rung-link" aria-hidden="true"></span>');
    return '<div class="climb">' + rungs +
      '<span class="rung-link" aria-hidden="true"></span>' +
      '<a class="rung rung-cap" href="#capstone">' +
        '<span class="rung-n"><svg class="ic ic-sm"><use href="#i-award"/></svg></span>' +
        '<span class="rung-b"><span class="rung-p">R Data Scientist</span>' +
        '<span class="rung-c">capstone</span></span>' +
      '</a></div>';
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
          '<p class="lbecome">You learn to ' + esc(L.become) + '.</p>' +
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

  // smooth-scroll for the climb map / in-page anchors
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var t = id && document.getElementById(id);
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
