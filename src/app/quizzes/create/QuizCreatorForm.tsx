'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Save, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  _id: string;
  title: string;
}

interface Question {
  text: string;
  answers: { text: string; isCorrect: boolean }[];
  explanation?: string;
  bibleReference?: string;
}

export default function QuizCreatorForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    difficulty: 'medium',
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      text: '',
      answers: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      explanation: '',
      bibleReference: '',
    }
  ]);

  const addQuestion = () => {
     setQuestions([
        ...questions,
        {
          text: '',
          answers: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
          explanation: '',
          bibleReference: '',
        }
     ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
        setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: Exclude<keyof Question, 'answers'>, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (qIndex: number, aIndex: number, text: string) => {
     const updated = [...questions];
     updated[qIndex].answers[aIndex].text = text;
     setQuestions(updated);
  };

  const setCorrectAnswer = (qIndex: number, aIndex: number) => {
    const updated = [...questions];
    updated[qIndex].answers.forEach((a, i) => a.isCorrect = i === aIndex);
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!formData.title || !formData.categoryId) {
        toast.error("Vul alle verplichte velden in.");
        setLoading(false);
        return;
    }

    try {
        const res = await fetch('/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                questions
            })
        });

        if (!res.ok) throw new Error("Er ging iets mis");

        await res.json();
        
        toast.success("Quiz succesvol aangemaakt en gepubliceerd!");
        router.push('/admin/quizzes');
        router.refresh();

    } catch (error) {
        console.error(error);
        toast.error("Kon quiz niet opslaan. Probeer het later opnieuw.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Algemene Informatie</CardTitle>
                <CardDescription>De basisdetails van je quiz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Titel *</label>
                    <Input 
                        placeholder="Bijv. De wonderen van Jezus" 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                         type="text"
                                                disabled={loading}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Beschrijving</label>
                    <Textarea 
                         placeholder="Korte omschrijving war deze quiz over gaat..."
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Categorie *</label>
                        <Select 
                            value={formData.categoryId} 
                            onValueChange={(v) => setFormData({...formData, categoryId: v})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kies een categorie" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat._id} value={cat._id}>{cat.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Moeilijkheidsgraad</label>
                         <Select 
                            value={formData.difficulty} 
                            onValueChange={(v) => setFormData({...formData, difficulty: v})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Makkelijk</SelectItem>
                                <SelectItem value="medium">Gemiddeld</SelectItem>
                                <SelectItem value="hard">Moeilijk</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold">Vragen ({questions.length})</h2>
                <Button type="button" onClick={addQuestion} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Vraag Toevoegen
                </Button>
             </div>

             {questions.map((q, qIndex) => (
                 <Card key={qIndex} className="relative">
                     <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={questions.length === 1}
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                     <CardContent className="pt-6 space-y-4">
                        <div className="flex gap-4">
                            <span className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-sm">
                                {qIndex + 1}
                            </span>
                            <div className="flex-1 space-y-4">
                                <Input 
                                    placeholder="Vraag tekst..."
                                    value={q.text}
                                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                    required
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.answers.map((ans, aIndex) => (
                                        <div key={aIndex} className="flex gap-2">
                                            <div 
                                                className={`flex-none w-10 flex items-center justify-center cursor-pointer rounded border ${ans.isCorrect ? 'bg-green-100 border-green-300 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                                onClick={() => setCorrectAnswer(qIndex, aIndex)}
                                                title="Klik om als correct antwoord in te stellen"
                                            >
                                                {String.fromCharCode(65 + aIndex)}
                                            </div>
                                            <Input 
                                                placeholder={`Antwoord ${String.fromCharCode(65 + aIndex)}`}
                                                value={ans.text}
                                                onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                                                className={ans.isCorrect ? 'border-green-300 ring-green-100' : ''}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                     <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Uitleg (optioneel)</label>
                                        <Textarea 
                                            placeholder="Wordt getoond na beantwoorden..." 
                                            value={q.explanation || ''}
                                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                            className="h-20"
                                        />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Bijbelverwijzing (optioneel)</label>
                                        <Input 
                                            placeholder="Bijv. Johannes 3:16" 
                                            value={q.bibleReference || ''}
                                            onChange={(e) => updateQuestion(qIndex, 'bibleReference', e.target.value)}
                                        />
                                     </div>
                                </div>
                            </div>
                        </div>
                     </CardContent>
                 </Card>
             ))}
        </div>

        <div className="sticky bottom-4 flex justify-end">
            <Button size="lg" disabled={loading} className="shadow-lg bg-[#152c31] text-white hover:bg-[#1f3e44]">
                {loading ? <Info className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Quiz Indienen
            </Button>
        </div>
    </form>
  );
}
