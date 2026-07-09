from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=20)


class UserOut(BaseModel):
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


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class MeResponse(BaseModel):
    user: UserOut
    usage: UsageOut


class AppConfigResponse(BaseModel):
    google_client_id: str
