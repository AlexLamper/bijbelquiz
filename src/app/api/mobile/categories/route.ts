import { NextResponse } from 'next/server';
import { connectDB, Category } from '@/database';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Fetch all categories
    const categories = await Category.find().lean();
    
    // Format for the mobile app
    const formattedCategories = categories.map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image
    }));

    return NextResponse.json(formattedCategories, { status: 200 });
  } catch (error) {
    console.error('Mobile API - Categories Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
