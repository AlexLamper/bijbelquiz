import { getStaticSitemapEntries, buildSitemapXml } from '@/lib/sitemap';

export async function GET() {
  const entries = getStaticSitemapEntries();
  const xml = buildSitemapXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
