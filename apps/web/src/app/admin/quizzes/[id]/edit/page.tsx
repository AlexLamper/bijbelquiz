import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizForm from "@/components/admin/QuizForm";
import { connectDB, Quiz } from "@bijbelquiz/database";

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;

  await connectDB();
  const quiz = await Quiz.findById(id).populate('categoryId').lean();

  if (!quiz) {
    redirect('/admin/quizzes');
  }

  const initialData = JSON.parse(JSON.stringify(quiz));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <QuizForm initialData={initialData} />
    </div>
  );
}
