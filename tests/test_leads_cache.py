from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select

from app.models.search import CachedLead, CachedSearch
from app.schemas.search import Business
from app.services import leads

PROVIDER_RESULTS = [
    Business(name="Alpha", website="https://alpha.de", phone="+49 1", email="a@alpha.de"),
    Business(name="Beta", phone="+49 2"),
    Business(name="Gamma", website="https://gamma.de"),
]


@pytest.fixture
def fake_provider(monkeypatch):
    calls = {"count": 0}

    async def fetch(query: str, city: str, country: str) -> list[Business]:
        calls["count"] += 1
        return [business.model_copy() for business in PROVIDER_RESULTS]

    async def no_enrich(businesses: list[Business]) -> None:
        return None

    monkeypatch.setattr(leads.overpass, "fetch_businesses", fetch)
    monkeypatch.setattr(leads.enrich, "enrich_emails", no_enrich)
    return calls


async def test_miss_stores_full_set_then_hit_serves_from_db(db_session, fake_provider):
    first = await leads.get_leads(db_session, "Dentist", "Berlin", "Germany", 10, False, False, False)
    assert first.cached is False
    assert len(first.businesses) == 3

    second = await leads.get_leads(db_session, "dentist", " berlin ", "GERMANY", 10, False, False, False)
    assert second.cached is True
    assert fake_provider["count"] == 1

    stored = (await db_session.execute(select(func.count(CachedLead.id)))).scalar_one()
    assert stored == 3


async def test_filters_and_limit_apply_over_cached_set(db_session, fake_provider):
    await leads.get_leads(db_session, "dentist", "berlin", "germany", 10, False, False, False)

    phones = await leads.get_leads(db_session, "dentist", "berlin", "germany", 10, False, True, False)
    assert phones.cached is True
    assert [b.name for b in phones.businesses] == ["Alpha", "Beta"]

    emails = await leads.get_leads(db_session, "dentist", "berlin", "germany", 10, False, False, True)
    assert [b.name for b in emails.businesses] == ["Alpha"]

    limited = await leads.get_leads(db_session, "dentist", "berlin", "germany", 1, False, False, False)
    assert len(limited.businesses) == 1
    assert fake_provider["count"] == 1


async def test_stale_cache_is_refetched(db_session, fake_provider):
    stale = CachedSearch(
        query="dentist",
        city="berlin",
        country="germany",
        result_count=1,
        fetched_at=datetime.now(timezone.utc) - timedelta(days=31),
        leads=[CachedLead(name="Old Entry")],
    )
    db_session.add(stale)
    await db_session.commit()

    result = await leads.get_leads(db_session, "dentist", "berlin", "germany", 10, False, False, False)
    assert result.cached is False
    assert fake_provider["count"] == 1
    assert [b.name for b in result.businesses] == ["Alpha", "Beta", "Gamma"]


async def test_email_survives_cache_round_trip(db_session, fake_provider):
    await leads.get_leads(db_session, "dentist", "berlin", "germany", 10, False, False, False)
    cached = await leads.get_leads(db_session, "dentist", "berlin", "germany", 10, False, False, False)
    alpha = next(b for b in cached.businesses if b.name == "Alpha")
    assert alpha.email == "a@alpha.de"
    assert alpha.website == "https://alpha.de"
