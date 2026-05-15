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
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e9eff8] dark:bg-[#1f3356]">
            <Mail className="h-5 w-5 text-[#355384] dark:text-[#9db5dc]" />
          </div>
          <p className="text-sm font-medium text-foreground">Stuur naar</p>
          <a
            href={mailtoHref}
            className="mt-2 inline-flex break-all rounded-md bg-[#6f8ed4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5f81cc] dark:bg-[#6f8ed4] dark:hover:bg-[#5f81cc]"
          >
            {supportEmail}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
