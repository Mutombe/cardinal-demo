# Cardinal ERP — Transformation Spec

Turning **Parameter** (multi-tenant real-estate *property-management + trust-accounting* SaaS) into a **single-tenant Property Development ERP** for Cardinal Properties — by reusing the mature accounting/infra spine and replacing the business layer.

> Source product (`documents/parameter`) is left untouched. Its code was **copied** into `cardinal-demo/erp/` (`backend/`, `frontend/`) and is transformed here.

---

## 1. Strategy

- **Single customer = Cardinal.** Multi-tenancy (`django-tenants`, schema-per-company) is **removed** → one Postgres `public` schema on **Neon**.
- **Keep the spine, replace the domain.** The double-entry GL, journals, subsidiary ledgers, multi-currency, commission/VAT split, bank rec, auth/RBAC, audit, notifications, imports, soft-delete, and the entire React UI kit are reused. Only the masterfile/billing **business layer + terminology + dashboards** change.
- **Additive over rename.** Rather than risky in-place renames across the whole codebase, the new domain is added as a thin layer on the existing accounting engine; legacy rental code is retired incrementally.
- Core object shift: **Stand → Purchase Agreement → Installment Plan** is the spine of the new domain. Once a Purchase Agreement exists, everything downstream is the existing accounting.

---

## 2. Already done (this pass)

- ✅ Copied `parameter/backend` + `parameter/frontend` → `erp/` (no node_modules/venv/.git/media).
- ✅ **De-tenanted** the backend:
  - `config/settings/base.py`: single `INSTALLED_APPS` (dropped `django_tenants`, `apps.tenants`); removed `TENANT_MODEL`/`TENANT_DOMAIN_MODEL`/`PUBLIC_SCHEMA_*`, tenant middleware, `PUBLIC_SCHEMA_URLCONF`, `DATABASE_ROUTERS`.
  - DB engine `django_tenants.postgresql_backend` → `django.db.backends.postgresql`, parsed from `DATABASE_URL` (Neon, `sslmode=require`).
  - `config/urls.py`: removed `api/tenants/` include.
  - `apps/accounts/views.py`: login no longer resolves tenant/schema.
  - `requirements.txt`: removed `django-tenants`.
  - Added `backend/django_tenants/` **no-op shim** (`utils.schema_context`/`tenant_context`/`get_tenant_model`) so the ~20 legacy call-sites import + behave as single-schema no-ops; removed incrementally (Phase 0).
  - `.env` repointed to Cardinal's Neon DB (gitignored).

---

## 3. Entity transformation map

| Parameter (now) | Cardinal ERP | Source file | Action |
|---|---|---|---|
| `Landlord` | **Developer** | `apps/masterfile/models.py` | rename/repurpose (bank/registration fields exist) |
| `Property` (mgmt_type, `unit_definition`→auto-gen) | **Development Project** | `apps/masterfile/models.py` | repurpose; unit auto-gen → **stand generation** |
| `Unit` | **Stand** (size, price, GPS, status) | `apps/masterfile/models.py` | add statuses `Reserved`, `Under Transfer`, `Cancelled` |
| `RentalTenant` | **Buyer** (National ID, passport, next-of-kin) | `apps/masterfile/models.py` | repurpose |
| `LeaseAgreement` | **Purchase Agreement** (the new heart) | `apps/masterfile/models.py` | new terms: sale price, deposit, installment term, agency/agent |
| `Invoice` + `post_to_ledger()` | **Installment notice / stand payment due** | `apps/billing/models.py` | reuse GL posting |
| `Receipt` + `post_to_ledger()` | **Stand payment** | `apps/billing/models.py` | reuse (Dr Cash / Cr AR identical) |
| `Expense` | **Project expense** | `apps/billing/models.py` | link to Development |
| `Levy` / `LeaseType=levy` | **Optional development charges** | — | keep as optional |
| `PropertyManager` | **Project Administrator** | `apps/masterfile/models.py` | rename |
| `LatePenaltyConfig` | **Installment arrears penalty** | `apps/billing/models.py` | reuse as-is |

**Kept verbatim (the spine):** `apps/accounting/*` (`ChartOfAccount`, `Journal/JournalEntry/GeneralLedger`, `SubsidiaryAccount/SubsidiaryTransaction`, `IncomeType`, `ExpenseCategory`, `BankAccount`, bank rec, `FiscalPeriod`, `ExchangeRate`), `apps/accounts` (auth/RBAC), `notifications`, `imports`, `search`, `trash`, audit.

---

## 4. Genuinely new entities (don't exist today)

### 4.1 Ownership Profile (flexible 1↔N owners)
Today `Buyer↔Agreement` is effectively 1:1. The brief requires editable joint ownership without redesign.

```
OwnershipProfile
  id, agreement (1:1 → PurchaseAgreement), created_at
OwnerShare
  profile (FK→OwnershipProfile), buyer (FK→Buyer), percentage (Decimal), is_primary
  # constraint: shares per profile sum to 100
```
Single owner = one `OwnerShare @ 100%`. Add/remove `OwnerShare` rows to convert joint↔single — no schema change.

### 4.2 Agency + Sales Agent + Sale Commission
```
Agency        name, registration, contact, commission_structure (rate/tiers), status
SalesAgent    name, agency (FK), contact, is_active
SaleCommission  agreement (FK), agency (FK), agent (FK), rate, amount,
                status (pending/approved/paid), gl_journal (FK→Journal)
```
Reuse the existing commission **GL split mechanics** (`Receipt._calculate_commission`, `PropertyIncomeCommission` resolution); the trigger changes from *rent collected* → *sale price / payment milestones*.

### 4.3 Installment Plan generator
New service (mirrors `apps/billing/services.py:generate_monthly_invoices` but one-shot):
```
generate_installment_schedule(agreement):
    balance = sale_price - deposit
    per = balance / term_months
    → create N Installment rows (due dates monthly from start), each postable like an Invoice
```

### 4.4 Sales pipeline + dashboards
Stand stage machine: `Available → Reserved → Deposit Paid → Agreement Signed → Installments Active → Fully Paid → Transfer Ready → Completed`.
Dashboards (Recharts + existing `StatsCard`): **Executive** (projects/stands/available/reserved/sold/revenue/arrears/top agencies), **Agency** (assigned projects, inventory, sales, commissions), **Finance** (revenue, outstanding installments, arrears, commission liabilities).

---

## 5. Accounting mapping (reuse the engine)
- **Income Types** (`apps/accounting`): add *Stand Sale Revenue*, *Reservation Fee*, *Commission on Sale*.
- **Expense Categories**: add *Site Acquisition*, *Site Servicing (roads/water/sewer)*, *Construction*, *Legal & Registration*, *Marketing & Commission*.
- **Subsidiary ledgers**: Buyer sub-account (what they owe), Developer sub-account (proceeds), Agency sub-account (commission payable) — reuse `SubsidiaryAccount.seed_for_*` pattern.
- Rename GL label "Landlord Trust Payable" → "Developer Proceeds Payable" (cosmetic; account stays).
- Payment posting (`Receipt.post_to_ledger`) is reused unchanged: Dr Cash/Bank, Cr AR; allocate developer proceeds + agency commission split.

---

## 6. Frontend transformation (`erp/frontend/src`)
Reuse `Layout`, `DataTable`, `Modal`, `StatsCard`, charts, `services/api.ts` pattern, ref-based forms.
- Routes/pages: `Masterfile/Properties→Developments`, `Units→Stands`, `Tenants→Buyers`, `Leases→PurchaseAgreements`; `Billing/Invoices→Installments`, `Receipts→Payments`.
- Forms: `PropertyForm→DevelopmentForm`, `UnitForm→StandForm`, `TenantForm→BuyerForm`, `LeaseForm→PurchaseAgreementForm` (+ OwnershipProfile editor, agency/agent pickers, installment-term + auto schedule preview).
- Portals: `LandlordPortal→Developer Portal`, `TenantPortal→Buyer Portal` (agreement, payment history, statements, docs).
- `CommissionGrid` → agency commission (% of sale price, tiered by pipeline stage).

---

## 7. Website integration (the public site is already built)
`cardinal-demo` public site = the brief's **Website Integration** pillar:
- Buyer browses developments/stands → reserves → fills form + signs.
- That submission → **CRM lead / draft Purchase Agreement** in the ERP; availability map reads stand `status` from the ERP.
- The ERP's stand `geometry`/availability feeds the public site's site-plan/satellite map (already consuming `/api/developments/<slug>/stands.json`).

---

## 8. Phased plan

- **Phase 0 — De-tenant & boot (in progress):** single-tenant on Neon, backend installs + migrates + serves; create Cardinal superuser; seed chart of accounts. Then incrementally delete dead tenant code paths + the shim.
- **Phase 1 — Domain core:** Developer, Development, Stand, Buyer, PurchaseAgreement, **OwnershipProfile/OwnerShare** models + APIs (reuse accounting engine).
- **Phase 2 — Payments:** Installment Plan generator; reuse Invoice/Receipt posting; arrears.
- **Phase 3 — Agencies & commission:** Agency/Agent + SaleCommission + GL split; commission dashboards.
- **Phase 4 — Pipeline & dashboards:** stand stage machine; Executive/Agency/Finance dashboards.
- **Phase 5 — Frontend:** transform pages/forms/portals; document automation (agreements, statements, receipts via existing `html2pdf`).
- **Phase 6 — Public-site ↔ ERP wiring:** reservations → leads/agreements; live availability feed.

---

## 9. Risks / decisions
- **Dead tenant code:** ~20 call-sites use `schema_context`/`connection.schema_name` (mostly tasks/management commands). The shim keeps them importing; runtime calls to `connection.schema_name` (e.g. some `masterfile/views.py`, `mixins.py`) must be de-tenanted before those endpoints are used. Tracked for Phase 0 cleanup.
- **Migrations:** start fresh on Neon (`migrate`); the old `apps/tenants` migrations are excluded (app removed).
- **Secrets:** `.env` carried Parameter's Anthropic/S3/email keys — rotate/replace for production.
- **Naming:** "tenant" is overloaded — django-tenants *tenant* (company, removed) vs `RentalTenant` (renter → **Buyer**). Don't conflate.
