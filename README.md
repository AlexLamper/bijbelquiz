# BijbelQuiz

**BijbelQuiz** is een online platform waar je bijbelquizzen speelt. Alleen, of samen met vrienden, familie, je jeugdgroep of je klas. Er is een breed aanbod aan quizzen in verschillende categorieën en moeilijkheidsgraden, zodat je op een interactieve en toegankelijke manier je kennis van bijbelse personen, gebeurtenissen, plaatsen en thema's vergroot.

BijbelQuiz is er als website en als app voor iPhone en Android. Je speelt met één account: je voortgang loopt overal door.

Website: [https://www.bijbelquiz.com](https://www.bijbelquiz.com)

## 🌟 Waarom BijbelQuiz?

Wij geloven dat leren over de Bijbel leuk en toegankelijk kan zijn. BijbelQuiz daagt je uit met gevarieerde quizzen, zodat je je bijbelkennis spelenderwijs kunt verdiepen en testen.

### Wat je kunt doen

* **Quizzen spelen** - van eenvoudige instapquizzen tot pittige theologische vraagstukken, verdeeld over categorieën als Oude Testament, Nieuwe Testament, personen in de Bijbel en het leven van Jezus.
* **Samen spelen** - start een spel, deel de code, en speel live tegen elkaar. Meedoen is altijd gratis.
* **Eerst lezen, dan spelen** - bij veel quizzen lees je het bijbelgedeelte voordat de vragen beginnen.
* **Je voortgang bijhouden** - verdien XP, klim in niveau, houd je streak vast en vergelijk jezelf op de ranglijst.
* **Aanbevelingen op maat** - je krijgt quizzen voorgesteld die passen bij je niveau en je interesses.
* **Seizoenspakketten** - speciale quizzen rond Advent en de veertigdagentijd.

## 🔒 Premium

BijbelQuiz is gratis te gebruiken. Voor wie meer diepgang zoekt is er **Premium**:

* Toegang tot alle quizzen, ook de premium collectie.
* Volledige uitleg en bijbelverwijzing bij elke vraag - zo wordt elke quiz een mini-bijbelstudie.
* Een quiz-analyse achteraf en inzicht in je voortgang per bijbelboek.
* Onbeperkt zelf spellen hosten, met grotere groepen.

Premium is er per maand, per jaar of levenslang. Voor gemeenten, scholen en jeugdgroepen is er een **groepslicentie**: één aankoop waarmee je een hele groep in één keer toegang geeft.

Een aankoop geldt overal. Koop je in de app, dan is Premium ook op de website actief, en andersom.

## Lokaal ontwikkelen

Eenmalig: `npm install` en daarna `npm run dev:setup`. Dat maakt `.env.local` aan (uit `scripts/dev/env.local.example`, zonder echte geheimen), start een lokale MongoDB en vult die met testdata.

| Commando | Doet |
|---|---|
| `npm run dev:db` / `npm run dev:db:stop` | lokale MongoDB starten/stoppen (`scripts/dev/mongod.sh`, data in `.local/mongo`, poort 27027) |
| `npm run dev:seed` (`-- --reset` wist eerst alles) | testaccounts, quizzen over meerdere bijbelboeken, gespeelde pogingen voor de ranglijst, een groep en een duel |
| `npm run dev` | de site op http://localhost:3000 |
| `npm run dev:shot -- /dashboard --login alex@voorbeeld.nl` | schermafbeeldingen op 1440 en 390 breed in `.local/screenshots`, om naast `docs/web-2/screenshots` te leggen (`--dark`, `--out`, `--name`, `--base`) |

Testaccounts (wachtwoord overal `test1234`): `alex@voorbeeld.nl` (gratis, met voortgang en een duel), `beheer@voorbeeld.nl` (beheerder), `lotte@voorbeeld.nl` (Premium via Stripe), `sanne@voorbeeld.nl` (levenslang Premium), `daan@`, `jonas@`, `noor@`, `ruben@voorbeeld.nl` (spelers op de ranglijst), `nieuw@voorbeeld.nl` (nooit gespeeld).

De gedeelde componenten van het ontwerp 2.0 staan in `src/components/bq/` en zijn allemaal te zien op http://localhost:3000/dev/ui (alleen buiten productie). Kleuren en lettertypen staan in `src/app/globals.css`.

---

**Contact:** [info@bijbelquiz.com](mailto:info@bijbelquiz.com)

*Wilt u contact met ons opnemen of heeft u suggesties voor nieuwe quizvragen? Bezoek ook onze contactpagina op de website.*

Status: **Live & Actief** - actief in ontwikkeling.

Copyright © 2026 BijbelQuiz. Alle rechten voorbehouden.
