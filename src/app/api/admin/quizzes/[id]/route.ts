import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Adapt to Next.js 15+ promise params
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['pending', 'approved', 'rejected', 'draft'].includes(status)) {
        return new NextResponse("Invalid status", { status: 400 });
    }

    await connectDB();

    const quiz = await Quiz.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
    );

    if (!quiz) {
        return new NextResponse("Quiz not found", { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[ADMIN_QUIZ_UPDATE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }
  
    try {
      const { id } = await params;
      await connectDB();
  
      const quiz = await Quiz.findByIdAndDelete(id);
  
      if (!quiz) {
          return new NextResponse("Quiz not found", { status: 404 });
      }
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[ADMIN_QUIZ_DELETE]", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }
