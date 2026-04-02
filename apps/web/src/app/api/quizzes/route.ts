import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, Quiz } from '@bijbelquiz/database';

export async function GET() {
  try {
    await connectDB();
    // Support both new 'approved' status and legacy quizzes with missing status
    const filter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("[QUIZZES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, categoryId, questions, difficulty, rewardXp } = body;

    if (!title || !categoryId || !questions || questions.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await connectDB();

    const role = session.user.role;
    const initialStatus = role === 'admin' ? 'approved' : 'pending';

    // Basic slug generation
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    // Check for unique slug
    while (await Quiz.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const quiz = await Quiz.create({
      title,
      slug,
      description,
      categoryId,
      rewardXp: typeof rewardXp === 'number' ? Math.max(0, rewardXp) : 50,
      difficulty: difficulty || 'medium',
      isPremium: false, // Default to free
      status: initialStatus,
      createdBy: session.user.id,
      questions
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_CREATE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
