import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, User } from '@bijbelquiz/database';

export async function POST(req: NextRequest) {
  try {
    const { name, email: rawEmail, password } = await req.json();

    if (!rawEmail || !password) {
      return new NextResponse("Email en wachtwoord zijn verplicht", { status: 400 });
    }

    const email = rawEmail.toLowerCase();

    await connectDB();

    const userExists = await User.findOne({ email });
    if (userExists) {
      // Als de gebruiker bestaat maar geen wachtwoord heeft (bijv. door Google inlog of een mislukte eerdere poging)
      if (!userExists.password) {
        return new NextResponse("Dit emailadres is al gekoppeld aan een Google-account. Log in met Google.", { status: 400 });
      }
      return new NextResponse("Gebruiker met dit emailadres bestaat al", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isPremium: false,
    });

    return NextResponse.json({
      message: "Gebruiker succesvol aangemaakt",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Registratiefout:", error);
    return new NextResponse("Er is een fout opgetreden bij de registratie", { status: 500 });
  }
}
