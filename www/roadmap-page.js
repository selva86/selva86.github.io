// roadmap-page.js -- interactive route map (goal switcher) + signed-in progress.
// Vanilla JS, no libraries. Anon-safe; never throws. Reveal-on-scroll and dark
// mode come from the shared sections-v3.js, not here.
//
// Honesty note: stage nodes are NEUTRAL for everyone (no fake "done/you-are-here"
// state). The ONLY personalized element is the progress strip, filled from the
// real /api/me/tracks for the certification track each route leads to.
(function () {
  'use strict';

  var ROUTES = {
      new: {
        title:'The way in, <em>from scratch</em>',
        weeks:'~6 weeks', here:2,
        cert:{name:'R Fundamentals',
          blurb:'Pass the Fundamentals and dplyr mastery quizzes and you walk away with a verifiable certificate that proves you can hold your own in R.',
          quizzes:'2 mastery quizzes'},
        stages:[
          {path:'Learn R', count:29, title:'Get fluent with the language first',
           why:'Before anything clever, you need the grammar to read instead of decode. Twenty minutes here saves twenty hours of squinting at error messages.',
           time:'about a week', hub:'R Basics (15 problems)', tool:'R syntax cheat sheet',
           stops:['R Syntax 101','R Vectors','R Data Frames','Writing R Functions']},
          {path:'Learn R', count:29, title:'Learn to look before you leap',
           why:'You came this far, good. Now the unglamorous habits that separate people who finish from people who flail: subsetting, getting help, and structuring a project so future-you can find anything.',
           time:'a few days', hub:'R Subsetting (10 problems)', tool:'R project starter',
           stops:['R Subsetting','Getting Help in R','R Project Structure']},
          {path:'Data Wrangling', count:24, title:'Bend messy data to your will',
           why:'Real data never arrives clean. This is the stage where R stops feeling like a toy and starts feeling like a power tool. The dplyr verbs here are the ones you will reach for daily.',
           time:'about a week', hub:'dplyr (15 problems)', tool:'dplyr verb picker',
           stops:['Importing Data','dplyr filter & select','dplyr group_by & summarise','Tidy Data']},
          {path:'Visualization', count:39, title:'Make a chart that earns a second look',
           why:'Once the grammar of graphics clicks, you stop memorizing chart recipes and start composing them. One idea that pays off in every chart you make after.',
           time:'about a week', hub:'ggplot2 (15 problems)', tool:'ggplot2 colour picker',
           stops:['Grammar of Graphics','ggplot2 Getting Started','Scatter Plots','Bar Charts']},
          {path:'Statistics', count:130, title:'Say something true about your data',
           why:'You can now load, clean and draw it. The last step in is reasoning under uncertainty: descriptive stats, correlation, and your first regression. A small bite of the deepest path here.',
           time:'a week or two', hub:'Confidence Interval (10 problems)', tool:'p-value interpreter',
           stops:['Descriptive Statistics','Correlation Analysis','Hypothesis Testing','Linear Regression']}
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
           stops:['R Syntax 101','R Data Frames','R Subsetting','R for Excel Users']},
          {path:'Data Wrangling', count:24, title:'The core craft of the job',
           why:'This is where an analyst lives. filter, mutate, group, summarise, join, reshape. Get fluent here and most of every analysis you run stops feeling like work.',
           time:'about two weeks', hub:'dplyr (15 problems)', tool:'dplyr verb picker',
           stops:['dplyr filter & select','dplyr group_by & summarise','R Joins','pivot_longer & pivot_wider']},
          {path:'Visualization', count:39, title:'Turn a table into an argument',
           why:'A number in a cell convinces no one. This stage is the grammar of graphics plus the charts that actually move a meeting: distributions, comparisons, and clean publication-ready output.',
           time:'about a week', hub:'ggplot2 (15 problems)', tool:'chart type chooser',
           stops:['Grammar of Graphics','Bar Charts','Distribution Charts','Publication-Ready Figures']},
          {path:'Visualization', count:39, title:'Find the story before you tell it',
           why:'Good analysts explore before they conclude. A repeatable EDA framework keeps you honest, catches the outlier that would have embarrassed you, and tells you what is actually worth charting.',
           time:'about a week', hub:'EDA Exercises in R', tool:'summary stats explorer',
           stops:['EDA (7-Step Framework)','Univariate EDA','Bivariate EDA','Correlation Analysis']}
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
           stops:['dplyr filter & select','dplyr group_by & summarise','R Joins','Missing Values (NA)']},
          {path:'Statistics', count:130, title:'Understand the machine before you trust it',
           why:'Every model you will use is regression wearing a costume. Build the intuition here, on linear and logistic regression and their diagnostics, and the rest of ML stops being magic.',
           time:'about three weeks', hub:'Linear Regression (15 problems)', tool:'regression diagnostics tool',
           stops:['Linear Regression','Logistic Regression','Regression Diagnostics','Feature Selection']},
          {path:'Statistics', count:130, title:'See the shape of your data',
           why:'Before you predict, you reduce and group. PCA and clustering teach you to find structure you did not know was there, the unsupervised half that every good modeller leans on.',
           time:'about two weeks', hub:'Clustering Exercises (10 problems)', tool:'PCA explorer',
           stops:['PCA with prcomp()','Interpreting PCA Output','Clustering (k-Means / HC / DBSCAN)','t-SNE and UMAP']},
          {path:'Statistics', count:130, title:'Build models that hold up out of sample',
           why:'A model that fits your training data is easy. One that survives new data is the whole point. Regularization, the right validation, and the discipline to not fool yourself.',
           time:'about two weeks', hub:'Cross Validation Exercises', tool:'model comparison board',
           stops:['Ridge & Lasso Regression','Model Selection','Poisson Regression','Variable Selection']}
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
           stops:['Random Variables','Normal, t, F, Chi-Squared','Central Limit Theorem','Sampling Distributions']},
          {path:'Statistics', count:130, title:'Choose and run the right test',
           why:'The hardest part of inference is picking the correct test, not running it. This stage is a decision framework plus the workhorses: t-tests, chi-square, and honest handling of multiple comparisons.',
           time:'about two weeks', hub:'Hypothesis Testing Exercises', tool:'which-test chooser',
           stops:['Hypothesis Testing','Choosing the Right Test','t-Tests','Multiple Testing Correction']},
          {path:'Statistics', count:130, title:'Model effects, not just differences',
           why:'A p-value tells you something happened. Regression and ANOVA tell you how much, controlling for what. This is where your analysis starts answering the question a reviewer will actually ask.',
           time:'about two weeks', hub:'ANOVA Exercises (15 problems)', tool:'effect size calculator',
           stops:['Linear Regression Assumptions','Interaction Effects','One-Way ANOVA','Post-Hoc Tests After ANOVA']},
          {path:'Reporting', count:18, title:'Write it up so it survives scrutiny',
           why:'Brilliant analysis dies in a sloppy methods section. The last stage turns your work into something reproducible and submittable: clean tables, reported statistics, and uncertainty stated plainly.',
           time:'about a week', hub:'R Markdown Exercises', tool:'regression table builder',
           stops:['Reporting Statistics','Regression Tables (3 packages)','Communicating Uncertainty','Reproducibility']}
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
           stops:['R Vectors','R Data Frames','R Subsetting','lubridate']},
          {path:'Visualization', count:39, title:'Learn to read a series by eye',
           why:'Half of forecasting is looking. Before any model, you train your eye on line charts and trends, because a model that contradicts what the plot plainly shows is a model you have mis-specified.',
           time:'a few days', hub:'ggplot2 (15 problems)', tool:'chart type chooser',
           stops:['Line Charts','geom_smooth()','Grammar of Graphics','Secondary Axis']},
          {path:'Statistics', count:130, title:'Borrow the stats that forecasting leans on',
           why:'Forecasting rests on autocorrelation, stationarity and a feel for uncertainty intervals. A short, targeted detour through the stats path so the ARIMA stage actually makes sense.',
           time:'about a week', hub:'Correlation Exercises in R', tool:'distribution playground',
           stops:['Correlation Analysis','Confidence Intervals','Descriptive Statistics','Bootstrap (boot package)']},
          {path:'Time Series', count:4, title:'Decompose, model, and forecast',
           why:'Now the payoff. Pull a series apart into trend and season, fit a model that respects its order, and produce a forecast with honest intervals. The whole route was aimed here.',
           time:'about two weeks', hub:'Time Series Exercises in R', tool:'forecast horizon tool',
           stops:['Time Series Analysis','Time Series Forecasting','More Time Series Forecasting']}
        ]
      }
    };

  // Each route leads toward one certification track (null = no single track, e.g. time series).
  var ROUTE_TRACK = {
    'new': 'r-fundamentals',
    'analyst': 'tidyverse-practitioner',
    'ml': 'machine-learning',
    'researcher': 'statistics-for-ds',
    'ts': null
  };

  var USER_TRACKS = null;   // {id: {pct, solved, total, name}} once signed in
  var activeGoal = 'new';
  var routeEl = document.getElementById('route');

  function stageHTML(s, idx) {
    var stops = s.stops.map(function (t) {
      return '<a class="stop" href="/tutorials/">' +
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
