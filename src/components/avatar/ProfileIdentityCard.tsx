'use client';

import { useState } from 'react';
import { Check, Loader2, Pencil, Shuffle, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import MascotAvatar from '@/components/avatar/MascotAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AVATAR_ACCESSORIES,
  AVATAR_BACKGROUNDS,
  AVATAR_CHARACTERS,
  AVATAR_COLORS,
  type AvatarConfig,
  avatarBackgroundFill,
  describeAvatar,
} from '@/lib/avatar';

/**
 * The masthead of the profile page: mascot, display name, and the controls to
 * change either.
 *
 * Editing is opt-in - the card is a plain header until the user presses
 * "Bewerken" - so the profile still reads as a page about their progress
 * rather than a settings form.
 */

interface ProfileIdentityCardProps {
  initialName: string;
  initialAvatar: AvatarConfig;
  /** Days before renaming is allowed again; 0 when it is allowed now. */
  nameChangeAllowedInDays: number;
  email: string;
  memberSince: string;
  isPremium: boolean;
}

type PartKey = keyof AvatarConfig;

const PART_LABELS: Record<PartKey, string> = {
  character: 'Figuur',
  color: 'Kleur',
  background: 'Achtergrond',
  accessory: 'Accessoire',
};

function randomAvatar(): AvatarConfig {
  const take = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

  return {
    character: take(AVATAR_CHARACTERS).id,
    color: take(AVATAR_COLORS).id,
    background: take(AVATAR_BACKGROUNDS).id,
    accessory: take(AVATAR_ACCESSORIES).id,
  };
}

export default function ProfileIdentityCard({
  initialName,
  initialAvatar,
  nameChangeAllowedInDays,
  email,
  memberSince,
  isPremium,
}: ProfileIdentityCardProps) {
  const { update: updateSession } = useSession();

  const [savedName, setSavedName] = useState(initialName);
  const [savedAvatar, setSavedAvatar] = useState(initialAvatar);
  const [cooldownDays, setCooldownDays] = useState(nameChangeAllowedInDays);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(initialName);
  const [draftAvatar, setDraftAvatar] = useState(initialAvatar);
  const [isSaving, setIsSaving] = useState(false);

  const nameLocked = cooldownDays > 0;
  const nameChanged = draftName.trim() !== savedName;
  const avatarChanged = (Object.keys(draftAvatar) as PartKey[]).some((key) => draftAvatar[key] !== savedAvatar[key]);

  const openEditor = () => {
    setDraftName(savedName);
    setDraftAvatar(savedAvatar);
    setIsEditing(true);
  };

  const setPart = <K extends PartKey>(key: K, value: AvatarConfig[K]) => {
    setDraftAvatar((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!nameChanged && !avatarChanged) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

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

      setSavedName(payload.user.name);
      setSavedAvatar(payload.user.avatar);
      setCooldownDays(payload.user.nameChangeAllowedInDays ?? 0);
      setIsEditing(false);

      // The name shows in the navbar too, which reads it from the session.
      if (nameChanged) {
        await updateSession({ name: payload.user.name });
      }

      toast.success('Profiel bijgewerkt.');
    } catch (error) {
      console.error('[PROFILE_IDENTITY_SAVE]', error);
      toast.error('Opslaan is niet gelukt. Probeer het opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-b border-rule pb-8">
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <MascotAvatar avatar={isEditing ? draftAvatar : savedAvatar} size={88} bordered />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
              {savedName || 'Naamloos'}
            </h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full border border-lapis/35 bg-lapis-tint px-2.5 py-0.5 text-[11px] font-medium text-lapis">
                Premium
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-muted">
            <span>{email}</span>
            <span>Lid sinds {memberSince}</span>
            <span>{describeAvatar(savedAvatar)}</span>
          </div>
        </div>

        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={openEditor}
            className="h-10 shrink-0 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken"
          >
            <Pencil className="h-3.5 w-3.5" />
            Bewerken
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="mt-8 rounded-lg border border-rule bg-paper-raised p-5">
          <div className="mb-6">
            <label htmlFor="display-name" className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Weergavenaam
            </label>
            <Input
              id="display-name"
              value={draftName}
              maxLength={30}
              disabled={nameLocked}
              onChange={(event) => setDraftName(event.target.value)}
              className="max-w-sm border-rule bg-paper"
            />
            <p className="mt-2 text-xs text-ink-muted">
              {nameLocked
                ? `Je kunt je naam over ${cooldownDays} ${cooldownDays === 1 ? 'dag' : 'dagen'} weer wijzigen.`
                : 'Zichtbaar op de ranglijst en in multiplayer. Eens per 30 dagen te wijzigen.'}
            </p>
          </div>

          <div className="space-y-5 border-t border-rule pt-5">
            <PartPicker
              partKey="character"
              options={AVATAR_CHARACTERS.map((option) => ({
                id: option.id,
                label: option.label,
                preview: { ...draftAvatar, character: option.id },
              }))}
              selected={draftAvatar.character}
              onSelect={(value) => setPart('character', value as AvatarConfig['character'])}
            />

            <PartPicker
              partKey="color"
              options={AVATAR_COLORS.map((option) => ({
                id: option.id,
                label: option.label,
                swatch: option.base,
              }))}
              selected={draftAvatar.color}
              onSelect={(value) => setPart('color', value as AvatarConfig['color'])}
            />

            <PartPicker
              partKey="background"
              options={AVATAR_BACKGROUNDS.map((option) => ({
                id: option.id,
                label: option.label,
                swatch: avatarBackgroundFill(option.id),
              }))}
              selected={draftAvatar.background}
              onSelect={(value) => setPart('background', value as AvatarConfig['background'])}
            />

            <PartPicker
              partKey="accessory"
              options={AVATAR_ACCESSORIES.map((option) => ({
                id: option.id,
                label: option.label,
                preview: { ...draftAvatar, accessory: option.id },
              }))}
              selected={draftAvatar.accessory}
              onSelect={(value) => setPart('accessory', value as AvatarConfig['accessory'])}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
            <Button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Opslaan
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken"
            >
              <X className="h-4 w-4" />
              Annuleren
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setDraftAvatar(randomAvatar())}
              disabled={isSaving}
              className="h-10 rounded-md px-4 text-ink-muted hover:text-ink"
            >
              <Shuffle className="h-4 w-4" />
              Verras me
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PartOption {
  id: string;
  label: string;
  /** Draw the whole mascot with this part applied. */
  preview?: AvatarConfig;
  /** Or just a colour chip, where a full mascot would be redundant. */
  swatch?: string;
}

function PartPicker({
  partKey,
  options,
  selected,
  onSelect,
}: {
  partKey: PartKey;
  options: PartOption[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">{PART_LABELS[partKey]}</p>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const isActive = option.id === selected;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              aria-pressed={isActive}
              title={option.label}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors ${
                isActive ? 'border-lapis bg-lapis-tint' : 'border-rule bg-paper hover:bg-paper-sunken'
              }`}
            >
              {option.preview ? (
                <MascotAvatar avatar={option.preview} size={44} />
              ) : (
                <span
                  className="h-11 w-11 rounded-full border border-rule"
                  style={{ backgroundColor: option.swatch }}
                />
              )}
              <span className={`text-[11px] ${isActive ? 'text-ink' : 'text-ink-muted'}`}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
