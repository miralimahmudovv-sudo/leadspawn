from typing import Any

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class GoogleAuthError(Exception):
    pass


def verify_google_credential(credential: str, client_id: str) -> dict[str, Any]:
    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id
        )
    except ValueError as exc:
        raise GoogleAuthError("Invalid Google credential") from exc

    if not claims.get("sub") or not claims.get("email"):
        raise GoogleAuthError("Google credential is missing required claims")
    return claims
