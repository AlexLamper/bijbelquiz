# Betalingen in de app (App Store + Google Play via RevenueCat)

Dit is alles wat je zelf moet instellen zodat Premium in de iOS- en Android-app
gekocht, verlengd, opgezegd, terugbetaald en hersteld kan worden, en zodat dat
Premium bij het account hoort (app en website delen het).

## Hoe het werkt (kort)

1. De app logt RevenueCat in met het **user id van de server** (Mongo `_id`)
   als `appUserID`, bij elke login, registratie, Google/Apple-login en bij het
   opstarten. Bij uitloggen gaat RevenueCat terug naar een anonieme id.
2. Kopen kan alleen met een account. De app vraagt de server eerst of het
   account al Premium heeft (website/Stripe, groepslicentie, levenslang,
   handmatig); dan wordt er niets verkocht.
3. Na een aankoop of herstel roept de app `POST /api/mobile/sync-premium` aan.
   De server leest de klant dan direct uit de RevenueCat REST API, dus Premium
   staat meteen aan, ook als de webhook nog onderweg is.
4. RevenueCat stuurt elk store-event naar de webhook
   `https://www.bijbelquiz.com/api/mobile/revenuecat-webhook`. De server zet
   alleen het **store-deel** van Premium (`premiumStore`, `storePremiumExpiresAt`,
   bij levenslang `hasLifetimePremium`) en schrijft elke echte betaling in de
   `payments`-collectie (provider `revenuecat`, store, plan, bedrag in centen,
   valuta, `environment` `sandbox`/`production`). Premium van Stripe, een
   groepslicentie, levenslang of een handmatige toekenning wordt nooit door een
   store-event weggehaald.

## Vaste namen (moeten exact zo, de code gebruikt ze)

| Wat | Waarde |
|---|---|
| Product jaarlijks (abonnement, 7 dagen gratis) | `bijbelquiz_premium_yearly` |
| Product maandelijks (abonnement, geen proefperiode) | `bijbelquiz_premium_monthly` |
| Product levenslang (eenmalig) | `bijbelquiz_premium_lifetime` |
| RevenueCat entitlement | `premium` |
| RevenueCat offering (als *current* markeren) | `default` |
| Packages in `default` | `$rc_annual` -> yearly, `$rc_monthly` -> monthly, `$rc_lifetime` -> lifetime |
| Bundle id / package name | `com.bijbelquiz.app` |
| Webhook-URL | `https://www.bijbelquiz.com/api/mobile/revenuecat-webhook` |

Prijzen zet je in de stores; de app toont altijd de prijs van de store, in de
valuta van de koper. Houd ze gelijk aan de website (Stripe), want Premium is
hetzelfde product.

---

## 1. App Store Connect

1. **Overeenkomsten**: Business (vroeger "Agreements, Tax, and Banking") ->
   accepteer de **Paid Apps Agreement**. Vul **bankgegevens** en
   **belastingformulieren** (W-8BEN voor NL) in. Zonder status "Active" laadt
   de app geen producten (de paywall toont dan "Prijzen opnieuw laden").
2. **App** -> *Monetization* -> **Subscriptions** -> maak een
   **Subscription Group** "BijbelQuiz Premium".
   - Abonnement **`bijbelquiz_premium_yearly`**, duur 1 jaar, prijs instellen,
     weergavenaam en beschrijving (NL) invullen, screenshot van de paywall voor
     de review.
     - *Subscription Prices* -> **Introductory Offers** -> *Create* ->
       type **Free**, duur **1 week** (= 7 dagen), alle landen, nieuwe
       abonnees. (De app leest de trial uit de store en toont hem alleen als
       de koper er recht op heeft.)
   - Abonnement **`bijbelquiz_premium_monthly`**, duur 1 maand, prijs, geen
     introductory offer.
   - Beide in dezelfde groep (dan kan iemand wisselen tussen maand en jaar; de
     server krijgt dan `PRODUCT_CHANGE`).
3. *Monetization* -> **In-App Purchases** -> *Create* -> type
   **Non-Consumable**, product id **`bijbelquiz_premium_lifetime`**, prijs,
   naam en beschrijving.
4. Alle drie: status "Ready to Submit". Voeg ze bij de **eerstvolgende
   app-versie** toe aan de review (bij de versie: *In-App Purchases and
   Subscriptions* -> selecteren). Eerste producten worden alleen samen met een
   build goedgekeurd.
5. **App Store Server Notifications V2**: *App Information* -> *App Store
   Server Notifications* -> **Production Server URL** en **Sandbox Server URL**
   allebei op de URL die RevenueCat je geeft (RevenueCat -> project -> app
   (iOS) -> *Apple Server to Server notification settings*; begint met
   `https://api.revenuecat.com/v1/incoming-webhooks/apple-server-to-server-notification/`).
   Versie **Version 2**.
6. **In-App Purchase Key** voor RevenueCat (StoreKit 2): *Users and Access* ->
   *Integrations* -> **In-App Purchase** -> *Generate* -> download het
   `.p8`-bestand, noteer Key ID en Issuer ID. Upload in RevenueCat (stap 3).
   Ook de **App-Specific Shared Secret** (*App Information* -> *App-Specific
   Shared Secret* -> *Manage*) in RevenueCat plakken.
7. **Sandbox testers**: *Users and Access* -> *Sandbox* -> *Test Accounts* ->
   maak 2 testers aan met een nieuw e-mailadres (geen bestaand Apple ID). Op de
   iPhone: *Instellingen* -> *App Store* -> *Sandbox-account* -> inloggen.
   Tip: zet bij de tester *Renewal Rate* op "Monthly renewal every 5 minutes"
   zodat verlengen/aflopen snel te testen is.
8. In Xcode: target *Runner* -> *Signing & Capabilities* -> **+ In-App
   Purchase** (zet de capability op het App ID). De deployment target staat nu
   op iOS 13.0 (vereist door purchases_flutter 8).

## 2. Google Play Console

1. **Betalingsprofiel / merchant account**: *Instellingen* ->
   *Betalingsprofiel* (of *Monetarisatie instellen*) -> koppel een
   Google Payments merchant account met bank en btw. Zonder dit kun je geen
   producten maken.
2. Upload minstens één build (interne test) met de BILLING-permissie (zit er
   al in, via purchases_flutter en `AndroidManifest.xml`), anders kun je geen
   producten aanmaken.
3. *Monetariseren* -> *Producten* -> **Abonnementen**:
   - Abonnement **`bijbelquiz_premium_yearly`** -> **basisabonnement**
     (base plan), bv. id `jaarlijks`, *automatisch verlengend*, periode 1 jaar,
     prijs. Activeren.
     - Bij dat basisabonnement -> **Aanbieding toevoegen** -> id bv.
       `gratis-7-dagen`, geschiktheid **Nieuwe klant** (heeft dit abonnement
       nooit gehad), fase **Gratis proefperiode 7 dagen**. Activeren.
   - Abonnement **`bijbelquiz_premium_monthly`** -> basisabonnement bv.
     `maandelijks`, 1 maand, prijs, geen aanbieding. Activeren.
   - In RevenueCat verschijnen ze als `bijbelquiz_premium_yearly:jaarlijks`
     enz.; de code herkent beide vormen.
4. *Monetariseren* -> *Producten* -> **In-app-producten** (eenmalig) ->
   **`bijbelquiz_premium_lifetime`**, prijs, activeren.
5. **License testers**: *Instellingen* (Play Console, niet de app) ->
   **Licentietests** -> voeg de Gmail-adressen van testers toe, *Licentie-
   reactie* `RESPOND_NORMALLY`. Zet dezelfde mensen in de interne testtrack
   en laat ze de app installeren via de opt-in link. Testabonnementen
   verlengen versneld (jaar = 30 min, maand = 5 min, trial = 3 min).
6. **Service account voor RevenueCat**: volg RevenueCat ->
   *Google Play* -> *Service credentials* (Google Cloud -> project -> IAM ->
   service account maken -> JSON-sleutel downloaden; in Play Console ->
   *Gebruikers en rechten* -> service-account e-mail uitnodigen met
   rechten **Financiële gegevens bekijken**, **Bestellingen en abonnementen
   beheren**, **App-info bekijken**). Upload de JSON in RevenueCat. Het kan tot
   36 uur duren voordat Google de rechten doorvoert.
7. **Real-time developer notifications** (RTDN): in RevenueCat -> app
   (Android) -> *Google developer notifications* -> **Connect to Google**
   (RevenueCat maakt het Pub/Sub-topic). Kopieer de topic-naam
   (`projects/<project>/topics/<topic>`) naar Play Console -> *Monetarisatie
   instellen* -> **Real-time developer notifications** -> *Onderwerpnaam*, en
   klik **Testmelding verzenden**. In RevenueCat moet "Last received" bijwerken.

## 3. RevenueCat dashboard

1. **Project** "BijbelQuiz" (bestaat waarschijnlijk al).
2. **Apps**:
   - iOS: bundle id `com.bijbelquiz.app`, App-Specific Shared Secret, In-App
     Purchase Key (.p8 + Key ID + Issuer ID), en de Server Notifications-URL
     uit deze pagina in App Store Connect zetten (stap 1.5).
   - Android: package `com.bijbelquiz.app`, service account JSON (stap 2.6),
     RTDN (stap 2.7).
3. **Products**: importeer de producten van beide stores (*Products* ->
   *Import*). Je krijgt er 5-6: yearly + monthly + lifetime voor iOS en voor
   Android.
4. **Entitlement** `premium` (precies zo): koppel **alle** producten (beide
   stores, alle drie de plannen).
5. **Offering** `default` -> markeer als **Current** -> packages:
   - `$rc_annual` ("Annual"): iOS `bijbelquiz_premium_yearly`, Android
     `bijbelquiz_premium_yearly:jaarlijks`
   - `$rc_monthly` ("Monthly"): iOS `bijbelquiz_premium_monthly`, Android
     `bijbelquiz_premium_monthly:maandelijks`
   - `$rc_lifetime` ("Lifetime"): `bijbelquiz_premium_lifetime` (beide)
6. **Project settings -> Restore behavior**: kies **Keep with original App
   User ID** (aanbevolen bij een eigen accountsysteem: een aankoop blijft bij
   het account dat kocht; herstellen onder een ander account geeft in de app
   "Deze aankoop hoort al bij een ander BijbelQuiz-account"). Kies je
   "Transfer", dan verwerkt de server het `TRANSFER`-event ook (Premium gaat
   dan naar het nieuwe account en van het oude af).
7. **Integrations -> Webhooks -> Add**:
   - URL: `https://www.bijbelquiz.com/api/mobile/revenuecat-webhook`
   - **Authorization header value**: een lange willekeurige waarde, bv.
     `Bearer ` + 40 tekens uit een wachtwoordgenerator. Precies dezelfde
     waarde in Vercel als `REVENUECAT_WEBHOOK_AUTHORIZATION` (met of zonder
     `Bearer ` werkt allebei, zolang het geheim zelf gelijk is).
   - Environment: **Production and Sandbox** (sandbox-aankopen komen dan
     als `environment: 'sandbox'` in `payments`, en tellen niet als omzet).
   - Events: alle events (niet filteren). Klik **Send test event**: de server
     antwoordt 200 met `{ "test": true }`.
8. **API keys**:
   - **Public app-specific keys** (`appl_...` voor iOS, `goog_...` voor
     Android) -> de app (zie hieronder).
   - **Secret API key** (v1, `sk_...`) -> Vercel `REVENUECAT_SECRET_KEY`. Nooit
     in de app zetten.

## 4. Omgevingsvariabelen

### Vercel (Production; ook Preview als je daar test)

| Naam | Waarde |
|---|---|
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | dezelfde waarde als het Authorization-veld van de webhook |
| `REVENUECAT_SECRET_KEY` | RevenueCat secret key `sk_...` (de oudere naam `REVENUECAT_REST_API_KEY` werkt ook) |
| `REVENUECAT_PREMIUM_ENTITLEMENT_ID` | optioneel, standaard `premium` |

Zonder `REVENUECAT_WEBHOOK_AUTHORIZATION` weigert de webhook alles (401).
Zonder `REVENUECAT_SECRET_KEY` werkt alles nog, maar Premium komt pas na de
webhook (meestal seconden) en de server leunt dan op de event-gegevens; zet hem
dus wel.

### App (`--dart-define`)

| Naam | Waarde |
|---|---|
| `REVENUECAT_APPLE_KEY` | `appl_...` (public iOS key) |
| `REVENUECAT_GOOGLE_KEY` | `goog_...` (public Android key) |
| `REVENUECAT_TEST_KEY` + `REVENUECAT_USE_TEST_STORE=true` | alleen debug, RevenueCat Test Store; wordt in een release-build genegeerd |

In `lib/core/config/revenuecat_config.dart` staan al standaard public keys
(`appl_YqUI...`, `goog_Ppgk...`). Dat zijn geen geheimen, maar controleer in
RevenueCat -> *API keys* dat ze bij dit project horen; anders bij elke
release-build meegeven:

```bash
flutter build ipa --release \
  --dart-define=REVENUECAT_APPLE_KEY=appl_xxx --dart-define=REVENUECAT_GOOGLE_KEY=goog_xxx
flutter build appbundle --release \
  --dart-define=REVENUECAT_APPLE_KEY=appl_xxx --dart-define=REVENUECAT_GOOGLE_KEY=goog_xxx
```

## 5. Eenmalig in productie: oude Payment-indexen weg

De oude unieke indexen op `payments` waren "sparse" op een samengestelde
sleutel met `provider`; daardoor faalde de **tweede** RevenueCat-betaling
ooit (en de tweede Stripe-betaling zonder `externalTransactionId`) met een
duplicate-key-fout. De nieuwe (partial) indexen maakt Mongoose zelf aan na de
deploy. Daarna in de productie-database (mongosh / Atlas Data Explorer):

```js
db.payments.getIndexes()                       // controleer: provider_stripeSessionId_unique en provider_externalTransactionId_unique bestaan
db.payments.dropIndex('provider_1_stripeSessionId_1')
db.payments.dropIndex('provider_1_externalTransactionId_1')
```

## 6. Testen op apparaten

Gebruik een **test-account op bijbelquiz.com** (niet je eigen Premium-account)
en houd `/beheer/betalingen` en de RevenueCat *Customer*-pagina van dat account
(zoek op het user id) open.

### iOS (sandbox, TestFlight of Xcode-build)

1. iPhone: *Instellingen -> App Store -> Sandbox-account* = sandbox tester.
2. App openen, uitgelogd: paywall openen -> prijzen komen uit de store (euro,
   "7 dagen gratis" bij Jaarlijks). Tik *Probeer 7 dagen gratis* -> melding
   "Account nodig" en het loginscherm. Tik *Herstellen* -> idem.
3. Inloggen met het test-account. Paywall -> **Jaarlijks** -> kopen ->
   bevestigen. Verwacht: "Welkom bij Premium", paywall sluit, quizzen/uitleg
   open. RevenueCat: klant = user id, actief entitlement `premium`, trial.
   Server: account Premium; op de website ook Premium. Geen Payment-rij (trial
   is gratis). Melding toestemming -> ja: de proefperiode-herinnering is
   ingepland (met de versnelde sandbox-verlenging komt hij meteen of niet;
   echte timing = dag 5).
4. Wacht op de eerste verlenging (sandbox: minuten). RevenueCat stuurt
   `RENEWAL` -> `payments` krijgt een rij: provider `revenuecat`, store
   `app_store`, plan `yearly`, bedrag in centen, `environment: 'sandbox'`,
   `isTrialConversion: true`.
5. **Opnieuw kopen** terwijl Premium actief is: paywall opent niet (stapt
   opzij). Bij een account met Premium via de website: idem, en een directe
   aankoop meldt "Je hebt al Premium op dit account".
6. **Opzeggen**: iPhone *Instellingen -> Apple ID -> Abonnementen* (sandbox:
   *App Store -> Sandbox-account -> Beheer*) -> opzeggen. RevenueCat:
   `CANCELLATION`; Premium blijft tot het einde van de periode; daarna
   `EXPIRATION` -> Premium uit (tenzij website/groep/levenslang).
7. **Herstellen**: app verwijderen, opnieuw installeren, inloggen met
   hetzelfde account -> Premium staat er al (server). *Instellingen ->
   Aankopen herstellen* en *Herstellen* op de paywall: "Premium hersteld" of
   "Niets om te herstellen" als er niets is.
8. **Ander account, zelfde Apple ID**: uitloggen, met een tweede account
   inloggen, *Herstellen* -> melding "hoort al bij een ander account" (bij
   restore behavior "Keep"). Het tweede account krijgt geen Premium.
9. **Levenslang**: met een derde account -> paywall -> *Levenslang* -> kopen.
   RevenueCat: `NON_RENEWING_PURCHASE`. Server: Premium, `hasLifetimePremium`,
   Payment `lifetime`.
10. **Terugbetaling** (refund): in sandbox kun je via Xcode StoreKit Testing
    (*Debug -> StoreKit -> Manage Transactions -> Refund*) of in TestFlight via
    `reportaproblem.apple.com` een refund doen; productie-refunds komen via
    Apple. RevenueCat stuurt `CANCELLATION` met reden `CUSTOMER_SUPPORT` ->
    Premium direct uit, Payment `status: 'refunded'`.
11. **Ask to Buy** (gezinsdeling, kind-account): kopen -> melding "Even geduld
    - je aankoop wacht nog op goedkeuring". Na goedkeuring door de ouder gaat
    Premium vanzelf aan (app hoeft niet opnieuw open; bij openen zeker).
12. **Instellingen**: met store-Premium staat bij *Premium* "Abonnement
    beheren" en dat opent de abonnementspagina van Apple.

### Android (license tester, interne testtrack)

1. Telefoon met het Google-account van een license tester; app uit de interne
   testtrack (Play-versie, niet een debug-APK met andere signing).
2. Zelfde stappen als iOS 2-9: kopen (testbetaling "Test card, always
   approves"), trial (verlengt na ~3 min), maand/jaar (5/30 min), opzeggen
   via *Play Store -> Betalingen en abonnementen -> Abonnementen*, herstellen,
   levenslang.
3. **Pending**: kies testbetaling "Slow test card, approves after a few
   minutes" -> melding "Even geduld"; na een paar minuten gaat Premium aan.
   "Slow test card, declines" -> geen Premium.
4. **Refund**: Play Console -> *Bestellingen* -> bestelling -> **Terugbetalen**
   (met "Recht intrekken"). RevenueCat: `CANCELLATION` / `CUSTOMER_SUPPORT` ->
   Premium uit, Payment `refunded`.
5. **Account-hold / betaalprobleem**: testbetaling "declines" bij verlenging
   -> `BILLING_ISSUE`; Premium blijft tijdens de grace period, daarna
   `EXPIRATION`.
6. **Pauzeren** (als aangezet in Play): `SUBSCRIPTION_PAUSED`; Premium loopt
   tot het einde van de betaalde periode.
7. Instellingen -> *Premium* -> "Abonnement beheren" opent Play-abonnementen.

### Wat je controleert na elke stap

- RevenueCat *Customer history*: het event staat er, webhook "200".
- `payments`: alleen echte betalingen (geen trial-start), juiste valuta en
  bedrag, `environment` klopt.
- Account op de website (`/instellingen`, `/premium`) toont hetzelfde Premium
  als de app.
- Een account dat al via de website/Stripe of een groepslicentie Premium heeft,
  krijgt in de app nooit een betaalscherm.
