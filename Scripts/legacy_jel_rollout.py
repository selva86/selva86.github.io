import io, os, re, glob, importlib.util
spec=importlib.util.spec_from_file_location('bp','_build/build.py'); bp=importlib.util.module_from_spec(spec); spec.loader.exec_module(bp)
sections=bp.load_sidebar_sections()

# refresh shared css from template critical CSS
tpl=io.open('_build/template.html',encoding='utf-8').read().split('\n')
ded=lambda s:'\n'.join(x[6:] if x.startswith('      ') else x for x in s.split('\n'))
io.open('www/tutorial-jel.css','w',encoding='utf-8',newline='\n').write(
  '/* tutorial-jel.css - full tutorial chrome (base + roadmap-jel) for legacy pages. Auto-extracted. */\n'
  +ded('\n'.join(tpl[26:442]))+'\n'+ded('\n'.join(tpl[451:680]))+'\n')

MAST='''      <header class="site-masthead"><div class="site-masthead-inner">
          <button id="mobile-menu-btn" class="masthead-menu-btn" aria-label="Menu">&#9776;</button>
          <a class="masthead-wordmark" href="/"><span class="masthead-mark">R</span><span class="masthead-name">r&#8209;statistics<span class="masthead-tld">.co</span></span></a>
          <nav class="masthead-nav"><a class="masthead-nav-link" href="/roadmap/">Roadmap</a><a class="masthead-nav-link" href="/tutorials/">Tutorials</a><a class="masthead-nav-link" href="/exercises/">Exercises</a><a class="masthead-nav-link" href="/tools/">Tools</a></nav>
          <div class="masthead-tools"><form onsubmit="my_search_google(); return false;" class="masthead-search"><input type="text" id="my-google-search" placeholder="Search…" aria-label="Search"><span class="kbd-hint" aria-hidden="true">/</span></form>
            <a class="masthead-cta" href="/pricing.html">Get certified</a>
            <button id="dark-mode-toggle" class="masthead-icon-btn" aria-label="Toggle dark mode">&#9789;</button>
            <span class="auth-anon"><a href="/signin.html" class="masthead-auth-link">Sign in</a></span><span class="auth-user"></span>
          </div></div></header>'''
DRAWER='''    <div class="mobile-sidebar-overlay" id="mobile-sidebar"><div class="mobile-sidebar-panel"><button class="mobile-sidebar-close" id="mobile-sidebar-close">&times;</button><div class="mnav-section"><h6 class="mnav-title">Navigate</h6><a class="mnav-link" href="/roadmap/">Roadmap</a><a class="mnav-link" href="/tutorials/">Tutorials</a><a class="mnav-link" href="/exercises/">Exercises</a><a class="mnav-link" href="/tools/">Tools</a><a class="mnav-link mnav-cta" href="/pricing.html">Get certified</a></div><div id="mobile-sidebar-content"></div></div></div>'''
WIRE='''<script>(function(){var b=document.getElementById('mobile-menu-btn'),o=document.getElementById('mobile-sidebar'),c=document.getElementById('mobile-sidebar-close'),mc=document.getElementById('mobile-sidebar-content');function op(){var s=document.getElementById('sidebar-nav');if(s&&mc&&!mc.children.length)mc.innerHTML=s.innerHTML;o&&o.classList.add('open');}b&&b.addEventListener('click',op);c&&c.addEventListener('click',function(){o.classList.remove('open');});o&&o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('open');});var d=document.getElementById('dark-mode-toggle');try{if(localStorage.getItem('rstat_dark')==='1')document.documentElement.classList.add('dark');}catch(e){}d&&d.addEventListener('click',function(){var on=document.documentElement.classList.toggle('dark');try{localStorage.setItem('rstat_dark',on?'1':'0');}catch(e){}});})();</script>
<script defer src="/www/auth-hydrate.js?v=11"></script><script defer src="/www/practice-nav.js?v=6"></script><script defer src="/www/persona-menu.js?v=4"></script>'''
FONTS='<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">'

def transform(path):
    slug=os.path.basename(path); h=io.open(path,encoding='utf-8').read()
    if 'tutorial-jel.css' in h: return 'already'
    m=re.search(r'<link href="css/main\.css\?v=\d+" rel="stylesheet">', h)
    if not m: return 'skip-nomaincss'
    h=h.replace(m.group(0), m.group(0)+'\n    '+FONTS+'\n    <link href="/www/tutorial-jel.css?v=3" rel="stylesheet">',1)
    h=h.replace('<body>','<body class="layout-v2" data-page="tutorial">\n'+DRAWER,1)
    h=re.sub(r'<div class="masthead">.*?</div>\s*(?=<div class="row">)',MAST+'\n\n      ',h,count=1,flags=re.S)
    side=bp.render_sidebar_html(sections,slug)
    h=re.sub(r'(<div id="sidebar-nav">).*?(</div>)',lambda m:m.group(1)+side+m.group(2),h,count=1,flags=re.S)
    h=h.replace('</body>',WIRE+'\n</body>',1)
    if not (('site-masthead' in h) and ('sidebar-section' in h) and ('layout-v2' in h) and ('<div class="masthead">' not in h)): return 'FAIL'
    io.open(path,'w',encoding='utf-8',newline='\n').write(h); return 'ok'

EXCLUDE={'index.html','404.html','terms-of-service.html','refund-policy.html','privacy.html'}
res={}
for f in sorted(glob.glob('*.html')):
    if f in EXCLUDE: continue
    h=io.open(f,encoding='utf-8').read()
    if '<div class="masthead">' in h and '<div id="sidebar-nav">' in h:
        res[f]=transform(f)
from collections import Counter
print('processed:',len(res),dict(Counter(res.values())))
for f,r in sorted(res.items()):
    if r not in('ok','already'): print('  ISSUE',r,f)
