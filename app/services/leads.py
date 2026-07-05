import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.search import CachedLead, CachedSearch
from app.schemas.search import Business
from app.services import overpass
from app.services.filters import apply_filters
from app.services.osm_tags import normalize_query

logger = logging.getLogger(__name__)


@dataclass
class LeadResults:
    businesses: list[Business]
    cached: bool


async def get_leads(
    session: AsyncSession,
    query: str,
    city: str,
    country: str,
    limit: int,
    has_website: bool,
    has_phone: bool,
) -> LeadResults:
    """Return leads for a search, serving from cache when a fresh entry exists.

    The cache stores the full unfiltered result set per (query, city, country);
    limit and contact filters are applied on top so one cached row satisfies
    many different request shapes.
    """
    key = _CacheKey(
        query=normalize_query(query),
        city=normalize_query(city),
        country=normalize_query(country),
    )

    cached_row = await _get_fresh_cache(session, key)
    if cached_row is not None:
        businesses = [_to_business(lead) for lead in cached_row.leads]
        logger.info("Cache hit for %s (%d leads)", key, len(businesses))
        return LeadResults(apply_filters(businesses, has_website, has_phone, limit), True)

    logger.info("Cache miss for %s — querying provider", key)
    businesses = await overpass.fetch_businesses(query, city, country)
    await _store_cache(session, key, businesses)
    return LeadResults(apply_filters(businesses, has_website, has_phone, limit), False)


@dataclass(frozen=True)
class _CacheKey:
    query: str
    city: str
    country: str

    def __str__(self) -> str:
        return f"{self.query!r} in {self.city!r}, {self.country!r}"


async def _get_fresh_cache(
    session: AsyncSession, key: _CacheKey
) -> CachedSearch | None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=get_settings().cache_ttl_days)
    result = await session.execute(
        select(CachedSearch).where(
            CachedSearch.query == key.query,
            CachedSearch.city == key.city,
            CachedSearch.country == key.country,
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        return None
    if row.fetched_at < cutoff:
        # Stale: drop it so the caller re-fetches and repopulates.
        await session.delete(row)
        await session.commit()
        return None
    await session.refresh(row, attribute_names=["leads"])
    return row


async def _store_cache(
    session: AsyncSession, key: _CacheKey, businesses: list[Business]
) -> None:
    search = CachedSearch(
        query=key.query,
        city=key.city,
        country=key.country,
        result_count=len(businesses),
        leads=[_to_cached_lead(business) for business in businesses],
    )
    session.add(search)
    try:
        await session.commit()
    except IntegrityError:
        # A concurrent identical request won the race and inserted first;
        # discard ours and reuse theirs on the next lookup.
        await session.rollback()
        logger.info("Concurrent cache insert for %s — keeping existing row", key)


def _to_cached_lead(business: Business) -> CachedLead:
    return CachedLead(
        name=business.name,
        website=business.website,
        phone=business.phone,
        address=business.address,
        rating=business.rating,
        user_ratings_total=business.user_ratings_total,
        business_status=business.business_status,
        google_maps_url=business.google_maps_url,
        latitude=business.latitude,
        longitude=business.longitude,
    )


def _to_business(lead: CachedLead) -> Business:
    return Business(
        name=lead.name,
        website=lead.website,
        phone=lead.phone,
        address=lead.address,
        rating=lead.rating,
        user_ratings_total=lead.user_ratings_total,
        business_status=lead.business_status,
        google_maps_url=lead.google_maps_url,
        latitude=lead.latitude,
        longitude=lead.longitude,
    )
