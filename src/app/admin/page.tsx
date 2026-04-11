import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB, Quiz, User } from "@/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Settings, Plus, Edit, Trash2, Crown, Activity } from "lucide-react";

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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold font-serif text-[#1a2942] dark:text-white">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Beheer je BijbelQuiz platform</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/quizzes">
              <BookOpen className="mr-2 h-4 w-4" />
              Alle Quizzen
            </Link>
          </Button>
          <Button asChild className="bg-[#5b7dd9] hover:bg-[#4a6bc7]">
            <Link href="/admin/quizzes/create">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-[#5b7dd9]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Gebruikers</CardTitle>
              <Users className="h-5 w-5 text-[#5b7dd9]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Geregistreerde accounts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Premium Gebruikers</CardTitle>
              <Crown className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{premiumUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}% van totaal
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Totaal Quizzen</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-1">Beschikbare quizzen</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Wachtend op Goedkeuring</CardTitle>
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending quizzen</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recente Gebruikers
            </CardTitle>
            <CardDescription>Laatste 10 geregistreerde gebruikers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user: any) => (
                  <div key={user._id.toString()} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isPremium && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Geen gebruikers gevonden</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recente Quizzen
            </CardTitle>
            <CardDescription>Laatste 10 aangemaakte quizzen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuizzes.length > 0 ? (
                recentQuizzes.map((quiz: any) => (
                  <div key={quiz._id.toString()} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {quiz.categoryId?.title || 'Geen categorie'} • {quiz.questions?.length || 0} vragen
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Geen quizzen gevonden</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Snelle Acties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
              <Link href="/admin/quizzes?status=pending">
                <Activity className="h-5 w-5 mb-2 text-orange-500" />
                <div className="text-left">
                  <div className="font-semibold">Review Quizzen</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {pendingQuizzes} wachten op goedkeuring
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
              <Link href="/admin/quizzes/create">
                <Plus className="h-5 w-5 mb-2 text-[#5b7dd9]" />
                <div className="text-left">
                  <div className="font-semibold">Nieuwe Quiz</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Maak een nieuwe quiz aan
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
              <Link href="/admin/quizzes">
                <BarChart3 className="h-5 w-5 mb-2 text-green-500" />
                <div className="text-left">
                  <div className="font-semibold">Alle Quizzen</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Bekijk en beheer {totalQuizzes} quizzen
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
