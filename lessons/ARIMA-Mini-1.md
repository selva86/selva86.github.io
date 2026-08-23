---
title: "ARIMA: what AR, I, and MA actually mean"
slug: "ARIMA-Mini-1"
description: "AR, I and MA are three things you can already see in one coffee shop: runs of busy days, an echo from a single rush, and slow growth. Build all three in R."
keywords: "what AR I MA mean, ARIMA explained, autoregressive model, moving average model, differencing, non-stationary series, ARIMA in R, ARIMA(2,1,1)"
mathjax: true
webr: true
date: "2026-08-23"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.4"
lesson_access: "windowed"
catalog_blurb: "What the three letters in ARIMA stand for, and how to read one."
---

=== step === cover
::eyebrow ARIMA from Zero
## ARIMA: what AR, I, and MA actually mean

Meera runs a coffee shop two streets from my place. Last year she started writing down how many cups she sold each day, and after 240 days she handed me the list and asked if there was anything in it worth knowing.

There was. In fact there were three things in it, and you can see every one of them without any maths at all.

Busy days come in runs. A Tuesday that sold well is usually followed by a Wednesday that sells well, because the weather held and the office across the road is still busy.

A one-off rush still shows up the next morning. When a school trip walked in one Thursday and cleared the counter, Friday came in a little above normal too, and by Saturday it was over.

And the whole thing is slowly climbing. She sold about 380 cups a day when she started, and about 620 by the end.

Those three observations are the three letters in ARIMA.

::widget process-flow {"steps":[{"title":"Busy days come in runs","sub":"a busy Tuesday is usually followed by a busy Wednesday"},{"title":"One rush still echoes","sub":"a school trip yesterday is still felt this morning"},{"title":"The shop keeps growing","sub":"sales climb month by month, so normal keeps moving"}]}

The runs are the AR. The echo from the rush is the MA. The slow climb is the I.

ARIMA looks like alphabet soup right up until each letter is tied to something you have already watched happen. So we are going to build all three from nothing, one at a time, in R, on Meera's own numbers. ARIMA(2,1,1) will end up reading like a plain sentence: today depends on the last two days, the trend was taken out once, and one day of random noise still echoes.

=== step === concept
## Meera's coffee shop, 240 days of cups sold

Let's get her numbers on the table first, because everything we do from here on is measured on them.

I cannot hand you her notebook, so the block below writes out the same shop in R: 240 days, starting near 380 cups and drifting up from there. Press Run, and you will be looking at exactly the numbers I am looking at.

The loop in the middle is the recipe the whole shop is built from. Read it once and let it be soup for now. Every symbol in it gets a plain name before we are done, and you will read the same loop back as a sentence.

```r
# Build Meera's 240 days of cups sold and look at the first two weeks
set.seed(21)
jolt   <- rnorm(240, sd = 3)
change <- numeric(240)
change[1] <- 1
change[2] <- 1
for (t in 3:240) {
  change[t] <- 0.55 + 0.30 * change[t - 1] + 0.15 * change[t - 2] +
               jolt[t] + 0.7 * jolt[t - 1]
}
cups <- round(380 + cumsum(change))

plot(cups, type = "l", col = "steelblue", lwd = 2,
     main = "Meera: cups sold per day", xlab = "Day", ylab = "Cups sold")

head(cups, 14)
#>  [1] 381 382 389 392 398 407 408 404 401 400 394 389 388 386
```

`set.seed(21)` fixes the random draws, so your 240 days are the same 240 days as mine. What comes out is `cups`, a plain vector of whole numbers, one per day, running from 381 on the first day to 618 on the last.

Now look at the line, because the three things from the list are all sitting in it.

It moves in stretches instead of hopping about, so a high day tends to have another high day next to it. Every so often a spike sticks out and is gone again within a day or two. And the middle of the line is plainly higher on the right of the chart than on the left.

Those are three ordinary facts about a coffee shop. Let's build each one from scratch, so you know exactly what it takes to make it happen.

=== step === concept
## A shop with no memory, where a day is only its own shock

The three letters are three kinds of memory, so the honest place to start is a shop that has none at all.

Picture Meera's shop with all three of those habits switched off. It has no growth and no memory. It sells 400 cups on an average day, and every day it sells 400 give or take a bit. That give-or-take is the whole of the day: the weather, who happened to walk past, whether the barista was quick. Nothing about yesterday comes into it.

That daily give-or-take has a name in time series work. It is the **shock**, and two things are true of it. It averages out to zero over the long run, because it is the part that lands above and below normal in equal measure. And it cannot be predicted from anything you already know, because if it could, that predictable part would already have been folded into normal.

Let's build 400 days of that shop.

```r
# Build a shop with no memory, where each day is only its own shock
set.seed(1)
surprise <- rnorm(400, sd = 12)
flat     <- 400 + surprise

plot(flat, type = "l", col = "grey45", ylim = c(350, 445),
     main = "A shop with no memory", xlab = "Day", ylab = "Cups sold")

round(c(average_shock = mean(surprise), typical_shock = sd(surprise)), 2)
#> average_shock typical_shock
#>          0.46         11.63

round(cor(flat[2:400], flat[1:399]), 3)
#> [1] -0.046
```

`rnorm(400, sd = 12)` draws 400 shocks, each one drawn independently of the rest, with a typical size of 12 cups. Adding 400 to each gives that day's sales. The shocks averaged 0.46 cups rather than a clean zero, which is what 400 draws will do, and their typical size came out at 11.63 against the 12 we asked for.

The last number is the one to hold on to. It is the correlation between every day and the day before it, and it reads -0.046, which is nothing. In this shop, knowing yesterday tells you absolutely nothing about today.

The plot says the same thing. The line hops. A high day is as likely to be followed by a low one as by another high one, so no runs ever form.

=== step === concept
## Busy days follow busy days, and AR is the rule that does it

The real Meera is not like that, and the reason is not mysterious. Whatever made yesterday busy has usually not gone away by this morning.

So let's write that down as a rule. Today's sales are the normal 400, plus part of however far yesterday sat above or below normal, plus today's own shock.

That "part of" is a single number, and we will set it to 0.7. If yesterday finished 20 cups above normal, then 0.7 of those 20 cups, which is 14, carries into today before today's own shock lands on top.

This rule is the AR part of ARIMA. AR is short for autoregressive, which means nothing more alarming than "regressed on itself": today is predicted from the series' own past values.

Here is the honest test of it. We are going to feed this rule the exact same 400 shocks the memoryless shop got. No new information goes in anywhere. So if runs appear, they came from the memory and from nowhere else.

```r
# Let yesterday pull on today, using the very same shocks
ar1    <- numeric(400)
ar1[1] <- 400 + surprise[1]
for (t in 2:400) {
  ar1[t] <- 400 + 0.7 * (ar1[t - 1] - 400) + surprise[t]
}

par(mfrow = c(2, 1), mar = c(4, 4, 2, 1))
plot(flat, type = "l", col = "grey45", ylim = c(350, 445),
     main = "No memory", xlab = "Day", ylab = "Cups")
plot(ar1, type = "l", col = "steelblue", ylim = c(350, 445),
     main = "Yesterday pulls today by 0.7", xlab = "Day", ylab = "Cups")
par(mfrow = c(1, 1))
```

Read the loop one piece at a time. `ar1[t - 1] - 400` is how far yesterday sat from normal. Multiplying it by 0.7 keeps seven tenths of that gap. Adding 400 back puts it on the cups scale, and `surprise[t]` is today's own shock, the identical shock the shop in the top panel got.

Now compare the two lines. They got the same shocks on the same scale, and they look nothing like each other. The top one hops. The bottom one moves in stretches: it climbs for a while, sits high, drifts back down, sits low. A busy week is a real thing in the bottom panel and a meaningless phrase in the top one.

That is what one number bought us. Nothing was added to the data except a rule saying today remembers a fraction of yesterday.

=== step === concept
## Yesterday pulls today by 0.7

We put 0.7 in by hand. The obvious question is whether we can get it back out of the data, and we can, using a tool you already have.

Pair up every day with the day before it: day 2 with day 1, day 3 with day 2, and so on to the end. That gives 399 pairs. The correlation across those pairs is what "how much of yesterday carries into today" looks like as a single number.

```r
# Measure how strongly a day pulls on the day that follows it
plot(ar1[1:399], ar1[2:400], pch = 16, col = "#1f7a5566",
     main = "Today against yesterday", xlab = "Yesterday, cups", ylab = "Today, cups")

pull_at <- function(k) {
  n <- length(ar1)
  cor(ar1[(k + 1):n], ar1[1:(n - k)])
}

round(pull_at(1), 3)
#> [1] 0.666
```

The cloud of dots leans, and that lean is the memory made visible. High-yesterday days sit with high-today days.

`pull_at()` does the pairing for any gap `k` you hand it and returns the correlation. At a gap of one day it reads 0.666, against the 0.7 we built the shop with.

The gap between 0.666 and 0.700 is not a mistake anywhere. 400 days is a sample, in the same way 400 coin tosses will not land on exactly 200 heads. Run the shop for 40,000 days and the number would sit far closer to 0.7.

The 0.7 we put in has a proper name. It is the **AR coefficient**, written with the Greek letter phi, \\(\phi\\), and in a shop with one day of memory the correlation you just measured is how you read it off the data.

=== step === quiz
## Quick check: what a coefficient of 0.7 says about tomorrow

The shop we just built runs on an AR rule with a coefficient of 0.7, and today it finished 20 cups above its normal 400. Which sentence reads that 0.7 correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- There is a 70% chance tomorrow turns out to be a busy day. ::no
- About 0.7 of whatever today sits above normal, so around 14 cups, is expected to still be there tomorrow, before tomorrow gets a shock of its own. ::ok That is it. The coefficient works on the gap from normal, not on the sales figure, and it is an expectation rather than a promise, because tomorrow brings a fresh shock nobody can see coming.
- Tomorrow will sell about 70% of whatever today sold. ::no
- Tomorrow will sell 0.7 times 400, which is 280 cups. ::no The coefficient never touches the sales figure itself and it is not a probability. It works on the gap from normal: 20 cups above normal today leaves about 14 of those cups expected to survive into tomorrow, and then tomorrow's own shock is added on top.

=== step === tryit
## Your turn: how far back does the memory reach?

If seven tenths of yesterday reaches today, then some of the day before yesterday must reach today as well, travelling through yesterday to get here. How much?

`pull_at()` can answer that. It is already defined, it works on `ar1`, and its only argument is the gap in days.

```r
# pull_at(k) gives the correlation between each day and the day k days earlier,
# measured on ar1, the shop where yesterday pulls today by 0.7.
# Ask it for a gap of two days, then for a gap of three days.
# Two lines. Press Check when you have them.
```
::check {"regex": "pull_at[(]\\s*2\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "Right: 0.455 at two days back and 0.29 at three. Set those beside 0.7 times 0.7, which is 0.49, and 0.7 cubed, which is 0.343. The pull has to travel through each day on its way, so it loses roughly three tenths of itself for every day it crosses.", "no": "`pull_at()` takes the gap in days, so it is `pull_at(2)` and then `pull_at(3)`. Wrap each one in `round(..., 3)` if you want a short answer back."}
::solution
```r
# Measure the pull at two days back and at three days back
round(pull_at(2), 3)
#> [1] 0.455
round(pull_at(3), 3)
#> [1] 0.29
```

Notice the shape of that. The memory thins out fast, but it never actually reaches zero. An AR shop keeps a trace of every day it has ever had.

=== step === concept
## A school trip walks in, and MA is why tomorrow still feels it

Now for the second kind of memory, and this is the one that gives people trouble.

A school trip walks into Meera's shop on a Thursday and buys forty cups in ten minutes. Nothing about the shop has changed. The weather is the same, the office across the road is the same, the prices are the same. One unusual thing happened, and it happened on Thursday.

Friday still comes in a little busy. A couple of them came back, one teacher told a colleague, the counter was stocked heavier than usual that morning. By Saturday it is over.

Look carefully at what carried into Friday there. It was not Thursday's sales level. It was Thursday's surprise, the shock, the part of Thursday nobody saw coming.

That is the MA part. Today is the normal 400, plus today's shock, plus a fraction of yesterday's shock.

MA stands for moving average, and the name is a genuine trap. It has nothing to do with smoothing a line by averaging nearby points, nothing whatsoever. It means a weighted sum of recent shocks, and the fraction it keeps is the **MA coefficient**, written with the Greek letter theta, \\(\theta\\).

We feed it the same 400 shocks one more time, so the comparison stays honest.

```r
# Build a shop where only yesterday's shock carries over
ma1    <- numeric(400)
ma1[1] <- 400 + surprise[1]
for (t in 2:400) {
  ma1[t] <- 400 + surprise[t] + 0.7 * surprise[t - 1]
}

plot(ma1, type = "l", col = "darkorange3", ylim = c(350, 445),
     main = "Yesterday's shock echoes by 0.7", xlab = "Day", ylab = "Cups sold")

round(c(one_day_back  = cor(ma1[2:400], ma1[1:399]),
        two_days_back = cor(ma1[3:400], ma1[1:398])), 3)
#>  one_day_back two_days_back
#>         0.450        -0.015
```

Set this loop next to the AR loop and a single word is doing all the work. The AR line reads `ar1[t - 1]`, which is yesterday's sales. This line reads `surprise[t - 1]`, which is yesterday's shock. Past values against past shocks, and that is the entire difference between the two letters.

The two correlations underneath say something the AR shop never said. One day back reads 0.450, so there is real memory in this shop. Two days back reads -0.015, which is nothing at all. The memory here does not thin out. It stops.

There is one more thing worth noticing before we move on. That 0.450 is not the 0.7 we put in, and it is not supposed to be. In an AR shop the one-day correlation lands near phi, which is why 0.666 turned up. In an MA shop it does not land near theta, because today and yesterday have only one shock in common out of the two that each of them carries. Reading 0.450 off as "the MA coefficient" would be wrong.

=== step === concept
## A shock that fades forever against a shock that stops after a day

We have two rules now, both with 0.7 in them, and both plots look like a plausible coffee shop. To tell them apart we have to stop feeding them noise and push exactly one thing through instead.

So here is a twenty day stretch where every single day lands dead on normal, except day 6, when a coach party stops outside and the shop sells 100 cups more than usual. There are no other shocks anywhere. We run that one rush through both rules and watch what each one does with it.

```r
# Send one 100 cup rush through both rules and see how long each one holds it
rush    <- numeric(20)
rush[6] <- 100

ar_pulse <- numeric(20)
ma_pulse <- numeric(20)
for (t in 2:20) {
  ar_pulse[t] <- 0.7 * ar_pulse[t - 1] + rush[t]
  ma_pulse[t] <- rush[t] + 0.7 * rush[t - 1]
}

plot(ar_pulse, type = "b", pch = 16, col = "steelblue", ylim = c(-5, 110),
     main = "One rush of 100 extra cups", xlab = "Day", ylab = "Cups above normal")
lines(ma_pulse, type = "b", pch = 17, col = "darkorange3")
legend("topright", c("AR rule", "MA rule"), bty = "n",
       col = c("steelblue", "darkorange3"), pch = c(16, 17))

pulse <- rbind(AR = ar_pulse[6:11], MA = ma_pulse[6:11])
colnames(pulse) <- paste("day", 6:11)
round(pulse, 1)
#>    day 6 day 7 day 8 day 9 day 10 day 11
#> AR   100    70    49  34.3     24   16.8
#> MA   100    70     0   0.0      0    0.0
```

Both rules start out identical. Day 6 is 100 cups up, day 7 is 70 cups up. Then they part company completely.

The AR rule keeps 0.7 of whatever it had yesterday, and yesterday it was holding part of the rush, so the rush keeps feeding itself forward: 49, then 34.3, then 24, then 16.8. It roughly halves every couple of days and it never quite reaches zero. An AR shock is permanent in principle and tiny in practice.

The MA rule is looking at the shock itself, and there was only ever the one shock. On day 7 yesterday's shock was 100, so it adds 70. On day 8 yesterday's shock is zero, so it adds nothing. It stops dead.

That is the difference between AR and MA, and it really is the whole of it. AR feeds a surprise forward through the values it produces, so the surprise fades but never finishes. MA holds a surprise for a fixed number of days and then drops it, and with one MA term that number is one day.

[KEY INSIGHT]
AR looks back at past values, MA looks back at past shocks. Watch one odd day and you can tell which is which: under AR its effect keeps showing up for as long as you care to look, under MA with one term it is gone on the second day.

=== step === quiz
## Quick check: which part carries yesterday's surprise?

A shop has one strange Tuesday: a delivery van blocks the door for an hour and sales come in 60 cups under normal. Wednesday is a little below normal too. By Thursday the shop is back to its usual self and stays there. Which sentence describes what happened?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The AR part did it, because under an AR rule a bad day is finished with by the second day. ::no
- The MA part did it. What carried into Wednesday was Tuesday's shock, and an MA rule with one term drops a shock after exactly one day. ::ok Yes, and the give-away is how long it lasted. A drop that is completely gone on the second day is MA behaviour. An AR rule would still be showing something on Thursday, and on Friday, getting smaller each day without ever finishing.
- The MA part did it, and you can read the MA coefficient straight off as the correlation between one day and the next. ::no
- Neither part. One odd day is just noise, so no part of a model has anything to say about it. ::no The thing to look at is how long that one odd day keeps showing up. Under AR the drop fades across many days and never quite finishes; under MA with one term it stops dead after a day, which is what happened here. And the one-day correlation is not the MA coefficient: a shop built with theta of 0.7 measured 0.450, because today and yesterday share only one of the two shocks each of them carries.

=== step === concept
## A growing shop has no normal to lean on, which is non-stationary

Both rules we have written measure a day as a gap from normal. AR keeps 0.7 of yesterday's gap. A shock is itself a gap. The number 400 sat in both loops as the level everything else was measured against.

Meera's shop does not have a 400.

```r
# Compare Meera's average level early on with her average level later
first_60 <- mean(cups[1:60])
last_60  <- mean(cups[181:240])

plot(cups, type = "l", col = "steelblue", lwd = 2,
     main = "No fixed normal to lean on", xlab = "Day", ylab = "Cups sold")
segments(1, first_60, 60, first_60, col = "red", lwd = 3)
segments(181, last_60, 240, last_60, col = "red", lwd = 3)

round(c(first_60_days = first_60, last_60_days = last_60), 1)
#> first_60_days  last_60_days
#>         425.8         551.6
```

Her first sixty days averaged 425.8 cups. Her last sixty averaged 551.6. Those are the two red bars on the chart, and they are 126 cups apart.

So which number goes where the 400 went? 425.8 is badly wrong by the end. 551.6 was badly wrong at the start. There is no single normal to use, because the normal itself is moving.

A series that changes its behaviour as time passes like that is called **non-stationary**. Stationary is the opposite: a fixed average level, a fixed amount of wobble around that level, and no trend walking off in either direction. The memoryless shop was stationary, and so were the AR and MA shops. Meera is not.

This matters more than it might look. Written the way we wrote them, AR and MA need a normal to measure gaps from, and Meera does not supply one. That is the problem the third letter exists to solve.

=== step === concept
## Differencing asks how much the day changed, not how high it was

The fix is one line of R, and it is worth understanding rather than memorising.

Stop asking how many cups she sold. Ask how many more she sold than the day before.

What that does to the growth is the interesting part. A shop climbing by about a cup a day is a moving target while you look at the level. Look at the change instead and the growth stops moving: it is about one cup, on the first day and on the last day and on every day in between. The thing that had no fixed normal now has one.

`diff()` is the function for it. `diff(cups)` gives 239 numbers, each one today minus yesterday.

```r
# Turn the levels into day to day changes and put the two charts side by side
change_in_cups <- diff(cups)

par(mfrow = c(2, 1), mar = c(4, 4, 2, 1))
plot(cups, type = "l", col = "steelblue",
     main = "Cups sold", xlab = "Day", ylab = "Cups")
plot(change_in_cups, type = "l", col = "seagreen",
     main = "Change from the day before", xlab = "Day", ylab = "Cups")
abline(h = 0, col = "grey55")
par(mfrow = c(1, 1))

round(c(average_change = mean(change_in_cups), typical_change = sd(change_in_cups)), 2)
#> average_change typical_change
#>           0.99           4.39
```

The top panel climbs from 381 to 618. The bottom panel does not climb anywhere. It wobbles around a line just above zero, and the size of that wobble does not grow as the shop grows.

The two numbers underneath say the same thing in figures. The average change is 0.99 cups, so she genuinely is growing, by roughly a cup a day. The typical change is 4.39 cups either side of that, and unlike the level, that number is not heading anywhere.

So the growth did not disappear. It turned into a constant, and a constant is something AR and MA can work with, because it is just the normal that the changes sit around. It is doing exactly the job the 400 did.

Doing this once is what the **I** in ARIMA means, and the count of how many times you do it is d. One round of differencing is d = 1. Nearly every business series you meet is d = 0 or d = 1, and d = 2 turns up occasionally, when even the growth rate is growing.

I is short for integrated, which sounds like the wrong word for an operation built on subtraction. That is worth sorting out.

=== step === concept
## Adding the changes back up is what integrated means

Nothing was thrown away when we differenced. The changes hold everything the levels held, and you can prove it by walking back.

Start at day one's 381 cups. Add the first change and you have day two. Add the next and you have day three. Keep going and the whole series comes back. `cumsum()` does that running total in a single call.

```r
# Add the changes back up and check that we land on the original series
rebuilt <- cups[1] + cumsum(change_in_cups)

head(rebuilt, 6)
#> [1] 382 389 392 398 407 408
head(cups[-1], 6)
#> [1] 382 389 392 398 407 408
all.equal(rebuilt, cups[-1])
#> [1] TRUE
```

They are identical, and not just for the first six days, because `all.equal()` checked all 239 of them.

So differencing is reversible, and running it backwards is a running total. Adding a series up like that is called integrating it, and that is where the I gets its name. An ARIMA model works on the differences and then integrates them, so what comes out the far end is cups sold rather than changes in cups sold.

That is also why d matters when you go to use a model rather than just describe one. Fit an ARIMA with d = 1 and what it forecasts, underneath, are the changes. The integrating step is what turns those forecasts back into something Meera can read.

=== step === quiz
## Quick check: what one round of differencing leaves you with

Meera's 240 days climb from 381 cups to 618. We replaced them with `diff(cups)`, the 239 day to day changes. What is true of that differenced series?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It has no trend left and no growth information left either, because subtracting took the growth out of the data. ::no
- It has no climb left, and the growth survives as a positive average change of about one cup a day. ::ok Exactly. The question changed from how high the shop is to how much it moved, and the growth is still in there, sitting in the average of the changes instead of in a slope.
- It is the same series shifted down by 381 cups. ::no
- It answers the same question the levels did, only in smaller numbers. ::no Differencing changes the question, not the information. The climb is gone from the picture, but nothing was lost: the growth is now the average change, about one cup a day, and adding the changes back up returns the original series exactly.

=== step === concept
## ARIMA(2,1,1), read out as a sentence

Every piece is on the table now, so let's put the label together.

ARIMA takes three numbers and they are always written in the same order, p, d and q.

- **p** is the AR order: how many past days today leans on.
- **d** is how many times the series was differenced.
- **q** is the MA order: how many past shocks still echo into today.

So ARIMA(2,1,1) is not a code. It is three statements about the data, one per number.

::widget process-flow {"steps":[{"title":"p = 2, the AR part","sub":"today leans on the last two days of sales"},{"title":"d = 1, the I part","sub":"the climb was taken out once, using day to day changes"},{"title":"q = 1, the MA part","sub":"one day of surprise still echoes into today"}]}

Said out loud, in one breath: today depends on the last two days, the trend was taken out once, and one day of random noise still echoes.

That is the sentence the label was always trying to say, and the same reading works on any label you meet. ARIMA(0,0,0) is a shop with no memory at all, which is where we began. ARIMA(1,0,0) is pure AR on a series that needed no differencing. ARIMA(0,1,1) is a trending series with one day of echo and no pull from past levels whatsoever.

=== step === concept
## The equation is the recipe that made Meera's data

There is an equation behind that sentence, and it is worth seeing once, because it is not a new idea. It is the two loops we already wrote, added together and pointed at the changes instead of the levels.

Write the differenced series as y prime, so \\(y'_t = y_t - y_{t-1}\\) is the change on day t. Then ARIMA(2,1,1) says this.

$$y'_t = c + \phi_1 y'_{t-1} + \phi_2 y'_{t-2} + \varepsilon_t + \theta_1 \varepsilon_{t-1}$$

Every symbol in it already has a plain meaning.

- \\(y'_t\\) is today's change in cups sold, which is the d = 1 already applied.
- \\(c\\) is a constant. It is what pushes the average change above zero, and that is the growth.
- \\(\phi_1\\) and \\(\phi_2\\) are the AR coefficients: how much of the change one day back and two days back carries into today. There are two of them, so p = 2.
- \\(\varepsilon_t\\) is today's shock, the part nobody could have seen coming.
- \\(\theta_1\\) is the MA coefficient: how much of yesterday's shock echoes into today. There is one of it, so q = 1.

And here is the good bit. That equation is the loop that built Meera's shop. It is the same thing, written once in symbols and once in R.

```r
# Write out the recipe that made Meera's data, with every piece named
set.seed(21)
jolt   <- rnorm(240, sd = 3)
change <- numeric(240)
change[1] <- 1
change[2] <- 1
for (t in 3:240) {
  change[t] <- 0.55 +                    # c, the constant
               0.30 * change[t - 1] +    # phi 1, yesterday's change
               0.15 * change[t - 2] +    # phi 2, the change the day before
               jolt[t] +                 # today's shock
               0.7  * jolt[t - 1]        # theta 1, yesterday's shock
}
cups <- round(380 + cumsum(change))      # the differencing, run backwards

round(c(average_change = mean(change),
        from_the_formula = 0.55 / (1 - 0.30 - 0.15)), 3)
#>   average_change from_the_formula
#>            0.993            1.000
```

`change` is y prime, the differenced series. `jolt` holds the shocks, the epsilons. The three coefficients are 0.30, 0.15 and 0.70, and they sit in the loop exactly where phi 1, phi 2 and theta 1 sit in the equation. The last line, the `cumsum()`, is the integrating that turns changes back into cups.

The constant does one job and it is easy to check. Feed 0.55 into a rule that keeps 0.30 and 0.15 of the two previous changes, and in the long run the average change settles at 0.55 divided by 1 minus 0.30 minus 0.15, which is exactly 1. That is one extra cup a day. Over 240 days it came out at 0.993.

That loop was soup when we started. Read it again now.

=== step === concept
## Fitting the model, and checking it against the truth

We built everything so far ourselves. Now let's run it the other way: hand R the 240 numbers with no explanation, tell it what shape to look for, and see whether it can find the coefficients we used.

`Arima()` from the forecast package does the fitting. `order = c(2, 1, 1)` is p, d and q in that order. `include.drift = TRUE` tells it to allow a non-zero average change, which for Meera is the growth of about a cup a day. That is the one cup a day the constant works out to, and not the 0.55 itself. Leave it out and R would assume the changes average zero.

```r
# Fit ARIMA(2,1,1) to the 240 days and set the estimates beside the recipe
library(forecast)

fit <- Arima(cups, order = c(2, 1, 1), include.drift = TRUE)
fit
#> Series: cups
#> ARIMA(2,1,1) with drift
#>
#> Coefficients:
#>          ar1     ar2     ma1   drift
#>       0.2978  0.1633  0.6374  1.0169
#> s.e.  0.1433  0.1220  0.1202  0.5789
#>
#> sigma^2 = 8.934:  log likelihood = -599.26
#> AIC=1208.53   AICc=1208.78   BIC=1225.91

data.frame(
  term       = c("ar1", "ar2", "ma1", "drift"),
  built_with = c(0.30, 0.15, 0.70, 1.00),
  estimated  = round(as.numeric(coef(fit)[c("ar1", "ar2", "ma1", "drift")]), 3)
)
#>    term built_with estimated
#> 1   ar1       0.30     0.298
#> 2   ar2       0.15     0.163
#> 3   ma1       0.70     0.637
#> 4 drift       1.00     1.017
```

Line them up. We used 0.30 and R found 0.298. We used 0.15 and R found 0.163. We used 0.70 and R found 0.637. We built in growth of one cup a day and R found 1.017.

Not one of them is exact, and not one of them should be. R never saw the recipe, only 240 days of a coffee shop, and 240 days is a sample. The `s.e.` row is R telling you how loose each estimate is: the ma1 estimate of 0.6374 carries a standard error of 0.1202, so a true value of 0.70 sits comfortably inside its range.

The `drift` line deserves a second look, because it is the loosest of the four. The estimate is 1.0169 with a standard error of 0.5789, which is a wide net around a small number. Two hundred and forty days is plenty for pinning down how the shop remembers, and thin for pinning down how fast it grows.

Ignore the bottom block for now. `sigma^2` is the size of the leftover shocks, and AIC, AICc and BIC are scores for holding one model up against another. With only one model on the table there is nothing to compare.

Then read the header line back one more time. `ARIMA(2,1,1) with drift`. Today depends on the last two days, the trend was taken out once, one day of noise still echoes, and the shop is growing. That is Meera's coffee shop, in a single line.

=== step === quiz
## Quick check: which label fits the shop next door?

The bakery next door keeps its own numbers. Loaves sold sit around 900 a day and have done for two years, with no climb in either direction. Today's sales lean on the last two days. Beyond that, nothing extra carries over from a day's own surprise. Which label fits the bakery?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- ARIMA(0,0,2), since the memory reaches two days back. ::no
- ARIMA(2,0,0). ::ok Right. Two past days makes p = 2, no trend to remove makes d = 0, and no separate echo of a past shock makes q = 0.
- ARIMA(2,1,1), since one difference and one echo are the usual defaults. ::no
- ARIMA(2,1,0), since a series always needs one difference before AR can work on it. ::no Take the three numbers one at a time and each is a plain question. p is how many past days today leans on, and the bakery leans on two. d is how many differences the trend needs, and a series that has been level for two years needs none. q is how many past shocks echo on their own, and there are none here. That gives ARIMA(2,0,0).

=== step === tryit
## Your turn: a shop whose busy day is followed by a quiet one

Coefficients do not have to be positive. A negative theta says yesterday's surprise comes back with its sign flipped: a rush yesterday means a lull today. Real shops do that, when a big day empties the shelves, or when the regulars who stocked up on Thursday stay home on Friday.

`rush` is still in memory: twenty quiet days with one 100 cup rush on day 6. Build an MA rule with a theta of -0.7 rather than 0.7, push the rush through it, and look at what days 5 to 10 do.

```r
# rush is 20 days of nothing, with one 100 cup rush on day 6.
# Change the echo below from plus 0.7 to minus 0.7, so a rush
# yesterday pulls today down instead of up. Then press Check.
ma_down <- numeric(20)
for (t in 2:20) {
  ma_down[t] <- rush[t] + 0.7 * rush[t - 1]
}
round(ma_down[5:10], 1)
```
::check {"regex": "-\\s*0?[.]7\\s*[*]\\s*rush", "gate": true, "difficulty": "intermediate", "ok": "That is it: 100 on day 6, then minus 70 on day 7, then nothing at all. The shape flipped, so a busy day is followed by a quiet one, and the echo still stops dead after exactly one day. A negative theta changes the direction of the echo, never its length.", "no": "Change the plus in front of `0.7 * rush[t - 1]` to a minus, so the line reads `ma_down[t] <- rush[t] - 0.7 * rush[t - 1]`."}
::solution
```r
# Push the one rush through an MA rule whose echo is minus 0.7
ma_down <- numeric(20)
for (t in 2:20) {
  ma_down[t] <- rush[t] - 0.7 * rush[t - 1]
}

plot(ma_down, type = "b", pch = 17, col = "darkorange3", ylim = c(-80, 110),
     main = "A busy day, then a quiet one", xlab = "Day", ylab = "Cups above normal")
abline(h = 0, col = "grey55")

round(ma_down[5:10], 1)
#> [1]   0 100 -70   0   0   0
```

The sign of theta sets which way the echo goes. The size of q sets how long it lasts, and that is still one day.

=== step === tryit
## Your turn: strip the growth out of Meera's series

Here is one more, and it leans on all three letters at once.

Meera's changes average 0.99 cups a day, and that average is her growth. Take it out of every single change and the growth has nowhere left to live. Add what is left back up and you get a version of her shop that wobbles exactly the way it really wobbled, with the climb gone.

`change_in_cups` and `cups` are both still here. There are three pieces to it: subtract the average change from every change, run `cumsum()` over what remains, and start the running total at `cups[1]`.

```r
# change_in_cups holds the 239 day to day changes in Meera's shop.
# Subtract the average change from every one of them, add the result
# back up with cumsum(), and start that running total at cups[1].
# Call it flat_cups and plot it. Press Check when you have it.
```
::check {"regex": "cumsum[(][\\s\\S]*?-\\s*mean[(]", "gate": true, "difficulty": "intermediate", "ok": "Right: it starts at 381 and finishes at 381. Taking one number out of every change was enough to remove the whole climb, and every day-to-day wobble came through unchanged.", "no": "One line does it: `flat_cups <- cups[1] + cumsum(change_in_cups - mean(change_in_cups))`. Subtract the average change first, then take the running total of what is left."}
::solution
```r
# Take the steady climb out of Meera's series and keep the wobble
flat_cups <- cups[1] + cumsum(change_in_cups - mean(change_in_cups))

plot(flat_cups, type = "l", col = "seagreen", lwd = 2,
     main = "Meera with the climb removed", xlab = "Day", ylab = "Cups sold")

round(c(first_day = flat_cups[1], last_day = flat_cups[239]), 1)
#> first_day  last_day
#>       381       381
```

Look at where it goes in between, though, because it does not settle around 381 either. It drifts as low as 303 and as high as 460. Take the trend out of a series built from cumulative changes and what is left still wanders, because every change is added into the total and stays there forever. That wandering is exactly why d = 1 was needed in the first place. The level has no anchor. Only the changes do.

=== step === concept
## References

- [Forecasting: Principles and Practice, chapter 9, ARIMA models](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos (3rd edition). The clearest free treatment of AR, differencing and MA, with the backshift notation worked out.
- [Time Series Analysis: Forecasting and Control](https://doi.org/10.1002/9781118619193) - Box, Jenkins and Reinsel, Wiley. The book the whole method comes from, and the source of the Box-Jenkins name.
- [Time Series Analysis and Its Applications](https://doi.org/10.1007/978-3-319-52452-8) - Shumway and Stoffer (4th edition, Springer 2017). Chapter 3 covers ARIMA and the duality between AR and MA that makes the two shock patterns behave the way they do.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The paper behind `Arima()` and the rest of the forecast package.
- [ARIMA Modelling of Time Series](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html) - R Core Team, the documentation for `stats::arima`, which `Arima()` wraps.

=== step === complete
## Quick recap

You built all three letters by hand, out of one coffee shop.

- **AR** is memory of past values. Today keeps a fraction of how far yesterday sat from normal, and p says how many days back that reaches. A surprise fades forever under AR, getting smaller every day without ever finishing.
- **MA** is memory of past shocks. Today keeps a fraction of yesterday's surprise, and q says how many days of surprise still count. A surprise stops dead after q days.
- **I** is what you do to a series with no fixed normal to lean on. Difference it, work on the changes instead of the levels, and d says how many times. Adding the changes back up is the integrating that gives the letter its name.

So ARIMA(2,1,1), out loud: today depends on the last two days, the trend was taken out once, and one day of random noise still echoes.

And when R was handed Meera's 240 days with no explanation at all, it came back with 0.298, 0.163, 0.637 and growth of 1.017 a day, against the 0.30, 0.15, 0.70 and 1.0 the shop was built from. It managed that not because it knew the recipe, but because a recipe leaves fingerprints in the numbers it produces.

The natural question from here is how you pick p, d and q when nobody hands you the recipe, and the answer starts with two plots called the ACF and the PACF.

Congratulations, you have got ARIMA decoded. Have a great day!
