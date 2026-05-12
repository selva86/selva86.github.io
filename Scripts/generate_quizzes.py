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
    # Easy MCQ (need 3 for sample, 4 in pool)
    {'id':'rf_assign', 'type':'mcq', 'diff':1, 'topic':'syntax',
     'q':'Which is the recommended assignment operator in R?',
     'opts':[{'t':'<code>=</code>'},{'t':'<code>&lt;-</code>','correct':True},{'t':'<code>:=</code>'},{'t':'<code>==</code>'}],
     'hints':['One of these performs comparison, not assignment.'],
     'why':'<code>&lt;-</code> is the conventional R assignment operator. <code>=</code> works in most contexts but the community style guide prefers <code>&lt;-</code>. <code>==</code> tests equality.'},
    {'id':'rf_vec', 'type':'mcq', 'diff':1, 'topic':'vectors',
     'q':'Which function creates a numeric vector?',
     'opts':[{'t':'<code>vec(1, 2, 3)</code>'},{'t':'<code>c(1, 2, 3)</code>','correct':True},{'t':'<code>list(1, 2, 3)</code>'},{'t':'<code>array(1, 2, 3)</code>'}],
     'hints':['c() stands for "combine" or "concatenate".'],
     'why':'<code>c()</code> combines values into an atomic vector. <code>list()</code> creates a list (heterogeneous). <code>vec()</code> does not exist in base R.'},
    {'id':'rf_class', 'type':'mcq', 'diff':1, 'topic':'types',
     'q':'What does <code>class(c(1L, 2L, 3L))</code> return?',
     'opts':[{'t':'<code>"numeric"</code>'},{'t':'<code>"integer"</code>','correct':True},{'t':'<code>"double"</code>'},{'t':'<code>"vector"</code>'}],
     'hints':['The L suffix forces a specific numeric subtype.'],
     'why':'The <code>L</code> suffix creates integer literals. Without it (e.g., <code>c(1, 2, 3)</code>) you get "numeric" (a.k.a. double).'},
    {'id':'rf_index', 'type':'mcq', 'diff':1, 'topic':'indexing',
     'q':'What does <code>x[1]</code> return for <code>x &lt;- c(10, 20, 30)</code>?',
     'opts':[{'t':'<code>10</code>','correct':True},{'t':'<code>20</code>'},{'t':'<code>NULL</code>'},{'t':'an error (1-indexed)'}],
     'hints':['R is 1-indexed, unlike Python.'],
     'why':'R indexes from 1, so <code>x[1]</code> is the first element. <code>x[0]</code> returns a zero-length vector, not an error.'},

    # Medium MCQ (need 3, 4 in pool)
    {'id':'rf_list_vs_vec', 'type':'mcq', 'diff':2, 'topic':'data structures',
     'q':'How does a <code>list</code> differ from a <code>vector</code>?',
     'opts':[
        {'t':'They are identical'},
        {'t':'Lists can hold elements of different types; atomic vectors cannot','correct':True},
        {'t':'Vectors can be named; lists cannot'},
        {'t':'Lists are always 1-dimensional; vectors can be multi-dimensional'},
     ],
     'hints':['Try c("a", 1) and see what R does to the number.'],
     'why':'Atomic vectors coerce to a single type (e.g., c("a", 1) becomes character). Lists keep each element\'s type intact.'},
    {'id':'rf_recycle', 'type':'mcq', 'diff':2, 'topic':'recycling',
     'q':'What does <code>c(1, 2, 3, 4) + c(10, 20)</code> return?',
     'opts':[
        {'t':'<code>c(11, 22)</code>'},
        {'t':'<code>c(11, 22, 13, 24)</code>','correct':True},
        {'t':'<code>c(11, 22, 3, 4)</code>'},
        {'t':'an error (different lengths)'},
     ],
     'hints':['R recycles the shorter vector when lengths differ but one divides the other.','Compute: index 1 gets 1+10, index 2 gets 2+20, index 3 gets 3+10 (recycled), index 4 gets 4+20 (recycled).'],
     'why':'Vectorized operations recycle: c(10,20) gets repeated to length 4 → c(10,20,10,20), then summed with c(1,2,3,4) → c(11,22,13,24). A warning fires when lengths don\'t divide cleanly.'},
    {'id':'rf_na', 'type':'mcq', 'diff':2, 'topic':'NA',
     'q':'What does <code>mean(c(1, 2, NA, 4))</code> return?',
     'opts':[
        {'t':'<code>2.33</code>'},
        {'t':'<code>NA</code>','correct':True},
        {'t':'<code>1.75</code>'},
        {'t':'an error'},
     ],
     'hints':['By default, NA propagates through arithmetic.','To skip NAs, pass <code>na.rm = TRUE</code>.'],
     'why':'mean() returns NA when any input is NA, unless you pass <code>na.rm = TRUE</code>, which gives mean(c(1,2,4)) = 2.33.'},
    {'id':'rf_factor', 'type':'mcq', 'diff':2, 'topic':'factors',
     'q':'What is a factor in R?',
     'opts':[
        {'t':'A function for computing combinatorial factorials'},
        {'t':'A vector type for categorical data with predefined levels','correct':True},
        {'t':'A statistical model object'},
        {'t':'An alias for character vector'},
     ],
     'hints':['Factors are how R represents categorical variables.'],
     'why':'A factor stores categorical data as integers backed by a vector of unique "levels". Useful for ordered/unordered categories in models and plots.'},

    # Hard MCQ (need 1, 3 in pool)
    {'id':'rf_lapply', 'type':'mcq', 'diff':3, 'topic':'apply family',
     'q':'<code>lapply(1:3, function(x) x^2)</code> returns:',
     'opts':[
        {'t':'<code>c(1, 4, 9)</code>'},
        {'t':'A list: <code>list(1, 4, 9)</code>','correct':True},
        {'t':'<code>matrix(c(1, 4, 9))</code>'},
        {'t':'<code>3</code>'},
     ],
     'hints':['lapply always returns a list. sapply tries to simplify.'],
     'why':'lapply() returns a list of the same length as the input. sapply() does the same but tries to simplify the result (e.g., to a vector).'},
    {'id':'rf_lexical', 'type':'mcq', 'diff':3, 'topic':'scoping',
     'q':'What does this return?<br><pre style="margin:8px 0;background:#1e2734;color:#e1e6ee;padding:10px 14px;border-radius:4px;font-size:13px">x &lt;- 1\nf &lt;- function() x + 1\nx &lt;- 10\nf()</pre>',
     'opts':[
        {'t':'<code>2</code>'},
        {'t':'<code>11</code>','correct':True},
        {'t':'an error'},
        {'t':'<code>NULL</code>'},
     ],
     'hints':['R uses lexical scoping but looks up free variables at call time, not at function definition time.'],
     'why':'R resolves free variables when the function is called, not when it is defined. So f() looks up x = 10 (current value) and returns 11.'},
    {'id':'rf_dotdotdot', 'type':'mcq', 'diff':3, 'topic':'functions',
     'q':'What does <code>...</code> mean in an R function signature?',
     'opts':[
        {'t':'Default value placeholder'},
        {'t':'Variadic arguments — any number of additional named or unnamed arguments','correct':True},
        {'t':'A pending implementation marker (like TODO)'},
        {'t':'Means the function is deprecated'},
     ],
     'hints':['Functions like c(), paste(), and sum() use ... to accept any number of args.'],
     'why':'<code>...</code> ("dot-dot-dot") collects any number of extra arguments. You can forward them to another function with another <code>...</code>.'},

    # Easy code (need 1, 2 in pool)
    {'id':'rf_code_sumvec', 'type':'code', 'diff':1, 'topic':'vectors',
     'prompt':'Write a function <code>sum_squares(x)</code> that returns the sum of the squares of the numeric vector <code>x</code>. Use vectorized R, not a loop.',
     'fnName':'sum_squares',
     'starter':'sum_squares <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(sum_squares(c(1, 2, 3)) == 14)\nstopifnot(sum_squares(c(0)) == 0)\nstopifnot(abs(sum_squares(c(-2, 2)) - 8) < 1e-9)',
     'hints':['x^2 squares every element, then sum() reduces to a single number.'],
     'why':'<code>sum(x^2)</code> is the idiomatic one-liner: <code>x^2</code> is vectorized, <code>sum()</code> reduces.'},
    {'id':'rf_code_filter', 'type':'code', 'diff':1, 'topic':'indexing',
     'prompt':'Write a function <code>keep_positive(x)</code> that returns only the strictly positive elements of the numeric vector <code>x</code>.',
     'fnName':'keep_positive',
     'starter':'keep_positive <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(keep_positive(c(-1, 0, 1, 2)), c(1, 2)))\nstopifnot(length(keep_positive(c(-1, -2))) == 0)\nstopifnot(identical(keep_positive(c(5, 10)), c(5, 10)))',
     'hints':['x > 0 gives a logical vector. Use it to subset.'],
     'why':'<code>x[x &gt; 0]</code> is the idiomatic logical-subset filter. The condition produces TRUE/FALSE per element; TRUE indexes are kept.'},

    # Medium code (need 1, 2 in pool)
    {'id':'rf_code_fizzbuzz', 'type':'code', 'diff':2, 'topic':'control flow',
     'prompt':'Write <code>fizzbuzz(n)</code> that returns a character vector of length <code>n</code>: for each i from 1 to n, output "Fizz" if i is divisible by 3, "Buzz" if divisible by 5, "FizzBuzz" if divisible by both, otherwise the number as a string.',
     'fnName':'fizzbuzz',
     'starter':'fizzbuzz <- function(n) {\n  # Your code here\n  \n}',
     'tests':'r <- fizzbuzz(15)\nstopifnot(length(r) == 15)\nstopifnot(r[1] == "1")\nstopifnot(r[3] == "Fizz")\nstopifnot(r[5] == "Buzz")\nstopifnot(r[15] == "FizzBuzz")\nstopifnot(r[7] == "7")\nstopifnot(is.character(r))',
     'hints':['Check divisible-by-both FIRST. Otherwise "Fizz" would fire before "FizzBuzz" gets a chance.','sapply() over 1:n with an ifelse cascade is one way; vectorized indexing on result is another.'],
     'why':'A common approach: sapply(1:n, function(i) { if (i %% 15 == 0) "FizzBuzz" else if (i %% 3 == 0) "Fizz" else if (i %% 5 == 0) "Buzz" else as.character(i) }). Test the 15 case before 3 and 5 individually.'},
    {'id':'rf_code_named', 'type':'code', 'diff':2, 'topic':'lists',
     'prompt':'Write <code>name_squares(n)</code> that returns a named numeric vector where element <code>i</code> has name <code>"sq_i"</code> and value <code>i^2</code>, for i from 1 to n.',
     'fnName':'name_squares',
     'starter':'name_squares <- function(n) {\n  # Your code here\n  \n}',
     'tests':'r <- name_squares(3)\nstopifnot(identical(unname(r), c(1, 4, 9)))\nstopifnot(identical(names(r), c("sq_1", "sq_2", "sq_3")))\nstopifnot(length(name_squares(0)) == 0)',
     'hints':['Build the values with (1:n)^2 first.','Use setNames() or assign names() afterward.'],
     'why':'<code>setNames((1:n)^2, paste0("sq_", 1:n))</code> in one expression — vectorized values, vectorized names, then attached.'},

    # Hard code (need 1, 2 in pool)
    {'id':'rf_code_closure', 'type':'code', 'diff':3, 'topic':'closures',
     'prompt':'Write <code>make_counter(start)</code> that returns a function. Each time the returned function is called, it should return the next integer, starting at <code>start</code>. (i.e., it remembers state across calls.)',
     'fnName':'make_counter',
     'starter':'make_counter <- function(start) {\n  # Your code here\n  \n}',
     'tests':'counter <- make_counter(10)\nstopifnot(counter() == 10)\nstopifnot(counter() == 11)\nstopifnot(counter() == 12)\nc2 <- make_counter(0)\nstopifnot(c2() == 0)\nstopifnot(c2() == 1)\nstopifnot(counter() == 13)',
     'hints':['Each call to make_counter() creates a fresh enclosing environment. The returned function can read and update that environment.','Use the <code>&lt;&lt;-</code> ("super-assignment") operator to modify a variable in the enclosing environment.'],
     'why':'Classic closure: the inner function captures <code>i</code> from the enclosing scope and uses <code>&lt;&lt;-</code> to mutate it, which writes to the enclosing environment rather than creating a local.'},
    {'id':'rf_code_apply_cols', 'type':'code', 'diff':3, 'topic':'apply family',
     'prompt':'Write <code>col_means_no_dplyr(df)</code> that returns a named numeric vector of column means for every numeric column in the data frame <code>df</code>. Non-numeric columns must be skipped. Do NOT use dplyr.',
     'fnName':'col_means_no_dplyr',
     'starter':'col_means_no_dplyr <- function(df) {\n  # Your code here\n  \n}',
     'tests':'r <- col_means_no_dplyr(iris)\nnum_cols <- names(iris)[sapply(iris, is.numeric)]\nstopifnot(identical(names(r), num_cols))\nstopifnot(abs(r[["Sepal.Length"]] - mean(iris$Sepal.Length)) < 1e-9)\nstopifnot(!"Species" %in% names(r))\nstopifnot(is.numeric(r))',
     'hints':['sapply(df, is.numeric) gives a logical vector of which columns are numeric.','sapply(df[, numeric_cols, drop = FALSE], mean) computes the means.'],
     'why':'<code>sapply(df[sapply(df, is.numeric)], mean)</code>: the inner sapply identifies numeric columns; the outer sapply applies mean over each. Names propagate automatically.'},
]


# ---------------------------------------------------------------------------
# QUIZ 2: ggplot2 (ggplot2-Exercises-in-R hub)
# ---------------------------------------------------------------------------
GGPLOT2_BANK = [
    # Easy MCQ
    {'id':'gg_layers', 'type':'mcq', 'diff':1, 'topic':'grammar',
     'q':'Which function starts a ggplot2 plot?',
     'opts':[{'t':'<code>plot()</code>'},{'t':'<code>ggplot()</code>','correct':True},{'t':'<code>geom_plot()</code>'},{'t':'<code>aes()</code>'}],
     'hints':['ggplot2 uses a layered grammar. The base is the data + default mappings.'],
     'why':'<code>ggplot(data, aes(...))</code> creates the empty canvas with the data and default aesthetic mappings. Geoms add layers.'},
    {'id':'gg_aes', 'type':'mcq', 'diff':1, 'topic':'aesthetics',
     'q':'What does <code>aes(x = mpg, y = hp)</code> do?',
     'opts':[
        {'t':'Sets the chart title'},
        {'t':'Maps the mpg column to the x-axis and hp to the y-axis','correct':True},
        {'t':'Filters the data to mpg and hp columns'},
        {'t':'Adds a regression line'},
     ],
     'hints':['aes() = aesthetic mappings: how data columns relate to visual properties.'],
     'why':'<code>aes()</code> defines mappings from data columns to visual aesthetics (x, y, color, fill, size, shape, etc.).'},
    {'id':'gg_geom_point', 'type':'mcq', 'diff':1, 'topic':'geoms',
     'q':'Which geom draws a scatterplot?',
     'opts':[{'t':'<code>geom_line()</code>'},{'t':'<code>geom_bar()</code>'},{'t':'<code>geom_point()</code>','correct':True},{'t':'<code>geom_scatter()</code>'}],
     'hints':['Scatter = individual data points.'],
     'why':'<code>geom_point()</code> draws one point per row. <code>geom_scatter()</code> does not exist in ggplot2.'},
    {'id':'gg_color_vs_fill', 'type':'mcq', 'diff':1, 'topic':'aesthetics',
     'q':'For a bar chart, which aesthetic controls the interior color of the bars?',
     'opts':[{'t':'<code>color</code>'},{'t':'<code>fill</code>','correct':True},{'t':'<code>border</code>'},{'t':'<code>shade</code>'}],
     'hints':['color is for outlines/strokes; fill is for solid interiors.'],
     'why':'<code>color</code> sets the outline. <code>fill</code> sets the interior of closed shapes (bars, polygons). For points and lines, only <code>color</code> applies.'},

    # Medium MCQ
    {'id':'gg_facet', 'type':'mcq', 'diff':2, 'topic':'facets',
     'q':'What does <code>facet_wrap(~ Species)</code> do?',
     'opts':[
        {'t':'Adds a legend for Species'},
        {'t':'Splits the plot into one panel per Species level','correct':True},
        {'t':'Filters to one Species'},
        {'t':'Wraps the title with Species'},
     ],
     'hints':['Faceting creates small multiples — one panel per group.'],
     'why':'<code>facet_wrap()</code> creates separate panels for each value of the faceting variable, all sharing the same axes by default.'},
    {'id':'gg_stat_smooth', 'type':'mcq', 'diff':2, 'topic':'stats',
     'q':'<code>geom_smooth(method = "lm")</code> adds:',
     'opts':[
        {'t':'A locally-weighted regression curve'},
        {'t':'A linear regression line with a confidence-interval ribbon','correct':True},
        {'t':'A spline interpolation'},
        {'t':'A horizontal line at the mean'},
     ],
     'hints':['"lm" stands for linear model.'],
     'why':'<code>method = "lm"</code> fits a linear regression. The default is <code>"loess"</code> (locally-weighted). The confidence ribbon is on by default; suppress with <code>se = FALSE</code>.'},
    {'id':'gg_themes', 'type':'mcq', 'diff':2, 'topic':'themes',
     'q':'How do you remove the legend from a ggplot?',
     'opts':[
        {'t':'<code>+ theme(legend.position = "none")</code>','correct':True},
        {'t':'<code>+ no_legend()</code>'},
        {'t':'<code>+ guides("none")</code>'},
        {'t':'<code>aes(legend = FALSE)</code>'},
     ],
     'hints':['theme() controls non-data elements: legend, axis text, panel grid, etc.'],
     'why':'<code>theme(legend.position = "none")</code> removes the legend entirely. <code>guides(color = "none")</code> would remove only the color guide.'},
    {'id':'gg_position', 'type':'mcq', 'diff':2, 'topic':'position',
     'q':'In <code>geom_bar(position = "dodge")</code>, what happens with grouped data?',
     'opts':[
        {'t':'Bars stack on top of each other'},
        {'t':'Bars are placed side-by-side within each x value','correct':True},
        {'t':'Bars are normalized to 100%'},
        {'t':'Bars are sorted left to right by value'},
     ],
     'hints':['"dodge" means side-by-side, "stack" means stacked, "fill" means 100%.'],
     'why':'<code>position = "dodge"</code> places grouped bars next to each other. Stack is the default; fill normalizes each x to sum to 1 (proportions).'},

    # Hard MCQ
    {'id':'gg_inherit', 'type':'mcq', 'diff':3, 'topic':'aesthetics',
     'q':'What does <code>ggplot(df, aes(x, y)) + geom_point(aes(color = z))</code> imply?',
     'opts':[
        {'t':'z mapping applies only to the geom_point layer','correct':True},
        {'t':'z replaces y as the y-axis mapping'},
        {'t':'It throws an error because aes() is duplicated'},
        {'t':'It silently ignores the second aes() call'},
     ],
     'hints':['Aesthetic mappings on a geom only apply to that geom; the ones on ggplot() inherit to all geoms.'],
     'why':'Mappings on <code>ggplot()</code> are defaults for every layer. Mappings inside a geom apply only to that geom and override defaults if they conflict.'},
    {'id':'gg_scale_log', 'type':'mcq', 'diff':3, 'topic':'scales',
     'q':'Which adds a base-10 log scale to the y-axis?',
     'opts':[
        {'t':'<code>+ ylab("log")</code>'},
        {'t':'<code>+ scale_y_log10()</code>','correct':True},
        {'t':'<code>+ log_y()</code>'},
        {'t':'<code>aes(y = log10(y))</code>'},
     ],
     'hints':['scale_*_log10() transforms the axis without changing the data.'],
     'why':'<code>scale_y_log10()</code> applies the log10 transform on the axis. Mapping <code>log10(y)</code> works but breaks tick labels and stat helpers like geom_smooth.'},
    {'id':'gg_save', 'type':'mcq', 'diff':3, 'topic':'output',
     'q':'Which is the recommended way to save a ggplot to disk?',
     'opts':[
        {'t':'<code>png("plot.png"); print(p); dev.off()</code>'},
        {'t':'<code>ggsave("plot.png", p)</code>','correct':True},
        {'t':'<code>write.ggplot("plot.png")</code>'},
        {'t':'<code>save(p, file = "plot.png")</code>'},
     ],
     'hints':['ggsave() handles size, DPI, and format detection from the file extension.'],
     'why':'<code>ggsave()</code> is the idiomatic way. It picks the device from the extension and gives explicit control over width/height/DPI.'},

    # Easy code
    {'id':'gg_code_scatter', 'type':'code', 'diff':1, 'topic':'geoms',
     'prompt':'Write a function <code>mpg_hp_scatter(df)</code> that returns a ggplot object showing a scatterplot of <code>mpg</code> against <code>hp</code> from data frame <code>df</code>. Don\'t add a title or theme — just the basic plot.',
     'fnName':'mpg_hp_scatter',
     'starter':'library(ggplot2)\n\nmpg_hp_scatter <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- mpg_hp_scatter(mtcars)\nstopifnot(inherits(p, "ggplot"))\nstopifnot("GeomPoint" %in% sapply(p$layers, function(l) class(l$geom)[1]))\nstopifnot(rlang::as_name(p$mapping$x) == "mpg")\nstopifnot(rlang::as_name(p$mapping$y) == "hp")',
     'hints':['ggplot(df, aes(x = mpg, y = hp)) + geom_point() is the standard skeleton.'],
     'why':'<code>ggplot(df, aes(x = mpg, y = hp)) + geom_point()</code>. The aesthetic mapping declares the data columns; geom_point adds the visible layer.'},
    {'id':'gg_code_color_by', 'type':'code', 'diff':1, 'topic':'aesthetics',
     'prompt':'Write <code>color_by_cyl(df)</code> that returns a ggplot scatter of <code>mpg</code> vs <code>hp</code> with points colored by <code>cyl</code> (treat <code>cyl</code> as a factor so the colors are discrete).',
     'fnName':'color_by_cyl',
     'starter':'library(ggplot2)\n\ncolor_by_cyl <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- color_by_cyl(mtcars)\nstopifnot(inherits(p, "ggplot"))\nstopifnot("colour" %in% names(p$mapping))\nbuilt <- ggplot_build(p)\nstopifnot(length(unique(built$data[[1]]$colour)) >= 3)',
     'hints':['Use aes(color = factor(cyl)).','factor(cyl) tells ggplot to treat cyl as a categorical variable, giving discrete color buckets.'],
     'why':'<code>ggplot(df, aes(x = mpg, y = hp, color = factor(cyl))) + geom_point()</code>. Without factor(), cyl is numeric and you\'d get a continuous gradient.'},

    # Medium code
    {'id':'gg_code_facet', 'type':'code', 'diff':2, 'topic':'facets',
     'prompt':'Write <code>scatter_per_species(df)</code> that scatters <code>Sepal.Length</code> vs <code>Petal.Length</code> and creates one panel per <code>Species</code> using <code>facet_wrap()</code>.',
     'fnName':'scatter_per_species',
     'starter':'library(ggplot2)\n\nscatter_per_species <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- scatter_per_species(iris)\nstopifnot(inherits(p, "ggplot"))\nstopifnot(inherits(p$facet, "FacetWrap"))\nstopifnot("GeomPoint" %in% sapply(p$layers, function(l) class(l$geom)[1]))',
     'hints':['facet_wrap(~ Species) creates one panel per Species level.','Use vars(Species) or the formula form ~ Species.'],
     'why':'<code>ggplot(df, aes(Sepal.Length, Petal.Length)) + geom_point() + facet_wrap(~ Species)</code>. Three Species levels → three panels.'},
    {'id':'gg_code_lm', 'type':'code', 'diff':2, 'topic':'stats',
     'prompt':'Write <code>scatter_with_lm(df)</code> that produces a scatterplot of <code>mpg</code> vs <code>hp</code> WITH a linear regression line overlay (and its confidence ribbon).',
     'fnName':'scatter_with_lm',
     'starter':'library(ggplot2)\n\nscatter_with_lm <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- scatter_with_lm(mtcars)\nstopifnot(inherits(p, "ggplot"))\ngeoms <- sapply(p$layers, function(l) class(l$geom)[1])\nstopifnot("GeomPoint" %in% geoms)\nstopifnot("GeomSmooth" %in% geoms)\nsmooth_layer <- p$layers[[which(geoms == "GeomSmooth")]]\nstopifnot(smooth_layer$stat_params$method == "lm")',
     'hints':['geom_smooth(method = "lm") overlays a regression with default confidence interval.','Stack: ggplot(...) + geom_point() + geom_smooth(method = "lm").'],
     'why':'<code>geom_smooth(method = "lm")</code> fits a linear regression and shows a confidence ribbon. Default loess is for nonlinear trends; "lm" is right when you want the regression line.'},

    # Hard code
    {'id':'gg_code_themed', 'type':'code', 'diff':3, 'topic':'themes',
     'prompt':'Write <code>themed_bar(df)</code> that takes a data frame with columns <code>category</code> and <code>value</code>, draws a bar chart with <code>category</code> on x and <code>value</code> on y (use <code>geom_col</code>, not <code>geom_bar</code>), applies <code>theme_minimal()</code>, and removes the legend.',
     'fnName':'themed_bar',
     'starter':'library(ggplot2)\n\nthemed_bar <- function(df) {\n  # Your code here\n  \n}',
     'tests':'df <- data.frame(category = c("A","B","C"), value = c(3, 1, 2))\np <- themed_bar(df)\nstopifnot(inherits(p, "ggplot"))\ngeoms <- sapply(p$layers, function(l) class(l$geom)[1])\nstopifnot("GeomCol" %in% geoms)\nstopifnot(p$theme$legend.position == "none" || (!is.null(p$theme$legend.position) && p$theme$legend.position == "none"))',
     'hints':['geom_col() takes y as the bar height directly. geom_bar() defaults to stat="count".','theme_minimal() + theme(legend.position = "none") composes — last wins for conflicting elements.'],
     'why':'<code>geom_col()</code> is the right choice when y is a pre-computed value. Layer the theme: <code>theme_minimal() + theme(legend.position = "none")</code>; the second call overrides legend handling.'},
    {'id':'gg_code_log_save', 'type':'code', 'diff':3, 'topic':'scales',
     'prompt':'Write <code>logy_plot(df)</code> that returns a scatterplot of <code>mpg</code> vs <code>hp</code> with the y-axis on a base-10 log scale (using <code>scale_y_log10()</code>). The points should be colored by <code>factor(cyl)</code>.',
     'fnName':'logy_plot',
     'starter':'library(ggplot2)\n\nlogy_plot <- function(df) {\n  # Your code here\n  \n}',
     'tests':'p <- logy_plot(mtcars)\nstopifnot(inherits(p, "ggplot"))\nscales <- sapply(p$scales$scales, function(s) class(s)[1])\nstopifnot(any(grepl("ScaleContinuousPosition|ScaleContinuous", scales)))\ntr_names <- sapply(p$scales$scales, function(s) if (!is.null(s$trans)) s$trans$name else NA_character_)\nstopifnot(any(tr_names == "log-10", na.rm = TRUE))\nstopifnot("colour" %in% names(p$mapping))',
     'hints':['scale_y_log10() transforms the y axis without mutating the data.','aes(color = factor(cyl)) gives discrete buckets.'],
     'why':'<code>ggplot(df, aes(mpg, hp, color = factor(cyl))) + geom_point() + scale_y_log10()</code>. The transform changes axis tick spacing but the data values stay untouched.'},
]


# ---------------------------------------------------------------------------
# QUIZ 3: Hypothesis Testing
# ---------------------------------------------------------------------------
HYPOTHESIS_BANK = [
    # Easy MCQ
    {'id':'ht_null', 'type':'mcq', 'diff':1, 'topic':'hypotheses',
     'q':'The null hypothesis (H₀) typically states:',
     'opts':[
        {'t':'There IS an effect'},
        {'t':'There is NO effect or difference','correct':True},
        {'t':'The data are normally distributed'},
        {'t':'The sample size is sufficient'},
     ],
     'hints':['The null is the "boring" hypothesis we try to reject.'],
     'why':'H₀ asserts no effect (e.g., means are equal, no association). We compute the probability of seeing data this extreme IF H₀ were true; if that probability is small, we reject H₀.'},
    {'id':'ht_pvalue', 'type':'mcq', 'diff':1, 'topic':'p-values',
     'q':'A p-value of 0.03 means:',
     'opts':[
        {'t':'There is a 3% chance the null hypothesis is true'},
        {'t':'There is a 3% chance of seeing data this extreme (or more) if H₀ were true','correct':True},
        {'t':'There is a 97% chance the alternative is true'},
        {'t':'The effect size is 3%'},
     ],
     'hints':['p-values are about the data given H₀, not about H₀ given the data.'],
     'why':'A p-value is P(data ≥ this extreme | H₀ true). It is NOT P(H₀ true | data) — that\'s a Bayesian quantity requiring priors.'},
    {'id':'ht_t_test', 'type':'mcq', 'diff':1, 'topic':'tests',
     'q':'Which test compares the means of two independent groups?',
     'opts':[{'t':'<code>t.test(x, y)</code>','correct':True},{'t':'<code>chisq.test(x, y)</code>'},{'t':'<code>cor.test(x, y)</code>'},{'t':'<code>fisher.test(x, y)</code>'}],
     'hints':['"t" for two groups, "chi-sq" for categorical, "cor" for correlation.'],
     'why':'<code>t.test(x, y)</code> performs Welch\'s two-sample t-test by default (no equal-variance assumption).'},
    {'id':'ht_alpha', 'type':'mcq', 'diff':1, 'topic':'significance',
     'q':'The significance level α is:',
     'opts':[
        {'t':'The probability of correctly rejecting H₀'},
        {'t':'The probability of rejecting H₀ when it is actually true (Type I error rate)','correct':True},
        {'t':'The probability of accepting H₀ when it is false'},
        {'t':'The standard deviation of the test statistic'},
     ],
     'hints':['α controls how often you commit a false-positive.'],
     'why':'α is the pre-set Type I error rate — typically 0.05. If p < α, reject H₀. It is NOT the chance H₀ is true; it\'s the chance of mistakenly rejecting a true H₀.'},

    # Medium MCQ
    {'id':'ht_paired', 'type':'mcq', 'diff':2, 'topic':'tests',
     'q':'When should you use a paired t-test instead of a two-sample t-test?',
     'opts':[
        {'t':'When the groups are independent and have the same variance'},
        {'t':'When each observation in one group is naturally paired with one in the other (e.g., before/after)','correct':True},
        {'t':'When sample sizes are very different'},
        {'t':'When the data is non-normal'},
     ],
     'hints':['Paired design: each row of x corresponds to the same subject as row of y.'],
     'why':'Paired t-test analyzes the differences within pairs (e.g., before vs after on the same subject). It removes between-subject variability and is more powerful than the unpaired version when pairing is natural.'},
    {'id':'ht_chisq', 'type':'mcq', 'diff':2, 'topic':'tests',
     'q':'<code>chisq.test()</code> on a 2×2 contingency table tests:',
     'opts':[
        {'t':'Whether the two row means are equal'},
        {'t':'Whether the row and column variables are independent','correct':True},
        {'t':'Whether the row counts are normally distributed'},
        {'t':'Whether the marginal totals are equal'},
     ],
     'hints':['Chi-square tests categorical independence.'],
     'why':'Chi-square test of independence: H₀ says row variable and column variable are independent (i.e., joint probabilities factor into marginals). Compares observed counts to expected-under-independence counts.'},
    {'id':'ht_power', 'type':'mcq', 'diff':2, 'topic':'power',
     'q':'Statistical power is:',
     'opts':[
        {'t':'P(reject H₀ | H₀ true)'},
        {'t':'P(reject H₀ | H₁ true)','correct':True},
        {'t':'1 - p-value'},
        {'t':'The sample size required'},
     ],
     'hints':['Power = "the test correctly detects an effect when one exists." It\'s the opposite of Type II error.'],
     'why':'Power = 1 − β = P(reject H₀ | H₁ true). High power means the test will detect a true effect. It depends on sample size, effect size, and α.'},
    {'id':'ht_one_two_sided', 'type':'mcq', 'diff':2, 'topic':'tests',
     'q':'A two-sided t-test rejects H₀ when:',
     'opts':[
        {'t':'The sample mean is much greater than the hypothesized value'},
        {'t':'The sample mean is much less than the hypothesized value'},
        {'t':'The sample mean is far from the hypothesized value in EITHER direction','correct':True},
        {'t':'p > 0.05'},
     ],
     'hints':['One-sided tests only have a critical region on one tail; two-sided have both.'],
     'why':'A two-sided test (the default) splits α between both tails. Use one-sided only when you have a directional prior (e.g., "this drug reduces blood pressure") and are willing to never reject in the other direction.'},

    # Hard MCQ
    {'id':'ht_multiple', 'type':'mcq', 'diff':3, 'topic':'corrections',
     'q':'You run 20 independent t-tests at α = 0.05. Assuming H₀ true for all of them, the expected number of "significant" results is:',
     'opts':[
        {'t':'0'},
        {'t':'1','correct':True},
        {'t':'5'},
        {'t':'10'},
     ],
     'hints':['Each test has a 5% false-positive rate. 20 × 0.05 = 1.'],
     'why':'With α = 0.05, you\'re willing to accept a 5% false-positive rate per test. Over 20 tests, you expect 20 × 0.05 = 1 false positive. This is why multiple-testing corrections (Bonferroni, BH) exist.'},
    {'id':'ht_bonf', 'type':'mcq', 'diff':3, 'topic':'corrections',
     'q':'Bonferroni-correcting m tests means:',
     'opts':[
        {'t':'Multiplying each p-value by m'},
        {'t':'Comparing each p-value to α/m instead of α','correct':True},
        {'t':'Discarding the smallest p-value'},
        {'t':'Switching to a different test'},
     ],
     'hints':['Bonferroni is the simplest control of the family-wise error rate.'],
     'why':'Bonferroni: reject only if p < α/m. Equivalently, multiply p-values by m and compare to α (clipped at 1). It controls the family-wise error rate at α but is conservative — Benjamini-Hochberg is less conservative when m is large.'},
    {'id':'ht_welch', 'type':'mcq', 'diff':3, 'topic':'tests',
     'q':'Why does <code>t.test()</code> default to Welch\'s t-test instead of the classical (pooled) t-test?',
     'opts':[
        {'t':'It runs faster'},
        {'t':'It does NOT assume equal variances and is more robust','correct':True},
        {'t':'It corrects for multiple comparisons'},
        {'t':'It handles missing data better'},
     ],
     'hints':['Welch adjusts the degrees of freedom for unequal variances.'],
     'why':'Welch\'s t-test does not assume equal variances and degrades gracefully when they are. The pooled variant requires equal-variance assumption (testable with var.test()). R defaults to Welch for safety.'},

    # Easy code
    {'id':'ht_code_ttest', 'type':'code', 'diff':1, 'topic':'tests',
     'prompt':'Write a function <code>compare_means(x, y)</code> that runs a two-sample (independent) Welch\'s t-test on numeric vectors <code>x</code> and <code>y</code> and returns the p-value as a single numeric.',
     'fnName':'compare_means',
     'starter':'compare_means <- function(x, y) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\na <- rnorm(50, mean = 10)\nb <- rnorm(50, mean = 11)\np <- compare_means(a, b)\nstopifnot(is.numeric(p))\nstopifnot(length(p) == 1)\nstopifnot(p >= 0 && p <= 1)\nstopifnot(abs(p - t.test(a, b)$p.value) < 1e-12)',
     'hints':['t.test(x, y)$p.value gives the p-value directly.','The default is Welch\'s with var.equal = FALSE.'],
     'why':'<code>t.test(x, y)$p.value</code> extracts the p-value from the htest object t.test() returns.'},
    {'id':'ht_code_paired', 'type':'code', 'diff':1, 'topic':'tests',
     'prompt':'Write <code>paired_pvalue(before, after)</code> that runs a paired t-test on the two vectors and returns the p-value.',
     'fnName':'paired_pvalue',
     'starter':'paired_pvalue <- function(before, after) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nb <- rnorm(20, 5)\na <- b + rnorm(20, 0.3, 0.5)\np <- paired_pvalue(b, a)\nstopifnot(is.numeric(p))\nstopifnot(abs(p - t.test(b, a, paired = TRUE)$p.value) < 1e-12)',
     'hints':['Pass paired = TRUE to t.test().'],
     'why':'<code>t.test(before, after, paired = TRUE)$p.value</code>. Paired t-test analyzes the differences within pairs, removing between-subject variability.'},

    # Medium code
    {'id':'ht_code_chisq', 'type':'code', 'diff':2, 'topic':'tests',
     'prompt':'Write <code>independence_test(tbl)</code> that runs a chi-square test of independence on a contingency table (a matrix or table) and returns a list with elements <code>p_value</code> and <code>statistic</code> (the chi-square statistic).',
     'fnName':'independence_test',
     'starter':'independence_test <- function(tbl) {\n  # Your code here\n  \n}',
     'tests':'tbl <- matrix(c(30, 10, 15, 25), nrow = 2)\nresult <- independence_test(tbl)\nstopifnot(is.list(result))\nstopifnot(all(c("p_value", "statistic") %in% names(result)))\nstopifnot(is.numeric(result$p_value))\nstopifnot(is.numeric(result$statistic))\nref <- chisq.test(tbl)\nstopifnot(abs(result$p_value - ref$p.value) < 1e-9)\nstopifnot(abs(result$statistic - ref$statistic) < 1e-9)',
     'hints':['chisq.test() returns an object with $p.value and $statistic fields.','Wrap in a named list: list(p_value = ..., statistic = ...).'],
     'why':'<code>r &lt;- chisq.test(tbl); list(p_value = r$p.value, statistic = unname(r$statistic))</code>. Unname is optional; the test expects numeric regardless.'},
    {'id':'ht_code_bonf', 'type':'code', 'diff':2, 'topic':'corrections',
     'prompt':'Write <code>bonferroni_adjust(pvalues)</code> that takes a numeric vector of raw p-values and returns the Bonferroni-adjusted p-values (each multiplied by the number of tests, capped at 1). Do NOT use p.adjust().',
     'fnName':'bonferroni_adjust',
     'starter':'bonferroni_adjust <- function(pvalues) {\n  # Your code here\n  \n}',
     'tests':'r <- bonferroni_adjust(c(0.01, 0.04, 0.2, 0.6))\nstopifnot(length(r) == 4)\nstopifnot(abs(r[1] - 0.04) < 1e-9)\nstopifnot(abs(r[2] - 0.16) < 1e-9)\nstopifnot(abs(r[3] - 0.8) < 1e-9)\nstopifnot(abs(r[4] - 1) < 1e-9)\nstopifnot(all(r >= 0 & r <= 1))',
     'hints':['Multiply by length(pvalues), then pmin() with 1 to cap.','pmin (parallel min) is element-wise; min() collapses to a single value.'],
     'why':'<code>pmin(pvalues * length(pvalues), 1)</code>. Vectorized: each p × m, capped at 1. This matches p.adjust(pvalues, "bonferroni").'},

    # Hard code
    {'id':'ht_code_power_sim', 'type':'code', 'diff':3, 'topic':'power',
     'prompt':'Write <code>power_sim(n, mean_diff, sd, n_sims, alpha)</code> that estimates the power of a two-sample t-test by simulation. Each iteration: draw two samples of size <code>n</code>, one from <code>N(0, sd²)</code> and one from <code>N(mean_diff, sd²)</code>, run a t.test, and count how often p &lt; alpha. Return the fraction of rejections as a numeric in [0, 1].',
     'fnName':'power_sim',
     'starter':'power_sim <- function(n, mean_diff, sd, n_sims, alpha) {\n  # Your code here\n  \n}',
     'tests':'set.seed(42)\np <- power_sim(n = 30, mean_diff = 1, sd = 1, n_sims = 200, alpha = 0.05)\nstopifnot(is.numeric(p))\nstopifnot(length(p) == 1)\nstopifnot(p >= 0 && p <= 1)\n# At n=30, diff=1, sd=1, power should be very high (>0.85 typically)\nstopifnot(p > 0.7)\n# Tiny diff should give low power\nset.seed(42)\np_low <- power_sim(n = 10, mean_diff = 0.1, sd = 1, n_sims = 200, alpha = 0.05)\nstopifnot(p_low < 0.3)',
     'hints':['replicate(n_sims, { ... }) returns a vector of length n_sims.','Inside: draw x and y, run t.test, return t.test(...)$p.value < alpha.','mean(<logical vector>) gives the fraction of TRUE.'],
     'why':'<code>mean(replicate(n_sims, t.test(rnorm(n), rnorm(n, mean_diff, sd))$p.value &lt; alpha))</code>. The replicate generates n_sims booleans (rejected?); mean() gives the fraction = empirical power.'},
    {'id':'ht_code_perm', 'type':'code', 'diff':3, 'topic':'nonparametric',
     'prompt':'Write <code>perm_test_pvalue(x, y, n_perm)</code> that runs a two-sample permutation test for the difference in means, returning a (two-sided) p-value. Each permutation: shuffle the labels (combine x and y, reassign), compute |new_mean_x - new_mean_y|, count how often it ≥ the observed |mean_x - mean_y|.',
     'fnName':'perm_test_pvalue',
     'starter':'perm_test_pvalue <- function(x, y, n_perm) {\n  # Your code here\n  \n}',
     'tests':'set.seed(123)\nx <- rnorm(30, 0)\ny <- rnorm(30, 1)\np <- perm_test_pvalue(x, y, n_perm = 500)\nstopifnot(is.numeric(p))\nstopifnot(length(p) == 1)\nstopifnot(p >= 0 && p <= 1)\n# Real difference: p should be small\nstopifnot(p < 0.05)\n# Two equal samples: p should be roughly uniform → reject ~5% under null\nset.seed(123)\nx2 <- rnorm(30)\ny2 <- rnorm(30)\np_null <- perm_test_pvalue(x2, y2, n_perm = 500)\nstopifnot(p_null > 0.05)',
     'hints':['observed <- abs(mean(x) - mean(y)).','For each permutation: combined <- c(x, y); shuffled <- sample(combined); new_x <- shuffled[1:length(x)]; new_y <- shuffled[(length(x)+1):length(combined)].','Use replicate(n_perm, ...) to generate the null distribution and mean(perm_stats >= observed).'],
     'why':'The permutation p-value: fraction of shuffled mean-differences (in absolute value) at least as extreme as the observed. Distribution-free, no normality assumption.'},
]


# ---------------------------------------------------------------------------
# QUIZ 4: Linear Regression
# ---------------------------------------------------------------------------
REGRESSION_BANK = [
    # Easy MCQ
    {'id':'lr_lm', 'type':'mcq', 'diff':1, 'topic':'fitting',
     'q':'Which function fits a linear regression in base R?',
     'opts':[{'t':'<code>regression()</code>'},{'t':'<code>lm()</code>','correct':True},{'t':'<code>glm()</code>'},{'t':'<code>fit()</code>'}],
     'hints':['"lm" stands for linear model.'],
     'why':'<code>lm()</code> fits ordinary least squares linear regression. <code>glm()</code> generalizes to other distributions (logistic, Poisson, etc.).'},
    {'id':'lr_formula', 'type':'mcq', 'diff':1, 'topic':'fitting',
     'q':'What does <code>lm(y ~ x1 + x2, data = df)</code> fit?',
     'opts':[
        {'t':'A model with y as a multiplicative function of x1 and x2'},
        {'t':'A linear model where y is regressed on x1 AND x2 as additive predictors','correct':True},
        {'t':'Three separate models, one per variable'},
        {'t':'A logistic regression'},
     ],
     'hints':['~ separates response from predictors; + adds predictors.'],
     'why':'<code>y ~ x1 + x2</code> means: y as a linear function of x1 AND x2 (no interaction). The fitted model is y = β₀ + β₁x₁ + β₂x₂ + ε.'},
    {'id':'lr_intercept', 'type':'mcq', 'diff':1, 'topic':'interpretation',
     'q':'In <code>lm(mpg ~ hp, data = mtcars)</code>, the intercept estimates:',
     'opts':[
        {'t':'The expected mpg when hp = 0','correct':True},
        {'t':'The slope of the relationship'},
        {'t':'The R-squared'},
        {'t':'The standard error of hp'},
     ],
     'hints':['The intercept is β₀ — the predicted y when all x = 0.'],
     'why':'The intercept (β₀) is the expected response when every predictor is 0. Whether it\'s meaningful depends on whether x = 0 is within the data range (often not for hp).'},
    {'id':'lr_summary', 'type':'mcq', 'diff':1, 'topic':'output',
     'q':'Which function prints coefficients, std errors, t-stats, p-values, and R² for a fitted lm?',
     'opts':[{'t':'<code>lm()</code>'},{'t':'<code>summary()</code>','correct':True},{'t':'<code>print()</code>'},{'t':'<code>describe()</code>'}],
     'hints':['summary() on an lm object gives the full coefficient table.'],
     'why':'<code>summary(fit)</code> returns a richer summary including p-values, t-stats, R², and residual SE. Just printing fit shows only point estimates.'},

    # Medium MCQ
    {'id':'lr_r2', 'type':'mcq', 'diff':2, 'topic':'fit',
     'q':'What does an R² of 0.85 mean?',
     'opts':[
        {'t':'85% of predictions are correct'},
        {'t':'The model explains 85% of the variance in y','correct':True},
        {'t':'The slope is 0.85'},
        {'t':'The correlation between x and y is 0.85'},
     ],
     'hints':['R² is the proportion of variance in y explained by the model.'],
     'why':'R² = 1 − SSE/SST = fraction of variance in y explained by the fitted model. For simple regression, R² = cor(x, y)².'},
    {'id':'lr_residual', 'type':'mcq', 'diff':2, 'topic':'residuals',
     'q':'A residual is:',
     'opts':[
        {'t':'The slope estimate'},
        {'t':'observed y minus predicted y','correct':True},
        {'t':'The standard error'},
        {'t':'The Cook\'s distance'},
     ],
     'hints':['Residuals are what\'s left after the model explains what it can.'],
     'why':'Residual_i = y_i − ŷ_i. Residuals should be approximately mean-zero and free of pattern when the model is well-specified.'},
    {'id':'lr_multicollinear', 'type':'mcq', 'diff':2, 'topic':'diagnostics',
     'q':'Multicollinearity in a multiple regression means:',
     'opts':[
        {'t':'The response is non-normal'},
        {'t':'Two or more predictors are highly correlated with each other','correct':True},
        {'t':'The model has too many predictors'},
        {'t':'The residuals are heteroscedastic'},
     ],
     'hints':['"Multi-collinear" — collinear predictors.'],
     'why':'Multicollinearity (correlation among predictors) inflates coefficient standard errors and makes individual estimates unstable. Diagnose with VIF (variance inflation factor). The overall R² is fine; individual β interpretation is murky.'},
    {'id':'lr_interaction', 'type':'mcq', 'diff':2, 'topic':'formulas',
     'q':'In <code>lm(y ~ x1 * x2)</code>, what does <code>*</code> do?',
     'opts':[
        {'t':'Multiplies x1 and x2 element-wise as the only predictor'},
        {'t':'Includes x1, x2, AND their interaction term x1:x2','correct':True},
        {'t':'Centers x1 and x2'},
        {'t':'Standardizes x1 and x2'},
     ],
     'hints':['* means "main effects PLUS interaction." Use : for interaction only.'],
     'why':'<code>x1 * x2</code> expands to <code>x1 + x2 + x1:x2</code> — main effects and interaction. To get just the interaction, use <code>x1:x2</code>.'},

    # Hard MCQ
    {'id':'lr_assumptions', 'type':'mcq', 'diff':3, 'topic':'assumptions',
     'q':'Which is NOT a classical OLS assumption?',
     'opts':[
        {'t':'Linear relationship between predictors and response'},
        {'t':'Errors are independent and identically distributed'},
        {'t':'Predictors must be normally distributed','correct':True},
        {'t':'Errors have constant variance (homoscedasticity)'},
     ],
     'hints':['Only ERRORS need to be normal for inference (CIs, p-values). Predictors can be any distribution.'],
     'why':'OLS requires linearity, independent errors, homoscedasticity, and approximately-normal errors (for inference). The PREDICTORS\' distribution is unconstrained.'},
    {'id':'lr_glm_logistic', 'type':'mcq', 'diff':3, 'topic':'glm',
     'q':'To fit a logistic regression in R you would use:',
     'opts':[
        {'t':'<code>lm(y ~ x, data = df)</code>'},
        {'t':'<code>glm(y ~ x, family = binomial, data = df)</code>','correct':True},
        {'t':'<code>logit(y ~ x, data = df)</code>'},
        {'t':'<code>glm(y ~ x, family = poisson, data = df)</code>'},
     ],
     'hints':['glm() generalizes lm to non-Gaussian families; logistic uses binomial.'],
     'why':'<code>glm(y ~ x, family = binomial)</code> fits logistic regression (logit link by default). Use <code>family = poisson</code> for count data.'},
    {'id':'lr_adjusted_r2', 'type':'mcq', 'diff':3, 'topic':'fit',
     'q':'Why is "Adjusted R²" usually preferred over plain R² when comparing models with different numbers of predictors?',
     'opts':[
        {'t':'It always equals R² but is easier to compute'},
        {'t':'It penalizes adding predictors that don\'t improve fit enough','correct':True},
        {'t':'It is robust to outliers'},
        {'t':'It works for non-linear models'},
     ],
     'hints':['Plain R² never decreases when you add a predictor — even a useless one.'],
     'why':'R² monotonically increases as you add predictors. Adjusted R² subtracts a penalty for extra parameters, so it can decrease if a predictor doesn\'t carry its weight. Better for model comparison.'},

    # Easy code
    {'id':'lr_code_simple', 'type':'code', 'diff':1, 'topic':'fitting',
     'prompt':'Write a function <code>slope_of(df, x, y)</code> that fits <code>lm(y ~ x, data = df)</code> using the column names passed as <code>x</code> and <code>y</code> (strings) and returns the slope coefficient (the coefficient on x) as a single numeric.',
     'fnName':'slope_of',
     'starter':'slope_of <- function(df, x, y) {\n  # Your code here\n  \n}',
     'tests':'r <- slope_of(mtcars, "hp", "mpg")\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(abs(r - coef(lm(mpg ~ hp, data = mtcars))[["hp"]]) < 1e-9)\nr2 <- slope_of(iris, "Sepal.Length", "Petal.Length")\nstopifnot(abs(r2 - coef(lm(Petal.Length ~ Sepal.Length, data = iris))[["Sepal.Length"]]) < 1e-9)',
     'hints':['Build the formula string then convert with as.formula(): paste(y, "~", x).','coef(fit)[[x]] grabs the named coefficient.'],
     'why':'<code>fit &lt;- lm(as.formula(paste(y, "~", x)), data = df); unname(coef(fit)[x])</code>. Compose the formula dynamically from string column names.'},
    {'id':'lr_code_predict', 'type':'code', 'diff':1, 'topic':'prediction',
     'prompt':'Write <code>predict_one(df, x_value)</code> that fits <code>mpg ~ hp</code> on the data frame <code>df</code> (a copy of mtcars-shape data) and returns the predicted <code>mpg</code> for a single new <code>hp</code> value.',
     'fnName':'predict_one',
     'starter':'predict_one <- function(df, x_value) {\n  # Your code here\n  \n}',
     'tests':'r <- predict_one(mtcars, 150)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nfit <- lm(mpg ~ hp, data = mtcars)\nexpected <- predict(fit, data.frame(hp = 150))\nstopifnot(abs(r - expected) < 1e-9)',
     'hints':['fit <- lm(mpg ~ hp, data = df), then predict(fit, newdata = data.frame(hp = x_value)).','newdata must be a data frame with column names matching the predictors.'],
     'why':'<code>predict(lm(mpg ~ hp, data = df), newdata = data.frame(hp = x_value))</code>. predict() requires a data frame matching the training column names.'},

    # Medium code
    {'id':'lr_code_multi', 'type':'code', 'diff':2, 'topic':'multivariate',
     'prompt':'Write <code>r_squared(df)</code> that fits a multiple regression of <code>mpg ~ hp + wt + cyl</code> on data frame <code>df</code> and returns the R-squared as a single numeric.',
     'fnName':'r_squared',
     'starter':'r_squared <- function(df) {\n  # Your code here\n  \n}',
     'tests':'r <- r_squared(mtcars)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(r > 0 && r < 1)\nfit <- lm(mpg ~ hp + wt + cyl, data = mtcars)\nexpected <- summary(fit)$r.squared\nstopifnot(abs(r - expected) < 1e-9)',
     'hints':['summary(fit)$r.squared gives R², not r2.','Multi-predictor formula: y ~ x1 + x2 + x3.'],
     'why':'<code>summary(lm(mpg ~ hp + wt + cyl, data = df))$r.squared</code>. The summary object holds the metrics.'},
    {'id':'lr_code_residuals', 'type':'code', 'diff':2, 'topic':'residuals',
     'prompt':'Write <code>resid_sd(df)</code> that fits <code>mpg ~ hp</code> on <code>df</code> and returns the standard deviation of the residuals (which is approximately the residual standard error).',
     'fnName':'resid_sd',
     'starter':'resid_sd <- function(df) {\n  # Your code here\n  \n}',
     'tests':'r <- resid_sd(mtcars)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nfit <- lm(mpg ~ hp, data = mtcars)\nexpected <- sd(residuals(fit))\nstopifnot(abs(r - expected) < 1e-9)',
     'hints':['residuals(fit) extracts the residual vector.','sd() then computes the standard deviation.'],
     'why':'<code>sd(residuals(lm(mpg ~ hp, data = df)))</code>. Slight difference from summary()$sigma which divides by n-p (degrees of freedom) instead of n-1.'},

    # Hard code
    {'id':'lr_code_logistic', 'type':'code', 'diff':3, 'topic':'glm',
     'prompt':'Write <code>fit_logistic(df, y_col, x_col)</code> that fits a logistic regression of <code>y_col</code> on <code>x_col</code> (column names as strings, y_col is 0/1) and returns the slope coefficient (the coefficient on x_col).',
     'fnName':'fit_logistic',
     'starter':'fit_logistic <- function(df, y_col, x_col) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\ndf <- data.frame(x = rnorm(200), y = NA)\ndf$y <- rbinom(200, 1, plogis(0.5 + 1.5 * df$x))\nr <- fit_logistic(df, "y", "x")\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nfit <- glm(y ~ x, data = df, family = binomial)\nstopifnot(abs(r - coef(fit)[["x"]]) < 1e-9)\n# Slope should be roughly 1.5 (with noise)\nstopifnot(r > 1.0 && r < 2.0)',
     'hints':['glm(formula, data, family = binomial) fits logistic regression.','as.formula(paste(y_col, "~", x_col)) builds the formula from strings.','coef(fit)[[x_col]] grabs the named slope.'],
     'why':'<code>unname(coef(glm(as.formula(paste(y_col, "~", x_col)), data = df, family = binomial))[x_col])</code>. The binomial family + logit link gives logistic regression.'},
    {'id':'lr_code_vif', 'type':'code', 'diff':3, 'topic':'diagnostics',
     'prompt':'Write <code>simple_vif(df, predictors)</code> where <code>predictors</code> is a character vector of column names. For each predictor, regress it on the OTHER predictors and return a NAMED numeric vector of VIFs (1 / (1 - R²) for each). Do not use the car package; implement directly with lm() and summary().',
     'fnName':'simple_vif',
     'starter':'simple_vif <- function(df, predictors) {\n  # Your code here\n  \n}',
     'tests':'r <- simple_vif(mtcars, c("hp", "wt", "cyl"))\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 3)\nstopifnot(identical(sort(names(r)), c("cyl", "hp", "wt")))\nstopifnot(all(r >= 1))  # VIF is always >= 1\n# VIFs for mtcars hp/wt/cyl should all be roughly between 1.5 and 10\nstopifnot(all(r < 20))',
     'hints':['For each predictor p_i: fit lm(p_i ~ other_predictors).','R² from summary()$r.squared; VIF = 1 / (1 - R²).','sapply over predictors with names preserved gives a named vector.'],
     'why':'For each predictor, regress on the others: VIF_i = 1 / (1 - R²_i). VIF=1 means no collinearity; VIF>5 (or 10) often flagged as concerning.'},
]


# ---------------------------------------------------------------------------
# QUIZ 5: Machine Learning
# ---------------------------------------------------------------------------
ML_BANK = [
    # Easy MCQ
    {'id':'ml_supervised', 'type':'mcq', 'diff':1, 'topic':'taxonomy',
     'q':'Which is an example of supervised learning?',
     'opts':[
        {'t':'K-means clustering'},
        {'t':'Predicting house prices from features with labeled training data','correct':True},
        {'t':'Principal component analysis'},
        {'t':'Topic modeling on text'},
     ],
     'hints':['Supervised: features (X) + labels (y). Unsupervised: only X.'],
     'why':'Supervised learning maps X → y using labeled training data (classification or regression). K-means, PCA, and topic modeling are unsupervised — no y.'},
    {'id':'ml_train_test', 'type':'mcq', 'diff':1, 'topic':'workflow',
     'q':'Why do we hold out a test set?',
     'opts':[
        {'t':'To save memory during training'},
        {'t':'To estimate how the model performs on unseen data','correct':True},
        {'t':'To balance the classes'},
        {'t':'To avoid using GPU'},
     ],
     'hints':['Training error is optimistic — the model has already seen those points.'],
     'why':'The held-out test set gives an unbiased estimate of generalization error. Training error always undershoots because the model fits its training points.'},
    {'id':'ml_overfit', 'type':'mcq', 'diff':1, 'topic':'overfitting',
     'q':'A model with 99% training accuracy but 60% test accuracy is most likely:',
     'opts':[
        {'t':'Underfit'},
        {'t':'Overfit','correct':True},
        {'t':'Just right'},
        {'t':'Suffering from class imbalance'},
     ],
     'hints':['Memorizing training data → great training metrics, poor test metrics.'],
     'why':'Classic overfitting: the model memorizes training data (including noise) but fails to generalize. Fixes: more data, regularization, simpler model, more validation.'},
    {'id':'ml_classifier_metric', 'type':'mcq', 'diff':1, 'topic':'metrics',
     'q':'For a classifier on imbalanced data (95% class A, 5% class B), why is accuracy a poor metric?',
     'opts':[
        {'t':'Accuracy is always wrong'},
        {'t':'A model that always predicts class A gets 95% accuracy but is useless','correct':True},
        {'t':'Accuracy cannot be computed for imbalanced data'},
        {'t':'Accuracy only works for regression'},
     ],
     'hints':['Think about the dumbest baseline (always predict majority).'],
     'why':'Predict-majority gives 95% accuracy with zero recall on class B. Use precision, recall, F1, ROC AUC, or balanced accuracy for imbalanced problems.'},

    # Medium MCQ
    {'id':'ml_cv', 'type':'mcq', 'diff':2, 'topic':'validation',
     'q':'5-fold cross-validation:',
     'opts':[
        {'t':'Splits data into 5 random parts and uses only the first one for training'},
        {'t':'Trains on 4 folds, tests on the 5th, rotates so every fold is the test set once, averages metrics','correct':True},
        {'t':'Bootstraps 5 samples from the data'},
        {'t':'Fits 5 different model types in parallel'},
     ],
     'hints':['"5-fold" means 5 train/test rotations.'],
     'why':'5-fold CV partitions data into 5 folds. Each iteration: 4 folds train, 1 fold tests. Repeat so each fold serves as the test once. Average the 5 metrics. More robust than a single split.'},
    {'id':'ml_rf', 'type':'mcq', 'diff':2, 'topic':'algorithms',
     'q':'What makes Random Forest different from a single decision tree?',
     'opts':[
        {'t':'It uses neural network layers'},
        {'t':'It trains many trees on bootstrap samples + random feature subsets, then averages predictions','correct':True},
        {'t':'It is a linear model'},
        {'t':'It only works for regression'},
     ],
     'hints':['"Forest" = many trees. "Random" = randomness in both data (bootstrap) and features (random subset per split).'],
     'why':'Random Forest is bagging + feature randomness: each tree sees a bootstrap of rows AND a random subset of columns at each split. Variance reduction via averaging.'},
    {'id':'ml_regularization', 'type':'mcq', 'diff':2, 'topic':'regularization',
     'q':'In ridge regression, the L2 penalty:',
     'opts':[
        {'t':'Sets some coefficients to exactly zero'},
        {'t':'Shrinks all coefficients toward zero without setting them to exactly zero','correct':True},
        {'t':'Has no effect on coefficients'},
        {'t':'Inflates coefficients to prevent underfitting'},
     ],
     'hints':['L2 shrinks; L1 (lasso) selects. Ridge keeps everything in the model.'],
     'why':'Ridge adds λ||β||² to the loss → continuous shrinkage. Lasso adds λ||β||₁ → can drive coefficients to exact zero (feature selection). Elastic net mixes both.'},
    {'id':'ml_pca', 'type':'mcq', 'diff':2, 'topic':'unsupervised',
     'q':'PCA finds:',
     'opts':[
        {'t':'Clusters in the data'},
        {'t':'Orthogonal directions of maximum variance in the data','correct':True},
        {'t':'The optimal classifier boundary'},
        {'t':'Outliers in the data'},
     ],
     'hints':['"Principal components" — directions, ranked by variance.'],
     'why':'PCA finds orthogonal axes that capture maximum variance. The first PC carries the most variance, the second is orthogonal to it and carries the next most, etc. Useful for dimensionality reduction and visualization.'},

    # Hard MCQ
    {'id':'ml_leakage', 'type':'mcq', 'diff':3, 'topic':'pitfalls',
     'q':'Which is a classic data leakage scenario?',
     'opts':[
        {'t':'Using the same random seed every time'},
        {'t':'Scaling features using mean/SD computed from the entire dataset BEFORE splitting train/test','correct':True},
        {'t':'Holding out 20% as a test set'},
        {'t':'Using accuracy as the metric'},
     ],
     'hints':['The model "sees" test-set info during training through the preprocessing.'],
     'why':'Computing preprocessing stats (mean, SD, percentiles) on the full data before splitting leaks test info into training. Fit the preprocessor on train only, then apply to test.'},
    {'id':'ml_roc_auc', 'type':'mcq', 'diff':3, 'topic':'metrics',
     'q':'A ROC AUC of 0.5 means the classifier:',
     'opts':[
        {'t':'Is perfect'},
        {'t':'Is equivalent to random guessing','correct':True},
        {'t':'Always predicts the majority class'},
        {'t':'Has perfectly inverted predictions'},
     ],
     'hints':['ROC AUC = probability a random positive is ranked higher than a random negative.'],
     'why':'AUC = 0.5 means the classifier has no discrimination — random ranking. AUC = 1.0 is perfect ranking. AUC < 0.5 means worse than random (just invert predictions to recover).'},
    {'id':'ml_xgboost', 'type':'mcq', 'diff':3, 'topic':'algorithms',
     'q':'XGBoost is fundamentally:',
     'opts':[
        {'t':'A neural network architecture'},
        {'t':'A gradient-boosted ensemble of decision trees','correct':True},
        {'t':'A linear regression'},
        {'t':'A clustering algorithm'},
     ],
     'hints':['"Gradient Boosting" — boosted ensemble built iteratively to correct residual errors.'],
     'why':'XGBoost (eXtreme Gradient Boosting) builds an ensemble of decision trees sequentially. Each tree tries to correct the residual errors of the previous ensemble. Regularization, parallelism, and efficient handling of sparse data are its key strengths.'},

    # Easy code
    {'id':'ml_code_split', 'type':'code', 'diff':1, 'topic':'workflow',
     'prompt':'Write <code>train_test_split(df, prop)</code> that randomly splits a data frame into a list with <code>train</code> and <code>test</code> data frames. <code>prop</code> is the training proportion (e.g., 0.8). Use <code>sample()</code>.',
     'fnName':'train_test_split',
     'starter':'train_test_split <- function(df, prop) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nr <- train_test_split(mtcars, 0.8)\nstopifnot(is.list(r))\nstopifnot(all(c("train", "test") %in% names(r)))\nstopifnot(is.data.frame(r$train))\nstopifnot(is.data.frame(r$test))\nstopifnot(nrow(r$train) + nrow(r$test) == nrow(mtcars))\nstopifnot(nrow(r$train) == round(nrow(mtcars) * 0.8))',
     'hints':['idx <- sample(seq_len(nrow(df)), size = round(nrow(df) * prop)).','Return list(train = df[idx, ], test = df[-idx, ]).'],
     'why':'<code>idx &lt;- sample(seq_len(nrow(df)), round(nrow(df) * prop)); list(train = df[idx, ], test = df[-idx, ])</code>. Random row sampling for the split.'},
    {'id':'ml_code_accuracy', 'type':'code', 'diff':1, 'topic':'metrics',
     'prompt':'Write <code>accuracy(predicted, actual)</code> that returns the classification accuracy (fraction of predictions matching actual) as a numeric between 0 and 1. Both inputs are vectors of the same length.',
     'fnName':'accuracy',
     'starter':'accuracy <- function(predicted, actual) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(accuracy(c(1,1,0,0), c(1,1,0,0)) == 1)\nstopifnot(accuracy(c(1,1,1,1), c(1,1,0,0)) == 0.5)\nstopifnot(accuracy(c(0,0,0,0), c(1,1,1,1)) == 0)\nstopifnot(accuracy(c("a","b","b"), c("a","a","b")) == 2/3)',
     'hints':['predicted == actual gives a logical vector.','mean() of a logical vector = fraction of TRUE.'],
     'why':'<code>mean(predicted == actual)</code>. Idiomatic R: logical → numeric in mean(). Works for any comparable types.'},

    # Medium code
    {'id':'ml_code_kfold', 'type':'code', 'diff':2, 'topic':'validation',
     'prompt':'Write <code>kfold_indices(n, k)</code> that splits the indices 1..<code>n</code> into <code>k</code> roughly-equal folds (using random assignment). Return a list of length <code>k</code> where element <code>i</code> is the integer indices in fold <code>i</code>.',
     'fnName':'kfold_indices',
     'starter':'kfold_indices <- function(n, k) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nfolds <- kfold_indices(20, 5)\nstopifnot(is.list(folds))\nstopifnot(length(folds) == 5)\nstopifnot(all(sapply(folds, length) == 4))\nstopifnot(sort(unlist(folds)) == 1:20)  # cover every index exactly once\n# Uneven case: 23 into 5 folds → folds should have size 4 or 5 each\nset.seed(1)\nfolds2 <- kfold_indices(23, 5)\nstopifnot(sum(sapply(folds2, length)) == 23)\nstopifnot(all(sapply(folds2, length) %in% c(4, 5)))',
     'hints':['Shuffle the indices first, then cut into k contiguous chunks.','split(shuffled, cut(seq_along(shuffled), breaks = k, labels = FALSE)) is one approach.'],
     'why':'<code>shuffled &lt;- sample(seq_len(n)); split(shuffled, cut(seq_along(shuffled), k, labels = FALSE))</code>. cut() assigns each shuffled index to a fold 1..k; split() groups by fold.'},
    {'id':'ml_code_minmax', 'type':'code', 'diff':2, 'topic':'preprocessing',
     'prompt':'Write <code>minmax_scale(x)</code> that scales a numeric vector to [0, 1] using min-max normalization: <code>(x - min) / (max - min)</code>. Handle the edge case where all values are equal by returning a vector of zeros.',
     'fnName':'minmax_scale',
     'starter':'minmax_scale <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(minmax_scale(c(0, 5, 10)), c(0, 0.5, 1)))\nstopifnot(all(minmax_scale(c(2, 2, 2)) == 0))\nstopifnot(min(minmax_scale(c(-3, 0, 7))) == 0)\nstopifnot(max(minmax_scale(c(-3, 0, 7))) == 1)',
     'hints':['rng <- max(x) - min(x). If rng == 0, return rep(0, length(x)).','Otherwise return (x - min(x)) / rng.'],
     'why':'<code>if (max(x) == min(x)) rep(0, length(x)) else (x - min(x)) / (max(x) - min(x))</code>. Guard the zero-range case to avoid 0/0 = NaN.'},

    # Hard code
    {'id':'ml_code_kmeans', 'type':'code', 'diff':3, 'topic':'unsupervised',
     'prompt':'Write <code>kmeans_assignments(df, k)</code> that runs k-means clustering on the numeric columns of data frame <code>df</code> with <code>k</code> clusters (using <code>nstart = 10</code> for stability) and returns a vector of cluster assignments (integers 1..k, length nrow(df)). Drop non-numeric columns before clustering.',
     'fnName':'kmeans_assignments',
     'starter':'kmeans_assignments <- function(df, k) {\n  # Your code here\n  \n}',
     'tests':'set.seed(42)\nr <- kmeans_assignments(iris, 3)\nstopifnot(is.numeric(r) || is.integer(r))\nstopifnot(length(r) == nrow(iris))\nstopifnot(all(r %in% 1:3))\nstopifnot(length(unique(r)) == 3)',
     'hints':['Drop non-numeric: df[, sapply(df, is.numeric), drop = FALSE].','kmeans(numeric_df, centers = k, nstart = 10)$cluster gives the assignments.'],
     'why':'<code>kmeans(df[sapply(df, is.numeric)], centers = k, nstart = 10)$cluster</code>. nstart=10 runs k-means 10 times with different random initial centers and keeps the best (lowest within-cluster SS) — much more stable than nstart=1.'},
    {'id':'ml_code_logistic_pred', 'type':'code', 'diff':3, 'topic':'classification',
     'prompt':'Write <code>logistic_predict(train, test, formula)</code> that fits a logistic regression on the <code>train</code> data frame using the given <code>formula</code> object (response 0/1) with <code>glm(..., family = binomial)</code>, then returns a vector of predicted classes (0 or 1, using threshold 0.5) on the <code>test</code> data frame.',
     'fnName':'logistic_predict',
     'starter':'logistic_predict <- function(train, test, formula) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\ntrain <- data.frame(x = rnorm(100), y = NA)\ntrain$y <- as.integer(train$x + rnorm(100, 0, 0.5) > 0)\ntest <- data.frame(x = rnorm(40), y = NA)\ntest$y <- as.integer(test$x + rnorm(40, 0, 0.5) > 0)\npreds <- logistic_predict(train, test, y ~ x)\nstopifnot(length(preds) == nrow(test))\nstopifnot(all(preds %in% c(0, 1)))\nstopifnot(mean(preds == test$y) > 0.6)',
     'hints':['fit <- glm(formula, data = train, family = binomial).','predict(fit, newdata = test, type = "response") gives probabilities.','Threshold at 0.5: as.integer(probs > 0.5).'],
     'why':'<code>fit &lt;- glm(formula, data = train, family = binomial); as.integer(predict(fit, newdata = test, type = "response") &gt; 0.5)</code>. type="response" returns probabilities in [0,1]; otherwise predict returns the log-odds (link scale).'},
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
    # Easy MCQ
    {'id':'ts_ts_object', 'type':'mcq', 'diff':1, 'topic':'objects',
     'q':'Which base-R function creates a time-series object?',
     'opts':[{'t':'<code>ts()</code>','correct':True},{'t':'<code>as.Date()</code>'},{'t':'<code>xts()</code>'},{'t':'<code>timeseries()</code>'}],
     'hints':['Base R has a small ts() class; xts and zoo are richer packages.'],
     'why':'<code>ts()</code> creates a regular-frequency time series in base R. <code>xts</code> and <code>zoo</code> handle irregular time series and richer indexes.'},
    {'id':'ts_freq', 'type':'mcq', 'diff':1, 'topic':'objects',
     'q':'In <code>ts(x, frequency = 12)</code>, what does frequency = 12 mean?',
     'opts':[
        {'t':'There are 12 observations'},
        {'t':'The series has a seasonal period of 12 (e.g., monthly data with yearly seasonality)','correct':True},
        {'t':'The model has 12 parameters'},
        {'t':'The forecast horizon is 12'},
     ],
     'hints':['Monthly data with yearly seasonality has period 12.'],
     'why':'frequency is the number of observations per seasonal cycle. Monthly data → 12 (yearly seasonality); quarterly → 4; daily with weekly seasonality → 7.'},
    {'id':'ts_acf', 'type':'mcq', 'diff':1, 'topic':'autocorrelation',
     'q':'What does <code>acf()</code> compute?',
     'opts':[
        {'t':'The mean of the series'},
        {'t':'The autocorrelation between the series and its lagged versions','correct':True},
        {'t':'The variance of residuals'},
        {'t':'The Akaike Information Criterion'},
     ],
     'hints':['"acf" = autocorrelation function.'],
     'why':'<code>acf()</code> plots correlation at each lag — cor(x_t, x_{t-k}). Useful for spotting seasonality and order in AR/MA models.'},
    {'id':'ts_stationary', 'type':'mcq', 'diff':1, 'topic':'stationarity',
     'q':'A stationary time series has:',
     'opts':[
        {'t':'A constant mean and variance over time','correct':True},
        {'t':'A clear upward trend'},
        {'t':'A perfectly straight regression line'},
        {'t':'Always positive values'},
     ],
     'hints':['"Stationary" = stable distribution properties over time.'],
     'why':'Stationarity requires the statistical properties (mean, variance, autocorrelation structure) to be constant over time. Many TS methods (ARIMA) assume stationarity.'},

    # Medium MCQ
    {'id':'ts_diff', 'type':'mcq', 'diff':2, 'topic':'stationarity',
     'q':'What does first-order differencing <code>diff(x)</code> do?',
     'opts':[
        {'t':'Returns x_t - x_{t-1}, often used to remove a trend','correct':True},
        {'t':'Computes the second derivative'},
        {'t':'Returns the maximum minus minimum'},
        {'t':'Filters out high-frequency noise'},
     ],
     'hints':['Differencing removes trends — the trend cancels when you subtract consecutive points.'],
     'why':'<code>diff()</code> computes consecutive differences. A linear trend becomes a constant after one diff; quadratic needs two diffs. ARIMA(p, d, q) uses d diffs.'},
    {'id':'ts_adf', 'type':'mcq', 'diff':2, 'topic':'tests',
     'q':'The Augmented Dickey-Fuller (ADF) test tests:',
     'opts':[
        {'t':'For normality of the residuals'},
        {'t':'Whether a series has a unit root (i.e., is non-stationary)','correct':True},
        {'t':'For seasonality'},
        {'t':'For autocorrelation in the residuals'},
     ],
     'hints':['ADF: H0 = unit root present (non-stationary). Small p-value → stationary.'],
     'why':'ADF tests H0: series has a unit root (non-stationary) vs H1: stationary. <code>adf.test()</code> from tseries returns a p-value; small p → reject non-stationarity.'},
    {'id':'ts_arima', 'type':'mcq', 'diff':2, 'topic':'models',
     'q':'ARIMA(p, d, q) means:',
     'opts':[
        {'t':'p AR terms, d differences, q MA terms','correct':True},
        {'t':'p periods, d days, q quarters'},
        {'t':'p parameters, d degrees of freedom, q quantiles'},
        {'t':'p predictors, d dummies, q quartiles'},
     ],
     'hints':['I = Integrated = d differences. AR = autoregressive. MA = moving average.'],
     'why':'ARIMA(p, d, q): AR(p) component models the series as a linear function of its own p lags; I(d) = number of differences taken; MA(q) component models the error as a linear function of q past errors.'},
    {'id':'ts_seasonal', 'type':'mcq', 'diff':2, 'topic':'decomposition',
     'q':'<code>decompose()</code> or <code>stl()</code> typically separates a series into:',
     'opts':[
        {'t':'Trend + seasonal + remainder','correct':True},
        {'t':'AR + MA + I'},
        {'t':'Mean + median + mode'},
        {'t':'High + low + medium frequency'},
     ],
     'hints':['Classical decomposition: trend, seasonality, residual.'],
     'why':'Classical decomposition (additive or multiplicative): observed = trend + seasonal + remainder. STL (Seasonal-Trend decomposition using Loess) is a robust variant.'},

    # Hard MCQ
    {'id':'ts_forecast_horizon', 'type':'mcq', 'diff':3, 'topic':'forecasting',
     'q':'For a forecast with horizon h, prediction intervals typically:',
     'opts':[
        {'t':'Stay the same width regardless of h'},
        {'t':'Grow wider as h increases, reflecting compounding uncertainty','correct':True},
        {'t':'Shrink as h increases'},
        {'t':'Are not defined for h > 1'},
     ],
     'hints':['Uncertainty about the future compounds.'],
     'why':'Prediction intervals widen with horizon because uncertainty compounds — the variance of the multi-step-ahead error grows with h. A flat horizon-1 interval is misleading.'},
    {'id':'ts_auto_arima', 'type':'mcq', 'diff':3, 'topic':'models',
     'q':'<code>auto.arima()</code> (forecast package) does what?',
     'opts':[
        {'t':'Forces an ARIMA(1,1,1) on the data'},
        {'t':'Searches over p, d, q and seasonal counterparts to pick the model by AICc or BIC','correct':True},
        {'t':'Plots the series'},
        {'t':'Tests for stationarity only'},
     ],
     'hints':['auto.arima = automated order selection.'],
     'why':'auto.arima() uses stepwise + KPSS tests (or full grid with stepwise=FALSE) to choose (p, d, q) and seasonal (P, D, Q) by an information criterion. Tweak with seasonal=, stepwise=, approximation=.'},
    {'id':'ts_ets', 'type':'mcq', 'diff':3, 'topic':'models',
     'q':'ETS models stand for:',
     'opts':[
        {'t':'Estimated Time Series'},
        {'t':'Error, Trend, Seasonality — a family of exponential-smoothing state-space models','correct':True},
        {'t':'Estimated Trend Smoothing'},
        {'t':'Exponential Time Series'},
     ],
     'hints':['ETS = three letters for the three components and their (additive/multiplicative/none) types.'],
     'why':'ETS = Error/Trend/Seasonality. Each can be Additive (A), Multiplicative (M), or None (N) — e.g., ETS(A,N,A) is Holt-Winters with additive seasonality and no trend. Hyndman\'s forecast package automates selection.'},

    # Easy code
    {'id':'ts_code_ts_create', 'type':'code', 'diff':1, 'topic':'objects',
     'prompt':'Write <code>monthly_ts(values, start_year)</code> that wraps the numeric vector <code>values</code> into a monthly time-series object starting in January of <code>start_year</code>.',
     'fnName':'monthly_ts',
     'starter':'monthly_ts <- function(values, start_year) {\n  # Your code here\n  \n}',
     'tests':'x <- monthly_ts(1:24, 2020)\nstopifnot(is.ts(x))\nstopifnot(frequency(x) == 12)\nstopifnot(start(x)[1] == 2020)\nstopifnot(start(x)[2] == 1)\nstopifnot(length(x) == 24)',
     'hints':['ts(values, start = c(start_year, 1), frequency = 12).'],
     'why':'<code>ts(values, start = c(start_year, 1), frequency = 12)</code>. start is a (year, period) tuple; frequency = 12 declares monthly.'},
    {'id':'ts_code_diff', 'type':'code', 'diff':1, 'topic':'stationarity',
     'prompt':'Write <code>n_diffs_to_stationary(x)</code> that takes a numeric vector, computes consecutive differences (diff), and returns 1 if the differenced series has smaller variance than the original, 0 otherwise.',
     'fnName':'n_diffs_to_stationary',
     'starter':'n_diffs_to_stationary <- function(x) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\ntrend <- 1:100 + rnorm(100)\nstopifnot(n_diffs_to_stationary(trend) == 1)\nstable <- rnorm(100)\n# stable already has lower variance than its diff (or close)\nstopifnot(n_diffs_to_stationary(stable) == 0)',
     'hints':['Compute var(diff(x)) and var(x); compare.','Return as.integer(var(diff(x)) < var(x)).'],
     'why':'<code>as.integer(var(diff(x)) &lt; var(x))</code>. Trended series have a variance dominated by the trend; differencing removes it and shrinks variance.'},

    # Medium code
    {'id':'ts_code_acf_lag1', 'type':'code', 'diff':2, 'topic':'autocorrelation',
     'prompt':'Write <code>lag1_autocorr(x)</code> that returns the lag-1 autocorrelation of the numeric vector <code>x</code> as a single numeric (the cor between x and lag-1 x). Don\'t use acf() — use cor() directly on the shifted series.',
     'fnName':'lag1_autocorr',
     'starter':'lag1_autocorr <- function(x) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nx <- arima.sim(model = list(ar = 0.7), n = 200)\nr <- lag1_autocorr(as.numeric(x))\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 1)\nstopifnot(r > 0.5 && r < 0.9)\nwhite <- rnorm(200)\nr2 <- lag1_autocorr(white)\nstopifnot(abs(r2) < 0.3)',
     'hints':['x[-1] is x without the first element; x[-length(x)] is x without the last.','cor(x[-1], x[-length(x)]) compares each value with its previous neighbor.'],
     'why':'<code>cor(x[-1], x[-length(x)])</code>. Drops the first element from one copy and the last from another, then correlates the aligned pairs.'},
    {'id':'ts_code_decompose', 'type':'code', 'diff':2, 'topic':'decomposition',
     'prompt':'Write <code>seasonal_strength(x)</code> that takes a ts object, runs <code>decompose(x)</code>, and returns 1 minus var(remainder) / var(seasonal + remainder) — a rough "seasonal strength" measure in [0, 1].',
     'fnName':'seasonal_strength',
     'starter':'seasonal_strength <- function(x) {\n  # Your code here\n  \n}',
     'tests':'ap <- AirPassengers\nr <- seasonal_strength(ap)\nstopifnot(is.numeric(r))\nstopifnot(r > 0 && r < 1)\n# AirPassengers has strong seasonality\nstopifnot(r > 0.5)',
     'hints':['d <- decompose(x); seasonal <- d$seasonal; remainder <- d$random.','Drop NAs before computing var: var(seasonal + remainder, na.rm = TRUE).','Return 1 - var(remainder, na.rm = TRUE) / var(seasonal + remainder, na.rm = TRUE).'],
     'why':'<code>d &lt;- decompose(x); 1 - var(d$random, na.rm = TRUE) / var(d$seasonal + d$random, na.rm = TRUE)</code>. The ratio of remainder variance to seasonal+remainder variance — closer to 0 means seasonality explains most of the non-trend variation.'},

    # Hard code
    {'id':'ts_code_arima_fit', 'type':'code', 'diff':3, 'topic':'models',
     'prompt':'Write <code>fit_arima_order(x, p, d, q)</code> that fits an ARIMA(p, d, q) model on numeric vector <code>x</code> via <code>arima()</code> and returns a list with <code>aic</code> (the AIC) and <code>coefs</code> (the named coefficient vector).',
     'fnName':'fit_arima_order',
     'starter':'fit_arima_order <- function(x, p, d, q) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nx <- as.numeric(arima.sim(model = list(ar = 0.6), n = 100))\nr <- fit_arima_order(x, 1, 0, 0)\nstopifnot(is.list(r))\nstopifnot(all(c("aic", "coefs") %in% names(r)))\nstopifnot(is.numeric(r$aic))\nstopifnot(is.numeric(r$coefs))\nstopifnot("ar1" %in% names(r$coefs))\nstopifnot(abs(r$coefs[["ar1"]] - 0.6) < 0.2)',
     'hints':['arima(x, order = c(p, d, q)) returns a fitted model.','$aic and coef(fit) give the metrics.'],
     'why':'<code>fit &lt;- arima(x, order = c(p, d, q)); list(aic = fit$aic, coefs = coef(fit))</code>. AIC for model comparison; coefs for interpretation.'},
    {'id':'ts_code_forecast_h', 'type':'code', 'diff':3, 'topic':'forecasting',
     'prompt':'Write <code>forecast_h_step(x, h)</code> that fits an ARIMA(1,0,0) (AR(1)) to numeric vector <code>x</code> and returns a numeric vector of length <code>h</code>: the point forecasts h steps ahead.',
     'fnName':'forecast_h_step',
     'starter':'forecast_h_step <- function(x, h) {\n  # Your code here\n  \n}',
     'tests':'set.seed(1)\nx <- as.numeric(arima.sim(model = list(ar = 0.6), n = 100))\nr <- forecast_h_step(x, 5)\nstopifnot(is.numeric(r))\nstopifnot(length(r) == 5)\n# AR(1) forecasts decay toward the mean (here 0)\nstopifnot(abs(r[5]) < abs(r[1]) + 1)',
     'hints':['fit <- arima(x, order = c(1, 0, 0)).','predict(fit, n.ahead = h)$pred gives the forecast vector.','as.numeric() to strip the ts attribute.'],
     'why':'<code>as.numeric(predict(arima(x, order = c(1, 0, 0)), n.ahead = h)$pred)</code>. predict on an arima fit returns the point forecast + standard error; $pred is the vector.'},
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
    # Easy MCQ
    {'id':'iv_assign', 'type':'mcq', 'diff':1, 'topic':'fundamentals',
     'q':'In R, what is the difference between <code>=</code> and <code>&lt;-</code>?',
     'opts':[
        {'t':'They are entirely interchangeable in every context'},
        {'t':'Both assign; <code>&lt;-</code> is preferred convention. <code>=</code> can\'t be used at top level in some restricted contexts','correct':True},
        {'t':'<code>=</code> assigns, <code>&lt;-</code> compares'},
        {'t':'<code>&lt;-</code> only works inside functions'},
     ],
     'hints':['Both assign. Style guide prefers <code>&lt;-</code>.'],
     'why':'Both work for assignment. <code>=</code> can fail in some edge cases (e.g., as a top-level expression in certain contexts) and the community style guide prefers <code>&lt;-</code>. <code>=</code> is also used for named function arguments.'},
    {'id':'iv_vec_type', 'type':'mcq', 'diff':1, 'topic':'fundamentals',
     'q':'What is the result of <code>typeof(c(1, "a"))</code>?',
     'opts':[
        {'t':'"list"'},
        {'t':'"character"','correct':True},
        {'t':'"mixed"'},
        {'t':'an error'},
     ],
     'hints':['Atomic vectors coerce to a single type. The hierarchy: logical < integer < double < character.'],
     'why':'When c() combines values of different types, R coerces to the most-flexible type. Numeric coerces to character (more general). So c(1, "a") becomes c("1", "a") — type "character".'},
    {'id':'iv_dataframe_vs_list', 'type':'mcq', 'diff':1, 'topic':'fundamentals',
     'q':'A data frame is technically:',
     'opts':[
        {'t':'A matrix'},
        {'t':'A list of equal-length vectors with row names','correct':True},
        {'t':'A 2D array'},
        {'t':'A type of factor'},
     ],
     'hints':['Internally, a data frame is a list with extra structure.'],
     'why':'A data frame is a list whose elements are equal-length vectors representing columns. The row.names attribute identifies rows. is.list(df) returns TRUE.'},
    {'id':'iv_apply_family', 'type':'mcq', 'diff':1, 'topic':'apply',
     'q':'Which "apply" function always returns a list?',
     'opts':[{'t':'<code>sapply()</code>'},{'t':'<code>vapply()</code>'},{'t':'<code>lapply()</code>','correct':True},{'t':'<code>mapply()</code>'}],
     'hints':['l = list. The "l" prefix tells you the return type.'],
     'why':'<code>lapply()</code> always returns a list. <code>sapply()</code> tries to simplify (to a vector or matrix). <code>vapply()</code> requires you to declare the output template.'},

    # Medium MCQ
    {'id':'iv_lazy_eval', 'type':'mcq', 'diff':2, 'topic':'functions',
     'q':'R uses lazy evaluation for function arguments. What does that mean?',
     'opts':[
        {'t':'Arguments are evaluated only when they are first used in the function body','correct':True},
        {'t':'Arguments are evaluated in reverse order'},
        {'t':'Arguments are never evaluated unless requested'},
        {'t':'Arguments are pre-computed at definition time'},
     ],
     'hints':['"Lazy" = deferred until needed.'],
     'why':'R uses lazy (call-by-need) evaluation: function arguments are promises evaluated only when first referenced. Lets you write functions that ignore their args if not needed and enables non-standard evaluation idioms.'},
    {'id':'iv_environment', 'type':'mcq', 'diff':2, 'topic':'scope',
     'q':'When a function is called, where does R look up free variables?',
     'opts':[
        {'t':'In the caller\'s environment'},
        {'t':'In the environment where the function was defined (lexical scoping)','correct':True},
        {'t':'In the global environment only'},
        {'t':'In the package environment'},
     ],
     'hints':['Lexical scoping: variables are resolved in the environment of definition, not the environment of invocation.'],
     'why':'R uses lexical scoping. A function carries a reference to its defining environment. Free variables are looked up by walking up parent environments starting there, NOT from where the function is called.'},
    {'id':'iv_closures', 'type':'mcq', 'diff':2, 'topic':'functions',
     'q':'A "closure" in R is:',
     'opts':[
        {'t':'A way to close a file handle'},
        {'t':'A function that captures variables from its enclosing scope','correct':True},
        {'t':'A loop construct'},
        {'t':'A special data structure for sets'},
     ],
     'hints':['Closures = function + its enclosing environment.'],
     'why':'A closure is a function paired with the environment in which it was defined. It can read (and with <code>&lt;&lt;-</code> modify) variables from that enclosing environment, enabling stateful function factories.'},
    {'id':'iv_s3', 'type':'mcq', 'diff':2, 'topic':'OOP',
     'q':'Which is true about R\'s S3 object system?',
     'opts':[
        {'t':'It enforces strict types and inheritance'},
        {'t':'It uses a "class" attribute on objects and dispatches generic functions by class name','correct':True},
        {'t':'It is identical to Python\'s class system'},
        {'t':'It requires explicit method declarations'},
     ],
     'hints':['S3 = informal class via attribute + generic dispatch.'],
     'why':'S3 is R\'s informal OOP system: setting class(x) <- "foo" makes generic functions dispatch to foo methods like print.foo. Simple but unenforced — no strict typing, multiple inheritance via vector classes.'},

    # Hard MCQ
    {'id':'iv_promise', 'type':'mcq', 'diff':3, 'topic':'functions',
     'q':'A "promise" in R is:',
     'opts':[
        {'t':'A type of database transaction'},
        {'t':'An unevaluated argument expression captured along with its environment','correct':True},
        {'t':'A guarantee that a function will run'},
        {'t':'A reactive value'},
     ],
     'hints':['Promises are the mechanism behind lazy evaluation.'],
     'why':'A promise wraps an unevaluated expression with the environment it was created in. When the value is first needed, the promise forces — evaluates the expression, caches the result. <code>force()</code> evaluates explicitly.'},
    {'id':'iv_copy_modify', 'type':'mcq', 'diff':3, 'topic':'memory',
     'q':'In R, what happens when you do <code>y &lt;- x; y[1] &lt;- 99</code>?',
     'opts':[
        {'t':'x is modified too (R uses reference semantics)'},
        {'t':'y becomes a copy on modification; x is unchanged','correct':True},
        {'t':'It throws a "cannot modify in place" error'},
        {'t':'y is undefined until the next garbage collection'},
     ],
     'hints':['R has copy-on-modify semantics for most objects.'],
     'why':'R uses copy-on-modify: <code>y &lt;- x</code> shares memory until y is modified, at which point R copies the underlying data. data.table and environments are notable exceptions with reference semantics.'},
    {'id':'iv_nse', 'type':'mcq', 'diff':3, 'topic':'metaprogramming',
     'q':'Non-standard evaluation (NSE) in R lets you:',
     'opts':[
        {'t':'Skip evaluating expressions entirely'},
        {'t':'Capture and manipulate unevaluated expressions before they run (e.g., dplyr column names)','correct':True},
        {'t':'Bypass type checking'},
        {'t':'Run R code in JavaScript'},
     ],
     'hints':['NSE = how dplyr lets you write df %>% filter(x > 5) instead of df[df$x > 5, ].'],
     'why':'NSE captures the expression as a quoted form rather than evaluating immediately. dplyr uses NSE to interpret bare column names. <code>quote()</code>, <code>bquote()</code>, <code>substitute()</code>, and tidy eval ({{ }}) are the toolkit.'},

    # Easy code
    {'id':'iv_code_fib', 'type':'code', 'diff':1, 'topic':'recursion',
     'prompt':'Write <code>fib(n)</code> that returns the n-th Fibonacci number (1, 1, 2, 3, 5, 8, ...). The 1st and 2nd Fibonacci numbers are both 1. Use recursion or iteration — your choice.',
     'fnName':'fib',
     'starter':'fib <- function(n) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(fib(1) == 1)\nstopifnot(fib(2) == 1)\nstopifnot(fib(3) == 2)\nstopifnot(fib(10) == 55)\nstopifnot(fib(15) == 610)',
     'hints':['Base case: n <= 2 returns 1.','Recursive: fib(n) = fib(n-1) + fib(n-2).','Iterative is faster but recursion is the canonical interview answer.'],
     'why':'<code>if (n &lt;= 2) 1 else fib(n - 1) + fib(n - 2)</code>. Recursive is clean; for large n, iterative or memoized variants avoid exponential blowup.'},
    {'id':'iv_code_reverse', 'type':'code', 'diff':1, 'topic':'vectors',
     'prompt':'Write <code>reverse_vec(x)</code> that returns the vector <code>x</code> in reverse order. Do not use <code>rev()</code>.',
     'fnName':'reverse_vec',
     'starter':'reverse_vec <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(reverse_vec(c(1,2,3)), c(3,2,1)))\nstopifnot(identical(reverse_vec(c("a","b","c","d")), c("d","c","b","a")))\nstopifnot(length(reverse_vec(integer(0))) == 0)',
     'hints':['Negative integer subscripts: x[length(x):1].','Watch for empty vector — length(x):1 generates c(0, 1) for empty.'],
     'why':'<code>if (length(x) == 0) x else x[length(x):1]</code>. Subscripting with a decreasing index sequence reorders. Guard the empty case to avoid the weird seq(0, 1) behavior.'},

    # Medium code
    {'id':'iv_code_word_freq', 'type':'code', 'diff':2, 'topic':'strings',
     'prompt':'Write <code>word_freq(text)</code> that takes a single character string and returns a named integer vector of word counts (case-insensitive, words split on whitespace). Sort descending by count.',
     'fnName':'word_freq',
     'starter':'word_freq <- function(text) {\n  # Your code here\n  \n}',
     'tests':'r <- word_freq("the quick brown fox jumps over the lazy dog the the")\nstopifnot(is.integer(r) || is.numeric(r))\nstopifnot(r[["the"]] == 4)\nstopifnot(r[["fox"]] == 1)\nstopifnot(r[1] >= r[length(r)])  # sorted descending\nstopifnot(length(word_freq("")) == 0)',
     'hints':['tolower() to canonicalize case.','strsplit(text, "\\\\s+") splits on whitespace; [[1]] unwraps the list.','table() counts; sort(table(...), decreasing = TRUE) ranks.'],
     'why':'<code>words &lt;- strsplit(tolower(text), "\\\\s+")[[1]]; words &lt;- words[nzchar(words)]; sort(table(words), decreasing = TRUE)</code>. Watch for empty strings after splitting (e.g., when text is empty or has leading whitespace).'},
    {'id':'iv_code_dedup_keep_order', 'type':'code', 'diff':2, 'topic':'vectors',
     'prompt':'Write <code>unique_in_order(x)</code> that returns the unique elements of <code>x</code> in the order of their FIRST appearance. (R\'s base <code>unique()</code> already does this — but implement it without using unique().)',
     'fnName':'unique_in_order',
     'starter':'unique_in_order <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(unique_in_order(c(3, 1, 2, 1, 3, 4)), c(3, 1, 2, 4)))\nstopifnot(identical(unique_in_order(c("a","b","a","c","b")), c("a","b","c")))\nstopifnot(length(unique_in_order(integer(0))) == 0)',
     'hints':['Use !duplicated(x) — TRUE for the first occurrence, FALSE thereafter.','x[!duplicated(x)] keeps first-occurrence elements in order.'],
     'why':'<code>x[!duplicated(x)]</code>. duplicated() flags subsequent occurrences; negating keeps each first instance in its original position.'},

    # Hard code
    {'id':'iv_code_two_sum', 'type':'code', 'diff':3, 'topic':'algorithms',
     'prompt':'Write <code>two_sum(nums, target)</code> that returns the indices of the TWO numbers in <code>nums</code> that add up to <code>target</code>, as a length-2 integer vector. Each input has exactly one solution. Assume 1-indexed (so for c(2,7,11,15), target=9, return c(1,2)).',
     'fnName':'two_sum',
     'starter':'two_sum <- function(nums, target) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(sort(two_sum(c(2,7,11,15), 9)), c(1L, 2L)))\nstopifnot(identical(sort(two_sum(c(3,2,4), 6)), c(2L, 3L)))\nstopifnot(identical(sort(two_sum(c(3,3), 6)), c(1L, 2L)))',
     'hints':['Naive O(n^2): two nested loops.','Better: use an environment as a hashmap — for each num, check if target - num was seen; if so, return the indices.','env <- new.env(hash = TRUE); for each i: complement <- as.character(target - nums[i]); if (exists(complement, envir = env)) return(c(env[[complement]], i)); env[[as.character(nums[i])]] <- i.'],
     'why':'Hash-map approach gives O(n): for each new num, check if target - num was seen earlier. If yes, return the pair. If no, record the current index. R\'s environments make decent hashmaps with as.character() keys.'},
    {'id':'iv_code_running_max', 'type':'code', 'diff':3, 'topic':'algorithms',
     'prompt':'Write <code>running_max(x)</code> that returns a numeric vector of the same length as <code>x</code>, where element <code>i</code> is the maximum of <code>x[1:i]</code>. Implement without <code>cummax()</code> — use Reduce or sapply.',
     'fnName':'running_max',
     'starter':'running_max <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(running_max(c(1, 3, 2, 5, 4)), c(1, 3, 3, 5, 5)))\nstopifnot(identical(running_max(c(5, 4, 3, 2, 1)), c(5, 5, 5, 5, 5)))\nstopifnot(length(running_max(integer(0))) == 0)\nstopifnot(identical(running_max(c(-3, -1, -5, 0)), c(-3, -1, -1, 0)))',
     'hints':['Reduce(pmax, x, accumulate = TRUE) walks left-to-right with accumulating max.','Or sapply(seq_along(x), function(i) max(x[1:i])).'],
     'why':'<code>Reduce(pmax, x, accumulate = TRUE)</code>. Reduce with accumulate=TRUE returns the running result at each step. pmax (parallel max) here just degrades to scalar max since each step compares two scalars.'},
]


# ---------------------------------------------------------------------------
# QUIZ 10: Functional Programming
# ---------------------------------------------------------------------------
FP_BANK = [
    # Easy MCQ
    {'id':'fp_purr_map', 'type':'mcq', 'diff':1, 'topic':'purrr',
     'q':'In purrr, <code>map(x, f)</code> always returns:',
     'opts':[{'t':'A numeric vector'},{'t':'A list','correct':True},{'t':'A data frame'},{'t':'NULL'}],
     'hints':['Like lapply, map returns a list. Use map_dbl, map_int, map_chr for typed returns.'],
     'why':'<code>map()</code> always returns a list. Use type-stable variants (<code>map_dbl()</code>, <code>map_chr()</code>, <code>map_lgl()</code>, <code>map_int()</code>) when you know the return type — they error if the function returns the wrong type.'},
    {'id':'fp_higher_order', 'type':'mcq', 'diff':1, 'topic':'concepts',
     'q':'A higher-order function is one that:',
     'opts':[
        {'t':'Returns higher numeric precision'},
        {'t':'Takes functions as arguments OR returns a function','correct':True},
        {'t':'Is defined inside another function'},
        {'t':'Has more than 5 arguments'},
     ],
     'hints':['Higher-order = operates on functions.'],
     'why':'A higher-order function takes one or more functions as arguments and/or returns a function. <code>Map</code>, <code>Reduce</code>, <code>Filter</code>, <code>purrr::compose</code> are all higher-order.'},
    {'id':'fp_anonymous', 'type':'mcq', 'diff':1, 'topic':'syntax',
     'q':'Which is the modern R 4.1+ anonymous function syntax?',
     'opts':[
        {'t':'<code>fn(x) x * 2</code>'},
        {'t':'<code>\\(x) x * 2</code>','correct':True},
        {'t':'<code>lambda x: x * 2</code>'},
        {'t':'<code>function(x) -&gt; x * 2</code>'},
     ],
     'hints':['Base R 4.1 added the backslash lambda shorthand.'],
     'why':'<code>\\(x) x * 2</code> is the base R 4.1+ shorthand for <code>function(x) x * 2</code>. Equivalent semantically; just less typing in pipelines.'},
    {'id':'fp_reduce', 'type':'mcq', 'diff':1, 'topic':'reduce',
     'q':'<code>Reduce("+", 1:4)</code> returns:',
     'opts':[{'t':'<code>4</code>'},{'t':'<code>10</code>','correct':True},{'t':'<code>c(1, 3, 6, 10)</code>'},{'t':'<code>"1234"</code>'}],
     'hints':['Reduce folds left-to-right: ((1+2)+3)+4 = 10.'],
     'why':'Reduce applies a binary function cumulatively: (((1+2)+3)+4) = 10. For the intermediate values, pass accumulate = TRUE: returns c(1, 3, 6, 10).'},

    # Medium MCQ
    {'id':'fp_map_chr', 'type':'mcq', 'diff':2, 'topic':'purrr',
     'q':'<code>map_chr(1:3, ~ paste0("item_", .x))</code> returns:',
     'opts':[
        {'t':'A list of 3 character strings'},
        {'t':'A character vector of length 3','correct':True},
        {'t':'An error'},
        {'t':'NULL'},
     ],
     'hints':['map_chr returns a character vector and errors if .f returns anything else per element.'],
     'why':'map_chr returns a character VECTOR (not list), one element per input. The lambda <code>~ paste0("item_", .x)</code> uses .x for the current element — purrr shorthand for <code>function(x) paste0("item_", x)</code>.'},
    {'id':'fp_filter', 'type':'mcq', 'diff':2, 'topic':'base',
     'q':'<code>Filter(function(x) x &gt; 0, c(-2, -1, 0, 1, 2))</code> returns:',
     'opts':[
        {'t':'<code>c(1, 2)</code>','correct':True},
        {'t':'<code>c(TRUE, TRUE, FALSE, FALSE)</code>'},
        {'t':'<code>5</code>'},
        {'t':'<code>c(-2, -1, 0)</code>'},
     ],
     'hints':['Filter keeps elements where the predicate returns TRUE.'],
     'why':'Filter applies the predicate to each element and keeps the ones where it returns TRUE. Note: 0 is FALSE (predicate gives 0 &gt; 0 → FALSE), so 0 is dropped.'},
    {'id':'fp_partial', 'type':'mcq', 'diff':2, 'topic':'purrr',
     'q':'<code>purrr::partial(paste, sep = "-")</code> returns:',
     'opts':[
        {'t':'A pasted string'},
        {'t':'A new function with sep pre-filled, leaving other args open','correct':True},
        {'t':'The original paste function unchanged'},
        {'t':'A list'},
     ],
     'hints':['partial = partial application = pre-filling some arguments.'],
     'why':'partial() returns a new function with the specified args already bound. <code>p &lt;- partial(paste, sep = "-"); p("a", "b")</code> returns "a-b".'},
    {'id':'fp_compose', 'type':'mcq', 'diff':2, 'topic':'purrr',
     'q':'<code>f &lt;- compose(sqrt, abs)</code> creates a function f such that:',
     'opts':[
        {'t':'<code>f(x) = sqrt(abs(x))</code> — applied right-to-left','correct':True},
        {'t':'<code>f(x) = abs(sqrt(x))</code>'},
        {'t':'<code>f(x) = sqrt(x) + abs(x)</code>'},
        {'t':'<code>f(x) = sqrt(x) * abs(x)</code>'},
     ],
     'hints':['compose applies right-to-left by default (mathematical composition).'],
     'why':'compose(sqrt, abs) returns a function equivalent to <code>function(x) sqrt(abs(x))</code> — rightmost runs first. Use <code>compose(..., .dir = "forward")</code> to reverse the order if you prefer left-to-right.'},

    # Hard MCQ
    {'id':'fp_pure', 'type':'mcq', 'diff':3, 'topic':'concepts',
     'q':'A "pure" function:',
     'opts':[
        {'t':'Is shorter than 10 lines'},
        {'t':'Returns the same output for the same input AND has no observable side effects','correct':True},
        {'t':'Cannot use loops'},
        {'t':'Always returns NULL'},
     ],
     'hints':['Pure = deterministic + no side effects.'],
     'why':'A pure function depends only on its inputs (deterministic) and produces no observable side effects (no IO, no mutation of state outside its own scope). Pure functions compose well and are easy to test.'},
    {'id':'fp_currying', 'type':'mcq', 'diff':3, 'topic':'concepts',
     'q':'Currying transforms a function f(a, b, c) into:',
     'opts':[
        {'t':'A faster version of f'},
        {'t':'A chain of unary functions: f(a)(b)(c)','correct':True},
        {'t':'A function that ignores some arguments'},
        {'t':'A type-checked version'},
     ],
     'hints':['Currying: multi-arg function → chain of single-arg functions.'],
     'why':'Currying converts a multi-argument function into a chain of single-argument functions, each returning the next. R doesn\'t curry by default, but partial application and closures give similar flexibility.'},
    {'id':'fp_walk', 'type':'mcq', 'diff':3, 'topic':'purrr',
     'q':'When do you use <code>walk()</code> instead of <code>map()</code>?',
     'opts':[
        {'t':'When the input is a directory path'},
        {'t':'When the function is called for its side effects (printing, writing files) and you don\'t need a return value','correct':True},
        {'t':'When the input is a list'},
        {'t':'There is no difference'},
     ],
     'hints':['walk = "I want side effects, not a result."'],
     'why':'walk() is like map() but invisibly returns the input unchanged. Use when you want side effects (write to disk, print) without the overhead/noise of collecting return values.'},

    # Easy code
    {'id':'fp_code_map_dbl', 'type':'code', 'diff':1, 'topic':'purrr',
     'prompt':'Write <code>squares(x)</code> that takes a numeric vector and returns a numeric vector where each element is the square of the input. Use <code>purrr::map_dbl()</code> with a tilde-formula lambda.',
     'fnName':'squares',
     'starter':'library(purrr)\n\nsquares <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(squares(c(1, 2, 3)), c(1, 4, 9)))\nstopifnot(identical(squares(c(0, -2)), c(0, 4)))\nstopifnot(length(squares(numeric(0))) == 0)',
     'hints':['map_dbl(x, ~ .x ^ 2) — .x is the current element.'],
     'why':'<code>map_dbl(x, ~ .x ^ 2)</code>. map_dbl returns a numeric vector, errors on type mismatch. The ~ creates a quick lambda where .x is the input.'},
    {'id':'fp_code_filter', 'type':'code', 'diff':1, 'topic':'base',
     'prompt':'Write <code>keep_evens(x)</code> that returns only the even elements of integer vector <code>x</code>. Use <code>Filter()</code>.',
     'fnName':'keep_evens',
     'starter':'keep_evens <- function(x) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(identical(keep_evens(1:10), c(2L, 4L, 6L, 8L, 10L)))\nstopifnot(identical(keep_evens(c(1L, 3L, 5L)), integer(0)))\nstopifnot(identical(keep_evens(c(2L, 4L)), c(2L, 4L)))',
     'hints':['Filter(function(n) n %% 2 == 0, x) keeps elements where the predicate returns TRUE.'],
     'why':'<code>Filter(function(n) n %% 2 == 0, x)</code>. The predicate checks divisibility by 2; Filter retains elements where the predicate returns TRUE.'},

    # Medium code
    {'id':'fp_code_reduce', 'type':'code', 'diff':2, 'topic':'reduce',
     'prompt':'Write <code>concat_strings(strs, sep)</code> that takes a character vector and a separator, and returns a single string with all elements joined by <code>sep</code>. Use <code>Reduce()</code> (NOT <code>paste0(..., collapse = ...)</code>).',
     'fnName':'concat_strings',
     'starter':'concat_strings <- function(strs, sep) {\n  # Your code here\n  \n}',
     'tests':'stopifnot(concat_strings(c("a","b","c"), "-") == "a-b-c")\nstopifnot(concat_strings(c("hello","world"), " ") == "hello world")\nstopifnot(concat_strings("one", "-") == "one")\nstopifnot(concat_strings(character(0), "-") == "")',
     'hints':['Reduce(function(acc, s) paste0(acc, sep, s), strs).','Handle empty input: if (length(strs) == 0) return("").'],
     'why':'<code>if (length(strs) == 0) "" else Reduce(function(acc, s) paste0(acc, sep, s), strs)</code>. Reduce folds left-to-right, accumulating the joined result.'},
    {'id':'fp_code_compose', 'type':'code', 'diff':2, 'topic':'purrr',
     'prompt':'Write <code>make_pipeline(funcs)</code> that takes a list of single-argument functions and returns a new function that applies them LEFT-to-RIGHT to its input. (i.e., for funcs = list(abs, sqrt, round), the resulting function applies abs, then sqrt, then round.)',
     'fnName':'make_pipeline',
     'starter':'make_pipeline <- function(funcs) {\n  # Your code here\n  \n}',
     'tests':'p <- make_pipeline(list(abs, sqrt, round))\nstopifnot(p(-16) == 4)\nstopifnot(p(-25) == 5)\nq <- make_pipeline(list(function(x) x + 1, function(x) x * 2))\nstopifnot(q(3) == 8)\nidentity_p <- make_pipeline(list())\nstopifnot(identical(identity_p(42), 42))',
     'hints':['Return function(x) Reduce(function(acc, f) f(acc), funcs, init = x).','Empty funcs → return x unchanged (Reduce handles init).'],
     'why':'<code>function(x) Reduce(function(acc, f) f(acc), funcs, init = x)</code>. Reduce with an explicit init threads x through each function. Empty funcs returns the init unchanged.'},

    # Hard code
    {'id':'fp_code_memoize', 'type':'code', 'diff':3, 'topic':'closures',
     'prompt':'Write <code>memoize(f)</code> that takes a single-argument function and returns a new function that caches results. Calling the returned function with the same argument should return the cached value rather than recomputing.',
     'fnName':'memoize',
     'starter':'memoize <- function(f) {\n  # Your code here\n  \n}',
     'tests':'call_count <- 0\nslow_double <- function(x) { call_count <<- call_count + 1; x * 2 }\nfast <- memoize(slow_double)\nstopifnot(fast(3) == 6)\nstopifnot(fast(3) == 6)\nstopifnot(fast(3) == 6)\nstopifnot(call_count == 1)\nstopifnot(fast(4) == 8)\nstopifnot(call_count == 2)',
     'hints':['Create a cache environment in the enclosing scope: cache <- new.env(hash = TRUE).','Return function(x) { key <- as.character(x); if (!exists(key, envir = cache)) cache[[key]] <- f(x); cache[[key]] }.'],
     'why':'<code>cache &lt;- new.env(hash = TRUE); function(x) { key &lt;- as.character(x); if (!exists(key, envir = cache)) cache[[key]] &lt;- f(x); cache[[key]] }</code>. The cache lives in the closure; the returned function reads/writes it. Each new memoize call gets its own cache.'},
    {'id':'fp_code_safely', 'type':'code', 'diff':3, 'topic':'purrr',
     'prompt':'Write <code>safe_div(a, b)</code> that returns a list with elements <code>result</code> (the value of a/b, or NULL if b is 0) and <code>error</code> (NULL on success, or a string "division by zero" if b is 0). Do not throw an error.',
     'fnName':'safe_div',
     'starter':'safe_div <- function(a, b) {\n  # Your code here\n  \n}',
     'tests':'r1 <- safe_div(10, 2)\nstopifnot(is.list(r1))\nstopifnot(r1$result == 5)\nstopifnot(is.null(r1$error))\nr2 <- safe_div(10, 0)\nstopifnot(is.null(r2$result))\nstopifnot(r2$error == "division by zero")',
     'hints':['if (b == 0) return(list(result = NULL, error = "division by zero")).','Otherwise list(result = a / b, error = NULL).'],
     'why':'<code>if (b == 0) list(result = NULL, error = "division by zero") else list(result = a / b, error = NULL)</code>. This is the same shape purrr::safely() wraps functions to return — a Result/Either pattern in R.'},
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
