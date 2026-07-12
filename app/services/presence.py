import time

PRESENCE_TTL_SECONDS = 60.0

_sessions: dict[str, float] = {}


def beat(session_id: str, now: float | None = None) -> int:
    current = now if now is not None else time.monotonic()
    _sessions[session_id] = current
    stale = [key for key, seen in _sessions.items() if current - seen > PRESENCE_TTL_SECONDS]
    for key in stale:
        del _sessions[key]
    return len(_sessions)


def reset() -> None:
    _sessions.clear()
