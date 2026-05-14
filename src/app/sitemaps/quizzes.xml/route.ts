import { buildSitemapXml, getQuizSitemapEntries } from '@/lib/sitemap';

export async function GET() {
  try {
    const entries = await getQuizSitemapEntries();
    const xml = buildSitemapXml(entries);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Quiz sitemap generation error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
