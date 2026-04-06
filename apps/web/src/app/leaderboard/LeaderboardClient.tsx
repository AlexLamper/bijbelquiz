'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry, CategoryOption } from './page';
import { Trophy, Crown, User as UserIcon, Medal, Flame } from 'lucide-react';

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

  // Find current user position if not in top 50
  const currentUserIndex = currentUserId ? filteredData.findIndex(user => user._id === currentUserId) : -1;
  const currentUserData = currentUserIndex >= 0 ? filteredData[currentUserIndex] : null;
  const showCurrentUserCard = currentUserIndex >= 50;

  return (
    <div className="pb-16">
      {/* Hero Header - Matching landing page style */}
      <div className="text-left mb-12 md:mb-16">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a2333] dark:text-white tracking-tight mb-4 leading-[1.1]">
          Ranglijst
        </h1>
        <p className="text-[#5c687e] dark:text-white/70 text-base sm:text-lg max-w-xl leading-relaxed">
          Bekijk de beste spelers van BijbelQuiz. Verdien punten door quizzen te spelen en stijg in de ranglijst!
        </p>
      </div>

      {/* Stats Banner */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-8 md:gap-16 py-8 bg-card dark:bg-card rounded-2xl border border-border">
        <div className="text-center">
          <div className="font-serif text-4xl font-medium text-primary dark:text-[#5b7dd9] md:text-5xl">
            {filteredData.length}
          </div>
          <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Spelers</div>
        </div>
        <div className="text-center">
          <div className="font-serif text-4xl font-medium text-primary dark:text-[#5b7dd9] md:text-5xl">
            {filteredData.reduce((sum, user) => sum + user.quizzesPlayed, 0).toLocaleString('nl-NL')}
          </div>
          <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Gespeelde Quizzen</div>
        </div>
        <div className="text-center">
          <div className="font-serif text-4xl font-medium text-primary dark:text-[#5b7dd9] md:text-5xl">
            {filteredData.reduce((sum, user) => sum + user.totalPoints, 0).toLocaleString('nl-NL')}
          </div>
          <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Totale XP</div>
        </div>
      </div>

      {/* Podium Section */}
      {podiumUsers.length > 0 && (
        <div className="mb-12">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-[#1a2333] dark:text-white mb-8 text-center">
            Top 3 Spelers
          </h2>
          
          <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-4 lg:gap-8 max-w-3xl mx-auto">
            {/* 2nd Place */}
            <div className="flex-1 flex justify-center order-2 md:order-1 w-full md:w-1/3">
              {podiumUsers[1] && (
                <div className="group w-full">
                  <div className="bg-card dark:bg-card border border-border rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative inline-block mb-4">
                      {podiumUsers[1].image ? (
                        <img 
                          src={podiumUsers[1].image} 
                          alt={podiumUsers[1].name} 
                          className="w-20 h-20 rounded-full border-4 border-[#C0C0C0] object-cover mx-auto" 
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full border-4 border-[#C0C0C0] bg-muted flex items-center justify-center mx-auto">
                          <UserIcon className="text-muted-foreground w-10 h-10"/>
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-[#C0C0C0] text-white text-sm font-bold rounded-full shadow-md">
                        2
                      </div>
                    </div>
                    <p className="font-serif text-lg font-semibold text-[#1a2333] dark:text-white truncate">
                      {podiumUsers[1].name || 'Speler'}
                    </p>
                    <p className="text-primary dark:text-[#5b7dd9] font-bold text-lg mt-1">
                      {podiumUsers[1].totalPoints.toLocaleString('nl-NL')} XP
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {podiumUsers[1].quizzesPlayed} quizzen
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 1st Place */}
            <div className="flex-1 flex justify-center order-1 md:order-2 w-full md:w-1/3 md:-translate-y-4">
              {podiumUsers[0] && (
                <div className="group w-full">
                  <div className="bg-card dark:bg-card border-2 border-primary/30 dark:border-[#5b7dd9]/30 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
                    {/* Crown icon */}
                    <Crown className="text-primary dark:text-[#5b7dd9] w-8 h-8 mx-auto mb-2" />
                    
                    <div className="relative inline-block mb-4">
                      {podiumUsers[0].image ? (
                        <img 
                          src={podiumUsers[0].image} 
                          alt={podiumUsers[0].name} 
                          className="w-24 h-24 rounded-full border-4 border-primary dark:border-[#5b7dd9] object-cover mx-auto shadow-lg" 
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-primary dark:border-[#5b7dd9] bg-muted flex items-center justify-center mx-auto shadow-lg">
                          <UserIcon className="text-muted-foreground w-12 h-12"/>
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 flex items-center justify-center bg-primary dark:bg-[#5b7dd9] text-white text-base font-bold rounded-full shadow-md">
                        1
                      </div>
                    </div>
                    <p className="font-serif text-xl font-bold text-[#1a2333] dark:text-white truncate">
                      {podiumUsers[0].name || 'Speler'}
                    </p>
                    <p className="text-primary dark:text-[#5b7dd9] font-bold text-xl mt-1">
                      {podiumUsers[0].totalPoints.toLocaleString('nl-NL')} XP
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {podiumUsers[0].quizzesPlayed} quizzen
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3rd Place */}
            <div className="flex-1 flex justify-center order-3 w-full md:w-1/3">
              {podiumUsers[2] && (
                <div className="group w-full">
                  <div className="bg-card dark:bg-card border border-border rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative inline-block mb-4">
                      {podiumUsers[2].image ? (
                        <img 
                          src={podiumUsers[2].image} 
                          alt={podiumUsers[2].name} 
                          className="w-18 h-18 rounded-full border-4 border-[#CD7F32] object-cover mx-auto" 
                        />
                      ) : (
                        <div className="w-18 h-18 rounded-full border-4 border-[#CD7F32] bg-muted flex items-center justify-center mx-auto">
                          <UserIcon className="text-muted-foreground w-9 h-9"/>
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-[#CD7F32] text-white text-sm font-bold rounded-full shadow-md">
                        3
                      </div>
                    </div>
                    <p className="font-serif text-lg font-semibold text-[#1a2333] dark:text-white truncate">
                      {podiumUsers[2].name || 'Speler'}
                    </p>
                    <p className="text-primary dark:text-[#5b7dd9] font-bold text-lg mt-1">
                      {podiumUsers[2].totalPoints.toLocaleString('nl-NL')} XP
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {podiumUsers[2].quizzesPlayed} quizzen
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {tableUsers.length > 0 && (
        <div className="bg-card dark:bg-card rounded-2xl border border-border overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-6 py-4 bg-muted/50 dark:bg-muted/20 border-b border-border">
            <span className="w-16 text-sm font-medium text-muted-foreground">Rang</span>
            <span className="flex-1 text-sm font-medium text-muted-foreground">Speler</span>
            <span className="w-28 text-right text-sm font-medium text-muted-foreground hidden sm:block">Quizzen</span>
            <span className="w-28 text-right text-sm font-medium text-muted-foreground">Punten</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {tableUsers.map((user, index) => {
              const rank = index + 4;
              const isMe = currentUserId === user._id;

              return (
                <div
                  key={user._id.toString()}
                  className={cn(
                    "flex items-center px-6 py-4 transition-colors",
                    isMe 
                      ? "bg-primary/5 dark:bg-[#5b7dd9]/10" 
                      : "hover:bg-muted/30 dark:hover:bg-muted/10"
                  )}
                >
                  <span className={cn(
                    "w-16 font-serif text-lg font-semibold",
                    isMe ? "text-primary dark:text-[#5b7dd9]" : "text-muted-foreground"
                  )}>
                    {rank}
                  </span>
                  
                  <div className="flex-1 flex items-center gap-4 min-w-0">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full object-cover shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserIcon className="text-muted-foreground w-5 h-5"/>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={cn(
                        "text-base truncate",
                        isMe ? "font-bold text-[#1a2333] dark:text-white" : "font-medium text-[#1a2333] dark:text-white"
                      )}>
                        {user.name || 'Speler'}
                        {isMe && (
                          <span className="ml-2 text-xs font-bold uppercase tracking-wider bg-primary dark:bg-[#5b7dd9] text-white px-2 py-0.5 rounded-md">
                            Jij
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="w-28 text-right text-muted-foreground hidden sm:block">
                    {user.quizzesPlayed}
                  </span>

                  <span className={cn(
                    "w-28 text-right font-bold",
                    isMe ? "text-primary dark:text-[#5b7dd9]" : "text-[#1a2333] dark:text-white"
                  )}>
                    {user.totalPoints.toLocaleString('nl-NL')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tableUsers.length === 0 && podiumUsers.length === 0 && (
        <div className="bg-card dark:bg-card rounded-2xl border border-border p-16 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-serif text-xl font-semibold text-[#1a2333] dark:text-white mb-2">
            Nog geen activiteit
          </h3>
          <p className="text-muted-foreground">
            Speel een quiz om de ranglijst te openen.
          </p>
        </div>
      )}

      {/* Current User Card if outside top 50 */}
      {showCurrentUserCard && currentUserData && (
        <div className="mt-8">
          <p className="text-sm uppercase tracking-wider font-medium text-muted-foreground mb-4 text-center">
            Jouw Positie
          </p>
          <div className="bg-primary/5 dark:bg-[#5b7dd9]/10 border-2 border-primary/20 dark:border-[#5b7dd9]/20 rounded-2xl p-6">
            <div className="flex items-center">
              <span className="w-16 font-serif text-2xl font-bold text-primary dark:text-[#5b7dd9]">
                #{currentUserIndex + 1}
              </span>
              
              <div className="flex-1 flex items-center gap-4 min-w-0">
                {currentUserData.image ? (
                  <img 
                    src={currentUserData.image} 
                    alt={currentUserData.name} 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30 dark:ring-[#5b7dd9]/30 shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/30 dark:ring-[#5b7dd9]/30 shrink-0">
                    <UserIcon className="text-muted-foreground w-6 h-6"/>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-lg font-bold text-[#1a2333] dark:text-white truncate">
                    {currentUserData.name || 'Speler'}
                    <span className="ml-2 text-xs font-bold uppercase tracking-wider bg-primary dark:bg-[#5b7dd9] text-white px-2 py-0.5 rounded-md">
                      Jij
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentUserData.quizzesPlayed} quizzen gespeeld
                  </p>
                </div>
              </div>

              <span className="text-xl font-bold text-primary dark:text-[#5b7dd9]">
                {currentUserData.totalPoints.toLocaleString('nl-NL')} XP
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
