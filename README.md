# LeadSpawn

LeadSpawn helps freelancers and agencies discover potential clients.
Enter a business niche, city, and country — get back a list of companies
with contact details, ratings, an AI-generated summary, and CSV export.

## Tech stack

- Python 3.12, FastAPI
- PostgreSQL + SQLAlchemy (planned)
- Google Places API as the lead data provider (planned)

## Google Places API setup

The search endpoint uses the **Places API (New)**. To get a key:

1. Go to https://console.cloud.google.com/ and create a project (e.g. `leadspawn`).
2. Enable billing for the project (required by Google, includes a monthly free usage tier).
3. In **APIs & Services → Library**, search for **Places API (New)** and enable it.
   Make sure it is the "(New)" one — the legacy Places API uses different endpoints.
4. In **APIs & Services → Credentials**, create an **API key**.
5. Restrict the key (recommended): under *API restrictions*, allow only **Places API (New)**.
6. Put the key in your `.env` file as `GOOGLE_PLACES_API_KEY`.

Note on cost: requests that return phone numbers and websites bill under Google's
higher Text Search SKU tier. Fine for development volumes; check current pricing
at https://mapsplatform.google.com/pricing/ before launching.

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
  "location": "Berlin, Germany",
  "limit": 20
}
```

`limit` accepts 1–50 (default 20). Returns businesses with name, website, phone,
address, rating, review count, business status, Google Maps URL, and coordinates.
