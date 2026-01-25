import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';

// Replace with your local IP for physical device testing
const API_BASE_URL = 'http://192.168.68.107:3000';

interface Answer {
  text: string;
  isCorrect: boolean;
  _id: string;
}

interface Question {
  text: string;
  answers: Answer[];
  explanation?: string;
  _id: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: Question[];
}

export default function MobileQuizPlayer() {
  const { id } = useLocalSearchParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      // Use the token if available to handle any auth-specific logic if needed,
      // though typically public quizzes are available to all.
      const token = await SecureStore.getItemAsync('userToken');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}`, { headers });
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
             Alert.alert('Toegang geweigerd', 'Deze quiz is alleen voor Premium leden.');
             router.back();
             return;
        }
        throw new Error('Failed to fetch quiz');
      }
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Fout', 'Kon de quiz niet laden. Is de server gestart?');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean, index: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
    setHasAnswered(true);
    if (isCorrect) setScore(score + 1);
  };

  const handleNext = async () => {
    if (currentIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    const token = await SecureStore.getItemAsync('userToken');
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/quiz/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            quizId: quiz?._id,
            score: score,
            totalQuestions: quiz?.questions.length
          })
        });
      } catch (e) {
        console.error("Failed to save progress", e);
      }
    }
  };

  if (loading) {
    return (
        <View className="flex-1 justify-center items-center bg-background">
          <ActivityIndicator size="large" color="#152d2f" />
        </View>
    );
  }
  
  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentIndex];

  if (isFinished) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center px-8">
        <View className="items-center mb-8">
            <View className="bg-secondary/20 p-6 rounded-full mb-6">
                <FontAwesome name="trophy" size={60} color="#f5a623" />
            </View>
            <Text className="text-3xl font-serif font-bold text-center text-primary mb-2">Quiz Voltooid!</Text>
            <Text className="text-lg text-center text-muted-foreground">
            Je resultaat voor "{quiz.title}"
            </Text>
        </View>

        <View className="bg-card border border-border rounded-2xl p-8 mb-10 shadow-sm items-center">
          <Text className="text-muted-foreground mb-1 uppercase text-xs font-bold tracking-wider">Jouw Score</Text>
          <Text className="text-primary text-6xl font-black mb-2">{score}/{quiz.questions.length}</Text>
          <View className="flex-row items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
            <FontAwesome name="check" size={12} color="#15803d" />
            <Text className="text-green-700 font-bold text-sm">Goed gedaan!</Text>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-primary py-4 rounded-xl items-center shadow-md active:scale-95 transition-transform" 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text className="text-primary-foreground font-bold text-lg">Terug naar overzicht</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-1">
        <View className="flex-row justify-between items-center mb-6 pt-2">
          <View className="flex-row items-center gap-2">
             <Text className="text-muted-foreground font-medium">Vraag {currentIndex + 1} <Text className="text-slate-300">/</Text> {quiz.questions.length}</Text>
          </View>
          <View className="bg-secondary/20 px-3 py-1 rounded-full flex-row items-center gap-1.5">
            <FontAwesome name="star" size={12} color="#d97706" />
            <Text className="text-secondary-foreground font-bold">Score: {score}</Text>
          </View>
        </View>

        <View className="mb-8">
            <View className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                <View 
                    style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }} 
                    className="h-full bg-primary rounded-full"
                />
            </View>
        </View>

        <Text className="text-2xl font-serif font-bold text-primary dark:text-white mb-8 leading-8 h-[20%]">
          {currentQuestion.text}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {currentQuestion.answers.map((answer, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answer.isCorrect;
            
            let borderColor = 'border-border';
            let bgColor = 'bg-card';
            let textColor = 'text-foreground';
            let iconName = 'circle-o';
            let iconColor = '#dcd7ce';
            
            if (hasAnswered) {
              if (isCorrect) {
                 borderColor = 'border-green-500';
                 bgColor = 'bg-green-50';
                 textColor = 'text-green-900';
                 iconName = 'check-circle';
                 iconColor = '#22c55e';
              } else if (isSelected) {
                 borderColor = 'border-red-500';
                 bgColor = 'bg-red-50';
                 textColor = 'text-red-900';
                 iconName = 'times-circle';
                 iconColor = '#ef4444';
              } else {
                 // Dim non-selected answers
                 borderColor = 'border-slate-100';
                 textColor = 'text-slate-400';
              }
            } else if (isSelected) {
              borderColor = 'border-primary';
              bgColor = 'bg-primary/5';
              textColor = 'text-primary';
              iconName = 'dot-circle-o';
              iconColor = '#152d2f';
            }

            return (
              <TouchableOpacity
                key={answer._id}
                onPress={() => handleAnswer(answer.isCorrect, index)}
                disabled={hasAnswered}
                className={`border-2 rounded-xl p-5 mb-4 flex-row items-center gap-4 ${borderColor} ${bgColor} active:scale-[0.99] transition-transform shadow-sm`}
              >
                <FontAwesome name={iconName as any} size={24} color={iconColor} />
                <Text className={`text-lg font-medium flex-1 ${textColor}`}>
                  {answer.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {hasAnswered && (
          <View className="pt-4 border-t border-border mt-2">
            {currentQuestion.explanation && (
              <View className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                <View className="flex-row items-center gap-2 mb-1">
                    <FontAwesome name="info-circle" size={16} color="#3b82f6" />
                    <Text className="font-bold text-blue-800">Uitleg</Text>
                </View>
                <Text className="text-blue-900 leading-5">{currentQuestion.explanation}</Text>
              </View>
            )}
            <TouchableOpacity 
              className="bg-primary py-4 rounded-xl items-center shadow-lg active:translate-y-1 transition-transform" 
              onPress={handleNext}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-primary-foreground font-bold text-lg">
                    {currentIndex < quiz.questions.length - 1 ? 'Volgende vraag' : 'Bekijk resultaat'}
                </Text>
                <FontAwesome name="arrow-right" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
