# Plan: Statistical Consulting in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | Statistical Consulting in R: A Problem-Solving Framework That Works Every Time |
| slug | Statistical-Consulting-in-R |
| description | Translate a client's vague question into a well-posed statistical problem. Learn the PPDAC cycle, scoping, expectation management, and clear reports in R. |
| keywords | statistical consulting in R, PPDAC cycle R, scope statistical analysis, consulting framework R, statistical report writing R, client data problem R, manage expectations statistics, translate research question statistics |
| auto_link_terms | statistical consulting in R\|PPDAC cycle\|scope a statistical analysis\|consulting framework\|statistical report writing |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 2.10.1 |
| post_type | C |
| sidebar_section | Statistics |
| sidebar_title | Statistical Consulting |
| sidebar_order | 13 |

## B. Breadcrumb

Home > Statistics > Statistical Consulting & Decision Frameworks > Statistical Consulting in R

## C. Full Section Outline

### Lead sentence
Statistical consulting is the practice of translating a client's real-world question into a well-defined statistical problem, choosing the right analysis, and communicating results that non-statisticians can act on.

### Introduction (2-3 paragraphs)
- Hook: A client emails you a spreadsheet and says "Can you tell me if X causes Y?" — what do you do first?
- What: statistical consulting is a structured problem-solving process, not just running tests
- Why: framework prevents wasted work, wrong analyses, and reports nobody reads
- What you'll learn: PPDAC cycle, scoping, question translation, expectation management, report writing
- Note: all code runs in your browser, base R throughout

### Core H2 Sections (5)

#### H2 1: What is the PPDAC cycle and why does every consulting project need it?
- Theory: PPDAC = Problem, Plan, Data, Analysis, Conclusion. Originated with MacKay & Oldford (1994), popularized by Spiegelhalter.
- Code block 1: Create a sample consulting scenario as a structured list in R — define problem, plan, data, analysis, conclusion fields
- Diagram: Figure 1 (ppdac-cycle)
- Callout: KEY INSIGHT — the cycle is iterative, not linear
- Inline exercise: Create a PPDAC list for a different scenario (hospital readmissions)

#### H2 2: How do you translate a vague client question into a testable hypothesis?
- Theory: Clients say "Is X related to Y?" — you need outcome variable, predictor, measurement, population
- Code block 2: Build a question_to_hypothesis() function that structures the four components
- Code block 3: Apply it to three real-world vague questions, print structured outputs
- Diagram: Figure 3 (question-translation)
- Callout: TIP — always ask "What decision will change based on the answer?"
- Inline exercise: Translate "Do our customers like the new product?" into structured components

#### H2 3: How do you scope a statistical analysis before writing any code?
- Theory: Scoping = define deliverables, timeline, data requirements, methods, limitations upfront
- Code block 4: Create a scope_analysis() function that returns a structured list with all fields
- Code block 5: Demo: scope a real consulting scenario (employee satisfaction survey)
- Diagram: Figure 2 (scoping-checklist)
- Callout: WARNING — scope creep is the #1 killer of consulting projects
- Inline exercise: Add a "risks" field to the scope template

#### H2 4: How do you manage client expectations when results are surprising?
- Theory: Set expectations early — explain uncertainty, what "significant" means, what the data can/cannot answer
- Code block 6: Simulate a dataset where correlation != causation, show the trap
- Code block 7: Build an expectation_summary() function that prints plain-English interpretation
- Callout: KEY INSIGHT — always present what the data says AND what it cannot say
- Inline exercise: Write a one-sentence plain-English interpretation of a t-test result

#### H2 5: How do you write a statistical report that non-statisticians understand?
- Theory: Structure = Executive Summary, Methods, Results, Limitations, Recommendations
- Code block 8: Build a generate_report_skeleton() function that creates a report template
- Code block 9: Fill the template with actual analysis results from the simulated data
- Callout: TIP — lead with the business answer, then show the evidence
- Inline exercise: Write an executive summary for a given result

### Common Mistakes (3-5)
1. Starting analysis before defining the question
2. Using jargon in client reports (p-values without context)
3. Ignoring data quality checks before modeling
4. Promising causation from observational data
5. Not documenting assumptions and limitations

### Practice Exercises (2-3 capstone)
1. Medium: Given a vague business question and a dataset, produce a complete PPDAC structure
2. Hard: Scope, analyze, and write a mini consulting report for a client scenario (mtcars fleet data)

### Complete Example
- End-to-end: Client asks "Which of our car models are most fuel-efficient?"
- Walk through PPDAC, scoping, analysis (lm + summary), interpretation, report skeleton

### Summary
- Table of the 5-step consulting framework with key actions at each stage

### FAQ (5)
1. How is statistical consulting different from data analysis?
2. What should a scope of work include?
3. How do I handle a client who wants a specific answer?
4. When should I refuse a consulting project?
5. How do I price statistical consulting work?

### References (7)
1. MacKay & Oldford — "Scientific Method, Statistical Method, and the Speed of Light" (1994)
2. Spiegelhalter — "The Art of Statistics" (2019)
3. Peterson et al. — "Reaping what you SOW" (2022), Wiley Stat
4. ASA — "What to Expect When Consulting a Statistician"
5. Wild & Pfannkuch — "Statistical Thinking in Empirical Enquiry" (1999)
6. R Core Team — "An Introduction to R"
7. Derr — "Statistical Consulting: A Guide to Effective Communication" (2000)

### What's Next
1. Choosing the Right Statistical Test in R (decision flowchart)
2. Linear Regression in R (the most common consulting deliverable)
3. Communicating Uncertainty in R (building trust with clients)

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Statistical-Consulting-in-R-ppdac-cycle.webp | Figure 1 | The PPDAC cycle: Problem, Plan, Data, Analysis, Conclusion — and back again. | What is the PPDAC cycle...? |
| 2 | Statistical-Consulting-in-R-scoping-checklist.webp | Figure 2 | Six steps to scope a consulting project before writing any code. | How do you scope...? |
| 3 | Statistical-Consulting-in-R-question-translation.webp | Figure 3 | Translating a vague question into a testable hypothesis by identifying outcome type and group count. | How do you translate...? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | PPDAC structure as list | — | consulting_project | — |
| 2 | question_to_hypothesis() function | — | question_to_hypothesis | — |
| 3 | Apply to 3 vague questions | — | q1, q2, q3 | question_to_hypothesis |
| 4 | scope_analysis() function | — | scope_analysis | — |
| 5 | Scope a real scenario | — | employee_scope | scope_analysis |
| 6 | Correlation != causation demo | — | sim_data, cor_result, lm_result | — |
| 7 | expectation_summary() function | — | expectation_summary | sim_data, lm_result |
| 8 | generate_report_skeleton() | — | generate_report_skeleton | — |
| 9 | Fill report with results | — | filled_report | generate_report_skeleton, lm_result |
| 10 | Complete example: PPDAC + scope + analysis + report | — | fleet_project, fleet_scope, fleet_model, fleet_report | question_to_hypothesis, scope_analysis, generate_report_skeleton |

## Plan Summary
- 14 H2 sections (1 intro + 5 core + 7 tail + 1 complete example)
- 3 diagrams
- 10+ code blocks
- 5 inline exercises + 2 capstone exercises
- Estimated word count: 4500-5500
