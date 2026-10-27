/**
 * The four cover style options, with the Dutch copy the index page and the
 * comparison sheets show for each.
 */

import type { Sample } from './samples.mjs';
import { OPTION_A } from './option-a-licht.mjs';
import { OPTION_B } from './option-b-vlak.mjs';
import { OPTION_C } from './option-c-papier.mjs';
import { OPTION_D } from './option-d-symbool.mjs';

export type CoverOption = {
  id: string;
  letter: string;
  name: string;
  tagline: string;
  idea: string;
  pros: string[];
  cons: string[];
  scale: string;
  render: (sample: Sample) => string;
};

export const OPTIONS: CoverOption[] = [
  {
    ...OPTION_A,
    tagline: 'De lichte silhouetscènes uit het 2.0-ontwerp, met meer diepte en detail.',
    idea: 'Bleke lucht, vier tot vijf lagen heuvels die naar achteren lichter worden, een witte zon en donkere silhouetten. Precies één accentkleur (goud of koraal) op het voorwerp waar het hoofdstuk om draait. Eén palet per boekgroep, afgeleid van de vier paletten in het goedgekeurde ontwerp.',
    pros: ['Sluit direct aan op de goedgekeurde 2.0-ontwerpen', 'Rustig en licht achter de UI-tekst', 'Verhaalhoofdstukken zijn goed herkenbaar'],
    cons: ['Figuren worden klein in een lijst-thumbnail', 'Brieven en abstracte hoofdstukken worden snel een algemeen landschap', 'Elke quiz vraagt een eigen compositie'],
    scale: 'Per quiz een eigen scène (10-20 regels: achtergrond + motieven). Palet, lagen, zon en waas komen automatisch uit de boekgroep. De bestaande 337 scènes kunnen grotendeels worden omgezet, daarna handmatig nalopen. Renderen: ongeveer 1 seconde per cover, ruim 5 minuten voor alles.',
  },
  {
    ...OPTION_B,
    tagline: 'Groot en grafisch: het voorwerp uit het hoofdstuk van dichtbij, in vier kleuren.',
    idea: 'Een poster-illustratie: één groot voorwerp of tafereel vooraan, voor een grote cirkel, in hooguit vier kleuren per boekgroep plus crème. Geen verlopen en geen waas; diepte komt uit overlap. Het meest uitgesproken en "merk-achtig" van de vier.',
    pros: ['Ook als kleine thumbnail meteen leesbaar', 'Krachtig en eigen, valt op in een raster', 'Werkt ook voor brieven (brief, zegel, voorwerp)'],
    cons: ['Kleuren zijn voller dan de rest van de 2.0-site', 'Meeste tekenwerk per quiz: elk hoofdstuk een eigen groot voorwerp', 'Risico op herhaling bij lange reeksen'],
    scale: 'Per quiz een eigen close-up compositie met grote, gedetailleerde voorwerpen (geschat 100+ nieuwe voorwerpen voor 337 quizzen). Het meeste handwerk van de vier. Renderen: ongeveer 0,6 seconde per cover, zo\'n 3 minuten voor alles.',
  },
  {
    ...OPTION_C,
    tagline: 'Gelaagd papier met zachte schaduwen, in tinten van één kleur per boekgroep.',
    idea: 'Vijf of zes vellen papier achter elkaar, licht achteraan en donker vooraan. Elk vel werpt een zachte schaduw, figuren zijn uit het vel geknipt en één stuk is van goudpapier. Een papieren zon in ringen, papieren wolken en een fijne papierstructuur.',
    pros: ['Warm, ambachtelijk en premium', 'Een boekreeks voelt als één set', 'Kan dezelfde scènes gebruiken als optie A'],
    cons: ['Onderwerp heeft minder contrast, vooral klein', 'Schaduwen worden bij thumbnails modderig', 'Renderen duurt het langst'],
    scale: 'Zelfde handwerk als A (één scène per quiz) en de papier-effecten komen gratis uit de laag-opbouw; A en C kunnen dus één scènebestand delen. Renderen: ongeveer 2,5 tot 3 seconden per cover, zo\'n 15 minuten voor alles.',
  },
  {
    ...OPTION_D,
    tagline: 'Eén sterk symbool per hoofdstuk in een wit medaillon, met het hoofdstuknummer groot ernaast.',
    idea: 'Een getint vlak per boekgroep met een rustig ringpatroon, een wit medaillon (zoals de witte kaarten van de site) met één symbool in twee kleuren, en het hoofdstuknummer groot in Fredoka, toon-op-toon. Thema-quizzen krijgen geen nummer.',
    pros: ['Beste leesbaarheid als thumbnail', 'Strak en consistent, "bekend product"-gevoel', 'Schaalt het best: bijna alles komt uit data'],
    cons: ['Minder verhaal en sfeer dan een scène', 'Hoofdstuknummer moet kloppen (deel-quizzen over meerdere hoofdstukken)', 'Abstracte hoofdstukken vragen een slim gekozen symbool'],
    scale: 'Per quiz alleen: symboolnaam + nummer. Vlak, patroon, kleuren en nummer komen uit de data. Werk zit in een symbolenbibliotheek (geschat 120-150 symbolen voor 337 quizzen, veel hergebruik). Renderen: ongeveer 1 seconde per cover, ruim 5 minuten voor alles.',
  },
];
