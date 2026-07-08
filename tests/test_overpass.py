import httpx
import pytest
import respx

from app.services import overpass
from app.services.exceptions import LeadProviderError, LocationNotFoundError

BERLIN_PLACE = {
    "osm_type": "relation",
    "osm_id": 62422,
    "boundingbox": ["52.33", "52.67", "13.08", "13.76"],
}

NODE_ELEMENT = {
    "type": "node",
    "lat": 52.5,
    "lon": 13.4,
    "tags": {"name": "Dr. Smile", "phone": "+49 30 1", "website": "www.smile.de"},
}

WAY_ELEMENT = {
    "type": "way",
    "center": {"lat": 52.51, "lon": 13.41},
    "tags": {
        "name": "Praxis Nord",
        "contact:website": "https://praxis-nord.de",
        "contact:phone": "+49 30 2",
        "addr:street": "Hauptstraße",
        "addr:housenumber": "5",
        "addr:postcode": "10115",
        "addr:city": "Berlin",
    },
}

NAMELESS_ELEMENT = {"type": "node", "lat": 52.52, "lon": 13.42, "tags": {"amenity": "dentist"}}


def test_bbox_from_orders_south_west_north_east():
    assert overpass._bbox_from(BERLIN_PLACE) == "(52.33,13.08,52.67,13.76)"


def test_bbox_from_clips_oversized_areas_around_city_center():
    hamburg_like = {
        "boundingbox": ["53.39", "54.03", "8.10", "10.33"],
        "lat": "53.55",
        "lon": "10.00",
    }
    south, west, north, east = map(
        float, overpass._bbox_from(hamburg_like).strip("()").split(",")
    )
    assert north - south <= overpass.MAX_BBOX_SPAN_DEGREES + 1e-9
    assert east - west <= overpass.MAX_BBOX_SPAN_DEGREES + 1e-9
    assert south < 53.55 < north
    assert west < 10.00 < east


def test_build_query_uses_exact_tags_for_mapped_terms():
    query = overpass._build_overpass_query("dentist", "(1,2,3,4)", 150)
    assert 'nwr["amenity"="dentist"]["name"](1,2,3,4);' in query
    assert "out center 150;" in query


def test_build_query_falls_back_to_regex_for_unmapped_terms():
    query = overpass._build_overpass_query("kebab", "(1,2,3,4)", 150)
    assert 'nwr["cuisine"~"kebab",i]["name"](1,2,3,4);' in query


def test_parse_element_reads_node_coordinates_and_normalizes_url():
    business = overpass._parse_element(NODE_ELEMENT)
    assert business is not None
    assert business.latitude == 52.5
    assert business.website == "https://www.smile.de"


def test_parse_element_reads_way_center_and_contact_fallbacks():
    business = overpass._parse_element(WAY_ELEMENT)
    assert business is not None
    assert business.latitude == 52.51
    assert business.website == "https://praxis-nord.de"
    assert business.phone == "+49 30 2"
    assert business.address == "Hauptstraße 5, 10115, Berlin"


def test_parse_element_drops_nameless():
    assert overpass._parse_element(NAMELESS_ELEMENT) is None


def test_parse_and_dedup_removes_same_name_nearby():
    twin = {**NODE_ELEMENT, "lat": 52.5001, "lon": 13.4001}
    result = overpass._parse_and_dedup([NODE_ELEMENT, twin, WAY_ELEMENT, NAMELESS_ELEMENT])
    assert [b.name for b in result] == ["Dr. Smile", "Praxis Nord"]


def test_format_address_partial_tags():
    assert overpass._format_address({"addr:city": "Berlin"}) == "Berlin"
    assert overpass._format_address({}) is None


async def test_fetch_rejects_unsafe_query_characters():
    with pytest.raises(LeadProviderError):
        await overpass.fetch_businesses('dentist"];node', "Berlin", "Germany")


@respx.mock
async def test_fetch_happy_path():
    respx.get(overpass.NOMINATIM_URL).mock(
        return_value=httpx.Response(200, json=[BERLIN_PLACE])
    )
    for url in overpass.OVERPASS_URLS:
        respx.post(url).mock(
            return_value=httpx.Response(
                200, json={"elements": [NODE_ELEMENT, WAY_ELEMENT]}
            )
        )
    businesses = await overpass.fetch_businesses("dentist", "Berlin", "Germany")
    assert [b.name for b in businesses] == ["Dr. Smile", "Praxis Nord"]


@respx.mock
async def test_fetch_race_tolerates_partial_instance_failures():
    respx.get(overpass.NOMINATIM_URL).mock(
        return_value=httpx.Response(200, json=[BERLIN_PLACE])
    )
    respx.post(overpass.OVERPASS_URLS[0]).mock(
        return_value=httpx.Response(200, json={"elements": [NODE_ELEMENT]})
    )
    for url in overpass.OVERPASS_URLS[1:]:
        respx.post(url).mock(return_value=httpx.Response(504))
    businesses = await overpass.fetch_businesses("dentist", "Berlin", "Germany")
    assert len(businesses) == 1


@respx.mock
async def test_fetch_retries_a_second_round_after_full_failure(monkeypatch):
    monkeypatch.setattr(overpass, "OVERPASS_RETRY_PAUSE_SECONDS", 0)
    respx.get(overpass.NOMINATIM_URL).mock(
        return_value=httpx.Response(200, json=[BERLIN_PLACE])
    )
    respx.post(overpass.OVERPASS_URLS[0]).mock(
        side_effect=[
            httpx.Response(504),
            httpx.Response(200, json={"elements": [NODE_ELEMENT]}),
        ]
    )
    for url in overpass.OVERPASS_URLS[1:]:
        respx.post(url).mock(return_value=httpx.Response(504))
    businesses = await overpass.fetch_businesses("dentist", "Berlin", "Germany")
    assert len(businesses) == 1


@respx.mock
async def test_fetch_treats_empty_response_with_remark_as_error(monkeypatch):
    monkeypatch.setattr(overpass, "OVERPASS_RETRY_PAUSE_SECONDS", 0)
    respx.get(overpass.NOMINATIM_URL).mock(
        return_value=httpx.Response(200, json=[BERLIN_PLACE])
    )
    for url in overpass.OVERPASS_URLS:
        respx.post(url).mock(
            return_value=httpx.Response(
                200, json={"elements": [], "remark": "runtime error: timed out"}
            )
        )
    with pytest.raises(LeadProviderError):
        await overpass.fetch_businesses("dentist", "Berlin", "Germany")


@respx.mock
async def test_fetch_unknown_location_raises_not_found():
    respx.get(overpass.NOMINATIM_URL).mock(return_value=httpx.Response(200, json=[]))
    with pytest.raises(LocationNotFoundError):
        await overpass.fetch_businesses("dentist", "Nowhere", "Atlantis")
