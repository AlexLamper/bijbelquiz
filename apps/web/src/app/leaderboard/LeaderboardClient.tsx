'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Medal, Star, User as UserIcon, Diamond, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry, CategoryOption } from './page';

interface LeaderboardClientProps {
  initialData: LeaderboardEntry[];
  categories: CategoryOption[];
  initialTimeFilter: string;
  initialCategorySlug: string;
  currentUserId: string | null;
}

export default function LeaderboardClient({
  initialData,
  initialTimeFilter,
  currentUserId,
}: LeaderboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timeFilter, setTimeFilter] = useState(initialTimeFilter);

  const filteredData = initialData; 
  const podiumUsers = filteredData.slice(0, 3);
  const tableUsers = filteredData.slice(3, 50);

  // Find where the current user is ranked
  const currentUserRankIndex = filteredData.findIndex(u => u._id === currentUserId);
  const currentUserRank = currentUserRankIndex !== -1 ? currentUserRankIndex + 1 : null;
  const showCurrentUserAtBottom = currentUserRank !== null && currentUserRank > 50;
  const currentUserData = showCurrentUserAtBottom ? filteredData[currentUserRankIndex] : null;

  const updateFilters = (newTime: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTime === 'all') params.delete('time');
    else params.set('time', newTime);
    setTimeFilter(newTime);
    
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '/leaderboard', { scroll: false });
    router.refresh();
  };

  return (
    <div className="relative flex flex-col min-w-0 w-full">
      
      {/* Top Tabs */}
      <div className="flex justify-center mb-10 md:mb-16 relative z-10 w-full overflow-hidden">
        <div className="bg-muted p-1.5 rounded-[20px] flex gap-1 mx-auto overflow-x-auto max-w-full no-scrollbar">
          <button 
            onClick={() => updateFilters('week')}
            className={cn(
              "px-4 sm:px-8 py-2 md:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 w-auto whitespace-nowrap",
              timeFilter === 'week' 
                ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Daily
          </button>
          <button 
            onClick={() => updateFilters('month')}
            className={cn(
              "px-4 sm:px-8 py-2 md:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 w-auto whitespace-nowrap",
              timeFilter === 'month' 
                ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button 
            onClick={() => updateFilters('all')}
            className={cn(
              "px-4 sm:px-8 py-2 md:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 w-auto whitespace-nowrap",
              timeFilter === 'all' 
                ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Podium */}
      {podiumUsers.length > 0 && (
        <div className="flex items-end justify-center gap-1 sm:gap-4 md:gap-8 h-[220px] sm:h-[240px] md:h-[280px] mb-6 md:mb-8 relative z-10 px-0 sm:px-4 w-full">
          {podiumUsers[1] && <PodiumCard user={podiumUsers[1]} rank={2} />}
          {podiumUsers[0] && <PodiumCard user={podiumUsers[0]} rank={1} />}
          {podiumUsers[2] && <PodiumCard user={podiumUsers[2]} rank={3} />}
        </div>
      )}

      {/* List Table */}
      <div className="relative z-10 overflow-x-auto rounded-[24px] border bg-card shadow-sm w-full">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
          <thead className="text-muted-foreground font-medium border-b bg-muted/30">
            <tr>
              <th className="px-4 md:px-8 py-5 w-16 md:w-24">Plek</th>
              <th className="px-4 md:px-8 py-5">Speler</th>
              <th className="px-4 md:px-8 py-5 text-center hidden md:table-cell">Quizzen</th>
              <th className="px-4 md:px-8 py-5 text-center hidden sm:table-cell">Gem. Score</th>
              <th className="px-4 md:px-8 py-5 text-right w-40">Totaal XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {tableUsers.map((user, index) => (
              <LeaderboardRow 
                key={user._id.toString()} 
                user={user} 
                rank={index + 4} 
                isCurrentUser={user._id === currentUserId}
              />
            ))}
          </tbody>
        </table>
        
        {showCurrentUserAtBottom && currentUserData && (
          <div className="border-t-[3px] border-primary/20 bg-background/50">
             <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
               <tbody className="divide-y divide-border bg-primary/5">
                 <LeaderboardRow
                    key={currentUserData._id.toString()}
                    user={currentUserData}
                    rank={currentUserRank as number}
                    isCurrentUser={true}
                 />
               </tbody>
             </table>
          </div>
        )}

        {tableUsers.length === 0 && (
          <div className="py-16 text-center text-slate-500 text-sm">
            Geen overige spelers voor deze periode.
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ user, rank }: { user: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const config = {
    1: {
      blockHeight: 'h-28 sm:h-32 md:h-36',
      width: 'w-24 sm:w-32 md:w-40',
      avatarSize: 'h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24',
      glowInfo: 'bg-amber-500/10 blur-[40px]',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
      blockColor: 'bg-gradient-to-t from-background via-card to-card border-t border-border',
      icon: <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />,
      prizeBg: 'text-amber-600 dark:text-amber-300',
      avatarBorder: 'ring-4 ring-background ring-offset-2 ring-offset-amber-200 dark:ring-offset-amber-500/40',
      label: '1e Plaats'
    },
    2: {
      blockHeight: 'h-24 sm:h-28 md:h-32',
      width: 'w-[84px] sm:w-[100px] md:w-36',
      avatarSize: 'h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20',
      glowInfo: 'bg-slate-300/20 dark:bg-slate-300/10 blur-[30px]',
      badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 border border-slate-200 dark:border-slate-500/30',
      blockColor: 'bg-gradient-to-t from-background via-card to-card border-t border-border',
      icon: <Medal className="h-3 w-3 md:h-4 md:w-4 text-slate-500 dark:text-slate-300" />,
      prizeBg: 'text-foreground',
      avatarBorder: 'ring-2 ring-border ring-offset-1 ring-offset-slate-200 dark:ring-offset-slate-400/20',
      label: '2e Plaats'
    },
    3: {
      blockHeight: 'h-20 sm:h-24 md:h-24',
      width: 'w-[84px] sm:w-[100px] md:w-36',
      avatarSize: 'h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20',
      glowInfo: 'bg-orange-500/10 blur-[30px]',
      badgeColor: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30',
      blockColor: 'bg-gradient-to-t from-background via-card to-card border-t border-border',
      icon: <Medal className="h-3 w-3 md:h-4 md:w-4 text-orange-500 dark:text-orange-400" />,
      prizeBg: 'text-foreground',
      avatarBorder: 'ring-2 ring-border ring-offset-1 ring-offset-orange-200 dark:ring-offset-orange-500/20',
      label: '3e Plaats'
    },
  }[rank];

  return (
    <div className={cn("flex flex-col items-center relative", config.width)}>
      <div className={cn("absolute -top-10 md:-top-20 w-32 md:w-48 h-32 md:h-48 rounded-full z-0 pointer-events-none", config.glowInfo)} />
      
      <div className={cn(
        "relative rounded-[24px] md:rounded-[32px] overflow-hidden mb-3 md:mb-5 z-10 bg-card shadow-lg transition-transform hover:scale-105 duration-300 flex-shrink-0", 
        config.avatarSize,
        config.avatarBorder
      )}>
        {user.image ? (
          <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <UserIcon className={cn("text-slate-400 opacity-60", rank === 1 ? "h-12 w-12 md:h-16 md:w-16" : "h-8 w-8 md:h-12 md:w-12")} />
          </div>
        )}
      </div>

      <div className="font-bold text-xs sm:text-sm md:text-[17px] mb-3 md:mb-4 tracking-wide truncate w-full z-10 px-1 md:px-2 text-center text-foreground drop-shadow-sm">
        {user.name || 'Anoniem'}
      </div>

      <div className={cn(
        "w-full rounded-t-xl sm:rounded-t-2xl relative flex flex-col items-center justify-start pt-3 sm:pt-4 md:pt-5 z-10 shadow-sm inset-0 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-t-xl sm:before:rounded-t-2xl", 
        config.blockHeight, 
        config.blockColor
      )}>
        <div className={cn("px-2 md:px-3 py-[2px] md:py-1 rounded-[6px] md:rounded-lg text-[9px] md:text-xs font-semibold mb-1 sm:mb-2 md:mb-3 flex items-center gap-1 backdrop-blur-md relative z-10 whitespace-nowrap", config.badgeColor)}>
          {config.icon} <span className="hidden sm:inline">{config.label}</span><span className="sm:hidden">{rank}e.</span>
        </div>
        
        <div className="flex flex-col items-center relative z-10 px-1">
          <div className={cn("flex items-center gap-1 md:gap-1.5 text-sm sm:text-lg md:text-[22px] font-bold font-serif leading-none mb-0.5 sm:mb-1", config.prizeBg)}>
            <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-[16px] md:w-[16px] text-emerald-500" />
            {user.totalPoints.toLocaleString('nl-NL')}
          </div>
          <div className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">
            TOTAAL XP
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ user, rank, isCurrentUser = false }: { user: LeaderboardEntry; rank: number; isCurrentUser?: boolean }) {
  return (
    <tr className={cn(
      "transition-colors group",
      isCurrentUser ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
    )}>
      <td className="px-4 md:px-8 py-3.5 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Trophy className={cn("h-3.5 w-3.5 md:h-4 md:w-4 transition-colors hidden sm:block", isCurrentUser ? "text-primary/70" : "text-muted-foreground group-hover:text-foreground")} />
          <span className={cn("w-4 md:w-6 text-center font-bold transition-colors text-xs md:text-sm", isCurrentUser ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
            {rank}
          </span>
        </div>
      </td>
      <td className="px-4 md:px-8 py-3.5 md:py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 md:h-[38px] md:w-[38px] rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border shadow-inner">
            {user.image ? (
              <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground opacity-60" />
              </div>
            )}
          </div>
          <div className="font-semibold text-foreground text-xs md:text-base tracking-wide flex items-center">
            <span className="truncate max-w-[120px] sm:max-w-xs">{user.name || "Anonieme Speler"}</span>
            {user.isPremium && (
              <Star className="hidden sm:inline h-3 w-3 text-amber-500 fill-amber-500 ml-2" />
            )}
          </div>
        </div>
      </td>
      <td className="px-4 md:px-8 py-3.5 md:py-4 text-center hidden md:table-cell text-muted-foreground font-medium">
        {user.quizzesPlayed}
      </td>
      <td className="px-4 md:px-8 py-3.5 md:py-4 text-center hidden sm:table-cell">
        <span className="bg-background text-muted-foreground px-2 py-1 rounded-md text-xs font-semibold ring-1 ring-border shadow-sm border border-border">
          {user.avgScore}%
        </span>
      </td>
      <td className="px-4 md:px-8 py-3.5 md:py-4 text-right">
        <div className="inline-flex items-center justify-end gap-1.5 md:gap-2 font-mono text-[13px] md:text-[15px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50 shadow-sm w-[110px] md:w-[130px]">
          <Award className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
          <span>{user.totalPoints.toLocaleString('nl-NL')} <span className="text-[10px] md:text-[11px] text-emerald-600/70 dark:text-emerald-400/60 font-sans tracking-wide ml-0.5">XP</span></span>
        </div>
      </td>
    </tr>
  );
}
