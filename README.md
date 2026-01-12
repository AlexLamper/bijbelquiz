# BijbelQuiz App

Extreem snelle, eenvoudige webapp voor het online spelen van bijbelquizzen.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + ShadCN UI
- **Database**: MongoDB (Mongoose)
- **Auth**: NextAuth.js (Google Login)
- **Payments**: Stripe (Checkout)

## Installatie

1.  **Dependencies installeren**:
    ```bash
    npm install
    ```

2.  **Omgevingvariabelen instellen**:
    Maak een `.env.local` bestand aan op basis van `.env.local.example`.
    Vul de volgende gegevens in:
    - `MONGODB_URI`: Connectiestring naar je MongoDB database.
    - `GOOGLE_CLIENT_ID` & `SECRET`: Voor login functionaliteit.
    - `STRIPE_SECRET_KEY`: Voor betalingen.

    > **Tip**: Voor lokaal testen zonder Google keys, kun je de `src/lib/auth.ts` aanpassen of keys aanmaken in Google Cloud Console. Zonder DB connectie werkt de app niet.

3.  **Database vullen (Seeding)**:
    Start de dev server en bezoek de seed URL om dummy quizzen te laden.
    ```bash
    npm run dev
    ```
    Ga naar: `http://localhost:3000/api/seed`
    Je zou "Seeded successfully" moeten zien.

4.  **Applicatie starten**:
    ```bash
    npm run dev
    ```
    Ga naar `http://localhost:3000`.

## Features
- **Gratis spelen**: Direct toegang tot basisquizzen zonder login.
- **Premium**: Login vereist voor premium quizzen.
- **Betaling**: Stripe integratie voor upgrade.

## Winstmodel
- Gratis trekpleister (SEO).
- Conversie naar Premium (Stripe).
