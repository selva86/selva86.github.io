// roadmap-page.js -- interactive route map (goal switcher) + signed-in progress.
// Vanilla JS, no libraries. Anon-safe; never throws. Reveal-on-scroll and dark
// mode come from the shared sections-v3.js, not here.
//
// Honesty note: stage nodes are NEUTRAL for everyone (no fake "done/you-are-here"
// state). The ONLY personalized element is the progress strip, filled from the
// real /api/me/tracks for the certification track each route leads to.
(function () {
  'use strict';

  // Each stage stop links to its real tutorial. Titles not present here fall
  // back to the Tutorials index. Targets are verified to exist at build time.
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
      'Outlier Treatment': '/Outlier-Treatment-With-R.html',
      'Missing Value Treatment': '/Missing-Value-Treatment-With-R.html'
    };

  var ROUTES = {
      new: {
        title:'The way in, <em>from scratch</em>',
        weeks:'~6 weeks', here:2,
        cert:{name:'R Fundamentals',
          blurb:'Pass the Fundamentals and dplyr mastery quizzes and you walk away with a verifiable certificate that proves you can hold your own in R.',
          quizzes:'2 mastery quizzes'},
        stages:[
          {path:'Learn R', count:29, title:'Read R like a sentence, not a puzzle',
           why:'Most people who quit R quit in week one, decoding every line by hand. Get the grammar down and code starts reading like a sentence instead of a cipher. This is the twenty minutes that saves twenty hours.',
           time:'about a week', hub:'R Basics (15 problems)', tool:'R syntax cheat sheet',
           stops:['R Syntax 101','R Vectors','R Data Frames','Writing R Functions'], payoff:'write your own functions and run a whole analysis without copy-pasting from Stack Overflow'},
          {path:'Learn R', count:29, title:'The unglamorous habits that make you fast',
           why:'You came this far, good. Now the unglamorous habits that separate people who finish from people who flail: subsetting, getting help, and structuring a project so future-you can find anything.',
           time:'a few days', hub:'R Subsetting (10 problems)', tool:'R project starter',
           stops:['R Subsetting','Getting Help in R','R Project Structure'], payoff:'pull any slice out of a dataset and set up a project that still makes sense in six months'},
          {path:'Data Wrangling', count:24, title:'Bend messy data to your will',
           why:'Real data never arrives clean. This is the stage where R stops feeling like a toy and starts feeling like a power tool. The dplyr verbs here are the ones you will reach for daily.',
           time:'about a week', hub:'dplyr (15 problems)', tool:'dplyr verb picker',
           stops:['Importing Data','dplyr filter & select','dplyr group_by & summarise','Tidy Data'], payoff:'turn a raw, broken CSV into the exact tidy table your question needs'},
          {path:'Visualization', count:39, title:'Make a chart that earns a second look',
           why:'Once the grammar of graphics clicks, you stop memorizing chart recipes and start composing them. One idea that pays off in every chart you make after.',
           time:'about a week', hub:'ggplot2 (15 problems)', tool:'ggplot2 colour picker',
           stops:['Grammar of Graphics','ggplot2 Getting Started','Scatter Plots','Top 50 ggplot2 Visualizations'], payoff:'rebuild any chart from our 50-visualization gallery, from scratch'},
          {path:'Statistics', count:130, title:'Say something true about your data',
           why:'You can now load, clean and draw it. The last step in is reasoning under uncertainty: descriptive stats, correlation, and your first regression. A small bite of the deepest path here.',
           time:'a week or two', hub:'Confidence Interval (10 problems)', tool:'p-value interpreter',
           stops:['Descriptive Statistics','Correlation Analysis','Hypothesis Testing','Linear Regression'], payoff:'fit your first regression and back a claim with a confidence interval, not a hunch'}
        ]
      },
      analyst: {
        title:'From spreadsheets to <em>real analysis</em>',
        weeks:'~5 weeks', here:1,
        cert:{name:'dplyr + ggplot2 Analyst',
          blurb:'Clear the dplyr, tidyr and ggplot2 mastery quizzes and earn a certificate a hiring manager can verify: proof you can wrangle and present data end to end.',
          quizzes:'3 mastery quizzes'},
        stages:[
          {path:'Learn R', count:29, title:'Just enough language to be dangerous',
           why:'You do not need all of R to analyze data. You need the data frame and a handful of habits. We start narrow and move fast, because you came here to answer questions, not admire syntax.',
           time:'a few days', hub:'R Data Frames (15 problems)', tool:'R for Excel users guide',
           stops:['R Syntax 101','R Data Frames','R Subsetting','R for Excel Users'], payoff:'load a dataset and start answering real questions in your first sitting'},
          {path:'Data Wrangling', count:24, title:'The core craft of the job',
           why:'This is where an analyst lives. filter, mutate, group, summarise, join, reshape. Get fluent here and most of every analysis you run stops feeling like work.',
           time:'about two weeks', hub:'dplyr (15 problems)', tool:'dplyr verb picker',
           stops:['dplyr filter & select','dplyr group_by & summarise','R Joins','pivot_longer & pivot_wider'], payoff:'join three messy tables and answer a question your team thought needed a meeting'},
          {path:'Visualization', count:39, title:'Turn a table into an argument',
           why:'A number in a cell convinces no one. This stage is the grammar of graphics plus the charts that actually move a meeting: distributions, comparisons, and clean publication-ready output.',
           time:'about a week', hub:'ggplot2 (15 problems)', tool:'chart type chooser',
           stops:['Grammar of Graphics','Bar Charts','Distribution Charts','Publication-Ready Figures'], payoff:'ship a publication-ready figure that makes the decision obvious'},
          {path:'Visualization', count:39, title:'Find the story before you tell it',
           why:'Good analysts explore before they conclude. A repeatable EDA framework keeps you honest, catches the outlier that would have embarrassed you, and tells you what is actually worth charting.',
           time:'about a week', hub:'EDA Exercises in R', tool:'summary stats explorer',
           stops:['EDA (7-Step Framework)','Univariate EDA','Bivariate EDA','Correlation Analysis'], payoff:'run a full EDA and catch the outlier that would have embarrassed you in the readout'}
        ]
      },
      ml: {
        title:'The honest path to <em>machine learning</em>',
        weeks:'~9 weeks', here:2,
        cert:{name:'Machine Learning with R',
          blurb:'Clear the regression and machine-learning mastery quizzes and earn a certificate that reflects real modelling fluency, built stage by stage.',
          quizzes:'2 mastery quizzes'},
        stages:[
          {path:'Data Wrangling', count:24, title:'Earn the right to model',
           why:'Most ML courses skip this and it is exactly why people stall. A model is only as good as the frame you feed it. Wrangling is not a detour to modelling. It is the larger half of the job.',
           time:'about a week', hub:'dplyr (15 problems)', tool:'data quality checker',
           stops:['dplyr filter & select','dplyr group_by & summarise','R Joins','Missing Values (NA)'], payoff:'hand your model a clean, leak-free feature frame instead of garbage in'},
          {path:'Statistics', count:130, title:'Understand the machine before you trust it',
           why:'Every model you will use is regression wearing a costume. Build the intuition here, on linear and logistic regression and their diagnostics, and the rest of ML stops being magic.',
           time:'about three weeks', hub:'Linear Regression (15 problems)', tool:'regression diagnostics tool',
           stops:['Linear Regression','Logistic Regression','Regression Diagnostics','Feature Selection'], payoff:'read any regression output and say what it actually claims, and where it lies'},
          {path:'Statistics', count:130, title:'See the shape of your data',
           why:'Before you predict, you reduce and group. PCA and clustering teach you to find structure you did not know was there, the unsupervised half that every good modeller leans on.',
           time:'about two weeks', hub:'Clustering Exercises (10 problems)', tool:'PCA explorer',
           stops:['PCA with prcomp()','Interpreting PCA Output','Clustering (k-Means / HC / DBSCAN)','t-SNE and UMAP'], payoff:'find structure with PCA and clustering that nobody told you was there'},
          {path:'Statistics', count:130, title:'Build models that hold up out of sample',
           why:'A model that fits your training data is easy. One that survives new data is the whole point. Regularization, the right validation, and the discipline to not fool yourself.',
           time:'about two weeks', hub:'Cross Validation Exercises', tool:'model comparison board',
           stops:['Ridge & Lasso Regression','Model Selection','Poisson Regression','Variable Selection'], payoff:'cross-validate honestly and pick the model that survives new data'}
        ]
      },
      researcher: {
        title:'Inference you can <em>defend in review</em>',
        weeks:'~8 weeks', here:1,
        cert:{name:'Applied Statistics with R',
          blurb:'Pass the hypothesis-testing and regression mastery quizzes and earn a certificate that stands behind the methods section of a paper, earned by doing the work.',
          quizzes:'2 mastery quizzes'},
        stages:[
          {path:'Statistics', count:130, title:'Get probability right in your bones',
           why:'Reviewers smell shaky foundations. Before any test, the intuition: distributions, the central limit theorem, and what a sampling distribution actually is. Simulation first, formulas second.',
           time:'about two weeks', hub:'Probability in R Exercises', tool:'distribution playground',
           stops:['Random Variables','Normal, t, F, Chi-Squared','Central Limit Theorem','Sampling Distributions'], payoff:'simulate a sampling distribution and explain the CLT to a skeptical reviewer'},
          {path:'Statistics', count:130, title:'Choose and run the right test',
           why:'The hardest part of inference is picking the correct test, not running it. This stage is a decision framework plus the workhorses: t-tests, chi-square, and honest handling of multiple comparisons.',
           time:'about two weeks', hub:'Hypothesis Testing Exercises', tool:'which-test chooser',
           stops:['Hypothesis Testing','Choosing the Right Test','t-Tests','Multiple Testing Correction'], payoff:'pick the correct test for a messy real design, and defend why'},
          {path:'Statistics', count:130, title:'Model effects, not just differences',
           why:'A p-value tells you something happened. Regression and ANOVA tell you how much, controlling for what. This is where your analysis starts answering the question a reviewer will actually ask.',
           time:'about two weeks', hub:'ANOVA Exercises (15 problems)', tool:'effect size calculator',
           stops:['Linear Regression Assumptions','Interaction Effects','One-Way ANOVA','Post-Hoc Tests After ANOVA'], payoff:'report an effect size with the right post-hoc correction, not just a p-value'},
          {path:'Reporting', count:18, title:'Write it up so it survives scrutiny',
           why:'Brilliant analysis dies in a sloppy methods section. The last stage turns your work into something reproducible and submittable: clean tables, reported statistics, and uncertainty stated plainly.',
           time:'about a week', hub:'R Markdown Exercises', tool:'regression table builder',
           stops:['Reporting Statistics','Regression Tables (3 packages)','Communicating Uncertainty','Reproducibility'], payoff:'produce a reproducible methods section and tables a journal will accept'}
        ]
      },
      ts: {
        title:'Reasoning about data that <em>arrives in order</em>',
        weeks:'~5 weeks', here:1,
        cert:{name:'Time Series Forecasting',
          blurb:'Clear the time-series mastery quiz and earn a certificate that says you can decompose, model and forecast a series, not just plot one.',
          quizzes:'1 mastery quiz'},
        stages:[
          {path:'Learn R', count:29, title:'Steady the ground first',
           why:'Time series punishes shaky basics. You will be manipulating vectors and data frames constantly, so we lock those in (and the data structures) before a single forecast.',
           time:'a few days', hub:'R Vectors (12 problems)', tool:'R syntax cheat sheet',
           stops:['R Vectors','R Data Frames','R Subsetting','lubridate'], payoff:'wrangle dated, ordered data without tripping over gaps and time zones'},
          {path:'Visualization', count:39, title:'Learn to read a series by eye',
           why:'Half of forecasting is looking. Before any model, you train your eye on line charts and trends, because a model that contradicts what the plot plainly shows is a model you have mis-specified.',
           time:'a few days', hub:'ggplot2 (15 problems)', tool:'chart type chooser',
           stops:['Line Charts','geom_smooth()','Grammar of Graphics','Secondary Axis'], payoff:'spot trend, season and the anomaly before you fit a single model'},
          {path:'Statistics', count:130, title:'Borrow the stats that forecasting leans on',
           why:'Forecasting rests on autocorrelation, stationarity and a feel for uncertainty intervals. A short, targeted detour through the stats path so the ARIMA stage actually makes sense.',
           time:'about a week', hub:'Correlation Exercises in R', tool:'distribution playground',
           stops:['Correlation Analysis','Confidence Intervals','Descriptive Statistics','Bootstrap (boot package)'], payoff:'read an ACF plot and judge stationarity at a glance'},
          {path:'Time Series', count:4, title:'Decompose, model, and forecast',
           why:'Now the payoff. Pull a series apart into trend and season, fit a model that respects its order, and produce a forecast with honest intervals. The whole route was aimed here.',
           time:'about two weeks', hub:'Time Series Exercises in R', tool:'forecast horizon tool',
           stops:['Time Series Analysis','Time Series Forecasting','More Time Series Forecasting'], payoff:'ship a 12-month forecast with honest prediction intervals'}
        ]
      },
      developer: {
        title:'Going deeper, <em>into R itself</em>',
        weeks:'~7 weeks', here:1,
        cert:{name:'Advanced R',
          blurb:'Clear the Advanced R mastery quiz and earn a certificate that says you can read, write and debug production-grade R, not just call packages but understand how they work underneath.',
          quizzes:'1 mastery quiz'},
        stages:[
          {path:'Advanced R', count:27, title:'Treat functions as your building blocks',
           why:'Most people use R. Fewer can compose it. Functional programming is the shift from writing the same loop ten times to writing one function that writes them for you. It is the habit that separates scripts from tools.',
           time:'about two weeks', hub:'Functional Programming (mastery quiz)', tool:'purrr verb picker',
           stops:['Functional Programming','purrr map() Variants','Function Factories','Reduce, Filter, Map'], payoff:'replace ten near-identical loops with one function that writes them'},
          {path:'Advanced R', count:27, title:'Model your domain with R\'s object systems',
           why:'R has not one object system but three, and knowing which to reach for is its own skill. S3 for speed, S4 for rigour, R6 for state. Learn them and most package source stops looking like magic and starts looking like choices.',
           time:'about two weeks', hub:'OOP in R exercises', tool:'class system chooser',
           stops:['OOP in R (S3/S4/R6)','S3 Classes','S4 Classes','R6 Classes'], payoff:'pick S3, S4 or R6 on purpose and read the source of any package'},
          {path:'Advanced R', count:27, title:'Understand R from the inside out',
           why:'Why does changing one variable change another? Why does that function remember a value you thought was gone? Names, environments, scoping and closures are the mental model that turns baffling bugs into obvious ones.',
           time:'about a week', hub:'R internals exercises', tool:'environment inspector',
           stops:['R Names & Values','R Environments','Lexical Scoping','R Closures'], payoff:'explain exactly why a value changed, or did not, and fix the bug in minutes'},
          {path:'Advanced R', count:27, title:'Make it robust, then make it fast',
           why:'The last mile of real R: code that fails loudly and recovers gracefully, then code that does it quickly. The conditions system, a real debugging workflow, and the two ways to make slow R fast, vectorise or parallelise.',
           time:'about two weeks', hub:'Debugging exercises', tool:'profiling guide',
           stops:['Conditions System','Debugging R Code','Parallel Computing','Speedup R Code'], payoff:'make slow R fast, and write code that fails with a useful message'}
        ]
      }
    };

  // Each route leads toward one certification track (null = no single track, e.g. time series).
  var ROUTE_TRACK = {
    'new': 'r-fundamentals',
    'analyst': 'tidyverse-practitioner',
    'ml': 'machine-learning',
    'researcher': 'statistics-for-ds',
    'ts': null,
    'developer': null
  };

  var USER_TRACKS = null;   // {id: {pct, solved, total, name}} once signed in
  var activeGoal = 'new';
  var routeEl = document.getElementById('route');

  function stageHTML(s, idx) {
    var stops = s.stops.map(function (t) {
      return '<a class="stop" href="' + (STOP_LINKS[t] || '/tutorials/') + '">' +
        '<svg class="mk"><use href="#i-dot"/></svg>' +
        '<span class="mt">' + t + '</span>' +
        '<span class="arr"><svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></span>' +
        '</a>';
    }).join('');
    return '<div class="stage">' +
      '<span class="node">' + (idx + 1) + '</span>' +
      '<div class="scard">' +
        '<div class="sc-top">' +
          '<span class="path-name">' + s.path + '</span>' +
          '<span class="scnt">' + s.count + ' tutorials in this path</span>' +
        '</div>' +
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

  function finishHTML(cert) {
    return '<div class="finish">' +
      '<span class="node"><svg class="ic ic-md"><use href="#i-award"/></svg></span>' +
      '<div class="fcard">' +
        '<h3>Where it ends: the <span class="u">' + cert.name + '</span> certificate</h3>' +
        '<p>' + cert.blurb + '</p>' +
        '<div class="facts">' +
          '<a class="btn btn-gold" href="/certifications">See how the certificate works <svg class="ic ic-sm"><use href="#i-arrow-right"/></svg></a>' +
          '<span class="fnote">' + cert.quizzes + ' &middot; tutorials stay free</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function spineHTML(nStages) {
    var segs = nStages + 1;
    var xs = [27, 23, 30, 24, 29, 25, 28];
    var pts = [];
    for (var i = 0; i <= segs; i++) { pts.push([xs[i % xs.length], i / segs * 1000]); }
    var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
    for (var j = 1; j < pts.length; j++) {
      var p0 = pts[j - 1], p1 = pts[j], cy = (p0[1] + p1[1]) / 2;
      d += ' C ' + p0[0] + ' ' + cy + ', ' + p1[0] + ' ' + cy + ', ' + p1[0] + ' ' + p1[1];
    }
    return '<svg class="spine" viewBox="0 0 54 1000" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  function setProgress(goal) {
    var pf = document.getElementById('pfill');
    var cap = document.getElementById('pcap');
    if (!pf || !cap) return;
    var trackId = ROUTE_TRACK[goal];
    if (USER_TRACKS && trackId && USER_TRACKS[trackId]) {
      var t = USER_TRACKS[trackId];
      pf.style.width = '0';
      setTimeout(function () { pf.style.width = t.pct + '%'; }, 60);
      cap.innerHTML = '<b>You:</b> ' + t.pct + '% to the ' + (t.name || 'certificate') +
        ' certificate &middot; ' + t.solved + '/' + t.total + ' exercises solved.';
    } else if (USER_TRACKS) {
      pf.style.width = '0';
      cap.innerHTML = '<b>You:</b> signed in, complete exercises in these paths and your progress shows up here.';
    } else {
      pf.style.width = '0';
      cap.innerHTML = 'Sign in to track your place on this route.';
    }
  }

  function render(goal) {
    var r = ROUTES[goal];
    if (!r || !routeEl) return;
    activeGoal = goal;
    var html = spineHTML(r.stages.length);
    r.stages.forEach(function (s, i) { html += stageHTML(s, i); });
    html += finishHTML(r.cert);
    routeEl.innerHTML = html;

    var spineSvg = routeEl.querySelector('.spine');
    var finishNode = routeEl.querySelector('.finish .node');
    if (spineSvg && finishNode) {
      var routeTop = routeEl.getBoundingClientRect().top;
      var nodeRect = finishNode.getBoundingClientRect();
      var endPx = (nodeRect.top + nodeRect.height / 2) - routeTop - 6;
      spineSvg.style.height = (endPx > 0 ? endPx : 0) + 'px';
    }

    var rt = document.getElementById('routeTitle');
    if (rt) rt.innerHTML = r.title;
    var rm = document.getElementById('routeMeta');
    if (rm) rm.innerHTML = '<b>' + r.stages.length + '</b> stages &middot; <b>' + r.weeks +
      '</b> at a steady pace &middot; ends in 1 certificate';

    setProgress(goal);
  }

  var goalsEl = document.getElementById('goals');
  if (goalsEl) goalsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.goal');
    if (!b) return;
    goalsEl.querySelectorAll('.goal').forEach(function (g) {
      g.classList.remove('on'); g.setAttribute('aria-selected', 'false');
    });
    b.classList.add('on'); b.setAttribute('aria-selected', 'true');
    render(b.dataset.goal);
  });

  if (routeEl) render('new');

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
            total: Number(t.total_exercises) || 0,
            name: t.name
          };
        });
        try { setProgress(activeGoal); } catch (_) { }
      })
      .catch(function () { });
  }
  hydrate();
})();
