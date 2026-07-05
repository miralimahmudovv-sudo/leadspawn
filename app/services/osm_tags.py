import re

TagPairs = tuple[tuple[str, str], ...]

# User-friendly business terms mapped to exact OSM tags. Exact tag matches
# are faster and more precise than regex matching on public Overpass servers.
TAG_MAPPINGS: dict[str, TagPairs] = {
    "dentist": (("amenity", "dentist"), ("healthcare", "dentist")),
    "restaurant": (("amenity", "restaurant"),),
    "cafe": (("amenity", "cafe"),),
    "coffee shop": (("amenity", "cafe"),),
    "bar": (("amenity", "bar"),),
    "lawyer": (("office", "lawyer"),),
    "attorney": (("office", "lawyer"),),
    "notary": (("office", "notary"),),
    "accountant": (("office", "accountant"),),
    "insurance": (("office", "insurance"),),
    "bakery": (("shop", "bakery"),),
    "butcher": (("shop", "butcher"),),
    "florist": (("shop", "florist"),),
    "hairdresser": (("shop", "hairdresser"),),
    "barber": (("shop", "hairdresser"),),
    "beauty salon": (("shop", "beauty"),),
    "tattoo": (("shop", "tattoo"),),
    "optician": (("shop", "optician"),),
    "jeweler": (("shop", "jewelry"),),
    "electrician": (("craft", "electrician"),),
    "plumber": (("craft", "plumber"),),
    "carpenter": (("craft", "carpenter"),),
    "painter": (("craft", "painter"),),
    "photographer": (("craft", "photographer"), ("shop", "photo")),
    "architect": (("office", "architect"),),
    "real estate": (("office", "estate_agent"),),
    "real estate agent": (("office", "estate_agent"),),
    "real estate agency": (("office", "estate_agent"),),
    "estate agent": (("office", "estate_agent"),),
    "pharmacy": (("amenity", "pharmacy"), ("healthcare", "pharmacy")),
    "doctor": (("amenity", "doctors"), ("healthcare", "doctor")),
    "physiotherapist": (("healthcare", "physiotherapist"),),
    "hospital": (("amenity", "hospital"), ("healthcare", "hospital")),
    "hotel": (("tourism", "hotel"),),
    "hostel": (("tourism", "hostel"),),
    "guest house": (("tourism", "guest_house"),),
    "gym": (("leisure", "fitness_centre"),),
    "fitness": (("leisure", "fitness_centre"),),
    "fitness studio": (("leisure", "fitness_centre"),),
    "car repair": (("shop", "car_repair"),),
    "car mechanic": (("shop", "car_repair"),),
    "auto repair": (("shop", "car_repair"),),
    "car dealer": (("shop", "car"),),
    "car wash": (("amenity", "car_wash"),),
    "driving school": (("amenity", "driving_school"),),
    "veterinarian": (("amenity", "veterinary"),),
    "vet": (("amenity", "veterinary"),),
    "kindergarten": (("amenity", "kindergarten"),),
    "travel agency": (("shop", "travel_agency"),),
    "supermarket": (("shop", "supermarket"),),
    "web design": (("office", "it"),),
    "it company": (("office", "it"),),
    "software company": (("office", "it"),),
    "marketing agency": (("office", "advertising_agency"),),
    "advertising agency": (("office", "advertising_agency"),),
}


def normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", query.strip().lower())


def tags_for_query(query: str) -> TagPairs | None:
    """Return exact OSM tags for a query, or None when no mapping exists."""
    normalized = normalize_query(query)
    if normalized in TAG_MAPPINGS:
        return TAG_MAPPINGS[normalized]
    if normalized.endswith("s") and normalized[:-1] in TAG_MAPPINGS:
        return TAG_MAPPINGS[normalized[:-1]]
    return None
