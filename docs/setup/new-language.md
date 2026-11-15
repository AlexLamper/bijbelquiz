# Adding a language to biblequizzes.app

English is the root site. Every other language is its own build served under a
path prefix and proxied from the English project. Checklist for a language `xx`
(es, pt, de, fr are already in `INTL_LOCALES` in `src/config/site.ts`):

1. **Dictionary.** Copy `src/i18n/en.json` to `src/i18n/xx.json` and translate
   the values (keys and `{placeholders}` stay). Register it in
   `src/i18n/index.ts` (one import, one line in `dictionaries`).
   Check: `node --import tsx scripts/i18n-status.mts xx`. Set
   `bq.header.numberLocale` and `meta.ogLocale` to the language's locale.
   Missing keys fall back to English, so a partial file never shows Dutch.
2. **Book names.** Add the 66 titles and short forms in `src/lib/bible-books.ts`
   (see `EN_TITLES`), and the spellings in `src/lib/book-canon.ts`.
3. **Bible text.** A public-domain translation in the language, added to
   BijbelAPI (see the `web`/`kjv` change in AlexLamper/BijbelAPI) and wired in
   `src/lib/bible-en.ts` (rename/generalise per language).
4. **Content.** Quizzes in `docs/quizzes-xx` (copy the English plan), written
   and reviewed, imported into that language's database.
5. **Deployment.** New Vercel project from this repo with
   `SITE=intl SITE_LOCALE=xx` (the build gets `basePath: /xx` and
   `https://biblequizzes.app/xx` as its base URL), its own database (`lang: xx`)
   and env vars. In the English project add a rewrite
   `/xx/:path*` -> the xx deployment, so biblequizzes.app/xx/... serves it.
6. **Stripe / RevenueCat / mail**: shared with the English site where possible.
7. **Launch.** hreflang between equivalent pages, then `SITE_INDEXABLE=true`.
