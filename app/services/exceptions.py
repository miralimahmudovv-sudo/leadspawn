class LeadProviderError(Exception):
    """Raised when a lead data provider request fails."""


class LocationNotFoundError(LeadProviderError):
    """Raised when the requested city/country cannot be geocoded."""
