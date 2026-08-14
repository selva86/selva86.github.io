# The daily lesson series: written emails (seq 0-37)

Every written sequence email: subject, preheader, body. Machine copy:
`functions/_data/nurture-emails.json` (dashboard edits override via KV).
Voice v3: conversational, no em dashes, honest 3-day window. Regenerated
2026-08-16; supersedes nurture-week-one-emails.md.

## seq 0 - public

- **Subject:** Write your first R script in 10 minutes
- **Preheader:** Ten minutes, zero installs, real working code.

```
Hi {first_name},

Everyone remembers writing their first bit of code. Today's a good day for yours.

There's nothing to install and no setup to fight with. You write R right in the browser, it runs instantly, and about ten minutes from now you'll have a small script that reads some data and answers a question.

[Write your first R script -> {url}]

That's genuinely all there is to it. See you tomorrow with something useful.

Akshay
```

## seq 1 - lesson (inference-from-zero)

- **Subject:** How statistical inference works, no formulas yet
- **Preheader:** The logic behind every test you'll ever run, with zero formulas.

```
Hi {first_name},

Here's a secret nobody tells beginners: every statistical test you'll ever run, t-tests, ANOVA, all of them, is really the same one idea wearing different clothes.

Most courses bury that idea under formulas in week one, and plenty of people use the tests for years without ever seeing it. This lesson does the opposite. No formulas at all, just the reasoning: how a careful skeptic looks at data and decides what to believe.

Once this clicks, everything that follows gets easier.

[Start the lesson -> {url}]

It's open for you for the next 3 days, and it takes about 15 minutes.

Akshay
```

## seq 2 - lesson (inference-from-zero)

- **Subject:** What p-values mean (and what they never meant)
- **Preheader:** The most misunderstood number in statistics, finally straight.

```
Hi {first_name},

Let me ask you something. If a result comes back with p = 0.03, does that mean there's a 3% chance it's a fluke?

It doesn't, and most people who use p-values every day get this wrong. Journals have written entire editorials about the confusion.

Today's lesson clears it up with a simulation you run yourself. Once you've watched it happen, you can't really unsee it, and you'll read p-values correctly for the rest of your career.

[See what p-values actually mean -> {url}]

Open for 3 days. Yesterday's lesson helps but isn't required.

Akshay
```

## seq 3 - lesson (inference-from-zero)

- **Subject:** Confidence intervals: what they really mean
- **Preheader:** What that 95% actually promises, shown by simulation.

```
Hi {first_name},

You've probably nodded along to a sentence like "we're 95% confident the true value is between 4.2 and 7.8" without being completely sure what the 95% is promising. Almost everyone has. It's one of those things people quietly avoid asking about.

In today's lesson you build intervals yourself and watch which ones catch the truth and which ones miss. After that, you can explain the 95% to anyone who asks, which happens to be a favourite interview question.

[Understand confidence intervals -> {url}]

Open for the next 3 days.

Akshay
```

## seq 4 - lesson (arima-from-zero)

- **Subject:** ARIMA: what AR, I, and MA actually mean
- **Preheader:** The forecasting workhorse, decoded piece by piece.

```
Hi {first_name},

ARIMA looks like alphabet soup until someone shows you what each letter is doing. After that it becomes the most dependable forecasting tool you own.

AR, I and MA are three small ideas, and today's lesson takes them one at a time, each with a live chart you can play with. By the end you'll read something like ARIMA(2,1,1) the way you'd read a sentence.

If your work touches anything that moves over time, sales, traffic, sensor readings, this is the foundation for all of it.

[Decode ARIMA -> {url}]

Open for 3 days. This starts a new thread, no prerequisites.

Akshay
```

## seq 5 - lesson (reading-model-output)

- **Subject:** Interaction effects: test and interpret them
- **Preheader:** When one variable changes what another one does.

```
Hi {first_name},

Does the medicine work? Well, it depends on the dose. Does the ad work? Depends on who sees it. The moment an effect depends on something else, you're looking at an interaction, and models that ignore them give confidently wrong answers.

Today you'll learn to spot when an interaction is hiding in your data, add it to a model properly, and, the part nobody teaches well, interpret the result without tying your brain in knots.

[Master interaction effects -> {url}]

Open for the next 3 days.

Akshay
```

## seq 6 - public

- **Subject:** 50 R interview questions and answers
- **Preheader:** The ones that actually get asked, with runnable answers.

```
Hi {first_name},

Something a bit different today, more of a bookmark than a lesson.

It's fifty real R interview questions, each with a worked answer you can actually run. Not trivia, the kind that really get asked: vectors versus lists, how apply differs from a loop, what a factor actually is.

Even with no interview on the horizon, skimming these is the quickest self-audit of your R fundamentals I know of.

[Browse the 50 questions -> {url}]

This one's a regular page, no clock on it. Save it, share it.

Akshay
```

## seq 7 - lesson (inference-from-zero)

- **Subject:** Power analysis: find the sample size you need
- **Preheader:** Stop guessing your sample size. Calculate it.

```
Hi {first_name},

"How many observations do I need?" is probably the most expensive question in statistics to get wrong. Too few and your study can't see the effect that's really there. Too many and you've burned time and budget for nothing.

Power analysis answers it before you collect a single data point. In today's lesson you'll run one, read the power curve, and walk away with a number you can defend to a boss, a reviewer or an ethics board.

[Find your sample size -> {url}]

Open for the next 3 days. This one pays off the p-value lesson from earlier in the week.

Akshay
```

## seq 8 - lesson (which-test)

- **Subject:** Which statistical test to use? A 5-question decision flowchart
- **Preheader:** Five questions, and the right test falls out the bottom.

```
Hi {first_name},

Ever frozen at the "which test do I run" moment? You're comparing two groups, or maybe three, the data might not be normal, and suddenly every textbook chapter looks the same.

Today's lesson gives you a flowchart instead. You answer five plain questions about your data and the right test falls out the bottom. We'll walk real examples through it so the questions themselves start to feel natural.

People keep this one open in a tab for years.

[Get the flowchart -> {url}]

Open for the next 3 days.

Akshay
```

## seq 9 - lesson (foundations-extras)

- **Subject:** Conditional probability: P(A given B), made concrete
- **Preheader:** The probability idea behind medical tests, spam filters and Bayes.

```
Hi {first_name},

A test for a rare disease is 99% accurate. You test positive. How worried should you be?

Much less than you'd think, and the reason is conditional probability, the single most useful idea in everyday statistics. It's behind medical screening, spam filters and every Bayesian method you'll ever meet.

Today you'll compute P(A given B) on concrete examples, including that disease test, until the notation stops being scary and starts being obvious.

[Make conditional probability concrete -> {url}]

Open for the next 3 days.

Akshay
```

## seq 10 - lesson (arima-from-zero)

- **Subject:** ACF and PACF: how to read the plots for ARIMA orders
- **Preheader:** The two plots that tell you your ARIMA orders.

```
Hi {first_name},

Back to the forecasting thread. Last time you learned what AR, I and MA mean. The natural next question is: for my series, how many of each?

The answer is sitting in two plots, the ACF and the PACF, and once someone shows you the reading rules they're surprisingly friendly. Spikes here mean AR terms, a cutoff there means MA terms.

Today you'll read both plots on real series until the patterns jump out at you.

[Learn to read ACF and PACF -> {url}]

Open for the next 3 days.

Akshay
```

## seq 11 - lesson (regression-health-check)

- **Subject:** Multicollinearity: why your coefficients look wrong, and the fix
- **Preheader:** When two predictors tell the same story, your coefficients lie.

```
Hi {first_name},

Here's an unsettling one. You add a sensible predictor to your regression and suddenly another coefficient flips sign, or a variable you know matters shows up as insignificant. The model isn't broken. Your predictors are just telling the same story twice.

That's multicollinearity. Today you'll learn to detect it with VIF in one line, understand what it does and doesn't ruin, and fix it without throwing away good variables.

[Diagnose multicollinearity -> {url}]

Open for the next 3 days.

Akshay
```

## seq 12 - lesson (inference-from-zero)

- **Subject:** Hypothesis testing: the framework, explained
- **Preheader:** Null, alternative, rejection: the full framework, finally in order.

```
Hi {first_name},

You've met pieces of hypothesis testing already this month: p-values, the skeptic's logic. Today the pieces click together into the full framework, null and alternative, test statistic, rejection region, the whole machine.

Once you see the machine as one thing, every test you'll ever run is just this framework with different parts bolted in. That's the real payoff: learn it once, reuse it forever.

[See the whole framework -> {url}]

Open for the next 3 days.

Akshay
```

## seq 13 - lesson (which-test)

- **Subject:** Welch's ANOVA: the test for unequal group variances
- **Preheader:** Unequal variances? There's a test built exactly for that.

```
Hi {first_name},

Classic ANOVA quietly assumes all your groups have roughly the same spread. Real data rarely got that memo, and when the spreads differ, the classic test starts giving wrong answers without warning you.

Welch's ANOVA is the fix, and honestly it's what many statisticians now use by default. Today you'll see when the classic version breaks, run Welch's version, and know which to reach for from now on.

[Run Welch's ANOVA -> {url}]

Open for the next 3 days.

Akshay
```

## seq 14 - public

- **Subject:** A survey analysis, end to end in R
- **Preheader:** Messy raw answers to finished findings, one real project.

```
Hi {first_name},

Today's a treat day: a complete survey analysis, start to finish, on one page.

It begins with messy raw responses and walks all the way to finished findings: cleaning, recoding, weighting, the right tests for the right question types, and charts you could put in a report. It's the closest thing to sitting next to someone doing the real job.

[Work through the survey analysis -> {url}]

Regular page, no clock. A good one to bookmark for your next questionnaire.

Akshay
```

## seq 15 - lesson (inference-from-zero)

- **Subject:** Effect size: Cohen's d and friends, explained
- **Preheader:** Significant is not the same as big. Here's the number that says big.

```
Hi {first_name},

A tiny effect becomes "statistically significant" if you just collect enough data. So when a result matters, reviewers and smart bosses ask a different question: how big is the effect?

That's what Cohen's d and its friends measure. Today you'll compute them, learn the honest interpretation ranges, and see why a p-value and an effect size together tell a story neither can tell alone.

[Measure effect sizes -> {url}]

Open for the next 3 days.

Akshay
```

## seq 16 - lesson (foundations-extras)

- **Subject:** Expected value and variance, explained
- **Preheader:** The two numbers underneath every distribution you'll ever use.

```
Hi {first_name},

Expected value and variance sound like textbook furniture, but they're the two numbers underneath everything: every distribution, every estimator, every risk calculation.

Today you'll build both from scratch with dice and simulations, no calculus required, and see why the average of many random things becomes so reliable. That one insight quietly powers most of statistics.

[Understand expected value and variance -> {url}]

Open for the next 3 days.

Akshay
```

## seq 17 - lesson (arima-from-zero)

- **Subject:** How to choose ARIMA order (p, d, q): a practical guide
- **Preheader:** From two plots to a defensible (p, d, q).

```
Hi {first_name},

You can read ACF and PACF plots now, so let's put them to work: today you choose an actual ARIMA order, the (p, d, q), for real series.

There's a practical rhythm to it. Difference until stationary, read the plots, fit a couple of candidates, compare them honestly. By the end you'll have done the full dance a few times and the choice stops feeling like guesswork.

[Choose your ARIMA order -> {url}]

Open for the next 3 days.

Akshay
```

## seq 18 - lesson (arima-from-zero)

- **Subject:** ARIMA diagnostics: the two checks before you trust a forecast
- **Preheader:** Two checks decide whether your forecast deserves trust.

```
Hi {first_name},

A fitted model isn't a trustworthy model. Before you hand a forecast to anyone, two checks tell you whether the model actually captured the structure or just memorised some of it.

They're the residual plot and the Ljung-Box test, and together they take about a minute. Today you'll run both, see what healthy residuals look like, and catch a model that looks fine but isn't.

[Run the diagnostics -> {url}]

Open for the next 3 days.

Akshay
```

## seq 19 - lesson (regression-health-check)

- **Subject:** Autocorrelation in residuals: how to test and fix it
- **Preheader:** The residual pattern that quietly breaks your p-values.

```
Hi {first_name},

Here's a trap that catches even experienced modellers. When your data has a time order, the leftovers of your regression can be correlated with each other, and that quietly wrecks the p-values while everything looks normal on the surface.

Today you'll test for autocorrelated residuals with Durbin-Watson, see exactly what goes wrong when it's there, and fix it properly.

[Test your residuals -> {url}]

Open for the next 3 days.

Akshay
```

## seq 20 - lesson (which-test)

- **Subject:** Mann-Whitney U test: when and how to run it
- **Preheader:** The two-group test for data that refuses to be normal.

```
Hi {first_name},

Sometimes your data just refuses to be normal. Skewed incomes, reaction times, tiny samples. The t-test's assumptions creak, and you need its tougher cousin.

That's the Mann-Whitney U test. It compares two groups using ranks instead of raw values, so outliers and skew lose their power to mislead. Today you'll learn when to reach for it, how to run it, and how to report it properly.

[Run the Mann-Whitney test -> {url}]

Open for the next 3 days.

Akshay
```

## seq 21 - public

- **Subject:** Is R worth learning in 2026? The honest answer
- **Preheader:** The honest answer, with actual data.

```
Hi {first_name},

A lighter one today, and a question you've maybe asked yourself: is R still worth learning in 2026, with Python everywhere?

This piece answers it with actual data rather than opinions: job listings, salary numbers, where R genuinely wins and where it honestly doesn't. Useful ammunition next time someone at work raises an eyebrow.

[Read the honest answer -> {url}]

Regular page, no clock on this one.

Akshay
```

## seq 22 - lesson (reading-model-output)

- **Subject:** Linear regression assumptions: the 5 checks
- **Preheader:** Five checks before you trust any regression.

```
Hi {first_name},

Every linear regression makes five promises about your data behind your back. When they hold, your inferences are solid. When one breaks, your confidence intervals and p-values can be quietly fictional.

Today you'll run the five checks on a real model, learn to read each diagnostic plot, and know exactly what to do when a check fails. This is the routine that separates careful modellers from hopeful ones.

[Check your regression -> {url}]

Open for the next 3 days.

Akshay
```

## seq 23 - lesson (foundations-extras)

- **Subject:** Law of Large Numbers vs CLT: the real difference
- **Preheader:** Two famous theorems, constantly confused, actually different.

```
Hi {first_name},

The Law of Large Numbers and the Central Limit Theorem get mixed up constantly, even in textbooks, and the confusion matters because they justify different things.

One says averages settle down. The other says how they wobble on the way. Today you'll watch both happen in simulations, side by side, and the difference will finally stick.

[See both theorems in action -> {url}]

Open for the next 3 days.

Akshay
```

## seq 24 - lesson (arima-from-zero)

- **Subject:** Test stationarity: ADF, KPSS, and when to difference
- **Preheader:** Stationarity: the assumption every forecast quietly leans on.

```
Hi {first_name},

Every forecasting model you've met this month quietly assumes your series is stationary, meaning its behaviour isn't drifting over time. Feed it a trending series and it will happily produce nonsense.

Today you'll test stationarity properly with ADF and KPSS, understand why the two tests can disagree, and learn when differencing fixes things and when it doesn't.

[Test your series -> {url}]

Open for the next 3 days.

Akshay
```

## seq 25 - lesson (arima-from-zero)

- **Subject:** ARIMAX: add outside variables to your ARIMA forecast
- **Preheader:** Your forecast knows about the past. Tell it about promotions.

```
Hi {first_name},

Plain ARIMA only knows a series' own past. But sales respond to promotions, demand responds to weather, and your forecast gets sharper the moment you tell it about those outside forces.

That's ARIMAX, and it's a small step from what you already know. Today you'll add external regressors to a real forecast and watch the accuracy improve.

[Add outside variables -> {url}]

Open for the next 3 days.

Akshay
```

## seq 26 - lesson (regression-health-check)

- **Subject:** Robust regression: when outliers bite
- **Preheader:** One wild point can drag your whole line. Here's the fix.

```
Hi {first_name},

Ordinary regression has a soft spot: it minimises squared errors, so one wild outlier can drag the entire line toward itself. Sometimes that one point rewrites your conclusions.

Robust regression fixes this by refusing to let any single point shout that loudly. Today you'll fit one with rlm(), compare it against the ordinary fit, and know when each is the right choice.

[Fit a robust regression -> {url}]

Open for the next 3 days.

Akshay
```

## seq 27 - lesson (regression-health-check)

- **Subject:** Cook's distance: find the points that change your model
- **Preheader:** Find the data points that are steering your model.

```
Hi {first_name},

Here's a question worth asking of any model you care about: if I dropped one row, would my conclusions change? For most rows the answer is no. For a few, the answer can be alarmingly yes.

Cook's distance finds those rows. Today you'll compute it, see the influence plots, and learn the honest protocol for what to do with an influential point, because deleting it is usually the wrong move.

[Find your influential points -> {url}]

Open for the next 3 days.

Akshay
```

## seq 28 - lesson (which-test)

- **Subject:** Fisher's exact test: when and how, with a worked example
- **Preheader:** Small samples, exact answer, no approximations.

```
Hi {first_name},

Chi-square tests get unreliable when your table has small counts, and "expected cell count less than 5" is one of the most common review complaints in applied research.

Fisher's exact test has no such problem. It computes the exact probability, no approximations, which makes it the right tool for small tables. Today you'll work a real example end to end, including how to report it.

[Run Fisher's exact test -> {url}]

Open for the next 3 days.

Akshay
```

## seq 29 - public

- **Subject:** R for finance: 25 real practice problems
- **Preheader:** 25 finance problems, real workflows, graded in the browser.

```
Hi {first_name},

Treat day. Twenty-five practice problems from the world of finance: returns, portfolios, risk, the workflows analysts actually run in R.

Even if finance isn't your field, these are wonderful practice because the data is real-world messy and the questions have stakes. Every one grades itself in the browser.

[Try the finance problems -> {url}]

Regular page, no clock. Chip away at your own pace.

Akshay
```

## seq 30 - lesson (bayesian-decisions)

- **Subject:** Bayes' theorem: the simulation that makes it click
- **Preheader:** The theorem behind every spam filter, made visible.

```
Hi {first_name},

Bayes' theorem has a reputation for being deep and difficult. It's actually one line of arithmetic about updating your beliefs when new evidence arrives, and it runs everything from spam filters to medical diagnosis.

Today you'll watch it work in a simulation you control, evidence in, belief updated, until the famous formula feels less like algebra and more like common sense written down.

[Watch Bayes' theorem click -> {url}]

Open for the next 3 days.

Akshay
```

## seq 31 - lesson (resampling)

- **Subject:** Permutation tests: exact p-values without formulas
- **Preheader:** Shuffle your data, get an exact p-value. No formulas needed.

```
Hi {first_name},

Here's the most intuitive idea in all of statistical testing: if the groups really don't differ, then shuffling the labels shouldn't matter. So shuffle them a few thousand times and see how unusual your actual result is.

That's a permutation test. No distributional assumptions, no formula lookup, just an exact answer built from your own data. Once you've run one, a lot of classical statistics suddenly makes more sense.

[Run a permutation test -> {url}]

Open for the next 3 days.

Akshay
```

## seq 32 - lesson (resampling)

- **Subject:** Bootstrap confidence intervals: for any statistic
- **Preheader:** A confidence interval for anything you can compute.

```
Hi {first_name},

Textbooks give you confidence interval formulas for means and proportions, and then real work asks you for an interval on a median, a ratio, a correlation, things the formulas never covered.

The bootstrap handles all of them the same way: resample your own data, recompute, repeat, and read the interval off the results. Today you'll bootstrap intervals for statistics that have no formula at all.

[Bootstrap an interval -> {url}]

Open for the next 3 days.

Akshay
```

## seq 33 - lesson (bayesian-decisions)

- **Subject:** Choosing priors: the decision that matters
- **Preheader:** The decision every Bayesian analysis starts with.

```
Hi {first_name},

Every Bayesian analysis starts with a decision people love to argue about: the prior. What you believe before seeing the data. Choose carelessly and you bias the result. Refuse to choose and you've just chosen a different prior without admitting it.

Today you'll see how much priors actually matter, when they wash out, when they don't, and the practical rules for choosing defensibly.

[Choose your priors -> {url}]

Open for the next 3 days.

Akshay
```

## seq 34 - lesson (bayesian-decisions)

- **Subject:** The Bayesian t-test: measure evidence, not just significance
- **Preheader:** How much evidence do you actually have? This test says.

```
Hi {first_name},

A classical t-test can reject a hypothesis, but it can never tell you how much evidence you have for it. Oddly, it can't support the null at all, only fail to reject it.

The Bayesian t-test can do both. It gives you a Bayes factor, a number that says how strongly your data favours one hypothesis over the other, in either direction. Today you'll run one and read that number with confidence.

[Measure the evidence -> {url}]

Open for the next 3 days.

Akshay
```

## seq 35 - lesson (bayesian-decisions)

- **Subject:** Credible vs confidence intervals: the difference that matters
- **Preheader:** Two intervals, nearly identical names, different promises.

```
Hi {first_name},

Remember the confidence interval lesson, and how careful we had to be about what the 95% promises? Bayesian credible intervals promise the thing everyone wishes confidence intervals meant: there's a 95% probability the value is in here.

Today you'll build both kinds on the same data, see where they agree and where they split, and know exactly which sentence you're allowed to say about each.

[Compare the two intervals -> {url}]

Open for the next 3 days.

Akshay
```

## seq 36 - lesson (beyond-straight-lines)

- **Subject:** Segmented regression: find the breakpoints
- **Preheader:** Your data changed direction somewhere. Find exactly where.

```
Hi {first_name},

Some relationships aren't one straight line, they're two. Sales grow slowly until a threshold, then take off. A treatment works until a dose, then plateaus. The interesting question is where the change happens.

Segmented regression finds that breakpoint for you, with a confidence interval around it. Today you'll fit one on real data and locate the moment the pattern changed.

[Find the breakpoint -> {url}]

Open for the next 3 days.

Akshay
```

## seq 37 - lesson (which-test)

- **Subject:** Chi-square tests: which one to use and how
- **Preheader:** Three chi-square tests, one clear guide to which and when.

```
Hi {first_name},

"The chi-square test" is actually three different tests wearing the same name: one checks independence between two variables, one compares a distribution against expectations, and one tests homogeneity across groups.

Mix them up and your conclusion answers a question nobody asked. Today you'll learn to tell them apart in seconds and run each one properly.

[Sort out chi-square -> {url}]

Open for the next 3 days.

Akshay
```
