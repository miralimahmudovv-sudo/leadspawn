import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_session
from app.main import app
from app.schemas.search import Business
from app.services import leads
from app.services.exceptions import LeadProviderError, LocationNotFoundError

VALID_BODY = {"query": "dentist", "city": "Berlin", "country": "Germany", "limit": 5}


async def override_session():
    yield None


@pytest.fixture
async def client():
    app.dependency_overrides[get_session] = override_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


async def test_search_returns_results_and_cached_flag(client, monkeypatch):
    async def fake_get_leads(**kwargs):
        return leads.LeadResults(
            [Business(name="Alpha", email="a@alpha.de")], cached=True
        )

    monkeypatch.setattr(leads, "get_leads", fake_get_leads)
    response = await client.post("/api/v1/search", json=VALID_BODY)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["cached"] is True
    assert data["results"][0]["email"] == "a@alpha.de"


async def test_search_unknown_location_returns_404(client, monkeypatch):
    async def fake_get_leads(**kwargs):
        raise LocationNotFoundError("Location not found: Nowhere, Atlantis")

    monkeypatch.setattr(leads, "get_leads", fake_get_leads)
    response = await client.post(
        "/api/v1/search", json={**VALID_BODY, "city": "Nowhere", "country": "Atlantis"}
    )
    assert response.status_code == 404


async def test_search_provider_failure_returns_generic_502(client, monkeypatch):
    async def fake_get_leads(**kwargs):
        raise LeadProviderError("Could not reach https://overpass-api.de: timeout")

    monkeypatch.setattr(leads, "get_leads", fake_get_leads)
    response = await client.post("/api/v1/search", json=VALID_BODY)
    assert response.status_code == 502
    assert "overpass-api.de" not in response.json()["detail"]


async def test_search_validates_limit_bounds(client):
    response = await client.post("/api/v1/search", json={**VALID_BODY, "limit": 500})
    assert response.status_code == 422


async def test_search_rejects_unsafe_query_characters(client):
    response = await client.post("/api/v1/search", json={**VALID_BODY, "query": 'a"];x'})
    assert response.status_code == 422
