import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, CheckCircle2, Lock, Star } from 'lucide-react';

export interface QuizItem {
  _id: string;
  title: string;
  description?: string;
  categoryId?: {
    _id?: string;
    title?: string;
  } | string;
  questions?: {
    _id?: string;
    text?: string;
  }[];
  slug?: string;
  isPremium: boolean;
}

interface QuizCardProps {
  quiz: QuizItem;
  isPremiumUser: boolean;
}

export default function QuizCard({ quiz, isPremiumUser }: QuizCardProps) {
  const isLocked = quiz.isPremium && !isPremiumUser;
  // Handle populated categoryId or direct string/object fallback
  const categoryName = (typeof quiz.categoryId === 'object' && quiz.categoryId?.title) 
    ? quiz.categoryId.title 
    : 'Algemeen';

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-0 bg-white dark:bg-card dark:border dark:border-border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-muted dark:text-gray-200 dark:hover:bg-muted/80">
             {categoryName}
          </Badge>
          {quiz.isPremium && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 theme-hover:bg-amber-800 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
              <Star className="h-3 w-3 fill-white/90 text-white/90" /> PRO
            </span>
          )}
        </div>
        <CardTitle className="line-clamp-1 text-lg group-hover:text-primary dark:group-hover:text-gray-200 transition-colors font-serif">
          {quiz.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground min-h-10">
          {quiz.description || "Test je kennis en leer meer over dit onderwerp."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{quiz.questions?.length || 0} vragen</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Leerzaam</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button className="w-full gap-2 transition-transform active:scale-95 shadow-sm" variant={isLocked ? "outline" : "default"} asChild>
          <Link href={`/quiz/${quiz.slug || quiz._id}`}>
            {isLocked ? (
              <>
                <Lock className="h-4 w-4" /> Ontgrendel
              </>
            ) : (
              <>
                Start Quiz <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
