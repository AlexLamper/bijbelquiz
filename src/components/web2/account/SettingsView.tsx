'use client';

import * as React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  ALargeSmall,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Languages,
  Mail,
  ScrollText,
  Shield,
  ChartNoAxesColumnIncreasing,
  Sun,
  User,
} from 'lucide-react';

import { Button, Card, Container, Input, PageBody, PageTitle, SectionTitle, Select, Switch, toast } from '@/components/bq';
import { cn } from '@/lib/utils';
import { CrownSolidIcon } from './icons';
import { INTEREST_OPTIONS } from '@/lib/quiz-recommendations';
import {
  formatQuestionTimer,
  QUESTION_TIMER_CHOICES,
  type QuestionFontSize,
  type QuestionTimerSeconds,
  type ThemePreference,
  type UserOnboardingSettings,
  type UserSettings,
} from '@/lib/user-settings';
import { getSiteConfig, isNlSite } from '@/config/site';
import { t } from '@/i18n';

export type PremiumRow = { label: string; action: 'link'; href: string } | { label: string; action: 'portal' };

interface SettingsViewProps {
  initialData: {
    profile: { name: string; email: string; signInMethod: string };
    settings: UserSettings;
    onboarding: UserOnboardingSettings;
  };
  premium: PremiumRow;
  /** Set when the Stripe portal could not be opened (`?billing=`). */
  billingError?: 'error' | 'unavailable' | null;
}

/** Display labels from the design; the stored values stay those of `INTEREST_OPTIONS`. */
const INTEREST_LABELS: Record<string, string> = {
  evangelien: t('account.settings.interestGospels'),
  wijsheid: t('account.settings.interestWisdom'),
};

type SettingsPatch = { settings?: Partial<UserSettings>; onboarding?: Partial<UserOnboardingSettings> };

/* ── Row building blocks ─────────────────────────────────────────────────── */

function RowIcon({ tone = 'grey', children }: { tone?: 'grey' | 'lapis' | 'gold'; children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-[18px]',
        tone === 'grey' && 'bg-chip text-ink-soft',
        tone === 'lapis' && 'bg-lapis-tint text-lapis',
        tone === 'gold' && 'bg-gold-tint text-gold-text',
      )}
    >
      {children}
    </span>
  );
}

function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex min-h-[76px] flex-wrap items-center gap-x-4 gap-y-3 border-b border-line-soft px-4 py-3.5 last:border-b-0 m:px-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

function RowText({ title, hint, htmlFor, id }: { title: string; hint?: string; htmlFor?: string; id?: string }) {
  const Title = htmlFor ? 'label' : 'span';
  return (
    <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
      <Title id={id} htmlFor={htmlFor} className="text-base font-bold text-ink">
        {title}
      </Title>
      {hint && <span className="text-sm font-semibold text-ink-muted">{hint}</span>}
    </span>
  );
}

/** The control on the right, which takes a line of its own on phones. */
function RowControl({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('flex flex-[1_1_100%] items-center justify-start gap-2 m:flex-[0_1_auto] m:justify-end', className)}>
      {children}
    </span>
  );
}

function Segmented<T extends string>({
  labelledBy,
  value,
  options,
  onChange,
}: {
  labelledBy: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    refs.current[next]?.focus();
    onChange(options[next].value);
  };

  return (
    <span role="radiogroup" aria-labelledby={labelledBy} className="flex gap-1 rounded-[12px] bg-chip p-1">
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'h-9 rounded-[9px] border px-4 text-[15px]',
              selected ? 'border-line bg-card font-extrabold text-ink' : 'border-transparent bg-transparent font-bold text-ink-soft hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </span>
  );
}

const linkRow =
  'flex min-h-[68px] w-full items-center gap-4 border-0 border-b border-line-soft bg-transparent px-4 py-3.5 text-left text-ink no-underline last:border-b-0 hover:bg-chip/60 hover:text-ink m:px-5';

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function SettingsView({ initialData, premium, billingError = null }: SettingsViewProps) {
  const { setTheme } = useTheme();
  const { update } = useSession();

  const [savedName, setSavedName] = React.useState(initialData.profile.name);
  const [nameDraft, setNameDraft] = React.useState(initialData.profile.name);
  const [nameSaving, setNameSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<UserSettings>(initialData.settings);
  const [onboarding, setOnboarding] = React.useState<UserOnboardingSettings>(initialData.onboarding);
  const [status, setStatus] = React.useState('');

  const save = async (patch: SettingsPatch, rollbackTheme?: ThemePreference) => {
    const previousSettings = settings;
    const previousOnboarding = onboarding;

    if (patch.settings) setSettings((current) => ({ ...current, ...patch.settings }));
    if (patch.onboarding) {
      setOnboarding((current) => ({ ...current, ...patch.onboarding, interests: patch.onboarding?.interests ?? current.interests }));
    }
    setStatus(t('account.settings.saving'));

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || t('account.settings.saveFailed'));

      setSettings(payload.settings);
      setOnboarding(payload.onboarding);
      // Preferences ride on the session; the quiz player and theme read them
      // from there, so refresh it rather than wait for a reload.
      await update();
      setStatus(t('account.settings.saved'));
    } catch (error) {
      setSettings(previousSettings);
      setOnboarding(previousOnboarding);
      if (rollbackTheme) setTheme(rollbackTheme);
      const message = error instanceof Error ? error.message : t('account.settings.saveFailed');
      setStatus(message);
      toast.error(message);
    }
  };

  const updateTheme = (themePreference: ThemePreference) => {
    if (themePreference === settings.themePreference) return;
    const previous = settings.themePreference;
    setTheme(themePreference);
    void save({ settings: { themePreference } }, previous);
  };

  const toggleInterest = (interest: string) => {
    const checked = onboarding.interests.includes(interest);
    const interests = checked
      ? onboarding.interests.filter((item) => item !== interest)
      : Array.from(new Set([...onboarding.interests, interest]));
    void save({ onboarding: { interests } });
  };

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = nameDraft.trim();
    if (name.length < 2 || name.length > 30) {
      toast.error(t('account.settings.nameLength'));
      return;
    }
    if (name === savedName) return;

    setNameSaving(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || t('account.settings.nameFailed'));

      const next = payload?.user?.name || name;
      setSavedName(next);
      setNameDraft(next);
      await update({ name: next });
      toast.success(t('account.settings.nameUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('account.settings.nameFailed'));
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <Container width="narrow">
      <PageBody className="m:pb-[88px]">
        <PageTitle title={t('account.settings.title')} subtitle={t('account.settings.sub')} backHref="/profiel" backLabel={t('account.settings.back')} />
        <p aria-live="polite" className="sr-only">
          {status}
        </p>

        <section id="account" aria-labelledby="h-account" className="flex flex-col gap-3">
          <SectionTitle id="h-account" title={t('account.settings.account')} />
          <Card padding="none">
            <form onSubmit={saveName}>
              <Row>
                <RowIcon>
                  <User strokeWidth={2.2} />
                </RowIcon>
                <RowText title={t('account.profile.name')} hint={t('account.settings.nameHint')} htmlFor="set-name" />
                <RowControl>
                  <Input
                    id="set-name"
                    name="nickname"
                    autoComplete="nickname"
                    size="sm"
                    maxLength={30}
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    className="w-[200px] flex-[1_1_160px]"
                  />
                  <Button type="submit" variant="secondary" loading={nameSaving} disabled={nameDraft.trim() === savedName}>
                    {t('account.save')}
                  </Button>
                </RowControl>
              </Row>
            </form>
            <Row>
              <RowIcon>
                <Mail strokeWidth={2.2} />
              </RowIcon>
              <RowText title={t('account.settings.email')} hint={initialData.profile.signInMethod} />
              <RowControl className="min-w-0 text-[15px] font-bold text-ink-soft">
                <span className="min-w-0 break-all">{initialData.profile.email}</span>
              </RowControl>
            </Row>
          </Card>
        </section>

        <section id="spelen" aria-labelledby="h-spelen" className="flex flex-col gap-3">
          <SectionTitle id="h-spelen" title={t('account.settings.play')} />
          <Card padding="none">
            <Row className="flex-nowrap">
              <RowIcon tone="lapis">
                <ScrollText strokeWidth={2.2} />
              </RowIcon>
              <RowText id="lbl-refs" title={t('account.settings.showRefs')} hint={t('account.settings.showRefsHint')} />
              <Switch
                aria-labelledby="lbl-refs"
                checked={settings.showBibleReferences}
                onCheckedChange={(value) => void save({ settings: { showBibleReferences: value } })}
              />
            </Row>
            <Row className="flex-nowrap">
              <RowIcon>
                <BookOpen strokeWidth={2.2} />
              </RowIcon>
              <RowText id="lbl-passage" title={t('account.settings.readFirst')} hint={t('account.settings.readFirstHint')} />
              <Switch
                aria-labelledby="lbl-passage"
                checked={settings.readPassageFirst}
                onCheckedChange={(value) => void save({ settings: { readPassageFirst: value } })}
              />
            </Row>
            <Row>
              <RowIcon>
                <Clock strokeWidth={2.2} />
              </RowIcon>
              <RowText title={t('play.timer')} hint={t('account.settings.timerHint')} htmlFor="set-timer" />
              <RowControl>
                <Select
                  id="set-timer"
                  size="sm"
                  className="w-[220px] max-w-full"
                  value={String(settings.questionTimerSeconds)}
                  onChange={(event) =>
                    void save({ settings: { questionTimerSeconds: Number(event.target.value) as QuestionTimerSeconds } })
                  }
                >
                  {QUESTION_TIMER_CHOICES.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {formatQuestionTimer(seconds)}
                    </option>
                  ))}
                </Select>
              </RowControl>
            </Row>
            <Row>
              <RowIcon>
                <ChartNoAxesColumnIncreasing strokeWidth={2.2} />
              </RowIcon>
              <RowText title={t('account.settings.difficulty')} hint={t('account.settings.difficultyHint')} htmlFor="set-level" />
              <RowControl>
                <Select
                  id="set-level"
                  size="sm"
                  className="w-[220px] max-w-full"
                  value={settings.preferredDifficulty}
                  onChange={(event) =>
                    void save({ settings: { preferredDifficulty: event.target.value as UserSettings['preferredDifficulty'] } })
                  }
                >
                  <option value="all">{t('account.settings.all')}</option>
                  <option value="easy">{t('account.settings.easy')}</option>
                  <option value="medium">{t('account.settings.medium')}</option>
                  <option value="hard">{t('account.settings.hard')}</option>
                </Select>
              </RowControl>
            </Row>
            {isNlSite() && (
            <Row>
              <RowIcon>
                <Languages strokeWidth={2.2} />
              </RowIcon>
              <RowText title={t('account.settings.translation')} hint={t('account.settings.translationHint')} htmlFor="set-translation" />
              <RowControl>
                {/* The passages come from the Statenvertaling; there is no other to pick yet. */}
                <Select id="set-translation" size="sm" className="w-[220px] max-w-full" defaultValue="statenvertaling">
                  <option value="statenvertaling">Statenvertaling</option>
                </Select>
              </RowControl>
            </Row>
            )}
          </Card>
        </section>

        <section id="weergave" aria-labelledby="h-weergave" className="flex flex-col gap-3">
          <SectionTitle id="h-weergave" title={t('account.settings.display')} />
          <Card padding="none">
            <Row>
              <RowIcon>
                <Sun strokeWidth={2.2} />
              </RowIcon>
              <RowText id="lbl-theme" title={t('account.settings.theme')} />
              <RowControl>
                <Segmented<ThemePreference>
                  labelledBy="lbl-theme"
                  value={settings.themePreference}
                  onChange={updateTheme}
                  options={[
                    { value: 'light', label: t('account.settings.light') },
                    { value: 'dark', label: t('account.settings.dark') },
                    { value: 'system', label: t('account.settings.system') },
                  ]}
                />
              </RowControl>
            </Row>
            <Row>
              <RowIcon>
                <ALargeSmall strokeWidth={2.2} />
              </RowIcon>
              <RowText id="lbl-size" title={t('account.settings.fontSize')} hint={t('account.settings.fontSizeHint')} />
              <RowControl>
                <Segmented<QuestionFontSize>
                  labelledBy="lbl-size"
                  value={settings.questionFontSize}
                  onChange={(questionFontSize) => {
                    if (questionFontSize !== settings.questionFontSize) void save({ settings: { questionFontSize } });
                  }}
                  options={[
                    { value: 'normal', label: t('account.settings.normal') },
                    { value: 'large', label: t('account.settings.large') },
                  ]}
                />
              </RowControl>
            </Row>
          </Card>
        </section>

        <section id="aanbevelingen" aria-labelledby="h-aanbevelingen" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <SectionTitle id="h-aanbevelingen" title={t('account.settings.recs')} />
            <p className="m-0 text-[15px] leading-[22px] font-semibold text-ink-muted">
              {t('account.settings.recsHint')}
            </p>
          </div>
          <Card padding="none">
            <Row>
              <label htmlFor="set-freq" className="min-w-0 flex-[1_1_200px] text-base font-bold">
                {t('account.settings.freq')}
              </label>
              <RowControl>
                <Select
                  id="set-freq"
                  size="sm"
                  className="w-[220px] max-w-full"
                  value={onboarding.bibleReadingFrequency}
                  onChange={(event) => void save({ onboarding: { bibleReadingFrequency: event.target.value } })}
                >
                  {!onboarding.bibleReadingFrequency && <option value="">{t('account.settings.pickFreq')}</option>}
                  <option value="daily">{t('account.settings.daily')}</option>
                  <option value="weekly">{t('account.settings.weekly')}</option>
                  <option value="monthly">{t('account.settings.monthly')}</option>
                  <option value="rarely">{t('account.settings.rarely')}</option>
                </Select>
              </RowControl>
            </Row>
            <Row>
              <label htmlFor="set-knowledge" className="min-w-0 flex-[1_1_200px] text-base font-bold">
                {t('account.settings.knowledge')}
              </label>
              <RowControl>
                <Select
                  id="set-knowledge"
                  size="sm"
                  className="w-[220px] max-w-full"
                  value={onboarding.knowledgeLevel}
                  onChange={(event) => void save({ onboarding: { knowledgeLevel: event.target.value } })}
                >
                  {!onboarding.knowledgeLevel && <option value="">{t('account.settings.pickLevel')}</option>}
                  <option value="beginner">{t('account.settings.beginner')}</option>
                  <option value="intermediate">{t('account.settings.intermediate')}</option>
                  <option value="advanced">{t('account.settings.advanced')}</option>
                </Select>
              </RowControl>
            </Row>
            <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 px-4 pb-5 pt-4 m:px-5">
              <legend className="float-left p-0 text-base font-bold">{t('account.settings.interests')}</legend>
              <span className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((option) => {
                  const selected = onboarding.interests.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(option.value)}
                      className={cn(
                        'flex h-10 items-center gap-1.5 rounded-full text-[15px]',
                        selected
                          ? 'border-[1.5px] border-lapis bg-lapis-tint pl-2.5 pr-3.5 font-extrabold text-lapis-edge dark:text-lapis-text'
                          : 'border border-line bg-card px-3.5 font-bold text-ink-soft hover:bg-chip',
                      )}
                    >
                      {selected && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                      {INTEREST_LABELS[option.value] ?? option.label}
                    </button>
                  );
                })}
              </span>
            </fieldset>
          </Card>
        </section>

        <section id="abonnement" aria-labelledby="h-abonnement" className="flex flex-col gap-3">
          <SectionTitle id="h-abonnement" title={t('account.settings.billing')} />
          {billingError && (
            <p role="status" className="m-0 rounded-[12px] bg-chip px-4 py-3 text-[15px] font-bold text-ink-soft">
              {billingError === 'unavailable'
                ? t('account.settings.noSubscription', { email: getSiteConfig().supportEmail })
                : t('account.settings.portalError')}
            </p>
          )}
          <Card padding="none" className="overflow-hidden">
            {premium.action === 'portal' ? (
              <form action="/api/stripe/portal" method="POST" className="border-b border-line-soft">
                <input type="hidden" name="terug" value="/instellingen" />
                <button type="submit" className={cn(linkRow, 'border-b-0 font-[inherit]')}>
                  <PremiumRowContent label={premium.label} />
                </button>
              </form>
            ) : (
              <Link href={premium.href} className={linkRow}>
                <PremiumRowContent label={premium.label} />
              </Link>
            )}
            <Link href="/privacybeleid" className={linkRow}>
              <RowIcon>
                <Shield strokeWidth={2.2} />
              </RowIcon>
              <span className="min-w-0 flex-1 text-base font-bold">{t('account.settings.privacy')}</span>
              <ChevronRight className="size-5 text-ink-muted" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </Card>
        </section>

        <Card padding="none" className="overflow-hidden">
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: '/' })}
            className="flex min-h-[60px] w-full items-center border-0 border-b border-line-soft bg-transparent px-4 text-left text-base font-bold text-coral-text hover:bg-chip/60 m:px-5"
          >
            {t('account.settings.logout')}
          </button>
          <Link
            href="/account-verwijderen"
            className="flex min-h-[60px] items-center gap-3 px-4 text-ink-muted no-underline hover:bg-chip/60 hover:text-ink m:px-5"
          >
            <span className="flex-1 text-base font-bold">{t('account.settings.delete')}</span>
            <ChevronRight className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </Card>
      </PageBody>
    </Container>
  );
}

function PremiumRowContent({ label }: { label: string }) {
  return (
    <>
      <RowIcon tone="gold">
        <CrownSolidIcon size={18} />
      </RowIcon>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-bold">{t('account.settings.managePremium')}</span>
        <span className="text-sm font-semibold text-ink-muted">{label}</span>
      </span>
      <ChevronRight className="size-5 text-ink-muted" strokeWidth={2.2} aria-hidden="true" />
    </>
  );
}
