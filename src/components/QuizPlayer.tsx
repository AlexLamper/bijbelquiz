'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

// Interface matching the serialized Mongoose object
interface Answer {
  text: string;
  isCorrect: boolean;
  _id: string;
}

interface Question {
  text: string;
  answers: Answer[];
  _id: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: Question[];
}

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const currentQuestion = quiz.questions[currentIndex];

  const handleAnswer = (isCorrect: boolean, index: number) => {
    if (isSubmitting) return;
    
    setSelectedAnswer(index);
    setIsSubmitting(true);

    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentIndex < quiz.questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setIsSubmitting(false);
      } else {
        setIsFinished(true);
      }
    }, 1000); // 1 second delay to show result
  };

  if (isFinished) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Quiz Afgerond!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-2xl">
            Je score: <span className="font-bold text-primary">{score}</span> / {quiz.questions.length}
          </p>
          <p className="text-slate-600">
            {score === quiz.questions.length ? "Geweldig! Alles goed!" : 
             score > quiz.questions.length / 2 ? "Goed gedaan!" : "Blijf oefenen!"}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">Opnieuw Spelen</Button>
          <Button onClick={() => router.push('/')}>Terug naar Overzicht</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
           <span className="text-sm text-slate-500">Vraag {currentIndex + 1} van {quiz.questions.length}</span>
           <span className="text-sm font-bold text-amber-600">Score: {score}</span>
        </div>
        <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {currentQuestion.answers.map((answer, index) => {
            let buttonVariant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" = "outline";
            
            if (selectedAnswer !== null) {
                if (index === selectedAnswer) {
                    buttonVariant = answer.isCorrect ? "default" : "destructive"; // Green (default often dark/primary) or Red
                } else if (answer.isCorrect) {
                    buttonVariant = "default"; // Show correct answer if missed
                }
            }

            // Custom coloring overrides might be needed for "default" = success green in ShadCn standard themes without success variant
            // We'll use classes for specific coloring
            
            let className = "justify-start text-left h-auto py-4 text-lg";
            if (selectedAnswer !== null) {
                if (answer.isCorrect) {
                    className += " bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600";
                } else if (index === selectedAnswer && !answer.isCorrect) {
                     className += " bg-red-600 hover:bg-red-700 text-white border-red-600";
                }
            }

            return (
              <Button
                key={index}
                variant="outline"
                className={className}
                onClick={() => handleAnswer(answer.isCorrect, index)}
                disabled={isSubmitting}
              >
                {answer.text}
              </Button>
            );
        })}
      </CardContent>
    </Card>
  );
}
