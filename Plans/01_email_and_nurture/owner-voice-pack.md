# Owner voice pack (SSOT for lesson + email prose voice)

The owner hand-edited the first 12 daily-series emails (seq 0-11) as the
calibration set for how ALL windowed-lesson prose must sound. The exemplars
below are verbatim. Every lesson writer and reviewer session reads this file
and matches this voice, not a generic "conversational" register.

## The patterns (extracted from the owner's edits, with before -> after evidence)

1. **Invite, don't declare.** Openers pull the reader in as a companion:
   "Let's say you test...", "Let's consider a coffee shop's daily sales and
   you observe this:", "Consider this:", "Let me start with a simple bet."
   The owner rewrote "Say you test" -> "Let's say you test" and "Picture a
   coffee shop" -> "Let's consider a coffee shop... and you observe this:".

2. **Short standalone paragraphs as spoken pauses.** When a point lands, it
   gets its own line. The owner split "It does not, and most people..." into
   "It does not." (own paragraph) then "And most people..." (next paragraph).
   Same with "And you freeze." / "Because you know...". "Most people say
   very." stands alone. Use this beat where the reader needs a breath.

3. **Check in with the reader, sparingly.** Small rhetorical taps that keep
   it two-way: "Right?", "Remember?", "Fair question right?", "Little mind
   bending right? I know". Roughly one per email of five paragraphs, so in a
   lesson: one every few steps at a genuinely surprising moment, never every
   paragraph.

4. **Cut cleverness; keep sincerity.** The owner deleted every flourish:
   "That is the whole secret" -> "That is the core idea."; "alphabet soup"
   -> "soup"; "the right test falls out the bottom" -> "you will have the
   right test standing in front of you"; "patterns jump out on their own" ->
   "patterns make sense and the exact mechanism behind it is crystal clear";
   "This one tends to live in an open tab for years." -> deleted. If a line
   sounds like copywriting or an aphorism, replace it with the plain sincere
   version.

5. **Restate in plainer words.** The owner ADDS a second, simpler pass at an
   idea: "is the difference real?. In other words, does one store actually
   do better than the other?" Spell things out; never make the reader decode
   a compressed sentence.

6. **Name the practical stakes, earnestly.** "It happens to be a favourite
   interview question too. Don't miss this."; "It is a foundational concept
   extremely useful in interviews."; "Learning to do this should get you
   setup for many great things that will follow." Benefit statements are
   plain and a little earnest, never slick.

7. **Small humane asides are welcome.** "Today you will see through the
   matrix, I mean, you will truly grasp the intuition" (a self-correction
   mid-sentence, like a person talking); "Today, we have a small horror
   story from regression." One such moment per piece is plenty.

8. **Warm word choices.** "until the questions feel at home" (not "feel
   automatic"), "charts you can work with" (not "play with"). Prefer the
   softer, human option.

9. **Never over-polish.** The owner tolerates slightly loose grammar in
   service of naturalness. Do not replicate typos, but do not sand every
   sentence smooth either; perfect symmetry reads as machine output.

10. **No stacked qualifier constructions.** Owner correction on the first
    voice-pass lesson (2026-08-15): "The question is the ordinary one
    anybody asks of three numbers like that:" -> "The question is an
    ordinary one anyone would want to be answered:". The first version
    nests qualifiers ("the ordinary one anybody asks of three numbers like
    that") into a writerly knot; the owner's version is one plain clause.
    When a sentence stacks two or more qualifying phrases, unwind it into
    the simple direct version even if it feels less precise.

11. **Standing rules that still apply:** no em or en dashes anywhere, pure
    ASCII, no staccato copywriter fragments strung for rhythm, no invented
    numbers, one named numbered everyday example carried through a piece.

## Adapting this voice to lesson-length prose

Emails are 150 words; lessons are long. What transfers: the companion
openers, the spoken-pause short paragraphs, occasional check-ins, restating
in plainer words, earnest stakes, warmth. What does NOT transfer: CTA link
lines, "Open for 3 days", the Akshay sign-off, and the density of check-ins
(space them out or they grate). A lesson step should read like the owner
explaining at a whiteboard: set the scene together, land the point on its
own line, ask "Right?" only when the reader genuinely just saw something
surprising, then move on.

## The exemplars (verbatim, seq 0-11)

### seq 0: Write your first R script in 10 minutes

Hi {first_name},

Everyone remembers writing their first bit of code. Today is a good day for yours.

Because there is nothing to install and no setup to worry about. You type R right in the browser and it runs instantly. 

Ten minutes from now you will have a small script that takes a year of monthly sales numbers and answers a simple question: which month was the best, and by how much? Learning to do this should get you setup for many great things that will follow.

[Write your first R script -> {url}]

That is genuinely all there is to it. See you tomorrow with something useful.

Akshay

### seq 1: How statistical inference works, no formulas yet

Hi {first_name},

Let me start with a simple bet. A friend claims she can tell Coke from Pepsi by taste. You pour ten cups, she gets nine right. Is she skilled, or just lucky?

Whatever reasoning you just gave about that, you already did statistical inference. Every test you will ever run, t-tests, ANOVA, all of them, is that same idea made more structured: how surprising would this result be if it were just luck?

Today's lesson builds that idea up properly, with zero formulas. Once it clicks, everything that follows this month gets easier.

[Start the lesson -> {url}]

Open for you for the next 3 days. About 15 minutes.

Akshay

### seq 2: What p-values mean (and what they never meant)

Hi {first_name},

Let's say you test a new checkout page on your website. Sales go up a little, and the test says p = 0.03. Does that mean there is a 3% chance the improvement was a fluke?

It does not.

And most people who use p-values every day read them exactly that wrong way. The real meaning is subtler: if the new page changed nothing at all, results this good would show up only 3% of the time by luck.

Little mind bending right? I know

Today you will see through the matrix, I mean, you will truly grasp the intuition and never misread a p-value again.

[See what p-values actually mean -> {url}]

Open for 3 days. Yesterday's lesson helps but is not required.

Akshay

### seq 3: Confidence intervals: what they really mean

Hi {first_name},

Imagine your pizza place says this: "we are 95% confident the average delivery takes between 22 and 30 minutes." 

Sounds precise. But what is the 95% actually promising? 

That 95% of pizzas arrive in that window? or that there is a 95% chance the true average is in there?

Strangely, neither of those is exactly right. And almost everyone who uses confidence intervals have quietly avoided asking.

Today you will build intervals yourself from repeated samples of delivery times and watch which intervals catch the true average and which miss. After that, you can explain the 95% to anyone. It happens to be a favourite interview question too. Don't miss this.

[Understand confidence intervals -> {url}]

Open for the next 3 days.

Akshay

### seq 4: ARIMA: what AR, I, and MA actually mean

Hi {first_name},

Let's consider a coffee shop's daily sales and you observe this: Busy days tend to follow busy days, a random rush yesterday still echoes a little today, and overall business is slowly growing. Those three essentially are the AR, the MA and the I in ARIMA.

That is the core idea. 

ARIMA looks like soup until you build the intuition for each letter to something you have seen in real life, and today's lesson does exactly that with charts you can work with.

By the end, ARIMA(2,1,1) reads like a sentence: today depends on the last two days, the trend was removed once, and one day of random noise still echoes.

[Decode ARIMA -> {url}]

Open for 3 days. New thread, no prerequisites.

Akshay

### seq 5: Interaction effects: test and interpret them

Hi {first_name},

You have had a lot of new ideas thrown at you this week, so today's is one you already know from real life. 

Typically, a discount coupon increases sales, but mostly for new customers. Because, regulars would have bought anyway. So the question "does the coupon work?" has no single answer: the effect depends on who gets the coupon. 

Right? 

That is an interaction in real life and a model that ignores it will happily report an average effect that is wrong for both groups.

Today you will learn to spot interactions in real data, add them to a model, and read the result without tying your brain in knots.

[Master interaction effects -> {url}]

Open for 3 days, as always.

Akshay

### seq 6: 50 R interview questions and answers

Hi {first_name},

It has been a dense week, so no lesson today. Instead, here's something people keep coming back to.

Fifty real R interview questions with worked answers you can run. Not trivia, the genuinely asked kind.

No interview on the horizon? Skimming them is still the fastest check of your R fundamentals I know.

[Browse the 50 questions -> {url}]

Regular page, no clock. Back to lessons tomorrow.

Akshay

### seq 7: Power analysis: find the sample size you need

Hi {first_name},

Remember the p-value lesson from earlier in the week? Today it starts to pay off.

Let's suppose a clinic is testing whether a new exercise program lowers blood pressure by around 10 points. They can recruit 40 patients. 

But is that count actually enough to detect if the improvement is real? If you run the study without considering this, you might very well waste the whole analysis. Power analysis answers the question before even starting it. 

Today you will learn how to run one and walk away knowing how to determine the exact sample size needed.

[Find your sample size -> {url}]

Open for the next 3 days.

Akshay

### seq 8: Which statistical test to use? A 5-question decision flowchart

Hi {first_name},

Consider this: You have average order values from three branches of a store and someone asks, "is the difference real?". In other words, does one store actually do better than the other? 

And you freeze.

Because you know there are a dozen tests you could possibly do and you are not sure which one this situation precisely needs.

Today's lesson replaces the freeze with a flowchart. Ask these five plain questions about your data: how many groups, are they paired, is the data roughly normal, and so on. Answer them and you will have the right test standing in front of you. 

We will walk through simple examples, plus a few others, until the questions feel at home.

[Get the flowchart -> {url}]

Open for 3 days.

Akshay

### seq 9: Conditional probability: P(A given B), made concrete

Hi {first_name},

Let's do a small puzzle before today's lesson, because it is one of the best in all of statistics.

Here it is: A disease affects 1 person in 1,000 and the test for it is 99% accurate. You take the test and your result comes back positive. How worried should you be? 

Most people say very. 

But here is the real answer: your chance of having it is still under 10%, because among 1,000 people the test frightens about ten healthy people for every one genuinely sick person it finds.

If that surprised you, today's lesson is going to be a good one. It is all conditional probability, the idea behind medical screening, spam filters and everything Bayesian we will do later. It is a foundational concept extremely useful in interviews.

[Work through the puzzle -> {url}]

Open for the next 3 days.

Akshay

### seq 10: ACF and PACF: how to read the plots for ARIMA orders

Hi {first_name},

Back to the coffee shop example from the ARIMA lesson earlier. You suspect busy days follow busy days. Remember?

But this time we want to know how far back does the echo reach or Does Monday still influence Thursday, or just till Tuesday?

Fair question right?

That is exactly what the ACF and PACF plots try to answer: how strongly today's sales correlate with 1, 2, 3 days ago. And those correlations are what tell you how many AR and MA terms your model needs. A tall spike at lag 1, then nothing, is the data saying "only yesterday matters."

Today you will learn to read both plots on real series until the patterns make sense and the exact mechanism behind it is crystal clear.

[Learn to read the plots -> {url}]

Open for 3 days.

Akshay

### seq 11: Multicollinearity: why your coefficients look wrong, and the fix

Hi {first_name},

Today, we have a small horror story from regression.

You are predicting house prices from square footage and number of rooms. Both obviously matter. But big houses have many rooms, so the two predictors move together, and the model cannot tell which one deserves the credit. 

The Result: coefficients flip signs, a variable you know matters looks useless, yet nothing is technically broken.

That is multicollinearity. 

Detecting it takes one line (the VIF), and today you will learn that line, what it does and does not ruin, and the fixes that do not throw away good variables.

[Diagnose it -> {url}]

Open for the next 3 days.

Akshay
