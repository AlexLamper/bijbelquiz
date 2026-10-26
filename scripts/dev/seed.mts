/**
 * Seeds the local database with everything the website needs to be looked
 * at: accounts in every state, quizzes across several Bible books, played
 * attempts (so the dashboard, profile and ranglijst have data), player
 * groups and a duel that is waiting for Alex.
 *
 *   scripts/dev/mongod.sh
 *   npm run dev:seed            # node --import tsx scripts/dev/seed.mts
 *   npm run dev:seed -- --reset # drop the dev database first
 *
 * Refuses to run against anything that is not a localhost MongoDB.
 *
 * ACCOUNTS (password for all: test1234)
 *   alex@voorbeeld.nl     free user with progress, a half-played quiz and a duel
 *   beheer@voorbeeld.nl   admin
 *   lotte@voorbeeld.nl    premium (Stripe, active subscription)
 *   sanne@voorbeeld.nl    premium (lifetime)
 *   daan@, jonas@, noor@, ruben@voorbeeld.nl   free players on the ranglijst
 *   nieuw@voorbeeld.nl    brand new, never played
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Mirrors Next.js precedence: .env.local overrides .env.
for (const file of ['.env', '.env.local']) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const MONGODB_URI = process.env.MONGODB_URI ?? '';
const RESET = process.argv.includes('--reset');
export const SEED_PASSWORD = 'test1234';

if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(MONGODB_URI)) {
  console.error(`Refusing to seed ${MONGODB_URI || '(empty MONGODB_URI)'}: only a localhost MongoDB may be seeded.`);
  process.exit(2);
}

type Q = { text: string; answers: { text: string; isCorrect: boolean }[]; explanation: string; bibleReference: string };

function q(text: string, correct: string, wrong: string[], explanation: string, bibleReference: string): Q {
  // Correct answer at a stable but varying position, so it is not always first.
  const index = (text.length + correct.length) % (wrong.length + 1);
  const answers = wrong.map((w) => ({ text: w, isCorrect: false }));
  answers.splice(index, 0, { text: correct, isCorrect: true });
  return { text, answers, explanation, bibleReference };
}

interface SeedQuiz {
  title: string;
  slug: string;
  category: string;
  description: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  isPremium?: boolean;
  questions: Q[];
}

const CATEGORIES = [
  { title: 'Oude Testament', slug: 'oude-testament', description: 'Van Genesis tot Maleachi.', sortOrder: 1 },
  { title: 'Nieuwe Testament', slug: 'nieuwe-testament', description: 'Van Mattheüs tot Openbaring.', sortOrder: 2 },
  { title: 'Algemeen', slug: 'algemeen', description: 'Vragen over de hele Bijbel.', sortOrder: 3 },
  { title: "Thema's", slug: 'themas', description: 'Per onderwerp.', sortOrder: 4 },
];

const QUIZZES: SeedQuiz[] = [
  {
    title: 'Brood voor 5000',
    slug: 'johannes-6-brood-voor-5000',
    category: 'nieuwe-testament',
    description: 'Jezus geeft een menigte te eten met vijf broden en twee vissen.',
    questions: [
      q('Bij welk meer gaf Jezus de menigte te eten?', 'Het meer van Galilea', ['De Jordaan', 'De Dode Zee', 'Het meer van Merom'], 'Jezus ging naar de overkant van het meer van Galilea, dat ook het meer van Tiberias heet.', 'Johannes 6:1'),
      q('Welk Joods feest was dichtbij?', 'Het Pascha', ['Het Loofhuttenfeest', 'Het Pinksterfeest', 'Het Purimfeest'], 'Johannes vertelt dat het Pascha, het feest van de Joden, dichtbij was.', 'Johannes 6:4'),
      q('Aan welke discipel vroeg Jezus waar ze brood konden kopen?', 'Filippus', ['Petrus', 'Andreas', 'Thomas'], 'Jezus vroeg het aan Filippus om hem op de proef te stellen. Hij wist zelf al wat Hij ging doen.', 'Johannes 6:5'),
      q('Hoeveel broden had de jongen bij zich?', '5', ['3', '7', '12'], 'Andreas wees Jezus op een jongen met vijf gerstebroden en twee vissen.', 'Johannes 6:9'),
      q('Hoeveel denarieën brood was volgens Filippus nog niet genoeg?', '200 denarieën', ['100 denarieën', '50 denarieën', '300 denarieën'], 'Filippus rekende uit dat zelfs tweehonderd denarieën brood niet genoeg was om iedereen een klein stukje te geven.', 'Johannes 6:7'),
      q('Welke discipel wees Jezus op de jongen?', 'Andreas', ['Johannes', 'Jakobus', 'Filippus'], 'Andreas, de broer van Simon Petrus, zag de jongen met de broden en de vissen.', 'Johannes 6:8'),
      q('Wat deed Jezus voordat Hij het brood uitdeelde?', 'Hij dankte God', ['Hij brak het in twaalf stukken', 'Hij zond de menigte weg', 'Hij ging de berg op'], 'Jezus nam de broden, dankte en deelde uit aan wie daar zaten.', 'Johannes 6:11'),
      q('Hoeveel mannen aten er mee?', 'Ongeveer 5000', ['Ongeveer 500', 'Ongeveer 3000', 'Ongeveer 10.000'], 'De mannen gingen zitten, ongeveer vijfduizend in getal.', 'Johannes 6:10'),
      q('Hoeveel manden met brokken bleven er over?', '12', ['7', '5', '2'], 'De discipelen vulden twaalf manden met de brokken van de vijf gerstebroden.', 'Johannes 6:13'),
      q('Wat wilden de mensen daarna met Jezus doen?', 'Hem koning maken', ['Hem stenigen', 'Hem wegsturen', 'Hem een huis geven'], 'Toen Jezus merkte dat ze Hem met geweld koning wilden maken, trok Hij zich terug op de berg.', 'Johannes 6:15'),
    ],
  },
  {
    title: 'De bruiloft in Kana',
    slug: 'johannes-2-de-bruiloft-in-kana',
    category: 'nieuwe-testament',
    description: 'Het eerste teken van Jezus: water wordt wijn.',
    questions: [
      q('Wat raakte op tijdens de bruiloft?', 'De wijn', ['Het brood', 'Het water', 'De olie'], 'De moeder van Jezus zei tegen Hem: Zij hebben geen wijn.', 'Johannes 2:3'),
      q('Hoeveel stenen watervaten stonden er?', '6', ['3', '7', '12'], 'Er stonden zes stenen watervaten voor de reiniging van de Joden.', 'Johannes 2:6'),
      q('Wie proefde het water dat wijn geworden was als eerste?', 'De ceremoniemeester', ['De bruidegom', 'Maria', 'Petrus'], 'De ceremoniemeester proefde het water dat wijn geworden was en wist niet waar het vandaan kwam.', 'Johannes 2:9'),
      q('Wat zei de ceremoniemeester over de goede wijn?', 'Dat die tot nu bewaard was', ['Dat die te zoet was', 'Dat die uit Jeruzalem kwam', 'Dat die te duur was'], 'Iedereen schenkt eerst de goede wijn, maar u hebt de goede wijn tot nu bewaard.', 'Johannes 2:10'),
      q('Hoe noemt Johannes dit wonder?', 'Het begin van de tekenen', ['Het laatste teken', 'Een gelijkenis', 'Een droom'], 'Dit heeft Jezus gedaan als begin van de tekenen, in Kana in Galilea.', 'Johannes 2:11'),
    ],
  },
  {
    title: 'De verloren zoon',
    slug: 'lucas-15-de-verloren-zoon',
    category: 'nieuwe-testament',
    description: 'De gelijkenis van de vader en zijn twee zonen.',
    questions: [
      q('Wat vroeg de jongste zoon aan zijn vader?', 'Zijn deel van de erfenis', ['Een nieuw kleed', 'Een vrouw', 'Een stuk land'], 'De jongste zei: Vader, geef mij het deel van het bezit dat mij toekomt.', 'Lucas 15:12'),
      q('Welk werk deed de zoon in het verre land?', 'Varkens hoeden', ['Schapen scheren', 'Wijn persen', 'Vissen'], 'Hij werd naar het veld gestuurd om varkens te hoeden.', 'Lucas 15:15'),
      q('Wat deed de vader toen hij zijn zoon zag?', 'Hij rende naar hem toe', ['Hij sloot de deur', 'Hij stuurde een knecht', 'Hij wachtte binnen'], 'Toen hij nog ver weg was, zag zijn vader hem en werd met ontferming bewogen; hij liep naar hem toe.', 'Lucas 15:20'),
      q('Wat werd er geslacht voor het feest?', 'Het gemeste kalf', ['Een lam', 'Een geit', 'Een os'], 'Breng het gemeste kalf en slacht het, laten we eten en vrolijk zijn.', 'Lucas 15:23'),
      q('Hoe reageerde de oudste zoon?', 'Hij werd boos', ['Hij danste mee', 'Hij ging weg', 'Hij huilde'], 'De oudste zoon werd boos en wilde niet naar binnen gaan.', 'Lucas 15:28'),
      q('Wat zei de vader tegen de oudste zoon?', 'Alles wat van mij is, is van jou', ['Je krijgt niets', 'Ga ook maar weg', 'Je broer is beter'], 'Kind, jij bent altijd bij mij en al het mijne is van jou.', 'Lucas 15:31'),
    ],
  },
  {
    title: 'Jezus loopt op het water',
    slug: 'mattheus-14-jezus-loopt-op-het-water',
    category: 'nieuwe-testament',
    description: 'Een storm op het meer, en Petrus stapt uit de boot.',
    questions: [
      q('Hoe laat kwam Jezus naar de discipelen toe?', 'In de vierde nachtwake', ['Bij zonsopgang', 'Om middernacht', 'In de middag'], 'In de vierde nachtwake kwam Jezus naar hen toe, lopend over de zee.', 'Mattheüs 14:25'),
      q('Wat dachten de discipelen dat ze zagen?', 'Een spook', ['Een engel', 'Een vis', 'Mozes'], 'Ze werden bang en zeiden: Het is een spook.', 'Mattheüs 14:26'),
      q('Welke discipel liep naar Jezus toe over het water?', 'Petrus', ['Johannes', 'Andreas', 'Jakobus'], 'Petrus klom uit de boot en liep over het water om bij Jezus te komen.', 'Mattheüs 14:29'),
      q('Waarom begon Petrus te zinken?', 'Hij zag de wind en werd bang', ['De boot was te ver', 'Hij struikelde', 'Jezus liet hem los'], 'Toen hij de sterke wind zag, werd hij bang en begon te zinken.', 'Mattheüs 14:30'),
      q('Wat zei Jezus tegen Petrus?', 'Kleingelovige, waarom hebt u getwijfeld?', ['Ga terug naar de boot', 'Zwem naar de kant', 'Wacht op mij'], 'Jezus greep hem meteen en zei: Kleingelovige, waarom hebt u getwijfeld?', 'Mattheüs 14:31'),
    ],
  },
  {
    title: 'De geboorte van Jezus',
    slug: 'lucas-2-de-geboorte-van-jezus',
    category: 'nieuwe-testament',
    description: 'Bethlehem, de herders en de engelen.',
    questions: [
      q('Welke keizer liet iedereen inschrijven?', 'Augustus', ['Nero', 'Tiberius', 'Herodes'], 'Er ging een bevel uit van keizer Augustus dat heel de wereld ingeschreven moest worden.', 'Lucas 2:1'),
      q('Naar welke stad gingen Jozef en Maria?', 'Bethlehem', ['Nazareth', 'Jeruzalem', 'Kana'], 'Jozef ging naar de stad van David, die Bethlehem heet.', 'Lucas 2:4'),
      q('Waarin legde Maria het kind?', 'In een kribbe', ['In een mand', 'In een wieg', 'Op stro in een hoek'], 'Zij wikkelde Hem in doeken en legde Hem in de kribbe, omdat er geen plaats was in de herberg.', 'Lucas 2:7'),
      q('Aan wie verscheen de engel in het veld?', 'Herders', ['Wijzen', 'Vissers', 'Soldaten'], 'Er waren herders in die streek die de nachtwacht hielden over hun kudde.', 'Lucas 2:8'),
      q('Wat zong het hemelse leger?', 'Eer zij aan God in de hoogste hemelen', ['Hosanna in de hoogte', 'Heilig, heilig, heilig', 'De Heere is mijn herder'], 'Eer zij aan God in de hoogste hemelen, en vrede op aarde, in mensen een welbehagen.', 'Lucas 2:14'),
    ],
  },
  {
    title: 'Pinksteren',
    slug: 'handelingen-2-pinksteren',
    category: 'nieuwe-testament',
    description: 'De Heilige Geest komt en Petrus spreekt de menigte toe.',
    questions: [
      q('Als wat verscheen de Geest aan de discipelen?', 'Tongen als van vuur', ['Een duif', 'Een wolk', 'Een regenboog'], 'Er verschenen hun tongen als van vuur, die zich verdeelden en op ieder van hen bleven.', 'Handelingen 2:3'),
      q('Wat dachten sommigen dat er met de discipelen was?', 'Dat ze dronken waren', ['Dat ze ziek waren', 'Dat ze droomden', 'Dat ze sliepen'], 'Anderen zeiden spottend: Zij zijn vol zoete wijn.', 'Handelingen 2:13'),
      q('Welke profeet haalde Petrus aan?', 'Joël', ['Jesaja', 'Amos', 'Micha'], 'Dit is wat gesproken is door de profeet Joël.', 'Handelingen 2:16'),
      q('Hoeveel mensen werden die dag gedoopt?', 'Ongeveer 3000', ['Ongeveer 120', 'Ongeveer 500', 'Ongeveer 5000'], 'Op die dag werden er ongeveer drieduizend zielen aan hen toegevoegd.', 'Handelingen 2:41'),
      q('Waarin volhardden de eerste gelovigen?', 'De leer van de apostelen, de gemeenschap, het breken van het brood en de gebeden', ['Vasten en offers', 'Reizen en prediken', 'Zingen en dansen'], 'Zij volhardden in de leer van de apostelen en in de gemeenschap, in het breken van het brood en in de gebeden.', 'Handelingen 2:42'),
    ],
  },
  {
    title: 'Door de Rode Zee',
    slug: 'exodus-14-door-de-rode-zee',
    category: 'oude-testament',
    description: 'Israël trekt droogvoets door de zee.',
    questions: [
      q('Wie zat Israël achterna?', 'De farao met zijn leger', ['De Filistijnen', 'De Amalekieten', 'De Edomieten'], 'De farao spande zijn wagen in en nam zijn volk met zich mee.', 'Exodus 14:6'),
      q('Wat moest Mozes doen met zijn staf?', 'Hem uitstrekken over de zee', ['Op de rots slaan', 'In het water gooien', 'In de grond steken'], 'Hef uw staf op, strek uw hand uit over de zee en splijt haar.', 'Exodus 14:16'),
      q('Waarmee dreef de HEERE de zee terug?', 'Een sterke oostenwind', ['Een aardbeving', 'Vuur', 'Een storm uit het westen'], 'De HEERE liet de zee die hele nacht wegvloeien door een krachtige oostenwind.', 'Exodus 14:21'),
      q('Wat gebeurde er met de wagens van de Egyptenaren?', 'De wielen liepen vast', ['Ze vlogen in brand', 'Ze reden terug', 'Ze zonken in het zand'], 'Hij liet de wielen van hun wagens wegraken, zodat zij ze met moeite vooruit konden krijgen.', 'Exodus 14:25'),
      q('Wie zong daarna een lied voor de HEERE?', 'Mozes en de Israëlieten', ['Aäron alleen', 'De farao', 'Jozua'], 'Toen zongen Mozes en de Israëlieten dit lied voor de HEERE.', 'Exodus 15:1'),
    ],
  },
  {
    title: 'Slaven in Egypte',
    slug: 'exodus-1-slaven-in-egypte',
    category: 'oude-testament',
    description: 'Een nieuwe farao die Jozef niet gekend had.',
    questions: [
      q('Welke steden bouwden de Israëlieten voor de farao?', 'Pitom en Raämses', ['Jericho en Ai', 'Sodom en Gomorra', 'Ninevé en Babel'], 'Zij bouwden voor de farao voorraadsteden: Pitom en Raämses.', 'Exodus 1:11'),
      q('Wat beval de farao de vroedvrouwen?', 'De jongetjes te doden', ['De meisjes te doden', 'Weg te gaan', 'Geen kinderen te helpen'], 'Als het een zoon is, dood hem dan, maar als het een dochter is, mag zij blijven leven.', 'Exodus 1:16'),
      q('Hoe heetten de vroedvrouwen?', 'Sifra en Pua', ['Ruth en Naomi', 'Lea en Rachel', 'Debora en Jaël'], 'De koning van Egypte zei tegen de vroedvrouwen, van wie de naam van de een Sifra was en die van de ander Pua.', 'Exodus 1:15'),
      q('Waarom gehoorzaamden de vroedvrouwen niet?', 'Zij vreesden God', ['Zij waren bang voor Mozes', 'Zij waren Egyptisch', 'Zij hadden geen tijd'], 'De vroedvrouwen vreesden God en deden niet wat de koning van Egypte tot hen gesproken had.', 'Exodus 1:17'),
    ],
  },
  {
    title: 'Jozef en zijn broers',
    slug: 'genesis-37-jozef-en-zijn-broers',
    category: 'oude-testament',
    description: 'De veelkleurige mantel en de put.',
    questions: [
      q('Wat gaf Jakob aan Jozef?', 'Een veelkleurig gewaad', ['Een ring', 'Een staf', 'Een kudde'], 'Israël had Jozef meer lief dan al zijn zonen en liet een veelkleurig gewaad voor hem maken.', 'Genesis 37:3'),
      q('Waar droomde Jozef over?', 'Schoven die voor zijn schoof bogen', ['Zeven magere koeien', 'Een ladder naar de hemel', 'Een brandende braamstruik'], 'Mijn schoof stond overeind en jullie schoven kwamen eromheen staan en bogen zich voor mijn schoof.', 'Genesis 37:7'),
      q('Welke broer wilde Jozef redden uit de put?', 'Ruben', ['Juda', 'Simeon', 'Benjamin'], 'Ruben hoorde dat en wilde hem uit hun hand redden.', 'Genesis 37:21'),
      q('Aan wie werd Jozef verkocht?', 'Ismaëlieten', ['Egyptenaren', 'Filistijnen', 'Moabieten'], 'Zij verkochten Jozef voor twintig zilverstukken aan de Ismaëlieten.', 'Genesis 37:28'),
      q('Wat deden de broers met het gewaad?', 'Ze doopten het in bokkenbloed', ['Ze verbrandden het', 'Ze verkochten het', 'Ze begroeven het'], 'Zij slachtten een geitenbok en doopten het gewaad in het bloed.', 'Genesis 37:31'),
    ],
  },
  {
    title: 'De ark van Noach',
    slug: 'genesis-6-de-ark-van-noach',
    category: 'oude-testament',
    description: 'De zondvloed en de regenboog.',
    questions: [
      q('Van welk hout moest de ark gemaakt worden?', 'Goferhout', ['Cederhout', 'Eikenhout', 'Acaciahout'], 'Maak voor uzelf een ark van goferhout.', 'Genesis 6:14'),
      q('Hoeveel verdiepingen had de ark?', '3', ['1', '2', '5'], 'U moet er een onderste, een tweede en een derde verdieping in maken.', 'Genesis 6:16'),
      q('Hoeveel dagen regende het?', '40 dagen en 40 nachten', ['7 dagen', '100 dagen', '150 dagen'], 'Ik zal het veertig dagen en veertig nachten laten regenen op de aarde.', 'Genesis 7:4'),
      q('Welke vogel liet Noach als tweede los?', 'Een duif', ['Een raaf', 'Een mus', 'Een arend'], 'Daarna liet hij een duif los om te zien of het water van de aardbodem afgenomen was.', 'Genesis 8:8'),
      q('Wat was het teken van het verbond?', 'De regenboog', ['Een altaar', 'Een ster', 'Een olijftak'], 'Mijn boog heb Ik in de wolken gegeven; die zal dienen als teken van het verbond.', 'Genesis 9:13'),
    ],
  },
  {
    title: 'David en Goliat',
    slug: '1-samuel-17-david-en-goliat',
    category: 'oude-testament',
    description: 'Een herdersjongen tegen een reus.',
    questions: [
      q('Uit welke stad kwam Goliat?', 'Gath', ['Askelon', 'Gaza', 'Ekron'], 'Toen kwam er een kampvechter uit het leger van de Filistijnen, Goliat uit Gath.', '1 Samuël 17:4'),
      q('Hoeveel stenen koos David uit de beek?', '5', ['1', '3', '7'], 'Hij koos voor zichzelf vijf gladde stenen uit de beek.', '1 Samuël 17:40'),
      q('Wat weigerde David te dragen?', 'De wapenrusting van Saul', ['Een schild', 'Sandalen', 'Een helm van brons'], 'David zei: Ik kan hierin niet lopen, want ik ben er niet aan gewend.', '1 Samuël 17:39'),
      q('In wiens naam kwam David naar Goliat?', 'In de Naam van de HEERE van de legermachten', ['In naam van Saul', 'In naam van Israël', 'In naam van zijn vader'], 'Ik kom naar u toe in de Naam van de HEERE van de legermachten, de God van de gelederen van Israël.', '1 Samuël 17:45'),
      q('Waarmee doodde David Goliat uiteindelijk?', 'Met Goliats eigen zwaard', ['Met zijn slinger', 'Met een speer', 'Met zijn staf'], 'David nam het zwaard van Goliat, trok het uit de schede en doodde hem ermee.', '1 Samuël 17:51'),
    ],
  },
  {
    title: 'In de leeuwenkuil',
    slug: 'daniel-6-in-de-leeuwenkuil',
    category: 'oude-testament',
    description: 'Daniël bidt ondanks het verbod van de koning.',
    questions: [
      q('Welke koning regeerde toen Daniël in de kuil kwam?', 'Darius', ['Nebukadnezar', 'Belsazar', 'Kores'], 'Darius de Meder ontving het koningschap.', 'Daniël 6:1'),
      q('Hoe vaak per dag bad Daniël?', '3 keer', ['1 keer', '2 keer', '7 keer'], 'Driemaal per dag knielde hij neer en bad en dankte voor zijn God.', 'Daniël 6:11'),
      q('Hoeveel dagen gold het verbod om te bidden?', '30 dagen', ['7 dagen', '40 dagen', '100 dagen'], 'Ieder die binnen dertig dagen een verzoek doet aan enige god of mens behalve aan u, koning, zal in de leeuwenkuil geworpen worden.', 'Daniël 6:8'),
      q('Wie sloot de muil van de leeuwen?', 'Een engel van God', ['Daniël zelf', 'De koning', 'Een soldaat'], 'Mijn God heeft Zijn engel gezonden en Hij heeft de muil van de leeuwen toegesloten.', 'Daniël 6:23'),
      q('Wat gebeurde er met de aanklagers van Daniël?', 'Zij werden in de kuil geworpen', ['Zij werden verbannen', 'Zij kregen vergeving', 'Zij werden koning'], 'Men wierp hen in de leeuwenkuil, hen, hun kinderen en hun vrouwen.', 'Daniël 6:25'),
    ],
  },
  {
    title: 'Jona en de grote vis',
    slug: 'jona-1-jona-en-de-grote-vis',
    category: 'oude-testament',
    description: 'Jona vlucht voor de opdracht naar Ninevé.',
    questions: [
      q('Naar welke stad moest Jona gaan?', 'Ninevé', ['Babel', 'Tarsis', 'Jeruzalem'], 'Sta op, ga naar de grote stad Ninevé en predik tegen haar.', 'Jona 1:2'),
      q('Waarheen vluchtte Jona?', 'Naar Tarsis', ['Naar Egypte', 'Naar Ninevé', 'Naar Damascus'], 'Jona stond op om naar Tarsis te vluchten, weg van het aangezicht van de HEERE.', 'Jona 1:3'),
      q('Hoe lang zat Jona in de vis?', '3 dagen en 3 nachten', ['1 dag', '7 dagen', '40 dagen'], 'Jona was drie dagen en drie nachten in het binnenste van de vis.', 'Jona 1:17'),
      q('Wat deed Jona in de vis?', 'Hij bad', ['Hij sliep', 'Hij zong', 'Hij vastte'], 'Toen bad Jona tot de HEERE, zijn God, vanuit het binnenste van de vis.', 'Jona 2:1'),
    ],
  },
  {
    title: 'Jona en de storm',
    slug: 'jona-1-jona-en-de-storm',
    category: 'oude-testament',
    description: 'De zeelieden werpen het lot.',
    questions: [
      q('Wat deden de zeelieden om de schuldige te vinden?', 'Zij wierpen het lot', ['Zij ondervroegen iedereen', 'Zij baden tot Baäl', 'Zij keken naar de sterren'], 'Laten wij het lot werpen, zodat wij weten door wie dit onheil ons overkomt.', 'Jona 1:7'),
      q('Wat deed Jona tijdens de storm?', 'Hij sliep', ['Hij bad', 'Hij hielp roeien', 'Hij sprong overboord'], 'Jona was in het ruim van het schip afgedaald en lag in een diepe slaap.', 'Jona 1:5'),
      q('Wat moesten de zeelieden volgens Jona doen?', 'Hem in zee werpen', ['Terugvaren', 'Bidden', 'De lading overboord gooien'], 'Neem mij op en werp mij in de zee; dan zal de zee u met rust laten.', 'Jona 1:12'),
    ],
  },
  {
    title: 'Ruth en Naomi',
    slug: 'ruth-1-ruth-en-naomi',
    category: 'oude-testament',
    description: 'Waar u heen gaat, zal ik ook gaan.',
    questions: [
      q('Uit welk land kwam Ruth?', 'Moab', ['Edom', 'Egypte', 'Ammon'], 'Zij namen voor zich Moabitische vrouwen; de naam van de ene was Orpa en die van de andere Ruth.', 'Ruth 1:4'),
      q('Hoe wilde Naomi genoemd worden toen zij terugkwam?', 'Mara', ['Ruth', 'Orpa', 'Hanna'], 'Noem mij niet Naomi, noem mij Mara, want de Almachtige heeft mij grote bitterheid aangedaan.', 'Ruth 1:20'),
      q('Op wiens akker ging Ruth aren lezen?', 'Boaz', ['Elimelech', 'Machlon', 'Obed'], 'Zij kwam terecht op een deel van de akker van Boaz.', 'Ruth 2:3'),
      q('Hoe heette de zoon van Ruth en Boaz?', 'Obed', ['Isaï', 'David', 'Chiljon'], 'Zij gaven hem de naam Obed; hij is de vader van Isaï, de vader van David.', 'Ruth 4:17'),
    ],
  },
  {
    title: 'Het feest van Ahasveros',
    slug: 'esther-1-het-feest-van-ahasveros',
    category: 'oude-testament',
    description: 'Een koningin die weigert te komen.',
    questions: [
      q('Hoeveel dagen duurde het feest van de koning?', '180 dagen', ['7 dagen', '40 dagen', '100 dagen'], 'Hij toonde de rijkdom van zijn koninkrijk, honderdtachtig dagen lang.', 'Esther 1:4'),
      q('Welke koningin weigerde te komen?', 'Vasthi', ['Esther', 'Zeres', 'Izebel'], 'Koningin Vasthi weigerde te komen op het bevel van de koning.', 'Esther 1:12'),
      q('In welke stad stond het paleis?', 'Susan', ['Babel', 'Ninevé', 'Persepolis'], 'In die dagen, toen koning Ahasveros op zijn koninklijke troon zat in de burcht Susan.', 'Esther 1:2'),
    ],
  },
  {
    title: 'Het boek Spreuken',
    slug: 'spreuken-het-boek-spreuken',
    category: 'oude-testament',
    description: 'Wijsheid van Salomo.',
    questions: [
      q('Wat is het begin van de kennis?', 'De vreze des HEEREN', ['Rijkdom', 'Een goede leraar', 'Veel boeken'], 'De vreze des HEEREN is het beginsel van de kennis.', 'Spreuken 1:7'),
      q('Naar welk dier moet de luiaard kijken?', 'De mier', ['De ezel', 'De os', 'De bij'], 'Ga naar de mier, luiaard, zie zijn wegen en word wijs.', 'Spreuken 6:6'),
      q('Wat is beter dan grote rijkdom?', 'Een goede naam', ['Een groot huis', 'Veel vrienden', 'Een lang leven'], 'Een goede naam is verkieslijker dan grote rijkdom.', 'Spreuken 22:1'),
    ],
  },
  {
    title: 'Vrouwen in de Bijbel',
    slug: 'thema-vrouwen-in-de-bijbel',
    category: 'themas',
    description: 'Van Eva tot Lydia.',
    isPremium: true,
    questions: [
      q('Wie verborg de verspieders in Jericho?', 'Rachab', ['Ruth', 'Debora', 'Mirjam'], 'Rachab had de verspieders op het dak verborgen onder vlasstengels.', 'Jozua 2:6'),
      q('Welke vrouw was rechter over Israël?', 'Debora', ['Hanna', 'Abigaïl', 'Jaël'], 'Debora, een profetes, gaf in die tijd leiding aan Israël.', 'Richteren 4:4'),
      q('Wie verkocht purper in Filippi?', 'Lydia', ['Priscilla', 'Dorkas', 'Martha'], 'Een vrouw genaamd Lydia, een purperverkoopster uit de stad Thyatira.', 'Handelingen 16:14'),
    ],
  },
  {
    title: 'Wie zei het?',
    slug: 'algemeen-wie-zei-het',
    category: 'algemeen',
    description: 'Bekende uitspraken uit de hele Bijbel.',
    questions: [
      q('Wie zei: "Ben ik mijn broeders hoeder?"', 'Kaïn', ['Abel', 'Set', 'Lamech'], 'Kaïn antwoordde: Ik weet het niet; ben ik de hoeder van mijn broer?', 'Genesis 4:9'),
      q('Wie zei: "Hier ben ik, zend mij"?', 'Jesaja', ['Jeremia', 'Mozes', 'Samuel'], 'Toen zei ik: Zie, hier ben ik, zend mij.', 'Jesaja 6:8'),
      q('Wie zei: "Mijn Heere en mijn God"?', 'Thomas', ['Petrus', 'Johannes', 'Paulus'], 'Thomas antwoordde en zei tegen Hem: Mijn Heere en mijn God!', 'Johannes 20:28'),
      q('Wie zei: "Spreek, want Uw dienaar hoort"?', 'Samuel', ['Eli', 'Saul', 'David'], 'Samuel zei: Spreek, want Uw dienaar hoort.', '1 Samuël 3:10'),
    ],
  },
];

interface SeedUser {
  email: string;
  name: string;
  role?: 'admin';
  premium?: 'stripe' | 'lifetime';
  /** Attempts: [quiz slug, score out of total]. In play order, oldest first. */
  plays: [string, number][];
  streak?: number;
  daysAgoStart?: number;
}

const USERS: SeedUser[] = [
  {
    email: 'alex@voorbeeld.nl',
    name: 'Alex',
    streak: 6,
    plays: [
      ['johannes-6-brood-voor-5000', 8],
      ['exodus-14-door-de-rode-zee', 4],
      ['genesis-6-de-ark-van-noach', 5],
      ['1-samuel-17-david-en-goliat', 3],
      ['lucas-15-de-verloren-zoon', 6],
      ['daniel-6-in-de-leeuwenkuil', 5],
    ],
  },
  { email: 'beheer@voorbeeld.nl', name: 'Beheerder', role: 'admin', premium: 'lifetime', plays: [['johannes-6-brood-voor-5000', 10]] },
  {
    email: 'lotte@voorbeeld.nl',
    name: 'Lotte',
    premium: 'stripe',
    streak: 12,
    plays: [
      ['johannes-6-brood-voor-5000', 10],
      ['jona-1-jona-en-de-grote-vis', 4],
      ['handelingen-2-pinksteren', 5],
      ['genesis-37-jozef-en-zijn-broers', 4],
      ['thema-vrouwen-in-de-bijbel', 3],
      ['mattheus-14-jezus-loopt-op-het-water', 5],
      ['ruth-1-ruth-en-naomi', 4],
    ],
  },
  {
    email: 'sanne@voorbeeld.nl',
    name: 'Sanne',
    premium: 'lifetime',
    streak: 3,
    plays: [
      ['johannes-6-brood-voor-5000', 9],
      ['exodus-14-door-de-rode-zee', 5],
      ['genesis-6-de-ark-van-noach', 5],
      ['1-samuel-17-david-en-goliat', 5],
      ['lucas-2-de-geboorte-van-jezus', 5],
      ['daniel-6-in-de-leeuwenkuil', 5],
      ['esther-1-het-feest-van-ahasveros', 3],
      ['spreuken-het-boek-spreuken', 3],
      ['algemeen-wie-zei-het', 4],
    ],
  },
  { email: 'daan@voorbeeld.nl', name: 'Daan', streak: 2, plays: [['genesis-6-de-ark-van-noach', 4], ['johannes-2-de-bruiloft-in-kana', 5], ['jona-1-jona-en-de-storm', 3]] },
  { email: 'jonas@voorbeeld.nl', name: 'Jonas', plays: [['exodus-14-door-de-rode-zee', 5], ['handelingen-2-pinksteren', 4], ['genesis-37-jozef-en-zijn-broers', 5], ['lucas-15-de-verloren-zoon', 5]] },
  { email: 'noor@voorbeeld.nl', name: 'Noor', plays: [['lucas-2-de-geboorte-van-jezus', 4], ['ruth-1-ruth-en-naomi', 2]] },
  { email: 'ruben@voorbeeld.nl', name: 'Ruben', plays: [['1-samuel-17-david-en-goliat', 2]] },
  { email: 'nieuw@voorbeeld.nl', name: 'Nieuw', plays: [] },
];

async function main() {
  const { connectDB, Category, Quiz, User, UserProgress, Duel, PlayerGroup } = await import('@/database');
  const { submitQuizAttempt } = await import('@/lib/quiz-submission');
  const { createDuel, joinDuelByInvite, getDuel, submitDuelAnswer } = await import('@/lib/duels/service');

  await connectDB();
  const db = mongoose.connection.db!;
  if (RESET) {
    await db.dropDatabase();
    console.log('dropped', db.databaseName);
  }

  // Categories ------------------------------------------------------------
  const categoryIds = new Map<string, mongoose.Types.ObjectId>();
  for (const category of CATEGORIES) {
    const doc = await Category.findOneAndUpdate({ slug: category.slug }, { $set: category }, { upsert: true, returnDocument: 'after' });
    categoryIds.set(category.slug, doc._id as mongoose.Types.ObjectId);
  }

  // Quizzes ---------------------------------------------------------------
  const quizIds = new Map<string, string>();
  for (const quiz of QUIZZES) {
    const existing = await Quiz.findOne({ slug: quiz.slug });
    const payload = {
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      categoryId: categoryIds.get(quiz.category),
      rewardXp: 50,
      difficulty: quiz.difficulty ?? 'medium',
      isPremium: Boolean(quiz.isPremium),
      status: 'approved' as const,
      questions: quiz.questions,
    };
    // save(), not updateOne: the pre-save hook fills refBook/refChapter.
    const doc = existing ? Object.assign(existing, payload) : new Quiz(payload);
    await doc.save();
    quizIds.set(quiz.slug, String(doc._id));
  }
  console.log(`${QUIZZES.length} quizzes, ${CATEGORIES.length} categories`);

  // Users -----------------------------------------------------------------
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const userIds = new Map<string, string>();
  for (const user of USERS) {
    const existing = await User.findOne({ email: user.email });
    if (existing) {
      // Re-seeding: wipe the account's play history so XP is not counted twice.
      await UserProgress.deleteMany({ userId: existing._id });
      await User.deleteOne({ _id: existing._id });
    }
    const created = await User.create({
      email: user.email,
      name: user.name,
      password: passwordHash,
      role: user.role ?? 'user',
      isPremium: Boolean(user.premium),
      premiumStripe: user.premium === 'stripe',
      hasLifetimePremium: user.premium === 'lifetime',
      stripeSubscriptionStatus: user.premium === 'stripe' ? 'active' : undefined,
      stripeCustomerId: user.premium === 'stripe' ? 'cus_local_seed' : undefined,
      stripeSubscriptionId: user.premium === 'stripe' ? 'sub_local_seed' : undefined,
      settings: { themePreference: 'light', showBibleReferences: true },
      createdAt: new Date(Date.now() - 40 * 86_400_000),
    });
    const userId = String(created._id);
    userIds.set(user.email, userId);

    // Attempts through the real submission path, so XP, level, streak and
    // badges are computed exactly as on the site. Spread over the last
    // weeks, newest last, so the monthly ranglijst differs from "altijd".
    const total = user.plays.length;
    for (const [index, [slug, score]] of user.plays.entries()) {
      const quizId = quizIds.get(slug);
      const quiz = QUIZZES.find((entry) => entry.slug === slug);
      if (!quizId || !quiz) throw new Error(`seed: unknown quiz ${slug}`);
      const totalQuestions = quiz.questions.length;
      const result = await submitQuizAttempt({
        userId,
        quizId,
        score: Math.min(score, totalQuestions),
        totalQuestions,
        answers: quiz.questions.map((question, qIndex) => {
          const correctIndex = question.answers.findIndex((a) => a.isCorrect);
          const wrongIndex = (correctIndex + 1) % question.answers.length;
          return { selectedAnswerIndex: qIndex < score ? correctIndex : wrongIndex };
        }),
        platform: 'web',
      });
      if (!result.ok) throw new Error(`seed: attempt failed for ${user.email}: ${result.reason}`);
      const daysAgo = Math.round(((total - 1 - index) / Math.max(1, total - 1)) * 45);
      await UserProgress.updateOne({ _id: result.attemptId }, { $set: { completedAt: new Date(Date.now() - daysAgo * 86_400_000 - index * 3600_000) } });
    }
    if (user.streak) {
      await User.updateOne({ _id: created._id }, { $set: { streak: user.streak, bestStreak: Math.max(user.streak, 7), lastPlayedAt: new Date() } });
    }
  }
  console.log(`${USERS.length} users (password: ${SEED_PASSWORD})`);

  // A group for the ranglijst side card ------------------------------------
  const alex = userIds.get('alex@voorbeeld.nl')!;
  const lotte = userIds.get('lotte@voorbeeld.nl')!;
  await PlayerGroup.deleteMany({ name: { $in: ['Jeugdvereniging', 'Catechisatie groep 3'] } }).catch(() => undefined);
  try {
    const members = ['alex@voorbeeld.nl', 'lotte@voorbeeld.nl', 'daan@voorbeeld.nl', 'noor@voorbeeld.nl'].map((email) => new mongoose.Types.ObjectId(userIds.get(email)!));
    await PlayerGroup.create({ name: 'Jeugdvereniging', ownerId: new mongoose.Types.ObjectId(alex), memberIds: members });
  } catch (error) {
    console.warn('player group skipped:', (error as Error).message.split('\n')[0]);
  }

  // A duel waiting for Alex -------------------------------------------------
  await Duel.deleteMany({ participants: new mongoose.Types.ObjectId(alex) });
  const created = await createDuel(alex, { mode: 'invite' });
  await joinDuelByInvite(lotte, created.inviteToken!);
  let duel = await getDuel(alex, created.duel.id);
  let moves = 0;
  // Play until it is Alex's turn with a few moves on the board.
  while (duel.status === 'active' && moves < 12) {
    const mover = duel.turn === 'me' ? alex : duel.turn === 'opponent' ? lotte : null;
    if (!mover) break;
    if (mover === alex && moves >= 6) break;
    const view = await getDuel(mover, duel.id);
    const roundIndex = view.currentRound - 1;
    const questionIndex = view.nextQuestionIndex ?? 0;
    const question = view.rounds[roundIndex]?.questions[questionIndex];
    if (!question) break;
    // The view hides the right answer until it is played; the stored duel
    // has it. Lotte gets one wrong so the score is not level.
    const stored = await Duel.findById(duel.id).lean();
    const choices = stored?.rounds[roundIndex]?.questions[questionIndex]?.answers ?? [];
    const right = choices.find((answer) => answer.isCorrect)?.answerId ?? question.answers[0].id;
    const wrong = choices.find((answer) => !answer.isCorrect)?.answerId ?? question.answers[0].id;
    const pick = mover === lotte && moves === 4 ? wrong : right;
    const submitted = await submitDuelAnswer(mover, duel.id, { roundIndex, questionIndex, answerId: pick });
    moves += 1;
    duel = await getDuel(alex, submitted.duel.id);
  }
  console.log(`duel ${duel.id}: ${duel.myScore} - ${duel.opponentScore}, turn: ${duel.turn}, ronde ${duel.currentRound}`);

  console.log('\nSign in at /inloggen with alex@voorbeeld.nl / test1234 (or any other seeded address).');
}

main()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
