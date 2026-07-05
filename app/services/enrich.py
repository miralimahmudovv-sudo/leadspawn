import asyncio
import logging
import re
from urllib.parse import urljoin

import httpx

from app.schemas.search import Business

logger = logging.getLogger(__name__)

USER_AGENT = "LeadSpawn/0.1 (miralimahmudovv@gmail.com)"
REQUEST_TIMEOUT = httpx.Timeout(5.0, connect=4.0)
MAX_CONCURRENCY = 20
MAX_ENRICH = 60
MAX_HTML_BYTES = 600_000

CONTACT_HINTS = ("impressum", "kontakt", "contact", "contacto", "iletisim", "legal")

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
MAILTO_PATTERN = re.compile(r"mailto:([^\"'?>\s]+)", re.IGNORECASE)
HREF_PATTERN = re.compile(r"href=[\"']([^\"']+)[\"']", re.IGNORECASE)

IGNORED_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js")
IGNORED_FRAGMENTS = (
    "example.com",
    "example.org",
    "sentry.io",
    "wixpress.com",
    "@sentry",
    "your-email",
    "youremail",
    "email@",
    "user@",
    "name@domain",
    "domain.com",
)


async def enrich_emails(businesses: list[Business]) -> None:
    targets = [business for business in businesses if business.website][:MAX_ENRICH]
    if not targets:
        return

    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
    async with httpx.AsyncClient(
        timeout=REQUEST_TIMEOUT,
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
    ) as client:
        await asyncio.gather(
            *(_enrich_one(client, semaphore, business) for business in targets)
        )

    found = sum(1 for business in targets if business.email)
    logger.info("Email enrichment: %d/%d sites yielded an email", found, len(targets))


async def _enrich_one(
    client: httpx.AsyncClient, semaphore: asyncio.Semaphore, business: Business
) -> None:
    async with semaphore:
        try:
            business.email = await _find_email(client, business.website)
        except Exception as exc:
            logger.debug("Enrichment failed for %s: %s", business.website, exc)


async def _find_email(client: httpx.AsyncClient, url: str | None) -> str | None:
    if not url:
        return None

    html = await _fetch(client, url)
    if html is None:
        return None

    email = _extract_email(html)
    if email:
        return email

    contact_url = _find_contact_link(html, url)
    if contact_url and contact_url != url:
        contact_html = await _fetch(client, contact_url)
        if contact_html:
            return _extract_email(contact_html)

    return None


async def _fetch(client: httpx.AsyncClient, url: str) -> str | None:
    try:
        response = await client.get(url)
    except httpx.RequestError:
        return None
    except UnicodeDecodeError:
        return None

    if response.status_code != 200:
        return None
    content_type = response.headers.get("content-type", "")
    if content_type and "html" not in content_type.lower():
        return None
    return response.text[:MAX_HTML_BYTES]


def _extract_email(html: str) -> str | None:
    for candidate in MAILTO_PATTERN.findall(html):
        email = _clean_email(candidate)
        if email:
            return email
    for candidate in EMAIL_PATTERN.findall(html):
        email = _clean_email(candidate)
        if email:
            return email
    return None


def _clean_email(candidate: str) -> str | None:
    email = candidate.strip().strip(".").lower()
    if email.count("@") != 1:
        return None
    if any(email.endswith(suffix) for suffix in IGNORED_SUFFIXES):
        return None
    if any(fragment in email for fragment in IGNORED_FRAGMENTS):
        return None
    if not EMAIL_PATTERN.fullmatch(email):
        return None
    return email


def _find_contact_link(html: str, base_url: str) -> str | None:
    for href in HREF_PATTERN.findall(html):
        lower = href.lower()
        if lower.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        if any(hint in lower for hint in CONTACT_HINTS):
            return urljoin(base_url, href)
    return None
