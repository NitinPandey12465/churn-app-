# Retention Engine — User Retention & Churn Prediction Platform

A live, deployable rebuild of
[`user-retention-churn-prediction`](https://github.com/NitinPandey12465/user-retention-churn-prediction)
— the end-to-end telco churn study (SQL → Python → scikit-learn/XGBoost → SHAP → Kaplan-Meier →
Power BI) turned into a production web product.

| Surface | What it does |
| --- | --- |
| `/` | Executive story: live KPIs, headline cohort, pipeline, ROI simulator, audience-specific views (business · HR · recruiter · engineer) |
| `/dashboard` | Command center: cohort heatmap, survival curves, revenue-exposure ladder, priority save-list |
| `/predict` | Real-time scorer: churn probability, exact SHAP waterfall, counterfactual levers, prescriptive playbook |
| `/insights` | Model lab: ROC/AUC, interactive threshold tuner + confusion matrix, global SHAP, Kaplan-Meier |
| `/customers` | Customer 360: filter/sort/paginate 7,043 scored accounts, per-account live explanation |
| `/hire` | Recruiter & HR pack: skills matrix, competency radar, delivery timeline, FAQ, contact form |

## The model

A logistic regression (the winning model in the study: AUC 0.84, recall 75.7%, CV F1 0.628 ± 0.021)
re-implemented in TypeScript so it scores server-side in ~1 ms. Because the model is linear, exact
Shapley values are available in closed form:

```
φⱼ(x) = βⱼ · (xⱼ − E[xⱼ])
```

so every prediction ships with its own SHAP waterfall — no sampling approximation.

Every statistic on the site (churn rates, cohort heatmap, ROC, F1 sweep, Kaplan-Meier curves,
revenue at risk) is recomputed from the rows currently in PostgreSQL on each request.

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | DB liveness probe |
| `GET /api/metrics` | KPIs + contract/internet/payment/tenure segments + heatmap + headline cohort |
| `GET /api/model?t=0.5` | ROC points, AUC, confusion matrix at threshold `t`, best-F1 threshold, global SHAP, survival curves |
| `GET /api/customers?...` | Paginated, filterable, sortable scored customer base |
| `POST /api/predict` | Score a profile → probability, SHAP drivers, counterfactuals, playbook (logged to `predictions`) |
| `POST /api/leads` | Recruiter / HR / business enquiries (persona-tagged) |
| `POST /api/seed` | Materialise the 7,043-customer dataset (`?force=1` to rebuild) |

## Local development

```bash
npm install
cp .env.example .env          # point DATABASE_URL at your Postgres
npx drizzle-kit push          # create tables
npm run dev                   # http://localhost:3000
```

The dataset self-seeds on first page load. To force a rebuild: `curl -X POST localhost:3000/api/seed?force=1`.

## Deploying to Vercel

1. **Push this repo to GitHub.**
2. **Create a Postgres database** — [Neon](https://neon.tech), Supabase or Vercel Postgres all work.
   Copy the pooled connection string (it must include `?sslmode=require`).
3. **Import the repo in Vercel** → New Project → Framework preset: *Next.js* (auto-detected).
4. **Add the environment variable** in Project Settings → Environment Variables:

   ```
   DATABASE_URL = postgresql://user:password@host/db?sslmode=require
   ```

5. **Deploy.** On the first request the app runs `drizzle` selects; if the `customers` table is
   empty it seeds itself with the 7,043-row population automatically.
6. **Create the tables once** (from your machine, pointing at the production URL):

   ```bash
   DATABASE_URL="postgresql://..." npx drizzle-kit push
   ```

   Then optionally warm the data: `curl -X POST https://<your-app>.vercel.app/api/seed`.

**Resilience:** if `DATABASE_URL` is missing or the database is unreachable, the app falls back to a
deterministic in-memory population so every page and chart still renders — the UI labels the data
source (`postgres` vs `in-memory`) honestly.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM · PostgreSQL · custom SVG chart
layer (no chart dependency) · zero third-party trackers.

---

Project by **Nitin Pandey** — B.Tech Production & Industrial Engineering, DTU · published NLP
researcher (ICAIT 2025, IEEE Xplore).
