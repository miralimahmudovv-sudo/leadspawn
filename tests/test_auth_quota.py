import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.db.session import get_session
from app.main import app
from app.models.user import User
from app.schemas.search import Business
from app.services import google_auth, leads, quota
from app.services.exceptions import LeadProviderError

VALID_BODY = {"query": "dentist", "city": "Berlin", "country": "Germany", "limit": 5}

FAKE_CLAIMS = {
    "sub": "google-sub-123",
    "email": "mirali@example.com",
    "name": "Mirali",
    "picture": "https://example.com/p.jpg",
}


@pytest.fixture
async def client(db_session):
    async def override_session():
        yield db_session

    app.dependency_overrides[get_session] = override_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def fake_search(monkeypatch):
    async def fake_get_leads(**kwargs):
        return leads.LeadResults([Business(name="Alpha")], cached=True)

    monkeypatch.setattr(leads, "get_leads", fake_get_leads)


@pytest.fixture
def google_configured(monkeypatch):
    monkeypatch.setattr(get_settings(), "google_client_id", "test-client-id")
    monkeypatch.setattr(
        google_auth, "verify_google_credential", lambda credential, client_id: FAKE_CLAIMS
    )


def test_plan_limits():
    assert quota.limit_for(None) == ("anonymous", 3)
    assert quota.limit_for(User(plan="free")) == ("free", 10)
    assert quota.limit_for(User(plan="premium")) == ("premium", 50)


async def test_anonymous_gets_three_searches_then_429(client, fake_search):
    for expected_used in (1, 2, 3):
        response = await client.post("/api/v1/search", json=VALID_BODY)
        assert response.status_code == 200
        assert response.json()["usage"] == {"used": expected_used, "limit": 3, "plan": "anonymous"}

    blocked = await client.post("/api/v1/search", json=VALID_BODY)
    assert blocked.status_code == 429
    assert blocked.json()["detail"]["code"] == "search_limit_reached"


async def test_failed_search_does_not_consume_quota(client, monkeypatch):
    async def failing_get_leads(**kwargs):
        raise LeadProviderError("down")

    monkeypatch.setattr(leads, "get_leads", failing_get_leads)
    response = await client.post("/api/v1/search", json=VALID_BODY)
    assert response.status_code == 502

    usage = await client.get("/api/v1/usage")
    assert usage.json()["used"] == 0


async def test_google_login_registers_user_and_signed_in_limit(
    client, fake_search, google_configured
):
    login = await client.post(
        "/api/v1/auth/google", json={"credential": "x" * 30}
    )
    assert login.status_code == 200
    token = login.json()["token"]
    assert login.json()["user"]["email"] == "mirali@example.com"
    assert login.json()["user"]["plan"] == "free"

    headers = {"Authorization": f"Bearer {token}"}
    me = await client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["usage"] == {"used": 0, "limit": 10, "plan": "free", "authenticated": True}

    search = await client.post("/api/v1/search", json=VALID_BODY, headers=headers)
    assert search.json()["usage"] == {"used": 1, "limit": 10, "plan": "free"}


async def test_login_twice_reuses_same_user(client, google_configured, db_session):
    first = await client.post("/api/v1/auth/google", json={"credential": "x" * 30})
    second = await client.post("/api/v1/auth/google", json={"credential": "x" * 30})
    assert first.status_code == second.status_code == 200

    from sqlalchemy import func, select

    count = (await db_session.execute(select(func.count(User.id)))).scalar_one()
    assert count == 1


async def test_premium_user_gets_50(client, fake_search, google_configured, db_session):
    login = await client.post("/api/v1/auth/google", json={"credential": "x" * 30})
    token = login.json()["token"]

    from sqlalchemy import update

    await db_session.execute(update(User).values(plan="premium"))
    await db_session.commit()

    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["usage"]["limit"] == 50
    assert me.json()["user"]["plan"] == "premium"


async def test_login_without_server_config_returns_503(client):
    response = await client.post("/api/v1/auth/google", json={"credential": "x" * 30})
    assert response.status_code == 503


async def test_invalid_token_treated_as_anonymous(client, fake_search):
    response = await client.post(
        "/api/v1/search", json=VALID_BODY, headers={"Authorization": "Bearer garbage"}
    )
    assert response.status_code == 200
    assert response.json()["usage"]["plan"] == "anonymous"


async def test_config_endpoint_exposes_client_id(client, google_configured):
    response = await client.get("/api/v1/config")
    assert response.json() == {"google_client_id": "test-client-id"}
