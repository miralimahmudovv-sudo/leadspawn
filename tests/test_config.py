from app.core.config import Settings


def test_plain_postgresql_scheme_is_rewritten_to_asyncpg():
    settings = Settings(database_url="postgresql://u:p@host:5432/db")
    assert settings.database_url == "postgresql+asyncpg://u:p@host:5432/db"


def test_heroku_style_postgres_scheme_is_rewritten():
    settings = Settings(database_url="postgres://u:p@host:5432/db")
    assert settings.database_url == "postgresql+asyncpg://u:p@host:5432/db"


def test_asyncpg_url_is_left_untouched():
    url = "postgresql+asyncpg://u:p@host:5432/db"
    assert Settings(database_url=url).database_url == url
