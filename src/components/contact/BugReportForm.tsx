'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AlertCircle, Bug, CheckCircle2, Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BugReportFormProps {
  supportEmail: string;
}

interface FormState {
  name: string;
  email: string;
  message: string;
}

type StatusState =
  | { type: 'idle'; message: '' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

const INITIAL_FORM_STATE: FormState = {
  name: '',
  email: '',
  message: '',
};

export default function BugReportForm({ supportEmail }: BugReportFormProps) {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusState, setStatusState] = useState<StatusState>({ type: 'idle', message: '' });

  const directMailTo = useMemo(() => {
    const subject = encodeURIComponent('Bug report BijbelQuiz');
    return `mailto:${supportEmail}?subject=${subject}`;
  }, [supportEmail]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formState.message.trim().length < 10) {
      setStatusState({ type: 'error', message: 'Beschrijf de bug met minimaal 10 tekens.' });
      return;
    }

    setIsSubmitting(true);
    setStatusState({ type: 'idle', message: '' });

    try {
      const currentPage = typeof window !== 'undefined' ? window.location.href : '';

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          message: formState.message,
          pageUrl: currentPage,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message || 'Kon je bug report niet verzenden. Probeer opnieuw.');
      }

      setFormState(INITIAL_FORM_STATE);
      setStatusState({
        type: 'success',
        message: payload?.message || 'Bedankt. Je bug report is succesvol doorgestuurd.',
      });
    } catch (error) {
      setStatusState({
        type: 'error',
        message: error instanceof Error ? error.message : 'Er ging iets mis bij het verzenden.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bug className="h-5 w-5 text-primary" />
          Bug melden
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <Input
              placeholder="Naam (optioneel)"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              maxLength={120}
            />
            <Input
              type="email"
              placeholder="E-mail (optioneel)"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              maxLength={190}
            />
          </div>

          <Textarea
            placeholder="Beschrijf de bug, wat je deed en wat er mis ging..."
            value={formState.message}
            onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
            className="min-h-32"
            maxLength={4000}
            required
          />

          {statusState.type !== 'idle' && (
            <div
              className={`rounded-md border p-3 text-sm ${
                statusState.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusState.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{statusState.message}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? 'Verzenden...' : 'Bug report verzenden'}
            </Button>

            <Button asChild variant="outline">
              <a href={directMailTo}>Of stuur direct e-mail</a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}