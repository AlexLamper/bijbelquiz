'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, Loader2, Palette, Save, Settings2, UserPen } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  type QuestionFontSize,
  type ThemePreference,
  type UserOnboardingSettings,
  type UserSettings,
} from '@/lib/user-settings';

interface SettingsClientProps {
  initialData: {
    profile: {
      name: string;
      email: string;
    };
    settings: UserSettings;
    onboarding: UserOnboardingSettings;
  };
}

const INTEREST_OPTIONS = [
  { value: 'oude-testament', label: 'Oude Testament' },
  { value: 'nieuwe-testament', label: 'Nieuwe Testament' },
  { value: 'evangelien', label: 'Evangelien' },
  { value: 'profeten', label: 'Profeten' },
  { value: 'wijsheid', label: 'Wijsheid & Spreuken' },
  { value: 'personen', label: 'Bijbelse personen' },
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function SettingsClient({ initialData }: SettingsClientProps) {
  const { setTheme } = useTheme();
  const { update } = useSession();

  const [displayName, setDisplayName] = useState(initialData.profile.name);
  const [nameDraft, setNameDraft] = useState(initialData.profile.name);
  const [settings, setSettings] = useState<UserSettings>(initialData.settings);
  const [onboarding, setOnboarding] = useState<UserOnboardingSettings>(initialData.onboarding);
  const [nameSaving, setNameSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const saveBadgeClasses = useMemo(() => {
    if (saveState === 'saving') {
      return 'border-rule bg-paper-sunken text-ink-muted';
    }

    if (saveState === 'saved') {
      return 'border-positive/35 bg-positive-tint text-positive';
    }

    if (saveState === 'error') {
      return 'border-vermilion/35 bg-vermilion-tint text-vermilion';
    }

    return 'border-rule bg-paper-raised text-ink-muted';
  }, [saveState]);

  const applySavedState = (message: string) => {
    setSaveState('saved');
    setSaveMessage(message);

    window.setTimeout(() => {
      setSaveState('idle');
      setSaveMessage('');
    }, 1600);
  };

  const saveSettingsPatch = async (
    patch: { settings?: Partial<UserSettings>; onboarding?: Partial<UserOnboardingSettings> },
    successMessage: string,
    rollbackTheme?: ThemePreference
  ): Promise<boolean> => {
    const previousSettings = settings;
    const previousOnboarding = onboarding;

    if (patch.settings) {
      setSettings((current) => ({
        ...current,
        ...patch.settings,
      }));
    }

    if (patch.onboarding) {
      setOnboarding((current) => ({
        ...current,
        ...patch.onboarding,
        interests: patch.onboarding?.interests ?? current.interests,
      }));
    }

    setSaveState('saving');
    setSaveMessage('Instellingen opslaan...');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type':'application/json',
        },
        body: JSON.stringify(patch),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Kon instellingen niet opslaan');
      }

      setSettings(payload.settings);
      setOnboarding(payload.onboarding);
      applySavedState(successMessage);
      return true;
    } catch (error) {
      setSettings(previousSettings);
      setOnboarding(previousOnboarding);

      if (rollbackTheme) {
        setTheme(rollbackTheme);
      }

      const message = error instanceof Error ? error.message : 'Kon instellingen niet opslaan';
      setSaveState('error');
      setSaveMessage(message);
      toast.error(message);
      return false;
    }
  };

  const updateThemePreference = async (themePreference: ThemePreference) => {
    const previousTheme = settings.themePreference;
    setTheme(themePreference);
    await saveSettingsPatch(
      { settings: { themePreference } },
      'Thema opgeslagen',
      previousTheme
    );
  };

  const updateSwitchSetting = async (
    key: 'emailNotifications' | 'soundEffects' | 'showBibleReferences' | 'dailyReminder',
    value: boolean,
    successMessage: string
  ) => {
    await saveSettingsPatch(
      {
        settings: {
          [key]: value,
        },
      },
      successMessage
    );
  };

  const updateDifficultyPreference = async (value: UserSettings['preferredDifficulty']) => {
    await saveSettingsPatch(
      {
        settings: {
          preferredDifficulty: value,
        },
      },
      'Moeilijkheid opgeslagen'
    );
  };

  const updateQuestionFontSize = async (value: QuestionFontSize) => {
    await saveSettingsPatch(
      {
        settings: {
          questionFontSize: value,
        },
      },
      'Tekstgrootte opgeslagen'
    );
  };

  const updateOnboardingField = async (
    field: keyof Omit<UserOnboardingSettings, 'interests'>,
    value: string,
    successMessage: string
  ) => {
    await saveSettingsPatch(
      {
        onboarding: {
          [field]: value,
        },
      },
      successMessage
    );
  };

  const toggleInterest = async (interest: string, checked: boolean) => {
    const nextInterests = checked
      ? Array.from(new Set([...onboarding.interests, interest]))
      : onboarding.interests.filter((item) => item !== interest);

    await saveSettingsPatch(
      {
        onboarding: {
          interests: nextInterests,
        },
      },
      'Interesses opgeslagen'
    );
  };

  const saveDisplayName = async () => {
    const trimmedName = nameDraft.trim();

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 30) {
      toast.error('Naam moet tussen de 2 en 30 tekens zijn.');
      return;
    }

    if (trimmedName === displayName) {
      return;
    }

    setNameSaving(true);

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type':'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Naam kon niet worden opgeslagen');
      }

      const nextName = payload?.user?.name || trimmedName;
      setDisplayName(nextName);
      setNameDraft(nextName);
      await update({ name: nextName });
      toast.success('Naam bijgewerkt');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Naam kon niet worden opgeslagen';
      toast.error(message);
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper pb-16 pt-8 lg:pt-10">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-7">
          <div>
            <Eyebrow>Account</Eyebrow>
            <h1 className="mt-3 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">Instellingen</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              Pas je account en voorkeuren direct aan. Wijzigingen worden meteen opgeslagen.
            </p>
          </div>

          <Badge className={cn('rounded-sm border px-2.5 py-1', saveBadgeClasses)}>
            {saveState === 'saving' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {saveState === 'saved' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
            {saveState === 'idle' && <Settings2 className="mr-1.5 h-3.5 w-3.5" />}
            {saveState === 'error' && <Save className="mr-1.5 h-3.5 w-3.5" />}
            {saveMessage || 'Klaar om te bewaren'}
          </Badge>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 pt-9 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardHeader className="border-b border-rule pb-5 pt-6">
            <CardTitle className="flex items-center gap-2.5 font-display text-xl font-normal tracking-[-0.015em] text-ink">
              <UserPen className="h-4 w-4 text-lapis" />
              Account
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-muted">
              Werk je profielnaam bij. Je e-mailadres is gekoppeld aan je account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pb-7 pt-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Naam</Label>
              <Input
                id="settings-name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                className="border-rule bg-paper-raised text-ink"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">E-mail</Label>
              <Input
                id="settings-email"
                value={initialData.profile.email}
                readOnly
                className="border-rule bg-paper-sunken text-ink-muted"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={saveDisplayName}
                disabled={nameSaving || nameDraft.trim() === displayName}
                className="h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft"
              >
                {nameSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Naam opslaan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rule py-0">
          <CardHeader className="border-b border-rule pb-5 pt-6">
            <CardTitle className="flex items-center gap-2.5 font-display text-xl font-normal tracking-[-0.015em] text-ink">
              <Palette className="h-4 w-4 text-lapis" />
              App voorkeuren
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-muted">
              Kies je thema, leesinstellingen en standaard quizvoorkeuren.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pb-7 pt-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Thema</Label>
              <Select value={settings.themePreference} onValueChange={(value) => updateThemePreference(value as ThemePreference)}>
                <SelectTrigger className="border-rule bg-paper-raised text-ink">
                  <SelectValue placeholder="Kies thema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Systeem</SelectItem>
                  <SelectItem value="light">Licht</SelectItem>
                  <SelectItem value="dark">Donker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Standaard moeilijkheid</Label>
              <Select value={settings.preferredDifficulty} onValueChange={(value) => updateDifficultyPreference(value as UserSettings['preferredDifficulty'])}>
                <SelectTrigger className="border-rule bg-paper-raised text-ink">
                  <SelectValue placeholder="Kies moeilijkheid" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alles</SelectItem>
                  <SelectItem value="easy">Makkelijk</SelectItem>
                  <SelectItem value="medium">Gemiddeld</SelectItem>
                  <SelectItem value="hard">Moeilijk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Vraagtekst grootte</Label>
              <Select value={settings.questionFontSize} onValueChange={(value) => updateQuestionFontSize(value as QuestionFontSize)}>
                <SelectTrigger className="border-rule bg-paper-raised text-ink">
                  <SelectValue placeholder="Kies tekstgrootte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normaal</SelectItem>
                  <SelectItem value="large">Groot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rule py-0">
          <CardHeader className="border-b border-rule pb-5 pt-6">
            <CardTitle className="flex items-center gap-2.5 font-display text-xl font-normal tracking-[-0.015em] text-ink">
              <BookOpenCheck className="h-4 w-4 text-lapis" />
              Bijbelstudie voorkeuren
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-ink-muted">
              Geef je leesritme en interesses op zodat quiz-aanbevelingen beter aansluiten.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 pb-7 pt-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Hoe vaak lees je de Bijbel?</Label>
              <Select
                value={onboarding.bibleReadingFrequency || undefined}
                onValueChange={(value) => updateOnboardingField('bibleReadingFrequency', value, 'Leesfrequentie opgeslagen')}
              >
                <SelectTrigger className="border-rule bg-paper-raised text-ink">
                  <SelectValue placeholder="Kies frequentie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Dagelijks</SelectItem>
                  <SelectItem value="weekly">Wekelijks</SelectItem>
                  <SelectItem value="monthly">Maandelijks</SelectItem>
                  <SelectItem value="rarely">Af en toe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Hoe schat je je kennisniveau in?</Label>
              <Select
                value={onboarding.knowledgeLevel || undefined}
                onValueChange={(value) => updateOnboardingField('knowledgeLevel', value, 'Kennisniveau opgeslagen')}
              >
                <SelectTrigger className="border-rule bg-paper-raised text-ink">
                  <SelectValue placeholder="Kies niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Gemiddeld</SelectItem>
                  <SelectItem value="advanced">Gevorderd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-semibold text-ink">Interessegebieden</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {INTEREST_OPTIONS.map((option) => {
                  const checked = onboarding.interests.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                        checked
                          ? 'border-rule bg-paper-sunken text-ink'
                          : 'border-rule text-ink-soft hover:bg-paper-sunken   '
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => toggleInterest(option.value, next === true)}
                        className="border-rule data-[state=checked]:bg-lapis data-[state=checked]:border-lapis/35"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
