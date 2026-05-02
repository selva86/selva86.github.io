# Search Console & Webmaster Tools Submission Guide

After the OG-image / Tier 3 push, submit the new sitemap to the major
indexers. None of these can be automated — each requires a logged-in UI
session — but each takes under two minutes.

## 1. Google Search Console

URL: <https://search.google.com/search-console/sitemaps>

1. Pick the `https://r-statistics.co/` property (verify ownership if
   not already set up — easiest is the `<meta name="google-site-verification">`
   tag in the homepage `<head>`).
2. Under **Sitemaps**, enter:
   ```
   sitemap.xml
   ```
3. Click **Submit**. Status should flip from "Couldn't fetch" to
   "Success" within 24 hours.
4. Bonus: also submit an **explicit URL inspection** for the new
   `/tools/` landing and the most important calculators (t-test,
   A/B, lm interpreter). The "Request indexing" button forces a
   priority crawl. Limit: ~10 URLs per day.

## 2. Bing Webmaster Tools

URL: <https://www.bing.com/webmasters/sitemaps>

1. Add the property if it doesn't exist (verify via DNS TXT or HTML
   meta — same options as Google).
2. **Sitemaps → Submit sitemap**:
   ```
   https://r-statistics.co/sitemap.xml
   ```
3. Bing also drives DuckDuckGo and Yahoo, so this single submission
   covers three engines.

## 3. IndexNow (instant indexing)

IndexNow is a push protocol (Bing, Yandex, Seznam) that pings the
crawler the moment a URL changes. Optional but cheap. Generate a key
file at `r-statistics.co/<key>.txt` containing just the key, then
POST changed URLs:

```bash
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "r-statistics.co",
    "key": "<your-key>",
    "keyLocation": "https://r-statistics.co/<key>.txt",
    "urlList": [
      "https://r-statistics.co/tools/",
      "https://r-statistics.co/tools/t-test-calculator.html"
    ]
  }'
```

## 4. AI / LLM-specific submission

These three publish the canonical sitemap. AI crawlers (Claude, GPT,
Gemini, Perplexity) generally honour the same `sitemap.xml` and read
`/llms.txt` directly. No separate submission portals exist as of
2026-05.

- **OpenAI / GPTBot**: indexes via crawl based on `robots.txt` (you
  already allow it). No portal.
- **Anthropic / ClaudeBot, anthropic-ai**: same. Honors robots.txt.
- **Perplexity**: honors `User-agent: PerplexityBot`. Allow if you
  want them to surface r-statistics.co tools.
- **Google AI Overviews**: pulls from the standard Search index. Your
  FAQPage + WebApplication + ItemList JSON-LD blocks now make the
  tools eligible.

## 5. Quick verification commands

Confirm the sitemap is reachable and parseable:

```bash
curl -sI https://r-statistics.co/sitemap.xml | head -3
curl -s https://r-statistics.co/sitemap.xml | grep -c '/tools/'   # expect 28
curl -s https://r-statistics.co/llms.txt | grep -c '/tools/'      # expect 27
curl -s https://r-statistics.co/tools/                            # 200, not 404
```

Validate one tool's structured data:
- <https://search.google.com/test/rich-results> — paste the URL of any
  tool. Should detect WebApplication, BreadcrumbList, and FAQPage.
- <https://validator.schema.org/> — same checks, more pedantic.

## 6. Monitor the rollout

In Google Search Console (under **Pages**) the new URLs should
transition from "Discovered" to "Crawled" to "Indexed" over the
next 7-14 days. Tools that don't make it to "Indexed" usually need
either more inbound links (your tutorial pages already auto-link)
or a richer body of unique content.
