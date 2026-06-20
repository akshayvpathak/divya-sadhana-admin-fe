# Admin Panel — Trustee Commission Phase A — Territory Management Guide

**Audience**: Frontend (Akshay) — **Admin Panel**
**Scope**: Manage the territory layer that powers area-commission routing — the canonical **states**, the **pincode→state** table, and **which trustee owns which state**.
**Auth**: **superuser only** (`Authorization: Bearer <superuser access token>`). Non-superusers get `403`. Reads on `/states/` are allowed to any authed user; all writes + assignments + pincode-maps are superuser-only.

> **Mental model.** A customer's shipping **pincode** → resolves to a **State** (`PincodeStateMap`) → which has one active **Area Trustee** (`TrusteeStateAssignment`) who earns the 15% territory commission. This panel is where the admin curates those three tables. The customer-facing checkout that *consumes* them is in `TRUSTEE_COMMISSION_PHASE_A_WEB_GUIDE.md`.

---

## 1. Conventions
- Standard list pagination + `?search=`, `?sort=`, and field filters (shared `filter_model`).
- No `PUT` (use `PATCH`). Responses are the standard `{"message", "data"}` envelope.
- Edits take effect immediately — the resolver cache auto-invalidates on every write (no redeploy/restart).

## 2. States — `/api/territory/states/`
The canonical state master (seeded once via the `seed_states` backend command).

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/territory/states/` | any authed | List/search states |
| GET | `/api/territory/states/<id>/` | any authed | One state |
| POST | `/api/territory/states/` | superuser | Add a state |
| PATCH | `/api/territory/states/<id>/` | superuser | Edit (`name`, `code`, `is_active`) |
| DELETE | `/api/territory/states/<id>/` | superuser | Soft-delete |

State shape: `{ id, name, code, is_active, created_at, updated_at }`.

## 3. Area-trustee assignments — `/api/territory/assignments/`
Bind a state to its **Area Trustee** and (optionally) override the territory %.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/territory/assignments/` | List (filter `?state=<id>`, `?trustee=<id>`, `?is_active=true`) |
| POST | `/api/territory/assignments/` | Create an assignment |
| PATCH | `/api/territory/assignments/<id>/` | Edit `%` / `is_active` / reassign |
| DELETE | `/api/territory/assignments/<id>/` | Soft-delete |

**Create payload**:
```jsonc
{
  "trustee": "<trustee_id>",
  "state": "<state_id>",
  "area_commission_percent": "15.00",  // optional — omit to use the global default (AREA_COMMISSION_PERCENT)
  "is_active": true
}
```
Response includes read-only `trustee_referral_code`, `trustee_email`, `state_name` for display.

**One active trustee per state.** Creating/activating a second active assignment for a state returns **HTTP 400**: *"This state already has an active area trustee. Deactivate the existing assignment first."* → in the UI, deactivate the current one (PATCH `is_active=false`) before assigning a new trustee.

> Per-state `area_commission_percent` is the **hot-editable slab override**; leaving it blank uses the global `.env` default. This is the "commission slab management" surface from the quotation.

## 4. Pincode→state overrides — `/api/territory/pincode-maps/`
The bulk table is seeded from a dataset (`import_pincode_state_map` backend command). Use this only for **manual overrides/corrections** (superuser-only, all methods).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/territory/pincode-maps/` | List/search (`?search=380`) |
| POST | `/api/territory/pincode-maps/` | Add an override row |
| PATCH/DELETE | `/api/territory/pincode-maps/<id>/` | Edit/remove |

Row shape: `{ id, prefix, state (id), state_name, district }`. `prefix` is a 3-digit pincode prefix **or** a full 6-digit pincode (exact match wins over prefix).

## 5. Backend/ops (not FE) — for awareness
These run server-side (management commands), not from the panel:
- `seed_states` — seed the 36 states.
- `import_pincode_state_map --file <csv>` — bulk pincode→state (data.gov.in directory).
- `assign_trustee_states --email <trustee> --states "Gujarat,Maharashtra"` — bulk-assign.

> A trustee must exist first (promote a user to trustee). Trustee CRUD itself is the existing `/api/trustee/` surface.
