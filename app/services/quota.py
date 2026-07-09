from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import SearchUsage, User

PLAN_LIMITS = {"anonymous": 3, "free": 10, "premium": 50}


def limit_for(user: User | None) -> tuple[str, int]:
    if user is None:
        return "anonymous", PLAN_LIMITS["anonymous"]
    plan = user.plan if user.plan in PLAN_LIMITS else "free"
    return plan, PLAN_LIMITS[plan]


def _today() -> object:
    return datetime.now(timezone.utc).date()


async def get_used(session: AsyncSession, subject: str) -> int:
    result = await session.execute(
        select(SearchUsage.count).where(
            SearchUsage.subject == subject, SearchUsage.day == _today()
        )
    )
    return result.scalar_one_or_none() or 0


async def increment(session: AsyncSession, subject: str) -> int:
    statement = (
        insert(SearchUsage)
        .values(subject=subject, day=_today(), count=1)
        .on_conflict_do_update(
            constraint="uq_usage_subject_day",
            set_={"count": SearchUsage.count + 1},
        )
        .returning(SearchUsage.count)
    )
    result = await session.execute(statement)
    await session.commit()
    return result.scalar_one()
