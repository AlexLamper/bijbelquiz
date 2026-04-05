import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB, Quiz } from '@bijbelquiz/database';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const filter: { status?: string } = {};
    if (status) {
        filter.status = status;
    }

    const quizzes = await Quiz.find(filter)
        .populate('categoryId')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("[ADMIN_QUIZZES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();

    if (!body.slug && body.title) {
      body.slug = slugify(body.title);
    }

    if (!body.createdBy) {
      body.createdBy = session.user.id;
    }

    const quiz = new Quiz(body);
    await quiz.save();

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_QUIZZES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
