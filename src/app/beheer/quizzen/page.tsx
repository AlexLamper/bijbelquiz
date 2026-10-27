import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import { connectDB, Quiz } from '@/database';
import QuizModerationList, { type StatusFilter } from './QuizModerationList';

export const metadata: Metadata = {
  title: 'Quizzen - Beheer',
  robots: { index: false, follow: false },
};

const STATUSES: StatusFilter[] = ['pending', 'approved', 'rejected', 'draft'];

export default async function AdminQuizzesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const { status } = await searchParams;
  let initialStatus: StatusFilter;
  if (status && (STATUSES as string[]).includes(status)) {
    initialStatus = status as StatusFilter;
  } else {
    // Open on the review queue when something is waiting, otherwise on the
    // live catalogue (quizzes are made by admins now, so the queue is
    // usually empty).
    await connectDB();
    initialStatus = (await Quiz.exists({ status: 'pending' })) ? 'pending' : 'approved';
  }

  return <QuizModerationList initialStatus={initialStatus} />;
}
