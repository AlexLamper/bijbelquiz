'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Share2 } from 'lucide-react';

import { Button, Modal, toast } from '@/components/bq';

export interface InviteLink {
  duelId: string | null;
  url: string;
  message: string | null;
}

/** Copies the invite link; falls back to selecting it when the clipboard is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * The invite link of a new duel, to copy or share. The challenger plays
 * round 1 straight away; the friend who opens the link plays the same
 * questions after them, for free.
 */
export function InviteLinkModal({ invite, onClose }: { invite: InviteLink | null; onClose: () => void }) {
  const router = useRouter();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const copied = !!invite && copiedUrl === invite.url;
  // The dialog only renders after a click, never on the server, so this is safe.
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    if (!invite) return;
    if (await copyText(invite.url)) {
      setCopiedUrl(invite.url);
      toast.success('Link gekopieerd');
    } else {
      const field = document.getElementById('duel-invite-link') as HTMLInputElement | null;
      field?.select();
      toast.info('Kopieer de geselecteerde link.');
    }
  };

  const share = async () => {
    if (!invite) return;
    try {
      await navigator.share({
        title: 'Duel op BijbelQuiz',
        text: invite.message ? invite.message.replace(invite.url, '').trim() : 'Speel een duel met mij op BijbelQuiz',
        url: invite.url,
      });
    } catch {
      // Closing the share sheet is not an error.
    }
  };

  const close = () => {
    onClose();
    router.refresh();
  };

  return (
    <Modal
      open={invite !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title="Nodig iemand uit"
      description="Stuur deze link naar een vriend. Je vriend speelt dit duel gratis, ook zonder Premium."
      size="sm"
      footer={
        invite?.duelId ? (
          <Button href={`/duels/${invite.duelId}`} size="lg" onClick={onClose}>
            Speel ronde 1
          </Button>
        ) : undefined
      }
    >
      <label htmlFor="duel-invite-link" className="text-sm font-extrabold text-ink">
        Jouw link
      </label>
      <input
        id="duel-invite-link"
        readOnly
        value={invite?.url ?? ''}
        onFocus={(event) => event.currentTarget.select()}
        className="-mt-2 h-12 w-full rounded-[12px] border border-line bg-chip px-3.5 text-[15px] font-semibold text-ink"
      />
      <div className="flex flex-col gap-2.5 m:flex-row">
        <Button variant="secondary" size="lg" onClick={copy} className="grow">
          {copied ? <Check className="size-[18px]" aria-hidden="true" /> : <Copy className="size-[18px]" aria-hidden="true" />}
          {copied ? 'Gekopieerd' : 'Kopieer link'}
        </Button>
        {canShare && (
          <Button variant="secondary" size="lg" onClick={share} className="grow">
            <Share2 className="size-[18px]" aria-hidden="true" />
            Delen
          </Button>
        )}
      </div>
      <p className="m-0 text-sm font-semibold leading-5 text-ink-muted">
        Jij speelt eerst ronde 1. Zodra je vriend de link opent en meedoet, speelt die dezelfde vragen.
      </p>
    </Modal>
  );
}
