# BijbelQuiz 2.0 - handoff (status 26 okt 2026)

## Klaar
- Flutter-app 2.0 (repo AlexLamper/bijbelquiz-app, map bijbelquiz_mobile): alle goedgekeurde schermen, duels, paywall, 3 gratis quizzen, nieuw ontwerp. Op main, TestFlight 2.0.0 (60) geslaagd.
- Platform duels-API (/api/duels, /api/mobile/duels) + integratietests, op main en productie.
- Website-ontwerpen W1-W33 goedgekeurd (docs/web-2/designs + screenshots). Quiz maken is geschrapt.

## Nog te doen (website bouwen)
Volg docs/web-2/BUILD-BRIEF.md (routekaart, besluiten, smaakregels). Volgorde:
1. Fundament: tokens (kleuren/Fredoka/Nunito), gedeelde componenten src/components/bq/, layouts, lokale dev-omgeving.
2. Pagina-groepen: marketing, premium/Stripe, account, quiz, sociaal (duels/samen spelen), beheer.
3. Functionaliteit: Stripe (jaar met 7 dagen proef, maand, lifetime), Apple login, wachtwoord vergeten/herstellen, contactformulier met mail, account verwijderen, duels op web, Premium-uitleg/terugkijken.
4. Vergelijk met screenshots, tests, Vercel preview, pas daarna productie.

## Open punten
Account verwijderen in app (Apple-eis), duel-pushmeldingen, apple-app-site-association /duel/*, duels: gedeelde rate limit, matching-race, premium quizzen in duels, `npm run quiz:backfill-refs` op productie, npm test glob.

## Ontwerp-tokens
Achtergrond #ECEAE4; kaarten wit, 1px #DEDBD3, radius 16; lapis #35548C (rand #263E69, tint #EAEEF7); goud #E9B12E; koraal #D9734F/#B4502B; groen #3F6B4F; Fredoka 600 titels, Nunito UI; knoppen 3px donkerdere onderrand.
