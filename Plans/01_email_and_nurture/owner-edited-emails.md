# The daily-series emails, as edited by Selva

Pulled verbatim from the dashboard overrides (KV `emailcopy:*`) on 2026-08-21. These are the live versions: the sender renders these, not the bundled defaults. Edit them in the dashboard (`/admin/email.html`, Emails tab); this file is a snapshot for reading and reference, and the voice calibration source.

Every body below is exactly as stored: `{first_name}` and `{url}` are filled at send time.


## The daily lesson series (seq 0 to 37)

### seq 0: Write your first R script in 10 minutes (public page, no window)

*Preheader: Ten minutes, zero installs, real working code.*

```
Hi {first_name},

Everyone remembers writing their first bit of code. Today is a good day for yours.

Because there is nothing to install and no setup to worry about. You type R right in the browser and it runs instantly. 

Ten minutes from now you will have a small script that takes a year of monthly sales numbers and answers a simple question: which month was the best, and by how much? Learning to do this should get you setup for many great things that will follow.

[Write your first R script -> {url}]

That is genuinely all there is to it. See you tomorrow with something more core stats.

Akshay
```

### seq 1: How statistical inference works, no formulas yet

*Preheader: A friend claims she can taste the difference. Nine out of ten. Believe her?*

```
Hi {first_name},

Let me start with a simple bet. A friend claims she can tell Coke from Pepsi by taste. You pour ten cups, she gets nine right. Is she skilled, or just lucky?

Whatever reasoning you just gave about that, you already did statistical inference. Every test you will ever run, t-tests, ANOVA, all of them, is that same idea made more structured: how surprising would this result be if it were just luck?

Today's lesson builds that idea up properly, with zero formulas. Once it clicks, everything that follows this month gets easier.

[Start the lesson -> {url}]

Open for you for the next 3 days. About 15 minutes.

Akshay
```

### seq 2: What p-values mean (and what they never meant)

*Preheader: The most misunderstood number in statistics, finally straight.*

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

### seq 3: Confidence intervals: what they really mean

*Preheader: What that 95% actually promises, shown with delivery times.*

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

### seq 4: ARIMA: what AR, I, and MA actually mean

*Preheader: Forecast a coffee shop's sales, and ARIMA stops being alphabet soup.*

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

### seq 5: Interaction effects: test and interpret them

*Preheader: The coupon works, but only for new customers. That's an interaction.*

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

### seq 6: 50 R interview questions and answers (public page, no window)

*Preheader: The ones that actually get asked, with runnable answers.*

```
Hi {first_name},

It has been a dense week, so no lesson today. Instead, here's something people keep coming back to.

Fifty real R interview questions with worked answers you can run. Not trivia, the genuinely asked kind.

No interview on the horizon? Skimming them is still the fastest check of your R fundamentals I know.

[Browse the 50 questions -> {url}]

Regular page, no clock. Back to lessons tomorrow.

Akshay
```

### seq 7: Power analysis: find the sample size you need

*Preheader: Will 40 patients be enough to see the effect? Find out before you start.*

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

### seq 8: Which statistical test to use? A 5-question decision flowchart

*Preheader: Answer these five questions, to find out the right test to perform.*

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

### seq 9: Conditional probability: P(A given B), made concrete

*Preheader: You test positive for a rare disease. How worried should you be?*

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

### seq 10: ACF and PACF: how to read the plots for ARIMA orders

*Preheader: Does yesterday's rush still echo today? Two plots answer it.*

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

### seq 11: Multicollinearity: why your coefficients look wrong, and the fix

*Preheader: Square footage and room count tell the same story. Your model can't split the credit.*

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

### seq 12: Hypothesis testing: the framework, explained

*Preheader: Innocent until proven guilty: you already know this framework.*

```
Hi {first_name},

Previously we have seen p-values and confidence intervals as separate ideas. Today these concepts will come together as one framework - Hypothesis Testing. 

The goal here is to answer one question: Is the pattern, difference, or effect observed in the data real, or could it have easily happened by pure random chance?

And the whole machinery works exactly like a courtroom.

The defendant is presumed innocent (the null hypothesis: nothing is going on). The prosecution presents evidence (your data). And the jury only convicts if the evidence would be too surprising for an innocent person (the p-value falls below your threshold). 

Today we will nail this.

See it once as a courtroom and every test you ever run becomes the same trial with different evidence.

[See the whole framework -> {url}]

Open for 3 days.

Akshay
```

### seq 13: Welch's ANOVA: the test for unequal group variances

*Preheader: One team has wild salaries, one doesn't. The classic test breaks.*

```
Hi {first_name},

Here is something that surprises people. 

Say you are comparing average salaries across three departments. In two of them everyone is earning similar amounts, but the third mixes juniors with a few highly paid specialists, so its numbers are all over the place.

We want to determine if there is a statistically significant difference among the means of three or more independent groups. 

ANOVA is the natural choice. Right? 

There is a catch.

Classic ANOVA quietly assumes all groups have similar spread, and in this situation it starts giving wrong answers without any warning. That's where Welch's ANOVA comes in. It handles unequal spreads properly, and plenty of statisticians argue it should simply be the default.

Today you will see exactly where the classic version breaks and what to do instead.

[Run Welch's ANOVA -> {url}]

Open for the next 3 days.

Akshay
```

### seq 14: A survey analysis, end to end in R (public page, no window)

*Preheader: Messy raw answers to finished findings, one real project.*

```
Hi {first_name},

No new theory today. Instead, let's do a real survey analysis from start to finish.

Here is the situation. A company of 1,000 people sends out an engagement survey and 600 reply. HR hands you the raw responses and asks a simple sounding question: so, how are people feeling?

And right there is the trap.

The 600 who replied are almost never a fair copy of the 1,000 who were asked. Report their answers as they are and you could be presenting the opinions of whoever had a free afternoon.

Today's page walks the entire analysis in one shot: weighting the responses so they match the real workforce, summarizing the 1-to-5 ratings without misleading anyone, checking if the six questions actually measure one thing, testing which departments truly differ and by how much, and everything that matters in survey analysis.

After this, you will never read survey results the same way again. It is also the kind of end-to-end work worth showing in an interview, because most candidates only know the pieces.

[Walk through the survey analysis -> {url}]

Bookmark it for your next questionnaire.

Akshay
```

### seq 15: Effect size: Cohen's d and friends, explained

*Preheader: Two diets, both 'significant'. One loses half a kilo, one loses five.*

```
Hi {first_name},

We have seen how to test whether a given effect exists or not. However today's idea matters more in practice: How Big Is It?

Let's take a simple example.

Picture two diet studies, both reporting p < 0.05. In one, people lost half a kilo on average. In the other, five kilos. And both have the same "significant" stamp, but has a  completely different meaning for anyone choosing a diet. With enough participants, even the half-kilo diet would pass the test.

But how to measure the effect size and exactly it works?

Effect sizes like Cohen's d are how you report the difference that actually matters. After today you will know how to state results the right way: is it real, and how big, are two separate answers.

[Measure your effects -> {url}]

Open for 3 days.

Akshay
```

### seq 16: Expected value and variance, explained

*Preheader: Why a $2 scratch card is a bad deal, mathematically.*

```
Hi {first_name},

Back to basics today, deliberately. Because how they could be interpreted is often overlooked.

A $2 scratch card usually pays nothing, sometimes pays $5, rarely pays $500. So, is it a good deal? 

You can know that by computing the expected value (spoiler: the shop is not running a charity). And variance answers a completely different question: how bumpy is the ride? or simply put, how much the values oscillate? 

Insurance, casinos and every estimator in statistics requires these two core ideas.

Today you will build both using dice and simulations, no calculus anywhere, and a surprising amount of statistics starts to make sense.

[Build them from scratch -> {url}]

Open for the next 3 days.

Akshay
```

### seq 17: How to choose ARIMA order (p, d, q): a practical guide

*Preheader: From two plots to a defensible (p, d, q).*

```
Hi {first_name},

Today, let's continue the forecasting thread. And now it gets more practical: How to choose an actual ARIMA order for a real series.

The workflow goes something like this: (i) First remove the growth trend so you are looking at ups and downs around a stable level. (ii) Then read your ACF and PACF plots from last time: how many days of echo do they show? (iii) Fit the two or three candidate models they suggest, and let a fair score pick the winner.

You will run that full logic today from scratch, and choosing (p, d, q) the good old fashioned way is pure joy and you finally know your stuff.

[Choose your first order -> {url}]

Open for 3 days.

Akshay
```

### seq 18: ARIMA diagnostics: the two checks before you trust a forecast

*Preheader: Your model's leftovers should look like static. Here's how to check.*

```
Hi {first_name},

A very short one today, about an important habit.

After your model makes its predictions, look at what is left over: the gaps between predicted and actual. If the model truly captured the pattern, those leftovers should look like pure static, no shape, no rhythm. If there is still a pattern in them, your model missed something, and its forecasts will pay for it.

The eyeball check plus one formal test (Ljung-Box) takes about a minute, and together they regularly catch models that looked fine. Today you learn both.

[Run the two checks -> {url}]

Open for the next 3 days.

Akshay
```

### seq 19: Autocorrelation in residuals: how to test and fix it

*Preheader: December's error follows November's. Your p-values just broke.*

```
Hi {first_name},

Today's lesson connects two of our threads, which is always satisfying.

Say you fit a regression on monthly sales. If the model overshoots in November, odds are it overshoots in December too, because consecutive months typically lean on each other. 

However, those trailing errors violate a quiet assumption of regression, and the damage is done exactly where you cannot see it. Your p-values become too optimistic while everything looks normal.

Today you will test for this with Durbin-Watson, watch what breaks, and fix it properly.

[Test your residuals -> {url}]

Open for 3 days.

Akshay
```

### seq 20: Mann-Whitney U test: when and how to run it

*Preheader: Comparing salaries when one office has a CEO in the sample.*

```
Hi {first_name},

Sometimes data just refuses to behave. Let's suppose you are comparing the typical salaries at two companies, and one sample happens to include an executive earning twenty times everyone else. The t-test compares averages, and that one person just dragged their company's average through the roof.

The Mann-Whitney U test, back on our test-choosing thread, sidesteps this by comparing ranks instead of raw values. The executive counts as just "the highest paid person," not as a number that swamps everything.

When to reach for it, how to run it, how to report it: we will see all of that today.

[Run the Mann-Whitney test -> {url}]

Open for the next 3 days.

Akshay
```

### seq 21: Is R worth learning in 2026? The honest answer (public page, no window)

*Preheader: The honest answer, with actual data.*

```
Hi {first_name},

A lighter one today. Let's try to answer a question that has been in the back of your mind while doing these lessons: is R actually worth it in 2026, with Python everywhere?

This piece answers with data instead of tribal opinions. Job listings, salaries, the places R clearly wins, the places it honestly does not. Useful the next time someone at work raises an eyebrow at your setup.

[Read the honest answer -> {url}]

No clock on this one. Lessons resume tomorrow.

Akshay
```

### seq 22: Linear regression assumptions: the 5 checks

*Preheader: Five promises your regression makes behind your back.*

```
Hi {first_name},

By now you have fitted a few regressions in these lessons. It's time to learn / revise the diagnostic steps that goes with them.

Did you know every regression makes five quiet promises about your data. 

Things like: the relationship is actually a straight line, the errors do not grow with the prediction, no single point runs the show. When the promises hold, your conclusions are solid. 

When one breaks, your p-values can become invalid while the output looks perfectly normal.

These five checks takes minutes. Today you will run all of them on a real model and learn exactly what to do when one fails.

[Check your regression -> {url}]

Open for 3 days.

Akshay
```

### seq 23: Law of Large Numbers vs CLT: the real difference

*Preheader: Flip a coin 10 times, then 10,000 times. Two theorems appear.*

```
Hi {first_name},

A confession: the two most famous theorems in statistics get mixed up constantly, sometimes in textbooks. 

Coin flips make the difference obvious.

Flip 10 coins and you might easily get 70% heads. Flip 10,000 and you will be impressively close to 50%. That settling-down towards the truth is the Law of Large Numbers. 

The second theorem, the CLT, answers the follow-up: at any sample size, how far off should I expect to be? After 100 flips, is 58% heads normal or suspicious?

Today you gain that knowledge of how both happening side by side in simulation, and the difference finally sticks for good.

[Watch both theorems work -> {url}]

Open for the next 3 days.

Akshay
```

### seq 24: Test stationarity: ADF, KPSS, and when to difference

*Preheader: You can't measure with a yardstick that keeps changing length.*

```
Hi {first_name},

The concept of stationarity in time series in quite important that it deserves its own topic.

So far, every model we have used assumes the series is "stationary". That is, its basic behavior - the average level and the size of its wiggles, does not drift over time. 

For example, a fast-growing startup's revenue is the classic violation: every month sits higher than the last, which means, yesterday's patterns cannot be trusted to describe tomorrow. Forecasting it raw using without any processing produces nonsense.

Today we will look at two tests (ADF and KPSS) that check this properly, why they sometimes disagree, and when taking differences fixes things instead of making them worse.

[Test your series -> {url}]

Open for 3 days.

Akshay
```

### seq 25: ARIMAX: add outside variables to your ARIMA forecast

*Preheader: Ice cream sales follow the temperature. Tell your forecast that.*

```
Hi {first_name},

There is a critical limitation of everything we have done in forecasting so far: the model only knows the past value of the series themselves (ex: sales numbers). 

But we know more. 

Ice cream sales follow the temperature. Store traffic follows promotions. Delivery volumes follow holidays.

ARIMAX is plain ARIMA plus exactly that knowledge, and it is a smaller step than the name suggests. Today you will give a real forecast the outside information it was missing and watch how the accuracy improves.

[Add outside variables -> {url}]

Open for the next 3 days. That wraps the core ARIMA arc, by the way. 

Akshay
```

### seq 26: Robust regression: when outliers bite

*Preheader: A billionaire walks into your salary survey.*

```
Hi {first_name},

Back to regression fundamentals. Today's topic is the outlier problem.

Let's say you survey 50 people about income and fit a line of best fit. Then a billionaire comes into the sample. 

Ordinary regression minimizes squared errors, that means, that one person does not just nudge your line, they yank it, hard enough to rewrite your predicitions about the other 49 significantly.

This is where Robust regression helps. It refuses to let any single point shout that loudly. Today we will learn how it works, fit one with rlm(), compare it to the ordinary fit on the same data, and learn when it is a good option.

[Fit a robust regression -> {url}]

Open for 3 days.

Akshay
```

### seq 27: Cook's distance: find the points that change your model

*Preheader: If deleting one customer changes your conclusions, you should know their name.*

```
Hi {first_name},

A question worth checking in any model you build: if I deleted one row of my data and retrain the model, how much would my model's predictions change?

This measures how much leverage a given data point has.

For example: Let's say one corporate client places orders fifty times bigger than everyone else. Your "revenue grows with customer age" trend might exist only because of them. For most rows deletion changes nothing, but rows like that one are quietly steering the whole model, and we want to know which ones are they.

Cook's distance finds them. Today you will compute it, read the plots, and learn what to actually do with an influential point, because quietly deleting it is usually the wrong move.

[Find your influential points -> {url}]

Open for the next 3 days.

Akshay
```

### seq 28: Fisher's exact test: when and how, with a worked example

*Preheader: 7 of 8 improved on the drug, 3 of 9 without. Real, or luck?*

```
Hi {first_name},

If you ever work with small samples, today's test is going to be really helpful.

Picture a tiny pilot study: 8 patients get a new treatment and 7 improve. Of the 9 patients without it, only 3 improve. 

Looks convincing. But with only 17 people, could luck alone do that? The usual chi-square test is unreliable at counts this small and any reviewer would reject it immediately on sight.

Fisher's exact test was built for exactly this. No approximations, an exact answer. Today we will learn everything about it with end to end examples and how to report it.

[Run Fisher's exact test -> {url}]

Open for 3 days.

Akshay
```

### seq 29: R for finance: 25 real practice problems (public page, no window)

*Preheader: 25 finance problems, real workflows, graded in the browser.*

```
Hi {first_name},

Practice today. Twenty-five problems from the world of finance: stock returns, portfolios, risk, the workflows analysts actually run in R.

Even if finance is not your field, I would nudge you to try a few. The data is realistically messy and the questions have stakes, which makes it better practice than tidy textbook exercises. Everything grades itself in the browser.

[Try the finance problems -> {url}]

Regular page, no clock. Chip it away.

Akshay
```

### seq 30: Bayes' theorem: the simulation that makes it click

*Preheader: How your spam filter decides, in one line of arithmetic.*

```
Hi {first_name},

Today we start a thread I have been looking forward to: Bayes theorem

Let's take a small example.

When an email arrives containing the word "WINNER!!!", your spam filter does something smart: it takes what it believed before (that most mail is legitimate) and updates that belief with the new evidence (legitimate mail rarely shouts WINNER). 

Belief + new evidence = updated belief. That update rule is the Bayes' theorem.

Today you will understand it clearly and drive the simulation yourself until the famous formula feels like common sense written down.

[Watch it click -> {url}]

Open for the next 3 days.

Akshay
```

### seq 31: Permutation tests: exact p-values without formulas

*Preheader: Class A scored 78, class B scored 72. Shuffle the students and see.*

```
Hi {first_name},

Today's idea is my favourite kind: so intuitive you will wonder why nobody's talking about it.

Here's it goes..

Two classes take the same exam. Class A, taught with a new method, averages 78. But Class B averages 72. So the new method works!

Convincing? Not so fast.

Here is the beautifully simple check: if the method really made no difference, then it should not matter which class a student sat in. So shuffle the students between classes a few thousand times on your computer and see how often a gap of 6 points appears by pure chance.

That is the funda behind the permutation test: the answer is derived from your own data, no formulas to memorize from any table. A lot of classical statistics will start making sense.

[Shuffle your way to an answer -> {url}]

Open for 3 days.

Akshay
```

### seq 32: Bootstrap confidence intervals: for any statistic

*Preheader: An interval for the median, the ratio, or anything else. One trick.*

```
Hi {first_name},

Yesterday we shuffled and today we are going to resample.

Let's say you surveyed 200 households and want to report the median income, with an honest range around it. Problem: the textbook interval formulas cover means and proportions, and nobody gave you one for medians. 

Bootstrapping can answer this. Pretend your 200 households is your whole world (read as the population), draw new samples of 200 from them (with repeats allowed), recompute the median each time, and then just read your range off the spread.

Today you will get this idea of bootstrap intervals for statistics crystal clear.

[Bootstrap an interval -> {url}]

Open for the next 3 days.

Akshay
```

### seq 33: Choosing priors: the decision that matters

*Preheader: What you believed before the data arrived. It matters, and it fades.*

```
Hi {first_name},

Today the Bayesian thread continues with the decision people argue about most: the prior, which is what you believed before seeing the data. 

Let's make it more concrete. 

A stranger flips a coin five times, and gets five heads: you still think the coin is probably fair, because a lifetime of coins says so. So the prior here is P(head) = 0.5, because your prior belief was the coin is fair.

Another example.

A stranger's trade used to win 3 out of every 4 times (prior is 0.75). However, a new trading strategy wins five times in a row, so you are rightly less sure what to believe. Same data pattern, different prior beliefs, different conclusions. 

Today we will learn how to identify the priors, when do priors matter, when the data with new evidence changes everything, and how to choose defensibly.

[Choose your priors -> {url}]

Open for 3 days.

Akshay
```

### seq 34: The Bayesian t-test: measure evidence, not just significance

*Preheader: 'Not guilty' isn't 'innocent'. This test can actually say innocent.*

```
Hi {first_name},

Here is a strange idea in classical statistics. Remember the courtroom from the hypothesis-testing lesson? A classical t-test can only say "guilty" or "not guilty", and not guilty just means insufficient evidence. It can never say "we checked, and he is innocent", even when the data genuinely supports no difference.

Notice the subtlety in the language used.

However, the Bayesian t-test can say both. It reports a Bayes factor: one number for how strongly your data favours one side over the other. "The evidence is 8 to 1 that the new method works" is a statement people can actually understand.

Today we will understand this clearly.

[Measure your evidence -> {url}]

Open for the next 3 days.

Akshay
```

### seq 35: Credible vs confidence intervals: the difference that matters

*Preheader: The interval that means what everyone thinks intervals mean.*

```
Hi {first_name},

A Bayesian credible interval promises the thing everyone wished for: given your data, there is a 95% probability the true average delivery time is between 22 and 30 minutes. Plain and direct. The classical interval can never quite say that.

Today you will build the intuition of both kinds on the same data, watch, compare and understand clearly.

[Compare the two intervals -> {url}]

Open for 3 days.

Akshay
```

### seq 36: Segmented regression: find the breakpoints

*Preheader: Sales were flat until some ad spend level, then took off. Find the level.*

```
Hi {first_name},

Some relationships are not just one straight line. They are two lines with a bend, and the bend makes it more interesting.

For example, monthly sales barely respond to ad spend until some threshold is reached, then start climbing steeply. The question your stakeholder would typically ask is: where exactly is the threshold? Segmented regression answers this with exactly that estimate and a confidence interval around it, so "somewhere around 1,000 a month, we think" could become a meaningful response.

Today you will learn to locate a real breakpoint yourself.

[Find the breakpoint -> {url}]

Open for the next 3 days.

Akshay
```

### seq 37: Chi-square tests: which one to use and how

*Preheader: Three chi-square tests, one clear guide to which and when.*

```
Hi {first_name},

A tidy-up lesson today, on a concept that causes more confusion than it should.

"The chi-square test" is actually three different tests sharing a name. 

Asking whether payment method depends on age group is one (independence). Asking whether your die rolls match a fair die is another (goodness of fit). Asking whether three cities show the same preference split is the third (homogeneity). If you mix them up your conclusion can easily go wrong.

After today you will tell them apart in seconds and run each variant properly.

[Sort out chi-square -> {url}]

Open for 3 days.

Akshay
```


## Lifecycle welcome emails

### welcome-browsing (signed up while reading): Welcome, and where I'd start

*Preheader: One good starting point, not a tour.*

```
Hi {first_name},

Welcome! Rather than giving you a tour of everything, let me just point you at the best thing you now have: the Data Analyst track, free for 30 days. Interactive lessons, R running right in the browser, a certificate at the end. The clock only starts when you open your first lesson, and lesson one takes about twenty minutes:

[Start lesson one -> {start_url}]

If you've never written any R at all, the New to R course might be a friendlier place to begin. That one's free forever, no time limit.

Either way, you don't need to figure the whole site out today. Start with one lesson and see how it feels.

Stuck anywhere? Just reply, it's me reading, not a bot.

Akshay
```

### welcome-exercise (signed up at the exercise gate): Your first solve is saved

*Preheader: The XP is yours. Here's how to keep it going.*

```
Hi {first_name},

Nice work on that first exercise. It's saved to your profile now, XP and all, and your streak started today.

If you feel like doing another, the rest of that hub is open right where you left off:

[Keep practicing -> {hub_url}]

The free plan gives you 25 graded exercises a month, which is plenty to build a real habit.

Oh, and one thing I don't want you to miss: your account comes with the full Data Analyst track, free for 30 days. The clock doesn't start until you open the track, so there's no rush. It's interactive lessons rather than exercises, you learn something properly and then practice it right there in the browser. Worth a look when you're ready - you can find it under the courses tab.

The New to R course and all the tutorials are free forever either way.

If you get stuck or something's confusing, just reply to this email and I'll help.

Akshay
```
