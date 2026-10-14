# Outreach copy v2: the emails the owner sends by hand

Written 2026-10-14. This is the copy SSOT for the contact centre's Write
button (`/admin/contacts.html`). The code mirror is
`functions/_lib/outreach-copy.ts`; edit here first, then there. A copy edit
saved from the composer ("save edits as the default") lives in KV
`outreach:<key>` and beats the shipped default.

These are not the automatic emails. The brain, cart recovery and the price
alert flow already send on their own (`email-copy-book.md`,
`lifecycle-emails.json`, `cartrecovery.ts`). Every email here is the owner
deciding to write to one person, usually after the automatic one has gone, so
each is written to be the second, more human touch rather than a repeat.

---

## What the research says, and what it means here

| Finding | Source | What it means for these emails |
|---|---|---|
| Emails of 50 to 125 words get the most replies (about 50% in a 40M-email study); 75 to 100 is the sweet spot | Boomerang, 40M emails | Every template is 50 to 125 words. Nothing longer. |
| Writing at a 3rd-grade reading level gets 36% more replies than college level | Boomerang | Short sentences, ordinary words, one idea per paragraph. |
| Plain-text emails got more clicks than HTML in every test; heavier HTML did worst | HubSpot A/B tests | They go as the plain personal-note shell, from Akshay, with one inline link. No buttons, no logo. |
| A question that asks for interest gets about twice the response of a hard ask; one clear CTA beats several | Smartlead, Martal | The main ask is a question they can answer in one line. The link is secondary. |
| Referencing a prior interaction lifts response | sales follow-up studies (Martal) | Each email names the one thing they did that they know they did (a checkout, the track they reached), never a count of their visits. |
| Speed matters most for hot leads: response within minutes converts many times better than within hours | speed-to-lead studies | The Needs action tab puts checkouts and walls at the top with how long ago, and the digest names them every morning. |
| In SaaS cart recovery, discounting belongs in a later touch, not the first; the first asks what went wrong | Klaviyo, Kelviq, cart-recovery guides | The automatic note already offers 15%. The manual one offers help, never a second discount. |
| Opens are unreliable since Apple Mail Privacy Protection (it pre-opens about 40% of mail); clicks, replies and conversions are the real signals | Twilio, Constant Contact | The Contacted tab shows opens but reads clicks, checkouts, purchases and replies as the outcome. |
| Testimonials need explicit permission for the words, the name and the role, and the person should approve the final wording | testimonial permission guides | The review email asks for opinion first and permission second, and promises the exact wording before anything is published. |
| Cancellation saves work when the offer matches the stated reason; asking the reason with numbered answers keeps the effort low | churn and cancel-flow studies | The cancel email asks one question with four numbered answers and offers a better-fitting plan only for price or time. |
| Many professionals can use an employer training budget, and employers want a receipt or invoice | L&D reimbursement guides | A separate "employer might pay" angle for working professionals. |

### What this site's own rules add

- From Akshay, plain personal note, reply-to akshay@ (copy book, voice v2).
- Owner voice pack: contractions, sincere not slick, no copywriter fragments,
  no stacked qualifiers.
- No em or en dashes. No eyebrows, no stat triplets, no emoji.
- No invented numbers (P3). A paragraph whose figure is missing is dropped.
- No prices: regional pricing means the number belongs on the page.
- **No deadlines.** There is no live deadline on the pricing page (checked
  2026-10-14: no founding-rate date and no Lifetime cap is shown), so no
  email may imply one.
- Quote achievement, never surveillance. Never compare the reader with
  other members. Never talk the free side down.

---

## The situations

Each entry: when it fits, the angle, what to avoid, then the copy. Tokens:

| Token | Source | When empty |
|---|---|---|
| `{first_name}` | `users.display_name`, first word | greeting becomes "Hi," |
| `{progress_phrase}` | distinct `lesson_complete` paths + distinct solved exercises: "finished 12 lessons and solved 23 exercises", or whichever half is true | the paragraph is dropped |
| `{track_name}` | the track of their latest Pro wall hit (`pro-lessons.json`) | template not offered |
| `{access_end_date}` | `subscriptions.current_period_end` when set to cancel | template not offered |
| `{last_note_date}` | the email being followed up | template not offered |
| `{refund_line}` | "Your 14-day refund is open until {date}, so there's no wrong answer." while inside 14 days of the first purchase | the line is dropped |

Every link to r-statistics.co gets `utm_source=email&utm_campaign=outreach-<key>`
and goes through the click tracker, so the Contacted tab can follow it.

### Hot leads

#### checkout-help: Checkout not finished

- **When:** opened checkout in the last week and did not buy. The automatic
  recovery note (15% code) may already have gone; the queue says so.
- **Angle:** service, not sales. Name the three real blockers, offer to fix
  each by email, make a one-line reply the easy next step.
- **Avoid:** a new discount on top of the automatic 15% (it teaches people to
  wait), counting their visits, guilt, "just checking in".
- **Subject:** Can I help with your checkout?
- **Preheader:** Card, currency, an invoice for work, or the plan itself. Each one is fixable.

```
Hi {first_name},

Your checkout on r-statistics.co didn't go through, and I wanted to check in myself in case something got in the way.

When this happens it's nearly always one of three things: the card or the currency, needing an invoice your employer can pay, or not being sure which plan is right. I can sort out any of those over email.

Which was it for you? One line back is plenty.

[Your checkout is still here when you're ready -> https://r-statistics.co/pricing.html]

Akshay
```

#### wall-goal: Reached the paid part

- **When:** reached a Pro lesson in the last week. The automatic wall note has
  usually already explained what is behind it.
- **Angle:** their goal, not the product. Ask what they are learning R for and
  offer a personal recommendation, free lessons included. Mention the
  low-risk way in once.
- **Avoid:** repeating the automatic note's topic list, saying how often they
  hit the wall, calling the free side thin.
- **Subject:** What are you learning R for?
- **Preheader:** Tell me in a line and I'll point you to the lessons that matter most.

```
Hi {first_name},

You've reached the paid part of the {track_name} track, so I wanted to write to you myself.

Can I ask what you're learning R for? A job, a thesis, a project at work? Tell me in a line and I'll point you to the lessons that will matter most for it, free ones included.

If you do decide to go further, the monthly plan is the easy way to try it, and every plan comes with a 14-day full refund.

[See the plans in your currency -> https://r-statistics.co/pricing.html]

Akshay
```

#### plan-help: Weighing up the plans

- **When:** came back to the plans on two or more days in two weeks without
  opening checkout.
- **Angle:** decision help. The honest short version of which plan suits whom,
  the low-risk start, and an offer to recommend one, including "free is
  enough for now".
- **Avoid:** saying you saw them on the pricing page, quoting prices,
  pressure or deadlines.
- **Subject:** The short version on the plans
- **Preheader:** Which plan suits what, and when free is enough.

```
Hi {first_name},

If you're weighing up the plans, here's the short version I'd give a friend.

If you're working towards one thing, like analysis or forecasting, Single Track covers that track in full. If you'd like room to move between tracks, All-Access is the one most people pick. Monthly billing on either is the low-risk way in, and you can cancel from your account at any time.

Every plan comes with a 14-day full refund, no questions asked.

Tell me what you're working towards and I'll say honestly which one I'd pick, even if the answer is that free covers it for now.

[Compare the plans -> https://r-statistics.co/pricing.html]

Akshay
```

"The one most people pick" is true today: 10 of the 16 subscriptions are
All-Access. Recheck before reusing the claim elsewhere.

#### work-pays: Employer might pay

- **When:** a warm lead whose profile says they work (persona or job role),
  or who mentioned work. A second angle after checkout-help or plan-help.
- **Angle:** many companies have a training budget. Offer the paperwork that
  unlocks it and the team plan for groups.
- **Avoid:** assuming they are employed when the profile does not say so,
  promising an invoice format before you have checked you can produce it.
- **Subject:** Could your employer cover this?
- **Preheader:** Many training budgets do. I can help with the paperwork.

```
Hi {first_name},

A lot of people learning R here are doing it for their job, and plenty of companies have a training budget that covers courses like this.

If that might be you, I'm happy to help with the paperwork: a receipt your finance team will accept, or a short note for your manager on what the course covers. And if a few of you want to learn together, there's a team plan with a single invoice.

Want me to send anything over? Just reply to this email.

[See the plans, including teams -> https://r-statistics.co/pricing.html]

Akshay
```

**Owner check before the first send:** confirm what Paddle's receipt shows
(business name and tax number fields) so "a receipt your finance team will
accept" is something you can deliver.

#### follow-up: Follow-up (once per email)

- **When:** your email went two or more days ago and they clicked without
  buying, or four or more days ago with no reaction. Once per email.
- **Angle:** short and warm, one question, an easy way to say no. "I won't
  chase" is what makes people answer.
- **Avoid:** "just bumping this", "Re:" in the subject (it pretends to be a
  reply), a second pitch, mentioning that they opened or clicked.
- **Subject:** A quick question
- **Preheader:** Then I'll leave it with you.

```
Hi {first_name},

Following up on my note from {last_note_date}. Is there one thing standing between you and getting started? Tell me what it is and I'll give you a straight answer.

And if now isn't the right time, that's completely fine. Say so and I won't chase.

Akshay
```

### Customers

#### get-started: Paid, not started

- **When:** bought in the last month and has done very little since.
- **Angle:** protect the purchase. One twenty-minute first step, an invitation
  to say what is in the way, and (while it is open) the refund, so honesty
  feels safe.
- **Avoid:** guilt, a feature tour, mentioning the refund after 14 days.
- **Subject:** Did you get started alright?
- **Preheader:** If something's in the way, I'll clear it.

```
Hi {first_name},

Thanks again for joining. It's been quiet since, which is usually a busy week rather than anything wrong.

The quickest way in is the next lesson on your track. Twenty minutes is enough to know whether it's going to suit you.

[Pick up your track -> https://r-statistics.co/dashboard.html]

If something's in the way, or it isn't what you expected, reply and tell me.

{refund_line}

Akshay
```

#### review: Ask for a review

- **When:** a paying member for three weeks or more who has properly used it.
- **Angle:** specific, easy, permission-first. Two guiding questions, the
  critical parts welcomed, nothing published without their yes on the exact
  wording. This is also how the site gets verified testimonials (provenance
  rule: who, where, consent).
- **Avoid:** the word "testimonial", fishing for praise, offering anything in
  return.
- **Subject:** Would you tell me what you think?
- **Preheader:** Two lines is plenty, and the critical parts help most.

```
Hi {first_name},

You've {progress_phrase} here, so you've seen enough to have a real opinion.

Would you tell me what you make of it? Two questions, if it helps: what were you hoping to get from it, and has it done that? The critical parts are the most useful to me.

If you're happy for a line of it to go on the site with your name and role, tell me and I'll send you the exact wording first. Nothing goes up without your yes.

Akshay
```

#### stay: Plan set to cancel

- **When:** their plan is set to end at the close of the period.
- **Angle:** respect the decision. Confirm their access, ask one question they
  can answer with a number, offer a better-fitting plan only if the answer
  points there.
- **Avoid:** a retention offer before they have said why, guilt, "we're sad to
  see you go".
- **Subject:** Before your plan ends
- **Preheader:** One question, and your access stays until {access_end_date}.

```
Hi {first_name},

I saw your plan is set to end on {access_end_date}. You keep everything until then, and your progress stays on your profile afterwards.

Could I ask what made you decide? Reply with a number if that's easier: 1, the price. 2, not enough time to use it. 3, it was missing something. 4, you got what you came for.

If it's 1 or 2, tell me, because there may be a plan that suits you better. Either way, thank you for being a member.

Akshay
```

#### billing: Payment failing

- **When:** Paddle reports the subscription past due.
- **Angle:** calm and practical, one link. A service email: it is the only
  template that can go to someone who turned email off.
- **Avoid:** alarm, threats about losing access, anything that sells.
- **Subject:** A payment problem on your plan
- **Preheader:** Usually an expired card. A one-minute fix.

```
Hi {first_name},

Your last payment for r-statistics.co didn't go through. That's almost always an expired card or a bank being careful, nothing dramatic.

You can update your card here. It takes about a minute:

[Update your payment details -> https://r-statistics.co/account-billing.html]

If anything looks wrong on our side, reply and I'll look into it.

Akshay
```

#### upgrade: Single Track, reaching other tracks

- **When:** on Single Track and has reached a Pro lesson in a track the plan
  does not cover.
- **Angle:** a helpful heads-up that the switch is prorated and keeps
  everything, plus an honest opinion on whether it is worth it.
- **Avoid:** implying they did something wrong, a hard sell, quoting the
  price difference.
- **Subject:** Moving into {track_name}?
- **Preheader:** Switching to All-Access only charges the difference.

```
Hi {first_name},

You've reached the {track_name} lessons, which sit outside your current plan.

In case it's useful: you can switch to All-Access from the pricing page, and you only pay the difference for the time left on your plan. Everything you've done carries over.

[See the switch on the pricing page -> https://r-statistics.co/pricing.html]

If you're not sure it's worth it for you, ask me and I'll tell you honestly.

Akshay
```

### Bring back

#### probe: Went quiet

- **When:** was active and went quiet in the last month.
- **Angle:** a real question with no link; its only value is an honest reply.
- **Avoid:** any sales link, guilt, "we miss you".
- **Subject:** Did you get stuck on something?
- **Preheader:** No pitch. I'm just curious what stopped you.

```
Hi {first_name},

You were going well, you'd {progress_phrase}, and then it went quiet.

That's usually one of two things: life got busy, or something here was harder or duller than it should have been. If it's the second, I'd really like to know which bit.

One line back is plenty. It helps me more than you'd think.

Akshay
```

#### welcome-back: Dormant, with a record

- **When:** quiet one to three months, with real work done before that.
- **Angle:** their own record is the reason to come back; offer to pick the
  next step for them.
- **Avoid:** "we miss you", a discount, claiming nothing changed (daily
  lessons do close after three days).
- **Subject:** Your work here is still where you left it
- **Preheader:** Your progress is still on your profile.

```
Hi {first_name},

It's been a while. Before you stopped, you'd {progress_phrase}, which is a real body of work.

All of it is still on your profile, along with your XP.

[Pick up where you left off -> https://r-statistics.co/dashboard.html]

If you'd rather I pointed you at the right next thing, reply and tell me what you're working towards.

Akshay
```

---

## Sending rules the composer enforces

- Bounced or complained addresses: refused.
- Turned email off (`email_progress = 0`): refused, except `billing`.
- A template whose required token is missing: not offered, and refused.
- Already emailed in the last 24 hours, or written to by you in the last
  three days: a warning, not a block.
- Send needs a second click within five seconds. Test sends go to the admin
  address with "[test]" in the subject and never carry the person's real
  unsubscribe link.

## Sources

- Boomerang, "7 tips for getting more responses to your emails (with data)": https://blog.boomerangapp.com/2016/02/7-tips-for-getting-more-responses-to-your-emails-with-data/
- HubSpot, "Plain text vs. HTML emails": https://blog.hubspot.com/marketing/plain-text-vs-html-emails-data
- Twilio, "Apple Mail Privacy Protection guide": https://www.twilio.com/en-us/blog/insights/apple-mail-privacy-protection
- Constant Contact, "How Apple's Mail Privacy Protection impacts email marketing": https://www.constantcontact.com/blog/apple-mail-privacy-protection-for-email-marketing/
- Klaviyo, "Abandoned cart email best practices": https://www.klaviyo.com/blog/abandoned-cart-email
- Kelviq, "Abandoned cart emails for SaaS": https://www.kelviq.com/blog/abandoned-cart-emails-saas/
- Smartlead, "Interest-based CTAs": https://www.smartlead.ai/blog/cold-email-call-to-action
- Martal, "Sales follow-up statistics": https://martal.ca/sales-follow-up-statistics-lb/
- Testimonial Donut, "Do I need permission to use customer testimonials?": https://testimonialdonut.com/resources/do-i-need-permission-to-use-customer-testimonials
- Lago, "SaaS cancellation flows": https://getlago.com/blog/saas-cancellation-flows-reduce-churn-at-the-exit-point
- Valchanova, "How to ask your employer to pay for your course": https://valchanova.me/course-reimbursement/
