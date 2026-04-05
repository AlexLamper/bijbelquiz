'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Info, CheckCircle2, Circle, Settings2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

        const data = await res.json();
        
        if (data.status === 'approved') {
            toast.success("Quiz succesvol aangemaakt en gepubliceerd!");
        } else {
            toast.success("Quiz ingediend! Hij wordt beoordeeld door een moderator.");
        }

        router.push('/dashboard');
        router.refresh();

    } catch (error) {
        console.error(error);
        toast.error("Kon quiz niet opslaan. Probeer het later opnieuw.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
        {/* Section 1: Intro / Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-5 flex items-center gap-3">
               <div className="bg-[#152c31] text-white p-2 rounded-xl shadow-sm">
                 <Settings2 className="h-5 w-5" />
               </div>
               <div>
                 <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Algemene Informatie</h2>
                 <p className="text-sm text-slate-500">De basisdetails van je nieuwe quiz.</p>
               </div>
            </div>
            
            <div className="p-6 sm:px-8 sm:py-8 space-y-6">
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Titel van de quiz <span className="text-red-500">*</span></label>
                    <Input 
                        placeholder="Bijv. De wonderen van Jezus" 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        disabled={loading}
                        required
                        className="h-12 bg-slate-50/50 dark:bg-slate-950/50 focus-visible:ring-[#152c31]"
                    />
                </div>
                
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Beschrijving</label>
                    <Textarea 
                         placeholder="Korte omschrijving war deze quiz over gaat..."
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                         className="min-h-[100px] resize-y bg-slate-50/50 dark:bg-slate-950/50 focus-visible:ring-[#152c31]"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categorie <span className="text-red-500">*</span></label>
                        <Select 
                            value={formData.categoryId} 
                            onValueChange={(v) => setFormData({...formData, categoryId: v})}
                        >
                            <SelectTrigger className="h-12 bg-slate-50/50 dark:bg-slate-950/50">
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
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Moeilijkheidsgraad</label>
                         <Select 
                            value={formData.difficulty} 
                            onValueChange={(v) => setFormData({...formData, difficulty: v})}
                        >
                            <SelectTrigger className="h-12 bg-slate-50/50 dark:bg-slate-950/50">
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
            </div>
        </div>
        
        {/* Section 2: Questions */}
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#152c31] text-white p-2 rounded-xl shadow-sm">
                     <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Vragen ({questions.length})</h2>
                    <p className="text-sm text-slate-500">Voeg je vragen en bijbehorende antwoorden toe.</p>
                  </div>
                </div>
                
                <Button type="button" onClick={addQuestion} variant="outline" className="gap-2 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 text-[#152c31] dark:text-white hover:bg-slate-50 h-11 px-6 rounded-full font-medium">
                    <Plus className="h-4 w-4" /> Vraag Toevoegen
                </Button>
             </div>

             <div className="space-y-6">
               {questions.map((q, qIndex) => (
                   <div key={qIndex} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-1 relative shadow-sm group transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
                       {/* Q header block */}
                       <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-t-[20px] mb-4">
                          <span className="flex items-center gap-2 text-[#152c31] dark:text-white font-bold font-sans tracking-wide">
                            <span className="bg-[#152c31]/10 dark:bg-white/10 text-[#152c31] dark:text-slate-200 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                                {qIndex + 1}
                            </span>
                            Vraag {qIndex + 1}
                          </span>
                          
                          <Button 
                             type="button" 
                             variant="ghost" 
                             size="sm" 
                             className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                             onClick={() => removeQuestion(qIndex)}
                             disabled={questions.length === 1}
                          >
                             <Trash2 className="h-4 w-4 sm:mr-2" />
                             <span className="hidden sm:inline">Verwijderen</span>
                          </Button>
                       </div>

                       <div className="px-5 sm:px-8 pb-8 space-y-6">
                           <div className="grid gap-2">
                             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">De vraag <span className="text-red-500">*</span></label>
                             <Input 
                                 placeholder="Typ hier je vraag..."
                                 value={q.text}
                                 onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                 required
                                 className="h-12 text-base bg-white dark:bg-slate-950 focus-visible:ring-[#152c31]"
                             />
                           </div>
                           
                           <div className="space-y-4 pt-2">
                               <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                                 Antwoorden 
                                 <span className="text-xs font-normal text-slate-500">Selecteer het correcte antwoord</span>
                               </label>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {q.answers.map((ans, aIndex) => (
                                       <div 
                                          key={aIndex} 
                                          className={cn(
                                            "flex items-center gap-3 p-2 pr-4 rounded-xl border transition-all",
                                            ans.isCorrect 
                                              ? 'border-green-500 bg-green-50/50 dark:bg-green-500/10 dark:border-green-500/50 shadow-sm ring-1 ring-green-500 ring-offset-0' 
                                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
                                          )}
                                       >
                                           <button
                                               type="button"
                                               className={cn(
                                                 "flex-none w-10 h-10 flex items-center justify-center rounded-lg transition-colors focus:outline-none",
                                                 ans.isCorrect 
                                                    ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20' 
                                                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100'
                                               )}
                                               onClick={() => setCorrectAnswer(qIndex, aIndex)}
                                               title="Markeer als correct antwoord"
                                           >
                                               {ans.isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                           </button>
                                           <Input 
                                               placeholder={`Antwoord optie ${String.fromCharCode(65 + aIndex)}...`}
                                               value={ans.text}
                                               onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                                               className="border-0 bg-transparent shadow-none px-0 h-10 focus-visible:ring-0 text-base"
                                               required
                                           />
                                       </div>
                                   ))}
                               </div>
                           </div>

                           {/* Optional fields: Explanation & Bible Ref */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-6 mt-border">
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Extra: Uitleg tonen na antwoord</label>
                                   <Textarea 
                                       placeholder="Typ hier de uitleg (optioneel)" 
                                       value={q.explanation || ''}
                                       onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                       className="h-24 resize-y bg-slate-50/50 dark:bg-slate-950/50"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Extra: Bijbelverwijzing</label>
                                   <Input 
                                       placeholder="Bijv. Johannes 3:16" 
                                       value={q.bibleReference || ''}
                                       onChange={(e) => updateQuestion(qIndex, 'bibleReference', e.target.value)}
                                       className="h-12 bg-slate-50/50 dark:bg-slate-950/50"
                                   />
                                   <p className="text-xs text-slate-400 pt-1">Wordt gekoppeld aan de vraag voor betere studie context.</p>
                                </div>
                           </div>
                       </div>
                   </div>
               ))}
             </div>
        </div>

        {/* Submit Footer */}
        <div className="sticky bottom-6 z-20 mt-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
               Je quiz bevat {questions.length} {questions.length === 1 ? 'vraag' : 'vragen'}.
            </div>
            <Button 
                size="lg" 
                disabled={loading} 
                className="w-full sm:w-auto h-12 px-8 rounded-xl shadow-lg bg-[#152c31] text-white hover:bg-[#1a383e] transition-all font-semibold font-serif text-lg tracking-wide hover:-translate-y-0.5"
            >
                {loading ? <Info className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                Quiz Indienen
            </Button>
        </div>
    </form>
  );
}
