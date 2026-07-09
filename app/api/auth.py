import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_user, usage_subject
from app.core.config import get_settings
from app.core.security import create_session_token
from app.db.session import get_session
from app.models.user import SearchHistory, User
from app.schemas.auth import (
    AppConfigResponse,
    AuthResponse,
    GoogleLoginRequest,
    HistoryItem,
    HistoryResponse,
    MeResponse,
    UsageOut,
    UserOut,
)
from app.services import google_auth, quota

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["auth"])


def _user_out(user: User) -> UserOut:
    return UserOut(email=user.email, name=user.name, picture=user.picture, plan=user.plan)


@router.get("/config", response_model=AppConfigResponse)
def app_config() -> AppConfigResponse:
    return AppConfigResponse(google_client_id=get_settings().google_client_id)


@router.post("/auth/google", response_model=AuthResponse)
async def google_login(
    request: GoogleLoginRequest, session: AsyncSession = Depends(get_session)
) -> AuthResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on the server",
        )

    try:
        claims = google_auth.verify_google_credential(
            request.credential, settings.google_client_id
        )
    except google_auth.GoogleAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credential"
        ) from exc

    result = await session.execute(
        select(User).where(User.google_sub == claims["sub"])
    )
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            google_sub=claims["sub"],
            email=claims["email"],
            name=claims.get("name"),
            picture=claims.get("picture"),
        )
        session.add(user)
        logger.info("New user registered: %s", claims["email"])
    else:
        user.email = claims["email"]
        user.name = claims.get("name")
        user.picture = claims.get("picture")
    await session.commit()
    await session.refresh(user)

    return AuthResponse(token=create_session_token(user.id), user=_user_out(user))


@router.get("/auth/me", response_model=MeResponse)
async def me(
    request: Request,
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> MeResponse:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")
    plan, limit = quota.limit_for(user)
    used, resets_at = await quota.get_state(session, usage_subject(user, request))
    return MeResponse(
        user=_user_out(user),
        usage=UsageOut(
            used=used, limit=limit, plan=plan, authenticated=True, resets_at=resets_at
        ),
    )


@router.get("/usage", response_model=UsageOut)
async def usage(
    request: Request,
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> UsageOut:
    plan, limit = quota.limit_for(user)
    used, resets_at = await quota.get_state(session, usage_subject(user, request))
    return UsageOut(
        used=used,
        limit=limit,
        plan=plan,
        authenticated=user is not None,
        resets_at=resets_at,
    )


@router.get("/history", response_model=HistoryResponse)
async def history(
    session: AsyncSession = Depends(get_session),
    user: User | None = Depends(get_optional_user),
) -> HistoryResponse:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")
    result = await session.execute(
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc())
        .limit(50)
    )
    items = [HistoryItem.model_validate(row) for row in result.scalars()]
    return HistoryResponse(items=items)
