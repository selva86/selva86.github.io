---
title: "Which distribution when: a field guide"
slug: "Foundations-Mini-5"
description: "Poisson, binomial, exponential or normal? Read one coffee kiosk's own records in R and learn the single question that names the family behind a quantity."
keywords: "which distribution when, choosing a probability distribution, poisson vs binomial, exponential distribution in R, normal distribution in R, rpois rbinom rexp rnorm, count data in R, overdispersion"
mathjax: false
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "5"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: "Foundations-Mini-4"
course_next: ""
curriculum_id: "0.0.44"
lesson_access: "windowed"
catalog_blurb: "How to tell which distribution a quantity came from, in one question."
---

=== step === cover
::eyebrow Probability Foundations
## Which distribution when: a field guide

Three questions land on you in one morning.

You are helping out at a coffee kiosk outside a metro station. The owner wants to know how many customers walk up in an hour, because she is deciding whether a second machine pays for itself. The shift manager wants to know how many of the ten loyalty offers he makes each shift get taken. And the engineer wants to know how long the grinder runs before it needs a reset.

Three questions, and every one of them wants a different shape of answer.

Here is the part that makes this easier than it looks. Each of those already has a distribution built for it. Somebody worked out the mathematics of counting events inside a window, of counting successes out of a fixed number of tries, and of waiting for the next thing to happen, long before your kiosk existed. You are not being asked to invent anything. You only have to look at the quantity in front of you and recognise which of those situations you are in.

That recognition is most of the modelling work.

So we are going to read one kiosk's records the way a field guide reads a bird. What names the family is not the subject the data came from, because coffee has nothing to do with it, but the shape of the question you asked. Three things settle it: whether you counted or measured, whether there is a ceiling or an open window, and whether you are timing a wait or adding up small influences.

Four families fall out of that: Poisson, binomial, exponential and normal. We will take the everyday situation each one was made for, generate it in R, hold it against the log, and boil it down to the one question that names it.

Whatever the quantity turns out to be, the work comes down to three moves.

::widget process-flow {"steps":[{"title":"Name what you recorded","sub":"counted or measured, and where the limits are"},{"title":"Match it to a family","sub":"the one built for that shape of question"},{"title":"Check it against the log","sub":"generate it in R and see if the numbers agree"}]}

"Which distribution is this?" is going to stop being a guess and become a check you run in your head in about ten seconds.

=== step === concept
## Four records, and the first fork: counted or measured?

We do not have the kiosk's real ledger in front of us, so we will build a stand-in for it: four records, each generated at the rate the kiosk actually runs at, and each one a number you could have read off a real log.

- **arrivals**: customers walking up per hour, about 15 an hour.
- **signups**: loyalty offers taken, out of the ten made each shift, about 3 of them.
- **hours_to_fail**: hours the grinder runs before it needs a reset, about 40 on average.
- **dose_g**: the weight of one ground dose in grams, 18 give or take 0.4.

Beside each one we print a small fingerprint: whether every value is a whole number, the smallest and largest, the average, the middle value, and the variance. Press Run.

```r
# Build the kiosk's four records and print a fingerprint of each
set.seed(11)
arrivals      <- rpois(200, lambda = 15)                # customers walking up per hour
signups       <- rbinom(120, size = 10, prob = 0.3)     # offers taken, out of the ten made per shift
hours_to_fail <- rexp(80, rate = 1/40)                  # hours the grinder runs before a reset
dose_g        <- rnorm(200, mean = 18, sd = 0.4)        # weight of one ground dose, in grams

fingerprint <- function(x) data.frame(
  whole_numbers = all(x == floor(x)),
  min           = round(min(x), 1),
  max           = round(max(x), 1),
  mean          = round(mean(x), 1),
  median        = round(median(x), 1),
  variance      = round(var(x), 1)
)

rbind(
  "customers per hour"     = fingerprint(arrivals),
  "offers taken out of 10" = fingerprint(signups),
  "grinder hours to reset" = fingerprint(hours_to_fail),
  "dose weight in grams"   = fingerprint(dose_g)
)
#>                        whole_numbers  min   max mean median variance
#> customers per hour              TRUE  6.0  26.0 14.7   15.0     15.7
#> offers taken out of 10          TRUE  0.0   7.0  3.1    3.0      2.1
#> grinder hours to reset         FALSE  0.3 185.9 38.2   25.7   1695.9
#> dose weight in grams           FALSE 16.9  19.1 18.0   17.9      0.2
```

Read the `whole_numbers` column first, because that one column does more work than the other five put together.

Customers and offers taken are counted. There is no such thing as 14.6 customers walking up, and no such thing as 3.4 offers taken. Grinder hours and dose weights are measured. A run can last 38.2 hours or 38.23 hours or anything in between, and the scale under the portafilter will happily read 17.94 grams.

Why does that split matter so much? Because the families themselves are built one way or the other. A family for counts puts its probability on 0, 1, 2, 3 and nothing in between, so asking it for the chance of exactly 4 is a sensible question with a real answer. A family for measurements spreads its probability smoothly along a scale, and asking it for the chance of exactly 18.000 grams gives you zero, because there is always a value closer.

So before you have chosen anything at all, that column has ruled out half the field.

The other columns separate the families inside each half. Look at how differently the four behave: the offers taken never pass 7 and have a variance of 2.1, while the grinder hours run from 0.3 to 185.9 with a variance in the thousands. Ceilings, floors and spread are the next things we read.

=== step === quiz
## Quick check: counted or measured?

The bakery next door keeps its own records. Which of these is a counted quantity, the kind that can only ever land on whole numbers?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The takings at the till each day, because money arrives in coins and notes. ::no
- The number of loaves left unsold when the shutters come down. ::ok Yes. Unsold loaves can be 0, 1, 2 and nothing in between, so it is counted, and the count families are the ones to look at.
- The average number of customers a day over the last month, which came out at 42.6. ::no
- The temperature of the oven, logged every hour. ::no Counted means the quantity itself can only land on whole numbers. Unsold loaves can only be 0, 1, 2 and so on, so that is the counted one. Takings can be any amount on a money scale, however the coins happen to add up, and oven temperature can be any value at all. As for the 42.6, that is an average of counts rather than a count: averaging whole numbers gives you decimals all the time, so an average never tells you whether the underlying quantity was counted or measured.

=== step === concept
## Arrivals in an hour: the Poisson

Start with the owner's question: how many customers walk up in an hour.

Look at what is actually in that question. There is a window, one hour. There are events, customers arriving. There is a rate, about fifteen an hour. And there is no fixed number of tries anywhere. The hour does not hand the world ten chances to produce a customer, it simply runs, and people turn up whenever they turn up.

That is precisely the situation the **Poisson distribution** was built for. It counts events inside a fixed window of time or space, when those events turn up at a steady average rate.

It has one knob, and only one. That knob is the rate, written **lambda**, and it is the average number of events you expect in one window. Set lambda to 15 and you have described the kiosk's hourly arrivals completely. There is nothing else to specify.

So `rpois(200, lambda = 15)` reads as "give me 200 hours at this kiosk". Here are the first twelve of them, then the quietest and busiest hours in the whole log, then all 200 drawn as a histogram.

```r
# Look at the hourly customer counts on their own
head(arrivals, 12)
#>  [1] 12  6  9 10 20 17 14 11 16 13 14 21

range(arrivals)
#> [1]  6 26

hist(arrivals, breaks = 20, col = "grey85", border = "white",
     main = "200 hours at the kiosk", xlab = "Customers arriving in one hour")
```

The pile sits over 15, which is lambda, and that is where a Poisson always centres. The quietest hour in the 200 brought 6 customers and the busiest brought 26.

Notice that the shape is not symmetric. It cannot reach below zero, because an hour cannot have minus three customers in it, so the left side runs out of room quickly. The right side has nothing stopping it, so it trails away slowly. Every count family has that lopsided look, and for the same reason.

=== step === concept
## What the Poisson assumes, and the question that identifies it

Now for the property that makes the Poisson checkable, and it is the most useful single fact in this whole guide.

For a Poisson, the mean and the variance are the same number. Both of them equal lambda.

Most families do not work like that. A normal has a mean and a standard deviation and you set them independently, so a bell centred on 18 can be as tight or as wide as you please. The Poisson gives you no such choice. Tell it the rate and the spread arrives with it, already decided. That is a strong claim, and that is exactly why it is useful: a strong claim is one you can hold against a real log and watch survive or fail.

```r
# For a Poisson, the average and the variance should be the same number
round(c(mean = mean(arrivals), variance = var(arrivals)), 2)
#>     mean variance
#>    14.66    15.67
```

Both land near 15. They are not identical, and they should not be. Two hundred hours is a sample, not the whole truth, so the two numbers wobble around lambda rather than sitting exactly on it. What matters is that they are the same size. A mean of 14.66 sitting beside a variance of 15.67 is a Poisson behaving itself.

Three things have to be true for that to hold, and they are worth saying plainly, because they are what you agree to when you pick this family.

1. **No ceiling.** There is no maximum number of customers an hour could bring. Twenty six happened, and forty was not forbidden, only unlikely.
2. **One steady rate.** Lambda is the same in every hour of the log. Nine in the morning and three in the afternoon run at the same average.
3. **Events are independent**, which here just means they do not nudge each other. One customer arriving neither invites nor blocks the next one.

So here is the question that identifies the Poisson, and it is the only one you need to ask.

[KEY INSIGHT]
Am I counting events inside a window, with no fixed number of tries? If yes, the Poisson is the family to reach for, and putting the mean beside the variance is the check that decides whether your log agrees.

=== step === concept
## Ten offers, how many are taken: the binomial

Now the shift manager's question, and watch what changes.

He makes exactly ten loyalty offers a shift. Not about ten. It is ten every shift. Each customer he offers it to either takes it or does not, and roughly 30% of them take it. At the end of the shift he writes down one number: how many of the ten were taken.

The count still lands on whole numbers, so we are still in the counting half. But something new has appeared, and it is the ceiling. This count can be 0, 1, 2, all the way up to 10, and it can never be 11, because there were only ten offers to take.

That is the **binomial distribution**. It counts successes out of a fixed number of independent tries, where every try has the same chance of succeeding. It takes two knobs: `size`, the number of tries, and `prob`, the chance any one try succeeds. Here those are 10 and 0.3.

Let's count how the 120 shifts came out.

```r
# Count how often each number of offers was taken, out of the ten made
table(signups)
#> signups
#>  0  1  2  3  4  5  6  7
#>  1 15 29 28 28 12  5  2

hist(signups, breaks = seq(-0.5, 10.5, 1), col = "grey85", border = "white",
     main = "120 shifts at the kiosk", xlab = "Offers taken, out of the 10 made")
```

In one shift out of the 120, nobody took the offer at all. The commonest results were two, three and four takers. The best shift in the whole log got seven.

The average is something you can work out before you look: ten tries at a 30% chance each gives you three takers, and the log agrees at 3.1. Eight, nine and ten simply did not happen in these 120 shifts. They were allowed, just unlikely. Eleven was never allowed at all, and that is the difference we are about to lean on.

=== step === concept
## Fixed tries or an open window?

Both counting families land on whole numbers, both are lopsided, and if you set them to the same average their piles look almost alike. This is the mix-up that actually costs people money, so let's pin it down properly.

The separator is the ceiling.

Let's make the two as alike as we can and see what refuses to match. The offers taken average about 3 a shift, so we build a Poisson with lambda 3 and stand the two side by side. Then, to make the ceiling itself visible, we simulate 100,000 shifts of each and count how many ever went past 10.

```r
# Hold the offers taken against a Poisson with the very same average
set.seed(2)
pois_3    <- rpois(120, lambda = 3)
big_pois  <- rpois(100000, lambda = 3)
big_binom <- rbinom(100000, size = 10, prob = 0.3)

round(rbind(
  binomial = c(mean = mean(signups), max = max(signups), variance = var(signups)),
  poisson  = c(mean = mean(pois_3),  max = max(pois_3),  variance = var(pois_3))
), 2)
#>          mean max variance
#> binomial 3.11   7     2.10
#> poisson  3.02   8     3.44

c(binomial_shifts_over_10 = sum(big_binom > 10),
  poisson_hours_over_10   = sum(big_pois  > 10))
#> binomial_shifts_over_10   poisson_hours_over_10
#>                       0                      31

edges <- seq(-0.5, max(signups, pois_3) + 0.5, 1)
par(mfrow = c(1, 2))
hist(signups, breaks = edges, col = "grey85", border = "white",
     main = "Offers taken, out of 10", xlab = "Count in a shift")
hist(pois_3, breaks = edges, col = "grey85", border = "white",
     main = "A Poisson with the same average", xlab = "Count in a shift")
par(mfrow = c(1, 1))
```

Read the variance column. Both average about 3, and yet the binomial's spread is 2.10 while the Poisson's is 3.44. That gap is not an accident of this sample. A binomial's variance is the number of tries times the chance of success times the chance of failure, so 10 times 0.3 times 0.7, which is 2.1. A Poisson's variance is lambda, which is 3. A count that can never pass 10 has less room to spread than a count with no upper limit at all, and the variance is where that shows up.

The second output makes the ceiling itself concrete. In 100,000 simulated shifts the binomial never once went past 10, because it cannot. In 100,000 simulated hours the Poisson went past 10 thirty one times. Rare, and possible, and possible is the whole point.

There is one place where the two families nearly agree, and it explains why the mix-up survives. Make the number of tries large and the chance of success small while holding their product fixed, and two things happen at once. The ceiling drifts so far out that nothing ever gets near it, and the chance of failure gets so close to 1 that the binomial's variance is barely different from its mean. At that point the two are practically the same distribution, so choosing wrongly costs you almost nothing. Ten tries at 30% is nowhere near that corner, and there the choice costs you plenty.

[KEY INSIGHT]
Can you name the number of tries before you start? If yes, it is a binomial. If the window simply runs and events turn up inside it, it is a Poisson.

=== step === quiz
## Quick check: which counting family?

All four of these are counts. Only one of them has a fixed number of tries, which is what makes it a binomial. Which one?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Typos found on a printed page. ::no
- Calls arriving at a helpline between nine and ten in the morning. ::no
- Of the 40 vouchers the kiosk hands out on Saturday, the number that get redeemed. ::ok That is the one. Forty vouchers went out, so redemptions can run from 0 to 40 and never further. A number of tries you can name before you start is exactly what the binomial needs.
- Complaints logged about the kiosk in a day. ::no The binomial needs a fixed number of tries, a number you could write down before anything happened. Forty vouchers were handed out, so redemptions live between 0 and 40 and can never pass it. A page has no fixed number of chances to be a typo, an hour has no fixed number of chances to be a call, and a day has no fixed number of chances to be a complaint. Those three are counts inside an open window, which is the Poisson's job.

=== step === concept
## How long until the next failure: the exponential

The engineer's question is different from both of the others. Look at exactly how.

Nothing is being counted. He is not asking how many resets happen in a week. He is asking how long the grinder runs before the next one, and the answer is a measured quantity: 38.2 hours, or 0.3 hours if the Monday is going badly.

When events turn up at a steady rate and you measure the wait until the next one, that wait follows the **exponential distribution**. It takes one knob, the same rate the events arrive at, and the average wait is one divided by that rate. The kiosk grinder averages 40 hours between resets, so the rate is 1/40 of a reset per hour, and `rexp(80, rate = 1/40)` reads as "give me 80 grinder runs".

So the question that names this one is the shortest in the guide. Am I measuring how long until something happens? If yes, it is an exponential.

```r
# The grinder's run times, and where their middle sits
round(head(hours_to_fail, 8), 1)
#> [1] 120.7  74.4  13.7  57.0   3.8   6.5  36.1   6.7

round(c(mean = mean(hours_to_fail), median = median(hours_to_fail)), 1)
#>   mean median
#>   38.2   25.7

hist(hours_to_fail, breaks = 20, col = "grey85", border = "white",
     main = "80 runs of the kiosk grinder", xlab = "Hours until a reset was needed")
```

Look at the first eight runs before anything else. One lasted 120.7 hours and another gave up after 3.8. That is not a broken grinder, that is what the family looks like.

The histogram says the same thing more clearly, and its tallest bar is the leftmost one. The commonest outcome is a short run. People find that odd the first time, because the average is 40 hours and a 4 hour run feels like a failure, but the exponential always piles up near zero and trails away to the right.

That lopsidedness is also why the mean and the median sit so far apart. The average run lasted 38.2 hours, while the middle run lasted 25.7. A handful of very long runs drag the average up and leave the median where most of the data actually lives. Whenever a measured quantity has a floor at zero and a long right tail, expect the mean to sit well above the median.

One more property, because it explains a lot of what the exponential does. Say the grinder has already run for 30 hours. The wait still ahead of it looks exactly like the wait it had when it was switched on. Waiting does not use up your bad luck. The standard name for that is **memoryless**, and the exponential is the only continuous family that has it.

=== step === concept
## Counts and waits are two views of one stream

Here is the idea that turns four separate families into a map you can navigate.

The owner and the engineer are looking at the same kind of thing. Customers arrive at 15 an hour. That is a rate, and a rate can be read two ways: as a count, fifteen people per hour, or as a wait, one person every four minutes. Same stream, two questions, and the family follows the question rather than the stream.

Let's prove it by building the stream out of waits and pulling counts out of the other end. We simulate 3,000 gaps from an exponential at 15 an hour, add them up with `cumsum` to get the clock time of each arrival, then use `floor` to see which whole hour each arrival landed in and `tabulate` to count them up hour by hour. The very last hour is unfinished when the simulation stops, so we drop it.

```r
# Turn a stream of waits into a stream of hourly counts
set.seed(5)
gaps          <- rexp(3000, rate = 15)      # hours from one customer to the next
arrival_times <- cumsum(gaps)
whole_hour    <- floor(arrival_times)
per_hour      <- tabulate(whole_hour + 1, nbins = max(whole_hour))   # drop the unfinished last hour

round(c(mean_gap_in_minutes = mean(gaps) * 60,
        hours_logged        = length(per_hour),
        mean_per_hour       = mean(per_hour),
        variance_per_hour   = var(per_hour)), 2)
#> mean_gap_in_minutes        hours_logged       mean_per_hour   variance_per_hour
#>                3.94              196.00               15.26               15.66
```

The average gap came out at 3.94 minutes, which is the four minutes you would expect from 15 arrivals an hour. Those 3,000 gaps filled 196 complete hours.

Now read the last two numbers, because they are the payoff. The hourly counts average 15.26 and their variance is 15.66, the same size, both near 15. We never called `rpois` once, and a Poisson with lambda 15 came out anyway.

[KEY INSIGHT]
Exponential waits and Poisson counts describe one and the same stream of events. Which family you need is decided by the question you asked, not by the data you happen to hold.

=== step === tryit
## Your turn: how often does the grinder fail inside a shift?

The shift manager wants one number out of all this. A shift is 8 hours long. How often will he start a shift with a grinder that will not survive it?

That is a question about the exponential, and you already have everything you need to answer it. The run times average 40 hours, so the rate is 1/40. The block below simulates 5,000 runs for you. One line is left to write: the share of those runs that end before 8 hours are up.

A comparison like `runs < 8` gives you 5,000 TRUEs and FALSEs, and `mean()` on that turns straight into the share that were TRUE.

```r
# Simulate 5,000 grinder runs, then measure how many end inside one shift
set.seed(7)
runs <- rexp(5000, rate = 1/40)

# One line to go: what share of these runs end before 8 hours?
# Press Check when you have it.
```
::check {"regex": "mean[(]\\s*runs\\s*<\\s*8", "gate": true, "difficulty": "beginner", "ok": "That is it: 0.1782, so a little under one shift in five starts with a grinder that will not finish it. The family answers the same question exactly with 1 - exp(-8/40), which is 0.1813, and 5,000 simulated runs landed within half a percentage point of it.", "no": "One line does it: mean(runs < 8). The comparison gives you 5,000 TRUEs and FALSEs, and mean() turns that into the share that came out TRUE."}
::solution
```r
# Share of grinder runs that are over before an 8 hour shift ends
mean(runs < 8)
#> [1] 0.1782

1 - exp(-8/40)
#> [1] 0.1812692
```

One thing is worth naming here, because it is what let us answer the question at all. The manager's grinder has usually been running for a while by the time a shift starts, and we simulated 5,000 runs from new. For an exponential those are the same thing, because the wait ahead of you never ages. That is memorylessness doing real work rather than sitting there as a curiosity.

Look at how small that number feels against a 40 hour average. The mean wait is long, and short waits are still the commonest single outcome, and both of those are true at once. That is the exponential in one sentence.

=== step === concept
## Sums of many small influences: the normal

Only the dose weight is left, and it belongs to the one family everybody already knows by sight. The interesting question is not what a bell curve looks like. It is why the kiosk's dose weights should be one.

Think about what actually decides the weight of a single ground dose. The grind is a shade coarser than the last one. The tamp is a touch firmer. The humidity in the station shifted overnight. The scale drifts a little as it warms up. The bean is slightly denser at the bottom of the hopper. None of those is large, there are perhaps twenty of them, they push in both directions, and the weight you get is all of them added together.

So let's build a dose out of exactly that and see what shape falls out. `runif(20, -0.15, 0.15)` gives twenty nudges, each at most 0.15 grams either way, every value in that range equally likely. Not one of them is bell shaped: a uniform draw is a flat block with hard edges. We add all twenty to 18 grams, do it 2,000 times, and compare the result against the dose weights the kiosk actually recorded.

```r
# Build 2,000 dose weights out of 20 tiny nudges each, and see what shape turns up
set.seed(8)
built_dose <- replicate(2000, 18 + sum(runif(20, min = -0.15, max = 0.15)))

round(c(mean           = mean(built_dose),
        sd_of_built    = sd(built_dose),
        sd_of_recorded = sd(dose_g)), 3)
#>           mean    sd_of_built sd_of_recorded
#>         18.002          0.384          0.425

hist(built_dose, breaks = 40, col = "grey85", border = "white",
     main = "2,000 doses, each one 20 tiny nudges added up",
     xlab = "Dose weight in grams")
```

That is a bell, and nothing that went into it was bell shaped. Twenty flat blocks went in and a smooth symmetric pile came out. The standard deviation of the built doses is 0.384, and the kiosk's recorded doses came in at 0.425, which is the same kind of number.

This is the **normal distribution**, and now you can say what it is for rather than what it looks like. It is the family for a quantity that is the sum of many small independent influences, none of which dominates the rest. That is why it turns up in heights and measurement errors and exam totals and dose weights, because every one of those is a sum.

It takes two knobs, the mean and the standard deviation, and unlike the Poisson you set them independently. A bell at 18 grams can be razor tight or hopelessly loose, and the family does not mind either way.

[KEY INSIGHT]
Nobody designed the dose weight to be normal. It is normal because it is a sum. So the question that names this family is: is the quantity built by adding or averaging many small influences, with no one of them running the show?

=== step === concept
## Why so many measured things are normal, and which are not

An average is a sum divided by a count, so everything that happens to sums happens to averages too. That one sentence explains most of the normal distributions you will ever meet, and it also draws a line around the ones you will not.

Let's push it as hard as it will go. Take the grinder run times, which are about as far from a bell as anything in this log: floored at zero, piled up on the left, trailing out to 185.9 hours on the right. Average 30 of them at a time, do that 2,000 times, and look at what the averages do.

```r
# Average 30 grinder run times at a time, 2,000 times over
set.seed(9)
mean_runs <- replicate(2000, mean(rexp(30, rate = 1/40)))

round(c(sd_of_run_times    = sd(hours_to_fail),
        sd_of_averages     = sd(mean_runs),
        forty_over_root_30 = 40/sqrt(30)), 2)
#>    sd_of_run_times     sd_of_averages forty_over_root_30
#>              41.18               7.46               7.30

par(mfrow = c(1, 2))
hist(hours_to_fail, breaks = 20, col = "grey85", border = "white",
     main = "Single run times", xlab = "Hours")
hist(mean_runs, breaks = 40, col = "grey85", border = "white",
     main = "Averages of 30 run times", xlab = "Hours")
par(mfrow = c(1, 1))
```

Now look at the two histograms. The left one is the lopsided pile you already know. The right one is a bell, and it was built entirely out of the left one.

The numbers pin down how much the averaging tightened things. A single run time has a standard deviation of 41.18 hours. An average of 30 of them has 7.46, and 40 divided by the square root of 30 is 7.30. Averaging divides the spread by the square root of how many you averaged, and that is the rule rather than a quirk of this run. The name for all of this is the **central limit theorem**: the average of many independent draws is close to normal whatever the individual draws look like.

Now the sentence worth keeping, because it is where people go wrong.

Averaging turns almost anything into a bell. It does not turn the thing itself into a bell.

Collect a million grinder run times and the histogram of those million times is the same lopsided shape as before, only drawn more smoothly. More data never changes the shape of a distribution, it only draws that shape more clearly. A quantity with a floor at zero and a long right tail stays non-normal however much of it you gather, and the way to get a bell out of it is to average it, not to collect more of it.

[WARNING]
"It is measured rather than counted, so it is normal" is wrong, and so is "we have plenty of data now, so it is normal". The normal belongs to sums and averages. A single waiting time is neither.

=== step === quiz
## Quick check: which measured quantity is normal?

The kiosk times how many seconds each customer waits in the queue before being served. Waits have a floor at zero and a long right tail, exactly like the grinder runs. Which of these is close to normal?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The waiting time itself, because the kiosk measures it rather than counting it. ::no
- The daily average of 50 waiting times, worked out once a day for a year. ::ok Exactly. Each of those 365 numbers is an average of 50 draws, and averaging many independent draws gives you a bell even when not one of the draws is bell shaped.
- The waiting time itself, once the kiosk has piled up 5,000 of them instead of 50. ::no
- Neither the waits nor their averages, because a waiting time can never produce anything normal. ::no Being measured rather than counted does not make a quantity normal, and neither does collecting more of it. A waiting time has a floor at zero and a long right tail, and it keeps that shape however many you record: more data only draws the same lopsided shape more clearly. What does turn normal is the average. Add or average many small independent pieces and the result comes out symmetric, so 50 waits averaged together give a bell even though not one of the 50 is bell shaped.

=== step === widget
## When counts refuse to be Poisson

Every family so far has behaved itself. Real logs are not always so obliging, and there is one failure common enough that you want to recognise it on sight.

The kiosk also logs complaints, hour by hour. Most hours bring none at all. Some bring one or two. And then the card machine goes down and a pile of them arrive inside a single hour.

Count those per hour and the variance runs far above the mean. A Poisson cannot do that, because its variance is nailed to its mean. The name for a count log with more spread than a Poisson allows is **overdispersion**, and it is by far the commonest reason a Poisson gets thrown out.

Below, the bars are the complaints log itself, one bar for each number of complaints in an hour, and the line is the family trying to describe it. Start on Poisson and watch two places: the bar at zero, and the far right of the tail.

::widget count-dist {}

On Poisson the line sits well below the tall zero bar and dies away before the observed tail does. It is not that the fit was done badly. A Poisson with any lambda at all is being asked to match a tall pile at zero and a long tail using one number, and one number cannot do both jobs.

Switch to Neg. Binomial. The **negative binomial** tells the same kind of story as the Poisson, a count with no ceiling, but it carries a second parameter whose only job is extra spread. That frees the variance to sit above the mean, and the tail comes into line.

Switch to Zero-Inflated. This one says two different things produce a zero. Some hours had customers who could have complained and none did, and some hours were never at risk at all, because the kiosk was shut or the queue never formed. Model those two separately and both the tall zero bar and the tail land.

So a failed mean against variance check is not a dead end. It is information. The counts are still counts, and what you need is a count family with room for more spread.

=== step === concept
## The four questions on one page

Here is the whole guide on one page. Read the third column first, because those four questions are the guide, and everything else on the row is what you get once one of them answers yes.

| Family | The quantity | The question that names it | Generator | What breaks it |
|---|---|---|---|---|
| Poisson | Events counted inside a window of time or space | Am I counting events in a window, with no fixed number of tries? | `rpois(n, lambda)` | The rate moves. Two rates in one log push the variance above the mean. |
| Binomial | Successes counted out of a fixed number of tries | Can I name the number of tries before I start? | `rbinom(n, size, prob)` | The tries influence each other, or the chance of success changes from try to try. |
| Exponential | The wait until the next event | Am I measuring how long until something happens? | `rexp(n, rate)` | The rate moves, or waiting already makes the next event more likely. |
| Normal | A quantity built by adding or averaging many small influences | Is this a sum or an average of many small independent pieces? | `rnorm(n, mean, sd)` | One influence dominates the rest, or the quantity has a hard floor and a long tail. |

Two of those rows are really one idea seen from two sides, since Poisson counts and exponential waits describe the same stream. And the last column is the part people skip. Every family is a set of assumptions wearing a name, so knowing what breaks a family is what lets you notice when your own log has broken it.

=== step === concept
## Once you have the family: d, p, q and r

Naming the family was the hard part, and it is done. What comes next is almost mechanical, because R lays every distribution out in exactly the same way: one root name and four prefixes.

The root for the Poisson is `pois`. For the binomial it is `binom`, for the exponential `exp`, for the normal `norm`. Put a prefix on the front and each one answers a different question:

- **d** for density: the chance of exactly this value.
- **p** for probability: the chance of this value or less.
- **q** for quantile: the value that a given share of outcomes sits at or below. It is `p` run backwards.
- **r** for random: a fresh sample from the family.

Every question the owner might ask about arrivals is one of those four.

```r
# One kiosk question per line, all four prefixes on the Poisson
round(c(exactly_20   = dpois(20, lambda = 15),
        at_most_20   = ppois(20, lambda = 15),
        busiest_95pc = qpois(0.95, lambda = 15)), 4)
#>   exactly_20   at_most_20 busiest_95pc
#>       0.0418       0.9170      22.0000

set.seed(3)
rpois(5, lambda = 15)
#> [1] 11 13 16 12 15
```

Read them one at a time. About 4.2% of hours bring exactly 20 customers. About 91.7% of hours bring 20 or fewer. Staff for 22 customers in an hour and you are covered 95% of the time, which is close to what the owner actually needs to know before she buys a second machine. And the last line hands back five fresh hours to experiment on.

That 22 deserves a word, because counts jump and a quantile has to jump with them. Twenty one or fewer covers 94.7% of hours, which falls short of 95, and 22 or fewer covers 96.7%, which clears it. `qpois` gives you the first count that clears the bar you asked for.

Learn that pattern once and you have all four families: `dbinom` and `pbinom` and `qbinom` and `rbinom`, `dexp` through `rexp`, `dnorm` through `rnorm`. Nothing new to memorise.

=== step === tryit
## Your turn: does a Poisson fit the card taps?

One last log, and this one was not built to fit anything. The kiosk's card reader records taps, hour by hour, for 200 hours, and it averages somewhere around fifteen an hour.

Walk it through the guide. The taps are counted, they land on whole numbers, and there is no fixed number of tries anywhere, because an hour does not offer the reader a set number of chances to be tapped. So the guide points straight at the Poisson.

Now run the check that decides it. The block below builds the log for you. Two lines are left to write: the mean of `taps`, and the variance of `taps`. A Poisson claims those two are the same number, so standing them next to each other is the entire test.

```r
# Log 200 hours of card taps at the kiosk, then test them against a Poisson
set.seed(6)
taps <- rnbinom(200, mu = 15, size = 2)

# Two lines to go: the mean of taps, and the variance of taps.
# Press Check when you have them.
```
::check {"regex": "var[(]\\s*taps\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "There it is. The mean is 14.3 and the variance is 107.6, about seven and a half times larger. A Poisson needs those two to be the same size, so the Poisson is out. The direction of the failure tells you where to go next: more spread than a Poisson allows is overdispersion, and carrying extra spread is the negative binomial's whole job.", "no": "Two lines: mean(taps), then var(taps). A Poisson claims those two numbers are equal, so standing them next to each other is the whole check."}
::solution
```r
# Compare the average number of card taps in an hour to their variance
mean(taps)
#> [1] 14.325

var(taps)
#> [1] 107.6074
```

Notice what the check did and did not tell you. It did not say the taps cannot be modelled, and it did not send you back to the start. It said the counting half of the guide was right and the Poisson's one number spread was wrong, which is a far smaller problem to fix.

=== step === quiz
## Quick check: which family fits the helpline?

A helpline takes about 30 calls an hour, steadily through the afternoon. You are asked to model the number of seconds between one call and the next. Which family is that?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Poisson, because the calls themselves arrive as a Poisson stream. ::no
- Binomial, because each second either holds a call or does not, which makes every second a try. ::no
- Exponential, because the seconds between one call and the next is a waiting time. ::ok Right. It is a wait, so it is exponential, and its average is one over the rate: 3,600 seconds divided by 30 calls, which is 120 seconds between calls.
- Normal, because the gaps are measured in seconds rather than counted. ::no One stream, two different questions. Count the calls inside an hour and you get a Poisson. Measure the gap from one call to the next and you get an exponential, because a gap is a waiting time: it can be any positive number of seconds, short gaps are the commonest, and its average is one over the rate, here 120 seconds. The stream being Poisson is exactly what makes the gaps exponential, so the family follows the question you asked rather than the subject the data came from.

=== step === quiz
## Quick check: what breaks when the rate changes?

The kiosk logs a whole monsoon month. In dry hours customers arrive at about 10 an hour. When it rains they crowd under the awning and arrive at about 30 an hour. Roughly half the hours in the month were wet. You count arrivals per hour across the whole log and check it against a Poisson. What happens?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Nothing breaks. Mixing two rates gives you a Poisson at the average of the two, so a single lambda of 20 describes the log. ::no
- The mean still lands near 20, but the variance runs far above 20, because the log holds two rates and a Poisson allows only one. ::ok Yes. Half the hours pile up near 10 and half near 30, so the average survives while the spread does not, and the variance comes back several times the mean.
- The mean breaks first. It will not land anywhere near 20, so the mean against variance check cannot be run at all. ::no
- The counts stop being whole numbers, so no count family applies any more. ::no Mixing two rates keeps the mean honest and wrecks the spread. Half the hours pile up near 10 and half near 30, so the average is still about 20 while the counts spread much wider than any single Poisson at 20 could manage, and the variance comes back several times the mean. The counts are still whole numbers with no ceiling, so it is still a count family, just not a Poisson. This is exactly the overdispersion a negative binomial was built to carry.

=== step === concept
## References

- [Distributions in the stats package](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html) - R Core Team. The master index of every family R ships with, and the d, p, q and r functions that go with each one.
- [Gallery of Distributions](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm) - NIST/SEMATECH e-Handbook of Statistical Methods. One page per family: the shape it takes, and the situations it was built for.
- [STAT 414: Introduction to Probability Theory](https://online.stat.psu.edu/stat414/) - Penn State Eberly College of Science. The derivations behind the link between Poisson counts and exponential waits, and behind what averaging does.
- [fitdistrplus: An R Package for Fitting Distributions](https://cran.r-project.org/web/packages/fitdistrplus/vignettes/fitdistrplus_vignette.html) - Delignette-Muller and Dutang (2015), Journal of Statistical Software 64(4). How to fit a candidate family to real data and check whether it holds.

=== step === complete
## Quick recap

You took four ordinary records off one coffee kiosk and named the family behind every one of them. Here is the guide, in the order you would actually use it.

**First, is the quantity counted or measured?** Whole numbers only puts you in the count families. Anything on a scale puts you in the measured ones. That single answer removes half the field.

**Then ask the question that names the family.**

- Counting events inside a window, with no fixed number of tries? **Poisson**, with `rpois(n, lambda)`.
- Counting successes out of a number of tries you can name in advance? **Binomial**, with `rbinom(n, size, prob)`.
- Measuring how long until the next event? **Exponential**, with `rexp(n, rate)`, and the average wait is one over the rate.
- A sum or an average of many small independent influences? **Normal**, with `rnorm(n, mean, sd)`.

**Then check it against the log.** For counts, put the mean beside the variance. A Poisson says they are the same number, and the card taps failed that at 14.3 against 107.6, which is overdispersion and a job for the negative binomial. For a measured quantity, ask whether it is a sum or an average before you assume a bell, because a waiting time stays lopsided however much of it you collect.

And once the family has a name, R hands you the rest for free: `d` for exactly this value, `p` for this value or less, `q` for the value a given share sits below, `r` for a fresh sample.

Two questions that look nothing alike can share a family, and two questions about the same stream can need different ones. Counts and waits proved both, which is why the guide reads the shape of the question rather than the subject it came from.

Next time someone asks which distribution to use, you have a ten second answer. Well done, and see you in the next one.
