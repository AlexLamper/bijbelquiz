import type { Metadata } from 'next';

import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';

export const metadata: Metadata = {
  title: 'Pagina niet gevonden',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <ErrorScreen
      kicker="FOUT 404"
      title="Deze pagina bestaat niet"
      text="De link klopt niet meer, of de pagina is verplaatst. Kies waar je heen wilt, of ga terug naar home."
    />
  );
}
