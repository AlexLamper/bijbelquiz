import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import Category from '@/models/Category';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Only available in development', { status: 403 });
  }

  try {
    await connectDB();

    const count = await Quiz.countDocuments();
    if (count > 0) {
      return new NextResponse('Already seeded', { status: 200 });
    }

    // 1. Create Categories
    const categoriesData = [
      {
        title: "Oude Testament",
        slug: "oude-testament",
        description: "Vragen over de schepping, de aartsvaders en de profeten.",
        icon: "scroll",
        isActive: true,
        sortOrder: 1
      },
      {
        title: "Nieuwe Testament",
        slug: "nieuwe-testament",
        description: "Leer meer over Jezus, de apostelen en de eerste gemeente.",
        icon: "cross",
        isActive: true,
        sortOrder: 2
      },
      {
        title: "Algemeen",
        slug: "algemeen",
        description: "Gemengde kennisvragen uit de hele Bijbel.",
        icon: "globe",
        isActive: true,
        sortOrder: 3
      },
       {
        title: "Studie",
        slug: "studie",
        description: "Diepgaande studievragen voor gevorderden.",
        icon: "book-open",
        isActive: true,
        sortOrder: 4
      }
    ];

    // Using insertMany to get the documents back with _id
    const createdCategories = await Category.insertMany(categoriesData);
    
    // Helper to find cat ID
    const getCatId = (slug: string) => {
        const cat = createdCategories.find(c => c.slug === slug);
        return cat ? cat._id : null;
    };

    // 2. Create Quizzes
    const quizzes = [
      {
        title: "Algemene Bijbelkennis",
        slug: "algemene-bijbelkennis",
        description: "Test je basiskennis van de Bijbel met deze 5 vragen.",
        categoryId: getCatId("algemeen")!,
        difficulty: 'easy',
        isPremium: false,
        questions: [
          {
            text: "Wie bouwde de ark?",
            answers: [
              { text: "Mozes", isCorrect: false },
              { text: "Noach", isCorrect: true },
              { text: "Abraham", isCorrect: false },
              { text: "David", isCorrect: false },
            ],
            explanation: "God gaf Noach de opdracht om een ark te bouwen om zijn gezin en de dieren te redden van de zondvloed.",
            bibleReference: "Genesis 6:13-14"
          },
          {
            text: "Wat is het eerste boek van de Bijbel?",
            answers: [
              { text: "Mattheüs", isCorrect: false },
              { text: "Exodus", isCorrect: false },
              { text: "Genesis", isCorrect: true },
              { text: "Psalmen", isCorrect: false },
            ],
            explanation: "Genesis betekent 'oorsprong' of 'ontstaan' en beschrijft de schepping van de wereld.",
            bibleReference: "Genesis 1:1"
          },
          {
              text: "Wie versloeg de reus Goliath?",
              answers: [
                { text: "Saul", isCorrect: false },
                { text: "David", isCorrect: true },
                { text: "Simson", isCorrect: false },
                { text: "Salomo", isCorrect: false },
              ],
              explanation: "David, toen nog een jonge herder, versloeg Goliath met een slinger en een steen.",
              bibleReference: "1 Samuël 17:50"
          },
          {
              text: "Hoeveel discipelen had Jezus?",
              answers: [
                { text: "10", isCorrect: false },
                { text: "12", isCorrect: true },
                { text: "7", isCorrect: false },
                { text: "3", isCorrect: false },
              ]
          },
          {
              text: "In welke stad werd Jezus geboren?",
              answers: [
                { text: "Jeruzalem", isCorrect: false },
                { text: "Nazareth", isCorrect: false },
                { text: "Bethlehem", isCorrect: true },
                { text: "Jericho", isCorrect: false },
              ]
          }
        ]
      },
      {
        title: "Het Leven van Jezus",
        slug: "leven-van-jezus",
        description: "Weet jij alles over de wonderen en het leven van Jezus?",
        categoryId: getCatId("nieuwe-testament")!,
        difficulty: 'medium',
        isPremium: false,
        questions: [
          {
            text: "Wat was het eerste wonder van Jezus?",
            answers: [
              { text: "Water in wijn veranderen", isCorrect: true },
              { text: "Genezing van een blinde", isCorrect: false },
              { text: "Lopen op water", isCorrect: false },
              { text: "Opstanding van Lazarus", isCorrect: false },
            ]
          },
           {
            text: "Wie doopte Jezus?",
            answers: [
              { text: "Petrus", isCorrect: false },
              { text: "Johannes de Doper", isCorrect: true },
              { text: "Jacobus", isCorrect: false },
              { text: "Paulus", isCorrect: false },
            ]
          },
           {
            text: "Hoe lang vastte Jezus in de woestijn?",
            answers: [
              { text: "3 dagen", isCorrect: false },
              { text: "7 dagen", isCorrect: false },
              { text: "40 dagen", isCorrect: true },
              { text: "12 dagen", isCorrect: false },
            ]
          }
        ]
      },
      {
        title: "Diepgaande Romeinenbrief Studie",
        slug: "romeinen-studie",
        description: "Een uitdagende quiz voor de serieuze bijbelstudent over de Romeinenbrief.",
        categoryId: getCatId("studie")!,
        difficulty: 'hard',
        isPremium: true,
        questions: [
          {
            text: "Wie schreef de brief aan de Romeinen?",
            answers: [
              { text: "Petrus", isCorrect: false },
              { text: "Paulus", isCorrect: true },
              { text: "Johannes", isCorrect: false },
              { text: "Lukas", isCorrect: false },
            ]
          },
          {
            text: "Wat is het hoofdthema van Romeinen?",
            answers: [
              { text: "De eindtijd", isCorrect: false },
              { text: "Rechtvaardiging door geloof", isCorrect: true },
              { text: "De schepping", isCorrect: false },
              { text: "De bouw van de tempel", isCorrect: false },
            ]
          },
           {
            text: "In welk hoofdstuk staat 'Want allen hebben gezondigd en derven de heerlijkheid Gods'?",
            answers: [
              { text: "Romeinen 1", isCorrect: false },
              { text: "Romeinen 3", isCorrect: true },
              { text: "Romeinen 6", isCorrect: false },
              { text: "Romeinen 8", isCorrect: false },
            ]
          }
        ]
      }
    ];

    await Quiz.create(quizzes);

    return new NextResponse(`Seeded successfully: ${createdCategories.length} categories and ${quizzes.length} quizzes`, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse('Error seeding: ' + errorMessage, { status: 500 });
  }
}
