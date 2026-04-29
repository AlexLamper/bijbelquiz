import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB, Quiz, User } from "@/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Settings, Plus, Edit, Crown, Activity } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  await connectDB();

  // Fetch statistics
  const [totalUsers, totalQuizzes, premiumUsers, pendingQuizzes, recentUsers, recentQuizzes] = await Promise.all([
    User.countDocuments(),
    Quiz.countDocuments(),
    User.countDocuments({ isPremium: true }),
    Quiz.countDocuments({ status: 'pending' }),
    User.find().sort({ createdAt: -1 }).limit(10).lean(),
    Quiz.find().populate('categoryId').sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return (
    <div className="-mt-24 min-h-screen pb-12 pt-24">
      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <Card className="relative overflow-hidden border-0 bg-transparent py-0 shadow-none">
          <CardContent className="p-0">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#607597] dark:text-[#9db5dc]">Beheercentrum</p>
                <h1 className="mt-1 text-3xl font-semibold text-[#1f2f4b] dark:text-zinc-100 md:text-4xl">Admin dashboard</h1>
                <p className="mt-2 text-sm text-muted-foreground">Beheer je BijbelQuiz platform.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="h-10 rounded-md border-[#d7e1ee] bg-white px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                  <Link href="/admin/quizzes">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Alle quizzen
                  </Link>
                </Button>
                <Button asChild className="h-10 rounded-md bg-[#6f8ed4] dark:bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc] dark:hover:bg-[#5f81cc]">
                  <Link href="/admin/quizzes/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuwe quiz
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-6 sm:px-5 lg:px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Totaal gebruikers</p>
                <Users className="h-4 w-4 text-[#5f7fc7]" />
              </div>
              <p className="mt-2 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{totalUsers}</p>
              <p className="mt-1 text-xs text-muted-foreground">Geregistreerde accounts</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Premium gebruikers</p>
                <Crown className="h-4 w-4 text-[#d29f45]" />
              </div>
              <p className="mt-2 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{premiumUsers}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}% van totaal
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Totaal quizzen</p>
                <BookOpen className="h-4 w-4 text-[#4f6faa]" />
              </div>
              <p className="mt-2 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{totalQuizzes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Beschikbare quizzen</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wacht op goedkeuring</p>
                <Activity className="h-4 w-4 text-[#cc8741]" />
              </div>
              <p className="mt-2 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{pendingQuizzes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Pending quizzen</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-6 sm:px-5 lg:px-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 leading-tight text-[#1f2f4b] dark:text-zinc-100">
                <Users className="h-5 w-5 text-[#5f7fc7]" />
                Recente gebruikers
              </CardTitle>
              <CardDescription>Laatste 10 geregistreerde gebruikers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user: any) => (
                    <div key={user._id.toString()} className="flex items-center justify-between border-b border-[#ecf1f8] pb-3 last:border-0 dark:border-zinc-700/70">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1f2f4b] dark:text-zinc-100">{user.name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isPremium && (
                          <Crown className="h-4 w-4 text-[#d29f45]" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">Geen gebruikers gevonden</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 leading-tight text-[#1f2f4b] dark:text-zinc-100">
                <BookOpen className="h-5 w-5 text-[#4f6faa]" />
                Recente quizzen
              </CardTitle>
              <CardDescription>Laatste 10 aangemaakte quizzen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentQuizzes.length > 0 ? (
                  recentQuizzes.map((quiz: any) => (
                    <div key={quiz._id.toString()} className="flex items-center justify-between border-b border-[#ecf1f8] pb-3 last:border-0 dark:border-zinc-700/70">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1f2f4b] dark:text-zinc-100">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.categoryId?.title || 'Geen categorie'} • {quiz.questions?.length || 0} vragen
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          quiz.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          quiz.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          quiz.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {quiz.status === 'approved' ? 'Actief' :
                           quiz.status === 'pending' ? 'Pending' :
                           quiz.status === 'rejected' ? 'Afgewezen' : 'Concept'}
                        </span>
                        <Link href={`/admin/quizzes/${quiz._id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#4e5f79] hover:bg-[#f5f8fd] hover:text-[#24395f] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">Geen quizzen gevonden</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-6 sm:px-5 lg:px-4">
        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="flex items-center gap-2 leading-tight text-[#1f2f4b] dark:text-zinc-100">
              <Settings className="h-5 w-5 text-[#5f7fc7]" />
              Snelle acties
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Button asChild variant="outline" className="h-auto min-h-24 flex-col items-start justify-center border-[#d7e1ee] bg-white py-4 text-left text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/admin/quizzes?status=pending">
                  <Activity className="mb-2 h-5 w-5 text-[#cc8741]" />
                  <div className="text-left">
                    <div className="font-semibold">Review quizzen</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {pendingQuizzes} wachten op goedkeuring
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto min-h-24 flex-col items-start justify-center border-[#d7e1ee] bg-white py-4 text-left text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/admin/quizzes/create">
                  <Plus className="mb-2 h-5 w-5 text-[#5f7fc7]" />
                  <div className="text-left">
                    <div className="font-semibold">Nieuwe quiz</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      Maak een nieuwe quiz aan
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto min-h-24 flex-col items-start justify-center border-[#d7e1ee] bg-white py-4 text-left text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/admin/quizzes">
                  <BarChart3 className="mb-2 h-5 w-5 text-[#3d8f5e]" />
                  <div className="text-left">
                    <div className="font-semibold">Alle quizzen</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      Bekijk en beheer {totalQuizzes} quizzen
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
