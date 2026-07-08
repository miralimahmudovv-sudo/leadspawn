import asyncio
import logging
import re
from typing import Any

import httpx

from app.schemas.search import Business
from app.services.exceptions import LeadProviderError, LocationNotFoundError
from app.services.osm_tags import tags_for_query

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)
USER_AGENT = "LeadSpawn/0.1 (miralimahmudovv@gmail.com)"
REQUEST_TIMEOUT = httpx.Timeout(50.0, connect=10.0)
OVERPASS_QUERY_TIMEOUT_SECONDS = 30
OVERPASS_RETRY_ROUNDS = 2
OVERPASS_RETRY_PAUSE_SECONDS = 2.0
MAX_BBOX_SPAN_DEGREES = 0.7

BUSINESS_TAG_KEYS = ("amenity", "shop", "craft", "office", "healthcare", "cuisine")

MAX_FETCH = 150

DEDUP_COORD_PRECISION = 3

SAFE_QUERY_PATTERN = re.compile(r"[\w\s\-&'.]+", re.UNICODE)


async def fetch_businesses(query: str, city: str, country: str) -> list[Business]:
    if not SAFE_QUERY_PATTERN.fullmatch(query):
        raise LeadProviderError("Query contains unsupported characters")

    async with httpx.AsyncClient(
        timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}
    ) as client:
        place = await _geocode(client, city, country)
        bbox = _bbox_from(place)
        overpass_query = _build_overpass_query(query, bbox, MAX_FETCH)
        elements = await _query_overpass(client, overpass_query)

    businesses = _parse_and_dedup(elements)
    logger.info(
        "Overpass: %d elements -> %d businesses for query=%r in %r, %r",
        len(elements),
        len(businesses),
        query,
        city,
        country,
    )
    return businesses


async def _geocode(client: httpx.AsyncClient, city: str, country: str) -> dict[str, Any]:
    params = {"q": f"{city}, {country}", "format": "jsonv2", "limit": 1}
    try:
        response = await client.get(NOMINATIM_URL, params=params)
    except httpx.RequestError as exc:
        logger.error("Nominatim request failed: %s", exc)
        raise LeadProviderError("Could not reach the geocoding service") from exc

    if response.status_code != 200:
        logger.error("Nominatim returned status %d", response.status_code)
        raise LeadProviderError(
            f"Geocoding failed with status {response.status_code}"
        )

    results = response.json()
    if not results:
        raise LocationNotFoundError(f"Location not found: {city}, {country}")
    return results[0]


def _bbox_from(place: dict[str, Any]) -> str:
    south, north, west, east = (float(value) for value in place["boundingbox"])
    half_span = MAX_BBOX_SPAN_DEGREES / 2

    if north - south > MAX_BBOX_SPAN_DEGREES:
        center_lat = float(place["lat"])
        south, north = center_lat - half_span, center_lat + half_span
    if east - west > MAX_BBOX_SPAN_DEGREES:
        center_lon = float(place["lon"])
        west, east = center_lon - half_span, center_lon + half_span

    return f"({south},{west},{north},{east})"


def _build_overpass_query(query: str, bbox: str, fetch_limit: int) -> str:
    tag_pairs = tags_for_query(query)
    if tag_pairs:
        clauses = [
            f'nwr["{key}"="{value}"]["name"]{bbox};' for key, value in tag_pairs
        ]
        logger.info("Query %r mapped to OSM tags: %s", query, tag_pairs)
    else:
        clauses = [
            f'nwr["{key}"~"{query}",i]["name"]{bbox};' for key in BUSINESS_TAG_KEYS
        ]
        logger.info("Query %r has no tag mapping, using generic tag-value match", query)

    body = "\n".join(clauses)
    return (
        f"[out:json][timeout:{OVERPASS_QUERY_TIMEOUT_SECONDS}];\n"
        f"(\n{body}\n);\n"
        f"out center {fetch_limit};"
    )


async def _query_overpass(
    client: httpx.AsyncClient, overpass_query: str
) -> list[dict[str, Any]]:
    last_error: LeadProviderError | None = None

    for round_number in range(OVERPASS_RETRY_ROUNDS):
        if round_number:
            logger.warning("All Overpass instances failed, retrying after pause")
            await asyncio.sleep(OVERPASS_RETRY_PAUSE_SECONDS)
        try:
            return await _race_instances(client, overpass_query)
        except LeadProviderError as exc:
            last_error = exc

    raise last_error or LeadProviderError("All Overpass instances failed")


async def _race_instances(
    client: httpx.AsyncClient, overpass_query: str
) -> list[dict[str, Any]]:
    tasks = [
        asyncio.create_task(_post_to_instance(client, url, overpass_query))
        for url in OVERPASS_URLS
    ]
    last_error: LeadProviderError | None = None
    try:
        for future in asyncio.as_completed(tasks):
            try:
                return await future
            except LeadProviderError as exc:
                logger.warning("Overpass instance failed in race: %s", exc)
                last_error = exc
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    raise last_error or LeadProviderError("All Overpass instances failed")


async def _post_to_instance(
    client: httpx.AsyncClient, url: str, overpass_query: str
) -> list[dict[str, Any]]:
    try:
        response = await client.post(url, data={"data": overpass_query})
    except httpx.RequestError as exc:
        raise LeadProviderError(f"Could not reach {url}: {type(exc).__name__}") from exc

    if response.status_code != 200:
        logger.error(
            "Overpass %s returned status %d: %s", url, response.status_code, response.text[:500]
        )
        raise LeadProviderError(
            f"Overpass API request failed with status {response.status_code}"
        )

    data = response.json()
    elements: list[dict[str, Any]] = data.get("elements", [])
    remark = data.get("remark")
    if remark:
        logger.warning("Overpass remark from %s: %s", url, remark)
        if not elements:
            raise LeadProviderError(f"Overpass query did not complete: {remark}")

    return elements


def _parse_and_dedup(elements: list[dict[str, Any]]) -> list[Business]:
    businesses: list[Business] = []
    seen: set[tuple[str, float | None, float | None]] = set()

    for element in elements:
        business = _parse_element(element)
        if business is None:
            continue

        dedup_key = (
            business.name.lower(),
            _rounded(business.latitude),
            _rounded(business.longitude),
        )
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        businesses.append(business)

    return businesses


def _parse_element(element: dict[str, Any]) -> Business | None:
    tags = element.get("tags", {})
    name = _clean(tags.get("name"))
    if not name:
        return None

    center = element.get("center", {})
    return Business(
        name=name,
        website=_normalize_url(_clean(tags.get("website") or tags.get("contact:website"))),
        phone=_clean(tags.get("phone") or tags.get("contact:phone")),
        address=_format_address(tags),
        latitude=element.get("lat") or center.get("lat"),
        longitude=element.get("lon") or center.get("lon"),
    )


def _clean(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return stripped or None


def _normalize_url(url: str | None) -> str | None:
    if url is None:
        return None
    if not url.startswith(("http://", "https://")):
        return f"https://{url}"
    return url


def _rounded(coordinate: float | None) -> float | None:
    if coordinate is None:
        return None
    return round(coordinate, DEDUP_COORD_PRECISION)


def _format_address(tags: dict[str, Any]) -> str | None:
    street = _clean(tags.get("addr:street"))
    house_number = _clean(tags.get("addr:housenumber"))
    street_line = f"{street} {house_number}" if street and house_number else street
    parts = [street_line, _clean(tags.get("addr:postcode")), _clean(tags.get("addr:city"))]
    joined = ", ".join(part for part in parts if part)
    return joined or None
