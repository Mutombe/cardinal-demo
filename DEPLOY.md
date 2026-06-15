# Cardinal Properties — Deployment & CI/CD

Monorepo:
- `erp/backend` — Django + DRF API (the ERP + trust accounting)
- `erp/frontend` — ERP admin app (login, dashboards, CMS)
- `.` (repo root) — public marketing website

## CI/CD at a glance
1. **Push to `main`** →
2. **GitHub Actions** (`.github/workflows/ci.yml`) builds both frontends + runs Django checks, and
3. **Render** auto-deploys the three services from `render.yaml`.

So day-to-day you just `git push` and Render redeploys.

---

## One-time Render setup (Blueprint)
1. Render Dashboard → **New → Blueprint** → connect `github.com/Mutombe/cardinal-demo`.
2. Render reads `render.yaml` and creates three services: `cardinal-backend`, `cardinal-erp`, `cardinal-web`.
3. Fill the `sync: false` secrets when prompted (below), then **Apply**.

### `cardinal-backend` env vars to set
| Key | Value |
|-----|-------|
| `DATABASE_URL` | The Neon **UNPOOLED** connection string (`...aqs0w200.c-8...`, `sslmode=require`). Unpooled is required — the pooler rejects the `search_path` option. |
| `CORS_ALLOWED_ORIGINS` | `https://cardinal-web.onrender.com,https://cardinal-erp.onrender.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://cardinal-web.onrender.com,https://cardinal-erp.onrender.com` |
| `AWS_ACCESS_KEY_ID` | DigitalOcean Spaces key |
| `AWS_SECRET_ACCESS_KEY` | DigitalOcean Spaces secret |
| `ANTHROPIC_API_KEY` | optional |

`DB_SCHEMA=cardinal`, `AWS_STORAGE_BUCKET_NAME=cardinal`, `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME=sfo3`, `SECRET_KEY` and `ALLOWED_HOSTS` are already set in `render.yaml`.

> The Neon DB already has the schema + seeded data, so the first deploy's
> `migrate` is a no-op and the app comes up populated.

---

## DigitalOcean Spaces (media)
`django-storages` is already wired (`erp/backend/config/settings/base.py`). When the
`AWS_*` env vars are present, uploaded media is stored in the `cardinal` Space.

Bucket: `cardinal` · Region/endpoint: `sfo3` / `https://sfo3.digitaloceanspaces.com`.

CLI (already authenticated locally as the `do-tor1` profile):
```bash
aws --profile do-tor1 s3 ls s3://cardinal --endpoint-url https://sfo3.digitaloceanspaces.com
```
Enable the Space's CDN in the DO console to use
`cardinal.sfo3.cdn.digitaloceanspaces.com` (already set as `AWS_S3_CUSTOM_DOMAIN`).

> ⚠️ **Security:** the Spaces keys were shared in plaintext — rotate them in the
> DigitalOcean console (API → Spaces Keys) and update `AWS_*` on Render. Never
> commit keys; `.env` is gitignored.

---

## Local development
```bash
# backend
cd erp/backend && .venv/Scripts/python manage.py runserver 127.0.0.1:8000
# ERP app
cd erp/frontend && npm run dev      # http://localhost:5173
# public site
npm run dev                          # http://localhost:5174
```

## Re-seeding demo data (idempotent)
```bash
cd erp/backend
python manage.py seed_development_coa          # chart of accounts
python manage.py seed_public_developments       # developments/stands/inquiries from the website
#   add --reset to wipe seeded developments first
```
