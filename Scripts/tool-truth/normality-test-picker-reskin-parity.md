# Reskin parity checklist — normality-test-picker

Source of truth: the CURRENT (pre-reskin) `tools/normality-test-picker.html` (IBM-Plex / lean-navy design, ~232 KB, double-injected footer artifact). Every capability below ships in the Lab-sheet v2 rebuild or is dropped ONLY with a stated, on-page-taught reason. Math is unchanged: `tools/lib/normal-math.js` + `tools/lib/normality-math.js`, verified vs R 4.6.0 (harness green 54/54).

## Modes / tests (5) — each must compute + emit R + drive verdict
- [x] Shapiro-Wilk (`sw`) — W statistic, Royston AS R94, n 3..5000
- [x] Anderson-Darling (`ad`) — A² + A* correction, tail-sensitive, n>=5
- [x] Lilliefors (`lillie`) — D, KS with estimated params, Dallal-Wilkinson/Molin-Abdi p, n>=4
- [x] Jarque-Bera (`jb`) — JB + skew + excess kurtosis, chi-sq(2), n>=4 (trust n>=30)
- [x] Q-Q plot only (`qq`) — visual diagnostic, no p-value

## Hypothesis framing (2)
- [x] "I want to test [the data is normal | the data is NOT normal]" selector, synced to verdict interpretation
- [x] "I want to ..." banner is the mode selector (test dropdown inline) + alpha shown — the 3 UX features

## Significance levels (4)
- [x] alpha pills: 0.10, 0.05, 0.01, 0.001

## Scenario presets (6)
- [x] small — N(0,1) n=20, sw
- [x] large — N(0,1) n=500, sw
- [x] skewed — log-normal n=80, sw
- [x] heavy — Student-t df=3 n=100, ad
- [x] logfix — log-normal n=100, sw
- [x] custom — paste your own
- [x] scenario context box (title + story) shows on load; clear button

## Inputs
- [x] Raw data textarea, whitespace/comma/newline separated, live n
- [x] Test select dropdown (synced with mode pills + banner)
- [x] alpha picker

## Results / output
- [x] Verdict headline: test name + statistic symbol/value + REJECT/KEEP normality pill
- [x] p-value with sci-notation for tiny p; "reject/do not reject at alpha" line
- [x] Stats grid: n, statistic (W/A²/D/JB), p, skew, excess kurtosis
- [x] Callouts: n>5000 over-rejection (danger), n>1000 large-n note, n<8 low-power warning
- [x] Plain-English verdict box (appears normal / departs; parametric vs non-parametric recommendation)
- [x] Live inference line (decisive one-sentence, updates every input)
- [x] "How we got there" recap rows (inputs, sample, statistic, p, verdict)
- [x] Copyable report line

## Visualization
- [x] Q-Q plot: sample order stats vs theoretical Z, qqline via quartiles, points tinted on reject
- [x] Histogram + normal-density overlay
- [x] Q-Q / Histogram toggle
- [x] Viz caption + numeric readout (n, stat, p, skew, kurt)
- [x] What-if sliders synth data when no paste: n, skew, kurt (per-test config; lillie/qq drop kurt)
- [x] Labeled axes, aria-label on svg

## Explainer / anatomy
- [x] Primer ("New to normality testing?" — what it is / how to read p / picking the test / when it matters)
- [x] Per-test "when to use / example / inputs needed" context
- [x] Anatomy per test: formula + prose + IN/OUT, live recap "your inputs plugged in"
- [x] "When this is the wrong tool" table (ordinal, n<8, n>5000, equivalence, multivariate, regression residuals)

## R code emitter (per test)
- [x] sw: shapiro.test(x); ad: nortest::ad.test; lillie: nortest::lillie.test; jb: tseries::jarque.bera.test; qq: qqnorm/qqline
- [x] data line (first 30 values), always-add qqnorm footer, n>5000 ecdf footer
- [x] DROPPED with reason: in-browser runnable R block -> static copyable "same test in R" block (v2 sitewide pattern: consistent, no heavy runtime; trust line already states verified vs R). Taught via the copy block + trust line.

## FAQ (3, mirrors JSON-LD)
- [x] SW vs KS which to use
- [x] why fail even though looks normal (large-n over-rejection)
- [x] need to test before a t-test (CLT, residuals)

## Further reading / go deeper
- [x] over-rejection on big data, reading a Q-Q plot, SW intuition, Confidence Interval Calculator link

## Trust / accuracy
- [x] Trust line: no data leaves browser / verified vs R shapiro.test etc / free
- [x] Numerical-accuracy note: matches stats::shapiro.test, nortest::ad.test, nortest::lillie.test, tseries::jarque.bera.test

## Meta / SEO (reuse verbatim)
- [x] title "Normality Test Calculator: Shapiro-Wilk + Q-Q Plot" (53 ch, in 40-60)
- [x] meta description, canonical, OG, Twitter
- [x] JSON-LD: WebApplication + BreadcrumbList + FAQPage

## Analytics / trust wiring
- [x] tool_use (first input), tool_copy (copy), consent-mode GA, consent-banner.js, CF beacon

## Design gate (built page)
- [x] Lab-sheet shell (Inter/Inter Tight, cream bg, white cards, green accent), no IBM Plex in own styles
- [x] <=10 "IBM Plex" refs (only injected footer), <200 KB, exactly 1 data-tool-chrome="injected"
- [x] No em dashes, no eyebrow kicker above H1, no JetBrains Mono, no bespoke FAQ accordion CSS, no in-page footer

## Verification stamp (2026-07-14)
All items above ship in the Lab-sheet v2 rebuild. Verified:
- Math harness green 54/54 (lib unchanged).
- Local Playwright E2E: sw/ad/lillie/jb rendered stat + p match the R truth table to displayed precision; verdicts correct (ad rejects at 0.05, keeps at 0.01); qq shows mean/sd not p; n<3 and empty handled; scenarios load (small default, skewed rejects, large emits full 500-element R vector); alpha/hypothesis/viz-toggle/sliders all recompute; copy report + copy R code work.
- Emitted R code RUNS in R 4.6.0 and reproduces the displayed result (shapiro.test on the skewed scenario: W=0.653754 -> 0.6538, p=1.9332e-12 -> 1.933e-12).
- Design gate: built page 174.5 KB (<200), 3 IBM Plex refs (injected footer only, <=10), exactly 1 injected chrome, 0 own masthead, sitenav + sidebar + rail-fold present, 0 em dashes, mobile no overflow at 360/390.
- Only intentional drop: in-browser runnable R -> static copyable block (v2 sitewide pattern; trust line states verified vs R). No feature lost.
- Local page_audit: all substantive checks pass; only finding is the environmental /api/me 404 (auth probe, 200 on deploy) + CF-beacon CORS. True zero-finding audit run against the CF preview.
