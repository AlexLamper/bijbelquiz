'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, Loader2, Palette, Save, Settings2, UserPen } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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

  const [displayName, setDisplayName] = useState(initialData.profile.name);
  const [nameDraft, setNameDraft] = useState(initialData.profile.name);
  const [settings, setSettings] = useState<UserSettings>(initialData.settings);
  const [onboarding, setOnboarding] = useState<UserOnboardingSettings>(initialData.onboarding);
  const [nameSaving, setNameSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const saveBadgeClasses = useMemo(() => {
    if (saveState === 'saving') {
      return 'border-[#c5d5ef] bg-[#edf3ff] text-[#2a4570] dark:border-[#2f4670] dark:bg-[#1a2b47] dark:text-[#c6d8f5]';
    }

    if (saveState === 'saved') {
      return 'border-[#b8dcc0] bg-[#eef8f0] text-[#245a30] dark:border-[#2e6b3f] dark:bg-[#173225] dark:text-[#bce8c7]';
    }

    if (saveState === 'error') {
      return 'border-[#e1c4c4] bg-[#fff1f1] text-[#7a2f2f] dark:border-[#7b3434] dark:bg-[#381c1c] dark:text-[#f3c8c8]';
    }

    return 'border-[#d7e1ee] bg-white text-[#4e5f79] dark:border-[#2f4670] dark:bg-[#12213a] dark:text-[#9fb3d6]';
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
          'Content-Type': 'application/json',
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
          'Content-Type': 'application/json',
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
      toast.success('Naam bijgewerkt');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Naam kon niet worden opgeslagen';
      toast.error(message);
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div className="relative -mt-24 min-h-screen overflow-hidden pb-14 pt-24">
      <div className="pointer-events-none absolute -top-24 left-0 -z-10 h-72 w-72 rounded-full bg-[#bbcff0]/45 blur-3xl dark:bg-zinc-900/40" />
      <div className="pointer-events-none absolute right-0 top-8 -z-10 h-64 w-64 rounded-full bg-[#d9e5f8]/70 blur-3xl dark:bg-zinc-800/35" />

      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl text-[#1f2f4b] md:text-5xl dark:text-[#dce7fa]">Instellingen</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5f7297] dark:text-[#9fb3d6]">
              Pas je account en voorkeuren direct aan. Wijzigingen worden meteen opgeslagen.
            </p>
          </div>

          <Badge className={cn('rounded-md border px-3 py-1 text-xs font-semibold', saveBadgeClasses)}>
            {saveState === 'saving' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {saveState === 'saved' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
            {saveState === 'idle' && <Settings2 className="mr-1.5 h-3.5 w-3.5" />}
            {saveState === 'error' && <Save className="mr-1.5 h-3.5 w-3.5" />}
            {saveMessage || 'Klaar om te bewaren'}
          </Badge>
        </div>
      </section>

      <section className="mx-auto grid max-w-340 gap-6 px-4 pt-8 sm:px-5 lg:px-4">
        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardHeader className="pt-7">
            <CardTitle className="flex items-center gap-2 text-2xl text-[#1f2f4b] dark:text-zinc-100">
              <UserPen className="h-5 w-5 text-[#4f6faa] dark:text-zinc-300" />
              Account
            </CardTitle>
            <CardDescription className="text-[#5f7297] dark:text-zinc-300">
              Werk je profielnaam bij. Je e-mailadres is gekoppeld aan je account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pb-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="text-[#30466e] dark:text-zinc-200">Naam</Label>
              <Input
                id="settings-name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                className="border-[#d7e1ee] bg-white text-[#1f2f4b] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-[#30466e] dark:text-zinc-200">E-mail</Label>
              <Input
                id="settings-email"
                value={initialData.profile.email}
                readOnly
                className="border-[#d7e1ee] bg-[#f5f8fd] text-[#5f7297] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={saveDisplayName}
                disabled={nameSaving || nameDraft.trim() === displayName}
                className="h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc] dark:bg-[#6f8ed4] dark:hover:bg-[#5f81cc]"
              >
                {nameSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Naam opslaan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardHeader className="pt-7">
            <CardTitle className="flex items-center gap-2 text-2xl text-[#1f2f4b] dark:text-zinc-100">
              <Palette className="h-5 w-5 text-[#4f6faa] dark:text-zinc-300" />
              App voorkeuren
            </CardTitle>
            <CardDescription className="text-[#5f7297] dark:text-zinc-300">
              Kies je thema, leesinstellingen en standaard quizvoorkeuren.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pb-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[#30466e] dark:text-zinc-200">Thema</Label>
              <Select value={settings.themePreference} onValueChange={(value) => updateThemePreference(value as ThemePreference)}>
                <SelectTrigger className="border-[#d7e1ee] bg-white text-[#1f2f4b] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
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
              <Label className="text-[#30466e] dark:text-zinc-200">Standaard moeilijkheid</Label>
              <Select value={settings.preferredDifficulty} onValueChange={(value) => updateDifficultyPreference(value as UserSettings['preferredDifficulty'])}>
                <SelectTrigger className="border-[#d7e1ee] bg-white text-[#1f2f4b] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
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
              <Label className="text-[#30466e] dark:text-zinc-200">Vraagtekst grootte</Label>
              <Select value={settings.questionFontSize} onValueChange={(value) => updateQuestionFontSize(value as QuestionFontSize)}>
                <SelectTrigger className="border-[#d7e1ee] bg-white text-[#1f2f4b] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                  <SelectValue placeholder="Kies tekstgrootte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normaal</SelectItem>
                  <SelectItem value="large">Groot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-lg border border-[#d8e1ee] bg-[#f8fbff] p-4 dark:border-zinc-700 dark:bg-zinc-900/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#30466e] dark:text-zinc-100">E-mail updates</p>
                  <p className="text-xs text-[#607597] dark:text-zinc-400">Ontvang nieuws en maandelijkse voortgang.</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSwitchSetting('emailNotifications', checked === true, 'E-mail voorkeur opgeslagen')}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#30466e] dark:text-zinc-100">Geluidseffecten</p>
                  <p className="text-xs text-[#607597] dark:text-zinc-400">Speel klik- en feedbackgeluiden af in quizzen.</p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => updateSwitchSetting('soundEffects', checked === true, 'Geluid voorkeur opgeslagen')}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#30466e] dark:text-zinc-100">Toon bijbelreferenties</p>
                  <p className="text-xs text-[#607597] dark:text-zinc-400">Laat hoofdstuk- en versverwijzingen altijd zien.</p>
                </div>
                <Switch
                  checked={settings.showBibleReferences}
                  onCheckedChange={(checked) => updateSwitchSetting('showBibleReferences', checked === true, 'Referentie voorkeur opgeslagen')}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#30466e] dark:text-zinc-100">Dagelijkse herinnering</p>
                  <p className="text-xs text-[#607597] dark:text-zinc-400">Krijg een seintje om je streak te behouden.</p>
                </div>
                <Switch
                  checked={settings.dailyReminder}
                  onCheckedChange={(checked) => updateSwitchSetting('dailyReminder', checked === true, 'Herinnering voorkeur opgeslagen')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardHeader className="pt-7">
            <CardTitle className="flex items-center gap-2 text-2xl text-[#1f2f4b] dark:text-zinc-100">
              <BookOpenCheck className="h-5 w-5 text-[#4f6faa] dark:text-zinc-300" />
              Bijbelstudie voorkeuren
            </CardTitle>
            <CardDescription className="text-[#5f7297] dark:text-zinc-300">
              Geef je leesritme en interesses op zodat quiz-aanbevelingen beter aansluiten.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 pb-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[#30466e] dark:text-zinc-200">Hoe vaak lees je de Bijbel?</Label>
              <Select
                value={onboarding.bibleReadingFrequency || undefined}
                onValueChange={(value) => updateOnboardingField('bibleReadingFrequency', value, 'Leesfrequentie opgeslagen')}
              >
                <SelectTrigger className="border-[#d7e1ee] bg-white text-[#1f2f4b] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
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
              <Label className="text-[#30466e] dark:text-zinc-200">Hoe schat je je kennisniveau in?</Label>
              <Select
                value={onboarding.knowledgeLevel || undefined}
                onValueChange={(value) => updateOnboardingField('knowledgeLevel', value, 'Kennisniveau opgeslagen')}
              >
                <SelectTrigger className="border-[#d7e1ee] bg-white text-[#1f2f4b] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
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
              <p className="mb-2 text-sm font-semibold text-[#30466e] dark:text-zinc-200">Interessegebieden</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {INTEREST_OPTIONS.map((option) => {
                  const checked = onboarding.interests.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                        checked
                          ? 'border-[#b9cbea] bg-[#edf3ff] text-[#24416c] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
                          : 'border-[#d7e1ee] text-[#4e5f79] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => toggleInterest(option.value, next === true)}
                        className="border-[#c7d6ec] data-[state=checked]:bg-[#6f8ed4] data-[state=checked]:border-[#6f8ed4]"
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
