// TEMPORARY - lives only on branch tmp/seed, never merged. Gives one account the
// admin role in the database of the deployment it runs on, creating the user
// document if the person has not signed in yet (Google sign-in matches on email,
// so it attaches to this document). Guarded by SEED_TOKEN; refuses the Dutch database.
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const token = process.env.SEED_TOKEN;
  if (!token || request.nextUrl.searchParams.get('token') !== token) {
    return NextResponse.json({ error: 'nope' }, { status: 404 });
  }
  const lang = process.env.SITE_LOCALE ?? '';
  if (!lang || lang === 'nl') return NextResponse.json({ error: 'not an intl deployment' }, { status: 400 });

  const email = (request.nextUrl.searchParams.get('email') ?? '').trim().toLowerCase();
  const name = request.nextUrl.searchParams.get('name') ?? undefined;
  if (!email.includes('@')) return NextResponse.json({ error: 'email missing' }, { status: 400 });

  const { connectDB, User, Category } = await import('@/database');
  await connectDB();
  const dutch = await Category.countDocuments({ slug: { $in: ['oude-testament', 'nieuwe-testament'] } });
  if (dutch > 0) return NextResponse.json({ error: 'Dutch database, stopped' }, { status: 409 });

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    if (name && !existing.name) existing.name = name;
    await existing.save();
    return NextResponse.json({ lang, email, action: 'updated', role: existing.role, name: existing.name });
  }
  const created = await User.create({ email, name, role: 'admin', isPremium: false });
  return NextResponse.json({ lang, email, action: 'created', role: created.role, name: created.name });
}
