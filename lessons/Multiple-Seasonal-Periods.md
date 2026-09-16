---
title: "Dynamic Regression and Complex Seasonality Lesson 3: Fitting Fourier terms for two seasonal periods"
catalog_blurb: "See a series with two seasonal cycles, then fit both with Fourier terms."
description: "See a daily and a weekly cycle in one hourly series, confirm both in the small multiples and the ACF, then fit both with Fourier terms in one ARIMA model."
keywords: "multiple seasonal periods, Fourier terms, fourier(period = ), two seasonal periods, seasonal period m, hourly electricity demand, fable, ARIMA, PDQ(0,0,0), AICc, tsibble"
post_type: "LESSON"
curriculum_id: "5.70.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-dynamic"
course_title: "Dynamic Regression and Complex Seasonality"
course_lesson: "3"
course_total: "6"
course_landing: "Dynamic-Regression-and-Complex-Seasonality-Course.html"
course_next: "TBATS-for-Complex-Seasonality.html"
course_prev: "Dynamic-Harmonic-Regression.html"
---

=== step === cover
## Fitting Fourier terms for two seasonal periods

Today let's understand how one series can repeat on two different clocks at once, a fast one and a slow one, and how to fit both into a single ARIMA model with Fourier terms.

Here's the running example. Victoria, the Australian state, records its electricity grid demand every half hour. Average that into hourly totals and take four complete weeks, Monday 2014-06-30 through Sunday 2014-07-27, 672 hours of real demand in megawatts (MW) from the Australian Energy Market Operator.

Plot the hour index, 1 through 672, against that hour's demand.

::widget chart-plotter {"data":[{"x":1,"y":4582.8},{"x":2,"y":4206.4},{"x":3,"y":3843},{"x":4,"y":3650.2},{"x":5,"y":3655.3},{"x":6,"y":3942},{"x":7,"y":4722.9},{"x":8,"y":5436.9},{"x":9,"y":5994.7},{"x":10,"y":6114.2},{"x":11,"y":5935.7},{"x":12,"y":5818.3},{"x":13,"y":5832.1},{"x":14,"y":5960.3},{"x":15,"y":5906},{"x":16,"y":5855.9},{"x":17,"y":5972.6},{"x":18,"y":6383.1},{"x":19,"y":6421.4},{"x":20,"y":6097.8},{"x":21,"y":5769.1},{"x":22,"y":5372},{"x":23,"y":4958.5},{"x":24,"y":5071.4},{"x":25,"y":4739.2},{"x":26,"y":4328.3},{"x":27,"y":3991.4},{"x":28,"y":3773.1},{"x":29,"y":3747.2},{"x":30,"y":4078.1},{"x":31,"y":4847.7},{"x":32,"y":5459.8},{"x":33,"y":5894},{"x":34,"y":6002.9},{"x":35,"y":5896.1},{"x":36,"y":5849.5},{"x":37,"y":5843},{"x":38,"y":5910.6},{"x":39,"y":5891.9},{"x":40,"y":5846.5},{"x":41,"y":5931.5},{"x":42,"y":6314.8},{"x":43,"y":6329.1},{"x":44,"y":5966.4},{"x":45,"y":5634},{"x":46,"y":5228.7},{"x":47,"y":4888.7},{"x":48,"y":5012.4},{"x":49,"y":4711.7},{"x":50,"y":4306.3},{"x":51,"y":3961.3},{"x":52,"y":3815.5},{"x":53,"y":3807},{"x":54,"y":4061},{"x":55,"y":4786.7},{"x":56,"y":5394.9},{"x":57,"y":5796.7},{"x":58,"y":5778.2},{"x":59,"y":5557},{"x":60,"y":5377.8},{"x":61,"y":5222.5},{"x":62,"y":5263.5},{"x":63,"y":5298.1},{"x":64,"y":5347.8},{"x":65,"y":5535.3},{"x":66,"y":6011.5},{"x":67,"y":6108},{"x":68,"y":5819.3},{"x":69,"y":5541.7},{"x":70,"y":5183.8},{"x":71,"y":4829.6},{"x":72,"y":5028},{"x":73,"y":4720},{"x":74,"y":4296.6},{"x":75,"y":3976.3},{"x":76,"y":3816.6},{"x":77,"y":3803},{"x":78,"y":4070.1},{"x":79,"y":4781.6},{"x":80,"y":5422},{"x":81,"y":5848},{"x":82,"y":5779.3},{"x":83,"y":5525.8},{"x":84,"y":5344.8},{"x":85,"y":5198.7},{"x":86,"y":5209.6},{"x":87,"y":5176.7},{"x":88,"y":5249.1},{"x":89,"y":5499.6},{"x":90,"y":6197.6},{"x":91,"y":6429.4},{"x":92,"y":6181.5},{"x":93,"y":5881},{"x":94,"y":5448.3},{"x":95,"y":4983.2},{"x":96,"y":5094.7},{"x":97,"y":4736.7},{"x":98,"y":4357.3},{"x":99,"y":3985.2},{"x":100,"y":3816.6},{"x":101,"y":3804.9},{"x":102,"y":4121.5},{"x":103,"y":4821.4},{"x":104,"y":5432.6},{"x":105,"y":5901.9},{"x":106,"y":5924},{"x":107,"y":5731},{"x":108,"y":5641.2},{"x":109,"y":5598.5},{"x":110,"y":5561.9},{"x":111,"y":5406},{"x":112,"y":5359.6},{"x":113,"y":5536.9},{"x":114,"y":6064.1},{"x":115,"y":6173.8},{"x":116,"y":5882.7},{"x":117,"y":5575.5},{"x":118,"y":5176.6},{"x":119,"y":4858.2},{"x":120,"y":5058},{"x":121,"y":4691.5},{"x":122,"y":4205.1},{"x":123,"y":3811},{"x":124,"y":3634},{"x":125,"y":3528.7},{"x":126,"y":3577.9},{"x":127,"y":3834.8},{"x":128,"y":4092.6},{"x":129,"y":4544.8},{"x":130,"y":4819.9},{"x":131,"y":4850.4},{"x":132,"y":4800.9},{"x":133,"y":4700.4},{"x":134,"y":4704.7},{"x":135,"y":4636.1},{"x":136,"y":4645.9},{"x":137,"y":4832.1},{"x":138,"y":5347.9},{"x":139,"y":5509.3},{"x":140,"y":5260.7},{"x":141,"y":5011.4},{"x":142,"y":4752.7},{"x":143,"y":4569.7},{"x":144,"y":4840.7},{"x":145,"y":4558.9},{"x":146,"y":4089.4},{"x":147,"y":3689.4},{"x":148,"y":3491.5},{"x":149,"y":3430.1},{"x":150,"y":3461.9},{"x":151,"y":3637.9},{"x":152,"y":3781.6},{"x":153,"y":4181.4},{"x":154,"y":4460.9},{"x":155,"y":4544},{"x":156,"y":4513.2},{"x":157,"y":4471.1},{"x":158,"y":4471.6},{"x":159,"y":4458},{"x":160,"y":4582.1},{"x":161,"y":4882.6},{"x":162,"y":5385.7},{"x":163,"y":5575.5},{"x":164,"y":5334.2},{"x":165,"y":5144.2},{"x":166,"y":4881},{"x":167,"y":4614.9},{"x":168,"y":4816.6},{"x":169,"y":4514.6},{"x":170,"y":4081},{"x":171,"y":3727.8},{"x":172,"y":3575.7},{"x":173,"y":3569.3},{"x":174,"y":3871.7},{"x":175,"y":4601.5},{"x":176,"y":5266.3},{"x":177,"y":5759.1},{"x":178,"y":5727.1},{"x":179,"y":5470.1},{"x":180,"y":5281.6},{"x":181,"y":5160.5},{"x":182,"y":5165.9},{"x":183,"y":5155.5},{"x":184,"y":5253.2},{"x":185,"y":5541.7},{"x":186,"y":6123.7},{"x":187,"y":6228.1},{"x":188,"y":5918.8},{"x":189,"y":5614.3},{"x":190,"y":5198.5},{"x":191,"y":4821.7},{"x":192,"y":5002.3},{"x":193,"y":4654.2},{"x":194,"y":4212.4},{"x":195,"y":3886.2},{"x":196,"y":3698.3},{"x":197,"y":3685.4},{"x":198,"y":3959.1},{"x":199,"y":4676.4},{"x":200,"y":5338.4},{"x":201,"y":5770.6},{"x":202,"y":5798.6},{"x":203,"y":5588},{"x":204,"y":5329.9},{"x":205,"y":5175.6},{"x":206,"y":5151},{"x":207,"y":5128.3},{"x":208,"y":5220.4},{"x":209,"y":5505.5},{"x":210,"y":6099.1},{"x":211,"y":6198.8},{"x":212,"y":5909.4},{"x":213,"y":5579},{"x":214,"y":5196.7},{"x":215,"y":4770},{"x":216,"y":4955.1},{"x":217,"y":4617.8},{"x":218,"y":4179.6},{"x":219,"y":3823.6},{"x":220,"y":3620.9},{"x":221,"y":3637.1},{"x":222,"y":3984.1},{"x":223,"y":4750.8},{"x":224,"y":5459.5},{"x":225,"y":5956.1},{"x":226,"y":6000.9},{"x":227,"y":5884.8},{"x":228,"y":5883.4},{"x":229,"y":5908.2},{"x":230,"y":5987.8},{"x":231,"y":6002.8},{"x":232,"y":6107.8},{"x":233,"y":6215.9},{"x":234,"y":6560.1},{"x":235,"y":6516.5},{"x":236,"y":6179.8},{"x":237,"y":5874.4},{"x":238,"y":5452.1},{"x":239,"y":5032.8},{"x":240,"y":5162.7},{"x":241,"y":4796.6},{"x":242,"y":4320.8},{"x":243,"y":3936.3},{"x":244,"y":3773.7},{"x":245,"y":3754.2},{"x":246,"y":4116.8},{"x":247,"y":4909.8},{"x":248,"y":5613.2},{"x":249,"y":6127.7},{"x":250,"y":6220.1},{"x":251,"y":6073.2},{"x":252,"y":5957.9},{"x":253,"y":5792},{"x":254,"y":5757.5},{"x":255,"y":5703.2},{"x":256,"y":5756.7},{"x":257,"y":5922.2},{"x":258,"y":6338.8},{"x":259,"y":6432.9},{"x":260,"y":6167.6},{"x":261,"y":5873.7},{"x":262,"y":5454.9},{"x":263,"y":5033.4},{"x":264,"y":5157.1},{"x":265,"y":4799},{"x":266,"y":4328.4},{"x":267,"y":3970.6},{"x":268,"y":3784.2},{"x":269,"y":3763.2},{"x":270,"y":4086.2},{"x":271,"y":4804.3},{"x":272,"y":5435},{"x":273,"y":5926.1},{"x":274,"y":5992.7},{"x":275,"y":5839.5},{"x":276,"y":5585.2},{"x":277,"y":5378.6},{"x":278,"y":5335.8},{"x":279,"y":5336},{"x":280,"y":5372.2},{"x":281,"y":5501.3},{"x":282,"y":5982.2},{"x":283,"y":6109.8},{"x":284,"y":5809.5},{"x":285,"y":5521.2},{"x":286,"y":5146.8},{"x":287,"y":4904.6},{"x":288,"y":5115.1},{"x":289,"y":4738.2},{"x":290,"y":4270.5},{"x":291,"y":3869},{"x":292,"y":3652.8},{"x":293,"y":3569.7},{"x":294,"y":3685.9},{"x":295,"y":4009.4},{"x":296,"y":4291.9},{"x":297,"y":4801.9},{"x":298,"y":5042.6},{"x":299,"y":4921.4},{"x":300,"y":4797.7},{"x":301,"y":4702.9},{"x":302,"y":4755.8},{"x":303,"y":4787.8},{"x":304,"y":4908.7},{"x":305,"y":5095.4},{"x":306,"y":5654.3},{"x":307,"y":5864.4},{"x":308,"y":5609.7},{"x":309,"y":5384.2},{"x":310,"y":5106.4},{"x":311,"y":4877.1},{"x":312,"y":5116.8},{"x":313,"y":4836.8},{"x":314,"y":4389.1},{"x":315,"y":3989.4},{"x":316,"y":3764.3},{"x":317,"y":3640.6},{"x":318,"y":3701.5},{"x":319,"y":3913.6},{"x":320,"y":4088.1},{"x":321,"y":4487.2},{"x":322,"y":4653.8},{"x":323,"y":4569.7},{"x":324,"y":4433.5},{"x":325,"y":4386.3},{"x":326,"y":4460.6},{"x":327,"y":4524.2},{"x":328,"y":4707.2},{"x":329,"y":4987},{"x":330,"y":5621.9},{"x":331,"y":5862.7},{"x":332,"y":5617.5},{"x":333,"y":5362.9},{"x":334,"y":4978.9},{"x":335,"y":4641.9},{"x":336,"y":4851.4},{"x":337,"y":4637.1},{"x":338,"y":4262.4},{"x":339,"y":3925},{"x":340,"y":3715.5},{"x":341,"y":3730.1},{"x":342,"y":4195.6},{"x":343,"y":5004.9},{"x":344,"y":5767.7},{"x":345,"y":6137.3},{"x":346,"y":6155.4},{"x":347,"y":6003.1},{"x":348,"y":5871.5},{"x":349,"y":5762.2},{"x":350,"y":5754.6},{"x":351,"y":5716.3},{"x":352,"y":5779.8},{"x":353,"y":6025.9},{"x":354,"y":6492.9},{"x":355,"y":6559.6},{"x":356,"y":6260.9},{"x":357,"y":5958.7},{"x":358,"y":5533.6},{"x":359,"y":5039.7},{"x":360,"y":5124.6},{"x":361,"y":4755.4},{"x":362,"y":4342.3},{"x":363,"y":3964.5},{"x":364,"y":3822.7},{"x":365,"y":3819.7},{"x":366,"y":4119.9},{"x":367,"y":4976},{"x":368,"y":5777.2},{"x":369,"y":6189.4},{"x":370,"y":6253.4},{"x":371,"y":6162.6},{"x":372,"y":6158.6},{"x":373,"y":6130.7},{"x":374,"y":6218.9},{"x":375,"y":6120.1},{"x":376,"y":6056.8},{"x":377,"y":6174.4},{"x":378,"y":6569.2},{"x":379,"y":6620.4},{"x":380,"y":6287.9},{"x":381,"y":5932.7},{"x":382,"y":5487.6},{"x":383,"y":4994.5},{"x":384,"y":5156.5},{"x":385,"y":4799.4},{"x":386,"y":4344.9},{"x":387,"y":3966.3},{"x":388,"y":3806.8},{"x":389,"y":3794.2},{"x":390,"y":4101.1},{"x":391,"y":4960.7},{"x":392,"y":5819.7},{"x":393,"y":6174.6},{"x":394,"y":6102.8},{"x":395,"y":5810.1},{"x":396,"y":5590.5},{"x":397,"y":5496.4},{"x":398,"y":5488.3},{"x":399,"y":5406.8},{"x":400,"y":5369},{"x":401,"y":5579.6},{"x":402,"y":6186.6},{"x":403,"y":6472.3},{"x":404,"y":6206.3},{"x":405,"y":5888.7},{"x":406,"y":5421.8},{"x":407,"y":4921.3},{"x":408,"y":5053.4},{"x":409,"y":4695.1},{"x":410,"y":4262.7},{"x":411,"y":3909.1},{"x":412,"y":3731.6},{"x":413,"y":3733.8},{"x":414,"y":4078.2},{"x":415,"y":4948.9},{"x":416,"y":5786.2},{"x":417,"y":6086.2},{"x":418,"y":6004.4},{"x":419,"y":5845.9},{"x":420,"y":5746.6},{"x":421,"y":5680.8},{"x":422,"y":5813.7},{"x":423,"y":5719.4},{"x":424,"y":5786.7},{"x":425,"y":5979.3},{"x":426,"y":6493.7},{"x":427,"y":6707},{"x":428,"y":6463.2},{"x":429,"y":6180.5},{"x":430,"y":5712},{"x":431,"y":5220},{"x":432,"y":5317.4},{"x":433,"y":4966.5},{"x":434,"y":4534.4},{"x":435,"y":4155},{"x":436,"y":3963},{"x":437,"y":3959.3},{"x":438,"y":4250.8},{"x":439,"y":5089.8},{"x":440,"y":5915.7},{"x":441,"y":6194.7},{"x":442,"y":6051.5},{"x":443,"y":5791},{"x":444,"y":5654.7},{"x":445,"y":5544.7},{"x":446,"y":5540.4},{"x":447,"y":5473.4},{"x":448,"y":5447.2},{"x":449,"y":5691.3},{"x":450,"y":6158.9},{"x":451,"y":6333.7},{"x":452,"y":6041.5},{"x":453,"y":5766.2},{"x":454,"y":5378.2},{"x":455,"y":5025.3},{"x":456,"y":5190.4},{"x":457,"y":4806.5},{"x":458,"y":4330},{"x":459,"y":3909.6},{"x":460,"y":3701.6},{"x":461,"y":3642},{"x":462,"y":3741.5},{"x":463,"y":4002.8},{"x":464,"y":4311.6},{"x":465,"y":4818},{"x":466,"y":5002},{"x":467,"y":4893.9},{"x":468,"y":4741.1},{"x":469,"y":4639.3},{"x":470,"y":4672.8},{"x":471,"y":4668.3},{"x":472,"y":4771.4},{"x":473,"y":4988.8},{"x":474,"y":5482.9},{"x":475,"y":5647.7},{"x":476,"y":5377.1},{"x":477,"y":5135.7},{"x":478,"y":4856.5},{"x":479,"y":4660.1},{"x":480,"y":4940.2},{"x":481,"y":4673.3},{"x":482,"y":4206.5},{"x":483,"y":3820.8},{"x":484,"y":3625.2},{"x":485,"y":3526},{"x":486,"y":3572.1},{"x":487,"y":3759.1},{"x":488,"y":3917.8},{"x":489,"y":4345.7},{"x":490,"y":4578},{"x":491,"y":4593.9},{"x":492,"y":4478.1},{"x":493,"y":4385.7},{"x":494,"y":4349.2},{"x":495,"y":4348.2},{"x":496,"y":4462.5},{"x":497,"y":4714.5},{"x":498,"y":5345.1},{"x":499,"y":5734.7},{"x":500,"y":5560.6},{"x":501,"y":5347.4},{"x":502,"y":5013},{"x":503,"y":4686.9},{"x":504,"y":4842.9},{"x":505,"y":4566.2},{"x":506,"y":4143.3},{"x":507,"y":3834.2},{"x":508,"y":3723.3},{"x":509,"y":3740.9},{"x":510,"y":4048.2},{"x":511,"y":4935.1},{"x":512,"y":5784.1},{"x":513,"y":6250.4},{"x":514,"y":6262.1},{"x":515,"y":6035.2},{"x":516,"y":5881.6},{"x":517,"y":5758},{"x":518,"y":5690.5},{"x":519,"y":5635.4},{"x":520,"y":5620},{"x":521,"y":5872.4},{"x":522,"y":6452.3},{"x":523,"y":6690.2},{"x":524,"y":6402.1},{"x":525,"y":6059.3},{"x":526,"y":5631.4},{"x":527,"y":5139.7},{"x":528,"y":5258},{"x":529,"y":4928.8},{"x":530,"y":4515.7},{"x":531,"y":4192.6},{"x":532,"y":3941.9},{"x":533,"y":4008.9},{"x":534,"y":4337.9},{"x":535,"y":5260.1},{"x":536,"y":6149.2},{"x":537,"y":6582.8},{"x":538,"y":6585.1},{"x":539,"y":6375.7},{"x":540,"y":6161},{"x":541,"y":5967.4},{"x":542,"y":5837.9},{"x":543,"y":5667},{"x":544,"y":5590.5},{"x":545,"y":5823.9},{"x":546,"y":6491.2},{"x":547,"y":6855.1},{"x":548,"y":6611.2},{"x":549,"y":6285.7},{"x":550,"y":5773.8},{"x":551,"y":5226.8},{"x":552,"y":5322.1},{"x":553,"y":4946.2},{"x":554,"y":4506.1},{"x":555,"y":4163.2},{"x":556,"y":4008.5},{"x":557,"y":4015.2},{"x":558,"y":4341.9},{"x":559,"y":5289.9},{"x":560,"y":6171.7},{"x":561,"y":6563.9},{"x":562,"y":6512.8},{"x":563,"y":6186.2},{"x":564,"y":5943.5},{"x":565,"y":5819.8},{"x":566,"y":5865.9},{"x":567,"y":5783.7},{"x":568,"y":5701},{"x":569,"y":5918.3},{"x":570,"y":6465.4},{"x":571,"y":6675.7},{"x":572,"y":6417.4},{"x":573,"y":6125},{"x":574,"y":5687.7},{"x":575,"y":5199.1},{"x":576,"y":5310},{"x":577,"y":4971.5},{"x":578,"y":4584.6},{"x":579,"y":4264.4},{"x":580,"y":4103.7},{"x":581,"y":4083.6},{"x":582,"y":4425.1},{"x":583,"y":5259.9},{"x":584,"y":6090.6},{"x":585,"y":6488.3},{"x":586,"y":6507.9},{"x":587,"y":6384.4},{"x":588,"y":6268.1},{"x":589,"y":6114.9},{"x":590,"y":5980},{"x":591,"y":5916.2},{"x":592,"y":5916.7},{"x":593,"y":6060.6},{"x":594,"y":6367.9},{"x":595,"y":6583.3},{"x":596,"y":6328.7},{"x":597,"y":6015.9},{"x":598,"y":5578.8},{"x":599,"y":5138.2},{"x":600,"y":5244},{"x":601,"y":4886.8},{"x":602,"y":4482.5},{"x":603,"y":4103.9},{"x":604,"y":3920},{"x":605,"y":3907.6},{"x":606,"y":4225.9},{"x":607,"y":5030.5},{"x":608,"y":5758.9},{"x":609,"y":6019.2},{"x":610,"y":5910.7},{"x":611,"y":5753.8},{"x":612,"y":5673.4},{"x":613,"y":5571},{"x":614,"y":5539},{"x":615,"y":5507},{"x":616,"y":5509.3},{"x":617,"y":5651.4},{"x":618,"y":6007.2},{"x":619,"y":6160.5},{"x":620,"y":5898.5},{"x":621,"y":5639.2},{"x":622,"y":5266.5},{"x":623,"y":5001.2},{"x":624,"y":5213.4},{"x":625,"y":4813.4},{"x":626,"y":4331.5},{"x":627,"y":3943.4},{"x":628,"y":3722.6},{"x":629,"y":3677.9},{"x":630,"y":3779.2},{"x":631,"y":3949.3},{"x":632,"y":4227.3},{"x":633,"y":4679.1},{"x":634,"y":4910.3},{"x":635,"y":4881.1},{"x":636,"y":4797.2},{"x":637,"y":4768.5},{"x":638,"y":4757.4},{"x":639,"y":4715.6},{"x":640,"y":4742.8},{"x":641,"y":4992.1},{"x":642,"y":5402.5},{"x":643,"y":5558.8},{"x":644,"y":5384.9},{"x":645,"y":5101},{"x":646,"y":4837.6},{"x":647,"y":4659.1},{"x":648,"y":4945.7},{"x":649,"y":4662.4},{"x":650,"y":4198.7},{"x":651,"y":3821.9},{"x":652,"y":3646},{"x":653,"y":3566.7},{"x":654,"y":3620.8},{"x":655,"y":3828.3},{"x":656,"y":3986.8},{"x":657,"y":4298.6},{"x":658,"y":4400.7},{"x":659,"y":4330.7},{"x":660,"y":4218},{"x":661,"y":4163.5},{"x":662,"y":4206.8},{"x":663,"y":4259.1},{"x":664,"y":4360.1},{"x":665,"y":4626},{"x":666,"y":5189.7},{"x":667,"y":5607.2},{"x":668,"y":5402.7},{"x":669,"y":5159.8},{"x":670,"y":4828.4},{"x":671,"y":4509.1},{"x":672,"y":4716.1}],"geoms":["point","line"],"x":"Hour","y":"Demand"}

The line does not settle into one clean repeating wave. It climbs and falls fast, roughly once a day, and riding on top of that a slower shift moves the whole day's shape up and down across the four weeks.

=== step === concept
## What does it mean for a series to have two seasonal periods?

A seasonal period is the number of observations a series takes before its pattern repeats. Statisticians write that count as m. A monthly series with a yearly rhythm has m = 12: this January looks like last January, twelve observations apart.

This series is hourly, so m counts hours, and the window from the last step already gives you everything you need to work out both of them. It covers 4 complete weeks, Monday through Sunday, 672 hours in total.

There are 24 hours in a day, so the daily pattern has m1 = 24. There are 7 days in a week, each with 24 hours, so the weekly pattern has m2 = 7 x 24 = 168.

Both are true of this same 672-hour series at the same time. It is not a daily series or a weekly series; every one of its hours carries both, its place in that day's rise and fall, and its place in that week's weekday-versus-weekend shift.

::prose-only arithmetic on the hour counts already stated in step 1's running example

=== step === concept
## Setting up Victoria's hourly demand in R

Build the 672-hour tsibble from vic_elec's real half-hourly readings before anything else, since every later step in this lesson reuses it.

```r
# Build the 672-hour tsibble of Victoria's real hourly electricity demand
library(tsibble)
library(tsibbledata)
library(fable)
library(fabletools)
library(feasts)
library(dplyr)

hourly <- tsibbledata::vic_elec |>
  filter(Date >= as.Date("2014-06-30"), Date <= as.Date("2014-07-27")) |>
  as_tibble() |>
  mutate(HourIdx = ceiling(row_number() / 2)) |>
  group_by(HourIdx) |>
  summarise(Demand = round(mean(Demand), 1), .groups = "drop") |>
  mutate(Hour = as.POSIXct("2014-06-30 00:00:00", tz = "UTC") + (HourIdx - 1) * 3600) |>
  select(Hour, HourIdx, Demand) |>
  as_tsibble(index = Hour)

hourly
#> # A tsibble: 672 x 3 [1h] <UTC>
#>    Hour                HourIdx Demand
#>    <dttm>                <dbl>  <dbl>
#>  1 2014-06-30 00:00:00       1  4583.
#>  2 2014-06-30 01:00:00       2  4206.
#>  3 2014-06-30 02:00:00       3  3843 
#>  4 2014-06-30 03:00:00       4  3650.
#>  5 2014-06-30 04:00:00       5  3655.
#>  6 2014-06-30 05:00:00       6  3942 
#>  7 2014-06-30 06:00:00       7  4723.
#>  8 2014-06-30 07:00:00       8  5437.
#>  9 2014-06-30 08:00:00       9  5995.
#> 10 2014-06-30 09:00:00      10  6114.
#> # ℹ 662 more rows
```

vic_elec's rows are half-hourly, two of them per hour, already in time order, so pairing up every two consecutive rows and averaging their demand turns them into one hourly value. HourIdx just counts those hours 1 through 672, and Hour spaces them an hour apart so `as_tsibble()` treats this as a proper, gap-free hourly time series.

The header confirms it: 672 x 3, exactly 4 weeks x 7 days x 24 hours, no missing hours. `[1h]` is tsibble's own note that the interval between rows is one hour.

=== step === concept
## Seeing both cycles in one set of small multiples

Group all 672 hours by which day of the week they fall on and which hour of the day, and average each of those 168 combinations over its four real occurrences, four Mondays' worth of 1am, four Tuesdays' worth of 2pm, and so on. See each weekday's 24-hour shape side by side.

::widget facet-grid {"data":[{"x":0,"y":4575.2,"facet":"Mon"},{"x":1,"y":4173.3,"facet":"Mon"},{"x":2,"y":3832.5,"facet":"Mon"},{"x":3,"y":3666.2,"facet":"Mon"},{"x":4,"y":3673.9,"facet":"Mon"},{"x":5,"y":4014.4,"facet":"Mon"},{"x":6,"y":4816.1,"facet":"Mon"},{"x":7,"y":5563.8,"facet":"Mon"},{"x":8,"y":6035.4,"facet":"Mon"},{"x":9,"y":6064.7,"facet":"Mon"},{"x":10,"y":5861,"facet":"Mon"},{"x":11,"y":5713.2,"facet":"Mon"},{"x":12,"y":5628.2,"facet":"Mon"},{"x":13,"y":5642.8,"facet":"Mon"},{"x":14,"y":5603.3,"facet":"Mon"},{"x":15,"y":5627.2,"facet":"Mon"},{"x":16,"y":5853.1,"facet":"Mon"},{"x":17,"y":6363,"facet":"Mon"},{"x":18,"y":6474.8,"facet":"Mon"},{"x":19,"y":6169.9,"facet":"Mon"},{"x":20,"y":5850.4,"facet":"Mon"},{"x":21,"y":5433.9,"facet":"Mon"},{"x":22,"y":4989.9,"facet":"Mon"},{"x":23,"y":5114.1,"facet":"Mon"},{"x":0,"y":4769.4,"facet":"Tue"},{"x":1,"y":4349.7,"facet":"Tue"},{"x":2,"y":4008.7,"facet":"Tue"},{"x":3,"y":3809,"facet":"Tue"},{"x":4,"y":3815.3,"facet":"Tue"},{"x":5,"y":4123.8,"facet":"Tue"},{"x":6,"y":4940,"facet":"Tue"},{"x":7,"y":5681.1,"facet":"Tue"},{"x":8,"y":6109.2,"facet":"Tue"},{"x":9,"y":6160,"facet":"Tue"},{"x":10,"y":6005.6,"facet":"Tue"},{"x":11,"y":5874.8,"facet":"Tue"},{"x":12,"y":5779.2,"facet":"Tue"},{"x":13,"y":5779.6,"facet":"Tue"},{"x":14,"y":5701.8,"facet":"Tue"},{"x":15,"y":5678.6,"facet":"Tue"},{"x":16,"y":5858.8,"facet":"Tue"},{"x":17,"y":6368.6,"facet":"Tue"},{"x":18,"y":6500.9,"facet":"Tue"},{"x":19,"y":6193.7,"facet":"Tue"},{"x":20,"y":5857.9,"facet":"Tue"},{"x":21,"y":5421.7,"facet":"Tue"},{"x":22,"y":4970,"facet":"Tue"},{"x":23,"y":5111.5,"facet":"Tue"},{"x":0,"y":4768.8,"facet":"Wed"},{"x":1,"y":4334.2,"facet":"Wed"},{"x":2,"y":3978.6,"facet":"Wed"},{"x":3,"y":3812.9,"facet":"Wed"},{"x":4,"y":3813.4,"facet":"Wed"},{"x":5,"y":4122,"facet":"Wed"},{"x":6,"y":4947,"facet":"Wed"},{"x":7,"y":5711.4,"facet":"Wed"},{"x":8,"y":6122.8,"facet":"Wed"},{"x":9,"y":6098.7,"facet":"Wed"},{"x":10,"y":5859.5,"facet":"Wed"},{"x":11,"y":5698.8,"facet":"Wed"},{"x":12,"y":5611.7,"facet":"Wed"},{"x":13,"y":5651.4,"facet":"Wed"},{"x":14,"y":5622.9,"facet":"Wed"},{"x":15,"y":5631.4,"facet":"Wed"},{"x":16,"y":5812.3,"facet":"Wed"},{"x":17,"y":6305.9,"facet":"Wed"},{"x":18,"y":6443.1,"facet":"Wed"},{"x":19,"y":6155.7,"facet":"Wed"},{"x":20,"y":5857.4,"facet":"Wed"},{"x":21,"y":5436.4,"facet":"Wed"},{"x":22,"y":4995.7,"facet":"Wed"},{"x":23,"y":5138.5,"facet":"Wed"},{"x":0,"y":4795.8,"facet":"Thu"},{"x":1,"y":4366.2,"facet":"Thu"},{"x":2,"y":4021.5,"facet":"Thu"},{"x":3,"y":3856.4,"facet":"Thu"},{"x":4,"y":3843.7,"facet":"Thu"},{"x":5,"y":4172.6,"facet":"Thu"},{"x":6,"y":4975,"facet":"Thu"},{"x":7,"y":5728,"facet":"Thu"},{"x":8,"y":6137.6,"facet":"Thu"},{"x":9,"y":6127.9,"facet":"Thu"},{"x":10,"y":5957.3,"facet":"Thu"},{"x":11,"y":5829.4,"facet":"Thu"},{"x":12,"y":5696.6,"facet":"Thu"},{"x":13,"y":5690.2,"facet":"Thu"},{"x":14,"y":5628.9,"facet":"Thu"},{"x":15,"y":5677.3,"facet":"Thu"},{"x":16,"y":5865.4,"facet":"Thu"},{"x":17,"y":6349.5,"facet":"Thu"},{"x":18,"y":6538.1,"facet":"Thu"},{"x":19,"y":6285.2,"facet":"Thu"},{"x":20,"y":5987.8,"facet":"Thu"},{"x":21,"y":5548.5,"facet":"Thu"},{"x":22,"y":5093.7,"facet":"Thu"},{"x":23,"y":5203.3,"facet":"Thu"},{"x":0,"y":4847.2,"facet":"Fri"},{"x":1,"y":4425.6,"facet":"Fri"},{"x":2,"y":4053.7,"facet":"Fri"},{"x":3,"y":3870.9,"facet":"Fri"},{"x":4,"y":3858.8,"facet":"Fri"},{"x":5,"y":4171.1,"facet":"Fri"},{"x":6,"y":4936.5,"facet":"Fri"},{"x":7,"y":5635.6,"facet":"Fri"},{"x":8,"y":6010.5,"facet":"Fri"},{"x":9,"y":5969.7,"facet":"Fri"},{"x":10,"y":5778.8,"facet":"Fri"},{"x":11,"y":5638.6,"facet":"Fri"},{"x":12,"y":5523.2,"facet":"Fri"},{"x":13,"y":5494.3,"facet":"Fri"},{"x":14,"y":5430.6,"facet":"Fri"},{"x":15,"y":5422.1,"facet":"Fri"},{"x":16,"y":5595.2,"facet":"Fri"},{"x":17,"y":6053.1,"facet":"Fri"},{"x":18,"y":6194.4,"facet":"Fri"},{"x":19,"y":5908,"facet":"Fri"},{"x":20,"y":5625.5,"facet":"Fri"},{"x":21,"y":5242,"facet":"Fri"},{"x":22,"y":4947.3,"facet":"Fri"},{"x":23,"y":5144.2,"facet":"Fri"},{"x":0,"y":4762.4,"facet":"Sat"},{"x":1,"y":4284.3,"facet":"Sat"},{"x":2,"y":3883.2,"facet":"Sat"},{"x":3,"y":3677.8,"facet":"Sat"},{"x":4,"y":3604.6,"facet":"Sat"},{"x":5,"y":3696.1,"facet":"Sat"},{"x":6,"y":3949.1,"facet":"Sat"},{"x":7,"y":4230.9,"facet":"Sat"},{"x":8,"y":4711,"facet":"Sat"},{"x":9,"y":4943.7,"facet":"Sat"},{"x":10,"y":4886.7,"facet":"Sat"},{"x":11,"y":4784.2,"facet":"Sat"},{"x":12,"y":4702.8,"facet":"Sat"},{"x":13,"y":4722.7,"facet":"Sat"},{"x":14,"y":4702,"facet":"Sat"},{"x":15,"y":4767.2,"facet":"Sat"},{"x":16,"y":4977.1,"facet":"Sat"},{"x":17,"y":5471.9,"facet":"Sat"},{"x":18,"y":5645,"facet":"Sat"},{"x":19,"y":5408.1,"facet":"Sat"},{"x":20,"y":5158.1,"facet":"Sat"},{"x":21,"y":4888.3,"facet":"Sat"},{"x":22,"y":4691.5,"facet":"Sat"},{"x":23,"y":4960.9,"facet":"Sat"},{"x":0,"y":4682.9,"facet":"Sun"},{"x":1,"y":4220.9,"facet":"Sun"},{"x":2,"y":3830.4,"facet":"Sun"},{"x":3,"y":3631.8,"facet":"Sun"},{"x":4,"y":3540.8,"facet":"Sun"},{"x":5,"y":3589.1,"facet":"Sun"},{"x":6,"y":3784.7,"facet":"Sun"},{"x":7,"y":3943.6,"facet":"Sun"},{"x":8,"y":4328.2,"facet":"Sun"},{"x":9,"y":4523.4,"facet":"Sun"},{"x":10,"y":4509.6,"facet":"Sun"},{"x":11,"y":4410.7,"facet":"Sun"},{"x":12,"y":4351.6,"facet":"Sun"},{"x":13,"y":4372,"facet":"Sun"},{"x":14,"y":4397.4,"facet":"Sun"},{"x":15,"y":4528,"facet":"Sun"},{"x":16,"y":4802.5,"facet":"Sun"},{"x":17,"y":5385.6,"facet":"Sun"},{"x":18,"y":5695,"facet":"Sun"},{"x":19,"y":5478.8,"facet":"Sun"},{"x":20,"y":5253.6,"facet":"Sun"},{"x":21,"y":4925.3,"facet":"Sun"},{"x":22,"y":4613.2,"facet":"Sun"},{"x":23,"y":4806.8,"facet":"Sun"}],"geom":"line","x":"Hour of day","y":"Demand","facetVar":"Weekday"}

Inside any one panel, say Monday's, demand rises and falls exactly once: low overnight, a morning climb, a small midday dip, an evening peak near 6474.8 MW. That one rise and fall per panel, repeated in every panel, is the 24-hour period, m1, showing up as the within-panel shape.

Compare panel to panel and a second pattern appears. The five weekday panels average close together, from 5240.7 MW on Friday to 5390.7 on Thursday, while Saturday and Sunday average lower and flatter, 4646.2 and 4483.6. Thursday's evening peak reaches 6538.1 MW; Saturday's own evening peak only reaches 5645. That gap between weekday panels and weekend panels is the 168-hour period, m2, showing up as the difference between panels.

=== step === concept
## Reading both cycles in the autocorrelation function

The autocorrelation function, ACF, measures how strongly a series correlates with itself some number of hours earlier, that gap is called the lag. A tall spike at a given lag means demand that many hours apart tends to move together; compute it out to 200 hours and read the spikes at multiples of 24.

```r
# Compute the autocorrelation of hourly demand out to 200 hours, then read the multiples of 24
acf_vals <- hourly |> ACF(Demand, lag_max = 200) |> mutate(acf = round(acf, 3))
acf_vals[c(24, 48, 72, 96, 120, 144, 168, 192), ]
#> # A tsibble: 8 x 2 [1h]
#>        lag   acf
#>   <cf_lag> <dbl>
#> 1      24h 0.808
#> 2      48h 0.604
#> 3      72h 0.541
#> 4      96h 0.5  
#> 5     120h 0.499
#> 6     144h 0.615
#> 7     168h 0.705
#> 8     192h 0.585
```

Spikes recur every 24 hours, and at first each one is smaller than the last: 0.808 at lag 24, 0.604 at lag 48, down to 0.499 at lag 120. Demand two or three days apart resembles today's less than demand one day apart does, so the spikes decay. That decay is the 24-hour period, m1, confirmed a second, independent way.

But the decay does not just keep falling. From lag 120 the spikes climb back up, 0.615 at lag 144, then 0.705 at lag 168, higher than every multiple of 24 from 96 through 168. Demand exactly one week back, the very same hour of the very same day of the week, resembles this hour more closely than demand only 144 or 120 hours back does, and that rebound is the 168-hour period, m2, confirmed the same way.

See the full curve from lag 1 to lag 200.

::widget chart-plotter {"data":[{"x":1,"y":0.9224},{"x":2,"y":0.7406},{"x":3,"y":0.5202},{"x":4,"y":0.3107},{"x":5,"y":0.1438},{"x":6,"y":0.0222},{"x":7,"y":-0.0648},{"x":8,"y":-0.1207},{"x":9,"y":-0.1477},{"x":10,"y":-0.1613},{"x":11,"y":-0.1735},{"x":12,"y":-0.1845},{"x":13,"y":-0.1948},{"x":14,"y":-0.2011},{"x":15,"y":-0.2025},{"x":16,"y":-0.1882},{"x":17,"y":-0.1451},{"x":18,"y":-0.0713},{"x":19,"y":0.0354},{"x":20,"y":0.1849},{"x":21,"y":0.3745},{"x":22,"y":0.5736},{"x":23,"y":0.7375},{"x":24,"y":0.8079},{"x":25,"y":0.738},{"x":26,"y":0.5721},{"x":27,"y":0.3694},{"x":28,"y":0.1756},{"x":29,"y":0.0214},{"x":30,"y":-0.0899},{"x":31,"y":-0.169},{"x":32,"y":-0.2198},{"x":33,"y":-0.2453},{"x":34,"y":-0.26},{"x":35,"y":-0.2744},{"x":36,"y":-0.2882},{"x":37,"y":-0.3011},{"x":38,"y":-0.31},{"x":39,"y":-0.3143},{"x":40,"y":-0.3053},{"x":41,"y":-0.2711},{"x":42,"y":-0.2091},{"x":43,"y":-0.1151},{"x":44,"y":0.0214},{"x":45,"y":0.1976},{"x":46,"y":0.3835},{"x":47,"y":0.5366},{"x":48,"y":0.604},{"x":49,"y":0.5431},{"x":50,"y":0.3946},{"x":51,"y":0.212},{"x":52,"y":0.0375},{"x":53,"y":-0.0991},{"x":54,"y":-0.194},{"x":55,"y":-0.2578},{"x":56,"y":-0.2953},{"x":57,"y":-0.3105},{"x":58,"y":-0.3177},{"x":59,"y":-0.3267},{"x":60,"y":-0.3369},{"x":61,"y":-0.3471},{"x":62,"y":-0.3534},{"x":63,"y":-0.3553},{"x":64,"y":-0.3442},{"x":65,"y":-0.3088},{"x":66,"y":-0.2471},{"x":67,"y":-0.1549},{"x":68,"y":-0.0223},{"x":69,"y":0.1477},{"x":70,"y":0.3267},{"x":71,"y":0.4745},{"x":72,"y":0.541},{"x":73,"y":0.4855},{"x":74,"y":0.3468},{"x":75,"y":0.1752},{"x":76,"y":0.0107},{"x":77,"y":-0.1179},{"x":78,"y":-0.2069},{"x":79,"y":-0.2658},{"x":80,"y":-0.2986},{"x":81,"y":-0.31},{"x":82,"y":-0.3146},{"x":83,"y":-0.3222},{"x":84,"y":-0.3314},{"x":85,"y":-0.3408},{"x":86,"y":-0.3463},{"x":87,"y":-0.3478},{"x":88,"y":-0.3378},{"x":89,"y":-0.3051},{"x":90,"y":-0.2473},{"x":91,"y":-0.1602},{"x":92,"y":-0.0343},{"x":93,"y":0.1273},{"x":94,"y":0.2972},{"x":95,"y":0.4373},{"x":96,"y":0.4999},{"x":97,"y":0.4461},{"x":98,"y":0.3124},{"x":99,"y":0.1474},{"x":100,"y":-0.0107},{"x":101,"y":-0.1344},{"x":102,"y":-0.22},{"x":103,"y":-0.2764},{"x":104,"y":-0.3074},{"x":105,"y":-0.317},{"x":106,"y":-0.3192},{"x":107,"y":-0.3242},{"x":108,"y":-0.3309},{"x":109,"y":-0.3373},{"x":110,"y":-0.3395},{"x":111,"y":-0.3371},{"x":112,"y":-0.3236},{"x":113,"y":-0.2887},{"x":114,"y":-0.2303},{"x":115,"y":-0.1443},{"x":116,"y":-0.0217},{"x":117,"y":0.1349},{"x":118,"y":0.2996},{"x":119,"y":0.4363},{"x":120,"y":0.4993},{"x":121,"y":0.451},{"x":122,"y":0.326},{"x":123,"y":0.1709},{"x":124,"y":0.0225},{"x":125,"y":-0.0925},{"x":126,"y":-0.1707},{"x":127,"y":-0.2218},{"x":128,"y":-0.2496},{"x":129,"y":-0.2574},{"x":130,"y":-0.2571},{"x":131,"y":-0.2577},{"x":132,"y":-0.2584},{"x":133,"y":-0.2579},{"x":134,"y":-0.2529},{"x":135,"y":-0.2431},{"x":136,"y":-0.2215},{"x":137,"y":-0.1781},{"x":138,"y":-0.1124},{"x":139,"y":-0.0217},{"x":140,"y":0.1025},{"x":141,"y":0.2582},{"x":142,"y":0.4213},{"x":143,"y":0.5556},{"x":144,"y":0.6153},{"x":145,"y":0.5632},{"x":146,"y":0.4346},{"x":147,"y":0.277},{"x":148,"y":0.1268},{"x":149,"y":0.0098},{"x":150,"y":-0.0708},{"x":151,"y":-0.1239},{"x":152,"y":-0.1535},{"x":153,"y":-0.1626},{"x":154,"y":-0.1623},{"x":155,"y":-0.1614},{"x":156,"y":-0.1596},{"x":157,"y":-0.1571},{"x":158,"y":-0.151},{"x":159,"y":-0.1408},{"x":160,"y":-0.1182},{"x":161,"y":-0.0725},{"x":162,"y":-0.0043},{"x":163,"y":0.0873},{"x":164,"y":0.2099},{"x":165,"y":0.3621},{"x":166,"y":0.5209},{"x":167,"y":0.6507},{"x":168,"y":0.705},{"x":169,"y":0.6464},{"x":170,"y":0.5107},{"x":171,"y":0.3466},{"x":172,"y":0.1907},{"x":173,"y":0.0675},{"x":174,"y":-0.0202},{"x":175,"y":-0.0818},{"x":176,"y":-0.1212},{"x":177,"y":-0.1414},{"x":178,"y":-0.1527},{"x":179,"y":-0.1626},{"x":180,"y":-0.1701},{"x":181,"y":-0.1751},{"x":182,"y":-0.1756},{"x":183,"y":-0.1721},{"x":184,"y":-0.1577},{"x":185,"y":-0.1222},{"x":186,"y":-0.0648},{"x":187,"y":0.0158},{"x":188,"y":0.1265},{"x":189,"y":0.2658},{"x":190,"y":0.4121},{"x":191,"y":0.5327},{"x":192,"y":0.5852},{"x":193,"y":0.5342},{"x":194,"y":0.4108},{"x":195,"y":0.259},{"x":196,"y":0.1131},{"x":197,"y":-0.003},{"x":198,"y":-0.086},{"x":199,"y":-0.1444},{"x":200,"y":-0.1823}],"geoms":["line"],"x":"Lag (hours)","y":"Autocorrelation"}

=== step === quiz
## Quick check: telling the two cycles apart

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The 168-hour period is the within-panel shape you saw in the small multiples, and the 24-hour period is the weekday-versus-weekend difference between panels. ::no
- The 24-hour period is the within-panel shape and the spikes at multiples of 24 in the ACF; the 168-hour period is the weekday-versus-weekend difference between panels and the extra-tall spike near lag 168. ::ok Right. The daily rhythm is what repeats inside one panel and inside one 24-hour stretch of the ACF; the weekly rhythm is what makes one panel differ from another and makes lag 168 stand out from the decay around it.
- Only the 24-hour period is real; the weekday-versus-weekend difference is just noise from averaging over four weeks. ::no
- The ACF spike at lag 168 means demand needs 168 more hours of data before the weekly pattern can be trusted. ::no The spike at lag 168 is not about needing more data. It is a real correlation, computed from the 672 hours already collected, between an hour and the same hour exactly one week earlier.

=== step === concept
## Fourier terms for two periods at once

fable fits a plain linear regression with `TSLM()`, using the same `model()` syntax as `ARIMA()`, and inside its formula `fourier(period = , K = )` builds one sine and one cosine column per harmonic for the period you name. Fit that regression once per period and read what each one returns and explains on its own.

```r
# Fit two throwaway regressions, one per period, to see the columns fourier() builds and how much each explains alone
day_terms  <- hourly |> model(day_terms  = TSLM(Demand ~ fourier(period = "day", K = 3)))
week_terms <- hourly |> model(week_terms = TSLM(Demand ~ fourier(period = "week", K = 2)))

report(day_terms)
#> Series: Demand 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -1381.97  -219.03    39.53   305.02  1082.52 
#> 
#> Coefficients:
#>                                     Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)                          5106.00      18.00 283.620  < 2e-16 ***
#> fourier(period = "day", K = 3)C1_24  -525.38      25.46 -20.636  < 2e-16 ***
#> fourier(period = "day", K = 3)S1_24  -599.82      25.46 -23.559  < 2e-16 ***
#> fourier(period = "day", K = 3)C2_24  -175.69      25.46  -6.901 1.21e-11 ***
#> fourier(period = "day", K = 3)S2_24  -471.54      25.46 -18.521  < 2e-16 ***
#> fourier(period = "day", K = 3)C3_24   214.60      25.46   8.429  < 2e-16 ***
#> fourier(period = "day", K = 3)S3_24   131.07      25.46   5.148 3.47e-07 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 466.7 on 665 degrees of freedom
#> Multiple R-squared: 0.6884,	Adjusted R-squared: 0.6856
#> F-statistic: 244.8 on 6 and 665 DF, p-value: < 2.22e-16

report(week_terms)
#> Series: Demand 
#> Model: TSLM 
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -1756.7  -489.9   125.2   577.3  1456.9 
#> 
#> Coefficients:
#>                                       Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)                            5106.00      29.28 174.367  < 2e-16 ***
#> fourier(period = "week", K = 2)C1_168   388.20      41.41   9.374  < 2e-16 ***
#> fourier(period = "week", K = 2)S1_168  -170.14      41.41  -4.108 4.48e-05 ***
#> fourier(period = "week", K = 2)C2_168  -171.34      41.41  -4.137 3.96e-05 ***
#> fourier(period = "week", K = 2)S2_168   174.44      41.41   4.212 2.88e-05 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 759.1 on 667 degrees of freedom
#> Multiple R-squared: 0.1731,	Adjusted R-squared: 0.1681
#> F-statistic:  34.9 on 4 and 667 DF, p-value: < 2.22e-16
```

`fourier(period = "day", K = 3)` asked for 3 harmonics of the 24-hour period, and it returned 6 columns, one cosine and one sine per harmonic: C1_24, S1_24, C2_24, S2_24, C3_24, S3_24. Every coefficient on them is significant, and together they explain 68.8% of the variance in hourly demand on their own (Multiple R-squared: 0.6884), using only the daily period.

`fourier(period = "week", K = 2)` asked for 2 harmonics of the 168-hour period and returned 4 columns, C1_168, S1_168, C2_168, S2_168. Those explain a much smaller 17.3% of the variance by themselves (Multiple R-squared: 0.1731).

K set how many harmonics each call built: K = 3 for the day, since the panels in the small multiples bent through more than one rise and fall's worth of shape; K = 2 for the week, since the weekday-to-weekend difference was closer to one simple step. That gap, 68.8% against 17.3%, is the first sign that the 24-hour cycle carries more of this series' variance than the 168-hour cycle does; fitting both together next confirms it a sharper way.

=== step === concept
## Fitting ARIMA with both Fourier terms

Put both fourier() calls inside one ARIMA() formula together, alongside `PDQ(0,0,0)`, which turns off ARIMA's own automatic search for a seasonal pattern and leaves that job entirely to the two Fourier terms. `pdq()`, lower case, stays free to search for whatever short, non-seasonal pattern is left in the residuals once both periods are accounted for.

```r
# Fit one ARIMA model carrying both Fourier terms, day and week together
fit_both <- hourly |>
  model(both = ARIMA(Demand ~ PDQ(0,0,0) +
                        fourier(period = "day", K = 3) +
                        fourier(period = "week", K = 2) +
                        pdq()))

report(fit_both)
#> Series: Demand 
#> Model: LM w/ ARIMA(1,1,5) errors 
#> 
#> Coefficients:
#>           ar1     ma1      ma2      ma3      ma4      ma5
#>       -0.2381  0.5055  -0.1735  -0.3454  -0.5523  -0.3573
#> s.e.   0.1083  0.1014   0.0663   0.0467   0.0756   0.0821
#>       fourier(period = "day", K = 3)C1_24  fourier(period = "day", K = 3)S1_24
#>                                 -522.0930                            -599.1603
#> s.e.                              32.8202                              32.9730
#>       fourier(period = "day", K = 3)C2_24  fourier(period = "day", K = 3)S2_24
#>                                 -173.2171                            -471.2480
#> s.e.                              28.6470                              28.7205
#>       fourier(period = "day", K = 3)C3_24  fourier(period = "day", K = 3)S3_24
#>                                  216.0705                             131.2331
#> s.e.                              22.5093                              22.5349
#>       fourier(period = "week", K = 2)C1_168
#>                                    387.2487
#> s.e.                                37.3223
#>       fourier(period = "week", K = 2)S1_168
#>                                   -176.4710
#> s.e.                                38.6771
#>       fourier(period = "week", K = 2)C2_168
#>                                   -171.1721
#> s.e.                                35.1824
#>       fourier(period = "week", K = 2)S2_168
#>                                    178.8784
#> s.e.                                35.0890
#> 
#> sigma^2 estimated as 24537:  log likelihood=-4336.58
#> AIC=8707.15   AICc=8708.09   BIC=8783.8
```

fable settled on ARIMA(1,1,5) errors for whatever is left once both periods are explained: one regular difference and a five-term moving average, no seasonal AR, MA, or differencing at all, exactly what PDQ(0,0,0) ruled out. Every coefficient whose name starts with `fourier(period = "day", K = 3)` shapes the within-day curve, C1_24 through S3_24; every coefficient whose name starts with `fourier(period = "week", K = 2)` shapes the weekday-versus-weekend shift, C1_168 through S2_168.

sigma2, the variance still left in the residuals once both periods and that leftover ARIMA(1,1,5) pattern are accounted for, comes out at 24537.

=== step === concept
## Reading which cycle carries more variance

Fit two smaller versions of the both model, each keeping only one Fourier term.

```r
# Fit two reduced models, one missing each Fourier term
fit_day_only  <- hourly |> model(day_only  = ARIMA(Demand ~ PDQ(0,0,0) + fourier(period = "day", K = 3) + pdq()))
fit_week_only <- hourly |> model(week_only = ARIMA(Demand ~ PDQ(0,0,0) + fourier(period = "week", K = 2) + pdq()))
```

Both fit cleanly, but `glance()` doesn't return an ARIMA model's fit statistics reliably in this in-browser R. Line all three up and compare them in a block that runs locally instead:

```r-static
# Collect AICc and sigma2 from all three fits and compare them
g_both <- glance(fit_both)
g_day  <- glance(fit_day_only)
g_week <- glance(fit_week_only)

data.frame(
  model  = c("both", "day_only", "week_only"),
  AICc   = unname(round(c(g_both$AICc, g_day$AICc, g_week$AICc), 1)),
  sigma2 = unname(round(c(g_both$sigma2, g_day$sigma2, g_week$sigma2), 1))
)
#>       model   AICc  sigma2
#> 1      both 8708.1 24536.9
#> 2  day_only 8755.5 26004.0
#> 3 week_only 9089.8 42966.1
```

AICc is a single number that balances how well a model fits against how many coefficients it took to get there, so a lower AICc for the same job is the better one. both reads 8708.1. Dropping the week term costs day_only very little, 8755.5, only 47.4 higher. Dropping the day term costs week_only far more, 9089.8, a full 381.7 higher.

sigma2 tells the same story from a different angle: both leaves 24537 MW² unexplained, day_only leaves only 6.0% more without the week term, and week_only leaves 75.1% more without the day term. day_only stays close to both on both measures; week_only does not.

::widget chart-plotter {"data":[{"x":"both","y":8708.1},{"x":"day only","y":8755.5},{"x":"week only","y":9089.8}],"geoms":["bar"],"x":"Model","y":"AICc"}

The bar chart above puts the same three AICc numbers side by side: both and day_only sit close together, week_only stands well apart, the same gap that showed up first in the 68.8% against 17.3% back at the two throwaway regressions.

=== step === quiz
## Quick check: what the AICc comparison is really telling you

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A lower AICc simply means the model used more Fourier terms, which is why both has the lowest AICc of the three. ::no
- AICc already penalises a model for its extra coefficients, so day_only landing only 47.4 above both while week_only lands 381.7 above shows the day term explains most of what both explains; the week term mattered far less on its own. ::ok Exactly. AICc is not just "more terms, lower number"; it already charges for every extra coefficient, so a reduced model staying close to the full model's AICc means the term it kept was doing most of the work.
- Since both has the lowest AICc, the comparison only tells you to keep every Fourier term you can fit; it says nothing about which single term matters more. ::no
- sigma2 and AICc disagree here, so the comparison is inconclusive until a fourth model is fit. ::no They do not disagree. sigma2 rose 6.0% without the week term and 75.1% without the day term, the same ordering AICc showed, 47.4 points against 381.7.

=== step === tryit
## Your turn: write the missing Fourier term

`hourly` is still the 672-hour tsibble built earlier in this lesson. Fit `ARIMA(Demand ~ PDQ(0,0,0) + fourier(period = "day", K = 3) + ... + pdq())`, where `...` is the one missing Fourier term that reproduces the both model from a few steps back, and store it in a model called `check`.

```r
# hourly is still the 672-hour tsibble built earlier in this lesson.
# Complete the ARIMA formula below so it reproduces the "both" model:
# keep PDQ(0,0,0) and the day Fourier term, and add the missing week
# Fourier term before pdq(). One statement. Press Check when you have it.
```
::check {"regex": "fourier\\s*[(]\\s*period\\s*=\\s*[\"']week[\"']\\s*,\\s*K\\s*=\\s*2\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: fourier(period = \"week\", K = 2) is the missing term. Together with the day term and PDQ(0,0,0), that reproduces the both model from a few steps back exactly.", "no": "The missing term needs the same shape as the day term above it, fourier(period = , K = ), just switched to the week period with K = 2: fourier(period = \"week\", K = 2)."}
::solution
```r
# The complete formula, reproducing the "both" model
fit_check <- hourly |>
  model(check = ARIMA(Demand ~ PDQ(0,0,0) +
                         fourier(period = "day", K = 3) +
                         fourier(period = "week", K = 2) +
                         pdq()))

report(fit_check)
#> Series: Demand 
#> Model: LM w/ ARIMA(1,1,5) errors 
#> 
#> Coefficients:
#>           ar1     ma1      ma2      ma3      ma4      ma5
#>       -0.2381  0.5055  -0.1735  -0.3454  -0.5523  -0.3573
#> s.e.   0.1083  0.1014   0.0663   0.0467   0.0756   0.0821
#>       fourier(period = "day", K = 3)C1_24  fourier(period = "day", K = 3)S1_24
#>                                 -522.0930                            -599.1603
#> s.e.                              32.8202                              32.9730
#>       fourier(period = "day", K = 3)C2_24  fourier(period = "day", K = 3)S2_24
#>                                 -173.2171                            -471.2480
#> s.e.                              28.6470                              28.7205
#>       fourier(period = "day", K = 3)C3_24  fourier(period = "day", K = 3)S3_24
#>                                  216.0705                             131.2331
#> s.e.                              22.5093                              22.5349
#>       fourier(period = "week", K = 2)C1_168
#>                                    387.2487
#> s.e.                                37.3223
#>       fourier(period = "week", K = 2)S1_168
#>                                   -176.4710
#> s.e.                                38.6771
#>       fourier(period = "week", K = 2)C2_168
#>                                   -171.1721
#> s.e.                                35.1824
#>       fourier(period = "week", K = 2)S2_168
#>                                    178.8784
#> s.e.                                35.0890
#> 
#> sigma^2 estimated as 24537:  log likelihood=-4336.58
#> AIC=8707.15   AICc=8708.09   BIC=8783.8
```

Every coefficient and the sigma^2/AICc line match fit_both's report from a few steps back exactly, confirming the formula is complete.

=== step === concept
## References

- Hyndman, R.J. and Athanasopoulos, G., [Forecasting: Principles and Practice (3rd ed.), chapter 10, Dynamic regression models](https://otexts.com/fpp3/) - fitting Fourier terms for more than one seasonal period inside one ARIMA regression.
- [fable package reference](https://fable.tidyverts.org/) - documentation for `fourier()`, `ARIMA()`, `pdq()`, `PDQ()`, `glance()` and `report()`.
- [feasts package reference](https://feasts.tidyverts.org/) - `ACF()`, used to read both periods in the autocorrelation function.
- [tsibbledata::vic_elec documentation](https://tsibbledata.tidyverts.org/reference/vic_elec.html) - source of the half-hourly Victorian electricity demand aggregated to hourly totals here, from the Australian Energy Market Operator.

=== step === complete
## What you can do now

You can point to Victoria's hourly demand series and name both of its seasonal periods, 24 hours for the daily rhythm and 168 hours for the weekly one, and show each one in a plot, in a set of small multiples, and in the ACF.

You can fit `ARIMA(Demand ~ PDQ(0,0,0) + fourier(period = "day", K) + fourier(period = "week", K) + pdq())` in fable, one `fourier()` call per period inside a single formula, with `PDQ(0,0,0)` leaving the seasonal work entirely to those Fourier terms.

You can compare a full model against two reduced ones with `glance()`, read AICc and sigma2 side by side, and say which of two seasonal periods a series' variance depends on more. Here, that was the 24-hour day: dropping it cost 381.7 points of AICc and 75.1% more residual variance, while dropping the week cost only 47.4 points and 6.0%.
