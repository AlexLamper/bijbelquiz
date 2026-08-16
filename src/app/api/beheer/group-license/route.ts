import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { User, connectDB } from '@/database';
import { GROUP_LICENSE_SEATS, grantGroupLicense } from '@/lib/group-license';

/**
 * Manual group-licence grant, for a licence sold on invoice.
 *
 * Churches and schools generally will not put €99 through a card form; they
 * want an invoice and a bank transfer. Without this the only way to fulfil
 * such an order is a hand-written database write, which is exactly the kind of
 * thing that gets done wrong at nine in the evening.
 *
 * Admin only, and identified by email rather than user id because an invoice
 * carries an email address and nothing else.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const seats = Number.isFinite(Number(body?.seats))
      ? Math.min(500, Math.max(1, Math.trunc(Number(body.seats))))
      : GROUP_LICENSE_SEATS;
    const months = Number.isFinite(Number(body?.months))
      ? Math.min(60, Math.max(1, Math.trunc(Number(body.months))))
      : 12;

    if (!email) {
      return NextResponse.json({ error: 'Vul het e-mailadres van de koper in.' }, { status: 400 });
    }

    await connectDB();

    const owner = await User.findOne({ email }).select('_id name email').lean();
    if (!owner) {
      return NextResponse.json(
        { error: `Geen account gevonden voor ${email}. De koper moet eerst een account maken.` },
        { status: 404 },
      );
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Deliberately no Stripe ids: a manual grant is not a subscription, so a
    // webhook must never think it owns this licence and cancel it.
    const granted = await grantGroupLicense({
      ownerId: String(owner._id),
      name: name || undefined,
      seats,
      expiresAt,
    });

    return NextResponse.json({
      joinCode: granted.joinCode,
      ownerName: owner.name || owner.email,
      seats,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[ADMIN_GROUP_LICENSE_POST]', error);
    return NextResponse.json({ error: 'Toekennen is niet gelukt.' }, { status: 500 });
  }
}
