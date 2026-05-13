"""Generate per-hub quiz HTML files from the dplyr quiz template.

Each new quiz is a copy of dplyr-Exercises-in-R-quiz.html with:
  - title / meta / og / canonical URLs updated
  - 'dplyr Mastery' branding swapped for the hub label
  - cert-title swapped for the credential name
  - Exit / footer hub links swapped
  - CONFIG (hubSlug, hubLabel, learnersBase, storageKey) swapped
  - BANK array fully replaced with the hub's question bank

Run:  python Scripts/generate_quizzes.py
"""
from __future__ import annotations
import json
import os
import re
import hashlib

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEMPLATE_PATH = os.path.join(REPO_ROOT, 'dplyr-Exercises-in-R-quiz.html')


# ---------------------------------------------------------------------------
# Question bank schema (Python dicts; rendered to JS by render_bank below)
# ---------------------------------------------------------------------------
# Per question:
#   { 'id', 'type': 'mcq'|'code', 'diff': 1|2|3, 'topic': str, ... }
# MCQ adds:    'q', 'opts' (list of {'t', 'correct'?}), 'hints', 'why'
# Code adds:   'prompt', 'fnName', 'starter', 'tests', 'hints', 'why'


# ---------------------------------------------------------------------------
# QUIZ 1: R Fundamentals (R-Beginner-Exercises hub)
# ---------------------------------------------------------------------------
R_FUNDAMENTALS_BANK = [
    # Easy MCQ (4)
    {'id':'rf_assign', 'type':'mcq', 'diff':1, 'topic':'syntax',
     'q':'Which is the conventional assignment operator in R?',
     'opts':[{'t':'<code>=</code>'},{'t':'<code>&lt;-</code>','correct':True},{'t':'<code>:=</code>'},{'t':'<code>==</code>'}],
     'hints':['One of these performs comparison, not assignment.'],
     'why':'<code>&lt;-</code> is the conventional R assignment operator and works at every scope. <code>=</code> assigns but is also used for named arguments, which can cause confusion. <code>==</code> tests equality; <code>:=</code> is a data.table operator.'},
    {'id':'rf_vec', 'type':'mcq', 'diff':1, 'topic':'vectors',
     'q':'Which call produces an atomic numeric vector with three elements?',
     'opts':[{'t':'<code>vec(1, 2, 3)</code>'},{'t':'<code>c(1, 2, 3)</code>','correct':True},{'t':'<code>list(1, 2, 3)</code>'},{'t':'<code>array(1, 2, 3)</code>'}],
     'hints':['c() stands for "combine" or "concatenate".'],
     'why':'<code>c()</code> combines values into an atomic vector. <code>list()</code> creates a heterogeneous list of length 3. <code>vec()</code> does not exist in base R. <code>array(1, 2, 3)</code> tries to build a 2x3 array filled with 1.'},
    {'id':'rf_class_int', 'type':'mcq', 'diff':1, 'topic':'types',
     'q':'What does <code>class(c(1L, 2L, 3L))</code> return?',
     'opts':[{'t':'<code>"numeric"</code>'},{'t':'<code>"integer"</code>','correct':True},{'t':'<code>"double"</code>'},{'t':'<code>"vector"</code>'}],
     'hints':['The L suffix forces a specific numeric subtype.'],
     'why':'The <code>L</code> suffix marks integer literals, so the class is "integer". Without L (e.g., <code>c(1, 2, 3)</code>) you get class "numeric" (storage mode "double"). class() and typeof() report differently for doubles: class is "numeric" but typeof is "double".'},
    {'id':'rf_index_one', 'type':'mcq', 'diff':1, 'topic':'indexing',
     'q':'For <code>x &lt;- c(10, 20, 30)</code>, what does <code>x[1]</code> return?',
     'opts':[{'t':'<code>10</code>','correct':True},{'t':'<code>20</code>'},{'t':'<code>numeric(0)</code>'},{'t':'an error (0-indexed)'}],
     'hints':['R is 1-indexed, unlike Python.'],
     'why':'R indexes from 1, so <code>x[1]</code> is the first element. <code>x[0]</code> returns a zero-length vector (numeric(0)), not an error. Negative indices like <code>x[-1]</code> drop that element.'},

    # Medium MCQ (4)
    {'id':'rf_list_vs_vec', 'type':'mcq', 'diff':2, 'topic':'data structures',
     'q':'How does a list differ from an atomic vector in R?',
     'opts':[
        {'t':'They are identical; "list" is an alias'},
        {'t':'Lists can hold elements of different types; atomic vectors coerce to one type','correct':True},
        {'t':'Atomic vectors can be named; lists cannot'},
        {'t':'Lists are always 1-dimensional; vectors can be multi-dimensional'},
     ],
     'hints':['Try c("a", 1) and check the type of the result.'],
     'why':'Atomic vectors coerce all elements to a single type (e.g., c("a", 1) becomes c("a", "1") of type character). Lists preserve the original type of each element. Both can be named and both are 1D.'},
    {'id':'rf_recycle', 'type':'mcq', 'diff':2, 'topic':'recycling',
     'q':'What does <code>c(1, 2, 3, 4) + c(10, 20)</code> return?',
     'opts':[
        {'t':'<code>c(11, 22)</code>'},
        {'t':'<code>c(11, 22, 13, 24)</code>','correct':True},
        {'t':'<code>c(11, 22, 3, 4)</code>'},
        {'t':'an error (length mismatch)'},
     ],
     'hints':['R recycles the shorter vector when the longer length is a multiple of the shorter.','Index 1 gets 1+10, index 2 gets 2+20, index 3 gets 3+10 (recycled), index 4 gets 4+20.'],
     'why':'Vectorized operations recycle the shorter vector to the length of the longer: c(10, 20) becomes c(10, 20, 10, 20), then is added elementwise to c(1, 2, 3, 4). When the longer length is not a multiple of the shorter, R warns but still recycles.'},
    {'id':'rf_na_propagate', 'type':'mcq', 'diff':2, 'topic':'NA',
     'q':'What does <code>mean(c(1, 2, NA, 4))</code> return?',
     'opts':[
        {'t':'<code>2.33</code>'},
        {'t':'<code>NA</code>','correct':True},
        {'t':'<code>1.75</code>'},
        {'t':'an error'},
     ],
     'hints':['By default NA propagates through arithmetic and summary functions.','Pass na.rm = TRUE to skip NAs.'],
     'why':'NA is contagious: any arithmetic involving NA yields NA, and summary functions like mean(), sum(), sd() return NA unless you pass <code>na.rm = TRUE</code>. With na.rm = TRUE the result here would be 7/3 = 2.33.'},
    {'id':'rf_coerce_hier', 'type':'mcq', 'diff':2, 'topic':'types',
     'q':'What is the type of <code>c(TRUE, 2L, 3.5)</code>?',
     'opts':[
        {'t':'logical'},
        {'t':'integer'},
        {'t':'double','correct':True},
        {'t':'character'},
     ],
     'hints':['Atomic vectors coerce to the most flexible type in the input.','The coercion hierarchy is logical < integer < double < character.'],
     'why':'When c() mixes types, all values coerce to the most flexible: logical < integer < double < character. Here TRUE becomes 1, 2L becomes 2.0, and 3.5 stays. The result is a double vector c(1.0, 2.0, 3.5). Adding a string would push the whole thing to character.'},

    # Hard MCQ (3)
    {'id':'rf_lapply', 'type':'mcq', 'diff':3, 'topic':'apply family',
     'q':'What does <code>lapply(1:3, function(x) x^2)</code> return?',
     'opts':[
        {'t':'<code>c(1, 4, 9)</code>'},
        {'t':'A list of length 3 with elements 1, 4, 9','correct':True},
        {'t':'A 1x3 matrix of c(1, 4, 9)'},
        {'t':'<code>9</code> (only the last value)'},
     ],
     'hints':['lapply always returns a list. sapply tries to simplify.'],
     'why':'<code>lapply()</code> always returns a list the same length as the input. <code>sapply()</code> would simplify to the numeric vector c(1, 4, 9), and <code>vapply()</code> requires you to specify the output template up front for type safety.'},
    {'id':'rf_lexical', 'type':'mcq', 'diff':3, 'topic':'scoping',
     'q':'What does this code print?<br><pre style="margin:8px 0;background:#1e2734;color:#e1e6ee;padding:10px 14px;border-radius:4px;font-size:13px">x &lt;- 1\nf &lt;- function() x + 1\nx &lt;- 10\nf()</pre>',
     'opts':[
        {'t':'<code>2</code>'},
        {'t':'<code>11</code>','correct':True},
        {'t':'an error (x not found)'},
        {'t':'<code>NULL</code>'},
     ],
     'hints':['R uses lexical scoping but looks up free variables at call time, not at function definition time.'],
     'why':'R resolves free variables when the function is called, not when it is defined. At call time x is 10, so f() returns 11. Lexical scoping is about WHERE to look (the defining environment), not WHEN (which is always at call time).'},
    {'id':'rf_s3_dispatch', 'type':'mcq', 'diff':3, 'topic':'OOP',
     'q':'You set <code>class(x) &lt;- "foo"</code> and then call <code>print(x)</code>. How does R decide which method to run?',
     'opts':[
        {'t':'It runs the body of print() directly with x as the argument'},
        {'t':'It looks up <code>print.foo</code>, then <code>print.default</code> if not found','correct':True},
        {'t':'It always uses <code>print.default</code> unless you wrote a setMethod()'},
        {'t':'It throws an error because foo is not a registered class'},
     ],
     'hints':['S3 dispatch walks the class vector and looks for generic.class methods.'],
     'why':'S3 generics like print() use UseMethod() to dispatch on the first argument\'s class attribute. R searches for <code>print.foo</code>, then walks the rest of the class vector, finally falling back to <code>print.default</code>. No method is required; default catches everything.'},

    # Easy code (2)
    {'id':'rf_code_sumvec', 'type':'code', 'diff':1, 'topic':'vectors',
     'prompt':'Write a function <code>sum_squares(x)</code> that returns the sum of the squares of the numeric vector <code>x</code>. Use vectorized R, not a loop.',
     'fnName':'sum_squares',
     'starter':'sum_squares <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(sum_squares(c(1, 2, 3)) == 14)\nstopifnot(sum_squares(c(0)) == 0)\nstopifnot(abs(sum_squares(c(-2, 2)) - 8) < 1e-9)\nstopifnot(sum_squares(numeric(0)) == 0)',
     'hints':['x^2 squares every element, then sum() reduces to a single number.'],
     'why':'<code>sum(x^2)</code> is the idiomatic one-liner: <code>x^2</code> is vectorized, <code>sum()</code> reduces to a scalar. A for-loop works but is slower and longer for no benefit.'},
    {'id':'rf_code_filter_pos', 'type':'code', 'diff':1, 'topic':'indexing',
     'prompt':'Write a function <code>keep_positive(x)</code> that returns only the strictly positive elements of the numeric vector <code>x</code>, preserving order.',
     'fnName':'keep_positive',
     'starter':'keep_positive <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(keep_positive(c(-1, 0, 1, 2)), c(1, 2)))\nstopifnot(length(keep_positive(c(-1, -2))) == 0)\nstopifnot(identical(keep_positive(c(5, 10)), c(5, 10)))',
     'hints':['x > 0 gives a logical vector. Use it to subset.'],
     'why':'<code>x[x &gt; 0]</code> is the idiomatic logical-subset filter. The condition produces TRUE/FALSE per element; TRUE positions are kept. Order is preserved automatically.'},

    # Medium code (2)
    {'id':'rf_code_fizzbuzz', 'type':'code', 'diff':2, 'topic':'control flow',
     'prompt':'Write <code>fizzbuzz(n)</code> that returns a character vector of length <code>n</code>. For each i from 1 to n: "Fizz" if i is divisible by 3, "Buzz" if divisible by 5, "FizzBuzz" if divisible by both, otherwise the number as a string.',
     'fnName':'fizzbuzz',
     'starter':'fizzbuzz <- function(n) {\n  # Your code here\n  \n}',
     'tests':'r <- fizzbuzz(15)\nstopifnot(length(r) == 15)\nstopifnot(r[1] == "1")\nstopifnot(r[3] == "Fizz")\nstopifnot(r[5] == "Buzz")\nstopifnot(r[15] == "FizzBuzz")\nstopifnot(r[7] == "7")\nstopifnot(is.character(r))',
     'hints':['Check divisible-by-15 FIRST, then 3, then 5, else the number.','sapply() over 1:n with a chained if/else returns a character vector directly.'],
     'why':'Idiomatic R: <code>sapply(1:n, function(i) if (i %% 15 == 0) "FizzBuzz" else if (i %% 3 == 0) "Fizz" else if (i %% 5 == 0) "Buzz" else as.character(i))</code>. Test divisibility by 15 first; otherwise "Fizz" or "Buzz" fires before "FizzBuzz" gets a chance.'},
    {'id':'rf_code_named_sq', 'type':'code', 'diff':2, 'topic':'data structures',
     'prompt':'Write <code>name_squares(n)</code> that returns a named numeric vector where element i has name <code>"sq_i"</code> and value <code>i^2</code>, for i from 1 to n. For n = 0, return an empty named numeric vector.',
     'fnName':'name_squares',
     'starter':'name_squares <- function(n) {\n  # Your code here\n  \n}',
     'tests':'r <- name_squares(3)\nstopifnot(identical(unname(r), c(1, 4, 9)))\nstopifnot(identical(names(r), c("sq_1", "sq_2", "sq_3")))\nstopifnot(length(name_squares(0)) == 0)',
     'hints':['Build the values with seq_len(n)^2 first.','setNames(values, paste0("sq_", seq_len(n))) does both steps.'],
     'why':'<code>setNames(seq_len(n)^2, paste0("sq_", seq_len(n)))</code>: seq_len handles n = 0 safely (1:0 would yield c(1, 0)). The values and names are both built vectorized, then attached in one expression.'},

    # Hard code (2)
    {'id':'rf_code_closure', 'type':'code', 'diff':3, 'topic':'closures',
     'prompt':'Write <code>make_counter(start)</code> that returns a function. Each time the returned function is called, it should return the next integer, starting at <code>start</code>. The counter must keep its state across calls, and separate counters must be independent.',
     'fnName':'make_counter',
     'starter':'make_counter <- function(start) {\n  # Your code here\n  \n}',
     'tests':'counter <- make_counter(10)\nstopifnot(counter() == 10)\nstopifnot(counter() == 11)\nstopifnot(counter() == 12)\nc2 <- make_counter(0)\nstopifnot(c2() == 0)\nstopifnot(c2() == 1)\nstopifnot(counter() == 13)',
     'hints':['Each call to make_counter() creates a fresh enclosing environment. The returned function reads and updates it.','Use <code>&lt;&lt;-</code> (super-assignment) to write back into the enclosing environment instead of creating a local variable.'],
     'why':'Classic closure: <code>make_counter &lt;- function(start) { i &lt;- start; function() { val &lt;- i; i &lt;&lt;- i + 1; val } }</code>. The inner function captures i from the enclosing scope. <code>&lt;&lt;-</code> walks up parent environments and rebinds, giving stateful behavior per counter.'},
    {'id':'rf_code_apply_cols', 'type':'code', 'diff':3, 'topic':'apply family',
     'prompt':'Write <code>col_means_no_dplyr(df)</code> that returns a named numeric vector of column means for every numeric column in the data frame <code>df</code>. Non-numeric columns must be skipped. Do NOT use dplyr.',
     'fnName':'col_means_no_dplyr',
     'starter':'col_means_no_dplyr <- function(df) {\n  # Your code here\n  \n}',
     'tests':'r <- col_means_no_dplyr(iris)\nnum_cols <- names(iris)[sapply(iris, is.numeric)]\nstopifnot(identical(names(r), num_cols))\nstopifnot(abs(r[["Sepal.Length"]] - mean(iris$Sepal.Length)) < 1e-9)\nstopifnot(!"Species" %in% names(r))\nstopifnot(is.numeric(r))',
     'hints':['sapply(df, is.numeric) gives a logical vector flagging numeric columns.','sapply(df[<logical>], mean) applies mean to each kept column and gives a named numeric vector.'],
     'why':'<code>sapply(df[sapply(df, is.numeric)], mean)</code>: the inner sapply identifies numeric columns, the bracket subset keeps only those columns (data frame in, data frame out), and the outer sapply collapses each column to its mean. Names propagate automatically.'},
]


# ---------------------------------------------------------------------------
# QUIZ 2: ggplot2 (ggplot2-Exercises-in-R hub)
# ---------------------------------------------------------------------------
GGPLOT2_BANK = [
    # Easy MCQ (4)
    {'id':'gg_layers', 'type':'mcq', 'diff':1, 'topic':'grammar',
     'q':'Which function starts a ggplot2 plot?',
     'opts':[{'t':'<code>plot()</code>'},{'t':'<code>ggplot()</code>','correct':True},{'t':'<code>geom_plot()</code>'},{'t':'<code>aes()</code>'}],
     'hints':['ggplot2 uses a layered grammar. The base is the data + default mappings.'],
     'why':'<code>ggplot(data, aes(...))</code> creates the empty canvas with the data and default aesthetic mappings. Geoms add visible layers; without at least one geom you see only axes.'},
    {'id':'gg_aes_meaning', 'type':'mcq', 'diff':1, 'topic':'aesthetics',
     'q':'What does <code>aes(x = mpg, y = hp)</code> do?',
     'opts':[
        {'t':'Sets the chart title'},
        {'t':'Maps the mpg column to the x-axis and hp to the y-axis','correct':True},
        {'t':'Filters the data to the mpg and hp columns'},
        {'t':'Adds a regression line'},
     ],
     'hints':['aes stands for "aesthetic mappings": column to visual property.'],
     'why':'<code>aes()</code> declares mappings from data columns to visual aesthetics (x, y, color, fill, size, shape, alpha, group). Anything that varies with the data goes inside aes(); anything fixed goes outside it.'},
    {'id':'gg_geom_point', 'type':'mcq', 'diff':1, 'topic':'geoms',
     'q':'Which geom draws a scatterplot?',
     'opts':[{'t':'<code>geom_line()</code>'},{'t':'<code>geom_bar()</code>'},{'t':'<code>geom_point()</code>','correct':True},{'t':'<code>geom_scatter()</code>'}],
     'hints':['Scatter = individual data points.'],
     'why':'<code>geom_point()</code> draws one point per row. <code>geom_scatter()</code> does not exist in ggplot2. <code>geom_line()</code> connects points with a line; <code>geom_bar()</code> defaults to stat="count" and is for tallied categorical data.'},
    {'id':'gg_color_vs_fill_basic', 'type':'mcq', 'diff':1, 'topic':'aesthetics',
     'q':'For a bar chart, which aesthetic controls the interior color of the bars?',
     'opts':[{'t':'<code>color</code>'},{'t':'<code>fill</code>','correct':True},{'t':'<code>border</code>'},{'t':'<code>shade</code>'}],
     'hints':['color is for outlines and 1D shapes (points, lines); fill is for solid 2D shapes.'],
     'why':'<code>color</code> sets the outline/stroke. <code>fill</code> sets the interior of closed shapes (bars, polygons, ribbons, boxplots). For points and lines, only <code>color</code> applies (except shapes 21-25 which accept both).'},

    # Medium MCQ (4)
    {'id':'gg_facet', 'type':'mcq', 'diff':2, 'topic':'facets',
     'q':'What does <code>facet_wrap(~ Species)</code> do?',
     'opts':[
        {'t':'Adds a legend for Species'},
        {'t':'Splits the plot into one panel per Species level','correct':True},
        {'t':'Filters to one Species'},
        {'t':'Wraps the title text with the value of Species'},
     ],
     'hints':['Faceting creates small multiples: one panel per group.'],
     'why':'<code>facet_wrap()</code> creates separate panels for each value of the faceting variable and packs them into a rectangular grid. Use <code>facet_grid(row_var ~ col_var)</code> when you want a strict rows-by-columns matrix.'},
    {'id':'gg_stat_smooth', 'type':'mcq', 'diff':2, 'topic':'stats',
     'q':'<code>geom_smooth(method = "lm")</code> adds:',
     'opts':[
        {'t':'A locally-weighted regression curve'},
        {'t':'A linear regression line with a confidence-interval ribbon','correct':True},
        {'t':'A spline interpolation'},
        {'t':'A horizontal line at the mean'},
     ],
     'hints':['"lm" stands for linear model.','The default method is "loess" for small n, "gam" for large n.'],
     'why':'<code>method = "lm"</code> fits a linear regression. The default is <code>"loess"</code> (locally-weighted) for n < 1000. The confidence ribbon is on by default; suppress with <code>se = FALSE</code>.'},
    {'id':'gg_theme_legend', 'type':'mcq', 'diff':2, 'topic':'themes',
     'q':'How do you remove the legend from a ggplot?',
     'opts':[
        {'t':'<code>+ theme(legend.position = "none")</code>','correct':True},
        {'t':'<code>+ no_legend()</code>'},
        {'t':'<code>+ guides("none")</code>'},
        {'t':'<code>aes(legend = FALSE)</code>'},
     ],
     'hints':['theme() controls non-data elements: legend, axis text, panel grid, etc.'],
     'why':'<code>theme(legend.position = "none")</code> removes the legend entirely. <code>guides(color = "none")</code> would suppress only the color guide, leaving fill or size legends visible.'},
    {'id':'gg_position_dodge', 'type':'mcq', 'diff':2, 'topic':'position',
     'q':'In <code>geom_bar(position = "dodge")</code> with a fill aesthetic, what happens?',
     'opts':[
        {'t':'Bars stack on top of each other'},
        {'t':'Bars are placed side-by-side within each x value','correct':True},
        {'t':'Bars are normalized so each x sums to 1'},
        {'t':'Bars are sorted left to right by value'},
     ],
     'hints':['"dodge" means side-by-side; "stack" stacks; "fill" normalizes to 100%.'],
     'why':'<code>position = "dodge"</code> places grouped bars next to each other within an x category. <code>"stack"</code> is the default. <code>"fill"</code> rescales each x so the stack sums to 1, exposing proportions rather than counts.'},

    # Hard MCQ (3)
    {'id':'gg_bar_vs_col', 'type':'mcq', 'diff':3, 'topic':'geoms',
     'q':'You have a tibble with columns <code>category</code> and <code>value</code> already aggregated. Which geom plots <code>value</code> directly as bar height without any statistical transformation?',
     'opts':[
        {'t':'<code>geom_bar()</code> with default stat'},
        {'t':'<code>geom_col()</code>','correct':True},
        {'t':'<code>geom_histogram()</code>'},
        {'t':'<code>geom_bar(stat = "summary")</code>'},
     ],
     'hints':['geom_bar() defaults to stat = "count" (it counts rows).','geom_col() defaults to stat = "identity".'],
     'why':'<code>geom_col()</code> is shorthand for <code>geom_bar(stat = "identity")</code>: it maps y directly to bar height. <code>geom_bar()</code> alone counts rows per x. Reaching for geom_bar() on pre-summarised data and then setting stat="identity" is a common code smell; geom_col() is the cleaner intent.'},
    {'id':'gg_inherit_layer', 'type':'mcq', 'diff':3, 'topic':'aesthetics',
     'q':'In <code>ggplot(df, aes(x, y)) + geom_point(aes(color = z)) + geom_smooth()</code>, which mapping does the smooth use?',
     'opts':[
        {'t':'It fits one smooth per level of z (inherited from geom_point)'},
        {'t':'It fits a single smooth using only x and y from the ggplot() call','correct':True},
        {'t':'It errors because the second aes() is ambiguous'},
        {'t':'It silently ignores y'},
     ],
     'hints':['Geom-level aes() applies ONLY to that geom; it does not propagate to siblings.','To split the smooth by z, move color = z into the ggplot() call.'],
     'why':'Aesthetics on <code>ggplot()</code> are defaults for every layer. Aesthetics on a geom apply only to that geom. So geom_smooth sees just x and y. To get one smooth per z, set the mapping at the top level: <code>ggplot(df, aes(x, y, color = z))</code>.'},
    {'id':'gg_position_fill_vs_stack', 'type':'mcq', 'diff':3, 'topic':'position',
     'q':'What is the difference between <code>position = "stack"</code> and <code>position = "fill"</code> on a stacked bar chart?',
     'opts':[
        {'t':'They are identical'},
        {'t':'"stack" preserves raw counts (different total heights); "fill" rescales each bar to sum to 1 (proportions)','correct':True},
        {'t':'"fill" stacks; "stack" dodges'},
        {'t':'"fill" applies only to geom_area, not geom_bar'},
     ],
     'hints':['Both stack values vertically. Only one normalizes per x.'],
     'why':'<code>"stack"</code> keeps absolute counts: the total bar height equals the group total. <code>"fill"</code> divides each segment by the bar total so every bar reaches y = 1, making the chart a proportion plot. Use stack when totals matter, fill when within-bar composition matters.'},

    # Easy code (2)
    {'id':'gg_code_scatter', 'type':'code', 'diff':1, 'topic':'geoms',
     'prompt':'Write <code>mpg_hp_scatter(df)</code> that returns a ggplot object showing a scatterplot of <code>mpg</code> against <code>hp</code> from data frame <code>df</code>. No title or theme. Just the basic plot.',
     'fnName':'mpg_hp_scatter',
     'starter':'library(ggplot2)\n\nmpg_hp_scatter <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- mpg_hp_scatter(mtcars)\nstopifnot(inherits(p, "ggplot"))\nstopifnot("GeomPoint" %in% sapply(p$layers, function(l) class(l$geom)[1]))\nstopifnot(rlang::as_name(p$mapping$x) == "mpg")\nstopifnot(rlang::as_name(p$mapping$y) == "hp")',
     'hints':['ggplot(df, aes(x = mpg, y = hp)) + geom_point() is the standard skeleton.'],
     'why':'<code>ggplot(df, aes(x = mpg, y = hp)) + geom_point()</code>. The aesthetic mapping declares the columns; geom_point adds the visible layer.'},
    {'id':'gg_code_color_by_factor', 'type':'code', 'diff':1, 'topic':'aesthetics',
     'prompt':'Write <code>color_by_cyl(df)</code> that returns a ggplot scatter of <code>mpg</code> vs <code>hp</code> with points colored by <code>cyl</code> treated as a factor (so the colors are discrete).',
     'fnName':'color_by_cyl',
     'starter':'library(ggplot2)\n\ncolor_by_cyl <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- color_by_cyl(mtcars)\nstopifnot(inherits(p, "ggplot"))\nstopifnot("colour" %in% names(p$mapping))\nbuilt <- ggplot_build(p)\nstopifnot(length(unique(built$data[[1]]$colour)) >= 3)',
     'hints':['Use aes(color = factor(cyl)) inside ggplot() or geom_point().','factor(cyl) tells ggplot to treat cyl as categorical, giving discrete buckets.'],
     'why':'<code>ggplot(df, aes(x = mpg, y = hp, color = factor(cyl))) + geom_point()</code>. Without factor(), cyl is numeric and you get a continuous blue gradient instead of three distinct colors.'},

    # Medium code (2)
    {'id':'gg_code_facet_wrap', 'type':'code', 'diff':2, 'topic':'facets',
     'prompt':'Write <code>scatter_per_species(df)</code> that scatters <code>Sepal.Length</code> (x) vs <code>Petal.Length</code> (y) and creates one panel per <code>Species</code> using <code>facet_wrap()</code>.',
     'fnName':'scatter_per_species',
     'starter':'library(ggplot2)\n\nscatter_per_species <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- scatter_per_species(iris)\nstopifnot(inherits(p, "ggplot"))\nstopifnot(inherits(p$facet, "FacetWrap"))\nstopifnot("GeomPoint" %in% sapply(p$layers, function(l) class(l$geom)[1]))',
     'hints':['facet_wrap(~ Species) creates one panel per Species level.','vars(Species) is the modern alternative to the formula form.'],
     'why':'<code>ggplot(df, aes(Sepal.Length, Petal.Length)) + geom_point() + facet_wrap(~ Species)</code>. Three Species levels produce three panels. Use facet_grid() when you want a strict row-by-col layout.'},
    {'id':'gg_code_lm_overlay', 'type':'code', 'diff':2, 'topic':'stats',
     'prompt':'Write <code>scatter_with_lm(df)</code> that produces a scatterplot of <code>mpg</code> (x) vs <code>hp</code> (y) with a linear-regression overlay (and its confidence ribbon).',
     'fnName':'scatter_with_lm',
     'starter':'library(ggplot2)\n\nscatter_with_lm <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- scatter_with_lm(mtcars)\nstopifnot(inherits(p, "ggplot"))\ngeoms <- sapply(p$layers, function(l) class(l$geom)[1])\nstopifnot("GeomPoint" %in% geoms)\nstopifnot("GeomSmooth" %in% geoms)\nsmooth_layer <- p$layers[[which(geoms == "GeomSmooth")[1]]]\nstopifnot(smooth_layer$stat_params$method == "lm")',
     'hints':['geom_smooth(method = "lm") overlays a regression with default confidence interval.','Stack: ggplot(...) + geom_point() + geom_smooth(method = "lm").'],
     'why':'<code>ggplot(df, aes(mpg, hp)) + geom_point() + geom_smooth(method = "lm")</code>. method = "lm" forces a linear fit; the default would be loess at this sample size.'},

    # Hard code (2)
    {'id':'gg_code_themed_col', 'type':'code', 'diff':3, 'topic':'themes',
     'prompt':'Write <code>themed_bar(df)</code> taking a data frame with columns <code>category</code> and <code>value</code>. Draw a bar chart with <code>category</code> on x and <code>value</code> on y using <code>geom_col()</code> (NOT geom_bar), apply <code>theme_minimal()</code>, and remove the legend.',
     'fnName':'themed_bar',
     'starter':'library(ggplot2)\n\nthemed_bar <- function(df) {\n  # Your code here\n  \n}',
     'tests':'df <- data.frame(category = c("A","B","C"), value = c(3, 1, 2))\np <- themed_bar(df)\nstopifnot(inherits(p, "ggplot"))\ngeoms <- sapply(p$layers, function(l) class(l$geom)[1])\nstopifnot("GeomCol" %in% geoms)\nlp <- p$theme$legend.position\nstopifnot(!is.null(lp) && identical(lp, "none"))',
     'hints':['geom_col() takes y as the bar height directly. geom_bar() defaults to stat = "count".','theme_minimal() + theme(legend.position = "none") composes: the second call overrides legend handling.'],
     'why':'<code>ggplot(df, aes(category, value)) + geom_col() + theme_minimal() + theme(legend.position = "none")</code>. geom_col() is right for pre-aggregated values; layering theme() after theme_minimal() lets you tweak specific elements without losing the base look.'},
    {'id':'gg_code_logy_color', 'type':'code', 'diff':3, 'topic':'scales',
     'prompt':'Write <code>logy_plot(df)</code> that returns a scatterplot of <code>mpg</code> (x) vs <code>hp</code> (y) with the y-axis on a base-10 log scale (use <code>scale_y_log10()</code>) and points colored by <code>factor(cyl)</code>.',
     'fnName':'logy_plot',
     'starter':'library(ggplot2)\n\nlogy_plot <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- logy_plot(mtcars)\nstopifnot(inherits(p, "ggplot"))\ntr_names <- sapply(p$scales$scales, function(s) if (!is.null(s$trans)) s$trans$name else NA_character_)\nstopifnot(any(tr_names == "log-10", na.rm = TRUE))\nstopifnot("colour" %in% names(p$mapping))',
     'hints':['scale_y_log10() transforms the y axis without mutating the data values.','aes(color = factor(cyl)) gives discrete color buckets, not a gradient.'],
     'why':'<code>ggplot(df, aes(mpg, hp, color = factor(cyl))) + geom_point() + scale_y_log10()</code>. The transform changes axis tick spacing but the data values stay untouched, so geom_smooth and stat helpers still see the raw scale.'},
]


# ---------------------------------------------------------------------------
# QUIZ 3: Hypothesis Testing
# ---------------------------------------------------------------------------
HYPOTHESIS_BANK = [
    # Easy MCQ (4)
    {'id':'ht_null', 'type':'mcq', 'diff':1, 'topic':'hypotheses',
     'q':'The null hypothesis (H0) in a two-sample t-test typically states:',
     'opts':[
        {'t':'The two population means are different'},
        {'t':'The two population means are equal','correct':True},
        {'t':'The samples are normally distributed'},
        {'t':'The sample sizes are equal'},
     ],
     'hints':['The null is the "no effect" hypothesis we try to reject.','For a difference of means, the natural null is "the difference is 0".'],
     'why':'H0 asserts no effect: in a two-sample t-test the population means are equal. We compute the probability of seeing data this extreme assuming H0, and reject if that probability is small. Normality of the samples and equal n are assumptions, not the null.'},
    {'id':'ht_pvalue', 'type':'mcq', 'diff':1, 'topic':'p-values',
     'q':'A p-value of 0.03 means:',
     'opts':[
        {'t':'There is a 3% chance H0 is true'},
        {'t':'P(data at least this extreme | H0 true) = 0.03','correct':True},
        {'t':'There is a 97% chance the alternative is true'},
        {'t':'The effect size is 3%'},
     ],
     'hints':['p-values condition on H0 being true, not the other way around.','P(H0 | data) is a Bayesian quantity and needs a prior.'],
     'why':'A p-value is P(observing data at least this extreme | H0 is true). It is NOT P(H0 true | data) and NOT 1 minus the posterior probability of the alternative. Confusing these directions is the most common p-value misinterpretation.'},
    {'id':'ht_t_test', 'type':'mcq', 'diff':1, 'topic':'tests',
     'q':'Which R call compares the means of two independent numeric samples?',
     'opts':[{'t':'<code>t.test(x, y)</code>','correct':True},{'t':'<code>chisq.test(x, y)</code>'},{'t':'<code>cor.test(x, y)</code>'},{'t':'<code>ks.test(x, y)</code>'}],
     'hints':['One test compares means, one tests independence of categorical variables, one tests correlation, one compares distributions.'],
     'why':'<code>t.test(x, y)</code> performs Welch\'s two-sample t-test by default (no equal-variance assumption). <code>chisq.test()</code> handles contingency tables. <code>cor.test()</code> tests if a correlation is zero. <code>ks.test()</code> compares full distributions.'},
    {'id':'ht_alpha', 'type':'mcq', 'diff':1, 'topic':'errors',
     'q':'The significance level alpha is:',
     'opts':[
        {'t':'The probability of correctly rejecting H0 (power)'},
        {'t':'The probability of rejecting H0 when it is actually true (Type I error rate)','correct':True},
        {'t':'The probability of accepting H0 when it is false'},
        {'t':'The probability that H0 is true given the data'},
     ],
     'hints':['alpha is the rate of false-positives you are willing to tolerate.','Type I = false reject. Type II = false accept.'],
     'why':'alpha is the pre-set Type I error rate, almost always 0.05. If p &lt; alpha, reject H0. It is NOT P(H0 true), and it is NOT the false-negative rate (that is beta, which equals 1 minus power).'},

    # Medium MCQ (4)
    {'id':'ht_paired', 'type':'mcq', 'diff':2, 'topic':'tests',
     'q':'When is a paired t-test more appropriate than a two-sample t-test?',
     'opts':[
        {'t':'When the two groups have very different variances'},
        {'t':'When each observation in one group is naturally paired with one in the other (same subjects, twins, before/after)','correct':True},
        {'t':'When sample sizes are unequal'},
        {'t':'When the data has outliers'},
     ],
     'hints':['Paired design: row i of x and row i of y refer to the same unit.','The paired test analyzes the within-pair differences.'],
     'why':'Paired t-test analyzes the within-pair differences (d_i = x_i - y_i) and tests H0: mean(d) = 0. It removes between-subject variability, making it strictly more powerful than the unpaired version when the pairing is real. Misuse: applying paired to independent groups overstates significance.'},
    {'id':'ht_chisq', 'type':'mcq', 'diff':2, 'topic':'tests',
     'q':'<code>chisq.test()</code> on a 2x2 contingency table tests:',
     'opts':[
        {'t':'Whether the row means are equal'},
        {'t':'Whether the row and column variables are independent','correct':True},
        {'t':'Whether the row counts are normally distributed'},
        {'t':'Whether the marginal totals are equal'},
     ],
     'hints':['Chi-square compares observed counts to expected-under-independence counts.','It is a test about joint vs marginal probabilities, not about means.'],
     'why':'Chi-square test of independence: H0 says P(row, col) = P(row) * P(col). It compares observed counts to expected counts under independence: sum((O - E)^2 / E). For 2x2 tables with small expected counts, prefer fisher.test() which is exact.'},
    {'id':'ht_power', 'type':'mcq', 'diff':2, 'topic':'power',
     'q':'Statistical power is:',
     'opts':[
        {'t':'P(reject H0 | H0 true) - the false-positive rate'},
        {'t':'P(reject H0 | H1 true) - the true-positive rate','correct':True},
        {'t':'1 minus the p-value'},
        {'t':'The minimum effect size you can detect'},
     ],
     'hints':['Power is what fraction of the time the test detects an effect that actually exists.','Power = 1 - beta, where beta is Type II error.'],
     'why':'Power = 1 - beta = P(reject H0 | H1 true). It depends on sample size, effect size, alpha, and the test\'s assumptions. Underpowered studies have a high false-negative rate AND inflated effect-size estimates when they do reject (winner\'s curse).'},
    {'id':'ht_nonparametric', 'type':'mcq', 'diff':2, 'topic':'parametric vs nonparametric',
     'q':'The Wilcoxon rank-sum test (Mann-Whitney U) is preferred over a two-sample t-test when:',
     'opts':[
        {'t':'Sample sizes are very large'},
        {'t':'The data is ordinal or strongly non-normal and you can\'t rely on the CLT','correct':True},
        {'t':'You want to test a proportion'},
        {'t':'The variances are unequal'},
     ],
     'hints':['Rank-based tests don\'t assume a distribution shape.','Welch\'s t-test handles unequal variances; non-parametric tests handle non-normality.'],
     'why':'<code>wilcox.test()</code> works on ranks, so it doesn\'t assume normality and is robust to outliers and heavy tails. With large n the t-test is fine via CLT; with small, skewed n the Wilcoxon test is the safer choice. For unequal variance use Welch (t.test default), not Wilcoxon.'},

    # Hard MCQ (3)
    {'id':'ht_multiple', 'type':'mcq', 'diff':3, 'topic':'multiple testing',
     'q':'You run 20 independent t-tests at alpha = 0.05. If H0 is true for ALL of them, what is the probability of getting AT LEAST one significant result?',
     'opts':[
        {'t':'0.05'},
        {'t':'0.64','correct':True},
        {'t':'1.00'},
        {'t':'0.20'},
     ],
     'hints':['Each test independently rejects H0 with probability 0.05 even when H0 is true.','P(at least one rejection) = 1 - P(none reject) = 1 - (1 - 0.05)^20.'],
     'why':'1 - 0.95^20 = 1 - 0.358 = 0.642. With 20 independent null tests at alpha = 0.05, you almost certainly get a false-positive. The "expected number" is 1 (20 * 0.05), but the probability of at least one is 64%. This is why family-wise error rate corrections (Bonferroni, Holm) exist.'},
    {'id':'ht_bh', 'type':'mcq', 'diff':3, 'topic':'multiple testing',
     'q':'How does Benjamini-Hochberg (BH) differ from Bonferroni?',
     'opts':[
        {'t':'BH is identical to Bonferroni'},
        {'t':'BH controls the false discovery rate (expected proportion of false positives among rejections), Bonferroni controls family-wise error rate (any false positive)','correct':True},
        {'t':'BH uses a smaller alpha than Bonferroni'},
        {'t':'BH requires the tests to be dependent'},
     ],
     'hints':['Bonferroni: prob of ANY false positive across all tests.','BH: expected fraction of rejections that are false positives.'],
     'why':'Bonferroni controls FWER = P(any false positive) at alpha by comparing each p to alpha/m - very conservative. BH controls FDR = E[V/R] (false rejections over total rejections) by a step-up procedure on sorted p-values, with much more power when m is large. Use BH for screening (genomics, A/B test dashboards) and Bonferroni when one false positive is unacceptable.'},
    {'id':'ht_welch', 'type':'mcq', 'diff':3, 'topic':'tests',
     'q':'Why does R\'s <code>t.test()</code> default to Welch\'s t-test instead of the pooled (classical) Student t-test?',
     'opts':[
        {'t':'It runs faster'},
        {'t':'It does NOT require equal variances and matches the pooled test almost exactly when variances ARE equal','correct':True},
        {'t':'It corrects for multiple comparisons automatically'},
        {'t':'It handles missing data better'},
     ],
     'hints':['The pooled test assumes equal variances; the Welch test adjusts degrees of freedom for unequal variances.','When variances are equal, Welch and pooled give nearly identical results.'],
     'why':'Welch uses the Satterthwaite approximation for degrees of freedom and pools nothing. It has nominal Type I error under unequal variances; the pooled test inflates Type I error when variances differ and group sizes are unequal. Since Welch loses essentially nothing when variances ARE equal, R picks it as the safe default. Override with <code>var.equal = TRUE</code> if you really want pooled.'},

    # Easy code (2)
    {'id':'ht_code_ttest', 'type':'code', 'diff':1, 'topic':'tests',
     'prompt':'Write a function <code>welch_pvalue(x, y)</code> that runs a two-sample Welch t-test on numeric vectors <code>x</code> and <code>y</code> and returns ONLY the p-value as a single numeric.',
     'fnName':'welch_pvalue',
     'starter':'welch_pvalue <- function(x, y) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\na <- rnorm(50, mean = 10)\nb <- rnorm(50, mean = 11)\np <- welch_pvalue(a, b)\nstopifnot(is.numeric(p))\nstopifnot(length(p) == 1)\nstopifnot(p >= 0 && p <= 1)\nstopifnot(abs(p - t.test(a, b)$p.value) < 1e-12)\np2 <- welch_pvalue(rnorm(30), rnorm(30))\nstopifnot(p2 >= 0 && p2 <= 1)',
     'hints':['t.test(x, y) returns an htest object with a $p.value field.','The default is Welch (var.equal = FALSE).'],
     'why':'<code>t.test(x, y)$p.value</code>. The htest object from t.test() carries the p-value, statistic, conf.int and more. Extract by name; no need to print and parse.'},
    {'id':'ht_code_paired', 'type':'code', 'diff':1, 'topic':'tests',
     'prompt':'Write <code>paired_pvalue(before, after)</code> that runs a paired t-test on the two vectors and returns the p-value as a single numeric.',
     'fnName':'paired_pvalue',
     'starter':'paired_pvalue <- function(before, after) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nb <- rnorm(20, 5)\na <- b + rnorm(20, 0.3, 0.5)\np <- paired_pvalue(b, a)\nstopifnot(is.numeric(p))\nstopifnot(length(p) == 1)\nstopifnot(abs(p - t.test(b, a, paired = TRUE)$p.value) < 1e-12)',
     'hints':['Pass paired = TRUE to t.test().','The order of arguments controls the sign of the difference but not the p-value.'],
     'why':'<code>t.test(before, after, paired = TRUE)$p.value</code>. The paired t-test is equivalent to a one-sample t-test on the differences (before - after); it removes between-subject variability and is more powerful when the pairing is genuine.'},

    # Medium code (2)
    {'id':'ht_code_chisq', 'type':'code', 'diff':2, 'topic':'tests',
     'prompt':'Write <code>independence_test(tbl)</code> that runs a chi-square test of independence on a contingency table (a matrix) and returns a named list with elements <code>p_value</code> (the p-value) and <code>statistic</code> (the chi-square statistic).',
     'fnName':'independence_test',
     'starter':'independence_test <- function(tbl) {\n  # Your code here\n  \n}',
     'tests':'tbl <- matrix(c(30, 10, 15, 25), nrow = 2)\nresult <- independence_test(tbl)\nstopifnot(is.list(result))\nstopifnot(all(c("p_value", "statistic") %in% names(result)))\nstopifnot(is.numeric(result$p_value))\nstopifnot(is.numeric(result$statistic))\nref <- chisq.test(tbl)\nstopifnot(abs(result$p_value - ref$p.value) < 1e-9)\nstopifnot(abs(result$statistic - ref$statistic) < 1e-9)\n# Independence should give a large p\nset.seed(1)\ntbl2 <- matrix(c(50, 50, 50, 50), nrow = 2)\nstopifnot(independence_test(tbl2)$p_value > 0.5)',
     'hints':['chisq.test(tbl) returns an htest object with $p.value and $statistic.','Wrap the two values in a named list with the requested keys.'],
     'why':'<code>r &lt;- chisq.test(tbl); list(p_value = r$p.value, statistic = unname(r$statistic))</code>. The htest object names the statistic "X-squared"; unname() optional but keeps the output tidy and decouples from R\'s naming.'},
    {'id':'ht_code_bonf', 'type':'code', 'diff':2, 'topic':'multiple testing',
     'prompt':'Write <code>bonferroni_adjust(pvalues)</code> that takes a numeric vector of raw p-values and returns the Bonferroni-adjusted p-values: each p multiplied by the number of tests, capped at 1. Do NOT use p.adjust().',
     'fnName':'bonferroni_adjust',
     'starter':'bonferroni_adjust <- function(pvalues) {\n  # Your code here\n  \n}',
     'tests':'r <- bonferroni_adjust(c(0.01, 0.04, 0.2, 0.6))\nstopifnot(length(r) == 4)\nstopifnot(abs(r[1] - 0.04) < 1e-9)\nstopifnot(abs(r[2] - 0.16) < 1e-9)\nstopifnot(abs(r[3] - 0.8) < 1e-9)\nstopifnot(abs(r[4] - 1) < 1e-9)\nstopifnot(all(r >= 0 & r <= 1))\nr2 <- bonferroni_adjust(c(0.5))\nstopifnot(abs(r2 - 0.5) < 1e-9)\n# Matches p.adjust\nset.seed(1)\nps <- runif(10)\nstopifnot(all(abs(bonferroni_adjust(ps) - p.adjust(ps, "bonferroni")) < 1e-9))',
     'hints':['Multiply by length(pvalues), then cap at 1.','pmin (parallel min) does element-wise minimum; min() collapses to a scalar.'],
     'why':'<code>pmin(pvalues * length(pvalues), 1)</code>. Vectorized: each p times m, capped at 1. This is exactly what <code>p.adjust(pvalues, "bonferroni")</code> does.'},

    # Hard code (2)
    {'id':'ht_code_power_sim', 'type':'code', 'diff':3, 'topic':'power',
     'prompt':'Write <code>power_sim(n, mean_diff, sd, n_sims, alpha)</code> that estimates the power of a two-sample Welch t-test by simulation. Each iteration: draw two samples of size <code>n</code>, one from <code>N(0, sd^2)</code> and one from <code>N(mean_diff, sd^2)</code>, run <code>t.test</code>, and count how often p &lt; alpha. Return the fraction of rejections as a single numeric in [0, 1].',
     'fnName':'power_sim',
     'starter':'power_sim <- function(n, mean_diff, sd, n_sims, alpha) {\n  # Your code here\n  \n}',
     'tests':'set.seed(42)\np <- power_sim(n = 30, mean_diff = 1, sd = 1, n_sims = 200, alpha = 0.05)\nstopifnot(is.numeric(p))\nstopifnot(length(p) == 1)\nstopifnot(p >= 0 && p <= 1)\n# At n=30, diff=1, sd=1, power should be very high\nstopifnot(p > 0.7)\nset.seed(42)\np_low <- power_sim(n = 10, mean_diff = 0.1, sd = 1, n_sims = 200, alpha = 0.05)\nstopifnot(p_low < 0.3)\n# Zero effect: rejection rate ~ alpha\nset.seed(42)\np_null <- power_sim(n = 30, mean_diff = 0, sd = 1, n_sims = 400, alpha = 0.05)\nstopifnot(p_null < 0.15)',
     'hints':['replicate(n_sims, expr) repeats expr n_sims times into a vector.','Inside: draw x and y, run t.test, return t.test(...)$p.value < alpha.','mean() of the logical vector gives the empirical power.'],
     'why':'<code>mean(replicate(n_sims, t.test(rnorm(n, 0, sd), rnorm(n, mean_diff, sd))$p.value &lt; alpha))</code>. Each replicate produces a TRUE/FALSE for rejection; mean of logicals is the proportion. Under H0 (mean_diff = 0) this estimates alpha; under H1 it estimates power.'},
    {'id':'ht_code_perm', 'type':'code', 'diff':3, 'topic':'parametric vs nonparametric',
     'prompt':'Write <code>perm_test_pvalue(x, y, n_perm)</code> that runs a two-sample permutation test for the difference in means and returns a two-sided p-value. For each permutation: pool x and y, shuffle, split back into groups of the original sizes, compute the absolute mean difference, and count how often the permutation statistic is &gt;= the observed |mean(x) - mean(y)|. p-value = that fraction.',
     'fnName':'perm_test_pvalue',
     'starter':'perm_test_pvalue <- function(x, y, n_perm) {\n  # Your code here\n  \n}',
     'tests':'set.seed(123)\nx <- rnorm(30, 0)\ny <- rnorm(30, 1)\np <- perm_test_pvalue(x, y, n_perm = 500)\nstopifnot(is.numeric(p))\nstopifnot(length(p) == 1)\nstopifnot(p >= 0 && p <= 1)\nstopifnot(p < 0.05)\nset.seed(123)\nx2 <- rnorm(30)\ny2 <- rnorm(30)\np_null <- perm_test_pvalue(x2, y2, n_perm = 500)\nstopifnot(p_null > 0.05)',
     'hints':['observed <- abs(mean(x) - mean(y)); pooled <- c(x, y); nx <- length(x).','In each replicate: s <- sample(pooled); abs(mean(s[1:nx]) - mean(s[-(1:nx)])).','p <- mean(perm_stats >= observed).'],
     'why':'Permutation test: under H0 (same distribution), the labels are exchangeable, so shuffled differences trace the null distribution. Fraction of permutation stats at least as extreme as observed is the p-value. Distribution-free and robust to non-normality.'},
]


# ---------------------------------------------------------------------------
# QUIZ 4: Linear Regression
# ---------------------------------------------------------------------------
REGRESSION_BANK = [
    # Easy MCQ (4)
    {'id':'lr_lm', 'type':'mcq', 'diff':1, 'topic':'fitting',
     'q':'Which function fits an ordinary least squares regression in base R?',
     'opts':[{'t':'<code>regression()</code>'},{'t':'<code>lm()</code>','correct':True},{'t':'<code>fit()</code>'},{'t':'<code>nls()</code>'}],
     'hints':['"lm" is short for "linear model".','nls is for non-linear least squares.'],
     'why':'<code>lm()</code> fits ordinary least squares. <code>glm()</code> generalizes to other distributions (binomial, Poisson, gamma). <code>nls()</code> fits non-linear models via Gauss-Newton. <code>regression()</code> and <code>fit()</code> do not exist in base R.'},
    {'id':'lr_formula', 'type':'mcq', 'diff':1, 'topic':'fitting',
     'q':'What does <code>lm(y ~ x1 + x2, data = df)</code> fit?',
     'opts':[
        {'t':'y as the product of x1 and x2'},
        {'t':'y as a linear additive function of x1 and x2 (no interaction)','correct':True},
        {'t':'Two separate simple regressions, one per predictor'},
        {'t':'A logistic regression on the binary x1 and x2'},
     ],
     'hints':['~ separates the response (left) from the predictors (right).','+ in a formula means "include both predictors as main effects".'],
     'why':'<code>y ~ x1 + x2</code> declares the model y = b0 + b1*x1 + b2*x2 + e. The + adds main effects only; for an interaction term use x1:x2 or the shorthand x1*x2 (which expands to x1 + x2 + x1:x2).'},
    {'id':'lr_intercept', 'type':'mcq', 'diff':1, 'topic':'interpretation',
     'q':'In <code>lm(mpg ~ hp, data = mtcars)</code>, the intercept estimates:',
     'opts':[
        {'t':'The expected mpg when hp = 0','correct':True},
        {'t':'The slope of the line'},
        {'t':'The R-squared'},
        {'t':'The mean of mpg'},
     ],
     'hints':['The intercept is the model\'s prediction when every predictor is 0.','Whether the intercept is meaningful depends on whether x = 0 is plausible.'],
     'why':'The intercept (b0) is the predicted y when every predictor equals 0. For mtcars, hp = 0 is well outside the data range, so the intercept is a mathematical extrapolation, not a physical car. Centering predictors makes the intercept the prediction at the mean.'},
    {'id':'lr_summary', 'type':'mcq', 'diff':1, 'topic':'output',
     'q':'Which call prints coefficients, standard errors, t-statistics, p-values, and R-squared for a fitted lm object <code>fit</code>?',
     'opts':[{'t':'<code>fit</code>'},{'t':'<code>summary(fit)</code>','correct':True},{'t':'<code>print(fit)</code>'},{'t':'<code>coef(fit)</code>'}],
     'hints':['Calling the fit object directly only shows the coefficient estimates.','summary() builds the inferential table.'],
     'why':'<code>summary(fit)</code> returns an "summary.lm" object with the coefficient table (estimate, SE, t, p), residual SE, R-squared, adjusted R-squared, and the F-statistic. Just printing the model shows only point estimates. <code>coef()</code> returns the named coefficient vector with no inference.'},

    # Medium MCQ (4)
    {'id':'lr_r2', 'type':'mcq', 'diff':2, 'topic':'fit',
     'q':'An R-squared of 0.85 in <code>lm(y ~ x)</code> means:',
     'opts':[
        {'t':'85% of predictions are within 1 SD of the truth'},
        {'t':'The model explains 85% of the variance in y','correct':True},
        {'t':'The slope is 0.85'},
        {'t':'cor(x, y) is 0.85'},
     ],
     'hints':['R-squared = 1 - SSE/SST.','For simple regression R-squared = cor(x, y)^2, not cor(x, y).'],
     'why':'R-squared is the fraction of variance in y explained by the model: 1 - SSE/SST. For simple regression it equals cor(x, y)^2 (so cor would be sqrt(0.85) ~ 0.92). R-squared says nothing about prediction accuracy or whether the model is correctly specified.'},
    {'id':'lr_residual', 'type':'mcq', 'diff':2, 'topic':'residuals',
     'q':'A residual in OLS is:',
     'opts':[
        {'t':'The slope estimate'},
        {'t':'observed y minus fitted y (y_i - yhat_i)','correct':True},
        {'t':'The standard error of a coefficient'},
        {'t':'A Cook\'s distance'},
     ],
     'hints':['Residuals are what the model leaves unexplained.','OLS minimizes the sum of squared residuals.'],
     'why':'Residual e_i = y_i - yhat_i. OLS picks coefficients to minimize sum(e_i^2). Residuals should plot as mean-zero noise vs fitted values; patterns indicate nonlinearity, heteroscedasticity, or omitted variables. Don\'t confuse residuals with errors (the unobservable true noise).'},
    {'id':'lr_multicollinear', 'type':'mcq', 'diff':2, 'topic':'diagnostics',
     'q':'High multicollinearity in a multiple regression:',
     'opts':[
        {'t':'Makes the response variable non-normal'},
        {'t':'Inflates the standard errors of correlated predictors, making individual coefficients unstable','correct':True},
        {'t':'Always biases the coefficient estimates'},
        {'t':'Makes the residuals heteroscedastic'},
     ],
     'hints':['OLS estimates remain unbiased, but variance balloons.','Diagnose with VIF: 1 / (1 - R_j^2) where R_j^2 comes from regressing predictor j on the others.'],
     'why':'Multicollinearity (highly correlated predictors) keeps OLS estimates unbiased but inflates their standard errors, so individual t-tests have low power and coefficient signs flip across samples. The overall fit (R-squared, F-test, predictions) is fine; only marginal interpretation suffers. Diagnose with VIF; mitigate with PCA, ridge, or dropping/combining predictors.'},
    {'id':'lr_interaction', 'type':'mcq', 'diff':2, 'topic':'formulas',
     'q':'In <code>lm(y ~ x1 * x2)</code>, what does the <code>*</code> mean?',
     'opts':[
        {'t':'Element-wise multiplication of x1 and x2 as a single predictor'},
        {'t':'x1 + x2 + x1:x2 (main effects and interaction)','correct':True},
        {'t':'Just the interaction x1:x2 (no main effects)'},
        {'t':'Standardize x1 and x2'},
     ],
     'hints':['* in a formula is the "crossing" operator.','Use : when you want ONLY the interaction term.'],
     'why':'<code>x1 * x2</code> expands to <code>x1 + x2 + x1:x2</code> - both main effects and the interaction. The honored convention is to keep main effects in the model whenever an interaction is included. <code>x1:x2</code> alone gives just the interaction; <code>I(x1 * x2)</code> would insert a literal product.'},

    # Hard MCQ (3)
    {'id':'lr_assumptions', 'type':'mcq', 'diff':3, 'topic':'assumptions',
     'q':'Which is NOT a classical assumption of OLS regression?',
     'opts':[
        {'t':'Linearity of the conditional mean E(y|X)'},
        {'t':'Errors are independent and have constant variance'},
        {'t':'Predictors must be normally distributed','correct':True},
        {'t':'Errors are approximately normal (for exact inference in small samples)'},
     ],
     'hints':['OLS conditions on X, so X can have any distribution.','Only the conditional error distribution matters.'],
     'why':'OLS assumes linearity, independent errors, homoscedasticity (constant error variance), and approximately normal errors for finite-sample inference (Gauss-Markov gives BLUE without normality, but CIs and p-values need it). The predictors\' marginal distribution is unrestricted - they can be skewed, binary, or categorical without violating OLS.'},
    {'id':'lr_glm_logistic', 'type':'mcq', 'diff':3, 'topic':'glm',
     'q':'Which R call fits a logistic regression for a 0/1 outcome y?',
     'opts':[
        {'t':'<code>lm(y ~ x, data = df)</code>'},
        {'t':'<code>glm(y ~ x, family = binomial, data = df)</code>','correct':True},
        {'t':'<code>glm(y ~ x, family = poisson, data = df)</code>'},
        {'t':'<code>glm(y ~ x, family = gaussian(link = "logit"), data = df)</code>'},
     ],
     'hints':['Binary response -> binomial family.','The default link for the binomial family is logit.'],
     'why':'<code>glm(y ~ x, family = binomial)</code> fits logistic regression - the binomial family uses the logit link by default. Use <code>family = poisson</code> for count data, and <code>family = Gamma(link = "log")</code> for skewed positive responses. Coefficients are on the log-odds scale; exponentiate to get odds ratios.'},
    {'id':'lr_lasso_ridge', 'type':'mcq', 'diff':3, 'topic':'regularization',
     'q':'How do ridge (L2) and lasso (L1) penalties differ in their effect on coefficients?',
     'opts':[
        {'t':'They are identical and just compute differently'},
        {'t':'Ridge shrinks all coefficients smoothly toward zero; lasso can drive some coefficients to exactly zero (feature selection)','correct':True},
        {'t':'Lasso shrinks smoothly; ridge zeroes coefficients out'},
        {'t':'Both always set the smallest coefficient to zero'},
     ],
     'hints':['L2 = sum of squared coefficients; L1 = sum of absolute coefficients.','The L1 constraint region has corners on the axes - those corners are why coefficients hit zero.'],
     'why':'Ridge adds lambda*sum(b^2) to the loss - a smooth quadratic penalty that shrinks coefficients but never to exactly zero. Lasso adds lambda*sum(|b|) - the diamond-shaped constraint has corners on the axes, so the optimum often lands on an axis (coefficient = 0). Use lasso when you want sparse, interpretable models; ridge when many small effects are real; elastic net (mix of both) when predictors are correlated.'},

    # Easy code (2)
    {'id':'lr_code_slope', 'type':'code', 'diff':1, 'topic':'fitting',
     'prompt':'Write <code>slope_of(df, x, y)</code> that fits <code>lm(y ~ x, data = df)</code> using the column names passed as strings <code>x</code> and <code>y</code>, and returns the slope coefficient (the coefficient on x) as an unnamed single numeric.',
     'fnName':'slope_of',
     'starter':'slope_of <- function(df, x, y) {\n  # Your code here\n  \n}',
     'tests':'r <- slope_of(mtcars, "hp", "mpg")\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(abs(r - coef(lm(mpg ~ hp, data = mtcars))[["hp"]]) < 1e-9)\nr2 <- slope_of(iris, "Sepal.Length", "Petal.Length")\nstopifnot(abs(r2 - coef(lm(Petal.Length ~ Sepal.Length, data = iris))[["Sepal.Length"]]) < 1e-9)',
     'hints':['Build the formula string and parse it: as.formula(paste(y, "~", x)).','coef(fit)[[x]] grabs the named coefficient.'],
     'why':'<code>unname(coef(lm(as.formula(paste(y, "~", x)), data = df))[x])</code>. Compose the formula from string column names with as.formula(); pulling the named coefficient with [[name]] (or [x] then unname) returns a clean scalar.'},
    {'id':'lr_code_predict', 'type':'code', 'diff':1, 'topic':'prediction',
     'prompt':'Write <code>predict_one(df, x_value)</code> that fits <code>mpg ~ hp</code> on data frame <code>df</code> and returns the predicted mpg for a single new <code>hp</code> value, as an unnamed single numeric.',
     'fnName':'predict_one',
     'starter':'predict_one <- function(df, x_value) {\n  # Your code here\n  \n}',
     'tests':'r <- predict_one(mtcars, 150)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nfit <- lm(mpg ~ hp, data = mtcars)\nexpected <- unname(predict(fit, data.frame(hp = 150)))\nstopifnot(abs(unname(r) - expected) < 1e-9)\nr2 <- predict_one(mtcars, 100)\nstopifnot(abs(unname(r2) - unname(predict(fit, data.frame(hp = 100)))) < 1e-9)',
     'hints':['Fit with lm(), then predict() with newdata = data.frame(hp = x_value).','newdata must have a column named exactly like the predictor.'],
     'why':'<code>unname(predict(lm(mpg ~ hp, data = df), newdata = data.frame(hp = x_value)))</code>. predict() requires newdata to be a data frame whose columns match the training predictor names; unname() strips the row label.'},

    # Medium code (2)
    {'id':'lr_code_multi', 'type':'code', 'diff':2, 'topic':'multivariate',
     'prompt':'Write <code>adj_r_squared(df)</code> that fits <code>mpg ~ hp + wt + cyl</code> on <code>df</code> and returns the ADJUSTED R-squared as a single numeric.',
     'fnName':'adj_r_squared',
     'starter':'adj_r_squared <- function(df) {\n  # Your code here\n  \n}',
     'tests':'r <- adj_r_squared(mtcars)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(r > 0 && r < 1)\nfit <- lm(mpg ~ hp + wt + cyl, data = mtcars)\nexpected <- summary(fit)$adj.r.squared\nstopifnot(abs(r - expected) < 1e-12)\n# Adjusted R-squared is always <= R-squared\nstopifnot(r <= summary(fit)$r.squared)',
     'hints':['summary(fit)$adj.r.squared is the field name (with a dot).','Plain R-squared is summary(fit)$r.squared.'],
     'why':'<code>summary(lm(mpg ~ hp + wt + cyl, data = df))$adj.r.squared</code>. The summary object stores both r.squared and adj.r.squared; adjusted penalizes for model size and can decrease when a useless predictor is added, making it a more honest comparison metric.'},
    {'id':'lr_code_residuals', 'type':'code', 'diff':2, 'topic':'residuals',
     'prompt':'Write <code>resid_rmse(df)</code> that fits <code>mpg ~ hp</code> on <code>df</code> and returns the root mean squared residual: <code>sqrt(mean(residuals^2))</code>, as a single numeric.',
     'fnName':'resid_rmse',
     'starter':'resid_rmse <- function(df) {\n  # Your code here\n  \n}',
     'tests':'r <- resid_rmse(mtcars)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(r > 0)\nfit <- lm(mpg ~ hp, data = mtcars)\nexpected <- sqrt(mean(residuals(fit)^2))\nstopifnot(abs(r - expected) < 1e-12)\n# RMSE should be a bit smaller than summary()$sigma (which divides by df not n)\nstopifnot(r < summary(fit)$sigma)',
     'hints':['residuals(fit) returns the residual vector.','RMSE = sqrt(mean(squared residuals)).'],
     'why':'<code>sqrt(mean(residuals(lm(mpg ~ hp, data = df))^2))</code>. This is the in-sample RMSE; summary(fit)$sigma is the residual standard error which divides by n-p instead of n, so summary()$sigma is slightly larger.'},

    # Hard code (2)
    {'id':'lr_code_logistic', 'type':'code', 'diff':3, 'topic':'glm',
     'prompt':'Write <code>fit_logistic(df, y_col, x_col)</code> that fits a logistic regression of <code>y_col</code> on <code>x_col</code> (column names as strings, y is 0/1) and returns the slope coefficient (the coefficient on x_col) as an unnamed single numeric.',
     'fnName':'fit_logistic',
     'starter':'fit_logistic <- function(df, y_col, x_col) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\ndf <- data.frame(x = rnorm(200), y = NA)\ndf$y <- rbinom(200, 1, plogis(0.5 + 1.5 * df$x))\nr <- fit_logistic(df, "y", "x")\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nfit <- glm(y ~ x, data = df, family = binomial)\nstopifnot(abs(r - coef(fit)[["x"]]) < 1e-9)\nstopifnot(r > 1.0 && r < 2.0)',
     'hints':['glm(formula, data, family = binomial) gives logistic regression.','as.formula(paste(y_col, "~", x_col)) builds the formula from strings.','Use [[x_col]] or unname(coef(fit)[x_col]) to extract a clean scalar.'],
     'why':'<code>unname(coef(glm(as.formula(paste(y_col, "~", x_col)), data = df, family = binomial))[x_col])</code>. The binomial family with default logit link gives logistic regression; the slope is the change in log-odds of y per unit increase in x_col.'},
    {'id':'lr_code_vif', 'type':'code', 'diff':3, 'topic':'diagnostics',
     'prompt':'Write <code>simple_vif(df, predictors)</code> where <code>predictors</code> is a character vector of column names in <code>df</code>. For each predictor p_i, regress p_i on the other predictors and return a NAMED numeric vector of VIFs (one per predictor): VIF_i = 1 / (1 - R-squared of that auxiliary regression). Do NOT use the car package.',
     'fnName':'simple_vif',
     'starter':'simple_vif <- function(df, predictors) {\n  # Your code here\n  \n}',
     'tests':'r <- simple_vif(mtcars, c("hp", "wt", "cyl"))\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 3)\nstopifnot(identical(sort(names(r)), c("cyl", "hp", "wt")))\nstopifnot(all(r >= 1))\nstopifnot(all(r < 20))\n# Self-collinearity sanity: regressing a predictor on itself plus garbage gives huge VIF\nset.seed(1)\ndf2 <- data.frame(a = rnorm(50))\ndf2$b <- df2$a + rnorm(50, 0, 0.01)\nr2 <- simple_vif(df2, c("a", "b"))\nstopifnot(all(r2 > 100))',
     'hints':['Loop (or sapply) over predictors.','For predictor p: rhs <- setdiff(predictors, p); fit <- lm(as.formula(paste(p, "~", paste(rhs, collapse = "+"))), data = df).','VIF = 1 / (1 - summary(fit)$r.squared); preserve names with sapply.'],
     'why':'For each predictor j, fit p_j ~ others and compute VIF_j = 1 / (1 - R_j^2). VIF = 1 means orthogonal predictors; VIF > 5 (or 10) flags worrying collinearity. <code>sapply(predictors, function(p) { rhs &lt;- setdiff(predictors, p); 1 / (1 - summary(lm(as.formula(paste(p, "~", paste(rhs, collapse = "+"))), data = df))$r.squared) })</code> preserves names automatically.'},
]


# ---------------------------------------------------------------------------
# QUIZ 5: Machine Learning
# ---------------------------------------------------------------------------
ML_BANK = [
    # Easy MCQ (4)
    {'id':'ml_supervised', 'type':'mcq', 'diff':1, 'topic':'taxonomy',
     'q':'Which is an example of SUPERVISED learning?',
     'opts':[
        {'t':'K-means clustering customer transactions'},
        {'t':'Predicting house prices from features with labeled training data','correct':True},
        {'t':'Principal component analysis on a feature matrix'},
        {'t':'Topic modeling on unlabeled documents'},
     ],
     'hints':['Supervised tasks have both X (features) and y (target labels).','PCA, k-means, and topic modeling find structure in X without y.'],
     'why':'Supervised learning learns X -> y from labeled examples - classification (discrete y) or regression (continuous y). PCA, k-means, and LDA topic modeling are unsupervised: they find structure in X without any target.'},
    {'id':'ml_train_test', 'type':'mcq', 'diff':1, 'topic':'workflow',
     'q':'Why do we hold out a test set?',
     'opts':[
        {'t':'To save memory during training'},
        {'t':'To get an unbiased estimate of generalization performance on unseen data','correct':True},
        {'t':'To balance the classes'},
        {'t':'To avoid using a validation set'},
     ],
     'hints':['Training error is optimistic because the model has already seen those points.','The test set must NOT be touched during model selection or tuning.'],
     'why':'Training error always undershoots generalization error because the model has been fit to those points. A held-out test set, NEVER seen during training or tuning, gives an unbiased estimate of how the model will perform on truly new data. Hyperparameter tuning should use a separate validation set (or CV), not the test set.'},
    {'id':'ml_overfit', 'type':'mcq', 'diff':1, 'topic':'overfitting',
     'q':'A model with 99% training accuracy but 62% test accuracy is most likely:',
     'opts':[
        {'t':'Underfit'},
        {'t':'Overfit','correct':True},
        {'t':'Just right'},
        {'t':'Suffering from a data loading bug'},
     ],
     'hints':['A large gap between training and test performance is the textbook symptom.','Memorizing noise is the failure mode.'],
     'why':'Classic overfitting: the model memorizes training-set noise, so training metrics are great while test metrics suffer. Cures: more data, regularization, simpler models, early stopping, better cross-validation. Underfit models have low training AND low test accuracy.'},
    {'id':'ml_classifier_metric', 'type':'mcq', 'diff':1, 'topic':'metrics',
     'q':'On imbalanced data (95% class A, 5% class B), why is plain accuracy a poor metric?',
     'opts':[
        {'t':'Accuracy is undefined for imbalanced data'},
        {'t':'A model that always predicts the majority class gets 95% accuracy while detecting zero positives','correct':True},
        {'t':'Accuracy only works for regression'},
        {'t':'Accuracy gives too much weight to the minority class'},
     ],
     'hints':['Imagine the dumbest constant-prediction baseline. What does its accuracy look like?','Imbalanced problems usually care most about the rare class.'],
     'why':'Predict-the-majority gets 95% accuracy with zero recall on class B. For imbalanced problems use precision, recall, F1, ROC AUC, PR AUC, or balanced accuracy. Choice depends on cost asymmetry: high cost of false negatives -> optimize recall; high cost of false positives -> optimize precision.'},

    # Medium MCQ (4)
    {'id':'ml_cv', 'type':'mcq', 'diff':2, 'topic':'validation',
     'q':'5-fold cross-validation works by:',
     'opts':[
        {'t':'Splitting data into 5 random parts and using only the first for training'},
        {'t':'Partitioning the data into 5 folds; for each fold, train on the other 4 and score on the held-out fold, then average the 5 scores','correct':True},
        {'t':'Bootstrapping 5 samples from the data and averaging metrics'},
        {'t':'Fitting 5 different model families in parallel'},
     ],
     'hints':['"k-fold" means every example serves as test exactly once.','Average the k scores to get a more stable estimate than a single split.'],
     'why':'5-fold CV partitions the rows into 5 folds. Each round: 4 folds are train, 1 is test. Rotate so every fold serves as the test exactly once, then average. Lower variance than a single train/test split. For class imbalance, use stratified CV. For time series, use forward-chaining CV; standard k-fold leaks future into past.'},
    {'id':'ml_rf', 'type':'mcq', 'diff':2, 'topic':'algorithms',
     'q':'What makes a Random Forest different from a single deep decision tree?',
     'opts':[
        {'t':'It uses neural network layers between splits'},
        {'t':'It averages many trees, each trained on a bootstrap of rows AND a random subset of features at each split, reducing variance','correct':True},
        {'t':'It is a linear model under the hood'},
        {'t':'It only works for regression problems'},
     ],
     'hints':['Bagging = bootstrap aggregation. RF adds feature randomness on top.','Single deep trees have low bias but high variance; the forest averages variance away.'],
     'why':'Random Forest = bagging + per-split feature subsampling. Each tree sees a different bootstrap of rows (~63% unique rows, 37% out-of-bag) AND at each split chooses among a random subset of mtry features. Averaging many de-correlated trees collapses variance while keeping bias low. The out-of-bag prediction gives a "free" CV-like estimate.'},
    {'id':'ml_regularization', 'type':'mcq', 'diff':2, 'topic':'regularization',
     'q':'In ridge regression, the L2 penalty:',
     'opts':[
        {'t':'Sets some coefficients to exactly zero'},
        {'t':'Shrinks all coefficients smoothly toward zero without setting any to exactly zero','correct':True},
        {'t':'Has no effect on coefficients - only on predictions'},
        {'t':'Inflates coefficients to fight underfitting'},
     ],
     'hints':['L2 = sum(b^2). The penalty is smooth and everywhere differentiable.','L1 (lasso) is the one that produces exact zeros.'],
     'why':'Ridge adds lambda * sum(b^2) to the loss - a smooth quadratic penalty whose gradient pulls coefficients toward zero without ever crossing it. Lasso (L1) adds lambda * sum(|b|) whose non-smooth corners produce exact zeros - useful for feature selection. Elastic net mixes both penalties and handles correlated predictors better than lasso alone.'},
    {'id':'ml_pca', 'type':'mcq', 'diff':2, 'topic':'unsupervised',
     'q':'PCA finds:',
     'opts':[
        {'t':'Clusters of similar observations'},
        {'t':'Orthogonal linear combinations of features ordered by the variance they capture','correct':True},
        {'t':'The optimal classifier boundary'},
        {'t':'A non-linear embedding of the data'},
     ],
     'hints':['"Principal components" are directions in feature space, ranked by variance.','PCA is linear and unsupervised - no y, no kernels.'],
     'why':'PCA computes orthogonal axes (eigenvectors of the centered covariance matrix) ordered by the variance they capture (eigenvalues). PC1 captures the most variance; PC2 is orthogonal and second-most; etc. Useful for visualization and decorrelation. For non-linear structure use t-SNE or UMAP; for supervised dimensionality reduction use LDA.'},

    # Hard MCQ (3)
    {'id':'ml_leakage', 'type':'mcq', 'diff':3, 'topic':'pitfalls',
     'q':'Which is a classic data-leakage scenario?',
     'opts':[
        {'t':'Using the same random seed every time'},
        {'t':'Computing feature scaling parameters (mean, SD) on the FULL dataset before splitting train/test','correct':True},
        {'t':'Holding out 20% of rows as a test set'},
        {'t':'Using cross-validation instead of a single train/test split'},
     ],
     'hints':['Anything that lets information from the test set influence the model is leakage.','Fit preprocessing on train only; APPLY to test.'],
     'why':'Computing preprocessing stats (mean, SD, quantile bins, target encoding, PCA) on the full dataset before splitting leaks test info into the training pipeline, so reported test performance is too optimistic. The fix: fit every preprocessing step on the training fold only, then apply (transform) to test/validation. Pipelines exist specifically to enforce this.'},
    {'id':'ml_roc_auc', 'type':'mcq', 'diff':3, 'topic':'metrics',
     'q':'A binary classifier has ROC AUC = 0.5. The most accurate interpretation is:',
     'opts':[
        {'t':'It is a perfect classifier'},
        {'t':'Its ranking of positives vs negatives is no better than random','correct':True},
        {'t':'It always predicts the majority class'},
        {'t':'It is perfectly inverted (try flipping predictions)'},
     ],
     'hints':['AUC equals P(random positive ranked above random negative).','AUC < 0.5 is the "inverted" case.'],
     'why':'ROC AUC = P(score(positive) > score(negative)) for a random pos/neg pair. AUC = 0.5 means the model ranks no better than a coin flip; AUC = 1 is perfect ranking; AUC < 0.5 means scores are anti-correlated with the label (flipping predictions recovers a useful classifier). AUC is threshold-independent, so "always predict majority" gives AUC = 0.5 (no rank info), NOT 0.95.'},
    {'id':'ml_xgboost', 'type':'mcq', 'diff':3, 'topic':'algorithms',
     'q':'XGBoost is fundamentally:',
     'opts':[
        {'t':'A neural network architecture'},
        {'t':'A gradient-boosted ensemble of decision trees built sequentially to correct prior errors','correct':True},
        {'t':'A bagging method like random forest'},
        {'t':'A clustering algorithm'},
     ],
     'hints':['"Gradient Boosting" = each new tree fits the gradient of the loss with respect to the current ensemble.','Boosting is sequential; bagging is parallel.'],
     'why':'XGBoost builds trees sequentially: each new tree fits the negative gradient of the loss with respect to the running ensemble, effectively predicting the residuals. It adds L1/L2 regularization on leaf scores, handles missing values natively (default-direction splits), and parallelizes split-finding within a tree. It is the workhorse of tabular ML, often beating deep learning on structured data.'},

    # Easy code (2)
    {'id':'ml_code_split', 'type':'code', 'diff':1, 'topic':'workflow',
     'prompt':'Write <code>train_test_split(df, prop)</code> that randomly partitions a data frame into a named list <code>list(train = ..., test = ...)</code>. <code>prop</code> is the training proportion (e.g., 0.8). Use <code>sample()</code> on row indices.',
     'fnName':'train_test_split',
     'starter':'train_test_split <- function(df, prop) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nr <- train_test_split(mtcars, 0.8)\nstopifnot(is.list(r))\nstopifnot(all(c("train", "test") %in% names(r)))\nstopifnot(is.data.frame(r$train))\nstopifnot(is.data.frame(r$test))\nstopifnot(nrow(r$train) + nrow(r$test) == nrow(mtcars))\nstopifnot(nrow(r$train) == round(nrow(mtcars) * 0.8))\n# Different prop\nset.seed(1)\nr2 <- train_test_split(mtcars, 0.5)\nstopifnot(nrow(r2$train) == round(nrow(mtcars) * 0.5))\n# Train + test row indices should be disjoint and cover all rows\nstopifnot(sort(c(rownames(r$train), rownames(r$test))) == sort(rownames(mtcars)))',
     'hints':['idx <- sample(seq_len(nrow(df)), size = round(nrow(df) * prop)).','df[idx, ] is train; df[-idx, ] is test.'],
     'why':'<code>idx &lt;- sample(seq_len(nrow(df)), round(nrow(df) * prop)); list(train = df[idx, ], test = df[-idx, ])</code>. Negative indexing drops the chosen rows for the test set, guaranteeing disjoint partitions.'},
    {'id':'ml_code_accuracy', 'type':'code', 'diff':1, 'topic':'metrics',
     'prompt':'Write <code>accuracy(predicted, actual)</code> that returns the classification accuracy (fraction of predictions matching the actual label) as a numeric in [0, 1]. Both inputs are vectors of equal length and comparable types.',
     'fnName':'accuracy',
     'starter':'accuracy <- function(predicted, actual) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(accuracy(c(1,1,0,0), c(1,1,0,0)) == 1)\nstopifnot(accuracy(c(1,1,1,1), c(1,1,0,0)) == 0.5)\nstopifnot(accuracy(c(0,0,0,0), c(1,1,1,1)) == 0)\nstopifnot(accuracy(c("a","b","b"), c("a","a","b")) == 2/3)\nstopifnot(accuracy(c(TRUE, FALSE), c(TRUE, FALSE)) == 1)',
     'hints':['predicted == actual gives a logical vector.','mean() of a logical vector coerces TRUE/FALSE to 1/0.'],
     'why':'<code>mean(predicted == actual)</code>. R coerces logicals to numerics inside mean(), so the result is the fraction of correct predictions. Works for any types where == is defined.'},

    # Medium code (2)
    {'id':'ml_code_kfold', 'type':'code', 'diff':2, 'topic':'validation',
     'prompt':'Write <code>kfold_indices(n, k)</code> that randomly partitions the indices 1..<code>n</code> into <code>k</code> roughly-equal folds. Return a list of length <code>k</code> where element <code>i</code> is the integer indices in fold <code>i</code>. Each original index must appear in exactly one fold.',
     'fnName':'kfold_indices',
     'starter':'kfold_indices <- function(n, k) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nfolds <- kfold_indices(20, 5)\nstopifnot(is.list(folds))\nstopifnot(length(folds) == 5)\nstopifnot(all(sapply(folds, length) == 4))\nstopifnot(identical(sort(unlist(folds)), 1:20))\nset.seed(1)\nfolds2 <- kfold_indices(23, 5)\nstopifnot(sum(sapply(folds2, length)) == 23)\nstopifnot(all(sapply(folds2, length) %in% c(4, 5)))\nstopifnot(identical(sort(unlist(folds2)), 1:23))',
     'hints':['Shuffle 1:n with sample(), then split into k chunks of (roughly) equal size.','split(shuffled, cut(seq_along(shuffled), k, labels = FALSE)) is the idiom.'],
     'why':'<code>shuffled &lt;- sample(seq_len(n)); unname(split(shuffled, cut(seq_along(shuffled), k, labels = FALSE)))</code>. cut() bins the shuffled positions into k contiguous chunks; split() groups indices by chunk. Without sort, the chunks are auto-balanced to within 1 element.'},
    {'id':'ml_code_minmax', 'type':'code', 'diff':2, 'topic':'preprocessing',
     'prompt':'Write <code>minmax_scale(x)</code> that rescales a numeric vector to [0, 1] via <code>(x - min) / (max - min)</code>. Edge case: when all values are equal, return a vector of zeros of the same length.',
     'fnName':'minmax_scale',
     'starter':'minmax_scale <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(minmax_scale(c(0, 5, 10)), c(0, 0.5, 1)))\nstopifnot(all(minmax_scale(c(2, 2, 2)) == 0))\nstopifnot(length(minmax_scale(c(2, 2, 2))) == 3)\nstopifnot(min(minmax_scale(c(-3, 0, 7))) == 0)\nstopifnot(max(minmax_scale(c(-3, 0, 7))) == 1)\nstopifnot(abs(minmax_scale(c(1, 3))[1]) < 1e-12)\nstopifnot(abs(minmax_scale(c(1, 3))[2] - 1) < 1e-12)',
     'hints':['Compute the range max(x) - min(x); if it is 0, return rep(0, length(x)).','Otherwise return (x - min(x)) / range.'],
     'why':'<code>rng &lt;- max(x) - min(x); if (rng == 0) rep(0, length(x)) else (x - min(x)) / rng</code>. The zero-range guard avoids 0/0 = NaN, which silently breaks downstream models. Always fit min/max on TRAIN only - applying it to test using the test\'s own min/max is data leakage.'},

    # Hard code (2)
    {'id':'ml_code_kmeans', 'type':'code', 'diff':3, 'topic':'unsupervised',
     'prompt':'Write <code>kmeans_assignments(df, k)</code> that runs k-means clustering on the numeric columns of <code>df</code> (drop non-numerics first) with <code>k</code> clusters and <code>nstart = 10</code> for stability. Return a vector of cluster assignments (integers in 1..k, length nrow(df)).',
     'fnName':'kmeans_assignments',
     'starter':'kmeans_assignments <- function(df, k) {\n  # Your code here\n  \n}',
     'tests':'set.seed(42)\nr <- kmeans_assignments(iris, 3)\nstopifnot(is.numeric(r) || is.integer(r))\nstopifnot(length(r) == nrow(iris))\nstopifnot(all(r %in% 1:3))\nstopifnot(length(unique(r)) == 3)\n# Different k\nset.seed(42)\nr2 <- kmeans_assignments(iris, 2)\nstopifnot(length(unique(r2)) == 2)\n# All-numeric input also works\nset.seed(42)\nr3 <- kmeans_assignments(mtcars, 3)\nstopifnot(length(r3) == nrow(mtcars))',
     'hints':['Pick numeric columns: df[, sapply(df, is.numeric), drop = FALSE].','kmeans(numeric_df, centers = k, nstart = 10)$cluster returns the assignment vector.'],
     'why':'<code>kmeans(df[sapply(df, is.numeric)], centers = k, nstart = 10)$cluster</code>. nstart = 10 runs k-means 10 times with different random initial centers and keeps the assignment with the lowest within-cluster sum of squares. nstart = 1 is unstable - the algorithm gets stuck in local optima.'},
    {'id':'ml_code_logistic_pred', 'type':'code', 'diff':3, 'topic':'classification',
     'prompt':'Write <code>logistic_predict(train, test, formula)</code> that fits a logistic regression on <code>train</code> with <code>glm(formula, data = train, family = binomial)</code>, predicts probabilities on <code>test</code>, and returns a 0/1 integer vector using threshold 0.5.',
     'fnName':'logistic_predict',
     'starter':'logistic_predict <- function(train, test, formula) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\ntrain <- data.frame(x = rnorm(200), y = NA)\ntrain$y <- as.integer(train$x + rnorm(200, 0, 0.5) > 0)\ntest <- data.frame(x = rnorm(80), y = NA)\ntest$y <- as.integer(test$x + rnorm(80, 0, 0.5) > 0)\npreds <- logistic_predict(train, test, y ~ x)\nstopifnot(length(preds) == nrow(test))\nstopifnot(all(preds %in% c(0, 1)))\nstopifnot(mean(preds == test$y) > 0.6)\nstopifnot(is.numeric(preds) || is.integer(preds))',
     'hints':['fit <- glm(formula, data = train, family = binomial).','predict(fit, newdata = test, type = "response") gives probabilities in [0,1].','as.integer(probs > 0.5) thresholds to 0/1.'],
     'why':'<code>fit &lt;- glm(formula, data = train, family = binomial); as.integer(predict(fit, newdata = test, type = "response") &gt; 0.5)</code>. type = "response" returns probabilities; without it predict() returns the link-scale value (log-odds). Threshold 0.5 is the Bayes-optimal cutoff under equal misclassification cost.'},
]


# ---------------------------------------------------------------------------
# QUIZ 6: tidyr (tidyr-Exercises-in-R hub)
# ---------------------------------------------------------------------------
TIDYR_BANK = [
    # Easy MCQ
    {'id':'tr_tidy_def', 'type':'mcq', 'diff':1, 'topic':'tidy data',
     'q':'According to the tidy-data definition, each row should be:',
     'opts':[
        {'t':'A variable'},
        {'t':'An observation','correct':True},
        {'t':'A summary statistic'},
        {'t':'A category'},
     ],
     'hints':['Tidy data: each variable a column, each observation a row.'],
     'why':'Tidy data rules: (1) each variable forms a column, (2) each observation forms a row, (3) each type of observational unit forms a table. This shape is what dplyr/ggplot2 expect.'},
    {'id':'tr_pivot_longer', 'type':'mcq', 'diff':1, 'topic':'reshape',
     'q':'Which verb converts wide data into long format?',
     'opts':[{'t':'<code>pivot_wider()</code>'},{'t':'<code>pivot_longer()</code>','correct':True},{'t':'<code>spread()</code>'},{'t':'<code>gather()</code>'}],
     'hints':['"longer" = more rows, fewer columns. "wider" = fewer rows, more columns.'],
     'why':'<code>pivot_longer()</code> stacks selected columns into name/value pairs (long format). <code>gather()</code> is the deprecated tidyr 0.x ancestor.'},
    {'id':'tr_separate', 'type':'mcq', 'diff':1, 'topic':'columns',
     'q':'What does <code>separate(col, into = c("a", "b"), sep = "_")</code> do?',
     'opts':[
        {'t':'Splits one column into multiple by a delimiter','correct':True},
        {'t':'Drops the column'},
        {'t':'Computes a row-wise mean'},
        {'t':'Joins two columns'},
     ],
     'hints':['"Separate" splits, "unite" joins.'],
     'why':'separate() splits a single character column into multiple columns at the delimiter (or by regex/positions). The inverse is unite().'},
    {'id':'tr_drop_na', 'type':'mcq', 'diff':1, 'topic':'missing',
     'q':'<code>drop_na(col)</code> does what?',
     'opts':[
        {'t':'Replaces NAs in col with 0'},
        {'t':'Drops rows where col is NA','correct':True},
        {'t':'Drops the column col entirely'},
        {'t':'Lists which rows have NAs'},
     ],
     'hints':['drop_na = drop rows with NA in the named column(s).'],
     'why':'<code>drop_na(col)</code> removes rows where col is NA. <code>drop_na()</code> with no args drops rows where ANY column is NA.'},

    # Medium MCQ
    {'id':'tr_pivot_longer_args', 'type':'mcq', 'diff':2, 'topic':'reshape',
     'q':'In <code>pivot_longer(cols = -id, names_to = "key", values_to = "val")</code>, what does <code>cols = -id</code> mean?',
     'opts':[
        {'t':'Pivot only the id column'},
        {'t':'Pivot every column EXCEPT id','correct':True},
        {'t':'Pivot every column, including id'},
        {'t':'Drop the id column'},
     ],
     'hints':['The minus is a tidy-select negation: "all columns except this one."'],
     'why':'<code>cols</code> uses tidy-select syntax. <code>-id</code> means "all columns except id." So id is preserved as the identifier; everything else is stacked into key/val.'},
    {'id':'tr_pivot_wider', 'type':'mcq', 'diff':2, 'topic':'reshape',
     'q':'<code>pivot_wider(names_from = key, values_from = val)</code> turns:',
     'opts':[
        {'t':'A long table into a wide one, where unique values of key become column names','correct':True},
        {'t':'A wide table into a long one'},
        {'t':'A single column into multiple columns'},
        {'t':'A data frame into a list'},
     ],
     'hints':['names_from = which column becomes column names; values_from = which column fills the cells.'],
     'why':'pivot_wider spreads a long table to wide: unique key values become column names, val values fill the cells. The inverse of pivot_longer.'},
    {'id':'tr_unnest', 'type':'mcq', 'diff':2, 'topic':'nested',
     'q':'You have a tibble with a list-column. What does <code>unnest(col)</code> do?',
     'opts':[
        {'t':'Flattens the list-column so each element becomes its own row','correct':True},
        {'t':'Wraps each value in a list'},
        {'t':'Pivots the list-column'},
        {'t':'Drops the list-column'},
     ],
     'hints':['List-columns in tibbles can hold complex objects per row. unnest expands them.'],
     'why':'unnest() expands list-columns into long form. If each cell contained a vector of 3 elements, the row becomes 3 rows. The inverse is nest().'},
    {'id':'tr_complete', 'type':'mcq', 'diff':2, 'topic':'completing',
     'q':'<code>complete(year, group)</code> on a tibble does what?',
     'opts':[
        {'t':'Drops rows with NAs in year or group'},
        {'t':'Adds rows so every combination of year × group appears (filling new rows with NA)','correct':True},
        {'t':'Removes duplicate rows'},
        {'t':'Replaces NAs with the previous value'},
     ],
     'hints':['complete() ensures every combination of the named variables is present.'],
     'why':'complete() expands the data so every combination of the listed variables is present, filling new rows with NA (or values via <code>fill =</code>). Useful before time-series joins.'},

    # Hard MCQ
    {'id':'tr_pivot_multi', 'type':'mcq', 'diff':3, 'topic':'reshape',
     'q':'With wide columns like <code>income_2020</code>, <code>income_2021</code>, <code>expense_2020</code>, <code>expense_2021</code>, how do you pivot to long with TWO new columns (kind and year)?',
     'opts':[
        {'t':'Two separate pivot_longer() calls'},
        {'t':'<code>pivot_longer(cols = -id, names_to = c("kind", "year"), names_sep = "_")</code>','correct':True},
        {'t':'pivot_longer() then separate()'},
        {'t':'separate_rows() then pivot_longer()'},
     ],
     'hints':['names_to can take a vector when paired with names_sep or names_pattern.'],
     'why':'<code>names_to = c("kind", "year")</code> with <code>names_sep = "_"</code> tells pivot_longer to split each column name at "_" into two new ID columns in one step.'},
    {'id':'tr_separate_wider', 'type':'mcq', 'diff':3, 'topic':'columns',
     'q':'In tidyr 1.3+, <code>separate_wider_delim(col, delim = "_", names = c("a", "b"))</code> is the modern replacement for:',
     'opts':[
        {'t':'<code>unite()</code>'},
        {'t':'<code>separate()</code> (which is now superseded)','correct':True},
        {'t':'<code>pivot_longer()</code>'},
        {'t':'<code>complete()</code>'},
     ],
     'hints':['tidyr 1.3 introduced the separate_*_delim, _position, _regex family to replace separate().'],
     'why':'separate_wider_delim, _position, _regex are the new families. Old separate() still works but separate_wider_* gives clearer error messages and explicit handling of too-few/too-many pieces.'},
    {'id':'tr_nest', 'type':'mcq', 'diff':3, 'topic':'nested',
     'q':'<code>iris %>% group_by(Species) %>% nest()</code> produces:',
     'opts':[
        {'t':'A vector of length 3'},
        {'t':'A tibble with one row per Species and a "data" list-column containing each subset','correct':True},
        {'t':'A list of three tibbles'},
        {'t':'An error (nest doesn\'t work with group_by)'},
     ],
     'hints':['nest collapses each group into a row, with the group\'s data tucked into a list-column.'],
     'why':'nest() collapses grouped rows into a single row per group, with the group\'s data stored as a tibble inside a list-column. Pair with mutate() + map() to apply per-group operations functionally.'},

    # Easy code
    {'id':'tr_code_long', 'type':'code', 'diff':1, 'topic':'reshape',
     'prompt':'Write <code>to_long(df)</code> that takes a data frame with columns <code>id, q1, q2, q3</code> and returns a long tibble with columns <code>id, question, score</code> using <code>pivot_longer()</code>.',
     'fnName':'to_long',
     'starter':'library(tidyr)\n\nto_long <- function(df) {\n  # Your code here\n  \n}',
     'tests':'df <- data.frame(id = 1:2, q1 = c(5, 3), q2 = c(4, 2), q3 = c(5, 5))\nr <- to_long(df)\nstopifnot(nrow(r) == 6)\nstopifnot(all(c("id", "question", "score") %in% names(r)))\nstopifnot(identical(sort(unique(as.character(r$question))), c("q1", "q2", "q3")))',
     'hints':['pivot_longer(cols = -id, names_to = "question", values_to = "score").'],
     'why':'<code>pivot_longer(df, cols = -id, names_to = "question", values_to = "score")</code>. Excluding id keeps it as the row identifier; q1/q2/q3 stack into name/value pairs.'},
    {'id':'tr_code_wide', 'type':'code', 'diff':1, 'topic':'reshape',
     'prompt':'Write <code>to_wide(df)</code> that takes a long tibble with columns <code>id, key, value</code> and returns a wide tibble with one row per id and one column per unique key.',
     'fnName':'to_wide',
     'starter':'library(tidyr)\n\nto_wide <- function(df) {\n  # Your code here\n  \n}',
     'tests':'df <- data.frame(id = c(1,1,2,2), key = c("a","b","a","b"), value = c(10, 20, 30, 40))\nr <- to_wide(df)\nstopifnot(nrow(r) == 2)\nstopifnot(all(c("id", "a", "b") %in% names(r)))\nstopifnot(r$a[r$id == 1] == 10)\nstopifnot(r$b[r$id == 2] == 40)',
     'hints':['pivot_wider(names_from = key, values_from = value).'],
     'why':'<code>pivot_wider(df, names_from = key, values_from = value)</code>. Each unique key value becomes a new column.'},

    # Medium code
    {'id':'tr_code_separate', 'type':'code', 'diff':2, 'topic':'columns',
     'prompt':'Write <code>split_full_name(df)</code> that takes a tibble with column <code>full_name</code> (a string like "Alex Morgan") and returns the same tibble with two new columns <code>first</code> and <code>last</code>, derived by splitting on the space. Drop the original <code>full_name</code>.',
     'fnName':'split_full_name',
     'starter':'library(tidyr)\n\nsplit_full_name <- function(df) {\n  # Your code here\n  \n}',
     'tests':'df <- data.frame(full_name = c("Alex Morgan", "Bri Cole"), age = c(30, 25))\nr <- split_full_name(df)\nstopifnot(all(c("first", "last") %in% names(r)))\nstopifnot(!"full_name" %in% names(r))\nstopifnot(r$first[1] == "Alex")\nstopifnot(r$last[2] == "Cole")',
     'hints':['separate(df, full_name, into = c("first", "last"), sep = " ") or separate_wider_delim().','By default separate() drops the original column.'],
     'why':'<code>separate(df, full_name, into = c("first", "last"), sep = " ")</code>. The default behavior drops the source column; pass remove = FALSE to keep it.'},
    {'id':'tr_code_dropna', 'type':'code', 'diff':2, 'topic':'missing',
     'prompt':'Write <code>complete_responses(df)</code> that takes a tibble with possibly-NA values across multiple columns and returns only the rows where NONE of the columns contain NA.',
     'fnName':'complete_responses',
     'starter':'library(tidyr)\n\ncomplete_responses <- function(df) {\n  # Your code here\n  \n}',
     'tests':'df <- data.frame(a = c(1, NA, 3), b = c("x", "y", NA), c = c(10, 20, 30))\nr <- complete_responses(df)\nstopifnot(nrow(r) == 1)\nstopifnot(r$a == 1)\nstopifnot(r$b == "x")',
     'hints':['drop_na() with no arguments drops rows where ANY column is NA.','That is the default behavior.'],
     'why':'<code>drop_na(df)</code> with no column args drops any row with at least one NA in any column. Equivalent to <code>na.omit(df)</code> in base R.'},

    # Hard code
    {'id':'tr_code_nest_lm', 'type':'code', 'diff':3, 'topic':'nested',
     'prompt':'Write <code>r2_per_species(df)</code> that takes the iris-shaped data frame and returns a tibble with one row per Species and a column <code>r2</code> equal to the R-squared from <code>lm(Petal.Length ~ Sepal.Length)</code> fit on that Species\'s subset. Use nest + mutate + map.',
     'fnName':'r2_per_species',
     'starter':'library(tidyr)\nlibrary(dplyr)\nlibrary(purrr)\n\nr2_per_species <- function(df) {\n  # Your code here\n  \n}',
     'tests':'r <- r2_per_species(iris)\nstopifnot(all(c("Species", "r2") %in% names(r)))\nstopifnot(nrow(r) == 3)\nstopifnot(all(r$r2 > 0 & r$r2 < 1))\nstopifnot(setequal(as.character(r$Species), c("setosa", "versicolor", "virginica")))',
     'hints':['group_by(Species) %>% nest() gives one list-row per species.','mutate(fit = map(data, ~ lm(Petal.Length ~ Sepal.Length, data = .x)), r2 = map_dbl(fit, ~ summary(.x)$r.squared)) does the rest.','select() the result to drop the data + fit list-columns.'],
     'why':'<code>df %>% group_by(Species) %>% nest() %>% mutate(fit = map(data, ~ lm(Petal.Length ~ Sepal.Length, data = .x)), r2 = map_dbl(fit, ~ summary(.x)$r.squared)) %>% select(Species, r2)</code>. The nest/map idiom is how tidyverse does per-group modeling.'},
    {'id':'tr_code_complete', 'type':'code', 'diff':3, 'topic':'completing',
     'prompt':'Write <code>fill_gaps(df)</code> that takes a tibble with columns <code>year, group, value</code>, ensures every combination of year × group is present (filling missing with NA), and returns the result sorted by group then year.',
     'fnName':'fill_gaps',
     'starter':'library(tidyr)\nlibrary(dplyr)\n\nfill_gaps <- function(df) {\n  # Your code here\n  \n}',
     'tests':'df <- data.frame(year = c(2020, 2021, 2020, 2022), group = c("A","A","B","B"), value = c(1, 2, 3, 4))\nr <- fill_gaps(df)\n# Should have rows: A/2020, A/2021, A/2022, B/2020, B/2021, B/2022 = 6\nstopifnot(nrow(r) == 6)\nstopifnot(all(c("year", "group", "value") %in% names(r)))\nstopifnot(any(is.na(r$value)))\nstopifnot(identical(r$group, c("A","A","A","B","B","B")))',
     'hints':['complete(year, group) adds missing combinations and fills with NA.','arrange(group, year) sorts as required.'],
     'why':'<code>df %>% complete(year, group) %>% arrange(group, year)</code>. complete() ensures the full year × group grid; arrange() orders.'},
]


# ---------------------------------------------------------------------------
# QUIZ 7: Time Series
# ---------------------------------------------------------------------------
TIME_SERIES_BANK = [
    # Easy MCQ (4)
    {'id':'ts_ts_object', 'type':'mcq', 'diff':1, 'topic':'objects',
     'q':'Which base-R function creates a regularly-spaced time-series object?',
     'opts':[{'t':'<code>ts()</code>','correct':True},{'t':'<code>as.Date()</code>'},{'t':'<code>xts()</code>'},{'t':'<code>timeSeries()</code>'}],
     'hints':['Base R has a built-in ts() class.','xts and zoo are richer packages; as.Date is for dates, not series.'],
     'why':'<code>ts()</code> creates a regular-frequency time series in base R - the class consumed by classical methods (arima, decompose, HoltWinters). <code>xts</code> and <code>zoo</code> are CRAN packages for irregular series with arbitrary indexes; <code>as.Date()</code> just parses dates.'},
    {'id':'ts_freq', 'type':'mcq', 'diff':1, 'topic':'objects',
     'q':'In <code>ts(x, frequency = 12)</code>, what does <code>frequency = 12</code> declare?',
     'opts':[
        {'t':'The vector has 12 observations'},
        {'t':'The series has 12 observations per seasonal cycle (e.g., monthly data with yearly seasonality)','correct':True},
        {'t':'The forecast horizon is 12'},
        {'t':'The order of the AR model'},
     ],
     'hints':['Monthly data with yearly seasonality has period 12.','Quarterly = 4, daily-with-weekly = 7.'],
     'why':'frequency is the number of observations per seasonal cycle. Monthly data with yearly seasonality -> 12; quarterly with yearly seasonality -> 4; daily with weekly seasonality -> 7. Functions like decompose() and ets() use this to find and remove the seasonal component.'},
    {'id':'ts_acf', 'type':'mcq', 'diff':1, 'topic':'autocorrelation',
     'q':'What does <code>acf()</code> compute and plot?',
     'opts':[
        {'t':'The mean of the series at each time'},
        {'t':'The correlation between the series and its lagged versions (autocorrelation function)','correct':True},
        {'t':'The variance of the residuals'},
        {'t':'The Akaike information criterion'},
     ],
     'hints':['"acf" stands for autocorrelation function.','Each bar = cor(x_t, x_{t-k}) for lag k.'],
     'why':'<code>acf()</code> reports cor(x_t, x_{t-k}) at each lag k, with horizontal bands marking the white-noise null. Slowly-decaying ACF suggests an AR component or trend; a single significant spike at lag 1 then nothing suggests MA(1). Use <code>pacf()</code> alongside to disambiguate AR vs MA orders.'},
    {'id':'ts_stationary', 'type':'mcq', 'diff':1, 'topic':'stationarity',
     'q':'A weakly stationary time series has:',
     'opts':[
        {'t':'Constant mean, constant variance, and autocovariance depending only on lag','correct':True},
        {'t':'A clear upward trend'},
        {'t':'Values that are always positive'},
        {'t':'A perfectly linear regression line'},
     ],
     'hints':['"Stationary" means distributional properties do not drift with time.','Most ARMA theory assumes weak stationarity.'],
     'why':'Weak (second-order) stationarity requires constant mean and variance, with autocovariance depending only on the lag (not on absolute time). Most classical TS theory (ARMA, ARIMA after differencing) assumes weak stationarity. Trends, drifting variance, or seasonality violate it; differencing or seasonal differencing usually restore it.'},

    # Medium MCQ (4)
    {'id':'ts_diff', 'type':'mcq', 'diff':2, 'topic':'differencing',
     'q':'What does first-order differencing <code>diff(x)</code> do?',
     'opts':[
        {'t':'Returns x_t - x_{t-1}, used to remove a linear trend','correct':True},
        {'t':'Computes the discrete second derivative'},
        {'t':'Returns max(x) - min(x)'},
        {'t':'Applies a low-pass filter to the series'},
     ],
     'hints':['Subtracting consecutive points cancels any constant slope.','ARIMA(p, d, q) uses d differences.'],
     'why':'<code>diff(x)</code> computes x_t - x_{t-1}. A linear trend becomes a constant (its slope); a quadratic trend needs <code>diff(x, differences = 2)</code>. ARIMA(p, d, q) uses d differences (d = 0, 1, or 2 in practice) to enforce stationarity. <code>diff(x, lag = 12)</code> performs seasonal differencing for monthly data.'},
    {'id':'ts_adf', 'type':'mcq', 'diff':2, 'topic':'tests',
     'q':'The Augmented Dickey-Fuller (ADF) test, as implemented by <code>tseries::adf.test()</code>, tests:',
     'opts':[
        {'t':'For normality of the series'},
        {'t':'H0: the series has a unit root (non-stationary) against H1: stationary','correct':True},
        {'t':'For autocorrelation in the residuals (Ljung-Box)'},
        {'t':'For seasonality'},
     ],
     'hints':['Under ADF, a SMALL p-value lets you reject non-stationarity.','KPSS test has the reversed null - be careful which one you are running.'],
     'why':'ADF tests H0: unit root present (non-stationary) vs H1: stationary. A small p-value rejects the unit root and supports stationarity. KPSS test has the OPPOSITE null (H0: stationary), so the interpretation flips - confusing them is a classic mistake. Use Ljung-Box (Box.test) for autocorrelation diagnostics, not stationarity.'},
    {'id':'ts_arima', 'type':'mcq', 'diff':2, 'topic':'models',
     'q':'In ARIMA(p, d, q), the three orders refer to:',
     'opts':[
        {'t':'AR lags, number of differences, MA lags','correct':True},
        {'t':'periods, days, quarters'},
        {'t':'parameters, degrees of freedom, quantiles'},
        {'t':'predictors, dummies, quartiles'},
     ],
     'hints':['I = Integrated = differences taken. AR = autoregressive. MA = moving average.','Lower-case (p, d, q) are non-seasonal; uppercase (P, D, Q) are seasonal.'],
     'why':'ARIMA(p, d, q): AR(p) models the series as a linear function of its own p lags; I(d) is the number of differences taken to enforce stationarity; MA(q) models the error as a linear function of q past white-noise terms. Seasonal ARIMA(p,d,q)(P,D,Q)[s] adds seasonal counterparts at lag s.'},
    {'id':'ts_seasonal', 'type':'mcq', 'diff':2, 'topic':'decomposition',
     'q':'<code>decompose()</code> and <code>stl()</code> typically separate a time series into:',
     'opts':[
        {'t':'AR + MA + I components'},
        {'t':'Trend + seasonal + remainder','correct':True},
        {'t':'Mean + median + variance'},
        {'t':'Linear + quadratic + cubic terms'},
     ],
     'hints':['Classical decomposition has three additive (or multiplicative) parts.','STL = Seasonal-Trend decomposition using Loess.'],
     'why':'Classical decomposition: observed = trend + seasonal + remainder (additive) OR observed = trend * seasonal * remainder (multiplicative when the seasonal amplitude scales with the level - AirPassengers is the canonical example). <code>stl()</code> uses iterative Loess smoothing and is robust to outliers, unlike <code>decompose()</code> which uses a simple moving average.'},

    # Hard MCQ (3)
    {'id':'ts_forecast_horizon', 'type':'mcq', 'diff':3, 'topic':'forecasting',
     'q':'For an AR(1) model with |phi| < 1, as the forecast horizon h grows, the prediction interval width:',
     'opts':[
        {'t':'Stays constant'},
        {'t':'Grows and approaches a finite asymptote determined by the unconditional variance','correct':True},
        {'t':'Shrinks toward zero'},
        {'t':'Grows without bound (linearly with h)'},
     ],
     'hints':['Stationary AR processes have a finite long-run variance.','Random-walk (non-stationary) forecasts have variance growing linearly with h.'],
     'why':'For a stationary AR(1), the conditional forecast variance at horizon h is sigma^2 * (1 - phi^{2h}) / (1 - phi^2), which converges to the unconditional variance sigma^2 / (1 - phi^2) as h -> infinity. The point forecast decays geometrically toward the mean, and the PI width plateaus. A random walk (ARIMA(0,1,0)) is the opposite: variance grows linearly with h, no asymptote.'},
    {'id':'ts_auto_arima', 'type':'mcq', 'diff':3, 'topic':'models',
     'q':'<code>auto.arima()</code> (forecast package) selects an ARIMA model by:',
     'opts':[
        {'t':'Always fitting ARIMA(1,1,1)'},
        {'t':'Searching over (p, d, q) and seasonal (P, D, Q) using unit-root tests for d, D and an information criterion (AICc by default) for the lag orders','correct':True},
        {'t':'Maximizing in-sample R-squared'},
        {'t':'Picking the model with the lowest residual mean'},
     ],
     'hints':['Differencing orders d, D are picked by KPSS or similar unit-root tests.','Other orders are picked by AICc; stepwise search by default.'],
     'why':'auto.arima() uses KPSS/CH tests to set d and D (the differencing orders), then performs a stepwise search over (p, q, P, Q) minimizing AICc (corrected AIC). Set <code>stepwise = FALSE, approximation = FALSE</code> for an exhaustive search at the cost of runtime. It still requires sanity checks - residuals should look like white noise (acf, Ljung-Box).'},
    {'id':'ts_ets', 'type':'mcq', 'diff':3, 'topic':'models',
     'q':'The "ETS" family of models stands for:',
     'opts':[
        {'t':'Estimated Time Series'},
        {'t':'Error, Trend, Seasonal - a state-space family of exponential smoothing methods','correct':True},
        {'t':'Empirical Time Smoothing'},
        {'t':'Exponential Trend Stabilization'},
     ],
     'hints':['ETS encodes three components, each Additive (A), Multiplicative (M), or None (N).','ETS(A, N, A) is Holt-Winters with additive seasonality and no trend.'],
     'why':'ETS = Error, Trend, Seasonal. Each can be Additive (A), Multiplicative (M), or None (N). Examples: ETS(A,N,N) is simple exponential smoothing; ETS(A,A,N) is Holt\'s linear; ETS(A,A,A) is additive Holt-Winters; ETS(M,A,M) is multiplicative Holt-Winters. Multiplicative variants handle series whose seasonal amplitude grows with the level. Hyndman\'s ets() picks the best variant by AICc.'},

    # Easy code (2)
    {'id':'ts_code_ts_create', 'type':'code', 'diff':1, 'topic':'objects',
     'prompt':'Write <code>monthly_ts(values, start_year)</code> that wraps the numeric vector <code>values</code> into a monthly ts object starting in January of <code>start_year</code>.',
     'fnName':'monthly_ts',
     'starter':'monthly_ts <- function(values, start_year) {\n  # Your code here\n  \n}',
     'tests':'x <- monthly_ts(1:24, 2020)\nstopifnot(is.ts(x))\nstopifnot(frequency(x) == 12)\nstopifnot(start(x)[1] == 2020)\nstopifnot(start(x)[2] == 1)\nstopifnot(length(x) == 24)\nstopifnot(end(x)[1] == 2021)\nstopifnot(end(x)[2] == 12)',
     'hints':['ts(values, start = c(year, period), frequency = 12).','start = c(start_year, 1) puts the first observation in January.'],
     'why':'<code>ts(values, start = c(start_year, 1), frequency = 12)</code>. start is a (year, period) tuple; frequency = 12 declares monthly seasonality and lets downstream tools (decompose, ets, arima with seasonal terms) know the cycle length.'},
    {'id':'ts_code_diff', 'type':'code', 'diff':1, 'topic':'differencing',
     'prompt':'Write <code>diff_var_ratio(x)</code> that takes a numeric vector and returns the ratio <code>var(diff(x)) / var(x)</code> as a single numeric. Values much less than 1 suggest a trended series.',
     'fnName':'diff_var_ratio',
     'starter':'diff_var_ratio <- function(x) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\ntrend <- 1:200 + rnorm(200)\nr <- diff_var_ratio(trend)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(r < 0.1)\nset.seed(1)\nwhite <- rnorm(200)\nr2 <- diff_var_ratio(white)\nstopifnot(r2 > 0.5)\nstopifnot(abs(r - var(diff(trend)) / var(trend)) < 1e-12)',
     'hints':['diff(x) returns consecutive differences, length(x) - 1.','Compare var(diff(x)) to var(x) directly.'],
     'why':'<code>var(diff(x)) / var(x)</code>. A series dominated by a linear trend has var(diff(x)) much smaller than var(x) because differencing cancels the slope. White noise has comparable variances. This is a back-of-envelope check before formal unit-root testing.'},

    # Medium code (2)
    {'id':'ts_code_acf_lag1', 'type':'code', 'diff':2, 'topic':'autocorrelation',
     'prompt':'Write <code>lag1_autocorr(x)</code> that returns the lag-1 sample autocorrelation of numeric vector <code>x</code> as a single numeric. Implement directly with <code>cor()</code> on aligned shifted copies; do NOT call <code>acf()</code>.',
     'fnName':'lag1_autocorr',
     'starter':'lag1_autocorr <- function(x) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nx <- as.numeric(arima.sim(model = list(ar = 0.7), n = 400))\nr <- lag1_autocorr(x)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(r > 0.5 && r < 0.9)\nset.seed(1)\nwhite <- rnorm(400)\nr2 <- lag1_autocorr(white)\nstopifnot(abs(r2) < 0.2)\n# Matches cor() directly\nstopifnot(abs(r - cor(x[-1], x[-length(x)])) < 1e-12)',
     'hints':['x[-1] drops the first element; x[-length(x)] drops the last.','cor(x[-1], x[-length(x)]) correlates each value with its previous neighbor.'],
     'why':'<code>cor(x[-1], x[-length(x)])</code>. Negative indexing drops one element from each end; the two resulting vectors of length n-1 align so position i in the second is the lag-1 predecessor of position i in the first. This is the Pearson sample autocorrelation at lag 1 (acf()$acf[2] in R notation).'},
    {'id':'ts_code_decompose', 'type':'code', 'diff':2, 'topic':'decomposition',
     'prompt':'Write <code>seasonal_strength(x)</code> that takes a ts object, runs <code>decompose(x)</code>, and returns a "seasonal strength" measure: <code>1 - var(remainder) / var(seasonal + remainder)</code>, ignoring NAs. Closer to 1 means the seasonal component dominates the non-trend variation.',
     'fnName':'seasonal_strength',
     'starter':'seasonal_strength <- function(x) {\n  # Your code here\n  \n}',
     'tests':'r <- seasonal_strength(AirPassengers)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(r > 0 && r < 1)\nstopifnot(r > 0.5)\nr2 <- seasonal_strength(co2)\nstopifnot(r2 > 0 && r2 < 1)',
     'hints':['d <- decompose(x); seasonal <- d$seasonal; rem <- d$random.','Drop NAs in both numerator and denominator: var(rem, na.rm = TRUE) and var(seasonal + rem, na.rm = TRUE).'],
     'why':'<code>d &lt;- decompose(x); 1 - var(d$random, na.rm = TRUE) / var(d$seasonal + d$random, na.rm = TRUE)</code>. The numerator is the unexplained noise variance; the denominator is total non-trend variance. Subtracting from 1 gives the fraction of non-trend variance attributable to the seasonal pattern. decompose() pads endpoints with NA because of the centered moving average - na.rm guards against that.'},

    # Hard code (2)
    {'id':'ts_code_arima_fit', 'type':'code', 'diff':3, 'topic':'models',
     'prompt':'Write <code>fit_arima_order(x, p, d, q)</code> that fits an ARIMA(p, d, q) on numeric vector <code>x</code> via <code>arima()</code> and returns a named list with <code>aic</code> (numeric, the AIC) and <code>coefs</code> (named numeric vector of coefficients from <code>coef()</code>).',
     'fnName':'fit_arima_order',
     'starter':'fit_arima_order <- function(x, p, d, q) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nx <- as.numeric(arima.sim(model = list(ar = 0.6), n = 200))\nr <- fit_arima_order(x, 1, 0, 0)\nstopifnot(is.list(r))\nstopifnot(all(c("aic", "coefs") %in% names(r)))\nstopifnot(is.numeric(r$aic))\nstopifnot(is.numeric(r$coefs))\nstopifnot("ar1" %in% names(r$coefs))\nstopifnot(abs(r$coefs[["ar1"]] - 0.6) < 0.2)\n# Match base arima\nref <- arima(x, order = c(1, 0, 0))\nstopifnot(abs(r$aic - ref$aic) < 1e-9)',
     'hints':['arima(x, order = c(p, d, q)) fits the model.','fit$aic and coef(fit) give the two values.'],
     'why':'<code>fit &lt;- arima(x, order = c(p, d, q)); list(aic = fit$aic, coefs = coef(fit))</code>. AIC is for model comparison (lower is better, same data); coef() returns the named coefficient vector with names like "ar1", "ma1", "intercept". Note: arima() reports the mean as "intercept" only when include.mean = TRUE (the default for d = 0).'},
    {'id':'ts_code_forecast_h', 'type':'code', 'diff':3, 'topic':'forecasting',
     'prompt':'Write <code>forecast_h_step(x, h)</code> that fits an ARIMA(1, 0, 0) (AR(1)) on numeric vector <code>x</code> via <code>arima()</code>, then returns a base-R numeric vector of length <code>h</code> containing the h-step-ahead point forecasts. Strip any ts attributes.',
     'fnName':'forecast_h_step',
     'starter':'forecast_h_step <- function(x, h) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nx <- as.numeric(arima.sim(model = list(ar = 0.6), n = 200))\nr <- forecast_h_step(x, 5)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 5)\nstopifnot(!is.ts(r))\n# AR(1) forecasts decay geometrically toward the mean (here 0)\nstopifnot(abs(r[5]) <= abs(r[1]) + 1e-6)\n# 10-step forecast\nr2 <- forecast_h_step(x, 10)\nstopifnot(length(r2) == 10)',
     'hints':['fit <- arima(x, order = c(1, 0, 0)).','predict(fit, n.ahead = h)$pred gives the forecast as a ts object.','as.numeric() strips the ts attribute and returns a plain numeric vector.'],
     'why':'<code>as.numeric(predict(arima(x, order = c(1, 0, 0)), n.ahead = h)$pred)</code>. predict.Arima returns a list with $pred (forecasts) and $se (standard errors), both as ts objects. as.numeric() strips ts attributes so the result is a plain numeric vector. For an AR(1) with mean 0, forecasts decay geometrically: phi^h * x_n.'},
]


# ---------------------------------------------------------------------------
# QUIZ 8: Shiny
# ---------------------------------------------------------------------------
SHINY_BANK = [
    # Easy MCQ
    {'id':'sh_two_parts', 'type':'mcq', 'diff':1, 'topic':'architecture',
     'q':'A Shiny app is made of two main parts:',
     'opts':[
        {'t':'fit and predict'},
        {'t':'UI (user interface) and server (reactive logic)','correct':True},
        {'t':'frontend and database'},
        {'t':'model and view'},
     ],
     'hints':['Shiny = declarative UI + reactive server.'],
     'why':'A Shiny app has a UI definition (HTML+Shiny widgets declaring inputs/outputs) and a server function (the reactive logic mapping inputs to outputs).'},
    {'id':'sh_input', 'type':'mcq', 'diff':1, 'topic':'reactivity',
     'q':'Inside the server function, how do you read a slider input named "x"?',
     'opts':[
        {'t':'<code>x</code>'},
        {'t':'<code>input$x</code>','correct':True},
        {'t':'<code>output$x</code>'},
        {'t':'<code>reactive(x)</code>'},
     ],
     'hints':['input$ for reading input values; output$ for assigning outputs.'],
     'why':'<code>input$x</code> reads the current value of the input element with inputId = "x". This is a reactive value — any context that reads it will re-execute when it changes.'},
    {'id':'sh_render', 'type':'mcq', 'diff':1, 'topic':'rendering',
     'q':'Which renderer produces text output for a Shiny app?',
     'opts':[{'t':'<code>renderPrint()</code>'},{'t':'<code>renderText()</code>','correct':True},{'t':'<code>output$text()</code>'},{'t':'<code>echo()</code>'}],
     'hints':['render*() functions create reactive output expressions. textOutput pairs with renderText.'],
     'why':'<code>renderText()</code> produces text output to pair with <code>textOutput()</code> in the UI. <code>renderPrint()</code> captures print() output (more verbose).'},
    {'id':'sh_run_app', 'type':'mcq', 'diff':1, 'topic':'running',
     'q':'How do you launch a Shiny app from R?',
     'opts':[
        {'t':'<code>shinyApp(ui, server)</code> or <code>runApp("path/")</code>','correct':True},
        {'t':'<code>shiny::launch()</code>'},
        {'t':'<code>app(ui, server)</code>'},
        {'t':'<code>runShiny()</code>'},
     ],
     'hints':['shinyApp() wraps ui + server into an app; runApp() runs from a file or directory.'],
     'why':'<code>shinyApp(ui, server)</code> creates an app object; running it (or printing in the console) launches the local server. <code>runApp("path")</code> runs an app stored in app.R or ui.R/server.R.'},

    # Medium MCQ
    {'id':'sh_reactive', 'type':'mcq', 'diff':2, 'topic':'reactivity',
     'q':'What does <code>reactive()</code> do?',
     'opts':[
        {'t':'Schedules a one-time computation'},
        {'t':'Wraps an expression in a cached reactive value that recomputes when its dependencies change','correct':True},
        {'t':'Disables a Shiny widget'},
        {'t':'Renders HTML output'},
     ],
     'hints':['reactive() returns a function-like reactive expression you can call as v() to get its value.'],
     'why':'<code>reactive()</code> wraps an expression. Calling the wrapped name as a function returns the current value, cached until any input dependency changes. Useful for sharing computed state across outputs.'},
    {'id':'sh_isolate', 'type':'mcq', 'diff':2, 'topic':'reactivity',
     'q':'What does <code>isolate()</code> do inside a reactive context?',
     'opts':[
        {'t':'Reads an input value WITHOUT taking a reactive dependency on it','correct':True},
        {'t':'Stops the app'},
        {'t':'Throttles updates'},
        {'t':'Caches a value to disk'},
     ],
     'hints':['Sometimes you want to read input but NOT re-run when it changes (e.g., trigger only on button click).'],
     'why':'<code>isolate(input$x)</code> reads x without subscribing to changes — the reactive containing it won\'t re-execute when x updates. Common pattern paired with <code>observeEvent()</code>.'},
    {'id':'sh_observe_event', 'type':'mcq', 'diff':2, 'topic':'reactivity',
     'q':'Use <code>observeEvent(input$go, ...)</code> when you want to:',
     'opts':[
        {'t':'Continuously sync to an input'},
        {'t':'Run an action ONLY when a specific event (like a button click) fires','correct':True},
        {'t':'Disable an input'},
        {'t':'Filter a data frame'},
     ],
     'hints':['observeEvent fires when a specific reactive value changes.'],
     'why':'<code>observeEvent(input$go, { ... })</code> runs the block only when input$go changes (typically when a button is clicked). It does NOT re-run when other reactive values change.'},
    {'id':'sh_layout', 'type':'mcq', 'diff':2, 'topic':'ui',
     'q':'<code>fluidPage()</code> versus <code>fixedPage()</code>:',
     'opts':[
        {'t':'They are the same'},
        {'t':'fluidPage uses responsive 12-column grid; fixedPage uses a fixed-width layout','correct':True},
        {'t':'fluidPage is for data tables; fixedPage is for plots'},
        {'t':'Only fixedPage works on mobile'},
     ],
     'hints':['"Fluid" means the layout adapts to the viewport width.'],
     'why':'<code>fluidPage()</code> uses Bootstrap\'s responsive 12-column grid. <code>fixedPage()</code> centers content in a fixed-width container. fluidPage is the modern default.'},

    # Hard MCQ
    {'id':'sh_modules', 'type':'mcq', 'diff':3, 'topic':'modules',
     'q':'Shiny modules let you:',
     'opts':[
        {'t':'Persist state across user sessions'},
        {'t':'Encapsulate UI + server logic with namespaced IDs for reuse','correct':True},
        {'t':'Run R code on the client'},
        {'t':'Avoid having to define a UI'},
     ],
     'hints':['Modules are reusable chunks of UI + server.'],
     'why':'Modules use NS() to namespace input/output IDs. They package up UI + server pairs so the same component can appear multiple times in an app without ID collisions.'},
    {'id':'sh_invalidatlater', 'type':'mcq', 'diff':3, 'topic':'reactivity',
     'q':'<code>invalidateLater(1000)</code> does what?',
     'opts':[
        {'t':'Pauses the app for 1 second'},
        {'t':'Schedules the containing reactive to invalidate (re-run) after 1000 ms','correct':True},
        {'t':'Logs every 1000 ms'},
        {'t':'Times out the session after 1000 ms'},
     ],
     'hints':['Used inside a reactive context to create a polling/animation loop.'],
     'why':'<code>invalidateLater(ms)</code> schedules invalidation of the surrounding reactive context after ms milliseconds. Combined with autoInvalidate or observe(), creates polling loops without blocking.'},
    {'id':'sh_session', 'type':'mcq', 'diff':3, 'topic':'session',
     'q':'In <code>server &lt;- function(input, output, session) {...}</code>, what is <code>session</code> for?',
     'opts':[
        {'t':'Database connection'},
        {'t':'Per-user session object — used for sendCustomMessage, updateInput, onSessionEnded, etc.','correct':True},
        {'t':'It is unused; can be omitted always'},
        {'t':'A list of all currently running apps'},
     ],
     'hints':['session = the specific user\'s connection. Each connected user gets their own.'],
     'why':'The session object represents a single user\'s connection. Used to update inputs from server-side (updateSelectInput(session, ...)), send custom JavaScript messages, register cleanup with onSessionEnded(), etc.'},

    # Easy code
    {'id':'sh_code_app_basic', 'type':'code', 'diff':1, 'topic':'architecture',
     'prompt':'Write a function <code>build_simple_app()</code> that returns a shinyApp object whose UI has a numeric input with inputId <code>"n"</code> (default 5) and a text output with outputId <code>"squared"</code>, and whose server renders the square of input$n into output$squared.',
     'fnName':'build_simple_app',
     'starter':'library(shiny)\n\nbuild_simple_app <- function() {\n  # Your code here\n  \n}',
     'tests':'app <- build_simple_app()\nstopifnot(inherits(app, "shiny.appobj"))\nstopifnot(is.function(app$serverFuncSource()) || is.function(app$server))',
     'hints':['ui <- fluidPage(numericInput("n", "n", 5), textOutput("squared"))','server <- function(input, output) { output$squared <- renderText(input$n^2) }','Return shinyApp(ui = ui, server = server).'],
     'why':'<code>ui &lt;- fluidPage(numericInput("n", "n", 5), textOutput("squared")); server &lt;- function(input, output) { output$squared &lt;- renderText(input$n^2) }; shinyApp(ui = ui, server = server)</code>. The renderText reads input$n reactively and updates.'},
    {'id':'sh_code_input_ids', 'type':'code', 'diff':1, 'topic':'ui',
     'prompt':'Write <code>list_input_ids(ui)</code> that takes a shiny UI object (built with fluidPage()) and returns a character vector of inputId values found inside it (via shiny tag walking).',
     'fnName':'list_input_ids',
     'starter':'library(shiny)\n\nlist_input_ids <- function(ui) {\n  # Your code here\n  \n}',
     'tests':'u <- fluidPage(\n  numericInput("a", "a", 1),\n  textInput("b", "b"),\n  selectInput("c", "c", choices = c("x","y"))\n)\nr <- list_input_ids(u)\nstopifnot(is.character(r))\nstopifnot(setequal(r, c("a","b","c")))',
     'hints':['shiny tags are nested lists. Walk recursively, find any node whose attrib contains an inputId.','One way: stringify the html with as.character(ui) and regex out inputId="...". Cleaner: htmltools::htmlPreserve(ui) walk.'],
     'why':'A simple HTML stringify and regex over <code>id=" ... "</code> works for fluidPage builds: <code>m &lt;- regmatches(as.character(ui), gregexpr(\'id="([^"]+)"\', as.character(ui))); unique(sub(\'id="(.+)"\', "\\\\1", unlist(m)))</code>. Walking htmltools tags is more robust.'},

    # Medium code
    {'id':'sh_code_reactive', 'type':'code', 'diff':2, 'topic':'reactivity',
     'prompt':'Write <code>summed_server(input, output)</code> — a Shiny server function — that reads two numeric inputs <code>a</code> and <code>b</code> and renders the sum into output <code>total</code> using <code>renderText()</code>.',
     'fnName':'summed_server',
     'starter':'library(shiny)\n\nsummed_server <- function(input, output) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(is.function(summed_server))\nstopifnot(length(formals(summed_server)) >= 2)\nstopifnot(all(c("input", "output") %in% names(formals(summed_server))))\n# Function should mention input$a, input$b, output$total, renderText\nbody_text <- paste(deparse(body(summed_server)), collapse = " ")\nstopifnot(grepl("input\\\\$a", body_text))\nstopifnot(grepl("input\\\\$b", body_text))\nstopifnot(grepl("output\\\\$total", body_text))\nstopifnot(grepl("renderText", body_text))',
     'hints':['function(input, output) { output$total <- renderText(input$a + input$b) }','renderText wraps a reactive expression — it re-runs whenever input$a or input$b changes.'],
     'why':'<code>function(input, output) { output$total &lt;- renderText(input$a + input$b) }</code>. renderText() returns a reactive observer that updates whenever its dependencies change.'},
    {'id':'sh_code_observe', 'type':'code', 'diff':2, 'topic':'reactivity',
     'prompt':'Write <code>button_server(input, output)</code> — a server function — where, when <code>input$go</code> (an action button) is clicked, output <code>counter</code> displays the count of clicks. Use <code>observeEvent</code> and <code>reactiveVal()</code>.',
     'fnName':'button_server',
     'starter':'library(shiny)\n\nbutton_server <- function(input, output) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(is.function(button_server))\nbody_text <- paste(deparse(body(button_server)), collapse = " ")\nstopifnot(grepl("reactiveVal", body_text))\nstopifnot(grepl("observeEvent", body_text))\nstopifnot(grepl("input\\\\$go", body_text))\nstopifnot(grepl("output\\\\$counter", body_text))',
     'hints':['count <- reactiveVal(0) creates a mutable reactive integer.','observeEvent(input$go, count(count() + 1)) increments on each click.','output$counter <- renderText(count()) reads the value reactively.'],
     'why':'<code>count &lt;- reactiveVal(0); observeEvent(input$go, count(count() + 1)); output$counter &lt;- renderText(count())</code>. reactiveVal gives a mutable reactive store; observeEvent fires only on button clicks.'},

    # Hard code
    {'id':'sh_code_module', 'type':'code', 'diff':3, 'topic':'modules',
     'prompt':'Write a Shiny module UI function <code>counter_module_ui(id)</code> that, using NS(id), returns a tagList with an actionButton (inputId "go", label "Go") and a textOutput (outputId "count").',
     'fnName':'counter_module_ui',
     'starter':'library(shiny)\n\ncounter_module_ui <- function(id) {\n  # Your code here\n  \n}',
     'tests':'ui <- counter_module_ui("mymod")\nstopifnot(inherits(ui, "shiny.tag.list") || inherits(ui, "shiny.tag"))\nhtml <- as.character(ui)\nstopifnot(grepl(\'id="mymod-go"\', html))\nstopifnot(grepl(\'id="mymod-count"\', html))',
     'hints':['ns <- NS(id) creates a namespace function.','tagList(actionButton(ns("go"), "Go"), textOutput(ns("count"))).'],
     'why':'<code>ns &lt;- NS(id); tagList(actionButton(ns("go"), "Go"), textOutput(ns("count")))</code>. NS(id) prefixes the inputIds so multiple instances of the module can coexist in one app.'},
    {'id':'sh_code_poll', 'type':'code', 'diff':3, 'topic':'reactivity',
     'prompt':'Write <code>polling_server(input, output)</code> — a server function — where output <code>now</code> displays the current Sys.time() and is re-rendered every 1000 ms using <code>invalidateLater()</code>.',
     'fnName':'polling_server',
     'starter':'library(shiny)\n\npolling_server <- function(input, output) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(is.function(polling_server))\nbody_text <- paste(deparse(body(polling_server)), collapse = " ")\nstopifnot(grepl("invalidateLater", body_text))\nstopifnot(grepl("output\\\\$now", body_text))\nstopifnot(grepl("Sys.time|format", body_text))',
     'hints':['output$now <- renderText({ invalidateLater(1000); format(Sys.time()) }).','invalidateLater inside a reactive context schedules a re-run after the specified ms.'],
     'why':'<code>output$now &lt;- renderText({ invalidateLater(1000); format(Sys.time()) })</code>. invalidateLater(1000) inside renderText causes it to re-execute every second, producing a live clock without polling explicitly.'},
]


# ---------------------------------------------------------------------------
# QUIZ 9: R Interview Readiness
# ---------------------------------------------------------------------------
INTERVIEW_BANK = [
    # Easy MCQ (4)
    {'id':'iv_typeof_mix', 'type':'mcq', 'diff':1, 'topic':'types',
     'q':'What does <code>typeof(c(1, "a"))</code> return?',
     'opts':[
        {'t':'<code>"list"</code>'},
        {'t':'<code>"character"</code>','correct':True},
        {'t':'<code>"mixed"</code>'},
        {'t':'an error'},
     ],
     'hints':['Atomic vectors coerce to one type. Hierarchy: logical < integer < double < character.'],
     'why':'c() coerces all inputs to the most flexible type present. Character wins over numeric, so c(1, "a") becomes c("1", "a") of typeof "character". To preserve mixed types, use list().'},
    {'id':'iv_dataframe_vs_list', 'type':'mcq', 'diff':1, 'topic':'data structures',
     'q':'Under the hood, a data frame is:',
     'opts':[
        {'t':'A matrix with column names'},
        {'t':'A list of equal-length vectors with row.names','correct':True},
        {'t':'A 2D array of mixed type'},
        {'t':'A specialised factor'},
     ],
     'hints':['Try is.list(mtcars) at the console.'],
     'why':'A data frame is a list whose elements are equal-length vectors representing columns, plus a row.names attribute. <code>is.list(mtcars)</code> returns TRUE. That is why most list operations (length, names, [[) also work on data frames.'},
    {'id':'iv_apply_returns_list', 'type':'mcq', 'diff':1, 'topic':'apply family',
     'q':'Which apply-family function always returns a list, regardless of inputs?',
     'opts':[
        {'t':'<code>sapply()</code>'},
        {'t':'<code>vapply()</code>'},
        {'t':'<code>lapply()</code>','correct':True},
        {'t':'<code>mapply()</code>'},
     ],
     'hints':['l = list. The first letter of the function name tells you the return type.'],
     'why':'<code>lapply()</code> always returns a list of the same length as the input. <code>sapply()</code> tries to simplify to a vector or matrix; <code>vapply()</code> demands you declare the output template (type-safe sapply); <code>mapply()</code> is multivariate sapply.'},
    {'id':'iv_seq_len_safe', 'type':'mcq', 'diff':1, 'topic':'vectors',
     'q':'For n = 0, which expression produces an empty integer vector instead of c(1L, 0L)?',
     'opts':[
        {'t':'<code>1:n</code>'},
        {'t':'<code>seq_len(n)</code>','correct':True},
        {'t':'<code>seq(1, n)</code>'},
        {'t':'<code>1:length(n)</code>'},
     ],
     'hints':['1:0 gives c(1L, 0L), which is the classic empty-loop bug in R.'],
     'why':'<code>seq_len(0)</code> returns integer(0); <code>1:0</code> returns c(1L, 0L), which silently iterates twice in a for loop. seq_len() is the safe idiom for "0 to n elements" loops. seq_along(x) is the same idea over an existing vector.'},

    # Medium MCQ (4)
    {'id':'iv_lazy_eval', 'type':'mcq', 'diff':2, 'topic':'functions',
     'q':'R uses lazy evaluation for function arguments. What does that mean in practice?',
     'opts':[
        {'t':'Arguments are evaluated in reverse order'},
        {'t':'Each argument is evaluated the first time the function body references it','correct':True},
        {'t':'Arguments are pre-computed at function-definition time'},
        {'t':'Arguments are skipped unless declared mandatory'},
     ],
     'hints':['Lazy = deferred until needed.'],
     'why':'Arguments are wrapped in promises that force on first use. This lets functions safely accept arguments they may never look at (e.g., default values that error if computed but are never needed). It also enables non-standard evaluation by capturing the unevaluated expression.'},
    {'id':'iv_lexical', 'type':'mcq', 'diff':2, 'topic':'scoping',
     'q':'A function f is defined in environment A but called from environment B. When f references a free variable, R looks for it in:',
     'opts':[
        {'t':'B (the caller) first, then up the call stack'},
        {'t':'A (where f was defined), then up A\'s parents','correct':True},
        {'t':'The global environment only'},
        {'t':'The package namespace where f was installed'},
     ],
     'hints':['Lexical = the structure where the function was written, not where it was called from.'],
     'why':'R uses lexical scoping: a function carries a reference to its defining environment and resolves free variables by walking up that chain. Dynamic scoping (using the caller) is rare in R, though you can opt in via parent.frame() or sys.call().'},
    {'id':'iv_copy_modify', 'type':'mcq', 'diff':2, 'topic':'memory',
     'q':'After <code>y &lt;- x; y[1] &lt;- 99</code>, what is true about x?',
     'opts':[
        {'t':'x is also modified (R passes by reference)'},
        {'t':'x is unchanged; R copied y\'s storage on the modification','correct':True},
        {'t':'R throws "cannot modify in place"'},
        {'t':'y is unchanged; only x is'},
     ],
     'hints':['R has copy-on-modify semantics for most objects.'],
     'why':'<code>y &lt;- x</code> just shares storage cheaply. The moment y is modified, R duplicates the underlying memory so x stays untouched. Notable exceptions: environments and data.table::set() use true reference semantics and skip the copy.'},
    {'id':'iv_s3_dispatch', 'type':'mcq', 'diff':2, 'topic':'OOP',
     'q':'How does the S3 generic <code>print()</code> decide which method to run on an object with <code>class(x) &lt;- c("foo", "bar")</code>?',
     'opts':[
        {'t':'It only looks for <code>print.foo</code>; if missing it errors'},
        {'t':'It tries <code>print.foo</code>, then <code>print.bar</code>, then <code>print.default</code>','correct':True},
        {'t':'It runs all matching methods in sequence'},
        {'t':'It picks the most specific method declared via setMethod()'},
     ],
     'hints':['Class vectors enable simple inheritance: leftmost is most specific.'],
     'why':'S3 dispatch walks the class vector left to right, looking for <code>generic.class</code> at each step, then falls back to <code>generic.default</code>. NextMethod() inside a method delegates to the next class in line. setMethod() belongs to S4, a stricter system.'},

    # Hard MCQ (3)
    {'id':'iv_promise_forloop', 'type':'mcq', 'diff':3, 'topic':'functions',
     'q':'What is the classic gotcha in:<br><pre style="margin:8px 0;background:#1e2734;color:#e1e6ee;padding:10px 14px;border-radius:4px;font-size:13px">funs &lt;- list()\nfor (i in 1:3) funs[[i]] &lt;- function() i\nfuns[[1]]()</pre>',
     'opts':[
        {'t':'It returns 1'},
        {'t':'It returns 3, because i is captured lazily and resolved at call time','correct':True},
        {'t':'It errors: i is not defined'},
        {'t':'It returns a function object'},
     ],
     'hints':['Each closure captures the variable i, not its value at definition.','To capture the value, use force(i) inside or local() to snapshot.'],
     'why':'All three closures share the same i. When you finally call funs[[1]](), R resolves i lazily and finds the value left after the loop ended: 3. Fix with <code>local({ j &lt;- i; function() j })</code> or <code>(function(j) function() j)(i)</code> to capture the value.'},
    {'id':'iv_nse_quote', 'type':'mcq', 'diff':3, 'topic':'metaprogramming',
     'q':'In tidy eval (rlang), what is the role of the embrace operator <code>{{ x }}</code> inside a function body?',
     'opts':[
        {'t':'It evaluates x in the global environment'},
        {'t':'It captures the unevaluated argument expression and re-evaluates it in the data mask','correct':True},
        {'t':'It converts x to a character string'},
        {'t':'It evaluates x lazily, like a promise'},
     ],
     'hints':['{{ x }} is shorthand for enquo() + !! in one step.'],
     'why':'<code>{{ x }}</code> captures the expression passed for x at the call site and forwards it to the next NSE function (e.g., dplyr verbs) for evaluation in the data context. Without it, passing column names through a user-defined wrapper does not work because dplyr would look up x literally as a column.'},
    {'id':'iv_vec_speed', 'type':'mcq', 'diff':3, 'topic':'algorithms',
     'q':'Why is <code>sum(x)</code> typically much faster than a for-loop that accumulates into a scalar in R?',
     'opts':[
        {'t':'R compiles the loop to bytecode every call'},
        {'t':'sum() is a primitive that loops in C; the R loop pays interpreter overhead per iteration','correct':True},
        {'t':'sum() runs in parallel threads'},
        {'t':'Loops in R always copy x at every iteration'},
     ],
     'hints':['"Vectorized" in R usually means the loop is in C, not in R.'],
     'why':'Vectorized functions like sum, mean, +, * are implemented in C and process the entire vector in tight inner code. An R-level loop dispatches the interpreter per iteration, performs scalar arithmetic, and may trigger copy-on-modify if the accumulator grows. Same algorithm, vastly different constant factor.'},

    # Easy code (2)
    {'id':'iv_code_fib', 'type':'code', 'diff':1, 'topic':'recursion',
     'prompt':'Write <code>fib(n)</code> that returns the n-th Fibonacci number (1, 1, 2, 3, 5, 8, ...). The 1st and 2nd Fibonacci numbers are both 1. Recursion or iteration is fine.',
     'fnName':'fib',
     'starter':'fib <- function(n) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(fib(1) == 1)\nstopifnot(fib(2) == 1)\nstopifnot(fib(3) == 2)\nstopifnot(fib(10) == 55)\nstopifnot(fib(15) == 610)',
     'hints':['Base case: n <= 2 returns 1.','Recursive: fib(n) = fib(n-1) + fib(n-2). Iterative is O(n) and avoids exponential blowup.'],
     'why':'Recursive one-liner: <code>if (n &lt;= 2) 1 else fib(n - 1) + fib(n - 2)</code>. Clean and what interviewers expect, but exponential in time. For larger n, an iterative two-variable loop or memoization is the production answer.'},
    {'id':'iv_code_reverse', 'type':'code', 'diff':1, 'topic':'vectors',
     'prompt':'Write <code>reverse_vec(x)</code> that returns vector <code>x</code> in reverse order. Do not use <code>rev()</code>. Handle the empty-vector case correctly.',
     'fnName':'reverse_vec',
     'starter':'reverse_vec <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(reverse_vec(c(1,2,3)), c(3,2,1)))\nstopifnot(identical(reverse_vec(c("a","b","c","d")), c("d","c","b","a")))\nstopifnot(length(reverse_vec(integer(0))) == 0)',
     'hints':['Decreasing index sequence: x[length(x):1].','Guard length 0: 0:1 yields c(0L, 1L), which would mis-subset.'],
     'why':'<code>if (length(x) == 0) x else x[length(x):1]</code>. Subscripting with a decreasing index sequence reorders the vector. The empty-vector guard avoids the classic 0:1 trap (analogous to the 1:n trap with seq_len).'},

    # Medium code (2)
    {'id':'iv_code_word_freq', 'type':'code', 'diff':2, 'topic':'strings',
     'prompt':'Write <code>word_freq(text)</code> that takes one character string and returns a named integer vector of word counts (case-insensitive, words split on whitespace). Sort by count descending. For an empty string, return an empty result.',
     'fnName':'word_freq',
     'starter':'word_freq <- function(text) {\n  # Your code here\n  \n}',
     'tests':'r <- word_freq("the quick brown fox jumps over the lazy dog the the")\nstopifnot(is.integer(r) || is.numeric(r))\nstopifnot(r[["the"]] == 4)\nstopifnot(r[["fox"]] == 1)\nstopifnot(r[1] >= r[length(r)])\nstopifnot(length(word_freq("")) == 0)',
     'hints':['tolower() canonicalizes case before splitting.','strsplit(text, "\\\\s+")[[1]] gives a character vector of tokens; filter empties with nzchar().','sort(table(words), decreasing = TRUE) gives a sorted named count.'],
     'why':'<code>words &lt;- strsplit(tolower(text), "\\\\s+")[[1]]; words &lt;- words[nzchar(words)]; sort(table(words), decreasing = TRUE)</code>. Filter nzchar() removes empty tokens caused by leading whitespace or empty input. table() builds the count; sort() orders.'},
    {'id':'iv_code_unique_order', 'type':'code', 'diff':2, 'topic':'vectors',
     'prompt':'Write <code>unique_in_order(x)</code> that returns the unique elements of <code>x</code> in the order of their FIRST appearance. Do not call <code>unique()</code>.',
     'fnName':'unique_in_order',
     'starter':'unique_in_order <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(unique_in_order(c(3, 1, 2, 1, 3, 4)), c(3, 1, 2, 4)))\nstopifnot(identical(unique_in_order(c("a","b","a","c","b")), c("a","b","c")))\nstopifnot(length(unique_in_order(integer(0))) == 0)',
     'hints':['duplicated(x) flags the SECOND and later occurrences.','x[!duplicated(x)] keeps each first occurrence in its original position.'],
     'why':'<code>x[!duplicated(x)]</code>. duplicated() returns TRUE for repeats, so negating keeps the first instance of each value. This works for any atomic type and naturally preserves the original encounter order. (It is also exactly what base unique() does internally for vectors.)'},

    # Hard code (2)
    {'id':'iv_code_two_sum', 'type':'code', 'diff':3, 'topic':'algorithms',
     'prompt':'Write <code>two_sum(nums, target)</code> that returns the 1-indexed positions of the two numbers in <code>nums</code> that sum to <code>target</code>, as an integer vector of length 2. Each input has exactly one solution. Aim for O(n) using an environment as a hash map.',
     'fnName':'two_sum',
     'starter':'two_sum <- function(nums, target) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(sort(two_sum(c(2,7,11,15), 9)), c(1L, 2L)))\nstopifnot(identical(sort(two_sum(c(3,2,4), 6)), c(2L, 3L)))\nstopifnot(identical(sort(two_sum(c(3,3), 6)), c(1L, 2L)))',
     'hints':['env <- new.env(hash = TRUE). For each i: key <- as.character(target - nums[i]).','If exists(key, envir = env, inherits = FALSE), return c(env[[key]], i). Otherwise record nums[i] -> i.'],
     'why':'Hash-map walk: for each new num, ask whether its complement was seen earlier. If yes, return both indices. If no, store the current value -> index mapping. R environments with hash = TRUE are the idiomatic O(1) lookup structure; remember to set inherits = FALSE so exists() does not climb to global.'},
    {'id':'iv_code_running_max', 'type':'code', 'diff':3, 'topic':'algorithms',
     'prompt':'Write <code>running_max(x)</code> that returns a numeric vector of the same length as <code>x</code> where element i is the maximum of <code>x[1:i]</code>. Do not call <code>cummax()</code> directly. Reduce or sapply is fine.',
     'fnName':'running_max',
     'starter':'running_max <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(running_max(c(1, 3, 2, 5, 4)), c(1, 3, 3, 5, 5)))\nstopifnot(identical(running_max(c(5, 4, 3, 2, 1)), c(5, 5, 5, 5, 5)))\nstopifnot(length(running_max(numeric(0))) == 0)\nstopifnot(identical(running_max(c(-3, -1, -5, 0)), c(-3, -1, -1, 0)))',
     'hints':['Reduce(pmax, x, accumulate = TRUE) returns the running result at each step.','For empty input, Reduce(..., numeric(0), accumulate = TRUE) returns numeric(0) cleanly.'],
     'why':'<code>Reduce(pmax, x, accumulate = TRUE)</code>. Reduce with accumulate=TRUE emits the partial result at every step. pmax (parallel max) collapses to scalar max when both args are scalars. It is O(n) and survives the empty-input edge case without a special guard.'},
]


# ---------------------------------------------------------------------------
# QUIZ 10: Functional Programming
# ---------------------------------------------------------------------------
FP_BANK = [
    # Easy MCQ (4)
    {'id':'fp_map_returns', 'type':'mcq', 'diff':1, 'topic':'purrr',
     'q':'In purrr, <code>map(x, f)</code> always returns:',
     'opts':[
        {'t':'A numeric vector'},
        {'t':'A list','correct':True},
        {'t':'A data frame'},
        {'t':'The first element of x after applying f'},
     ],
     'hints':['Like lapply, map returns a list. Use map_dbl, map_int, map_chr for typed returns.'],
     'why':'<code>map()</code> always returns a list of the same length as x. Type-stable variants (<code>map_dbl()</code>, <code>map_chr()</code>, <code>map_lgl()</code>, <code>map_int()</code>) coerce/check and return an atomic vector, erroring early if any element is the wrong type.'},
    {'id':'fp_higher_order', 'type':'mcq', 'diff':1, 'topic':'concepts',
     'q':'A higher-order function is one that:',
     'opts':[
        {'t':'Returns higher numeric precision'},
        {'t':'Takes a function as an argument and/or returns a function','correct':True},
        {'t':'Is defined inside another function'},
        {'t':'Has more than 5 arguments'},
     ],
     'hints':['Higher-order means it operates on functions.'],
     'why':'A higher-order function treats functions as first-class values: it accepts them as arguments, returns them as results, or both. <code>Map</code>, <code>Reduce</code>, <code>Filter</code>, <code>purrr::compose</code>, <code>partial</code>, and any closure factory are higher-order.'},
    {'id':'fp_anonymous', 'type':'mcq', 'diff':1, 'topic':'syntax',
     'q':'Which is the modern R 4.1+ anonymous function shorthand?',
     'opts':[
        {'t':'<code>fn(x) x * 2</code>'},
        {'t':'<code>\\(x) x * 2</code>','correct':True},
        {'t':'<code>lambda x: x * 2</code>'},
        {'t':'<code>function(x) -&gt; x * 2</code>'},
     ],
     'hints':['Base R 4.1 added a backslash lambda shorthand.'],
     'why':'<code>\\(x) x * 2</code> is the base R 4.1+ shorthand for <code>function(x) x * 2</code>. Semantically identical, just less typing inside pipes. purrr also offers the <code>~ .x * 2</code> formula shorthand inside map() and friends.'},
    {'id':'fp_reduce_basic', 'type':'mcq', 'diff':1, 'topic':'reduce',
     'q':'<code>Reduce("+", 1:4)</code> returns:',
     'opts':[
        {'t':'<code>4</code>'},
        {'t':'<code>10</code>','correct':True},
        {'t':'<code>c(1, 3, 6, 10)</code>'},
        {'t':'<code>"1234"</code>'},
     ],
     'hints':['Reduce folds left to right.'],
     'why':'Reduce applies a binary function cumulatively: <code>((1+2)+3)+4 = 10</code>. To get the intermediate partial sums c(1, 3, 6, 10), pass <code>accumulate = TRUE</code>. The init argument seeds the fold (and changes the result for empty inputs).'},

    # Medium MCQ (4)
    {'id':'fp_map_chr', 'type':'mcq', 'diff':2, 'topic':'purrr',
     'q':'<code>map_chr(1:3, ~ paste0("item_", .x))</code> returns:',
     'opts':[
        {'t':'A list of 3 character strings'},
        {'t':'A character vector of length 3','correct':True},
        {'t':'An error (mismatched types)'},
        {'t':'NULL'},
     ],
     'hints':['The _chr suffix promises a character vector.'],
     'why':'<code>map_chr()</code> returns an atomic character vector and errors if any iteration returns something other than a length-1 character. The <code>~</code> notation creates a quick lambda where <code>.x</code> is the current element, equivalent to <code>function(.x) paste0("item_", .x)</code>.'},
    {'id':'fp_filter', 'type':'mcq', 'diff':2, 'topic':'concepts',
     'q':'<code>Filter(function(x) x &gt; 0, c(-2, -1, 0, 1, 2))</code> returns:',
     'opts':[
        {'t':'<code>c(1, 2)</code>','correct':True},
        {'t':'<code>c(TRUE, TRUE, FALSE, FALSE, FALSE)</code>'},
        {'t':'<code>5</code>'},
        {'t':'<code>c(-2, -1, 0)</code>'},
     ],
     'hints':['Filter keeps elements where the predicate returns TRUE.'],
     'why':'Filter applies the predicate to each element and keeps the ones where it returns TRUE. 0 is dropped because 0 &gt; 0 is FALSE. purrr::keep() and purrr::discard() are the tidyverse equivalents.'},
    {'id':'fp_partial', 'type':'mcq', 'diff':2, 'topic':'purrr',
     'q':'<code>p &lt;- purrr::partial(paste, sep = "-")</code> creates:',
     'opts':[
        {'t':'A pasted string immediately'},
        {'t':'A new function with sep pre-filled, leaving other args open','correct':True},
        {'t':'The original paste function unchanged'},
        {'t':'A list of paste calls'},
     ],
     'hints':['partial = partial application = pre-filling some arguments.'],
     'why':'partial() returns a new function with the specified args already bound. So <code>p("a", "b")</code> calls <code>paste("a", "b", sep = "-")</code> and returns "a-b". Partial application is a lightweight stand-in for currying in R.'},
    {'id':'fp_compose', 'type':'mcq', 'diff':2, 'topic':'purrr',
     'q':'<code>f &lt;- purrr::compose(sqrt, abs)</code> creates a function f such that f(x) equals:',
     'opts':[
        {'t':'<code>sqrt(abs(x))</code> (rightmost runs first)','correct':True},
        {'t':'<code>abs(sqrt(x))</code> (leftmost runs first)'},
        {'t':'<code>sqrt(x) + abs(x)</code>'},
        {'t':'<code>sqrt(x) * abs(x)</code>'},
     ],
     'hints':['compose() applies right-to-left by default, matching mathematical composition.'],
     'why':'<code>compose(sqrt, abs)</code> behaves like <code>function(x) sqrt(abs(x))</code> -- the rightmost function runs first, matching the math notation f ∘ g. Pass <code>.dir = "forward"</code> to reverse the order if you prefer left-to-right pipeline-style composition.'},

    # Hard MCQ (3)
    {'id':'fp_pure', 'type':'mcq', 'diff':3, 'topic':'concepts',
     'q':'Which property must a "pure" function have?',
     'opts':[
        {'t':'It is shorter than 10 lines'},
        {'t':'Same input always yields same output, and it has no observable side effects','correct':True},
        {'t':'It cannot use control flow'},
        {'t':'It always returns NULL'},
     ],
     'hints':['Pure = deterministic + no side effects.'],
     'why':'A pure function depends only on its inputs (deterministic, no hidden global reads, no rng without a seed) and produces no observable side effects (no IO, no mutation outside its scope). Pure functions compose cleanly, are easy to test, and safe to memoize or parallelize.'},
    {'id':'fp_currying', 'type':'mcq', 'diff':3, 'topic':'concepts',
     'q':'Currying transforms a function <code>f(a, b, c)</code> into:',
     'opts':[
        {'t':'A faster compiled version of f'},
        {'t':'A chain of unary functions: <code>f(a)(b)(c)</code>','correct':True},
        {'t':'A version that ignores some arguments'},
        {'t':'A type-checked version'},
     ],
     'hints':['Currying = nested single-argument functions, one per original parameter.'],
     'why':'Currying converts a multi-argument function into a sequence of single-argument functions, each returning the next. R does not curry automatically, but you can simulate it with nested closures or use partial application (purrr::partial) to fix some arguments and leave others free.'},
    {'id':'fp_walk_vs_map', 'type':'mcq', 'diff':3, 'topic':'purrr',
     'q':'When should you reach for <code>walk()</code> instead of <code>map()</code>?',
     'opts':[
        {'t':'When the input is a file path'},
        {'t':'When you call the function for its side effects and do not need a collected result','correct':True},
        {'t':'When the input is a list rather than a vector'},
        {'t':'They are interchangeable'},
     ],
     'hints':['walk is the side-effect twin of map.'],
     'why':'<code>walk()</code> behaves like map() but invisibly returns the input unchanged. Use it when you want side effects (print, save_plot, write_csv) without the noise or cost of collecting return values. It also keeps pipelines chain-able because it returns the input.'},

    # Easy code (2)
    {'id':'fp_code_map_dbl', 'type':'code', 'diff':1, 'topic':'purrr',
     'prompt':'Write <code>squares(x)</code> that takes a numeric vector and returns a numeric vector where each element is the square of the input. Use <code>purrr::map_dbl()</code> with a tilde-formula lambda.',
     'fnName':'squares',
     'starter':'library(purrr)\n\nsquares <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(squares(c(1, 2, 3)), c(1, 4, 9)))\nstopifnot(identical(squares(c(0, -2)), c(0, 4)))\nstopifnot(length(squares(numeric(0))) == 0)',
     'hints':['map_dbl(x, ~ .x ^ 2). The .x placeholder is the current element.'],
     'why':'<code>map_dbl(x, ~ .x ^ 2)</code>. map_dbl insists each iteration yields a length-1 numeric and assembles them into an atomic numeric vector, so type bugs surface immediately. The <code>~</code> creates a one-liner lambda with <code>.x</code> bound to the current element.'},
    {'id':'fp_code_keep_evens', 'type':'code', 'diff':1, 'topic':'concepts',
     'prompt':'Write <code>keep_evens(x)</code> that returns only the even elements of integer vector <code>x</code>, preserving order. Use <code>Filter()</code>.',
     'fnName':'keep_evens',
     'starter':'keep_evens <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(keep_evens(1:10), c(2L, 4L, 6L, 8L, 10L)))\nstopifnot(identical(keep_evens(c(1L, 3L, 5L)), integer(0)))\nstopifnot(identical(keep_evens(c(2L, 4L)), c(2L, 4L)))',
     'hints':['Filter(function(n) n %% 2 == 0, x) keeps elements where the predicate is TRUE.'],
     'why':'<code>Filter(function(n) n %% 2 == 0, x)</code>. Filter walks the input applying the predicate and retains TRUE elements. It preserves order and type, and returns an empty vector of the same type when nothing matches.'},

    # Medium code (2)
    {'id':'fp_code_reduce_concat', 'type':'code', 'diff':2, 'topic':'reduce',
     'prompt':'Write <code>concat_strings(strs, sep)</code> that takes a character vector and a separator and returns a single string joining the elements with <code>sep</code>. Use <code>Reduce()</code>; do NOT use <code>paste(collapse = ...)</code>. Empty input returns "".',
     'fnName':'concat_strings',
     'starter':'concat_strings <- function(strs, sep) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(concat_strings(c("a","b","c"), "-") == "a-b-c")\nstopifnot(concat_strings(c("hello","world"), " ") == "hello world")\nstopifnot(concat_strings("one", "-") == "one")\nstopifnot(concat_strings(character(0), "-") == "")',
     'hints':['Reduce(function(acc, s) paste0(acc, sep, s), strs) folds left to right.','Guard the empty case explicitly: return "" up front.'],
     'why':'<code>if (length(strs) == 0) "" else Reduce(function(acc, s) paste0(acc, sep, s), strs)</code>. Reduce folds left to right, threading the accumulator through. The empty-input guard avoids Reduce raising on an empty vector without init.'},
    {'id':'fp_code_pipeline', 'type':'code', 'diff':2, 'topic':'concepts',
     'prompt':'Write <code>make_pipeline(funcs)</code> that takes a list of single-argument functions and returns a new function that applies them LEFT to RIGHT to its input. For example, make_pipeline(list(abs, sqrt, round))(-16) must return 4. An empty list must yield the identity function.',
     'fnName':'make_pipeline',
     'starter':'make_pipeline <- function(funcs) {\n  # Your code here\n  \n}',
     'tests':'p <- make_pipeline(list(abs, sqrt, round))\nstopifnot(p(-16) == 4)\nstopifnot(p(-25) == 5)\nq <- make_pipeline(list(function(x) x + 1, function(x) x * 2))\nstopifnot(q(3) == 8)\nidentity_p <- make_pipeline(list())\nstopifnot(identical(identity_p(42), 42))',
     'hints':['Return function(x) Reduce(function(acc, f) f(acc), funcs, init = x).','With init = x and an empty funcs list, Reduce returns init unchanged.'],
     'why':'<code>function(x) Reduce(function(acc, f) f(acc), funcs, init = x)</code>. Reduce with init threads x through each function in order. Empty funcs returns the init unchanged, giving identity behaviour for free. This is exactly how purrr::compose(..., .dir = "forward") works under the hood.'},

    # Hard code (2)
    {'id':'fp_code_memoize', 'type':'code', 'diff':3, 'topic':'closures',
     'prompt':'Write <code>memoize(f)</code> that takes a single-argument function and returns a new function that caches its results. Repeated calls with the same argument must return the cached value without re-running f. Each memoize() call gets its own private cache.',
     'fnName':'memoize',
     'starter':'memoize <- function(f) {\n  # Your code here\n  \n}',
     'tests':'call_count <- 0\nslow_double <- function(x) { call_count <<- call_count + 1; x * 2 }\nfast <- memoize(slow_double)\nstopifnot(fast(3) == 6)\nstopifnot(fast(3) == 6)\nstopifnot(fast(3) == 6)\nstopifnot(call_count == 1)\nstopifnot(fast(4) == 8)\nstopifnot(call_count == 2)\nfast2 <- memoize(slow_double)\ncall_count <- 0\nstopifnot(fast2(3) == 6)\nstopifnot(call_count == 1)',
     'hints':['Create the cache in the enclosing scope: cache <- new.env(hash = TRUE).','Return function(x) { key <- as.character(x); if (!exists(key, envir = cache, inherits = FALSE)) cache[[key]] <- f(x); cache[[key]] }.'],
     'why':'<code>cache &lt;- new.env(hash = TRUE); function(x) { key &lt;- as.character(x); if (!exists(key, envir = cache, inherits = FALSE)) cache[[key]] &lt;- f(x); cache[[key]] }</code>. The cache lives in the closure, so each memoize() call gets a fresh environment. inherits = FALSE prevents exists() from climbing parent environments.'},
    {'id':'fp_code_safe_div', 'type':'code', 'diff':3, 'topic':'concepts',
     'prompt':'Write <code>safe_div(a, b)</code> that returns a two-element list: <code>result</code> is a/b on success or NULL when b is 0, and <code>error</code> is NULL on success or the string "division by zero" when b is 0. Do not throw an error.',
     'fnName':'safe_div',
     'starter':'safe_div <- function(a, b) {\n  # Your code here\n  \n}',
     'tests':'r1 <- safe_div(10, 2)\nstopifnot(is.list(r1))\nstopifnot(r1$result == 5)\nstopifnot(is.null(r1$error))\nr2 <- safe_div(10, 0)\nstopifnot(is.null(r2$result))\nstopifnot(r2$error == "division by zero")\nr3 <- safe_div(-6, 3)\nstopifnot(r3$result == -2)\nstopifnot(is.null(r3$error))',
     'hints':['Branch on b == 0 and return a two-element list each way.','This is the same shape purrr::safely() wraps functions to return.'],
     'why':'<code>if (b == 0) list(result = NULL, error = "division by zero") else list(result = a / b, error = NULL)</code>. This is the Result/Either pattern in R and exactly the shape <code>purrr::safely()</code> produces. Callers can compose without try/tryCatch noise and inspect the error field for branching.'},
]


# ---------------------------------------------------------------------------
# Quiz specs — each entry generates one quiz file
# ---------------------------------------------------------------------------
QUIZZES = [
    {
        'slug': 'R-Beginner-Exercises-quiz.html',
        'hub_html': 'R-Beginner-Exercises.html',
        'hub_slug': 'r-fundamentals',
        'hub_label': 'R Fundamentals',
        'cert_title': 'R Fundamentals',
        'narr': 'Awarded for passing a concept-and-code assessment of R fundamentals: vectors, control flow, functions, and core data structures on r-statistics.co.',
        'lede': 'A concept-and-code assessment of R fundamentals: vectors, control flow, functions, and the core data structures. Pass once and your certificate is permanent and publicly verifiable. Take it when you feel ready.',
        'topic_summary': 'R fundamentals: vectors, control flow, functions, and core data structures',
        'storage_key': 'rstat_r_fundamentals_quiz_v2',
        'meta_desc': 'Pass a 10-question R Fundamentals assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable R Fundamentals Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': R_FUNDAMENTALS_BANK,
    },
    {
        'slug': 'ggplot2-Exercises-in-R-quiz.html',
        'hub_html': 'ggplot2-Exercises-in-R.html',
        'hub_slug': 'ggplot2',
        'hub_label': 'ggplot2',
        'cert_title': 'ggplot2',
        'narr': 'Awarded for passing a concept-and-code assessment of ggplot2 grammar, geoms, aesthetics, scales, and facets on r-statistics.co.',
        'lede': 'A concept-and-code assessment of ggplot2: the grammar, geoms, aesthetic mappings, scales, themes, and facets. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'ggplot2 grammar: geoms, aesthetics, scales, themes, and facets',
        'storage_key': 'rstat_ggplot2_quiz_v2',
        'meta_desc': 'Pass a 10-question ggplot2 assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable ggplot2 Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': GGPLOT2_BANK,
    },
    {
        'slug': 'Hypothesis-Testing-Exercises-in-R-quiz.html',
        'hub_html': 'Hypothesis-Testing-Exercises-in-R.html',
        'hub_slug': 'hypothesis-testing',
        'hub_label': 'Hypothesis Testing',
        'cert_title': 'Hypothesis Testing',
        'narr': 'Awarded for passing a concept-and-code assessment of statistical inference: t-tests, chi-square, paired tests, p-values, power, and multiple-testing corrections on r-statistics.co.',
        'lede': 'A concept-and-code assessment of statistical inference: t-tests, chi-square, paired tests, p-values, power, and multiple-testing corrections. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'statistical inference: t-tests, chi-square, p-values, power, and corrections',
        'storage_key': 'rstat_hypothesis_testing_quiz_v2',
        'meta_desc': 'Pass a 10-question Hypothesis Testing assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable Hypothesis Testing Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': HYPOTHESIS_BANK,
    },
    {
        'slug': 'Linear-Regression-Exercises-in-R-quiz.html',
        'hub_html': 'Linear-Regression-Exercises-in-R.html',
        'hub_slug': 'linear-regression',
        'hub_label': 'Linear Regression',
        'cert_title': 'Linear Regression',
        'narr': 'Awarded for passing a concept-and-code assessment of linear regression: fitting, interpretation, diagnostics, multicollinearity, and the path to logistic regression on r-statistics.co.',
        'lede': 'A concept-and-code assessment of linear regression: fitting with lm(), interpretation, diagnostics, multicollinearity, and how it generalizes to logistic regression. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'linear regression: fitting, interpretation, diagnostics, multicollinearity, and glm',
        'storage_key': 'rstat_linear_regression_quiz_v2',
        'meta_desc': 'Pass a 10-question Linear Regression assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable Linear Regression Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': REGRESSION_BANK,
    },
    {
        'slug': 'Machine-Learning-Exercises-in-R-quiz.html',
        'hub_html': 'Machine-Learning-Exercises-in-R.html',
        'hub_slug': 'machine-learning',
        'hub_label': 'Machine Learning',
        'cert_title': 'Machine Learning',
        'narr': 'Awarded for passing a concept-and-code assessment of machine learning workflow, validation, classification metrics, regularization, and core algorithms (random forest, k-means, logistic) on r-statistics.co.',
        'lede': 'A concept-and-code assessment of machine learning: train/test workflow, cross-validation, classifier metrics, regularization, and core algorithms (random forest, k-means, logistic regression). Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'machine learning: train/test workflow, CV, metrics, regularization, and algorithms',
        'storage_key': 'rstat_machine_learning_quiz_v2',
        'meta_desc': 'Pass a 10-question Machine Learning assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable Machine Learning Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': ML_BANK,
    },
    {
        'slug': 'tidyr-Exercises-in-R-quiz.html',
        'hub_html': 'tidyr-Exercises-in-R.html',
        'hub_slug': 'tidyr',
        'hub_label': 'tidyr',
        'cert_title': 'tidyr',
        'narr': 'Awarded for passing a concept-and-code assessment of tidyr: pivoting, separating, nesting, completing, and the tidy-data principle on r-statistics.co.',
        'lede': 'A concept-and-code assessment of tidyr: pivot_longer / pivot_wider, separate / unite, nest / unnest, drop_na, complete, and the tidy-data principle. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'tidyr: pivoting, separating, nesting, completing, and tidy data',
        'storage_key': 'rstat_tidyr_quiz_v2',
        'meta_desc': 'Pass a 10-question tidyr assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable tidyr Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': TIDYR_BANK,
    },
    {
        'slug': 'Time-Series-Exercises-in-R-quiz.html',
        'hub_html': 'Time-Series-Exercises-in-R.html',
        'hub_slug': 'time-series',
        'hub_label': 'Time Series',
        'cert_title': 'Time Series',
        'narr': 'Awarded for passing a concept-and-code assessment of time series: ts objects, autocorrelation, stationarity, ARIMA, ETS, decomposition, and forecasting on r-statistics.co.',
        'lede': 'A concept-and-code assessment of time series: ts objects, autocorrelation, stationarity testing, differencing, ARIMA and ETS models, decomposition, and forecasting. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'time series: ts objects, ARIMA, ETS, stationarity, and forecasting',
        'storage_key': 'rstat_time_series_quiz_v2',
        'meta_desc': 'Pass a 10-question Time Series assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable Time Series Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': TIME_SERIES_BANK,
    },
    {
        'slug': 'Shiny-Exercises-in-R-quiz.html',
        'hub_html': 'Shiny-Exercises-in-R.html',
        'hub_slug': 'shiny',
        'hub_label': 'Shiny',
        'cert_title': 'Shiny',
        'narr': 'Awarded for passing a concept-and-code assessment of Shiny: UI/server architecture, reactive expressions, observers, modules, and session handling on r-statistics.co.',
        'lede': 'A concept-and-code assessment of Shiny: UI + server architecture, reactivity, render functions, observeEvent, reactiveVal, modules, and session handling. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'Shiny: UI, server, reactivity, modules, and session handling',
        'storage_key': 'rstat_shiny_quiz_v2',
        'meta_desc': 'Pass a 10-question Shiny assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable Shiny Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': SHINY_BANK,
    },
    {
        'slug': 'R-Interview-Questions-quiz.html',
        'hub_html': 'R-Interview-Questions.html',
        'hub_slug': 'r-interview',
        'hub_label': 'R Interview Readiness',
        'cert_title': 'R Interview Readiness',
        'narr': 'Awarded for passing a concept-and-code assessment covering R fundamentals, scoping, closures, vectorization, S3, NSE, and common interview-style algorithmic problems on r-statistics.co.',
        'lede': 'A concept-and-code assessment covering R fundamentals, scoping, closures, vectorization, S3, NSE, and common interview-style problems. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'R interview prep: fundamentals, scoping, closures, NSE, and algorithms',
        'storage_key': 'rstat_r_interview_quiz_v2',
        'meta_desc': 'Pass a 10-question R Interview Readiness assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable R Interview Readiness Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': INTERVIEW_BANK,
    },
    {
        'slug': 'R-Functional-Programming-Exercises-quiz.html',
        'hub_html': 'R-Functional-Programming-Exercises.html',
        'hub_slug': 'r-functional-programming',
        'hub_label': 'Functional Programming',
        'cert_title': 'Functional Programming',
        'narr': 'Awarded for passing a concept-and-code assessment of functional programming in R: higher-order functions, purrr map/reduce/filter, closures, currying, memoization, and pure-function discipline on r-statistics.co.',
        'lede': 'A concept-and-code assessment of functional programming in R: higher-order functions, the purrr map/reduce/filter family, closures, currying, memoization, and pure-function discipline. Pass once and your certificate is permanent and publicly verifiable.',
        'topic_summary': 'functional programming: map/reduce/filter, closures, currying, and purrr',
        'storage_key': 'rstat_r_fp_quiz_v2',
        'meta_desc': 'Pass a 10-question Functional Programming assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        'og_desc': 'Earn a verifiable Functional Programming Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.',
        'bank': FP_BANK,
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _issuance_baseline(hub_slug):
    """Match build.py's _issuance_baseline so quiz intro == hub banner."""
    TIER_1 = {'dplyr', 'ggplot2', 'tidyr', 'lubridate', 'stringr', 'purrr',
              'tidyverse', 'data.table'}
    TIER_2 = {'eda', 'data-cleaning', 'data-wrangling', 'data-visualization',
              'linear-regression', 'logistic-regression', 'random-forest',
              'time-series', 'hypothesis-testing', 'machine-learning',
              'correlation', 'anova', 'xgboost', 'clustering', 'pca',
              'cross-validation', 'r-beginner', 'r-interview', 'tidymodels',
              'a-b-testing', 'ab-testing', 'shiny', 'r-for-data-science',
              'apply-family', 'r-markdown', 'r-for-finance', 'r-for-healthcare',
              'r-for-marketing-analytics', 'arima', 't-test', 'chi-square-test',
              'probability-distributions', 'sampling-methods', 'regex',
              'dbplyr-sql', 'readr', 'broom', 'forcats', 'plotly', 'leaflet',
              'gt-tables', 'web-scraping', 'api-calls'}
    key = (hub_slug or '').lower()
    h = int(hashlib.md5(key.encode('utf-8')).hexdigest()[:6], 16)
    if key in TIER_1:
        return 700 + (h % 800)
    if key in TIER_2:
        return 180 + (h % 380)
    return 50 + (h % 160)


def render_bank_to_js(bank):
    """Render a Python list of question dicts to the JS BANK array literal."""
    def render_q(q):
        lines = ['    {']
        lines.append(f"      id:{json.dumps(q['id'])}, type:{json.dumps(q['type'])}, "
                     f"diff:{q['diff']}, topic:{json.dumps(q['topic'])},")
        if q['type'] == 'mcq':
            lines.append(f"      q:{json.dumps(q['q'])},")
            lines.append("      opts:[")
            for opt in q['opts']:
                bits = [f"t:{json.dumps(opt['t'])}"]
                if opt.get('correct'):
                    bits.append("correct:true")
                lines.append("        {" + ", ".join(bits) + "},")
            lines.append("      ],")
        else:
            lines.append(f"      prompt:{json.dumps(q['prompt'])}, fnName:{json.dumps(q['fnName'])},")
            lines.append(f"      starter:{json.dumps(q['starter'])},")
            lines.append(f"      tests:{json.dumps(q['tests'])},")
        if q.get('hints'):
            lines.append(f"      hints:{json.dumps(q['hints'])},")
        lines.append(f"      why:{json.dumps(q['why'])}")
        lines.append('    }')
        return '\n'.join(lines)
    return 'var BANK = [\n' + ',\n'.join(render_q(q) for q in bank) + '\n  ];'


# ---------------------------------------------------------------------------
# Generator
# ---------------------------------------------------------------------------
def generate_one(template, spec):
    out = template

    # Title and meta
    out = out.replace(
        '<title>dplyr Mastery Assessment: Earn the Certificate | r-statistics.co</title>',
        f'<title>{spec["hub_label"]} Mastery Assessment: Earn the Certificate | r-statistics.co</title>')
    out = out.replace(
        'Pass a 10-question dplyr assessment (concept MCQs + live R code-writing) to earn a verifiable r-statistics.co Mastery Certificate. Honor-coded, LinkedIn-shareable.',
        spec['meta_desc'])
    out = out.replace(
        'dplyr quiz, dplyr certificate, R certification, dplyr practice, dplyr assessment, r-statistics quiz',
        f'{spec["hub_label"]} quiz, {spec["hub_label"]} certificate, R certification, {spec["hub_label"]} practice, {spec["hub_label"]} assessment, r-statistics quiz')
    out = out.replace(
        'href="https://r-statistics.co/dplyr-Exercises-in-R-quiz.html"',
        f'href="https://r-statistics.co/{spec["slug"]}"')
    out = out.replace(
        '<meta property="og:title" content="dplyr Mastery Assessment | r-statistics.co">',
        f'<meta property="og:title" content="{spec["hub_label"]} Mastery Assessment | r-statistics.co">')
    out = out.replace(
        '<meta property="og:description" content="Earn a verifiable dplyr Mastery Certificate. 7 concept MCQs + 3 live R coding questions. ~12 minutes.">',
        f'<meta property="og:description" content="{spec["og_desc"]}">')
    out = out.replace(
        '<meta property="og:url" content="https://r-statistics.co/dplyr-Exercises-in-R-quiz.html">',
        f'<meta property="og:url" content="https://r-statistics.co/{spec["slug"]}">')

    # Hero / lede / masthead
    out = out.replace('"ASSESSMENT IN PROGRESS · dplyr Mastery"', f'"ASSESSMENT IN PROGRESS · {spec["hub_label"]} Mastery"')
    out = out.replace('<strong>dplyr Mastery</strong>', f'<strong>{spec["hub_label"]} Mastery</strong>')
    out = out.replace('<h1 class="q-title">dplyr Mastery Assessment</h1>',
                      f'<h1 class="q-title">{spec["hub_label"]} Mastery Assessment</h1>')
    out = out.replace(
        'A concept-and-code assessment of dplyr verbs, joins, and grouped\n      operations. Pass once and your certificate is permanent and publicly\n      verifiable. Take it when you feel ready.',
        spec['lede'])

    # Pass screen title + cert title + cert narrative
    out = out.replace('You earned the dplyr Mastery Certificate',
                      f'You earned the {spec["hub_label"]} Mastery Certificate')
    out = out.replace('<p class="cert-title">dplyr</p>',
                      f'<p class="cert-title">{spec["cert_title"]}</p>')
    out = out.replace(
        'Awarded for passing a concept-and-code assessment of dplyr verbs,\n          joins, and grouped operations on r-statistics.co.',
        spec['narr'])

    # Back / exit / footer links
    out = out.replace('href="/dplyr-Exercises-in-R.html"', f'href="/{spec["hub_html"]}"')
    out = out.replace('dplyr exercises</a>', f'{spec["hub_label"].lower()} exercises</a>')

    # CONFIG — match the original block exactly
    new_config = (
        "  var CONFIG = {\n"
        f"    hubSlug: {json.dumps(spec['hub_slug'])},\n"
        f"    hubLabel: {json.dumps(spec['hub_label'])},\n"
        "    passXP: 13,\n"
        f"    storageKey: {json.dumps(spec['storage_key'])},\n"
        f"    learnersBase: {_issuance_baseline(spec['hub_slug'])},\n"
        f"    learnersSeed: {json.dumps(spec['hub_slug'] + '-q1')},\n"
        "    sampling: {\n"
        "      // count of each (type, diff) tuple to pull\n"
        "      'mcq_1': 3, 'mcq_2': 3, 'mcq_3': 1,\n"
        "      'code_1': 1, 'code_2': 1, 'code_3': 1\n"
        "    }\n"
        "  };"
    )
    out = re.sub(
        r"  var CONFIG = \{[\s\S]*?\n  \};",
        lambda _: new_config,
        out,
        count=1,
    )

    # BANK array
    new_bank = '  ' + render_bank_to_js(spec['bank'])
    out = re.sub(
        r"  var BANK = \[[\s\S]*?\n  \];",
        lambda _: new_bank,
        out,
        count=1,
    )

    return out


def main():
    with open(TEMPLATE_PATH, encoding='utf-8') as f:
        template = f.read()

    for spec in QUIZZES:
        rendered = generate_one(template, spec)
        out_path = os.path.join(REPO_ROOT, spec['slug'])
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(rendered)
        print(f'  Generated {spec["slug"]} ({len(spec["bank"])} questions, '
              f'baseline {_issuance_baseline(spec["hub_slug"])})')


if __name__ == '__main__':
    main()
