import { NextResponse } from 'next/server';
import { connectDB, Quiz } from '@/database';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Fetch active quizzes
    // We populate the category if it references the ObjectId under field 'category'
    // Depending on your schema, it might just lean() all fields
    const quizzes = await Quiz.find({ isActive: { $ne: false } }).lean();
    
    // Format the response for Flutter models
    const formattedQuizzes = quizzes.map((quiz: any) => ({
      id: quiz._id.toString(),
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      image: quiz.image,
      xpReward: quiz.xpReward || 50,
      categoryId: quiz.categoryId?.toString() || quiz.category?.toString() || null,
      questionCount: quiz.questions?.length || 0,
      isActive: quiz.isActive
    }));

    return NextResponse.json(formattedQuizzes, { status: 200 });
  } catch (error) {
    console.error('Mobile API - Quizzes Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
