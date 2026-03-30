import { NextResponse } from 'next/server';
import { connectDB, Quiz, Category } from '@bijbelquiz/database';

// Image assignments
const QUIZ_IMAGES: Record<string, string> = {
  'algemene-bijbelkennis-deel-1':    '/images/quizzes/img2.png',
  'koningen-profeten-en-apostelen':  '/images/quizzes/img3.png',
  'wonderen-en-gebeurtenissen':      '/images/quizzes/img4.png',
  'helden-en-martelaren':            '/images/quizzes/img5.png',
  'diepere-bijbelstudie':            '/images/quizzes/img6.png',
  'genesis':                         '/images/quizzes/img1.png',
  // Seed quizzes
  'algemene-bijbelkennis':           '/images/quizzes/img8.png',
  'leven-van-jezus':                 '/images/quizzes/img5.png',
  'romeinen-studie':                 '/images/quizzes/img6.png',
};

const CATEGORY_IMAGES: Record<string, string> = {
  'oude-testament':         '/images/quizzes/img1.png',
  'nieuwe-testament':       '/images/quizzes/img2.png',
  'personen-in-de-bijbel':  '/images/quizzes/img3.png',
  'wonderen-en-tekenen':    '/images/quizzes/img4.png',
  'leven-van-jezus':        '/images/quizzes/img5.png',
  'studie':                 '/images/quizzes/img6.png',
  'vrouwen-in-de-bijbel':   '/images/quizzes/img7.png',
  'algemeen':               '/images/quizzes/img8.png',
};

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Only available in development', { status: 403 });
  }

  try {
    await connectDB();

    // Update quizzes
    const quizResults = await Promise.all(
      Object.entries(QUIZ_IMAGES).map(([slug, imageUrl]) =>
        Quiz.updateOne({ slug }, { $set: { imageUrl } })
      )
    );

    // Update categories
    const catResults = await Promise.all(
      Object.entries(CATEGORY_IMAGES).map(([slug, imageUrl]) =>
        Category.updateOne({ slug }, { $set: { imageUrl } })
      )
    );

    const quizzesUpdated = quizResults.reduce((sum, r) => sum + r.modifiedCount, 0);
    const categoriesUpdated = catResults.reduce((sum, r) => sum + r.modifiedCount, 0);

    return new NextResponse(
      `Migration done: ${quizzesUpdated} quizzes updated, ${categoriesUpdated} categories updated`,
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse('Migration error: ' + msg, { status: 500 });
  }
}
