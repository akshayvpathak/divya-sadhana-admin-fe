# Trustee, Territory & Referral Commission — Implementation Plan

**Status**: DRAFT FOR REVIEW — no code until Bhargav signs off.
**Author**: Backend (senior review)
**Scope source**: Call notes (Bhargav + Akshay + Vijaybhai) + `Vijaybhai-Website-Quotation.txt` + current codebase.
**Last updated**: 2026-06-20

---

## 0. TL;DR — what this changes

The current system already ships a **single-trustee, signup-time referral** commission model:
`User.referring_trustee` → snapshot onto `Order.referring_trustee` + `commission_percent_snapshot` → credit **immediately and fully** to a flat wallet `balance` on payment capture.

The agreed flow needs a fundamentally richer model:

1. **Two independent commission layers per order** — *Territory* (15%, by shipping pincode→state→area trustee) **stacked** with *Referral* (5%, by `?ref=` cookie). Today there is only one layer.
2. **Cookie-based, per-order referral** captured at checkout — not signup-time-sticky.
3. **Pending → Available lifecycle** with a **15-day lock that starts at *delivery***, not at payment. Today commission is instantly spendable.
4. **Shipping pincode capture + real address** at checkout. Today the checkout takes only `cart_id`/`notes`/`wallet_amount` and the Shiprocket address is **hardcoded** (`400001 / Mumbai`).
5. **Shiprocket delivery + return webhooks** to drive the lock clock and auto-reversals. Today only `create_order` + AWB tracking exist — **no webhook**.
6. **Donations = 0% commission** (legally ring-fenced). Today `credit_for_donation` is wired and must be disabled.
7. **Self-referral guard** + several anti-fraud/edge rules. Not present today.

This is an evolution of the existing wallet/withdrawal/commission stack, **not** a rewrite — the `Wallet`, `WalletTransaction`, `WithdrawalRequest`, idempotency constraints, and notification plumbing are reused.

---

## 1. Gap analysis (current vs. required)

| # | Requirement | Today | Gap / action |
|---|---|---|---|
| 1 | Territory layer: pincode → state → area trustee (15%) | ❌ none | New `State`/assignment model + pincode resolver + capture shipping pincode |
| 2 | Referral layer: `?ref=` cookie at checkout (5%) | 🟡 signup-sticky single referral | Per-order referral resolved from checkout payload/cookie |
| 3 | Stacking (3 scenarios) | ❌ single layer | New split engine computing AREA + REFERRAL entries |
| 4 | Pending → Available, 15-day lock **post-delivery** | ❌ instant to `balance` | New `CommissionEntry` lifecycle + `Wallet.pending_balance` + maturity job |
| 5 | Shipping address + pincode capture | ❌ hardcoded | Add shipping snapshot to checkout + `Order`; feed Shiprocket |
| 6 | Shiprocket **delivered**/return webhook | ❌ | New webhook endpoint → set `delivered_at`, schedule maturity / reverse |
| 7 | Donations 0% commission | 🟡 credited | Disable donation commission path |
| 8 | Self-referral guard | ❌ | Guard in split engine |
| 9 | Withdrawals draw from **available only** | 🟡 draws from flat `balance` | Gate on matured/available balance |
| 10 | Admin-configurable slabs (15/5/lock-days) | 🟡 per-trustee `commission_percent` only | Global + per-state config, snapshotted per order |
| 11 | Razorpay money movement (80/85% to org) | 🟡 100% capture + manual payout | Confirm model (recommend ledger, see §6) |

---

## 2. Target architecture (data model)

> Models live in `app/core/models/<app>/models.py`, re-exported from `core/models/__init__.py` (project rule). All extend `BaseModel` (UUID PK, soft-delete, timestamps).

### 2.1 Territory mapping — `trustee` app

**`State`** (new) — canonical state list (single source of truth; avoids free-text drift).
- `name` (unique), `code` (e.g. `MH`), `is_active`.

**`TrusteeStateAssignment`** (new) — 11 trustees ↔ 14–15 states (one trustee may own several states; one state has exactly one **active** area trustee).
- `trustee` FK, `state` FK, `area_commission_percent` (nullable → falls back to global default), `is_active`.
- Constraint: **partial unique** on `state` where `is_active=True` → a state can't have two active area trustees.

**`PincodeStateMap`** (new) — authoritative pincode → state resolution (Q2 confirmed).
- `pincode` (6-digit, indexed, unique) + `state` FK (+ optional `district`). Resolver: **exact 6-digit match first**, then 3-digit-prefix fallback row for unseen pincodes.
- Seeded from a free static dataset via a management command (see §8) — **no runtime/external API on the checkout path**. **First-digit zones are too coarse** (zone 3 = Rajasthan *and* Gujarat; zone 4 = MH/MP/CG/Goa), which is why we seed the full table rather than deriving from `pincode[0]`.

> Keep `Trustee.state`/`district` (free-text) for display, but **attribution uses `TrusteeStateAssignment` only**.

### 2.2 Order attribution — `orders` app

Add to `Order`:
- `area_trustee` FK (nullable, `SET_NULL`) + `area_commission_percent_snapshot`.
- `referral_trustee` FK (nullable, `SET_NULL`) + `referral_commission_percent_snapshot`.
- Shipping snapshot: `shipping_name`, `shipping_phone`, `shipping_line1`, `shipping_line2`, `shipping_city`, `shipping_state` (FK or text), `shipping_pincode`, `shipping_country`.
- `delivered_at` (set by Shiprocket webhook), `is_returned` + `returned_at`.

> **Migration of `referring_trustee`**: keep the column for back-compat/history, stop writing to it for new orders (or repoint reads). New reads use `area_trustee`/`referral_trustee`. Reports (`exports_view`, `dashboard_view`) updated accordingly.

### 2.3 Commission lifecycle — `wallet` app

**`CommissionEntry`** (new) — the heart of the pending/lock model. One row per (order, trustee, layer).
- `wallet` FK, `trustee` FK, `order` FK (extensible to GenericFK later if services/consultations get commission).
- `kind`: `AREA` | `REFERRAL`.
- `base_amount`, `percent_snapshot`, `amount`.
- `status`: `PENDING` → `AVAILABLE` → `PAID`, plus `REVERSED` / `CANCELLED`.
- `delivered_at`, `matures_at` (= `delivered_at + COMMISSION_LOCK_DAYS`), `matured_txn` (FK to the `WalletTransaction` written on maturity), `reversed_reason`.
- **Idempotency**: unique `(order, trustee, kind)`.

**`Wallet`** — add `pending_balance` (sum of PENDING entries). Keep `balance` = matured/spendable, `held_amount` = reserved for approved withdrawals.
- `available_balance = balance − held_amount` (unchanged; withdrawals gated here).
- `pending_balance` is **informational + locked** — never withdrawable until maturity moves it into `balance`.

**Reuse** existing `WalletTransactionType.COMMISSION_CREDIT` / `COMMISSION_REVERSAL` for the *matured* money movement, and the existing partial-unique idempotency constraint. The PENDING accrual lives in `CommissionEntry` (no balance impact until maturity).

State machine:
```
capture  → CommissionEntry(PENDING), wallet.pending_balance += amount   (no WalletTransaction yet)
delivered→ set delivered_at, matures_at = delivered_at + LOCK_DAYS
matured  → PENDING→AVAILABLE: pending_balance -= amt, balance += amt, emit COMMISSION_CREDIT txn
return   → if PENDING:  PENDING→REVERSED, pending_balance -= amt (no txn)
           if AVAILABLE/PAID (defensive): emit COMMISSION_REVERSAL debit, status→REVERSED
```

---

## 3. The split / stacking engine

Runs on **payment capture** (both `PaymentService.verify_payment` and the wallet-only finalize path), after the order is marked PAID. Pure function + persistence, fully unit-testable.

```
INPUTS: order (with shipping_pincode + user), referral_code (from checkout payload/cookie)

area_trustee     = resolve_area_trustee(order.shipping_pincode)      # pincode→state→active assignment
referral_trustee = resolve_referral_trustee(referral_code)           # active trustee by code

# Anti-fraud guards
if referral_trustee and referral_trustee.user_id == order.user_id:   # self-referral
    referral_trustee = None
if referral_trustee and not referral_trustee.is_active: referral_trustee = None
if area_trustee and not area_trustee.is_active:         area_trustee = None

area_pct     = assignment.area_commission_percent or AREA_COMMISSION_PERCENT (15)
referral_pct = REFERRAL_COMMISSION_PERCENT (5)
base         = order commissionable base (see §3.1)

if area_trustee:     create CommissionEntry(AREA,     area_trustee,     base*area_pct%)
if referral_trustee: create CommissionEntry(REFERRAL, referral_trustee, base*referral_pct%)
```

This naturally yields all three scenarios **without special-casing**:
- **Scenario 1 (pure area)**: referral_code absent → only AREA(15%). Org keeps 85%.
- **Scenario 2 (cross-border)**: area B + referral A, different trustees → AREA(15%→B) + REFERRAL(5%→A). Org keeps 80%.
- **Scenario 3 (stacked, same trustee)**: area == referral == A → AREA(15%→A) + REFERRAL(5%→A) = 20% to A. Org keeps 80%. (Two ledger rows, not one — cleaner accounting, independent reversal.)

### 3.1 Commissionable base — **decision needed** (§9-Q4)
Recommend: base = `subtotal_amount` (product value), **excluding** shipping & tax & wallet-funded portion considerations. Commission on shipping/GST is not real margin. Snapshot the base on each entry.

### 3.2 Non-shippable items (services / AI / Tantra / consultations)
No shipping pincode → **no AREA layer**. **Decision needed (§9-Q5)**: do these get REFERRAL 5% only, or 0%? Today consultations accrue commission; the new flow is described purely for physical goods. Recommend: digital/services = **referral-only** (5%) if a ref cookie is present, **no area**, and they mature on payment + LOCK_DAYS (no delivery event). Donations stay 0% regardless.

---

## 4. Front-end contract (Akshay)

### 4.1 `?ref=` capture (FE owns)
- Global listener reads `?ref=CODE` on any page → store in `localStorage` (30-day) **and** a cookie; strip from URL via History API. (Per notes.)
- **Cookie nuance to align on**: an `HttpOnly` cookie **cannot** be read by JS, so the SPA can't copy it into the API body. For a token-auth SPA on a different origin, cookies also may not be sent to the API automatically. **Recommended contract**:
  - FE sends `referral_code` in the **checkout create-order JSON body** (read from `localStorage`).
  - Backend *also* reads a non-HttpOnly `ref` cookie from `request.COOKIES` as a fallback/cross-check.
  - Backend is authoritative on validation (resolves code → active trustee, applies guards).

### 4.2 Checkout payload — new required fields
`POST /api/checkout/create-order` body gains:
```jsonc
{
  "cart_id": "…",
  "wallet_amount": "0",
  "referral_code": "AB23CDEF",          // optional, from localStorage
  "shipping_address": {                 // NEW — required for physical orders
    "name": "…", "phone": "…",
    "line1": "…", "line2": "…",
    "city": "…", "state": "…",
    "pincode": "560001", "country": "India"
  }
}
```
- Validate pincode format (6 digits) and that it resolves to a known state. Persist as the order shipping snapshot and feed Shiprocket (replaces hardcoded address).

### 4.3 Trustee dashboard data the FE will need
- Wallet: `pending_balance`, `available_balance`, `held_amount`.
- Per-entry breakdown: AREA vs REFERRAL, status, `matures_at`, source order.
- "Why pending / when it clears" surfaced per entry.

---

## 5. Logistics: Shiprocket webhook → lock clock

- **New endpoint** `POST /api/shiprocket/webhook` (token/secret-verified, idempotent on Shiprocket's event id — mirror the `PaymentEvent` dedupe pattern).
- On **Delivered**: set `Order.delivered_at`, set `shipping_status=DELIVERED`, and set `matures_at = delivered_at + COMMISSION_LOCK_DAYS` on the order's PENDING `CommissionEntry` rows.
- On **RTO / Returned / Cancelled**: set `is_returned`, reverse PENDING entries (drop `pending_balance`), and if any already matured (shouldn't, if window ≥ return window) emit `COMMISSION_REVERSAL`.
- **Maturity sweep** (Celery Beat, daily): `CommissionEntry` where `status=PENDING AND matures_at ≤ now AND order not returned` → `AVAILABLE` + `COMMISSION_CREDIT`. Celery+Redis+Beat already run in prod (systemd) — reuse.
- Also keep a **safety net**: if no delivery webhook ever arrives, an entry stays PENDING indefinitely (never wrongly pays out). Add an admin report for "stuck pending > N days" for manual review.

---

## 6. Razorpay money movement — recommendation

**Two models exist; I recommend the ledger model (B).**

- **(A) Razorpay Route split at capture** — transfer 15/5% to trustee *linked accounts* at payment time, org keeps 80/85%. Problem: with a **15-day post-delivery return window**, you routinely have to **reverse settled transfers**; Route reversals need a floating balance in the linked account and **partial-refund `reverse_all` is unreliable across multiple transfers** (confirmed in Razorpay docs). Trustees could also withdraw their Route balance before a return claws it back. Operationally fragile, and every trustee must complete Route KYC.
- **(B) Single-account capture + internal ledger (RECOMMENDED)** — capture **100% to the org/Vijaybhai Razorpay account**. Trustee 15/5% are **liabilities** tracked as `CommissionEntry` (pending→available) and paid out later via the **existing `WithdrawalRequest`** pipeline (manual now; RazorpayX abstraction already reserved). This matches industry affiliate practice (pending period = return window), reuses everything already built, and makes returns a pure ledger reversal with zero gateway clawback.

> **Sandbox-test reframing**: the "verify the 80/85% Razorpay split" step becomes "verify 100% lands in the org account **and** the trustee ledger shows the correct **pending** 15/5% balances." Economically identical (org keeps 80/85%), operationally far safer. **Needs Vijaybhai's nod (§9-Q1)** since the notes literally say "split routes 80/85%."

---

## 7. Anti-fraud, config & edge cases

- **Self-referral**: `referral_trustee.user == order.user` → referral layer = 0. (Explicit guard, unit-tested.)
- **Unassigned state**: pincode resolves to a state with no active area trustee → **no area entry**; org keeps that 15%. Log for ops (so coverage gaps are visible). Only 14–15 of 36 states are covered initially.
- **Inactive/blocked trustee**: skip that layer; never accrue to a blocked trustee.
- **Pincode unresolvable**: block checkout with a clear validation error (can't ship anyway) — don't silently drop area attribution.
- **Returns after maturity**: defensive `COMMISSION_REVERSAL` (can push `balance` negative only if already withdrawn — flag for manual recovery; rare if lock ≥ return window).
- **Config** (admin-editable, snapshotted per order so slab edits don't rewrite history):
  - `AREA_COMMISSION_PERCENT=15`, `REFERRAL_COMMISSION_PERCENT=5`, `COMMISSION_LOCK_DAYS=15` in `.env`/`config.py`; per-state override on `TrusteeStateAssignment`.
- **Donations**: hard 0% — remove the `credit_for_donation` call site; keep the function dormant or delete per cleanliness.
- **Idempotency**: split engine is safe to re-run (unique `(order,trustee,kind)`); maturity + webhook handlers idempotent.

---

## 8. Data + migrations + jobs

- **Migrations**: several (new models + `Order`/`Wallet` fields). Per project rule, **do not run `makemigrations`/`migrate` automatically** — I'll stage them and you run them. Provide management commands:
  - `seed_states` — canonical 36-state list.
  - `import_pincode_state_map` — load prefix dataset (CSV) into `PincodeStateMap`.
  - `assign_trustee_states` — bulk-assign the 14–15 states to the 11 trustees.
  - `backfill_order_attribution` (optional) — leave historical orders as-is; new model only forward.
- **Celery Beat**: add `commission_maturity_sweep` daily task.
- **No tests created unless you ask** (project rule) — but I strongly recommend a unit-test suite for the split engine's 3 scenarios + guards given the money sensitivity; will add on request.

---

## 9. Decisions — status (reviewed 2026-06-20)

1. **Q1 — Money movement**: ✅ **CONFIRMED — Ledger model** (capture 100% to org account; trustee 15/5% accrue as pending wallet liabilities; pay out after maturity via `WithdrawalRequest`, RazorpayX-automatable later). Route rejected: instant settlement conflicts with the 15-day-post-delivery lock + return clawback, and forces linked-account KYC on all 11 trustees.
2. **Q2 — Pincode dataset**: ✅ **CONFIRMED — seed a static dataset, no runtime API.** Seed **full 6-digit pincode→state** (exact match) from a free open dataset (data.gov.in All-India Pincode Directory). 3-digit prefix kept only as fallback; optional free API used **admin-side, logged, non-blocking** for genuinely-unknown pincodes. Rationale: pincode→state is static reference data and must not sit on the money/checkout path.
3. **Q3 — Percentages/lock**: ✅ **CONFIRMED** — global defaults 15% area / 5% referral, optional per-state override on `TrusteeStateAssignment`, lock = 15 days. All snapshotted per order.
4. **Q4 — Commissionable base**: ✅ **CONFIRMED** — product `subtotal` only (exclude shipping/GST/tax).
5. **Q5 — Non-shippable items** (services/AI/Tantra/consultations): ⏳ **DEFERRED — pending Vijaybhai.** Until confirmed, the split engine will **not** accrue any commission on non-shippable items, and a professional `# TODO [Q5-NONSHIPPABLE-COMMISSION]` block will mark the exact branch (referral-only 5% vs 0%) for a one-line switch once decided. Donations stay 0% regardless.
6. **Q6 — `referring_trustee` legacy**: ✅ **CONFIRMED (recommend)** — keep the historical column read-only; all new logic uses `area_trustee` / `referral_trustee`.

---

## 10. Phased delivery

| Phase | Deliverable | Depends on |
|---|---|---|
| **A. Territory & address** ✅ **SHIPPED 2026-06-20** | `State`, `TrusteeStateAssignment`, `PincodeStateMap` + `TerritoryService` resolver (versioned cache, signal invalidation); `shipping_address` capture + snapshot on `Order`; real Shiprocket address; commission config (`AREA/REFERRAL_COMMISSION_PERCENT`, `COMMISSION_LOCK_DAYS`); admin + superuser territory APIs; seed commands (`seed_states`, `import_pincode_state_map`, `assign_trustee_states`). Guides: `TRUSTEE_COMMISSION_PHASE_A_WEB_GUIDE.md` + `TRUSTEE_COMMISSION_PHASE_A_ADMIN_GUIDE.md`. | Q2, Q3 |
| **B. Split engine + pending wallet** ✅ **SHIPPED 2026-06-20** | `CommissionEntry` (PENDING→AVAILABLE→REVERSED), `Wallet.pending_balance`, dual `area_trustee`/`referral_trustee` attribution on `Order`, 3-scenario engine, self-referral guard, `referral_code` accepted at checkout, donations→0%, consultations marked `# TODO [Q5-NONSHIPPABLE-COMMISSION]`. | A, Q1, Q4, Q5 |
| **C. Maturity & returns** ✅ **SHIPPED 2026-06-20** | `/api/shiprocket/webhook` (delivered/return, token-guarded, idempotent), `mark_delivered`→`matures_at = delivered+lock`, Celery `wallet.run_commission_maturity_sweep` (daily 02:00 IST via `seed_commission_schedule`), return/cancel reversal. Withdrawals already gate on `available_balance` (matured funds only). | B |
| **D. Surfacing** ✅ **SHIPPED 2026-06-20** | Trustee `dashboard` (pending/available + AREA/REFERRAL split), `GET /api/trustee/<id>/commissions/`, `earnings_summary` + wallet serializer expose `pending_balance`/`pending_commission`, admin order exports add area/referral columns. Admin slab config = the Phase A territory APIs. | C |
| **E. Sandbox + go-live** ✅ **LOCAL E2E VERIFIED 2026-06-20** | Local live run: 31/31 lifecycle checks (stacked/pure-area/self-referral, maturity, return reversal), HTTP Shiprocket webhook + lock clock, authed trustee APIs, real Celery worker maturity. Smoke scripts in `app/scripts_e2e/`. **Remaining for production go-live**: real ₹50 Razorpay sandbox purchase + real Shiprocket delivered event on the prod stack. | A–D |

Each phase ends with a `PROJECT_SCOPE_AND_PROGRESS.md` update + Update-Log entry (project maintenance rule).

---

**Next step**: review §9 decisions. On green light (and answers to Q1–Q6) I'll start **Phase A**.
