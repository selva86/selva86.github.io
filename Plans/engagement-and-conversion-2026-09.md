# Engagement and conversion: what the numbers say, and what to do

Written 2026-09-19. Supersedes nothing; it sits under `growth-playbook-2026.md`
and reports what actually happened after that playbook was built.

Every number below is a live query against `r-stats-prod`, not an estimate.

---

## 1. The diagnosis

| | Count | Of what |
|---|---|---|
| Accounts | 875 | |
| Accounts created in the last 30 days | 348 | |
| Accounts created in the last 7 days | 87 | |
| Subscriptions | 9 | **1.0% of accounts** |
| Accounts that ever solved one exercise | 201 | **23% of accounts** |
| Accounts that never solved anything | 674 | 77% |
| ...of those, who have reading progress | 437 | they are here, and reading |
| ...of those, who took a quiz | 0 | |
| Solved something in the last 30 days | 127 | |
| Ever reached a 2-day streak | 42 | 21% of solvers |
| Ever reached a 7-day streak | 4 | **2% of solvers** |
| Total solves | 3,789 | |
| Average solves per active user | 18.9 | across 4.7 different hubs |
| Users with 15+ solves in a single hub | 21 | |
| Certificates issued | 0 | needs 80% of a track |

Three readings, in order of importance.

**Conversion is on plan. Stop optimising it.** 1.0% of accounts pay. The
playbook told you to plan against 0.5% to 2% for informational search intent.
You are inside your own forecast. Nine subscriptions against 875 accounts is not
a conversion problem, it is a volume problem, and volume is upstream.

**Activation is the hole.** 674 accounts have never solved a single exercise.
437 of them are reading lessons and tutorials right now. They are not dead
traffic, they are warm and one room away from the thing you sell. That is the
largest single pool of value in the whole business and nothing currently walks
them across.

**Day two is where everyone leaves.** Of 201 people who solved something, 42
came back on a second day and 4 ever reached a week. Duolingo's published figure
is that a learner who reaches a 7-day streak is 2.4x more likely to be there the
next day. You are getting 2% of solvers to that point.

### The finding that explains the missing rewards

Average active user: 18.9 solves, spread across 4.7 hubs. A hub is about 20
exercises. So the average engaged learner has done roughly a hub's worth of work
and has nothing to show for it, because the work was scattered across five hubs
instead of concentrated in one.

The daily set is doing this on purpose. `_lib/daily.ts` picks three tasks a day
with the reasons "your current track", "your weakest track" and "review: keep it
sharp". It spreads. The badge requires concentration. **The two mechanics you
already shipped are pulling against each other**, and the badge loses.

Certificates need 80% of a track and stand at zero for the same reason.

(Hub badges read zero because that engine is on branch `practice-studio` and has
not merged. That one is not a defect.)

---

## 2. What this rules out

**More mechanics.** Everything is built and every flag is on in production: XP
with a six-tier ladder, streaks with freezes, the daily set, twelve account
badges, certificates, the meter, the dashboard, and thirteen live email arcs
including the DA pass with its day-27 coupon. 3,447 emails have been sent. The
machine is running. Adding another mechanic to a machine where 77% of accounts
never reach the core action will not move anything.

**Re-pricing.** At nine subscriptions you cannot read a price signal. Your
largest sale remains the most expensive tier, which argues price is not the
barrier.

**Leagues, a fantasy skin, a Discord.** The playbook already ruled these out
with better evidence than I would assemble, and for this audience I agree
without reservation.

---

## 3. The one change that fixes the most

**Stop spreading people thin. Point every mechanic at one outcome: finish your
first hub in your first week.**

This is not a new feature. It is aiming the features you have at a single target.

- **Activation.** After signup the next screen is an exercise, not a dashboard.
  A dashboard is a menu, a menu is a decision, and a decision is a chance to
  leave. 437 readers get one line in context: "You have read four lessons on
  t-tests. There are 20 problems on it. Start the first."
- **Day two.** The daily set stops sampling three tracks and serves the hub you
  are in until it is done. The reason line becomes "3 left in A/B Testing", not
  "your weakest track".
- **The reward.** Concentration is what makes the badge mint. On current
  behaviour, 21 people are already within five exercises of one.
- **Conversion.** The wall then lands seconds after the first badge, at peak
  pride, next to a shareable credential: you finished one, Pro opens the rest.
- **The meter already agrees with this.** A started hub is unlocked for the whole
  month. The system has always rewarded finishing what you began; nothing tells
  the learner so.

---

## 4. The models, compared

What the evidence says about each shape, and what it would cost here.

### A. Usage quota (what you have: 25 a month)

- **For:** simple to say, easy to enforce, the generous version is already built.
- **Against:** a monthly budget invites a binge and then a dead month, which is
  the worst possible shape for a habit. It also meters the feedback loop, and
  the feedback loop is the product.
- **Note:** your enforcement is much kinder than the label. Only first solves
  count, retries are free, and a started hub never walls. The label is the
  problem, not the rule.

### B. Feature wall (free reads and runs, paid grades)

- **For:** boot.dev runs exactly this and states it plainly: all content free,
  you pay for interactivity. It never fights your SEO, which is your only
  durable asset. Your playbook already locked this as Decision 1.
- **Against:** the grade is also the first moment of delight, so walling it too
  early costs you activation, which is precisely the metric that is broken.

### C. Reverse trial (full access on signup, then downgrade)

- **For:** the strongest number in the research. Reverse trials convert at a
  median of about 24% against about 4.5% for plain freemium, and only around 7%
  of products run one. You have already built it: the DA pass is a 30-day
  reverse trial with a countdown, an expiry gate and a day-27 coupon, live now
  but scoped to one track.
- **Against:** it only works if the downgrade is felt, so the free tier after it
  has to be visibly smaller than the trial.

### D. Duration tax on the credential (Coursera's model)

- **For:** audit free forever, but the certificate requires an active
  subscription at the moment you complete. It makes procrastination the revenue
  driver rather than a scarcity timer, and it needs no countdown or fake
  urgency.
- **Against:** it can read as mean if the free tier is thin. It is only fair
  when the learning itself is genuinely open, which for you it is.

### E. Habit quota (daily rather than monthly)

- **For:** matches how practice actually happens, and aims straight at the day-7
  cliff that your own numbers say is the problem. The streak, the freezes and
  the daily set are all built.
- **Against:** a daily cap annoys the weekend learner, and on its own it still
  meters the loop.

---

## 5. The recommendation, in order

**1. Make the studio tell the truth about the meter.** Days of work, no backend
change. The status bar currently shows a 25-tick counter draining on every
attempt and says "checks". The rule counts first solves only, and a started hub
never walls. Your own decided display spec already says what to do: a green
"This hub stays open" chip replaces the count inside a started hub. Implement the
spec that exists. Nothing else can be measured honestly while the storefront
misstates the product.

**2. Put the first win before the account ask.** This reverses what I shipped
today on your instruction, so treat it as a test rather than a correction. The
evidence on all three sides points the same way: your own playbook section 1.3
specifies the deferred ask with the goal stored and replayed after registration,
boot.dev delivers a real lesson before asking, and Duolingo starts the streak
before the signup screen. With 77% of accounts never solving, the ask sits
exactly where the funnel is already breaking. One free graded exercise, then ask
on the green Success with the XP banked. It is one constant in
`practice-studio.js`.

**3. Aim the first week at one hub.** The change in section 3. The daily set
serves the current hub until it is finished; the dashboard's next step is the
next exercise in it; the post-signup screen is an exercise, not a menu.

**4. Walk the 437 readers across.** They have reading progress and no solves.
One contextual line at the end of a lesson, and one email, both naming the
matching hub. This is the cheapest volume you will ever buy because they are
already here and already interested.

**5. Widen the reverse trial from one track to the account.** Once 1 to 4 are
in and measured, give every new account full access for its first 14 days, then
drop to the hub allowance. The machinery is built and proven on the DA track.
Do this after activation is fixed, not before: a trial handed to people who
never reach an exercise converts nobody.

Hold the duration tax on certificates until there is a certificate holder to
learn from. Hold pricing entirely.

---

## 6. How you will know it worked

Four numbers, in this order. Anything else is decoration.

| Metric | Today | Target |
|---|---|---|
| Accounts that solve within 24h of signup | 23% lifetime, 29% last 30d | 50% |
| Solvers who return on a second day | 21% | 40% |
| Solvers who reach a 7-day streak | 2% | 15% |
| Accounts holding at least one hub badge | 0 | 10% |

Conversion is deliberately not on that list. At 1.0% against a 0.5 to 2% plan it
is already where it should be, and it will move on its own when the four above
move.

---

## 7. Two small things found on the way

- `www/xp-chip.js` ships on roughly 1,600 pages and mounts onto
  `.masthead-tools`, which exists in no template. It does nothing.
- `exercises/index.html` shows a hard-coded `0/397 solved · 10,855 XP` because
  `_build/gen_exercises_index.py` strips `exercises-page.js`. The streak hero
  and the per-category counts on the exercises index never hydrate, so the one
  page whose job is to send people into practice shows everybody a dead zero.

The second one matters for section 4 above and is probably an hour of work.
