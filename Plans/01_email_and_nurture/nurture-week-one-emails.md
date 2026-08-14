# Nurture week one: the written emails

The first nine sequence emails (seq 0-8), full copy for owner review. The
machine copy lives in `functions/_data/nurture-emails.json` (edit HERE
first, then mirror there - or ask and both get updated). Rendered previews
+ test sends: /admin/email.html -> Emails tab (seq entries), or
/api/admin/email-plan?preview=seq:1.

Voice: outcome-first hook (vintage Neil Patel), Akshay, short lines, one
link. {url} = the tokened lesson link (or the public page for treats).
Seq 0 goes only to level_r=new users as their day one.

## seq 0 - public

- **Subject:** Write your first R script in 10 minutes
- **Preheader:** Ten minutes, zero installs, real working code.

```
Hi {first_name},

Everyone remembers their first ten lines of code. Today is yours.

No installing anything, no setup maze. You write R right in the browser, it runs instantly, and ten minutes from now you will have a working script that reads data and answers a question.

That's the whole ask. Ten minutes.

[Write your first R script -> {url}]

Tomorrow I'll send you something genuinely useful: how statisticians actually reason, explained with zero formulas.

Akshay
```

## seq 1 - lesson (inference-from-zero)

- **Subject:** How statistical inference works, no formulas yet
- **Preheader:** The logic behind every test you will ever run, with zero formulas.

```
Hi {first_name},

Here's a secret: every statistical test you'll ever run - t-tests, ANOVA, all of it - is the same single idea wearing different clothes.

Most courses bury that idea under formulas in week one and nobody ever sees it again. This lesson does the opposite. No formulas at all. Just the reasoning: how a skeptic looks at data and decides what to believe.

Get this one idea and everything that follows gets easier.

[Start the lesson -> {url}]

It's open for you for the next 3 days. About 15 minutes.

Akshay
```

## seq 2 - lesson (inference-from-zero)

- **Subject:** What p-values mean (and what they never meant)
- **Preheader:** The most misunderstood number in statistics, finally straight.

```
Hi {first_name},

Quick test. p = 0.03. Does that mean there's a 3% chance your result is a fluke?

No - and most people who use p-values daily get this wrong. Journals have published entire editorials about it. Careers have wobbled over it.

Today's lesson makes the real meaning click, with a simulation you run yourself. Once you see it happen, you can't unsee it - and you'll never misread a p-value again.

[See what p-values actually mean -> {url}]

Open for 3 days. Yesterday's inference lesson helps but isn't required.

Akshay
```

## seq 3 - lesson (inference-from-zero)

- **Subject:** Confidence intervals: what they really mean
- **Preheader:** What that 95% actually promises, shown by simulation.

```
Hi {first_name},

"We're 95% confident the true value is between 4.2 and 7.8."

Confident how? 95% of what, exactly? If you've ever nodded along to a confidence interval without being sure what it promises, today clears it up for good.

You'll build intervals yourself, watch which ones catch the truth and which miss, and walk away able to explain the 95% to anyone who asks. That last part matters - it's a favorite interview question.

[Understand confidence intervals -> {url}]

Open for the next 3 days.

Akshay
```

## seq 4 - lesson (arima-from-zero)

- **Subject:** ARIMA: what AR, I, and MA actually mean
- **Preheader:** The forecasting workhorse, decoded piece by piece.

```
Hi {first_name},

ARIMA sounds like alphabet soup until someone shows you what each letter actually does. Then it turns into the most dependable forecasting tool you own.

AR, I, MA - three small ideas. Today's lesson takes them one at a time, each with a live chart you can poke at, and by the end you'll read an ARIMA(2,1,1) like a sentence instead of a code.

If your work touches anything over time - sales, traffic, sensor data - this is the foundation.

[Decode ARIMA -> {url}]

Open for 3 days. New course thread, no prerequisites.

Akshay
```

## seq 5 - lesson (reading-model-output)

- **Subject:** lm() output, read line by line
- **Preheader:** Every number in that summary, finally meaningful.

```
Hi {first_name},

You run summary(model) and R hands you a wall of numbers. Estimate, Std. Error, t value, Pr(>|t|), R-squared, F-statistic...

Be honest: how many of those do you actually read?

After today, all of them. Line by line, each number gets a plain-English meaning and a "so what" - which ones matter, which ones lie, and which one everyone quotes without understanding.

This is the difference between running a regression and reading one.

[Read lm() output line by line -> {url}]

Open for the next 3 days.

Akshay
```

## seq 6 - lesson (reading-model-output)

- **Subject:** Interaction effects: test and interpret them
- **Preheader:** When one variable changes what another one does.

```
Hi {first_name},

Does the medicine work? Depends on the dose. Does the ad work? Depends on the audience. The moment an effect depends on something else, you're looking at an interaction - and models that ignore them get confidently wrong answers.

Today you'll learn to spot when an interaction is hiding in your data, add it to a model properly, and - the part nobody teaches well - interpret the result without tying your brain in knots.

[Master interaction effects -> {url}]

Open for 3 days. Pairs beautifully with yesterday's lm() lesson.

Akshay
```

## seq 7 - public

- **Subject:** 50 R interview questions and answers
- **Preheader:** The ones that actually come up, with worked answers.

```
Hi {first_name},

A breather from the lessons today - something to keep in your back pocket instead.

Fifty real R interview questions, each with a worked answer you can run. Not trivia. The kind that actually gets asked: vectors vs lists, how apply differs from a loop, what a factor really is.

Even if no interview is on your horizon, skimming these is the fastest self-audit of your R fundamentals I know.

[Browse the 50 questions -> {url}]

This one's a regular page - no clock on it. Save it, share it.

Akshay
```

## seq 8 - lesson (inference-from-zero)

- **Subject:** Power analysis: find the sample size you need
- **Preheader:** Stop guessing your sample size. Calculate it.

```
Hi {first_name},

"How many observations do I need?" is the most expensive question in statistics to get wrong. Too few and your study can't see the effect that's really there. Too many and you burned budget for nothing.

Power analysis answers it before you collect a single data point. Today you'll run one, read the power curve, and walk away with a number you can defend to a boss, a reviewer, or an ethics board.

[Find your sample size -> {url}]

Open for the next 3 days. Back on the inference thread - the p-value lesson from day 2 pays off here.

Akshay
```
