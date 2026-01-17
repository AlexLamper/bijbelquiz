'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Trash2, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Question {
  _id: string;
  text: string;
  [key: string]: unknown;
}

interface Quiz {
  _id: string;
  title: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy?: { name: string; email: string };
  category: { title: string };
  questions: Question[];
  createdAt: string;
}

export default function QuizModerationList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch {
      toast.error("Fout bij laden quizzen");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const updateStatus = async (id: string, status: string) => {
    try {
        const res = await fetch(`/api/admin/quizzes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (res.ok) {
            toast.success(`Quiz status gewijzigd naar ${status}`);
            fetchQuizzes();
        } else {
            toast.error("Kon status niet wijzigen");
        }
    } catch {
        toast.error("Er ging iets mis");
    }
  };

  const deleteQuiz = async (id: string) => {
    if(!confirm("Weet je zeker dat je deze quiz wilt verwijderen?")) return;

    try {
        const res = await fetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success("Quiz verwijderd");
            fetchQuizzes();
        }
    } catch {
        toast.error("Kon quiz niet verwijderen");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'approved': return 'bg-green-100 text-green-700 border-green-200';
        case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
        case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-serif">Beheer Quizzen</h2>
            <Button variant="outline" size="sm" onClick={fetchQuizzes} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Verversen
            </Button>
        </div>

        <Tabs defaultValue="pending" value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
                <TabsTrigger 
                    value="pending"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-700 px-4 py-3"
                >
                    In afwachting
                </TabsTrigger>
                <TabsTrigger 
                    value="approved"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-700 px-4 py-3"
                >
                    Goedgekeurd
                </TabsTrigger>
                <TabsTrigger 
                    value="rejected"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-700 px-4 py-3"
                >
                    Afgewezen
                </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
                {loading && <div className="text-center py-12 text-muted-foreground">Laden...</div>}
                
                {!loading && quizzes.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border border-dashed rounded-lg text-slate-500">
                        Geen quizzen gevonden in deze categorie.
                    </div>
                )}

                {!loading && quizzes.map(quiz => (
                    <Card key={quiz._id} className="overflow-hidden">
                        <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">{quiz.title}</h3>
                                    <Badge variant="outline" className={getStatusColor(quiz.status)}>
                                        {quiz.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    Door: <span className="font-medium">{quiz.createdBy?.name || 'Onbekend'}</span>
                                    • {quiz.questions?.length} vragen
                                    • {new Date(quiz.createdAt).toLocaleDateString('nl-NL')}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/quiz/${quiz._id}`} target="_blank">
                                        <Eye className="h-4 w-4 mr-2" /> Bekijken
                                    </Link>
                                </Button>
                                
                                {filter === 'pending' && (
                                    <>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(quiz._id, 'approved')}>
                                            <Check className="h-4 w-4 mr-1" />
                                            Goedkeuren
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => updateStatus(quiz._id, 'rejected')}>
                                            <X className="h-4 w-4 mr-1" />
                                            Afwijzen
                                        </Button>
                                    </>
                                )}

                                {filter !== 'pending' && (
                                     <Button size="sm" variant="outline" onClick={() => updateStatus(quiz._id, 'pending')}>
                                        Naar Pending
                                    </Button>
                                )}
                                
                                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-red-500" onClick={() => deleteQuiz(quiz._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </Tabs>
    </div>
  );
}
