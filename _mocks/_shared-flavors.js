// Shared flavor data + scenarios for the blend-3-based mocks.
// Each scenario carries pre-computed results so clicks "just work" without
// running a real CI computation. Five flavors, two scenarios each = 10
// cross-flavor worked examples.

const FLAVORS = {
  mean: {
    flavorLabel: 'the population mean',
    flavorPhrase: 'a single mean',
    useWhen: 'You measured a numeric value (test scores, weights, response times) on a sample, and want a band of plausible values for the underlying true mean.',
    inputs: [
      { key: 'n',    sym: 'n',  label: 'Sample size',  help: 'How many observations.' },
      { key: 'mean', sym: 'x̄', label: 'Sample mean',  help: 'Arithmetic average.' },
      { key: 'sd',   sym: 's',  label: 'Sample SD',    help: 'Standard deviation (n−1 denominator).' },
    ],
    resultPhrase: (r) => `the true population mean most likely lies between <b>${r.lo}</b> and <b>${r.hi}</b>, with margin of error ±${r.half} (SE = ${r.se}, t(${r.tcrit}) at df ${r.df})`,
    resultUnits: '',
  },
  prop: {
    flavorLabel: 'a single proportion',
    flavorPhrase: 'a single proportion',
    useWhen: 'You measured a yes/no outcome (conversion, defect, recommend) on a sample and want a range for the true rate.',
    inputs: [
      { key: 'x', sym: 'x', label: 'Yes responses', help: 'Number of "yes" outcomes.' },
      { key: 'n', sym: 'n', label: 'Sample size',   help: 'Total trials.' },
    ],
    resultPhrase: (r) => `the true population rate most likely lies between <b>${r.lo}</b> and <b>${r.hi}</b> (Wilson CI, p̂ = ${r.est})`,
    resultUnits: '',
  },
  diffprop: {
    flavorLabel: 'the difference of two proportions',
    flavorPhrase: 'a difference of proportions',
    useWhen: 'You compared yes/no rates between two groups (A/B test, treated vs untreated) and want a range for the true gap.',
    inputs: [
      { key: 'x1', sym: 'x₁', label: 'Group 1 yes',   help: '"Yes" count in group 1.' },
      { key: 'n1', sym: 'n₁', label: 'Group 1 size',  help: 'Total in group 1.' },
      { key: 'x2', sym: 'x₂', label: 'Group 2 yes',   help: '"Yes" count in group 2.' },
      { key: 'n2', sym: 'n₂', label: 'Group 2 size',  help: 'Total in group 2.' },
    ],
    resultPhrase: (r) => `the true difference of proportions most likely lies between <b>${r.lo}</b> and <b>${r.hi}</b> (Newcombe CI on Δ = ${r.est})`,
    resultUnits: '',
  },
  poisson: {
    flavorLabel: 'a Poisson rate',
    flavorPhrase: 'a Poisson rate',
    useWhen: 'You counted events over a fixed exposure (incidents per 1000 patient-days, errors per shift) and want a CI for the true rate.',
    inputs: [
      { key: 'x', sym: 'x', label: 'Event count', help: 'Observed number of events.' },
      { key: 'T', sym: 'T', label: 'Exposure',    help: 'Time, area, or person-years.' },
    ],
    resultPhrase: (r) => `the true Poisson rate most likely lies between <b>${r.lo}</b> and <b>${r.hi}</b> per unit exposure (exact χ² CI, λ̂ = ${r.est})`,
    resultUnits: '',
  },
  corr: {
    flavorLabel: 'a population correlation',
    flavorPhrase: 'a correlation',
    useWhen: 'You computed a correlation between two variables and want a CI for the true population value.',
    inputs: [
      { key: 'r', sym: 'r', label: 'Sample correlation', help: 'Observed r, between -1 and +1.' },
      { key: 'n', sym: 'n', label: 'Sample size',         help: 'Pairs of observations.' },
    ],
    resultPhrase: (r) => `the true correlation most likely lies between <b>${r.lo}</b> and <b>${r.hi}</b> (Fisher-z CI on r = ${r.est})`,
    resultUnits: '',
  },
};

const SCENARIOS = [
  // Each: flavor + display name + input state + pre-computed result fields
  { flavor:'mean', name:'Test scores · n=30, x̄=72, SD=11',
    state:{n:30, mean:72, sd:11},
    result:{lo:'67.89', hi:'76.11', half:'4.11', se:'2.008', tcrit:'2.045', df:'29', est:'72.00', conf:'95%'} },
  { flavor:'mean', name:'Lab weights · n=12, x̄=4.85, SD=0.34',
    state:{n:12, mean:4.85, sd:0.34},
    result:{lo:'4.634', hi:'5.066', half:'0.216', se:'0.098', tcrit:'2.201', df:'11', est:'4.850', conf:'95%'} },
  { flavor:'prop', name:'Survey · 28 yes of 100',
    state:{x:28, n:100},
    result:{lo:'0.198', hi:'0.376', half:'0.089', se:'0.045', tcrit:'1.96', df:'—', est:'0.280', conf:'95%'} },
  { flavor:'prop', name:'QC · 5 defective of 200',
    state:{x:5, n:200},
    result:{lo:'0.011', hi:'0.057', half:'0.023', se:'0.011', tcrit:'1.96', df:'—', est:'0.025', conf:'95%'} },
  { flavor:'prop', name:'Conversion · 47 of 1000',
    state:{x:47, n:1000},
    result:{lo:'0.036', hi:'0.062', half:'0.013', se:'0.007', tcrit:'1.96', df:'—', est:'0.047', conf:'95%'} },
  { flavor:'diffprop', name:'A/B test · 120/1000 vs 150/1000',
    state:{x1:120, n1:1000, x2:150, n2:1000},
    result:{lo:'0.002', hi:'0.058', half:'0.028', se:'0.014', tcrit:'1.96', df:'—', est:'0.030', conf:'95%'} },
  { flavor:'diffprop', name:'Trial · 32/50 vs 18/45 cure rate',
    state:{x1:32, n1:50, x2:18, n2:45},
    result:{lo:'0.024', hi:'0.418', half:'0.197', se:'0.099', tcrit:'1.96', df:'—', est:'0.240', conf:'95%'} },
  { flavor:'poisson', name:'Adverse events · 7 in 1000 patient-yr',
    state:{x:7, T:1000},
    result:{lo:'0.0028', hi:'0.0144', half:'—', se:'—', tcrit:'—', df:'—', est:'0.0070', conf:'95%'} },
  { flavor:'poisson', name:'Defects · 12 in 80 hrs',
    state:{x:12, T:80},
    result:{lo:'0.0775', hi:'0.262', half:'—', se:'—', tcrit:'—', df:'—', est:'0.150', conf:'95%'} },
  { flavor:'corr', name:'Strong positive · r=0.65, n=40',
    state:{r:0.65, n:40},
    result:{lo:'0.42', hi:'0.80', half:'—', se:'—', tcrit:'—', df:'—', est:'0.65', conf:'95%'} },
];

window.FLAVORS = FLAVORS;
window.SCENARIOS = SCENARIOS;
