# Admin Panel — Trustee Commission Phase B — Monitoring, Exports & Ops Guide

**Audience**: Frontend (Akshay) — **Admin Panel** + Ops/DevOps
**Scope**: How the admin monitors any trustee's commissions, exports order/commission data, configures slabs, and the server-side wiring (Shiprocket webhook, Celery maturity, config).
**Auth**: **superuser only** unless noted.

> **Mental model.** Phase B accrues a 2-layer commission (AREA + REFERRAL) per paid order, holds it **pending** until delivery + 15 days, then matures it to **available**; returns reverse it. The customer/trustee-facing side is in `TRUSTEE_COMMISSION_PHASE_B_WEB_GUIDE.md`. This guide is the admin oversight + ops layer.

---

## 1. Monitor any trustee (admin view of the same dashboards)

The trustee dashboard endpoints are **superuser-polymorphic**: pass any trustee's `<id>` (instead of `me`) and a superuser gets that trustee's data.

| Method | Path | Returns |
|---|---|---|
| GET | `/api/trustee/<id>/dashboard/` | wallet (incl. `pending_balance`) + `commissions` block (pending / available_lifetime / reversed_lifetime / by_kind {area, referral}) |
| GET | `/api/trustee/<id>/commissions/` | per-entry ledger; filter `?status=pending`, `?kind=area` |
| GET | `/api/trustee/<id>/earnings-summary/` | balances + lifetime/this-month + `pending_commission` |
| GET | `/api/trustee/` | list all trustees (filter/search) |

Entry/dashboard shapes are identical to the Web guide §3 — the only difference is `<id>` vs `me` and the superuser permission.

> There's no separate "admin commissions" model API — admins reuse these per-trustee endpoints. For raw rows across all trustees, use Django admin (`CommissionEntry`) or the exports below.

## 2. Exports — `/api/admin/exports/`
Order exports now carry the dual-layer attribution columns.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/exports/orders.csv` | adds `area_trustee` + `referral_trustee` (referral codes) alongside legacy `referring_trustee`; supports the same date/state filters |
| GET | `/api/admin/exports/donations.{csv,pdf}` | unchanged (donations are 0% commission) |

## 3. Commission slab configuration
Two layers, by design:
- **Global defaults** (`.env`, rarely changed): `AREA_COMMISSION_PERCENT=15`, `REFERRAL_COMMISSION_PERCENT=5`, `COMMISSION_LOCK_DAYS=15`.
- **Per-state override** (hot-editable, no redeploy): `area_commission_percent` on each assignment via `POST/PATCH /api/territory/assignments/` — see **`TRUSTEE_COMMISSION_PHASE_A_ADMIN_GUIDE.md`** §3.

Each order **snapshots** the effective rate at creation, so editing a slab never rewrites historical accruals.

## 4. Ops / DevOps — required wiring

### 4.1 Migrate + seed (each env)
```bash
cd app
python manage.py makemigrations core && python manage.py migrate
python manage.py seed_commission_schedule    # daily maturity sweep (02:00 IST)
```

### 4.2 Celery must run
Maturity is a Celery **Beat** task `wallet.run_commission_maturity_sweep` (daily 02:00 IST). Ensure worker + beat are up (same systemd units as the horoscope cron — `scripts/systemd/`). Without beat, pending commission never matures.

### 4.3 Shiprocket webhook → the lock clock
Point Shiprocket at:
```
POST https://<host>/api/shiprocket/webhook
```
- Set `SHIPROCKET_WEBHOOK_TOKEN` in `.env` and the **same** value as the `x-api-key` header in the Shiprocket dashboard. Unset = processes unauthenticated (dev only) + logs a warning — **set it in prod**.
- **Delivered** → starts the 15-day lock (`matures_at = delivered + COMMISSION_LOCK_DAYS`). **RTO/Return/Cancelled** → reverses the order's pending commission. Always returns 200 (so Shiprocket won't retry-storm); unmatched orders are logged, not errored.

```bash
curl -X POST https://<host>/api/shiprocket/webhook \
  -H "Content-Type: application/json" -H "x-api-key: $SHIPROCKET_WEBHOOK_TOKEN" \
  -d '{"current_status":"DELIVERED","channel_order_id":"ORD-0001"}'
```

### 4.4 Config knobs (`.env`)
| Var | Default | Meaning |
|---|---|---|
| `AREA_COMMISSION_PERCENT` | `15.00` | Global default territory %. |
| `REFERRAL_COMMISSION_PERCENT` | `5.00` | Referral %. |
| `COMMISSION_LOCK_DAYS` | `15` | Days after delivery before commission matures. |
| `SHIPROCKET_WEBHOOK_TOKEN` | _(empty)_ | Shared secret for the webhook `x-api-key`. |

## 5. Money-movement model (for context)
100% is captured to the org Razorpay account; trustee 15/5% are **internal pending liabilities** that mature and are paid out via the existing **withdrawal** pipeline (manual now; RazorpayX-ready). No Razorpay Route split at capture — chosen so returns are a pure ledger reversal with no gateway clawback.
