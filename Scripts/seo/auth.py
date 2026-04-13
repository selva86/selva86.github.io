"""OAuth Desktop flow for Google Search Console. Scope: webmasters.readonly."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

from . import config
from .common import log


def _find_existing(candidates: list[Path]) -> Path | None:
    for p in candidates:
        if p.exists():
            return p
    return None


def ensure_client_secret() -> Path:
    """Locate client_secret.json. Prefer Scripts/seo_secrets/; migrate from Scripts/seo/ if found there."""
    target = config.SECRETS_DIR / "client_secret.json"
    if target.exists():
        return target

    fallback = config.SEO_DIR / "client_secret.json"
    if fallback.exists():
        config.SECRETS_DIR.mkdir(parents=True, exist_ok=True)
        log(f"Moving {fallback} -> {target}", config.PULL_LOG)
        shutil.move(str(fallback), str(target))
        return target

    raise FileNotFoundError(
        "client_secret.json not found. Place it at "
        f"{config.SECRETS_DIR / 'client_secret.json'} (preferred) or "
        f"{config.SEO_DIR / 'client_secret.json'}"
    )


def get_credentials(force_reauth: bool = False):
    """Return google.oauth2.credentials.Credentials, refreshing or running OAuth as needed."""
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    client_secret_path = ensure_client_secret()
    token_path = config.SECRETS_DIR / "token.json"

    creds = None
    legacy_token = config.SEO_DIR / "token.json"
    if not force_reauth:
        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), config.GSC_SCOPES)
        elif legacy_token.exists():
            log(f"Migrating legacy token {legacy_token} -> {token_path}", config.PULL_LOG)
            config.SECRETS_DIR.mkdir(parents=True, exist_ok=True)
            shutil.move(str(legacy_token), str(token_path))
            creds = Credentials.from_authorized_user_file(str(token_path), config.GSC_SCOPES)

    if creds and creds.valid and not force_reauth:
        return creds

    if creds and creds.expired and creds.refresh_token and not force_reauth:
        try:
            creds.refresh(Request())
            token_path.write_text(creds.to_json(), encoding="utf-8")
            return creds
        except Exception as exc:
            log(f"Token refresh failed: {exc}. Re-running OAuth.", config.PULL_LOG)

    log("Starting OAuth flow (scope: webmasters.readonly)...", config.PULL_LOG)
    flow = InstalledAppFlow.from_client_secrets_file(
        str(client_secret_path), config.GSC_SCOPES
    )
    creds = flow.run_local_server(port=0)
    config.SECRETS_DIR.mkdir(parents=True, exist_ok=True)
    token_path.write_text(creds.to_json(), encoding="utf-8")
    log(f"Wrote refresh token to {token_path}", config.PULL_LOG)
    return creds


def build_service(creds):
    from googleapiclient.discovery import build
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def list_properties(service) -> list[str]:
    resp = service.sites().list().execute()
    return [s["siteUrl"] for s in resp.get("siteEntry", [])]
