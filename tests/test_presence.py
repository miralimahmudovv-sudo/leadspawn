import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services import presence


@pytest.fixture(autouse=True)
def clean_presence():
    presence.reset()
    yield
    presence.reset()


def test_beat_counts_distinct_sessions():
    assert presence.beat("session-aaaa", now=100.0) == 1
    assert presence.beat("session-bbbb", now=101.0) == 2
    assert presence.beat("session-aaaa", now=102.0) == 2


def test_stale_sessions_are_pruned_after_ttl():
    presence.beat("session-aaaa", now=100.0)
    presence.beat("session-bbbb", now=110.0)
    assert presence.beat("session-cccc", now=100.0 + presence.PRESENCE_TTL_SECONDS + 1) == 2


async def test_presence_endpoint_returns_online_count():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        first = await client.post("/api/v1/presence", json={"session_id": "abcd-1234"})
        assert first.status_code == 200
        assert first.json() == {"online": 1}

        second = await client.post("/api/v1/presence", json={"session_id": "efgh-5678"})
        assert second.json() == {"online": 2}


async def test_presence_rejects_malformed_session_id():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/presence", json={"session_id": "x"})
        assert response.status_code == 422
        response = await client.post(
            "/api/v1/presence", json={"session_id": "bad session//id"}
        )
        assert response.status_code == 422
