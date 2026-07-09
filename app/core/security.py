import time

import jwt

from app.core.config import get_settings

SESSION_TTL_SECONDS = 60 * 60 * 24 * 30


def create_session_token(user_id: int) -> str:
    now = int(time.time())
    payload = {"sub": str(user_id), "iat": now, "exp": now + SESSION_TTL_SECONDS}
    return jwt.encode(payload, get_settings().jwt_secret, algorithm="HS256")


def decode_session_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
