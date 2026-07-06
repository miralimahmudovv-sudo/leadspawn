from app.schemas.search import Business
from app.services.filters import apply_filters


def make(name: str, website: str | None = None, phone: str | None = None, email: str | None = None) -> Business:
    return Business(name=name, website=website, phone=phone, email=email)


SAMPLE = [
    make("full", website="https://a.de", phone="+49 1", email="a@a.de"),
    make("site-only", website="https://b.de"),
    make("phone-only", phone="+49 2"),
    make("email-only", email="c@c.de"),
    make("bare"),
]


def test_no_filters_respects_limit():
    assert [b.name for b in apply_filters(SAMPLE, False, False, False, 3)] == [
        "full",
        "site-only",
        "phone-only",
    ]


def test_has_website_filter():
    assert [b.name for b in apply_filters(SAMPLE, True, False, False, 10)] == [
        "full",
        "site-only",
    ]


def test_has_phone_filter():
    assert [b.name for b in apply_filters(SAMPLE, False, True, False, 10)] == [
        "full",
        "phone-only",
    ]


def test_has_email_filter():
    assert [b.name for b in apply_filters(SAMPLE, False, False, True, 10)] == [
        "full",
        "email-only",
    ]


def test_combined_filters_require_all_fields():
    assert [b.name for b in apply_filters(SAMPLE, True, True, True, 10)] == ["full"]


def test_limit_applies_after_filtering():
    many = [make(f"b{i}", phone="+49") for i in range(10)] + [make("no-phone")]
    result = apply_filters(many, False, True, False, 4)
    assert len(result) == 4
    assert all(b.phone for b in result)


def test_empty_input_returns_empty():
    assert apply_filters([], True, True, True, 10) == []
