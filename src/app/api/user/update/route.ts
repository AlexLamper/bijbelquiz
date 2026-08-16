import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, User } from '@/database';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { resolveAvatar } from '@/lib/avatar';
import { daysUntilRenameAllowed, updateIdentity } from '@/lib/profile-identity';

/**
 * PUT /api/user/update - change display name and/or mascot.
 *
 * `getSession` accepts both the NextAuth cookie and a mobile bearer token, so
 * this one route serves the website and the app. The rules themselves live in
 * `lib/profile-identity.ts`.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.name === undefined && body?.avatar === undefined) {
      return NextResponse.json({ error: 'Niets om bij te werken.' }, { status: 400 });
    }

    const result = await updateIdentity(session.user.id, {
      name: body?.name,
      avatar: body?.avatar,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const premium = getPremiumSnapshot(user);

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: result.name,
        email: user.email,
        image: user.image,
        avatar: result.avatar,
        xp: user.xp,
        isPremium: premium.isPremium,
        premiumStripe: premium.premiumStripe,
        premiumStore: premium.premiumStore,
        storePremiumExpiresAt: premium.storePremiumExpiresAt,
        nameChangeAllowedInDays: daysUntilRenameAllowed(user.nameUpdatedAt),
      },
    });
  } catch (error) {
    console.error('[USER_UPDATE_PUT]', error);
    return NextResponse.json({ error: 'Er is een interne fout opgetreden' }, { status: 500 });
  }
}

/** The caller's own identity, so a customiser can open pre-filled. */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('name email image avatar nameUpdatedAt').lean();

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      id: String(user._id),
      name: user.name || 'Speler',
      email: user.email,
      image: user.image,
      avatar: resolveAvatar(user.avatar, String(user._id)),
      nameChangeAllowedInDays: daysUntilRenameAllowed(user.nameUpdatedAt),
    });
  } catch (error) {
    console.error('[USER_UPDATE_GET]', error);
    return NextResponse.json({ error: 'Er is een interne fout opgetreden' }, { status: 500 });
  }
}
