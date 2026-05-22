import { connectDB, Quiz } from '@/database';

interface QuizSitemapDocument {
  _id: { toString(): string } | string;
  slug?: string;
  updatedAt?: Date;
}

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function getSiteBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'https://www.bijbelquiz.com';
}

export function getStaticSitemapEntries(baseUrl = getSiteBaseUrl()): SitemapEntry[] {
  const now = new Date();

  const entries: SitemapEntry[] = [
    { url: `${baseUrl}/`, priority: 1.0, changeFrequency: 'daily' },
    { url: `${baseUrl}/quizzen`, priority: 0.95, changeFrequency: 'daily' },
    { url: `${baseUrl}/premium`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${baseUrl}/samen-spelen`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${baseUrl}/ranglijst`, priority: 0.85, changeFrequency: 'daily' },
    { url: `${baseUrl}/contact`, priority: 0.65, changeFrequency: 'monthly' },
    { url: `${baseUrl}/hulp`, priority: 0.65, changeFrequency: 'monthly' },
    { url: `${baseUrl}/privacybeleid`, priority: 0.5, changeFrequency: 'yearly' },
    { url: `${baseUrl}/voorwaarden`, priority: 0.5, changeFrequency: 'yearly' },
    { url: `${baseUrl}/account-verwijderen`, priority: 0.45, changeFrequency: 'yearly' },
    { url: `${baseUrl}/foutmelding`, priority: 0.45, changeFrequency: 'monthly' },
    { url: `${baseUrl}/inloggen`, priority: 0.35, changeFrequency: 'monthly' },
    { url: `${baseUrl}/registreren`, priority: 0.35, changeFrequency: 'monthly' },
  ];

  return entries.map((entry) => ({
    ...entry,
    lastModified: now,
  }));
}

export async function getQuizSitemapEntries(baseUrl = getSiteBaseUrl()): Promise<SitemapEntry[]> {
  await connectDB();

  const statusFilter = {
    $or: [{ status: 'approved' }, { status: { $exists: false } }],
  };

  const quizzes = await Quiz.find(statusFilter).select('_id slug updatedAt').lean();

  return quizzes.flatMap((quiz: QuizSitemapDocument) => {
    const quizId = typeof quiz._id === 'string' ? quiz._id : quiz._id.toString();
    const playPath = quiz.slug ? `/quiz/${quiz.slug}` : `/quiz/${quizId}`;
    const entries: SitemapEntry[] = [
      {
        url: `${baseUrl}${playPath}`,
        lastModified: quiz.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      },
    ];

    if (quiz.slug) {
      entries.push({
        url: `${baseUrl}/bijbelquiz/${quiz.slug}`,
        lastModified: quiz.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    return entries;
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastModifiedTag = entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : '';
      const changeFrequencyTag = entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : '';
      const priorityTag = typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(2)}</priority>` : '';

      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModifiedTag}${changeFrequencyTag}${priorityTag}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
