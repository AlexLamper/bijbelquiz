import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { connectDB, User } from '@/database';
import { getSession } from '@/lib/get-session';
import {
  normalizeOnboardingSettings,
  normalizeUserSettings,
  type UserOnboardingSettings,
  type UserSettings,
} from '@/lib/user-settings';

const settingsSchema = z
  .object({
    themePreference: z.enum(['light', 'dark', 'system']).optional(),
    emailNotifications: z.boolean().optional(),
    soundEffects: z.boolean().optional(),
    showBibleReferences: z.boolean().optional(),
    dailyReminder: z.boolean().optional(),
    preferredDifficulty: z.enum(['all', 'easy', 'medium', 'hard']).optional(),
    questionFontSize: z.enum(['normal', 'large']).optional(),
  })
  .strict();

const onboardingSchema = z
  .object({
    bibleReadingFrequency: z.string().trim().max(40).optional(),
    knowledgeLevel: z.string().trim().max(40).optional(),
    interests: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
  })
  .strict();

const updateSchema = z
  .object({
    settings: settingsSchema.optional(),
    onboarding: onboardingSchema.optional(),
  })
  .strict()
  .refine((data) => data.settings || data.onboarding, {
    message: 'Geen instellingen ontvangen',
  });

function sanitizeInterests(interests: string[] | undefined): string[] | undefined {
  if (!interests) return undefined;

  const cleaned = Array.from(
    new Set(
      interests
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

  return cleaned.slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        name: user.name || '',
        email: user.email || '',
      },
      settings: normalizeUserSettings(user.settings as Partial<UserSettings>),
      onboarding: normalizeOnboardingSettings(user.onboarding as Partial<UserOnboardingSettings>),
    });
  } catch (error) {
    console.error('[USER_SETTINGS_GET]', error);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Ongeldige instellingen',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updateSet: Record<string, unknown> = {};

    if (parsed.data.settings) {
      const settings = parsed.data.settings;

      if (settings.themePreference !== undefined) updateSet['settings.themePreference'] = settings.themePreference;
      if (settings.emailNotifications !== undefined) updateSet['settings.emailNotifications'] = settings.emailNotifications;
      if (settings.soundEffects !== undefined) updateSet['settings.soundEffects'] = settings.soundEffects;
      if (settings.showBibleReferences !== undefined) updateSet['settings.showBibleReferences'] = settings.showBibleReferences;
      if (settings.dailyReminder !== undefined) updateSet['settings.dailyReminder'] = settings.dailyReminder;
      if (settings.preferredDifficulty !== undefined) updateSet['settings.preferredDifficulty'] = settings.preferredDifficulty;
      if (settings.questionFontSize !== undefined) updateSet['settings.questionFontSize'] = settings.questionFontSize;
    }

    if (parsed.data.onboarding) {
      const onboarding = parsed.data.onboarding;

      if (onboarding.bibleReadingFrequency !== undefined) {
        updateSet['onboarding.bibleReadingFrequency'] = onboarding.bibleReadingFrequency;
      }

      if (onboarding.knowledgeLevel !== undefined) {
        updateSet['onboarding.knowledgeLevel'] = onboarding.knowledgeLevel;
      }

      if (onboarding.interests !== undefined) {
        updateSet['onboarding.interests'] = sanitizeInterests(onboarding.interests);
      }
    }

    if (Object.keys(updateSet).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen ontvangen' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateSet },
      { new: true }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name || '',
        email: user.email || '',
      },
      settings: normalizeUserSettings(user.settings as Partial<UserSettings>),
      onboarding: normalizeOnboardingSettings(user.onboarding as Partial<UserOnboardingSettings>),
    });
  } catch (error) {
    console.error('[USER_SETTINGS_PUT]', error);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
