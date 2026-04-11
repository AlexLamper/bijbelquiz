'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry, CategoryOption } from './page';
import { Trophy, Crown, User as UserIcon } from 'lucide-react';

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

  // Find current user position
  const currentUserIndex = currentUserId ? filteredData.findIndex(user => user._id === currentUserId) : -1;
  const currentUserData = currentUserIndex >= 0 ? filteredData[currentUserIndex] : null;
  const showCurrentUserCard = currentUserIndex >= 50;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1a2333] dark:text-white tracking-tight mb-3">
          Ranglijst
        </h1>
        <p className="text-[#5c687e] dark:text-white/70 text-base max-w-md mx-auto">
          Bekijk de beste spelers en vergelijk je score met anderen.
        </p>
      </div>

      {/* Main Leaderboard Card */}
      <div className="bg-card dark:bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Leaderboard Entries */}
        <div className="divide-y divide-border">
          {filteredData.slice(0, 50).map((user, index) => {
            const rank = index + 1;
            const isMe = currentUserId === user._id;
            const isTopThree = rank <= 3;

            return (
              <div
                key={user._id.toString()}
                className={cn(
                  "flex items-center px-5 sm:px-6 py-4 transition-colors",
                  isMe && "bg-primary/5 dark:bg-[#5b7dd9]/10",
                  !isMe && "hover:bg-muted/30 dark:hover:bg-muted/10"
                )}
              >
                {/* Rank */}
                <div className="w-12 shrink-0">
                  {rank === 1 && (
                    <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {rank === 2 && (
                    <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">2</span>
                    </div>
                  )}
                  {rank === 3 && (
                    <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">3</span>
                    </div>
                  )}
                  {rank > 3 && (
                    <span className={cn(
                      "text-base font-medium",
                      isMe ? "text-primary dark:text-[#5b7dd9]" : "text-muted-foreground"
                    )}>
                      {rank}
                    </span>
                  )}
                </div>
                
                {/* Avatar & Name */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className={cn(
                        "rounded-full object-cover shrink-0",
                        isTopThree ? "w-10 h-10" : "w-9 h-9"
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "rounded-full bg-muted flex items-center justify-center shrink-0",
                      isTopThree ? "w-10 h-10" : "w-9 h-9"
                    )}>
                      <UserIcon className="text-muted-foreground w-4 h-4"/>
                    </div>
                  )}
                  <div className="min-w-0 flex items-center gap-2">
                    <span className={cn(
                      "truncate",
                      isTopThree ? "font-semibold" : "font-medium",
                      isMe ? "text-[#1a2333] dark:text-white font-semibold" : "text-[#1a2333] dark:text-white"
                    )}>
                      {user.name || 'Speler'}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary dark:bg-[#5b7dd9] text-white px-1.5 py-0.5 rounded shrink-0">
                        Jij
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <span className={cn(
                    "font-semibold tabular-nums",
                    isMe ? "text-primary dark:text-[#5b7dd9]" : "text-[#1a2333] dark:text-white"
                  )}>
                    {user.totalPoints.toLocaleString('nl-NL')}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">XP</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="py-16 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-[#1a2333] dark:text-white mb-1">
              Nog geen activiteit
            </p>
            <p className="text-sm text-muted-foreground">
              Speel een quiz om op de ranglijst te komen.
            </p>
          </div>
        )}
      </div>

      {/* Current User Card if outside top 50 */}
      {showCurrentUserCard && currentUserData && (
        <div className="mt-6">
          <div className="bg-primary/5 dark:bg-[#5b7dd9]/10 border border-primary/20 dark:border-[#5b7dd9]/20 rounded-xl px-5 sm:px-6 py-4">
            <div className="flex items-center">
              <div className="w-12 shrink-0">
                <span className="text-base font-semibold text-primary dark:text-[#5b7dd9]">
                  {currentUserIndex + 1}
                </span>
              </div>
              
              <div className="flex-1 flex items-center gap-3 min-w-0">
                {currentUserData.image ? (
                  <img 
                    src={currentUserData.image} 
                    alt={currentUserData.name} 
                    className="w-9 h-9 rounded-full object-cover shrink-0" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <UserIcon className="text-muted-foreground w-4 h-4"/>
                  </div>
                )}
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-semibold text-[#1a2333] dark:text-white truncate">
                    {currentUserData.name || 'Speler'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary dark:bg-[#5b7dd9] text-white px-1.5 py-0.5 rounded shrink-0">
                    Jij
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-semibold text-primary dark:text-[#5b7dd9] tabular-nums">
                  {currentUserData.totalPoints.toLocaleString('nl-NL')}
                </span>
                <span className="text-muted-foreground text-sm ml-1">XP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
