import { MetadataRoute } from 'next'
import connectDB from '@/lib/db'
import Quiz from '@/models/Quiz'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bijbelquiz.com'

  // Static pages
  const staticPages = [
    '',
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
    priority: route === '' ? 1 : 0.8,
  }))

  try {
    await connectDB();
    const quizzes = await Quiz.find({}).select('slug updatedAt').lean();

    const quizPages = quizzes.map((quiz: any) => ({
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
