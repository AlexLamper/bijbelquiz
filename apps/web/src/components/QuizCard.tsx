import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, CheckCircle2, Lock, Star } from 'lucide-react';

export interface QuizItem {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  categoryId?: {
    _id?: string;
    title?: string;
    slug?: string;
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
    <Link href={`/quiz/${quiz.slug || quiz._id}`} className="block h-full">
      <Card className="group relative flex h-full flex-col overflow-hidden border-0 bg-white dark:bg-card dark:border dark:border-border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 p-0 pb-6 gap-0 cursor-pointer">
        <div className="relative h-44 w-full overflow-hidden bg-[#dbe1ee] shrink-0">
          {quiz.imageUrl ? (
            <Image
              src={quiz.imageUrl}
              alt={quiz.title}
              fill
              className="object-cover brightness-90 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              quality={80}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-[#bac6da]" />
            </div>
          )}
          {quiz.isPremium && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-md bg-[#1a2942] px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider shadow-sm">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> PREMIUM
            </span>
          )}
          {isLocked && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <Lock className="w-5 h-5 text-[#1c223a]" />
              </div>
            </div>
          )}
        </div>
        <CardHeader className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-muted dark:text-gray-200 dark:hover:bg-muted/80">
               {categoryName}
            </Badge>
          </div>
          <CardTitle className="line-clamp-1 text-lg group-hover:text-primary dark:group-hover:text-gray-200 transition-colors font-serif">
            {quiz.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm text-muted-foreground min-h-10 mb-4">
            {quiz.description || "Test je kennis en leer meer over dit onderwerp."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pt-2">
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
        <CardFooter className="pt-4 mt-auto">
          <Button className="w-full gap-2 transition-transform active:scale-95 shadow-sm" variant={isLocked ? "outline" : "default"}>
            {isLocked ? (
              <>
                <Lock className="h-4 w-4" /> Ontgrendel
              </>
            ) : (
              <>
                Start Quiz <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
