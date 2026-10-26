import { notFound } from 'next/navigation';
import { BookOpen, Pencil, Settings, Swords, Trophy } from 'lucide-react';

import {
  AnswerButton,
  AnswerGrid,
  AppleIcon,
  Avatar,
  AvatarStack,
  Breadcrumbs,
  Button,
  Card,
  CardRow,
  ContinueCard,
  Container,
  Disclosure,
  DisclosureList,
  EmptyState,
  GoogleIcon,
  IconButton,
  PageTitle,
  Pill,
  PlayHeader,
  PremiumLock,
  ProgressBar,
  ProgressRing,
  ProgressSegments,
  QuizCard,
  RankBadge,
  ResultDisc,
  SCENE_TITLES,
  SectionTitle,
  SiteFooter,
  Skeleton,
  Spinner,
  StatPill,
  StoreBadges,
  StreakPill,
  TextDivider,
  XpPill,
} from '@/components/bq';
import { QuizScene } from '@/components/bq/QuizScene';
import { GalleryInteractive, GalleryHeaders } from './GalleryClient';

/**
 * /dev/ui - every foundation component on one page, for comparing with
 * docs/web-2/designs. Only exists outside production.
 */
export const metadata = { title: 'UI-galerij', robots: { index: false, follow: false } };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-4">
      <SectionTitle id={`${id}-title`} title={title} />
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`h-14 rounded-[12px] border border-line ${className}`} />
      <span className="text-xs font-bold text-ink-muted">{name}</span>
    </div>
  );
}

export default function UiGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const sections = [
    'tokens', 'buttons', 'cards', 'forms', 'tabs', 'avatars', 'pills', 'progress', 'quiz', 'answers', 'disclosure', 'empty', 'modal', 'premium', 'chrome',
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <GalleryHeaders />
      <Container as="main" className="flex flex-col gap-12 py-10">
        <PageTitle
          title="UI-galerij"
          subtitle="Alle fundamentcomponenten van BijbelQuiz 2.0 naast elkaar, om te vergelijken met de ontwerpen."
          actions={
            <>
              <Button variant="secondary" href="/">Naar de site</Button>
              <Button href="#chrome">Naar de shell</Button>
            </>
          }
        />
        <nav aria-label="Secties" className="flex flex-wrap gap-2">
          {sections.map((id) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-bold text-ink-soft no-underline hover:text-ink">
              {id}
            </a>
          ))}
        </nav>

        <Section id="tokens" title="Kleuren en tekst">
          <div className="grid grid-cols-3 gap-3 m:grid-cols-6">
            <Swatch name="canvas" className="bg-canvas" />
            <Swatch name="card" className="bg-card" />
            <Swatch name="line" className="bg-line" />
            <Swatch name="chip" className="bg-chip" />
            <Swatch name="lapis" className="bg-lapis" />
            <Swatch name="lapis-tint" className="bg-lapis-tint" />
            <Swatch name="gold" className="bg-gold" />
            <Swatch name="gold-tint" className="bg-gold-tint" />
            <Swatch name="coral" className="bg-coral" />
            <Swatch name="coral-strong" className="bg-coral-strong" />
            <Swatch name="green" className="bg-green" />
            <Swatch name="green-tint" className="bg-green-tint" />
          </div>
          <Card className="flex flex-col gap-3">
            <h1 className="m-0 text-[40px] leading-[48px]">Goedemiddag, Alex</h1>
            <h2 className="m-0 text-[26px] leading-8">Kies een onderwerp</h2>
            <h3 className="m-0 text-lg leading-[23px]">Door de Rode Zee</h3>
            <p className="m-0 text-[17px] font-semibold text-ink-muted">Ga verder waar je gebleven was, of begin aan iets nieuws.</p>
            <p className="m-0 text-base leading-6 font-semibold text-ink-body">Andreas wees Jezus op een jongen met vijf gerstebroden en twee vissen.</p>
            <p className="m-0 text-[13px] font-semibold text-ink-muted">10 vragen · 5 min</p>
          </Card>
        </Section>

        <Section id="buttons" title="Knoppen">
          <Card className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Inloggen</Button>
              <Button variant="secondary">Opslaan</Button>
              <Button variant="gold">Premium</Button>
              <Button variant="danger">Speel</Button>
              <Button variant="danger-secondary">Account verwijderen</Button>
              <Button variant="ghost">Meld deze fout</Button>
              <Button loading>Bezig</Button>
              <Button disabled>Uitgeschakeld</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Klein 40</Button>
              <Button size="md">Normaal 44</Button>
              <Button size="lg">Groot 48</Button>
              <Button size="xl">Extra 52</Button>
              <Button size="hero">Volgende quiz 56</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="dark" size="xl">
                <AppleIcon /> Doorgaan met Apple
              </Button>
              <Button variant="secondary" size="xl">
                <GoogleIcon /> Doorgaan met Google
              </Button>
              <span className="rounded-[14px] bg-lapis p-3">
                <Button variant="inverse" size="lg">Speel nu</Button>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <IconButton aria-label="Instellingen"><Settings className="size-5" strokeWidth={2.2} /></IconButton>
              <IconButton aria-label="Bewerken" shape="square"><Pencil className="size-5" strokeWidth={2.2} /></IconButton>
              <IconButton aria-label="Instellingen" shape="edge" size="lg"><Settings className="size-5" strokeWidth={2.2} /></IconButton>
              <StoreBadges />
            </div>
          </Card>
        </Section>

        <Section id="cards" title="Kaarten">
          <div className="grid gap-4 m:grid-cols-3">
            <Card>
              <p className="m-0 font-extrabold">Standaardkaart</p>
              <p className="m-0 text-sm font-semibold text-ink-muted">Wit, 1px lijn, radius 16.</p>
            </Card>
            <Card href="/dev/ui" padding="lg">
              <p className="m-0 font-extrabold">Als link</p>
              <p className="m-0 text-sm font-semibold text-ink-muted">Rand wordt donkerder bij hover.</p>
            </Card>
            <Card accent="green">
              <p className="m-0 font-extrabold text-green-text">Goed!</p>
              <p className="m-0 text-sm font-semibold text-ink-muted">Met gekleurde bovenrand.</p>
            </Card>
          </div>
          <Card padding="none">
            <CardRow>
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-chip text-ink-soft"><Settings className="size-[18px]" strokeWidth={2.2} /></span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-bold">Naam</span>
                <span className="text-sm font-semibold text-ink-muted">Zo zien anderen je op de ranglijst en in duels.</span>
              </span>
              <Button variant="secondary">Opslaan</Button>
            </CardRow>
            <CardRow>
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-lapis-tint text-lapis"><BookOpen className="size-[18px]" strokeWidth={2.2} /></span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-bold">E-mailadres</span>
                <span className="text-sm font-semibold text-ink-muted">Ingelogd met Google</span>
              </span>
              <span className="text-[15px] font-bold text-ink-soft">alex@voorbeeld.nl</span>
            </CardRow>
          </Card>
          <Breadcrumbs items={[{ label: 'Quizzen', href: '/quizzen' }, { label: 'Johannes', href: '/quizzen' }, { label: 'Brood voor 5000', href: '/quizzen' }, { label: 'Resultaat' }]} />
        </Section>

        <GalleryInteractive />

        <Section id="avatars" title="Avatars">
          <Card className="flex flex-wrap items-end gap-5">
            <Avatar name="Alex" tone="solid" size={96} />
            <Avatar name="Lotte" tone="coral" size={66} ring="silver" badge={<RankBadge rank={2} tone="silver" />} />
            <Avatar name="Sanne" tone="gold" size={82} ring="gold" badge={<RankBadge rank={1} tone="gold" />} />
            <Avatar name="Jonas" tone="lapis" size={66} ring="bronze" badge={<RankBadge rank={3} tone="bronze" />} />
            <Avatar name="Daan" size={44} />
            <Avatar name="Noor" size={36} />
            <Avatar name="Ruben" size={28} />
            <Avatar name="Mascotte" size={44} avatar={{ character: 'leeuw', color: 'lapis', background: 'hemel', accessory: 'kroon' }} />
            <AvatarStack people={[{ name: 'Lotte' }, { name: 'Daan' }, { name: 'Alex' }, { name: 'Noor' }, { name: 'Ruben' }, { name: 'Sem' }]} />
          </Card>
        </Section>

        <Section id="pills" title="Labels">
          <Card className="flex flex-wrap items-center gap-3">
            <Pill>Johannes</Pill>
            <Pill kicker tone="lapis">Johannes 6</Pill>
            <Pill kicker tone="green">Richteren</Pill>
            <Pill tone="gold">Level 7</Pill>
            <Pill tone="grey" size="sm">Beheer</Pill>
            <Pill tone="outline" size="lg">Ronde 2 van 3 · vraag 2</Pill>
            <XpPill xp={15} />
            <XpPill xp={50} size="lg" />
            <StreakPill count={3} />
            <StatPill kind="streak" value={6} />
            <StatPill kind="xp" value={1240} />
            <Pill tone="lapis" size="lg" icon={<BookOpen className="size-4" strokeWidth={2.2} />} href="/dev/ui">Lees Johannes 6:9</Pill>
          </Card>
        </Section>

        <Section id="progress" title="Voortgang">
          <Card className="flex flex-col gap-5">
            <ProgressBar value={0.83} label="Voortgang naar level 8" />
            <ProgressBar value={0.4} tone="lapis" height={10} label="Vraag 4 van 10" />
            <div className="flex items-center gap-3.5">
              <ProgressSegments current={4} total={10} />
              <span className="text-[15px] font-extrabold tabular text-ink-soft">4/10</span>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={0.4} label="4 van 10 vragen" />
              <ProgressRing value={0.6} size={56} thickness={6} label="Nog 18 seconden">18</ProgressRing>
              <ProgressRing value={0.8} size={148} thickness={12} tone="green">
                <span className="flex flex-col items-center"><span className="text-[40px] leading-[44px] font-extrabold">8/10</span><span className="text-[13px] font-bold text-ink-muted">goed</span></span>
              </ProgressRing>
              <Spinner />
              <Skeleton className="h-10 w-40" />
            </div>
          </Card>
        </Section>

        <Section id="quiz" title="Quizkaarten en scènes">
          <div className="grid grid-cols-2 gap-3 m:grid-cols-4 m:gap-4">
            <QuizCard href="/dev/ui" title="Door de Rode Zee" reference="Exodus 14" questionCount={10} seed="door-de-rode-zee" />
            <QuizCard href="/dev/ui" title="De ark van Noach" reference="Genesis 6" questionCount={10} kickerTone="gold" />
            <QuizCard href="/dev/ui" title="David en Goliat" reference="1 Samuël 17" questionCount={10} kickerTone="muted" />
            <QuizCard href="/dev/ui" title="Een quiz zonder eigen scène" reference="Jesaja 53" questionCount={15} minutes={8} seed="jesaja-53-deel-1" />
          </div>
          <div className="grid gap-4 m:grid-cols-3">
            <ContinueCard href="/dev/ui" title="Brood voor 5000" book="Johannes" chapter={6} answered={4} total={10} />
          </div>
          <div className="grid grid-cols-3 gap-2 m:grid-cols-6">
            {SCENE_TITLES.map((title) => (
              <span key={title} className="flex flex-col gap-1">
                <span className="block overflow-hidden rounded-[10px] aspect-video"><QuizScene title={title} /></span>
                <span className="truncate text-[11px] font-bold text-ink-muted">{title}</span>
              </span>
            ))}
          </div>
        </Section>

        <Section id="answers" title="Antwoorden">
          <AnswerGrid>
            <AnswerButton>3</AnswerButton>
            <AnswerButton state="selected">5</AnswerButton>
            <AnswerButton state="correct">5</AnswerButton>
            <AnswerButton state="wrong">7</AnswerButton>
            <AnswerButton state="muted">12</AnswerButton>
            <AnswerButton state="idle">Een heel lang antwoord dat over twee regels loopt in het raster</AnswerButton>
          </AnswerGrid>
        </Section>

        <Section id="disclosure" title="Uitklaplijst">
          <DisclosureList>
            <Disclosure leading={<ResultDisc correct />} summary={<span className="flex flex-col"><span className="text-[13px] font-extrabold text-ink-muted">Vraag 1</span>Bij welk meer gaf Jezus de menigte te eten?</span>} trailing={<span className="text-green-text">Het meer van Galilea</span>} bodyClassName="m:pl-[62px]">
              <p className="m-0">Jezus ging naar de overkant van het meer van Galilea, dat ook het meer van Tiberias heet.</p>
              <Pill tone="lapis" size="lg" icon={<BookOpen className="size-4" strokeWidth={2.2} />} href="/dev/ui">Johannes 6:1</Pill>
            </Disclosure>
            <Disclosure leading={<ResultDisc correct={false} />} summary={<span className="flex flex-col"><span className="text-[13px] font-extrabold text-ink-muted">Vraag 5</span>Hoeveel denarieën brood was volgens Filippus nog niet genoeg?</span>} trailing={<span className="text-green-text">200 denarieën</span>} bodyClassName="m:pl-[62px]">
              <p className="m-0"><span className="mb-1.5 block text-sm font-bold text-coral-text">Jouw antwoord: 100 denarieën</span>Filippus rekende uit dat zelfs tweehonderd denarieën brood niet genoeg was.</p>
            </Disclosure>
            <Disclosure summary="Is BijbelQuiz gratis?" open>
              <p className="m-0">Je speelt 3 quizzen gratis, zonder account. Daarna kun je Premium 7 dagen gratis proberen.</p>
            </Disclosure>
          </DisclosureList>
        </Section>

        <Section id="empty" title="Lege staat">
          <div className="grid gap-4 m:grid-cols-2">
            <EmptyState icon={<Swords />} title="Nog geen duels" description="Daag een vriend uit of speel tegen een willekeurige tegenstander." action={<Button>Nieuw duel</Button>} />
            <EmptyState icon={<Trophy />} tone="gold" title="Nog geen scores deze maand" description="Speel een quiz om op de ranglijst te komen." />
          </div>
        </Section>

        <Section id="premium" title="Premium-slot">
          <div className="grid gap-4 m:grid-cols-2">
            <Card>
              <PremiumLock reference="Johannes 6:9" referenceHref="/dev/ui" />
            </Card>
            <Card className="flex flex-col gap-3">
              <TextDivider>of met e-mail</TextDivider>
              <p className="m-0 text-sm font-semibold text-ink-muted">TextDivider, zoals op de inlogpagina.</p>
            </Card>
          </div>
        </Section>

        <Section id="chrome" title="Shell: speelkop en voettekst">
          <div className="overflow-hidden rounded-[16px] border border-line">
            <PlayHeader leaveLabel="Duel verlaten" leaveHref="/dev/ui">
              <Pill tone="outline" size="lg">Ronde 2 van 3 · vraag 2</Pill>
            </PlayHeader>
          </div>
        </Section>
      </Container>
      <SiteFooter />
    </div>
  );
}
