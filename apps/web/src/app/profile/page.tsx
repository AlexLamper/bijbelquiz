import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB, User, UserProgress } from '@bijbelquiz/database';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  User as UserIcon, 
  Mail, 
  Star, 
  Calendar, 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Crown, 
  ArrowLeft,
  Target,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Mijn Profiel - BijbelQuiz',
  robots: {
    index: false,
    follow: false,
  },
};

// Level calculation helper
function getLevelInfo(xp: number) {
  const levels = [
    { level: 1, title: 'Beginner', minXp: 0 },
    { level: 2, title: 'Leerling', minXp: 100 },
    { level: 3, title: 'Ontdekker', minXp: 250 },
    { level: 4, title: 'Kenner', minXp: 500 },
    { level: 5, title: 'Geleerde', minXp: 1000 },
    { level: 6, title: 'Expert', minXp: 2000 },
    { level: 7, title: 'Meester', minXp: 4000 },
    { level: 8, title: 'Schriftgeleerde', minXp: 7500 },
    { level: 9, title: 'Wijze', minXp: 12000 },
    { level: 10, title: 'Bijbelvorser', minXp: 20000 },
  ];
  
  let currentLevel = levels[0];
  let nextLevel = levels[1];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || levels[i];
      break;
    }
  }
  
  const xpInCurrentLevel = xp - currentLevel.minXp;
  const xpNeededForNextLevel = nextLevel.minXp - currentLevel.minXp;
  const progress = xpNeededForNextLevel > 0 ? Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100) : 100;
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    progress,
    xpToNext: nextLevel.minXp - xp,
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  await connectDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    return <div>Gebruiker niet gevonden</div>;
  }

  // Get quiz statistics
  const totalQuizzesDone = await UserProgress.countDocuments({ userId: user._id });
  const recentProgress = await UserProgress.find({ userId: user._id })
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();
  
  const avgScore = recentProgress.length > 0
    ? Math.round(
        recentProgress.reduce((acc, p) =>
          acc + (p.totalQuestions > 0 ? (p.score / p.totalQuestions) * 100 : 0), 0
        ) / recentProgress.length
      )
    : 0;

  const levelInfo = getLevelInfo(user.xp || 0);

  return (
    <div className="min-h-screen bg-[#f0f4fa] dark:bg-background">
      {/* Header Section */}
      <div className="bg-[#1a2942] pt-24 md:pt-32 pb-24 -mt-[104px]">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Mijn Profiel' },
            ]}
            className="mb-6 text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white"
          />
          
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Terug naar Dashboard</span>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-white/60" />
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {user.name || 'Naamloos'}
                </h1>
                {user.isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-amber-400" /> PRO
                  </span>
                )}
              </div>
              <p className="text-white/60 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <p className="text-white/40 text-sm mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 max-w-[1200px] -mt-16">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Totaal XP</span>
              <Trophy className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{user.xp || 0}</div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Dagen Reeks</span>
              <Flame className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{user.streak || 0}</div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Quizzen Gedaan</span>
              <CheckCircle2 className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{totalQuizzesDone}</div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Gem. Score</span>
              <Target className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{avgScore}%</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Level Progress Card */}
          <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#5b7dd9]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#5b7dd9]" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1a2942] dark:text-foreground">Niveau Voortgang</h2>
                <p className="text-sm text-muted-foreground">Verdien XP om een hoger niveau te bereiken</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5b7dd9] to-[#4a6bc7] flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{levelInfo.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-[#1a2942] dark:text-foreground">{levelInfo.title}</span>
                  <span className="text-sm text-muted-foreground">{levelInfo.progress}%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 dark:bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5b7dd9] to-[#4a6bc7] rounded-full transition-all duration-1000"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                {levelInfo.xpToNext > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nog {levelInfo.xpToNext} XP tot het volgende niveau
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Badges Card */}
          <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1a2942] dark:text-foreground">Badges</h2>
                <p className="text-sm text-muted-foreground">{(user.badges || []).length} verdiend</p>
              </div>
            </div>
            
            {(user.badges || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge: string, index: number) => (
                  <span key={index} className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-gray-300 dark:text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nog geen badges verdiend</p>
                <p className="text-xs text-muted-foreground mt-1">Speel quizzen om badges te verdienen!</p>
              </div>
            )}
          </div>
        </div>

        {/* Premium Upsell (for non-premium users) */}
        {!user.isPremium && (
          <div className="mt-8 bg-gradient-to-r from-[#1a2942] to-[#2a3f5f] rounded-2xl p-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#5b7dd9]/20 px-4 py-2 mb-4">
              <Crown className="h-5 w-5 text-[#5b7dd9]" />
              <span className="text-sm font-medium text-[#5b7dd9]">Premium</span>
            </div>
            <h3 className="text-2xl font-serif font-medium text-white mb-2">
              Upgrade naar Premium
            </h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Krijg toegang tot alle quizzen, speel zonder advertenties en ontdek exclusieve content.
            </p>
            <Button
              className="rounded-full bg-[#5b7dd9] px-8 py-6 text-base font-medium text-white hover:bg-[#4a6bc7]"
              asChild
            >
              <Link href="/premium">Word nu Premium</Link>
            </Button>
          </div>
        )}

        {/* Premium Thank You (for premium users) */}
        {user.isPremium && (
          <div className="mt-8 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-2xl p-6 text-center border border-amber-200/50 dark:border-amber-700/30">
            <Star className="w-8 h-8 text-amber-500 mx-auto mb-3 fill-amber-500" />
            <h3 className="text-lg font-medium text-amber-900 dark:text-amber-400 mb-1">
              Bedankt voor je steun!
            </h3>
            <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
              Je hebt toegang tot alle premium content van BijbelQuiz.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 pb-12">
          <h2 className="font-serif text-xl font-medium text-[#1a2942] dark:text-foreground mb-4">Snelle Acties</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/quizzes" className="flex items-center gap-4 p-4 bg-white dark:bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-xl bg-[#5b7dd9]/10 flex items-center justify-center group-hover:bg-[#5b7dd9]/20 transition-colors">
                <BookOpen className="w-5 h-5 text-[#5b7dd9]" />
              </div>
              <div>
                <span className="font-medium text-[#1a2942] dark:text-foreground group-hover:text-[#5b7dd9] transition-colors">Speel een Quiz</span>
                <p className="text-sm text-muted-foreground">Kies uit 100+ quizzen</p>
              </div>
            </Link>
            
            <Link href="/leaderboard" className="flex items-center gap-4 p-4 bg-white dark:bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-200/80 dark:group-hover:bg-amber-900/30 transition-colors">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <span className="font-medium text-[#1a2942] dark:text-foreground group-hover:text-[#5b7dd9] transition-colors">Ranglijst</span>
                <p className="text-sm text-muted-foreground">Bekijk je positie</p>
              </div>
            </Link>
            
            <Link href="/dashboard" className="flex items-center gap-4 p-4 bg-white dark:bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-200/80 dark:group-hover:bg-emerald-900/30 transition-colors">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <span className="font-medium text-[#1a2942] dark:text-foreground group-hover:text-[#5b7dd9] transition-colors">Dashboard</span>
                <p className="text-sm text-muted-foreground">Bekijk je voortgang</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
