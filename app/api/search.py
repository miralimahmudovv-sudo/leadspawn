import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_user, usage_subject
from app.db.session import get_session
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse, SearchUsageInfo
from app.services import leads, quota
from app.services.exceptions import LeadProviderError, LocationNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    http_request: Request,
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> SearchResponse:
    plan, limit = quota.limit_for(user)
    subject = usage_subject(user, http_request)
    used = await quota.get_used(session, subject)
    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "search_limit_reached", "used": used, "limit": limit, "plan": plan},
        )

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

    used = await quota.increment(session, subject)

    return SearchResponse(
        query=request.query,
        city=request.city,
        country=request.country,
        count=len(results.businesses),
        cached=results.cached,
        usage=SearchUsageInfo(used=used, limit=limit, plan=plan),
        results=results.businesses,
    )
