'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button, Field, Input, Select, Textarea } from '@/components/bq';
import { t } from '@/i18n';
import { rich } from '@/i18n/rich';
import { CONTACT_SUBJECTS } from '@/lib/support-mail-subjects';
import { CheckIcon, SendIcon } from './icons';
import { Honeypot, postSupportForm, type SubmitState } from './Honeypot';

interface ContactFormProps {
  defaultName?: string;
  defaultEmail?: string;
}

type Errors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: { name: string; email: string; subject: string; message: string }): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = t('contactForm.errName');
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = t('contactForm.errEmail');
  if (!values.subject) errors.subject = t('contactForm.errSubject');
  if (values.message.trim().length < 10) errors.message = t('contactForm.errMessage');
  return errors;
}

/** "Stuur een bericht": the contact form, posting to `/api/contact`. */
export function ContactForm({ defaultName = '', defaultEmail = '' }: ContactFormProps) {
  const [name, setName] = React.useState(defaultName);
  const [email, setEmail] = React.useState(defaultEmail);
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [errors, setErrors] = React.useState<Errors>({});
  const [state, setState] = React.useState<SubmitState>({ status: 'idle' });
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = { name, email, subject, message };
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    setState({ status: 'sending' });
    const { ok, data } = await postSupportForm('/api/contact', { ...values, website });
    if (ok) {
      setState({ status: 'sent', message: data.message || t('contactForm.sentDefault') });
      requestAnimationFrame(() => headingRef.current?.focus());
      return;
    }
    if (data.errors) setErrors(data.errors as Errors);
    setState({ status: 'error', message: data.message || t('contactForm.errNetworkDefault') });
  };

  const reset = () => {
    setSubject('');
    setMessage('');
    setErrors({});
    setState({ status: 'idle' });
  };

  if (state.status === 'sent') {
    return (
      <div className="flex flex-col items-start gap-4 rounded-[16px] border border-line bg-card p-5 m:p-8" role="status">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-green text-white">
          <CheckIcon size={24} />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="m-0 text-[22px] leading-7 outline-none">
          {t('contactForm.sentTitle')}
        </h2>
        <p className="m-0 max-w-[52ch] text-base font-semibold leading-6 text-ink-soft">
          {state.message} {t('contactForm.sentNote', { email: email.trim() })}
        </p>
        <Button variant="secondary" size="lg" onClick={reset}>
          {t('contactForm.another')}
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby="contact-form-title"
      className="relative flex flex-col gap-5 rounded-[16px] border border-line bg-card p-5 m:p-8"
    >
      <h2 id="contact-form-title" className="m-0 text-[22px] leading-7">
        {t('contactForm.title')}
      </h2>

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 m:grid-cols-2">
        <Field label={t('contactForm.name')} htmlFor="contact-name" error={errors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            placeholder={t('contactForm.namePlaceholder')}
            maxLength={120}
            value={name}
            invalid={Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t('contactForm.email')} htmlFor="contact-email" error={errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t('contactForm.emailPlaceholder')}
            maxLength={190}
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>

      <Field label={t('contactForm.subject')} htmlFor="contact-subject" error={errors.subject}>
        <Select
          id="contact-subject"
          name="subject"
          value={subject}
          invalid={Boolean(errors.subject)}
          onChange={(event) => setSubject(event.target.value)}
          className={subject ? undefined : '[&_select]:text-ink-muted'}
        >
          <option value="" disabled>
            {t('contactForm.subjectPlaceholder')}
          </option>
          {CONTACT_SUBJECTS.map((option) => (
            <option key={option} value={option} className="text-ink">
              {option}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={t('contactForm.message')}
        htmlFor="contact-message"
        error={errors.message}
        hint={t('contactForm.messageHint')}
      >
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          placeholder={t('contactForm.messagePlaceholder')}
          maxLength={4000}
          value={message}
          invalid={Boolean(errors.message)}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-[168px] font-semibold"
        />
      </Field>

      <Honeypot value={website} onChange={setWebsite} />

      {state.status === 'error' && (
        <p role="alert" className="m-0 rounded-[12px] bg-coral-tint px-4 py-3 text-[15px] font-bold text-coral-text">
          {state.message}
        </p>
      )}

      <div className="flex flex-col items-stretch gap-x-5 gap-y-3.5 pt-1 m:flex-row m:items-center">
        <Button type="submit" size="xl" loading={state.status === 'sending'} className="shrink-0">
          {state.status !== 'sending' && <SendIcon size={18} />}
          {t('contactForm.submit')}
        </Button>
        <p className="m-0 text-sm font-semibold leading-5 text-ink-muted">
          {rich(t('contactForm.privacy'), {
            link: (
              <Link href="/privacybeleid" className="font-extrabold no-underline">
                {t('contactForm.privacyLink')}
              </Link>
            ),
          })}
        </p>
      </div>
    </form>
  );
}
