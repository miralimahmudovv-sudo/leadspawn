from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_session_token
from app.db.session import get_session
from app.models.user import User


async def get_optional_user(
    session: AsyncSession = Depends(get_session),
    authorization: str | None = Header(default=None),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    user_id = decode_session_token(authorization.removeprefix("Bearer "))
    if user_id is None:
        return None
    return await session.get(User, user_id)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def usage_subject(user: User | None, request: Request) -> str:
    if user is not None:
        return f"user:{user.id}"
    return f"ip:{client_ip(request)}"
