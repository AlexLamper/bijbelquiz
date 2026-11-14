'use client';

import * as React from 'react';

import { Button, Field, Input, Textarea } from '@/components/bq';
import { getSiteConfig } from '@/config/site';
import { t } from '@/i18n';
import { CheckIcon } from './icons';
import { Honeypot, postSupportForm, type SubmitState } from './Honeypot';

/** "bijbelquiz.com/quiz/genesis-37": the address without the scheme, as people read it. */
function readableUrl(href: string): string {
  try {
    const url = new URL(href);
    return `${url.host.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}${url.search}`;
  } catch {
    return href;
  }
}

/**
 * Where the visitor ran into the problem. On the 404 and error pages that is
 * the current address; on `/foutmelding` itself it is the page they came from
 * (`?pagina=` or a same-site referrer), and otherwise empty.
 */
function initialPage(source: 'current' | 'referrer'): string {
  if (typeof window === 'undefined') return '';
  if (source === 'current') return readableUrl(window.location.href.replace(/#.*$/, ''));
  const fromQuery = new URLSearchParams(window.location.search).get('pagina');
  if (fromQuery) return fromQuery.slice(0, 500);
  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    if (referrer && referrer.host === window.location.host && !referrer.pathname.startsWith('/foutmelding')) {
      return readableUrl(referrer.href);
    }
  } catch {
    // An unreadable referrer just leaves the field empty.
  }
  return '';
}

type Errors = Partial<Record<'message' | 'email' | 'pageUrl', string>>;

export function BugReportForm({ pageSource = 'current' }: { pageSource?: 'current' | 'referrer' }) {
  const [message, setMessage] = React.useState('');
  const [pageUrl, setPageUrl] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [errors, setErrors] = React.useState<Errors>({});
  const [state, setState] = React.useState<SubmitState>({ status: 'idle' });
  const doneRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    setPageUrl(initialPage(pageSource));
  }, [pageSource]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found: Errors = {};
    if (message.trim().length < 10) found.message = t('bugForm.errMessage');
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      found.email = t('bugForm.errEmail');
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(found.message ? 'bug-msg' : 'bug-email')?.focus();
      return;
    }

    setState({ status: 'sending' });
    const { ok, data } = await postSupportForm('/api/bug-reports', { message, pageUrl, email, website });
    if (ok) {
      setState({ status: 'sent', message: data.message || t('bugForm.sentDefault') });
      requestAnimationFrame(() => doneRef.current?.focus());
      return;
    }
    if (data.errors) setErrors(data.errors as Errors);
    setState({ status: 'error', message: data.message || t('bugForm.errDefault') });
  };

  if (state.status === 'sent') {
    return (
      <div role="status" className="flex min-w-0 flex-col items-start gap-3">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-green text-white">
          <CheckIcon size={22} />
        </span>
        <p ref={doneRef} tabIndex={-1} className="m-0 text-lg font-extrabold text-ink outline-none">
          {state.message}
        </p>
        <p className="m-0 text-base font-semibold leading-6 text-ink-soft">
          {email.trim() ? t('bugForm.sentWithEmail') : t('bugForm.sentNoEmail')}
        </p>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            setMessage('');
            setState({ status: 'idle' });
          }}
        >
          {t('bugForm.another')}
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby="report-title" className="relative flex min-w-0 flex-col gap-4">
      <Field label={t('bugForm.what')} htmlFor="bug-msg" error={errors.message}>
        <Textarea
          id="bug-msg"
          name="message"
          rows={4}
          maxLength={4000}
          placeholder={t('bugForm.whatPlaceholder')}
          value={message}
          invalid={Boolean(errors.message)}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-[120px]"
        />
      </Field>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Field label={t('bugForm.page')} htmlFor="bug-url" error={errors.pageUrl}>
          <Input
            id="bug-url"
            name="pageUrl"
            type="text"
            inputMode="url"
            maxLength={500}
            placeholder={`${new URL(getSiteConfig().baseUrl).host.replace(/^www\./, '')}/...`}
            value={pageUrl}
            onChange={(event) => setPageUrl(event.target.value)}
          />
        </Field>
        <Field
          label={
            <>
              {t('bugForm.email')} <span className="font-semibold text-ink-muted">{t('bugForm.optional')}</span>
            </>
          }
          htmlFor="bug-email"
          error={errors.email}
        >
          <Input
            id="bug-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={190}
            placeholder={t('bugForm.emailPlaceholder')}
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>

      <Honeypot value={website} onChange={setWebsite} />

      {state.status === 'error' && (
        <p role="alert" className="m-0 rounded-[12px] bg-coral-tint px-4 py-3 text-[15px] font-bold text-coral-text">
          {state.message}
        </p>
      )}

      <Button type="submit" variant="secondary" size="xl" loading={state.status === 'sending'} className="self-start px-6">
        {t('bugForm.submit')}
      </Button>
    </form>
  );
}
