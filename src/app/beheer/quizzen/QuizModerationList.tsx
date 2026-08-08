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
            headers: { 'Content-Type':'application/json' },
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
        case 'approved': return'bg-positive-tint text-positive border-positive/35';
        case 'rejected': return'bg-vermilion-tint text-vermilion border-vermilion/35';
        case 'pending': return'bg-lapis-tint text-lapis border-lapis/35';
        default: return 'bg-paper-sunken text-ink-soft border-rule';
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-normal font-serif">Beheer Quizzen</h2>
            <Button variant="outline" size="sm" onClick={fetchQuizzes} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Verversen
            </Button>
        </div>

        <Tabs defaultValue="pending" value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-paper space-x-6">
                <TabsTrigger 
                    value="pending"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-lapis/35 data-[state=active]:text-lapis px-4 py-3"
                >
                    In afwachting
                </TabsTrigger>
                <TabsTrigger 
                    value="approved"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-positive/35 data-[state=active]:text-positive px-4 py-3"
                >
                    Goedgekeurd
                </TabsTrigger>
                <TabsTrigger 
                    value="rejected"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-vermilion/35 data-[state=active]:text-vermilion px-4 py-3"
                >
                    Afgewezen
                </TabsTrigger>
                <TabsTrigger 
                    value="draft"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-rule data-[state=active]:text-ink-soft px-4 py-3"
                >
                    Concepten
                </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
                {loading && <div className="text-center py-12 text-muted-foreground">Laden...</div>}
                
                {!loading && quizzes.length === 0 && (
                    <div className="text-center py-12 bg-paper-sunken border border-dashed rounded-lg text-ink-muted">
                        Geen quizzen gevonden in deze categorie.
                    </div>
                )}

                {!loading && quizzes.map(quiz => (
                    <Card key={quiz._id} className="overflow-hidden">
                        <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-normal text-lg">{quiz.title}</h3>
                                    <Badge variant="outline" className={getStatusColor(quiz.status)}>
                                        {quiz.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-ink-muted flex items-center gap-2">
                                    Door: <span className="font-medium">{quiz.createdBy?.name || 'Onbekend'}</span>
                                    â€¢ {quiz.questions?.length} vragen
                                    â€¢ {new Date(quiz.createdAt).toLocaleDateString('nl-NL')}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/quiz/${quiz._id}`} target="_blank">
                                        <Eye className="h-4 w-4 mr-2" /> Bekijken
                                    </Link>
                                </Button>
                                
                                <Button variant="ghost" size="sm" asChild className="text-lapis hover:text-lapis hover:bg-ink-soft-tint">
                                    <Link href={`/beheer/quizzen/${quiz._id}/bewerken`}>
                                        Bewerken
                                    </Link>
                                </Button>
                                
                                {filter === 'pending' && (
                                    <>
                                        <Button size="sm" className="bg-positive hover:bg-positive text-ink-inverted" onClick={() => updateStatus(quiz._id, 'approved')}>
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
                                
                                <Button size="icon" variant="ghost" className="text-ink-muted hover:text-vermilion" onClick={() => deleteQuiz(quiz._id)}>
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
