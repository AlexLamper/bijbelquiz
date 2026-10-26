'use client';

import * as React from 'react';

import {
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Modal,
  PasswordInput,
  SearchInput,
  SectionTitle,
  Select,
  SiteHeader,
  Switch,
  Tabs,
  Textarea,
  ThemeToggle,
  toast,
} from '@/components/bq';

/** The header in both states; the gallery is outside the real shell. */
export function GalleryHeaders() {
  return (
    <div className="flex flex-col">
      <SiteHeader preview={{ signedIn: false }} />
      <SiteHeader preview={{ signedIn: true, name: 'Alex', xp: 1240, streak: 6, isAdmin: true }} />
    </div>
  );
}

export function GalleryInteractive() {
  const [period, setPeriod] = React.useState<'month' | 'all'>('month');
  const [filter, setFilter] = React.useState('all');
  const [refs, setRefs] = React.useState(true);
  const [first, setFirst] = React.useState(false);
  const [modal, setModal] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);
  const [locked, setLocked] = React.useState(false);

  return (
    <>
      <section id="forms" aria-labelledby="forms-title" className="flex flex-col gap-4">
        <SectionTitle id="forms-title" title="Formulieren" />
        <div className="grid gap-4 m:grid-cols-2">
          <Card padding="lg" className="flex flex-col gap-4">
            <Field label="E-mailadres" htmlFor="g-email">
              <Input id="g-email" type="email" autoComplete="email" placeholder="naam@voorbeeld.nl" />
            </Field>
            <Field label="Wachtwoord" htmlFor="g-pass" aside={<a href="#forms">Wachtwoord vergeten?</a>}>
              <PasswordInput id="g-pass" autoComplete="current-password" placeholder="Je wachtwoord" />
            </Field>
            <Field label="Naam" htmlFor="g-name" error="Kies een naam van minstens 2 tekens.">
              <Input id="g-name" defaultValue="A" invalid />
            </Field>
            <Field label="Bericht" htmlFor="g-msg" hint="We antwoorden meestal binnen een dag.">
              <Textarea id="g-msg" placeholder="Waar kunnen we je mee helpen?" rows={3} />
            </Field>
            <Checkbox label="Ik ga akkoord met de voorwaarden" />
            <Button size="xl" block>Inloggen</Button>
          </Card>
          <Card padding="lg" className="flex flex-col gap-4">
            <SearchInput aria-label="Zoek een quiz" placeholder="Zoek een bijbelboek of onderwerp" />
            <Field label="Tijd per vraag" htmlFor="g-timer">
              <Select id="g-timer" size="sm" defaultValue="0">
                <option value="0">Geen tijdslimiet</option>
                <option value="30">30 seconden per vraag</option>
                <option value="60">60 seconden per vraag</option>
              </Select>
            </Field>
            <div className="flex items-center justify-between gap-4">
              <span className="text-base font-bold">Bijbelverwijzingen tonen</span>
              <Switch checked={refs} onCheckedChange={setRefs} aria-label="Bijbelverwijzingen tonen" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-base font-bold">Eerst het hoofdstuk lezen</span>
              <Switch checked={first} onCheckedChange={setFirst} aria-label="Eerst het hoofdstuk lezen" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span id="g-theme" className="text-base font-bold">Thema</span>
              <ThemeToggle aria-labelledby="g-theme" />
            </div>
            <div className="flex flex-col gap-2">
              <Input size="sm" defaultValue="Alex" aria-label="Naam, kleine variant" />
              <Input disabled defaultValue="Uitgeschakeld" aria-label="Uitgeschakeld veld" />
            </div>
          </Card>
        </div>
      </section>

      <section id="tabs" aria-labelledby="tabs-title" className="flex flex-col gap-4">
        <SectionTitle id="tabs-title" title="Tabs" />
        <Card className="flex flex-col gap-5">
          <Tabs
            aria-label="Periode"
            items={[{ value: 'month', label: 'Deze maand' }, { value: 'all', label: 'Altijd' }]}
            value={period}
            onChange={setPeriod}
          />
          <Tabs
            aria-label="Filter"
            variant="pills"
            items={[{ value: 'all', label: 'Alles' }, { value: 'ot', label: 'Oude Testament' }, { value: 'nt', label: 'Nieuwe Testament' }, { value: 'thema', label: "Thema's" }]}
            value={filter}
            onChange={setFilter}
          />
          <Tabs
            aria-label="Juridische documenten"
            variant="compact"
            items={[{ value: 'privacy', label: 'Privacybeleid', href: '/dev/ui#tabs' }, { value: 'terms', label: 'Voorwaarden', href: '/dev/ui#forms' }]}
            value="privacy"
            className="self-start bg-card border border-line"
          />
        </Card>
      </section>

      <section id="modal" aria-labelledby="modal-title" className="flex flex-col gap-4">
        <SectionTitle id="modal-title" title="Dialogen en meldingen" />
        <Card className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>Open dialoog</Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
          <Button variant="secondary" onClick={() => setLocked(true)}>Vergrendelde paywall</Button>
          <Button variant="secondary" onClick={() => toast.success('Opgeslagen', { description: 'Je naam is bijgewerkt.' })}>Toast: succes</Button>
          <Button variant="secondary" onClick={() => toast.error('Dat ging mis', { description: 'Probeer het zo nog eens.' })}>Toast: fout</Button>
          <Button variant="secondary" onClick={() => toast('Lotte wacht op jou', { description: 'Duel · ronde 2', action: { label: 'Speel', onClick: () => undefined } })}>Toast: actie</Button>
        </Card>
        <Modal
          open={modal}
          onOpenChange={setModal}
          title="Quiz stoppen?"
          description="Je voortgang in deze quiz gaat verloren."
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)}>Verder spelen</Button>
              <Button variant="danger" onClick={() => setModal(false)}>Stoppen</Button>
            </>
          }
        />
        <Modal open={sheet} onOpenChange={setSheet} title="Kies een onderwerp" presentation="sheet">
          <div className="flex flex-col gap-2">
            {['Genesis', 'Exodus', 'Johannes', 'Handelingen'].map((book) => (
              <Button key={book} variant="secondary" size="xl" block onClick={() => setSheet(false)}>{book}</Button>
            ))}
          </div>
        </Modal>
        <Modal
          open={locked}
          onOpenChange={setLocked}
          dismissible={false}
          title="Mooi gespeeld! Speel verder met Premium"
          description="Je eerste 3 quizzen zijn gratis. Met Premium speel je alles, zo vaak je wilt."
          footer={
            <>
              <Button variant="ghost" onClick={() => setLocked(false)}>Later</Button>
              <Button variant="gold" size="lg" onClick={() => setLocked(false)}>Probeer 7 dagen gratis</Button>
            </>
          }
        >
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px] font-bold">
            <li>Alle quizzen, zo vaak je wilt</li>
            <li>Uitleg bij elk antwoord</li>
            <li>Je antwoorden terugkijken na elke quiz</li>
          </ul>
        </Modal>
      </section>
    </>
  );
}
