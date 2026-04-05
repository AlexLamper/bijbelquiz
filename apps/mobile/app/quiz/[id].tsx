import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/api';
import { getQuizImage } from '../../constants/quizImages';
import { useAuth } from '../../components/AuthProvider';

interface Answer {
  text: string;
  isCorrect: boolean;
  _id: string;
}

interface Question {
  text: string;
  answers: Answer[];
  explanation?: string;
  bibleReference?: string;
  _id: string;
}

interface Quiz {
  description: string;
  _id: string;
  title: string;
  difficulty?: string;
  imageUrl?: string;
  questions: Question[];
}

export default function MobileQuizPlayer() {
  const { id } = useLocalSearchParams();
  const { isPremium } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      // Fetch quiz from API
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}`);

      if (!response.ok) {
        throw new Error('Quiz not found');
      }

      const foundQuiz = await response.json();

      // Format if it has MongoDB specific $oid
      const formattedQuiz = {
        ...foundQuiz,
        _id: foundQuiz._id?.$oid || foundQuiz._id,
        questions: foundQuiz.questions.map((q: any) => ({
          ...q,
          _id: q._id?.$oid || q._id,
          answers: q.answers?.map((a: any) => ({
            ...a,
            _id: a._id?.$oid || a._id,
          })),
        })),
      };

      setQuiz(formattedQuiz);
    } catch (error) {
      console.error('Failed to fetch quiz:', error);

      // Fallback to local JSON if API fails
      try {
        const allQuizzes = require('../../assets/data/quizzes.json');
        const foundQuiz = allQuizzes.find((q: any) =>
          q._id === id || (q._id && q._id.$oid === id)
        );

        if (!foundQuiz) {
          throw new Error('Quiz niet gevonden');
        }

        // Format if it has MongoDB specific $oid
        const formattedQuiz = {
          ...foundQuiz,
          _id: foundQuiz._id?.$oid || foundQuiz._id,
          questions: foundQuiz.questions.map((q: any) => ({
            ...q,
            _id: q._id?.$oid || q._id,
            answers: q.answers?.map((a: any) => ({
              ...a,
              _id: a._id?.$oid || a._id,
            })),
          })),
        };

        setQuiz(formattedQuiz);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        Alert.alert('Fout', 'Kon de quiz niet laden.');
        router.back();
      }
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
        const response = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
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

        if (response.ok) {
          const result = await response.json();
          setXpEarned(result?.xpEarned ?? 0);
        }
      } catch (e) {
        console.error("Failed to save progress", e);
      }
    }
  };

  if (loading) {
    return (
        <View className="flex-1 justify-center items-center bg-background">
          <ActivityIndicator size="large" color="#121A2A" />
        </View>
    );
  }
  
  if (!quiz) return null;

  if (!hasStarted) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC] px-8">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 mt-6 mb-2 justify-center">
            <Ionicons name="arrow-back" size={26} color="#121A2A" />
        </TouchableOpacity>
        
        <View className="items-center mb-8 flex-1 justify-center -mt-16">
          <View className="w-40 h-40 bg-[#F3F4F6] rounded-[32px] mb-6 overflow-hidden border border-slate-200">
            {getQuizImage(quiz.imageUrl) ? (
              <>
                <Image
                  source={getQuizImage(quiz.imageUrl)}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.12)' }} />
              </>
            ) : (
              <View className="flex-1 items-center justify-center">
                <FontAwesome name="book" size={40} color="#9CA3AF" />
              </View>
            )}
          </View>
          <Text className="text-3xl font-serif font-bold text-center text-[#121A2A] mb-4">
            {quiz.title}
          </Text>
          <Text className="text-[16px] text-center text-[#6B7280] leading-relaxed mb-8">
            {quiz.description || "Start the quiz and test your knowledge!"}
          </Text>
          
          <View className="flex-row items-center gap-6 mb-8">
            <View className="items-center">
              <Text className="text-xl font-bold text-[#121A2A]">{quiz.questions?.length || 0}</Text>
              <Text className="text-[#6B7280] text-sm">Vragen</Text>
            </View>
            <View className="h-6 w-[1] bg-slate-300"></View>
            <View className="items-center">
              <Text className="text-xl font-bold text-[#121A2A]">+{(quiz.questions?.length || 0) * 10}</Text>
              <Text className="text-[#6B7280] text-sm">XP beloning</Text>
            </View>
            {quiz.difficulty && (
              <>
                <View className="h-6 w-[1] bg-slate-300"></View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-[#121A2A] capitalize">
                    {quiz.difficulty}
                  </Text>
                  <Text className="text-[#6B7280] text-sm">Niveau</Text>        
                </View>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity 
          className="bg-[#121A2A] py-4 rounded-2xl items-center shadow-lg active:scale-95 transition-transform mb-8" 
          onPress={() => setHasStarted(true)}
        >
          <Text className="text-white font-bold text-lg">Start Quiz</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];

  if (isFinished) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC] justify-center px-8">
        <View className="items-center mb-8">
            <View className="w-24 h-24 bg-[#F3F4F6] rounded-3xl mb-6 items-center justify-center border border-slate-200">
                <FontAwesome name="trophy" size={40} color="#C5A059" />
            </View>
            <Text className="text-3xl font-serif font-bold text-center text-[#121A2A] mb-2">Quiz Voltooid!</Text>
            <Text className="text-[16px] text-center text-[#6B7280]">
              Je resultaat voor "{quiz.title}"
            </Text>
        </View>

        <View className="bg-white border border-[#E5E7EB] rounded-3xl p-8 mb-10 shadow-sm items-center">
          <Text className="text-[#6B7280] mb-1 uppercase text-xs font-bold tracking-wider">Jouw Score</Text>
          <Text className="text-[#121A2A] text-6xl font-black mb-2">{score}/{quiz.questions.length}</Text>
          <View className="flex-row items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full mb-4">
            <FontAwesome name="check" size={12} color="#15803d" />
            <Text className="text-green-700 font-bold text-sm">Goed gedaan!</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <FontAwesome name="star" size={16} color="#d97706" />
            <Text className="text-[#121A2A] font-bold text-lg">+{xpEarned} XP</Text>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-[#121A2A] py-4 rounded-2xl items-center shadow-lg active:scale-95 transition-transform" 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text className="text-white font-bold text-lg">Terug naar overzicht</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-1">
        
        <View className="flex-row items-center justify-between mb-4 pt-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="close" size={26} color="#121A2A" />
          </TouchableOpacity>
          <Text className="text-[#121A2A] font-semibold text-[15px]">Vraag {currentIndex + 1}/{quiz.questions.length}</Text>
          <View className="w-10"></View>
        </View>

        
        <View className="mb-10 items-center w-full">
            <View className="h-1 bg-[#E5E7EB] rounded-full w-full overflow-hidden">
                <View 
                    style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }} 
                    className="h-full bg-[#121A2A] rounded-full"
                />
            </View>
        </View>

        
        <Text className="text-[22px] font-serif text-[#121A2A] mb-10 leading-[32px] text-center px-4">
          {currentQuestion.text}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {currentQuestion.answers.map((answer, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answer.isCorrect;
            
            // Standard state styling: rounded gray boxes, black text, left aligned, no borders
            let bgColor = 'bg-[#F3F4F6]';
            let textColor = 'text-[#121A2A]';
            let iconName: any = null;

            if (hasAnswered) {
              if (isCorrect) {
                bgColor = 'bg-emerald-500';
                textColor = 'text-white';
                iconName = 'checkmark';
              } else if (isSelected) {
                bgColor = 'bg-rose-500';
                textColor = 'text-white';
                iconName = 'close';
              } else {
                textColor = 'text-[#6B7280]';
              }
            } else if (isSelected) {
               bgColor = 'bg-[#121A2A]';
               textColor = 'text-white';
            }

            return (
              <TouchableOpacity
                key={answer._id || index}
                onPress={() => handleAnswer(answer.isCorrect, index)}
                disabled={hasAnswered}
                className={`${bgColor} rounded-[20px] p-5 mb-4 flex-row items-center justify-between active:scale-[0.99] transition-transform`}
              >
                <Text className={`text-[17px] ${textColor}`}>
                  {answer.text}
                </Text>
                {iconName ? (
                   <Ionicons name={iconName} size={24} color="white" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {hasAnswered ? (
          <View className="pt-5 mt-2 border-t border-[#E5E7EB]">
            <View className="flex-row justify-between items-start mb-2">
               <Text className="text-[20px] font-bold text-[#121A2A]">
                 {currentQuestion.answers[selectedAnswer!]?.isCorrect ? 'Correct!' : 'Helaas!'}
               </Text>
               <Ionicons name="leaf-outline" size={24} color="#121A2A" />
            </View>

            {!!currentQuestion.explanation && (
              isPremium ? (
                 <Text className="text-[#6B7280] text-[15px] leading-[22px] mb-2">
                   {currentQuestion.explanation}
                 </Text>
              ) : (
                 <View className="bg-[#F3F4F6] p-4 rounded-xl border border-[#E5E7EB] mb-3 mt-1">
                   <View className="flex-row items-center mb-2">
                     <FontAwesome name="star" size={16} color="#C5A059" className="mr-2" />
                     <Text className="font-bold text-[#121A2A]">Premium Uitleg</Text>
                   </View>
                   <Text className="text-[#6B7280] text-[13px] mb-3">Ontgrendel theologische uitleg en Bijbelverwijzingen voor alle vragen.</Text>
                   <TouchableOpacity 
                      className="bg-[#121A2A] py-2.5 rounded-xl items-center active:scale-[0.98]"
                      onPress={() => router.push('/modal')}
                   >
                      <Text className="text-white font-bold text-[14px]">Word Premium ✨</Text>
                   </TouchableOpacity>
                 </View>
              )
            )}
            {!!currentQuestion.bibleReference && isPremium && (
               <Text className="text-[#6B7280] text-[14px]">
                 {currentQuestion.bibleReference}
               </Text>
            )}

            <TouchableOpacity 
              className="bg-[#121A2A] py-4 rounded-[20px] items-center mt-6 active:scale-[0.98] transition-transform" 
              onPress={handleNext}
            >
              <Text className="text-white font-bold text-[17px]">
                  {currentIndex < quiz.questions.length - 1 ? 'Volgende' : 'Bekijk resultaat'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
