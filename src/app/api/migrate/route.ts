import { NextResponse } from 'next/server';
import { connectDB, Quiz, Category } from '@/database';

// Image assignments
const QUIZ_IMAGES: Record<string, string> = {
  'algemene-bijbelkennis-deel-1':    '/images/quizzes/img2.png',
  'koningen-profeten-en-apostelen':  '/images/quizzes/img3.png',
  'wonderen-en-gebeurtenissen':      '/images/quizzes/img4.png',
  'helden-en-martelaren':            '/images/quizzes/img5.png',
  'diepere-bijbelstudie':            '/images/quizzes/img6.png',
  'genesis':                         '/images/quizzes/img1.png',
  'het-boek-spreuken':               '/images/quizzes/img9.png',
  'spreuken':                        '/images/quizzes/img9.png',
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

const LEGACY_IMAGE_REMAP: Record<string, string> = {
  '/images/quizzes/spreuken.png': '/images/quizzes/img9.png',
  '/images/quizzes/spreuken.jpg': '/images/quizzes/img9.png',
  '/images/quizzes/algemeen.png': '/images/quizzes/img8.png',
  '/images/quizzes/algemeen.jpg': '/images/quizzes/img8.png',
  '/images/quizzes/img1_new.png': '/images/quizzes/img1.png',
  '/images/quizzes/img2_new.png': '/images/quizzes/img2.png',
  '/images/quizzes/img3_new.png': '/images/quizzes/img3.png',
  '/images/quizzes/img4_new.png': '/images/quizzes/img4.png',
  '/images/quizzes/img5_new.png': '/images/quizzes/img5.png',
  '/images/quizzes/img6_new.png': '/images/quizzes/img6.png',
  '/images/quizzes/img7_new.png': '/images/quizzes/img7.png',
  '/images/quizzes/img8_new.png': '/images/quizzes/img8.png',
  '/images/quizzes/img9_new.png': '/images/quizzes/img9.png',
  '/images/quizzes/img10_new.png': '/images/quizzes/img10.png',
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

    const legacyQuizResults = await Promise.all(
      Object.entries(LEGACY_IMAGE_REMAP).map(([oldImage, newImage]) =>
        Quiz.updateMany({ imageUrl: oldImage }, { $set: { imageUrl: newImage } })
      )
    );

    const legacyCategoryResults = await Promise.all(
      Object.entries(LEGACY_IMAGE_REMAP).map(([oldImage, newImage]) =>
        Category.updateMany({ imageUrl: oldImage }, { $set: { imageUrl: newImage } })
      )
    );

    const quizzesUpdated = quizResults.reduce((sum, r) => sum + r.modifiedCount, 0);
    const categoriesUpdated = catResults.reduce((sum, r) => sum + r.modifiedCount, 0);
    const legacyQuizzesUpdated = legacyQuizResults.reduce((sum, r) => sum + r.modifiedCount, 0);
    const legacyCategoriesUpdated = legacyCategoryResults.reduce((sum, r) => sum + r.modifiedCount, 0);

    return new NextResponse(
      `Migration done: ${quizzesUpdated} quizzes updated, ${categoriesUpdated} categories updated, ${legacyQuizzesUpdated} legacy quiz images normalized, ${legacyCategoriesUpdated} legacy category images normalized`,
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse('Migration error: ' + msg, { status: 500 });
  }
}
