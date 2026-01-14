
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import Category, { ICategory } from '@/models/Category';
import Link from 'next/link';
import { IQuiz } from '@/models/Quiz';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, CheckCircle2, Lock, Filter, Star, Search } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Alle Quizzen | BijbelQuiz',
  description: 'Ontdek onze uitgebreide collectie Bijbelquizzen voor alle niveaus.',
};

export const dynamic = 'force-dynamic';

async function getData(categorySlug?: string) {
  await connectDB();
  
  // Find category ID if slug provided
  let categoryFilter = {};
  if (categorySlug && categorySlug !== 'all') {
    const category = await Category.findOne({ slug: categorySlug });
    if (category) {
      categoryFilter = { categoryId: category._id };
    }
  }

  const quizzes = await Quiz.find(categoryFilter)
    .populate('categoryId')
    .sort({ isPremium: 1, title: 1 }) // Premium first slightly? Or mixing? Let's sort simply.
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
  const params = await searchParams; // Await the promise for Next.js 15+
  const session = await getServerSession(authOptions);
  const isPremiumUser = !!session?.user?.isPremium;
  const currentCategory = params.category || 'all';
  
  const { quizzes, categories } = await getData(currentCategory);

  return (
    <div className="container px-4 py-8 md:py-12 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2">Quiz Overzicht</h1>
          <p className="text-slate-600">
            Kies uit {quizzes.length} uitdagende quizzen om je kennis te testen.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Filter (Mobile Top) */}
        <div className="lg:col-span-1">
            {/* Desktop Sticky Sidebar */}
            <div className="hidden lg:block sticky top-24 space-y-6">
                <div>
                    <h3 className="font-serif font-bold text-slate-900 mb-4 px-2">Categorieën</h3>
                    <div className="space-y-1">
                         <Button 
                            variant={currentCategory === 'all' ? "secondary" : "ghost"} 
                            className={`w-full justify-start ${currentCategory === 'all' ? 'bg-[#152c31] text-white hover:bg-[#152c31]/90' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                            asChild
                        >
                            <Link href="/quizzes">Alle Categorieën</Link>
                        </Button>
                        {categories.map((cat: ICategory) => (
                            <Button
                                key={cat._id.toString()}
                                variant={currentCategory === cat.slug ? "secondary" : "ghost"}
                                className={`w-full justify-start ${currentCategory === cat.slug ? 'bg-[#152c31] text-white hover:bg-[#152c31]/90' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                asChild
                            >
                                <Link href={`/quizzes?category=${cat.slug}`}>
                                    {cat.title}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

                {!isPremiumUser && (
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                       <h3 className="font-bold text-[#152c31] mb-2 flex items-center gap-2">
                           <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Premium
                       </h3>
                       <p className="text-sm text-slate-600 mb-4">
                           Ontgrendel alle quizzen en diepgaande studie-uitleg.
                       </p>
                       <Button className="w-full bg-[#152c31] hover:bg-black text-white" asChild>
                           <Link href="/premium">Upgrade Nu</Link>
                       </Button>
                    </div>
                )}
            </div>

            {/* Mobile View: Accordion for Categories */}
            <div className="lg:hidden space-y-4 mb-6">
                <Accordion type="single" collapsible className="bg-white rounded-lg border shadow-sm px-4">
                    <AccordionItem value="categories" className="border-b-0">
                        <AccordionTrigger className="hover:no-underline py-3">
                             <span className="flex items-center gap-2 text-slate-800 font-medium">
                                <Filter className="h-4 w-4" /> Filter ({currentCategory === 'all' ? 'Alle' : categories.find((c:ICategory) => c.slug === currentCategory)?.title})
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                             <div className="space-y-1 pt-2 pb-4">
                                 <Button 
                                    variant={currentCategory === 'all' ? "secondary" : "ghost"} 
                                    className={`w-full justify-start ${currentCategory === 'all' ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                                    asChild
                                >
                                    <Link href="/quizzes">Alle Categorieën</Link>
                                </Button>
                                {categories.map((cat: ICategory) => (
                                    <Button
                                        key={`mobile-${cat._id.toString()}`}
                                        variant={currentCategory === cat.slug ? "secondary" : "ghost"}
                                        className={`w-full justify-start ${currentCategory === cat.slug ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                                        asChild
                                    >
                                        <Link href={`/quizzes?category=${cat.slug}`}>
                                            {cat.title}
                                        </Link>
                                    </Button>
                                ))}
                             </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {!isPremiumUser && (
                    <Card className="bg-amber-50 border-amber-200">
                       <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
                           <div>
                               <h3 className="font-bold text-amber-800 text-sm flex items-center gap-1">
                                   <Star className="h-3 w-3 fill-amber-600 text-amber-600" /> Premium
                               </h3>
                               <p className="text-xs text-amber-700/80">Upgrade voor alle quizzen</p>
                           </div>
                           <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs" asChild>
                               <Link href="/premium">Upgrade</Link>
                           </Button>
                       </CardContent>
                    </Card>
                )}
            </div>
        </div>

        {/* Quizzes Grid */}
        <div className="lg:col-span-3">
             {quizzes.length === 0 ? (
                 <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                     <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                     <h3 className="text-lg font-medium text-slate-900">Geen quizzen gevonden</h3>
                     <p className="text-slate-500">Probeer een andere categorie.</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {quizzes.map((quiz: IQuiz) => {
                        const isLocked = quiz.isPremium && !isPremiumUser;
                        return (
                            <Card key={quiz._id.toString()} className="flex flex-col hover:shadow-lg transition-shadow border-slate-200 group relative overflow-hidden">
                                {quiz.isPremium && (
                                     <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
                                         <Star className="h-3 w-3 fill-current" /> PREMIUM
                                     </div>
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="text-xs bg-slate-50 font-normal mb-2">
                                            {(quiz.categoryId as ICategory)?.title || 'Algemeen'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors leading-tight">
                                        {quiz.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                                        {quiz.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span>{quiz.questions?.length || 5} vragen</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button 
                                        className={`w-full ${isLocked ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : ''}`} 
                                        variant={isLocked ? "ghost" : "default"} 
                                        asChild
                                    >
                                        <Link href={`/quiz/${quiz.slug}`}>
                                            {isLocked ? (
                                                <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Vergrendeld</span>
                                            ) : (
                                                <span className="flex items-center gap-2">Start Quiz <ArrowRight className="h-4 w-4" /></span>
                                            )}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
             )}
        </div>
      </div>
    </div>
  );
}
