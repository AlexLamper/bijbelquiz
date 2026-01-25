import { Metadata } from 'next';
import { connectDB, UserProgress, User } from '@bijbelquiz/database';
import { Trophy, Medal, Star, User as UserIcon, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  _id: string;
  totalPoints: number;
  quizzesPlayed: number;
  name: string;
  isPremium: boolean;
}

export const metadata: Metadata = {
  title: 'Ranglijst - BijbelQuiz',
  description: 'Bekijk de topspelers van BijbelQuiz. Verdien punten door quizzen te spelen en stijg in de ranglijst.',
  alternates: {
    canonical: '/leaderboard',
  },
  openGraph: {
    title: 'De BijbelQuiz Ranglijst - Wie heeft de meeste bijbelkennis?',
    description: 'Strijd mee voor de eerste plek! Speel quizzen, verdien punten en word de nummer 1.',
    url: 'https://www.bijbelquiz.com/leaderboard',
  }
};

export const dynamic = 'force-dynamic';

async function getLeaderboardData() {
  await connectDB();
  
  // Ensure models are registered to avoid MissingSchemaError in some dev environments
  // Since we import them, they should be registered.

  const leaderboard = await UserProgress.aggregate([
    // 1. Sort by score desc to prioritize high scores in processing (though $max handles it)
    { $sort: { score: -1 } },
    // 2. Group by User and Quiz to get the best score for each unique quiz
    {
      $group: {
        _id: { userId: "$userId", quizId: "$quizId" },
        bestScore: { $max: "$score" }
      }
    },
    // 3. Group by User to sum all their best scores
    {
      $group: {
        _id: "$_id.userId",
        totalPoints: { $sum: "$bestScore" },
        quizzesPlayed: { $sum: 1 }
      }
    },
    // 4. Join with Users collection to get profile info
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    // 5. Remove entries where user doesn't exist (e.g. deleted users)
    { $unwind: "$userInfo" },
    // 6. Select only needed fields
    {
      $project: {
        _id: 1,
        totalPoints: 1,
        quizzesPlayed: 1,
        name: "$userInfo.name",
        isPremium: "$userInfo.isPremium",
      }
    },
    // 7. Sort by total points descending
    { $sort: { totalPoints: -1 } },
    // 8. Top 50
    { $limit: 50 }
  ]);

  return leaderboard;
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboardData();

  return (
    <div className="container px-4 py-8 md:py-12 mx-auto max-w-4xl">
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#152c31] dark:text-foreground inline-flex items-center gap-3 justify-center">
            <Medal className="h-10 w-10 text-amber-500" />
            Ranglijst
        </h1>
        <p className="text-lg text-slate-600 dark:text-muted-foreground max-w-2xl mx-auto">
          Bekijk wie de meeste punten heeft behaald. 
          Speel quizzen om punten te verdienen en klim naar de top!
        </p>
      </div>

      <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-0">
            <div className="flex justify-between items-center mb-4">
                <div>
                   <CardTitle className="font-serif text-xl">Top 50 Spelers</CardTitle>
                   <CardDescription>Gerangschikt op totaal aantal punten</CardDescription>
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground bg-background/50 px-3 py-1 rounded-full border border-border/50">
                    Punten = Som van je beste scores per quiz
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            {leaderboard.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                    <p>Nog geen scores geregistreerd. Wees de eerste!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-500 dark:text-slate-400 font-medium border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">#</th>
                                <th className="px-6 py-4">Speler</th>
                                <th className="px-6 py-4 text-center hidden sm:table-cell">Quizzen</th>
                                <th className="px-6 py-4 text-right">Punten</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {leaderboard.map((user: LeaderboardEntry, index: number) => {
                                const rank = index + 1;
                                let medal = null;
                                let rowClass = "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors";
                                let rankClass = "font-medium text-slate-500 dark:text-slate-400";

                                if (rank === 1) {
                                    medal = <Crown className="h-5 w-5 text-amber-500 fill-amber-500" />;
                                    rowClass = "bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 transition-colors";
                                    rankClass = "font-bold text-amber-600 dark:text-amber-500";
                                } else if (rank === 2) {
                                    medal = <Medal className="h-5 w-5 text-slate-400 fill-slate-300" />;
                                    rankClass = "font-bold text-slate-500";
                                } else if (rank === 3) {
                                    medal = <Medal className="h-5 w-5 text-amber-700 fill-amber-600" />;
                                    rankClass = "font-bold text-amber-700";
                                }

                                return (
                                    <tr key={user._id.toString()} className={rowClass}>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center">
                                                {medal || <span className={rankClass}>{rank}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border">
                                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground flex items-center gap-2">
                                                        {user.name || "Anonieme Speler"}
                                                        {user.isPremium && (
                                                            <Badge variant="secondary" className="h-5 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                                                <Star className="h-3 w-3 fill-current mr-1" />
                                                                PRO
                                                            </Badge>
                                                        )}
                                                    </span>
                                                    {rank <= 3 && (
                                                        <span className="text-xs text-muted-foreground block sm:hidden">
                                                            {user.quizzesPlayed} quizzen
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden sm:table-cell text-slate-600 dark:text-slate-400">
                                            {user.quizzesPlayed}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold font-serif text-lg text-[#152c31] dark:text-white">
                                            {user.totalPoints}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center">
         <p className="text-muted-foreground text-sm">
           Geen punten zichtbaar? Zorg dat je bent ingelogd tijdens het spelen van quizzen.
         </p>
      </div>
    </div>
  );
}
