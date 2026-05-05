import { MetadataRoute } from 'next'
import { connectDB, Quiz } from '@/database'

interface QuizDocument {
  slug: string
  updatedAt?: Date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bijbelquiz.com'

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/quizzes`, priority: 0.95, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/premium`, priority: 0.9, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/leaderboard`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/login`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/register`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/contact`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/help`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/privacy-policy`, priority: 0.4, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/terms-of-service`, priority: 0.4, changeFrequency: 'yearly' as const },
    { url: `${baseUrl}/account-verwijderen`, priority: 0.3, changeFrequency: 'yearly' as const },
  ].map((page) => ({
    ...page,
    lastModified: new Date(),
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
      priority: 0.85,
    }));

    return [...staticPages, ...quizPages];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticPages;
  }
}
