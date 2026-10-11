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
| POST | `/purchase/verify` | `{platform: android, productId, purchaseToken}` or `{platform: ios, productId, transactionId}` | `{entitlement}` (state `paid`); 409 `purchase_invalid`, `purchase_pending`, `unknown_product`, `used_elsewhere`; 503 `purchase_not_configured` |
| POST | `/insights` | see below | `{text}`; 402 `locked`, 429 `daily_limit`, 503 `ai_not_configured` |
| GET | `/api/admin/pauzo/stats` | admin cookie | `{stats}` |
| GET | `/api/admin/pauzo?status=&q=` | admin cookie | `{stats, daily, pairs, devices}` for `/admin/pauzo` |
| POST | `/api/admin/pauzo/device` | `{id, action}` admin cookie | `action` ∈ `unlock`, `extend_trial` (+7 days), `reset_trial` (undo an admin unlock) |

## Admin page

`/admin/pauzo` (log in at `/admin` first): installs, unlock rate, trials
running / over, codes created vs completed, AI questions today, a 14-day
installs/unlocks chart, the newest devices (filter by state, search by device
id or `PZ-` code) with support actions, and the newest invite codes.

`entitlement`: `{state: trial|unlocked|paid|expired, trialEndsAt, trialDaysLeft, pairCode, partnerJoined, aiDailyLimit}`.

## Push, invite links, purchases

- `GET /entitlement?fcmToken=` stores the device's FCM token. When a friend
  joins a code, the code's creator gets a «your friend joined» push in their
  language (`PAUZO_FCM_SERVICE_ACCOUNT`); without it the push is skipped.
- `/pauzo/invite?code=PZ-XXXXX` is the shareable invite page. With the app
  installed it opens Pauzo directly (App Links / Universal Links via
  `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association`,
  driven by `PAUZO_ANDROID_CERT_SHA256` and `PAUZO_APPLE_TEAM_ID`); otherwise it
  links to Google Play with `referrer=pauzo_code=…`, which the app reads after
  install.
- `/purchase/verify` asks Google Play (`PAUZO_PLAY_SERVICE_ACCOUNT`) or the App
  Store Server API (`PAUZO_APPLE_*`) about the one-time unlock before marking the
  device `paid`. A transaction already used by another device is refused unless
  it is the same platform's previous install (reinstall restore).

## Insights

Fixed questions only: `month_summary`, `how_to_save`, `can_i_buy`,
`goal_eta`, `vs_last_month`, `plan_review`. The app sends aggregates (plan,
totals, totals per category, goal progress, the wish being considered,
limits) — never transactions or comments. Nothing is stored; the answer comes
from Gemini (`PAUZO_GEMINI_API_KEY`, model `PAUZO_GEMINI_MODEL` or auto:
newest Flash) in the language of `locale` (`ar-EG` → Egyptian Arabic).
`PAUZO_AI_DAILY_LIMIT` questions per device per day (default 2); a failed answer is refunded. The model is the newest `gemini-X-flash` the key can call unless `PAUZO_GEMINI_MODEL` pins one.

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
