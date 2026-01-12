import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { quizId, score, totalQuestions } = await req.json();

    if (!quizId || typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    await connectDB();
    
    // Ensure we have a valid User ID (MongoDB Object ID)
    // The session logic fix we applied earlier ensures session.user.id is correct
    // But let's double check if we need to convert anything.
    // Mongoose handles string -> ObjectId conversion usually.

    // Record the attempt
    await UserProgress.create({
      userId: session.user.id,
      quizId,
      score,
      totalQuestions
    });

    console.log(`[Quiz Submit] User ${session.user.id} completed quiz ${quizId}. Score: ${score}/${totalQuestions}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Quiz Submit] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
