import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, User } from '@/database';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const newName = body.name?.trim();

    if (!newName || newName.length < 2 || newName.length > 30) {
      return NextResponse.json({ error: 'Naam moet tussen de 2 en 30 karakters lang zijn.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Alleen updaten en 30-dagen policy toepassen als de naam daadwerkelijk afwijkt
    if (user.name !== newName) {
      // Check 30 days restriction
      if (user.nameUpdatedAt) {
        const nextAllowedDate = new Date(user.nameUpdatedAt);
        nextAllowedDate.setDate(nextAllowedDate.getDate() + 30);
        
        const now = new Date();
        if (now < nextAllowedDate) {
          const remainingDays = Math.ceil((nextAllowedDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          return NextResponse.json(
            { error: 'Je kunt je naam slechts één keer per 30 dagen wijzigen. Wacht nog ' + remainingDays + ' dagen.' },
            { status: 403 }
          );
        }
      }

      user.name = newName;
      user.nameUpdatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        xp: user.xp,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('[USER_UPDATE_PUT]', error);
    return NextResponse.json({ error: 'Er is een interne fout opgetreden' }, { status: 500 });
  }
}
