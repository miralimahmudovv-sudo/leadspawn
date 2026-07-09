from pydantic import BaseModel, Field


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


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class MeResponse(BaseModel):
    user: UserOut
    usage: UsageOut


class AppConfigResponse(BaseModel):
    google_client_id: str
