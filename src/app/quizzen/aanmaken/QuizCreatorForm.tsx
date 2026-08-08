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

    if (questions.length < 5) {
        toast.error("Een quiz moet minimaal 5 vragen hebben.");
        setLoading(false);
        return;
    }

    try {
        const res = await fetch('/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
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
        <div className="bg-paper-raised border border-rule rounded-[24px] overflow-hidden">
            <div className="bg-paper-sunken border-b border-rule px-6 sm:px-8 py-5 flex items-center gap-3">
               <div className="bg-ink text-ink-inverted p-2 rounded-lg">
                 <Settings2 className="h-5 w-5" />
               </div>
               <div>
                 <h2 className="text-xl font-normal font-serif text-ink dark:text-ink-inverted">Algemene Informatie</h2>
                 <p className="text-sm text-ink-muted">De basisdetails van je nieuwe quiz.</p>
               </div>
            </div>
            
            <div className="p-6 sm:px-8 sm:py-8 space-y-6">
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-ink-soft">Titel van de quiz <span className="text-vermilion">*</span></label>
                    <Input 
                        placeholder="Bijv. De wonderen van Jezus" 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        disabled={loading}
                        required
                        className="h-12 bg-paper-sunken/50 focus-visible:ring-lapis/35"
                    />
                </div>
                
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-ink-soft">Beschrijving</label>
                    <Textarea 
                         placeholder="Korte omschrijving waar deze quiz over gaat..."
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                         className="min-h-[100px] resize-y bg-paper-sunken/50 focus-visible:ring-lapis/35"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-ink-soft">Categorie <span className="text-vermilion">*</span></label>
                        <Select 
                            value={formData.categoryId} 
                            onValueChange={(v) => setFormData({...formData, categoryId: v})}
                        >
                            <SelectTrigger className="h-12 bg-paper-sunken/50">
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
                        <label className="text-sm font-semibold text-ink-soft">Moeilijkheidsgraad</label>
                         <Select 
                            value={formData.difficulty} 
                            onValueChange={(v) => setFormData({...formData, difficulty: v})}
                        >
                            <SelectTrigger className="h-12 bg-paper-sunken/50">
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
                  <div className="bg-ink text-ink-inverted p-2 rounded-lg">
                     <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal font-serif text-ink dark:text-ink-inverted">Vragen ({questions.length})</h2>
                    <p className="text-sm text-ink-muted">Voeg je vragen en bijbehorende antwoorden toe.</p>
                  </div>
                </div>
                
                <Button type="button" onClick={addQuestion} variant="outline" className="gap-2 bg-paper-raised border-rule text-ink dark:text-ink-inverted hover:bg-paper-sunken h-11 px-6 rounded-full font-medium">
                    <Plus className="h-4 w-4" /> Vraag Toevoegen
                </Button>
             </div>

             <div className="space-y-6">
               {questions.map((q, qIndex) => (
                   <div key={qIndex} className="bg-paper-raised border border-rule rounded-[24px] p-1 relative group transition-all duration-200 hover:border-rule">
                       {/* Q header block */}
                       <div className="flex items-center justify-between px-4 py-3 bg-paper-sunken/50 rounded-t-[20px] mb-4">
                          <span className="flex items-center gap-2 text-ink dark:text-ink-inverted font-semibold font-sans tracking-wide">
                            <span className="bg-ink/10 dark:bg-paper-raised/10 text-ink w-8 h-8 rounded-full flex items-center justify-center text-sm">
                                {qIndex + 1}
                            </span>
                            Vraag {qIndex + 1}
                          </span>
                          
                          <Button 
                             type="button" 
                             variant="ghost" 
                             size="sm" 
                             className="text-ink-muted hover:text-vermilion hover:bg-vermilion-tint dark:hover:bg-vermilion/30 h-8 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                             onClick={() => removeQuestion(qIndex)}
                             disabled={questions.length === 1}
                          >
                             <Trash2 className="h-4 w-4 sm:mr-2" />
                             <span className="hidden sm:inline">Verwijderen</span>
                          </Button>
                       </div>

                       <div className="px-5 sm:px-8 pb-8 space-y-6">
                           <div className="grid gap-2">
                             <label className="text-sm font-semibold text-ink-soft">De vraag <span className="text-vermilion">*</span></label>
                             <Input 
                                 placeholder="Typ hier je vraag..."
                                 value={q.text}
                                 onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                 required
                                 className="h-12 text-base bg-paper-raised focus-visible:ring-lapis/35"
                             />
                           </div>
                           
                           <div className="space-y-4 pt-2">
                               <label className="text-sm font-semibold text-ink-soft flex justify-between items-center">
                                 Antwoorden 
                                 <span className="text-xs font-normal text-ink-muted">Selecteer het correcte antwoord</span>
                               </label>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {q.answers.map((ans, aIndex) => (
                                       <div 
                                          key={aIndex} 
                                          className={cn(
                                            "flex items-center gap-3 p-2 pr-4 rounded-lg border transition-all",
                                            ans.isCorrect 
                                              ? 'border-positive/35 bg-positive-tint/50 dark:bg-positive/10 dark:border-positive/35  ring-1 ring-positive/35 ring-offset-0' 
                                              : 'border-rule  bg-paper-raised  hover:border-rule'
                                          )}
                                       >
                                           <button
                                               type="button"
                                               className={cn(
                                                 "flex-none w-10 h-10 flex items-center justify-center rounded-lg transition-colors focus:outline-none",
                                                 ans.isCorrect 
                                                    ? 'text-positive dark:text-positive bg-positive-tint dark:bg-positive/20' 
                                                    : 'text-ink-muted hover:bg-paper-sunken  focus:bg-paper-sunken'
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
                                               className="border-0 bg-paper shadow-none px-0 h-10 focus-visible:ring-0 text-base"
                                               required
                                           />
                                       </div>
                                   ))}
                               </div>
                           </div>

                           {/* Optional fields: Explanation & Bible Ref */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-rule mt-6 mt-border">
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Extra: Uitleg tonen na antwoord</label>
                                   <Textarea 
                                       placeholder="Typ hier de uitleg (optioneel)" 
                                       value={q.explanation || ''}
                                       onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                       className="h-24 resize-y bg-paper-sunken/50"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Extra: Bijbelverwijzing</label>
                                   <Input 
                                       placeholder="Bijv. Johannes 3:16" 
                                       value={q.bibleReference || ''}
                                       onChange={(e) => updateQuestion(qIndex, 'bibleReference', e.target.value)}
                                       className="h-12 bg-paper-sunken/50"
                                   />
                                   <p className="text-xs text-ink-muted pt-1">Wordt gekoppeld aan de vraag voor betere studie context.</p>
                                </div>
                           </div>
                       </div>
                   </div>
               ))}
             </div>
        </div>

        {/* Submit Footer */}
        <div className="sticky bottom-6 z-20 mt-12 bg-paper-raised/80 backdrop-blur-xl border border-rule p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-ink-soft">
               Je quiz bevat {questions.length} {questions.length === 1 ? 'vraag' : 'vragen'} (minimaal 5 vereist).
            </div>
            <Button 
                size="lg" 
                disabled={loading} 
                className="w-full sm:w-auto h-12 px-8 rounded-lg bg-ink text-ink-inverted hover:bg-ink-soft transition-all font-semibold font-serif text-lg tracking-wide hover:-translate-y-0.5"
            >
                {loading ? <Info className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                Quiz Indienen
            </Button>
        </div>
    </form>
  );
}
