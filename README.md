# LeadSpawn

LeadSpawn helps freelancers and agencies discover potential clients.
Enter a business niche, city, and country — get back a list of companies
with contact details, ratings, an AI-generated summary, and CSV export.

## Tech stack

- Python 3.12, FastAPI
- PostgreSQL + SQLAlchemy (planned)
- Google Places API as the lead data provider (planned)

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
