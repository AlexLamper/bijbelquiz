# Betalingen op de website (Stripe) - instellen en testen

Dit is wat je zelf moet doen in Stripe en Vercel, zodat Premium op de website
(Jaarlijks met 7 dagen gratis, Maandelijks, Levenslang en de Groepslicentie)
van begin tot eind werkt. Premium hoort bij het account: een aankoop op de
website zet Premium ook in de app aan, en andersom (de app-kant staat in
`docs/setup/betalingen-app.md`).

Kort hoe het werkt:

- `/premium` -> knop -> `POST /api/stripe/checkout` -> Stripe Checkout.
- Na betalen komt de koper op `/premium/succes`. Die pagina controleert de
  betaling bij Stripe en zet Premium meteen aan.
- Alles daarna (proefperiode voorbij, verlengingen, mislukte betalingen,
  opzeggen in het portaal, terugbetalingen, chargebacks) komt binnen via de
  webhook `https://www.bijbelquiz.com/api/webhook/stripe`.
- Elke betaling komt in de collectie `payments` met het echte bedrag, ook elke
  verlenging (een rij per Stripe-factuur). Testbetalingen hebben
  `environment: 'sandbox'`, live betalingen `environment: 'production'`.
- "Beheer je abonnement" (op `/premium` en in Instellingen) opent het
  Stripe-klantportaal.
- Dag 5 van de proefperiode krijgt de koper een herinneringsmail.

---

## 0. Eenmalig in productie: oude Payment-indexen weg (eerst doen)

De oude unieke indexen op `payments` waren "sparse" op een samengestelde
sleutel met `provider`. Daardoor kon er maar **een** Stripe-betaling in de
database staan: elke volgende rij gaf een duplicate-key-fout en de webhook
antwoordde 500. Dezelfde stap staat in `betalingen-app.md` (hoofdstuk 5); je
hoeft hem maar een keer te doen.

1. Deploy eerst de nieuwe code (Mongoose maakt de nieuwe indexen
   `provider_stripeSessionId_unique`, `provider_externalTransactionId_unique`
   en `provider_stripeInvoiceId_unique` zelf aan bij het opstarten).
2. Open MongoDB Atlas -> je cluster -> Browse Collections -> `payments` ->
   tab Indexes, of gebruik `mongosh`:

```js
db.payments.getIndexes()   // controleer dat de drie *_unique indexen bestaan
db.payments.dropIndex('provider_1_stripeSessionId_1')
db.payments.dropIndex('provider_1_externalTransactionId_1')
```

Webhooks die in de tussentijd 500 gaven, probeert Stripe tot 3 dagen opnieuw;
die komen daarna vanzelf goed binnen.

3. Oude betalingen goedzetten (eenmalig, optioneel maar aanbevolen voor juiste
   omzet in /beheer): het script haalt alle betaalde abonnementsfacturen uit
   Stripe en schrijft ze met het echte bedrag weg, en ruimt de oude
   EUR 0-rijen op. Eerst droog, dan echt:

```bash
# MONGODB_URI en STRIPE_SECRET_KEY (live) in de omgeving of .env.local
node --import tsx scripts/backfill-stripe-payments.mts
node --import tsx scripts/backfill-stripe-payments.mts --apply --live
```

---

## 1. Producten en prijzen in Stripe

Doe dit eerst in **testmodus** (schakelaar "Test mode" rechtsboven in het
dashboard) en daarna nog een keer in **live**. Test en live hebben elk hun
eigen prijs-ids, webhook en sleutels.

Snelste weg: het script maakt alles aan wat ontbreekt (producten, prijzen,
webhook, portaal, betaalmethodes) en toont de regels voor je `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_... NEXTAUTH_URL=https://www.bijbelquiz.com npm run stripe:setup            # alleen kijken
STRIPE_SECRET_KEY=sk_test_... NEXTAUTH_URL=https://www.bijbelquiz.com npm run stripe:setup -- --apply  # aanmaken in test
STRIPE_SECRET_KEY=sk_live_... NEXTAUTH_URL=https://www.bijbelquiz.com npm run stripe:setup -- --apply --live
```

Met de hand (Product catalog -> + Add product), vier producten met elk een
prijs, valuta **EUR**:

| Product | Prijs | Type | Env var met de prijs-id (`price_...`) |
|---|---|---|---|
| BijbelQuiz Premium (jaarlijks) | € 39,99 | Recurring, Yearly | `STRIPE_PRICE_YEARLY` |
| BijbelQuiz Premium (maandelijks) | € 5,99 | Recurring, Monthly | `STRIPE_PRICE_MONTHLY` |
| BijbelQuiz Premium (levenslang) | € 74,99 | One-off | `STRIPE_PRICE_LIFETIME` |
| BijbelQuiz Groepslicentie (30 plekken) | € 99,00 | Recurring, Yearly | `STRIPE_PRICE_GROUP` |

- De prijs-id kopieer je bij het product -> Pricing -> de prijs -> "Copy price
  ID". Dat is de `price_...`, niet de `prod_...`.
- **Zet geen proefperiode op de prijs zelf** in Stripe. De 7 dagen gratis
  komen van de website (`STRIPE_TRIAL_DAYS=7`) en gelden alleen voor
  Jaarlijks. Maandelijks heeft geen proefperiode.
- Andere bedragen kan, de site toont dan het bedrag van Stripe. Wil je een
  vaste tekst, zet dan ook `NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_LABEL` (bijv.
  `€39,99`), `NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL` en
  `NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL`.
- Wil je de groepslicentie niet verkopen: laat `STRIPE_PRICE_GROUP` leeg, de
  pagina `/groepslicentie` toont dan een mailadres in plaats van de koopknop.

Betaalmethodes: Settings -> Payments -> Payment methods. Zet aan: **Cards,
iDEAL, SEPA Direct Debit, Apple Pay, Google Pay** (Link mag). iDEAL werkt ook
voor abonnementen: de verlengingen lopen dan via SEPA-incasso.

## 2. Webhook

Developers -> Webhooks -> **+ Add endpoint** (in test en in live apart):

- Endpoint URL: `https://www.bijbelquiz.com/api/webhook/stripe`
- API version: laat de standaard van je account staan (de code leest zowel de
  nieuwe als de oude vorm van facturen en abonnementen).
- Events (precies deze 15, "Select events"):

```
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
customer.subscription.trial_will_end
invoice.paid
invoice.payment_succeeded
invoice.payment_failed
charge.refunded
charge.dispute.created
charge.dispute.closed
```

  (De lijst staat ook in `src/lib/stripe-webhook-events.ts`; het
  setup-script gebruikt dezelfde lijst. Heb je al een endpoint met alleen de
  4 oude events: draai `npm run stripe:setup -- --apply`, dat voegt de rest
  toe, of vink ze aan via "Update details".)
- Na aanmaken: **Signing secret** -> "Reveal" -> kopieer de `whsec_...` naar
  `STRIPE_WEBHOOK_SECRET` (test-endpoint -> test-secret, live -> live).

Elke event-id wordt een keer verwerkt (collectie `webhookevents`): stuurt
Stripe hem nog eens, dan antwoordt de site "duplicate" en verandert er niets.
Gaat verwerken mis, dan antwoordt de site 500 en probeert Stripe het later
opnieuw.

## 3. Klantportaal (Beheer je abonnement)

Settings -> Billing -> **Customer portal** (test en live apart; het script
maakt een standaardconfiguratie als er nog geen is):

- Business information: privacy `https://www.bijbelquiz.com/privacybeleid`,
  voorwaarden `https://www.bijbelquiz.com/voorwaarden`.
- Invoices: **aan** (facturen bekijken).
- Payment methods: **aan** (betaalmethode wijzigen).
- Customer information: e-mail, naam, adres mag.
- **Cancel subscriptions: aan, "At end of billing period"** (niet
  "Immediately"). De site belooft: "je houdt Premium tot het einde van de
  periode die je al betaald hebt", en zo werkt de webhook ook: na opzeggen
  blijft de status `active` met "Opgezegd, Premium tot ..." tot Stripe aan het
  eind `customer.subscription.deleted` stuurt. Zeg je op in de proefperiode,
  dan betaal je niets.
- Subscription updates / "Customers can switch plans": mag aan, met de
  producten Jaarlijks en Maandelijks. De site leest het plan uit de nieuwe
  prijs, dus Premium en de betalingen kloppen na een wissel. Voeg de
  groepslicentie hier **niet** toe.
- Default redirect link: `https://www.bijbelquiz.com/premium` (de site geeft
  zelf ook een terugadres mee: de pagina waar je op de knop drukte).

## 4. Proefperiode en mails van Stripe

- `STRIPE_TRIAL_DAYS=7` in Vercel zet de 7 dagen gratis aan (alleen op
  Jaarlijks). Leeg of 0 = nergens een proefperiode en ook geen proeftekst.
- De herinnering op dag 5 stuurt de site zelf (zie 6). Zet in Stripe bij
  Settings -> Billing -> Subscriptions and emails -> "Manage free trial
  messaging" de herinneringsmail **uit**, anders krijgt de koper er twee.
- Aanbevolen aan onder Subscriptions and emails: "Send emails about failed
  payments" en Smart Retries (Manage failed payments). Na alle pogingen:
  "Cancel the subscription" of "Mark as unpaid" - beide sluiten Premium op de
  site af. Tijdens de pogingen (`past_due`) houdt de koper Premium en ziet op
  `/premium` "Je laatste betaling is niet gelukt".
- Ook handig: Settings -> Emails -> "Successful payments" en "Refunds" aan,
  dan krijgt de koper een bon.

## 5. Terugbetalen en chargebacks

- **Levenslang terugbetalen** (Payments -> betaling -> Refund, volledig):
  Premium gaat meteen uit en de betaling krijgt status `refunded`. Een
  gedeeltelijke terugbetaling laat Premium aan (bedrag staat in
  `amountRefunded`).
- **Abonnement terugbetalen**: een terugbetaling alleen zet een abonnement niet
  stop (Stripe blijft het abonnement verlengen). Wil je dat Premium stopt: ga
  naar de klant -> abonnement -> **Cancel subscription -> Immediately** en
  betaal de laatste factuur terug. De webhook zet Premium dan uit.
- **Groepslicentie volledig terugbetaald**: de licentie stopt meteen voor alle
  leden.
- **Chargeback (dispute)** op levenslang: Premium gaat uit zodra de dispute
  opent (Stripe houdt het geld dan al in), en weer aan als je hem wint. Verlies
  je hem, dan blijft Premium uit en staat de betaling op `refunded`.
- Premium van een andere bron (app-aankoop, groepslicentie, handmatig in de
  database gezet) wordt nooit door een Stripe-event uitgezet.

## 6. Vercel: environment variables

Project -> Settings -> Environment Variables. Zet ze voor **Production**
(live-waarden) en eventueel **Preview** (test-waarden). Daarna opnieuw
deployen.

| Naam | Waarde |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (Developers -> API keys -> Secret key). Preview: `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` van het live-endpoint uit stap 2 |
| `STRIPE_PRICE_YEARLY` | `price_...` Jaarlijks |
| `STRIPE_PRICE_MONTHLY` | `price_...` Maandelijks |
| `STRIPE_PRICE_LIFETIME` | `price_...` Levenslang |
| `STRIPE_PRICE_GROUP` | `price_...` Groepslicentie (of leeg) |
| `STRIPE_TRIAL_DAYS` | `7` |
| `NEXTAUTH_URL` | `https://www.bijbelquiz.com` (wordt gebruikt voor de terugkeer-URL's en de link in de herinneringsmail) |
| `CRON_SECRET` | een lange willekeurige tekst, bijv. uit `openssl rand -hex 32` |
| `SMTP_HOST` | bijv. `smtp.jouwprovider.nl` |
| `SMTP_PORT` | `587` (of `465` voor SSL) |
| `SMTP_USER` | gebruikersnaam van de mailbox |
| `SMTP_PASS` | wachtwoord / app-wachtwoord |
| `SMTP_FROM_EMAIL` | bijv. `BijbelQuiz <info@bijbelquiz.com>` (of `ACCOUNT_FROM_EMAIL`, die wint als beide gezet zijn) |
| `NEXT_PUBLIC_PREMIUM_*_PRICE_LABEL` | optioneel, zie stap 1 |

Belangrijk:

- Zonder SMTP gaat er geen herinneringsmail uit (alleen een regel in de log)
  en belooft de Premium-pagina dan ook **geen** "Herinnering op dag 5". Met
  SMTP staat die tekst er weer.
- **Cron**: `vercel.json` bevat een dagelijkse taak
  `GET /api/cron/trial-reminder` om 08:17 UTC. Vercel stuurt daarbij zelf
  `Authorization: Bearer <CRON_SECRET>` mee. Zonder `CRON_SECRET` weigert de
  route (503). Controleren: Vercel -> project -> Settings -> Cron Jobs (na de
  deploy staat hij daar), en daar kun je hem ook met "Run" handmatig starten.
  De herinnering gaat normaal al op tijd uit via het Stripe-event
  `customer.subscription.trial_will_end` (3 dagen voor het einde = dag 5); de
  cron vangt alles op wat de webhook miste. Elke proefperiode krijgt maar een
  mail.

## 7. Lokaal testen met de Stripe CLI

```bash
# eenmalig
stripe login

# .env.local: STRIPE_SECRET_KEY=sk_test_..., STRIPE_PRICE_* (test-ids), STRIPE_TRIAL_DAYS=7
stripe listen --forward-to localhost:3000/api/webhook/stripe
#   -> toont "Your webhook signing secret is whsec_..." : zet die in .env.local als
#      STRIPE_WEBHOOK_SECRET en herstart de dev server
npm run dev
```

(De dev server draait op poort 3000, of de poort die je gebruikt.)

Losse events afvuren kan ook, bijvoorbeeld `stripe trigger invoice.payment_failed`
- maar die horen bij een nep-klant zonder account, dus de site antwoordt
`user_not_found`. Echte proef: doorloop het testscript hieronder.

Cron lokaal aanroepen:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/trial-reminder
```

## 8. Testscript (Stripe testmodus)

Gebruik een nieuw testaccount op de site per scenario. Testkaarten: elke
toekomstige vervaldatum, elke CVC, elke postcode.

| Kaart | Wat er gebeurt |
|---|---|
| `4242 4242 4242 4242` | lukt altijd |
| `4000 0000 0000 0341` | koppelen lukt, maar elke **latere** afschrijving faalt (voor mislukte verlenging / proef die niet omzet) |
| `4000 0025 0000 3155` | vraagt 3D Secure; kies "Complete" |
| `4000 0000 0000 9995` | direct geweigerd (onvoldoende saldo) |
| `4000 0000 0000 0259` | lukt, maar wordt een dispute (chargeback) |
| iDEAL | kies een bank en klik "Authorize" of "Fail" op de testpagina |

1. **Jaarlijks met proef**: `/premium` -> Jaarlijks -> "Probeer 7 dagen
   gratis" -> betaal met 4242.
   - Succespagina: "Je proefperiode is gestart", Gratis tot <datum>,
     Herinnering <dag 5>, Daarna € 39,99 per jaar.
   - `/premium` toont "Je hebt Premium", Status Proefperiode, Gratis tot.
   - Database: user `stripeSubscriptionStatus: 'trialing'`,
     `stripeSubscriptionPlan: 'yearly'`, `stripeTrialReminderAt` = start + 4
     dagen; `payments` een rij `status: 'trial'`, `amount: 0`.
   - Stripe -> Webhooks -> endpoint: alle deliveries 200.
2. **Proef voorbij laten gaan** (zonder 7 dagen te wachten): Stripe ->
   Billing -> Subscriptions -> het abonnement -> "..." -> **End trial now**
   (heet soms "Update subscription" -> trial end "now").
   - Webhook: `customer.subscription.updated` (trialing -> active) en
     `invoice.paid` -> nieuwe rij in `payments` met `amount: 3999`,
     `status: 'completed'`.
3. **Herinnering**: Stripe stuurt `customer.subscription.trial_will_end` pas 3
   dagen voor het einde. Snel testen zonder wachten: zet bij de testgebruiker
   in de database `stripeTrialReminderAt` op een tijd in het verleden en roep
   de cron aan (`curl -H "Authorization: Bearer <CRON_SECRET>"
   https://<preview-of-localhost>/api/cron/trial-reminder`). Met SMTP komt de
   mail binnen (einddatum, € 39,99 per jaar, hoe je opzegt); zonder SMTP staat
   hij in de log. Nog een keer aanroepen stuurt niets meer
   (`stripeTrialReminderSentFor` = abonnement-id). Een proef die al is
   opgezegd krijgt geen mail.
4. **Maandelijks**: kies Maandelijks -> 4242. Succespagina "Welkom bij
   Premium", Volgende betaling <datum>; `payments` een rij `amount: 599`.
5. **Mislukte betaling**: start Jaarlijks met proef met kaart
   `4000 0000 0000 0341` (koppelen lukt, afschrijven niet) en doe daarna
   "End trial now" zoals in 2.
   - `invoice.payment_failed` -> rij `status: 'failed'`; abonnement
     `past_due`; `/premium` toont "Je laatste betaling is niet gelukt", Premium
     blijft aan zolang Stripe het opnieuw probeert.
   - In het portaal een werkende kaart (4242) instellen en in Stripe de factuur
     "Retry" / "Charge customer" -> `invoice.paid` -> dezelfde rij wordt
     `completed`, status weer `active`.
   - Of het abonnement opzeggen ("Cancel immediately") / alle pogingen laten
     mislukken -> Premium uit.
6. **Opzeggen in het portaal**: `/premium` -> "Beheer je abonnement" -> Cancel
   -> terug naar de site. `/premium`: Status Opgezegd, "Premium tot <datum>",
   Premium blijft aan. Daarna in Stripe "Cancel immediately" (of test clock
   voorbij de periode) -> `customer.subscription.deleted` -> Premium uit.
7. **Plan wisselen** (als aangezet in het portaal): Maandelijks -> Jaarlijks.
   `stripeSubscriptionPlan` wordt `yearly`, de factuur van de wissel komt als
   nieuwe betaling binnen.
8. **Levenslang**: "Of eenmalig: levenslang Premium" -> 4242. Succespagina
   "Je hebt levenslang Premium"; `payments` rij `planType: 'lifetime'`,
   `amount: 7499`. Daarna in Stripe Payments -> Refund (volledig) -> Premium
   uit, rij `status: 'refunded'`.
9. **Levenslang met iDEAL "Fail"** -> geen Premium, rij blijft `pending` of
   wordt `failed`. Met iDEAL "Authorize" -> Premium aan.
10. **Chargeback**: levenslang met `4000 0000 0000 0259` -> Stripe maakt een
    dispute -> Premium uit, rij `disputed`. In de dispute "Submit evidence"
    met de testtekst `winning_evidence` -> gewonnen -> Premium weer aan.
11. **Groepslicentie**: `/groepslicentie` -> kopen met 4242 -> succespagina
    "Je groepslicentie is actief" -> `/groepslicentie` toont de code. Een
    tweede account wordt lid met die code en heeft Premium.
12. **Dubbel kopen wordt geweigerd**: met een account dat al Premium heeft (ook
    via de app of levenslang) brengt de knop je terug naar `/premium` met "Je
    hebt Premium", er opent geen nieuwe checkout.
13. **Afbreken**: in Stripe Checkout op "terug" -> `/premium` met "Je betaling
    is niet afgerond".
14. **Succespagina met een niet-betaalde sessie** (open een checkout, betaal
    niet, plak `/premium/succes?session_id=<die id>`): er gaat geen Premium
    aan.

Controle in de admin: `/beheer/betalingen` toont de omzet uit `payments`
(alleen `status: 'completed'`; testbetalingen hebben `environment: 'sandbox'`).

## 9. Live zetten (checklist)

- [ ] Stap 0 gedaan (oude indexen weg) en eventueel het backfill-script.
- [ ] Live producten/prijzen, live webhook met de 15 events, live portaal.
- [ ] Stripe-herinneringsmail voor proefperiodes uit.
- [ ] Alle env vars uit stap 6 in Vercel Production, opnieuw gedeployd.
- [ ] Vercel -> Cron Jobs toont `/api/cron/trial-reminder`.
- [ ] Een echte aankoop van € 5,99 maandelijks met je eigen kaart, daarna
      meteen opzeggen en terugbetalen; webhook-deliveries allemaal 200.
