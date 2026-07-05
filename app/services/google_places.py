import logging
from typing import Any

import httpx

from app.schemas.search import Business

logger = logging.getLogger(__name__)

TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
MAX_PAGE_SIZE = 20
REQUEST_TIMEOUT_SECONDS = 10.0

FIELD_MASK = ",".join(
    (
        "places.displayName",
        "places.formattedAddress",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.businessStatus",
        "places.googleMapsUri",
        "places.location",
        "nextPageToken",
    )
)


class GooglePlacesError(Exception):
    """Raised when a Google Places API request fails."""


async def search_businesses(
    api_key: str, query: str, location: str, limit: int
) -> list[Business]:
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    text_query = f"{query} in {location}"
    businesses: list[Business] = []
    page_token: str | None = None

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
        while len(businesses) < limit:
            payload: dict[str, Any] = {
                "textQuery": text_query,
                "pageSize": min(limit - len(businesses), MAX_PAGE_SIZE),
            }
            if page_token:
                payload["pageToken"] = page_token

            data = await _post_search(client, payload, headers)

            for place in data.get("places", []):
                businesses.append(_parse_place(place))
                if len(businesses) >= limit:
                    break

            page_token = data.get("nextPageToken")
            if not page_token:
                break

    logger.info(
        "Google Places returned %d businesses for query=%r", len(businesses), text_query
    )
    return businesses


async def _post_search(
    client: httpx.AsyncClient, payload: dict[str, Any], headers: dict[str, str]
) -> dict[str, Any]:
    try:
        response = await client.post(TEXT_SEARCH_URL, json=payload, headers=headers)
    except httpx.RequestError as exc:
        logger.error("Google Places request failed: %s", exc)
        raise GooglePlacesError("Could not reach the Google Places API") from exc

    if response.status_code != 200:
        logger.error(
            "Google Places returned status %d: %s",
            response.status_code,
            response.text[:500],
        )
        raise GooglePlacesError(
            f"Google Places API request failed with status {response.status_code}"
        )

    return response.json()


def _parse_place(place: dict[str, Any]) -> Business:
    location = place.get("location", {})
    return Business(
        name=place.get("displayName", {}).get("text", "Unknown"),
        website=place.get("websiteUri"),
        phone=place.get("internationalPhoneNumber"),
        address=place.get("formattedAddress"),
        rating=place.get("rating"),
        user_ratings_total=place.get("userRatingCount"),
        business_status=place.get("businessStatus"),
        google_maps_url=place.get("googleMapsUri"),
        latitude=location.get("latitude"),
        longitude=location.get("longitude"),
    )
