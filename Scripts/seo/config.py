"""SEO module configuration: thresholds, patterns, paths."""
from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPTS_DIR = REPO_ROOT / "Scripts"

SEO_DIR = SCRIPTS_DIR / "seo"
SECRETS_DIR = SCRIPTS_DIR / "seo_secrets"
CACHE_DIR = SCRIPTS_DIR / "seo_cache"
REPORTS_DIR = REPO_ROOT / "seo-reports"
PULL_LOG = SCRIPTS_DIR / "seo_pull.log"
ANALYZE_LOG = SCRIPTS_DIR / "seo_analyze.log"

CACHE_DB = CACHE_DIR / "gsc.sqlite"
PULL_STATE = CACHE_DIR / "gsc_pull_state.json"

CLIENT_SECRET_CANDIDATES = [
    SECRETS_DIR / "client_secret.json",
    SEO_DIR / "client_secret.json",
]
TOKEN_CANDIDATES = [
    SECRETS_DIR / "token.json",
    SEO_DIR / "token.json",
]

SITE_URL = "sc-domain:r-statistics.co"
GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

BACKFILL_DAYS = 480
FRESHNESS_LAG_DAYS = 3
ANALYSIS_WINDOW_DAYS = 90
DECAY_MIN_CACHE_DAYS = 120
DECAY_RECENT_DAYS = 30
DECAY_BASELINE_DAYS = 120

STRIKING_POS_MIN = 8.0
STRIKING_POS_MAX = 20.0
STRIKING_MIN_IMPRESSIONS = 50

LOW_CTR_RATIO_THRESHOLD = 0.7
LOW_CTR_MIN_IMPRESSIONS = 100

CANNIB_SECOND_SHARE = 0.25
CANNIB_SCORE_FACTOR = 0.15

GAP_MIN_IMPRESSIONS = 30
GAP_SLUG_OVERLAP_THRESHOLD = 0.30
GAP_SCORE_FACTOR = 0.5

DECAY_DROP_THRESHOLD = 0.6
DECAY_MIN_BASELINE_CLICKS_PER_WEEK = 5.0
DECAY_RANK_IMPRESSION_DROP = 0.4

BACKLOG_TOP_N = 50
CONFIDENCE = {
    "striking_distance": 0.7,
    "low_ctr": 0.6,
    "cannibalization": 0.4,
    "content_gaps": 0.3,
    "decay": 0.8,
}

BRAND_REGEX = re.compile(
    r"(?i)\b(r[-\s]*statistics(?:\.co)?|rstatistics(?:\.co)?|selva\s*prabhakaran|r[-\s]*stat\.co)\b"
)

_exclude_patterns = [
    r"^https?://[^/]+/?$",
    r"/404(\.html)?$",
    r"/about/?$",
    r"/index\.html$",
    r"/sitemap\.xml$",
    r"/feed\.xml$",
    r"/llms\.txt$",
    r"/\.well-known/",
    r"/robots\.txt$",
    r"/cname$",
]
EXCLUDE_PAGE_REGEX = "(?i)(" + "|".join(_exclude_patterns) + ")"

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "then", "of", "to", "in",
    "on", "for", "with", "from", "by", "at", "as", "is", "are", "was",
    "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "can", "could", "should", "may", "might",
    "must", "it", "its", "this", "that", "these", "those", "r",
}

GSC_ROW_LIMIT = 25000
GSC_RETRY_MAX = 5
GSC_RETRY_INITIAL = 1.0
GSC_THROTTLE_SECONDS = 0.1

CALIBRATE_CTR_FROM_DATA = False
