'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BookMarked,
  CalendarCheck,
  Compass,
  Crown,
  Footprints,
  GraduationCap,
  Link2,
  Lock,
  Pencil,
  Search,
  Settings,
  Shuffle,
  Target,
  type LucideIcon,
} from 'lucide-react';

import { Avatar, Button, Card, Field, IconButton, Input, Modal, ProgressBar, toast } from '@/components/bq';
import { BoltIcon, FlameIcon } from '@/components/bq/icons';
import MascotAvatar from '@/components/avatar/MascotAvatar';
import {
  AVATAR_ACCESSORIES,
  AVATAR_BACKGROUNDS,
  AVATAR_CHARACTERS,
  AVATAR_COLORS,
  avatarBackgroundFill,
  type AvatarConfig,
} from '@/lib/avatar';
import { cn } from '@/lib/utils';
import { CrownSolidIcon } from './icons';

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  current: number;
  target: number;
}

interface Friend {
  id: string;
  name: string;
  level: number;
  avatar: AvatarConfig;
}

interface ProfileViewProps {
  identity: { name: string; avatar: AvatarConfig; nameChangeAllowedInDays: number; memberSince: string };
  level: { level: number; xp: number; isMaxLevel: boolean; xpToNext: number; progress: number };
  stats: { streak: number; xp: number; quizzesPlayed: number; averageScore: number };
  badges: ProfileBadge[];
  friends: Friend[];
  inviteUrl: string | null;
  isPremium: boolean;
  dailyVerse: { reference: string; text: string };
}

const nl = new Intl.NumberFormat('nl-NL');

/* ── Badges ──────────────────────────────────────────────────────────────── */

type Tone = 'gold' | 'lapis' | 'green' | 'coral';

const BADGE_LOOK: Record<string, { Icon: LucideIcon | 'flame'; tone: Tone }> = {
  footprints: { Icon: Footprints, tone: 'gold' },
  search: { Icon: Search, tone: 'lapis' },
  target: { Icon: Target, tone: 'green' },
  flame: { Icon: 'flame', tone: 'coral' },
  'calendar-check': { Icon: CalendarCheck, tone: 'gold' },
  'graduation-cap': { Icon: GraduationCap, tone: 'lapis' },
  crown: { Icon: Crown, tone: 'gold' },
  compass: { Icon: Compass, tone: 'green' },
};

const TONE_DISC: Record<Tone, string> = {
  gold: 'bg-gold-tint border-gold text-gold-text',
  lapis: 'bg-lapis-tint border-lapis text-lapis',
  green: 'bg-green-tint border-green text-green-text',
  coral: 'bg-coral-tint border-coral text-coral',
};

function BadgeDisc({ icon, size, locked }: { icon: string; size: 40 | 56; locked?: boolean }) {
  const look = BADGE_LOOK[icon] ?? { Icon: Target, tone: 'lapis' as Tone };
  const iconSize = size === 56 ? 26 : 18;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        size === 56 ? 'size-14 border-[3px]' : 'size-10 border-2',
        locked ? 'border-line bg-chip text-ink-faint' : TONE_DISC[look.tone],
      )}
    >
      {locked ? (
        <Lock size={24} strokeWidth={2.2} />
      ) : look.Icon === 'flame' ? (
        <FlameIcon size={iconSize - 2} />
      ) : (
        <look.Icon size={iconSize} strokeWidth={2.2} />
      )}
    </span>
  );
}

function BadgeRow({ badge, highlight }: { badge: ProfileBadge; highlight: boolean }) {
  return (
    <li className="flex items-center gap-4 border-b border-line-soft px-4 py-[18px] m:px-[22px]">
      <BadgeDisc icon={badge.icon} size={56} locked={!highlight} />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex justify-between gap-3">
          <span className="text-[17px] font-extrabold">{badge.name}</span>
          <span className="whitespace-nowrap text-sm font-extrabold text-ink-muted">
            {badge.current}/{badge.target}
          </span>
        </span>
        <ProgressBar value={badge.current / badge.target} height={10} label={`${badge.name}: ${badge.current} van ${badge.target}`} />
        <span className="text-sm font-semibold text-ink-muted">{badge.description}</span>
      </span>
    </li>
  );
}

function Achievements({ badges }: { badges: ProfileBadge[] }) {
  const [showAll, setShowAll] = React.useState(false);
  const earned = badges.filter((badge) => badge.earned);
  const open = badges
    .filter((badge) => !badge.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target);
  const shown = showAll ? open : open.slice(0, 3);

  return (
    <section aria-labelledby="badges-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="badges-title" className="m-0 text-2xl leading-[30px]">
          Prestaties
        </h2>
        {open.length > 3 && (
          <button
            type="button"
            aria-expanded={showAll}
            aria-controls="badge-list"
            onClick={() => setShowAll((value) => !value)}
            className="min-h-11 border-0 bg-transparent p-0 text-[15px] font-extrabold text-lapis hover:text-lapis-edge"
          >
            {showAll ? 'Minder tonen' : 'Alle prestaties'}
          </button>
        )}
      </div>
      <ul id="badge-list" className="m-0 list-none overflow-hidden rounded-[16px] border border-line bg-card p-0 [&>li:last-child]:border-b-0">
        {shown.map((badge, index) => (
          <BadgeRow key={badge.id} badge={badge} highlight={index === 0 && badge.current > 0} />
        ))}
        {earned.length > 0 && (
          <li className="flex items-center justify-between gap-4 px-4 py-4 m:px-[22px]">
            <span className="whitespace-nowrap text-[15px] font-extrabold">
              Behaald <span className="font-bold text-ink-muted">· {earned.length}</span>
            </span>
            <span className="flex flex-wrap justify-end gap-2">
              {earned.map((badge) => (
                <span key={badge.id} title={`${badge.name}: ${badge.description}`} className="flex">
                  <BadgeDisc icon={badge.icon} size={40} />
                  <span className="sr-only">{badge.name}</span>
                </span>
              ))}
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

/* ── Identity editor ─────────────────────────────────────────────────────── */

type PartKey = keyof AvatarConfig;

function randomAvatar(): AvatarConfig {
  const take = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
  return {
    character: take(AVATAR_CHARACTERS).id,
    color: take(AVATAR_COLORS).id,
    background: take(AVATAR_BACKGROUNDS).id,
    accessory: take(AVATAR_ACCESSORIES).id,
  };
}

function PartPicker({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string; preview?: AvatarConfig; swatch?: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
      <legend className="mb-2.5 p-0 text-sm font-extrabold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.id)}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-1 rounded-[12px] border p-2 text-xs',
                active ? 'border-lapis bg-lapis-tint font-extrabold text-ink' : 'border-line bg-card font-bold text-ink-muted hover:bg-chip',
              )}
            >
              {option.preview ? (
                <MascotAvatar avatar={option.preview} size={40} />
              ) : (
                <span className="size-10 rounded-full border border-line" style={{ backgroundColor: option.swatch }} />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function IdentityEditor({
  open,
  onOpenChange,
  name,
  avatar,
  cooldownDays,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  avatar: AvatarConfig;
  cooldownDays: number;
  onSaved: (next: { name: string; avatar: AvatarConfig; cooldownDays: number }) => void;
}) {
  const { update } = useSession();
  const [draftName, setDraftName] = React.useState(name);
  const [draftAvatar, setDraftAvatar] = React.useState(avatar);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDraftName(name);
      setDraftAvatar(avatar);
    }
  }, [open, name, avatar]);

  const nameLocked = cooldownDays > 0;
  const nameChanged = draftName.trim() !== name;
  const avatarChanged = (Object.keys(draftAvatar) as PartKey[]).some((key) => draftAvatar[key] !== avatar[key]);
  const setPart = (key: PartKey, value: string) => setDraftAvatar((current) => ({ ...current, [key]: value }) as AvatarConfig);

  const save = async () => {
    if (!nameChanged && !avatarChanged) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(nameChanged ? { name: draftName.trim() } : {}),
          ...(avatarChanged ? { avatar: draftAvatar } : {}),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(payload?.error || 'Opslaan is niet gelukt.');
        return;
      }
      onSaved({
        name: payload.user.name,
        avatar: payload.user.avatar,
        cooldownDays: payload.user.nameChangeAllowedInDays ?? 0,
      });
      // The header shows the name and mascot too, from the session.
      await update(nameChanged ? { name: payload.user.name } : undefined);
      onOpenChange(false);
      toast.success('Profiel bijgewerkt');
    } catch (error) {
      console.error('[PROFILE_IDENTITY_SAVE]', error);
      toast.error('Opslaan is niet gelukt. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Profiel bewerken"
      description="Je naam en je figuur zie je terug op de ranglijst, in duels en bij samen spelen."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => setDraftAvatar(randomAvatar())} disabled={saving} className="m:mr-auto">
            <Shuffle className="size-4" strokeWidth={2.4} aria-hidden="true" />
            Verras me
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuleren
          </Button>
          <Button onClick={save} loading={saving}>
            Opslaan
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-4">
        <MascotAvatar avatar={draftAvatar} size={72} bordered />
        <Field
          label="Naam"
          htmlFor="profile-name"
          hint={
            nameLocked
              ? `Je kunt je naam over ${cooldownDays} ${cooldownDays === 1 ? 'dag' : 'dagen'} weer wijzigen.`
              : 'Eens per 30 dagen te wijzigen.'
          }
          className="min-w-0 flex-1"
        >
          <Input
            id="profile-name"
            autoComplete="nickname"
            maxLength={30}
            disabled={nameLocked}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </Field>
      </div>
      <PartPicker
        label="Figuur"
        selected={draftAvatar.character}
        onSelect={(value) => setPart('character', value)}
        options={AVATAR_CHARACTERS.map((option) => ({ id: option.id, label: option.label, preview: { ...draftAvatar, character: option.id } }))}
      />
      <PartPicker
        label="Kleur"
        selected={draftAvatar.color}
        onSelect={(value) => setPart('color', value)}
        options={AVATAR_COLORS.map((option) => ({ id: option.id, label: option.label, swatch: option.base }))}
      />
      <PartPicker
        label="Achtergrond"
        selected={draftAvatar.background}
        onSelect={(value) => setPart('background', value)}
        options={AVATAR_BACKGROUNDS.map((option) => ({ id: option.id, label: option.label, swatch: avatarBackgroundFill(option.id) }))}
      />
      <PartPicker
        label="Accessoire"
        selected={draftAvatar.accessory}
        onSelect={(value) => setPart('accessory', value)}
        options={AVATAR_ACCESSORIES.map((option) => ({ id: option.id, label: option.label, preview: { ...draftAvatar, accessory: option.id } }))}
      />
    </Modal>
  );
}

/* ── Side column ─────────────────────────────────────────────────────────── */

const challengeButton =
  'inline-flex h-9 shrink-0 items-center rounded-[10px] border-0 border-b-[3px] border-lapis-pale bg-lapis-tint px-3.5 text-sm font-extrabold text-lapis-edge hover:bg-lapis-pale-strong disabled:opacity-60 dark:text-lapis-text dark:border-lapis-edge';

function Friends({ friends }: { friends: Friend[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const challenge = async (friend: Friend) => {
    setPending(friend.id);
    try {
      const response = await fetch('/api/duels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'friend', opponentId: friend.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.duel?.id) {
        toast.error(payload?.error || 'Uitdagen is niet gelukt. Probeer het opnieuw.');
        setPending(null);
        return;
      }
      router.push(`/duels/${payload.duel.id}`);
    } catch {
      toast.error('Uitdagen is niet gelukt. Probeer het opnieuw.');
      setPending(null);
    }
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pb-2 pt-[18px]">
        <h2 className="m-0 text-xl leading-[26px]">Vrienden</h2>
        <Link href="/duels" className="text-sm font-extrabold no-underline">
          Alle duels
        </Link>
      </div>
      <ul className="m-0 list-none p-0">
        {friends.map((friend) => (
          <li key={friend.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
            <Avatar name={friend.name} avatar={friend.avatar} size={40} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-extrabold">{friend.name}</span>
              <span className="text-[13px] font-semibold text-ink-muted">Level {friend.level}</span>
            </span>
            <button
              type="button"
              className={challengeButton}
              disabled={pending !== null}
              aria-label={`${friend.name} uitdagen`}
              onClick={() => void challenge(friend)}
            >
              {pending === friend.id ? 'Even...' : 'Uitdagen'}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function InviteCard({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = React.useState(initialUrl);
  const [busy, setBusy] = React.useState(false);

  const copy = async () => {
    setBusy(true);
    try {
      let link = url;
      if (!link) {
        const response = await fetch('/api/duels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'invite' }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.inviteUrl) {
          toast.error(payload?.error || 'De link kon niet worden gemaakt.');
          return;
        }
        link = payload.inviteUrl as string;
        setUrl(link);
      }
      await navigator.clipboard.writeText(link);
      toast.success('Link gekopieerd', { description: 'Stuur hem naar een vriend.' });
    } catch {
      toast.error(url ? `Kopiëren lukte niet. Je link: ${url}` : 'Kopiëren lukte niet.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding="none" className="flex flex-col gap-3 px-[22px] py-5">
      <h2 className="m-0 text-xl leading-[26px]">Vrienden uitnodigen</h2>
      <p className="m-0 text-sm leading-[21px] font-semibold text-ink-muted">
        Stuur je link. Wie hem opent, speelt meteen een duel tegen je, gratis.
      </p>
      <Button variant="secondary" block loading={busy} onClick={() => void copy()}>
        {!busy && <Link2 className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />}
        Kopieer je link
      </Button>
    </Card>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const statIcon = 'flex size-12 shrink-0 items-center justify-center rounded-[12px]';

export default function ProfileView({ identity, level, stats, badges, friends, inviteUrl, isPremium, dailyVerse }: ProfileViewProps) {
  const [name, setName] = React.useState(identity.name);
  const [avatar, setAvatar] = React.useState(identity.avatar);
  const [cooldownDays, setCooldownDays] = React.useState(identity.nameChangeAllowedInDays);
  const [editing, setEditing] = React.useState(false);

  const statItems: { value: string; label: string; icon: React.ReactNode; tone: string }[] = [
    { value: nl.format(stats.streak), label: 'Dagen op rij', icon: <FlameIcon size={20} className="text-coral" />, tone: 'bg-coral-tint' },
    { value: nl.format(stats.xp), label: 'Totaal XP', icon: <BoltIcon size={20} />, tone: 'bg-gold-tint' },
    {
      value: nl.format(stats.quizzesPlayed),
      label: 'Quizzen gespeeld',
      icon: <BookMarked size={20} strokeWidth={2.2} className="text-lapis" />,
      tone: 'bg-lapis-tint',
    },
    {
      value: `${stats.averageScore}%`,
      label: 'Gemiddelde score',
      icon: <Target size={20} strokeWidth={2.2} className="text-green" />,
      tone: 'bg-green-tint',
    },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-7 pb-12 pt-6 m:pb-20 m:pt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-10 lg:gap-y-8">
      <div className="flex min-w-0 flex-col gap-8">
        <section
          aria-label={`${name}, level ${level.level}`}
          className="flex flex-col gap-[22px] rounded-[16px] border border-line bg-card p-5 m:p-7"
        >
          <div className="flex flex-col items-start gap-[22px] m:flex-row m:items-center">
            <Avatar name={name} avatar={avatar} size={96} tone="solid" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="m-0 flex flex-wrap items-center gap-3 text-[34px] leading-10">
                <span className="min-w-0 break-words">{name}</span>
                <span className="inline-flex h-7 items-center rounded-full bg-lapis-tint px-2.5 font-sans text-[13px] font-extrabold text-lapis dark:text-lapis-text">
                  Level {level.level}
                </span>
              </h1>
              <span className="text-[15px] font-semibold text-ink-muted">Lid sinds {identity.memberSince}</span>
            </div>
            <div className="flex shrink-0 gap-2.5">
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil className="size-4" strokeWidth={2.4} aria-hidden="true" />
                Bewerken
              </Button>
              <IconButton href="/instellingen" aria-label="Instellingen" shape="edge" size="lg">
                <Settings className="size-5" strokeWidth={2.2} />
              </IconButton>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-line-soft pt-5">
            <span className="flex justify-between gap-3 text-sm font-extrabold">
              <span className="flex items-center gap-1.5">
                <BoltIcon size={16} />
                {nl.format(level.xp)} XP
              </span>
              <span className="font-bold text-ink-muted">
                {level.isMaxLevel ? 'Hoogste level bereikt' : `Nog ${nl.format(level.xpToNext)} XP tot level ${level.level + 1}`}
              </span>
            </span>
            <ProgressBar value={level.progress / 100} height={10} label={`Voortgang naar level ${level.level + 1}`} />
          </div>
        </section>

        <section aria-labelledby="stats-title" className="flex flex-col gap-3">
          <h2 id="stats-title" className="m-0 text-2xl leading-[30px]">
            Statistieken
          </h2>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
            {statItems.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-[16px] border border-line bg-card p-3.5 m:gap-4 m:px-5 m:py-[18px]"
              >
                <span aria-hidden="true" className={cn(statIcon, item.tone)}>
                  {item.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-2xl leading-[30px] font-extrabold tabular">{item.value}</span>
                  <span className="text-sm font-bold text-ink-muted">{item.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <Achievements badges={badges} />
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        {!isPremium && (
          <Card padding="none" className="flex flex-col gap-3.5 p-[22px]">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-gold-tint">
                <CrownSolidIcon size={22} />
              </span>
              <span className="flex flex-col">
                <span className="font-display text-xl leading-[26px] font-semibold">Probeer Premium</span>
                <span className="text-sm font-semibold text-ink-muted">Alle quizzen en uitleg bij elk antwoord</span>
              </span>
            </div>
            <Button href="/premium" size="lg" block>
              7 dagen gratis
            </Button>
          </Card>
        )}
        {friends.length > 0 && <Friends friends={friends} />}
        <InviteCard initialUrl={inviteUrl} />
        <Card padding="none" className="flex flex-col gap-2 px-[22px] py-5">
          <h2 className="m-0 text-xl leading-[26px]">Dagtekst</h2>
          <p className="m-0 text-sm font-extrabold text-lapis dark:text-lapis-text">{dailyVerse.reference}</p>
          <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-body">{dailyVerse.text}</p>
        </Card>
      </aside>

      <IdentityEditor
        open={editing}
        onOpenChange={setEditing}
        name={name}
        avatar={avatar}
        cooldownDays={cooldownDays}
        onSaved={(next) => {
          setName(next.name);
          setAvatar(next.avatar);
          setCooldownDays(next.cooldownDays);
        }}
      />
    </div>
  );
}
