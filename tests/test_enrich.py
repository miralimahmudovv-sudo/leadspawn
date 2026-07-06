import httpx
import respx

from app.schemas.search import Business
from app.services import enrich


def test_clean_email_lowercases_valid_address():
    assert enrich._clean_email("Info@Example-Praxis.DE") == "info@example-praxis.de"


def test_clean_email_rejects_image_filenames():
    assert enrich._clean_email("logo@2x.png") is None


def test_clean_email_rejects_service_and_placeholder_addresses():
    assert enrich._clean_email("abc123@sentry.io") is None
    assert enrich._clean_email("email@example.com") is None


def test_clean_email_rejects_multiple_at_signs():
    assert enrich._clean_email("a@b@c.de") is None


def test_extract_email_prefers_mailto():
    html = '<a href="mailto:kontakt@praxis.de">Mail</a> other@praxis.de'
    assert enrich._extract_email(html) == "kontakt@praxis.de"


def test_extract_email_falls_back_to_text():
    assert enrich._extract_email("<p>Schreib uns: hallo@laden.de</p>") == "hallo@laden.de"


def test_extract_email_returns_none_for_noise_only():
    assert enrich._extract_email('<img src="a@2x.png"> nothing here') is None


def test_find_contact_link_resolves_relative_href():
    html = '<a href="/kontakt.html">Kontakt</a>'
    assert (
        enrich._find_contact_link(html, "https://praxis.de/") == "https://praxis.de/kontakt.html"
    )


def test_find_contact_link_skips_mailto_and_anchors():
    html = '<a href="mailto:x@y.de">m</a><a href="#contact">c</a>'
    assert enrich._find_contact_link(html, "https://a.de") is None


def make(website: str | None) -> Business:
    return Business(name="B", website=website)


@respx.mock
async def test_enrich_finds_email_on_homepage():
    respx.get("https://a.de").mock(
        return_value=httpx.Response(
            200, html='<a href="mailto:info@a.de">mail</a>'
        )
    )
    business = make("https://a.de")
    await enrich.enrich_emails([business])
    assert business.email == "info@a.de"


@respx.mock
async def test_enrich_follows_contact_page_when_homepage_has_none():
    respx.get("https://b.de/").mock(
        return_value=httpx.Response(200, html='<a href="/impressum">Impressum</a>')
    )
    respx.get("https://b.de/impressum").mock(
        return_value=httpx.Response(200, html="E-Mail: chef@b.de")
    )
    business = make("https://b.de")
    await enrich.enrich_emails([business])
    assert business.email == "chef@b.de"


@respx.mock
async def test_enrich_survives_unreachable_site():
    respx.get("https://dead.de").mock(side_effect=httpx.ConnectError("boom"))
    business = make("https://dead.de")
    await enrich.enrich_emails([business])
    assert business.email is None


@respx.mock
async def test_enrich_ignores_non_html_responses():
    respx.get("https://pdf.de").mock(
        return_value=httpx.Response(
            200, content=b"x@y.de", headers={"content-type": "application/pdf"}
        )
    )
    business = make("https://pdf.de")
    await enrich.enrich_emails([business])
    assert business.email is None


async def test_enrich_skips_businesses_without_website():
    business = make(None)
    await enrich.enrich_emails([business])
    assert business.email is None
