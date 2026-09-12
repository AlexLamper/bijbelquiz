# Vervolgplan: quiz covers + nieuwe /quizzen layouts

Status op 2026-09-10 avond. Sessie liep tegen een rate limit, 5 van de 8
parallelle agents zijn halverwege gestopt. Dit document zegt precies wat er
al staat en wat er nog moet gebeuren om verder te gaan.

## Wat klaar is (gecommit noch niet, maar op schijf en `tsc --noEmit` schoon)

**Covergeneratie, infrastructuur**
- `scripts/lib/quiz-cover-scene-kit.mts` (nieuw): de helpers (`base`, `fg`,
  `paletteFor`, `contextFor`, `renderSceneFor`, `MOODS`) uit
  `quiz-cover-scenes.mts` getrokken, zodat losse series-bestanden ze kunnen
  importeren zonder een cirkelvormige import. Render-output is byte-identiek
  aan voor de refactor (geverifieerd met sha1 op drie bestaande covers).
- `scripts/lib/quiz-cover-scenes.mts` (gewijzigd): importeert nu
  `MATTEUS_SCENES`, `LUCAS_SCENES`, `JOHANNES_SCENES` uit losse bestanden en
  spreidt ze in `SCENES`. Exporteert ook `SCENE_MODULES` (voor de
  dubbele-slug-check) en `renderScene` blijft werken zoals voorheen. De 143
  oorspronkelijke scenes staan nog steeds in dit bestand, ongewijzigd.
- `scripts/generate-quiz-covers.mts` (gewijzigd): controleert nu vooraf of
  een slug in twee scene-modules voorkomt en stopt met een foutmelding als
  dat zo is.
- `scripts/lib/quiz-cover-preview.mts` (nieuw): rendert de scenes van één
  module naar PNG (halve of volle grootte, optioneel een contactblad) zonder
  het echte covermap of de manifest aan te raken. Gebruikt door de agents om
  hun eigen werk te bekijken.
- `next.config.ts`: tijdelijke redirect `/quizzes/version-:n` ->
  `/quizzen/versie-:n` (permanent: false), zodat de secret url's ook onder de
  Engelse spelling werken. Weg te halen zodra een versie de echte `/quizzen`
  wordt.

**Cover-scenes per serie**
- `scripts/lib/quiz-cover-scenes-johannes.mts`: **compleet**, 29 scenes,
  zelf nagekeken door de agent (7 covers gecorrigeerd na eerste render).
  Manifest: `docs/quiz-image-prompts/manifest-johannes.json` (29 entries,
  geldig JSON-array).
- `scripts/lib/quiz-cover-scenes-matteus.mts`: **36 scenes geschreven**
  (matteus-bijbelquiz-deel-1 t/m -36, alle keys aanwezig), maar de agent is
  gestopt door de rate limit VOORDAT hij ze kon renderen en nakijken, en
  VOORDAT hij `docs/quiz-image-prompts/manifest-matteus.json` schreef. Dat
  bestand **ontbreekt nog**.
- `scripts/lib/quiz-cover-scenes-lucas.mts`: **35 scenes geschreven**
  (lucas-bijbelquiz-deel-1 t/m -35, alle keys aanwezig), zelfde situatie:
  gestopt voor het renderen/nakijken. Manifest
  `docs/quiz-image-prompts/manifest-lucas.json` bestaat wel al (35 entries) -
  waarschijnlijk net op tijd geschreven voor de limiet.

**`/quizzen` datalaag (gedeeld door alle vijf lay-outs, al in gebruik)**
- `src/lib/bible-books.ts` (nieuw): alle 66 bijbelboeken in canonieke
  volgorde, Nederlandse titel + korte vorm, testament, groep, aantal
  hoofdstukken. `BOOK_GROUPS` voor de groepslabels.
- `src/lib/quiz-index-data.ts` (nieuw): `loadQuizIndex(userId?)` - één
  loader die per quiz het boek, hoofdstukbereik en serie-info afleidt uit
  `refBook`/`refChapter` op de vragen, plus per boek het aantal quizzen en de
  gedekte hoofdstukken. Gebruikt door `/quizzen` zelf en door alle vijf
  `versie-*` pagina's.
- `src/app/quizzen/page.tsx` (gewijzigd): gebruikt nu `loadQuizIndex` in
  plaats van zijn eigen aggregatie. Functioneel ongewijzigd, getest op de
  dev server (`/quizzen` gaf 237 quizzen, HTTP 200).

**De vijf lay-outversies (secret url's)**

| Versie | Concept | Status |
|---|---|---|
| `/quizzen/versie-1` | Boekenrooster, hele Bijbel als grid van 66 tegels, klik opent inline paneel | **Compleet**, agent heeft zelf `tsc`/`eslint` gedraaid en gerapporteerd schoon |
| `/quizzen/versie-2` | Boekenplank met ruggen (Spine.tsx), breedte naar hoofdstukaantal | Bestanden compleet (page.tsx + BookPanel/BookshelfClient/library/QuizRow/Shelf/Spine), **maar agent is gestopt voor de eigen kwaliteitscontrole** (geen tsc/eslint-rapport, niet zelf bekeken) |
| `/quizzen/versie-3` | Inhoudsopgave, twee kolommen, hoofdstuknummers als links | **Compleet**, agent heeft zelf `tsc`/`eslint` gedraaid en gerapporteerd schoon |
| `/quizzen/versie-4` | Verkenner, twee panelen (rail + hoofdvlak), app-achtig | Bestanden compleet (page.tsx + BookPane/BookRail/FeaturedPane/library/QuizRow/SearchResults/ThemesPane/Verkenner), **maar agent is gestopt voor de eigen kwaliteitscontrole** |
| `/quizzen/versie-5` | Reis door de Bijbel, één lijn met haltes per boek | **Alleen de datalaag** (`route-data.ts`, 304 regels) is geschreven. Geen `page.tsx`, geen `route-data.ts` client-component, geen route bestaat. Grotendeels nog te doen. |

Belangrijk: `npx tsc --noEmit -p tsconfig.json` geeft op dit moment **geen
enkele fout** voor de hele repository, inclusief versie-2 en versie-4. Dat is
een goed teken maar geen vervanging voor de zelfcontrole die de agents
zouden hebben gedaan (rendering bekijken bestaat toch niet voor deze
pagina's, maar wel: eslint, en met het oog kijken of de lay-out klopt in een
browser).

## Wat nog moet gebeuren, in volgorde

### 1. Covers afronden (klein, kan zonder browser)
1. Genereer `docs/quiz-image-prompts/manifest-matteus.json` - een array van
   36 entries (`slug`, `title`, `file`, `imageUrl`, `scene`) in dezelfde
   vorm als `manifest-johannes.json`. De titels staan in
   `C:\Users\alexl\AppData\Local\Temp\claude\C--Projects-bijbelquiz\49513071-3e1a-4fa8-8770-8ecdca984c49\scratchpad\cover-brief-matteus.json`
   (als die scratchpad-map nog bestaat) of anders uit de losse
   `docs/quizzes/matteus/*.json`-bestanden. De `scene`-tekst mag een korte
   samenvatting zijn van het commentaar dat al boven elke scene in
   `quiz-cover-scenes-matteus.mts` staat.
2. Render en bekijk beide nog niet nagekeken series voor je ze samenvoegt:
   ```
   node --import tsx scripts/lib/quiz-cover-preview.mts scripts/lib/quiz-cover-scenes-matteus.mts MATTEUS_SCENES --out <tmp>/preview-matteus --sheet
   node --import tsx scripts/lib/quiz-cover-preview.mts scripts/lib/quiz-cover-scenes-lucas.mts LUCAS_SCENES --out <tmp>/preview-lucas --sheet
   ```
   Bekijk de contactbladen en een paar losse covers (Read-tool toont PNG's).
   Let op precies waar de johannes-agent op moest letten: motieven die boven
   of onder de grondlijn zweven, silhouetten die in elkaar overlopen, een
   onherkenbare scène, een figuur die door het kader wordt afgesneden, de zon
   achter een hoofd, elke cover die er hetzelfde uitziet. Herhaal tot schoon.
3. Voeg de drie manifest-bestanden samen in `docs/quiz-image-prompts/manifest.json`
   (nu 143 entries, moet 243 worden). Er stond al een merge-script klaar in
   deze sessie's scratchpad (`merge-manifest.mjs`) dat leest uit
   `manifest-matteus.json`/`manifest-lucas.json`/`manifest-johannes.json` en
   controleert op geldige velden, geen dubbele slugs en geen gedachtestreepjes
   - herschrijf het gewoon opnieuw als het er niet meer is, het is simpel.
4. Render alle 100 nieuwe covers naar `public/images/quizzes/`:
   ```
   node --import tsx scripts/generate-quiz-covers.mts --apply
   ```
   (Check eerst de exacte CLI-vlaggen in het bestand zelf - er was geen
   `--apply`-vlag in de oorspronkelijke versie, alleen schrijven naar
   `manifest.targetDir`; dus gewoon zonder argumenten voor alle covers, of
   met de specifieke 100 slugs als argumenten om alleen die te renderen.)
   Dit schrijft ook `src/lib/quiz-covers.generated.ts` opnieuw (moet dan 243
   slugs bevatten).
5. Wijs de covers toe aan de database-documenten:
   ```
   node --import tsx scripts/assign-quiz-images.mts --apply
   ```
   (env: `.env.local`, niet `.env` - de SRV-URI in `.env` faalt DNS op deze
   machine, zie memory `quiz-import-workflow`.)
6. Controleer op de dev-server dat een paar nieuwe quizpagina's nu hun eigen
   cover tonen in plaats van de categorieafbeelding
   (`/quiz/matteus-bijbelquiz-deel-1` etc.) en dat `/quizzen` er ook naar
   verwijst.

### 2. Versie-5 afmaken (grootste open stuk)
`src/components/quiz-index/versie-5/route-data.ts` bestaat al (de pure
data-laag: boeken op de route leggen, zoekfunctie, "uitgelicht"-keuze - lees
het bestand, het volgt hetzelfde patroon als de andere vier `library.ts`/
`shelves.ts`/`contents-model.ts` bestanden). Nog te doen, in de stijl van de
oorspronkelijke opdracht (zie hieronder de samenvatting van het concept):
- `src/app/quizzen/versie-5/page.tsx`: server component, zelfde vorm als de
  andere vier (`force-dynamic`, noindex metadata, sessie ophalen,
  `loadQuizIndex(session?.user?.id)`, doorgeven aan de client-component).
- `src/components/quiz-index/versie-5/*.tsx`: de route als hairline-lijn in
  een serpentine (rij voor rij, links-rechts-links), een halte per boek
  (cirkel, grootte naar quizaantal, gevuld voor boeken met quizzen, ring voor
  boeken zonder), groepslabels als segmenten van de route, een klik opent een
  paneel onder de route met de hoofdstukdekking en de quizlijst, een "Je was
  hier"-markering voor de laatst gespeelde plek bij een ingelogde lezer,
  zoekveld dat haltes dimt/oplicht. Zie de oorspronkelijke opdracht in de
  sessie-log voor de volledige spec (concept "Reis door de Bijbel"), of
  vraag het opnieuw als losse taak - de datalaag ligt er al, dus dit is vooral
  presentatie.
- Kwaliteitscontrole: `npx tsc --noEmit` en `npx eslint` op de nieuwe
  bestanden moeten schoon zijn.

### 3. Versie-2 en versie-4 nakijken
Deze twee hebben alle bestanden, maar de bouwende agent is gestopt vlak voor
de verplichte zelfcontrole (tsc/eslint draaien, en - voor deze twee lay-outs
extra belangrijk - de pagina daadwerkelijk bekijken, want een boekenplank
met breedtes naar hoofdstukaantal en een twee-panelen-verkenner zijn lay-outs
die makkelijk visueel mis kunnen gaan zonder dat TypeScript dat ziet). Nu al
wel bekend: de hele repository is `tsc --noEmit`-schoon, dus er is geen
typefout. Nog te doen:
- `npx eslint src/app/quizzen/versie-2 src/components/quiz-index/versie-2
  src/app/quizzen/versie-4 src/components/quiz-index/versie-4` en fouten
  oplossen.
- De pagina's echt bezoeken op de dev-server (`npm run dev`, dan
  `/quizzen/versie-2` en `/quizzen/versie-4`) op desktopbreedte en op
  telefoonbreedte (~390px), zowel uitgelogd als ingelogd. Let specifiek op:
  - versie-2: overlopen de plankrijen niet op mobiel (moeten horizontaal
    scrollen binnen hun eigen container, de pagina zelf nooit zijwaarts);
    is de tekst op de smalle boekruggen leesbaar; werkt de accordion-opening
    onder de juiste rij.
  - versie-4: werkt de linker rail correct als een verticale lijst die zijn
    eigen scroll heeft; wordt op mobiel de rail een horizontale chip-rij; is
    de `?boek=CODE`-parameter (of hash) een geldige diepe link.

### 4. Alle vijf versies screenshotten en vergelijken
Er stond een Playwright-scriptje klaar in de scratchpad van deze sessie
(`shoot-versions.mjs`) dat elke `/quizzen/versie-N` op desktop- en
telefoonbreedte bezoekt, een full-page screenshot maakt, en checkt op
JavaScript-fouten en horizontale overflow. Herschrijf het gewoon opnieuw als
het er niet meer is - het is een simpel Playwright-scriptje, minder dan 40
regels. Start de dev-server eerst op een vaste poort (bijv.
`PORT=3005 npm run dev`, zie memory `dev-port-collision`: gebruik `localhost`
of `[::1]`, nooit `127.0.0.1`), en zorg dat er een testaccount met
speelgeschiedenis is als je de ingelogde variant wilt zien (de meeste
lay-outs tonen dan een "verder gaan"-kaart en voortgangsvinkjes).

### 5. Kiezen en opschonen
Zodra de screenshots er zijn: één versie kiezen om `/quizzen` te worden (of
de gebruiker laten kiezen). Daarna:
- De gekozen versie se bestanden verplaatsen/hernoemen naar `src/app/quizzen/
  page.tsx` en `src/components/quiz-index/<naam>/` (of gewoon rechtstreeks
  in `src/components/`, zoals de rest van de site is opgezet), en de oude
  `QuizzesClient.tsx`-aanpak laten vervallen.
- De vier afgewezen versies weghalen: hun map onder `src/app/quizzen/versie-*`,
  hun map onder `src/components/quiz-index/versie-*`, en de tijdelijke
  redirect in `next.config.ts` (`/quizzes/version-:n`).
- `git add`/commit in twee stappen zoals gebruikelijk in dit project: eerst
  de covers (nieuwe scene-bestanden, manifest, gegenereerde PNG's,
  `quiz-covers.generated.ts`, de assign-script-run), dan de gekozen
  `/quizzen`-lay-out.

## Losse aandachtspunten
- Alle scratchpad-bestanden waar dit plan naar verwijst
  (`cover-briefs.mjs`, `merge-manifest.mjs`, `shoot-versions.mjs`,
  `cover-brief-*.json`) stonden in de sessie-tijdelijke map onder
  `C:\Users\alexl\AppData\Local\Temp\claude\...\scratchpad\` - die map kan
  na het sluiten van de sessie zijn opgeruimd. Ze waren klein en zijn zonder
  moeite opnieuw te schrijven; de instructies hierboven zijn compleet genoeg
  om dat te doen zonder de oude bestanden nodig te hebben.
- Geen enkel bestand hierboven is nog gecommit. `git status --short` laat
  precies zien wat er nu op schijf staat te wachten.
- De hue-reeksen per serie (Matteüs vanaf 300, Lucas vanaf 120, Johannes
  vanaf 20, elk +2 per deel) zijn met opzet zo gekozen dat ze niet overlappen
  met bestaande series en onderling niet overlappen - laat dat zo bij het
  nakijken.
