import { Home } from 'lucide-react';

import { Button } from '@/components/bq';

/**
 * "Terug naar home" at the bottom of an end screen (quiz result, Samen spelen
 * uitslag, a finished duel): the dashboard when signed in, the home page for
 * a guest. A link with `href`, or a button with `onClick` when something has
 * to happen first (leaving a room).
 */
export function HomeButton({
  href,
  onClick,
  loading,
}: { href: string; onClick?: undefined; loading?: undefined } | { href?: undefined; onClick: () => void; loading?: boolean }) {
  const content = (
    <>
      <Home className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
      Terug naar home
    </>
  );
  return href !== undefined ? (
    <Button href={href} variant="secondary" size="xl" block data-analytics-id="result_home">
      {content}
    </Button>
  ) : (
    <Button variant="secondary" size="xl" block onClick={onClick} loading={loading} data-analytics-id="result_home">
      {content}
    </Button>
  );
}
