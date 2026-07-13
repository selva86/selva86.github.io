# bayes-theorem-calculator — v2 R-verified rebuild plan

Slug: `bayes-theorem` · Page: `tools/bayes-theorem-calculator.html` · Lib: `tools/lib/bayes-math.js`

## What this rebuild is

The page already ships on the v2 Lab-sheet shell (tool-lead, "I want to…" banner with mode
select, inference banner, 5 modes, 6 scenarios, mosaic viz, derivation table, per-10,000
walkthrough, anatomy/caveats/further-reading). What it lacked, versus the other v2 tools, was:

1. No `tools/lib/*-math.js` — all math was inline, never R-verified, no truth table / test harness.
2. Live **WebR** runtime (`webr-init.min.js`, Run/Reset buttons) instead of the current v2
   standard static "Reproduce in R" copy block (as anova/chi-square now ship).
3. No GA/consent block at all (no `gtag`, no `tool_use`/`tool_copy`, no `consent-banner.js`).
4. Owner AI-tell 2026-07-13: the `.tool-meta` strapline is a banned comma-parade of stats.
5. NPV is computed but only written into the CSS-hidden `.live-summary` — advertised, never shown.

So this is a **targeted rebuild**: extract + R-verify the math into `bayes-math.js`, wire the page
to it, convert WebR→static, add GA/consent, fix the strapline, surface NPV. Preserve every feature.

## Math (all closed-form arithmetic — R and JS use identical IEEE-754 ops)

```
bayes(prior, pdh, pdnh) = pdh*prior / (pdh*prior + pdnh*(1-prior))
ppv(prev, sens, spec)   = bayes(prev, sens, 1-spec) = sens*prev / (sens*prev + (1-spec)*(1-prev))
npv(prev, sens, spec)   = bayes(1-prev, spec, 1-sens) = spec*(1-prev) / (spec*(1-prev) + (1-sens)*prev)
lrPos(sens, spec)       = sens / (1-spec)
lrNeg(sens, spec)       = (1-sens) / spec
preOdds(p)              = p / (1-p)
postOdds                = preOdds(prior) * lrPos
posteriorFromOdds(o)    = o / (1+o)
per-N counts (prior,pdh,pdnh): tp=N*prior*pdh, fn=N*prior*(1-pdh), fp=N*(1-prior)*pdnh, tn=N*(1-prior)*(1-pdnh)
chain: post1=ppv(prev,sens1,spec1); post2=ppv(post1,sens2,spec2)
```

## PASS 0 — PARITY CHECKLIST (every old capability ships in v2)

### Modes (5) — all retained
- [ ] `generic` — Prior P(H), P(D|H), P(D|~H) → posterior P(H|D)
- [ ] `medical` — prevalence, sensitivity, specificity → PPV (+ NPV, LR+, LR-, odds)
- [ ] `paradox` — same inputs, "out of N" framing → P(disease | positive)
- [ ] `spam` — P(spam), P(word|spam), P(word|ham) → P(spam|word)
- [ ] `chain` — prev, sens1/spec1, sens2/spec2 → posterior after 2 positive tests

### Inputs — retained
- [ ] Dynamic per-mode text inputs (`#mode-inputs`), validated to finite ∈ [0,1]
- [ ] Units toggle: auto / fraction / percent (`setUnits`, `parseProb` auto-detect)
- [ ] 3 range sliders (prior/sens/spec) two-way bound to active mode driving the mosaic

### Outputs — retained (+ NPV now surfaced)
- [ ] Posterior / PPV main readout with per-mode label
- [ ] Numerator / denominator aux line
- [ ] Step-by-step derivation table
- [ ] Per-10,000 natural-frequency walkthrough (TP/FN/FP/TN, PPV)
- [ ] LR block (LR+, LR-, pre-test odds, post-test odds) for medical/paradox
- [ ] NPV — NEW: surfaced in the inference banner for medical/paradox (was hidden in `.live-summary`)
- [ ] Chain outputs: post1, post2 + chained per-10,000 walkthrough

### Scenarios (6) — retained
- [ ] hiv, mammo, covid, drug, poly (medical), sanity (generic 0.5/0.5/0.5)

### Viz / explainers / meta — retained
- [ ] Mosaic (Marimekko) SVG + sliders + readout
- [ ] Tool lead + 4-min primer dropdown
- [ ] "When to use this" method panel (per-mode copy)
- [ ] Inference section (method-intro + live inference-banner)
- [ ] Anatomy of Bayes' rule (5 formula cards)
- [ ] "When this is the wrong tool" caveats table
- [ ] Further reading links
- [ ] FAQPage + WebApplication JSON-LD

### Deltas applied (dropped/changed with reason)
- [ ] WebR live runner → static "Reproduce in R" copy block (v2 standard; never name the in-browser R runtime)
- [ ] Inline math → `tools/lib/bayes-math.js` (R-verified), page delegates to it
- [ ] Added consent-mode GA block + `consent-banner.js` + `tool_use`/`tool_copy` (was absent)
- [ ] `.tool-meta` stat-parade strapline → single trust line ("No data leaves your browser · Verified against R · Free")
- [ ] Contract `<title>` upgraded to the `Free … Calculator: …` 40–60ch pattern
- [ ] `#summary` stays hidden (superseded by the visible inference banner) — NPV moved into the banner

## Edge cases the R truth table + JS test must cover
prev=0, prev=1, sens=1, spec=1 (LR+ = Inf), spec=0, sens=0, tiny prev=1e-9, sanity 0.5/0.5/0.5,
plus all 6 scenario presets and a 2-test chain.
