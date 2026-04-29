import { NextResponse } from 'next/server';
import { connectDB, Category } from '@/database';

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

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Fetch all categories
    const categories = await Category.find().lean();
    
    // Format for the mobile app
    const formattedCategories = categories.map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name || cat.title,
      slug: cat.slug,
      description: cat.description,
      image: normalizeQuizImagePath(cat.imageUrl || cat.image),
      imageUrl: normalizeQuizImagePath(cat.imageUrl || cat.image)
    }));

    return NextResponse.json(formattedCategories, { status: 200 });
  } catch (error) {
    console.error('Mobile API - Categories Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
