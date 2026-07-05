from pydantic import BaseModel, ConfigDict, Field


class SearchRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(
        min_length=2,
        max_length=80,
        pattern=r"^[\w\s\-&'.]+$",
        description="Business niche to search for, e.g. 'dentist'",
    )
    city: str = Field(
        min_length=2,
        max_length=80,
        description="City name, e.g. 'Berlin'",
    )
    country: str = Field(
        min_length=2,
        max_length=80,
        description="Country name, e.g. 'Germany'",
    )
    limit: int = Field(
        default=20,
        ge=1,
        le=50,
        description="Maximum number of businesses to return",
    )
    has_website: bool = Field(
        default=False,
        description="When true, only return businesses that have a website",
    )
    has_phone: bool = Field(
        default=False,
        description="When true, only return businesses that have a phone number",
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
    city: str
    country: str
    count: int
    results: list[Business]
