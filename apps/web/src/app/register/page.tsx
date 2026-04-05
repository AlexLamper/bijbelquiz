import { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Gratis Account Aanmaken | BijbelQuiz',
  description: 'Registreer je gratis bij BijbelQuiz. Houd je voortgang bij, verdien badges en leer meer over de Bijbel. Sluit je aan bij de community.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Start met BijbelQuiz - Maak een Account',
    description: 'Begin vandaag nog met het testen van je Bijbelkennis. Gratis aanmelden.',
    url: 'https://www.bijbelquiz.com/register',
  }
};

export default function RegisterPage() {
  return <RegisterForm />;
}
