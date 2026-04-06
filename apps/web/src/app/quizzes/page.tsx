
import { connectDB, Quiz, Category } from '@bijbelquiz/database';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Breadcrumb from '@/components/Breadcrumb';
import QuizzesClient from '@/components/QuizzesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alle Bijbelquizzen - Kies je Categorie & Niveau | BijbelQuiz',
  description: 'Overzicht van alle beschikbare Bijbelquizzen. Filter op categorie, speel direct en test je kennis van het Oude en Nieuwe Testament.',
  keywords: ['bijbelquizzen', 'quiz overzicht', 'bijbelvragen', 'geloofsquiz', 'online bijbelstudie'],
  alternates: {
    canonical: '/quizzes',
  },
  openGraph: {
    title: 'Alle Bijbelquizzen Spelen - Gratis & Premium',
    description: 'Zoek en speel de beste Bijbelquizzen online. Van beginners tot experts.',
    url: 'https://www.bijbelquiz.com/quizzes',
  }
};

export const dynamic = 'force-dynamic';

async function getData() {
  await connectDB();
  
  const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };

  const quizzes = await Quiz.find(statusFilter)
    .populate('categoryId')
    .sort({ isPremium: 1, title: 1 })
    .lean();

  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

  return {
    quizzes: JSON.parse(JSON.stringify(quizzes)),
    categories: JSON.parse(JSON.stringify(categories))
  };
}

export default async function QuizzesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ category?: string }> 
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const isPremiumUser = !!session?.user?.isPremium;
  const currentCategory = params.category || 'all';
  
  const { quizzes, categories } = await getData();

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12 sm:px-6 lg:px-10 xl:px-12">
      <Breadcrumb
        items={[
          { label: 'Quizzen' },
        ]}
        className="mb-6"
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2 dark:text-foreground">Quiz Overzicht</h1>
          <p className="text-slate-600 dark:text-muted-foreground">
            Kies uit {quizzes.length} uitdagende quizzen om je kennis te testen.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
             <Link href="/quizzes/create" className="flex items-center gap-2">
                 <Plus className="h-4 w-4" /> Maak eigen quiz
             </Link>
        </Button>
      </div>

      <QuizzesClient 
        quizzes={quizzes} 
        categories={categories} 
        currentCategory={currentCategory}
        isPremiumUser={isPremiumUser}
      />
    </div>
  );
}

