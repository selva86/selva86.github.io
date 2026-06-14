# Pricing & launch strategy (v1, for decision)

Status: DRAFT for Selva's decision. Supersedes the current `/pricing.html` packaging once a direction is locked. Companion to the pricing-page critique (2026-06-15).

---

## 1. The one-sentence thesis

**Stop selling a discounted "unlock-everything" subscription, and start selling the one thing that is built, defensible, and worth real money: the verifiable, evidence-based R credential. Make the free library the on-ramp, not the product.**

Everything below follows from that.

---

## 2. Why the current page is ~55-60%

The technology and the free product are strong. The *commercial packaging* is the weak layer:

1. **It sells free things as paid.** Tutorials, tools, and most practice are already free; "Pro unlocks every tutorial/exercise/tool" is both inaccurate and weak (the prospect can see they are free).
2. **It buries the real asset.** The credential is feature #3 in a list of ~15. It is the only thing here people reliably pay for and competitors do not have.
3. **It sells ~70% promises.** Most Pro features are `AT LAUNCH` / `FIRST 6 MO`. Selling lifetime-forever access to unbuilt features is the riskiest possible commitment.
4. **It is mispriced and the structure caps upside.** $6/mo reads as "cheap," which undermines a credential. $199 lifetime sells away future revenue from the most engaged buyers. Teams at $5/seat is *below* individual, which is backwards.
5. **The launch gates on a vanity metric** ("200 waitlist"), which makes launch feel conditional and is outside your control.

This is a repositioning problem, not a copy-edit problem. Hence 55-60%.

---

## 3. Who actually pays, and for what (jobs-to-be-done)

| Audience | Job they hire us for | Willingness to pay | Served today |
|---|---|---|---|
| **Reader / learner** | "Teach me R" | Low | Fully, free |
| **Prover** (job-seeker, analyst seeking promotion, career-switcher) | "Help me prove I can actually do R" | **Medium-high (one-time)** | The credential, today, underpriced + buried |
| **Employer / team lead** | "Upskill + verify my team" | **Highest (recurring)** | Not really |

The free library (478k annual readers) is an enormous top-of-funnel. The **conversion event is not "I want to learn" (that is free) but "I want it to count."** That event is the credential. So the credential should be the hero and the price anchor.

Why the credential is the right hero:
- It is **built and real** (mint, verify, Open Badges, PDF, LinkedIn, public `/cert/<id>`), so we can launch on present strength, not promises.
- It is **differentiated**: earned by solving real exercises + a code-based assessment, publicly verifiable. DataCamp/Coursera certificates are completion-based; bootcamps cost $7k. Nobody offers an evidence-based, cheap, verifiable R credential.
- It has **intrinsic willingness-to-pay** (people pay $100-400 for credentials that help hiring) and monetizes to **both** individuals and employers.
- It **reframes the free library** from "give-away" into "the practice ground that leads to the credential."

---

## 4. Three pricing architectures (with trade-offs)

### Option A. Subscription-led (today's model, repaired)
- Free: library + tools + limited grading.
- **Pro** (sub, ~$15/mo or ~$120-150/yr): unlimited grading + scoreboard + **all certs included while subscribed** + future content.
- Teams: per-seat *above* individual (~$30/seat) + admin/SSO/reporting.
- No lifetime (or a real $499, capped).

**Pros:** simple, recurring, predictable; one mental model.
**Cons (significant):** a credential that *lapses when you cancel* is conceptually broken, you do not rent a degree. It also leaves the strongest WTP (a permanent, ownable credential) on the table, and keeps fighting the "but the tutorials are free" objection.

### Option B. Credential-led, unbundled (recommended end-state)
- Free: library + tools + generous practice (the funnel; stays generous on purpose).
- **Pro Study** (optional sub, cheap, ~$9/mo or ~$79/yr): the scoreboard layer, unlimited grading, XP/streak, ad-free, resume, and future courses/office-hours/community as they ship. Serves engaged learners; provides recurring revenue.
- **Certification** (the hero, one-time per track, ~$129; PPP-adjusted for India): you earn it by passing the assessment, you pay once to mint your **permanent, verifiable** credential. Matches how credentials actually work (you own it forever), which justifies the higher one-time price.
- Teams/B2B: cohort license, per-learner, with admin + bulk credentials + reporting. Highest price.

**Pros:** maximizes credential WTP and *permanence*; cleanly separates "learn cheap/free" from "prove = pay real money once"; multiple tracks = repeat purchases (5 certs over a serious learner's journey); employer-reimbursable.
**Cons:** more SKUs; one-time revenue is lumpier (mitigated by the study sub + B2B + multiple tracks); needs Lemon Squeezy one-time-purchase support.

### Option C. The "Certification Program" annual (recommended for LAUNCH)
- Free: library + tools + practice.
- **One paid SKU**: an annual **R Certification Program** at ~$149/yr (founding ~$99/yr); optional monthly ~$15/mo. Includes unlimited graded practice + scoreboard + ad-free + **every certificate you earn that year, permanent and verifiable** + new courses/office-hours as they ship.
- Teams + per-track one-time + lifetime deferred to post-launch.

**Pros:** simplest thing to launch (one SKU), recurring, premium, outcome-framed ("a program," not "a content subscription"), credential-centric, launches on present strength.
**Cons:** rebundles learning + credential (acceptable at a credible price, framed as a program); certificate permanence needs to be explicit ("certs you earn are yours forever, even if you do not renew").

### Recommendation
**Launch with Option C, evolve toward Option B.** C is the fastest credible path to revenue on what is actually built; once a single track's program is validated, add Option B's per-track one-time purchase (captures lower-commitment buyers) and the Teams/B2B tier (the real money). Option A is the weakest because it rents a credential.

---

## 5. Recommended price points (for the C-then-B path)

| SKU | Public price | Founding price | India (Razorpay, PPP) | Notes |
|---|---|---|---|---|
| Free | $0 | - | - | Full library, tools, practice. The funnel. |
| Certification Program (annual) | $149/yr | **$99/yr, locked** | ~₹4,499 / ~₹2,999 | The launch hero. Certs earned are permanent. |
| (monthly option) | $15/mo | - | ~₹599 | Flexibility; positions annual as the deal. |
| Per-track certificate (one-time) | $129 | $79 | ~₹3,999 | Add post-launch (Option B). Permanent credential. |
| Teams (per learner/yr) | $39+ | - | PPP | Post-validation. Admin, SSO, bulk certs, reporting. |
| Lifetime | (avoid) or $449, cap 100 | - | - | Only if demanded; frame as "lifetime Program." |

Principles baked in: a credible credential is priced like one (not $6); the most-engaged buyers are not sold a permanent discount that kills LTV; teams pay more per seat, not less; India gets honest PPP pricing given the audience.

---

## 6. Launch model (replace the "200 waitlist" gate)

1. **Commit to a window, not a count.** "The R Certification Program opens [month]." Launch feels inevitable, not conditional on a number you do not control.
2. **Launch ONE wedge first.** Open certification for the 1-2 tracks furthest along (R Fundamentals, Tidyverse Practitioner). Prove people pay for one credential before building the full bundle/courses.
3. **Waitlist sells the credential vision + a founding discount + early access**, not a 15-feature tier sheet. (The native waitlist form is already built and live.)
4. **Sequence:**
   - Now: waitlist on the credential vision; the free library keeps compounding the funnel.
   - Launch: Certification Program (C) for the ready track(s), founding price.
   - +1-3 mo: add per-track one-time (B), add the next tracks.
   - +3-6 mo: ship the content that is currently `AT LAUNCH` (courses, office hours) to existing members as promised.
   - Post-validation: Teams/B2B (where the real revenue is).
5. **Honesty as the wedge:** keep the "live today vs coming" framing, but stop selling forever-access to unbuilt features. Sell what is real now (the credential + graded practice), roadmap the rest in plain sight.

---

## 7. What changes on the page (once a direction is locked)

- Lead with the credential ("Prove you can actually do R", evidence-based, verifiable), not "unlock everything."
- One hero offer, not a 3-tier soup; free vs the Program, with "Teams coming."
- Drop the quote-styled self-"testimonials"; pre-launch honesty means *not* dressing claims as reviews.
- Cut length hard. A confident offer with no social proof is short.
- Rewrite in the site's editorial v3 voice (match the cert/tutorials pages), not default-SaaS. Fewer triad-slogans.
- Keep the genuinely good parts: the `LIVE / AT LAUNCH` badges, the honest FAQ, the 30-day guarantee, the Lemon-Squeezy/tax transparency.
- Reconcile every number to ground truth (done: 1,267 / 2,904 / 5 / 2016).

---

## 8. Open decisions for Selva (need answers to proceed)

1. **Architecture:** C-for-launch then B (recommended), or pure B, or A? 
2. **Anchor price:** is ~$149/yr ($99 founding) the right level for the credential program, or higher/lower?
3. **Lifetime:** kill it, or keep a real ($449, capped) one?
4. **First track(s) to launch certification on:** R Fundamentals + Tidyverse (the two free/most-ready), or others?
5. **Launch window** to commit to publicly (replaces the 200-gate).
6. **Credential credibility play:** do we lean on rigor alone, or also Selva's/machinelearningplus brand authority in the positioning?

---

## 9. Risks & mitigations

- **"One-time cert revenue is lumpy."** Mitigate with the study sub (recurring), multiple tracks (repeat purchases), and B2B (the real recurring money).
- **"Is a sub-$150 R cert credible to employers?"** Credibility comes from rigor + verification + issuer reputation, not price alone. Lean on "earned by solving 80% of real exercises + a code assessment, publicly verifiable" vs completion badges. Brand authority helps.
- **"Selling before the content exists."** Solved by centering the credential (built) and roadmapping the rest honestly, instead of selling the unbuilt bundle.
- **Payments dependency:** the whole plan needs Lemon Squeezy approval (not yet set up) + Razorpay plans. Sequence the waitlist now so this is not on the critical path until launch.
