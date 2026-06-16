# Admin Panel — AI Reading Reports API Guide

Single source of truth for the **Admin Panel** to monitor every user's **AI
Face / Palm Reading** reports — list & inspect readings and view the full
payment/unlock ledger. This surface is **read-only**.

> **Mental model in one paragraph.** End users submit AI readings for free and
> pay (Razorpay) to unlock the full report — that whole flow is documented in
> [AI_SERVICES_FE_GUIDE.md](AI_SERVICES_FE_GUIDE.md). This admin surface sits
> **on top of the same data**, scoped to superusers, exposing all users'
> readings (no per-user filter), the **ungated** report payload (admins always
> see `full_payload`/`html_full` regardless of unlock state for transaction
> monitoring), and the full unlock/payment ledger. It is **read-only** — there
> are no write actions.
>
> **No refund or cancel actions.** AI report unlocks have no admin refund
> action (refunds for AI reports are out of the project scope/quotation), and
> readings are cancelled by their owner via `POST /api/ai-readings/{id}/cancel/`
> — not from the admin panel. (Order refunds, which *are* in scope, live in the
> orders/wallet modules.)

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Auth (superuser only)](#2-auth-superuser-only)
3. [List reading reports](#3-list-reading-reports)
4. [Retrieve one report (full detail)](#4-retrieve-one-report-full-detail)
5. [Field & enum reference](#5-field--enum-reference)
6. [Error reference](#6-error-reference)

---

## 1. Conventions

### Base URL

```
http://127.0.0.1:8000          # local dev
https://api.divyasadhana.app   # production (illustrative)
```

### Response envelope

Same envelope as the rest of the platform:

```json
{ "message": "Human-readable status string", "data": <object | array | null> }
```

Route on the **HTTP status code**; use `message` for toast text.

### Auth header

```
Authorization: Bearer <superuser_access_token>
```

All endpoints below require an authenticated user **with `is_superuser=True`**.
A non-superuser (even authenticated) gets `403`.

### Allowed methods

This surface is **read-only** — only `GET` is accepted. `POST` / `PATCH` /
`DELETE` to any endpoint here return `405 Method Not Allowed`. Readings are
created and cancelled by users via `/api/ai-readings/`.

---

## 2. Auth (superuser only)

Use the platform's standard login; the account must be a superuser.

```bash
curl -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "SuperSecret1!"}'
```

Store `data.tokens.access.token` and send it as `Authorization: Bearer <token>`
on every call below.

---

## 3. List reading reports

### `GET /api/admin/ai-readings/`

Returns **all** users' readings (paginated), newest first. List rows are
intentionally **lean** — the heavy report bodies (`html_teaser`, `html_full`,
`full_payload`, `teaser_payload`) are returned as `null` in list responses to
keep payloads small. Fetch the [detail endpoint](#4-retrieve-one-report-full-detail)
for the full text.

```bash
curl "$BASE/api/admin/ai-readings/?status=succeeded&sort=-created_at&page=1&paginate=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response (`200`) — `message`: `"List of AI Reading Requests retrieved successfully"`:

```json
{
  "message": "List of AI Reading Requests retrieved successfully",
  "data": {
    "count": 128,
    "next": "http://127.0.0.1:8000/api/admin/ai-readings/?page=2",
    "previous": null,
    "results": [
      {
        "id": "9c0e…-uuid",
        "request_number": "AIRD-7B1C9D4E2F3A4B5C6D",
        "service": "0d1e…-uuid",
        "service_name": "AI Face Reading",
        "service_slug": "face-reading",
        "service_kind": "face_reading",
        "report_unlock_price": "199.00",
        "currency": "INR",
        "user": {
          "id": "u-uuid",
          "email": "user@example.com",
          "first_name": "Asha",
          "last_name": "Verma",
          "full_name": "Asha Verma",
          "phone_number": "+9198…",
          "is_active": true
        },
        "status": "succeeded",
        "input_image_key": "dev/face_reading/u-uuid/2026/06/face.jpg",
        "input_answers": { "focus": "Career" },
        "failure_code": null,
        "failure_reason": null,
        "is_cache_hit": false,
        "cached_from": null,
        "provider_snapshot": {
          "provider_key": "groq_vision",
          "model_id": "meta-llama/llama-4-scout-17b-16e-instruct",
          "prompt_template_key": "face_reading_v1"
        },
        "processing_started_at": "2026-06-09T10:30:02Z",
        "processing_completed_at": "2026-06-09T10:30:18Z",
        "report": {
          "id": "rep-uuid",
          "summary": "A composed, introspective personality…",
          "teaser_payload": null,
          "html_teaser": null,
          "full_payload": null,
          "html_full": null,
          "pdf_object_key": "dev/ai/readings/reports/2026/06/AIRD-….pdf",
          "pdf_download_url": "https://…signed…",
          "is_unlocked": true,
          "unlocked_at": "2026-06-09T10:31:45Z",
          "provider_request_id": "chatcmpl-…",
          "tokens_input": 2436,
          "tokens_output": 272,
          "unlocks": [
            {
              "id": "unl-uuid",
              "internal_payment_ref": "AIUNLK-3F7A2B6C1D9E8F4A2B",
              "user": "u-uuid",
              "provider": "razorpay",
              "provider_order_id": "order_NXk7DZdY4Tq2GH",
              "provider_payment_id": "pay_NXl8EAeZ5Ur3HI",
              "amount": "199.00",
              "wallet_paid_amount": "0.00",
              "currency": "INR",
              "status": "captured",
              "failure_code": null,
              "failure_reason": null,
              "captured_at": "2026-06-09T10:31:45Z",
              "created_at": "2026-06-09T10:31:10Z",
              "updated_at": "2026-06-09T10:31:45Z"
            }
          ],
          "created_at": "2026-06-09T10:30:18Z",
          "updated_at": "2026-06-09T10:31:45Z"
        },
        "created_at": "2026-06-09T10:30:00Z",
        "updated_at": "2026-06-09T10:31:45Z"
      }
    ]
  }
}
```

### Filtering, search, sort, pagination

Powered by the platform's shared `filter_model` — same conventions as the rest
of the API.

| Query param | Effect |
|---|---|
| `status=succeeded` | Filter by lifecycle state (`pending`/`processing`/`succeeded`/`failed`/`cancelled`) |
| `status__in=failed,cancelled` | Multiple states (comma-separated) |
| `user=<user-uuid>` | All readings for one user |
| `user__email=user@example.com` | By the payer's email (FK-nested lookup) |
| `service=<service-uuid>` / `service__slug=face-reading` | One service / kind |
| `service__kind=palm_reading` | By AI kind |
| `is_cache_hit=true` | Only cache-served readings |
| `created_at__gte=2026-06-01` | Date range (also `__lte`, `__gt`, `__lt`) |
| `search=AIRD-7B1C` | Substring search across text columns (e.g. `request_number`) |
| `search=user@example.com&search_fields=user__email` | Scope the search to specific (nested) columns |
| `sort=-created_at` | Order (prefix `-` for descending; comma-separate multiple) |
| `page=2` | Page number (default page size is 10) |
| `paginate=50` | Page size — the param is **`paginate`**, not `page_size` (platform-wide `BasePagination` convention) |
| `fields=id,request_number,status,user` | Trim the response to specific top-level fields |

> **Note.** `search` without `search_fields` only scans plain text columns;
> raw FK names are skipped silently. To search by a related column, pass the
> nested path explicitly (e.g. `search_fields=user__email,request_number`).

---

## 4. Retrieve one report (full detail)

### `GET /api/admin/ai-readings/{id}/`

Same shape as a list row, but with the **full** report bodies populated and
**ungated** — `full_payload` and `html_full` are returned even when
`report.is_unlocked=false` (admin override; the end-user serializer strips
them). Use this to inspect exactly what the user paid for or is being shown.

```bash
curl "$BASE/api/admin/ai-readings/9c0e…-uuid/" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response (`200`) — `message`: `"AI Reading Request retrieved successfully"`:

```json
{
  "message": "AI Reading Request retrieved successfully",
  "data": {
    "id": "9c0e…-uuid",
    "request_number": "AIRD-7B1C9D4E2F3A4B5C6D",
    "status": "succeeded",
    "user": { "id": "u-uuid", "email": "user@example.com", "full_name": "Asha Verma", "…": "…" },
    "report": {
      "id": "rep-uuid",
      "summary": "A composed, introspective personality…",
      "teaser_payload": { "summary": "…", "headline": "Late bloomer…" },
      "html_teaser": "<section>…rendered teaser HTML…</section>",
      "full_payload": {
        "summary": "…",
        "personality": { "introvert_extrovert": "…" },
        "career": { "strengths": "…", "timeline": "…" },
        "remedies": ["Wear silver…"]
      },
      "html_full": "<article>…full HTML report…</article>",
      "pdf_object_key": "dev/ai/readings/reports/2026/06/AIRD-….pdf",
      "pdf_download_url": "https://…signed…",
      "is_unlocked": true,
      "unlocked_at": "2026-06-09T10:31:45Z",
      "provider_request_id": "chatcmpl-…",
      "tokens_input": 2436,
      "tokens_output": 272,
      "unlocks": [ { "internal_payment_ref": "AIUNLK-…", "status": "captured", "amount": "199.00", "…": "…" } ],
      "created_at": "2026-06-09T10:30:18Z",
      "updated_at": "2026-06-09T10:31:45Z"
    },
    "…": "…"
  }
}
```

`report` is `null` for readings that never produced one (`pending`,
`processing`, `failed` before generation, `cancelled`).

---

## 5. Field & enum reference

### Reading status (`status`)

| Value | Meaning |
|---|---|
| `pending` | Queued, generation not started |
| `processing` | Provider call in flight |
| `succeeded` | Report generated; teaser available |
| `failed` | Generation error (`failure_code` / `failure_reason` populated) |
| `cancelled` | Cancelled by user or admin |

### Unlock status (`report.unlocks[].status`)

| Value | Meaning |
|---|---|
| `initiated` | Razorpay order created, awaiting capture |
| `captured` | Paid & verified — report unlocked |
| `failed` | Signature mismatch / payment failed |
| `refunded` | Reserved — not produced by any current flow (no AI refund action exists) |

### Admin-only fields (not exposed to end users)

| Field | Meaning |
|---|---|
| `report.full_payload` / `report.html_full` | Returned **even when locked** (ungated for admins) |
| `report.unlocks[]` | Full payment ledger for the report (all attempts) — transaction monitoring |
| `is_cache_hit` / `cached_from` | Whether this reading was served from the image cache, and the source reading id |
| `provider_snapshot` | Provider/model/template snapshot used for this reading |
| `report.provider_request_id`, `tokens_input`, `tokens_output` | Observability/cost fields |

---

## 6. Error reference

| Code | Message | Cause |
|---|---|---|
| `401` | Standard JWT error | Missing/expired access token |
| `403` | `Admin panel access is restricted to superusers.` | Authenticated but not a superuser |
| `404` | Not found | Unknown reading id |
| `405` | Method not allowed | Any non-`GET` method (this surface is read-only) |

---

*Last updated: 2026-06-09.*
