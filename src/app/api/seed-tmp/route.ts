// TEMPORARY - lives only on branch tmp/seed, never merged. Seeds categories into the
// database of the deployment it runs on. Guarded by SEED_TOKEN.
import { NextRequest, NextResponse } from 'next/server';
import en from '../../../../docs/quizzes-en/categories.json';
import de from '../../../../docs/quizzes-de/categories.json';
import fr from '../../../../docs/quizzes-fr/categories.json';
import pt from '../../../../docs/quizzes-pt/categories.json';
import es from '../../../../docs/quizzes-es/categories.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FILES: Record<string, { slug: string }[]> = { en, de, fr, pt, es };

export async function GET(request: NextRequest) {
  const token = process.env.SEED_TOKEN;
  if (!token || request.nextUrl.searchParams.get('token') !== token) {
    return NextResponse.json({ error: 'nope' }, { status: 404 });
  }
  const lang = process.env.SITE_LOCALE ?? '';
  const categories = FILES[lang] as unknown as Record<string, unknown>[];
  if (!categories) return NextResponse.json({ error: 'no file for ' + lang }, { status: 400 });
  const apply = request.nextUrl.searchParams.get('apply') === '1';

  const { connectDB, Category } = await import('@/database');
  await connectDB();
  const dutch = await Category.countDocuments({ slug: { $in: ['oude-testament', 'nieuwe-testament'] } });
  if (dutch > 0) return NextResponse.json({ error: 'Dutch database, stopped' }, { status: 409 });

  const log: string[] = [];
  for (const category of categories) {
    const existing = await Category.findOne({ slug: String(category.slug) });
    log.push(`${existing ? 'UPDATE' : 'NEW'} ${category.slug}`);
    if (!apply) continue;
    const body = { ...category, lang, isActive: true };
    if (existing) {
      existing.set(body);
      await existing.save();
    } else {
      await Category.create(body);
    }
  }
  const total = await Category.countDocuments({});
  return NextResponse.json({ lang, apply, total, log });
}
