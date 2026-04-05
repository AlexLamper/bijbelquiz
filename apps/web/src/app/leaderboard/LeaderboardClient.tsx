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
  const tableUsers = filteredData.slice(3, 100);

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header Statement */}
      <div className="text-center mb-16 w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Ranglijst</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Top spelers van deze week. Speel quizzen om XP te verdienen en klim naar de top!
        </p>
      </div>

      {/* Podium Section - Completely flat without card background */}
      <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-4 lg:gap-8 w-full mb-16 px-4 max-w-3xl mx-auto">
        {/* 2nd Place */}
        <div className="flex-1 flex justify-center order-2 md:order-1 w-full md:w-1/3 transition-transform md:-translate-y-8">
          {podiumUsers[1] && (
             <div className="flex flex-col items-center group">
               <div className="relative mb-4">
                 {podiumUsers[1].image ? (
                   <img src={podiumUsers[1].image} alt={podiumUsers[1].name} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] md:border-[4px] border-slate-300 dark:border-slate-600 object-cover md:transition-transform md:group-hover:scale-105" />
                 ) : (
                   <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] md:border-[4px] border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center md:transition-transform md:group-hover:scale-105"><UserIcon className="text-slate-400 w-10 h-10 md:w-14 md:h-14"/></div>
                 )}
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-black rounded-full ring-4 ring-[#f8fafc] dark:ring-[#0f172a] shadow-sm tracking-tighter">2</div>
               </div>
               <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-2 text-center line-clamp-2 max-w-[140px] md:max-w-[180px] break-words leading-tight">{podiumUsers[1].name || 'Speler'}</p>
               <p className="text-sm md:text-base text-[#C5A059] font-semibold mt-1">{podiumUsers[1].totalPoints.toLocaleString('nl-NL')} XP</p>
             </div>
          )}
        </div>

        {/* 1st Place */}
        <div className="flex-1 flex justify-center order-1 md:order-2 w-full md:w-1/3 mb-4 md:mb-0">
          {podiumUsers[0] && (
             <div className="flex flex-col items-center group z-10">
               <div className="relative mb-5 flex flex-col items-center">
                 <Crown className="text-[#C5A059] w-14 h-14 md:w-16 md:h-16 absolute -top-12 md:-top-14 drop-shadow-sm animate-bounce slow" />   
                 {podiumUsers[0].image ? (
                   <img src={podiumUsers[0].image} alt={podiumUsers[0].name} className="w-28 h-28 md:w-40 md:h-40 rounded-full border-[4px] md:border-[6px] border-[#C5A059] object-cover transition-transform group-hover:scale-105 shadow-md" />
                 ) : (
                   <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-[4px] md:border-[6px] border-[#C5A059] bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform group-hover:scale-105 shadow-md"><UserIcon className="text-slate-500 w-14 h-14 md:w-20 md:h-20"/></div>
                 )}
                 <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-[#C5A059] text-white text-sm md:text-base font-black rounded-full ring-4 ring-[#f8fafc] dark:ring-[#0f172a] shadow-md tracking-tighter">1</div>       
               </div>
               <p className="text-xl md:text-2xl font-black mt-3 text-slate-900 dark:text-white text-center line-clamp-2 max-w-[160px] md:max-w-[200px] break-words leading-tight">{podiumUsers[0].name || 'Speler'}</p>
               <p className="text-base md:text-lg text-[#C5A059] font-bold mt-1">{podiumUsers[0].totalPoints.toLocaleString('nl-NL')} XP</p>
             </div>
          )}
        </div>

        {/* 3rd Place */}
        <div className="flex-1 flex justify-center order-3 md:order-3 w-full md:w-1/3 transition-transform md:-translate-y-10">
          {podiumUsers[2] && (
             <div className="flex flex-col items-center group">
               <div className="relative mb-4">
                 {podiumUsers[2].image ? (
                   <img src={podiumUsers[2].image} alt={podiumUsers[2].name} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] md:border-[4px] border-amber-600/80 object-cover md:transition-transform md:group-hover:scale-105" />
                 ) : (
                   <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] md:border-[4px] border-amber-600/80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center md:transition-transform md:group-hover:scale-105"><UserIcon className="text-slate-400 w-10 h-10 md:w-12 md:h-12"/></div>
                 )}
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-amber-600/80 text-white text-xs md:text-sm font-black rounded-full ring-4 ring-[#f8fafc] dark:ring-[#0f172a] shadow-sm tracking-tighter">3</div>
               </div>
               <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-2 text-center line-clamp-2 max-w-[140px] md:max-w-[180px] break-words leading-tight">{podiumUsers[2].name || 'Speler'}</p>
               <p className="text-sm md:text-base text-[#C5A059] font-semibold mt-1">{podiumUsers[2].totalPoints.toLocaleString('nl-NL')} XP</p>
             </div>
          )}
        </div>
      </div>

      {/* Flat List Component */}
      <div className="w-full space-y-1 pb-24">
          <div className="flex items-center justify-between mb-4 px-4 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-12 w-full">
              <span className="w-10 text-center">Positie</span>
              <span className="flex-1">Speler</span>
            </div>
            <span className="text-right w-24">XP</span>
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
                     ? "bg-[#C5A059]/10 text-slate-900 dark:text-white font-semibold" 
                     : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                 )}
               >
                 <div className="flex items-center gap-8 w-full">
                     <span className={cn(
                       "w-10 text-center font-bold text-lg md:text-xl", 
                       isMe ? "text-[#C5A059]" : "text-slate-400 dark:text-slate-500"
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
                           {isMe && <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-[#C5A059] text-white px-2 py-0.5 rounded-md">Jij</span>}
                         </p>
                     </div>
                 </div>

                 <div className="w-24 text-right">
                   <p className={cn("text-base md:text-lg font-bold", isMe ? "text-[#C5A059]" : "text-slate-600 dark:text-slate-400")}>
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
      </div>
    </div>
  );
}
