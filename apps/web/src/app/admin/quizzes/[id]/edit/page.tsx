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
  
  const quizDoc = await Quiz.findById(id).populate('categoryId', '_id title').lean();

  if (!quizDoc) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold">Quiz niet gevonden</h1>
      </div>
    );
  }

  const quiz = JSON.parse(JSON.stringify(quizDoc)); // convert ObjectIds to strings

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <QuizForm initialData={quiz} />
    </div>
  );
}
