import { MetadataRoute } from 'next'
import connectDB from '@/lib/db'
import Quiz from '@/models/Quiz'

interface QuizDocument {
  slug: string
  updatedAt?: Date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bijbelquiz.com'

  // Static pages
  const staticPages = [
    '',
    '/quizzes',
    '/leaderboard',
    '/premium',
    '/login',
    '/register',
    '/contact',
    '/help',
    '/privacy-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : (route === '/quizzes' ? 0.9 : 0.8),
  }))

  try {
    await connectDB();
    // Only include approved quizzes in the sitemap to avoid 404s for Google
    // when accessing draft or pending quizzes.
    const quizzes = await Quiz.find({ 
      status: 'approved' 
    }).select('slug updatedAt').lean();

    const quizPages = quizzes.map((quiz: QuizDocument) => ({
      url: `${baseUrl}/quiz/${quiz.slug}`,
      lastModified: quiz.updatedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...quizPages];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticPages;
  }
}
