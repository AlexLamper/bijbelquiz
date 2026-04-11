"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, ArrowLeft, Upload, FileJson } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const answerSchema = z.object({
  text: z.string().min(1, "Antwoord is verplicht"),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
  text: z.string().min(5, "Vraag is te kort"),
  explanation: z.string().optional(),
  bibleReference: z.string().optional(),
  answers: z.array(answerSchema).min(2, "Een vraag moet minstens 2 antwoorden hebben"),
});

const quizSchema = z.object({
  title: z.string().min(3, "Titel moet minimaal 3 karakters bevatten"),
  description: z.string().min(10, "Beschrijving moet minimaal 10 karakters bevatten"),
  slug: z.string().min(3, "Slug is verplicht"),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1, "Categorie is verplicht"),
  rewardXp: z.coerce.number().min(0).default(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  isPremium: z.boolean().default(false),
  status: z.enum(["draft", "pending", "approved", "rejected"]),
  questions: z.array(questionSchema).min(1, "Er moet minstens 1 vraag zijn"),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface QuizFormProps {
  initialData?: any;
}

export default function QuizForm({ initialData }: QuizFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : data.categories || []))
      .catch(err => console.error("Could not fetch categories", err));
  }, []);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema) as unknown as Resolver<QuizFormValues>,
    defaultValues: initialData ? {
      title: initialData.title || "",
      description: initialData.description || "",
      slug: initialData.slug || "",
      imageUrl: initialData.imageUrl || "",
      categoryId: initialData.categoryId?._id || initialData.categoryId || "",
      rewardXp: initialData.rewardXp ?? 100,
      difficulty: initialData.difficulty || "easy",
      isPremium: initialData.isPremium || false,
      status: initialData.status || "draft",
      questions: initialData.questions?.map((q: any) => ({
        text: q.text || "",
        explanation: q.explanation || "",
        bibleReference: q.bibleReference || "",
        answers: q.answers?.map((a: any) => ({
          text: a.text || "",
          isCorrect: a.isCorrect || false,
        })) || [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ],
      })) || [],
    } : {
      title: "",
      description: "",
      slug: "",
      imageUrl: "",
      categoryId: "",
      rewardXp: 100,
      difficulty: "easy",
      isPremium: false,
      status: "draft",
      questions: [
        {
          text: "",
          explanation: "",
          bibleReference: "",
          answers: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
          ],
        },
      ],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    name: "questions",
    control: form.control,
  });

  const generateSlug = () => {
    const title = form.getValues("title");
    if (title && !form.getValues("slug")) {
      form.setValue("slug", title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a JSON file
    if (file.type !== "application/json" && !file.name.endsWith('.json')) {
      toast.error("Alleen JSON-bestanden zijn toegestaan");
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // Validate the JSON structure against the schema
      const validatedData = quizSchema.parse(jsonData);

      // Populate form with validated data
      form.reset(validatedData);
      
      toast.success("Quiz succesvol geladen uit JSON!");
    } catch (error: any) {
      console.error("JSON upload error:", error);
      if (error instanceof z.ZodError) {
        toast.error(`Validatiefout: ${(error as any).errors[0]?.message}`);
      } else if (error instanceof SyntaxError) {
        toast.error("Ongeldig JSON-formaat");
      } else {
        toast.error("Fout bij het laden van het bestand");
      }
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const onSubmit = async (data: QuizFormValues) => {
    setLoading(true);
    try {
      const url = initialData ? `/api/admin/quizzes/${initialData._id}` : `/api/admin/quizzes`;
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Er is een fout opgetreden bij het opslaan");
      }

      toast.success(initialData ? "Quiz bijgewerkt!" : "Quiz aangemaakt!");
      router.push("/admin/quizzes");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/quizzes"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-3xl font-bold font-serif">{initialData ? 'Quiz Bewerken' : 'Nieuwe Quiz'}</h1>
          </div>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* JSON Upload Section */}
            {!initialData && (
              <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    Importeer Quiz vanuit JSON
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload een JSON-bestand om automatisch alle quiz-gegevens in te vullen. 
                    Het bestand moet voldoen aan het quiz-schema.
                  </p>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="json-upload"
                      className="cursor-pointer"
                    >
                      <input
                        id="json-upload"
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => document.getElementById('json-upload')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploaden..." : "Kies JSON-bestand"}
                      </Button>
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium">Voorbeeld JSON-structuur:</p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`{
  "title": "Quiz titel",
  "description": "Quiz beschrijving",
  "slug": "quiz-slug",
  "categoryId": "category-id-hier",
  "rewardXp": 100,
  "difficulty": "medium",
  "isPremium": false,
  "status": "draft",
  "questions": [
    {
      "text": "Vraag tekst?",
      "explanation": "Uitleg",
      "bibleReference": "Genesis 1:1",
      "answers": [
        { "text": "Antwoord 1", "isCorrect": true },
        { "text": "Antwoord 2", "isCorrect": false }
      ]
    }
  ]
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijv: Het leven van David" {...field} onBlur={() => { field.onBlur(); generateSlug(); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="het-leven-van-david" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Een korte introductie over de quiz..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Afbeelding URL (optioneel)</FormLabel>
                      <FormControl>
                        <Input placeholder="/images/quizzes/david.jpg of een externe URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="flex items-center justify-between mt-8 mb-4">
              <h2 className="text-2xl font-bold font-serif">Vragen</h2>
            </div>
            
            {form.formState.errors.questions?.root && (
              <p className="text-sm font-medium text-destructive mb-4">{form.formState.errors.questions.root.message}</p>
            )}

            <div className="space-y-6">
              {questionFields.map((qField, qIndex) => (
                <Card key={qField.id} className="relative border-slate-200">
                  <div className="absolute right-4 top-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        Vraag {qIndex + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`questions.${qIndex}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>De Vraag</FormLabel>
                          <FormControl>
                            <Input placeholder="Wie was de vader van David?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name={`questions.${qIndex}.explanation`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Verklaring (verschijnt na antwoord)</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none h-20" placeholder="David was de jongste zoon..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name={`questions.${qIndex}.bibleReference`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bijbeltekst</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none h-20" placeholder="Bijv: 1 Samuel 16:1-13" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="mt-6">
                        <FormLabel className="mb-2 block">Antwoorden</FormLabel>
                        <AnswersFieldArray control={form.control} qIndex={qIndex} />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed py-8"
                onClick={() => appendQuestion({
                  text: "",
                  explanation: "",
                  bibleReference: "",
                  answers: [
                    { text: "", isCorrect: true },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                  ]
                })}
              >
                <Plus className="mr-2 h-4 w-4" /> Vraag Toevoegen
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instellingen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies een status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Concept</SelectItem>
                          <SelectItem value="pending">In afwachting</SelectItem>
                          <SelectItem value="approved">Goedgekeurd (Actief)</SelectItem>
                          <SelectItem value="rejected">Afgewezen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies een categorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {categories.length > 0 ? (
                                categories.map(cat => (
                                    <SelectItem key={cat._id} value={cat._id}>{cat.title}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="temp-loading" disabled>Laden...</SelectItem>
                            )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                          Of typ tijdelijk een ID of slug als categorieën leeg blijven.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moeilijkheidsgraad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Makkelijk</SelectItem>
                          <SelectItem value="medium">Gemiddeld</SelectItem>
                          <SelectItem value="hard">Moeilijk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rewardXp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>XP Beloning</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPremium"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Premium Quiz</FormLabel>
                        <FormDescription>
                          Alleen beschikbaar voor Plus abonnees
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

// Inner component for Answers to use correct nested field array context
function AnswersFieldArray({ control, qIndex }: { control: any, qIndex: number }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `questions.${qIndex}.answers`
    });

    return (
        <div className="space-y-3">
            {fields.map((aField, aIndex) => (
                <div key={aField.id} className="flex flex-row items-center gap-3">
                    <FormField
                        control={control}
                        name={`questions.${qIndex}.answers.${aIndex}.isCorrect`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        aria-label="Is correct antwoord"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`questions.${qIndex}.answers.${aIndex}.text`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder={`Antwoord ${aIndex + 1}`} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => remove(aIndex)}
                        disabled={fields.length <= 2}
                    >
                        <XIcon />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary mt-2"
                onClick={() => append({ text: "", isCorrect: false })}
            >
                <Plus className="h-4 w-4 mr-1" /> Optie toevoegen
            </Button>
        </div>
    )
}

function XIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
