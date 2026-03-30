'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Medal, Star, User as UserIcon, Crown, 
  Flame, Target, TrendingUp, Search,
  Calendar, Filter, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry, CategoryOption } from './page';

interface LeaderboardClientProps {
  initialData: LeaderboardEntry[];
  categories: CategoryOption[];
  initialTimeFilter: string;
  initialCategorySlug: string;
}

export default function LeaderboardClient({
  initialData,
  categories,
  initialTimeFilter,
  initialCategorySlug,
}: LeaderboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState(initialTimeFilter);
  const [categoryFilter, setCategoryFilter] = useState(initialCategorySlug);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return initialData;
    const query = searchQuery.toLowerCase();
    return initialData.filter(user => 
      (user.name || 'Anonieme Speler').toLowerCase().includes(query)
    );
  }, [initialData, searchQuery]);

  // Top 3 for podium
  const podiumUsers = filteredData.slice(0, 3);
  const tableUsers = filteredData.slice(3);

  // Update URL when filters change
  const updateFilters = (newTime?: string, newCategory?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newTime !== undefined) {
      if (newTime === 'all') params.delete('time');
      else params.set('time', newTime);
      setTimeFilter(newTime);
    }
    
    if (newCategory !== undefined) {
      if (newCategory === 'all') params.delete('category');
      else params.set('category', newCategory);
      setCategoryFilter(newCategory);
    }
    
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '/leaderboard', { scroll: false });
    router.refresh();
  };

  return (
    <>
      {/* Filters Section */}
      <Card className="border-border/50 shadow-sm mb-6 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek speler..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            {/* Time Filter */}
            <Tabs 
              value={timeFilter} 
              onValueChange={(val) => updateFilters(val, undefined)}
              className="w-full md:w-auto"
            >
              <TabsList className="w-full md:w-auto grid grid-cols-3 bg-muted/50">
                <TabsTrigger value="all" className="text-xs md:text-sm">
                  <Award className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Altijd
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs md:text-sm">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Maand
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs md:text-sm">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Week
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(val) => updateFilters(undefined, val)}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-background/50">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat.slug}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Podium - Top 3 */}
      {podiumUsers.length > 0 && !searchQuery && (
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 md:gap-6 h-[280px] md:h-[320px]">
            {/* Second Place */}
            {podiumUsers[1] && (
              <PodiumCard user={podiumUsers[1]} rank={2} />
            )}
            
            {/* First Place */}
            {podiumUsers[0] && (
              <PodiumCard user={podiumUsers[0]} rank={1} />
            )}
            
            {/* Third Place */}
            {podiumUsers[2] && (
              <PodiumCard user={podiumUsers[2]} rank={3} />
            )}
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-500" />
                {searchQuery ? 'Zoekresultaten' : `Top ${filteredData.length} Spelers`}
              </CardTitle>
              <CardDescription>
                {timeFilter === 'week' && 'Scores van de afgelopen 7 dagen'}
                {timeFilter === 'month' && 'Scores van de afgelopen 30 dagen'}
                {timeFilter === 'all' && 'Alle scores ooit behaald'}
                {categoryFilter !== 'all' && ` • ${categories.find(c => c.slug === categoryFilter)?.title}`}
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border/50 self-start">
              Punten = Som van beste scores
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Geen spelers gevonden</p>
              <p className="text-sm mt-1">
                {searchQuery 
                  ? 'Probeer een andere zoekterm' 
                  : 'Nog geen scores geregistreerd voor deze periode'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 dark:text-slate-400 font-medium border-b border-border/50 bg-muted/20">
                  <tr>
                    <th className="px-4 md:px-6 py-4 w-16 text-center">#</th>
                    <th className="px-4 md:px-6 py-4">Speler</th>
                    <th className="px-4 md:px-6 py-4 text-center hidden md:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" /> Quizzen
                      </span>
                    </th>
                    <th className="px-4 md:px-6 py-4 text-center hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" /> Gem.
                      </span>
                    </th>
                    <th className="px-4 md:px-6 py-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" /> Streak
                      </span>
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right">Punten</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(searchQuery ? filteredData : tableUsers).map((user, index) => {
                    const rank = searchQuery 
                      ? initialData.findIndex(u => u._id === user._id) + 1 
                      : index + 4;
                    
                    return (
                      <LeaderboardRow 
                        key={user._id.toString()} 
                        user={user} 
                        rank={rank}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Footer Note */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          Geen punten zichtbaar? Zorg dat je bent ingelogd tijdens het spelen van quizzen.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Ranglijst wordt automatisch bijgewerkt na elke quiz
        </p>
      </div>
    </>
  );
}

// Podium Card Component
function PodiumCard({ user, rank }: { user: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const config = {
    1: {
      height: 'h-[260px] md:h-[300px]',
      podiumHeight: 'h-24 md:h-28',
      avatarSize: 'h-20 w-20 md:h-24 md:w-24',
      gradient: 'from-amber-400 via-yellow-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30',
      borderColor: 'border-amber-300 dark:border-amber-700',
      icon: <Crown className="h-8 w-8 text-amber-500 fill-amber-400 drop-shadow-lg" />,
      label: '1e Plaats',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    2: {
      height: 'h-[220px] md:h-[260px]',
      podiumHeight: 'h-16 md:h-20',
      avatarSize: 'h-16 w-16 md:h-20 md:w-20',
      gradient: 'from-slate-300 via-slate-400 to-slate-500',
      bgGradient: 'from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/30',
      borderColor: 'border-slate-300 dark:border-slate-700',
      icon: <Medal className="h-6 w-6 text-slate-400 fill-slate-300" />,
      label: '2e Plaats',
      textColor: 'text-slate-600 dark:text-slate-400',
    },
    3: {
      height: 'h-[200px] md:h-[240px]',
      podiumHeight: 'h-12 md:h-16',
      avatarSize: 'h-14 w-14 md:h-[72px] md:w-[72px]',
      gradient: 'from-amber-600 via-amber-700 to-amber-800',
      bgGradient: 'from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30',
      borderColor: 'border-amber-600 dark:border-amber-800',
      icon: <Medal className="h-6 w-6 text-amber-700 fill-amber-600" />,
      label: '3e Plaats',
      textColor: 'text-amber-700 dark:text-amber-500',
    },
  }[rank];

  return (
    <div className={cn('flex flex-col items-center justify-end', config.height)}>
      {/* Avatar & Medal */}
      <div className="relative mb-2">
        <div className={cn(
          'rounded-full bg-gradient-to-br p-1',
          config.gradient
        )}>
          <div className={cn(
            'rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden',
            config.avatarSize
          )}>
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name || 'Speler'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-1/2 w-1/2 text-slate-400" />
            )}
          </div>
        </div>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          {config.icon}
        </div>
        {user.recentActivity && (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-900" 
               title="Recent actief" />
        )}
      </div>

      {/* Name & Stats */}
      <div className="text-center mb-2 max-w-[120px] md:max-w-[140px]">
        <div className="font-semibold text-sm md:text-base truncate flex items-center justify-center gap-1">
          {user.name || 'Anoniem'}
          {user.isPremium && (
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          )}
        </div>
        <div className={cn('text-2xl md:text-3xl font-bold font-serif', config.textColor)}>
          {user.totalPoints.toLocaleString('nl-NL')}
        </div>
        <div className="text-xs text-muted-foreground">punten</div>
      </div>

      {/* Podium Base */}
      <div className={cn(
        'w-24 md:w-32 rounded-t-lg bg-gradient-to-t flex items-center justify-center border-t-4',
        config.podiumHeight,
        config.bgGradient,
        config.borderColor
      )}>
        <span className={cn('text-3xl md:text-4xl font-bold opacity-30', config.textColor)}>
          {rank}
        </span>
      </div>
    </div>
  );
}

// Leaderboard Row Component
function LeaderboardRow({ user, rank }: { user: LeaderboardEntry; rank: number }) {
  const isTop10 = rank <= 10;
  
  return (
    <tr className={cn(
      'transition-all duration-200',
      'hover:bg-slate-50/80 dark:hover:bg-slate-800/50',
      isTop10 && 'bg-muted/20'
    )}>
      <td className="px-4 md:px-6 py-4 text-center">
        <span className={cn(
          'inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-semibold',
          isTop10 
            ? 'bg-primary/10 text-primary' 
            : 'text-muted-foreground'
        )}>
          {rank}
        </span>
      </td>
      <td className="px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center overflow-hidden border-2',
              user.isPremium 
                ? 'border-amber-400 dark:border-amber-600' 
                : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
            )}>
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || 'Speler'} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5 text-slate-400" />
              )}
            </div>
            {user.recentActivity && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-card" 
                   title="Recent actief" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground flex items-center gap-2 truncate">
              {user.name || "Anonieme Speler"}
              {user.isPremium && (
                <Badge variant="secondary" className="h-5 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 flex-shrink-0">
                  <Star className="h-3 w-3 fill-current mr-0.5" />
                  PRO
                </Badge>
              )}
            </span>
            <span className="text-xs text-muted-foreground md:hidden">
              {user.quizzesPlayed} quizzen • {user.avgScore}%
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 md:px-6 py-4 text-center hidden md:table-cell">
        <span className="text-slate-600 dark:text-slate-400">{user.quizzesPlayed}</span>
      </td>
      <td className="px-4 md:px-6 py-4 text-center hidden lg:table-cell">
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          user.avgScore >= 80 && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          user.avgScore >= 60 && user.avgScore < 80 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          user.avgScore < 60 && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        )}>
          {user.avgScore}%
        </span>
      </td>
      <td className="px-4 md:px-6 py-4 text-center hidden sm:table-cell">
        {user.streak > 0 ? (
          <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4" />
            <span className="font-medium">{user.streak}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 md:px-6 py-4 text-right">
        <span className="font-bold font-serif text-lg text-[#152c31] dark:text-white">
          {user.totalPoints.toLocaleString('nl-NL')}
        </span>
      </td>
    </tr>
  );
}
