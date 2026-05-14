import { MetadataRoute } from 'next';
import { getQuizSitemapEntries, getStaticSitemapEntries } from '@/lib/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = getStaticSitemapEntries();

  try {
    const quizPages = await getQuizSitemapEntries();
    return [...staticPages, ...quizPages];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticPages;
  }
}
