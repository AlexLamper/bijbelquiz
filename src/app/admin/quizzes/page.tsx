import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import QuizModerationList from './QuizModerationList';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Dashboard - BijbelQuiz',
  robots: { index: false }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Beheer quizzen en gebruikersinzendingen.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/quizzes/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nieuwe Quiz Maken
          </Link>
        </Button>
      </div>

      <QuizModerationList />
    </div>
  );
}
