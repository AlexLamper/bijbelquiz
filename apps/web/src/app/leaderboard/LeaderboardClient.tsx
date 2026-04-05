'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry, CategoryOption } from './page';
import { Trophy, Crown, ArrowRight, User as UserIcon } from 'lucide-react';

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

  const PRIMARY_DARK = '#121A2A';
  const ACCENT_GOLD = '#C5A059';

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[852px] md:min-h-[600px] bg-slate-50 flex flex-col md:flex-row shadow-2xl rounded-[40px] md:rounded-2xl overflow-hidden mt-4 md:mt-8 mb-16 border-[8px] md:border border-slate-900 md:border-slate-200">
      {/* Sidebar / Top area */}
      <div
        className="pt-14 pb-8 px-6 md:p-8 md:w-80 text-white shrink-0 flex flex-col justify-start relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${PRIMARY_DARK} 0%, #1e293b 100%)` }}
      >
        <div className="hidden md:block absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
        <h1 className="text-xl md:text-3xl font-extrabold text-center md:text-left text-white md:text-[#C5A059] mb-10 md:mb-2 md:tracking-tight">Ranglijst</h1>
        <p className="hidden md:block text-slate-400 mb-8 font-medium">Top spelers van deze week</p>

        <div className="flex justify-center items-end gap-4 md:flex-col md:items-center md:gap-8 md:mt-4">
          {/* 1st Place (Desktop First) */}
          <div className="hidden md:flex w-full justify-center md:order-1">
            {podiumUsers[0] && (
               <div className="flex flex-col items-center group">
                 <div className="relative mb-3 flex flex-col items-center">
                   <Crown className="text-[#C5A059] w-12 h-12 absolute -top-10 drop-shadow-md animate-bounce slow" />   
                   {podiumUsers[0].image ? (
                     <img src={podiumUsers[0].image} className="w-28 h-28 rounded-full border-4 border-[#C5A059] shadow-xl object-cover transition-transform group-hover:scale-105" />
                   ) : (
                     <div className="w-28 h-28 rounded-full border-4 border-[#C5A059] bg-slate-800 shadow-xl flex items-center justify-center transition-transform group-hover:scale-105"><UserIcon className="text-slate-500 w-12 h-12"/></div>
                   )}
                   <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#C5A059] text-white text-sm font-black px-4 py-1 rounded-full shadow-lg ring-4 ring-[#121A2A]">1</div>       
                 </div>
                 <p className="text-lg font-bold mt-2 text-white">{podiumUsers[0].name || 'Speler'}</p>
                 <p className="text-sm text-[#C5A059] font-medium">{podiumUsers[0].totalPoints.toLocaleString('nl-NL')} XP</p>
               </div>
            )}
          </div>

          <div className="flex gap-4 md:gap-6 md:w-full md:justify-center md:order-2">
            {/* 2nd Place */}
            {podiumUsers[1] && (
               <div className="flex flex-col items-center group">
                 <div className="relative mb-3">
                   {podiumUsers[1].image ? (
                     <img src={podiumUsers[1].image} className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-slate-400 object-cover md:transition-transform md:group-hover:scale-105" />
                   ) : (
                     <div className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-slate-400 bg-slate-800 flex items-center justify-center md:transition-transform md:group-hover:scale-105"><UserIcon className="text-slate-500 w-6 h-6 md:w-8 md:h-8"/></div>
                   )}
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 md:text-slate-900 text-white md:font-black text-[10px] md:text-xs font-bold px-2 py-0 md:px-3 md:py-0.5 rounded-full md:ring-4 md:ring-[#121A2A]">2</div>
                 </div>
                 <p className="text-xs md:text-sm font-bold md:text-slate-200 mt-0 md:mt-1">{podiumUsers[1].name || 'Speler'}</p>
                 <p className="text-[10px] md:text-xs opacity-70 md:opacity-100 md:text-slate-400 md:font-medium">{podiumUsers[1].totalPoints.toLocaleString('nl-NL')} XP</p>
               </div>
            )}

            {/* 1st Place (Mobile middle) */}
            <div className="md:hidden">
              {podiumUsers[0] && (
                 <div className="flex flex-col items-center group">
                   <div className="relative mb-3 w-20 flex flex-col items-center">
                     <Crown className="text-[#C5A059] w-8 h-8 absolute -top-8" />   
                     {podiumUsers[0].image ? (
                       <img src={podiumUsers[0].image} className="w-20 h-20 rounded-full border-4 border-[#C5A059] shadow-xl object-cover" />
                     ) : (
                       <div className="w-20 h-20 rounded-full border-4 border-[#C5A059] bg-slate-800 shadow-xl flex items-center justify-center"><UserIcon className="text-slate-500 w-10 h-10"/></div>
                     )}
                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#C5A059] text-white text-xs font-bold px-3 py-0.5 rounded-full">1</div>       
                   </div>
                   <p className="text-sm font-bold mt-1 text-white">{podiumUsers[0].name || 'Speler'}</p>
                   <p className="text-xs opacity-70">{podiumUsers[0].totalPoints.toLocaleString('nl-NL')} XP</p>
                 </div>
              )}
            </div>

            {/* 3rd Place */}
            {podiumUsers[2] && (
               <div className="flex flex-col items-center group">
                 <div className="relative mb-3">
                   {podiumUsers[2].image ? (
                     <img src={podiumUsers[2].image} className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-amber-700 object-cover md:transition-transform md:group-hover:scale-105" />
                   ) : (
                     <div className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 md:border-4 border-amber-700 bg-slate-800 flex items-center justify-center md:transition-transform md:group-hover:scale-105"><UserIcon className="text-slate-500 w-6 h-6 md:w-8 md:h-8"/></div>
                   )}
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[10px] md:text-xs font-bold md:font-black px-2 py-0 md:px-3 md:py-0.5 rounded-full md:ring-4 md:ring-[#121A2A]">3</div>
                 </div>
                 <p className="text-xs md:text-sm font-bold md:text-slate-200 mt-0 md:mt-1">{podiumUsers[2].name || 'Speler'}</p>
                 <p className="text-[10px] md:text-xs opacity-70 md:opacity-100 md:text-slate-400 md:font-medium">{podiumUsers[2].totalPoints.toLocaleString('nl-NL')} XP</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 md:px-4 md:py-8 md:p-8 space-y-3 bg-slate-50 relative pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto space-y-3">
            {tableUsers.map((user, index) => {
               const rank = index + 4;
               const isMe = currentUserId === user._id;

               return (
                 <div
                   key={user._id.toString()}
                   className={cn(
                     "bg-white p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-4 shadow-sm md:hover:shadow-md md:transition-shadow group cursor-default",
                     isMe ? "border-2 md:border-2 border-[#C5A059] ring-2 md:ring-4 ring-[#C5A059] md:ring-[#C5A059]/10 ring-inset md:ring-offset-0" : "border md:border border-gray-100 md:border-slate-100"
                   )}
                 >
                   <span className={cn("w-6 md:w-8 text-left md:text-center font-bold text-base md:text-lg", isMe ? "text-[#121A2A] md:text-[#C5A059]" : "text-gray-400 md:text-slate-400")}>{rank}</span>

                   {user.image ? (
                       <img src={user.image} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover md:ring-2 md:ring-slate-100 md:group-hover:ring-[#C5A059]/30 md:transition-all" />
                   ) : (
                       <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 md:bg-slate-100 flex items-center justify-center md:group-hover:bg-slate-200 md:transition-colors"><UserIcon className="text-gray-400 md:text-slate-400 w-5 h-5 md:w-6 md:h-6"/></div>     
                   )}

                   <div className="flex-1 md:ml-2">
                     <p className={cn("text-sm md:text-base font-bold", isMe ? "text-[#121A2A]" : "text-slate-800")}>
                       {user.name || 'Speler'}{isMe ? ' (Jij)' : ''}
                     </p>
                     <div className="flex flex-col md:flex-row md:items-center mt-0 md:mt-0.5">
                       <span className="hidden md:inline-block w-2.5 h-2.5 rounded-full bg-[#C5A059] mr-2"></span>
                       <p className="text-[10px] md:text-xs text-gray-400 md:text-slate-500 font-normal md:font-medium md:tracking-wide">{user.totalPoints.toLocaleString('nl-NL')} XP</p>
                     </div>
                   </div>
                   
                   <ArrowRight className="md:hidden text-gray-200 w-5 h-5" />
                 </div>
               );
            })}

            {tableUsers.length === 0 && (
              <div className="py-10 md:py-20 flex flex-col items-center justify-center text-gray-400 md:text-slate-400 text-sm md:text-center bg-transparent md:bg-white md:rounded-3xl md:border md:border-slate-100 md:shadow-sm font-medium"> 
                <Trophy className="hidden md:block w-16 h-16 mb-4 text-slate-200" />
                <p className="hidden md:block text-lg font-semibold text-slate-600">Geen verdere spelers</p>
                <p className="text-sm mt-1">Geen spelers voor deze periode.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
