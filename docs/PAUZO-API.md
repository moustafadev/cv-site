# Pauzo API (`/api/pauzo/*`)

Backend for the Pauzo mobile app, hosted by this site on Cloudflare Pages.
Tables `pauzo_*` live in the same D1 database as the blog and are created on
first use; `npm run dev` without D1 credentials uses `data/blog-dev.sqlite`.

## Rules

- Every install gets a **7-day trial** from the moment it registers.
- A device creates **one pair code** (`PZ-XXXXX`). The first other device that
  joins it closes the pair and **both are unlocked for good**. A third device
  gets `pair_full`.
- A completed code can **restore** up to 2 more installs (phone change,
  reinstall) via `/pair/restore`.
- `PAUZO_REVIEWER_CODE` (env) unlocks a device on its own — give it to store
  reviewers, never publish it.
- Purchases (`pauzo_purchases`) are reserved for the one-time unlock; no
  verification route ships yet.

## Auth

`/device/register` is open (rate limited per IP). Every other route needs
`Authorization: Bearer <token>` with the token returned by register. Tokens
are stored hashed.

## Routes

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/device/register` | `{platform, appVersion, locale}` | `{token, deviceId, trialDays, entitlement}` |
| GET | `/entitlement?appVersion=&locale=` | — | `{entitlement}` |
| POST | `/pair/create` | — | `{code, entitlement}` (same code every call) |
| POST | `/pair/join` | `{code}` | `{entitlement}`; 409 with `error` ∈ `invalid_code`, `own_code`, `pair_full`, `already_paired` |
| POST | `/pair/restore` | `{code}` | `{entitlement}`; 409 with `error` ∈ `invalid_code`, `pair_incomplete`, `restore_limit` |
| POST | `/insights` | see below | `{text}`; 402 `locked`, 429 `daily_limit`, 503 `ai_not_configured` |
| GET | `/api/admin/pauzo/stats` | admin cookie | `{stats}` |

`entitlement`: `{state: trial|unlocked|paid|expired, trialEndsAt, trialDaysLeft, pairCode, partnerJoined, aiDailyLimit}`.

## Insights

Fixed questions only: `month_summary`, `how_to_save`, `can_i_buy`,
`goal_eta`, `vs_last_month`, `plan_review`. The app sends aggregates (plan,
totals, totals per category, goal progress, the wish being considered,
limits) — never transactions or comments. Nothing is stored; the answer comes
from Gemini (`PAUZO_GEMINI_API_KEY`, model `PAUZO_GEMINI_MODEL`, default
`gemini-2.5-flash`) in the language of `locale` (`ar-EG` → Egyptian Arabic).
`PAUZO_AI_DAILY_LIMIT` questions per device per day (default 10).

```json
{
  "question": "month_summary",
  "locale": "ar-EG",
  "currency": "EGP",
  "month": "2026-10",
  "plan": {"income": 24000, "mandatory": 9000, "daily": 6000, "reserve": 2000},
  "actual": {"income": 24000, "expenses": 5470, "byCategory": {"home": 4500, "shopping": 850, "travel": 120}},
  "previous": {"income": 23000, "expenses": 14200},
  "goal": {"title": "Beach holiday", "saved": 12600, "target": 18000, "monthly": 1500, "monthsLeft": 8},
  "desire": {"title": "Headphones", "amount": 1500},
  "limits": {"shopping": {"limit": 3000, "spent": 850}}
}
```

## Environment (Cloudflare Pages → Settings → Variables)

`PAUZO_GEMINI_API_KEY`, `PAUZO_REVIEWER_CODE`, optional `PAUZO_GEMINI_MODEL`,
`PAUZO_AI_DAILY_LIMIT`. The D1 variables are the ones the blog already uses.

## Local smoke test

```bash
npm run dev -- -p 3123
# register two devices, create a code on A, join from B, both unlocked:
curl -s -X POST localhost:3123/api/pauzo/device/register -H 'content-type: application/json' -d '{"platform":"ios"}'
```
