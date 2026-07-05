import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.search import SearchRequest, SearchResponse
from app.services import leads
from app.services.exceptions import LeadProviderError, LocationNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search(
    request: SearchRequest, session: AsyncSession = Depends(get_session)
) -> SearchResponse:
    try:
        results = await leads.get_leads(
            session=session,
            query=request.query,
            city=request.city,
            country=request.country,
            limit=request.limit,
            has_website=request.has_website,
            has_phone=request.has_phone,
            has_email=request.has_email,
        )
    except LocationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except LeadProviderError as exc:
        logger.error(
            "Search failed for %r in %r, %r: %s",
            request.query,
            request.city,
            request.country,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The business data provider is temporarily unavailable. Please try again.",
        ) from exc

    return SearchResponse(
        query=request.query,
        city=request.city,
        country=request.country,
        count=len(results.businesses),
        cached=results.cached,
        results=results.businesses,
    )
