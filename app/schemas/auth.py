from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.search import Business


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=20)


class UserOut(BaseModel):
    id: int
    email: str
    name: str | None = None
    picture: str | None = None
    plan: str


class UsageOut(BaseModel):
    used: int
    limit: int
    plan: str
    authenticated: bool
    resets_at: datetime | None = None


class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    query: str
    city: str
    country: str
    result_count: int
    created_at: datetime


class HistoryResponse(BaseModel):
    items: list[HistoryItem]


class HistoryDetail(BaseModel):
    id: int
    query: str
    city: str
    country: str
    created_at: datetime
    leads: list[Business]


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class MeResponse(BaseModel):
    user: UserOut
    usage: UsageOut


class AppConfigResponse(BaseModel):
    google_client_id: str
