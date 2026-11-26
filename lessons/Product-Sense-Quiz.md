---
title: "Product Sense and Metric Diagnosis Lesson 6: Quiz"
catalog_blurb: "Six questions on one case: everything section 1 taught, checked in order."
description: "Northlake's interview request rate falls from 8.4% to 6.1%. Review framing, the diagnosis order, funnel leaks, mix shift and opportunity sizing on one case."
keywords: "product sense quiz, metric drop diagnosis, funnel decomposition, mix shift, opportunity sizing, interview request rate, product analytics, product data science"
post_type: "LESSON"
curriculum_id: "3.10.6"
webr: true
mathjax: false
lesson_access: "free"
course_id: "pds-sense"
course_title: "Product Sense and Metric Diagnosis"
course_lesson: "6"
course_total: "6"
course_landing: "Product-Sense-and-Metric-Diagnosis-Course.html"
lesson_kind: "quiz"
course_next: ""
course_prev: "Opportunity-Sizing.html"
---

=== step === cover
## Quiz

Today let's put everything from this section's five lessons to work on one single case.

Northlake is a job search app. It tracks the interview request rate: the share of profile completions that get an interview request within 30 days. Over two consecutive fortnights, that rate fell from 8.4% to 6.1% of 20,000 profile completions, and it surfaced in Northlake's weekly product review.

This quiz carries that one drop through six questions, one skill at a time.

- Framing a vague product question as a population, a measure, a comparison and a decision rule.
- The order that diagnoses a dropped metric: is it real, is it instrumentation, is it seasonality, is it one segment.
- Decomposing a funnel into its step conversions to find exactly where it leaks.
- Reading a blended rate against its components, to tell a mix shift from a real segment move.
- Sizing an unbuilt feature's ceiling as a range, not a single number.

The last two steps are live R, where you compute Northlake's funnel leak and its blended rate yourself.

=== step === quiz
## Framing the interview rate drop

Northlake's weekly product review reacts to the interview request rate falling from 8.4% to 6.1% of profile completions. Before any further analysis, the question itself needs four things stated plainly: a population, a measure, a comparison and a decision rule.

Which plan states all four?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Measure the interview request rate within 30 days, compare this fortnight against the prior one, and escalate if the drop holds through one more fortnight. ::no
- Take the last two fortnights' profile completions as the population, measure the interview request rate within 30 days, compare this fortnight against the prior one, and escalate if the drop holds through one more fortnight. ::ok Right. That names all four: the population (the last two fortnights' profile completions), the measure (the interview request rate within 30 days), the comparison (this fortnight against the prior one) and the decision rule (escalate if the drop holds through one more fortnight).
- Take the last two fortnights' profile completions as the population, compare this fortnight against the prior one, and escalate if the drop holds through one more fortnight. ::no
- Take the last two fortnights' profile completions as the population, measure the interview request rate within 30 days, and compare this fortnight against the prior one. ::no Three of these four leave out one of the four things a framing needs: a population, a measure, a comparison or a decision rule. A framing is only complete once all four are stated, the way the second option does.

=== step === quiz
## The first check on a dropped metric

Suppose Northlake's interview request rate did not drift down slowly. It stepped down from 8.4% to 6.1% in a single day, and that is the same day Northlake's team shipped an update to its tracking library.

Before accepting any story about why the rate fell, what should be checked first?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Look for which segment of users the drop is concentrated in. ::no
- Check whether the fortnight the drop happened in is simply a slower time of year. ::no
- Check whether the drop is real, meaning whether the tracking library update broke how interview requests are counted, before reaching for any product explanation. ::ok Right. A metric that steps down on the exact day something shipped should have its instrumentation checked first, before anything else. Whether the drop is real, an artifact of broken tracking rather than a change in behavior, is the first thing to rule out, before seasonality, a segment, or a story about the product itself.
- Start investigating why the product got worse on that exact day. ::no These three distractors reach for a product story, a calendar explanation or a segment breakdown before ruling out the simplest and most common cause of a metric that steps down the same day something shipped: a broken tracking library. That check runs first, before any of the other three.

=== step === quiz
## Where in the funnel the drop sits

Northlake's interview request rate is built from two steps: a profile completion has to turn into an application, and an application has to turn into an interview request. Here are both fortnights' counts.

Of the 20,000 profile completions in each fortnight, 12,000 went on to apply to a role, 60% either way, in both fortnights. But interview requests fell from 1,680 (14.0% of the 12,000 applicants) in the first fortnight to 1,220 (10.2% of the 12,000 applicants) in the second.

Which step is where the drop sits?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The profile completion to application step, since that is the first step in the funnel. ::no
- Neither step. The drop just means fewer people completed their profile in the second fortnight. ::no
- The application to interview request step. The profile to application rate held at 60% in both fortnights, but the application to interview request rate fell from 14.0% to 10.2%. ::ok Right. The profile to application step held exactly steady, 12,000 of 20,000 both times. Every point of the drop sits in the next step, where only 10.2% of applicants got an interview request in the second fortnight against 14.0% in the first.
- There is not enough information here to tell which step the drop is in. ::no Three of these four either blame the wrong step, blame overall signup volume that never moved, or claim a funnel cannot be localised at all. But the same two numbers, 60% and 60%, then 14.0% and 10.2%, are exactly enough to show the drop sits entirely in the application to interview request step.

=== step === quiz
## A blended rate that falls while nothing underneath moves

Northlake's 12,000 applicants come from three acquisition channels: referral, organic search and paid ads. Each channel has its own applied to interview request rate, and none of the three rates changed between the two fortnights: referral held at 20%, organic search at 14%, and paid ads at 5%.

What did change is where the applicants came from, a mix shift: a paid ads promotion moved the channel mix from 30% referral, 50% organic search and 20% paid ads in the first fortnight, to 15% referral, 30% organic search and 55% paid ads in the second.

Paid ads has the lowest interview request rate of the three, 5%, and it went from a fifth of all applicants to more than half of them. That shift alone, with every channel's own rate exactly unchanged, pulls Northlake's blended applied to interview request rate from 14.0% down to about 10%.

Which of these is the right read of what happened?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- One of the three channels must have gotten worse at converting applicants into interview requests. ::no
- Every channel's own rate held exactly steady. What moved was the mix: paid ads, the channel with the lowest rate, grew from 20% to 55% of applicants, and that alone was enough to pull the blended rate down. ::ok Right. Referral, organic search and paid ads each kept their own rate fixed across both fortnights. The only thing that changed was how much weight the lowest-rate channel, paid ads, carried in the blended total, from a fifth of applicants to more than half.
- Paid ads must be attracting lower quality leads than before, since its share of applicants grew so much. ::no
- The drop cannot be real, since the total number of applicants held flat at 12,000 in both fortnights. ::no Three of these four either invent a change inside a channel that never happened, blame paid ads for something other than its already known 5% rate, or treat a steady applicant total as proof nothing moved. What actually moved is the mix: paid ads carried a growing share of applicants, and its rate was always the lowest of the three, so shifting more weight onto it was enough to pull the blended rate down on its own.

=== step === quiz
## Sizing the reminder nudge before building it

Northlake's product team has an idea: send a reminder to anyone who completes their profile but does not apply to a role within 3 days. Of the 20,000 profile completions each fortnight, 8,000 (40%) stall exactly like that.

Nobody has built the reminder yet, so its effect on the apply rate has to be estimated, not measured. A reasonable range is a 3 to 7 percentage point lift in the apply rate among those 8,000 stalled profiles. Each extra applicant is worth an expected $2.10 in downstream interview value.

What is the ceiling on what this reminder could be worth, per fortnight?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- 8,000 reachable profiles times a 3 to 7 point lift, so 240 to 560 more applicants a fortnight. ::no
- 8,000 reachable profiles times $2.10 of downstream value, $16,800 a fortnight. ::no
- Somewhere around $800, Northlake's best single guess at the reminder's worth. ::no
- A range of roughly $500 to $1,200 a fortnight, from multiplying the 8,000 reachable profiles by a plausible 3 to 7 point lift in their apply rate, then by $2.10 of downstream value per extra applicant. ::ok Right. The ceiling comes from three numbers multiplied together: the 8,000 reachable profiles, a 3 to 7 point lift in their apply rate, and $2.10 of downstream value per extra applicant. At the 3-point lift that is 8,000 times 0.03 times $2.10, about $500. At the 7-point lift it is about $1,200. Stopping after the extra applicants, multiplying by the value alone, or reporting one guess all understate how the ceiling is actually built.

=== step === quiz
## Mix shift or a real segment move

The channel breakdown in the last question showed a mix shift. Now look at the same drop through a different split: platform, app versus desktop, instead of acquisition channel.

The app and desktop share of applicants holds at exactly 50% each, in both fortnights. In the first fortnight, both platforms convert applicants to interview requests at the same 14.0% rate, matching the blended rate exactly. In the second fortnight, desktop still converts at 14.0%, but the app segment's own rate falls to 6.4%, and that alone pulls the blended rate down to 10.2%.

Is this the same kind of mix shift as the channel breakdown, or something else?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- It is a mix shift, the same as the channel breakdown, since a blended rate fell in both cases. ::no
- The two platforms cannot be compared to each other, so no conclusion can be drawn from this split. ::no
- It is a real change, specific to the app segment. The app and desktop share of applicants never moved from 50/50, so with the mix held fixed, the only thing left that could pull the blended rate down is a segment's own rate, and the app segment's fell from 14.0% to 6.4% while desktop's held steady. ::ok Right. Unlike the channel split, where the mix itself moved while every channel's own rate held flat, here the mix never moves. Both platforms keep an even 50/50 share of applicants in both fortnights. With the mix pinned like that, a falling blended rate has only one place left to come from: a real fall inside one segment, and that segment is the app, down from 14.0% to 6.4% while desktop stayed fixed.
- Desktop's own rate held steady at 14.0%, so the segment check can be skipped entirely. ::no Three of these four either assume every falling blended rate is a mix shift, treat the two platforms as impossible to compare, or dismiss the check just because one segment's rate was unchanged. The same test used on the channel split applies here: check whether the mix moved first. It did not, 50/50 in both fortnights, so the fall has to be real and specific to the app segment, whose own rate dropped from 14.0% to 6.4%.

=== step === concept
## Computing the leak with R

Let's confirm the funnel leak directly in R, using the same two fortnights of counts from the funnel question.

```r
# Build Northlake's two fortnights of funnel counts and compute each step's conversion rate
funnel_counts <- data.frame(
  fortnight = c("Fortnight 1", "Fortnight 2"),
  profile_completed = c(20000, 20000),
  applied = c(12000, 12000),
  interview_requested = c(1680, 1220)
)

funnel_counts$profile_to_applied <- round(funnel_counts$applied / funnel_counts$profile_completed * 100, 1)
funnel_counts$applied_to_interview <- round(funnel_counts$interview_requested / funnel_counts$applied * 100, 1)

funnel_counts[, c("fortnight", "profile_to_applied", "applied_to_interview")]
#>     fortnight profile_to_applied applied_to_interview
#> 1 Fortnight 1                 60                 14.0
#> 2 Fortnight 2                 60                 10.2
```

`profile_to_applied` is the same in both rows, 60, confirming the top of the funnel never moved. `applied_to_interview` is the column that drops, from 14.0 in the first fortnight to 10.2 in the second. That one column holds the entire fall in Northlake's interview request rate.

=== step === concept
## Computing the blended rate from channel shares

Now let's confirm the channel mix shift from the earlier question, the same way, directly in R.

```r
# Build the three channels' flat rates and both fortnights' applicant shares, then compute the blended rate
channel_mix <- data.frame(
  channel = c("Referral", "Organic search", "Paid ads"),
  own_rate = c(0.20, 0.14, 0.05),
  share_fortnight1 = c(0.30, 0.50, 0.20),
  share_fortnight2 = c(0.15, 0.30, 0.55)
)

blended_fortnight1 <- sum(channel_mix$own_rate * channel_mix$share_fortnight1)
blended_fortnight2 <- sum(channel_mix$own_rate * channel_mix$share_fortnight2)

blend_table <- data.frame(
  fortnight = c("Fortnight 1", "Fortnight 2"),
  referral_pct = round(channel_mix$own_rate[1] * 100, 1),
  organic_pct = round(channel_mix$own_rate[2] * 100, 1),
  paid_ads_pct = round(channel_mix$own_rate[3] * 100, 1),
  blended_pct = round(c(blended_fortnight1, blended_fortnight2) * 100, 1)
)
blend_table
#>     fortnight referral_pct organic_pct paid_ads_pct blended_pct
#> 1 Fortnight 1           20          14            5          14
#> 2 Fortnight 2           20          14            5          10
```

Look at the three per channel columns first. Referral, organic search and paid ads sit at the exact same 20, 14 and 5 in both rows, because none of those three rates changed. Only `blended_pct` moves, from 14 down to 10, and the code never touches any channel's own rate to get there. The only thing that changes between the two calls to `sum()` is the channel shares, which is exactly what a mix shift means.

=== step === complete
## Section complete

This quiz reviewed five skills through one running case, Northlake's interview request rate falling from 8.4% to 6.1%. Each question traced a different piece of that fall: framing the question into a population, a measure, a comparison and a decision rule; running the real, instrumentation, seasonality, segment order before trusting a story; decomposing the funnel to find the applied to interview step as the leak; telling a channel mix shift apart from the app segment's real drop; and sizing a reminder nudge's ceiling as a range, not a single number.

Section 2 picks up from here, on designing the metrics themselves: what makes a good primary metric, a guardrail, and the taxonomy behind choosing one over another.
