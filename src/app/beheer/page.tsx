import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB, Quiz, User } from "@/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, LineChart, Settings, Plus, Edit, Crown, Activity } from "lucide-react";
import AdminGroupLicenseForm from "./AdminGroupLicenseForm";
import { GROUP_LICENSE_SEATS } from "@/lib/group-license";
import {
  getInternalAccountCount,
  isInternalAccount,
  premiumUserFilter,
} from "@/lib/analytics/internal-accounts";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  await connectDB();

  // Developer and app-reviewer accounts hold Premium so the premium surfaces
  // can be tested, which makes a raw `isPremium` count read as customers we do
  // not have. See `lib/analytics/internal-accounts.ts`.
  const [premiumFilter, internalPremiumExcluded] = await Promise.all([
    premiumUserFilter(),
    getInternalAccountCount(),
  ]);

  // Fetch statistics
  const [totalUsers, totalQuizzes, premiumUsers, pendingQuizzes, recentUsers, recentQuizzes] = await Promise.all([
    User.countDocuments(),
    Quiz.countDocuments(),
    User.countDocuments(premiumFilter),
    Quiz.countDocuments({ status: 'pending' }),
    User.find().sort({ createdAt: -1 }).limit(10).lean(),
    Quiz.find().populate('categoryId').sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return (
    <div className="min-h-screen bg-paper pb-16 pt-8 lg:pt-10">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden">
          <div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-end">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Beheercentrum</p>
                <h1 className="mt-3 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">Admin dashboard</h1>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">Beheer je BijbelQuiz platform.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken">
                  <Link href="/beheer/statistieken">
                    <LineChart className="mr-2 h-4 w-4" />
                    Statistieken
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken">
                  <Link href="/beheer/funnel">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Funnel
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken">
                  <Link href="/beheer/quizzen">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Alle quizzen
                  </Link>
                </Button>
                <Button asChild className="h-10 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft">
                  <Link href="/beheer/quizzen/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuwe quiz
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-rule py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Totaal gebruikers</p>
                <Users className="h-4 w-4 text-ink-soft" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-ink">{totalUsers}</p>
              <p className="mt-1 text-xs text-muted-foreground">Geregistreerde accounts</p>
            </CardContent>
          </Card>

          <Card className="border-rule py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Premium gebruikers</p>
                <Crown className="h-4 w-4 text-lapis" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-ink">{premiumUsers}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}% van totaal
                {internalPremiumExcluded > 0 &&
                  ` · ${internalPremiumExcluded} testaccounts niet meegeteld`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-rule py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Totaal quizzen</p>
                <BookOpen className="h-4 w-4 text-ink-soft" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-ink">{totalQuizzes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Beschikbare quizzen</p>
            </CardContent>
          </Card>

          <Card className="border-rule py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Wacht op goedkeuring</p>
                <Activity className="h-4 w-4 text-lapis" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-ink">{pendingQuizzes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Pending quizzen</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-rule py-0">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 leading-tight text-ink">
                <Users className="h-5 w-5 text-ink-soft" />
                Recente gebruikers
              </CardTitle>
              <CardDescription>Laatste 10 geregistreerde gebruikers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user: any) => (
                    <div key={user._id.toString()} className="flex items-center justify-between border-b border-rule pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{user.name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* An internal account carries Premium on purpose, so
                            it gets its own label rather than the crown that
                            everywhere else means "a customer". */}
                        {isInternalAccount(user.email) ? (
                          <span className="rounded-md bg-paper-sunken px-2 py-1 text-xs text-ink-soft">
                            Testaccount
                          </span>
                        ) : (
                          user.isPremium && <Crown className="h-4 w-4 text-lapis" />
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

          <Card className="border-rule py-0">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 leading-tight text-ink">
                <BookOpen className="h-5 w-5 text-ink-soft" />
                Recente quizzen
              </CardTitle>
              <CardDescription>Laatste 10 aangemaakte quizzen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentQuizzes.length > 0 ? (
                  recentQuizzes.map((quiz: any) => (
                    <div key={quiz._id.toString()} className="flex items-center justify-between border-b border-rule pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.categoryId?.title || 'Geen categorie'} • {quiz.questions?.length || 0} vragen
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-xs ${
                          quiz.status === 'approved' ? 'bg-positive-tint text-positive dark:bg-positive/30 dark:text-positive' :
                          quiz.status === 'pending' ? 'bg-lapis-tint text-lapis dark:bg-lapis/30 dark:text-lapis' :
                          quiz.status === 'rejected' ? 'bg-vermilion-tint text-vermilion dark:bg-vermilion/30 dark:text-vermilion' :
                          'bg-paper-sunken text-ink-soft'
                        }`}>
                          {quiz.status === 'approved' ? 'Actief' :
                           quiz.status === 'pending' ? 'Pending' :
                           quiz.status === 'rejected' ? 'Afgewezen' : 'Concept'}
                        </span>
                        <Link href={`/beheer/quizzen/${quiz._id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-ink-soft hover:bg-paper-sunken hover:text-ink">
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

      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <AdminGroupLicenseForm defaultSeats={GROUP_LICENSE_SEATS} />
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8 lg:px-10">
        <Card className="border-rule py-0">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="flex items-center gap-2 leading-tight text-ink">
              <Settings className="h-5 w-5 text-ink-soft" />
              Snelle acties
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Button asChild variant="outline" className="h-auto min-h-24 flex-col items-start justify-center border-rule bg-paper-raised py-4 text-left text-ink hover:bg-paper-sunken">
                <Link href="/beheer/quizzen?status=pending">
                  <Activity className="mb-2 h-5 w-5 text-lapis" />
                  <div className="text-left">
                    <div className="font-semibold">Review quizzen</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {pendingQuizzes} wachten op goedkeuring
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto min-h-24 flex-col items-start justify-center border-rule bg-paper-raised py-4 text-left text-ink hover:bg-paper-sunken">
                <Link href="/beheer/quizzen/create">
                  <Plus className="mb-2 h-5 w-5 text-ink-soft" />
                  <div className="text-left">
                    <div className="font-semibold">Nieuwe quiz</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      Maak een nieuwe quiz aan
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto min-h-24 flex-col items-start justify-center border-rule bg-paper-raised py-4 text-left text-ink hover:bg-paper-sunken">
                <Link href="/beheer/quizzen">
                  <BarChart3 className="mb-2 h-5 w-5 text-positive" />
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
