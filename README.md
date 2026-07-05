# LeadSpawn

LeadSpawn helps freelancers and agencies discover potential clients.
Enter a business niche, city, and country — get back a list of companies
with contact details, ratings, an AI-generated summary, and CSV export.

## Tech stack

- Python 3.12, FastAPI
- PostgreSQL + SQLAlchemy (planned)
- Google Places API as the lead data provider (planned)

## Data source

The MVP uses **OpenStreetMap** — free, no API key required:

- **Nominatim** geocodes the city/country to a search area.
- **Overpass API** finds businesses inside that area.

Trade-off: OSM is community-maintained, so phone/website coverage varies by city
and there are no ratings. The code is structured so switching to Google Places
(better data, paid) later only requires swapping the provider module in
`app/api/search.py` — a ready client already exists in
`app/services/google_places.py` (needs `GOOGLE_PLACES_API_KEY` in `.env`).

Please respect the public servers: Nominatim allows max 1 request/second and
both require a descriptive User-Agent (already set in `app/services/overpass.py`).

## Local development

```powershell
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\uvicorn app.main:app --reload
```

Then open:

- http://127.0.0.1:8000/health — health check
- http://127.0.0.1:8000/docs — interactive API docs

## API

### POST /api/v1/search

```json
{
  "query": "dentist",
  "city": "Berlin",
  "country": "Germany",
  "limit": 20
}
```

`limit` accepts 1–50 (default 20). Returns businesses with name, address,
website and phone (when available in OpenStreetMap), and coordinates.
