import { Bug, Mail } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BugReportFormProps {
  supportEmail: string;
}

export default function BugReportForm({ supportEmail }: BugReportFormProps) {
  const subject = encodeURIComponent('[BijbelQuiz] Bug report');
  const body = encodeURIComponent(
    [
      'Beschrijf de bug:',
      '',
      'Stappen om te reproduceren:',
      '',
      'Wat verwachtte je:',
      '',
      'Pagina-URL (uit de adresbalk):',
      '',
    ].join('\n')
  );
  const mailtoHref = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bug className="h-5 w-5 text-primary" />
          Bug melden
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Stuur je melding per e-mail. Vermeld zo mogelijk wat je deed, wat er misging en de pagina waar het
          gebeurde (je mailprogramma opent met een voorbeeldtekst die je kunt aanvullen).
        </p>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper-sunken">
            <Mail className="h-5 w-5 text-ink" />
          </div>
          <p className="text-sm font-medium text-foreground">Stuur naar</p>
          <a
            href={mailtoHref}
            className="mt-2 inline-flex break-all rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-inverted hover:bg-ink-soft"
          >
            {supportEmail}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
