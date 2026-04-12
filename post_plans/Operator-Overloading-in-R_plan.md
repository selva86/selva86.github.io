# Plan: Operator Overloading in R: Give Your S3 Objects Intuitive Behaviour

## A. Frontmatter

| Field | Value |
|---|---|
| title | Operator Overloading in R: Give Your S3 Objects Intuitive Behaviour |
| slug | Operator-Overloading-in-R |
| description | Define custom +, -, ==, [, print, and format methods for S3 objects in R so they behave naturally. Complete worked example building a physical units class. |
| keywords | operator overloading in R, S3 Ops group generic, custom operators R, double dispatch R, S3 print method, format method R, R class methods, physical units class R |
| auto_link_terms | operator overloading in R\|Ops group generic\|S3 group generics\|double dispatch\|custom operators in R\|print.class method\|format.class method |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-12 |
| curriculum_id | 4.3.8 |
| post_type | C |
| sidebar_section | Advanced R |
| sidebar_title | Operator Overloading |
| sidebar_order | 17 |

## B. Breadcrumb (auto-generated)

`Home > Learn R > OOP in R > Operator Overloading in R: Give Your S3 Objects Intuitive Behaviour`

## C. Outline

**Lead (`<p class="lead">`):** Operator overloading in R lets you define what `+`, `==`, `[`, and `print` do for your own S3 classes, so a meters object can add meters, a money object can compare dollars, and every method uses base R operators.

**Section 1 — "What exactly is operator overloading in R?"** (first H2, first code block, payoff-first)
- First H2 opening prose (≤80 words): One short paragraph explaining that R's operators are already generic functions, so overloading just means writing a method with the right name. Preview that we'll turn a plain list into a length object that adds itself and prints nicely.
- **Block 1 (payoff):** Build a tiny `length_m` constructor, write `+.length_m`, and `print.length_m`. Run `a + b` and show "5 m" output. Interpretation: prove the custom method fires.
- Callout: [KEY INSIGHT] R operators are S3 generics under the hood.
- Inline exercise: add `-.length_m`.

**Section 2 — "How does R decide which operator method to call?"**
- Explain S3 dispatch for operators (double dispatch). Use `sloop::s3_dispatch(a + b)` style diagnostic OR write a short example with two classes that illustrates the "both sides checked" behaviour.
- **Block 2:** Show `mixed <- a + 3`, explain what happens when only the left side has a method.
- **Block 3:** Show the warning when both sides define conflicting methods (`a + c` with a competing class), then fix via a unified method.
- **Diagram 1 (Figure 1):** `Operator-Overloading-in-R-dispatch-flow.webp` — flowchart of dispatch decision.
- Callout: [WARNING] About "Incompatible methods" warnings.
- Inline exercise: predict what `3 + a` returns without running it.

**Section 3 — "When should you use the Ops group generic instead?"**
- Motivate: writing `+`, `-`, `*`, `/`, `==`, `<` one by one is tedious and error-prone. The Ops group generic lets you handle them with a single `Ops.class` method using `.Generic`.
- **Block 4:** Rewrite the length class using `Ops.length_m` — dispatch on `.Generic`, guard unsupported ops with a clear error.
- **Block 5:** Show that `a + b`, `a * 2`, `a == b` all work.
- **Diagram 2 (Figure 2):** `Operator-Overloading-in-R-group-generics.webp` — Ops / Math / Summary.
- Callout: [TIP] Use `Ops` for arithmetic/comparison; use individual methods for `[`, `[[`, `print`, `format`.
- Inline exercise: add `<` support by extending the allowed-generics guard.

**Section 4 — "How do you make your class print and format nicely?"**
- Teach `format.class` (character representation) and `print.class` (calls `format`, adds context). Explain `invisible(x)` return.
- **Block 6:** Write `format.length_m` and `print.length_m`. Demonstrate `format(a)` vs `print(a)` vs `paste("Height is", a)`.
- Callout: [NOTE] Separating `format()` from `print()` lets `paste()` and `sprintf()` also produce nice output.
- Inline exercise: make `format.length_m` show 2 decimal places.

**Section 5 — "How do you overload `[` and `[[` for vectorised classes?"**
- Explain: a length vector of many meters should subset like a normal vector, keeping its class. Covers `[.class` with `NextMethod()` and attribute preservation.
- **Block 7:** Define `[.length_m` and `[<-.length_m` with `NextMethod()`. Create a 5-element `lens <- length_m(c(1,2,3,4,5))`, subset `lens[2:4]`, verify the result still prints with units.
- Callout: [WARNING] Don't call your constructor inside `[.class` — use `NextMethod()`.
- Inline exercise: write `[[.length_m` that returns a single-element length_m.

**Section 6 — "How do you also overload `Math`, `Summary`, and comparison operators?"**
- Short tour: Math (`sqrt`, `log`, `abs`), Summary (`sum`, `min`, `max`), already-covered Ops comparisons.
- **Block 8:** Add `Math.length_m` and `Summary.length_m` to the unit class. Show `sum(lens)`, `max(lens)`, `abs(length_m(-3))`.
- **Diagram 3 (Figure 3):** `Operator-Overloading-in-R-method-map.webp` — mind-map of what a "rich" class ships.
- Callout: [KEY INSIGHT] Group generics turn 30 method definitions into 3.
- Inline exercise: add `Summary.length_m` support for `range()` which uses `min`/`max` internally (no code needed — just reason).

## Tail sections

**## Practice Exercises** (2-3 capstone)
1. *Temperature class:* Build `celsius()` constructor. Overload `Ops.celsius` so `celsius(20) + celsius(5)` returns `celsius(25)`, and `celsius(20) > 15` works. Write a `print.celsius` that shows "20 °C".
2. *Currency class:* Build `money(amount, currency)`. Allow adding two same-currency amounts; error on mixed currency. Add `format.money` and `print.money` producing "$100.00 USD".
3. *2-D point class:* Build `point(x, y)`. Overload `+` and `-` using individual operators (not `Ops`). Add `==.point` that compares both coordinates. Add `print.point` that shows "(3, 4)".

**## Complete Example: A Physical Units Class**
- End-to-end walkthrough: a `units` class that stores numeric values with a unit attribute ("m", "kg", "s"). Supports: `+`, `-`, `*` (scalar), `==`, `<`, `print`, `format`, `[`, `sum`, `max`. Demonstrate a mini calculation (three lengths summed, compared, formatted in a sentence).

**## Summary**
- Table: concept → method signature → example.

**## References**
1. Wickham — Advanced R §13 (S3)
2. Gagolewski — Deep R Programming §10
3. R base docs: `?groupGeneric`
4. R base docs: `?Ops`, `?Math`, `?Summary`
5. tidyverse/vctrs: `?vec_arith`
6. R core: NextMethod documentation
7. Appsilon OOP in R

**## Continue Learning**
1. S3 Classes in R — how to define the class structure
2. S3 Method Dispatch in R — deep dive on dispatch rules
3. R6 Classes in R — reference-semantics alternative

## D. Diagrams

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Operator-Overloading-in-R-dispatch-flow.webp | Figure 1 | How R resolves a binary operator across two argument classes. | How does R decide which operator method to call? |
| 2 | Operator-Overloading-in-R-group-generics.webp | Figure 2 | The three S3 group generics that cover most math and comparison needs. | When should you use the Ops group generic instead? |
| 3 | Operator-Overloading-in-R-method-map.webp | Figure 3 | The method family a rich S3 class typically ships with. | How do you also overload Math, Summary, and comparison operators? |

## E. Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Build length_m, define + and print, payoff run | — | length_m, print.length_m, +.length_m, a, b | — |
| 2 | Add scalar: a + 3 (one-sided method) | — | mixed | a |
| 3 | Conflicting class warning and fix | — | length_ft | a |
| 4 | Ops.length_m group method | — | Ops.length_m | length_m, a, b |
| 5 | Use a+b, a*2, a==b via Ops | — | prods, eq | a, b |
| 6 | format.length_m + print.length_m | — | format.length_m | length_m, a |
| 7 | [.length_m, [<-.length_m, subset vector | — | [.length_m, lens | length_m |
| 8 | Math.length_m, Summary.length_m, sum/max | — | Math.length_m, Summary.length_m | lens, length_m |
| 9 | Capstone: full units class end-to-end | — | units, +.units, etc. | — |

No libraries needed — pure base R throughout.
