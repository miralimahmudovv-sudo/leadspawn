from datetime import datetime, timedelta, timezone

from sqlalchemy import case, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import SearchUsage, User

PLAN_LIMITS = {"anonymous": 3, "free": 10, "premium": 50}
RESET_AFTER = timedelta(hours=24)


def limit_for(user: User | None) -> tuple[str, int]:
    if user is None:
        return "anonymous", PLAN_LIMITS["anonymous"]
    plan = user.plan if user.plan in PLAN_LIMITS else "free"
    return plan, PLAN_LIMITS[plan]


async def get_state(
    session: AsyncSession, subject: str
) -> tuple[int, datetime | None]:
    result = await session.execute(
        select(SearchUsage.count, SearchUsage.last_used_at).where(
            SearchUsage.subject == subject
        )
    )
    row = result.one_or_none()
    if row is None:
        return 0, None
    count, last_used_at = row
    resets_at = last_used_at + RESET_AFTER
    if resets_at <= datetime.now(timezone.utc):
        return 0, None
    return count, resets_at


async def increment(session: AsyncSession, subject: str) -> tuple[int, datetime]:
    now = datetime.now(timezone.utc)
    cutoff = now - RESET_AFTER
    statement = (
        insert(SearchUsage)
        .values(subject=subject, count=1, last_used_at=now)
        .on_conflict_do_update(
            index_elements=[SearchUsage.subject],
            set_={
                "count": case(
                    (SearchUsage.last_used_at <= cutoff, 1),
                    else_=SearchUsage.count + 1,
                ),
                "last_used_at": now,
            },
        )
        .returning(SearchUsage.count)
    )
    result = await session.execute(statement)
    await session.commit()
    return result.scalar_one(), now + RESET_AFTER
