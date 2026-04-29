import { NextResponse } from 'next/server';
import { connectDB, Quiz, Category } from '@/database';

const VALID_IMAGE_NAMES = new Set(Array.from({ length: 10 }, (_, index) => `img${index + 1}.png`));

function normalizeQuizImagePath(value?: string): string {
  const image = value?.trim();
  if (!image) {
    return '/images/quizzes/img1.png';
  }

  const lower = image.toLowerCase();
  if (!lower.startsWith('/images/quizzes/')) {
    return image;
  }

  const fileName = lower.split('/').pop() || '';
  if (!VALID_IMAGE_NAMES.has(fileName)) {
    return '/images/quizzes/img1.png';
  }

  return `/images/quizzes/${fileName}`;
}

export async function GET(req: Request, context: any) {
  try {
    await connectDB();
    
    // In Next.js 15 app dir params is a promise, in 14 it is sync. This covers both securely.
    const params = await context.params;
    const { id } = params || {};

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
    
    // Fetch quiz and category independently to dodge Mongoose population registration crashes in Next API
    const quiz = await Quiz.findOne(query).lean();
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    let categoryObj = null;
    const categoryRef = quiz.categoryId || (quiz as any).category;
    if (categoryRef) {
      categoryObj = await Category.findById(categoryRef).lean();
    }

    const formattedQuiz = {
      id: quiz._id?.toString() || id,
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      imageUrl: normalizeQuizImagePath(quiz.imageUrl || (quiz as any).image),
      xpReward: quiz.rewardXp || (quiz as any).xpReward || 50,
      difficulty: quiz.difficulty || 'medium',
      categoryId: categoryObj?._id?.toString() || quiz.categoryId?.toString() || null,
      category: categoryObj ? {
        id: categoryObj._id?.toString() || null,
        name: (categoryObj as any).name || (categoryObj as any).title || categoryObj.slug || null,
        slug: categoryObj.slug || null,
      } : null,
      questionCount: quiz.questions?.length || 0,
      questions: (quiz.questions || []).map((q: any) => ({
        id: q._id?.toString(),
        text: q.text,
        explanation: q.explanation || '',
        bibleReference: q.bibleReference || '-',
        answers: (q.answers || []).map((a: any) => ({
          text: a.text,
          isCorrect: a.isCorrect || false
        }))
      }))
    };

    return NextResponse.json(formattedQuiz, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Mobile API - Quiz Details Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
