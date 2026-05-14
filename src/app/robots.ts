import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
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
