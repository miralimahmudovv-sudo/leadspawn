import logging
import re
from typing import Any

import httpx

from app.schemas.search import Business
from app.services.exceptions import LeadProviderError, LocationNotFoundError

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Tried in order; public Overpass instances are often busy, so we fail over.
OVERPASS_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)
USER_AGENT = "LeadSpawn/0.1 (miralimahmudovv@gmail.com)"
# Area queries on large cities regularly take 15-30s on public instances.
REQUEST_TIMEOUT = httpx.Timeout(45.0, connect=10.0)
OVERPASS_QUERY_TIMEOUT_SECONDS = 30

# OSM area ids are derived from the element id plus a type-specific offset.
RELATION_AREA_OFFSET = 3_600_000_000
WAY_AREA_OFFSET = 2_400_000_000

# Tag keys that describe what kind of business an OSM element is.
# Matching against business names was tried and removed: regex-scanning every
# named element in a large city routinely exceeds public-server time limits.
BUSINESS_TAG_KEYS = ("amenity", "shop", "craft", "office", "healthcare", "cuisine")

# The query is interpolated into an Overpass QL regex; anything outside this
# set could change the meaning of the generated query.
SAFE_QUERY_PATTERN = re.compile(r"[\w\s\-&'.]+", re.UNICODE)


async def search_businesses(
    query: str, city: str, country: str, limit: int
) -> list[Business]:
    if not SAFE_QUERY_PATTERN.fullmatch(query):
        raise LeadProviderError("Query contains unsupported characters")

    async with httpx.AsyncClient(
        timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}
    ) as client:
        place = await _geocode(client, city, country)
        prologue, area_suffix = _area_filter_from(place)
        elements = await _query_overpass(client, query, prologue, area_suffix, limit)

    businesses = [_parse_element(element) for element in elements[:limit]]
    logger.info(
        "Overpass returned %d businesses for query=%r in %r, %r",
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


def _area_filter_from(place: dict[str, Any]) -> tuple[str, str]:
    osm_type = place.get("osm_type")
    osm_id = place.get("osm_id")

    if osm_type == "relation":
        return f"area(id:{RELATION_AREA_OFFSET + osm_id})->.searchArea;", "(area.searchArea)"
    if osm_type == "way":
        return f"area(id:{WAY_AREA_OFFSET + osm_id})->.searchArea;", "(area.searchArea)"

    # Nodes (small towns, villages) have no boundary; fall back to the
    # bounding box Nominatim provides: [south, north, west, east].
    south, north, west, east = place["boundingbox"]
    return "", f"({south},{west},{north},{east})"


def _build_overpass_query(
    query: str, prologue: str, area_suffix: str, limit: int
) -> str:
    clauses = [
        f'nwr["{key}"~"{query}",i]["name"]{area_suffix};' for key in BUSINESS_TAG_KEYS
    ]
    body = "\n".join(clauses)
    return (
        f"[out:json][timeout:{OVERPASS_QUERY_TIMEOUT_SECONDS}];\n"
        f"{prologue}\n"
        f"(\n{body}\n);\n"
        f"out center {limit};"
    )


async def _query_overpass(
    client: httpx.AsyncClient, query: str, prologue: str, area_suffix: str, limit: int
) -> list[dict[str, Any]]:
    overpass_query = _build_overpass_query(query, prologue, area_suffix, limit)
    last_error: LeadProviderError | None = None

    for url in OVERPASS_URLS:
        try:
            return await _post_to_instance(client, url, overpass_query)
        except LeadProviderError as exc:
            logger.warning("Overpass instance %s failed, trying next: %s", url, exc)
            last_error = exc

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
        # Overpass reports query timeouts as a remark on an otherwise-200
        # response; an empty result with a remark is a failure, not "no data".
        logger.warning("Overpass remark from %s: %s", url, remark)
        if not elements:
            raise LeadProviderError(f"Overpass query did not complete: {remark}")

    return elements


def _parse_element(element: dict[str, Any]) -> Business:
    tags = element.get("tags", {})
    center = element.get("center", {})
    return Business(
        name=tags.get("name", "Unknown"),
        website=tags.get("website") or tags.get("contact:website"),
        phone=tags.get("phone") or tags.get("contact:phone"),
        address=_format_address(tags),
        latitude=element.get("lat") or center.get("lat"),
        longitude=element.get("lon") or center.get("lon"),
    )


def _format_address(tags: dict[str, Any]) -> str | None:
    street = tags.get("addr:street")
    house_number = tags.get("addr:housenumber")
    street_line = f"{street} {house_number}" if street and house_number else street
    parts = [street_line, tags.get("addr:postcode"), tags.get("addr:city")]
    joined = ", ".join(part for part in parts if part)
    return joined or None
