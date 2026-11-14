import { getSiteConfig } from '@/config/site';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = getSiteConfig();
  if (site.id !== 'nl') {
    if (!site.indexable) {
      return { rules: { userAgent: '*', disallow: '/' } };
    }
    return {
      rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/premium/success'] },
      sitemap: [`${site.baseUrl}/sitemap.xml`],
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/premium/success'],
    },
    sitemap: [
      'https://www.bijbelquiz.com/sitemap.xml',
      'https://www.bijbelquiz.com/sitemaps/static.xml',
      'https://www.bijbelquiz.com/sitemaps/quizzes.xml',
    ],
  };
}
