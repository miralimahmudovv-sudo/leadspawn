import logging

from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.schemas.search import SearchRequest, SearchResponse
from app.services.google_places import GooglePlacesError, search_businesses

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest) -> SearchResponse:
    settings = get_settings()
    if not settings.google_places_api_key:
        logger.error("Search rejected: GOOGLE_PLACES_API_KEY is not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Search is not available: the server is missing its Google Places API key",
        )

    try:
        results = await search_businesses(
            api_key=settings.google_places_api_key,
            query=request.query,
            location=request.location,
            limit=request.limit,
        )
    except GooglePlacesError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc

    return SearchResponse(
        query=request.query,
        location=request.location,
        count=len(results),
        results=results,
    )
