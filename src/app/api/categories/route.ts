import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Category } from '@/database';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ sortOrder: 1, title: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug } = body;
    
    if (!title) return new NextResponse("Title is required", { status: 400 });

    await connectDB();
    const newCategory = new Category({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      isActive: true,
    });
    
    await newCategory.save();
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("[CATEGORIES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
