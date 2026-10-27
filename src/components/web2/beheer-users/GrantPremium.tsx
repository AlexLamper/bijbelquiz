'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Undo2 } from 'lucide-react';

import { Button } from '@/components/bq/Button';
import { Field, Input, Textarea } from '@/components/bq/Field';
import { Modal } from '@/components/bq/Modal';
import { toast } from '@/components/bq/Toast';
import { GRANT_DURATIONS, GRANT_DURATION_LABELS, GRANT_NOTE_MAX, type GrantDuration } from '@/lib/admin/grant-options';
import { cn } from '@/lib/utils';

/**
 * "Premium geven" and "Premium intrekken" in beheer. Both call the admin API
 * (`/api/admin/users/{id}/premium`), which validates, writes the dated grant
 * through the single Premium recompute and logs who did it; the page then
 * re-renders from the server.
 */

function tomorrowKey() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
}

export function GrantPremiumButton({
  userId,
  userName,
  hasGrant,
  size = 'md',
  variant = 'gold',
  label = 'Premium geven',
  iconOnly,
}: {
  userId: string;
  userName: string;
  /** A manual grant is already running: the dialog then changes its end date. */
  hasGrant?: boolean;
  size?: 'sm' | 'md';
  variant?: 'gold' | 'secondary';
  label?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [duration, setDuration] = React.useState<GrantDuration>('1m');
  const [until, setUntil] = React.useState('');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<{ field?: string; message: string } | null>(null);
  const formId = React.useId();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, until: duration === 'custom' ? until : null, note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ field: json.field, message: json.error || 'Premium geven is niet gelukt.' });
        return;
      }
      toast.success(`${userName} heeft nu Premium`);
      setOpen(false);
      setNote('');
      router.refresh();
    } catch {
      setError({ message: 'Premium geven is niet gelukt. Probeer het opnieuw.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size === 'sm' ? 'sm' : 'md'}
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? `${label}: ${userName}` : undefined}
        title={iconOnly ? `${label}: ${userName}` : undefined}
        className={cn(iconOnly && 'size-10 px-0')}
      >
        <Crown className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
        {!iconOnly && label}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Premium geven"
        description={
          hasGrant
            ? `${userName} heeft al Premium van beheer. Een nieuwe keuze vervangt de einddatum.`
            : `Gratis Premium voor ${userName}. Het stopt vanzelf op de einddatum; Premium dat iemand zelf betaalt blijft altijd staan.`
        }
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Annuleren
            </Button>
            <Button type="submit" form={formId} variant="gold" loading={busy}>
              Premium geven
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1.5 text-sm font-extrabold text-ink">Hoe lang</legend>
            <div role="radiogroup" aria-label="Hoe lang" className="grid grid-cols-2 gap-2 m:grid-cols-3">
              {GRANT_DURATIONS.map((value) => {
                const selected = value === duration;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDuration(value)}
                    className={cn(
                      'h-11 rounded-[12px] border px-3 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
                      selected
                        ? 'border-lapis bg-lapis-tint font-extrabold text-lapis'
                        : 'border-line bg-card font-bold text-ink-soft hover:border-input-line hover:text-ink',
                    )}
                  >
                    {GRANT_DURATION_LABELS[value]}
                  </button>
                );
              })}
            </div>
            {error?.field === 'duration' && (
              <p role="alert" className="m-0 text-sm font-bold text-coral-text">
                {error.message}
              </p>
            )}
          </fieldset>

          {duration === 'custom' && (
            <Field label="Einddatum" htmlFor={`${formId}-until`} error={error?.field === 'until' ? error.message : undefined} hint="Premium loopt tot en met deze dag.">
              <Input
                id={`${formId}-until`}
                type="date"
                min={tomorrowKey()}
                value={until}
                onChange={(event) => setUntil(event.target.value)}
                invalid={error?.field === 'until'}
                required
              />
            </Field>
          )}

          <Field
            label="Notitie (optioneel)"
            htmlFor={`${formId}-note`}
            aside={`${note.length}/${GRANT_NOTE_MAX}`}
            error={error?.field === 'note' ? error.message : undefined}
            hint="Waarom, voor later. Staat in de geschiedenis van dit account."
          >
            <Textarea
              id={`${formId}-note`}
              rows={3}
              maxLength={GRANT_NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Bijvoorbeeld: prijs van de zomerquiz"
            />
          </Field>

          {error && !error.field && (
            <p role="alert" className="m-0 text-sm font-bold text-coral-text">
              {error.message}
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}

export function RevokePremiumButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const noteId = React.useId();

  const revoke = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || 'Intrekken is niet gelukt.');
        return;
      }
      toast.success('Premium van beheer ingetrokken');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Intrekken is niet gelukt.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" variant="danger-secondary" onClick={() => setOpen(true)}>
        <Undo2 className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
        Premium intrekken
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title="Premium intrekken?"
        description={`Het Premium dat beheer aan ${userName} gaf stopt nu. Premium dat ${userName} zelf betaalt of via een groep heeft blijft staan.`}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Annuleren
            </Button>
            <Button type="button" variant="danger" onClick={revoke} loading={busy}>
              Intrekken
            </Button>
          </>
        }
      >
        <Field label="Notitie (optioneel)" htmlFor={noteId}>
          <Textarea id={noteId} rows={2} maxLength={GRANT_NOTE_MAX} value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
