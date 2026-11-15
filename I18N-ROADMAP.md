# Bible Quizzes - internationalisation roadmap

Goal: the exact BijbelQuiz product (web + app, same stack, design, AI-generated
quizzes) in many languages, **without changing anything on bijbelquiz.com**.

Read this file first in every session. Each session picks up **one unchecked
step**, finishes it, ticks it here and commits. That keeps sessions small.

## Decisions (made by Alex, Nov 2026)

- **bijbelquiz.com stays as is**: same app, DB, URLs, SEO. NL is the default build.
- **biblequizzes.app** (bought at Hostinger) = the international brand "Bible Quizzes".
  English on the root, other languages in subfolders: `/es`, `/pt`, `/de`, `/fr`, ...
- **One codebase, two Vercel projects.** `SITE=intl` selects the international site
  (`src/config/site.ts`). No env var = NL, exactly as before.
- International site stays `noindex` until `SITE_INDEXABLE=true` (launch only).
- Separate international MongoDB (same schema + `lang` field). NL data is never touched.
- Quizzes are **generated natively per language**, not translated from Dutch.
- App: existing BijbelQuiz app untouched; one new Flutter flavor "Bible Quizzes"
  with all languages in-app and localized store listings.
- Payments: same Stripe account (AL Design), new products with local currency
  prices. New RevenueCat project, same `premium` entitlement, same webhook flow.
  Tax for worldwide web sales: decide Stripe Tax vs merchant of record with the accountant.
- Rollout: en -> es + pt-BR -> de + fr -> rest based on data. Never all at once.

## Hard rules

1. After every change that can affect NL: run the SEO check (below). 0 differences or no merge.
2. Never redirect visitors by IP or browser language (Google crawls from the US).
3. Do not set `SITE_INDEXABLE=true` before the English content is live and reviewed.
4. Dutch URL slugs (`/quizzen`, `/ranglijst`, `/bijbelquiz/[slug]`, `/quiz/[id]`) never change.

## SEO check

```
BASE=https://<nl-preview>.vercel.app python3 scripts/seo/crawl.py /tmp/after
python3 scripts/seo/compare.py scripts/seo/baseline-2026-11-13.json.gz /tmp/after.json
```

Baseline 2026-11-13: 2,262 pages, all 200, lang nl, no noindex.
Known pre-existing issues (fix separately, then refresh the baseline):
`/samen-spelen` has no canonical; 2 duplicate Esther ch. 9 titles; one title ends in "| BijbelQuiz | BijbelQuiz".

## Phases

### Phase 1 - foundation (web)
- [x] `src/config/site.ts` site config, `SITE` env switch
- [x] Dutch redirects only on the NL build; intl build sends `noindex` + robots disallow
- [x] SEO baseline + compare script in repo
- [x] i18n setup: `src/i18n/` with `nl.json` (source) and `en.json`, `t()` helper for server + client components
- [x] Extract strings, in batches per folder (commit + SEO check after each):
  - [x] `src/app/layout.tsx`, metadata, JSON-LD, `sitemap.ts` (use `getSiteConfig()`)
  - [x] `src/components/bq/` (shared design components; admin components stay Dutch)
  - [x] `src/components/web2/marketing/` (landing, help, legal UI; legal page bodies come with the page.tsx batch)
  - [x] `src/components/web2/browsing/`, `quiz-play/`, `quiz-result/`
  - [x] `src/components/web2/samen/`, `premium/`, `account/`
  - [x] `src/app/**/page.tsx` (page metadata and bodies; bijbelstudie, duel and duels are NL-only and 404 on intl)
  - [x] emails: `src/lib/support-mail.ts`, `trial-reminder.ts`, `auth/password-reset.ts`
  - [x] hardcoded `bijbelquiz.com` (41 places) -> `getSiteConfig().baseUrl`
- [x] Route map per locale (`src/config/route-map.ts`; links still on Dutch paths redirect on intl, nav/canonical/sitemap are localized): NL keeps its slugs; en gets `/quizzes`, `/leaderboard`,
      `/play-together`, `/bible-quiz/[slug]`, ... (Next rewrites onto the same pages)
- [x] Bible text per locale (intl: WEB via bible-api.com, public domain, `src/lib/bible-en.ts`; daily verse is fixed for now): `src/app/api/bible/*` currently uses BijbelAPI (Dutch).
      Add an English source (KJV/WEB, public domain) - in BijbelAPI or external. Verify licences.
- [x] Book names per locale on top of `src/lib/book-canon.ts` canonical codes

### Phase 2 - English site live (noindex)
- [ ] International MongoDB (Atlas), `lang` on Quiz + Category (`lang` field done; slugs stay unique per database, each site has its own DB). Atlas cluster itself: external, needs you.
- [ ] Vercel project `biblequizzes` from this repo: `SITE=intl`, own env vars (DB, auth, Stripe, mail)
- [ ] DNS at Hostinger -> Vercel (A/CNAME records Vercel gives), `www` -> apex
- [ ] Mail: `info@biblequizzes.app` (sending via the same provider as NL)
- [ ] Auth: Google/Apple sign-in redirect URLs for the new domain

### Phase 3 - English content
- [x] Quiz generation pipeline in English (same JSON format; `--lang=en` in validate/import scripts, `docs/quizzes-en/QUIZ-GENERATION-PLAN-EN.md`, `seed-categories-en.mts`)
- [ ] Categories + first batch of quizzes, review sample per batch (categories file and first sample quiz `genesis-bible-quiz-part-1` are in `docs/quizzes-en`; seeding needs the intl DB)
- [ ] Covers/images reuse where language-free

### Phase 4 - payments
- [ ] Stripe: new products/prices "Bible Quizzes Premium" (monthly/yearly/lifetime), USD/EUR/GBP...
- [ ] Tax decision (Stripe Tax or merchant of record) - with accountant
- [ ] RevenueCat: new project, `premium` entitlement, webhook -> intl `/api/mobile/revenuecat-webhook`

### Phase 5 - launch English
- [ ] `SITE_INDEXABLE=true`, Search Console property, submit sitemap
- [ ] `hreflang` between equivalent pages (nl on bijbelquiz.com <-> en/es/... on biblequizzes.app)

### Phase 6 - app (repo bijbelquiz-app)
- [ ] Flutter l10n (`intl`/ARB): extract strings (~58 of 132 Dart files)
- [ ] Flavors: `bijbelquiz` (com.bijbelquiz.app, unchanged) and `biblequizzes` (new bundle ID, API `https://biblequizzes.app/api/mobile`)
- [ ] Store listings with localized name, keywords and screenshots

### Phase 7 - more languages (each: config + translations + content + Bible source)
- [ ] es, pt-BR
- [ ] de, fr
- [ ] next, based on data

## Marketing
- SEO: every quiz x every language is a new page. Main growth engine.
- ASO per language in the stores.
- Social: one TikTok/Instagram account per big language, content from the marketing engine. Start with en only.
- Group licence for churches/schools/youth groups in every language.
