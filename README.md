# LeadSpawn

LeadSpawn helps freelancers and agencies discover potential clients.
Enter a business niche, city, and country — get back a list of companies
with contact details, ready to browse, filter, and export as CSV.

## Tech stack

**Backend:** Python 3.12, FastAPI, httpx, SQLAlchemy (async) + asyncpg,
Alembic, PostgreSQL
**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui-style
components, Framer Motion, react-i18next (EN/RU/DE/ES), sonner

## Data source

The MVP uses **OpenStreetMap** — free, no API key required:

- **Nominatim** geocodes the city/country to a bounding box.
- **Overpass API** finds businesses inside it.

Common business terms (dentist, bakery, lawyer, hotel, gym, car repair, …) are
translated to exact OSM tags via `app/services/osm_tags.py` for fast, precise
results; unmapped queries fall back to a generic tag-value match. To improve
coverage for a new niche, add an entry to `TAG_MAPPINGS`.

Trade-off: OSM is community-maintained, so phone/website coverage varies by city
and there are no ratings. The code is structured so switching to Google Places
(better data, paid) later only requires swapping the provider module in
`app/api/search.py` — a ready client already exists in
`app/services/google_places.py` (needs `GOOGLE_PLACES_API_KEY` in `.env`).

Please respect the public servers: Nominatim allows max 1 request/second and
both require a descriptive User-Agent (already set in `app/services/overpass.py`).

## Database & caching

Searches are cached in **PostgreSQL**: the full result set for a
`(query, city, country)` is stored once, and each request applies its
`limit`/filters on top. A repeat search returns from the database in
milliseconds instead of waiting 5–35 s on the public OSM servers. Cached
entries expire after `CACHE_TTL_DAYS` (default 30) and are then re-fetched.

One-time setup (PostgreSQL must be installed and running on port 5432):

```powershell
# Create the database (adjust user if needed)
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE leadspawn"
```

Set `DATABASE_URL` in `.env` (see `.env.example`), then apply migrations:

```powershell
.venv\Scripts\alembic upgrade head
```

Schema changes: edit the models in `app/models/`, then
`alembic revision --autogenerate -m "…"` and `alembic upgrade head`.

## Local development

Backend (from the repo root):

```powershell
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\alembic upgrade head
.venv\Scripts\uvicorn app.main:app --reload
```

- http://127.0.0.1:8000/health — health check
- http://127.0.0.1:8000/docs — interactive API docs

Frontend (requires Node 20+; pnpm via corepack):

```powershell
cd frontend
corepack pnpm install
corepack pnpm dev
```

- http://localhost:5173 — the app (dev server proxies `/api` to port 8000)

The frontend supports light/dark themes, four languages (globe menu),
card/table result views, and CSV export. New export targets (e.g. Google
Sheets) register in `frontend/src/lib/export.ts`; new languages are one
JSON file in `frontend/src/i18n/locales/` plus one entry in `LANGUAGES`.

## API

### POST /api/v1/search

```json
{
  "query": "dentist",
  "city": "Berlin",
  "country": "Germany",
  "limit": 20,
  "has_website": false,
  "has_phone": false
}
```

`limit` accepts 1–50 (default 20). `has_website` / `has_phone` are optional and,
when true, only return businesses that have that contact field. Results are
deduplicated, always named, and include address, website, phone (when available
in OpenStreetMap), and coordinates. The response includes `cached: true` when
served from the database rather than freshly fetched.

CSV export uses a `;` delimiter with an Excel `sep=;` hint so the file opens
into columns in Excel across locales (a plain comma file appears as a single
column in locales that use `;` as the list separator).
