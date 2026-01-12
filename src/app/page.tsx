import Link from 'next/link';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Question {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface QuizItem {
  _id: string;
  title: string;
  description?: string;
  category: string;
  questions?: Question[];
  slug?: string;
  isPremium: boolean;
}

async function getQuizzes() {
  await connectDB();
  // Fetch some free quizzes
  const freeQuizzes = await Quiz.find({ isPremium: false }).limit(6).lean();
  // Fetch some premium quizzes to showcase
  const premiumQuizzes = await Quiz.find({ isPremium: true }).limit(3).lean();
  
  // Serialize Mongoose documents to plain objects (handling _id etc)
  return {
    free: JSON.parse(JSON.stringify(freeQuizzes)),
    premium: JSON.parse(JSON.stringify(premiumQuizzes))
  };
}

export default async function Home() {
  const { free, premium } = await getQuizzes();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="container mx-auto px-4 py-12">
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Test je Bijbelkennis!
          </h1>
          <p className="mb-8 text-lg text-slate-600 dark:text-slate-400">
            Speel direct gratis bijbelquizzen. Geen account nodig.
          </p>
          <Button size="lg" asChild>
            <Link href="#free-quizzes">Speel nu gratis</Link>
          </Button>
        </section>

        <section id="free-quizzes" className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Gratis Quizzen</h2>
          {free.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">
              Nog geen quizzen beschikbaar. Kom later terug of voeg ze toe aan de database!
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {free.map((quiz: QuizItem) => (
                <Card key={quiz._id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{quiz.description || "Geen beschrijving"}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-500">{quiz.category}</p>
                    <p className="text-sm text-slate-500">{quiz.questions?.length || 0} vragen</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link href={`/quiz/${quiz.slug || quiz._id}`}>Spelen</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mb-12 rounded-xl bg-slate-900 p-8 text-white">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold">Premium Quizzen</h2>
            <p className="text-slate-300">
              Krijg toegang tot exclusieve, diepgaande quizzen en ondersteun de ontwikkeling.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {premium.map((quiz: QuizItem) => (
                <Card key={quiz._id} className="flex flex-col bg-slate-800 text-white border-slate-700">
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription className="text-slate-400">{quiz.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-400">{quiz.category}</p>
                    <span className="inline-block rounded bg-amber-500 px-2 py-1 text-xs font-bold text-black mt-2">PREMIUM</span>
                  </CardContent>
                  <CardFooter>
                     <Button variant="secondary" className="w-full" asChild>
                      <Link href={`/quiz/${quiz.slug || quiz._id}`}>Premium Spelen</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>

          <div className="mt-8 text-center">
            <Button size="lg" variant="default" className="bg-amber-500 hover:bg-amber-600 text-black font-bold" asChild>
              <Link href="/premium">Word nu Premium</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
