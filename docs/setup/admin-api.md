# Admin API (app en website)

Contract for the admin JSON endpoints. The Flutter admin screen uses the
`/api/mobile/admin/**` paths; the website's `/beheer` pages read the same
loaders server side and call the same handlers under `/api/admin/**` from the
browser. Every `/api/mobile/admin/X` route is the same handler as
`/api/admin/X` (one implementation, re-exported), so both always answer the
same JSON.

Everything here is additive. `GET /api/mobile/admin/stats` (what older app
versions read today) keeps its exact shape.

## Conventions

- **Auth**: `Authorization: Bearer <token>` with the token from
  `/api/mobile/{login,register,google-login,apple-login}` (the website sends its
  next-auth cookie instead). The account must have `role: "admin"`.
  - no or invalid token: `401 { "error": "Unauthorized" }`
  - signed in, not an admin: `403 { "error": "Forbidden" }`
- **Errors**: `{ "error": "<Dutch message for display>" }` with 400 (invalid
  input), 404 (not found), 500 (server). A 400 may also carry
  `"field": "<name>"`.
- **Dates**: ISO 8601 strings in UTC (`"2026-10-27T09:12:00.000Z"`) or `null`.
  Calendar periods ("vandaag", "7 dagen", weeks) are Amsterdam calendar days:
  "7 dagen" = today plus the 6 days before it, from Amsterdam midnight.
- **Money**: integer cents. Headline amounts are euro; other currencies are
  listed separately and never converted.
- **Counts that exclude test accounts**: Premium, revenue and conversion leave
  out the internal developer/reviewer accounts (`isInternal: true` on users).
  Registration and activity counts include everyone unless a field says
  otherwise (`internalExcluded` tells how many exist).
- **Unknown fields**: clients must ignore fields they do not know; new fields
  may be added at any time.
- **Platform header (new, optional)**: the app should send
  `X-Client-Platform: ios | android` on every request (at least on register,
  login, google-login, apple-login and profile). The server uses it to record
  where an account was created and was last seen. Without it the server falls
  back to the user agent, then to the analytics events the app posts.

### Platform keys

Used for where an account was created (`signupPlatform`) and where it is
active (`platform`):

| key | label (nl) | meaning |
|---|---|---|
| `web-desktop` | Website (computer) | website, desktop/laptop browser |
| `web-mobile` | Website (mobiel) | website on a phone or tablet browser |
| `web` | Website | website, device not known (older accounts) |
| `ios` | iOS-app | iPhone/iPad app |
| `android` | Android-app | Android app |
| `app` | App | app, OS not known (older accounts, older app versions) |
| `onbekend` | Onbekend | nothing known |

`web`, `app` and `onbekend` only occur for accounts created before this was
recorded, whose platform is derived (`signupPlatformDerived: true`) from the
account's earliest analytics event (and its device), or from an App Store /
Play payment.

### Sign-up method keys

`email` (e-mail + wachtwoord), `google`, `apple`, `onbekend`.

### Premium source keys

`stripe` (website subscription), `store` (App Store / Google Play),
`lifetime` (levenslang), `group` (groepslicentie), `manual` (gegeven door
beheer). An account can have several at once; `premium.source` is the single
one shown, in this priority: lifetime, stripe, store, group, manual.

---

## 1. Overview

`GET /api/mobile/admin/overview`

Query: `deep=1` (optional) runs the slow Stripe checks for `health`; default
shallow (config only, fast).

```json
{
  "generatedAt": "2026-10-27T09:12:00.000Z",
  "internalExcluded": 3,
  "users": {
    "total": 1240,
    "registrations": {
      "today":   { "total": 4,   "byPlatform": { "web-desktop": 1, "web-mobile": 1, "ios": 2 } },
      "days7":   { "total": 31,  "byPlatform": { "...": 0 } },
      "days30":  { "total": 120, "byPlatform": { "...": 0 } },
      "allTime": { "total": 1240, "byPlatform": { "...": 0 } },
      "weekly": [
        { "weekStart": "2026-08-10", "label": "10 aug", "total": 22, "byPlatform": { "ios": 10, "android": 6, "web-desktop": 4, "web-mobile": 2 } }
      ]
    },
    "byMethod": { "email": 700, "google": 400, "apple": 120, "onbekend": 20 },
    "active": {
      "today":  { "total": 80,  "byPlatform": { "ios": 40, "android": 25, "web-desktop": 10, "web-mobile": 8 } },
      "days7":  { "total": 300, "byPlatform": { "...": 0 } },
      "days30": { "total": 610, "byPlatform": { "...": 0 } }
    },
    "retention": {
      "description": "Accounts ouder dan 30 dagen die in de laatste 7 dagen actief waren",
      "total":      { "cohort": 900, "retained": 210, "rate": 23.3 },
      "byPlatform": { "ios": { "cohort": 300, "retained": 90, "rate": 30 } }
    }
  },
  "premium": {
    "total": 85,
    "share": 6.9,
    "bySource": { "stripe": 20, "store": 40, "lifetime": 10, "group": 9, "manual": 6 },
    "bySignupPlatform": { "ios": 30, "android": 20, "web-desktop": 25, "web-mobile": 10 },
    "conversion": {
      "description": "Deel van de echte accounts met Premium (test niet meegeteld)",
      "total": { "accounts": 1237, "premium": 85, "rate": 6.9 },
      "paid":  { "premium": 70, "rate": 5.7 },
      "byPlatform": { "ios": { "accounts": 400, "premium": 30, "rate": 7.5 } },
      "newLast30d": { "accounts": 120, "premium": 9, "rate": 7.5 }
    },
    "grantsActive": 6,
    "grantsExpiringIn7d": 1
  },
  "revenue": {
    "currency": "eur",
    "netCentsLast30d": 12345,
    "netCentsAllTime": 99999,
    "refundedCentsAllTime": 499,
    "paymentsCompleted": 140,
    "renewalsAllTime": 30,
    "bySource": {
      "stripe": { "netCentsAllTime": 50000, "netCentsLast30d": 6000, "payments": 60 },
      "store":  { "netCentsAllTime": 49999, "netCentsLast30d": 6345, "payments": 80 }
    },
    "otherCurrenciesAllTime": [{ "currency": "usd", "netCents": 499 }],
    "otherCurrenciesLast30d": []
  },
  "quizzes": {
    "total": 120,
    "pending": 2,
    "plays": {
      "description": "Afgeronde quizzen volgens de app- en website-metingen",
      "days7":  { "total": 900,  "byPlatform": { "web": 300, "ios": 400, "android": 200 } },
      "days30": { "total": 3600, "byPlatform": { "web": 1200, "ios": 1600, "android": 800 } }
    }
  },
  "health": {
    "overall": "ok",
    "checkedAt": "2026-10-27T09:12:00.000Z",
    "okCount": 12,
    "issues": [{ "label": "...", "status": "warn", "detail": "...", "action": "..." }],
    "accessGapCount": 0
  },
  "recentUsers": [ "UserRow (see 3), newest 10" ],
  "recentPayments": [ "PaymentRow (see 9), newest 10" ]
}
```

- `byPlatform` objects only contain keys with a count above 0; a missing key
  means 0. Their values add up to `total` for registrations (every account
  has exactly one sign-up platform). For `active`, one account active on two
  platforms counts once in `total` and once in each platform, so the values
  can add up to more than `total`.
- `weekly`: the last 12 weeks, Monday-based, oldest first, current week last.
- `active`: an account counts when it played a quiz, opened the app or visited
  the website signed in within the period. Per platform comes from the
  analytics events (web split into computer/mobile by the visit's device).
- `retention.rate`, `conversion.*.rate`, `premium.share`: percent with one
  decimal (0-100).
- `quizzes.plays.byPlatform` keys are `web`, `ios`, `android`.
- `health` is `null` when the check itself failed.

## 2. Users list

`GET /api/mobile/admin/users`

| query | values | default |
|---|---|---|
| `q` | text, matches name or e-mail (case-insensitive, contains) | - |
| `platform` | a platform key | all |
| `premium` | `yes`, `no` | all |
| `source` | a premium source key (implies `premium=yes`) | all |
| `test` | `include`, `exclude`, `only` | `include` |
| `sort` | `createdAt`, `lastActive`, `name`, `email`, `xp`, `quizzesPlayed`, `premiumUntil` | `createdAt` |
| `order` | `asc`, `desc` | `desc` |
| `page` | 1-based | 1 |
| `pageSize` | 1-100 | 25 |

```json
{
  "page": 1,
  "pageSize": 25,
  "total": 1240,
  "pages": 50,
  "users": [
    {
      "id": "65f0c0ffee0000000000abcd",
      "name": "Anna de Vries",
      "email": "anna@example.nl",
      "createdAt": "2026-03-01T10:00:00.000Z",
      "signupPlatform": "ios",
      "signupPlatformDerived": false,
      "signupMethod": "apple",
      "lastActiveAt": "2026-10-26T19:00:00.000Z",
      "lastSeenPlatform": "ios",
      "premium": {
        "active": true,
        "source": "manual",
        "sources": ["manual"],
        "until": "2026-11-26T22:59:59.999Z"
      },
      "quizzesPlayed": 42,
      "xp": 3120,
      "level": 7,
      "role": "user",
      "isInternal": false
    }
  ]
}
```

- `premium.until`: when the shown source ends, `null` for lifetime, a manual
  grant without end date, or a Stripe subscription without a known period end.
- `lastActiveAt`: the later of the last quiz played and the last recorded
  visit/app open (recorded at most once per day). `lastSeenPlatform` may be
  `null`.

## 3. User detail

`GET /api/mobile/admin/users/{id}` (404 when the id is unknown or malformed)

```json
{
  "user": {
    "id": "...", "name": "...", "email": "...", "image": null,
    "role": "user", "isInternal": false,
    "createdAt": "...", "updatedAt": "...",
    "signupPlatform": "ios", "signupPlatformDerived": false, "signupMethod": "apple",
    "lastActiveAt": "...", "lastSeenPlatform": "ios", "lastPlayedAt": "...",
    "auth": { "password": false, "google": false, "apple": true },
    "xp": 3120, "level": 7, "levelTitle": "Leerling",
    "streak": 3, "bestStreak": 12,
    "quizzesPlayed": 42, "averageScore": 78,
    "badges": ["first_quiz"],
    "multiplayerGamesHosted": 2,
    "onboarding": { "bibleReadingFrequency": "weekly", "knowledgeLevel": "average", "interests": [] }
  },
  "premium": {
    "active": true,
    "source": "manual",
    "sources": ["manual"],
    "until": "2026-11-26T22:59:59.999Z",
    "stripe": {
      "active": false, "status": "canceled", "plan": "yearly",
      "currentPeriodEnd": null, "cancelAtPeriodEnd": false,
      "trialEnd": null, "customerId": "cus_...", "subscriptionId": "sub_..."
    },
    "store": { "active": false, "expiresAt": null },
    "lifetime": { "active": false },
    "group": {
      "active": false, "until": null,
      "licenses": [{ "id": "...", "name": "Kerk X", "role": "member", "status": "active", "expiresAt": null }]
    },
    "manual": {
      "active": true,
      "until": "2026-11-26T22:59:59.999Z",
      "grantedAt": "2026-10-27T09:12:00.000Z",
      "grantedBy": { "id": "...", "name": "Beheer", "email": "beheer@voorbeeld.nl" },
      "note": "Prijs van de zomerquiz",
      "legacy": false
    }
  },
  "grantLog": [
    {
      "action": "grant",
      "duration": "1m",
      "until": "2026-11-26T22:59:59.999Z",
      "note": "Prijs van de zomerquiz",
      "at": "2026-10-27T09:12:00.000Z",
      "by": { "id": "...", "name": "Beheer", "email": "beheer@voorbeeld.nl" }
    }
  ],
  "platformHistory": [
    { "platform": "ios", "firstAt": "...", "lastAt": "...", "events": 312, "sessions": 40 }
  ],
  "payments": [ "PaymentRow (see 9), newest first, at most 50" ],
  "recentAttempts": [
    { "id": "...", "quizId": "...", "quizTitle": "Jona", "score": 8, "totalQuestions": 10, "xpEarned": 90, "completedAt": "..." }
  ],
  "counts": {
    "attempts": 42,
    "duels": { "total": 5, "finished": 4, "won": 2 },
    "playerGroups": { "owned": 1, "member": 2 },
    "groupLicenses": { "owned": 0, "member": 1 }
  }
}
```

- `grantLog`: newest first; `action` is `grant` or `revoke`; `duration` one
  of the presets below, `custom`, or `null` on a revoke.
- `manual.legacy: true`: Premium set by hand before grants were dated (no end
  date, no audit entry). It can be revoked like any grant.
- `platformHistory`: from the analytics events (kept 400 days), one row per
  platform key, most recent first. `sessions` counts visits/app opens. Only a
  website visit's first event names the device, so the account's other web
  events are counted under its most recently used web device.
- `recentAttempts`: the newest 20.

## 4. Give Premium

`POST /api/mobile/admin/users/{id}/premium`

```json
{ "duration": "1m", "until": null, "note": "Prijs van de zomerquiz" }
```

- `duration` (required): `7d` (7 dagen), `1m` (1 maand), `3m` (3 maanden),
  `1y` (1 jaar), `lifetime` (levenslang, no end date) or `custom`.
- `until`: required for `custom`: an ISO date (`"2026-12-31"`) or date-time in
  the future and at most 10 years ahead. A bare date means the end of that
  Amsterdam day. Ignored for the presets.
- Presets count from now; a preset on an account that already has an active
  manual grant replaces its end date (it does not add up).
- `note`: optional, at most 300 characters.

Response `200`:

```json
{
  "ok": true,
  "premium": { "active": true, "source": "manual", "sources": ["manual"], "until": "..." },
  "grant": { "action": "grant", "duration": "1m", "until": "...", "note": "...", "at": "...", "by": { "id": "...", "name": "...", "email": "..." } }
}
```

`premium` has the shape of the users-list `premium` object. A grant never
switches off or shortens Premium from Stripe, the store, lifetime or a group
licence, and those never end a grant. A grant ends by itself at `until`: from
that moment the account is no longer Premium through it, on the website and in
the app (`/api/mobile/profile` and `/api/mobile/sync-premium`), without any
job having to run.

### Give Premium by e-mail

`POST /api/mobile/admin/premium-grants`

```json
{ "email": "anna@example.nl", "duration": "3m", "until": null, "note": "" }
```

Same as above, the account looked up by e-mail (case-insensitive). 404
`{ "error": "Geen account met dit e-mailadres." }` when none. The response
adds `"user": UserRow`.

## 5. Take a grant back

`DELETE /api/mobile/admin/users/{id}/premium`

Body (optional): `{ "note": "Per ongeluk gegeven" }`

Ends the manual grant (dated or legacy) now and writes a `revoke` entry in the
log. Stripe, store, lifetime and group Premium stay as they are. Response
`200 { "ok": true, "premium": {...} }`; `400` when the account has no manual
grant.

## 6. Quiz moderation

`GET /api/mobile/admin/quizzes?status=pending|approved|rejected|draft&q=`

```json
{
  "counts": { "pending": 2, "approved": 110, "rejected": 3, "draft": 5 },
  "quizzes": [
    {
      "id": "...", "title": "Jona", "slug": "jona",
      "status": "approved", "isPremium": false,
      "category": "Profeten", "questionCount": 10,
      "createdBy": "Beheer", "createdAt": "...",
      "plays30d": 40
    }
  ]
}
```

Without `status` all quizzes are returned. Documents without a status count as
`approved` (that is how the site reads them).

`PATCH /api/mobile/admin/quizzes/{id}`

```json
{ "action": "approve" }
```

`action`: `approve` (status approved), `reject` (rejected), `publish`
(approved), `unpublish` (draft), `premium` with `"isPremium": true|false`.
Response `200 { "ok": true, "quiz": QuizRow }`.

## 7. Payments

`GET /api/mobile/admin/payments?page=1&pageSize=25&provider=stripe|revenuecat&status=completed|failed|pending|refunded|disputed|trial&q=`

`q` matches the buyer's name or e-mail.

```json
{
  "page": 1, "pageSize": 25, "total": 180, "pages": 8,
  "revenue": "same object as overview.revenue",
  "payments": [
    {
      "id": "...",
      "userId": "...",
      "userName": "Anna de Vries",
      "userEmail": "anna@example.nl",
      "userDeleted": false,
      "provider": "revenuecat",
      "store": "app_store",
      "planType": "yearly",
      "amountCents": 2499,
      "currency": "eur",
      "status": "completed",
      "refundedCents": 0,
      "isTest": false,
      "isInternal": false,
      "isRenewal": false,
      "counted": true,
      "createdAt": "..."
    }
  ]
}
```

- `status` is the stored status, `refunded` when fully paid back.
- `counted`: whether the row counts as revenue (real money, received, not test,
  not internal, above 0).
- `store`: `app_store`, `play_store` or `null` (Stripe).

`GET /api/mobile/admin/payments/health?deep=1` returns the health summary of
`/api/mobile/admin/stats` (`overall`, `checkedAt`, `issues`, `okCount`,
`funnel30d`, `accessGapCount`, `stripeKeyMode`, `revenuecatConfigured`) plus
`"accessGaps": [{ "userId", "name", "email", "reason", "when" }]`.

## 8. Funnel

`GET /api/mobile/admin/funnel?days=7|30|90|365` (default 30)

```json
{
  "windowDays": 30,
  "report": "FunnelReport: hosts, paywall (with byTrigger), plans, trials, activation, handover - exactly as src/lib/analytics/funnel.ts",
  "retention": {
    "free":    { "cohort": 800, "retained": 150, "rate": 18.8 },
    "premium": { "cohort": 60,  "retained": 30,  "rate": 50 }
  }
}
```

## Changes to existing app endpoints (additive)

- `GET /api/mobile/profile` and `POST /api/mobile/sync-premium`: Premium
  from a beheer grant counts (`premiumSource: "manual"`) and stops at its end
  date. Two new fields: `premiumManual` (boolean, a beheer grant is running)
  and `manualPremiumUntil` (ISO or `null` when it has no end date).
- `/api/mobile/{register,login,google-login,apple-login}` and
  `GET /api/mobile/profile` read `X-Client-Platform` (or a `platform` field in
  the register/login body) to record the sign-up and last-seen platform.

## Existing endpoint (unchanged)

`GET /api/mobile/admin/stats[?deep=1]`: `PremiumStats` from
`src/lib/premium-stats.ts` plus `health`. Older app versions read it; it keeps
its shape.
