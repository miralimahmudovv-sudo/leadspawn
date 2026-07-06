from app.services.osm_tags import (
    CONCEPT_ALIASES,
    TAG_MAPPINGS,
    normalize_query,
    tags_for_query,
)


def test_normalize_query_strips_lowers_and_collapses_whitespace():
    assert normalize_query("  Coffee   Shop  ") == "coffee shop"


def test_english_term_resolves_to_exact_tags():
    assert tags_for_query("dentist") == (("amenity", "dentist"), ("healthcare", "dentist"))


def test_english_plural_resolves_to_singular_mapping():
    assert tags_for_query("dentists") == tags_for_query("dentist")


def test_case_and_whitespace_insensitive():
    assert tags_for_query("  DENTIST ") == tags_for_query("dentist")


def test_german_alias_resolves():
    assert tags_for_query("Zahnarzt") == tags_for_query("dentist")


def test_russian_alias_resolves():
    assert tags_for_query("стоматолог") == tags_for_query("dentist")


def test_spanish_alias_resolves():
    assert tags_for_query("panadería") == tags_for_query("bakery")


def test_turkish_alias_resolves():
    assert tags_for_query("diş hekimi") == tags_for_query("dentist")


def test_unmapped_query_returns_none():
    assert tags_for_query("underwater basket weaving") is None


def test_every_alias_canonical_exists_in_tag_mappings():
    assert [c for c in CONCEPT_ALIASES if c not in TAG_MAPPINGS] == []


def test_aliases_are_normalized_and_unique_across_concepts():
    seen: dict[str, str] = {}
    for canonical, aliases in CONCEPT_ALIASES.items():
        for alias in aliases:
            assert alias == normalize_query(alias)
            assert alias not in TAG_MAPPINGS
            assert seen.get(alias, canonical) == canonical
            seen[alias] = canonical
