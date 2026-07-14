# ab-test-calculator RESKIN parity checklist (owner order 2026-07-14)

Source of parity = the CURRENT tools/ab-test-calculator.html (240KB, 49 IBM Plex refs,
old lean-navy "workshop" body). Math is R-verified in tools/lib/ab-test-math.js
(node harness 29/29 green, re-run before page work). Reskin = same features on the
Lab-sheet shell copied from tools/t-test-calculator.html. Zero feature loss.

## Every predecessor capability (ships in v2 or dropped with a taught reason)

- [ ] Modes: Plan | Analyze | Sequential (mode pills, was submode-tabs)
- [ ] Framing (analyze only): frequentist | Bayesian | both (pills + iwant selector)
- [ ] Alpha picker: 0.01 / 0.05 / 0.10
- [ ] Tail: two-sided / one-sided (shown for plan + non-bayes analyze)
- [ ] Scenario presets (6): plan2arm, analyze, bayesonly, sequential, longtail, custom + story line
- [ ] Mode-dependent inputs: plan (baseline,MDE,power); sequential (K); analyze (n_a,conv_a,n_b,conv_b)
- [ ] Results: verdict chip + headline + aux + a stats grid (VISUAL answer) per mode
- [ ] Recap "how we got there" rows -> moved into the How-this-is-computed collapsible
- [ ] Interactive viz SVG: plan=power curve, freq=normal tails, bayes/both=Beta posteriors, sequential=Pocock boundary + caption + readout
- [ ] Viz what-if sliders: plan/analyze (alpha,baseline,MDE), sequential (K)
- [ ] R code emitters (all live): plan pwr.2p.test; analyze prop.test + integrate/lbeta bayes; sequential Pocock
- [ ] Plain-English inference box (rich prose) + decisive inference line (3rd UX feature)
- [ ] Copyable report line + copy button (tool_copy)
- [ ] Trust line (3 items, LEFT-aligned per Lab-sheet)
- [ ] Primer dropdown (4-min primer) -> kept as a <details> under the H1
- [ ] Method "when to use this" context -> kept as a live per-mode note under inputs
- [ ] Explainers: Anatomy (5 formula+prose steps), When this is the wrong tool (table), FAQ (3), Further reading (6) + numerical-accuracy note
- [ ] JSON-LD: WebApplication + FAQPage + BreadcrumbList (reused verbatim)
- [ ] GA tool_use/tool_copy + consent-mode gtag + consent-banner.js + CF beacon
- [ ] 3 UX features: tool-lead under H1, "I want to..." mode-selector banner, live inference line

## Dropped, with the reason (taught on-page)

- WebR live editor (Run/Reset, in-browser runtime) -> STATIC "The same test in R" block
  with Copy. v2 design direction (owner) + matches the t-test reference; the R still
  updates live with every input and reproduces every displayed number. Runtime never named.
- eyebrow kickers (.section-eyebrow) -> removed (owner AI-tell rule). Plain h2 headings.
- .tool-meta stat-triplet line -> removed (owner AI-tell rule).
- Unequal allocation stays out (never reachable in v1 either); 50/50 taught as most-powerful,
  pwr.2p2n.test cited for deliberate imbalance (in Anatomy).

## Gates (all parity items above ship in v2; see body of the built page)

- [x] node harness 29/29 green (re-run before + after page work)
- [x] Local E2E: rendered values vs truth table across plan / sequential / analyze x {freq,bayes,both},
      edges (bigwin z=5.505, zeroB z=-3.170, one-sided CI clamp to 100%, longtail), R block updates live
- [x] Build design gate: chrome CSS present, IBM Plex refs = 3, exactly 1 injected chrome
- [x] page_audit.mjs single-slug: all real checks pass (title 52ch, meta 159, iwant/since/trust/gaUse/gaCopy,
      faq 5, emdash 0, jbm/eyebrow false, htmlKB 164, mobileOverflow false, unpinnedLibs []). The only local
      finding is the injected-chrome localhost 404 console noise (/api/me, /cdn-cgi/trace), identical on the
      t-test reference, gone on prod.
- [x] mobile 360 / 390px no horizontal overflow
- [ ] CF preview + prod poll (new-content discriminator + plex <= 10)

## Reskin note

The compute/render/viz engine moved to tools/lib/ab-test-ui.js (pinned ?v=md5). A feature-rich tool
(3 modes, 3 framings, 4 viz types, sequential, scenarios) legitimately runs ~45KB of UI JS, which as an
inline block pushed the rendered DOM to 210KB (over the 200KB audit gate). Externalising the engine drops
the page to 150KB disk / 165KB rendered (t-test scale) while keeping tool_use/tool_copy + the boot inline
so analytics stay detectable. The math lib (ab-test-math.js) was already external and R-verified.
