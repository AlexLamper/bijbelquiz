import { connectDB, User } from '@/database';
import { AvatarConfig, normalizeAvatar, resolveAvatar } from '@/lib/avatar';

/**
 * Display name and mascot: the two things a player owns and can change.
 *
 * Both the website (session cookie) and the app (bearer token) write them, so
 * the rules - the 30 day rename cooldown, the length bounds, the avatar
 * catalogue check - live here rather than in either route.
 */

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 30;
export const NAME_CHANGE_COOLDOWN_DAYS = 30;

export type IdentityUpdateResult =
  | { ok: true; name: string; avatar: AvatarConfig }
  | { ok: false; status: number; error: string };

function cooldownEndsAt(changedAt: Date): Date {
  const next = new Date(changedAt);
  next.setDate(next.getDate() + NAME_CHANGE_COOLDOWN_DAYS);
  return next;
}

/** Days left before this user may rename again, or 0 when they may now. */
export function daysUntilRenameAllowed(nameUpdatedAt: Date | null | undefined, now = new Date()): number {
  if (!nameUpdatedAt) {
    return 0;
  }

  const nextAllowed = cooldownEndsAt(new Date(nameUpdatedAt));
  if (now >= nextAllowed) {
    return 0;
  }

  return Math.ceil((nextAllowed.getTime() - now.getTime()) / (1000 * 3600 * 24));
}

export function validateDisplayName(value: unknown): { ok: true; name: string } | { ok: false; error: string } {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Naam moet tussen de ${NAME_MIN_LENGTH} en ${NAME_MAX_LENGTH} karakters lang zijn.`,
    };
  }

  return { ok: true, name };
}

/**
 * Apply a name and/or avatar change for `userId`.
 *
 * Passing only `avatar` skips the rename path entirely, so changing a mascot
 * never burns the monthly rename allowance. Renaming to the name you already
 * have is a no-op for the same reason.
 */
export async function updateIdentity(
  userId: string,
  input: { name?: unknown; avatar?: unknown },
): Promise<IdentityUpdateResult> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    return { ok: false, status: 404, error: 'Gebruiker niet gevonden' };
  }

  if (input.name !== undefined) {
    const validated = validateDisplayName(input.name);
    if (!validated.ok) {
      return { ok: false, status: 400, error: validated.error };
    }

    if (user.name !== validated.name) {
      const remainingDays = daysUntilRenameAllowed(user.nameUpdatedAt);
      if (remainingDays > 0) {
        return {
          ok: false,
          status: 403,
          error: `Je kunt je naam eens per ${NAME_CHANGE_COOLDOWN_DAYS} dagen wijzigen. Wacht nog ${remainingDays} ${
            remainingDays === 1 ? 'dag' : 'dagen'
          }.`,
        };
      }

      user.name = validated.name;
      user.nameUpdatedAt = new Date();
    }
  }

  if (input.avatar !== undefined) {
    user.avatar = normalizeAvatar(input.avatar);
  }

  await user.save();

  return {
    ok: true,
    name: user.name || 'Speler',
    avatar: resolveAvatar(user.avatar, String(user._id)),
  };
}
