'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

/**
 * Toasts in the house style: a white card with the 1px line, Nunito, and a
 * coloured icon instead of a coloured background. Mount `<Toaster />` once
 * (the root layout does) and call `toast.success('Opgeslagen')` anywhere.
 */
export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      gap={10}
      offset={16}
      icons={{
        success: <CheckCircle2 className="size-5 text-green" strokeWidth={2.2} />,
        error: <XCircle className="size-5 text-coral-strong" strokeWidth={2.2} />,
        warning: <AlertCircle className="size-5 text-gold-text" strokeWidth={2.2} />,
        info: <Info className="size-5 text-lapis" strokeWidth={2.2} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-3 rounded-[14px] border border-line bg-card px-4 py-3.5 font-sans text-ink shadow-float',
          title: 'text-[15px] font-extrabold leading-5',
          description: 'text-sm font-semibold text-ink-muted leading-5',
          icon: 'mt-0.5 shrink-0',
          actionButton: 'ml-auto h-9 shrink-0 rounded-[10px] bg-lapis px-3 text-sm font-extrabold text-white',
          cancelButton: 'ml-auto h-9 shrink-0 rounded-[10px] bg-chip px-3 text-sm font-extrabold text-ink-soft',
          closeButton: 'text-ink-muted',
        },
      }}
    />
  );
}
