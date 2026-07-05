from app.schemas.search import Business


def apply_filters(
    businesses: list[Business], has_website: bool, has_phone: bool, limit: int
) -> list[Business]:
    selected: list[Business] = []
    for business in businesses:
        if has_website and not business.website:
            continue
        if has_phone and not business.phone:
            continue
        selected.append(business)
        if len(selected) >= limit:
            break
    return selected
