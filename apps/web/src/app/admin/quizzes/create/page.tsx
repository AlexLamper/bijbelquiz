import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizForm from "@/components/admin/QuizForm";

export default async function CreateQuizPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <QuizForm />
    </div>
  );
}
