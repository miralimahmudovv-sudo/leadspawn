from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CachedSearch(Base):
    __tablename__ = "cached_searches"
    __table_args__ = (
        UniqueConstraint("query", "city", "country", name="uq_cached_search_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Normalized (lowercased, whitespace-collapsed) cache key components.
    query: Mapped[str] = mapped_column(String(120), index=True)
    city: Mapped[str] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(120))
    result_count: Mapped[int] = mapped_column(Integer, default=0)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    leads: Mapped[list["CachedLead"]] = relationship(
        back_populates="search",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CachedLead(Base):
    __tablename__ = "cached_leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    search_id: Mapped[int] = mapped_column(
        ForeignKey("cached_searches.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    website: Mapped[str | None] = mapped_column(String(500))
    phone: Mapped[str | None] = mapped_column(String(64))
    address: Mapped[str | None] = mapped_column(String(500))
    rating: Mapped[float | None] = mapped_column(Float)
    user_ratings_total: Mapped[int | None] = mapped_column(Integer)
    business_status: Mapped[str | None] = mapped_column(String(64))
    google_maps_url: Mapped[str | None] = mapped_column(String(500))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    search: Mapped[CachedSearch] = relationship(back_populates="leads")
