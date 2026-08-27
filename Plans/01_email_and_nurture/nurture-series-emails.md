# The daily lesson series: written emails (seq 0-37)

Every written sequence email: subject, preheader, body. Machine copy:
`functions/_data/nurture-emails.json` (dashboard edits override via KV).
Voice v5 (2026-08-16): every email carries ONE named, numbered, everyday
example (the taste test, the pizza delivery window, the billionaire in the
salary survey), plain words over jargon, warm-up + thread continuity kept
from v4, no em dashes.

## seq 0 - public

- **Subject:** Write your first R script in 10 minutes
- **Preheader:** Ten minutes, zero installs, real working code.

```
Hi {first_name},

Everyone remembers writing their first bit of code. Today is a good day for yours.

Because there is nothing to install and no setup to worry about. You type R right in the browser and it runs instantly. 

Ten minutes from now you will have a small script that takes a year of monthly sales numbers and answers a simple question: which month was the best, and by how much? Learning to do this should get you setup for many great things that will follow.

[Write your first R script -> {url}]

That is genuinely all there is to it. See you tomorrow with something useful.

Akshay
```

## seq 1 - lesson (inference-from-zero)

- **Subject:** How statistical inference works, no formulas yet
- **Preheader:** A friend claims she can taste the difference. Nine out of ten. Believe her?

```
Hi {first_name},

Let me start with a simple bet. A friend claims she can tell Coke from Pepsi by taste. You pour ten cups, she gets nine right. Is she skilled, or just lucky?

Whatever reasoning you just gave about that, you already did statistical inference. Every test you will ever run, t-tests, ANOVA, all of them, is that same idea made more structured: how surprising would this result be if it were just luck?

Today's lesson builds that idea up properly, with zero formulas. Once it clicks, everything that follows this month gets easier.

[Start the lesson -> {url}]

Open for you for the next 3 days. About 15 minutes.

Akshay
```

## seq 2 - lesson (inference-from-zero)

- **Subject:** What p-values mean (and what they never meant)
- **Preheader:** The most misunderstood number in statistics, finally straight.

```
Hi {first_name},

Let's say you test a new checkout page on your website. Sales go up a little, and the test says p = 0.03. Does that mean there is a 3% chance the improvement was a fluke?

It does not.

And most people who use p-values every day read them exactly that wrong way. The real meaning is subtler: if the new page changed nothing at all, results this good would show up only 3% of the time by luck.

Little mind bending right? I know

Today you will see through the matrix, I mean, you will truly grasp the intuition and never misread a p-value again.

[See what p-values actually mean -> {url}]

Open for 3 days. Yesterday's lesson helps but is not required.

Akshay
```

## seq 3 - lesson (inference-from-zero)

- **Subject:** Confidence intervals: what they really mean
- **Preheader:** What that 95% actually promises, shown with delivery times.

```
Hi {first_name},

Imagine your pizza place says this: "we are 95% confident the average delivery takes between 22 and 30 minutes." 

Sounds precise. But what is the 95% actually promising? 

That 95% of pizzas arrive in that window? or that there is a 95% chance the true average is in there?

Strangely, neither of those is exactly right. And almost everyone who uses confidence intervals have quietly avoided asking.

Today you will build intervals yourself from repeated samples of delivery times and watch which intervals catch the true average and which miss. After that, you can explain the 95% to anyone. It happens to be a favourite interview question too. Don't miss this.

[Understand confidence intervals -> {url}]

Open for the next 3 days.

Akshay
```

## seq 4 - lesson (arima-from-zero)

- **Subject:** ARIMA: what AR, I, and MA actually mean
- **Preheader:** Forecast a coffee shop's sales, and ARIMA stops being alphabet soup.

```
Hi {first_name},

Let's consider a coffee shop's daily sales and you observe this: Busy days tend to follow busy days, a random rush yesterday still echoes a little today, and overall business is slowly growing. Those three essentially are the AR, the MA and the I in ARIMA.

That is the core idea. 

ARIMA looks like soup until you build the intuition for each letter to something you have seen in real life, and today's lesson does exactly that with charts you can work with.

By the end, ARIMA(2,1,1) reads like a sentence: today depends on the last two days, the trend was removed once, and one day of random noise still echoes.

[Decode ARIMA -> {url}]

Open for 3 days. New thread, no prerequisites.

Akshay
```

## seq 5 - lesson (reading-model-output)

- **Subject:** Interaction effects: test and interpret them
- **Preheader:** The coupon works, but only for new customers. That's an interaction.

```
Hi {first_name},

You have had a lot of new ideas thrown at you this week, so today's is one you already know from real life. 

Typically, a discount coupon increases sales, but mostly for new customers. Because, regulars would have bought anyway. So the question "does the coupon work?" has no single answer: the effect depends on who gets the coupon. 

Right? 

That is an interaction in real life and a model that ignores it will happily report an average effect that is wrong for both groups.

Today you will learn to spot interactions in real data, add them to a model, and read the result without tying your brain in knots.

[Master interaction effects -> {url}]

Open for 3 days, as always.

Akshay
```

## seq 6 - public

- **Subject:** 50 R interview questions and answers
- **Preheader:** The ones that actually get asked, with runnable answers.

```
Hi {first_name},

It has been a dense week, so no lesson today. Instead, here's something people keep coming back to.

Fifty real R interview questions with worked answers you can run. Not trivia, the genuinely asked kind.

No interview on the horizon? Skimming them is still the fastest check of your R fundamentals I know.

[Browse the 50 questions -> {url}]

Regular page, no clock. Back to lessons tomorrow.

Akshay
```

## seq 7 - lesson (inference-from-zero)

- **Subject:** Power analysis: find the sample size you need
- **Preheader:** Will 40 patients be enough to see the effect? Find out before you start.

```
Hi {first_name},

Remember the p-value lesson from earlier in the week? Today it starts to pay off.

Let's suppose a clinic is testing whether a new exercise program lowers blood pressure by around 10 points. They can recruit 40 patients. 

But is that count actually enough to detect if the improvement is real? If you run the study without considering this, you might very well waste the whole analysis. Power analysis answers the question before even starting it. 

Today you will learn how to run one and walk away knowing how to determine the exact sample size needed.

[Find your sample size -> {url}]

Open for the next 3 days.

Akshay
```

## seq 8 - lesson (which-test)

- **Subject:** Which statistical test to use? A 5-question decision flowchart
- **Preheader:** Five questions, and the right test falls out the bottom.

```
Hi {first_name},

Consider this: You have average order values from three branches of a store and someone asks, "is the difference real?". In other words, does one store actually do better than the other? 

And you freeze.

Because you know there are a dozen tests you could possibly do and you are not sure which one this situation precisely needs.

Today's lesson replaces the freeze with a flowchart. Ask these five plain questions about your data: how many groups, are they paired, is the data roughly normal, and so on. Answer them and you will have the right test standing in front of you. 

We will walk through simple examples, plus a few others, until the questions feel at home.

[Get the flowchart -> {url}]

Open for 3 days.

Akshay
```

## seq 9 - lesson (foundations-extras)

- **Subject:** Conditional probability: P(A given B), made concrete
- **Preheader:** You test positive for a rare disease. How worried should you be?

```
Hi {first_name},

Let's do a small puzzle before today's lesson, because it is one of the best in all of statistics.

Here it is: A disease affects 1 person in 1,000 and the test for it is 99% accurate. You take the test and your result comes back positive. How worried should you be? 

Most people say very. 

But here is the real answer: your chance of having it is still under 10%, because among 1,000 people the test frightens about ten healthy people for every one genuinely sick person it finds.

If that surprised you, today's lesson is going to be a good one. It is all conditional probability, the idea behind medical screening, spam filters and everything Bayesian we will do later. It is a foundational concept extremely useful in interviews.

[Work through the puzzle -> {url}]

Open for the next 3 days.

Akshay
```

## seq 10 - lesson (arima-from-zero)

- **Subject:** ACF and PACF: how to read the plots for ARIMA orders
- **Preheader:** Does yesterday's rush still echo today? Two plots answer it.

```
Hi {first_name},

Back to the coffee shop example from the ARIMA lesson earlier. You suspect busy days follow busy days. Remember?

But this time we want to know how far back does the echo reach or Does Monday still influence Thursday, or just till Tuesday?

Fair question right?

That is exactly what the ACF and PACF plots try to answer: how strongly today's sales correlate with 1, 2, 3 days ago. And those correlations are what tell you how many AR and MA terms your model needs. A tall spike at lag 1, then nothing, is the data saying "only yesterday matters."

Today you will learn to read both plots on real series until the patterns make sense and the exact mechanism behind it is crystal clear.

[Learn to read the plots -> {url}]

Open for 3 days.

Akshay
```

## seq 11 - lesson (regression-health-check)

- **Subject:** Multicollinearity: why your coefficients look wrong, and the fix
- **Preheader:** Square footage and room count tell the same story. Your model can't split the credit.

```
Hi {first_name},

Today, we have a small horror story from regression.

You are predicting house prices from square footage and number of rooms. Both obviously matter. But big houses have many rooms, so the two predictors move together, and the model cannot tell which one deserves the credit. 

The Result: coefficients flip signs, a variable you know matters looks useless, yet nothing is technically broken.

That is multicollinearity. 

Detecting it takes one line (the VIF), and today you will learn that line, what it does and does not ruin, and the fixes that do not throw away good variables.

[Diagnose it -> {url}]

Open for the next 3 days.

Akshay
```

## seq 12 - lesson (inference-from-zero)

- **Subject:** Hypothesis testing: the framework, explained
- **Preheader:** Innocent until proven guilty: you already know this framework.

```
Hi {first_name},

A quick look back first. You have met the taste-test logic, p-values and confidence intervals as separate ideas. Today they snap together into one machine, and the machine works exactly like a courtroom.

The defendant is presumed innocent (the null hypothesis: nothing is going on). The prosecution presents evidence (your data). And the jury only convicts if the evidence would be too surprising for an innocent person (the p-value falls below your threshold). Verdicts can be wrong in two directions, and that is the whole framework.

See it once as a courtroom and every test you ever run becomes the same trial with different evidence.

[See the whole framework -> {url}]

Open for 3 days.

Akshay
```

## seq 13 - lesson (which-test)

- **Subject:** Welch's ANOVA: the test for unequal group variances
- **Preheader:** One team has wild salaries, one doesn't. The classic test breaks.

```
Hi {first_name},

Here is something that surprises people. Say you compare average salaries across three departments. In two of them everyone earns similar amounts, but the third mixes juniors with a few highly paid specialists, so its numbers are all over the place.

Classic ANOVA quietly assumes all groups have similar spread, and in this situation it starts giving wrong answers without any warning. Welch's ANOVA handles unequal spreads properly, and plenty of statisticians argue it should simply be the default.

Today you will see exactly where the classic version breaks and run the version that does not.

[Run Welch's ANOVA -> {url}]

Open for the next 3 days.

Akshay
```

## seq 14 - public

- **Subject:** A survey analysis, end to end in R
- **Preheader:** Messy raw answers to finished findings, one real project.

```
Hi {first_name},

No new theory today. Instead I want to show you what all these pieces look like when they work together on a real job.

It is a complete survey analysis on one page: raw responses full of typos and skipped questions, then the cleaning, the recoding, the right test for each question type, and charts you could put straight into a report. The closest thing to sitting next to someone doing the actual work.

[Walk through the survey analysis -> {url}]

Regular page, no clock. Bookmark it for your next questionnaire.

Akshay
```

## seq 15 - lesson (inference-from-zero)

- **Subject:** Effect size: Cohen's d and friends, explained
- **Preheader:** Two diets, both 'significant'. One loses half a kilo, one loses five.

```
Hi {first_name},

You know how to test whether an effect exists. Today's question matters more in real life: how big is it?

Picture two diet studies, both reporting p < 0.05. In one, people lost half a kilo on average. In the other, five kilos. Same "significant" stamp, completely different meaning for anyone choosing a diet. With enough participants, even the half-kilo diet passes the test.

Effect sizes like Cohen's d are how you report the difference that actually matters. After today you will state results the way careful people do: is it real, and is it big, as two separate answers.

[Measure your effects -> {url}]

Open for 3 days.

Akshay
```

## seq 16 - lesson (foundations-extras)

- **Subject:** Expected value and variance, explained
- **Preheader:** Why a $2 scratch card is a bad deal, mathematically.

```
Hi {first_name},

Back to basics today, deliberately, with the two numbers underneath everything else this month.

A $2 scratch card usually pays nothing, sometimes pays $5, rarely pays $500. Is it a good deal? Expected value answers that (spoiler: the shop is not running a charity). And variance answers a different question: how bumpy is the ride on the way? Insurance, casinos and every estimator in statistics run on these two ideas.

Today you will build both from dice and simulations, no calculus anywhere, and a surprising amount of statistics stops feeling arbitrary.

[Build them from scratch -> {url}]

Open for the next 3 days.

Akshay
```

## seq 17 - lesson (arima-from-zero)

- **Subject:** How to choose ARIMA order (p, d, q): a practical guide
- **Preheader:** From two plots to a defensible (p, d, q).

```
Hi {first_name},

The forecasting thread continues, and today it gets practical: you choose an actual ARIMA order for a real series, the coffee-shop way.

The rhythm goes like this. First remove the growth trend so you are looking at ups and downs around a stable level. Then read your ACF and PACF plots from last time: how many days of echo do they show? Fit the two or three candidate models they suggest, and let a fair score pick the winner.

You will run that full loop today, and choosing (p, d, q) stops feeling like guesswork.

[Choose your first order -> {url}]

Open for 3 days.

Akshay
```

## seq 18 - lesson (arima-from-zero)

- **Subject:** ARIMA diagnostics: the two checks before you trust a forecast
- **Preheader:** Your model's leftovers should look like static. Here's how to check.

```
Hi {first_name},

A short one today, about an important habit.

After your model makes its predictions, look at what is left over: the gaps between predicted and actual. If the model truly captured the pattern, those leftovers should look like pure static, no shape, no rhythm. If there is still a pattern in them, your model missed something, and its forecasts will pay for it.

The eyeball check plus one formal test (Ljung-Box) takes about a minute, and together they regularly catch models that looked fine. Today you learn both.

[Run the two checks -> {url}]

Open for the next 3 days.

Akshay
```

## seq 19 - lesson (regression-health-check)

- **Subject:** Autocorrelation in residuals: how to test and fix it
- **Preheader:** December's error follows November's. Your p-values just broke.

```
Hi {first_name},

Today's lesson connects two of our threads, which is always satisfying.

Say you fit a regression on monthly sales. If the model overshoots in November, odds are it overshoots in December too, because months lean on each other. Those trailing errors violate a quiet assumption of regression, and the damage lands exactly where you cannot see it: your p-values become too optimistic while everything looks normal.

Today you will test for this with Durbin-Watson, watch what breaks, and fix it properly.

[Test your residuals -> {url}]

Open for 3 days.

Akshay
```

## seq 20 - lesson (which-test)

- **Subject:** Mann-Whitney U test: when and how to run it
- **Preheader:** Comparing salaries when one office has a CEO in the sample.

```
Hi {first_name},

Sometimes data just refuses to behave. Compare typical salaries at two companies, and one sample happens to include an executive earning twenty times everyone else. The t-test compares averages, and that one person just dragged their company's average through the roof.

The Mann-Whitney U test, back on our test-choosing thread, sidesteps this by comparing ranks instead of raw values. The executive counts as just "the highest paid person," not as a number that swamps everything.

When to reach for it, how to run it, how to report it: that is today.

[Run the Mann-Whitney test -> {url}]

Open for the next 3 days.

Akshay
```

## seq 21 - public

- **Subject:** Is R worth learning in 2026? The honest answer
- **Preheader:** The honest answer, with actual data.

```
Hi {first_name},

A lighter one today, and maybe a question that has been in the back of your mind while doing these lessons: is R actually worth it in 2026, with Python everywhere?

This piece answers with data instead of tribal opinions. Job listings, salaries, the places R clearly wins, the places it honestly does not. Useful the next time someone at work raises an eyebrow at your setup.

[Read the honest answer -> {url}]

Regular page, no clock. Lessons resume tomorrow.

Akshay
```

## seq 22 - lesson (reading-model-output)

- **Subject:** Linear regression assumptions: the 5 checks
- **Preheader:** Five promises your regression makes behind your back.

```
Hi {first_name},

By now you have fitted a few regressions in these lessons. Time for the professional habit that goes with them.

Every regression makes five quiet promises about your data. Things like: the relationship is actually a straight line, the errors do not grow with the prediction, no single point runs the show. When the promises hold, your conclusions are solid. When one breaks, your p-values can be fiction while the output looks perfectly normal.

The five checks take minutes. Today you will run all of them on a real model and learn what to do when one fails.

[Check your regression -> {url}]

Open for 3 days.

Akshay
```

## seq 23 - lesson (foundations-extras)

- **Subject:** Law of Large Numbers vs CLT: the real difference
- **Preheader:** Flip a coin 10 times, then 10,000 times. Two theorems appear.

```
Hi {first_name},

A confession: the two most famous theorems in statistics get mixed up constantly, sometimes in textbooks. Coin flips make the difference obvious.

Flip 10 coins and you might easily get 70% heads. Flip 10,000 and you will be impressively close to 50%. That settling-down is the Law of Large Numbers. The second theorem, the CLT, answers the follow-up: at any sample size, how far off should I expect to be? After 100 flips, is 58% heads normal or suspicious?

Today you watch both happen side by side in simulation, and the difference sticks for good.

[Watch both theorems work -> {url}]

Open for the next 3 days.

Akshay
```

## seq 24 - lesson (arima-from-zero)

- **Subject:** Test stationarity: ADF, KPSS, and when to difference
- **Preheader:** You can't measure with a yardstick that keeps changing length.

```
Hi {first_name},

Something I glossed over in the forecasting thread deserves its own day.

Every model we have used assumes your series is "stationary": that its basic behaviour, the average level and the size of its wiggles, is not drifting over time. A fast-growing startup's revenue is the classic violation: every month sits higher than the last, so yesterday's patterns cannot be trusted to describe tomorrow. Forecasting it raw produces confident nonsense.

Today: two tests (ADF and KPSS) that check this properly, why they sometimes disagree, and when taking differences fixes things versus makes them worse.

[Test your series -> {url}]

Open for 3 days.

Akshay
```

## seq 25 - lesson (arima-from-zero)

- **Subject:** ARIMAX: add outside variables to your ARIMA forecast
- **Preheader:** Ice cream sales follow the temperature. Tell your forecast that.

```
Hi {first_name},

Here is the limitation of everything we have done in forecasting so far: the model only knows the sales numbers themselves. But you know more. Ice cream sales follow the temperature. Store traffic follows promotions. Delivery volumes follow holidays.

ARIMAX is plain ARIMA plus exactly that knowledge, and it is a smaller step than the name suggests. Today you will hand a real forecast the outside information it was missing and watch the accuracy sharpen.

[Add outside variables -> {url}]

Open for the next 3 days. That wraps the core ARIMA arc, by the way. You have come a long way from alphabet soup.

Akshay
```

## seq 26 - lesson (regression-health-check)

- **Subject:** Robust regression: when outliers bite
- **Preheader:** A billionaire walks into your salary survey.

```
Hi {first_name},

Back in the regression clinic. Today's patient: the outlier problem.

You survey 50 people about income and fit a line. Then a billionaire wanders into the sample. Ordinary regression minimises squared errors, so that one person does not just nudge your line, they yank it, hard enough to rewrite your conclusions about the other 49.

Robust regression refuses to let any single point shout that loudly. Today you fit one with rlm(), compare it to the ordinary fit on the same data, and learn when each is the honest choice.

[Fit a robust regression -> {url}]

Open for 3 days.

Akshay
```

## seq 27 - lesson (regression-health-check)

- **Subject:** Cook's distance: find the points that change your model
- **Preheader:** If deleting one customer changes your conclusions, you should know their name.

```
Hi {first_name},

A question worth asking of any model you care about: if I deleted one row of my data, would my conclusions change?

Say one corporate client places orders fifty times bigger than everyone else. Your "revenue grows with customer age" trend might exist only because of them. For most rows deletion changes nothing, but rows like that one are quietly steering the whole model, and you want their names.

Cook's distance finds them. Today you will compute it, read the plots, and learn what to actually do with an influential point, because quietly deleting it is usually the wrong move.

[Find your influential points -> {url}]

Open for the next 3 days.

Akshay
```

## seq 28 - lesson (which-test)

- **Subject:** Fisher's exact test: when and how, with a worked example
- **Preheader:** 7 of 8 improved on the drug, 3 of 9 without. Real, or luck?

```
Hi {first_name},

If you ever work with small samples, today's test belongs in your pocket.

Picture a tiny pilot study: 8 patients get a new treatment and 7 improve. Of the 9 patients without it, only 3 improve. Looks convincing, but with 17 people, could luck alone do that? The usual chi-square test is unreliable at counts this small; reviewers reject it on sight.

Fisher's exact test was built for exactly this table. No approximations, an exact answer. Today you will work that example end to end, including how to report it.

[Run Fisher's exact test -> {url}]

Open for 3 days.

Akshay
```

## seq 29 - public

- **Subject:** R for finance: 25 real practice problems
- **Preheader:** 25 finance problems, real workflows, graded in the browser.

```
Hi {first_name},

Practice day. Twenty-five problems from the world of finance: stock returns, portfolios, risk, the workflows analysts actually run in R.

Even if finance is not your field, I would nudge you to try a few. The data is realistically messy and the questions have stakes, which makes it better practice than tidy textbook exercises. Everything grades itself in the browser.

[Try the finance problems -> {url}]

Regular page, no clock. Chip away whenever.

Akshay
```

## seq 30 - lesson (bayesian-decisions)

- **Subject:** Bayes' theorem: the simulation that makes it click
- **Preheader:** How your spam filter decides, in one line of arithmetic.

```
Hi {first_name},

Today we start a thread I have been looking forward to.

When an email arrives containing the word "WINNER!!!", your spam filter does something elegant: it takes what it believed before (most mail is legitimate) and updates that belief with the new evidence (legitimate mail rarely shouts WINNER). Belief in, evidence in, updated belief out. That update rule is Bayes' theorem, and it is one line of arithmetic.

Remember the disease-test puzzle from a while back? Same rule. Today you will drive the simulation yourself until the famous formula feels like common sense written down.

[Watch it click -> {url}]

Open for the next 3 days.

Akshay
```

## seq 31 - lesson (resampling)

- **Subject:** Permutation tests: exact p-values without formulas
- **Preheader:** Class A scored 78, class B scored 72. Shuffle the students and see.

```
Hi {first_name},

Today's idea is my favourite kind: so intuitive you will wonder why nobody led with it.

Two classes take the same exam. Class A, taught with a new method, averages 78. Class B averages 72. Convincing? Here is the beautifully simple check: if the method really made no difference, then it should not matter which class a student sat in. So shuffle the students between classes a few thousand times on your computer and see how often a gap of 6 points appears by pure chance.

That is a permutation test: an exact answer built from your own data, no formulas from any table. Run one today and a lot of classical statistics clicks retroactively.

[Shuffle your way to an answer -> {url}]

Open for 3 days.

Akshay
```

## seq 32 - lesson (resampling)

- **Subject:** Bootstrap confidence intervals: for any statistic
- **Preheader:** An interval for the median, the ratio, or anything else. One trick.

```
Hi {first_name},

Yesterday you shuffled. Today you resample, and the trick is at least as useful.

Say you surveyed 200 households and want to report the median income, with an honest range around it. Problem: the textbook interval formulas cover means and proportions, and nobody gave you one for medians. The bootstrap's answer: pretend your 200 households are the whole world, draw new samples of 200 from them (repeats allowed), recompute the median each time, and read your range off the spread.

Today you will bootstrap intervals for statistics no formula covers.

[Bootstrap an interval -> {url}]

Open for the next 3 days.

Akshay
```

## seq 33 - lesson (bayesian-decisions)

- **Subject:** Choosing priors: the decision that matters
- **Preheader:** What you believed before the data arrived. It matters, and it fades.

```
Hi {first_name},

The Bayesian thread continues with the decision people argue about most: the prior, meaning what you believed before seeing the data.

Make it concrete. A stranger flips a coin five times, five heads: you still think the coin is probably fair, because a lifetime of coins says so. A stranger's new trading strategy wins five times in a row: you are rightly less sure what to believe. Same data pattern, different prior beliefs, different conclusions. That is not a flaw, it is honesty about what you knew coming in.

Today: when priors matter, when the data washes them out, and how to choose defensibly.

[Choose your priors -> {url}]

Open for 3 days.

Akshay
```

## seq 34 - lesson (bayesian-decisions)

- **Subject:** The Bayesian t-test: measure evidence, not just significance
- **Preheader:** 'Not guilty' isn't 'innocent'. This test can actually say innocent.

```
Hi {first_name},

Here is a strange gap in classical statistics. Remember the courtroom from the hypothesis-testing lesson? A classical t-test can only say "guilty" or "not guilty", and not guilty just means insufficient evidence. It can never say "we checked, and he is innocent", even when the data genuinely supports no difference.

The Bayesian t-test can say both. It reports a Bayes factor: one number for how strongly your data favours one side over the other, in either direction. "The evidence is 8 to 1 that the new method works" is a sentence people actually understand.

Today you will run one and read that number with confidence.

[Measure your evidence -> {url}]

Open for the next 3 days.

Akshay
```

## seq 35 - lesson (bayesian-decisions)

- **Subject:** Credible vs confidence intervals: the difference that matters
- **Preheader:** The interval that means what everyone thinks intervals mean.

```
Hi {first_name},

Remember the pizza delivery intervals, and how careful we had to be about what the 95% promises? Today closes that loop in a satisfying way.

A Bayesian credible interval promises the thing everyone wished for back then: given your data, there is a 95% probability the true average delivery time is between 22 and 30 minutes. Plain and direct. The classical interval could never quite say that.

Today you will build both kinds on the same data, watch where they agree and where they split, and know exactly which sentence each one permits.

[Compare the two intervals -> {url}]

Open for 3 days.

Akshay
```

## seq 36 - lesson (beyond-straight-lines)

- **Subject:** Segmented regression: find the breakpoints
- **Preheader:** Sales were flat until some ad spend level, then took off. Find the level.

```
Hi {first_name},

Some relationships are not one straight line. They are two lines with a bend, and the bend is the interesting part.

Say monthly sales barely respond to ad spend until some threshold, then start climbing steeply. The question a boss actually asks is: where exactly is the threshold? Segmented regression answers with a number and a confidence interval around it, so "somewhere around 1,000 a month, we think" becomes a defensible estimate.

Today you will locate a real breakpoint yourself.

[Find the breakpoint -> {url}]

Open for the next 3 days.

Akshay
```

## seq 37 - lesson (which-test)

- **Subject:** Chi-square tests: which one to use and how
- **Preheader:** Three chi-square tests, one clear guide to which and when.

```
Hi {first_name},

A tidy-up lesson today, on a name that causes more confusion than it should.

"The chi-square test" is actually three different tests sharing a name. Asking whether payment method depends on age group is one (independence). Asking whether your die rolls match a fair die is another (goodness of fit). Asking whether three cities show the same preference split is the third (homogeneity). Mix them up and your conclusion answers a question nobody asked.

After today you will tell them apart in seconds and run each properly.

[Sort out chi-square -> {url}]

Open for 3 days.

Akshay
```

## seq 38 - lesson (which-test)

- **Subject:** ANOVA post-hoc tests: Tukey vs Bonferroni
- **Preheader:** The ANOVA came back significant. Now find out which group is actually winning.

```
Hi {first_name},

Let's say you compare four marketing campaigns on sales. You run an ANOVA and it comes back p = 0.01. The campaigns are not all equal, great. Your manager immediately asks the obvious question: so which one is winning?

And here is the thing, the ANOVA cannot tell you that. It only says a difference exists somewhere among the four.

That is the job of post-hoc tests, and the two you will actually use are Tukey and Bonferroni. Tukey is for when you want to compare every pair. Bonferroni is for when you decided upfront on a few specific comparisons. Use the wrong one and you either lose the power to detect real differences or you quietly let false positives in. This comes up in interviews too, usually right after they ask about ANOVA.

Today you will run both in R and know exactly which one to reach for.

[Find which groups actually differ -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 39 - lesson (which-test)

- **Subject:** Kruskal-Wallis: the nonparametric ANOVA
- **Preheader:** Three courier services, skewed delivery times, one honest comparison.

```
Hi {first_name},

Let's consider delivery times from three courier services. You want to know if any of them is genuinely faster. But delivery times are skewed, most orders arrive on time and a few take forever, and one lost parcel can drag a mean around badly.

Run a regular ANOVA on data like this and it can mislead you. Its assumptions, roughly normal data and similar spreads, are simply not met.

Kruskal-Wallis is the test built for exactly this situation. It compares three or more groups using ranks instead of the raw values, so that one nightmare delivery cannot distort the answer. The catch is that its conclusion is worded differently from ANOVA's, and knowing what it does and does not say is most of the skill.

Today you will run it in R, read the result properly, and know when to pick it over ANOVA without second guessing.

[Compare skewed groups the right way -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 40 - lesson (foundations-extras)

- **Subject:** Statistical vs practical significance: report both
- **Preheader:** A p-value can be tiny while the effect is worthless. Learn to report both.

```
Hi {first_name},

Let's say your site runs an A/B test with two million visitors on each side. The new button color wins with p = 0.001. Statistically, the result could hardly be stronger. Then you look at the size of the win: conversion went up by two hundredths of a percent.

Would you ship a redesign over that? Probably not.

With a big enough sample, even a meaningless difference becomes statistically significant. And the reverse happens too: a genuinely useful effect in a small pilot study can come back with p = 0.08 and get thrown away.

The fix is to always report two things: whether the effect is real, which is the p-value, and whether it is big enough to matter, which is the effect size with its confidence interval. Today you will compute both in R and practice the exact reporting language that keeps the two ideas separate.

[Report both kinds of significance -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 41 - public

- **Subject:** Experimental design: 20 solved problems
- **Preheader:** Twenty graded problems on the decisions you make before any data exists.

```
Hi {first_name},

Practice day. Twenty problems on experimental design: randomization, blocking, factorial layouts, sample size, the decisions you make before any data exists.

Design is the part of statistics where mistakes are permanent. A badly analyzed experiment can be re-analyzed, but a badly designed one usually has to be run again. These problems train that judgment, and everything grades itself in the browser.

[Work the design problems -> {url}]

Regular page, no clock. Chip away whenever.

Akshay
```

## seq 42 - public

- **Subject:** Survival analysis: model time-to-event data, from scratch
- **Preheader:** Churn, failures, time-to-event: a full survival analysis course, from scratch.

```
Hi {first_name},

Today I want to point you at something bigger than one lesson: a full course on survival analysis.

Survival analysis answers questions about time. How long until a customer churns. How long a machine runs before it fails. How long a patient stays healthy. The twist that makes it its own field is that for many subjects the event has not happened yet when you collect the data, and throwing those cases away is exactly the wrong move. Kaplan-Meier curves and Cox models are built to use them properly.

If your work ever touches churn, reliability, or anything measured as time-to-event, this course will pay for itself quickly.

[Start the survival analysis course -> {url}]

Regular course, no clock. Start with lesson one.

Akshay
```

## seq 43 - lesson (hidden-structure)

- **Subject:** Interpreting PCA: what loadings and scores mean
- **Preheader:** Loadings and scores, finally in plain words. Name what PC1 actually is.

```
Hi {first_name},

Let's say you run a PCA on a customer survey with twenty questions and R hands back a wall of numbers: loadings, scores, proportions of variance. Most people stop right there, put "PC1" on a chart axis, and hope nobody asks what PC1 actually is.

And honestly, fair enough. Nobody explains this part well.

The loadings tell you what each component is made of, which questions it leans on and in which direction. The scores tell you where each customer sits on that new axis. Read the two together and PC1 stops being a mystery number and becomes something you can name, like price sensitivity or overall satisfaction.

Today you will take a real PCA result apart in R and practice naming the components out loud.

[Make sense of your PCA -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 44 - lesson (foundations-extras)

- **Subject:** Which distribution when: a field guide
- **Preheader:** Poisson, binomial, exponential, normal: the one question that identifies each.

```
Hi {first_name},

Counting customer arrivals per hour? Counting how many of ten trials succeed? Measuring how long until the next machine failure? Each of those questions has a distribution built for it, and picking the right one is half the modeling work.

Today's lesson is a field guide. Poisson for counts of events in a window, binomial for successes out of a fixed number of tries, exponential for waiting times, normal for sums and averages of many small influences. For each one you will see the everyday situation it was made for, generate it in R, and learn the one question that identifies it.

By the end, "which distribution is this?" becomes a quick check instead of a guess. It is also a quiet favourite in interviews.

[Match the distribution to the situation -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 45 - lesson (beyond-straight-lines)

- **Subject:** Poisson regression: model count data right
- **Preheader:** Ticket counts, visit counts, defect counts: regression built for counting.

```
Hi {first_name},

Let's consider the number of support tickets each customer files in a month. You want to know what drives it: plan type, tenure, company size. So you reach for linear regression, and it quietly goes wrong. It happily predicts negative ticket counts, and it assumes the noise around a prediction of 1 is as wide as the noise around a prediction of 50.

Counts are their own kind of data.

Poisson regression is the tool built for them. It models the count directly, never predicts below zero, and its coefficients turn into statements like "enterprise customers file 1.8 times as many tickets". That multiplier reading is the part most people never learn.

Today you will fit one in R and read its coefficients the right way.

[Model your counts properly -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 46 - lesson (arima-from-zero)

- **Subject:** auto.arima: how it works and when to override it
- **Preheader:** What auto.arima actually does, and the few times you should overrule it.

```
Hi {first_name},

If you have ever forecast anything in R, you have probably typed auto.arima() and taken whatever it returned. Most people never look inside. However, the function is not magic, it is a search: difference the series until it is stationary, try candidate models, keep the one with the best score.

Knowing that changes how you use it. You can read the model it picked and say why. You can notice when the search settled on something odd, like seasonal data with no seasonal terms. And you will know the handful of situations where overriding it with your own orders gives a better forecast.

Today you will open the black box, follow the search step by step, and practice one honest override.

[See inside auto.arima -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 47 - lesson (beyond-straight-lines)

- **Subject:** Negative binomial regression: when Poisson doesn't fit your counts
- **Preheader:** When the variance outruns the mean, Poisson lies. The fix is one parameter.

```
Hi {first_name},

Remember Poisson regression from a couple of lessons back? It makes one strict promise you should know about: the variance of the counts must equal their mean.

Real data rarely keeps that promise. Take doctor visits per patient in a year. A few patients visit constantly while most barely go, so the spread runs far above the average. Fit a Poisson model anyway and every p-value in the output comes out smaller than it deserves to be, which means false confidence.

This situation is called overdispersion, and with real counts it is closer to the rule than the exception.

Negative binomial regression is the fix. It keeps everything you like about Poisson and adds one parameter that absorbs the extra spread. Today you will diagnose overdispersion in R, refit, and watch the shaky significance drain out of your results.

[Fix your overdispersed counts -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 48 - lesson (time-series-toolkit)

- **Subject:** Cointegration: test when two series move together
- **Preheader:** Petrol and crude drift together for decades. Test which pairs really do.

```
Hi {first_name},

Consider this: petrol prices and crude oil prices both wander over the years, neither returns to any fixed level, yet the gap between them stays roughly steady. They drift, but they drift together.

That togetherness has a name, cointegration, and it is the honest way to talk about long-run relationships between trending series. It matters because regressing one trending series on another without checking this first produces beautiful, completely spurious results. High R-squared, tiny p-values, no real relationship at all. Scary right?

Today you will watch a spurious regression happen with your own eyes, then run the Engle-Granger test in R to tell a real long-run relationship from a fake one.

[Test what moves together -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 49 - lesson (time-series-toolkit)

- **Subject:** Prediction intervals: put honest uncertainty on your forecasts
- **Preheader:** A forecast of 1,200 means little without a range. Build ranges you can defend.

```
Hi {first_name},

Let's say your forecast for next month's demand is 1,200 units. Your manager plans stock around that single number. Then reality lands at 950 and the forecast gets blamed.

The problem was never the 1,200. The problem was reporting one number as if the future were certain.

A prediction interval fixes the conversation. "Best guess 1,200, and we are 95 percent sure it lands between 900 and 1,500" leads to a very different stocking decision. The catch is that forecast intervals widen the further out you look, and the default ones from many models are too narrow because they ignore some sources of error. Knowing that is what separates honest forecasting from confident guessing.

Today you will build prediction intervals in R, read them properly, and learn when to distrust the defaults.

[Put honest uncertainty on your forecast -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 50 - lesson (bayesian-decisions)

- **Subject:** Compare Bayesian models: LOO and WAIC
- **Preheader:** Two Bayesian models, one honest question: which predicts new data better?

```
Hi {first_name},

Let's say you have fit two Bayesian models for the same outcome, one simple and one with several extra predictors. Which should you trust? Picking the one that fits your current data best is a trap, because the bigger model almost always fits better while quietly memorizing noise.

What you actually want to know is different: which model would predict a new observation better?

LOO and WAIC answer exactly that. The idea behind LOO is honest and simple: leave one observation out, predict it using the rest, score how well you did, and repeat for every observation. Today you will compare real models with both tools in R and read the output well enough to defend the choice.

[Choose between your models honestly -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 51 - lesson (bayesian-decisions)

- **Subject:** brms: Bayesian regression without writing Stan
- **Preheader:** Write lm()-style formulas, get full Bayesian models back. That is brms.

```
Hi {first_name},

Everything in the Bayesian lessons so far came with a slightly steep entry: to fit a model, you had to think about the machinery underneath. Today the entry gets easy.

brms is an R package with a plain deal: you write the model as a regression formula, the same style you already use with lm(), and it quietly builds and runs the full Bayesian machinery behind the scenes. One line gets you a Bayesian regression with priors, credible intervals, and everything else you have learned to read in this series.

This is the tool that makes Bayesian methods practical for everyday work, and it is the one I reach for first.

Today you will fit your first brms model and read its output end to end.

[Fit Bayesian models the easy way -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 52 - lesson (bayesian-decisions)

- **Subject:** Posterior predictive checks, in 5 minutes
- **Preheader:** Ask your model to invent data. See if it looks like yours.

```
Hi {first_name},

Yesterday you fit Bayesian models with brms. Today, one habit that keeps those models honest.

The idea is almost childlike, and that is its charm. If your model is a good description of daily sales, then data simulated from it should look like your actual sales. So you ask the fitted model to invent a few hundred fake datasets and plot them over the real one. When the real data sits comfortably among the fakes, the model has earned some trust. When the real data sticks out, skewed where the fakes are symmetric, or spikier than any fake, the model is missing something, and the plot usually shows you what.

This is called a posterior predictive check, and it takes one line with brms.

Today you will run these checks in R and practice reading the pictures.

[Check your model against reality -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 53 - lesson (bayesian-decisions)

- **Subject:** Bayesian hierarchical models, explained
- **Preheader:** Twenty stores, some with thin data. The fix for wild small-sample estimates.

```
Hi {first_name},

Let's say you manage twenty stores and want an estimate of the promotion effect in each one. Two obvious approaches, and both have a flaw. Pool everything and you get one blended number that pretends the stores are identical. Estimate each store alone and the small stores give you wild answers based on a handful of sales.

There is a third way, and it is one of the most useful ideas in statistics.

A hierarchical model lets every store have its own effect while assuming the effects come from a common distribution. Small stores get pulled toward the overall average, exactly as much as their thin data deserves, while big stores mostly keep their own estimate. Statisticians call this partial pooling, and once you see it work you will find uses for it everywhere.

Today you will fit one in brms and watch the small-store estimates get saner.

[Fit your first hierarchical model -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 54 - lesson (hidden-structure)

- **Subject:** Exploratory factor analysis, step by step
- **Preheader:** PCA compresses your survey. Factor analysis explains why questions move together.

```
Hi {first_name},

Remember the PCA lesson, where you compressed a twenty-question survey into a few components? Factor analysis looks similar on the surface but asks a deeper question: why do certain questions move together in the first place?

The answer it proposes is hidden traits. Five satisfaction questions correlate because one unobserved thing, actual satisfaction, drives all five. EFA works backwards from the correlations to those hidden factors, tells you how many the data supports, and shows which questions belong to which factor. This is the tool behind every personality test and most serious survey work.

Today you will run an EFA in R step by step: choose the number of factors, rotate, and read the loadings until the factors have names.

[Find the hidden traits in your data -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 55 - lesson (foundations-extras)

- **Subject:** The Central Limit Theorem: watch it work in a simulation
- **Preheader:** Skewed data in, bell curve out. Watch the theorem behind every t-test work.

```
Hi {first_name},

There is one theorem doing quiet work behind almost every method in this series. Every t-test you have run, every confidence interval you have built, leaned on it.

Here is the claim, and it sounds too good to be true. Take almost any data, however skewed or lumpy: incomes, delivery times, dice rolls. Draw samples and compute their averages. Those averages will pile up into a bell curve, even though the data itself looks nothing like one. That is the Central Limit Theorem, and it is the reason normal-based methods keep working on non-normal data.

Reading that claim is one thing. Watching it happen is another. Right?

Today you will simulate it in R: start from a wildly skewed distribution, take averages, and watch the bell curve assemble itself in front of you. After this, a whole family of methods stops feeling like magic.

[Watch the bell curve appear -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 56 - lesson (hidden-structure)

- **Subject:** Clustering in R: k-means, hierarchical, or DBSCAN
- **Preheader:** K-means, hierarchical, DBSCAN: three answers, and how to pick the right one.

```
Hi {first_name},

Let's say marketing asks you to segment your customers into groups: who buys often, who buys big, who is drifting away. No column in the data holds the answer. The groups have to be discovered, and that is exactly what clustering does.

R gives you three main tools for it, and they disagree in interesting ways. K-means is fast and wants you to name the number of groups upfront. Hierarchical clustering builds a family tree of your customers and lets you cut it at any level. DBSCAN finds groups of any shape on its own and, usefully, points out which customers fit nowhere.

Run all three on the same data and you will get three different answers. Knowing why, and which one to trust for your situation, is the real skill.

Today you will cluster one customer dataset all three ways in R and compare what each finds.

[Segment your customers three ways -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```

## seq 57 - lesson (hidden-structure)

- **Subject:** SEM and CFA with lavaan: a complete walkthrough
- **Preheader:** State which questions measure what, then let the data judge the theory.

```
Hi {first_name},

Three lessons ago you let factor analysis explore your survey and propose hidden traits. Today the roles flip: you state the structure you believe in, and the data gets to confirm or reject it.

That is confirmatory factor analysis. You declare, say, that questions one to five measure satisfaction and six to ten measure loyalty, and the model reports how well that theory fits. Structural equation modeling then goes one step further and lets the hidden traits point at each other, so you can test claims like satisfaction drives loyalty, not just measure the two separately.

This sounds advanced, and in most textbooks it is buried under notation. In R, the lavaan package makes the whole thing readable: describe the model in a small formula language, fit, inspect.

Today you will walk one complete CFA and one small SEM from start to finish.

[Test your theory against the data -> {url}]

Open for 3 days. About 15 minutes.

Akshay
```
