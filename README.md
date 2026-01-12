# BijbelQuiz - Online Bijbelkennis Platform

![BijbelQuiz Hero](https://placeholder-image-url.com-if-exists)

**BijbelQuiz** is een modern, interactief platform ontworpen om gelovigen en geïnteresseerden te helpen hun Bijbelkennis te testen en te verdiepen. Door middel van uitdagende quizzen in een klassieke, rustgevende omgeving kunnen gebruikers spelenderwijs leren over het Oude en Nieuwe Testament, theologie en Bijbelse geschiedenis.

Het platform is live te bezoeken op: [https://www.bijbelquiz.com](https://www.bijbelquiz.com)

## 🌟 Belangrijkste Functies

- **Interactieve Quizzen**: Een breed scala aan quizzen over diverse bijbelse onderwerpen.
- **Studie Modus (Premium)**: Directe feedback na elke vraag met diepgaande uitleg en bijschriften om direct van te leren.
- **Voortgangsmonitor**: Houdt bij welke quizzen zijn voltooid en wat de scores waren.
- **Premium Lidmaatschap**: Integratie met Stripe voor betalingen, waarmee exclusieve content wordt ontgrendeld.
- **Authenticatie**: Veilig inloggen via Google of e-mail (NextAuth).
- **Responsive Design**: Een prachtig 'papier/perkament' thema dat werkt op mobiel, tablet en desktop.

## 🛠️ Technologie Stack

Dit project is gebouwd met de nieuwste webtechnologieën voor snelheid, veiligheid en schaalbaarheid:

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router & Server Components)
- **Taal**: [TypeScript](https://www.typescriptlang.org/) voor robuuste type-safety.
- **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose) voor flexibele dataopslag.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) met een custom design systeem.
- **Authenticatie**: [NextAuth.js](https://next-auth.js.org/) (OAuth & Credentials).
- **Betalingen**: [Stripe](https://stripe.com/) Checkout & Webhooks.

## 🚀 Installatie & Lokaal Draaien

Wil je bijdragen of het project lokaal draaien? Volg deze stappen:

1.  **Clone de repository**
    ```bash
    git clone https://github.com/jouw-gebruikersnaam/bijbelquiz.git
    cd bijbelquiz
    ```

2.  **Installeer dependencies**
    ```bash
    npm install
    ```

3.  **Omgevingsvariabelen instellen**
    Maak een `.env.local` bestand aan in de root en vul de volgende waarden in:
    ```env
    MONGODB_URI=jouw_mongodb_connection_string
    NEXTAUTH_SECRET=jouw_geheime_key
    NEXTAUTH_URL=http://localhost:3000
    
    # Google OAuth
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...

    # Stripe
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
    ```

4.  **Ontwikkelserver starten**
    ```bash
    npm run dev
    ```
    De app is nu bereikbaar op `http://localhost:3000`.

## 💳 Stripe Webhook Testen (Lokaal)

Om betalingen lokaal te testen is de Stripe CLI nodig om events door te sturen:

1.  Login bij Stripe: `stripe login`
2.  Start de listener: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
3.  Gebruik de "Signing Secret" die de CLI toont als `STRIPE_WEBHOOK_SECRET` in je `.env.local`.

## 📂 Project Structuur

- `src/app`: Next.js App Router pagina's en API routes.
- `src/components`: Herbruikbare UI componenten (Navbar, QuizPlayer, Buttons).
- `src/lib`: Helper functies (db connectie, auth opties, stripe instance).
- `src/models`: Mongoose database schema's (User, Quiz, Payment).

## 📄 Licentie

Dit project is privé eigendom. Alle rechten voorbehouden.
