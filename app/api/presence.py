from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services import presence

router = APIRouter(prefix="/api/v1", tags=["presence"])


class PresenceRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=64, pattern=r"^[\w-]+$")


class PresenceResponse(BaseModel):
    online: int


@router.post("/presence", response_model=PresenceResponse)
def heartbeat(request: PresenceRequest) -> PresenceResponse:
    return PresenceResponse(online=presence.beat(request.session_id))
