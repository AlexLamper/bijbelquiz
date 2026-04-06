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
  const podiumUsers = filteredData.slice(0, 3);
  const tableUsers = filteredData.slice(3, 50);

  // Find current user position if not in top 50
  const currentUserIndex = currentUserId ? filteredData.findIndex(user => user._id === currentUserId) : -1;
  const currentUserData = currentUserIndex >= 0 ? filteredData[currentUserIndex] : null;
  const showCurrentUserCard = currentUserIndex >= 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 pb-20">
      <div className="container mx-auto px-4 pt-8 md:pt-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-[#5b7dd9]/10 to-blue-500/10 rounded-full">
            <Trophy className="h-5 w-5 text-[#5b7dd9]" />
            <span className="text-sm font-bold text-[#5b7dd9] uppercase tracking-wider">Ranglijst</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">Top Spelers</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">Bekijk wie de beste spelers zijn en concurreer om de top positie!</p>
        </div>

      {/* Podium Section - Completely flat without card background */}
      <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-3 lg:gap-6 w-full mb-12 px-4 max-w-2xl mx-auto">
        {/* 2nd Place */}
        <div className="flex-1 flex justify-center order-2 md:order-1 w-full md:w-1/3 transition-transform md:-translate-y-4">
          {podiumUsers[1] && (
             <div className="flex flex-col items-center group">
               <div className="relative mb-3">
                 {podiumUsers[1].image ? (
                   <img src={podiumUsers[1].image} alt={podiumUsers[1].name} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-[#94a3b8] dark:border-slate-600 object-cover md:transition-transform md:group-hover:scale-105" />
                 ) : (
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-[#94a3b8] dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center md:transition-transform md:group-hover:scale-105"><UserIcon className="text-slate-400 w-8 h-8 md:w-10 md:h-10"/></div>
                 )}
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-[#94a3b8] dark:bg-slate-600 text-white text-xs font-black rounded-full ring-3 ring-[#f8fafc] dark:ring-[#0f172a] shadow-sm tracking-tighter">2</div>
               </div>
               <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white mt-1 text-center line-clamp-2 max-w-[120px] md:max-w-[140px] break-words leading-tight">{podiumUsers[1].name || 'Speler'}</p>
               <p className="text-sm text-[#5b7dd9] font-semibold mt-0.5">{podiumUsers[1].totalPoints.toLocaleString('nl-NL')} XP</p>
             </div>
          )}
        </div>

        {/* 1st Place */}
        <div className="flex-1 flex justify-center order-1 md:order-2 w-full md:w-1/3 mb-2 md:mb-0">
          {podiumUsers[0] && (
             <div className="flex flex-col items-center group z-10">
               <div className="relative mb-4 flex flex-col items-center">
                 <Crown className="text-[#5b7dd9] w-10 h-10 md:w-12 md:h-12 absolute -top-9 md:-top-11 drop-shadow-sm animate-bounce slow" />   
                 {podiumUsers[0].image ? (
                   <img src={podiumUsers[0].image} alt={podiumUsers[0].name} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] md:border-[4px] border-[#5b7dd9] object-cover transition-transform group-hover:scale-105 shadow-md" />
                 ) : (
                   <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] md:border-[4px] border-[#5b7dd9] bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform group-hover:scale-105 shadow-md"><UserIcon className="text-slate-500 w-10 h-10 md:w-14 md:h-14"/></div>
                 )}
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#5b7dd9] text-white text-sm font-black rounded-full ring-3 ring-[#f8fafc] dark:ring-[#0f172a] shadow-md tracking-tighter">1</div>       
               </div>
               <p className="text-lg md:text-xl font-black mt-2 text-slate-900 dark:text-white text-center line-clamp-2 max-w-[140px] md:max-w-[160px] break-words leading-tight">{podiumUsers[0].name || 'Speler'}</p>
               <p className="text-base text-[#5b7dd9] font-bold mt-0.5">{podiumUsers[0].totalPoints.toLocaleString('nl-NL')} XP</p>
             </div>
          )}
        </div>

        {/* 3rd Place */}
        <div className="flex-1 flex justify-center order-3 md:order-3 w-full md:w-1/3 transition-transform md:-translate-y-6">
          {podiumUsers[2] && (
             <div className="flex flex-col items-center group">
               <div className="relative mb-3">
                 {podiumUsers[2].image ? (
                   <img src={podiumUsers[2].image} alt={podiumUsers[2].name} className="w-14 h-14 md:w-18 md:h-18 rounded-full border-[3px] border-[#cbd5e1] dark:border-slate-700 object-cover md:transition-transform md:group-hover:scale-105" />
                 ) : (
                   <div className="w-14 h-14 md:w-18 md:h-18 rounded-full border-[3px] border-[#cbd5e1] dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center md:transition-transform md:group-hover:scale-105"><UserIcon className="text-slate-400 w-7 h-7 md:w-9 md:h-9"/></div>
                 )}
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-[#cbd5e1] dark:bg-slate-700 text-slate-700 dark:text-white text-xs font-black rounded-full ring-3 ring-[#f8fafc] dark:ring-[#0f172a] shadow-sm tracking-tighter">3</div>
               </div>
               <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white mt-1 text-center line-clamp-2 max-w-[120px] md:max-w-[140px] break-words leading-tight">{podiumUsers[2].name || 'Speler'}</p>
               <p className="text-sm text-[#5b7dd9] font-semibold mt-0.5">{podiumUsers[2].totalPoints.toLocaleString('nl-NL')} XP</p>
             </div>
          )}
        </div>
      </div>

      {/* Flat List Component */}
      <div className="w-full bg-white dark:bg-slate-800/50 rounded-2xl shadow-md p-6 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4 px-4 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-12 w-full">
              <span className="w-10 text-center text-sm">Rang</span>
              <span className="flex-1 text-sm">Speler</span>
            </div>
            <span className="text-right w-24 text-sm">Punten</span>
          </div>

          {tableUsers.map((user, index) => {
             const rank = index + 4;
             const isMe = currentUserId === user._id;

             return (
               <div
                 key={user._id.toString()}
                 className={cn(
                   "flex items-center justify-between py-3 px-4 rounded-xl group md:transition-colors",
                   isMe 
                     ? "bg-[#5b7dd9]/10 text-slate-900 dark:text-white font-semibold border border-[#5b7dd9]/20" 
                     : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                 )}
               >
                 <div className="flex items-center gap-8 w-full">
                     <span className={cn(
                       "w-10 text-center font-bold text-lg md:text-xl", 
                       isMe ? "text-[#5b7dd9]" : "text-slate-400 dark:text-slate-500"
                     )}>
                       {rank}
                     </span>
                     
                     <div className="flex-1 flex items-center gap-4">
                         {user.image ? (
                             <img src={user.image} alt={user.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                         ) : (
                             <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><UserIcon className="text-slate-400 dark:text-slate-500 w-5 h-5 md:w-6 md:h-6"/></div>     
                         )}

                         <p className={cn("text-base md:text-lg flex flex-wrap items-center gap-3", isMe ? "font-bold" : "font-medium")}>
                           {user.name || 'Speler'}
                           {isMe && <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-[#5b7dd9] text-white px-2 py-0.5 rounded-md">Jij</span>}
                         </p>
                     </div>
                 </div>

                 <div className="w-24 text-right">
                   <p className={cn("text-base md:text-lg font-bold", isMe ? "text-[#5b7dd9]" : "text-slate-600 dark:text-slate-400")}>
                     {user.totalPoints.toLocaleString('nl-NL')}
                   </p>
                 </div>
               </div>
             );
          })}

          {tableUsers.length === 0 && podiumUsers.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500"> 
              <Trophy className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
              <p className="text-xl font-bold text-slate-500 dark:text-slate-400">Er is nog geen activiteit</p>
              <p className="text-base mt-2">Speel een quiz om de ranglijst te openen.</p>
            </div>
          )}

          {/* Current User Card if outside top 50 */}
          {showCurrentUserCard && currentUserData && (
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-3 text-center">Jouw Positie</p>
              <div className="flex items-center justify-between py-4 px-4 rounded-xl bg-gradient-to-r from-[#5b7dd9]/10 to-[#5b7dd9]/5 border-2 border-[#5b7dd9]/30">
                <div className="flex items-center gap-8 w-full">
                    <span className="w-10 text-center font-black text-xl text-[#5b7dd9]">
                      #{currentUserIndex + 1}
                    </span>
                    
                    <div className="flex-1 flex items-center gap-4">
                        {currentUserData.image ? (
                            <img src={currentUserData.image} alt={currentUserData.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-[#5b7dd9]/30" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-2 ring-[#5b7dd9]/30"><UserIcon className="text-slate-400 dark:text-slate-500 w-6 h-6"/></div>     
                        )}

                        <p className="text-lg font-bold flex flex-wrap items-center gap-3">
                          {currentUserData.name || 'Speler'}
                          <span className="text-xs font-bold uppercase tracking-wider bg-[#5b7dd9] text-white px-2 py-0.5 rounded-md">Jij</span>
                        </p>
                    </div>
                </div>

                <div className="w-24 text-right">
                  <p className="text-lg font-bold text-[#5b7dd9]">
                    {currentUserData.totalPoints.toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
    </div>
  );
}
