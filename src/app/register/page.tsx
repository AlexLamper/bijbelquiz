import { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Registreren - BijbelQuiz',
  description: 'Maak een gratis account aan om je voortgang bij te houden.',
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
