import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import { AdminShell } from '@/components/bq/AdminShell';

export const metadata: Metadata = {
  title: 'Beheer',
  robots: { index: false, follow: false },
};

/**
 * Every /beheer page sits in the AdminShell (sidebar + main column) and is
 * admin-only. The site header and footer are not rendered here; see
 * `SiteShell`, which treats /beheer as chromeless.
 */
export default async function BeheerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }
  return <AdminShell>{children}</AdminShell>;
}
