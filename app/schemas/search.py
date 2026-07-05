from pydantic import BaseModel, ConfigDict, Field


class SearchRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(
        min_length=2,
        max_length=100,
        description="Business niche to search for, e.g. 'dentist'",
    )
    location: str = Field(
        min_length=2,
        max_length=100,
        description="City and country, e.g. 'Berlin, Germany'",
    )
    limit: int = Field(
        default=20,
        ge=1,
        le=50,
        description="Maximum number of businesses to return",
    )


class Business(BaseModel):
    name: str
    website: str | None = None
    phone: str | None = None
    address: str | None = None
    rating: float | None = None
    user_ratings_total: int | None = None
    business_status: str | None = None
    google_maps_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class SearchResponse(BaseModel):
    query: str
    location: str
    count: int
    results: list[Business]
