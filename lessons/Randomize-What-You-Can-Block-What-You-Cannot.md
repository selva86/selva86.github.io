---
title: "Experimental Design and A/B Testing Lesson 2: Randomize what you can, block what you cannot"
catalog_blurb: "Why randomization balances groups only on average, and how blocking fixes it."
description: "Twenty-four shoppers show why random assignment balances treatment groups only on average, and how blocking and stratified randomization fix known imbalances."
keywords: "randomization, blocking, stratified randomization, nuisance variable, experimental design, A/B testing, variance reduction, R"
post_type: "LESSON"
curriculum_id: "4.120.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-design"
course_title: "Experimental Design and A/B Testing"
course_lesson: "2"
course_total: "8"
course_landing: "Experimental-Design-and-A-B-Testing-Course.html"
course_next: "Factorial-Designs-and-the-Split-Plot-Trap"
course_prev: "Designing-a-Study-That-Can-Answer-the-Question"
---

=== step === cover
## Randomize what you can, block what you cannot

Today let's look at what actually keeps a treatment group and a control group comparable, and what can quietly throw that off even when nothing was done wrong.

Here is the example we will use throughout. A checkout page shows 24 returning shoppers one of two versions. 12 of them, the treatment group, see a new one-click checkout button. The other 12, the control group, see the current multi-step checkout. What gets measured is each shopper's total spend during that visit.

Before any of that happens, every shopper already carries two things that have nothing to do with which checkout they end up seeing. Each one has a cart value, somewhere between $18 and $210, and a device, desktop or mobile.

Here are all 24 shoppers, plotted by cart value against spend, with each dot colored by device.

::widget chart-plotter {"data":[{"x":76,"y":94.88,"fill":"desktop"},{"x":39,"y":57.14,"fill":"desktop"},{"x":106,"y":99.66,"fill":"mobile"},{"x":210,"y":157.43,"fill":"desktop"},{"x":153,"y":136.17,"fill":"desktop"},{"x":153,"y":146.85,"fill":"desktop"},{"x":179,"y":145.9,"fill":"desktop"},{"x":27,"y":65.96,"fill":"desktop"},{"x":152,"y":126.35,"fill":"mobile"},{"x":184,"y":154.99,"fill":"desktop"},{"x":104,"y":96.76,"fill":"mobile"},{"x":186,"y":146.71,"fill":"desktop"},{"x":40,"y":40.32,"fill":"desktop"},{"x":180,"y":120.75,"fill":"mobile"},{"x":80,"y":75.26,"fill":"desktop"},{"x":201,"y":132.25,"fill":"mobile"},{"x":43,"y":81.85,"fill":"desktop"},{"x":75,"y":76.09,"fill":"mobile"},{"x":117,"y":103.92,"fill":"desktop"},{"x":191,"y":150.99,"fill":"desktop"},{"x":18,"y":33.23,"fill":"desktop"},{"x":149,"y":132.42,"fill":"desktop"},{"x":98,"y":86.28,"fill":"mobile"},{"x":41,"y":57.14,"fill":"mobile"}],"geoms":["point"],"x":"cart_value","y":"spend"}

Spend climbs steadily as cart value rises, and the Pearson r in the corner puts a number on how steadily. Each dot's color marks the other fact that was already true about that shopper, desktop or mobile, long before either checkout version was ever shown to anyone.

=== step === concept
## The cart value every shopper already has, before the test even starts

Cart value is what experimenters call a nuisance variable. It is known before anyone is assigned a checkout version, it affects the outcome you actually care about, and it has nothing to do with the treatment itself.

Here, cart value affects spend in the most direct way possible. A shopper who already has $200 worth of items sitting in their cart is going to spend more at checkout than one who has $20 in there, no matter which checkout button they end up clicking. Pull the numbers for all 24 shoppers and look at them side by side.

```r
# Look at the 24 shoppers' cart value, device and spend together
cart_value <- c(76, 39, 106, 210, 153, 153, 179, 27, 152, 184, 104, 186,
                 40, 180, 80, 201, 43, 75, 117, 191, 18, 149, 98, 41)
device <- c("desktop", "desktop", "mobile", "desktop", "desktop", "desktop", "desktop",
            "desktop", "mobile", "desktop", "mobile", "desktop", "desktop", "mobile",
            "desktop", "mobile", "desktop", "mobile", "desktop", "desktop", "desktop",
            "desktop", "mobile", "mobile")
desktop_ind <- as.numeric(device == "desktop")

set.seed(55)
noise <- rnorm(24, 0, 9)
spend_base <- round(25 + 0.55 * cart_value + 12 * desktop_ind + noise, 2)

treatment <- rep(c(1, 0), c(12, 12))   # the actual 12 who saw each version
spend <- round(spend_base + 15 * treatment, 2)

round(cor(cart_value, spend), 3)
#> [1] 0.952

shoppers <- data.frame(shopper = 1:24, cart_value, device, spend)
shoppers
#>    shopper cart_value  device  spend
#> 1        1         76 desktop  94.88
#> 2        2         39 desktop  57.14
#> 3        3        106  mobile  99.66
#> 4        4        210 desktop 157.43
#> 5        5        153 desktop 136.17
#> 6        6        153 desktop 146.85
#> 7        7        179 desktop 145.90
#> 8        8         27 desktop  65.96
#> 9        9        152  mobile 126.35
#> 10      10        184 desktop 154.99
#> 11      11        104  mobile  96.76
#> 12      12        186 desktop 146.71
#> 13      13         40 desktop  40.32
#> 14      14        180  mobile 120.75
#> 15      15         80 desktop  75.26
#> 16      16        201  mobile 132.25
#> 17      17         43 desktop  81.85
#> 18      18         75  mobile  76.09
#> 19      19        117 desktop 103.92
#> 20      20        191 desktop 150.99
#> 21      21         18 desktop  33.23
#> 22      22        149 desktop 132.42
#> 23      23         98  mobile  86.28
#> 24      24         41  mobile  57.14
```

`spend_base` is what each shopper would spend with no checkout effect at all: their cart value, scaled up a bit, plus a touch of random noise, since real spending always wobbles a little even between shoppers with the same cart value. `treatment` marks the 12 shoppers who actually saw the new button with a 1 and the other 12 with a 0, and `spend` adds a real $15 to whichever 12 that happens to be. That $15 is the true effect of the new checkout button, built into this simulation on purpose, so every estimate from here on can be checked against a known right answer.

`cor(cart_value, spend)` comes out to 0.952. That is about as strong as a correlation gets outside of a formula: a shopper's cart value very nearly tells you what they are going to spend, regardless of which checkout button they happened to see.

This is exactly the kind of variable randomization is supposed to handle. Randomization's job, stated precisely, is this: it makes the treatment and control groups comparable on cart value, on device, and on every other nuisance variable, including ones nobody measured or even thought to look for, in expectation. "In expectation" means averaged over many hypothetical repeats of the very same coin flip that decided who got which checkout, not a guarantee about this one real assignment sitting in the table above.

=== step === widget
## What two thousand random splits actually look like

So randomization balances cart value only on average. What does that average actually look like, and how far can one real split land from it?

Let's find out by brute force. Split the 24 fixed cart values into a random group of 12 treatment and 12 control, over and over, 2,000 times, and each time record the gap between the two groups' average cart value.

```r
# Randomly split the 24 shoppers into 12/12 groups, 2,000 times, and record each
# split's gap in average cart value between the two groups
set.seed(1)
resplit_gaps_unblocked <- replicate(2000, {
  label <- sample(rep(c(1, 0), c(12, 12)))
  mean(cart_value[label == 1]) - mean(cart_value[label == 0])
})

round(mean(resplit_gaps_unblocked), 2)
#> [1] 0.15
round(sd(resplit_gaps_unblocked), 2)
#> [1] 25.53
round(range(resplit_gaps_unblocked), 2)
#> [1] -78.17  81.17
```

`sample()` only ever shuffles which 12 shopper slots land in the treatment group; `cart_value` itself never changes. Averaged across all 2,000 splits, the gap sits at 0.15, about as close to zero as you would hope, which is exactly what "balanced in expectation" looks like once you actually run the experiment many times.

But look at the spread. The standard deviation of that gap is $25.53, and across those 2,000 splits the most extreme ones landed as far as $78.17 below zero or $81.17 above it. Here are 500 of those 2,000 splits, drawn two ways.

::widget chart-plotter {"data":[{"x":6.17,"y":1},{"x":21.67,"y":2},{"x":-40.5,"y":3},{"x":45.33,"y":4},{"x":9.83,"y":5},{"x":18,"y":6},{"x":-21,"y":7},{"x":62.33,"y":8},{"x":8,"y":9},{"x":-3.33,"y":10},{"x":-20.33,"y":11},{"x":-3.17,"y":12},{"x":14.33,"y":13},{"x":16.5,"y":14},{"x":-13.67,"y":15},{"x":-21.17,"y":16},{"x":16.67,"y":17},{"x":47.67,"y":18},{"x":-13.83,"y":19},{"x":34.5,"y":20},{"x":-5.83,"y":21},{"x":-30.33,"y":22},{"x":-2.67,"y":23},{"x":6.83,"y":24},{"x":20.83,"y":25},{"x":-0.33,"y":26},{"x":44,"y":27},{"x":9.5,"y":28},{"x":46.17,"y":29},{"x":-59.5,"y":30},{"x":-48.33,"y":31},{"x":-41.83,"y":32},{"x":22,"y":33},{"x":10,"y":34},{"x":1.83,"y":35},{"x":-14.5,"y":36},{"x":39,"y":37},{"x":-5.33,"y":38},{"x":27.67,"y":39},{"x":7.17,"y":40},{"x":10.17,"y":41},{"x":-6.67,"y":42},{"x":7.33,"y":43},{"x":1.17,"y":44},{"x":18.33,"y":45},{"x":-34.5,"y":46},{"x":-17.33,"y":47},{"x":8.67,"y":48},{"x":71.33,"y":49},{"x":-35.83,"y":50},{"x":-43.83,"y":51},{"x":-46.17,"y":52},{"x":-23.67,"y":53},{"x":30.83,"y":54},{"x":6.17,"y":55},{"x":25.83,"y":56},{"x":15.33,"y":57},{"x":-21.83,"y":58},{"x":-17.67,"y":59},{"x":17.83,"y":60},{"x":-26.17,"y":61},{"x":-14.33,"y":62},{"x":25.83,"y":63},{"x":0.67,"y":64},{"x":17.5,"y":65},{"x":-18,"y":66},{"x":-39.17,"y":67},{"x":43.67,"y":68},{"x":20.83,"y":69},{"x":32.83,"y":70},{"x":-30.33,"y":71},{"x":23.17,"y":72},{"x":11.83,"y":73},{"x":0.17,"y":74},{"x":37.17,"y":75},{"x":15.33,"y":76},{"x":5.17,"y":77},{"x":-43.5,"y":78},{"x":-7.83,"y":79},{"x":-34,"y":80},{"x":-19.5,"y":81},{"x":1.5,"y":82},{"x":-46.17,"y":83},{"x":41.67,"y":84},{"x":-6.17,"y":85},{"x":33.17,"y":86},{"x":-17.33,"y":87},{"x":-0.5,"y":88},{"x":8,"y":89},{"x":19.5,"y":90},{"x":-18.5,"y":91},{"x":33.33,"y":92},{"x":-50.17,"y":93},{"x":-3,"y":94},{"x":0.17,"y":95},{"x":-23.33,"y":96},{"x":25.5,"y":97},{"x":35.67,"y":98},{"x":14.17,"y":99},{"x":13.67,"y":100},{"x":-15.5,"y":101},{"x":32.17,"y":102},{"x":-22.5,"y":103},{"x":-14.67,"y":104},{"x":16.83,"y":105},{"x":-23.33,"y":106},{"x":-30.5,"y":107},{"x":25.83,"y":108},{"x":-18.83,"y":109},{"x":-64.5,"y":110},{"x":-13.67,"y":111},{"x":16.33,"y":112},{"x":31.33,"y":113},{"x":19.33,"y":114},{"x":5.5,"y":115},{"x":0.5,"y":116},{"x":-55,"y":117},{"x":11.67,"y":118},{"x":-7.33,"y":119},{"x":17,"y":120},{"x":-43,"y":121},{"x":-56.5,"y":122},{"x":-15.83,"y":123},{"x":22.17,"y":124},{"x":-1,"y":125},{"x":5.33,"y":126},{"x":-41.17,"y":127},{"x":-3.83,"y":128},{"x":36,"y":129},{"x":-33.67,"y":130},{"x":24,"y":131},{"x":-12.33,"y":132},{"x":37.17,"y":133},{"x":9.83,"y":134},{"x":9.83,"y":135},{"x":-15.33,"y":136},{"x":3.67,"y":137},{"x":12.33,"y":138},{"x":5.5,"y":139},{"x":0.83,"y":140},{"x":-13.67,"y":141},{"x":15.83,"y":142},{"x":28.83,"y":143},{"x":-12.17,"y":144},{"x":5.5,"y":145},{"x":10.33,"y":146},{"x":24.67,"y":147},{"x":28.33,"y":148},{"x":6,"y":149},{"x":-24.17,"y":150},{"x":7,"y":151},{"x":10.67,"y":152},{"x":21.17,"y":153},{"x":4.67,"y":154},{"x":5.5,"y":155},{"x":-11.5,"y":156},{"x":-9.83,"y":157},{"x":1,"y":158},{"x":-19.33,"y":159},{"x":-16.17,"y":160},{"x":12.83,"y":161},{"x":26.67,"y":162},{"x":-12.5,"y":163},{"x":15.5,"y":164},{"x":27.17,"y":165},{"x":-19,"y":166},{"x":-1.33,"y":167},{"x":9,"y":168},{"x":26,"y":169},{"x":-22.33,"y":170},{"x":-21.33,"y":171},{"x":15.83,"y":172},{"x":-19.83,"y":173},{"x":36.17,"y":174},{"x":-1.5,"y":175},{"x":15.67,"y":176},{"x":41.17,"y":177},{"x":27.17,"y":178},{"x":-5.5,"y":179},{"x":-26.33,"y":180},{"x":-29.5,"y":181},{"x":-27.33,"y":182},{"x":-37.67,"y":183},{"x":38,"y":184},{"x":-10.83,"y":185},{"x":14.83,"y":186},{"x":-12.33,"y":187},{"x":-5.17,"y":188},{"x":27.33,"y":189},{"x":-9.67,"y":190},{"x":-61.5,"y":191},{"x":21.17,"y":192},{"x":-21.33,"y":193},{"x":-66.33,"y":194},{"x":-16.67,"y":195},{"x":11.67,"y":196},{"x":53.33,"y":197},{"x":18.5,"y":198},{"x":-37.67,"y":199},{"x":21.33,"y":200},{"x":-16.5,"y":201},{"x":-23,"y":202},{"x":-6.33,"y":203},{"x":-12.67,"y":204},{"x":-17,"y":205},{"x":-20.17,"y":206},{"x":-47.5,"y":207},{"x":-22.67,"y":208},{"x":-12,"y":209},{"x":11.17,"y":210},{"x":-44,"y":211},{"x":-16.5,"y":212},{"x":7.67,"y":213},{"x":-13,"y":214},{"x":-6.67,"y":215},{"x":-10.33,"y":216},{"x":-5.5,"y":217},{"x":-25,"y":218},{"x":-43.33,"y":219},{"x":20,"y":220},{"x":-58,"y":221},{"x":6,"y":222},{"x":26.83,"y":223},{"x":24.67,"y":224},{"x":-20.33,"y":225},{"x":0.67,"y":226},{"x":-6.83,"y":227},{"x":18.5,"y":228},{"x":19.83,"y":229},{"x":-13.5,"y":230},{"x":31.83,"y":231},{"x":10.83,"y":232},{"x":-31.67,"y":233},{"x":-41.83,"y":234},{"x":12.5,"y":235},{"x":-4.67,"y":236},{"x":-18.67,"y":237},{"x":15.33,"y":238},{"x":13.67,"y":239},{"x":-0.17,"y":240},{"x":59.67,"y":241},{"x":15.67,"y":242},{"x":14,"y":243},{"x":16.5,"y":244},{"x":3.83,"y":245},{"x":26.33,"y":246},{"x":-19.83,"y":247},{"x":14.67,"y":248},{"x":16.33,"y":249},{"x":47.17,"y":250},{"x":28.67,"y":251},{"x":-27,"y":252},{"x":-32.17,"y":253},{"x":-45.17,"y":254},{"x":-19.67,"y":255},{"x":2.17,"y":256},{"x":-12.67,"y":257},{"x":-32.17,"y":258},{"x":-15.83,"y":259},{"x":7.33,"y":260},{"x":14,"y":261},{"x":-48.83,"y":262},{"x":0.67,"y":263},{"x":17,"y":264},{"x":40.17,"y":265},{"x":21.83,"y":266},{"x":7.17,"y":267},{"x":30.67,"y":268},{"x":4.33,"y":269},{"x":50.17,"y":270},{"x":6.83,"y":271},{"x":27,"y":272},{"x":-9.5,"y":273},{"x":-15.5,"y":274},{"x":-5.17,"y":275},{"x":-17.5,"y":276},{"x":-11.67,"y":277},{"x":8.83,"y":278},{"x":6.17,"y":279},{"x":-49.17,"y":280},{"x":-11.83,"y":281},{"x":-9.33,"y":282},{"x":23.5,"y":283},{"x":16.83,"y":284},{"x":29.17,"y":285},{"x":16.67,"y":286},{"x":44.33,"y":287},{"x":-11,"y":288},{"x":-22.17,"y":289},{"x":15.67,"y":290},{"x":-8,"y":291},{"x":-20.67,"y":292},{"x":25,"y":293},{"x":-1,"y":294},{"x":6.33,"y":295},{"x":28.17,"y":296},{"x":-31.5,"y":297},{"x":-8.33,"y":298},{"x":38.67,"y":299},{"x":-4.67,"y":300},{"x":43.33,"y":301},{"x":-41.33,"y":302},{"x":-45,"y":303},{"x":18.67,"y":304},{"x":21.33,"y":305},{"x":-18,"y":306},{"x":10.5,"y":307},{"x":-16.83,"y":308},{"x":-3.83,"y":309},{"x":2.83,"y":310},{"x":42.33,"y":311},{"x":11,"y":312},{"x":-40.83,"y":313},{"x":13.67,"y":314},{"x":-18.17,"y":315},{"x":-10.5,"y":316},{"x":4.83,"y":317},{"x":-5.67,"y":318},{"x":-17.17,"y":319},{"x":-42.83,"y":320},{"x":-43.5,"y":321},{"x":8.67,"y":322},{"x":-10.67,"y":323},{"x":-20.5,"y":324},{"x":19,"y":325},{"x":-10.17,"y":326},{"x":16,"y":327},{"x":-56.33,"y":328},{"x":15,"y":329},{"x":2.33,"y":330},{"x":-25.33,"y":331},{"x":7.5,"y":332},{"x":-34.83,"y":333},{"x":15.67,"y":334},{"x":18.83,"y":335},{"x":39.5,"y":336},{"x":0,"y":337},{"x":31,"y":338},{"x":63.33,"y":339},{"x":-61.5,"y":340},{"x":13.67,"y":341},{"x":-31.17,"y":342},{"x":-7.5,"y":343},{"x":12.33,"y":344},{"x":-1.17,"y":345},{"x":8.33,"y":346},{"x":-11.67,"y":347},{"x":11.17,"y":348},{"x":-8,"y":349},{"x":6.17,"y":350},{"x":-31.67,"y":351},{"x":50.17,"y":352},{"x":18.5,"y":353},{"x":-34,"y":354},{"x":15,"y":355},{"x":-27.5,"y":356},{"x":-20.83,"y":357},{"x":-22,"y":358},{"x":-26,"y":359},{"x":-43.83,"y":360},{"x":38.17,"y":361},{"x":6.17,"y":362},{"x":20.33,"y":363},{"x":44.33,"y":364},{"x":5.17,"y":365},{"x":57.67,"y":366},{"x":30,"y":367},{"x":25.33,"y":368},{"x":-26.33,"y":369},{"x":39.33,"y":370},{"x":6.5,"y":371},{"x":16.5,"y":372},{"x":-16.5,"y":373},{"x":16.33,"y":374},{"x":1.67,"y":375},{"x":3,"y":376},{"x":6.67,"y":377},{"x":-24,"y":378},{"x":-33.83,"y":379},{"x":-12.33,"y":380},{"x":15.83,"y":381},{"x":-14.17,"y":382},{"x":-24.5,"y":383},{"x":50.83,"y":384},{"x":47.17,"y":385},{"x":8.33,"y":386},{"x":24.83,"y":387},{"x":-19.67,"y":388},{"x":-21.17,"y":389},{"x":-23,"y":390},{"x":24.33,"y":391},{"x":5.17,"y":392},{"x":-11.33,"y":393},{"x":-4.67,"y":394},{"x":-0.17,"y":395},{"x":-26.67,"y":396},{"x":-22,"y":397},{"x":12.5,"y":398},{"x":-15.67,"y":399},{"x":2.17,"y":400},{"x":-46,"y":401},{"x":-18.83,"y":402},{"x":22,"y":403},{"x":-29.67,"y":404},{"x":22.17,"y":405},{"x":7,"y":406},{"x":10.17,"y":407},{"x":14.67,"y":408},{"x":-3,"y":409},{"x":-31.83,"y":410},{"x":-22.33,"y":411},{"x":1.83,"y":412},{"x":-10.83,"y":413},{"x":16.17,"y":414},{"x":23.67,"y":415},{"x":19.5,"y":416},{"x":-22,"y":417},{"x":-30.67,"y":418},{"x":5.17,"y":419},{"x":19,"y":420},{"x":41.17,"y":421},{"x":-56,"y":422},{"x":-30,"y":423},{"x":-32.5,"y":424},{"x":9.67,"y":425},{"x":-9,"y":426},{"x":-22.67,"y":427},{"x":-29.33,"y":428},{"x":-57.83,"y":429},{"x":12.33,"y":430},{"x":39.5,"y":431},{"x":28.67,"y":432},{"x":-42,"y":433},{"x":-3.83,"y":434},{"x":-19,"y":435},{"x":12.83,"y":436},{"x":-7.83,"y":437},{"x":30.5,"y":438},{"x":-0.33,"y":439},{"x":18.67,"y":440},{"x":16.83,"y":441},{"x":-43.17,"y":442},{"x":8.33,"y":443},{"x":5,"y":444},{"x":-8.83,"y":445},{"x":2.67,"y":446},{"x":3.17,"y":447},{"x":8.83,"y":448},{"x":-17.67,"y":449},{"x":27.5,"y":450},{"x":-34.67,"y":451},{"x":30.33,"y":452},{"x":41.17,"y":453},{"x":-36.17,"y":454},{"x":60.83,"y":455},{"x":-15.17,"y":456},{"x":-32.5,"y":457},{"x":-4.67,"y":458},{"x":40,"y":459},{"x":-4.83,"y":460},{"x":25,"y":461},{"x":10.83,"y":462},{"x":9,"y":463},{"x":-70,"y":464},{"x":-22,"y":465},{"x":-31.67,"y":466},{"x":14.33,"y":467},{"x":-24.5,"y":468},{"x":-2,"y":469},{"x":-2.67,"y":470},{"x":39.67,"y":471},{"x":10.33,"y":472},{"x":-45.5,"y":473},{"x":26.33,"y":474},{"x":-1.33,"y":475},{"x":15,"y":476},{"x":28.5,"y":477},{"x":-13.17,"y":478},{"x":22.67,"y":479},{"x":16.5,"y":480},{"x":-14.83,"y":481},{"x":30.83,"y":482},{"x":33.17,"y":483},{"x":5,"y":484},{"x":29.5,"y":485},{"x":-45,"y":486},{"x":-14.33,"y":487},{"x":34.17,"y":488},{"x":-11,"y":489},{"x":-39.67,"y":490},{"x":16.67,"y":491},{"x":10,"y":492},{"x":-26.17,"y":493},{"x":57.67,"y":494},{"x":31.5,"y":495},{"x":-43.33,"y":496},{"x":-6.67,"y":497},{"x":-46,"y":498},{"x":7.5,"y":499},{"x":-24.67,"y":500}],"geoms":["point","histogram"],"x":"cart_value_gap","y":"draw_number"}

On "point", each of those 500 splits is one dot, scattered up and down the whole range with no pattern to it, since the order they happened to run in means nothing. Switch to "histogram" and the same 500 numbers pile up into a shape: a tall stack near zero, thinning out fast on both sides, with a handful of splits sticking out past 40 or 50 in either direction. 44.3% of all 2,000 splits left the two groups more than $20 apart in average cart value, purely from the coin flips, even though every shopper had exactly the same chance of landing in either group.

=== step === quiz
## Quick check: does randomization guarantee a balanced split?

The histogram above came from 2,000 honest, independent random splits of the same 24 fixed cart values.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- A large enough random sample always balances cart value almost exactly, so a gap like this is nothing to worry about. ::no
- Randomization balances cart value, device, and every other nuisance variable only on average, across many hypothetical repeats of the same assignment procedure. Any one real assignment, including this one, can still land far from that average. ::ok Right. "In expectation" describes the procedure averaged over many repeats, not a promise about the single split a real study actually runs with.
- This histogram proves randomization cannot be trusted, so every nuisance variable has to be fixed by blocking instead. ::no The histogram does not discredit randomization, it shows what "balanced on average" actually looks like once you run the coin flip many times: centered near zero, but spread wide enough that any one real split can still land far off center, without giving up on randomization itself.

=== step === concept
## What an unlucky split costs the number you actually want

An unbalanced split is not just a cosmetic problem with cart value. It changes the number a researcher actually wants: the estimated effect of the new checkout button.

Pull two specific splits out of those 2,000: the one that happened to balance cart value almost perfectly, and the one that happened to land furthest off balance.

```r
# These two assignments are the most balanced and the least balanced of 2,000 random
# splits of the same 24 shoppers; 1 marks the new checkout, 0 marks the old one
assign_small_gap <- c(0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0)
assign_large_gap <- c(0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0)

round(mean(cart_value[assign_small_gap == 1]) - mean(cart_value[assign_small_gap == 0]), 2)
#> [1] 0
round(mean(cart_value[assign_large_gap == 1]) - mean(cart_value[assign_large_gap == 0]), 2)
#> [1] 81.17

spend_small_gap <- spend_base + 15 * assign_small_gap
spend_large_gap <- spend_base + 15 * assign_large_gap

naive_small_gap <- mean(spend_small_gap[assign_small_gap == 1]) - mean(spend_small_gap[assign_small_gap == 0])
naive_large_gap <- mean(spend_large_gap[assign_large_gap == 1]) - mean(spend_large_gap[assign_large_gap == 0])
round(c(naive_small_gap = naive_small_gap, naive_large_gap = naive_large_gap, true_effect = 15), 2)
#> naive_small_gap naive_large_gap     true_effect 
#>           11.39           64.40           15.00 
```

The naive estimate here is the plainest one there is: the average spend of whoever landed in treatment, minus the average spend of whoever landed in control. Under the perfectly balanced split, that estimate comes out to 11.39, off from the true $15 effect by $3.61, which is just the ordinary noise in `spend_base` showing through.

Under the lopsided split, the same naive estimate comes out to 64.40, missing the true effect by $49.40, more than four times the real $15. That miss is not random noise. The lopsided split put $81.17 more cart value, on average, into its treatment group than its control group, and since spend rises $0.55 for every extra dollar of cart value, 0.55 times $81.17 is about $44.64 of pure imbalance, baked directly into the estimate before the new checkout button gets any credit at all.

=== step === concept
## Blocking: pairing shoppers before you flip any coin

The lopsided split in the last step happened entirely by chance, through nobody's fault. Blocking removes the chance from a nuisance variable you already know about, by deciding the pairs before any coin is flipped at all.

Here is how it works for cart value. Sort the 24 shoppers by cart value, then pair up adjacent shoppers into 12 blocks of 2, so each block holds two shoppers who already sit close together on the one variable that matters.

```r
# Sort the 24 shoppers by cart value and pair them into 12 blocks of 2
block_order <- order(cart_value)
sorted_cart_value <- cart_value[block_order]
block_id <- rep(1:12, each = 2)

# Flip one coin per block: within each pair, one shopper gets the new checkout
set.seed(3)
block_assignment <- unlist(lapply(1:12, function(b) sample(c(1, 0))))
blocks <- data.frame(block = block_id, shopper = block_order, cart_value = sorted_cart_value,
                      assignment = ifelse(block_assignment == 1, "treatment", "control"))
blocks
#>    block shopper cart_value assignment
#> 1      1      21         18  treatment
#> 2      1       8         27    control
#> 3      2       2         39    control
#> 4      2      13         40  treatment
#> 5      3      24         41    control
#> 6      3      17         43  treatment
#> 7      4      18         75    control
#> 8      4       1         76  treatment
#> 9      5      15         80  treatment
#> 10     5      23         98    control
#> 11     6      11        104    control
#> 12     6       3        106  treatment
#> 13     7      19        117  treatment
#> 14     7      22        149    control
#> 15     8       9        152    control
#> 16     8       5        153  treatment
#> 17     9       6        153    control
#> 18     9       7        179  treatment
#> 19    10      14        180    control
#> 20    10      10        184  treatment
#> 21    11      12        186    control
#> 22    11      20        191  treatment
#> 23    12      16        201  treatment
#> 24    12       4        210    control
```

Most of these 12 pairs sit very close together: block 1 pairs $18 with $27, block 4 pairs $75 with $76. The average gap across all 12 pairs is $9.17. The widest is block 7, at $32, because no shopper closer to $117 or $149 existed anywhere else in this data; pairing can only work with the cart values that actually showed up.

Inside each block, the coin flip still randomizes, exactly like before, just confined to one pair at a time instead of all 24 shoppers at once. So every block always contributes one treatment shopper and one control shopper of nearly the same cart value, by construction, instead of leaving it up to a single 24-way coin flip to get lucky.

=== step === widget
## Blocking against the same two thousand splits

Run the same block-and-flip procedure 2,000 times and record each run's gap in average cart value between the resulting treatment and control groups.

```r
# Repeat the block coin flip 2,000 times and record each time's gap in average
# cart value between the resulting treatment and control groups
set.seed(2)
resplit_gaps_blocked <- replicate(2000, {
  flips <- unlist(lapply(1:12, function(b) sample(c(1, 0))))
  mean(sorted_cart_value[flips == 1]) - mean(sorted_cart_value[flips == 0])
})

round(c(var_unblocked = var(resplit_gaps_unblocked), var_blocked = var(resplit_gaps_blocked)), 1)
#> var_unblocked   var_blocked 
#>         651.6          15.2 
round(var(resplit_gaps_unblocked) / var(resplit_gaps_blocked), 1)
#> [1] 43
round(c(sd_unblocked = sd(resplit_gaps_unblocked), sd_blocked = sd(resplit_gaps_blocked)), 2)
#> sd_unblocked   sd_blocked 
#>        25.53         3.89 
```

The variance of the unblocked gap is 651.6. The variance of the blocked gap, from the exact same 24 shoppers, is only 15.2, about 43 times smaller. On the more familiar dollar scale, the typical gap shrank from a standard deviation of $25.53 down to $3.89.

Here are 500 draws from each design, side by side.

::widget facet-grid {"data":[{"x":6.17,"y":1,"facet":"Unblocked"},{"x":21.67,"y":2,"facet":"Unblocked"},{"x":-40.5,"y":3,"facet":"Unblocked"},{"x":45.33,"y":4,"facet":"Unblocked"},{"x":9.83,"y":5,"facet":"Unblocked"},{"x":18,"y":6,"facet":"Unblocked"},{"x":-21,"y":7,"facet":"Unblocked"},{"x":62.33,"y":8,"facet":"Unblocked"},{"x":8,"y":9,"facet":"Unblocked"},{"x":-3.33,"y":10,"facet":"Unblocked"},{"x":-20.33,"y":11,"facet":"Unblocked"},{"x":-3.17,"y":12,"facet":"Unblocked"},{"x":14.33,"y":13,"facet":"Unblocked"},{"x":16.5,"y":14,"facet":"Unblocked"},{"x":-13.67,"y":15,"facet":"Unblocked"},{"x":-21.17,"y":16,"facet":"Unblocked"},{"x":16.67,"y":17,"facet":"Unblocked"},{"x":47.67,"y":18,"facet":"Unblocked"},{"x":-13.83,"y":19,"facet":"Unblocked"},{"x":34.5,"y":20,"facet":"Unblocked"},{"x":-5.83,"y":21,"facet":"Unblocked"},{"x":-30.33,"y":22,"facet":"Unblocked"},{"x":-2.67,"y":23,"facet":"Unblocked"},{"x":6.83,"y":24,"facet":"Unblocked"},{"x":20.83,"y":25,"facet":"Unblocked"},{"x":-0.33,"y":26,"facet":"Unblocked"},{"x":44,"y":27,"facet":"Unblocked"},{"x":9.5,"y":28,"facet":"Unblocked"},{"x":46.17,"y":29,"facet":"Unblocked"},{"x":-59.5,"y":30,"facet":"Unblocked"},{"x":-48.33,"y":31,"facet":"Unblocked"},{"x":-41.83,"y":32,"facet":"Unblocked"},{"x":22,"y":33,"facet":"Unblocked"},{"x":10,"y":34,"facet":"Unblocked"},{"x":1.83,"y":35,"facet":"Unblocked"},{"x":-14.5,"y":36,"facet":"Unblocked"},{"x":39,"y":37,"facet":"Unblocked"},{"x":-5.33,"y":38,"facet":"Unblocked"},{"x":27.67,"y":39,"facet":"Unblocked"},{"x":7.17,"y":40,"facet":"Unblocked"},{"x":10.17,"y":41,"facet":"Unblocked"},{"x":-6.67,"y":42,"facet":"Unblocked"},{"x":7.33,"y":43,"facet":"Unblocked"},{"x":1.17,"y":44,"facet":"Unblocked"},{"x":18.33,"y":45,"facet":"Unblocked"},{"x":-34.5,"y":46,"facet":"Unblocked"},{"x":-17.33,"y":47,"facet":"Unblocked"},{"x":8.67,"y":48,"facet":"Unblocked"},{"x":71.33,"y":49,"facet":"Unblocked"},{"x":-35.83,"y":50,"facet":"Unblocked"},{"x":-43.83,"y":51,"facet":"Unblocked"},{"x":-46.17,"y":52,"facet":"Unblocked"},{"x":-23.67,"y":53,"facet":"Unblocked"},{"x":30.83,"y":54,"facet":"Unblocked"},{"x":6.17,"y":55,"facet":"Unblocked"},{"x":25.83,"y":56,"facet":"Unblocked"},{"x":15.33,"y":57,"facet":"Unblocked"},{"x":-21.83,"y":58,"facet":"Unblocked"},{"x":-17.67,"y":59,"facet":"Unblocked"},{"x":17.83,"y":60,"facet":"Unblocked"},{"x":-26.17,"y":61,"facet":"Unblocked"},{"x":-14.33,"y":62,"facet":"Unblocked"},{"x":25.83,"y":63,"facet":"Unblocked"},{"x":0.67,"y":64,"facet":"Unblocked"},{"x":17.5,"y":65,"facet":"Unblocked"},{"x":-18,"y":66,"facet":"Unblocked"},{"x":-39.17,"y":67,"facet":"Unblocked"},{"x":43.67,"y":68,"facet":"Unblocked"},{"x":20.83,"y":69,"facet":"Unblocked"},{"x":32.83,"y":70,"facet":"Unblocked"},{"x":-30.33,"y":71,"facet":"Unblocked"},{"x":23.17,"y":72,"facet":"Unblocked"},{"x":11.83,"y":73,"facet":"Unblocked"},{"x":0.17,"y":74,"facet":"Unblocked"},{"x":37.17,"y":75,"facet":"Unblocked"},{"x":15.33,"y":76,"facet":"Unblocked"},{"x":5.17,"y":77,"facet":"Unblocked"},{"x":-43.5,"y":78,"facet":"Unblocked"},{"x":-7.83,"y":79,"facet":"Unblocked"},{"x":-34,"y":80,"facet":"Unblocked"},{"x":-19.5,"y":81,"facet":"Unblocked"},{"x":1.5,"y":82,"facet":"Unblocked"},{"x":-46.17,"y":83,"facet":"Unblocked"},{"x":41.67,"y":84,"facet":"Unblocked"},{"x":-6.17,"y":85,"facet":"Unblocked"},{"x":33.17,"y":86,"facet":"Unblocked"},{"x":-17.33,"y":87,"facet":"Unblocked"},{"x":-0.5,"y":88,"facet":"Unblocked"},{"x":8,"y":89,"facet":"Unblocked"},{"x":19.5,"y":90,"facet":"Unblocked"},{"x":-18.5,"y":91,"facet":"Unblocked"},{"x":33.33,"y":92,"facet":"Unblocked"},{"x":-50.17,"y":93,"facet":"Unblocked"},{"x":-3,"y":94,"facet":"Unblocked"},{"x":0.17,"y":95,"facet":"Unblocked"},{"x":-23.33,"y":96,"facet":"Unblocked"},{"x":25.5,"y":97,"facet":"Unblocked"},{"x":35.67,"y":98,"facet":"Unblocked"},{"x":14.17,"y":99,"facet":"Unblocked"},{"x":13.67,"y":100,"facet":"Unblocked"},{"x":-15.5,"y":101,"facet":"Unblocked"},{"x":32.17,"y":102,"facet":"Unblocked"},{"x":-22.5,"y":103,"facet":"Unblocked"},{"x":-14.67,"y":104,"facet":"Unblocked"},{"x":16.83,"y":105,"facet":"Unblocked"},{"x":-23.33,"y":106,"facet":"Unblocked"},{"x":-30.5,"y":107,"facet":"Unblocked"},{"x":25.83,"y":108,"facet":"Unblocked"},{"x":-18.83,"y":109,"facet":"Unblocked"},{"x":-64.5,"y":110,"facet":"Unblocked"},{"x":-13.67,"y":111,"facet":"Unblocked"},{"x":16.33,"y":112,"facet":"Unblocked"},{"x":31.33,"y":113,"facet":"Unblocked"},{"x":19.33,"y":114,"facet":"Unblocked"},{"x":5.5,"y":115,"facet":"Unblocked"},{"x":0.5,"y":116,"facet":"Unblocked"},{"x":-55,"y":117,"facet":"Unblocked"},{"x":11.67,"y":118,"facet":"Unblocked"},{"x":-7.33,"y":119,"facet":"Unblocked"},{"x":17,"y":120,"facet":"Unblocked"},{"x":-43,"y":121,"facet":"Unblocked"},{"x":-56.5,"y":122,"facet":"Unblocked"},{"x":-15.83,"y":123,"facet":"Unblocked"},{"x":22.17,"y":124,"facet":"Unblocked"},{"x":-1,"y":125,"facet":"Unblocked"},{"x":5.33,"y":126,"facet":"Unblocked"},{"x":-41.17,"y":127,"facet":"Unblocked"},{"x":-3.83,"y":128,"facet":"Unblocked"},{"x":36,"y":129,"facet":"Unblocked"},{"x":-33.67,"y":130,"facet":"Unblocked"},{"x":24,"y":131,"facet":"Unblocked"},{"x":-12.33,"y":132,"facet":"Unblocked"},{"x":37.17,"y":133,"facet":"Unblocked"},{"x":9.83,"y":134,"facet":"Unblocked"},{"x":9.83,"y":135,"facet":"Unblocked"},{"x":-15.33,"y":136,"facet":"Unblocked"},{"x":3.67,"y":137,"facet":"Unblocked"},{"x":12.33,"y":138,"facet":"Unblocked"},{"x":5.5,"y":139,"facet":"Unblocked"},{"x":0.83,"y":140,"facet":"Unblocked"},{"x":-13.67,"y":141,"facet":"Unblocked"},{"x":15.83,"y":142,"facet":"Unblocked"},{"x":28.83,"y":143,"facet":"Unblocked"},{"x":-12.17,"y":144,"facet":"Unblocked"},{"x":5.5,"y":145,"facet":"Unblocked"},{"x":10.33,"y":146,"facet":"Unblocked"},{"x":24.67,"y":147,"facet":"Unblocked"},{"x":28.33,"y":148,"facet":"Unblocked"},{"x":6,"y":149,"facet":"Unblocked"},{"x":-24.17,"y":150,"facet":"Unblocked"},{"x":7,"y":151,"facet":"Unblocked"},{"x":10.67,"y":152,"facet":"Unblocked"},{"x":21.17,"y":153,"facet":"Unblocked"},{"x":4.67,"y":154,"facet":"Unblocked"},{"x":5.5,"y":155,"facet":"Unblocked"},{"x":-11.5,"y":156,"facet":"Unblocked"},{"x":-9.83,"y":157,"facet":"Unblocked"},{"x":1,"y":158,"facet":"Unblocked"},{"x":-19.33,"y":159,"facet":"Unblocked"},{"x":-16.17,"y":160,"facet":"Unblocked"},{"x":12.83,"y":161,"facet":"Unblocked"},{"x":26.67,"y":162,"facet":"Unblocked"},{"x":-12.5,"y":163,"facet":"Unblocked"},{"x":15.5,"y":164,"facet":"Unblocked"},{"x":27.17,"y":165,"facet":"Unblocked"},{"x":-19,"y":166,"facet":"Unblocked"},{"x":-1.33,"y":167,"facet":"Unblocked"},{"x":9,"y":168,"facet":"Unblocked"},{"x":26,"y":169,"facet":"Unblocked"},{"x":-22.33,"y":170,"facet":"Unblocked"},{"x":-21.33,"y":171,"facet":"Unblocked"},{"x":15.83,"y":172,"facet":"Unblocked"},{"x":-19.83,"y":173,"facet":"Unblocked"},{"x":36.17,"y":174,"facet":"Unblocked"},{"x":-1.5,"y":175,"facet":"Unblocked"},{"x":15.67,"y":176,"facet":"Unblocked"},{"x":41.17,"y":177,"facet":"Unblocked"},{"x":27.17,"y":178,"facet":"Unblocked"},{"x":-5.5,"y":179,"facet":"Unblocked"},{"x":-26.33,"y":180,"facet":"Unblocked"},{"x":-29.5,"y":181,"facet":"Unblocked"},{"x":-27.33,"y":182,"facet":"Unblocked"},{"x":-37.67,"y":183,"facet":"Unblocked"},{"x":38,"y":184,"facet":"Unblocked"},{"x":-10.83,"y":185,"facet":"Unblocked"},{"x":14.83,"y":186,"facet":"Unblocked"},{"x":-12.33,"y":187,"facet":"Unblocked"},{"x":-5.17,"y":188,"facet":"Unblocked"},{"x":27.33,"y":189,"facet":"Unblocked"},{"x":-9.67,"y":190,"facet":"Unblocked"},{"x":-61.5,"y":191,"facet":"Unblocked"},{"x":21.17,"y":192,"facet":"Unblocked"},{"x":-21.33,"y":193,"facet":"Unblocked"},{"x":-66.33,"y":194,"facet":"Unblocked"},{"x":-16.67,"y":195,"facet":"Unblocked"},{"x":11.67,"y":196,"facet":"Unblocked"},{"x":53.33,"y":197,"facet":"Unblocked"},{"x":18.5,"y":198,"facet":"Unblocked"},{"x":-37.67,"y":199,"facet":"Unblocked"},{"x":21.33,"y":200,"facet":"Unblocked"},{"x":-16.5,"y":201,"facet":"Unblocked"},{"x":-23,"y":202,"facet":"Unblocked"},{"x":-6.33,"y":203,"facet":"Unblocked"},{"x":-12.67,"y":204,"facet":"Unblocked"},{"x":-17,"y":205,"facet":"Unblocked"},{"x":-20.17,"y":206,"facet":"Unblocked"},{"x":-47.5,"y":207,"facet":"Unblocked"},{"x":-22.67,"y":208,"facet":"Unblocked"},{"x":-12,"y":209,"facet":"Unblocked"},{"x":11.17,"y":210,"facet":"Unblocked"},{"x":-44,"y":211,"facet":"Unblocked"},{"x":-16.5,"y":212,"facet":"Unblocked"},{"x":7.67,"y":213,"facet":"Unblocked"},{"x":-13,"y":214,"facet":"Unblocked"},{"x":-6.67,"y":215,"facet":"Unblocked"},{"x":-10.33,"y":216,"facet":"Unblocked"},{"x":-5.5,"y":217,"facet":"Unblocked"},{"x":-25,"y":218,"facet":"Unblocked"},{"x":-43.33,"y":219,"facet":"Unblocked"},{"x":20,"y":220,"facet":"Unblocked"},{"x":-58,"y":221,"facet":"Unblocked"},{"x":6,"y":222,"facet":"Unblocked"},{"x":26.83,"y":223,"facet":"Unblocked"},{"x":24.67,"y":224,"facet":"Unblocked"},{"x":-20.33,"y":225,"facet":"Unblocked"},{"x":0.67,"y":226,"facet":"Unblocked"},{"x":-6.83,"y":227,"facet":"Unblocked"},{"x":18.5,"y":228,"facet":"Unblocked"},{"x":19.83,"y":229,"facet":"Unblocked"},{"x":-13.5,"y":230,"facet":"Unblocked"},{"x":31.83,"y":231,"facet":"Unblocked"},{"x":10.83,"y":232,"facet":"Unblocked"},{"x":-31.67,"y":233,"facet":"Unblocked"},{"x":-41.83,"y":234,"facet":"Unblocked"},{"x":12.5,"y":235,"facet":"Unblocked"},{"x":-4.67,"y":236,"facet":"Unblocked"},{"x":-18.67,"y":237,"facet":"Unblocked"},{"x":15.33,"y":238,"facet":"Unblocked"},{"x":13.67,"y":239,"facet":"Unblocked"},{"x":-0.17,"y":240,"facet":"Unblocked"},{"x":59.67,"y":241,"facet":"Unblocked"},{"x":15.67,"y":242,"facet":"Unblocked"},{"x":14,"y":243,"facet":"Unblocked"},{"x":16.5,"y":244,"facet":"Unblocked"},{"x":3.83,"y":245,"facet":"Unblocked"},{"x":26.33,"y":246,"facet":"Unblocked"},{"x":-19.83,"y":247,"facet":"Unblocked"},{"x":14.67,"y":248,"facet":"Unblocked"},{"x":16.33,"y":249,"facet":"Unblocked"},{"x":47.17,"y":250,"facet":"Unblocked"},{"x":28.67,"y":251,"facet":"Unblocked"},{"x":-27,"y":252,"facet":"Unblocked"},{"x":-32.17,"y":253,"facet":"Unblocked"},{"x":-45.17,"y":254,"facet":"Unblocked"},{"x":-19.67,"y":255,"facet":"Unblocked"},{"x":2.17,"y":256,"facet":"Unblocked"},{"x":-12.67,"y":257,"facet":"Unblocked"},{"x":-32.17,"y":258,"facet":"Unblocked"},{"x":-15.83,"y":259,"facet":"Unblocked"},{"x":7.33,"y":260,"facet":"Unblocked"},{"x":14,"y":261,"facet":"Unblocked"},{"x":-48.83,"y":262,"facet":"Unblocked"},{"x":0.67,"y":263,"facet":"Unblocked"},{"x":17,"y":264,"facet":"Unblocked"},{"x":40.17,"y":265,"facet":"Unblocked"},{"x":21.83,"y":266,"facet":"Unblocked"},{"x":7.17,"y":267,"facet":"Unblocked"},{"x":30.67,"y":268,"facet":"Unblocked"},{"x":4.33,"y":269,"facet":"Unblocked"},{"x":50.17,"y":270,"facet":"Unblocked"},{"x":6.83,"y":271,"facet":"Unblocked"},{"x":27,"y":272,"facet":"Unblocked"},{"x":-9.5,"y":273,"facet":"Unblocked"},{"x":-15.5,"y":274,"facet":"Unblocked"},{"x":-5.17,"y":275,"facet":"Unblocked"},{"x":-17.5,"y":276,"facet":"Unblocked"},{"x":-11.67,"y":277,"facet":"Unblocked"},{"x":8.83,"y":278,"facet":"Unblocked"},{"x":6.17,"y":279,"facet":"Unblocked"},{"x":-49.17,"y":280,"facet":"Unblocked"},{"x":-11.83,"y":281,"facet":"Unblocked"},{"x":-9.33,"y":282,"facet":"Unblocked"},{"x":23.5,"y":283,"facet":"Unblocked"},{"x":16.83,"y":284,"facet":"Unblocked"},{"x":29.17,"y":285,"facet":"Unblocked"},{"x":16.67,"y":286,"facet":"Unblocked"},{"x":44.33,"y":287,"facet":"Unblocked"},{"x":-11,"y":288,"facet":"Unblocked"},{"x":-22.17,"y":289,"facet":"Unblocked"},{"x":15.67,"y":290,"facet":"Unblocked"},{"x":-8,"y":291,"facet":"Unblocked"},{"x":-20.67,"y":292,"facet":"Unblocked"},{"x":25,"y":293,"facet":"Unblocked"},{"x":-1,"y":294,"facet":"Unblocked"},{"x":6.33,"y":295,"facet":"Unblocked"},{"x":28.17,"y":296,"facet":"Unblocked"},{"x":-31.5,"y":297,"facet":"Unblocked"},{"x":-8.33,"y":298,"facet":"Unblocked"},{"x":38.67,"y":299,"facet":"Unblocked"},{"x":-4.67,"y":300,"facet":"Unblocked"},{"x":43.33,"y":301,"facet":"Unblocked"},{"x":-41.33,"y":302,"facet":"Unblocked"},{"x":-45,"y":303,"facet":"Unblocked"},{"x":18.67,"y":304,"facet":"Unblocked"},{"x":21.33,"y":305,"facet":"Unblocked"},{"x":-18,"y":306,"facet":"Unblocked"},{"x":10.5,"y":307,"facet":"Unblocked"},{"x":-16.83,"y":308,"facet":"Unblocked"},{"x":-3.83,"y":309,"facet":"Unblocked"},{"x":2.83,"y":310,"facet":"Unblocked"},{"x":42.33,"y":311,"facet":"Unblocked"},{"x":11,"y":312,"facet":"Unblocked"},{"x":-40.83,"y":313,"facet":"Unblocked"},{"x":13.67,"y":314,"facet":"Unblocked"},{"x":-18.17,"y":315,"facet":"Unblocked"},{"x":-10.5,"y":316,"facet":"Unblocked"},{"x":4.83,"y":317,"facet":"Unblocked"},{"x":-5.67,"y":318,"facet":"Unblocked"},{"x":-17.17,"y":319,"facet":"Unblocked"},{"x":-42.83,"y":320,"facet":"Unblocked"},{"x":-43.5,"y":321,"facet":"Unblocked"},{"x":8.67,"y":322,"facet":"Unblocked"},{"x":-10.67,"y":323,"facet":"Unblocked"},{"x":-20.5,"y":324,"facet":"Unblocked"},{"x":19,"y":325,"facet":"Unblocked"},{"x":-10.17,"y":326,"facet":"Unblocked"},{"x":16,"y":327,"facet":"Unblocked"},{"x":-56.33,"y":328,"facet":"Unblocked"},{"x":15,"y":329,"facet":"Unblocked"},{"x":2.33,"y":330,"facet":"Unblocked"},{"x":-25.33,"y":331,"facet":"Unblocked"},{"x":7.5,"y":332,"facet":"Unblocked"},{"x":-34.83,"y":333,"facet":"Unblocked"},{"x":15.67,"y":334,"facet":"Unblocked"},{"x":18.83,"y":335,"facet":"Unblocked"},{"x":39.5,"y":336,"facet":"Unblocked"},{"x":0,"y":337,"facet":"Unblocked"},{"x":31,"y":338,"facet":"Unblocked"},{"x":63.33,"y":339,"facet":"Unblocked"},{"x":-61.5,"y":340,"facet":"Unblocked"},{"x":13.67,"y":341,"facet":"Unblocked"},{"x":-31.17,"y":342,"facet":"Unblocked"},{"x":-7.5,"y":343,"facet":"Unblocked"},{"x":12.33,"y":344,"facet":"Unblocked"},{"x":-1.17,"y":345,"facet":"Unblocked"},{"x":8.33,"y":346,"facet":"Unblocked"},{"x":-11.67,"y":347,"facet":"Unblocked"},{"x":11.17,"y":348,"facet":"Unblocked"},{"x":-8,"y":349,"facet":"Unblocked"},{"x":6.17,"y":350,"facet":"Unblocked"},{"x":-31.67,"y":351,"facet":"Unblocked"},{"x":50.17,"y":352,"facet":"Unblocked"},{"x":18.5,"y":353,"facet":"Unblocked"},{"x":-34,"y":354,"facet":"Unblocked"},{"x":15,"y":355,"facet":"Unblocked"},{"x":-27.5,"y":356,"facet":"Unblocked"},{"x":-20.83,"y":357,"facet":"Unblocked"},{"x":-22,"y":358,"facet":"Unblocked"},{"x":-26,"y":359,"facet":"Unblocked"},{"x":-43.83,"y":360,"facet":"Unblocked"},{"x":38.17,"y":361,"facet":"Unblocked"},{"x":6.17,"y":362,"facet":"Unblocked"},{"x":20.33,"y":363,"facet":"Unblocked"},{"x":44.33,"y":364,"facet":"Unblocked"},{"x":5.17,"y":365,"facet":"Unblocked"},{"x":57.67,"y":366,"facet":"Unblocked"},{"x":30,"y":367,"facet":"Unblocked"},{"x":25.33,"y":368,"facet":"Unblocked"},{"x":-26.33,"y":369,"facet":"Unblocked"},{"x":39.33,"y":370,"facet":"Unblocked"},{"x":6.5,"y":371,"facet":"Unblocked"},{"x":16.5,"y":372,"facet":"Unblocked"},{"x":-16.5,"y":373,"facet":"Unblocked"},{"x":16.33,"y":374,"facet":"Unblocked"},{"x":1.67,"y":375,"facet":"Unblocked"},{"x":3,"y":376,"facet":"Unblocked"},{"x":6.67,"y":377,"facet":"Unblocked"},{"x":-24,"y":378,"facet":"Unblocked"},{"x":-33.83,"y":379,"facet":"Unblocked"},{"x":-12.33,"y":380,"facet":"Unblocked"},{"x":15.83,"y":381,"facet":"Unblocked"},{"x":-14.17,"y":382,"facet":"Unblocked"},{"x":-24.5,"y":383,"facet":"Unblocked"},{"x":50.83,"y":384,"facet":"Unblocked"},{"x":47.17,"y":385,"facet":"Unblocked"},{"x":8.33,"y":386,"facet":"Unblocked"},{"x":24.83,"y":387,"facet":"Unblocked"},{"x":-19.67,"y":388,"facet":"Unblocked"},{"x":-21.17,"y":389,"facet":"Unblocked"},{"x":-23,"y":390,"facet":"Unblocked"},{"x":24.33,"y":391,"facet":"Unblocked"},{"x":5.17,"y":392,"facet":"Unblocked"},{"x":-11.33,"y":393,"facet":"Unblocked"},{"x":-4.67,"y":394,"facet":"Unblocked"},{"x":-0.17,"y":395,"facet":"Unblocked"},{"x":-26.67,"y":396,"facet":"Unblocked"},{"x":-22,"y":397,"facet":"Unblocked"},{"x":12.5,"y":398,"facet":"Unblocked"},{"x":-15.67,"y":399,"facet":"Unblocked"},{"x":2.17,"y":400,"facet":"Unblocked"},{"x":-46,"y":401,"facet":"Unblocked"},{"x":-18.83,"y":402,"facet":"Unblocked"},{"x":22,"y":403,"facet":"Unblocked"},{"x":-29.67,"y":404,"facet":"Unblocked"},{"x":22.17,"y":405,"facet":"Unblocked"},{"x":7,"y":406,"facet":"Unblocked"},{"x":10.17,"y":407,"facet":"Unblocked"},{"x":14.67,"y":408,"facet":"Unblocked"},{"x":-3,"y":409,"facet":"Unblocked"},{"x":-31.83,"y":410,"facet":"Unblocked"},{"x":-22.33,"y":411,"facet":"Unblocked"},{"x":1.83,"y":412,"facet":"Unblocked"},{"x":-10.83,"y":413,"facet":"Unblocked"},{"x":16.17,"y":414,"facet":"Unblocked"},{"x":23.67,"y":415,"facet":"Unblocked"},{"x":19.5,"y":416,"facet":"Unblocked"},{"x":-22,"y":417,"facet":"Unblocked"},{"x":-30.67,"y":418,"facet":"Unblocked"},{"x":5.17,"y":419,"facet":"Unblocked"},{"x":19,"y":420,"facet":"Unblocked"},{"x":41.17,"y":421,"facet":"Unblocked"},{"x":-56,"y":422,"facet":"Unblocked"},{"x":-30,"y":423,"facet":"Unblocked"},{"x":-32.5,"y":424,"facet":"Unblocked"},{"x":9.67,"y":425,"facet":"Unblocked"},{"x":-9,"y":426,"facet":"Unblocked"},{"x":-22.67,"y":427,"facet":"Unblocked"},{"x":-29.33,"y":428,"facet":"Unblocked"},{"x":-57.83,"y":429,"facet":"Unblocked"},{"x":12.33,"y":430,"facet":"Unblocked"},{"x":39.5,"y":431,"facet":"Unblocked"},{"x":28.67,"y":432,"facet":"Unblocked"},{"x":-42,"y":433,"facet":"Unblocked"},{"x":-3.83,"y":434,"facet":"Unblocked"},{"x":-19,"y":435,"facet":"Unblocked"},{"x":12.83,"y":436,"facet":"Unblocked"},{"x":-7.83,"y":437,"facet":"Unblocked"},{"x":30.5,"y":438,"facet":"Unblocked"},{"x":-0.33,"y":439,"facet":"Unblocked"},{"x":18.67,"y":440,"facet":"Unblocked"},{"x":16.83,"y":441,"facet":"Unblocked"},{"x":-43.17,"y":442,"facet":"Unblocked"},{"x":8.33,"y":443,"facet":"Unblocked"},{"x":5,"y":444,"facet":"Unblocked"},{"x":-8.83,"y":445,"facet":"Unblocked"},{"x":2.67,"y":446,"facet":"Unblocked"},{"x":3.17,"y":447,"facet":"Unblocked"},{"x":8.83,"y":448,"facet":"Unblocked"},{"x":-17.67,"y":449,"facet":"Unblocked"},{"x":27.5,"y":450,"facet":"Unblocked"},{"x":-34.67,"y":451,"facet":"Unblocked"},{"x":30.33,"y":452,"facet":"Unblocked"},{"x":41.17,"y":453,"facet":"Unblocked"},{"x":-36.17,"y":454,"facet":"Unblocked"},{"x":60.83,"y":455,"facet":"Unblocked"},{"x":-15.17,"y":456,"facet":"Unblocked"},{"x":-32.5,"y":457,"facet":"Unblocked"},{"x":-4.67,"y":458,"facet":"Unblocked"},{"x":40,"y":459,"facet":"Unblocked"},{"x":-4.83,"y":460,"facet":"Unblocked"},{"x":25,"y":461,"facet":"Unblocked"},{"x":10.83,"y":462,"facet":"Unblocked"},{"x":9,"y":463,"facet":"Unblocked"},{"x":-70,"y":464,"facet":"Unblocked"},{"x":-22,"y":465,"facet":"Unblocked"},{"x":-31.67,"y":466,"facet":"Unblocked"},{"x":14.33,"y":467,"facet":"Unblocked"},{"x":-24.5,"y":468,"facet":"Unblocked"},{"x":-2,"y":469,"facet":"Unblocked"},{"x":-2.67,"y":470,"facet":"Unblocked"},{"x":39.67,"y":471,"facet":"Unblocked"},{"x":10.33,"y":472,"facet":"Unblocked"},{"x":-45.5,"y":473,"facet":"Unblocked"},{"x":26.33,"y":474,"facet":"Unblocked"},{"x":-1.33,"y":475,"facet":"Unblocked"},{"x":15,"y":476,"facet":"Unblocked"},{"x":28.5,"y":477,"facet":"Unblocked"},{"x":-13.17,"y":478,"facet":"Unblocked"},{"x":22.67,"y":479,"facet":"Unblocked"},{"x":16.5,"y":480,"facet":"Unblocked"},{"x":-14.83,"y":481,"facet":"Unblocked"},{"x":30.83,"y":482,"facet":"Unblocked"},{"x":33.17,"y":483,"facet":"Unblocked"},{"x":5,"y":484,"facet":"Unblocked"},{"x":29.5,"y":485,"facet":"Unblocked"},{"x":-45,"y":486,"facet":"Unblocked"},{"x":-14.33,"y":487,"facet":"Unblocked"},{"x":34.17,"y":488,"facet":"Unblocked"},{"x":-11,"y":489,"facet":"Unblocked"},{"x":-39.67,"y":490,"facet":"Unblocked"},{"x":16.67,"y":491,"facet":"Unblocked"},{"x":10,"y":492,"facet":"Unblocked"},{"x":-26.17,"y":493,"facet":"Unblocked"},{"x":57.67,"y":494,"facet":"Unblocked"},{"x":31.5,"y":495,"facet":"Unblocked"},{"x":-43.33,"y":496,"facet":"Unblocked"},{"x":-6.67,"y":497,"facet":"Unblocked"},{"x":-46,"y":498,"facet":"Unblocked"},{"x":7.5,"y":499,"facet":"Unblocked"},{"x":-24.67,"y":500,"facet":"Unblocked"},{"x":1.67,"y":1,"facet":"Blocked"},{"x":-6.67,"y":2,"facet":"Blocked"},{"x":-2.5,"y":3,"facet":"Blocked"},{"x":0.83,"y":4,"facet":"Blocked"},{"x":0.5,"y":5,"facet":"Blocked"},{"x":1.33,"y":6,"facet":"Blocked"},{"x":0.67,"y":7,"facet":"Blocked"},{"x":2,"y":8,"facet":"Blocked"},{"x":-1,"y":9,"facet":"Blocked"},{"x":6.33,"y":10,"facet":"Blocked"},{"x":0.83,"y":11,"facet":"Blocked"},{"x":-0.33,"y":12,"facet":"Blocked"},{"x":5.83,"y":13,"facet":"Blocked"},{"x":-2.17,"y":14,"facet":"Blocked"},{"x":0,"y":15,"facet":"Blocked"},{"x":1.5,"y":16,"facet":"Blocked"},{"x":1,"y":17,"facet":"Blocked"},{"x":1.17,"y":18,"facet":"Blocked"},{"x":1.17,"y":19,"facet":"Blocked"},{"x":6.17,"y":20,"facet":"Blocked"},{"x":5.5,"y":21,"facet":"Blocked"},{"x":2.67,"y":22,"facet":"Blocked"},{"x":0.67,"y":23,"facet":"Blocked"},{"x":7.17,"y":24,"facet":"Blocked"},{"x":0,"y":25,"facet":"Blocked"},{"x":1,"y":26,"facet":"Blocked"},{"x":4.33,"y":27,"facet":"Blocked"},{"x":-3.83,"y":28,"facet":"Blocked"},{"x":2.67,"y":29,"facet":"Blocked"},{"x":1,"y":30,"facet":"Blocked"},{"x":5,"y":31,"facet":"Blocked"},{"x":-1.33,"y":32,"facet":"Blocked"},{"x":1.17,"y":33,"facet":"Blocked"},{"x":6.67,"y":34,"facet":"Blocked"},{"x":0.33,"y":35,"facet":"Blocked"},{"x":2.83,"y":36,"facet":"Blocked"},{"x":2.33,"y":37,"facet":"Blocked"},{"x":1.33,"y":38,"facet":"Blocked"},{"x":-6.67,"y":39,"facet":"Blocked"},{"x":-2.17,"y":40,"facet":"Blocked"},{"x":-7.17,"y":41,"facet":"Blocked"},{"x":2.67,"y":42,"facet":"Blocked"},{"x":5,"y":43,"facet":"Blocked"},{"x":5.17,"y":44,"facet":"Blocked"},{"x":3,"y":45,"facet":"Blocked"},{"x":-0.33,"y":46,"facet":"Blocked"},{"x":-5.5,"y":47,"facet":"Blocked"},{"x":-3,"y":48,"facet":"Blocked"},{"x":0.67,"y":49,"facet":"Blocked"},{"x":-3,"y":50,"facet":"Blocked"},{"x":-0.67,"y":51,"facet":"Blocked"},{"x":-4,"y":52,"facet":"Blocked"},{"x":1.17,"y":53,"facet":"Blocked"},{"x":8.33,"y":54,"facet":"Blocked"},{"x":-6.83,"y":55,"facet":"Blocked"},{"x":-3,"y":56,"facet":"Blocked"},{"x":-8.17,"y":57,"facet":"Blocked"},{"x":5.17,"y":58,"facet":"Blocked"},{"x":-1.5,"y":59,"facet":"Blocked"},{"x":-4,"y":60,"facet":"Blocked"},{"x":-5.17,"y":61,"facet":"Blocked"},{"x":0.5,"y":62,"facet":"Blocked"},{"x":-3.83,"y":63,"facet":"Blocked"},{"x":1.33,"y":64,"facet":"Blocked"},{"x":-3.5,"y":65,"facet":"Blocked"},{"x":6.5,"y":66,"facet":"Blocked"},{"x":-2.33,"y":67,"facet":"Blocked"},{"x":1.33,"y":68,"facet":"Blocked"},{"x":6.67,"y":69,"facet":"Blocked"},{"x":-3.17,"y":70,"facet":"Blocked"},{"x":-1.33,"y":71,"facet":"Blocked"},{"x":5.5,"y":72,"facet":"Blocked"},{"x":1.67,"y":73,"facet":"Blocked"},{"x":4.33,"y":74,"facet":"Blocked"},{"x":-1.17,"y":75,"facet":"Blocked"},{"x":-0.67,"y":76,"facet":"Blocked"},{"x":2.33,"y":77,"facet":"Blocked"},{"x":0.33,"y":78,"facet":"Blocked"},{"x":-1.5,"y":79,"facet":"Blocked"},{"x":1,"y":80,"facet":"Blocked"},{"x":-3.33,"y":81,"facet":"Blocked"},{"x":-3.5,"y":82,"facet":"Blocked"},{"x":-5.17,"y":83,"facet":"Blocked"},{"x":3.5,"y":84,"facet":"Blocked"},{"x":7.17,"y":85,"facet":"Blocked"},{"x":-3.17,"y":86,"facet":"Blocked"},{"x":1.83,"y":87,"facet":"Blocked"},{"x":2.33,"y":88,"facet":"Blocked"},{"x":-0.5,"y":89,"facet":"Blocked"},{"x":-1.17,"y":90,"facet":"Blocked"},{"x":7.83,"y":91,"facet":"Blocked"},{"x":-7.33,"y":92,"facet":"Blocked"},{"x":-3.67,"y":93,"facet":"Blocked"},{"x":8.83,"y":94,"facet":"Blocked"},{"x":3,"y":95,"facet":"Blocked"},{"x":1.67,"y":96,"facet":"Blocked"},{"x":7.33,"y":97,"facet":"Blocked"},{"x":1,"y":98,"facet":"Blocked"},{"x":5.67,"y":99,"facet":"Blocked"},{"x":-2.67,"y":100,"facet":"Blocked"},{"x":0.33,"y":101,"facet":"Blocked"},{"x":-5.83,"y":102,"facet":"Blocked"},{"x":-3.33,"y":103,"facet":"Blocked"},{"x":0,"y":104,"facet":"Blocked"},{"x":-2.67,"y":105,"facet":"Blocked"},{"x":-4,"y":106,"facet":"Blocked"},{"x":2.17,"y":107,"facet":"Blocked"},{"x":2.83,"y":108,"facet":"Blocked"},{"x":-2.5,"y":109,"facet":"Blocked"},{"x":1.67,"y":110,"facet":"Blocked"},{"x":6.67,"y":111,"facet":"Blocked"},{"x":-0.33,"y":112,"facet":"Blocked"},{"x":-2.5,"y":113,"facet":"Blocked"},{"x":4.83,"y":114,"facet":"Blocked"},{"x":-0.83,"y":115,"facet":"Blocked"},{"x":3.33,"y":116,"facet":"Blocked"},{"x":-1.67,"y":117,"facet":"Blocked"},{"x":-1.5,"y":118,"facet":"Blocked"},{"x":-1.17,"y":119,"facet":"Blocked"},{"x":3.17,"y":120,"facet":"Blocked"},{"x":4.5,"y":121,"facet":"Blocked"},{"x":0.67,"y":122,"facet":"Blocked"},{"x":-5.67,"y":123,"facet":"Blocked"},{"x":-2.33,"y":124,"facet":"Blocked"},{"x":-6.83,"y":125,"facet":"Blocked"},{"x":-3.33,"y":126,"facet":"Blocked"},{"x":1.83,"y":127,"facet":"Blocked"},{"x":-0.33,"y":128,"facet":"Blocked"},{"x":-1.33,"y":129,"facet":"Blocked"},{"x":0.17,"y":130,"facet":"Blocked"},{"x":1.5,"y":131,"facet":"Blocked"},{"x":8,"y":132,"facet":"Blocked"},{"x":5.33,"y":133,"facet":"Blocked"},{"x":-4,"y":134,"facet":"Blocked"},{"x":-0.67,"y":135,"facet":"Blocked"},{"x":6.67,"y":136,"facet":"Blocked"},{"x":2.67,"y":137,"facet":"Blocked"},{"x":1.17,"y":138,"facet":"Blocked"},{"x":1.67,"y":139,"facet":"Blocked"},{"x":0.17,"y":140,"facet":"Blocked"},{"x":1,"y":141,"facet":"Blocked"},{"x":-5.67,"y":142,"facet":"Blocked"},{"x":-5.67,"y":143,"facet":"Blocked"},{"x":-4.5,"y":144,"facet":"Blocked"},{"x":-3.5,"y":145,"facet":"Blocked"},{"x":-0.17,"y":146,"facet":"Blocked"},{"x":-6.17,"y":147,"facet":"Blocked"},{"x":8.33,"y":148,"facet":"Blocked"},{"x":6.17,"y":149,"facet":"Blocked"},{"x":-3.5,"y":150,"facet":"Blocked"},{"x":2,"y":151,"facet":"Blocked"},{"x":-2.33,"y":152,"facet":"Blocked"},{"x":-1.67,"y":153,"facet":"Blocked"},{"x":4.67,"y":154,"facet":"Blocked"},{"x":0,"y":155,"facet":"Blocked"},{"x":-1.83,"y":156,"facet":"Blocked"},{"x":-0.83,"y":157,"facet":"Blocked"},{"x":-6,"y":158,"facet":"Blocked"},{"x":-3.83,"y":159,"facet":"Blocked"},{"x":-2.17,"y":160,"facet":"Blocked"},{"x":-5.5,"y":161,"facet":"Blocked"},{"x":5.5,"y":162,"facet":"Blocked"},{"x":7.33,"y":163,"facet":"Blocked"},{"x":5.83,"y":164,"facet":"Blocked"},{"x":-7.33,"y":165,"facet":"Blocked"},{"x":-1.33,"y":166,"facet":"Blocked"},{"x":5,"y":167,"facet":"Blocked"},{"x":8.17,"y":168,"facet":"Blocked"},{"x":-8.17,"y":169,"facet":"Blocked"},{"x":-2.5,"y":170,"facet":"Blocked"},{"x":-2.33,"y":171,"facet":"Blocked"},{"x":-1.67,"y":172,"facet":"Blocked"},{"x":-5.67,"y":173,"facet":"Blocked"},{"x":1,"y":174,"facet":"Blocked"},{"x":1.67,"y":175,"facet":"Blocked"},{"x":0.83,"y":176,"facet":"Blocked"},{"x":-4.67,"y":177,"facet":"Blocked"},{"x":3.17,"y":178,"facet":"Blocked"},{"x":6.33,"y":179,"facet":"Blocked"},{"x":-2,"y":180,"facet":"Blocked"},{"x":-1,"y":181,"facet":"Blocked"},{"x":-7,"y":182,"facet":"Blocked"},{"x":2.5,"y":183,"facet":"Blocked"},{"x":0.17,"y":184,"facet":"Blocked"},{"x":-0.5,"y":185,"facet":"Blocked"},{"x":1.17,"y":186,"facet":"Blocked"},{"x":-0.33,"y":187,"facet":"Blocked"},{"x":-0.67,"y":188,"facet":"Blocked"},{"x":0.33,"y":189,"facet":"Blocked"},{"x":-2,"y":190,"facet":"Blocked"},{"x":4.83,"y":191,"facet":"Blocked"},{"x":-6.17,"y":192,"facet":"Blocked"},{"x":-5,"y":193,"facet":"Blocked"},{"x":4,"y":194,"facet":"Blocked"},{"x":2,"y":195,"facet":"Blocked"},{"x":-0.5,"y":196,"facet":"Blocked"},{"x":0,"y":197,"facet":"Blocked"},{"x":4.33,"y":198,"facet":"Blocked"},{"x":2.67,"y":199,"facet":"Blocked"},{"x":-4.5,"y":200,"facet":"Blocked"},{"x":-0.83,"y":201,"facet":"Blocked"},{"x":-3.17,"y":202,"facet":"Blocked"},{"x":6.5,"y":203,"facet":"Blocked"},{"x":3.33,"y":204,"facet":"Blocked"},{"x":2.67,"y":205,"facet":"Blocked"},{"x":0.17,"y":206,"facet":"Blocked"},{"x":3.17,"y":207,"facet":"Blocked"},{"x":3.5,"y":208,"facet":"Blocked"},{"x":2.67,"y":209,"facet":"Blocked"},{"x":-0.83,"y":210,"facet":"Blocked"},{"x":1,"y":211,"facet":"Blocked"},{"x":-4.83,"y":212,"facet":"Blocked"},{"x":-0.5,"y":213,"facet":"Blocked"},{"x":1.17,"y":214,"facet":"Blocked"},{"x":1.67,"y":215,"facet":"Blocked"},{"x":0.17,"y":216,"facet":"Blocked"},{"x":2.17,"y":217,"facet":"Blocked"},{"x":6.5,"y":218,"facet":"Blocked"},{"x":-1.67,"y":219,"facet":"Blocked"},{"x":6.5,"y":220,"facet":"Blocked"},{"x":-5.17,"y":221,"facet":"Blocked"},{"x":1.17,"y":222,"facet":"Blocked"},{"x":0.67,"y":223,"facet":"Blocked"},{"x":-1.83,"y":224,"facet":"Blocked"},{"x":-1.67,"y":225,"facet":"Blocked"},{"x":8.5,"y":226,"facet":"Blocked"},{"x":0.33,"y":227,"facet":"Blocked"},{"x":3,"y":228,"facet":"Blocked"},{"x":2.5,"y":229,"facet":"Blocked"},{"x":-2.5,"y":230,"facet":"Blocked"},{"x":3,"y":231,"facet":"Blocked"},{"x":-4.83,"y":232,"facet":"Blocked"},{"x":1.83,"y":233,"facet":"Blocked"},{"x":-3,"y":234,"facet":"Blocked"},{"x":2.33,"y":235,"facet":"Blocked"},{"x":3.67,"y":236,"facet":"Blocked"},{"x":-5.67,"y":237,"facet":"Blocked"},{"x":-4.83,"y":238,"facet":"Blocked"},{"x":-4.17,"y":239,"facet":"Blocked"},{"x":0.17,"y":240,"facet":"Blocked"},{"x":1.67,"y":241,"facet":"Blocked"},{"x":-2.5,"y":242,"facet":"Blocked"},{"x":3.5,"y":243,"facet":"Blocked"},{"x":-6.33,"y":244,"facet":"Blocked"},{"x":1.67,"y":245,"facet":"Blocked"},{"x":-8.83,"y":246,"facet":"Blocked"},{"x":1.5,"y":247,"facet":"Blocked"},{"x":7,"y":248,"facet":"Blocked"},{"x":4,"y":249,"facet":"Blocked"},{"x":-2.5,"y":250,"facet":"Blocked"},{"x":2,"y":251,"facet":"Blocked"},{"x":-6.17,"y":252,"facet":"Blocked"},{"x":-1.83,"y":253,"facet":"Blocked"},{"x":3.5,"y":254,"facet":"Blocked"},{"x":-1,"y":255,"facet":"Blocked"},{"x":-3.5,"y":256,"facet":"Blocked"},{"x":-0.17,"y":257,"facet":"Blocked"},{"x":6.5,"y":258,"facet":"Blocked"},{"x":-4.67,"y":259,"facet":"Blocked"},{"x":-1.33,"y":260,"facet":"Blocked"},{"x":7.33,"y":261,"facet":"Blocked"},{"x":-5.33,"y":262,"facet":"Blocked"},{"x":-3.67,"y":263,"facet":"Blocked"},{"x":0.83,"y":264,"facet":"Blocked"},{"x":-1.5,"y":265,"facet":"Blocked"},{"x":0.83,"y":266,"facet":"Blocked"},{"x":5.33,"y":267,"facet":"Blocked"},{"x":1.83,"y":268,"facet":"Blocked"},{"x":-2.5,"y":269,"facet":"Blocked"},{"x":-0.83,"y":270,"facet":"Blocked"},{"x":2.17,"y":271,"facet":"Blocked"},{"x":-2,"y":272,"facet":"Blocked"},{"x":2.33,"y":273,"facet":"Blocked"},{"x":0.17,"y":274,"facet":"Blocked"},{"x":-3,"y":275,"facet":"Blocked"},{"x":-1.33,"y":276,"facet":"Blocked"},{"x":8.83,"y":277,"facet":"Blocked"},{"x":2.5,"y":278,"facet":"Blocked"},{"x":3.17,"y":279,"facet":"Blocked"},{"x":5.83,"y":280,"facet":"Blocked"},{"x":4.33,"y":281,"facet":"Blocked"},{"x":-3.17,"y":282,"facet":"Blocked"},{"x":-1.33,"y":283,"facet":"Blocked"},{"x":1.83,"y":284,"facet":"Blocked"},{"x":-2.5,"y":285,"facet":"Blocked"},{"x":0.17,"y":286,"facet":"Blocked"},{"x":-0.5,"y":287,"facet":"Blocked"},{"x":-4.83,"y":288,"facet":"Blocked"},{"x":4.33,"y":289,"facet":"Blocked"},{"x":-0.17,"y":290,"facet":"Blocked"},{"x":-4.5,"y":291,"facet":"Blocked"},{"x":-2,"y":292,"facet":"Blocked"},{"x":-1.83,"y":293,"facet":"Blocked"},{"x":2.33,"y":294,"facet":"Blocked"},{"x":-2.17,"y":295,"facet":"Blocked"},{"x":-2.67,"y":296,"facet":"Blocked"},{"x":2,"y":297,"facet":"Blocked"},{"x":3.5,"y":298,"facet":"Blocked"},{"x":-0.5,"y":299,"facet":"Blocked"},{"x":-6,"y":300,"facet":"Blocked"},{"x":2.17,"y":301,"facet":"Blocked"},{"x":-3.83,"y":302,"facet":"Blocked"},{"x":-1.5,"y":303,"facet":"Blocked"},{"x":0,"y":304,"facet":"Blocked"},{"x":0.33,"y":305,"facet":"Blocked"},{"x":3.67,"y":306,"facet":"Blocked"},{"x":-1.5,"y":307,"facet":"Blocked"},{"x":-7.83,"y":308,"facet":"Blocked"},{"x":2.83,"y":309,"facet":"Blocked"},{"x":3.17,"y":310,"facet":"Blocked"},{"x":-9,"y":311,"facet":"Blocked"},{"x":-3.5,"y":312,"facet":"Blocked"},{"x":1.5,"y":313,"facet":"Blocked"},{"x":-4.33,"y":314,"facet":"Blocked"},{"x":1.33,"y":315,"facet":"Blocked"},{"x":0.17,"y":316,"facet":"Blocked"},{"x":-1.33,"y":317,"facet":"Blocked"},{"x":0.83,"y":318,"facet":"Blocked"},{"x":-0.83,"y":319,"facet":"Blocked"},{"x":-5.33,"y":320,"facet":"Blocked"},{"x":2.33,"y":321,"facet":"Blocked"},{"x":-2.67,"y":322,"facet":"Blocked"},{"x":-1.17,"y":323,"facet":"Blocked"},{"x":4.83,"y":324,"facet":"Blocked"},{"x":-2.83,"y":325,"facet":"Blocked"},{"x":0.67,"y":326,"facet":"Blocked"},{"x":2.5,"y":327,"facet":"Blocked"},{"x":-0.33,"y":328,"facet":"Blocked"},{"x":1,"y":329,"facet":"Blocked"},{"x":6.5,"y":330,"facet":"Blocked"},{"x":2.83,"y":331,"facet":"Blocked"},{"x":0.83,"y":332,"facet":"Blocked"},{"x":-0.67,"y":333,"facet":"Blocked"},{"x":6.5,"y":334,"facet":"Blocked"},{"x":-1.33,"y":335,"facet":"Blocked"},{"x":1.67,"y":336,"facet":"Blocked"},{"x":1.33,"y":337,"facet":"Blocked"},{"x":1.5,"y":338,"facet":"Blocked"},{"x":-4,"y":339,"facet":"Blocked"},{"x":1.17,"y":340,"facet":"Blocked"},{"x":3.17,"y":341,"facet":"Blocked"},{"x":4.33,"y":342,"facet":"Blocked"},{"x":0.5,"y":343,"facet":"Blocked"},{"x":-2.33,"y":344,"facet":"Blocked"},{"x":4.67,"y":345,"facet":"Blocked"},{"x":1,"y":346,"facet":"Blocked"},{"x":-5.83,"y":347,"facet":"Blocked"},{"x":-0.5,"y":348,"facet":"Blocked"},{"x":2.5,"y":349,"facet":"Blocked"},{"x":7.17,"y":350,"facet":"Blocked"},{"x":4.83,"y":351,"facet":"Blocked"},{"x":2.33,"y":352,"facet":"Blocked"},{"x":2,"y":353,"facet":"Blocked"},{"x":-5.5,"y":354,"facet":"Blocked"},{"x":-2.5,"y":355,"facet":"Blocked"},{"x":3.83,"y":356,"facet":"Blocked"},{"x":0.17,"y":357,"facet":"Blocked"},{"x":1.17,"y":358,"facet":"Blocked"},{"x":-0.67,"y":359,"facet":"Blocked"},{"x":1.83,"y":360,"facet":"Blocked"},{"x":-3.33,"y":361,"facet":"Blocked"},{"x":-1,"y":362,"facet":"Blocked"},{"x":-5,"y":363,"facet":"Blocked"},{"x":3.17,"y":364,"facet":"Blocked"},{"x":1,"y":365,"facet":"Blocked"},{"x":-7.83,"y":366,"facet":"Blocked"},{"x":-7.33,"y":367,"facet":"Blocked"},{"x":-1.67,"y":368,"facet":"Blocked"},{"x":1.33,"y":369,"facet":"Blocked"},{"x":1.33,"y":370,"facet":"Blocked"},{"x":-4.33,"y":371,"facet":"Blocked"},{"x":-2.17,"y":372,"facet":"Blocked"},{"x":5,"y":373,"facet":"Blocked"},{"x":2.17,"y":374,"facet":"Blocked"},{"x":-0.83,"y":375,"facet":"Blocked"},{"x":6.33,"y":376,"facet":"Blocked"},{"x":-2.5,"y":377,"facet":"Blocked"},{"x":3.67,"y":378,"facet":"Blocked"},{"x":6.5,"y":379,"facet":"Blocked"},{"x":3.33,"y":380,"facet":"Blocked"},{"x":-1.83,"y":381,"facet":"Blocked"},{"x":-1.5,"y":382,"facet":"Blocked"},{"x":-0.33,"y":383,"facet":"Blocked"},{"x":2.33,"y":384,"facet":"Blocked"},{"x":-5.83,"y":385,"facet":"Blocked"},{"x":1.67,"y":386,"facet":"Blocked"},{"x":0,"y":387,"facet":"Blocked"},{"x":-4.17,"y":388,"facet":"Blocked"},{"x":5.67,"y":389,"facet":"Blocked"},{"x":3.33,"y":390,"facet":"Blocked"},{"x":2.83,"y":391,"facet":"Blocked"},{"x":2.17,"y":392,"facet":"Blocked"},{"x":-4.67,"y":393,"facet":"Blocked"},{"x":2.33,"y":394,"facet":"Blocked"},{"x":7.33,"y":395,"facet":"Blocked"},{"x":3.33,"y":396,"facet":"Blocked"},{"x":-2.5,"y":397,"facet":"Blocked"},{"x":7.67,"y":398,"facet":"Blocked"},{"x":-2.33,"y":399,"facet":"Blocked"},{"x":5.83,"y":400,"facet":"Blocked"},{"x":1.33,"y":401,"facet":"Blocked"},{"x":0.5,"y":402,"facet":"Blocked"},{"x":-3.5,"y":403,"facet":"Blocked"},{"x":-4.17,"y":404,"facet":"Blocked"},{"x":-0.83,"y":405,"facet":"Blocked"},{"x":1.67,"y":406,"facet":"Blocked"},{"x":-2.17,"y":407,"facet":"Blocked"},{"x":2.67,"y":408,"facet":"Blocked"},{"x":1.83,"y":409,"facet":"Blocked"},{"x":1,"y":410,"facet":"Blocked"},{"x":4.67,"y":411,"facet":"Blocked"},{"x":-4.67,"y":412,"facet":"Blocked"},{"x":-3.67,"y":413,"facet":"Blocked"},{"x":-1.33,"y":414,"facet":"Blocked"},{"x":-0.5,"y":415,"facet":"Blocked"},{"x":-3.83,"y":416,"facet":"Blocked"},{"x":-1.67,"y":417,"facet":"Blocked"},{"x":6.83,"y":418,"facet":"Blocked"},{"x":2.5,"y":419,"facet":"Blocked"},{"x":-3.17,"y":420,"facet":"Blocked"},{"x":2.17,"y":421,"facet":"Blocked"},{"x":3,"y":422,"facet":"Blocked"},{"x":-1.67,"y":423,"facet":"Blocked"},{"x":3.83,"y":424,"facet":"Blocked"},{"x":1.5,"y":425,"facet":"Blocked"},{"x":-1.83,"y":426,"facet":"Blocked"},{"x":0.83,"y":427,"facet":"Blocked"},{"x":-7.67,"y":428,"facet":"Blocked"},{"x":-1.17,"y":429,"facet":"Blocked"},{"x":-6.83,"y":430,"facet":"Blocked"},{"x":-1.33,"y":431,"facet":"Blocked"},{"x":-4.5,"y":432,"facet":"Blocked"},{"x":7.83,"y":433,"facet":"Blocked"},{"x":-0.83,"y":434,"facet":"Blocked"},{"x":-2.5,"y":435,"facet":"Blocked"},{"x":3.83,"y":436,"facet":"Blocked"},{"x":3.17,"y":437,"facet":"Blocked"},{"x":7.17,"y":438,"facet":"Blocked"},{"x":-2.5,"y":439,"facet":"Blocked"},{"x":0.67,"y":440,"facet":"Blocked"},{"x":2,"y":441,"facet":"Blocked"},{"x":6.67,"y":442,"facet":"Blocked"},{"x":-0.17,"y":443,"facet":"Blocked"},{"x":-1.33,"y":444,"facet":"Blocked"},{"x":2.5,"y":445,"facet":"Blocked"},{"x":2.5,"y":446,"facet":"Blocked"},{"x":-1.33,"y":447,"facet":"Blocked"},{"x":3,"y":448,"facet":"Blocked"},{"x":-1.67,"y":449,"facet":"Blocked"},{"x":-1.83,"y":450,"facet":"Blocked"},{"x":-0.5,"y":451,"facet":"Blocked"},{"x":-5.83,"y":452,"facet":"Blocked"},{"x":-6.17,"y":453,"facet":"Blocked"},{"x":-2.33,"y":454,"facet":"Blocked"},{"x":-7.5,"y":455,"facet":"Blocked"},{"x":-0.83,"y":456,"facet":"Blocked"},{"x":-3.67,"y":457,"facet":"Blocked"},{"x":-2.5,"y":458,"facet":"Blocked"},{"x":4.5,"y":459,"facet":"Blocked"},{"x":3.83,"y":460,"facet":"Blocked"},{"x":-5.83,"y":461,"facet":"Blocked"},{"x":-1.33,"y":462,"facet":"Blocked"},{"x":-3.33,"y":463,"facet":"Blocked"},{"x":1.33,"y":464,"facet":"Blocked"},{"x":-0.17,"y":465,"facet":"Blocked"},{"x":-4.5,"y":466,"facet":"Blocked"},{"x":-3.17,"y":467,"facet":"Blocked"},{"x":-2.83,"y":468,"facet":"Blocked"},{"x":-6,"y":469,"facet":"Blocked"},{"x":-1,"y":470,"facet":"Blocked"},{"x":1,"y":471,"facet":"Blocked"},{"x":-3.33,"y":472,"facet":"Blocked"},{"x":4.67,"y":473,"facet":"Blocked"},{"x":1,"y":474,"facet":"Blocked"},{"x":-4.67,"y":475,"facet":"Blocked"},{"x":-2.33,"y":476,"facet":"Blocked"},{"x":6.67,"y":477,"facet":"Blocked"},{"x":-8,"y":478,"facet":"Blocked"},{"x":3,"y":479,"facet":"Blocked"},{"x":3.17,"y":480,"facet":"Blocked"},{"x":6.33,"y":481,"facet":"Blocked"},{"x":-6.5,"y":482,"facet":"Blocked"},{"x":2.33,"y":483,"facet":"Blocked"},{"x":-4.5,"y":484,"facet":"Blocked"},{"x":-7.33,"y":485,"facet":"Blocked"},{"x":0.33,"y":486,"facet":"Blocked"},{"x":-7.33,"y":487,"facet":"Blocked"},{"x":5.5,"y":488,"facet":"Blocked"},{"x":1,"y":489,"facet":"Blocked"},{"x":-3.33,"y":490,"facet":"Blocked"},{"x":4.67,"y":491,"facet":"Blocked"},{"x":4.83,"y":492,"facet":"Blocked"},{"x":-4.17,"y":493,"facet":"Blocked"},{"x":-0.5,"y":494,"facet":"Blocked"},{"x":2.5,"y":495,"facet":"Blocked"},{"x":4.83,"y":496,"facet":"Blocked"},{"x":-8.33,"y":497,"facet":"Blocked"},{"x":3,"y":498,"facet":"Blocked"},{"x":-3,"y":499,"facet":"Blocked"},{"x":-1.5,"y":500,"facet":"Blocked"}],"geom":"histogram","x":"gap in average cart value","y":"draw number","facetVar":"design"}

The toggle above starts on "One chart", which pools every gap from both designs into one pile, so the blocked design's narrow stack gets buried inside the unblocked design's much wider one. Switch it to facet_wrap(~design) and the two designs split into their own panels: the unblocked panel still fans out past 40 or 50 in both directions, while the blocked panel barely leaves single digits. That narrowing is blocking's entire payoff, and now it is a measured number instead of just a claim: a variance cut by about 43 times, from the same 24 shoppers.

=== step === concept
## Stratified randomization: blocking for a categorical nuisance variable

Cart value is a number, so sorting and pairing it works. Device is not a number, it is a category, desktop or mobile, so sorting does not apply to it at all. It needs a different fix for the exact same problem.

That fix is called stratified randomization. Instead of sorting, split the 24 shoppers into their device groups first, 16 desktop and 8 mobile, and randomize separately inside each group, so a fixed share of each group lands in treatment.

```r
# Randomize separately inside each device group: 8 of 16 desktop shoppers and 4 of
# 8 mobile shoppers get the new checkout, every single time this runs
n_desktop <- sum(device == "desktop")
n_mobile <- sum(device == "mobile")
c(n_desktop = n_desktop, n_mobile = n_mobile)
#> n_desktop  n_mobile 
#>        16         8 

set.seed(4)
treat_desktop <- sample(which(device == "desktop"), 8)
treat_mobile <- sample(which(device == "mobile"), 4)
strat_treatment <- rep(0, 24)
strat_treatment[c(treat_desktop, treat_mobile)] <- 1
table(device, strat_treatment)
#>          strat_treatment
#> device    0 1
#>   desktop 8 8
#>   mobile  4 4

p_exact <- dhyper(8, n_desktop, n_mobile, 12)
round(p_exact, 4)
#> [1] 0.3332
round(100 * p_exact, 1)
#> [1] 33.3
```

`sample(which(device == "desktop"), 8)` draws exactly 8 of the 16 desktop shoppers into treatment, and the matching line draws exactly 4 of the 8 mobile shoppers. The table confirms it: 8 desktop shoppers in each arm, 4 mobile shoppers in each arm, exactly, every time this code runs.

`dhyper()` computes the hypergeometric distribution, the exact probability of drawing a given number of one category when you pull a fixed number of items from a population split into two categories without replacement. Here it answers a direct question: if 12 of these 24 shoppers were handed treatment by plain randomization alone, with no stratifying at all, what is the chance that exactly 8 of them turn out to be desktop? The answer is 0.3332, about one in three. Stratified randomization turns that one-in-three chance into a certainty, the categorical counterpart to what pairing did for cart value.

=== step === concept
::prose-only synthesis of the variance and probability numbers already shown in steps 3, 7 and 8; no new visual needed
## Why you block on what you know, and randomize for what you do not

Cart value and device are both nuisance variables that were knowable before a single shopper was assigned anything. That is exactly why each one could be designed away: cart value by blocking, which cut the variance of its imbalance by about 43 times, and device by stratified randomization, which replaced a one-in-three chance of the right split with a guarantee of it every time.

But a nuisance variable nobody measured, or never even thought to look for, cannot be blocked or stratified. You cannot sort shoppers by a number you never recorded, and you cannot stratify on a category you never defined. That is exactly what plain randomization is for: it balances every nuisance variable, known or not, in expectation, even though a single real assignment can still land far from that average, exactly as the spread of 2,000 random splits demonstrated directly.

The rule that falls out of all three mechanisms is simple to state. Block or stratify on every nuisance variable you already know about, and let randomization carry whatever you do not.

=== step === quiz
## Quick check: blocking, stratifying, or just randomizing again?

Suppose the team running this checkout test discovers, only after the shoppers were already assigned a version, that returning shoppers who arrived from a price-comparison email happened to spend differently from everyone else. Nobody recorded this before assignment; it only turned up afterward.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Go back and build blocks for this new variable now, pairing shoppers by it even though they are already assigned to a version. ::no
- Nothing more to do. This variable was never measured before assignment, so only plain randomization was ever covering it, and plain randomization already balances every unmeasured nuisance variable in expectation, this one included. ::ok Right. Blocking and stratified randomization are both decisions made before assignment, on a variable you already know about. A variable discovered afterward was never something either of those tools could have reached; it was randomization's job from the start.
- Stratified randomization cannot help here either way, since it only works for a variable with exactly two categories, the way device had exactly two. ::no Stratified randomization is not limited to two categories. It randomizes separately inside each group of a categorical variable, and that works the same way whether there are two groups or five; the real issue here is that this variable was not known before assignment at all, which rules out blocking and stratifying for a different reason entirely.

=== step === tryit
## Your turn: pair the shoppers and assign the coin flips

Below is the same pairing procedure used to build blocks for these 24 shoppers. The sorting and the pairing are both already correct, but the line that is supposed to flip a coin inside each block does not flip anything at all.

```r
# Pair the 24 shoppers by cart value into 12 blocks, then decide treatment within each block
cart_value <- c(76, 39, 106, 210, 153, 153, 179, 27, 152, 184, 104, 186,
                 40, 180, 80, 201, 43, 75, 117, 191, 18, 149, 98, 41)

block_order <- order(cart_value)
sorted_cart_value <- cart_value[block_order]
block_id <- rep(1:12, each = 2)

# This line always assigns the first shopper in each pair to treatment; it is not a coin flip
block_assignment <- rep(c(1, 0), 12)

data.frame(block = block_id, shopper = block_order, cart_value = sorted_cart_value,
           assignment = ifelse(block_assignment == 1, "treatment", "control"))
```

Replace that one line so each block gets its own independent coin flip instead. Press Check when you have it.

::check {"regex": "(?=[\\s\\S]*order[(])(?=[\\s\\S]*each\\s*=\\s*2)(?=[\\s\\S]*sample[(])", "gate": true, "difficulty": "intermediate", "ok": "Right. Each of the 12 blocks now gets its own independent coin flip, so the pairing still guarantees one treatment shopper and one control shopper of nearly the same cart value in every block, but which one lands in which group is no longer fixed in advance.", "no": "Replace `rep(c(1, 0), 12)` with a random draw repeated once per block: something like `unlist(lapply(1:12, function(b) sample(c(1, 0))))`, so each pair gets its own independent coin flip instead of always handing treatment to the first shopper in the pair."}
::solution
```r
# Flip one coin per block to decide which of its two shoppers gets the new checkout
set.seed(9)
block_assignment <- unlist(lapply(1:12, function(b) sample(c(1, 0))))

data.frame(block = block_id, shopper = block_order, cart_value = sorted_cart_value,
           assignment = ifelse(block_assignment == 1, "treatment", "control"))
#>    block shopper cart_value assignment
#> 1      1      21         18  treatment
#> 2      1       8         27    control
#> 3      2       2         39    control
#> 4      2      13         40  treatment
#> 5      3      24         41    control
#> 6      3      17         43  treatment
#> 7      4      18         75  treatment
#> 8      4       1         76    control
#> 9      5      15         80    control
#> 10     5      23         98  treatment
#> 11     6      11        104    control
#> 12     6       3        106  treatment
#> 13     7      19        117  treatment
#> 14     7      22        149    control
#> 15     8       9        152  treatment
#> 16     8       5        153    control
#> 17     9       6        153    control
#> 18     9       7        179  treatment
#> 19    10      14        180    control
#> 20    10      10        184  treatment
#> 21    11      12        186  treatment
#> 22    11      20        191    control
#> 23    12      16        201    control
#> 24    12       4        210  treatment
```

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher, R.A. (1935), Oliver and Boyd. The original argument for randomization and blocking as the two foundational tools of experimental design.
- [Experimental Designs, 2nd edition](https://www.cambridge.org/core/journals/mathematical-gazette/article/abs/experimental-designs-by-w-g-cochran-and-g-m-cox-2nd-ed-pp-xiv-611-82s-1957-john-wiley-and-sons-new-york-chapman-and-hall-london/550D47C87434B3F362664CD1C0EF83EB) - Cochran, W.G. and Cox, G.M. (1957), John Wiley and Sons. The standard reference for working out block and stratified designs across many fields.
- [Causal Inference for Statistics, Social, and Biomedical Sciences](https://www.cambridge.org/core/books/causal-inference-for-statistics-social-and-biomedical-sciences/71126BE90C58F1A431FE9B2DD07938AB) - Imbens, G.W. and Rubin, D.B. (2015), Cambridge University Press. Covers the finite-population randomization variance behind the simulated gaps in this lesson.
- [Statistics for Experimenters: Design, Innovation, and Discovery, 2nd edition](https://www.wiley-vch.de/de/fachgebiete/mathematik-und-statistik/statistics-for-experimenters-978-0-471-71813-0) - Box, G.E.P., Hunter, W.G. and Hunter, J.S. (2005), Wiley. A practical treatment of blocking and randomized block designs with worked examples.

=== step === complete
## You can now decide what to block, what to stratify, and what to randomize

Cart value cost an unlucky split nearly 50 dollars of pure bias, blocking cut that same kind of imbalance by about 43 times, and stratified randomization turned a one-in-three coincidence into a guarantee. Different mechanisms, same underlying decision: block or stratify on every nuisance variable you already know about, and let plain randomization carry whatever you do not.

Next: what happens when two or more of these design decisions have to be made at once, and the trap waiting in the one case where they cannot be made independently.
