/**
 * The spam trap of the support forms: a field people never see or reach by
 * keyboard. Bots that fill every input fill this one too, and the server then
 * drops the message (see `src/lib/support-mail.ts`).
 */
export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website-veld">Laat dit veld leeg</label>
      <input
        id="website-veld"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; message: string }
  | { status: 'error'; message: string };

export interface SubmitResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
}

/** POSTs JSON to a support endpoint and normalises the answer. */
export async function postSupportForm(url: string, payload: unknown): Promise<{ ok: boolean; data: SubmitResponse }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = ((await response.json().catch(() => ({}))) ?? {}) as SubmitResponse;
    return { ok: response.ok && data.success !== false, data };
  } catch {
    return { ok: false, data: { message: 'Geen verbinding. Controleer je internet en probeer het opnieuw.' } };
  }
}
